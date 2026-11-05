import {cpSync,copyFileSync} from 'node:fs';
cpSync('build/extension','public/extension',{recursive:true});
copyFileSync('build/clearcheckout-extension.zip','public/clearcheckout-extension.zip');
