import {normalize,VIEWS} from './config.js';
import {readings,watts} from './data.js';
import {houseCables,cable} from './routes.ts';
import css from './card.css';
import day from '../assets/house-day.webp';
import cloudy from '../assets/house-cloudy.webp';
import rain from '../assets/house-rain.webp';
import stars from '../assets/house-stars.webp';
import nightCloudy from '../assets/house-night-cloudy.webp';
import nightRain from '../assets/house-night-rain.webp';
import './editor.js';

export const ART={day,cloudy,rain,stars,nightCloudy,nightRain};
const LABELS={en:{grid:'Grid',home:'House',solar:'Solar',battery:'Battery',ev:'EV',gas:'Gas',heat_pump:'Heat pump',heating:'Heating',title:'Energy flow',settings:'View options',idle:'Standby',missing:'No data',import:'Importing',export:'Exporting',charging:'Charging',discharging:'Discharging',generating:'Generating',consumption:'Consumption',daily:'Daily use',cost:'Electricity today',used:'Energy today',rate:'Current tariff',next:'Next',demo:'DEMO · sample data',hint:'Choose HA entities in the dashboard card editor. Device buttons open details and history.',close:'Close',local:'Preview only. Save defaults, entities and positions in the HA card editor.'},pl:{grid:'Sieć',home:'Dom',solar:'Solar',battery:'Magazyn',ev:'EV',gas:'Gaz',heat_pump:'Pompa ciepła',heating:'Ogrzewanie',title:'Przepływ energii',settings:'Opcje widoku',idle:'Czuwanie',missing:'Brak danych',import:'Pobór',export:'Oddawanie',charging:'Ładowanie',discharging:'Rozładowanie',generating:'Produkcja',consumption:'Zużycie',daily:'Zużycie dzienne',cost:'Prąd dzisiaj',used:'Energia dzisiaj',rate:'Aktualna taryfa',next:'Następna',demo:'DEMO · dane przykładowe',hint:'Wybierz encje w edytorze karty HA. Kafelki otwierają szczegóły i historię.',close:'Zamknij',local:'Podgląd. Domyślny widok, encje i pozycje zapisz w edytorze karty HA.'}};
const ICON={grid:'↯',home:'⌂',solar:'☀',battery:'▰',ev:'ϟ',gas:'♨',heat_pump:'❋',heating:'≋'};
export const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const artwork=data=>data.night?(data.scene==='clear'?'stars':['rain','storm'].includes(data.scene)?'nightRain':'nightCloudy'):data.scene==='clear'?'day':['rain','storm'].includes(data.scene)?'rain':'cloudy';

