const CACHE = "recovery-journal-v38.1";

const PATCH_CSS = `
.emotion-modal{overscroll-behavior:contain;touch-action:none}
.emotion-sheet{max-height:calc(100dvh - 24px);height:auto;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;touch-action:pan-y;padding-bottom:calc(18px + env(safe-area-inset-bottom))}
.emotion-scale input[type="range"]{width:100%;height:44px;padding:0;margin:0;border:0;background:transparent;accent-color:var(--forest);touch-action:pan-x;cursor:pointer}
`;

const PATCH_JS = `
<script>
(function(){
  function repairEmotionTouch(){
    const modal=document.getElementById("emotionModal");
    const sheet=modal&&modal.querySelector(".emotion-sheet");
    const slider=document.getElementById("emotionIntensity");
    if(!modal||!sheet)return;
    modal.style.touchAction="none";
    sheet.style.touchAction="pan-y";
    sheet.style.overflowY="auto";
    sheet.style.webkitOverflowScrolling="touch";
    sheet.style.overscrollBehavior="contain";
    if(slider){
      slider.style.touchAction="pan-x";
      slider.style.height="44px";
      if(!slider.dataset.v381){
        slider.dataset.v381="1";
        slider.addEventListener("touchstart",e=>e.stopPropagation(),{passive:true});
        slider.addEventListener("touchmove",e=>e.stopPropagation(),{passive:true});
      }
    }
  }
  document.addEventListener("DOMContentLoaded",repairEmotionTouch);
  window.addEventListener("load",repairEmotionTouch);
  new MutationObserver(repairEmotionTouch).observe(document.documentElement,{subtree:true,childList:true});
})();
</script>
`;

function patchIndex(html){
  html=html.replace(/\$\("emotionModal"\)\.addEventListener\("touchmove",e=>e\.preventDefault\(\),\{passive:false\}\);/,"/* v38.1: removed Emotion Log touch lock */");
  html=html.replace("</style>",PATCH_CSS+"</style>");
  html=html.replace("</body>",PATCH_JS+"</body>");
  html=html.replace(/v38(?!\.\d)/g,"v38.1");
  return html;
}

self.addEventListener("install",e=>self.skipWaiting());
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));

self.addEventListener("fetch",event=>{
  const req=event.request;
  if(req.method!=="GET")return;
  const url=new URL(req.url);

  if(url.pathname.endsWith("/index.html")||url.pathname.endsWith("/Recovery-journal/")||url.pathname.endsWith("/Recovery-journal")){
    event.respondWith(
      fetch(req,{cache:"no-store"}).then(async response=>{
        if(!response.ok)return response;
        const html=await response.text();
        return new Response(patchIndex(html),{status:response.status,statusText:response.statusText,headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store"}});
      }).catch(()=>caches.match(req))
    );
    return;
  }

  event.respondWith(
    fetch(req).then(response=>{
      if(response.ok&&url.origin===location.origin){
        const copy=response.clone();
        caches.open(CACHE).then(cache=>cache.put(req,copy)).catch(()=>{});
      }
      return response;
    }).catch(()=>caches.match(req))
  );
});
