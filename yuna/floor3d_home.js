/* 유나네 집 3D (2026-11-23 감독님 "옆 건물에 집도 하나 만들어서 왔다갔다", "힐스테이트 라피아노 삼송 찾아서 해",
   "부엌은 아일랜드 식탁이 거실을 바라봐야", "전체 사이즈가 좀 작네", "데크에 창문? 주차장 2대, 아베오랑 테슬라 모델Y")
   감독님 말: "1층에 정원있고 방 없이 입구있고 2층에 거실 부엌 게스트화장실 3층에 방3개와 화장실2개 4층에 다락방과 옥상"
   → 한 채짜리 4층 타운하우스. 파일 하나, 주소 뒤 ?f=N 으로 층을 고름 (층마다 따로 모듈 인스턴스):
     1층 (./floor3d_home.js)      현관 · 필로티 주차장(아베오 · 테슬라 모델Y, 충전기) · 앞마당 · 옆 정원(데크·바비큐·아기 수영장·그네)
     2층 (./floor3d_home.js?f=2)  부엌(거실을 보는 아일랜드 + 이어 붙인 고기 불판 식탁) · 거실(소파·TV) · 게스트 화장실
     3층 (./floor3d_home.js?f=3)  유나 방 · 엄마아빠 방 · 아빠 편집실 · 욕실(욕조) · 작은 욕실(샤워)
     4층 (./floor3d_home.js?f=4)  다락방(박공 지붕 서까래·영화 보는 매트리스·인디언 텐트) · 옥상 정원(텃밭·망원경·전구 줄)
   공개 평면도는 못 찾음 (분양 기사: 단독형 84㎡, 중정·테라스·루프탑·다락). 방 배치는 감독님 말 + 흔한 타운하우스 꼴로 잡음.
   계단: 왼쪽 벽 옆 두 줄 (A: i 0~1.3, B: i 1.3~2.6, j 5.0~8.36). 1→2층 A(−j로 오름) · 2→3층 B(+j) · 3→4층 A(−j).
   아빠 크레용(감독) · 엄마 노라(예운옥) · 딸 유나(10살). 핑크 #E8B5C8 · 라일락 #C8B4D0 · 페이퍼 #FAF7F2.
   이 집에는 2D 시뮬이 없음: 사람은 유나 모드의 아빠·엄마(yuna_game.js)만. 앉는 자리·계단은 아래 HOME
   깜빡임 방지: 같은 쪽을 보는 면이 같은 자리에 겹치지 않게 (크기를 0.01~0.02씩 어긋나게), 바닥에 붙는 것은 그림(paintFloor)으로 */
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const PI = Math.PI, FNO = (m => m ? +m[1] : 1)(/[?&]f=([1-4])\b/.exec(import.meta.url));
const HW = 16, HD = 11, TALL = 112, LOW = 36, T = 0.2, BT = 0.25;   // 집 16×11칸 · 뒷벽은 높게, 앞·옆·칸막이는 인형집처럼 낮게
const STEPS = 12, RISE = TALL / STEPS, SD = 0.28, SJ0 = 5.0, SJ1 = SJ0 + STEPS * SD;   // 계단 12칸 (깊이 0.28) j 5.0 ~ 8.36
const SA = {i0:0, i1:1.3}, SB = {i0:1.3, i1:2.6};
const KNEE = 44, PEAK = TALL;   // 4층 다락: 처마 쪽 벽 높이 · 용마루 높이
const RB = ["#F4A7B9", "#F9C99B", "#F6E39A", "#A8DCC8", "#A9CBEA", "#C8B4D0"];
const rnd = k => { const v = Math.sin(k * 12.9898) * 43758.5453; return v - Math.floor(v); };

let K = null, W = null;
const X = i => K.X(i), Z = j => K.Z(j), hz = p => K.hz(p);
const D = (l, d) => [l, d];
const B = (i, j, w, d, h, col, z0 = 0, o = {}) => K.B(i, j, w, d, h, col, z0, o);
const PINK = D("#E8B5C8", "#7A5866"), PINK2 = D("#F4D3DF", "#6A4E5A"), LILAC = D("#C8B4D0", "#5E4E68"), LILAC2 = D("#E2D6EA", "#4E4458"),
  PAPER = D("#FAF7F2", "#3A3632"), WHITE = D("#FFFFFF", "#8A847C"), WOOD = D("#D9B98F", "#6B5440"), WOODD = D("#A98258", "#4E3C2C"),
  CAPC = D("#FFFFFF", "#6A625C"), GOLD = D("#E8C36A", "#B8964A"), INK = "#2A2A28";
const LG = [];
const myGeo = g => { LG.push(g); return g; };
function rod(a, b, r, col, cls = "s", seg = 8){
  const A = new THREE.Vector3(X(a[0]), hz(a[2]), Z(a[1])), C = new THREE.Vector3(X(b[0]), hz(b[2]), Z(b[1])), len = A.distanceTo(C); if(len < 1e-4) return;
  const o = K.sm(K.cyl(r, r, len, seg), col, (A.x + C.x) / 2, (A.y + C.y) / 2, (A.z + C.z) / 2, null, cls); o.lookAt(C); o.rotateX(PI / 2); return o;
}
const ball = (i, j, zp, r, col, cls = "m", seg = 12) => K.sm(K.sph(r, seg, Math.max(6, seg * 0.75 | 0)), col, X(i), hz(zp), Z(j), null, cls);
const disc = (i, j, r, zp, hp, col, cls = "m", seg = 24) => { const H = Math.max(0.006, hz(hp)); return K.sm(K.cyl(r, r, H, seg), col, X(i), hz(zp) + H / 2, Z(j), null, cls); };
/* 칸막이·앞벽 (낮은 벽 + 흰 뚜껑): along "i" = j 고정, "j" = i 고정. 끝끼리는 맞대기만 (겹치면 윗면이 깜빡임) */
function wallI(i0, i1, j, col, h = LOW){ if(i1 - i0 < 0.02) return; B(i0, j - T / 2, i1 - i0, T, h - 1.6, col, 0, {r:0}); B(i0, j - T / 2, i1 - i0, T, 1.6, CAPC, h - 1.6, {r:0}); }
function wallJ(j0, j1, i, col, h = LOW){ if(j1 - j0 < 0.02) return; B(i - T / 2, j0, T, j1 - j0, h - 1.6, col, 0, {r:0}); B(i - T / 2, j0, T, j1 - j0, 1.6, CAPC, h - 1.6, {r:0}); }
const gaps = (a, b, gs) => { const out = []; let s = a; gs.forEach(([g0, g1]) => { out.push([s, g0]); s = g1; }); out.push([s, b]); return out; };
/* 뒷벽 (j = 0 · i = 0): 바깥 껍데기 + 방마다 벽지 판 (판은 벽에서 0.012 앞) */
function backWalls(paperJ, paperI){
  const ext = D("#F3E9E4", "#4A403C");
  B(0, -BT, HW, BT, TALL, ext, 0, {r:0}); B(-BT, 0, BT, HD + T / 2, TALL, ext, 0, {r:0}); B(-BT, -BT, BT, BT, TALL, ext, 0, {r:0});
  B(-BT, -BT, HW + BT, BT, 3, CAPC, TALL, {r:0}); B(-BT, 0, BT, HD + T / 2, 3, CAPC, TALL, {r:0});
  paperJ.forEach(([i0, i1, col]) => K.faceJ(i0, i1, 0.0, 0, TALL, col, "m", 0.012));
  paperI.forEach(([j0, j1, col]) => K.faceI(0.0, j0, j1, 0, TALL, col, "m", 0.012));
  // 걸레받이 (벽지 판보다 앞)
  K.faceJ(0, HW, 0.012, 0, 3.5, D("#FFFFFF", "#6A625C"), "m", 0.012); K.faceI(0.012, 0, HD, 0, 3.5, D("#FFFFFF", "#6A625C"), "m", 0.012);
}
/* 창 (뒷벽 j = 0): 하늘 그림 + 흰 창틀. 창틀은 그림보다 앞 */
function winJ(i0, i1, z0, z1, view = "garden"){
  const ww = i1 - i0, wh = hz(z1 - z0);
  K.decal(Math.round(ww * 90), Math.round(wh * 90), (c, w, h, dark) => {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, dark ? "#1A2540" : "#BFE0F2"); g.addColorStop(1, dark ? "#33405E" : "#F2EAF2"); c.fillStyle = g; c.fillRect(0, 0, w, h);
    if(dark){ c.fillStyle = "#FFF4D6"; for(let k = 0; k < 9; k++){ c.globalAlpha = 0.4 + rnd(k + i0) * 0.6; c.fillRect(rnd(k * 3 + i0) * w, rnd(k * 7 + i0) * h * 0.6, 2, 2); } c.globalAlpha = 1;
      c.beginPath(); c.arc(w * 0.72, h * 0.22, h * 0.08, 0, 7); c.fill(); }
    else { c.fillStyle = "rgba(255,255,255,.9)"; [[0.3, 0.3, 0.12], [0.42, 0.26, 0.09], [0.75, 0.42, 0.08]].forEach(([x, y, r]) => { c.beginPath(); c.arc(w * x, h * y, h * r, 0, 7); c.fill(); }); }
    if(view === "garden"){ c.fillStyle = dark ? "#1E2B30" : "#9CC58A"; c.beginPath(); c.moveTo(0, h); c.quadraticCurveTo(w * 0.35, h * 0.62, w, h * 0.8); c.lineTo(w, h); c.fill();
      c.fillStyle = dark ? "#26322C" : "#6FAE64"; [[0.2, 0.74], [0.62, 0.78], [0.88, 0.7]].forEach(([x, y]) => { c.beginPath(); c.arc(w * x, h * y, h * 0.1, 0, 7); c.fill(); }); }
    else { c.fillStyle = dark ? "#2A3048" : "#D9D2E6"; [[0.05, 0.55, 0.16], [0.25, 0.4, 0.14], [0.45, 0.6, 0.2], [0.7, 0.45, 0.14]].forEach(([x, y, ww2]) => c.fillRect(w * x, h * y, w * ww2, h)); }
    const s = c.createLinearGradient(w, 0, 0, h); s.addColorStop(0, "rgba(255,255,255,.25)"); s.addColorStop(0.4, "rgba(255,255,255,0)"); c.fillStyle = s; c.fillRect(0, 0, w, h);
  }, ww, wh, "i", (i0 + i1) / 2, 0.0, hz((z0 + z1) / 2));
  const fr = WHITE;
  B(i0 - 0.06, 0.012, 0.06, 0.07, z1 - z0 + 3, fr, z0 - 1.5, {r:0, cls:"s"}); B(i1, 0.012, 0.06, 0.07, z1 - z0 + 3, fr, z0 - 1.5, {r:0, cls:"s"});
  B(i0 - 0.06, 0.012, ww + 0.12, 0.076, 1.5, fr, z1 + 0.01, {r:0, cls:"s"}); B(i0 - 0.1, 0.012, ww + 0.2, 0.16, 1.8, fr, z0 - 1.8, {r:0, cls:"s"});
  B((i0 + i1) / 2 - 0.02, 0.012, 0.04, 0.05, z1 - z0, fr, z0, {r:0, cls:"s"});
}
/* 화분 (꽃 색 줄 수 있음) */
function flowerPot(i, j, col, s = 1, pot = PINK, z0 = 0){
  B(i - 0.17 * s, j - 0.17 * s, 0.34 * s, 0.34 * s, 10 * s, pot, z0, {r:0.05});
  disc(i, j, 0.14 * s, z0 + 10 * s, 0.6, D("#7A5A3C", "#3A2A20"));
  [[0, 0, 22], [0.08, 0.05, 18], [-0.07, 0.06, 19], [0.04, -0.08, 17]].forEach(([di, dj, z], k) => { rod([i + di * s, j + dj * s, z0 + 10 * s], [i + di * 1.4 * s, j + dj * 1.4 * s, z0 + z * s], 0.008, D("#5FA582", "#3E6E54"), "m", 5);
    ball(i + di * 1.4 * s, j + dj * 1.4 * s, z0 + z * s, 0.055 * s, k % 2 ? "#FFFFFF" : col, "m", 8); ball(i + di * 1.4 * s, j + dj * 1.4 * s, z0 + z * s + 0.9, 0.025 * s, "#F6E39A", "m", 6); });
  [[0.1, 0.1], [-0.1, 0.08], [0, -0.11]].forEach(([di, dj]) => ball(i + di * s, j + dj * s, z0 + 12.5 * s, 0.06 * s, K.sh("plant", 0.1), "m", 8));
}
function tree(i, j, s){
  K.sm(K.cyl(0.07 * s, 0.1 * s, hz(40 * s), 8), D("#8A6A4C", "#4A3828"), X(i), hz(20 * s), Z(j), null, "m");
  [[0, 0, 56, 0.55], [-0.3, 0.12, 48, 0.4], [0.3, 0.1, 49, 0.42], [0.05, -0.28, 50, 0.4], [0.08, 0.3, 46, 0.36], [0, 0.02, 68, 0.38]].forEach(([di, dj, z, r], k) =>
    ball(i + di * s, j + dj * s, z * s, r * s, k % 2 ? K.sh("plant", 0.14) : "plant", "m", 14));
  [[0.25, 0.2, 60], [-0.2, -0.15, 63], [0.1, 0.35, 52]].forEach(([di, dj, z]) => ball(i + di * s, j + dj * s, z * s, 0.05 * s, "#F4A7B9", "m", 8));
}
/* 의자 (face +1 = +j를 보고 앉음, 등받이는 -j 쪽) */
function chair(ci, cj, dir, col = WOOD, cush = PINK){   // dir = 앉은 사람이 보는 쪽 "+j" "-j" "+i" "-i", 등받이는 반대쪽
  [[-0.18, -0.17], [0.13, -0.17], [-0.18, 0.12], [0.13, 0.12]].forEach(([a, b]) => B(ci + a, cj + b, 0.05, 0.05, 15, K.sh(col, -0.3), 0, {r:0, cls:"s"}));
  B(ci - 0.22, cj - 0.21, 0.44, 0.42, 3, col, 15, {r:0.03}); B(ci - 0.18, cj - 0.17, 0.36, 0.34, 1.5, cush, 18, {r:0.03});
  const bc = K.sh(col, -0.06);
  if(dir === "+j") B(ci - 0.21, cj - 0.26, 0.42, 0.06, 20, bc, 18, {r:0.025});
  else if(dir === "-j") B(ci - 0.21, cj + 0.2, 0.42, 0.06, 20, bc, 18, {r:0.025});
  else if(dir === "+i") B(ci - 0.27, cj - 0.2, 0.06, 0.4, 20, bc, 18, {r:0.025});
  else B(ci + 0.21, cj - 0.2, 0.06, 0.4, 20, bc, 18, {r:0.025});
}

/* ---------- 움직이는 그림판 (TV 화면) ---------- */
const DW = 512, DH = 256;
function dAlloc(w, h){ const A = W.dA; w = Math.ceil(w); h = Math.ceil(h); if(A.x + w + 2 > DW){ A.x = 2; A.y += A.row + 3; A.row = 0; } const r = {x:A.x, y:A.y, w, h}; A.x += w + 3; A.row = Math.max(A.row, h); return r; }
function dplane(wpx, hpx, ww, wh, i, j, zc, draw, off = 0.012){
  const r = dAlloc(wpx, hpx); W.dyn.push({r, draw});
  const g = new THREE.PlaneGeometry(ww, wh), uv = g.attributes.uv;
  for(let k = 0; k < uv.count; k++){ const u = uv.getX(k), v = uv.getY(k); uv.setXY(k, (r.x + u * r.w) / DW, 1 - (r.y + (1 - v) * r.h) / DH); }
  g.translate(X(i), zc, Z(j) + off); W.dgeo.push(g);
}
function drawTV(c, w, h, tm, dark){
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#9FD3F2"); g.addColorStop(1, "#FBE3EC"); c.fillStyle = g; c.fillRect(0, 0, w, h);
  const t = tm / 1000;
  RB.forEach((col, k) => { c.strokeStyle = col; c.lineWidth = h * 0.055; c.beginPath(); c.arc(w * 0.5, h * 1.05, h * (0.78 - k * 0.055), PI, 0); c.stroke(); });
  const cloud = (x, y, r) => { c.fillStyle = "#FFFFFF"; [[-1, 0.15, 0.7], [0, -0.2, 1], [1, 0.1, 0.75]].forEach(([dx, dy, rr]) => { c.beginPath(); c.arc(x + dx * r, y + dy * r, rr * r, 0, 7); c.fill(); }); };
  cloud((t * 22) % (w + 80) - 40, h * 0.28, h * 0.08); cloud((t * 14 + w * 0.6) % (w + 80) - 40, h * 0.16, h * 0.06);
  // 통통 뛰는 크레용 친구
  const bx = w * 0.5 + Math.sin(t * 1.3) * w * 0.22, by = h * 0.72 - Math.abs(Math.sin(t * 3.2)) * h * 0.16;
  c.fillStyle = "#E8A04A"; c.fillRect(bx - h * 0.05, by - h * 0.16, h * 0.1, h * 0.26); c.beginPath(); c.moveTo(bx - h * 0.05, by - h * 0.16); c.lineTo(bx, by - h * 0.26); c.lineTo(bx + h * 0.05, by - h * 0.16); c.fill();
  c.fillStyle = "#2A2A28"; c.beginPath(); c.arc(bx - h * 0.02, by - h * 0.07, h * 0.01, 0, 7); c.arc(bx + h * 0.02, by - h * 0.07, h * 0.01, 0, 7); c.fill();
  c.fillStyle = "#4DAA97"; c.fillRect(bx - h * 0.05, by + h * 0.02, h * 0.1, h * 0.03);
  c.fillStyle = "rgba(42,42,40,.72)"; c.fillRect(0, h * 0.86, w, h * 0.14);
  c.fillStyle = "#FFFFFF"; c.font = `800 ${h * 0.09}px "IBM Plex Sans KR", system-ui, sans-serif`; c.textBaseline = "middle";
  const msg = "크레용팜 TV · 오늘 저녁은 우리 집 고기 파티 🥩 · 유나야 숙제했니? 😆 · ", tw = c.measureText(msg).width;
  const x0 = -((t * 60) % tw); c.fillText(msg + msg + msg, x0, h * 0.93);
  c.fillStyle = "#E06A55"; c.beginPath(); c.arc(w * 0.06, h * 0.08, h * 0.03, 0, 7); c.fill(); c.fillStyle = "#FFFFFF"; c.font = `800 ${h * 0.07}px system-ui`; c.fillText("LIVE", w * 0.1, h * 0.085);
  if(dark){ c.fillStyle = "rgba(20,16,30,.18)"; c.fillRect(0, 0, w, h); }
}
/* 정점 색 한 덩어리 (움직이는 물건, 낮·밤 두 벌) */
function Merge(){
  const parts = [], m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  return {
    add(g, col, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0){ e.set(rx, ry, rz); q.setFromEuler(e); m4.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(1, 1, 1)); parts.push({g, c:K.cp(col), m:m4.clone()}); },
    geo(){
      const gs = parts.map(p => { const g = p.g.index ? p.g.toNonIndexed() : p.g.clone(); Object.keys(g.attributes).forEach(k => { if(k !== "position" && k !== "normal") g.deleteAttribute(k); });
        g.applyMatrix4(p.m); const n = g.attributes.position.count, a = new Float32Array(n * 3), b = new Float32Array(n * 3), cl = new THREE.Color(p.c[0]), cd = new THREE.Color(p.c[1]);
        for(let k = 0; k < n; k++){ a.set([cl.r, cl.g, cl.b], k * 3); b.set([cd.r, cd.g, cd.b], k * 3); }
        g.setAttribute("color", new THREE.BufferAttribute(a, 3)); g.userData.d = b; return g; });
      const out = mergeGeometries(gs, false), L = out.attributes.color.array.slice(), Dk = new Float32Array(L.length); let off = 0;
      gs.forEach(g => { Dk.set(g.userData.d, off); off += g.userData.d.length; g.dispose(); }); out.userData = {L, D:Dk}; return out;
    }};
}
function dynMesh(g){ const m = new THREE.Mesh(g, K.cutaway(new THREE.MeshStandardMaterial({vertexColors:true, roughness:0.55}))); m.castShadow = true; K.R.scene.add(m); W.recolor.push(m); return m; }
const gl = (i, j, zp, rpx, col, a) => W.glows.push({p:new THREE.Vector3(X(i), hz(zp), Z(j)), s:rpx / 31.3 * 2, c:new THREE.Color(col), a});

