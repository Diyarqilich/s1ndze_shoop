from rest_framework import serializers

from orders.models import Order, OrderItem

from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    product_slug = serializers.CharField(write_only=True)
    order_number = serializers.CharField(write_only=True)

    class Meta:
        model = Review
        fields = (
            "id",
            "product",
            "product_slug",
            "order",
            "order_number",
            "rating",
            "text",
            "username",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "product", "order", "created_at", "updated_at")

    def validate(self, attrs):
        from products.models import Product

        user = self.context["request"].user
        try:
            product = Product.objects.get(slug=attrs["product_slug"])
        except Product.DoesNotExist:
            raise serializers.ValidationError({"product_slug": "Product not found"})
        try:
            order = Order.objects.get(order_number=attrs["order_number"], user=user)
        except Order.DoesNotExist:
            raise serializers.ValidationError({"order_number": "Order not found"})

        if order.status != Order.Status.DELIVERED:
            raise serializers.ValidationError("You can only review after delivery")

        purchased = OrderItem.objects.filter(order=order, product=product).exists()
        if not purchased:
            raise serializers.ValidationError("You did not purchase this product")

        if Review.objects.filter(user=user, product=product, order=order).exists():
            raise serializers.ValidationError("You already reviewed this purchase")

        attrs["product"] = product
        attrs["order"] = order
        return attrs

    def create(self, validated_data):
        validated_data.pop("product_slug")
        validated_data.pop("order_number")
        return Review.objects.create(user=self.context["request"].user, **validated_data)
