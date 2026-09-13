import django_filters
from django.db.models import F, Q

from .models import Product


class ProductFilter(django_filters.FilterSet):
    search = django_filters.CharFilter(method="filter_search")
    category = django_filters.CharFilter(method="filter_category")
    brand = django_filters.CharFilter(field_name="brand", lookup_expr="iexact")
    gender = django_filters.CharFilter(field_name="gender")
    size = django_filters.CharFilter(field_name="variants__size")
    color = django_filters.CharFilter(field_name="variants__color", lookup_expr="iexact")
    min_price = django_filters.NumberFilter(field_name="price", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="price", lookup_expr="lte")
    availability = django_filters.BooleanFilter(field_name="is_available")
    sale = django_filters.BooleanFilter(field_name="is_sale")
    new = django_filters.BooleanFilter(field_name="is_new")
    featured = django_filters.BooleanFilter(field_name="is_featured")
    ordering = django_filters.CharFilter(method="filter_ordering")

    class Meta:
        model = Product
        fields = []

    def filter_search(self, queryset, name, value):
        return queryset.filter(
            Q(name__icontains=value)
            | Q(description__icontains=value)
            | Q(brand__icontains=value)
        )

    def filter_category(self, queryset, name, value):
        return queryset.filter(Q(category__slug=value) | Q(category__parent__slug=value))

    def filter_ordering(self, queryset, name, value):
        mapping = {
            "newest": "-created_at",
            "oldest": "created_at",
            "price_asc": "price",
            "price_desc": "-price",
            "popular": "-views_count",
            "discount": "-old_price",
        }
        order = mapping.get(value, "-created_at")
        if value == "discount":
            return queryset.filter(old_price__gt=F("price")).order_by("-old_price")
        return queryset.order_by(order)
