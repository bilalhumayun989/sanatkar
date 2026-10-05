BEGIN;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('blog-images', 'blog-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Admins upload blog images" ON storage.objects;
CREATE POLICY "Admins upload blog images" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'blog-images' AND EXISTS (
  SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
));

DROP POLICY IF EXISTS "Admins manage blog images" ON storage.objects;
CREATE POLICY "Admins manage blog images" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'blog-images' AND EXISTS (
  SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
));

DROP POLICY IF EXISTS "Admins delete blog images" ON storage.objects;
CREATE POLICY "Admins delete blog images" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'blog-images' AND EXISTS (
  SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
));

COMMIT;
