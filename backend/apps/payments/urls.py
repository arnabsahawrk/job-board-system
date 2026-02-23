"""
Payment API URLs
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PaymentViewSet, PromotionPackageViewSet

# Create routers
router = DefaultRouter()
router.register(r"payments", PaymentViewSet, basename="payment")
router.register(
    r"promotion-packages", PromotionPackageViewSet, basename="promotion-package"
)

# URL patterns
urlpatterns = [
    path("", include(router.urls)),
]

# ============ PAYMENT ENDPOINTS ============

# LIST & CREATE
# GET    /api/payments/                           - List user's payments
# POST   /api/payments/initiate_payment/          - Initiate new payment
# GET    /api/payments/{id}/                      - Payment details

# CUSTOM ACTIONS
# POST   /api/payments/check_status/              - Check payment status
# GET    /api/payments/my_payments/               - My payments (recruiter)
# GET    /api/payments/{id}/logs/                 - Payment audit logs
# GET    /api/payments/promotion_status/          - Jobs promotion status
# POST   /api/payments/ipn-callback/              - SSLCOMMERZ callback (public)

# PROMOTION PACKAGES
# GET    /api/promotion-packages/                 - List packages
# GET    /api/promotion-packages/{id}/            - Package details
# GET    /api/promotion-packages/active_packages/ - Active packages only
