import { GroupStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getViewer } from "@/lib/session";
import { getLiveGroup, serializeGroup } from "@/lib/groups";
import { jsonError } from "@/lib/api";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  const { id } = await params;
  const group = await getLiveGroup(id);
  if (!group) return jsonError(404, "That squad is gone");

  const viewer = await getViewer();
  return Response.json(serializeGroup(group, viewer?.id ?? null));
}

/** Disband. Host only. Kept as a CLOSED row so reports still have something to point at. */
export async function DELETE(_request: Request, { params }: Ctx) {
  const { id } = await params;
  const viewer = await getViewer();
  if (!viewer) return jsonError(401, "Sign in first");

  const group = await prisma.group.findUnique({ where: { id }, select: { hostId: true } });
  if (!group) return jsonError(404, "That squad is gone");
  if (group.hostId !== viewer.id) return jsonError(403, "Only the host can disband this squad");

  await prisma.group.update({ where: { id }, data: { status: GroupStatus.CLOSED } });
  return Response.json({ ok: true });
}
