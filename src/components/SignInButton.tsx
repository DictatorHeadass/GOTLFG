"use client";

import { signIn } from "next-auth/react";

export function SignInButton({
  label = "Sign in with Discord",
  callbackUrl = "/",
  className = "",
}: {
  label?: string;
  callbackUrl?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => signIn("discord", { callbackUrl })}
      className={
        className ||
        "tag inline-flex items-center gap-2 border border-signal/70 bg-signal/10 px-3.5 py-2 text-signal transition-colors hover:bg-signal hover:text-void"
      }
    >
      <svg viewBox="0 0 24 18" aria-hidden="true" className="h-3.5 w-3.5 fill-current">
        <path d="M20.3 1.6A19.8 19.8 0 0 0 15.4 0l-.3.5c1.7.4 3.2 1 4.6 1.9a16.5 16.5 0 0 0-14-.6c-.6.2-1.1.4-1.6.6C5.5 1.5 7 .9 8.7.5L8.5 0A19.8 19.8 0 0 0 3.6 1.6C.7 6 0 10.2.3 14.4a19.9 19.9 0 0 0 6 3c.5-.6.9-1.3 1.3-2-.7-.3-1.4-.6-2-1l.5-.4a14.2 14.2 0 0 0 12 0l.5.4c-.6.4-1.3.7-2 1 .4.7.8 1.4 1.3 2a19.8 19.8 0 0 0 6-3c.5-4.9-.7-9.1-3.6-12.8ZM8 11.8c-1.2 0-2.2-1.1-2.2-2.4C5.8 8 6.8 7 8 7s2.2 1 2.2 2.4c0 1.3-1 2.4-2.2 2.4Zm8 0c-1.2 0-2.2-1.1-2.2-2.4C13.8 8 14.8 7 16 7s2.2 1 2.2 2.4c0 1.3-1 2.4-2.2 2.4Z" />
      </svg>
      {label}
    </button>
  );
}
