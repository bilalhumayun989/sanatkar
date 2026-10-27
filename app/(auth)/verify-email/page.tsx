'use client';

import { useEffect } from 'react';

/** Old confirmation emails may still point here. Forward their auth tokens to
 * the normal callback so the verification link completes without a code form. */
export default function VerifyEmailRedirectPage() {
  useEffect(() => {
    const callback = new URL('/auth/callback', window.location.origin);
    callback.search = window.location.search;
    callback.hash = window.location.hash;
    window.location.replace(callback.toString());
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#EAEFF9] p-6 text-sm text-slate-600">
      Opening your confirmation link…
    </main>
  );
}