/* ---------- 공통 작은 도구 (층 4개가 같이 씀) ---------- */
function paintKit(c, dark){
  const v = (l, d) => dark ? d : l, FS = K.FS;
  const rect = (i0, j0, i1, j1, col) => { c.fillStyle = col; c.fillRect(i0, j0, i1 - i0, j1 - j0); };
  const rr = (i0, j0, i1, j1, r, col) => { c.fillStyle = col; c.beginPath(); c.roundRect(i0, j0, i1 - i0, j1 - j0, r); c.fill(); };
  const line = (i0, j0, i1, j1, col, w = 0.02) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(i0, j0); c.lineTo(i1, j1); c.stroke(); };
  const text = (t, i, j, size, col, w = 800, fam = K.FONT) => { c.save(); c.translate(i, j); c.scale(1 / FS, 1 / FS); c.font = `${w} ${size / 31.3 * FS}px ${fam}`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = col; c.fillText(t, 0, 0); c.restore(); };
  const glow = (i, j, r, c0) => { const g = c.createRadialGradient(i, j, 0, i, j, r); g.addColorStop(0, c0); g.addColorStop(1, "rgba(255,240,210,0)"); c.fillStyle = g; c.beginPath(); c.arc(i, j, r, 0, 7); c.fill(); };
  const wood = (i0, j0, i1, j1, l = "#EAD8BF", d = "#47392D") => { rect(i0, j0, i1, j1, v(l, d)); const ln = v("rgba(120,80,40,.10)", "rgba(0,0,0,.22)");
    for(let j = j0 + 0.42; j < j1; j += 0.42) line(i0, j, i1, j, ln, 0.014);
    for(let k = 0, j = j0; j < j1; j += 0.42, k++) for(let i = i0 + (k % 3) * 0.8 + 0.3; i < i1; i += 2.4) line(i, j, i, Math.min(j1, j + 0.42), ln, 0.014); };
  const check = (i0, j0, i1, j1, s, a, b) => { rect(i0, j0, i1, j1, a); for(let i = i0; i < i1; i += s) for(let j = j0; j < j1; j += s) if((Math.round((i - i0) / s) + Math.round((j - j0) / s)) % 2) rect(i, j, Math.min(i1, i + s), Math.min(j1, j + s), b); };
  const deck = (i0, j0, i1, j1, along = "j") => { rect(i0, j0, i1, j1, v("#D4B08A", "#574536")); const ln = v("rgba(110,70,30,.2)", "rgba(0,0,0,.32)");
    if(along === "j") for(let i = i0; i < i1; i += 0.3) line(i, j0, i, j1, ln, 0.022); else for(let j = j0; j < j1; j += 0.32) line(i0, j, i1, j, ln, 0.025); };
  const arrow = (t, i, j) => { rr(i - 0.42, j - 0.17, i + 0.42, j + 0.17, 0.17, v("rgba(232,181,200,.55)", "rgba(232,181,200,.18)")); text(t, i, j, 5.2, v("#9A4E6A", "#F4C7D4")); };
  return {v, rect, rr, line, text, glow, wood, check, deck, arrow};
}
const doorFrameI = (a, b, j) => { B(a, j - 0.12, 0.07, 0.24, 66, WHITE, 0, {r:0, cls:"s"}); B(b - 0.07, j - 0.12, 0.07, 0.24, 66, WHITE, 0, {r:0, cls:"s"}); B(a, j - 0.115, b - a, 0.23, 3, WHITE, 66, {r:0, cls:"s"}); };
const doorFrameJ = (a, b, i) => { B(i - 0.12, a, 0.24, 0.07, 66, WHITE, 0, {r:0, cls:"s"}); B(i - 0.12, b - 0.07, 0.24, 0.07, 66, WHITE, 0, {r:0, cls:"s"}); B(i - 0.115, a, 0.23, b - a, 3, WHITE, 66, {r:0, cls:"s"}); };
/* 유리 난간 (흰 기둥 + 유리 + 손잡이) */
function glassRail(a, b, fixed, axis, h = 32){
  const n = Math.max(1, Math.round((b - a) / 0.7));
  for(let k = 0; k <= n; k++){ const u = a + (b - a) * k / n; axis === "i" ? B(u - 0.03, fixed - 0.03, 0.06, 0.06, h, WHITE, 0, {r:0, cls:"s"}) : B(fixed - 0.03, u - 0.03, 0.06, 0.06, h, WHITE, 0, {r:0, cls:"s"}); }
  if(axis === "i"){ K.faceJ(a, b, fixed - 0.012, 2, h - 2, D("#DDE8F2", "#7A90B8"), "glass", 0.024); B(a - 0.03, fixed - 0.045, b - a + 0.06, 0.09, 2, WHITE, h, {r:0.01, cls:"s"}); }
  else { K.faceI(fixed - 0.012, a, b, 2, h - 2, D("#DDE8F2", "#7A90B8"), "glass", 0.024); B(fixed - 0.045, a - 0.03, 0.09, b - a + 0.06, 2, WHITE, h, {r:0.01, cls:"s"}); }
}
/* 창 (왼벽 i = 0): 하늘 그림 + 흰 창틀 */
function winI(j0, j1, z0, z1){
  const ww = j1 - j0, wh = hz(z1 - z0);
  K.decal(Math.round(ww * 90), Math.round(wh * 90), (c, w, h, dark) => {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, dark ? "#1A2540" : "#BFE0F2"); g.addColorStop(1, dark ? "#33405E" : "#F2EAF2"); c.fillStyle = g; c.fillRect(0, 0, w, h);
    if(dark){ c.fillStyle = "#FFF4D6"; for(let k = 0; k < 7; k++) c.fillRect(rnd(k * 3 + j0) * w, rnd(k * 7 + j0) * h * 0.7, 2, 2); }
    else { c.fillStyle = "rgba(255,255,255,.9)"; [[0.35, 0.35, 0.13], [0.5, 0.3, 0.1]].forEach(([x, y, r]) => { c.beginPath(); c.arc(w * x, h * y, h * r, 0, 7); c.fill(); }); } }, ww, wh, "j", 0.0, (j0 + j1) / 2, hz((z0 + z1) / 2));
  B(0.012, j0 - 0.06, 0.07, 0.06, z1 - z0 + 3, WHITE, z0 - 1.5, {r:0, cls:"s"}); B(0.012, j1, 0.07, 0.06, z1 - z0 + 3, WHITE, z0 - 1.5, {r:0, cls:"s"});
  B(0.012, j0 - 0.06, 0.076, ww + 0.12, 1.5, WHITE, z1 + 0.01, {r:0, cls:"s"}); B(0.012, j0 - 0.1, 0.16, ww + 0.2, 1.8, WHITE, z0 - 1.8, {r:0, cls:"s"});
  B(0.012, (j0 + j1) / 2 - 0.02, 0.05, 0.04, z1 - z0, WHITE, z0, {r:0, cls:"s"});
}
/* 계단 한 줄: dir −1 = 아래 j 7.96 → 위 j 4.6 (−j로 오름), +1 = 아래 j 4.6 → 위 j 7.96 */
const stepTop = (j, dir) => RISE * (Math.floor(dir < 0 ? (SJ1 - j) / SD : (j - SJ0) / SD) + 1);
function flight(s, dir){
  const w = s.i1 - s.i0, tread = D("#E9D2B4", "#7A6046");
  for(let k = 0; k < STEPS; k++){ const j0 = dir < 0 ? SJ1 - (k + 1) * SD : SJ0 + k * SD;
    B(s.i0 + 0.012, j0, w - 0.024, SD, RISE * (k + 1) - 1.2, WOOD, 0, {r:0});
    B(s.i0 + 0.018, dir < 0 ? j0 : j0 - 0.02, w - 0.036, SD + 0.02, 1.2, tread, RISE * (k + 1) - 1.2, {r:0}); }
}
function stairRail(iR, dir){
  const js = []; for(let k = 0; k <= 8; k++) js.push(SJ0 + 0.15 + k * (SJ1 - SJ0 - 0.3) / 8);
  js.forEach(j => rod([iR, j, 0], [iR, j, stepTop(j, dir) + 26], 0.014, WHITE, "s", 6));
  rod([iR, js[0], stepTop(js[0], dir) + 26], [iR, js[8], stepTop(js[8], dir) + 26], 0.03, PINK, "s", 8);
}
/* 바닥 판 (계단 구멍 s를 뺌) + 구멍 안에 보이는 내려가는 계단 세 칸. arrive = 아래층에서 올라온 계단 머리 쪽 ("n" = j 4.6, "s" = j 7.96) */
function slabHole(s, arrive){
  const sz = -12 - 0.19, box = (i0, j0, i1, j1) => { if(i1 - i0 > 0.01 && j1 - j0 > 0.01) B(i0, j0, i1 - i0, j1 - j0, 12, "slab", sz, {r:0}); };
  box(0, 0, HW, SJ0); box(0, SJ1, HW, HD); box(0, SJ0, s.i0, SJ1); box(s.i1, SJ0, HW, SJ1);
  const w = s.i1 - s.i0 - 0.024, tread = D("#E9D2B4", "#7A6046");
  for(let k = 0; k < 3; k++) B(s.i0 + 0.012, arrive === "n" ? SJ0 + k * SD : SJ1 - (k + 1) * SD, w, SD, 1.2, tread, -3.2 * (k + 1) - 1.2, {r:0});
  B(s.i0 + 0.012, arrive === "n" ? SJ0 + 3 * SD : SJ0, w, SJ1 - SJ0 - 3 * SD, 0.6, D("#5A4A40", "#1E1814"), -12.0, {r:0});
}
/* 변기: (ci, cj) = 변기 가운데, dir = 앉으면 보는 쪽 */
function toilet(ci, cj, dir){
  if(dir === "-j"){ B(ci - 0.26, cj + 0.24, 0.52, 0.2, 26, WHITE, 0, {r:0.04, cls:"s"}); B(ci - 0.21, cj - 0.23, 0.42, 0.46, 13, WHITE, 0, {r:0.12, cls:"s"}); B(ci - 0.23, cj - 0.25, 0.46, 0.48, 1.2, PINK2, 13, {r:0.14}); }
  else { B(ci - 0.44, cj - 0.26, 0.2, 0.52, 26, WHITE, 0, {r:0.04, cls:"s"}); B(ci - 0.23, cj - 0.21, 0.46, 0.42, 13, WHITE, 0, {r:0.12, cls:"s"}); B(ci - 0.25, cj - 0.23, 0.48, 0.46, 1.2, PINK2, 13, {r:0.14}); }
}
/* 세면대 + 기둥 거울 (벽이 낮아서 거울은 받침대에) */
function sinkMirror(i0, j0, w, d, mi, mj, face){
  B(i0, j0, w, d, 24, LILAC, 0, {r:0.02}); B(i0 - 0.02, j0 - 0.02, w + 0.04, d + 0.04, 2.4, WHITE, 24, {r:0.02});
  const bi = i0 + w / 2, bj = j0 + d / 2; disc(bi, bj, Math.min(w, d) * 0.32, 26.4, 1.4, WHITE, "s", 20);
  rod([mi, mj, 26.4], [mi, mj, 37], 0.016, PINK);
  const m = K.sm(K.cyl(0.26, 0.26, 0.03, 30), PINK, X(mi), hz(46), Z(mj), null, "s"), g = K.sm(K.cyl(0.22, 0.22, 0.012, 30), D("#E6EEF4", "#5A6470"), X(mi + (face === "+i" ? 0.02 : 0)), hz(46), Z(mj + (face === "+j" ? 0.02 : 0)), null, "s");
  if(face === "+j"){ m.rotation.x = PI / 2; g.rotation.x = PI / 2; } else { m.rotation.z = PI / 2; g.rotation.z = PI / 2; }
}
function dirChair(ci, cj){   // 감독 의자 (아빠): 캔버스 등받이에 CREYONG, 앞(−j)을 봄
  const fr = D("#3A2A20", "#2A2018");
  [[-0.24, -0.2], [0.2, -0.2], [-0.24, 0.18], [0.2, 0.18]].forEach(([a, b]) => B(ci + a, cj + b, 0.05, 0.05, 15, fr, 0, {r:0, cls:"s"}));
  rod([ci - 0.22, cj - 0.18, 1], [ci + 0.22, cj + 0.18, 13], 0.012, fr); rod([ci + 0.22, cj - 0.18, 1], [ci - 0.22, cj + 0.18, 13], 0.012, fr);
  B(ci - 0.24, cj - 0.2, 0.49, 0.43, 1.6, PINK, 15, {r:0.01}); B(ci - 0.26, cj + 0.2, 0.06, 0.06, 26, fr, 15, {r:0, cls:"s"}); B(ci + 0.21, cj + 0.2, 0.06, 0.06, 26, fr, 15, {r:0, cls:"s"});
  B(ci - 0.24, cj + 0.21, 0.49, 0.04, 9, D("#2A2A28", "#1E1E20"), 30, {r:0}); K.wtext("CREYONG", ci, cj + 0.255, 34.5, "i", 2.6, "#F4C7D4", null, 800);
  [-0.26, 0.21].forEach(a => B(ci + a, cj - 0.2, 0.06, 0.42, 1.2, fr, 22, {r:0.01}));
}
function flowerStem(i, j, col, h){ rod([i, j, 0], [i, j, h], 0.01, D("#5FA582", "#3E6E54"), "m", 5); ball(i, j, h, 0.075, col, "m", 8); ball(i, j, h + 1, 0.032, "#FFF4C2", "m", 6); ball(i + 0.06, j, h * 0.45, 0.05, K.sh("plant", 0.1), "m", 6); }
function laundry(ri, rj){   // 빨래 건조대 + 유나 원피스 · 양말
  const fr = "#C9CDD2"; [[-0.5, -0.25], [0.5, -0.25], [-0.5, 0.25], [0.5, 0.25]].forEach(([a, b]) => rod([ri + a, rj + b, 0], [ri + a * 0.9, rj, 36], 0.012, fr));
  [-0.12, 0.12].forEach(d => rod([ri - 0.48, rj + d, 34], [ri + 0.48, rj + d, 34], 0.008, fr));
  B(ri - 0.35, rj - 0.13, 0.32, 0.02, 14, D("#F4A7B9", "#7A5866"), 20, {r:0.01}); B(ri + 0.05, rj - 0.13, 0.12, 0.02, 6, "#A9CBEA", 28, {r:0.01}); B(ri + 0.22, rj - 0.13, 0.12, 0.02, 6, "#F6E39A", 28, {r:0.01});
  B(ri - 0.3, rj + 0.11, 0.5, 0.02, 10, "#FFFFFF", 24, {r:0.01});
}
function bistro(ti, tj){   // 둥근 테이블 + 의자 둘 (+i · −i)
  disc(ti, tj, 0.4, 20, 1.5, WHITE, "s", 28); K.sm(K.cyl(0.03, 0.03, hz(20), 8), INK, X(ti), hz(10), Z(tj), null, "s"); disc(ti, tj, 0.18, 0, 0.8, INK, "s");
  disc(ti - 0.1, tj - 0.05, 0.07, 21.5, 2.5, "#FFFFFF", "s", 12); disc(ti + 0.15, tj + 0.1, 0.07, 21.5, 2.5, PINK, "s", 12);
  chair(ti - 0.6, tj, "+i", WHITE, PINK2); chair(ti + 0.6, tj, "-i", WHITE, LILAC2);
}

/* 가구 묶음 옮기기: shift(di, dj, () => {...}) 안에서 그린 것은 전부 (di, dj)만큼 옮겨짐 (K를 감싼 판) */
let OI = 0, OJ = 0;
const shift = (di, dj, fn) => { OI += di; OJ += dj; try { fn(); } finally { OI -= di; OJ -= dj; } };
const pshift = (c, di, dj, fn) => { c.save(); c.translate(di, dj); fn(); c.restore(); };
function wrapKit(K0){
  return Object.assign(Object.create(K0), {
    X:i => K0.X(i + OI), Z:j => K0.Z(j + OJ),
    B:(i, j, ...r) => K0.B(i + OI, j + OJ, ...r),
    faceI:(i, j0, j1, ...r) => K0.faceI(i + OI, j0 + OJ, j1 + OJ, ...r),
    faceJ:(i0, i1, j, ...r) => K0.faceJ(i0 + OI, i1 + OI, j + OJ, ...r),
    decal:(w, h, d, ww, wh, ax, i, j, ...r) => K0.decal(w, h, d, ww, wh, ax, i + OI, j + OJ, ...r),
    wtext:(t, i, j, ...r) => K0.wtext(t, i + OI, j + OJ, ...r),
    plant:(i, j, ...r) => K0.plant(i + OI, j + OJ, ...r)});
}
/* 자동차 (1 칸 ≈ 0.67 m, 1 px ≈ 2.1 cm). nose = "-j"(뒷벽 쪽으로 머리) / "+j"(마당 쪽으로 머리) */
function car(ci, j0, w, L, body, nose, o = {}){
  const tire = "#26262A", glass = D("#46536A", "#202836"), wr = 0.47, front = nose === "-j" ? j0 : j0 + L, back = nose === "-j" ? j0 + L : j0, sgn = nose === "-j" ? 1 : -1;
  const tg = myGeo(new THREE.CylinderGeometry(wr, wr, 0.27, 20)); tg.rotateZ(PI / 2);
  const hg = myGeo(new THREE.CylinderGeometry(0.25, 0.25, 0.29, 14)); hg.rotateZ(PI / 2);
  [front + sgn * o.wf, back - sgn * o.wb].forEach(j => [ci - w / 2 + 0.11, ci + w / 2 - 0.11].forEach(i => { K.sm(tg, tire, X(i), wr, Z(j), null, "s"); K.sm(hg, D("#D6DADF", "#6A6E74"), X(i), wr, Z(j), null, "s"); }));
  B(ci - w / 2 + 0.03, j0 + 0.05, w - 0.06, L - 0.1, 22, body, 8, {r:0.32, seg:3});                     // 아래 몸통
  B(ci - w / 2 + 0.1, j0 + 0.03, w - 0.2, L - 0.06, 4, "#5A5A60", 8.5, {r:0.12});                       // 범퍼 띠
  const c0 = nose === "-j" ? j0 + o.hood : j0 + o.rear, c1 = nose === "-j" ? j0 + L - o.rear : j0 + L - o.hood, top = 30 + o.cabin;
  B(ci - w / 2 + 0.16, c0, w - 0.32, c1 - c0, 12, glass, 30, {r:0.3, seg:3});                           // 유리 (아래 단)
  const u0 = c0 + (nose === "-j" ? 0.5 : 0.35), u1 = c1 - (nose === "-j" ? 0.35 : 0.5);
  B(ci - w / 2 + 0.26, u0, w - 0.52, u1 - u0, top - 42, glass, 42, {r:0.26, seg:3});                     // 유리 (위 단, 앞뒤로 좁아져 비스듬히 보임)
  const mid = (c0 + c1) / 2; [mid - 0.06, (nose === "-j" ? u1 : u0) - 0.07].forEach(j => B(ci - w / 2 + 0.15, j, w - 0.3, 0.14, 12.4, body, 30, {r:0.02}));   // 기둥
  if(o.roof) B(ci - w / 2 + 0.3, u0 + 0.1, w - 0.6, u1 - u0 - 0.2, 3, body, top - 1.4, {r:0.22});
  else B(ci - w / 2 + 0.3, u0 + 0.15, w - 0.6, u1 - u0 - 0.3, 1.2, D("#2A3142", "#151A24"), top - 0.2, {r:0.2});
  [ci - w / 2 - 0.1, ci + w / 2 - 0.08].forEach(i => B(i, (nose === "-j" ? c0 : c1) - 0.16 * sgn - 0.08, 0.18, 0.16, 4, body, 31, {r:0.04}));   // 사이드미러
  [ci - w / 2 + 0.22, ci + w / 2 - 0.72].forEach(i => B(i, front - 0.03, 0.5, 0.06, 3, D("#FFF6DA", "#FFF1C2"), 24, {r:0.02, cls:"glass"}));   // 전조등
  if(o.bar) B(ci - w / 2 + 0.25, back - 0.03, w - 0.5, 0.06, 2, "#C8303A", 25, {r:0.01}); else [ci - w / 2 + 0.2, ci + w / 2 - 0.6].forEach(i => B(i, back - 0.03, 0.4, 0.06, 4, "#D23A44", 23, {r:0.02}));
  if(o.text) K.wtext(o.text, ci, nose === "-j" ? back + 0.03 : front + 0.03, o.textZ || 20, "i", o.textS || 3, o.textC || "#2A2A28", null, 800);
}

/* 트리포로 만든 진짜 차 (2026-11-23 감독님 "만들었잖아 트라이포ai로": 외장 Tripo3DAI/결과/tripo-out/aveo2 확정본을
   블렌더로 7천 면 · 텍스처 1024로 줄여 home/aveo.json + aveo.jpg. 아티팩트가 .glb를 못 올려서 mung3d.js처럼 JSON에 base64로 넣음)
   불러오기는 비동기라, 유나 모드 막기 상자는 W.extraBoxes에 넣어 두고 첫 tick에 엔진 상자 목록에 더함 */
const TA = {5126:Float32Array, 5123:Uint16Array, 5125:Uint32Array, 5121:Uint8Array}, NC = {SCALAR:1, VEC2:2, VEC3:3, VEC4:4};
function tripoCar(url, ci, cj, L, Hh, Wd, nose, cute = {}, mat = {}){   // mat: 재질 덮어쓰기 (테슬라 실버)   // cute: a·k = 가운데(|x|<a)를 k배로 줄여 바퀴는 둥근 채 짧게, top = 창문 줄 위로 키우기
  W.extraBoxes.push([X(ci - Wd / 2), Z(cj - L / 2), X(ci + Wd / 2), Z(cj + L / 2), 0.08, Hh * 0.6]);
  const scene = K.R.scene, cut = K.cutaway;
  (async () => { try {
    const u = new URL(url, import.meta.url).href, r = await fetch(u); if(!r.ok) throw new Error(url + " " + r.status);
    const j = await r.json(), bin = Uint8Array.from(atob(j.buffers[0].uri.split(",")[1]), ch => ch.charCodeAt(0)).buffer;
    const acc = i => { const a = j.accessors[i], v = j.bufferViews[a.bufferView]; return new TA[a.componentType](bin, (v.byteOffset || 0) + (a.byteOffset || 0), a.count * NC[a.type]); };
    const p = j.meshes[0].primitives[0], g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(acc(p.attributes.POSITION), 3));
    g.setAttribute("normal", new THREE.BufferAttribute(acc(p.attributes.NORMAL), 3));
    g.setAttribute("uv", new THREE.BufferAttribute(acc(p.attributes.TEXCOORD_0), 2));
    g.setIndex(new THREE.BufferAttribute(acc(p.indices), 1)); g.computeBoundingBox();
    { const c = g.boundingBox.getCenter(new THREE.Vector3()); g.translate(-c.x, -g.boundingBox.min.y, -c.z); g.computeBoundingBox(); }
    if(cute.a){   // 장난감처럼: 앞뒤 바퀴 사이를 줄이고 지붕 쪽을 부풀림 (감독님 "아베오는 너무 정직하네 좀 귀엽게")
      const P = g.attributes.position, hx = g.boundingBox.max.x, hy = g.boundingBox.max.y, a = cute.a * 2 * hx, belt = hy * (cute.belt || 0.55);
      for(let n = 0; n < P.count; n++){ const x = P.getX(n), ax = Math.abs(x), y = P.getY(n);
        P.setX(n, Math.sign(x) * (ax < a ? ax * cute.k : a * cute.k + ax - a));
        if(y > belt) P.setY(n, belt + (y - belt) * (cute.top || 1)); }
      P.needsUpdate = true; g.computeBoundingBox(); g.computeVertexNormals(); }
    const bb = g.boundingBox;
    const tex = await new THREE.TextureLoader().loadAsync(new URL(j.images[0].uri, u).href); tex.flipY = false; tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    const m = new THREE.Mesh(g, cut(new THREE.MeshStandardMaterial({map:tex, roughness:0.55, metalness:0.05, ...mat})));
    const sy = Hh / (bb.max.y - bb.min.y); m.scale.set(cute.a ? sy : L / (bb.max.x - bb.min.x), sy, Wd / (bb.max.z - bb.min.z));   // 귀엽게 할 땐 길이도 높이와 같은 배율 (바퀴가 둥글게)
    m.rotation.y = nose === "-j" ? PI / 2 : -PI / 2;   // 모델 +x(앞)이 -j 쪽으로
    m.position.set(X(ci), 0.02, Z(cj)); m.castShadow = true; m.receiveShadow = true; scene.add(m);
  } catch(e){ console.warn("트리포 차 못 불러옴", e); } })();
}

/* 로비 차와 같은 방식의 차 (2026-11-24 감독님 "차 2개 관두고 그냥 니가 표현하듯이 해라": 트리포·장난감 차 대신 floor3d_lobby.js carParts 모양)
   코가 +x 인 모양을 Group에 만들고 s배로 키워 주차 칸에 맞춤. kind: "hatch"(아베오) · "suv"(테슬라 모델 Y) */
function boxCar(ci, cj, nose, col, kind, dim){   // dim = 실제 크기 [길이, 폭, 높이] (칸. 유나 키 1칸 ≈ 1.28m)
  const CH = 1.2, h = v => hz(v) * CH, g = new THREE.Group(), suv = kind === "suv";
  const glass = D("#A9C3D3", "#2C3A4E"), tire = ["#1E1E1E", "#141414"], dk = ["#3A3A3C", "#2A2A2C"];
  const L = suv ? 2.4 : 2.1, Wd = suv ? 1.14 : 1.08, bH = suv ? 9 : 8, cL = suv ? 1.62 : 1.3, cx = suv ? -0.12 : -0.3, cH = suv ? 7 : 7.5;
  const put = (geo, c, x, y, z, cls = "s") => K.sm(geo, c, x, y, z, g, cls);
  put(K.rbox(L, h(bH), Wd, 0.13, 2), col, 0, h(2.5) + h(bH) / 2, 0);   // 몸통
  put(K.rbox(cL, h(cH), Wd - 0.15, 0.12, 2), glass, cx, h(2.5 + bH) + h(cH) / 2 - 0.01, 0);   // 유리 칸
  put(K.rbox(cL - 0.12, h(1.6), Wd - 0.22, 0.06, 1), suv ? D("#3E4A5C", "#1C2230") : col, cx, h(2.5 + bH + cH) - 0.01, 0);   // 지붕 (테슬라는 유리 지붕)
  [-1, 1].forEach(k => put(K.rbox(0.07, h(2.2), Wd - 0.06, 0.03, 1), dk, k * (L / 2 - 0.01), h(4.6), 0));   // 범퍼
  put(K.rbox(L - 0.55, h(1.4), Wd + 0.02, 0.03, 1), ["#4A4A4C", "#2E2E30"], 0, h(3.2), 0);   // 아랫단
  [-0.31, 0.31].forEach(k => [-1, 1].forEach(z => put(K.cyl(0.17, 0.17, 0.14, 14), tire, k * L, 0.17, z * (Wd / 2 - 0.06)).rotation.x = PI / 2));
  [-1, 1].forEach(z => put(K.rbox(0.03, 0.06, 0.18, 0), ["#FFF3C2", "#FFF3C2"], L / 2 + 0.005, h(bH - 0.5), z * (Wd / 2 - 0.2), "glow"));   // 앞등
  if(suv) put(K.rbox(0.03, 0.035, Wd - 0.2, 0), ["#E2403A", "#FF5A4A"], -L / 2 - 0.005, h(bH - 0.3), 0, "glow");   // 테슬라 뒤 빛줄
  else [-1, 1].forEach(z => put(K.rbox(0.03, 0.08, 0.14, 0), ["#E2403A", "#FF5A4A"], -L / 2 - 0.005, h(bH - 0.8), z * (Wd / 2 - 0.16), "glow"));
  const sx = dim[0] / L, sz = dim[1] / Wd, sy = dim[2] / h(2.5 + bH + cH + 1.6);
  g.scale.set(sx, sy, sz); g.rotation.y = nose === "-j" ? PI / 2 : -PI / 2; g.position.set(X(ci), 0, Z(cj)); K.root.add(g);
  const hl = dim[0] / 2, hw = dim[1] / 2; W.extraBoxes.push([X(ci) - hw, Z(cj) - hl, X(ci) + hw, Z(cj) + hl, 0.08, dim[2] * 0.6]);   // 유나 막기
}

/* 장난감 차 (2026-11-23 감독님 "지금꺼 너무 이상한데?" "크레딧 없이 해"): 층층이 쌓인 판 대신 둥근 몸통 + 방울 같은 지붕 하나.
   유리는 지붕보다 살짝 넓은 띠(옆 창)와 살짝 긴 판(앞뒤 유리)으로, 둥근 모서리 밖으로만 나오게 해서 같은 면이 겹치지 않음 */
