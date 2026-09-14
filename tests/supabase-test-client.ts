import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const TEST_PROJECT_REF = 'lwhufocjhcvrbimerhjq';

function requireIsolatedTestConfig() {
  const url = process.env.TEST_SUPABASE_URL?.trim();
  const key = process.env.TEST_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !key) throw new Error('Refusing to run database integration tests: TEST_SUPABASE_URL and TEST_SUPABASE_PUBLISHABLE_KEY are required.');
  if (!url.includes(TEST_PROJECT_REF)) throw new Error('Refusing to run database integration tests: only the isolated mcdaves-test project is permitted.');
  return { url, key };
}

/**
 * Integration-test database boundary.
 * CI uses only the isolated mcdaves-test project. The publishable key is
 * intentionally used here because that project has explicit test-only RLS
 * policies permitting fixture CRUD. Production credentials are forbidden.
 */
export function getTestSupabaseClient(): SupabaseClient {
  const { url, key } = requireIsolatedTestConfig();
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

/** Configure server-side repository imports to use only the isolated test project. */
export function configureRepositoryForTestDatabase(): void {
  const { url, key } = requireIsolatedTestConfig();
  process.env.NEXT_PUBLIC_SUPABASE_URL = url;
  process.env.SUPABASE_SERVICE_ROLE_KEY = key;
}
