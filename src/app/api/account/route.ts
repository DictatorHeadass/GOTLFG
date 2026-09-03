import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getViewer } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * Delete the signed-in user's account and everything attached to it.
 *
 * This is the right-to-erasure control, and it is a real deletion rather than a
 * flag: sessions, OAuth accounts, hosted squads, memberships, lobby messages
 * and reports they filed all cascade from this row. Reports filed *against*
 * them cascade away too, which is the honest trade - we cannot keep records
 * about someone who has asked to be forgotten.
 *
 * Nothing here is recoverable, which is why the UI asks for typed confirmation.
 */
export async function DELETE() {
  const viewer = await getViewer();
  if (!viewer) return jsonError(401, "Sign in first");

  await prisma.user.delete({ where: { id: viewer.id } });

  // The session row went with the user, so the cookie now points at nothing.
  return Response.json({ ok: true });
}
