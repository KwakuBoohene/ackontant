from django.shortcuts import render
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Q
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse
from .models import Transaction, Category, Tag
from .serializers import TransactionSerializer, CategorySerializer, TagSerializer

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
