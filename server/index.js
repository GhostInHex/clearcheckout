import {existsSync} from 'node:fs';
if(existsSync('.env')) process.loadEnvFile('.env');
import {createApp} from './app.js';
const {app}=createApp({dbPath:process.env.DB_PATH || 'data/clearcheckout.sqlite',production:process.env.COOKIE_SECURE==='true',trustProxy:process.env.TRUST_PROXY==='loopback'?'loopback':false});
app.listen(Number(process.env.PORT || 3000),'0.0.0.0',()=>process.stdout.write(`ClearCheckout ready on port ${process.env.PORT || 3000}\n`));
