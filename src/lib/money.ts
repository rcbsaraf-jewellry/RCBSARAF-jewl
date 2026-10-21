import Big from "big.js";

Big.DP = 4;
Big.RM = Big.roundHalfUp;

export type Money = string;

export function m(value: string | number | Big | null | undefined): Big {
  if (value === null || value === undefined || value === "") return new Big(0);
  try {
    return new Big(value);
  } catch {
    return new Big(0);
  }
}

export function money(value: string | number | Big | null | undefined): Money {
  return m(value).toFixed(2);
}

export function money4(value: string | number | Big | null | undefined): Money {
  return m(value).toFixed(4);
}

export function add(...values: Array<string | number | Big | null | undefined>): Money {
  let total = new Big(0);
  for (const value of values) total = total.plus(m(value));
  return total.toFixed(2);
}

export function sub(a: string | number | Big, b: string | number | Big): Money {
  return m(a).minus(m(b)).toFixed(2);
}

export function mul(a: string | number | Big, b: string | number | Big): Money {
  return m(a).times(m(b)).toFixed(2);
}

export function eq(a: string | number | Big, b: string | number | Big) {
  return m(a).eq(m(b));
}

export function gt(a: string | number | Big, b: string | number | Big) {
  return m(a).gt(m(b));
}

export function gte(a: string | number | Big, b: string | number | Big) {
  return m(a).gte(m(b));
}

export function isZero(value: string | number | Big | null | undefined) {
  return m(value).eq(0);
}

export function abs(value: string | number | Big): Money {
  return m(value).abs().toFixed(2);
}

export function formatINR(value: string | number | Big | null | undefined, currency = "INR") {
  const n = Number(m(value).toFixed(2));
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${currency} ${m(value).toFixed(2)}`;
  }
}

export function formatCompact(value: string | number | Big | null | undefined, currency = "INR") {
  const n = Number(m(value).toFixed(2));
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

export type LineInput = {
  quantity: string | number;
  rate: string | number;
  discountPct?: string | number;
  taxPct?: string | number;
};

export type LineTotals = {
  taxable: Money;
  tax: Money;
  amount: Money;
};

export function lineTotals(line: LineInput): LineTotals {
  const qty = m(line.quantity);
  const rate = m(line.rate);
  const discountPct = m(line.discountPct);
  const taxPct = m(line.taxPct);
  const gross = qty.times(rate);
  const taxable = gross.minus(gross.times(discountPct).div(100));
  const tax = taxable.times(taxPct).div(100);
  return {
    taxable: taxable.toFixed(2),
    tax: tax.toFixed(2),
    amount: taxable.plus(tax).toFixed(2),
  };
}

export type DocumentTotals = {
  subTotal: Money;
  discountTotal: Money;
  taxTotal: Money;
  shipping: Money;
  adjustment: Money;
  total: Money;
};

export function documentTotals(input: {
  lines: LineInput[];
  shipping?: string | number;
  adjustment?: string | number;
}): DocumentTotals {
  let sub = new Big(0);
  let discount = new Big(0);
  let tax = new Big(0);
  for (const line of input.lines) {
    const qty = m(line.quantity);
    const rate = m(line.rate);
    const gross = qty.times(rate);
    const disc = gross.times(m(line.discountPct)).div(100);
    const taxable = gross.minus(disc);
    sub = sub.plus(gross);
    discount = discount.plus(disc);
    tax = tax.plus(taxable.times(m(line.taxPct)).div(100));
  }
  const shipping = m(input.shipping);
  const adjustment = m(input.adjustment);
  const total = sub.minus(discount).plus(tax).plus(shipping).plus(adjustment);
  return {
    subTotal: sub.toFixed(2),
    discountTotal: discount.toFixed(2),
    taxTotal: tax.toFixed(2),
    shipping: shipping.toFixed(2),
    adjustment: adjustment.toFixed(2),
    total: total.toFixed(2),
  };
}
