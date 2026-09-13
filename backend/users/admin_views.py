from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db.models import Sum
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .permissions import IsAdminRole
from .serializers import UserSerializer

User = get_user_model()


class AdminUserListView(generics.ListAPIView):
    """Admin-only: list every registered user (buyers, sellers, admins)."""

    permission_classes = [IsAdminRole]
    serializer_class = UserSerializer
    pagination_class = None

    def get_queryset(self):
        return User.objects.all().order_by("-created_at")


class AdminUserDeleteView(generics.DestroyAPIView):
    """Admin-only: delete any user account. Admins cannot delete themselves,
    which would otherwise lock them out of the admin panel."""

    permission_classes = [IsAdminRole]
    queryset = User.objects.all()

    def delete(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.id == request.user.id:
            return Response(
                {"message": "You cannot delete your own account."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().delete(request, *args, **kwargs)


class AdminStatsView(APIView):
    """Admin-only: site-wide overview used by the admin dashboard."""

    permission_classes = [IsAdminRole]

    def get(self, request):
        from orders.models import Order
        from products.models import Product

        orders = Order.objects.exclude(status=Order.Status.CANCELLED)
        revenue = orders.aggregate(total=Sum("total_price"))["total"] or Decimal("0")

        return Response(
            {
                "total_users": User.objects.count(),
                "total_buyers": User.objects.filter(role=User.Role.BUYER).count(),
                "total_sellers": User.objects.filter(role=User.Role.SELLER).count(),
                "total_admins": User.objects.filter(role=User.Role.ADMIN).count(),
                "total_products": Product.objects.count(),
                "available_products": Product.objects.filter(is_available=True).count(),
                "total_orders": Order.objects.count(),
                "pending_orders": Order.objects.filter(status=Order.Status.PENDING).count(),
                "total_revenue": revenue,
            }
        )
