from django.db import models
from users.base import UUIDModel

# Create your models here.

class Currency(UUIDModel):
    code = models.CharField(max_length=3, unique=True)  # e.g., USD, EUR, GBP
    name = models.CharField(max_length=50)  # e.g., US Dollar, Euro
    symbol = models.CharField(max_length=5)  # e.g., $, €, £
    decimal_places = models.PositiveSmallIntegerField(default=2)
    is_active = models.BooleanField(default=True)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, null=True, blank=True, related_name='currencies')
    source = models.CharField(max_length=50, default='system')  # 'system' for platform-wide, 'user' for user-specific
    is_platform_currency = models.BooleanField(default=False)  # True for currencies available to all users

    class Meta:
        verbose_name_plural = "Currencies"
        ordering = ['code']
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['is_platform_currency']),
        ]

    def __str__(self):
        return f"{self.code} - {self.name}"

    @classmethod
    def get_platform_currencies(cls):
        """Get all platform-wide currencies"""
        return cls.objects.filter(is_platform_currency=True, is_active=True)

    @classmethod
    def get_user_currencies(cls, user):
        """Get all currencies available to a user (platform + user-specific)"""
        return cls.objects.filter(
            models.Q(is_platform_currency=True) | models.Q(user=user),
            is_active=True
        ).distinct()

class Account(UUIDModel):
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

    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['user', 'type']),
            models.Index(fields=['currency']),
        ]

    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"

class ExchangeRate(UUIDModel):
    """
    Platform-wide exchange rates fetched from external API
    """
    from_currency = models.ForeignKey(Currency, on_delete=models.PROTECT, related_name='exchange_rates_from')
    to_currency = models.ForeignKey(Currency, on_delete=models.PROTECT, related_name='exchange_rates_to')
    rate = models.DecimalField(max_digits=15, decimal_places=6)
    date = models.DateField()
    source = models.CharField(max_length=50, default='api')  # e.g., 'api', 'manual'

    class Meta:
        unique_together = ['from_currency', 'to_currency', 'date']
        ordering = ['-date', '-created_at']
        indexes = [
            models.Index(fields=['date']),
            models.Index(fields=['from_currency', 'to_currency']),
        ]

    def __str__(self):
        return f"{self.from_currency.code}/{self.to_currency.code} - {self.date}"

class UserExchangeRate(UUIDModel):
    """
    User-specific exchange rates for manual overrides
    """
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='user_exchange_rates')
    from_currency = models.ForeignKey(Currency, on_delete=models.PROTECT, related_name='user_rates_from')
    to_currency = models.ForeignKey(Currency, on_delete=models.PROTECT, related_name='user_rates_to')
    rate = models.DecimalField(max_digits=15, decimal_places=6)
    date = models.DateField()
    is_active = models.BooleanField(default=True)
    note = models.CharField(max_length=255, blank=True, null=True)  # Optional note about the rate

    class Meta:
        unique_together = ['user', 'from_currency', 'to_currency', 'date']
        ordering = ['-date', '-created_at']
        indexes = [
            models.Index(fields=['user', 'date']),
            models.Index(fields=['from_currency', 'to_currency']),
        ]

    def __str__(self):
        return f"{self.from_currency.code}/{self.to_currency.code} - {self.date} (User: {self.user.username})"
