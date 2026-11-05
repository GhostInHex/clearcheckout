'use client';
import {useState} from 'react';
import Link from 'next/link';
import {repair,clearRepairs} from '../../../shared/dom';
export default function StoreB(){
 const [quantity,setQuantity]=useState(1);
 const [promo,setPromo]=useState(false);
 return <main><h1>Store B · Trail supplies</h1><nav><Link href="/demo">Store A</Link></nav><p>Controlled local demo. No purchase or upload occurs.</p>
 <section data-checkout-cart tabIndex={-1}><h2>Cart</h2><p>Trail bottle · $12 each</p>
 <div draggable onDragEnd={()=>setQuantity(value=>Math.min(9,value+1))}>Drag to increase quantity</div>
 <label>Quantity (keyboard alternative)<input type="number" min="1" max="9" value={quantity} onChange={event=>{const next=Number(event.target.value);if(Number.isInteger(next)&&next>=1&&next<=9)setQuantity(next);}}/></label>
 <p>Total ${quantity*12}</p></section>
 <div onMouseEnter={()=>setPromo(true)}>Hover to reveal promo</div>
 <button onClick={()=>setPromo(value=>!value)} aria-expanded={promo}>Show promo (keyboard alternative)</button>
 {promo && <p>Promo TRAIL saves on a future demo order.</p>}
 <section data-checkout-delivery tabIndex={-1}><h2>Delivery</h2><input data-checkout-label="Delivery instructions"/></section>
 <section data-checkout-review tabIndex={-1}><h2>Review</h2><button data-checkout-label="Read demo summary" onClick={()=>setPromo(true)}></button></section>
 <button onClick={()=>repair(document)}>Repair reliable labels</button><button onClick={()=>clearRepairs(document)}>Clear local repairs</button>
 <p>Only merchant-marked missing names can be repaired. Keyboard alternatives are provided by this controlled merchant.</p></main>;
}
