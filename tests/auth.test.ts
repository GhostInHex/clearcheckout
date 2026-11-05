import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createService} from '../server/service.js';
import {createAuth,localInbox} from '../server/auth.js';
test('recovery tokens are hashed, purpose-bound, expiring and single-use; deletion preserves global evidence',async()=>{
 const service=createService({dbPath:':memory:'});let time=1000;const mail=localInbox();const auth=createAuth(service.db,{mail,origin:'https://shop.example.test',now:()=>time});
 try{
 const account=await service.signup({email:'owner@example.test',password:'original-password'});const user=service.authenticate(service.issueSession(account.id));assert.ok(user);
 const oldSession=service.issueSession(user.id);
 const generic=await auth.request('reset',{email:user.email});const absent=await auth.request('reset',{email:'absent@example.test'});assert.deepEqual(generic,absent);
 await auth.deliveryIdle();const first=mail.messages[0];assert.ok(first);const token=new URL(first.url).hash.slice(1);assert.equal(JSON.stringify(service.db.prepare('SELECT * FROM account_tokens').all()).includes(token),false);
 assert.throws(()=>auth.verify({token}),/invalid or expired/);
 await assert.rejects(auth.request('reset',{email:user.email}),/wait/);
 time+=60001;await auth.request('reset',{email:user.email});await assert.rejects(auth.reset({token,password:'replacement-password'}),/invalid or expired/);
 await auth.deliveryIdle();const second=mail.messages[1];assert.ok(second);const token2=new URL(second.url).hash.slice(1);await auth.reset({token:token2,password:'replacement-password'});assert.equal(service.authenticate(oldSession),undefined);await assert.rejects(auth.reset({token:token2,password:'replacement-password'}),/invalid or expired/);
 time+=60001;await auth.request('reset',{email:user.email});await auth.deliveryIdle();const third=mail.messages[2];assert.ok(third);time+=30*60000;await assert.rejects(auth.reset({token:new URL(third.url).hash.slice(1),password:'replacement-password'}),/invalid or expired/);
 const fresh=service.authenticate(service.issueSession(user.id));assert.ok(fresh);const other=service.issueSession(user.id);const keep=service.issueSession(user.id);auth.revoke(fresh,keep,{scope:'other'});assert.equal(service.authenticate(other),undefined);assert.ok(service.authenticate(keep));
 assert.equal(JSON.stringify(auth.exportAccount(fresh)).includes('password'),false);
 await assert.rejects(auth.deleteAccount(fresh,{password:'replacement-password',confirmation:'delete'}));assert.ok(service.authenticate(keep));
 service.db.prepare("INSERT INTO ai_calls VALUES('retained',?,'cache',1,50000,'reserved',NULL,NULL,NULL)").run(user.id);service.db.prepare('UPDATE ai_safety SET blocked=1').run();
 service.db.prepare('INSERT INTO payment_attempts VALUES(?,?,?,?,?,?)').run('retained-attempt','retained-order',user.id,'retained-key','unknown',JSON.stringify({state:{providerId:'synthetic-provider'},snapshot:{userId:user.id}}));
 const payments=service.db.prepare('SELECT * FROM payment_attempts').all();
 const reservations=service.db.prepare('SELECT * FROM ai_calls').all();const safety=service.db.prepare('SELECT * FROM ai_safety').all();
 const tables=service.db.prepare("SELECT name FROM sqlite_master WHERE name LIKE 'ai_%'").all();await auth.deleteAccount(fresh,{password:'replacement-password',confirmation:'DELETE MY ACCOUNT'});assert.equal(service.authenticate(keep),undefined);assert.deepEqual(service.db.prepare('SELECT * FROM payment_attempts').all(),payments);assert.deepEqual(service.db.prepare('SELECT * FROM ai_calls').all(),reservations);assert.deepEqual(service.db.prepare('SELECT * FROM ai_safety').all(),safety);assert.deepEqual(service.db.prepare("SELECT name FROM sqlite_master WHERE name LIKE 'ai_%'").all(),tables);
 }finally{service.db.close();}
});

