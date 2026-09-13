from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import Avg
from django.utils.text import slugify


class Product(models.Model):
    class Gender(models.TextChoices):
        MEN = "men", "Men"
        WOMEN = "women", "Women"
        UNISEX = "unisex", "Unisex"
        KIDS = "kids", "Kids"

    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="products",
    )
    category = models.ForeignKey(
        "categories.Category",
        on_delete=models.PROTECT,
        related_name="products",
    )
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True)
    description = models.TextField()
    price = models.DecimalField(
        max_digits=12, decimal_places=2, validators=[MinValueValidator(0)]
    )
    old_price = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)]
    )
    brand = models.CharField(max_length=100, default="S1NDZE")
    gender = models.CharField(max_length=20, choices=Gender.choices, default=Gender.UNISEX)
    material = models.CharField(max_length=200, blank=True)
    is_available = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    is_new = models.BooleanField(default=True)
    is_sale = models.BooleanField(default=False)
    views_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["slug"]),
            models.Index(fields=["brand"]),
            models.Index(fields=["gender"]),
            models.Index(fields=["is_available", "is_sale", "is_new", "is_featured"]),
            models.Index(fields=["price"]),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.name) or "product"
            slug = base
            i = 1
            while Product.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base}-{i}"
                i += 1
            self.slug = slug
        if self.old_price and self.old_price > self.price:
            self.is_sale = True
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

    @property
    def discount_percent(self):
        if self.old_price and self.old_price > self.price:
            return int(round((1 - float(self.price) / float(self.old_price)) * 100))
        return 0

    @property
    def average_rating(self):
        result = self.reviews.aggregate(avg=Avg("rating"))
        return round(result["avg"] or 0, 1)

    @property
    def reviews_count(self):
        return self.reviews.count()

    @property
    def total_stock(self):
        return sum(v.stock for v in self.variants.all())

    @property
    def main_image(self):
        img = self.images.filter(is_main=True).first() or self.images.first()
        return img.image.url if img and img.image else None


class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="products/")
    is_main = models.BooleanField(default=False)
    ordering = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["ordering", "id"]

    def __str__(self):
        return f"{self.product.name} image"


class ProductVariant(models.Model):
    class Size(models.TextChoices):
        XS = "XS", "XS"
        S = "S", "S"
        M = "M", "M"
        L = "L", "L"
        XL = "XL", "XL"
        XXL = "XXL", "XXL"
        ONE = "ONE", "One Size"

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="variants")
    size = models.CharField(max_length=10, choices=Size.choices, default=Size.M)
    color = models.CharField(max_length=50)
    stock = models.PositiveIntegerField(default=0)
    price = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)]
    )

    class Meta:
        unique_together = ("product", "size", "color")
        ordering = ["size", "color"]

    def __str__(self):
        return f"{self.product.name} / {self.size} / {self.color}"

    @property
    def effective_price(self):
        return self.price if self.price is not None else self.product.price
