"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import { signIn } from "next-auth/react";
import type { BoardResponse } from "@/lib/types";
import { FilterRail } from "./FilterRail";
import { GroupRow } from "./GroupRow";
import { PostSquadForm, type PostDefaults } from "./PostSquadForm";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function Board({
  initial,
  signedIn,
  onboarded,
  postDefaults,
}: {
  initial: BoardResponse;
  signedIn: boolean;
  onboarded: boolean;
  postDefaults: PostDefaults | null;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const query = params.toString();

  const [posting, setPosting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Five seconds is fast enough that a slot filling feels immediate and slow
  // enough that a quiet board costs almost nothing.
  const { data, mutate } = useSWR<BoardResponse>(`/api/groups?${query}`, fetcher, {
    refreshInterval: 5_000,
    fallbackData: initial,
    keepPreviousData: true,
  });

  const groups = data?.groups ?? [];
  const stats = data?.stats ?? initial.stats;
  const filtered = query.length > 0;

  async function handleJoin(id: string) {
    setBusyId(id);
    setError(null);

    const response = await fetch(`/api/groups/${id}/join`, { method: "POST" });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Couldn't join that squad");
      setBusyId(null);
      await mutate();
      return;
    }

    // Straight to the squad page — the Discord handles are the whole point.
    router.push(`/groups/${id}`);
  }

  return (
    <section className="border border-line bg-void">
      {/* The manifest header. This is the hero: what is live, right now. */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-line px-4 py-3.5 sm:px-5">
        <div className="flex items-center gap-2.5">
          <span className="live-dot h-1.5 w-1.5 rounded-full bg-signal" aria-hidden="true" />
          <span className="tag text-bone">
            {stats.squads} {stats.squads === 1 ? "squad" : "squads"} forming
          </span>
        </div>
        <span className="tag text-bone-faint" aria-hidden="true">
          /
        </span>
        <span className="tag text-bone-dim">{stats.operators} on the board</span>

        <div className="ml-auto">
          {!signedIn ? (
            <button
              type="button"
              onClick={() => signIn("discord", { callbackUrl: "/" })}
              className="tag border border-signal/70 bg-signal/10 px-3.5 py-2 text-signal transition-colors hover:bg-signal hover:text-void"
            >
              Sign in to post
            </button>
          ) : !onboarded ? (
            <Link
              href="/onboarding"
              className="tag border border-signal/70 bg-signal/10 px-3.5 py-2 text-signal transition-colors hover:bg-signal hover:text-void"
            >
              Finish your profile
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setPosting((open) => !open)}
              aria-expanded={posting}
              className="tag border border-signal/70 bg-signal/10 px-3.5 py-2 text-signal transition-colors hover:bg-signal hover:text-void"
            >
              {posting ? "Close" : "Post a squad"}
            </button>
          )}
        </div>
      </div>

      {posting && postDefaults && (
        <PostSquadForm
          defaults={postDefaults}
          onCreated={(id) => router.push(`/groups/${id}`)}
          onCancel={() => setPosting(false)}
        />
      )}

      <FilterRail />

      {error && (
        <p role="alert" className="border-b border-line bg-signal/10 px-4 py-2.5 text-[13px] text-bone sm:px-5">
          {error}
        </p>
      )}

      {groups.length === 0 ? (
        <div className="px-4 py-16 text-center sm:px-5">
          <p className="display text-[15px] text-bone-dim">
            {filtered ? "Nothing matches those filters" : "The board is empty"}
          </p>
          <p className="mt-2 text-[13px] text-bone-faint">
            {filtered
              ? "Widen the filters, or post a squad and let people come to you."
              : "Post the first squad and it shows up here for everyone."}
          </p>
        </div>
      ) : (
        <div>
          {groups.map((group) => (
            <GroupRow
              key={group.id}
              group={group}
              signedIn={signedIn}
              busy={busyId === group.id}
              onJoin={handleJoin}
            />
          ))}
        </div>
      )}
    </section>
  );
}
