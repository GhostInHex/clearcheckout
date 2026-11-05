import {parseCommand} from './commands.js';
import {merchantAdapter} from './merchants.js';
const selector = 'button, input:not([type=hidden]), select, textarea, a[href], [role=button], [role=slider], [role=checkbox]';
type Provenance = 'merchant' | 'accessible-name' | 'unknown';
export interface Control {
  id: string;
  element: Element;
  fingerprint: string;
  provenance: Provenance;
  label: string | null;
  sensitivity: 'sensitive' | 'unknown';
  capabilities: readonly ('focus' | 'native-keyboard' | 'custom-keyboard-unknown')[];
}
const identities = new WeakMap<Element, string>();
const ownedLabels = new WeakMap<Element, string>();
let sequence = 0;
function isInput(element: Element): element is HTMLInputElement {
  const view = element.ownerDocument.defaultView;
  return Boolean(view && element instanceof view.HTMLInputElement);
}
function isForm(element: Element): element is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLButtonElement {
  const view = element.ownerDocument.defaultView;
  return Boolean(view && (element instanceof view.HTMLInputElement || element instanceof view.HTMLSelectElement || element instanceof view.HTMLTextAreaElement || element instanceof view.HTMLButtonElement));
}
function isHtml(element: Element): element is HTMLElement {
  const view = element.ownerDocument.defaultView;
  return Boolean(view && element instanceof view.HTMLElement);
}
function text(element: Element, includeHidden = false): string {
  const view = element.ownerDocument.defaultView;
  return [...element.childNodes].map(node => node.nodeType === 3 ? node.textContent ?? '' : view && node instanceof view.Element && !node.matches('script,style') && (includeHidden || (!node.matches('[hidden],[aria-hidden=true]') && view.getComputedStyle(node).display !== 'none' && view.getComputedStyle(node).visibility !== 'hidden')) ? text(node, includeHidden) : '').join(' ').trim();
}
function nameOf(element: Element): string {
  const root = element.getRootNode();
  const ids = element.getAttribute('aria-labelledby')?.trim().split(/\s+/) ?? [];
  const references = ids.map(id => 'getElementById' in root && typeof root.getElementById === 'function' ? root.getElementById(id) : null).filter((node): node is Element => node !== null);
  if (references.length) return references.map(node => text(node, true)).join(' ').trim();
  const aria = element.getAttribute('aria-label')?.trim();
  if (aria) return aria;
  if (isForm(element)) {
    const labels = [...element.labels ?? []].map(label => text(label)).join(' ').trim();
    if (labels) return labels;
  }
  if (isInput(element)) {
    if (element.type === 'image') return element.alt.trim();
    if (['button','submit','reset'].includes(element.type)) return element.value.trim() || (element.type === 'submit' ? 'Submit' : element.type === 'reset' ? 'Reset' : '');
    return '';
  }
  if (element.matches('select,textarea')) return '';
  return text(element) || element.querySelector('img[alt]')?.getAttribute('alt')?.trim() || '';
}
function controls(root: ParentNode, visible = true): Element[] {
  const result: Element[] = [];
  for (const element of root.querySelectorAll('*')) {
    if (element.closest('[data-clearcheckout-panel]')) continue;
    if (element.matches(selector) && (!visible || (!element.closest('[hidden],[inert],[aria-hidden=true]') && element.getClientRects().length && element.ownerDocument.defaultView?.getComputedStyle(element).visibility !== 'hidden'))) result.push(element);
    if (element.shadowRoot) result.push(...controls(element.shadowRoot, visible));
  }
  return result;
}
function reliableLabel(element: Element) {
  return element.getAttribute('data-checkout-label')?.trim().slice(0,120) || null;
}
export function registry(root: ParentNode): Control[] {
  return controls(root).map(element => {
    let id = identities.get(element);
    if (!id) { id = `local-control-${++sequence}`; identities.set(element,id); }
    const name = nameOf(element);
    const label = name || reliableLabel(element);
    return {id,element,fingerprint: JSON.stringify([element.localName,element.getAttribute('role'),element.getAttribute('type'),element.getAttribute('data-checkout-label'),name]),label,
      provenance: name ? 'accessible-name' : label ? 'merchant' : 'unknown',
      sensitivity: isInput(element) && (element.type === 'password' || /cc-|email|tel/.test(element.autocomplete)) ? 'sensitive' : 'unknown',
      capabilities: element.matches('button,input,select,textarea,a[href]') ? ['focus','native-keyboard'] : ['focus','custom-keyboard-unknown']};
  });
}
export function scan(root: ParentNode) {
  return registry(root).filter(control => !nameOf(control.element)).map(control => ({...control, description: control.label ? `Missing name: ${control.label}` : `Unknown ${control.element.localName} control. Needs a human label.`}));
}
export function repair(root: ParentNode) {
  let repaired = 0;
  for (const element of controls(root)) {
    const owned = ownedLabels.get(element);
    if (owned) {
      if (element.getAttribute('aria-label') !== owned) {
        ownedLabels.delete(element); element.removeAttribute('data-clearcheckout-repaired');
      } else {
        element.removeAttribute('aria-label');
        const next = reliableLabel(element);
        if (!nameOf(element) && next) {
          element.setAttribute('aria-label',next); ownedLabels.set(element,next);
          if (next !== owned) repaired++;
          continue;
        }
        ownedLabels.delete(element); element.removeAttribute('data-clearcheckout-repaired');
      }
    }
    if (!nameOf(element)) {
      const label = reliableLabel(element);
      if (label) { element.setAttribute('aria-label',label); element.setAttribute('data-clearcheckout-repaired','true'); ownedLabels.set(element,label); repaired++; }
    }
  }
  return {repaired,unknown:scan(root).filter(item => !item.label).length};
}
export function observeRepairs(root: Node & ParentNode, onRepair: (result: ReturnType<typeof repair>) => void = () => {}) {
  const options = {childList:true,characterData:true,subtree:true,attributes:true,attributeFilter:['aria-label','aria-labelledby','data-checkout-label','type','alt','for','id','value','hidden','style','class','aria-hidden']};
  const observer = new MutationObserver(() => {
    observer.disconnect();
    try { const result=repair(root); if(result.repaired) onRepair(result); }
    finally { connect(); }
  });
  function connect() {
    observer.observe(root,options);
    for(const element of root.querySelectorAll('*')) if(element.shadowRoot && !element.closest('[data-clearcheckout-panel]')) observeShadow(element.shadowRoot);
  }
  function observeShadow(shadow: ShadowRoot) {
    observer.observe(shadow,options);
    for(const element of shadow.querySelectorAll('*')) if(element.shadowRoot) observeShadow(element.shadowRoot);
  }
  connect();
  return () => observer.disconnect();
}
export function clearRepairs(root: ParentNode) {
  for(const element of controls(root, false)) {
    const owned=ownedLabels.get(element); if(!owned) continue;
    if(element.getAttribute('aria-label')===owned) element.removeAttribute('aria-label');
    element.removeAttribute('data-clearcheckout-repaired'); ownedLabels.delete(element);
  }
}
const navigationHistory=new WeakMap<ParentNode,Array<'cart'|'delivery'|'review'>>();
export function runCommand(root: ParentNode | null, command: string) {
  const parsed=parseCommand(command);
  if(parsed.kind==='undo-local-repair' && root){clearRepairs(root);return 'Owned local labels undone. Merchant changes are preserved.';}
  if(parsed.kind==='read-total'&&root){
    const totals=root.querySelectorAll('[data-checkout-total]');
    return totals.length===1?`Unverified DOM total: ${totals[0]?.textContent?.trim()}. Use merchant review to verify.`:'No unique total is available. No action was taken.';
  }
  if(parsed.kind==='back'&&root){
    const history=navigationHistory.get(root)??[];
    if(history.length<2)return 'No previous guided step. No action was taken.';
    const destination=history[history.length-2];
    if(!destination||!merchantAdapter(root).navigate(destination))return 'Previous section unavailable. No action was taken.';
    history.pop();return `Moved back to ${destination}.`;
  }
  if(parsed.kind!=='navigate'||!root)return 'Command unavailable. No action was taken.';
  if(!merchantAdapter(root).navigate(parsed.destination))return 'That section is not available on this page. No action was taken.';
  const history=navigationHistory.get(root)??[];
  if(history[history.length-1]!==parsed.destination)history.push(parsed.destination);
  navigationHistory.set(root,history);
  return `Moved to ${parsed.destination}. Review the details before taking an action.`;
}
export function keyboardCommand(event: KeyboardEvent) {
  if(!event.altKey || !event.shiftKey || event.ctrlKey || event.metaKey) return null;
  const keys: Record<string,string>={c:'cart',d:'delivery',r:'review'}; return keys[event.key.toLowerCase()] || null;
}
