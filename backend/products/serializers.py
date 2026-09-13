from django.db.models import Avg, Count, Q, Sum
from rest_framework import serializers

from .models import Product, ProductImage, ProductVariant


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ("id", "image", "is_main", "ordering")


class ProductVariantSerializer(serializers.ModelSerializer):
    effective_price = serializers.SerializerMethodField()

    class Meta:
        model = ProductVariant
        fields = ("id", "size", "color", "stock", "price", "effective_price")

    def get_effective_price(self, obj):
        return obj.effective_price


class ProductListSerializer(serializers.ModelSerializer):
    main_image = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    reviews_count = serializers.SerializerMethodField()
    discount_percent = serializers.SerializerMethodField()
    category_name = serializers.CharField(source="category.name", read_only=True)
    total_stock = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            "id",
            "name",
            "slug",
            "brand",
            "price",
            "old_price",
            "gender",
            "is_available",
            "is_featured",
            "is_new",
            "is_sale",
            "views_count",
            "main_image",
            "average_rating",
            "reviews_count",
            "discount_percent",
            "category",
            "category_name",
            "total_stock",
            "created_at",
        )

    def get_main_image(self, obj):
        request = self.context.get("request")
        images = list(obj.images.all()) if hasattr(obj, "images") else []
        img = next((i for i in images if i.is_main), None) or (images[0] if images else None)
        if img and img.image:
            url = img.image.url
            return request.build_absolute_uri(url) if request else url
        return None

    def get_average_rating(self, obj):
        if hasattr(obj, "avg_rating") and obj.avg_rating is not None:
            return round(float(obj.avg_rating), 1)
        return obj.average_rating

    def get_reviews_count(self, obj):
        if hasattr(obj, "rev_count") and obj.rev_count is not None:
            return int(obj.rev_count)
        return obj.reviews_count

    def get_discount_percent(self, obj):
        return obj.discount_percent

    def get_total_stock(self, obj):
        if hasattr(obj, "total_stock_sum") and obj.total_stock_sum is not None:
            return int(obj.total_stock_sum)
        return obj.total_stock


class ProductDetailSerializer(ProductListSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    seller_username = serializers.CharField(source="seller.username", read_only=True)

    class Meta(ProductListSerializer.Meta):
        fields = ProductListSerializer.Meta.fields + (
            "description",
            "material",
            "images",
            "variants",
            "seller",
            "seller_username",
            "updated_at",
        )


class ProductWriteSerializer(serializers.ModelSerializer):
    variants = ProductVariantSerializer(many=True, required=False)

    class Meta:
        model = Product
        fields = (
            "id",
            "category",
            "name",
            "description",
            "price",
            "old_price",
            "brand",
            "gender",
            "material",
            "is_available",
            "is_featured",
            "is_new",
            "is_sale",
            "variants",
        )

    def create(self, validated_data):
        variants_data = validated_data.pop("variants", [])
        product = Product.objects.create(**validated_data)
        for v in variants_data:
            ProductVariant.objects.create(product=product, **v)
        return product

    def update(self, instance, validated_data):
        variants_data = validated_data.pop("variants", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if variants_data is not None:
            instance.variants.all().delete()
            for v in variants_data:
                ProductVariant.objects.create(product=instance, **v)
        return instance


def annotate_products(qs):
    return qs.annotate(
        avg_rating=Avg("reviews__rating"),
        rev_count=Count("reviews", distinct=True),
        total_stock_sum=Sum("variants__stock"),
    )
