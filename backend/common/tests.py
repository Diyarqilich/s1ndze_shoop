from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta

from categories.models import Category
from products.models import Product, ProductVariant
from coupons.models import Coupon

User = get_user_model()


class AuthAndPermissionsTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.cat = Category.objects.create(name="Men", slug="men")
        self.seller = User.objects.create_user(
            username="seller1", email="s1@test.com", password="pass12345", role="seller"
        )
        self.seller2 = User.objects.create_user(
            username="seller2", email="s2@test.com", password="pass12345", role="seller"
        )
        self.buyer = User.objects.create_user(
            username="buyer1", email="b1@test.com", password="pass12345", role="buyer"
        )
        self.product = Product.objects.create(
            seller=self.seller,
            category=self.cat,
            name="Test Tee",
            slug="test-tee",
            description="desc",
            price=Decimal("100000"),
        )
        self.variant = ProductVariant.objects.create(
            product=self.product, size="M", color="Black", stock=5
        )

    def test_register_login(self):
        r = self.client.post(
            "/api/auth/register/",
            {
                "username": "newuser",
                "email": "new@test.com",
                "password": "pass12345",
                "password_confirm": "pass12345",
            },
            format="json",
        )
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        self.assertIn("access", r.data)

        r = self.client.post(
            "/api/auth/login/",
            {"username": "newuser", "password": "pass12345"},
            format="json",
        )
        self.assertEqual(r.status_code, 200)
        self.assertIn("access", r.data)

    def test_buyer_cannot_create_product(self):
        self.client.force_authenticate(self.buyer)
        r = self.client.post(
            "/api/seller/products/",
            {
                "category": self.cat.id,
                "name": "Hacked",
                "description": "x",
                "price": "1000",
            },
            format="json",
        )
        self.assertIn(r.status_code, (403, 401))

    def test_seller_cannot_edit_other_product(self):
        self.client.force_authenticate(self.seller2)
        r = self.client.patch(
            f"/api/seller/products/{self.product.id}/",
            {"name": "Stolen"},
            format="json",
        )
        self.assertEqual(r.status_code, 403)

    def test_cart_and_checkout(self):
        self.client.force_authenticate(self.buyer)
        r = self.client.post(
            "/api/cart/items/",
            {"variant_id": self.variant.id, "quantity": 2},
            format="json",
        )
        self.assertIn(r.status_code, (200, 201))

        Coupon.objects.create(
            code="S1NDZE10",
            discount_percent=10,
            start_date=timezone.now() - timedelta(days=1),
            end_date=timezone.now() + timedelta(days=30),
            minimum_order_amount=0,
            max_uses=10,
        )
        r = self.client.post(
            "/api/orders/checkout/",
            {
                "first_name": "A",
                "last_name": "B",
                "phone": "+998901112233",
                "city": "Tashkent",
                "address": "Street 1",
                "payment_method": "cash",
                "coupon_code": "S1NDZE10",
            },
            format="json",
        )
        self.assertEqual(r.status_code, 201)
        self.assertTrue(r.data["order_number"].startswith("S1N-"))
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.stock, 3)

    def test_cannot_review_without_purchase(self):
        self.client.force_authenticate(self.buyer)
        r = self.client.post(
            "/api/reviews/",
            {
                "product_slug": "test-tee",
                "order_number": "FAKE",
                "rating": 5,
                "text": "nice",
            },
            format="json",
        )
        self.assertEqual(r.status_code, 400)
