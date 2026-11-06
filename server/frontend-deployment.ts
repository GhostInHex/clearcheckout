import {z} from 'zod';

const httpsOrigin=z.string().url().superRefine((value,context)=>{
 const url=new URL(value);
 if(url.protocol!=='https:'||url.origin!==value||url.username||url.password||url.hostname==='localhost'||url.hostname.endsWith('.localhost')||url.hostname.includes(':')||/^\d+\.\d+\.\d+\.\d+$/.test(url.hostname))context.addIssue({code:'custom',message:'Expected an exact public HTTPS origin without credentials, path, query, or fragment'});
});
const deploymentSchema=z.object({CC_BACKEND_ORIGIN:httpsOrigin,CC_FRONTEND_ORIGIN:httpsOrigin});
type Deployment={kind:'backend'}|{kind:'frontend';backend:string;frontend:string};
export function frontendDeployment(environment:NodeJS.ProcessEnv):Deployment{
 if(environment.VERCEL!=='1')return {kind:'backend'};
 const parsed=deploymentSchema.safeParse(environment);
 if(!parsed.success)throw Error('Vercel frontend requires valid CC_BACKEND_ORIGIN and CC_FRONTEND_ORIGIN HTTPS origins');
 const {CC_BACKEND_ORIGIN:backend,CC_FRONTEND_ORIGIN:frontend}=parsed.data;
 const frontendHosts=[new URL(frontend).hostname,environment.VERCEL_URL,environment.VERCEL_PROJECT_PRODUCTION_URL].filter(Boolean);
 if(frontendHosts.includes(new URL(backend).hostname))throw Error('CC_BACKEND_ORIGIN must be a separate persistent backend, not this frontend');
 return {kind:'frontend',backend,frontend};
}