function toyCar(ci, j0, w, L, body, nose, o = {}){
  const tire = "#2E2E34", glass = D("#3E4A60", "#1C2230"), wr = o.wr || 0.56, sgn = nose === "-j" ? -1 : 1, front = sgn > 0 ? j0 + L : j0, back = sgn > 0 ? j0 : j0 + L;
  const tg = myGeo(new THREE.CylinderGeometry(wr, wr, 0.34, 24)); tg.rotateZ(PI / 2);
  const hg = myGeo(new THREE.CylinderGeometry(wr * 0.52, wr * 0.52, 0.36, 18)); hg.rotateZ(PI / 2);
  [front - sgn * (o.wf || 1.0), back + sgn * (o.wb || 1.0)].forEach(j => [ci - w / 2 + 0.15, ci + w / 2 - 0.15].forEach(i => { K.sm(tg, tire, X(i), wr, Z(j), null, "s"); K.sm(hg, D("#F2F3F5", "#7A7E86"), X(i), wr, Z(j), null, "s"); }));
  B(ci - w / 2, j0, w, L, 26, body, 9, {r:0.3, seg:4});                                                       // 둥근 몸통 (z 9~35)
  const c0 = sgn > 0 ? j0 + (o.rear || 0.7) : j0 + (o.hood || 1.4), c1 = sgn > 0 ? j0 + L - (o.hood || 1.4) : j0 + L - (o.rear || 0.7), ch = o.ch || 34;
  B(ci - w / 2 + 0.2, c0, w - 0.4, c1 - c0, ch, body, 33, {r:0.5, seg:6});                                   // 방울 지붕
  B(ci - w / 2 + 0.12, c0 + 0.34, w - 0.24, c1 - c0 - 0.68, 17, glass, 42, {r:0.2, seg:3});                   // 옆 창 띠 (지붕보다 양옆 0.08 밖으로)
  B(ci - w / 2 + 0.42, c0 - 0.04, w - 0.84, c1 - c0 + 0.08, 18, glass, 41, {r:0.26, seg:3});                   // 앞뒤 유리 (지붕 앞뒤로 살짝 나옴)
  if(o.glassRoof) B(ci - w / 2 + 0.62, c0 + 0.62, w - 1.24, c1 - c0 - 1.24, 1.4, glass, ch + 33 - 0.9, {r:0.3, seg:3});   // 테슬라 유리 지붕
  [ci - w / 2 - 0.12, ci + w / 2 - 0.06].forEach(i => B(i, (sgn > 0 ? c1 : c0) - 0.1, 0.18, 0.2, 5, body, 37, {r:0.06}));   // 사이드미러
  [ci - w / 2 + 0.35, ci + w / 2 - 0.85].forEach(i => B(i, front - (sgn > 0 ? 0.04 : -0.04) - 0.04, 0.5, 0.08, 3, D("#FFF6DA", "#FFF1C2"), 26, {r:0.03, cls:"glass"}));   // 눈 같은 전조등
  if(o.bar) B(ci - w / 2 + 0.4, back - (sgn > 0 ? 0.04 : -0.04) - 0.04, w - 0.8, 0.08, 2.2, "#D8404A", 27, {r:0.02});   // 테슬라 뒤 빛줄
  [ci - w / 2 + 0.55, ci + w / 2 - 0.85].forEach(i => B(i, front - (sgn > 0 ? 0.04 : -0.04) - 0.04, 0.3, 0.08, 2.4, D("#F6B7C9", "#9A6A7A"), 19, {r:0.03}));   // 볼터치 (귀엽게)
}
/* =================================================================== 1층: 현관 · 필로티 주차장 · 앞마당 · 옆 정원 */
const FOY = 6.0, YJ = 17.45, SIDE = 21.4;   // 현관 i 0~6 · 주차장 i 6~16 (2층 밑 필로티) · 앞마당 j 11~17.45 · 옆 정원 i 16~21.4
function paint1(c, dark){
  const p = paintKit(c, dark), v = p.v;
  // 잔디 (집 밖 전부) · 결
  p.rect(-1, -1, 23, 19, v("#B7D69C", "#2F4430"));
  c.globalAlpha = dark ? 0.07 : 0.14; for(let k = 0; k < 2600; k++){ c.fillStyle = k % 3 ? "#FFFFFF" : "#4E7E46"; c.fillRect(-0.4 + rnd(k) * 22, -0.4 + rnd(k + 91) * 18.6, 0.05, 0.05); } c.globalAlpha = 1;
  // 보도 (길 건너 크레용타워 쪽)
  p.rect(-0.4, 17.6, 21.8, 18.2, v("#E3DDD2", "#3A3734")); p.rect(-0.4, 17.56, 21.8, 17.64, v("#BDB5A9", "#4A4642"));
  for(let i = -0.4; i < 21.8; i += 0.8) p.line(i, 17.64, i, 18.2, v("rgba(0,0,0,.08)", "rgba(255,255,255,.05)"), 0.016);
  p.text("← 크레용타워 · 횡단보도", 2.6, 17.92, 6.5, v("rgba(90,80,70,.5)", "rgba(220,210,190,.28)"));
  // 주차장 + 진입로 (콘크리트 · 주차선 · EV 칸)
  p.rect(FOY, 0, HW, HD, v("#CFCAC2", "#3A3835")); p.rect(6.6, HD, 15.6, 17.6, v("#C2BCB2", "#383532"));
  for(let j = HD + 0.5; j < 17.5; j += 0.6) p.line(6.6, j, 15.6, j, v("rgba(0,0,0,.05)", "rgba(255,255,255,.04)"), 0.012);
  c.globalAlpha = dark ? 0.06 : 0.1; for(let k = 0; k < 700; k++){ c.fillStyle = k % 2 ? "#FFFFFF" : "#6A645C"; c.fillRect(FOY + rnd(k + 3) * 10, rnd(k + 17) * HD, 0.06, 0.06); } c.globalAlpha = 1;
  [6.7, 10.5, 15.0].forEach(i => p.rect(i, 0.3, i + 0.08, 8.4, v("#FFFFFF", "#8A867E")));
  p.rr(11.0, 0.5, 14.5, 8.2, 0.1, v("rgba(114,196,174,.35)", "rgba(114,196,174,.14)")); p.text("EV", 12.75, 8.75, 12, v("#4DAA97", "#72C4AE"), 900);
  p.text("P", 8.6, 8.75, 12, v("#FFFFFF", "#9A968E"), 900);
  // 디딤돌 길 · 화단 흙 · 파라솔 그늘
  [11.5, 12.3, 13.1, 13.9, 14.7, 15.5, 16.3, 17.05].forEach((j, k) => p.rr(4.35 + (k % 2) * 0.12, j - 0.26, 5.15 + (k % 2) * 0.12, j + 0.26, 0.18, v("#E8E1D6", "#55504A")));
  p.rr(5.6, 11.3, 6.45, 17.2, 0.2, v("#8A6A4C", "#3A2C22")); p.rr(-0.2, 16.9, 3.95, 17.3, 0.2, v("#8A6A4C", "#3A2C22")); p.rr(15.8, 16.9, 21.2, 17.3, 0.2, v("#8A6A4C", "#3A2C22"));
  p.rr(17.3, 13.1, 19.5, 14.9, 1.0, v("rgba(255,255,255,.18)", "rgba(0,0,0,.12)"));
  p.rr(5.55, 13.6, 6.5, 15.2, 0.2, v("#6FB06A", "#2E4A30")); [[5.3, 14.1], [6.05, 14.6], [6.8, 14.15]].forEach(([i, j]) => p.rr(i - 0.32, j - 0.24, i + 0.32, j + 0.24, 0.18, v("#E8E1D6", "#55504A")));   // 화단 사이 디딤돌 (옆 마당 가는 길)
  // 옆 정원 데크
  p.deck(16.3, 0.55, 21.2, 4.8, "i");
  // 현관: 밝은 돌 타일 · 들어오는 곳 · 동그란 매트
  p.check(0, 0, FOY, HD, 0.6, v("#F3EEE8", "#3E3934"), v("#EDE5DE", "#433D37"));
  p.rect(3.6, 9.8, FOY, HD, v("#D8D2C8", "#3C3833")); for(let i = 3.6; i < FOY; i += 0.36) p.line(i, 9.8, i, HD, v("rgba(0,0,0,.06)", "rgba(255,255,255,.05)"));
  p.line(3.6, 9.8, FOY, 9.8, v("rgba(0,0,0,.14)", "rgba(0,0,0,.4)"), 0.04);
  c.fillStyle = v("#C8B4D0", "#5E4E68"); c.beginPath(); c.ellipse(3.5, 4.0, 1.4, 1.1, 0, 0, 7); c.fill();
  c.fillStyle = v("#F7DCE6", "#6A4E5A"); c.beginPath(); c.ellipse(3.5, 4.0, 1.25, 0.95, 0, 0, 7); c.fill();
  p.text("WELCOME HOME", 3.5, 3.85, 6, v("#B5607E", "#F4C7D4")); p.text("♡ 유나 · 엄마 · 아빠 ♡", 3.5, 4.25, 4.6, v("#9A7AA8", "#D9C6E6"));
  p.rr(4.05, 11.12, 5.35, 11.62, 0.08, v("#C8B4D0", "#5E4E68")); p.text("WELCOME", 4.7, 11.37, 5.5, v("#FFFFFF", "#E2D6EA"));
  p.arrow("▲ 2층", 0.65, 8.95);
  p.glow(3.4, 4.6, 1.6, v("rgba(255,250,235,.3)", "rgba(255,200,150,.2)")); p.glow(18.6, 1.6, 1.6, v("rgba(255,250,235,.2)", "rgba(255,200,130,.22)"));
}
function build1(){
  const fp = D("#FBF3EE", "#4A403B"), con = D("#E4E0DA", "#3E3C39");
  backWalls([[0, FOY, fp], [FOY, HW, con]], [[0, HD, fp]]);
  // 주차장 뒷벽: 노출 콘크리트 (거푸집 구멍) · 벽등 둘 · 테슬라 충전기 · 캠핑 수납장
  K.decal(480, 300, (c, w, h, dark) => { c.fillStyle = dark ? "#3E3C39" : "#E4E0DA"; c.fillRect(0, 0, w, h); c.strokeStyle = dark ? "rgba(0,0,0,.25)" : "rgba(120,110,100,.18)"; c.lineWidth = 1.2;
    for(let x = 0; x <= w; x += w / 8){ c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); } for(let y = 0; y <= h; y += h / 4){ c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    c.fillStyle = dark ? "rgba(0,0,0,.35)" : "rgba(110,100,90,.3)"; for(let x = w / 16; x < w; x += w / 8) for(let y = h / 8; y < h; y += h / 4){ c.beginPath(); c.arc(x - w / 40, y, 2.2, 0, 7); c.arc(x + w / 40, y, 2.2, 0, 7); c.fill(); } },
    9.6, hz(TALL - 4), "i", 11.0, 0.0, hz((TALL - 4) / 2));
  [8.6, 13.0].forEach(i => { B(i - 0.12, 0.03, 0.24, 0.1, 6, INK, 72, {r:0.02, cls:"s"}); ball(i, 0.16, 71, 0.07, D("#FFF3D6", "#FFD9A0"), "glow", 10); });
  B(14.6, 0.03, 0.42, 0.14, 18, WHITE, 40, {r:0.04, cls:"s"}); B(14.72, 0.17, 0.18, 0.02, 3, "#4DAA97", 53, {r:0, cls:"glow"}); K.wtext("⚡", 14.81, 0.19, 47, "i", 4, "#4DAA97", null, 800);
  rod([14.81, 0.12, 40], [14.81, 0.25, 6], 0.02, INK, "s", 6); rod([14.81, 0.25, 6], [14.2, 0.55, 2], 0.02, INK, "s", 6); rod([14.2, 0.55, 2], [13.9, 0.75, 26], 0.02, INK, "s", 6);
  B(6.15, 0.2, 0.55, 1.65, 56, WHITE, 0, {r:0.02}); [0.75, 1.3].forEach(j => K.faceI(6.7, j - 0.005, j + 0.005, 3, 54, D("#E6DCE2", "#5A524E"), "s", 0.012));
  [[0.45, 58, "#A8DCC8"], [1.05, 58, "#F6E39A"], [1.55, 58, "#F4C7D4"]].forEach(([j, z, cc]) => B(6.2, j - 0.22, 0.45, 0.44, 9, D(cc, "#5A5650"), z, {r:0.04}));
  // 필로티 기둥 (2층을 받침)
  [[15.72, 10.72], [15.72, 5.3]].forEach(([i, j]) => { B(i, j, 0.28, 0.28, TALL, D("#F3E9E4", "#4A403C"), 0, {r:0.02}); B(i - 0.02, j - 0.02, 0.32, 0.32, 3, CAPC, TALL, {r:0}); });
  // 차 두 대: 아베오(머리를 벽 쪽) · 테슬라 모델Y(충전 중이라 뒤를 벽 쪽)
  boxCar(8.6, 3.9, "-j", D("#3D6FD6", "#2A4C96"), "hatch", [3.16, 1.36, 1.19]);   // 아베오 해치백 4.04×1.74×1.52m   // 2026-11-24 감독님 "니가 표현하듯이" → 로비 차 방식
  // 테슬라 모델 Y L (6인승, 실제 4976×1920×1668mm). 은색
  boxCar(12.75, 3.95, "+j", D("#C3C8CE", "#7E838A"), "suv", [3.89, 1.5, 1.3]);   // 테슬라 모델 Y 4.98×1.92×1.67m   // 2026-11-24 감독님 "니가 표현하듯이" → 로비 차 방식
  // 계단 (A: 위로 갈수록 −j) + 난간 + 계단 벽 가족 그림
  flight(SA, -1); stairRail(1.36, -1);
  [[7.8, 57, "#F4C7D4"], [7.15, 77, "#A9CBEA"], [6.5, 97, "#F6E39A"]].forEach(([j, z, bg], k) => { K.faceI(0.012, j - 0.35, j + 0.35, z - 12, z + 12, WHITE, "m", 0.03);
    K.decal(100, 100, (c, w, h) => { c.fillStyle = bg; c.fillRect(0, 0, w, h); c.fillStyle = "#F0D2BC"; c.beginPath(); c.arc(w / 2, h * 0.48, w * 0.2, 0, 7); c.fill();
      c.fillStyle = ["#2A2420", "#3A2A20", "#4A3226"][k]; c.beginPath(); c.arc(w / 2, h * 0.4, w * 0.21, PI, 0); c.fill();
      if(k === 2){ c.beginPath(); c.arc(w * 0.28, h * 0.42, w * 0.07, 0, 7); c.arc(w * 0.72, h * 0.42, w * 0.07, 0, 7); c.fill(); }
      c.fillStyle = "#2A2A28"; c.font = "700 14px system-ui"; c.textAlign = "center"; c.fillText(["아빠", "엄마", "유나"][k], w / 2, h * 0.9); }, 0.6, hz(20), "j", 0.03, j, hz(z)); });
  // 계단 밑 수납장 (알록달록 문 셋)
  B(1.42, SJ0 + 0.12, 1.06, SJ1 - SJ0 - 0.24, 22, WHITE, 0, {r:0.02});
  [[5.18, 6.18, "#F4C7D4"], [6.2, 7.2, "#E2D6EA"], [7.22, 8.22, "#FCE9B8"]].forEach(([a, b, cc]) => { K.faceI(2.48, a, b, 2, 20, D(cc, "#5A4E56"), "m", 0.012); ball(2.505, (a + b) / 2, 11, 0.03, GOLD, "s", 8); });
  // 가족 그림 액자 (왼벽) + 콘솔 · 꽃병
  B(0.05, 1.1, 0.42, 1.6, 26, WHITE, 0, {r:0.02}); flowerPot(0.27, 2.35, "#F4A7B9", 0.55, LILAC2, 26); B(0.15, 1.3, 0.2, 0.3, 4, GOLD, 26, {r:0.02});
  K.faceI(0.012, 1.05, 2.75, 42, 88, WHITE, "m", 0.03);
  K.decal(220, 150, (c, w, h) => { c.fillStyle = "#FFF8EE"; c.fillRect(0, 0, w, h); c.strokeStyle = "#F4C7D4"; c.lineWidth = 6; c.strokeRect(8, 8, w - 16, h - 16);
    c.fillStyle = "#A8DCC8"; c.fillRect(14, h * 0.72, w - 28, h * 0.2);
    c.fillStyle = "#F4A7B9"; c.beginPath(); c.moveTo(w * 0.62, h * 0.38); c.lineTo(w * 0.78, h * 0.2); c.lineTo(w * 0.94, h * 0.38); c.fill(); c.fillStyle = "#FFFFFF"; c.fillRect(w * 0.65, h * 0.38, w * 0.26, h * 0.34); c.fillStyle = "#C8B4D0"; c.fillRect(w * 0.75, h * 0.52, w * 0.06, h * 0.2);
    [[0.18, 0.4, 13, "#2A2420"], [0.33, 0.43, 12, "#3A2A20"], [0.46, 0.55, 9, "#4A3226"]].forEach(([x, y, r, hair]) => { c.fillStyle = "#F0D2BC"; c.beginPath(); c.arc(w * x, h * y, r, 0, 7); c.fill(); c.fillStyle = hair; c.beginPath(); c.arc(w * x, h * y - 2, r * 1.02, PI, 0); c.fill();
      c.fillStyle = ["#5E9BEA", "#F06BA8", "#FFD43B"][[0.18, 0.33, 0.46].indexOf(x)]; c.fillRect(w * x - r, h * y + r, r * 2, r * 2); });
    c.fillStyle = "#2A2A28"; c.font = "800 15px system-ui"; c.textAlign = "center"; c.fillText("우리 가족 ♥", w * 0.33, h * 0.16); }, 1.6, hz(42), "j", 0.03, 1.9, hz(65));
  // 벤치 · 옷걸이 (노란 우비 · 분홍 가방 · 모자) · 큰 거울
  B(2.15, 0.12, 1.65, 0.45, 14, WOOD, 0, {r:0.03}); B(2.2, 0.16, 1.55, 0.37, 1.6, PINK2, 14, {r:0.05});
  [2.45, 2.95, 3.45].forEach(i => rod([i, 0.0, 62], [i, 0.14, 63], 0.012, GOLD, "s", 6));
  B(2.28, 0.04, 0.36, 0.1, 22, D("#FFD43B", "#9A8030"), 40, {r:0.04}); ball(2.46, 0.1, 61, 0.08, D("#FFD43B", "#9A8030"), "m", 10);
  B(2.8, 0.04, 0.32, 0.16, 14, PINK, 46, {r:0.05}); K.wtext("♥", 2.96, 0.205, 53, "i", 4, "#FFFFFF", null, 800);
  disc(3.45, 0.12, 0.16, 60, 1.2, D("#F6E39A", "#8A7A3A"), "m", 16); K.sm(myGeo(new THREE.SphereGeometry(0.1, 12, 6, 0, PI * 2, 0, PI / 2)), D("#F6E39A", "#8A7A3A"), X(3.45), hz(61), Z(0.12), null, "m");
  B(4.25, 0.03, 0.7, 0.06, 74, GOLD, 0, {r:0.02, cls:"s"}); K.faceJ(4.31, 4.89, 0.09, 4, 70, D("#E6EEF4", "#5A6470"), "s", 0.006);
  K.plant(0.45, 0.45, true); K.plant(5.5, 0.5, false);
  // 구름 조명 (예운옥)
  rod([3.4, 4.6, TALL], [3.4, 4.6, 88], 0.006, "metal");
  [[0, 0, 0.2], [-0.2, 0.05, 0.15], [0.21, 0.03, 0.16], [0.08, -0.12, 0.13], [-0.06, 0.12, 0.13]].forEach(([di, dj, r]) => ball(3.4 + di, 4.6 + dj, 84, r, D("#FFFFFF", "#FFE8F4"), "glow", 12));
  // 우산 꽂이 · 신발장 (칸막이 앞) · 신발 · 현관문 (안쪽으로 열림) · 문틀 · 문패 · 현관등
  shift(-0.15, 3.0, () => {
  K.sm(K.cyl(0.12, 0.12, hz(16), 14), LILAC, X(3.85), hz(8), Z(7.35), null, "m");
  [["#F06BA8", -0.04], ["#FFD43B", 0.04]].forEach(([cc, d]) => { rod([3.85 + d, 7.35, 4], [3.85 + d * 2, 7.35, 30], 0.012, cc, "m", 6); ball(3.85 + d * 2, 7.35, 31, 0.025, INK, "s", 6); });
  });
  B(5.38, 6.6, 0.48, 2.9, 70, WHITE, 0, {r:0.02}); [7.55, 8.5].forEach(j => K.faceI(5.368, j - 0.006, j + 0.006, 3, 68, D("#E6DCE2", "#5A524E"), "s", 0.012));
  [7.35, 7.75, 8.3, 8.7].forEach(j => B(5.35, j - 0.02, 0.02, 0.04, 8, GOLD, 32, {r:0, cls:"s"}));
  shift(0, 2.0, () => {
  [[4.15, 8.5, "#2A2A28"], [4.45, 8.55, "#F06BA8"], [4.75, 8.48, "#E8A04A"], [5.05, 8.55, "#F4A7B9"]].forEach(([i, j, c]) => { B(i, j, 0.1, 0.22, 2, c, 0, {r:0.03}); B(i + 0.12, j + 0.02, 0.1, 0.22, 2, c, 0, {r:0.03}); });
  B(3.92, 8.86, 0.09, 0.28, 72, WHITE, 0, {r:0, cls:"s"}); B(5.39, 8.86, 0.09, 0.28, 72, WHITE, 0, {r:0, cls:"s"}); B(3.92, 8.87, 1.56, 0.26, 4, WHITE, 68, {r:0, cls:"s"});
  B(5.31, 7.92, 0.07, 0.93, 66, D("#E8A2BC", "#7A5866"), 0, {r:0.01}); K.faceI(5.38, 8.1, 8.7, 34, 58, D("#DDE8F2", "#5A6470"), "glass", 0.012);
  ball(5.42, 8.0, 32, 0.03, GOLD, "s", 8);
  B(4.05, 8.97, 1.3, 0.06, 10, PINK, 72, {r:0.02}); K.wtext("크레용네 🖍️", 4.7, 9.035, 77, "i", 3.4, "#FFFFFF", null, 800, K.FONT);
  rod([3.72, 9.12, 52], [3.72, 9.3, 52], 0.012, INK); ball(3.72, 9.32, 50, 0.07, D("#FFF3D6", "#FFD9A0"), "glow", 10);
  });
  // 벽: 앞(j 11, 문 i 4.0~5.4) · 현관/주차장 칸막이(i 6, 유리문 j 2.0~3.2)
  const fw = D("#F7EEF0", "#4A4044");
  wallI(0, 3.92, HD, fw); wallI(5.48, FOY + T / 2, HD, fw);
  wallJ(0, 2.0, FOY, fw); wallJ(3.2, HD - T / 2, FOY, fw); doorFrameJ(2.0, 3.2, FOY);
  // 옆 정원 데크: 라탄 소파 · 낮은 탁자 · 바비큐 그릴 · 아기 수영장 · 비치볼 · 분필 이젤 · 화분
  shift(10.85, 0.45, () => {
  const rat = D("#C9A27A", "#6B4E38"), ratd = D("#A98258", "#4E3C2C");
  B(6.55, 0.35, 2.9, 0.8, 10, rat, 0, {r:0.05}); B(6.55, 0.12, 2.9, 0.24, 24, ratd, 0, {r:0.05}); B(6.33, 0.12, 0.22, 1.03, 17, ratd, 0, {r:0.05}); B(9.45, 0.12, 0.22, 1.03, 17, ratd, 0, {r:0.05});
  [6.62, 7.6, 8.58].forEach(i => B(i, 0.4, 0.92, 0.7, 2.4, D("#FFFFFF", "#8A847C"), 10, {r:0.05}));
  [[6.85, PINK, 0.12], [8.0, D("#A8DCC8", "#4E7A6E"), -0.1], [9.0, LILAC, 0.1]].forEach(([i, cc, rz]) => { const o = B(i, 0.38, 0.5, 0.14, 12, cc, 12.4, {r:0.06}); o.rotation.z = rz; });
  B(7.35, 1.65, 1.3, 0.62, 10, WOOD, 0, {r:0.04}); [[7.6, 1.95, "#F6E39A"], [7.85, 1.85, "#F4A7B9"]].forEach(([i, j, cc]) => K.sm(K.cyl(0.05, 0.05, hz(7), 10), D(cc, "#7A6A50"), X(i), hz(13.5), Z(j), null, "glass"));
  });
  shift(10.85, 0.45, () => {
  disc(8.3, 1.95, 0.16, 10, 1.2, WHITE, "s", 16); [[-0.05, 0], [0.05, 0.04], [0, -0.06]].forEach(([di, dj], k) => ball(8.3 + di, 1.95 + dj, 12, 0.05, ["#E06A55", "#F6E39A", "#72C4AE"][k], "m", 8));
  });
  { const gi = 20.55, gj = 3.6, bk = D("#2A2A2C", "#1A1A1C"); [0, 2.1, 4.2].forEach(a => rod([gi + Math.cos(a) * 0.28, gj + Math.sin(a) * 0.28, 0], [gi + Math.cos(a) * 0.1, gj + Math.sin(a) * 0.1, 22], 0.016, INK, "s", 6));
    const bowl = K.sm(myGeo(new THREE.SphereGeometry(0.32, 18, 8, 0, PI * 2, PI / 2, PI / 2)), bk, X(gi), hz(30), Z(gj), null, "s");
    const lid = K.sm(myGeo(new THREE.SphereGeometry(0.325, 18, 8, 0, PI * 2, 0, PI / 2)), bk, X(gi), hz(31), Z(gj), null, "s"); lid.scale.y = 0.8;
    ball(gi, gj, 40, 0.04, "#C9CDD2", "s", 8); disc(gi, gj, 0.33, 30, 1, "#55555A", "s", 22); }
  { const pi = 18.4, pj = 6.9; const ring = K.sm(myGeo(new THREE.TorusGeometry(0.86, 0.15, 10, 28)), PINK, X(pi), hz(4.5), Z(pj), null, "m"); ring.rotation.x = PI / 2;
    const ring2 = K.sm(myGeo(new THREE.TorusGeometry(0.86, 0.1, 8, 28)), D("#F6E39A", "#8A7A3A"), X(pi), hz(9.2), Z(pj), null, "m"); ring2.rotation.x = PI / 2;
    disc(pi, pj, 0.78, 0, 5.5, D("#BFE3F2", "#4A6A88"), "glass", 30);
    ball(pi + 0.25, pj - 0.1, 6.5, 0.08, "#FFD43B", "s", 12); ball(pi + 0.25, pj - 0.17, 9.4, 0.05, "#FFD43B", "s", 10); ball(pi + 0.25, pj - 0.22, 9, 0.02, "#F28C28", "s", 6);
    const bb = ball(20.4, 7.6, 7, 0.22, "#FFFFFF", "m", 16); [["#F25F5C", 0], ["#5E9BEA", 2.1], ["#FFE066", 4.2]].forEach(([cc, a]) => { const s2 = K.sm(myGeo(new THREE.SphereGeometry(0.223, 16, 10, a, 0.7)), cc, X(20.4), hz(7), Z(7.6), null, "m"); }); }
  { const ei = 16.95, ej = 9.5, fr = WOOD; rod([ei - 0.3, ej + 0.2, 0], [ei, ej, 50], 0.018, fr); rod([ei + 0.3, ej + 0.2, 0], [ei, ej, 50], 0.018, fr); rod([ei, ej - 0.3, 0], [ei, ej, 50], 0.018, fr);
    B(ei - 0.4, ej + 0.08, 0.8, 0.04, 26, D("#33403A", "#1E2622"), 16, {r:0.01});
    K.decal(160, 104, (c, w, h) => { c.strokeStyle = "#FFFFFF"; c.lineWidth = 3; c.beginPath(); c.arc(w * 0.3, h * 0.45, 16, 0, 7); c.stroke(); RB.forEach((col, k) => { c.strokeStyle = col; c.lineWidth = 4; c.beginPath(); c.arc(w * 0.68, h * 0.95, w * (0.26 - k * 0.03), PI, 0); c.stroke(); });
      c.fillStyle = "#FFFFFF"; c.font = "700 15px system-ui"; c.fillText("유나 ♥", 10, h * 0.9); }, 0.74, hz(23), "i", ei, ej + 0.12, hz(29)); }
  [[16.55, 4.55, "#F4A7B9"], [21.0, 0.8, "#F6E39A"], [21.0, 5.2, "#C8B4D0"], [16.6, 0.8, "#F4A7B9"]].forEach(([i, j, cc], k) => flowerPot(i, j, cc, 1, k % 2 ? PINK : WHITE));
  // 잔디마당: 울타리 · 아치 대문 · 우편함 · 나무 · 화단 · 파라솔 · 그네 · 유나 자전거 · 산울타리
  const fence = (a, b, fixed, axis) => { const n = Math.round((b - a) / 0.42);
    for(let k = 0; k <= n; k++){ const u = a + (b - a) * k / n; if(axis === "i") B(u - 0.03, fixed - 0.03, 0.06, 0.06, 20, WHITE, 0, {r:0.01}); else B(fixed - 0.03, u - 0.03, 0.06, 0.06, 20, WHITE, 0, {r:0.01}); }
    [6, 15].forEach(z => axis === "i" ? B(a, fixed - 0.015, b - a, 0.03, 1.6, WHITE, z, {r:0}) : B(fixed - 0.015, a, 0.03, b - a, 1.6, WHITE, z, {r:0})); };
  fence(-0.3, 3.95, YJ, "i"); fence(5.6, 6.6, YJ, "i"); fence(15.6, SIDE, YJ, "i"); fence(0.3, YJ - 0.05, SIDE, "j"); fence(HD + 0.2, YJ - 0.05, -0.3, "j");
  [6.6, 15.6].forEach(i => B(i - 0.08, YJ - 0.08, 0.16, 0.16, 26, WHITE, 0, {r:0.02}));
  shift(0.07, YJ - 13.9, () => {
  [3.95, 5.45].forEach(i => B(i - 0.05, 13.85, 0.1, 0.1, 62, PINK, 0, {r:0.02}));
  { K.sm(myGeo(new THREE.TorusGeometry(0.75, 0.05, 8, 28, PI)), PINK, X(4.7), hz(62), Z(13.9), null, "m");
    [0.3, 0.9, 1.5, 2.2, 2.8].forEach((t, k) => ball(4.7 + Math.cos(t) * 0.75, 13.9, 62 + Math.sin(t) * 0.75 * 31.1, 0.07, RB[k], "m", 8));
    B(4.25, 13.86, 0.9, 0.06, 9, WHITE, 64, {r:0.02}); K.wtext("유나네 🏡", 4.7, 13.92, 68.5, "i", 3.6, D("#B5607E", "#F4C7D4"), null, 800, K.FONT); }
  B(3.28, 13.45, 0.06, 0.06, 26, WOODD, 0, {r:0, cls:"s"}); B(3.1, 13.32, 0.42, 0.32, 10, PINK, 26, {r:0.08}); B(3.5, 13.35, 0.02, 0.05, 8, "#E06A55", 32, {r:0, cls:"s"});
  K.wtext("YUNA ♥", 3.31, 13.645, 31, "i", 2.2, "#FFFFFF", null, 800);
  });
  tree(20.4, 12.2, 1.0); tree(1.0, 13.4, 0.8); tree(20.6, 16.3, 0.7);
  for(let i = 0.1, k = 0; i < 3.8; i += 0.42, k++) flowerStem(i, 17.1 + (k % 2 ? 0.08 : -0.06), RB[k % RB.length], 14 + (k % 3) * 3);
  for(let i = 16.0, k = 0; i < 21.1; i += 0.42, k++) flowerStem(i, 17.1 + (k % 2 ? 0.08 : -0.06), RB[(k + 2) % RB.length], 14 + (k % 3) * 3);
  for(let j = 11.6, k = 0; j < 17.1; j += 0.42, k++) if(j < 13.5 || j > 15.3) flowerStem(6.02 + (k % 2 ? 0.1 : -0.1), j, RB[(k + 4) % RB.length], 13 + (k % 3) * 3);   // 가운데는 비움: 대문 쪽 잔디에서 옆 마당으로 바로 (2026-11-24 감독님 "마당도 갈수있게")
  for(let i = 16.4; i < 21.2; i += 0.36) ball(i, 0.2, 9, 0.24, K.sh("plant", (i * 7 % 3) * 0.06), "m", 10);
  B(16.25, 0.02, 5.0, 0.36, 8, K.sh("plant", -0.12), 0, {r:0.08});
  shift(8.4, 2.8, () => {
  disc(10.0, 11.4, 0.45, 20, 1.5, WHITE, "s", 28); K.sm(K.cyl(0.04, 0.04, hz(20), 8), INK, X(10.0), hz(10), Z(11.4), null, "s"); disc(10.0, 11.4, 0.22, 0, 0.8, INK, "s");
  rod([10.0, 11.4, 21], [10.0, 11.4, 70], 0.022, WHITE);
  { K.sm(myGeo(new THREE.ConeGeometry(1.05, hz(16), 12, 1, true)), PINK, X(10.0), hz(76), Z(11.4), null, "m");
    const cone2 = myGeo(new THREE.ConeGeometry(1.06, hz(16), 12, 1, true, 0, PI / 6)); [0, 2, 4, 6, 8, 10].forEach(k => { const o = K.sm(cone2, WHITE, X(10.0), hz(76) + 0.004, Z(11.4), null, "m"); o.rotation.y = k * PI / 6; });
    ball(10.0, 11.4, 85, 0.06, WHITE, "s", 8); }
  chair(9.35, 11.4, "+i", WHITE, PINK2); chair(10.65, 11.4, "-i", WHITE, LILAC2);
  });
  shift(6.6, -1.6, () => {
  { const si = 13.0, sj = 11.1, fr = D("#FFFFFF", "#8A847C");
    [-0.75, 0.75].forEach(d => { rod([si + d, sj - 0.45, 0], [si + d, sj, 66], 0.035, fr); rod([si + d, sj + 0.45, 0], [si + d, sj, 66], 0.035, fr); });
    rod([si - 0.8, sj, 66], [si + 0.8, sj, 66], 0.04, PINK);
    [-0.25, 0.25].forEach(d => rod([si + d, sj, 65], [si + d, sj, 12], 0.008, D("#E9D2B0", "#6A5A48"), "m", 5));
    B(si - 0.32, sj - 0.15, 0.64, 0.3, 2, LILAC, 10.5, {r:0.04}); }
  });
  // 유나 자전거는 탈 수 있게 움직이는 것으로 (buildBike, 2026-11-24)
}
/* =================================================================== 2층: 부엌(거실을 보는 아일랜드 + 고기 불판 식탁) · 거실 · 게스트 화장실 */
const GI = 6.85, GJ = 5.4;   // 불판 가운데 (아일랜드 끝에 붙인 식탁)
function paint2(c, dark){
  const p = paintKit(c, dark), v = p.v;
  p.wood(-1, -1, 18, 13);
  // 부엌 타일 · 아일랜드 앞 매트
  p.check(0, 0, 8.6, SJ0, 0.46, v("#F6F1EA", "#3E3934"), v("#EDE3EE", "#463E48"));
  p.rr(5.55, 1.2, 6.25, 3.7, 0.12, v("#E8B5C8", "#6A4E5A"));
  pshift(c, 3.6, 1.0, () => {
  p.rr(6.6, 2.2, 11.5, 6.75, 0.5, v("#C8B4D0", "#5E4E68")); p.rr(6.75, 2.35, 11.35, 6.6, 0.42, v("#F7DCE6", "#6A4E5A"));
  RB.forEach((col, k) => p.rect(6.95 + k * 0.12, 2.6, 7.03 + k * 0.12, 6.35, col));
  for(let k = 0; k < 40; k++){ c.fillStyle = v("rgba(255,255,255,.5)", "rgba(255,255,255,.08)"); c.beginPath(); c.arc(7.9 + rnd(k) * 3.2, 2.6 + rnd(k + 40) * 3.8, 0.035, 0, 7); c.fill(); }
  });
  p.rr(9.4, 9.0, 13.2, 10.3, 0.5, v("#E2D6EA", "#4E4458"));
  // 게스트 화장실 타일 · 발매트
  pshift(c, 0, 2.0, () => {
  p.check(2.8, 5.7, 4.5, HD, 0.34, v("#F4F6F8", "#3A3E44"), v("#E7E0EF", "#45404E"));
  p.rr(3.3, 7.3, 4.0, 7.8, 0.12, v("#A8DCC8", "#4E7A6E"));
  });
  p.arrow("▼ 1층", 0.65, 4.65); p.arrow("▲ 3층", 1.95, 4.65);
  p.glow(GI, GJ, 1.8, v("rgba(255,250,235,.4)", "rgba(255,200,130,.2)")); p.glow(15.05, 7.4, 1.2, v("rgba(255,250,235,.3)", "rgba(255,200,130,.18)"));
}
function build2(){
  const wp = D("#FBEFF3", "#4A3A41"), wk = D("#FFFFFF", "#45403B"), wl = D("#F7F1F4", "#3E3539");
  backWalls([[0, 8.6, wk], [8.6, HW, wp]], [[0, SJ0, wk], [SJ0, HD, wl]]);
  slabHole(SA, "n"); flight(SB, 1); stairRail(1.29, 1);
  glassRail(0.08, 1.22, SJ1 + 0.05, "i"); K.plant(0.65, 9.6, false);
  // 부엌 뒷벽 타일 · 창
  K.decal(560, 70, (c, w, h, dark) => { c.strokeStyle = dark ? "rgba(0,0,0,.3)" : "rgba(160,130,160,.25)"; c.lineWidth = 1.4;
    for(let y = 0; y <= h; y += h / 3){ c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    for(let r = 0; r < 3; r++) for(let x = (r % 2) * 14; x < w; x += 28){ c.beginPath(); c.moveTo(x, r * h / 3); c.lineTo(x, (r + 1) * h / 3); c.stroke(); } }, 4.5, hz(15), "i", 3.45, 0.0, hz(40.5));
  winJ(1.35, 2.75, 50, 92);
  // 부엌: 냉장고 · 아래장 · 상판 · 개수대 · 쿡탑 · 위장
  B(0.1, 0.06, 1.0, 0.74, 88, D("#F2C9D6", "#7A5866"), 0, {r:0.06});
  K.faceJ(0.16, 1.04, 0.8, 52.5, 53.5, K.sh("#F2C9D6", -0.18), "s", 0.006);
  rod([0.95, 0.83, 58], [0.95, 0.83, 78], 0.016, "#E9E4DA"); rod([0.95, 0.83, 24], [0.95, 0.83, 46], 0.016, "#E9E4DA");
  [[0.3, 70, "#F6E39A"], [0.55, 64, "#A8DCC8"], [0.42, 36, "#F4A7B9"]].forEach(([i, z, c]) => ball(i, 0.82, z, 0.045, c, "s", 8));
  K.decal(90, 110, (c, w, h) => { c.fillStyle = "#FFFFFF"; c.fillRect(0, 0, w, h); c.strokeStyle = "#F06BA8"; c.lineWidth = 4; c.beginPath(); c.arc(w * 0.5, h * 0.42, w * 0.22, 0, 7); c.stroke();
    c.fillStyle = "#2A2A28"; c.beginPath(); c.arc(w * 0.42, h * 0.4, 3, 0, 7); c.arc(w * 0.58, h * 0.4, 3, 0, 7); c.fill(); c.font = "700 13px system-ui"; c.textAlign = "center"; c.fillText("우리 아빠", w / 2, h * 0.86); }, 0.32, 0.4, "i", 0.68, 0.8, hz(62));
  const cab = D("#E6DAEC", "#5A4E62");
  B(1.18, 0.03, 4.54, 0.6, 29, cab, 0, {r:0.015});
  [2.3, 3.4, 4.55].forEach(i => K.faceJ(i - 0.006, i + 0.006, 0.63, 2, 27, K.sh(cab, -0.14), "s", 0.004));
  [1.75, 2.85, 3.95, 5.1].forEach(i => B(i - 0.12, 0.63, 0.24, 0.03, 1, GOLD, 24, {r:0, cls:"s"}));
  B(1.15, 0.02, 4.6, 0.7, 2.4, D("#FFFCF8", "#B9B1A6"), 29, {r:0.01});
  B(1.55, 0.14, 0.8, 0.42, 0.6, "#B9BEC4", 31.4, {r:0.02, cls:"s"}); rod([1.95, 0.1, 32], [1.95, 0.1, 42], 0.016, "#D2D6DA"); rod([1.95, 0.1, 42], [1.95, 0.3, 40], 0.013, "#D2D6DA");
  B(3.85, 0.12, 1.05, 0.5, 0.5, "#1C1C1E", 31.4, {r:0, cls:"s"});
  [[4.12, 0.25], [4.62, 0.25], [4.12, 0.5], [4.62, 0.5]].forEach(([i, j]) => disc(i, j, 0.09, 31.9, 0.2, "#3A3A3E", "s", 16));
  B(3.98, 0.22, 0.32, 0.32, 5, "#C9CDD2", 32.2, {r:0.05, cls:"s"});
  B(2.6, 0.2, 0.36, 0.3, 0.8, WOOD, 31.4, {r:0.02}); [[2.68, "#F4A7B9"], [2.83, "#FFE066"]].forEach(([i, c]) => ball(i, 0.35, 33.5, 0.05, c, "m", 8));
  B(5.15, 0.15, 0.4, 0.4, 9, D("#F4C7D4", "#7A5866"), 31.4, {r:0.04, cls:"s"}); B(5.25, 0.2, 0.2, 0.2, 2, INK, 40.4, {r:0.02, cls:"s"});
  B(2.95, 0.02, 2.75, 0.36, 30, cab, 70, {r:0.015}); K.faceJ(4.32 - 0.006, 4.32 + 0.006, 0.38, 72, 98, K.sh(cab, -0.14), "s", 0.004);
  [3.6, 5.05].forEach(i => B(i - 0.1, 0.38, 0.2, 0.025, 1, GOLD, 74, {r:0, cls:"s"}));
  B(3.9, 0.08, 1.0, 0.5, 6, D("#F4EEF6", "#6A6070"), 63, {r:0.03, cls:"s"});
  // 왼벽 선반 · 칠판 (오늘 저녁 삼겹살)
  [62, 80].forEach(z => B(0.012, 1.3, 0.34, 1.5, 1.6, WOOD, z, {r:0.01}));
  [[1.42, "#FFFFFF"], [1.62, "#F4A7B9"], [1.82, "#FFFFFF"]].forEach(([j, c]) => B(0.07, j - 0.08, 0.2, 0.16, 6, c, 63.6, {r:0.04}));
  [[2.15, "#E8A04A"], [2.4, "#A8DCC8"], [2.62, "#C8B4D0"]].forEach(([j, c]) => K.sm(K.cyl(0.07, 0.07, hz(9), 12), c, X(0.18), hz(81.6 + 4.5), Z(j), null, "s"));
  K.decal(300, 170, (c, w, h, dark) => { c.fillStyle = dark ? "#1E2622" : "#33403A"; c.fillRect(0, 0, w, h); c.strokeStyle = "#C9A77F"; c.lineWidth = 12; c.strokeRect(0, 0, w, h);
    c.fillStyle = "#FFFFFF"; c.textAlign = "center"; c.font = "800 26px 'IBM Plex Sans KR', system-ui"; c.fillText("오늘 저녁 🥩", w / 2, h * 0.36);
    c.font = "700 21px 'IBM Plex Sans KR', system-ui"; c.fillStyle = "#F4C7D4"; c.fillText("우리 집 삼겹살 파티!", w / 2, h * 0.62); c.fillStyle = "#F6E39A"; c.fillText("♥ 유나 · 엄마 · 아빠 ♥", w / 2, h * 0.84); }, 1.5, hz(26), "j", 0.012, 2.05, hz(45));
  // 아일랜드 (거실을 보고 요리: 서는 자리 i 5.9, 보는 쪽 +i) · 과일 · 도마 · 펜던트 둘
  const isl = D("#E6DAEC", "#5A4E62");
  B(6.4, 0.9, 0.9, 3.1, 29, isl, 0, {r:0.02}); B(6.36, 0.86, 0.98, 3.18, 2.4, D("#FFFCF8", "#B9B1A6"), 29, {r:0.015});
  [1.65, 2.45, 3.25].forEach(j => K.faceI(6.388, j - 0.006, j + 0.006, 2, 27, K.sh(isl, -0.14), "s", 0.012));
  [1.25, 2.05, 2.85, 3.65].forEach(j => B(6.37, j - 0.12, 0.03, 0.24, 1, GOLD, 24, {r:0, cls:"s"}));
  K.faceI(7.3, 1.0, 3.9, 3, 26, D("#F7DCE6", "#6A4E5A"), "m", 0.012); [1.6, 2.45, 3.3].forEach(j => K.wtext("♥", 7.33, j, 15, "j", 4, D("#FFFFFF", "#E9D0DA"), null, 800));
  disc(6.85, 1.4, 0.2, 31.4, 1.6, D("#F4EEF6", "#6A6070"), "s", 20); [[-0.07, 0, "#E06A55"], [0.07, 0.04, "#F6E39A"], [0, -0.08, "#72C4AE"], [0.02, 0.07, "#F4A7B9"]].forEach(([di, dj, cc]) => ball(6.85 + di, 1.4 + dj, 34, 0.065, cc, "m", 10));
  B(6.55, 2.3, 0.55, 0.7, 0.8, WOOD, 31.4, {r:0.02}); [[6.72, 2.45], [6.9, 2.6], [6.75, 2.8]].forEach(([i, j]) => ball(i, j, 33, 0.09, D("#8CC478", "#3E6E34"), "m", 10).scale.y = 0.45);
  K.sm(K.cyl(0.06, 0.06, hz(8), 12), D("#F4A7B9", "#7A5866"), X(6.7), hz(35.4), Z(3.5), null, "glass"); K.sm(K.cyl(0.06, 0.06, hz(8), 12), D("#F6E39A", "#8A7A3A"), X(6.95), hz(35.4), Z(3.6), null, "glass");
  [[6.85, 1.8], [6.85, 3.3]].forEach(([i, j]) => { rod([i, j, 78], [i, j, TALL], 0.006, "metal");
    K.sm(myGeo(new THREE.SphereGeometry(0.2, 16, 8, 0, PI * 2, 0, PI / 2)), PINK, X(i), hz(78), Z(j), null, "s").scale.y = 0.75;
    K.sm(K.cyl(0.17, 0.17, 0.01, 16), D("#FFF3D6", "#FFD9A0"), X(i), hz(78) - 0.005, Z(j), null, "glow"); });
  // 아일랜드 끝에 붙인 가족 식탁 (가운데 고기 불판) · 의자 4 (유나 자리 방석) · 덕트 후드
  const tb = D("#C9A27A", "#6B4E38");
  [[6.2, 4.08], [7.42, 4.08], [6.2, 6.64], [7.42, 6.64]].forEach(([i, j]) => B(i, j, 0.08, 0.08, 22, WOODD, 0, {r:0, cls:"s"}));
  B(6.15, 4.04, 1.4, 2.76, 3, tb, 22, {r:0.04});
  disc(GI, GJ, 0.38, 25, 0.7, "#2A2A2C", "s", 28);
  K.sm(myGeo(new THREE.TorusGeometry(0.33, 0.025, 6, 28)), "#55555A", X(GI), hz(25.9), Z(GJ), null, "s").rotation.x = PI / 2;
  [-0.22, -0.11, 0, 0.11, 0.22].forEach(d => B(GI - Math.sqrt(0.32 * 0.32 - d * d) + 0.01, GJ + d - 0.012, 2 * Math.sqrt(0.32 * 0.32 - d * d) - 0.02, 0.024, 0.4, "#6A6A70", 25.75, {r:0, cls:"s"}));
  [[6.45, 4.35], [7.25, 6.45], [6.45, 6.45], [7.25, 4.35]].forEach(([i, j], k) => { disc(i, j, 0.15, 25, 0.5, "#FFFFFF"); if(k < 3) ball(i, j, 26.2, 0.06, ["#72C4AE", "#E06A55", "#F6E39A"][k], "m", 8); });
  [[6.4, 5.0], [7.3, 5.85]].forEach(([i, j]) => K.sm(K.cyl(0.05, 0.05, hz(7), 10), D("#A8DCC8", "#5D8F80"), X(i), hz(25 + 3.5), Z(j), null, "glass"));
  K.sm(K.cyl(0.14, 0.34, hz(9), 24), "#C9CDD2", X(GI), hz(61.5), Z(GJ), null, "s"); rod([GI, GJ, 66], [GI, GJ, 103], 0.075, "#B9BEC4", "s", 14);
  ball(GI, GJ, 104, 0.075, "#B9BEC4", "s", 12); rod([GI, GJ, 104], [GI, 0.02, 104], 0.075, "#B9BEC4", "s", 14);
  chair(5.6, 4.75, "+i", WOOD, D("#A9CBEA", "#4E6A88")); chair(5.6, 6.05, "+i", WOOD, PINK); chair(8.1, 4.75, "-i", WOOD, LILAC); chair(8.1, 6.05, "-i", WOOD, D("#F6E39A", "#8A7A3A"));
  B(5.42, 5.88, 0.3, 0.34, 3, PINK2, 19.5, {r:0.08});   // 유나 자리 방석 (한 칸 더 높게)
  // 거실: TV장 · TV · 선반 · 시계 (뒷벽)
  shift(3.6, 0, () => {
  B(7.0, 0.05, 4.0, 0.52, 14, D("#FFFFFF", "#6A625C"), 0, {r:0.03}); B(6.98, 0.04, 4.04, 0.55, 1.4, WOOD, 14, {r:0.01});
  [7.95, 9.0, 10.05].forEach(i => K.faceJ(i - 0.006, i + 0.006, 0.57, 1.5, 12.5, D("#E6DCE2", "#5A524E"), "s", 0.004));
  B(8.85, 0.16, 0.3, 0.2, 7, "#2A2A2C", 15.4, {r:0.02, cls:"s"});
  B(7.6, 0.24, 2.8, 0.08, 46, "#18181B", 22, {r:0.015, cls:"s"});
  B(7.2, 0.2, 0.22, 0.22, 24, "#2A2A2C", 15.4, {r:0.04, cls:"s"}); B(10.58, 0.2, 0.22, 0.22, 24, "#2A2A2C", 15.4, {r:0.04, cls:"s"});
  B(7.4, 0.012, 3.2, 0.3, 1.6, WOOD, 82, {r:0.01});
  [[7.75, "#F4C7D4", 0], [8.55, "#C8B4D0", 1], [10.1, "#A8DCC8", 2]].forEach(([i, bg, k]) => { B(i - 0.26, 0.08, 0.52, 0.05, 20, WHITE, 83.6, {r:0.01});
    K.decal(110, 90, (c, w, h) => { c.fillStyle = bg; c.fillRect(0, 0, w, h); const fam = [[0.3, "#2A2420", 0.17], [0.55, "#3A2A20", 0.16], [0.76, "#4A3226", 0.11]];
      (k === 1 ? fam.slice(0, 2) : k === 2 ? fam.slice(2) : fam).forEach(([x, hair, r]) => { const xx = k === 2 ? 0.5 : x; c.fillStyle = "#F0D2BC"; c.beginPath(); c.arc(w * xx, h * 0.5, h * r, 0, 7); c.fill(); c.fillStyle = hair; c.beginPath(); c.arc(w * xx, h * 0.45, h * r * 1.02, PI, 0); c.fill(); });
      c.fillStyle = "#FFFFFF"; c.font = "800 12px system-ui"; c.textAlign = "center"; c.fillText(["우리 가족 ♥", "엄마 아빠", "유나 첫돌"][k], w / 2, h * 0.92); }, 0.44, hz(15), "i", i, 0.13, hz(93.5)); });
  B(9.25, 0.12, 0.08, 0.08, 8, GOLD, 83.6, {r:0, cls:"s"}); K.sm(K.cyl(0.11, 0.06, hz(8), 12), GOLD, X(9.29), hz(95.6), Z(0.16), null, "s");
  B(9.48, 0.1, 0.3, 0.12, 10, D("#2A2A28", "#3A3A38"), 83.6, {r:0.01, cls:"s"});
  K.decal(80, 64, (c, w, h) => { c.fillStyle = "#2A2A28"; c.fillRect(0, 0, w, h); c.fillStyle = "#FFFFFF"; [0, 1, 2, 3].forEach(k => c.fillRect(k * w / 4 + 2, 2, w / 8, h * 0.22)); c.font = "800 13px system-ui"; c.textAlign = "center"; c.fillText("TAKE 1", w / 2, h * 0.68); }, 0.26, 0.2, "i", 9.63, 0.22, hz(89));
  { const ck = K.sm(K.cyl(0.32, 0.32, 0.05, 28), WHITE, X(6.55), hz(92), Z(0.04), null, "s"); ck.rotation.x = PI / 2;
    K.decal(128, 128, (c, w, h) => { RB.forEach((col, k) => { c.strokeStyle = col; c.lineWidth = 7; c.beginPath(); c.arc(w / 2, h / 2, w * (0.44 - k * 0.055), 0, 7); c.stroke(); });
      c.fillStyle = "#FFFFFF"; c.beginPath(); c.arc(w / 2, h / 2, w * 0.15, 0, 7); c.fill(); c.strokeStyle = "#2A2A28"; c.lineWidth = 4; c.lineCap = "round";
      c.beginPath(); c.moveTo(w / 2, h / 2); c.lineTo(w / 2, h * 0.3); c.moveTo(w / 2, h / 2); c.lineTo(w * 0.64, h * 0.56); c.stroke(); }, 0.58, 0.58, "i", 6.55, 0.08, hz(92)); }
  });
  // 소파 · 커피 테이블 · 빈백 · 장난감 · 스탠드
  shift(3.6, 1.0, () => {
  const so = PINK, sd = D("#DDA2B8", "#6A4A58");
  B(7.12, 5.25, 3.56, 0.82, 10, so, 0, {r:0.07, seg:2});
  B(7.16, 5.97, 3.48, 0.28, 27, sd, 0, {r:0.07, seg:2});
  B(6.86, 5.2, 0.3, 1.06, 18, sd, 0, {r:0.08, seg:2}); B(10.64, 5.2, 0.3, 1.06, 18, sd, 0, {r:0.08, seg:2});
  [7.22, 8.4, 9.58].forEach(i => B(i, 5.3, 1.14, 0.7, 2.6, D("#F7D6E2", "#7E5E6C"), 10, {r:0.06}));
  [[7.55, LILAC, 0.15], [9.95, D("#F6E39A", "#8A7A3A"), -0.15]].forEach(([i, c, rz]) => { const o = B(i - 0.25, 5.84, 0.5, 0.14, 12, c, 12.6, {r:0.06}); o.rotation.z = rz; });
  B(9.1, 5.32, 0.9, 0.66, 0.8, D("#FFFFFF", "#8A847C"), 12.6, {r:0.04});
  // 커피 테이블 (둥근) · 과일 · 리모컨
  disc(8.9, 3.75, 0.58, 11, 2, D("#FFFFFF", "#8A847C"), "s", 32); K.sm(K.cyl(0.12, 0.2, hz(11), 16), WOOD, X(8.9), hz(5.5), Z(3.75), null, "m");
  disc(8.75, 3.65, 0.18, 13, 1.4, D("#F4EEF6", "#6A6070"), "s", 20); [[-0.06, 0, "#E06A55"], [0.06, 0.03, "#F6E39A"], [0, -0.07, "#72C4AE"]].forEach(([di, dj, c]) => ball(8.75 + di, 3.65 + dj, 15.6, 0.06, c, "m", 10));
  B(9.1, 3.85, 0.1, 0.26, 0.9, INK, 13, {r:0.02, cls:"s"});
  // 빈백 (노랑) · 장난감 바구니 · 블록
  ball(11.2, 3.05, 5, 0.42, D("#F6E39A", "#8A7A3A"), "m", 18).scale.set(1, 0.62, 1);
  B(11.0, 4.6, 0.55, 0.42, 9, D("#E9D2B0", "#6A5A48"), 0, {r:0.06}); [[11.12, 4.75, "#F4A7B9"], [11.32, 4.72, "#A9CBEA"], [11.22, 4.88, "#FFE066"]].forEach(([i, j, c]) => ball(i, j, 9.5, 0.08, c, "m", 8));
  [[7.4, 2.75, "#F25F5C"], [7.62, 2.85, "#5E9BEA"], [7.5, 3.02, "#FFE066"]].forEach(([i, j, c]) => B(i, j, 0.16, 0.16, 2.1, c, 0, {r:0.02}));
  B(11.4, 6.3, 0.1, 0.1, 58, INK, 0, {r:0, cls:"s"}); disc(11.45, 6.35, 0.17, 0, 0.8, INK, "s");
  K.sm(myGeo(new THREE.CylinderGeometry(0.16, 0.24, hz(13), 18, 1, true)), D("#FFF1F6", "#E9D0DA"), X(11.45), hz(64), Z(6.35), null, "glow");
  });
  K.plant(15.15, 0.6, true); K.plant(8.95, 10.4, true); K.plant(9.6, 0.5, false);
  // 앞벽 낮은 책장 · 방석 둘 (책 읽는 자리)
  B(9.6, 10.45, 3.4, 0.4, 22, WHITE, 0, {r:0.02}); for(let k = 0; k < 14; k++) B(9.7 + k * 0.23, 10.5, 0.16, 0.3, 8 + (k % 3) * 1.6, RB[k % RB.length], 22, {r:0.01});
  [[10.4, 9.6, PINK], [11.9, 9.6, LILAC]].forEach(([i, j, cc]) => { K.sm(K.cyl(0.3, 0.32, hz(8), 18), cc, X(i), hz(4), Z(j), null, "m"); ball(i, j, 8.2, 0.04, WHITE, "m", 8); });
  // 복도 콘솔 (가족 사진 · 꽃)
  shift(0.4, 2.0, () => {
  B(4.85, 8.45, 1.0, 0.36, 22, WHITE, 0, {r:0.02}); flowerPot(5.6, 8.63, "#F4A7B9", 0.5, LILAC2, 22);
  [[5.0, "#F4C7D4"], [5.3, "#FCE9B8"]].forEach(([i, cc]) => { B(i - 0.12, 8.6, 0.24, 0.04, 16, WHITE, 22, {r:0.01}); K.decal(40, 54, (c, w, h) => { c.fillStyle = cc; c.fillRect(0, 0, w, h); c.fillStyle = "#F0D2BC"; c.beginPath(); c.arc(w / 2, h * 0.5, w * 0.24, 0, 7); c.fill(); }, 0.2, hz(13), "i", i, 8.56, hz(30)); });
  });
  // 벽: 앞(j 11) · 오른(i 16, 미닫이 유리) · 게스트 화장실 (i 2.8~4.5, j 7.7~10.9)
  const fw = D("#F7EEF0", "#4A4044"), pw = D("#FFF6F8", "#4A4044");
  wallI(0, HW - T / 2, HD, fw);
  wallJ(0, 1.2, HW, fw); wallJ(2.6, HD + T / 2, HW, fw);
  B(HW - 0.04, 1.2, 0.08, 1.4, 1.5, WHITE, 0, {r:0, cls:"s"}); K.faceI(HW - 0.01, 1.22, 2.58, 1.5, LOW + 30, D("#DDE8F2", "#7A90B8"), "glass", 0.02);
  [1.2, 2.6].forEach(j => B(HW - 0.05, j - 0.03, 0.1, 0.06, LOW + 31, WHITE, 0, {r:0, cls:"s"})); B(HW - 0.05, 1.17, 0.1, 1.46, 1.5, WHITE, LOW + 31, {r:0, cls:"s"});
  wallJ(SJ0, HD - T / 2, 2.7, pw);
  shift(0, 2.0, () => {
    wallI(2.8, 4.7, 5.6, pw); wallJ(5.7, 6.2, 4.6, pw); wallJ(7.1, HD - 2 - T / 2, 4.6, pw); doorFrameJ(6.2, 7.1, 4.6);
  toilet(3.65, 8.4, "-j"); sinkMirror(2.84, 6.15, 0.46, 0.75, 2.86, 6.52, "+i");
  rod([3.1, 5.75, 34], [3.9, 5.75, 34], 0.012, "#C9CDD2"); B(3.18, 5.72, 0.64, 0.06, 16, D("#A8DCC8", "#4E7A6E"), 19, {r:0.01});
  flowerPot(4.2, 6.05, "#F4A7B9", 0.55, WHITE); K.wtext("WC", 4.62 + 0.12, 6.65, 40, "j", 3, D("#B5607E", "#F4C7D4"), null, 800);
  });
}
/* =================================================================== 3층: 유나 방 · 엄마아빠 방 · 아빠 편집실 · 욕실 둘 */
const RJ = 4.6, FJ = 5.8;   // 뒤쪽 방 벽 j 4.6 · 앞쪽 줄 벽 j 5.8 (그 사이 복도)
function paint3(c, dark){
  const p = paintKit(c, dark), v = p.v;
  p.wood(-1, -1, 18, 13);
  // 유나 방: 분홍빛 마루 · 무지개 둥근 러그 · 별
  p.rect(0, 0, 6.4, RJ, v("#F3E2E2", "#4A3A3E"));
  for(let j = 0.4; j < RJ; j += 0.4) p.line(0, j, 6.4, j, v("rgba(180,120,140,.10)", "rgba(0,0,0,.2)"), 0.012);
  RB.slice().reverse().forEach((col, k) => { c.fillStyle = col; c.beginPath(); c.ellipse(3.05, 2.55, 1.25 - k * 0.15, 1.0 - k * 0.12, 0, 0, 7); c.fill(); });
  c.fillStyle = v("#FFFFFF", "#D9CFE2"); c.beginPath(); c.ellipse(3.05, 2.55, 0.35, 0.28, 0, 0, 7); c.fill();
  const star = (i, j, r, col) => { c.fillStyle = col; c.beginPath(); for(let k = 0; k < 10; k++){ const a = -PI / 2 + k * PI / 5, rr2 = k % 2 ? r * 0.45 : r; c.lineTo(i + Math.cos(a) * rr2, j + Math.sin(a) * rr2); } c.fill(); };
  [[2.0, 1.4], [4.4, 3.6], [1.7, 3.6], [5.3, 1.8]].forEach(([i, j], k) => star(i, j, 0.14, v(["#F6E39A", "#F4A7B9", "#A9CBEA", "#C8B4D0"][k], "rgba(255,255,255,.12)")));
  // 안방: 라일락 러그
  p.rect(6.4, 0, HW, RJ, v("#E9D7C1", "#463A30"));
  pshift(c, 1.6, 0.3, () => { p.rr(7.4, 1.5, 10.4, 3.7, 0.25, v("#D9CBE2", "#544860")); p.rr(7.55, 1.65, 10.25, 3.55, 0.18, v("#EEE5F2", "#5E5268")); });
  // 복도 러너 (가로 · 세로)
  p.rr(2.9, 4.85, 15.4, 5.55, 0.15, v("#F2E3EA", "#4A3E44")); for(let i = 3.2; i < 15.2; i += 0.5) p.rect(i, 5.17, i + 0.25, 5.23, v("rgba(232,181,200,.6)", "rgba(232,181,200,.2)"));
  p.rr(2.85, 5.7, 3.55, 10.6, 0.12, v("#F2E3EA", "#4A3E44"));
  // 욕실 · 작은 욕실 타일
  p.check(3.9, FJ + 0.1, 7.1, HD, 0.34, v("#F4F6F8", "#3A3E44"), v("#E7E0EF", "#45404E")); p.rr(5.2, 8.6, 5.9, 9.6, 0.15, v("#F4A7B9", "#7A5866"));
  p.check(7.3, FJ + 0.1, 9.3, HD, 0.3, v("#F2F6F4", "#3A403E"), v("#DDEFE8", "#3E4A46")); p.rect(8.47, 9.97, 9.3, HD, v("#C9D6DE", "#3A444C"));
  // 편집실: 짙은 마루 · 필름 러그
  p.wood(9.5, FJ + 0.1, HW, HD, "#C9B49A", "#3A3028");
  pshift(c, 2.0, 1.1, () => { p.rr(9.0, 6.6, 12.3, 8.6, 0.1, v("#55555E", "#2A2A30")); for(let i = 9.15; i < 12.2; i += 0.25){ p.rect(i, 6.68, i + 0.12, 6.78, v("#E6E1D8", "#6A6660")); p.rect(i, 8.42, i + 0.12, 8.52, v("#E6E1D8", "#6A6660")); } });
  p.arrow("▼ 2층", 1.95, 8.95); p.arrow("▲ 4층", 0.65, 8.95);
  p.glow(1.7, 0.5, 1.0, v("rgba(255,250,235,.25)", "rgba(255,200,150,.22)")); p.glow(10.5, 1.2, 1.6, v("rgba(255,250,235,.25)", "rgba(255,200,130,.16)"));
  p.glow(13.35, 6.6, 1.0, v("rgba(200,225,255,.15)", "rgba(150,190,255,.2)"));
}
function build3(){
  const wy = D("#FBE4EC", "#56404A"), wm = D("#EDE4F2", "#4A4252"), wh = D("#F7F1F4", "#3E3539");
  backWalls([[0, 6.4, wy], [6.4, HW, wm]], [[0, RJ, D("#EADCF0", "#4E4458")], [RJ, HD, wh]]);
  slabHole(SB, "s"); flight(SA, -1); stairRail(1.29, -1);
  glassRail(1.36, 2.6, SJ0 - 0.04, "i"); glassRail(SJ0, SJ1 - 0.04, 2.64, "j");
  winJ(2.2, 3.4, 46, 90, "sky"); winJ(13.0, 14.1, 50, 90, "sky");
  // 벽 (문 자리 빼고)
  const pw = D("#FFF6F8", "#4A4044"), fw = D("#F7EEF0", "#4A4044");
  gaps(0, HW - T / 2, [[3.6, 4.7], [7.0, 8.1]]).forEach(([a, b]) => wallI(a, b, RJ, pw));
  wallJ(0, RJ - T / 2, 6.4, pw);
  gaps(3.9, HW - T / 2, [[6.1, 7.0], [7.9, 8.7], [10.0, 10.9]]).forEach(([a, b]) => wallI(a, b, FJ, pw));
  wallJ(FJ - 0.1, HD - T / 2, 3.8, pw); wallJ(FJ + 0.1, HD - T / 2, 7.2, pw); wallJ(FJ + 0.1, HD - T / 2, 9.4, pw);
  wallI(0, HW - T / 2, HD, fw); wallJ(0, HD + T / 2, HW, fw);
  [[3.6, 4.7, RJ], [7.0, 8.1, RJ], [6.1, 7.0, FJ], [7.9, 8.7, FJ], [10.0, 10.9, FJ]].forEach(([a, b, j]) => doorFrameI(a, b, j));
  rod([3.85, RJ + 0.1, 66], [3.85, RJ + 0.1, 59], 0.006, "metal"); rod([4.45, RJ + 0.1, 66], [4.45, RJ + 0.1, 59], 0.006, "metal");
  B(3.75, RJ + 0.08, 0.8, 0.03, 8, PINK, 52, {r:0.01}); K.wtext("YUNA ♡", 4.15, RJ + 0.112, 56, "i", 3.6, "#FFFFFF", null, 800);
  B(7.15, RJ + 0.08, 0.8, 0.03, 8, LILAC, 52, {r:0.01}); rod([7.3, RJ + 0.1, 66], [7.3, RJ + 0.1, 59], 0.006, "metal"); rod([7.8, RJ + 0.1, 66], [7.8, RJ + 0.1, 59], 0.006, "metal"); K.wtext("MOM & DAD", 7.55, RJ + 0.112, 56, "i", 2.6, "#FFFFFF", null, 800);
  yunaRoom(); masterRoom(); bath1(); bath2(); studio();
}
function yunaRoom(){
  // 공주 침대 (캐노피) · 이불 · 베개 · 곰인형
  B(0.1, 0.03, 1.34, 0.12, 34, PINK, 0, {r:0.05}); K.wtext("♥", 0.77, 0.155, 28, "i", 6, "#FFFFFF", null, 800);
  B(0.12, 0.12, 1.3, 2.2, 10, WHITE, 0, {r:0.04});
  B(0.16, 0.16, 1.22, 2.12, 5, D("#FFF4F8", "#9A8A90"), 10, {r:0.06});
  B(0.14, 0.95, 1.26, 1.36, 2, D("#D9C6E6", "#5E4E68"), 15, {r:0.05});
  for(let k = 0; k < 6; k++) ball(0.35 + (k % 3) * 0.37, 1.25 + (k / 3 | 0) * 0.55, 17.2, 0.05, "#F4A7B9", "m", 6).scale.y = 0.3;
  B(0.3, 0.24, 0.94, 0.48, 3, WHITE, 15, {r:0.1});
  { const ti = 1.0, tj = 0.62, br = D("#C9A27A", "#6B4E38"); ball(ti, tj, 21, 0.17, br, "m", 14); ball(ti, tj - 0.02, 28.5, 0.13, br, "m", 14); [[-0.1, 31.5], [0.1, 31.5]].forEach(([d, z]) => ball(ti + d, tj - 0.02, z, 0.05, br, "m", 8));
    ball(ti, tj + 0.1, 27.5, 0.045, D("#EAD3B6", "#8A7056"), "m", 8); ball(ti, tj + 0.14, 18.5, 0.05, "#F06BA8", "m", 8); }
  const cp = [[0.15, 0.15], [1.39, 0.15], [0.15, 2.29], [1.39, 2.29]];
  cp.forEach(([i, j]) => rod([i, j, 10], [i, j, 84], 0.02, WHITE, "s", 8));
  B(0.12, 0.12, 1.3, 2.2, 1.4, PINK, 84, {r:0}); K.faceJ(0.16, 1.38, 0.13, 74, 84, D("#F4C7D4", "#7A5866"), "m", 0.02);
  B(0.14, 0.14, 1.26, 2.16, 0.6, D("#F8E3EC", "#9A7A88"), 85.6, {r:0, cls:"glass"});
  [[0.15, 0.15], [0.15, 2.29], [1.39, 2.29]].forEach(([i, j], k) => K.sm(K.rbox(0.34, hz(56), 0.03, 0), D("#F8DCE8", "#B98799"), X(i + (k === 2 ? -0.15 : 0.15)), hz(56), Z(j + (k === 0 ? 0.04 : -0.04)), null, "glass"));
  K.sm(K.cyl(0.1, 0.14, hz(6), 12), GOLD, X(0.77), hz(90), Z(1.22), null, "s");
  K.sm(K.cyl(0.04, 0.05, hz(8), 10), WHITE, X(1.75), hz(4), Z(0.42), null, "m"); K.sm(myGeo(new THREE.SphereGeometry(0.14, 14, 7, 0, PI * 2, 0, PI / 2)), D("#FFC7D9", "#FFB0C8"), X(1.75), hz(8), Z(0.42), null, "glow");
  K.decal(420, 70, (c, w, h, dark) => { c.strokeStyle = dark ? "#C9B8C4" : "#B79AA8"; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 6); c.quadraticCurveTo(w / 2, 22, w, 6); c.stroke();
    "Y U N A ♡".split(" ").forEach((ch, k, a) => { const x = (k + 0.5) * w / a.length, y = 8 + Math.sin(PI * (k + 0.5) / a.length) * 13; c.fillStyle = RB[k % RB.length]; c.beginPath(); c.moveTo(x - 30, y); c.lineTo(x + 30, y); c.lineTo(x, y + 52); c.fill();
      c.fillStyle = "#FFFFFF"; c.font = "800 26px system-ui"; c.textAlign = "center"; c.fillText(ch, x, y + 24); }); }, 2.3, hz(13), "j", 0.012, 1.25, hz(100));
  // 책상 · 의자 · 스탠드 · 크레용 통 · 그림 · 책 · 코르크보드
  [[3.52, 0.12], [5.0, 0.12], [3.52, 0.66], [5.0, 0.66]].forEach(([i, j]) => B(i, j, 0.06, 0.06, 22, WHITE, 0, {r:0, cls:"s"}));
  B(4.42, 0.12, 0.62, 0.6, 18, PINK, 0, {r:0.03}); [6, 12].forEach(z => K.faceJ(4.48, 4.98, 0.72, z, z + 0.8, D("#D49AB0", "#6A4E5A"), "s", 0.004));
  B(3.46, 0.08, 1.64, 0.7, 2.4, WHITE, 22, {r:0.02});
  rod([3.7, 0.25, 24.4], [3.7, 0.25, 40], 0.012, D("#F06BA8", "#B5607E")); rod([3.7, 0.25, 40], [3.85, 0.42, 44], 0.012, D("#F06BA8", "#B5607E"));
  K.sm(myGeo(new THREE.ConeGeometry(0.12, hz(6), 14, 1, true)), PINK, X(3.88), hz(43), Z(0.45), null, "m"); ball(3.88, 0.45, 41.5, 0.05, D("#FFF6E0", "#FFE2A8"), "glow", 8);
  K.sm(K.cyl(0.07, 0.07, hz(7), 12), WHITE, X(4.85), hz(28), Z(0.3), null, "m");
  RB.forEach((col, k) => rod([4.85 + Math.cos(k) * 0.035, 0.3 + Math.sin(k) * 0.035, 28], [4.85 + Math.cos(k) * 0.05, 0.3 + Math.sin(k) * 0.05, 35 + (k % 3)], 0.012, col, "m", 5));
  K.decal(120, 90, (c, w, h) => { c.fillStyle = "#FFFFFF"; c.fillRect(0, 0, w, h); RB.forEach((col, k) => { c.strokeStyle = col; c.lineWidth = 5; c.beginPath(); c.arc(w * 0.5, h * 0.9, w * (0.38 - k * 0.04), PI, 0); c.stroke(); });
    c.fillStyle = "#F0D2BC"; [[0.25, 0.55], [0.5, 0.5], [0.72, 0.6]].forEach(([x, y], k) => { c.beginPath(); c.arc(w * x, h * y, [8, 8, 6][k], 0, 7); c.fill(); }); }, 0.44, 0.33, "f", 4.2, 0.42, hz(24.4));
  [[3.55, "#F4A7B9"], [3.62, "#A9CBEA"], [3.69, "#F6E39A"], [3.76, "#A8DCC8"]].forEach(([i, c], k) => B(i, 0.012, 0.06, 0.24, 10 - (k % 2) * 1.5, c, 72.4, {r:0.01}));
  B(3.45, 0.012, 1.7, 0.28, 1.4, WHITE, 71, {r:0.01});
  K.faceJ(3.9, 5.15, 0.012, 46, 66, D("#D2B48C", "#6B5440"), "m", 0.012);
  K.decal(250, 140, (c, w, h) => { [["#FFFFFF", 10, 12, 70, 52, -0.06], ["#FFF3B0", 95, 18, 60, 48, 0.05], ["#FFFFFF", 170, 10, 66, 56, -0.03], ["#F4C7D4", 40, 76, 70, 50, 0.04], ["#E0F0FF", 130, 78, 80, 50, -0.04]].forEach(([col, x, y, ww, hh, r], k) => {
      c.save(); c.translate(x + ww / 2, y + hh / 2); c.rotate(r); c.fillStyle = col; c.fillRect(-ww / 2, -hh / 2, ww, hh); c.fillStyle = RB[k]; c.beginPath(); c.arc(0, 2, hh * 0.25, 0, 7); c.fill(); c.fillStyle = "#E06A55"; c.beginPath(); c.arc(0, -hh / 2 + 4, 3, 0, 7); c.fill(); c.restore(); }); },
    1.2, hz(18), "i", 4.525, 0.012, hz(56));
  chair(4.25, 1.28, "-j", WHITE, LILAC);
  // 장난감 선반 (왼벽) · 인형 · 토끼
  B(0.04, 2.7, 0.46, 1.2, 24, WHITE, 0, {r:0.02});
  [[2.75, 1], [3.15, 1], [3.55, 1], [2.75, 12.5], [3.15, 12.5], [3.55, 12.5]].forEach(([j, z], k) => B(0.5, j, 0.025, 0.34, 10.5, ["#F4A7B9", "#A9CBEA", "#F6E39A", "#A8DCC8", "#C8B4D0", "#F9C99B"][k], z, {r:0.01}));
  const doll = (i, j, z, dress, hair) => { K.sm(myGeo(new THREE.ConeGeometry(0.1, hz(7), 12)), dress, X(i), hz(z + 3.5), Z(j), null, "m"); ball(i, j, z + 8.6, 0.065, D("#F6DCC8", "#B8A090"), "m", 10); ball(i, j - 0.01, z + 9.4, 0.068, hair, "m", 10).scale.y = 0.7; };
  doll(0.25, 2.95, 24, PINK, "#E8C36A"); doll(0.25, 3.3, 24, LILAC, "#3A2A20");
  { const bi = 0.25, bj = 3.65, z = 24; ball(bi, bj, z + 3.5, 0.11, WHITE, "m", 12); ball(bi, bj, z + 8.5, 0.08, WHITE, "m", 12); [-0.035, 0.035].forEach(d => { const e = ball(bi, bj + d, z + 13, 0.03, WHITE, "m", 8); e.scale.y = 2.6; }); ball(bi + 0.08, bj, z + 8.5, 0.015, "#F06BA8", "m", 6); }
  // 인형집 · 유니콘 인형 · 블록
  B(5.1, 2.55, 0.55, 0.85, 22, D("#FFF6F8", "#8A7A80"), 0, {r:0.02}); { const roof = K.sm(K.rbox(0.48, 0.05, 0.92, 0), PINK, X(5.24), hz(26), Z(2.975), null, "m"); roof.rotation.z = 0.55; const r2 = K.sm(K.rbox(0.48, 0.05, 0.92, 0), PINK, X(5.51), hz(26), Z(2.975), null, "m"); r2.rotation.z = -0.55; }
  [2.75, 3.15].forEach(j => [6, 14].forEach(z => K.faceI(5.088, j - 0.08, j + 0.08, z, z + 5, D("#F6E39A", "#C8B060"), "m", 0.012)));
  { const ui = 3.05, uj = 2.9, w = D("#FFFFFF", "#9A949C"); const body = ball(ui, uj, 7, 0.26, w, "m", 16); body.scale.set(1.3, 0.85, 0.9);
    ball(ui + 0.3, uj, 14, 0.15, w, "m", 14); K.sm(myGeo(new THREE.ConeGeometry(0.035, 0.18, 10)), GOLD, X(ui + 0.36), hz(19.5), Z(uj), null, "s").rotation.z = -0.4;
    RB.forEach((c, k) => ball(ui + 0.18 - k * 0.04, uj - 0.06 + (k % 2) * 0.12, 15 - k * 0.6, 0.06, c, "m", 8));
    [[-0.15, -0.12], [0.15, -0.12], [-0.15, 0.12], [0.15, 0.12]].forEach(([a, b]) => ball(ui + a, uj + b, 2, 0.07, w, "m", 8)); }
  [[2.0, 3.55, "#F25F5C"], [2.2, 3.6, "#5E9BEA"], [2.1, 3.4, "#FFE066"]].forEach(([i, j, c]) => B(i, j, 0.15, 0.15, 2.1, c, 0, {r:0.02}));
}
function masterRoom(){
  shift(1.6, 0.0, () => {
  // 침대 (퀸) · 헤드보드 · 협탁 · 스탠드
  B(7.7, 0.03, 2.3, 0.13, 44, LILAC, 0, {r:0.06, seg:2});
  [8.1, 8.55, 9.0, 9.45].forEach(i => K.faceJ(i + 0.12, i + 0.14, 0.16, 12, 40, K.sh(LILAC, -0.1), "m", 0.006));
  B(7.82, 0.16, 2.06, 2.2, 10, WOOD, 0, {r:0.04}); B(7.86, 0.2, 1.98, 2.12, 5, WHITE, 10, {r:0.06});
  B(7.84, 0.9, 2.02, 1.42, 2, PINK2, 15, {r:0.05}); B(7.85, 1.95, 2.0, 0.3, 2.4, LILAC, 15.4, {r:0.04});
  [8.3, 9.4].forEach(i => B(i - 0.38, 0.28, 0.76, 0.42, 3.2, WHITE, 15, {r:0.12})); B(8.6, 0.6, 0.5, 0.2, 7, D("#F06BA8", "#B5607E"), 15, {r:0.08});
  [[7.05, "#F6E39A"], [10.1, "#A9CBEA"]].forEach(([i, cc]) => { B(i, 0.1, 0.55, 0.5, 16, WHITE, 0, {r:0.03}); K.faceJ(i + 0.05, i + 0.5, 0.61, 8, 8.8, D("#E6DCE2", "#5A524E"), "s", 0.004);
    K.sm(K.cyl(0.03, 0.05, hz(8), 10), GOLD, X(i + 0.27), hz(20), Z(0.33), null, "s"); K.sm(myGeo(new THREE.CylinderGeometry(0.1, 0.14, hz(7), 14, 1, true)), D("#FFF7EC", "#FFE2B8"), X(i + 0.27), hz(27), Z(0.33), null, "glow");
    ball(i + 0.12, 0.45, 17.5, 0.05, cc, "m", 8); });
  [[8.15, 0], [8.85, 1], [9.55, 2]].forEach(([i, k]) => { K.faceJ(i - 0.28, i + 0.28, 0.012, 54, 76, D("#FFFFFF", "#8A847C"), "m", 0.03);
    K.decal(100, 80, (c, w, h) => { c.fillStyle = ["#F4C7D4", "#E2D6EA", "#FCE9B8"][k]; c.fillRect(0, 0, w, h); c.fillStyle = "#FFFFFF"; c.font = "800 34px system-ui"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(["♥", "🎬", "☁️"][k], w / 2, h / 2); }, 0.48, hz(18), "i", i, 0.03, hz(65)); });
  });
  shift(0.6, 0, () => {
  // 옷장 (왼쪽 칸막이 앞)
  B(5.94, 0.08, 0.62, 2.0, 84, WHITE, 0, {r:0.02}); K.faceI(6.56, 1.075, 1.085, 2, 82, D("#E6DCE2", "#5A524E"), "s", 0.006);
  [0.98, 1.18].forEach(j => B(6.56, j - 0.02, 0.02, 0.04, 10, GOLD, 40, {r:0, cls:"s"}));
  });
  shift(4.0, 0, () => {
  // 엄마 화장대 (오른벽 앞) · 둥근 거울 · 예운옥 구름 무드등 · 의자
  B(11.3, 2.25, 0.58, 1.2, 24, WHITE, 0, {r:0.02}); K.faceI(11.288, 2.35, 3.35, 14, 15, D("#E8B5C8", "#7A5866"), "s", 0.012);
  { const m = K.sm(K.cyl(0.36, 0.36, 0.04, 32), GOLD, X(11.75), hz(40), Z(2.85), null, "s"); m.rotation.z = PI / 2; const g2 = K.sm(K.cyl(0.32, 0.32, 0.012, 32), D("#E6EEF4", "#5A6470"), X(11.72), hz(40), Z(2.85), null, "s"); g2.rotation.z = PI / 2; }
  [[11.45, 2.4, "#F4A7B9"], [11.5, 2.55, "#FFFFFF"], [11.42, 3.25, "#C8B4D0"]].forEach(([i, j, c]) => K.sm(K.cyl(0.04, 0.04, hz(5), 10), c, X(i), hz(26.5), Z(j), null, "s"));
  [[-0.08, 0], [0, -0.05], [0.08, 0.02]].forEach(([di, dj]) => ball(11.55 + di, 3.05 + dj, 28, 0.08, D("#FFFFFF", "#F4E6F2"), "glow", 10));
  RB.forEach((c, k) => ball(11.48 + k * 0.03, 3.13, 30.5 + Math.sin(k) * 0.6, 0.022, c, "m", 6));
  disc(10.9, 2.85, 0.2, 12, 2.5, PINK, "m", 20); K.sm(K.cyl(0.05, 0.08, hz(12), 10), GOLD, X(10.9), hz(6), Z(2.85), null, "s");
  });
  shift(2.3, 0, () => {
  // 아빠 선반 (창 아래): 카메라 · 슬레이트 · 상패
  B(10.7, 0.06, 1.2, 0.48, 22, WOOD, 0, {r:0.02});
  B(10.82, 0.18, 0.3, 0.22, 9, INK, 22, {r:0.03, cls:"s"}); { const ln = K.cyl(0.07, 0.08, 0.16, 14); ln.rotateX(PI / 2); K.sm(ln, "#303033", X(10.97), hz(26.5), Z(0.47), null, "s"); }
  B(11.25, 0.2, 0.26, 0.06, 7, INK, 22, {r:0.01, cls:"s"}); [0, 1, 2, 3].forEach(k => B(11.26 + k * 0.065, 0.19, 0.03, 0.08, 1.6, "#FFFFFF", 29, {r:0}));
  B(11.62, 0.22, 0.06, 0.06, 6, GOLD, 22, {r:0, cls:"s"}); K.sm(K.cyl(0.1, 0.05, hz(7), 12), GOLD, X(11.65), hz(31.5), Z(0.25), null, "s");
  });
  K.plant(8.85, 3.9, true); K.plant(15.5, 4.0, false);
  shift(1.8, 0.6, () => {
  B(9.2, 4.17, 1.4, 0.3, 22, WHITE, 0, {r:0.02}); flowerPot(9.55, 4.32, "#F4A7B9", 0.5, LILAC2, 22); B(10.05, 4.22, 0.35, 0.2, 6, PINK, 22, {r:0.03});
  });
  shift(0.9, 0.6, () => {
  K.decal(40, 220, (c, w, h, dark) => { c.fillStyle = "#FFFFFF"; c.fillRect(0, 0, w, h); RB.forEach((col, k) => { c.fillStyle = col; c.fillRect(0, h - (k + 1) * h / 6, w * 0.25, h / 6); });
    c.fillStyle = "#2A2A28"; for(let k = 0; k < 11; k++) c.fillRect(w * 0.25, h - k * h / 11, k % 2 ? 8 : 14, 2); c.fillStyle = "#F06BA8"; c.fillRect(w * 0.25, h * 0.18, w * 0.75, 4); c.font = "800 9px system-ui"; c.fillText("유나", w * 0.35, h * 0.15); }, 0.16, hz(32), "i", 2.3, 4.1, hz(17.5));
  });
}
function bath1(){   // 욕실 (i 3.9~6.5): 욕조 · 세면대 · 변기 · 수건
  const tw = D("#FFFFFF", "#9A948C"), o = 2.5;
  shift(0, 2.0, () => {
  B(1.45 + o, 6.4, 0.1, 2.4, 18, tw, 0, {r:0}); B(2.35 + o, 6.4, 0.1, 2.4, 18, tw, 0, {r:0}); B(1.55 + o, 6.4, 0.8, 0.1, 18, tw, 0, {r:0}); B(1.55 + o, 8.7, 0.8, 0.1, 18, tw, 0, {r:0});
  B(1.55 + o, 6.5, 0.8, 2.2, 4, tw, 0, {r:0});
  B(1.56 + o, 6.51, 0.78, 2.18, 0.4, D("#BFE3F2", "#4A6A88"), 14, {r:0, cls:"glass"});
  [[1.7, 6.9], [2.05, 7.2], [1.8, 7.6], [2.15, 8.0], [1.75, 8.3], [2.1, 8.5]].forEach(([i, j], k) => ball(i + o, j, 14.8, 0.08 + (k % 3) * 0.02, "#FFFFFF", "m", 10).scale.y = 0.6);
  ball(1.95 + o, 7.35, 16, 0.08, "#FFD43B", "s", 12); ball(1.95 + o, 7.28, 19, 0.05, "#FFD43B", "s", 10); ball(1.95 + o, 7.22, 18.5, 0.02, "#F28C28", "s", 6);
  rod([1.95 + o, 6.45, 18], [1.95 + o, 6.45, 30], 0.016, "#C9CDD2"); rod([1.95 + o, 6.45, 30], [1.95 + o, 6.6, 27], 0.014, "#C9CDD2");
  });
  shift(-0.15, 0.2, () => {
  sinkMirror(4.1, 5.75, 1.1, 0.5, 4.65, 5.8, "+j");
  K.sm(K.cyl(0.05, 0.05, hz(5), 10), "#A8DCC8", X(5.05), hz(29), Z(5.9), null, "s"); [["#F4A7B9", -0.015], ["#A9CBEA", 0.015]].forEach(([c, d]) => rod([5.05 + d, 5.9, 30], [5.05 + d * 2, 5.9, 35], 0.008, c, "m", 5));
  });
  shift(0.5, 2.0, () => {
  toilet(6.05, 8.4, "-j");
  });
  shift(0.6, 2.0, () => {
  rod([6.47, 6.9, 34], [6.47, 7.7, 34], 0.012, "#C9CDD2"); B(6.42, 6.98, 0.06, 0.64, 16, D("#F4A7B9", "#7A5866"), 19, {r:0.01}); B(6.42, 7.0, 0.07, 0.6, 1, WHITE, 22, {r:0});
  flowerPot(6.2, 7.75, "#A8DCC8", 0.45, WHITE);
  });
}
function bath2(){   // 작은 욕실 (i 6.7~8.3): 유리 샤워 부스 · 변기 · 세면대
  const gl2 = D("#DDE8F2", "#7A90B8");
  shift(1.0, 2.0, () => {
  K.faceI(7.45, 7.97, HD - T / 2 - 0.01, 2, 70, gl2, "glass", 0.02); K.faceJ(7.47, 8.3 - 0.01, 7.95, 2, 70, gl2, "glass", 0.02);
  B(7.44, 7.94, 0.04, 0.04, 72, WHITE, 0, {r:0, cls:"s"});
  rod([8.2, 8.75, 0], [8.2, 8.75, 70], 0.012, "#C9CDD2"); rod([8.2, 8.75, 70], [8.0, 8.6, 70], 0.012, "#C9CDD2"); disc(8.0, 8.6, 0.09, 67, 1.2, "#C9CDD2", "s", 14);
  [["#F4A7B9", 8.1], ["#A8DCC8", 7.95]].forEach(([cc, i]) => B(i, 8.72, 0.08, 0.08, 7, cc, 0, {r:0.02, cls:"s"}));
  });
  shift(0.6, 2.0, () => {
  toilet(7.13, 8.35, "+i");
  });
  shift(1.0, 0.2, () => {
  sinkMirror(7.84, 6.0, 0.44, 0.72, 8.25, 6.36, "+i");
  });
  shift(0.6, 0.2, () => {
  K.plant(6.95, 5.95, false);
  });
}
function studio(){   // 아빠 편집실 (i 9.5~15.9): 모니터 둘 · 스피드 에디터 · 감독 의자 · 상패장 · 카메라 · 조명
  const dk = D("#2A2A2C", "#1C1C1E");
  shift(2.5, 0.2, () => {
  [[9.95, 5.8], [11.75, 5.8], [9.95, 6.38], [11.75, 6.38]].forEach(([i, j]) => B(i, j, 0.06, 0.06, 22, dk, 0, {r:0, cls:"s"}));
  B(9.9, 5.75, 1.95, 0.7, 2.4, WOOD, 22, {r:0.02});
  [[10.4, 0], [11.3, 1]].forEach(([i, k]) => { rod([i, 5.96, 24.4], [i, 5.96, 31], 0.02, dk); disc(i, 5.96, 0.1, 24.4, 0.6, dk, "s", 12);
    B(i - 0.42, 5.88, 0.84, 0.05, 26, "#18181B", 30, {r:0.01, cls:"s"});
    K.decal(200, 116, (c, w, h, dark) => { c.fillStyle = "#1E1F24"; c.fillRect(0, 0, w, h);
      if(k === 0){ const g = c.createLinearGradient(0, 0, 0, h * 0.62); g.addColorStop(0, "#F9C99B"); g.addColorStop(1, "#E8B5C8"); c.fillStyle = g; c.fillRect(w * 0.18, h * 0.06, w * 0.64, h * 0.56);
        c.fillStyle = "#3A2A30"; [[0.4, 0.42, 9], [0.52, 0.4, 10], [0.62, 0.46, 7]].forEach(([x, y, r]) => { c.beginPath(); c.arc(w * x, h * y, r, 0, 7); c.fill(); c.fillRect(w * x - r, h * y + r - 2, r * 2, h * 0.62 - h * y - r + 2); });
        c.fillStyle = "#FFFFFF"; c.font = "700 9px system-ui"; c.fillText("REC ● 유나네 집", w * 0.2, h * 0.7); }
      else { c.fillStyle = "#2C2D33"; c.fillRect(0, h * 0.08, w, h * 0.12); RB.forEach((col, r) => { let x = 4 + (r * 23) % 30; while(x < w - 10){ const ww = 18 + rnd(x + r * 31) * 34; c.fillStyle = col; c.fillRect(x, h * 0.26 + r * h * 0.11, Math.min(ww, w - x - 6), h * 0.08); x += ww + 4; } });
        c.fillStyle = "#E06A55"; c.fillRect(w * 0.46, h * 0.22, 2, h * 0.74); }
      c.fillStyle = dark ? "rgba(0,0,0,.1)" : "rgba(255,255,255,.04)"; c.fillRect(0, 0, w, h); }, 0.78, hz(23), "i", i, 5.93, hz(43)); });
  B(10.55, 6.12, 0.52, 0.22, 1.2, INK, 24.4, {r:0.02, cls:"s"}); disc(10.95, 6.23, 0.06, 25.6, 0.8, "#55555A", "s", 14);
  [[9.98, "#2A2A2C"], [11.64, "#2A2A2C"]].forEach(([i, cc]) => { B(i, 5.86, 0.18, 0.2, 9, cc, 24.4, {r:0.03, cls:"s"}); disc(i + 0.09, 6.065, 0.05, 28, 0.4, "#55555A", "s", 10); });
  });
  dirChair(11.6, 9.4);
  shift(4.0, 1.0, () => {
  B(11.45, 5.82, 0.26, 0.5, 18, dk, 0, {r:0.02, cls:"s"});
  chair(10.85, 6.95, "-j", D("#3A3A3E", "#2A2A2C"), PINK);
  dirChair(9.2, 8.1);
  // 상패장 (오른벽) · 트로피
  B(11.4, 6.95, 0.48, 1.85, 28, WHITE, 0, {r:0.02}); K.faceI(11.388, 7.05, 8.7, 4, 26, D("#DDE8F2", "#7A90B8"), "glass", 0.012);
  });
  shift(3.4, 1.75, () => {
  [[7.3, 1], [7.9, 1.25], [8.5, 1]].forEach(([j, s]) => { disc(11.64, j, 0.09 * s, 28, 1.2, WOODD, "s", 12); K.sm(K.cyl(0.03, 0.04, hz(6 * s), 10), GOLD, X(11.64), hz(29.2 + 3 * s), Z(j), null, "s");
    K.sm(myGeo(new THREE.CylinderGeometry(0.11 * s, 0.05 * s, hz(8 * s), 14)), GOLD, X(11.64), hz(35.2 + 4 * s + 2 * (s - 1)), Z(j), null, "s"); });
  [7.55, 8.2].forEach(j => { B(11.6, j - 0.12, 0.05, 0.24, 9, WOODD, 28, {r:0.01, cls:"s"}); B(11.588, j - 0.09, 0.012, 0.18, 6, GOLD, 29.5, {r:0, cls:"s"}); });
  // 삼각대 카메라 · 조명 (소프트박스)
  });
  { const li = 10.0, lj = 10.3; [0, 2.1, 4.2].forEach(a => rod([li + Math.cos(a) * 0.17, lj + Math.sin(a) * 0.17, 0], [li, lj, 20], 0.01, INK, "s", 6)); rod([li, lj, 20], [li, lj, 52], 0.012, INK, "s", 6);
    B(li - 0.15, lj - 0.25, 0.3, 0.5, 22, INK, 50, {r:0.02, cls:"s"}); K.faceI(li + 0.17, lj - 0.22, lj + 0.22, 52, 70, D("#FFFFFF", "#FFF4DC"), "glow", 0.012); }
  // 구경하는 소파 (왼벽 앞, 모니터 쪽을 봄)
  shift(0, 0.5, () => {
  const so = PINK, sd = D("#DDA2B8", "#6A4A58");
  B(9.78, 6.6, 0.78, 2.0, 10, so, 0, {r:0.07, seg:2}); B(9.52, 6.55, 0.28, 2.1, 26, sd, 0, {r:0.07, seg:2});
  B(9.52, 6.32, 1.04, 0.26, 17, sd, 0, {r:0.07, seg:2}); B(9.52, 8.62, 1.04, 0.26, 17, sd, 0, {r:0.07, seg:2});
  [6.66, 7.62].forEach(j => B(9.82, j, 0.7, 0.92, 2.6, D("#F7D6E2", "#7E5E6C"), 10, {r:0.06}));
  { const o = B(9.84, 7.0, 0.14, 0.5, 12, LILAC, 12.6, {r:0.06}); o.rotation.x = 0.15; }
  });
}
/* =================================================================== 4층: 다락방 · 옥상 정원 */
const ATI = 8.0, HJ = HD / 2;   // 다락은 i 0 ~ 8, 오른쪽은 옥상 · 용마루 j
function paint4(c, dark){
  const p = paintKit(c, dark), v = p.v;
  p.wood(-1, -1, ATI, 13, "#F1E2CC", "#4A3D30");
  p.deck(ATI, -1, 18, 13, "j");
  pshift(c, 0.6, 0.9, () => {
  c.fillStyle = v("#E2D6EA", "#4E4458"); [[3.3, 6.5, 0.75], [4.2, 6.3, 0.85], [5.0, 6.7, 0.6], [3.9, 7.1, 0.7]].forEach(([i, j, r]) => { c.beginPath(); c.arc(i, j, r, 0, 7); c.fill(); });
  c.fillStyle = v("#F7DCE6", "#6A4E5A"); [[3.3, 6.5, 0.62], [4.2, 6.3, 0.72], [5.0, 6.7, 0.47], [3.9, 7.1, 0.57]].forEach(([i, j, r]) => { c.beginPath(); c.arc(i, j, r, 0, 7); c.fill(); });
  });
  pshift(c, 3.6, 1.5, () => {
  p.rr(9.5, 5.8, 11.75, 8.65, 0.2, v("#8CC478", "#2E4A2C")); c.globalAlpha = dark ? 0.08 : 0.2; for(let k = 0; k < 500; k++){ c.fillStyle = k % 2 ? "#FFFFFF" : "#3E6E34"; c.fillRect(9.55 + rnd(k) * 2.15, 5.85 + rnd(k + 7) * 2.75, 0.04, 0.04); } c.globalAlpha = 1;
  });
  p.text("ROOFTOP ✿", 11.0, 10.45, 6, v("rgba(255,255,255,.4)", "rgba(255,255,255,.1)"));
  p.arrow("▼ 3층", 0.65, 4.65);
  p.glow(3.0, 2.8, 1.6, v("rgba(255,250,235,.2)", "rgba(255,190,150,.2)"));
}
function build4(){
  const paper = D("#F6ECF2", "#4E4450"), ext = D("#F3E9E4", "#4A403C");
  // 처마 쪽 낮은 뒷벽 (다락만) + 박공 왼벽 (오각형) + 용마루 · 서까래
  B(0, -BT, ATI, BT, KNEE, ext, 0, {r:0}); B(-BT, -BT, BT, BT, KNEE, ext, 0, {r:0}); B(-BT, -BT, ATI + BT, BT, 3, CAPC, KNEE, {r:0});
  K.faceJ(0, ATI, 0.0, 0, KNEE, paper, "m", 0.012); K.faceJ(0, ATI, 0.012, 0, 3.5, WHITE, "m", 0.012);
  { const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(HD + T / 2, 0); s.lineTo(HD + T / 2, hz(KNEE)); s.lineTo(HJ, hz(PEAK)); s.lineTo(0, hz(KNEE)); s.lineTo(0, 0);
    const g = myGeo(new THREE.ExtrudeGeometry(s, {depth:BT, bevelEnabled:false})); g.rotateY(-PI / 2); K.sm(g, paper, X(0), 0, Z(0), null, "m"); }
  K.faceI(0.0, 0, HD, 0, 3.5, WHITE, "m", 0.012);
  B(0, HJ - 0.07, ATI, 0.14, 6, WOODD, PEAK - 6, {r:0});
  for(let i = 0.6; i < ATI; i += 0.95){ rod([i, 0.06, KNEE + 1], [i, HJ - 0.07, PEAK - 5], 0.04, WOOD, "m", 6); rod([i, HJ + 0.07, PEAK - 5], [i, HD - 0.12, KNEE + 1], 0.04, WOOD, "m", 6); }
  winI(6.4, 7.4, 56, 80);
  slabHole(SA, "n"); glassRail(SJ0, SJ1, 1.34, "j"); glassRail(0.08, 1.22, SJ1 + 0.05, "i");
  // 다락 벽: 앞(j 11) · 옥상 쪽(i 8, 유리문 j 3.4~4.6)
  const fw = D("#F7EEF0", "#4A4044");
  wallI(0, ATI - T / 2, HD, fw, KNEE); wallJ(0, 3.4, ATI, fw, KNEE); wallJ(4.6, HD + T / 2, ATI, fw, KNEE); doorFrameJ(3.4, 4.6, ATI);
  // 다락: 영화 보는 매트리스 · 등쿠션 · 빔 프로젝터 · 스크린(박공벽) · 인디언 텐트 · 책장 · 푸프 · 흔들목마 · 장난감 상자
  B(1.8, 1.6, 1.4, 2.3, 9, WHITE, 0, {r:0.05}); B(1.84, 1.64, 1.32, 2.22, 1.6, PINK2, 9, {r:0.06});
  [[1.75, LILAC], [2.5, D("#A8DCC8", "#4E7A6E")], [3.25, D("#F6E39A", "#8A7A3A")]].forEach(([j, cc]) => B(2.95, j, 0.22, 0.62, 13, cc, 10.6, {r:0.08}));
  B(1.95, 1.75, 0.22, 0.4, 3, WHITE, 10.6, {r:0.08});
  K.sm(K.cyl(0.18, 0.18, hz(14), 16), WOOD, X(3.75), hz(7), Z(2.75), null, "m");
  B(3.6, 2.62, 0.3, 0.26, 5, WHITE, 14, {r:0.03, cls:"s"}); { const ln = K.cyl(0.05, 0.05, 0.06, 12); ln.rotateZ(PI / 2); K.sm(ln, INK, X(3.58), hz(16.5), Z(2.75), null, "s"); }
  disc(3.75, 3.05, 0.1, 14, 1.4, D("#F4A7B9", "#7A5866"), "s", 14); [[-0.03, 0], [0.03, 0.02], [0, -0.03]].forEach(([di, dj]) => ball(3.75 + di, 3.05 + dj, 16, 0.035, "#FFF4C2", "m", 6));
  K.faceI(0.012, 1.7, 4.3, 36, 62, WHITE, "m", 0.02);
  K.decal(300, 116, (c, w, h, dark) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#F9C99B"); g.addColorStop(0.6, "#E8B5C8"); g.addColorStop(1, "#C8B4D0"); c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = "#FFF4D6"; c.beginPath(); c.arc(w * 0.72, h * 0.55, h * 0.16, 0, 7); c.fill();
    c.fillStyle = "#6A4E6A"; c.fillRect(0, h * 0.76, w, h * 0.24);
    [[0.3, 0.5, 11], [0.38, 0.54, 10], [0.45, 0.62, 7]].forEach(([x, y, r]) => { c.beginPath(); c.arc(w * x, h * y, r, 0, 7); c.fill(); c.fillRect(w * x - r, h * y + r - 3, r * 2, h * 0.76 - h * y - r + 3); });
    c.fillStyle = "#FFFFFF"; c.font = "800 17px 'IBM Plex Sans KR', system-ui"; c.textAlign = "center"; c.fillText("우리 가족 영화관 🍿", w / 2, h * 0.2); }, 2.5, hz(24), "j", 0.034, 3.0, hz(49));
  shift(1.35, 0, () => {
  { const ti = 4.95, tj = 1.7, hh = hz(70); K.sm(myGeo(new THREE.ConeGeometry(0.62, hh, 10, 1, true)), PINK, X(ti), hh / 2, Z(tj), null, "m");
    const sl = myGeo(new THREE.ConeGeometry(0.625, hh, 10, 1, true, 0, PI / 5)); [1, 3, 6, 8].forEach(k => { const o = K.sm(sl, WHITE, X(ti), hh / 2 + 0.002, Z(tj), null, "m"); o.rotation.y = k * PI / 5; });
    const door = myGeo(new THREE.ConeGeometry(0.63, hh * 0.62, 10, 1, true, -PI / 7, PI * 2 / 7)); K.sm(door, D("#7A5866", "#3A2A30"), X(ti), hh * 0.31, Z(tj), null, "m");
    [[-0.08, 0.05], [0.08, 0.04], [0, -0.09]].forEach(([di, dj]) => rod([ti + di * 3, tj + dj * 3, 52], [ti - di * 2, tj - dj * 2, 86], 0.016, WOOD, "m", 5));
    for(let k = 0; k < 6; k++){ const a = k * 1.05; ball(ti + Math.cos(a) * 0.36, tj + Math.sin(a) * 0.36, 36 + (k % 2) * 3, 0.03, RB[k], "m", 6); } }
  });
  B(0.25, 0.05, 1.3, 0.38, 30, WHITE, 0, {r:0.02}); [[0.32, "#F4A7B9"], [0.48, "#A9CBEA"], [0.62, "#F6E39A"], [0.78, "#A8DCC8"], [0.94, "#C8B4D0"], [1.1, "#F9C99B"], [1.26, "#F4A7B9"]].forEach(([i, cc], k) => B(i, 0.1, 0.12, 0.3, 9 + (k % 3) * 1.5, cc, 2 + (k > 3 ? 13 : 0), {r:0.01}));
  K.sm(K.sph(0.12, 14, 10), D("#A9CBEA", "#4E6A88"), X(1.4), hz(30) + 0.15, Z(0.24), null, "m"); rod([1.4, 0.24, 30], [1.4, 0.24, 33], 0.03, GOLD, "s", 6);
  shift(0.6, 0.9, () => {
  [[3.4, 6.35, PINK], [4.6, 7.25, LILAC]].forEach(([i, j, cc]) => { K.sm(K.cyl(0.26, 0.28, hz(10), 18), cc, X(i), hz(5), Z(j), null, "m"); ball(i, j, 10.2, 0.04, WHITE, "m", 8); });
  });
  shift(1.35, 1.65, () => {
  { const hi = 5.45, hj = 8.15, br = D("#F7E4C8", "#8A7056"); const rk = K.sm(myGeo(new THREE.TorusGeometry(0.55, 0.03, 6, 20, PI * 0.6)), PINK, X(hi), hz(17), Z(hj - 0.12), null, "m"); rk.rotation.z = PI * 1.2; rk.rotation.y = PI / 2;
    const rk2 = K.sm(myGeo(new THREE.TorusGeometry(0.55, 0.03, 6, 20, PI * 0.6)), PINK, X(hi), hz(17), Z(hj + 0.12), null, "m"); rk2.rotation.z = PI * 1.2; rk2.rotation.y = PI / 2;
    const body = ball(hi, hj, 14, 0.2, br, "m", 14); body.scale.set(0.8, 0.8, 1.5); ball(hi, hj - 0.32, 21, 0.12, br, "m", 12); B(hi - 0.06, hj - 0.36, 0.12, 0.08, 4, PINK, 25, {r:0.03}); }
  });
  shift(1.6, 0.7, () => {
  B(5.3, 4.9, 0.72, 0.5, 12, D("#F4C7D4", "#7A5866"), 0, {r:0.04}); B(5.28, 4.88, 0.76, 0.54, 2, WHITE, 12, {r:0.04});
  });
  K.plant(0.45, 10.4, false);
  // 옥상: 유리 난간 · 텃밭 · 화분 · 망원경 · 테이블 · 빨래 · 선베드
  glassRail(ATI + 0.15, HW - 0.03, 0.03, "i"); glassRail(0.03, HD - 0.03, HW - 0.03, "j"); glassRail(ATI + 0.15, HW - 0.03, HD - 0.03, "i");
  shift(1.75, 0, () => {
  B(6.85, 0.35, 2.6, 0.8, 12, WOOD, 0, {r:0.02}); B(6.9, 0.4, 2.5, 0.7, 0.8, D("#7A5A3C", "#3A2A20"), 12, {r:0});
  for(let k = 0; k < 6; k++) ball(7.1 + k * 0.42, 0.62, 14.5, 0.13, K.sh("plant", (k % 2) * 0.14), "m", 10).scale.y = 0.7;
  [7.3, 8.15, 9.0].forEach(i => { rod([i, 0.95, 12.8], [i, 0.95, 26], 0.01, D("#5FA582", "#3E6E54"), "m", 5); [[-0.05, 20], [0.05, 23], [0, 17]].forEach(([d, z]) => ball(i + d, 0.95, z, 0.04, "#E04A3A", "m", 8)); });
  K.wtext("유나 텃밭 🌱", 8.15, 1.165, 6, "i", 2.6, D("#FFFFFF", "#E9D2B0"), null, 800, K.FONT);
  });
  [[8.9, 10.62, "#F4A7B9"], [9.65, 10.62, "#F6E39A"], [10.4, 10.62, "#C8B4D0"], [11.15, 10.62, "#F9C99B"], [15.62, 2.4, "#F4A7B9"], [15.62, 3.2, "#A9CBEA"], [15.62, 5.6, "#FFFFFF"], [15.62, 6.4, "#E06A55"]].forEach(([i, j, cc], k) =>
    flowerPot(i, j, cc, 0.8 + (k % 3) * 0.12, k % 2 ? PINK : D("#FFFFFF", "#8A847C")));
  K.plant(8.6, 2.2, true); K.plant(15.5, 10.4, true);
  shift(4.1, 0.2, () => {
  { const ti = 10.9, tj = 1.0; [0, 2.1, 4.2].forEach(a => rod([ti + Math.cos(a) * 0.26, tj + Math.sin(a) * 0.26, 0], [ti, tj, 30], 0.012, INK, "s", 6));
    rod([ti - 0.3, tj + 0.18, 26], [ti + 0.28, tj - 0.16, 42], 0.06, WHITE, "s", 12); rod([ti + 0.28, tj - 0.16, 42], [ti + 0.33, tj - 0.19, 43.5], 0.068, PINK, "s", 12); rod([ti - 0.3, tj + 0.18, 26], [ti - 0.36, tj + 0.2, 24], 0.02, INK, "s", 6); }
  });
  bistro(12.2, 5.2);
  laundry(9.6, 8.5);
  shift(3.6, 1.5, () => {
  B(10.3, 6.45, 0.62, 1.6, 8, WHITE, 0, {r:0.04}); B(10.33, 6.48, 0.56, 1.54, 2, PINK2, 8, {r:0.05}); { const bk = B(10.33, 6.42, 0.56, 0.5, 2, PINK2, 14, {r:0.05}); bk.rotation.x = -0.6; }
  B(11.1, 7.35, 0.4, 0.4, 14, WOOD, 0, {r:0.04}); K.sm(K.cyl(0.05, 0.05, hz(8), 10), D("#F6E39A", "#8A7A3A"), X(11.3), hz(18), Z(7.55), null, "glass");
  });
}
function buildDynamic(){
  const R = K.R, scene = R.scene;
  if(W.dyn.length){
    W.dcv = document.createElement("canvas"); W.dcv.width = DW; W.dcv.height = DH; W.dctx = W.dcv.getContext("2d");
    W.dtex = new THREE.CanvasTexture(W.dcv); W.dtex.colorSpace = THREE.SRGBColorSpace; W.dtex.anisotropy = 4;
    const dg = mergeGeometries(W.dgeo, false); W.dgeo.forEach(g => g.dispose());
    const dm = new THREE.Mesh(dg, K.cutaway(new THREE.MeshBasicMaterial({map:W.dtex, toneMapped:false, polygonOffset:true, polygonOffsetFactor:-3})));
    dm.renderOrder = 2; scene.add(dm); W.dm = dm; }
  const gc = document.createElement("canvas"); gc.width = gc.height = 64; { const x = gc.getContext("2d"), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.35, "rgba(255,255,255,.45)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(0, 0, 64, 64); }
  W.gtex = new THREE.CanvasTexture(gc);
  const gm = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), K.cutaway(new THREE.MeshBasicMaterial({map:W.gtex, transparent:true, blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false})), Math.max(1, W.glows.length));
  gm.frustumCulled = false; gm.renderOrder = 3; scene.add(gm); W.gm = gm;
  W.fxN = 16; W.fm = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 9), K.cutaway(new THREE.MeshStandardMaterial({roughness:0.6})), W.fxN); W.fm.frustumCulled = false; scene.add(W.fm);
  W.xN = 12; W.xm = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), K.cutaway(new THREE.MeshStandardMaterial({roughness:0.5})), W.xN); W.xm.frustumCulled = false; W.xm.castShadow = true; scene.add(W.xm);
}
function bulbLine(list){   // 전구 줄 (밤에만 반짝)
  W.bulbs = list; list.forEach(([i, j, z]) => gl(i, j, z, 9, "#FFD68C", (tm, dk) => dk ? 0.6 : 0));
  W.bm = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), K.cutaway(new THREE.MeshBasicMaterial({toneMapped:false})), list.length); W.bm.frustumCulled = false; K.R.scene.add(W.bm);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(0.035, 0.035, 0.035);
  list.forEach(([i, j, z], k) => { W.bm.setMatrixAt(k, m.compose(new THREE.Vector3(X(i), hz(z) - 0.03, Z(j)), q, s)); W.bm.setColorAt(k, new THREE.Color("#E6E1D8")); });
}
/* 유나 자전거 (2026-11-24 감독님 "집에 자전거라든지 … 이용거리들 많이 재밌게"): 움직이는 메시 (굳히지 않음). 앞 = +z, rotation.y = 유나 방향 h */
const BIKE_PARK = [10.8, 16.4, -PI / 2];
function buildBike(){
  const M = Merge(), fr = D("#F06BA8", "#B5607E"), wh = D("#FFFFFF", "#9A949C");
  const rodG = (a, b, r) => { const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b), d = vb.clone().sub(va), g = new THREE.CylinderGeometry(r, r, d.length(), 8);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())); g.translate(...va.clone().add(vb).multiplyScalar(0.5).toArray()); return g; };
  const wr = 0.2, wy = 0.21, zf = 0.33, zb = -0.33, bb = [0, 0.25, -0.02], st = [0, 0.5, -0.12], hd = [0, 0.56, 0.22];
  [zf, zb].forEach(z => { const t = new THREE.TorusGeometry(wr, 0.032, 8, 26); t.rotateY(PI / 2); t.translate(0, wy, z); M.add(t, INK);
    [0, PI / 3, 2 * PI / 3].forEach(a => { const sp = new THREE.BoxGeometry(0.01, wr * 2 - 0.04, 0.01); sp.rotateX(a); sp.translate(0, wy, z); M.add(sp, wh); });
    const hub = new THREE.CylinderGeometry(0.035, 0.035, 0.07, 10); hub.rotateZ(PI / 2); hub.translate(0, wy, z); M.add(hub, wh); });
  [[[0, wy, zb], bb], [[0, wy, zb], st], [bb, st], [bb, hd], [st, [0, 0.53, 0.2]], [[0, wy, zf], hd], [hd, [0, 0.64, 0.2]]].forEach(([a, b]) => M.add(rodG(a, b, 0.022), fr));
  M.add(rodG([0, 0.5, -0.12], [0, 0.56, -0.14], 0.016), INK); M.add(new THREE.BoxGeometry(0.13, 0.045, 0.2).translate(0, 0.58, -0.15), D("#FFFFFF", "#8A847C"));   // 안장
  M.add(rodG([-0.18, 0.66, 0.19], [0.18, 0.66, 0.19], 0.016), INK); [-0.18, 0.18].forEach(x => M.add(rodG([x, 0.66, 0.19], [x * 1.05, 0.66, 0.12], 0.022), PINK));   // 핸들 · 손잡이
  M.add(new THREE.BoxGeometry(0.24, 0.15, 0.17).translate(0, 0.52, 0.38), D("#FFFFFF", "#8A847C")); M.add(new THREE.BoxGeometry(0.2, 0.02, 0.13).translate(0, 0.6, 0.38), PINK);   // 앞 바구니
  M.add(new THREE.BoxGeometry(0.22, 0.025, 0.06).translate(0, 0.25, -0.02), INK);   // 페달
  M.add(rodG([0.03, 0.2, -0.08], [0.13, 0.0, -0.14], 0.012), INK);   // 받침대 (두발자전거, 2026-11-24 감독님)
  const m = dynMesh(M.geo()); m.position.set(X(BIKE_PARK[0]), 0, Z(BIKE_PARK[1])); m.rotation.y = BIKE_PARK[2]; return m;
}
function buildDyn1(){
  W.bike = buildBike();
  gl(3.72, 11.32, 50, 22, "#FFE2A8", (tm, dk) => dk ? 0.6 : 0);
  [8.6, 13.0].forEach(i => gl(i, 0.18, 70, 24, "#FFE2A8", (tm, dk) => dk ? 0.6 : 0.03));
  gl(3.4, 4.6, 84, 40, "#FFE8F4", (tm, dk) => dk ? 0.5 : 0.08);
  gl(18.4, 6.9, 8, 50, "#BFE8FF", (tm, dk) => dk ? 0.12 : 0.05);
  gl(14.81, 0.2, 54, 8, "#7FE0C8", (tm, dk) => dk ? 0.8 : 0.3);
}
function buildDyn2(){
  dplane(256, 144, 2.66, hz(41), 12.5, 0.32, hz(45.5), (c, w, h, tm) => drawTV(c, w, h, tm, K.R.dark), 0.015);
  gl(12.5, 0.5, 43, 70, "#BFE0FF", (tm, dk) => dk ? 0.28 : 0.1);
  [[6.85, 1.8], [6.85, 3.3]].forEach(([i, j]) => gl(i, j, 76, 26, "#FFD68C", (tm, dk) => dk ? 0.45 : 0.12));
  gl(15.05, 7.35, 64, 20, "#FFE2A8", (tm, dk) => dk ? 0.5 : 0.05);
  gl(GI, GJ, 27, 46, "#FF8A4A", () => W.grillOn ? 0.55 + Math.sin(K.clock() * 0.012) * 0.08 : 0);
}
function buildDyn3(){
  { const M = Merge(); M.add(K.cyl(0.006, 0.006, hz(12), 4), "#C9CDD2", 0, -hz(6), 0); M.add(K.rbox(0.5, 0.01, 0.01, 0), "#C9CDD2", 0, -hz(12), 0); M.add(K.rbox(0.01, 0.01, 0.5, 0), "#C9CDD2", 0, -hz(12), 0);
    const star = new THREE.OctahedronGeometry(0.07);
    [[0.25, 0, "#F6E39A"], [-0.25, 0, "#F4A7B9"], [0, 0.25, "#A9CBEA"], [0, -0.25, "#C8B4D0"]].forEach(([x, z, c], k) => { M.add(K.cyl(0.003, 0.003, hz(8 + k * 2), 4), "#E6E1D8", x, -hz(12 + (8 + k * 2) / 2), z); M.add(star, c, x, -hz(20 + k * 2) - 0.05, z); });
    M.add(K.sph(0.05, 10, 8), "#FFFFFF", 0, -hz(24), 0);
    W.mob = dynMesh(M.geo()); W.mob.position.set(X(0.77), hz(84), Z(1.25)); }
  gl(1.75, 0.42, 10, 22, "#FFB8CE", (tm, dk) => dk ? 0.6 : 0.06);
  [8.65, 11.7].forEach(i => gl(i + 0.27, 0.33, 27, 22, "#FFE2A8", (tm, dk) => dk ? 0.45 : 0.08));
  gl(3.88, 0.45, 41, 18, "#FFF0C8", (tm, dk) => dk ? 0.4 : 0.05);
  gl(15.55, 3.05, 28, 20, "#FFE8F4", (tm, dk) => dk ? 0.5 : 0.1);
  [12.9, 13.8].forEach(i => gl(i, 6.25, 43, 30, "#9FC8FF", (tm, dk) => dk ? 0.35 : 0.06));
  gl(10.25, 10.3, 61, 30, "#FFF4DC", (tm, dk) => dk ? 0.4 : 0.06);
}
function buildDyn4(){
  const L = [];
  for(let i = 0.3; i < ATI - 0.2; i += 0.4) L.push([i, HJ, PEAK - 12 - Math.sin((i - 0.3) / 0.8 * PI) * 2.5]);
  for(let i = ATI + 0.3; i < HW - 0.1; i += 0.42){ L.push([i, 0.06, 36 + Math.sin(i / 0.84 * PI) * 2.2]); L.push([i, HD - 0.06, 36 + Math.sin(i / 0.84 * PI) * 2.2]); }
  for(let j = 0.4; j < HD - 0.2; j += 0.42) L.push([HW - 0.06, j, 36 + Math.sin(j / 0.84 * PI) * 2.2]);
  bulbLine(L);
  gl(3.55, 2.75, 16.5, 16, "#FFF6E0", (tm, dk) => dk ? 0.7 : 0.1);
  gl(1.2, 3.0, 49, 80, "#FFD8C0", (tm, dk) => dk ? 0.16 : 0);
  gl(6.3, 1.7, 40, 40, "#FFC7D9", (tm, dk) => dk ? 0.45 : 0.05);
}

