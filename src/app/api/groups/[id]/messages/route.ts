import { GroupStatus } from "@/generated/prisma/client";
import { jsonError, firstIssue } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { getViewer } from "@/lib/session";
import type { MessageDTO } from "@/lib/types";
import { messageSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const AUTHOR = { select: { id: true, name: true, image: true } };

/**
 * The lobby is squad-only, in both directions. Same rule as the Discord
 * handles: someone who has not joined gets 403, not an empty list - an empty
 * list would invite a client to render a chat box that silently fails.
 */
async function membership(groupId: string, userId: string) {
  return prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
}

export async function GET(_request: Request, { params }: Ctx) {
  const { id } = await params;

  const viewer = await getViewer();
  if (!viewer) return jsonError(401, "Sign in first");
  if (!(await membership(id, viewer.id))) {
    return jsonError(403, "Only squad members can read the lobby");
  }

  // Newest 200, then flipped back into reading order.
  const rows = await prisma.message.findMany({
    where: { groupId: id },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: AUTHOR },
  });

  const messages: MessageDTO[] = rows.reverse().map((m) => ({
    id: m.id,
    body: m.body,
    createdAt: m.createdAt.toISOString(),
    authorId: m.user.id,
    authorName: m.user.name,
    authorImage: m.user.image,
  }));

  return Response.json({ messages });
}

export async function POST(request: Request, { params }: Ctx) {
  const { id } = await params;

  const viewer = await getViewer();
  if (!viewer) return jsonError(401, "Sign in first");
  if (!(await membership(id, viewer.id))) {
    return jsonError(403, "Only squad members can post in the lobby");
  }

  if (!rateLimit(`msg:${viewer.id}`, 20, 60_000)) {
    return jsonError(429, "Slow down");
  }

  const group = await prisma.group.findUnique({
    where: { id },
    select: { status: true, expiresAt: true },
  });
  if (!group) return jsonError(404, "That squad is gone");
  if (group.status === GroupStatus.CLOSED || group.expiresAt.getTime() <= Date.now()) {
    return jsonError(409, "This squad has closed");
  }

  const parsed = messageSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(400, firstIssue(parsed.error));

  const created = await prisma.message.create({
    data: { groupId: id, userId: viewer.id, body: parsed.data.body },
    include: { user: AUTHOR },
  });

  const message: MessageDTO = {
    id: created.id,
    body: created.body,
    createdAt: created.createdAt.toISOString(),
    authorId: created.user.id,
    authorName: created.user.name,
    authorImage: created.user.image,
  };

  return Response.json(message, { status: 201 });
}
