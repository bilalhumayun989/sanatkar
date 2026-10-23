import 'dotenv/config';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { parseEvent, canReceive } from '../lib/realtime/events.ts';
const { Client } = pg;
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

test('PostgreSQL realtime and persistent notifications', { skip: process.env.RUN_REALTIME_DB_TESTS !== '1', timeout: 30000 }, async t => {
  const url = new URL(process.env.DATABASE_URL);
  assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(url.hostname), 'Disposable local database only');
  const name = 'sanatkar_realtime_test_' + randomUUID().replaceAll('-', '');
  url.pathname = '/postgres';
  const maintenance = new Client({ connectionString: url.toString() });
  url.pathname = '/' + name;
  const db = new Client({ connectionString: url.toString() });
  const listener = new Client({ connectionString: url.toString() });
  const events = []; let created = false;
  try {
    await maintenance.connect(); await maintenance.query('CREATE DATABASE "' + name + '"'); created = true;
    await db.connect();
    for (const entry of readdirSync(new URL('../prisma/migrations/', import.meta.url), { withFileTypes: true }).filter(e => e.isDirectory()).sort((a,b) => a.name.localeCompare(b.name))) {
      await db.query(readFileSync(new URL('../prisma/migrations/' + entry.name + '/migration.sql', import.meta.url), 'utf8'));
    }
    await listener.connect(); listener.on('notification', event => { const value = parseEvent(event.payload); if (value) events.push(value); });
    await listener.query('LISTEN sanatkar_events');
    const buyer = randomUUID(), seller = randomUUID(), stranger = randomUUID(), listing = randomUUID(), chat = randomUUID();
    for (const [id, role] of [[buyer, 'regular'], [seller, 'seller'], [stranger, 'regular']]) {
      await db.query('INSERT INTO profiles(id,username,email,role) VALUES($1,$2,$3,$4)', [id, id, id+'@example.invalid', role]);
    }
    await pause(80); events.length = 0;
    await t.test('rollback emits no events; committed listing emits only invalidation metadata', async () => {
      await db.query('BEGIN');
      await db.query('INSERT INTO listings(id,title,price,location,seller_id) VALUES($1,$2,100,$3,$4)', [listing,'private title','secret location',seller]);
      await db.query('ROLLBACK'); await pause(80); assert.equal(events.length,0);
      await db.query('INSERT INTO listings(id,title,price,location,seller_id) VALUES($1,$2,100,$3,$4)', [listing,'private title','secret location',seller]);
      await pause(80); assert.ok(events.some(e => e.topic === 'listings' && canReceive(e,null)));
      assert.ok(!JSON.stringify(events).includes('secret location')); assert.ok(!JSON.stringify(events).includes('private title'));
    });
    await db.query('INSERT INTO chats(id,buyer_id,seller_id,listing_id) VALUES($1,$2,$3,$4)',[chat,buyer,seller,listing]);
    let message;
    await t.test('messages create one recipient notification and unhide conversations', async () => {
      await db.query('INSERT INTO chat_hidden_for(chat_id,user_id) VALUES($1,$2)',[chat,seller]); events.length=0;
      ({ rows:[message] }=await db.query('INSERT INTO messages(chat_id,sender_id,content) VALUES($1,$2,$3) RETURNING id',[chat,buyer,'private message']));
      await pause(80);
      const { rows }=await db.query('SELECT * FROM notifications WHERE source_key=$1',['message:'+message.id]);
      assert.equal(rows.length,1); assert.equal(rows[0].user_id,seller); assert.equal(rows[0].is_read,false); assert.equal(rows[0].metadata.chat_id,chat);
      assert.equal((await db.query('SELECT count(*)::int AS n FROM chat_hidden_for WHERE chat_id=$1',[chat])).rows[0].n,0);
      const privateEvents=events.filter(e=>['chats','notifications'].includes(e.topic)); assert.ok(privateEvents.length);
      assert.ok(privateEvents.every(e=>!canReceive(e,null)&&!canReceive(e,{id:stranger,admin:true})));
      assert.ok(events.some(e=>e.topic==='notifications'&&canReceive(e,{id:seller,admin:false})));
      assert.ok(!JSON.stringify(events).includes('private message'));
    });
    await t.test('read receipts clear notifications and no-op reads do not loop', async () => {
      events.length=0; await db.query('UPDATE messages SET is_read=true WHERE id=$1',[message.id]); await pause(80);
      assert.equal((await db.query('SELECT is_read FROM notifications WHERE source_key=$1',['message:'+message.id])).rows[0].is_read,true);
      assert.ok(events.some(e=>e.topic==='chats'&&canReceive(e,{id:buyer,admin:false})));
      events.length=0; await db.query('UPDATE messages SET is_read=true WHERE id=$1',[message.id]); await pause(80); assert.equal(events.length,0);
    });
    await t.test('offer plus offer-message creates only one notification', async () => {
      await db.query('BEGIN');
      await db.query('INSERT INTO offers(listing_id,buyer_id,seller_id,offer_price) VALUES($1,$2,$3,80)',[listing,buyer,seller]);
      await db.query("INSERT INTO messages(chat_id,sender_id,content,type,offer_amount) VALUES($1,$2,'Offer','offer',80)",[chat,buyer]); await db.query('COMMIT');
      const {rows}=await db.query('SELECT * FROM notifications WHERE user_id=$1 AND is_read=false',[seller]);
      assert.equal(rows.length,1);assert.equal(rows[0].type,'offer');assert.equal(rows[0].metadata.chat_id,chat);
    });
    await t.test('profile role changes notify owner without private profile contents', async () => {
      events.length=0;await db.query("UPDATE profiles SET role='admin',phone='private-phone' WHERE id=$1",[buyer]);await pause(80);
      assert.ok(events.some(e=>e.topic==='profile'&&canReceive(e,{id:buyer,admin:false})));assert.ok(!JSON.stringify(events).includes('private-phone'));
    });
    await t.test('a new listener receives subsequent committed changes', async () => {
      const peer=new Client({connectionString:url.toString()});
      try {await peer.connect();await peer.query('LISTEN sanatkar_events');const received=new Promise(resolve=>peer.once('notification',resolve));
        await db.query("SELECT sanatkar_emit('catalog','public')");
        const e=await Promise.race([received,pause(2000).then(()=>{throw Error('Peer timeout');})]);assert.equal(parseEvent(e.payload).topic,'catalog');
      }finally{await peer.end();}
    });
  } finally {
    await listener.end().catch(()=>{});await db.end().catch(()=>{});
    if(created) await maintenance.query('DROP DATABASE "'+name+'" WITH (FORCE)');await maintenance.end();
  }
});
