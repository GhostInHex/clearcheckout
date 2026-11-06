import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {randomBytes,createCipheriv,createHash} from 'node:crypto';
import {createService} from '../server/service.js';
import {backup,restore} from '../server/backup.js';
import {writerLock} from '../server/operations.js';
test('encrypted backup restores account session orders media and ledger, refuses corruption and overwrite',async()=>{
 const root=mkdtempSync(join(tmpdir(),'cc-backup-'));
 try{
  const db=join(root,'source.sqlite'),media=join(root,'media'),keyFile=join(root,'key'),output=join(root,'backup');
  mkdirSync(media);writeFileSync(join(media,'scene.png'),'synthetic media');writeFileSync(keyFile,randomBytes(32),{mode:0o600});
  const service=createService({dbPath:db});
  const user=await service.signup({email:'synthetic@example.test',password:'synthetic-password-123'});
  const token=service.issueSession(user.id),authenticated=service.authenticate(token);assert(authenticated);
  service.setPreferences(authenticated,{preferences:{textSize:'large',contrast:true,guidance:'brief'}});
  const order=service.createOrder(authenticated);
  service.db.prepare("INSERT INTO ai_calls(id,user_id,cache_key,created,reserved,status) VALUES('reservation',?,'x',1,50000,'reserved')").run(user.id);
  service.db.prepare('UPDATE ai_safety SET blocked=1').run();service.db.close();
  const release=writerLock(db);await assert.rejects(backup({db,media,keyFile,output}));release();
  await backup({db,media,keyFile,output});
  const destination=join(root,'restore');restore({input:output,keyFile,destination});
  const restored=createService({dbPath:join(destination,'state/database.sqlite')});
  assert(restored.authenticate(token));assert.equal(restored.orders(authenticated)[0]?.id,order.id);
  assert.equal(restored.authenticate(token)?.preferences,JSON.stringify({textSize:'large',contrast:true,guidance:'brief'}));
  assert.deepEqual(restored.db.prepare('SELECT reserved,status FROM ai_calls').get(),{reserved:50000,status:'reserved'});
  assert.deepEqual(restored.db.prepare('SELECT blocked FROM ai_safety').get(),{blocked:1});restored.db.prepare('UPDATE ai_calls SET reserved=75000').run();restored.db.close();
  assert.equal(readFileSync(join(destination,'state/media/scene.png'),'utf8'),'synthetic media');
  assert.throws(()=>restore({input:output,keyFile,destination}));
  const newer=createService({dbPath:join(destination,'state/database.sqlite')});assert.deepEqual(newer.db.prepare('SELECT reserved FROM ai_calls').get(),{reserved:75000});newer.db.close();
  const wrong=join(root,'wrong');writeFileSync(wrong,randomBytes(32),{mode:0o600});assert.throws(()=>restore({input:output,keyFile:wrong,destination:join(root,'wrong-target')}));
  const bytes=readFileSync(output);bytes[bytes.length-1]=(bytes.at(-1)??0)^1;
  const tampered=join(root,'tampered');writeFileSync(tampered,bytes);
  assert.throws(()=>restore({input:tampered,keyFile,destination:join(root,'bad')}));assert(!existsSync(join(root,'bad')));
  writeFileSync(tampered,bytes.subarray(0,50));assert.throws(()=>restore({input:tampered,keyFile,destination:join(root,'short')}));
  await assert.rejects(backup({db,media:join(root,'missing'),keyFile,output:join(root,'absent-media')}));
  const future=createService({dbPath:db});future.db.pragma('user_version = 999');future.db.close();
  await assert.rejects(backup({db,media,keyFile,output:join(root,'future')}));
  await assert.rejects(backup({db,media:join(root,'missing'),keyFile,output:join(root,'missing-backup')}));
 }finally{rmSync(root,{recursive:true,force:true});}
});

test('authenticated invalid snapshots never activate a destination',()=>{
 const root=mkdtempSync(join(tmpdir(),'cc-invalid-backup-'));
 try{
  const keyFile=join(root,'key'),secret=randomBytes(32);writeFileSync(keyFile,secret,{mode:0o600});
  const source=join(root,'source.sqlite'),service=createService({dbPath:source});service.db.close();
  const valid=readFileSync(source);
  const future=createService({dbPath:source});future.db.pragma('user_version = 999');future.db.close();const futureBytes=readFileSync(source);
  for(const {name,data} of [{name:'truncated',data:valid.subarray(0,60)},{name:'missing',data:Buffer.alloc(0)},{name:'future',data:futureBytes}]){
   const output=join(root,name||'invalid'),iv=randomBytes(12),magic=Buffer.from('CCBACK01');
   const cipher=createCipheriv('aes-256-gcm',secret,iv);cipher.setAAD(magic);
   const bytes=data||Buffer.alloc(0);
   const payload=Buffer.from(JSON.stringify({version:1,created:new Date().toISOString(),files:[{name:'database.sqlite',data:bytes.toString('base64'),sha256:createHash('sha256').update(bytes).digest('hex')}]}));
   const encrypted=Buffer.concat([cipher.update(payload),cipher.final()]);writeFileSync(output,Buffer.concat([magic,iv,cipher.getAuthTag(),encrypted]));
   const destination=join(root,(name||'invalid')+'-destination');assert.throws(()=>restore({input:output,keyFile,destination}));assert(!existsSync(destination));
  }
 }finally{rmSync(root,{recursive:true,force:true});}
});
