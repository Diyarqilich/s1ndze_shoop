from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import CouponSerializer, CouponValidateSerializer


class ValidateCouponView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = CouponValidateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        coupon = serializer.validated_data["coupon"]
        return Response(
            {
                "valid": True,
                "discount": serializer.validated_data["discount"],
                "coupon": CouponSerializer(coupon).data,
            }
        )
