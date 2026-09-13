from notifications.models import Notification


def notify_order_created(order):
    Notification.objects.create(
        user=order.user,
        type=Notification.Type.ORDER_CREATED,
        title="Order placed",
        message=f"Your order {order.order_number} has been placed successfully.",
        link=f"/orders/{order.order_number}",
    )
    # Notify sellers
    seller_ids = set(
        order.items.exclude(seller=None).values_list("seller_id", flat=True)
    )
    for sid in seller_ids:
        Notification.objects.create(
            user_id=sid,
            type=Notification.Type.ORDER_CREATED,
            title="New sale",
            message=f"You have a new order item in {order.order_number}.",
            link="/seller/orders",
        )


def notify_status(order, ntype, title, message):
    Notification.objects.create(
        user=order.user,
        type=ntype,
        title=title,
        message=message,
        link=f"/orders/{order.order_number}",
    )
