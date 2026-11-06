import {test} from 'node:test';
import assert from 'node:assert/strict';
import {gzipSync,deflateSync,brotliCompressSync} from 'node:zlib';
import {connect} from 'node:net';
import {once} from 'node:events';
import {nextFixture} from './next-fixture.js';
test('actual Next bounds decompressed JSON and preserves parser errors before origin checks and survives aborts',async()=>{
 const fixture=await nextFixture();
 try{
  const send=(body:Buffer,encoding:string,type='application/json')=>fetch(fixture.base+'/api/signup',{method:'POST',headers:{'Content-Type':type,'Content-Encoding':encoding,Origin:'https://wrong.invalid'},body:new Uint8Array(body)});
  for(const [encoding,compress] of [['gzip',gzipSync],['deflate',deflateSync],['br',brotliCompressSync]] satisfies [string,(value:string)=>Buffer][]){
   assert.equal((await send(compress('{}'),encoding)).status,403);
   assert.equal((await send(compress(JSON.stringify({text:'x'.repeat(8181)})),encoding)).status,403);
   const oversized=await send(compress(JSON.stringify({text:'x'.repeat(9000)})),encoding);
   assert.equal(oversized.status,413);assert.equal(oversized.headers.get('cache-control'),'no-store');assert.deepEqual(await oversized.json(),{error:'Request is too large.'});
  }
  for(const [encoding,type,status] of [['identity','application/json; charset=latin1',415],['identity','application/json; charset=utf-7',415],['unknown','application/json',415],['gzip','application/json',400]] satisfies [string,string,number][]){const response=await send(Buffer.from('{}'),encoding,type);assert.equal(response.status,status);assert.equal(response.headers.get('cache-control'),'no-store');assert.deepEqual(await response.json(),{error:'Request could not be processed.'});}
  const url=new URL(fixture.base);const socket=connect(Number(url.port),'127.0.0.1');await once(socket,'connect');
  socket.end('POST /api/signup HTTP/1.1\r\nHost: '+url.host+'\r\nContent-Type: application/json\r\nContent-Length: 100\r\n\r\n{');
  let aborted='';socket.on('data',chunk=>{aborted+=String(chunk);});await once(socket,'close');assert.match(aborted,/HTTP\/1\.1 400/);
  assert.equal((await fetch(fixture.base+'/api/me')).status,401);
 }finally{await fixture.close();}
});
