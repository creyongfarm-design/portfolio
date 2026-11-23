/* 동네 공원·놀이터 3D (2026-11-24 감독님 "세계관 팍팍 늘려봐, 지역도 늘리고") — tower3d_floor.js 층 정의, 유나 모드로만 감
   로비 앞 건너편 보도 서쪽 끝 → 여기. 아래 가운데 대문 (15, 21.3)에 닿으면 로비로, 들어오면 (15, 20.5)에서 공원 안쪽(−j)을 봄
   칸 좌표 i 0~30 · j 0~22 (울타리 i −0.5 · 30.5, j −0.5 · 21.7). 유나 키 ≈ 1칸(1.28m) 기준 실제 크기로:
     미끄럼틀 발판 1.19 · 그네 앉는 판 0.37 · 벤치 0.4 · 시소 판 0.42 · 정글짐 1.42 · 아이스크림 트럭 2.1
   구역: 놀이터(왼쪽 뒤, 고무 바닥) · 꽃밭·화장실(가운데 뒤) · 분수 광장(가운데) · 연못·나무 다리(오른쪽 뒤) · 피크닉 잔디(왼쪽 앞) · 아이스크림 트럭(오른쪽 앞)
   움직이는 것 (굳히지 않는 메시): 그네 판 둘 · 시소 판 · 뺑뺑이 · 트럭 위 아이스크림 · 오리 다섯 · 나비 · 분수 물 · 비눗방울 · 반딧불
   유나 막기: 굳힌 가구는 엔진이 상자로 막음. 움직이는 기구 · 정글짐 · 연못 물은 W.extraBoxes (첫 tick에 엔진 목록에 더함, 집 차와 같은 방식)
   깜빡임 방지: 같은 쪽을 보는 면이 겹치지 않게 0.02씩 어긋나게, 바닥에 붙는 것은 그림(paintFloor)으로 */
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const PI = Math.PI;
const RB = ["#F4A7B9", "#F9C99B", "#F6E39A", "#A8DCC8", "#A9CBEA", "#C8B4D0"];
const rnd = k => { const v = Math.sin(k * 12.9898) * 43758.5453; return v - Math.floor(v); };
const H = px => px / 31.1;

/* ---------- 배치 (칸) ---------- */
const EXT = [-1.2, -1.2, 31.2, 23.6];
const FI0 = -0.5, FI1 = 30.5, FJ0 = -0.5, FJ1 = 21.7, GW = [13.75, 16.25];   // 울타리 · 대문 기둥
const GATE = [15, 21.3], SPAWN = [15, 20.5, PI];
const PC = [15, 12.0], PR = 3.4, FB = 1.56;                                  // 분수 광장 가운데 · 반지름 · 수반 바깥 반지름
const MAT = [0.6, 0.6, 11.4, 10.4];                                          // 놀이터 고무 바닥
const SL = {i0:1.6, i1:2.6, j0:1.4, j1:2.4, z:37, lad:3.5, c0:2.6, c1:5.0, ex:5.5};   // 미끄럼틀: 발판 · 사다리 끝 · 미끄럼판 시작·끝 · 내리막 끝
const SW = {i0:7.0, i1:10.2, j:2.0, zp:56, zs:11.5, si:[7.85, 9.35]};       // 그네: 윗대 높이 · 앉는 판 높이 · 판 두 개
const SW_L = H(SW.zp) - H(SW.zs);                                            // 그네 줄 길이 1.43
const JG = {i0:1.0, j0:5.0, c:0.8, ni:3, nj:2, lv:22};                       // 정글짐 3×2칸 · 2층
const MG = {ci:6.3, cj:6.0, r:0.85, ride:0.58};                              // 뺑뺑이
const SS = {ci:9.6, cj:5.6, yp:0.34, arm:1.15, half:1.27};                   // 시소: 축 높이 · 앉는 자리까지 · 판 반 길이
const SB = {i0:1.2, j0:7.6, i1:3.9, j1:9.9};                                 // 모래놀이터
const HOP = {i0:5.25, i1:6.25, j1:10.1};                                     // 사방치기
const SPR = [10.5, 8.5];                                                     // 스프링 오리
const PD = {ci:24.6, cj:5.3, ri:4.1, rj:2.7};                                // 연못
const BR = {i0:21.5, i1:22.5, c:22.0};                                       // 나무 다리 (j 방향)
const TR = {i0:21.6, ib:24.6, i1:25.95, j0:14.2, j1:15.8, w0:22.15, w1:24.05};   // 아이스크림 트럭: 짐칸 · 운전석 · 창
const DOG = [18.5, 18.4], BUB = [10.6, 15.0], PIC = [4.8, 16.6], BLK = [8.4, 18.3];
const LAMPS = [[11.75, 10.5], [18.25, 10.5], [11.9, 15.7], [18.1, 15.7], [5.4, 13.35], [28.9, 13.2], [19.9, 1.6]];
const BENCH = [[12.5, 14.6, PI], [17.5, 14.6, PI], [8.4, 10.8, PI], [27.2, 9.75, PI]];   // 모두 −j(분수·놀이터·연못)를 봄. 돌려 놓으면 막는 상자가 커져서 축에 맞춤
const TABLES = [[21.0, 18.3], [25.9, 18.5]];
const RIM = [25, 155, 270].map(d => d * PI / 180);                           // 분수 가장자리 앉는 곳 (각도)

/* 연못 모양: 찌그러진 타원 */
const pr = a => 1 + 0.07 * Math.sin(3 * a + 0.6) + 0.04 * Math.cos(5 * a + 1.3);
const pondPt = (a, d = 0) => { const r = pr(a); return [PD.ci + (PD.ri * r + d) * Math.cos(a), PD.cj + (PD.rj * r + d) * Math.sin(a)]; };
const POND = Array.from({length:120}, (_, k) => pondPt(k / 120 * 2 * PI));
function inPoly(poly, x, y){ let c = false; for(let a = 0, b = poly.length - 1; a < poly.length; b = a++){ const [xa, ya] = poly[a], [xb, yb] = poly[b]; if((ya > y) !== (yb > y) && x < (xb - xa) * (y - ya) / (yb - ya) + xa) c = !c; } return c; }
function pondSpan(i){ let lo = 1e9, hi = -1e9; for(let j = PD.cj - PD.rj * 1.3; j <= PD.cj + PD.rj * 1.3; j += 0.03) if(inPoly(POND, i, j)){ lo = Math.min(lo, j); hi = Math.max(hi, j); } return hi > lo ? [lo, hi] : null; }
const BRJ = (() => { let lo = 1e9, hi = -1e9; for(let i = BR.i0; i <= BR.i1 + 1e-6; i += 0.1){ const s = pondSpan(i); if(s){ lo = Math.min(lo, s[0]); hi = Math.max(hi, s[1]); } } return [lo - 0.5, hi + 0.5]; })();
const BRZ = j => 9 * Math.sin(PI * Math.max(0, Math.min(1, (j - BRJ[0]) / (BRJ[1] - BRJ[0]))));   // 다리 판 높이 (px, 가운데 0.29칸)
const DUCK_SPOT = (() => { const s = pondSpan(25.6); return [25.6, +(s[1] + 0.62).toFixed(2)]; })();   // 오리 밥 주는 곳 (연못 앞 가장자리)
const SLIDE_Z = i => 35 - Math.max(0, Math.min(1, (i - SL.c0) / (SL.c1 - SL.c0))) * 31;           // 미끄럼판 윗면 (px)

let K = null, W = null;
const X = i => K.X(i), Z = j => K.Z(j), hz = p => K.hz(p);
const D = (l, d) => [l, d];
const B = (i, j, w, d, h, col, z0 = 0, o = {}) => K.B(i, j, w, d, h, col, z0, o);
const PINK = D("#E8B5C8", "#7A5866"), PINK2 = D("#F4D3DF", "#6A4E5A"), LILAC = D("#C8B4D0", "#5E4E68"), LILAC2 = D("#E2D6EA", "#4E4458"),
  SPROUT = D("#4DAA97", "#2F6E62"), LEAF = D("#72C4AE", "#3E7A6C"), AMBER = D("#E8A04A", "#9A6A2E"), AMBER2 = D("#F6D29A", "#7A6040"),
  PAPER = D("#FAF7F2", "#3A3632"), WHITE = D("#FFFFFF", "#8A847C"), WOOD = D("#D9B98F", "#6B5440"), WOODD = D("#A98258", "#4E3C2C"),
  SKY = D("#A9CBEA", "#4E6A88"), MINT = D("#A8DCC8", "#4E7A6E"), YEL = D("#F6E39A", "#8A7A3A"), PEACH = D("#F9C99B", "#8A6A4E"),
  STONE = D("#EEE7DC", "#55504A"), STONE2 = D("#DCD2C4", "#46413C"), IRON = D("#3E5C55", "#4E6A64"), GOLD = D("#E8C36A", "#B8964A"),
  CHAIN = D("#B9BEC4", "#6A6E74"), INK = "#2A2A28", HEDGE = D("#7DBE7A", "#2F5236");
