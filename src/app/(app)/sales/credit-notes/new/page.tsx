import { DocumentModule } from "@/components/modules/document-module";

export const dynamic = "force-dynamic";
export default async function Page() {
  return <DocumentModule type="credit_note" mode="new" />;
}
