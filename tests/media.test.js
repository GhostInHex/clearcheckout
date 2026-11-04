import test from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {createMedia,parseBoxes,validateWav} from '../server/media-ai.js';
import {createMetaGuidance} from '../server/meta-ai.js';
export function fixtureWav(){const b=Buffer.alloc(32044);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(16000,24);b.writeUInt32LE(32000,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(32000,40);return b;}
test('WAV validation rejects formats and excessive durations before upload',()=>{assert.equal(validateWav(fixtureWav()),1);for(const mutate of [b=>b.writeUInt16LE(2,22),b=>b.writeUInt32LE(44100,24),b=>b.writeUInt16LE(32,34),b=>b.writeUInt32LE(999999,40)]){const b=fixtureWav();mutate(b);assert.throws(()=>validateWav(b));}assert.throws(()=>validateWav(Buffer.alloc(500001)));});
test('documented SAM source pixel tokens including confidence and empty matches',()=>{assert.deepEqual(parseBoxes(''),[]);assert.deepEqual(parseBoxes('<0f>1<|box;x1=444;y1=625;x2=679;y2=850;w=1800;h=1200;c=0.9609375|><|mask;x=0;y=0;c=0.9609375;data=226,236,~...|>')[0],{id:'1',x1:444,y1:625,x2:679,y2:850,w:1800,h:1200});assert.throws(()=>parseBoxes('<0f>1<|box;x1=0;y1=0;x2=999;y2=10;w=10;h=10|><|mask;x=0;y=0;data=1,1,~...|>'));});
test('three official media requests share guidance ledger and cache with retained reservations',async()=>{
 const db=new Database(':memory:'),dir=mkdtempSync(tmpdir()+'/cc-media-');const config={key:'test-key',budgetMicros:200000,callLimit:4};let calls=0;
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64');
 const media=createMedia(db,{config,dataDir:dir,transport:async(url,options)=>{calls++;assert.equal(options.headers.Authorization,'Bearer test-key');if(url.endsWith('/images/generations')){const b=JSON.parse(options.body);assert.equal(b.model,'muse-image-1.0');assert.equal(b.n,1);assert.equal(b.output_format,'png');return new Response(JSON.stringify({data:[{b64_json:png.toString('base64')}]}));}if(url.endsWith('/responses')){const b=JSON.parse(options.body);assert.equal(b.model,'sam-3.1');assert.ok(b.input[0].content[1].image_url.startsWith('data:image/png;base64,'));return new Response('data: '+JSON.stringify({type:'response.output_text.delta',delta:'<0f>0<|box;x1=0;y1=0;x2=1;y2=1;w=1;h=1|><|mask;x=0;y=0;data=1,1,~!!!!|>'})+'\n\ndata: {"type":"response.completed"}\n');}assert.ok(url.includes('/asr/transcribe?sessionId='));assert.equal(JSON.parse(await options.body.get('request').text()).audioEncoding,'WAV');return new Response(JSON.stringify({transcript:'Go to cart.',audioDurationMs:1000}));}});
 try{await media.generate('image-user');assert.ok(media.scene());await media.generate('other');assert.equal(calls,1);assert.equal((await media.locate('sam-user','mug')).boxes.length,1);await media.locate('sam-user','mug');assert.equal(calls,2);assert.equal((await media.transcribe('voice-user',fixtureWav())).transcript,'Go to cart.');assert.equal(db.prepare('SELECT SUM(reserved) n FROM ai_calls').get().n,150000);const guidance=createMetaGuidance(db,{config,transport:async()=>new Response('{}',{status:500})});await assert.rejects(guidance.explain('guidance',{cart:{mug:1,tea:1},delivery:'standard',state:'draft',revision:1},'brief'));await assert.rejects(media.transcribe('another',fixtureWav()),/allowance/);assert.equal(calls,3);assert.equal(db.prepare('SELECT SUM(reserved) n FROM ai_calls').get().n,200000);}finally{db.close();rmSync(dir,{recursive:true});}
});

test('invalid image results retain their reservation and allow an explicit retry, including legacy caches',async()=>{
  const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
  for(const legacy of [false,true]) {
    const db=new Database(':memory:'),dir=mkdtempSync(tmpdir()+'/cc-recovery-');
    const config={key:'test-key',budgetMicros:5000000,callLimit:100};
    let calls=0;
    const transport=async()=>{calls++;return new Response(JSON.stringify({data:[{b64_json:!legacy&&calls===1?'invalid':png}]}));};
    let media=createMedia(db,{config,dataDir:dir,transport});
    try {
      if(legacy) db.prepare("INSERT INTO ai_calls(id,user_id,cache_key,created,reserved,status,text) VALUES('legacy','u','media-scene-v1',0,50000,'complete',?)").run(JSON.stringify({data:[{b64_json:'invalid'}]}));
      await assert.rejects(media.generate('u'),error=>error.status===502);
      assert.equal(db.prepare('SELECT status FROM ai_calls').get().status,'failed');
      assert.equal(db.prepare('SELECT SUM(reserved) n FROM ai_calls').get().n,50000);
      assert.equal(calls,legacy?0:1);
      db.prepare('UPDATE ai_calls SET created=0').run();
      media=createMedia(db,{config,dataDir:dir,transport});
      assert.equal((await media.generate('u')).ready,true);
      assert.ok(media.scene());
      assert.equal(calls,legacy?1:2);
      assert.equal(db.prepare('SELECT SUM(reserved) n FROM ai_calls').get().n,100000);
    } finally {db.close();rmSync(dir,{recursive:true,force:true});}
  }
});

test('SAM dimension errors are not cached as successful results',async()=>{
  const db=new Database(':memory:'),dir=mkdtempSync(tmpdir()+'/cc-sam-recovery-');
  const config={key:'test-key',budgetMicros:5000000,callLimit:100};
  let samCalls=0;
  const media=createMedia(db,{config,dataDir:dir,transport:async url=>{
    if(url.endsWith('/images/generations')) return new Response(JSON.stringify({data:[{b64_json:'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII='}]}));
    samCalls++;
    const dimension=samCalls===1?2:1;
    const delta=`<0f>0<|box;x1=0;y1=0;x2=1;y2=1;w=${dimension};h=${dimension}|><|mask;x=0;y=0;data=1,1,~!!!!|>`;
    return new Response('data: '+JSON.stringify({type:'response.output_text.delta',delta})+'\n\ndata: {"type":"response.completed"}\n');
  }});
  try {
    await media.generate('scene-user');
    await assert.rejects(media.locate('sam-user','mug'),error=>error.status===502);
    assert.equal(db.prepare("SELECT status FROM ai_calls WHERE cache_key='media-box-v1-mug'").get().status,'failed');
    db.prepare('UPDATE ai_calls SET created=0').run();
    assert.equal((await media.locate('sam-user','mug')).boxes.length,1);
    assert.equal(samCalls,2);
    assert.equal(db.prepare('SELECT SUM(reserved) n FROM ai_calls').get().n,150000);
  } finally {db.close();rmSync(dir,{recursive:true,force:true});}
});
