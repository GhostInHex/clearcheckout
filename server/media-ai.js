import {mkdirSync,existsSync,readFileSync,writeFileSync,renameSync} from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {metaConfig} from './meta-ai.js';
import {createLedger} from './ai-ledger.js';
const fail=(status,message)=>{throw Object.assign(new Error(message),{status});};
export function validateWav(b) {
  if(b.length<44||b.length>500000||b.toString('ascii',0,4)!=='RIFF'||b.toString('ascii',8,12)!=='WAVE'||b.readUInt32LE(4)!==b.length-8) fail(400,'Choose a mono PCM16 WAV at 16 or 24 kHz, up to 10 seconds.');
  let format,bytes;
  for(let i=12;i+8<=b.length;) {
    const n=b.readUInt32LE(i+4),end=i+8+n;
    if(end>b.length) fail(400,'Invalid WAV file.');
    const tag=b.toString('ascii',i,i+4);
    if(tag==='fmt '&&n>=16) format={pcm:b.readUInt16LE(i+8),channels:b.readUInt16LE(i+10),rate:b.readUInt32LE(i+12),byteRate:b.readUInt32LE(i+16),align:b.readUInt16LE(i+20),bits:b.readUInt16LE(i+22)};
    if(tag==='data') {if(bytes!==undefined) fail(400,'Invalid WAV file.');bytes=n;}
    i=end+(n%2);
  }
  if(!format||format.pcm!==1||format.channels!==1||![16000,24000].includes(format.rate)||format.bits!==16||format.align!==2||format.byteRate!==format.rate*2||!bytes||bytes%2||bytes/(format.rate*2)>10) fail(400,'Choose a mono PCM16 WAV at 16 or 24 kHz, up to 10 seconds.');
  return bytes/(format.rate*2);
}
export function parseBoxes(text) {
  if(!text.trim()) return [];
  if(!text.startsWith('<0f>')) throw Error('Invalid frame');
  const boxes=[];
  const pattern=/(\d+)<\|box;([^|]+)\|><\|mask;[\s\S]*?\|>/g;
  const records=[...text.matchAll(pattern)];
  if('<0f>'+records.map(m=>m[0]).join(',')!==text.trim()) throw Error('Invalid records');
  for(const match of records) {
    const f=Object.fromEntries(match[2].split(';').map(v=>v.split('=')));
    const values=['x1','y1','x2','y2','w','h'].map(k=>Number(f[k]));
    const [x1,y1,x2,y2,w,h]=values;
    if(!values.every(Number.isInteger)||w<=0||h<=0||x1<0||y1<0||x2<=x1||y2<=y1||x2>w||y2>h) throw Error('Invalid box');
    boxes.push({id:match[1],x1,y1,x2,y2,w,h});
  }
  if(!boxes.length) throw Error('Invalid segmentation');
  return boxes;
}
export function createMedia(db,{config=metaConfig(),transport=fetch,timeoutMs=90000,dataDir='data/media'}={}) {
  const reserve=createLedger(db,config),scenePath=path.join(dataDir,'scene.png');
  let generating=false;
  async function call(user,cacheKey,endpoint,body,headers={}) {
    if(!config.key) fail(503,'Meta media models are not configured.');
    const r=reserve.immediate(user,cacheKey);
    if(r.cached) return JSON.parse(r.cached);
    try {
      const response=await transport(`https://api.meta.ai/v1/${endpoint}`,{method:'POST',redirect:'error',signal:AbortSignal.timeout(timeoutMs),headers:{Authorization:`Bearer ${config.key}`,...headers},body});
      if(!response.ok) throw Error('Provider error');
      const raw=await response.text();
      if(raw.length>16000000) throw Error('Oversized response');
      const result=endpoint==='responses'?parseStream(raw):JSON.parse(raw);
      db.prepare("UPDATE ai_calls SET status='complete',text=? WHERE id=?").run(endpoint.startsWith('asr/')?null:JSON.stringify(result),r.id);
      return result;
    } catch {db.prepare("UPDATE ai_calls SET status='failed' WHERE id=?").run(r.id);fail(502,'Meta media request failed. No automatic retry was made.');}
  }
  function parseStream(raw) {
    let text='',complete=false;
    for(const line of raw.split('\n')) if(line.startsWith('data:')) {
      const s=line.slice(5).trim();if(s==='[DONE]') continue;
      const event=JSON.parse(s);
      if(event.type==='response.output_text.delta') text+=event.delta;
      if(event.type==='response.completed') complete=true;
    }
    if(!complete) throw Error('Incomplete stream');
    return {boxes:parseBoxes(text)};
  }
  return {
    scene(){return existsSync(scenePath)?readFileSync(scenePath):null;},
    async generate(user) {
      if(existsSync(scenePath)) return {ready:true,cached:true};
      if(generating) fail(409,'Scene generation is already running.');
      generating=true;
      try {
        const result=await call(user,'media-scene-v1','images/generations',JSON.stringify({model:'muse-image-1.0',prompt:'Illustrative studio still life on a plain light background. Exactly one oat colored stoneware mug with a large handle and one rectangular tea box. Objects fully visible, separated widely, no overlap. No other objects. Not an actual product photograph.',n:1,response_format:'b64_json',output_format:'png',tool_enablement:{enable_image_search:false,enable_web_search:false,enable_shell:false}}),{'Content-Type':'application/json'});
        const b=Buffer.from(result.data?.[0]?.b64_json||'','base64');
        if(b.length<24||b.length>10000000||b.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||b.readUInt32BE(16)>4096||b.readUInt32BE(20)>4096) fail(502,'The generated image was invalid.');
        mkdirSync(dataDir,{recursive:true});writeFileSync(scenePath+'.tmp',b);renameSync(scenePath+'.tmp',scenePath);
        return {ready:true,cached:false};
      }finally {generating=false;}
    },
    async locate(user,object) {
      if(!['mug','tea box'].includes(object)) fail(400,'Choose mug or tea box.');
      if(!existsSync(scenePath)) fail(409,'Generate the illustrative scene first.');
      const result=await call(user,`media-box-v1-${object}`,'responses',JSON.stringify({model:'sam-3.1',stream:true,input:[{type:'message',role:'user',content:[{type:'input_text',text:object},{type:'input_image',image_url:`data:image/png;base64,${readFileSync(scenePath).toString('base64')}`}]}]}),{'Content-Type':'application/json',Accept:'text/event-stream'});
      const image=readFileSync(scenePath);
      if(result.boxes.some(b=>b.w!==image.readUInt32BE(16)||b.h!==image.readUInt32BE(20))) fail(502,'SAM returned dimensions inconsistent with the illustration.');
      return result;
    },
    async transcribe(user,audio) {
      validateWav(audio);
      const body=new FormData();body.append('request',new Blob([JSON.stringify({mode:'DIARIZATION',model:'muse-voice-transcribe-1.0',audioEncoding:'WAV'})],{type:'application/json'}));body.append('audio',new Blob([audio],{type:'audio/wav'}),'command.wav');
      const result=await call(user,`voice-${randomUUID()}`,`asr/transcribe?sessionId=${randomUUID()}`,body);
      if(typeof result.transcript!=='string'||result.transcript.length>2000) fail(502,'No usable transcript was returned.');
      return {transcript:result.transcript};
    }
  };
}
