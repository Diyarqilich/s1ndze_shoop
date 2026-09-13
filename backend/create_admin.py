import os

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth import get_user_model


User = get_user_model()

username = os.getenv("DJANGO_SUPERUSER_USERNAME")
email = os.getenv("DJANGO_SUPERUSER_EMAIL")
password = os.getenv("DJANGO_SUPERUSER_PASSWORD")

if not username or not password:
    print("Admin credentials are not configured. Skipping superuser creation.")
    raise SystemExit(0)

user, created = User.objects.get_or_create(
    username=username,
    defaults={
        "email": email or "",
        "is_staff": True,
        "is_superuser": True,
    },
)

if created:
    user.set_password(password)
    user.save()
    print(f"Superuser '{username}' created.")
else:
    changed = False

    if not user.is_staff:
        user.is_staff = True
        changed = True

    if not user.is_superuser:
        user.is_superuser = True
        changed = True

    if email and user.email != email:
        user.email = email
        changed = True

    if changed:
        user.save()

    print(f"Superuser '{username}' already exists.")