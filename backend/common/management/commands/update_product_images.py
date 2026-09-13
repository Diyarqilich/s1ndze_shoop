from pathlib import Path

from django.core.files import File
from django.core.management.base import BaseCommand

from products.models import Product, ProductImage


class Command(BaseCommand):
    help = "Replace product images with real clothing photos from media/products/real/"

    def handle(self, *args, **options):
        real_dir = Path(__file__).resolve().parents[3] / "media" / "products" / "real"
        if not real_dir.exists():
            self.stderr.write(f"Missing folder: {real_dir}")
            return

        updated = 0
        for product in Product.objects.all():
            path = real_dir / f"{product.slug}.jpg"
            if not path.exists():
                # try partial match
                matches = list(real_dir.glob(f"*{product.slug.split('-')[0]}*.jpg"))
                path = matches[0] if matches else None
            if not path or not Path(path).exists():
                self.stdout.write(f"skip {product.slug}")
                continue

            product.images.all().delete()
            with open(path, "rb") as f:
                img = ProductImage(product=product, is_main=True, ordering=0)
                img.image.save(f"{product.slug}.jpg", File(f), save=True)
            updated += 1
            self.stdout.write(self.style.SUCCESS(f"updated {product.slug}"))

        self.stdout.write(self.style.SUCCESS(f"Done. Updated {updated} products."))
