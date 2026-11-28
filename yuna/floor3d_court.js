/* 스포츠센터 실내 테니스장 3D (2026-11-28 감독님 "수영장 따로 만들라고 올림픽 규격으로. 체육관을 만들란 소리잖아") — tower3d_floor.js 층 정의, 유나 모드로만 감
   크레용 스포츠센터(floor3d_gym.js) 50m 수영장 오른쪽 문으로 나오면 여기 왼쪽 문 (0.35, 13). 실내: 벽·천장 조명, 비 와도 침. 칸 i 0~31 · j 0~26, 1칸 ≈ 1.28 m (유나 키 1칸)
   코트는 실제 규격: 복식 23.77 × 10.97 m (18.57 × 8.57칸), 단식 폭 8.23 m, 서비스 라인은 네트에서 6.40 m, 네트 가운데 0.914 m · 기둥 1.07 m
   코트는 j 방향으로 길게: 유나 쪽은 +j (카메라 쪽), 상대는 −j. 철망은 먼 쪽·옆은 높게(3 m), 카메라 쪽은 낮게 (인형집처럼)
   - 왼쪽: 관리실 · 자판기 · 벽치기 연습 벽 · 음수대 · 등나무 쉼터 · 라켓 바구니
   - 오른쪽: 3단 관중석 · 나무
   - 먼 쪽 철망 밖: 점수판 (게임이 COURT.board()로 고침)
   유나 막기: 철망·네트는 W.extraBoxes (첫 tick에 엔진 목록에 더함). 네트 줄은 양옆 철망까지 막아서 상대 코트로 못 넘어감 (먼 쪽 문으로는 감)
   깜빡임 방지: 같은 쪽을 보는 면이 겹치지 않게 띄우고, 바닥에 붙는 것은 그림(paintFloor)으로 */
import * as THREE from "three";

const PI = Math.PI;
const rnd = k => { const v = Math.sin(k * 12.9898 + 3.71) * 43758.5453; return v - Math.floor(v); };
const EXT = [-0.6, -0.6, 31.6, 26.6];
/* 코트 (실제 규격, 칸) */
const CT = {ci:19.0, cj:13.4, hl:9.285, dw:4.285, sw:3.215, sl:5.0, post:5.0};
const BL0 = CT.cj - CT.hl, BL1 = CT.cj + CT.hl;                         // 먼 쪽 · 가까운 쪽 베이스라인
const FN = {i0:11.4, i1:26.6, j0:1.2, j1:25.6, hi:74, lo:30};            // 철망 · 높이 (px)
const DOORS = [[8.2, 9.8], [17.0, 18.6]];                                // 왼쪽 철망 문 (먼 쪽 · 가까운 쪽 코트)
const NET = {i0:CT.ci - CT.post, i1:CT.ci + CT.post, zc:28.4 * 0.786, zp:26.0 * 1.0};   // 네트 가운데 0.714칸(22px) · 기둥 0.836칸(26px)
const GATE = [0.35, 13.0], SPAWN = [1.3, 13.0, PI / 2];
const CART = [12.55, 20.9];                                              // 공 바구니 (테니스 치기)
const WALLP = {i0:5.4, i1:10.6, j:0.75, z:82};                           // 벽치기 연습 벽
const KIOSK = {i0:0.5, i1:4.0, j0:0.5, j1:3.8};
const BLEACH = {i0:27.35, j0:6.6, j1:20.2, d:0.86, n:3};
const CEIL = [5.0, 13.0, 19.0, 25.0].flatMap(i => [5.0, 13.4, 21.4].map(j => [i, j]));   // 천장 긴 등
const RB = ["#F4A7B9", "#F9C99B", "#F6E39A", "#A8DCC8", "#A9CBEA", "#C8B4D0"];

let K = null, W = null;
const X = i => K.X(i), Z = j => K.Z(j), hz = p => K.hz(p);
const H = px => px / 31.1;
const D = (l, d) => [l, d];
const B = (i, j, w, d, h, col, z0 = 0, o = {}) => K.B(i, j, w, d, h, col, z0, o);
const PINK = D("#E8B5C8", "#7A5866"), LILAC = D("#C8B4D0", "#5E4E68"), PAPER = D("#FAF7F2", "#3A3632"), WHITE = D("#FFFFFF", "#8A847C"),
  WOOD = D("#D9B98F", "#6B5440"), WOODD = D("#A98258", "#4E3C2C"), SPROUT = D("#4DAA97", "#2F6E62"), AMBER = D("#E8A04A", "#9A6A2E"),
  GREEN = D("#2F5E4E", "#1E3A32"), GREEN2 = D("#3E7461", "#27463C"), POST = D("#2E4F44", "#5A7068"), STONE = D("#E6DFD2", "#4A4640"),
  CREAM = D("#FFF8EE", "#4C4640"), TEAL = D("#3A8A78", "#2A5E54"), INK = "#2A2A28";
const LG = [];
function rod(a, b, r, col, cls = "s", seg = 8){
  const A = new THREE.Vector3(X(a[0]), hz(a[2]), Z(a[1])), C2 = new THREE.Vector3(X(b[0]), hz(b[2]), Z(b[1])), len = A.distanceTo(C2); if(len < 1e-4) return;
  const o = K.sm(K.cyl(r, r, len, seg), col, (A.x + C2.x) / 2, (A.y + C2.y) / 2, (A.z + C2.z) / 2, null, cls); o.lookAt(C2); o.rotateX(PI / 2); return o;
}
const ball = (i, j, zp, r, col, cls = "m", seg = 12) => K.sm(K.sph(r, seg, Math.max(6, seg * 0.75 | 0)), col, X(i), hz(zp), Z(j), null, cls);
const disc = (i, j, r, zp, hp, col, cls = "m", seg = 24) => { const Hh = Math.max(0.006, hz(hp)); return K.sm(K.cyl(r, r, Hh, seg), col, X(i), hz(zp) + Hh / 2, Z(j), null, cls); };
const egg = (id, at, emo, lines) => ({id, at, emo, lines});
const gl = (i, j, zp, rpx, col, a) => { const o = {p:new THREE.Vector3(X(i), hz(zp), Z(j)), s:rpx / 31.3 * 2, c:new THREE.Color(col), a}; W.glows.push(o); return o; };