/* ---------- 매 프레임 ---------- */
const m4 = new THREE.Matrix4(), qn = new THREE.Quaternion(), v3 = new THREE.Vector3(), sc3 = new THREE.Vector3(), col = new THREE.Color(), e3 = new THREE.Euler(), ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
function fxSet(k, x, y, z, s, c){ if(k >= W.fxN) return; if(s <= 0){ W.fm.setMatrixAt(k, ZERO); return; } m4.compose(v3.set(x, y, z), qn.identity(), sc3.set(s, s * 0.9, s)); W.fm.setMatrixAt(k, m4); W.fm.setColorAt(k, col.set(c)); }
function boxSet(k, x, y, z, sx, sy, sz, c, ry = 0){ if(k >= W.xN) return; if(sx <= 0){ W.xm.setMatrixAt(k, ZERO); return; } e3.set(0, ry, 0); qn.setFromEuler(e3); m4.compose(v3.set(x, y, z), qn, sc3.set(sx, sy, sz)); W.xm.setMatrixAt(k, m4); W.xm.setColorAt(k, col.set(c)); }
function animate(tm, dt){
  const dk = !!K.R.dark, red = !!K.reduce;
  W.grillOn = !!(def.grillOn || (W.grillEgg && tm < W.grillEgg));
  let bx = 0, f = 0;
  if(FNO === 2){
    // 불판 위 고기 · 김
    [[-0.16, -0.1, 0.3], [0.08, -0.14, -0.4], [0.15, 0.1, 0.9], [-0.1, 0.13, -0.2], [0.0, 0.0, 1.4]].forEach(([di, dj, r], k) => {
      const flip = !red && W.grillOn ? Math.max(0, Math.sin(tm * 0.002 + k * 1.7)) ** 8 * 0.05 : 0;
      boxSet(bx++, X(GI + di), hz(26.6) + flip, Z(GJ + dj), W.grillOn ? 0.2 : 0, 0.025, 0.1, k % 2 ? "#C77B5A" : "#D99478", r); });
    boxSet(bx++, X(GI + 0.12), hz(26.6), Z(GJ + 0.18), W.grillOn ? 0.07 : 0, 0.03, 0.07, "#6FAE64");
    for(let k = 0; k < 6; k++){ const ph = (tm * 0.0005 + k / 6) % 1, r = (0.05 + 0.1 * ph) * (1 - ph * ph);
      fxSet(f++, X(GI + (red ? 0 : Math.sin(ph * 6 + k) * 0.08)), hz(28 + 30 * ph), Z(GJ), W.grillOn && !red ? r : 0, "#FFFFFF"); }
  } else if(FNO === 3){
    if(W.mob && !red) W.mob.rotation.y += dt * 0.5;
    for(let k = 0; k < 4; k++){ const ph = (tm * 0.00025 + k / 4) % 1; fxSet(f++, X(4.45 + Math.sin(k * 3) * 0.15), hz(15.5 + ph * 20), Z(8.9 + k * 0.45), red ? 0 : 0.045 * Math.sin(ph * PI), "#E8F4FF"); }
  } else if(FNO === 4){
    W.bulbs.forEach((b, k) => W.bm.setColorAt(k, col.set(dk ? "#FFE9B8" : "#E6E1D8"))); if(W.bm.instanceColor) W.bm.instanceColor.needsUpdate = true;
  } else {
    // 아기 수영장 물결 반짝
    for(let k = 0; k < 3; k++){ const ph = (tm * 0.0004 + k / 3) % 1; fxSet(f++, X(18.4 + Math.cos(k * 2.1) * 0.4), hz(5.8), Z(6.9 + Math.sin(k * 2.1) * 0.4), red ? 0 : 0.05 * Math.sin(ph * PI), "#FFFFFF"); }
  }
  while(bx < W.xN) boxSet(bx++, 0, 0, 0, 0);
  while(f < W.fxN) fxSet(f++, 0, 0, 0, 0);
  W.xm.instanceMatrix.needsUpdate = true; if(W.xm.instanceColor) W.xm.instanceColor.needsUpdate = true;
  W.fm.instanceMatrix.needsUpdate = true; if(W.fm.instanceColor) W.fm.instanceColor.needsUpdate = true;
  const cam = K.R.camera;
  W.glows.forEach((g, k) => { const a = g.a(tm, dk); if(!(a > 0)){ W.gm.setMatrixAt(k, ZERO); return; }
    col.copy(g.c); m4.compose(g.p, cam.quaternion, sc3.set(g.s, g.s, 1)); W.gm.setMatrixAt(k, m4); W.gm.setColorAt(k, col.multiplyScalar(Math.min(1, a))); });
  W.gm.instanceMatrix.needsUpdate = true; if(W.gm.instanceColor) W.gm.instanceColor.needsUpdate = true;
  if(W.dcv && (tm - W.dLast > 66 || W.dLast < 0)){ W.dLast = tm; const c = W.dctx; c.clearRect(0, 0, DW, DH);
    W.dyn.forEach(d => { c.save(); c.beginPath(); c.rect(d.r.x, d.r.y, d.r.w, d.r.h); c.clip(); c.translate(d.r.x, d.r.y); d.draw(c, d.r.w, d.r.h, tm); c.restore(); });
    W.dtex.needsUpdate = true; }
}

