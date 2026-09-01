"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import { signIn } from "next-auth/react";
import { mapName, platformName, regionName, skillName } from "@/lib/game-data";
import type { GroupDTO } from "@/lib/types";
import { MicCheck } from "./MicCheck";
import { SlotPips } from "./SlotPips";
import { SquadChat } from "./SquadChat";
import { TimeLeft } from "./TimeLeft";

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(String(response.status));
  return response.json();
};

const MODE_TEXT: Record<string, string> = {
  PvP: "border-amber/50 text-amber",
  PvE: "border-teal/50 text-teal",
};

export function SquadPanel({
  initial,
  signedIn,
  viewerId,
}: {
  initial: GroupDTO;
  signedIn: boolean;
  viewerId: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data, mutate, error: loadError } = useSWR<GroupDTO>(
    `/api/groups/${initial.id}`,
    fetcher,
    { refreshInterval: 5_000, fallbackData: initial },
  );

  if (loadError) {
    return (
      <div className="border border-line px-5 py-14 text-center">
        <p className="display text-[16px] text-bone-dim">This squad is gone</p>
        <p className="mt-2 text-[13px] text-bone-faint">
          It filled up, was disbanded, or dropped off the board.
        </p>
        <Link
          href="/"
          className="tag mt-6 inline-block border border-line-bright px-4 py-2.5 text-bone-dim transition-colors hover:border-bone hover:text-bone"
        >
          Back to the board
        </Link>
      </div>
    );
  }

  const group = data ?? initial;
  const emptySlots = Math.max(0, group.maxSize - group.members.length);

  async function act(path: string, method: "POST" | "DELETE") {
    setBusy(true);
    setError(null);

    const response = await fetch(path, { method });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "That didn't work");
      setBusy(false);
      await mutate();
      return;
    }

    if (method === "DELETE") {
      router.push("/");
      return;
    }

    setBusy(false);
    await mutate();
  }

  return (
    <div className="space-y-6">
    <div className="border border-line bg-panel/30">
      {/* Identity */}
      <div className="border-b border-line px-5 py-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h1 className="display text-[24px] leading-none text-bone">{mapName(group.map)}</h1>
          <span
            className={`tag-sm border px-1.5 py-[3px] leading-none ${
              MODE_TEXT[group.mode] ?? "border-line-bright text-bone-dim"
            }`}
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
              Mic required
            </span>
          )}
        </div>

        <div className="tag-sm mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-bone-faint">
          <span>{skillName(group.skill)}</span>
          <span aria-hidden="true" className="text-line-bright">/</span>
          <span>{regionName(group.region)}</span>
          <span aria-hidden="true" className="text-line-bright">/</span>
          <span>{platformName(group.platform)}</span>
          <span aria-hidden="true" className="text-line-bright">/</span>
          <TimeLeft expiresAt={group.expiresAt} />
        </div>

        {group.note && (
          <p className="mt-4 max-w-[60ch] border-l-2 border-line-bright pl-3 text-[14px] leading-relaxed text-bone-dim">
            {group.note}
          </p>
        )}
      </div>

      {/* Roster */}
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <span className="tag text-bone-faint">Squad</span>
        <SlotPips filled={group.filled} max={group.maxSize} />
      </div>

      <ul>
        {group.members.map((member) => (
          <li
            key={member.id}
            className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line px-5 py-3.5"
          >
            {member.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={member.image} alt="" width={26} height={26} className="rounded-full" />
            ) : (
              <span className="h-[26px] w-[26px] rounded-full bg-line" aria-hidden="true" />
            )}

            <span className="text-[14px] text-bone">{member.name ?? "Operator"}</span>

            {member.role === "HOST" && <span className="tag-sm text-bone-faint">Host</span>}
            {member.id === viewerId && <span className="tag-sm text-bone-faint">You</span>}

            <span className="ml-auto flex flex-wrap items-center gap-2 sm:gap-3">
              {"discordName" in member && member.discordName ? (
                <code
                  className="tag border border-line-bright px-2 py-1 text-bone"
                  title="Discord username"
                >
                  @{member.discordName}
                </code>
              ) : null}

              {"questName" in member && member.questName ? (
                <code
                  className="tag border border-line-bright px-2 py-1 text-bone-dim"
                  title="Meta / Quest username"
                >
                  <span className="text-bone-faint">Quest</span> {member.questName}
                </code>
              ) : null}

              {signedIn && member.id !== viewerId && (
                <ReportControl groupId={group.id} targetUserId={member.id} />
              )}
            </span>
          </li>
        ))}

        {/* Empty slots are shown, not implied - the roster is the product. */}
        {Array.from({ length: emptySlots }, (_, i) => (
          <li
            key={`empty-${i}`}
            className="flex items-center gap-3 border-b border-dashed border-line px-5 py-3.5"
          >
            <span className="h-[26px] w-[26px] rounded-full border border-dashed border-line-bright" />
            <span className="tag-sm text-bone-faint">Open slot</span>
          </li>
        ))}
      </ul>

      {!group.isMember && (
        <p className="border-b border-line bg-panel px-5 py-3 text-[13px] text-bone-dim">
          Join the squad to see everyone&apos;s Discord and Quest names, and to use the lobby.
        </p>
      )}

      {error && (
        <p role="alert" className="border-b border-line bg-signal/10 px-5 py-3 text-[13px] text-bone">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-4">
        {!signedIn ? (
          <button
            type="button"
            onClick={() => signIn("discord", { callbackUrl: `/groups/${group.id}` })}
            className="tag border border-signal bg-signal px-4 py-2.5 text-void transition-opacity hover:opacity-90"
          >
            Sign in to join
          </button>
        ) : group.isHost ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => act(`/api/groups/${group.id}`, "DELETE")}
            className="tag border border-line-bright px-4 py-2.5 text-bone-dim transition-colors hover:border-signal hover:text-signal disabled:opacity-40"
          >
            {busy ? "Working" : "Disband squad"}
          </button>
        ) : group.isMember ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => act(`/api/groups/${group.id}/leave`, "POST")}
            className="tag border border-line-bright px-4 py-2.5 text-bone-dim transition-colors hover:border-signal hover:text-signal disabled:opacity-40"
          >
            {busy ? "Working" : "Leave squad"}
          </button>
        ) : group.filled >= group.maxSize ? (
          <span className="tag border border-line px-4 py-2.5 text-bone-faint">Squad is full</span>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => act(`/api/groups/${group.id}/join`, "POST")}
            className="tag border border-signal bg-signal px-4 py-2.5 text-void transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {busy ? "Joining" : "Join squad"}
          </button>
        )}

        <Link
          href="/"
          className="tag border border-line-bright px-4 py-2.5 text-bone-dim transition-colors hover:border-bone hover:text-bone"
        >
          Back to the board
        </Link>
      </div>
    </div>

      {/* Members only - the endpoint enforces this too, this just hides the box. */}
      {group.isMember && <SquadChat groupId={group.id} viewerId={viewerId} />}

      {/* Surfaced where it matters: this squad said a mic is required. */}
      {group.micRequired && <MicCheck />}
    </div>
  );
}

function ReportControl({ groupId, targetUserId }: { groupId: string; targetUserId: string }) {
  const [sent, setSent] = useState(false);
  const [reason, setReason] = useState("");

  if (sent) return <span className="tag-sm text-bone-faint">Reported</span>;

  return (
    <details className="relative">
      <summary className="tag-sm cursor-pointer list-none text-bone-faint transition-colors hover:text-signal">
        Report
      </summary>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          await fetch("/api/reports", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ targetUserId, groupId, reason }),
          });
          setSent(true);
        }}
        className="absolute right-0 z-20 mt-2 w-[260px] border border-line-bright bg-panel p-3"
      >
        <label className="tag-sm block text-bone-faint">What happened?</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
          minLength={3}
          maxLength={500}
          rows={3}
          className="mt-1.5 w-full resize-none border border-line-bright bg-void p-2 text-[13px] text-bone focus:border-bone-dim"
        />
        <button
          type="submit"
          className="tag-sm mt-2 border border-line-bright px-2.5 py-1.5 text-bone-dim transition-colors hover:border-signal hover:text-signal"
        >
          Send report
        </button>
      </form>
    </details>
  );
}