/* ---------- 바닥 그림 ---------- */
function paintKit(c, dark){
  const v = (l, d) => dark ? d : l, FS = K.FS;
  const rect = (i0, j0, i1, j1, col) => { c.fillStyle = col; c.fillRect(i0, j0, i1 - i0, j1 - j0); };
  const rr = (i0, j0, i1, j1, r, col) => { c.fillStyle = col; c.beginPath(); c.roundRect(i0, j0, i1 - i0, j1 - j0, r); c.fill(); };
  const line = (i0, j0, i1, j1, col, w = 0.02) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(i0, j0); c.lineTo(i1, j1); c.stroke(); };
  const text = (t, i, j, size, col, w = 800, fam = K.FONT) => { c.save(); c.translate(i, j); c.scale(1 / FS, 1 / FS); c.font = `${w} ${size / 31.3 * FS}px ${fam}`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = col; c.fillText(t, 0, 0); c.restore(); };
  const glow = (i, j, r, c0) => { const g = c.createRadialGradient(i, j, 0, i, j, r); g.addColorStop(0, c0); g.addColorStop(1, "rgba(255,240,210,0)"); c.fillStyle = g; c.beginPath(); c.arc(i, j, r, 0, 7); c.fill(); };
  return {v, rect, rr, line, text, glow};
}
function paintCourt(c, dark){
  const p = paintKit(c, dark), v = p.v;
  // 실내 바닥 (밝은 우레탄) · 문에서 들어오는 매트 길
  p.rect(EXT[0], EXT[1], EXT[2], EXT[3], v("#E9E3D8", "#4A453F"));
  const pl = v("rgba(120,100,70,.10)", "rgba(0,0,0,.25)");
  for(let i = Math.ceil(EXT[0]); i < EXT[2]; i += 1) p.line(i, EXT[1], i, EXT[3], pl, 0.012);
  const pc = v("#D8CDBB", "#5A5147");
  p.rect(EXT[0], 12.35, 10.7, 13.65, pc); p.rect(9.6, 7.6, 11.45, 19.2, pc);
  p.rr(26.7, 4.6, 31.3, 6.4, 0.3, pc); p.rr(26.7, 20.4, 31.3, 22.2, 0.3, pc); p.rect(26.75, 6.4, 27.3, 20.4, pc);
  // 벽치기 연습장 (초록 바닥 + 네트 높이 흰 줄은 벽에)
  p.rect(5.2, WALLP.j + 0.15, 10.8, 7.0, v("#7CB8A0", "#2F4E44")); p.rect(5.2, 4.5, 10.8, 4.56, v("rgba(255,255,255,.9)", "rgba(230,230,230,.5)"));
  p.text("연습", 8.0, 5.6, 6.5, v("rgba(255,255,255,.55)", "rgba(230,230,230,.25)"));
  // 쉼터 카펫 · 관리실 바닥
  p.rr(0.8, 16.0, 5.4, 20.8, 0.3, v("#C9DCD4", "#36443F")); p.rect(KIOSK.i0, KIOSK.j0, KIOSK.i1, KIOSK.j1, v("#E9E1D2", "#47433D"));
  // 코트 바깥 (철망 안) · 코트 안 · 줄 (실제 규격)
  p.rect(FN.i0, FN.j0, FN.i1, FN.j1, v("#7CB8A0", "#2F4E44"));
  p.rect(CT.ci - CT.dw, BL0, CT.ci + CT.dw, BL1, v("#6E98CF", "#2C3E5E"));
  const lc = v("#FFFFFF", "rgba(236,236,236,.82)"), thin = 0.039, thick = 0.078;
  const ln = (i0, j0, i1, j1, w) => p.rect(Math.min(i0, i1) - (i0 === i1 ? w / 2 : 0), Math.min(j0, j1) - (j0 === j1 ? w / 2 : 0), Math.max(i0, i1) + (i0 === i1 ? w / 2 : 0), Math.max(j0, j1) + (j0 === j1 ? w / 2 : 0), lc);
  [BL0, BL1].forEach(j => ln(CT.ci - CT.dw, j, CT.ci + CT.dw, j, thick));
  [CT.ci - CT.dw, CT.ci + CT.dw, CT.ci - CT.sw, CT.ci + CT.sw].forEach(i => ln(i, BL0, i, BL1, thin));
  [CT.cj - CT.sl, CT.cj + CT.sl].forEach(j => ln(CT.ci - CT.sw, j, CT.ci + CT.sw, j, thin));
  ln(CT.ci, CT.cj - CT.sl, CT.ci, CT.cj + CT.sl, thin);
  ln(CT.ci, BL0, CT.ci, BL0 + 0.08, thin); ln(CT.ci, BL1 - 0.08, CT.ci, BL1, thin);   // 센터 마크
  p.rect(CT.ci - 0.03, CT.cj - 0.02, CT.ci + 0.03, CT.cj + 0.02, v("rgba(0,0,0,.08)", "rgba(0,0,0,.2)"));
  p.text("CREYONG TENNIS", CT.ci, BL1 + 1.45, 9, v("rgba(255,255,255,.5)", "rgba(230,230,230,.18)"));
  p.text("크레용 스포츠센터 테니스장", CT.ci, BL0 - 1.4, 7.0, v("rgba(255,255,255,.45)", "rgba(230,230,230,.16)"));
  // 관중석 아래
  p.rect(BLEACH.i0 - 0.05, BLEACH.j0 - 0.05, BLEACH.i0 + BLEACH.d * BLEACH.n + 0.25, BLEACH.j1 + 0.05, v("#DCD2C4", "#46413C"));
  p.text("← 50m 수영장", 1.9, 14.15, 4.6, v("rgba(110,90,70,.45)", "rgba(220,210,190,.25)"));
  if(dark) CEIL.forEach(([i, j]) => p.glow(i, j, 3.2, "rgba(225,240,255,.14)"));
}

