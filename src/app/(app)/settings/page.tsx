import { currentOrg, listStaff } from "@/lib/queries";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { org } = await currentOrg();
  const staff = await listStaff();
  return (
    <div className="sb-page mx-auto max-w-4xl">
      <PageHeader title="Organization Settings" subtitle="Company profile, users, taxes, and portal access" />
      <div className="form-grid-2">
        <section className="sb-card p-4 text-[13px]">
          <h2 className="mb-2 font-semibold">Company profile</h2>
          <Row k="Name" v={org?.name} />
          <Row k="Legal name" v={org?.legalName} />
          <Row k="GSTIN" v={org?.gstin} />
          <Row k="PAN" v={org?.pan} />
          <Row k="Base currency" v={org?.baseCurrency} />
          <Row k="Timezone" v={org?.timezone} />
          <Row k="Address" v={`${org?.addressLine1}, ${org?.city} ${org?.state} ${org?.postalCode}`} />
        </section>
        <section className="sb-card p-4 text-[13px]">
          <h2 className="mb-2 font-semibold">Users & roles</h2>
          {staff.map((u) => (
            <div key={u.id} className="flex justify-between border-b border-slate-100 py-2 last:border-0">
              <div>
                <div className="font-medium">{u.name}</div>
                <div className="text-[12px] text-slate-500">{u.email}</div>
              </div>
              <div className="capitalize text-slate-600">{u.role}</div>
            </div>
          ))}
          <p className="mt-3 text-[12px] text-slate-500">
            Roles: Admin, Accountant, Salesperson, Purchases, Auditor, Customer Portal. Ledger posting is restricted to Admin and Accountant in production RBAC.
          </p>
        </section>
        <section className="sb-card p-4 text-[13px]">
          <h2 className="mb-2 font-semibold">Taxes</h2>
          <p>GST 0 / 3 / 5 / 12 / 18 / 28% are seeded. Gold jewellery uses GST 3%; making charges use GST 18%.</p>
        </section>
        <section className="sb-card p-4 text-[13px]">
          <h2 className="mb-2 font-semibold">Templates & portal</h2>
          <p>Invoice PDFs render from the document template. Customers with portal access can approve quotes and pay invoices from /portal.</p>
        </section>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v?: string | null }) {
  return (
    <div className="flex justify-between gap-4 py-1">
      <span className="text-slate-500">{k}</span>
      <span className="text-right">{v}</span>
    </div>
  );
}
