from django.urls import path

from .views import (
    LoginView,
    LogoutView,
    MeView,
    ProfileUpdateView,
    RefreshView,
    RegisterView,
)

urlpatterns = [
    path("register/", RegisterView.as_view()),
    path("login/", LoginView.as_view()),
    path("refresh/", RefreshView.as_view()),
    path("logout/", LogoutView.as_view()),
    path("me/", MeView.as_view()),
    path("profile/", ProfileUpdateView.as_view()),
]