/* ---------- 나무 · 벤치 · 가로등 ---------- */
function roundTree(i, j, s = 1){
  K.sm(K.cyl(0.07 * s, 0.1 * s, hz(30 * s), 8), D("#7A5A3C", "#4A3828"), X(i), hz(15 * s), Z(j), null, "m");
  const g = [D("#8CC478", "#34502E"), D("#A9D48E", "#3E5A38"), D("#7FB86E", "#2E4A2E")];
  [[0, 0, 50, 0.62], [-0.36, 0.1, 42, 0.44], [0.36, -0.06, 43, 0.46], [0.05, 0.34, 40, 0.42], [0, -0.3, 45, 0.4], [0.02, 0.02, 64, 0.4]].forEach(([di, dj, z, r], k) => ball(i + di * s, j + dj * s, z * s, r * s, g[k % 3], "m", 14));
}
function bush(i, j, s = 1){ const col = D("#7FB86E", "#2E4A2E"); [[0, 0, 0.32], [0.26, 0.05, 0.24], [-0.25, 0.04, 0.24]].forEach(([di, dj, r], k) => ball(i + di * s, j + dj * s, r * 31 * s * 0.55, r * s, k ? K.sh(col, 0.1) : col, "m", 10).scale.y = 0.8); }
function bench(ci, cj, face, len = 1.5){
  const sl = D("#D9A877", "#6B4E34"), along = face === "-j" || face === "+j";
  if(along){ const i0 = ci - len / 2, bk = face === "-j" ? 1 : -1;
    [i0 + 0.12, i0 + len - 0.18].forEach(i => { B(i, cj - 0.2, 0.06, 0.4, 12, POST, 0, {r:0, cls:"s"}); B(i, cj + bk * 0.2 - 0.03, 0.06, 0.06, 28, POST, 0, {r:0, cls:"s"}); });
    for(let k = 0; k < 3; k++) B(i0, cj - 0.2 + k * 0.137, len, 0.12, 1.8, sl, 12, {r:0.02});
    [17, 23].forEach(z => B(i0, cj + bk * 0.2 - 0.04, len, 0.08, 4.5, sl, z, {r:0.02}));
  } else { const j0 = cj - len / 2, bk = face === "-i" ? 1 : -1;
    [j0 + 0.12, j0 + len - 0.18].forEach(j => { B(ci - 0.2, j, 0.4, 0.06, 12, POST, 0, {r:0, cls:"s"}); B(ci + bk * 0.2 - 0.03, j, 0.06, 0.06, 28, POST, 0, {r:0, cls:"s"}); });
    for(let k = 0; k < 3; k++) B(ci - 0.2 + k * 0.137, j0, 0.12, len, 1.8, sl, 12, {r:0.02});
    [17, 23].forEach(z => B(ci + bk * 0.2 - 0.04, j0, 0.08, len, 4.5, sl, z, {r:0.02})); }
}
function lamp(i, j){
  const P = D("#5B6662", "#8A8F8A");
  K.sm(K.cyl(0.032, 0.05, hz(64), 10), P, X(i), hz(32), Z(j), null, "s"); disc(i, j, 0.1, 0, 2.2, P, "s", 14);
  K.sm(K.cyl(0.11, 0.08, hz(13), 12), D("#FFF6DC", "#FFE3A8"), X(i), hz(70.5), Z(j), null, "glow");
  K.sm(K.cyl(0.025, 0.16, hz(5), 12), P, X(i), hz(79.5), Z(j), null, "s");
  gl(i, j, 70, 34, "#FFD9A0", (tm, dk) => dk ? 0.75 : 0);
}
function flowerPot(i, j, col){ disc(i, j, 0.24, 0, 11, PINK, "m", 16); disc(i, j, 0.2, 11, 1.5, D("#8A6A4C", "#3A2C22"), "m", 14);
  for(let k = 0; k < 6; k++){ const a = k / 6 * PI * 2; ball(i + Math.cos(a) * 0.12, j + Math.sin(a) * 0.12, 15 + (k % 2) * 3, 0.07, col, "m", 8); } ball(i, j, 18, 0.08, "#FFF4C2", "m", 8); }

