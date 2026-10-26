// Shared source components and the standalone app must resolve one Angular DI runtime.
// Angular 22 package-export subpaths (notably core/primitives/di and common/http)
// can bypass a wildcard tsconfig path when two sibling node_modules trees exist.
import {readFile,realpath,lstat,mkdir,rename,symlink} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url)),modules=path.join(root,'node_modules'),shared=path.resolve(root,'../Mythweaver.client/node_modules');
const names=['core','common','compiler','forms','platform-browser','router'];
for(const name of names){
 const own=path.join(modules,'@angular',name),canonical=path.join(shared,'@angular',name);
 let canonicalVersion;try{canonicalVersion=JSON.parse(await readFile(path.join(canonical,'package.json'),'utf8')).version;}catch{throw new Error('Install Mythweaver.client dependencies before building EffectBuilder; its shared UI requires one Angular runtime.');}
 const ownVersion=JSON.parse(await readFile(path.join(own,'package.json'),'utf8')).version;
 if(ownVersion!==canonicalVersion)throw new Error(`Angular ${name} version mismatch: EffectBuilder ${ownVersion}, shared UI ${canonicalVersion}. Align the installed versions before building.`);
 if(await realpath(own)===await realpath(canonical))continue;
 // Only move a physical package inside this app's node_modules. Never traverse a
 // junction into another checkout or modify the shared application's installation.
 if((await lstat(own)).isSymbolicLink()||!path.relative(modules,await realpath(own)).split(path.sep).every(p=>p!=='..'))throw new Error('Unexpected linked Angular package: '+own);
 const backup=path.join(modules,'.effectbuilder-runtime-backup');await mkdir(backup,{recursive:true});
 await rename(own,path.join(backup,name+'-'+process.pid));await symlink(canonical,own,'junction');
}
console.log('Shared Angular runtime verified; shared UI installation unchanged.');
