import ts from 'typescript';
import assert from 'node:assert/strict';
import {readdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {build} from 'esbuild';
function sources(dir:string):string[]{return readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?sources(join(dir,entry.name)):[join(dir,entry.name)]);}
const configs=['frontend','extension','server','node-tests','checkout','browser-tests'];
const covered=new Set<string>();
const nextConfig=ts.readConfigFile('tsconfig.json',ts.sys.readFile);for(const file of ts.parseJsonConfigFileContent(nextConfig.config,ts.sys,'.').fileNames)covered.add(resolve(file));
for(const group of configs){const file=`tsconfig.${group}.json`;const read=ts.readConfigFile(file,ts.sys.readFile);assert.equal(read.error,undefined);const config=ts.parseJsonConfigFileContent(read.config,ts.sys,'.');assert.equal(config.errors.length,0);assert.equal(config.options.strict,true);assert.equal(config.options.noUncheckedIndexedAccess,true);assert.equal(config.options.exactOptionalPropertyTypes,true);assert(!config.options.allowJs);for(const source of config.fileNames)covered.add(resolve(source));console.log(`${file}: ${config.fileNames.length} direct source files`);}
const inventory=[...['app','src','shared','server','extension','tests','scripts'].flatMap(sources),...readdirSync('.').filter(file=>/\.[cm]?[jt]sx?$/.test(file))].filter(file=>/\.[cm]?[jt]sx?$/.test(file));
for(const file of inventory){assert(!/\.[cm]?js$/.test(file),`Unconverted first-party source ${file}`);assert(covered.has(resolve(file)),`Missing strict coverage ${file}`);}
for(const entry of ['src/main.tsx','extension/background.ts','extension/content.ts','shared/dom.ts']){const result=await build({entryPoints:[entry],bundle:true,platform:'browser',outdir:'build/import-check',write:false,metafile:true});for(const input of Object.keys(result.metafile.inputs))assert(!/(^|\/)(server|better-sqlite3)(\/|$)/.test(input),`Server input in browser bundle ${input}`);console.log(`Browser import exclusion passed: ${entry}`);}
console.log(`Complete source inventory passed: ${inventory.length} TypeScript files; no first-party JS exceptions.`);
