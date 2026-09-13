"""
Payment abstraction layer.
Real Click / Payme integrations can plug in here without rewriting orders.
"""


class BasePaymentProvider:
    code = "base"

    def initiate(self, order):
        return {"status": "pending", "provider": self.code, "order": order.order_number}

    def confirm(self, order, payload=None):
        return {"status": "confirmed"}


class CashOnDeliveryProvider(BasePaymentProvider):
    code = "cash"

    def initiate(self, order):
        return {
            "status": "cod",
            "provider": self.code,
            "message": "Cash on delivery — pay when you receive the order",
            "order": order.order_number,
        }


class ClickProvider(BasePaymentProvider):
    code = "click"
    # Placeholder for future Click merchant API


class PaymeProvider(BasePaymentProvider):
    code = "payme"


class UzcardProvider(BasePaymentProvider):
    code = "uzcard"


class HumoProvider(BasePaymentProvider):
    code = "humo"


PROVIDERS = {
    "cash": CashOnDeliveryProvider(),
    "click": ClickProvider(),
    "payme": PaymeProvider(),
    "uzcard": UzcardProvider(),
    "humo": HumoProvider(),
}


class PaymentGateway:
    @classmethod
    def is_supported(cls, method: str) -> bool:
        return method in PROVIDERS

    @classmethod
    def initiate(cls, order):
        provider = PROVIDERS.get(order.payment_method)
        if not provider:
            raise ValueError("Unsupported payment method")
        return provider.initiate(order)
