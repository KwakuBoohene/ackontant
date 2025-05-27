from celery import shared_task
from .services import ExchangeRateService
import logging

logger = logging.getLogger(__name__)

@shared_task
def fetch_daily_exchange_rates():
    """
    Celery task to fetch and update daily exchange rates
    """
    try:
        service = ExchangeRateService()
        service.update_exchange_rates()
        logger.info("Successfully updated daily exchange rates")
        return True
    except Exception as e:
        logger.error(f"Failed to update daily exchange rates: {str(e)}")
        raise 