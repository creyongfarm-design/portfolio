/* 크레용타워 1F 로비·카페 3D (2026-11-22 감독님 "다른 층도 다 해야지")
   - 2.5D drawLobby(크레용사무실.html) 배치·색 그대로. 좌표는 칸, 높이는 엔진 hz(px)
   - 사람·차·문·김은 타워 2.5D 시뮬(opts.sim = F3_SIM.lobby)을 매 프레임 따라 함. 3D는 그리기만
   - 손님·PD는 자리(슬롯) 몇 개를 돌려 씀: 색은 인스턴스 색만 바꿔 끼움 */
const GJ = 20, GI = 29, WI = 36, CH = 14.5, WALL = 112;
const EXT = [-6, -3, 43.6, 29.4];
const LAMPS = [[4.0,21.9],[22.0,21.9],[37.9,8.0],[33.2,21.9]];
const TREES = [[1.5,21.5],[12.2,21.6],[20.2,21.6],[23.8,21.6],[31.0,21.6],[35.4,21.6],[37.6,4.0],[37.6,11.0],[37.6,17.0]];
const L_SPACES = [[2.8,1.65],[2.8,4.15],[2.8,6.65],[2.8,9.15],[2.8,11.65],[2.8,14.15]];
const WL = (skin, hair, style, shirt, pants) => ({skin, hair, style, shirt, pants});
const UNI = (skin, hair, style) => ({skin, hair, style, shirt:"#2E3A5C", pants:"#2E3A5C", skirt:"#2E3A5C", legs:"#E8C7AE", scarf:"#3A8A78", badge:true});
/* 늘 있는 사람들 (2.5D LOBBY_PEOPLE 그대로). 시뮬이 없을 때는 이 자리에 그냥 둠 */
const RES = [
  {id:"l_bar", name:"바리스타", tag:true, role:"크레용 카페", apron:"#8B5A3C", at:[22.0,1.1], face:-1, look:WL("#EAC7A8","#2A2420","bun","#F2EDE5","#2B2D30"), desc:"에스프레소 내리는 중 ☕"},
  {id:"l_rec", name:"안내 데스크", tag:true, role:"로비 안내", at:[15.4,4.1], look:UNI("#F3D3BC","#2A1E18","bun"), desc:"어서 오세요, 크레용타워입니다 😊"},
  {id:"l_rec2", name:"안내 데스크", role:"로비 안내", at:[17.0,4.1], look:UNI("#EFCBB0","#4A3226","bob"), desc:"방문증 챙겨 드리는 중 🪪"},
  {id:"l_lap", name:"단골 손님", role:"크레용 카페", at:[25.0,4.55], pose:"sit", front:true, act:"cup", look:WL("#E2B793","#3A2A20","long","#72C4AE","#33363C"), desc:"창가 자리 단골 ☕"},
  {id:"l_f1", name:"동네 손님", role:"크레용 카페", at:[22.3,12.25], pose:"sit", front:true, act:"cup", look:WL("#EDC6A6","#3B2B22","bob","#D9B26F","#3A3936"), desc:"친구랑 수다 중 💬"},
  {id:"l_f2", name:"동네 손님", role:"크레용 카페", at:[22.3,13.35], pose:"sit", act:"eat", look:WL("#DDB08C","#141414","cap","#5C6B8A","#2B2D30"), desc:"크로플 먹는 중 🥐"},
  {id:"l_t1", name:"테라스 손님", role:"테라스", at:[33.8,16.65], pose:"sit", front:true, act:"cup", look:WL("#F0CDB2","#7A4A30","long","#C8B4D0","#45404A"), desc:"테라스에서 햇볕 쬐는 중 ☀️"},
  {id:"l_t2", name:"테라스 손님", role:"테라스", at:[33.8,17.75], pose:"sit", act:"cup", look:WL("#E5BC98","#1E1A17","short","#4DAA97","#2B2D30"), desc:"아이스 라떼 🧊"},
  {id:"l_ph", name:"사진 찍는 손님", role:"크레용 카페", at:[32.4,1.4], face:-1, act:"pad", look:WL("#F6D7C2","#3A261C","long","#FFFFFF","#E8A04A"), desc:"무지개 구름 앞에서 인증샷 📸"},
  {id:"l_sofa", name:"미팅 기다리는 손님", role:"로비", at:[18.0,12.55], pose:"sit", front:true, act:"book", book:"#3A8A78", look:WL("#D7A985","#241C18","short","#2A2A28","#3A3D42"), desc:"2층 미팅 기다리는 중 📄"},
  {id:"l_s1", name:"수험생", role:"크레용 카페 · 24시간", at:[27.6,8.95], pose:"sit", front:true, act:"book", book:"#E8A04A", look:WL("#F2D2BA","#2A221E","long","#E9E4DA","#45404A"), desc:"수능 문제집 푸는 중 ✏️"},
  {id:"l_s2", name:"수험생", role:"크레용 카페 · 24시간", at:[27.6,10.05], pose:"sit", act:"book", book:"#7FA7D9", look:WL("#E5BC98","#141414","short","#5C6B8A","#2B2D30"), desc:"인강 들으며 필기 중 🎧"},
  {id:"l_s3", name:"공시생", role:"크레용 카페 · 24시간", at:[22.5,18.45], pose:"sit", front:true, act:"book", book:"#3A8A78", look:WL("#EFCBB0","#3B2B22","bob","#C8B4D0","#3A3936"), desc:"공무원 시험 공부 중 📚"},
  {id:"l_s4", name:"수험생", role:"크레용 카페 · 24시간", at:[23.5,18.45], pose:"sit", front:true, act:"cup", look:WL("#DDB08C","#1E1A17","cap","#2A2A28","#3A3D42"), desc:"아메리카노 세 잔째 ☕📖"},
  {id:"l_park", name:"주차 안내", role:"주차장", at:[7.0,18.6], look:WL("#E8C3A4","#3A2A22","cap","#FFE066","#2B2D30"), desc:"주차는 2시간 무료예요 🚗"},
];
/* 돌려 쓰는 자리: 손님 12 · PD 3 (머리 모양별) */
const POOL_G = ["long","long","long","short","short","short","short","short","bob","bob","bun","bun"];
const POOL_P = ["bob","short","long"];
const SENT = {skin:"#010101", hair:"#020202", shirt:"#030303", pants:"#040404"};   // 색 바꿔 끼울 표시 색
const NORA = {skin:"#F3D3BC", hair:"#4A2E24", style:"long", shirt:"#F7F1EC", pants:"#B9A3C4"};
const YUNA = {skin:"#F6D7C2", hair:"#3A261C", style:"pig", ribbon:"#FF5FA8", shirt:"#FF8FB8", pants:"#6FA8DC"};
const NCAR = 10;
const CAR_H = 1.2;   // 차 높이만 살짝 (2.5D 차는 납작해서)

let ST = null;   // 열 때마다 새로
const EGG_ELEV = [{id:"_up", at:[12.95, 17.1, 40], emo:["🛗","⬆️"], lines:["▲"], elev:"up"}, {id:"_dn", at:[12.95, 18.3, 40], emo:["🛗","🙂"], lines:["▼"], elev:"down"}];

/* ---------- 작은 도구 ---------- */
function mergeParts(THREE, parts){   // [{g, m, c:[낮,밤]}] → 정점색 낮·밤 두 벌
  const ps = [], ns = [], cl = [], cd = [], nm = new THREE.Matrix3(), v = new THREE.Vector3(), a = new THREE.Color(), b = new THREE.Color();
  parts.forEach(({g, m, c}) => { const gg = g.index ? g.toNonIndexed() : g, P = gg.attributes.position, N = gg.attributes.normal; nm.getNormalMatrix(m); a.set(c[0]); b.set(c[1]);
    for(let k = 0; k < P.count; k++){ v.fromBufferAttribute(P, k).applyMatrix4(m); ps.push(v.x, v.y, v.z); v.fromBufferAttribute(N, k).applyMatrix3(nm).normalize(); ns.push(v.x, v.y, v.z); cl.push(a.r, a.g, a.b); cd.push(b.r, b.g, b.b); }
    if(gg !== g) gg.dispose(); });
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.Float32BufferAttribute(ps, 3)); out.setAttribute("normal", new THREE.Float32BufferAttribute(ns, 3));
  out.setAttribute("color", new THREE.Float32BufferAttribute(cl.slice(), 3)); out.userData = {L:new Float32Array(cl), D:new Float32Array(cd)};
  return out;
}
function imesh(THREE, geo, mat, n){
  const im = new THREE.InstancedMesh(geo, mat, n), z = new THREE.Matrix4().makeScale(0, 0, 0), w = new THREE.Color(1, 1, 1);
  for(let k = 0; k < n; k++){ im.setMatrixAt(k, z); im.setColorAt(k, w); }
  im.frustumCulled = false; im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); return im;
}
const minus = (a, b, gaps) => { let segs = [[a, b]]; gaps.forEach(([g0, g1]) => { segs = segs.flatMap(([s0, s1]) => s1 <= g0 || s0 >= g1 ? [[s0, s1]] : [[s0, Math.min(s1, g0)], [Math.max(s0, g1), s1]].filter(([x, y]) => y - x > 0.05)); }); return segs; };
const gridSegs = (a0, a1, step, gaps = []) => { const pts = []; for(let a = a0; a < a1 - 0.01; a += step) pts.push(a); pts.push(a1); return pts.slice(0, -1).flatMap((a, k) => minus(a, pts[k + 1], gaps)); };

/* 차 한 대 (2.5D drawCar 치수, 코가 +x). 칠(몸통·지붕) · 유리·바퀴 · 등 세 덩어리 */
function carParts(K, col){
  const {THREE, hz, rbox, cyl} = K, h = v => hz(v) * CAR_H, M = (x, y, z, rx = 0) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, 0, 0)), new THREE.Vector3(1, 1, 1));
  const paint = [], fixed = [], lamp = [], glass = K.D2("#A9C3D3", "#2C3A4E"), tire = ["#1E1E1E", "#141414"];
  paint.push({g:rbox(2.3, h(8), 1.1, 0.13, 2), m:M(0, h(2.5) + h(8) / 2, 0), c:col});
  fixed.push({g:rbox(1.43, h(7), 0.94, 0.12, 2), m:M(-0.25, h(10.5) + h(7) / 2 - 0.01, 0), c:glass});
  paint.push({g:rbox(1.3, h(1.6), 0.86, 0.06, 1), m:M(-0.25, h(17.6) - 0.01, 0), c:K.sh(col, 0.12)});
  [-1.14, 1.14].forEach(x => fixed.push({g:rbox(0.07, h(2.2), 1.04, 0.03, 1), m:M(x, h(4.6), 0), c:["#3A3A3C", "#2A2A2C"]}));   // 범퍼
  fixed.push({g:rbox(1.75, h(1.4), 1.12, 0.03, 1), m:M(0, h(3.2), 0), c:["#4A4A4C", "#2E2E30"]});   // 아랫단
  [-0.7, 0.7].forEach(x => [-0.5, 0.5].forEach(z => fixed.push({g:cyl(0.16, 0.16, 0.13, 14), m:M(x, 0.16, z, Math.PI / 2), c:tire})));
  [-0.35, 0.35].forEach(z => { lamp.push({g:rbox(0.03, 0.06, 0.16, 0), m:M(1.155, h(7), z), c:["#FFF3C2", "#FFF3C2"]}); lamp.push({g:rbox(0.03, 0.06, 0.16, 0), m:M(-1.155, h(7), z), c:["#E2403A", "#FF5A4A"]}); });
  return {paint, fixed, lamp};
}
const carDir = c => typeof c.dir === "string" ? c.dir : c.pass ? (c.dir > 0 ? "+i" : "-i") : c.st === "arrive" ? "-i" : "-i";
const DIR_YAW = {"+i":0, "-i":Math.PI, "+j":-Math.PI / 2, "-j":Math.PI / 2};

