// Cloudflare Pages Function: serves index.html for clean URLs and injects per-page SEO tags, 301s and real 404 statuses.
const SB_URL='https://mqpfsqokaydsztanpkhj.supabase.co',SB_KEY='sb_publishable_-vfCDMw3va6C-NOeXYZc5w_pidx_JiR'; // public values; override with env vars if you like
const RESERVED=['admin','p','s','popular','newsletter','author'];
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const PL=l=>l==='ur'?'/ur/':'/';
const rest=async(env,q)=>{try{const r=await fetch(`${env.SUPABASE_URL||SB_URL}/rest/v1/${q}`,{headers:{apikey:env.SUPABASE_ANON_KEY||SB_KEY},signal:AbortSignal.timeout(3500),cf:{cacheTtl:60,cacheEverything:true}});return r.ok?await r.json():null}catch(e){return null}};
const links=rows=>rows.filter(r=>visible(r.posts)&&r.posts.categories).sort((a,b)=>new Date(b.posts.published_at||0)-new Date(a.posts.published_at||0)).map(r=>`<li><a href="${esc(PL(r.lang)+r.posts.categories.slug+'/'+encodeURIComponent(r.slug))}">${esc(r.title)}</a>${r.excerpt?' — '+esc(r.excerpt):''}</li>`).join('');
const paras=h=>String(h||'').replace(/&nbsp;/g,' ').replace(/<\/(p|h[1-6]|li|blockquote|tr)>|<br\s*\/?>/gi,'\n').replace(/<[^>]+>/g,'').split('\n').map(x=>x.trim()).filter(Boolean).slice(0,200);
const goodTitle=(s,t)=>s&&s.length<=70&&(s.match(/,/g)||[]).length<3?s:t;
const foot=l=>{const L={about:['About Us','ہمارے بارے میں'],contact:['Contact Us','رابطہ'],privacy:['Privacy Policy','پرائیویسی پالیسی'],disclaimer:['Disclaimer','دستبرداری'],terms:['Terms and Conditions','شرائط و ضوابط'],'editorial-policy':['Editorial Policy','ادارتی پالیسی'],corrections:['Corrections','اصلاحات']};
 return `<footer><nav aria-label="Footer"><a href="${PL(l)}">${l==='ur'?'ہوم':'Home'}</a> `+Object.keys(L).map(k=>`<a href="${PL(l)}p/${k}">${L[k][l==='ur'?1:0]}</a>`).join(' ')+`</nav><p>© BAAM 360</p></footer>`};