const LG = [];
const myGeo = g => { LG.push(g); return g; };
function rod(a, b, r, col, cls = "s", seg = 8){
  const A = new THREE.Vector3(X(a[0]), hz(a[2]), Z(a[1])), C = new THREE.Vector3(X(b[0]), hz(b[2]), Z(b[1])), len = A.distanceTo(C); if(len < 1e-4) return;
  const o = K.sm(K.cyl(r, r, len, seg), col, (A.x + C.x) / 2, (A.y + C.y) / 2, (A.z + C.z) / 2, null, cls); o.lookAt(C); o.rotateX(PI / 2); return o;
}
const ball = (i, j, zp, r, col, cls = "m", seg = 12) => K.sm(K.sph(r, seg, Math.max(6, seg * 0.75 | 0)), col, X(i), hz(zp), Z(j), null, cls);
const disc = (i, j, r, zp, hp, col, cls = "m", seg = 24) => { const Hh = Math.max(0.006, hz(hp)); return K.sm(K.cyl(r, r, Hh, seg), col, X(i), hz(zp) + Hh / 2, Z(j), null, cls); };
/* 두 점 사이 막대 도형 (움직이는 메시용, 로컬 좌표) */
const rodG = (a, b, r, seg = 8) => { const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b), d = vb.clone().sub(va), g = new THREE.CylinderGeometry(r, r, d.length(), seg);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())); g.translate(...va.clone().add(vb).multiplyScalar(0.5).toArray()); return g; };
/* 정점 색 한 덩어리 (움직이는 물건, 낮·밤 두 벌) — 집(floor3d_home.js)과 같음 */
function Merge(){
  const parts = [], m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  return {
    add(g, col, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = null){ e.set(rx, ry, rz); q.setFromEuler(e); m4.compose(new THREE.Vector3(x, y, z), q, s ? new THREE.Vector3(...s) : new THREE.Vector3(1, 1, 1)); parts.push({g, c:K.cp(col), m:m4.clone()}); },
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
const gl = (i, j, zp, rpx, col, a) => { const g = {p:new THREE.Vector3(X(i), hz(zp), Z(j)), s:rpx / 31.3 * 2, c:new THREE.Color(col), a}; W.glows.push(g); return g; };
const block = (i0, j0, i1, j1, top) => W.extraBoxes.push([X(i0), Z(j0), X(i1), Z(j1), 0.02, top]);   // 유나 막기 상자 (top < 0.3 이면 올라설 수 있는 낮은 단)

/* ---------- 바닥 그림 도구 (집과 같음) ---------- */
function paintKit(c, dark){
  const v = (l, d) => dark ? d : l, FS = K.FS;
  const rect = (i0, j0, i1, j1, col) => { c.fillStyle = col; c.fillRect(i0, j0, i1 - i0, j1 - j0); };
  const rr = (i0, j0, i1, j1, r, col) => { c.fillStyle = col; c.beginPath(); c.roundRect(i0, j0, i1 - i0, j1 - j0, r); c.fill(); };
  const line = (i0, j0, i1, j1, col, w = 0.02) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(i0, j0); c.lineTo(i1, j1); c.stroke(); };
  const text = (t, i, j, size, col, w = 800, fam = K.FONT) => { c.save(); c.translate(i, j); c.scale(1 / FS, 1 / FS); c.font = `${w} ${size / 31.3 * FS}px ${fam}`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = col; c.fillText(t, 0, 0); c.restore(); };
  const glow = (i, j, r, c0) => { const g = c.createRadialGradient(i, j, 0, i, j, r); g.addColorStop(0, c0); g.addColorStop(1, "rgba(255,240,210,0)"); c.fillStyle = g; c.beginPath(); c.arc(i, j, r, 0, 7); c.fill(); };
  const poly = (pts, col) => { c.fillStyle = col; c.beginPath(); pts.forEach(([i, j], k) => k ? c.lineTo(i, j) : c.moveTo(i, j)); c.closePath(); c.fill(); };
  const path = (pts, w, col, edge) => { c.lineCap = c.lineJoin = "round"; [[edge, w + 0.14], [col, w]].forEach(([cc, ww]) => { c.strokeStyle = cc; c.lineWidth = ww; c.beginPath(); pts.forEach(([i, j], k) => k ? c.lineTo(i, j) : c.moveTo(i, j)); c.stroke(); }); };
  const arrow = (t, i, j) => { rr(i - 0.55, j - 0.17, i + 0.55, j + 0.17, 0.17, v("rgba(232,181,200,.6)", "rgba(232,181,200,.2)")); text(t, i, j, 5.2, v("#9A4E6A", "#F4C7D4")); };
  return {v, rect, rr, line, text, glow, poly, path, arrow};
}

/* =================================================================== 바닥 */
function paintPark(c, dark){
  const p = paintKit(c, dark), v = p.v, [e0, f0, e1, f1] = EXT;
  // 잔디 · 잔디 깎은 줄 · 결 · 토끼풀 꽃
  p.rect(e0, f0, e1, f1, v("#B9DA9E", "#2E4530"));
  c.save(); c.globalAlpha = dark ? 0.04 : 0.08; c.fillStyle = "#FFFFFF"; for(let k = -26; k < 34; k += 2.2) p.poly([[k, f0], [k + 1.1, f0], [k + 1.1 + 13, f1], [k + 13, f1]], "#FFFFFF"); c.restore();
  c.globalAlpha = dark ? 0.07 : 0.14; for(let k = 0; k < 4200; k++){ c.fillStyle = k % 3 ? "#FFFFFF" : "#4E7E46"; c.fillRect(e0 + rnd(k) * (e1 - e0), f0 + rnd(k + 91) * (f1 - f0), 0.05, 0.05); } c.globalAlpha = 1;
  for(let k = 0; k < 160; k++){ const i = e0 + rnd(k * 3 + 7) * (e1 - e0), j = f0 + rnd(k * 5 + 11) * (f1 - f0); c.fillStyle = v(k % 4 ? "rgba(255,255,255,.8)" : "rgba(246,227,154,.9)", "rgba(255,255,255,.12)"); c.beginPath(); c.arc(i, j, 0.04, 0, 7); c.fill(); }
  // 대문 밖 보도 (로비 가는 길)
  p.rect(e0, FJ1 + 0.15, e1, f1, v("#E3DDD2", "#3A3734")); p.rect(e0, FJ1 + 0.1, e1, FJ1 + 0.18, v("#BDB5A9", "#4A4642"));
  for(let i = e0; i < e1; i += 0.8) p.line(i, FJ1 + 0.18, i, f1, v("rgba(0,0,0,.08)", "rgba(255,255,255,.05)"), 0.016);
  p.text("← 크레용타워 로비", 9.2, 22.75, 6.5, v("rgba(90,80,70,.5)", "rgba(220,210,190,.3)"));
  // 산책로
  const pc = v("#EFE1C8", "#4A4238"), pe = v("#DCC8A8", "#3A332C");
  p.path([[e0, 12.0], [PC[0], 12.0], [e1, 12.0]], 1.5, pc, pe);
  p.path([[PC[0], 12.0], [PC[0], f1]], 2.4, pc, pe);
  p.path([[PC[0], 12.0], [PC[0], 2.6]], 1.0, pc, pe);
  { const ring = Array.from({length:73}, (_, k) => pondPt(k / 72 * 2 * PI, 0.95)); p.path(ring, 1.1, pc, pe); }
  p.path([[24.0, 12.0], [24.0, 13.6]], 1.4, pc, pe);
  p.path([[3.0, 12.0], [3.0, 10.6]], 1.2, pc, pe); p.path([[9.6, 12.0], [9.6, 10.6]], 1.0, pc, pe);
  for(let k = 0; k < 900; k++){ const i = e0 + rnd(k * 7 + 3) * (e1 - e0), j = f0 + rnd(k * 13 + 5) * (f1 - f0); c.fillStyle = v("rgba(150,120,80,.09)", "rgba(0,0,0,.12)"); c.fillRect(i, j, 0.06, 0.06); }
  // 분수 광장: 동심원 타일 · 줄눈
  { const [ci, cj] = PC; c.fillStyle = v("#F5EBDF", "#45403A"); c.beginPath(); c.arc(ci, cj, PR, 0, 7); c.fill();
    c.strokeStyle = v("#DCC7B2", "#5A5048"); c.lineWidth = 0.12; c.beginPath(); c.arc(ci, cj, PR - 0.06, 0, 7); c.stroke();
    [[3.0, v("#F4CBD8", "#5A4650")], [2.35, v("#D9EDE4", "#3E5048")], [1.9, v("#E9DDF0", "#4A4252")]].forEach(([r, cc]) => { c.strokeStyle = cc; c.lineWidth = 0.32; c.beginPath(); c.arc(ci, cj, r, 0, 7); c.stroke(); });
    for(let k = 0; k < 48; k++){ const a = k / 48 * 2 * PI; p.line(ci + Math.cos(a) * 1.65, cj + Math.sin(a) * 1.65, ci + Math.cos(a) * (PR - 0.1), cj + Math.sin(a) * (PR - 0.1), v("rgba(120,90,70,.12)", "rgba(255,255,255,.05)"), 0.016); }
    for(let k = 0; k < 8; k++){ const a = k / 8 * 2 * PI + 0.2; p.text(k % 2 ? "♡" : "✿", ci + Math.cos(a) * 2.68, cj + Math.sin(a) * 2.68, 7, v("rgba(232,160,190,.55)", "rgba(232,181,200,.2)")); }
    // 수반 안 바닥 (물 밑): 하늘색 타일 · 동전
    c.fillStyle = v("#7FC9D8", "#1E3E52"); c.beginPath(); c.arc(ci, cj, FB - 0.18, 0, 7); c.fill();
    for(let k = 0; k < 7; k++) p.line(ci - 1.35, cj - 1.2 + k * 0.4, ci + 1.35, cj - 1.2 + k * 0.4, v("rgba(255,255,255,.18)", "rgba(255,255,255,.05)"), 0.02);
    for(let k = 0; k < 7; k++) p.line(ci - 1.2 + k * 0.4, cj - 1.35, ci - 1.2 + k * 0.4, cj + 1.35, v("rgba(255,255,255,.18)", "rgba(255,255,255,.05)"), 0.02);
    for(let k = 0; k < 14; k++){ const a = rnd(k + 300) * 7, r = 0.4 + rnd(k + 310) * 0.8; c.fillStyle = k % 3 ? "#E8C36A" : "#C9CDD2"; c.beginPath(); c.arc(ci + Math.cos(a) * r, cj + Math.sin(a) * r, 0.05, 0, 7); c.fill(); } }
  // 연못: 자갈 둘레 · 깊어지는 물 · 물고기 그림자
  { p.poly(Array.from({length:120}, (_, k) => pondPt(k / 120 * 2 * PI, 0.32)), v("#E3D3B6", "#4A4236"));
    for(let k = 0; k < 220; k++){ const a = rnd(k + 500) * 7, [i, j] = pondPt(a, 0.05 + rnd(k + 520) * 0.25); c.fillStyle = v(["#CFC2AE", "#EFE6D6", "#BFB3A0"][k % 3], "rgba(255,255,255,.06)"); c.beginPath(); c.arc(i, j, 0.04 + rnd(k + 540) * 0.04, 0, 7); c.fill(); }
    const g = c.createRadialGradient(PD.ci, PD.cj, 0.3, PD.ci, PD.cj, PD.ri * 1.1); g.addColorStop(0, v("#3E98A6", "#10283A")); g.addColorStop(0.75, v("#6EC0C2", "#1E4458")); g.addColorStop(1, v("#A6DCCF", "#2C5866"));
    c.fillStyle = g; c.beginPath(); POND.forEach(([i, j], k) => k ? c.lineTo(i, j) : c.moveTo(i, j)); c.closePath(); c.fill();
    [[23.4, 4.4, 0.4, "#F28C5A"], [26.2, 6.3, -0.6, "#FFFFFF"], [25.2, 3.8, 2.5, "#F2A04A"], [27.3, 5.0, 1.4, "#F28C5A"]].forEach(([i, j, r, cc]) => { c.save(); c.translate(i, j); c.rotate(r); c.globalAlpha = dark ? 0.25 : 0.55; c.fillStyle = cc;
      c.beginPath(); c.ellipse(0, 0, 0.22, 0.08, 0, 0, 7); c.fill(); c.beginPath(); c.moveTo(-0.2, 0); c.lineTo(-0.34, -0.08); c.lineTo(-0.34, 0.08); c.fill(); c.restore(); }); }
  // 놀이터 고무 바닥: 파스텔 타일 · 고무 알갱이 · 그네 · 미끄럼틀 밑 닳은 자리
  { const [a, b, cc, d] = MAT; p.rr(a - 0.12, b - 0.12, cc + 0.12, d + 0.12, 0.6, v("#E9C7D3", "#3E3038")); p.rr(a, b, cc, d, 0.5, v("#F6DCE4", "#4A3A42"));
    const TC = [v("#F4C7D4", "#5A4450"), v("#E2D6EA", "#4A4256"), v("#CDEBDF", "#3A4E48"), v("#FBE2C8", "#54463A"), v("#FFF1F5", "#4E4248")];
    c.save(); c.beginPath(); c.roundRect(a, b, cc - a, d - b, 0.5); c.clip();
    for(let i = a, n = 0; i < cc; i += 1.0) for(let j = b; j < d; j += 1.0, n++){ c.fillStyle = TC[Math.floor(rnd(n * 3.1 + 2) * TC.length)]; c.fillRect(i + 0.02, j + 0.02, 0.96, 0.96); }
    c.globalAlpha = dark ? 0.08 : 0.16; for(let k = 0; k < 2600; k++){ c.fillStyle = k % 2 ? "#FFFFFF" : "#B07A90"; c.fillRect(a + rnd(k + 33) * (cc - a), b + rnd(k + 77) * (d - b), 0.035, 0.035); } c.globalAlpha = 1;
    SW.si.forEach(si => { c.fillStyle = v("rgba(170,110,130,.16)", "rgba(0,0,0,.18)"); c.beginPath(); c.ellipse(si, SW.j, 0.32, 0.9, 0, 0, 7); c.fill(); });
    c.fillStyle = v("rgba(170,110,130,.14)", "rgba(0,0,0,.16)"); c.beginPath(); c.ellipse(5.9, 1.9, 0.5, 0.4, 0, 0, 7); c.fill();
    c.restore();
    // 사방치기
    const hop = [[1], [2], [3, 4], [5], [6, 7], [8]]; hop.forEach((row, r) => row.forEach((nn, q) => { const j1 = HOP.j1 - r * 0.5, j0 = j1 - 0.48, w = (HOP.i1 - HOP.i0) / row.length, i0 = HOP.i0 + q * w;
      p.rr(i0 + 0.03, j0, i0 + w - 0.03, j1, 0.05, v("rgba(255,255,255,.9)", "rgba(255,255,255,.25)")); p.rr(i0 + 0.07, j0 + 0.04, i0 + w - 0.07, j1 - 0.04, 0.04, v(RB[(nn - 1) % 6], "rgba(200,180,210,.25)"));
      p.text(String(nn), i0 + w / 2, (j0 + j1) / 2, 7, v("#FFFFFF", "rgba(255,255,255,.6)"), 900); }));
    c.fillStyle = v("rgba(255,255,255,.9)", "rgba(255,255,255,.25)"); c.beginPath(); c.arc((HOP.i0 + HOP.i1) / 2, HOP.j1 - 3.2, 0.42, PI, 0); c.fill(); p.text("하늘", (HOP.i0 + HOP.i1) / 2, HOP.j1 - 3.38, 5, v("#C27A96", "#F4C7D4"));
    p.text("✿ 놀이터 ✿", 9.6, 10.05, 6.5, v("rgba(176,100,130,.55)", "rgba(244,199,212,.25)")); }
  // 모래놀이터 모래
  { const [a, b, cc, d] = [SB.i0, SB.j0, SB.i1, SB.j1]; p.rect(a, b, cc, d, v("#F2DDB0", "#5A4E38"));
    c.globalAlpha = 0.35; for(let k = 0; k < 500; k++){ c.fillStyle = k % 2 ? "#FFF6DC" : "#C9AC78"; c.fillRect(a + rnd(k + 900) * (cc - a), b + rnd(k + 950) * (d - b), 0.04, 0.04); } c.globalAlpha = 1; }
  // 꽃밭 흙
  [[12.7, 3.4, 14.6, 7.2], [15.4, 3.4, 18.4, 7.2]].forEach(([a, b, cc, d]) => { p.rr(a, b, cc, d, 0.25, v("#9A7454", "#3A2C22")); c.globalAlpha = 0.25; for(let k = 0; k < 220; k++){ c.fillStyle = k % 2 ? "#C8A07A" : "#6A4E36"; c.fillRect(a + rnd(k + a * 9) * (cc - a), b + rnd(k + 40 + a) * (d - b), 0.05, 0.05); } c.globalAlpha = 1; });
  // 트럭 마당: 민트 · 크림 바둑판 · 바닥 글씨
  { p.rr(20.2, 13.4, 28.8, 19.8, 0.4, v("#F7EDE0", "#433C35")); c.save(); c.beginPath(); c.roundRect(20.2, 13.4, 8.6, 6.4, 0.4); c.clip();
    for(let i = 20.2, n = 0; i < 28.8; i += 0.6) for(let j = 13.4; j < 19.8; j += 0.6, n++) if(((i - 20.2) / 0.6 + (j - 13.4) / 0.6 | 0) % 2 === 0){ c.fillStyle = v("rgba(168,220,200,.4)", "rgba(114,196,174,.12)"); c.fillRect(i, j, 0.6, 0.6); }
    c.restore(); p.text("ICE CREAM ♡", 24.3, 19.35, 9, v("rgba(232,140,170,.6)", "rgba(244,199,212,.25)"), 900, K.SIGN);
    c.fillStyle = v("rgba(0,0,0,.08)", "rgba(0,0,0,.25)"); c.beginPath(); c.ellipse(23.8, 15.0, 2.5, 1.05, 0, 0, 7); c.fill(); }
  // 피크닉 돗자리 (분홍 깅엄)
  { c.save(); c.translate(BLK[0], BLK[1]); c.rotate(-0.08); const w = 2.0, h = 1.6; p.rect(-w / 2, -h / 2, w / 2, h / 2, v("#FFFFFF", "#6A6064"));
    for(let k = 0; k < 10; k++){ p.rect(-w / 2 + k * w / 10, -h / 2, -w / 2 + k * w / 10 + w / 20, h / 2, v("rgba(232,140,170,.38)", "rgba(232,181,200,.18)")); }
    for(let k = 0; k < 8; k++){ p.rect(-w / 2, -h / 2 + k * h / 8, w / 2, -h / 2 + k * h / 8 + h / 16, v("rgba(232,140,170,.38)", "rgba(232,181,200,.18)")); }
    c.restore(); }
  // 강아지 발자국 · 대문 앞 화살표
  for(let k = 0; k < 6; k++){ const i = 17.0 + k * 0.28, j = 19.6 - k * 0.22 + (k % 2) * 0.12; c.fillStyle = v("rgba(150,110,90,.3)", "rgba(255,255,255,.08)"); c.beginPath(); c.arc(i, j, 0.05, 0, 7); c.fill(); [[-0.05, -0.06], [0, -0.08], [0.05, -0.06]].forEach(([a, b]) => { c.beginPath(); c.arc(i + a, j + b, 0.022, 0, 7); c.fill(); }); }
  p.arrow("▼ 큰길 · 로비", GATE[0], 21.0);
  // 가로등 빛 웅덩이 (밤)
  LAMPS.forEach(([i, j]) => p.glow(i, j, 2.0, v("rgba(255,250,235,.0)", "rgba(255,214,150,.24)")));
  p.glow(PC[0], PC[1], 3.0, v("rgba(255,255,255,.0)", "rgba(160,220,255,.12)"));
  p.glow(23.1, 16.8, 2.2, v("rgba(255,255,255,.0)", "rgba(255,200,220,.2)"));
}

/* =================================================================== 작은 물건들 */
function flowerStem(i, j, col, h){ rod([i, j, 0], [i, j, h], 0.01, D("#5FA582", "#3E6E54"), "m", 5); ball(i, j, h, 0.075, col, "m", 8); ball(i, j, h + 1, 0.032, "#FFF4C2", "m", 6); ball(i + 0.06, j, h * 0.45, 0.05, K.sh("plant", 0.1), "m", 6); }
/* 나무: kind 0 = 초록 동글 (분홍 열매) · 1 = 벚꽃 · 2 = 노란 단풍 */
function tree(i, j, s, kind = 0){
  K.sm(K.cyl(0.07 * s, 0.11 * s, hz(46 * s), 8), D("#9A7458", "#4A3828"), X(i), hz(23 * s), Z(j), null, "m");
  rod([i, j, 30 * s], [i + 0.28 * s, j + 0.05 * s, 44 * s], 0.03 * s, D("#9A7458", "#4A3828"), "m", 6);
  const L1 = kind === 1 ? D("#F7C2D3", "#7A5866") : kind === 2 ? D("#F3CF7E", "#8A6A3A") : "plant", L2 = kind === 1 ? D("#FCDCE6", "#8A6676") : kind === 2 ? D("#F7DE9E", "#9A7A44") : K.sh("plant", 0.16);
  [[0, 0, 60, 0.62], [-0.36, 0.12, 52, 0.46], [0.36, 0.1, 53, 0.48], [0.05, -0.34, 54, 0.46], [0.08, 0.36, 50, 0.42], [0, 0.02, 76, 0.44]].forEach(([di, dj, z, r], k) =>
    ball(i + di * s, j + dj * s, z * s, r * s, k % 2 ? L2 : L1, "m", 14));
  const dot = kind === 1 ? "#FFFFFF" : kind === 2 ? "#E8A04A" : "#F4A7B9";
  [[0.3, 0.25, 62], [-0.24, -0.18, 66], [0.12, 0.4, 54], [-0.4, 0.22, 52], [0.42, -0.1, 57]].forEach(([di, dj, z]) => ball(i + di * s, j + dj * s, z * s, 0.05 * s, dot, "m", 8));
}
function bush(i, j, s = 1, flower = null){ [[0, 0, 0.34], [-0.26, 0.05, 0.26], [0.26, 0.04, 0.27], [0.02, 0.2, 0.24]].forEach(([di, dj, r], k) => ball(i + di * s, j + dj * s, r * s * 31.1 * 0.62, r * s, k % 2 ? K.sh(HEDGE, 0.12) : HEDGE, "m", 12));
  if(flower) [[0.12, 0.2], [-0.2, 0.14], [0.25, -0.05], [-0.05, -0.2]].forEach(([di, dj]) => ball(i + di * s, j + dj * s, 19 * s, 0.05 * s, flower, "m", 8)); }
/* 가로등: 짙은 초록 기둥 · 육각 등 · 꽃바구니 */
function lamp(i, j){
  const lc = IRON;
  disc(i, j, 0.13, 0, 3, lc, "s", 12); K.sm(K.cyl(0.035, 0.05, hz(68), 10), lc, X(i), hz(37), Z(j), null, "s");
  K.sm(K.cyl(0.09, 0.09, hz(1.6), 6), lc, X(i), hz(70.8), Z(j), null, "s");
  K.sm(K.cyl(0.11, 0.075, hz(9), 6), D("#FFF6E0", "#FFE7B0"), X(i), hz(76), Z(j), null, "glow");
  K.sm(K.cyl(0.02, 0.17, hz(5), 6), lc, X(i), hz(83), Z(j), null, "s"); ball(i, j, 86.5, 0.035, GOLD, "s", 8);
  rod([i, j, 56], [i + 0.22, j + 0.0, 58], 0.012, lc, "s", 5); K.sm(myGeo(new THREE.SphereGeometry(0.1, 12, 6, 0, PI * 2, PI / 2, PI / 2)), D("#C9A27A", "#6B4E38"), X(i + 0.26), hz(54), Z(j), null, "m");
  [[0.2, 0.04, "#F4A7B9"], [0.3, -0.04, "#F6E39A"], [0.27, 0.07, "#FFFFFF"]].forEach(([di, dj, cc]) => ball(i + di, j + dj, 55, 0.045, cc, "m", 8));
}
/* 벤치: h = 앉은 사람이 보는 쪽 (0 = +j). 짙은 초록 다리 · 파스텔 나무 살 */
function bench(ci, cj, h, slat){
  const g = new THREE.Group(); g.position.set(X(ci), 0, Z(cj)); g.rotation.y = h; K.root.add(g);
  const put = (geo, c, x, y, z, cls = "m") => K.sm(geo, c, x, y, z, g, cls);
  [-0.66, 0.66].forEach(x => { put(K.rbox(0.06, hz(12), 0.42, 0.01), IRON, x, hz(6), 0.0, "s"); put(K.rbox(0.06, hz(16), 0.05, 0.01), IRON, x, hz(12) + hz(8), -0.22, "s"); put(K.rbox(0.07, 0.04, 0.38, 0.015), IRON, x, hz(19), 0.0, "s"); });
  [-0.13, 0, 0.13].forEach((z, k) => put(K.rbox(1.42, 0.035, 0.11, 0.012), k === 1 ? K.sh(slat, 0.12) : slat, 0, hz(12.6) - 0.0175, z));
  [17.5, 24].forEach((zz, k) => { const o = put(K.rbox(1.42, 0.12, 0.035, 0.012), k ? slat : K.sh(slat, 0.12), 0, hz(zz), -0.245); o.rotation.x = -0.12; });
  put(K.rbox(0.18, 0.12, 0.012, 0), GOLD, 0, hz(20.5), -0.226, "s");
}
const benchSeat = ([ci, cj, h], k = "bench") => ({a:[+(ci - 0.5 * Math.cos(h)).toFixed(2), +(cj + 0.5 * Math.sin(h)).toFixed(2)], b:[+(ci + 0.5 * Math.cos(h)).toFixed(2), +(cj - 0.5 * Math.sin(h)).toFixed(2)], h, H:H(12.6), k, f:1});
/* 둥근 나무 의자 (트럭 앞) */
function stool(i, j, col){ K.sm(K.cyl(0.05, 0.07, hz(10), 10), WOODD, X(i), hz(5), Z(j), null, "s"); disc(i, j, 0.18, 10, 1.4, col, "s", 18); }

/* =================================================================== 울타리 · 대문 · 안내판 */
function fences(){
  // 앞 · 오른쪽: 흰 말뚝 울타리 (낮게, 카메라 쪽) · 말뚝 머리에 무지개 구슬
  const picket = (a, b, fixed, axis) => { const n = Math.max(1, Math.round((b - a) / 0.32));
    for(let k = 0; k <= n; k++){ const u = a + (b - a) * k / n; if(axis === "i") B(u - 0.03, fixed - 0.025, 0.06, 0.05, 18, WHITE, 0, {r:0.01}); else B(fixed - 0.025, u - 0.03, 0.05, 0.06, 18, WHITE, 0, {r:0.01});
      if(k % 3 === 0) ball(axis === "i" ? u : fixed, axis === "i" ? fixed : u, 19, 0.04, RB[(k / 3 | 0) % 6], "m", 8); }
    [5, 13].forEach(z => axis === "i" ? B(a, fixed - 0.07, b - a, 0.03, 1.8, WHITE, z, {r:0}) : B(fixed - 0.07, a, 0.03, b - a, 1.8, WHITE, z, {r:0})); };
  picket(FI0, GW[0] - 0.02, FJ1, "i"); picket(GW[1] + 0.02, FI1, FJ1, "i"); picket(FJ0 + 0.3, FJ1, FI1, "j");
  // 뒤 · 왼쪽: 동글동글 산울타리 (먼 쪽이라 조금 높게)
  const hedge = (a, b, fixed, axis) => { for(let u = a; u < b - 0.05; u += 0.62){ const w = Math.min(0.6, b - u), cc = rnd(u * 3 + fixed) > 0.5 ? HEDGE : K.sh(HEDGE, 0.1);
      if(axis === "i") B(u, fixed - 0.3, w, 0.6, 24, cc, 0, {r:0.22, seg:2}); else B(fixed - 0.3, u, 0.6, w, 24, cc, 0, {r:0.22, seg:2});
      if(rnd(u * 7 + fixed) > 0.55) ball(axis === "i" ? u + w / 2 : fixed + 0.18, axis === "i" ? fixed + 0.18 : u + w / 2, 22, 0.05, RB[(u * 3 | 0) % 6], "m", 8); } };
  hedge(FI0 - 0.3, FI1 + 0.3, FJ0, "i"); hedge(FJ0 + 0.3, FJ1, FI0, "j");
  // 울타리 안쪽 꽃 줄 (앞)
  for(let i = FI0 + 0.3, k = 0; i < FI1 - 0.2; i += 0.44, k++) if(i < GW[0] - 0.6 || i > GW[1] + 0.6) flowerStem(i, FJ1 - 0.28 + (k % 2 ? 0.08 : -0.06), RB[k % 6], 12 + (k % 3) * 3);
}
function gateArch(){
  const j = FJ1, y0 = 64;
  GW.forEach((i, k) => { B(i - 0.09, j - 0.09, 0.18, 0.18, y0, WHITE, 0, {r:0.03}); B(i - 0.14, j - 0.14, 0.28, 0.28, 5, PINK, 0, {r:0.04}); B(i - 0.12, j - 0.12, 0.24, 0.24, 2.4, PINK, y0 - 2.4, {r:0.03});
    // 구름 뭉치 (기둥 머리)
    [[0, 0, 0.17], [-0.14, 0.02, 0.12], [0.14, 0.02, 0.12], [0, 0.1, 0.11]].forEach(([di, dj, r]) => ball(i + di, j + dj, y0 + 4, r, D("#FFFFFF", "#C9C2D2"), "m", 12));
    // 대문 꽃 화분
    const pi = i + (k ? 0.48 : -0.48); B(pi - 0.2, j - 0.5, 0.4, 0.4, 11, LILAC, 0, {r:0.06}); [[0, 0], [0.09, 0.07], [-0.08, 0.06], [0.05, -0.08]].forEach(([di, dj], n) => ball(pi + di, j - 0.3 + dj, 15 + (n % 2) * 2, 0.07, RB[(n + k * 2) % 6], "m", 8)); });
  // 무지개 아치
  RB.forEach((cc, k) => K.sm(myGeo(new THREE.TorusGeometry(1.29 - k * 0.05, 0.026, 6, 40, PI)), D(cc, K.shade(cc, -0.5)), X(15), hz(y0 + 3), Z(j), null, "m"));
  // 매단 간판
  [14.3, 15.7].forEach(i => rod([i, j, 92], [i, j, 102], 0.01, CHAIN, "s", 5));
  B(13.95, j - 0.05, 2.1, 0.1, 19, PINK, 74, {r:0.05}); B(13.9, j - 0.06, 2.2, 0.12, 1.4, WHITE, 93, {r:0.02});
  K.wtext("동네 공원", 15, j + 0.05, 85.5, "i", 5.4, "#FFFFFF", null, 900, K.FONT);
  K.wtext("🛝 놀이터 · ⛲ 분수 · 🦆 연못", 15, j + 0.05, 77.8, "i", 2.1, "#FFF6E6", null, 700, K.FONT);
  // 안내도 (대문 오른쪽 안)
  { const ai = 17.6, aj = 20.75; [ai - 0.55, ai + 0.55].forEach(i => B(i - 0.03, aj - 0.03, 0.06, 0.06, 44, IRON, 0, {r:0, cls:"s"})); B(ai - 0.66, aj - 0.04, 1.32, 0.06, 26, IRON, 20, {r:0.02, cls:"s"});
    K.decal(240, 130, (c, w, h, dark) => { c.fillStyle = "#FFF8EE"; c.fillRect(0, 0, w, h); c.fillStyle = "#B9DA9E"; c.fillRect(6, 22, w - 12, h - 28);
      c.fillStyle = "#F6DCE4"; c.fillRect(10, 26, 70, 52); c.fillStyle = "#7CC7C4"; c.beginPath(); c.ellipse(w - 52, 46, 36, 18, 0, 0, 7); c.fill();
      c.strokeStyle = "#EFE1C8"; c.lineWidth = 8; c.beginPath(); c.moveTo(6, 82); c.lineTo(w - 6, 82); c.moveTo(w / 2, 82); c.lineTo(w / 2, h - 6); c.stroke();
      c.fillStyle = "#A9CBEA"; c.beginPath(); c.arc(w / 2, 82, 14, 0, 7); c.fill(); c.fillStyle = "#C8B4D0"; c.fillRect(w - 70, 92, 40, 18);
      c.fillStyle = "#E06A55"; c.beginPath(); c.arc(w / 2, h - 14, 6, 0, 7); c.fill();
      c.fillStyle = "#2A2A28"; c.font = "800 15px 'IBM Plex Sans KR', system-ui"; c.textAlign = "center"; c.fillText("동네 공원 안내도", w / 2, 16);
      c.font = "700 10px 'IBM Plex Sans KR', system-ui"; c.fillText("놀이터", 45, 56); c.fillText("연못", w - 52, 50); c.fillText("트럭 🍦", w - 50, 105); c.fillText("● 지금 여기", w / 2 + 34, h - 10); }, 1.2, hz(24), "i", ai, aj + 0.03, hz(33)); }
}

/* =================================================================== 놀이터 */
function slide(){
  const post = SPROUT, deck = AMBER2, z = SL.z, { i0, i1, j0, j1 } = SL;
  // 기둥 넷 · 발판 · 난간 · 지붕
  [[i0, j0], [i1 - 0.08, j0], [i0, j1 - 0.08], [i1 - 0.08, j1 - 0.08]].forEach(([i, j]) => B(i, j, 0.08, 0.08, 76, post, 0, {r:0.02, cls:"s"}));
  B(i0 - 0.02, j0 - 0.02, i1 - i0 + 0.04, j1 - j0 + 0.04, 3, deck, z - 3, {r:0.02});
  B(i0 + 0.04, j0 + 0.02, 0.04, j1 - j0 - 0.04, 0.6, D("#FFFFFF", "#8A847C"), z, {r:0});
  [[i0 + 0.04, j0 + 0.04, i1 - i0 - 0.08, 0.04], [i0 + 0.04, j0 + 0.04, 0.04, j1 - j0 - 0.08]].forEach(([a, b, w, d]) => { B(a, b, w, d, 2, PINK, z + 13, {r:0.01, cls:"s"}); B(a, b, w, d, 2, PINK, z + 6, {r:0.01, cls:"s"}); });
  K.faceJ(i0 + 0.1, i1 - 0.1, j0 + 0.06, z + 1, z + 12, LILAC2, "m", 0.02); K.wtext("♡", (i0 + i1) / 2, j0 + 0.09, z + 7, "i", 5, D("#E8A0BC", "#F4C7D4"), null, 900);
  { const roof = K.sm(myGeo(new THREE.ConeGeometry(0.8, hz(20), 4, 1)), PINK, X((i0 + i1) / 2), hz(76) + hz(10), Z((j0 + j1) / 2), null, "m"); roof.rotation.y = PI / 4;
    const r2 = K.sm(myGeo(new THREE.ConeGeometry(0.81, hz(6), 4, 1, true)), WHITE, X((i0 + i1) / 2), hz(76) + hz(3), Z((j0 + j1) / 2), null, "m"); r2.rotation.y = PI / 4;
    rod([(i0 + i1) / 2, (j0 + j1) / 2, 96], [(i0 + i1) / 2, (j0 + j1) / 2, 112], 0.012, WHITE, "s", 5);
    B((i0 + i1) / 2, (j0 + j1) / 2 - 0.01, 0.3, 0.02, 7, AMBER, 104, {r:0}); }
  // 사다리 (+j 쪽, 계단 다섯) · 손잡이
  const n = 5, dj = (SL.lad - j1) / n;
  for(let k = 0; k < n; k++){ const jj = SL.lad - (k + 1) * dj; B(i0 + 0.16, jj + 0.02, i1 - i0 - 0.32, dj - 0.04, 2.4, k % 2 ? YEL : PEACH, (k + 1) * z / (n + 1) + 2.4, {r:0.02}); }
  [i0 + 0.1, i1 - 0.1].forEach(i => { rod([i, SL.lad + 0.05, 0], [i, j1, z + 2], 0.03, post); rod([i, SL.lad + 0.05, 18], [i, j1 - 0.05, z + 16], 0.02, PINK); });
  // 미끄럼판 (+i 쪽으로 내려감) · 옆 벽 · 끝 평평한 곳
  const dz = hz(SLIDE_Z(SL.c0) - SLIDE_Z(SL.c1)), dx = SL.c1 - SL.c0, len = Math.hypot(dx, dz), th = Math.atan2(dz, dx), mid = (SL.c0 + SL.c1) / 2, ym = hz((SLIDE_Z(SL.c0) + SLIDE_Z(SL.c1)) / 2), cj = (j0 + j1) / 2;
  const bed = K.sm(K.rbox(len, 0.04, 0.5, 0.015), D("#F4A7B9", "#7A5866"), X(mid), ym - 0.02, Z(cj), null, "s"); bed.rotation.z = -th;
  [-0.27, 0.27].forEach(o => { const s = K.sm(K.rbox(len, 0.14, 0.04, 0.015), D("#F7C6D6", "#8A6676"), X(mid), ym + 0.05, Z(cj + o), null, "s"); s.rotation.z = -th; });
  B(SL.c1 - 0.02, cj - 0.25, SL.ex - SL.c1, 0.5, 1.2, D("#F4A7B9", "#7A5866"), SLIDE_Z(SL.c1) - 1.2, {r:0.02, cls:"s"});
  [-0.27, 0.27].forEach(o => B(SL.c1 - 0.02, cj + o - 0.02, SL.ex - SL.c1, 0.04, 3.5, D("#F7C6D6", "#8A6676"), SLIDE_Z(SL.c1), {r:0.01, cls:"s"}));
  [3.6, 4.4].forEach(i => rod([i, cj, 0], [i, cj, SLIDE_Z(i) - 1], 0.035, post));
}
function swingFrame(){
  const { i0, i1, j, zp } = SW, leg = LEAF;
  [i0 + 0.05, i1 - 0.05].forEach(i => { rod([i, j - 0.75, 0], [i, j, zp + 1], 0.045, leg); rod([i, j + 0.75, 0], [i, j, zp + 1], 0.045, leg); rod([i, j - 0.45, 20], [i, j + 0.45, 20], 0.025, leg);
    ball(i, j, zp + 1, 0.075, AMBER, "s", 12); [[-0.75], [0.75]].forEach(([d]) => disc(i, j + d, 0.07, 0, 1.2, IRON, "s", 10)); });
  rod([i0 - 0.05, j, zp + 1], [i1 + 0.05, j, zp + 1], 0.05, PINK);
  SW.si.forEach(si => [-0.19, 0.19].forEach(d => K.sm(myGeo(new THREE.TorusGeometry(0.03, 0.009, 5, 10)), CHAIN, X(si + d), hz(zp) - 0.01, Z(j), null, "s")));
  // 안전 매트 표지
  K.faceJ(i0 + 1.2, i0 + 2.0, j - 0.8, 34, 40, WHITE, "m", 0.01);
}
function jungleGym(){
  const { i0, j0, c, ni, nj, lv } = JG, cols = [D("#F4A7B9", "#7A5866"), D("#F6E39A", "#8A7A3A"), D("#A9CBEA", "#4E6A88"), D("#A8DCC8", "#4E7A6E")];
  for(let a = 0; a <= ni; a++) for(let b = 0; b <= nj; b++){ const i = i0 + a * c, j = j0 + b * c; rod([i, j, 0], [i, j, lv * 2], 0.028, cols[(a + b) % 4]); ball(i, j, lv * 2 + 0.5, 0.045, WHITE, "s", 8); }
  [lv, lv * 2].forEach((z, L) => { for(let b = 0; b <= nj; b++) rod([i0, j0 + b * c, z], [i0 + ni * c, j0 + b * c, z], 0.022, cols[(b + L * 2) % 4]);
    for(let a = 0; a <= ni; a++) rod([i0 + a * c, j0, z], [i0 + a * c, j0 + nj * c, z], 0.022, cols[(a + L * 2 + 1) % 4]); });
  B(i0 + c + 0.03, j0 + 0.03, c - 0.06, nj * c - 0.06, 1.6, AMBER2, lv * 2 - 1.6, {r:0.02});   // 꼭대기 발판 (가운데 칸)
  rod([i0 + c * 1.5, j0 + c, lv * 2], [i0 + c * 1.5, j0 + c, lv * 2 + 22], 0.012, WHITE, "s", 5);
  K.sm(myGeo(new THREE.ConeGeometry(0.1, 0.22, 3)), PINK, X(i0 + c * 1.5) + 0.06, hz(lv * 2 + 19), Z(j0 + c), null, "m").rotation.z = -PI / 2;
}
function merryBase(){ disc(MG.ci, MG.cj, MG.r + 0.12, 0, 1.4, STONE2, "s", 40); disc(MG.ci, MG.cj, 0.2, 1.4, 1.2, IRON, "s", 16); }
function seesawBase(){
  const { ci, cj, yp } = SS, bz = yp * 31.1;
  B(ci - 0.13, cj - 0.26, 0.26, 0.1, bz - 2, AMBER, 0, {r:0.03}); B(ci - 0.13, cj + 0.16, 0.26, 0.1, bz - 2, AMBER, 0, {r:0.03});
  B(ci - 0.2, cj - 0.3, 0.4, 0.6, 1.6, IRON, 0, {r:0.03, cls:"s"});
  [-1, 1].forEach(s => disc(ci + s * (SS.half - 0.12), cj, 0.13, 0, 2.2, D("#3A3A3E", "#26262A"), "s", 14));   // 엉덩방아 고무
}
function sandbox(){
  const { i0, j0, i1, j1 } = SB, fr = D("#E9C79A", "#6B5440");
  B(i0 - 0.12, j0 - 0.12, i1 - i0 + 0.24, 0.12, 7, fr, 0, {r:0.03}); B(i0 - 0.12, j1, i1 - i0 + 0.24, 0.12, 7, fr, 0, {r:0.03});
  B(i0 - 0.12, j0, 0.12, j1 - j0, 7, fr, 0, {r:0.03}); B(i1, j0, 0.12, j1 - j0, 7, fr, 0, {r:0.03});
  [[i0 - 0.12, j0 - 0.12], [i1, j0 - 0.12], [i0 - 0.12, j1], [i1, j1]].forEach(([i, j], k) => B(i - 0.02, j - 0.02, 0.16, 0.16, 8, RB[k + 1], 0, {r:0.04}));
  B(i0 + 0.02, j0 + 0.02, i1 - i0 - 0.04, j1 - j0 - 0.04, 3.4, D("#F2DDB0", "#5A4E38"), 0, {r:0.01});
  // 모래성 (탑 셋 · 깃발) · 둔덕 · 양동이 · 삽 · 체 · 조개
  { const ci = 2.55, cj = 8.45, sd = D("#E9CF9C", "#6A5A40"); B(ci - 0.32, cj - 0.25, 0.64, 0.5, 6, sd, 3.4, {r:0.04});
    [[-0.22, -0.16], [0.22, -0.16], [0, 0.17]].forEach(([di, dj]) => { K.sm(K.cyl(0.09, 0.11, hz(10), 12), sd, X(ci + di), hz(3.4 + 5), Z(cj + dj), null, "m"); K.sm(myGeo(new THREE.ConeGeometry(0.1, hz(5), 12)), sd, X(ci + di), hz(3.4 + 12.5), Z(cj + dj), null, "m"); });
    rod([ci, cj + 0.17, 18], [ci, cj + 0.17, 27], 0.008, WHITE, "s", 4); B(ci, cj + 0.16, 0.14, 0.01, 3, PINK, 24, {r:0}); }
  [[1.65, 9.35, 0.32], [3.4, 8.05, 0.26]].forEach(([i, j, r]) => K.sm(myGeo(new THREE.SphereGeometry(r, 14, 6, 0, PI * 2, 0, PI / 2)), D("#EBD3A4", "#6A5A40"), X(i), hz(3.4), Z(j), null, "m").scale.y = 0.45);
  { const bi = 3.45, bj = 9.35; K.sm(K.cyl(0.13, 0.1, hz(8), 16), AMBER, X(bi), hz(3.4 + 4), Z(bj), null, "s"); K.sm(myGeo(new THREE.TorusGeometry(0.11, 0.008, 5, 14, PI)), WHITE, X(bi), hz(11.4), Z(bj), null, "s"); }
  { const s = K.sm(K.rbox(0.36, 0.02, 0.06, 0), SKY, X(3.0), hz(4.2), Z(8.2), null, "s"); s.rotation.y = 0.6; const h2 = K.sm(K.rbox(0.12, 0.015, 0.1, 0.005), SKY, X(3.17), hz(4.2), Z(8.08), null, "s"); h2.rotation.y = 0.6; }
  { const g = K.sm(myGeo(new THREE.TorusGeometry(0.13, 0.02, 6, 18)), PINK, X(1.7), hz(4.0), Z(8.0), null, "s"); g.rotation.x = PI / 2; disc(1.7, 8.0, 0.12, 3.4, 0.4, D("#FFFFFF", "#8A847C"), "s", 16); }
  [[2.0, 9.5, "#F4C7D4"], [3.6, 9.6, "#FFFFFF"], [1.5, 8.6, "#F9C99B"]].forEach(([i, j, cc]) => K.sm(myGeo(new THREE.SphereGeometry(0.05, 10, 5, 0, PI * 2, 0, PI / 2)), cc, X(i), hz(3.4), Z(j), null, "m").scale.set(1, 0.5, 1.2));
}
function springRider(){
  const [si, sj] = SPR;
  disc(si, sj, 0.2, 0, 1.2, IRON, "s", 16);
  for(let k = 0; k < 6; k++){ const t = K.sm(myGeo(new THREE.TorusGeometry(0.09, 0.016, 6, 16)), CHAIN, X(si), hz(2 + k * 1.3), Z(sj), null, "s"); t.rotation.x = PI / 2; }
  const y = 8, dk = D("#FFD84D", "#8A7A30");
  ball(si, sj, y + 3, 0.22, dk, "m", 16).scale.set(0.8, 0.62, 1.15);
  ball(si, sj + 0.25, y + 11, 0.12, dk, "m", 14); B(si - 0.05, sj + 0.33, 0.1, 0.1, 2, D("#F28C28", "#8A5020"), y + 9, {r:0.03});
  [-0.06, 0.06].forEach(d => ball(si + d, sj + 0.34, y + 12, 0.016, INK, "s", 6)); [-0.08, 0.08].forEach(d => ball(si + d, sj + 0.32, y + 10, 0.022, PINK, "m", 6));
  ball(si, sj - 0.26, y + 6, 0.07, dk, "m", 10); B(si - 0.13, sj - 0.12, 0.26, 0.26, 1.4, PINK, y + 9, {r:0.06});
  rod([si - 0.15, sj + 0.17, y + 10], [si + 0.15, sj + 0.17, y + 10], 0.016, PINK, "s", 6); rod([si, sj + 0.15, y + 6], [si, sj + 0.17, y + 10], 0.016, PINK, "s", 6);
}
function fountain(){
  const [ci, cj] = PC, st = D("#F4EFE8", "#5A5550"), st2 = D("#E8DCD2", "#4A4540");
  const lathe = (pts, col) => K.sm(myGeo(new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), 48)), col, X(ci), 0, Z(cj), null, "s");
  lathe([[FB, 0], [FB, 0.34], [FB - 0.02, 0.4], [1.48, 0.43], [1.4, 0.42], [1.37, 0.38], [1.37, 0.28]], st);
  { const t = K.sm(myGeo(new THREE.TorusGeometry(FB + 0.008, 0.028, 6, 64)), PINK, X(ci), 0.2, Z(cj), null, "s"); t.rotation.x = PI / 2;
    const t2 = K.sm(myGeo(new THREE.TorusGeometry(FB + 0.006, 0.018, 6, 64)), MINT, X(ci), 0.12, Z(cj), null, "s"); t2.rotation.x = PI / 2; }
  K.sm(K.cyl(0.13, 0.19, 0.82, 20), st2, X(ci), 0.32 + 0.41, Z(cj), null, "s");
  [0.55, 0.98].forEach(y => { const t = K.sm(myGeo(new THREE.TorusGeometry(0.16, 0.025, 6, 20)), LILAC, X(ci), y, Z(cj), null, "s"); t.rotation.x = PI / 2; });
  lathe([[0.12, 1.08], [0.45, 1.15], [0.66, 1.26], [0.71, 1.31], [0.67, 1.335], [0.62, 1.3], [0.62, 1.24]], st);
  { const t = K.sm(myGeo(new THREE.TorusGeometry(0.705, 0.02, 6, 48)), PINK, X(ci), 1.31, Z(cj), null, "s"); t.rotation.x = PI / 2; }
  K.sm(K.cyl(0.055, 0.08, 0.34, 14), st2, X(ci), 1.3 + 0.17, Z(cj), null, "s");
  lathe([[0.06, 1.58], [0.2, 1.63], [0.3, 1.7], [0.325, 1.735], [0.295, 1.752], [0.27, 1.72], [0.27, 1.68]], st);
  K.sm(K.sph(0.055, 12, 9), PINK, X(ci), 1.79, Z(cj), null, "s");
  // 수반 둘레 꽃 화분 넷 (광장 대각선)
  [[-1, -1], [1, -1]].forEach(([a, b]) => { const i = ci + a * 2.12, j = cj + b * 2.12; K.sm(K.cyl(0.32, 0.26, hz(12), 18), LILAC, X(i), hz(6), Z(j), null, "m"); disc(i, j, 0.28, 12, 0.6, D("#7A5A3C", "#3A2A20"));
    for(let k = 0; k < 7; k++){ const a2 = k * 0.9; flowerStem(i + Math.cos(a2) * 0.15, j + Math.sin(a2) * 0.15, RB[k % 6], 20 + (k % 3) * 2); } });
}
/* =================================================================== 꽃밭 · 화장실 */
function flowerBeds(){
  [[12.7, 3.4, 14.6, 7.2], [15.4, 3.4, 18.4, 7.2]].forEach(([a, b, c, d], n) => {
    const pk = (u0, u1, f, ax) => { const m = Math.max(1, Math.round((u1 - u0) / 0.24)); for(let k = 0; k <= m; k++){ const u = u0 + (u1 - u0) * k / m; ax === "i" ? B(u - 0.025, f - 0.025, 0.05, 0.05, 11, WHITE, 0, {r:0.01}) : B(f - 0.025, u - 0.025, 0.05, 0.05, 11, WHITE, 0, {r:0.01}); }
      ax === "i" ? B(u0, f - 0.065, u1 - u0, 0.025, 1.6, WHITE, 7, {r:0}) : B(f - 0.065, u0, 0.025, u1 - u0, 1.6, WHITE, 7, {r:0}); };
    pk(a, c, b, "i"); pk(a, c, d, "i"); pk(b, d, a, "j"); pk(b, d, c, "j");
    for(let j = b + 0.3, r = 0; j < d - 0.15; j += 0.34, r++) for(let i = a + 0.22 + (r % 2) * 0.14; i < c - 0.12; i += 0.29) if(!(n === 1 && j < b + 0.7)) flowerStem(i, j, RB[(r + n * 2) % 6], 11 + rnd(i * 7 + j) * 4);
  });
  // 해바라기 (오른쪽 꽃밭 뒤 줄)
  for(let i = 15.7; i < 18.2; i += 0.42){ const h = 30 + rnd(i * 3) * 6; rod([i, 3.62, 0], [i, 3.62, h], 0.016, D("#5FA582", "#3E6E54"), "m", 5); ball(i + 0.06, 3.62, h * 0.55, 0.06, K.sh("plant", 0.1), "m", 6);
    const p = K.sm(K.cyl(0.13, 0.13, 0.02, 14), D("#FFD43B", "#9A8030"), X(i), hz(h), Z(3.66), null, "m"); p.rotation.x = PI / 2 - 0.3;
    const cc = K.sm(K.cyl(0.065, 0.065, 0.03, 12), D("#8A5A2C", "#3A2614"), X(i), hz(h) + 0.006, Z(3.685), null, "m"); cc.rotation.x = PI / 2 - 0.3; }
  // 꽃밭 표지판
  { const si = 14.95, sj = 7.55; rod([si, sj, 0], [si, sj, 20], 0.018, WOODD, "s", 6); B(si - 0.3, sj - 0.03, 0.6, 0.05, 9, WOOD, 16, {r:0.02});
    K.wtext("꽃밭 🌷 쉿!", si, sj + 0.025, 20.5, "i", 1.9, D("#8A5A3C", "#F6D29A"), null, 800, K.FONT); }
}
function restroom(){
  const i0 = 13.9, i1 = 17.1, j0 = 0.1, j1 = 2.3, hh = 62, wall = D("#EEE6F3", "#4E4458"), cm = (i0 + i1) / 2, jm = (j0 + j1) / 2;
  B(i0, j0, i1 - i0, j1 - j0, hh, wall, 0, {r:0.03});
  B(i0 - 0.04, j0 - 0.04, i1 - i0 + 0.08, j1 - j0 + 0.08, 6, LILAC, 0, {r:0.02});
  // 박공 지붕 (분홍) · 처마
  const dj = (j1 - j0) / 2 + 0.22, rise = 0.62, slab = Math.hypot(dj, rise), ang = Math.atan2(rise, dj);
  [-1, 1].forEach(s => { const o = K.sm(K.rbox(i1 - i0 + 0.4, 0.08, slab + 0.04, 0.03), PINK, X(cm), hz(hh) + rise / 2 + 0.03, Z(jm + s * dj / 2), null, "m"); o.rotation.x = s * ang; });
  { const sh = new THREE.Shape(); sh.moveTo(-(j1 - j0) / 2, 0); sh.lineTo((j1 - j0) / 2, 0); sh.lineTo(0, rise - 0.02); sh.lineTo(-(j1 - j0) / 2, 0);
    const g = myGeo(new THREE.ExtrudeGeometry(sh, {depth:i1 - i0 - 0.04, bevelEnabled:false})); g.rotateY(PI / 2); K.sm(g, wall, X(i0 + 0.02), hz(hh), Z(jm), null, "m"); }
  B(cm - 0.06, jm - 0.04, 0.12, 0.08, 10, WHITE, hh + rise * 31.1 - 4, {r:0.02});   // 굴뚝 대신 환기구
  // 문 둘 (여자 분홍 · 남자 하늘) · 표지 · 작은 창 · 처마등
  [[14.3, 15.0, PINK, "👧", "여자"], [16.0, 16.7, SKY, "👦", "남자"]].forEach(([a, b, col, e, t]) => { K.faceJ(a, b, j1 + 0.042, 6, 46, col, "m", 0.02); ball(b - 0.08, j1 + 0.07, 25, 0.022, GOLD, "s", 6);
    K.decal(64, 64, (c, w, h) => { c.fillStyle = "#FFFFFF"; c.beginPath(); c.arc(w / 2, h / 2, w / 2 - 2, 0, 7); c.fill(); c.font = "38px 'Apple Color Emoji','Noto Color Emoji',sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(e, w / 2, h / 2 + 3); }, 0.26, 0.26, "i", (a + b) / 2, j1 + 0.06, hz(38));
    K.wtext(t, (a + b) / 2, j1 + 0.06, 30, "i", 1.8, "#FFFFFF", null, 800, K.FONT); });
  K.wtext("화장실 🚻", cm, j1 + 0.02, 53, "i", 3.0, D("#8A6A9A", "#E2D6EA"), null, 800, K.FONT);
  ball(cm, j1 + 0.12, 58, 0.06, D("#FFF6E0", "#FFE7B0"), "glow", 10);
  // 음수대 (두 문 사이)
  B(cm - 0.13, j1 + 0.25, 0.26, 0.26, 24, SKY, 0, {r:0.04}); disc(cm, j1 + 0.38, 0.17, 24, 2.4, WHITE, "s", 18); rod([cm, j1 + 0.3, 26], [cm, j1 + 0.38, 29], 0.015, CHAIN, "s", 6);
  // 옆 화분 · 덤불
  bush(13.4, 1.2, 1.0, "#F4A7B9"); bush(17.6, 1.4, 0.9, "#F6E39A");
}
/* =================================================================== 연못 · 다리 · 오리집 */
function pondStatic(){
  // 둘레 돌 (다리 끝 · 오리 밥 주는 곳은 비움)
  for(let k = 0; k < 64; k++){ const a = k / 64 * 2 * PI + 0.03, [i, j] = pondPt(a, 0.06);
    if((i > BR.i0 - 0.35 && i < BR.i1 + 0.35) || Math.hypot(i - DUCK_SPOT[0], j - DUCK_SPOT[1]) < 0.85) continue;
    const r = 0.11 + rnd(k + 70) * 0.08; ball(i, j, 1.2, r, rnd(k + 80) > 0.5 ? STONE : STONE2, "m", 10).scale.set(1.25, 0.5, 1); }
  // 부들 · 갈대 (왼쪽 뒤 가장자리)
  [[0.6, 7], [1.0, 5], [2.4, 6], [4.4, 5], [5.3, 6]].forEach(([a0, n], q) => { for(let k = 0; k < n; k++){ const a = a0 + (k - n / 2) * 0.035, [i, j] = pondPt(a, -0.18 - rnd(k + q * 9) * 0.15), h = 22 + rnd(k * 3 + q) * 14;
    rod([i, j, 0], [i + (rnd(k + q) - 0.5) * 0.08, j, h], 0.009, D("#5FA582", "#3E6E54"), "m", 4); if(k % 2 === 0) K.sm(K.cap(0.025, 0.1), D("#8A5A3C", "#4A3020"), X(i), hz(h) + 0.02, Z(j), null, "m"); } });
  // 연잎 · 연꽃 · 개구리
  [[23.3, 3.6, 0.2], [23.8, 3.4, 0.14], [27.4, 6.7, 0.22], [26.6, 7.1, 0.15], [28.0, 4.6, 0.18], [25.6, 2.9, 0.16]].forEach(([i, j, r], k) => {
    K.sm(myGeo(new THREE.CylinderGeometry(r, r, 0.012, 18, 1, false, 0.4, PI * 1.8)), D("#5FB36A", "#2E5A34"), X(i), 0.03, Z(j), null, "m");
    if(k % 2 === 0){ [0, 1.2, 2.4, 3.6, 4.8].forEach(a => { const p = K.sm(K.sph(0.05, 8, 6), D("#F7C2D3", "#7A5866"), X(i + Math.cos(a) * 0.04), 0.07, Z(j + Math.sin(a) * 0.04), null, "m"); p.scale.set(0.6, 1.2, 0.6); }); ball(i, j, 2.4, 0.03, "#FFE066", "m", 6); } });
  { const fi = 27.4, fj = 6.7; ball(fi, fj, 2.6, 0.08, D("#7CC46A", "#3E6E34"), "m", 12).scale.set(1, 0.7, 1); [-0.04, 0.04].forEach(d => { ball(fi + d, fj + 0.04, 4.6, 0.028, D("#7CC46A", "#3E6E34"), "m", 8); ball(fi + d, fj + 0.065, 4.8, 0.012, INK, "s", 6); }); }
  // 오리집 (물 위 뗏목)
  { const hi = 27.3, hj = 4.1; B(hi - 0.42, hj - 0.32, 0.84, 0.64, 2.4, WOOD, 0, {r:0.03}); B(hi - 0.28, hj - 0.22, 0.56, 0.44, 12, D("#FFF6E6", "#8A8070"), 2.4, {r:0.03});
    [-1, 1].forEach(s => { const o = K.sm(K.rbox(0.66, 0.04, 0.34, 0.01), PINK, X(hi), hz(17.2), Z(hj + s * 0.14), null, "m"); o.rotation.x = s * 0.55; });
    K.faceJ(hi - 0.08, hi + 0.08, hj + 0.22, 3, 9, D("#5A4A40", "#2A2420"), "m", 0.01); K.wtext("오리집", hi, hj + 0.25, 11.5, "i", 1.3, D("#B5607E", "#F4C7D4"), null, 800, K.FONT); }
  // 오리 밥 주기 표지판 · 빵 봉지
  { const [di, dj] = DUCK_SPOT, si = di + 0.75; rod([si, dj - 0.1, 0], [si, dj - 0.1, 26], 0.02, WOODD, "s", 6); B(si - 0.42, dj - 0.13, 0.84, 0.05, 10, WOOD, 20, {r:0.02});
    K.wtext("오리 밥 주기 🦆", si, dj - 0.075, 25, "i", 1.8, D("#6B4E34", "#F6D29A"), null, 800, K.FONT); }
}
function bridge(){
  const [j0, j1] = BRJ, { i0, i1 } = BR, rail = D("#F7EFE6", "#8A8478");
  for(let j = j0, k = 0; j < j1 - 0.01; j += 0.2, k++){ const z = BRZ(j + 0.1); B(i0 + 0.05, j + 0.01, i1 - i0 - 0.1, 0.18, 2, k % 2 ? WOOD : K.sh(WOOD, -0.06), Math.max(0, z - 2), {r:0.01}); }
  // 아치 보 (양옆)
  const N = 12, pts = Array.from({length:N + 1}, (_, k) => j0 + (j1 - j0) * k / N);
  [i0 + 0.07, i1 - 0.07].forEach(i => pts.slice(1).forEach((j, k) => rod([i, pts[k], BRZ(pts[k]) - 3], [i, j, BRZ(j) - 3], 0.04, WOODD, "m", 6)));
  // 난간 기둥 · 손잡이 (가운데 분홍 리본)
  const P = Array.from({length:9}, (_, k) => j0 + 0.06 + (j1 - j0 - 0.12) * k / 8);
  [i0 + 0.02, i1 - 0.02].forEach(i => { P.forEach(j => { rod([i, j, BRZ(j)], [i, j, BRZ(j) + 21], 0.03, rail); ball(i, j, BRZ(j) + 21.5, 0.04, PINK, "s", 8); });
    P.slice(1).forEach((j, k) => { rod([i, P[k], BRZ(P[k]) + 19], [i, j, BRZ(j) + 19], 0.022, rail); rod([i, P[k], BRZ(P[k]) + 9], [i, j, BRZ(j) + 9], 0.016, rail); }); });
  [i0 + 0.02, i1 - 0.02].forEach(i => { const jm = (j0 + j1) / 2; ball(i, jm, BRZ(jm) + 15, 0.06, PINK, "m", 10); });
}
/* =================================================================== 아이스크림 트럭 · 탁자 */
function truck(){
  const { i0, ib, i1, j0, j1, w0, w1 } = TR, body = D("#BFE8DA", "#4E7A6E"), body2 = D("#A8DCC8", "#3E6A5E"), tire = D("#2E2E34", "#1E1E22"), gray = D("#9AA0A6", "#5A5E64");
  // 바퀴 · 휠 · 바퀴 덮개
  [[22.35, 0.3], [25.25, 0.3]].forEach(([i, r]) => [j0 + 0.06, j1 - 0.06].forEach(j => { const t = K.sm(K.cyl(r, r, 0.22, 20), tire, X(i), r, Z(j), null, "s"); t.rotation.x = PI / 2;
    const hb = K.sm(K.cyl(r * 0.5, r * 0.5, 0.235, 14), D("#FFFFFF", "#9A949C"), X(i), r, Z(j), null, "s"); hb.rotation.x = PI / 2;
    const hc = K.sm(K.cyl(r * 0.18, r * 0.18, 0.25, 10), PINK, X(i), r, Z(j), null, "s"); hc.rotation.x = PI / 2; }));
  B(i0 + 0.05, j0 + 0.12, i1 - i0 - 0.1, j1 - j0 - 0.24, 6, gray, 6, {r:0.02, cls:"s"});
  // 짐칸: 아래 · 창 옆 · 창 위 · 지붕 · 분홍 띠 · 창 안쪽 벽
  B(i0, j0, ib - i0, j1 - j0, 22, body, 10, {r:0.08});
  B(i0, j0, w0 - i0, j1 - j0, 24, body, 32, {r:0.04}); B(w1, j0, ib - w1, j1 - j0, 24, body, 32, {r:0.04});
  B(w0, j0, w1 - w0, 0.14, 24, body, 32, {r:0.02});
  B(i0, j0, ib - i0, j1 - j0, 12, body, 55, {r:0.06});
  B(i0 - 0.04, j0 - 0.04, ib - i0 + 0.08, j1 - j0 + 0.08, 2.6, WHITE, 66.5, {r:0.1});
  B(i0 - 0.02, j0 - 0.02, ib - i0 + 0.04, j1 - j0 + 0.04, 3, PINK, 25, {r:0.04});
  B(i0 - 0.015, j0 - 0.015, ib - i0 + 0.03, j1 - j0 + 0.03, 1.2, WHITE, 28.6, {r:0.04});
  K.faceJ(w0, w1, j0 + 0.14, 32, 56, D("#FFF6EC", "#5A524C"), "m", 0.01);
  K.decal(200, 100, (c, w, h, dark) => { c.fillStyle = dark ? "#4A4440" : "#FFF0F4"; c.fillRect(0, 0, w, h); c.fillStyle = "#2A2A28"; c.font = "800 13px 'IBM Plex Sans KR', system-ui"; c.textAlign = "center"; c.fillText("오늘의 맛 ♡", w / 2, 16);
    [["#F4A7B9", "딸기"], ["#FFF4D6", "바닐라"], ["#A8DCC8", "민트"], ["#8A5A3C", "초코"]].forEach(([cc, t], k) => { const x = 28 + k * 48; c.fillStyle = "#E8C08A"; c.beginPath(); c.moveTo(x - 10, 46); c.lineTo(x + 10, 46); c.lineTo(x, 78); c.fill(); c.fillStyle = cc; c.beginPath(); c.arc(x, 42, 13, 0, 7); c.fill(); c.fillStyle = "#2A2A28"; c.font = "700 11px 'IBM Plex Sans KR', system-ui"; c.fillText(t, x, 94); }); },
    w1 - w0 - 0.2, hz(18), "i", (w0 + w1) / 2, j0 + 0.155, hz(45));
  // 창틀 · 받침대 · 아이스크림 통 · 콘 꽂이
  [[w0 - 0.05, 0.05], [w1, 0.05]].forEach(([i, w]) => B(i, j1 - 0.01, w, 0.05, 24, WHITE, 32, {r:0.01, cls:"s"}));
  B(w0 - 0.05, j1 - 0.01, w1 - w0 + 0.1, 0.05, 1.6, WHITE, 55.4, {r:0.01, cls:"s"});
  B(w0 - 0.1, j1 - 0.02, w1 - w0 + 0.2, 0.32, 2, WHITE, 31, {r:0.02, cls:"s"});
  [[22.4, PINK], [22.75, D("#FFF4D6", "#8A8270")], [23.1, MINT]].forEach(([i, cc]) => { B(i - 0.13, j1 + 0.04, 0.26, 0.22, 3, D("#FFFFFF", "#8A847C"), 33, {r:0.03, cls:"s"}); ball(i, j1 + 0.15, 36.5, 0.1, cc, "m", 12).scale.y = 0.6; });
  { const ci = 23.65, cj = j1 + 0.14; B(ci - 0.15, cj - 0.08, 0.3, 0.16, 5, PINK, 33, {r:0.03, cls:"s"}); [-0.08, 0, 0.08].forEach(d => K.sm(myGeo(new THREE.ConeGeometry(0.03, 0.14, 8)), D("#E8C08A", "#7A6040"), X(ci + d), hz(38) + 0.07, Z(cj), null, "m").rotation.x = PI); }
  // 줄무늬 차양 (분홍 · 흰) · 방울 끝
  { const a0 = w0 - 0.25, a1 = w1 + 0.25, n = 6, dj = 0.62, dz = hz(6), len = Math.hypot(dj, dz), ang = Math.atan2(dz, dj);
    for(let k = 0; k < n; k++){ const w = (a1 - a0) / n, o = K.sm(K.rbox(w, 0.03, len, 0), k % 2 ? WHITE : PINK, X(a0 + w * (k + 0.5)), hz(63) - dz / 2, Z(j1 + dj / 2 + 0.02), null, "m"); o.rotation.x = ang; }
    for(let k = 0; k <= 12; k++) ball(a0 + (a1 - a0) * k / 12, j1 + dj + 0.03, 56.6, 0.055, k % 2 ? WHITE : PINK, "m", 10); }
  // 운전석: 보닛 · 위 · 앞유리 · 옆창 · 지붕 · 범퍼 · 눈 같은 전조등 · 볼터치
  B(ib, j0 + 0.05, i1 - ib, j1 - j0 - 0.1, 22, body2, 10, {r:0.12});
  B(ib, j0 + 0.1, 0.98, j1 - j0 - 0.2, 22, body2, 32, {r:0.1});
  B(ib - 0.02, j0 + 0.08, 1.04, j1 - j0 - 0.16, 2, WHITE, 54, {r:0.06});
  K.faceI(ib + 0.98, j0 + 0.25, j1 - 0.25, 36, 51, D("#46536A", "#202836"), "s", 0.012); K.faceJ(ib + 0.12, ib + 0.82, j1 - 0.1, 36, 51, D("#46536A", "#202836"), "s", 0.012);
  B(i1 - 0.04, j0 + 0.12, 0.1, j1 - j0 - 0.24, 4, gray, 9, {r:0.03, cls:"s"});
  [j0 + 0.38, j1 - 0.38].forEach(j => { const e = K.sm(K.cyl(0.09, 0.09, 0.03, 16), D("#FFF6DA", "#FFF1C2"), X(i1 + 0.005), hz(24), Z(j), null, "glow"); e.rotation.z = PI / 2; });
  [j0 + 0.5, j1 - 0.5].forEach(j => { const e = K.sm(K.cyl(0.05, 0.05, 0.02, 12), PINK, X(i1 + 0.005), hz(19), Z(j), null, "m"); e.rotation.z = PI / 2; });
  K.faceI(i1 + 0.0, j0 + 0.62, j1 - 0.62, 16, 17.5, D("#B5607E", "#7A5866"), "m", 0.012);
  [j0 + 0.25, j1 - 0.25].forEach(j => B(i0 - 0.03, j - 0.1, 0.03, 0.2, 4, "#D23A44", 22, {r:0.01, cls:"glow"}));
  // 옆 글씨 · 그림 · 지붕 간판 · 스피커
  K.decal(300, 110, (c, w, h, dark) => { c.fillStyle = dark ? "#FFE8F0" : "#FFFFFF"; c.font = "900 46px 'IBM Plex Sans KR', system-ui"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = dark ? "#F4C7D4" : "#E8789E"; c.fillText("아이스크림", w / 2, h * 0.5);
    for(let k = 0; k < 18; k++){ c.fillStyle = RB[k % 6]; c.save(); c.translate(rnd(k + 5) * w, rnd(k + 9) > 0.5 ? h * 0.1 : h * 0.9); c.rotate(rnd(k) * 3); c.fillRect(-5, -2, 10, 4); c.restore(); } }, 2.0, hz(9), "i", (i0 + ib) / 2 - 0.05, j1 - 0.02, hz(16.5));
  B(21.95, 14.95, 2.3, 0.08, 14, WHITE, 69, {r:0.04}); B(21.92, 14.94, 2.36, 0.1, 1.4, PINK, 82.6, {r:0.02});
  K.wtext("말랑 아이스크림 🍦", 23.1, 15.06, 76, "i", 2.7, D("#E8789E", "#F4C7D4"), null, 900, K.FONT);
  [22.1, 24.1].forEach(i => rod([i, 14.99, 66], [i, 14.99, 69], 0.02, CHAIN, "s", 6));
  { const si = 24.35, sj = 14.6; B(si - 0.08, sj - 0.08, 0.16, 0.16, 4, INK, 69, {r:0.02, cls:"s"}); K.sm(myGeo(new THREE.ConeGeometry(0.11, 0.16, 12, 1, true)), GOLD, X(si), hz(75) + 0.06, Z(sj), null, "s").rotation.z = -PI / 2; }
  // 메뉴판 (세워 두는 A판) · 쓰레기통
  { const mi = 26.95, mj = 16.55; rod([mi - 0.22, mj - 0.12, 0], [mi - 0.22, mj, 28], 0.015, WOODD, "s", 5); rod([mi + 0.22, mj - 0.12, 0], [mi + 0.22, mj, 28], 0.015, WOODD, "s", 5);
    rod([mi - 0.22, mj + 0.16, 0], [mi - 0.22, mj, 28], 0.015, WOODD, "s", 5); rod([mi + 0.22, mj + 0.16, 0], [mi + 0.22, mj, 28], 0.015, WOODD, "s", 5);
    B(mi - 0.26, mj + 0.02, 0.52, 0.03, 24, D("#33403A", "#1E2622"), 3, {r:0.01});
    K.decal(120, 150, (c, w, h) => { c.fillStyle = "#FFFFFF"; c.textAlign = "center"; c.font = "800 16px 'IBM Plex Sans KR', system-ui"; c.fillText("MENU 🍦", w / 2, 22); c.font = "700 13px 'IBM Plex Sans KR', system-ui";
      [["딸기콘", "#F4C7D4"], ["바닐라콘", "#FFF4D6"], ["민트초코", "#A8DCC8"], ["무지개 컵", "#F6E39A"]].forEach(([t, cc], k) => { c.fillStyle = cc; c.fillText(t + "  1,500", w / 2, 50 + k * 24); }); c.fillStyle = "#F4A7B9"; c.fillText("♡ 어린이 반값 ♡", w / 2, 142); },
      0.46, hz(22), "i", mi, mj + 0.05, hz(15)); }
  { const ti = 27.35, tj = 14.0; K.sm(K.cyl(0.18, 0.16, hz(20), 16), MINT, X(ti), hz(10), Z(tj), null, "s"); disc(ti, tj, 0.2, 20, 1.6, WHITE, "s", 16); }
}
function tables(){
  TABLES.forEach(([ti, tj], k) => { disc(ti, tj, 0.38, 17, 1.6, WHITE, "s", 28); K.sm(K.cyl(0.03, 0.03, hz(17), 8), WOODD, X(ti), hz(8.5), Z(tj), null, "s"); disc(ti, tj, 0.16, 0, 0.8, WOODD, "s", 14);
    rod([ti, tj, 18.6], [ti, tj, 64], 0.02, WHITE);
    K.sm(myGeo(new THREE.ConeGeometry(0.85, hz(14), 12, 1, true)), k ? LILAC : PINK, X(ti), hz(66), Z(tj), null, "m");
    const sl = myGeo(new THREE.ConeGeometry(0.86, hz(14), 12, 1, true, 0, PI / 6)); [0, 2, 4, 6, 8, 10].forEach(n => { const o = K.sm(sl, WHITE, X(ti), hz(66) + 0.004, Z(tj), null, "m"); o.rotation.y = n * PI / 6; });
    ball(ti, tj, 74, 0.05, WHITE, "s", 8);
    stool(ti - 0.62, tj, k ? MINT : PINK2); stool(ti + 0.62, tj, k ? YEL : LILAC2);
    ball(ti + 0.1, tj - 0.05, 19, 0.05, k ? "#A8DCC8" : "#F4A7B9", "m", 8); K.sm(myGeo(new THREE.ConeGeometry(0.035, 0.12, 8)), D("#E8C08A", "#7A6040"), X(ti + 0.1), hz(19) - 0.02, Z(tj - 0.05), null, "m").rotation.x = PI; });
}
/* =================================================================== 피크닉 · 비눗방울 · 강아지 동상 */
function picnic(){
  const [ci, cj] = PIC, tb = D("#C9A27A", "#6B4E38");
  B(ci - 0.8, cj - 0.4, 1.6, 0.8, 1.8, tb, 17, {r:0.03}); B(ci - 0.8, cj - 1.0, 1.6, 0.3, 1.6, tb, 10.6, {r:0.03}); B(ci - 0.8, cj + 0.7, 1.6, 0.3, 1.6, tb, 10.6, {r:0.03});
  [ci - 0.62, ci + 0.62].forEach(i => { rod([i, cj - 0.85, 0], [i, cj - 0.05, 17], 0.03, WOODD, "m", 6); rod([i, cj + 0.85, 0], [i, cj + 0.05, 17], 0.03, WOODD, "m", 6); B(i - 0.03, cj - 0.95, 0.06, 1.9, 1.4, WOODD, 9.2, {r:0.01}); });
  // 도시락 · 김밥 · 컵 · 과일
  B(ci - 0.5, cj - 0.2, 0.42, 0.3, 3, PINK, 18.8, {r:0.04}); B(ci - 0.5, cj - 0.2, 0.42, 0.3, 0.8, D("#FFFFFF", "#8A847C"), 21.8, {r:0.04});
  disc(ci + 0.15, cj, 0.17, 18.8, 0.8, WHITE, "s", 18); [[-0.07, 0], [0, 0.05], [0.07, -0.01], [0.02, -0.07]].forEach(([di, dj]) => { const g = K.sm(K.cyl(0.035, 0.035, 0.03, 10), D("#2E3A2E", "#1E241E"), X(ci + 0.15 + di), hz(19.6) + 0.015, Z(cj + dj), null, "m"); disc(ci + 0.15 + di, cj + dj, 0.022, 19.6, 1.05, "#FFFFFF", "m", 8); });
  [[ci + 0.55, cj - 0.15, "#F4A7B9"], [ci + 0.58, cj + 0.15, "#A9CBEA"]].forEach(([i, j, cc]) => K.sm(K.cyl(0.05, 0.04, hz(5), 10), cc, X(i), hz(18.8 + 2.5), Z(j), null, "glass"));
  [[-0.05, 0], [0.05, 0.03]].forEach(([di, dj], k) => ball(ci - 0.15 + di, cj + 0.22 + dj, 20.5, 0.05, k ? "#E06A55" : "#F6E39A", "m", 8));
}
function blanket(){
  const [bi, bj] = BLK;
  [[bi - 0.6, PINK2], [bi + 0.6, LILAC2]].forEach(([i, cc]) => B(i - 0.22, bj - 0.22, 0.44, 0.44, 3.6, cc, 0, {r:0.12}));
  // 바구니 · 손잡이 · 체크 덮개
  B(bi - 0.2, bj - 0.32, 0.4, 0.28, 7, D("#D9B98F", "#6B5440"), 0, {r:0.04}); B(bi - 0.19, bj - 0.31, 0.38, 0.26, 1, D("#F4C7D4", "#6A4E5A"), 7, {r:0.04});
  { const h = K.sm(myGeo(new THREE.TorusGeometry(0.16, 0.014, 5, 16, PI)), WOODD, X(bi), hz(7.5), Z(bj - 0.18), null, "m"); }
  disc(bi + 0.05, bj + 0.2, 0.16, 0.4, 0.6, WHITE, "s", 16); [[-0.06, 0], [0.06, 0.02]].forEach(([di, dj]) => B(bi + 0.05 + di - 0.05, bj + 0.2 + dj - 0.04, 0.1, 0.08, 1.6, D("#FFF4D6", "#8A8270"), 0.9, {r:0.01}));
  K.sm(K.cyl(0.04, 0.045, hz(7), 10), D("#F9C99B", "#8A6A4E"), X(bi + 0.3), hz(3.5), Z(bj - 0.05), null, "glass");
}
function bubbleStand(){
  const [bi, bj] = BUB, cart = D("#FFFFFF", "#8A847C");
  B(bi - 0.45, bj - 0.28, 0.9, 0.56, 18, cart, 4, {r:0.04}); B(bi - 0.47, bj - 0.3, 0.94, 0.6, 1.6, LILAC, 22, {r:0.03});
  K.faceJ(bi - 0.4, bi + 0.4, bj + 0.28, 7, 19, D("#C8E8F4", "#4E6A88"), "m", 0.012);
  K.wtext("비눗방울 🫧", bi, bj + 0.305, 13, "i", 2.0, D("#6A7AB8", "#E2D6EA"), null, 800, K.FONT);
  [[bi - 0.32, bj - 0.3], [bi + 0.32, bj - 0.3]].forEach(([i, j]) => { const w = K.sm(K.cyl(0.08, 0.08, 0.04, 14), INK, X(i), 0.08, Z(j), null, "s"); w.rotation.x = PI / 2; });
  rod([bi + 0.42, bj + 0.0, 22], [bi + 0.6, bj + 0.0, 26], 0.014, CHAIN, "s", 5);
  // 비눗물 병 · 막대 · 줄무늬 지붕
  [[-0.25, SKY], [-0.05, PINK], [0.15, MINT]].forEach(([d, cc]) => { K.sm(K.cyl(0.06, 0.06, hz(8), 12), cc, X(bi + d), hz(23.6 + 4), Z(bj - 0.05), null, "glass"); disc(bi + d, bj - 0.05, 0.035, 31.6, 1.4, WHITE, "s", 10); });
  { const wi = bi + 0.32, wj = bj + 0.05; K.sm(K.cyl(0.07, 0.06, hz(7), 12), YEL, X(wi), hz(27), Z(wj), null, "s"); [[-0.03, 0.2], [0.03, -0.2], [0, 0]].forEach(([d, a]) => { rod([wi + d, wj, 26], [wi + d + a * 0.2, wj, 40], 0.008, PINK, "s", 4); const r = K.sm(myGeo(new THREE.TorusGeometry(0.045, 0.008, 5, 14)), PINK, X(wi + d + a * 0.2), hz(41.4), Z(wj), null, "s"); }); }
  [[bi - 0.42, bj - 0.25], [bi + 0.42, bj - 0.25]].forEach(([i, j]) => rod([i, j, 23.6], [i, j, 56], 0.016, WHITE, "s", 6));
  for(let k = 0; k < 5; k++){ const w = 0.96 / 5, o = K.sm(K.rbox(w, 0.025, 0.7, 0), k % 2 ? WHITE : SKY, X(bi - 0.48 + w * (k + 0.5)), hz(56), Z(bj - 0.02), null, "m"); o.rotation.x = 0.18; }
  for(let k = 0; k <= 8; k++) ball(bi - 0.48 + 0.96 * k / 8, bj + 0.33, 54.6, 0.04, k % 2 ? WHITE : SKY, "m", 8);
}
function dogStatue(){
  const [di, dj] = DOG, cr = D("#FFF6EA", "#8A8278"), cr2 = D("#F3E6D4", "#7A7268"), z0 = 10;
  B(di - 0.4, dj - 0.4, 0.8, 0.8, z0, STONE2, 0, {r:0.05}); B(di - 0.44, dj - 0.44, 0.88, 0.88, 1.6, STONE, z0, {r:0.05});
  K.decal(150, 50, (c, w, h, dark) => { c.fillStyle = "#E8C36A"; c.fillRect(0, 0, w, h); c.fillStyle = "#5A4020"; c.font = "800 18px 'IBM Plex Sans KR', system-ui"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("멍멍이 동상 🐾", w / 2, h * 0.38); c.font = "600 11px 'IBM Plex Sans KR', system-ui"; c.fillText("쓰다듬어 주세요", w / 2, h * 0.78); }, 0.6, hz(7), "j", di + 0.4, dj, hz(5));
  const z = z0 + 1.6;
  ball(di, dj - 0.05, z + 5, 0.2, cr, "m", 16).scale.set(0.9, 1.0, 1.15);            // 엉덩이
  ball(di + 0.05, dj, z + 10, 0.15, cr, "m", 14).scale.set(0.85, 1.15, 0.9);        // 가슴
  ball(di + 0.12, dj, z + 17.5, 0.15, cr, "m", 16);                                 // 머리 (+i 쪽 = 사람 쪽을 봄)
  ball(di + 0.24, dj, z + 16.4, 0.07, cr2, "m", 12).scale.set(1.1, 0.8, 1.0);       // 주둥이
  ball(di + 0.31, dj, z + 17.0, 0.028, INK, "s", 8);                                // 코
  [-0.065, 0.065].forEach(d => { ball(di + 0.24, dj + d, z + 19, 0.02, INK, "s", 8); ball(di + 0.22, dj + d * 1.5, z + 16.5, 0.028, PINK, "m", 6); });
  [-1, 1].forEach(s => { const e = ball(di + 0.08, dj + s * 0.15, z + 17, 0.07, cr2, "m", 10); e.scale.set(0.6, 1.4, 0.5); e.rotation.x = s * 0.3; });
  [-0.08, 0.08].forEach(d => ball(di + 0.18, dj + d, z + 2, 0.055, cr, "m", 10).scale.set(1.3, 0.7, 1));   // 앞발
  { const t = K.sm(myGeo(new THREE.TorusGeometry(0.07, 0.025, 6, 12, PI * 1.3)), cr, X(di - 0.2), hz(z + 9), Z(dj), null, "m"); t.rotation.y = PI / 2; }
  { const c = K.sm(myGeo(new THREE.TorusGeometry(0.11, 0.022, 6, 18)), PINK, X(di + 0.07), hz(z + 13), Z(dj), null, "m"); c.rotation.x = PI / 2; c.rotation.y = 0.35; }
  ball(di + 0.19, dj, z + 11.6, 0.03, GOLD, "s", 8);
  bush(di + 0.1, dj + 0.9, 0.7, "#F4A7B9");
}
function playgroundSigns(){
  // 놀이터 이름표 (아치 판)
  const si = 11.7, sj = 1.6; [si - 0.02].forEach(i => rod([i, sj - 0.45, 0], [i, sj - 0.45, 38], 0.025, SPROUT)); rod([si, sj + 0.45, 0], [si, sj + 0.45, 38], 0.025, SPROUT);
  B(si - 0.04, sj - 0.55, 0.08, 1.1, 12, AMBER, 30, {r:0.04});
  K.decal(220, 60, (c, w, h) => { c.fillStyle = "#FFFFFF"; c.font = "900 30px 'IBM Plex Sans KR', system-ui"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("무지개 놀이터", w / 2, h * 0.55); }, 1.0, hz(10), "j", si + 0.02, sj, hz(36));
}

/* =================================================================== 움직이는 것 */
function buildSwings(){
  return SW.si.map((si, k) => { const M = Merge(), L = SW_L;
    [-0.19, 0.19].forEach(x => { M.add(K.cyl(0.007, 0.007, L, 5), CHAIN, x, -L / 2, 0); for(let n = 1; n < 9; n++) M.add(K.sph(0.013, 6, 4), CHAIN, x, -L * n / 9, 0); });
    M.add(K.rbox(0.5, 0.045, 0.2, 0.02), k ? LILAC : AMBER, 0, -L - 0.0225, 0);
    M.add(K.rbox(0.44, 0.012, 0.16, 0.005), k ? LILAC2 : AMBER2, 0, -L + 0.006, 0);
    const m = dynMesh(M.geo()); m.position.set(X(si), hz(SW.zp), Z(SW.j)); return m; });
}
function buildSeesaw(){
  const M = Merge();
  M.add(K.rbox(2 * SS.half, 0.07, 0.2, 0.02), AMBER, 0, 0, 0);
  { const ax = K.cyl(0.05, 0.05, 0.56, 12).clone(); ax.rotateX(PI / 2); M.add(ax, IRON, 0, 0, 0); }
  [-1, 1].forEach(s => { M.add(K.rbox(0.38, 0.045, 0.3, 0.02), s > 0 ? PINK : MINT, s * SS.arm, 0.0575, 0);
    const hx = s * (SS.arm - 0.32); M.add(rodG([hx, 0.03, 0], [hx, 0.3, 0], 0.018), WHITE); M.add(rodG([hx, 0.3, -0.13], [hx, 0.3, 0.13], 0.02), s > 0 ? PINK : MINT);
    M.add(K.sph(0.03, 8, 6), WHITE, hx, 0.3, 0.14); M.add(K.sph(0.03, 8, 6), WHITE, hx, 0.3, -0.14); });
  const m = dynMesh(M.geo()); m.position.set(X(SS.ci), SS.yp, Z(SS.cj)); return m;
}
function buildMerry(){
  const M = Merge(), r = MG.r, y0 = hz(2), y1 = hz(7);
  M.add(K.cyl(r, r, y1 - y0, 40), D("#FFFFFF", "#8A847C"), 0, (y0 + y1) / 2, 0);
  RB.forEach((cc, k) => M.add(new THREE.CylinderGeometry(r - 0.05, r - 0.05, 0.012, 8, 1, false, k * PI / 3, PI / 3), D(cc, K.shade(cc, -0.45)), 0, y1 + 0.006, 0));
  { const t = new THREE.TorusGeometry(r, 0.025, 6, 48); t.rotateX(PI / 2); M.add(t, PINK, 0, (y0 + y1) / 2, 0); }
  M.add(K.cyl(0.07, 0.1, hz(26) - y1, 14), IRON, 0, (y1 + hz(26)) / 2, 0);
  { const t = new THREE.TorusGeometry(0.2, 0.02, 6, 24); t.rotateX(PI / 2); M.add(t, AMBER, 0, hz(27), 0); }
  [0, 2.1, 4.2].forEach(a => M.add(rodG([0, hz(27), 0], [0.2 * Math.cos(a), hz(27), -0.2 * Math.sin(a)], 0.012), AMBER));
  M.add(K.sph(0.06, 10, 8), PINK, 0, hz(28), 0);
  // 손잡이 셋 (θ = 0.55 + 120°씩) · 방석 셋 (θ = 0, 120°, 240°). 방석 0번이 유나 자리 (로컬 +x)
  [0, 1, 2].forEach(n => { const a = 0.55 + n * 2 * PI / 3, c = Math.cos(a), s = -Math.sin(a), R = r - 0.1;
    M.add(rodG([R * c, y1, R * s], [R * c, hz(22), R * s], 0.02), RB[n * 2]); M.add(rodG([R * c, hz(22), R * s], [0.16 * c, hz(24), 0.16 * s], 0.02), RB[n * 2]);
    const b = 2 * PI / 3 * n; M.add(K.rbox(0.26, 0.03, 0.22, 0.012), n ? LILAC2 : PINK2, MG.ride * Math.cos(b), y1 + 0.027, -MG.ride * Math.sin(b), 0, b, 0); });
  const m = dynMesh(M.geo()); m.position.set(X(MG.ci), 0, Z(MG.cj)); return m;
}
function buildCone(){
  const M = Merge(), wf = D("#E8C08A", "#7A6040");
  { const g = new THREE.ConeGeometry(0.17, 0.5, 16); g.rotateX(PI); M.add(g, wf, 0, 0.25, 0); }
  { const t = new THREE.TorusGeometry(0.165, 0.025, 6, 20); t.rotateX(PI / 2); M.add(t, D("#D9A86A", "#6A5030"), 0, 0.5, 0); }
  M.add(K.sph(0.2, 16, 12), D("#F4A7B9", "#7A5866"), 0, 0.62, 0); M.add(K.sph(0.165, 16, 12), D("#FFF4D6", "#8A8270"), 0.02, 0.86, 0.01);
  M.add(K.sph(0.13, 14, 10), D("#A8DCC8", "#4E7A6E"), -0.01, 1.05, 0); M.add(K.sph(0.05, 10, 8), "#E0303A", 0.01, 1.2, 0);
  M.add(rodG([0.01, 1.24, 0], [0.05, 1.33, 0], 0.008), "#5FA582");
  for(let k = 0; k < 22; k++){ const a = k * 2.4, y = 0.62 + (k % 3) * 0.2, r = [0.2, 0.165, 0.13][k % 3]; M.add(new THREE.BoxGeometry(0.03, 0.012, 0.012), RB[k % 6], Math.cos(a) * r * 0.95, y + 0.04 * ((k % 2) - 0.5), Math.sin(a) * r * 0.95, 0, a, 0.6); }
  [[0.17, 0.55, 0.0], [-0.12, 0.54, 0.12], [0.05, 0.52, -0.17]].forEach(([x, y, z]) => M.add(K.sph(0.04, 8, 6), D("#F4A7B9", "#7A5866"), x, y, z));
  const m = dynMesh(M.geo()); m.position.set(X(23.6), hz(69), Z(14.65)); return m;
}
/* 오리: 앞 = 로컬 +z. kind 0 흰 오리 · 1 청둥오리 · 2 아기 (노랑) */
function buildDuck(kind){
  const M = Merge(), s = kind === 2 ? 0.55 : 1, bodyC = kind === 1 ? D("#B9A68E", "#5A4E40") : kind === 2 ? D("#FFE066", "#8A7A30") : D("#FFFFFF", "#9A949C"),
    headC = kind === 1 ? D("#3A8A60", "#1E4A34") : bodyC, beak = D("#F2A03A", "#8A5A20");
  const sp = (r, sx, sy, sz) => { const g = new THREE.SphereGeometry(r, 14, 10); g.scale(sx, sy, sz); return g; };
  M.add(sp(0.16 * s, 1, 0.72, 1.32), bodyC, 0, 0.08 * s, 0);
  M.add(sp(0.08 * s, 1, 0.7, 1.2), bodyC, 0, 0.14 * s, -0.19 * s, -0.6, 0, 0);
  [-1, 1].forEach(q => M.add(sp(0.09 * s, 0.45, 0.6, 1.2), kind === 1 ? D("#8A7A6A", "#4A4036") : K.sh(bodyC, -0.06), q * 0.13 * s, 0.12 * s, -0.02 * s));
  M.add(K.sph(0.095 * s, 14, 10), headC, 0, 0.25 * s, 0.15 * s);
  if(kind === 1){ const t = new THREE.TorusGeometry(0.07 * s, 0.012 * s, 5, 14); t.rotateX(PI / 2); M.add(t, "#FFFFFF", 0, 0.18 * s, 0.13 * s); }
  M.add(new THREE.BoxGeometry(0.075 * s, 0.03 * s, 0.09 * s), beak, 0, 0.23 * s, 0.25 * s);
  [-0.045, 0.045].forEach(x => M.add(K.sph(0.016 * s, 8, 6), INK, x * s, 0.28 * s, 0.22 * s));
  if(kind !== 1) [-0.06, 0.06].forEach(x => M.add(K.sph(0.018 * s, 8, 6), PINK, x * s, 0.245 * s, 0.205 * s));
  const m = dynMesh(M.geo()); return m;
}
function buildButterfly(col){
  const M = Merge();
  [-1, 1].forEach(q => { const g = new THREE.CircleGeometry(0.07, 12); g.rotateX(-PI / 2); M.add(g, col, q * 0.065, 0, 0.02); const g2 = new THREE.CircleGeometry(0.05, 10); g2.rotateX(-PI / 2); M.add(g2, K.sh(col, 0.2), q * 0.05, 0, -0.06);
    const b = new THREE.CircleGeometry(0.07, 12); b.rotateX(PI / 2); M.add(b, col, q * 0.065, -0.001, 0.02); const b2 = new THREE.CircleGeometry(0.05, 10); b2.rotateX(PI / 2); M.add(b2, col, q * 0.05, -0.001, -0.06); });
  M.add(new THREE.CapsuleGeometry(0.012, 0.09, 3, 6).rotateX(PI / 2), INK, 0, 0.004, 0);
  return dynMesh(M.geo());
}
/* 물: 물결 그림 한 장 (낮·밤 색은 재질 색으로) */
function waveCanvas(){
  const cv = document.createElement("canvas"); cv.width = cv.height = 256; const c = cv.getContext("2d");
  c.fillStyle = "#D6E8EC"; c.fillRect(0, 0, 256, 256); c.strokeStyle = "rgba(255,255,255,.95)"; c.lineCap = "round";
  for(let k = 0; k < 26; k++){ const x = rnd(k + 1) * 256, y = rnd(k + 41) * 256, w = 20 + rnd(k + 81) * 40; c.lineWidth = 2 + rnd(k + 9) * 3;
    for(let dx = -256; dx <= 256; dx += 256) for(let dy = -256; dy <= 256; dy += 256){ c.beginPath(); c.moveTo(x + dx - w / 2, y + dy); c.quadraticCurveTo(x + dx, y + dy - 6, x + dx + w / 2, y + dy); c.stroke(); } }
  return cv;
}
function streakCanvas(){
  const cv = document.createElement("canvas"); cv.width = 64; cv.height = 128; const c = cv.getContext("2d"); c.clearRect(0, 0, 64, 128);
  for(let k = 0; k < 22; k++){ const x = rnd(k + 200) * 64, w = 1 + rnd(k + 230) * 3, a = 0.35 + rnd(k + 260) * 0.6; const g = c.createLinearGradient(0, 0, 0, 128); g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(0.5, `rgba(255,255,255,${a * 0.4})`); g.addColorStop(1, `rgba(255,255,255,${a})`);
    c.fillStyle = g; c.fillRect(x, 0, w, 128); }
  return cv;
}
const WATER = {basin:D("#8FD6E4", "#2C5A74"), pond:D("#86CEC8", "#22485A"), fall:D("#E6F8FF", "#8FB8D8")};
function buildWater(){
  const scene = K.R.scene, wcv = waveCanvas(), scv = streakCanvas();
  const tx = rep => { const t = new THREE.CanvasTexture(wcv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); t.colorSpace = THREE.SRGBColorSpace; W.tex.push(t); return t; };
  const surf = (geo, key, op, rep) => { const m = K.cutaway(new THREE.MeshStandardMaterial({color:WATER[key][0], map:tx(rep), transparent:true, opacity:op, roughness:0.12, metalness:0.05, depthWrite:false}));
    W.waters.push({m, k:key}); const o = new THREE.Mesh(geo, m); o.renderOrder = 2; o.receiveShadow = true; scene.add(o); return o; };
  const circ = (r, y) => { const g = new THREE.CircleGeometry(r, 48); g.rotateX(-PI / 2); g.translate(X(PC[0]), y, Z(PC[1])); return g; };
  surf(circ(1.375, 0.33), "basin", 0.8, 1.2); surf(circ(0.625, 1.27), "basin", 0.85, 0.6); surf(circ(0.275, 1.705), "basin", 0.85, 0.3);
  { const sh = new THREE.Shape(POND.map(([i, j]) => new THREE.Vector2(X(i), -Z(j)))); const g = new THREE.ShapeGeometry(sh, 4); g.rotateX(-PI / 2); g.translate(0, 0.016, 0); W.pond = surf(g, "pond", 0.58, 0.32); }
  // 접시에서 떨어지는 물 커튼 (줄무늬가 아래로 흐름)
  const st = new THREE.CanvasTexture(scv); st.wrapS = st.wrapT = THREE.RepeatWrapping; st.repeat.set(7, 1); W.streak = st;
  const fm = K.cutaway(new THREE.MeshBasicMaterial({color:WATER.fall[0], map:st, transparent:true, opacity:0.75, depthWrite:false, side:THREE.DoubleSide}));
  W.waters.push({m:fm, k:"fall"});
  [[0.705, 0.76, 1.31, 0.34], [0.32, 0.36, 1.735, 1.28]].forEach(([r0, r1, y0, y1]) => { const g = new THREE.CylinderGeometry(r0, r1, y0 - y1, 40, 1, true); const o = new THREE.Mesh(g, fm); o.position.set(X(PC[0]), (y0 + y1) / 2, Z(PC[1])); o.renderOrder = 3; scene.add(o); });
  // 물방울 · 물결 고리 · 비눗방울 (인스턴싱. 작은 것이라 벽 자르기 안 함)
  W.dN = 64; W.dm = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshBasicMaterial({color:0xB8E6FA, transparent:true, opacity:0.9, depthWrite:false}), W.dN); W.dm.frustumCulled = false; W.dm.renderOrder = 3; scene.add(W.dm);
  { const rg = new THREE.RingGeometry(0.9, 1, 40); rg.rotateX(-PI / 2); W.rN = 14; W.rm = new THREE.InstancedMesh(rg, new THREE.MeshBasicMaterial({transparent:true, blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false}), W.rN); W.rm.frustumCulled = false; W.rm.renderOrder = 3; scene.add(W.rm);
    for(let k = 0; k < W.rN; k++){ W.rm.setMatrixAt(k, ZERO); W.rm.setColorAt(k, col.set(0)); } }
  W.bN = 40; W.bm = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 16, 12), new THREE.MeshStandardMaterial({transparent:true, opacity:0.5, roughness:0.04, metalness:0.2, emissive:0x302838, depthWrite:false, envMapIntensity:1.6}), W.bN); W.bm.frustumCulled = false; W.bm.renderOrder = 4; scene.add(W.bm);
  for(let k = 0; k < W.bN; k++){ W.bm.setMatrixAt(k, ZERO); W.bm.setColorAt(k, col.set(["#FFB8D2", "#A8DCFF", "#CDB8FF", "#B0F0D6", "#FFE29A"][k % 5])); }
}
function buildGlows(){
  const gc = document.createElement("canvas"); gc.width = gc.height = 64; { const x = gc.getContext("2d"), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.35, "rgba(255,255,255,.45)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(0, 0, 64, 64); }
  W.gtex = new THREE.CanvasTexture(gc);
  const gm = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({map:W.gtex, transparent:true, blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false}), Math.max(1, W.glows.length));
  gm.frustumCulled = false; gm.renderOrder = 3; K.R.scene.add(gm); W.gm = gm;
}
function bulbLine(list){   // 트럭 차양 전구 줄 (밤에만 반짝)
  W.bulbs = list; list.forEach(([i, j, z]) => gl(i, j, z, 8, "#FFD68C", (tm, dk) => dk ? 0.55 : 0));
  W.blm = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), new THREE.MeshBasicMaterial({toneMapped:false}), list.length); W.blm.frustumCulled = false; K.R.scene.add(W.blm);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(0.03, 0.03, 0.03);
  list.forEach(([i, j, z], k) => { W.blm.setMatrixAt(k, m.compose(new THREE.Vector3(X(i), hz(z), Z(j)), q, s)); W.blm.setColorAt(k, new THREE.Color("#E6E1D8")); });
}
function buildDyn(){
  W.swings = buildSwings(); W.saw = buildSeesaw(); W.merry = buildMerry(); W.cone = buildCone();
  W.ducks = [0, 1, 0, 2, 2].map(k => buildDuck(k)); W.duckSt = W.ducks.map(() => ({i:0, j:0, h:0, w:0, pi:0, pj:0}));
  W.flies = ["#F4A7B9", "#F6E39A", "#A9CBEA", "#C8B4D0"].map(c => buildButterfly(D(c, K.shade(c, -0.4))));
  buildWater();
  // 막기 상자: 그네 판 · 시소 판 · 뺑뺑이 (낮은 단 + 가운데 기둥) · 정글짐 · 연못 물 (다리 줄은 비움)
  SW.si.forEach(si => block(si - 0.28, SW.j - 0.2, si + 0.28, SW.j + 0.2, 0.45));
  block(SS.ci - SS.half - 0.05, SS.cj - 0.16, SS.ci + SS.half + 0.05, SS.cj + 0.16, 0.55);
  block(MG.ci - MG.r, MG.cj - MG.r, MG.ci + MG.r, MG.cj + MG.r, hz(7)); block(MG.ci - 0.14, MG.cj - 0.14, MG.ci + 0.14, MG.cj + 0.14, 0.9);
  block(JG.i0 - 0.04, JG.j0 - 0.04, JG.i0 + JG.ni * JG.c + 0.04, JG.j0 + JG.nj * JG.c + 0.04, 1.42);
  { const xs = POND.map(p => p[0]), lo = Math.min(...xs), hi = Math.max(...xs);
    const run = (a, b) => { for(let i = a; i < b - 1e-6; i += 0.2){ const i1 = Math.min(b, i + 0.2), ss = [pondSpan(i + 0.01), pondSpan((i + i1) / 2), pondSpan(i1 - 0.01)].filter(Boolean); if(!ss.length) continue;
      block(i, Math.min(...ss.map(s => s[0])), i1, Math.max(...ss.map(s => s[1])), 0.5); } };
    run(lo, BR.i0 - 0.05); run(BR.i1 + 0.05, hi + 0.01); }
  // 빛: 가로등 · 분수 물속 등 · 트럭 창 · 화장실 처마 · 반딧불
  LAMPS.forEach(([i, j]) => gl(i, j, 76, 30, "#FFE2A8", (tm, dk) => dk ? 0.62 : 0.02));
  for(let k = 0; k < 6; k++){ const a = k / 6 * 2 * PI + 0.3; gl(PC[0] + Math.cos(a) * 1.15, PC[1] + Math.sin(a) * 1.15, 11, 34, k % 2 ? "#FFC0E0" : "#9FE8FF", (tm, dk) => dk ? 0.42 + Math.sin(tm * 0.002 + k) * 0.08 : 0); }
  gl(PC[0], PC[1], 60, 60, "#BFE8FF", (tm, dk) => dk ? 0.16 : 0);
  gl(23.1, 15.3, 44, 50, "#FFE8F0", (tm, dk) => dk ? 0.5 : 0.05);
  gl(15.5, 2.42, 58, 18, "#FFE2A8", (tm, dk) => dk ? 0.6 : 0);
  gl(TR.i1 + 0.05, TR.j0 + 0.38, 24, 14, "#FFF3C2", (tm, dk) => dk ? 0.7 : 0); gl(TR.i1 + 0.05, TR.j1 - 0.38, 24, 14, "#FFF3C2", (tm, dk) => dk ? 0.7 : 0);
  W.ff = []; for(let k = 0; k < 9; k++) W.ff.push(gl(0, 0, 20, 7, "#E8FF9A", (tm, dk) => dk ? 0.5 + Math.sin(tm * 0.004 + k * 1.7) * 0.4 : 0));
  { const L = []; for(let k = 0; k <= 12; k++) L.push([TR.w0 - 0.25 + (TR.w1 - TR.w0 + 0.5) * k / 12, TR.j1 + 0.69, 55.6 - Math.sin(k / 12 * PI) * 1.2]); bulbLine(L); }
  buildGlows();
}

