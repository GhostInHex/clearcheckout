import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createLimiter} from '../server/rate-limit.js';
import {ipKeyGenerator} from '../server/client-ip.js';
test('bounded buckets preserve active allowances at 10000 identities and recover at exact expiry',()=>{
 let now=1000;const limit=createLimiter(()=>now);
 for(let i=0;i<10000;i++)assert.equal(limit(String(i),1,60000,new Headers()),false);
 assert.throws(()=>limit('overflow',1,60000,new Headers()),{status:503});
 assert.equal(limit('0',1,60000,new Headers()),true);
 now=60999;assert.throws(()=>limit('overflow',1,60000,new Headers()),{status:503});
 now=61000;assert.equal(limit('overflow',1,60000,new Headers()),false);
 assert.equal(limit('0',1,60000,new Headers()),false);
});
test('maintained IP helper groups IPv6 /56 including compressed equivalent addresses',()=>{
 assert.equal(ipKeyGenerator('2001:db8:abcd:1200::1'),ipKeyGenerator('2001:0db8:abcd:12ff:ffff::2'));
 assert.notEqual(ipKeyGenerator('2001:db8:abcd:1200::1'),ipKeyGenerator('2001:db8:abcd:1300::1'));
 assert.equal(ipKeyGenerator('192.0.2.1'),'192.0.2.1');
});
test('IPv4 mapped and compatible representations retain the IPv4 identity',()=>{
 assert.equal(ipKeyGenerator('::ffff:192.0.2.1'),'192.0.2.1');
 assert.equal(ipKeyGenerator('::192.0.2.1'),'192.0.2.1');
 assert.equal(ipKeyGenerator('::1'),ipKeyGenerator('::2'));
});
