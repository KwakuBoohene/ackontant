from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiExample, OpenApiResponse, OpenApiTypes
from .models import Currency, Account, ExchangeRate, UserExchangeRate
from .serializers import CurrencySerializer, AccountSerializer, ExchangeRateSerializer, UserExchangeRateSerializer
from django.utils import timezone
from datetime import date

# Create your views here.

class CurrencyViewSet(viewsets.ModelViewSet):
    serializer_class = CurrencySerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Currency.objects.none()  # Default queryset for schema generation

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Currency.objects.none()
        return Currency.objects.all()

    @extend_schema(
        summary="List currencies",
        description="Get a list of all available currencies",
        responses={200: CurrencySerializer(many=True)},
        examples=[
            OpenApiExample(
                'Success Response',
                value=[
                    {
                        'id': 'uuid',
                        'code': 'USD',
                        'name': 'US Dollar',
                        'symbol': '$',
                        'decimal_places': 2,
                        'is_active': True,
                        'created_at': '2024-03-20T12:00:00Z',
                        'updated_at': '2024-03-20T12:00:00Z'
                    }
                ],
                status_codes=['200']
            ),
        ]
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

class AccountViewSet(viewsets.ModelViewSet):
    serializer_class = AccountSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Account.objects.none()  # Default queryset for schema generation

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Account.objects.none()
        return Account.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @extend_schema(
        summary="List user accounts",
        description="Get a list of all accounts belonging to the current user",
        responses={200: AccountSerializer(many=True)},
        examples=[
            OpenApiExample(
                'Success Response',
                value=[
                    {
                        'id': 'uuid',
                        'name': 'Savings Account',
                        'type': 'SAVINGS',
                        'currency': {
                            'id': 'uuid',
                            'code': 'USD',
                            'name': 'US Dollar',
                            'symbol': '$'
                        },
                        'created_at': '2024-03-20T12:00:00Z',
                        'updated_at': '2024-03-20T12:00:00Z'
                    }
                ],
                status_codes=['200']
            ),
        ]
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(
        summary="Create account",
        description="Create a new account for the current user",
        request={
            'application/json': {
                'type': 'object',
                'required': ['name', 'type', 'currency_id', 'initial_balance'],
                'properties': {
                    'name': {'type': 'string', 'description': 'Name of the account'},
                    'type': {'type': 'string', 'enum': ['BANK', 'CASH', 'MOBILE', 'CREDIT', 'OTHER'], 'description': 'Type of the account'},
                    'currency_id': {'type': 'string', 'format': 'uuid', 'description': 'ID of the currency'},
                    'initial_balance': {'type': 'number', 'description': 'Initial balance of the account'}
                }
            }
        },
        responses={
            201: OpenApiResponse(
                response=AccountSerializer,
                description="Account created successfully",
        examples=[
            OpenApiExample(
                'Success Response',
                value={
                    'id': 'uuid',
                    'name': 'Savings Account',
                            'type': 'BANK',
                    'currency': {
                        'id': 'uuid',
                        'code': 'USD',
                        'name': 'US Dollar',
                        'symbol': '$'
                    },
                    'created_at': '2024-03-20T12:00:00Z',
                    'updated_at': '2024-03-20T12:00:00Z'
                        }
                    )
                ]
            ),
            400: OpenApiResponse(
                response=OpenApiTypes.OBJECT,
                description="Bad request",
                examples=[
                    OpenApiExample(
                        'Error Response',
                        value={
                            'currency_id': ['This field is required.'],
                            'name': ['This field is required.'],
                            'type': ['This field is required.'],
                            'initial_balance': ['This field is required.']
                        }
                    )
                ]
            )
        }
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

class ExchangeRateViewSet(viewsets.ModelViewSet):
    serializer_class = ExchangeRateSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = ExchangeRate.objects.none()  # Default queryset for schema generation

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return ExchangeRate.objects.none()
        
        queryset = ExchangeRate.objects.filter(user__isnull=True)  # Platform rates
        
        # Add user's custom rates
        user_rates = ExchangeRate.objects.filter(user=self.request.user)
        queryset = queryset.union(user_rates)
        
        return queryset.order_by('-date', '-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, is_manual=True)

    @extend_schema(
        summary="List exchange rates",
        description="Get a list of all exchange rates (platform and user-specific)",
        responses={200: ExchangeRateSerializer(many=True)},
        examples=[
            OpenApiExample(
                'Success Response',
                value=[
                    {
                        'id': 'uuid',
                        'from_currency': {
                            'id': 'uuid',
                            'code': 'USD',
                            'name': 'US Dollar',
                            'symbol': '$'
                        },
                        'to_currency': {
                            'id': 'uuid',
                            'code': 'EUR',
                            'name': 'Euro',
                            'symbol': '€'
                        },
                        'rate': '0.85',
                        'date': '2024-03-20',
                        'is_manual': False,
                        'created_at': '2024-03-20T12:00:00Z',
                        'updated_at': '2024-03-20T12:00:00Z'
                    }
                ],
                status_codes=['200']
            ),
        ]
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(
        summary="Create exchange rate",
        description="Create a new exchange rate for the current user",
        request={
            'application/json': {
                'type': 'object',
                'required': ['from_currency_id', 'to_currency_id', 'rate', 'date'],
                'properties': {
                    'from_currency_id': {'type': 'string', 'format': 'uuid', 'description': 'ID of the source currency'},
                    'to_currency_id': {'type': 'string', 'format': 'uuid', 'description': 'ID of the target currency'},
                    'rate': {'type': 'number', 'description': 'Exchange rate value'},
                    'date': {'type': 'string', 'format': 'date', 'description': 'Date of the exchange rate'}
                }
            }
        },
        responses={
            201: OpenApiResponse(
                response=ExchangeRateSerializer,
                description="Exchange rate created successfully"
            ),
            400: OpenApiResponse(
                response=OpenApiTypes.OBJECT,
                description="Bad request"
            )
        }
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

class UserExchangeRateViewSet(viewsets.ModelViewSet):
    serializer_class = UserExchangeRateSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = UserExchangeRate.objects.none()  # Default queryset for schema generation

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return UserExchangeRate.objects.none()
        return UserExchangeRate.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @extend_schema(
        summary="List user exchange rates",
        description="Get a list of all user-specific exchange rates",
        responses={200: UserExchangeRateSerializer(many=True)},
        examples=[
            OpenApiExample(
                'Success Response',
                value=[
                    {
                        'id': 'uuid',
                        'from_currency': {
                            'id': 'uuid',
                            'code': 'USD',
                            'name': 'US Dollar',
                            'symbol': '$'
                        },
                        'to_currency': {
                            'id': 'uuid',
                            'code': 'EUR',
                            'name': 'Euro',
                            'symbol': '€'
                        },
                        'rate': '0.85',
                        'date': '2024-03-20',
                        'is_active': True,
                        'created_at': '2024-03-20T12:00:00Z',
                        'updated_at': '2024-03-20T12:00:00Z'
                    }
                ],
                status_codes=['200']
            ),
        ]
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(
        summary="Create user exchange rate",
        description="Create a new user-specific exchange rate",
        request={
            'application/json': {
                'type': 'object',
                'required': ['from_currency_id', 'to_currency_id', 'rate', 'date'],
                'properties': {
                    'from_currency_id': {'type': 'string', 'format': 'uuid', 'description': 'ID of the source currency'},
                    'to_currency_id': {'type': 'string', 'format': 'uuid', 'description': 'ID of the target currency'},
                    'rate': {'type': 'number', 'description': 'Exchange rate value'},
                    'date': {'type': 'string', 'format': 'date', 'description': 'Date of the exchange rate'}
                }
            }
        },
        responses={
            201: OpenApiResponse(
                response=UserExchangeRateSerializer,
                description="User exchange rate created successfully"
            ),
            400: OpenApiResponse(
                response=OpenApiTypes.OBJECT,
                description="Bad request"
            )
        }
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)
