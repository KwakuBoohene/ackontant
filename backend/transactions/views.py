from django.shortcuts import render
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Q
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse
from django.db import transaction
from django.utils import timezone
from decimal import Decimal
from .models import Transaction, Category, Tag, Transfer
from .serializers import (
    TransactionSerializer, CategorySerializer, TagSerializer,
    TransferSerializer, TransferCreateSerializer
)
from accounts.models import Account, Currency, UserExchangeRate
from .services import BalanceService
from django.core.exceptions import ValidationError

# Create your views here.

class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['type', 'category', 'is_recurring', 'is_archived']
    search_fields = ['description']
    ordering_fields = ['date', 'amount', 'created_at']
    ordering = ['-date', '-created_at']
    queryset = Transaction.objects.none()  # Required for schema generation

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name='account_id',
                type=str,
                description='Filter transactions by account ID'
            ),
            OpenApiParameter(
                name='start_date',
                type=str,
                description='Filter transactions from this date (YYYY-MM-DD)'
            ),
            OpenApiParameter(
                name='end_date',
                type=str,
                description='Filter transactions until this date (YYYY-MM-DD)'
            ),
            OpenApiParameter(
                name='type',
                type=str,
                description='Filter by transaction type (INCOME, EXPENSE, TRANSFER)'
            ),
            OpenApiParameter(
                name='category',
                type=str,
                description='Filter by category ID'
            ),
            OpenApiParameter(
                name='tag_ids',
                type=str,
                description='Filter by tag IDs (can be multiple)'
            ),
            OpenApiParameter(
                name='search',
                type=str,
                description='Search in transaction description'
            ),
            OpenApiParameter(
                name='ordering',
                type=str,
                description='Order results by field (date, amount, created_at)'
            ),
        ],
        responses={
            200: TransactionSerializer(many=True),
            401: OpenApiResponse(description="Unauthorized"),
        }
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name='id',
                type=int,
                location=OpenApiParameter.PATH,
                description='Transaction ID'
            )
        ],
        responses={
            200: TransactionSerializer,
            401: OpenApiResponse(description="Unauthorized"),
            404: OpenApiResponse(description="Not Found"),
        }
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Transaction.objects.none()
            
        queryset = Transaction.objects.filter(user=self.request.user)
        
        # Filter by account if account_id is provided
        account_id = self.request.query_params.get('account_id')
        if account_id:
            queryset = queryset.filter(account_id=account_id)
        
        # Filter by date range if provided
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
        
        # Filter by tags if provided
        tag_ids = self.request.query_params.getlist('tag_ids')
        if tag_ids:
            queryset = queryset.filter(tags__id__in=tag_ids).distinct()
        
        return queryset

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name='start_date',
                type=str,
                description='Get statistics from this date (YYYY-MM-DD)'
            ),
            OpenApiParameter(
                name='end_date',
                type=str,
                description='Get statistics until this date (YYYY-MM-DD)'
            ),
        ],
        description='Get transaction statistics including total income, expenses, and top categories',
        responses={
            200: OpenApiResponse(description="Transaction statistics"),
            401: OpenApiResponse(description="Unauthorized"),
        }
    )
    @action(detail=False, methods=['get'])
    def stats(self, request):
        queryset = self.get_queryset()
        
        # Get date range from query params or default to last 30 days
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
        
        # Calculate total income and expenses
        income = queryset.filter(type='INCOME').aggregate(total=Sum('amount'))['total'] or 0
        expenses = queryset.filter(type='EXPENSE').aggregate(total=Sum('amount'))['total'] or 0
        
        # Get top categories
        top_categories = queryset.values('category__name').annotate(
            total=Sum('amount')
        ).order_by('-total')[:5]
        
        return Response({
            'total_income': income,
            'total_expenses': expenses,
            'net_amount': income - expenses,
            'top_categories': top_categories
        })

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Create transaction
        transaction = serializer.save(user=request.user)
        
        # Get allow_negative flag from request
        allow_negative = request.data.get('allow_negative', False)
        
        try:
            # Process transaction and update balances
            BalanceService.process_transaction(transaction, allow_negative)
        except ValidationError as e:
            transaction.delete()
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response(
            TransactionSerializer(transaction).data,
            status=status.HTTP_201_CREATED
        )

    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        transaction = self.get_object()
        
        # Get allow_negative flag from request
        allow_negative = request.data.get('allow_negative', False)
        
        try:
            # Reverse transaction and update balances
            BalanceService.reverse_transaction(transaction, allow_negative)
        except ValidationError as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Delete transaction
        transaction.delete()
        
        return Response(status=status.HTTP_204_NO_CONTENT)

class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['name', 'type']
    ordering = ['type', 'name']
    queryset = Category.objects.none()  # Required for schema generation

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name='id',
                type=int,
                location=OpenApiParameter.PATH,
                description='Category ID'
            )
        ],
        responses={
            200: CategorySerializer,
            401: OpenApiResponse(description="Unauthorized"),
            404: OpenApiResponse(description="Not Found"),
        }
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Category.objects.none()
        return Category.objects.filter(user=self.request.user)

