import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      /** False until the user has set a birth date and profile defaults. */
      onboarded: boolean;
      discordName: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    discordName?: string | null;
    onboardedAt?: Date | null;
    birthDate?: Date | null;
  }
}

declare module "next-auth/adapters" {
  interface AdapterUser {
    discordName?: string | null;
    onboardedAt?: Date | null;
    birthDate?: Date | null;
  }
}
