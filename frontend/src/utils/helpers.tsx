export const generateId = (prefix = 'id'): string => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const calculateQuotationTotals = (items: any[], taxRate: number, discount: number) => {
  const subtotal = items.reduce(
    (sum: number, item: any) => sum + Number(item.qty || 0) * Number(item.price || 0),
    0
  );
  const taxAmount = Math.round(subtotal * (Number(taxRate || 0) / 100));
  const grandTotal = subtotal + taxAmount - Number(discount || 0);

  return {
    subtotal,
    taxAmount,
    grandTotal,
  };
};
