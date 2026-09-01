/**
 * Wire types shared by server and client.
 *
 * Kept separate from lib/groups.ts because the generated Prisma client touches
 * node:process and node:path - importing it from a client component breaks the
 * build. Client components import from here only.
 */

export type MemberDTO = {
  id: string;
  name: string | null;
  image: string | null;
  role: "HOST" | "MEMBER";
  /**
   * Present ONLY when the viewer is a member of this squad. When they are not,
   * the key is absent from the payload entirely - not blank, not hidden in CSS.
   */
  discordName?: string | null;
  /** Same rule as discordName: squad members only. */
  questName?: string | null;
};

export type MessageDTO = {
  id: string;
  body: string;
  createdAt: string;
  authorId: string;
  authorName: string | null;
  authorImage: string | null;
};

export type GroupDTO = {
  id: string;
  map: string;
  mode: string;
  skill: string;
  minAge: number;
  maxSize: number;
  filled: number;
  region: string;
  platform: string;
  micRequired: boolean;
  note: string | null;
  status: "OPEN" | "FULL" | "CLOSED";
  createdAt: string;
  expiresAt: string;
  hostId: string;
  isMember: boolean;
  isHost: boolean;
  members: MemberDTO[];
};

export type BoardStats = {
  squads: number;
  operators: number;
};

export type BoardResponse = {
  groups: GroupDTO[];
  stats: BoardStats;
};

export type ApiError = { error: string };
