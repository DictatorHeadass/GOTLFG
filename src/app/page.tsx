import { Suspense } from "react";
import { Board } from "@/components/Board";
import { MicSessionPrompt } from "@/components/MicSessionPrompt";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import type { PostDefaults } from "@/components/PostSquadForm";
import { getAge } from "@/lib/age";
import { AGE_GATES, ANY, REGIONS } from "@/lib/game-data";
import { getBoard, getBoardStats } from "@/lib/groups";
import { getViewer, getViewerRecord } from "@/lib/session";
import { parseFilters } from "@/lib/validation";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    const first = Array.isArray(value) ? value[0] : value;
    if (typeof first === "string" && first) params.set(key, first);
  }

  const [viewer, record] = await Promise.all([getViewer(), getViewerRecord()]);
  const filters = parseFilters(params);

  const boardViewer = record
    ? { id: record.id, age: record.birthDate ? getAge(record.birthDate) : null }
    : null;

  const [groups, stats] = await Promise.all([
    getBoard(filters, boardViewer),
    getBoardStats(),
  ]);

  const postDefaults: PostDefaults | null =
    record?.onboardedAt && record.birthDate
      ? {
          region: record.region ?? REGIONS[0].id,
          platform: record.platform ?? ANY,
          skill: record.defaultSkill ?? ANY,
          hasMic: record.hasMic,
          // A host cannot gate a squad above their own age.
          allowedGates: AGE_GATES.filter((gate) => gate <= getAge(record.birthDate!)),
        }
      : null;

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader viewer={viewer} />

      <main className="mx-auto w-full max-w-[1180px] flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <p className="mb-5 max-w-[62ch] text-[14px] leading-relaxed text-bone-dim">
          Post a squad, fill the slots, swap Discord. Filter the board by map, mode, skill,
          region and age gate.
        </p>

        {viewer?.onboarded && !viewer.micVerified && <MicSessionPrompt />}

        <Suspense
          fallback={
            <div className="border border-line px-4 py-16 text-center">
              <span className="tag text-bone-faint">Loading the board</span>
            </div>
          }
        >
          <Board
            initial={{ groups, stats }}
            signedIn={viewer !== null}
            onboarded={viewer?.onboarded ?? false}
            postDefaults={postDefaults}
          />
        </Suspense>
      </main>

      <SiteFooter />
    </div>
  );
}
