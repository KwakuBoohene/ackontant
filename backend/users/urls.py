from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, VerifyEmailView, ResendVerificationView,
    ForgotPasswordView, ResetPasswordView, SocialAuthView
)

urlpatterns = [
    # JWT endpoints
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Registration and email verification
    path('register/', RegisterView.as_view(), name='register'),
    path('verify-email/', VerifyEmailView.as_view(), name='verify-email'),
    path('resend-verification/', ResendVerificationView.as_view(), name='resend-verification'),
    
    # Password management
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset-password'),
    
    # Social authentication
    path('social/<str:provider>/', SocialAuthView.as_view(), name='social-auth'),
] 