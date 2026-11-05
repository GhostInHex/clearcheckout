import {z} from 'zod';
const item=z.object({id:z.string().min(1).max(80),name:z.string().min(1).max(160),quantity:z.number().int().positive()}).strict();
export const cartSnapshot=z.object({store:z.enum(['store-a','store-b']),revision:z.number().int().nonnegative(),items:z.array(item).max(20),total:z.object({amount:z.number().int().nonnegative(),currency:z.literal('USD'),provenance:z.enum(['first-party-api','client-local'])}).strict()}).strict().refine(cart=>new Set(cart.items.map(item=>item.id)).size===cart.items.length,'Ambiguous item IDs').refine(cart=>cart.total.provenance===(cart.store==='store-a'?'first-party-api':'client-local'),'Invalid total provenance');
export type CartSnapshot=z.infer<typeof cartSnapshot>;
export const cartReview=z.object({cart:cartSnapshot,item}).strict();
export type CartReview=z.infer<typeof cartReview>;
export const cartRequest=z.discriminatedUnion('kind',[
 z.object({kind:z.literal('read')}).strict(),
 z.object({kind:z.literal('remove'),review:cartReview}).strict(),
]);
export type CartRequest=z.infer<typeof cartRequest>;
export const cartResult=z.discriminatedUnion('kind',[
 z.object({kind:z.literal('cart'),cart:cartSnapshot}).strict(),
 z.object({kind:z.literal('refused'),reason:z.string().max(240)}).strict(),
]);
export type CartResult=z.infer<typeof cartResult>;
export function sameReview(current:CartSnapshot,review:CartReview){
 const matches=current.items.filter(value=>value.id===review.item.id);
 return JSON.stringify(current)===JSON.stringify(review.cart)&&matches.length===1&&JSON.stringify(matches[0])===JSON.stringify(review.item);
}
export function serveMerchantCart(handle:(request:CartRequest)=>Promise<CartResult>){
 const listener=(event:MessageEvent<unknown>)=>{
  if(event.source!==window||event.origin!==location.origin||event.ports.length!==1)return;
  const envelope=z.object({channel:z.literal('clearcheckout-cart-v1'),request:cartRequest}).strict().safeParse(event.data);
  const port=event.ports[0];if(!envelope.success||!port)return;
  void handle(envelope.data.request).then(result=>{port.postMessage(result);port.close();}).catch(()=>{port.postMessage({kind:'refused',reason:'Merchant cart unavailable. Review again.'});port.close();});
 };
 window.addEventListener('message',listener);return()=>window.removeEventListener('message',listener);
}
export async function requestMerchantCart(request:CartRequest):Promise<CartResult>{
 if(!['/demo','/demo/store-b'].includes(location.pathname))return {kind:'refused',reason:'Unsupported merchant. Scan and navigation only.'};
 return new Promise(resolve=>{
  const channel=new MessageChannel();
  const timer=setTimeout(()=>{channel.port1.close();resolve({kind:'refused',reason:'Controlled merchant unavailable. Scan and navigation only.'});},1500);
  channel.port1.onmessage=(event:MessageEvent<unknown>)=>{clearTimeout(timer);channel.port1.close();const result=cartResult.safeParse(event.data);resolve(result.success?result.data:{kind:'refused',reason:'Invalid merchant response.'});};
  window.postMessage({channel:'clearcheckout-cart-v1',request},location.origin,[channel.port2]);
 });
}

export type CartCapability =
 | {kind:'navigation-only';capabilities:readonly ['scan','navigate']}
 | {kind:'controlled-store';store:'store-a'|'store-b';capabilities:readonly ['scan','navigate','read-cart','review-removal'];request:typeof requestMerchantCart};
export function cartCapability(url:URL,controlledOrigin:string):CartCapability {
 if(url.origin!==controlledOrigin||!['/demo','/demo/store-b'].includes(url.pathname))return {kind:'navigation-only',capabilities:['scan','navigate']};
 return {kind:'controlled-store',store:url.pathname==='/demo'?'store-a':'store-b',capabilities:['scan','navigate','read-cart','review-removal'],request:requestMerchantCart};
}
