// Run `node scripts/migrate-blogs.cjs` to inspect, or add --apply to migrate.
const { loadEnvConfig } = require('@next/env');
const { Client } = require('pg');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

loadEnvConfig(process.cwd());

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured.');
  const client = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 15000 });
  try {
    await client.connect();
    const { rows: [schema] } = await client.query("SELECT to_regclass('public.profiles') IS NOT NULL AS profiles_exist, to_regclass('public.blog_posts') IS NOT NULL AS blogs_exist");
    console.log(schema);
    if (process.argv.includes('--apply')) {
      if (!schema.profiles_exist) throw new Error('The configured database does not have the Supabase profiles table.');
      await client.query(readFileSync(join(__dirname, '../supabase/migrations/20261001_blog_posts.sql'), 'utf8'));
      console.log('Blog migration applied successfully.');
    }
  } finally { await client.end(); }
}

main().catch(error => {
  console.error('Blog migration failed:', error.code || error.message);
  process.exitCode = 1;
});
