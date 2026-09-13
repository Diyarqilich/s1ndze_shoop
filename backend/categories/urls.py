from django.urls import path

from .views import CategoryDetailView, CategoryFlatListView, CategoryListView

urlpatterns = [
    path("", CategoryListView.as_view()),
    path("flat/", CategoryFlatListView.as_view()),
    path("<slug:slug>/", CategoryDetailView.as_view()),
]
