import {Window} from 'happy-dom';
import {plugin} from 'bun';
import {readFileSync} from 'node:fs';
const dom=new Window({url:'http://localhost/'});
for(const key of ['window','document','HTMLElement','customElements','CustomEvent','Event','MouseEvent','Node'])Object.defineProperty(globalThis,key,{value:dom[key],configurable:true,writable:true});
plugin({name:'test-static-assets',setup(build){
 build.onLoad({filter:/\.css$/},({path})=>({contents:`export default ${JSON.stringify(readFileSync(path,'utf8'))}`,loader:'js'}));
 build.onLoad({filter:/\.webp$/},({path})=>({contents:`export default ${JSON.stringify('data:image/webp;base64,'+readFileSync(path).toString('base64'))}`,loader:'js'}));
}});
