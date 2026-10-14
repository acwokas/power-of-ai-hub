import fs from 'node:fs';import path from 'node:path';import ts from 'typescript';
export function moduleURL(file){
 const source=fs.readFileSync(file,'utf8').replace(/from\s+(['"])(\.\.?\/[^'"]+)\1/g,(_,quote,spec)=>{const target=path.resolve(path.dirname(file),spec);return 'from '+JSON.stringify(moduleURL(fs.existsSync(target)?target:target+'.ts'));});
 return 'data:text/javascript;base64,'+Buffer.from(ts.transpile(source,{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022})).toString('base64');
}
export const loadModule=file=>import(moduleURL(file));
