from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta
import uuid

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
        self.admin = User.objects.create_user(
            username="admin1",
            email="a1@test.com",
            password="pass12345",
            role="admin",
            is_staff=True,
            is_superuser=True,
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

    def test_admin_cannot_create_product(self):
        self.client.force_authenticate(self.admin)
        r = self.client.post(
            "/api/seller/products/",
            {
                "category": self.cat.id,
                "name": "Admin product",
                "description": "x",
                "price": "1000",
            },
            format="json",
        )
        self.assertEqual(r.status_code, 403)

    def test_admin_can_view_and_delete_but_not_create(self):
        self.client.force_authenticate(self.admin)
        # Moderation: admin sees the whole catalog, not just their own (they
        # have none) products.
        r = self.client.get("/api/seller/products/")
        self.assertEqual(r.status_code, 200)
        ids = [p["id"] for p in r.data] if isinstance(r.data, list) else [
            p["id"] for p in r.data["results"]
        ]
        self.assertIn(self.product.id, ids)
        # Moderation delete stays available to admins.
        r = self.client.delete(f"/api/seller/products/{self.product.id}/")
        self.assertEqual(r.status_code, 204)
        self.assertFalse(Product.objects.filter(pk=self.product.id).exists())

    def test_seller_can_create_product(self):
        self.client.force_authenticate(self.seller)
        r = self.client.post(
            "/api/seller/products/",
            {
                "category": self.cat.id,
                "name": "New Drop",
                "description": "x",
                "price": "150000",
                "variants": [{"size": "M", "color": "Black", "stock": 5}],
            },
            format="json",
        )
        self.assertEqual(r.status_code, 201, r.data)

    def test_sellers_new_product_appears_first_in_their_own_list(self):
        # A product list left unordered after annotate() can paginate
        # unpredictably — a seller's freshly created listing must show up
        # on page 1 of their own dashboard, not wherever the DB felt like
        # putting it.
        self.client.force_authenticate(self.seller)
        r = self.client.post(
            "/api/seller/products/",
            {
                "category": self.cat.id,
                "name": "Brand New Drop",
                "description": "x",
                "price": "150000",
                "variants": [{"size": "M", "color": "Black", "stock": 5}],
            },
            format="json",
        )
        self.assertEqual(r.status_code, 201, r.data)
        new_id = r.data["id"]
        r = self.client.get("/api/seller/products/")
        self.assertEqual(r.status_code, 200)
        results = r.data if isinstance(r.data, list) else r.data["results"]
        self.assertEqual(results[0]["id"], new_id)

    def test_seller_can_delete_own_product_image(self):
        from products.models import ProductImage
        from django.core.files.uploadedfile import SimpleUploadedFile

        image = ProductImage.objects.create(
            product=self.product,
            image=SimpleUploadedFile("test.jpg", b"filecontent", content_type="image/jpeg"),
            is_main=True,
        )
        self.client.force_authenticate(self.seller)
        r = self.client.delete(f"/api/seller/products/{self.product.id}/images/{image.id}/")
        self.assertEqual(r.status_code, 204)
        self.assertFalse(ProductImage.objects.filter(pk=image.id).exists())

    def test_seller2_cannot_delete_other_sellers_image(self):
        from products.models import ProductImage
        from django.core.files.uploadedfile import SimpleUploadedFile

        image = ProductImage.objects.create(
            product=self.product,
            image=SimpleUploadedFile("test.jpg", b"filecontent", content_type="image/jpeg"),
            is_main=True,
        )
        self.client.force_authenticate(self.seller2)
        r = self.client.delete(f"/api/seller/products/{self.product.id}/images/{image.id}/")
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

    def test_order_number_is_short_and_sequential(self):
        import re

        self.client.force_authenticate(self.buyer)
        self.client.post(
            "/api/cart/items/",
            {"variant_id": self.variant.id, "quantity": 1},
            format="json",
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
            },
            format="json",
        )
        self.assertEqual(r.status_code, 201, r.data)
        self.assertRegex(r.data["order_number"], r"^S1N-\d{6}$")

    def test_order_number_placeholder_fits_field_max_length(self):
        # SQLite (used in local/dev testing) does not enforce CharField
        # max_length at the database level, so an oversized value here
        # would pass every test above and still work locally — it broke
        # only in production (PostgreSQL, which does enforce it) the first
        # time this shipped. Checking against the field's own validator
        # catches that class of bug on any backend, including this one.
        from django.core.validators import MaxLengthValidator

        from orders.models import Order

        field = Order._meta.get_field("order_number")
        placeholder = f"S1N-TMP-{uuid.uuid4().hex[:20]}"
        MaxLengthValidator(field.max_length)(placeholder)

    def test_favorite_toggle_and_is_favorited_flag(self):
        self.client.force_authenticate(self.buyer)

        r = self.client.get(f"/api/products/{self.product.slug}/")
        self.assertEqual(r.status_code, 200)
        self.assertFalse(r.data["is_favorited"])

        r = self.client.post("/api/favorites/", {"product_id": self.product.id}, format="json")
        self.assertEqual(r.status_code, 201)
        fav_id = r.data["id"]

        r = self.client.get(f"/api/products/{self.product.slug}/")
        self.assertTrue(r.data["is_favorited"])

        r = self.client.delete(f"/api/favorites/{fav_id}/")
        self.assertEqual(r.status_code, 204)

        r = self.client.get(f"/api/products/{self.product.slug}/")
        self.assertFalse(r.data["is_favorited"])

    def test_favorite_remove_by_product_id(self):
        self.client.force_authenticate(self.buyer)
        self.client.post("/api/favorites/", {"product_id": self.product.id}, format="json")
        r = self.client.delete(f"/api/favorites/0/?product_id={self.product.id}")
        self.assertEqual(r.status_code, 204)

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


class SeedShopDemoAccountsTests(TestCase):
    """The README promises admin/s1ndze/buyer demo logins after `seed_shop`
    — make sure the command actually leaves them able to log in. (It once
    didn't: has_usable_password() can read a freshly-created, still-blank
    password field as "usable" and skip setting a real one.)
    """

    def test_seeded_accounts_can_log_in(self):
        from django.core.management import call_command

        call_command("seed_shop", verbosity=0)
        client = APIClient()
        for username, password in (
            ("admin", "admin12345"),
            ("s1ndze", "seller12345"),
            ("buyer", "buyer12345"),
        ):
            r = client.post(
                "/api/auth/login/",
                {"username": username, "password": password},
                format="json",
            )
            self.assertEqual(r.status_code, 200, f"{username} could not log in: {r.data}")
            self.assertIn("access", r.data)
