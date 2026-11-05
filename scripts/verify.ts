import {spawn,execFileSync,type ChildProcess} from 'node:child_process';
import {mkdtempSync,mkdirSync,writeFileSync,createWriteStream,cpSync,existsSync,rmSync,statSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {createServer} from 'node:net';
import {resolve} from 'node:path';

const startedAt=Date.now();
const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const output=resolve(`artifacts/program/P03/${sha}-${Date.now()}`);
mkdirSync(output,{recursive:true});
const scratch=mkdtempSync(`${tmpdir()}/cc-verify-`);
const env={PATH:process.env.PATH,HOME:process.env.HOME,NODE_ENV:'production',NEXT_TELEMETRY_DISABLED:'1',CLEARCHECKOUT_SKIP_ENV_FILE:'1',DB_PATH:`${scratch}/db.sqlite`,COOKIE_SECURE:'false'};
const results:{command:string;code:number|null;signal:NodeJS.Signals|null}[]=[];
const children=new Set<ChildProcess>();
function start(args:string[],name:string,extra:NodeJS.ProcessEnv={}){
 const log=createWriteStream(`${output}/${name}.log`);
 const child=spawn(process.execPath,args,{env:{...env,...extra},stdio:['ignore','pipe','pipe']});
 children.add(child);child.stdout?.pipe(log);child.stderr?.pipe(log,{end:false});
 child.once('close',()=>{children.delete(child);log.end();});return child;
}
async function wait(child:ChildProcess,command:string){
 await new Promise<void>((accept,reject)=>{child.once('error',reject);child.once('close',(code,signal)=>{results.push({command,code,signal});code===0?accept():reject(Error(`${command} failed (${code ?? signal})`));});});
}
async function stop(child:ChildProcess){
 if(child.exitCode!==null || child.signalCode!==null)return;
 await new Promise<void>(accept=>{const timer=setTimeout(()=>child.kill('SIGKILL'),5000);child.once('close',()=>{clearTimeout(timer);accept();});child.kill('SIGTERM');});
}
let passed=false;
try{
 if(existsSync('.env') || existsSync('.env.local') || existsSync('.env.production') || existsSync('.env.production.local'))throw Error('Verification requires a checkout without Next .env files');
 await wait(start(['node_modules/next/dist/bin/next','typegen'],'next-typegen'),'next typegen');
 for(const command of ['typecheck','lint','test','build']){
  const log=createWriteStream(`${output}/${command}.log`);
  const child=spawn('npm',command==='test'?['test']:['run',command],{env,stdio:['ignore','pipe','pipe']});
  children.add(child);child.stdout?.pipe(log);child.stderr?.pipe(log,{end:false});child.once('close',()=>{children.delete(child);log.end();});await wait(child,command);
 }
 const listener=createServer();await new Promise<void>(accept=>listener.listen(0,'127.0.0.1',accept));
 const address=listener.address();if(!address || typeof address==='string')throw Error('No ephemeral port');
 const port=address.port;await new Promise<void>((accept,reject)=>listener.close(error=>error?reject(error):accept()));
 const base=`http://127.0.0.1:${port}`;
 const server=start(['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],'next-production');
 const deadline=Date.now()+60000;
 while(true){
  if(server.exitCode!==null)throw Error('Next exited before readiness');
  try{const response=await fetch(base,{signal:AbortSignal.timeout(1000)});if(response.ok)break;}catch{}
  if(Date.now()>deadline)throw Error('Next readiness timed out');
  await new Promise(accept=>setTimeout(accept,200));
 }
 for(const script of ['browser','dom-browser','extension-browser']){
  const child=start(['node_modules/tsx/dist/cli.mjs',`tests/${script}.ts`],script,{BROWSER_BASE_URL:base});await wait(child,script);
 }
 await stop(server);passed=true;
}finally{
 await Promise.all([...children].map(stop));
 for(const name of ['accessibility-landing.json','accessibility-signup.json','accessibility-onboarding.json','accessibility-dashboard.json','accessibility-preferences.json','accessibility-confirmation.json','accessibility.json','demo-desktop.png','demo-mobile.png']){
  if(existsSync(`artifacts/${name}`) && statSync(`artifacts/${name}`).mtimeMs>=startedAt)cpSync(`artifacts/${name}`,`${output}/${name}`);
 }
 writeFileSync(`${output}/receipt.json`,JSON.stringify({sha,dirty:execFileSync('git',['status','--porcelain'],{encoding:'utf8'}),passed,results,framework:'Next.js production',limitations:['P02 provider fixture and security parity incomplete','No screen-reader or toolbar activeTab manual verification']},null,2));
 rmSync(scratch,{recursive:true,force:true});console.log(output);
}
