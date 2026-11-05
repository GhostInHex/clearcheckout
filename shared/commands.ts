export type Destination = 'cart' | 'delivery' | 'review';
export type RemovalReview = Readonly<{itemId:string; revision:number; name:string}>;
export type Command =
 | {kind:'navigate'; destination:Destination}
 | {kind:'read-total'}
 | {kind:'remove-item'; review:RemovalReview}
 | {kind:'back'}
 | {kind:'undo-local-repair'}
 | {kind:'unknown'; suggestions:readonly Destination[]};

const destinations:readonly Destination[]=['cart','delivery','review'];
function distance(left:string,right:string):number {
 let previous=Array.from({length:right.length+1},(_,index)=>index);
 for(let i=0;i<left.length;i++) {
  const row=[i+1];
  for(let j=0;j<right.length;j++) row.push(Math.min((row[j]??0)+1,(previous[j+1]??0)+1,(previous[j]??0)+(left[i]===right[j]?0:1)));
  previous=row;
 }
 return previous[right.length]??left.length;
}
export function parseCommand(input:string):Command {
 const text=input.trim().toLowerCase();
 const target=text.replace(/^(?:go to|navigate to) /,'');
 const exact=destinations.find(destination=>destination===target);
 if(exact)return {kind:'navigate',destination:exact};
 if(text==='read total')return {kind:'read-total'};
 if(text==='back')return {kind:'back'};
 if(text==='undo local repair')return {kind:'undo-local-repair'};
 // Only a single navigation word may enter fuzzy matching.
 if(!/^[a-z]{3,9}$/.test(target))return {kind:'unknown',suggestions:[]};
 const suggestions=destinations.filter(destination=>distance(target,destination)===1);
 const destination=suggestions.length===1?suggestions[0]:undefined;
 return destination?{kind:'navigate',destination}:{kind:'unknown',suggestions};
}

export interface ControlledCart {
 revision:number;
 items:readonly {id:string; name:string}[];
 total:string;
}
export interface ControlledMerchant {
 read:()=>ControlledCart;
 remove:(review:RemovalReview)=>boolean;
}
export function reviewRemoval(cart:ControlledCart,itemId:string):RemovalReview|null {
 const matches=cart.items.filter(item=>item.id===itemId);
 const item=matches.length===1?matches[0]:undefined;
 return item?{itemId:item.id,name:item.name,revision:cart.revision}:null;
}
export function confirmRemoval(merchant:ControlledMerchant,review:RemovalReview):boolean {
 const current=reviewRemoval(merchant.read(),review.itemId);
 if(!current||current.revision!==review.revision||current.name!==review.name)return false;
 return merchant.remove(current);
}
