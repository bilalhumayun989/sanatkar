import test from 'node:test';
import assert from 'node:assert/strict';
import { parseEvent, canReceive, clientEvent } from '../lib/realtime/events.ts';
import { decodeSseFrame } from '../lib/realtime/sse.ts';

test('public streams receive only catalog/listing invalidations', () => {
  for (const topic of ['catalog', 'listings']) {
    assert.equal(canReceive(parseEvent(JSON.stringify({ topic, audience: 'public', users: [] })), null), true);
  }
  for (const topic of ['notifications', 'profile', 'admin', 'chats']) {
    assert.equal(parseEvent(JSON.stringify({ topic, audience: 'public' })), null);
  }
});
test('private events never reach strangers or unrelated admins', () => {
  const event = parseEvent('{"topic":"chats","audience":"users","users":["buyer","seller"]}');
  for (const id of ['buyer', 'seller']) assert.equal(canReceive(event, { id, admin: false }), true);
  for (const principal of [null, { id: 'stranger', admin: false }, { id: 'admin', admin: true }]) assert.equal(canReceive(event, principal), false);
});
test('admin invalidations require an authenticated admin', () => {
  const event = parseEvent('{"topic":"admin","audience":"admins","users":[]}');
  assert.equal(canReceive(event, { id: 'admin', admin: true }), true);
  assert.equal(canReceive(event, { id: 'regular', admin: false }), false);
  assert.equal(canReceive(event, null), false);
});
test('stream payloads strip identities, draft IDs and database contents', () => {
  const event = parseEvent(JSON.stringify({ topic: 'notifications', audience: 'users', users: ['secret-user'],
    record_id: 'notice', operation: 'INSERT', title: 'secret', message: 'private content' }));
  assert.deepEqual(clientEvent(event), { topic: 'notifications', operation: 'INSERT', id: 'notice' });
  assert.equal('id' in clientEvent(parseEvent('{"topic":"listings","audience":"public","record_id":"draft-id"}')), false);
});
test('invalid database events and SSE frames fail closed', () => {
  for (const value of ['', 'null', '[]', 'bad-json', '{"topic":"tokens","audience":"public"}',
    '{"topic":"chats","audience":"admins"}', '{"topic":"admin","audience":"users","users":null}']) assert.equal(parseEvent(value), null);
  assert.deepEqual(decodeSseFrame('data: {"topic":"ready"}'), { topic: 'ready' });
  assert.deepEqual(decodeSseFrame(': heartbeat\ndata: {"topic":\ndata: "chats"}'), { topic: 'chats' });
  assert.equal(decodeSseFrame('data: invalid'), null);
});