/* ---------- 철망 (실선 기둥 · 가로대 + 마름모 철망 그림) ---------- */
function meshDecal(i0, j0, i1, j1, z0, z1, axis){
  const len = Math.hypot(i1 - i0, j1 - j0), hgt = hz(z1 - z0), PXW = 34, wpx = Math.max(8, Math.round(len * PXW)), hpx = Math.max(8, Math.round(hgt * PXW));
  K.decal(wpx, hpx, (c, w, h, dark) => { c.clearRect(0, 0, w, h); c.strokeStyle = dark ? "rgba(150,190,175,.42)" : "rgba(38,74,62,.5)"; c.lineWidth = 0.9; const s = 6.5; c.beginPath();
      for(let x = -h; x < w + h; x += s){ c.moveTo(x, 0); c.lineTo(x + h, h); c.moveTo(x + h, 0); c.lineTo(x, h); } c.stroke(); },
    len, hgt, axis, (i0 + i1) / 2, (j0 + j1) / 2, hz((z0 + z1) / 2));
}
function fenceRun(i0, j0, i1, j1, zt, axis, posts = true){
  const len = Math.hypot(i1 - i0, j1 - j0), n = Math.max(1, Math.round(len / 3.0)), alongI = j0 === j1;
  if(posts) for(let k = 0; k <= n; k++){ const i = i0 + (i1 - i0) * k / n, j = j0 + (j1 - j0) * k / n; K.sm(K.cyl(0.035, 0.035, hz(zt + 2), 8), POST, X(i), hz(zt + 2) / 2, Z(j), null, "s"); }
  [zt, zt * 0.5, 1.5].forEach(z => { const o = K.sm(K.cyl(0.018, 0.018, len, 6), POST, X((i0 + i1) / 2), hz(z), Z((j0 + j1) / 2), null, "s"); o.rotation.z = alongI ? PI / 2 : 0; if(!alongI) o.rotation.x = PI / 2; });
  meshDecal(i0, j0, i1, j1, 1.5, zt, axis);
  W.extraBoxes.push(alongI ? [X(i0), Z(j0) - 0.05, X(i1), Z(j0) + 0.05, 0, hz(zt)] : [X(i0) - 0.05, Z(j0), X(i0) + 0.05, Z(j1), 0, hz(zt)]);
}
function buildFence(){
  // 먼 쪽: 높은 철망 + 아래쪽 초록 바람막이 (글씨)
  fenceRun(FN.i0, FN.j0, FN.i1, FN.j0, FN.hi, "i");
  B(FN.i0 + 0.05, FN.j0 - 0.06, FN.i1 - FN.i0 - 0.1, 0.03, 34, GREEN2, 1.5, {r:0});
  K.wtext("CREYONG TENNIS CLUB", CT.ci, FN.j0 - 0.02, 20, "i", 7.5, D("#E9F5EF", "#BFE0D2"), null, 800, K.FONT);
  [[CT.ci - 5.5], [CT.ci + 5.5]].forEach(([i]) => K.wtext("🎾", i, FN.j0 - 0.02, 19, "i", 8, D("#FFFFFF", "#DDEEDD"), null, 700, K.FONT));
  // 옆: 높은 철망 (왼쪽은 문 두 개)
  const segL = [[FN.j0, DOORS[0][0]], [DOORS[0][1], DOORS[1][0]], [DOORS[1][1], FN.j1]];
  segL.forEach(([a, b]) => fenceRun(FN.i0, a, FN.i0, b, FN.hi, "j"));
  DOORS.forEach(([a, b]) => { [a, b].forEach(j => K.sm(K.cyl(0.05, 0.05, hz(FN.hi + 4), 8), POST, X(FN.i0), hz(FN.hi + 4) / 2, Z(j), null, "s"));
    const o = K.sm(K.cyl(0.02, 0.02, b - a, 6), POST, X(FN.i0), hz(66), Z((a + b) / 2), null, "s"); o.rotation.x = PI / 2;
    // 열어 둔 문짝 (바깥쪽으로 젖혀 둠)
    const dj = b - a - 0.1, dg = new THREE.Group(); dg.position.set(X(FN.i0), 0, Z(a + 0.05)); dg.rotation.y = -1.25; K.root.add(dg);
    [[0, 0], [dj, 0]].forEach(([z]) => K.sm(K.cyl(0.016, 0.016, hz(60), 6), POST, 0, hz(32), z, dg, "s"));
    [6, 62].forEach(zz => { const r2 = K.sm(K.cyl(0.014, 0.014, dj, 6), POST, 0, hz(zz), dj / 2, dg, "s"); r2.rotation.x = PI / 2; }); });
  fenceRun(FN.i1, FN.j0, FN.i1, FN.j1, FN.hi, "-j");
  // 카메라 쪽: 낮은 철망
  fenceRun(FN.i0, FN.j1, FN.i1, FN.j1, FN.lo, "i");
}
/* ---------- 네트 · 심판 의자 · 벤치 · 공 바구니 ---------- */
function buildNet(){
  const j = CT.cj, i0 = NET.i0, i1 = NET.i1;
  [i0, i1].forEach(i => { K.sm(K.cyl(0.04, 0.045, hz(NET.zp + 1), 10), D("#26463C", "#5A7068"), X(i), hz(NET.zp + 1) / 2, Z(j), null, "s"); ball(i, j, NET.zp + 1.5, 0.05, D("#26463C", "#5A7068"), "s", 8);
    B(i - 0.07, j - 0.03, 0.14, 0.06, 5, D("#26463C", "#5A7068"), 8, {r:0.02, cls:"s"}); });   // 손잡이 상자
  // 네트 그물: 가운데가 처진 모양 (판 여러 개)
  const N = 20, zAt = u => { const t = Math.abs(u - 0.5) * 2; return NET.zc + (NET.zp - NET.zc) * t * t; };
  K.decal(Math.round((i1 - i0) * 40), 40, (c, w, h, dark) => { c.clearRect(0, 0, w, h); c.strokeStyle = dark ? "rgba(200,210,215,.38)" : "rgba(30,36,40,.55)"; c.lineWidth = 0.8; c.beginPath();
      for(let x = 0; x <= w; x += 3.2){ c.moveTo(x, 0); c.lineTo(x, h); } for(let y = 0; y <= h; y += 3.2){ c.moveTo(0, y); c.lineTo(w, y); } c.stroke(); },
    i1 - i0, hz(NET.zc - 3) * 0.98, "i", CT.ci, j - 0.012, hz(3 + (NET.zc - 3) / 2));
  K.decal(Math.round((i1 - i0) * 40), 40, (c, w, h, dark) => { c.clearRect(0, 0, w, h); c.strokeStyle = dark ? "rgba(200,210,215,.38)" : "rgba(30,36,40,.55)"; c.lineWidth = 0.8; c.beginPath();
      for(let x = 0; x <= w; x += 3.2){ c.moveTo(x, 0); c.lineTo(x, h); } for(let y = 0; y <= h; y += 3.2){ c.moveTo(0, y); c.lineTo(w, y); } c.stroke(); },
    i1 - i0, hz(NET.zc - 3) * 0.98, "-i", CT.ci, j + 0.012, hz(3 + (NET.zc - 3) / 2));
  for(let k = 0; k < N; k++){ const u0 = k / N, u1 = (k + 1) / N, a = i0 + (i1 - i0) * u0, b = i0 + (i1 - i0) * u1, za = zAt((u0 + u1) / 2);   // 흰 띠 (위) · 처진 윗부분 그물
    B(a, j - 0.02, b - a + 0.005, 0.04, 1.6, D("#FFFFFF", "#CFCAC2"), za - 1.6, {r:0, cls:"s"});
    if(za > NET.zc + 0.3) B(a, j - 0.008, b - a, 0.016, za - NET.zc - 1.4, D("#3A4246", "#9AA4A8"), NET.zc - 0.2, {r:0, cls:"glass"}); }
  B(CT.ci - 0.025, j - 0.026, 0.05, 0.052, NET.zc - 1.4, D("#FFFFFF", "#CFCAC2"), 0, {r:0, cls:"s"});   // 가운데 띠 (센터 스트랩)
  B(i0, j - 0.01, i1 - i0, 0.02, 1.4, D("#FFFFFF", "#CFCAC2"), 2.0, {r:0});                              // 아래 줄
  W.extraBoxes.push([X(FN.i0), Z(j) - 0.06, X(FN.i1), Z(j) + 0.06, 0, hz(NET.zp)]);                       // 네트 줄: 옆 철망까지 막음
}
function buildChair(){   // 심판 의자 (네트 왼쪽 밖, +i를 봄)
  const i = 12.7, j = CT.cj, col = D("#3E7461", "#27463C");
  [[-0.32, -0.3], [0.32, -0.3], [-0.32, 0.3], [0.32, 0.3]].forEach(([di, dj]) => rod([i + di * 0.7, j + dj, 0], [i + di * 0.45, j + dj * 0.7, 52], 0.028, col, "s", 6));
  [14, 28, 42].forEach(z => B(i - 0.14 - (1 - z / 52) * 0.06, j - 0.22, 0.04, 0.44, 1.4, col, z, {r:0, cls:"s"}));   // 사다리 발판 (−i 쪽)
  B(i - 0.3, j - 0.32, 0.6, 0.64, 2.5, WOOD, 52, {r:0.03}); B(i - 0.3, j - 0.32, 0.08, 0.64, 18, WOOD, 54.5, {r:0.03});
  [-0.31, 0.27].forEach(dj => B(i - 0.3, j + dj, 0.5, 0.04, 9, WOOD, 54.5, {r:0.02}));
  B(i + 0.2, j - 0.36, 0.06, 0.72, 2, col, 62, {r:0.02});
  K.sm(K.cyl(0.11, 0.11, hz(1.2), 16), D("#2A2A28", "#55504A"), X(i - 0.18), hz(68), Z(j - 0.5), null, "s");   // 우산꽂이 대신 작은 확성기
  // 네트 양옆 빈자리: 아이스박스 · 선수 의자 둘 (넘어가지 못하는 자리를 물건으로)
  B(11.62, j - 0.3, 0.62, 0.5, 13, D("#5E9BEA", "#3A5E8A"), 0, {r:0.06}); B(11.62, j - 0.3, 0.62, 0.5, 3, WHITE, 13, {r:0.05});
  [[24.6, -0.55, "#E8A04A"], [24.6, 0.25, "#F4A7B9"], [25.6, -0.15, "#A8DCC8"]].forEach(([ci, dj, c]) => { const cc = D(c, K.sh(c, -0.35)[0] || c);
    [[0, 0], [0.42, 0], [0, 0.36], [0.42, 0.36]].forEach(([a, b]) => B(ci + a, j + dj + b, 0.04, 0.04, 13, POST, 0, {r:0, cls:"s"}));
    B(ci - 0.02, j + dj - 0.02, 0.48, 0.42, 2, cc, 13, {r:0.03}); B(ci + 0.4, j + dj - 0.02, 0.06, 0.42, 14, cc, 15, {r:0.02}); });
  ball(25.3, CT.cj + 0.75, 3.5, 0.11, D("#DDF24E", "#8A9A30"), "m", 10);   // 굴러온 공 하나
}
function buildBenches(){
  [[11.95, 10.8], [11.95, 16.0]].forEach(([i, j], k) => { bench(i, j, "+i", 1.4);
    // 가방 · 물병 · 수건
    B(i - 0.22, j - 1.15, 0.38, 0.26, 9, k ? PINK : TEAL, 0, {r:0.08}); B(i - 0.15, j - 1.12, 0.24, 0.2, 2, WHITE, 9, {r:0.06});
    [0.45, 0.62].forEach((dj, n) => { K.sm(K.cyl(0.045, 0.045, hz(10), 10), n ? D("#A9CBEA", "#4E6A88") : D("#F6E39A", "#8A7A3A"), X(i + 0.05), hz(13.8) + hz(5), Z(j + dj), null, "s");
      K.sm(K.cyl(0.028, 0.028, hz(2), 8), WHITE, X(i + 0.05), hz(24), Z(j + dj), null, "s"); });
    B(i - 0.12, j - 0.5, 0.28, 0.42, 0.8, k ? LILAC : D("#FFFFFF", "#8A847C"), 13.9, {r:0.03}); });
}
function buildCart(){   // 공 바구니 (바퀴 달린 철망 바구니 + 공 가득) · 옆 라켓 걸이
  const [i, j] = CART, col = D("#5B6662", "#8A8F8A");
  [[-0.24, -0.24], [0.24, -0.24], [-0.24, 0.24], [0.24, 0.24]].forEach(([di, dj]) => { rod([i + di, j + dj, 2], [i + di, j + dj, 24], 0.016, col, "s", 6); ball(i + di, j + dj, 2, 0.035, INK, "s", 6); });
  [8, 24].forEach(z => { B(i - 0.26, j - 0.26, 0.52, 0.02, 1, col, z, {r:0, cls:"s"}); B(i - 0.26, j + 0.24, 0.52, 0.02, 1, col, z, {r:0, cls:"s"}); B(i - 0.26, j - 0.26, 0.02, 0.52, 1, col, z, {r:0, cls:"s"}); B(i + 0.24, j - 0.26, 0.02, 0.52, 1, col, z, {r:0, cls:"s"}); });
  B(i - 0.25, j - 0.25, 0.5, 0.5, 1, col, 8, {r:0, cls:"s"});
  for(let k = 0; k < 26; k++){ const a = rnd(k) * 0.4 - 0.2, b = rnd(k + 40) * 0.4 - 0.2, z = 12 + (k / 26) * 13 + rnd(k + 9) * 2; ball(i + a, j + b, z, 0.075, D("#DDF24E", "#8A9A30"), "m", 8); }
  rod([i - 0.24, j + 0.24, 24], [i - 0.24, j + 0.4, 38], 0.014, col, "s", 6); rod([i + 0.24, j + 0.24, 24], [i + 0.24, j + 0.4, 38], 0.014, col, "s", 6); rod([i - 0.24, j + 0.4, 38], [i + 0.24, j + 0.4, 38], 0.014, col, "s", 6);
  // 라켓 걸이 (철망에 걸린 라켓 넷)
  ["#F28DB0", "#3A8A78", "#B79AD6", "#E8A04A"].forEach((c, k) => { const jj = 19.4 + k * 0.42, cc = D(c, c);
    const o = K.sm(new THREE.TorusGeometry(0.13, 0.016, 6, 18), cc, X(FN.i0 + 0.06), hz(46), Z(jj), null, "s"); o.rotation.y = PI / 2; o.scale.set(1, 1.25, 1);
    K.sm(K.cyl(0.018, 0.018, hz(14), 6), WHITE, X(FN.i0 + 0.06), hz(33), Z(jj), null, "s"); });
}
/* ---------- 점수판 (먼 쪽 철망 밖, 카메라를 봄) ---------- */
function buildBoard(){
  const i = CT.ci, j = 0.4, w = 5.2, h = hz(46), z0 = hz(80);
  [i - w / 2 + 0.3, i + w / 2 - 0.3].forEach(x => K.sm(K.cyl(0.06, 0.07, z0, 10), POST, X(x), z0 / 2, Z(j - 0.05), null, "s"));
  B(i - w / 2 - 0.12, j - 0.2, w + 0.24, 0.16, 50, D("#2A3A36", "#1E2A28"), 78, {r:0.05, cls:"s"});
  const cv = document.createElement("canvas"); cv.width = 520; cv.height = 230; const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({map:tex, toneMapped:false}));
  m.position.set(X(i), z0 + h / 2 + hz(2), Z(j) - 0.035); K.R.scene.add(m); W.board = {cv, tex, m, st:null}; drawBoard();
}
function drawBoard(){
  if(!W || !W.board) return; const {cv, tex} = W.board, c = cv.getContext("2d"), s = W.board.st || {a:"HOME", b:"GUEST", pa:"0", pb:"0", ga:0, gb:0, msg:"WELCOME"};
  c.fillStyle = "#16201E"; c.fillRect(0, 0, 520, 230); c.strokeStyle = "#3E7461"; c.lineWidth = 6; c.strokeRect(3, 3, 514, 224);
  c.font = `800 26px ${K.FONT}`; c.textBaseline = "middle"; c.textAlign = "center"; c.fillStyle = "#9FD8C4"; c.fillText("POINT", 330, 30); c.fillText("GAME", 452, 30);
  [[s.a, s.pa, s.ga, 82, s.sv === "a"], [s.b, s.pb, s.gb, 142, s.sv === "b"]].forEach(([n, pt, gm, y, sv]) => {
    c.textAlign = "left"; c.font = `800 38px ${K.FONT}`; c.fillStyle = "#FFFFFF"; c.fillText(n, 46, y);
    if(sv){ c.fillStyle = "#DDF24E"; c.beginPath(); c.arc(26, y, 9, 0, 7); c.fill(); }
    c.textAlign = "center"; c.font = `800 46px ${K.FONT}`; c.fillStyle = "#FFD27A"; c.fillText(pt, 330, y + 2); c.fillStyle = "#7FE0FF"; c.fillText(String(gm), 452, y + 2); });
  c.fillStyle = "#24322F"; c.fillRect(14, 180, 492, 38); c.font = `800 26px ${K.FONT}`; c.fillStyle = "#FFB6CF"; c.textAlign = "center"; c.fillText(s.msg || "", 260, 200);
  tex.needsUpdate = true;
}
/* ---------- 관리실 · 자판기 · 벽치기 벽 · 음수대 · 쉼터 · 관중석 ---------- */
function buildKiosk(){
  const {i0, i1, j0, j1} = KIOSK, wall = CREAM, roof = TEAL;
  B(i0, j0, i1 - i0, 0.14, 70, wall, 0, {r:0.02}); B(i0, j0, 0.14, j1 - j0, 70, wall, 0, {r:0.02});   // 뒷벽 · 옆벽 (인형집처럼 앞은 낮게)
  B(i1 - 0.14, j0, 0.14, j1 - j0, 34, wall, 0, {r:0.02}); B(i0, j1 - 0.14, i1 - i0, 0.14, 34, wall, 0, {r:0.02});
  B(i0 + 0.9, j1 - 0.16, 1.8, 0.2, 3, WOOD, 34, {r:0.02});   // 창구 턱
  B(i0 - 0.15, j0 - 0.15, i1 - i0 + 0.3, 0.5, 6, roof, 70, {r:0.03}); B(i1 - 0.35, j0 - 0.15, 0.5, j1 - j0 + 0.3, 6, roof, 70, {r:0.03});
  for(let k = 0; k < 7; k++) B(i0 + 0.1 + k * 0.5, j1 + 0.02, 0.5, 0.36, 3, k % 2 ? WHITE : D("#3A8A78", "#2A5E54"), 56, {r:0.02});   // 줄무늬 차양
  K.wtext("관리실", (i0 + i1) / 2, j1 + 0.4, 63, "i", 4.2, D("#2F7466", "#BFEDE0"), null, 800, K.FONT);
  // 안: 책상 · 의자 · 예약판 · 라켓 대여
  B(i0 + 0.4, j0 + 0.35, 1.6, 0.6, 17, WOOD, 0, {r:0.03}); B(i0 + 0.7, j0 + 1.15, 0.45, 0.45, 10, AMBER, 0, {r:0.05});
  B(i0 + 0.18, j0 + 0.16, 2.2, 0.03, 26, D("#FFFFFF", "#6A6660"), 30, {r:0});
  K.wtext("코트 예약 · 라켓 대여", i0 + 1.3, j0 + 0.2, 52, "i", 2.2, D("#3A3632", "#E6DED2"), null, 800, K.FONT);
  [0, 1, 2].forEach(r => [0, 1, 2, 3].forEach(cc => B(i0 + 0.3 + cc * 0.5, j0 + 0.19, 0.4, 0.01, 4, r === 1 && cc === 2 ? PINK : D("#A8DCC8", "#3E5E56"), 34 + r * 5, {r:0})));
  // 자판기 둘
  [[0.6, D("#E8607F", "#8A3A4A"), "음료"], [1.7, D("#5E9BEA", "#36588A"), "물"]].forEach(([di, c, t]) => { const i = i0 + di, j = 4.35;
    B(i, j, 0.95, 0.62, 56, c, 0, {r:0.04}); B(i + 0.08, j + 0.6, 0.8, 0.03, 26, D("#EAF4FA", "#5A6A78"), 24, {r:0, cls:"glass"});
    for(let r = 0; r < 3; r++) for(let k = 0; k < 4; k++) ball(i + 0.18 + k * 0.2, j + 0.55, 30 + r * 7, 0.045, RB[(r + k) % 6], "m", 8);
    B(i + 0.2, j + 0.6, 0.5, 0.04, 5, D("#2A2A28", "#55504A"), 9, {r:0.01}); K.wtext(t, i + 0.48, j + 0.64, 52, "i", 2.6, WHITE, null, 800, K.FONT); });
}
function buildWall(){
  const {i0, i1, j, z} = WALLP, c1 = D("#3E7461", "#27463C");
  B(i0, j - 0.25, i1 - i0, 0.3, z, c1, 0, {r:0.02});
  B(i0, j + 0.05, i1 - i0, 0.02, 1.6, WHITE, 22.2, {r:0});   // 네트 높이 흰 줄
  [[7.0, 46, 9], [9.1, 40, 7]].forEach(([i, zz, r]) => { K.sm(K.cyl(hz(r), hz(r), 0.01, 24), D("#F4A7B9", "#7A5866"), X(i), hz(zz), Z(j + 0.06), null, "m").rotation.x = PI / 2;
    K.sm(K.cyl(hz(r * 0.55), hz(r * 0.55), 0.01, 20), WHITE, X(i), hz(zz), Z(j + 0.065), null, "m").rotation.x = PI / 2; });
  K.wtext("벽치기 연습", (i0 + i1) / 2, j + 0.06, 70, "i", 4.0, D("#FFFFFF", "#DDEEDD"), null, 800, K.FONT);
  B(i0 - 0.05, j - 0.3, i1 - i0 + 0.1, 0.4, 3, D("#2F5E4E", "#1E3A32"), z, {r:0.02});
}
function buildRest(){
  // 음수대
  { const i = 3.0, j = 9.6; K.sm(K.cyl(0.14, 0.18, hz(26), 14), STONE, X(i), hz(13), Z(j), null, "m"); disc(i, j, 0.24, 26, 2.5, D("#C9CDD2", "#5A5E62"), "s", 16); K.sm(K.cyl(0.015, 0.015, hz(4), 6), D("#C9CDD2", "#5A5E62"), X(i + 0.05), hz(30), Z(j), null, "s"); }
  // 쉼터 (카펫 · 벤치 · 수건함)
  B(0.9, 20.9, 1.2, 0.45, 18, D("#FFFFFF", "#5A5752"), 0, {r:0.04}); for(let k = 0; k < 3; k++) B(0.98 + k * 0.36, 20.95, 0.3, 0.3, 4, D(RB[k + 2], K.sh(RB[k + 2], -0.4)[0] || RB[k + 2]), 18 + (k % 2) * 4, {r:0.06});
  bench(2.3, 17.35, "+i", 1.5); bench(2.3, 19.45, "+i", 1.5);
}
function buildBleachers(){
  const {i0, j0, j1, d, n} = BLEACH;
  for(let k = 0; k < n; k++){ const i = i0 + k * d, z = 11 + k * 10;
    B(i, j0, d, j1 - j0, z - 2, D("#CFC6B6", "#4E4A44"), 0, {r:0.02});
    const m = Math.round((j1 - j0) / 0.7);
    for(let q = 0; q < m; q++){ const j = j0 + q * (j1 - j0) / m; B(i + 0.1, j + 0.06, d - 0.25, (j1 - j0) / m - 0.12, 2, D(RB[(q + k) % 6], K.sh(RB[(q + k) % 6], -0.45)[0] || RB[(q + k) % 6]), z - 2, {r:0.04}); } }
  B(i0 + n * d, j0, 0.14, j1 - j0, 50, D("#CFC6B6", "#4E4A44"), 0, {r:0.02});
  K.wtext("응원석", i0 + n * d + 0.0, (j0 + j1) / 2, 44, "-j", 3.6, D("#9A6A2E", "#FFD49A"), null, 800, K.FONT);
}
const WALL = D("#EEF2F3", "#3A3F42"), WALL2 = D("#DCE4E7", "#30363A");
const block = (i0, j0, i1, j1, zt) => W.extraBoxes.push([X(i0), Z(j0), X(i1), Z(j1), 0, hz(zt)]);
function buildGate(){   // 실내 벽 · 수영장 쪽 문 · 천장 조명
  const DJ = [12.0, 14.0];
  // 뒤 벽 (높게 · 창)
  B(EXT[0], EXT[1], EXT[2] - EXT[0], 0.3, 200, WALL, 0, {r:0.02}); block(EXT[0], EXT[1], EXT[2], EXT[1] + 0.3, 200);
  for(let i = 0.6; i < 30.5; i += 3.1){ if(i > 13.4 && i < 24.6) continue; B(i, EXT[1] + 0.29, 2.5, 0.03, 60, D("#BFE3F2", "#1E3448"), 124, {r:0, cls:"glass"}); }
  B(EXT[0], EXT[1] + 0.3, EXT[2] - EXT[0], 0.04, 6, TEAL, 194, {r:0});
  K.wtext("CREYONG SPORTS CENTER · TENNIS", 6.0, EXT[1] + 0.33, 176, "i", 4.6, D("#3A8A78", "#72C4AE"), null, 800, K.FONT);
  // 왼쪽 벽 (문 = 50m 수영장)
  [[EXT[1], 8.0, 140], [8.0, DJ[0], 60], [DJ[1], EXT[3], 60]].forEach(([a, b, h]) => { B(EXT[0], a, 0.3, b - a, h, WALL2, 0, {r:0.02}); block(EXT[0], a, EXT[0] + 0.3, b, h); });
  B(EXT[0], DJ[0], 0.3, DJ[1] - DJ[0], 18, TEAL, 60, {r:0.02});
  K.wtext("🏊 ← 50m 수영장", EXT[0] + 0.32, 13.0, 69, "j", 2.4, WHITE, null, 800, K.FONT);
  K.wtext("실내 테니스장", EXT[0] + 0.32, 10.0, 44, "j", 2.6, D("#2F7466", "#BFEDE0"), null, 800, K.FONT);
  K.wtext("비 와도 OK ☔ · 공·라켓 빌려 줘요", EXT[0] + 0.32, 10.0, 37, "j", 1.5, D("#8B5A3C", "#E9D2B0"), null, 700, K.FONT);
  // 오른쪽 벽
  [[EXT[1], 8.0, 140], [8.0, EXT[3], 60]].forEach(([a, b, h]) => { B(EXT[2] - 0.3, a, 0.3, b - a, h, WALL2, 0, {r:0.02}); block(EXT[2] - 0.3, a, EXT[2], b, h); });
  // 앞: 낮은 유리 난간
  B(EXT[0], EXT[3] - 0.12, EXT[2] - EXT[0], 0.12, 9, WALL2, 0, {r:0.02}); B(EXT[0], EXT[3] - 0.09, EXT[2] - EXT[0], 0.05, 26, D("#CFEAF5", "#2A4050"), 9, {r:0, cls:"glass"});
  block(EXT[0], EXT[3] - 0.15, EXT[2], EXT[3], 35);
  // 천장 긴 등 (밤에 켜짐)
  CEIL.forEach(([i, j]) => { B(i - 1.1, j - 0.12, 2.2, 0.24, 2, D("#FFFFFF", "#FFF4D8"), 186, {r:0.04, cls:"glow"}); gl(i, j, 184, 64, "#E6F2FF", (tm, dk) => dk ? 0.5 : 0); });
}

