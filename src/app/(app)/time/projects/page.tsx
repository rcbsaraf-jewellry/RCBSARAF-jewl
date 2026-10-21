import { listContacts, listProjects } from "@/lib/queries";
import { saveProject } from "@/server/actions";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const [rows, customers] = await Promise.all([listProjects(), listContacts("customer")]);
  return (
    <div className="sb-page">
      <PageHeader title="Projects" subtitle="Customer jobs and unbilled hours" />
      <form action={saveProject} className="sb-card mb-4 grid grid-cols-5 gap-2 p-3">
        <input name="name" placeholder="Project name" required className="sb-input" />
        <input name="code" placeholder="Code" className="sb-input" />
        <select name="contactId" className="sb-select">
          <option value="">Customer</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.displayName}
            </option>
          ))}
        </select>
        <input name="hourlyRate" placeholder="Hourly rate" defaultValue="2500" className="sb-input" />
        <button className="sb-btn sb-btn-primary">Create</button>
      </form>
      <div className="sb-table-wrap">
        <table className="sb-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Hours</th>
              <th>Unbilled</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-[11px] text-slate-400">{p.code}</div>
                </td>
                <td className="capitalize">{p.status}</td>
                <td>{Number(p.hours)}</td>
                <td>{Number(p.unbilled)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
