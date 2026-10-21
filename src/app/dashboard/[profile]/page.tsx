import { notFound, redirect } from "next/navigation";
import { hasModuleAccess } from "@/lib/app-access";
import { postLoginPath, profileBySlug } from "@/lib/auth-profiles";

export default async function RoleDashboardPage({ params }: { params: Promise<{ profile: string }> }) {
  const { profile: slug } = await params;
  const profile = profileBySlug(slug);
  if (!profile) notFound();
  if (hasModuleAccess(profile.id)) redirect(postLoginPath(profile.id));

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c9a227]">Authenticated</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{profile.title}</h1>
      <p className="mt-3 max-w-xl text-stone-500">
        Signed in as {profile.label}. Inner modules for this workspace are not enabled in this phase.
      </p>
    </div>
  );
}
