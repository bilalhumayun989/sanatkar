// Supabase exports
export { createClient as createBrowserClient } from './supabase/client';
export {
  createClient,
  createServerSupabaseClient,
  createRouteSupabaseClient,
  createAdminClient,
  getCurrentUser,
  getCurrentProfile,
  supabaseSetupError,
} from './supabase/server';
export * from './supabase/ssr';