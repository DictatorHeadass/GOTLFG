"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isOldEnoughToSignUp, parseBirthDate } from "@/lib/age";
import { onboardingSchema } from "@/lib/validation";

export type OnboardingState = { error: string | null };

export async function saveOnboarding(
  _previous: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sign in first" };

  const parsed = onboardingSchema.safeParse({
    birthDate: formData.get("birthDate") ?? "",
    region: formData.get("region") ?? "",
    platform: formData.get("platform") ?? "",
    defaultSkill: formData.get("defaultSkill") ?? "",
    // Unchecked boxes are absent from FormData. Read it explicitly, or the
    // schema default quietly turns "no mic" into "has mic".
    hasMic: formData.get("hasMic") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form" };

  const birthDate = parseBirthDate(parsed.data.birthDate);
  if (!birthDate) return { error: "That date of birth doesn't look right" };

  // COPPA: no accounts for under-13s. OAuth already created a User row, so
  // refusing the form is not enough — the row goes too. Sessions, accounts and
  // memberships cascade with it.
  if (!isOldEnoughToSignUp(birthDate)) {
    await prisma.user.delete({ where: { id: session.user.id } });
    redirect("/too-young");
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      birthDate,
      region: parsed.data.region,
      platform: parsed.data.platform,
      defaultSkill: parsed.data.defaultSkill,
      hasMic: parsed.data.hasMic,
      onboardedAt: new Date(),
    },
  });

  redirect("/");
}
