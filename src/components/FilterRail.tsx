"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { MAPS, MODES, PLATFORMS, REGIONS, SKILLS } from "@/lib/game-data";

/**
 * Filters live in the URL, not in component state: a filtered board is then a
 * link you can paste into your Discord, and it survives a refresh.
 */
export function FilterRail() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const commit = useCallback(
    (next: URLSearchParams) => {
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router],
  );

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
      commit(next);
    },
    [params, commit],
  );

  const selectedMaps = (params.get("map") ?? "").split(",").filter(Boolean);

  const toggleMap = (id: string) => {
    const next = selectedMaps.includes(id)
      ? selectedMaps.filter((m) => m !== id)
      : [...selectedMaps, id];
    setParam("map", next.join(","));
  };

  const toggleFlag = (key: string) => setParam(key, params.get(key) === "1" ? null : "1");

  const activeCount = ["map", "mode", "skill", "region", "platform", "adult", "mic", "hidefull"]
    .filter((k) => params.get(k))
    .length;

  return (
    <div className="border-b border-line bg-panel/50">
      {/* Maps read as a route selector, so they get chips rather than a dropdown. */}
      <div className="flex flex-wrap items-center gap-1.5 px-4 py-3 sm:px-5">
        <span className="tag-sm mr-1 text-bone-faint">Map</span>
        <Chip active={selectedMaps.length === 0} onClick={() => setParam("map", null)}>
          All
        </Chip>
        {MAPS.map((m) => (
          <Chip key={m.id} active={selectedMaps.includes(m.id)} onClick={() => toggleMap(m.id)}>
            {m.name}
          </Chip>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-line/60 px-4 py-3 sm:px-5">
        <Select
          label="Mode"
          value={params.get("mode") ?? ""}
          onChange={(v) => setParam("mode", v)}
          options={MODES.map((m) => ({ value: m, label: m }))}
          anyLabel="Any mode"
        />
        <Select
          label="Skill"
          value={params.get("skill") ?? ""}
          onChange={(v) => setParam("skill", v)}
          options={SKILLS.map((s) => ({ value: s, label: s }))}
          anyLabel="Any skill"
        />
        <Select
          label="Region"
          value={params.get("region") ?? ""}
          onChange={(v) => setParam("region", v)}
          options={REGIONS.map((r) => ({ value: r.id, label: r.name }))}
          anyLabel="Any region"
        />
        <Select
          label="Platform"
          value={params.get("platform") ?? ""}
          onChange={(v) => setParam("platform", v)}
          options={PLATFORMS.map((p) => ({ value: p, label: p }))}
          anyLabel="Any platform"
        />

        <div className="mx-1 hidden h-5 w-px bg-line sm:block" aria-hidden="true" />

        <Toggle active={params.get("adult") === "1"} onClick={() => toggleFlag("adult")}>
          18+ only
        </Toggle>
        <Toggle active={params.get("mic") === "1"} onClick={() => toggleFlag("mic")}>
          Mic required
        </Toggle>
        <Toggle active={params.get("hidefull") === "1"} onClick={() => toggleFlag("hidefull")}>
          Hide full
        </Toggle>

        {activeCount > 0 && (
          <button
            type="button"
            onClick={() => commit(new URLSearchParams())}
            className="tag-sm ml-auto text-bone-faint underline underline-offset-4 transition-colors hover:text-bone"
          >
            Clear {activeCount} filter{activeCount === 1 ? "" : "s"}
          </button>
        )}
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`tag-sm border px-2.5 py-1.5 transition-colors ${
        active
          ? "border-bone bg-bone text-void"
          : "border-line-bright text-bone-dim hover:border-bone-dim hover:text-bone"
      }`}
    >
      {children}
    </button>
  );
}

function Toggle({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`tag-sm border px-2.5 py-1.5 transition-colors ${
        active
          ? "border-signal bg-signal/15 text-signal"
          : "border-line-bright text-bone-dim hover:border-bone-dim hover:text-bone"
      }`}
    >
      {children}
    </button>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  anyLabel,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  anyLabel: string;
}) {
  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`tag-sm cursor-pointer appearance-none border bg-void py-1.5 pl-2.5 pr-7 transition-colors ${
          value
            ? "border-bone-dim text-bone"
            : "border-line-bright text-bone-dim hover:border-bone-dim"
        }`}
      >
        <option value="">{anyLabel}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg
        aria-hidden="true"
        viewBox="0 0 10 6"
        className="pointer-events-none absolute right-2.5 h-[5px] w-[9px] fill-current text-bone-faint"
      >
        <path d="M0 0h10L5 6z" />
      </svg>
    </label>
  );
}
