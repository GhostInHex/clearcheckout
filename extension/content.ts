import {mountLabelMemory} from '../shared/label-memory.js';
import {cartCapability,type CartReview} from '../shared/merchant-cart.js';
import {appOrigin} from './link.js';
import {z} from 'zod';
import {labelAdvice} from '../shared/label-suggestion.js';
import {fixtureUrl,previewResult,inspectFixture} from './crop.js';
import {scan,repair,observeRepairs,clearRepairs,runCommand,keyboardCommand} from '../shared/dom.js';
const existingHost=document.getElementById('clearcheckout-host');
if(existingHost) existingHost.dispatchEvent(new Event('clearcheckout-close'));
else {
const previousFocus=document.activeElement;
const host=document.createElement('div');host.id='clearcheckout-host';host.dataset.clearcheckoutPanel='';document.documentElement.append(host);const root=host.attachShadow({mode:'open'});
root.innerHTML=`<style>:host{all:initial}section{position:fixed;z-index:2147483647;right:16px;top:16px;width:min(340px,calc(100vw - 32px));max-height:90vh;overflow:auto;background:#faf9f4;color:#193e35;border:2px solid #193e35;border-radius:12px;padding:24px;box-sizing:border-box;font:16px/1.6 Arial}h2{font-size:1.5em;margin:0}button{font:inherit;cursor:pointer;padding:10px;border:1px solid #193e35;border-radius:5px;background:#193e35;color:white;margin:6px 0;width:100%}button:focus-visible{outline:3px solid #b34d26;outline-offset:3px}p{font-size:1em}#status{padding:12px;background:#e6edda}label{display:block}input{width:20px;height:20px}</style><section aria-label="ClearCheckout assistance"><h2>ClearCheckout.</h2><p>Local help. Your final say.</p><button id="close">Close assistance</button><button id="scan">Scan unnamed controls</button><button id="repair">Repair reliable labels</button><p id="status" role="status" aria-live="polite">No field values are read or uploaded.</p><button data-command="undo local repair">Undo local repairs</button><ol><li><button data-command="cart">Go to cart · Alt Shift C</button></li><li><button data-command="delivery">Go to delivery · Alt Shift D</button></li><li><button data-command="review">Go to review · Alt Shift R</button></li></ol><button data-command="read total">Read total with provenance</button><button data-command="back">Previous guided step</button><label><input id="large" type="checkbox"> Larger panel text</label><label><input id="speech" type="checkbox"> Speak app announcements</label><button id="reset-preferences">Reset local preferences for this origin</button><p>Only explicitly marked checkout sections support navigation. Unknown controls need a human label. Closed shadow roots and inaccessible frames cannot be inspected. Custom keyboard support is unknown. This extension never submits merchant orders or payments.</p><p>Try the full confirmation flow in the ClearCheckout demo store.</p></section>`;
function element(id:string){const node=root.getElementById(id);if(!(node instanceof HTMLElement))throw new Error(`Missing panel element ${id}`);return node;}
const status=element('status');let speak=false;
const announce=(text:string)=>{status.textContent=text;if(speak&&'speechSynthesis' in window){speechSynthesis.cancel();speechSynthesis.speak(new SpeechSynthesisUtterance(text));}};let stop=()=>{};
element('scan').onclick=()=>{const findings=scan(document);announce(`${findings.length} unnamed controls. ${findings.filter(f=>f.label).length} have explicit merchant-provided labels. ${findings.filter(f=>!f.label).length} need human review.`);};
element('repair').onclick=()=>{const result=repair(document);stop();stop=observeRepairs(document);announce(`${result.repaired} labels repaired. ${result.unknown} unknown controls unchanged. Repairs stay active.`);};
const keyboard=(e:KeyboardEvent)=>{const command=keyboardCommand(e);if(command){e.preventDefault();announce(runCommand(document,command));}};document.addEventListener('keydown',keyboard);
root.querySelectorAll('[data-command]').forEach(button=>{if(button instanceof HTMLButtonElement)button.onclick=()=>{if(button.dataset.command==='undo local repair')stop();announce(runCommand(document,button.dataset.command ?? ''));};});
const cartControls=document.createElement('div');element('status').after(cartControls);
let pendingReview:CartReview|null=null;
const controlledCart=()=>cartCapability(new URL(location.href),appOrigin);
const cartButton=(name:string,action:()=>void)=>{const button=document.createElement('button');button.textContent=name;button.onclick=action;cartControls.append(button);return button;};
const cartSummary=(cart:CartReview['cart'])=>`${cart.total.provenance==='first-party-api'?'First-party API':'Client-local'} total ${(cart.total.amount/100).toFixed(2)} ${cart.total.currency}, revision ${cart.revision}.`;
const renderCart=async()=>{
 pendingReview=null;cartControls.replaceChildren();
 const adapter=controlledCart();
 if(adapter.kind!=='controlled-store'){announce('Unsupported merchant. Scan and navigation only.');return;}
 const result=await adapter.request({kind:'read'});
 if(result.kind==='refused'){announce(result.reason);return;}
 announce(cartSummary(result.cart));
 for(const item of result.cart.items){cartButton(`Review removal of ${item.name}`,()=>{
  pendingReview={cart:result.cart,item};cartControls.replaceChildren();
  announce(`Remove all ${item.quantity} units of ${item.name}? ${cartSummary(result.cart)} Cart changes require a new review. Label undo cannot restore removed items.`);
  const confirm=cartButton(`Confirm removal of ${item.name}`,()=>{
   const review=pendingReview;if(!review)return;pendingReview=null;cartControls.replaceChildren();
   const current=controlledCart();if(current.kind!=='controlled-store'||current.store!==review.cart.store){announce('Merchant changed. Review again.');return;}
   void current.request({kind:'remove',review}).then(value=>{announce(value.kind==='refused'?value.reason:`Selected item removed. ${cartSummary(value.cart)} No purchase occurred.`);cartButton('Read controlled cart',()=>{void renderCart();}).focus();});
  });
  cartButton('Cancel removal',()=>{pendingReview=null;cartControls.replaceChildren();announce('Removal cancelled. Cart unchanged.');cartButton('Read controlled cart',()=>{void renderCart();}).focus();});confirm.focus();
 });}
};
if(location.origin===appOrigin&&['/demo','/demo/store-b'].includes(location.pathname))cartButton('Read controlled cart',()=>{void renderCart();});
const forgetMemory=location.origin===appOrigin&&['/demo','/demo/store-b'].includes(location.pathname)?mountLabelMemory(sectionForMemory(),document,announce):()=>{};
function sectionForMemory(){const section=root.querySelector('section');if(!section)throw Error('Missing panel');return section;}
let closed=false;
const close=()=>{closed=true;forgetMemory();if(speak&&'speechSynthesis' in window)speechSynthesis.cancel();stop();clearRepairs(document);document.removeEventListener('keydown',keyboard);host.remove();if(previousFocus instanceof HTMLElement && previousFocus.isConnected)previousFocus.focus();};element('close').onclick=close;host.addEventListener('clearcheckout-close',close);
if(location.href===fixtureUrl){
 const capture=document.createElement('button');capture.textContent='Preview synthetic crop locally';
 const preview=document.createElement('img');preview.alt='Local synthetic control crop. No upload.';preview.hidden=true;
 const warning=document.createElement('p');warning.textContent='Synthetic fixture only. Preview stays local until you explicitly upload. Suggestions require your review.';
 const upload=document.createElement('button');upload.textContent='Upload this synthetic crop for a suggestion';upload.hidden=true;
 const accept=document.createElement('button');accept.textContent='Accept reviewed label';accept.hidden=true;
 let pending:{nonce:string;target:HTMLButtonElement;markup:string}|undefined;let suggestion='';let owned:HTMLButtonElement|undefined;let ownedText='';
 const reset=()=>{pending=undefined;suggestion='';upload.hidden=true;accept.hidden=true;preview.hidden=true;preview.removeAttribute('src');};
 const locationTimer=setInterval(()=>{if(location.href!==fixtureUrl&&(pending||owned)){undo();reset();announce('Page changed. Preview and suggestion cleared.');}},250);
 const undo=()=>{if(owned?.getAttribute('aria-label')===ownedText)owned.removeAttribute('aria-label');owned=undefined;};
 const observer=new MutationObserver(()=>{if(pending&&(!inspectFixture()||!pending.target.isConnected||pending.target.outerHTML!==pending.markup||location.href!==fixtureUrl)){reset();announce('Fixture changed. Preview and suggestion cleared.');}});observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,characterData:true});
 host.addEventListener('clearcheckout-close',()=>{clearInterval(locationTimer);observer.disconnect();undo();reset();});
 element('close').addEventListener('click',()=>{clearInterval(locationTimer);observer.disconnect();undo();reset();});
 upload.onclick=async()=>{const value=pending;if(!value||location.href!==fixtureUrl||!inspectFixture())return;upload.hidden=true;try{const advice=labelAdvice.parse(await chrome.runtime.sendMessage({kind:'suggest-fixture',nonce:value.nonce}));if(closed||location.href!==fixtureUrl||!inspectFixture()||pending!==value||!value.target.isConnected||value.target.outerHTML!==value.markup)return;announce('Possible label: '+advice.text+'. Review before accepting.');if(advice.text.toLowerCase()!=='unknown'){suggestion=advice.text;accept.hidden=false;}}catch{if(!closed)announce('Suggestion unavailable. Keep the label unknown.');}};
 accept.onclick=()=>{const value=pending;if(!value||location.href!==fixtureUrl||!inspectFixture()||!suggestion||!value.target.isConnected||value.target.outerHTML!==value.markup)return;owned=value.target;ownedText=suggestion;pending=undefined;owned.setAttribute('aria-label',ownedText);accept.hidden=true;announce('Reviewed label applied. Close assistance to undo owned labels.');};
 element('status').after(capture,preview,warning,upload,accept);
 capture.onclick=async()=>{
  reset();capture.disabled=true;
  const nonce=Array.from(crypto.getRandomValues(new Uint8Array(32)),byte=>byte.toString(16).padStart(2,'0')).join('');
  try{
   const result=previewResult.safeParse(await chrome.runtime.sendMessage({kind:'crop-preview',nonce}));
   if(closed)return;
   if(!result.success||result.data.nonce!==nonce)throw Error('Capture refused.');
   const target=document.getElementById('fixture-control');if(!(target instanceof HTMLButtonElement))throw Error('Fixture changed.');pending={nonce,target,markup:target.outerHTML};upload.hidden=false;
   preview.src=result.data.png;preview.hidden=false;announce('Local preview ready. Nothing uploaded.');
  }catch{if(!closed)announce('Local capture refused. Fixture may be unsafe or changed.');}
  finally{capture.disabled=false;}
 };
}
element('close').focus();
const large=element('large');if(!(large instanceof HTMLInputElement))throw new Error('Missing text size input');
const section=root.querySelector('section');if(!section)throw new Error('Missing panel section');const speech=element('speech');if(!(speech instanceof HTMLInputElement))throw new Error('Missing speech input');
const preferenceKey='clearcheckout.preferences.v1';
const preferences=z.object({large:z.boolean(),expires:z.number().finite()}).strict();
const applyLarge=()=>{section.style.fontSize=large.checked?'20px':'16px';};
try{const saved=preferences.safeParse(JSON.parse(localStorage.getItem(preferenceKey)??'null'));if(saved.success&&saved.data.expires>Date.now()){large.checked=saved.data.large;applyLarge();}else localStorage.removeItem(preferenceKey);}catch{announce('Local preferences unavailable. Assistance still works.');}
large.onchange=()=>{applyLarge();try{localStorage.setItem(preferenceKey,JSON.stringify({large:large.checked,expires:Date.now()+30*24*60*60*1000}));}catch{announce('Text size changed for this opening. Local saving unavailable.');}};
speech.onchange=()=>{speak=speech.checked;if(!speak&&'speechSynthesis' in window)speechSynthesis.cancel();};
element('reset-preferences').onclick=()=>{large.checked=false;speech.checked=false;speak=false;applyLarge();if('speechSynthesis' in window)speechSynthesis.cancel();try{localStorage.removeItem(preferenceKey);announce('Local preferences for this origin reset. App speech is off.');}catch{announce('App speech is off. Local preference reset unavailable.');}};
}
