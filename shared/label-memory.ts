import {z} from 'zod';
import {registry,applyApprovedLabel,type Control} from './dom.js';
export const memoryKey='clearcheckout.approved-labels.v1';
const lifetime=7*24*60*60*1000;
const digestSchema=z.string().regex(/^[a-f0-9]{64}$/);
const labelSchema=z.string().min(1).max(80).regex(/^[A-Za-z][A-Za-z .,!?'-]*$/).refine(value=>!/(password|card|payment|pay |email|address|secret|token|credential|account|phone)/i.test(value));
const entrySchema=z.object({key:digestSchema,fingerprint:digestSchema,label:labelSchema,expires:z.number().int().nonnegative()}).strict();
const memorySchema=z.object({origin:z.string().max(200),entries:z.array(entrySchema).max(20)}).strict();
type Entry=z.infer<typeof entrySchema>;
export function readLabelMemory(storage:Storage,origin:string,now:number):Entry[]{
 const raw=storage.getItem(memoryKey);
 if(!raw)return [];
 try{
  if(raw.length>12000)throw Error('Oversized memory');
  const saved=memorySchema.parse(JSON.parse(raw));
  if(saved.origin!==origin)throw Error('Wrong origin');
  if(new Set(saved.entries.map(entry=>entry.key)).size!==saved.entries.length)throw Error('Duplicate memory');
  return saved.entries.filter(entry=>entry.expires>now&&entry.expires<=now+lifetime);
 }catch{storage.removeItem(memoryKey);return [];}
}
async function digest(value:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),byte=>byte.toString(16).padStart(2,'0')).join('');}
function candidates(root:ParentNode){
 return registry(root).filter(control=>control.element.matches('button[data-checkout-label]') && control.sensitivity!=='sensitive' && control.label===control.element.getAttribute('data-checkout-label') && labelSchema.safeParse(control.element.getAttribute('data-checkout-label')).success);
}
async function identity(control:Control){
 return {key:await digest(JSON.stringify([location.pathname,control.element.id,control.element.localName,control.element.getAttribute('data-checkout-label')])),fingerprint:await digest(control.fingerprint)};
}
export function mountLabelMemory(container:HTMLElement,root:ParentNode,announce:(message:string)=>void,clock:()=>number=Date.now){
 const doc=container.ownerDocument;
 const section=doc.createElement('div');section.setAttribute('role','region');section.setAttribute('aria-label','Approved label memory');section.dataset.clearcheckoutPanel='';
 const explanation=doc.createElement('p');explanation.textContent='Remember only a reviewed nonsensitive merchant label for this origin for seven days. Origin storage is visible to this merchant. Undo clears current assistance. Forget deletes saved approvals.';
 const list=doc.createElement('div');
 const button=(name:string,action:()=>void)=>{const node=doc.createElement('button');node.textContent=name;node.onclick=action;section.append(node);return node;};
 section.append(explanation,list);container.append(section);
 let disposed=false;
 let generation=0;
 const save=(entries:Entry[])=>localStorage.setItem(memoryKey,JSON.stringify({origin:location.origin,entries}));
 const inspect=async(restore=false)=>{
  const ticket=++generation;
  try{
   const entries=readLabelMemory(localStorage,location.origin,clock());
   const controls=candidates(root);
   const identities=await Promise.all(controls.map(identity));
   if(disposed||ticket!==generation)return;
   const valid=entries.filter(entry=>identities.filter((item,index)=>item.key===entry.key&&item.fingerprint===entry.fingerprint&&controls[index]?.element.getAttribute('data-checkout-label')===entry.label).length===1);
   save(valid);list.replaceChildren();
   const summary=doc.createElement('p');summary.textContent=`${valid.length} approved labels saved for this origin.`;list.append(summary);
   for(const control of controls){
    const value=await identity(control);
    if(disposed||ticket!==generation)return;
    const label=control.element.getAttribute('data-checkout-label');
    if(!label||identities.filter(item=>item.key===value.key).length!==1)continue;
    const row=doc.createElement('div');row.setAttribute('role','group');row.setAttribute('aria-label',label);
    const description=doc.createElement('p');description.textContent=label;row.append(description);
    const approve=doc.createElement('button');approve.textContent='Remember reviewed label';
    approve.onclick=()=>{void (async()=>{
     try{
      const current=candidates(root).find(item=>item.element===control.element);
      if(!current||current.fingerprint!==control.fingerprint){announce('Control changed. Review again.');return;}
      const stored=readLabelMemory(localStorage,location.origin,clock()).filter(entry=>entry.key!==value.key);
      if(stored.length>=20){announce('Memory is full. Forget labels before adding more.');return;}
      save([...stored,{...value,label,expires:clock()+lifetime}]);announce(`Approved label remembered: ${label}.`);
     }catch{announce('Local label saving unavailable.');}
    })();};row.append(approve);list.append(row);
    const entry=valid.find(item=>item.key===value.key);
    if(restore&&entry)applyApprovedLabel(control);
   }
  }catch{announce('Local label memory unavailable.');}
 };
 button('Inspect approved label memory',()=>{void inspect();});
 button('Forget approved label memory',()=>{generation++;try{localStorage.removeItem(memoryKey);list.replaceChildren();announce('Saved label approvals forgotten. Current repairs remain until undo.');}catch{announce('Local label reset unavailable.');}});
 const observer=new MutationObserver(records=>{
  if(records.every(record=>record.target instanceof Element&&record.target.closest('[data-clearcheckout-panel]')))return;
  void (async()=>{
   try{
    const raw=localStorage.getItem(memoryKey);
    const entries=readLabelMemory(localStorage,location.origin,clock());
    const controls=candidates(root);
    const identities=await Promise.all(controls.map(identity));
    const valid=entries.filter(entry=>identities.filter((item,index)=>item.key===entry.key&&item.fingerprint===entry.fingerprint&&controls[index]?.element.getAttribute('data-checkout-label')===entry.label).length===1);
    if(!disposed&&localStorage.getItem(memoryKey)===raw&&valid.length!==entries.length)save(valid);
   }catch{ /* Storage may be unavailable on a merchant origin. */ }
  })();
 });
 observer.observe(doc.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['aria-label','aria-labelledby','data-checkout-label','type','role','id']});
 void inspect(true);
 return ()=>{disposed=true;generation++;observer.disconnect();section.remove();};
}
