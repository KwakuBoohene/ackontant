from decimal import Decimal
from django.db import transaction
from accounts.models import Account, Currency, ExchangeRate
from .models import Transaction, Transfer

class BalanceService:
    @staticmethod
    def update_account_balance(account: Account, amount: Decimal, currency: Currency, exchange_rate: Decimal, is_positive: bool = True) -> None:
        """
        Update an account's current balance and base currency balance.
        
        Args:
            account: The account to update
            amount: The amount to add/subtract
            currency: The currency of the amount
            exchange_rate: The exchange rate to use for conversion
            is_positive: True for income, False for expense
        """
        multiplier = 1 if is_positive else -1
        
        # Convert amount to account's currency if needed
        if currency != account.currency:
            # Convert to base currency first
            base_amount = amount * exchange_rate
            # Then convert to account's currency
            account_exchange_rate = ExchangeRate.objects.filter(
                from_currency=account.currency,
                to_currency=Currency.objects.get(code='GHS')  # Assuming GHS is base currency
            ).order_by('-date').first()
            
            if account_exchange_rate:
                converted_amount = base_amount / account_exchange_rate.rate
                account.current_balance += (converted_amount * multiplier)
                account.last_exchange_rate = account_exchange_rate.rate
                account.last_conversion_date = account_exchange_rate.date
        else:
            # If same currency, no conversion needed
            account.current_balance += (amount * multiplier)
        
        # Update base currency balance
        if account.currency.is_platform_currency:
            # If account is in base currency, no conversion needed
            account.base_currency_balance += (amount * exchange_rate * multiplier)
        else:
            # Get latest exchange rate for account's currency
            account_exchange_rate = ExchangeRate.objects.filter(
                from_currency=account.currency,
                to_currency=Currency.objects.get(code='GHS')  # Assuming GHS is base currency
            ).order_by('-date').first()
            
            if account_exchange_rate:
                base_amount = amount * exchange_rate  # Already in base currency
                account.base_currency_balance += (base_amount * multiplier)
                account.last_exchange_rate = account_exchange_rate.rate
                account.last_conversion_date = account_exchange_rate.date
        
        account.save()

    @staticmethod
    @transaction.atomic
    def process_transaction(transaction: Transaction) -> None:
        """
        Process a transaction and update account balances accordingly.
        
        Args:
            transaction: The transaction to process
        """
        if transaction.type == 'INCOME':
            BalanceService.update_account_balance(
                transaction.account,
                transaction.amount,
                transaction.currency,
                transaction.exchange_rate,
                True
            )
        elif transaction.type == 'EXPENSE':
            BalanceService.update_account_balance(
                transaction.account,
                transaction.amount,
                transaction.currency,
                transaction.exchange_rate,
                False
            )
        elif transaction.type == 'TRANSFER':
            # Transfers are handled separately in TransferService
            pass

    @staticmethod
    @transaction.atomic
    def process_transfer(transfer: Transfer) -> None:
        """
        Process a transfer and update both source and destination account balances.
        
        Args:
            transfer: The transfer to process
        """
        # Update source account (decrease balance)
        BalanceService.update_account_balance(
            transfer.source_account,
            transfer.amount,
            transfer.source_currency,
            transfer.exchange_rate,
            False
        )
        
        # Update destination account (increase balance)
        BalanceService.update_account_balance(
            transfer.destination_account,
            transfer.amount * transfer.exchange_rate,
            transfer.destination_currency,
            transfer.exchange_rate,
            True
        )

    @staticmethod
    @transaction.atomic
    def reverse_transaction(transaction: Transaction) -> None:
        """
        Reverse a transaction and update account balances accordingly.
        
        Args:
            transaction: The transaction to reverse
        """
        if transaction.type == 'INCOME':
            BalanceService.update_account_balance(
                transaction.account,
                transaction.amount,
                transaction.currency,
                transaction.exchange_rate,
                False
            )
        elif transaction.type == 'EXPENSE':
            BalanceService.update_account_balance(
                transaction.account,
                transaction.amount,
                transaction.currency,
                transaction.exchange_rate,
                True
            )
        elif transaction.type == 'TRANSFER':
            # Transfers are handled separately in TransferService
            pass

    @staticmethod
    @transaction.atomic
    def reverse_transfer(transfer: Transfer) -> None:
        """
        Reverse a transfer and update both source and destination account balances.
        
        Args:
            transfer: The transfer to reverse
        """
        # Reverse source account (increase balance)
        BalanceService.update_account_balance(
            transfer.source_account,
            transfer.amount,
            transfer.source_currency,
            transfer.exchange_rate,
            True
        )
        
        # Reverse destination account (decrease balance)
        BalanceService.update_account_balance(
            transfer.destination_account,
            transfer.amount * transfer.exchange_rate,
            transfer.destination_currency,
            transfer.exchange_rate,
            False
        ) 