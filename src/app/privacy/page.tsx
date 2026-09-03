import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { MIN_SIGNUP_AGE } from "@/lib/age";
import { GROUP_TTL_MINUTES } from "@/lib/game-data";
import { LEGAL } from "@/lib/legal";
import { getViewer } from "@/lib/session";

export const metadata: Metadata = {
  title: "Privacy - GOT LFG",
  description: "What GOT LFG collects, why, who it is shared with, and how to delete it.",
};

export default async function PrivacyPage() {
  const viewer = await getViewer();
  const contact = LEGAL.contactEmail || "the contact address on the site";

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader viewer={viewer} />

      <LegalPage title="Privacy">
        <h2>The short version</h2>
        <p>
          {LEGAL.siteName} is a free fan-made tool for finding people to play Ghosts of Tabor
          with. It collects the minimum needed to do that, shows your Discord name only to
          people in your squad, never records audio, runs no analytics and no advertising,
          and lets you delete everything yourself from your profile page at any time.
        </p>

        <h2>What is collected</h2>
        <p>
          <strong>From Discord, when you sign in.</strong> Your Discord user ID, username,
          display name, avatar image and email address. Discord asks your permission before
          any of this is shared, and you can revoke it from your Discord account settings.
        </p>
        <p>
          <strong>What you enter.</strong> Your date of birth, region, platform, skill level,
          whether you use a mic, and optionally your Meta/Quest username.
        </p>
        <p>
          <strong>What you create.</strong> Squads you post, squads you join, the notes you
          write on them, and messages you send in a squad lobby.
        </p>
        <p>
          <strong>Automatically.</strong> Standard web server logs kept by our hosting
          provider, which include IP address, browser user agent and request timestamps.
          These are used to keep the site running and to investigate abuse.
        </p>

        <h2>Your date of birth</h2>
        <p>
          Your date of birth decides which age-gated squads you can see and join. It is{" "}
          <strong>never shown to anyone else</strong> and never appears in any response the
          site sends to another player - they only ever see the minimum age a squad requires,
          never your age or birthday.
        </p>
        <p>
          Ages here are <strong>self-reported and not verified</strong>. Signing in with
          Discord proves nothing about how old someone is. An 18+ squad is a filter for
          finding people you want to play with, not a vetted or supervised space.
        </p>

        <h2>The mic check</h2>
        <p>
          The mic check runs in your browser. <strong>No audio is recorded, stored, or sent
          to our servers</strong> - the only thing saved is whether you passed, which method
          was used, and that it happened during your current sign-in.
        </p>
        <p>
          If you tick <strong>&ldquo;Check the actual words I say&rdquo;</strong>, your browser
          uses its built-in speech recognition. In Chrome and Edge this works by{" "}
          <strong>sending the captured audio to Google</strong> to be transcribed, under
          Google&apos;s own privacy policy rather than this one. That option is off by default
          and is never enabled without you ticking it. Leave it off and the check runs entirely
          on your device.
        </p>

        <h2>Who it is shared with</h2>
        <p>
          Nothing is sold, rented, or shared for advertising. The site is built on services
          that necessarily process data in order to run it:
        </p>
        <ul>
          <li>
            <strong>Discord</strong> - sign-in and identity.
          </li>
          <li>
            <strong>Vercel</strong> - hosting and server logs.
          </li>
          <li>
            <strong>Neon</strong> - the database where your profile and squads are stored.
          </li>
          <li>
            <strong>Google</strong> - only if you opt in to speech recognition, and only the
            audio captured during that check.
          </li>
        </ul>
        <p>
          Other players see your Discord display name and avatar on the board. They see your
          Discord username and Quest username <strong>only if they are in the same squad as
          you</strong>.
        </p>

        <h2>Cookies</h2>
        <p>
          The site sets a session cookie so it can remember you are signed in, and a
          security token to prevent cross-site request forgery. That is all. There are{" "}
          <strong>no analytics, advertising, or tracking cookies</strong>, and nothing is
          shared with third parties for profiling. Because these cookies are strictly
          necessary to provide a service you actively asked for, no consent banner is used.
        </p>
        <p>
          Your browser also stores two small preferences locally - your comfort-mode setting
          and whether you dismissed the mic-check prompt. These never leave your device.
        </p>

        <h2>How long it is kept</h2>
        <ul>
          <li>
            <strong>Squads and lobby messages</strong> - squads drop off the board after{" "}
            {GROUP_TTL_MINUTES} minutes, and their messages are deleted with them.
          </li>
          <li>
            <strong>Your profile</strong> - kept until you delete your account.
          </li>
          <li>
            <strong>Server logs</strong> - kept by our host for their standard retention
            period.
          </li>
        </ul>

        <h2>Your choices</h2>
        <p>
          <strong>See and correct it.</strong> Everything you gave us is on your profile page
          and can be edited there.
        </p>
        <p>
          <strong>Delete it.</strong> Your profile page has a Delete account button. It
          removes your profile, date of birth, names, squads, memberships and lobby messages
          immediately and permanently. You do not need to ask us or wait for approval.
        </p>
        <p>
          <strong>Withdraw Discord access.</strong> Revoke the app from your Discord account
          settings at any time.
        </p>
        <p>
          Depending on where you live you may also have rights to a copy of your data, to
          object to processing, or to complain to a data-protection regulator. Write to{" "}
          {contact} and we will help.
        </p>

        <h2>Children</h2>
        <p>
          This site is not for people under {MIN_SIGNUP_AGE}. If the date of birth you enter
          is under {MIN_SIGNUP_AGE}, the account created during sign-in is{" "}
          <strong>deleted immediately</strong> and nothing is kept. If you believe a child
          under {MIN_SIGNUP_AGE} has an account here, contact {contact} and it will be
          removed.
        </p>

        <h2>Changes</h2>
        <p>
          If this policy changes in a way that matters, the date at the top will change and
          the change will be noted on the site.
        </p>

        <h2>Contact</h2>
        <p>Questions or requests about your data: {contact}.</p>
      </LegalPage>

      <SiteFooter />
    </div>
  );
}
