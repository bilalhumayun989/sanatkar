import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import * as events from '../lib/realtime/events.ts';
import * as cookie from '../lib/auth/supabase/auth-cookie.ts';
const require = createRequire(import.meta.url);
const source = ts.transpileModule(readFileSync(new URL('../app/api/realtime/route.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;

function fixture({ id = 'buyer', admin = false, valid = true } = {}) {
  let handler, unsubscribed = 0, validations = 0;
  const module = { exports: {} };
  new Function('require', 'exports', 'module', source)(name => {
    if (name === '@/lib/auth/supabase/server') return { getCurrentProfile: async () => {
      validations++; return valid ? { user: { id }, profile: { role: admin ? 'admin' : 'regular' } } : { user: null, profile: null };
    } };
    if (name === '@/lib/realtime/broker') return { realtimeBroker: { subscribe: async callback => {
      handler = callback; return () => { unsubscribed++; };
    } } };
    if (name === '@/lib/realtime/events') return events;
    if (name === '@/lib/auth/supabase/auth-cookie') return cookie;
    return require(name);
  }, module.exports, module);
  return { GET: module.exports.GET, send: event => handler(event), get unsubscribed() { return unsubscribed; }, get validations() { return validations; } };
}
const jwt = exp => 'e30.' + Buffer.from(JSON.stringify({ sub: 'buyer', exp })).toString('base64url') + '.signature';
function request(token) {
  const controller = new AbortController();
  return { headers: new Headers(token ? { Authorization: 'Bearer ' + token } : {}), cookies: { get: () => undefined }, signal: controller.signal };
}
const decode = bytes => JSON.parse(new TextDecoder().decode(bytes).split('data: ')[1]);

test('anonymous SSE filters all private/admin events and strips public draft IDs', async () => {
  const route = fixture(); const response = await route.GET(request()); const reader = response.body.getReader();
  assert.equal(response.status, 200); assert.match(response.headers.get('content-type'), /event-stream/);
  assert.equal(route.validations, 0); assert.equal(decode((await reader.read()).value).topic, 'ready');
  route.send({ topic: 'chats', audience: 'users', users: ['buyer'], record_id: 'private-chat' });
  route.send({ topic: 'admin', audience: 'admins', users: [] });
  route.send({ topic: 'listings', audience: 'public', users: [], record_id: 'private-draft' });
  assert.deepEqual(decode((await reader.read()).value), { topic: 'listings' });
  await reader.cancel(); assert.equal(route.unsubscribed, 1);
});
test('validated bearer streams receive their own notifications but not another user\'s', async () => {
  const route = fixture(); const response = await route.GET(request(jwt(Math.floor(Date.now()/1000)+120)));
  const reader = response.body.getReader(); await reader.read();
  route.send({ topic: 'notifications', audience: 'users', users: ['stranger'], record_id: 'wrong' });
  route.send({ topic: 'notifications', audience: 'users', users: ['buyer'], record_id: 'mine', operation: 'INSERT' });
  assert.deepEqual(decode((await reader.read()).value), { topic: 'notifications', id: 'mine', operation: 'INSERT' });
  await reader.cancel(); assert.equal(route.validations, 1); assert.equal(route.unsubscribed, 1);
});
test('expired or rejected tokens never open a listener', async () => {
  const expired = fixture(); assert.equal((await expired.GET(request(jwt(1)))).status, 401);
  const rejected = fixture({ valid: false }); assert.equal((await rejected.GET(request(jwt(9999999999)))).status, 401);
  assert.equal(expired.unsubscribed, 0); assert.equal(rejected.unsubscribed, 0);
});
test('profile/role changes close admin streams before subsequent events can leak', async () => {
  const route = fixture({ admin: true }); const response = await route.GET(request(jwt(Math.floor(Date.now()/1000)+120)));
  const reader = response.body.getReader(); await reader.read();
  route.send({ topic: 'profile', audience: 'users', users: ['buyer'] });
  assert.equal(decode((await reader.read()).value).topic, 'profile');
  route.send({ topic: 'admin', audience: 'admins', users: [] });
  assert.equal((await reader.read()).done, true); assert.equal(route.unsubscribed, 1);
});
