"use client";

import { useActionState } from "react";
import { saveProfile, type ProfileState } from "@/app/profile/actions";
import { PLATFORMS, REGIONS, SKILLS } from "@/lib/game-data";

const initialState: ProfileState = { error: null, saved: false };

const selectClass =
  "mt-1.5 block h-[38px] w-full border border-line-bright bg-void px-2.5 text-[14px] text-bone focus:border-bone-dim";

export function ProfileForm({
  region,
  platform,
  defaultSkill,
  hasMic,
}: {
  region: string;
  platform: string;
  defaultSkill: string;
  hasMic: boolean;
}) {
  const [state, formAction, pending] = useActionState(saveProfile, initialState);

  return (
    <form action={formAction} className="border border-line bg-panel/40">
      <div className="border-b border-line px-5 py-4">
        <h2 className="display text-[16px] text-bone">Squad defaults</h2>
        <p className="mt-1 text-[13px] text-bone-dim">These prefill every squad you post.</p>
      </div>

      <div className="space-y-5 px-5 py-5">
        <div className="grid gap-5 sm:grid-cols-3">
          <label className="block">
            <span className="tag-sm text-bone-faint">Region</span>
            <select name="region" defaultValue={region} className={selectClass}>
              {REGIONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="tag-sm text-bone-faint">Platform</span>
            <select name="platform" defaultValue={platform} className={selectClass}>
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="tag-sm text-bone-faint">Your skill</span>
            <select name="defaultSkill" defaultValue={defaultSkill} className={selectClass}>
              {SKILLS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="flex w-fit cursor-pointer items-center gap-2.5 border border-line-bright px-3 py-2 text-[13px] text-bone-dim transition-colors hover:border-bone-dim">
          <input type="checkbox" name="hasMic" defaultChecked={hasMic} className="accent-signal" />
          I run a mic
        </label>

        {state.error && (
          <p
            role="alert"
            className="border-l-2 border-signal bg-signal/10 px-3 py-2 text-[13px] text-bone"
          >
            {state.error}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3 border-t border-line px-5 py-4">
        <button
          type="submit"
          disabled={pending}
          className="tag border border-signal bg-signal px-4 py-2.5 text-void transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {pending ? "Saving" : "Save defaults"}
        </button>
        {state.saved && !state.error && (
          <span className="tag-sm text-teal" role="status">
            Saved
          </span>
        )}
      </div>
    </form>
  );
}
