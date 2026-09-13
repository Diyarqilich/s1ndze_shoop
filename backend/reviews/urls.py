from django.urls import path

from .views import ProductReviewListView, ReviewCreateView

urlpatterns = [
    path("", ReviewCreateView.as_view()),
    path("product/<slug:slug>/", ProductReviewListView.as_view()),
]
