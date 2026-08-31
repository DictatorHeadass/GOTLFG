"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { mapName, platformName, regionName, skillName } from "@/lib/game-data";
import type { GroupDTO } from "@/lib/types";
import { SlotPips } from "./SlotPips";
import { TimeLeft } from "./TimeLeft";

const MODE_ACCENT: Record<string, string> = {
  PvP: "bg-amber",
  PvE: "bg-teal",
};

const MODE_TEXT: Record<string, string> = {
  PvP: "border-amber/50 text-amber",
  PvE: "border-teal/50 text-teal",
};

function Sep() {
  return <span aria-hidden="true" className="text-line-bright">/</span>;
}

export function GroupRow({
  group,
  signedIn,
  busy,
  onJoin,
}: {
  group: GroupDTO;
  signedIn: boolean;
  busy: boolean;
  onJoin: (id: string) => void;
}) {
  const isFull = group.filled >= group.maxSize;

  return (
    <article className="relative grid grid-cols-[3px_1fr] border-b border-line transition-colors hover:bg-panel">
      <div className={MODE_ACCENT[group.mode] ?? "bg-line-bright"} aria-hidden="true" />

      {/* Covers the row so the whole thing is clickable; the action sits above it. */}
      <Link
        href={`/groups/${group.id}`}
        className="absolute inset-0 z-0"
        aria-label={`${mapName(group.map)}, ${group.mode}, ${group.filled} of ${group.maxSize} slots filled`}
      />

      <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-6 sm:px-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
            <h3 className="display text-[17px] leading-none text-bone">{mapName(group.map)}</h3>

            <span
              className={`tag-sm border px-1.5 py-[3px] leading-none ${MODE_TEXT[group.mode] ?? "border-line-bright text-bone-dim"}`}
            >
              {group.mode}
            </span>

            {group.minAge > 13 && (
              <span className="tag-sm border border-signal/60 px-1.5 py-[3px] leading-none text-signal">
                {group.minAge}+
              </span>
            )}

            {group.micRequired && (
              <span className="tag-sm border border-line-bright px-1.5 py-[3px] leading-none text-bone-faint">
                Mic
              </span>
            )}

            {group.isHost && (
              <span className="tag-sm px-1 leading-none text-bone-faint">Your squad</span>
            )}
          </div>

          <div className="tag-sm mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-bone-faint">
            <span>{skillName(group.skill)}</span>
            <Sep />
            <span>{regionName(group.region)}</span>
            <Sep />
            <span>{platformName(group.platform)}</span>
          </div>

          {group.note && (
            <p className="mt-2 max-w-[52ch] text-[13px] leading-snug text-bone-dim">{group.note}</p>
          )}
        </div>

        <div className="relative z-10 flex items-center gap-4 sm:gap-6">
          <SlotPips filled={group.filled} max={group.maxSize} />
          <div className="w-11 text-right">
            <TimeLeft expiresAt={group.expiresAt} />
          </div>

          {group.isMember ? (
            <Link
              href={`/groups/${group.id}`}
              className="tag border border-line-bright px-3.5 py-2 text-bone-dim transition-colors hover:border-bone hover:text-bone"
            >
              Open
            </Link>
          ) : !signedIn ? (
            <button
              type="button"
              onClick={() => signIn("discord", { callbackUrl: `/groups/${group.id}` })}
              className="tag border border-line-bright px-3.5 py-2 text-bone-dim transition-colors hover:border-signal hover:text-signal"
            >
              Sign in
            </button>
          ) : isFull ? (
            <span className="tag border border-line px-3.5 py-2 text-bone-faint">Full</span>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => onJoin(group.id)}
              className="tag border border-signal/70 bg-signal/10 px-3.5 py-2 text-signal transition-colors hover:bg-signal hover:text-void disabled:opacity-40"
            >
              {busy ? "Joining" : "Join"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