test('verification, mail failure and password change never grant a session',async()=>{
 const service=createService({dbPath:':memory:'});const mail=localInbox();const auth=createAuth(service.db,{mail,origin:'https://shop.example.test'});
 try{const account=await service.signup({email:'verify@example.test',password:'original-password'});const token=service.issueSession(account.id);const user=service.authenticate(token);assert.ok(user);
 await auth.request('verify',{},user);await auth.deliveryIdle();const message=mail.messages[0];assert.ok(message);const verification=new URL(message.url).hash.slice(1);auth.verify({token:verification});assert.throws(()=>auth.verify({token:verification}),/invalid or expired/);
 await assert.rejects(auth.changePassword(user,{currentPassword:'wrong-password',password:'changed-password'}),/incorrect/);assert.ok(service.authenticate(token));await auth.changePassword(user,{currentPassword:'original-password',password:'changed-password'});assert.equal(service.authenticate(token),undefined);await assert.rejects(service.login({email:user.email,password:'original-password'}));assert.equal((await service.login({email:user.email,password:'changed-password'})).id,user.id);
 const other=await service.signup({email:'other@example.test',password:'original-password'});assert.equal(JSON.stringify(auth.exportAccount(user)).includes(other.email),false);
 await assert.rejects(createAuth(service.db).request('reset',{email:user.email}),/unavailable/);
 const outage=createAuth(service.db,{origin:'https://shop.example.test',mail:{available:true,async send(){throw Error('synthetic outage');}}});const a=await outage.request('reset',{email:'other@example.test'});const b=await outage.request('reset',{email:'unknown@example.test'});assert.deepEqual(a,b);await outage.deliveryIdle();assert.equal(service.db.prepare("SELECT * FROM account_tokens WHERE purpose='reset'").all().length,0);
 }finally{service.db.close();}
});

test('mail response does not wait for account lookup or transport; hung transport halts bounded queue',async()=>{
 const service=createService({dbPath:':memory:'});let called=0;
 const auth=createAuth(service.db,{origin:'https://shop.example.test',mail:{available:true,send:()=>{called++;return new Promise<void>(()=>{});}}});
 try{
 await service.signup({email:'queued@example.test',password:'original-password'});
 const known=await auth.request('reset',{email:'queued@example.test'});
 const unknown=await auth.request('reset',{email:'unknown@example.test'});
 assert.deepEqual(known,unknown);assert.equal(called,0);
 for(let i=0;i<14;i++)await auth.request('reset',{email:`queue${i}@example.test`});
 await assert.rejects(auth.request('reset',{email:'overflow@example.test'}),/unavailable/);
 await auth.deliveryIdle();assert.equal(called,1);assert.equal(auth.available,false);
 assert.equal(service.db.prepare('SELECT * FROM account_tokens').all().length,0);
 }finally{service.db.close();}
});

test('concurrent reset consumption has one winner; revocation defeats in-flight login; password queue rejects excess',async()=>{
 const service=createService({dbPath:':memory:'});const inbox=localInbox();const auth=createAuth(service.db,{mail:inbox,origin:'https://shop.example.test'});
 try{
 const account=await service.signup({email:'race@example.test',password:'original-password'});const session=service.issueSession(account.id);const user=service.authenticate(session);assert.ok(user);
 await auth.request('reset',{email:user.email});await auth.deliveryIdle();const message=inbox.messages[0];assert.ok(message);const token=new URL(message.url).hash.slice(1);
 const resets=await Promise.allSettled([auth.reset({token,password:'replacement-password'}),auth.reset({token,password:'replacement-password'})]);assert.equal(resets.filter(r=>r.status==='fulfilled').length,1);
 const login=service.login({email:user.email,password:'replacement-password'});auth.revoke(user,session,{scope:'all'});await assert.rejects(login,/incorrect/);
 const results=await Promise.allSettled(Array.from({length:30},()=>service.login({email:user.email,password:'replacement-password'})));assert.ok(results.some(r=>r.status==='rejected'&&r.reason instanceof Error&&r.reason.message.includes('busy')));
 const expired=service.issueSession(user.id);service.db.prepare('UPDATE sessions SET expires=0').run();assert.equal(service.authenticate(expired),undefined);
 }finally{service.db.close();}
});

test('two database connections cannot consume the same reset token',async()=>{
 const {mkdtempSync,rmSync}=await import('node:fs');const {tmpdir}=await import('node:os');
 const dir=mkdtempSync(`${tmpdir()}/cc-token-race-`);const a=createService({dbPath:`${dir}/db.sqlite`});const b=createService({dbPath:`${dir}/db.sqlite`});const inbox=localInbox();const auth=createAuth(a.db,{mail:inbox,origin:'https://shop.example.test'});
 try{
 await a.signup({email:'connections@example.test',password:'original-password'});await auth.request('reset',{email:'connections@example.test'});await auth.deliveryIdle();const message=inbox.messages[0];assert.ok(message);const token=new URL(message.url).hash.slice(1);
 const results=await Promise.allSettled([auth.reset({token,password:'replacement-password'}),b.auth.reset({token,password:'replacement-password'})]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(a.db.prepare('SELECT * FROM account_tokens').all().length,0);
 }finally{a.db.close();b.db.close();rmSync(dir,{recursive:true,force:true});}
});
