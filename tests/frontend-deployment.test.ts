import {test} from 'node:test';
import assert from 'node:assert/strict';
import {frontendDeployment} from '../server/frontend-deployment.js';
const valid={VERCEL:'1',CC_BACKEND_ORIGIN:'https://backend.example.test',CC_FRONTEND_ORIGIN:'https://frontend.example.test'};
test('only the Vercel frontend enables forwarding',()=>{
 assert.deepEqual(frontendDeployment({...valid,VERCEL:undefined}),{kind:'backend'});
 assert.equal(frontendDeployment(valid).kind,'frontend');
});
test('hosted build refuses missing, malformed, insecure and recursive backends',()=>{
 for(const value of [undefined,'','http://backend.example.test','https://backend.example.test/','https://user:pass@backend.example.test','https://backend.example.test/api','https://backend.example.test?q=1','https://localhost','https://127.0.0.1','https://frontend.example.test'])assert.throws(()=>frontendDeployment({...valid,CC_BACKEND_ORIGIN:value}));
 assert.throws(()=>frontendDeployment({...valid,CC_FRONTEND_ORIGIN:undefined}));
 assert.throws(()=>frontendDeployment({...valid,VERCEL_URL:'backend.example.test'}));
 assert.throws(()=>frontendDeployment({...valid,VERCEL_BRANCH_URL:'backend.example.test'}));
 assert.throws(()=>frontendDeployment({...valid,VERCEL_PROJECT_PRODUCTION_URL:'backend.example.test'}));
});
