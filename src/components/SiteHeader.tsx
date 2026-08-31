import Link from "next/link";
import { ComfortToggle } from "./ComfortToggle";
import { SignInButton } from "./SignInButton";
import type { Viewer } from "@/lib/session";

export function SiteHeader({ viewer }: { viewer: Viewer | null }) {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-[1180px] items-center gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="group flex flex-col gap-1">
          <span className="display text-[19px] leading-none tracking-[-0.03em] text-bone">
            GOT<span className="text-signal">//</span>LFG
          </span>
          <span className="tag-sm text-bone-faint">Tabor squad dispatch</span>
        </Link>

        <div className="ml-auto flex items-center gap-2.5">
          <ComfortToggle />
          {viewer ? (
            <Link
              href="/profile"
              className="flex items-center gap-2.5 border border-line px-2.5 py-1.5 transition-colors hover:border-line-bright"
            >
              {viewer.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={viewer.image}
                  alt=""
                  width={22}
                  height={22}
                  className="rounded-full"
                />
              )}
              <span className="tag-sm text-bone-dim">{viewer.name ?? "Profile"}</span>
            </Link>
          ) : (
            <SignInButton />
          )}
        </div>
      </div>
    </header>
  );
}
