from django.shortcuts import render
from rest_framework import status, permissions, viewsets
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
    EmailVerificationSerializer, PasswordResetSerializer
)
from .models import User
from rest_framework.decorators import action
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample

User = get_user_model()

class AuthViewSet(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        summary="Register a new user",
        description="Create a new user account with email and password",
        request=RegisterSerializer,
        responses={201: UserSerializer, 400: None},
        examples=[
            OpenApiExample(
                'Success Response',
                value={'id': 'uuid', 'email': 'user@example.com', 'is_email_verified': False},
                status_codes=['201']
            ),
            OpenApiExample(
                'Error Response',
                value={'code': 'INVALID_EMAIL', 'message': 'Invalid email format'},
                status_codes=['400']
            ),
        ]
    )
    @action(detail=False, methods=['post'])
    def register(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
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
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary="Verify email address",
        description="Verify user's email address using the verification token",
        request=EmailVerificationSerializer,
        responses={200: None, 400: None},
        examples=[
            OpenApiExample(
                'Success Response',
                value={'message': 'Email verified successfully'},
                status_codes=['200']
            ),
            OpenApiExample(
                'Error Response',
                value={'code': 'INVALID_TOKEN', 'message': 'Invalid or expired token'},
                status_codes=['400']
            ),
        ]
    )
    @action(detail=False, methods=['post'])
    def verify_email(self, request):
        serializer = EmailVerificationSerializer(data=request.data)
        if serializer.is_valid():
            token = serializer.validated_data['token']
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
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary="Request password reset",
        description="Send a password reset email to the user",
        request=PasswordResetSerializer,
        responses={200: None, 400: None},
        examples=[
            OpenApiExample(
                'Success Response',
                value={'message': 'Password reset email sent'},
                status_codes=['200']
            ),
            OpenApiExample(
                'Error Response',
                value={'code': 'USER_NOT_FOUND', 'message': 'No user found with this email'},
                status_codes=['400']
            ),
        ]
    )
    @action(detail=False, methods=['post'])
    def reset_password(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        if serializer.is_valid():
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
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary="Reset password with token",
        description="Reset user's password using the reset token",
        request=PasswordResetSerializer,
        responses={200: None, 400: None},
        examples=[
            OpenApiExample(
                'Success Response',
                value={'message': 'Password reset successfully'},
                status_codes=['200']
            ),
            OpenApiExample(
                'Error Response',
                value={'code': 'INVALID_TOKEN', 'message': 'Invalid or expired token'},
                status_codes=['400']
            ),
        ]
    )
    @action(detail=False, methods=['post'])
    def reset_password_confirm(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        if serializer.is_valid():
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
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return User.objects.filter(id=self.request.user.id)

    @extend_schema(
        summary="Get current user",
        description="Retrieve the currently authenticated user's information",
        responses={200: UserSerializer, 401: None},
        examples=[
            OpenApiExample(
                'Success Response',
                value={
                    'id': 'uuid',
                    'email': 'user@example.com',
                    'is_email_verified': True,
                    'created_at': '2024-03-20T12:00:00Z',
                    'updated_at': '2024-03-20T12:00:00Z'
                },
                status_codes=['200']
            ),
        ]
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @extend_schema(
        summary="Update current user",
        description="Update the currently authenticated user's information",
        request=UserSerializer,
        responses={200: UserSerializer, 400: None, 401: None},
        examples=[
            OpenApiExample(
                'Success Response',
                value={
                    'id': 'uuid',
                    'email': 'updated@example.com',
                    'is_email_verified': True,
                    'created_at': '2024-03-20T12:00:00Z',
                    'updated_at': '2024-03-20T12:00:00Z'
                },
                status_codes=['200']
            ),
        ]
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)
