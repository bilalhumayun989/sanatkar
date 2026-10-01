# Sanatkar journal

## Database setup

Apply `supabase/migrations/20261001_blog_posts.sql` in your Supabase SQL editor.
Alternatively, set `DATABASE_URL` to that Supabase project's PostgreSQL connection
and run `node scripts/migrate-blogs.cjs --apply`. Running the script without
`--apply` only checks for the required tables. The existing profiles table is required.

The migration creates the blog table, indexes, update timestamp trigger, and row
level security policies. Visitors can read published articles. Only authenticated
users whose profile role is `admin` can read drafts or create, update, and delete
articles. No service role credential is exposed to the editor.

## Writing and publishing

1. Sign in as an administrator and open **Manage Blogs** in `/admin` or `/admin/dashboard`.
2. Choose **New article**. Fill in the title, slug, author, category, short description,
   and content. Optionally supply a public HTTPS cover image URL.
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
