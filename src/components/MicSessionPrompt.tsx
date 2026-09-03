"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const DISMISS_KEY = "got-lfg-mic-prompt-dismissed";

/**
 * Nudges a signed-in player to run the mic check once per session.
 *
 * Shown only when the server says this session has not passed one. Dismissal
 * lives in sessionStorage, so it stays gone while they browse but returns on
 * the next sign-in - which is exactly when the badge has been cleared anyway.
 */
export function MicSessionPrompt() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(sessionStorage.getItem(DISMISS_KEY) !== "1");
    } catch {
      // Storage blocked: show it, but it will not remember the dismissal.
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  function dismiss() {
    setVisible(false);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Nothing to do; it simply reappears on the next page load.
    }
  }

  return (
    <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-3 border border-line bg-panel/60 px-4 py-3 sm:px-5">
      <p className="min-w-0 flex-1 text-[13px] leading-relaxed text-bone-dim">
        <span className="text-bone">Mic not checked this session.</span> Say three short
        phrases and your squad sees a verified mark next to your name.
      </p>

      <div className="flex items-center gap-2">
        <Link
          href="/profile#mic"
          className="tag border border-signal/70 bg-signal/10 px-3.5 py-2 text-signal transition-colors hover:bg-signal hover:text-void"
        >
          Run mic check
        </Link>
        <button
          type="button"
          onClick={dismiss}
          className="tag border border-line-bright px-3.5 py-2 text-bone-faint transition-colors hover:border-bone-dim hover:text-bone-dim"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
