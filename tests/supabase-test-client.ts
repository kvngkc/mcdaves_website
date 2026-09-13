import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Integration-test database boundary.
 * Tests MUST use TEST_SUPABASE_* credentials.
 */
export function getTestSupabaseClient(): SupabaseClient {
  const url = process.env.TEST_SUPABASE_URL?.trim();
  const serviceKey = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceKey) {
    throw new Error(
      'Refusing to run database integration tests: TEST_SUPABASE_URL and TEST_SUPABASE_SERVICE_ROLE_KEY are required.',
    );
  }

  const productionUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (productionUrl && url === productionUrl) {
    throw new Error(
      'Refusing to run database integration tests: TEST_SUPABASE_URL matches NEXT_PUBLIC_SUPABASE_URL. Production is not a test database.',
    );
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Configure the server-side repository to use only the explicitly isolated
 * test project before importing modules that construct the server client.
 */
export function configureRepositoryForTestDatabase(): void {
  const url = process.env.TEST_SUPABASE_URL?.trim();
  const serviceKey = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceKey) {
    throw new Error(
      'Refusing to configure repository tests: TEST_SUPABASE_URL and TEST_SUPABASE_SERVICE_ROLE_KEY are required.',
    );
  }

  const productionUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (productionUrl && url === productionUrl) {
    throw new Error(
      'Refusing to configure repository tests: test database URL matches production URL.',
    );
  }

  process.env.NEXT_PUBLIC_SUPABASE_URL = url;
  process.env.SUPABASE_SERVICE_ROLE_KEY = serviceKey;
}
