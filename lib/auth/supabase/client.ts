'use client';

import { createBrowserClient } from './ssr';

let supabase: ReturnType<typeof createBrowserClient> | undefined;

function getClient() {
  if (supabase) return supabase;
  
  supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  return supabase;
}

// Client components also render during static generation. Resolve the browser
// client only when an effect or event handler accesses auth, queries, or storage.
const lazyClient = new Proxy({} as ReturnType<typeof createBrowserClient>, {
  get(_target, property) {
    const client = getClient();
    const value = Reflect.get(client, property, client);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

export function createClient() {
  return lazyClient;
}
