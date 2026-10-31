import {mkdir,readFile,writeFile} from 'node:fs/promises';
await mkdir('dist',{recursive:true});
const result=await Bun.build({entrypoints:['src/card.js'],target:'browser',format:'esm',minify:true,loader:{'.css':'text'},plugins:[{name:'embedded-assets',setup(build){build.onLoad({filter:/\.css$/},async({path})=>({contents:(await readFile(path,'utf8')).replace(/\r\n?/g,'\n'),loader:'text'}));build.onLoad({filter:/\.webp$/},async({path})=>({contents:`export default ${JSON.stringify('data:image/webp;base64,'+(await readFile(path)).toString('base64'))}`,loader:'js'}));}}]});
if(!result.success)throw new Error(result.logs.join('\n'));
const code=await result.outputs[0].text();
if((code.match(/data:image\/webp;base64,/g)||[]).length!==6)throw new Error('All six WebP backgrounds must be embedded.');
await writeFile('dist/luma-energy-flow-card.js',`/*! Luma Energy Flow Card v${JSON.parse(await readFile('package.json','utf8')).version} | MIT | Copyright 2026 Krystian (krystianokris) */\n${code}`);
console.log('Built standalone card with embedded WebP backgrounds:',code.length,'bytes');
