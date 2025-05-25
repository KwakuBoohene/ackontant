from rest_framework import serializers
from .models import Transaction, Category, Tag
from accounts.models import Account, Currency

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

class TransactionSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True,
        required=False
    )
    currency = serializers.SerializerMethodField()
    currency_id = serializers.UUIDField(write_only=True, required=True)
    account = serializers.SerializerMethodField()
    account_id = serializers.UUIDField(write_only=True, required=True)

    class Meta:
        model = Transaction
        fields = [
            'id', 'type', 'amount', 'currency', 'currency_id', 'base_currency_amount',
            'exchange_rate', 'description', 'date', 'category', 'category_id',
            'tags', 'tag_ids', 'is_recurring', 'recurring_rule', 'is_archived',
            'account', 'account_id', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'base_currency_amount', 'exchange_rate']

    def get_currency(self, obj):
        return {
            'id': obj.currency.id,
            'code': obj.currency.code,
            'name': obj.currency.name,
            'symbol': obj.currency.symbol
        }

    def get_account(self, obj):
        return {
            'id': obj.account.id,
            'name': obj.account.name,
            'type': obj.account.type
        }

    def validate_account_id(self, value):
        try:
            Account.objects.get(id=value, user=self.context['request'].user)
        except Account.DoesNotExist:
            raise serializers.ValidationError("Account not found")
        return value

    def validate_currency_id(self, value):
        try:
            Currency.objects.get(id=value)
        except Currency.DoesNotExist:
            raise serializers.ValidationError("Currency not found")
        return value

    def validate_category_id(self, value):
        if value:
            try:
                Category.objects.get(id=value, user=self.context['request'].user)
            except Category.DoesNotExist:
                raise serializers.ValidationError("Category not found")
        return value

    def validate_tag_ids(self, value):
        if value:
            tags = Tag.objects.filter(id__in=value, user=self.context['request'].user)
            if len(tags) != len(value):
                raise serializers.ValidationError("One or more tags not found")
        return value

    def validate(self, data):
        # Ensure required fields are present
        required_fields = ['type', 'amount', 'currency_id', 'description', 'date', 'account_id']
        for field in required_fields:
            if field not in data or data[field] in [None, '']:
                raise serializers.ValidationError({field: f"{field} is required"})
        return data

    def create(self, validated_data):
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

    def update(self, instance, validated_data):
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