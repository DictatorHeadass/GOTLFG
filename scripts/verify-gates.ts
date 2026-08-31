/**
 * End-to-end check of the two rules that must not break: the age gate, and
 * Discord handles never reaching a non-member.
 *
 * It does not need Discord. Auth.js database sessions are just rows, so this
 * seeds users and session tokens directly and then talks to the running server
 * over HTTP with those cookies — the same path a browser takes, including every
 * server-side check. That is the point: filtering a card out of the board is
 * cosmetic, and the only way to prove the gate holds is to attack the endpoint.
 *
 *   1. npm run dev        (in another terminal)
 *   2. npm run verify
 */

import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { config } from "dotenv";

config({ path: ".env.local" });
config();

const BASE = process.env.VERIFY_BASE_URL ?? "http://localhost:3000";
const TAG = "verify-" + randomUUID().slice(0, 8);

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set. Fill in .env.local first.");
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

let passed = 0;
let failed = 0;

function check(name: string, ok: boolean, detail = "") {
  if (ok) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function yearsAgo(years: number): Date {
  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() - years);
  return d;
}

/** Seed a user plus a live Auth.js session, and return its cookie header. */
async function makeUser(label: string, age: number) {
  const user = await prisma.user.create({
    data: {
      name: `${TAG}-${label}`,
      discordName: `${TAG}_${label}`,
      questName: `${TAG}q_${label}`,
      birthDate: yearsAgo(age),
      onboardedAt: new Date(),
      region: "na-east",
      platform: "Quest",
      defaultSkill: "Intermediate",
      hasMic: true,
    },
  });

  const sessionToken = randomUUID();
  await prisma.session.create({
    data: {
      sessionToken,
      userId: user.id,
      expires: new Date(Date.now() + 24 * 3600 * 1000),
    },
  });

  return { user, cookie: `authjs.session-token=${sessionToken}` };
}

function api(path: string, cookie: string | null, init: RequestInit = {}) {
  return fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { cookie } : {}),
      ...(init.headers ?? {}),
    },
  });
}

