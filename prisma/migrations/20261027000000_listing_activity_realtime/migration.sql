CREATE FUNCTION public.sanatkar_listing_activity_changed() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  activity jsonb;
  listing_owner uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN activity := to_jsonb(OLD); ELSE activity := to_jsonb(NEW); END IF;
  SELECT seller_id INTO listing_owner FROM public.listings WHERE id = (activity->>'listing_id')::uuid;
  IF listing_owner IS NOT NULL THEN
    PERFORM public.sanatkar_emit('profile', 'users', ARRAY[listing_owner], activity->>'listing_id', TG_OP);
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;

CREATE TRIGGER sanatkar_listing_views_realtime
AFTER INSERT OR UPDATE OR DELETE ON public.listing_views
FOR EACH ROW EXECUTE FUNCTION public.sanatkar_listing_activity_changed();

CREATE TRIGGER sanatkar_listing_shares_realtime
AFTER INSERT OR UPDATE OR DELETE ON public.listing_shares
FOR EACH ROW EXECUTE FUNCTION public.sanatkar_listing_activity_changed();
