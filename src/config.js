export const VIEWS=['classic','rings','river','tiles','overview','schematic'];
export const DEVICES=['grid','home','solar','battery','soc','ev','gas','heat_pump','heating','rate','next_rate','today_cost','today_energy','gas_cost','grid_import','grid_export','battery_charge','battery_discharge'];
export const POSITIONS={grid:[12,35],solar:[68,12],home:[87,48],battery:[48,82],ev:[22,80],gas:[86,82],heat_pump:[66,48],heating:[66,82]};
export function normalize(config){
 if(!config||typeof config!=='object')throw new Error('Luma: configuration must be an object.');
 const c={type:'custom:luma-energy-flow-card',title:'Luma Energy Flow',view:'classic',theme:'navy',demo:false,lighting:'auto',weather_mode:'auto',idle_threshold:10,language:'auto',...config};
 if(!VIEWS.includes(c.view))throw new Error('Luma: unsupported view.');
 if(!['navy','glass'].includes(c.theme))throw new Error('Luma: theme must be navy or glass.');
 if(!['auto','day','night'].includes(c.lighting))throw new Error('Luma: lighting must be auto, day or night.');
 if(!['auto','clear','cloudy','rain','storm','snow','fog'].includes(c.weather_mode))throw new Error('Luma: unsupported weather mode.');
 c.entities=Object.fromEntries(DEVICES.filter(k=>typeof c.entities?.[k]==='string'&&c.entities[k].trim()).map(k=>[k,c.entities[k].trim()]));
 c.positions={...POSITIONS};
 for(const k of Object.keys(POSITIONS)){const p=config.positions?.[k];if(Array.isArray(p)&&p.length===2&&p.every(Number.isFinite))c.positions[k]=p.map(n=>Math.max(3,Math.min(97,n)));}
 c.hidden=Array.isArray(c.hidden)?c.hidden.filter(k=>k in POSITIONS):[];
 c.idle_threshold=Number.isFinite(c.idle_threshold)?Math.max(0,Math.min(1000,c.idle_threshold)):10;
 c.demo=c.demo===true;
 return c;
}
export function cleanConfig(c){
 const out={...c};delete out.positions;const positions={};
 for(const [k,p]of Object.entries(c.positions||{}))if(JSON.stringify(p)!==JSON.stringify(POSITIONS[k]))positions[k]=p;
 if(Object.keys(positions).length)out.positions=positions;
 return out;
}
