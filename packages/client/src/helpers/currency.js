const currencyFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  style: 'currency',
  currency: 'USD',
  currencyDisplay: 'narrowSymbol',
});

export function formatCurrency(value) {
  if (value === undefined || value === null) {
    return '';
  }
  return currencyFormatter.format(value);
}
