from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils import timezone

class User(AbstractUser):
    email = models.EmailField(_('email address'), unique=True)
    base_currency = models.ForeignKey('accounts.Currency', on_delete=models.PROTECT, related_name='base_currency_users', null=True)
    
    # Authentication fields
    is_email_verified = models.BooleanField(default=False)
    email_verification_token = models.CharField(max_length=100, null=True, blank=True)
    email_verification_sent_at = models.DateTimeField(null=True, blank=True)
    password_reset_token = models.CharField(max_length=100, null=True, blank=True)
    password_reset_sent_at = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_login = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['email']),
        ]

    def __str__(self):
        return self.email

class SocialAuth(models.Model):
    PROVIDER_CHOICES = [
        ('GOOGLE', 'Google'),
        ('FACEBOOK', 'Facebook'),
        ('GITHUB', 'GitHub'),
        ('APPLE', 'Apple'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='social_auths')
    provider = models.CharField(max_length=10, choices=PROVIDER_CHOICES)
    provider_user_id = models.CharField(max_length=100)
    provider_email = models.EmailField(null=True, blank=True)
    provider_picture = models.URLField(null=True, blank=True)
    access_token = models.TextField(null=True, blank=True)
    refresh_token = models.TextField(null=True, blank=True)
    token_expires_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['provider', 'provider_user_id']
        indexes = [
            models.Index(fields=['provider', 'provider_user_id']),
            models.Index(fields=['user', 'provider']),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.provider}"

    def is_token_expired(self):
        if not self.token_expires_at:
            return True
        return timezone.now() >= self.token_expires_at
