// /rss.xml (English) and /rss.xml?lang=ur — latest published articles. Use with Zapier / Make / dlvr.it / IFTTT to auto-post to Facebook and X.
const SB_URL='https://mqpfsqokaydsztanpkhj.supabase.co',SB_KEY='sb_publishable_-vfCDMw3va6C-NOeXYZc5w_pidx_JiR';
const E=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
export async function onRequestGet({request,env}){
 const url=new URL(request.url),base=(env.SITE_URL||url.origin).replace(/\/$/,''),lang=url.searchParams.get('lang')==='ur'?'ur':'en',pre=lang==='ur'?'/ur/':'/';
 let rows=[];try{const r=await fetch(`${env.SUPABASE_URL||SB_URL}/rest/v1/post_translations?select=title,slug,excerpt,posts!inner(status,published_at,featured_image,categories(slug))&lang=eq.${lang}&posts.status=eq.published&order=updated_at.desc&limit=60`,{headers:{apikey:env.SUPABASE_ANON_KEY||SB_KEY}});if(r.ok)rows=await r.json()}catch(e){}
 const now=new Date();rows=rows.filter(r=>r.posts.categories&&r.posts.published_at&&new Date(r.posts.published_at)<=now).sort((a,b)=>new Date(b.posts.published_at)-new Date(a.posts.published_at)).slice(0,30);
 const items=rows.map(r=>{const link=base+pre+r.posts.categories.slug+'/'+encodeURIComponent(r.slug),img=r.posts.featured_image,t=/\.png$/i.test(img||'')?'image/png':/\.webp$/i.test(img||'')?'image/webp':'image/jpeg';
  return `<item><title>${E(r.title)}</title><link>${E(link)}</link><guid isPermaLink="true">${E(link)}</guid><pubDate>${new Date(r.posts.published_at).toUTCString()}</pubDate><description>${E(r.excerpt)}</description>${img?`<enclosure url="${E(img)}" type="${t}" length="0"/>`:''}</item>`}).join('\n');
 const xml=`<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>BAAM 360</title><link>${E(base+pre)}</link><description>Knowledge Without Borders</description><language>${lang}</language><atom:link href="${E(base+'/rss.xml'+(lang==='ur'?'?lang=ur':''))}" rel="self" type="application/rss+xml"/>\n${items}\n</channel></rss>`;
 return new Response(xml,{headers:{'content-type':'application/rss+xml; charset=utf-8','cache-control':'public, max-age=300'}});
}
