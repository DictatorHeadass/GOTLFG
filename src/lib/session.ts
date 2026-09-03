import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type Viewer = {
  id: string;
  name: string | null;
  image: string | null;
  discordName: string | null;
  onboarded: boolean;
  /** Passed the mic check during this sign-in. */
  micVerified: boolean;
  /** Hash of this session's token; scopes the mic badge to one sign-in. */
  sessionKey: string | null;
};

/** The signed-in user, or null. Safe to expose - carries no birth date. */
export async function getViewer(): Promise<Viewer | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    name: session.user.name ?? null,
    image: session.user.image ?? null,
    discordName: session.user.discordName ?? null,
    onboarded: session.user.onboarded,
    micVerified: session.user.micVerified,
    sessionKey: session.user.sessionKey ?? null,
  };
}

/**
 * Full user row including birthDate. Server-only - never hand the result
 * straight to a client component or an API response body.
 */
export async function getViewerRecord() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({ where: { id: session.user.id } });
}
