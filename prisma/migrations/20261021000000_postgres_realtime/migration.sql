ALTER TABLE public.notifications ADD COLUMN metadata JSONB NOT NULL DEFAULT '{}';
ALTER TABLE public.notifications ADD COLUMN source_key TEXT;
CREATE UNIQUE INDEX notifications_source_key_key ON public.notifications(source_key);
CREATE INDEX notifications_user_id_is_read_created_at_idx ON public.notifications(user_id, is_read, created_at DESC);

-- Only invalidation metadata travels over NOTIFY. Private data is fetched from
-- authenticated APIs. PostgreSQL delivers these events only after commit.
CREATE FUNCTION public.sanatkar_emit(topic text, audience text, users uuid[] DEFAULT '{}', record_id text DEFAULT NULL, operation text DEFAULT NULL)
RETURNS void LANGUAGE sql AS $$
  SELECT pg_notify('sanatkar_events', json_build_object(
    'topic', topic, 'audience', audience, 'users', users,
    'record_id', record_id, 'operation', operation)::text);
$$;

CREATE FUNCTION public.sanatkar_changes() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  r jsonb;
  participants uuid[];
  recipient uuid;
  sender_name text;
  thread_id uuid;
BEGIN
  IF TG_OP = 'UPDATE' AND to_jsonb(OLD) = to_jsonb(NEW) THEN RETURN NEW; END IF;
  IF TG_OP = 'DELETE' THEN r := to_jsonb(OLD); ELSE r := to_jsonb(NEW); END IF;

  CASE TG_TABLE_NAME
    WHEN 'listings' THEN
      PERFORM public.sanatkar_emit('listings', 'public');
      PERFORM public.sanatkar_emit('profile', 'users', ARRAY[(r->>'seller_id')::uuid]);
    WHEN 'categories', 'brands', 'ads', 'blog_posts' THEN
      PERFORM public.sanatkar_emit('catalog', 'public');
    WHEN 'profiles' THEN
      PERFORM public.sanatkar_emit('catalog', 'public');
      PERFORM public.sanatkar_emit('profile', 'users', ARRAY[(r->>'id')::uuid]);
    WHEN 'favorites' THEN
      PERFORM public.sanatkar_emit('favorites', 'users', ARRAY[(r->>'user_id')::uuid]);
    WHEN 'notifications' THEN
      PERFORM public.sanatkar_emit('notifications', 'users', ARRAY[(r->>'user_id')::uuid], r->>'id', TG_OP);
    WHEN 'chat_hidden_for' THEN
      PERFORM public.sanatkar_emit('chats', 'users', ARRAY[(r->>'user_id')::uuid]);
    WHEN 'chats' THEN
      PERFORM public.sanatkar_emit('chats', 'users', ARRAY[(r->>'buyer_id')::uuid, (r->>'seller_id')::uuid]);
    WHEN 'messages' THEN
      SELECT ARRAY[buyer_id, seller_id],
             CASE WHEN buyer_id = (r->>'sender_id')::uuid THEN seller_id ELSE buyer_id END
        INTO participants, recipient FROM public.chats WHERE id = (r->>'chat_id')::uuid;
      PERFORM public.sanatkar_emit('chats', 'users', participants);
      IF TG_OP = 'INSERT' THEN
        DELETE FROM public.chat_hidden_for WHERE chat_id = (r->>'chat_id')::uuid;
        IF recipient IS NOT NULL AND coalesce(r->>'type', 'text') <> 'offer' THEN
          SELECT coalesce(full_name, username, 'New message') INTO sender_name
            FROM public.profiles WHERE id = (r->>'sender_id')::uuid;
          INSERT INTO public.notifications(user_id, title, message, type, metadata, source_key)
            VALUES (recipient, coalesce(sender_name, 'New message'), left(r->>'content', 500), 'chat',
              jsonb_build_object('chat_id', r->>'chat_id', 'message_id', r->>'id'), 'message:' || (r->>'id'))
            ON CONFLICT (source_key) DO NOTHING;
        END IF;
      ELSIF TG_OP = 'UPDATE' AND (r->>'is_read')::boolean IS TRUE AND OLD.is_read IS DISTINCT FROM NEW.is_read THEN
        UPDATE public.notifications SET is_read = true
          WHERE metadata->>'message_id' = r->>'id' AND is_read IS DISTINCT FROM true;
      END IF;
    WHEN 'offers' THEN
      PERFORM public.sanatkar_emit('notifications', 'users', ARRAY[(r->>'seller_id')::uuid, (r->>'buyer_id')::uuid]);
      IF TG_OP = 'INSERT' THEN
        SELECT id INTO thread_id FROM public.chats
          WHERE listing_id = (r->>'listing_id')::uuid AND buyer_id = (r->>'buyer_id')::uuid
            AND seller_id = (r->>'seller_id')::uuid ORDER BY created_at LIMIT 1;
        INSERT INTO public.notifications(user_id, title, message, type, metadata, source_key)
          VALUES ((r->>'seller_id')::uuid, 'New offer received', 'An offer of PKR ' || (r->>'offer_price') || ' was made on your listing.', 'offer',
            jsonb_build_object('listing_id', r->>'listing_id', 'offer_id', r->>'id', 'chat_id', thread_id), 'offer:' || (r->>'id'))
          ON CONFLICT (source_key) DO NOTHING;
      END IF;
    ELSE NULL;
  END CASE;
  IF TG_TABLE_NAME IN ('profiles', 'listings', 'categories', 'brands', 'offers', 'orders', 'badge_requests', 'ads', 'blog_posts') THEN
    PERFORM public.sanatkar_emit('admin', 'admins');
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;

-- Preserve currently unread activity when upgrading an existing database.
INSERT INTO public.notifications(user_id, title, message, type, created_at, metadata, source_key)
SELECT CASE WHEN c.buyer_id = m.sender_id THEN c.seller_id ELSE c.buyer_id END,
       coalesce(p.full_name, p.username, 'New message'), left(m.content, 500), 'chat', m.created_at,
       jsonb_build_object('chat_id', m.chat_id, 'message_id', m.id), 'message:' || m.id::text
FROM public.messages m JOIN public.chats c ON c.id = m.chat_id
LEFT JOIN public.profiles p ON p.id = m.sender_id
WHERE m.is_read IS DISTINCT FROM true AND coalesce(m.type, 'text') <> 'offer'
  AND CASE WHEN c.buyer_id = m.sender_id THEN c.seller_id ELSE c.buyer_id END IS NOT NULL
ON CONFLICT (source_key) DO NOTHING;

INSERT INTO public.notifications(user_id, title, message, type, created_at, metadata, source_key)
SELECT seller_id, 'New offer received', 'An offer of PKR ' || offer_price::text || ' was made on your listing.', 'offer', created_at,
       jsonb_build_object('listing_id', listing_id, 'offer_id', id), 'offer:' || id::text
FROM public.offers WHERE status = 'pending'
ON CONFLICT (source_key) DO NOTHING;

DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['listings', 'profiles', 'categories', 'brands', 'favorites', 'messages', 'chats', 'chat_hidden_for', 'notifications', 'offers', 'orders', 'badge_requests', 'ads', 'blog_posts'] LOOP
    EXECUTE format('CREATE TRIGGER sanatkar_realtime AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.sanatkar_changes()', table_name);
  END LOOP;
END;
$$;
