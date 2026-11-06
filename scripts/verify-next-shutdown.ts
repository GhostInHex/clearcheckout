import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import {once} from 'node:events';
import {existsSync,mkdtempSync,rmSync} from 'node:fs';
import {createServer,connect} from 'node:net';
import {tmpdir} from 'node:os';
import path from 'node:path';
import test from 'node:test';

test('Next releases its writer lock on signal shutdown and can restart', {timeout:120000}, async()=>{
 const dir=mkdtempSync(path.join(tmpdir(),'cc-next-shutdown-'));const dbPath=path.join(dir,'test.sqlite');
 try{
  let iteration=0;
  for(const signal of ['SIGTERM','SIGINT','SIGTERM','SIGTERM'] satisfies NodeJS.Signals[]){
   const probe=createServer();probe.listen(0,'127.0.0.1');await once(probe,'listening');const address=probe.address();assert.ok(address&&typeof address!=='string');const port=address.port;await new Promise<void>(resolve=>probe.close(()=>resolve()));
   const child=spawn(process.execPath,['--import','tsx','scripts/next-start.ts'],{env:{PATH:process.env.PATH,HOME:process.env.HOME,NODE_ENV:'production',NEXT_TELEMETRY_DISABLED:'1',HOSTNAME:'127.0.0.1',PORT:String(port),DB_PATH:dbPath},stdio:['ignore','pipe','pipe']});
   let output='';child.stdout.on('data',chunk=>{output+=String(chunk);});child.stderr.on('data',chunk=>{output+=String(chunk);});
   const exited=once(child,'exit');
   try{
    let ready=false;
    for(let n=0;n<200;n++){
     assert.equal(child.exitCode,null,output);
     try{const response=await fetch(`http://127.0.0.1:${port}/`);if(response.ok){ready=true;break;}}catch{}
     await new Promise(resolve=>setTimeout(resolve,50));
    }
    assert.ok(ready,output);assert.ok(existsSync(dbPath+'.writer'));
    if(iteration===0){
     const contender=spawnSync(process.execPath,['--import','tsx','scripts/next-start.ts'],{env:{PATH:process.env.PATH,HOME:process.env.HOME,NODE_ENV:'production',HOSTNAME:'127.0.0.1',PORT:String(port),DB_PATH:dbPath},encoding:'utf8',timeout:10000});
     assert.equal(contender.status,1);assert.match(contender.stderr,/EEXIST/);assert.ok(existsSync(dbPath+'.writer'));
    }
    const socket=iteration++===2?connect(port,'127.0.0.1'):undefined;
    if(socket){await once(socket,'connect');socket.write('GET / HTTP/1.1\r\nHost: localhost\r\n');}
    child.kill(signal);const result=await exited;
    socket?.destroy();
    assert.equal(result[1],null,output);assert.equal(result[0],socket?1:0,output);
    assert.equal(existsSync(dbPath+'.writer'),false,`${signal} exit ${result[0]} left writer lock\n${output}`);
   }finally{
    if(child.exitCode===null&&child.signalCode===null){child.kill('SIGKILL');await exited;}
   }
  }
 }finally{rmSync(dir,{recursive:true,force:true});}
});
