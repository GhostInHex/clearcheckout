import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readLabelMemory,memoryKey} from '../shared/label-memory.js';
test('approved label storage rejects malformed, oversized, foreign, duplicate, sensitive and expired records',()=>{
 const values=new Map<string,string>();
 const storage:Storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>{values.set(key,value);},removeItem:key=>{values.delete(key);},clear:()=>values.clear(),key:index=>[...values.keys()][index]??null,get length(){return values.size;}};
 const entry={key:'a'.repeat(64),fingerprint:'b'.repeat(64),label:'Read cart summary',expires:2000};
 const write=(value:unknown)=>storage.setItem(memoryKey,JSON.stringify(value));
 write({origin:'https://shop.test',entries:[entry]});assert.equal(readLabelMemory(storage,'https://shop.test',1000).length,1);
 assert.equal(readLabelMemory(storage,'https://shop.test',2000).length,0);
 for(const value of [{origin:'https://other.test',entries:[entry]},{origin:'https://shop.test',entries:[entry,entry]},{origin:'https://shop.test',entries:[{...entry,label:'Payment secret'}]},{origin:'https://shop.test',entries:[{...entry,html:'<button>'}]},'x'.repeat(13000)]){
  write(value);assert.deepEqual(readLabelMemory(storage,'https://shop.test',1000),[]);assert.equal(storage.getItem(memoryKey),null);
 }
});
