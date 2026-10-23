import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
const source = ts.transpileModule(readFileSync(new URL('../app/api/notifications/route.ts', import.meta.url),'utf8'),
  {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const owner='11111111-1111-4111-8111-111111111111', stranger='22222222-2222-4222-8222-222222222222';
const mine='33333333-3333-4333-8333-333333333333', foreign='44444444-4444-4444-8444-444444444444';
function fixture(authenticated=true) {
  const rows=[{id:mine,user_id:owner,is_read:false,metadata:{offer_id:mine},created_at:new Date()},
    {id:foreign,user_id:stranger,is_read:false,metadata:{offer_id:foreign},created_at:new Date()}];
  let writes=0; const offers=[];
  const db={
    $transaction:async fn=>fn(db),
    $queryRaw:async (strings,...values)=>{
      const sql=strings.join('?');
      assert.equal(values[0],owner,'Every read and write must bind the authenticated owner');
      if(sql.includes('UPDATE public.notifications')) {
        writes++; const changed=rows.filter(row=>row.user_id===values[0]&&(values[1]||row.id===values[2])&&!row.is_read);
        for(const row of changed)row.is_read=true;return changed.map(row=>({metadata:row.metadata}));
      }
      if(sql.includes('count(*)'))return [{count:rows.filter(row=>row.user_id===owner&&!row.is_read).length}];
      return rows.filter(row=>row.user_id===owner&&(values[1]||!row.is_read)&&(values[2]||row.id===values[3]));
    },
    offer:{updateMany:async input=>{offers.push(input);return {count:1};}},
  };
  const module={exports:{}};
  new Function('require','exports','module',source)(name=>{
    if(name==='@/lib/dbConn')return {default:db};
    if(name==='@/lib/auth/supabase/server')return {getCurrentProfile:async()=>({user:authenticated?{id:owner}:null,profile:authenticated?{role:'regular'}:null})};
    return require(name);
  },module.exports,module);
  return {api:module.exports,rows,offers,get writes(){return writes;}};
}
const req=(body=null,query='format=records')=>({nextUrl:new URL('http://localhost/api/notifications?'+query),json:async()=>body});
test('GET notifications and unread summaries never mark records or offers read',async()=>{
  const f=fixture();const result=await (await f.api.GET(req(null,'format=records&user_id='+stranger))).json();
  assert.equal(result.unread_count,1);assert.deepEqual(result.notifications.map(row=>row.id),[mine]);
  const foreignDetail=await (await f.api.GET(req(null,'format=records&id='+foreign))).json();
  assert.deepEqual(foreignDetail.notifications,[]);
  const summary=await (await f.api.GET(req(null,'summary=true'))).json();assert.equal(summary.unread_count,1);
  assert.equal(f.writes,0);assert.equal(f.offers.length,0);assert.ok(f.rows.every(row=>!row.is_read));
});
test('a user cannot mark another account\'s notification read',async()=>{
  const f=fixture();const result=await(await f.api.PATCH(req({id:foreign,user_id:stranger}))).json();
  assert.equal(result.updated,0);assert.ok(f.rows.every(row=>!row.is_read));assert.equal(f.offers.length,0);
});
test('mark-all and related offer updates stay scoped to the authenticated owner',async()=>{
  const f=fixture();const result=await(await f.api.PATCH(req({all:true,user_id:stranger}))).json();
  assert.equal(result.updated,1);assert.equal(f.rows[0].is_read,true);assert.equal(f.rows[1].is_read,false);
  assert.equal(f.offers[0].where.sellerId,owner);assert.deepEqual(f.offers[0].where.id.in,[mine]);
});
test('anonymous and malformed read requests perform no database writes',async()=>{
  const f=fixture(false);assert.equal((await f.api.GET(req())).status,401);assert.equal((await f.api.PATCH(req({all:true}))).status,401);assert.equal(f.writes,0);
  const authenticated=fixture();assert.equal((await authenticated.api.PATCH(req({id:'invalid'}))).status,400);assert.equal(authenticated.writes,0);
});
