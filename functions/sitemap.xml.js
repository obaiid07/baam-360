
// /sitemap.xml — built live from Supabase; only published (or due-scheduled) articles are listed.
const SB_URL='https://mqpfsqokaydsztanpkhj.supabase.co',SB_KEY='sb_publishable_-vfCDMw3va6C-NOeXYZc5w_pidx_JiR';
export async function onRequestGet({request,env}){
 const url=new URL(request.url),base=(env.SITE_URL||url.origin).replace(/\/$/,'');
 const q=async p=>{try{const r=await fetch(`${env.SUPABASE_URL||SB_URL}/rest/v1/${p}`,{headers:{apikey:env.SUPABASE_ANON_KEY||SB_KEY}});return r.ok?await r.json():[]}catch(e){return[]}};
 const[subs,cats,tr]=await Promise.all([q('subcategories?select=slug,categories!inner(slug)'),q('categories?select=slug&is_active=eq.true&order=sort_order'),q('post_translations?select=slug,lang,updated_at,posts!inner(status,published_at,publish_at,categories(slug))&posts.status=in.(published,scheduled)&order=updated_at.desc&limit=1000')]);
 const now=new Date(),vis=p=>(p.status==='published'&&(!p.published_at||new Date(p.published_at)<=now))||(p.status==='scheduled'&&new Date(p.publish_at)<=now);
 const E=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
 const u=(p,d)=>`<url><loc>${E(base+p)}</loc>${d?`<lastmod>${d.slice(0,10)}</lastmod>`:''}</url>`;
 const list=[u('/'),u('/ur/'),...cats.flatMap(c=>[u('/'+c.slug),u('/ur/'+c.slug)]),...subs.flatMap(x=>x.categories?[u('/'+x.categories.slug+'/'+x.slug),u('/ur/'+x.categories.slug+'/'+x.slug)]:[]),...['about','contact','privacy','disclaimer','terms'].map(s=>u('/p/'+s)),
  ...tr.filter(r=>vis(r.posts)&&r.posts.categories).map(r=>u((r.lang==='ur'?'/ur/':'/')+r.posts.categories.slug+'/'+encodeURIComponent(r.slug),r.updated_at))];
 return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${list.join('\n')}\n</urlset>`,{headers:{'content-type':'application/xml; charset=utf-8','cache-control':'public, max-age=900'}});
}
