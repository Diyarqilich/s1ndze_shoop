from rest_framework import serializers

from .models import Category


class CategorySerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = (
            "id",
            "name",
            "slug",
            "image",
            "description",
            "parent",
            "children",
            "created_at",
        )

    def get_children(self, obj):
        if obj.parent_id is None:
            return CategorySerializer(obj.children.all(), many=True, context=self.context).data
        return []


class CategoryListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "slug", "image", "description", "parent", "created_at")
