export const formatCurrency = (value: number | string): string => {
  const num = Number(value);
  if (isNaN(num)) return `₹0`;
  return `₹${num.toLocaleString('en-IN')}`;
};
