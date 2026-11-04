import {z} from 'zod';
import {errorSchema,errorMessage} from '../shared/api-schema.js';
import React,{useState,useRef,useEffect} from 'react';
export function recognizedCommand(text:string) {
  const commands:Record<string,string>={'go to cart':'cart','go to delivery':'delivery','go to review':'review','read total':'total'};return commands[text.toLowerCase().trim().replace(/[.!?]$/,'')] || null;
}
function wav(samples:Float32Array,rate:number) {
  const count=Math.min(240000,Math.floor(samples.length*24000/rate));
  const buffer=new ArrayBuffer(44+count*2),v=new DataView(buffer);
  const str=(at:number,s:string)=>[...s].forEach((c,i)=>v.setUint8(at+i,c.charCodeAt(0)));
  str(0,'RIFF');v.setUint32(4,36+count*2,true);str(8,'WAVE');str(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,24000,true);v.setUint32(28,48000,true);v.setUint16(32,2,true);v.setUint16(34,16,true);str(36,'data');v.setUint32(40,count*2,true);
  for(let i=0;i<count;i++)v.setInt16(44+i*2,Math.max(-1,Math.min(1,(samples[Math.floor(i*rate/24000)] ?? 0)))*32767,true);
  return new Blob([buffer],{type:'audio/wav'});
}
export default function VoiceNavigation({onCommand}:{onCommand:(command:string)=>void}) {
 const [audio,setAudio]=useState<Blob|null>(null),[recording,setRecording]=useState(false),[busy,setBusy]=useState(false),[transcript,setTranscript]=useState(''),[error,setError]=useState('');
 const live=useRef<{stream:MediaStream;context:AudioContext;source:MediaStreamAudioSourceNode;processor:ScriptProcessorNode;chunks:Float32Array[];timer:ReturnType<typeof setTimeout>}|null>(null),mounted=useRef(true),requesting=useRef(false);
 function stop(save=true) {
   const r=live.current;if(!r)return;live.current=null;clearTimeout(r.timer);r.stream.getTracks().forEach(t=>t.stop());r.processor.disconnect();r.source.disconnect();r.context.close();
   if(mounted.current){setRecording(false);if(save){const all=new Float32Array(r.chunks.reduce((n,c)=>n+c.length,0));let offset=0;for(const c of r.chunks){all.set(c,offset);offset+=c.length;}setAudio(wav(all,r.context.sampleRate));setTranscript('');}}
 }
 useEffect(()=>()=>{mounted.current=false;stop(false);},[]);
 async function record(){if(requesting.current||live.current)return;requesting.current=true;setError('');setAudio(null);setTranscript('');try {
   const stream=await navigator.mediaDevices.getUserMedia({audio:true});
   if(!mounted.current){stream.getTracks().forEach(t=>t.stop());return;}
   let context:AudioContext|undefined;try {context=new AudioContext();const source=context.createMediaStreamSource(stream),processor=context.createScriptProcessor(4096,1,1),chunks:Float32Array[]=[];source.connect(processor);processor.connect(context.destination);processor.onaudioprocess=e=>{if(live.current)chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));};live.current={stream,context,source,processor,chunks,timer:setTimeout(()=>stop(),10000)};setRecording(true);}catch(e){stream.getTracks().forEach(t=>t.stop());context?.close();throw e;}
 }catch {setError('Microphone unavailable. Choose a WAV recording below.');}finally{requesting.current=false;}}
 const command=recognizedCommand(transcript);
 return <section className="media-tool"><h3>Voice navigation</h3><p>Muse Voice Transcribe. Record up to 10 seconds locally. Only “Send audio to Meta” uploads it. Audio may contain private speech. Review the transcript, then choose Apply. Voice cannot change or confirm an order.</p><p>Commands: Go to cart. Go to delivery. Go to review. Read total.</p><button className="button secondary" disabled={busy} onClick={()=>recording?stop():record()}>{recording?'Stop recording':'Record a command'}</button><label>Or choose a mono PCM16 WAV, 16 or 24 kHz, at most 10 seconds<input type="file" accept="audio/wav,.wav" disabled={recording||busy} onChange={e=>{setAudio(e.target.files?.[0]||null);setTranscript('');}}/></label><button className="button secondary" disabled={!audio||recording||busy} onClick={async()=>{setBusy(true);setError('');setTranscript('');try{const r=await fetch('/api/media/transcribe',{method:'POST',headers:{'X-ClearCheckout':'1','Content-Type':'audio/wav'},body:audio});const d:unknown=await r.json();if(!r.ok)throw Error(errorSchema.parse(d).error);setTranscript(z.object({transcript:z.string()}).parse(d).transcript);}catch(e){setError(errorMessage(e));}finally{setBusy(false);}}}>{busy?'Transcribing…':'Send audio to Meta'}</button><div role="status">{recording?'Recording. Stops automatically after 10 seconds.':audio?'Recording ready for your approval.':''}{transcript&&<><p>Transcript: {transcript}</p>{command?<button className="button secondary" onClick={()=>{onCommand(command);setTranscript('');}}>Apply {command==='total'?'read total':`go to ${command}`}</button>:<p>No supported command recognized. No action taken.</p>}</>}</div><p role="alert" className="error">{error}</p></section>;
}
