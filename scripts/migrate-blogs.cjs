// Run `node scripts/migrate-blogs.cjs` to inspect, or add --apply to migrate.
const { loadEnvConfig } = require('@next/env');
const { Client } = require('pg');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

loadEnvConfig(process.cwd());

async function main() {
  const connectionString = process.env.BLOG_DATABASE_URL || process.env.DATABASE_URL;
  if (!connectionString) throw new Error('Set BLOG_DATABASE_URL to your Supabase PostgreSQL connection string.');
  const client = new Client({ connectionString, connectionTimeoutMillis: 15000 });
  try {
    await client.connect();
    const { rows: [schema] } = await client.query("SELECT to_regclass('public.profiles') IS NOT NULL AS profiles_exist, to_regclass('public.blog_posts') IS NOT NULL AS blogs_exist");
    console.log(schema);
    if (process.argv.includes('--apply')) {
      if (!schema.profiles_exist) throw new Error('The configured database does not have the Supabase profiles table.');
      await client.query(readFileSync(join(__dirname, '../supabase/migrations/20261001_blog_posts.sql'), 'utf8'));
      await client.query(readFileSync(join(__dirname, '../supabase/migrations/20261005_blog_images.sql'), 'utf8'));
      console.log('Blog and image storage migrations applied successfully.');
    }
  } finally { await client.end(); }
}

main().catch(error => {
  console.error('Blog migration failed:', error.code || error.message);
  process.exitCode = 1;
});
