from django.db.models import F
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from users.permissions import IsProductOwnerOrAdmin, IsSeller

from .filters import ProductFilter
from .models import Product, ProductImage, ProductVariant
from .serializers import (
    ProductDetailSerializer,
    ProductListSerializer,
    ProductWriteSerializer,
    annotate_products,
)


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


class HomeSectionsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        base = annotate_products(
            Product.objects.filter(is_available=True)
            .select_related("category")
            .prefetch_related("images")
        )
        ctx = {"request": request}
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

    def get_queryset(self):
        user = self.request.user
        qs = Product.objects.select_related("category").prefetch_related("images", "variants")
        if user.role == "admin" or user.is_superuser:
            return annotate_products(qs)
        if self.action in ("update", "partial_update", "destroy", "retrieve"):
            # Allow lookup so object-level permission can deny foreign sellers with 403
            return annotate_products(qs)
        return annotate_products(qs.filter(seller=user))

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
