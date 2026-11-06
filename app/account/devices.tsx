 'use client';
import {useState,type FormEvent} from 'react';
import {z} from 'zod';
import {linkBindingSchema} from '../../shared/extension-link';
const devicesSchema=z.array(z.object({id:z.string(),extension_id:z.string(),installation_id:z.string(),expires:z.number(),revoked:z.number(),scope:z.literal('labels:suggest')}));
const approvalSchema=z.object({code:z.string(),expires:z.number()});
export default function Devices(){
 const [devices,setDevices]=useState<z.infer<typeof devicesSchema>>([]);
 const [message,setMessage]=useState('');const [code,setCode]=useState('');const [pending,setPending]=useState(false);
 async function request(path:string,body?:unknown){const response=await fetch('/api/account/devices'+path,body===undefined?{cache:'no-store'}:{method:'POST',headers:{'Content-Type':'application/json','x-clearcheckout':'1'},body:JSON.stringify(body)});if(!response.ok)throw Error('Sign in and check that this extension is approved.');return response.json();}
 async function refresh(){setDevices(devicesSchema.parse(await request('')));}
 async function action(operation:()=>Promise<void>){setPending(true);setMessage('Working…');try{await operation();setMessage('Completed.');}catch{setMessage('Device request failed. Sign in and check the installation binding.');}finally{setPending(false);}}
 function approve(event:FormEvent<HTMLFormElement>){event.preventDefault();const form=event.currentTarget;const value=new FormData(form).get('binding');void action(async()=>{if(typeof value!=='string')throw Error('Missing binding');const binding=linkBindingSchema.parse(JSON.parse(value));const result=approvalSchema.parse(await request('/approve',binding));setCode(result.code);setMessage('Code expires '+new Date(result.expires).toISOString());form.reset();});}
 return <section aria-labelledby="devices-title"><h2 id="devices-title">Extension devices</h2><p>Open the installed extension’s options and prepare an approval. Paste its installation binding here. Approval allows label suggestions only, without account or payment powers. Image suggestions are currently unavailable.</p><form onSubmit={approve}><label>Installation binding<textarea name="binding" required autoComplete="off"/></label><button disabled={pending}>Approve installation for two minutes</button></form>{code&&<label>Single-use code. Copy to extension options.<input readOnly value={code} onFocus={event=>event.currentTarget.select()}/></label>}<p role="status">{message}</p><button disabled={pending} onClick={()=>void action(refresh)}>Refresh my devices</button><ul>{devices.map(device=><li key={device.id}>Installation {device.installation_id.slice(0,12)}. Extension {device.extension_id}. Scope {device.scope}. Expires {new Date(device.expires).toISOString()}. {device.revoked?'Revoked':<button disabled={pending} onClick={()=>void action(async()=>{await request('/revoke',{id:device.id});await refresh();})}>Revoke {device.installation_id.slice(0,12)}</button>}</li>)}</ul></section>;
}
