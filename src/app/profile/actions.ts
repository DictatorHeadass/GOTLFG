"use server";

import { revalidatePath } from "next/cache";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { profileSchema } from "@/lib/validation";

export type ProfileState = { error: string | null; saved: boolean };

export async function saveProfile(
  _previous: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sign in first", saved: false };

  const parsed = profileSchema.safeParse({
    region: formData.get("region") ?? "",
    platform: formData.get("platform") ?? "",
    defaultSkill: formData.get("defaultSkill") ?? "",
    hasMic: formData.get("hasMic") === "on",
    questName: (formData.get("questName") as string | null) ?? undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form", saved: false };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      region: parsed.data.region,
      platform: parsed.data.platform,
      defaultSkill: parsed.data.defaultSkill,
      hasMic: parsed.data.hasMic,
      questName: parsed.data.questName,
    },
  });

  revalidatePath("/profile");
  return { error: null, saved: true };
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
