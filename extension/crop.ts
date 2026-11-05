import {z} from 'zod';
export const fixtureUrl='http://localhost:4319/fixtures/label-crop.html';
export const cropRequest=z.object({kind:z.literal('crop-preview'),nonce:z.string().regex(/^[a-f0-9]{64}$/)}).strict();
export const previewResult=z.object({kind:z.literal('local-preview'),nonce:z.string(),png:z.string().startsWith('data:image/png;base64,').max(100000),width:z.literal(64),height:z.literal(64)}).strict();

export function inspectFixture(){
 if(location.href!=='http://localhost:4319/fixtures/label-crop.html'||window.top!==window||window.devicePixelRatio!==1||window.scrollX!==0||window.scrollY!==0)return null;
 const target=document.getElementById('fixture-control');
 if(!(target instanceof HTMLButtonElement)||target.outerHTML!=='<button id="fixture-control" type="button"><svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true"><path d="M4 8h24l-3 14H8z" fill="#193e35"></path></svg></button>')return null;
 const box=target.getBoundingClientRect();
 if(box.x!==32||box.y!==32||box.width!==64||box.height!==64||innerWidth<128||innerHeight<128)return null;
 const style=getComputedStyle(target);
 if(style.transform!=='none'||style.opacity!=='1'||style.visibility!=='visible')return null;
 for(let y=32;y<96;y+=4)for(let x=32;x<96;x+=4){const top=document.elementFromPoint(x,y);if(!top||!(top===target||target.contains(top)))return null;}
 for(const node of document.querySelectorAll('body *')){
  if(node===target||target.contains(node)||node.contains(target))continue;
  const rect=node.getBoundingClientRect();
  if(rect.width&&rect.height&&rect.left<104&&rect.right>24&&rect.top<104&&rect.bottom>24)return null;
 }
 if(document.querySelector('input,textarea,select,[contenteditable],iframe,canvas,video,img'))return null;
 return {width:innerWidth,height:innerHeight,fingerprint:target.outerHTML};
}
