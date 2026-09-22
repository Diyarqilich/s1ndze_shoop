from django.db import migrations


def renumber_orders(apps, schema_editor):
    """Give any pre-existing order a short, readable, sequential number
    (S1N-000001) instead of the old random hex fragment (S1N-XXXXXXXX).
    Idempotent: only touches rows that don't already match the new format.
    """
    Order = apps.get_model("orders", "Order")
    for order in Order.objects.all().order_by("pk"):
        new_number = f"S1N-{order.pk:06d}"
        if order.order_number != new_number:
            order.order_number = new_number
            order.save(update_fields=["order_number"])


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("orders", "0002_initial"),
    ]

    operations = [
        migrations.RunPython(renumber_orders, noop),
    ]
