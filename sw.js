// BAAM 360 push notifications. Registered as /sw.js?lang=en or ?lang=ur
const lang=new URL(self.location.href).searchParams.get('lang')==='ur'?'ur':'en';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('push',e=>e.waitUntil((async()=>{
 let d={title:'BAAM 360',excerpt:lang==='ur'?'نیا مضمون شائع ہوا':'A new article was published',url:lang==='ur'?'/ur/':'/',image:null};
 try{const r=await fetch('/api/latest?lang='+lang);if(r.ok)d=Object.assign(d,await r.json())}catch(_){}
 await self.registration.showNotification(d.title,{body:d.excerpt||'',icon:'/icon-192.png',badge:'/icon-192.png',image:d.image||undefined,data:{url:d.url},dir:lang==='ur'?'rtl':'ltr',lang});
})()));
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(self.clients.openWindow((e.notification.data&&e.notification.data.url)||'/'))});
