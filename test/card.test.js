import {test,expect,afterEach} from 'bun:test';
import {LumaEnergyFlowCard,ART} from '../src/card.js';
import {normalize} from '../src/config.js';
import {readings,lighting} from '../src/data.js';
const sensor=(state,unit)=>({state:String(state),attributes:{unit_of_measurement:unit}});
const cfg={entities:{grid:'sensor.grid',home:'sensor.home',rate:'sensor.rate',today_cost:'sensor.cost',today_energy:'sensor.used'},weather:'weather.home'};
const hass={config:{time_zone:'Europe/London'},states:{'sensor.grid':sensor(1.2,'kW'),'sensor.home':sensor(900,'W'),'sensor.rate':sensor(-.02,'GBP/kWh'),'sensor.cost':sensor(284,'p'),'sensor.used':sensor(14200,'Wh'),'weather.home':{state:'rainy'},'sun.sun':{state:'above_horizon'}}};
afterEach(()=>document.body.replaceChildren());
const mount=(config=cfg)=>{const card=new LumaEnergyFlowCard();card.setConfig(config);card.hass=hass;document.body.append(card);return card;};
test('HA setter updates values without replacing nodes or animations',()=>{
 const card=mount(),node=card.shadowRoot.querySelector('[data-node=grid]'),path=card.shadowRoot.querySelector('.particles');
 expect(node.querySelector('.value').textContent).toBe('1.20 kW');
 card.hass={...hass,states:{...hass.states,'sensor.grid':sensor(810,'W')}};
 expect(card.shadowRoot.querySelector('[data-node=grid]')).toBe(node);expect(card.shadowRoot.querySelector('.particles')).toBe(path);expect(node.querySelector('.value').textContent).toBe('810 W');
});
test('real card never calls services; click dispatches HA more-info',()=>{
 const card=mount();let id;card.addEventListener('hass-more-info',e=>id=e.detail.entityId);card.shadowRoot.querySelector('[data-node=grid]').click();expect(id).toBe('sensor.grid');
});
test('demo is explicit and cannot issue device actions',()=>{
 const card=mount({...cfg,demo:true});let calls=0;card.addEventListener('hass-more-info',()=>calls++);card.shadowRoot.querySelector('[data-node=grid]').click();expect(calls).toBe(0);expect(card.shadowRoot.querySelector('.mode').textContent).toContain('DEMO');
 expect(normalize({}).demo).toBe(false);
});
test('all manual weather choices update without Image constructor or replacing cards',()=>{
 const card=mount(),node=card.shadowRoot.querySelector('[data-node=grid]');
 for(const value of ['clear','cloudy','rain','storm','snow','fog','auto']){const input=card.shadowRoot.querySelector('.weather');input.value=value;input.dispatchEvent(new Event('change'));expect(card.shadowRoot.querySelector('[data-node=grid]')).toBe(node);expect(card.shadowRoot.querySelector('.luma').dataset.weather).toBe(value==='auto'?'rain':value);}
 expect(Object.values(ART).every(url=>url.startsWith('data:image/webp;base64,'))).toBe(true);
});
test('sun determines day/night; fallback respects HA time zone',()=>{
 expect(lighting(normalize({}),hass,new Date('2026-10-31T23:00:00Z'))).toBe(false);
 expect(lighting(normalize({lighting:'night'}),hass)).toBe(true);
 expect(lighting(normalize({}),{config:{time_zone:'Pacific/Auckland'},states:{}},new Date('2026-10-31T15:00:00Z'))).toBe(true);
});
test('missing/unavailable sensors are not zero; optional hardware is absent',()=>{
 const card=mount({entities:{grid:'sensor.missing'}});expect(card.shadowRoot.querySelector('[data-node=grid] .value').textContent).toBe('—');expect(card.shadowRoot.querySelector('[data-node=solar]')).toBeNull();
 const d=readings(normalize({entities:{grid_import:'sensor.grid'}}),hass);expect(d.nodes[0].power).toBeNull();
});
test('Octopus negative rates, pence and Wh convert independently',()=>{
 const d=readings(normalize(cfg),hass);expect(d.rate).toBe(-2);expect(d.cost).toBe('£2.84');expect(d.used).toBe('14.20');
});
test('editor emits nested entities and changes positions without touching input config',()=>{
 const editor=LumaEnergyFlowCard.getConfigElement(),input={...cfg};editor.setConfig(input);editor.hass=hass;let saved;editor.addEventListener('config-changed',e=>saved=e.detail.config);
 const field=editor.shadowRoot.querySelector('[data-entity=solar]');field.value='sensor.pv';field.dispatchEvent(new Event('change'));expect(saved.entities.solar).toBe('sensor.pv');expect(input.entities.solar).toBeUndefined();
 const select=editor.shadowRoot.querySelector('.position-device');select.value='solar';select.dispatchEvent(new Event('change'));editor.shadowRoot.querySelector('[data-move="0,-2"]').click();expect(saved.positions.solar[1]).toBe(10);
});
test('labels and title are escaped, not interpreted as HTML',()=>{
 const card=mount({title:'<img src=x onerror=alert(1)>',entities:{grid:'sensor.grid'}});expect(card.shadowRoot.querySelector('h2').textContent).toBe('<img src=x onerror=alert(1)>');expect(card.shadowRoot.querySelector('h2 img')).toBeNull();
});
test('all views render in actual custom element and survive hass updates',()=>{
 for(const view of ['classic','rings','river','tiles','overview','schematic']){const card=mount({...cfg,view,demo:true});expect(card.shadowRoot.querySelector('.luma').dataset.view).toBe(view);card.hass={...hass};expect(card.shadowRoot.querySelectorAll('[data-node]').length).toBe(5);card.remove();}
});
test('invalid config is rejected and out-of-range positions are clamped',()=>{
 expect(()=>normalize({view:'invalid'})).toThrow();expect(normalize({positions:{solar:[500,-20]}}).positions.solar).toEqual([97,3]);
});
test('night weather selects different loaded WebP layers and timer stops on detach',()=>{
 const card=mount({...cfg,lighting:'night',weather_mode:'clear'}),r=card.shadowRoot;
 expect(r.querySelector('[data-art=stars]').style.opacity).toBe('1');
 const weather=r.querySelector('.weather');weather.value='cloudy';weather.dispatchEvent(new Event('change'));
 expect(r.querySelector('[data-art=stars]').style.opacity).toBe('0');expect(r.querySelector('[data-art=nightCloudy]').style.opacity).toBe('1');
 weather.value='rain';weather.dispatchEvent(new Event('change'));expect(r.querySelector('[data-art=nightRain]').style.opacity).toBe('1');
 expect(card._timer).not.toBeNull();card.remove();expect(card._timer).toBeNull();
});
