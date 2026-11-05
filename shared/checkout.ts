import type {Cart, Delivery, CheckoutRequest} from './checkout-schema.js';
export type {Cart, Delivery, CheckoutRequest} from './checkout-schema.js';
// Direct callers historically omit outcome to simulate success. HTTP requests require it.
export type CheckoutEvent = Exclude<CheckoutRequest, {type: 'confirm'}> |
  (Omit<Extract<CheckoutRequest, {type: 'confirm'}>, 'outcome'> & {outcome?: 'success' | 'fail'});
type OrderData = {cart: Cart; delivery: Delivery; revision: number};
export type Order = OrderData & (
  | {state: 'draft' | 'cancelled'; reviewedRevision: null}
  | {state: 'awaiting_confirmation' | 'failed' | 'completed_demo'; reviewedRevision: number}
);

export const catalog: Record<string, {name: string; price: number}> = { tea: { name: 'Everyday tea collection', price: 2400 }, mug: { name: 'Stoneware morning mug', price: 1800 } };
export function quote(cart: Cart, delivery: Delivery) {
  const items = Object.entries(cart).map(([id, quantity]) => ({ id, quantity, ...catalog[id] }));
  const subtotal = items.reduce((sum, item) => sum + (item.price ?? Number.NaN) * item.quantity, 0);
  const shipping = delivery === 'express' ? 800 : 0;
  return { items, subtotal, shipping, total: subtotal + shipping, currency: 'USD' };
}
export const money = (cents: number) => new Intl.NumberFormat('en-US', {style:'currency',currency:'USD'}).format(cents / 100);
export function confirmationPhrase(order: Pick<Order, 'cart' | 'delivery'>) { return `CONFIRM ${money(quote(order.cart, order.delivery).total)}`; }
export function transition(order: Order, event: CheckoutEvent): Order {
  switch (event.type) {
    case 'change':
      if (order.state === 'completed_demo') throw new Error('Start a new order after completion.');
      return {...order, cart:event.cart, delivery:event.delivery, revision:order.revision + 1, state:'draft', reviewedRevision:null};
    case 'review':
      if (!['draft','cancelled','failed','awaiting_confirmation'].includes(order.state)) throw new Error('This order cannot be reviewed.');
      return {...order, state:'awaiting_confirmation', reviewedRevision:order.revision};
    case 'confirm':
      if (order.state !== 'awaiting_confirmation' || order.reviewedRevision !== order.revision || event.revision !== order.revision) throw new Error('Review the current order before confirming.');
      if (event.phrase !== confirmationPhrase(order)) throw new Error(`Type exactly ${confirmationPhrase(order)} to confirm.`);
      return {...order, state:event.outcome === 'fail' ? 'failed' : 'completed_demo', reviewedRevision:order.revision};
    case 'cancel':
      if (order.state === 'completed_demo') throw new Error('Completed demos cannot be cancelled.');
      return {...order, state:'cancelled', reviewedRevision:null};
    default: {
      const exhaustive: never = event;
      throw new Error('Unknown checkout action.');
    }
  }
}