/* ---------- 매 프레임 ---------- */
const m4 = new THREE.Matrix4(), qn = new THREE.Quaternion(), v3 = new THREE.Vector3(), sc3 = new THREE.Vector3(), col = new THREE.Color(), ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
const drop = (k, x, y, z, s) => { if(k >= W.dN) return; if(s <= 0){ W.dm.setMatrixAt(k, ZERO); return; } W.dm.setMatrixAt(k, m4.compose(v3.set(x, y, z), qn.identity(), sc3.set(s, s * 1.25, s))); };
const ripple = (k, x, y, z, r, a) => { if(k >= W.rN) return; if(a <= 0 || r <= 0){ W.rm.setMatrixAt(k, ZERO); return; } W.rm.setMatrixAt(k, m4.compose(v3.set(x, y, z), qn.identity(), sc3.set(r, 1, r))); W.rm.setColorAt(k, col.setScalar(a)); };
const bubble = (k, x, y, z, s) => { if(k >= W.bN) return; if(s <= 0){ W.bm.setMatrixAt(k, ZERO); return; } W.bm.setMatrixAt(k, m4.compose(v3.set(x, y, z), qn.identity(), sc3.set(s, s, s))); };
/* 오리 길: 연못 안 타원 세 개 · 아기 둘은 엄마(0번) 뒤를 따라감 */
const DUCK_PATH = [{c:[25.5, 5.0], rx:2.1, ry:1.15, w:0.16, a0:0}, {c:[24.0, 5.9], rx:1.25, ry:0.85, w:-0.2, a0:1.5}, {c:[26.9, 4.7], rx:0.95, ry:0.7, w:0.24, a0:3}];
function duckPos(k, t){
  if(k >= 3){ const P = DUCK_PATH[0], a = P.a0 + t * P.w - (k - 2) * 0.2; return [P.c[0] + P.rx * 0.97 * Math.cos(a), P.c[1] + P.ry * 0.97 * Math.sin(a)]; }
  const P = DUCK_PATH[k], a = P.a0 + t * P.w; return [P.c[0] + P.rx * Math.cos(a), P.c[1] + P.ry * Math.sin(a)];
}
function animate(tm, dt){
  const dk = !!K.R.dark, red = !!K.reduce, t = red ? 0 : tm / 1000;
  // 분수: 위로 솟았다 떨어지는 물줄기 (동전 던지면 boost) · 가장자리 여섯 물줄기
  W.bk += ((tm < W.boost ? 1 : 0) - W.bk) * Math.min(1, dt * 2.5);
  const bk = W.bk, [ci, cj] = PC; let n = 0;
  const rL = 0.3 + 0.9 * bk, yL = 1.72 + (0.33 - 1.72) * bk, ap = 0.42 + 1.1 * bk;
  for(let k = 0; k < 18; k++){ const ph = (t * 0.6 + k / 18) % 1, a = k * 2.39996, r = rL * ph, y = 1.8 + ap * 4 * ph * (1 - ph) + (yL - 1.8) * ph * ph;
    drop(n++, X(ci) + Math.cos(a) * r, y, Z(cj) + Math.sin(a) * r, red ? 0 : 0.038 + 0.012 * (k % 2)); }
  for(let q = 0; q < 6; q++){ const a = q / 6 * 2 * PI + 0.26; for(let m = 0; m < 6; m++){ const ph = (t * 0.85 + m / 6 + q * 0.07) % 1, r = 1.42 - 0.95 * ph, y = 0.42 + 0.5 * 4 * ph * (1 - ph) - 0.09 * ph;
    drop(n++, X(ci) + Math.cos(a) * r, y, Z(cj) + Math.sin(a) * r, red ? 0 : 0.032); } }
  while(n < W.dN) drop(n++, 0, 0, 0, 0);
  W.dm.instanceMatrix.needsUpdate = true;
  W.tex.forEach((tx, k) => { tx.offset.set((t * 0.012 * (k % 2 ? 1 : -1)) % 1, (t * 0.018) % 1); });
  if(W.streak) W.streak.offset.y = (t * 0.9) % 1;
  // 오리: 길 따라 헤엄 · 유나가 밥 주는 곳에 오면 그쪽으로 모임
  const feed = tm < W.feed || K.yuNear(DUCK_SPOT[0], DUCK_SPOT[1], 1.4);
  let r = 0;
  W.ducks.forEach((m, k) => { const S = W.duckSt[k], [pi, pj] = duckPos(k, t), tg = [DUCK_SPOT[0] + (k - 2) * 0.32, DUCK_SPOT[1] - 1.05 - (k % 2) * 0.28];
    S.w += ((feed ? 1 : 0) - S.w) * Math.min(1, dt * 0.7); const i = pi + (tg[0] - pi) * S.w, j = pj + (tg[1] - pj) * S.w;
    const di = i - S.i, dj = j - S.j; if(Math.hypot(di, dj) > 1e-4){ const hh = Math.atan2(di, dj); S.h += Math.atan2(Math.sin(hh - S.h), Math.cos(hh - S.h)) * Math.min(1, dt * 4); }
    else if(feed && !red) S.h += Math.sin(t * 1.3 + k) * dt * 0.6;
    S.i = i; S.j = j; m.position.set(X(i), 0.012 + (red ? 0 : Math.sin(t * 3 + k) * 0.008), Z(j)); m.rotation.y = S.h; m.rotation.z = red ? 0 : Math.sin(t * 2.2 + k) * 0.04;
    if(k < 3){ const ph = (t * 0.5 + k / 3) % 1; ripple(r++, X(i - Math.sin(S.h) * 0.12), 0.03, Z(j - Math.cos(S.h) * 0.12), 0.12 + ph * 0.45, red ? 0 : (1 - ph) * 0.22); } });
  // 수반 물결 (물방울 떨어지는 자리)
  for(let k = 0; k < 6; k++){ const ph = (t * 0.7 + k / 6) % 1, cyc = Math.floor(t * 0.7 + k / 6), a = rnd(cyc * 7 + k) * 7, rr = 0.55 + rnd(cyc * 3 + k) * 0.7;
    ripple(r++, X(ci) + Math.cos(a) * rr, 0.335, Z(cj) + Math.sin(a) * rr, 0.06 + ph * 0.32, red ? 0 : (1 - ph) * 0.2); }
  if(feed && !red) for(let k = 0; k < 3; k++){ const ph = (t * 0.9 + k / 3) % 1; ripple(r++, X(DUCK_SPOT[0] + (k - 1) * 0.35), 0.03, Z(DUCK_SPOT[1] - 0.8 - k * 0.1), 0.05 + ph * 0.3, (1 - ph) * 0.28); }
  while(r < W.rN) ripple(r++, 0, 0, 0, 0, 0);
  W.rm.instanceMatrix.needsUpdate = true; if(W.rm.instanceColor) W.rm.instanceColor.needsUpdate = true;
  // 기구: 게임이 set 안 하면 그네만 살랑
  W.swings.forEach((m, k) => { if(tm - W.swT[k] > 400) m.rotation.x = red ? 0 : -Math.sin(t * 1.1 + k * 1.9) * 0.05; });
  if(W.cone) { W.cone.rotation.y = red ? 0 : t * (tm < W.jingle ? 3.2 : 0.6); W.cone.position.y = hz(69) + (red ? 0 : Math.abs(Math.sin(t * (tm < W.jingle ? 6 : 1.6))) * 0.04); }
  // 나비: 꽃밭 · 잔디 위 팔랑팔랑
  W.flies.forEach((m, k) => { const c = [[15.6, 5.3], [13.6, 5.0], [6.5, 17.4], [17.2, 6.0]][k], a = t * (0.5 + k * 0.08) + k * 2, i = c[0] + Math.cos(a) * (1.2 + k * 0.2), j = c[1] + Math.sin(a * 1.3) * 0.9;
    m.position.set(X(i), 0.75 + Math.sin(t * 2.4 + k) * 0.18, Z(j)); m.rotation.y = a + PI / 2 * (k % 2 ? 1 : -1); m.scale.set(red ? 1 : 0.25 + 0.75 * Math.abs(Math.sin(t * 14 + k)), 1, 1); m.visible = !dk; });
  // 비눗방울: 가게에서 늘 몇 개 · blow(i,j,h) 하면 와르르
  let b = 0; const [bi, bj] = BUB;
  for(let k = 0; k < 12; k++){ const ph = (t * 0.2 + k / 12) % 1, s = (0.035 + 0.05 * Math.min(1, ph * 5)) * (ph > 0.94 ? 0 : 1);
    bubble(b++, X(bi + 0.38 + Math.sin(k * 1.7 + t * 0.4) * 0.9 * ph + ph * 0.6), hz(42) + ph * 1.8 + Math.sin(t * 2 + k) * 0.06, Z(bj + 0.05 + Math.cos(k * 2.3) * 0.7 * ph + ph * 0.4), red ? 0 : s); }
  if(W.blow && tm - W.blow.t0 < 5200){ const B0 = W.blow; for(let k = 0; k < 26; k++){ const age = (tm - B0.t0) / 1000 - k * 0.11; if(age < 0 || age > 3.4){ bubble(b++, 0, 0, 0, 0); continue; } const u = age / 3.4, a = k * 2.39996;
    bubble(b++, X(B0.i + Math.cos(a) * (0.25 + u * 1.2) + Math.sin(B0.h) * u * 0.8), B0.y + u * 1.4 + Math.sin(age * 3 + k) * 0.05, Z(B0.j + Math.sin(a) * (0.25 + u * 1.2) + Math.cos(B0.h) * u * 0.8), (0.05 + 0.05 * Math.min(1, age * 3)) * (u > 0.95 ? 0 : 1)); } }
  while(b < W.bN) bubble(b++, 0, 0, 0, 0);
  W.bm.instanceMatrix.needsUpdate = true;
  // 반딧불 (밤): 연못 · 잔디 위를 떠돎
  W.ff.forEach((g, k) => { const c = k < 5 ? [24.6 + (k - 2) * 1.4, 5.3 + (k % 2) * 1.2] : [3 + (k - 5) * 2.2, 18.5], a = t * (0.3 + k * 0.05) + k; g.p.set(X(c[0] + Math.cos(a) * 0.9), 0.5 + Math.sin(t * 0.9 + k) * 0.25 + (k % 3) * 0.2, Z(c[1] + Math.sin(a * 1.4) * 0.7)); });
  // 빛 스프라이트 · 전구 줄
  const cam = K.R.camera;
  W.glows.forEach((g, k) => { const a = g.a(tm, dk); if(!(a > 0)){ W.gm.setMatrixAt(k, ZERO); return; }
    col.copy(g.c); m4.compose(g.p, cam.quaternion, sc3.set(g.s, g.s, 1)); W.gm.setMatrixAt(k, m4); W.gm.setColorAt(k, col.multiplyScalar(Math.min(1, a))); });
  W.gm.instanceMatrix.needsUpdate = true; if(W.gm.instanceColor) W.gm.instanceColor.needsUpdate = true;
  if(W.blm && W.dkLast !== dk){ W.dkLast = dk; W.bulbs.forEach((_, k) => W.blm.setColorAt(k, col.set(dk ? "#FFE9B8" : "#E6E1D8"))); W.blm.instanceColor.needsUpdate = true; }
}

