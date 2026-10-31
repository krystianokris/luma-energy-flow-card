export type WeatherScene = 'clear'|'cloudy'|'rain'|'storm'|'snow'|'fog';
export function weatherScene(state: string | undefined): WeatherScene | null {
 if (!state || ['unknown','unavailable'].includes(state)) return null;
 if (['lightning','lightning-rainy','exceptional'].includes(state)) return 'storm';
 if (['rainy','pouring','hail'].includes(state)) return 'rain';
 if (['snowy','snowy-rainy'].includes(state)) return 'snow';
 if (state === 'fog') return 'fog';
 if (['cloudy','partlycloudy','windy','windy-variant'].includes(state)) return 'cloudy';
 return ['sunny','clear-night'].includes(state) ? 'clear' : null;
}
export function isNight(lighting: string, sun: string | undefined, date: Date): boolean {
 if (lighting==='day') return false;
 if (lighting==='dusk') return true;
 if (sun==='below_horizon') return true;
 if (sun==='above_horizon') return false;
 const hour=Number(new Intl.DateTimeFormat('en-GB',{hour:'2-digit',hourCycle:'h23',timeZone:'Europe/London'}).format(date));
 return hour<7 || hour>=19;
}
