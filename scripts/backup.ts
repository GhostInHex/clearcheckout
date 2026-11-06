import {backup,restore} from '../server/backup.js';
import {z} from 'zod';
try{
 const [command,...args]=process.argv.slice(2);
 if(command==='create'){
  const [db,media,keyFile,output]=z.tuple([z.string(),z.string(),z.string(),z.string()]).parse(args);
  await backup({db,media,keyFile,output});
 }else if(command==='restore'){
  const [input,keyFile,destination]=z.tuple([z.string(),z.string(),z.string()]).parse(args);
  restore({input,keyFile,destination});
 }else throw Error('Invalid command');
 process.stdout.write('Operation complete.\n');
}catch{process.stderr.write('Backup operation failed. Check paths, permissions, writer state and backup compatibility.\n');process.exitCode=1;}
