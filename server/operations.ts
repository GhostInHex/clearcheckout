import Database from 'better-sqlite3';
import {z} from 'zod';
import {migrations} from './migrations/index.js';
import {mkdirSync,rmSync,lstatSync} from 'node:fs';
import {resolve,parse,dirname,join} from 'node:path';
export function safePath(input:string):string {
 const target=resolve(input);let current=parse(target).root;
 for(const part of target.slice(current.length).split('/').filter(Boolean)){
  current=join(current,part);
  try{if(lstatSync(current).isSymbolicLink())throw Error('Symbolic paths refused');}catch(error){if(!(error instanceof Error)||!('code' in error)||error.code!=='ENOENT')throw error;}
 }
 return target;
}
export function writerLock(dbPath:string):()=>void {
 const lock=safePath(dbPath)+'.writer';mkdirSync(dirname(lock),{recursive:true,mode:0o700});
 mkdirSync(lock,{mode:0o700});
 return ()=>rmSync(lock,{recursive:true});
}
export function validateDatabase(file:string):void {
 const db=new Database(file,{readonly:true,fileMustExist:true});
 try {
  if(db.pragma('integrity_check',{simple:true})!=='ok')throw Error('Database integrity failed');
  if(db.pragma('user_version',{simple:true})!==migrations.length)throw Error('Unsupported schema');
  for(const table of ['users','sessions','orders','account_tokens','payment_attempts','ai_calls','ai_safety','schema_migrations'])db.prepare(`SELECT * FROM ${table} LIMIT 0`).all();
  z.object({blocked:z.number().int().min(0).max(1)}).parse(db.prepare('SELECT blocked FROM ai_safety WHERE id=1').get());
  if(db.prepare("SELECT id FROM ai_calls WHERE typeof(reserved)!='integer' OR reserved<0 OR status NOT IN ('reserved','complete','failed') LIMIT 1").get())throw Error('Invalid budget ledger');
 }finally{db.close();}
}
