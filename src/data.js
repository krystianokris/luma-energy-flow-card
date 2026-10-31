import {power,signed,numeric,gbp,energy,watts,money} from './model.ts';
import {weatherScene} from './weather.ts';
export {watts,money};
export function lighting(c,hass,date=new Date()){
 if(c.lighting!=='auto')return c.lighting==='night';
 const sun=hass?.states?.[c.sun||'sun.sun']?.state;
 if(sun==='below_horizon')return true;if(sun==='above_horizon')return false;
 if(hass?.states?.[c.weather]?.state==='clear-night')return true;
 let hour;try{hour=Number(new Intl.DateTimeFormat('en-GB',{hour:'2-digit',hourCycle:'h23',timeZone:hass?.config?.time_zone||'UTC'}).format(date));}catch{hour=date.getUTCHours();}
 return hour<7||hour>=19;
}
export function readings(c,hass,date){
 const entity=k=>hass?.states?.[c.entities[k]],p=k=>power(entity(k));
 const grid=c.demo?1320:signed(p('grid'),p('grid_import'),p('grid_export'),!!(c.entities.grid_import||c.entities.grid_export),!!c.invert_grid);
 const battery=c.demo?-680:signed(p('battery'),p('battery_charge'),p('battery_discharge'),!!(c.entities.battery_charge||c.entities.battery_discharge),!!c.invert_battery);
 const solar=c.demo?2400:p('solar'),home=c.demo?4400:p('home');
 const gas=entity('gas'),gasN=numeric(gas?.state);
 const powerById={grid,home,solar,battery,ev:c.demo?1800:p('ev'),heat_pump:c.demo?850:p('heat_pump'),heating:c.demo?320:p('heating')};
 const soc=c.demo?76:numeric(entity('soc')?.state);
 const available=id=>!c.hidden.includes(id)&&(id==='grid'||id==='home'||(c.demo&&['solar','battery','ev'].includes(id))||!!c.entities[id]||(id==='battery'&&!!(c.entities.soc||c.entities.battery_charge||c.entities.battery_discharge)));
 const nodes=Object.keys(c.positions).filter(available).map(id=>({id,power:powerById[id]??null,entity:c.entities[id]||(id==='grid'?c.entities.grid_import:id==='battery'?(c.entities.battery_charge||c.entities.soc):null),value:id==='gas'?(c.demo?'8.60 kWh':gasN===null?'—':`${gasN.toFixed(2)} ${gas?.attributes?.unit_of_measurement||''}`):watts(powerById[id]??null),soc:id==='battery'&&soc!==null?Math.round(Math.max(0,Math.min(100,soc))):null}));
 return {nodes,night:lighting(c,hass,date),scene:c.weather_mode==='auto'?(weatherScene(hass?.states?.[c.weather]?.state)||'clear'):c.weather_mode,weatherAvailable:!!weatherScene(hass?.states?.[c.weather]?.state),cost:money(c.demo?2.84:gbp(entity('today_cost'))),used:c.demo?'14.20':energy(entity('today_energy'))?.toFixed(2)??'—',rate:c.demo?21.9:gbp(entity('rate'),true)===null?null:gbp(entity('rate'),true)*100,next:c.demo?16.5:gbp(entity('next_rate'),true)===null?null:gbp(entity('next_rate'),true)*100,gasCost:money(c.demo?.73:gbp(entity('gas_cost')))};
}
