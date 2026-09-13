from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from users.permissions import IsSeller

from .models import Order
from .serializers import OrderSerializer


class SellerOrdersView(APIView):
    permission_classes = [IsSeller]

    def get(self, request):
        orders = (
            Order.objects.filter(items__seller=request.user)
            .distinct()
            .prefetch_related("items")
            .order_by("-created_at")
        )
        return Response(OrderSerializer(orders, many=True).data)
