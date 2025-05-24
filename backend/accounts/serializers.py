from rest_framework import serializers
from .models import Currency, Account, ExchangeRate

class CurrencySerializer(serializers.ModelSerializer):
    class Meta:
        model = Currency
        fields = ['id', 'code', 'name', 'symbol', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class AccountSerializer(serializers.ModelSerializer):
    currency = CurrencySerializer(read_only=True)
    currency_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = Account
        fields = ['id', 'name', 'type', 'currency', 'currency_id', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_currency_id(self, value):
        try:
            Currency.objects.get(id=value)
            return value
        except Currency.DoesNotExist:
            raise serializers.ValidationError("Invalid currency ID")

class ExchangeRateSerializer(serializers.ModelSerializer):
    from_currency = CurrencySerializer(read_only=True)
    to_currency = CurrencySerializer(read_only=True)
    from_currency_id = serializers.UUIDField(write_only=True)
    to_currency_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = ExchangeRate
        fields = ['id', 'from_currency', 'to_currency', 'from_currency_id', 'to_currency_id', 'rate', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, data):
        if data['from_currency_id'] == data['to_currency_id']:
            raise serializers.ValidationError("From and to currencies must be different")
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