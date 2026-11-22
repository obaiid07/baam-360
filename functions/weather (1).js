// GET /api/weather — live weather for Pakistan + world cities (Open-Meteo), cached at the edge for 15 minutes.
// Open-Meteo's free service is for non-commercial use. For a monetised site, buy their API plan and add the key as Cloudflare variable OPEN_METEO_KEY (used automatically).
const CITIES=[['islamabad','Islamabad','اسلام آباد',33.6844,73.0479,'pk'],['rawalpindi','Rawalpindi','راولپنڈی',33.5651,73.0169,'pk'],['lahore','Lahore','لاہور',31.5204,74.3587,'pk'],['karachi','Karachi','کراچی',24.8607,67.0011,'pk'],['peshawar','Peshawar','پشاور',34.0151,71.5249,'pk'],['quetta','Quetta','کوئٹہ',30.1798,66.9750,'pk'],['multan','Multan','ملتان',30.1575,71.5249,'pk'],['faisalabad','Faisalabad','فیصل آباد',31.4504,73.1350,'pk'],['hyderabad','Hyderabad','حیدرآباد',25.3960,68.3578,'pk'],['gilgit','Gilgit','گلگت',35.9208,74.3080,'pk'],['skardu','Skardu','سکردو',35.2971,75.6333,'pk'],['muzaffarabad','Muzaffarabad','مظفرآباد',34.3700,73.4711,'pk'],
 ['dubai','Dubai','دبئی',25.2048,55.2708,'world'],['riyadh','Riyadh','ریاض',24.7136,46.6753,'world'],['makkah','Makkah','مکہ مکرمہ',21.3891,39.8579,'world'],['london','London','لندن',51.5072,-0.1276,'world'],['newyork','New York','نیویارک',40.7128,-74.0060,'world'],['istanbul','Istanbul','استنبول',41.0082,28.9784,'world'],['delhi','Delhi','دہلی',28.6139,77.2090,'world'],['beijing','Beijing','بیجنگ',39.9042,116.4074,'world']];
const J=(o,st=200,h={})=>new Response(JSON.stringify(o),{status:st,headers:{'content-type':'application/json; charset=utf-8',...h}});
export async function onRequestGet({request,env}){
 const url=new URL(request.url),rd=x=>Math.round(x*100)/100;let pts=CITIES,extra={},cc='public, max-age=300';
 if(url.searchParams.get('here')){const cf=request.cf||{};if(cf.latitude==null||cf.longitude==null)return J({error:'Location unknown'},404);
  pts=[['here',cf.city||'',cf.city||'',rd(parseFloat(cf.latitude)),rd(parseFloat(cf.longitude)),'here']];extra={place:{city:cf.city||null,country:cf.country||null}};cc='private, max-age=300'}
 else if(url.searchParams.has('lat')){const la=parseFloat(url.searchParams.get('lat')),lo=parseFloat(url.searchParams.get('lon'));if(!(la>=-90&&la<=90&&lo>=-180&&lo<=180))return J({error:'Bad coordinates'},400);pts=[['here','','',rd(la),rd(lo),'here']];cc='private, max-age=300'}
 const key=env.OPEN_METEO_KEY,base=key?'https://customer-api.open-meteo.com/v1/forecast':'https://api.open-meteo.com/v1/forecast';
 const q='?latitude='+pts.map(c=>c[3]).join(',')+'&longitude='+pts.map(c=>c[4]).join(',')+'&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&hourly=precipitation_probability,precipitation&forecast_days=3&timezone=auto'+(key?'&apikey='+encodeURIComponent(key):'');
 let data;try{const r=await fetch(base+q,{signal:AbortSignal.timeout(8000),cf:{cacheTtlByStatus:{'200-299':900,'300-599':0},cacheEverything:true}});
  if(!r.ok)throw new Error('Open-Meteo returned '+r.status+' '+(await r.text()).slice(0,200));data=await r.json()}catch(e){return J({error:'Weather service unavailable',detail:String(e&&e.message||e)},502)}
 const arr=Array.isArray(data)?data:[data];
 const cities=arr.map((d,i)=>{const c=pts[i],cur=d.current||{},h=d.hourly||{},dd=d.daily||{},now=String(cur.time||'').slice(0,13)+':00';let nr=null;
  if(h.time)for(let k=0;k<h.time.length;k++){if(h.time[k]<now)continue;if((h.precipitation&&h.precipitation[k]||0)>=0.2||(h.precipitation_probability&&h.precipitation_probability[k]||0)>=60){nr=h.time[k];break}}
  return{id:c[0],en:c[1],ur:c[2],group:c[5],temp:cur.temperature_2m,feels:cur.apparent_temperature,hum:cur.relative_humidity_2m,wind:cur.wind_speed_10m,code:cur.weather_code,day:cur.is_day,hi:(dd.temperature_2m_max||[])[0],lo:(dd.temperature_2m_min||[])[0],pop:(dd.precipitation_probability_max||[])[0],nextRain:nr,
   days:(dd.time||[]).map((t,k)=>({date:t,code:dd.weather_code[k],hi:dd.temperature_2m_max[k],lo:dd.temperature_2m_min[k],pop:dd.precipitation_probability_max[k]}))}});
 return J({updated:new Date().toISOString(),cities,...extra},200,{'cache-control':cc});
}
