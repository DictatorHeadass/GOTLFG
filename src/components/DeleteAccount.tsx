"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

const CONFIRM_WORD = "DELETE";

/**
 * Right-to-erasure control.
 *
 * Typed confirmation rather than a second button, because this is genuinely
 * unrecoverable and a laser pointer in a headset makes mis-clicks easy.
 */
export function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setBusy(true);
    setError(null);

    const response = await fetch("/api/account", { method: "DELETE" });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Couldn't delete the account");
      setBusy(false);
      return;
    }

    // The session row is gone with the user; clear the cookie and land home.
    await signOut({ callbackUrl: "/" });
  }

  return (
    <section className="border border-signal/40 bg-panel/40">
      <div className="border-b border-signal/30 px-5 py-4">
        <h2 className="display text-[16px] text-bone">Delete account</h2>
        <p className="mt-1 max-w-[64ch] text-[13px] leading-relaxed text-bone-dim">
          Removes your profile, date of birth, Discord and Quest names, every squad you
          host, your memberships and your lobby messages. Immediate and permanent - there
          is no undo and no backup copy to restore from.
        </p>
      </div>

      <div className="px-5 py-5">
        {!open ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="tag border border-line-bright px-4 py-2.5 text-bone-dim transition-colors hover:border-signal hover:text-signal"
          >
            Delete my account
          </button>
        ) : (
          <div className="space-y-4">
            <label className="block">
              <span className="text-[13px] text-bone">
                Type <code className="tag text-signal">{CONFIRM_WORD}</code> to confirm
              </span>
              <input
                type="text"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                className="mt-1.5 block h-[38px] w-full max-w-[220px] border border-line-bright bg-void px-2.5 text-[14px] text-bone focus:border-signal"
              />
            </label>

            {error && (
              <p role="alert" className="text-[13px] text-bone">
                {error}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={confirm !== CONFIRM_WORD || busy}
                onClick={remove}
                className="tag border border-signal bg-signal px-4 py-2.5 text-void transition-opacity hover:opacity-90 disabled:opacity-30"
              >
                {busy ? "Deleting" : "Permanently delete"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setConfirm("");
                  setError(null);
                }}
                className="tag border border-line-bright px-4 py-2.5 text-bone-dim transition-colors hover:border-bone hover:text-bone"
              >
                Keep my account
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
