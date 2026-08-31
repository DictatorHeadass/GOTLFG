import { Prisma, GroupStatus, MemberRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getViewerRecord } from "@/lib/session";
import { meetsAgeGate } from "@/lib/age";
import { getLiveGroup, serializeGroup, syncGroupStatus } from "@/lib/groups";
import { rateLimit } from "@/lib/rate-limit";
import { jsonError } from "@/lib/api";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Ctx) {
  const { id } = await params;

  const record = await getViewerRecord();
  if (!record) return jsonError(401, "Sign in to join a squad");
  if (!record.onboardedAt || !record.birthDate) {
    return jsonError(403, "Finish setting up your profile first");
  }
  if (!rateLimit(`join:${record.id}`, 30, 60_000)) {
    return jsonError(429, "Slow down for a second");
  }

  const group = await getLiveGroup(id);
  if (!group) return jsonError(404, "That squad is gone");

  if (group.members.some((m) => m.userId === record.id)) {
    return jsonError(409, "You're already in this squad");
  }

  // THE age gate. The board hides squads a user is too young for, but a hidden
  // card is still one curl away — this is the check that actually holds.
  if (!meetsAgeGate(record.birthDate, group.minAge)) {
    return jsonError(403, `This squad is ${group.minAge}+`);
  }

  try {
    // Serializable, because two people can click Join on the last slot in the
    // same tick and a plain count-then-insert would seat them both.
    await prisma.$transaction(
      async (tx) => {
        const taken = await tx.groupMember.count({ where: { groupId: id } });
        if (taken >= group.maxSize) throw new Error("SQUAD_FULL");
        await tx.groupMember.create({
          data: { groupId: id, userId: record.id, role: MemberRole.MEMBER },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "SQUAD_FULL") {
      return jsonError(409, "That squad just filled up");
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") return jsonError(409, "You're already in this squad");
      // Serialization failure: someone beat this request to the slot.
      if (error.code === "P2034") return jsonError(409, "Someone got that slot first. Try again.");
    }
    throw error;
  }

  await syncGroupStatus(id);

  const updated = await getLiveGroup(id);
  if (!updated) return jsonError(404, "That squad is gone");
  return Response.json(serializeGroup(updated, record.id));
}
