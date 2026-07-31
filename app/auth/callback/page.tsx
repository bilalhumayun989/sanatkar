'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/AuthContext';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { refreshAuth, setAuthenticatedUser } = useAuth();
  const [message, setMessage] = useState('Processing Google sign-in...');

  useEffect(() => {
    const processOAuthRedirect = async () => {
      const supabase = createClient();
      const url = new URL(window.location.href);
      const hashParams = new URLSearchParams(url.hash.startsWith('#') ? url.hash.slice(1) : url.hash);
      const errorDescription = url.searchParams.get('error_description') || hashParams.get('error_description');
      const oauthError = url.searchParams.get('error') || hashParams.get('error');

      if (oauthError) {
        setMessage(errorDescription || oauthError);
        return;
      }

      const code = url.searchParams.get('code');
      if (code) {
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          setMessage(exchangeError.message || 'Unable to finish Google sign-in.');
          return;
        }

        if (data.session) {
          // Persist session to server cookie so server-side routes detect it.
          try {
            await fetch('/api/auth/sync', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data.session) });
          } catch (e) {
            // Non-fatal — continue to hydrate client
          }

          await refreshAuth();
          setAuthenticatedUser(data.session.user);
          window.history.replaceState({}, document.title, window.location.pathname);
          // Respect optional `next` param from the login redirect
          const next = new URL(window.location.href).searchParams.get('next') || '/';
          router.replace(next);
          return;
        }
      }

      // Retain support for an existing implicit-flow redirect during a
      // provider/configuration transition.
      const parsed = Object.fromEntries(hashParams.entries());

      if (parsed.access_token && parsed.refresh_token) {
        const sessionData = {
          access_token: parsed.access_token,
          refresh_token: parsed.refresh_token,
          expires_in: parsed.expires_in ? Number(parsed.expires_in) : undefined,
          token_type: parsed.token_type,
          provider_token: parsed.provider_token,
        };

        const { data: setData, error: setError } = await supabase.auth.setSession(
          sessionData as Parameters<typeof supabase.auth.setSession>[0],
        );
        if (setError) {
          setMessage(setError.message || 'Unable to store Google session.');
          return;
        }
        if (setData?.session) {
          await refreshAuth();
          setAuthenticatedUser(setData.session.user);
          window.history.replaceState({}, document.title, window.location.pathname);
          const next = new URL(window.location.href).searchParams.get('next') || '/';
          router.replace(next);
          return;
        }
      }

      const { data, error } = await supabase.auth.getSession();
      if (error) {
        setMessage(error.message || 'Google sign-in failed. Please try again.');
        return;
      }

      if (data?.session) {
        await refreshAuth();
        setAuthenticatedUser(data.session.user);
        window.history.replaceState({}, document.title, window.location.pathname);
        router.replace('/');
        return;
      }

      setMessage('Google sign-in did not return a valid session. Please try again.');
    };

    processOAuthRedirect();
  }, [router, refreshAuth, setAuthenticatedUser]);

  return (
    <div className="min-h-screen bg-[#000] flex items-center justify-center px-4 py-20 text-center text-white">
      <div>
        <h1 className="text-2xl font-bold mb-4">Signing you in...</h1>
        <p className="text-gray-300">{message}</p>
      </div>
    </div>
  );
}
