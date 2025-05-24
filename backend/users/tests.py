from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient, APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import SocialAuth, User
import jwt
from django.conf import settings
from datetime import datetime, timedelta
from .serializers import RegisterSerializer

User = get_user_model()

class AuthenticationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = reverse('register')
        self.verify_email_url = reverse('verify-email')
        self.resend_verification_url = reverse('resend-verification')
        self.forgot_password_url = reverse('forgot-password')
        self.reset_password_url = reverse('reset-password')
        self.token_url = reverse('token_obtain_pair')
        self.token_refresh_url = reverse('token_refresh')

        # Test user data
        self.user_data = {
            'email': 'test@example.com',
            'username': 'testuser',
            'password': 'TestPass123!',
            'password2': 'TestPass123!',
            'first_name': 'Test',
            'last_name': 'User'
        }

    def test_user_registration(self):
        """Test user registration endpoint"""
        response = self.client.post(self.register_url, self.user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 1)
        self.assertEqual(User.objects.get().email, 'test@example.com')
        self.assertFalse(User.objects.get().is_email_verified)

    def test_user_registration_invalid_data(self):
        """Test user registration with invalid data"""
        # Test password mismatch
        invalid_data = self.user_data.copy()
        invalid_data['password2'] = 'DifferentPass123!'
        response = self.client.post(self.register_url, invalid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Test missing required fields
        invalid_data = self.user_data.copy()
        del invalid_data['email']
        response = self.client.post(self.register_url, invalid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_email_verification(self):
        """Test email verification endpoint"""
        # Create user
        user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='TestPass123!'
        )
        
        # Generate verification token
        token = jwt.encode(
            {
                'user_id': user.id,
                'exp': datetime.utcnow() + timedelta(hours=24)
            },
            settings.SECRET_KEY,
            algorithm='HS256'
        )
        user.email_verification_token = token
        user.save()

        # Verify email
        response = self.client.post(
            self.verify_email_url,
            {'token': token},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertTrue(user.is_email_verified)

    def test_email_verification_invalid_token(self):
        """Test email verification with invalid token"""
        response = self.client.post(
            self.verify_email_url,
            {'token': 'invalid_token'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_resend_verification(self):
        """Test resend verification email endpoint"""
        # Create unverified user
        user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='TestPass123!'
        )
        
        # Login user
        self.client.force_authenticate(user=user)
        
        # Request resend verification
        response = self.client.post(self.resend_verification_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertIsNotNone(user.email_verification_token)

    def test_forgot_password(self):
        """Test forgot password endpoint"""
        # Create user
        user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='TestPass123!'
        )
        
        # Request password reset
        response = self.client.post(
            self.forgot_password_url,
            {'email': 'test@example.com'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertIsNotNone(user.password_reset_token)

    def test_reset_password(self):
        """Test reset password endpoint"""
        # Create user
        user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='TestPass123!'
        )
        
        # Generate reset token
        token = jwt.encode(
            {
                'user_id': user.id,
                'exp': datetime.utcnow() + timedelta(hours=1)
            },
            settings.SECRET_KEY,
            algorithm='HS256'
        )
        user.password_reset_token = token
        user.save()

        # Reset password
        new_password_data = {
            'token': token,
            'password': 'NewPass123!',
            'password2': 'NewPass123!'
        }
        response = self.client.post(
            self.reset_password_url,
            new_password_data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify new password works
        login_data = {
            'username': 'test@example.com',
            'password': 'NewPass123!'
        }
        response = self.client.post(self.token_url, login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_jwt_token_obtain(self):
        """Test JWT token obtain endpoint"""
        # Create user
        user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='TestPass123!'
        )
        
        # Get token
        login_data = {
            'username': 'test@example.com',
            'password': 'TestPass123!'
        }
        response = self.client.post(self.token_url, login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_jwt_token_refresh(self):
        """Test JWT token refresh endpoint"""
        # Create user and get initial tokens
        user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='TestPass123!'
        )
        login_data = {
            'username': 'test@example.com',
            'password': 'TestPass123!'
        }
        response = self.client.post(self.token_url, login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        refresh_token = response.data['refresh']

        # Refresh token
        response = self.client.post(
            self.token_refresh_url,
            {'refresh': refresh_token},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

class SocialAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.social_auth_url = reverse('social-auth', kwargs={'provider': 'GOOGLE'})
        self.test_provider_data = {
            'provider_user_id': '123456789',
            'provider_email': 'test@example.com',
            'provider_picture': 'https://example.com/picture.jpg'
        }

    def test_social_auth_new_user(self):
        """Test social authentication for new user"""
        response = self.client.post(
            self.social_auth_url,
            self.test_provider_data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(User.objects.count(), 1)
        self.assertEqual(SocialAuth.objects.count(), 1)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('user', response.data)

    def test_social_auth_existing_user(self):
        """Test social authentication for existing user"""
        # Create user and social auth
        user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='TestPass123!'
        )
        SocialAuth.objects.create(
            user=user,
            provider='GOOGLE',
            provider_user_id=self.test_provider_data['provider_user_id'],
            provider_email=self.test_provider_data['provider_email'],
            provider_picture=self.test_provider_data['provider_picture']
        )

        # Test social auth
        response = self.client.post(
            self.social_auth_url,
            self.test_provider_data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(User.objects.count(), 1)
        self.assertEqual(SocialAuth.objects.count(), 1)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('user', response.data)

class RegistrationTests(APITestCase):
    def test_register_success(self):
        url = reverse('auth-register')
        data = {
            'email': 'test@example.com',
            'password': 'P@ssword@1',
            'confirm_password': 'P@ssword@1'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email='test@example.com').exists())

    def test_register_invalid_data(self):
        url = reverse('auth-register')
        data = {
            'email': 'invalid-email',
            'password': 'P@ssword@1',
            'confirm_password': 'P@ssword@1'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_password_mismatch(self):
        url = reverse('auth-register')
        data = {
            'email': 'test@example.com',
            'password': 'P@ssword@1',
            'confirm_password': 'P@ssword@2'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_verify_email(self):
        # First register a user
        register_url = reverse('auth-register')
        register_data = {
            'email': 'test@example.com',
            'password': 'P@ssword@1',
            'confirm_password': 'P@ssword@1'
        }
        self.client.post(register_url, register_data, format='json')
        user = User.objects.get(email='test@example.com')
        token = user.email_verification_token

        # Now verify the email
        verify_url = reverse('auth-verify-email')
        verify_data = {'token': token}
        response = self.client.post(verify_url, verify_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertTrue(user.is_email_verified)
