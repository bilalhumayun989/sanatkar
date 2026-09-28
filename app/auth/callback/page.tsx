'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/auth/supabase/client';
import { useAuth } from '@/lib/AuthContext';
import { Loader2, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { refreshAuth, setAuthenticatedUser } = useAuth();
  const [message, setMessage] = useState('Processing authentication...');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const processOAuthRedirect = async () => {
      const supabase = createClient();
      const url = new URL(window.location.href);
      const hashParams = new URLSearchParams(url.hash.startsWith('#') ? url.hash.slice(1) : url.hash);
      const errorDescription = url.searchParams.get('error_description') || hashParams.get('error_description');
      const oauthError = url.searchParams.get('error') || hashParams.get('error');

      if (oauthError) {
        setStatus('error');
        setMessage(errorDescription || oauthError);
        return;
      }

      const code = url.searchParams.get('code');
      if (code) {
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          setStatus('error');
          setMessage(exchangeError.message || 'Unable to finish sign-in.');
          return;
        }

        if (data.session) {
          const urlParams = new URL(window.location.href);
          const isSignup = urlParams.searchParams.get('type') === 'signup';

          if (isSignup) {
            try {
              await fetch('/api/auth/sync', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ...data.session,
                  emailVerified: true
                })
              });
            } catch (e) {
              // Non-fatal — continue to hydrate client
            }
          }

          try {
            await fetch('/api/auth/sync', {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data.session)
            });
          } catch (e) {
            // Non-fatal — continue to hydrate client
          }

          setStatus('success');
          setMessage('Authentication successful! Redirecting...');
          await refreshAuth();
          window.history.replaceState({}, document.title, window.location.pathname);
          const next = new URL(window.location.href).searchParams.get('next') || '/';
          router.replace(next);
          return;
        }
      }

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
          setStatus('error');
          setMessage(setError.message || 'Unable to store session.');
          return;
        }
        if (setData?.session) {
          setStatus('success');
          setMessage('Authentication successful! Redirecting...');
          await refreshAuth();
          window.history.replaceState({}, document.title, window.location.pathname);
          const next = new URL(window.location.href).searchParams.get('next') || '/';
          router.replace(next);
          return;
        }
      }

      const { data, error } = await supabase.auth.getSession();
      if (error) {
        setStatus('error');
        setMessage(error.message || 'Sign-in failed. Please try again.');
        return;
      }

      if (data?.session) {
        setStatus('success');
        setMessage('Session restored! Redirecting...');
        await refreshAuth();
        window.history.replaceState({}, document.title, window.location.pathname);
        router.replace('/');
        return;
      }

      setStatus('error');
      setMessage('Sign-in did not return a valid session. Please try again.');
    };

    processOAuthRedirect();
  }, [router, refreshAuth, setAuthenticatedUser]);

  return (
    <div className="min-h-screen bg-gray-50/50 text-gray-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Soft Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main White Card */}
      <div className="w-full max-w-md bg-white border border-gray-100/80 rounded-3xl p-8 shadow-xl shadow-gray-200/50 text-center relative z-10 backdrop-blur-md">
        
        {/* Status Icon */}
        <div className="flex justify-center mb-6">
          {status === 'loading' && (
            <div className="relative flex items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-sm">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm animate-in zoom-in-75 duration-300">
              <CheckCircle2 className="w-8 h-8" />
            </div>
          )}

          {status === 'error' && (
            <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 shadow-sm animate-in zoom-in-75 duration-300">
              <AlertCircle className="w-8 h-8" />
            </div>
          )}
        </div>

        {/* Content */}
        <h1 className="text-xl font-bold tracking-tight text-gray-900 mb-2">
          {status === 'loading' && 'Authenticating...'}
          {status === 'success' && 'Signed in successfully'}
          {status === 'error' && 'Authentication failed'}
        </h1>

        <p className="text-sm text-gray-500 leading-relaxed mb-6 max-w-xs mx-auto">
          {message}
        </p>

        {/* Action Button for Error state */}
        {status === 'error' && (
          <Link
            href="/login"
            className="inline-flex items-center justify-center w-full px-5 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary-dark rounded-xl shadow-sm transition-all hover:shadow active:scale-95"
          >
            Back to Sign In
          </Link>
        )}

        {/* Footer badge */}
        <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-center gap-1.5 text-xs text-gray-400">
          <ShieldCheck className="w-4 h-4 text-gray-400" />
          <span>Secure authentication via Supabase</span>
        </div>
      </div>
    </div>
  );
}