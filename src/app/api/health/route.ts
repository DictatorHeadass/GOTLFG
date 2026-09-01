import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Uptime probe for the Discord bot's status channel (and anything else that
 * wants to know whether the board is actually serving).
 *
 * Cheap on purpose: one indexed count, no session lookup, no board assembly.
 * A 200 means the app is up AND can reach the database; anything else means
 * members would see errors, so the status channel should say so.
 */
export async function GET() {
  const startedAt = Date.now();

  let database: "up" | "down" = "up";
  let openGroups: number | null = null;
  let error: string | null = null;

  try {
    openGroups = await prisma.group.count({ where: { status: "OPEN", expiresAt: { gt: new Date() } } });
  } catch (cause) {
    database = "down";
    // Deliberately generic on the wire. This endpoint is public, and driver
    // errors carry the connection detail with them: a DNS failure prints the
    // Neon hostname, an auth failure prints the database user. The real cause
    // goes to the server log, where only we can read it.
    console.error("[health] database probe failed", cause);
    error = "database unreachable";
  }

  const body = {
    status: database === "up" ? "ok" : "degraded",
    database,
    openGroups,
    latencyMs: Date.now() - startedAt,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    ...(error ? { error } : {}),
  };

  return Response.json(body, {
    status: database === "up" ? 200 : 503,
    headers: { "cache-control": "no-store" },
  });
}
