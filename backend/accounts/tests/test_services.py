from decimal import Decimal
from datetime import date
from django.test import TestCase
from django.contrib.auth import get_user_model
from unittest.mock import patch, MagicMock
from ..models import Currency, ExchangeRate
from ..services import ExchangeRateService
from ..currency_data import CURRENCY_NAMES

User = get_user_model()

class ExchangeRateServiceTests(TestCase):
    def setUp(self):
        """Set up test data."""
        self.service = ExchangeRateService()
        self.mock_api_response = {
            'success': True,
            'rates': {
                'GHS': '15.0',  # EUR to GHS rate
                'USD': '1.1',   # EUR to USD rate
                'EUR': '1.0',   # EUR to EUR rate
                'GBP': '0.85',  # EUR to GBP rate
            }
        }

    @patch('accounts.services.ExchangeRateService._make_api_request')
    def test_currency_names_are_updated(self, mock_api_request):
        """Test that currency names are properly updated in the database."""
        # Mock the API response
        mock_api_request.return_value = self.mock_api_response

        # Run the update
        self.service.update_exchange_rates()

        # Verify currencies exist with correct names
        for code in ['GHS', 'USD', 'EUR', 'GBP']:
            currency = Currency.objects.get(code=code)
            self.assertEqual(currency.name, CURRENCY_NAMES[code])
            self.assertTrue(currency.is_platform_currency)
            self.assertEqual(currency.source, 'system')

    @patch('accounts.services.ExchangeRateService._make_api_request')
    def test_existing_currency_names_are_updated(self, mock_api_request):
        """Test that existing currency names are updated to match CURRENCY_NAMES."""
        # Create a currency with incorrect name
        Currency.objects.create(
            code='USD',
            name='Wrong Name',
            symbol='$',
            is_active=True,
            is_platform_currency=True,
            source='system'
        )

        # Mock the API response
        mock_api_request.return_value = self.mock_api_response

        # Run the update
        self.service.update_exchange_rates()

        # Verify the name was updated
        currency = Currency.objects.get(code='USD')
        self.assertEqual(currency.name, CURRENCY_NAMES['USD'])

    @patch('accounts.services.ExchangeRateService._make_api_request')
    def test_currency_symbols_are_set(self, mock_api_request):
        """Test that currency symbols are properly set."""
        # Mock the API response
        mock_api_request.return_value = self.mock_api_response

        # Run the update
        self.service.update_exchange_rates()

        # Verify symbols
        expected_symbols = {
            'USD': '$',
            'EUR': '€',
            'GBP': '£',
            'GHS': 'GH₵'
        }

        for code, symbol in expected_symbols.items():
            currency = Currency.objects.get(code=code)
            self.assertEqual(currency.symbol, symbol)

    @patch('accounts.services.ExchangeRateService._make_api_request')
    def test_exchange_rates_are_created(self, mock_api_request):
        """Test that exchange rates are created with correct values."""
        # Mock the API response
        mock_api_request.return_value = self.mock_api_response

        # Run the update
        self.service.update_exchange_rates()

        # Get the base currency (GHS)
        ghs_currency = Currency.objects.get(code='GHS')

        # Verify exchange rates
        today = date.today()
        
        # USD rate should be: (EUR/USD) / (EUR/GHS) = 1.1 / 15.0
        usd_rate = ExchangeRate.objects.get(
            from_currency=ghs_currency,
            to_currency__code='USD',
            date=today
        )
        expected_usd_rate = Decimal('1.1') / Decimal('15.0')
        self.assertAlmostEqual(usd_rate.rate, expected_usd_rate, places=6)

        # GBP rate should be: (EUR/GBP) / (EUR/GHS) = 0.85 / 15.0
        gbp_rate = ExchangeRate.objects.get(
            from_currency=ghs_currency,
            to_currency__code='GBP',
            date=today
        )
        expected_gbp_rate = Decimal('0.85') / Decimal('15.0')
        self.assertAlmostEqual(gbp_rate.rate, expected_gbp_rate, places=6)

    @patch('accounts.services.ExchangeRateService._make_api_request')
    def test_currency_creation_with_missing_data(self, mock_api_request):
        """Test handling of currencies not in CURRENCY_NAMES."""
        # Add a currency not in CURRENCY_NAMES to the API response
        self.mock_api_response['rates']['XYZ'] = '1.5'
        mock_api_request.return_value = self.mock_api_response

        # Run the update
        self.service.update_exchange_rates()

        # Verify the currency was created with code as name
        currency = Currency.objects.get(code='XYZ')
        self.assertEqual(currency.name, 'XYZ')
        self.assertTrue(currency.is_platform_currency)
        self.assertEqual(currency.source, 'system')

    def test_ensure_currency_exists(self):
        """Test the ensure_currency_exists method directly."""
        # Test creating a new currency
        currency = self.service.ensure_currency_exists('USD')
        self.assertEqual(currency.name, CURRENCY_NAMES['USD'])
        self.assertEqual(currency.symbol, '$')
        self.assertTrue(currency.is_platform_currency)
        self.assertEqual(currency.source, 'system')

        # Test updating an existing currency
        currency.name = 'Wrong Name'
        currency.save()
        
        updated_currency = self.service.ensure_currency_exists('USD')
        self.assertEqual(updated_currency.name, CURRENCY_NAMES['USD'])
        self.assertEqual(updated_currency.id, currency.id)  # Same currency instance 

    @patch('accounts.services.ExchangeRateService._make_api_request')
    def test_base_currencies_are_initialized(self, mock_api_request):
        """Test that base currencies (GHS and EUR) are initialized before rate updates."""
        # Mock the API response
        mock_api_request.return_value = self.mock_api_response

        # Run the update
        self.service.update_exchange_rates()

        # Verify GHS exists and is properly configured
        ghs = Currency.objects.get(code='GHS')
        self.assertEqual(ghs.name, CURRENCY_NAMES['GHS'])
        self.assertEqual(ghs.symbol, 'GH₵')
        self.assertTrue(ghs.is_platform_currency)
        self.assertEqual(ghs.source, 'system')

        # Verify EUR exists and is properly configured
        eur = Currency.objects.get(code='EUR')
        self.assertEqual(eur.name, CURRENCY_NAMES['EUR'])
        self.assertEqual(eur.symbol, '€')
        self.assertTrue(eur.is_platform_currency)
        self.assertEqual(eur.source, 'system')

        # Verify exchange rates were created
        self.assertTrue(ExchangeRate.objects.filter(from_currency=ghs).exists())
        self.assertEqual(
            ExchangeRate.objects.filter(from_currency=ghs).count(),
            len(self.mock_api_response['rates']) - 1  # -1 for GHS itself
        ) 