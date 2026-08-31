import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Next reads .env.local; the Prisma CLI does not know about it. Load it here so
// there is exactly one env file to fill in, not two that drift apart.
config({ path: ".env.local" });
config();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Migrations run over the direct (unpooled) endpoint — DDL and the advisory
    // locks Prisma takes do not survive a connection pooler. The app itself uses
    // the pooled DATABASE_URL via the driver adapter in src/lib/prisma.ts.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});
