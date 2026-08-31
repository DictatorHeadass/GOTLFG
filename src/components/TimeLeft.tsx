"use client";

import { useEffect, useState } from "react";
import { timeLeft } from "@/lib/format";

/**
 * Renders nothing until mounted: the server and the client would otherwise
 * disagree about the clock and React would flag a hydration mismatch.
 */
export function TimeLeft({ expiresAt }: { expiresAt: string }) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    const update = () => setLabel(timeLeft(expiresAt));
    update();
    const timer = setInterval(update, 30_000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  return (
    <span className="tag tabular-nums text-bone-faint" title="Time left on the board">
      {label ?? "\u00a0"}
    </span>
  );
}
