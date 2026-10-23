import 'dotenv/config';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {randomUUID} from 'node:crypto';
import pg from 'pg';
import {PrismaClient} from '@prisma/client';
import {PrismaPg} from '@prisma/adapter-pg';
import ts from 'typescript';
import * as activation from '../lib/seller-activation.ts';
const require=createRequire(import.meta.url);

test('seller activation: shop, screenshot, private review, approval, unlimited listings', {skip:process.env.RUN_SELLER_ACTIVATION_DB_TESTS!=='1',timeout:45000},async t=>{
  const url=new URL(process.env.DATABASE_URL);assert.ok(['localhost','127.0.0.1','[::1]'].includes(url.hostname));
  const name='sanatkar_seller_test_'+randomUUID().replaceAll('-','');url.pathname='/postgres';
  const maintenance=new pg.Client({connectionString:url.toString()});let client,db,created=false;
  const owner=randomUUID(),admin=randomUUID(),stranger=randomUUID();let principal=owner;
  const files=new Map();
  function load(file){
    const module={exports:{}};
    const source=ts.transpileModule(readFileSync(new URL(file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
    new Function('require','exports','module',source)(name=>{
      if(name==='@/lib/dbConn')return {default:db};
      if(name==='@/lib/auth/supabase/server')return {getCurrentProfile:async()=>({user:principal?{id:principal}:null,profile:principal?await db.profile.findUnique({where:{id:principal}}):null})};
      if(name==='@/lib/features')return {PAID_BADGES_ENABLED:false};
      if(name==='@/lib/seller-activation')return activation;
      if(name==='@/lib/listings')return {parseImageUrls:()=>[],listingSellerSelect:{id:true},serializeListing:row=>({id:row.id})};
      if(name==='node:fs/promises')return {mkdir:async()=>{},writeFile:async(path,bytes)=>{files.set(path,bytes);},unlink:async path=>{files.delete(path);},readFile:async path=>{if(!files.has(path))throw Error('Missing');return files.get(path);}};
      return require(name);
    },module.exports,module);return module.exports;
  }
  const request=(body={},query='')=>({json:async()=>body,nextUrl:new URL('http://localhost/api/profile/seller-activation'+query)});
  const screenshot=()=>{const form=new FormData();form.set('proof',new File([Buffer.from([137,80,78,71,13,10,26,10,0,0,0,0])],'proof.png',{type:'image/png'}));form.set('amount','1');form.set('status','approved');return {formData:async()=>form};};
  const listing={title:'Machine',brand:'Test',price:100,location:'City',description:'Test listing'};
  try {
    await maintenance.connect();await maintenance.query('CREATE DATABASE "'+name+'"');created=true;url.pathname='/'+name;
    client=new pg.Client({connectionString:url.toString()});await client.connect();
    for(const entry of readdirSync(new URL('../prisma/migrations/',import.meta.url),{withFileTypes:true}).filter(e=>e.isDirectory()).sort((a,b)=>a.name.localeCompare(b.name)))await client.query(readFileSync(new URL('../prisma/migrations/'+entry.name+'/migration.sql',import.meta.url),'utf8'));
    db=new PrismaClient({adapter:new PrismaPg({connectionString:url.toString()})});
    for(const [id,role] of [[owner,'seller'],[admin,'admin'],[stranger,'regular']])await db.profile.create({data:{id,email:id+'@example.invalid',username:id,role}});
    const application=load('../app/api/profile/seller-application/route.ts'),payments=load('../app/api/profile/seller-activation/route.ts'),proof=load('../app/api/profile/seller-activation/proof/route.ts'),review=load('../app/api/admin/profiles/[id]/route.ts'),listings=load('../app/api/listings/route.ts');
    await t.test('seller cannot list or submit payment before creating a complete shop',async()=>{
      const response=await listings.POST(request(listing));assert.equal(response.status,403);assert.equal((await response.json()).code,'SHOP_REQUIRED');
      assert.equal((await payments.POST(screenshot())).status,403);assert.equal(files.size,0);
    });
    await t.test('shop creation requires all details and leads to payment, not listing access',async()=>{
      assert.equal((await application.POST(request({shopName:'Incomplete'}))).status,400);
      const response=await application.POST(request({shopName:'Shop',shopDescription:'Description',shopAddress:'Address',city:'City',shopImageUrl:'/uploads/shop.jpg',cnic:'123',phone:'03001234567'}));
      assert.equal(response.status,200);assert.equal((await response.json()).status,'payment_required');
      const denied=await listings.POST(request(listing));assert.equal(denied.status,403);assert.equal((await denied.json()).code,'SELLER_ACTIVATION_REQUIRED');
    });
    await t.test('a seller cannot approve themselves or submit a fake screenshot',async()=>{
      assert.equal((await review.PATCH(request({action:'approve_seller'}),{params:Promise.resolve({id:owner})})).status,403);
      const form=new FormData();form.set('proof',new File(['<script>bad image</script>'],'fake.png',{type:'image/png'}));
      assert.equal((await payments.POST({formData:async()=>form})).status,400);assert.equal(files.size,0);
    });
    await t.test('pending payment has a fixed Rs 5,000 amount and cannot create listings',async()=>{
      assert.equal((await payments.POST(screenshot())).status,200);
      const state=await(await payments.GET(request())).json();assert.equal(state.status,'pending');assert.equal(state.payment.amount,5000);assert.equal(state.proof_url,'/api/profile/seller-activation/proof');
      assert.equal((await payments.POST(screenshot())).status,409);assert.equal((await listings.POST(request(listing))).status,403);assert.equal(files.size,1);
    });
    await t.test('payment screenshots are visible only to their owner or an admin',async()=>{
      const mine=await proof.GET(request());assert.equal(mine.status,200);assert.match(mine.headers.get('Cache-Control'),/no-store/);
      principal=stranger;assert.equal((await proof.GET(request({},'?userId='+owner))).status,403);
      principal=null;assert.equal((await proof.GET(request({},'?userId='+owner))).status,401);
      principal=admin;assert.equal((await proof.GET(request({},'?userId='+owner))).status,200);
    });
    await t.test('rejected proof can be replaced and still requires admin approval',async()=>{
      assert.equal((await review.PATCH(request({action:'reject_seller'}),{params:Promise.resolve({id:owner})})).status,200);
      principal=owner;assert.equal((await listings.POST(request(listing))).status,403);assert.equal((await payments.POST(screenshot())).status,200);assert.equal(files.size,1);
    });
    await t.test('approval unlocks more than the regular three-listing quota',async()=>{
      principal=admin;assert.equal((await review.PATCH(request({action:'approve_seller'}),{params:Promise.resolve({id:owner})})).status,200);
      principal=owner;for(let index=0;index<4;index++)assert.equal((await listings.POST(request(listing))).status,201);
      assert.equal(await db.listing.count({where:{sellerId:owner}}),4);assert.equal((await db.profile.findUnique({where:{id:owner}})).sellerActivationStatus,'approved');
    });
  } finally {await db?.$disconnect();await client?.end();if(created)await maintenance.query('DROP DATABASE "'+name+'" WITH (FORCE)');await maintenance.end();}
});

test('seller access fails closed for unpaid or incomplete sellers',()=>{
  const profile={role:'seller',sellerStatus:'approved',sellerActivationStatus:'unpaid',shopName:'Shop',shopDescription:'Description',shopAddress:'Address',city:'City',shopImageUrl:'/image.jpg',cnic:'123',phone:'123'};
  assert.equal(activation.sellerListingGate(profile),'SELLER_ACTIVATION_REQUIRED');
  assert.equal(activation.sellerListingGate({...profile,sellerActivationStatus:'approved'}),null);
  assert.equal(activation.sellerListingGate({...profile,sellerActivationStatus:'approved',shopAddress:''}),'SHOP_REQUIRED');
});
