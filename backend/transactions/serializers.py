from rest_framework import serializers
from .models import Transaction, Category, Tag

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'type', 'color', 'icon', 'is_active']
        read_only_fields = ['id']

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'color', 'is_active']
        read_only_fields = ['id']

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
    account = serializers.SerializerMethodField()

    class Meta:
        model = Transaction
        fields = [
            'id', 'type', 'amount', 'currency', 'base_currency_amount',
            'exchange_rate', 'description', 'date', 'category', 'category_id',
            'tags', 'tag_ids', 'is_recurring', 'recurring_rule', 'is_archived',
            'account', 'created_at', 'updated_at'
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

    def create(self, validated_data):
        tag_ids = validated_data.pop('tag_ids', [])
        category_id = validated_data.pop('category_id', None)
        
        # Set user from request
        validated_data['user'] = self.context['request'].user
        
        # Set category if provided
        if category_id:
            validated_data['category'] = Category.objects.get(id=category_id)
        
        # Create transaction
        transaction = Transaction.objects.create(**validated_data)
        
        # Add tags if provided
        if tag_ids:
            transaction.tags.set(tag_ids)
        
        return transaction

    def update(self, instance, validated_data):
        tag_ids = validated_data.pop('tag_ids', None)
        category_id = validated_data.pop('category_id', None)
        
        # Update category if provided
        if category_id is not None:
            instance.category = Category.objects.get(id=category_id) if category_id else None
        
        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        
        # Update tags if provided
        if tag_ids is not None:
            instance.tags.set(tag_ids)
        
        return instance 