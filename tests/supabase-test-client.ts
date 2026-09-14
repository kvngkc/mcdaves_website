import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Integration-test database boundary.
 * CI uses only the isolated mcdaves-test project. The publishable key is
 * intentionally used here because the test project has explicit test-only
 * RLS policies permitting fixture CRUD. Production credentials are forbidden.
 */
export function getTestSupabaseClient(): SupabaseClient {
  const url = process.env.TEST_SUPABASE_URL?.trim();
  const key = process.env.TEST_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !key) {
    throw new Error('Refusing to run database integration tests: TEST_SUPABASE_URL and TEST_SUPABASE_PUBLISHABLE_KEY are required.');
  }

  const productionUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (productionUrl && url === productionUrl) {
    throw new Error('Refusing to run database integration tests: test database URL matches production URL.');
  }

  if (!url.includes('lwhufocjhcvrbimerhjq')) {
    throw new Error('Refusing to run database integration tests: only the isolated mcdaves-test project is permitted.');
  }

  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export function configureRepositoryForTestDatabase(): void {
  const url = process.env.TEST_SUPABASE_URL?.trim();
  const key = process.env.TEST_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !key) throw new Error('Refusing to configure repository tests: TEST_SUPABASE_URL and TEST_SUPABASE_PUBLISHABLE_KEY are required.');
  if (!url.includes('lwhufocjhcvrbimerhjq')) throw new Error('Refusing to configure repository tests: only the isolated mcdaves-test project is permitted.');

  process.env.NEXT_PUBLIC_SUPABASE_URL = url;
  process.env.SUPABASE_SERVICE_ROLE_KEY = key;
}
