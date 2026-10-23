import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
const require=createRequire(import.meta.url);
const activation=require('../lib/seller-activation.ts');
const owner='11111111-1111-4111-8111-111111111111';
function load(file){
  let writes=0;
  const module={exports:{}};
  const source=ts.transpileModule(readFileSync(new URL(file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
  new Function('require','exports','module',source)(name=>{
    if(name==='@/lib/features')return {PAID_BADGES_ENABLED:false};
    if(name==='@/lib/dbConn')return {default:{profile:{findUnique:async()=>({shopName:'Shop',shopDescription:'Description',shopAddress:'Address',city:'City',shopImageUrl:'/shop.jpg',cnic:'123',phone:'123',sellerActivationStatus:'pending',sellerPaymentProofPath:'proof.png'}),updateMany:async()=>{writes++;return {count:1};}}}};
    if(name==='@/lib/seller-activation')return activation;
    if(name==='@/lib/auth/supabase/server')return {getCurrentProfile:async()=>({user:{id:owner},profile:{role:'admin'}})};
    return require(name);
  },module.exports,module);
  return {api:module.exports,get writes(){return writes;}};
}
test('badge submission is disabled without accepting payment proofs or writing requests',async()=>{
  const f=load('../app/api/profile/seller-verification/route.ts');
  const response=await f.api.POST({json:async()=>({proofUrl:'/uploads/receipt.png'})});
  assert.equal(response.status,410);assert.equal((await response.json()).success,false);assert.equal(f.writes,0);
});
test('admin cannot approve/reject badge requests while seller approval remains available',async()=>{
  const f=load('../app/api/admin/profiles/[id]/route.ts');
  for(const action of ['approve_verification','reject_verification']){
    const response=await f.api.PATCH({json:async()=>({action})},{params:Promise.resolve({id:owner})});
    assert.equal(response.status,410);assert.equal(f.writes,0);
  }
  const response=await f.api.PATCH({json:async()=>({action:'approve_seller'})},{params:Promise.resolve({id:owner})});
  assert.equal(response.status,200);assert.equal(f.writes,1);
});
