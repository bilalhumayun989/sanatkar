import 'dotenv/config';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import pg from 'pg';
import {PrismaClient} from '@prisma/client';
import {PrismaPg} from '@prisma/adapter-pg';
import {deleteAccount,IdentityDeletionError} from '../lib/auth/delete-account.ts';

test('account deletion removes related PostgreSQL records and preserves other accounts', {skip:process.env.RUN_ACCOUNT_DELETION_DB_TESTS!=='1',timeout:45000},async t=>{
  const url=new URL(process.env.DATABASE_URL);assert.ok(['localhost','127.0.0.1','[::1]'].includes(url.hostname),'Disposable local database only');
  const name='sanatkar_deletion_test_'+randomUUID().replaceAll('-','');url.pathname='/postgres';
  const maintenance=new pg.Client({connectionString:url.toString()});let client,prisma,created=false;
  const owner=randomUUID(),peer=randomUUID(),other=randomUUID(),listing=randomUUID(),keptListing=randomUUID(),chat=randomUUID(),keptChat=randomUUID(),message=randomUUID();
  try {
    await maintenance.connect();await maintenance.query('CREATE DATABASE "'+name+'"');created=true;url.pathname='/'+name;
    client=new pg.Client({connectionString:url.toString()});await client.connect();
    for(const entry of readdirSync(new URL('../prisma/migrations/',import.meta.url),{withFileTypes:true}).filter(e=>e.isDirectory()).sort((a,b)=>a.name.localeCompare(b.name)))await client.query(readFileSync(new URL('../prisma/migrations/'+entry.name+'/migration.sql',import.meta.url),'utf8'));
    prisma=new PrismaClient({adapter:new PrismaPg({connectionString:url.toString()})});
    for(const id of [owner,peer,other])await client.query('INSERT INTO profiles(id,email,username) VALUES($1,$2,$3)',[id,id+'@example.invalid',id]);
    for(const [id,seller] of [[listing,owner],[keptListing,peer]])await client.query('INSERT INTO listings(id,title,price,location,seller_id) VALUES($1,\'Listing\',100,\'City\',$2)',[id,seller]);
    for(const [id,buyer,seller,product] of [[chat,peer,owner,listing],[keptChat,other,peer,keptListing]])await client.query('INSERT INTO chats(id,buyer_id,seller_id,listing_id) VALUES($1,$2,$3,$4)',[id,buyer,seller,product]);
    await client.query('INSERT INTO messages(id,chat_id,sender_id,content) VALUES($1,$2,$3,\'Deleted preview\')',[message,chat,owner]);
    await client.query('INSERT INTO messages(chat_id,sender_id,content) VALUES($1,$2,\'Keep message\')',[keptChat,peer]);
    await client.query('INSERT INTO chat_hidden_for(chat_id,user_id) VALUES($1,$2)',[chat,peer]);
    await client.query('INSERT INTO offers(listing_id,buyer_id,seller_id,offer_price) VALUES($1,$2,$3,90)',[keptListing,owner,peer]);
    await client.query('INSERT INTO orders(buyer_id,seller_id,product_id,total_price,shipping_full_name,shipping_phone,shipping_address,shipping_city) VALUES($1,$2,$3,100,\'Private name\',\'Phone\',\'Address\',\'City\')',[peer,owner,listing]);
    await client.query('INSERT INTO favorites(user_id,listing_id) VALUES($1,$2),($3,$4)',[owner,keptListing,peer,listing]);
    await client.query('INSERT INTO listing_views(listing_id,viewer_id) VALUES($1,$2),($3,$4)',[listing,peer,keptListing,owner]);
    await client.query('INSERT INTO listing_shares(listing_id,sharer_id,event_id) VALUES($1,$2,$3)',[keptListing,owner,randomUUID()]);
    await client.query('INSERT INTO badge_requests(user_id) VALUES($1)',[owner]);
    await client.query('INSERT INTO notifications(user_id,title,message) VALUES($1,\'Keep\',\'Private\')',[other]);
    await t.test('remote identity failures roll back local deletion and markers',async()=>{
      await assert.rejects(()=>deleteAccount(prisma,owner,async()=>{throw Error('Unavailable');}),IdentityDeletionError);
      assert.equal((await client.query('SELECT id FROM profiles WHERE id=$1',[owner])).rowCount,1);
      assert.equal((await client.query('SELECT id FROM messages WHERE id=$1',[message])).rowCount,1);
      assert.equal((await client.query('SELECT * FROM deleted_accounts')).rowCount,0);
    });
    await t.test('successful deletion removes every foreign-key dependency and preview',async()=>{
      let removed=0;await deleteAccount(prisma,owner,async()=>{removed++;});assert.equal(removed,1);
      for(const table of ['orders','offers','favorites','listing_views','listing_shares','badge_requests','chat_hidden_for'])assert.equal((await client.query('SELECT * FROM '+table)).rowCount,0,table);
      assert.deepEqual((await client.query('SELECT id FROM profiles ORDER BY id')).rows.map(r=>r.id),[peer,other].sort());
      assert.deepEqual((await client.query('SELECT id FROM listings')).rows,[{id:keptListing}]);
      assert.deepEqual((await client.query('SELECT id FROM chats')).rows,[{id:keptChat}]);
      assert.equal((await client.query('SELECT * FROM messages')).rowCount,1);
      assert.equal((await client.query('SELECT * FROM notifications WHERE message=\'Deleted preview\' OR user_id=$1',[owner])).rowCount,0);
      assert.equal((await client.query('SELECT * FROM notifications WHERE title=\'Keep\'')).rowCount,1);
      assert.deepEqual((await client.query('SELECT user_id FROM deleted_accounts')).rows,[{user_id:owner}]);
    });
    await t.test('the database refuses to recreate a deleted profile',async()=>{
      await assert.rejects(()=>client.query('INSERT INTO profiles(id,email) VALUES($1,\'recreate@example.invalid\')',[owner]),/deleted/);
    });
  } finally {
    await prisma?.$disconnect();await client?.end();
    if(created)await maintenance.query('DROP DATABASE "'+name+'" WITH (FORCE)');await maintenance.end();
  }
});

test('local commit retry does not repeat a completed remote identity deletion',async()=>{
  let transactions=0,removed=0;
  const tx={$queryRaw:async()=>[],$executeRaw:async()=>0};
  for(const name of ['listing','chat','offer'])tx[name]={findMany:async()=>[],deleteMany:async()=>({count:0})};
  for(const name of ['chatHiddenFor','message','order','favorite','listingView','listingShare','badgeRequest','profile'])tx[name]={deleteMany:async()=>({count:0})};
  const db={$transaction:async fn=>{transactions++;await fn(tx);if(transactions===1)throw Error('Transient commit failure');}};
  await deleteAccount(db,'11111111-1111-4111-8111-111111111111',async()=>{removed++;});
  assert.equal(transactions,2);assert.equal(removed,1);
});
