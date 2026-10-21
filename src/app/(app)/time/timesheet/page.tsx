import { listProjects, listTimesheets } from "@/lib/queries";
import { saveTimesheet } from "@/server/actions";
import { todayISO } from "@/lib/utils";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function TimesheetPage() {
  const [rows, projects] = await Promise.all([listTimesheets(), listProjects()]);
  return (
    <div className="sb-page">
      <PageHeader title="Timesheet" subtitle="Log billable hours against a project" />
      <form action={saveTimesheet} className="sb-card mb-4 grid grid-cols-5 gap-2 p-3">
        <select name="projectId" required className="sb-select">
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <input name="date" type="date" defaultValue={todayISO()} className="sb-input" />
        <input name="hours" placeholder="Hours" required className="sb-input" />
        <input name="notes" placeholder="Notes" className="sb-input" />
        <button className="sb-btn sb-btn-primary">Log time</button>
        <label className="col-span-5 flex items-center gap-2 text-[12px]">
          <input type="checkbox" name="billable" defaultChecked /> Billable
        </label>
      </form>
      <div className="sb-table-wrap">
        <table className="sb-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Hours</th>
              <th>Notes</th>
              <th>Billable</th>
              <th>Billed</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id}>
                <td>{t.date}</td>
                <td>{Number(t.hours)}</td>
                <td>{t.notes}</td>
                <td>{t.billable ? "Yes" : "No"}</td>
                <td>{t.billed ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
