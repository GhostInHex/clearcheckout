import {appendFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
if(process.env.NODE_ENV!=='test'||!process.env.DB_PATH?.startsWith(path.join(tmpdir(),'cc-next-browser-'))||process.env.MODEL_API_KEY!=='isolated-fake-key')throw Error('Browser provider requires isolated test process');
let transcripts=0;
globalThis.fetch=async(input,options)=>{
 const url=String(input);if(!url.startsWith('https://api.meta.ai/v1/'))throw Error('Fixture forbids outbound network');
 appendFileSync(process.env.DB_PATH+'.provider',url+'\n');
 if(url.includes('images/generations'))return Response.json({data:[{b64_json:'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aSXsAAAAASUVORK5CYII='}]});
 if(url.includes('asr/transcribe'))return Response.json({transcript:++transcripts===1?'Go to review.':'Confirm payment.'});
 if(typeof options?.body==='string'&&options.body.includes('sam-3.1'))return new Response('data: '+JSON.stringify({type:'response.output_text.delta',delta:'<0f>1<|box;x1=0;y1=0;x2=1;y2=1;w=1;h=1|><|mask;|>'})+'\ndata: {"type":"response.completed"}\n');
 return Response.json({status:'completed',usage:{input_tokens:400,output_tokens:100},output:[{type:'message',role:'assistant',content:[{type:'output_text',text:'<script>window.aiUnsafe=true</script> Review your tea and mug. No money moves.'}]}]});
};
