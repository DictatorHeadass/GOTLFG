import { notFound } from "next/navigation";
import { SquadPanel } from "@/components/SquadPanel";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { mapName } from "@/lib/game-data";
import { getLiveGroup, serializeGroup } from "@/lib/groups";
import { getViewer } from "@/lib/session";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const group = await getLiveGroup(id);
  if (!group) return { title: "Squad not found — GOT LFG" };

  return {
    title: `${mapName(group.map)} ${group.mode} squad — GOT LFG`,
    description: `${group.members.length}/${group.maxSize} slots filled. ${group.minAge}+, ${group.skill}.`,
  };
}

export default async function GroupPage({ params }: Props) {
  const { id } = await params;

  const viewer = await getViewer();
  const group = await getLiveGroup(id);
  if (!group) notFound();

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader viewer={viewer} />
      <main className="mx-auto w-full max-w-[760px] flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <SquadPanel
          initial={serializeGroup(group, viewer?.id ?? null)}
          signedIn={viewer !== null}
          viewerId={viewer?.id ?? null}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
