import assert from 'node:assert/strict';
import {mkdirSync,mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {randomBytes} from 'node:crypto';
import {nextFixture} from '../tests/next-fixture.js';
import {createService} from '../server/service.js';
import {backup,restore} from '../server/backup.js';
mkdirSync('artifacts/program/P06',{recursive:true});
const root=mkdtempSync(resolve('artifacts/program/P06/drill-'));
const db=join(root,'database.sqlite'),media=join(root,'media'),keyFile=join(root,'key'),output=join(root,'backup');
mkdirSync(media);writeFileSync(keyFile,randomBytes(32),{mode:0o600});writeFileSync(join(media,'scene.png'),'synthetic-media');
let cookie='';let orderId='';
async function call(base:string,path:string,method='GET',body?:unknown){
 const response=await fetch(base+path,{method,headers:{Cookie:cookie,'Content-Type':'application/json','X-ClearCheckout':'1'},...(body===undefined?{}:{body:JSON.stringify(body)})});
 assert(response.ok,`HTTP ${response.status}`);const session=response.headers.get('set-cookie');if(session)cookie=session.split(';')[0]||'';
 const data:unknown=await response.json();return data;
}
try{
 const first=await nextFixture(false,{DB_PATH:db});
 try{
  assert.equal((await fetch(first.base+'/readyz')).status,200);
  await call(first.base,'/api/signup','POST',{email:'restore@example.test',password:'synthetic-password-123'});
  await call(first.base,'/api/preferences','PUT',{preferences:{textSize:'large',contrast:true,guidance:'detailed'}});
  const order=await call(first.base,'/api/orders','POST');
  const {z}=await import('zod');orderId=z.object({id:z.string()}).parse(order).id;
  await assert.rejects(backup({db,media,keyFile,output}));
 }finally{await first.close();}
 const service=createService({dbPath:db});
 service.db.prepare("INSERT INTO ai_calls(id,user_id,cache_key,created,reserved,status) VALUES('drill','synthetic','x',1,50000,'reserved')").run();service.db.prepare('UPDATE ai_safety SET blocked=1').run();service.db.close();
 const restart=await nextFixture(false,{DB_PATH:db});
 try{await call(restart.base,'/api/me');await call(restart.base,`/api/orders/${orderId}`,'POST',{type:'review'});}finally{await restart.close();}
 await backup({db,media,keyFile,output});
 const destination=join(root,'fresh');restore({input:output,keyFile,destination});
 const restoredDb=join(destination,'state/database.sqlite');
 const fresh=await nextFixture(false,{DB_PATH:restoredDb});
 try{
  assert.equal((await fetch(fresh.base+'/readyz')).status,200);
  const me=await call(fresh.base,'/api/me');assert(JSON.stringify(me).includes('large'));
  assert(JSON.stringify(await call(fresh.base,'/api/orders')).includes(orderId));
  assert.equal(await (await fetch(fresh.base+'/api/media/scene',{headers:{Cookie:cookie}})).text(),'synthetic-media');
 }finally{await fresh.close();}
 const checked=createService({dbPath:restoredDb});
 assert.deepEqual(checked.db.prepare('SELECT reserved,status FROM ai_calls').get(),{reserved:50000,status:'reserved'});assert.deepEqual(checked.db.prepare('SELECT blocked FROM ai_safety').get(),{blocked:1});checked.db.close();
 assert.equal(readFileSync(join(destination,'state/media/scene.png'),'utf8'),'synthetic-media');
 process.stdout.write('PASS actual Next restart and fresh restore retain session/preferences/order/media/reservations/safety; active writer backup refused.\n');
}finally{rmSync(root,{recursive:true,force:true});}
