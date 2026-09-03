import Link from "next/link";
import { LEGAL, missingLegalDetails } from "@/lib/legal";

/** Shared chrome for the policy pages so both read as one document set. */
export function LegalPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const missing = missingLegalDetails();

  return (
    <div className="mx-auto w-full max-w-[760px] flex-1 px-4 py-8 sm:px-6">
      <div className="border-b border-line pb-5">
        <h1 className="display text-[26px] leading-tight text-bone">{title}</h1>
        <p className="tag-sm mt-2 text-bone-faint">Last updated {LEGAL.lastUpdated}</p>
      </div>

      {missing.length > 0 && (
        <p
          role="alert"
          className="mt-5 border-l-2 border-signal bg-signal/10 px-4 py-3 text-[13px] leading-relaxed text-bone"
        >
          <span className="text-signal">Unfinished:</span> this document is missing the{" "}
          {missing.join(" and ")}. Fill{" "}
          <code className="tag">src/lib/legal.ts</code> in before relying on it.
        </p>
      )}

      <div className="legal mt-6">{children}</div>

      <p className="mt-10 border-t border-line pt-5 text-[13px] text-bone-faint">
        See also{" "}
        <Link href="/privacy" className="text-bone-dim underline underline-offset-4 hover:text-bone">
          Privacy
        </Link>{" "}
        and{" "}
        <Link href="/terms" className="text-bone-dim underline underline-offset-4 hover:text-bone">
          Terms
        </Link>
        .
      </p>
    </div>
  );
}
