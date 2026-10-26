import {build} from 'esbuild';
import {spawnSync} from 'node:child_process';
await build({entryPoints:['scripts/native-runtime.test.ts'],bundle:true,packages:'external',platform:'node',format:'esm',outfile:'dist/native-runtime.test.mjs'});
const result=spawnSync(process.execPath,['dist/native-runtime.test.mjs'],{stdio:'inherit'});process.exitCode=result.status??1;
