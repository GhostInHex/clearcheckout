import {ServiceError} from './service.js';
import {createHash} from 'node:crypto';
export function createLimiter(clock=Date.now){
 const limits=new Map<string,{count:number;expires:number}>();
return function limit(key:string,max:number,window:number,headers:Headers){
 const now=clock();
 for(const [k,v] of limits)if(v.expires<=now)limits.delete(k);
 let value=limits.get(key);
 if(!value){
  if(limits.size>=10000)throw new ServiceError(503,'Request capacity reached. Try again later.');
  value={count:0,expires:now+window};limits.set(key,value);
 }
 value.count++;
 const reset=Math.ceil((value.expires-now)/1000);const name=`${max}-in-${window/60000}min`;
 headers.append('RateLimit',`"${name}"; r=${Math.max(0,max-value.count)}; t=${reset}`);
 headers.append('RateLimit-Policy',`"${name}"; q=${max}; w=${window/1000}; pk=:${Buffer.from(createHash('sha256').update(key.replace(/^auth:/,'')).digest('hex').slice(0,12)).toString('base64')}:`);
 if(value.count>max)headers.set('Retry-After',String(reset));
 return value.count>max;
}
}
