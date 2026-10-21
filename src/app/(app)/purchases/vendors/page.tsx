import { ContactModule } from "@/components/modules/contact-module";
export const dynamic = "force-dynamic";
export default async function Page() {
  return <ContactModule kind="vendor" />;
}
