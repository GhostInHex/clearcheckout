import {test} from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {Worker} from 'node:worker_threads';
import {migrate,migrations} from '../server/migrations/index.js';
import {createService} from '../server/service.js';

const currentVersion=migrations.at(-1)?.version;
assert.ok(currentVersion);

test('fresh installation and populated v1 preserve all durable rows on reopen',async()=>{
 const dir=mkdtempSync(`${tmpdir()}/cc-migration-`);const file=`${dir}/test.sqlite`;
 try {
  const service=createService({dbPath:file});
  const user=await service.signup({email:'synthetic@example.test',password:'synthetic-password'});
  const token=service.issueSession(user.id);
  service.db.prepare("INSERT INTO orders VALUES('synthetic',?, ?,1)").run(user.id,JSON.stringify({history:['synthetic']}));
  service.db.prepare("INSERT INTO ai_calls VALUES('call',?,'cache',1,50000,'reserved',NULL,NULL,NULL)").run(user.id);
  service.db.prepare('UPDATE ai_safety SET blocked=1').run();
  const tables=['users','sessions','orders','ai_calls','ai_safety'];
  const before=tables.map(table=>service.db.prepare(`SELECT * FROM ${table}`).all());
  service.db.exec('DROP TABLE extension_links; DROP TABLE extension_devices; DROP TABLE paypal_requests; DROP TABLE paypal_webhooks; DROP TABLE payment_attempts; DROP TABLE account_tokens; DROP TABLE account_mail_limits; ALTER TABLE users DROP COLUMN email_verified; ALTER TABLE users DROP COLUMN auth_generation; DROP TABLE schema_migrations; PRAGMA user_version=1');
  service.db.close();
  for(let i=0;i<2;i++){
   const reopened=createService({dbPath:file});
   assert.equal(reopened.db.pragma('user_version',{simple:true}),currentVersion);
   assert.deepEqual(tables.map(table=>reopened.db.prepare(`SELECT * FROM ${table}`).all()),before);
   assert.equal(reopened.authenticate(token)?.id,user.id);
   assert.equal((await reopened.login({email:user.email,password:'synthetic-password'})).id,user.id);
   assert.equal(reopened.db.prepare('SELECT * FROM schema_migrations').all().length,migrations.length);
   reopened.db.close();
  }
 }finally{rmSync(dir,{recursive:true,force:true});}
});

test('failed ordered SQL rolls back DDL, rows and version and can retry',async()=>{
 const db=new Database(':memory:');
 try {
  const first={version:1,name:'one',sql:'CREATE TABLE fixture(value TEXT); INSERT INTO fixture VALUES(\'kept\');'};
  migrate(db,[first]);
  assert.throws(()=>migrate(db,[first,{version:2,name:'broken',sql:"INSERT INTO fixture VALUES('rollback'); CREATE TABLE rolled_back(id); SELECT * FROM missing;"}]));
  assert.equal(db.pragma('user_version',{simple:true}),1);
  assert.deepEqual(db.prepare('SELECT * FROM fixture').all(),[{value:'kept'}]);
  assert.equal(db.prepare("SELECT name FROM sqlite_master WHERE name='rolled_back'").get(),undefined);
  migrate(db,[first,{version:2,name:'fixed',sql:"INSERT INTO fixture VALUES('retried');"}]);
  assert.equal(db.prepare('SELECT * FROM fixture').all().length,2);
 }finally{db.close();}
});

test('unsupported future schema is refused without mutations',async()=>{
 const db=new Database(':memory:');
 try{db.exec('PRAGMA user_version=99; CREATE TABLE sentinel(value);');assert.throws(()=>migrate(db),/Unsupported/);assert.equal(db.pragma('user_version',{simple:true}),99);assert.deepEqual(db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all(),[{name:'sentinel'}]);}finally{db.close();}
});

test('concurrent writers recheck version after acquiring immediate lock',async()=>{
 const dir=mkdtempSync(`${tmpdir()}/cc-concurrent-`);const file=`${dir}/test.sqlite`;
 const db=new Database(file);
 try{
  db.exec('BEGIN IMMEDIATE');
  const worker=new Worker(`require('tsx/cjs'); const {parentPort,workerData}=require('node:worker_threads'); const DB=require('better-sqlite3');const {migrate}=require(workerData.module);const db=new DB(workerData.file);parentPort.postMessage('ready');migrate(db);db.close();`,{eval:true,workerData:{file,module:`${process.cwd()}/server/migrations/index.ts`}});
  const done=new Promise<void>((resolve,reject)=>{worker.once('error',reject);worker.once('exit',code=>code===0?resolve():reject(Error(`worker ${code}`)));});
  await new Promise<void>((resolve,reject)=>{worker.once('message',()=>resolve());worker.once('error',reject);});
  db.exec(migrations[0]?.sql || '');db.pragma('user_version=1');db.exec('COMMIT');
  await done;migrate(db);assert.equal(db.pragma('user_version',{simple:true}),currentVersion);
 }finally{if(db.inTransaction)db.exec('ROLLBACK');db.close();rmSync(dir,{recursive:true,force:true});}
});

test('version 2 upgrades to payment schema without altering orders',async()=>{
 const db=new Database(':memory:');
 assert.equal(migrations.find(migration=>migration.version===3)?.version,3);
 try{migrate(db,migrations.slice(0,2));db.prepare('INSERT INTO orders VALUES(?,?,?,?)').run('order','user','synthetic-body',1);migrate(db);migrate(db);assert.equal(db.pragma('user_version',{simple:true}),currentVersion);assert.deepEqual(db.prepare('SELECT * FROM orders').all(),[{id:'order',user_id:'user',body:'synthetic-body',created:1}]);assert.equal(db.prepare('SELECT * FROM payment_attempts').all().length,0);}finally{db.close();}
});
