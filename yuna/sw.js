// 유나 타워 오프라인용 (build_yuna_site.py가 만듦, 직접 고치지 말 것)
const V = "yuna-3fefaf8b74", SAME = ["./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png", "tower3d.js", "tower3d_floor.js", "floor3d_wf.js", "floor3d_lobby.js", "floor3d_studio.js", "floor3d_roof.js", "floor3d_home.js", "floor3d_park.js", "floor3d_town.js", "floor3d_fun.js", "floor3d_school.js", "floor3d_market.js", "floor3d_river.js", "floor3d_court.js", "floor3d_gym.js", "yuna_game.js", "map3d_art.js", "mung3d.js", "race3d.js", "race3d_path.js", "race3d_track.js", "race3d_car.js", "race3d_audio.js", "mung/director.jpg", "mung/director.json", "mung/nora.jpg", "mung/nora.json", "mung/yuna.jpg", "mung/yuna.json", "home/aveo.json", "home/aveo.jpg", "home/tesla.json", "home/tesla.jpg"], CDN = ["https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js", "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js", "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/geometries/RoundedBoxGeometry.js", "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/environments/RoomEnvironment.js", "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/utils/BufferGeometryUtils.js", "https://fonts.googleapis.com/css2?family=Jua&family=IBM+Plex+Sans+KR:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500&family=Inter+Tight:wght@600;800&family=Fraunces:ital,wght@1,500&display=swap"];
self.addEventListener("install", e => { self.skipWaiting();
  e.waitUntil(caches.open(V).then(c => Promise.all([...SAME, ...CDN].map(u => c.add(u).catch(() => {}))))); });
self.addEventListener("activate", e => e.waitUntil(caches.keys()
  .then(ks => Promise.all(ks.filter(k => k.startsWith("yuna-") && k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())));
const put = (req, res) => { if(res && (res.ok || res.type === "opaque")){ const c = res.clone(); caches.open(V).then(x => x.put(req, c)); } return res; };
self.addEventListener("fetch", e => {
  const r = e.request, u = new URL(r.url);
  if(r.method !== "GET") return;
  if(u.origin === location.origin && u.pathname.startsWith("/yuna/")){
    // 새 버전 먼저 (3초 안에 안 오면 저장본)
    const net = fetch(r.url, {cache: "no-cache"}).then(res => put(r, res));
    e.respondWith(new Promise(ok => {
      let done = false; const fin = v => { if(!done && v){ done = true; ok(v); } };
      const old = () => caches.match(r, {ignoreSearch: true}).then(fin);
      const t = setTimeout(old, 3000);
      net.then(v => { clearTimeout(t); fin(v); }).catch(() => { clearTimeout(t); old().then(() => { if(!done) ok(Response.error()); }); });
    }));
    return;
  }
  if(/^(cdn\.jsdelivr\.net|fonts\.(googleapis|gstatic)\.com)$/.test(u.hostname) || (u.origin === location.origin && u.pathname.startsWith("/imgs/"))){
    e.respondWith(caches.match(r).then(hit => hit || fetch(r).then(res => put(r, res))));
  }
});
