from django.urls import path

from .views import HomeSectionsView, ProductDetailView, ProductListView, RelatedProductsView

urlpatterns = [
    path("", ProductListView.as_view()),
    path("home/", HomeSectionsView.as_view()),
    path("<slug:slug>/", ProductDetailView.as_view()),
    path("<slug:slug>/related/", RelatedProductsView.as_view()),
]
