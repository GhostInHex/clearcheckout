import {existsSync} from 'node:fs';
if(existsSync('.env')) process.loadEnvFile('.env');
import {createApp} from './app.js';
const {app}=createApp({dbPath:process.env.DB_PATH || 'data/clearcheckout.sqlite',production:process.env.COOKIE_SECURE==='true'});
app.listen(Number(process.env.PORT || 3000),'0.0.0.0',()=>process.stdout.write(`ClearCheckout ready on port ${process.env.PORT || 3000}\n`));
