"use client";

import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { MESSAGE_MAX_LENGTH } from "@/lib/game-data";
import type { MessageDTO } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function clock(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * Squad lobby. Rendered only for members; the endpoint enforces that too.
 *
 * Polled rather than socketed — the same reason as the board. A raid gets
 * planned in a handful of messages over a few minutes, and 3 seconds of latency
 * is invisible at that pace.
 */
export function SquadChat({ groupId, viewerId }: { groupId: string; viewerId: string | null }) {
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logRef = useRef<HTMLDivElement>(null);
  const pinnedToBottom = useRef(true);

  const { data, mutate } = useSWR<{ messages: MessageDTO[] }>(
    `/api/groups/${groupId}/messages`,
    fetcher,
    { refreshInterval: 3_000 },
  );

  const messages = data?.messages ?? [];

  // Follow the log only when the reader is already at the bottom, so scrolling
  // back to re-read something doesn't yank them forward on the next poll.
  useEffect(() => {
    const log = logRef.current;
    if (log && pinnedToBottom.current) log.scrollTop = log.scrollHeight;
  }, [messages.length]);

  function trackScroll() {
    const log = logRef.current;
    if (!log) return;
    pinnedToBottom.current = log.scrollHeight - log.scrollTop - log.clientHeight < 40;
  }

  async function send(event: React.FormEvent) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;

    setSending(true);
    setError(null);

    const response = await fetch(`/api/groups/${groupId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.error ?? "Couldn't send that");
      setSending(false);
      return;
    }

    const created: MessageDTO = await response.json();
    setDraft("");
    pinnedToBottom.current = true;
    await mutate(
      (current) => ({ messages: [...(current?.messages ?? []), created] }),
      { revalidate: false },
    );
    setSending(false);
  }

  const remaining = MESSAGE_MAX_LENGTH - draft.length;

  return (
    <section className="border border-line bg-panel/30">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <h2 className="tag text-bone-faint">Lobby</h2>
        <span className="tag-sm text-bone-faint">Squad only</span>
      </div>

      <div
        ref={logRef}
        onScroll={trackScroll}
        className="max-h-[280px] min-h-[120px] overflow-y-auto px-5 py-3"
      >
        {messages.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-bone-faint">
            No messages yet. Call the plan.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {messages.map((message) => (
              <li key={message.id} className="flex gap-3 text-[13px] leading-snug">
                <time
                  className="tag-sm shrink-0 pt-[3px] text-bone-faint"
                  dateTime={message.createdAt}
                >
                  {clock(message.createdAt)}
                </time>
                <span
                  className={`w-[86px] shrink-0 truncate font-medium ${
                    message.authorId === viewerId ? "text-signal" : "text-bone-dim"
                  }`}
                  title={message.authorName ?? "Operator"}
                >
                  {message.authorName ?? "Operator"}
                </span>
                <span className="min-w-0 break-words text-bone">{message.body}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && (
        <p role="alert" className="border-t border-line bg-signal/10 px-5 py-2 text-[13px] text-bone">
          {error}
        </p>
      )}

      <form onSubmit={send} className="flex items-center gap-2 border-t border-line px-5 py-3">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={MESSAGE_MAX_LENGTH}
          placeholder="Call the plan…"
          aria-label="Message the squad"
          className="h-[34px] min-w-0 flex-1 border border-line-bright bg-void px-2.5 text-[13px] text-bone placeholder:text-bone-faint focus:border-bone-dim"
        />
        {remaining < 60 && (
          <span className="tag-sm tabular-nums text-bone-faint">{remaining}</span>
        )}
        <button
          type="submit"
          disabled={sending || draft.trim().length === 0}
          className="tag shrink-0 border border-line-bright px-3.5 py-2 text-bone-dim transition-colors hover:border-signal hover:text-signal disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </section>
  );
}
