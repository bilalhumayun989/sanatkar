-- Remove abandoned email/password signups after 24 hours. Deleting the Auth
-- identity cascades to its profile and any other rows with an auth.users FK.
create extension if not exists pg_cron with schema extensions;

select cron.schedule(
  'delete-expired-unverified-signups',
  '0 * * * *',
  $$
    delete from auth.users
    where email_confirmed_at is null
      and created_at < now() - interval '24 hours';
  $$
);
