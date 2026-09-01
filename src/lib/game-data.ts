/**
 * Single source of truth for Ghosts of Tabor game data.
 *
 * When the game ships a new map or renames one, edit THIS FILE ONLY - every
 * form, filter and card reads from here. Nothing else hardcodes a map name.
 */

export const MAPS = [
  { id: "island", name: "Island of Tabor" },
  { id: "matka", name: "Matka Miest" },
  { id: "matka_underground", name: "Matka Miest Underground" },
  { id: "silo", name: "Silo" },
  { id: "chodov", name: "Chodov Mall" },
] as const;

export type MapId = (typeof MAPS)[number]["id"];

/** Sentinel used when a host is happy to run any map. */
export const ANY = "any" as const;
export type Any = typeof ANY;

export const MODES = ["PvP", "PvE"] as const;
export type Mode = (typeof MODES)[number];

export const SKILLS = ["Beginner", "Intermediate", "Advanced"] as const;
export type Skill = (typeof SKILLS)[number];

export const PLATFORMS = ["Quest", "PCVR"] as const;
export type Platform = (typeof PLATFORMS)[number];

export const REGIONS = [
  { id: "na-east", name: "NA East" },
  { id: "na-west", name: "NA West" },
  { id: "eu", name: "Europe" },
  { id: "oce", name: "Oceania" },
  { id: "asia", name: "Asia" },
  { id: "sa", name: "South America" },
] as const;

export type RegionId = (typeof REGIONS)[number]["id"];

/** Minimum age a host can require. 13 is the floor - under-13 cannot sign up at all. */
export const AGE_GATES = [13, 16, 18] as const;
export type AgeGate = (typeof AGE_GATES)[number];

/** Squad sizes a host can advertise. */
export const PARTY_SIZES = [2, 3, 4, 5] as const;
export const MIN_PARTY = PARTY_SIZES[0];
export const MAX_PARTY = PARTY_SIZES[PARTY_SIZES.length - 1];

/** How long a posted group stays on the board before it drops off. */
export const GROUP_TTL_MINUTES = 60;

/** Max length of the free-text note on a group. */
export const NOTE_MAX_LENGTH = 240;

/** Max length of a lobby chat message. */
export const MESSAGE_MAX_LENGTH = 300;

/** Meta usernames are short; this is a sanity cap, not a spec. */
export const QUEST_NAME_MAX_LENGTH = 32;

/**
 * One-tap lobby messages.
 *
 * Typing in a headset means a virtual keyboard and a laser pointer, which is
 * miserable mid-raid. These cover the things people actually need to say fast,
 * so the common case is one tap and no keyboard at all.
 */
export const QUICK_PHRASES = [
  "Ready?",
  "On my way",
  "Regroup on me",
  "Enemy spotted",
  "Need ammo",
  "Need meds",
  "I'm down",
  "Extracting",
] as const;

// ---------------------------------------------------------------------------
// Lookup helpers - always use these for display, never raw ids.
// ---------------------------------------------------------------------------

export const MAP_IDS: readonly string[] = MAPS.map((m) => m.id);
export const REGION_IDS: readonly string[] = REGIONS.map((r) => r.id);

export function mapName(id: string): string {
  if (id === ANY) return "Any map";
  return MAPS.find((m) => m.id === id)?.name ?? id;
}

export function regionName(id: string): string {
  if (id === ANY) return "Any region";
  return REGIONS.find((r) => r.id === id)?.name ?? id;
}

export function platformName(id: string): string {
  return id === ANY ? "Quest or PCVR" : id;
}

export function skillName(id: string): string {
  return id === ANY ? "Any skill" : id;
}

export function ageGateLabel(minAge: number): string {
  return `${minAge}+`;
}