/* ---------- 방 꾸미기 (2026-11-28 감독님 "꾸미기"): 유나 방 벽지 · 이불 · 러그 · 장식. 유나 모드가 층 모듈의 room(state)로 넘김 ----------
   기본(base)은 원래 그림 그대로 두고, 고르면 그 위에 한 겹 덧씌움 (벽지 = 벽지 판 바로 앞 0.016, 이불 = 이불보다 살짝 큰 상자, 러그 = 바닥 위 0.006) */
const ROOM_WALL = [["base", "🌸", "분홍 벽"], ["cloud", "☁️", "구름 하늘"], ["star", "⭐", "별 가득"], ["stripe", "🍬", "사탕 줄무늬"], ["heart", "💗", "하트"], ["mint", "🫧", "민트 방울"], ["rainbow", "🌈", "꼬마 무지개"]],
  ROOM_BED = [["base", "💜", "보라 이불"], ["berry", "🍓", "딸기"], ["sky", "☁️", "구름"], ["check", "🌼", "노랑 체크"], ["star", "⭐", "민트 별"], ["rainbow", "🌈", "무지개 줄"]],
  ROOM_RUG = [["base", "🌈", "무지개 러그"], ["cloud", "☁️", "구름 러그"], ["berry", "🍓", "딸기 러그"], ["pitch", "⚽", "풋살장 러그"], ["heart", "💗", "하트 러그"], ["moon", "🌙", "달님 러그"]],
  ROOM_DECO = [["teddy", "🧸", "큰 곰인형"], ["balloon", "🎈", "풍선 다발"], ["plant", "🪴", "화분"], ["lamp", "⭐", "별 무드등"], ["unicorn", "🦄", "유니콘"], ["castle", "🏰", "블록 성"], ["gift", "🎁", "선물 상자"], ["tent", "🏕️", "인디언 텐트"]];
