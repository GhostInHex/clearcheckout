import {z} from 'zod';
export const extensionIdSchema=z.string().regex(/^[a-p]{32}$/);
export const linkBindingSchema=z.object({extensionId:extensionIdSchema,installationId:z.string().regex(/^[a-f0-9]{64}$/),nonce:z.string().regex(/^[a-f0-9]{64}$/)}).strict();
export const exchangeSchema=linkBindingSchema.extend({code:z.string().regex(/^[a-f0-9]{64}$/)}).strict();
export const deviceScopeSchema=z.literal('labels:suggest');
export type LinkBinding=z.infer<typeof linkBindingSchema>;
