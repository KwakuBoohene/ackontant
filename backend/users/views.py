from django.shortcuts import render
from rest_framework import status, permissions, viewsets
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
import jwt
from datetime import datetime, timedelta
from .serializers import (
    UserSerializer, RegisterSerializer, SocialAuthSerializer,
    EmailVerificationSerializer, PasswordResetSerializer, LoginSerializer
)
from .models import User
from rest_framework.decorators import action
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample, OpenApiRequest, OpenApiResponse
from drf_spectacular.types import OpenApiTypes

User = get_user_model()

class AuthViewSet(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        summary="Register a new user",
        description="Create a new user account with email and password",
        request=OpenApiRequest(RegisterSerializer),
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
                    'user_id': str(user.id),
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

    @extend_schema(
        summary="Login user",
        description="Authenticate user and return JWT tokens",
        request=OpenApiRequest(LoginSerializer),
        responses={
            200: OpenApiResponse(
                response=OpenApiTypes.OBJECT,
                description="Login successful",
                examples=[
                    OpenApiExample(
                        'Success Response',
                        value={
                            'access': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...',
                            'refresh': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...',
                            'user': {
                                'id': 'uuid',
                                'email': 'user@example.com',
                                'is_email_verified': True
                            }
                        },
                        status_codes=['200']
                    )
                ]
            ),
            400: OpenApiResponse(
                response=OpenApiTypes.OBJECT,
                description="Login failed",
                examples=[
                    OpenApiExample(
                        'Error Response',
                        value={
                            'detail': 'No active account found with the given credentials'
                        },
                        status_codes=['400']
                    )
                ]
            )
        }
    )
    @action(detail=False, methods=['post'])
    def login(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            refresh = RefreshToken.for_user(user)
            
            # Update last login
            user.last_login = timezone.now()
            user.save(update_fields=['last_login'])
            
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary="Logout user",
        description="Invalidate the current user's refresh token",
        request={
            'application/json': {
                'type': 'object',
                'required': ['refresh'],
                'properties': {
                    'refresh': {
                        'type': 'string',
                        'description': 'The refresh token to invalidate'
                    }
                }
            }
        },
        responses={
            200: OpenApiResponse(
                response=OpenApiTypes.OBJECT,
                description="Logout successful",
                examples=[
                    OpenApiExample(
                        'Success Response',
                        value={'message': 'Successfully logged out'},
                        status_codes=['200']
                    )
                ]
            ),
            400: OpenApiResponse(
                response=OpenApiTypes.OBJECT,
                description="Logout failed",
                examples=[
                    OpenApiExample(
                        'Error Response',
                        value={'detail': 'Token is invalid or expired'},
                        status_codes=['400']
                    )
                ]
            )
        }
    )
    @action(detail=False, methods=['post'])
    def logout(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response(
                    {'detail': 'Refresh token is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            token = RefreshToken(refresh_token)
            token.blacklist()
            
            return Response(
                {'message': 'Successfully logged out'},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'detail': 'Token is invalid or expired'},
                status=status.HTTP_400_BAD_REQUEST
            )

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
                    'first_name': 'John',
                    'last_name': 'Doe',
                    'is_email_verified': True,
                    'base_currency': {
                        'id': 'uuid',
                        'code': 'USD',
                        'name': 'US Dollar'
                    },
                    'created_at': '2024-03-20T12:00:00Z',
                    'updated_at': '2024-03-20T12:00:00Z'
                },
                status_codes=['200']
            ),
        ]
    )
    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

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
                    'email': 'user@example.com',
                    'first_name': 'John',
                    'last_name': 'Doe',
                    'is_email_verified': True,
                    'base_currency': {
                        'id': 'uuid',
                        'code': 'USD',
                        'name': 'US Dollar'
                    },
                    'created_at': '2024-03-20T12:00:00Z',
                    'updated_at': '2024-03-20T12:00:00Z'
                },
                status_codes=['200']
            ),
        ]
    )
    @action(detail=False, methods=['patch'])
    def update_me(self, request):
        serializer = self.get_serializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
