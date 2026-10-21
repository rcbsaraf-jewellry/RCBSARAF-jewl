import { WorkersProgressView } from "@/components/reports/workers-progress-view";
import { workersProgressReport } from "@/lib/reports/workers-progress";

export const dynamic = "force-dynamic";

export default async function WorkersProgressPage() {
  const report = await workersProgressReport();

  return (
    <div className="sb-page mx-auto max-w-5xl">
      <div className="kpi-title">Time Tracking</div>
      <h1 className="sb-h1">Workers Progress</h1>
      <p className="sb-sub">
        {report.orgName} · Hours logged, billed progress, and jobs in hand
      </p>
      <div className="sb-card mt-6 overflow-x-auto p-5">
        <WorkersProgressView report={report} />
      </div>
    </div>
  );
}
