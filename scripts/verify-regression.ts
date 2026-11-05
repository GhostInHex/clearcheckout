import {spawn} from 'node:child_process';
import {nextFixture} from '../tests/next-fixture.js';
const fixture=await nextFixture();
try {
 for(const command of ['test:browser','test:dom','test:extension','test:meta-browser','test:media-browser','test:microphone']){
  console.log(`Running npm run ${command}`);
  await new Promise<void>((resolve,reject)=>{const child=spawn('npm',['run',command],{stdio:'inherit',env:{PATH:process.env.PATH,HOME:process.env.HOME,BROWSER_BASE_URL:fixture.base,CLEARCHECKOUT_SKIP_ENV_FILE:'1'}});child.once('error',reject);child.once('exit',(code,signal)=>code===0?resolve():reject(Error(`${command} failed (${code ?? signal})`)));});
 }
}finally{await fixture.close();}
