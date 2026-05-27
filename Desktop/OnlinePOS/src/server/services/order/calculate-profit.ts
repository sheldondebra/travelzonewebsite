export function calculateLineProfit(
  sellingPrice: number,
  costPrice: number,
  quantity: number,
) {
  return (sellingPrice - costPrice) * quantity;
}

export function calculateOrderTotals(
  lines: { price: number; costPrice: number; quantity: number }[],
) {
  let totalAmount = 0;
  let profit = 0;

  for (const line of lines) {
    totalAmount += line.price * line.quantity;
    profit += calculateLineProfit(line.price, line.costPrice, line.quantity);
  }

  return { totalAmount, profit };
}
