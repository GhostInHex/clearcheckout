import {z} from 'zod';
import type Database from 'better-sqlite3';
import {cartSchema,deliverySchema} from '../shared/checkout-schema.js';
export const preferencesSchema=z.object({textSize:z.enum(['standard','large','larger']),contrast:z.boolean(),guidance:z.enum(['detailed','brief'])}).strict();
export const userSchema=z.object({id:z.string(),email:z.string(),password:z.string(),preferences:z.string(),onboarded:z.number()});
export type User=z.infer<typeof userSchema>;
export const orderSchema=z.object({id:z.string(),cart:cartSchema,delivery:deliverySchema,revision:z.number().int()}).and(z.union([
 z.object({state:z.enum(['draft','cancelled']),reviewedRevision:z.null()}),
 z.object({state:z.enum(['awaiting_confirmation','failed','completed_demo']),reviewedRevision:z.number().int()})
]));
export const bodySchema=z.object({body:z.string()});
export const statusErrorSchema=z.object({status:z.number().int(),message:z.string()});
export function fail(status:number,message:string):never {throw Object.assign(new Error(message),{status});}
export function json(text:string):unknown {return JSON.parse(text);}
export type Db=Database.Database;
export type Config={key:string;budgetMicros:number;callLimit:number};
export type Transport=(url:string,options:{method:string;redirect:'error';signal:AbortSignal;headers:Record<string,string>;body:string|FormData})=>Promise<Response>;
export type ProviderOptions={config?:Config;transport?:Transport;timeoutMs?:number};
