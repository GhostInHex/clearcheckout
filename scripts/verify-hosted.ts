import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {z} from 'zod';

const origin=z.string().url().parse(process.env.CC_SMOKE_ORIGIN);
assert.equal(new URL(origin).origin,origin,'CC_SMOKE_ORIGIN must be an exact origin');
assert.equal(new URL(origin).protocol,'https:','Hosted verification requires HTTPS');
assert.equal(process.env.CC_SMOKE_CREATE_ACCOUNT,'1','Set CC_SMOKE_CREATE_ACCOUNT=1 to authorize creating a synthetic account');
const email=`smoke-${randomBytes(12).toString('hex')}@example.invalid`;
const password=randomBytes(24).toString('hex');
let cookie='';
async function request(path:string,body?:unknown){
 return fetch(origin+path,{method:body===undefined?'GET':'POST',redirect:'error',signal:AbortSignal.timeout(30000),headers:{'Content-Type':'application/json','x-clearcheckout':'1',Origin:origin,Cookie:cookie},...(body===undefined?{}:{body:JSON.stringify(body)})});
}
const signup=await request('/api/signup',{email,password});
assert.equal(signup.status,201,'Signup must return 201');
const header=signup.headers.get('set-cookie');
assert(header,'Signup must issue a session cookie');
assert(/;\s*Secure/i.test(header),'Hosted session must be Secure');
assert(/;\s*HttpOnly/i.test(header),'Hosted session must be HttpOnly');
assert(/;\s*SameSite=Strict/i.test(header),'Hosted session must use SameSite Strict');
cookie=z.string().parse(header.split(';')[0]);
assert.equal((await request('/api/me')).status,200,'New session must authenticate');
assert.equal((await request('/api/logout',{})).status,200,'Logout must succeed');
assert.equal((await request('/api/me')).status,401,'Logged-out session must be revoked');
const login=await request('/api/login',{email,password});
assert.equal(login.status,200,'Saved account must support login');
cookie=z.string().parse(login.headers.get('set-cookie')?.split(';')[0]);
assert.equal((await request('/api/me')).status,200,'Login session must authenticate');
assert.equal((await request('/api/logout',{})).status,200,'Verification session must close');
console.log('Hosted signup, secure session, logout, revocation and login passed. One synthetic account was retained.');
