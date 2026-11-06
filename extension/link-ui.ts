import {z} from 'zod';
import {appOrigin,linkBindingSchema} from './link.js';
const resultSchema=z.object({binding:linkBindingSchema.optional(),message:z.string().optional(),error:z.string().optional()});
const status=document.getElementById('status');
const binding=document.getElementById('binding');
const code=document.getElementById('code');
async function send(message:unknown){try{const result=resultSchema.parse(await chrome.runtime.sendMessage(message));if(binding instanceof HTMLTextAreaElement&&result.binding)binding.value=JSON.stringify(result.binding);if(status)status.textContent=result.error??result.message??'Copy the binding to account controls, then approve.';}catch{if(status)status.textContent='Worker unavailable. Local repair still works.';}}
document.getElementById('prepare')?.addEventListener('click',()=>{void chrome.permissions.request({origins:[appOrigin+'/*']}).then(granted=>{if(granted)void send({kind:'binding'});else if(status)status.textContent='Permission declined. Local repair still works.';});});
document.getElementById('link')?.addEventListener('submit',event=>{event.preventDefault();if(code instanceof HTMLInputElement){const value=code.value;code.value='';void send({kind:'exchange',code:value});}});
document.getElementById('forget')?.addEventListener('click',()=>void send({kind:'forget'}));
