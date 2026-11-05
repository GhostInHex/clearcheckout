import type Database from 'better-sqlite3';
import {z} from 'zod';

export type Migration = Readonly<{version:number;name:string;sql:string}>;
export const migrations: readonly Migration[] = [
  {version:1,name:'baseline',sql:`CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,password TEXT NOT NULL,preferences TEXT NOT NULL,onboarded INTEGER DEFAULT 0);
    CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id TEXT NOT NULL,expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS orders(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,body TEXT NOT NULL,created INTEGER NOT NULL);
`},
  {version:2,name:'migration-history',sql:`
    CREATE TABLE schema_migrations(version INTEGER PRIMARY KEY,name TEXT NOT NULL,applied_at TEXT NOT NULL);
    INSERT INTO schema_migrations VALUES(1,'baseline',strftime('%Y-%m-%dT%H:%M:%fZ','now'));
    INSERT INTO schema_migrations VALUES(2,'migration-history',strftime('%Y-%m-%dT%H:%M:%fZ','now'));
  `},
  {version:3,name:'payment-attempts',sql:`
    CREATE TABLE payment_attempts(id TEXT PRIMARY KEY,order_id TEXT NOT NULL,user_id TEXT NOT NULL,request_key TEXT NOT NULL UNIQUE,state TEXT NOT NULL,body TEXT NOT NULL);
    CREATE UNIQUE INDEX payment_one_active ON payment_attempts(order_id) WHERE state NOT IN ('failed','cancelled');
    CREATE UNIQUE INDEX payment_provider_identity ON payment_attempts(json_extract(body,'$.state.providerId')) WHERE json_extract(body,'$.state.providerId') IS NOT NULL;
    INSERT INTO schema_migrations VALUES(3,'payment-attempts',strftime('%Y-%m-%dT%H:%M:%fZ','now'));
  `},
];

export function migrate(db:Database.Database,steps:readonly Migration[]=migrations):void {
  steps.forEach((step,index)=>{
    if(step.version!==index+1)throw Error('Migrations must have contiguous versions starting at 1');
  });
  const version=()=>z.number().int().nonnegative().parse(db.pragma('user_version',{simple:true}));
  const check=()=>{if(version()>steps.length)throw Error(`Unsupported database version ${version()}; maximum ${steps.length}`);};
  check();
  db.transaction(()=>{
    check();
    for(const step of steps){
      if(step.version<=version())continue;
      db.exec(step.sql);
      db.pragma(`user_version = ${step.version}`);
    }
  }).immediate();
}
