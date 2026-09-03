import "server-only";

import { Prisma, GroupStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { ANY } from "@/lib/game-data";
import type { BoardFilters } from "@/lib/validation";
import type { GroupDTO } from "@/lib/types";

export const GROUP_INCLUDE = {
  members: {
    orderBy: { joinedAt: "asc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          discordName: true,
          questName: true,
          micVerifiedAt: true,
        },
      },
    },
  },
} satisfies Prisma.GroupInclude;

export type GroupWithMembers = Prisma.GroupGetPayload<{ include: typeof GROUP_INCLUDE }>;

/**
 * The single place a Discord handle is allowed onto the wire.
 *
 * Every route that returns a group goes through here. If you find yourself
 * building a group response by hand somewhere else, don't - you will leak the
 * handles of people who did not agree to share them with that viewer.
 */
export function serializeGroup(group: GroupWithMembers, viewerId: string | null): GroupDTO {
  const isMember = viewerId !== null && group.members.some((m) => m.userId === viewerId);

  return {
    id: group.id,
    map: group.map,
    mode: group.mode,
    skill: group.skill,
    minAge: group.minAge,
    maxSize: group.maxSize,
    filled: group.members.length,
    region: group.region,
    platform: group.platform,
    micRequired: group.micRequired,
    note: group.note,
    status: group.status,
    createdAt: group.createdAt.toISOString(),
    expiresAt: group.expiresAt.toISOString(),
    hostId: group.hostId,
    isMember,
    isHost: viewerId !== null && group.hostId === viewerId,
    members: group.members.map((m) => ({
      id: m.user.id,
      name: m.user.name,
      image: m.user.image,
      role: m.role,
      // Cleared on every sign-in, so a non-null value means "verified during
      // their current session" without needing to know their session token.
      micVerified: m.user.micVerifiedAt !== null,
      // Spread, so the keys are genuinely absent for non-members.
      ...(isMember
        ? { discordName: m.user.discordName, questName: m.user.questName }
        : {}),
    })),
  };
}

/**
 * Board query.
 *
 * `viewerAge` null means signed-out: the board is public, so they see
 * everything and are asked to sign in before joining. A signed-in user only
 * ever sees groups they are actually old enough to join - showing a minor an
 * 18+ squad they will be refused at the door helps nobody.
 */
export function buildBoardWhere(
  filters: BoardFilters,
  viewerAge: number | null,
): Prisma.GroupWhereInput {
  const and: Prisma.GroupWhereInput[] = [];

  if (viewerAge !== null) and.push({ minAge: { lte: viewerAge } });
  if (filters.adultOnly) and.push({ minAge: 18 });

  // A host who will run "any" map matches every specific map filter, and the
  // same for skill and platform. Region is always concrete - ping is not a
  // preference.
  if (filters.maps.length) and.push({ map: { in: [...filters.maps, ANY] } });
  if (filters.regions.length) and.push({ region: { in: filters.regions } });
  if (filters.mode) and.push({ mode: filters.mode });
  if (filters.skill) and.push({ skill: { in: [filters.skill, ANY] } });
  if (filters.platform) and.push({ platform: { in: [filters.platform, ANY] } });
  if (filters.micOnly) and.push({ micRequired: true });

  return {
    // Lazy expiry: nothing sweeps the table, the board just stops looking at
    // rows whose time is up. No cron job, no scheduled function.
    expiresAt: { gt: new Date() },
    status: filters.hideFull
      ? GroupStatus.OPEN
      : { in: [GroupStatus.OPEN, GroupStatus.FULL] },
    ...(and.length ? { AND: and } : {}),
  };
}

export async function getBoard(filters: BoardFilters, viewer: { id: string; age: number | null } | null) {
  const where = buildBoardWhere(filters, viewer?.age ?? null);

  const groups = await prisma.group.findMany({
    where,
    include: GROUP_INCLUDE,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
  });

  return groups.map((g) => serializeGroup(g, viewer?.id ?? null));
}

/** Header counters. Deliberately unfiltered - this is the state of the whole board. */
export async function getBoardStats() {
  const live = await prisma.group.findMany({
    where: { expiresAt: { gt: new Date() }, status: { in: [GroupStatus.OPEN, GroupStatus.FULL] } },
    select: { _count: { select: { members: true } } },
  });

  return {
    squads: live.length,
    operators: live.reduce((sum, g) => sum + g._count.members, 0),
  };
}

/** Load one group, treating an expired or closed one as gone. */
export async function getLiveGroup(id: string) {
  const group = await prisma.group.findUnique({ where: { id }, include: GROUP_INCLUDE });
  if (!group) return null;
  if (group.status === GroupStatus.CLOSED) return null;
  if (group.expiresAt.getTime() <= Date.now()) return null;
  return group;
}

/** Keep status in step with occupancy after anyone joins or leaves. */
export async function syncGroupStatus(groupId: string) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { maxSize: true, status: true, _count: { select: { members: true } } },
  });
  if (!group || group.status === GroupStatus.CLOSED) return;

  const next = group._count.members >= group.maxSize ? GroupStatus.FULL : GroupStatus.OPEN;
  if (next !== group.status) {
    await prisma.group.update({ where: { id: groupId }, data: { status: next } });
  }
}
