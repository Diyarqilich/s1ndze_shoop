from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import SellerProductViewSet, SellerStatsView
from orders.seller_views import SellerOrdersView

router = DefaultRouter()
router.register("products", SellerProductViewSet, basename="seller-products")

urlpatterns = [
    path("stats/", SellerStatsView.as_view()),
    path("orders/", SellerOrdersView.as_view()),
    path("", include(router.urls)),
]
