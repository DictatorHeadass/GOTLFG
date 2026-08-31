import Link from "next/link";
import { redirect } from "next/navigation";
import { GroupStatus } from "@/generated/prisma/client";
import { MicCheck } from "@/components/MicCheck";
import { ProfileForm } from "@/components/ProfileForm";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getAge } from "@/lib/age";
import { ANY, mapName, REGIONS, SKILLS, PLATFORMS } from "@/lib/game-data";
import { GROUP_INCLUDE } from "@/lib/groups";
import { prisma } from "@/lib/prisma";
import { getViewer, getViewerRecord } from "@/lib/session";
import { signOutAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const [viewer, record] = await Promise.all([getViewer(), getViewerRecord()]);
  if (!viewer || !record) redirect("/");
  if (!record.onboardedAt) redirect("/onboarding");

  const memberships = await prisma.groupMember.findMany({
    where: {
      userId: record.id,
      group: {
        status: { in: [GroupStatus.OPEN, GroupStatus.FULL] },
        expiresAt: { gt: new Date() },
      },
    },
    include: { group: { include: GROUP_INCLUDE } },
    orderBy: { joinedAt: "desc" },
  });

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader viewer={viewer} />

      <main className="mx-auto w-full max-w-[760px] flex-1 space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        {/* Identity */}
        <section className="border border-line bg-panel/40 px-5 py-5">
          <div className="flex flex-wrap items-center gap-4">
            {record.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={record.image} alt="" width={44} height={44} className="rounded-full" />
            )}
            <div className="min-w-0">
              <p className="display text-[18px] leading-tight text-bone">
                {record.name ?? "Operator"}
              </p>
              {record.discordName && (
                <code className="tag-sm text-bone-faint">@{record.discordName}</code>
              )}
            </div>

            <form action={signOutAction} className="ml-auto">
              <button
                type="submit"
                className="tag border border-line-bright px-3.5 py-2 text-bone-dim transition-colors hover:border-signal hover:text-signal"
              >
                Sign out
              </button>
            </form>
          </div>

          {record.birthDate && (
            <p className="mt-4 text-[13px] leading-relaxed text-bone-faint">
              You are {getAge(record.birthDate)}, so you can see and join squads gated up to{" "}
              {getAge(record.birthDate)}+. Your date of birth is set once and is never shown
              to anyone else.
            </p>
          )}
        </section>

        <ProfileForm
          region={record.region ?? REGIONS[0].id}
          platform={record.platform ?? PLATFORMS[0]}
          defaultSkill={record.defaultSkill ?? SKILLS[0]}
          hasMic={record.hasMic}
          questName={record.questName ?? ""}
        />

        <MicCheck />

        {/* Active squads */}
        <section className="border border-line bg-panel/40">
          <div className="border-b border-line px-5 py-4">
            <h2 className="display text-[16px] text-bone">Your squads</h2>
          </div>

          {memberships.length === 0 ? (
            <p className="px-5 py-8 text-center text-[13px] text-bone-faint">
              You&apos;re not in a squad right now.{" "}
              <Link href="/" className="text-bone-dim underline underline-offset-4 hover:text-bone">
                Open the board
              </Link>
              .
            </p>
          ) : (
            <ul>
              {memberships.map((membership) => (
                <li key={membership.id}>
                  <Link
                    href={`/groups/${membership.groupId}`}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line px-5 py-3.5 transition-colors last:border-b-0 hover:bg-panel"
                  >
                    <span className="display text-[15px] text-bone">
                      {mapName(membership.group.map)}
                    </span>
                    <span className="tag-sm text-bone-faint">{membership.group.mode}</span>
                    {membership.role === "HOST" && (
                      <span className="tag-sm text-bone-faint">Host</span>
                    )}
                    <span className="tag-sm ml-auto text-bone-dim">
                      {membership.group.members.length}/{membership.group.maxSize}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
