import {Readable,Writable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {createGunzip,createInflate,createBrotliDecompress} from 'node:zlib';
import {ServiceError} from './service.js';
export async function readBody(request:Request,max:number,encoding='identity'){
 const chunks:Buffer[]=[];let size=0;let inputSize=0;
 const reader=request.body?.getReader();
 async function* input(){
  if(!reader)return;
  try{while(true){const part=await reader.read();if(part.done)break;inputSize+=part.value.byteLength;if(inputSize>(encoding==='identity'?max:64*1024))throw new ServiceError(413,'Request is too large.');yield part.value;}}
  finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
 }
 const source=Readable.from(input());
 const sink=new Writable({write(chunk:Buffer,_encoding,done){size+=chunk.length;if(size>max){done(new ServiceError(413,'Request is too large.'));return;}chunks.push(chunk);done();}});
 try{
  const decoder=encoding==='gzip'?createGunzip():encoding==='deflate'?createInflate():encoding==='br'?createBrotliDecompress():undefined;
  if(decoder)await pipeline(source,decoder,sink,{signal:request.signal});
  else await pipeline(source,sink,{signal:request.signal});
 }catch(error){if(error instanceof ServiceError)throw error;throw new ServiceError(400,'Request could not be processed.');}
 return Buffer.concat(chunks);
}
export async function readJson(request:Request):Promise<unknown>{
 const charset=/;\s*charset\s*=\s*"?([^;"\s]+)/i.exec(request.headers.get('content-type')||'')?.[1]?.toLowerCase();
 const encoding=(request.headers.get('content-encoding')||'identity').toLowerCase();
 if((charset&&!charset.startsWith('utf-'))||!['identity','gzip','deflate','br'].includes(encoding))throw new ServiceError(415,'Request could not be processed.');
 let decoder:TextDecoder;
 try{decoder=new TextDecoder(charset||'utf-8',{fatal:true});}catch{throw new ServiceError(415,'Request could not be processed.');}
 const buffer=await readBody(request,8192,encoding);
 if(!buffer.length)return undefined;
 try{
  const text=decoder.decode(buffer);
  const body:unknown=JSON.parse(text.replace(/^\uFEFF/,''));
  if(typeof body!=='object'||body===null)throw Error();
  return body;
 }catch{throw new ServiceError(400,'Request could not be processed.');}
}
