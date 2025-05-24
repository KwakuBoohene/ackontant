from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, SocialAuth

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'username', 'is_active', 'is_staff', 'is_email_verified', 'last_login')
    list_filter = ('is_active', 'is_staff', 'is_email_verified')
    search_fields = ('email', 'username')
    ordering = ('-date_joined',)
    
    fieldsets = (
        (None, {'fields': ('email', 'username', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'base_currency')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
        ('Verification', {'fields': ('is_email_verified', 'email_verification_token', 'email_verification_sent_at')}),
        ('Password Reset', {'fields': ('password_reset_token', 'password_reset_sent_at')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'password1', 'password2'),
        }),
    )

@admin.register(SocialAuth)
class SocialAuthAdmin(admin.ModelAdmin):
    list_display = ('user', 'provider', 'provider_user_id', 'provider_email', 'is_active')
    list_filter = ('provider', 'is_active')
    search_fields = ('user__email', 'provider_user_id', 'provider_email')
    raw_id_fields = ('user',)
    ordering = ('-created_at',)
