from decimal import Decimal
from datetime import timedelta
from io import BytesIO
from pathlib import Path

from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.utils.text import slugify
from PIL import Image, ImageDraw, ImageFont

from categories.models import Category
from coupons.models import Coupon
from products.models import Product, ProductImage, ProductVariant

User = get_user_model()

# Streetwear accent — matches S1NDZE logo pink
ACCENT = (233, 30, 140)
BLACK = (12, 12, 12)
WHITE = (250, 250, 250)
GRAY = (40, 40, 40)


def make_product_image(title: str, color_rgb, subtitle="S1NDZE"):
    img = Image.new("RGB", (800, 1000), WHITE)
    draw = ImageDraw.Draw(img)
    # Urban frame
    draw.rectangle([40, 40, 760, 960], outline=BLACK, width=4)
    draw.rectangle([0, 0, 800, 120], fill=BLACK)
    draw.rectangle([0, 880, 800, 1000], fill=color_rgb)
    try:
        font_lg = ImageFont.truetype("arial.ttf", 48)
        font_sm = ImageFont.truetype("arial.ttf", 28)
    except OSError:
        font_lg = ImageFont.load_default()
        font_sm = ImageFont.load_default()
    draw.text((60, 40), "S1NDZE", fill=ACCENT, font=font_lg)
    draw.text((60, 420), title.upper(), fill=BLACK, font=font_lg)
    draw.text((60, 500), subtitle, fill=GRAY, font=font_sm)
    draw.text((60, 910), "WEAR YOUR STYLE", fill=WHITE, font=font_sm)
    buf = BytesIO()
    img.save(buf, format="JPEG", quality=88)
    return ContentFile(buf.getvalue(), name=f"{slugify(title)}.jpg")


