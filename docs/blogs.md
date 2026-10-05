# Sanatkar journal

## Database setup

For a single copy-and-paste setup, run all of `supabase/setup-blogs.sql` in your
Supabase SQL editor. It combines the following migrations without deleting articles.

Apply these files in order in the SQL editor of the Supabase project configured by
`NEXT_PUBLIC_SUPABASE_URL`:

1. `supabase/migrations/20261001_blog_posts.sql`
2. `supabase/migrations/20261005_blog_images.sql`

Alternatively, set `BLOG_DATABASE_URL` to that Supabase project's PostgreSQL connection
and run `node scripts/migrate-blogs.cjs --apply`. The script falls back to
`DATABASE_URL` when `BLOG_DATABASE_URL` is unset. A separate local Prisma database
will not configure the Supabase blog table. Running the script without
`--apply` only checks for the required tables. The existing profiles table is required.

The migration creates the blog table, indexes, update timestamp trigger, and row
level security policies. Visitors can read published articles. Only authenticated
users whose profile role is `admin` can read drafts or create, update, and delete
articles. The second migration creates the public `blog-images` bucket, limits
files to JPEG, PNG, and WebP images up to 5 MB, and restricts uploads and deletion
to administrators. No service role credential is exposed to the editor.

## Writing and publishing

1. Sign in as an administrator and open **Manage Blogs** in `/admin` or `/admin/dashboard`.
2. Choose **New article**. Fill in the title, slug, author, category, short description,
   and content. Optionally upload a cover image (JPEG, PNG, or WebP, up to 5 MB),
   or supply a public HTTPS cover image URL. Wait for the upload before saving.
3. Separate paragraphs with blank lines. Use `## Heading`, `### Subheading`, or
   `- Bullet` lines, with a blank line around each heading or list.
4. Preview the article. Save as **Draft** to keep it private, or select **Published**
   and publish it to `/blogs`. Each article has its own `/blogs/[slug]` page.
5. Use **Edit** to revise or unpublish a post by switching it back to Draft.
   Changing its slug changes its URL. Deletion requires confirmation.

Article text is rendered as React text, not raw HTML. Categories populate the public
filters automatically. Broken or omitted cover images use a branded fallback.
Empty, loading, unavailable, and not-found states are included.

## Validation

Run `node --test tests/blog.test.mjs` on Node 22.18+ or Node 24 for validation tests,
and `npm run build` for production compilation. For an integration check after
database setup, create a draft as an admin, verify an anonymous browser cannot see
its URL, publish it, then verify it appears on the listing and article pages.
Also verify a regular authenticated account cannot insert or modify blog rows.

## Troubleshooting

- `PGRST205` or `42P01` means the blog table is missing in the configured Supabase
  project. Run `supabase/setup-blogs.sql` there; changing the UI or retrying does not
  create the table.
- `ECONNREFUSED` from the migration script means the PostgreSQL connection cannot
  be reached. Set `BLOG_DATABASE_URL` to the Supabase PostgreSQL connection string
  or use the SQL editor. Supabase anon and service-role API keys cannot run DDL.
- Authentication refreshes happen in the browser. Auth events sync an access-token
  cookie for server requests; server clients never store or rotate refresh tokens.
  If an old session was already invalidated, sign out and sign in once.
