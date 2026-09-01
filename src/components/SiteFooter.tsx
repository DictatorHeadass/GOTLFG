export function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-line">
      <div className="mx-auto max-w-[1180px] px-4 py-6 sm:px-6">
        <p className="max-w-[70ch] text-[13px] leading-relaxed text-bone-faint">
          <span className="text-bone-dim">Ages here are self-reported.</span> Signing in with
          Discord proves nothing about how old someone is, so an 18+ squad is a filter for
          finding people you want to play with - not a vetted space. Use your judgement, and
          report anyone who makes the board worse.
        </p>
        <p className="tag-sm mt-4 text-bone-faint">
          Fan project. Not affiliated with Combat Waffle Studios or Beyond Frames Entertainment.
        </p>
      </div>
    </footer>
  );
}
