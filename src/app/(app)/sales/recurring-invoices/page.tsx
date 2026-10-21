import { DocumentModule } from "@/components/modules/document-module";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  return <DocumentModule type="recurring_invoice" status={status ?? "all"} />;
}
