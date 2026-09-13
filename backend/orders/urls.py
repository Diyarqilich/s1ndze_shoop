from django.urls import path

from .views import CancelOrderView, CheckoutView, OrderDetailView, OrderListView

urlpatterns = [
    path("", OrderListView.as_view()),
    path("checkout/", CheckoutView.as_view()),
    path("<str:order_number>/", OrderDetailView.as_view()),
    path("<str:order_number>/cancel/", CancelOrderView.as_view()),
]
