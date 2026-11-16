// POST /api/notify {offset} — sends a (payload-free) web push to up to 40 subscribers; the admin panel calls it repeatedly until done.
// Only a logged-in Main Admin / Editor can call it: the subscriber list is read through a Supabase function that checks the caller's role.
const SB_URL='https://mqpfsqokaydsztanpkhj.supabase.co',SB_KEY='sb_publishable_-vfCDMw3va6C-NOeXYZc5w_pidx_JiR';
const VAPID_PUBLIC='BDj4Fjl9IIuWLSVNeFnJzJzd6ld31iwNaIOWa0uZ3B79YmT3xoEQ8_Kh9mInik3ps_Swm1n-UZyarf8zTsa7Ni8';
const b64u=b=>btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const enc=s=>b64u(new TextEncoder().encode(s));
const J=(o,st=200)=>new Response(JSON.stringify(o),{status:st,headers:{'content-type':'application/json'}});
async function vapidJwt(aud,jwk){const h=enc(JSON.stringify({typ:'JWT',alg:'ES256'})),c=enc(JSON.stringify({aud,exp:Math.floor(Date.now()/1000)+43200,sub:'mailto:obaiidkhalid07@gmail.com'}));
 const key=await crypto.subtle.importKey('jwk',jwk,{name:'ECDSA',namedCurve:'P-256'},false,['sign']);
 const sig=await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},key,new TextEncoder().encode(h+'.'+c));return h+'.'+c+'.'+b64u(sig)}
export async function onRequestPost({request,env}){
 if(!env.VAPID_PRIVATE_JWK)return J({error:'VAPID_PRIVATE_JWK is not set in Cloudflare variables'},500);
 const auth=request.headers.get('authorization')||'';if(!auth.startsWith('Bearer '))return J({error:'Not logged in'},401);
 let offset=0;try{offset=Math.max(0,parseInt((await request.json()).offset)||0)}catch(e){}
 const sbh={apikey:env.SUPABASE_ANON_KEY||SB_KEY,authorization:auth,'content-type':'application/json'},base=env.SUPABASE_URL||SB_URL;
 const lr=await fetch(base+'/rest/v1/rpc/list_push_subscriptions',{method:'POST',headers:sbh,body:JSON.stringify({p_offset:offset,p_limit:40})});
 if(!lr.ok)return J({error:'Not allowed (Main Admin or Editor only)'},403);
 const subs=await lr.json(),jwk=JSON.parse(env.VAPID_PRIVATE_JWK),gone=[];let sent=0;
 await Promise.all(subs.map(async s=>{try{const aud=new URL(s.endpoint).origin,t=await vapidJwt(aud,jwk);
  const r=await fetch(s.endpoint,{method:'POST',headers:{Authorization:'vapid t='+t+', k='+VAPID_PUBLIC,TTL:'86400',Urgency:'normal'}});
  if(r.status===404||r.status===410)gone.push(s.endpoint);else if(r.ok)sent++}catch(e){}}));
 if(gone.length)await fetch(base+'/rest/v1/rpc/delete_push_subscriptions',{method:'POST',headers:sbh,body:JSON.stringify({p_endpoints:gone})});
 return J({sent,removed:gone.length,done:subs.length<40,next:offset+subs.length-gone.length});
}
