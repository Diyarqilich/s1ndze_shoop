from django.db.models import F
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from users.permissions import CanCreateProduct, IsProductOwnerOrAdmin, IsSeller

from .filters import ProductFilter
from .models import Product, ProductImage, ProductVariant
from .serializers import (
    ProductDetailSerializer,
    ProductListSerializer,
    ProductWriteSerializer,
    annotate_products,
)


def favorited_context(request):
    """Serializer context so product cards know whether *this* user has
    already favorited each product — computed once per request/list rather
    than once per product to avoid an N+1 query."""
    ctx = {"request": request}
    if request.user.is_authenticated:
        ctx["favorited_ids"] = set(request.user.favorites.values_list("product_id", flat=True))
    return ctx


class ProductListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = ProductListSerializer
    filterset_class = ProductFilter

    def get_queryset(self):
        qs = (
            Product.objects.filter(is_available=True)
            .select_related("category", "seller")
            .prefetch_related("images", "variants")
        )
        return annotate_products(qs).distinct()

    def get_serializer_context(self):
        return favorited_context(self.request)


class ProductDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = ProductDetailSerializer
    lookup_field = "slug"

    def get_queryset(self):
        return annotate_products(
            Product.objects.select_related("category", "seller").prefetch_related(
                "images", "variants", "reviews"
            )
        )

    def get_serializer_context(self):
        return favorited_context(self.request)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        Product.objects.filter(pk=instance.pk).update(views_count=F("views_count") + 1)
        instance.refresh_from_db()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class RelatedProductsView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = ProductListSerializer
    pagination_class = None

    def get_queryset(self):
        slug = self.kwargs["slug"]
        try:
            product = Product.objects.get(slug=slug)
        except Product.DoesNotExist:
            return Product.objects.none()
        qs = (
            Product.objects.filter(is_available=True)
            .exclude(pk=product.pk)
            .filter(
                category=product.category
            )
            .select_related("category", "seller")
            .prefetch_related("images")[:8]
        )
        return annotate_products(qs)

    def get_serializer_context(self):
        return favorited_context(self.request)


class HomeSectionsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        base = annotate_products(
            Product.objects.filter(is_available=True)
            .select_related("category")
            .prefetch_related("images")
        )
        ctx = favorited_context(request)
        return Response(
            {
                "new_arrivals": ProductListSerializer(
                    base.filter(is_new=True)[:8], many=True, context=ctx
                ).data,
                "trending": ProductListSerializer(
                    base.order_by("-views_count")[:8], many=True, context=ctx
                ).data,
                "featured": ProductListSerializer(
                    base.filter(is_featured=True)[:8], many=True, context=ctx
                ).data,
                "sale": ProductListSerializer(
                    base.filter(is_sale=True)[:8], many=True, context=ctx
                ).data,
            }
        )


class SellerProductViewSet(viewsets.ModelViewSet):
    permission_classes = [IsSeller, IsProductOwnerOrAdmin]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        # Creating a listing is seller-only: an admin account can browse and
        # moderate (view/delete) the whole catalog through this viewset, but
        # must never be able to add a product itself.
        if self.action == "create":
            return [CanCreateProduct()]
        return super().get_permissions()

    def get_queryset(self):
        user = self.request.user
        qs = Product.objects.select_related("category").prefetch_related("images", "variants")
        if user.role == "admin" or user.is_superuser:
            return annotate_products(qs).order_by("-created_at")
        if self.action in (
            "update",
            "partial_update",
            "destroy",
            "retrieve",
            "upload_image",
            "add_variant",
            "delete_image",
        ):
            # Allow lookup so object-level permission can deny foreign sellers with 403
            return annotate_products(qs)
        return annotate_products(qs.filter(seller=user)).order_by("-created_at")

    def get_serializer_class(self):
        if self.action in ("list", "retrieve"):
            return ProductDetailSerializer
        return ProductWriteSerializer

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)

    def perform_update(self, serializer):
        product = self.get_object()
        if product.seller_id != self.request.user.id and not (
            self.request.user.role == "admin" or self.request.user.is_superuser
        ):
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied("You can only edit your own products.")
        serializer.save()

    @action(detail=True, methods=["post"], url_path="images")
    def upload_image(self, request, pk=None):
        product = self.get_object()
        image = request.FILES.get("image")
        if not image:
            return Response({"message": "image required"}, status=400)
        is_main = request.data.get("is_main", "false") in ("true", "True", True, "1")
        if is_main:
            product.images.update(is_main=False)
        img = ProductImage.objects.create(
            product=product, image=image, is_main=is_main or not product.images.exists()
        )
        return Response({"id": img.id, "image": request.build_absolute_uri(img.image.url)})

    @action(detail=True, methods=["delete"], url_path=r"images/(?P<image_id>\d+)")
    def delete_image(self, request, pk=None, image_id=None):
        product = self.get_object()
        # Query ProductImage directly rather than through product.images —
        # get_object()'s queryset prefetches images, and that cache would
        # otherwise still "see" the row we're about to delete below.
        deleted, _ = ProductImage.objects.filter(product=product, pk=image_id).delete()
        if not deleted:
            return Response({"message": "Image not found"}, status=404)
        remaining = ProductImage.objects.filter(product=product)
        if remaining.exists() and not remaining.filter(is_main=True).exists():
            first = remaining.first()
            first.is_main = True
            first.save(update_fields=["is_main"])
        return Response(status=204)

    @action(detail=True, methods=["post"], url_path="variants")
    def add_variant(self, request, pk=None):
        product = self.get_object()
        size = request.data.get("size", "M")
        color = request.data.get("color", "Black")
        stock = int(request.data.get("stock", 0))
        price = request.data.get("price")
        variant, _ = ProductVariant.objects.update_or_create(
            product=product,
            size=size,
            color=color,
            defaults={"stock": stock, "price": price or None},
        )
        return Response(
            {
                "id": variant.id,
                "size": variant.size,
                "color": variant.color,
                "stock": variant.stock,
            }
        )


class SellerStatsView(APIView):
    permission_classes = [IsSeller]

    def get(self, request):
        from decimal import Decimal

        from orders.models import OrderItem

        user = request.user
        products = Product.objects.filter(seller=user)
        items = OrderItem.objects.filter(seller=user).select_related("order")
        revenue = sum((i.subtotal for i in items if i.order.status != "cancelled"), Decimal("0"))
        order_ids = items.values_list("order_id", flat=True).distinct()
        from orders.models import Order

        orders = Order.objects.filter(id__in=order_ids)
        return Response(
            {
                "total_products": products.count(),
                "active_products": products.filter(is_available=True).count(),
                "total_orders": orders.count(),
                "pending_orders": orders.filter(status="pending").count(),
                "delivered_orders": orders.filter(status="delivered").count(),
                "revenue": revenue,
            }
        )
