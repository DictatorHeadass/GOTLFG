import { prisma } from "@/lib/prisma";
import { getViewer } from "@/lib/session";
import { reportSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import { firstIssue, jsonError } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const viewer = await getViewer();
  if (!viewer) return jsonError(401, "Sign in first");
  if (!rateLimit(`report:${viewer.id}`, 10, 60 * 60_000)) {
    return jsonError(429, "You've filed a lot of reports. Try again later.");
  }

  const parsed = reportSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(400, firstIssue(parsed.error));

  if (parsed.data.targetUserId === viewer.id) {
    return jsonError(400, "You can't report yourself");
  }

  await prisma.report.create({
    data: {
      reporterId: viewer.id,
      targetUserId: parsed.data.targetUserId,
      groupId: parsed.data.groupId ?? null,
      reason: parsed.data.reason,
    },
  });

  return Response.json({ ok: true }, { status: 201 });
}
