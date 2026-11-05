import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {createServer} from 'node:net';
export async function nextFixture(provider=false,environment:Record<string,string>={},dev=false){
 const dir=mkdtempSync(tmpdir()+'/cc-next-browser-');
 const probe=createServer();probe.listen(0,'127.0.0.1');await once(probe,'listening');const address=probe.address();if(!address||typeof address==='string')throw Error('Missing port');
 await new Promise<void>(resolve=>probe.close(()=>resolve()));
 const base=`http://127.0.0.1:${address.port}`;
 const child=spawn(process.execPath,['--import','tsx',...(provider?['--import','./tests/next-browser-provider.ts']:[]),'scripts/next-start.ts',...(dev?['--dev']:[])],{env:{PATH:process.env.PATH,HOME:process.env.HOME,NODE_ENV:dev?'development':provider?'test':'production',HOSTNAME:'127.0.0.1',PORT:String(address.port),DB_PATH:dir+'/db.sqlite',MODEL_API_KEY:provider?'isolated-fake-key':'',COOKIE_SECURE:'false',...environment},stdio:'inherit'});
 async function close(){if(child.exitCode===null&&child.signalCode===null){child.kill('SIGTERM');await once(child,'exit');}rmSync(dir,{recursive:true,force:true});}
 try{for(let n=0;n<300;n++){if(child.exitCode!==null)throw Error('Next fixture exited');try{const response=await fetch(base);if(response.ok)return {base,dir,close};}catch{}await new Promise(resolve=>setTimeout(resolve,100));}throw Error('Next readiness timeout');}catch(error){await close();throw error;}
}
