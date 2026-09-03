import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      /** False until the user has set a birth date and profile defaults. */
      onboarded: boolean;
      discordName: string | null;
      /** Hash of this session's token; scopes the mic badge to one sign-in. */
      sessionKey: string | null;
      /** True only when the mic check was passed during THIS session. */
      micVerified: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    discordName?: string | null;
    onboardedAt?: Date | null;
    birthDate?: Date | null;
    micVerifiedSession?: string | null;
  }
}

declare module "next-auth/adapters" {
  interface AdapterUser {
    discordName?: string | null;
    onboardedAt?: Date | null;
    birthDate?: Date | null;
    micVerifiedSession?: string | null;
  }
}
