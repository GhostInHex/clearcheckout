function nameOf(el) {
  const labelled = el.getAttribute('aria-labelledby');
  if (labelled && labelled.split(/\s+/).some(id => el.ownerDocument.getElementById(id)?.textContent.trim())) return true;
  return Boolean(el.getAttribute('aria-label')?.trim() || el.labels?.length || (el.tagName === 'INPUT' && ['button','submit'].includes(el.type) && el.value) || el.textContent.trim() || el.querySelector('img[alt]:not([alt=""])'));
}
export function scan(root) {
  return [...root.querySelectorAll('button, input:not([type=hidden]), select, textarea, a[href], [role=button]')]
    .filter(el => !el.closest('[data-clearcheckout-panel]') && !nameOf(el))
    .map((element, index) => {
      const label = element.getAttribute('data-checkout-label') || element.getAttribute('title');
      return {element, label:label?.trim().slice(0,120) || null, description:label ? `Missing name: ${label}` : `Unknown ${element.tagName.toLowerCase()} control ${index + 1}. Needs a human label.`};
    });
}
export function repair(root) {
  const findings = scan(root);
  for (const finding of findings) if (finding.label) {
    finding.element.setAttribute('aria-label', finding.label);
    finding.element.setAttribute('data-clearcheckout-repaired','true');
  }
  return { repaired:findings.filter(item => item.label).length, unknown:findings.filter(item => !item.label).length };
}
export function observeRepairs(root, onRepair = () => {}) {
  const observer = new MutationObserver(() => { const result = repair(root); if (result.repaired) onRepair(result); });
  observer.observe(root,{childList:true,subtree:true});
  return () => observer.disconnect();
}
export function runCommand(root, command) {
  const targets = {cart:'[data-checkout-cart]', delivery:'[data-checkout-delivery]', review:'[data-checkout-review]'};
  const target = root.querySelector(targets[command] || '[data-command-never]');
  if (!target) return 'That section is not available on this page. No action was taken.';
  target.focus();
  return `Moved to ${command}. Review the details before taking an action.`;
}
export function keyboardCommand(event) {
  if (!event.altKey || !event.shiftKey || event.ctrlKey || event.metaKey) return null;
  return {c:'cart',d:'delivery',r:'review'}[event.key.toLowerCase()] || null;
}
