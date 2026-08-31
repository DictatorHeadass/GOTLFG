import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

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
      session.user.id = user.id;
      session.user.onboarded = user.onboardedAt !== null;
      session.user.discordName = user.discordName ?? null;
      return session;
    },
  },
  events: {
    // Discord handles are changeable. Refresh on every sign-in, otherwise a
    // squad page hands people a username that no longer resolves.
    async signIn({ user, profile }) {
      const handle = typeof profile?.username === "string" ? profile.username : null;
      if (handle && user.id) {
        await prisma.user.update({
          where: { id: user.id },
          data: { discordName: handle },
        });
      }
    },
  },
});
