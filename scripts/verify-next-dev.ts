import assert from 'node:assert/strict';
import {nextFixture} from '../tests/next-fixture.js';
const fixture=await nextFixture(false,{},true);
try{
 const response=await fetch(fixture.base+'/api/signup',{method:'POST',headers:{'Content-Type':'application/json','X-ClearCheckout':'1'},body:JSON.stringify({email:'dev@example.test',password:'isolatedpassword123'})});
 assert.equal(response.status,201);assert.equal(response.headers.get('cache-control'),'no-store');assert.ok(response.headers.get('set-cookie'));
 for(const route of ['/login','/dashboard','/demo','/clearcheckout-extension.zip'])assert.equal((await fetch(fixture.base+route)).status,200);
 console.log('Development Next startup, routes, socket identity, signup and download passed without environment-file loading.');
}finally{await fixture.close();}