/* ---------- 유나 모드에 넘길 것 ----------
   seats: yuna_game.js SEATS 형식 (a~b 선분 또는 a 한 점, h = 보는 쪽(0 = +j, PI/2 = +i, PI = −j), H = 앉는 면 높이, k = 대사 종류, f = 앞에서만)
   use: 물건 쓰는 자리 (at = 유나가 서는 곳, h = 보는 쪽). 시소 · 스프링 오리는 at이 앉는 자리 그 자체 (raw)
   기구 set 함수는 집 자전거(HOME.bike.set)처럼 바로 메시를 움직임. 0.4초 안 부르면 그네는 저절로 살랑 */
const RIM_SEATS = RIM.map(a => ({a:[+(PC[0] + 1.47 * Math.cos(a)).toFixed(2), +(PC[1] + 1.47 * Math.sin(a)).toFixed(2)], h:+Math.atan2(Math.cos(a), Math.sin(a)).toFixed(3), H:H(13.4), k:"rim", f:1}));
const SLIDE_PATH = [2.75, 3.3, 3.85, 4.4, 4.95, 5.25, 5.5].map(i => [i, 1.9, +H(SLIDE_Z(i) + 1).toFixed(3)]);
export const PARK = {
  name:"동네 공원·놀이터",
  gate:GATE, spawnGate:SPAWN,
  seats:[
    ...BENCH.map(b => benchSeat(b)),
    ...RIM_SEATS,
    ...SW.si.map(si => ({a:[si, SW.j], h:0, H:H(SW.zs), k:"swing"})),
    {a:[PIC[0] - 0.5, PIC[1] - 0.85], b:[PIC[0] + 0.5, PIC[1] - 0.85], h:0, H:H(12.2), k:"picnic"}, {a:[PIC[0] - 0.5, PIC[1] + 0.85], b:[PIC[0] + 0.5, PIC[1] + 0.85], h:PI, H:H(12.2), k:"picnic"},
    {a:[BLK[0] - 0.6, BLK[1]], h:PI / 2, H:H(3.6), k:"blanket"}, {a:[BLK[0] + 0.6, BLK[1]], h:-PI / 2, H:H(3.6), k:"blanket"},
    ...TABLES.flatMap(([ti, tj]) => [{a:[ti - 0.62, tj], h:PI / 2, H:H(11.4), k:"icecream"}, {a:[ti + 0.62, tj], h:-PI / 2, H:H(11.4), k:"icecream"}]),
    {a:[JG.i0 + JG.c * 1.5, JG.j0 + JG.nj * JG.c - 0.08], h:0, H:H(JG.lv * 2), k:"jungle"}],
  sitLines:{
    bench:["벤치에서 잠깐 쉬어 갈래 😌", "바람 솔솔~ 공원 최고 🍃", "아빠는 여기 앉아 있으면 맨날 졸던데 😆"],
    rim:["분수 물 튄다~ 앗 차가워 💦", "물소리 들으니까 시원해 ⛲", "동전이 반짝반짝 🪙"],
    swing:["발 쭉! 더 높이~ 🎶", "하늘 닿겠다 ☁️", "그네 타면 기분 최고야 😆"],
    picnic:["김밥 하나만 더 먹을래 🍙", "엄마 도시락 최고 💕", "소풍 온 것 같아 🧺"],
    blanket:["돗자리 위에서 뒹굴뒹굴 😆", "구름 모양 찾기 놀이 ☁️", "샌드위치 냠냠 🥪"],
    icecream:["딸기맛 진짜 맛있다 🍓", "녹기 전에 빨리 먹어야지 🍦", "한 입만~ 아빠 꺼 💕"],
    jungle:["여기 꼭대기야! 다 보인다 👀", "정글짐 정복! 🚩", "내려갈 땐 조심조심 😳"]},
  use:[
    {at:[2.1, 3.85], k:"slide", h:PI},
    {at:[SW.si[0], SW.j + 0.8], k:"swing", h:PI},
    {at:[SS.ci + SS.arm, SS.cj], k:"seesaw", h:-PI / 2, r:1.0, seat:+(SS.yp + 0.08).toFixed(3)},
    {at:[MG.ci, MG.cj + MG.r + 0.45], k:"merry", h:PI, r:1.1},
    {at:[2.95, 9.2], k:"sand", h:-2.78},
    {at:[PC[0], PC[1] + FB + 0.5], k:"fountain", h:PI},
    {at:[23.1, TR.j1 + 0.85], k:"icecream", h:PI},
    {at:DUCK_SPOT, k:"duck", h:PI},
    {at:[JG.i0 + JG.c * 1.5, JG.j0 + JG.nj * JG.c + 0.5], k:"jungle", h:PI},
    {at:[(HOP.i0 + HOP.i1) / 2, HOP.j1 + 0.4], k:"hop", h:PI},
    {at:SPR, k:"spring", h:0, r:0.9, seat:+H(18.4).toFixed(3)},
    {at:[BUB[0], BUB[1] + 0.95], k:"bubble", h:PI},
    {at:[DOG[0] - 0.8, DOG[1]], k:"dog", h:PI / 2},
    {at:[13.65, 7.8], k:"flower", h:PI},
    {at:[BR.c, +((BRJ[0] + BRJ[1]) / 2).toFixed(2)], k:"bridge", h:PI / 2},
    {at:[BLK[0], BLK[1] - 1.05], k:"picnic", h:0}],
  /* 미끄럼틀: bottom(사다리 앞) → climb(사다리 칸) → top(발판, face 쪽을 봄) → path(미끄럼판 위 [i,j,높이]) → end(내려선 곳) */
  slide:{bottom:[2.1, 3.85, PI], climb:[[2.1, 3.39, 0.275], [2.1, 3.17, 0.473], [2.1, 2.95, 0.671], [2.1, 2.73, 0.869], [2.1, 2.51, 1.068]], top:[2.1, 1.9, +H(SL.z).toFixed(3)], face:PI / 2, path:SLIDE_PATH, end:[5.95, 1.9, PI / 2]},
  /* 뺑뺑이: set(a) = 엔진 path 각도 a (i = c + r cos a, j = c + r sin a) 와 같은 각도로 돌림. 유나 방석은 rideAt(a) */
  spin:{center:[MG.ci, MG.cj], r:MG.r, ride:MG.ride, seat:+H(7.8).toFixed(3),
    set(a){ if(!W || !W.merry) return; W.merry.rotation.y = -a; W.spinA = a; },
    rideAt(a, r = MG.ride){ return [MG.ci + r * Math.cos(a), MG.cj + r * Math.sin(a), H(7.8), Math.atan2(-Math.sin(a), Math.cos(a))]; }},
  /* 시소: tilt > 0 = 유나 쪽(+i 끝)이 올라감. 쓸 만한 범위 ±0.24 (그 밖은 끝이 바닥에 닿음). seatAt(tilt, side=1) → [i, j, 앉는 면 높이] */
  seesaw:{pivot:[SS.ci, SS.cj, SS.yp], arm:SS.arm, range:0.24, seat:[SS.ci + SS.arm, SS.cj, +(SS.yp + 0.08).toFixed(3)], friend:[SS.ci - SS.arm, SS.cj, +(SS.yp + 0.08).toFixed(3)],
    set(t){ if(!W || !W.saw) return; W.saw.rotation.z = Math.max(-0.26, Math.min(0.26, t)); },
    seatAt(t, side = 1){ return [SS.ci + side * SS.arm * Math.cos(t), SS.cj, SS.yp + side * SS.arm * Math.sin(t) + 0.08 * Math.cos(t)]; }},
  /* 그네: 윗대 축 pivot에서 줄 len. set(angle, k=0): angle > 0 = 앞(+j)으로. seatAt(angle, k) → [i, j, 앉는 면 높이]
     엔진의 앉아서 흔들기(PL.sit.swing, fw = 0.42·sin)는 유나를 0.55·fw 만큼 옮기니, 판을 맞추려면 set(Math.asin(0.55 * fw / len)) = fromSit(fw) */
  swing:{seat:[SW.si[0], SW.j, +H(SW.zs).toFixed(3)], seats:SW.si.map(si => [si, SW.j, +H(SW.zs).toFixed(3)]), pivot:[SW.si[0], SW.j, +H(SW.zp).toFixed(3)], len:+SW_L.toFixed(3),
    set(a, k = 0){ if(!W || !W.swings) return; const m = W.swings[k]; if(!m) return; m.rotation.x = -a; W.swT[k] = K.clock(); },
    fromSit(fw, k = 0){ PARK.swing.set(Math.asin(Math.max(-1, Math.min(1, 0.55 * fw / SW_L))), k); },
    seatAt(a, k = 0){ return [SW.si[k], SW.j + SW_L * Math.sin(a), H(SW.zp) - SW_L * Math.cos(a)]; }},
  /* 분수: boost(ms) = 물줄기 높이 솟음 (동전 던지기) · 오리: feed(ms) = 밥 주는 곳으로 모임 (유나가 1.4칸 안에 오면 저절로도) · 비눗방울: blow(i, j, h) */
  fountain:{center:PC, r:FB, boost(ms = 5000){ if(W) W.boost = K.clock() + ms; }},
  duck:{spot:DUCK_SPOT, feed(ms = 8000){ if(W) W.feed = K.clock() + ms; }},
  bubble:{stand:BUB, blow(i, j, h = 0){ if(W) W.blow = {i, j, h, y:0.85, t0:K.clock()}; }},
  truck:{jingle(ms = 4000){ if(W) W.jingle = K.clock() + ms; }},
  /* 동네 사람 서는 곳 (yuna_game.js areaNpcs가 AREA_MOD.park.npc를 먼저 씀): 아이스크림 아저씨는 차양 밑 창 옆에 서서 손님 자리를 봄 · 동네 아이(kid)는 시소 반대쪽 옆 */
  npc:{ice:[24.5, 16.35, -1.36], kid:[SS.ci - SS.arm - 0.1, SS.cj + 0.6, PI / 2]},
  spots:{ice:[24.5, 16.35, -1.36], kid:[SS.ci - SS.arm - 0.1, SS.cj + 0.6, PI / 2], kidSeesaw:[SS.ci - SS.arm, SS.cj, PI / 2]},
};

