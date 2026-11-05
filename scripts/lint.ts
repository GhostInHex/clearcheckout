import {ESLint} from 'eslint';
const eslint=new ESLint();
const results=await eslint.lintFiles(['app','next.config.ts','src','shared','server','extension','tests','scripts','vite.config.ts','eslint.config.ts']);
const formatter=await eslint.loadFormatter('stylish');
process.stdout.write(await formatter.format(results));
if(results.some(result=>result.errorCount || result.warningCount))process.exitCode=1;
else console.log(`Lint passed for ${results.length} sources.`);
