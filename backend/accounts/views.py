from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiExample
from .models import Currency, Account, ExchangeRate
from .serializers import CurrencySerializer, AccountSerializer, ExchangeRateSerializer

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
        request=AccountSerializer,
        responses={201: AccountSerializer, 400: None},
        examples=[
            OpenApiExample(
                'Success Response',
                value={
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
                },
                status_codes=['201']
            ),
        ]
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
        return ExchangeRate.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @extend_schema(
        summary="List exchange rates",
        description="Get a list of all exchange rates for the current user",
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
        request=ExchangeRateSerializer,
        responses={201: ExchangeRateSerializer, 400: None},
        examples=[
            OpenApiExample(
                'Success Response',
                value={
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
                    'created_at': '2024-03-20T12:00:00Z',
                    'updated_at': '2024-03-20T12:00:00Z'
                },
                status_codes=['201']
            ),
        ]
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)
