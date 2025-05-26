from rest_framework import serializers
from .models import Currency, Account, ExchangeRate, UserExchangeRate
from decimal import Decimal

class CurrencySerializer(serializers.ModelSerializer):
    class Meta:
        model = Currency
        fields = ['id', 'code', 'name', 'symbol', 'decimal_places', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class AccountSerializer(serializers.ModelSerializer):
    currency = CurrencySerializer(read_only=True)
    currency_id = serializers.UUIDField(write_only=True)
    initial_balance = serializers.DecimalField(max_digits=15, decimal_places=2, required=True)

    class Meta:
        model = Account
        fields = ['id', 'name', 'type', 'currency', 'currency_id', 'initial_balance', 'current_balance', 'base_currency_balance', 'created_at', 'updated_at']
        read_only_fields = ['id', 'current_balance', 'base_currency_balance', 'created_at', 'updated_at']

    def validate_currency_id(self, value):
        try:
            Currency.objects.get(id=value)
            return value
        except Currency.DoesNotExist:
            raise serializers.ValidationError("Invalid currency ID")

    def create(self, validated_data):
        # Set current_balance and base_currency_balance to initial_balance
        validated_data['current_balance'] = validated_data['initial_balance']
        validated_data['base_currency_balance'] = validated_data['initial_balance']
        return super().create(validated_data)

class ExchangeRateSerializer(serializers.ModelSerializer):
    from_currency = CurrencySerializer(read_only=True)
    to_currency = CurrencySerializer(read_only=True)
    from_currency_id = serializers.UUIDField(write_only=True)
    to_currency_id = serializers.UUIDField(write_only=True)
    date = serializers.DateField(required=True)
    rate = serializers.DecimalField(max_digits=15, decimal_places=6, min_value=Decimal('0.000001'))

    class Meta:
        model = ExchangeRate
        fields = ['id', 'from_currency', 'to_currency', 'from_currency_id', 'to_currency_id', 
                 'rate', 'date', 'is_manual', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, data):
        if data['from_currency_id'] == data['to_currency_id']:
            raise serializers.ValidationError("From and to currencies must be different")
        
        # Validate rate is within reasonable bounds (e.g., between 0.000001 and 1000000)
        rate = data['rate']
        if rate < Decimal('0.000001') or rate > Decimal('1000000'):
            raise serializers.ValidationError("Exchange rate must be between 0.000001 and 1000000")
        
        return data

    def validate_from_currency_id(self, value):
        try:
            Currency.objects.get(id=value)
            return value
        except Currency.DoesNotExist:
            raise serializers.ValidationError("Invalid from currency ID")

    def validate_to_currency_id(self, value):
        try:
            Currency.objects.get(id=value)
            return value
        except Currency.DoesNotExist:
            raise serializers.ValidationError("Invalid to currency ID")

class UserExchangeRateSerializer(serializers.ModelSerializer):
    from_currency = CurrencySerializer(read_only=True)
    to_currency = CurrencySerializer(read_only=True)
    from_currency_id = serializers.UUIDField(write_only=True)
    to_currency_id = serializers.UUIDField(write_only=True)
    date = serializers.DateField(required=True)
    rate = serializers.DecimalField(max_digits=15, decimal_places=6, min_value=Decimal('0.000001'))

    class Meta:
        model = UserExchangeRate
        fields = ['id', 'from_currency', 'to_currency', 'from_currency_id', 'to_currency_id', 
                 'rate', 'date', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, data):
        if data['from_currency_id'] == data['to_currency_id']:
            raise serializers.ValidationError("From and to currencies must be different")
        
        # Validate rate is within reasonable bounds (e.g., between 0.000001 and 1000000)
        rate = data['rate']
        if rate < Decimal('0.000001') or rate > Decimal('1000000'):
            raise serializers.ValidationError("Exchange rate must be between 0.000001 and 1000000")
        
        return data

    def validate_from_currency_id(self, value):
        try:
            Currency.objects.get(id=value)
            return value
        except Currency.DoesNotExist:
            raise serializers.ValidationError("Invalid from currency ID")

    def validate_to_currency_id(self, value):
        try:
            Currency.objects.get(id=value)
            return value
        except Currency.DoesNotExist:
            raise serializers.ValidationError("Invalid to currency ID") 