from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CurrencyViewSet, AccountViewSet, ExchangeRateViewSet, UserExchangeRateViewSet

router = DefaultRouter()
router.register(r'currencies', CurrencyViewSet, basename='currency')
router.register(r'accounts', AccountViewSet, basename='account')
router.register(r'exchange-rates', ExchangeRateViewSet, basename='exchange-rate')
router.register(r'user-exchange-rates', UserExchangeRateViewSet, basename='user-exchange-rate')

urlpatterns = [
    path('', include(router.urls)),
] 