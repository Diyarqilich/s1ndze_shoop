from rest_framework import generics, permissions

from .models import Category
from .serializers import CategoryListSerializer, CategorySerializer


class CategoryListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = CategorySerializer
    pagination_class = None

    def get_queryset(self):
        return Category.objects.filter(parent__isnull=True).prefetch_related("children")


class CategoryDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = CategorySerializer
    lookup_field = "slug"
    queryset = Category.objects.all().prefetch_related("children")


class CategoryFlatListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = CategoryListSerializer
    pagination_class = None
    queryset = Category.objects.all()
