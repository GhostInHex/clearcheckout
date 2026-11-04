import {build} from 'esbuild';
import {mkdirSync,copyFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
mkdirSync('build/extension',{recursive:true});
await build({entryPoints:['extension/content.js'],bundle:true,outfile:'build/extension/content.js',format:'iife'});
for(const file of ['manifest.json','background.js']) copyFileSync(`extension/${file}`,`build/extension/${file}`);
execFileSync('zip',['-j','-q','build/clearcheckout-extension.zip','build/extension/manifest.json','build/extension/background.js','build/extension/content.js']);
