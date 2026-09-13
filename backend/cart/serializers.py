from rest_framework import serializers

from products.models import ProductVariant
from products.serializers import ProductListSerializer

from .models import Cart, CartItem


class CartItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    variant_size = serializers.CharField(source="variant.size", read_only=True)
    variant_color = serializers.CharField(source="variant.color", read_only=True)
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = (
            "id",
            "product",
            "variant",
            "variant_size",
            "variant_color",
            "quantity",
            "price",
            "subtotal",
        )
        read_only_fields = ("price",)


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    items_count = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ("id", "items", "subtotal", "items_count", "updated_at")

    def get_items_count(self, obj):
        return sum(i.quantity for i in obj.items.all())


class AddCartItemSerializer(serializers.Serializer):
    variant_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1, default=1)

    def validate(self, attrs):
        try:
            variant = ProductVariant.objects.select_related("product").get(
                id=attrs["variant_id"]
            )
        except ProductVariant.DoesNotExist:
            raise serializers.ValidationError({"variant_id": "Variant not found"})
        if not variant.product.is_available:
            raise serializers.ValidationError("Product is not available")
        if variant.stock < attrs["quantity"]:
            raise serializers.ValidationError(
                {"quantity": f"Only {variant.stock} items in stock"}
            )
        attrs["variant"] = variant
        return attrs


class UpdateCartItemSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1)
