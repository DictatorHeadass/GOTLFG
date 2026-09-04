/**
 * Details the legal pages need that only the operator can supply.
 *
 * Leave a field empty and the pages render a visible warning banner rather than
 * printing an obvious placeholder to the public. Fill these in before you tell
 * anyone about the site.
 */
export const LEGAL = {
  siteName: "GOT LFG",
  siteUrl: "https://gotlfg.vercel.app",

  /** Where data-protection requests and abuse reports go. Required. */
  contactEmail: "wanderworldsmc@gmail.com",

  /**
   * The country (and state/province, if relevant) whose law governs the terms
   * and whose courts hear disputes. Normally where the operator lives.
   */
  jurisdiction: "the State of Ohio, United States",

  /** Shown at the top of both documents. Bump it whenever you change them. */
  lastUpdated: "3 September 2026",
} as const;

export function missingLegalDetails(): string[] {
  const missing: string[] = [];
  if (!LEGAL.contactEmail) missing.push("contact email");
  if (!LEGAL.jurisdiction) missing.push("governing jurisdiction");
  return missing;
}
