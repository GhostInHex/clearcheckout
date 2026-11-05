import type {Destination} from './commands.js';
export interface MerchantAdapter {
 readonly kind:'declared-navigation';
 readonly capabilities:readonly ('scan'|'navigate')[];
 navigate:(destination:Destination)=>boolean;
}
const markers:Record<Destination,string>={cart:'[data-checkout-cart]',delivery:'[data-checkout-delivery]',review:'[data-checkout-review]'};
export function merchantAdapter(root:ParentNode):MerchantAdapter {
 return {kind:'declared-navigation',capabilities:['scan','navigate'],navigate(destination){
  const matches=root.querySelectorAll(markers[destination]);
  const target=matches.length===1?matches[0]:undefined;
  const view=target?.ownerDocument.defaultView;
  if(!target||!view||!(target instanceof view.HTMLElement)||!target.isConnected||target.closest('[hidden],[inert],[aria-hidden=true]')||!target.getClientRects().length)return false;
  target.focus();
  return target.ownerDocument.activeElement===target;
 }};
}

export type CartCapability =
 | {kind:'navigation-only';capabilities:readonly ['scan','navigate']}
 | {kind:'controlled-store';store:'store-a'|'store-b';capabilities:readonly ['scan','navigate','read-cart','review-removal'];request:typeof requestMerchantCart};
import {requestMerchantCart} from './merchant-cart.js';
export function cartCapability(url:URL,controlledOrigin:string):CartCapability {
 if(url.origin!==controlledOrigin||!['/demo','/demo/store-b'].includes(url.pathname))return {kind:'navigation-only',capabilities:['scan','navigate']};
 return {kind:'controlled-store',store:url.pathname==='/demo'?'store-a':'store-b',capabilities:['scan','navigate','read-cart','review-removal'],request:requestMerchantCart};
}
