import {appendFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
if(process.env.NODE_ENV!=='test'||!process.env.DB_PATH?.startsWith(path.join(tmpdir(),'cc-next-security-'))||process.env.MODEL_API_KEY!=='isolated-fake-key')throw new Error('Provider fixture requires an isolated test process');
const log=process.env.DB_PATH+'.provider';
let explanations=0;
globalThis.fetch=async(input,options)=>{
 const url=String(input);
 if(!url.startsWith('https://api.meta.ai/v1/'))throw new Error('Test process forbids network fetch');
 appendFileSync(log,url+'\n');
 if(url.includes('images/generations'))return Response.json({data:[{b64_json:'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aSXsAAAAASUVORK5CYII='}]});
 if(url.includes('asr/transcribe'))return Response.json({transcript:'review'});
 if(typeof options?.body==='string'&&options.body.includes('sam-3.1'))return new Response('data: {"type":"response.completed"}\n');
 explanations++;
 if(explanations===2)return new Response('provider fault',{status:503});
 if(explanations===3)return Response.json({status:'completed',usage:{input_tokens:-1},output:[]});
 return Response.json({status:'completed',usage:{input_tokens:10,output_tokens:10},output:[{type:'message',role:'assistant',content:[{type:'output_text',text:'Review the trusted demo total.'}]}]});
};
