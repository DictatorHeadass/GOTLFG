# GOT LFG

A group finder for **Ghosts of Tabor**. Players post a squad — map, mode, skill, region,
squad size, age gate — and everyone else browses a live board and clicks Join. Once you're in
a squad you can see the other members' Discord handles, which is how you actually connect.

Sign-in is Discord OAuth. The board polls every 5 seconds, so slots fill in front of you.

Squad members also get a **lobby chat** for calling the plan, and can share an optional
**Quest username** for adding each other in-headset instead of on Discord. There's a
**mic check** — a live input meter using the browser's microphone — on the profile page and
on any squad that requires a mic.

## Stack

Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · Auth.js v5 · Prisma 7 · PostgreSQL

## Setup

### 1. Database

Either a hosted Postgres (Neon's free tier is fine) or a local one. Put the connection
string in `.env.local` as `DATABASE_URL`.

```bash
cp .env.example .env.local
```

### 2. Discord OAuth app

Create an application at <https://discord.com/developers/applications>, open **OAuth2**, and
add these redirect URLs:

```
http://localhost:3000/api/auth/callback/discord
https://<your-domain>/api/auth/callback/discord
```

Copy the client id and secret into `.env.local` as `AUTH_DISCORD_ID` and
`AUTH_DISCORD_SECRET`. Generate `AUTH_SECRET` with:

```bash
npx auth secret
```

### 3. Schema and run

```bash
npm install
npm run db:migrate      # creates the tables
npm run dev
```

## Verifying it works

`npm run verify` (with `npm run dev` running in another terminal) checks the rules that must
not break, by attacking the endpoints rather than looking at the UI:

- an 18+ squad is absent from a 15-year-old's board **and** the join endpoint returns 403
  when called directly with their session cookie
- a minor cannot host an age gate above their own age
- a non-member's payload contains no `discordName` or `questName` key at all — not blank,
  not hidden in CSS
- a non-member gets 403 from the lobby endpoint in both directions, read and write
- joining makes handles, Quest names and the lobby appear
- capacity, `FULL` status, one-open-squad-per-host, host handover on leave, and expiry

25 checks as of now.

It seeds its own users and Auth.js session rows, so it needs no Discord credentials, and it
deletes everything it created on the way out.

The parts it can't cover — the Discord sign-in round trip and the live 5-second board update
— need two real accounts:

1. Sign in, complete onboarding, post a squad.
2. In a private window, sign in as a second Discord account and join it.
3. The first window's slot count should move (1/4 → 2/4) within ~5s **without a refresh**,
   and both pages should now show each other's handles.

## When the game updates

Every map, mode, skill, region, age gate and squad size lives in
[`src/lib/game-data.ts`](src/lib/game-data.ts). Adding a map is one line there; nothing else
hardcodes a map name.

The five maps currently listed — Island of Tabor, Matka Miest, Matka Miest Underground, Silo,
Chodov Mall — are the ones confirmable from the wikis. **Check this list against the live
game and correct it.**

## How the age gate works

It is **self-reported**. Discord OAuth says nothing about how old anyone is, so an 18+ squad
is a preference filter, not a vetted space — the footer says so on every page. What the code
does guarantee:

- Birth **dates** are stored, never an age integer, so nobody silently ages into a gate they
  were never re-checked against ([`src/lib/age.ts`](src/lib/age.ts)).
- The gate is enforced in the join endpoint, not by hiding cards. A filtered-out card is one
  `curl` away.
- Under-13 sign-ups are refused and the OAuth-created account row is deleted (COPPA).
- A birth date never appears in any API response. Other players see the gate a squad
  requires, never a member's age.

## Layout

```
src/lib/game-data.ts     every game constant — edit this when Tabor updates
src/lib/age.ts           birth-date parsing, age derivation, gate check
src/lib/groups.ts        board query + the ONLY place a Discord handle reaches the wire
src/app/api/groups/      REST endpoints (create, join, leave, disband, messages)
src/components/Board.tsx live board, 5s poll
src/components/SquadChat.tsx  squad lobby, 3s poll, members only
src/components/MicCheck.tsx   getUserMedia level meter, nothing stored or sent
scripts/verify-gates.ts  the checks described above
```

### A note on the mic check

It is a mic *test*, not a mic *badge*. Nothing is recorded, uploaded, or saved, and no
"verified" flag goes on the profile. Passing it proves the browser can hear you on that
device at that moment — it cannot prove you'll have a working mic in the headset later, so
storing a badge would repeat exactly the problem the age disclaimer exists to avoid.

## Deploy

Push to GitHub, import to Vercel, set `DATABASE_URL`, `AUTH_DISCORD_ID`,
`AUTH_DISCORD_SECRET` and `AUTH_SECRET`, then run `npm run db:deploy` against the production
database. Add the production callback URL to the Discord app.

## Known issues

`npm audit` reports a high-severity advisory in `deepmerge-ts`, pulled in by `@prisma/config`.
It is a build-time CLI dependency with no runtime exposure, and `npm audit fix --force`
downgrades to Prisma 6, which breaks the v7 client. Left as-is deliberately.

---

Fan project. Not affiliated with Combat Waffle Studios or Beyond Frames Entertainment.
