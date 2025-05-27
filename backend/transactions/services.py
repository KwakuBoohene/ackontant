from decimal import Decimal
from django.db import transaction
from accounts.models import Account, Currency, ExchangeRate
from .models import Transaction, Transfer
from django.core.exceptions import ValidationError

class BalanceService:
    @staticmethod
    def check_negative_balance(account: Account, amount: Decimal, currency: Currency, exchange_rate: Decimal, allow_negative: bool = False) -> None:
        """
        Check if an operation would result in a negative balance.
        
        Args:
            account: The account to check
            amount: The amount to check
            currency: The currency of the amount
            exchange_rate: The exchange rate to use for conversion
            allow_negative: Whether to allow negative balance
            
        Raises:
            ValidationError: If the operation would result in a negative balance and allow_negative is False
        """
        if allow_negative:
            return

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
                if account.current_balance < converted_amount:
                    raise ValidationError("Insufficient funds in account")
        else:
            if account.current_balance < amount:
                raise ValidationError("Insufficient funds in account")

    @staticmethod
    def update_account_balance(account: Account, amount: Decimal, currency: Currency, exchange_rate: Decimal, is_positive: bool = True, allow_negative: bool = False) -> None:
        """
        Update an account's current balance and base currency balance.
        
        Args:
            account: The account to update
            amount: The amount to add/subtract
            currency: The currency of the amount
            exchange_rate: The exchange rate to use for conversion
            is_positive: True for income, False for expense
            allow_negative: Whether to allow negative balance
        """
        if not is_positive:
            BalanceService.check_negative_balance(account, amount, currency, exchange_rate, allow_negative)

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
    def process_transaction(transaction: Transaction, allow_negative: bool = False) -> None:
        """
        Process a transaction and update account balances accordingly.
        
        Args:
            transaction: The transaction to process
            allow_negative: Whether to allow negative balance
        """
        if transaction.type == 'INCOME':
            BalanceService.update_account_balance(
                transaction.account,
                transaction.amount,
                transaction.currency,
                transaction.exchange_rate,
                True,
                allow_negative
            )
        elif transaction.type == 'EXPENSE':
            BalanceService.update_account_balance(
                transaction.account,
                transaction.amount,
                transaction.currency,
                transaction.exchange_rate,
                False,
                allow_negative
            )
        elif transaction.type == 'TRANSFER':
            # Transfers are handled separately in TransferService
            pass

    @staticmethod
    @transaction.atomic
    def process_transfer(transfer: Transfer, allow_negative: bool = False) -> None:
        """
        Process a transfer and update both source and destination account balances.
        
        Args:
            transfer: The transfer to process
            allow_negative: Whether to allow negative balance
        """
        # Update source account (decrease balance)
        BalanceService.update_account_balance(
            transfer.source_account,
            transfer.amount,
            transfer.source_currency,
            transfer.exchange_rate,
            False,
            allow_negative
        )
        
        # Update destination account (increase balance)
        BalanceService.update_account_balance(
            transfer.destination_account,
            transfer.amount * transfer.exchange_rate,
            transfer.destination_currency,
            transfer.exchange_rate,
            True,
            allow_negative
        )

    @staticmethod
    @transaction.atomic
    def reverse_transaction(transaction: Transaction, allow_negative: bool = False) -> None:
        """
        Reverse a transaction and update account balances accordingly.
        
        Args:
            transaction: The transaction to reverse
            allow_negative: Whether to allow negative balance
        """
        if transaction.type == 'INCOME':
            BalanceService.update_account_balance(
                transaction.account,
                transaction.amount,
                transaction.currency,
                transaction.exchange_rate,
                False,
                allow_negative
            )
        elif transaction.type == 'EXPENSE':
            BalanceService.update_account_balance(
                transaction.account,
                transaction.amount,
                transaction.currency,
                transaction.exchange_rate,
                True,
                allow_negative
            )
        elif transaction.type == 'TRANSFER':
            # Transfers are handled separately in TransferService
            pass

    @staticmethod
    @transaction.atomic
    def reverse_transfer(transfer: Transfer, allow_negative: bool = False) -> None:
        """
        Reverse a transfer and update both source and destination account balances.
        
        Args:
            transfer: The transfer to reverse
            allow_negative: Whether to allow negative balance
        """
        # Reverse source account (increase balance)
        BalanceService.update_account_balance(
            transfer.source_account,
            transfer.amount,
            transfer.source_currency,
            transfer.exchange_rate,
            True,
            allow_negative
        )
        
        # Reverse destination account (decrease balance)
        BalanceService.update_account_balance(
            transfer.destination_account,
            transfer.amount * transfer.exchange_rate,
            transfer.destination_currency,
            transfer.exchange_rate,
            False,
            allow_negative
        ) 