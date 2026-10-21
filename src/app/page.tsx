import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { postLoginPath } from "@/lib/auth-profiles";

export default async function IndexPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  redirect(postLoginPath(session.user.role));
}
