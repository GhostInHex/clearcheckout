import {z} from 'zod';
import {statusErrorSchema} from '../server/contracts.js';
import {port,cookie as sessionCookie,stringBody,audioRequest,scalarRow} from './node-helpers.js';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {nextFixture} from './next-fixture.js';

test('configured HTTPS origin works behind a rewritten Host without trusting arbitrary forwarded origins',async()=>{
  const fixture=await nextFixture(false,{PUBLIC_ORIGIN:'https://demo.example.test',PUBLIC_ORIGINS:'https://frontend.example.test',TRUST_PROXY:'loopback',COOKIE_SECURE:'true'});
  const base=fixture.base;
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
    await fixture.close();
  }
});

test('actual trusted socket walks loopback proxies and stops at the nearest untrusted address',async()=>{
 const fixture=await nextFixture(false,{TRUST_PROXY:'loopback'});
 try{
  const policy=async(chain:string)=>{
   const response=await fetch(fixture.base+'/api/me',{headers:{'X-Forwarded-For':chain,'X-CC-Client':'192.0.2.99','X-CC-Client-Signature':'forged'}});
   assert.equal(response.status,401);return response.headers.get('ratelimit-policy');
  };
  assert.equal(await policy('192.0.2.1, 198.51.100.1, 127.0.0.2'),await policy('198.51.100.1'));
  assert.notEqual(await policy('192.0.2.1, 198.51.100.1, 127.0.0.2'),await policy('192.0.2.1'));
  assert.equal(await policy('2001:db8:abcd:1200::1, ::1'),await policy('2001:db8:abcd:12ff::2'));
  assert.notEqual(await policy('2001:db8:abcd:1200::1'),await policy('2001:db8:abcd:1300::1'));
 }finally{await fixture.close();}
});
