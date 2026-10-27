# Supabase Authentication Email Setup

Website signup and password recovery use Supabase Auth. Signup confirmation
uses Supabase's confirmation link and returns to the website auth callback.
Password recovery uses Supabase's PKCE callback flow.

## Supabase settings

1. Keep email confirmation enabled under **Authentication → Sign In / Providers → Email**.
2. In **Authentication → SMTP Settings**, enable custom SMTP for real users.
   Supabase's default sender is for development and is restricted to authorized
   team addresses with low rate limits. Configure SPF and DKIM with your mail
   provider and inspect its delivery logs when a message is missing.
3. In **Authentication → Email Templates → Confirm signup**, keep the link
   pointed at Supabase's generated confirmation URL:

   ```html
   <p><a href="{{ .ConfirmationURL }}">Verify your Sanatkar email</a></p>
   ```

   Supabase verifies the link and returns the browser to `/auth/callback`,
   which establishes the session and finishes profile synchronization. The old
   `/verify-email` route forwards existing links to the same callback.
4. In **Authentication → Email Templates → Reset Password**, keep the link
   based on `{{ .ConfirmationURL }}`. Do not hard-code `{{ .SiteURL }}` as the
   reset destination; Supabase must preserve the `redirect_to` and PKCE flow.
5. In **Authentication → URL Configuration**, keep the production Site URL set
   to the production site and add these allowed redirects:

   ```text
   http://localhost:3000/**
   https://YOUR-PRODUCTION-DOMAIN/verify-email
   https://YOUR-PRODUCTION-DOMAIN/auth/callback/**
   http://localhost:3000/auth/callback/**
   sanatkar://auth/callback**
   ```

   Replace the production placeholder with the site's actual domain. Local
   signup, resend, and password reset use the current browser origin.

## Local password reset

Request a reset while using `http://localhost:3000`, then open the new email
link in that same browser without editing its URL. The browser stores a PKCE
verifier when requesting the link; changing domains or opening it in a
different browser loses that verifier. Password reset emails change the
password; they do not verify an unconfirmed signup. For signup confirmation,
open the newest confirmation link. It returns to the website callback and
signs the verified account in.
