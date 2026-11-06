import assert from 'node:assert/strict';
import type {Server} from 'node:http';
import {z} from 'zod';
export function port(server:Server){const address=server.address();assert(address && typeof address!=='string');return address.port;}
export function cookie(response:Response){const value=response.headers.get('set-cookie');assert(value);const first=value.split(';')[0];assert(first);return first;}
export function stringBody(body:string|FormData){assert.equal(typeof body,'string');return z.string().parse(body);}
export function audioRequest(body:string|FormData){assert(body instanceof FormData);const value=body.get('request');assert(value instanceof Blob);return value.text();}
export const scalarRow=z.object({n:z.number().optional(),total:z.number().optional(),reserved:z.number().optional(),status:z.string().optional(),password:z.string().optional()});
