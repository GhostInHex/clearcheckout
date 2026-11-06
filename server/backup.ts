import Database from 'better-sqlite3';
import {randomBytes,createCipheriv,createDecipheriv,createHash} from 'node:crypto';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync,readdirSync,renameSync,lstatSync,chmodSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {z} from 'zod';
import {safePath,writerLock,validateDatabase} from './operations.js';
const magic=Buffer.from('CCBACK01');
const entry=z.object({name:z.string().regex(/^(database.sqlite|media\/[a-zA-Z0-9_-]+\.(png|jpg|webp))$/),data:z.string(),sha256:z.string().regex(/^[a-f0-9]{64}$/)}).strict();
const manifest=z.object({version:z.literal(1),created:z.string().datetime(),files:z.array(entry).min(1).max(100)}).strict();
function key(file:string):Buffer {
 const location=safePath(file),stat=lstatSync(location);
 if(!stat.isFile()||(stat.mode&0o077)!==0)throw Error('Key must be a private regular file');
 const bytes=readFileSync(location);if(bytes.length!==32)throw Error('Key must contain 32 random bytes');return bytes;
}
const hash=(data:Buffer)=>createHash('sha256').update(data).digest('hex');
function regular(file:string):Buffer {
 if(!lstatSync(file).isFile())throw Error('Regular file required');return readFileSync(file);
}
export async function backup(options:{db:string;media:string;keyFile:string;output:string}):Promise<void>{
 const dbPath=safePath(options.db),media=safePath(options.media),output=safePath(options.output),secret=key(options.keyFile);
 const unlock=writerLock(dbPath);let temporary:string|undefined;
 try{
  temporary=mkdtempSync(join(dirname(output),'.cc-backup-'));chmodSync(temporary,0o700);
  const snapshot=join(temporary,'database.sqlite');
  const db=new Database(dbPath,{readonly:true,fileMustExist:true});
  try{await db.backup(snapshot);}finally{db.close();}
  validateDatabase(snapshot);
  const names=readdirSync(media).sort();
  const files=[{name:'database.sqlite',bytes:regular(snapshot)},...names.map(name=>({name:`media/${name}`,bytes:regular(safePath(join(media,name)))}))].map(({name,bytes})=>({name,data:bytes.toString('base64'),sha256:hash(bytes)}));
  const payload=Buffer.from(JSON.stringify(manifest.parse({version:1,created:new Date().toISOString(),files})));
  if(payload.length>128*1024*1024)throw Error('Snapshot too large');
  const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',secret,iv);cipher.setAAD(magic);
  const encrypted=Buffer.concat([cipher.update(payload),cipher.final()]);
  writeFileSync(output,Buffer.concat([magic,iv,cipher.getAuthTag(),encrypted]),{flag:'wx',mode:0o600});
 }finally{if(temporary)rmSync(temporary,{recursive:true,force:true});unlock();}
}
export function restore(options:{input:string;keyFile:string;destination:string}):void {
 const target=safePath(options.destination),input=safePath(options.input),secret=key(options.keyFile);
 const stat=lstatSync(input);if(!stat.isFile()||stat.size>129*1024*1024)throw Error('Invalid backup size');
 const bytes=readFileSync(input);
 if(bytes.length<37||!bytes.subarray(0,8).equals(magic))throw Error('Unsupported backup');
 const decipher=createDecipheriv('aes-256-gcm',secret,bytes.subarray(8,20));decipher.setAAD(magic);decipher.setAuthTag(bytes.subarray(20,36));
 const payload=Buffer.concat([decipher.update(bytes.subarray(36)),decipher.final()]);
 const parsed:unknown=JSON.parse(payload.toString());const archive=manifest.parse(parsed);
 const names=archive.files.map(file=>file.name);
 if(new Set(names).size!==names.length||names.filter(name=>name==='database.sqlite').length!==1)throw Error('Invalid manifest');
 mkdirSync(target,{mode:0o700});
 let complete=false;
 try{
  const staging=join(target,'.staging');mkdirSync(staging,{mode:0o700});mkdirSync(join(staging,'media'),{mode:0o700});
  for(const file of archive.files){const data=Buffer.from(file.data,'base64');if(hash(data)!==file.sha256)throw Error('File integrity failed');writeFileSync(join(staging,file.name),data,{flag:'wx',mode:0o600});}
  validateDatabase(join(staging,'database.sqlite'));
  renameSync(staging,join(target,'state'));complete=true;
 }finally{if(!complete)rmSync(target,{recursive:true,force:true});}
}
