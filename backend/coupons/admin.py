from django.contrib import admin

from .models import Coupon


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = (
        "code",
        "discount_percent",
        "discount_amount",
        "used_count",
        "max_uses",
        "is_active",
        "start_date",
        "end_date",
    )
    list_filter = ("is_active",)
    search_fields = ("code",)
