import { z } from "zod";
import {
  ANY,
  MAP_IDS,
  MESSAGE_MAX_LENGTH,
  MODES,
  NOTE_MAX_LENGTH,
  PARTY_SIZES,
  PLATFORMS,
  QUEST_NAME_MAX_LENGTH,
  REGION_IDS,
  SKILLS,
  AGE_GATES,
} from "@/lib/game-data";

/** Membership test that survives readonly `as const` arrays from game-data. */
const oneOf = <T extends string>(values: readonly T[], label: string) =>
  z.string().refine((v): v is T => (values as readonly string[]).includes(v), {
    message: `Pick a valid ${label}`,
  });

const withAny = <T extends string>(values: readonly T[], label: string) =>
  oneOf([...values, ANY] as readonly (T | typeof ANY)[], label);

export const createGroupSchema = z.object({
  map: withAny(MAP_IDS as readonly string[], "map"),
  mode: oneOf(MODES, "mode"),
  skill: withAny(SKILLS, "skill level"),
  region: oneOf(REGION_IDS as readonly string[], "region"),
  platform: withAny(PLATFORMS, "platform"),
  minAge: z.coerce
    .number()
    .int()
    .refine((n) => (AGE_GATES as readonly number[]).includes(n), {
      message: "Age gate must be 13, 16 or 18",
    }),
  maxSize: z.coerce
    .number()
    .int()
    .refine((n) => (PARTY_SIZES as readonly number[]).includes(n), {
      message: "Pick a valid squad size",
    }),
  micRequired: z.coerce.boolean().default(false),
  note: z
    .string()
    .trim()
    .max(NOTE_MAX_LENGTH, `Keep it under ${NOTE_MAX_LENGTH} characters`)
    .optional()
    .transform((v) => (v ? v : null)),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;

/** Optional. Empty string and "not set" both normalise to null. */
const questNameField = z
  .string()
  .trim()
  .max(QUEST_NAME_MAX_LENGTH, `Keep it under ${QUEST_NAME_MAX_LENGTH} characters`)
  .regex(/^[a-zA-Z0-9._-]*$/, "Letters, numbers, dots, underscores and hyphens only")
  .optional()
  .transform((v) => (v && v.length > 0 ? v : null));

export const onboardingSchema = z.object({
  birthDate: z.string().min(1, "Enter your date of birth"),
  region: oneOf(REGION_IDS as readonly string[], "region"),
  platform: oneOf(PLATFORMS, "platform"),
  defaultSkill: oneOf(SKILLS, "skill level"),
  hasMic: z.coerce.boolean().default(true),
  questName: questNameField,
});

export const messageSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Type something first")
    .max(MESSAGE_MAX_LENGTH, `Keep it under ${MESSAGE_MAX_LENGTH} characters`),
});

/** Same fields as onboarding minus the birth date, which is set once. */
export const profileSchema = onboardingSchema.omit({ birthDate: true });

export const reportSchema = z.object({
  targetUserId: z.string().min(1),
  groupId: z.string().optional(),
  reason: z.string().trim().min(3, "Say what happened").max(500),
});

/** Board filters arrive as URL search params, so everything is a string. */
export function parseFilters(params: URLSearchParams) {
  const list = (key: string) =>
    (params.get(key) ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  const maps = list("map").filter((m) => (MAP_IDS as readonly string[]).includes(m));
  const regions = list("region").filter((r) => (REGION_IDS as readonly string[]).includes(r));
  const modeParam = params.get("mode");
  const skillParam = params.get("skill");
  const platformParam = params.get("platform");

  return {
    maps,
    regions,
    mode: (MODES as readonly string[]).includes(modeParam ?? "") ? (modeParam as string) : null,
    skill: (SKILLS as readonly string[]).includes(skillParam ?? "") ? (skillParam as string) : null,
    platform: (PLATFORMS as readonly string[]).includes(platformParam ?? "")
      ? (platformParam as string)
      : null,
    adultOnly: params.get("adult") === "1",
    micOnly: params.get("mic") === "1",
    hideFull: params.get("hidefull") === "1",
  };
}

export type BoardFilters = ReturnType<typeof parseFilters>;
