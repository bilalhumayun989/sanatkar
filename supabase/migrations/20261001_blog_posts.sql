BEGIN;

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE CHECK (char_length(slug) BETWEEN 1 AND 160),
  title TEXT NOT NULL CHECK (char_length(trim(title)) BETWEEN 1 AND 180),
  excerpt TEXT NOT NULL CHECK (char_length(trim(excerpt)) BETWEEN 1 AND 320),
  content TEXT NOT NULL CHECK (char_length(trim(content)) BETWEEN 1 AND 60000),
  category TEXT NOT NULL CHECK (char_length(trim(category)) BETWEEN 1 AND 60),
  author_name TEXT NOT NULL CHECK (char_length(trim(author_name)) BETWEEN 1 AND 100),
  cover_image_url TEXT NOT NULL DEFAULT '' CHECK (cover_image_url = '' OR cover_image_url ~ '^https://'),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS blog_posts_published_date_idx ON public.blog_posts (created_at DESC) WHERE status = 'published';
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.blog_posts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;

DROP POLICY IF EXISTS "Anyone can read published blogs" ON public.blog_posts;
CREATE POLICY "Anyone can read published blogs" ON public.blog_posts FOR SELECT
  USING (status = 'published');

DROP POLICY IF EXISTS "Admins manage blogs" ON public.blog_posts;
CREATE POLICY "Admins manage blogs" ON public.blog_posts FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE OR REPLACE FUNCTION public.set_blog_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS blog_updated_at ON public.blog_posts;
CREATE TRIGGER blog_updated_at BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_blog_updated_at();

COMMIT;