const ROOM_RECT = [0.35, 0.35, 6.05, 4.25], ROOM_MAX = 10;
function roomHeart(c, x, y, r){ c.beginPath(); c.moveTo(x, y + r * 0.9); c.bezierCurveTo(x - r * 1.5, y - r * 0.2, x - r * 0.6, y - r * 1.1, x, y - r * 0.35); c.bezierCurveTo(x + r * 0.6, y - r * 1.1, x + r * 1.5, y - r * 0.2, x, y + r * 0.9); c.fill(); }
function roomStar(c, x, y, r){ c.beginPath(); for(let k = 0; k < 10; k++){ const a = -PI / 2 + k * PI / 5, q = k % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); } c.fill(); }
function roomCloud(c, x, y, r){ c.beginPath(); [[-0.9, 0.15, 0.55], [-0.3, -0.2, 0.75], [0.45, -0.1, 0.65], [1.0, 0.2, 0.45]].forEach(([a, b, q]) => { c.moveTo(x + a * r + q * r, y + b * r); c.arc(x + a * r, y + b * r, q * r, 0, 7); }); c.rect(x - r * 1.1, y + r * 0.15, r * 2.3, r * 0.45); c.fill(); }
function roomBerry(c, x, y, r){ c.fillStyle = "#F25F6E"; c.beginPath(); c.moveTo(x, y + r); c.bezierCurveTo(x - r * 1.3, y, x - r * 0.8, y - r, x, y - r * 0.7); c.bezierCurveTo(x + r * 0.8, y - r, x + r * 1.3, y, x, y + r); c.fill();
  c.fillStyle = "#6FBF73"; c.beginPath(); c.ellipse(x, y - r * 0.8, r * 0.55, r * 0.22, 0, 0, 7); c.fill(); c.fillStyle = "#FFF3C4"; [[-0.3, -0.1], [0.3, -0.05], [0, 0.35], [-0.15, -0.45], [0.2, -0.4]].forEach(([a, b]) => { c.beginPath(); c.arc(x + a * r, y + b * r, r * 0.07, 0, 7); c.fill(); }); }
