import {z} from 'zod';
import {boxesSchema} from '../shared/api-schema.js';
import {readFileSync} from 'node:fs';
const base=process.env.BROWSER_BASE_URL || 'http://localhost:3000';
const wavPath=process.argv[2];
if(!wavPath)throw Error('Usage: npx tsx scripts/verify-media-live.ts command.wav. Requires running configured app; performs up to three paid calls.');
let cookie='';
async function request(route: string,body: unknown,method='POST',audio=false){const r=await fetch(base+'/api'+route,{method,headers:{'X-ClearCheckout':'1',Cookie:cookie,...(method==='GET'?{}:{'Content-Type':audio?'audio/wav':'application/json'})},...(method==='GET'?{}:{body:audio ? new Uint8Array(z.instanceof(Buffer).parse(body)) : JSON.stringify(body)})});cookie=r.headers.get('set-cookie')?.split(';')[0]||cookie;if(!r.ok)throw Error(`${route} HTTP ${r.status}`);return r;}
await request('/signup',{email:`media-live-${Date.now()}@example.test`,password:'local-verification-12345'});
const scene=z.object({ready:z.boolean(),cached:z.boolean()}).parse(await (await request('/media/scene',{})).json());
const image=await (await request('/media/scene',null,'GET')).arrayBuffer();
console.log(JSON.stringify({model:'muse-image-1.0',ready:scene.ready,cached:scene.cached,bytes:image.byteLength}));
await request('/signup',{email:`media-live-next-${Date.now()}@example.test`,password:'local-verification-12345'});
if(process.env.MEDIA_LIVE_STAGE==='sam'){const d=boxesSchema.parse(await(await request('/media/locate',{object:'mug'})).json());console.log(JSON.stringify({model:'sam-3.1',boxes:d.boxes}));}
if(process.env.MEDIA_LIVE_STAGE==='voice'){const d=z.object({transcript:z.string()}).parse(await(await request('/media/transcribe',readFileSync(wavPath),'POST',true)).json());console.log(JSON.stringify({model:'muse-voice-transcribe-1.0',transcript:d.transcript}));}