async function main() {
  console.log(`\nVerifying ${BASE}\n`);

  // Fail fast with a useful message rather than a wall of fetch errors.
  try {
    const ping = await fetch(`${BASE}/api/groups`);
    if (!ping.ok) throw new Error(`status ${ping.status}`);
  } catch (error) {
    console.error(`Cannot reach ${BASE}. Start it with: npm run dev\n`, error);
    process.exit(1);
  }

  const adult = await makeUser("adult", 24);
  const minor = await makeUser("minor", 15);
  const outsider = await makeUser("outsider", 30);

  // --- Host an 18+ squad -----------------------------------------------
  const createResponse = await api("/api/groups", adult.cookie, {
    method: "POST",
    body: JSON.stringify({
      map: "matka",
      mode: "PvP",
      skill: "any",
      region: "na-east",
      platform: "Quest",
      minAge: 18,
      maxSize: 2,
      micRequired: false,
      note: `${TAG} adults only`,
    }),
  });
  const group = await createResponse.json();
  check("adult can host an 18+ squad", createResponse.status === 201, `got ${createResponse.status}`);
  if (!group?.id) {
    console.error("No group created; aborting.", group);
    await cleanup();
    process.exit(1);
  }

  // --- The age gate ------------------------------------------------------
  const minorBoard = await (await api("/api/groups", minor.cookie)).json();
  check(
    "18+ squad is hidden from a 15-year-old's board",
    !minorBoard.groups?.some((g: { id: string }) => g.id === group.id),
  );

  const minorJoin = await api(`/api/groups/${group.id}/join`, minor.cookie, { method: "POST" });
  check(
    "minor is refused 403 when calling join directly",
    minorJoin.status === 403,
    `got ${minorJoin.status}`,
  );

  const minorHost = await api("/api/groups", minor.cookie, {
    method: "POST",
    body: JSON.stringify({
      map: "silo",
      mode: "PvP",
      skill: "any",
      region: "na-east",
      platform: "Quest",
      minAge: 18,
      maxSize: 3,
      micRequired: false,
    }),
  });
  check("minor cannot host an 18+ squad", minorHost.status === 403, `got ${minorHost.status}`);

  // --- Discord handles ---------------------------------------------------
  const asOutsider = await (await api(`/api/groups/${group.id}`, outsider.cookie)).text();
  check(
    "non-member payload contains no discordName key",
    !asOutsider.includes("discordName"),
  );
  check(
    "non-member payload contains no handle value",
    !asOutsider.includes(`${TAG}_adult`),
  );

  check("non-member payload contains no questName key", !asOutsider.includes("questName"));
  check("non-member payload contains no Quest name value", !asOutsider.includes(`${TAG}q_adult`));

  const anonymous = await (await api(`/api/groups/${group.id}`, null)).text();
  check("signed-out payload contains no discordName key", !anonymous.includes("discordName"));
  check("signed-out payload contains no questName key", !anonymous.includes("questName"));

  // --- Lobby chat is squad-only, in both directions ----------------------
  const readAsOutsider = await api(`/api/groups/${group.id}/messages`, outsider.cookie);
  check(
    "non-member cannot read the lobby",
    readAsOutsider.status === 403,
    `got ${readAsOutsider.status}`,
  );

  const writeAsOutsider = await api(`/api/groups/${group.id}/messages`, outsider.cookie, {
    method: "POST",
    body: JSON.stringify({ body: "let me in" }),
  });
  check(
    "non-member cannot post to the lobby",
    writeAsOutsider.status === 403,
    `got ${writeAsOutsider.status}`,
  );

  const readAnonymous = await api(`/api/groups/${group.id}/messages`, null);
  check(
    "signed-out cannot read the lobby",
    readAnonymous.status === 401,
    `got ${readAnonymous.status}`,
  );

  // --- Join, then handles appear ----------------------------------------
  const outsiderJoin = await api(`/api/groups/${group.id}/join`, outsider.cookie, {
    method: "POST",
  });
  check("eligible adult can join", outsiderJoin.ok, `got ${outsiderJoin.status}`);

  const asMember = await (await api(`/api/groups/${group.id}`, outsider.cookie)).text();
  check("member now sees the host's handle", asMember.includes(`${TAG}_adult`));
  check("member now sees the host's Quest name", asMember.includes(`${TAG}q_adult`));

  const postMessage = await api(`/api/groups/${group.id}/messages`, outsider.cookie, {
    method: "POST",
    body: JSON.stringify({ body: `${TAG} north spawn first` }),
  });
  check("member can post to the lobby", postMessage.status === 201, `got ${postMessage.status}`);

  const lobby = await (await api(`/api/groups/${group.id}/messages`, adult.cookie)).json();
  check(
    "squadmate reads the message back",
    lobby.messages?.some((m: { body: string }) => m.body === `${TAG} north spawn first`),
  );

  const tooLong = await api(`/api/groups/${group.id}/messages`, outsider.cookie, {
    method: "POST",
    body: JSON.stringify({ body: "x".repeat(400) }),
  });
  check("over-long message is rejected", tooLong.status === 400, `got ${tooLong.status}`);

  // --- Capacity ----------------------------------------------------------
  const fourth = await makeUser("fourth", 22);
  const overfill = await api(`/api/groups/${group.id}/join`, fourth.cookie, { method: "POST" });
  check("join is refused once the squad is full", overfill.status === 409, `got ${overfill.status}`);

  const fullGroup = await (await api(`/api/groups/${group.id}`, adult.cookie)).json();
  check("status flips to FULL at capacity", fullGroup.status === "FULL", `got ${fullGroup.status}`);

  // --- One open squad per host ------------------------------------------
  const second = await api("/api/groups", adult.cookie, {
    method: "POST",
    body: JSON.stringify({
      map: "island",
      mode: "PvE",
      skill: "any",
      region: "na-east",
      platform: "Quest",
      minAge: 13,
      maxSize: 3,
      micRequired: false,
    }),
  });
  check("host cannot post a second squad", second.status === 409, `got ${second.status}`);

  // --- Host leaves, squad is handed over ---------------------------------
  const leave = await api(`/api/groups/${group.id}/leave`, adult.cookie, { method: "POST" });
  check("host can leave", leave.ok, `got ${leave.status}`);

  const afterLeave = await (await api(`/api/groups/${group.id}`, outsider.cookie)).json();
  check(
    "remaining member is promoted to host",
    afterLeave.hostId === outsider.user.id,
    `hostId=${afterLeave.hostId}`,
  );

  // --- Expiry -------------------------------------------------------------
  await prisma.group.update({
    where: { id: group.id },
    data: { expiresAt: new Date(Date.now() - 60_000) },
  });
  const afterExpiry = await (await api("/api/groups", outsider.cookie)).json();
  check(
    "expired squad drops off the board",
    !afterExpiry.groups?.some((g: { id: string }) => g.id === group.id),
  );

  await cleanup();

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed === 0 ? 0 : 1);
}

/** Remove everything this run created. Users cascade to groups and sessions. */
async function cleanup() {
  await prisma.user.deleteMany({ where: { name: { startsWith: TAG } } });
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await cleanup().catch(() => {});
  process.exit(1);
});
