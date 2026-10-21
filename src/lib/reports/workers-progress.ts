import { ROLES, type Role } from "@/lib/catalog";
import { m } from "@/lib/money";
import { currentOrg, listProjects, listStaff, listTimesheets } from "@/lib/queries";

export type WorkerJob = {
  projectId: string;
  projectName: string;
  projectStatus: string;
  budgetHours: string;
  hours: string;
  billableHours: string;
  billedHours: string;
  percentOfBudget: number;
};

export type WorkerProgressRow = {
  userId: string;
  name: string;
  role: string;
  roleLabel: string;
  active: boolean;
  hours: string;
  billableHours: string;
  billedHours: string;
  unbilledHours: string;
  lastDate: string | null;
  jobCount: number;
  billedPercent: number;
  jobs: WorkerJob[];
};

export type WorkersProgressReport = {
  orgName: string;
  currency: string;
  workers: WorkerProgressRow[];
  totals: {
    workerCount: number;
    activeOnJobs: number;
    hours: string;
    billableHours: string;
    billedHours: string;
    unbilledHours: string;
  };
};

function hours(value: string | number | null | undefined) {
  return m(value).toFixed(2);
}

function pct(part: string, whole: string) {
  const w = m(whole);
  if (w.eq(0)) return 0;
  return Math.max(0, Math.min(100, Number(m(part).div(w).times(100).round(1))));
}

function roleLabel(role: string) {
  return ROLES[role as Role]?.label ?? role.replaceAll("_", " ");
}

export async function workersProgressReport(): Promise<WorkersProgressReport> {
  const [{ org }, staff, timesheets, projects] = await Promise.all([
    currentOrg(),
    listStaff(),
    listTimesheets(),
    listProjects(),
  ]);

  const projectById = new Map(projects.map((p) => [p.id, p]));
  const byUser = new Map<string, (typeof timesheets)[number][]>();
  for (const row of timesheets) {
    const userId = row.userId || "unassigned";
    const list = byUser.get(userId) ?? [];
    list.push(row);
    byUser.set(userId, list);
  }

  const staffIds = new Set(staff.map((u) => u.id));
  const workers: WorkerProgressRow[] = staff.map((user) => buildWorker(user.id, user.name, user.role, user.isActive, byUser.get(user.id) ?? [], projectById));

  for (const [userId, rows] of byUser) {
    if (userId === "unassigned" || staffIds.has(userId)) continue;
    workers.push(buildWorker(userId, "Unknown worker", "staff", false, rows, projectById));
  }

  const unassigned = byUser.get("unassigned");
  if (unassigned?.length) {
    workers.push(buildWorker("unassigned", "Unassigned time", "staff", false, unassigned, projectById));
  }

  workers.sort((a, b) => Number(m(b.hours).minus(m(a.hours))));

  const totals = workers.reduce(
    (acc, row) => ({
      workerCount: acc.workerCount + 1,
      activeOnJobs: acc.activeOnJobs + (Number(row.hours) > 0 ? 1 : 0),
      hours: hours(m(acc.hours).plus(m(row.hours))),
      billableHours: hours(m(acc.billableHours).plus(m(row.billableHours))),
      billedHours: hours(m(acc.billedHours).plus(m(row.billedHours))),
      unbilledHours: hours(m(acc.unbilledHours).plus(m(row.unbilledHours))),
    }),
    { workerCount: 0, activeOnJobs: 0, hours: "0.00", billableHours: "0.00", billedHours: "0.00", unbilledHours: "0.00" },
  );

  return {
    orgName: org?.name ?? "Sarafa Books",
    currency: org?.baseCurrency ?? "INR",
    workers,
    totals,
  };
}

function buildWorker(
  userId: string,
  name: string,
  role: string,
  active: boolean,
  rows: Awaited<ReturnType<typeof listTimesheets>>,
  projectById: Map<string, Awaited<ReturnType<typeof listProjects>>[number]>,
): WorkerProgressRow {
  const jobMap = new Map<string, WorkerJob>();
  let total = m(0);
  let billable = m(0);
  let billed = m(0);
  let lastDate: string | null = null;

  for (const row of rows) {
    total = total.plus(m(row.hours));
    if (row.billable) billable = billable.plus(m(row.hours));
    if (row.billed) billed = billed.plus(m(row.hours));
    if (!lastDate || row.date > lastDate) lastDate = row.date;
    const project = projectById.get(row.projectId);
    const job = jobMap.get(row.projectId) ?? {
      projectId: row.projectId,
      projectName: project?.name ?? "Job",
      projectStatus: project?.status ?? "active",
      budgetHours: hours(project?.budgetHours),
      hours: "0.00",
      billableHours: "0.00",
      billedHours: "0.00",
      percentOfBudget: 0,
    };
    job.hours = hours(m(job.hours).plus(m(row.hours)));
    if (row.billable) job.billableHours = hours(m(job.billableHours).plus(m(row.hours)));
    if (row.billed) job.billedHours = hours(m(job.billedHours).plus(m(row.hours)));
    job.percentOfBudget = pct(job.hours, job.budgetHours);
    jobMap.set(row.projectId, job);
  }

  const jobs = [...jobMap.values()].sort((a, b) => Number(m(b.hours).minus(m(a.hours))));
  return {
    userId,
    name,
    role,
    roleLabel: roleLabel(role),
    active,
    hours: hours(total),
    billableHours: hours(billable),
    billedHours: hours(billed),
    unbilledHours: hours(billable.minus(billed).lt(0) ? m(0) : billable.minus(billed)),
    lastDate,
    jobCount: jobs.length,
    billedPercent: pct(hours(billed), hours(billable.eq(0) ? total : billable)),
    jobs,
  };
}
