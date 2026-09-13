from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone


class Coupon(models.Model):
    code = models.CharField(max_length=40, unique=True)
    discount_percent = models.PositiveSmallIntegerField(
        default=0, validators=[MaxValueValidator(100)]
    )
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    minimum_order_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    max_uses = models.PositiveIntegerField(default=100)
    used_count = models.PositiveIntegerField(default=0)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-start_date"]

    def __str__(self):
        return self.code

    def is_valid(self, order_subtotal=None):
        now = timezone.now()
        if not self.is_active:
            return False, "Coupon is inactive"
        if now < self.start_date or now > self.end_date:
            return False, "Coupon is expired or not yet active"
        if self.used_count >= self.max_uses:
            return False, "Coupon usage limit reached"
        if order_subtotal is not None and order_subtotal < self.minimum_order_amount:
            return False, f"Minimum order amount is {self.minimum_order_amount}"
        return True, "OK"

    def calculate_discount(self, subtotal):
        percent_off = (subtotal * self.discount_percent) / 100
        amount_off = self.discount_amount
        return min(subtotal, max(percent_off, amount_off))
