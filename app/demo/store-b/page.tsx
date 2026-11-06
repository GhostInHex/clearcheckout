'use client';
import {GuidedAnnouncements,useGuidedAnnouncements} from '../../../src/GuidedAnnouncements';
import {useEffect,useRef,useState} from 'react';
import LabelMemory from '../../../src/LabelMemory';
import Link from 'next/link';
import {serveMerchantCart,sameReview,type CartSnapshot} from '../../../shared/merchant-cart';
import {repair,clearRepairs,runCommand} from '../../../shared/dom';
export default function StoreB(){
 const current=useRef({revision:1,quantity:1});
 const [quantity,renderQuantity]=useState(1);
 const [review,setReview]=useState<{revision:number;quantity:number}|null>(null);
 const announcements=useGuidedAnnouncements();const {setNotice}=announcements;
 const removalPanel=useRef<HTMLElement|null>(null);
 useEffect(()=>{if(review)removalPanel.current?.focus();},[review]);
 function setQuantity(next:number){current.current={revision:current.current.revision+1,quantity:next};renderQuantity(next);}
 function confirm(){
  if(!review||review.revision!==current.current.revision||review.quantity!==current.current.quantity){setNotice('Cart changed. Review the current item again.');setReview(null);return;}
  setQuantity(0);setReview(null);setNotice('Trail bottle removed. Cart is empty. Total $0. No purchase occurred.');
 }
 useEffect(()=>serveMerchantCart(async request=>{
  const cart:CartSnapshot={store:'store-b',revision:current.current.revision,items:current.current.quantity?[{id:'bottle',name:'Trail bottle',quantity:current.current.quantity}]:[],total:{amount:current.current.quantity*1200,currency:'USD',provenance:'client-local'}};
  if(request.kind==='read')return {kind:'cart',cart};
  if(!sameReview(cart,request.review))return {kind:'refused',reason:'Cart changed or item mismatched. Review again.'};
  setQuantity(0);setReview(null);setNotice('Trail bottle removed. No purchase occurred.');
  return {kind:'cart',cart:{...cart,revision:current.current.revision,items:[],total:{...cart.total,amount:0}}};
 }),[]);
 const [promo,setPromo]=useState(false);
 return <main><h1>Store B · Trail supplies</h1><nav><Link href="/demo">Store A</Link></nav><p>Controlled local demo. No purchase or upload occurs.</p>
 <section data-checkout-cart tabIndex={-1}><h2>Cart</h2><p>Trail bottle · $12 each</p>
 <div draggable onDragEnd={()=>setQuantity(Math.min(9,current.current.quantity+1))}>Drag to increase quantity</div>
 <label>Quantity (keyboard alternative)<input type="number" min="1" max="9" value={quantity} onChange={event=>{const next=Number(event.target.value);if(Number.isInteger(next)&&next>=1&&next<=9)setQuantity(next);}}/></label>
 <p data-checkout-total>Total ${quantity*12}</p><p>Revision {current.current.revision}</p>
 {quantity>0&&<button onClick={()=>setReview({...current.current})}>Review removal of Trail bottle</button>}
 {review&&<section aria-label="Removal review" tabIndex={-1} ref={removalPanel}><h3>Remove Trail bottle?</h3><p>Remove all {review.quantity} units. Result: empty cart, total $0. This cannot be undone by label undo.</p><button onClick={confirm}>Confirm removal of Trail bottle</button><button onClick={()=>{setReview(null);setNotice('Removal cancelled. Cart unchanged.');}}>Cancel removal</button></section>}
 <GuidedAnnouncements {...announcements}/></section>
 <div onMouseEnter={()=>setPromo(true)}>Hover to reveal promo</div>
 <button onClick={()=>setPromo(value=>!value)} aria-expanded={promo}>Show promo (keyboard alternative)</button>
 {promo && <p>Promo TRAIL saves on a future demo order.</p>}
 <section data-checkout-delivery tabIndex={-1}><h2>Delivery</h2><input data-checkout-label="Delivery instructions"/></section>
 <section data-checkout-review tabIndex={-1}><h2>Review</h2><button data-checkout-label="Read demo summary" onClick={()=>setPromo(true)}></button></section>
 <nav aria-label="Guided checkout">{['cart','delivery','review','back'].map(command=><button key={command} onClick={()=>setNotice(runCommand(document,command))}>{command==='back'?'Previous guided step':`Go to ${command}`}</button>)}</nav><button onClick={()=>{const result=repair(document);setNotice(`${result.repaired} labels repaired locally.`);}}>Repair reliable labels</button><button onClick={()=>{clearRepairs(document);setNotice('Local repairs cleared. Saved approvals remain.');}}>Clear local repairs</button>
 <LabelMemory announce={setNotice}/><p>Only merchant-marked missing names can be repaired. Keyboard alternatives are provided by this controlled merchant.</p></main>;
}