function roomWallPaint(c, k, dark){
  const S = 256; c.clearRect(0, 0, S, S);
  const bg = {cloud:"#CFE8F7", star:"#E4DAF2", stripe:"#FFF6F8", heart:"#FFF7EC", mint:"#D7F0E6", rainbow:"#FFFBF4"}[k] || "#FBE4EC"; c.fillStyle = bg; c.fillRect(0, 0, S, S);
  if(k === "cloud"){ c.fillStyle = "rgba(255,255,255,.95)"; [[60, 62, 26], [188, 150, 30], [84, 214, 20], [214, 40, 16]].forEach(([x, y, r]) => roomCloud(c, x, y, r)); }
  if(k === "star"){ [[40, 44, 13, "#FFE58A"], [150, 30, 8, "#FFFFFF"], [216, 96, 12, "#FFE58A"], [96, 128, 9, "#FFFFFF"], [34, 190, 9, "#FFFFFF"], [150, 204, 14, "#FFE58A"], [232, 226, 7, "#FFFFFF"]].forEach(([x, y, r, col]) => { c.fillStyle = col; roomStar(c, x, y, r); }); }
  if(k === "stripe"){ ["#F9C7D6", "#FFF6F8", "#CFE6F5", "#FFF6F8"].forEach((col, q) => { c.fillStyle = col; c.fillRect(q * 64, 0, 64, S); }); c.fillStyle = "rgba(255,255,255,.55)"; for(let q = 0; q < 4; q++) c.fillRect(q * 64 + 28, 0, 8, S); }
  if(k === "heart"){ [[48, 50, "#F4A7B9"], [176, 50, "#F9C7D6"], [112, 114, "#F4A7B9"], [240, 114, "#F9C7D6"], [-16, 114, "#F9C7D6"], [48, 178, "#F9C7D6"], [176, 178, "#F4A7B9"], [112, 242, "#F9C7D6"], [112, -14, "#F9C7D6"]].forEach(([x, y, col]) => { c.fillStyle = col; roomHeart(c, x, y, 17); }); }
  if(k === "mint"){ c.fillStyle = "rgba(255,255,255,.9)"; for(let y = 0; y < 4; y++) for(let x = 0; x < 4; x++){ c.beginPath(); c.arc(32 + x * 64 + (y % 2) * 32, 32 + y * 64, y % 2 ? 9 : 13, 0, 7); c.fill(); } }
  if(k === "rainbow"){ [[64, 86], [192, 214]].forEach(([x, y]) => { RB.forEach((col, q) => { c.strokeStyle = col; c.lineWidth = 6; c.beginPath(); c.arc(x, y, 40 - q * 6, PI, 0); c.stroke(); }); c.fillStyle = "#FFFFFF"; roomCloud(c, x - 38, y + 2, 9); roomCloud(c, x + 38, y + 2, 9); });
    c.fillStyle = "#F6E39A"; roomStar(c, 192, 60, 9); roomStar(c, 60, 190, 9); }
  if(dark){ c.fillStyle = "rgba(34,26,44,.62)"; c.fillRect(0, 0, S, S); }
}
function roomBedPaint(c, k, dark){
  const S = 256, bg = {berry:"#FFE3EA", sky:"#CFE8F7", check:"#FFF3C4", star:"#CDEBDD", rainbow:"#FFFFFF"}[k] || "#D9C6E6"; c.fillStyle = bg; c.fillRect(0, 0, S, S);
  if(k === "berry") for(let y = 0; y < 4; y++) for(let x = 0; x < 4; x++) roomBerry(c, 32 + x * 64 + (y % 2) * 32, 32 + y * 64, 15);
  if(k === "sky"){ c.fillStyle = "#FFFFFF"; [[56, 56, 22], [184, 120, 26], [72, 196, 20], [212, 228, 14]].forEach(([x, y, r]) => roomCloud(c, x, y, r)); }
  if(k === "check"){ c.fillStyle = "rgba(246,200,80,.55)"; for(let q = 0; q < 4; q++){ c.fillRect(q * 64, 0, 32, S); c.fillRect(0, q * 64, S, 32); } }
  if(k === "star"){ c.fillStyle = "#FFFFFF"; for(let y = 0; y < 4; y++) for(let x = 0; x < 4; x++) roomStar(c, 32 + x * 64 + (y % 2) * 32, 32 + y * 64, y % 2 ? 9 : 13); }
  if(k === "rainbow") RB.forEach((col, q) => { c.fillStyle = col; c.fillRect(0, q * S / 6, S, S / 6 + 1); });
  if(dark){ c.fillStyle = "rgba(34,26,44,.5)"; c.fillRect(0, 0, S, S); }
}
function roomRugPaint(c, k, dark){
  const W2 = 512, H2 = 420, cx = W2 / 2, cy = H2 / 2; c.clearRect(0, 0, W2, H2);
  const oval = (rx, ry, col) => { c.fillStyle = col; c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, 7); c.fill(); };
  if(k === "cloud"){ c.fillStyle = "#FFFFFF"; roomCloud(c, cx - 10, cy + 10, 150); c.fillStyle = "#E3F1FA"; roomCloud(c, cx - 6, cy + 22, 118); c.fillStyle = "#F4A7B9"; [[-70, 20], [70, 20]].forEach(([a, b]) => { c.beginPath(); c.ellipse(cx + a, cy + b, 20, 12, 0, 0, 7); c.fill(); });
    c.fillStyle = "#5A4A52"; [[-40, -4], [40, -4]].forEach(([a, b]) => { c.beginPath(); c.arc(cx + a, cy + b, 7, 0, 7); c.fill(); }); c.strokeStyle = "#5A4A52"; c.lineWidth = 5; c.lineCap = "round"; c.beginPath(); c.arc(cx, cy + 8, 16, 0.15 * PI, 0.85 * PI); c.stroke(); }
  if(k === "berry"){ oval(246, 200, "#FFFFFF"); oval(232, 186, "#FFE3EA"); roomBerry(c, cx, cy + 10, 120); }
  if(k === "pitch"){ c.fillStyle = "#FFFFFF"; c.beginPath(); c.roundRect(10, 10, W2 - 20, H2 - 20, 28); c.fill(); c.fillStyle = "#7CC68A"; c.beginPath(); c.roundRect(22, 22, W2 - 44, H2 - 44, 20); c.fill();
    c.fillStyle = "rgba(255,255,255,.18)"; for(let q = 0; q < 6; q += 2) c.fillRect(22 + q * (W2 - 44) / 6, 22, (W2 - 44) / 6, H2 - 44);
    c.strokeStyle = "#FFFFFF"; c.lineWidth = 6; c.strokeRect(40, 40, W2 - 80, H2 - 80); c.beginPath(); c.moveTo(cx, 40); c.lineTo(cx, H2 - 40); c.stroke(); c.beginPath(); c.arc(cx, cy, 52, 0, 7); c.stroke(); c.strokeRect(40, cy - 70, 64, 140); c.strokeRect(W2 - 104, cy - 70, 64, 140); }
  if(k === "heart"){ c.fillStyle = "#FFFFFF"; roomHeart(c, cx, cy + 6, 190); c.fillStyle = "#F9B8CC"; roomHeart(c, cx, cy + 6, 172); c.fillStyle = "#FFE3EC"; roomHeart(c, cx, cy, 104); }
  if(k === "moon"){ oval(246, 200, "#F6E39A"); oval(230, 186, "#3E3A6E"); c.fillStyle = "#FFE58A"; c.beginPath(); c.arc(cx - 20, cy, 92, 0, 7); c.fill(); c.fillStyle = "#3E3A6E"; c.beginPath(); c.arc(cx + 22, cy - 18, 80, 0, 7); c.fill();
    c.fillStyle = "#FFFFFF"; [[120, -70, 13], [150, 40, 9], [60, 96, 8], [-150, -84, 9], [-128, 96, 11]].forEach(([a, b, r]) => roomStar(c, cx + a, cy + b, r)); }
  if(dark){ c.globalCompositeOperation = "source-atop"; c.fillStyle = "rgba(34,26,44,.5)"; c.fillRect(0, 0, W2, H2); c.globalCompositeOperation = "source-over"; }
}
function roomDecoGeo(k){
  const M = Merge(), P = "#F4A7B9", L = "#C8B4D0", cone = (r, h, seg = 14) => myGeo(new THREE.ConeGeometry(r, h, seg));
  if(k === "teddy"){ const br = D("#C99A6B", "#6B4E38"), cr = D("#EAD3B6", "#8A7056");
    M.add(K.sph(0.27, 16, 12), br, 0, 0.26, 0); M.add(K.sph(0.2, 16, 12), br, 0, 0.62, 0.02); [-1, 1].forEach(s => { M.add(K.sph(0.075, 10, 8), br, s * 0.15, 0.8, 0); M.add(K.sph(0.04, 8, 6), cr, s * 0.15, 0.8, 0.04); M.add(K.sph(0.1, 10, 8), br, s * 0.27, 0.36, 0.08); M.add(K.sph(0.11, 10, 8), br, s * 0.17, 0.09, 0.2); M.add(K.sph(0.05, 8, 6), cr, s * 0.17, 0.09, 0.29); M.add(K.sph(0.022, 6, 5), "#2A211D", s * 0.07, 0.66, 0.2); });
    M.add(K.sph(0.085, 10, 8), cr, 0, 0.58, 0.17); M.add(K.sph(0.026, 6, 5), "#2A211D", 0, 0.61, 0.25); M.add(K.sph(0.15, 12, 10), cr, 0, 0.26, 0.17); M.add(K.sph(0.05, 8, 6), "#F06BA8", -0.07, 0.45, 0.2); M.add(K.sph(0.05, 8, 6), "#F06BA8", 0.07, 0.45, 0.2); M.add(K.sph(0.03, 6, 5), "#F06BA8", 0, 0.45, 0.22); }
  if(k === "balloon"){ M.add(K.rbox(0.2, 0.14, 0.2, 0.03), P, 0, 0.07, 0); [[-0.2, 1.42, 0.05, "#FF8FB8", -0.14], [0.02, 1.62, -0.04, "#FFD84D", 0.02], [0.24, 1.38, 0.08, "#8FC8F0", 0.17], [0.05, 1.22, 0.2, "#C8B4D0", 0.05]].forEach(([x, y, z, c, rz]) => {
      const b = myGeo(new THREE.SphereGeometry(0.19, 16, 12)); b.scale(1, 1.18, 1); M.add(b, c, x, y, z); M.add(cone(0.035, 0.05, 8), c, x, y - 0.235, z, PI); const len = y - 0.36; M.add(myGeo(new THREE.CylinderGeometry(0.004, 0.004, len, 4)), "#EDE6E0", x / 2, 0.12 + len / 2, z / 2, z / 2 / len * 1.0, 0, -x / 2 / len * 2.0); }); }
  if(k === "plant"){ M.add(K.cyl(0.19, 0.14, 0.3, 16), D("#FFFFFF", "#8A8088"), 0, 0.15, 0); M.add(K.cyl(0.2, 0.2, 0.04, 16), P, 0, 0.3, 0); M.add(K.cyl(0.02, 0.025, 0.5, 6), D("#7A9A5A", "#4E6A42"), 0, 0.55, 0);
    [[0, 0.95, 0, 0.2], [-0.2, 0.78, 0.04, 0.16], [0.2, 0.74, -0.03, 0.17], [0.05, 0.68, 0.18, 0.14], [-0.06, 0.7, -0.17, 0.13]].forEach(([x, y, z, r]) => { const g = myGeo(new THREE.SphereGeometry(r, 12, 9)); g.scale(1, 0.72, 1); M.add(g, D("#6FAE64", "#3E6E54"), x, y, z); }); }
  if(k === "lamp"){ M.add(K.cyl(0.16, 0.18, 0.04, 16), D("#FFFFFF", "#8A8088"), 0, 0.02, 0); M.add(K.cyl(0.018, 0.018, 0.86, 8), D("#F2C94C", "#B89432"), 0, 0.45, 0);
    const st = myGeo(new THREE.OctahedronGeometry(0.2)); st.scale(1, 1.15, 0.55); M.add(st, D("#FFE58A", "#FFF0B0"), 0, 1.02, 0); [[-0.2, 0.8, 0.07], [0.22, 0.86, 0.06]].forEach(([x, y, r]) => { const g = myGeo(new THREE.OctahedronGeometry(r)); M.add(g, D("#FFF3C4", "#FFF7D8"), x, y, 0.02); }); }
  if(k === "unicorn"){ const w = D("#FFFFFF", "#B8B0BC"); const bd = myGeo(new THREE.SphereGeometry(0.26, 16, 12)); bd.scale(1.35, 0.9, 0.95); M.add(bd, w, 0, 0.42, 0);
    [[-0.2, -0.13], [0.2, -0.13], [-0.2, 0.13], [0.2, 0.13]].forEach(([x, z]) => M.add(K.cyl(0.055, 0.06, 0.28, 8), w, x, 0.14, z)); M.add(K.cyl(0.09, 0.11, 0.3, 10), w, 0.27, 0.68, 0, 0, 0, -0.5); M.add(K.sph(0.15, 14, 10), w, 0.37, 0.84, 0);
    M.add(K.sph(0.085, 10, 8), D("#FCE3EC", "#B898A6"), 0.5, 0.8, 0); M.add(cone(0.035, 0.22, 10), D("#F2C94C", "#B89432"), 0.42, 1.03, 0, 0, 0, -0.35); [-1, 1].forEach(s => { M.add(cone(0.04, 0.09, 6), w, 0.33, 0.98, s * 0.08); M.add(K.sph(0.02, 6, 5), "#2A211D", 0.46, 0.87, s * 0.1); });
    RB.forEach((c, q) => { M.add(K.sph(0.065, 8, 6), c, 0.27 - q * 0.045, 0.95 - q * 0.075, 0); M.add(K.sph(0.055, 8, 6), c, -0.36 - (q % 3) * 0.03, 0.5 - q * 0.05, (q % 2 - 0.5) * 0.08); }); }
  if(k === "castle"){ const w = D("#FFF6F8", "#8A7A80"); M.add(K.rbox(0.7, 0.42, 0.5, 0.02), w, 0, 0.21, 0); [-1, 1].forEach(s => { M.add(K.cyl(0.14, 0.14, 0.72, 14), s < 0 ? P : L, s * 0.36, 0.36, 0); M.add(cone(0.18, 0.28), s < 0 ? L : P, s * 0.36, 0.86, 0); });
    M.add(K.rbox(0.3, 0.3, 0.3, 0.02), D("#FCE9B8", "#8A7A50"), 0, 0.57, 0); M.add(cone(0.24, 0.3, 4), P, 0, 0.87, 0, 0, PI / 4); M.add(K.rbox(0.16, 0.24, 0.02, 0.01), D("#D49AB0", "#6A4E5A"), 0, 0.12, 0.251); [-0.2, 0.2].forEach(x => M.add(K.rbox(0.09, 0.09, 0.02, 0), D("#A9CBEA", "#4A5A6E"), x, 0.28, 0.251));
    M.add(K.cyl(0.006, 0.006, 0.2, 4), "#C9CDD2", 0, 1.1, 0); M.add(K.rbox(0.1, 0.06, 0.008, 0), "#FFD84D", 0.05, 1.16, 0); }
  if(k === "gift"){ M.add(K.rbox(0.46, 0.34, 0.46, 0.03), P, 0, 0.17, 0); M.add(K.rbox(0.48, 0.345, 0.08, 0.01), "#FFFFFF", 0, 0.17, 0); M.add(K.rbox(0.08, 0.345, 0.48, 0.01), "#FFFFFF", 0, 0.17, 0); [-1, 1].forEach(s => { const g = myGeo(new THREE.SphereGeometry(0.08, 10, 8)); g.scale(1.3, 0.7, 0.8); M.add(g, "#FFFFFF", s * 0.09, 0.39, 0, 0, 0, s * 0.4); });
    M.add(K.rbox(0.28, 0.22, 0.28, 0.03), D("#A9CBEA", "#4A5A6E"), 0.34, 0.11, 0.22, 0, 0.4); M.add(K.rbox(0.3, 0.225, 0.05, 0.01), "#FFE58A", 0.34, 0.11, 0.22, 0, 0.4); M.add(K.sph(0.05, 8, 6), "#FFE58A", 0.34, 0.25, 0.22); }
  if(k === "tent"){ const c1 = myGeo(new THREE.ConeGeometry(0.62, 1.25, 6, 1, true)); M.add(c1, D("#FCE3EC", "#8A6A78"), 0, 0.625, 0, 0, PI / 6); for(let q = 0; q < 6; q++){ const a = q * PI / 3 + PI / 6; M.add(myGeo(new THREE.CylinderGeometry(0.012, 0.012, 1.5, 5)), D("#C9A27A", "#6B4E38"), Math.sin(a) * 0.27, 0.72, Math.cos(a) * 0.27, Math.cos(a) * 0.42, 0, -Math.sin(a) * 0.42); }
    M.add(myGeo(new THREE.CircleGeometry(0.5, 6)), D("#E2D6EA", "#4E4458"), 0, 0.012, 0, -PI / 2, 0, PI / 6); RB.forEach((c, q) => { const a = q * PI / 3 + PI / 3; M.add(cone(0.05, 0.1, 3), c, Math.sin(a) * 0.5, 0.2, Math.cos(a) * 0.5, PI, a); }); M.add(K.sph(0.1, 10, 8), "#FFE58A", 0, 0.1, 0); }
  return M.geo();
}
function roomBuild(){
  const R = K.R, mk = (w, h) => { const cv = document.createElement("canvas"); cv.width = w; cv.height = h; const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.anisotropy = 4; return {cv, c:cv.getContext("2d"), tx}; };
  const A = W.room = {wall:mk(256, 256), bed:mk(256, 256), rug:mk(512, 420), deco:[], st:{wall:"base", bed:"base", rug:"base", deco:[]}, sig:""};
  const tile = (g, u, v) => { const a = g.attributes.uv; for(let k = 0; k < a.count; k++) a.setXY(k, a.getX(k) * u, a.getY(k) * v); return g; }, Hh = hz(TALL), T2 = 1.45;
  const wm = K.cutaway(new THREE.MeshStandardMaterial({map:A.wall.tx, roughness:0.92}));
  const gb = tile(new THREE.PlaneGeometry(6.4, Hh), 6.4 / T2, Hh / T2), gl2 = tile(new THREE.PlaneGeometry(RJ, Hh), RJ / T2, Hh / T2);
  A.wb = new THREE.Mesh(gb, wm); A.wb.position.set(X(3.2), Hh / 2, Z(0) + 0.016); A.wl = new THREE.Mesh(gl2, wm); A.wl.rotation.y = PI / 2; A.wl.position.set(X(0) + 0.016, Hh / 2, Z(RJ / 2));
  const bm = new THREE.MeshStandardMaterial({map:A.bed.tx, roughness:0.85}), bg = new THREE.BoxGeometry(1.3, hz(3.4), 1.42);
  A.bd = new THREE.Mesh(bg, K.cutaway(bm)); A.bd.position.set(X(0.77), hz(15) + hz(3.4) / 2, Z(1.63)); A.bd.castShadow = true;
  const rm = new THREE.MeshStandardMaterial({map:A.rug.tx, roughness:0.95, transparent:true, alphaTest:0.5, polygonOffset:true, polygonOffsetFactor:-2, polygonOffsetUnits:-2}), rg = new THREE.PlaneGeometry(2.86, 2.34); rg.rotateX(-PI / 2);
  A.rg = new THREE.Mesh(rg, rm); A.rg.position.set(X(3.05), 0.006, Z(2.55)); A.rg.renderOrder = 1;
  [A.wb, A.wl, A.bd, A.rg].forEach(m => { m.receiveShadow = true; m.visible = false; R.scene.add(m); });
}
function roomApply(st, force){
  const A = W && W.room; if(!A) return false; const dk = !!K.R.dark, S = A.st, n = {wall:st?.wall || "base", bed:st?.bed || "base", rug:st?.rug || "base", deco:(st?.deco || []).slice(0, ROOM_MAX)};
  if(force || n.wall !== S.wall || dk !== A.dk){ A.wb.visible = A.wl.visible = n.wall !== "base"; if(n.wall !== "base"){ roomWallPaint(A.wall.c, n.wall, dk); A.wall.tx.needsUpdate = true; } }
  if(force || n.bed !== S.bed || dk !== A.dk){ A.bd.visible = n.bed !== "base"; if(n.bed !== "base"){ roomBedPaint(A.bed.c, n.bed, dk); A.bed.tx.needsUpdate = true; } }
  if(force || n.rug !== S.rug || dk !== A.dk){ A.rg.visible = n.rug !== "base"; if(n.rug !== "base"){ roomRugPaint(A.rug.c, n.rug, dk); A.rug.tx.needsUpdate = true; } }
  const sig = JSON.stringify(n.deco);
  if(sig !== A.sig){ A.sig = sig; A.deco.forEach(m => { m.removeFromParent(); m.geometry.dispose(); const q = W.recolor.indexOf(m); if(q >= 0) W.recolor.splice(q, 1); }); A.deco = [];
    n.deco.forEach(d => { if(!ROOM_DECO.some(x => x[0] === d.k)) return; const m = dynMesh(roomDecoGeo(d.k)); m.position.set(X(d.i), 0, Z(d.j)); m.rotation.y = d.h || 0; m.receiveShadow = true;
      if(dk){ const u = m.geometry.userData; m.geometry.attributes.color.array.set(u.D); m.geometry.attributes.color.needsUpdate = true; } A.deco.push(m); }); }
  A.st = n; A.dk = dk; return true;
}

