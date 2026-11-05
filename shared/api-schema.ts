import {z} from 'zod';
import {cartSchema,deliverySchema} from './checkout-schema.js';
export const preferencesSchema=z.object({textSize:z.enum(['standard','large','larger']),contrast:z.boolean(),guidance:z.enum(['detailed','brief'])}).strict();
export const orderSchema=z.object({id:z.string(),cart:cartSchema,delivery:deliverySchema,revision:z.number().int()}).and(z.union([
 z.object({state:z.enum(['draft','cancelled']),reviewedRevision:z.null()}),
 z.object({state:z.enum(['awaiting_confirmation','failed','completed_demo']),reviewedRevision:z.number().int()})
]));

export const publicUserSchema=z.object({id:z.string(),email:z.string(),preferences:preferencesSchema,onboarded:z.boolean()});
export const quoteSchema=z.object({items:z.array(z.object({id:z.string(),name:z.string(),price:z.number(),quantity:z.number()})),subtotal:z.number(),shipping:z.number(),total:z.number(),currency:z.string()});
export const checkoutResponseSchema=orderSchema.and(z.object({quote:quoteSchema,phrase:z.string()}));
export const explanationSchema=z.object({text:z.string(),cached:z.boolean()});
export const boxSchema=z.object({id:z.string(),x1:z.number(),y1:z.number(),x2:z.number(),y2:z.number(),w:z.number(),h:z.number()});
export const boxesSchema=z.object({boxes:z.array(boxSchema)});
export const errorSchema=z.object({error:z.string()});
export const errorMessage=(error:unknown)=>error instanceof Error?error.message:String(error);
export type PublicUser=z.infer<typeof publicUserSchema>;
export type CheckoutResponse=z.infer<typeof checkoutResponseSchema>;
