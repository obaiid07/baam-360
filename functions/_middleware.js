// Cloudflare Pages Function: serves index.html for clean URLs and injects per-page SEO tags, 301s and real 404 statuses.
const SB_URL='https://mqpfsqokaydsztanpkhj.supabase.co',SB_KEY='sb_publishable_-vfCDMw3va6C-NOeXYZc5w_pidx_JiR'; // public values; override with env vars if you like
const RESERVED=['admin','p','s','popular','newsletter'];
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const PL=l=>l==='ur'?'/ur/':'/';
const rest=async(env,q)=>{try{const r=await fetch(`${env.SUPABASE_URL||SB_URL}/rest/v1/${q}`,{headers:{apikey:env.SUPABASE_ANON_KEY||SB_KEY}});return r.ok?await r.json():[]}catch(e){return[]}};
const visible=p=>!!p&&((p.status==='published'&&(!p.published_at||new Date(p.published_at)<=new Date()))||(p.status==='scheduled'&&new Date(p.publish_at)<=new Date()));
const dec=x=>{try{return decodeURIComponent(x)}catch(e){return x}};
export async function onRequest({request,env,next}){
 const url=new URL(request.url);
 if(request.method!=='GET'||/\.[a-z0-9]+$/i.test(url.pathname))return next();
 if(/^\/google[0-9a-f]{10,}(\.html)?$/i.test(url.pathname))return next(); // Google Search Console verification file (with or without .html)
 const base=(env.SITE_URL||url.origin).replace(/\/$/,'');
 const seg=url.pathname.split('/').filter(Boolean).map(dec);let lang='en';if(seg[0]==='ur'){lang='ur';seg.shift()}
 const shell=await env.ASSETS.fetch(new Request(new URL('/',url)));
 let status=200,title=null,desc=null,canon=null,fallback='',inject='',robots=false;
 if(seg[0]==='admin')robots=true;
 else if(seg.length>2||(seg[0]==='p'&&seg.length!==2)||(seg[0]==='s'&&seg.length>2)){status=404;robots=true}
 else if(seg.length&&!RESERVED.includes(seg[0])){
  const slug=seg[seg.length-1];let isCat=false;
  if(seg.length===1){const c=await rest(env,`categories?select=slug,name_en,name_ur,description_en,description_ur&is_active=eq.true&slug=eq.${encodeURIComponent(slug)}&limit=1`);
   if(c[0]){isCat=true;title=(lang==='ur'?c[0].name_ur:c[0].name_en)+' — BAAM 360';desc=lang==='ur'?c[0].description_ur:c[0].description_en;canon=base+PL(lang)+slug}}
  if(!isCat){
   const rows=await rest(env,`post_translations?select=title,slug,lang,excerpt,seo_title,meta_description,updated_at,posts!inner(status,published_at,publish_at,featured_image,categories(slug))&slug=eq.${encodeURIComponent(slug)}&limit=4`);
   const ok=rows.filter(r=>visible(r.posts)&&r.posts.categories);const r=ok.find(x=>x.lang===lang)||ok[0];
   if(!r){status=404;robots=true}
   else{const cpath=PL(r.lang)+r.posts.categories.slug+'/'+encodeURIComponent(r.slug);
    if(decodeURI(url.pathname)!==decodeURI(cpath))return Response.redirect(url.origin+cpath,301);
    lang=r.lang;title=r.seo_title||r.title;desc=r.meta_description||r.excerpt||'';canon=base+cpath;
    fallback=`<article><h1>${esc(r.title)}</h1><p>${esc(r.excerpt)}</p></article>`;
    const img=r.posts.featured_image;
    const ld={'@context':'https://schema.org','@type':'NewsArticle',mainEntityOfPage:canon,headline:r.title,description:r.excerpt,dateModified:r.updated_at,datePublished:r.posts.published_at||undefined,image:img?[img]:undefined,inLanguage:r.lang,publisher:{'@type':'Organization',name:'BAAM 360'}};
    inject=`<meta property="og:type" content="article"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${esc(canon)}"><meta property="og:site_name" content="BAAM 360">`+(img?`<meta property="og:image" content="${esc(img)}"><meta name="twitter:image" content="${esc(img)}">`:'')+`<meta name="twitter:card" content="${img?'summary_large_image':'summary'}"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><script type="application/ld+json" data-ld="1">${JSON.stringify(ld).replace(/</g,'\\u003c')}</script>`}}
 }
 if(robots)inject+='<meta name="robots" content="noindex,nofollow">';
 if(!canon&&!robots)canon=base+url.pathname;
 const rw=new HTMLRewriter();
 if(title)rw.on('title',{element(e){e.setInnerContent(title)}});
 if(desc)rw.on('meta[name=description]',{element(e){e.setAttribute('content',desc)}});
 if(canon)rw.on('link#canon',{element(e){e.setAttribute('href',canon)}});
 rw.on('html',{element(e){e.setAttribute('lang',lang);e.setAttribute('dir',lang==='ur'?'rtl':'ltr')}});
 if(fallback)rw.on('#app',{element(e){e.setInnerContent(fallback,{html:true})}});
 if(inject)rw.on('head',{element(e){e.append(inject,{html:true})}});
 const out=rw.transform(shell);const h=new Headers(out.headers);h.set('content-type','text/html; charset=utf-8');h.set('cache-control','public, max-age=0, s-maxage=300');if(robots)h.set('x-robots-tag','noindex');
 return new Response(out.body,{status,headers:h});
}
