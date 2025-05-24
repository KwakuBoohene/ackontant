from django.contrib import admin
from .models import Currency, Account, ExchangeRate

@admin.register(Currency)
class CurrencyAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'symbol', 'decimal_places', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('code', 'name')
    ordering = ('code',)

@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'type', 'currency', 'current_balance', 'base_currency_balance', 'is_active')
    list_filter = ('type', 'is_active', 'currency')
    search_fields = ('name', 'user__email')
    raw_id_fields = ('user', 'currency')
    ordering = ('-created_at',)

@admin.register(ExchangeRate)
class ExchangeRateAdmin(admin.ModelAdmin):
    list_display = ('user', 'from_currency', 'to_currency', 'rate', 'date', 'is_manual')
    list_filter = ('is_manual', 'date')
    search_fields = ('user__email', 'from_currency__code', 'to_currency__code')
    raw_id_fields = ('user', 'from_currency', 'to_currency')
    ordering = ('-date',)
