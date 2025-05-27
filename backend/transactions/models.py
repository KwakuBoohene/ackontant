from django.db import models
from django.core.validators import MinValueValidator
from users.base import UUIDModel

class Transfer(UUIDModel):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
        ('CANCELLED', 'Cancelled')
    ]

    RATE_SOURCE_CHOICES = [
        ('USER', 'User Custom Rate'),
        ('PLATFORM', 'Platform Default Rate')
    ]

    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='transfers')
    source_account = models.ForeignKey('accounts.Account', on_delete=models.PROTECT, related_name='outgoing_transfers')
    destination_account = models.ForeignKey('accounts.Account', on_delete=models.PROTECT, related_name='incoming_transfers')
    amount = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(0)])
    source_currency = models.ForeignKey('accounts.Currency', on_delete=models.PROTECT, related_name='source_transfers')
    destination_currency = models.ForeignKey('accounts.Currency', on_delete=models.PROTECT, related_name='destination_transfers')
    exchange_rate = models.DecimalField(max_digits=15, decimal_places=6)
    base_currency_amount = models.DecimalField(max_digits=15, decimal_places=2)
    date = models.DateField()
    description = models.TextField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    source_transaction = models.ForeignKey('Transaction', on_delete=models.SET_NULL, null=True, related_name='source_transfer')
    destination_transaction = models.ForeignKey('Transaction', on_delete=models.SET_NULL, null=True, related_name='destination_transfer')
    rate_source = models.CharField(max_length=10, choices=RATE_SOURCE_CHOICES)
    user_exchange_rate = models.ForeignKey('accounts.UserExchangeRate', on_delete=models.SET_NULL, null=True, blank=True, related_name='transfers')

    class Meta:
        ordering = ['-date', '-created_at']
        indexes = [
            models.Index(fields=['user', 'date']),
            models.Index(fields=['source_account', 'destination_account']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"Transfer {self.amount} {self.source_currency.code} to {self.destination_currency.code} - {self.date}"

class Transaction(UUIDModel):
    TRANSACTION_TYPES = [
        ('INCOME', 'Income'),
        ('EXPENSE', 'Expense'),
        ('TRANSFER', 'Transfer')
    ]

    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='transactions')
    account = models.ForeignKey('accounts.Account', on_delete=models.CASCADE, related_name='transactions')
    type = models.CharField(max_length=10, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(0)])
    currency = models.ForeignKey('accounts.Currency', on_delete=models.PROTECT, related_name='transactions')
    base_currency_amount = models.DecimalField(max_digits=15, decimal_places=2)
    exchange_rate = models.DecimalField(max_digits=15, decimal_places=6, null=True)
    description = models.CharField(max_length=200)
    date = models.DateField()
    category = models.ForeignKey('Category', on_delete=models.SET_NULL, null=True, related_name='transactions')
    tags = models.ManyToManyField('Tag', related_name='transactions', blank=True)
    is_recurring = models.BooleanField(default=False)
    recurring_rule = models.JSONField(null=True, blank=True)  # For storing recurrence rules
    is_archived = models.BooleanField(default=False)
    transfer = models.ForeignKey(Transfer, on_delete=models.SET_NULL, null=True, blank=True, related_name='transactions')

    class Meta:
        ordering = ['-date', '-created_at']
        indexes = [
            models.Index(fields=['user', 'date']),
            models.Index(fields=['account', 'type']),
            models.Index(fields=['category']),
            models.Index(fields=['transfer']),
        ]

    def __str__(self):
        return f"{self.get_type_display()} - {self.amount} {self.currency.code} - {self.date}"

class Category(UUIDModel):
    CATEGORY_TYPES = [
        ('INCOME', 'Income'),
        ('EXPENSE', 'Expense'),
        ('TRANSFER', 'Transfer')
    ]

    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='categories')
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=10, choices=CATEGORY_TYPES)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children')
    color = models.CharField(max_length=7, default='#000000')  # Hex color code
    icon = models.CharField(max_length=50, null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['type', 'name']
        indexes = [
            models.Index(fields=['user', 'type']),
            models.Index(fields=['parent']),
        ]

    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"

class Tag(UUIDModel):
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='tags')
    name = models.CharField(max_length=50)
    color = models.CharField(max_length=7, default='#000000')  # Hex color code
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children')
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['parent']),
        ]

    def __str__(self):
        return self.name
