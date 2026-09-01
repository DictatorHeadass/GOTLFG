"use client";

import { useEffect, useState } from "react";

export const COMFORT_KEY = "got-lfg-comfort";

/**
 * Toggles comfort mode (bigger type, 46px targets) for headset browsing.
 *
 * The initial value is decided by the inline script in the root layout, before
 * first paint, so the headset never flashes the desktop layout first. This
 * component only reads what that script already decided and lets it be changed
 * - user-agent sniffing is a guess, so the guess has to be overridable.
 */
export function ComfortToggle() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    setOn(document.documentElement.getAttribute("data-comfort") === "on");
  }, []);

  function toggle() {
    const next = !on;
    setOn(next);
    document.documentElement.setAttribute("data-comfort", next ? "on" : "off");
    try {
      localStorage.setItem(COMFORT_KEY, next ? "on" : "off");
    } catch {
      // Private mode or blocked storage: the toggle still works for this visit.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      title="Bigger text and targets, for browsing in a headset"
      className={`tag-sm inline-flex items-center gap-2 border px-2.5 py-2 transition-colors ${
        on
          ? "border-signal bg-signal/15 text-signal"
          : "border-line text-bone-faint hover:border-line-bright hover:text-bone-dim"
      }`}
    >
      <svg viewBox="0 0 24 14" aria-hidden="true" className="h-3.5 w-3.5 fill-current">
        <path d="M3 0h18a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-4.2a2 2 0 0 1-1.7-.9l-1.4-2.2a2 2 0 0 0-3.4 0l-1.4 2.2a2 2 0 0 1-1.7.9H3a3 3 0 0 1-3-3V3a3 3 0 0 1 3-3Z" />
      </svg>
      VR mode
    </button>
  );
}
