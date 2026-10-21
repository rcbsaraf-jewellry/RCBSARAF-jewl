import { ContactModule } from "@/components/modules/contact-module";
export const dynamic = "force-dynamic";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ContactModule kind="customer" id={id} />;
}
