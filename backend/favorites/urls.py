from django.urls import path

from .views import FavoriteDeleteView, FavoriteListCreateView

urlpatterns = [
    path("", FavoriteListCreateView.as_view()),
    path("<int:pk>/", FavoriteDeleteView.as_view()),
]
