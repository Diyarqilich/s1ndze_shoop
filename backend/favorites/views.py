from rest_framework import generics, permissions, status
from rest_framework.response import Response

from products.models import Product

from .models import Favorite
from .serializers import FavoriteSerializer


class FavoriteListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = FavoriteSerializer

    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user).select_related(
            "product", "product__category"
        ).prefetch_related("product__images")

    def get_serializer_context(self):
        context = super().get_serializer_context()
        # Every product on this page is, by definition, one the user has
        # favorited — precompute the id set once so the nested product
        # serializer's is_favorited field doesn't run one query per row.
        context["favorited_ids"] = set(
            self.request.user.favorites.values_list("product_id", flat=True)
        )
        return context

    def create(self, request, *args, **kwargs):
        product_id = request.data.get("product_id")
        try:
            product = Product.objects.get(pk=product_id)
        except Product.DoesNotExist:
            return Response({"message": "Product not found"}, status=404)
        fav, created = Favorite.objects.get_or_create(user=request.user, product=product)
        if not created:
            return Response({"message": "Already in favorites"}, status=status.HTTP_409_CONFLICT)
        return Response(
            FavoriteSerializer(fav, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class FavoriteDeleteView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "pk"

    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user)

    def destroy(self, request, *args, **kwargs):
        # Also allow delete by product_id query
        product_id = request.query_params.get("product_id")
        if product_id:
            deleted, _ = Favorite.objects.filter(
                user=request.user, product_id=product_id
            ).delete()
            if deleted:
                return Response(status=status.HTTP_204_NO_CONTENT)
            return Response({"message": "Not found"}, status=404)
        return super().destroy(request, *args, **kwargs)
