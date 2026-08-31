"use client";

import { useState } from "react";
import {
  ANY,
  MAPS,
  MODES,
  NOTE_MAX_LENGTH,
  PARTY_SIZES,
  PLATFORMS,
  REGIONS,
  SKILLS,
} from "@/lib/game-data";

export type PostDefaults = {
  region: string;
  platform: string;
  skill: string;
  hasMic: boolean;
  /** Age gates this host is old enough to set, computed on the server. */
  allowedGates: number[];
};

export function PostSquadForm({
  defaults,
  onCreated,
  onCancel,
}: {
  defaults: PostDefaults;
  onCreated: (groupId: string) => void;
  onCancel: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [note, setNote] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const payload = {
      map: form.get("map"),
      mode: form.get("mode"),
      skill: form.get("skill"),
      region: form.get("region"),
      platform: form.get("platform"),
      minAge: Number(form.get("minAge")),
      maxSize: Number(form.get("maxSize")),
      micRequired: form.get("micRequired") === "on",
      note: (form.get("note") as string)?.trim() || undefined,
    };

    const response = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Couldn't post that squad");
      setSubmitting(false);
      return;
    }

    const group = await response.json();
    onCreated(group.id);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-b border-line bg-panel px-4 py-5 sm:px-5"
      aria-label="Post a squad"
    >
      <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3 lg:grid-cols-4">
        <Field label="Map">
          <Select name="map" defaultValue={ANY}>
            <option value={ANY}>Any map</option>
            {MAPS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Mode">
          <Select name="mode" defaultValue={MODES[0]}>
            {MODES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Squad size">
          <Select name="maxSize" defaultValue="4">
            {PARTY_SIZES.map((n) => (
              <option key={n} value={n}>
                {n} players
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Minimum age">
          <Select name="minAge" defaultValue={String(defaults.allowedGates[0] ?? 13)}>
            {defaults.allowedGates.map((age) => (
              <option key={age} value={age}>
                {age}+
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Skill wanted">
          <Select name="skill" defaultValue={defaults.skill}>
            <option value={ANY}>Any skill</option>
            {SKILLS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Region">
          <Select name="region" defaultValue={defaults.region}>
            {REGIONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Platform">
          <Select name="platform" defaultValue={defaults.platform}>
            <option value={ANY}>Quest or PCVR</option>
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Voice">
          <label className="flex h-[34px] cursor-pointer items-center gap-2 border border-line-bright px-2.5 text-[13px] text-bone-dim transition-colors hover:border-bone-dim">
            <input
              type="checkbox"
              name="micRequired"
              defaultChecked={defaults.hasMic}
              className="accent-signal"
            />
            Mic required
          </label>
        </Field>
      </div>

      <div className="mt-4">
        <Field label={`Note — optional (${NOTE_MAX_LENGTH - note.length} left)`}>
          <input
            type="text"
            name="note"
            value={note}
            maxLength={NOTE_MAX_LENGTH}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What's the run? e.g. quest running, chill loot, no rats"
            className="h-[34px] w-full border border-line-bright bg-void px-2.5 text-[13px] text-bone placeholder:text-bone-faint focus:border-bone-dim"
          />
        </Field>
      </div>

      {error && (
        <p role="alert" className="mt-4 border-l-2 border-signal bg-signal/10 px-3 py-2 text-[13px] text-bone">
          {error}
        </p>
      )}

      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="tag border border-signal bg-signal px-4 py-2.5 text-void transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {submitting ? "Posting" : "Post squad"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="tag border border-line-bright px-4 py-2.5 text-bone-dim transition-colors hover:border-bone hover:text-bone"
        >
          Cancel
        </button>
        <span className="tag-sm ml-auto hidden text-bone-faint sm:block">Drops off the board in 60 min</span>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="tag-sm text-bone-faint">{label}</span>
      {children}
    </label>
  );
}

function Select({
  name,
  defaultValue,
  children,
}: {
  name: string;
  defaultValue: string;
  children: React.ReactNode;
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      className="h-[34px] cursor-pointer appearance-none border border-line-bright bg-void px-2.5 text-[13px] text-bone transition-colors hover:border-bone-dim focus:border-bone-dim"
    >
      {children}
    </select>
  );
}
