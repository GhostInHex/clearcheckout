import {z} from 'zod';

export const cartSchema = z.object({
  tea: z.number().int().min(0).max(9),
  mug: z.number().int().min(0).max(9),
}).strict().refine(value => value.tea + value.mug > 0, 'Keep at least one item in the cart.');
export const deliverySchema = z.enum(['standard', 'express']);
export const checkoutEventSchema = z.discriminatedUnion('type', [
  z.object({type: z.literal('change'), cart: cartSchema, delivery: deliverySchema}),
  z.object({type: z.literal('review')}),
  z.object({type: z.literal('cancel')}),
  z.object({type: z.literal('confirm'), phrase: z.string().max(80), revision: z.number().int(), outcome: z.enum(['success', 'fail'])}),
]);
export type Cart = z.infer<typeof cartSchema>;
export type Delivery = z.infer<typeof deliverySchema>;
export type CheckoutRequest = z.infer<typeof checkoutEventSchema>;
