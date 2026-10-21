import { loginAction } from "@/server/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="login-shell">
      <div className="login-hero">
        <div>
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-md bg-[var(--gold)] text-sm font-bold text-[#1c2530]">
              RCB
            </div>
            <div>
              <div className="text-[17px] font-semibold">Sarafa Books</div>
              <div className="text-[12px] text-[#9aa5b1]">Jewellery ledger · GST · Inventory</div>
            </div>
          </div>
          <h1 className="mt-16 max-w-md text-[36px] font-semibold leading-tight tracking-[-0.03em]">
            Double-entry books for the gold market.
          </h1>
          <p className="mt-4 max-w-md text-[14px] leading-6 text-[#c5ccd6]">
            Chart of accounts, invoicing, bills, bank matching, inventory, and GST reports — structured after modern books-style workflows.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4 text-[12px] text-[#c5ccd6]">
          <div>
            <div className="text-[10px] uppercase tracking-[0.08em] text-[#8b95a1]">Receivables</div>
            <div className="mt-1 text-[16px] text-white">Live AR aging</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.08em] text-[#8b95a1]">Banking</div>
            <div className="mt-1 text-[16px] text-white">Match & categorize</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.08em] text-[#8b95a1]">Ledger</div>
            <div className="mt-1 text-[16px] text-white">Balanced journals</div>
          </div>
        </div>
      </div>
      <div className="login-panel">
        <form action={loginAction} className="login-card">
          <h2 className="sb-h1">Sign in</h2>
          <p className="sb-sub">Use a seeded demo account to explore the ledger.</p>
          {params.error && (
            <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700">
              Invalid email or password.
            </div>
          )}
          <input type="hidden" name="callbackUrl" value={params.callbackUrl ?? "/home"} />
          <label className="mt-5 block">
            <span className="sb-label">Email</span>
            <input
              name="email"
              type="email"
              required
              defaultValue="admin@rcbsarafa.com"
              className="sb-input"
            />
          </label>
          <label className="mt-3 block">
            <span className="sb-label">Password</span>
            <input
              name="password"
              type="password"
              required
              defaultValue="Sarafa@123"
              className="sb-input"
            />
          </label>
          <button type="submit" className="sb-btn sb-btn-primary mt-6 h-10 w-full">
            Sign in
          </button>
          <div className="mt-4 space-y-1 text-[11px] text-slate-500">
            <div>Admin · accountant@rcbsarafa.com · sales@rcbsarafa.com</div>
            <div>Customer portal · portal@nishabridal.com</div>
            <div>Password for all demo users: Sarafa@123</div>
          </div>
        </form>
      </div>
    </div>
  );
}
