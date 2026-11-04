const selector = 'button, input:not([type=hidden]), select, textarea, a[href], [role=button]';
const ownedLabels = new WeakMap<Element, string>();

function nameOf(element: Element) {
  const labelled = element.getAttribute('aria-labelledby');
  if (labelled?.split(/\s+/).some(id => element.ownerDocument.getElementById(id)?.textContent?.trim())) return true;
  if (element.getAttribute('aria-label')?.trim()) return true;
  if ([...((element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement || element instanceof HTMLButtonElement) ? element.labels || [] : [])].some(label => label.textContent?.trim())) return true;
  if (element instanceof HTMLInputElement) {
    if (element.type === 'image') return Boolean(element.alt?.trim());
    return ['button', 'submit', 'reset'].includes(element.type) && Boolean(element.value.trim());
  }
  if (['SELECT', 'TEXTAREA'].includes(element.tagName)) return false;
  return Boolean(element.textContent?.trim() || element.querySelector('img[alt]:not([alt=""])'));
}

function controls(root: ParentNode) {
  return [...root.querySelectorAll(selector)].filter(element => !element.closest('[data-clearcheckout-panel]'));
}

function reliableLabel(element: Element) {
  return (element.getAttribute('data-checkout-label') || element.getAttribute('title'))?.trim().slice(0, 120) || null;
}

export function scan(root: ParentNode) {
  return controls(root).filter(element => !nameOf(element)).map((element, index) => {
    const label = reliableLabel(element);
    return {element, label, description: label ? `Missing name: ${label}` : `Unknown ${element.tagName.toLowerCase()} control ${index + 1}. Needs a human label.`};
  });
}

export function repair(root: ParentNode) {
  let repaired = 0;
  for (const element of controls(root)) {
    const owned = ownedLabels.get(element);
    if (owned) {
      if (element.getAttribute('aria-label') !== owned) {
        ownedLabels.delete(element);
        element.removeAttribute('data-clearcheckout-repaired');
      } else {
        element.removeAttribute('aria-label');
        const naturalName = nameOf(element);
        const next = reliableLabel(element);
        if (!naturalName && next) {
          element.setAttribute('aria-label', next);
          ownedLabels.set(element, next);
          if (next !== owned) repaired++;
          continue;
        }
        ownedLabels.delete(element);
        element.removeAttribute('data-clearcheckout-repaired');
      }
    }
    if (!nameOf(element)) {
      const label = reliableLabel(element);
      if (label) {
        element.setAttribute('aria-label', label);
        element.setAttribute('data-clearcheckout-repaired', 'true');
        ownedLabels.set(element, label);
        repaired++;
      }
    }
  }
  return {repaired, unknown: scan(root).filter(item => !item.label).length};
}

export function observeRepairs(root: Node & ParentNode, onRepair: (result: ReturnType<typeof repair>) => void = () => {}) {
  const options = {childList: true, characterData: true, subtree: true, attributes: true,
    attributeFilter: ['aria-label', 'aria-labelledby', 'title', 'data-checkout-label', 'type', 'alt', 'for', 'id', 'value']};
  const observer = new MutationObserver(() => {
    observer.disconnect();
    try {
      const result = repair(root);
      if (result.repaired) onRepair(result);
    } finally {
      observer.observe(root, options);
    }
  });
  observer.observe(root, options);
  return () => observer.disconnect();
}

export function clearRepairs(root: ParentNode) {
  for (const element of controls(root)) {
    const owned = ownedLabels.get(element);
    if (!owned) continue;
    if (element.getAttribute('aria-label') === owned) element.removeAttribute('aria-label');
    element.removeAttribute('data-clearcheckout-repaired');
    ownedLabels.delete(element);
  }
}

export function runCommand(root: ParentNode | null, command: string) {
  const targets: Record<string, string> = {cart: '[data-checkout-cart]', delivery: '[data-checkout-delivery]', review: '[data-checkout-review]'};
  const target = root?.querySelector(targets[command] || '[data-command-never]');
  if (!(target instanceof HTMLElement)) return 'That section is not available on this page. No action was taken.';
  target.focus();
  return `Moved to ${command}. Review the details before taking an action.`;
}
export function keyboardCommand(event: KeyboardEvent) {
  if (!event.altKey || !event.shiftKey || event.ctrlKey || event.metaKey) return null;
  const keys: Record<string, string> = {c: 'cart', d: 'delivery', r: 'review'}; return keys[event.key.toLowerCase()] || null;
}
