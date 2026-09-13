from django.urls import path

from .views import CartClearView, CartItemAddView, CartItemDetailView, CartView

urlpatterns = [
    path("", CartView.as_view()),
    path("items/", CartItemAddView.as_view()),
    path("items/<int:pk>/", CartItemDetailView.as_view()),
    path("clear/", CartClearView.as_view()),
]
