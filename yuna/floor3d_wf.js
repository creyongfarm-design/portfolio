/* 크레용타워 3F 복지층 3D (2026-11-22). 2.5D 복지층(크레용사무실.html wfFloor·wfWalls·wfFurniture·wfLamps) 칸 좌표·색 그대로.
   사람·대화·냥이·유나·노라·엘리베이터 문·이스터에그는 타워의 2D 시뮬레이션(F3_SIM.wf)을 그대로 따라감 */
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const PI = Math.PI, GJ = 20, GI = 29, WI = 36, CH = 14.5;
const WF_Z = {
  meal:   {name:"구내식당", color:"#E8A04A", rect:[0,0,11.2,7],    label:[5.6,0,"top"]},
  cinema: {name:"시사실",   color:"#B8364A", rect:[11.2,0,19.6,7], label:[15.4,0,"top"]},
  game:   {name:"게임룸",   color:"#8E7BEF", rect:[19.6,0,GI,7],   label:[24.3,0,"top"]},
  garden: {name:"하늘정원", color:"#5FA582", rect:[GI,0,WI,9],     label:[WI,3.5,"side"]},
  church: {name:"교회",     color:"#C9A23F", rect:[0,9,11,GJ],     label:[5.5,GJ,"bottom"]},
  kids:   {name:"어린이집", color:"#F08BA8", rect:[GI,9,WI,CH],    label:[32.5,CH,"bottom"]},
  gym:    {name:"헬스장",   color:"#3A8A78", rect:[16,9,23,GJ],    label:[19.5,GJ,"bottom"]},
  lib:    {name:"도서실",   color:"#6F82CF", rect:[23,9,GI,GJ],    label:[26.0,GJ,"bottom"]},
};
const RB = ["#F4A7B9","#F9C99B","#F6E39A","#A8DCC8","#A9CBEA","#C8B4D0"];
const BOOK = ["#8B5A3C","#3A8A78","#E8A04A","#6F82CF","#C8B4D0","#E06A55","#2A2A28","#F2E3C6","#4DAA97"];
const DOMES = [[3.0,3.2],[8.0,3.2],[3.0,5.9],[8.0,5.9],[12.9,4.4],[15.6,5.1],[18.2,3.6],[13.5,14.8],[19.6,13.0],[19.6,17.2],[26.2,18.5]];
const CHAND = [[4.7,12.0],[4.7,17.0],[8.3,12.0],[8.3,17.0]], CLOUD = [[31.0,11.6],[34.4,12.8]];
const PERG = [[30.2,1.8],[34.6,1.8],[30.2,6.2],[34.6,6.2]];
const WIRES = [[[30.2,1.8],[34.6,6.2]],[[34.6,1.8],[30.2,6.2]],[[30.2,1.8],[30.2,6.2]],[[34.6,1.8],[34.6,6.2]]];
const ARC = [[25.0,"#E0453A","PIXEL","w_pixel"],[26.0,"#3A6FD9","BLAST","w_arcade"],[27.0,"#E8B830","RACER","w_racer"]];
const LANCET = [[17.2,0.6,42,72,["#E8607F","#FFD45E","#F29A4A","#E8607F"],0],[14.5,0.8,36,80,["#E8607F","#F29A4A","#FFD45E","#4DAA97","#5B8FD9","#9B7BC9"],1],[11.8,0.6,42,72,["#5B8FD9","#4DAA97","#9B7BC9","#5B8FD9"],0]];
const rnd = k => { const v = Math.sin(k * 12.9898) * 43758.5453; return v - Math.floor(v); };

/* 사람 방향 (2.5D 그림은 앞·뒤 모습만 있어서 3D에선 자리마다 바라보는 쪽을 정함. 0 = +j, PI = −j, PI/2 = +i) */
const HEAD = {chef:0, m1:0, m2:0, m4:0, m3:PI, m5:PI, m6:PI, c1:PI, c2:PI, c3:PI, c4:PI, c5:PI,
  pp1:PI/2, pp2:-PI/2, g1:PI, g2:PI, arc:PI, b1:0, b2:0, pastor:PI/2, ch1:PI/2, ch2:PI/2, ch3:PI/2, ch4:PI/2,
  piano:-PI/2, kneel:-PI/2, pray1:-PI/2, pray2:-PI/2, pray3:-PI/2, pkid:-PI/2, mom:-PI/2, newbie:-PI/2, rnd:-PI/2, elder:-PI/2,
  usher:PI/4, teacher:-PI/2, k2:PI/4, k3:0, k4:PI, run:0, lift:0, yoga1:0, yoga2:0, trainer:-PI/2, r1:0, r2:0, stu:PI};
const ROUTE_HEAD = {m7:[PI,null,null,0,null,null,PI], gard:[PI,PI], lib:[PI,PI,PI], pvisit:[0,null,null,null,-PI/2,null,null,null], k1:[null,null,0,null,0,null]};
const SEAT = {m1:12, m2:12, m3:12, m4:12, m5:12, m6:12, m7:12, c1:9, c2:9, c3:9, c4:9, c5:9, g1:13, g2:13, b1:10, b2:10, piano:10,
  pray1:11, pray2:11, pray3:11, newbie:11, rnd:11, elder:11, mom:11, pkid:11, r1:11.5, r2:11.5, stu:14};
const PRAY = new Set(["kneel","pray1","pray2","pray3","pkid","mom","newbie","rnd","elder"]);

let K = null, W = null;
const sim = () => { try { return K?.R?.opts?.sim?.() || null; } catch(e){ return null; } };
const kday = () => new Date(new Date().toLocaleString("en-US", {timeZone:"Asia/Seoul"}));

/* ---------- 작은 도구 ---------- */
const X = i => K.X(i), Z = j => K.Z(j), hz = p => K.hz(p);
const D = (l, d) => [l, d];
function B(i, j, w, d, h, col, z0 = 0, o = {}){ return K.B(i, j, w, d, h, col, z0, o); }
function rod(a, b, r, col, cls = "s", seg = 6){
  const A = new THREE.Vector3(X(a[0]), hz(a[2]), Z(a[1])), C = new THREE.Vector3(X(b[0]), hz(b[2]), Z(b[1])), len = A.distanceTo(C); if(len < 1e-4) return;
  const o = K.sm(K.cyl(r, r, len, seg), col, (A.x + C.x) / 2, (A.y + C.y) / 2, (A.z + C.z) / 2, null, cls); o.lookAt(C); o.rotateX(PI / 2);
}
const ball = (i, j, zp, r, col, cls = "m", seg = 10) => K.sm(K.sph(r, seg, Math.max(6, seg * 0.75 | 0)), col, X(i), hz(zp), Z(j), null, cls);
const disc = (i, j, r, zp, hp, col, cls = "m", seg = 24) => K.sm(K.cyl(r, r, Math.max(0.006, hz(hp)), seg), col, X(i), hz(zp) + Math.max(0.006, hz(hp)) / 2, Z(j), null, cls);
const LG = [];
const myGeo = g => { LG.push(g); return g; };
const ceil = 3.7;

/* 여러 도형을 정점 색으로 한 덩어리로 (움직이는 물건용. 낮·밤 색 두 벌) */
function Merge(){
  const parts = [], m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  return {
    add(g, col, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1){ e.set(rx, ry, rz); q.setFromEuler(e); m4.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(sx, sy, sz)); parts.push({g, c:K.cp(col), m:m4.clone()}); },
    geo(){
      const gs = parts.map(p => { let g = p.g.index ? p.g.toNonIndexed() : p.g.clone(); Object.keys(g.attributes).forEach(k => { if(k !== "position" && k !== "normal") g.deleteAttribute(k); });
        g.applyMatrix4(p.m); const n = g.attributes.position.count, a = new Float32Array(n * 3), b = new Float32Array(n * 3), cl = new THREE.Color(p.c[0]), cd = new THREE.Color(p.c[1]);
        for(let k = 0; k < n; k++){ a.set([cl.r, cl.g, cl.b], k * 3); b.set([cd.r, cd.g, cd.b], k * 3); }
        g.setAttribute("color", new THREE.BufferAttribute(a, 3)); g.userData.d = b; return g; });
      const out = mergeGeometries(gs, false), L = out.attributes.color.array.slice(), Dk = new Float32Array(L.length); let off = 0;
      gs.forEach(g => { Dk.set(g.userData.d, off); off += g.userData.d.length; g.dispose(); }); out.userData = {L, D:Dk}; return out;
    }};
}
function dynMesh(g, mat){ const m = new THREE.Mesh(g, mat); m.castShadow = true; m.receiveShadow = true; K.R.scene.add(m); W.recolor.push(m); return m; }

/* ---------- 움직이는 그림판 (영화관 화면 · TV · 오락기 화면 · 표시등 …) 한 장 ---------- */
const DW = 1024, DH = 512;
function dAlloc(w, h){ const A = W.dA; w = Math.ceil(w); h = Math.ceil(h); if(A.x + w + 2 > DW){ A.x = 2; A.y += A.row + 3; A.row = 0; } const r = {x:A.x, y:A.y, w, h}; A.x += w + 3; A.row = Math.max(A.row, h); if(A.y + h > DH) console.warn("wf dyn full"); return r; }
function dplane(wpx, hpx, ww, wh, axis, i, j, zc, draw, off = 0.035){
  const r = dAlloc(wpx, hpx); W.dyn.push({r, draw});
  const g = new THREE.PlaneGeometry(ww, wh), uv = g.attributes.uv;
  for(let k = 0; k < uv.count; k++){ const u = uv.getX(k), v = uv.getY(k); uv.setXY(k, (r.x + u * r.w) / DW, 1 - (r.y + (1 - v) * r.h) / DH); }
  if(axis === "j") g.rotateY(PI / 2); else if(axis === "f") g.rotateX(-PI / 2);
  g.translate(...(axis === "i" ? [X(i), zc, Z(j) + off] : axis === "j" ? [X(i) + off, zc, Z(j)] : [X(i), zc, Z(j)]));
  W.dgeo.push(g);
}

/* ---------- 바닥 그림 (wfFloor 그대로, 1칸 = 1) ---------- */
function paintFloor(c, dark){
  const v = (l, d) => dark ? d : l, FS = K.FS;
  const rect = (i0, j0, i1, j1, col) => { c.fillStyle = col; c.fillRect(i0, j0, i1 - i0, j1 - j0); };
  const line = (i0, j0, i1, j1, col, w = 1) => { c.strokeStyle = col; c.lineWidth = w / 28; c.beginPath(); c.moveTo(i0, j0); c.lineTo(i1, j1); c.stroke(); };
  const dot = (i, j, r, col) => { c.fillStyle = col; c.beginPath(); c.arc(i, j, r, 0, 7); c.fill(); };
  const glow = (i, j, r, c0) => { const g = c.createRadialGradient(i, j, 0, i, j, r); g.addColorStop(0, c0); g.addColorStop(1, c0.length === 9 ? c0.slice(0, 7) + "00" : "rgba(255,240,210,0)"); c.fillStyle = g; c.beginPath(); c.arc(i, j, r, 0, 7); c.fill(); };
  const pool = (i, j, r) => glow(i, j, r, dark ? "rgba(255,200,130,.20)" : "rgba(255,252,240,.62)");
  const text = (t, i, j, size, col, w = 800, fam = K.SIGN, gl) => { c.save(); c.scale(1 / FS, 1 / FS); c.font = `${w} ${size / 31.3 * FS}px ${fam}`; c.textAlign = "center"; c.textBaseline = "middle"; if(gl){ c.shadowColor = gl; c.shadowBlur = 12; } c.fillStyle = col; c.fillText(t, i * FS, j * FS); c.restore(); };
  const cor = v("#EEE8DE", "#36312B");
  rect(0, 0, WI, CH, cor); rect(0, CH, GI, GJ, cor);
  for(let i = 1.6; i < GI; i += 1.6) line(i, 7, i, 9, K.shade(cor, -0.05));
  // 구내식당 체크 타일
  rect(0, 0, 11.2, 7, v("#F3E7D6", "#3A3129"));
  for(let a = 0; a < 16; a++) for(let b = 0; b < 10; b++) if((a + b) % 2) rect(a * 0.7, b * 0.7, a * 0.7 + 0.7, Math.min(7, b * 0.7 + 0.7), v("#EADAC2", "#342B23"));
  // 시사실 카펫 + 통로
  rect(11.2, 0, 19.6, 7, v("#5A3442", "#2A1820"));
  for(let a = 0; a < 12; a++) for(let b = 0; b < 10; b++) if((a + b) % 2) rect(11.2 + a * 0.7, b * 0.7, 11.9 + a * 0.7, Math.min(7, b * 0.7 + 0.7), v("#62394A", "#2F1C25"));
  rect(15.05, 0.9, 15.75, 7, v("#B8364A", "#6A1E2A")); rect(11.6, 0.1, 19.2, 0.9, v("#2A1A20", "#140C10"));
  for(let j = 1.4; j < 7; j += 0.9) [15.05, 15.75].forEach(i => dot(i, j, 0.045, "#FFD45E"));
  // 게임룸 네온 카펫
  rect(19.6, 0, GI, 7, v("#3E3762", "#221E36"));
  for(let a = 0; a < 7; a++) for(let b = 0; b < 5; b++){ const i = 20.2 + a * 1.3, j = 0.7 + b * 1.35; c.fillStyle = ["#FF6BA8","#5FD3E8","#FFD45E"][(a + b) % 3] + (dark ? "55" : "77");
    c.beginPath(); c.moveTo(i, j - 0.12); c.lineTo(i + 0.12, j); c.lineTo(i, j + 0.12); c.lineTo(i - 0.12, j); c.fill(); }
  rect(20.8, 1.0, 23.6, 3.1, v("#584C8C", "#2E2850")); rect(20.95, 1.15, 23.45, 2.95, v("#6A5DA6", "#383062"));
  [[22.2,1.6,70,"#FF5FA8"],[26.4,1.4,56,"#5FD3E8"],[26.3,4.3,50,"#FFD45E"]].forEach(([i,j,r,col]) => glow(i, j, r / 39.6, col + (dark ? "44" : "38")));
  // 하늘정원 데크 · 잔디 · 디딤돌
  rect(GI, 0, WI, 9, v("#CFA77D", "#5A4634"));
  for(let k = 1, j = 0.35; j < 9; j += 0.35, k++) line(GI, j, WI, j, v("rgba(110,70,30,.16)", "rgba(0,0,0,.25)"), 0.8);
  for(let k = 0, j = 0; j < 9; j += 0.35, k++) for(let i = GI + (k % 3) * 0.9 + 0.5; i < WI; i += 2.7) line(i, j, i, j + 0.35, v("rgba(110,70,30,.16)", "rgba(0,0,0,.25)"), 0.8);
  rect(30.4, 2.4, 34.6, 5.9, v("#9CCB7A", "#3E5E3A")); rect(30.4, 5.75, 34.6, 5.9, v("#86B866", "#34502F"));
  for(let k = 0; k < 46; k++){ const i = 30.55 + rnd(k) * 3.9, j = 2.55 + rnd(k + 99) * 3.2, col = v("rgba(60,110,50,.45)", "rgba(140,200,120,.25)"); line(i, j, i - 0.05, j - 0.12, col, 0.9); line(i, j, i + 0.05, j - 0.1, col, 0.9); }
  [[29.7,7.9],[30.5,7.3],[31.2,6.7]].forEach(([i,j]) => dot(i, j, 0.22, v("#E6DED2", "#6E665C")));
  // 교회 마루 · 스테인드글라스 빛 · 통로 카펫
  rect(0, 9, 11, GJ, v("#EFE3CF", "#3A3229"));
  for(let j = 9.4; j < GJ; j += 0.4) line(0, j, 11, j, v("rgba(120,80,40,.12)", "rgba(0,0,0,.22)"), 0.8);
  for(let k = 0, j = 9; j < GJ; j += 0.4, k++) for(let i = (k % 3) * 0.9 + 0.5; i < 11; i += 2.7) line(i, j, i, j + 0.4, v("rgba(120,80,40,.12)", "rgba(0,0,0,.22)"), 0.8);
  [[3.9,17.2,"#E8607F"],[4.3,14.5,"#FFD45E"],[3.9,11.8,"#5B8FD9"],[5.2,15.5,"#9B7BC9"],[5.2,13.5,"#4DAA97"]].forEach(([i,j,col]) => glow(i, j, 1.16, col + (dark ? "40" : "48")));
  rect(2.75, 14.1, 11, 14.9, v("#9C3D4A", "#5A2830")); line(2.75, 14.17, 11, 14.17, "#D9B45A", 0.9); line(2.75, 14.83, 11, 14.83, "#D9B45A", 0.9);
  text("환영합니다", 9.4, 14.5, 6.5, v("rgba(233,200,120,.95)", "rgba(217,180,90,.7)"), 800, K.FONT);
  // 엘리베이터 홀 테라조 + 둥근 무늬
  rect(11, 9, 16, GJ, v("#EFEAE2", "#2F2C28"));
  [11.6, 12.7, 13.8, 14.9].forEach(i => line(i, 9, i, GJ, v("rgba(0,0,0,.045)", "rgba(255,255,255,.04)")));
  for(let j = 10.1; j < GJ; j += 1.1) line(11, j, 16, j, v("rgba(0,0,0,.045)", "rgba(255,255,255,.04)"));
  dot(13.5, 15.2, 1.45, v("#E2D6C4", "#3A352F")); dot(13.5, 15.2, 1.3, v("#F7F2EA", "#2F2C28"));
  text("복지층", 13.5, 15.2, 15, v("rgba(139,90,60,.32)", "rgba(255,230,200,.18)"), 800, K.FONT);
  // 헬스장 고무 바닥 · 요가 매트
  rect(16, 9, 23, GJ, v("#5A5E63", "#26292C"));
  for(let k = 0; k < 260; k++){ c.fillStyle = k % 3 === 0 ? "rgba(232,160,74,.35)" : "rgba(255,255,255,.14)"; c.fillRect(16.05 + rnd(k + 7) * 6.9, 9.05 + rnd(k + 300) * 10.9, 0.04, 0.04); }
  [[16.8,"#4DAA97"],[18.1,"#C8B4D0"],[19.4,"#E8A04A"]].forEach(([i,col]) => { rect(i, 15.0, i + 0.8, 16.8, dark ? K.shade(col, -0.4) : col); rect(i, 15.0, i + 0.8, 15.12, K.shade(col, dark ? -0.55 : -0.15)); });
  text("FITNESS", 19.8, 18.9, 15, v("rgba(255,255,255,.2)", "rgba(255,255,255,.08)"));
  // 도서실 카펫 · 러그
  rect(23, 9, GI, GJ, v("#B9C7B0", "#2C3830")); rect(24.4, 12.8, 28.4, 17.0, v("#E9DCC3", "#4A4034")); rect(24.6, 13.0, 28.2, 16.8, v("#D9C7A6", "#55493B"));
  text("QUIET PLEASE", 26.4, 16.2, 7, v("rgba(90,70,40,.3)", "rgba(255,240,210,.14)"));
  // 어린이집 퍼즐 매트 · 무지개 러그
  const KM = dark ? ["#4A3640","#4A4230","#2E4038","#2E3A48"] : ["#FBD3DC","#FFE9A8","#CDEBDD","#CFE3F5"];
  for(let a = 0; a < 7; a++) for(let b = 0; b < 6; b++) rect(GI + a, 9 + b, GI + a + 1, Math.min(CH, 10 + b), KM[(a + 2 * b) % 4]);
  for(let i = 30; i < WI; i++) line(i, 9, i, CH, v("rgba(255,255,255,.7)", "rgba(0,0,0,.2)"), 0.8);
  for(let j = 10; j < CH; j++) line(GI, j, WI, j, v("rgba(255,255,255,.7)", "rgba(0,0,0,.2)"), 0.8);
  c.save(); if(dark) c.globalAlpha = 0.5; RB.forEach((col, k) => dot(33.2, 12.6, 1.3 - 0.17 * k, col)); dot(33.2, 12.6, 0.26, "#FFFFFF"); c.restore();
  rect(34.08, 9.58, 35.62, 11.12, v("#5E9BEA", "#2E3A48")); dot(29.9, 13.25, 0.38, v("#CDEBDD", "#2E4038"));
  // 복도 글씨
  text("TAKE A BREAK", 13.0, 8.0, 22, v("rgba(42,42,40,.07)", "rgba(255,255,255,.06)"));
  // 조명 아래 빛 웅덩이
  DOMES.forEach(([i,j]) => pool(i, j, 1.212)); CLOUD.forEach(([i,j]) => pool(i, j, 1.162)); CHAND.forEach(([i,j]) => pool(i, j, 1.414));
}

/* ---------- 건물 껍데기 · 벽 ---------- */
function buildShell(){
  const t = 0.25, WH = 112, slab = 12;
  B(0, GJ, GI, 0.02, slab, "slab", -slab, {r:0}); B(GI, CH, 0.02, GJ - CH, slab, K.sh("slab", -0.14), -slab, {r:0});
  B(GI, CH, WI - GI, 0.02, slab, "slab", -slab, {r:0}); B(WI, 0, 0.02, CH, slab, K.sh("slab", -0.14), -slab, {r:0});
  K.sm(K.rbox(WI + 0.25, hz(slab), CH + 0.25, 0), "slab", X(WI / 2 - 0.125), -hz(slab) / 2 - 0.002, Z(CH / 2 - 0.125));
  K.sm(K.rbox(GI + 0.25, hz(slab), GJ - CH, 0), "slab", X(GI / 2 - 0.125), -hz(slab) / 2 - 0.002, Z((CH + GJ) / 2));
  [[0,11.2,"wall-r"],[11.2,19.6,D("#4A2E38","#26171E")],[19.6,GI,D("#3A3358","#1C1A2C")]].forEach(([a,b,col]) => B(a, -t, b - a, t, WH, col, 0, {r:0}));
  [[0,7,"wall-l"],[7,9,K.sh("wall-l",-0.03)],[9,GJ,D("#F5EDE0","#3A332B")]].forEach(([a,b,col]) => B(-t, a, t, b - a, WH, col, 0, {r:0}));
  B(-t, -t, t, t, WH, "wall-r", 0, {r:0});
  B(-t - 0.02, -t - 0.02, GI + t + 0.02, t + 0.04, 3, "wall-top", WH, {r:0}); B(-t - 0.02, -t, t + 0.04, GJ + t, 3, "wall-top", WH, {r:0});
  B(GI - 0.02, -t, 0.02, t, WH, K.sh("wall-top", -0.2), 0, {r:0}); B(-t, GJ - 0.02, t, 0.02, WH, K.sh("wall-top", -0.1), 0, {r:0});
  K.faceJ(0, GI, 0.0, 0, 4, K.sh("wall-top", -0.1), "m", 0.03); K.faceI(0.0, 0, GJ, 0, 4, K.sh("wall-top", -0.1), "m", 0.03);
  // 바닥 안내판 (복도 왼벽)
  K.faceI(0.0, 7.2, 8.8, 30, 88, D("#2A2A28","#1E1E1C"), "m", 0.03);
  K.wtext("FLOOR GUIDE", 0.03, 8.0, 82, "j", 4.4, "#FFFFFF", null, 800);
  K.wtext("복지층", 0.03, 8.0, 76.5, "j", 3.6, "#E8A04A", null, 700, K.FONT);
  ["meal","cinema","game","garden","church","kids","gym","lib"].forEach((z, k) => { const zz = 70 - 5 * k;
    K.faceI(0.03, 8.42, 8.58, zz - 1.6, zz + 1.6, WF_Z[z].color, "glow", 0.006); K.wtext(WF_Z[z].name, 0.035, 7.95, zz, "j", 3.4, "#E9E4DA", null, 600, K.FONT); });
}
/* i = 0 벽 창문 (구내식당) */
function winI(a, b, z0, z1){
  const k = 120, ww = b - a, wh = hz(z1 - z0);
  K.decal(ww * k, wh * k, (c, Wc, Hc, dark) => {
    const g = c.createLinearGradient(0, 0, 0, Hc); g.addColorStop(0, dark ? "#16243A" : "#BFDDEE"); g.addColorStop(1, dark ? "#2C4462" : "#EAF4F7"); c.fillStyle = g; c.fillRect(0, 0, Wc, Hc);
    c.fillStyle = dark ? "#22344C" : "#CFE2EA";
    [[0.15,40],[0.5,58],[0.9,34],[1.3,66],[1.7,46],[2.0,30]].forEach(([o, h]) => { const j0 = a + o, x0 = (b - j0 - 0.3) / ww * Wc, y0 = Hc - h * 0.62 / (z1 - z0) * Hc; c.fillRect(x0, y0, 0.3 / ww * Wc, Hc - y0); });
    const s = c.createLinearGradient(0, 0, Wc, Hc); s.addColorStop(0, "rgba(255,255,255,.22)"); s.addColorStop(0.4, "rgba(255,255,255,0)"); c.fillStyle = s; c.fillRect(0, 0, Wc, Hc);
  }, ww, wh, "j", 0.0, (a + b) / 2, hz((z0 + z1) / 2));
  B(0, a - 0.04, 0.06, ww + 0.08, 3, "frame", z1, {r:0}); B(0, a - 0.04, 0.06, ww + 0.08, 3, "frame", z0 - 3, {r:0});
  B(0, a - 0.04, 0.06, 0.06, z1 - z0, "frame", z0, {r:0}); B(0, b - 0.02, 0.06, 0.06, z1 - z0, "frame", z0, {r:0});
  B(0, (a + b) / 2 - 0.025, 0.05, 0.05, z1 - z0, "frame", z0, {r:0}); B(0, a, 0.05, ww, 1.5, "frame", 73.4, {r:0});
  B(0, a - 0.08, 0.16, ww + 0.16, 3, K.sh("wall-top", -0.05), z0 - 3, {r:0});
}
/* 교회 뾰족 아치 스테인드글라스 (wfLancet) */
function lancet([jc, R, z0, zr, cols, main]){
  const Rz = R * 31.3, zb = z0 - 2, zt = zr + Rz + 5, ww = 2 * (R + 0.12), k = 150, wh = hz(zt - zb);
  W.lanc.push({k, ww, wh, jc, zc:hz((zt + zb) / 2), draw:(c, Wc, Hc, dark) => {
    const x = j => (jc + ww / 2 - j) / ww * Wc, y = z => (zt - z) / (zt - zb) * Hc;
    const arch = (pj, pz, z00) => { c.beginPath(); c.moveTo(x(jc + R + pj), y(z00)); c.lineTo(x(jc + R + pj), y(zr)); c.ellipse(x(jc), y(zr), (R + pj) / ww * Wc, (Rz + pz) / (zt - zb) * Hc, 0, PI, 2 * PI, false); c.lineTo(x(jc - R - pj), y(z00)); c.closePath(); };   // x()는 j가 클수록 왼쪽
    arch(0.1, 3.13, z0 - 2); c.fillStyle = dark ? "#5A4230" : "#7A5A3C"; c.fill();
    c.save(); arch(0, 0, z0); c.clip(); const n = cols.length, pw = 2 * R / n;
    cols.forEach((col, q) => { c.fillStyle = col + (dark ? "E6" : "C8"); c.fillRect(x(jc - R + (q + 1) * pw), 0, pw / ww * Wc + 1, y(z0)); });
    c.strokeStyle = "rgba(60,40,30,.55)"; c.lineWidth = 0.9 / 31.3 * Wc / ww;
    for(let z = z0 + 9; z < zr + Rz; z += 9){ c.beginPath(); c.moveTo(0, y(z)); c.lineTo(Wc, y(z)); c.stroke(); }
    for(let q = 1; q < n; q++){ c.beginPath(); c.moveTo(x(jc - R + q * pw), 0); c.lineTo(x(jc - R + q * pw), Hc); c.stroke(); }
    if(main){ c.shadowColor = "#FFE7A8"; c.shadowBlur = 9 / 31.3 * k; c.fillStyle = "#FFF6DC";
      c.fillRect(x(jc + 0.09), y(zr + Rz - 7), 0.18 / ww * Wc, y(z0 + 8) - y(zr + Rz - 7)); c.fillRect(x(jc + 0.4), y(zr + 4), 0.8 / ww * Wc, y(zr - 4) - y(zr + 4)); c.shadowBlur = 0; }
    else { const rz = zr + 0.2 * Rz; c.fillStyle = "rgba(255,248,225,.6)"; c.beginPath(); c.arc(x(jc), y(rz), 7 / 31.3 / ww * Wc, 0, 7); c.fill(); c.fillStyle = cols[1]; c.beginPath(); c.arc(x(jc), y(rz), 3.4 / 31.3 / ww * Wc, 0, 7); c.fill(); }
    c.restore(); arch(0, 0, z0); c.strokeStyle = dark ? "#2E241C" : "#5A4230"; c.lineWidth = 1.6 / 31.3 * Wc / ww; c.stroke();
  }});
  K.faceI(0.0, jc - R - 0.14, jc + R + 0.14, z0 - 5, z0 - 2, D("#B08A5A","#4A3A2C"), "m", 0.06);
}

/* 스테인드글라스는 빛을 받는 벽 그림 대신 스스로 빛나는 판으로 (밤 달빛 그림자가 유리에 줄무늬로 지던 것 막음) */
function buildLancets(){
  const L = W.lanc, H = Math.ceil(Math.max(...L.map(o => o.wh * o.k))), Wt = L.reduce((a, o) => a + Math.ceil(o.ww * o.k) + 2, 0);
  const cv = document.createElement("canvas"); cv.width = Wt; cv.height = H; const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  let x0 = 0; const gs = L.map(o => { const w = Math.ceil(o.ww * o.k), h = Math.ceil(o.wh * o.k); o.r = {x:x0, w, h}; x0 += w + 2;
    const g = new THREE.PlaneGeometry(o.ww, o.wh), uv = g.attributes.uv;
    for(let q = 0; q < uv.count; q++) uv.setXY(q, (o.r.x + uv.getX(q) * w) / Wt, 1 - (1 - uv.getY(q)) * h / H);
    g.rotateY(PI / 2); g.translate(X(0) + 0.027, o.zc, Z(o.jc)); return g; });
  W.lancDraw = dark => { const c = cv.getContext("2d"); c.clearRect(0, 0, Wt, H); L.forEach(o => { c.save(); c.translate(o.r.x, 0); o.draw(c, o.r.w, o.r.h, dark); c.restore(); }); tex.needsUpdate = true; };
  W.lancDraw(!!K.R.dark);
  const m = new THREE.Mesh(mergeGeometries(gs, false), K.cutaway(new THREE.MeshBasicMaterial({map:tex, transparent:true, toneMapped:false, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-2})));
  gs.forEach(g => g.dispose()); m.renderOrder = 2; K.R.scene.add(m);
}

/* ---------- 구역별 가구 ---------- */
function buildMeal(){
  winI(0.8, 3.1, 26, 96); winI(3.9, 6.2, 26, 96);
  K.wtext("CAFETERIA", 3.0, 0, 96, "i", 13, D("#C97A2A","#FFD49A"), "amber", 800);
  K.wtext("구내식당 · 아침 · 점심 · 저녁", 3.0, 0, 83, "i", 6, "ink-2", null, 600, K.FONT);
  // 메뉴 칠판
  K.faceJ(5.2, 9.6, 0.0, 44, 92, D("#8B5A3C","#6B4A34"), "m", 0.03); K.faceJ(5.3, 9.5, 0.03, 46, 90, "#2E3A33", "m", 0.01);
  const S = sim(), menu = S?.menu || ["오늘의 메뉴", ""], d = kday();
  const tx = (t, z, s, col, w, fam = K.FONT) => K.wtext(t, 7.4, 0.045, z, "i", s, col, null, w, fam);
  tx({아침:"BREAKFAST", 저녁:"DINNER"}[menu[3]] || "TODAY'S LUNCH", 84.5, 4.2, "#F4E9D6", 800, K.SIGN); tx(`${d.getMonth() + 1}/${d.getDate()} ${"일월화수목금토"[d.getDay()]}`, 79.2, 3.4, "rgba(244,233,214,.7)", 600);
  tx(menu[0], 70.5, 8.5, "#FFD27A", 800); tx(menu[1], 61.5, 4.4, "#F4E9D6", 600); tx("잡곡밥 · 김치 · 숭늉", 55.5, 3.6, "rgba(244,233,214,.75)", 600); tx(menu[2] || "점심 11:30 – 13:30", 49.5, 3.2, "#9EE3D3", 700);
  // 배식대 (스테인리스) · 국통 · 반찬통
  const steel = D("#C9CDD2","#6A6E74");
  B(0.8, 0.7, 6.2, 0.7, 20, steel, 0, {cls:"s", r:0.02}); K.faceJ(0.8, 7.0, 1.4, 6, 9, "amber", "m", 0.006);
  K.faceJ(0.8, 7.0, 1.37, 22, 34, D("#DCF0FF","#96B4D2"), "glass", 0.02); B(0.8, 1.36, 6.2, 0.05, 1.2, "metal", 34, {cls:"s", r:0});
  [0.85, 3.9, 6.95].forEach(i => B(i - 0.02, 1.36, 0.04, 0.05, 12, "metal", 22, {cls:"s", r:0}));
  [[1.3,"#FFFFFF"],[2.3,"#E2603C"],[3.3,"#F2C94C"],[4.3,"#7FB069"],[5.2,"#A0522D"],[6.2,"#C0392B"]].forEach(([i,col]) => { B(i - 0.36, 0.8, 0.72, 0.5, 1.2, "#9EA4AB", 20, {cls:"s", r:0.02}); B(i - 0.31, 0.85, 0.62, 0.4, 0.5, col, 21, {r:0.02}); });
  [1.15, 1.3, 1.45].forEach(i => ball(i, 1.05, 22, 0.03, "#EDE7DA"));
  // 식판 더미 · 정수기 · 반납대
  B(0.15, 0.75, 0.6, 0.6, 20, steel, 0, {cls:"s", r:0.02}); for(let k = 0; k < 5; k++) B(0.2, 0.8, 0.5, 0.5, 1.2, k % 2 ? "#E4E0D8" : "#D2CCC2", 20 + 1.4 * k, {r:0.02});
  B(8.0, 0.2, 0.6, 0.5, 40, D("#F4F2EE","#B5B0A8"), 0, {r:0.05}); K.faceJ(8.08, 8.52, 0.7, 26, 36, "#3A5870", "s", 0.006);
  ball(8.3, 0.71, 31, 0.035, "#5FD3E8", "glow"); B(8.12, 0.45, 0.36, 0.3, 1, "#2A2A28", 14, {r:0});
  B(10.2, 0.2, 0.8, 1.0, 30, D("#8C8A83","#4A4844"), 0, {r:0.02}); [8, 14, 20, 26].forEach(z => K.faceJ(10.25, 10.95, 1.2, z, z + 1.6, "#2A2A28", "m", 0.006));
  B(10.25, 0.3, 0.7, 0.8, 1.2, "#E4E0D8", 30, {r:0.02}); B(10.25, 0.3, 0.7, 0.8, 1.2, "#D2CCC2", 31.6, {r:0.02});
  // 긴 식탁 4개 + 둥근 의자
  [[1.0,2.8],[6.0,2.8],[1.0,5.5],[6.0,5.5]].forEach(([ti,tj]) => {
    B(ti, tj, 4, 0.8, 3, D("#E8D3AE","#6A5640"), 13, {r:0.03});
    [[ti + 0.12, tj + 0.1],[ti + 0.12, tj + 0.62],[ti + 3.8, tj + 0.1],[ti + 3.8, tj + 0.62]].forEach(([a,b]) => B(a, b, 0.08, 0.08, 13, "metal", 0, {cls:"s"}));
    for(let k = 0; k < 4; k++) [tj - 0.45, tj + 1.25].forEach(sj => { const si = ti + 0.5 + k; B(si - 0.04, sj - 0.04, 0.08, 0.08, 10, "metal", 0, {cls:"s"}); disc(si, sj, 0.2, 10, 2, k % 2 ? "#4DAA97" : "#E8A04A"); });
  });
  // 식당 | 시사실 화단 칸막이
  planter(11.0, 1.8, 6.4, 11.17); planter(19.35, 1.2, 6.4, 19.52);
}
function planter(i, j0, j1, fi){
  B(i, j0, 0.35, j1 - j0, 22, D("#8B6B4E","#4A3A2C"), 0, {r:0.03});
  for(let j = j0 + 0.15; j < j1; j += 0.3) ball(fi, j, 24.5, 0.15, ((j * 10 | 0) % 2) ? K.sh("plant", 0.16) : "plant", "m", 10);
}
function buildCinema(){
  K.faceJ(11.6, 19.2, 0.0, 18, 96, "#141014", "m", 0.02);
  // 커튼 (주름) · 금색 장식
  [[11.25,12.0],[18.8,19.55]].forEach(([a,b]) => { for(let i = a, k = 0; i < b - 0.05; i += 0.15, k++) B(i, 0.02, 0.15, 0.09, 88, k % 2 ? D("#8E1F31","#6A1624") : D("#9E2436","#7A1A2A"), 12, {r:0.05});
    B(a - 0.02, 0.0, b - a + 0.04, 0.13, 4, "#C9A23F", 96, {cls:"s", r:0.02}); });
  K.wtext("CREYONG CINEMA", 15.4, 0.03, 104, "i", 8, "#FFE6C2", "#F2A64A", 800);
  K.faceJ(18.9, 19.5, 0.03, 103, 108, "#2E9E5A", "glow", 0.01); K.wtext("EXIT", 19.2, 0.045, 105.5, "i", 2.4, "#FFFFFF", null, 800);
  // 좌석 3줄 × 8 (화면 쪽 −j를 봄)
  const seat = D("#B8364A","#7A2230");
  [3.0, 4.3, 5.6].forEach(sj => [12.2,12.9,13.6,14.3,16.5,17.2,17.9,18.6].forEach(si => {
    B(si - 0.3, sj - 0.26, 0.6, 0.52, 3, K.sh(seat, -0.35), 0, {r:0.02}); B(si - 0.28, sj - 0.24, 0.56, 0.48, 3.5, seat, 3, {r:0.06, seg:2});
    [si - 0.31, si + 0.25].forEach(a => B(a, sj - 0.2, 0.06, 0.46, 11, K.sh(seat, -0.25), 0, {r:0.02}));
    B(si - 0.28, sj + 0.2, 0.56, 0.14, 22, K.sh(seat, 0.08), 3, {r:0.06, seg:2}); }));
  // 영사기 · 필름 릴
  B(15.3, 6.5, 0.2, 0.2, 14, "#3A3A3E", 0, {cls:"s"}); B(15.05, 6.3, 0.7, 0.6, 6, "#2A2A2E", 14, {cls:"s", r:0.04}); B(15.25, 6.22, 0.3, 0.1, 3, "#141414", 15.5, {cls:"s"});
  ball(15.4, 6.2, 17, 0.045, "#FFF3C2", "glow");
  [15.15, 15.65].forEach(i => { const o = K.sm(K.cyl(0.135, 0.135, 0.03, 18), "#2A2A2E", X(i), hz(24), Z(6.6), null, "s"); o.rotation.z = PI / 2; });
  // 팝콘 카트
  B(11.45, 6.15, 0.65, 0.6, 14, "#C0392B", 0, {r:0.03}); B(11.5, 6.2, 0.55, 0.5, 12, D("#FFFAE6","#FFF0C8"), 14, {cls:"glass"});
  for(let k = 0; k < 7; k++) ball(11.55 + ((k * 37) % 5) * 0.1, 6.25 + ((k * 13) % 4) * 0.1, 16 + (k % 3) * 2, 0.055, "#FFF1C2");
  B(11.45, 6.15, 0.65, 0.6, 2, "amber", 26, {r:0.03}); K.wtext("POPCORN", 11.78, 6.76, 8, "i", 2.2, "#FFFFFF", null, 800);
  // 슬레이트 테이블
  B(18.75, 6.35, 0.5, 0.4, 12, D("#8B6B4E","#4A3A2C"), 0, {r:0.02}); K.faceJ(18.82, 19.18, 6.53, 12, 16.5, "#2A2A28", "m", 0.03);
  [18.9, 19.02, 19.14].forEach(i => K.faceJ(i - 0.006, i + 0.006, 6.56, 13, 16, "#FFFFFF", "m", 0.004));
}
function buildGame(){
  K.wtext("GAME ROOM", 24.3, 0, 100, "i", 13, "#FFD1E8", "#FF5FA8", 800);
  [[24.9,"#FF5FA8"],[28.5,"#5FD3E8"]].forEach(([i,col]) => B(i, 0.0, 0.25, 0.06, 50, col, 30, {cls:"glow", r:0.03}));
  // 벽 TV · 장식장 · 게임기
  K.faceJ(20.5, 23.9, 0.0, 31, 79, "#111114", "s", 0.06);
  B(20.8, 0.1, 2.8, 0.5, 9, "#2A2A2E", 0, {cls:"s", r:0.02}); B(21.9, 0.2, 0.4, 0.28, 3, "#F2F2F2", 9, {cls:"s", r:0.02}); K.faceJ(21.95, 22.25, 0.48, 10.4, 11.2, "#5FD3E8", "glow", 0.005);
  // 소파 (TV 쪽 −j를 봄)
  const sofa = D("#5C4FA0","#3A3270");
  B(20.6, 3.3, 3.0, 0.6, 9, sofa, 0, {r:0.06, seg:2}); [20.7, 22.15].forEach(i => B(i, 3.32, 1.35, 0.56, 4, K.sh(sofa, 0.14), 9, {r:0.06, seg:2}));
  B(20.6, 3.85, 3.0, 0.25, 24, K.sh(sofa, -0.1), 0, {r:0.08, seg:2}); [20.45, 23.6].forEach(i => B(i, 3.3, 0.18, 0.8, 15, K.sh(sofa, -0.18), 0, {r:0.06}));
  B(21.0, 3.72, 0.36, 0.14, 8, "#FF8CC0", 13, {r:0.05});
  // 오락기 3대
  ARC.forEach(([i, col, name], k) => {
    B(i, 0.15, 0.8, 0.7, 62, col, 0, {r:0.04}); B(i, 0.15, 0.8, 0.7, 2, "#1E1E1E", 62, {r:0.02});
    K.faceJ(i + 0.08, i + 0.72, 0.85, 34, 53, "#111114", "s", 0.01);
    K.faceJ(i + 0.05, i + 0.75, 0.85, 55, 61, K.shade(col, 0.45), "glow", 0.01); K.wtext(name, i + 0.4, 0.86, 58, "i", 3, "#2A2A28", null, 900);
    B(i, 0.85, 0.8, 0.22, 3, K.sh(col, -0.18), 30, {r:0.02});
    rod([i + 0.25, 0.96, 33], [i + 0.25, 0.96, 38], 0.012, "#2A2A28"); ball(i + 0.25, 0.96, 38.5, 0.055, "#E0453A", "s");
    [[0.5,"#FFD45E"],[0.62,"#5FD3E8"]].forEach(([o,c2]) => disc(i + o, 0.96, 0.04, 33, 0.8, c2, "s", 12));
  });
  // 탁구대
  B(25.0, 3.6, 2.6, 1.4, 2, "#2F7D5B", 14, {r:0.02});
  [[25.15,3.75],[25.15,4.75],[27.45,3.75],[27.45,4.75]].forEach(([a,b]) => B(a, b, 0.08, 0.08, 14, "metal", 0, {cls:"s"}));
  B(25.0, 4.29, 2.6, 0.02, 0.15, "#FFFFFF", 16, {r:0}); [3.62, 4.96].forEach(j => B(25.0, j, 2.6, 0.03, 0.15, "#FFFFFF", 16, {r:0})); [25.02, 27.55].forEach(i => B(i, 3.6, 0.03, 1.4, 0.15, "#FFFFFF", 16, {r:0}));
  K.faceI(26.29, 3.5, 5.1, 16, 20.5, "#FFFFFF", "glass", 0.012); B(26.28, 3.5, 0.03, 1.6, 0.5, "#FFFFFF", 20.2, {r:0});
  [3.45, 5.1].forEach(j => B(26.27, j, 0.06, 0.06, 6, "metal", 15, {cls:"s"}));
  // 인형뽑기
  const cc = "#F4A7B9";
  B(28.1, 1.4, 0.7, 0.7, 30, cc, 0, {r:0.03}); B(28.12, 1.42, 0.66, 0.66, 1.5, D("#FFFFFF","#E6DCEB"), 30, {r:0.01});
  [[28.25,1.6,"#FFE066"],[28.5,1.55,"#70C1B3"],[28.62,1.85,"#5E9BEA"],[28.3,1.9,"#F7A1C4"],[28.48,1.8,"#FFA552"]].forEach(([i,j,col]) => { ball(i, j, 34.5, 0.1, col); ball(i - 0.06, j, 37.5, 0.04, col); ball(i + 0.06, j, 37.5, 0.04, col); });
  const gl = D("#DCF0FF","#96B4D2");
  K.faceJ(28.1, 28.8, 2.08, 31.5, 64, gl, "glass", 0.02); K.faceJ(28.1, 28.8, 1.4, 31.5, 64, gl, "glass", 0.02); K.faceI(28.78, 1.4, 2.1, 31.5, 64, gl, "glass", 0.02); K.faceI(28.1, 1.4, 2.1, 31.5, 64, gl, "glass", 0.02);
  [[28.1,1.4],[28.77,1.4],[28.1,2.07],[28.77,2.07]].forEach(([a,b]) => B(a, b, 0.03, 0.03, 34, "frame", 30, {cls:"s", r:0}));
  B(28.08, 1.38, 0.74, 0.74, 8, cc, 64, {r:0.03}); K.wtext("CRANE", 28.45, 2.125, 68, "i", 3, "#FFFFFF", null, 900);
  // 빈백 (분홍은 고정, 보라는 눌리면 찌그러짐 → 움직이는 쪽)
  K.sm(K.sph(0.42, 18, 12), K.shade("#FF8CC0", -0.18), X(22.9), 0.17, Z(6.0)).scale.set(1, 0.48, 1); K.sm(K.sph(0.34, 16, 10), "#FF8CC0", X(22.9), 0.3, Z(5.97)).scale.set(1, 0.45, 1);
  // 정원 쪽 유리벽
  K.faceI(28.95, 0, 7, 0, 4, D("#CFC6B8","#3A3530"), "m", 0.05); K.faceI(28.96, 0, 7, 4, 74, D("#CDDEEE","#96AAD2"), "glass", 0.03);
  B(28.95, 0, 0.07, 7, 1.4, "frame", 73, {cls:"s", r:0}); for(let j = 0; j < 7.01; j += 0.7) B(28.96, Math.min(j, 6.95), 0.05, 0.05, 70, "frame", 4, {cls:"s", r:0});
}
function tree(i, j, s){
  B(i - 0.07, j - 0.07, 0.14, 0.14, 34 * s, D("#7A5A3C","#5A4230"), 0, {r:0.03});
  [[0,-4,16],[-11,4,12],[11,5,12],[-5,-14,11],[6,-12,11],[0,6,12]].forEach(([dx, dy, r], k) => { const u = dx * s / 31.3 * 0.707, dz = -dy * s;
    ball(i + u, j - u + (k % 3 - 1) * 0.08 * s, 48 * s + dz, r * s / 31.3 * 1.05, k % 2 ? K.sh("plant", 0.18) : "plant", "m", 12); });
}
function buildGarden(){
  // 난간 (뒤 · 오른쪽)
  const rg = D("#C8E1F0","#96B4D2");
  K.faceJ(GI, WI, 0.0, 0, 34, rg, "glass", 0.03); B(GI, -0.02, WI - GI, 0.06, 1.5, "frame", 33, {cls:"s", r:0});
  for(let i = GI + 1; i < WI; i++) B(i - 0.02, -0.02, 0.04, 0.05, 34, "frame", 0, {cls:"s", r:0});
  K.faceI(WI - 0.03, 0, 9, 0, 34, rg, "glass", 0.03); B(WI - 0.05, 0, 0.06, 9, 1.5, "frame", 33, {cls:"s", r:0});
  for(let j = 0; j < 9.01; j++) B(WI - 0.04, Math.min(j, 8.96), 0.05, 0.04, 34, "frame", 0, {cls:"s", r:0});
  // 꽃밭
  B(30.4, 0.25, 3.8, 0.6, 12, D("#8B6B4E","#4A3A2C"), 0, {r:0.03}); B(30.44, 0.29, 3.72, 0.52, 0.4, D("#6E5A44","#3A2E24"), 12, {r:0});
  for(let i = 30.55; i < 34.15; i += 0.22){ ball(i, 0.55, 13.5, 0.075, "plant", "m", 8); ball(i, 0.52, 16.5, 0.065, ["#F4A7B9","#FFE066","#FF8C69","#C8B4D0"][(i * 9 | 0) % 4], "m", 8); }
  tree(29.7, 0.8, 1); tree(35.4, 1.0, 1.1); tree(35.45, 4.0, 0.9);
  // 퍼걸러
  const pw = D("#E9DCC6","#7A6A58");
  PERG.forEach(([i,j]) => B(i - 0.07, j - 0.07, 0.14, 0.14, 88, pw, 0, {r:0.03}));
  [1.8, 6.2].forEach(j => B(30.0, j - 0.06, 4.8, 0.12, 4, pw, 88, {r:0.02}));
  for(let k = 0; k < 9; k++) B(30.15 + 0.55 * k, 1.6, 0.08, 4.8, 3, K.sh(pw, -0.06), 92, {r:0.02});
  // 전구 줄 (전선)
  WIRES.forEach(([a, b]) => { for(let k = 0; k < 14; k++){ const p = q => [a[0] + (b[0] - a[0]) * q / 14, a[1] + (b[1] - a[1]) * q / 14, 86 - Math.sin(PI * q / 14) * 9]; rod(p(k), p(k + 1), 0.006, D("#5A4E42","#B8AE9C"), "s", 4); } });
  // 벤치 · 선베드 · 파라솔 · 표지판
  const bw = D("#B98B55","#6B4A34");
  B(31.2, 4.15, 1.8, 0.12, 22, bw, 8, {r:0.03}); B(31.2, 4.25, 1.8, 0.5, 2.2, bw, 8, {r:0.03});
  [[31.3,4.3],[32.8,4.3],[31.3,4.62],[32.8,4.62]].forEach(([a,b]) => B(a, b, 0.08, 0.08, 8, "metal", 0, {cls:"s"}));
  B(31.9, 4.3, 0.28, 0.12, 6, "#F4A7B9", 10.2, {r:0.04});
  B(33.2, 6.85, 1.6, 0.6, 7, D("#FFFFFF","#CFC9C0"), 0, {r:0.03}); B(33.25, 6.9, 1.4, 0.5, 0.8, D("#FFE9A8","#6E5A34"), 7, {r:0.02});
  [33.45, 33.75, 34.05, 34.35].forEach(i => B(i, 6.9, 0.12, 0.5, 0.2, D("#E8A04A","#8A6030"), 7.7, {r:0}));
  { const o = K.sm(K.rbox(0.6, 0.05, 0.6, 0.02), D("#F7F2EA","#B9B2A6"), X(34.86), hz(11.6), Z(7.15)); o.rotation.z = 0.52; }
  B(35.42, 6.47, 0.06, 0.06, 66, "metal", 0, {cls:"s"}); B(35.25, 6.3, 0.4, 0.4, 2, "metal", 0, {cls:"s"});
  B(29.75, 8.42, 0.06, 0.06, 30, "#7A5A3C"); B(29.25, 8.4, 1.05, 0.06, 10, bw, 28, {r:0.02});
  K.wtext("SKY GARDEN", 29.775, 8.465, 34.5, "i", 3.6, "#FFFFFF", null, 800); K.wtext("하늘정원", 29.775, 8.465, 30.2, "i", 2.8, "#FFE9C4", null, 700, K.FONT);
}
function buildKids(){
  const fw = D("#FFFFFF","#CFC9C0"), pick = k => D(RB[k % 6], K.shade(RB[k % 6], -0.35));
  // 뒤 낮은 벽 (정원 | 어린이집) + 벽 그림 한 장
  B(GI, 8.88, WI - GI, 0.12, 30, D("#F7C9D6","#5A3A48"), 0, {r:0}); B(GI, 8.88, WI - GI, 0.12, 2.5, D("#FFFFFF","#7A5A68"), 30, {r:0});
  const k = 120, zt = 32;
  K.decal(7 * k, hz(zt) * k, (c, Wc, Hc, dark) => {
    const x = i => (i - GI) / 7 * Wc, y = z => (zt - z) / zt * Hc, u = Wc / 7 / 31.3;   // u = 2.5D 화면 px 하나
    c.fillStyle = dark ? "rgba(255,255,255,.15)" : "rgba(255,255,255,.75)";
    for(let i = 29.3, q = 0; i < WI; i += 0.6, q++){ c.beginPath(); c.arc(x(i), y(q % 2 ? 11 : 6), 2.1 * u, 0, 7); c.fill(); }
    [[30.72,"#FFE066"],[31.12,"#CDEBDD"],[31.52,"#CFE3F5"],[31.92,"#FBD3DC"]].forEach(([i, col], q) => {
      c.fillStyle = "rgba(0,0,0,.08)"; c.fillRect(x(i - 0.02), y(30.5), 0.38 / 7 * Wc, y(20.5) - y(30.5));
      c.fillStyle = "#FFFFFF"; c.fillRect(x(i), y(30.5), 0.34 / 7 * Wc, y(21) - y(30.5));
      c.fillStyle = col; c.fillRect(x(i + 0.03), y(24.5), 0.28 / 7 * Wc, y(22) - y(24.5));
      const mx = x(i + 0.17), my = y(27);
      if(q === 0){ c.fillStyle = "#E06A55"; c.fillRect(mx - 3 * u, my - 1 * u, 6 * u, 4.5 * u); c.fillStyle = "#8B5A3C"; c.beginPath(); c.moveTo(mx - 4 * u, my - 1 * u); c.lineTo(mx, my - 4.5 * u); c.lineTo(mx + 4 * u, my - 1 * u); c.fill(); }
      if(q === 1){ c.fillStyle = "#FFD45E"; c.beginPath(); c.arc(mx, my, 2.6 * u, 0, 7); c.fill(); }
      if(q === 2){ c.strokeStyle = "#2A2A28"; c.lineWidth = 0.8 * u; c.beginPath(); c.arc(mx, my - 2.5 * u, 1.3 * u, 0, 7); c.moveTo(mx, my - 1.2 * u); c.lineTo(mx, my + 1.6 * u); c.moveTo(mx - 1.8 * u, my); c.lineTo(mx + 1.8 * u, my); c.moveTo(mx, my + 1.6 * u); c.lineTo(mx - 1.4 * u, my + 3.4 * u); c.moveTo(mx, my + 1.6 * u); c.lineTo(mx + 1.4 * u, my + 3.4 * u); c.stroke(); }
      if(q === 3){ c.fillStyle = "#E8607F"; c.beginPath(); c.moveTo(mx, my + 2.4 * u); c.bezierCurveTo(mx - 4 * u, my - 0.5 * u, mx - 1.6 * u, my - 3.4 * u, mx, my - 1.2 * u); c.bezierCurveTo(mx + 1.6 * u, my - 3.4 * u, mx + 4 * u, my - 0.5 * u, mx, my + 2.4 * u); c.fill(); }
    });
    c.lineWidth = 3.4 * u; c.lineCap = "round";
    RB.forEach((col, q) => { const r = 22 - 3.4 * q; c.strokeStyle = col; c.beginPath(); for(let a = 0; a <= 24; a++){ const th = PI * a / 24, px = x(33.25 + r * Math.cos(th) / 31.3), py = y(4 + r * Math.sin(th)); a ? c.lineTo(px, py) : c.moveTo(px, py); } c.stroke(); });
    [[-1.1,0.25,0.75],[0,-0.25,1],[1.1,0.15,0.8],[0.5,0.45,0.7],[-0.5,0.5,0.7]].forEach(([dx, dy, r], q) => { const s = 13 * 0.42; c.fillStyle = q < 3 ? "#FFFFFF" : (dark ? "#E9DDF0" : "#F5EEF8"); c.beginPath(); c.arc(x(32.56) + dx * s * u, y(6) + dy * s * u, r * s * u, 0, 7); c.fill(); });
  }, 7, hz(zt), "i", (GI + WI) / 2, 9.0, hz(zt / 2));
  // 간판 '크레용 어린이집'
  [31.5, 34.1].forEach(i => B(i, 8.95, 0.08, 0.06, 8, fw, 32.5, {r:0}));
  B(31.2, 8.93, 3.2, 0.08, 12, D("#FFFFFF","#EDE4EC"), 40, {r:0.02});
  K.faceJ(31.2, 34.4, 9.01, 40, 41.4, "#F08BA8", "m", 0.005); K.faceJ(31.2, 34.4, 9.01, 50.6, 52, "#F08BA8", "m", 0.005);
  [..."크레용 어린이집"].forEach((ch, q) => { if(ch !== " ") K.wtext(ch, 31.505 + 0.37 * q, 9.016, 46, "i", 8, ["#E8607F","#F29A4A","#E8B830","#4DAA97","#5B8FD9","#9B7BC9"][q % 6], null, 800, K.FONT); });
  // 울타리 · 대문
  for(let q = 0, j = 9.2; j < 13.2; j += 0.34, q++){ B(GI, j, 0.1, 0.12, 17, pick(q + 2), 0, {r:0.02}); B(GI - 0.01, j - 0.01, 0.12, 0.14, 1.4, fw, 17, {r:0.02});
    if(j + 0.34 < 13.3) [6, 12].forEach(z => B(GI + 0.03, j + 0.12, 0.04, 0.22, 2, fw, z, {r:0})); }
  [13.25, 14.45].forEach(j => B(GI, j, 0.12, 0.12, 40, fw, 0, {r:0.02}));
  B(GI, 13.2, 0.12, 1.37, 9, "#F08BA8", 40, {r:0.02}); K.wtext("어린이집", 29.122, 13.885, 44.5, "j", 4.2, "#FFFFFF", null, 800, K.FONT);
  for(let q = 0, i = 29.3; i < 35.9; i += 0.34, q++){ B(i, 14.38, 0.12, 0.1, 13, pick(q), 0, {r:0.02}); B(i - 0.01, 14.37, 0.14, 0.12, 1.2, fw, 13, {r:0.02});
    if(i + 0.34 < 35.9) [4, 9].forEach(z => B(i + 0.12, 14.42, 0.22, 0.03, 1.6, fw, z, {r:0})); }
  for(let q = 0, j = 9.3; j < 14.35; j += 0.34, q++){ B(35.88, j, 0.1, 0.12, 13, pick(q + 3), 0, {r:0.02}); B(35.87, j - 0.01, 0.12, 0.14, 1.2, fw, 13, {r:0.02});
    if(j + 0.34 < 14.35) [4, 9].forEach(z => B(35.92, j + 0.12, 0.03, 0.22, 1.6, fw, z, {r:0})); }
  // 미끄럼틀
  B(29.3, 9.3, 1.2, 1.2, 26, D("#FFD86B","#7A6630"), 0, {r:0.03}); B(29.26, 9.26, 1.28, 1.28, 2, D("#F4A7B9","#7A4A5E"), 26, {r:0.02});
  [[29.3,9.3],[30.44,9.3],[29.3,10.44]].forEach(([a,b]) => B(a, b, 0.06, 0.06, 14, fw, 28, {r:0}));
  B(29.33, 9.31, 1.14, 0.04, 1.2, fw, 41, {r:0}); B(29.31, 9.33, 0.04, 1.14, 1.2, fw, 41, {r:0});
  { const o = K.sm(K.cyl(0.001, 0.96, hz(14), 4), D("#F08BA8","#9C4A62"), X(29.9), hz(42) + hz(14) / 2, Z(9.9)); o.rotation.y = PI / 4; }
  const lad = D("#5E9BEA","#3A5A8A");
  [9.6, 10.2].forEach(j => B(30.51, j - 0.02, 0.04, 0.04, 28, lad, 0, {r:0})); [4, 9, 14, 19, 24].forEach(z => B(30.52, 9.6, 0.03, 0.6, 1, lad, z, {r:0}));
  { const g = new THREE.Group(), L = Math.hypot(2.4, hz(24)); g.position.set(X(29.9), hz(14), Z(11.7)); g.rotation.x = Math.atan2(hz(24), 2.4); K.root.add(g);
    K.sm(K.rbox(0.7, 0.04, L, 0.01), D("#F06B8E","#9C4A62"), 0, 0, 0, g); K.sm(K.rbox(0.04, hz(5), L, 0.01), D("#E2557A","#86394F"), -0.35, hz(2), 0, g); K.sm(K.rbox(0.04, hz(5), L, 0.01), D("#F59AB0","#B05A74"), 0.35, hz(2), 0, g); }
  B(29.85, 12.8, 0.1, 0.1, 2, "metal", 0, {cls:"s"});
  // 볼풀
  const rim = D("#7FC4E8","#3A6A86");
  B(33.9, 9.4, 1.9, 0.18, 10, rim, 0, {r:0.04}); B(33.9, 9.4, 0.18, 1.9, 10, rim, 0, {r:0.04}); B(35.62, 9.4, 0.18, 1.9, 10, K.sh(rim, -0.05), 0, {r:0.04}); B(33.9, 11.12, 1.9, 0.18, 10, K.sh(rim, 0.06), 0, {r:0.04});
  for(let q = 0; q < 75; q++) ball(34.12 + rnd(q + 11) * 1.48, 9.62 + rnd(q + 57) * 1.48, 6 + rnd(q + 3) * 2.5, 0.08, ["#F25F5C","#FFE066","#70C1B3","#5E9BEA","#F7A1C4","#FFA552"][q % 6], "s", 8);
  // 그림 그리는 둥근 탁자
  B(31.15, 13.25, 0.1, 0.1, 8, "metal", 0, {cls:"s"}); disc(31.2, 13.3, 0.62, 8, 1.2, D("#E6C565","#7A6630")); disc(31.2, 13.3, 0.6, 9.2, 0.15, D("#FFE066","#9C8540"));
  B(30.9, 13.05, 0.35, 0.25, 0.12, "#FFFFFF", 9.35, {r:0}); B(31.2, 13.35, 0.35, 0.25, 0.12, "#FFFFFF", 9.35, {r:0});
  [["#E06A55",31.35,13.1],["#3A6FD9",31.42,13.18],["#4DAA97",31.0,13.45],["#E8A04A",31.08,13.5]].forEach(([col,i,j]) => B(i, j, 0.12, 0.03, 0.8, col, 9.4, {r:0}));
  [[31.2,12.7],[31.2,13.95]].forEach(([i,j]) => disc(i, j, 0.24, 0, 2, D("#F7A1C4","#7A4A5E"), "m", 18));
  // 곰 인형 (방 안쪽을 보게)
  { const g = new THREE.Group(); g.position.set(X(35.4), 0, Z(13.7)); g.rotation.y = Math.atan2(-0.5, 0.85); K.root.add(g);
    const b = "#B98B55", bl = "#D8B27C", s = (r, col, x, y, z, sx = 1, sy = 1, sz = 1) => K.sm(K.sph(r, 14, 10), col, x, y, z, g).scale.set(sx, sy, sz);
    s(0.22, b, 0, hz(8), 0, 1, 1.05, 0.9); s(0.13, bl, 0, hz(7), 0.12, 1, 1, 0.6); [-1, 1].forEach(q => { s(0.085, b, q * 0.2, hz(4), 0.06); s(0.07, b, q * 0.12, hz(16) + 0.02, -0.02); s(0.06, b, q * 0.12, hz(26), 0); });
    s(0.17, b, 0, hz(21), 0); s(0.075, bl, 0, hz(19.5), 0.14, 1, 0.8, 0.7); s(0.022, "#2A2A28", 0, hz(20.3), 0.205); [-1, 1].forEach(q => s(0.02, "#2A2A28", q * 0.06, hz(22.5), 0.15));
    K.sm(K.rbox(0.28, hz(3), 0.06, 0.01), "#E06A55", 0, hz(15.5), 0.14, g); }
  // 장난감 수납장
  B(30.7, 9.06, 1.6, 0.5, 16, D("#FFFFFF","#5A544C"), 0, {r:0.02});
  [30.78, 31.31, 31.84].forEach((i, a) => [1.5, 8.5].forEach((z, b) => B(i + 0.03, 9.5, 0.42, 0.08, 5.2, ["#F25F5C","#FFE066","#70C1B3","#5E9BEA","#F7A1C4","#FFA552"][a * 2 + b], z, {r:0.02})));
}
function buildChurch(){
  const wn = D("#C9A77F","#4A3A2C"), chw = D("#8B5A3C","#5A3A26"), pewC = D("#A97A4E","#5E4630"), cwl = D("#F2E8D8","#4A4036");
  // 벽 판넬 · 창 · 말씀
  K.faceI(0.0, 9, GJ, 0, 30, wn, "m", 0.03); K.faceI(0.0, 9, GJ, 30, 32.5, K.sh(wn, -0.15), "m", 0.05);
  for(let j = 9.9; j < GJ; j += 0.9) K.faceI(0.03, j - 0.008, j + 0.008, 2, 28, K.sh(wn, -0.18), "m", 0.004);
  LANCET.forEach(lancet); buildLancets();
  K.wtext("항상 기뻐하라", 0.02, 17.2, 99, "j", 5.2, D("#8B5A3C","#E9D2B0"), null, 700, K.FONT); K.wtext("범사에 감사하라", 0.02, 11.8, 99, "j", 5.2, D("#8B5A3C","#E9D2B0"), null, 700, K.FONT);
  // 강단 (2단)
  B(0, 10.4, 2.75, 8.8, 4, D("#D9C4A0","#5A4A38"), 0, {r:0.02}); B(0, 10.7, 2.2, 8.2, 4, D("#E6D3B2","#665440"), 4, {r:0.02});
  B(0.1, 13.85, 2.1, 1.3, 0.2, D("#B84A5A","#6A2E36"), 8, {r:0}); [13.88, 15.09].forEach(j => B(0.1, j, 2.1, 0.03, 0.25, "#D9B45A", 8, {r:0}));
  // 피아노 · 의자
  const pc = "#2A2420";
  B(0.12, 9.25, 0.45, 1.0, 27, pc, 0, {cls:"s", r:0.02}); B(0.1, 9.25, 0.49, 1.0, 1.5, K.shade(pc, 0.18), 27, {cls:"s", r:0.01});
  B(0.57, 9.28, 0.25, 0.94, 1.6, "#F4F1EA", 13.4, {cls:"s", r:0}); K.faceI(0.82, 9.28, 10.22, 11.4, 13.4, "#1E1E1E", "m", 0.004);
  [0, 1, 3, 4, 5].forEach(q => B(0.58, 9.36 + 0.13 * q, 0.11, 0.06, 0.5, "#1E1E1E", 15.0, {r:0})); B(0.2, 9.6, 0.06, 0.3, 7, "#E8D3AE", 28.5, {r:0});
  B(0.95, 9.5, 0.3, 0.6, 10, pc, 0, {r:0.02});
  // 설교대
  B(1.75, 13.95, 0.45, 1.1, 26, chw, 8, {r:0.02}); B(1.7, 13.9, 0.55, 1.2, 1.6, K.sh(chw, 0.18), 34, {r:0.02});
  B(1.8, 14.08, 0.34, 0.84, 0.4, "#FFFDF6", 35.6, {r:0}); B(1.8, 14.49, 0.34, 0.02, 0.5, "#C9A86A", 35.6, {r:0});
  K.faceI(2.2, 14.43, 14.57, 14, 31, "#D9B45A", "s", 0.01); K.faceI(2.2, 14.28, 14.72, 24.5, 27, "#D9B45A", "s", 0.01);
  // 성찬대
  const cl = D("#FFFFFF","#D8D2C8");
  B(3.05, 13.8, 0.75, 1.4, 15, chw, 0, {r:0.02}); B(3.0, 13.75, 0.85, 1.5, 1.2, cl, 15, {r:0.01});
  K.faceI(3.85, 13.75, 15.25, 9, 16.2, cl, "m", 0.01); K.faceI(2.99, 13.75, 15.25, 9, 16.2, cl, "m", 0.01); K.faceJ(3.0, 3.85, 15.25, 9, 16.2, cl, "m", 0.01); K.faceJ(3.0, 3.85, 13.74, 9, 16.2, cl, "m", 0.01);
  K.faceI(3.86, 14.42, 14.58, 9.6, 15.4, "#C9A23F", "s", 0.004); K.faceI(3.86, 14.3, 14.7, 12.6, 13.6, "#C9A23F", "s", 0.004);
  disc(3.42, 14.2, 0.2, 16.2, 0.5, "#C9A23F", "s"); disc(3.42, 14.2, 0.14, 16.7, 0.8, "#E8C590");
  B(3.38, 14.72, 0.08, 0.08, 4, "#C9A23F", 16.2, {cls:"s", r:0}); { const o = K.sm(K.cyl(0.11, 0.06, hz(4), 14), "#C9A23F", X(3.42), hz(22), Z(14.76), null, "s"); } disc(3.42, 14.76, 0.08, 23.9, 0.2, "#7A1F2E");
  [13.92, 15.08].forEach(j => B(3.38, j - 0.04, 0.08, 0.08, 7, "#FFF8E8", 16.2, {r:0.01}));
  // 꽃 받침대 · 무릎 방석
  [[2.4,11.1],[2.4,17.9]].forEach(([i,j]) => { B(i - 0.1, j - 0.1, 0.2, 0.2, 14, D("#E9E2D6","#6A645C"), 4, {r:0.02});
    [[-7,3],[7,3],[0,4]].forEach(([dx,dy]) => ball(i + dx / 44, j - dx / 44, 22 - dy, 0.1, "plant", "m", 8));
    [[0,-3,5,"#F4A7B9"],[-5,1,4,"#FFFFFF"],[5,1,4,"#FFE066"],[-2,-7.5,3.6,"#E8607F"],[3,-7,3.6,"#FFFFFF"]].forEach(([dx,dy,r,col]) => ball(i + dx / 44, j - dx / 44, 22 - dy, r / 31.3, col, "m", 8)); });
  disc(3.0, 11.6, 0.2, 0, 2, D("#9C3D4A","#6A2E36"), "m", 18);
  // 장의자 (등받이는 +i 쪽, 사람들은 강단 −i를 봄)
  [4.2, 5.3, 6.4, 7.5, 8.6, 9.7].forEach(i => [[9.7,13.9],[15.1,19.3]].forEach(([a,b]) => { const len = b - a;
    B(i, a, 0.45, len, 11, pewC, 0, {r:0.03}); B(i + 0.42, a, 0.1, len, 19, K.sh(pewC, -0.06), 0, {r:0.02});
    B(i - 0.02, a - 0.08, 0.56, 0.08, 16, K.sh(pewC, -0.2), 0, {r:0.02}); B(i - 0.02, b, 0.56, 0.08, 16, K.sh(pewC, -0.2), 0, {r:0.02}); }));
  B(5.36, 15.5, 0.26, 0.2, 1.4, "#9C3D4A", 11, {r:0}); B(8.66, 11.3, 0.26, 0.2, 1.4, "#2F4F7A", 11, {r:0});
  // 복도 쪽 낮은 벽 + 글씨
  B(0, 8.88, 11, 0.12, 30, cwl, 0, {r:0}); B(0, 8.88, 11, 0.12, 2.5, K.sh(cwl, -0.12), 30, {r:0});
  K.wtext("기도하는 회사", 3.1, 9.003, 19.5, "i", 4.8, D("#8B5A3C","#E9D2B0"), null, 700, K.FONT);
  K.wtext("쉬지 말고 기도하라 · 살전 5:17", 3.1, 9.003, 12, "i", 2.7, D("#B08A5A","#B8A488"), null, 700, K.FONT);
  // 홀 쪽 난간 (입구 j 10.8~12.5 비움)
  const rc = D("#C9A77F","#5A4634");
  [[9.1,10.8],[12.5,19.95]].forEach(([a,b]) => { B(10.9, a, 0.1, b - a, 18, rc, 0, {r:0}); B(10.89, a, 0.12, b - a, 2, D("#A9875F","#4A3A2C"), 18, {r:0}); });
  for(let j = 13.42; j < 19.9; j += 0.92) K.faceI(11.0, j - 0.006, j + 0.006, 0, 18, K.sh(rc, -0.15), "m", 0.004); K.faceI(11.0, 10.02 - 0.006, 10.02 + 0.006, 0, 18, K.sh(rc, -0.15), "m", 0.004);
  // 입구 아치
  [10.8, 12.4].forEach(j => B(10.92, j, 0.12, 0.1, 46, chw, 0, {r:0.02}));
  B(10.9, 10.75, 0.14, 1.75, 11, D("#C9A23F","#8A6E2A"), 46, {cls:"s", r:0.02}); K.wtext("교회", 11.042, 11.625, 51.5, "j", 5.6, "#FFFFFF", null, 800, K.FONT);
  K.faceI(11.04, 11.57, 11.68, 57, 69, "#D9B45A", "s", 0.02); K.faceI(11.04, 11.45, 11.8, 63, 65.5, "#D9B45A", "s", 0.02);
  // A자 안내판
  const lg = D("#8B5A3C","#5A3A26");
  rod([10.5, 9.5, 0], [10.56, 9.57, 44], 0.014, lg, "m"); rod([10.5, 10.4, 0], [10.56, 10.33, 44], 0.014, lg, "m"); rod([10.32, 9.95, 0], [10.5, 9.95, 40], 0.012, lg, "m");
  K.faceI(10.56, 9.4, 10.5, 16, 44, D("#FFFDF6","#E9E2D6"), "m", 0.02);
  [["교회",39,4,"#8B5A3C",800],["주일예배 11:00",32.5,3,"#2A2A28",700],["수요기도회 19:30",27.5,3,"#2A2A28",700],["누구나 환영합니다",21.5,2.6,"#3A8A78",800]].forEach(([t,z,s,col,w]) => K.wtext(t, 10.585, 9.95, z, "j", s, col, null, w, K.FONT));
}
function buildHall(){
  const stone = D("#D8D0C4","#3A3631"), bw = D("#B98B55","#6B4A34");
  B(12.0, 16.35, 0.92, 2.7, 84, stone, 0, {r:0.02}); B(11.95, 16.3, 1.02, 2.8, 3, K.sh(stone, -0.1), 84, {r:0.02});
  [[16.6,17.6],[17.8,18.8]].forEach(([a,b]) => { K.faceI(12.92, a - 0.08, b + 0.08, 0, 60, D("#A9A196","#57514A"), "s", 0.02); K.faceI(12.935, a, b, 0, 56, D("#E8D2A8","#B89A6A"), "glow", 0.004); });
  K.faceI(12.92, 17.62, 17.78, 26, 37, D("#BDB5A9","#4A453F"), "s", 0.015);
  K.wtext("ELEVATOR", 12.93, 17.7, 77.5, "j", 4.2, "ink-2", null, 800);
  K.wtext("▲ 스튜디오", 12.93, 17.1, 71.2, "j", 2.7, D("#A9601A","#E8A04A"), null, 700, K.FONT); K.wtext("▼ 업무층", 12.93, 18.3, 71.2, "j", 2.7, D("#A9601A","#E8A04A"), null, 700, K.FONT);
  [[12.25,9.4],[13.65,9.4],[12.25,9.7],[13.65,9.7]].forEach(([a,b]) => B(a, b, 0.08, 0.08, 9, "metal", 0, {cls:"s"}));
  B(12.2, 9.35, 1.6, 0.45, 2.4, bw, 9, {r:0.03}); B(12.2, 9.3, 1.6, 0.08, 12, bw, 9, {r:0.02});
  K.plant(11.55, 19.55, true); K.plant(15.6, 19.55, true); K.plant(15.65, 11.0, true);
}
function buildGym(){
  [16.6, 17.9].forEach((i, k) => {
    B(i, 9.8, 0.8, 1.9, 6, "#2A2A2E", 0, {cls:"s", r:0.03});
    [i + 0.05, i + 0.7].forEach(a => B(a, 11.55, 0.05, 0.12, 34, "metal", 0, {cls:"s"}));
    B(i, 11.5, 0.8, 0.22, 6, "#2A2A2E", 32, {cls:"s", r:0.03});
  });
  B(19.8, 9.4, 2.0, 0.5, 6, "#2A2A2E", 0, {cls:"s", r:0.02});
  [19.8, 20.8].forEach(a => B(a, 9.5, 1.0, 0.3, 4, "#3A3A3E", 14, {cls:"s", r:0.02})); [19.82, 20.78, 21.74].forEach(a => B(a, 9.5, 0.04, 0.3, 8, "#3A3A3E", 6, {cls:"s", r:0}));
  const dumb = (i, j, zp) => { rod([i, j - 0.07, zp + 2.4], [i, j + 0.07, zp + 2.4], 0.012, "#9EA4AB"); [-0.07, 0.07].forEach(o => { const p = K.sm(K.cyl(0.077, 0.077, 0.03, 12), "#1E1E1E", X(i), hz(zp + 2.4), Z(j + o), null, "s"); p.rotation.x = PI / 2; }); };
  [[19.8,20.8],[20.8,21.8]].forEach(([a,b]) => { for(let i = a + 0.12; i < b - 0.05; i += 0.24){ dumb(i, 9.75, 6.1); dumb(i, 9.66, 18); } });
  K.sm(K.sph(0.32, 20, 14), "#4DAA97", X(22.3), 0.32, Z(11.0), null, "s");
  [[22.2,13.2],[22.8,13.2],[22.2,14.6],[22.8,14.6]].forEach(([a,b]) => B(a, b, 0.07, 0.07, 74, "#3A3A3E", 0, {cls:"s"}));
  [13.24, 14.64].forEach(j => rod([22.24, j, 74], [22.84, j, 74], 0.02, "#9EA4AB")); [22.24, 22.84].forEach(i => rod([i, 13.24, 74], [i, 14.64, 74], 0.02, "#3A3A3E"));
  [[22.2,17.7,"#E8A04A"],[22.55,17.7,"#E06A55"],[22.2,18.05,"#3A8A78"]].forEach(([i,j,col]) => { ball(i, j, 3.8, 0.12, "#2A2A28", "s", 14); disc(i, j, 0.123, 3, 1.4, col, "s", 16);
    const h = K.sm(K.cyl(0.075, 0.075, 0.025, 14, true), "#2A2A28", X(i), hz(9), Z(j), null, "s"); h.rotation.x = PI / 2; });
}
function buildLib(){
  const shelfC = D("#7A5A40","#4A3828");
  // 큰 책장 (복도 쪽, 책은 +j 면)
  B(23.6, 9.1, 5.2, 0.5, 70, shelfC, 0, {r:0.02});
  [23.6, 24.6, 25.6, 26.6, 27.6].forEach((a, s) => { const b = s === 4 ? 28.8 : a + 1;
    [[4,17],[19,32],[34,47],[49,62]].forEach(([z0, z1], r) => { K.faceJ(a + 0.05, b - 0.05, 9.6, z0, z1, K.sh(shelfC, -0.4), "m", 0.006);
      let i = a + 0.06, k = (a * 7 | 0) + 13 * r;
      while(i < b - 0.08){ const w = 0.07 + rnd(k) * 0.07; if(i + w > b - 0.06) break; if(rnd(k + 9) > 0.93){ i += 0.12; k++; continue; }
        B(i, 9.5, w, 0.12, (z1 - z0) * (0.62 + rnd(k + 5) * 0.32), BOOK[(7 * k) % 9], z0, {r:0}); i += w + 0.008; k++; } }); });
  K.faceJ(23.6, 28.8, 9.6, 64, 70, "#2A2A28", "m", 0.006);
  K.wtext("LIBRARY", 26.1, 9.61, 67, "i", 4, "#F2D3A0", null, 800); K.wtext("도서실 · 조용히", 27.1, 9.61, 67, "i", 3.4, "#F2D3A0", null, 700, K.FONT);
  // 칸막이 책장 (헬스장 | 도서실, 책은 +i 면)
  B(23.1, 11.0, 0.45, 4.4, 52, shelfC, 0, {r:0.02});
  [11.0, 12.1, 13.2, 14.3].forEach(a => { const b = a + 1.1;
    [[4,17],[19,32],[34,47]].forEach(([z0, z1], r) => { K.faceI(23.55, a + 0.05, b - 0.05, z0, z1, K.sh(shelfC, -0.4), "m", 0.006);
      let j = a + 0.06, k = (a * 11 | 0) + 17 * r;
      while(j < b - 0.08){ const w = 0.07 + rnd(k) * 0.07; if(j + w > b - 0.06) break; B(23.45, j, 0.12, w, (z1 - z0) * (0.62 + rnd(k + 5) * 0.32), BOOK[(5 * k) % 9], z0, {r:0}); j += w + 0.008; k++; } }); });
  // 안락의자 2개 (+j를 봄)
  [[25.0,"#8B5A3C"],[27.3,"#3A8A78"]].forEach(([c, col]) => { const ch = D(col, K.shade(col, -0.3));
    B(c - 0.42, 13.6, 0.84, 0.2, 28, K.sh(ch, -0.1), 0, {r:0.06, seg:2}); B(c - 0.42, 13.75, 0.84, 0.68, 9, ch, 0, {r:0.06});
    B(c - 0.36, 13.8, 0.72, 0.6, 2.5, K.sh(ch, 0.14), 9, {r:0.05, seg:2}); [c - 0.5, c + 0.38].forEach(a => B(a, 13.7, 0.12, 0.75, 16, K.sh(ch, -0.16), 0, {r:0.04})); });
  // 스탠드 · 협탁
  B(24.17, 13.37, 0.06, 0.06, 50, "metal", 0, {cls:"s"}); B(24.05, 13.25, 0.3, 0.3, 1.5, "metal", 0, {cls:"s"});
  B(26.12, 14.17, 0.06, 0.06, 12, "metal", 0, {cls:"s"}); disc(26.15, 14.2, 0.25, 12, 1, "wood"); B(26.08, 14.13, 0.12, 0.12, 3, "#FFFFFF", 13, {cls:"s", r:0.02});
  // 열람 테이블 · 초록 스탠드 · 책
  B(24.4, 18.2, 3.8, 0.7, 2.5, "wood", 13, {r:0.03});
  [[24.5,18.3],[27.95,18.3],[24.5,18.75],[27.95,18.75]].forEach(([a,b]) => B(a, b, 0.08, 0.08, 13, "metal", 0, {cls:"s"}));
  [24.9, 26.9].forEach(i => { B(i - 0.08, 18.35, 0.16, 0.12, 1, "#C9A64A", 15.5, {cls:"s", r:0}); B(i - 0.02, 18.39, 0.04, 0.04, 7, "#C9A64A", 16.5, {cls:"s", r:0});
    B(i - 0.22, 18.3, 0.44, 0.25, 2.5, "#2F6F4F", 21, {cls:"s", r:0.05, seg:2}); B(i - 0.19, 18.34, 0.38, 0.17, 0.2, "#FFE6A8", 20.8, {cls:"glow", r:0}); });
  B(25.5, 18.55, 0.4, 0.28, 0.8, "#FFFFFF", 15.5, {r:0}); B(25.53, 18.58, 0.34, 0.22, 0.4, "#E8A04A", 16.3, {r:0});
  // 의자 (독학러)
  { const si = 25.6, sj = 19.35, col = K.sh("c-school", -0.1);
    B(si - 0.04, sj - 0.04, 0.08, 0.08, 11, "metal", 0, {cls:"s"}); B(si - 0.26, sj - 0.22, 0.52, 0.46, 3, col, 11, {r:0.05}); B(si - 0.26, sj + 0.2, 0.52, 0.08, 22, K.sh(col, 0.08), 12, {r:0.04}); }
  // 사다리 · 북카트
  [28.15, 28.5].forEach(i => rod([i, 9.62, 64], [i, 10.35, 0], 0.016, "#8B5A3C", "m"));
  for(let k = 1; k < 10; k++){ const f = k / 10; rod([28.15, 9.62 + 0.73 * f, 64 * (1 - f)], [28.5, 9.62 + 0.73 * f, 64 * (1 - f)], 0.012, "#8B5A3C", "m"); }
  B(28.0, 10.75, 0.6, 0.5, 12, "#5A4636", 2, {r:0.02});
  [["#E06A55",28.05],["#6F82CF",28.15],["#E8A04A",28.25],["#3A8A78",28.35],["#C8B4D0",28.45]].forEach(([col, i], k) => B(i, 10.8, 0.08, 0.4, 6 + (k % 2) * 2, col, 14, {r:0}));
  [[28.05,10.8],[28.5,10.8],[28.05,11.2],[28.5,11.2]].forEach(([i,j]) => { const w = K.sm(K.cyl(0.05, 0.05, 0.03, 10), "#2A2A28", X(i + 0.03), 0.05, Z(j), null, "s"); w.rotation.z = PI / 2; });
}
/* 천장 등: 돔 · 샹들리에 · 구름등 */
function buildLamps(){
  const glowC = D("#FFF3D6","#FFD9A0"), cord = h => ceil - h;
  const dome = myGeo(new THREE.SphereGeometry(0.2, 16, 8, 0, PI * 2, 0, PI / 2));
  DOMES.forEach(([i,j]) => { const y = hz(102);
    K.sm(dome, "#2A2A28", X(i), y, Z(j), null, "s").scale.y = 0.75; K.sm(K.cyl(0.17, 0.17, 0.012, 16), glowC, X(i), y - 0.005, Z(j), null, "glow");
    K.sm(K.cyl(0.008, 0.008, cord(y), 4), "metal", X(i), y + cord(y) / 2, Z(j), null, "s"); });
  const ring = myGeo(new THREE.TorusGeometry(0.354, 0.014, 6, 40));
  CHAND.forEach(([i,j]) => { const y = hz(90);
    K.sm(ring, "#C9A23F", X(i), y, Z(j), null, "s").rotation.x = PI / 2;
    ball(i, j, 102, 0.07, "#C9A23F", "s"); ball(i, j, 87, 0.09, "#C9A23F", "s"); ball(i, j, 83, 0.045, "#C9A23F", "s");
    for(let k = 0; k < 8; k++){ const a = k / 8 * PI * 2, x = X(i) + Math.cos(a) * 0.354, z = Z(j) + Math.sin(a) * 0.354;
      rod([i, j, 102], [x + 18, z + 10, 90], 0.006, "#C9A23F"); K.sm(K.cyl(0.018, 0.018, hz(3), 6), D("#FFFDF6","#E9E2D6"), x, y + hz(1.5) + 0.01, z); }
    K.sm(K.cyl(0.008, 0.008, cord(hz(102)), 4), "metal", X(i), hz(102) + cord(hz(102)) / 2, Z(j), null, "s"); });
  CLOUD.forEach(([i,j]) => { const y = hz(96), s = 13 * 0.62 / 31.3;
    [[-1.1,0.25,0.75],[0,-0.25,1],[1.1,0.15,0.8],[0.5,0.45,0.7],[-0.5,0.5,0.7]].forEach(([dx, dy, r], k) => { const u = dx * s * 0.707;
      K.sm(K.sph(r * s, 14, 10), k < 3 ? D("#FFFFFF","#FFF6E6") : D("#F5EEF8","#E9DDF0"), X(i + u), y - dy * s * 0.8, Z(j - u), null, "glow"); });
    K.sm(K.cyl(0.008, 0.008, cord(y + 0.2), 4), "metal", X(i), y + 0.2 + cord(y + 0.2) / 2, Z(j), null, "s"); });
}

/* ---------- 움직이는 물건 ---------- */
function buildDynamic(){
  const R = K.R, scene = R.scene;
  W.dcv = document.createElement("canvas"); W.dcv.width = DW; W.dcv.height = DH; W.dctx = W.dcv.getContext("2d");
  W.dtex = new THREE.CanvasTexture(W.dcv); W.dtex.colorSpace = THREE.SRGBColorSpace; W.dtex.anisotropy = 4;
  // 시사실 화면
  dplane(520, 162, 6.8, hz(66), "i", 15.4, 0.0, hz(57), drawCinema, 0.035);
  dplane(42, 42, 0.36, 0.36, "i", 12.1, 0.0, hz(104), drawReel, 0.04);
  // 게임룸 TV · PRESS START · 오락기 화면 3
  dplane(320, 134, 3.2, hz(42), "i", 22.2, 0.0, hz(55), drawTV, 0.068);
  dplane(200, 30, 1.7, hz(8), "i", 24.3, 0.0, hz(89), drawPress, 0.04);
  ARC.forEach(([i, col, , egg], k) => dplane(70, 60, 0.56, hz(15), "i", i + 0.4, 0.85, hz(43.5), (c, w, h, S, tm) => drawArcade(c, w, h, S, tm, k, egg), 0.016));
  // 메뉴 오늘 요리 빛 (w_menu)
  dplane(300, 40, 2.6, hz(11), "i", 7.4, 0.045, hz(70.5), drawMenuGlow, 0.05);
  // 환영합니다 바닥 빛 (w_welcome)
  dplane(200, 60, 1.6, 0.48, "f", 9.4, 14.5, 0.02, drawWelcome);
  // 러닝머신 벨트 · 화면
  [16.6, 17.9].forEach((i, k) => { dplane(30, 86, 0.56, 1.6, "f", i + 0.4, 10.7, hz(6) + 0.012, (c, w, h, S, tm) => drawBelt(c, w, h, tm, k));
    dplane(72, 20, 0.44, hz(3.6), "i", i + 0.4, 11.72, hz(35.2), (c, w, h, S, tm) => drawTread(c, w, h, S, k), 0.012); });
  // 어린이집 해님 (회전 · 윙크)
  dplane(80, 80, 0.9, 0.9, "i", 35.25, 9.0, hz(24), drawSun, 0.035);
  // 엘리베이터 층 표시 · 호출 버튼
  [[16.6,17.6,"a"],[17.8,18.8,"b"]].forEach(([a,b,w]) => dplane(96, 30, 0.64, hz(6.5), "j", 12.92, (a + b) / 2, hz(65.25), (c, ww, hh) => drawInd(c, ww, hh, w), 0.03));
  dplane(18, 40, 0.16, hz(11), "j", 12.935, 17.7, hz(31.5), drawCall, 0.02);
  const dg = mergeGeometries(W.dgeo, false); W.dgeo.forEach(g => g.dispose());
  const dm = new THREE.Mesh(dg, K.cutaway(new THREE.MeshBasicMaterial({map:W.dtex, transparent:true, toneMapped:false, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-3})));
  dm.renderOrder = 2; scene.add(dm);

  // 빛 번짐 (가산 혼합 판, 카메라를 봄)
  const gc = document.createElement("canvas"); gc.width = gc.height = 64; { const x = gc.getContext("2d"), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.35, "rgba(255,255,255,.45)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(0, 0, 64, 64); }
  W.gtex = new THREE.CanvasTexture(gc);
  const G = W.glows = [], gl = (i, j, zp, rpx, col, a) => G.push({p:new THREE.Vector3(X(i), hz(zp), Z(j)), s:rpx / 31.3 * 2, c:new THREE.Color(col), a});
  LANCET.forEach(([jc, R2, z0, zr, , main]) => gl(0.12, jc, (z0 + zr + R2 * 31.3) / 2, main ? 80 : 48, "#FFDC96", (S, tm, dk) => main && S?.eggOn("w_cross") ? 0.5 : dk ? 0.22 : 0));
  [13.92, 15.08].forEach(j => gl(3.42, j, 25.5, 13, "#FFC86E", (S, tm, dk) => (S?.eggOn("w_candle") ? 2.15 : 1) * (dk ? 0.5 : 0.35), "candle"));
  G.slice(-2).forEach(g => g.candle = true);
  ARC.forEach(([i, col]) => gl(i + 0.4, 0.95, 44, 24, col, () => 0.25));
  gl(24.2, 13.4, 50, 26, "#FFDC96", S => S?.eggOn("w_lamp") ? 0 : 0.45);
  [25.0, 27.0].forEach(i => gl(i, 18.45, 20, 22, "#FFE296", () => 0.4));
  CLOUD.forEach(([i,j]) => gl(i, j, 92, 22, "#FFF0C8", (S, tm, dk) => dk ? 0.35 : 0.15));
  gl(7.4, 0.15, 70.5, 40, "#FFB547", S => S?.eggOn("w_menu") ? 0.5 : 0);
  gl(15.4, 6.2, 17, 8, "#FFF3C2", () => 0.6);
  W.bulbs = [];   // 전구 (정원 줄 · 샹들리에 · 촛불)
  WIRES.forEach(([a, b], q) => { for(let k = 1; k < 14; k++){ const f = k / 14, p = new THREE.Vector3(X(a[0] + (b[0] - a[0]) * f), hz(86 - Math.sin(PI * f) * 9 - 1.5), Z(a[1] + (b[1] - a[1]) * f));
    W.bulbs.push({p, r:0.045, kind:"str", k, q, c:new THREE.Color(["#FFE6A8","#FFD27A","#FFF3D6"][k % 3])}); gl(0, 0, 0, 7, "#FFD68C", null); G[G.length - 1].p = p; G[G.length - 1].bulb = W.bulbs.length - 1; } });
  CHAND.forEach(([i,j], q) => { for(let k = 0; k < 8; k++){ const a = k / 8 * PI * 2, p = new THREE.Vector3(X(i) + Math.cos(a) * 0.354, hz(90 + 3 + 4.6), Z(j) + Math.sin(a) * 0.354);
    W.bulbs.push({p, r:0.05, kind:"ch", k, q, c:new THREE.Color("#FFD27A")}); gl(0, 0, 0, 10, "#FFD68C", null); G[G.length - 1].p = p; G[G.length - 1].bulb = W.bulbs.length - 1; } });
  [13.92, 15.08].forEach((j, k) => W.bulbs.push({p:new THREE.Vector3(X(3.42), hz(25.5), Z(j)), r:0.035, kind:"flame", k, q:j, c:new THREE.Color("#FF9A2E")}));
  W.bulbs.push({p:new THREE.Vector3(X(24.2), hz(54), Z(13.4)), r:0.16, kind:"lamp", k:0, q:0, c:new THREE.Color("#F6E7BC")});
  const gm = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), K.cutaway(new THREE.MeshBasicMaterial({map:W.gtex, transparent:true, blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false})), G.length);
  gm.frustumCulled = false; gm.renderOrder = 3; scene.add(gm); W.gm = gm;
  const bm = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), K.cutaway(new THREE.MeshBasicMaterial({toneMapped:false})), W.bulbs.length);
  bm.frustumCulled = false; scene.add(bm); W.bm = bm;
  // 작은 움직이는 공·김·팝콘·물방울·새·비둘기·빈백 (구 하나로 인스턴싱)
  W.fx = []; const FXN = 48;
  const fm = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 9), K.cutaway(new THREE.MeshStandardMaterial({roughness:0.6})), FXN);
  fm.frustumCulled = false; fm.castShadow = true; scene.add(fm); W.fm = fm; W.fxN = FXN;
  // 상자 (엘리베이터 문짝 · 블록 · 컵 · 슬레이트 막대 · 인형뽑기 집게)
  const xm = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), K.cutaway(new THREE.MeshStandardMaterial({roughness:0.5, metalness:0.1})), 24);
  xm.frustumCulled = false; xm.castShadow = true; scene.add(xm); W.xm = xm; W.xN = 24;
  // 파라솔 (8폭)
  { const M = Merge(), pos = [], cols = [];
    for(let k = 0; k < 8; k++){ const a0 = k / 8 * PI * 2, a1 = (k + 1) / 8 * PI * 2; pos.push(0, hz(10), 0, Math.cos(a1), 0, Math.sin(a1), Math.cos(a0), 0, Math.sin(a0)); }
    for(let k = 0; k < 8; k++){ const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos.slice(k * 9, k * 9 + 9), 3)); g.computeVertexNormals(); M.add(g, k % 2 ? D("#FFFFFF","#D8D2C8") : "amber"); }
    const m = dynMesh(M.geo(), K.cutaway(new THREE.MeshStandardMaterial({vertexColors:true, roughness:0.7, side:THREE.DoubleSide}))); m.position.set(X(35.45), hz(66), Z(6.5)); W.parasol = m; }
  // 냥이 (자는 모습 · 선 모습)
  W.cat = {sleep:catMesh(true), stand:catMesh(false), h:0};
  // 영사기 빛줄기
  { const A = [X(15.4), hz(17), Z(6.22)], Cn = [[12.0,24],[12.0,90],[18.8,90],[18.8,24]].map(([i,z]) => [X(i), hz(z), Z(0.04)]), p = [];
    for(let k = 0; k < 4; k++){ const a = Cn[k], b = Cn[(k + 1) % 4]; p.push(...A, ...a, ...b); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
    W.beam = new THREE.Mesh(g, K.cutaway(new THREE.MeshBasicMaterial({color:0xFFF0C8, transparent:true, opacity:0.08, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide, toneMapped:false}))); W.beam.renderOrder = 3; scene.add(W.beam); }
}
function catMesh(sleep){
  const M = Merge(), c = "#E8A04A", d = "#C98436", S = K.sph(1, 14, 10);
  if(sleep){ M.add(S, c, 0, 0.1, 0, 0, 0, 0, 0.2, 0.11, 0.27);
    M.add(S, c, 0.05, 0.12, 0.2, 0, 0, 0, 0.13, 0.12, 0.12); [-1, 1].forEach(s => M.add(K.cyl(0.001, 0.045, 0.08, 6), c, 0.05 + s * 0.065, 0.24, 0.21, 0, 0, s * 0.25));
    [-1, 1].forEach(s => M.add(K.rbox(0.04, 0.008, 0.008, 0), "#2A2A28", 0.05 + s * 0.05, 0.13, 0.31));
    M.add(K.sph(1, 10, 6), c, -0.15, 0.06, 0.08, 0, 0, 0, 0.06, 0.05, 0.2);
    [-0.08, 0, 0.08].forEach(z => M.add(K.rbox(0.03, 0.02, 0.1, 0), d, 0, 0.205, z));
  } else {
    M.add(S, c, 0, 0.22, 0, 0, 0, 0, 0.12, 0.11, 0.25);
    M.add(S, c, 0, 0.34, 0.27, 0, 0, 0, 0.13, 0.13, 0.13); [-1, 1].forEach(s => M.add(K.cyl(0.001, 0.045, 0.09, 6), c, s * 0.07, 0.47, 0.27, 0, 0, s * 0.25));
    [-1, 1].forEach(s => M.add(S, "#2A2A28", s * 0.05, 0.36, 0.385, 0, 0, 0, 0.018, 0.022, 0.012)); M.add(S, "#F29BA6", 0, 0.325, 0.4, 0, 0, 0, 0.015, 0.012, 0.01);
    [[-0.07,0.15],[0.07,0.15],[-0.07,-0.15],[0.07,-0.15]].forEach(([x, z]) => M.add(K.cyl(0.028, 0.028, 0.16, 8), d, x, 0.08, z));
    M.add(K.cyl(0.024, 0.02, 0.26, 8), c, 0, 0.36, -0.3, -0.55, 0, 0);
    [-0.08, 0, 0.08].forEach(z => M.add(K.rbox(0.18, 0.02, 0.03, 0), d, 0, 0.325, z));
  }
  const m = dynMesh(M.geo(), K.cutaway(new THREE.MeshStandardMaterial({vertexColors:true, roughness:0.75}))); m.visible = false; return m;
}

/* 그림판 그리기 함수들 (tm = 타워 시계 ms) */
const sx = (S) => S?.reduce;
function drawCinema(c, w, h, S, tm){
  const ng = S?.eggOn("w_screen"), y = z => (90 - z) / 66 * h, x = i => (i - 12.0) / 6.8 * w, g = c.createLinearGradient(0, 0, 0, h);
  if(ng){ g.addColorStop(0, "#2A2A2E"); g.addColorStop(1, "#4A4A50"); c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = "#FF6B6B"; c.font = `900 ${9 / 66 * h * 1.25}px ${K.FONT}`; c.fillText("NG 모음 😂", w / 2, y(62));
    c.fillStyle = "#FFFFFF"; c.font = `600 ${3.6 / 66 * h * 1.3}px ${K.FONT}`; c.fillText("감독님 몰래 보는 중…", w / 2, y(44)); return; }
  g.addColorStop(0, "#F08A5D"); g.addColorStop(0.55, "#F7C873"); g.addColorStop(1, "#6A4C7A"); c.fillStyle = g; c.fillRect(0, 0, w, h);
  const ph = sx(S) ? 0.3 : (tm * 0.00005) % 1;
  c.fillStyle = "#FFF3C2"; c.beginPath(); c.arc(x(12.6 + 5.6 * ph), y(58), 7 / 66 * h * 0.9, 0, 7); c.fill();
  c.fillStyle = "#3A2A4A"; c.beginPath(); [[12.0,24],[12.0,40],[13.6,48],[15.0,41],[16.6,50],[18.8,38],[18.8,24]].forEach(([i,z], k) => k ? c.lineTo(x(i), y(z)) : c.moveTo(x(i), y(z))); c.fill();
  const wx = x(13.0 + ((3 * ph) % 1) * 4.6), wy = y(30), u = h / 66, lg = sx(S) ? 0 : Math.sin(tm * 0.01) * 1.5;
  c.fillStyle = "#1A1220"; c.beginPath(); c.arc(wx, wy - 13 * u, 2.6 * u, 0, 7); c.fill(); c.fillRect(wx - 2 * u, wy - 10.5 * u, 4 * u, 8 * u);
  c.strokeStyle = "#1A1220"; c.lineWidth = 1.4 * u; c.beginPath(); c.moveTo(wx - 1 * u, wy - 3 * u); c.lineTo(wx - 1 * u + lg * u, wy); c.moveTo(wx + 1 * u, wy - 3 * u); c.lineTo(wx + 1 * u - lg * u, wy); c.stroke();
  const big = !!S?.show?.on;   // 고객 시사 땐 제목 띠를 위에 크게 (아래는 영사기에 가림)
  c.fillStyle = big ? "rgba(0,0,0,.5)" : "rgba(0,0,0,.35)"; c.fillRect(0, y(big ? 87 : 31.5), w, y(big ? 75 : 25.5) - y(big ? 87 : 31.5));
  c.fillStyle = "#FFFFFF"; c.textAlign = "center"; c.textBaseline = "middle"; c.font = `700 ${(big ? 6.6 : 3.3) * u * 1.3}px ${K.FONT}`; c.fillText(S?.showTxt || "크레용팜 새 편집본 시사 중", w / 2, y(big ? 81 : 28.5));
}
function drawReel(c, w, h, S, tm){
  const a = S?.eggOn("w_reel") && !sx(S) ? tm * 0.01 : 0, r = w * 0.42;
  c.translate(w / 2, h / 2); c.rotate(a); c.strokeStyle = "#C9CDD2"; c.lineWidth = w * 0.09; c.beginPath(); c.arc(0, 0, r, 0, 7); c.stroke();
  c.fillStyle = "#C9CDD2"; for(let k = 0; k < 5; k++){ const b = k / 5 * PI * 2; c.beginPath(); c.arc(Math.cos(b) * r * 0.52, Math.sin(b) * r * 0.52, r * 0.2, 0, 7); c.fill(); }
}
function drawTV(c, w, h, S, tm){
  const a = 20.6, Wd = 3.2, x = i => (i - a) / Wd * w, y = z => (76 - z) / 42 * h, u = h / 42, g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#5DB8F5"); g.addColorStop(1, "#C6ECFF"); c.fillStyle = g; c.fillRect(0, 0, w, h);
  const red = sx(S), sc = red ? 0 : tm * 0.00035, md = v => ((v % Wd) + Wd) % Wd;
  c.fillStyle = "#FFFFFF"; [[0.3,66],[1.6,70],[2.6,62]].forEach(([o, z]) => { const i = a + md(o - 0.5 * sc); if(i < a + Wd - 0.45){ c.fillRect(x(i), y(z + 3), 0.4 / Wd * w, 3 * u); c.fillRect(x(i + 0.1), y(z + 5), 0.2 / Wd * w, 2 * u); } });
  c.fillStyle = "#5DBB63"; c.fillRect(0, y(42), w, h - y(42)); c.fillStyle = "#9C6A3C"; c.fillRect(0, y(39), w, h - y(39));
  for(let k = 0; k < 5; k++){ const i = a + md(0.82 * k - sc); if(i > a + Wd - 0.3) continue;
    if(k % 2){ c.fillStyle = "#E8A04A"; c.fillRect(x(i), y(57.5), 0.24 / Wd * w, 5.5 * u); c.fillStyle = "#FFD45E"; c.fillRect(x(i + 0.06), y(55.8), 0.12 / Wd * w, 2.2 * u); }
    else { c.fillStyle = "#FFD45E"; c.beginPath(); c.arc(x(i + 0.1), y(50 + (red ? 0 : 1.5 * Math.sin(tm * 0.006 + k))), 2.2 * u, 0, 7); c.fill(); } }
  const hi = 21.55, jz = red ? 0 : Math.max(0, Math.sin(PI * 2 * ((tm * 0.0011) % 1))) * 13;
  c.fillStyle = "#E0453A"; c.fillRect(x(hi), y(48 + jz), 0.2 / Wd * w, 6 * u); c.fillStyle = "#F1D2B8"; c.fillRect(x(hi + 0.02), y(52 + jz), 0.16 / Wd * w, 4 * u); c.fillStyle = "#E0453A"; c.fillRect(x(hi), y(54 + jz), 0.2 / Wd * w, 2 * u);
  c.textBaseline = "middle"; c.textAlign = "center";
  if(S?.eggOn("w_tv")){ c.fillStyle = "#FFD45E"; c.font = `800 ${3.6 * u * 1.3}px ${K.SIGN}`; c.fillText("1UP!", x(21.22), y(72)); }
  else { c.fillStyle = "#FFFFFF"; c.font = `800 ${2.6 * u * 1.3}px ${K.SIGN}`; c.fillText("SCORE 04210", x(21.22), y(72)); }
  c.fillStyle = "#E0453A"; c.font = `800 ${3 * u * 1.3}px ${K.SIGN}`; c.fillText("♥♥♥", x(23.4), y(72));
}
function drawPress(c, w, h, S, tm){
  if(!sx(S) && Math.floor(tm / 650) % 2 === 0) return;
  c.textAlign = "center"; c.textBaseline = "middle"; c.font = `800 ${h * 0.66}px ${K.SIGN}`; c.shadowColor = "#5FD3E8"; c.shadowBlur = h * 0.35; c.fillStyle = "#B8F3FF"; c.fillText("PRESS START", w / 2, h * 0.55); c.fillText("PRESS START", w / 2, h * 0.55);
}
function drawArcade(c, w, h, S, tm, k, egg){
  const on = S?.eggOn(egg), x = o => (o - 0.12) / 0.56 * w, y = z => (51 - z) / 15 * h;
  c.fillStyle = on ? (Math.floor(tm / 120) % 2 ? "#3A1A6A" : "#14304A") : "#0E0E22"; c.fillRect(0, 0, w, h);
  for(let r = 0; r < 2; r++) for(let q = 0; q < 3; q++){ const o = sx(S) ? 0 : Math.sin(tm * 0.0015 + k + r) * 0.07; c.fillStyle = ["#7CFF6B","#FF6BA8","#5FD3E8"][(q + r + k) % 3]; c.fillRect(x(0.2 + 0.16 * q + o), y(47.5 - 4 * r), 0.08 / 0.56 * w, 2.5 / 15 * h); }
  c.fillStyle = on ? "#FFD45E" : "#FFFFFF"; c.fillRect(x(0.36), y(39.5), 0.08 / 0.56 * w, 2 / 15 * h);
}
function drawMenuGlow(c, w, h, S){
  if(!S?.eggOn("w_menu")) return;
  c.textAlign = "center"; c.textBaseline = "middle"; c.font = `800 ${h * 0.75}px ${K.FONT}`; c.shadowColor = "#FFB547"; c.shadowBlur = h * 0.45; c.fillStyle = "#FFD27A"; c.fillText(S.menu[0], w / 2, h * 0.53); c.fillText(S.menu[0], w / 2, h * 0.53);
}
function drawWelcome(c, w, h, S){
  if(!S?.eggOn("w_welcome")) return;
  c.textAlign = "center"; c.textBaseline = "middle"; c.font = `800 ${6.5 / 31.3 / 0.48 * h}px ${K.FONT}`; c.shadowColor = "#FFD45E"; c.shadowBlur = h * 0.3; c.fillStyle = "#FFE7A8"; c.fillText("환영합니다", w / 2, h / 2); c.fillText("환영합니다", w / 2, h / 2);
}
function drawBelt(c, w, h, tm, k){
  c.fillStyle = "#1A1A1C"; c.fillRect(0, 0, w, h); if(k) return;
  c.fillStyle = "rgba(255,255,255,.12)"; for(let q = 0; q < 6; q++){ const j = (q * 0.27 + tm * 0.0016) % 1.6; c.fillRect(0, j / 1.6 * h, w, 2); }
}
function drawTread(c, w, h, S, k){
  const on = k === 0 || S?.eggOn("w_tread"); c.fillStyle = on ? "#5FD3E8" : "#3A3F47"; c.fillRect(0, 0, w, h);
  if(k === 0){ c.fillStyle = "#0E2A33"; c.textAlign = "center"; c.textBaseline = "middle"; c.font = `800 ${h * 0.7}px ${K.SIGN}`; c.fillText("5.2km", w / 2, h * 0.55); }
}
function drawSun(c, w, h, S, tm){
  const r = w / 0.9 * 7 / 31.3, a = sx(S) ? 0 : tm * 0.0004, cx = w / 2, cy = h / 2, wink = S?.eggOn("w_wsun");
  c.strokeStyle = "#FFD45E"; c.lineWidth = r * 0.28; c.lineCap = "round";
  for(let k = 0; k < 8; k++){ const b = a + k / 8 * PI * 2; c.beginPath(); c.moveTo(cx + Math.cos(b) * r * 1.36, cy + Math.sin(b) * r * 1.36); c.lineTo(cx + Math.cos(b) * r * 1.79, cy + Math.sin(b) * r * 1.79); c.stroke(); }
  c.fillStyle = "#FFD45E"; c.beginPath(); c.arc(cx, cy, r, 0, 7); c.fill();
  c.fillStyle = "#3A2A1A"; c.strokeStyle = "#3A2A1A"; c.lineWidth = r * 0.12;
  c.beginPath(); c.arc(cx - r * 0.35, cy - r * 0.15, r * 0.12, 0, 7); c.fill();
  if(wink){ c.beginPath(); c.moveTo(cx + r * 0.2, cy - r * 0.15); c.lineTo(cx + r * 0.5, cy - r * 0.15); c.stroke(); c.fillStyle = "rgba(240,120,140,.6)"; [-1, 1].forEach(s => { c.beginPath(); c.arc(cx + s * r * 0.55, cy + r * 0.2, r * 0.18, 0, 7); c.fill(); }); }
  else { c.beginPath(); c.arc(cx + r * 0.35, cy - r * 0.15, r * 0.12, 0, 7); c.fill(); }
  c.beginPath(); c.arc(cx, cy + r * 0.1, r * 0.4, 0.15 * PI, 0.85 * PI); c.stroke();
}
function drawInd(c, w, h, which){
  c.fillStyle = "#141414"; c.fillRect(0, 0, w, h); const o = which === "a" ? W.doorA : W.doorB;
  c.textAlign = "center"; c.textBaseline = "middle"; c.font = `800 ${h * 0.6}px ${K.FONT}`; c.shadowColor = "#FF9A2E"; c.shadowBlur = h * 0.3; c.fillStyle = "#FFB547"; c.fillText(o > 0.5 ? "도착" : which === "a" ? "▲ 4F" : "▼ 2F", w / 2, h * 0.55);
}
function drawCall(c, w, h){
  c.fillStyle = "rgba(0,0,0,0)"; [[0.25, W.doorB > 0.3],[0.62, W.doorA > 0.3]].forEach(([fy, lit]) => { c.fillStyle = lit ? "#FFB547" : "#E6E1D8"; c.beginPath(); c.arc(w / 2, fy * h, w * 0.32, 0, 7); c.fill(); });
}

/* ---------- 사람 소품 (인스턴싱 전에 붙임) ---------- */
/* 소품은 단위 도형 셋(상자·원기둥·공)을 크기만 바꿔 씀 → 인스턴싱 묶음(드로우콜) 최소 */
let UB, UC, UT, UF, US;
const ub = (w, h, d) => ({g:UB, s:[w, h, d]});
const uc = (rt, rb, h) => Math.abs(rt - rb) < 0.012 ? {g:UC, s:[rb, h, rb]} : rt < rb ? {g:UT, s:[rb, h, rb]} : {g:UF, s:[rt, h, rt]};
const us = r => ({g:US, s:[r, r, r]});
function attach(P, parent, g, col, x, y, z, vis, rx = 0, ry = 0, rz = 0){
  const o = new THREE.Object3D(); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); parent.add(o);
  if(g.s){ o.scale.set(...g.s); g = g.g; }
  K.part(o, g, col, () => P.p.root.visible && (!vis || vis())); return o;
}
function dressUp(P, src){
  const p = P.p, L = src.look, a = src.act, sit = () => src.pose === "sit";
  if(L.style === "cap"){ attach(P, p.head, uc(0.222, 0.232, 0.12, 18), "#E8A04A", 0, 0.33, -0.01); attach(P, p.head, ub(0.3, 0.02, 0.18, 0.01), "#E8A04A", 0, 0.28, 0.2); }
  if(src.hat){ attach(P, p.head, uc(0.17, 0.15, 0.22, 16), "#FFFFFF", 0, 0.46, -0.01); [-0.1, 0, 0.1].forEach(x => attach(P, p.head, us(0.11, 12, 8), "#FFFFFF", x, 0.6, 0)); }
  if(src.apron) attach(P, p.chest, ub(0.34, 0.44, 0.03, 0.02), src.apron, 0, 0.12, 0.13);
  if(src.robe){ attach(P, p.hips, uc(0.21, 0.29, 0.78, 14), L.shirt, 0, -0.36, 0, () => !sit()); }
  if(src.suit){ attach(P, p.chest, ub(0.08, 0.1, 0.012, 0), "#FFFFFF", 0, 0.33, 0.135); attach(P, p.chest, ub(0.032, 0.2, 0.014, 0), src.suit, 0, 0.24, 0.14);   // 셔츠 · 넥타이
    [-1, 1].forEach(s => attach(P, p.chest, ub(0.012, 0.24, 0.01, 0), "#2F5D8C", s * 0.07, 0.24, 0.138)); attach(P, p.chest, ub(0.09, 0.12, 0.012, 0.01), "#FFFFFF", -0.06, 0.08, 0.145); attach(P, p.chest, ub(0.09, 0.03, 0.014, 0), "#2F5D8C", -0.06, 0.125, 0.146); }   // 출입증 목걸이
  if(src.stole) [-1, 1].forEach(s => attach(P, p.chest, ub(0.06, 0.46, 0.02, 0), src.stole, s * 0.075, 0.25, 0.14));
  const hand = p.arms[1].el, handL = p.arms[0].el;
  if(a === "sing") attach(P, p.chest, ub(0.3, 0.025, 0.2, 0.01), "#2A2A28", 0, 0.3, 0.3, null, -0.95);
  if(a === "book" || a === "doze") attach(P, p.chest, ub(0.34, 0.025, 0.24, 0.01), src.book || "#3A8A78", 0, 0.3, 0.3, null, -0.95);
  if(a === "clip"){ attach(P, p.chest, ub(0.2, 0.02, 0.27, 0.01), "#8B5A3C", 0, 0.3, 0.3, null, -0.95); attach(P, p.chest, ub(0.16, 0.022, 0.21, 0), "#FFFFFF", 0, 0.305, 0.3, null, -0.95); }
  if(a === "pad") attach(P, p.chest, ub(0.26, 0.05, 0.1, 0.02), "#2A2A2E", 0, 0.27, 0.32);
  if(a === "cup") attach(P, hand, uc(0.04, 0.035, 0.09, 10), "#FFFFFF", 0, -0.31, 0.04);
  if(a === "paddle"){ attach(P, hand, uc(0.11, 0.11, 0.025, 16), "#D94A3A", 0, -0.42, 0.02, null, PI / 2); attach(P, hand, ub(0.04, 0.12, 0.03, 0), "#8B5A3C", 0, -0.3, 0.02); }
  if(a === "curl"){ attach(P, hand, ub(0.03, 0.03, 0.22, 0), "#2A2A28", 0, -0.29, 0.02); [-1, 1].forEach(s => attach(P, hand, uc(0.06, 0.06, 0.04, 12), "#2A2A28", 0, -0.29, 0.02 + s * 0.11, null, PI / 2)); }
  if(a === "water"){ attach(P, hand, ub(0.2, 0.16, 0.14, 0.04), "#4DAA97", 0, -0.32, 0.08); attach(P, hand, uc(0.014, 0.014, 0.2, 6), "#4DAA97", 0, -0.27, 0.22, null, 1.0); }
  if(a === "shelve") attach(P, hand, ub(0.1, 0.15, 0.04, 0), "#E06A55", 0, -0.33, 0.02, () => !!P.up);
  if(a === "ladle"){ attach(P, hand, uc(0.01, 0.01, 0.3, 6), "#9EA4AB", 0, -0.38, 0.03); attach(P, hand, us(0.05, 10, 6), "#9EA4AB", 0, -0.53, 0.03); }
  if(src.lying){ [-1, 1].forEach(s => attach(P, p.head, ub(0.1, 0.055, 0.02, 0.01), "#1E1E1E", s * 0.075, 0.205, 0.205)); attach(P, p.head, ub(0.06, 0.012, 0.01, 0), "#1E1E1E", 0, 0.21, 0.21); }
  if(src.act === "eat" || src.route){   // 식판 (먹는 동안 앞에, 들고 갈 때는 손에)
    const front = (src.j > 4 && src.j < 4.2) || (src.j > 6.6);
    const tv = () => src.act === "eat" && sit(), sc = 1 / 0.78;
    if(src.zn === "meal"){ const g = new THREE.Object3D(); g.position.set(0, 0.52 * sc, 0.62 * sc); p.root.add(g);
      attach(P, g, ub(0.54 * sc, 0.025, 0.28 * sc, 0.01), "#E4E0D8", 0, 0, 0, tv); [[-0.15,"#FFFFFF"],[0,"#C98A55"],[0.15,"#E2603C"]].forEach(([x, col]) => attach(P, g, uc(0.07, 0.055, 0.05, 12), col, x * sc, 0.035, 0, tv));
      if(src.route){ const cv = () => !!src.carry && !sit(); attach(P, p.chest, ub(0.5, 0.025, 0.32, 0.01), "#E4E0D8", 0, 0.12, 0.34, cv); [[-0.12,"#FFFFFF"],[0.02,"#C98A55"],[0.14,"#E2603C"]].forEach(([x, col]) => attach(P, p.chest, uc(0.06, 0.05, 0.05, 10), col, x, 0.16, 0.34, cv)); } }
  }
}

/* ---------- 사람 자세 맞추기 ---------- */
const smooth = (cur, want, dt, k = 8) => cur + (want - cur) * Math.min(1, dt * k);
function seatHips(P, seatPx, rootY){ return (hz(seatPx) - rootY) / P.p.root.scale.y + 0.08; }
function prayHands(p, u = 1){ p.arms.forEach((a, k) => { const s = k ? -1 : 1; a.sh.rotation.set(-0.7 * u, 0, s * 0.3 * u + s * 0.07 * (1 - u)); a.el.rotation.set(-1.35 * u, 0, -s * 0.5 * u); }); p.head.rotation.x = 0.22 * u; }
function legsForward(p, hipY){ p.hips.position.y = hipY; p.legs.forEach((l, k) => { l.hip.rotation.set(-PI / 2 + 0.08, (k ? 1 : -1) * 0.08, 0); l.knee.rotation.set(0.12, 0, 0); }); }
function crossLegs(p){ p.hips.position.y = 0.17; p.legs.forEach((l, k) => { const s = k ? 1 : -1; l.hip.rotation.order = "YXZ"; l.hip.rotation.set(-1.42, s * 0.85, 0); l.knee.rotation.set(2.55, 0, 0); }); }
function kneel(p){ p.hips.position.y = 0.6; p.legs.forEach(l => { l.hip.rotation.set(-0.12, 0, 0); l.knee.rotation.set(1.45, 0, 0); }); }
function poseOne(it, S, t, tm, dt){
  const {P, src} = it, p = P.p, id = src.id, a = src.act, ph = src.phase || 0, red = S.reduce;
  const sit = src.pose === "sit", walk = src.pose === "walk", ry = p.root.position.y;
  const o = {ph:P.ph};
  if(walk){ o.step = P.step; K.pose(p, "walk", t, o); if(src.carry){ p.arms.forEach(q => { q.sh.rotation.x = -0.75; q.el.rotation.x = -0.75; }); } return; }
  if(src.lying){ K.pose(p, "stand", t, o); p.chest.rotation.x = 0.42; p.head.rotation.x = -0.15; p.arms.forEach((q, k) => q.sh.rotation.z = (k ? -1 : 1) * 0.18); return; }
  if(id === "kneel"){ K.pose(p, "stand", t, o); kneel(p); prayHands(p); return; }
  if(src.legs === "cross"){ K.pose(p, "sit", t, o); crossLegs(p);
    if(a === "arms"){ const up = red || Math.sin(tm * 0.0025 + ph) > -0.3; it.u = smooth(it.u || 0, up ? 1 : 0, dt, 6); p.arms.forEach((q, k) => { const s = k ? -1 : 1; q.sh.rotation.set(-0.2 * it.u - 0.4 * (1 - it.u), 0, s * (0.35 + 2.45 * it.u)); q.el.rotation.set(-0.3 * (1 - it.u), 0, s * 0.3 * it.u); }); p.head.rotation.x = -0.1 * it.u; }
    else p.arms.forEach((q, k) => { const s = k ? -1 : 1; q.sh.rotation.set(-0.45, 0, s * 0.42); q.el.rotation.set(-0.35, 0, 0); });
    return; }
  if(sit){
    const floorSit = src.kid && SEAT[id] == null;
    if(a === "eat"){ const v = (tm * 0.0011 + ph) % 1; o.sip = v < 0.32 && !red; o.u = o.sip ? Math.sin(PI * v / 0.32) : 0; }
    if(a === "cup"){ const v = (tm * 0.0007 + ph) % 1; o.sip = v < 0.22 && !red; o.u = o.sip ? Math.sin(PI * v / 0.22) : 0; }
    if(a === "pad" || a === "book" || a === "doze" || a === "clip") o.phone = true;
    K.pose(p, "sit", t, o);
    if(floorSit) legsForward(p, Math.max(0.12, seatHips(P, (src.z || 0) + 2, ry) - 0.04));
    else p.hips.position.y = Math.max(0.35, seatHips(P, (SEAT[id] ?? 12), ry));
    if(a === "book") p.head.rotation.x = 0.3;
    if(a === "doze") p.head.rotation.x = red ? 0.5 : 0.48 + Math.sin(t * 1.3 + P.ph) * 0.12;
    if(a === "clip") p.head.rotation.x = 0.18;
    if(PRAY.has(id) || (id === "pvisit")) prayHands(p);
    return; }
  // 서 있는 사람
  if(a === "clip" || a === "sing"){ o.phone = true; }
  if(a === "preach") o.wave = !red && Math.sin(tm * 0.0016 + ph) > 0.55;
  if(a === "clap") o.wave = !red && Math.sin(tm * 0.009 + ph) > 0.3;
  if(src.pit) o.wave = !red && Math.sin(tm * 0.004 + ph) > 0.4;
  if(src.toastUntil && tm < src.toastUntil) o.wave = true;
  K.pose(p, "stand", t, o);
  if(a === "sing"){ p.head.rotation.x = 0.12; p.head.rotation.z = red ? 0 : Math.sin(t * 1.4 + P.ph) * 0.05; }
  if(a === "clip") p.head.rotation.x = 0.15;
  if(a === "curl"){ const up = red || Math.sin(tm * 0.003 + ph) > 0; it.u = smooth(it.u || 0, up ? 1 : 0, dt, 9); p.arms[1].sh.rotation.set(-0.25, 0, -0.12); p.arms[1].el.rotation.set(-0.2 - 2.05 * it.u, 0, 0); }
  if(a === "ladle"){ const k = red ? 0 : Math.sin(tm * 0.004 + ph); p.arms[1].sh.rotation.set(-0.6 + k * 0.18, 0, -0.15); p.arms[1].el.rotation.set(-0.75, 0, 0); }
  if(a === "paddle"){ const sw = red ? 0 : Math.sin(tm * 0.0039 + ph); p.arms[1].sh.rotation.set(-0.55 + sw * 0.35, 0, -0.45); p.arms[1].el.rotation.set(-0.7, sw * 0.4, 0); }
  if(a === "water"){ p.arms[1].sh.rotation.set(-0.65, 0, -0.12); p.arms[1].el.rotation.set(-0.35, 0, 0); }
  if(a === "shelve"){ P.up = !red && src.wait > 0 && Math.sin(tm * 0.004 + ph) > 0; it.u = smooth(it.u || 0, P.up ? 1 : 0, dt, 9); p.arms[1].sh.rotation.set(-0.2 * it.u, 0, -0.07 - 2.75 * it.u); p.arms[1].el.rotation.set(0, 0, -0.2 * it.u); p.head.rotation.x = -0.25 * it.u; }
}
/* 2D 시뮬레이션 → 3D 사람 */
function syncPeople(S, t, tm, dt){
  const near = (q, r) => { let best = null, bd = r; S.people.forEach(o => { if(o.hidden || o === q) return; const d = Math.hypot(o.i - q.i, o.j - q.j); if(d < bd){ bd = d; best = o; } }); return best; };
  W.plist.forEach(it => {
    const {P} = it, src = it.src, root = P.p.root;
    let vis = !!src && !src.hidden;
    if(it.visitor) vis = vis && (it.id === "_yuna" ? S.yOn : S.nOn);
    else if(S.night && !src.pit && !src.lying) vis = false;
    if(root.visible !== vis){ root.visible = vis; it.last = null; }
    if(!vis) return;
    let y = hz(src.z || 0);
    if(src.id === "run") y = hz(6);
    if(src.pit) y = hz(-7 + (S.reduce ? 0 : Math.sin(tm * 0.004 + (src.phase || 0)) * 2));
    const kidHop = (src.kid || it.visitor === "kid") && src.pose === "walk" && !S.reduce ? Math.abs(Math.sin(tm * (it.id === "_yuna" ? 0.016 : 0.013) + (src.phase || 0))) * hz(it.id === "_yuna" ? 4.2 : 2.6) : 0;
    const x = K.X(src.i), z = K.Z(src.j);
    if(src.lying){ root.position.set(K.X(33.4), hz(8) + 0.12, K.Z(7.15)); root.rotation.order = "YXZ"; root.rotation.set(-PI / 2, -PI / 2, 0); P.heading = -PI / 2; poseOne(it, S, t, tm, dt); return; }
    const lx = it.last ? it.last[0] : x, lz = it.last ? it.last[1] : z, dx = x - lx, dz = z - lz, moved = Math.hypot(dx, dz);
    root.position.set(x, y + kidHop, z); it.last = [x, z];
    if(moved > 1e-4 && moved < 1){ P.step = (P.step || 0) + moved * 6.4 / root.scale.y * 0.78; K.turnTo(P, Math.atan2(dx, dz), dt, 10); }
    else {
      if(src.id === "run" && !S.reduce) P.step = (P.step || 0) + dt * 7;
      let want = null;
      const rh = ROUTE_HEAD[src.id]; if(rh && src.route && src.wait > 0) want = rh[src.ri];
      if(want == null && HEAD[src.id] != null && !src.route && !src.circle) want = HEAD[src.id];
      if(src.show && src.hd != null) want = src.hd;   // 고객 시사 손님: 앉으면 스크린, PD는 손님 쪽
      if(it.visitor){ const q = near(src, 1.7); if(q) want = Math.atan2(K.X(q.i) - x, K.Z(q.j) - z); }
      if(src.sway) want = HEAD[src.id];
      if(want != null) K.turnTo(P, want, dt, 6);
    }
    poseOne(it, S, t, tm, dt);
    const sayTx = S.say(src); if(sayTx && !(P.pri > K.clock())){ P.say = sayTx; P.sayUntil = K.clock() + 400; }
    if(!it.visitor){ const d = S.txt(src.desc); if(P.info.task !== d) P.info.task = d; }
    else P.info.task = src.desc || src.line || "";
  });
}

/* ---------- 매 프레임: 움직이는 물건 ---------- */
const m4 = new THREE.Matrix4(), qn = new THREE.Quaternion(), v3 = new THREE.Vector3(), sc3 = new THREE.Vector3(), col = new THREE.Color(), e3 = new THREE.Euler();
function fxSet(k, x, y, z, sx, sy, sz, c){ if(k >= W.fxN) return; if(sx <= 0){ W.fm.setMatrixAt(k, m4.makeScale(0, 0, 0)); return; } m4.compose(v3.set(x, y, z), qn.identity(), sc3.set(sx, sy, sz)); W.fm.setMatrixAt(k, m4); W.fm.setColorAt(k, col.set(c)); }
function boxSet(k, x, y, z, sx, sy, sz, c, ry = 0, rz = 0){ if(sx <= 0){ W.xm.setMatrixAt(k, m4.makeScale(0, 0, 0)); return; } e3.set(0, ry, rz); qn.setFromEuler(e3); m4.compose(v3.set(x, y, z), qn, sc3.set(sx, sy, sz)); W.xm.setMatrixAt(k, m4); W.xm.setColorAt(k, col.set(c)); }
function animate(S, t, tm, dt){
  const dk = !!K.R.dark, red = !S || S.reduce, on = id => !!S?.eggOn(id);
  // 엘리베이터 문 (2D와 같은 조건으로 열림)
  const kk = red ? 1 : Math.min(1, dt * 5); W.doorA += (Math.max(S?.doors.a || 0, K.yuNear?.(13.45, 17.1, 1.5) ? 1 : 0) - W.doorA) * kk; W.doorB += ((S?.doors.b || 0) - W.doorB) * kk;
  const leaf = dk ? "#8A8E94" : "#C9CDD2"; let bx = 0;
  [[16.6,17.6,W.doorA],[17.8,18.8,W.doorB]].forEach(([a, b, o]) => { const m = (a + b) / 2, gap = (b - a) / 2 * Math.min(1, o) * 0.94;
    [[a, m - gap],[m + gap, b]].forEach(([p0, p1]) => boxSet(bx++, K.X(12.95), hz(28), K.Z((p0 + p1) / 2), 0.03, hz(56), Math.max(0.001, p1 - p0), leaf)); });
  // 블록 (w_blocks 누르면 와르르)
  const BL = on("w_blocks") ? [[31.8,10.2,0,"#F25F5C"],[32.55,10.1,0,"#5E9BEA"],[32.3,10.4,0,"#FFA552"],[32.1,10.75,0,"#FFE066"],[32.65,10.6,0,"#70C1B3"]] : [[32.1,10.3,0,"#F25F5C"],[32.42,10.32,0,"#5E9BEA"],[32.2,10.62,0,"#FFE066"],[32.25,10.4,5,"#70C1B3"],[32.3,10.42,10,"#FFA552"]];
  BL.forEach(([i, j, z0, c], k) => boxSet(bx++, K.X(i + 0.15), hz(z0 + 2.5), K.Z(j + 0.15), 0.3, hz(5), 0.3, c, on("w_blocks") ? k * 0.4 : 0));
  // 물컵 (w_water) · 슬레이트 막대 (w_clap)
  boxSet(bx++, K.X(8.3), hz(18), K.Z(0.6), on("w_water") ? 0.2 : 0, hz(6), 0.2, "#FFFFFF");
  { const ang = on("w_clap") ? 0.37 : 0, L = 0.36; boxSet(bx++, K.X(18.82) + Math.cos(ang) * L / 2, hz(17.25) + Math.sin(ang) * L / 2, K.Z(6.565), L, hz(1.5), 0.03, "#FFFFFF", 0, ang); }
  // 인형뽑기 집게
  { const ci = 28.45 + (red ? 0 : Math.sin(tm * 0.0009) * 0.18), cz = 52 - (red ? 0 : Math.max(0, Math.sin(tm * 0.0013)) * 10), top = 64;
    boxSet(bx++, K.X(ci), hz((top + cz) / 2), K.Z(1.75), 0.012, hz(top - cz), 0.012, "#9EA4AB");
    boxSet(bx++, K.X(ci), hz(cz), K.Z(1.75), 0.09, hz(2.5), 0.09, "#D2D6DB");
    [-1, 1].forEach(s => boxSet(bx++, K.X(ci + s * 0.05), hz(cz - 2.5), K.Z(1.75), 0.015, hz(5), 0.05, "#D2D6DB", 0, s * 0.35)); }
  while(bx < W.xN) boxSet(bx++, 0, 0, 0, 0);
  W.xm.instanceMatrix.needsUpdate = true; if(W.xm.instanceColor) W.xm.instanceColor.needsUpdate = true;

  // 구 (탁구공 · 김 · 팝콘 · 물방울 · 물뿌리개 · 빈백 · 새 · 비둘기)
  let f = 0;
  { const u = red ? 0.3 : (tm % 3200) / 3200, fw = u < 0.5, h = fw ? 2 * u : 2 * u - 1, ff = fw ? h : 1 - h, pa = S?.people.find(q => q.id === "pp1"), pb = S?.people.find(q => q.id === "pp2");
    const j1 = pa ? pa.j : 4.3, j2 = pb ? pb.j : 4.3, i = 24.75 + (27.85 - 24.75) * ff, j = j1 + (j2 - j1) * ff;
    const zz = h < 0.72 ? 22 + (16 - 22) * (h / 0.72) + 12 * Math.sin(PI * h / 0.72) : 16 + 6 * ((h - 0.72) / 0.28) + 6 * Math.sin(PI * (h - 0.72) / 0.28);
    const vis = S && !S.night; fxSet(f++, K.X(i), hz(zz) + 0.06, K.Z(j), vis ? 0.06 : 0, 0.06, 0.06, "#FFFFFF"); }
  for(let k = 0; k < 4; k++){ const ph = (tm * 0.0005 + k / 4) % 1, r = (2.4 + 3.4 * ph) / 31.3 * 0.5 * (1 - ph * ph * ph);   // 김: 2.5D는 반투명 동그라미라 3D에선 작게
    fxSet(f++, K.X([5.2, 1.3, 5.2, 2.3][k] + (red ? 0 : Math.sin(ph * 6 + k) * 0.06)), hz(24 + 24 * ph), K.Z(1.05), red ? 0 : r, r, r, "#FFFFFF"); }
  for(let k = 0; k < 6; k++){ const ph = (tm * 0.0012 + k / 6) % 1, pop = on("w_popcorn");
    fxSet(f++, K.X(11.6 + (k % 3) * 0.15), hz(28 + 14 * Math.sin(PI * ph)), K.Z(6.3 + (k > 2 ? 0.25 : 0.05)), pop ? 0.055 : 0, 0.05, 0.055, "#FFF1C2"); }
  for(let k = 0; k < 4; k++){ const ph = (tm * 0.003 + k / 4) % 1; fxSet(f++, K.X(8.3), hz(27 - 6 * ph), K.Z(0.62), on("w_water") ? 0.035 : 0, 0.045, 0.035, "#6EB9EB"); }
  { const g = S?.people.find(q => q.id === "gard"), P = g && K.R.people.gard, vis = g && P && P.p.root.visible && g.wait > 0 && !red;
    if(vis) P.p.arms[1].el.updateMatrixWorld(true);
    for(let k = 0; k < 3; k++){ const ph = (tm * 0.002 + k / 3) % 1; if(vis){ v3.set(0, -0.27, 0.42).applyMatrix4(P.p.arms[1].el.matrixWorld); fxSet(f++, v3.x, v3.y - ph * 0.45, v3.z, 0.025, 0.035, 0.025, "#78BEE6"); } else fxSet(f++, 0, 0, 0, 0); } }
  { const sq = on("w_bean"), c0 = "#B07CFF"; fxSet(f++, K.X(21.0), 0.17 * (sq ? 0.62 : 1), K.Z(5.9), 0.42 * (sq ? 1.15 : 1), 0.2 * (sq ? 0.62 : 1), 0.42 * (sq ? 1.15 : 1), K.shade(c0, -0.18)); fxSet(f++, K.X(21.0), 0.3 * (sq ? 0.62 : 1), K.Z(5.87), 0.34 * (sq ? 1.15 : 1), 0.153 * (sq ? 0.62 : 1), 0.34 * (sq ? 1.15 : 1), c0); }
  { const b = on("w_tree"), hop = red ? 0 : Math.abs(Math.sin(tm * 0.012)) * 0.06, x = K.X(29.7), z = K.Z(0.8) + 0.25, y = hz(62) + hop;
    fxSet(f++, x, y, z, b ? 0.075 : 0, 0.065, 0.09, "#5E9BEA"); fxSet(f++, x, y + 0.07, z + 0.07, b ? 0.05 : 0, 0.05, 0.05, "#5E9BEA"); fxSet(f++, x, y + 0.065, z + 0.125, b ? 0.022 : 0, 0.018, 0.03, "#FFB547"); }
  { const g = on("w_cross") ? (tm - W.crossT0) / 2800 : -1; if(on("w_cross") && W.crossT0 < 0) W.crossT0 = tm; if(!on("w_cross")) W.crossT0 = -1;
    const vis = g >= 0 && g <= 1, x = K.X(0.4 + g * 1.2), y = hz(105 + g * 40), z = K.Z(14.5), fl = Math.sin(tm * 0.03) * 0.5;
    fxSet(f++, x, y, z, vis ? 0.09 : 0, 0.07, 0.12, "#FFFFFF"); [-1, 1].forEach(s => fxSet(f++, x, y + 0.03, z + s * 0.12, vis ? 0.05 : 0, 0.015, 0.11 + fl * 0.04, "#FFFFFF")); }
  while(f < W.fxN) fxSet(f++, 0, 0, 0, 0);
  W.fm.instanceMatrix.needsUpdate = true; if(W.fm.instanceColor) W.fm.instanceColor.needsUpdate = true;

  // 전구 (깜빡임 · 파티 모드 · 샹들리에 무지개 · 촛불 · 스탠드)
  const cam = K.R.camera, party = on("w_lights"), rainbow = on("w_chand"), lampOff = on("w_lamp");
  W.bulbs.forEach((b, k) => { let c = b.c, s = b.r, a = 1;
    if(b.kind === "str"){ const tw = party ? 0.5 + 0.5 * Math.sin(tm * 0.02 + 2.1 * b.k + b.q) : 0.65 + 0.35 * Math.sin(tm * 0.004 + 1.7 * b.k + b.q); a = red ? 1 : (dk || party ? tw : 0.85 + 0.15 * tw);
      if(party) c = col.set(RB[(Math.floor(tm / 160) + b.k) % 6]); b.tw = tw; }
    if(b.kind === "ch"){ const tw = 0.75 + 0.25 * Math.sin(tm * 0.004 + 1.3 * b.k + b.q); a = dk && !red ? tw : 1; if(rainbow) c = col.set(RB[(Math.floor(tm / 180) + b.k) % 6]); else c = col.set(dk ? "#FFE2A8" : "#FFD27A"); b.tw = tw; }
    if(b.kind === "flame"){ const fl = red ? 0 : Math.sin(tm * 0.02 + b.q) * 0.7; m4.compose(b.p, qn.identity(), sc3.set(0.022, 0.05 + fl * 0.01, 0.022)); W.bm.setMatrixAt(k, m4); W.bm.setColorAt(k, col.set("#FF9A2E")); return; }
    if(b.kind === "lamp"){ m4.compose(b.p, qn.identity(), sc3.set(0.17, 0.12, 0.17)); W.bm.setMatrixAt(k, m4); W.bm.setColorAt(k, col.set(lampOff ? "#B9B2A4" : "#F6E7BC")); return; }
    m4.compose(b.p, qn.identity(), sc3.setScalar(s)); W.bm.setMatrixAt(k, m4); W.bm.setColorAt(k, (c === b.c ? col.copy(b.c) : c).multiplyScalar(a)); });
  W.bm.instanceMatrix.needsUpdate = true; if(W.bm.instanceColor) W.bm.instanceColor.needsUpdate = true;
  // 빛 번짐
  W.glows.forEach((g, k) => { let a;
    if(g.bulb != null){ const b = W.bulbs[g.bulb]; a = b.kind === "str" ? (dk || party ? 0.5 * (b.tw || 1) : 0) : (dk || rainbow ? 0.4 * (b.tw || 1) : 0); col.copy(b.kind === "ch" && rainbow ? new THREE.Color(RB[(Math.floor(tm / 180) + b.k) % 6]) : party && b.kind === "str" ? new THREE.Color(RB[(Math.floor(tm / 160) + b.k) % 6]) : g.c); }
    else { a = g.a(S, tm, dk); col.copy(g.c); }
    if(g.candle && !red) a *= 0.85 + 0.15 * Math.sin(tm * 0.02 + k);
    if(!(a > 0)){ W.gm.setMatrixAt(k, m4.makeScale(0, 0, 0)); return; }
    const s = g.s * (g.candle && on("w_candle") ? 28 / 13 : 1);
    m4.compose(g.p, cam.quaternion, sc3.set(s, s, 1)); W.gm.setMatrixAt(k, m4); W.gm.setColorAt(k, col.multiplyScalar(Math.min(1, a))); });
  W.gm.instanceMatrix.needsUpdate = true; if(W.gm.instanceColor) W.gm.instanceColor.needsUpdate = true;
  // 파라솔 (w_parasol 빙글)
  if(on("w_parasol") && !red) W.parasol.rotation.y += dt * 6;
  // 빔
  W.beam.material.opacity = dk ? 0.07 : 0.1;
  // 냥이
  const C = S?.cat, ct = W.cat;
  if(!C){ ct.sleep.visible = ct.stand.visible = false; }
  else { const wag = tm < (C.wagUntil || 0), sl = C.pose === "sleep" && !wag && !on("w_cat"), m = sl ? ct.sleep : ct.stand, o = sl ? ct.stand : ct.sleep;
    o.visible = false; m.visible = true;
    const x = K.X(C.i), z = K.Z(C.j);
    if(ct.lx != null){ const dx = x - ct.lx, dz = z - ct.lz; if(Math.hypot(dx, dz) > 1e-4) ct.h = Math.atan2(dx, dz); } ct.lx = x; ct.lz = z;
    ct.ry = ct.ry == null ? ct.h : ct.ry + Math.atan2(Math.sin(ct.h - ct.ry), Math.cos(ct.h - ct.ry)) * Math.min(1, dt * 8);
    const hop = C.pose === "walk" && !red ? Math.abs(Math.sin(tm * 0.02)) * hz(1.6) : 0;
    m.position.set(x, hop, z); m.rotation.y = ct.ry; }
  // 2D 그림판 (초당 20번)
  if(tm - W.dLast > 50 || W.dLast < 0){ W.dLast = tm; const c = W.dctx; c.clearRect(0, 0, DW, DH);
    W.dyn.forEach(d => { c.save(); c.beginPath(); c.rect(d.r.x, d.r.y, d.r.w, d.r.h); c.clip(); c.translate(d.r.x, d.r.y); d.draw(c, d.r.w, d.r.h, S, tm); c.restore(); });
    W.dtex.needsUpdate = true; }
}

/* 떠오르는 음표 · z (2.5D처럼 글자로) */
function fxText(S, tm){
  const R = K.R, far = R.layer.classList.contains("far"), items = [];
  if(S && !far){
    const n = S.eggOn("w_piano") ? 5 : 2;
    for(let k = 0; k < n; k++){ const ph = (tm * 0.0005 + k / n) % 1; items.push({p:[0.4, 9.75 + Math.sin(ph * 6 + k) * 0.25, 32 + 36 * ph], t:k % 2 ? "♪" : "♫", a:1 - ph, c:S.eggOn("w_piano") ? RB[k % 6] : (R.dark ? "#E9D2B0" : "#8B5A3C"), s:10}); }
    if(!S.night) S.people.forEach(p => { const P = R.people[p.id]; if(!P || !P.p.root.visible) return;
      if(p.act === "sing" && !S.reduce){ const ph = (tm * 0.00045 + p.phase) % 1; if(ph < 0.6) items.push({p:[p.i + 0.1 + ph * 0.25, p.j - 0.1, 66 + ph * 18], t:ph < 0.3 ? "♪" : "♫", a:1 - ph / 0.6, c:R.dark ? "#E9D2B0" : "#8B5A3C", s:9}); }
      if(p.act === "doze" && !S.reduce) for(let k = 0; k < 3; k++){ const ph = (tm * 0.00045 + k / 3 + p.phase) % 1; items.push({p:[p.i + 0.2 + ph * 0.25, p.j, 50 + ph * 18 + k * 3], t:"z", a:(1 - ph) * 0.9, c:"#6E7DB4", s:7 + k * 2}); } });
    const C = S.cat; if(C && C.pose === "sleep" && !S.eggOn("w_cat") && !S.reduce){ const ph = (tm * 0.0004) % 1; items.push({p:[C.i + 0.3 + ph * 0.2, C.j - 0.2, 14 + ph * 12], t:"z", a:(1 - ph) * 0.8, c:"#6E7DB4", s:8}); }
  }
  while(W.fxEl.length < items.length){ const e = document.createElement("span"); e.className = "t3-emo"; e.style.fontWeight = "700"; R.layer.append(e); W.fxEl.push(e); }
  W.fxEl.forEach((e, k) => { const it = items[k]; if(!it){ e.style.opacity = 0; return; }
    v3.set(K.X(it.p[0]), hz(it.p[2]), K.Z(it.p[1])).project(R.camera); if(v3.z > 1){ e.style.opacity = 0; return; }
    if(e.textContent !== it.t) e.textContent = it.t; e.style.color = it.c; e.style.fontSize = it.s * (R.w < 600 ? 1 : 1.15) + "px"; e.style.opacity = Math.max(0, it.a);
    e.style.transform = `translate(${(v3.x * 0.5 + 0.5) * R.w}px,${(-v3.y * 0.5 + 0.5) * R.h}px) translate(-50%,-50%)`; });
}

/* ---------- 층 정의 ---------- */
const def = {
  id:"wf",
  zones:WF_Z,
  outline:[[0,0],[WI,0],[WI,CH],[GI,CH],[GI,GJ],[0,GJ]],
  ext:[0, 0, WI, GJ],
  top:3.9,
  allPts:V => [V(-0.25,0,-0.25),V(WI,0,-0.25),V(WI,-0.4,CH),V(GI,-0.4,GJ),V(-0.25,-0.4,GJ),V(-0.25,4.3,-0.25),V(GI,4.3,-0.25),V(-0.25,4.0,GJ),V(WI,3.2,0)],
  lamps:[[5.5,4.5,3.0],[15.4,4.0,3.0],[6.0,14.5,3.0],[19.6,15.0,3.0],[26.0,16.0,3.0],[32.4,4.0,2.9]],
  glow:{color:0xFF5FA8, at:[24.3,3.0,1.6]},
  eggs:[],
  people:[],
  paintFloor(c, dark){ paintFloor(c, dark); },
  build(KIT){
    K = KIT; LG.length = 0;
    W = {plist:[], recolor:[], lanc:[], dyn:[], dgeo:[], dA:{x:2, y:2, row:0}, dLast:-1, doorA:0, doorB:0, crossT0:-1, fxEl:[]};
    const S = sim();
    // 사람 목록 = 2D 시뮬레이션 사람 그대로 (+ 유나 · 노라)
    const L = l => ({...l, style:l.style === "cap" ? "short" : l.style});
    def.people = !S ? [] : [
      ...S.people.map(p => ({id:p.id, name:p.name, role:p.role || S.zones[p.zn].name, task:S.txt(p.desc), hex:S.zones[p.zn].hex, look:L(p.look),
        build:p.kid ? {h:0.62, w:0.92} : {h:1, w:1}, headphones:!!p.headphones, at:[p.i, p.j], face:HEAD[p.id] ?? 0})),
      ...[S.yuna, S.nora].filter(Boolean).map(v => ({id:v.id, name:v.name, role:v.role, task:v.desc, hex:v.hex, look:L(v.look), build:v.kid ? {h:0.74, w:0.9} : {h:0.97, w:0.88}, at:[v.i, v.j], face:0}))];
    // 이스터에그 = 타워 WF_EGGS (찾은 수 · 🥚 표시는 타워가 셈)
    def.eggs = !S ? [] : [...S.eggs.map(src => ({id:src.id, emo:src.emo, lines:src.lines, get at(){ return src.at; }, say:(k, g, line) => sim()?.egg(src.id) || line})),
      {id:"_up", at:[12.95, 17.1, 40], emo:["🛗","⬆️"], lines:["▲"], elev:"up"},     // 오른쪽 문 = 위층 (2026-11-22 감독님)
      {id:"_dn", at:[12.95, 18.3, 40], emo:["🛗","⬇️"], lines:["▼"], elev:"down"}];  // 왼쪽 문 = 아래층
    buildShell(); buildMeal(); buildCinema(); buildGame(); buildGarden(); buildKids(); buildChurch(); buildHall(); buildGym(); buildLib(); buildLamps();
    buildDynamic();
  },
  init(KIT){
    const R = KIT.R, S = sim(); if(!S) return;
    if(!document.getElementById("f3wf-css")){ const st = document.createElement("style"); st.id = "f3wf-css";
      st.textContent = ".f3w .t3-tag.wq:not(.on){opacity:0;pointer-events:none}"; document.head.append(st); }
    UB = KIT.rbox(1, 1, 1, 0); UC = KIT.cyl(1, 1, 1, 14); UT = KIT.cyl(0.8, 1, 1, 14); UF = KIT.cyl(1, 0.82, 1, 14); US = KIT.sph(1, 12, 8);
    S.people.forEach(src => { const P = R.people[src.id]; if(!P) return; W.plist.push({P, src, id:src.id}); if(!src.tag) P.tag.classList.add("wq"); dressUp(P, src); });
    [S.yuna, S.nora].forEach(v => { const P = v && R.people[v.id]; if(P) W.plist.push({P, src:v, id:v.id, visitor:v.kid ? "kid" : "adult"}); });
    if(R.people._nora?.tablet) R.people._nora.tablet.visible = false;
    LG.forEach(g => g.dispose()); LG.length = 0;
  },
  tick(KIT, now, t, dt){
    const S = sim(), tm = S ? S.now : now;
    if(S) syncPeople(S, t, tm, dt);
    animate(S, t, tm, dt);
    fxText(S, tm);
  },
  theme(KIT, dark){
    if(!W) return; W.lancDraw?.(dark);
    W.recolor.forEach(m => { const u = m.geometry.userData, a = m.geometry.attributes.color; if(u && u.L && a){ a.array.set(dark ? u.D : u.L); a.needsUpdate = true; } });
  },
};
export default def;
