import {appendFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
if(process.env.NODE_ENV!=='test'||!process.env.DB_PATH?.startsWith(path.join(tmpdir(),'cc-next-browser-'))||process.env.MODEL_API_KEY!=='isolated-fake-key')throw Error('Browser provider requires isolated test process');
let transcripts=0;
if(process.env.CC_TEST_MEDIA_MODE==='timeout'){const timeout=AbortSignal.timeout.bind(AbortSignal);AbortSignal.timeout=()=>timeout(20);}
globalThis.fetch=async(input,options)=>{
 const url=String(input);if(!url.startsWith('https://api.meta.ai/v1/'))throw Error('Fixture forbids outbound network');
 appendFileSync(process.env.DB_PATH+'.provider',url+'\n');
 const mode=process.env.CC_TEST_MEDIA_MODE;
 if(typeof options?.body==='string'&&options.body.includes('input_image')&&options.body.includes('"model":"muse-spark-1.3"')){appendFileSync(process.env.DB_PATH+'.labels',options.body+'\n');return Response.json({status:'completed',usage:{input_tokens:1000,output_tokens:20},output:[{type:'message',role:'assistant',content:[{type:'output_text',text:'Shopping cart'}]}]});}
 if(mode==='http-failure')return new Response('private provider detail',{status:503});
 if(mode==='timeout'){const signal=options?.signal;if(!signal)throw Error('Missing deadline');await new Promise<void>((_resolve,reject)=>{if(signal.aborted)reject(signal.reason);else signal.addEventListener('abort',()=>reject(signal.reason),{once:true});});}
 if(mode==='invalid-image'&&url.includes('images/generations')){const image=Buffer.alloc(24);Buffer.from('89504e470d0a1a0a','hex').copy(image);image.writeUInt32BE(4097,16);image.writeUInt32BE(1,20);return Response.json({data:[{b64_json:image.toString('base64')}]});}
 if(typeof options?.body==='string'&&options.body.includes('sam-3.1')){
  if(mode==='incomplete-sse')return new Response('data: {"type":"response.output_text.delta","delta":"partial"}\n');
  if(mode==='malformed-sse')return new Response('data: {private invalid json}\n');
 }
 if(url.includes('images/generations'))return Response.json({data:[{b64_json:'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aSXsAAAAASUVORK5CYII='}]});
 if(url.includes('asr/transcribe'))return Response.json({transcript:++transcripts===1?'Go to review.':'Confirm payment.'});
 if(typeof options?.body==='string'&&options.body.includes('sam-3.1'))return new Response('data: '+JSON.stringify({type:'response.output_text.delta',delta:'<0f>1<|box;x1=0;y1=0;x2=1;y2=1;w=1;h=1|><|mask;|>'})+'\ndata: {"type":"response.completed"}\n');
 return Response.json({status:'completed',usage:{input_tokens:400,output_tokens:100},output:[{type:'message',role:'assistant',content:[{type:'output_text',text:'<script>window.aiUnsafe=true</script> Review your tea and mug. No money moves.'}]}]});
};
