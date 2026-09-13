from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Cart, CartItem
from .serializers import (
    AddCartItemSerializer,
    CartSerializer,
    UpdateCartItemSerializer,
)


def get_or_create_cart(user):
    cart, _ = Cart.objects.get_or_create(user=user)
    return cart


class CartView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        cart = get_or_create_cart(request.user)
        cart = Cart.objects.prefetch_related(
            "items__product__images", "items__product__category", "items__variant"
        ).get(pk=cart.pk)
        return Response(CartSerializer(cart, context={"request": request}).data)


class CartItemAddView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = AddCartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        variant = serializer.validated_data["variant"]
        quantity = serializer.validated_data["quantity"]
        cart = get_or_create_cart(request.user)
        item, created = CartItem.objects.get_or_create(
            cart=cart,
            variant=variant,
            defaults={
                "product": variant.product,
                "quantity": quantity,
                "price": variant.effective_price,
            },
        )
        if not created:
            new_qty = item.quantity + quantity
            if new_qty > variant.stock:
                return Response(
                    {"message": f"Only {variant.stock} items in stock"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            item.quantity = new_qty
            item.save()
        cart = Cart.objects.prefetch_related(
            "items__product__images", "items__variant"
        ).get(pk=cart.pk)
        return Response(
            CartSerializer(cart, context={"request": request}).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class CartItemDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        serializer = UpdateCartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            item = CartItem.objects.select_related("variant", "cart").get(
                pk=pk, cart__user=request.user
            )
        except CartItem.DoesNotExist:
            return Response({"message": "Not found"}, status=404)
        qty = serializer.validated_data["quantity"]
        if qty > item.variant.stock:
            return Response(
                {"message": f"Only {item.variant.stock} in stock"},
                status=400,
            )
        item.quantity = qty
        item.save()
        cart = Cart.objects.prefetch_related(
            "items__product__images", "items__variant"
        ).get(pk=item.cart_id)
        return Response(CartSerializer(cart, context={"request": request}).data)

    def delete(self, request, pk):
        deleted, _ = CartItem.objects.filter(pk=pk, cart__user=request.user).delete()
        if not deleted:
            return Response({"message": "Not found"}, status=404)
        cart = get_or_create_cart(request.user)
        cart = Cart.objects.prefetch_related(
            "items__product__images", "items__variant"
        ).get(pk=cart.pk)
        return Response(CartSerializer(cart, context={"request": request}).data)


class CartClearView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        cart = get_or_create_cart(request.user)
        cart.items.all().delete()
        return Response(CartSerializer(cart, context={"request": request}).data)