class Command(BaseCommand):
    help = "Seed S1NDZE SHOP demo catalog, users, and coupon"

    def handle(self, *args, **options):
        seller, _ = User.objects.get_or_create(
            username="s1ndze",
            defaults={
                "email": "seller@s1ndze.shop",
                "role": User.Role.SELLER,
                "first_name": "S1NDZE",
                "last_name": "Official",
            },
        )
        if not seller.has_usable_password():
            seller.set_password("seller12345")
            seller.save()

        buyer, _ = User.objects.get_or_create(
            username="buyer",
            defaults={
                "email": "buyer@s1ndze.shop",
                "role": User.Role.BUYER,
                "first_name": "Demo",
                "last_name": "Buyer",
            },
        )
        if not buyer.has_usable_password():
            buyer.set_password("buyer12345")
            buyer.save()

        admin, created = User.objects.get_or_create(
            username="admin",
            defaults={
                "email": "admin@s1ndze.shop",
                "role": User.Role.ADMIN,
                "is_staff": True,
                "is_superuser": True,
            },
        )
        if created or not admin.has_usable_password():
            admin.set_password("admin12345")
            admin.is_staff = True
            admin.is_superuser = True
            admin.role = User.Role.ADMIN
            admin.save()

        mains = [
            ("Men", "men", "Street essentials for him"),
            ("Women", "women", "Bold fits for her"),
            ("Kids", "kids", "Mini street energy"),
            ("Shoes", "shoes", "Kicks that move"),
            ("Accessories", "accessories", "Caps, bags & more"),
        ]
        main_map = {}
        for name, slug, desc in mains:
            cat, _ = Category.objects.get_or_create(
                slug=slug, defaults={"name": name, "description": desc}
            )
            main_map[slug] = cat

        subs = [
            ("T-Shirts", "t-shirts", "men"),
            ("Hoodies", "hoodies", "men"),
            ("Sweatshirts", "sweatshirts", "men"),
            ("Shirts", "shirts", "men"),
            ("Pants", "pants", "men"),
            ("Jeans", "jeans", "men"),
            ("Jackets", "jackets", "men"),
            ("Coats", "coats", "women"),
            ("Sneakers", "sneakers", "shoes"),
            ("Bags", "bags", "accessories"),
            ("Caps", "caps", "accessories"),
            ("Accessories", "accessories-misc", "accessories"),
        ]
        sub_map = {}
        for name, slug, parent in subs:
            cat, _ = Category.objects.get_or_create(
                slug=slug,
                defaults={"name": name, "parent": main_map[parent], "description": name},
            )
            sub_map[slug] = cat

        catalog = [
            ("Echo Tag Tee", "t-shirts", 189000, 249000, "men", True, True, False, "100% cotton"),
            ("Neon Drip Hoodie", "hoodies", 399000, 499000, "unisex", True, True, True, "Fleece cotton"),
            ("Void Sweatshirt", "sweatshirts", 329000, None, "men", True, False, True, "Cotton blend"),
            ("Grid Cargo Pants", "pants", 459000, 529000, "men", False, True, True, "Ripstop"),
            ("Pink Pulse Cap", "caps", 129000, None, "unisex", True, False, True, "Twill"),
            ("Shadow Jacket", "jackets", 689000, 799000, "men", False, True, True, "Nylon"),
            ("City Runner Sneaker", "sneakers", 799000, 899000, "unisex", True, True, True, "Mesh & rubber"),
            ("S1 Crossbody Bag", "bags", 279000, None, "unisex", True, False, False, "Polyester"),
            ("Soft Riot Tee", "t-shirts", 199000, 259000, "women", True, True, True, "Organic cotton"),
            ("Midnight Coat", "coats", 899000, None, "women", False, True, True, "Wool blend"),
            ("Mini Tag Hoodie", "hoodies", 299000, 349000, "kids", True, False, True, "Soft fleece"),
            ("Raw Selvedge Jeans", "jeans", 549000, None, "men", False, False, True, "Denim"),
        ]

        colors = ["Black", "White", "Magenta"]
        sizes = ["S", "M", "L", "XL"]

        for name, cat_slug, price, old, gender, is_new, is_sale, is_featured, material in catalog:
            product, created = Product.objects.get_or_create(
                slug=slugify(name),
                defaults={
                    "seller": seller,
                    "category": sub_map[cat_slug],
                    "name": name,
                    "description": (
                        f"{name} — part of the S1NDZE streetwear drop. "
                        "Oversized urban cut, premium feel, made to stand out. "
                        "Wear your style."
                    ),
                    "price": Decimal(price),
                    "old_price": Decimal(old) if old else None,
                    "brand": "S1NDZE",
                    "gender": gender if gender != "unisex" else "unisex",
                    "material": material,
                    "is_new": is_new,
                    "is_sale": is_sale or bool(old),
                    "is_featured": is_featured,
                    "is_available": True,
                },
            )
            if created or not product.images.exists():
                real = Path(__file__).resolve().parents[3] / "media" / "products" / "real" / f"{slugify(name)}.jpg"
                if real.exists():
                    with open(real, "rb") as f:
                        ProductImage.objects.create(
                            product=product,
                            image=ContentFile(f.read(), name=f"{slugify(name)}.jpg"),
                            is_main=True,
                            ordering=0,
                        )
                else:
                    color = ACCENT if "Neon" in name or "Pink" in name or "Pulse" in name else BLACK
                    content = make_product_image(name, color)
                    ProductImage.objects.create(product=product, image=content, is_main=True, ordering=0)
            if not product.variants.exists():
                for size in sizes:
                    for color in colors:
                        ProductVariant.objects.create(
                            product=product,
                            size=size,
                            color=color,
                            stock=8 if color != "Magenta" else 3,
                        )

        # Attach brand logo as a special product image if present
        logo = Path(__file__).resolve().parents[4] / "s1ndze.jpg"
        if logo.exists():
            merch, _ = Product.objects.get_or_create(
                slug="s1ndze-logo-tee",
                defaults={
                    "seller": seller,
                    "category": sub_map["t-shirts"],
                    "name": "S1NDZE Logo Tee",
                    "description": "Official graffiti logo tee. The pink 1 hits different.",
                    "price": Decimal("219000"),
                    "old_price": Decimal("279000"),
                    "brand": "S1NDZE",
                    "gender": "unisex",
                    "material": "100% cotton",
                    "is_new": True,
                    "is_sale": True,
                    "is_featured": True,
                },
            )
            if not merch.images.exists():
                with open(logo, "rb") as f:
                    ProductImage.objects.create(
                        product=merch,
                        image=ContentFile(f.read(), name="s1ndze-logo.jpg"),
                        is_main=True,
                    )
            if not merch.variants.exists():
                for size in sizes:
                    ProductVariant.objects.create(
                        product=merch, size=size, color="Black", stock=15
                    )
                    ProductVariant.objects.create(
                        product=merch, size=size, color="White", stock=10
                    )

        now = timezone.now()
        Coupon.objects.get_or_create(
            code="S1NDZE10",
            defaults={
                "discount_percent": 10,
                "discount_amount": 0,
                "minimum_order_amount": 100000,
                "max_uses": 1000,
                "start_date": now - timedelta(days=1),
                "end_date": now + timedelta(days=365),
                "is_active": True,
            },
        )

        self.stdout.write(self.style.SUCCESS("Seed complete."))
        self.stdout.write("Accounts:")
        self.stdout.write("  admin / admin12345")
        self.stdout.write("  s1ndze (seller) / seller12345")
        self.stdout.write("  buyer / buyer12345")
        self.stdout.write("Coupon: S1NDZE10")
