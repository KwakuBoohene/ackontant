from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import SocialAuth

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'first_name', 'last_name', 'is_email_verified')
        read_only_fields = ('id', 'is_email_verified')

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    password2 = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ('email', 'username', 'password', 'password2', 'first_name', 'last_name')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        
        # Ensure email and username are the same
        if attrs.get('email') and attrs.get('username') and attrs['email'] != attrs['username']:
            raise serializers.ValidationError({"email": "Email and username must be the same."})
        
        # If only email is provided, use it as username
        if attrs.get('email') and not attrs.get('username'):
            attrs['username'] = attrs['email']
        # If only username is provided, use it as email
        elif attrs.get('username') and not attrs.get('email'):
            attrs['email'] = attrs['username']
            
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user

class SocialAuthSerializer(serializers.ModelSerializer):
    class Meta:
        model = SocialAuth
        fields = ('id', 'provider_user_id', 'provider_email', 'provider_picture')
        read_only_fields = ('id',)

class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField()
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    password2 = serializers.CharField(write_only=True, style={'input_type': 'password'})

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs 