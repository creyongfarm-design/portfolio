/* 5F 옥상 3D (2026-11-22 감독님 "다른 층도 다 해야지") — tower3d_floor.js 층 정의
   - 2.5D 옥상(크레용사무실.html drawRoof) 그대로: 칸 좌표·크기·색·소품. 새 물건 없음
   - 사람·공·대화·커플·회식 건배는 타워의 2D 시뮬레이션을 그대로 따라감 (opts.sim → window.F3_SIM.roof)
   - 하늘·노을·밤은 화면 테마와 상관없이 roofPhase 그대로, 빛(해·달·조명·모닥불)으로 표현 */
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

let K = null, T = null, S = null;
const GJ = 20, GI = 29, WI = 36, CH = 14.5;
const X = i => i - 18, Z = j => j - 10, hz = px => px / 31.1;
const rHash = (a, b, c) => { const s = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453; return s - Math.floor(s); };
const PL = "#5FA582";                                   // 옥상은 C.plant 낮 색 고정

/* ---------- 2.5D 옥상 데이터 (그대로) ---------- */
const SKY = {
  day:    {top:"#8FCBEA", bot:"#EAF5F8", hill:["#B7CDD6","#9FB8C4"], tint:null, glow:0.28, nb:["#E4DCCF","#D6CCBE","#C9BCAC","#E9E2D8","#CFC3B5"], win:"#A9C3D3", lit:0},
  sunset: {top:"#5E5C9E", mid:"#EE8F78", bot:"#FFD49A", hill:["#8C7C9E","#76688E"], tint:"rgba(255,120,70,.10)", glow:0.65, nb:["#C9A99A","#B9998D","#A88A82","#D2B3A2","#B39488"], win:"#6E5E70", lit:0.14},
  night:  {top:"#0B1130", bot:"#2A3466", hill:["#1B2244","#151B38"], tint:"rgba(10,16,50,.40)", glow:1, nb:["#3A4060","#343A58","#2E3450","#40466A","#383E5E"], win:"#232845", lit:0.4},
};
const TINT = {day:null, sunset:[255,120,70,0.10], night:[10,16,50,0.40]};
const NB = [
  [2,-12.2,5,4,-40],[15,-11.5,6,5,-20],[27,-11,5,4,-48],[-11,3,4,5,-34],[-11.5,12,5,5,-56],
  [0.4,-5.6,5.6,4.2,-26],[7,-6.2,5,4.6,-6],[13.2,-5.4,5.4,4,-38],[19.6,-5.6,4.8,4.4,8],[25.6,-4.6,4.4,3.4,-30],[31.2,-5.2,4.6,4,-44],
  [-4.6,0.5,3.6,5.6,-24],[-5.4,7,4.4,5,-50],[-4.4,13.4,3.4,5.8,-6],
];
const ROOF_GRASS = [[0.3,9.45,13.9,12.4],[15.3,0.3,27.0,2.45],[27.0,0.3,35.7,14.2],[15.3,13.6,28.7,19.7],[5.4,13.6,10.3,15.4]];
const ROOF_PATHS = [[14.0,0.3,15.2,17.7],[0.3,12.45,28.7,13.55],[27.0,3.0,28.2,13.55],[28.2,3.0,32.0,3.8],[28.2,9.4,33.0,10.2]];
const STREAM = [[29.3,1.0],[28.9,3.2],[29.4,5.0],[28.9,7.0],[29.3,9.0],[28.8,11.0],[28.5,12.6],[28.1,13.8],[27.1,15.3]];
const STREAM_STONES = [[28.65,3.4],[29.25,3.45],[28.8,9.8],[29.4,9.85]];
const POND = {ci:26.6, cj:15.3, ri:1.4, rj:0.95};   // 인피니티 풀 들이면서 작게 옮김 (2026-11-22)
const POOL = {i0:20.4, j0:17.5, wi:20.6, wj:17.7, z:12};
const SUNBEDS = [[22.15,"#3A8A78"],[23.25,"#E8A04A"],[24.35,"#F4A7B9"]], PARASOLS = [[22.7,16.05,"#3A8A78"],[24.95,16.1,"#E8A04A"]];
const POOL_LIGHTS = [21.6, 23.4, 25.2, 27.0, 28.5], SPLASH = [24.8, 18.9];
const BQ = {i0:15.8, j0:15.2, i1:19.8, j1:18.4};
const HT = {i0:22.6, j0:3.05, i1:26.2, j1:3.95};
const MATR = {i0:33.05, j0:7.25, i1:35.0, j1:8.5};
const FS = {i0:1.2, i1:12.8, j0:1.0, j1:8.6, gj:4.8, gw:0.9}, FSF = {i0:0.55, i1:13.45, j0:0.5, j1:9.15, d0:6.6, d1:7.8};
const FS_POLES = [[0.7,0.65],[13.3,0.65],[0.7,9.0],[13.3,9.0]];
const ROOF_LAMPS = [[15.6,5.0],[15.6,11.8],[26.6,12.0],[30.1,4.4],[30.0,11.6],[13.6,15.2],[19.6,14.2],[23.6,14.1],[9.8,12.1]];
const TREES = [[13.0,11.3,0.9],[30.5,6.4,1.0],[34.7,13.2,0.95],[15.9,14.2,0.85],[0.9,13.9,0.8],[9.4,14.8,0.85],[33.7,5.8,0.8]];
const FLY = [[24.5,16.2],[6.5,10.4],[31.5,6.5],[29.6,8.2],[18.0,1.4],[33.0,12.5],[11.5,13.8],[26.4,17.6]];
const CHAIRS = [[21.5,5.15,"-j","#E8A04A"],[23.25,6.85,"+i","#3A8A78"],[21.5,8.55,"+j","#C8B4D0"],[19.75,6.85,"-i","#8B5A3C"]];
const POSTS = [[16.3,2.8],[26.7,2.8],[26.7,10.7],[16.3,10.7]];
const FIRE = [21.5, 6.85], GRILL = [20.9, 15.0], TABLE_BQ = [17.85, 16.85];
const BULB_C = ["#FFE6A8","#FFD27A","#FFF3D6"], FLOWER = ["#F4A7B9","#FFE066","#FF8C69","#C8B4D0","#FFFFFF","#E8607F"];
const DECK = [16, 2.5, 27, 11];
const pondPt = (a, s = 1) => [POND.ci + Math.cos(a) * POND.ri * s * (1 + 0.07 * Math.sin(3 * a)), POND.cj + Math.sin(a) * POND.rj * s * (1 + 0.06 * Math.cos(2 * a + 1))];
const inR = (i, j, a, b, c, d) => i >= a && i <= c && j >= b && j <= d;

/* 시간대 빛 (2.5D SKY.glow·tint 느낌을 실제 빛으로) */
const LIGHT = {
  day:    {hemi:[0xFFF6F0, 0xC9B7C4, 0.5], sun:[0xFFF1E2, 1.45, [9, 24, 15]], exp:0.84, lamp:0, fs:0, fire:0.45, glow:1.0, env:0.6, net:1},
  sunset: {hemi:[0xFFC8B4, 0x6A4E6A, 0.55], sun:[0xFF9A5C, 1.25, [-18, 10, 12]], exp:0.92, lamp:3.2, fs:2.6, fire:4.5, glow:1.12, env:0.42, net:0.8},
  night:  {hemi:[0x7C8CC8, 0x2A2A3A, 0.42], sun:[0x9FB4FF, 0.34, [14, 22, -10]], exp:1.0, lamp:6.0, fs:5.0, fire:8.0, glow:1.3, env:0.28, net:0.5},
};

/* ---------- 바닥 그림 (위에서 본 2.5D roofFloor · futsalFloor) ---------- */
function streamCurve(){
  const out = [STREAM[0]]; let prev = STREAM[0];
  for(let k = 1; k < STREAM.length - 1; k++){ const c = STREAM[k], m = [(c[0] + STREAM[k + 1][0]) / 2, (c[1] + STREAM[k + 1][1]) / 2];
    for(let s = 1; s <= 8; s++){ const u = s / 8, a = (1 - u) * (1 - u), b = 2 * (1 - u) * u, d = u * u; out.push([a * prev[0] + b * c[0] + d * m[0], a * prev[1] + b * c[1] + d * m[1]]); }
    prev = m; }
  out.push(STREAM[STREAM.length - 1]); return out;
}
function paintRoof(c){
  const rect = (a, b, cc, d, col) => { c.fillStyle = col; c.fillRect(a, b, cc - a, d - b); };
  const line = (a, b, cc, d, col, w) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(a, b); c.lineTo(cc, d); c.stroke(); };
  const urt = "#5F9E80";
  c.fillStyle = urt; c.beginPath(); [[0,0],[WI,0],[WI,CH],[GI,CH],[GI,GJ],[0,GJ]].forEach(([i, j], k) => k ? c.lineTo(i, j) : c.moveTo(i, j)); c.closePath(); c.fill();
  c.globalAlpha = 0.5; for(let i = 4; i < WI; i += 4) line(i, 0, i, i > GI ? CH : GJ, K.shade(urt, -0.12), 0.035);
  [4, 8, 12, 16].forEach(j => line(0, j, j > CH ? GI : WI, j, K.shade(urt, -0.12), 0.035)); c.globalAlpha = 1;
  c.fillStyle = "rgba(0,0,0,.35)"; [[0.5,0.5],[35.5,0.5],[0.5,19.5]].forEach(([i, j]) => { c.beginPath(); c.arc(i, j, 0.12, 0, 7); c.fill(); });
  // 잔디
  const grass = "#8DBE72"; ROOF_GRASS.forEach(([a, b, cc, d]) => rect(a, b, cc, d, grass));
  ROOF_GRASS.forEach(([a, b, cc, d]) => { const g = c.createLinearGradient(0, b, 0, d); g.addColorStop(0, "rgba(255,255,255,.05)"); g.addColorStop(1, "rgba(40,70,30,.06)"); c.fillStyle = g; c.fillRect(a, b, cc - a, d - b); });
  // 냇가 (둑 · 물 · 가운데)
  const sp = streamCurve(); c.lineCap = "round"; c.lineJoin = "round";
  [["#BDB3A2", 1.0], ["#4E95B8", 0.68], ["#7CC0DC", 0.32]].forEach(([col, w]) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); sp.forEach(([i, j], k) => k ? c.lineTo(i, j) : c.moveTo(i, j)); c.stroke(); });
  c.lineCap = "butt";
  // 나무 길 + 판자 줄눈
  const bw = "#DDB98A"; ROOF_PATHS.forEach(([a, b, cc, d]) => { rect(a, b, cc, d, bw); c.globalAlpha = 0.4;
    if(cc - a > d - b) for(let i = a + 0.35; i < cc - 0.05; i += 0.35) line(i, b, i, d, K.shade(bw, -0.25), 0.024);
    else for(let j = b + 0.35; j < d - 0.05; j += 0.35) line(a, j, cc, j, K.shade(bw, -0.25), 0.024);
    c.globalAlpha = 1; });
  // 연못
  [[1.12, "#A99E8C"], [1.0, "#3F86A8"], [0.78, "#5498BA"], [0.5, "#66AACA"]].forEach(([s, col]) => { c.fillStyle = col; c.beginPath();
    for(let k = 0; k <= 44; k++){ const [i, j] = pondPt(k / 44 * Math.PI * 2, s); k ? c.lineTo(i, j) : c.moveTo(i, j); } c.closePath(); c.fill(); });
  // 징검돌 자리 (3D 돌 아래)
  c.fillStyle = "#C9C2B6"; [[16.8,14.0],[18.6,14.0],[24.6,14.0],...STREAM_STONES].forEach(([i, j]) => { c.beginPath(); c.arc(i, j, 0.24, 0, 7); c.fill(); });
  // 인피니티 풀 · 선베드 데크 자리 (풀잎 안 나게)
  rect(POOL.i0, POOL.j0, GI, GJ, "#4FB2D4"); rect(21.5, 15.7, 24.95, 17.5, "#C99A66");
  // 풋살장
  const tf = "#4FA866"; rect(FSF.i0, FSF.j0, FSF.i1, FSF.j1, "#3E8A54"); rect(FS.i0 - 0.3, FS.j0 - 0.3, FS.i1 + 0.3, FS.j1 + 0.3, tf);
  for(let k = 1; k < 8; k += 2){ const a = FS.i0 + k * 1.45; rect(a, FS.j0, a + 1.45, FS.j1, K.shade(tf, 0.07)); }
  const wl = "rgba(255,255,255,.9)", mi = (FS.i0 + FS.i1) / 2; c.strokeStyle = wl; c.lineWidth = 0.052;
  c.strokeRect(FS.i0, FS.j0, FS.i1 - FS.i0, FS.j1 - FS.j0); line(mi, FS.j0, mi, FS.j1, wl, 0.052);
  c.beginPath(); c.arc(mi, FS.gj, 1.3, 0, 7); c.stroke();
  c.beginPath(); c.arc(FS.i0, FS.gj, 2.2, -Math.PI / 2, Math.PI / 2); c.stroke();
  c.beginPath(); c.arc(FS.i1, FS.gj, 2.2, Math.PI / 2, Math.PI * 1.5); c.stroke();
  c.fillStyle = wl; c.beginPath(); c.arc(mi, FS.gj, 0.06, 0, 7); c.fill();
  // 돗자리
  rect(MATR.i0, MATR.j0, MATR.i1, MATR.j1, "#F4F1EA");
  c.fillStyle = "rgba(216,64,42,.55)"; for(let k = 0; k < 5; k++) c.fillRect(33.10 + k * 0.4, MATR.j0, 0.18, MATR.j1 - MATR.j0);
  c.fillStyle = "rgba(216,64,42,.4)"; for(let k = 0; k < 3; k++) c.fillRect(MATR.i0, 7.35 + k * 0.45, MATR.i1 - MATR.i0, 0.18);
}

/* ---------- 공용 도형 ---------- */
let UB, UC, US, UH, O3, ZM, UP;
function shared(){
  UB = new T.BoxGeometry(1, 1, 1); UC = new T.CylinderGeometry(0.5, 0.5, 1, 12); US = new T.SphereGeometry(0.5, 14, 10);
  UH = new T.SphereGeometry(0.5, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  O3 = new T.Object3D(); ZM = new T.Matrix4().makeScale(0, 0, 0); UP = new T.Vector3(0, 1, 0);
}
function inst(geo, mat, n, shadow){
  const im = new T.InstancedMesh(geo, mat, n); im.frustumCulled = false; im.instanceMatrix.setUsage(T.DynamicDrawUsage);
  im.castShadow = !!shadow; im.receiveShadow = !mat.isMeshBasicMaterial; const w = new T.Color(1, 1, 1);
  for(let k = 0; k < n; k++){ im.setMatrixAt(k, ZM); im.setColorAt(k, w); } K.R.scene.add(im); return im;
}
const setI = (im, k, x, y, z, rx, ry, rz, sx, sy, sz, order) => { O3.position.set(x, y, z); O3.rotation.set(rx, ry, rz, order || "XYZ"); O3.scale.set(sx, sy, sz); O3.updateMatrix(); im.setMatrixAt(k, O3.matrix); };

/* ---------- 정적 소품 (구워서 4덩어리로) ---------- */
function buildStatic(){
  const sm = (g, col, x, y, z, cls = "m", parent) => K.sm(g, col, x, y, z, parent, cls);
  const B = (i, j, w, d, h, col, z0 = 0, o = {}) => K.B(i, j, w, d, h, col, z0, o);
  const box = (x, y, z, w, h, d, col, cls = "m", r = 0.02, parent) => sm(K.rbox(w, h, d, r), col, x, y, z, cls, parent);
  const cyl = (i, j, r, hpx, col, z0 = 0, cls = "m", seg = 14, rb) => sm(K.cyl(r, rb ?? r, hz(hpx), seg), col, X(i), hz(z0) + hz(hpx) / 2, Z(j), cls);
  const ball = (i, j, zpx, r, col, cls = "m", sy = 1, seg = 12) => { const o = sm(K.sph(r, seg, Math.max(6, seg * 0.7 | 0)), col, X(i), hz(zpx), Z(j), cls); o.scale.y = sy; return o; };
  const P3 = (i, j, zpx) => new T.Vector3(X(i), hz(zpx), Z(j));
  const rod = (a, b, r, col, cls = "s", seg = 6) => { const d = b.clone().sub(a), len = d.length(); if(len < 1e-4) return null;
    const o = sm(K.cyl(r, r, len, seg), col, (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2, cls); o.quaternion.setFromUnitVectors(UP, d.normalize()); return o; };
  const sh = K.shade;

  /* 뒤 난간벽 (콘크리트) */
  const conc = "#D9D3C8";
  B(0, 0, WI, 0.28, 16, conc, 0, {r:0.03}); B(0, 0, 0.28, GJ, 16, conc, 0, {r:0.03});
  B(-0.04, -0.04, WI + 0.04, 0.36, 1.2, sh(conc, 0.12), 15.4, {r:0.02}); B(-0.04, -0.04, 0.36, GJ + 0.04, 1.2, sh(conc, 0.12), 15.4, {r:0.02});
  /* 앞 쇠 난간 */
  const metal = "#B8BEC4";
  [[0, GJ, POOL.i0, GJ], [GI, CH, GI, POOL.j0], [GI, CH, WI, CH], [WI, 0, WI, CH]].forEach(([a0, b0, a1, b1]) => {   // 풀 앞은 유리벽
    const L = Math.hypot(a1 - a0, b1 - b0), n = Math.max(1, Math.round(L));
    for(let k = 0; k <= n; k++){ const i = a0 + (a1 - a0) * k / n, j = b0 + (b1 - b0) * k / n; cyl(i, j, 0.022, 22, metal, 0, "s", 6); }
    rod(P3(a0, b0, 22), P3(a1, b1, 22), 0.024, metal, "s", 8); rod(P3(a0, b0, 11), P3(a1, b1, 11), 0.014, metal, "s", 6); });
  /* 건물 벽 (옥상이 떠 보이지 않게) · 층 띠 */
  const fac = "#EFE8DC", facS = sh(fac, -0.16), FH = hz(300), yc = -FH / 2;
  box(X(GI / 2), yc, Z(GJ) - 0.05, GI, FH, 0.1, fac, "m", 0); box(X(GI) - 0.05, yc, Z((CH + GJ) / 2), 0.1, FH, GJ - CH, facS, "m", 0);
  box(X((GI + WI) / 2), yc, Z(CH) - 0.05, WI - GI, FH, 0.1, fac, "m", 0); box(X(WI) - 0.05, yc, Z(CH / 2), 0.1, FH, CH, facS, "m", 0);
  box(X(WI / 2), yc, Z(0) + 0.05, WI, FH, 0.1, facS, "m", 0); box(X(0) + 0.05, yc, Z(GJ / 2), 0.1, FH, GJ, fac, "m", 0);
  [-2, -44, -88, -132].forEach(z => { const y = hz(z - 2), t = hz(4);
    box(X(GI / 2), y, Z(GJ) + 0.012, GI + 0.02, t, 0.03, sh(fac, -0.07), "m", 0); box(X(GI) + 0.012, y, Z((CH + GJ) / 2), 0.03, t, GJ - CH, sh(facS, -0.07), "m", 0);
    box(X((GI + WI) / 2), y, Z(CH) + 0.012, WI - GI + 0.02, t, 0.03, sh(fac, -0.07), "m", 0); box(X(WI) + 0.012, y, Z(CH / 2), 0.03, t, CH + 0.02, sh(facS, -0.07), "m", 0); });

  /* ── 풋살장 ── */
  const post = "#2E3A33";
  const fence = (a0, b0, a1, b1) => { const L = Math.hypot(a1 - a0, b1 - b0), n = Math.max(1, Math.round(L / 0.9));
    for(let k = 0; k <= n; k++) cyl(a0 + (a1 - a0) * k / n, b0 + (b1 - b0) * k / n, 0.022, 58, post, 0, "s", 6);
    rod(P3(a0, b0, 58), P3(a1, b1, 58), 0.02, post, "s", 6); rod(P3(a0, b0, 1), P3(a1, b1, 1), 0.014, post, "s", 5); };
  fence(FSF.i0, FSF.j0, FSF.i1, FSF.j0); fence(FSF.i0, FSF.j0, FSF.i0, FSF.j1); fence(FSF.i0, FSF.j1, FSF.i1, FSF.j1);
  fence(FSF.i1, FSF.j0, FSF.i1, FSF.d0); fence(FSF.i1, FSF.d1, FSF.i1, FSF.j1);
  [FSF.d0, FSF.d1].forEach(j => B(FSF.i1 - 0.05, j - 0.05, 0.1, 0.1, 66, post, 0, {cls:"s"}));
  box(X(FSF.i1) + 0.02, hz(65), Z((FSF.d0 + FSF.d1) / 2), 0.03, hz(10), FSF.d1 - FSF.d0 + 0.2, "#3A8A78", "m", 0.01);
  K.wtext("FUTSAL ⚽", FSF.i1 + 0.012, (FSF.d0 + FSF.d1) / 2, 64.6, "j", 2.6, "#FFFFFF", null, 800);
  // 현수막 (뒤 펜스 안쪽)
  box(X(7.0), hz(45.5), Z(0.53), 6.8, hz(23), 0.025, "#2E6E60", "m", 0.01);
  K.wtext("CREYONG FC", 7.0, 0.53, 47, "i", 10, "#FFFFFF", null, 800);
  K.wtext("화요일 밤 8시 풋살 ⚽", 7.0, 0.53, 38.5, "i", 4.4, "#FFE9A8", null, 700, K.FONT);
  // 조명탑
  FS_POLES.forEach(([i, j]) => { B(i - 0.06, j - 0.06, 0.12, 0.12, 82, "#3A3F44", 0, {cls:"s"}); B(i - 0.3, j - 0.12, 0.6, 0.24, 5, "#2A2E32", 82, {cls:"s"});
    box(X(i), hz(81.8), Z(j), 0.52, 0.015, 0.16, "#FFF6D8", "glow", 0); });
  // 골대 (흰 파이프)
  [[FS.i0, -0.45], [FS.i1, 0.45]].forEach(([gi, d]) => { const H = 16, a = FS.gj - FS.gw, b = FS.gj + FS.gw, W = "#FFFFFF";
    [a, b].forEach(j => { rod(P3(gi, j, 0), P3(gi, j, H), 0.03, W, "s", 8); rod(P3(gi, j, H), P3(gi + d, j, 12.8), 0.016, W, "s", 6); rod(P3(gi + d, j, 0), P3(gi + d, j, 12.8), 0.016, W, "s", 6); });
    rod(P3(gi, a, H), P3(gi, b, H), 0.03, W, "s", 8); rod(P3(gi + d, a, 12.8), P3(gi + d, b, 12.8), 0.014, W, "s", 6); rod(P3(gi + d, a, 0.5), P3(gi + d, b, 0.5), 0.014, W, "s", 6); });

  /* ── 텃밭 ── */
  [1.2, 5.2].forEach((i0, k) => { B(i0, 9.8, 3.6, 1.5, 9, "#B98B55", 0, {r:0.04}); B(i0 + 0.1, 9.9, 3.4, 1.3, 0.5, "#6E5A44", 8.7, {r:0});
    for(let i = i0 + 0.3; i < i0 + 3.4; i += 0.42) for(let j = 10.15; j < 11.1; j += 0.45){
      if(!k){ ball(i, j, 10.6, 0.11, sh(PL, 0.12), "m", 0.62); ball(i + 0.02, j - 0.02, 12.2, 0.075, sh(PL, 0.3), "m", 0.7); }
      else { rod(P3(i, j, 9.2), P3(i, j, 15.5), 0.012, PL, "m", 4); ball(i - 0.04, j, 13.5, 0.05, PL, "m", 0.5, 8);
        ball(i + 0.02, j + 0.02, 15.8, 0.048, (Math.round(i * 10 + j * 10) % 2) ? "#D8402A" : "#3E8A3A", "s", 1.3, 8); } }
    K.wtext(k ? "고추" : "상추", i0 + 1.8, 11.3, 4.5, "i", 3.2, "#FFFFFF", null, 800, K.FONT); });
  B(9.1, 12.0, 0.45, 0.32, 5, "#4DAA97", 0, {r:0.05, cls:"s"}); rod(P3(9.55, 12.16, 4), P3(9.85, 12.16, 7), 0.016, "#4DAA97", "s", 6);
  rod(P3(9.18, 12.16, 5), P3(9.18, 12.16, 7.5), 0.012, "#3E8A7A", "s", 4); rod(P3(9.18, 12.16, 7.5), P3(9.45, 12.16, 7.5), 0.012, "#3E8A7A", "s", 4);
  const pot = (i, j, s) => { B(i - 0.32 * s, j - 0.32 * s, 0.64 * s, 0.64 * s, 10 * s, "#C98A5E", 0, {r:0.06});
    [[0, -3, 9], [-7, 2, 7], [7, 3, 7], [-3, -10, 6], [4, -9, 6]].forEach(([dx, dy, r], k) => { const L = dx * s / 39.6 / Math.SQRT2, D = (k % 2 ? 0.05 : -0.05) * s;
      ball(i + L + D, j - L + D, 22 * s - dy * s, r * s / 31.1 * 1.15, k % 2 ? sh(PL, 0.18) : PL, "m", 0.92); }); };
  pot(14.0, 9.9, 0.9); pot(0.9, 19.1, 1);

  /* ── 물탱크 · 실외기 · 계단·엘리베이터 ── */
  B(1.6, 15.2, 3.6, 3.6, 6, metal, 0, {cls:"s"});
  const tc = "#7DB3CF"; B(1.8, 15.4, 3.2, 3.2, 40, tc, 6, {r:0.06});
  [2.6, 3.4, 4.2].forEach(i => box(X(i), hz(26), Z(18.6) + 0.006, 0.025, hz(40), 0.012, sh(tc, -0.16), "m", 0));
  [16.2, 17.0, 17.8].forEach(j => box(X(5.0) + 0.006, hz(26), Z(j), 0.012, hz(40), 0.025, sh(tc, -0.2), "m", 0));
  [16, 26, 36].forEach(z => { box(X(3.4), hz(z), Z(18.6) + 0.006, 3.2, 0.02, 0.012, sh(tc, -0.18), "m", 0); box(X(5.0) + 0.006, hz(z), Z(17.0), 0.012, 0.02, 3.2, sh(tc, -0.22), "m", 0); });
  [16.9, 17.4].forEach(j => rod(P3(5.07, j, 0), P3(5.07, j, 46), 0.016, metal, "s", 6));
  for(let z = 4; z <= 40; z += 6) rod(P3(5.07, 16.9, z), P3(5.07, 17.4, z), 0.011, metal, "s", 5);
  [6.0, 7.6].forEach(i => { B(i, 18.9, 1.4, 0.75, 12, "#E9E6DF", 0, {r:0.04});
    const f = sm(K.cyl(0.165, 0.165, 0.02, 20), "#9A968E", X(i + 0.7), hz(6), Z(19.65) + 0.008, "s"); f.rotation.x = Math.PI / 2;
    const hub = sm(K.cyl(0.03, 0.03, 0.03, 8), "#5A5650", X(i + 0.7), hz(6), Z(19.65) + 0.02, "s"); hub.rotation.x = Math.PI / 2; });
  const ef = 12.934;
  B(10.4, 15.6, 2.53, 4.2, 72, "#ECE5DA", 0, {r:0.03}); B(10.32, 15.52, 2.69, 4.36, 4, "#CFC7BA", 72, {r:0.03});
  K.faceI(ef, 16.52, 17.68, 0, 60, "#A9A196");
  box(X(ef) + 0.022, hz(28), Z(17.1), 0.004, hz(56), 1.0, "#E9CF9F", "glow", 0);     // 문 열리면 보이는 안쪽 불빛
  K.faceI(ef + 0.002, 16.78, 17.42, 62, 68.5, "#141414");
  K.faceI(ef, 17.95, 18.85, 0, 50, "#3E8A6A"); K.faceI(ef + 0.002, 18.2, 18.6, 30, 42, "#CFE6F0", "s");
  ball(ef + 0.035, 18.75, 24, 0.028, "#D9B45A", "s", 1, 8);
  K.faceI(ef + 0.002, 18.15, 18.65, 54, 59, "#2E9E5A"); K.wtext("EXIT", ef + 0.004, 18.4, 56.5, "j", 2.6, "#FFFFFF", null, 800);
  K.wtext("CREYONG", 11.66, 19.8, 50, "i", 7.5, "#E8A04A", null, 800); K.wtext("ROOFTOP · 5F", 11.66, 19.8, 41, "i", 3.6, "#8A8378", null, 700);
  B(12.95, 17.0, 0.12, 0.25, 2.4, "#FFF3D6", 62, {cls:"glow", r:0.01});

  /* ── 모닥불 데크 · 회식 ── */
  const wd = "#C99A66"; B(DECK[0], DECK[1], DECK[2] - DECK[0], DECK[3] - DECK[1], 1.8, wd, 0, {r:0.03});
  const dy = hz(1.8);
  for(let j = 3.0; j < 10.9; j += 0.5) box(X(21.5), dy + 0.001, Z(j), 10.96, 0.003, 0.02, sh(wd, -0.13), "m", 0);
  sm(K.cyl(0.86, 0.86, 0.004, 28), "#3C281E", X(FIRE[0]), dy + 0.004, Z(FIRE[1]), "glass");     // 불 밑 그을음
  // 화로
  [0, 1, 2].forEach(k => { const a = k * Math.PI * 2 / 3 + 0.5; rod(new T.Vector3(X(FIRE[0]) + Math.cos(a) * 0.36, dy, Z(FIRE[1]) + Math.sin(a) * 0.36), new T.Vector3(X(FIRE[0]) + Math.cos(a) * 0.2, hz(6.5), Z(FIRE[1]) + Math.sin(a) * 0.2), 0.02, "#3A3633", "s", 5); });
  sm(K.cyl(0.4, 0.22, hz(4), 20), "#4A4542", X(FIRE[0]), hz(8), Z(FIRE[1]), "s");
  sm(K.cyl(0.415, 0.415, 0.03, 22), "#5A5450", X(FIRE[0]), hz(10), Z(FIRE[1]), "s");
  sm(K.cyl(0.35, 0.35, 0.01, 20), "#1E1816", X(FIRE[0]), hz(10) + 0.012, Z(FIRE[1]), "m");
  sm(K.cyl(0.29, 0.29, 0.008, 20), "#E2532A", X(FIRE[0]), hz(10) + 0.02, Z(FIRE[1]), "glow");
  sm(K.cyl(0.16, 0.16, 0.008, 16), "#FFB347", X(FIRE[0]), hz(10) + 0.026, Z(FIRE[1]), "glow");
  rod(P3(FIRE[0] - 0.26, FIRE[1] - 0.12, 10.6), P3(FIRE[0] + 0.24, FIRE[1] + 0.14, 12.2), 0.045, "#6B4A34", "m", 8);
  rod(P3(FIRE[0] - 0.2, FIRE[1] + 0.22, 12.2), P3(FIRE[0] + 0.22, FIRE[1] - 0.2, 10.6), 0.045, "#5A3E2C", "m", 8);
  // 캠핑 의자 4 (등받이는 불 반대쪽)
  CHAIRS.forEach(([i, j, side, col]) => { const g = new T.Group(); g.position.set(X(i), dy, Z(j)); g.rotation.y = {"-j":0, "+j":Math.PI, "-i":Math.PI / 2, "+i":-Math.PI / 2}[side]; K.root.add(g);
    const seat = sm(K.rbox(0.6, 0.03, 0.58, 0.012), col, 0, hz(7.5) - dy, 0, "m", g); seat.rotation.x = 0.06;
    const back = sm(K.rbox(0.58, hz(15), 0.03, 0.012), sh(col, -0.08), 0, hz(15.5) - dy, -0.31, "m", g); back.rotation.x = -0.16;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => rod(new T.Vector3(a * 0.3, 0, b * 0.3).applyMatrix4(g.matrix.compose(g.position, g.quaternion.setFromEuler(g.rotation), g.scale)),
      new T.Vector3(-a * 0.18, hz(8) - dy, -b * 0.18).applyMatrix4(g.matrix), 0.012, "#3A3633", "s", 5)); });
  // 데크 기둥 + 전구 줄 (90개)
  POSTS.forEach(([i, j]) => B(i - 0.06, j - 0.06, 0.12, 0.12, 58, "#8B6B4E", 1.8));
  S.bulbs = [];
  [[0, 1], [1, 2], [2, 3], [3, 0], [0, 2], [1, 3]].forEach(([a, b], q) => { const A = POSTS[a], Bp = POSTS[b], pt = u => P3(A[0] + (Bp[0] - A[0]) * u, A[1] + (Bp[1] - A[1]) * u, 58 - Math.sin(Math.PI * u) * 10);
    for(let k = 0; k < 16; k++) rod(pt(k / 16), pt((k + 1) / 16), 0.006, "#3C3228", "s", 4);
    for(let k = 1; k < 16; k++){ const p = pt(k / 16); p.y -= hz(1.6); sm(K.sph(0.034, 8, 6), BULB_C[k % 3], p.x, p.y, p.z, "glow"); S.bulbs.push([p, k, q]); } });
  // 기타 의자
  sm(K.cyl(0.22, 0.24, hz(6.5), 16), "#8B6B4E", X(24.6), dy + hz(6.5) / 2, Z(9.7), "m");
  // 회식: 현수막 · 테이블 · 음식 · 빨간 의자
  [22.75, 26.05].forEach(i => B(i - 0.04, 2.11, 0.08, 0.08, 42, "#8B6B4E"));
  K.faceJ(22.8, 26.0, 2.15, 31, 40, "#E8A04A"); K.faceJ(22.8, 26.0, 2.15, 31, 31.8, "#C98436", "m", 0.03);
  K.wtext("크레용 회식 · 다들 수고했어요!", 24.4, 2.16, 35.6, "i", 3.0, "#FFFFFF", null, 800, K.FONT);
  [[22.68, 3.13], [22.68, 3.81], [26.06, 3.13], [26.06, 3.81]].forEach(([i, j]) => B(i, j, 0.06, 0.06, 16.5, "#8A857E", 0, {cls:"s"}));
  B(HT.i0, HT.j0, HT.i1 - HT.i0, HT.j1 - HT.j0, 1.4, "#E9E2D6", 16.5, {r:0.02});
  B(22.88, 3.2, 0.62, 0.5, 2.4, "#F2C14E", 17.95, {r:0.02}); B(22.92, 3.24, 0.54, 0.42, 0.25, "#FFFFFF", 20.35, {r:0});
  K.wtext("치킨", 23.19, 3.7, 19.15, "i", 1.6, "#C0504A", null, 800, K.FONT);
  [[23.0, 3.35], [23.15, 3.5], [23.3, 3.32], [23.08, 3.55], [23.34, 3.52]].forEach(([i, j]) => ball(i, j, 21.0, 0.045, "#C9762E", "m", 0.7, 8));
  cyl(24.4, 3.5, 0.26, 0.6, "#F0C060", 17.95, "m", 20); cyl(24.4, 3.5, 0.21, 0.4, "#E8484A", 18.4, "m", 20);
  [[24.32, 3.42], [24.5, 3.45], [24.4, 3.62], [24.28, 3.58], [24.52, 3.6]].forEach(([i, j]) => ball(i, j, 18.9, 0.03, "#FFF1C2", "m", 0.6, 6));
  [[25.25, 3.35, "#2A2A28"], [25.5, 3.6, "#2E9E5A"], [25.82, 3.3, "#2A2A28"]].forEach(([i, j, c]) => { cyl(i, j, 0.05, 5, c, 17.95, "s", 10); cyl(i, j, 0.022, 2.2, c, 22.9, "s", 8); });
  [23.2, 24.4, 25.6].forEach(c => { cyl(c - 0.38, 3.18, 0.05, 2.6, "#F4F1EA", 17.95, "s", 10); cyl(c + 0.38, 3.82, 0.05, 2.6, "#F4F1EA", 17.95, "s", 10); });
  [[23.2, 2.62], [24.4, 2.62], [25.6, 2.62], [23.2, 4.38], [24.4, 4.38], [25.6, 4.38], [22.05, 3.5]].forEach(([i, j]) => {
    B(i - 0.21, j - 0.21, 0.42, 0.42, 1.6, "#D8402A", 9, {r:0.05, cls:"s"});
    [[-0.17, -0.17], [0.13, -0.17], [-0.17, 0.13], [0.13, 0.13]].forEach(([a, b]) => B(i + a, j + b, 0.04, 0.04, 9, "#B8301E", 0, {cls:"s"})); });

  /* ── 오른쪽 잔디: 샘 · 냇가 · 해먹 · 그네 · 돗자리 · 빨래 · 빈백 · 산울타리 · 꽃밭 ── */
  [[29.0, 0.7, 0.3, 0.55, "#8F897F"], [29.7, 0.75, 0.24, 0.6, "#A39C90"], [29.35, 0.55, 0.21, 1.15, "#B5AEA2"]].forEach(([i, j, r, sy, c]) => ball(i, j, r * sy * 31.1 * 0.55, r, c, "m", sy, 14));
  rod(P3(29.35, 0.62, 13), P3(29.3, 1.0, 1), 0.03, "#7CC0DC", "s", 8);
  [[29.2, 1.1], [29.42, 1.05], [29.3, 1.22]].forEach(([i, j]) => ball(i, j, 1.2, 0.03, "#FFFFFF", "s", 0.7, 6));
  for(let k = 1; k <= 7; k++){ const [si, sj] = STREAM[k];
    [[si - 0.48, sj + 0.1, 0], [si + 0.5, sj - 0.2, 1]].forEach(([i, j, s]) => { const h = rHash(k, s, 5); ball(i, j, 0.6, (4.5 + h * 3) / 39.6, h > 0.5 ? "#9A948A" : "#B5AEA2", "m", 0.42, 10); }); }
  STREAM_STONES.forEach(([i, j]) => { cyl(i, j, 0.18, 1, "#8F897F", 0, "m", 12); cyl(i - 0.01, j - 0.01, 0.15, 0.5, "#C9C2B6", 1, "m", 12); });
  ball(30.05, 7.6, 0, 0.25, "#9A948A", "m", 0.76, 14); ball(30.0, 7.56, 3.2, 0.17, "#B5AEA2", "m", 0.5, 12);
  // 해먹
  [29.6, 33.4].forEach(i => B(i - 0.07, 2.23, 0.14, 0.14, 38, "#8B6B4E"));
  rod(P3(29.6, 2.3, 36), P3(29.75, 2.3, 30), 0.008, "#C9B79A", "m", 4); rod(P3(33.4, 2.3, 36), P3(33.25, 2.3, 30), 0.008, "#C9B79A", "m", 4);
  { const zf = u => 30 - Math.sin(Math.PI * u) * 15, HC = ["#E8A04A", "#FFFFFF", "#3A8A78", "#FFFFFF"];
    for(let k = 0; k < 12; k++){ const u0 = k / 12, u1 = (k + 1) / 12, a = P3(29.75 + 3.5 * u0, 2.3, zf(u0)), b = P3(29.75 + 3.5 * u1, 2.3, zf(u1)), d = b.clone().sub(a);
      const o = sm(K.rbox(d.length() + 0.01, 0.014, 0.5, 0), HC[k % 4], (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2, "m"); o.rotation.z = Math.atan2(d.y, d.x); } }
  // 그네 벤치
  [[30.7, 8.55], [30.7, 9.45], [33.1, 8.55], [33.1, 9.45]].forEach(([i, j]) => rod(P3(i, j, 0), P3(i, 9.0, 46), 0.02, "#FFFFFF", "s", 6));
  rod(P3(30.7, 9.0, 46), P3(33.1, 9.0, 46), 0.026, "#FFFFFF", "s", 8);
  B(30.65, 8.6, 2.5, 0.8, 1.6, "#F4A7B9", 46.6, {r:0.05});
  [30.95, 32.85].forEach(i => rod(P3(i, 9.0, 45), P3(i, 9.05, 9.6), 0.006, "#8A8378", "s", 4));
  B(30.9, 8.85, 2.0, 0.42, 1.6, "#C99A66", 8, {r:0.03}); K.faceJ(30.9, 32.9, 8.85, 9.6, 20, "#B98B55", "m", 0.03);
  ball(31.4, 9.05, 10.3, 0.13, "#FFE066", "m", 0.32); ball(32.4, 9.05, 10.3, 0.13, "#C8B4D0", "m", 0.32);
  // 돗자리 바구니
  B(34.5, 7.3, 0.42, 0.32, 4.5, "#C79A62", 0, {r:0.04});
  { const hd = sm(new T.TorusGeometry(0.13, 0.012, 6, 14, Math.PI), "#8B6B4E", X(34.71), hz(4.5), Z(7.46), "m"); }
  // 빨래 건조대
  [[32.0, 10.6], [34.8, 10.6], [32.0, 11.6], [34.8, 11.6]].forEach(([i, j]) => rod(P3(i, j, 0), P3(i, 11.1, 24), 0.012, metal, "s", 5));
  rod(P3(32.0, 11.1, 24), P3(34.8, 11.1, 24), 0.015, metal, "s", 6);
  // 빈백
  ball(33.5, 12.85, 4.2, 0.33, "#E8A04A", "m", 0.42, 16); ball(33.44, 12.8, 7.2, 0.22, "#F2B968", "m", 0.36, 14);
  // 산울타리
  const hedge = "#5E9B5A";
  [[15.4, 27.0], [28.4, 35.6]].forEach(([s, e]) => { for(let a = s; a < e - 0.01; a += 1.0){ const a2 = Math.min(e, a + 1.0); B(a, 0.35, a2 - a, 0.6, 8, hedge, 0, {r:0.1}); }
    for(let i = s + 0.16, n = 0; i < e - 0.1; i += 0.32, n++) ball(i, 0.65, 9.2, 0.135, sh(hedge, n % 2 ? 0.1 : -0.06), "m", 0.8, 10); });
  // 꽃밭 (오른쪽 · 앞)
  const bed = (a, b, w, d, pl) => { B(a, b, w, d, 9, "#B98B55", 0, {r:0.03}); B(a + 0.04, b + 0.04, w - 0.08, d - 0.08, 0.4, "#6E5A44", 8.8, {r:0}); pl(); };
  for(let b = 4.4; b < 13.79; b += 1.0){ const b2 = Math.min(13.8, b + 1.0), k0 = b * 5 | 0;
    bed(35.0, b, 0.6, b2 - b, () => { for(let j = b + 0.11, n = 0; j < b2 - 0.05; j += 0.22, n++){ ball(35.3, j, 10.6, 0.075, PL, "m", 0.7, 8); ball(35.3 + (n % 2 ? 0.05 : -0.05), j, 12.6, 0.052, FLOWER[(k0 + n + 2) % 6], "m", 0.8, 8); } }); }
  for(let a = 15.6; a < 20.39; a += 1.0){ const a2 = Math.min(20.4, a + 1.0), k0 = a * 3 | 0;
    bed(a, 18.95, a2 - a, 0.62, () => { for(let i = a + 0.11, n = 0; i < a2 - 0.05; i += 0.22, n++){ ball(i, 19.26, 10.6, 0.075, PL, "m", 0.7, 8); ball(i, 19.26 + (n % 2 ? 0.05 : -0.05), 12.6, 0.052, FLOWER[(k0 + n) % 6], "m", 0.8, 8); } }); }

  /* ── 앞 정원: 평상 · 그릴 · 아이스박스 · 가랜드 · 연못 · 갈대 ── */
  const bq = "#C79A62";
  [[15.9, 15.3], [19.56, 15.3], [15.9, 18.16], [19.56, 18.16]].forEach(([i, j]) => B(i, j, 0.14, 0.14, 6, sh(bq, -0.2)));
  B(BQ.i0, BQ.j0, BQ.i1 - BQ.i0, BQ.j1 - BQ.j0, 1.4, bq, 5.6, {r:0.03});
  for(let k = 0; k < 8; k++) B(16.0 + k * 0.45, 15.4, 0.45, 2.8, 0.2, k % 2 ? "#E9DCC0" : "#D9C49A", 7.0, {r:0});
  [[16.7, 15.75, "#C0504A"], [18.8, 15.75, "#3E6EA8"], [16.8, 17.9, "#E8A04A"], [18.6, 17.9, "#4DAA97"]].forEach(([i, j, c]) => B(i - 0.4, j - 0.35, 0.8, 0.7, 1.6, c, 7.1, {r:0.07}));
  const tb = "#8B5A3C";
  [[16.95, 16.35], [18.65, 16.35], [16.95, 17.25], [18.65, 17.25]].forEach(([i, j]) => B(i, j, 0.1, 0.1, 3, sh(tb, -0.2), 7));
  B(16.9, 16.3, 1.9, 1.1, 1.2, tb, 10, {r:0.03});
  cyl(17.4, 16.7, 0.2, 0.5, "#F4F1EA", 11.2, "s", 18); [[-0.08, "#C9765A"], [0, "#F2D2BA"], [0.08, "#C9765A"]].forEach(([o, c]) => box(X(17.4 + o), hz(11.9), Z(16.7), 0.06, 0.012, 0.22, c, "m", 0));
  cyl(18.3, 16.6, 0.16, 0.5, "#E9E6DF", 11.2, "s", 16); [[-0.06, -0.04], [0.05, -0.05], [0, 0.05], [-0.07, 0.06], [0.07, 0.04]].forEach(([a, b]) => ball(18.3 + a, 16.6 + b, 12.2, 0.055, "#7CB342", "m", 0.55, 8));
  [-0.12, 0, 0.12].forEach(o => { const g = new T.CylinderGeometry(0.09, 0.09, 0.03, 12, 1, false, 0, Math.PI); const w = sm(g, "#3E8A3A", X(17.9 + o), hz(11.2) + 0.002, Z(17.15), "m"); w.rotation.set(Math.PI / 2, 0, Math.PI);
    const r2 = sm(new T.CylinderGeometry(0.072, 0.072, 0.032, 12, 1, false, 0, Math.PI), "#E8484A", X(17.9 + o), hz(11.2) + 0.012, Z(17.15) + 0.002, "m"); r2.rotation.set(Math.PI / 2, 0, Math.PI); });
  [[18.55, 17.2, "#2E9E5A"], [17.1, 17.2, "#D8402A"]].forEach(([i, j, c]) => { cyl(i, j, 0.06, 4.5, c, 11.2, "s", 10); cyl(i, j, 0.024, 2, c, 15.7, "s", 8); });
  // 드럼 그릴
  [[-0.32, -0.2], [0.32, -0.2], [0, 0.35]].forEach(([a, b]) => rod(P3(GRILL[0] + a, GRILL[1] + b, 0), P3(GRILL[0] + a / 2, GRILL[1] + b / 2, 16), 0.018, "#2A2A28", "s", 5));
  { const k = sm(new T.SphereGeometry(0.36, 18, 9, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), "#1E1E1E", X(GRILL[0]), hz(18), Z(GRILL[1]), "s"); k.scale.y = 0.8; }
  sm(K.cyl(0.365, 0.365, 0.03, 22), "#3A3A3A", X(GRILL[0]), hz(18), Z(GRILL[1]), "s");
  sm(K.cyl(0.3, 0.3, 0.008, 18), "#E2532A", X(GRILL[0]), hz(17), Z(GRILL[1]), "glow"); sm(K.cyl(0.16, 0.16, 0.008, 14), "#FFB347", X(GRILL[0]), hz(17) + 0.006, Z(GRILL[1]), "glow");
  for(let o = -0.27; o <= 0.28; o += 0.09) rod(P3(GRILL[0] + o, GRILL[1] - Math.sqrt(0.36 * 0.36 - o * o) + 0.02, 18.6), P3(GRILL[0] + o, GRILL[1] + Math.sqrt(0.36 * 0.36 - o * o) - 0.02, 18.6), 0.005, "#A8A8A8", "s", 4);
  [[-0.16, -0.08], [0.02, -0.12], [0.18, -0.02], [-0.1, 0.12], [0.1, 0.13]].forEach(([a, b], n) => { const m = box(X(GRILL[0] + a), hz(19.2), Z(GRILL[1] + b), 0.2, 0.014, 0.07, n % 2 ? "#B8654A" : "#C9765A", "m", 0); m.rotation.y = 0.5 + n * 0.3; });
  B(20.65, 15.7, 0.7, 0.5, 6, "#4A90C8", 0, {r:0.04}); B(20.63, 15.68, 0.74, 0.54, 1.4, "#FFFFFF", 6, {r:0.03});
  // 가랜드
  [[15.5, 14.8], [20.2, 14.8]].forEach(([i, j]) => B(i - 0.05, j - 0.05, 0.1, 0.1, 44, "#8B6B4E"));
  { const pt = u => P3(15.5 + 4.7 * u, 14.8, 43 - Math.sin(Math.PI * u) * 7);
    for(let k = 0; k < 12; k++) rod(pt(k / 12), pt((k + 1) / 12), 0.005, "#3C3228", "s", 4);
    const FC = ["#E8A04A","#3A8A78","#F4A7B9","#FFE066","#7FB7C9","#C8B4D0"], pos = [], col = [];
    for(let k = 1; k <= 11; k++){ const a = pt((k - 0.35) / 12), b = pt((k + 0.35) / 12), m = pt(k / 12); m.y -= hz(8);
      [a, b, m, b, a, m].forEach(v => pos.push(v.x, v.y, v.z)); }
    const g = new T.BufferGeometry(); g.setAttribute("position", new T.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
    const parts = []; for(let k = 0; k < 11; k++){ const gg = new T.BufferGeometry(); gg.setAttribute("position", new T.Float32BufferAttribute(pos.slice(k * 18, k * 18 + 18), 3)); gg.computeVertexNormals(); sm(gg, FC[(k + 1) % 6], 0, 0, 0, "m"); } }
  // 연못 둘레 돌 · 연잎 · 갈대
  for(let k = 0; k < 30; k++){ const a = k / 30 * Math.PI * 2, [i, j] = pondPt(a, 1.06), h = rHash(k, 3, 9);
    ball(i, j, 1.0, (6 + h * 3) / 39.6, h > 0.5 ? "#9A948A" : "#B5AEA2", "m", 0.48, 10); }
  [[25.9, 14.9, 1], [27.3, 15.0, 0], [26.8, 15.8, 1], [25.8, 15.6, 0]].forEach(([i, j, f], n) => {
    const g = new T.CylinderGeometry(0.15, 0.15, 0.008, 18, 1, false, 0.35 + n, Math.PI * 2 - 0.5); sm(g, "#5E9B5A", X(i), 0.018, Z(j), "m");
    if(f){ ball(i, j, 1.6, 0.055, "#F4A7B9", "m", 0.8, 10); ball(i, j, 2.6, 0.026, "#FFFFFF", "m", 1, 6); } });
  [[25.55, 14.05], [27.75, 16.45], [28.25, 14.6]].forEach(([ci, cj], q) => { for(let k = 0; k < 6; k++){
    const di = (rHash(q, k, 1) - 0.5) * 0.5, dj = (rHash(q, k, 2) - 0.5) * 0.4, h = 14 + rHash(q, k, 3) * 10, lean = (rHash(q, k, 4) - 0.5) * 0.12;
    rod(P3(ci + di, cj + dj, 0), P3(ci + di + lean, cj + dj - lean, h), 0.009, "#6E9B4A", "m", 4);
    if(k % 2) { const o = sm(K.cyl(0.026, 0.026, 0.11, 8), "#8B5A3C", X(ci + di + lean), hz(h) - 0.06, Z(cj + dj - lean), "m"); } } });
  [[16.8, 14.0], [18.6, 14.0], [24.6, 14.0]].forEach(([i, j]) => { cyl(i, j, 0.28, 1, "#D9D3C8", 0, "m", 16); cyl(i - 0.02, j - 0.02, 0.23, 0.6, "#E9E4DA", 1, "m", 16); });

  /* ── 인피니티 풀: 돌 턱 · 바닥 · 물받이 · 선베드 데크 · 선베드 3 · 파라솔 2 (물·유리는 buildPool) ── */
  { const stone = "#ECE6DA", stoneF = "#D3CABB", wz = POOL.z;
    B(POOL.i0, POOL.j0, GI - POOL.i0, POOL.wj - POOL.j0, wz + 1, stone, 0, {r:0.01}); B(POOL.i0, POOL.wj, POOL.wi - POOL.i0, GJ - POOL.wj, wz + 1, stone, 0, {r:0.01});
    B(POOL.wi, POOL.wj, GI - POOL.wi, GJ - POOL.wj, 0.6, "#7CC4DC", 0, {r:0});
    B(POOL.i0, GJ, GI - POOL.i0 + 0.16, 0.16, 1.6, stoneF, -5.6, {r:0}); B(GI, POOL.wj, 0.16, GJ - POOL.wj, 1.6, stoneF, -5.6, {r:0});
    B(POOL.i0 + 0.02, GJ + 0.02, GI - POOL.i0 + 0.12, 0.1, 0.1, "#8FD3E8", -4.1, {cls:"glow", r:0}); B(GI + 0.02, POOL.wj, 0.1, GJ - POOL.wj, 0.1, "#8FD3E8", -4.1, {cls:"glow", r:0});
    B(21.5, 15.7, 3.45, 1.8, 1.4, wd, 0, {r:0.02});
    for(let i = 21.85; i < 24.95; i += 0.35) box(X(i), hz(1.4) + 0.001, Z(16.6), 0.012, 0.003, 1.8, sh(wd, -0.13), "m", 0);
    SUNBEDS.forEach(([ci, col]) => { const i0 = ci - 0.31, z0 = 1.4;
      [[i0 + 0.04, 16.0], [ci + 0.21, 16.0], [i0 + 0.04, 17.3], [ci + 0.21, 17.3]].forEach(([a, b]) => B(a, b, 0.06, 0.06, 4, "#B8B2A8", z0, {cls:"s", r:0}));
      B(i0, 15.95, 0.62, 1.45, 1.4, "#F4F1EA", z0 + 4, {r:0.02}); B(i0 + 0.03, 16.5, 0.56, 0.88, 1.2, "#FFFFFF", z0 + 5.4, {r:0.03});
      B(i0 + 0.03, 16.85, 0.56, 0.2, 0.15, col, z0 + 6.6, {r:0});
      const bk = sm(K.rbox(0.56, 0.05, 0.585, 0.02), "#FFFFFF", X(ci), hz(z0 + 11.8), Z(16.26), "m"); bk.rotation.x = 0.608;
      const tw = sm(K.rbox(0.5, 0.012, 0.16, 0), col, X(ci), hz(z0 + 15.6) + 0.02, Z(16.12), "m"); tw.rotation.x = 0.608; });
    PARASOLS.forEach(([pi, pj, col]) => { B(pi - 0.12, pj - 0.12, 0.24, 0.24, 1.6, "#8A847A", 1.4, {r:0.03}); cyl(pi, pj, 0.018, 44.6, "#E9E4DA", 1.4, "s", 6);
      [0, 1].forEach(odd => { const pos = [], r = 0.85, top = hz(50), rim = hz(42);
        for(let k = odd; k < 8; k += 2){ const a0 = k / 8 * Math.PI * 2, a1 = (k + 1) / 8 * Math.PI * 2; pos.push(0, top, 0, Math.cos(a1) * r, rim, Math.sin(a1) * r, Math.cos(a0) * r, rim, Math.sin(a0) * r); }
        const g = new T.BufferGeometry(); g.setAttribute("position", new T.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); sm(g, odd ? "#FFFFFF" : col, X(pi), 0, Z(pj), "m"); }); }); }

  /* ── 풀 탈의실 (2026-11-23 감독님 "수영장에도 탈의실에서 수영복 입을수있고") ── */
  { const i0 = 27.95, i1 = 28.9, j0 = 16.5, j1 = 17.4, wl = "#FFFFFF", pk = "#F4B6CF";
    B(i0, j0, i1 - i0, j1 - j0, 1, "#F4F1EA", 0, {r:0.01});
    B(i1 - 0.06, j0, 0.06, j1 - j0, 62, wl, 1, {r:0}); B(i0, j0, i1 - i0, 0.06, 62, pk, 1, {r:0}); B(i0, j1 - 0.06, i1 - i0, 0.06, 62, pk, 1, {r:0});
    B(i0 - 0.07, j0 - 0.06, i1 - i0 + 0.13, j1 - j0 + 0.12, 3, "#E8B5C8", 63, {r:0.02});
    B(i0 - 0.04, j0, 0.08, j1 - j0, 6, "#E8B5C8", 56, {r:0.01});
    const n = 6, w = (j1 - j0 - 0.12) / n; for(let k = 0; k < n; k++) B(i0 - 0.01, j0 + 0.06 + k * w, 0.03, w, 50, k % 2 ? wl : "#F4A7B9", 6, {r:0});
    K.wtext("탈의실", (i0 + i1) / 2, j1 + 0.004, 44, "i", 3.4, "#FFFFFF", null, 800, K.FONT);
    K.wtext("🩱", (i0 + i1) / 2, j1 + 0.004, 31, "i", 4.2, "#FFFFFF", null, 400); }

  /* ── 나무 9 · 정원등 9 ── */
  TREES.forEach(([i, j, s]) => { sm(K.cyl(0.055, 0.08, hz(40 * s), 8), "#7A5A3C", X(i), hz(20 * s), Z(j), "m");
    [[0, -4, 16], [-11, 4, 12], [11, 5, 12], [-5, -14, 11], [6, -12, 11], [0, 6, 12]].forEach(([dx, dy, r], k) => { const L = dx * s / 39.6 / Math.SQRT2, D = [0, 0.12, -0.1, 0.08, -0.12, 0.16][k] * s;
      ball(i + L + D, j - L + D, 48 * s - dy * s, r * s / 31.1 * 1.12, k % 2 ? sh(PL, 0.18) : PL, "m", 0.95, 14); }); });
  ROOF_LAMPS.forEach(([i, j]) => { B(i - 0.05, j - 0.05, 0.1, 0.1, 30, "#3A3633", 0, {cls:"s"}); B(i - 0.14, j - 0.14, 0.28, 0.28, 6, "#FFF3D6", 30, {cls:"glow", r:0.02}); B(i - 0.17, j - 0.17, 0.34, 0.34, 1.6, "#3A3633", 36, {cls:"s", r:0.02}); });

  /* ── 잔디 꽃 (2.5D 풀잎 자리 중 h > 0.94) ── */
  S.tufts.forEach(t => { if(t.h > 0.94) ball(t.i, t.j, 2.6, 0.03, ["#FFFFFF", "#FFE066", "#F4A7B9"][t.n % 3], "m", 1, 6); });
}

/* ---------- 이웃 건물 · 우리 건물 창 (시간대마다 색을 바꿔 끼움, 빛 안 받음) ---------- */
function buildBackdrop(){
  const pos = [], col = [], items = [];
  const quad = (a, b, c, d, fn) => { const s = pos.length / 3; [a, b, c, a, c, d].forEach(v => pos.push(v.x, v.y, v.z)); items.push({s, n:6, fn}); };
  const V = (i, j, zpx) => new T.Vector3(X(i), hz(zpx), Z(j));
  // 상자: 윗면·앞(+j)·옆(+i)·뒤 두 면
  const prism = (i, j, w, d, z0, z1, fn) => {
    quad(V(i, j, z1), V(i, j + d, z1), V(i + w, j + d, z1), V(i + w, j, z1), ph => fn(ph, "top"));
    quad(V(i, j + d, z0), V(i + w, j + d, z0), V(i + w, j + d, z1), V(i, j + d, z1), ph => fn(ph, "front"));
    quad(V(i + w, j + d, z0), V(i + w, j, z0), V(i + w, j, z1), V(i + w, j + d, z1), ph => fn(ph, "side"));
    quad(V(i + w, j, z0), V(i, j, z0), V(i, j, z1), V(i + w, j, z1), ph => fn(ph, "front"));
    quad(V(i, j, z0), V(i, j + d, z0), V(i, j + d, z1), V(i, j, z1), ph => fn(ph, "side")); };
  const sh = K.shade;
  NB.forEach(([i, j, w, d, top], n) => {
    const base = ph => SKY[ph].nb[n % 5];
    prism(i, j, w, d, -230, top, (ph, f) => f === "top" ? sh(base(ph), 0.06) : f === "front" ? sh(base(ph), -0.08) : sh(base(ph), -0.22));
    prism(i - 0.05, j - 0.05, w + 0.1, d + 0.1, top, top + 4, (ph, f) => { const c = sh(base(ph), -0.05); return f === "top" ? c : f === "front" ? sh(c, -0.14) : sh(c, -0.28); });
    for(let z = top - 16; z > top - 90; z -= 22){
      for(let a = i + 0.5; a < i + w - 0.5; a += 1.1){ const L = rHash(n, a, z); quad(V(a, j + d + 0.01, z - 9), V(a + 0.6, j + d + 0.01, z - 9), V(a + 0.6, j + d + 0.01, z), V(a, j + d + 0.01, z), ph => L < SKY[ph].lit ? "!#FFD98A" : SKY[ph].win); }
      for(let b = j + 0.5; b < j + d - 0.5; b += 1.1){ const L = rHash(n + 50, b, z); quad(V(i + w + 0.01, b + 0.6, z - 9), V(i + w + 0.01, b, z - 9), V(i + w + 0.01, b, z), V(i + w + 0.01, b + 0.6, z), ph => L < SKY[ph].lit ? "!#FFD98A" : sh(SKY[ph].win, -0.15)); } }
    if(n % 3 === 0) prism(i + w * 0.55, j + 0.5, 1.4, 1.4, top + 4, top + 20, (ph, f) => { const c = ph === "night" ? "#3E5A70" : "#7DB3CF"; return f === "top" ? c : f === "front" ? sh(c, -0.14) : sh(c, -0.28); });
    else if(n % 3 === 2) prism(i + 0.6, j + d - 1.2, 1.0, 0.6, top + 4, top + 11, (ph, f) => { const c = sh(base(ph), 0.2); return f === "top" ? c : f === "front" ? sh(c, -0.14) : sh(c, -0.28); });
    else for(let a = i + 0.6; a < i + w - 0.4; a += 0.7) prism(a - 0.1, j + d * 0.5 - 0.1, 0.2, 0.2, top + 4, top + 10, (ph, f) => { const c = ph === "night" ? "#2E4A3C" : PL; return f === "top" ? c : sh(c, f === "front" ? -0.14 : -0.28); });
  });
  // 우리 건물 창 (3층 · 2층 · 1층)
  const gl = "#BCD5E2", faces = [[[0, GJ], [GI, GJ], "j"], [[GI, CH], [GI, GJ], "i"], [[GI, CH], [WI, CH], "j"], [[WI, 0], [WI, CH], "i"]];
  faces.forEach(([A, Bp, ax], f) => { const L = Math.hypot(Bp[0] - A[0], Bp[1] - A[1]), at = (u, z) => { const i = A[0] + (Bp[0] - A[0]) * u / L + (ax === "i" ? 0.012 : 0), j = A[1] + (Bp[1] - A[1]) * u / L + (ax === "j" ? 0.012 : 0); return V(i, j, z); };
    [[-12, -36, 0.6], [-56, -80, 0.55], [-100, -124, 0.85], [-144, -172, 0.3]].forEach(([z0, z1, pl]) => { for(let u = 0.6; u < L - 0.6; u += 1.25){ const L0 = rHash(f, u, z0);
      const q = ax === "j" ? [at(u, z1), at(u + 0.8, z1), at(u + 0.8, z0), at(u, z0)] : [at(u + 0.8, z1), at(u, z1), at(u, z0), at(u + 0.8, z0)];
      quad(...q, ph => ph !== "day" && L0 < pl ? "!#FFD98A" : ph === "day" ? sh(gl, ax === "i" ? -0.1 : 0) : ph === "sunset" ? sh("#9AA6BC", ax === "i" ? -0.14 : 0) : sh("#2B3448", ax === "i" ? -0.15 : 0)); } }); });
  const g = new T.BufferGeometry(); g.setAttribute("position", new T.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new T.Float32BufferAttribute(new Float32Array(pos.length), 3));
  const m = new T.Mesh(g, new T.MeshBasicMaterial({vertexColors:true, toneMapped:false})); m.renderOrder = -1; K.R.scene.add(m);
  S.back = {m, items};
}
function paintBackdrop(ph){
  const {m, items} = S.back, a = m.geometry.attributes.color, c = new T.Color(), tn = TINT[ph];
  items.forEach(it => { let h = it.fn(ph); const raw = h[0] === "!"; if(raw) h = h.slice(1);
    c.set(h); if(tn && !raw){ const k = tn[3]; c.setRGB(c.r * (1 - k) + new T.Color(`rgb(${tn[0]},${tn[1]},${tn[2]})`).r * k, c.g * (1 - k) + new T.Color(`rgb(${tn[0]},${tn[1]},${tn[2]})`).g * k, c.b * (1 - k) + new T.Color(`rgb(${tn[0]},${tn[1]},${tn[2]})`).b * k); }
    for(let v = it.s; v < it.s + it.n; v++) a.setXYZ(v, c.r, c.g, c.b); });
  a.needsUpdate = true;
}

/* ---------- 그물 (펜스 · 골대) 한 장 ---------- */
function buildNets(){
  const cv = document.createElement("canvas"); cv.width = cv.height = 64; const x = cv.getContext("2d");
  x.fillStyle = "rgba(255,255,255,.14)"; x.fillRect(0, 0, 64, 64); x.fillStyle = "#FFFFFF"; x.fillRect(0, 0, 64, 5); x.fillRect(0, 0, 5, 64);
  const tex = new T.CanvasTexture(cv); tex.wrapS = tex.wrapT = T.RepeatWrapping; tex.anisotropy = 4;
  const pos = [], uv = [], col = [];
  const panel = (A, Bv, C, D, cell, rgba) => {   // A-B 아래, D-C 위
    const w = A.distanceTo(Bv), h = A.distanceTo(D);
    [[A, 0, 0], [Bv, w, 0], [C, w, h], [A, 0, 0], [C, w, h], [D, 0, h]].forEach(([v, u, t]) => { pos.push(v.x, v.y, v.z); uv.push(u / cell, t / cell); col.push(...rgba); }); };
  const V = (i, j, zpx) => new T.Vector3(X(i), hz(zpx), Z(j));
  const fence = (a0, b0, a1, b1, al) => panel(V(a0, b0, 0), V(a1, b1, 0), V(a1, b1, 56), V(a0, b0, 56), 0.27, [0.2, 0.36, 0.27, al]);
  fence(FSF.i0, FSF.j0, FSF.i1, FSF.j0, 0.75); fence(FSF.i0, FSF.j0, FSF.i0, FSF.j1, 0.75); fence(FSF.i0, FSF.j1, FSF.i1, FSF.j1, 0.45);
  fence(FSF.i1, FSF.j0, FSF.i1, FSF.d0, 0.45); fence(FSF.i1, FSF.d1, FSF.i1, FSF.j1, 0.45);
  [[FS.i0, -0.45], [FS.i1, 0.45]].forEach(([gi, d]) => { const a = FS.gj - FS.gw, b = FS.gj + FS.gw, w = [1, 1, 1, 0.62];
    panel(V(gi + d, a, 0), V(gi + d, b, 0), V(gi + d, b, 12.8), V(gi + d, a, 12.8), 0.1, w);
    panel(V(gi, a, 16), V(gi, b, 16), V(gi + d, b, 12.8), V(gi + d, a, 12.8), 0.1, w);
    [a, b].forEach(j => { panel(V(gi, j, 0), V(gi + d, j, 0), V(gi + d, j, 12.8), V(gi, j, 16), 0.1, w); }); });
  const g = new T.BufferGeometry(); g.setAttribute("position", new T.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
  g.setAttribute("color", new T.Float32BufferAttribute(col, 4)); g.userData.base = col.slice();
  const m = new T.Mesh(g, new T.MeshBasicMaterial({map:tex, vertexColors:true, transparent:true, depthWrite:false, side:T.DoubleSide, toneMapped:false})); m.renderOrder = 3; K.R.scene.add(m);
  S.nets = m;
}

/* ---------- 움직이는 것들 ---------- */
function buildDynamic(){
  const sc = K.R.scene;
  // 잔디 풀잎 (한 번에)
  { const parts = [-0.5, 0.4, 1.4].map((a, k) => { const c = new T.ConeGeometry(0.022, 0.1 + k * 0.015, 4, 1); c.translate(0, 0.05, 0); c.rotateZ(0.32 * Math.cos(a * 2)); c.rotateY(a * 2.1); c.translate(Math.cos(a * 2) * 0.03, 0, Math.sin(a * 2) * 0.03); return c; });
    const tg = mergeGeometries(parts.map(p => p.toNonIndexed())); parts.forEach(p => p.dispose());
    const im = inst(tg, new T.MeshStandardMaterial({roughness:0.9}), S.tufts.length, false); const c = new T.Color();
    S.tufts.forEach((t, k) => { setI(im, k, X(t.i), 0.004, Z(t.j), 0, t.h * 7, 0, 1 + t.h * 0.4, 0.8 + t.h * 0.6, 1 + t.h * 0.4); im.setColorAt(k, c.set(t.h > 0.85 ? K.shade("#8DBE72", 0.12) : K.shade("#8DBE72", -0.2))); });
    im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; im.receiveShadow = true; S.tuftIM = im; }
  // 모닥불 불꽃 (3겹 × 3갈래)
  { const lat = new T.LatheGeometry([[0, 0], [0.55, 0.1], [0.82, 0.28], [0.72, 0.52], [0.42, 0.78], [0.12, 0.95], [0, 1]].map(([a, b]) => new T.Vector2(a, b)), 10);
    S.flame = inst(lat, new T.MeshBasicMaterial({transparent:true, opacity:0.9, depthWrite:false, toneMapped:false}), 9, false); S.flame.renderOrder = 4;
    const c = new T.Color(); for(let k = 0; k < 9; k++) S.flame.setColorAt(k, c.set(["#E2532A", "#FF8A3C", "#FFD36A"][k / 3 | 0])); S.flame.instanceColor.needsUpdate = true; }
  // 상자 모양 움직이는 것: 엘리베이터 문 2 · 빨래 4 · 실외기 날개 6 · 꽃가루(건배) 14 · 나비 날개 8 · 잉어 꼬리 5
  S.box = inst(UB, new T.MeshStandardMaterial({roughness:0.55, side:T.DoubleSide}), 39, true);
  const c = new T.Color(), cols = [..."ll".split("").map(() => "#C9CED3"), "#F4A7B9", "#FFFFFF", "#7FB7C9", "#FFE066", ...Array(6).fill("#5A5650"),
    ...Array.from({length:14}, (_, k) => ["#FFE066","#F4A7B9","#7FB7C9","#E8A04A"][k % 4]), ...[0, 0, 1, 1, 2, 2, 3, 3].map(k => ["#FFE066","#F4A7B9","#FFFFFF","#FF8C69"][k]),
    ...["#FF8C3A","#FFFFFF","#FF6A3A","#FFD36A","#FFFFFF"]];
  cols.forEach((h, k) => S.box.setColorAt(k, c.set(h))); S.box.instanceColor.needsUpdate = true;
  S.box.material.metalness = 0.0;
  // 잉어 몸통 5 · 연기 7
  S.koi = inst(US, new T.MeshStandardMaterial({roughness:0.45}), 5, false);
  ["#FF8C3A","#FFFFFF","#FF6A3A","#FFD36A","#FFFFFF"].forEach((h, k) => S.koi.setColorAt(k, c.set(h))); S.koi.instanceColor.needsUpdate = true;
  S.smoke = inst(US, new T.MeshStandardMaterial({color:0xEEEEEE, roughness:1, transparent:true, opacity:0.42, depthWrite:false}), 7, false); S.smoke.renderOrder = 4;
  // 연못 물결 3
  S.rip = inst(new T.RingGeometry(0.9, 1, 32).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({transparent:true, blending:T.AdditiveBlending, depthWrite:false, toneMapped:false}), 6, false);   // 연못 3 + 풀 첨벙 3
  // 냇물 흐름 (흰 점선이 흘러감)
  { const cv = document.createElement("canvas"); cv.width = 128; cv.height = 16; const x = cv.getContext("2d");
    x.fillStyle = "rgba(255,255,255,.75)"; x.fillRect(0, 5, 34, 3); x.fillStyle = "rgba(255,255,255,.45)"; x.fillRect(64, 10, 20, 2);
    const tex = new T.CanvasTexture(cv); tex.wrapS = T.RepeatWrapping; S.flowTex = tex;
    const pts = streamCurve(), pos = [], uv = [], w = 0.3; let L = 0;
    pts.forEach((p, k) => { const a = pts[Math.max(0, k - 1)], b = pts[Math.min(pts.length - 1, k + 1)], ti = b[0] - a[0], tj = b[1] - a[1], tl = Math.hypot(ti, tj) || 1, ni = -tj / tl * w / 2, nj = ti / tl * w / 2;
      if(k) L += Math.hypot(p[0] - pts[k - 1][0], p[1] - pts[k - 1][1]);
      pos.push(X(p[0] + ni), 0.014, Z(p[1] + nj), X(p[0] - ni), 0.014, Z(p[1] - nj)); uv.push(L / 0.9, 0, L / 0.9, 1); });
    const idx = []; for(let k = 0; k < pts.length - 1; k++){ const a = k * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    const g = new T.BufferGeometry(); g.setAttribute("position", new T.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
    const m = new T.Mesh(g, new T.MeshBasicMaterial({map:tex, transparent:true, depthWrite:false, toneMapped:false, side:T.DoubleSide})); m.renderOrder = 2; sc.add(m); }
  // 공
  { const cv = document.createElement("canvas"); cv.width = 128; cv.height = 64; const x = cv.getContext("2d"); x.fillStyle = "#FFFFFF"; x.fillRect(0, 0, 128, 64); x.fillStyle = "#2A2A28";
    [[16, 16], [56, 14], [96, 18], [36, 44], [76, 46], [116, 42]].forEach(([a, b]) => { x.beginPath(); for(let k = 0; k < 5; k++){ const t = k / 5 * Math.PI * 2; x.lineTo(a + Math.cos(t) * 8, b + Math.sin(t) * 7); } x.fill(); });
    const tex = new T.CanvasTexture(cv); tex.colorSpace = T.SRGBColorSpace;
    S.ball = new T.Mesh(new T.SphereGeometry(0.105, 18, 12), new T.MeshStandardMaterial({map:tex, roughness:0.5})); S.ball.castShadow = true; sc.add(S.ball); }
  // 엘리베이터 표시등 글씨
  { const cv = document.createElement("canvas"); cv.width = 128; cv.height = 42; S.indCv = cv; const tex = new T.CanvasTexture(cv); tex.colorSpace = T.SRGBColorSpace; S.indTex = tex;
    const m = new T.Mesh(new T.PlaneGeometry(0.62, 0.2), new T.MeshBasicMaterial({map:tex, transparent:true, toneMapped:false})); m.rotation.y = Math.PI / 2; m.position.set(X(12.934) + 0.03, hz(65.25), Z(17.1)); sc.add(m); S.indTxt = null; }
  // 빛 점 (전구 · 정원등 · 조명탑 · 엘리베이터 등 · 그릴 · 불씨 · 반딧불이)
  buildGlow();
  // 바닥 빛 웅덩이 (모닥불 · 풋살장 · 그릴)
  { const cv = document.createElement("canvas"); cv.width = cv.height = 128; const x = cv.getContext("2d"), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.45, "rgba(255,255,255,.4)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    const tex = new T.CanvasTexture(cv), list = [[FIRE[0], FIRE[1], 4.0, hz(1.8) + 0.008], [7.0, FS.gj, 6.2, 0.02], [GRILL[0], GRILL[1] + 0.2, 1.2, 0.02], [24.8, 18.6, 5.2, hz(POOL.z) + 0.012, 1.9]];
    const g2 = mergeGeometries(list.map(([i, j, r, y, rz]) => { const p = new T.PlaneGeometry(r * 2, (rz || r) * 2); p.rotateX(-Math.PI / 2); p.translate(X(i), y, Z(j)); return p; }));
    g2.setAttribute("color", new T.Float32BufferAttribute(new Float32Array(g2.attributes.position.count * 3), 3));
    const m = new T.Mesh(g2, new T.MeshBasicMaterial({map:tex, vertexColors:true, transparent:true, blending:T.AdditiveBlending, depthWrite:false, toneMapped:false})); m.renderOrder = 2; sc.add(m); S.pools = m; }
}
function buildGlow(){
  const P = [], add = (x, y, z, size, kind, k = 0) => P.push({x, y, z, size, kind, k});
  S.bulbs.forEach(([p, k, q]) => add(p.x, p.y, p.z, 0.32, "bulb", k * 1.7 + q));
  ROOF_LAMPS.forEach(([i, j]) => add(X(i), hz(33), Z(j), 1.1, "lamp"));
  FS_POLES.forEach(([i, j]) => add(X(i), hz(80), Z(j), 1.6, "flood"));
  add(X(13.0), hz(62), Z(17.12), 1.3, "door"); add(X(GRILL[0]), hz(18), Z(GRILL[1]), 1.3, "grill"); add(X(FIRE[0]), hz(22), Z(FIRE[1]), 2.2, "fireAir");
  POOL_LIGHTS.forEach(i => add(X(i), hz(8), Z(17.95), 1.5, "pool"));
  for(let k = 0; k < 9; k++) add(0, -50, 0, 0.14, "ember", k);
  FLY.forEach((f, k) => add(0, -50, 0, 0.3, "fly", k));
  const n = P.length, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), size = new Float32Array(n);
  P.forEach((p, k) => { pos.set([p.x, p.y, p.z], k * 3); size[k] = p.size; });
  const g = new T.BufferGeometry(); g.setAttribute("position", new T.BufferAttribute(pos, 3)); g.setAttribute("color", new T.BufferAttribute(col, 3)); g.setAttribute("size", new T.BufferAttribute(size, 1));
  const mat = new T.ShaderMaterial({uniforms:{uScale:{value:600}}, transparent:true, depthWrite:false, blending:T.AdditiveBlending,
    vertexShader:"attribute float size; attribute vec3 color; varying vec3 vC; uniform float uScale; void main(){ vC = color; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = size * uScale / -mv.z; gl_Position = projectionMatrix * mv; }",
    fragmentShader:"varying vec3 vC; void main(){ float d = length(gl_PointCoord - 0.5) * 2.0; if(d > 1.0) discard; float a = exp(-d * d * 3.2) * (1.0 - d * d); gl_FragColor = vec4(vC * a, a); }"});
  const pts = new T.Points(g, mat); pts.frustumCulled = false; pts.renderOrder = 5; K.R.scene.add(pts); S.glow = {pts, P};
}

/* ---------- 인피니티 풀 물 · 유리 · 넘치는 물 (셰이더 한 장 = 그리기 1번) ---------- */
function buildPool(){
  const wz = hz(POOL.z), i0 = POOL.wi, i1 = GI, j0 = POOL.wj, j1 = GJ, sy = -hz(4), pos = [], kd = [], uv = [];
  const q4 = (a, b, c, d, k, u) => [a, b, c, a, c, d].forEach((p, n) => { pos.push(...p); kd.push(k); uv.push(...u[[0, 1, 2, 0, 2, 3][n]]); });
  q4([X(i0), wz, Z(j0)], [X(i1), wz, Z(j0)], [X(i1), wz, Z(j1)], [X(i0), wz, Z(j1)], 0, [[i0, 0], [i1, 0], [i1, 1], [i0, 1]]);                       // 물 위
  q4([X(i0), 0, Z(j1) + 0.002], [X(i1), 0, Z(j1) + 0.002], [X(i1), wz, Z(j1) + 0.002], [X(i0), wz, Z(j1) + 0.002], 1, [[i0, 0], [i1, 0], [i1, 1], [i0, 1]]);   // 앞 유리
  q4([X(i1) + 0.002, 0, Z(j1)], [X(i1) + 0.002, 0, Z(j0)], [X(i1) + 0.002, wz, Z(j0)], [X(i1) + 0.002, wz, Z(j1)], 1, [[j1, 0], [j0, 0], [j0, 1], [j1, 1]]);   // 오른쪽 유리
  q4([X(POOL.i0), sy, Z(j1) + 0.006], [X(i1), sy, Z(j1) + 0.006], [X(i1), 0, Z(j1) + 0.006], [X(POOL.i0), 0, Z(j1) + 0.006], 2, [[POOL.i0, 0], [i1, 0], [i1, 1], [POOL.i0, 1]]);   // 넘치는 물
  q4([X(i1) + 0.006, sy, Z(j1)], [X(i1) + 0.006, sy, Z(j0)], [X(i1) + 0.006, 0, Z(j0)], [X(i1) + 0.006, 0, Z(j1)], 2, [[j1, 0], [j0, 0], [j0, 1], [j1, 1]]);
  const g = new T.BufferGeometry(); g.setAttribute("position", new T.Float32BufferAttribute(pos, 3)); g.setAttribute("kind", new T.Float32BufferAttribute(kd, 1)); g.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
  const mat = new T.ShaderMaterial({uniforms:{uT:{value:0}, uLit:{value:1}, uGlow:{value:0}}, transparent:true, depthWrite:false, side:T.DoubleSide, toneMapped:false,
    vertexShader:"attribute float kind; varying float vK; varying vec2 vUv; varying vec3 vW; void main(){ vK = kind; vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }",
    fragmentShader:`uniform float uT, uLit, uGlow; varying float vK; varying vec2 vUv; varying vec3 vW;
      void main(){
        float lit = uLit * 0.85 + 0.15; vec3 c; float a;
        if(vK < 0.5){
          float v = vUv.y; c = mix(vec3(0.18, 0.56, 0.71), vec3(0.31, 0.70, 0.83), smoothstep(0.0, 0.55, v)); c = mix(c, vec3(0.58, 0.86, 0.92), smoothstep(0.55, 1.0, v));
          float w = sin(vW.x * 5.1 + vW.z * 2.3 + uT * 1.6) + sin(-vW.x * 3.7 + vW.z * 6.2 - uT * 1.3) + 0.5 * sin(vW.x * 9.3 - vW.z * 4.1 + uT * 2.2);
          float sh = smoothstep(1.35, 2.2, w);
          c = c * lit + sh * (0.2 * uLit + 0.28 * uGlow) + vec3(0.08, 0.40, 0.55) * uGlow * (0.45 + 0.55 * (1.0 - v)); a = 0.93;
        } else if(vK < 1.5){
          c = mix(vec3(0.18, 0.50, 0.66), vec3(0.51, 0.82, 0.92), vUv.y) * lit + vec3(0.10, 0.42, 0.58) * uGlow * 0.7;
          float st = smoothstep(0.0, 0.04, abs(fract(vUv.x * 0.22 + vUv.y * 0.1) - 0.5) - 0.42); c += (1.0 - st) * 0.12 * uLit;
          c += smoothstep(0.93, 1.0, vUv.y) * 0.35; a = 0.84;
        } else {
          float col = floor(vUv.x * 3.0), s = smoothstep(0.8, 1.0, fract(vUv.y * 1.4 + uT * 1.1 + col * 0.37)) * step(0.35, fract(vUv.x * 3.0));
          c = vec3(0.60, 0.87, 0.95) * lit + vec3(0.10, 0.40, 0.52) * uGlow * 0.6 + s * 0.4; a = mix(0.3, 0.8, vUv.y);
        }
        gl_FragColor = vec4(c, a);
      }`});
  const m = new T.Mesh(g, mat); m.renderOrder = 2; m.frustumCulled = false; K.R.scene.add(m); S.water = m;
}

/* ---------- 하늘 (화면 뒤 그림판, 2.5D roofSky · 산) ---------- */
function paintSky(now){
  const R = K.R, cv = S.sky, w = R.w, h = R.h, dpr = Math.min(devicePixelRatio || 1, 1.5);
  if(cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)){ cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
  const x = cv.getContext("2d"), Sk = SKY[S.ph], ph = S.ph, t = now; x.setTransform(dpr, 0, 0, dpr, 0, 0);
  const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, Sk.top); if(Sk.mid) g.addColorStop(0.45, Sk.mid); g.addColorStop(1, Sk.bot); x.fillStyle = g; x.fillRect(0, 0, w, h);
  if(ph === "night"){
    for(let k = 0; k < 70; k++){ const sx = rHash(k, 1, 2) * w, sy = rHash(k, 3, 4) * h * 0.62, tw = K.reduce ? 0.8 : 0.45 + 0.55 * Math.abs(Math.sin(t * 0.0012 + k * 1.7));
      x.fillStyle = `rgba(255,255,240,${0.75 * tw})`; x.beginPath(); x.arc(sx, sy, k % 9 ? 0.9 : 1.6, 0, 7); x.fill(); }
    const mx = w * 0.84, my = h * 0.15; x.fillStyle = "#FFF6D8"; x.beginPath(); x.arc(mx, my, 15, 0, 7); x.fill(); x.fillStyle = Sk.top; x.beginPath(); x.arc(mx + 6, my - 4, 13, 0, 7); x.fill();
  } else {
    const [sx, sy, r, c] = ph === "day" ? [w * 0.86, h * 0.13, 20, "#FFF4C8"] : [w * 0.18, h * 0.3, 30, "#FFB070"];
    const sg = x.createRadialGradient(sx, sy, 0, sx, sy, r * 3.2); sg.addColorStop(0, c + "AA"); sg.addColorStop(1, c + "00"); x.fillStyle = sg; x.beginPath(); x.arc(sx, sy, r * 3.2, 0, 7); x.fill();
    x.fillStyle = c; x.beginPath(); x.arc(sx, sy, r, 0, 7); x.fill();
    for(let k = 0; k < 5; k++){ const cx = ((rHash(k, 5, 6) * w * 1.4 + (K.reduce ? 0 : t * 0.004 * (1 + k * 0.2))) % (w * 1.4)) - w * 0.2, cy = h * (0.06 + rHash(k, 7, 8) * 0.3), s = 0.7 + rHash(k, 9, 1) * 0.7;
      x.fillStyle = ph === "day" ? "rgba(255,255,255,.85)" : "rgba(255,214,200,.55)";
      [[-1.2, 0.2, 0.8], [0, -0.25, 1.1], [1.2, 0.15, 0.85], [0.4, 0.35, 0.9], [-0.4, 0.4, 0.8]].forEach(([dx, dy, rr]) => { x.beginPath(); x.ellipse(cx + dx * 18 * s, cy + dy * 12 * s, rr * 20 * s, rr * 10 * s, 0, 0, 7); x.fill(); }); }
  }
  // 뒤쪽 낮은 산: 카메라에서 제일 먼 옥상 모서리 위 150px 기준 (2.5D와 같은 자리)
  const cam = R.camera, f = new T.Vector3(); cam.getWorldDirection(f); f.y = 0; if(f.lengthSq() < 1e-6) f.set(-1, 0, -1); f.normalize();
  const A = f.clone().multiplyScalar(20.6); A.y = hz(150); const pa = A.clone().project(cam), pb = A.clone().add(new T.Vector3(0, 1, 0)).project(cam);
  // 3D는 위에서 내려다봐서 그 자리가 화면 밖으로 나가기 쉬움 → 화면 위쪽 띠 안에 붙잡아 둠 (하늘이 늘 보이게)
  const ax = (pa.x * 0.5 + 0.5) * w, ay = Math.max(h * 0.1, Math.min(h * 0.3, (-pa.y * 0.5 + 0.5) * h)), k = Math.max(0.5, Math.min(1.4, Math.abs(pb.y - pa.y) * 0.5 * h / 31.1)), off = (R.az || 0) * 600;
  [[Sk.hill[0], 0, 0.0021, 0], [Sk.hill[1], 32, 0.0034, 2]].forEach(([c, b, fq, o]) => { x.fillStyle = c; x.beginPath(); x.moveTo(-10, h + 10);
    for(let sx = -10; sx <= w + 20; sx += 10){ const X2 = (sx - ax) / k + off; x.lineTo(sx, ay + k * (b - 26 * Math.sin(X2 * fq + o) - 14 * Math.sin(X2 * fq * 2.7 + o * 3) - 8 * Math.sin(X2 * fq * 6.1))); }
    x.lineTo(w + 20, h + 10); x.closePath(); x.fill(); });
  if(Sk.tint){ x.fillStyle = Sk.tint; x.fillRect(0, 0, w, h); }
}

/* ---------- 시간대 ---------- */
function applyPhase(ph){
  const R = K.R, L = LIGHT[ph]; S.ph = ph;
  R.hemi.color.set(L.hemi[0]); R.hemi.groundColor.set(L.hemi[1]); R.hemi.intensity = L.hemi[2];
  R.sun.color.set(L.sun[0]); R.sun.intensity = L.sun[1]; R.sun.position.set(...L.sun[2]);
  R.renderer.toneMappingExposure = L.exp;
  Object.values(R.MAT).forEach(m => { if(m.isMeshStandardMaterial) m.envMapIntensity = L.env; }); R.floor.material.envMapIntensity = L.env;
  R.MAT.glow.color.setScalar(L.glow);
  R.lampL.forEach((l, k) => { const fs = k === 1; l.intensity = fs ? L.fs : L.lamp; l.color.set(fs ? 0xF2FFF0 : 0xFFD9A0); l.distance = fs ? 16 : k === 0 ? 12 : 8; });
  paintBackdrop(ph);
  if(S.water){ const u = S.water.material.uniforms; u.uLit.value = {day:1, sunset:0.74, night:0.42}[ph]; u.uGlow.value = {day:0, sunset:0.5, night:1}[ph]; }
  const n = S.nets.geometry.attributes.color, b = S.nets.geometry.userData.base; for(let v = 0; v < n.count; v++) n.setXYZW(v, b[v * 4] * L.net, b[v * 4 + 1] * L.net, b[v * 4 + 2] * L.net, b[v * 4 + 3]); n.needsUpdate = true;
  S.skyAt = 0;
}

/* ---------- 사람 ---------- */
const Q = Math.PI / 4;
const at2 = (i, j, ti, tj) => Math.atan2(ti - i, tj - j);
const NPC_HEAD = {r_g:0, r_b3:Q, r_feet:-0.95, r_gt:-0.45, r_read:Q, r_gd:Math.PI, h_1:0, h_2:0, h_3:0, h_4:Math.PI, h_5:Math.PI, h_6:Math.PI};
const NPC_SEAT = {r_b1:"bq", r_b2:"bq", r_feet:"rock", r_gt:"gstool", r_read:"bag", h_1:"stool", h_2:"stool", h_3:"stool", h_4:"stool", h_5:"stool", h_6:"stool", d_a:"mat", d_b:"mat"};
const SEATS = {chair:{top:hz(8)}, stool:{top:hz(10.6)}, gstool:{top:hz(8.3)}, swing:{top:hz(9.6)}, rock:{top:0.19}, bag:{top:0.26}, bq:{cross:hz(8.7)}, mat:{cross:0.012}, ground:{cross:0}, lounger:{top:hz(7.4)}};
const onDeck = (i, j) => inR(i, j, DECK[0], DECK[1], DECK[2], DECK[3]);
const spotKey = s => s.at[0] + "," + s.at[1];
const SPOT_HEAD = {"5,12.35":Math.PI, "29.95,4.2":-0.5, "13.75,1.6":-Math.PI / 2, "24.6,14.5":at2(24.6, 14.5, POND.ci, POND.cj), "28.35,16.1":at2(28.35, 16.1, POND.ci, POND.cj), "22.05,3.5":Math.PI / 2, "31.4,9":0, "32.4,9":0};
function spotSeat(s){
  if(s.pool) return "lounger"; if(s.fire) return "chair"; if(s.hsik) return "stool"; if(s.z) return "bq";
  if(s.deck && s.at[1] === 9.0) return "swing"; if(s.pose === "sit") return "ground"; return null;
}
function spotHead(s, sim, i, j){
  if(s.pool) return 0; if(s.fire) return at2(i, j, FIRE[0], FIRE[1]); if(s.z) return at2(i, j, TABLE_BQ[0], TABLE_BQ[1]);
  if(s.futsal) return at2(i, j, sim.ball.i, sim.ball.j);
  const k = SPOT_HEAD[spotKey(s)]; if(k != null) return k;
  return s.front || (s.face || 1) > 0 ? Q : -3 * Q;
}
function makeDefs(sim){
  const D = [];
  sim.npc.forEach(q => D.push({id:q.id, name:q.name, role:`${q.name} · ${q.role}`, task:q.desc, hex:"#9C9384", at:[q.i, q.j], face:0, look:q.look, build:q.kid ? {h:0.66, w:0.95} : {}}));
  sim.pds.forEach(q => D.push({id:q.id, name:q.name, role:q.role, task:"", hex:K.ST_COLOR[sim.status(q.id)] || K.ST_COLOR.idle, at:[q.i, q.j], face:0, look:q.look, headphones:!!q.headphones}));
  const y = sim.yuna, n = sim.nora;
  D.push({id:"_yuna", name:y.name, role:y.role, task:"", hex:y.hex, at:[y.i, y.j], face:0, look:y.look, build:{h:0.74, w:0.9}});
  D.push({id:"_nora", name:n.name, role:n.role, task:"", hex:n.hex, at:[n.i, n.j], face:0, look:n.look, build:{h:0.97, w:0.88}});
  return D;
}
function setupPeople(sim){
  const R = K.R, npc = Object.fromEntries(sim.npc.map(q => [q.id, q])), pds = Object.fromEntries(sim.pds.map(q => [q.id, q]));
  S.ppl = [];
  Object.values(R.people).forEach(P => {
    const id = P.id, kind = npc[id] ? (npc[id].fc ? "fc" : "npc") : pds[id] ? "pd" : id === "_yuna" ? "yuna" : "nora";
    const src = kind === "pd" ? pds[id] : kind === "yuna" ? sim.yuna : kind === "nora" ? sim.nora : npc[id];
    const e = {P, id, kind, src, h:(P.info.build && P.info.build.h) || 1, pi:null, pj:null, mvT:0, y:0, cup:false, tick:0};
    if(kind === "npc" || kind === "fc") P.tag.style.display = "none";
    if(P.tablet) P.tablet.visible = false;
    S.ppl.push(e); addProps(e);
  });
}
/* 소품: 같은 상자·원통·공 도형을 늘리고 줄여서 씀 (그리기 호출 3번) */
function addProps(e){
  const {P, src} = e, p = P.p, vis = f => () => p.root.visible && f();
  const part = (parent, g, col, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0, f = () => true) => { const o = new T.Object3D(); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.scale.set(sx, sy, sz); parent.add(o); K.part(o, g, col, vis(f)); return o; };
  const hand = p.arms[1].el;
  if(src.look && src.look.style === "cap"){ part(p.head, UH, "#E8A04A", 0, 0.205, -0.005, 0.47, 0.47, 0.47, -0.3); part(p.head, UB, "#E8A04A", 0, 0.24, 0.2, 0.3, 0.022, 0.2, 0.14); }
  const act = src.act0 || src.act;
  if(act === "tongs"){ part(hand, UB, "#B8BEC4", 0, -0.3, 0.13, 0.024, 0.024, 0.34); part(hand, UB, "#B8BEC4", 0.025, -0.3, 0.13, 0.024, 0.024, 0.32, 0, 0.12); }
  if(src.apron){ part(p.chest, UB, src.apron, 0, 0.22, 0.142, 0.36, 0.4, 0.02); part(p.hips, UB, src.apron, 0, -0.14, 0.13, 0.36, 0.32, 0.02); }
  if(src.hsik || act === "cup") e.cupO = part(hand, UC, "#F4F1EA", 0, -0.31, 0.03, 0.075, 0.1, 0.075, 0, 0, 0, () => e.cup);
  if(act === "guitar"){ const gtr = new T.Object3D(); gtr.position.set(0.04, 0.02, 0.21); gtr.rotation.set(-0.2, 0, 0.95); p.chest.add(gtr);
    part(gtr, US, "#C98A55", 0, 0, 0, 0.3, 0.38, 0.1); part(gtr, US, "#3A2A22", 0, 0.03, 0.05, 0.08, 0.08, 0.02); part(gtr, UB, "#5A3A2C", 0, 0.42, 0, 0.055, 0.52, 0.03); part(gtr, UB, "#3A2A22", 0, 0.7, 0, 0.08, 0.1, 0.035); }
  if(act === "book"){ const bk = new T.Object3D(); bk.position.set(0, 0.3, 0.3); bk.rotation.x = -0.95; p.chest.add(bk);
    part(bk, UB, src.book || "#C0504A", 0, 0, 0, 0.32, 0.024, 0.23); part(bk, UB, "#FFFFFF", 0, 0.014, 0, 0.29, 0.01, 0.21); }
  if(act === "water"){ part(hand, UB, "#4DAA97", 0, -0.36, 0.08, 0.2, 0.16, 0.14, 0.3); part(hand, UC, "#4DAA97", 0, -0.4, 0.24, 0.024, 0.22, 0.024, 1.1); }
}
function crossLegs(p, top){ p.hips.position.y = top;
  p.legs.forEach((l, k) => { const s = k ? 1 : -1; l.hip.rotation.set(-Math.PI / 2 + 0.12, 0, s * 0.75); l.knee.rotation.set(0, 0, -s * 2.55); }); }
function lowSeat(p, seatY){ const th = Math.acos(Math.max(0.15, Math.min(1, (seatY - 0.03) / 0.5)));
  p.legs.forEach(l => l.knee.rotation.x = Math.PI / 2 - Math.max(0.25, th)); }
const LIE = (() => { let q = null; return () => { if(q) return q; const a = 0.16, y = new T.Vector3(-Math.cos(a), Math.sin(a), 0), z = new T.Vector3(Math.sin(a), Math.cos(a), 0), x = new T.Vector3().crossVectors(y, z);
  q = new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(x, y, z)); return q; }; })();

function updPeople(sim, now, t, dt){
  const R = K.R, sn = sim.now, slow = (S.tagT = (S.tagT || 0) + dt) > 2;
  if(slow) S.tagT = 0;
  S.fxPeople = [];
  // 혼잣말 말풍선: 전체 보기에선 몇 개만 (폰은 1개) — 대화 말풍선은 늘 다 보임
  let idleLeft = R.layer.classList.contains("far") ? (R.w < 600 ? 1 : 3) : 99;
  for(const e of S.ppl){
    const {P, src, kind} = e, p = P.p, root = p.root;
    let vis = kind === "pd" ? src.flr === "roof" && !src.hide : kind === "yuna" ? sim.yOn : kind === "nora" ? sim.nOn : !sim.night;
    root.visible = vis;
    if(!vis){ e.pi = null; continue; }
    const i = src.i, j = src.j, d = e.pi == null ? 0 : Math.hypot(i - e.pi, j - e.pj), jump = e.pi == null || d > 1.5;
    if(!jump && d > 1e-4){ e.mvT = now + 170; e.dir = Math.atan2(i - e.pi, j - e.pj); }
    e.pi = i; e.pj = j;
    const rest = kind === "pd" && src.sky && src.sky.st === "rest" && !src.path.length ? src.sky.spot : null;
    const lying = rest && rest.pose === "hammock";
    const walking = !lying && (src.pose === "walk" || now < e.mvT);
    // 앉는 자리
    let seat = null;
    if(!walking && src.pose === "sit"){ seat = kind === "pd" ? (rest ? spotSeat(rest) : "ground") : NPC_SEAT[e.id] || "ground"; }
    // 방향
    let want;
    if(kind === "fc" || (rest && rest.futsal) || (kind === "yuna" && src.roofBall && !src.path.length)) want = at2(i, j, sim.ball.i, sim.ball.j);
    else if(rest) want = spotHead(rest, sim, i, j);
    else if(e.id in NPC_HEAD) want = NPC_HEAD[e.id];
    else if(e.id === "r_b1" || e.id === "r_b2") want = at2(i, j, TABLE_BQ[0], TABLE_BQ[1]);
    else if(e.id === "r_kid" || e.id === "r_mom") want = at2(i, j, POND.ci, POND.cj);
    else if(e.id === "d_a" || e.id === "d_b"){ const a = sim.npc.find(q => q.id === "d_a"), st = a.route[a.ri] || {}; want = st.tease ? at2(i, j, 24.4, 3.5) : src.z < 0 ? Q : st.front ? 0 : Q; }
    else if(kind === "yuna" && src.goal && src.goal.who) want = at2(i, j, src.goal.who.i, src.goal.who.j);
    else want = src.front || (src.face || 1) > 0 ? Q : -3 * Q;
    const mate = sim.partner(src); let turnHead = 0;
    if(mate && mate !== src && !walking){ const a = at2(i, j, mate.i, mate.j); if(seat){ let da = a - want; da = Math.atan2(Math.sin(da), Math.cos(da)); turnHead = Math.max(-0.9, Math.min(0.9, da)); } else want = a; }
    if(walking && e.dir != null) want = e.dir;
    if(jump){ P.heading = want; } else K.turnTo(P, want, dt, walking ? 10 : 5);
    // 높이
    let y = onDeck(i, j) ? hz(1.8) : 0;
    const st = seat && SEATS[seat];
    if(st && st.cross != null) y = st.cross;
    if(seat === "swing" || seat === "rock" || seat === "bag") y = 0;
    e.y = jump ? y : e.y + (y - e.y) * Math.min(1, dt * 12);
    // 말
    const spk = sim.say(src);
    if(spk) K.say(e.id, spk, 450);
    else if(!K.reduce && idleLeft > 0 && rest && ((sn / 1000 + src.phase * 9) % 26) < 6){ idleLeft--; K.say(e.id, rest.line, 450); }
    else if(!K.reduce && idleLeft > 0 && kind === "npc" && ((sn / 1000 + src.phase * 11) % 44) < 5){ idleLeft--; K.say(e.id, src.desc, 450); }
    // 자세
    const opt = {ph:P.ph, talk:!!spk, turn:turnHead};
    e.cup = false;
    root.rotation.set(0, P.heading, 0);
    if((kind === "nora" || kind === "yuna") && src.swim && i > POOL.wi + 0.05 && j > POOL.wj + 0.05){   // 수영 (2026-11-22): 물 위로 머리·어깨, 팔 젓기
      K.pose(p, "stand", t, opt);
      if(!K.reduce) p.arms.forEach((a, k) => { a.sh.rotation.set(-0.5 + Math.sin(t * 2.6 + k * Math.PI) * 0.45, 0, (k ? -1 : 1) * 0.55); a.el.rotation.set(-0.4, 0, 0); });
      root.position.set(X(i), hz(POOL.z) - 0.86 * e.h + (K.reduce ? 0 : Math.sin(t * 2 + P.ph) * 0.015), Z(j)); continue;
    }
    if(lying){
      const sw = K.reduce ? 0 : Math.sin(t * 1.3) * 0.07;
      K.pose(p, "stand", t, {ph:P.ph}); p.arms.forEach((a, k) => a.sh.rotation.set(-0.25, 0, (k ? -1 : 1) * 0.12)); p.head.rotation.x = -0.15;
      root.quaternion.copy(LIE()); root.position.set(X(31.95), hz(17) + 0.02, Z(2.3 + sw)); S.fxPeople.push({e, zzz:true}); continue;
    }
    if(walking){ P.step = (P.step || 0) + d * 6.4; K.pose(p, "walk", t, {step:P.step, ph:P.ph}); }
    else if(seat){
      const act = src.act, kindP = act === "book" ? "tablet" : "sit";
      const top = st.top != null ? st.top : 0, seatY = st.cross != null ? 0.12 : (top - y + 0.08) / (0.78 * e.h);
      Object.assign(opt, actOpt(e, src, t, sn));
      K.pose(p, kindP, t, {...opt, seatY});
      if(st.cross != null) crossLegs(p, 0.12); else lowSeat(p, seatY);
      actPost(e, src, t, sn);
    } else {
      Object.assign(opt, actOpt(e, src, t, sn));
      K.pose(p, "stand", t, opt);
      if(src.gk){ p.arms.forEach((a, k) => { a.sh.rotation.z += (k ? -1 : 1) * 0.45; a.sh.rotation.x -= 0.25; }); p.hips.position.y -= 0.05; p.legs.forEach(l => { l.hip.rotation.x = -0.25; l.knee.rotation.x = 0.4; }); }
      const kick = src.lastKick && sn - src.lastKick < 280; if(kick){ const u = Math.sin(Math.PI * (sn - src.lastKick) / 280); p.legs[1].hip.rotation.x = -1.0 * u; p.legs[1].knee.rotation.x = 0.3 * (1 - u); }
      actPost(e, src, t, sn);
    }
    const back = st && seat === "chair" ? 0.07 : 0;
    root.position.set(X(i) - Math.sin(P.heading) * back, e.y, Z(j) - Math.cos(P.heading) * back);
    if(kind === "npc" && (e.id === "d_a" || e.id === "d_b") && walking) S.fxPeople.push({e, heart:e.id === "d_a"});
    // 이름표 점 · 설명
    if(slow || !e.tick){ e.tick = 1;
      if(kind === "pd"){ const stt = sim.status(e.id); P.tag.querySelector("i").style.background = K.ST_COLOR[stt] || K.ST_COLOR.idle;
        P.info.task = rest ? rest.line : src.sky ? (src.sky.st === "back" ? "업무층으로 내려가는 중 🛗" : "옥상 자리 찾아가는 중 🌿") : "옥상 산책 중"; }
      else if(kind === "npc") P.info.task = src.desc;
      else P.info.task = src.desc || src.line || ""; }
  }
}
/* NPC 동작 (2.5D act 그대로: 컵 22% · 먹기 32% · 집게 · 먹이 · 기타 · 책 · 물뿌리개) */
function actOpt(e, src, t, sn){
  const o = {}, act = src.act, f = per => ((t + src.phase * 3) / per) % 1;
  if(src.toastUntil && sn < src.toastUntil){ e.cup = true; return o; }
  if(act === "cup"){ e.cup = true; const v = f(6); if(v < 0.22){ o.sip = true; o.u = Math.sin(Math.PI * v / 0.22); } }
  if(act === "eat"){ const v = f(5); if(v < 0.32){ o.sip = true; o.u = Math.sin(Math.PI * v / 0.32) * 0.85; } }
  return o;
}
function actPost(e, src, t, sn){
  const p = e.P.p, A = p.arms, act = src.act, rd = K.reduce ? 0 : 1;
  if(src.toastUntil && sn < src.toastUntil){ A[1].sh.rotation.set(-2.75, 0, -0.25); A[1].el.rotation.set(-0.25, 0, 0); return; }
  if(act === "tongs"){ A[1].sh.rotation.set(-0.95 + Math.sin(t * 5 + src.phase) * 0.12 * rd, 0, -0.12); A[1].el.rotation.set(-0.55, 0, 0); p.head.rotation.x = 0.25; }
  if(act === "feed"){ A[1].sh.rotation.set(-1.15 + Math.max(0, Math.sin(t * 3.5)) * 0.3 * rd, 0, -0.15); A[1].el.rotation.set(-0.2, 0, 0); p.head.rotation.x = 0.3; }
  if(act === "water"){ A[1].sh.rotation.set(-0.75, 0, -0.12); A[1].el.rotation.set(-0.35, 0, 0); p.head.rotation.x = 0.3; }
  if(act === "guitar"){ const s = Math.sin(t * 12 + src.phase) * rd; A[1].sh.rotation.set(-0.45, 0, -0.2); A[1].el.rotation.set(-1.05 + s * 0.22, 0, 0.35);
    A[0].sh.rotation.set(-1.05, 0, 0.6); A[0].el.rotation.set(-0.55, 0, -0.2); p.head.rotation.x = 0.18; p.head.rotation.z = 0.08; }
}

/* ---------- 매 프레임: 불·물·공·문·빛 ---------- */
function updWorld(sim, now, t, dt){
  const rd = K.reduce ? 0 : 1, Sk = SKY[S.ph], day = S.ph === "day", night = S.ph === "night", tm = now;
  const fl = rd ? 0.86 + 0.14 * Math.sin(tm * 0.013) * Math.sin(tm * 0.0071 + 1) : 1;
  K.R.glowL.intensity = LIGHT[S.ph].fire * fl;
  // 불꽃
  for(let L = 0; L < 3; L++) for(let k = -1; k <= 1; k++){ const n = L * 3 + k + 1, ph = tm * 0.012 * rd + k * 2.1 + L, hs = [1.0, 0.78, 0.5][L], hw = [7, 5.4, 3.6][L] / 39.6;
    const hgt = hz(rd ? (17 + Math.sin(ph) * 4 + Math.sin(ph * 2.3) * 2) * hs * (k ? 0.75 : 1) : 20 * hs) * 1.25, a = k * 2.094 + L * 0.7, r = k ? 0.12 * (1 - L * 0.3) : 0;
    setI(S.flame, n, X(FIRE[0]) + Math.cos(a) * r, hz(10.4), Z(FIRE[1]) + Math.sin(a) * r, Math.sin(ph * 1.3) * 0.12 * rd, 0, Math.cos(ph * 1.1) * 0.1 * rd, hw * (k ? 0.85 : 1), hgt, hw * (k ? 0.85 : 1)); }
  S.flame.instanceMatrix.needsUpdate = true;
  // 연기
  for(let k = 0; k < 7; k++){ const u = rd ? (tm * 0.00022 + k / 7) % 1 : k / 7, s = 0.05 + u * 0.13 * (1 - u * 0.4) * (u > 0.85 ? (1 - u) / 0.15 : 1);
    setI(S.smoke, k, X(GRILL[0]) + Math.sin(u * 5 + k) * 0.12 + u * 0.3, hz(20 + u * 64), Z(GRILL[1]) - u * 0.2, 0, 0, 0, s, s, s); }
  S.smoke.instanceMatrix.needsUpdate = true;
  // 잉어 · 물결 · 냇물
  const BX = S.box;
  for(let k = 0; k < 5; k++){ const s = 0.32 + (k % 3) * 0.17, dir = k % 2 ? -1 : 1, a = t * 0.25 * dir * (1 + k * 0.15) * rd + k * 1.3;
    const [i, j] = pondPt(a, s), [i2, j2] = pondPt(a + dir * 0.05, s), h = Math.atan2(X(i2) - X(i), Z(j2) - Z(j)), wig = Math.sin(t * 6 + k) * 0.25 * rd;
    setI(S.koi, k, X(i), 0.016, Z(j), 0, h, 0, 0.07, 0.035, 0.2);
    setI(BX, 34 + k, X(i) - Math.sin(h) * 0.12, 0.016, Z(j) - Math.cos(h) * 0.12, 0, h + wig, 0, 0.09, 0.008, 0.06); }
  S.koi.instanceMatrix.needsUpdate = true;
  const rc = new T.Color();
  [[26.0, 15.0], [27.2, 15.5], [26.5, 15.85]].forEach(([i, j], k) => { const u = rd ? (t * 0.4 + k * 0.33) % 1 : 0.5, r = 0.08 + u * 0.26;
    setI(S.rip, k, X(i), 0.02, Z(j), 0, 0, 0, r, 1, r); S.rip.setColorAt(k, rc.setScalar((1 - u) * 0.35)); });
  { const su = sim ? (sim.now - sim.splash) / 1600 : 9; for(let k = 0; k < 3; k++){ const v = su - k * 0.18;
    if(v <= 0 || v >= 1){ S.rip.setMatrixAt(3 + k, ZM); continue; } const r = 0.12 + v * 0.9; setI(S.rip, 3 + k, X(SPLASH[0]), hz(POOL.z) + 0.02, Z(SPLASH[1]), 0, 0, 0, r, 1, r); S.rip.setColorAt(3 + k, rc.setScalar((1 - v) * 0.8)); } }
  if(S.water){ S.water.material.uniforms.uT.value = rd ? tm * 0.001 : 0; }
  S.rip.instanceMatrix.needsUpdate = true; S.rip.instanceColor.needsUpdate = true;
  S.flowTex.offset.x -= dt * 0.6 * rd;
  // 공
  const b = sim ? sim.ball : {i:7, j:FS.gj, z:0, rot:0, vi:0, vj:0};
  S.ball.position.set(X(b.i), 0.105 + 0.012 + hz(b.z), Z(b.j)); S.ball.rotation.set(b.rot * Math.cos(Math.atan2(b.vj, b.vi)), 0, -b.rot * Math.sin(Math.atan2(b.vj, b.vi)));
  // 엘리베이터 문
  S.yd = (S.yd || 0) + ((K.yuNear?.(13.45, 17.1, 1.5) ? 1 : 0) - (S.yd || 0)) * 0.12;
  const door = Math.max(sim ? sim.door : 0, S.yd), gap = 0.5 * Math.min(1, door) * 0.94, lw = 0.5 - gap, fx = X(12.934) + 0.03;
  setI(BX, 0, fx, hz(28), Z(16.6 + lw / 2), 0, 0, 0, 0.02, hz(56), Math.max(0.001, lw));
  setI(BX, 1, fx, hz(28), Z(17.6 - lw / 2), 0, 0, 0, 0.02, hz(56), Math.max(0.001, lw));
  const txt = door > 0.5 ? "▼ 도착" : "5F";
  if(txt !== S.indTxt){ S.indTxt = txt; const x = S.indCv.getContext("2d"); x.clearRect(0, 0, 128, 42); x.font = `800 ${txt.length > 2 ? 22 : 26}px "Inter Tight","IBM Plex Sans KR",system-ui,sans-serif`; x.textAlign = "center"; x.textBaseline = "middle";
    x.shadowColor = "#FF9A2E"; x.shadowBlur = 8; x.fillStyle = "#FFB547"; x.fillText(txt, 64, 22); x.fillText(txt, 64, 22); S.indTex.needsUpdate = true; }
  // 빨래 (아래 끝이 바람에 흔들림)
  [32.3, 32.95, 33.6, 34.2].forEach((i, k) => { const a = Math.sin(tm * 0.002 * rd + k) * 0.12, hh = hz(13);
    setI(BX, 2 + k, X(i), hz(24) - Math.cos(a) * hh / 2, Z(11.1) + Math.sin(a) * hh / 2, a, 0, 0, 0.5, hh, 0.012); });
  // 실외기 날개
  [6.0, 7.6].forEach((i, q) => { for(let k = 0; k < 3; k++){ const a = tm * 0.02 * rd + k * 2.094 + q; setI(BX, 6 + q * 3 + k, X(i + 0.7) + Math.cos(a) * 0.065, hz(6) + Math.sin(a) * 0.065, Z(19.65) + 0.022, 0, 0, a, 0.12, 0.04, 0.006); } });
  // 건배 꽃가루
  const cu = sim ? (sim.now - sim.hsikFx) / 2600 : 2;
  for(let k = 0; k < 14; k++){ if(cu < 0 || cu > 1 || !rd){ BX.setMatrixAt(12 + k, ZM); continue; }
    setI(BX, 12 + k, X(22.8 + (k % 7) * 0.55), hz(30 + rHash(k, 2, 3) * 14 + cu * 16), Z(3.5) + (k % 2 ? 0.15 : -0.15), cu * 9 + k, cu * 5, 0, 0.075 * (1 - cu * 0.6), 0.075 * (1 - cu * 0.6), 0.006); }
  // 나비 (낮·노을) · 반딧불이 (밤)
  for(let k = 0; k < 4; k++){ const u = tm * 0.0006 * rd + k * 1.9, i = FLY[k][0] + Math.sin(u) * 1.1, j = FLY[k][1] + Math.cos(u * 1.3) * 0.8, zz = hz(14 + Math.sin(u * 2.2) * 6);
    const hd = Math.atan2(Math.cos(u) * 1.1, -Math.sin(u * 1.3) * 1.04), fl2 = Math.abs(Math.sin(tm * 0.02 * rd + k)) * 1.2 + 0.2;
    [-1, 1].forEach((s, w) => { if(night){ BX.setMatrixAt(26 + k * 2 + w, ZM); return; }
      O3.position.set(X(i), zz, Z(j)); O3.rotation.set(0, hd, 0); O3.updateMatrix(); const M = O3.matrix.clone();
      O3.position.set(s * 0.035, 0, 0); O3.rotation.set(0, 0, s * fl2); O3.scale.set(0.07, 0.004, 0.06); O3.updateMatrix();
      const m2 = new T.Matrix4().multiplyMatrices(M, new T.Matrix4().makeRotationZ(s * fl2)).multiply(new T.Matrix4().makeTranslation(s * 0.035, 0, 0)).multiply(new T.Matrix4().makeScale(0.07, 0.004, 0.06));
      BX.setMatrixAt(26 + k * 2 + w, m2); }); }
  BX.instanceMatrix.needsUpdate = true;
  // 빛 점
  const G = S.glow, col = G.pts.geometry.attributes.color, pos = G.pts.geometry.attributes.position, sg = Sk.glow;
  G.P.forEach((q, n) => { let r = 0, g = 0, bb = 0;
    if(q.kind === "bulb"){ const tw = 0.65 + 0.35 * Math.sin(tm * 0.004 * rd + q.k); if(!day){ const a = 0.55 * tw * sg; r = a; g = a * 0.84; bb = a * 0.55; } }
    else if(q.kind === "lamp"){ if(!day){ const a = 0.5 * sg; r = a; g = a * 0.89; bb = a * 0.63; } }
    else if(q.kind === "flood"){ if(!day){ const a = 0.75 * sg; r = a; g = a; bb = a * 0.88; } }
    else if(q.kind === "door"){ if(!day){ const a = 0.45 * sg; r = a; g = a * 0.93; bb = a * 0.75; } }
    else if(q.kind === "pool"){ if(!day){ const a = 0.6 * sg; r = a * 0.35; g = a * 0.88; bb = a; } }
    else if(q.kind === "grill"){ if(!day){ const a = 0.55 * sg; r = a; g = a * 0.55; bb = a * 0.24; } }
    else if(q.kind === "fireAir"){ const a = 0.55 * sg * fl + 0.08; r = a; g = a * 0.59; bb = a * 0.27; }
    else if(q.kind === "ember"){ const u = (tm * 0.00045 * rd + q.k / 9) % 1, a = (1 - u) * 0.95; pos.setXYZ(n, X(FIRE[0]) + Math.sin(u * 7 + q.k) * 0.12, hz(12 + u * 52), Z(FIRE[1]) + Math.cos(u * 5 + q.k * 2) * 0.12); r = a; g = a * (170 - u * 80) / 255; bb = a * 0.27; }
    else if(q.kind === "fly"){ const u = tm * 0.0006 * rd + q.k * 1.9; pos.setXYZ(n, X(FLY[q.k][0] + Math.sin(u) * 1.1), hz(14 + Math.sin(u * 2.2) * 6), Z(FLY[q.k][1] + Math.cos(u * 1.3) * 0.8));
      if(night){ const a = (0.5 + 0.5 * Math.sin(tm * 0.004 + q.k * 2)) * 0.8; r = a * 0.86; g = a; bb = a * 0.55; } }
    col.setXYZ(n, r, g, bb); });
  col.needsUpdate = true; pos.needsUpdate = true;
  G.pts.material.uniforms.uScale.value = K.R.h * K.R.renderer.getPixelRatio() / (2 * Math.tan(K.R.camera.fov * Math.PI / 360));
  // 바닥 빛 웅덩이
  { const a = S.pools.geometry.attributes.color, v = [[(day ? 0.1 : 0.42) * sg * fl, [1, 0.51, 0.2]], [day ? 0 : 0.22 * sg, [0.94, 1, 0.9]], [day ? 0 : 0.35 * sg, [1, 0.55, 0.24]], [day ? 0 : 0.26 * sg, [0.35, 0.85, 1]]];
    v.forEach(([s, c], q) => { for(let k = q * 4; k < q * 4 + 4; k++) a.setXYZ(k, c[0] * s, c[1] * s, c[2] * s); }); a.needsUpdate = true; }
}
/* 하트 · 해먹 z (화면 위 글자) */
function updFx(now, t){
  const R = K.R, v = new T.Vector3(), put = (el, x, y, op) => { el.style.opacity = op; el.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%)`; };
  const hearts = S.fxPeople.find(f => f.heart), z = S.fxPeople.find(f => f.zzz), show = !R.layer.classList.contains("far") || true;
  S.fx.hearts.forEach((el, k) => { if(!hearts){ el.style.opacity = 0; return; } const e = hearts.e, b = S.ppl.find(q => q.id === "d_b");
    v.copy(e.P.p.root.position); if(b) v.lerp(b.P.p.root.position, 0.5); v.y += 1.25; v.project(R.camera);
    const u = ((t * 0.6 + k / 3) % 1); put(el, (v.x * 0.5 + 0.5) * R.w + Math.sin(u * 6 + k) * 6, (-v.y * 0.5 + 0.5) * R.h - u * 26, K.reduce ? 0.8 : (1 - u)); });
  S.fx.z.forEach((el, k) => { if(!z){ el.style.opacity = 0; return; } z.e.P.p.head.getWorldPosition(v); v.y += 0.25; v.project(R.camera);
    const u = ((t * 0.35 + k / 3) % 1); put(el, (v.x * 0.5 + 0.5) * R.w + u * 16, (-v.y * 0.5 + 0.5) * R.h - u * 24, K.reduce ? 0.7 : (1 - u) * 0.9); el.style.fontSize = (10 + u * 6) + "px"; });
}

/* ---------- 층 정의 ---------- */
const ROOF_ELEV = {id:"roof_elev", at:[12.95, 17.1, 40], emo:["🛗", "⬇️"], lines:["▼"], elev:"down"};
const def = {
  id:"roof",
  outline:[[0,0],[WI,0],[WI,CH],[GI,CH],[GI,GJ],[0,GJ]],
  ext:[0, 0, WI, GJ],
  backWalls:false,
  zones:{
    futsal:{name:"풋살장", color:"#4FA866", rect:[0.3,0.3,13.8,9.6], label:[7.0,0.5,"top"]},
    fire:{name:"모닥불·회식", color:"#E8A04A", rect:[14.6,1.6,28.4,12.4], label:[21.5,2.3,"top"]},
    bbq:{name:"바베큐·수영장", color:"#C0504A", rect:[14.8,12.6,29.4,20.0], label:[22.0,20.0,"bottom"]},
  },
  lamps:[[21.5, 6.85, 2.1], [7.0, 4.8, 3.4], [GRILL[0], GRILL[1], 1.0], [31.0, 7.2, 1.5], [13.7, 16.6, 2.0], [22.9, 14.4, 1.4], [9.8, 12.1, 1.3]],
  glow:{at:[FIRE[0], FIRE[1], 0.75], color:0xFF8A3D},
  eggs:[ROOF_ELEV],   // build 에서 타워 R_EGGS(풀 · 선베드) 를 붙임. 옥상 엘리베이터는 내려가는 문만
  allPts(V3){ const o = []; this.outline.forEach(([i, j]) => { o.push(V3(i, 0, j), V3(i, 1.9, j)); if(i >= GI - 0.01 || j >= CH - 0.01) o.push(V3(i, -1.1, j)); }); return o; },
  get people(){ return S ? S.defs : []; },
  paintFloor(c){ paintRoof(c); },
  build(KIT){
    K = KIT; T = KIT.THREE; S = {defs:[], ph:"day", skyAt:0};
    shared();
    const sim = KIT.R.opts.sim?.() || null; S.sim0 = sim;
    if(sim) S.defs = makeDefs(sim);
    def.eggs = [...(sim?.eggs || []).map(src => ({id:src.id, emo:src.emo, lines:src.lines, get at(){ return src.at; }, say:(k, g, line) => KIT.R.opts.sim?.()?.egg(src.id) || line})), ROOF_ELEV];
    // 풀잎 자리: 바닥 그림에서 잔디색인 곳만 (냇가·길·연못 위엔 안 남)
    { const cv = document.createElement("canvas"), F = 16; cv.width = WI * F; cv.height = GJ * F; const c = cv.getContext("2d"); c.setTransform(F, 0, 0, F, 0, 0); paintRoof(c);
      const img = c.getImageData(0, 0, cv.width, cv.height).data, ok = (i, j) => { const x = Math.round(i * F), y = Math.round(j * F); if(x < 0 || y < 0 || x >= cv.width || y >= cv.height) return false; const k = (y * cv.width + x) * 4; return Math.abs(img[k] - 141) + Math.abs(img[k + 1] - 190) + Math.abs(img[k + 2] - 114) < 34; };
      S.tufts = [];
      ROOF_GRASS.forEach(([a, b, cc, d], n) => { for(let i = a + 0.3; i < cc - 0.2; i += 0.62) for(let j = b + 0.3; j < d - 0.2; j += 0.62){ const h = rHash(n, i, j); if(h < 0.55) continue;
        const ti = i + h * 0.3, tj = j - h * 0.2; if(ok(ti, tj) && ok(ti + 0.08, tj) && ok(ti - 0.08, tj) && ok(ti, tj + 0.08) && ok(ti, tj - 0.08)) S.tufts.push({i:ti, j:tj, h, n}); } }); }
    buildStatic(); buildBackdrop(); buildNets(); buildDynamic(); buildPool();
    // 받침 그림자는 옥상에선 끔 (건물 벽이 아래로 이어짐)
    KIT.R.scene.children.forEach(o => { if(o.isMesh && o.geometry?.parameters?.width === 52) o.visible = false; });
    // 하늘 그림판 (WebGL 뒤)
    S.sky = document.createElement("canvas"); Object.assign(S.sky.style, {position:"absolute", inset:"0", width:"100%", height:"100%", zIndex:"-1", pointerEvents:"none"}); KIT.R.layer.prepend(S.sky);
    S.ph0 = sim ? sim.ph : "day";
  },
  init(KIT){
    const sim = S.sim0; if(sim) setupPeople(sim); else S.ppl = [];
    const mk = (txt, c) => { const el = document.createElement("span"); el.textContent = txt; Object.assign(el.style, {position:"absolute", left:"0", top:"0", pointerEvents:"none", fontWeight:"800", color:c, opacity:"0", textShadow:"0 1px 2px rgba(0,0,0,.25)", font:"800 13px system-ui"}); KIT.R.layer.append(el); return el; };
    S.fx = {hearts:[0, 1, 2].map(() => mk("♥", "#FF7FA8")), z:[0, 1, 2].map(() => mk("z", "#FFFFFF"))};
    S.fxPeople = [];
    applyPhase(S.ph0);
  },
  // 화면이 어두운 테마여도 옥상은 실제 시간 빛 그대로 (2.5D와 같음): 밝은 색으로 되돌리고 시간대 빛을 다시 입힘
  theme(KIT){ if(!S || !S.nets) return; KIT.R.baked.forEach(m => { const u = m.geometry.userData, a = m.geometry.attributes.color; if(u.L){ a.array.set(u.L); a.needsUpdate = true; } }); applyPhase(S.ph); },
  tick(KIT, now, t, dt){
    const sim = KIT.R.opts.sim?.() || null;
    const ph = sim ? sim.ph : "day"; if(ph !== S.ph) applyPhase(ph);
    if(sim && S.ppl.length) updPeople(sim, now, t, dt);
    updWorld(sim, now, t, dt);
    updFx(now, t);
    // 하늘은 카메라가 움직이거나 0.1초마다
    const cm = KIT.R.camera.matrixWorld.elements, key = cm[12].toFixed(2) + cm[13].toFixed(2) + cm[14].toFixed(2) + cm[8].toFixed(3) + KIT.R.w + "x" + KIT.R.h;
    if(key !== S.skyKey || now - S.skyAt > (KIT.reduce ? 5000 : 100)){ S.skyKey = key; S.skyAt = now; paintSky(now); }
  },
};
export default def;
