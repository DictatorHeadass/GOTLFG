"use client";

import { useActionState } from "react";
import { saveOnboarding, type OnboardingState } from "@/app/onboarding/actions";
import { MIN_SIGNUP_AGE } from "@/lib/age";
import { PLATFORMS, QUEST_NAME_MAX_LENGTH, REGIONS, SKILLS } from "@/lib/game-data";

const initialState: OnboardingState = { error: null };

const selectClass =
  "mt-1.5 block h-[38px] w-full border border-line-bright bg-void px-2.5 text-[14px] text-bone focus:border-bone-dim";

export function OnboardingForm() {
  const [state, formAction, pending] = useActionState(saveOnboarding, initialState);

  return (
    <form action={formAction} className="border border-line bg-panel/40">
      <div className="border-b border-line px-5 py-4">
        <h1 className="display text-[19px] text-bone">Set up your profile</h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-bone-dim">
          Four answers, once. They prefill every squad you post and decide which squads you
          can see.
        </p>
      </div>

      <div className="space-y-5 px-5 py-5">
        <label className="block">
          <span className="tag-sm text-bone-faint">Date of birth</span>
          <input
            type="date"
            name="birthDate"
            required
            className="mt-1.5 block h-[38px] w-full max-w-[220px] border border-line-bright bg-void px-2.5 text-[14px] text-bone focus:border-bone-dim"
          />
          <span className="mt-2 block max-w-[58ch] text-[12.5px] leading-relaxed text-bone-faint">
            This sets which age-gated squads you can join. It is never shown to anyone else
            — other players only ever see the gate a squad requires, never your age. You
            must be at least {MIN_SIGNUP_AGE}.
          </span>
        </label>

        <div className="grid gap-5 sm:grid-cols-3">
          <label className="block">
            <span className="tag-sm text-bone-faint">Region</span>
            <select name="region" required defaultValue="" className={selectClass}>
              <option value="" disabled>
                Pick one
              </option>
              {REGIONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="tag-sm text-bone-faint">Platform</span>
            <select name="platform" required defaultValue="" className={selectClass}>
              <option value="" disabled>
                Pick one
              </option>
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="tag-sm text-bone-faint">Your skill</span>
            <select name="defaultSkill" required defaultValue="" className={selectClass}>
              <option value="" disabled>
                Pick one
              </option>
              {SKILLS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="tag-sm text-bone-faint">Quest username — optional</span>
          <input
            type="text"
            name="questName"
            maxLength={QUEST_NAME_MAX_LENGTH}
            autoComplete="off"
            spellCheck={false}
            placeholder="yourname"
            className="mt-1.5 block h-[38px] w-full max-w-[280px] border border-line-bright bg-void px-2.5 text-[14px] text-bone placeholder:text-bone-faint focus:border-bone-dim"
          />
          <span className="mt-2 block max-w-[58ch] text-[12.5px] leading-relaxed text-bone-faint">
            For squadmates who would rather add you in-headset than on Discord. Shown to
            your squad only, exactly like your Discord name. Leave it blank to skip.
          </span>
        </label>

        <label className="flex w-fit cursor-pointer items-center gap-2.5 border border-line-bright px-3 py-2 text-[13px] text-bone-dim transition-colors hover:border-bone-dim">
          <input type="checkbox" name="hasMic" defaultChecked className="accent-signal" />
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

      <div className="border-t border-line px-5 py-4">
        <button
          type="submit"
          disabled={pending}
          className="tag border border-signal bg-signal px-4 py-2.5 text-void transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {pending ? "Saving" : "Save and open the board"}
        </button>
      </div>
    </form>
  );
}
