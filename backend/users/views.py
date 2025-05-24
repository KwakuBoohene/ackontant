from django.shortcuts import render
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
import jwt
from datetime import datetime, timedelta
from .serializers import (
    UserSerializer, RegisterSerializer, SocialAuthSerializer,
    PasswordResetRequestSerializer, PasswordResetConfirmSerializer
)
from .models import SocialAuth

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

    def perform_create(self, serializer):
        user = serializer.save()
        # Generate verification token
        token = jwt.encode(
            {
                'user_id': user.id,
                'exp': datetime.utcnow() + timedelta(hours=24)
            },
            settings.SECRET_KEY,
            algorithm='HS256'
        )
        user.email_verification_token = token
        user.email_verification_sent_at = timezone.now()
        user.save()

        # Send verification email
        verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
        send_mail(
            'Verify your email',
            f'Please click the following link to verify your email: {verification_url}',
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )

class VerifyEmailView(generics.GenericAPIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        token = request.data.get('token')
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            user = User.objects.get(id=payload['user_id'])
            user.is_email_verified = True
            user.email_verification_token = None
            user.save()
            return Response({'message': 'Email verified successfully'})
        except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, User.DoesNotExist):
            return Response(
                {'error': 'Invalid or expired token'},
                status=status.HTTP_400_BAD_REQUEST
            )

class ResendVerificationView(generics.GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        user = request.user
        if user.is_email_verified:
            return Response(
                {'message': 'Email already verified'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Generate new verification token
        token = jwt.encode(
            {
                'user_id': user.id,
                'exp': datetime.utcnow() + timedelta(hours=24)
            },
            settings.SECRET_KEY,
            algorithm='HS256'
        )
        user.email_verification_token = token
        user.email_verification_sent_at = timezone.now()
        user.save()

        # Send verification email
        verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
        send_mail(
            'Verify your email',
            f'Please click the following link to verify your email: {verification_url}',
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )
        return Response({'message': 'Verification email sent'})

class ForgotPasswordView(generics.GenericAPIView):
    permission_classes = (permissions.AllowAny,)
    serializer_class = PasswordResetRequestSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']

        try:
            user = User.objects.get(email=email)
            # Generate reset token
            token = jwt.encode(
                {
                    'user_id': user.id,
                    'exp': datetime.utcnow() + timedelta(hours=1)
                },
                settings.SECRET_KEY,
                algorithm='HS256'
            )
            user.password_reset_token = token
            user.password_reset_sent_at = timezone.now()
            user.save()

            # Send reset email
            reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
            send_mail(
                'Reset your password',
                f'Please click the following link to reset your password: {reset_url}',
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )
            return Response({'message': 'Password reset email sent'})
        except User.DoesNotExist:
            return Response(
                {'message': 'If an account exists with this email, you will receive a password reset link'},
                status=status.HTTP_200_OK
            )

class ResetPasswordView(generics.GenericAPIView):
    permission_classes = (permissions.AllowAny,)
    serializer_class = PasswordResetConfirmSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token = serializer.validated_data['token']
        password = serializer.validated_data['password']

        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            user = User.objects.get(id=payload['user_id'])
            if user.password_reset_token != token:
                raise jwt.InvalidTokenError
            user.set_password(password)
            user.password_reset_token = None
            user.save()
            return Response({'message': 'Password reset successful'})
        except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, User.DoesNotExist):
            return Response(
                {'error': 'Invalid or expired token'},
                status=status.HTTP_400_BAD_REQUEST
            )

class SocialAuthView(generics.GenericAPIView):
    permission_classes = (permissions.AllowAny,)
    serializer_class = SocialAuthSerializer

    def post(self, request, provider):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Here you would implement the provider-specific authentication logic
        # This is a placeholder for the actual implementation
        provider_data = serializer.validated_data
        
        try:
            # Check if social auth already exists
            social_auth = SocialAuth.objects.get(
                provider=provider,
                provider_user_id=provider_data['provider_user_id']
            )
            user = social_auth.user
        except SocialAuth.DoesNotExist:
            # Create new user and social auth
            user = User.objects.create_user(
                email=provider_data['provider_email'],
                username=provider_data['provider_email'].split('@')[0],
                is_email_verified=True
            )
            social_auth = SocialAuth.objects.create(
                user=user,
                provider=provider,
                **provider_data
            )

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        })
