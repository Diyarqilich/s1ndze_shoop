from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsBuyer(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in ("buyer", "admin")
            or (request.user and request.user.is_superuser)
        )


class IsSeller(BasePermission):
    def has_permission(self, request, view):
        u = request.user
        return bool(u and u.is_authenticated and (u.role in ("seller", "admin") or u.is_staff))


class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        u = request.user
        return bool(u and u.is_authenticated and (u.role == "admin" or u.is_superuser))


class CanCreateProduct(BasePermission):
    """Only an actual seller account may create a new product listing.

    Admin accounts can moderate the catalog (view/delete) through the same
    seller viewset, but they must never be able to add products themselves —
    product creation is a seller-only capability.
    """

    def has_permission(self, request, view):
        u = request.user
        return bool(u and u.is_authenticated and u.role == "seller")


class IsSellerOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        u = request.user
        return bool(u and u.is_authenticated and (u.role in ("seller", "admin") or u.is_staff))


class IsProductOwnerOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        u = request.user
        if not u or not u.is_authenticated:
            return False
        if u.role == "admin" or u.is_superuser:
            return True
        seller = getattr(obj, "seller", None) or getattr(getattr(obj, "product", None), "seller", None)
        return seller_id_equals(seller, u)


def seller_id_equals(seller, user):
    return seller is not None and seller.id == user.id


class IsOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.user_id == request.user.id
