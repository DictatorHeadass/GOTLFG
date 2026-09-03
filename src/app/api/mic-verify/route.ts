import { z } from "zod";
import { firstIssue, jsonError } from "@/lib/api";
import { MIC_PHRASES } from "@/lib/game-data";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { getViewer } from "@/lib/session";

export const dynamic = "force-dynamic";

const schema = z.object({
  method: z.enum(["speech", "utterance"]),
  phrasesPassed: z.coerce.number().int(),
});

/**
 * Records a passed mic check for the current session.
 *
 * Honest about what this is: the browser reports the result, so a determined
 * person can POST here without saying a word. That is true of any client-side
 * media check - the audio never leaves the device, so the server has nothing to
 * re-verify against. The badge therefore means "this browser reported a passing
 * check this session", and the UI says as much rather than implying proof.
 */
export async function POST(request: Request) {
  const viewer = await getViewer();
  if (!viewer) return jsonError(401, "Sign in first");
  if (!viewer.sessionKey) return jsonError(400, "No active session");
  if (!rateLimit(`mic:${viewer.id}`, 10, 10 * 60_000)) {
    return jsonError(429, "Too many mic checks. Try again shortly.");
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(400, firstIssue(parsed.error));

  if (parsed.data.phrasesPassed < MIC_PHRASES.length) {
    return jsonError(400, "Finish all the phrases first");
  }

  await prisma.user.update({
    where: { id: viewer.id },
    data: {
      micVerifiedAt: new Date(),
      micVerifiedSession: viewer.sessionKey,
      micVerifiedMethod: parsed.data.method,
    },
  });

  return Response.json({ ok: true, method: parsed.data.method });
}
