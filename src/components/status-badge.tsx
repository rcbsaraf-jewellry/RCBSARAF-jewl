import { STATUS_META } from "@/lib/catalog";
import { cn } from "@/lib/utils";

const tones: Record<string, string> = {
  slate: "bg-slate-100 text-slate-700",
  blue: "bg-sky-100 text-sky-800",
  amber: "bg-amber-100 text-amber-800",
  red: "bg-rose-100 text-rose-800",
  green: "bg-emerald-100 text-emerald-800",
  violet: "bg-violet-100 text-violet-800",
  zinc: "bg-zinc-200 text-zinc-700",
};

export function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: status.replaceAll("_", " "), tone: "slate" as const };
  return <span className={cn("chip", tones[meta.tone])}>{meta.label}</span>;
}
