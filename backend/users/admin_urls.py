from django.urls import path

from .admin_views import AdminStatsView, AdminUserDeleteView, AdminUserListView

urlpatterns = [
    path("stats/", AdminStatsView.as_view()),
    path("users/", AdminUserListView.as_view()),
    path("users/<int:pk>/", AdminUserDeleteView.as_view()),
]
