import { GroupStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getViewerRecord } from "@/lib/session";
import { getAge } from "@/lib/age";
import { getBoard, getBoardStats, serializeGroup, GROUP_INCLUDE } from "@/lib/groups";
import { createGroupSchema, parseFilters } from "@/lib/validation";
import { GROUP_TTL_MINUTES } from "@/lib/game-data";
import { rateLimit } from "@/lib/rate-limit";
import { firstIssue, jsonError } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const filters = parseFilters(new URL(request.url).searchParams);
  const record = await getViewerRecord();

  const viewer = record
    ? { id: record.id, age: record.birthDate ? getAge(record.birthDate) : null }
    : null;

  const [groups, stats] = await Promise.all([getBoard(filters, viewer), getBoardStats()]);
  return Response.json({ groups, stats });
}

export async function POST(request: Request) {
  const record = await getViewerRecord();
  if (!record) return jsonError(401, "Sign in to post a squad");
  if (!record.onboardedAt || !record.birthDate) {
    return jsonError(403, "Finish setting up your profile first");
  }

  if (!rateLimit(`create:${record.id}`, 5, 10 * 60_000)) {
    return jsonError(429, "You're posting too fast. Wait a few minutes.");
  }

  const parsed = createGroupSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(400, firstIssue(parsed.error));
  const input = parsed.data;

  // A host cannot gate a squad above their own age - otherwise a 15-year-old
  // posts an 18+ squad and is the one person in it who fails the door check.
  const hostAge = getAge(record.birthDate);
  if (input.minAge > hostAge) {
    return jsonError(403, `You can't host a ${input.minAge}+ squad`);
  }

  const existing = await prisma.group.count({
    where: {
      hostId: record.id,
      status: { in: [GroupStatus.OPEN, GroupStatus.FULL] },
      expiresAt: { gt: new Date() },
    },
  });
  if (existing > 0) {
    return jsonError(409, "You already have a squad on the board. Disband it first.");
  }

  const group = await prisma.group.create({
    data: {
      hostId: record.id,
      map: input.map,
      mode: input.mode,
      skill: input.skill,
      region: input.region,
      platform: input.platform,
      minAge: input.minAge,
      maxSize: input.maxSize,
      micRequired: input.micRequired,
      note: input.note,
      expiresAt: new Date(Date.now() + GROUP_TTL_MINUTES * 60_000),
      // The host occupies the first slot - a 0/4 squad with a host in it is a lie.
      members: { create: { userId: record.id, role: "HOST" } },
    },
    include: GROUP_INCLUDE,
  });

  return Response.json(serializeGroup(group, record.id), { status: 201 });
}
