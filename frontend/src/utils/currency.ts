interface Currency {
  code: string;
  symbol: string;
  decimal_places: number;
}

export const formatCurrency = (amount: number, currency: Currency): string => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.code,
    minimumFractionDigits: currency.decimal_places,
    maximumFractionDigits: currency.decimal_places,
  });

  return formatter.format(amount);
}; 