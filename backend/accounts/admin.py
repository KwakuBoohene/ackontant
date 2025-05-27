from django.contrib import admin
from .models import Currency, Account, ExchangeRate, UserExchangeRate

@admin.register(Currency)
class CurrencyAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'symbol', 'decimal_places', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('code', 'name')

@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'type', 'currency', 'current_balance', 'base_currency_balance', 'is_active')
    list_filter = ('type', 'currency', 'is_active')
    search_fields = ('name', 'user__email')
    raw_id_fields = ('user', 'currency')

@admin.register(ExchangeRate)
class ExchangeRateAdmin(admin.ModelAdmin):
    list_display = ('from_currency', 'to_currency', 'rate', 'date', 'source')
    list_filter = ('date', 'source')
    search_fields = ('from_currency__code', 'to_currency__code')
    raw_id_fields = ('from_currency', 'to_currency')
    date_hierarchy = 'date'

@admin.register(UserExchangeRate)
class UserExchangeRateAdmin(admin.ModelAdmin):
    list_display = ('user', 'from_currency', 'to_currency', 'rate', 'date', 'is_active')
    list_filter = ('date', 'is_active')
    search_fields = ('user__email', 'from_currency__code', 'to_currency__code')
    raw_id_fields = ('user', 'from_currency', 'to_currency')
    date_hierarchy = 'date'
