// Serves the Google Search Console verification file at its exact URL (Pages would otherwise redirect .html to a path that 404s).
export const onRequestGet=()=>new Response('google-site-verification: google324f27d39ffaa559.html',{headers:{'content-type':'text/html; charset=utf-8','cache-control':'public, max-age=3600'}});