/* ---------- 층 정의 ---------- */
const ZONES = {
  p_play:{name:"무지개 놀이터", color:"#E8B5C8", rect:[MAT[0], MAT[1], MAT[2], MAT[3]], label:[6.0, 0, "top"]},
  p_garden:{name:"꽃밭·화장실", color:"#E8A04A", rect:[12.5, 0, 18.6, 7.6], label:[15.5, 0, "top"]},
  p_pond:{name:"연못·구름다리", color:"#72C4AE", rect:[19.6, 0, 30.4, 10.4], label:[25.0, 0, "top"]},
  p_plaza:{name:"분수 광장", color:"#A9CBEA", rect:[PC[0] - PR, PC[1] - PR, PC[0] + PR, PC[1] + PR], label:[PC[0] + PR, PC[1], "side"]},
  p_lawn:{name:"피크닉 잔디밭", color:"#4DAA97", rect:[0, 13.2, 12.4, FJ1], label:[6.2, FJ1, "bottom"]},
  p_ice:{name:"아이스크림 트럭", color:"#C8B4D0", rect:[19.8, 13.2, 30.4, FJ1], label:[25.0, FJ1, "bottom"]}};
const def = {
  id:"park",
  zones:ZONES,
  outline:[[EXT[0], EXT[1]], [EXT[2], EXT[1]], [EXT[2], EXT[3]], [EXT[0], EXT[3]]],
  ext:EXT,
  top:3.4,
  allPts:V => [V(EXT[0], 0, EXT[1]), V(EXT[2], 0, EXT[1]), V(EXT[2], 0, EXT[3]), V(EXT[0], 0, EXT[3]), V(-0.5, 2.6, -0.5), V(30.5, 2.4, -0.5), V(-0.5, 2.4, 21.7), V(15, 3.3, 21.7)],
  lamps:[[11.75, 10.5, 2.35], [18.25, 10.5, 2.35], [11.9, 15.7, 2.35], [18.1, 15.7, 2.35], [5.4, 13.35, 2.35], [23.1, 16.4, 1.9]],
  glow:{color:0xBFE6FF, at:[PC[0], PC[1], 1.2]},
  eggs:[],
  people:[],
  paintFloor(c, dark){ paintPark(c, dark); },
  build(KIT){
    K = KIT; LG.length = 0;
    W = {recolor:[], glows:[], extraBoxes:[], waters:[], tex:[], swT:[-1e9, -1e9], bk:0, boost:0, feed:0, jingle:0, blow:null, dkLast:null};
    const egg = (id, at, emo, lines, say) => ({id, at, emo, lines, say});
    def.eggs = [
      egg("p_fountain", [PC[0], PC[1], 64], ["⛲", "🪙", "✨"], ["동전 퐁당! 소원 빌었다 🪙", "분수 물줄기 쑥쑥~ ⛲", "무지개 보인다 🌈"], (k, g, line) => { W.boost = K.clock() + 5000; return line; }),
      egg("p_duck", [25.5, 5.0, 14], ["🦆", "🐥"], ["꽥꽥! 아기 오리 두 마리 따라간다 🐥", "오리 가족 산책 중 🦆"], (k, g, line) => { W.feed = K.clock() + 8000; return line; }),
      egg("p_truck", [23.6, 14.65, 106], ["🍦", "🎶"], ["딩동댕~ 아이스크림 트럭 왔어요 🎶", "오늘의 맛은 딸기 🍓"], (k, g, line) => { W.jingle = K.clock() + 4000; return line; }),
      egg("p_dog", [DOG[0] + 0.1, DOG[1], 32], ["🐶", "💕"], ["멍멍이 동상 코가 반질반질 🐶", "다들 쓰다듬어서 반짝반짝 ✨"]),
      egg("p_bubble", [BUB[0], BUB[1], 50], ["🫧", "🌈"], ["비눗방울 후~ 🫧", "제일 큰 비눗방울 만들기 도전!"], (k, g, line) => { W.blow = {i:BUB[0] + 0.3, j:BUB[1] + 0.3, h:0, y:1.3, t0:K.clock()}; return line; }),
      egg("p_flower", [16.0, 5.3, 24], ["🌷", "🦋"], ["나비가 꽃에 앉았다 🦋", "해바라기가 유나보다 커 🌻"]),
      egg("p_slide", [2.1, 1.9, 92], ["🛝", "🚩"], ["미끄럼틀 꼭대기 깃발 🚩", "여기서 보면 공원이 다 보여 👀"]),
      egg("p_wc", [15.5, 2.3, 50], ["🚻", "✨"], ["화장실 깨끗해요 ✨ 손 씻기 필수!"]),
      egg("p_squirrel", [19.2, 0.6, 70], ["🐿️", "🌰"], ["다람쥐가 도토리 숨겼다 🌰"]),
      egg("p_frog", [27.4, 6.7, 8], ["🐸", "💚"], ["연잎 위에 개구리 개굴개굴 🐸"]),
      egg("p_sand", [2.55, 8.45, 30], ["🏰", "🐚"], ["누가 모래성 만들어 놨다 🏰", "조개껍데기 찾았다 🐚"])];
    // 바깥 · 길가
    fences(); gateArch();
    // 큰 나무는 먼 쪽(뒤 j≈0 · 왼쪽 i≈0)에만. 앞 · 오른쪽 가장자리는 카메라를 가리니 낮은 덤불로
    [[0.1, 3.8, 1.1, 0], [0.0, 9.6, 1.0, 1], [5.2, -0.1, 1.0, 0], [11.7, 0.2, 1.15, 1], [19.2, 0.6, 1.2, 0], [29.9, 0.3, 1.1, 2], [0.2, 14.4, 1.1, 2], [0.3, 19.2, 0.95, 1]].forEach(([i, j, s, kd]) => tree(i, j, s, kd));
    [[12.3, 2.3, "#F4A7B9"], [19.4, 2.6, "#C8B4D0"], [19.6, 12.9, "#F6E39A"], [29.4, 12.9, "#F4A7B9"], [0.6, 12.9, "#FFFFFF"], [11.3, 12.9, "#F9C99B"], [12.0, 19.0, "#C8B4D0"], [20.4, 20.4, "#F4A7B9"], [28.8, 19.4, "#F6E39A"], [2.6, 20.6, "#F4A7B9"], [6.6, 20.8, null], [26.0, 20.8, null],
      [29.8, 9.6, "#F4A7B9"], [29.8, 15.4, "#C8B4D0"], [29.6, 20.6, null], [11.9, 20.7, "#F6E39A"], [18.6, 20.9, "#F4A7B9"], [1.4, 20.8, null]].forEach(([i, j, f]) => bush(i, j, 0.9, f));
    // 잔디 꽃무더기 · 버섯 (피크닉 잔디밭이 심심하지 않게)
    [[2.2, 14.6], [7.2, 14.4], [3.1, 18.9], [10.2, 19.6], [6.0, 20.1], [19.3, 17.0]].forEach(([i, j], n) => { for(let k = 0; k < 6; k++){ const a = k * 1.05 + n; flowerStem(i + Math.cos(a) * 0.2 * (k % 2 ? 1 : 0.5), j + Math.sin(a) * 0.2 * (k % 2 ? 1 : 0.5), RB[(k + n) % 6], 8 + (k % 3) * 2); } });
    [[1.6, 17.6], [9.6, 13.9]].forEach(([i, j], n) => { K.sm(K.cyl(0.035, 0.045, hz(6), 8), WHITE, X(i), hz(3), Z(j), null, "m"); K.sm(myGeo(new THREE.SphereGeometry(0.1, 12, 6, 0, PI * 2, 0, PI / 2)), n ? AMBER : PINK, X(i), hz(5.5), Z(j), null, "m");
      [[0.04, 0.03], [-0.05, 0.02], [0, -0.05]].forEach(([di, dj]) => ball(i + di, j + dj, 5.5 + 2.6, 0.018, WHITE, "m", 6)); });
    LAMPS.forEach(([i, j]) => lamp(i, j));
    BENCH.forEach(([i, j, h], k) => bench(i, j, h, [PINK, LILAC, MINT, AMBER2][k % 4]));
    // 놀이터
    slide(); swingFrame(); jungleGym(); merryBase(); seesawBase(); sandbox(); springRider(); playgroundSigns();
    // 가운데 · 뒤
    fountain(); flowerBeds(); restroom();
    // 연못
    pondStatic(); bridge();
    // 앞 (잔디 · 트럭)
    truck(); tables(); picnic(); blanket(); bubbleStand(); dogStatue();
    { const ti = 11.95, tj = 16.4; K.sm(K.cyl(0.17, 0.15, hz(20), 16), SPROUT, X(ti), hz(10), Z(tj), null, "s"); disc(ti, tj, 0.19, 20, 1.6, WHITE, "s", 16); }   // 쓰레기통
    buildDyn();
  },
  init(KIT){ LG.forEach(g => g.dispose()); LG.length = 0; },
  tick(KIT, now, t, dt){
    if(W.extraBoxes.length && KIT.R && KIT.R.boxes && !W.boxDone){ W.boxDone = true;   // 기구 · 연못 막기 상자를 엔진 목록에 더함
      KIT.R.boxes = Float32Array.from([...KIT.R.boxes, ...W.extraBoxes.flat()]); KIT.R.pg = null; }
    animate(KIT.clock ? KIT.clock() : now, dt); },
  theme(KIT, dark){ if(!W) return;
    W.recolor.forEach(m => { const u = m.geometry.userData, a = m.geometry.attributes.color; if(u && u.L && a){ a.array.set(dark ? u.D : u.L); a.needsUpdate = true; } });
    W.waters.forEach(w => w.m.color.set(WATER[w.k][dark ? 1 : 0])); },
};
export default def;
