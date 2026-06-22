/**
 * ZERO TOLERANCE CURRENCY ENGINE
 * All money is stored as INTEGER cents. No floating-point math.
 */

export const toCents = (dollars: number): number => {
  return Math.round(dollars * 100);
};

export const toDollars = (cents: number): number => {
  return cents / 100;
};

export const formatCurrency = (cents: number): string => {
  const dollars = toDollars(cents);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(dollars);
};

export const parseCurrency = (input: string): number => {
  // Strip everything except digits and decimal
  const cleaned = input.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned) || 0;
  return toCents(parsed);
};

/** Add money safely (cents + cents) */
export const addCents = (...amounts: number[]): number => {
  return amounts.reduce((sum, amt) => sum + amt, 0);
};

/** Multiply cents by quantity (no decimals) */
export const multiplyCents = (cents: number, qty: number): number => {
  return Math.round(cents * qty);
};
