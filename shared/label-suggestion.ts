import {z} from 'zod';
export const fixturePngSha='71f5883a37ac21bd54c1cf077e02373c2997b606ef3f73ba1e67ded7c459765e';
export const labelModel='muse-spark-1.3';
export const labelFingerprint='synthetic-cart-v1';
export const labelUpload=z.object({origin:z.literal('http://localhost:4319'),fingerprint:z.literal(labelFingerprint),nonce:z.string().regex(/^[a-f0-9]{64}$/),width:z.literal(64),height:z.literal(64),bounds:z.object({x:z.literal(32),y:z.literal(32),width:z.literal(64),height:z.literal(64)}).strict(),png:z.string().startsWith('data:image/png;base64,').max(1024)}).strict();
export const labelAdvice=z.object({text:z.string().min(1).max(80).regex(/^[A-Za-z][A-Za-z0-9 ,.?'-]*$/),model:z.literal(labelModel),cached:z.boolean()}).strict();