const def = {
  id:"lobby",
  zones:{
    l_park: {name:"주차장",      color:"#7A8088", rect:[0,0,10.4,GJ],  label:[5.2,0,"top"]},
    l_lobby:{name:"로비",        color:"#3A8A78", rect:[10.4,0,20.6,GJ], label:[15.5,0,"top"]},
    l_cafe: {name:"크레용 카페", color:"#A0704C", rect:[20.6,0,WI,GJ],   label:[28.3,0,"top"]},
  },
  subs:{},
  outline:[[EXT[0],EXT[1]],[EXT[2],EXT[1]],[EXT[2],EXT[3]],[EXT[0],EXT[3]]],
  ext:EXT,
  top:3.9,
  backWalls:true,
  lamps:LAMPS.map(([i, j]) => [i, j, 1.75]),
  glow:{color:0xFF9CC8, at:[32.5, 1.3, 1.5]},
  eggs:[],   // build 에서 채움: 수상 진열장(타워 L_EGGS) + 엘리베이터 (오른쪽 문 = 위층, 왼쪽 문 = 아래층)
  /* 처음 화면 = 2.5D FULL_L 테두리 (뒤 벽 위 · 왼쪽 보도 · 오른쪽 도로 · 앞 도로) */
  allPts:V3 => [V3(-0.3, 3.95, -0.3), V3(-1.0, 0, 28.6), V3(40.2, 0, 0.6), V3(30.3, 0, 29.4), V3(36, 3.9, -0.3), V3(-0.3, 3.9, 20)],
  people:[
    ...RES.map(r => ({id:r.id, name:r.name, role:r.role, task:r.desc, hex:"#A0704C", look:{...r.look, style:r.look.style === "cap" ? "short" : r.look.style}, at:r.at, face:r.pose === "sit" ? (r.front ? 0 : Math.PI) : r.face < 0 ? Math.PI : 0})),
    ...POOL_G.map((st, k) => ({id:"lg" + k, name:"손님", role:"", task:"", hex:"#A0704C", look:{...SENT, style:st}, at:[-40, -40], face:0})),
    ...POOL_P.map((st, k) => ({id:"lp" + k, name:"PD", role:"", task:"", hex:"#9C9384", look:{...SENT, style:st}, at:[-40, -40], face:0})),
    {id:"l_nora", name:"노라 이사님", role:"예운옥 이사", task:"", hex:"#A57FB8", look:NORA, build:{h:0.97, w:0.88}, at:[-40, -40], face:0},
    {id:"l_yuna", name:"유나", role:"크레용 · 노라 이사님 딸 · 10살", task:"", hex:"#FF6FA8", look:YUNA, build:{h:0.74, w:0.9}, kid:true, at:[-40, -40], face:0},
  ],

  /* ---------- 바닥 한 장: 바깥 땅 · 보도 · 도로 · 건물 바닥 (2.5D lobbyGround + lobbyFloor) ---------- */
  paintFloor(c, dark, K){
    const dd = (l, d) => dark ? d : l, sh = K.shade, FS = K.FS;
    const rect = (i0, j0, i1, j1, col) => { c.fillStyle = col; c.fillRect(i0, j0, i1 - i0, j1 - j0); };
    const line = (i0, j0, i1, j1, col, w) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(i0, j0); c.lineTo(i1, j1); c.stroke(); };
    const poly = (pts, col) => { c.fillStyle = col; c.beginPath(); pts.forEach(([i, j], k) => k ? c.lineTo(i, j) : c.moveTo(i, j)); c.closePath(); c.fill(); };
    const text = (t, i, j, size, col, w = 800, fam = K.FONT) => { c.save(); c.translate(i, j); c.scale(1 / FS, 1 / FS); c.font = `${w} ${size * FS / 31.3}px ${fam}`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = col; c.fillText(t, 0, 0); c.restore(); };
    const [a0, b0, a1, b1] = EXT, grass = dd("#A9C98E", "#2F4430"), pave = dd("#E3DDD2", "#3A3734"), road = dd("#5E6168", "#1E1F22"), curb = dd("#BDB5A9", "#4A4642");
    rect(a0, b0, a1, b1, grass);
    // 잔디 결 (아주 옅게)
    c.globalAlpha = dark ? 0.06 : 0.1; for(let k = 0; k < 900; k++){ const i = a0 + (k * 7.31) % (a1 - a0), j = b0 + (k * 3.77) % (b1 - b0); c.fillStyle = k % 2 ? "#FFFFFF" : "#3E6B3A"; c.fillRect(i, j, 0.05, 0.05); } c.globalAlpha = 1;
    rect(a0, GJ, a1, 22.2, pave); rect(GI, CH, WI, GJ, pave); rect(WI, -2, 38.6, 22.2, pave);
    c.globalAlpha = 0.5; for(let i = -30; i < 60; i += 0.8) if(i > a0 - 1 && i < a1 + 1) line(i, GJ, i, 22.2, sh(pave, -0.12), 0.016);
    for(let j = -2; j < 22.2; j += 0.8) line(WI, j, 38.6, j, sh(pave, -0.12), 0.016); c.globalAlpha = 1;
    rect(a0, 22.15, a1, 22.35, curb);
    rect(a0, 22.35, a1, 27.4, road); rect(38.6, b0, a1, 22.35, road);
    // 아스팔트 결
    c.globalAlpha = dark ? 0.08 : 0.12; for(let k = 0; k < 1400; k++){ const i = a0 + (k * 5.17) % (a1 - a0), j = 22.35 + (k * 2.39) % 5.05; c.fillStyle = k % 3 ? "#FFFFFF" : "#000000"; c.fillRect(i, j, 0.035, 0.035); } c.globalAlpha = 1;
    rect(5.3, GJ, 10.4, 22.35, sh(road, 0.25));
    for(let i = -30; i < 60; i += 2.4) if(i + 1.3 < 15.6 || i > 19.6) rect(i, 24.72, i + 1.3, 24.88, "#F2C14E");
    for(let k = 0; k < 9; k++) rect(16.0, 22.6 + k * 0.5, 19.2, 22.88 + k * 0.5, "rgba(255,255,255,.85)");
    rect(a0, 27.4, a1, b1, pave); rect(a0, 27.4, a1, 27.6, curb);
    c.globalAlpha = 0.5; for(let i = -30; i < 60; i += 0.8) if(i > a0 - 1 && i < a1 + 1) line(i, 27.6, i, b1, sh(pave, -0.12), 0.016); c.globalAlpha = 1;
    text("크레용타워 · CREYONG TOWER", 25.0, 28.5, 6, dd("rgba(90,80,70,.35)", "rgba(220,210,190,.18)"), 800);
    TREES.forEach(([i, j]) => { c.fillStyle = dd("#7A6A58", "#3A3028"); c.beginPath(); c.arc(i, j, 0.34, 0, 7); c.fill(); c.fillStyle = dd("rgba(0,0,0,.08)", "rgba(0,0,0,.2)"); c.beginPath(); c.arc(i, j, 0.26, 0, 7); c.fill(); });
    // 건물 바닥
    poly([[0,0],[WI,0],[WI,CH],[GI,CH],[GI,GJ],[0,GJ]], dd("#E9E4DA", "#33302C"));
    rect(0, 0, 10.4, GJ, dd("#9A9DA3", "#2C2E31"));
    c.globalAlpha = dark ? 0.06 : 0.09; for(let k = 0; k < 700; k++){ const i = (k * 3.31) % 10.4, j = (k * 7.13) % GJ; c.fillStyle = k % 2 ? "#FFFFFF" : "#000000"; c.fillRect(i, j, 0.04, 0.04); } c.globalAlpha = 1;
    [0.4,2.9,5.4,7.9,10.4,12.9,15.4].forEach(j => line(0.3, j, 5.3, j, "rgba(255,255,255,.85)", 0.035)); line(5.3, 0.4, 5.3, 15.4, "rgba(255,255,255,.85)", 0.035);
    rect(0.6, 12.95, 5.0, 15.35, dd("#5A86C8", "#2E4A70")); text("♿", 2.8, 14.15, 9, "#FFFFFF", 700);
    [[7.85,18.0],[7.85,8.0]].forEach(([i, j]) => text("▲", i, j, 14, "rgba(255,255,255,.75)", 800));
    text("P", 7.85, 13.0, 22, "rgba(255,255,255,.55)", 900, K.SIGN);
    // 로비 대리석 (체크 무늬 반듯하게)
    const mb = dd("#EFEAE2", "#3A3631"), alt = dd("#E4DDD2", "#34302C"); rect(10.4, 0, 20.6, GJ, mb);
    for(let ca = 0; ca < 6; ca++) for(let rb = 0; rb < 12; rb++) if((ca + rb) % 2) rect(10.4 + ca * 1.7, rb * 1.7, 10.4 + (ca + 1) * 1.7, Math.min(GJ, (rb + 1) * 1.7), alt);
    c.globalAlpha = dark ? 0.1 : 0.16; for(let ca = 1; ca < 6; ca++) line(10.4 + ca * 1.7, 0, 10.4 + ca * 1.7, GJ, dd("#CFC6B8", "#24211E"), 0.012); for(let rb = 1; rb < 12; rb++) line(10.4, rb * 1.7, 20.6, rb * 1.7, dd("#CFC6B8", "#24211E"), 0.012); c.globalAlpha = 1;
    { const g = c.createRadialGradient(16.2, 13.6, 0, 16.2, 13.6, 2.27), col = dd("rgba(58,138,120,.18)", "rgba(77,170,151,.15)"), z0 = dd("rgba(58,138,120,0)", "rgba(77,170,151,0)");
      g.addColorStop(0, col); g.addColorStop(0.75, col); g.addColorStop(1, z0); c.fillStyle = g; c.beginPath(); c.arc(16.2, 13.6, 2.27, 0, 7); c.fill(); }
    rect(17.0, 11.6, 20.2, 15.0, dd("#D9C49A", "#5A4A36")); c.strokeStyle = dd("rgba(140,110,60,.35)", "rgba(0,0,0,.25)"); c.lineWidth = 0.04; c.strokeRect(17.15, 11.75, 2.9, 3.1);
    rect(14.4, 18.6, 17.6, GJ, dd("#5A5450", "#2A2725"));
    // 카페 헤링본
    poly([[20.6,0],[WI,0],[WI,CH],[GI,CH],[GI,GJ],[20.6,GJ]], dd("#D6B087", "#4A3727"));
    c.strokeStyle = dd("rgba(120,80,40,.2)", "rgba(0,0,0,.24)"); c.lineWidth = 0.02;
    for(let j = 0; j < GJ; j += 0.5){ const iEnd = j < CH ? WI : GI; c.beginPath(); for(let k = 0; 20.6 + k * 0.35 <= iEnd; k++){ const i = 20.6 + k * 0.35, jj = j + (k % 2) * 0.5; k ? c.lineTo(i, jj) : c.moveTo(i, jj); } c.stroke(); }
    // 건물 앞 턱 (2.5D 슬래브 앞면 띠)
    rect(0, GJ - 0.06, GI, GJ, sh(dd("#D9D3C8", "#55504A"), -0.05));
    // 가로등 빛 웅덩이 (다크)
    if(dark) LAMPS.forEach(([i, j]) => { const g = c.createRadialGradient(i, j, 0, i, j, 2.0); g.addColorStop(0, "rgba(255,226,160,.26)"); g.addColorStop(1, "rgba(255,226,160,0)"); c.fillStyle = g; c.beginPath(); c.arc(i, j, 2.0, 0, 7); c.fill(); });
  },

  /* ---------- 고정 물건 (굳혀서 재질별 한 덩어리) ---------- */
  build(K){
    const {THREE, B, faceI, faceJ, wtext, sm, rbox, cyl, sph, plant, sh, cp, hz, X, Z, D2:D} = K, FONT = K.FONT;
    ST = {dark:false, slots:{}, gUse:new Map(), pUse:new Map(), cUse:new Map(), elevTxt:[false, false], t0:0};
    const metal = "metal", FRAME = D("#5A5D63", "#8A8E94"), GLASS = D("#BED7E6", "#7896B4"), WD = D("#8B5A3C", "#5A3E2C");
    const amber = D("#E8A04A", "#F0AE5E"), wallTop = "wall-top", pave = D("#E3DDD2", "#3A3734");
    const cylAt = (rt, rb, hpx, col, i, j, z0px = 0, cls = "m", seg = 16) => sm(cyl(rt, rb, hz(hpx), seg), col, X(i), hz(z0px) + hz(hpx) / 2, Z(j), null, cls);
    const rod = (a, b, r, col, cls = "s") => { const A = new THREE.Vector3(...a), Bv = new THREE.Vector3(...b), o = sm(cyl(r, r, A.distanceTo(Bv), 6), col, (A.x + Bv.x) / 2, (A.y + Bv.y) / 2, (A.z + Bv.z) / 2, null, cls); o.lookAt(Bv); o.rotateX(Math.PI / 2); return o; };

    /* 디오라마 받침 (앞·오른쪽 단면) */
    const [a0, b0, a1, b1] = EXT, base = 16;
    sm(rbox(a1 - a0 - 0.02, hz(base), b1 - b0 - 0.02, 0), D("#8E8676", "#1C1A17"), X((a0 + a1) / 2), -hz(base) / 2 - 0.003, Z((b0 + b1) / 2));
    B(a0, b1, a1 - a0, 0.012, base, sh(pave, -0.16), -base, {r:0});
    B(a1, b0, 0.012, 27.4 - b0, base, D("#4E5157", "#18191B"), -base, {r:0}); B(a1, 27.4, 0.012, b1 - 27.4, base, sh(pave, -0.24), -base, {r:0});
    B(a0, b1, a1 - a0, 0.016, 4, sh(pave, -0.05), -4, {r:0}); B(a1, b0, 0.016, b1 - b0, 4, D("#6A6D73", "#232427"), -4, {r:0});
    /* 연석 (앞 보도 · 건너편 보도). 주차장 들어가는 길은 끊김 */
    const curb = D("#BDB5A9", "#4A4642");
    [[a0, 5.3], [10.4, a1]].forEach(([s, e]) => B(s, 22.15, e - s, 0.2, 3.2, curb, 0, {r:0.02})); B(a0, 27.4, a1 - a0, 0.2, 3.2, curb, 0, {r:0.02});

    /* 벽: 뒤 벽 4색 · 왼벽 · 윗면 띠 · 걸레받이 · 끝 단면 */
    const t = 0.25;
    [[0,10.4,D("#B9BCC0","#3A3C40")],[10.4,20.6,D("#F2EEE7","#3A3631")],[20.6,29.0,D("#C98D69","#4A3226")],[29.0,WI,D("#F4E8EE","#3E3440")]].forEach(([a, b, col]) => B(a, -t, b - a, t, WALL, col, 0, {r:0}));
    B(-t, 0, t, GJ, WALL, D("#C4C7CB", "#34363A"), 0, {r:0}); B(-t, -t, t, t, WALL, D("#B9BCC0", "#3A3C40"), 0, {r:0});
    B(-t - 0.02, -t - 0.02, WI + t + 0.02, t + 0.04, 3, wallTop, WALL, {r:0}); B(-t - 0.02, -t, t + 0.04, GJ + t, 3, wallTop, WALL, {r:0});
    B(WI, -t, 0.02, t, WALL, sh(wallTop, -0.2), 0, {r:0}); B(-t, GJ, t, 0.02, WALL, sh(wallTop, -0.1), 0, {r:0});
    faceJ(0, WI, 0.0, 0, 4, sh(wallTop, -0.1), "m", 0.03); faceI(0.0, 0, GJ, 0, 4, sh(wallTop, -0.1), "m", 0.03);

    /* 주차장 벽: 노란 띠 + 검은 빗금 · P 간판 */
    faceJ(0, 10.4, 0.0, 10, 18, "#F2C14E", "m", 0.03); faceI(0.0, 0, GJ, 10, 18, "#F2C14E", "m", 0.03);
    K.decal(10.4 * 44, 14, (cx, W, H) => { cx.fillStyle = "#2A2A28"; for(let i = 0.4; i < 10.4; i += 1.2){ const x = v => v / 10.4 * W; cx.beginPath(); cx.moveTo(x(i), H); cx.lineTo(x(i + 0.6), H); cx.lineTo(x(i + 0.9), 0); cx.lineTo(x(i + 0.3), 0); cx.closePath(); cx.fill(); } },
      10.4, hz(8), "i", 5.2, 0.01, hz(14));
    faceJ(6.4, 9.3, 0.0, 52, 86, "#2E5FA8", "m", 0.04);
    wtext("P", 7.85, 0.02, 72, "i", 22, "#FFFFFF", null, 900); wtext("방문객 2시간 무료", 7.85, 0.02, 57, "i", 3.8, "#FFFFFF", null, 700, FONT);
    wtext("CREYONG TOWER PARKING", 3.4, 0.01, 40, "i", 3.6, D("#5A5D63", "#B3B6BB"), null, 800);
    /* 필로티 기둥 6 + 노란 보호대 */
    [[5.3,5.4],[5.3,10.4],[5.3,15.4],[10.15,0.3],[10.15,5.4],[10.15,15.4]].forEach(([i, j]) => { B(i - 0.25, j - 0.25, 0.5, 0.5, WALL, D("#D9D3C8", "#4A4642"), 0, {r:0.04});
      faceI(i + 0.25, j - 0.25, j + 0.25, 0, 14, "#F2C14E", "m", 0.02); faceJ(i - 0.25, i + 0.25, j + 0.25, 0, 14, "#F2C14E", "m", 0.02); });
    /* 정산기 · 자전거 거치대 */
    B(1.2, 16.9, 0.8, 0.6, 22, "#2E5FA8", 0, {r:0.05}); faceJ(1.25, 1.95, 17.5, 14, 20, "#A9C3D3", "glow", 0.01);
    wtext("정산", 1.6, 17.5, 9, "i", 2.6, "#FFFFFF", null, 800, FONT);
    [2.8, 3.6, 4.4].forEach(i => cylAt(0.022, 0.022, 12, metal, i, 18.4, 0, "s", 8));
    rod([X(2.8), hz(12), Z(18.4)], [X(4.4), hz(12), Z(18.4)], 0.02, metal);
    [[3.0,"#E8A04A"],[4.2,"#3A8A78"]].forEach(([bi, bc]) => { const y = 0.15, z = Z(18.9), xr = X(bi) - 0.22, xf = X(bi) + 0.22;
      [xr, xf].forEach(x => sm(new THREE.TorusGeometry(0.14, 0.018, 6, 18), "#2A2A28", x, y, z, null, "s"));
      rod([xr, y, z], [X(bi) - 0.02, 0.33, z], 0.016, bc); rod([X(bi) - 0.02, 0.33, z], [xf, y, z], 0.016, bc); rod([xr, y, z], [X(bi) + 0.06, y + 0.02, z], 0.014, bc);
      rod([X(bi) + 0.06, y + 0.02, z], [X(bi) - 0.02, 0.33, z], 0.014, bc); rod([X(bi) + 0.16, 0.36, z], [xf, y, z], 0.014, bc);
      sm(rbox(0.12, 0.025, 0.06, 0.01), "#2A2A28", X(bi) - 0.04, 0.35, z, null, "s"); rod([X(bi) + 0.16, 0.36, z - 0.1], [X(bi) + 0.16, 0.36, z + 0.1], 0.012, "#2A2A28"); });
    /* 주차장 ↔ 로비 유리 칸막이 (i 10.4) + 문 */
    [[0.3,1.9],[9.9,10.9],[12.7,15.6]].forEach(([s, e]) => gridSegs(s, e, 1.6).forEach(([b, b2]) => {   // j 1.9~9.9 = 수상 벽
      B(10.35, b, 0.1, b2 - b, 10, D("#BDB5A9", "#4A4642"), 0, {r:0}); faceI(10.39, b, b2, 10, 46, GLASS, "glass", 0.02);
      B(10.37, b, 0.06, b2 - b, 1.2, metal, 45.4, {cls:"s", r:0}); B(10.37, b - 0.02, 0.06, 0.04, 36, metal, 10, {cls:"s", r:0}); }));
    B(10.37, 15.58, 0.06, 0.04, 36, metal, 10, {cls:"s", r:0});
    [10.9, 12.7].forEach(b => B(10.35, b - 0.05, 0.1, 0.1, 50, metal, 0, {cls:"s", r:0})); B(10.36, 10.9, 0.08, 1.8, 1.6, metal, 48.6, {cls:"s", r:0});
    faceI(10.36, 11.15, 12.45, 51, 57, D("#F7F3EC", "#2A2725"), "m", 0.04);
    wtext("로비 →", 10.4, 11.8, 54, "j", 2.6, D("#3A8A78", "#9EE3D3"), null, 800, FONT);

    /* 수상 진열장 + 작품 포스터 벽 (2.5D lobbyAwards 그대로 · 그림은 타워 POSTERS · PLAQUES 를 시뮬로 받아 씀) */
    { const S = K.R.opts.sim ? K.R.opts.sim() : null, sim = () => { try { return K.R.opts.sim?.() || null; } catch(e){ return null; } };
      const PW = 10.5, LPJ = [7.025, 5.325, 3.625], dkw = D("#2A2A28", "#1E1D1B"), warm = D("#FFF1D2", "#FFE2A0");
      B(10.3, 1.9, 0.2, 8.0, 103, D("#25302D", "#1A2220"), 0, {r:0}); faceI(PW, 1.9, 9.9, 100, 103, "#3A8A78", "m", 0.006);
      wtext("AWARDS & FILMOGRAPHY", PW, 5.9, 95.5, "j", 4.6, D("#E9E2D3", "#CFC7B8"), null, 800);
      LPJ.forEach((j, k) => { const w = 1.1, z0 = 49, z1 = z0 + w * 31.3, jc = j + w / 2;
        faceI(PW, j - 0.08, j + w + 0.08, z0 - 2.6, z1 + 2.6, "#B48A34", "s", 0.02); faceI(PW + 0.02, j - 0.04, j + w + 0.04, z0 - 1.3, z1 + 1.3, "#141414", "m", 0.01);
        K.decal(256, 256, (c, W, H) => { const im = sim()?.posters?.[k]; if(im && im.complete && im.naturalWidth){ c.drawImage(im, 0, 0, W, H); const g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, "rgba(255,255,255,.16)"); g.addColorStop(0.45, "rgba(255,255,255,0)"); g.addColorStop(1, "rgba(0,0,0,.10)"); c.fillStyle = g; c.fillRect(0, 0, W, H); } else { c.fillStyle = "#3A3A38"; c.fillRect(0, 0, W, H); } },
          w, hz(z1 - z0), "j", PW + 0.008, jc, hz((z0 + z1) / 2));
        K.decal(32, 96, (c, W, H, dark) => { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, dark ? "rgba(255,226,160,.36)" : "rgba(255,236,190,.26)"); g.addColorStop(1, "rgba(255,236,190,0)"); c.fillStyle = g; c.fillRect(0, 0, W, H); },
          w - 0.08, hz(z1 + 3.5 - z0 - 6), "j", PW + 0.014, jc, hz((z0 + 6 + z1 + 3.5) / 2));
        // 작은 액자등 (황동)
        rod([X(PW), hz(z1 + 5), Z(jc)], [X(PW + 0.2), hz(z1 + 7.5), Z(jc)], 0.012, "#B48A34");
        B(PW + 0.12, j + 0.3, 0.14, w - 0.6, 1.4, "#C9A64A", z1 + 7, {cls:"s", r:0});
        sm(rbox(0.1, 0.01, w - 0.64, 0), warm, X(PW + 0.19), hz(z1 + 7) - 0.006, Z(jc), null, "glow"); });
      // 유리 진열장: 받침 · 뒤 조명판 · 바닥
      const i0 = PW, i1 = 11.2, j0 = 2.5, j1 = 9.3, zb = 8, zt = 44, ci = 10.86;
      B(i0, j0, i1 - i0, j1 - j0, zb, dkw, 0, {r:0.01}); faceI(i1, j0, j1, 1.2, 1.8, "#C9A64A", "s", 0.004);
      wtext("크레용프로덕션 · 작품과 수상", i1, (j0 + j1) / 2, 4.8, "j", 2.6, D("#E9D9B0", "#CDB98A"), null, 700, FONT);
      K.decal(32, 160, (c, W, H, dark) => { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, dark ? "rgba(255,222,160,.85)" : "rgba(255,240,210,.95)"); g.addColorStop(1, dark ? "rgba(255,222,160,.22)" : "rgba(255,240,210,.45)"); c.fillStyle = g; c.fillRect(0, 0, W, H); },
        j1 - j0 - 0.08, hz(zt - zb), "j", i0 - 0.02, (j0 + j1) / 2, hz((zb + zt) / 2));   // 뒤 조명 (위가 밝게)
      B(i0 + 0.02, j0 + 0.02, i1 - i0 - 0.04, j1 - j0 - 0.04, 0.3, D("#F3EBDD", "#4A4339"), zb, {r:0});
      // 캐나다 우수상: 금색 컵 + 빨간 단풍
      { const cj = 3.2; B(ci - 0.16, cj - 0.16, 0.32, 0.32, 4, "#1E1E1C", zb); B(ci - 0.12, cj - 0.12, 0.24, 0.24, 2, "#C9A64A", zb + 4, {cls:"s"}); B(ci - 0.04, cj - 0.04, 0.08, 0.08, 6, "#D9B355", zb + 6, {cls:"s"});
        sm(cyl(0.12, 0.05, 0.2, 16), "#E8C463", X(ci), hz(zb + 16), Z(cj), null, "s");
        sm(new THREE.TorusGeometry(0.12, 0.012, 6, 20), "#F6DE8D", X(ci), hz(zb + 16) + 0.1, Z(cj), null, "s").rotation.x = Math.PI / 2;
        sm(sph(0.035, 8, 6), "#D8352A", X(ci) + 0.09, hz(zb + 16), Z(cj) + 0.06); }
      // 상패 (멜버른 · 비엔나): 금색 그림
      [[1, 4.5], [0, 7.3]].forEach(([k, jc]) => { const w = 0.7, pi = 10.79, j = jc - w / 2, z0 = zb + 1.4, z1 = zb + 21;
        B(pi - 0.13, j - 0.04, 0.2, w + 0.08, 1.4, "#2A2A28", zb); B(pi - 0.05, j, 0.05, w, z1 - z0, "#141414", z0, {r:0});
        faceI(pi, j + 0.03, j + w - 0.03, z0 + 0.8, z1 - 0.8, "#B48A34", "s", 0.004);
        K.decal(200, 220, (c, W, H) => { c.fillStyle = "#141414"; c.fillRect(0, 0, W, H); const im = sim()?.plaques?.[k]; if(im) c.drawImage(im, W * 0.04, H * 0.1, W * 0.92, H * 0.8); },
          w - 0.12, hz(z1 - z0 - 3.2), "j", pi - 0.015, jc, hz((z0 + z1) / 2)); });
      // 서울국제웹페스트 베스트브랜드상: 별 트로피
      { const cj = 5.9; B(ci - 0.16, cj - 0.16, 0.32, 0.32, 4, "#1E1E1C", zb); B(ci - 0.12, cj - 0.12, 0.24, 0.24, 2, "#C9A64A", zb + 4, {cls:"s"});
        B(ci - 0.04, cj - 0.04, 0.08, 0.08, 9, "#D9B355", zb + 6, {cls:"s"}); B(ci - 0.13, cj - 0.13, 0.26, 0.26, 7, "#E8C463", zb + 17, {cls:"s"}); B(ci - 0.15, cj - 0.15, 0.3, 0.3, 0.9, "#F6DE8D", zb + 24, {cls:"s"});
        const sg = new THREE.Shape(); for(let q = 0; q < 10; q++){ const a = -Math.PI / 2 + q * Math.PI / 5, rr = q % 2 ? 0.045 : 0.1; q ? sg.lineTo(Math.cos(a) * rr, -Math.sin(a) * rr) : sg.moveTo(Math.cos(a) * rr, -Math.sin(a) * rr); }
        const st = sm(new THREE.ExtrudeGeometry(sg, {depth:0.03, bevelEnabled:false}), "#F6DE8D", X(ci), hz(zb + 32), Z(cj), null, "s"); st.rotation.y = Math.PI / 4; }
      // 여수국제웹드라마영화제 심사위원 특별상: 컵 트로피
      { const cj = 8.6; B(ci - 0.13, cj - 0.13, 0.26, 0.26, 3, "#2A2A28", zb); B(ci - 0.06, cj - 0.06, 0.12, 0.12, 2, "#C9A64A", zb + 3, {cls:"s"}); B(ci - 0.02, cj - 0.02, 0.05, 0.05, 7, "#C9A64A", zb + 5, {cls:"s"});
        sm(cyl(0.11, 0.06, hz(6), 14), "#E8C463", X(ci), hz(zb + 15), Z(cj), null, "s"); sm(new THREE.TorusGeometry(0.11, 0.01, 6, 18), "#F3D77E", X(ci), hz(zb + 18), Z(cj), null, "s").rotation.x = Math.PI / 2;
        faceJ(ci - 0.11, ci + 0.11, cj + 0.13, zb + 0.6, zb + 2.4, "#C9A64A", "s", 0.006); }
      // 유리 · 모서리 · 위 뚜껑 + LED
      faceI(i1 - 0.01, j0, j1, zb + 0.3, zt, GLASS, "glass", 0.01); faceJ(i0, i1, j1 - 0.01, zb + 0.3, zt, GLASS, "glass", 0.01); faceJ(i0, i1, j0, zb + 0.3, zt, GLASS, "glass", 0.01);
      [j0, j1].forEach(j => B(i1 - 0.02, j - 0.01, 0.02, 0.02, zt - zb, metal, zb, {cls:"s", r:0}));
      B(i0 - 0.02, j0 - 0.02, i1 - i0 + 0.04, j1 - j0 + 0.04, 2.4, dkw, zt, {r:0.01}); faceI(i1 + 0.02, j0, j1, zt - 0.1, zt + 0.7, warm, "glow", 0.004);
      def.eggs = [...(S?.eggs || []).map(src => ({id:src.id, emo:src.emo, lines:src.lines, get at(){ return src.at; }, say:(k, g, line) => sim()?.egg(src.id) || line})), ...EGG_ELEV];
      if(S && [...S.posters, ...S.plaques].some(im => !im || im.complete === false)) setTimeout(() => { try { K.R.atlas.paint(K.R.dark); } catch(e){} }, 900); }

    /* 로비: 로고 벽 · 층별 안내 */
    faceJ(11.6, 19.4, 0.0, 30, 104, D("#2A2A28", "#1E1D1B"), "m", 0.04);
    wtext("CREYONG TOWER", 15.5, 0.02, 90, "i", 11, "#FFFFFF", null, 800);
    [["#3A8A78",12.6],["#E8A04A",14.6],["#8B5A3C",16.6],["#C8B4D0",18.6]].forEach(([col, i]) => faceJ(i - 0.85, i + 0.85, 0.04, 80, 82, col, "glow", 0.006));
    [["5F","옥상 · 풋살장 · 바베큐",74],["4F","스튜디오 · 예운옥 · 백록당 · 필름스쿨",66.5],["3F","복지층 · 식당 · 시사실 · 교회",59],["2F","업무층 · 크레용 사무실",51.5],["1F","로비 · 크레용 카페 · 주차장",44]].forEach(([f, n, z]) => {
      wtext(f, 12.9, 0.02, z, "i", 4.6, "#FFB547", null, 800); wtext(n, 16.4, 0.02, z, "i", 3.5, "#F4E9D6", null, 600, FONT); });
    wtext("어서 오세요 😊", 15.5, 0.02, 36, "i", 3.6, "#9EE3D3", null, 700, FONT);
    // 안내 데스크
    B(14.2, 4.6, 4.0, 0.8, 22, D("#FFFFFF", "#4A4642"), 0, {r:0.05, seg:2}); B(14.15, 4.55, 4.1, 0.9, 1.6, D("#E9E4DA", "#5A5550"), 22, {r:0.03});
    faceJ(14.2, 18.2, 5.4, 6, 16, "#3A8A78", "m", 0.015); wtext("INFORMATION · 안내", 16.2, 5.395, 11, "i", 3.0, "#FFFFFF", null, 800, FONT);
    B(14.75, 4.85, 0.08, 0.08, 5, metal, 23.6, {cls:"s", r:0}); B(14.6, 4.78, 0.5, 0.05, 11, "#2A2A2E", 27, {cls:"s", r:0.015}); B(14.66, 4.74, 0.38, 0.02, 8.6, D("#7FA7C9", "#3A5A78"), 28.2, {cls:"glow", r:0});
    B(17.2, 4.75, 0.3, 0.3, 4, "#E8A04A", 23.6, {r:0.06});
    // 소파 2 · 테이블 · 러그(바닥)
    const sc = D("#5C6B8A", "#3A4458"), scb = sh(sc, -0.08);
    B(17.3, 11.55, 2.8, 0.9, 7, sc, 0, {r:0.09, seg:2}); B(17.3, 11.55, 2.8, 0.3, 17, scb, 7, {r:0.09, seg:2});
    B(17.3, 14.15, 2.8, 0.9, 7, sc, 0, {r:0.09, seg:2}); B(17.3, 14.75, 2.8, 0.3, 17, scb, 7, {r:0.09, seg:2});
    B(18.0, 13.0, 1.4, 0.7, 7, WD, 0, {r:0.05}); B(18.3, 13.2, 0.3, 0.3, 3, "#FFFFFF", 7, {r:0.03});
    [[11.0,1.0],[20.0,1.0],[13.4,19.4],[20.0,19.4],[19.9,10.2]].forEach(([i, j]) => plant(i, j, true));
    // 계단실 + 엘리베이터 (문은 움직임 → init)
    const stone = D("#D8D0C4", "#3A3631");
    B(10.4, 15.6, 1.6, 4.2, 84, stone, 0, {r:0.02}); B(10.35, 15.55, 1.7, 4.3, 3, sh(stone, -0.1), 84, {r:0});
    B(12.0, 16.35, 0.92, 2.7, 84, stone, 0, {r:0.02}); B(11.95, 16.3, 1.02, 2.8, 3, sh(stone, -0.1), 84, {r:0});
    const F = 12.924; ST.F = F;
    [[16.6,17.6],[17.8,18.8]].forEach(([a, b], k) => { const m = (a + b) / 2;
      faceI(F - 0.004, a - 0.08, b + 0.08, 0, 60, D("#A9A196", "#57514A"), "m", 0.02);
      faceI(F + 0.016, m - 0.32, m + 0.32, 62, 68.5, "#141414", "s", 0.01);
      K.decal(180, 40, (cx, W, H) => { cx.font = `800 ${H * 0.62}px ${FONT}`; cx.textAlign = "center"; cx.textBaseline = "middle"; cx.shadowColor = "#FF9A2E"; cx.shadowBlur = H * 0.25; cx.fillStyle = "#FFB547";
        const s = ST.elevTxt[k] ? "도착" : k ? "—" : "▲ 2F"; cx.fillText(s, W / 2, H / 2 + 1); cx.fillText(s, W / 2, H / 2 + 1); }, 0.6, hz(6), "j", F + 0.006, m, hz(65.25)); });
    wtext("ELEVATOR", F + 0.0, 17.7, 77.5, "j", 4.2, D("#6E675C", "#B3AA9C"), null, 800);
    wtext("▲ 업무층", F + 0.0, 17.1, 71.2, "j", 2.7, D("#A9601A", "#E8A04A"), null, 700, FONT); wtext("1층", F + 0.0, 18.3, 71.2, "j", 2.7, D("#9C968B", "#6E675C"), null, 700, FONT);

    /* 카페 뒤 벽: 벽돌 · 간판 · 선반 · 메뉴판 */
    K.decal(8.4 * 40, 3.6 * 40, (cx, W, H, dark) => { const s = W / 8.4, z = v => H - v / WALL * H; cx.strokeStyle = dark ? "rgba(0,0,0,.32)" : "rgba(90,40,20,.24)"; cx.lineWidth = 1;
      for(let zz = 8, r = 0; zz < WALL; zz += 7, r++){ cx.beginPath(); cx.moveTo(0, z(zz)); cx.lineTo(W, z(zz)); cx.stroke(); for(let i = (r % 2) * 0.3; i < 8.4; i += 0.6){ cx.beginPath(); cx.moveTo(i * s, z(zz)); cx.lineTo(i * s, z(Math.min(WALL, zz + 7))); cx.stroke(); } }
      cx.fillStyle = dark ? "rgba(0,0,0,.08)" : "rgba(255,255,255,.07)"; for(let zz = 8, r = 0; zz < WALL; zz += 7, r++) for(let i = (r % 2) * 0.3, n = 0; i < 8.4; i += 0.6, n++) if((n * 7 + r * 3) % 5 === 0) cx.fillRect(i * s + 1, z(zz + 7) + 1, 0.6 * s - 2, 7 / WALL * H - 2); },
      8.4, 3.6, "i", 24.8, -0.016, 1.8);
    wtext("CREYONG CAFÉ", 24.8, 0.0, 98, "i", 12, "#FFE6C2", "#F2A64A", 800);
    wtext("24시간 · 바리스타가 내려 주는 한 잔", 24.8, 0.0, 87, "i", 5.2, D("#FFF3E6", "#F3D9C4"), null, 600, FONT);
    [60, 74].forEach((z, r) => { B(21.3, 0, 3.0, 0.24, 1.6, D("#5B4636", "#3A2E24"), z - 1.6, {r:0.01});
      [21.5,21.95,22.4,22.85,23.3,23.75].forEach((i, k) => {
        if((k + r) % 3 === 2){ B(i + 0.06, 0.06, 0.16, 0.13, 4, "pot", z, {r:0.02}); sm(sph(0.1, 10, 8), "plant", X(i + 0.14), hz(z + 4) + 0.08, Z(0.125)); return; }
        B(i, 0.04, 0.28, 0.16, 9, D("#FFFFFF", "#D8D8D8"), z, {cls:"glass", r:0.03}); B(i + 0.03, 0.06, 0.22, 0.12, 5.5, ["#6B3E1F","#C98A55","#E8D3AE"][(k + r) % 3], z, {r:0.02});
        B(i, 0.04, 0.28, 0.16, 1.5, "#2A2A28", z + 9, {r:0.02}); }); });
    B(25.0, 0, 3.2, 0.05, 44, D("#8B5A3C", "#6B4A34"), 40, {r:0.02}); faceJ(25.1, 28.1, 0.05, 42, 82, "#2A2A28", "m", 0.012);
    wtext("COFFEE", 26.6, 0.04, 77, "i", 4.6, "#F4E9D6", null, 800);
    [["아메리카노",70],["카페라떼",64.5],["콜드브루",59]].forEach(([n, z]) => wtext(n, 26.6, 0.04, z, "i", 3.8, "#F4E9D6", null, 600, FONT));
    wtext("오늘의 디저트 · 크로플", 26.6, 0.04, 52.5, "i", 3.2, "#E8A04A", null, 700, FONT);
    wtext("누구나 환영!", 26.6, 0.04, 46.5, "i", 3.6, "#9EE3D3", null, 800, FONT);
    /* 분홍 벽: 무지개 구름 네온 포토존 */
    const RB = ["#E8484A","#F28C38","#F2C14E","#5FB36A","#4A90C8","#8E7BEF"], RC = 32.5, RZ = 34, R0 = 2.15, RK = 22;
    K.decal(5.6 * 64, 2.2 * 64, (cx, W, H, dark) => { const s = W / 5.6, cxp = i => (i - (RC - 2.8)) * s, zp = z => H - (z - (RZ - 6)) / 31.1 * s;
      cx.lineCap = "round"; RB.forEach((col, k) => { const r = R0 - k * 0.13; cx.strokeStyle = col; cx.globalAlpha = dark ? 0.55 : 0.32; cx.lineWidth = s * 0.16; cx.shadowColor = col; cx.shadowBlur = s * (dark ? 0.5 : 0.3);
        cx.beginPath(); for(let a = 0; a <= 32; a++){ const u = a / 32 * Math.PI, x = cxp(RC - Math.cos(u) * r), y = zp(RZ + Math.sin(u) * r * RK); a ? cx.lineTo(x, y) : cx.moveTo(x, y); } cx.stroke(); }); cx.globalAlpha = 1; },
      5.6, 2.2, "i", RC, -0.016, hz(RZ - 6) + 1.1);
    RB.forEach((col, k) => { const r = R0 - k * 0.13, o = sm(new THREE.TorusGeometry(r, 0.032, 6, 40, Math.PI), col, X(RC), hz(RZ), Z(0) + 0.05, null, "glow"); o.scale.set(1, RK / 31.1, 0.8); });
    [-1, 1].forEach(sd => { const ci = RC + sd * (R0 - 0.33);
      [[-1.1,0.25,0.75],[0,-0.25,1],[1.1,0.15,0.8],[0.5,0.45,0.7],[-0.5,0.5,0.7]].forEach(([dx, dy, rr], k) => { const s = 13 * 0.8 / 31.1;
        sm(sph(rr * s * 1.05, 14, 10), k < 3 ? "#FFFFFF" : D("#F5EEF8", "#E9DDF0"), X(ci) + dx * s * 0.9, hz(RZ + 2) - dy * s * 0.9, Z(0) + 0.1).scale.set(1, 1, 0.55); }); });
    wtext("CREYONG CAFÉ ☁", RC, 0.02, 98, "i", 7, "#FFF1F6", "#F4A7B9", 800);
    wtext("누구나 환영 · OPEN 08:00–21:00", RC, 0.02, 22, "i", 3.2, D("#8B5A3C", "#E9D2B0"), null, 700, FONT);

    /* 카페 바: 뒤 작업대(머신) · 앞 카운터 (복지층에서 그대로, i +9.4) */
    const cw = D("#5B4636", "#3A2E24"), marble = D("#F2EDE5", "#BDB5A9");
    B(21.1, 0.1, 5.9, 0.6, 20, cw, 0, {r:0.02}); B(21.1, 0.08, 5.9, 0.64, 2, marble, 20, {cls:"s", r:0.01});
    B(21.5, 0.15, 0.95, 0.42, 17, "#C9CDD2", 22, {cls:"s", r:0.05, seg:2}); faceJ(21.52, 22.43, 0.57, 34, 36.4, amber, "glow", 0.006); B(21.52, 0.17, 0.91, 0.38, 1.5, "#9EA4AB", 39, {cls:"s", r:0.02});
    [21.6, 21.82, 22.04].forEach(i => cylAt(0.055, 0.05, 3, "#FFFFFF", i + 0.065, 0.315, 40.5, "s", 10));
    [21.75, 22.18].forEach(i => { B(i, 0.57, 0.13, 0.1, 3.4, "#2A2A2A", 30, {cls:"s", r:0.02}); rod([X(i + 0.065), hz(29.5), Z(0.64)], [X(i + 0.065), hz(28.5), Z(0.9)], 0.022, "#1E1E1E"); });
    B(22.7, 0.2, 0.28, 0.3, 10, "#2A2A2A", 22, {cls:"s", r:0.03}); B(22.73, 0.23, 0.22, 0.24, 8, "#5A3A26", 32, {cls:"s", r:0.03}); B(22.71, 0.21, 0.26, 0.28, 1.2, "#1E1E1E", 40, {cls:"s", r:0.01});
    [0,1,2,3].forEach(k => cylAt(0.12, 0.1, 2.6, "#FFFFFF", 23.82, 0.42, 22 + k * 2.4, "s", 14)); B(24.1, 0.25, 0.16, 0.16, 6, "#E8A04A", 22, {r:0.03});
    [["#C0392B",24.55],["#E8A04A",24.72],["#6B3E1F",24.89],["#4DAA97",25.06]].forEach(([col, i]) => { cylAt(0.055, 0.055, 9, col, i + 0.06, 0.36, 22, "s", 10); cylAt(0.028, 0.028, 3, "#2A2A28", i + 0.06, 0.36, 31, "s", 8); });
    B(25.7, 0.2, 0.4, 0.36, 14, "#2A2A2E", 22, {cls:"s", r:0.03}); B(25.74, 0.24, 0.32, 0.28, 10, D("#DCF0FF", "#96B4D2"), 36, {cls:"glass", r:0.02});
    B(21.4, 1.6, 5.4, 0.7, 22, cw, 0, {r:0.02});
    K.decal(5.4 * 60, 18 / 31.1 * 60, (cx, W, H, dark) => { cx.fillStyle = "rgba(0,0,0,.2)"; for(let i = 0.12; i < 5.4; i += 0.18) cx.fillRect(i / 5.4 * W, 0, 1.3, H); }, 5.4, hz(18), "i", 24.1, 2.3, hz(11));
    faceJ(21.4, 26.8, 2.3, 14, 16.5, amber, "m", 0.012); B(21.38, 1.56, 5.44, 0.78, 2, marble, 22, {cls:"s", r:0.015});
    B(21.75, 1.75, 0.4, 0.3, 6, "#2A2A28", 24, {cls:"s", r:0.02}); { const o = B(21.78, 2.0, 0.34, 0.02, 3.5, "#5FD3E8", 26, {cls:"glow", r:0}); o.rotation.x = -0.35; }
    B(23.9, 1.8, 0.18, 0.18, 4, "#FFFFFF", 24, {r:0.03});
    B(25.55, 1.65, 1.15, 0.6, 14, D("#E6F0FA", "#96B4D2"), 24, {cls:"glass", r:0.03}); B(25.55, 1.65, 1.15, 0.6, 0.8, D("#CFC6B8", "#4A453F"), 24, {cls:"s", r:0.01});
    [[25.75,1.95,"#D9A85A"],[26.05,1.95,"#C98436"],[26.35,1.95,"#F4A7B9"],[25.9,2.1,"#E8C463"],[26.25,2.1,"#8B5A3C"]].forEach(([i, j, col]) => sm(sph(0.1, 12, 8), col, X(i), hz(25.6), Z(j)).scale.set(1, 0.45, 0.65));
    B(25.55, 2.24, 1.15, 0.02, 0.6, D("#FFFFFF", "#9AA0A6"), 37.6, {cls:"s", r:0});

    /* 카페 좌석 */
    const ctop = D("#F4EFE6", "#8F877C"), chairC = D("#2A2A28", "#5A544C");
    const round = (i, j, h, cups, laptop) => { cylAt(0.04, 0.04, h - 1, metal, i, j, 0, "s", 8); cylAt(0.2, 0.22, 1.2, metal, i, j, 0, "s", 18);
      cylAt(0.4, 0.4, 1.2, sh(ctop, -0.25), i, j, h - 1.8, "m", 28); cylAt(0.42, 0.42, 1.2, ctop, i, j, h - 0.6, "s", 28);
      (cups || []).forEach(([a, b]) => cylAt(0.05, 0.042, 3.2, "#FFFFFF", i + a, j + b, h + 0.6, "s", 10));
      if(laptop){ B(i - 0.2, j, 0.4, 0.26, 0.8, "#B8BCC2", h + 0.6, {cls:"s", r:0.01}); const g = new THREE.Group(); g.position.set(X(i), hz(h + 1.4), Z(j + 0.26)); g.rotation.x = -0.2; K.root.add(g);
        sm(rbox(0.4, hz(8.4), 0.02, 0), "#C9CDD2", 0, hz(4.2), 0, g, "s"); sm(rbox(0.36, hz(7.4), 0.004, 0), "#3A4A5E", 0, hz(4.2), -0.012, g, "glow"); sm(sph(0.018, 6, 4), "#E8A04A", 0, hz(5), 0.012, g, "glow"); } };
    const chair = (i, j, side, col = chairC) => { cylAt(0.035, 0.035, 11, metal, i, j, 0, "s", 8); cylAt(0.18, 0.18, 0.8, metal, i, j, 0, "s", 14);
      B(i - 0.22, j - 0.2, 0.44, 0.4, 2.5, col, 11, {r:0.05}); if(side === "back") B(i - 0.22, j - 0.24, 0.44, 0.07, 20, col, 12, {r:0.03}); else B(i - 0.22, j + 0.18, 0.44, 0.07, 20, sh(col, 0.1), 12, {r:0.03}); };
    const stool = (i, j, col) => { cylAt(0.03, 0.03, 13, metal, i, j, 0, "s", 8); cylAt(0.16, 0.16, 0.8, metal, i, j, 0, "s", 14); cylAt(0.2, 0.19, 2, col, i, j, 12, "m", 18); };
    round(22.3, 4.4, 15, [[0.22,-0.15]], true); chair(22.3, 3.85, "back"); chair(22.3, 4.95, "front");
    round(25.0, 5.1, 15, [[-0.12,-0.1],[0.12,0.12]]); chair(25.0, 4.55, "back"); chair(25.0, 5.7, "front");
    round(27.6, 3.6, 15, [[0,0]]); chair(27.6, 3.05, "back"); chair(27.6, 4.15, "front");
    [22.3, 25.0, 27.6].forEach(ti => [9.5, 12.8].forEach(tj => { round(ti, tj, 15, [[0.12,-0.1]]); chair(ti, tj - 0.55, "back"); chair(ti, tj + 0.55, "front"); }));
    [30.4, 33.2].forEach(ti => { round(ti, 10.8, 15, [[0,0]]); chair(ti, 10.25, "back"); chair(ti, 11.35, "front"); });
    // 긴 하이 테이블 + 주황 스툴
    [30.5, 34.4].forEach(i => B(i, 4.3, 0.12, 0.4, 16, metal, 0, {cls:"s", r:0.02})); B(30.3, 4.0, 4.4, 1.0, 1.6, WD, 16, {r:0.03});
    [[31.0,4.5],[32.6,4.3],[33.8,4.6]].forEach(([i, j]) => cylAt(0.05, 0.042, 3.2, "#FFFFFF", i, j, 17.6, "s", 10));
    [31.0, 32.2, 33.4].forEach(si => [3.45, 5.55].forEach(sj => stool(si, sj, "#E8A04A")));
    // 창가 바 + 틸 스툴
    [21.1, 25.0].forEach(i => B(i, 19.0, 0.1, 0.3, 18, metal, 0, {cls:"s", r:0.02})); B(20.9, 18.95, 4.4, 0.45, 1.4, WD, 18, {r:0.03});
    [21.5, 22.5, 23.5, 24.5].forEach(si => stool(si, 18.45, "#3A8A78"));
    // 소파 부스 (오른쪽 유리 앞)
    const bc = D("#C0504A", "#7A3430");
    [8.4, 12.6].forEach(j => { B(35.0, j - 0.9, 0.9, 1.8, 7, bc, 0, {r:0.09, seg:2}); B(35.6, j - 0.9, 0.3, 1.8, 18, sh(bc, -0.1), 7, {r:0.08, seg:2});
      B(34.0, j - 0.35, 0.7, 0.7, 1.4, WD, 14, {r:0.03}); B(34.3, j - 0.05, 0.1, 0.1, 14, metal, 0, {cls:"s", r:0}); cylAt(0.16, 0.16, 0.8, metal, 34.35, j, 0, "s", 12); });
    [[20.9,15.6],[28.6,7.2],[35.6,1.0],[29.4,14.0]].forEach(([i, j]) => plant(i, j, true));

    /* 유리 외벽 */
    const posts = new Set(), postJ = (a, j) => { const k = "J" + a.toFixed(2) + j; if(posts.has(k)) return; posts.add(k); B(a - 0.025, j - 0.03, 0.05, 0.06, 48, FRAME, 0, {cls:"s", r:0}); };
    const postI = (i, b) => { const k = "I" + i + b.toFixed(2); if(posts.has(k)) return; posts.add(k); B(i - 0.03, b - 0.025, 0.06, 0.05, 48, FRAME, 0, {cls:"s", r:0}); };
    const gpane = (a, b, j, sill = true) => { faceJ(a, b, j - 0.01, 0, 48, GLASS, "glass", 0.02); postJ(a, j); postJ(b, j); B(a, j - 0.035, b - a, 0.07, 1.4, FRAME, 46.6, {cls:"s", r:0}); if(sill) B(a, j - 0.05, b - a, 0.1, 3, FRAME, 0, {r:0}); };
    const gpaneI = (i, b, b2) => { faceI(i - 0.01, b, b2, 0, 48, GLASS, "glass", 0.02); postI(i, b); postI(i, b2); B(i - 0.035, b, 0.07, b2 - b, 1.4, FRAME, 46.6, {cls:"s", r:0}); };
    gridSegs(10.4, GI, 1.5, [[14.3,17.7],[25.6,27.0]]).forEach(([a, b]) => gpane(a, b, GJ));
    gridSegs(0.3, CH, 1.5).forEach(([b, b2]) => gpaneI(WI, b, b2));
    gridSegs(GI, WI, 1.5, [[31.0,32.6]]).forEach(([a, b]) => gpane(a, b, CH));
    gridSegs(CH, GJ, 1.5).forEach(([b, b2]) => gpaneI(GI, b, b2));
    // 정문: 머리틀 · 기둥 (자동문 문짝은 init) · 캐노피 · 간판
    B(14.3, GJ - 0.04, 3.4, 0.08, 4, FRAME, 48, {cls:"s", r:0}); [14.3, 17.7].forEach(i => postJ(i, GJ));
    B(13.6, GJ, 4.8, 1.8, 3, D("#2A2A28", "#1E1D1B"), 58, {r:0.03}); faceJ(13.6, 18.4, GJ + 1.8, 52, 58, "#3A8A78", "m", 0.025);
    wtext("CREYONG TOWER", 16.0, GJ + 1.81, 55, "i", 4.6, "#FFFFFF", null, 800);
    [13.75, 18.25].forEach(i => B(i - 0.06, GJ + 1.6, 0.12, 0.12, 58, FRAME, 0, {cls:"s", r:0.02}));
    // 카페 문 · 줄무늬 차양 · 간판
    faceJ(25.6, 27.0, GJ - 0.01, 0, 48, GLASS, "glass", 0.02); [25.6, 27.0].forEach(i => postJ(i, GJ)); B(25.6, GJ - 0.04, 1.4, 0.08, 1.4, FRAME, 46.6, {cls:"s", r:0});
    B(26.22, GJ + 0.01, 0.03, 0.04, 14, D("#B4BAC1", "#9AA1A8"), 18, {cls:"s", r:0});
    for(let k = 0; k < 6; k++){ const len = Math.hypot(1.1, hz(7)), o = sm(rbox(0.4, 0.025, len, 0), k % 2 ? "#FFFFFF" : "#8B5A3C", X(25.4 + k * 0.4), (hz(54) + hz(47)) / 2, Z(GJ + 0.55)); o.rotation.x = Math.atan2(hz(7), 1.1); }
    wtext("CREYONG CAFÉ · OPEN", 26.3, GJ + 0.0, 58, "i", 3.6, D("#8B5A3C", "#E9D2B0"), null, 800);

    /* 테라스: 데크 · 판자 · 화단 울타리 · 파라솔 테이블 */
    const dkc = D("#C99A66", "#6B4E34");
    B(GI + 0.2, CH + 0.3, WI - GI - 0.4, GJ - CH - 0.5, 1.4, dkc, 0, {r:0.02});
    K.decal(6.6 * 30, 5.0 * 30, (cx, W, H, dark) => { cx.fillStyle = dark ? "rgba(40,28,18,.4)" : "rgba(110,80,50,.32)"; for(let i = 0.4; i < 6.6; i += 0.45) cx.fillRect(i / 6.6 * W, 0, 1, H); }, 6.6, 5.0, "f", 32.5, 17.3, hz(1.4) + 0.001);
    const fc = D("#B98B55", "#6B4A34"), bloom = ["#F4A7B9","#FFE066","#FFFFFF"];
    B(WI - 0.3, CH + 0.3, 0.2, GJ - 0.2 - CH - 0.3, 9, fc, 0, {r:0.03});
    for(let b = CH + 0.3; b < GJ - 0.2; b += 1.2){ const b2 = Math.min(GJ - 0.2, b + 1.2); for(let j = b + 0.15; j < b2; j += 0.3){ sm(sph(0.085, 8, 6), "plant", X(WI - 0.2), hz(10), Z(j)); sm(sph(0.06, 8, 6), bloom[(j * 7 | 0) % 3], X(WI - 0.2), hz(10) + 0.08, Z(j)); } }
    B(31.6, GJ - 0.3, 4.1, 0.2, 9, fc, 0, {r:0.03});
    for(let a = GI + 0.2; a < WI - 0.3; a += 1.2){ const a2 = Math.min(WI - 0.3, a + 1.2); if(a < 30.6 && a2 > 29.6) continue; for(let i = a + 0.15; i < a2; i += 0.3){ sm(sph(0.085, 8, 6), "plant", X(i), hz(10), Z(GJ - 0.2)); sm(sph(0.06, 8, 6), bloom[(i * 7 | 0) % 3], X(i), hz(10) + 0.08, Z(GJ - 0.2)); } }
    [[31.0,17.2],[33.8,17.2]].forEach(([ti, tj], q) => { round(ti, tj, 16.4, [[0,0]]); chair(ti, tj - 0.55, "back", "#FFFFFF"); chair(ti, tj + 0.55, "front", "#FFFFFF");
      cylAt(0.022, 0.022, 34, metal, ti, tj, 16, "s", 8); const cols = q ? ["#E8A04A","#FFFFFF"] : ["#F4A7B9","#FFFFFF"];
      for(let k = 0; k < 8; k++) sm(new THREE.CylinderGeometry(0, 1.3, hz(9), 1, 1, false, k / 8 * Math.PI * 2, Math.PI / 4), cols[k % 2], X(ti), hz(45) + hz(9) / 2, Z(tj));
      sm(sph(0.05, 8, 6), metal, X(ti), hz(54), Z(tj), null, "s"); });

    /* 바깥: 가로수 · 가로등 · 벤치 · 주차장 입구 표지 · 직원 차 */
    TREES.forEach(([i, j]) => { const s = 0.95; cylAt(0.07, 0.09, 34 * s, D("#7A5A3C", "#5A4230"), i, j, 0, "m", 8);
      [[0,-4,16],[-11,4,12],[11,5,12],[-5,-14,11],[6,-12,11],[0,6,12]].forEach(([dx, dy, r], k) => sm(sph(r * s / 31.1 * 1.12, 14, 10), k % 2 ? sh("plant", 0.18) : "plant", X(i) + dx * s / 56 * 1.2, hz(48 * s) - dy * s / 31.1, Z(j) - dx * s / 56 * 1.2)); });
    LAMPS.forEach(([i, j]) => { const lc = D("#3A3633", "#8A857E"); cylAt(0.04, 0.055, 60, lc, i, j, 0, "s", 10); cylAt(0.09, 0.09, 1.6, lc, i, j, 0, "s", 12);
      B(i - 0.2, j - 0.2, 0.4, 0.4, 3, lc, 60, {cls:"s", r:0.03}); B(i - 0.17, j - 0.17, 0.34, 0.34, 0.6, "#FFF3D6", 59.5, {cls:"glow", r:0}); });
    { const wd2 = D("#C99A66", "#6B4E34"); B(27.6, 21.4, 2.0, 0.5, 1.4, wd2, 7, {r:0.03}); B(27.6, 21.85, 2.0, 0.1, 9, sh(wd2, -0.1), 7, {r:0.03}); [27.7, 29.4].forEach(i => B(i, 21.45, 0.1, 0.4, 7, metal, 0, {cls:"s", r:0.01})); }
    B(10.55, 21.35, 0.1, 0.1, 40, metal, 0, {cls:"s", r:0}); faceJ(10.0, 11.2, 21.43, 30, 42, "#2E5FA8", "m", 0.03); wtext("P 주차장 입구", 10.6, 21.44, 36, "i", 3.0, "#FFFFFF", null, 800, FONT);
    [[0,"#2A2A28"],[1,"#E9E6DF"],[3,"#3A8A78"]].forEach(([k, col]) => { const [i, j] = L_SPACES[k], g = new THREE.Group(); g.position.set(X(i), 0, Z(j)); g.rotation.y = DIR_YAW["-i"]; K.root.add(g);
      const P = carParts(K, col); [...P.paint.map(p => [p, "s"]), ...P.fixed.map(p => [p, "s"]), ...P.lamp.map(p => [p, "glow"])].forEach(([p, cls]) => { const o = sm(p.g, p.c, 0, 0, 0, g, cls); o.applyMatrix4(p.m); }); });
    /* 굳히기 전에: 같은 모양을 나눠 쓰는 둥근 상자(정점 순서형)는 밤색이 마지막 것 하나로 덮이지 않게 각자 한 벌씩
       (엔진 bake의 clone()이 userData를 같이 써서 생기는 일) */
    K.root.traverse(o => { if(o.isMesh && !o.geometry.index){ o.geometry = o.geometry.clone(); o.geometry.userData = {}; } });
  },

  /* ---------- 움직이는 것: 문 · 김 · 손 소품 · 차 (인스턴싱) ---------- */
  init(K){
    const {THREE, R} = K;
    R.renderer.localClippingEnabled = true;
    // 사람: 이름표는 2.5D처럼 바리스타·안내·PD·노라·유나만. 돌려 쓰는 자리는 숨겨 둠
    Object.values(R.people).forEach(P => { const id = P.id, r = RES.find(q => q.id === id);
      if(r && !r.tag || /^lg/.test(id)) P.tag.style.display = "none";   // 자리만 차지하지 않게 (말풍선은 그대로)
      if(/^l[gp]\d|^l_nora|^l_yuna/.test(id)) P.p.root.visible = false;
      P.su = 0.32; });
    const mk = (geo, mat, n, shadow) => { const im = imesh(THREE, geo, mat, n); im.castShadow = !!shadow; im.receiveShadow = true; R.scene.add(im); return im; };
    const std = o => new THREE.MeshStandardMaterial({roughness:0.6, ...o});
    // 문: 엘리베이터 안쪽 2 · 철문 4 · 정문 문짝 테두리 2 / 정문 유리 2
    ST.door = mk(new THREE.BoxGeometry(1, 1, 1), std({roughness:0.35, metalness:0.15}), 8);
    ST.doorG = mk(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({roughness:0.08, transparent:true, opacity:0.3, depthWrite:false}), 2); ST.doorG.renderOrder = 2;
    // 김 3 · 손 소품 · 모자
    ST.steam = mk(new THREE.SphereGeometry(1, 10, 8), new THREE.MeshBasicMaterial({color:0xffffff, transparent:true, opacity:0.5, depthWrite:false}), 3);
    ST.prop = mk(K.rbox(1, 1, 1, 0.22, 1), std({roughness:0.55}), 72, true);
    ST.crown = mk(new THREE.SphereGeometry(0.235, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2), std({roughness:0.7}), 24, true);
    // 차: 칠 · 유리+바퀴 · 등 (디오라마 끝에서 잘림)
    const clip = [new THREE.Plane(new THREE.Vector3(1, 0, 0), -K.X(EXT[0])), new THREE.Plane(new THREE.Vector3(-1, 0, 0), K.X(EXT[2]))];
    const P = carParts(K, ["#FFFFFF", "#FFFFFF"]);
    ST.carPaint = mk(mergeParts(THREE, P.paint.map((p, k) => ({...p, c:k ? ["#FFFFFF", "#FFFFFF"] : ["#F0F0F0", "#F0F0F0"]}))), std({vertexColors:true, roughness:0.38, metalness:0.05, clippingPlanes:clip, clipShadows:true}), NCAR, true);
    ST.carFixed = mk(mergeParts(THREE, P.fixed), std({vertexColors:true, roughness:0.3, clippingPlanes:clip, clipShadows:true}), NCAR, true);
    ST.carLamp = mk(mergeParts(THREE, P.lamp), new THREE.MeshBasicMaterial({vertexColors:true, toneMapped:false, clippingPlanes:clip}), NCAR);
    // 밤 전조등 빛 (다크에서만)
    const pc = document.createElement("canvas"); pc.width = pc.height = 64; { const x = pc.getContext("2d"), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, "rgba(255,240,190,.55)"); g.addColorStop(1, "rgba(255,240,190,0)"); x.fillStyle = g; x.fillRect(0, 0, 64, 64); }
    const pt = new THREE.CanvasTexture(pc); const pg = new THREE.PlaneGeometry(1, 1); pg.rotateX(-Math.PI / 2);
    ST.pool = mk(pg, new THREE.MeshBasicMaterial({map:pt, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, clippingPlanes:clip}), NCAR); ST.pool.visible = false;
    ST.cars = Array.from({length:NCAR}, () => ({car:null, yaw:0}));
    ST.tmp = {M:new THREE.Matrix4(), M2:new THREE.Matrix4(), Q:new THREE.Quaternion(), V:new THREE.Vector3(), S:new THREE.Vector3(), E:new THREE.Euler(), C:new THREE.Color(), Z:new THREE.Matrix4().makeScale(0, 0, 0), up:new THREE.Vector3(0, 1, 0)};
  },

  tick(K, now, t, dt){
    const R = K.R, S = R.opts.sim ? R.opts.sim() : null, {X, Z, hz} = K, T = ST.tmp, dark = !!R.dark;
    if(!ST.parts) mapParts(R);
    const list = S ? S.people : RES.map(r => ({p:{...r, i:r.at[0], j:r.at[1], pose:r.pose || "stand", front:!!r.front, face:r.face ?? 1, phase:0, npc:true, look:r.look}, kind:"npc"}));
    const seen = new Set(), props = [];
    // 사람 → 3D 자리
    list.forEach(e => { const p = e.p; let id = null;
      if(e.kind === "npc") id = p.id;
      else if(e.kind === "nora") id = "l_nora"; else if(e.kind === "yuna") id = "l_yuna";
      else if(e.kind === "guest") id = slot(R, ST.gUse, p, POOL_G, "lg", p.look, e);
      else if(e.kind === "pd") id = slot(R, ST.pUse, p.id, POOL_P, "lp", p.look, e);
      const P = id && R.people[id]; if(!P) return; seen.add(id);
      drive(K, P, e, t, dt, props);
    });
    Object.values(R.people).forEach(P => { if(!seen.has(P.id) && P.p.root.visible){ P.p.root.visible = false; P.say = null; if(R.sel === P.id) K.select(P.id); } });
    [ST.gUse, ST.pUse].forEach(m => m.forEach((id, key) => { if(!seen.has(id)) m.delete(key); }));
    // 손 소품 · 모자
    let np = 0, nc = 0; const C = T.C;
    props.forEach(q => { const P = q.P, a = P.p, root = a.root;
      if(q.k === "cup"){ T.V.set(0, -0.3, 0.05).applyMatrix4(a.arms[1].el.matrixWorld); T.Q.setFromAxisAngle(T.up, P.heading); T.M.compose(T.V, T.Q, T.S.set(0.075, 0.1, 0.075)); ST.prop.setMatrixAt(np, T.M); ST.prop.setColorAt(np++, C.set("#FFFFFF")); }
      else { const node = q.k === "brim" ? a.head : q.k === "apronL" ? a.hips : a.chest, L = {pad:[0,0.3,0.3,-0.95,0.3,0.02,0.22], book:[0,0.3,0.3,-0.95,0.28,0.06,0.21], apron:[0,0.2,0.145,0,0.36,0.44,0.02], apronL:[0,-0.14,0.135,0,0.36,0.32,0.02], brim:[0,0.255,0.2,0.12,0.3,0.03,0.2]}[q.k];
        T.M2.compose(T.V.set(L[0], L[1], L[2]), T.Q.setFromEuler(T.E.set(L[3], 0, 0)), T.S.set(L[4], L[5], L[6])); T.M.multiplyMatrices(node.matrixWorld, T.M2); ST.prop.setMatrixAt(np, T.M); ST.prop.setColorAt(np++, C.set(q.c)); }
      if(q.k === "brim"){ T.M2.compose(T.V.set(0, 0.235, -0.01), T.Q.identity(), T.S.set(1.02, 0.78, 1.02)); T.M.multiplyMatrices(a.head.matrixWorld, T.M2); ST.crown.setMatrixAt(nc, T.M); ST.crown.setColorAt(nc++, C.set(q.c)); } });
    for(let k = np; k < 72; k++) ST.prop.setMatrixAt(k, T.Z); for(let k = nc; k < 24; k++) ST.crown.setMatrixAt(k, T.Z);
    [ST.prop, ST.crown].forEach(im => { im.instanceMatrix.needsUpdate = true; if(im.instanceColor) im.instanceColor.needsUpdate = true; });

    // 문 (2.5D lDoorA · lDoorB)
    const yk = Math.min(1, dt * 5); ST.yA = (ST.yA || 0) + ((K.yuNear?.(13.45, 17.1, 1.5) ? 1 : 0) - (ST.yA || 0)) * yk; ST.yB = (ST.yB || 0) + ((K.yuNear?.(16.0, 19.4, 1.8) ? 1 : 0) - (ST.yB || 0)) * yk;
    const oA = Math.max(S ? S.doorA : 0, ST.yA), oB = Math.max(S ? S.doorB : 0, ST.yB), F = ST.F, dm = ST.door, dg = ST.doorG; let k = 0;
    const put = (im, n, x, y, z, w, h, d, col) => { T.M.compose(T.V.set(x, y, z), T.Q.identity(), T.S.set(w, h, d)); im.setMatrixAt(n, T.M); im.setColorAt(n, C.set(col)); };
    [[16.6,17.6,oA],[17.8,18.8,oA * 0.6]].forEach(([a, b, o]) => { const m = (a + b) / 2, gap = (b - a) / 2 * Math.min(1, o) * 0.94, lw = (b - a) / 2 - gap, steel = dark ? "#8E939A" : "#D6DADE";
      put(dm, k++, X(F) + 0.02, hz(28), Z(m), 0.004, hz(56), b - a, o > 0.02 ? (dark ? "#E9C98A" : "#FFF1D2") : "#2A2622");
      put(dm, k++, X(F) + 0.03, hz(28), Z(a + lw / 2), 0.014, hz(56), Math.max(0.002, lw), steel); put(dm, k++, X(F) + 0.03, hz(28), Z(b - lw / 2), 0.014, hz(56), Math.max(0.002, lw), steel); });
    const m = 16.0, gp = 1.6 * Math.min(1, oB) * 0.9, lw = 1.6 - gp, fr = dark ? "#8A8E94" : "#5A5D63", gl = dark ? "#7896B4" : "#BED7E6";
    put(dg, 0, X(14.4 + lw / 2), hz(24), Z(GJ) + 0.02, lw, hz(48), 0.02, gl); put(dg, 1, X(17.6 - lw / 2), hz(24), Z(GJ) + 0.02, lw, hz(48), 0.02, gl);
    put(dm, k++, X(m - gp), hz(24), Z(GJ) + 0.02, 0.04, hz(48), 0.05, fr); put(dm, k++, X(m + gp), hz(24), Z(GJ) + 0.02, 0.04, hz(48), 0.05, fr);
    [dm, dg].forEach(im => { im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; });
    const ea = [oA > 0.5, oA * 0.6 > 0.5]; if(ea[0] !== ST.elevTxt[0] || ea[1] !== ST.elevTxt[1]){ ST.elevTxt = ea; R.atlas.paint(dark); }
    // 에스프레소 김 (바리스타가 머신 앞에 있을 때)
    const brew = S ? S.brew && !K.reduce : false;
    for(let q = 0; q < 3; q++){ const ph = (now * 0.0006 + q / 3) % 1, r = brew ? (2.3 + ph * 3) / 31.1 * 1.3 : 0;
      T.M.compose(T.V.set(X(21.95 + Math.sin(ph * 6 + q) * 0.05), hz(44 + ph * 20), Z(0.3)), T.Q.identity(), T.S.setScalar(r * (1 - ph * 0.35))); ST.steam.setMatrixAt(q, r ? T.M : T.Z); }
    ST.steam.instanceMatrix.needsUpdate = true;
    // 차
    driveCars(K, S ? S.cars : [], dt, dark);
  },

  theme(K, dark){
    if(!ST) return; ST.dark = dark;
    [ST.carFixed, ST.carPaint, ST.carLamp].forEach(im => { if(!im) return; const u = im.geometry.userData, a = im.geometry.attributes.color; if(u.L){ a.array.set(dark ? u.D : u.L); a.needsUpdate = true; } });
    if(ST.pool) ST.pool.visible = dark;
  },
};
export default def;

