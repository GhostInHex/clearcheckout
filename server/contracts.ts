import {z} from 'zod';
import type Database from 'better-sqlite3';
export {preferencesSchema,orderSchema} from '../shared/api-schema.js';
export const userSchema=z.object({id:z.string(),email:z.string(),password:z.string(),preferences:z.string(),onboarded:z.number()});
export type User=z.infer<typeof userSchema>;
export const bodySchema=z.object({body:z.string()});
export const statusErrorSchema=z.object({status:z.number().int(),message:z.string()});
export function fail(status:number,message:string):never {throw Object.assign(new Error(message),{status});}
export function json(text:string):unknown {return JSON.parse(text);}
export type Db=Database.Database;
export type Config={key:string;budgetMicros:number;callLimit:number};
export type Transport=(url:string,options:{method:string;redirect:'error';signal:AbortSignal;headers:Record<string,string>;body:string|FormData})=>Promise<Response>;
export type ProviderOptions={config?:Config;transport?:Transport;timeoutMs?:number};
