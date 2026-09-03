import { createHash } from "node:crypto";
import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

/**
 * Stable per-session identifier for the mic badge.
 *
 * Hashed rather than stored raw: the session token is a credential, and there
 * is no reason to keep a second copy of it in a column that other queries read.
 */
export function sessionKey(token: string | undefined | null): string | null {
  if (!token) return null;
  return createHash("sha256").update(token).digest("hex").slice(0, 32);
}

/**
 * Database sessions rather than JWT: a session can be revoked, and profile
 * changes (finishing onboarding, editing defaults) take effect immediately
 * instead of waiting for a token to roll over. The cost is that auth checks
 * must run in the Node runtime, so onboarding is gated in server components
 * via src/lib/session.ts rather than in edge middleware.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  providers: [
    Discord({
      // Discord's `username` is the @handle squadmates search for; `global_name`
      // is the display name. We show the display name and store the handle.
      profile(profile) {
        return {
          id: profile.id,
          name: profile.global_name ?? profile.username,
          email: profile.email,
          image: profile.avatar
            ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
            : null,
          discordName: profile.username,
        };
      },
    }),
  ],
  callbacks: {
    session({ session, user }) {
      const key = sessionKey((session as { sessionToken?: string }).sessionToken);

      session.user.id = user.id;
      session.user.onboarded = user.onboardedAt !== null;
      session.user.discordName = user.discordName ?? null;
      session.user.sessionKey = key;
      // The mic badge is scoped to this sign-in, so it only counts when the
      // stored key matches the session doing the asking.
      session.user.micVerified =
        key !== null && user.micVerifiedSession === key;
      return session;
    },
  },
  events: {
    // Discord handles are changeable. Refresh on every sign-in, otherwise a
    // squad page hands people a username that no longer resolves.
    async signIn({ user, profile }) {
      if (!user.id) return;
      const handle = typeof profile?.username === "string" ? profile.username : null;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          ...(handle ? { discordName: handle } : {}),
          // A new sign-in is a new session, so the mic badge has to be earned
          // again. Clearing here is what makes "once per session" literal, and
          // it means a non-null micVerifiedAt on any user can be read as
          // "verified during their current session" without knowing their token.
          micVerifiedAt: null,
          micVerifiedSession: null,
          micVerifiedMethod: null,
        },
      });
    },
  },
});
