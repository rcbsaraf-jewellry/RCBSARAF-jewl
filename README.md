# Sarafa Books

Independent double-entry accounting application for jewellery and trading businesses. The information architecture (Home, Items, Banking, Sales, Purchases, Time Tracking, Accountant, Reports, Documents, Settings, Customer Portal) follows public Zoho Books help documentation. This product is **not affiliated with Zoho**. Branding, copy, and visual design are original.

## Stack

- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS
- TanStack Query, Zustand, Zod, Big.js, date-fns, Lucide, Framer Motion
- Drizzle ORM with embedded PostgreSQL ([PGlite](https://pglite.dev)) or Docker Postgres
- Auth.js (NextAuth v5) credentials + RBAC roles
- `@react-pdf/renderer` for invoice PDFs

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000

Demo users (password `Sarafa@123`):

- `admin@rcbsarafa.com` — Admin
- `accountant@rcbsarafa.com` — Accountant
- `sales@rcbsarafa.com` — Sales
- `portal@nishabridal.com` — Customer portal (Nisha Bridal House)

The first request creates `./data/pglite` and seeds the ledger (chart of accounts, GST rates, customers, vendors, items, invoices, bills, bank feeds, journals).

### Optional Docker PostgreSQL

```bash
docker compose up -d
```

Set `DATABASE_URL=postgres://sarafa:sarafa@localhost:5432/sarafa` in `.env.local`.

## Accounting rules

Posting a non-draft invoice, bill, credit note, vendor credit, or expense writes a **balanced** journal (`sum(debits) === sum(credits)`). Inventory items decrement/increment stock and post COGS. Payments allocate against open documents and move AR/AP.

## Observed source (REA / docs)

Public help used for module inventory and form fields:

- https://www.zoho.com/us/books/help/getting-started/welcome.html
- https://www.zoho.com/us/books/help/getting-started/zoho-books.html
- https://www.zoho.com/us/books/help/invoice/
- https://www.zoho.com/us/books/help/accountant/chart-of-accounts.html
- https://www.zoho.com/us/books/help/banking/

The live `books.zoho.com` application is login-walled; reconstruction is based on documented workflows, not copied assets.
