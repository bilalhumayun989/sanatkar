import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
const require=createRequire(import.meta.url);
const cookie=require('../lib/auth/supabase/auth-cookie.ts');
const owner='11111111-1111-4111-8111-111111111111', stranger='22222222-2222-4222-8222-222222222222';
function compile(file, mocks) {
  const source=ts.transpileModule(readFileSync(new URL(file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
  const module={exports:{}};new Function('require','exports','module',source)(name=>name==='@/lib/auth/supabase/auth-cookie'?cookie:mocks[name]??require(name),module.exports,module);return module.exports;
}
function fixture({authenticated=true, passwordValid=true, verifiedId=owner, attempts=1, deletionFails=false}={}) {
  const calls={password:[], deleted:[], sessions:0, transactions:0};
  const auth={
    getCurrentUser:async()=>({user:authenticated?{id:owner,email:'owner@example.invalid'}:null}),
    createClient:()=>({auth:{signInWithPassword:async input=>{
      calls.password.push(input);return {data:{user:passwordValid?{id:verifiedId}:null,session:passwordValid?{access_token:'temporary'}:null},error:passwordValid?null:{message:'wrong'}};
    },signOut:async()=>{calls.sessions++;}}}),
    createAdminClient:()=>({auth:{admin:{deleteUser:async id=>{calls.deleted.push(id);return {error:deletionFails?new Error('unavailable'):null};}}}}),
  };
  class IdentityDeletionError extends Error {}
  const api=compile('../app/api/account/route.ts',{
    '@/lib/dbConn':{default:{$queryRaw:async()=>[{attempts}]}},
    '@/lib/auth/supabase/server':auth,
    '@/lib/auth/delete-account':{IdentityDeletionError,deleteAccount:async(db,id,remove)=>{calls.transactions++;assert.equal(id,owner);await remove();}},
  });
  return {api,calls};
}
const request=(body,origin='http://localhost')=>({headers:new Headers(origin?{origin}:{}),nextUrl:new URL('http://localhost/api/account'),json:async()=>body});
test('account deletion rejects unauthenticated, cross-origin, and invalid requests before verification',async()=>{
  const anon=fixture({authenticated:false});assert.equal((await anon.api.DELETE(request({password:'secret'}))).status,401);
  const f=fixture();for(const body of [null,[],{}, {password:''},{password:123},{password:'x'.repeat(1025)}])assert.equal((await f.api.DELETE(request(body))).status,400);
  assert.equal((await f.api.DELETE(request({password:'secret'},'https://evil.invalid'))).status,403);
  assert.equal(f.calls.password.length,0);assert.equal(f.calls.deleted.length,0);
});
test('incorrect passwords and a password belonging to another identity cannot delete data',async()=>{
  const f=fixture({passwordValid:false});assert.equal((await f.api.DELETE(request({password:'wrong'}))).status,403);assert.equal(f.calls.transactions,0);
  const mismatch=fixture({verifiedId:stranger});assert.equal((await mismatch.api.DELETE(request({password:'valid'}))).status,403);assert.equal(mismatch.calls.transactions,0);assert.equal(mismatch.calls.sessions,1);
});
test('the persisted rate limit stops verification after five attempts',async()=>{
  const f=fixture({attempts:6});const response=await f.api.DELETE(request({password:'secret'}));assert.equal(response.status,429);assert.equal(response.headers.get('Retry-After'),'900');assert.equal(f.calls.password.length,0);
});
test('successful deletion uses session identity only and clears the auth cookie',async()=>{
  const f=fixture();const response=await f.api.DELETE(request({password:'  secret  ',id:stranger,email:'stranger@example.invalid'},null));
  assert.equal(response.status,200);assert.equal((await response.json()).success,true);
  assert.deepEqual(f.calls.password,[{email:'owner@example.invalid',password:'  secret  '}]);assert.deepEqual(f.calls.deleted,[owner]);assert.equal(f.calls.sessions,1);
  assert.match(response.headers.get('set-cookie'),/sb-sanatkar-auth=.*Max-Age=0/i);
});
test('identity service failures do not report success and temporary verification sessions are closed',async()=>{
  const f=fixture({deletionFails:true});const original=console.error;console.error=()=>{};
  try {const response=await f.api.DELETE(request({password:'secret'}));assert.equal(response.status,503);assert.equal((await response.json()).success,false);assert.equal(f.calls.sessions,1);} finally {console.error=original;}
});

test('deleted accounts cannot authenticate with an old token or resync a profile',async()=>{
  const db={$queryRaw:async()=>[{user_id:owner}],$transaction:async fn=>fn({...db,profile:{upsert:async()=>{throw Error('Must not recreate profile');}}})};
  const server=compile('../lib/auth/supabase/server.ts',{
    '@supabase/supabase-js':{createClient:()=>({auth:{getUser:async()=>({data:{user:{id:owner}},error:null})}})},
    '@/lib/dbConn':{default:db}, './ssr':{},
  });
  const oldUrl=process.env.NEXT_PUBLIC_SUPABASE_URL,oldKey=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  process.env.NEXT_PUBLIC_SUPABASE_URL='https://example.supabase.co';process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY='test';
  try {
    assert.equal((await server.getCurrentUser({headers:new Headers({authorization:'Bearer old-token'})})).user,null);
    await assert.rejects(()=>server.syncSupabaseProfile({id:owner,email:'owner@example.invalid'}),/deleted/);
  } finally {if(oldUrl===undefined)delete process.env.NEXT_PUBLIC_SUPABASE_URL;else process.env.NEXT_PUBLIC_SUPABASE_URL=oldUrl;if(oldKey===undefined)delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY=oldKey;}
});

test('seller signup metadata grants only unpaid shop setup, never admin or payment approval',async()=>{
  const writes=[];
  const db={$queryRaw:async()=>[],$transaction:async fn=>fn({...db,profile:{upsert:async input=>{writes.push(input);return input.create;}}})};
  const server=compile('../lib/auth/supabase/server.ts',{'@/lib/dbConn':{default:db},'./ssr':{}});
  await server.syncSupabaseProfile({id:owner,email:'seller@example.invalid',user_metadata:{account_type:'seller',role:'admin',seller_status:'approved',seller_activation_status:'approved'}});
  assert.equal(writes[0].create.role,'seller');assert.equal(writes[0].create.sellerStatus,'shop_required');assert.equal(writes[0].create.sellerActivationStatus,undefined);
  await server.syncSupabaseProfile({id:stranger,email:'other@example.invalid',user_metadata:{account_type:'admin',role:'admin'}});
  assert.equal(writes[1].create.role,'regular');
});

test('profile synchronization cannot overwrite persisted roles or seller approval',async()=>{
  let input;
  const db={$queryRaw:async()=>[],$transaction:async fn=>fn({...db,profile:{upsert:async value=>{input=value;return value.create;}}})};
  const server=compile('../lib/auth/supabase/server.ts',{'@/lib/dbConn':{default:db},'./ssr':{}});
  await server.syncSupabaseProfile({id:owner,email:'seller@example.invalid',email_confirmed_at:'2026-10-22',user_metadata:{account_type:'seller'}});
  assert.deepEqual(input.update,{email:'seller@example.invalid',emailVerified:true});
});
