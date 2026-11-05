import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {createApp} from '../server/app.js';
const dir=mkdtempSync(tmpdir()+'/cc-regression-');
const {app,db}=createApp({dbPath:dir+'/db.sqlite',aiOptions:{config:{key:'',budgetMicros:0,callLimit:0}}});
const server=app.listen(0,'127.0.0.1');
try {
 await new Promise<void>(resolve=>server.once('listening',resolve));
 const address=server.address();if(!address || typeof address==='string')throw Error('Missing fixture port');
 for(const command of ['test:browser','test:dom','test:extension','test:meta-browser','test:media-browser','test:microphone']){
  console.log(`Running npm run ${command}`);
  await new Promise<void>((resolve,reject)=>{const child=spawn('npm',['run',command],{stdio:'inherit',env:{PATH:process.env.PATH,HOME:process.env.HOME,BROWSER_BASE_URL:`http://127.0.0.1:${address.port}`,CLEARCHECKOUT_SKIP_ENV_FILE:'1'}});child.once('error',reject);child.once('exit',(code,signal)=>code===0?resolve():reject(Error(`${command} failed (${code ?? signal})`)));});
 }
}finally{await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()));db.close();rmSync(dir,{recursive:true,force:true});}
