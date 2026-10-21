export const BILLING_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS jewelry_rates (
  id text PRIMARY KEY,
  metal_type text NOT NULL,
  purity text NOT NULL,
  rate_per_gram numeric(19,4) NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (metal_type, purity)
);
CREATE TABLE IF NOT EXISTS bills (
  id text PRIMARY KEY,
  bill_number text NOT NULL UNIQUE,
  model_type text NOT NULL,
  customer_name text NOT NULL,
  customer_phone text,
  gst_mode text NOT NULL DEFAULT 'intra',
  gross_amount numeric(19,4) NOT NULL DEFAULT 0,
  making_charges_total numeric(19,4) NOT NULL DEFAULT 0,
  stone_charges_total numeric(19,4) NOT NULL DEFAULT 0,
  taxable_amount numeric(19,4) NOT NULL DEFAULT 0,
  gst_total numeric(19,4) NOT NULL DEFAULT 0,
  cgst numeric(19,4) NOT NULL DEFAULT 0,
  sgst numeric(19,4) NOT NULL DEFAULT 0,
  igst numeric(19,4) NOT NULL DEFAULT 0,
  advance_amount numeric(19,4) NOT NULL DEFAULT 0,
  final_amount numeric(19,4) NOT NULL DEFAULT 0,
  cash_received numeric(19,4) NOT NULL DEFAULT 0,
  change_due numeric(19,4) NOT NULL DEFAULT 0,
  payment_status text NOT NULL DEFAULT 'unpaid',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS bill_items (
  id text PRIMARY KEY,
  bill_id text NOT NULL REFERENCES bills(id),
  item_name text NOT NULL,
  huid text,
  purity text NOT NULL,
  metal_type text NOT NULL,
  gross_weight numeric(19,4) NOT NULL DEFAULT 0,
  stone_weight numeric(19,4) NOT NULL DEFAULT 0,
  net_weight numeric(19,4) NOT NULL DEFAULT 0,
  rate_per_gram numeric(19,4) NOT NULL DEFAULT 0,
  making_charge numeric(19,4) NOT NULL DEFAULT 0,
  stone_charge numeric(19,4) NOT NULL DEFAULT 0,
  diamond_carats numeric(19,4) NOT NULL DEFAULT 0,
  line_total numeric(19,4) NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS bill_payments (
  id text PRIMARY KEY,
  bill_id text NOT NULL REFERENCES bills(id),
  payment_mode text NOT NULL,
  amount numeric(19,4) NOT NULL DEFAULT 0,
  transaction_ref text
);
CREATE INDEX IF NOT EXISTS bill_items_bill_idx ON bill_items (bill_id);
CREATE INDEX IF NOT EXISTS bill_payments_bill_idx ON bill_payments (bill_id);
`;
