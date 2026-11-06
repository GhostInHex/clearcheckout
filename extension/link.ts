import {z} from 'zod';
import {linkBindingSchema,deviceScopeSchema} from '../shared/extension-link.js';
export const appOrigin='http://localhost:4319';
export const linkMessage=z.discriminatedUnion('kind',[
 z.object({kind:z.literal('binding')}).strict(),
 z.object({kind:z.literal('exchange'),code:z.string().regex(/^[a-f0-9]{64}$/)}).strict(),
 z.object({kind:z.literal('forget')}).strict()
]);
export const credentialSchema=z.object({credential:z.string().regex(/^[a-f0-9]{64}$/),id:z.string(),expires:z.number(),scope:deviceScopeSchema}).strict();
export {linkBindingSchema};
export function trustedSender(sender:chrome.runtime.MessageSender){return sender.id===chrome.runtime.id&&sender.url===chrome.runtime.getURL('link.html')&&(sender.tab===undefined||(sender.tab.id!==undefined&&sender.tab.url===sender.url));}