/* ---------- 유나 모드 ---------- */
const SEATS = [
  {a:[2.55, 16.7], b:[2.55, 18.0], h:PI / 2, H:H(13.8), k:"bench"}, {a:[2.55, 18.8], b:[2.55, 20.1], h:PI / 2, H:H(13.8), k:"bench"},
  {a:[12.2, 10.3], b:[12.2, 11.4], h:PI / 2, H:H(13.8), k:"bench"}, {a:[12.2, 15.5], b:[12.2, 16.6], h:PI / 2, H:H(13.8), k:"bench"},
  {a:[BLEACH.i0 + 0.42, BLEACH.j0 + 0.5], b:[BLEACH.i0 + 0.42, BLEACH.j1 - 0.5], h:-PI / 2, H:H(9), k:"stand"}];
export const COURT = {
  name:"스포츠센터 테니스장",
  gate:GATE, spawnGate:SPAWN,
  seats:SEATS,
  sitLines:{stand:["유나 화이팅~ 📣", "와 공 진짜 빠르다 🎾", "나도 저렇게 치고 싶다 😆", "아빠 잘한다~ 👏"]},
  use:[
    {at:CART, k:"tennis", h:PI, r:1.1},          // 공 바구니: 테니스 치기 (상대 고르기)
    {at:[8.0, 3.2], k:"wall", h:PI, r:1.6}],     // 벽치기 연습
  npc:{coach:[13.35, 21.6, -2.2]},
  /* 게임이 읽는 코트 치수 (칸) */
  court:{...CT, bl0:BL0, bl1:BL1, fence:FN, netZ:H(NET.zc), postZ:H(NET.zp), wall:{i0:WALLP.i0 + 0.2, i1:WALLP.i1 - 0.2, j:WALLP.j + 0.1, line:H(22.2)}},
  /* 점수판: {a, b, pa, pb, ga, gb, sv:"a"|"b", msg} · null이면 기본 */
  board(st){ if(!W || !W.board) return; W.board.st = st || null; drawBoard(); },
};

