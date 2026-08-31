import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-[520px] flex-col justify-center px-5 py-10">
      <span className="display text-[19px] leading-none tracking-[-0.03em] text-bone">
        GOT<span className="text-signal">//</span>LFG
      </span>

      <h1 className="display mt-8 text-[22px] text-bone">Nothing here</h1>
      <p className="mt-3 text-[14px] leading-relaxed text-bone-dim">
        That squad has filled, disbanded, or dropped off the board. Squads last 60 minutes.
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
