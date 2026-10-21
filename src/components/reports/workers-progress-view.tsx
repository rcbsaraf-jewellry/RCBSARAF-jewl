import type { WorkerProgressRow, WorkersProgressReport } from "@/lib/reports/workers-progress";

function hoursLabel(value: string) {
  return `${Number(value).toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} h`;
}

function Bar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-[#c9a227]" style={{ width: `${value}%` }} />
      </div>
      <span className="text-[12px] text-slate-500">{value}%</span>
    </div>
  );
}

export function WorkersProgressView({ report }: { report: WorkersProgressReport }) {
  return (
    <>
      <div className="mb-5 grid grid-cols-2 gap-2 md:grid-cols-4">
        <Kpi label="Workers" value={String(report.totals.workerCount)} />
        <Kpi label="On jobs" value={String(report.totals.activeOnJobs)} />
        <Kpi label="Hours logged" value={hoursLabel(report.totals.hours)} />
        <Kpi label="Unbilled" value={hoursLabel(report.totals.unbilledHours)} />
      </div>

      <table className="sb-table">
        <thead>
          <tr>
            <th>Worker</th>
            <th>Role</th>
            <th className="num">Hours</th>
            <th className="num">Billable</th>
            <th className="num">Billed</th>
            <th className="num">Unbilled</th>
            <th>Jobs</th>
            <th>Progress</th>
            <th>Last logged</th>
          </tr>
        </thead>
        <tbody>
          {report.workers.length === 0 ? (
            <tr>
              <td colSpan={9} className="py-8 text-center text-slate-400">
                No worker time has been logged yet.
              </td>
            </tr>
          ) : (
            report.workers.map((worker) => <WorkerRows key={worker.userId} worker={worker} />)
          )}
        </tbody>
      </table>
    </>
  );
}

function WorkerRows({ worker }: { worker: WorkerProgressRow }) {
  return (
    <>
      <tr>
        <td>
          <div className="font-medium">{worker.name}</div>
          {!worker.active && <div className="text-[11px] text-slate-400">Inactive</div>}
        </td>
        <td className="capitalize">{worker.roleLabel}</td>
        <td className="num">{hoursLabel(worker.hours)}</td>
        <td className="num">{hoursLabel(worker.billableHours)}</td>
        <td className="num">{hoursLabel(worker.billedHours)}</td>
        <td className="num">{hoursLabel(worker.unbilledHours)}</td>
        <td>{worker.jobCount}</td>
        <td>
          <Bar value={worker.billedPercent} />
        </td>
        <td>{worker.lastDate ?? "—"}</td>
      </tr>
      {worker.jobs.map((job) => (
        <tr key={`${worker.userId}-${job.projectId}`} className="text-slate-500">
          <td colSpan={2} className="pl-6 text-[12px]">
            {job.projectName}
            <span className="ml-2 uppercase tracking-[0.08em] text-slate-400">{job.projectStatus}</span>
          </td>
          <td className="num text-[12px]">{hoursLabel(job.hours)}</td>
          <td className="num text-[12px]">{hoursLabel(job.billableHours)}</td>
          <td className="num text-[12px]">{hoursLabel(job.billedHours)}</td>
          <td colSpan={2} className="text-[12px]">
            {Number(job.budgetHours) > 0 ? `${hoursLabel(job.hours)} of ${hoursLabel(job.budgetHours)} budget` : "No hour budget"}
          </td>
          <td>
            <Bar value={Number(job.budgetHours) > 0 ? job.percentOfBudget : worker.billedPercent} />
          </td>
          <td />
        </tr>
      ))}
    </>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="kpi p-3">
      <div className="kpi-title">{label}</div>
      <div className="kpi-value text-[18px]">{value}</div>
    </div>
  );
}
