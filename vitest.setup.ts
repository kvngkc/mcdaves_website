// The integration suites must run ONLY against the isolated test project.
// Loading `.env.local` here would inject production credentials into the test
// process, which the test boundary (tests/supabase-test-client.ts) forbids.
// CI supplies TEST_SUPABASE_* explicitly; local runs must export them too.
