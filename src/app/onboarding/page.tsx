import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/OnboardingForm";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getViewer } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/");
  if (viewer.onboarded) redirect("/");

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader viewer={viewer} />
      <main className="mx-auto w-full max-w-[680px] flex-1 px-4 py-8 sm:px-6">
        <OnboardingForm />
      </main>
      <SiteFooter />
    </div>
  );
}