export class LumaEnergyFlowCard extends HTMLElement {
 constructor(){super();this.attachShadow({mode:'open'});this._timer=null;}
 static getConfigElement(){return document.createElement('luma-energy-flow-card-editor');}
 static getStubConfig(){return {type:'custom:luma-energy-flow-card',title:'Luma Energy Flow',demo:true,view:'classic',theme:'navy',weather_mode:'auto'};}
 setConfig(config){const next=normalize(config);if(JSON.stringify(next)===JSON.stringify(this._config))return;this._config=next;this._view=next.view;this._weather=next.weather_mode;this._theme=next.theme;this._render();}
 set hass(hass){this._hass=hass;if(this._config)this._update();}
 get hass(){return this._hass;}
 getCardSize(){return this._view==='overview'?7:11;}
 getGridOptions(){return {columns:24,rows:10,min_columns:6,min_rows:6};}
 connectedCallback(){if(!this._timer)this._timer=setInterval(()=>this._update(),60000);if(this._config)this._update();}
 disconnectedCallback(){clearInterval(this._timer);this._timer=null;}
 _copy(){return LABELS[this._config?.language==='pl'||(this._config?.language==='auto'&&(this._hass?.locale?.language||this._hass?.language||'').startsWith('pl'))?'pl':'en'];}
 _data(){return readings({...this._config,weather_mode:this._weather},this._hass);}
 _info(entity){if(!entity||this._config.demo)return;this.dispatchEvent(new CustomEvent('hass-more-info',{detail:{entityId:entity},bubbles:true,composed:true}));}
 _status(n,t){if(n.id==='gas')return t.daily;if(n.power===null)return t.missing;if(Math.abs(n.power)<=this._config.idle_threshold)return t.idle;if(n.id==='grid')return n.power>0?t.import:t.export;if(n.id==='battery')return `${n.soc===null?'':n.soc+'% · '}${n.power>0?t.charging:t.discharging}`;return n.id==='solar'?t.generating:n.id==='ev'?t.charging:t.consumption;}
 _render(){
  if(!this._config)return;const c=this._config,t=this._copy(),data=this._data();
  const paths=houseCables(c.positions);
  for(const id of ['heat_pump','heating']){const [x,y]=c.positions[id];paths[id]=cable([[x,y],[98,y],[98,94],[62,94]]);}
  this.shadowRoot.innerHTML=`<style>${css}</style><ha-card><section class="luma" data-view="${this._view}" data-theme="${this._theme}">
   <header><div><span class="eyebrow">LUMA <i>ENERGY</i></span><h2>${escape(c.title||'Luma Energy Flow')}</h2><p>${escape(t.title)}</p></div><div class="header-actions"><span class="mode">${escape(c.demo?t.demo:'HOME ASSISTANT')}</span><button class="gear" aria-label="${escape(t.settings)}" title="${escape(t.settings)}">⚙</button></div></header>
   <aside class="options" hidden><div class="options-title"><b>${escape(t.settings)}</b><button class="close" aria-label="${escape(t.close)}">✕</button></div><nav aria-label="View">${VIEWS.map(v=>`<button data-view-button="${v}" aria-pressed="${v===this._view}">${escape(v[0].toUpperCase()+v.slice(1))}</button>`).join('')}</nav><label>Style <select class="theme"><option value="navy">Glass Navy</option><option value="glass">Clear Glass</option></select></label><label>${this._copy()===LABELS.pl?'Pogoda':'Weather'} <select class="weather">${['auto','clear','cloudy','rain','storm','snow','fog'].map(w=>`<option value="${w}">${w}</option>`).join('')}</select></label><small>${escape(t.local)}</small></aside>
   <div class="scene"><div class="art">${Object.entries(ART).map(([key,src])=>`<img class="ambient" data-art="${key}" src="${src}" alt="" decoding="async"><img class="house-art" data-art="${key}" src="${src}" alt="" decoding="async">`).join('')}</div><div class="weather-layer" aria-hidden="true"></div><div class="shade"></div><svg class="cables" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${data.nodes.filter(n=>n.id!=='gas').map(n=>`<g data-flow="${n.id}"><path class="track" d="${paths[n.id]||''}"></path><path class="particles" pathLength="100" d="${paths[n.id]||''}"></path></g>`).join('')}</svg>
   ${data.nodes.map(n=>`<button class="node node-${n.id}" data-node="${n.id}" style="--x:${c.positions[n.id][0]}%;--y:${c.positions[n.id][1]}%"><span class="node-title"><i aria-hidden="true">${ICON[n.id]}</i><span>${escape(t[n.id])}</span></span><strong class="value"></strong><small class="status"></small>${n.id==='battery'?'<span class="battery-track"><i></i></span>':''}<span class="river-track"><i></i></span></button>`).join('')}
   </div><footer><button data-stat="today_cost"><span>${escape(t.cost)}</span><strong class="cost"></strong><small>Octopus Energy · GBP</small></button><button data-stat="today_energy"><span>${escape(t.used)}</span><strong><b class="used"></b> <em>kWh</em></strong></button><button data-stat="rate"><span>${escape(t.rate)}</span><strong><b class="rate"></b><em>/kWh</em></strong><small class="next"></small></button>${c.entities.gas_cost?'<button data-stat="gas_cost"><span>Gas · GBP</span><strong class="gas-cost"></strong></button>':''}</footer><p class="notice" hidden></p></section></ha-card>`;
  const root=this.shadowRoot;
  root.querySelector('.gear').onclick=()=>{root.querySelector('.options').hidden=!root.querySelector('.options').hidden;};
  root.querySelector('.close').onclick=()=>{root.querySelector('.options').hidden=true;};
  root.querySelectorAll('[data-view-button]').forEach(b=>b.onclick=()=>{this._view=b.dataset.viewButton;this._render();});
  const weather=root.querySelector('.weather');weather.value=this._weather;weather.onchange=()=>{this._weather=weather.value;this._update();};
  const theme=root.querySelector('.theme');theme.value=this._theme;theme.onchange=()=>{this._theme=theme.value;this._update();};
  root.querySelectorAll('[data-node]').forEach(b=>b.onclick=()=>this._info(this._data().nodes.find(n=>n.id===b.dataset.node)?.entity));
  root.querySelectorAll('[data-stat]').forEach(b=>b.onclick=()=>this._info(c.entities[b.dataset.stat]));
  this._update();
 }
 _update(){
  if(!this._config||!this.shadowRoot.querySelector('.luma'))return;const data=this._data(),t=this._copy(),root=this.shadowRoot,section=root.querySelector('.luma');
  section.dataset.view=this._view;section.dataset.theme=this._theme;section.dataset.weather=data.scene;section.dataset.night=String(data.night);
  const src=artwork(data);root.querySelectorAll('.art img').forEach(img=>{img.style.opacity=img.dataset.art===src?'1':'0';});
  for(const n of data.nodes){const b=root.querySelector(`[data-node="${n.id}"]`);if(!b)continue;b.querySelector('.value').textContent=n.value;b.querySelector('.status').textContent=this._status(n,t);b.disabled=this._config.demo||!n.entity;b.setAttribute('aria-label',`${t[n.id]}: ${n.value}. ${this._status(n,t)}`);b.dataset.missing=String(n.value==='—');
   const fill=b.querySelector('.battery-track i');if(fill){fill.style.width=`${n.soc??0}%`;fill.parentElement.hidden=n.soc===null;}
   const bar=b.querySelector('.river-track i');bar.style.width=`${Math.min(100,Math.abs(n.power??0)/7400*100)}%`;
   const path=root.querySelector(`[data-flow="${n.id}"]`);if(path){path.dataset.active=String(n.power!==null&&Math.abs(n.power)>this._config.idle_threshold);path.style.setProperty('--duration',`${Math.max(1.2,5-Math.abs(n.power??0)/1500)}s`);path.dataset.reverse=String(['home','ev','heat_pump','heating'].includes(n.id)||(n.id==='grid'&&n.power<0)||(n.id==='battery'&&n.power>0));}
  }
  root.querySelector('.cost').textContent=data.cost;root.querySelector('.used').textContent=data.used;root.querySelector('.rate').textContent=data.rate===null?'—':data.rate.toFixed(2)+'p';root.querySelector('.next').textContent=`${t.next}: ${data.next===null?'—':data.next.toFixed(2)+'p/kWh'}`;const gc=root.querySelector('.gas-cost');if(gc)gc.textContent=data.gasCost;
  root.querySelectorAll('[data-stat]').forEach(b=>{b.disabled=this._config.demo||!this._config.entities[b.dataset.stat];});
  const notice=root.querySelector('.notice');const missing=['grid','home'].some(k=>!this._config.entities[k]&&!(k==='grid'&&this._config.entities.grid_import));notice.hidden=this._config.demo||!missing;notice.textContent=t.hint;
 }
}
if(!customElements.get('luma-energy-flow-card'))customElements.define('luma-energy-flow-card',LumaEnergyFlowCard);
window.customCards=window.customCards||[];
if(!window.customCards.some(c=>c.type==='luma-energy-flow-card'))window.customCards.push({type:'luma-energy-flow-card',name:'Luma Energy Flow Card',description:'Weather-aware house energy flows, Glass Navy, optional devices and Octopus GBP.',preview:true,documentationURL:'https://github.com/krystianokris/luma-energy-flow-card'});
