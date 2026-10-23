-- Keep only the identity UUID so old/in-flight sessions cannot recreate profiles.
CREATE TABLE public.deleted_accounts (
  user_id UUID PRIMARY KEY,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.account_deletion_attempts (
  user_id UUID PRIMARY KEY,
  attempts INTEGER NOT NULL DEFAULT 1,
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE FUNCTION public.sanatkar_reject_deleted_profile() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.deleted_accounts WHERE user_id = NEW.id) THEN
    RAISE EXCEPTION 'Account has been deleted' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER reject_deleted_profile BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sanatkar_reject_deleted_profile();
