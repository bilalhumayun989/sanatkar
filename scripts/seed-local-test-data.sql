-- Local-only sample rows for checking the SanatKar schema from pgAdmin.
-- Apply Prisma migrations first. This intentionally refuses any database
-- whose name is not `sanatkar`.
DO $$
BEGIN
  IF current_database() <> 'sanatkar' THEN
    RAISE EXCEPTION 'Refusing to seed database "%"; expected local database "sanatkar".', current_database();
  END IF;
END $$;

INSERT INTO categories (id, name, icon_code, description, is_active, is_popular, image_url)
SELECT gen_random_uuid(), 'Local Test Category - Remove Me', 58345,
       'LOCAL TEST DATA - safe to delete', true, false, ''
WHERE NOT EXISTS (
  SELECT 1 FROM categories WHERE name = 'Local Test Category - Remove Me'
);

INSERT INTO brands (id, name, logo_url, description, is_active)
SELECT gen_random_uuid(), 'Local Test Brand - Remove Me', '',
       'LOCAL TEST DATA - safe to delete', true
WHERE NOT EXISTS (
  SELECT 1 FROM brands WHERE name = 'Local Test Brand - Remove Me'
);

INSERT INTO listings (id, title, price, location, brand, category, description, status)
SELECT gen_random_uuid(), 'Local Test Listing - Remove Me', 1, 'Local Test',
       'Local Test Brand - Remove Me', 'Local Test Category - Remove Me',
       'LOCAL TEST DATA - safe to delete', 'pending'
WHERE NOT EXISTS (
  SELECT 1 FROM listings WHERE title = 'Local Test Listing - Remove Me'
);

SELECT name, description FROM categories WHERE name = 'Local Test Category - Remove Me';
SELECT name, description FROM brands WHERE name = 'Local Test Brand - Remove Me';
SELECT title, brand, category, status FROM listings WHERE title = 'Local Test Listing - Remove Me';
