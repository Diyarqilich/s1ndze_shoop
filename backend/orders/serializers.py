from decimal import Decimal

from django.conf import settings
from rest_framework import serializers

from coupons.models import Coupon

from .models import Order, OrderItem
from .payments import PaymentGateway


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = (
            "id",
            "product",
            "variant",
            "product_name",
            "size",
            "color",
            "price",
            "quantity",
            "subtotal",
            "seller",
        )


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = (
            "id",
            "order_number",
            "total_price",
            "subtotal",
            "discount",
            "delivery_price",
            "payment_method",
            "status",
            "first_name",
            "last_name",
            "phone",
            "city",
            "address",
            "comment",
            "coupon",
            "items",
            "created_at",
            "updated_at",
        )


class CheckoutSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    phone = serializers.CharField(max_length=20)
    city = serializers.CharField(max_length=100)
    address = serializers.CharField(max_length=255)
    comment = serializers.CharField(required=False, allow_blank=True, default="")
    payment_method = serializers.ChoiceField(choices=Order.PaymentMethod.choices)
    coupon_code = serializers.CharField(required=False, allow_blank=True, default="")

    def validate_payment_method(self, value):
        if not PaymentGateway.is_supported(value):
            raise serializers.ValidationError("Unsupported payment method")
        return value

    def create(self, validated_data):
        from django.db import transaction

        from cart.models import Cart

        user = self.context["request"].user
        coupon_code = validated_data.pop("coupon_code", "").strip().upper()

        with transaction.atomic():
            cart = (
                Cart.objects.select_for_update()
                .prefetch_related("items__variant", "items__product")
                .filter(user=user)
                .first()
            )
            if not cart or not cart.items.exists():
                raise serializers.ValidationError({"cart": "Cart is empty"})

            subtotal = Decimal("0")
            line_items = []
            for item in cart.items.select_related("variant", "product", "product__seller"):
                variant = item.variant
                product = item.product
                if not product.is_available:
                    raise serializers.ValidationError(
                        {"cart": f"{product.name} is unavailable"}
                    )
                if variant.stock < item.quantity:
                    raise serializers.ValidationError(
                        {"cart": f"Not enough stock for {product.name} ({variant.size}/{variant.color})"}
                    )
                price = variant.effective_price
                line_subtotal = price * item.quantity
                subtotal += line_subtotal
                line_items.append((item, price, line_subtotal))

            discount = Decimal("0")
            coupon = None
            if coupon_code:
                try:
                    coupon = Coupon.objects.get(code__iexact=coupon_code)
                except Coupon.DoesNotExist:
                    raise serializers.ValidationError({"coupon_code": "Invalid coupon"})
                ok, msg = coupon.is_valid(subtotal)
                if not ok:
                    raise serializers.ValidationError({"coupon_code": msg})
                discount = coupon.calculate_discount(subtotal)

            delivery = Decimal(str(settings.DELIVERY_PRICE))
            if (subtotal - discount) >= Decimal(str(settings.FREE_DELIVERY_THRESHOLD)):
                delivery = Decimal("0")

            total = subtotal - discount + delivery
            if total < 0:
                total = Decimal("0")

            order = Order.objects.create(
                user=user,
                total_price=total,
                subtotal=subtotal,
                discount=discount,
                delivery_price=delivery,
                payment_method=validated_data["payment_method"],
                first_name=validated_data["first_name"],
                last_name=validated_data["last_name"],
                phone=validated_data["phone"],
                city=validated_data["city"],
                address=validated_data["address"],
                comment=validated_data.get("comment", ""),
                coupon=coupon,
                status=Order.Status.PENDING,
            )

            for item, price, line_subtotal in line_items:
                OrderItem.objects.create(
                    order=order,
                    product=item.product,
                    variant=item.variant,
                    product_name=item.product.name,
                    size=item.variant.size,
                    color=item.variant.color,
                    price=price,
                    quantity=item.quantity,
                    subtotal=line_subtotal,
                    seller=item.product.seller,
                )
                item.variant.stock -= item.quantity
                item.variant.save(update_fields=["stock"])

            if coupon:
                coupon.used_count += 1
                coupon.save(update_fields=["used_count"])

            cart.items.all().delete()

            # Payment abstraction (cash = COD, others = pending external)
            PaymentGateway.initiate(order)

            from notifications.services import notify_order_created

            notify_order_created(order)

            return order
