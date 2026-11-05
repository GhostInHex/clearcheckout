'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {repair,clearRepairs} from '../../../shared/dom';
export default function StoreB(){
 const current=useRef({revision:1,quantity:1});
 const [quantity,renderQuantity]=useState(1);
 const [review,setReview]=useState<{revision:number;quantity:number}|null>(null);
 const [notice,setNotice]=useState('');
 const removalPanel=useRef<HTMLElement|null>(null);
 useEffect(()=>{if(review)removalPanel.current?.focus();},[review]);
 function setQuantity(next:number){current.current={revision:current.current.revision+1,quantity:next};renderQuantity(next);}
 function confirm(){
  if(!review||review.revision!==current.current.revision||review.quantity!==current.current.quantity){setNotice('Cart changed. Review the current item again.');setReview(null);return;}
  setQuantity(0);setReview(null);setNotice('Trail bottle removed. Cart is empty. Total $0. No purchase occurred.');
 }
 const [promo,setPromo]=useState(false);
 return <main><h1>Store B · Trail supplies</h1><nav><Link href="/demo">Store A</Link></nav><p>Controlled local demo. No purchase or upload occurs.</p>
 <section data-checkout-cart tabIndex={-1}><h2>Cart</h2><p>Trail bottle · $12 each</p>
 <div draggable onDragEnd={()=>setQuantity(Math.min(9,current.current.quantity+1))}>Drag to increase quantity</div>
 <label>Quantity (keyboard alternative)<input type="number" min="1" max="9" value={quantity} onChange={event=>{const next=Number(event.target.value);if(Number.isInteger(next)&&next>=1&&next<=9)setQuantity(next);}}/></label>
 <p data-checkout-total>Total ${quantity*12}</p><p>Revision {current.current.revision}</p>
 {quantity>0&&<button onClick={()=>setReview({...current.current})}>Review removal of Trail bottle</button>}
 {review&&<section aria-label="Removal review" tabIndex={-1} ref={removalPanel}><h3>Remove Trail bottle?</h3><p>Remove all {review.quantity} units. Result: empty cart, total $0. This cannot be undone by label undo.</p><button onClick={confirm}>Confirm removal of Trail bottle</button><button onClick={()=>{setReview(null);setNotice('Removal cancelled. Cart unchanged.');}}>Cancel removal</button></section>}
 <p role="status">{notice}</p></section>
 <div onMouseEnter={()=>setPromo(true)}>Hover to reveal promo</div>
 <button onClick={()=>setPromo(value=>!value)} aria-expanded={promo}>Show promo (keyboard alternative)</button>
 {promo && <p>Promo TRAIL saves on a future demo order.</p>}
 <section data-checkout-delivery tabIndex={-1}><h2>Delivery</h2><input data-checkout-label="Delivery instructions"/></section>
 <section data-checkout-review tabIndex={-1}><h2>Review</h2><button data-checkout-label="Read demo summary" onClick={()=>setPromo(true)}></button></section>
 <button onClick={()=>repair(document)}>Repair reliable labels</button><button onClick={()=>clearRepairs(document)}>Clear local repairs</button>
 <p>Only merchant-marked missing names can be repaired. Keyboard alternatives are provided by this controlled merchant.</p></main>;
}
