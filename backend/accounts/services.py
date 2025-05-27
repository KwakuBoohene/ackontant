import os
import logging
import requests
from datetime import date
from decimal import Decimal
from django.conf import settings
from django.db import transaction
from .models import Currency, ExchangeRate, UserExchangeRate

# Set up logger
logger = logging.getLogger('accounts.tasks')

class ExchangeRateService:
    BASE_URL = "https://api.exchangeratesapi.io/v1"
    
    def __init__(self):
        self.api_key = os.getenv('EXCHANGE_RATE_API_KEY')
        if not self.api_key:
            raise ValueError("EXCHANGE_RATE_API_KEY not found in environment variables")
        logger.info("ExchangeRateService initialized")
    
    def fetch_latest_rates(self):
        """
        Fetch latest exchange rates from the API using EUR as base currency
        """
        try:
            logger.info("Fetching latest exchange rates from API...")
            # Make API request with EUR as base
            response = requests.get(
                f"{self.BASE_URL}/latest",
                params={
                    'access_key': self.api_key,
                    'base': 'EUR'
                }
            )
            response.raise_for_status()
            data = response.json()
            
            if not data.get('success'):
                error_msg = f"API Error: {data.get('error', {}).get('info', 'Unknown error')}"
                logger.error(error_msg)
                raise ValueError(error_msg)
            
            logger.info(f"Successfully fetched rates for {len(data['rates'])} currencies")
            return data
        except requests.RequestException as e:
            error_msg = f"Failed to fetch exchange rates: {str(e)}"
            logger.error(error_msg)
            raise Exception(error_msg)
    
    def ensure_currency_exists(self, code, name=None, symbol=None):
        """
        Ensure a currency exists in the database as a platform currency
        """
        try:
            logger.info(f"Ensuring currency exists: {code}")
            currency, created = Currency.objects.get_or_create(
                code=code,
                defaults={
                    'name': name or code,
                    'symbol': symbol or code,
                    'is_active': True,
                    'is_platform_currency': True,
                    'source': 'system'
                }
            )
            
            if created:
                logger.info(f"Created new currency: {code} ({name})")
            elif not currency.is_platform_currency:
                logger.info(f"Updating existing currency to platform currency: {code}")
                currency.is_platform_currency = True
                currency.source = 'system'
                currency.save()
            else:
                logger.info(f"Currency already exists as platform currency: {code}")
                
            return currency
        except Exception as e:
            logger.error(f"Error ensuring currency exists for {code}: {str(e)}")
            raise
    
    def get_currency_symbol(self, code):
        """
        Get the symbol for a currency code
        """
        symbols = {
            'USD': '$', 'EUR': '€', 'GBP': '£', 'GHS': 'GH₵',
            'JPY': '¥', 'CNY': '¥', 'INR': '₹', 'RUB': '₽',
            'NGN': '₦', 'KES': 'KSh', 'ZAR': 'R', 'AUD': 'A$',
            'CAD': 'C$', 'CHF': 'Fr', 'SGD': 'S$', 'NZD': 'NZ$'
        }
        return symbols.get(code, code)
    
    def get_currency_name(self, code):
        """
        Get the full name for a currency code
        """
        names = {
            'USD': 'US Dollar', 'EUR': 'Euro', 'GBP': 'British Pound',
            'GHS': 'Ghana Cedi', 'JPY': 'Japanese Yen', 'CNY': 'Chinese Yuan',
            'INR': 'Indian Rupee', 'RUB': 'Russian Ruble', 'NGN': 'Nigerian Naira',
            'KES': 'Kenyan Shilling', 'ZAR': 'South African Rand',
            'AUD': 'Australian Dollar', 'CAD': 'Canadian Dollar',
            'CHF': 'Swiss Franc', 'SGD': 'Singapore Dollar',
            'NZD': 'New Zealand Dollar'
        }
        return names.get(code, code)
    
    @transaction.atomic
    def update_exchange_rates(self):
        """
        Update platform exchange rates in the database
        """
        try:
            logger.info("Starting exchange rate update process...")
            
            # Fetch latest rates
            rates_data = self.fetch_latest_rates()
            today = date.today()
            logger.info(f"Processing rates for date: {today}")
            
            # Get EUR to GHS rate
            eur_to_ghs = Decimal(str(rates_data['rates'].get('GHS', 0)))
            if eur_to_ghs == 0:
                error_msg = "Could not get EUR to GHS rate"
                logger.error(error_msg)
                raise ValueError(error_msg)
            logger.info(f"EUR to GHS rate: {eur_to_ghs}")
            
            # Ensure GHS exists in our database
            ghs_currency = self.ensure_currency_exists(
                'GHS',
                name='Ghana Cedi',
                symbol='GH₵'
            )
            logger.info(f"Base currency (GHS) ensured: {ghs_currency}")
            
            # Update exchange rates
            rates_updated = 0
            for currency_code, eur_rate in rates_data['rates'].items():
                if currency_code == 'GHS':  # Skip base currency
                    continue
                
                try:
                    # Ensure currency exists in our database
                    currency = self.ensure_currency_exists(
                        currency_code,
                        name=self.get_currency_name(currency_code),
                        symbol=self.get_currency_symbol(currency_code)
                    )
                    
                    # Calculate GHS to target currency rate
                    eur_to_target = Decimal(str(eur_rate))
                    if eur_to_target > 0:
                        ghs_to_target = eur_to_target / eur_to_ghs
                        
                        # Create or update platform exchange rate
                        rate, created = ExchangeRate.objects.update_or_create(
                            from_currency=ghs_currency,
                            to_currency=currency,
                            date=today,
                            defaults={
                                'rate': ghs_to_target,
                                'source': 'api'
                            }
                        )
                        
                        if created:
                            logger.info(f"Created new exchange rate: {ghs_currency.code}/{currency.code} = {ghs_to_target}")
                        else:
                            logger.info(f"Updated existing exchange rate: {ghs_currency.code}/{currency.code} = {ghs_to_target}")
                        
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
    
    def get_exchange_rate(self, from_currency, to_currency, user=None, date=None):
        """
        Get exchange rate between two currencies, preferring user-specific rates if available
        """
        if date is None:
            date = date.today()
        
        try:
            logger.info(f"Getting exchange rate for {from_currency.code}/{to_currency.code} on {date}")
            
            # If user is provided, try to get their specific rate first
            if user:
                user_rate = UserExchangeRate.objects.filter(
                    user=user,
                    from_currency=from_currency,
                    to_currency=to_currency,
                    date=date,
                    is_active=True
                ).order_by('-created_at').first()
                
                if user_rate:
                    logger.info(f"Found user-specific rate: {user_rate.rate}")
                    return user_rate
            
            # If no user rate found, get platform rate
            platform_rate = ExchangeRate.objects.filter(
                from_currency=from_currency,
                to_currency=to_currency,
                date=date
            ).first()
            
            if platform_rate:
                logger.info(f"Found platform rate: {platform_rate.rate}")
            else:
                logger.warning(f"No exchange rate found for {from_currency.code}/{to_currency.code} on {date}")
            
            return platform_rate
        except Exception as e:
            error_msg = f"Failed to get exchange rate: {str(e)}"
            logger.error(error_msg)
            raise Exception(error_msg)
    
    def create_user_exchange_rate(self, user, from_currency, to_currency, rate, date=None, note=None):
        """
        Create a user-specific exchange rate
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