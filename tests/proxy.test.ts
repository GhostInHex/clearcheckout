import {z} from 'zod';
import {statusErrorSchema} from '../server/contracts.js';
import {port,cookie as sessionCookie,stringBody,audioRequest,scalarRow} from './node-helpers.js';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createApp} from '../server/app.js';

test('configured HTTPS origin works behind a rewritten Host without trusting arbitrary forwarded origins',async()=>{
  const {app,db}=createApp({dbPath:':memory:',production:true,publicOrigin:'https://demo.example.test',publicOrigins:'https://frontend.example.test',trustProxy:'loopback',aiOptions:{config:{key:'',budgetMicros:0,callLimit:0}}});
  const server=app.listen(0);
  const base=`http://localhost:${port(server)}`;
  try {
    const request=(origin:string)=>fetch(base+'/api/signup',{method:'POST',headers:{'Content-Type':'application/json','X-ClearCheckout':'1',Origin:origin,'X-Forwarded-Host':'demo.example.test','X-Forwarded-Proto':'https'},body:JSON.stringify({email:`proxy-${Date.now()}@example.test`,password:'local-proxy-test1234'})});
    const valid=await request('https://demo.example.test');
    assert.equal(valid.status,201);
    assert.match(valid.headers.get('set-cookie') ?? '',/; Secure/);
    assert.equal((await request('https://frontend.example.test')).status,201);
    assert.equal((await request('https://attacker.example.test')).status,403);
    assert.equal((await request('not a URL')).status,403);
    assert.equal((await fetch(base+'/api/signup',{method:'POST',headers:{Origin:'https://demo.example.test','Content-Type':'application/json'},body:'{}'})).status,403);
  } finally {
    await new Promise(resolve=>server.close(resolve));
    db.close();
  }
});