/* ---------- 층 정의 ---------- */
const def = {
  id:"court",
  zones:{
    ct_court:{name:"테니스 코트", color:"#6E98CF", rect:[FN.i0, FN.j0, FN.i1, FN.j1], label:[CT.ci, FN.j1, "bottom"]},
    ct_rest:{name:"쉼터 · 연습 벽", color:"#72C4AE", rect:[EXT[0], EXT[1], FN.i0, EXT[3]], label:[5.4, EXT[3], "bottom"]},
    ct_stand:{name:"응원석", color:"#E8A04A", rect:[FN.i1, EXT[1], EXT[2], EXT[3]], label:[29.1, EXT[3], "bottom"]}},
  outline:[[EXT[0], EXT[1]], [EXT[2], EXT[1]], [EXT[2], EXT[3]], [EXT[0], EXT[3]]],
  walk:[[EXT[0], EXT[1]], [EXT[2], EXT[1]], [EXT[2], EXT[3]], [EXT[0], EXT[3]]],
  ext:EXT,
  top:6.6,
  allPts:V => [V(EXT[0], 0, EXT[1]), V(EXT[2], 0, EXT[1]), V(EXT[2], 0, EXT[3]), V(EXT[0], 0, EXT[3]), V(EXT[0], 4.2, EXT[1]), V(EXT[2], 4.2, EXT[1]), V(CT.ci, 4.0, 0.4)],
  lamps:[[CT.ci, 7.0, 5.4], [CT.ci, 19.8, 5.4], [5.0, 9.0, 5.4], [29.0, 13.4, 3.0]],
  glow:{color:0xE6F2FF, at:[CT.ci, CT.cj, 3.0]},
  eggs:[],
  people:[],
  paintFloor(c, dark, KIT){ if(!K && KIT) K = KIT; paintCourt(c, dark); },
  build(KIT){
    K = KIT; LG.length = 0;
    W = {recolor:[], glows:[], extraBoxes:[]};
    def.eggs = [
      egg("ct_board", [CT.ci, 0.4, 104], ["🎾", "📟"], ["점수판이다! 테니스는 0점을 '러브'라고 해 💕", "15 · 30 · 40 다음이 게임이야 🎾"]),
      egg("ct_net", [CT.ci, CT.cj, 24], ["🥅", "📏"], ["네트 가운데가 양 끝보다 낮아 (91.4cm) 📏", "가운데 끈이 네트를 꾹 잡아 줘요"]),
      egg("ct_chair", [12.7, CT.cj, 70], ["🧑‍⚖️", "📣"], ["심판 의자! 여기 앉으면 '아웃!' 외칠 수 있어 📣"]),
      egg("ct_wall", [8.0, WALLP.j, 60], ["🧱", "💪"], ["벽은 절대 안 놓친대. 최고의 연습 상대 😆", "흰 줄이 네트 높이야"]),
      egg("ct_vend", [1.6, 4.6, 40], ["🥤", "🪙"], ["이온음료 한 캔 쭉~ 🥤", "자판기 불빛이 반짝반짝 ✨"]),
      egg("ct_light", [CT.ci, 13.4, 186], ["💡", "☔"], ["실내라서 비 와도 칠 수 있어 ☔", "천장 등이 공 그림자를 안 만들게 길게 달렸대"]),
      egg("ct_ball", [25.3, CT.cj + 0.75, 4], ["🎾", "🐾"], ["누가 공을 두고 갔네 🎾", "테니스공은 원래 형광 노랑이래"])];
    paintKitDone();
    buildFence(); buildNet(); buildChair(); buildBenches(); buildCart(); buildBoard(); buildKiosk(); buildWall(); buildRest(); buildBleachers(); buildGate();
    [[5.6, 12.0, "#F4A7B9"], [5.6, 14.0, "#C8B4D0"], [8.6, 14.0, "#F6E39A"], [10.6, 22.6, "#A9CBEA"], [26.9, 3.6, "#F9C99B"], [26.9, 23.4, "#F4A7B9"]].forEach(([i, j, c]) => flowerPot(i, j, c));
  },
  init(KIT){ LG.forEach(g => g.dispose()); LG.length = 0; },
  tick(KIT, now, t, dt){
    if(W.extraBoxes.length && KIT.R && KIT.R.boxes && !W.boxDone){ W.boxDone = true;   // 철망·네트 막기 상자를 엔진 목록에 더함
      KIT.R.boxes = Float32Array.from([...KIT.R.boxes, ...W.extraBoxes.flat()]); KIT.R.pg = null; } },
  theme(KIT, dark){ if(!W) return; W.recolor.forEach(m => { const u = m.geometry.userData, a = m.geometry.attributes.color; if(u && u.L && a){ a.array.set(dark ? u.D : u.L); a.needsUpdate = true; } }); },
};
function paintKitDone(){}
export default def;
