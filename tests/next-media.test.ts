import {test} from 'node:test';
import assert from 'node:assert/strict';
import {nextFixture} from './next-fixture.js';
import {cookie as sessionCookie} from './node-helpers.js';
import {readFileSync,unlinkSync} from 'node:fs';
import Database from 'better-sqlite3';
test('actual Next media sanitizes transport timeout, HTTP, image and SSE failures without retries',async()=>{
 for(const mode of ['http-failure','timeout','invalid-image','incomplete-sse','malformed-sse']){
  const fixture=await nextFixture(true,{CC_TEST_MEDIA_MODE:mode});
  try{
   const signup=await fetch(fixture.base+'/api/signup',{method:'POST',headers:{'Content-Type':'application/json','X-ClearCheckout':'1'},body:JSON.stringify({email:'media@test.com',password:'correctpassword'})});assert.equal(signup.status,201);
   const headers={'Content-Type':'application/json','X-ClearCheckout':'1',cookie:sessionCookie(signup)};
   const scene=await fetch(fixture.base+'/api/media/scene',{method:'POST',headers});
   if(mode.endsWith('sse')){const db=new Database(fixture.dir+'/db.sqlite');try{db.prepare('UPDATE ai_calls SET created=0').run();}finally{db.close();}}
   const response=mode.endsWith('sse')?(assert.equal(scene.status,200),await fetch(fixture.base+'/api/media/locate',{method:'POST',headers,body:'{"object":"mug"}'})):scene;
   assert.equal(response.status,502);assert.equal(response.headers.get('cache-control'),'no-store');assert.deepEqual(await response.json(),{error:'Meta media request failed. No automatic retry was made.'});
   assert.equal(readFileSync(fixture.dir+'/db.sqlite.provider','utf8').trim().split('\n').length,mode.endsWith('sse')?2:1);
  }finally{await fixture.close();}
 }
});
test('actual Next invalid saved media is rejected then recovers without serving corrupt cache',async()=>{
 const fixture=await nextFixture(true);
 try{
  const signup=await fetch(fixture.base+'/api/signup',{method:'POST',headers:{'Content-Type':'application/json','X-ClearCheckout':'1'},body:JSON.stringify({email:'cache@test.com',password:'correctpassword'})});assert.equal(signup.status,201);
  const headers={'X-ClearCheckout':'1',cookie:sessionCookie(signup)};
  const generate=()=>fetch(fixture.base+'/api/media/scene',{method:'POST',headers});assert.equal((await generate()).status,200);
  unlinkSync(fixture.dir+'/media/scene.png');const db=new Database(fixture.dir+'/db.sqlite');
  try{db.prepare("UPDATE ai_calls SET text='{}', created=0 WHERE status='complete'").run();}finally{db.close();}
  const invalid=await generate();assert.equal(invalid.status,502);assert.equal(invalid.headers.get('cache-control'),'no-store');
  assert.equal((await generate()).status,200);assert.equal((await fetch(fixture.base+'/api/media/scene',{headers})).status,200);
 }finally{await fixture.close();}
});
