from django.contrib import admin

from .models import Product, ProductImage, ProductVariant


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 1


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "brand",
        "seller",
        "category",
        "price",
        "is_available",
        "is_featured",
        "is_new",
        "is_sale",
        "views_count",
        "created_at",
    )
    list_filter = ("is_available", "is_featured", "is_new", "is_sale", "gender", "brand")
    search_fields = ("name", "slug", "brand", "seller__username")
    prepopulated_fields = {"slug": ("name",)}
    inlines = [ProductImageInline, ProductVariantInline]
    readonly_fields = ("views_count", "created_at", "updated_at")


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ("product", "is_main", "ordering")
    list_filter = ("is_main",)


@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = ("product", "size", "color", "stock", "price")
    list_filter = ("size", "color")
    search_fields = ("product__name", "color")
