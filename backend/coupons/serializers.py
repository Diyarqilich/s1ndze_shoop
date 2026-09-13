from rest_framework import serializers

from .models import Coupon


class CouponValidateSerializer(serializers.Serializer):
    code = serializers.CharField()
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2)

    def validate(self, attrs):
        try:
            coupon = Coupon.objects.get(code__iexact=attrs["code"].strip())
        except Coupon.DoesNotExist:
            raise serializers.ValidationError({"code": "Invalid coupon"})
        ok, msg = coupon.is_valid(attrs["subtotal"])
        if not ok:
            raise serializers.ValidationError({"code": msg})
        attrs["coupon"] = coupon
        attrs["discount"] = coupon.calculate_discount(attrs["subtotal"])
        return attrs


class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = (
            "code",
            "discount_percent",
            "discount_amount",
            "minimum_order_amount",
            "end_date",
        )
