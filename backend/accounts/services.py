import os
import logging
import requests
from datetime import date
from decimal import Decimal
from typing import Optional, Dict, Any, Tuple
from django.conf import settings
from django.db import transaction
from django.db.models import QuerySet
from .models import Currency, ExchangeRate, UserExchangeRate
from .currency_data import CURRENCY_NAMES

# Set up logger
logger = logging.getLogger('accounts.tasks')

class ExchangeRateService:
    """Service for managing exchange rates and currencies."""
    
    BASE_URL = "https://api.exchangeratesapi.io/v1"
    DEFAULT_SYMBOLS = {
        'USD': '$', 'EUR': '€', 'GBP': '£', 'GHS': 'GH₵',
        'JPY': '¥', 'CNY': '¥', 'INR': '₹', 'RUB': '₽',
        'NGN': '₦', 'KES': 'KSh', 'ZAR': 'R', 'AUD': 'A$',
        'CAD': 'C$', 'CHF': 'Fr', 'SGD': 'S$', 'NZD': 'NZ$'
    }
    
    def __init__(self):
        """Initialize the service with API key validation."""
        self.api_key = os.getenv('EXCHANGE_RATE_API_KEY')
        if not self.api_key:
            raise ValueError("EXCHANGE_RATE_API_KEY not found in environment variables")
        logger.info("ExchangeRateService initialized")
    
    def _make_api_request(self, endpoint: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Make an API request to the exchange rate service.
        
        Args:
            endpoint: API endpoint to call
            params: Query parameters for the request
            
        Returns:
            Dict containing the API response
            
        Raises:
            ValueError: If the API returns an error
            Exception: If the request fails
        """
        try:
            response = requests.get(
                f"{self.BASE_URL}/{endpoint}",
                params=params
            )
            response.raise_for_status()
            data = response.json()
            
            if not data.get('success'):
                error_msg = f"API Error: {data.get('error', {}).get('info', 'Unknown error')}"
                logger.error(error_msg)
                raise ValueError(error_msg)
            
            return data
        except requests.RequestException as e:
            error_msg = f"Failed to fetch exchange rates: {str(e)}"
            logger.error(error_msg)
            raise Exception(error_msg)
    
    def fetch_latest_rates(self) -> Dict[str, Any]:
        """
        Fetch latest exchange rates from the API using EUR as base currency.
        
        Returns:
            Dict containing the latest exchange rates
            
        Raises:
            Exception: If the API request fails
        """
        logger.info("Fetching latest exchange rates from API...")
        data = self._make_api_request(
            'latest',
            {'access_key': self.api_key, 'base': 'EUR'}
        )
        logger.info(f"Successfully fetched rates for {len(data['rates'])} currencies")
        return data
    
    def ensure_currency_exists(self, code: str, symbol: Optional[str] = None) -> Currency:
        """
        Ensure a currency exists in the database as a platform currency.
        
        Args:
            code: Currency code (e.g., 'USD', 'EUR')
            symbol: Optional currency symbol
            
        Returns:
            Currency instance
            
        Raises:
            Exception: If currency creation/update fails
        """
        try:
            logger.info(f"Ensuring currency exists: {code}")
            
            full_name = CURRENCY_NAMES.get(code, code)
            symbol = symbol or self.DEFAULT_SYMBOLS.get(code, code)
            
            currency, created = Currency.objects.get_or_create(
                code=code,
                defaults={
                    'name': full_name,
                    'symbol': symbol,
                    'is_active': True,
                    'is_platform_currency': True,
                    'source': 'system'
                }
            )
            
            if created:
                logger.info(f"Created new currency: {code} ({full_name})")
            elif not currency.is_platform_currency:
                logger.info(f"Updating existing currency to platform currency: {code}")
                currency.is_platform_currency = True
                currency.source = 'system'
                currency.name = full_name
                currency.save()
            else:
                logger.info(f"Currency already exists as platform currency: {code}")
                
            return currency
        except Exception as e:
            logger.error(f"Error ensuring currency exists for {code}: {str(e)}")
            raise
    
    def _calculate_ghs_rate(self, eur_rate: Decimal, eur_to_ghs: Decimal) -> Decimal:
        """
        Calculate GHS to target currency rate using EUR as intermediate.
        
        Args:
            eur_rate: EUR to target currency rate
            eur_to_ghs: EUR to GHS rate
            
        Returns:
            GHS to target currency rate
        """
        return eur_rate / eur_to_ghs if eur_rate > 0 else Decimal('0')
    
    def _update_exchange_rate(
        self,
        from_currency: Currency,
        to_currency: Currency,
        rate: Decimal,
        date: date
    ) -> Tuple[ExchangeRate, bool]:
        """
        Create or update an exchange rate.
        
        Args:
            from_currency: Source currency
            to_currency: Target currency
            rate: Exchange rate value
            date: Rate date
            
        Returns:
            Tuple of (ExchangeRate instance, created flag)
        """
        return ExchangeRate.objects.update_or_create(
            from_currency=from_currency,
            to_currency=to_currency,
            date=date,
            defaults={
                'rate': rate,
                'source': 'api'
            }
        )
    
    @transaction.atomic
    def update_exchange_rates(self) -> bool:
        """
        Update platform exchange rates in the database.
        
        Returns:
            True if update was successful
            
        Raises:
            Exception: If update fails
        """
        try:
            logger.info("Starting exchange rate update process...")
            
            rates_data = self.fetch_latest_rates()
            today = date.today()
            logger.info(f"Processing rates for date: {today}")
            
            # Get EUR to GHS rate
            eur_to_ghs = Decimal(str(rates_data['rates'].get('GHS', 0)))
            if eur_to_ghs == 0:
                raise ValueError("Could not get EUR to GHS rate")
            logger.info(f"EUR to GHS rate: {eur_to_ghs}")
            
            # Ensure GHS exists
            ghs_currency = self.ensure_currency_exists('GHS', symbol='GH₵')
            logger.info(f"Base currency (GHS) ensured: {ghs_currency}")
            
            # Update exchange rates
            rates_updated = 0
            for currency_code, eur_rate in rates_data['rates'].items():
                if currency_code == 'GHS':
                    continue
                
                try:
                    currency = self.ensure_currency_exists(
                        currency_code,
                        symbol=self.DEFAULT_SYMBOLS.get(currency_code)
                    )
                    
                    eur_to_target = Decimal(str(eur_rate))
                    ghs_to_target = self._calculate_ghs_rate(eur_to_target, eur_to_ghs)
                    
                    if ghs_to_target > 0:
                        rate, created = self._update_exchange_rate(
                            ghs_currency,
                            currency,
                            ghs_to_target,
                            today
                        )
                        
                        action = "Created" if created else "Updated"
                        logger.info(f"{action} exchange rate: {ghs_currency.code}/{currency.code} = {ghs_to_target}")
                        rates_updated += 1
                        
                except Exception as e:
                    logger.error(f"Error processing currency {currency_code}: {str(e)}")
                    continue
            
            logger.info(f"Exchange rate update completed. Updated {rates_updated} rates.")
            return True
            
        except Exception as e:
            error_msg = f"Failed to update exchange rates: {str(e)}"
            logger.error(error_msg)
            raise Exception(error_msg)
    
    def get_exchange_rate(
        self,
        from_currency: Currency,
        to_currency: Currency,
        user: Optional[Any] = None,
        date: Optional[date] = None
    ) -> Optional[ExchangeRate]:
        """
        Get exchange rate between two currencies.
        
        Args:
            from_currency: Source currency
            to_currency: Target currency
            user: Optional user for user-specific rates
            date: Optional date for the rate
            
        Returns:
            ExchangeRate instance or None if not found
        """
        if date is None:
            date = date.today()
        
        try:
            logger.info(f"Getting exchange rate for {from_currency.code}/{to_currency.code} on {date}")
            
            # Try user-specific rate first
            if user:
                user_rate = self._get_user_rate(user, from_currency, to_currency, date)
                if user_rate:
                    return user_rate
            
            # Fall back to platform rate
            return self._get_platform_rate(from_currency, to_currency, date)
            
        except Exception as e:
            error_msg = f"Failed to get exchange rate: {str(e)}"
            logger.error(error_msg)
            raise Exception(error_msg)
    
    def _get_user_rate(
        self,
        user: Any,
        from_currency: Currency,
        to_currency: Currency,
        date: date
    ) -> Optional[UserExchangeRate]:
        """Get user-specific exchange rate if available."""
        rate = UserExchangeRate.objects.filter(
            user=user,
            from_currency=from_currency,
            to_currency=to_currency,
            date=date,
            is_active=True
        ).order_by('-created_at').first()
        
        if rate:
            logger.info(f"Found user-specific rate: {rate.rate}")
        return rate
    
    def _get_platform_rate(
        self,
        from_currency: Currency,
        to_currency: Currency,
        date: date
    ) -> Optional[ExchangeRate]:
        """Get platform exchange rate if available."""
        rate = ExchangeRate.objects.filter(
            from_currency=from_currency,
            to_currency=to_currency,
            date=date
        ).first()
        
        if rate:
            logger.info(f"Found platform rate: {rate.rate}")
        else:
            logger.warning(f"No exchange rate found for {from_currency.code}/{to_currency.code} on {date}")
        
        return rate
    
    def create_user_exchange_rate(
        self,
        user: Any,
        from_currency: Currency,
        to_currency: Currency,
        rate: Decimal,
        date: Optional[date] = None,
        note: Optional[str] = None
    ) -> UserExchangeRate:
        """
        Create a user-specific exchange rate.
        
        Args:
            user: User instance
            from_currency: Source currency
            to_currency: Target currency
            rate: Exchange rate value
            date: Optional date for the rate
            note: Optional note about the rate
            
        Returns:
            Created UserExchangeRate instance
        """
        if date is None:
            date = date.today()
        
        try:
            logger.info(f"Creating user exchange rate for {user.username}: {from_currency.code}/{to_currency.code} = {rate}")
            
            rate = UserExchangeRate.objects.create(
                user=user,
                from_currency=from_currency,
                to_currency=to_currency,
                rate=rate,
                date=date,
                note=note
            )
            
            logger.info(f"Successfully created user exchange rate: {rate}")
            return rate
            
        except Exception as e:
            error_msg = f"Failed to create user exchange rate: {str(e)}"
            logger.error(error_msg)
            raise Exception(error_msg) 