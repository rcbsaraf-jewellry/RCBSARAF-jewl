export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS organizations (
  id text PRIMARY KEY,
  name text NOT NULL,
  legal_name text,
  industry text,
  email text,
  phone text,
  website text,
  gstin text,
  pan text,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  country text NOT NULL DEFAULT 'India',
  base_currency text NOT NULL DEFAULT 'INR',
  fiscal_year_start_month integer NOT NULL DEFAULT 4,
  logo_text text NOT NULL DEFAULT 'SB',
  timezone text NOT NULL DEFAULT 'Asia/Kolkata',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'admin',
  contact_id text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS accounts (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id),
  code text NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  account_type text NOT NULL,
  is_system boolean NOT NULL DEFAULT false,
  is_watchlist boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  parent_id text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, code)
);
CREATE TABLE IF NOT EXISTS taxes (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id),
  name text NOT NULL,
  rate numeric(19,4) NOT NULL DEFAULT 0,
  tax_type text NOT NULL DEFAULT 'gst',
  is_recoverable boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS payment_terms (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id),
  name text NOT NULL,
  days integer NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS number_series (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id),
  document_type text NOT NULL,
  prefix text NOT NULL,
  next_number integer NOT NULL DEFAULT 1,
  padding integer NOT NULL DEFAULT 4,
  UNIQUE (organization_id, document_type)
);
CREATE TABLE IF NOT EXISTS contacts (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id),
  contact_type text NOT NULL,
  display_name text NOT NULL,
  company_name text,
  email text,
  phone text,
  mobile text,
  website text,
  gstin text,
  pan text,
  currency text NOT NULL DEFAULT 'INR',
  payment_term_id text,
  billing_street text,
  billing_city text,
  billing_state text,
  billing_postal text,
  billing_country text DEFAULT 'India',
  shipping_street text,
  shipping_city text,
  shipping_state text,
  shipping_postal text,
  shipping_country text DEFAULT 'India',
  notes text,
  credit_limit numeric(19,4) NOT NULL DEFAULT 0,
  opening_balance numeric(19,4) NOT NULL DEFAULT 0,
  portal_enabled boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS contact_persons (
  id text PRIMARY KEY,
  contact_id text NOT NULL REFERENCES contacts(id),
  name text NOT NULL,
  email text,
  phone text,
  designation text,
  is_primary boolean NOT NULL DEFAULT false
);
CREATE TABLE IF NOT EXISTS items (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id),
  item_type text NOT NULL,
  name text NOT NULL,
  sku text,
  upc text,
  unit text NOT NULL DEFAULT 'pcs',
  hsn text,
  description text,
  sale_rate numeric(19,4) NOT NULL DEFAULT 0,
  purchase_rate numeric(19,4) NOT NULL DEFAULT 0,
  sales_account_id text,
  purchase_account_id text,
  inventory_account_id text,
  tax_id text,
  track_inventory boolean NOT NULL DEFAULT false,
  stock_on_hand numeric(19,4) NOT NULL DEFAULT 0,
  reorder_point numeric(19,4) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS transactions (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id),
  document_type text NOT NULL,
  number text NOT NULL,
  reference text,
  status text NOT NULL DEFAULT 'draft',
  contact_id text,
  date text NOT NULL,
  due_date text,
  payment_term_id text,
  salesperson text,
  subject text,
  notes text,
  terms text,
  currency text NOT NULL DEFAULT 'INR',
  exchange_rate numeric(19,4) NOT NULL DEFAULT 1,
  sub_total numeric(19,4) NOT NULL DEFAULT 0,
  discount_total numeric(19,4) NOT NULL DEFAULT 0,
  tax_total numeric(19,4) NOT NULL DEFAULT 0,
  shipping numeric(19,4) NOT NULL DEFAULT 0,
  adjustment numeric(19,4) NOT NULL DEFAULT 0,
  total numeric(19,4) NOT NULL DEFAULT 0,
  balance numeric(19,4) NOT NULL DEFAULT 0,
  paid numeric(19,4) NOT NULL DEFAULT 0,
  source_id text,
  project_id text,
  deposit_account_id text,
  expense_account_id text,
  paid_through_account_id text,
  recurrence text,
  journal_id text,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, document_type, number)
);
CREATE TABLE IF NOT EXISTS transaction_lines (
  id text PRIMARY KEY,
  transaction_id text NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  line_no integer NOT NULL,
  item_id text,
  description text,
  account_id text,
  quantity numeric(19,4) NOT NULL DEFAULT 0,
  rate numeric(19,4) NOT NULL DEFAULT 0,
  discount_pct numeric(19,4) NOT NULL DEFAULT 0,
  tax_id text,
  tax_pct numeric(19,4) NOT NULL DEFAULT 0,
  taxable numeric(19,4) NOT NULL DEFAULT 0,
  tax_amount numeric(19,4) NOT NULL DEFAULT 0,
  amount numeric(19,4) NOT NULL DEFAULT 0,
  project_id text
);
CREATE TABLE IF NOT EXISTS payments (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id),
  payment_type text NOT NULL,
  number text NOT NULL,
  contact_id text,
  date text NOT NULL,
  amount numeric(19,4) NOT NULL DEFAULT 0,
  unused numeric(19,4) NOT NULL DEFAULT 0,
  method text NOT NULL DEFAULT 'bank_transfer',
  account_id text,
  reference text,
  notes text,
  journal_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS payment_allocations (
  id text PRIMARY KEY,
  payment_id text NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  transaction_id text NOT NULL REFERENCES transactions(id),
  amount numeric(19,4) NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS journals (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id),
  number text NOT NULL,
  date text NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'published',
  source_type text NOT NULL DEFAULT 'manual',
  source_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS journal_lines (
  id text PRIMARY KEY,
  journal_id text NOT NULL REFERENCES journals(id) ON DELETE CASCADE,
  line_no integer NOT NULL,
  account_id text NOT NULL REFERENCES accounts(id),
  contact_id text,
  description text,
  debit numeric(19,4) NOT NULL DEFAULT 0,
  credit numeric(19,4) NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS bank_transactions (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id),
  account_id text NOT NULL REFERENCES accounts(id),
  date text NOT NULL,
  description text NOT NULL,
  payee text,
  reference text,
  amount numeric(19,4) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'unmatched',
  matched_transaction_id text,
  category_account_id text,
  rule_id text,
  imported boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS bank_rules (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id),
  name text NOT NULL,
  apply_on text NOT NULL DEFAULT 'description',
  contains text NOT NULL,
  category_account_id text NOT NULL,
  contact_id text,
  is_active boolean NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS reconciliations (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id),
  account_id text NOT NULL,
  statement_date text NOT NULL,
  statement_balance numeric(19,4) NOT NULL DEFAULT 0,
  book_balance numeric(19,4) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'in_progress',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS inventory_movements (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id),
  item_id text NOT NULL REFERENCES items(id),
  date text NOT NULL,
  reason text NOT NULL,
  quantity numeric(19,4) NOT NULL DEFAULT 0,
  unit_cost numeric(19,4) NOT NULL DEFAULT 0,
  source_type text,
  source_id text,
  notes text
);
CREATE TABLE IF NOT EXISTS projects (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id),
  contact_id text,
  name text NOT NULL,
  code text,
  billing_method text NOT NULL DEFAULT 'hourly',
  hourly_rate numeric(19,4) NOT NULL DEFAULT 0,
  budget_hours numeric(19,4) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS project_tasks (
  id text PRIMARY KEY,
  project_id text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  billable boolean NOT NULL DEFAULT true,
  rate numeric(19,4) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'open'
);
CREATE TABLE IF NOT EXISTS timesheets (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id),
  project_id text NOT NULL REFERENCES projects(id),
  task_id text,
  user_id text,
  contact_id text,
  date text NOT NULL,
  hours numeric(19,4) NOT NULL DEFAULT 0,
  notes text,
  billable boolean NOT NULL DEFAULT true,
  billed boolean NOT NULL DEFAULT false,
  invoice_id text
);
CREATE TABLE IF NOT EXISTS files (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id),
  name text NOT NULL,
  mime text,
  size integer NOT NULL DEFAULT 0,
  related_type text,
  related_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS audit_log (
  id text PRIMARY KEY,
  organization_id text NOT NULL,
  user_id text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  detail text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS otp_challenges (
  id text PRIMARY KEY,
  email text NOT NULL,
  role text NOT NULL,
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  consumed_at timestamptz,
  request_ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS otp_email_role_idx ON otp_challenges (email, role);
CREATE TABLE IF NOT EXISTS auth_grants (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id),
  role text NOT NULL,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS login_fingerprints (
  user_id text PRIMARY KEY REFERENCES users(id),
  fingerprint text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
`;

export const AUTH_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS otp_challenges (
  id text PRIMARY KEY,
  email text NOT NULL,
  role text NOT NULL,
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  consumed_at timestamptz,
  request_ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS otp_email_role_idx ON otp_challenges (email, role);
CREATE TABLE IF NOT EXISTS auth_grants (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id),
  role text NOT NULL,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS login_fingerprints (
  user_id text PRIMARY KEY REFERENCES users(id),
  fingerprint text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
`;