const visible=p=>!!p&&((p.status==='published'&&(!p.published_at||new Date(p.published_at)<=new Date()))||(p.status==='scheduled'&&new Date(p.publish_at)<=new Date()));
const dec=x=>{try{return decodeURIComponent(x)}catch(e){return x}};
export async function onRequest({request,env,next}){
 const url=new URL(request.url);
 if(/^www\./i.test(url.hostname))return Response.redirect((env.SITE_URL||'https://baam360.online').replace(/\/$/,'')+url.pathname+url.search,301); // www -> one main address
 if(/\.pages\.dev$/i.test(url.hostname))return Response.redirect((env.SITE_URL||'https://baam360.online').replace(/\/$/,'')+url.pathname+url.search,301); // one official domain only
 if(request.method!=='GET'||/\.[a-z0-9]+$/i.test(url.pathname))return next();
 if(url.pathname.startsWith('/api/'))return next();
 if(/^\/google[0-9a-f]{10,}(\.html)?$/i.test(url.pathname))return next(); // Google Search Console verification file (with or without .html)
 const base=(env.SITE_URL||url.origin).replace(/\/$/,'');
 let upFail=false;const R=async q=>{const x=await rest(env,q);if(x===null){upFail=true;return[]}return x};
 const seg=url.pathname.split('/').filter(Boolean).map(dec);let lang='en';if(seg[0]==='ur'){lang='ur';seg.shift()}
 const shell=await env.ASSETS.fetch(new Request(new URL('/',url)));
 let status=200,title=null,desc=null,canon=null,fallback='',inject='',robots=false;
 if(seg[0]==='admin')robots=true;
 else if(seg.length>2||(seg[0]==='p'&&seg.length!==2)||(seg[0]==='author'&&seg.length!==2)||(seg[0]==='s'&&seg.length>2)){status=404;robots=true}
 else if(seg[0]==='p'&&seg.length===2){const pg=await R(`static_pages?select=title_en,title_ur,body_en,body_ur&slug=eq.${encodeURIComponent(seg[1])}&limit=1`);
  if(!pg[0]){if(!upFail){status=404;robots=true}}else{const ur=lang==='ur'&&pg[0].title_ur,ti=ur?pg[0].title_ur:pg[0].title_en,bd=lang==='ur'&&pg[0].body_ur?pg[0].body_ur:pg[0].body_en,ps=paras(bd);
   title=ti+' — BAAM 360';canon=base+PL(lang)+'p/'+encodeURIComponent(seg[1]);desc=(ps.find(x=>x.length>=60)||ps[0]||'').slice(0,160);fallback=`<article><h1>${esc(ti)}</h1>${ps.map(x=>`<p>${esc(x)}</p>`).join('')}</article>`}}
 else if(seg[0]==='author'&&seg.length===2){const pr=await R(`profiles?select=id,display_name,slug,title,bio&slug=eq.${encodeURIComponent(seg[1])}&limit=1`);
  if(!pr[0]){if(!upFail){status=404;robots=true}}else{const a=pr[0],rs=await R(`post_translations?select=title,slug,lang,excerpt,posts!inner(status,published_at,publish_at,author_id,categories!inner(slug))&lang=eq.${lang}&posts.author_id=eq.${a.id}&order=updated_at.desc&limit=40`);
   title=a.display_name+' — BAAM 360';canon=base+PL(lang)+'author/'+encodeURIComponent(a.slug);desc=(a.bio||a.title||a.display_name).slice(0,160);fallback=`<h1>${esc(a.display_name)}</h1><p>${esc(a.title||'')}</p><p>${esc(a.bio||'')}</p><ul>${links(rs)}</ul>`}}
 else if(seg.length&&!RESERVED.includes(seg[0])){
  const slug=seg[seg.length-1];let isCat=false;
  if(seg.length===1){const c=await R(`categories?select=slug,name_en,name_ur,description_en,description_ur&is_active=eq.true&slug=eq.${encodeURIComponent(slug)}&limit=1`);
   if(c[0]){isCat=true;title=(lang==='ur'?c[0].name_ur:c[0].name_en)+' — BAAM 360';desc=lang==='ur'?c[0].description_ur:c[0].description_en;canon=base+PL(lang)+slug;
    const rs=await R(`post_translations?select=title,slug,lang,excerpt,posts!inner(status,published_at,publish_at,categories!inner(slug))&lang=eq.${lang}&posts.categories.slug=eq.${encodeURIComponent(slug)}&order=updated_at.desc&limit=40`);
    fallback=`<h1>${esc(title)}</h1><ul>${links(rs)}</ul>`}}
  if(!isCat&&seg.length===2){const sc=await R(`subcategories?select=id,slug,name_en,name_ur,categories!inner(slug,name_en,name_ur)&slug=eq.${encodeURIComponent(seg[1])}&categories.slug=eq.${encodeURIComponent(seg[0])}&limit=1`);
   if(sc[0]){isCat=true;const nm=lang==='ur'?sc[0].name_ur:sc[0].name_en,cn=lang==='ur'?sc[0].categories.name_ur:sc[0].categories.name_en;title=nm+' — '+cn+' — BAAM 360';desc=nm+' — '+cn;canon=base+PL(lang)+seg[0]+'/'+seg[1];
    const rs=await R(`post_translations?select=title,slug,lang,excerpt,posts!inner(status,published_at,publish_at,subcategory_id,categories!inner(slug))&lang=eq.${lang}&posts.subcategory_id=eq.${sc[0].id}&order=updated_at.desc&limit=40`);fallback=`<h1>${esc(nm)}</h1><ul>${links(rs)}</ul>`}}
  if(!isCat){
   const rows=await R(`post_translations?select=title,slug,lang,excerpt,body,seo_title,meta_description,updated_at,posts!inner(status,published_at,publish_at,featured_image,author_id,categories(slug))&slug=eq.${encodeURIComponent(slug)}&limit=4`);
   const ok=rows.filter(r=>visible(r.posts)&&r.posts.categories);const r=ok.find(x=>x.lang===lang)||ok[0];
   if(!r){if(!upFail){status=404;robots=true}}
   else{const cpath=PL(r.lang)+r.posts.categories.slug+'/'+encodeURIComponent(r.slug);
    if(decodeURI(url.pathname)!==decodeURI(cpath))return Response.redirect(url.origin+cpath,301);
    lang=r.lang;title=goodTitle(r.seo_title,r.title);desc=r.meta_description||r.excerpt||'';canon=base+cpath;
    const au=r.posts.author_id?await R(`profiles?select=display_name,slug&id=eq.${r.posts.author_id}&limit=1`):[];const byl=au[0]?`<p>By ${au[0].slug?`<a href="${PL(r.lang)}author/${esc(au[0].slug)}">${esc(au[0].display_name)}</a>`:esc(au[0].display_name)}</p>`:'';
    const txt=String(r.body||'').replace(/&nbsp;/g,' ').replace(/<\/(p|h[1-6]|li|blockquote|tr)>|<br\s*\/?>/gi,'\n').replace(/<[^>]+>/g,'').split('\n').map(x=>x.trim()).filter(Boolean).slice(0,200);
    fallback=`<article><h1>${esc(r.title)}</h1>${byl}<p><time datetime="${esc(r.posts.published_at||'')}">${esc(r.posts.published_at?new Date(r.posts.published_at).toUTCString().slice(5,16):'')}</time></p><p>${esc(r.excerpt)}</p>${txt.map(x=>`<p>${esc(x)}</p>`).join('')}</article>`;
    const img=r.posts.featured_image;
    const ld={'@context':'https://schema.org','@type':'NewsArticle',mainEntityOfPage:canon,author:au[0]?{'@type':'Person',name:au[0].display_name,url:au[0].slug?base+PL(r.lang)+'author/'+au[0].slug:undefined}:undefined,headline:r.title,description:r.excerpt,dateModified:r.updated_at,datePublished:r.posts.published_at||undefined,image:img?[img]:undefined,inLanguage:r.lang,publisher:{'@type':'Organization',name:'BAAM 360'}};
    inject=`<meta property="og:type" content="article"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${esc(canon)}"><meta property="og:site_name" content="BAAM 360">`+(img?`<meta property="og:image" content="${esc(img)}"><meta name="twitter:image" content="${esc(img)}">`:'')+`<meta name="twitter:card" content="${img?'summary_large_image':'summary'}"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><script type="application/ld+json" data-ld="1">${JSON.stringify(ld).replace(/</g,'\\u003c')}</script>`}}
 }
 if(!seg.length){const[cs,rs]=await Promise.all([R('categories?select=slug,name_en,name_ur&is_active=eq.true&order=sort_order'),R(`post_translations?select=title,slug,lang,excerpt,posts!inner(status,published_at,publish_at,categories(slug))&lang=eq.${lang}&order=updated_at.desc&limit=24`)]);
  fallback=`<h1>BAAM 360 — Knowledge Without Borders</h1><nav>${cs.map(c=>`<a href="${PL(lang)}${esc(c.slug)}">${esc(lang==='ur'?c.name_ur:c.name_en)}</a>`).join(' ')}</nav><ul>${links(rs)}</ul>`;canon=base+PL(lang)}
 if(seg[0]!=='admin'){const ss=await rest(env,'site_settings?select=value&key=eq.site_scripts&limit=1');const v=ss&&ss[0]&&ss[0].value;let code='';
  if(v&&Array.isArray(v.items))code=v.items.filter(x=>x&&x.enabled===true&&typeof x.code==='string').map(x=>x.code).join('\n');else if(v&&v.enabled===true&&typeof v.code==='string')code=v.code;
  if(code&&code.length<40000)inject+=code}
 if(fallback)fallback+=foot(lang);
 if(robots)inject+='<meta name="robots" content="noindex,nofollow">';
 if(!canon&&!robots)canon=base+url.pathname;
 const rw=new HTMLRewriter();
 if(title)rw.on('title',{element(e){e.setInnerContent(title)}});
 if(desc)rw.on('meta[name=description]',{element(e){e.setAttribute('content',desc)}});
 if(canon)rw.on('link#canon',{element(e){e.setAttribute('href',canon)}});
 rw.on('html',{element(e){e.setAttribute('lang',lang);e.setAttribute('dir',lang==='ur'?'rtl':'ltr')}});
 if(fallback)rw.on('#app',{element(e){e.setInnerContent('<div class="boot"><b>BAAM <i>360</i></b></div><div class="ssr">'+fallback+'</div>',{html:true})}});
 if(inject)rw.on('head',{element(e){e.append(inject,{html:true})}});
 const out=rw.transform(shell);const h=new Headers(out.headers);h.set('content-type','text/html; charset=utf-8');h.set('cache-control','public, max-age=0, s-maxage=300');if(robots)h.set('x-robots-tag','noindex');
 return new Response(out.body,{status,headers:h});
}