class TagViewSet(viewsets.ModelViewSet):
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['name']
    ordering = ['name']
    queryset = Tag.objects.none()  # Required for schema generation

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name='id',
                type=int,
                location=OpenApiParameter.PATH,
                description='Tag ID'
            )
        ],
        responses={
            200: TagSerializer,
            401: OpenApiResponse(description="Unauthorized"),
            404: OpenApiResponse(description="Not Found"),
        }
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Tag.objects.none()
        return Tag.objects.filter(user=self.request.user)

class TransferViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = TransferSerializer

    def get_queryset(self):
        return Transfer.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == 'create':
            return TransferCreateSerializer
        return TransferSerializer

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Get accounts and currencies
        source_account = Account.objects.get(id=data['source_account_id'])
        destination_account = Account.objects.get(id=data['destination_account_id'])
        source_currency = Currency.objects.get(id=data['source_currency_id'])
        destination_currency = Currency.objects.get(id=data['destination_currency_id'])

        # Validate account ownership
        if source_account.user != request.user or destination_account.user != request.user:
            return Response(
                {"detail": "You don't have permission to access these accounts"},
                status=status.HTTP_403_FORBIDDEN
            )

        # Get allow_negative flag from request
        allow_negative = request.data.get('allow_negative', False)

        try:
            # Check for sufficient funds
            BalanceService.check_negative_balance(
                source_account,
                data['amount'],
                source_currency,
                data['exchange_rate'],
                allow_negative
            )
        except ValidationError as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Determine rate source and get exchange rate
        rate_source = 'USER'
        exchange_rate = data['exchange_rate']
        user_exchange_rate = None

        if 'user_exchange_rate_id' in data and data['user_exchange_rate_id']:
            user_exchange_rate = UserExchangeRate.objects.get(id=data['user_exchange_rate_id'])
            if user_exchange_rate.user != request.user:
                return Response(
                    {"detail": "Invalid user exchange rate"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            rate_source = 'USER'
        else:
            rate_source = 'PLATFORM'

        # Calculate destination amount and base currency amount
        destination_amount = data['amount'] * exchange_rate
        base_currency_amount = data['amount'] * exchange_rate  # Assuming GHS is base currency

        # Create transfer record
        transfer = Transfer.objects.create(
            user=request.user,
            source_account=source_account,
            destination_account=destination_account,
            amount=data['amount'],
            source_currency=source_currency,
            destination_currency=destination_currency,
            exchange_rate=exchange_rate,
            base_currency_amount=base_currency_amount,
            date=data['date'],
            description=data['description'],
            rate_source=rate_source,
            user_exchange_rate=user_exchange_rate
        )

        # Create source transaction (expense)
        source_transaction = Transaction.objects.create(
            user=request.user,
            account=source_account,
            type='EXPENSE',
            amount=data['amount'],
            currency=source_currency,
            base_currency_amount=base_currency_amount,
            exchange_rate=exchange_rate,
            description=f"Transfer to {destination_account.name}: {data['description']}",
            date=data['date'],
            transfer=transfer
        )

        # Create destination transaction (income)
        destination_transaction = Transaction.objects.create(
            user=request.user,
            account=destination_account,
            type='INCOME',
            amount=destination_amount,
            currency=destination_currency,
            base_currency_amount=base_currency_amount,
            exchange_rate=exchange_rate,
            description=f"Transfer from {source_account.name}: {data['description']}",
            date=data['date'],
            transfer=transfer
        )

        # Update transfer with transaction references
        transfer.source_transaction = source_transaction
        transfer.destination_transaction = destination_transaction
        transfer.status = 'COMPLETED'
        transfer.save()

        try:
            # Process transfer and update balances
            BalanceService.process_transfer(transfer, allow_negative)
        except ValidationError as e:
            # Clean up created objects if balance update fails
            transfer.delete()
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(
            TransferSerializer(transfer).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        transfer = self.get_object()
        
        if transfer.status != 'COMPLETED':
            return Response(
                {"detail": "Only completed transfers can be cancelled"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get allow_negative flag from request
        allow_negative = request.data.get('allow_negative', False)

        with transaction.atomic():
            try:
                # Reverse the transfer and update balances
                BalanceService.reverse_transfer(transfer, allow_negative)
            except ValidationError as e:
                return Response(
                    {"detail": str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Delete the transactions
            if transfer.source_transaction:
                transfer.source_transaction.delete()
            if transfer.destination_transaction:
                transfer.destination_transaction.delete()

            # Update transfer status
            transfer.status = 'CANCELLED'
            transfer.save()

        return Response(
            TransferSerializer(transfer).data,
            status=status.HTTP_200_OK
        )
