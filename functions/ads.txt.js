// /ads.txt — served directly so it never depends on a file being in the right folder.
// To add more lines later, set a Cloudflare variable ADS_TXT (full file text).
const DEFAULT='google.com, pub-5570066949456083, DIRECT, f08c47fec0942fa0\n';
export const onRequestGet=({env})=>new Response(env.ADS_TXT||DEFAULT,{headers:{'content-type':'text/plain; charset=utf-8','cache-control':'public, max-age=300'}});
