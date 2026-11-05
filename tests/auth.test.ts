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
 const first=mail.messages[0];assert.ok(first);const token=new URL(first.url).hash.slice(1);assert.equal(JSON.stringify(service.db.prepare('SELECT * FROM account_tokens').all()).includes(token),false);
 assert.throws(()=>auth.verify({token}),/invalid or expired/);
 await assert.rejects(auth.request('reset',{email:user.email}),/wait/);
 time+=60001;await auth.request('reset',{email:user.email});await assert.rejects(auth.reset({token,password:'replacement-password'}),/invalid or expired/);
 const second=mail.messages[1];assert.ok(second);const token2=new URL(second.url).hash.slice(1);await auth.reset({token:token2,password:'replacement-password'});assert.equal(service.authenticate(oldSession),undefined);await assert.rejects(auth.reset({token:token2,password:'replacement-password'}),/invalid or expired/);
 time+=60001;await auth.request('reset',{email:user.email});const third=mail.messages[2];assert.ok(third);time+=30*60000;await assert.rejects(auth.reset({token:new URL(third.url).hash.slice(1),password:'replacement-password'}),/invalid or expired/);
 const fresh=service.authenticate(service.issueSession(user.id));assert.ok(fresh);const other=service.issueSession(user.id);const keep=service.issueSession(user.id);auth.revoke(fresh,keep,{scope:'other'});assert.equal(service.authenticate(other),undefined);assert.ok(service.authenticate(keep));
 assert.equal(JSON.stringify(auth.exportAccount(fresh)).includes('password'),false);
 await assert.rejects(auth.deleteAccount(fresh,{password:'replacement-password',confirmation:'delete'}));assert.ok(service.authenticate(keep));
 service.db.prepare("INSERT INTO ai_calls VALUES('retained',?,'cache',1,50000,'reserved',NULL,NULL,NULL)").run(user.id);service.db.prepare('UPDATE ai_safety SET blocked=1').run();
 const reservations=service.db.prepare('SELECT * FROM ai_calls').all();const safety=service.db.prepare('SELECT * FROM ai_safety').all();
 const tables=service.db.prepare("SELECT name FROM sqlite_master WHERE name LIKE 'ai_%'").all();await auth.deleteAccount(fresh,{password:'replacement-password',confirmation:'DELETE MY ACCOUNT'});assert.equal(service.authenticate(keep),undefined);assert.deepEqual(service.db.prepare('SELECT * FROM ai_calls').all(),reservations);assert.deepEqual(service.db.prepare('SELECT * FROM ai_safety').all(),safety);assert.deepEqual(service.db.prepare("SELECT name FROM sqlite_master WHERE name LIKE 'ai_%'").all(),tables);
 }finally{service.db.close();}
});

test('verification, mail failure and password change never grant a session',async()=>{
 const service=createService({dbPath:':memory:'});const mail=localInbox();const auth=createAuth(service.db,{mail,origin:'https://shop.example.test'});
 try{const account=await service.signup({email:'verify@example.test',password:'original-password'});const token=service.issueSession(account.id);const user=service.authenticate(token);assert.ok(user);
 await auth.request('verify',{},user);const message=mail.messages[0];assert.ok(message);const verification=new URL(message.url).hash.slice(1);auth.verify({token:verification});assert.throws(()=>auth.verify({token:verification}),/invalid or expired/);
 await assert.rejects(auth.changePassword(user,{currentPassword:'wrong-password',password:'changed-password'}),/incorrect/);assert.ok(service.authenticate(token));await auth.changePassword(user,{currentPassword:'original-password',password:'changed-password'});assert.equal(service.authenticate(token),undefined);await assert.rejects(service.login({email:user.email,password:'original-password'}));assert.equal((await service.login({email:user.email,password:'changed-password'})).id,user.id);
 const other=await service.signup({email:'other@example.test',password:'original-password'});assert.equal(JSON.stringify(auth.exportAccount(user)).includes(other.email),false);
 await assert.rejects(createAuth(service.db).request('reset',{email:user.email}),/unavailable/);
 const outage=createAuth(service.db,{origin:'https://shop.example.test',mail:{available:true,async send(){throw Error('synthetic outage');}}});const a=await outage.request('reset',{email:'other@example.test'});const b=await outage.request('reset',{email:'unknown@example.test'});assert.deepEqual(a,b);assert.equal(service.db.prepare("SELECT * FROM account_tokens WHERE purpose='reset'").all().length,0);
 }finally{service.db.close();}
});
