// GET /api/latest?lang=en|ur — newest published article (used by the push notification to show its title)
const SB_URL='https://mqpfsqokaydsztanpkhj.supabase.co',SB_KEY='sb_publishable_-vfCDMw3va6C-NOeXYZc5w_pidx_JiR';
export async function onRequestGet({request,env}){
 const u=new URL(request.url),lang=u.searchParams.get('lang')==='ur'?'ur':'en',pre=lang==='ur'?'/ur/':'/';let rows=[];
 try{const r=await fetch(`${env.SUPABASE_URL||SB_URL}/rest/v1/post_translations?select=title,slug,excerpt,posts!inner(status,published_at,featured_image,categories(slug))&lang=eq.${lang}&posts.status=eq.published&order=updated_at.desc&limit=20`,{headers:{apikey:env.SUPABASE_ANON_KEY||SB_KEY}});if(r.ok)rows=await r.json()}catch(e){}
 const now=new Date();rows=rows.filter(r=>r.posts.categories&&r.posts.published_at&&new Date(r.posts.published_at)<=now).sort((a,b)=>new Date(b.posts.published_at)-new Date(a.posts.published_at));
 const r=rows[0];const body=r?{title:r.title,excerpt:(r.excerpt||'').slice(0,140),url:pre+r.posts.categories.slug+'/'+encodeURIComponent(r.slug),image:r.posts.featured_image||null}:{};
 return new Response(JSON.stringify(body),{headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
}