/* ---------- 유나 모드에 넘길 것 (yuna_game.js SEATS 형식: a~b 선분 또는 a 한 점, h = 보는 쪽(0 = +j, PI/2 = +i, PI = −j), H = 앉는 면 높이, k = 대사 종류, f = 앞에서만) ---------- */
const H = px => px / 31.1;
export const HOME = {
  room:{wall:ROOM_WALL, bed:ROOM_BED, rug:ROOM_RUG, deco:ROOM_DECO, rect:ROOM_RECT, max:ROOM_MAX},   // 방 꾸미기 고를 것 (2026-11-28)
  bike:{park:BIKE_PARK, set(i, j, h){ if(!W || !W.bike) return; W.bike.position.set(X(i), 0, Z(j)); W.bike.rotation.y = h; }},   // 유나 모드: 자전거 타기
  floors:{home1:"./floor3d_home.js", home2:"./floor3d_home.js?f=2", home3:"./floor3d_home.js?f=3", home4:"./floor3d_home.js?f=4"},
  names:{home1:"집1층 현관·주차장·마당", home2:"집2층 거실·부엌", home3:"집3층 방", home4:"집4층 다락·옥상"},
  gate:[4.8, 17.45], spawnGate:[4.8, 16.75, PI],   // 1층 대문 (보도 쪽). 여기 닿으면 로비 횡단보도 건너편으로 · 로비에서 오면 spawnGate
  /* 계단: f 층의 at 에 닿으면 to 층 spawn 으로. 들어올 때만 (반경 0.45 밖에 한 번 나갔다가 다시 들어오면) 발동 */
  stairs:[
    {f:"home1", at:[0.65, 8.95], to:"home2", spawn:[3.2, 4.65, PI / 2]},
    {f:"home2", at:[0.65, 4.6], to:"home1", spawn:[2.1, 9.0, PI / 2]},
    {f:"home2", at:[1.95, 4.6], to:"home3", spawn:[3.2, 9.0, PI]},
    {f:"home3", at:[1.95, 8.95], to:"home2", spawn:[3.2, 4.65, PI / 2]},
    {f:"home3", at:[0.65, 8.95], to:"home4", spawn:[2.1, 4.65, PI / 2]},
    {f:"home4", at:[0.65, 4.6], to:"home3", spawn:[3.2, 9.0, PI]}],
  seats:{
    home1:[{a:[2.5, 0.55], b:[3.5, 0.55], h:0, H:H(15.6), k:"bench"}, {a:[17.75, 1.4], b:[19.95, 1.4], h:0, H:H(12.4), k:"deck"},
      {a:[17.75, 14.2], h:PI / 2, H:H(19.5), k:"garden"}, {a:[19.05, 14.2], h:-PI / 2, H:H(19.5), k:"garden"}, {a:[19.6, 9.5], h:0, H:H(12.5), k:"swing"}],
    home2:[{a:[5.6, 4.75], h:PI / 2, H:H(19.5), k:"dine"}, {a:[5.6, 6.05], h:PI / 2, H:H(22.5), k:"dine"}, {a:[8.1, 4.75], h:-PI / 2, H:H(19.5), k:"dine"}, {a:[8.1, 6.05], h:-PI / 2, H:H(19.5), k:"dine"},
      {a:[11.2, 6.62], b:[13.8, 6.62], h:PI, H:H(12.6), k:"sofa", f:1}, {a:[14.8, 4.05], h:-2.46, H:H(12), k:"beanbag"}, {a:[10.4, 9.6], h:PI, H:H(8), k:"pouf"}, {a:[11.9, 9.6], h:PI, H:H(8), k:"pouf"}],
    home3:[{a:[1.28, 0.95], b:[1.28, 2.05], h:PI / 2, H:H(16.5), k:"bed"}, {a:[4.25, 1.28], h:PI, H:H(19.5), k:"desk"}, {a:[9.8, 2.05], b:[11.1, 2.05], h:0, H:H(16.5), k:"bed"},
      {a:[14.9, 2.85], h:PI / 2, H:H(14.5), k:"vanity"}, {a:[13.35, 7.15], h:PI, H:H(19.5), k:"studio"}, {a:[11.6, 9.4], h:PI, H:H(16.6), k:"dir"}, {a:[10.3, 7.45], b:[10.3, 8.8], h:PI / 2, H:H(12.6), k:"sofa"}],
    home4:[{a:[2.3, 1.95], b:[2.3, 3.55], h:-PI / 2, H:H(10.6), k:"attic"}, {a:[4.0, 7.25], h:0, H:H(10), k:"pouf"}, {a:[5.2, 8.15], h:-PI / 2, H:H(10), k:"pouf"},
      {a:[11.6, 5.2], h:PI / 2, H:H(19.5), k:"roof"}, {a:[12.8, 5.2], h:-PI / 2, H:H(19.5), k:"roof"}, {a:[14.2, 8.8], h:0, H:H(10), k:"sun"}]},
  sitLines:{bench:["장화 신고 나가자 ☔", "엄마 기다리는 중~ 🎒"], deck:["데크에서 아이스크림 🍦", "아빠 고기 언제 구워? 🍖"],
    garden:["마당에서 먹는 간식 최고 🍪", "햇볕 좋다~ ☀️"], swing:["더 높이 더 높이! 🎶", "하늘까지 갈 거야 ☁️"],
    dine:["고기 언제 구워요? 🥩", "아빠 상추 싸 주세요 🥬", "잘 먹겠습니다! 😋"], beanbag:["말랑말랑~ 빈백 최고 💛", "여기서 낮잠 잘래 😴"],
    bed:["폭신폭신~ 잠이 솔솔 😴", "곰돌이랑 같이 잘래 🧸"], desk:["숙제 끝! ✏️", "아빠 그림 그려야지 🖍️"], vanity:["엄마처럼 예뻐져야지 💄", "구름 무드등 예쁘다 ☁️"],
    studio:["아빠처럼 편집해 볼까? 🎬", "타임라인 알록달록 🌈"], dir:["레디~ 액션! 🎬", "아빠 의자 내 거다 😎"],
    attic:["팝콘 먹으면서 영화 보자 🍿", "다락방 아지트 최고 🏕️"], pouf:["말랑 방석 콩! 💜", "여기 내 자리야~", "책 읽기 딱 좋다 📚"], roof:["옥상 바람 시원하다 🍃", "방울토마토 따 먹자 🍅"], sun:["옥상에서 일광욕 ☀️", "구름이 솜사탕 같아 ☁️"]},
};

/* ---------- 층 정의 ---------- */
const ZONES = {
  1:{h_entry:{name:"현관", color:"#C8B4D0", rect:[0, 0, FOY, HD], label:[3.0, 0, "top"]},
     h_park:{name:"주차장", color:"#A9CBEA", rect:[FOY, 0, HW, HD], label:[11.0, 0, "top"]},
     h_side:{name:"옆 정원", color:"#E8B5C8", rect:[HW, 0, SIDE, HD], label:[18.7, 0, "top"]},
     h_yard:{name:"앞마당", color:"#72C4AE", rect:[-0.3, HD, SIDE, YJ], label:[10.5, YJ, "bottom"]}},
  2:{h_kitchen:{name:"부엌·식탁", color:"#C8B4D0", rect:[0, 0, 8.6, 7.2], label:[4.3, 0, "top"]},
     h_living:{name:"거실", color:"#E8B5C8", rect:[8.6, 0, HW, HD], label:[HW, 5.5, "side"]},
     h_wc:{name:"게스트 화장실", color:"#A9CBEA", rect:[2.7, 7.5, 4.6, HD], label:[3.65, HD, "bottom"]}},
  3:{h_yuna:{name:"유나 방", color:"#E8B5C8", rect:[0, 0, 6.4, RJ], label:[3.2, 0, "top"]},
     h_master:{name:"엄마아빠 방", color:"#C8B4D0", rect:[6.4, 0, HW, RJ], label:[11.2, 0, "top"]},
     h_bath:{name:"욕실", color:"#A9CBEA", rect:[3.8, FJ, 7.2, HD], label:[5.5, HD, "bottom"]},
     h_bath2:{name:"작은 욕실", color:"#A8DCC8", rect:[7.2, FJ, 9.4, HD], label:[8.3, HD, "bottom"]},
     h_studio:{name:"아빠 편집실", color:"#E8A04A", rect:[9.4, FJ, HW, HD], label:[12.7, HD, "bottom"]}},
  4:{h_attic:{name:"다락방", color:"#C8B4D0", rect:[0, 0, ATI, HD], label:[4.0, 0, "top"]},
     h_roof:{name:"옥상 정원", color:"#72C4AE", rect:[ATI, 0, HW, HD], label:[12.0, 0, "top"]}}};
const EXT1 = [-0.4, -0.4, 21.8, 18.2], EXT2 = [-0.4, -0.4, 16.4, 11.4];
const notch = ni => [[0, 0], [HW, 0], [HW, HD], [0, HD], [0, SJ1], [ni, SJ1], [ni, SJ0], [0, SJ0]];
const def = {
  id:"home" + FNO,
  zones:ZONES[FNO],
  outline:FNO === 1 ? [[EXT1[0], EXT1[1]], [EXT1[2], EXT1[1]], [EXT1[2], EXT1[3]], [EXT1[0], EXT1[3]]] : notch(FNO === 4 ? SA.i1 : SB.i1),
  ext:FNO === 1 ? EXT1 : EXT2,
  top:3.7,
  allPts:V => FNO === 1 ? [V(-0.4, 0, -0.4), V(21.8, 0, -0.4), V(21.8, 0, 18.2), V(-0.4, 0, 18.2), V(-0.25, 3.7, -0.25), V(HW, 3.7, -0.25), V(-0.25, 3.7, HD)]
    : [V(-0.25, 0, -0.25), V(HW, 0, -0.25), V(HW, -0.4, HD), V(-0.25, -0.4, HD), V(-0.25, 3.7, -0.25), V(HW, 3.7, -0.25), V(-0.25, 3.7, HD)],
  lamps:{1:[[3.2, 4.4, 2.6], [11.0, 4.0, 2.6], [18.6, 3.0, 2.4], [10.5, 14.2, 2.2]], 2:[[6.85, 4.0, 2.6], [12.5, 4.0, 2.7], [4.0, 8.4, 2.4], [12.0, 9.0, 2.4]], 3:[[2.8, 1.8, 2.6], [10.5, 1.8, 2.6], [13.0, 8.2, 2.4], [5.5, 8.5, 2.4]], 4:[[3.0, 3.0, 2.6], [12.0, 5.5, 2.4]]}[FNO],
  glow:{1:{color:0xFFC8B0, at:[3.4, 4.6, 2.6]}, 2:{color:0xFFB08A, at:[GI, GJ, 1.2]}, 3:{color:0xFFB8D8, at:[1.75, 0.6, 0.6]}, 4:{color:0xFFD8B0, at:[3.0, 2.8, 0.8]}}[FNO],
  eggs:[],
  people:[],
  grillOn:false,   // 부모(이야기 모드)가 2층 모듈에서 true로 켜면 식탁 불판에 고기·김
  paintFloor(c, dark){ [null, paint1, paint2, paint3, paint4][FNO](c, dark); },
  build(KIT){
    K = wrapKit(KIT); OI = OJ = 0; LG.length = 0;
    W = {recolor:[], dyn:[], dgeo:[], dA:{x:2, y:2, row:0}, dLast:-1, glows:[], grillEgg:0, bulbs:[], extraBoxes:[]};
    const egg = (id, at, emo, lines, say) => ({id, at, emo, lines, say});
    def.eggs = {
      1:[egg("h_mail", [3.38, 17.0, 34], ["💌", "📬"], ["유나 앞으로 편지 왔어요 💌", "할머니가 보낸 소포 📦"]),
         egg("h_swing", [19.6, 9.5, 40], ["🎶", "☁️"], ["그네 타고 싶다~ 🎶"]),
         egg("h_bbq", [20.55, 3.6, 44], ["🍖", "🔥"], ["주말엔 마당 바비큐! 🍖", "아빠 그릴 담당 🔥"]),
         egg("h_pool", [18.4, 6.9, 14], ["🐤", "💦"], ["첨벙첨벙 수영장 💦", "오리야 같이 놀자 🐤"]),
         egg("h_coat", [2.46, 0.1, 66], ["☔", "🎒"], ["비 오는 날은 노란 우비 ☔", "가방 챙겼어요! 🎒"]),
         egg("h_photo", [0.05, 1.9, 92], ["🖼️", "♥"], ["유나가 그린 우리 가족 그림 🖍️"]),
         egg("h_tesla", [12.75, 4.2, 82], ["🚗", "⚡"], ["테슬라 충전 중 ⚡", "모델Y 타고 드라이브 가자 🚗"]),
         egg("h_aveo", [8.6, 3.9, 72], ["🚙", "💨"], ["우리 집 아베오 🚙", "아베오도 반짝반짝 세차 완료 ✨"])],
      2:[egg("h_grill", [GI, GJ, 30], ["🥩", "🔥", "😋"], ["지글지글~ 고기 굽는다 🥩", "상추 쌈 싸 먹자 🥬", "아빠가 구워 줄게! 🔥"], (k, g, line) => { W.grillEgg = K.clock() + 12000; return line; }),
         egg("h_tv", [12.5, 0.4, 52], ["📺", "🌈"], ["크레용팜 TV 방송 중 📺", "유나 최애 만화 시간! 🦄", "아빠 웹드라마 재방송 🎬"]),
         egg("h_fridge", [0.6, 0.8, 60], ["🧊", "🍰"], ["엄마가 숨겨 둔 딸기 케이크 발견 🍰", "아이스크림은 하루 하나! 🍦"]),
         egg("h_chalk", [0.05, 2.05, 60], ["🖍️", "🥩"], ["오늘 저녁은 삼겹살 파티!"]),
         egg("h_island", [6.85, 2.6, 40], ["🥬", "📺"], ["엄마가 상추 씻는 중 🥬", "아일랜드에서 거실 TV가 다 보여 📺"]),
         egg("h_wc", [3.65, 10.4, 30], ["🚽", "🧻"], ["똑똑! 누구 있어요? 🚽"])],
      3:[egg("h_bear", [1.0, 0.62, 34], ["🧸", "💤"], ["곰돌이 이름은 몽실이 🧸", "쉿, 몽실이 자는 중 💤"]),
         egg("h_mobile", [0.77, 1.25, 66], ["⭐", "🌙"], ["반짝반짝 작은 별~ ⭐"]),
         egg("h_doll", [5.38, 2.97, 28], ["🏠", "👧"], ["인형집에 손님 왔어요 🏠"]),
         egg("h_vanity", [15.6, 2.85, 44], ["💄", "☁️"], ["엄마 화장대: 예운옥 구름 무드등 ☁️"]),
         egg("h_duck", [4.45, 9.35, 22], ["🛁", "🐤"], ["삑삑! 오리 인형 🐤", "거품 목욕 🛁"]),
         egg("h_edit", [13.35, 6.15, 52], ["🎬", "🖥️"], ["아빠 편집 중… 쉿! 🎬", "타임라인이 무지개 같아 🌈"]),
         egg("h_award", [15.64, 8.9, 46], ["🏆", "✨"], ["아빠 상 받은 거 💛 반짝반짝 🏆"])],
      4:[egg("h_tent", [6.3, 1.7, 78], ["🏕️", "✨"], ["다락방 비밀 텐트 🏕️", "여기는 유나 아지트!"]),
         egg("h_movie", [0.05, 3.0, 66], ["🍿", "🎞️"], ["오늘 밤은 가족 영화관 🍿"]),
         egg("h_scope", [15.0, 1.2, 48], ["🔭", "🌙"], ["별 보러 옥상에 올라왔어 🔭"]),
         egg("h_veggie", [9.9, 0.75, 24], ["🥬", "🍅"], ["상추 따서 고기 싸 먹자 🥬", "방울토마토 빨갛게 익었다 🍅"]),
         egg("h_horse", [6.8, 9.8, 30], ["🐴", "🎠"], ["이랴~ 흔들목마 출발 🐴"])]}[FNO];
    [null, build1, build2, build3, build4][FNO]();
    [null, buildDyn1, buildDyn2, buildDyn3, buildDyn4][FNO](); buildDynamic();
    if(FNO === 3) roomBuild();
  },
  room(st){ return FNO === 3 ? roomApply(st) : false; },   // 유나 모드: 방 꾸미기 상태 넘기기
  init(KIT){ LG.forEach(g => g.dispose()); LG.length = 0; },
  tick(KIT, now, t, dt){
    if(W.extraBoxes.length && KIT.R && KIT.R.boxes && !W.boxDone){ W.boxDone = true;   // 트리포 차 막기 상자를 엔진 목록에 더함
      KIT.R.boxes = Float32Array.from([...KIT.R.boxes, ...W.extraBoxes.flat()]); KIT.R.pg = null; }
    animate(KIT.clock ? KIT.clock() : now, dt); },
  theme(KIT, dark){ if(!W) return; if(W.room) setTimeout(() => { if(W && W.room) roomApply(W.room.st, true); }, 0); W.recolor.forEach(m => { const u = m.geometry.userData, a = m.geometry.attributes.color; if(u && u.L && a){ a.array.set(dark ? u.D : u.L); a.needsUpdate = true; } }); },
};
export default def;