/* 사람 인형 부품 → 사람 (색 바꿔 끼우기용) */
function mapParts(R){
  const byRoot = new Map(Object.values(R.people).map(P => [P.p.root, P]));
  R.pim.forEach(({list}) => list.forEach(pt => { let o = pt.o; while(o.parent) o = o.parent; const P = byRoot.get(o); if(P) (P.parts ||= []).push(pt); }));
  ST.parts = true;
}
function recolor(P, look){
  const map = {"#010101":look.skin, "#020202":look.hair, "#030303":look.shirt, "#040404":look.legs || look.pants}, c = ST.tmp.C;
  (P.parts || []).forEach(pt => { const v = map[pt.c]; if(v){ pt.im.setColorAt(pt.k, c.set(v)); pt.im.instanceColor.needsUpdate = true; } });
}
/* 손님·PD 자리 잡기: 같은 머리 모양 먼저 */
function slot(R, use, key, pool, pre, look, e){
  let id = use.get(key); if(id) return id;
  const busy = new Set(use.values()), st = look.style === "cap" ? "short" : look.style;
  let k = pool.findIndex((s, n) => s === st && !busy.has(pre + n)); if(k < 0) k = pool.findIndex((s, n) => !busy.has(pre + n)); if(k < 0) return null;
  id = pre + k; use.set(key, id); const P = R.people[id];
  recolor(P, look); P.fresh = true; P.step = 0; P.su = 0.32;
  return id;
}
/* 사람 하나: 시뮬 값 그대로 자리 · 방향 · 자세 */
function drive(K, P, e, t, dt, props){
  const p = e.p, R = K.R, root = P.p.root, info = P.info;
  if(e.hidden || p.hidden){ root.visible = false; P.say = null; return; }
  // 이름표 · 말 · 설명
  const name = p.name || info.name; if(info.name !== name){ info.name = name; P.tag.querySelector("b").textContent = name; P.tw = 0; }
  info.role = p.role || info.role; info.task = e.kind === "pd" ? e.line || "" : p.desc || "";
  if(e.hex && P.hexNow !== e.hex){ P.hexNow = e.hex; P.tag.querySelector("i").style.background = e.hex; }
  if(P.pri > K.clock()){} else if(e.say){ P.say = e.say; P.sayUntil = K.clock() + 400; } else if(P.say){ P.say = null; P.sayUntil = 0; }
  const x = K.X(p.i), z = K.Z(p.j), pos = root.position, dx = x - pos.x, dz = z - pos.z, d = Math.hypot(dx, dz);
  const fresh = P.fresh || !root.visible; root.visible = true; P.fresh = false; pos.set(x, (p.z || 0) / 31.1, z);
  const sitting = p.pose === "sit", walking = !fresh && (p.pose === "walk" || (!sitting && d > dt * 0.12)) && d > 1e-5;
  if(walking && d < 1){ P.walkH = Math.atan2(dx, dz); P.step = (P.step || 0) + d * 6.4 / (info.kid ? 0.74 : 1); }
  let want = P.heading;
  if(walking && P.walkH != null) want = P.walkH;
  else if(sitting) want = p.front ? 0 : Math.PI;
  else if(e.kind === "npc" || p.face < 0) want = p.face < 0 ? Math.PI : 0;
  else if(p.j < 3.6 && p.i > 21 && p.i < 27 || p.j < 6.6 && p.j > 5.4 && p.i > 14 && p.i < 18.4) want = Math.PI;   // 카운터 · 안내 데스크 앞
  if(fresh){ P.heading = want; root.rotation.y = want; } else K.turnTo(P, want, dt, walking ? 10 : 6);
  // 자세
  const talk = !!e.talk, act = p.act, opt = {ph:P.ph, talk};
  let kind = walking ? "walk" : sitting ? (act === "book" ? "tablet" : "sit") : "stand";
  if(walking) opt.step = P.step;
  if(sitting) opt.seatY = Math.hypot(p.i - 18.0, p.j - 12.55) < 0.6 || (p.i > 17.2 && p.i < 20.2 && (p.j > 11.4 && p.j < 12.7 || p.j > 14 && p.j < 15.2)) ? 0.38 : 0.6;
  const cupAct = act === "cup" || (e.kind === "pd" && sitting && !walking);
  if(!walking && (cupAct || act === "eat")){ const up = cupAct ? e.sip || (e.kind === "pd" && Math.sin(t * 0.45 + P.ph * 3) > 0.82) : e.eat; P.su += ((up ? 1 : 0.32) - P.su) * Math.min(1, dt * 5); opt.sip = true; opt.u = P.su; }
  if(act === "pad" && !sitting) opt.phone = true;
  if(e.kind === "npc" && !walking && !sitting && !talk){ opt.turn = Math.sin(t * 0.3 + P.ph) * 0.22; if(p.id === "l_rec" && !K.reduce && Math.sin(t * 0.21 + P.ph) > 0.95) opt.wave = true; }
  if(p.id === "l_park" && talk) opt.wave = true;
  K.pose(P.p, kind, t, opt);
  if(p.id === "l_bar" && !walking){ const w = K.reduce ? 0 : Math.sin(t * 3.2) * 0.08; P.p.arms.forEach((a, n) => { a.sh.rotation.x = -0.8 + (n ? w : -w); a.el.rotation.x = -0.55; }); P.p.chest.rotation.x = 0.08; }
  if(info.kid && !walking && !sitting) root.position.y = K.reduce ? 0 : Math.max(0, Math.sin(t * 5.2)) * 0.04 * (talk ? 1 : 0);
  // 손 소품
  const need = cupAct || (p.carry && p.cup) || act === "pad" || act === "book" || p.apron || p.look?.style === "cap";
  if(need){ root.updateMatrixWorld(true);
    if((cupAct && !walking) || (p.carry && p.cup)) props.push({P, k:"cup"});
    if(act === "pad") props.push({P, k:"pad", c:"#2A2A2E"});
    if(act === "book") props.push({P, k:"book", c:p.book || "#3A8A78"});
    if(p.apron){ props.push({P, k:"apron", c:p.apron}); if(!sitting) props.push({P, k:"apronL", c:p.apron}); }
    if(p.look?.style === "cap") props.push({P, k:"brim", c:R.dark ? "#F0AE5E" : "#E8A04A"}); }
}
/* 차: 시뮬 lCars (지나가는 차 · 손님 차) */
function driveCars(K, cars, dt, dark){
  const T = ST.tmp, X = K.X, Z = K.Z, use = ST.cUse, live = new Set(cars);
  use.forEach((n, c) => { if(!live.has(c)){ use.delete(c); ST.cars[n].car = null; } });
  cars.forEach(c => { if(use.has(c)) return; const n = ST.cars.findIndex(s => !s.car); if(n < 0) return; use.set(c, n); ST.cars[n].car = c; ST.cars[n].yaw = DIR_YAW[carDir(c)];
    const C = T.C.set(c.col || "#B8BEC4"); ST.carPaint.setColorAt(n, C); ST.carFixed.setColorAt(n, T.C.set(1, 1, 1)); ST.carLamp.setColorAt(n, T.C.set(1, 1, 1)); ST.carPaint.instanceColor.needsUpdate = true; });
  ST.cars.forEach((s, n) => { const c = s.car;
    if(!c){ [ST.carPaint, ST.carFixed, ST.carLamp, ST.pool].forEach(im => im.setMatrixAt(n, T.Z)); return; }
    const dir = carDir(c), want = DIR_YAW[dir] ?? 0; let da = want - s.yaw; da = Math.atan2(Math.sin(da), Math.cos(da)); s.yaw += da * Math.min(1, dt * 7);
    T.Q.setFromAxisAngle(T.up, s.yaw); T.M.compose(T.V.set(X(c.i), 0, Z(c.j)), T.Q, T.S.set(1, 1, 1));
    [ST.carPaint, ST.carFixed, ST.carLamp].forEach(im => im.setMatrixAt(n, T.M));
    const moving = !(c.st === "wait"), f = {"+i":[1,0], "-i":[-1,0], "+j":[0,1], "-j":[0,-1]}[dir];
    if(dark && moving){ T.M.compose(T.V.set(X(c.i + f[0] * 1.75), 0.03, Z(c.j + f[1] * 1.75)), T.Q, T.S.set(1.7, 1, 1.15)); ST.pool.setMatrixAt(n, T.M); } else ST.pool.setMatrixAt(n, T.Z); });
  [ST.carPaint, ST.carFixed, ST.carLamp, ST.pool].forEach(im => im.instanceMatrix.needsUpdate = true);
}
