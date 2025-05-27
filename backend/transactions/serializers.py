from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from typing import Dict, Any, List, Optional
from .models import Transaction, Category, Tag, Transfer
from accounts.models import Account, Currency, UserExchangeRate
from accounts.serializers import AccountSerializer, CurrencySerializer

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'type', 'color', 'icon', 'is_active']
        read_only_fields = ['id']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'color', 'is_active']
        read_only_fields = ['id']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class TransferSerializer(serializers.ModelSerializer):
    source_account = AccountSerializer(read_only=True)
    destination_account = AccountSerializer(read_only=True)
    source_currency = CurrencySerializer(read_only=True)
    destination_currency = CurrencySerializer(read_only=True)
    source_transaction = serializers.PrimaryKeyRelatedField(read_only=True)
    destination_transaction = serializers.PrimaryKeyRelatedField(read_only=True)
    user_exchange_rate = serializers.PrimaryKeyRelatedField(
        queryset=UserExchangeRate.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = Transfer
        fields = [
            'id', 'user', 'source_account', 'destination_account',
            'amount', 'source_currency', 'destination_currency',
            'exchange_rate', 'base_currency_amount', 'date',
            'description', 'status', 'source_transaction',
            'destination_transaction', 'rate_source', 'user_exchange_rate',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'status', 'source_transaction', 'destination_transaction']

class TransferCreateSerializer(serializers.ModelSerializer):
    source_account_id = serializers.UUIDField(write_only=True)
    destination_account_id = serializers.UUIDField(write_only=True)
    source_currency_id = serializers.UUIDField(write_only=True)
    destination_currency_id = serializers.UUIDField(write_only=True)
    user_exchange_rate_id = serializers.UUIDField(required=False, allow_null=True)

    class Meta:
        model = Transfer
        fields = [
            'source_account_id', 'destination_account_id',
            'amount', 'source_currency_id', 'destination_currency_id',
            'exchange_rate', 'date', 'description', 'user_exchange_rate_id'
        ]

    def validate(self, data):
        # Ensure source and destination accounts are different
        if data['source_account_id'] == data['destination_account_id']:
            raise serializers.ValidationError("Source and destination accounts must be different")

        # Validate amount is positive
        if data['amount'] <= 0:
            raise serializers.ValidationError("Amount must be positive")

        # Validate exchange rate is positive
        if data['exchange_rate'] <= 0:
            raise serializers.ValidationError("Exchange rate must be positive")

        return data

class TransactionSerializer(serializers.ModelSerializer):
    account = AccountSerializer(read_only=True)
    currency = CurrencySerializer(read_only=True)
    category = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        required=False,
        allow_null=True
    )
    tags = serializers.PrimaryKeyRelatedField(
        queryset=Tag.objects.all(),
        many=True,
        required=False
    )
    transfer = TransferSerializer(read_only=True)

    class Meta:
        model = Transaction
        fields = [
            'id', 'user', 'account', 'type', 'amount',
            'currency', 'base_currency_amount', 'exchange_rate',
            'description', 'date', 'category', 'tags',
            'is_recurring', 'recurring_rule', 'is_archived',
            'transfer', 'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'base_currency_amount']

    @extend_schema_field({
        'type': 'object',
        'properties': {
            'id': {'type': 'string', 'format': 'uuid'},
            'code': {'type': 'string'},
            'name': {'type': 'string'},
            'symbol': {'type': 'string'}
        }
    })
    def get_currency(self, obj: Transaction) -> Dict[str, Any]:
        return {
            'id': obj.currency.id,
            'code': obj.currency.code,
            'name': obj.currency.name,
            'symbol': obj.currency.symbol
        }

    @extend_schema_field({
        'type': 'object',
        'properties': {
            'id': {'type': 'string', 'format': 'uuid'},
            'name': {'type': 'string'},
            'type': {'type': 'string'}
        }
    })
    def get_account(self, obj: Transaction) -> Dict[str, Any]:
        return {
            'id': obj.account.id,
            'name': obj.account.name,
            'type': obj.account.type
        }

    def validate_account_id(self, value: str) -> str:
        try:
            Account.objects.get(id=value, user=self.context['request'].user)
        except Account.DoesNotExist:
            raise serializers.ValidationError("Account not found")
        return value

    def validate_currency_id(self, value: str) -> str:
        try:
            Currency.objects.get(id=value)
        except Currency.DoesNotExist:
            raise serializers.ValidationError("Currency not found")
        return value

    def validate_category_id(self, value: Optional[str]) -> Optional[str]:
        if value:
            try:
                Category.objects.get(id=value, user=self.context['request'].user)
            except Category.DoesNotExist:
                raise serializers.ValidationError("Category not found")
        return value

    def validate_tag_ids(self, value: List[str]) -> List[str]:
        if value:
            tags = Tag.objects.filter(id__in=value, user=self.context['request'].user)
            if len(tags) != len(value):
                raise serializers.ValidationError("One or more tags not found")
        return value

    def validate(self, data: Dict[str, Any]) -> Dict[str, Any]:
        # Ensure required fields are present
        required_fields = ['type', 'amount', 'currency_id', 'description', 'date', 'account_id']
        for field in required_fields:
            if field not in data or data[field] in [None, '']:
                raise serializers.ValidationError({field: f"{field} is required"})
        return data

    def create(self, validated_data: Dict[str, Any]) -> Transaction:
        tag_ids = validated_data.pop('tag_ids', [])
        category_id = validated_data.pop('category_id', None)
        account_id = validated_data.pop('account_id', None)
        currency_id = validated_data.pop('currency_id', None)
        
        # Set user from request
        validated_data['user'] = self.context['request'].user
        
        # Set account from account_id
        if account_id:
            validated_data['account'] = Account.objects.get(id=account_id)
        else:
            raise serializers.ValidationError({'account_id': 'account_id is required'})
        
        # Set currency from currency_id
        if currency_id:
            validated_data['currency'] = Currency.objects.get(id=currency_id)
        else:
            raise serializers.ValidationError({'currency_id': 'currency_id is required'})
        
        # Set category if provided
        if category_id:
            validated_data['category'] = Category.objects.get(id=category_id)
        
        # Set base_currency_amount and exchange_rate defaults if not provided
        if 'base_currency_amount' not in validated_data or validated_data.get('base_currency_amount') is None:
            validated_data['base_currency_amount'] = validated_data['amount']
        if 'exchange_rate' not in validated_data or validated_data.get('exchange_rate') is None:
            validated_data['exchange_rate'] = 1
        
        # Create transaction
        transaction = Transaction.objects.create(**validated_data)
        
        # Add tags if provided
        if tag_ids:
            transaction.tags.set(tag_ids)
        
        return transaction

    def update(self, instance: Transaction, validated_data: Dict[str, Any]) -> Transaction:
        tag_ids = validated_data.pop('tag_ids', None)
        category_id = validated_data.pop('category_id', None)
        currency_id = validated_data.pop('currency_id', None)
        
        # Update category if provided
        if category_id is not None:
            instance.category = Category.objects.get(id=category_id) if category_id else None
            
        # Update currency if provided
        if currency_id is not None:
            instance.currency = Currency.objects.get(id=currency_id)
        
        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        
        # Update tags if provided
        if tag_ids is not None:
            instance.tags.set(tag_ids)
        
        return instance 