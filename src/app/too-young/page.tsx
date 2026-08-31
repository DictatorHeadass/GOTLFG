import Link from "next/link";
import { MIN_SIGNUP_AGE } from "@/lib/age";

export default function TooYoungPage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-[560px] flex-col justify-center px-5 py-10">
      <span className="display text-[19px] leading-none tracking-[-0.03em] text-bone">
        GOT<span className="text-signal">//</span>LFG
      </span>

      <h1 className="display mt-8 text-[22px] text-bone">
        You need to be {MIN_SIGNUP_AGE} or older
      </h1>

      <p className="mt-3 text-[14px] leading-relaxed text-bone-dim">
        The date of birth you entered is under {MIN_SIGNUP_AGE}, so your account has been
        deleted along with everything attached to it. Nothing was kept.
      </p>

      <p className="mt-3 text-[14px] leading-relaxed text-bone-dim">
        Mistyped it? Sign in with Discord again and enter the right date.
      </p>

      <Link
        href="/"
        className="tag mt-7 w-fit border border-line-bright px-4 py-2.5 text-bone-dim transition-colors hover:border-bone hover:text-bone"
      >
        Back to the board
      </Link>
    </div>
  );
}
