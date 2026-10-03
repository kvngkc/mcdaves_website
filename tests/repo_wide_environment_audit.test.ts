import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Repository-wide configuration audit.
 *
 * This is intentionally broader than a normal unit test. It inspects every
 * Git-tracked text file so environment/configuration drift cannot hide in a
 * file that the existing test suite never imports.
 *
 * The audit is especially strict around Supabase because mixing production
 * and test configuration can make an otherwise green test suite unsafe.
 */

const repoRoot = process.cwd();

function trackedFiles(): string[] {
  const output = execFileSync('git', ['ls-files', '-z'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });

  return output
    .split('\0')
    .map((file) => file.trim())
    .filter(Boolean);
}

function isProbablyText(file: string): boolean {
  const path = join(repoRoot, file);
  try {
    if (!statSync(path).isFile()) return false;
    const sample = readFileSync(path).subarray(0, 4096);
    return !sample.includes(0);
  } catch {
    return false;
  }
}

function readTrackedTextFiles(): Array<{ file: string; content: string }> {
  return trackedFiles()
    .filter(isProbablyText)
    .map((file) => ({ file, content: readFileSync(join(repoRoot, file), 'utf8') }));
}

function projectRef(url: string | undefined): string | null {
  if (!url) return null;
  const match = url.match(/^https?:\/\/([a-z0-9]+)\.supabase\.co\/?$/i);
  return match?.[1]?.toLowerCase() ?? null;
}

describe('repository-wide configuration audit', () => {
  const files = readTrackedTextFiles();

  it('actually inspects every Git-tracked text file and reports configuration references', () => {
    const envRefs = files
      .filter(({ content }) =>
        /NEXT_PUBLIC_SUPABASE_URL|TEST_SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY|dotenv\.config|\.env\.local/.test(content),
      )
      .map(({ file }) => file);

    expect(files.length, 'No tracked files were discovered. The audit itself is broken.').toBeGreaterThan(0);

    // Keep the inventory in CI logs. This is the point of this test: show where
    // configuration can enter the application instead of guessing from one test.
    console.log(`\n[repo-audit] inspected ${files.length} tracked text files`);
    console.log('[repo-audit] configuration-reference files:');
    for (const file of envRefs) console.log(`  - ${file}`);
  });

  it('does not let test files load .env.local implicitly', () => {
    const offenders = files
      .filter(({ file }) => /^(tests|src\/.*__tests__)\//.test(file))
      .filter(({ content }) => /dotenv\.config\s*\(\s*\{[^}]*path\s*:\s*["']\.env\.local["']/.test(content))
      .map(({ file }) => file);

    expect(
      offenders,
      'Test code directly loads .env.local. That makes local production configuration capable of contaminating CI/test execution.',
    ).toEqual([]);
  });

  it('does not hard-code a Supabase production project URL inside tests', () => {
    const offenders = files
      .filter(({ file }) => /^(tests|src\/.*__tests__)\//.test(file))
      .filter(({ content }) => /https?:\/\/[a-z0-9]+\.supabase\.co/i.test(content))
      .map(({ file }) => file);

    expect(offenders).toEqual([]);
  });

  it('does not run Vitest with the production public Supabase URL present', () => {
    const testUrl = process.env.TEST_SUPABASE_URL;
    const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!testUrl) {
      throw new Error('TEST_SUPABASE_URL is missing; the database test environment is not configured.');
    }

    const testRef = projectRef(testUrl);
    const publicRef = projectRef(publicUrl);

    expect(testRef, `TEST_SUPABASE_URL is not a normal Supabase project URL: ${testUrl}`).not.toBeNull();

    if (publicUrl) {
      expect(
        publicRef,
        `NEXT_PUBLIC_SUPABASE_URL is present during Vitest. This is the contamination source to trace. Value/project ref: ${publicRef}`,
      ).not.toBe(testRef);
    }
  });

  it('does not define conflicting Supabase environment-loading mechanisms', () => {
    const dotenvLocalLoaders = files.filter(({ content }) =>
      /dotenv\.config\s*\(\s*\{[^}]*path\s*:\s*["']\.env\.local["']/.test(content),
    );

    const ciFiles = files.filter(({ file }) => /^\.github\/workflows\/.*\.ya?ml$/.test(file));
    const ciSupabaseRefs = ciFiles.filter(({ content }) =>
      /NEXT_PUBLIC_SUPABASE_URL|TEST_SUPABASE_URL|TEST_SUPABASE_SERVICE_ROLE_KEY/.test(content),
    );

    console.log(`\n[repo-audit] .env.local loaders: ${dotenvLocalLoaders.map(({ file }) => file).join(', ') || 'none'}`);
    console.log(`[repo-audit] CI workflow files with Supabase env refs: ${ciSupabaseRefs.map(({ file }) => file).join(', ') || 'none'}`);

    expect(dotenvLocalLoaders.length).toBeLessThanOrEqual(0);
  });
});
