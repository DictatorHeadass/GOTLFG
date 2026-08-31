import { GroupStatus, MemberRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getViewer } from "@/lib/session";
import { syncGroupStatus } from "@/lib/groups";
import { jsonError } from "@/lib/api";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Ctx) {
  const { id } = await params;

  const viewer = await getViewer();
  if (!viewer) return jsonError(401, "Sign in first");

  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: id, userId: viewer.id } },
  });
  if (!membership) return jsonError(404, "You're not in this squad");

  await prisma.$transaction(async (tx) => {
    await tx.groupMember.delete({ where: { id: membership.id } });

    const remaining = await tx.groupMember.findMany({
      where: { groupId: id },
      orderBy: { joinedAt: "asc" },
    });

    // Last one out closes the squad rather than leaving an empty row on the board.
    if (remaining.length === 0) {
      await tx.group.update({ where: { id }, data: { status: GroupStatus.CLOSED } });
      return;
    }

    // Host left: hand the squad to whoever has been in it longest, so the
    // remaining members keep a squad instead of losing it.
    if (membership.role === MemberRole.HOST) {
      const successor = remaining[0];
      await tx.groupMember.update({
        where: { id: successor.id },
        data: { role: MemberRole.HOST },
      });
      await tx.group.update({ where: { id }, data: { hostId: successor.userId } });
    }
  });

  await syncGroupStatus(id);
  return Response.json({ ok: true });
}
