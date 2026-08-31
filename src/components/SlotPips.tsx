"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Squad occupancy as physical slots.
 *
 * This is the one thing on the board that moves. A slot filling is the moment
 * the site exists for, so it gets the animation budget and nothing else does.
 */
export function SlotPips({ filled, max }: { filled: number; max: number }) {
  const previous = useRef(filled);
  const [justFilled, setJustFilled] = useState<number | null>(null);

  useEffect(() => {
    if (filled > previous.current) {
      setJustFilled(filled - 1);
      const timer = setTimeout(() => setJustFilled(null), 400);
      previous.current = filled;
      return () => clearTimeout(timer);
    }
    previous.current = filled;
  }, [filled]);

  return (
    <div className="flex items-center gap-2.5">
      <div
        className="flex items-end gap-[3px]"
        role="img"
        aria-label={`${filled} of ${max} slots filled`}
      >
        {Array.from({ length: max }, (_, i) => {
          const isFilled = i < filled;
          return (
            <span
              key={i}
              className={[
                "h-4 w-[7px] transition-colors duration-200",
                isFilled
                  ? "bg-bone shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]"
                  : "border border-line-bright bg-transparent",
                justFilled === i ? "slot-just-filled !bg-signal" : "",
              ].join(" ")}
            />
          );
        })}
      </div>
      <span className="tag tabular-nums text-bone-dim">
        {filled}/{max}
      </span>
    </div>
  );
}
