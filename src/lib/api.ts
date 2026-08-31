import "server-only";

export function jsonError(status: number, error: string): Response {
  return Response.json({ error }, { status });
}

/** Flatten a ZodError into one readable sentence for the form to display. */
export function firstIssue(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? "That didn't look right";
}
