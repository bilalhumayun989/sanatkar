import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import * as cookie from '../lib/auth/supabase/auth-cookie.ts';

const require = createRequire(import.meta.url);
const source = readFileSync(new URL('../lib/auth/supabase/ssr.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const compiledModule = { exports: {} };
new Function('require', 'exports', 'module', compiled)(name => name === './auth-cookie' ? cookie : require(name), compiledModule.exports, compiledModule);
const { createServerClient } = compiledModule.exports;

function client(value, changes = []) {
  return createServerClient('https://example.supabase.co', 'test-anon-key', {
    cookies: { getAll: () => [{ name: cookie.AUTH_COOKIE_NAME, value }], setAll: items => changes.push(...items) },
  });
}

test('server cookies omit refresh tokens and user metadata, including legacy session fields', () => {
  const serialized = cookie.authCookieValue({ access_token: 'access', refresh_token: 'secret', expires_at: 123, user: { id: 'user' } });
  assert.deepEqual(JSON.parse(serialized), { access_token: 'access', expires_at: 123 });
  assert.equal(cookie.readAuthAccessToken(serialized), 'access');
  for (const value of [undefined, '', 'bad-json', 'null', '{}', '{"access_token":123}', '{"access_token":""}']) {
    assert.equal(cookie.readAuthAccessToken(value), null);
  }
});

test('concurrent server requests validate stale-cookie access tokens without rotating refresh tokens', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    calls.push({ url, headers: new Headers(init?.headers) });
    assert.ok(!url.includes('/token'), 'Server must never refresh a session');
    if (url.includes('/auth/v1/user')) return new Response(JSON.stringify({ id: 'user', email: 'user@example.com' }), { status: 200 });
    return new Response('[]', { status: 200 });
  };
  try {
    const oldCookie = JSON.stringify({ access_token: 'expired-access', refresh_token: 'already-used', expires_at: 1 });
    const first = client(oldCookie);
    const second = client(oldCookie);
    const results = await Promise.all([first.auth.getUser(), second.auth.getUser()]);
    assert.ok(results.every(result => !result.error));
    assert.equal(calls.length, 2);
    assert.ok(calls.every(call => call.headers.get('authorization') === 'Bearer expired-access'));
  } finally { globalThis.fetch = originalFetch; }
});

test('expired access tokens fail validation without a refresh request', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async input => {
    calls.push(String(input));
    return new Response(JSON.stringify({ message: 'JWT expired', code: 'bad_jwt' }), { status: 401 });
  };
  try {
    const { data, error } = await client(JSON.stringify({ access_token: 'expired', refresh_token: 'used', expires_at: 1 })).auth.getUser();
    assert.equal(data.user, null);
    assert.ok(error);
    assert.equal(calls.length, 1);
    assert.ok(calls[0].endsWith('/auth/v1/user'));
  } finally { globalThis.fetch = originalFetch; }
});
