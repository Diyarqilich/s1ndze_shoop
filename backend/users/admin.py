from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import CustomUser


@admin.register(CustomUser)
class CustomUserAdmin(BaseUserAdmin):
    list_display = ("username", "email", "role", "phone_number", "is_staff", "created_at")
    list_filter = ("role", "is_staff", "is_superuser")
    search_fields = ("username", "email", "phone_number")
    ordering = ("-created_at",)
    fieldsets = BaseUserAdmin.fieldsets + (
        ("S1NDZE Profile", {"fields": ("role", "phone_number", "avatar", "bio")}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        (None, {"fields": ("email", "role", "phone_number")}),
    )
