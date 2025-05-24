from django.db import models

# Create your models here.

class Currency(models.Model):
    code = models.CharField(max_length=3, unique=True)  # e.g., USD, EUR, GBP
    name = models.CharField(max_length=50)  # e.g., US Dollar, Euro
    symbol = models.CharField(max_length=5)  # e.g., $, €, £
    decimal_places = models.PositiveSmallIntegerField(default=2)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Currencies"
        ordering = ['code']

    def __str__(self):
        return f"{self.code} - {self.name}"

class Account(models.Model):
    ACCOUNT_TYPES = [
        ('BANK', 'Bank Account'),
        ('CASH', 'Cash'),
        ('MOBILE', 'Mobile Money'),
        ('CREDIT', 'Credit Card'),
        ('OTHER', 'Other')
    ]

    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='accounts')
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=10, choices=ACCOUNT_TYPES)
    currency = models.ForeignKey(Currency, on_delete=models.PROTECT, related_name='accounts')
    initial_balance = models.DecimalField(max_digits=15, decimal_places=2)
    current_balance = models.DecimalField(max_digits=15, decimal_places=2)
    base_currency_balance = models.DecimalField(max_digits=15, decimal_places=2)
    last_exchange_rate = models.DecimalField(max_digits=15, decimal_places=6, null=True)
    last_conversion_date = models.DateTimeField(null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['user', 'type']),
            models.Index(fields=['currency']),
        ]

    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"

class ExchangeRate(models.Model):
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='exchange_rates')
    from_currency = models.ForeignKey(Currency, on_delete=models.PROTECT, related_name='exchange_rates_from')
    to_currency = models.ForeignKey(Currency, on_delete=models.PROTECT, related_name='exchange_rates_to')
    rate = models.DecimalField(max_digits=15, decimal_places=6)
    date = models.DateField()
    is_manual = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'from_currency', 'to_currency', 'date']
        ordering = ['-date']
        indexes = [
            models.Index(fields=['user', 'date']),
            models.Index(fields=['from_currency', 'to_currency']),
        ]

    def __str__(self):
        return f"{self.from_currency.code}/{self.to_currency.code} - {self.date}"
