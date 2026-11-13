export const onRequestGet=({request,env})=>{const b=(env.SITE_URL||new URL(request.url).origin).replace(/\/$/,'');
 return new Response(`User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${b}/sitemap.xml\n`,{headers:{'content-type':'text/plain; charset=utf-8'}})};
