import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { MIN_SIGNUP_AGE } from "@/lib/age";
import { LEGAL } from "@/lib/legal";
import { getViewer } from "@/lib/session";

export const metadata: Metadata = {
  title: "Terms - GOT LFG",
  description: "The rules for using GOT LFG, and the limits of what it promises.",
};

export default async function TermsPage() {
  const viewer = await getViewer();
  const contact = LEGAL.contactEmail || "the contact address on the site";

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader viewer={viewer} />

      <LegalPage title="Terms of use">
        <h2>What this is</h2>
        <p>
          {LEGAL.siteName} is a free, fan-made noticeboard for finding people to play Ghosts
          of Tabor with. It is run as a hobby, at no charge, with no guarantee that it will
          keep working or keep existing. By using it you accept these terms.
        </p>

        <h2>Not affiliated with anyone</h2>
        <p>
          This site is <strong>not affiliated with, endorsed by, or connected to</strong>{" "}
          Combat Waffle Studios, Beyond Frames Entertainment, Meta, Discord, or any other
          company. Ghosts of Tabor and all related names and marks belong to their respective
          owners and are used here only to describe the game this tool is for.
        </p>

        <h2>Who can use it</h2>
        <p>
          You must be at least {MIN_SIGNUP_AGE} years old. If you are under 18, you may only
          use squads whose age requirement you actually meet. Do not lie about your age -
          the age filters exist so that adults and minors can choose who they play with, and
          defeating them puts other people at risk.
        </p>

        <h2>Age gates are not vetting</h2>
        <p>
          Ages on this site are <strong>self-reported and unverified</strong>. An 18+ squad
          means every member typed a date of birth that made them 18 or over. It does not
          mean anyone has been checked, screened, or supervised. Treat people here as
          strangers on the internet, because that is what they are. Use your own judgement,
          do not share personal information you would not want public, and report anyone who
          behaves badly.
        </p>

        <h2>How to behave</h2>
        <p>Do not use this site to:</p>
        <ul>
          <li>harass, threaten, bully, or sexually solicit anyone, and never a minor;</li>
          <li>
            post another person&apos;s private information, or share someone&apos;s Discord or
            Quest name outside the squad they gave it to;
          </li>
          <li>impersonate another person, or pretend to be an age you are not;</li>
          <li>post hateful, violent, sexual, or illegal content, including in squad notes and lobby messages;</li>
          <li>spam the board, advertise, sell things, or run scams;</li>
          <li>
            attack the site itself - scraping, automated posting, or attempting to reach data
            that is not yours.
          </li>
        </ul>

        <h2>What you post</h2>
        <p>
          You keep ownership of the squad notes and messages you write. You give us
          permission to store and display them to other users as needed to run the site.
          Everything you post is deleted when the squad expires, or when you delete your
          account.
        </p>
        <p>
          You are responsible for what you post. Do not post anything you do not have the
          right to share.
        </p>

        <h2>Reports and removal</h2>
        <p>
          Every squad member can be reported from the squad page. We may remove content and
          suspend or delete accounts that break these terms, without notice where the
          behaviour is serious. To report something urgent, contact {contact}.
        </p>

        <h2>The mic check</h2>
        <p>
          A &ldquo;Mic verified&rdquo; mark means someone&apos;s browser reported passing a
          check during their current session. It is <strong>not proof</strong> that they have
          a working microphone, that they will use it, or that they are who they say they
          are. Do not rely on it for anything that matters.
        </p>

        <h2>No warranty</h2>
        <p>
          The site is provided <strong>&ldquo;as is&rdquo;</strong>, with no warranties of any
          kind, express or implied. It may be unavailable, lose data, show stale information,
          or shut down permanently at any time and without notice. Nothing here is a promise
          that you will find a squad or that anyone you meet will be pleasant to play with.
        </p>

        <h2>Limitation of liability</h2>
        <p>
          To the fullest extent the law allows, the operator of this site is not liable for
          any indirect, incidental, or consequential loss arising from your use of it, or
          from your dealings with other users. This site introduces people to each other; it
          does not supervise them and is not responsible for what they do. Nothing in these
          terms limits liability that cannot legally be limited, including for death or
          personal injury caused by negligence, or for fraud.
        </p>

        <h2>Ending it</h2>
        <p>
          You can stop at any time and delete your account from your profile page. We can
          suspend or remove accounts that break these terms.
        </p>

        <h2>Governing law</h2>
        <p>
          {LEGAL.jurisdiction
            ? `These terms are governed by the laws of ${LEGAL.jurisdiction}, and disputes will be handled by its courts.`
            : "The governing jurisdiction has not been set yet - see the notice at the top of this page."}{" "}
          If you are a consumer, this does not take away rights you have under the law of
          your own country.
        </p>

        <h2>Changes</h2>
        <p>
          These terms may change. The date at the top will change with them, and continuing
          to use the site means you accept the new version.
        </p>

        <h2>Contact</h2>
        <p>{contact}</p>
      </LegalPage>

      <SiteFooter />
    </div>
  );
}
