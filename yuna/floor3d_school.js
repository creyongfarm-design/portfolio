/* 크레용초등학교 3D (2026-11-24 감독님 "학교도 만들든가 사립초"): 유나(3학년 · 10살)가 다니는 기독교 사립초등학교.
   한 층짜리 구역. 뒤쪽 = 학교 건물 (인형집처럼 앞벽·칸막이는 낮게, 뒷벽은 높게), 앞쪽 = 운동장.
     건물 (왼→오른, j 0 ~ 7.2 교실 · j 7.2 ~ 9.6 복도): 급식실 · 도서관 · 3학년 1반 · 음악실 · 과학실 · 채플실
     운동장 (j 9.6 ~ 23.75): 빨간 트랙(타원) · 축구 골대 둘 · 철봉 · 구름사다리 · 정글짐 · 국기 게양대 · 느티나무 · 벤치 · 화단 · 스쿨버스 · 정문 · 경비실
   기독교 학교 (2026-11-24 코디 요청 "따뜻하고 은은하게"): 채플실(장의자 · 강대상 · 십자가 · 스테인드글라스 · 오르간), 시계탑 꼭대기 작은 십자가,
     교표 방패 안 작은 십자가, 교실 칠판 위 "서로 사랑하라", 도서관 성경책 자리, 음악실 찬양 포스터
   정문 (16, 23.3)에 닿으면 학교 앞 골목으로. 들어오면 (16, 22.5)에서 −j(학교 쪽)를 봄.
   좌표: 칸 i·j ≈ 3D 1:1, 높이는 px (hz = px/31.1). 유나 키 ≈ 1칸(1.28m) → 책상 17px(0.55) · 의자 10.5px(0.33) · 칠판 아래 22px(0.7)
   깜빡임 방지: 같은 쪽 보는 면이 겹치지 않게 0.01~0.02씩 띄움. 바닥에 붙는 것은 바닥 그림(paintFloor)으로 */
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const PI = Math.PI;
const AW = 32, RJ = 7.2, BJ = 9.6, TALL = 112, LOW = 34, T = 0.2, BT = 0.25, FJ = 23.75, DH = 58;   // 건물 폭 · 교실 앞벽 · 건물 앞벽 · 뒷벽 · 낮은 벽 · 울타리 · 문 높이
const EXT = [-1, -1.4, 33, 25.4];
const RM = {lunch:[0, 6], lib:[6, 10.5], cls:[10.5, 18.5], mus:[18.5, 23], sci:[23, 27.5], chp:[27.5, 32]};
const DOORS = [[2.4, 3.6, "급식실", "#E8A04A"], [7.6, 8.8, "도서관", "#4DAA97"], [10.9, 12.1, "3학년 1반", "#E8B5C8"], [16.9, 18.1, "3학년 1반", "#E8B5C8"],
  [20.2, 21.4, "음악실", "#C8B4D0"], [24.2, 25.4, "과학실", "#72C4AE"], [29.15, 30.35, "채플실", "#D9B98F"]];
const MAIN = [15.0, 17.0], WEST = [4.0, 5.2], GATE = [14.6, 17.4];
const TRK = {c:[16, 16.6], rx:8.6, ry:4.0, w:1.4};   // 트랙 가운데 줄 (타원) · 폭
const PAIRS = [12.45, 14.6, 16.75], ROWS = [2.75, 4.15, 5.55];   // 짝꿍 책상 가운데 i · 줄 j
const NAMES = [["하준", "서연"], ["민준", "하린"], ["도윤", "시우"], ["수아", "은우"], ["유나", "지유"], ["예준", "아린"], ["지호", "채원"], ["이안", "다은"], ["로아", "준서"]];
const MYDESK = [14.24, 4.15];
const FISH = [10.83, 3.2, 28];   // 금붕어 어항 (사물함 위)
const BALL0 = [21.0, 16.6];
const FLAGS = [[27.8, 118, "kr"], [29.1, 108, "sc"]];   // 깃대 i · 높이 px · 깃발
const RB = ["#F4A7B9", "#F9C99B", "#F6E39A", "#A8DCC8", "#A9CBEA", "#C8B4D0"];
const BOOK = ["#E8B5C8", "#C8B4D0", "#72C4AE", "#4DAA97", "#E8A04A", "#F6E39A", "#A9CBEA", "#F4A7B9", "#8B5A3C", "#3A8A78", "#6F82CF", "#E06A55", "#FAF7F2"];
const rnd = k => { const v = Math.sin(k * 12.9898) * 43758.5453; return v - Math.floor(v); };

let K = null, W = null;
const X = i => K.X(i), Z = j => K.Z(j), hz = p => K.hz(p);
const D = (l, d) => [l, d];
const B = (i, j, w, d, h, col, z0 = 0, o = {}) => K.B(i, j, w, d, h, col, z0, o);
const PINK = D("#E8B5C8", "#7A5866"), PINK2 = D("#F4D3DF", "#6A4E5A"), LILAC = D("#C8B4D0", "#5E4E68"), LILAC2 = D("#E2D6EA", "#4E4458"),
  SPROUT = D("#4DAA97", "#3A7A6E"), LEAF = D("#72C4AE", "#4E7A6E"), LEAF2 = D("#CDEBDF", "#3E5A50"), AMBER = D("#E8A04A", "#9A6A30"), AMBER2 = D("#FBE3BF", "#6A5434"),
  PAPER = D("#FAF7F2", "#3A3632"), WHITE = D("#FFFFFF", "#8A847C"), WOOD = D("#D9B98F", "#6B5440"), WOODD = D("#A98258", "#4E3C2C"), WOODL = D("#EBD6B5", "#7A6448"),
  CAPC = D("#FFFFFF", "#6A625C"), GOLD = D("#E8C36A", "#B8964A"), METAL = D("#7A8088", "#4A4E54"), METAL2 = D("#A9AFB6", "#5A5E64"), STEEL = D("#D8DDE2", "#6A7076"),
  SKY = D("#A9CBEA", "#4E6A88"), SKY2 = D("#DCEAF6", "#3E4A5A"), INK = "#2A2A28", NET = D("#FFFFFF", "#C9CDD2");
const PAST = [PINK, LEAF, LILAC, D("#F6E39A", "#8A7A3A"), SKY, D("#F9C99B", "#8A6A4C")];
const JUA = "Jua, \"IBM Plex Sans KR\", system-ui, sans-serif";
const LG = [];
const myGeo = g => { LG.push(g); return g; };

/* ---------- 기본 도구 (floor3d_home.js 그대로) ---------- */
function rod(a, b, r, col, cls = "s", seg = 8){
  const A = new THREE.Vector3(X(a[0]), hz(a[2]), Z(a[1])), C = new THREE.Vector3(X(b[0]), hz(b[2]), Z(b[1])), len = A.distanceTo(C); if(len < 1e-4) return;
  const o = K.sm(K.cyl(r, r, len, seg), col, (A.x + C.x) / 2, (A.y + C.y) / 2, (A.z + C.z) / 2, null, cls); o.lookAt(C); o.rotateX(PI / 2); return o;
}
const ball = (i, j, zp, r, col, cls = "m", seg = 12) => K.sm(K.sph(r, seg, Math.max(6, seg * 0.75 | 0)), col, X(i), hz(zp), Z(j), null, cls);
const disc = (i, j, r, zp, hp, col, cls = "m", seg = 24) => { const H = Math.max(0.006, hz(hp)); return K.sm(K.cyl(r, r, H, seg), col, X(i), hz(zp) + H / 2, Z(j), null, cls); };
/* 칸막이·앞벽 (낮은 벽 + 흰 뚜껑): wallI = j 고정, wallJ = i 고정. 끝끼리는 맞대기만 */
/* 학교 벽은 아래 판벽(민트) + 위 크림 두 색 (우리나라 학교 복도 느낌). lo = 아래 판벽 색 */
function wallI(i0, i1, j, col, h = LOW, lo = null){ if(i1 - i0 < 0.02) return; const z1 = lo ? 15 : 0; if(lo) B(i0, j - T / 2, i1 - i0, T, z1, lo, 0, {r:0}); B(i0, j - T / 2, i1 - i0, T, h - 1.6 - z1, col, z1, {r:0}); B(i0, j - T / 2 - 0.01, i1 - i0, T + 0.02, 1.6, CAPC, h - 1.6, {r:0}); }
function wallJ(j0, j1, i, col, h = LOW, lo = null){ if(j1 - j0 < 0.02) return; const z1 = lo ? 15 : 0; if(lo) B(i - T / 2, j0, T, j1 - j0, z1, lo, 0, {r:0}); B(i - T / 2, j0, T, j1 - j0, h - 1.6 - z1, col, z1, {r:0}); B(i - T / 2 - 0.01, j0, T + 0.02, j1 - j0, 1.6, CAPC, h - 1.6, {r:0}); }
const gaps = (a, b, gs) => { const out = []; let s = a; gs.forEach(([g0, g1]) => { out.push([s, g0]); s = g1; }); out.push([s, b]); return out; };
/* 문틀: 벽 높이까지만 (높으면 카메라가 걸림) */
const doorFrameI = (a, b, j, h = LOW) => { B(a - 0.02, j - 0.13, 0.08, 0.26, h, WHITE, 0, {r:0, cls:"s"}); B(b - 0.06, j - 0.13, 0.08, 0.26, h, WHITE, 0, {r:0, cls:"s"}); };
/* 창 (뒷벽 j = 0): 하늘 그림 + 흰 창틀 */
function winJ(i0, i1, z0, z1, view = "garden"){
  const ww = i1 - i0, wh = hz(z1 - z0);
  K.decal(Math.round(ww * 90), Math.round(wh * 90), (c, w, h, dark) => {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, dark ? "#1A2540" : "#BFE0F2"); g.addColorStop(1, dark ? "#33405E" : "#F2EAF2"); c.fillStyle = g; c.fillRect(0, 0, w, h);
    if(dark){ c.fillStyle = "#FFF4D6"; for(let k = 0; k < 9; k++){ c.globalAlpha = 0.4 + rnd(k + i0) * 0.6; c.fillRect(rnd(k * 3 + i0) * w, rnd(k * 7 + i0) * h * 0.6, 2, 2); } c.globalAlpha = 1;
      c.beginPath(); c.arc(w * 0.72, h * 0.22, h * 0.08, 0, 7); c.fill(); }
    else { c.fillStyle = "rgba(255,255,255,.9)"; [[0.3, 0.3, 0.12], [0.42, 0.26, 0.09], [0.75, 0.42, 0.08]].forEach(([x, y, r]) => { c.beginPath(); c.arc(w * x, h * y, h * r, 0, 7); c.fill(); }); }
    if(view === "garden"){ c.fillStyle = dark ? "#1E2B30" : "#9CC58A"; c.beginPath(); c.moveTo(0, h); c.quadraticCurveTo(w * 0.35, h * 0.62, w, h * 0.8); c.lineTo(w, h); c.fill();
      c.fillStyle = dark ? "#26322C" : "#6FAE64"; [[0.2, 0.74], [0.62, 0.78], [0.88, 0.7]].forEach(([x, y]) => { c.beginPath(); c.arc(w * x, h * y, h * 0.1, 0, 7); c.fill(); });
      c.fillStyle = dark ? "#3A2E3A" : "#F4C7D4"; [[0.62, 0.7], [0.66, 0.66], [0.2, 0.66]].forEach(([x, y]) => { c.beginPath(); c.arc(w * x, h * y, h * 0.035, 0, 7); c.fill(); }); }
    else { c.fillStyle = dark ? "#2A3048" : "#D9D2E6"; [[0.05, 0.55, 0.16], [0.25, 0.4, 0.14], [0.45, 0.6, 0.2], [0.7, 0.45, 0.14]].forEach(([x, y, ww2]) => c.fillRect(w * x, h * y, w * ww2, h)); }
    const s = c.createLinearGradient(w, 0, 0, h); s.addColorStop(0, "rgba(255,255,255,.25)"); s.addColorStop(0.4, "rgba(255,255,255,0)"); c.fillStyle = s; c.fillRect(0, 0, w, h);
  }, ww, wh, "i", (i0 + i1) / 2, 0.0, hz((z0 + z1) / 2));
  const fr = WHITE;
  B(i0 - 0.06, 0.012, 0.06, 0.07, z1 - z0 + 3, fr, z0 - 1.5, {r:0, cls:"s"}); B(i1, 0.012, 0.06, 0.07, z1 - z0 + 3, fr, z0 - 1.5, {r:0, cls:"s"});
  B(i0 - 0.06, 0.012, ww + 0.12, 0.076, 1.5, fr, z1 + 0.01, {r:0, cls:"s"}); B(i0 - 0.1, 0.012, ww + 0.2, 0.16, 1.8, fr, z0 - 1.8, {r:0, cls:"s"});
  B((i0 + i1) / 2 - 0.02, 0.012, 0.04, 0.05, z1 - z0, fr, z0, {r:0, cls:"s"});
}
/* 창 (왼벽 i = 0) */
function winI(j0, j1, z0, z1){
  const ww = j1 - j0, wh = hz(z1 - z0);
  K.decal(Math.round(ww * 90), Math.round(wh * 90), (c, w, h, dark) => {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, dark ? "#1A2540" : "#BFE0F2"); g.addColorStop(1, dark ? "#33405E" : "#F2EAF2"); c.fillStyle = g; c.fillRect(0, 0, w, h);
    if(dark){ c.fillStyle = "#FFF4D6"; for(let k = 0; k < 7; k++) c.fillRect(rnd(k * 3 + j0) * w, rnd(k * 7 + j0) * h * 0.7, 2, 2); }
    else { c.fillStyle = "rgba(255,255,255,.9)"; [[0.35, 0.35, 0.13], [0.5, 0.3, 0.1]].forEach(([x, y, r]) => { c.beginPath(); c.arc(w * x, h * y, h * r, 0, 7); c.fill(); }); }
    c.fillStyle = dark ? "#1E2B30" : "#9CC58A"; c.fillRect(0, h * 0.8, w, h * 0.2); }, ww, wh, "j", 0.0, (j0 + j1) / 2, hz((z0 + z1) / 2));
  B(0.012, j0 - 0.06, 0.07, 0.06, z1 - z0 + 3, WHITE, z0 - 1.5, {r:0, cls:"s"}); B(0.012, j1, 0.07, 0.06, z1 - z0 + 3, WHITE, z0 - 1.5, {r:0, cls:"s"});
  B(0.012, j0 - 0.06, 0.076, ww + 0.12, 1.5, WHITE, z1 + 0.01, {r:0, cls:"s"}); B(0.012, j0 - 0.1, 0.16, ww + 0.2, 1.8, WHITE, z0 - 1.8, {r:0, cls:"s"});
  B(0.012, (j0 + j1) / 2 - 0.02, 0.05, 0.04, z1 - z0, WHITE, z0, {r:0, cls:"s"});
}
function flowerStem(i, j, col, h){ rod([i, j, 0], [i, j, h], 0.01, D("#5FA582", "#3E6E54"), "m", 5); ball(i, j, h, 0.075, col, "m", 8); ball(i, j, h + 1, 0.032, "#FFF4C2", "m", 6); ball(i + 0.06, j, h * 0.45, 0.05, K.sh("plant", 0.1), "m", 6); }
function flowerPot(i, j, col, s = 1, pot = PINK, z0 = 0){
  B(i - 0.17 * s, j - 0.17 * s, 0.34 * s, 0.34 * s, 10 * s, pot, z0, {r:0.05});
  disc(i, j, 0.14 * s, z0 + 10 * s, 0.6, D("#7A5A3C", "#3A2A20"));
  [[0, 0, 22], [0.08, 0.05, 18], [-0.07, 0.06, 19], [0.04, -0.08, 17]].forEach(([di, dj, z], k) => { rod([i + di * s, j + dj * s, z0 + 10 * s], [i + di * 1.4 * s, j + dj * 1.4 * s, z0 + z * s], 0.008, D("#5FA582", "#3E6E54"), "m", 5);
    ball(i + di * 1.4 * s, j + dj * 1.4 * s, z0 + z * s, 0.055 * s, k % 2 ? "#FFFFFF" : col, "m", 8); });
  [[0.1, 0.1], [-0.1, 0.08], [0, -0.11]].forEach(([di, dj]) => ball(i + di * s, j + dj * s, z0 + 12.5 * s, 0.06 * s, K.sh("plant", 0.1), "m", 8));
}
/* 나무: blossom = 꽃 색 (벚나무 분홍 · 느티나무는 없음) */
function tree(i, j, s, blossom){
  K.sm(K.cyl(0.07 * s, 0.11 * s, hz(40 * s), 9), D("#8A6A4C", "#4A3828"), X(i), hz(20 * s), Z(j), null, "m");
  [[0, 0, 56, 0.55], [-0.3, 0.12, 48, 0.4], [0.3, 0.1, 49, 0.42], [0.05, -0.28, 50, 0.4], [0.08, 0.3, 46, 0.36], [0, 0.02, 68, 0.38], [-0.22, -0.2, 60, 0.3], [0.24, -0.12, 62, 0.3]].forEach(([di, dj, z, r], k) =>
    ball(i + di * s, j + dj * s, z * s, r * s, blossom ? (k % 2 ? D("#F7C6D4", "#6A4E5A") : D("#F2B0C4", "#7A5866")) : (k % 2 ? K.sh("plant", 0.14) : "plant"), "m", 14));
  if(!blossom) [[0.25, 0.2, 60], [-0.2, -0.15, 63], [0.1, 0.35, 52]].forEach(([di, dj, z]) => ball(i + di * s, j + dj * s, z * s, 0.05 * s, "#F6E39A", "m", 8));
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

/* ---------- 움직이는 그림판 (칠판 · 시계) ---------- */
const DW = 512, DHH = 256;
function dAlloc(w, h){ const A = W.dA; w = Math.ceil(w); h = Math.ceil(h); if(A.x + w + 2 > DW){ A.x = 2; A.y += A.row + 3; A.row = 0; } const r = {x:A.x, y:A.y, w, h}; A.x += w + 3; A.row = Math.max(A.row, h); return r; }
function dplane(wpx, hpx, ww, wh, i, j, zc, draw, off = 0.012){
  const r = dAlloc(wpx, hpx); W.dyn.push({r, draw});
  const g = new THREE.PlaneGeometry(ww, wh), uv = g.attributes.uv;
  for(let k = 0; k < uv.count; k++){ const u = uv.getX(k), v = uv.getY(k); uv.setXY(k, (r.x + u * r.w) / DW, 1 - (r.y + (1 - v) * r.h) / DHH); }
  g.translate(X(i), zc, Z(j) + off); W.dgeo.push(g);
}
/* 칠판 그림: k 0 = 오늘의 숙제 + 분필 그림, 1 = 유나 그림(무지개 · 우리 가족 · 하트), 2 = 받아쓰기 100점 */
function drawBoard(c, w, h, tm){
  const dark = K.R.dark, gq = c.createLinearGradient(0, 0, w, h); gq.addColorStop(0, "#3F6E58"); gq.addColorStop(1, "#355E4C"); c.fillStyle = gq; c.fillRect(0, 0, w, h);
  c.globalAlpha = 0.08; c.fillStyle = "#FFFFFF"; [[0.2, 0.3, 0.25], [0.6, 0.6, 0.3], [0.85, 0.25, 0.2]].forEach(([x, y, r]) => { c.beginPath(); c.ellipse(w * x, h * y, w * r, h * 0.2, 0.3, 0, 7); c.fill(); }); c.globalAlpha = 1;
  const reveal = Math.min(1, (tm - W.boardT) / 2200), k = W.boardK, chalk = "#F7F5EE";
  c.lineCap = "round"; c.lineJoin = "round";
  const txt = (t, x, y, s, col = chalk, al = "left") => { c.font = `400 ${s}px ${JUA}`; c.textAlign = al; c.textBaseline = "middle"; c.fillStyle = col; c.fillText(t, x, y); };
  const d = new Date(), wd = "일월화수목금토"[d.getDay()];
  txt(`${d.getMonth() + 1}월 ${d.getDate()}일 (${wd})`, w * 0.97, h * 0.1, h * 0.085, chalk, "right");
  if(k === 0) txt("주번: 유나 · 지유", w * 0.97, h * 0.92, h * 0.075, "#F6E39A", "right");
  c.save(); c.beginPath(); c.rect(0, 0, w * (k === 0 ? 1 : reveal), h); c.clip();
  if(k === 0){
    c.strokeStyle = "#F4C7D4"; c.lineWidth = 2; c.beginPath(); c.roundRect(w * 0.03, h * 0.08, w * 0.42, h * 0.8, 8); c.stroke();
    txt("📌 오늘의 숙제", w * 0.06, h * 0.2, h * 0.11, "#F6E39A");
    ["① 수학 익힘책 24쪽", "② 받아쓰기 3번 연습", "③ 엄마 아빠 꼭 안아 드리기 💕"].forEach((t, n) => txt(t, w * 0.06, h * (0.4 + n * 0.17), h * 0.085));
    // 분필 그림: 해 · 집 · 꽃 · 아이
    c.strokeStyle = "#F6E39A"; c.lineWidth = 2.2; c.beginPath(); c.arc(w * 0.58, h * 0.3, h * 0.08, 0, 7); c.stroke();
    for(let n = 0; n < 8; n++){ const a = n * PI / 4; c.beginPath(); c.moveTo(w * 0.58 + Math.cos(a) * h * 0.11, h * 0.3 + Math.sin(a) * h * 0.11); c.lineTo(w * 0.58 + Math.cos(a) * h * 0.15, h * 0.3 + Math.sin(a) * h * 0.15); c.stroke(); }
    c.strokeStyle = chalk; c.lineWidth = 2; c.strokeRect(w * 0.66, h * 0.45, w * 0.12, h * 0.3); c.beginPath(); c.moveTo(w * 0.645, h * 0.46); c.lineTo(w * 0.72, h * 0.3); c.lineTo(w * 0.795, h * 0.46); c.stroke();
    c.strokeStyle = "#A9CBEA"; c.strokeRect(w * 0.7, h * 0.58, w * 0.035, h * 0.17);
    [[0.84, "#F4A7B9"], [0.89, "#F9C99B"]].forEach(([x, col]) => { c.strokeStyle = "#A8DCC8"; c.beginPath(); c.moveTo(w * x, h * 0.78); c.lineTo(w * x, h * 0.6); c.stroke(); c.strokeStyle = col; c.beginPath(); c.arc(w * x, h * 0.56, h * 0.04, 0, 7); c.stroke(); });
    c.strokeStyle = "#F4C7D4"; c.lineWidth = 1.6; c.beginPath(); c.moveTo(w * 0.04, h * 0.94); c.lineTo(w * 0.8, h * 0.94); c.stroke();
  } else if(k === 1){
    RB.forEach((col, n) => { c.strokeStyle = col; c.lineWidth = 3.4; c.beginPath(); c.arc(w * 0.3, h * 0.95, h * (0.72 - n * 0.075), PI, 0); c.stroke(); });
    [[0.62, 0.36, "#F4A7B9"], [0.72, 0.4, "#A9CBEA"], [0.81, 0.48, "#F6E39A"]].forEach(([x, y, col], n) => { c.strokeStyle = chalk; c.lineWidth = 2; c.beginPath(); c.arc(w * x, h * y, h * (n === 2 ? 0.065 : 0.08), 0, 7); c.stroke();
      c.strokeStyle = col; c.beginPath(); c.moveTo(w * x, h * (y + 0.09)); c.lineTo(w * x - h * 0.08, h * (y + 0.36)); c.lineTo(w * x + h * 0.08, h * (y + 0.36)); c.closePath(); c.stroke(); });
    txt("아빠", w * 0.62, h * 0.86, h * 0.07, chalk, "center"); txt("엄마", w * 0.72, h * 0.88, h * 0.07, chalk, "center"); txt("유나", w * 0.81, h * 0.92, h * 0.07, "#F6E39A", "center");
    c.fillStyle = "#F4A7B9"; c.beginPath(); const hx = w * 0.3, hy = h * 0.5, hs = h * 0.09; c.moveTo(hx, hy + hs); c.bezierCurveTo(hx - hs * 2, hy - hs * 0.4, hx - hs * 0.7, hy - hs * 1.6, hx, hy - hs * 0.5); c.bezierCurveTo(hx + hs * 0.7, hy - hs * 1.6, hx + hs * 2, hy - hs * 0.4, hx, hy + hs); c.fill();
    txt("우리 가족 사랑해 ♥", w * 0.06, h * 0.12, h * 0.1, "#F4C7D4");
  } else {
    txt("받아쓰기", w * 0.06, h * 0.18, h * 0.11, "#F6E39A");
    ["1. 무지개", "2. 크레파스", "3. 운동장", "4. 고맙습니다"].forEach((t, n) => txt(t, w * 0.06, h * (0.38 + n * 0.15), h * 0.09));
    c.strokeStyle = "#E06A55"; c.lineWidth = 3; c.beginPath(); c.arc(w * 0.62, h * 0.52, h * 0.26, 0, 7); c.stroke(); c.beginPath(); c.arc(w * 0.62, h * 0.52, h * 0.3, 0, 7); c.stroke();
    txt("100", w * 0.62, h * 0.53, h * 0.22, "#E06A55", "center"); txt("참 잘했어요 ⭐", w * 0.62, h * 0.9, h * 0.08, "#F6E39A", "center");
  }
  c.restore();
  if(k && reveal < 1){ c.fillStyle = "#FFFFFF"; c.fillRect(w * reveal - 3, h * 0.45, 6, 4); }   // 분필 끝
  if(dark){ c.fillStyle = "rgba(20,16,30,.15)"; c.fillRect(0, 0, w, h); }
}
function drawClock(c, w, h, rim = "#F4A7B9"){
  const r = Math.min(w, h) / 2 - 1, cx = w / 2, cy = h / 2, d = new Date();
  c.fillStyle = rim; c.beginPath(); c.arc(cx, cy, r, 0, 7); c.fill(); c.fillStyle = "#FFFDF8"; c.beginPath(); c.arc(cx, cy, r * 0.84, 0, 7); c.fill();
  c.fillStyle = "#6E5A64"; for(let n = 0; n < 12; n++){ const a = n * PI / 6; c.beginPath(); c.arc(cx + Math.sin(a) * r * 0.7, cy - Math.cos(a) * r * 0.7, n % 3 ? r * 0.035 : r * 0.07, 0, 7); c.fill(); }
  const hand = (a, len, wd, col) => { c.strokeStyle = col; c.lineWidth = wd; c.lineCap = "round"; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.sin(a) * len, cy - Math.cos(a) * len); c.stroke(); };
  const hh = d.getHours() % 12 + d.getMinutes() / 60, mm = d.getMinutes() + d.getSeconds() / 60;
  hand(hh * PI / 6, r * 0.42, r * 0.11, INK); hand(mm * PI / 30, r * 0.62, r * 0.07, INK); hand(d.getSeconds() * PI / 30, r * 0.66, Math.max(1, r * 0.025), "#E06A55");
  c.fillStyle = "#E8A04A"; c.beginPath(); c.arc(cx, cy, r * 0.07, 0, 7); c.fill();
  if(K.R.dark){ c.fillStyle = "rgba(255,240,200,.12)"; c.fillRect(0, 0, w, h); }
}
/* 교표 (방패 · 작은 십자가 · 펼친 책 · 크레용) */
function drawCrest(c, w, h){
  const cx = w / 2, s = Math.min(w, h * 0.86), top = h * 0.06, bot = h * 0.95, hw = s * 0.42;
  const shield = k => { c.beginPath(); c.moveTo(cx - hw * k, top + (1 - k) * h * 0.06); c.lineTo(cx + hw * k, top + (1 - k) * h * 0.06); c.lineTo(cx + hw * k, h * 0.5); c.quadraticCurveTo(cx + hw * k, h * 0.5 + (bot - h * 0.5) * 0.7 * k, cx, bot - (1 - k) * h * 0.08); c.quadraticCurveTo(cx - hw * k, h * 0.5 + (bot - h * 0.5) * 0.7 * k, cx - hw * k, h * 0.5); c.closePath(); };
  shield(1); c.fillStyle = "#E8C36A"; c.fill(); shield(0.86); c.fillStyle = "#4DAA97"; c.fill();
  shield(0.86); c.save(); c.clip(); c.fillStyle = "#72C4AE"; c.fillRect(cx, 0, w, h); c.restore();
  c.fillStyle = "#FFFFFF"; c.fillRect(cx - s * 0.022, h * 0.14, s * 0.044, h * 0.2); c.fillRect(cx - s * 0.075, h * 0.19, s * 0.15, h * 0.04);   // 작은 십자가
  c.fillStyle = "#FAF7F2"; c.beginPath(); c.moveTo(cx, h * 0.5); c.quadraticCurveTo(cx - s * 0.14, h * 0.44, cx - s * 0.26, h * 0.47); c.lineTo(cx - s * 0.26, h * 0.63); c.quadraticCurveTo(cx - s * 0.14, h * 0.6, cx, h * 0.66); c.fill();
  c.beginPath(); c.moveTo(cx, h * 0.5); c.quadraticCurveTo(cx + s * 0.14, h * 0.44, cx + s * 0.26, h * 0.47); c.lineTo(cx + s * 0.26, h * 0.63); c.quadraticCurveTo(cx + s * 0.14, h * 0.6, cx, h * 0.66); c.fill();
  c.save(); c.translate(cx + s * 0.02, h * 0.76); c.rotate(-0.5); c.fillStyle = "#E8A04A"; c.fillRect(-s * 0.15, -s * 0.03, s * 0.24, s * 0.06); c.beginPath(); c.moveTo(s * 0.09, -s * 0.03); c.lineTo(s * 0.15, 0); c.lineTo(s * 0.09, s * 0.03); c.fill();
  c.fillStyle = "#E8B5C8"; c.fillRect(-s * 0.15, -s * 0.03, s * 0.05, s * 0.06); c.restore();
}
/* 태극기 */
function drawTaeguk(c, w, h){
  c.fillStyle = "#FFFFFF"; c.fillRect(0, 0, w, h);
  const cx = w / 2, cy = h / 2, R = h / 4, a = Math.atan2(2, 3);
  c.save(); c.translate(cx, cy); c.rotate(a);
  c.fillStyle = "#CD2E3A"; c.beginPath(); c.arc(0, 0, R, PI, 0); c.fill(); c.fillStyle = "#0047A0"; c.beginPath(); c.arc(0, 0, R, 0, PI); c.fill();
  c.fillStyle = "#CD2E3A"; c.beginPath(); c.arc(-R / 2, 0, R / 2, 0, 7); c.fill(); c.fillStyle = "#0047A0"; c.beginPath(); c.arc(R / 2, 0, R / 2, 0, 7); c.fill();
  c.restore();
  const tri = (ang, pat) => { c.save(); c.translate(cx, cy); c.rotate(ang); c.fillStyle = "#000000"; const bw = R * 0.5, bh = R * 0.083, gap = R * 0.042;
    pat.forEach((solid, n) => { const x = R * 1.5 + n * (bh + gap * 1.5); if(solid) c.fillRect(x, -bw, bh, bw * 2); else { c.fillRect(x, -bw, bh, bw - gap); c.fillRect(x, gap, bh, bw - gap); } }); c.restore(); };
  tri(PI + a, [1, 1, 1]); tri(a, [0, 0, 0]); tri(-a, [0, 1, 0]); tri(PI - a, [1, 0, 1]);
}

/* ---------- 바닥 그림 도구 ---------- */
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
  const ell = (i, j, rx, ry, col) => { c.fillStyle = col; c.beginPath(); c.ellipse(i, j, rx, ry, 0, 0, 7); c.fill(); };
  const ellS = (i, j, rx, ry, col, w) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.ellipse(i, j, rx, ry, 0, 0, 7); c.stroke(); };
  return {v, rect, rr, line, text, glow, wood, check, ell, ellS};
}
function paint(c, dark){
  const p = paintKit(c, dark), v = p.v, [ci, cj] = TRK.c, ro = TRK.w / 2;
  // 바깥 잔디 · 운동장 흙(마사토) · 흙 알갱이
  p.rect(EXT[0], EXT[1], EXT[2], EXT[3], v("#A6CF86", "#2F4430"));
  p.rect(-0.3, BJ, AW + 0.3, FJ, v("#E6CFA2", "#4A4236"));
  c.globalAlpha = dark ? 0.08 : 0.16; for(let k = 0; k < 3200; k++){ c.fillStyle = k % 3 ? "#FFFFFF" : "#9A8460"; c.fillRect(-0.2 + rnd(k) * 32.4, BJ + rnd(k + 77) * 14.1, 0.05, 0.05); } c.globalAlpha = 1;
  // 놀이터 고무 바닥 · 느티나무 잔디 · 화단 쪽 잔디
  p.rr(0.45, 11.3, 5.6, 20.4, 0.45, v("#9FD8C0", "#2E4A40")); for(let k = 0; k < 9; k++) p.rr(0.6 + (k % 3) * 1.7, 11.5 + (k / 3 | 0) * 3.0, 1.9 + (k % 3) * 1.7, 14.1 + (k / 3 | 0) * 3.0, 0.3, v(["#B5E3CF", "#F4C3D3", "#D7C6E8"][k % 3], "rgba(255,255,255,.03)"));
  p.ell(29.6, 16.6, 3.0, 4.4, v("#A6CF86", "#2F4430")); p.ell(30.6, 16.4, 1.6, 1.3, v("rgba(60,90,50,.16)", "rgba(0,0,0,.18)"));
  p.ell(5.6, 13.4, 0.9, 0.75, v("rgba(60,90,50,.12)", "rgba(0,0,0,.15)"));
  // 트랙 (빨강 · 흰 줄 · 출발선) + 인조 잔디 + 축구장 선
  p.ell(ci, cj, TRK.rx + ro, TRK.ry + ro, v("#DC7F6E", "#6A3A34"));
  p.ell(ci, cj, TRK.rx - ro, TRK.ry - ro, v("#92CC7E", "#2F4A30"));
  c.save(); c.beginPath(); c.ellipse(ci, cj, TRK.rx - ro, TRK.ry - ro, 0, 0, 7); c.clip();
  for(let i = 6; i < 26; i += 1.2) p.rect(i, 11, i + 0.6, 22, v("rgba(255,255,255,.08)", "rgba(255,255,255,.03)"));
  const wl = v("rgba(255,255,255,.85)", "rgba(230,230,220,.35)");
  p.line(ci, 12, ci, 22, wl, 0.06); p.ellS(ci, cj, 1.1, 1.1, wl, 0.06); p.ell(ci, cj, 0.08, 0.08, wl);
  [[9.55, 10.9], [21.1, 22.45]].forEach(([a, b]) => { c.strokeStyle = wl; c.lineWidth = 0.06; c.strokeRect(a, 15.3, b - a, 2.6); });
  [[11.4, 16.6], [BALL0[0], BALL0[1]]].forEach(([i, j]) => p.ell(i, j, 0.07, 0.07, wl));
  c.restore();
  const tl = v("rgba(255,255,255,.92)", "rgba(240,230,220,.4)");
  p.ellS(ci, cj, TRK.rx + ro - 0.04, TRK.ry + ro - 0.04, tl, 0.06); p.ellS(ci, cj, TRK.rx - ro + 0.04, TRK.ry - ro + 0.04, tl, 0.06); p.ellS(ci, cj, TRK.rx, TRK.ry, v("rgba(255,255,255,.6)", "rgba(240,230,220,.25)"), 0.04);
  { const jin = cj + (TRK.ry - ro) * Math.sqrt(1 - ((14.5 - ci) / (TRK.rx - ro)) ** 2), jout = cj + (TRK.ry + ro) * Math.sqrt(1 - ((14.5 - ci) / (TRK.rx + ro)) ** 2);
    p.line(14.5, jin, 14.5, jout, tl, 0.1); p.text("출발", 13.95, (jin + jout) / 2, 6, tl, 800, JUA);
    for(let k = 0; k < 6; k++){ const j0 = cj + (TRK.ry - ro) * Math.sqrt(1 - ((17.6 - ci) / (TRK.rx - ro)) ** 2), j1 = cj + (TRK.ry + ro) * Math.sqrt(1 - ((17.6 - ci) / (TRK.rx + ro)) ** 2), s = (j1 - j0) / 6;
      [0, 1].forEach(m => p.rect(17.55 + m * 0.1, j0 + k * s, 17.65 + m * 0.1, j0 + (k + 1) * s, (k + m) % 2 ? tl : v("rgba(42,42,40,.55)", "rgba(0,0,0,.4)"))); } }
  // 길: 정문 → 트랙 · 트랙 → 현관 (보도블록)
  const paver = (i0, j0, i1, j1) => { p.rect(i0, j0, i1, j1, v("#E6DED2", "#4A4540")); for(let j = j0; j < j1; j += 0.4) p.line(i0, j, i1, j, v("rgba(0,0,0,.07)", "rgba(255,255,255,.05)"), 0.016); for(let i = i0; i < i1; i += 0.4) p.line(i, j0, i, j1, v("rgba(0,0,0,.05)", "rgba(255,255,255,.04)"), 0.016); };
  paver(15.1, BJ + 0.1, 16.9, cj - TRK.ry - ro + 0.02); paver(15.1, cj + TRK.ry + ro - 0.02, 16.9, FJ);
  // 국기 게양대 · 버스 주차 칸 · 정문 밖 보도 · 어린이 보호구역
  p.rr(27.1, 10.5, 30.3, 11.95, 0.2, v("#E6DED2", "#4A4540"));
  p.rr(0.4, 21.35, 6.3, 23.6, 0.12, v("#C7C2BA", "#3A3835")); p.rect(0.5, 21.42, 6.2, 21.5, v("#F2C94C", "#8A7A3A")); p.text("스쿨버스 🚌", 3.2, 21.38 - 0.25, 5.5, v("rgba(90,80,70,.55)", "rgba(220,210,190,.3)"), 800, JUA);
  p.rect(EXT[0], FJ + 0.12, EXT[2], EXT[3], v("#E3DDD2", "#3A3734")); for(let i = EXT[0]; i < EXT[2]; i += 0.8) p.line(i, FJ + 0.12, i, EXT[3], v("rgba(0,0,0,.08)", "rgba(255,255,255,.05)"), 0.016);
  p.rect(EXT[0], FJ + 0.08, EXT[2], FJ + 0.16, v("#BDB5A9", "#4A4642"));
  p.text("어린이 보호구역 · 천천히 🐢", 8.0, 24.75, 7, v("rgba(214,90,80,.6)", "rgba(240,140,120,.35)"), 800, JUA); p.text("← 학교 앞 골목", 23.5, 24.75, 6.5, v("rgba(90,80,70,.5)", "rgba(220,210,190,.28)"));
  // ---- 건물 안 ----
  p.check(...[RM.lunch[0], 0, RM.lunch[1], RJ], 0.5, v("#FBEBD6", "#3E3934"), v("#BFE6D6", "#38443E"));
  p.rect(RM.lib[0], 0, RM.lib[1], RJ, v("#B9DEC9", "#2E3F36")); for(let i = RM.lib[0] + 0.25; i < RM.lib[1]; i += 0.25) p.line(i, 0, i, RJ, v("rgba(255,255,255,.18)", "rgba(0,0,0,.12)"), 0.01);
  p.ell(8.5, 4.65, 1.45, 1.2, v("#F4D3DF", "#5A4450")); p.ellS(8.5, 4.65, 1.25, 1.0, v("#FFFFFF", "#7A6470"), 0.04); RB.forEach((col, k) => p.ell(8.5 + Math.cos(k * 1.05) * 0.8, 4.65 + Math.sin(k * 1.05) * 0.62, 0.07, 0.07, v(col, "rgba(255,255,255,.1)")));
  p.wood(RM.cls[0], 0, RM.cls[1], RJ, "#E5C291", "#4A3B2E"); p.rr(12.6, 0.35, 16.6, 1.75, 0.15, v("rgba(255,255,255,.22)", "rgba(0,0,0,.12)"));
  p.rect(RM.mus[0], 0, RM.mus[1], RJ, v("#D8C5EA", "#433B4E")); for(let k = 0; k < 22; k++) p.text(k % 2 ? "♪" : "♫", 18.8 + rnd(k) * 3.9, 0.5 + rnd(k + 9) * 6.4, 7, v("rgba(160,120,180,.18)", "rgba(255,255,255,.06)"));
  p.ell(20.75, 3.6, 1.7, 1.35, v("#F4E4C8", "#4E4436"));
  p.check(RM.sci[0], 0, RM.sci[1], RJ, 0.45, v("#E2ECF3", "#363C42"), v("#CCDDEA", "#30363C"));
  p.wood(RM.chp[0], 0, RM.chp[1], RJ, "#D9B184", "#433528"); p.rect(29.25, 1.6, 30.25, RJ, v("#E8B5C8", "#5A4450")); p.rect(29.33, 1.6, 30.17, RJ, v("#F2C9D6", "#6A4E5A"));
  p.rr(28.9, 0.7, 30.6, 1.95, 0.1, v("#EADCC0", "#4E4234"));
  // 복도 (테라조) · 현관 매트 · 문턱
  p.rect(0, RJ, AW, BJ, v("#EBDCC6", "#36312B")); for(let k = 0; k < 900; k++){ c.fillStyle = v(k % 2 ? "rgba(140,120,100,.18)" : "rgba(232,181,200,.35)", "rgba(255,255,255,.05)"); c.fillRect(rnd(k + 5) * AW, RJ + rnd(k + 51) * 2.4, 0.04, 0.04); }
  p.rect(0, RJ + 1.14, AW, RJ + 1.26, v("rgba(226,150,180,.6)", "rgba(232,181,200,.15)"));
  p.rr(15.15, 8.5, 16.85, 9.5, 0.14, v("#C8B4D0", "#5E4E68")); p.text("어서 와요 ♡", 16.0, 9.0, 6, v("#FFFFFF", "#E2D6EA"), 400, JUA);
  DOORS.forEach(([a, b]) => p.rect(a + 0.07, RJ - 0.12, b - 0.07, RJ + 0.12, v("#D8CFC3", "#4A443E")));
  [MAIN, WEST].forEach(([a, b]) => p.rect(a, BJ - 0.12, b, BJ + 0.12, v("#D8CFC3", "#4A443E")));
  // 불빛 웅덩이
  [[3, 3.6], [8.3, 3.2], [14.6, 3.4], [20.7, 3.4], [25.2, 3.4], [29.75, 3.2], [8, 8.4], [24, 8.4]].forEach(([i, j]) => p.glow(i, j, 1.7, v("rgba(255,252,240,.32)", "rgba(255,200,140,.2)")));
}

/* ---------- 작은 가구 ---------- */
function kidDesk(ci, cj, trim){
  [[-0.31, -0.2], [0.27, -0.2], [-0.31, 0.16], [0.27, 0.16]].forEach(([a, b]) => B(ci + a, cj + b, 0.04, 0.04, 15.4, METAL, 0, {r:0, cls:"s"}));
  B(ci - 0.3, cj - 0.19, 0.6, 0.36, 1, METAL2, 12, {r:0});
  B(ci - 0.34, cj - 0.23, 0.68, 0.46, 1.6, D("#F3E2C6", "#6E5C48"), 15.4, {r:0.02});
  K.faceJ(ci - 0.33, ci + 0.33, cj + 0.232, 15.6, 16.8, trim, "m", 0.008);
}
function kidChair(ci, cj, col){   // 앉으면 −j(칠판)를 봄, 등받이는 +j 쪽
  [[-0.16, -0.15], [0.13, -0.15], [-0.16, 0.12], [0.13, 0.12]].forEach(([a, b]) => B(ci + a, cj + b, 0.03, 0.03, 9.3, METAL, 0, {r:0, cls:"s"}));
  B(ci - 0.18, cj - 0.17, 0.36, 0.34, 1.2, col, 9.3, {r:0.03});
  [-0.16, 0.13].forEach(a => B(ci + a, cj + 0.13, 0.03, 0.03, 9, METAL, 10.5, {r:0, cls:"s"}));
  B(ci - 0.18, cj + 0.12, 0.36, 0.05, 6, col, 13.6, {r:0.02});
}
function stool(i, j, col){ K.sm(K.cyl(0.03, 0.04, hz(11), 8), METAL, X(i), hz(5.5), Z(j), null, "s"); disc(i, j, 0.12, 0, 0.8, METAL, "s", 14); disc(i, j, 0.15, 11, 1.4, col, "m", 16); }
function benchI(i0, i1, j, back, col = WOOD){   // 운동장 벤치: i 방향으로 김, back = 등받이 쪽 "+j" / "-j"
  const L = i1 - i0, fr = D("#5A5E64", "#3A3C40");
  [i0 + 0.12, i1 - 0.16].forEach(i => { B(i, j - 0.2, 0.04, 0.4, 9.5, fr, 0, {r:0, cls:"s"}); });
  [0, 1, 2].forEach(k => B(i0, j - 0.2 + k * 0.135, L, 0.11, 1.2, col, 9.5, {r:0.02}));
  const bj = back === "+j" ? j + 0.17 : j - 0.21; B(i0 + 0.12, bj, 0.04, 0.04, 14, fr, 10.5, {r:0, cls:"s"}); B(i1 - 0.16, bj, 0.04, 0.04, 14, fr, 10.5, {r:0, cls:"s"});
  [15, 20].forEach(z => B(i0, bj - 0.01, L, 0.06, 3.2, col, z, {r:0.015}));
}
function benchJ(j0, j1, i, back, col = WOOD){   // j 방향으로 김, back = "+i" / "-i"
  const L = j1 - j0, fr = D("#5A5E64", "#3A3C40");
  [j0 + 0.12, j1 - 0.16].forEach(j => B(i - 0.2, j, 0.4, 0.04, 9.5, fr, 0, {r:0, cls:"s"}));
  [0, 1, 2].forEach(k => B(i - 0.2 + k * 0.135, j0, 0.11, L, 1.2, col, 9.5, {r:0.02}));
  const bi = back === "+i" ? i + 0.17 : i - 0.21; B(bi, j0 + 0.12, 0.04, 0.04, 14, fr, 10.5, {r:0, cls:"s"}); B(bi, j1 - 0.16, 0.04, 0.04, 14, fr, 10.5, {r:0, cls:"s"});
  [15, 20].forEach(z => B(bi - 0.01, j0, 0.06, L, 3.2, col, z, {r:0.015}));
}
/* 벽 포스터 (j 고정 벽의 +j 면): 흰 판 + 그림 */
function posterJ(i0, i1, j, z0, z1, draw, frame = WHITE){ K.faceJ(i0 - 0.03, i1 + 0.03, j, z0 - 1, z1 + 1, frame, "m", 0.01); K.decal(Math.round((i1 - i0) * 120), Math.round(hz(z1 - z0) * 120), draw, i1 - i0, hz(z1 - z0), "i", (i0 + i1) / 2, j + 0.004, hz((z0 + z1) / 2)); }
function posterI(i, j0, j1, z0, z1, draw, frame = WHITE){ K.faceI(i, j0 - 0.03, j1 + 0.03, z0 - 1, z1 + 1, frame, "m", 0.01); K.decal(Math.round((j1 - j0) * 120), Math.round(hz(z1 - z0) * 120), draw, j1 - j0, hz(z1 - z0), "j", i + 0.004, (j0 + j1) / 2, hz((z0 + z1) / 2)); }
const fillBg = (c, w, h, col) => { c.fillStyle = col; c.fillRect(0, 0, w, h); };
const ctext = (c, t, x, y, s, col, al = "center", fam = JUA, wt = 400) => { c.font = `${wt} ${s}px ${fam}`; c.textAlign = al; c.textBaseline = "middle"; c.fillStyle = col; c.fillText(t, x, y); };
function kidDrawing(c, w, h, k){   // 아이 그림 (그림 번호 k)
  fillBg(c, w, h, ["#FFF8EE", "#F3FAF6", "#FBF3FA", "#FFFBEA"][k % 4]);
  c.lineWidth = 2.4; c.lineCap = "round";
  if(k % 4 === 0){ c.fillStyle = "#F6C94A"; c.beginPath(); c.arc(w * 0.75, h * 0.25, h * 0.13, 0, 7); c.fill(); c.fillStyle = "#9CC58A"; c.fillRect(0, h * 0.75, w, h * 0.25); c.fillStyle = "#F4A7B9"; c.fillRect(w * 0.2, h * 0.45, w * 0.3, h * 0.3); c.fillStyle = "#E06A55"; c.beginPath(); c.moveTo(w * 0.15, h * 0.46); c.lineTo(w * 0.35, h * 0.26); c.lineTo(w * 0.55, h * 0.46); c.fill(); }
  else if(k % 4 === 1){ RB.forEach((col, n) => { c.strokeStyle = col; c.lineWidth = h * 0.06; c.beginPath(); c.arc(w / 2, h * 0.95, h * (0.7 - n * 0.07), PI, 0); c.stroke(); }); c.fillStyle = "#FFFFFF"; c.beginPath(); c.arc(w * 0.2, h * 0.85, h * 0.12, 0, 7); c.arc(w * 0.8, h * 0.85, h * 0.12, 0, 7); c.fill(); }
  else if(k % 4 === 2){ c.fillStyle = "#F0D2BC"; c.beginPath(); c.arc(w / 2, h * 0.42, h * 0.2, 0, 7); c.fill(); c.fillStyle = "#3A261C"; c.beginPath(); c.arc(w / 2, h * 0.36, h * 0.21, PI, 0); c.fill(); c.beginPath(); c.arc(w * 0.28, h * 0.4, h * 0.07, 0, 7); c.arc(w * 0.72, h * 0.4, h * 0.07, 0, 7); c.fill();
    c.fillStyle = "#FF8FB8"; c.fillRect(w * 0.32, h * 0.62, w * 0.36, h * 0.3); c.fillStyle = "#2A2A28"; c.beginPath(); c.arc(w * 0.44, h * 0.42, 1.6, 0, 7); c.arc(w * 0.56, h * 0.42, 1.6, 0, 7); c.fill(); }
  else { c.fillStyle = "#A9CBEA"; c.fillRect(0, h * 0.55, w, h * 0.45); c.fillStyle = "#E8A04A"; c.beginPath(); c.ellipse(w * 0.45, h * 0.6, w * 0.22, h * 0.1, 0, 0, 7); c.fill(); c.beginPath(); c.moveTo(w * 0.66, h * 0.6); c.lineTo(w * 0.8, h * 0.5); c.lineTo(w * 0.8, h * 0.7); c.fill(); c.fillStyle = "#2A2A28"; c.beginPath(); c.arc(w * 0.32, h * 0.58, 1.6, 0, 7); c.fill(); }
  c.strokeStyle = "rgba(0,0,0,.06)"; c.lineWidth = 2; c.strokeRect(1, 1, w - 2, h - 2);
}

/* =================================================================== 껍데기: 뒷벽 · 칸막이 · 복도 · 앞벽 · 시계탑 */
function buildShell(){
  const ext = D("#F6DDE3", "#4A3E42");
  B(0, -BT, AW, BT, TALL, ext, 0, {r:0}); B(-BT, 0, BT, BJ + T / 2, TALL, ext, 0, {r:0}); B(-BT, -BT, BT, BT, TALL, ext, 0, {r:0});
  B(-BT, -BT, AW + BT, BT, 3, CAPC, TALL, {r:0}); B(-BT, 0, BT, BJ + T / 2, 3, CAPC, TALL, {r:0});
  // 방마다 벽지 · 아래 판벽 · 걸레받이
  const paper = {lunch:[D("#FFEBD0", "#4A4038"), D("#F6CF96", "#5A4A38")], lib:[D("#DDF1E6", "#36443C"), D("#A8DCC8", "#3E5A50")], cls:[D("#FFF1DC", "#46403A"), D("#9FD3C2", "#3E5A50")],
    mus:[D("#EDE2F6", "#433B4E"), D("#CDB6E0", "#4E4458")], sci:[D("#E2EFF8", "#3A424C"), D("#B6D6EC", "#3E4A5A")], chp:[D("#FBF0E2", "#46403A"), D("#D9B98F", "#5A4A38")]};
  Object.entries(RM).forEach(([k, [a, b]]) => { K.faceJ(a, b, 0.0, 0, TALL, paper[k][0], "m", 0.012); K.faceJ(a, b, 0.012, 3.5, 26, paper[k][1], "m", 0.008); K.faceJ(a, b, 0.02, 26, 27.4, WHITE, "m", 0.008); });
  K.faceI(0.0, 0, RJ, 0, TALL, paper.lunch[0], "m", 0.012); K.faceI(0.012, 0, RJ, 3.5, 26, paper.lunch[1], "m", 0.008); K.faceI(0.02, 0, RJ, 26, 27.4, WHITE, "m", 0.008);
  K.faceI(0.0, RJ, BJ, 0, TALL, D("#FBEFF3", "#4A3A41"), "m", 0.012);
  K.faceJ(0, AW, 0.02, 0, 3.5, WHITE, "m", 0.01); K.faceI(0.02, 0, BJ, 0, 3.5, WHITE, "m", 0.01);
  // 칸막이 · 교실 앞벽(문) · 건물 앞벽(현관 둘) · 오른쪽 끝벽
  const iw = D("#FBEFE0", "#4E443C"), iwLo = D("#8FCDB8", "#3E6458"), pw = D("#F6DCE4", "#4E3E46"), fw = D("#FBEBDD", "#4E443C"), fwLo = D("#EEA9BF", "#6A4654");
  [RM.lib[0], RM.cls[0], RM.mus[0], RM.sci[0], RM.chp[0]].forEach(i => wallJ(0, RJ - T / 2, i, pw, LOW, PINK));
  gaps(0, AW - T / 2, DOORS.map(d => [d[0], d[1]])).forEach(([a, b]) => wallI(a, b, RJ, iw, LOW, iwLo));
  // 문 옆 방 이름판 (복도 쪽 벽, 문 오른쪽 · 2반 문은 왼쪽)
  DOORS.forEach(([a, b, name, col], k) => { doorFrameI(a, b, RJ); const p0 = k === 3 ? a - 0.86 : b + 0.08, p1 = p0 + 0.78, fj = RJ + T / 2;
    B(p0, fj, p1 - p0, 0.05, 9.5, D(col, K.sh(col, -0.45)[0]), 19.5, {r:0.02}); K.wtext(name, (p0 + p1) / 2, fj + 0.03, 24.2, "i", name.length > 3 ? 2.5 : 3.0, D("#FFFFFF", "#F4EDE4"), null, 400, JUA);
    ball((p0 + p1) / 2, fj + 0.05, 30.5, 0.05, D(col, K.sh(col, -0.45)[0]), "m", 8); });
  gaps(0, AW - T / 2, [WEST, MAIN]).forEach(([a, b]) => wallI(a, b, BJ, fw, LOW, fwLo));
  doorFrameI(WEST[0], WEST[1], BJ); doorFrameI(MAIN[0], MAIN[1], BJ);
  wallJ(0, BJ + T / 2, AW, fw, LOW, fwLo);
  // 건물 앞벽 바깥 장식: 동그란 창 그림 · 무지개 띠
  gaps(0, AW - T / 2, [WEST, MAIN]).forEach(([a, b]) => K.faceJ(a + 0.06, b - 0.06, BJ + T / 2, 15, 16.6, D("#FFFFFF", "#8A847C"), "m", 0.006));   // 문 자리는 비움 (부딪힘)
  for(let i = 0.7; i < AW - 0.4; i += 1.35){ if((i > WEST[0] - 0.5 && i < WEST[1] + 0.3) || (i > MAIN[0] - 0.9 && i < MAIN[1] + 0.4)) continue;
    K.decal(40, 40, (c, w, h, dark) => { c.fillStyle = dark ? "#FFE2A8" : "#FFFFFF"; c.beginPath(); c.arc(w / 2, h / 2, w * 0.48, 0, 7); c.fill(); const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, dark ? "#E8B870" : "#BFE0F2"); g.addColorStop(1, dark ? "#C98A4A" : "#F4D3DF"); c.fillStyle = g; c.beginPath(); c.arc(w / 2, h / 2, w * 0.4, 0, 7); c.fill();
      c.strokeStyle = dark ? "#8A6A4C" : "#FFFFFF"; c.lineWidth = 2; c.beginPath(); c.moveTo(w / 2, h * 0.1); c.lineTo(w / 2, h * 0.9); c.moveTo(w * 0.1, h / 2); c.lineTo(w * 0.9, h / 2); c.stroke(); }, 0.42, 0.42, "i", i, BJ + T / 2 - 0.02, hz(25)); }
  // 현관 지붕 (분홍 캐노피, 벽에 매단 까치발 — 기둥 없음: 카메라가 안 걸리게) · 학교 이름 · 교표
  const mc = (MAIN[0] + MAIN[1]) / 2;
  [MAIN[0] - 0.14, MAIN[1] + 0.02].forEach(i => { B(i, BJ - 0.1, 0.12, 0.2, 19, WHITE, 34, {r:0.02, cls:"s"}); rod([i + 0.06, BJ + 0.1, 36], [i + 0.06, BJ + 1.1, 52], 0.03, WHITE, "s", 8); });
  B(MAIN[0] - 0.55, BJ - 0.3, MAIN[1] - MAIN[0] + 1.1, 1.65, 3.5, PINK, 53, {r:0.06}); B(MAIN[0] - 0.47, BJ - 0.22, MAIN[1] - MAIN[0] + 0.94, 1.49, 1.2, WHITE, 56.5, {r:0.05});
  for(let k = 0; k < 7; k++) ball(MAIN[0] - 0.4 + k * (MAIN[1] - MAIN[0] + 0.8) / 6, BJ + 1.35, 52.4, 0.06, RB[k % 6], "m", 8);
  K.faceJ(MAIN[0] - 0.5, MAIN[1] + 0.5, BJ + 1.35, 56.6, 64, WHITE, "m", 0.02);
  K.wtext("크레용초등학교", mc, BJ + 1.372, 60.3, "i", 4.0, D("#B5607E", "#F4C7D4"), null, 400, JUA);
  K.decal(110, 130, (c, w, h) => drawCrest(c, w, h), 0.36, 0.43, "i", mc, BJ + 0.2, hz(58) + 0.22);
  B(mc - 0.03, BJ + 0.18, 0.06, 0.04, 2, GOLD, 57.7, {r:0, cls:"s"});
  // 시계탑 (가운데 뒤): 학교 이름 · 시계(움직임) · 뾰족 지붕 · 작은 십자가
  const tw = D("#FBE9EE", "#4E4246"), ti0 = 13.55, ti1 = 15.65, tc = (ti0 + ti1) / 2;
  B(ti0, -1.15, ti1 - ti0, 0.9, 178, tw, 0, {r:0});
  K.faceJ(ti0 + 0.12, ti1 - 0.12, -0.25, 114, 174, PINK2, "m", 0.012);
  [114, 174].forEach(z => B(ti0 - 0.04, -1.19, ti1 - ti0 + 0.08, 0.98, 2.4, WHITE, z, {r:0}));
  K.wtext("크레용초등학교", tc, -0.236, 124, "i", 4.6, D("#9A4E6A", "#F4C7D4"), null, 400, JUA);
  K.wtext("CREYONG ELEMENTARY SCHOOL", tc, -0.236, 117.6, "i", 1.8, D("#B98AA0", "#C9A9B9"), null, 800);
  { const t = K.sm(myGeo(new THREE.TorusGeometry(0.47, 0.045, 8, 32)), PINK, X(tc), hz(152), Z(-0.25) + 0.03, null, "s"); }
  { const roof = K.sm(myGeo(new THREE.ConeGeometry(1.62, hz(34), 4)), LILAC, X(tc), hz(180.4) + hz(17), Z(-0.7), null, "m"); roof.rotation.y = PI / 4; roof.scale.z = 0.58; }
  B(ti0 - 0.06, -1.21, ti1 - ti0 + 0.12, 1.02, 2.4, WHITE, 178, {r:0});
  rod([tc, -0.7, 213], [tc, -0.7, 238], 0.035, GOLD, "s", 8); B(tc - 0.17, -0.74, 0.34, 0.08, 2.4, GOLD, 229, {r:0, cls:"s"});
}
/* =================================================================== 급식실 */
function buildLunch(){
  winI(1.2, 2.6, 46, 84); winJ(4.3, 5.6, 56, 92);
  // 배식대: 스테인리스 · 음식 통 · 유리 가림막 · 식판 더미
  B(0.6, 0.65, 4.6, 0.6, 22, STEEL, 0, {r:0.02, cls:"s"}); B(0.55, 0.6, 4.7, 0.7, 1.4, D("#EEF1F4", "#7A8086"), 22, {r:0.01, cls:"s"});
  K.faceJ(0.65, 5.15, 1.252, 4, 18, D("#F2C9D6", "#6A4E5A"), "m", 0.008);
  const pans = [[1.55, "#FFFFFF", "rice"], [2.3, "#E8823A", "soup"], [3.05, "#E0533E", "kimchi"], [3.8, "#C98A4A", "chicken"], [4.55, "#F6C94A", "fruit"]];
  pans.forEach(([i, col, kind], k) => { B(i - 0.32, 0.72, 0.64, 0.44, 1.8, METAL2, 23.4, {r:0.02, cls:"s"});
    if(kind === "rice") ball(i, 0.94, 25.4, 0.22, "#FFFFFF", "m", 12).scale.set(1.25, 0.32, 0.85);
    else if(kind === "soup") B(i - 0.28, 0.76, 0.56, 0.36, 0.6, D(col, "#7A4A2A"), 24.8, {r:0.02});
    else if(kind === "kimchi") for(let n = 0; n < 7; n++) ball(i - 0.2 + rnd(n) * 0.4, 0.8 + rnd(n + 3) * 0.28, 25.6, 0.06, n % 3 ? col : "#F4E9C8", "m", 6);
    else if(kind === "chicken") for(let n = 0; n < 6; n++) ball(i - 0.2 + rnd(n + 8) * 0.4, 0.8 + rnd(n + 11) * 0.28, 25.8, 0.075, n % 2 ? col : K.sh(col, -0.15), "m", 8);
    else for(let n = 0; n < 6; n++) ball(i - 0.2 + rnd(n + 20) * 0.4, 0.8 + rnd(n + 21) * 0.28, 25.8, 0.07, n % 2 ? "#F6C94A" : "#F28C28", "m", 8); });
  [0.95, 4.95].forEach(i => rod([i, 0.95, 23.4], [i, 0.95, 40], 0.014, STEEL, "s", 6)); K.faceJ(0.95, 4.95, 0.94, 31, 40, D("#E4EEF4", "#7A90B8"), "glass", 0.012);
  for(let n = 0; n < 6; n++) B(0.62, 0.7, 0.5, 0.34, 0.8, PAST[n % 6], 23.4 + n * 1.0, {r:0.03});
  // 부엌 (배식대 뒤): 큰 솥 · 선반 · 후드 · 오늘의 메뉴
  K.sm(K.cyl(0.24, 0.22, hz(14), 18), STEEL, X(5.55), hz(7), Z(0.35), null, "s"); disc(5.55, 0.35, 0.25, 14, 1, METAL2, "s", 18);
  B(0.6, 0.0, 4.6, 0.3, 1.4, STEEL, 52, {r:0, cls:"s"}); [[1.0, 0.13], [1.6, 0.12], [2.3, 0.15], [3.1, 0.11]].forEach(([i, r]) => K.sm(K.cyl(r, r * 0.9, hz(8), 14), STEEL, X(i), hz(57.4), Z(0.15), null, "s"));
  B(1.4, 0.02, 3.0, 0.5, 8, STEEL, 84, {r:0.02, cls:"s"});
  posterJ(1.6, 3.8, 0.03, 60, 80, (c, w, h) => { fillBg(c, w, h, "#FFFDF6"); c.fillStyle = "#E8A04A"; c.fillRect(0, 0, w, h * 0.3); ctext(c, "오늘의 급식 🍚", w / 2, h * 0.16, h * 0.18, "#FFFFFF");
    ["잡곡밥 · 미역국", "치킨 마요 · 배추김치", "귤 · 우유 🥛"].forEach((t, n) => ctext(c, t, w / 2, h * (0.45 + n * 0.2), h * 0.14, "#6A4E3A")); }, D("#E8A04A", "#9A6A30"));
  // 긴 식탁 둘 + 의자형 벤치 (낮아서 밟고 지나갈 수 있음)
  const tbl = D("#FFFFFF", "#7A746C"), bc = [PINK2, LEAF2, LILAC2, AMBER2];
  [[3.05, 3.75], [5.15, 5.85]].forEach(([j0, j1], t) => {
    B(0.8, j0, 4.4, j1 - j0, 1.6, tbl, 15.4, {r:0.04}); K.faceJ(0.82, 5.18, j1 + 0.002, 15.6, 16.8, LEAF, "m", 0.008);
    [1.1, 4.7].forEach(i => { B(i - 0.06, (j0 + j1) / 2 - 0.2, 0.12, 0.4, 15.4, METAL, 0, {r:0, cls:"s"}); B(i - 0.08, (j0 + j1) / 2 - 0.28, 0.16, 0.56, 1, METAL, 0, {r:0, cls:"s"}); });
    [[j0 - 0.5, bc[t * 2]], [j1 + 0.2, bc[t * 2 + 1]]].forEach(([bj, col]) => { B(0.85, bj, 4.3, 0.3, 1.6, col, 7.2, {r:0.05}); [1.1, 4.7].forEach(i => B(i - 0.05, bj + 0.1, 0.1, 0.1, 7.2, METAL, 0, {r:0, cls:"s"})); });
    // 식판 (자리마다 · 몇 개)
    [1.5, 2.6, 3.7, 4.6].forEach((i, k) => [j0 + 0.17, j1 - 0.17].forEach((tj, m) => { if((k + m + t) % 3 === 2) return;
      B(i - 0.22, tj - 0.14, 0.44, 0.28, 0.8, PAST[(k + m * 2 + t) % 6], 17, {r:0.04}); ball(i - 0.1, tj, 18.3, 0.065, "#FFFFFF", "m", 8).scale.y = 0.5; disc(i + 0.07, tj - 0.04, 0.06, 17.8, 1.4, "#E8823A", "m", 10);
      ball(i + 0.13, tj + 0.06, 18.2, 0.035, "#E0533E", "m", 6); B(i + 0.16, tj - 0.12, 0.04, 0.06, 3, D("#FFFFFF", "#9A948C"), 17.8, {r:0.01}); })); });
  posterI(0.03, 3.4, 5.4, 34, 54, (c, w, h) => { fillBg(c, w, h, "#F3FAF6"); ctext(c, "골고루 먹어요", w / 2, h * 0.25, h * 0.2, "#3A8A78"); ctext(c, "🥦 🍎 🥕 🍚", w / 2, h * 0.62, h * 0.24, "#2A2A28"); ctext(c, "감사히 먹겠습니다 🙏", w / 2, h * 0.88, h * 0.12, "#8B5A3C"); }, LEAF);
  K.plant(0.4, 6.75, true); K.plant(5.6, 6.75, false);
}
/* =================================================================== 도서관 */
function buildLib(){
  winJ(7.0, 9.6, 72, 102);
  // 뒷벽 큰 책장 (5칸) · 책 · 성경책 칸
  const fr = WOOD, s0 = 6.25, s1 = 10.25;
  B(s0, 0.05, 0.08, 0.46, 66, fr, 0, {r:0}); B(s1 - 0.08, 0.05, 0.08, 0.46, 66, fr, 0, {r:0}); B((s0 + s1) / 2 - 0.04, 0.05, 0.08, 0.46, 66, fr, 0, {r:0});
  B(s0, 0.03, s1 - s0, 0.04, 66, WOODD, 0, {r:0});
  [0, 13, 26, 39, 52].forEach(z => B(s0, 0.05, s1 - s0, 0.46, 1.4, fr, z, {r:0})); B(s0 - 0.04, 0.03, s1 - s0 + 0.08, 0.5, 2, WOODD, 66, {r:0});
  let n = 0;
  [1.4, 14.4, 27.4, 40.4, 53.4].forEach((z, row) => [[s0 + 0.08, (s0 + s1) / 2 - 0.04], [(s0 + s1) / 2 + 0.04, s1 - 0.08]].forEach(([a, b], side) => {
    let i = a + 0.02; while(i < b - 0.06){ const bw = 0.045 + rnd(n) * 0.04, bh = 8.5 + rnd(n + 3) * 2.8, bible = row === 2 && side === 1 && i < a + 0.55;
      if(i + bw > b - 0.02) break;
      const tilt = !bible && rnd(n + 7) > 0.93 && i + bw + 0.12 < b;
      const o = B(i, 0.12, bw, 0.32, bh, bible ? D(n % 2 ? "#7A3A3A" : "#3E2A20", "#3A2420") : D(BOOK[n % BOOK.length], K.sh(BOOK[n % BOOK.length], -0.5)[0]), z, {r:0.006});
      if(bible) B(i + 0.005, 0.115, bw - 0.01, 0.005, 0.8, GOLD, z + bh * 0.6, {r:0, cls:"s"});
      if(tilt){ o.rotation.z = -0.25; i += 0.1; }
      i += bw + 0.006; n++; } }));
  B(8.35, 0.47, 0.6, 0.04, 2.6, GOLD, 34.5, {r:0, cls:"s"}); K.wtext("성경 📖", 8.65, 0.512, 35.8, "i", 1.9, INK, null, 400, JUA);   // 성경 칸 이름표
  K.wtext("📚 크레용 도서관", 8.25, 0.03, 70.5, "i", 4.2, D("#3A8A78", "#9EE3D3"), null, 400, JUA);
  // 왼쪽 낮은 책장 (+i 쪽으로 보임) · 위에 성경 받침대 · 화분
  B(6.1, 1.0, 0.45, 4.6, 28, WHITE, 0, {r:0.02}); [0.8, 14.2].forEach(z => B(6.12, 1.02, 0.43, 4.56, 1.2, WOODL, z, {r:0}));
  [2.0, 14.2].forEach((z, row) => { let j = 1.08; while(j < 5.5){ const bw = 0.05 + rnd(n) * 0.04, bh = 8 + rnd(n + 2) * 3; if(j + bw > 5.52) break; B(6.16, j, 0.34, bw, bh, D(BOOK[(n + 3) % BOOK.length], K.sh(BOOK[(n + 3) % BOOK.length], -0.5)[0]), z, {r:0.006}); j += bw + 0.006; n++; } });
  B(6.18, 2.2, 0.3, 0.42, 1.5, WOODD, 28, {r:0.02}); { const bk = B(6.2, 2.24, 0.26, 0.34, 0.8, D("#FFFDF6", "#8A847C"), 29.6, {r:0.01}); } B(6.2, 2.4, 0.26, 0.02, 1, D("#7A3A3A", "#3A2420"), 29.8, {r:0});
  K.wtext("어린이 성경", 6.56, 2.41, 24.6, "j", 1.8, D("#8B5A3C", "#E9C9A0"), null, 400, JUA);
  flowerPot(6.33, 1.4, "#F4A7B9", 0.6, WHITE, 28); flowerPot(6.33, 4.9, "#A9CBEA", 0.6, PINK, 28);
  // 독서 공간: 둥근 낮은 탁자 · 방석 · 빈백 · 책 수레
  disc(8.5, 4.65, 0.42, 0, 1, WOODD, "m", 20); disc(8.5, 4.65, 0.4, 7.2, 1.4, WOODL, "m", 24); K.sm(K.cyl(0.06, 0.06, hz(7), 10), WOODD, X(8.5), hz(3.6), Z(4.65), null, "m");
  [[8.35, 4.55, "#F4A7B9"], [8.6, 4.7, "#A9CBEA"]].forEach(([i, j, col]) => B(i - 0.1, j - 0.07, 0.2, 0.14, 0.9, col, 8.6, {r:0.01}));
  [[7.3, 3.8, PINK], [7.25, 5.3, LEAF]].forEach(([i, j, col]) => { B(i - 0.24, j - 0.24, 0.48, 0.48, 3.4, col, 0, {r:0.1}); ball(i, j, 3.4, 0.03, WHITE, "m", 6); });
  [[9.65, 4.0, LILAC], [9.55, 5.55, D("#F6E39A", "#8A7A3A")]].forEach(([i, j, col]) => { const b = K.sm(K.sph(0.34, 16, 10), col, X(i), hz(4.2), Z(j), null, "m"); b.scale.set(1, 0.62, 1); });
  { const ci = 9.9, cj = 1.75; [[-0.3, -0.18], [0.26, -0.18], [-0.3, 0.14], [0.26, 0.14]].forEach(([a, b]) => ball(ci + a + 0.02, cj + b + 0.02, 1.8, 0.05, INK, "s", 8));
    B(ci - 0.34, cj - 0.2, 0.68, 0.4, 1.2, SPROUT, 3, {r:0.02}); B(ci - 0.34, cj - 0.2, 0.68, 0.4, 1.2, SPROUT, 14, {r:0.02}); [-0.32, 0.3].forEach(a => B(ci + a, cj - 0.2, 0.03, 0.4, 13, SPROUT, 3, {r:0}));
    for(let k = 0; k < 9; k++) B(ci - 0.3 + k * 0.07, cj - 0.12, 0.055, 0.26, 7 + rnd(k) * 3, D(BOOK[k], K.sh(BOOK[k], -0.5)[0]), 15.2, {r:0.005}); }
  K.faceJ(6.6, 7.9, 0.03, 30, 52, D("#FFFFFF", "#8A847C"), "m", 0.01); K.decal(160, 110, (c, w, h) => { fillBg(c, w, h, "#FFF8EE"); ctext(c, "쉿! 🤫", w / 2, h * 0.3, h * 0.24, "#C2668A"); ctext(c, "도서관에서는", w / 2, h * 0.6, h * 0.14, "#6A5A64"); ctext(c, "사뿐사뿐 조용히", w / 2, h * 0.8, h * 0.14, "#6A5A64"); }, 1.24, hz(21), "i", 7.25, 0.04, hz(41));
}
/* =================================================================== 3학년 1반 */
function buildClass(){
  // 칠판 (움직이는 그림은 buildDyn) · 분필 받침 · 분필 · 지우개
  const alu = D("#C9CDD2", "#6A6E74");
  B(12.45, 0.0, 4.3, 0.06, 46, alu, 19, {r:0.01, cls:"s"}); K.faceJ(12.55, 16.65, 0.06, 21, 63, D("#3F6E58", "#24402F"), "m", 0.008);
  B(12.45, 0.06, 4.3, 0.13, 1.4, alu, 19.6, {r:0.01, cls:"s"});
  [[12.9, "#FFFFFF"], [13.05, "#F6E39A"], [13.2, "#F4A7B9"], [13.35, "#A9CBEA"]].forEach(([i, col]) => B(i, 0.1, 0.1, 0.03, 0.8, col, 21, {r:0}));
  B(15.9, 0.08, 0.34, 0.12, 1.6, D("#E8B5C8", "#7A5866"), 21, {r:0.02}); B(15.9, 0.08, 0.34, 0.12, 0.8, D("#5A5A5A", "#3A3A3A"), 20.6, {r:0});
  // 칠판 위: 태극기 액자 · 말씀 현수막 "서로 사랑하라"
  K.faceJ(14.15, 15.05, 0.03, 84, 104, D("#E8C36A", "#9A8040"), "m", 0.01); K.decal(120, 80, (c, w, h) => drawTaeguk(c, w, h), 0.8, hz(17.4), "i", 14.6, 0.04, hz(94));
  K.faceJ(12.9, 16.3, 0.03, 67.5, 79.5, D("#F4D3DF", "#6A4E5A"), "m", 0.01);
  K.decal(400, 46, (c, w, h) => { fillBg(c, w, h, "#FFF4F7"); c.strokeStyle = "#E8B5C8"; c.setLineDash([6, 5]); c.lineWidth = 2; c.strokeRect(4, 4, w - 8, h - 8); c.setLineDash([]);
    ctext(c, "♡ 서로 사랑하라 ♡", w * 0.42, h * 0.52, h * 0.5, "#B5607E"); ctext(c, "요 13:34", w * 0.86, h * 0.56, h * 0.3, "#9A7AA8"); }, 3.3, hz(11.4), "i", 14.6, 0.042, hz(73.5));
  // 창 둘 · 벽시계 (움직임) · 그림 게시판 · 시간표
  winJ(10.75, 12.2, 64, 102); winJ(17.0, 18.35, 64, 102);
  K.faceJ(10.75, 12.3, 0.03, 30, 58, D("#D9B98F", "#6B5440"), "m", 0.012);
  K.wtext("우리 반 그림 🖍️", 11.52, 0.045, 55, "i", 2.4, INK, null, 400, JUA);
  [[11.15, 46, 0], [11.88, 46, 1], [11.15, 36, 2], [11.88, 36, 3]].forEach(([i, z, k]) => K.decal(70, 56, (c, w, h) => kidDrawing(c, w, h, k), 0.6, hz(8.6), "i", i, 0.045, hz(z)));
  [[11.15, 50.4], [11.88, 50.4], [11.15, 40.4], [11.88, 40.4]].forEach(([i, z], k) => ball(i, 0.08, z, 0.025, RB[k], "s", 6));
  K.faceJ(17.0, 18.35, 0.03, 30, 58, D("#FFFFFF", "#8A847C"), "m", 0.012);
  K.decal(150, 110, (c, w, h) => { fillBg(c, w, h, "#F3FAF6"); ctext(c, "시간표", w / 2, h * 0.1, h * 0.11, "#3A8A78");
    const days = ["월", "화", "수", "목", "금"], sub = [["국어", "수학", "채플", "체육", "음악"], ["수학", "과학", "국어", "미술", "체육"], ["영어", "국어", "수학", "도서", "과학"], ["음악", "체육", "국어", "수학", "영어"]];
    days.forEach((d, x) => { ctext(c, d, w * (0.15 + x * 0.175), h * 0.25, h * 0.08, "#8B5A3C", "center", JUA);
      sub.forEach((r, y) => { c.fillStyle = ["#F7DCE6", "#E2D6EA", "#DDF0E8", "#FBE3BF"][(x + y) % 4]; c.fillRect(w * (0.07 + x * 0.175), h * (0.32 + y * 0.165), w * 0.16, h * 0.145); ctext(c, r[x], w * (0.15 + x * 0.175), h * (0.395 + y * 0.165), h * 0.075, "#4A3A40", "center", JUA); }); }); },
    1.3, hz(27), "i", 17.675, 0.045, hz(44));
  { const rim = K.sm(myGeo(new THREE.TorusGeometry(0.21, 0.025, 8, 28)), D("#F4A7B9", "#7A5866"), X(16.4), hz(91), Z(0.0) + 0.05, null, "s"); }
  // 선생님 책상 · 의자 · 사과 · 머그 · 출석부 · 꽃병
  B(16.95, 0.85, 1.3, 0.6, 1.8, D("#F3E2C6", "#6E5C48"), 18, {r:0.02}); B(17.0, 0.88, 1.2, 0.52, 18, WOODD, 0, {r:0.01}); K.faceJ(17.0, 18.2, 1.452, 2, 16, D("#E8B5C8", "#7A5866"), "m", 0.006);
  ball(17.2, 1.1, 21.3, 0.07, "#E04A3A", "m", 10); rod([17.2, 1.1, 22.8], [17.22, 1.1, 24.5], 0.006, WOODD, "m", 4);
  K.sm(K.cyl(0.05, 0.045, hz(4), 10), D("#A8DCC8", "#4E7A6E"), X(17.45), hz(21.8), Z(1.05), null, "s");
  B(17.65, 0.95, 0.36, 0.26, 0.9, D("#6F82CF", "#3E4A7A"), 19.8, {r:0.01}); B(17.68, 0.98, 0.3, 0.2, 0.3, WHITE, 20.7, {r:0});
  flowerPot(18.05, 1.25, "#F4A7B9", 0.45, D("#FFFFFF", "#8A847C"), 19.8);
  B(17.38, 0.27, 0.42, 0.38, 1.4, LILAC, 13.5, {r:0.03}); [[17.4, 0.3], [17.72, 0.3], [17.4, 0.58], [17.72, 0.58]].forEach(([i, j]) => B(i, j, 0.04, 0.04, 13.5, METAL, 0, {r:0, cls:"s"})); B(17.38, 0.2, 0.42, 0.06, 10, LILAC, 15, {r:0.02});
  // 사물함 (왼쪽 칸막이, +i 쪽으로 보임) · 이름표 · 어항 받침
  B(10.6, 2.3, 0.45, 4.6, 28, D("#FFFFFF", "#7A746C"), 0, {r:0.02});
  for(let r = 0; r < 2; r++) for(let k = 0; k < 8; k++){ const j0 = 2.34 + k * 0.565, z0 = 1.5 + r * 13.2;
    K.faceI(11.05, j0 + 0.02, j0 + 0.545, z0, z0 + 11.5, PAST[(k + r * 3) % 6], "m", 0.01); ball(11.07, j0 + 0.46, z0 + 5.5, 0.018, GOLD, "s", 6); }
  [["유나", 4.3, 7.0], ["지유", 4.86, 7.0], ["민준", 2.6, 20.2], ["서연", 3.15, 20.2]].forEach(([t, j, z]) => { K.faceI(11.062, j - 0.17, j + 0.17, z + 2.4, z + 4.8, WHITE, "m", 0.004); K.wtext(t, 11.07, j, z + 3.6, "j", 1.6, INK, null, 400, JUA); });
  // 책상 · 의자 (짝꿍 셋 × 세 줄), 이름표, 책 몇 권
  let n = 0;
  ROWS.forEach((dj, r) => PAIRS.forEach((pc, p) => [-0.36, 0.36].forEach((dx, s) => { const ci = pc + dx, nm = NAMES[r * 3 + p][s], mine = nm === "유나";
    kidDesk(ci, dj, mine ? PINK : PAST[(n + 1) % 6]); kidChair(ci, dj + 0.5, mine ? PINK : PAST[n % 6]);
    B(ci - 0.13, dj + 0.07, 0.26, 0.11, 0.3, D("#FFFFFF", "#9A948C"), 17, {r:0}); K.wtext(nm, ci, dj + 0.125, 17.4, "f", mine ? 2.2 : 2.0, mine ? "#C2668A" : "#4A4448", null, 400, JUA);
    if(rnd(n + 2) > 0.45){ B(ci - 0.25, dj - 0.17, 0.26, 0.2, 0.8, PAST[(n + 2) % 6], 17, {r:0.01}); B(ci - 0.24, dj - 0.16, 0.24, 0.18, 0.4, WHITE, 17.8, {r:0}); }
    if(rnd(n + 9) > 0.5) B(ci + 0.06, dj - 0.12, 0.22, 0.06, 1.2, PAST[(n + 4) % 6], 17, {r:0.02});
    n++; })));
  // 유나 책상: 분홍 필통 · 연필 · 공책 · 하트 스티커
  B(MYDESK[0] - 0.27, MYDESK[1] - 0.18, 0.3, 0.22, 0.8, D("#FFF4C2", "#8A7A50"), 17, {r:0.01}); K.wtext("유나 ♥", MYDESK[0] - 0.12, MYDESK[1] - 0.07, 18.0, "f", 1.6, "#C2668A", null, 400, JUA);
  rod([MYDESK[0] + 0.05, MYDESK[1] - 0.1, 17.4], [MYDESK[0] + 0.25, MYDESK[1] - 0.16, 17.4], 0.012, "#F6C94A", "s", 6);
  // 교실 뒤 (앞벽 안쪽) 화분 · 우산 꽂이
  K.plant(18.15, 6.85, true); K.plant(12.5, 6.9, false);
}
/* =================================================================== 음악실 */
function buildMusic(){
  winJ(21.2, 22.6, 60, 96);
  // 오선지 띠 (음표) · 찬양 포스터 · 계이름 포스터
  K.decal(600, 50, (c, w, h, dark) => { c.strokeStyle = dark ? "rgba(200,180,220,.5)" : "rgba(150,110,170,.55)"; c.lineWidth = 1.2;
    for(let k = 0; k < 5; k++){ c.beginPath(); for(let x = 0; x <= w; x += 8){ const y = h * (0.2 + k * 0.15) + Math.sin(x / w * PI * 2) * 4; x ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
    ["♪", "♫", "♩", "♬", "♪", "♫", "♩"].forEach((t, k) => ctext(c, t, w * (0.08 + k * 0.14), h * (0.4 + (k % 3) * 0.12), h * 0.5, RB[k % 6], "center", "system-ui", 700)); }, 4.2, 0.4, "i", 20.75, 0.02, hz(106));
  posterJ(18.8, 20.0, 0.03, 50, 76, (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#FBE3BF"); g.addColorStop(1, "#F7DCE6"); c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = "#E8C36A"; c.fillRect(w * 0.47, h * 0.1, w * 0.06, h * 0.26); c.fillRect(w * 0.38, h * 0.16, w * 0.24, h * 0.05);
    ctext(c, "찬양해요 ♪", w / 2, h * 0.52, h * 0.15, "#B5607E"); ctext(c, "기쁜 마음으로", w / 2, h * 0.72, h * 0.1, "#8A6A78"); ctext(c, "노래해요", w / 2, h * 0.86, h * 0.1, "#8A6A78"); }, D("#E8C36A", "#9A8040"));
  posterJ(20.4, 21.0, 0.03, 30, 56, (c, w, h) => { fillBg(c, w, h, "#FFFFFF"); ["도", "레", "미", "파", "솔", "라", "시"].forEach((t, k) => { c.fillStyle = ["#F4A7B9", "#F9C99B", "#F6E39A", "#A8DCC8", "#A9CBEA", "#C8B4D0", "#E8B5C8"][k]; c.fillRect(0, h * k / 7, w, h / 7 - 1); ctext(c, t, w / 2, h * (k + 0.5) / 7, h * 0.09, "#4A3A40"); }); }, LILAC);
  // 하얀 업라이트 피아노 · 건반 · 악보 · 의자(낮음)
  const pw = D("#FBF6EE", "#8A847C");
  B(19.0, 0.05, 1.3, 0.5, 29, pw, 0, {r:0.03, cls:"s"}); B(18.97, 0.02, 1.36, 0.56, 1.6, WOODL, 29, {r:0.02});
  B(19.02, 0.55, 1.26, 0.24, 1.6, pw, 19.6, {r:0.01, cls:"s"}); B(19.06, 0.56, 1.18, 0.2, 0.5, D("#FFFFFF", "#B8B2AA"), 21.2, {r:0, cls:"s"});
  for(let k = 0; k < 17; k++){ if([2, 6, 9, 13, 16].includes(k)) continue; B(19.1 + k * 0.067, 0.56, 0.035, 0.12, 0.7, INK, 21.6, {r:0, cls:"s"}); }
  B(19.1, 0.5, 1.1, 0.05, 6, D("#F4D3DF", "#6A4E5A"), 22, {r:0}); K.decal(110, 40, (c, w, h) => { fillBg(c, w, h, "#FFFFFF"); c.strokeStyle = "#9A8A94"; c.lineWidth = 1; for(let k = 0; k < 5; k++){ c.beginPath(); c.moveTo(4, 8 + k * 6); c.lineTo(w - 4, 8 + k * 6); c.stroke(); }
    ["♪", "♩", "♫", "♪"].forEach((t, k) => ctext(c, t, 18 + k * 24, 18 + (k % 2) * 6, 16, "#4A3A40", "center", "system-ui", 700)); }, 0.62, hz(6), "i", 19.65, 0.555, hz(25.5));
  [19.15, 20.15].forEach(i => B(i - 0.04, 0.55, 0.08, 0.3, 19, pw, 0, {r:0.01, cls:"s"}));
  B(19.3, 0.94, 0.7, 0.3, 1.6, PINK, 7.2, {r:0.04}); [19.34, 19.92].forEach(i => B(i, 0.98, 0.04, 0.22, 7.2, WOODD, 0, {r:0}));
  // 악기 선반: 탬버린 · 마라카스 · 리코더
  B(20.55, 0.05, 1.25, 0.38, 22, WOOD, 0, {r:0.02}); [8, 15].forEach(z => B(20.57, 0.07, 1.21, 0.34, 0.8, WOODL, z, {r:0}));
  [[20.8, PINK], [21.15, D("#F6E39A", "#8A7A3A")]].forEach(([i, col]) => { const t = K.sm(myGeo(new THREE.TorusGeometry(0.11, 0.025, 6, 18)), col, X(i), hz(22) + 0.03, Z(0.24), null, "m"); t.rotation.x = PI / 2; });
  [[21.45, "#E06A55"], [21.6, "#72C4AE"]].forEach(([i, col]) => { rod([i, 0.24, 15.8], [i, 0.24, 19.5], 0.012, WOODD, "m", 5); ball(i, 0.24, 21.2, 0.055, col, "m", 10); });
  for(let k = 0; k < 5; k++) rod([20.7 + k * 0.1, 0.2, 8.8], [20.7 + k * 0.1, 0.25, 13.8], 0.014, k % 2 ? D("#FFFFFF", "#8A847C") : D("#F7E4C8", "#8A7056"), "m", 6);
  // 드럼 세트 (오른쪽 뒤)
  { const di = 22.3, dj = 1.05; const bd = K.sm(K.cyl(0.24, 0.24, 0.22, 20), D("#E8B5C8", "#7A5866"), X(di), 0.25, Z(dj + 0.1), null, "s"); bd.rotation.x = PI / 2;
    const bf = K.sm(K.cyl(0.215, 0.215, 0.226, 20), WHITE, X(di), 0.25, Z(dj + 0.1), null, "s"); bf.rotation.x = PI / 2;
    K.wtext("♡", di, dj + 0.222, 8, "i", 4, "#E8B5C8", null, 800);
    K.sm(K.cyl(0.13, 0.13, hz(4), 16), D("#C8B4D0", "#5E4E68"), X(di - 0.32), hz(16), Z(dj + 0.32), null, "s"); disc(di - 0.32, dj + 0.32, 0.125, 18.02, 0.2, WHITE, "s", 16);
    rod([di - 0.32, dj + 0.32, 0], [di - 0.32, dj + 0.32, 14], 0.012, METAL, "s", 6);
    rod([di + 0.32, dj - 0.15, 0], [di + 0.32, dj - 0.15, 30], 0.012, METAL, "s", 6); disc(di + 0.32, dj - 0.15, 0.2, 30, 0.4, GOLD, "s", 20);
    rod([di - 0.05, dj - 0.2, 0], [di - 0.05, dj - 0.2, 24], 0.012, METAL, "s", 6); disc(di - 0.05, dj - 0.2, 0.14, 24, 0.4, GOLD, "s", 18); disc(di - 0.05, dj - 0.2, 0.14, 23, 0.4, GOLD, "s", 18);
    stool(di + 0.05, dj + 0.62, LILAC); }
  // 실로폰 둘 (무지개 건반) · 보면대
  [[2.55, 0], [4.4, 1]].forEach(([j0, k]) => { const i0 = 21.1, L = 1.0, d = 0.34;
    [[i0 + 0.05, j0 + 0.05], [i0 + L - 0.09, j0 + 0.05], [i0 + 0.05, j0 + d - 0.09], [i0 + L - 0.09, j0 + d - 0.09]].forEach(([i, j]) => B(i, j, 0.04, 0.04, 13, WOODD, 0, {r:0}));
    B(i0, j0, L, 0.05, 1.5, WOOD, 13, {r:0}); B(i0, j0 + d - 0.05, L, 0.05, 1.5, WOOD, 13, {r:0});
    for(let b = 0; b < 8; b++){ const len = d - 0.02 - b * 0.012; B(i0 + 0.05 + b * 0.115, j0 + (d - len) / 2, 0.095, len, 1.2, k ? D("#E9ECEF", "#7A7E84") : D(["#F25F5C", "#F9A04A", "#FFD43B", "#72C4AE", "#4DAA97", "#5E9BEA", "#9B7BC9", "#F06BA8"][b], "#5A5060"), 14.5, {r:0.01, cls:k ? "s" : "m"}); }
    rod([i0 + 0.2, j0 + d + 0.05, 16], [i0 + 0.35, j0 + d + 0.12, 16.5], 0.008, WOODD, "m", 4); ball(i0 + 0.36, j0 + d + 0.12, 16.6, 0.025, PINK, "m", 6); });
  rod([19.7, 3.1, 0], [19.7, 3.1, 26], 0.012, METAL, "s", 6); B(19.45, 3.08, 0.5, 0.04, 9, METAL, 26, {r:0, cls:"s"}); K.decal(60, 40, (c, w, h) => { fillBg(c, w, h, "#FFFFFF"); ctext(c, "♪ 작은 별", w / 2, h * 0.5, h * 0.32, "#6A5A64"); }, 0.46, hz(8), "i", 19.7, 3.12, hz(30.5));
  // 반원 의자 넷
  [19.3, 20.2, 21.1, 22.0].forEach((i, k) => kidChair(i, 5.75 - Math.abs(k - 1.5) * 0.15, PAST[(k + 2) % 6]));
}
/* =================================================================== 과학실 */
function buildSci(){
  winJ(23.6, 25.0, 62, 98, "city");
  // 뒷벽: 태양계 · 안전 수칙 · 유리장(병) · 지구본 · 강낭콩 화분
  posterJ(25.3, 26.9, 0.03, 66, 92, (c, w, h) => { const g = c.createLinearGradient(0, 0, w, 0); g.addColorStop(0, "#2B3560"); g.addColorStop(1, "#46508A"); c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = "#FFD43B"; c.beginPath(); c.arc(0, h / 2, h * 0.42, 0, 7); c.fill();
    [[0.25, 0.04, "#C9B8A8"], [0.34, 0.06, "#F2C38A"], [0.44, 0.065, "#6FB7FF"], [0.53, 0.05, "#E06A55"], [0.66, 0.12, "#E8B585"], [0.8, 0.1, "#F2DCA0"], [0.9, 0.07, "#9FE0E8"]].forEach(([x, r, col]) => { c.fillStyle = col; c.beginPath(); c.arc(w * x, h / 2, h * r * 1.4, 0, 7); c.fill(); });
    ctext(c, "우리 태양계 🪐", w / 2, h * 0.12, h * 0.13, "#FFFFFF"); for(let k = 0; k < 20; k++){ c.fillStyle = "rgba(255,255,255,.7)"; c.fillRect(rnd(k) * w, rnd(k + 5) * h, 1.5, 1.5); } }, D("#FFFFFF", "#8A847C"));
  posterI(23.12, 1.0, 2.4, 40, 64, (c, w, h) => { fillBg(c, w, h, "#FFFBEA"); ctext(c, "실험 안전 수칙 🧪", w / 2, h * 0.13, h * 0.11, "#E06A55");
    ["보안경 꼭 쓰기 🥽", "맛보지 않기 👅✖", "선생님 말씀 듣기 👂", "다 쓰면 정리하기 🧹"].forEach((t, k) => ctext(c, t, w * 0.08, h * (0.34 + k * 0.17), h * 0.09, "#4A4448", "left")); }, AMBER);
  B(25.85, 0.05, 1.05, 0.45, 30, D("#FFFFFF", "#7A746C"), 0, {r:0.02}); K.faceJ(25.9, 26.36, 0.5, 15, 28, D("#DCEAF6", "#5A6A7A"), "glass", 0.008); K.faceJ(26.4, 26.86, 0.5, 15, 28, D("#DCEAF6", "#5A6A7A"), "glass", 0.008);
  [[26.0, "#A8DCC8"], [26.15, "#F4A7B9"], [26.3, "#F6E39A"], [26.55, "#A9CBEA"], [26.72, "#C8B4D0"]].forEach(([i, col], k) => K.sm(K.cyl(0.045, 0.05, hz(6 + (k % 2) * 2), 10), D(col, "#5A5A6A"), X(i), hz(16 + (3 + (k % 2))), Z(0.26), null, "glass"));
  { const gi = 26.55, gj = 0.28; disc(gi, gj, 0.1, 30, 0.8, GOLD, "s", 14); rod([gi, gj, 30.8], [gi, gj, 34], 0.015, GOLD, "s", 6);
    ball(gi, gj, 40.5, 0.19, D("#7FC4EA", "#3E5A80"), "s", 20); [[0.08, 0.1, 43, 0.08], [-0.1, 0.08, 39, 0.07], [0.02, 0.15, 37, 0.06], [0.12, -0.02, 38, 0.06]].forEach(([di, dj, z, r]) => { const o = ball(gi + di, gj + dj, z, r, D("#8BCB7A", "#3E6A40"), "s", 10); o.scale.set(1, 0.7, 0.5); });
    const ring = K.sm(myGeo(new THREE.TorusGeometry(0.215, 0.012, 6, 28, PI)), GOLD, X(gi), hz(40.5), Z(gj), null, "s"); ring.rotation.y = PI / 2; }
  [25.95, 26.2].forEach((i, k) => { B(i - 0.08, 0.12, 0.16, 0.16, 4, PINK, 30, {r:0.03}); rod([i, 0.2, 34], [i, 0.2, 41], 0.008, D("#5FA582", "#3E6E54"), "m", 4); ball(i + 0.03, 0.2, 40, 0.04, K.sh("plant", 0.12), "m", 6); ball(i - 0.03, 0.2, 38, 0.035, "plant", "m", 6); });
  // 실험대 둘 (흰 몸통 · 검은 상판 · 개수대 · 수도꼭지)
  const top = D("#3A3E44", "#24262A");
  [[2.0, 3.0], [4.5, 5.5]].forEach(([j0, j1], t) => { B(23.55, j0 + 0.05, 2.9, j1 - j0 - 0.1, 19, D("#FFFFFF", "#7A746C"), 0, {r:0.02});
    B(23.5, j0, 3.0, j1 - j0, 1.8, top, 19, {r:0.02, cls:"s"}); K.faceJ(23.6, 26.4, j1 - 0.045, 2, 17, LEAF2, "m", 0.004);
    B(24.85, (j0 + j1) / 2 - 0.15, 0.3, 0.3, 0.3, METAL2, 20.6, {r:0.02, cls:"s"}); rod([25.0, (j0 + j1) / 2 - 0.22, 20.8], [25.0, (j0 + j1) / 2 - 0.22, 26], 0.014, STEEL, "s", 6); rod([25.0, (j0 + j1) / 2 - 0.22, 26], [25.0, (j0 + j1) / 2 - 0.08, 25], 0.012, STEEL, "s", 6);
    [24.0, 25.0, 26.0].forEach((i, k) => stool(i, j0 - 0.3, PAST[(k + t * 2) % 6])); });
  // 비커 · 플라스크 · 시험관 (거품은 buildDyn) · 현미경 · 돋보기
  [[24.45, 2.5, "#F4A7B9", 0.085], [24.68, 2.62, "#A8DCC8", 0.07], [25.5, 2.45, "#C8B4D0", 0.08]].forEach(([i, j, col, r]) => {
    K.sm(K.cyl(r * 0.92, r * 0.92, hz(5), 14), D(col, K.sh(col, -0.4)[0]), X(i), hz(20.8 + 2.5), Z(j), null, "m");
    K.sm(K.cyl(r, r, hz(8.5), 16, true), D("#E4F0F6", "#6A7A8A"), X(i), hz(20.8 + 4.25), Z(j), null, "glass"); });
  { const fi = 25.9, fj = 2.55; K.sm(myGeo(new THREE.ConeGeometry(0.11, hz(6), 16)), D("#F6E39A", "#8A7A3A"), X(fi), hz(23.8), Z(fj), null, "m"); K.sm(K.cyl(0.03, 0.03, hz(4), 10), D("#E4F0F6", "#6A7A8A"), X(fi), hz(28.8), Z(fj), null, "glass"); }
  B(23.75, 2.35, 0.36, 0.14, 2.2, WOOD, 20.8, {r:0.01}); [23.82, 23.9, 23.98, 24.06].forEach((i, k) => K.sm(K.cyl(0.018, 0.018, hz(7), 8), D(RB[k + 1], "#6A6A7A"), X(i), hz(24.5), Z(2.42), null, "glass"));
  { const mi = 24.1, mj = 4.95, mc = D("#F7F7F7", "#8A8A8A"); B(mi - 0.13, mj - 0.1, 0.26, 0.22, 1.5, mc, 20.8, {r:0.03, cls:"s"}); rod([mi, mj + 0.08, 22], [mi, mj + 0.05, 30], 0.03, mc, "s", 8);
    rod([mi, mj + 0.05, 30], [mi, mj - 0.04, 34], 0.03, INK, "s", 10); B(mi - 0.08, mj - 0.08, 0.16, 0.12, 0.6, INK, 25, {r:0, cls:"s"}); disc(mi, mj - 0.02, 0.025, 34, 1.2, INK, "s", 8); }
  { const g = K.sm(myGeo(new THREE.TorusGeometry(0.07, 0.012, 6, 18)), INK, X(25.6), hz(21.1), Z(4.95), null, "s"); g.rotation.x = PI / 2; rod([25.67, 4.95, 21], [25.85, 5.05, 21], 0.012, D("#E8A04A", "#9A6A30"), "s", 6); }
  [[25.2, 5.05, "#72C4AE"], [25.35, 4.9, "#F4A7B9"]].forEach(([i, j, col]) => B(i - 0.06, j - 0.04, 0.12, 0.08, 0.6, col, 20.8, {r:0}));
  // 해골 모형 "뼈다귀 아저씨" (오른쪽 뒤 구석)
  { const si = 27.0, sj = 1.0, bn = D("#FBF6E8", "#A8A294"); disc(si, sj, 0.16, 0, 1.2, METAL, "s", 14); rod([si, sj, 1], [si, sj, 50], 0.012, METAL, "s", 6);
    ball(si, sj + 0.02, 46.5, 0.12, bn, "s", 14); [[-0.04], [0.04]].forEach(([d]) => ball(si + d, sj + 0.11, 47, 0.025, INK, "s", 6)); B(si - 0.05, sj + 0.06, 0.1, 0.06, 1.5, bn, 41.8, {r:0.01});
    rod([si, sj, 41], [si, sj, 22], 0.02, bn, "s", 6);
    for(let k = 0; k < 4; k++){ const t = K.sm(myGeo(new THREE.TorusGeometry(0.1 - k * 0.008, 0.012, 5, 16)), bn, X(si), hz(38 - k * 3.2), Z(sj), null, "s"); t.rotation.x = PI / 2; t.scale.z = 0.75; }
    [-1, 1].forEach(sd => { rod([si + sd * 0.1, sj, 39], [si + sd * 0.2, sj + 0.03, 27], 0.013, bn, "s", 5); rod([si + sd * 0.2, sj + 0.03, 27], [si + sd * 0.22, sj + 0.08, 17], 0.011, bn, "s", 5);
      rod([si + sd * 0.06, sj, 22], [si + sd * 0.09, sj, 11], 0.016, bn, "s", 5); rod([si + sd * 0.09, sj, 11], [si + sd * 0.09, sj, 2], 0.014, bn, "s", 5); });
    K.sm(myGeo(new THREE.TorusGeometry(0.08, 0.016, 5, 14)), bn, X(si), hz(22), Z(sj), null, "s").rotation.x = PI / 2; }
  K.plant(27.0, 6.8, true);
}
/* =================================================================== 채플실 */
function buildChapel(){
  // 십자가 뒤 라일락 판 · 나무 십자가 · 스테인드글라스 창 둘 · 오르간 · 강대상 · 꽃
  K.faceJ(29.05, 30.45, 0.03, 38, 104, LILAC2, "m", 0.01);
  B(29.68, 0.04, 0.14, 0.07, 48, WOODD, 50, {r:0.01}); B(29.42, 0.04, 0.66, 0.07, 4.6, WOODD, 82, {r:0.01});
  const stained = (i0, i1, seed) => { const ww = i1 - i0, wh = hz(58);
    K.decal(Math.round(ww * 100), Math.round(wh * 100), (c, w, h, dark) => {
      c.fillStyle = dark ? "#3A3048" : "#F4EEF8"; c.fillRect(0, 0, w, h);
      c.save(); c.beginPath(); c.moveTo(0, h); c.lineTo(0, w * 0.5); c.arc(w / 2, w * 0.5, w / 2, PI, 0); c.lineTo(w, h); c.closePath(); c.clip();
      const cols = dark ? ["#8A6A9A", "#6A8AAA", "#AA8A5A", "#9A6A7A", "#6A9A8A"] : ["#F4A7B9", "#A9CBEA", "#F6E39A", "#C8B4D0", "#A8DCC8", "#F9C99B"];
      for(let y = 0; y < h; y += w / 3) for(let x = 0; x < w; x += w / 3){ c.fillStyle = cols[Math.floor(rnd(seed + x * 3 + y) * cols.length)]; c.fillRect(x, y, w / 3, w / 3); }
      c.fillStyle = dark ? "#C9B8E0" : "#FFFFFF"; c.globalAlpha = 0.85; c.beginPath(); c.arc(w / 2, w * 0.55, w * 0.22, 0, 7); c.fill(); c.globalAlpha = 1;
      c.fillStyle = dark ? "#E8D8A0" : "#E8C36A"; c.fillRect(w * 0.47, w * 0.38, w * 0.06, w * 0.34); c.fillRect(w * 0.38, w * 0.46, w * 0.24, w * 0.05);
      c.strokeStyle = dark ? "#2A2430" : "#5A4A50"; c.lineWidth = 2; for(let y = 0; y < h; y += w / 3){ c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); } for(let x = w / 3; x < w; x += w / 3){ c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); }
      const s = c.createLinearGradient(w, 0, 0, h); s.addColorStop(0, "rgba(255,255,255,.3)"); s.addColorStop(0.5, "rgba(255,255,255,0)"); c.fillStyle = s; c.fillRect(0, 0, w, h); c.restore(); },
      ww, wh, "i", (i0 + i1) / 2, 0.0, hz(69));
    B(i0 - 0.06, 0.012, 0.06, 0.07, 46, WHITE, 39, {r:0, cls:"s"}); B(i1, 0.012, 0.06, 0.07, 46, WHITE, 39, {r:0, cls:"s"}); B(i0 - 0.1, 0.012, ww + 0.2, 0.16, 1.8, WHITE, 38, {r:0, cls:"s"});
    const ar = K.sm(myGeo(new THREE.TorusGeometry(ww / 2 + 0.03, 0.035, 6, 20, PI)), WHITE, X((i0 + i1) / 2), hz(98) - ww / 2, Z(0.05), null, "s"); };
  stained(27.95, 28.85, 3); stained(30.65, 31.55, 11);
  { const oi = 30.85, fr = WOODD; B(oi, 0.05, 1.0, 0.48, 24, fr, 0, {r:0.02}); B(oi + 0.04, 0.53, 0.92, 0.2, 1.4, fr, 18, {r:0.01}); B(oi + 0.06, 0.54, 0.88, 0.16, 0.5, D("#FFFFFF", "#B8B2AA"), 19.4, {r:0, cls:"s"});
    for(let k = 0; k < 12; k++){ if([2, 6, 9].includes(k)) continue; B(oi + 0.1 + k * 0.068, 0.54, 0.035, 0.09, 0.6, INK, 19.9, {r:0, cls:"s"}); }
    for(let k = 0; k < 7; k++) rod([oi + 0.15 + k * 0.12, 0.2, 24], [oi + 0.15 + k * 0.12, 0.2, 30 + (3 - Math.abs(k - 3)) * 3.4], 0.03, GOLD, "s", 8);
    B(oi + 0.2, 0.92, 0.6, 0.26, 1.4, fr, 8.2, {r:0.03}); [oi + 0.24, oi + 0.72].forEach(i => B(i, 0.96, 0.04, 0.18, 8.2, fr, 0, {r:0})); }
  { const pi = 29.35, pj = 1.05; B(pi + 0.05, pj + 0.04, 0.7, 0.42, 28, WOOD, 0, {r:0.02}); B(pi, pj, 0.8, 0.5, 1.8, WOODD, 28, {r:0.02}); B(pi - 0.02, pj - 0.02, 0.84, 0.54, 1.6, WOODD, 0, {r:0.02});
    K.faceJ(pi + 0.16, pi + 0.64, pj + 0.462, 7, 26, PINK2, "m", 0.008); B(pi + 0.37, pj + 0.47, 0.06, 0.01, 11, GOLD, 11, {r:0, cls:"s"}); B(pi + 0.3, pj + 0.47, 0.2, 0.01, 1.6, GOLD, 18.5, {r:0, cls:"s"});
    B(pi + 0.2, pj + 0.12, 0.4, 0.28, 0.8, D("#FFFDF6", "#8A847C"), 29.8, {r:0.01}); B(pi + 0.39, pj + 0.12, 0.02, 0.28, 1, D("#7A3A3A", "#3A2420"), 29.9, {r:0}); }
  [[28.75, 1.25, "#F4A7B9"], [30.75, 1.25, "#F6E39A"]].forEach(([i, j, col]) => { K.sm(K.cyl(0.06, 0.09, hz(16), 10), WOOD, X(i), hz(8), Z(j), null, "m"); flowerPot(i, j, col, 0.7, WHITE, 16); });
  // 촛불 둘 (밤에 반짝)
  [28.75, 30.75].forEach(i => { K.sm(K.cyl(0.025, 0.025, hz(5), 8), WHITE, X(i + (i < 29 ? 0.22 : -0.22)), hz(30.5), Z(0.4), null, "m"); B(i + (i < 29 ? 0.12 : -0.32), 0.25, 0.2, 0.3, 28, WOOD, 0, {r:0.02}); ball(i + (i < 29 ? 0.22 : -0.22), 0.4, 34, 0.022, "#FFD68C", "glow", 6); });
  // 장의자 3줄 × 2 (등받이 +j, 앉으면 −j를 봄) · 찬송가
  [3.3, 4.5, 5.7].forEach((pj, r) => [[27.8, 29.2], [30.3, 31.7]].forEach(([a, b], s) => {
    B(a, pj - 0.2, b - a, 0.4, 1.4, WOOD, 9.2, {r:0.03}); B(a + 0.02, pj - 0.17, b - a - 0.04, 0.34, 0.6, PINK2, 10.6, {r:0.03});
    [a, b - 0.06].forEach(i => B(i, pj - 0.2, 0.06, 0.48, 22, WOODD, 0, {r:0.01})); B(a + 0.06, pj + 0.18, b - a - 0.12, 0.06, 10, WOOD, 12, {r:0.01});
    B(a + 0.2 + r * 0.3, pj - 0.1, 0.16, 0.22, 0.8, D(s ? "#7A3A3A" : "#3E2A20", "#3A2420"), 11.2, {r:0.01}); }));
  posterI(27.62, 4.0, 5.6, 14, 28, (c, w, h) => { fillBg(c, w, h, "#FFF8EE"); ctext(c, "하나님은 사랑이십니다", w / 2, h * 0.42, h * 0.2, "#8B5A3C"); ctext(c, "요일 4:16 ♡", w / 2, h * 0.75, h * 0.15, "#B98AA0"); }, D("#EAD9C0", "#5A4A38"));
}
/* =================================================================== 복도 */
function buildHall(){
  const fj = RJ + T / 2;
  posterJ(13.3, 14.2, fj, 6, 30, (c, w, h) => { fillBg(c, w, h, "#F3F6FB"); ctext(c, "교복 바르게 ✨", w / 2, h * 0.1, h * 0.09, "#3E4A7A");
    [[0.3, "#F06BA8"], [0.7, "#5E9BEA"]].forEach(([x, tie], k) => { c.fillStyle = "#F0D2BC"; c.beginPath(); c.arc(w * x, h * 0.3, w * 0.08, 0, 7); c.fill(); c.fillStyle = "#3A261C"; c.beginPath(); c.arc(w * x, h * 0.27, w * 0.085, PI, 0); c.fill();
      if(!k){ c.beginPath(); c.arc(w * (x - 0.09), h * 0.3, w * 0.035, 0, 7); c.arc(w * (x + 0.09), h * 0.3, w * 0.035, 0, 7); c.fill(); }
      c.fillStyle = "#2E3A5C"; c.fillRect(w * (x - 0.12), h * 0.4, w * 0.24, h * 0.28); c.fillStyle = "#FFFFFF"; c.beginPath(); c.moveTo(w * (x - 0.05), h * 0.4); c.lineTo(w * x, h * 0.48); c.lineTo(w * (x + 0.05), h * 0.4); c.fill();
      c.fillStyle = tie; c.fillRect(w * (x - 0.015), h * 0.44, w * 0.03, h * 0.1); c.fillStyle = "#E8C36A"; c.beginPath(); c.arc(w * (x + 0.07), h * 0.47, w * 0.022, 0, 7); c.fill();
      c.fillStyle = k ? "#3E4A6A" : "#C8B4D0"; c.fillRect(w * (x - 0.11), h * 0.68, w * 0.22, h * 0.14); c.fillStyle = "#2A2A28"; c.fillRect(w * (x - 0.08), h * 0.82, w * 0.06, h * 0.08); c.fillRect(w * (x + 0.02), h * 0.82, w * 0.06, h * 0.08); });
    ctext(c, "단정한 크레용인 💕", w / 2, h * 0.95, h * 0.07, "#8A6A78"); });
  posterJ(14.55, 15.6, fj, 10, 28, (c, w, h) => { fillBg(c, w, h, "#FFF4E8"); ctext(c, "복도에서는", w / 2, h * 0.3, h * 0.17, "#8B5A3C"); ctext(c, "사뿐사뿐 🐾", w / 2, h * 0.62, h * 0.2, "#E8A04A"); }, AMBER);
  posterJ(26.5, 27.4, fj, 10, 28, (c, w, h) => { fillBg(c, w, h, "#F3FAF6"); ctext(c, "궁금한 건", w / 2, h * 0.3, h * 0.17, "#3A8A78"); ctext(c, "실험해 봐요! 🔬", w / 2, h * 0.62, h * 0.16, "#4DAA97"); }, LEAF);
  posterJ(5.0, 5.9, fj, 10, 28, (c, w, h) => { fillBg(c, w, h, "#FFFDF6"); ctext(c, "손 씻기 🫧", w / 2, h * 0.32, h * 0.18, "#5E9BEA"); ctext(c, "30초 뽀득뽀득", w / 2, h * 0.65, h * 0.13, "#6A5A64"); }, SKY);
  // 정수기 · 화분 · 분실물 상자
  B(19.15, RJ + 0.12, 0.42, 0.36, 34, D("#FFFFFF", "#8A847C"), 0, {r:0.04, cls:"s"}); K.faceJ(19.2, 19.52, RJ + 0.482, 18, 28, D("#A9CBEA", "#4E6A88"), "m", 0.006); B(19.28, RJ + 0.46, 0.16, 0.06, 1, METAL, 17, {r:0, cls:"s"});
  K.sm(K.cyl(0.13, 0.13, hz(12), 14), D("#DCEAF6", "#5A6A7A"), X(19.36), hz(40), Z(RJ + 0.3), null, "glass");
  K.wtext("💧", 19.36, RJ + 0.49, 31, "i", 3, "#5E9BEA", null, 800);
  [[0.45, RJ + 0.45], [AW - 0.45, RJ + 0.45], [9.9, BJ - 0.38], [22.0, BJ - 0.38]].forEach(([i, j]) => K.plant(i, j, true));
  B(22.4, RJ + 0.14, 0.62, 0.4, 12, D("#F6E39A", "#8A7A3A"), 0, {r:0.04}); K.wtext("분실물 🧦", 22.71, RJ + 0.552, 7, "i", 2.2, INK, null, 400, JUA);
  ball(22.6, RJ + 0.32, 13, 0.08, "#F25F5C", "m", 10); B(22.7, RJ + 0.24, 0.22, 0.14, 2.2, D("#A9CBEA", "#4E6A88"), 12, {r:0.03});
}
/* =================================================================== 운동장 */
function goal(im, dir){   // im = 골문 입구 i, dir +1 = 입구가 +i 쪽 (왼쪽 골대) · −1 = 오른쪽 골대
  const ib = im - dir * 0.75, j0 = 15.4, j1 = 17.8, H = 46, Hb = 28, wp = D("#FFFFFF", "#C9CDD2");
  [j0, j1].forEach(j => { rod([im, j, 0], [im, j, H], 0.045, wp, "s", 10); rod([ib, j, 0], [ib, j, Hb], 0.025, wp, "s", 8); rod([im, j, H], [ib, j, Hb], 0.025, wp, "s", 8); });
  rod([im, j0, H], [im, j1, H], 0.045, wp, "s", 10); rod([ib, j0, Hb], [ib, j1, Hb], 0.025, wp, "s", 8);
  K.faceI(Math.min(ib, im + 0.0) + (dir > 0 ? -0.01 : 0), j0, j1, 0.5, Hb, NET, "glass", 0.012);
  [j0, j1 - 0.012].forEach(j => K.faceJ(Math.min(ib, im), Math.max(ib, im), j, 0.5, Hb, NET, "glass", 0.012));
  K.decal(160, 60, (c, w, h, dark) => { c.strokeStyle = dark ? "rgba(220,220,220,.4)" : "rgba(255,255,255,.95)"; c.lineWidth = 1.4; for(let x = 0; x <= w; x += 10){ c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); } for(let y = 0; y <= h; y += 10){ c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); } },
    j1 - j0, hz(Hb - 0.5), dir > 0 ? "j" : "-j", ib, (j0 + j1) / 2, hz((Hb + 0.5) / 2));
}
function buildField(){
  // 화단 (건물 앞 · 울타리 앞) · 꽃
  const planter = (i0, i1, j0, j1, seed) => { B(i0, j0, i1 - i0, j1 - j0, 7, D("#E9D2B4", "#6A5440"), 0, {r:0.04}); B(i0 + 0.05, j0 + 0.05, i1 - i0 - 0.1, j1 - j0 - 0.1, 0.6, D("#7A5A3C", "#3A2A20"), 7, {r:0.02});
    for(let i = i0 + 0.2, k = seed; i < i1 - 0.1; i += 0.34, k++) flowerStem(i, (j0 + j1) / 2 + (k % 2 ? 0.08 : -0.08), RB[k % 6], 16 + (k % 3) * 3);
    for(let i = i0 + 0.35; i < i1 - 0.2; i += 0.68) ball(i, j0 + 0.12, 9, 0.11, K.sh("plant", (i * 7 % 3) * 0.05), "m", 8); };
  planter(0.3, 3.7, BJ + 0.18, BJ + 0.72, 0); planter(6.0, 13.8, BJ + 0.18, BJ + 0.72, 3); planter(18.2, 26.3, BJ + 0.18, BJ + 0.72, 7); planter(30.5, 31.85, BJ + 0.18, BJ + 0.72, 2);
  planter(8.0, 13.6, FJ - 0.75, FJ - 0.2, 5); planter(19.6, 24.4, FJ - 0.75, FJ - 0.2, 9);
  // 울타리 (흰 말뚝 + 분홍 가로대) · 정문 기둥 · 무지개 아치 · 경비실
  const fence = (a, b, fixed, axis) => { const n = Math.max(1, Math.round((b - a) / 0.42));
    for(let k = 0; k <= n; k++){ const u = a + (b - a) * k / n; if(axis === "i") B(u - 0.03, fixed - 0.03, 0.06, 0.06, 24, WHITE, 0, {r:0.01}); else B(fixed - 0.03, u - 0.03, 0.06, 0.06, 24, WHITE, 0, {r:0.01}); }
    [7, 18].forEach(z => axis === "i" ? B(a, fixed - 0.015, b - a, 0.03, 1.6, PINK, z, {r:0}) : B(fixed - 0.015, a, 0.03, b - a, 1.6, PINK, z, {r:0})); };
  fence(-0.3, GATE[0] - 0.25, FJ, "i"); fence(GATE[1] + 0.25, AW + 0.3, FJ, "i"); fence(BJ + 0.15, FJ, -0.3, "j"); fence(BJ + 0.15, FJ, AW + 0.3, "j");
  [GATE[0] - 0.25, GATE[1] - 0.15].forEach(i => { B(i, FJ - 0.2, 0.4, 0.4, 62, D("#F3E4DA", "#5A4C44"), 0, {r:0.03}); B(i - 0.04, FJ - 0.24, 0.48, 0.48, 3, PINK, 62, {r:0.02}); ball(i + 0.2, FJ, 68, 0.11, D("#FFF3D6", "#FFD9A0"), "glow", 12); });
  { const ac = (GATE[0] + GATE[1]) / 2, ar = (GATE[1] - GATE[0]) / 2 + 0.05; K.sm(myGeo(new THREE.TorusGeometry(ar, 0.06, 8, 30, PI)), PINK, X(ac), hz(64), Z(FJ), null, "m");
    [0.25, 0.7, 1.15, 1.6, 2.05, 2.5, 2.9].forEach((t, k) => ball(ac + Math.cos(t) * ar, FJ, 64 + Math.sin(t) * ar * 31.1, 0.075, RB[k % 6], "m", 8));
    K.wtext("크레용초등학교", ac, FJ, 81, "i", 4.8, D("#C2668A", "#F4C7D4"), D("#FFFFFF", "#5A3A48"), 400, JUA);   // 판 없이 글씨만 (카메라 앞을 막지 않게)
    K.wtext("내일 또 만나요 👋", ac, FJ, 81, "-i", 3.8, D("#3A8A78", "#9EE3D3"), D("#FFFFFF", "#2A4A44"), 400, JUA);
    K.decal(60, 70, (c, w, h) => drawCrest(c, w, h), 0.34, 0.4, "i", ac, FJ + 0.04, hz(92) + 0.18); }
  { const gi = 18.4, gj = 22.25, gw = D("#FBF6EE", "#5A524C"); B(gi, gj, 1.2, 1.0, 52, gw, 0, {r:0.03}); B(gi - 0.1, gj - 0.1, 1.4, 1.2, 4, PINK, 52, {r:0.04});
    K.faceJ(gi + 0.15, gi + 1.05, gj + 1.0, 26, 44, D("#CFE3F0", "#5A6A88"), "glass", 0.012); K.faceJ(gi + 0.1, gi + 1.1, gj + 1.0, 46, 51, LEAF, "m", 0.01);
    K.wtext("경비실", gi + 0.6, gj + 1.012, 48.5, "i", 2.6, "#FFFFFF", null, 400, JUA); K.faceI(gi + 1.2, gj + 0.15, gj + 0.85, 0, 44, D("#C9A27A", "#6B4E38"), "m", 0.012); }
  // 철봉 셋 (낮은 것 → 높은 것)
  { const ps = [1.3, 2.35, 3.4, 4.45], bj = 12.4, hs = [25, 32, 39];
    ps.forEach((i, k) => rod([i, bj, 0], [i, bj, hs[Math.min(k, 2)] + 3], 0.04, D("#5E9BEA", "#3E5A88"), "s", 10));
    hs.forEach((z, k) => rod([ps[k], bj, z], [ps[k + 1], bj, z], 0.022, D("#D2D6DA", "#7A7E84"), "s", 10));
    K.wtext("철봉", 2.9, bj + 0.05, 8, "i", 3, D("#3E5A88", "#A9CBEA"), null, 400, JUA); }
  // 구름사다리 (무지개 가로대)
  { const i0 = 1.0, i1 = 4.6, j0 = 15.0, j1 = 15.9, z = 52, pc = D("#F06BA8", "#9A4E6A");
    [[i0, j0], [i0, j1], [i1, j0], [i1, j1], [(i0 + i1) / 2, j0], [(i0 + i1) / 2, j1]].forEach(([i, j]) => rod([i, j, 0], [i, j, z], 0.04, pc, "s", 10));
    [j0, j1].forEach(j => rod([i0, j, z], [i1, j, z], 0.035, pc, "s", 10));
    for(let k = 0, i = i0 + 0.3; i < i1 - 0.1; i += 0.3, k++) rod([i, j0, z], [i, j1, z], 0.018, RB[k % 6], "s", 6);
    [[i0, 14], [i0, 28], [i0, 42]].forEach(([i, zz]) => rod([i, j0, zz], [i, j1, zz], 0.018, D("#FFFFFF", "#9A948C"), "s", 6));
    [[i1, 14], [i1, 28], [i1, 42]].forEach(([i, zz]) => rod([i, j0, zz], [i, j1, zz], 0.018, D("#FFFFFF", "#9A948C"), "s", 6)); }
  // 정글짐 (알록달록 큐브)
  { const gi = 2.0, gj = 18.0, s = 0.5, n = 3;
    for(let a = 0; a <= n; a++) for(let b = 0; b <= n; b++) rod([gi + a * s, gj + b * s, 0], [gi + a * s, gj + b * s, n * 15], 0.022, RB[(a + b) % 6], "s", 6);
    for(let lv = 1; lv <= n; lv++) for(let a = 0; a <= n; a++){ rod([gi + a * s, gj, lv * 15], [gi + a * s, gj + n * s, lv * 15], 0.018, RB[(lv + a) % 6], "s", 6); rod([gi, gj + a * s, lv * 15], [gi + n * s, gj + a * s, lv * 15], 0.018, RB[(lv + a + 3) % 6], "s", 6); }
    ball(gi + n * s / 2, gj + n * s / 2, n * 15 + 6, 0.1, D("#F6E39A", "#8A7A3A"), "m", 10); }
  // 축구 골대 둘
  goal(9.7, 1); goal(22.3, -1);
  // 국기 게양대 (태극기 · 교기는 buildDyn에서 펄럭)
  B(27.3, 10.6, 2.6, 1.2, 4, D("#E9E1D6", "#4E4842"), 0, {r:0.04}); B(27.4, 10.7, 2.4, 1.0, 1.2, D("#F6F1EA", "#5A544E"), 4, {r:0.03});
  FLAGS.forEach(([i, h]) => { rod([i, 11.1, 5], [i, 11.1, h], 0.03, D("#E9ECEF", "#9A9EA4"), "s", 10); ball(i, 11.1, h + 2, 0.06, GOLD, "s", 10); disc(i, 11.1, 0.09, 5, 2, METAL2, "s", 12); });
  K.wtext("국기에 대하여 경례 🫡", 28.6, 11.82, 2.4, "i", 2.6, D("#6A5A64", "#C9B8C4"), null, 400, JUA);
  // 느티나무 (큰 그늘) · 벚나무 · 벤치
  const TI = 30.6, TJ = 16.4;
  K.sm(K.cyl(0.2, 0.32, hz(70), 12), D("#8A6A4C", "#4A3828"), X(TI), hz(35), Z(TJ), null, "m");
  [[0, 0, 100, 1.25], [-0.8, 0.3, 86, 0.9], [0.85, 0.2, 88, 0.95], [0.1, -0.85, 90, 0.85], [0.15, 0.85, 84, 0.85], [0, 0, 124, 0.85], [-0.55, -0.6, 104, 0.7], [0.6, -0.4, 108, 0.7], [-0.4, 0.7, 106, 0.65], [0.7, 0.65, 102, 0.6]].forEach(([di, dj, z, r], k) =>
    ball(TI + di, TJ + dj, z, r, k % 3 ? K.sh("plant", (k % 2) * 0.12) : K.sh("plant", -0.08), "m", 16));
  rod([TI, TJ, 60], [TI - 0.7, TJ - 0.5, 82], 0.08, D("#8A6A4C", "#4A3828"), "m", 8); rod([TI, TJ, 64], [TI + 0.7, TJ + 0.4, 84], 0.08, D("#8A6A4C", "#4A3828"), "m", 8);
  K.wtext("120살 느티나무 🌳", TI, TJ + 0.32, 26, "i", 2.2, D("#FFFFFF", "#E9D2B0"), null, 400, JUA); B(TI - 0.28, TJ + 0.28, 0.56, 0.04, 4, WOODD, 23.8, {r:0.01});
  benchJ(13.6, 15.2, 27.35, "+i"); benchJ(17.6, 19.2, 27.35, "+i"); benchJ(19.0, 20.6, 0.55, "-i"); benchI(28.8, 30.4, 18.75, "+j");
  tree(5.6, 13.4, 1.15, true); tree(26.1, 22.0, 1.0, true); tree(31.4, 11.2, 0.9, false); tree(0.55, 21.0, 0.85, false); tree(7.2, 22.7, 0.75, true); tree(31.3, 22.5, 0.9, true);
  // 가로등 셋
  [[6.4, 22.55], [25.4, 11.0], [0.4, 11.2]].forEach(([i, j]) => { disc(i, j, 0.12, 0, 1.5, INK, "s", 12); rod([i, j, 1], [i, j, 96], 0.03, D("#5A5E64", "#3A3C40"), "s", 8); B(i - 0.1, j - 0.1, 0.2, 0.2, 2, INK, 96, {r:0.02, cls:"s"}); ball(i, j, 102, 0.12, D("#FFF6E0", "#FFE2A8"), "glow", 12); B(i - 0.13, j - 0.13, 0.26, 0.26, 2, INK, 106, {r:0.03, cls:"s"}); });
  // 운동장 구석: 공 바구니 · 줄넘기 · 체육 창고 (작게)
  { const si = 30.8, sj = 20.0; B(si, sj, 1.2, 1.4, 50, D("#F3E4DA", "#5A4C44"), 0, {r:0.03}); B(si - 0.08, sj - 0.08, 1.36, 1.56, 4, LEAF, 50, {r:0.04}); K.faceI(si - 0.012, sj + 0.25, sj + 1.15, 0, 40, D("#A8DCC8", "#4E7A6E"), "m", 0.012);
    K.wtext("체육 창고", si - 0.03, sj + 0.7, 44.5, "-j", 2.4, D("#3A8A78", "#9EE3D3"), null, 400, JUA);
    B(si - 0.75, sj + 0.25, 0.5, 0.5, 12, D("#5E9BEA", "#3E5A88"), 0, {r:0.06}); [[0.12, 0.12, "#F25F5C"], [0.32, 0.16, "#FFFFFF"], [0.2, 0.34, "#FFD43B"], [0.36, 0.36, "#72C4AE"]].forEach(([a, b, col]) => ball(si - 0.75 + a, sj + 0.25 + b, 14.5, 0.1, col, "m", 12)); }
}
/* 노란 스쿨버스 (+i 쪽이 앞, +j 쪽이 문 쪽 옆면) */
function buildBus(){
  const i0 = 0.9, j0 = 21.75, L = 4.7, Wd = 1.55, Y = D("#F6C94A", "#9A7E30"), Y2 = D("#FBDA7A", "#A88A3A"), gl2 = D("#5A6A82", "#2A3242"), tire = "#26262A";
  [[i0 + 0.85, j0 + 0.02], [i0 + 0.85, j0 + Wd - 0.02], [i0 + L - 1.25, j0 + 0.02], [i0 + L - 1.25, j0 + Wd - 0.02]].forEach(([i, j]) => { const t = K.sm(K.cyl(0.3, 0.3, 0.22, 20), tire, X(i), 0.3, Z(j), null, "s"); t.rotation.x = PI / 2;
    const h = K.sm(K.cyl(0.15, 0.15, 0.24, 14), D("#D6DADF", "#6A6E74"), X(i), 0.3, Z(j), null, "s"); h.rotation.x = PI / 2; });
  B(i0, j0, L - 0.8, Wd, 54, Y, 9, {r:0.14, seg:2}); B(i0 + L - 0.95, j0 + 0.08, 0.95, Wd - 0.16, 25, Y, 9, {r:0.14, seg:2});
  B(i0 + 0.04, j0 + 0.04, L - 0.88, Wd - 0.08, 2.6, D("#FFFFFF", "#9A948C"), 62.6, {r:0.1});
  K.faceJ(i0 + 0.08, i0 + L - 0.9, j0 + Wd + 0.002, 30, 32.6, INK, "m", 0.008); K.faceJ(i0 + 0.08, i0 + L - 0.9, j0 + Wd + 0.002, 26, 27.4, INK, "m", 0.008);
  for(let k = 0; k < 5; k++){ const a = i0 + 0.22 + k * 0.62; if(a + 0.5 > i0 + L - 1.55) break; K.faceJ(a, a + 0.5, j0 + Wd + 0.004, 40, 57, gl2, "s", 0.008); }
  K.faceJ(i0 + L - 1.5, i0 + L - 0.98, j0 + Wd + 0.004, 12, 57, D("#3E4A5E", "#202836"), "s", 0.008); K.faceJ(i0 + L - 1.26, i0 + L - 1.22, j0 + Wd + 0.012, 12, 57, Y2, "m", 0.004);
  K.faceI(i0 + L - 0.8, j0 + 0.12, j0 + Wd - 0.12, 38, 58, gl2, "s", 0.012); K.faceI(i0 - 0.012, j0 + 0.15, j0 + Wd - 0.15, 40, 57, gl2, "s", 0.012);
  [j0 + 0.22, j0 + Wd - 0.42].forEach(j => K.faceI(i0 + L + 0.002, j, j + 0.2, 22, 27, D("#FFF6DA", "#FFF1C2"), "glow", 0.01));
  K.faceI(i0 + L + 0.002, j0 + 0.5, j0 + Wd - 0.5, 14, 21, D("#9A9EA4", "#4A4E54"), "s", 0.01);
  [j0 + 0.15, j0 + Wd - 0.35].forEach(j => K.faceI(i0 - 0.014, j, j + 0.2, 24, 30, D("#E2403A", "#FF5A4A"), "glow", 0.01));
  [[j0 + 0.2], [j0 + Wd - 0.2]].forEach(([j]) => B(i0 + 0.3, j - 0.05, 0.18, 0.1, 2.2, D("#F2A33A", "#FF9A2E"), 65.2, {r:0.02, cls:"glow"}));
  [j0 - 0.12, j0 + Wd + 0.06].forEach(j => { rod([i0 + L - 0.9, j + 0.03, 52], [i0 + L - 0.75, j + 0.03, 52], 0.012, INK, "s", 5); B(i0 + L - 0.78, j, 0.06, 0.06, 7, INK, 46, {r:0.01, cls:"s"}); });
  K.wtext("크레용초등학교", i0 + 1.55, j0 + Wd + 0.014, 19.5, "i", 4.4, D("#2A2A28", "#1E1E1E"), null, 400, JUA);
  K.wtext("어린이 보호차량 🐥", i0 + 1.55, j0 + Wd + 0.014, 35.5, "i", 2.4, D("#2A2A28", "#1E1E1E"), null, 400, JUA);
  K.decal(50, 50, (c, w, h) => { c.fillStyle = "#E2403A"; c.beginPath(); for(let k = 0; k < 8; k++){ const a = PI / 8 + k * PI / 4; c.lineTo(w / 2 + Math.cos(a) * w * 0.48, h / 2 + Math.sin(a) * h * 0.48); } c.fill(); ctext(c, "STOP", w / 2, h / 2, h * 0.3, "#FFFFFF", "center", "system-ui", 800); },
    0.34, 0.34, "i", i0 + L - 1.75, j0 + Wd + 0.02, hz(34));
  K.decal(70, 80, (c, w, h) => drawCrest(c, w, h), 0.32, 0.36, "i", i0 + 3.2, j0 + Wd + 0.014, hz(20));
}

/* ---------- 움직이는 것 ---------- */
function buildDynamic(){
  const R = K.R, scene = R.scene;
  if(W.dyn.length){
    W.dcv = document.createElement("canvas"); W.dcv.width = DW; W.dcv.height = DHH; W.dctx = W.dcv.getContext("2d");
    W.dtex = new THREE.CanvasTexture(W.dcv); W.dtex.colorSpace = THREE.SRGBColorSpace; W.dtex.anisotropy = 4;
    const dg = mergeGeometries(W.dgeo, false); W.dgeo.forEach(g => g.dispose());
    const dm = new THREE.Mesh(dg, K.cutaway(new THREE.MeshBasicMaterial({map:W.dtex, toneMapped:false, transparent:true, polygonOffset:true, polygonOffsetFactor:-3})));
    dm.renderOrder = 2; scene.add(dm); W.dm = dm; }
  const gc = document.createElement("canvas"); gc.width = gc.height = 64; { const x = gc.getContext("2d"), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.35, "rgba(255,255,255,.45)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(0, 0, 64, 64); }
  W.gtex = new THREE.CanvasTexture(gc);
  const gm = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), K.cutaway(new THREE.MeshBasicMaterial({map:W.gtex, transparent:true, blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false})), Math.max(1, W.glows.length));
  gm.frustumCulled = false; gm.renderOrder = 3; scene.add(gm); W.gm = gm;
  W.fxN = 28; W.fm = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), K.cutaway(new THREE.MeshStandardMaterial({roughness:0.4, transparent:true, opacity:0.85})), W.fxN); W.fm.frustumCulled = false; scene.add(W.fm);
  W.xN = 10; W.xm = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), K.cutaway(new THREE.MeshStandardMaterial({roughness:0.5})), W.xN); W.xm.frustumCulled = false; scene.add(W.xm);
}
/* 깃발: 그림판 한 장씩 + 펄럭이는 판 (왼쪽 끝이 깃대) */
function buildFlag(i, hpx, kind){
  const cv = document.createElement("canvas"); cv.width = 180; cv.height = 120; const c = cv.getContext("2d");
  if(kind === "kr") drawTaeguk(c, 180, 120);
  else { const g = c.createLinearGradient(0, 0, 0, 120); g.addColorStop(0, "#72C4AE"); g.addColorStop(1, "#4DAA97"); c.fillStyle = g; c.fillRect(0, 0, 180, 120);
    c.fillStyle = "#FAF7F2"; c.fillRect(0, 100, 180, 6); c.save(); c.translate(52, 14); drawCrest(c, 76, 84); c.restore(); ctext(c, "크레용초등학교", 90, 112, 11, "#FFFFFF"); }
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const fw = 0.96, fh = 0.64, g = new THREE.PlaneGeometry(fw, fh, 12, 4); g.translate(fw / 2, -fh / 2, 0);
  const m = new THREE.Mesh(g, K.cutaway(new THREE.MeshStandardMaterial({map:tex, side:THREE.DoubleSide, roughness:0.85})));
  m.castShadow = true; m.position.set(X(i) + 0.03, hz(hpx - 3), Z(11.1)); K.R.scene.add(m);
  W.flags.push({m, base:g.attributes.position.array.slice(), top:hz(hpx - 3), low:hz(30) + fh, k:W.flags.length, tex});
}
function buildBall(){
  const M = Merge(); M.add(new THREE.SphereGeometry(0.11, 18, 12), D("#FFFFFF", "#B8B2AA"));
  [[0, 1, 0], [0, -1, 0], [1, 0.3, 0], [-1, 0.3, 0], [0, 0.3, 1], [0, 0.3, -1], [0.6, -0.6, 0.6], [-0.6, -0.6, -0.6]].forEach(([x, y, z]) => { const v = new THREE.Vector3(x, y, z).normalize().multiplyScalar(0.1);
    const p = new THREE.CylinderGeometry(0.04, 0.04, 0.025, 5); p.lookAt(v); p.rotateX(0); const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.clone().normalize()); p.applyQuaternion(q); p.translate(v.x, v.y, v.z); M.add(p, INK); });
  const m = dynMesh(M.geo()); m.position.set(X(BALL0[0]), 0.11, Z(BALL0[1])); return m;
}
function buildDyn(){
  // 칠판 그림 · 벽시계 · 시계탑 시계
  W.boardK = 0; W.boardT = -1e9;
  dplane(360, 118, 4.1, hz(42), 14.6, 0.068, hz(42), (c, w, h, tm) => drawBoard(c, w, h, tm), 0.006);
  dplane(48, 48, 0.4, 0.4, 16.4, 0.0, hz(91), (c, w, h) => drawClock(c, w, h, "#FFFFFF"), 0.04);
  dplane(76, 76, 0.86, 0.86, 14.6, -0.25, hz(152), (c, w, h) => drawClock(c, w, h, "#F4D3DF"), 0.026);
  W.ball = buildBall();
  FLAGS.forEach(([i, h, k]) => buildFlag(i, h, k));
  // 밤 불빛: 방마다 벽등 · 채플 십자가 · 스테인드글라스 · 가로등 · 정문 등 · 시계 · 버스
  [[3.0, 100], [8.25, 104], [14.6, 108], [20.75, 100], [25.2, 100], [29.75, 104]].forEach(([i, z]) => gl(i, 0.2, z, 50, "#FFE2A8", (tm, dk) => dk ? 0.55 : 0));
  gl(29.75, 0.25, 72, 60, "#FFE8C8", (tm, dk) => dk ? 0.5 : 0);
  [28.4, 31.1].forEach(i => gl(i, 0.2, 68, 46, "#E8C8FF", (tm, dk) => dk ? 0.35 : 0));
  [28.97, 30.53].forEach(i => gl(i, 0.4, 34.2, 4.5, "#FFC872", (tm, dk) => (dk ? 0.75 : 0.3) + Math.sin(tm * 0.013 + i) * 0.1));
  [[6.4, 22.55], [25.4, 11.0], [0.4, 11.2]].forEach(([i, j]) => gl(i, j, 102, 40, "#FFE2A8", (tm, dk) => dk ? 0.75 : 0));
  [GATE[0] - 0.05, GATE[1] + 0.05].forEach(i => gl(i, FJ, 68, 24, "#FFE2A8", (tm, dk) => dk ? 0.7 : 0));
  gl(14.6, -0.2, 152, 34, "#FFF4DC", (tm, dk) => dk ? 0.45 : 0);
  gl(16.0, 10.3, 52, 36, "#FFE8F4", (tm, dk) => dk ? 0.5 : 0);
  gl(19.36, RJ + 0.3, 40, 16, "#BFE8FF", (tm, dk) => dk ? 0.45 : 0);
  gl(FISH[0], FISH[1], 33, 16, "#BFE8FF", (tm, dk) => dk ? 0.5 : 0.06);
  // 어항 (유리 · 물 · 자갈 · 수초) — 금붕어는 매 프레임 상자 인스턴스
  { const [fi, fj, fz] = FISH; disc(fi, fj, 0.13, fz, 0.8, D("#F6E3C8", "#6A5A48"), "m", 16);
    K.sm(K.sph(0.17, 18, 14), D("#DDEFF8", "#6A8AA0"), X(fi), hz(fz) + 0.16, Z(fj), null, "glass");
    K.sm(K.cyl(0.15, 0.12, 0.14, 18), D("#BFE3F2", "#4A6A88"), X(fi), hz(fz) + 0.1, Z(fj), null, "glass");
    [[-0.05, 0.02], [0.05, -0.03]].forEach(([di, dj]) => rod([fi + di, fj + dj, fz + 1], [fi + di * 1.4, fj + dj, fz + 7], 0.012, D("#5FA582", "#3E6E54"), "m", 4));
    for(let k = 0; k < 5; k++) ball(fi + Math.cos(k * 1.3) * 0.07, fj + Math.sin(k * 1.3) * 0.07, fz + 1.2, 0.03, RB[k], "m", 6);
    B(fi - 0.12, fj + 0.32, 0.24, 0.16, 2.4, D("#F6E39A", "#8A7A3A"), 28, {r:0.03}); K.wtext("밥", fi + 0.122, fj + 0.4, 29.2, "j", 1.4, INK, null, 400, JUA); }
}
const m4 = new THREE.Matrix4(), qn = new THREE.Quaternion(), v3 = new THREE.Vector3(), sc3 = new THREE.Vector3(), col = new THREE.Color(), e3 = new THREE.Euler(), ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
function fxSet(k, x, y, z, s, c){ if(k >= W.fxN) return; if(s <= 0){ W.fm.setMatrixAt(k, ZERO); return; } m4.compose(v3.set(x, y, z), qn.identity(), sc3.set(s, s, s)); W.fm.setMatrixAt(k, m4); W.fm.setColorAt(k, col.set(c)); }
function boxSet(k, x, y, z, sx, sy, sz, c, ry = 0){ if(k >= W.xN) return; if(sx <= 0){ W.xm.setMatrixAt(k, ZERO); return; } e3.set(0, ry, 0); qn.setFromEuler(e3); m4.compose(v3.set(x, y, z), qn, sc3.set(sx, sy, sz)); W.xm.setMatrixAt(k, m4); W.xm.setColorAt(k, col.set(c)); }
function animate(tm, dt){
  const dk = !!K.R.dark, red = !!K.reduce, s = tm / 1000;
  let f = 0, bx = 0;
  // 금붕어 셋 (밥 주면 위로 모여 듦)
  const [fi, fj, fz] = FISH, fed = tm < W.feedT, fy = hz(fz) + 0.1;
  for(let k = 0; k < 3; k++){ const a = (red ? 0 : s * (0.8 + k * 0.25)) + k * 2.1, r = fed ? 0.03 : 0.065 + k * 0.012;
    const x = X(fi) + Math.cos(a) * r, z = Z(fj) + Math.sin(a) * r, y = fy + (fed ? 0.05 : Math.sin(s * 1.3 + k) * 0.015);
    boxSet(bx++, x, y, z, 0.05, 0.028, 0.022, k === 1 ? "#FFFFFF" : "#F28C28", -a); boxSet(bx++, x - Math.sin(a) * 0.03 * 0 + Math.cos(a + PI / 2) * -0.028, y, z + Math.sin(a + PI / 2) * -0.028, 0.02, 0.026, 0.01, k === 1 ? "#F28C28" : "#FFB066", -a); }
  if(fed) for(let k = 0; k < 5; k++){ const ph = ((W.feedT - tm) / 4000 + k * 0.2) % 1; fxSet(f++, X(fi) + Math.cos(k * 1.7) * 0.05, fy + 0.02 + ph * 0.06, Z(fj) + Math.sin(k * 1.7) * 0.05, 0.008, "#C98A4A"); }
  for(let k = 0; k < 2; k++){ const ph = (s * 0.4 + k * 0.5) % 1; fxSet(f++, X(fi + 0.04), fy - 0.04 + ph * 0.14, Z(fj), red ? 0 : 0.008, "#FFFFFF"); }
  // 비커 거품 (실험하면 더 많이 · 더 빨리)
  const boost = tm < W.sciT ? 2.2 : 1;
  [[24.45, 2.5, "#F4A7B9"], [24.68, 2.62, "#A8DCC8"], [25.5, 2.45, "#C8B4D0"], [25.9, 2.55, "#F6E39A"]].forEach(([i, j, c0], b) => {
    for(let k = 0; k < (boost > 1 ? 4 : 2); k++){ const ph = (s * 0.5 * boost + k / (boost > 1 ? 4 : 2) + b * 0.3) % 1; fxSet(f++, X(i) + Math.sin(ph * 9 + k) * 0.02, hz(29) + ph * (boost > 1 ? 0.32 : 0.16), Z(j), red ? 0 : 0.018 * (1 - ph * 0.6) * (boost > 1 ? 1.4 : 1), c0); } });
  while(f < W.fxN) fxSet(f++, 0, 0, 0, 0);
  while(bx < W.xN) boxSet(bx++, 0, 0, 0, 0);
  W.xm.instanceMatrix.needsUpdate = true; if(W.xm.instanceColor) W.xm.instanceColor.needsUpdate = true;
  W.fm.instanceMatrix.needsUpdate = true; if(W.fm.instanceColor) W.fm.instanceColor.needsUpdate = true;
  // 깃발 펄럭 · 올리기
  W.flags.forEach(F => { const p = F.m.geometry.attributes.position, a = p.array, b = F.base;
    for(let n = 0; n < p.count; n++){ const x = b[n * 3], y = b[n * 3 + 1]; a[n * 3] = x; a[n * 3 + 1] = y + (red ? 0 : Math.sin(x * 5 - s * 4 - F.k) * 0.02 * x); a[n * 3 + 2] = red ? 0 : Math.sin(x * 4.2 - s * 3.6 + F.k) * 0.09 * x; }
    p.needsUpdate = true; F.m.geometry.computeVertexNormals(); F.m.position.y = F.low + (F.top - F.low) * W.flagU; });
  // 글씨 판 다시 그리기 (칠판 쓰는 중엔 자주, 아니면 0.5초마다)
  const fast = tm - W.boardT < 2600;
  if(W.dcv && (tm - W.dLast > (fast ? 50 : 500) || W.dLast < 0)){ W.dLast = tm; const c = W.dctx; c.clearRect(0, 0, DW, DHH);
    W.dyn.forEach(d => { c.save(); c.beginPath(); c.rect(d.r.x, d.r.y, d.r.w, d.r.h); c.clip(); c.translate(d.r.x, d.r.y); d.draw(c, d.r.w, d.r.h, tm); c.restore(); });
    W.dtex.needsUpdate = true; }
  const cam = K.R.camera;
  W.glows.forEach((g, k) => { const a = g.a(tm, dk); if(!(a > 0)){ W.gm.setMatrixAt(k, ZERO); return; }
    col.copy(g.c); m4.compose(g.p, cam.quaternion, sc3.set(g.s, g.s, 1)); W.gm.setMatrixAt(k, m4); W.gm.setColorAt(k, col.multiplyScalar(Math.min(1, a))); });
  W.gm.instanceMatrix.needsUpdate = true; if(W.gm.instanceColor) W.gm.instanceColor.needsUpdate = true;
}

/* ---------- 유나 모드에 넘길 것 (yuna_game.js 형식: h = 보는 쪽 (0 = +j, PI/2 = +i, PI = −j), H = 앉는 면 높이, k = 대사 종류) ---------- */
const H = px => px / 31.1;
const trackAt = u => { const th0 = Math.atan2((20.55 - TRK.c[1]) / TRK.ry, (14.5 - TRK.c[0]) / TRK.rx), th = th0 - u * 2 * PI;
  const i = TRK.c[0] + TRK.rx * Math.cos(th), j = TRK.c[1] + TRK.ry * Math.sin(th), vi = TRK.rx * Math.sin(th), vj = -TRK.ry * Math.cos(th);
  return [i, j, Math.atan2(vi, vj)]; };
const CLASS_SEATS = [];
ROWS.forEach(dj => PAIRS.forEach(pc => [-0.36, 0.36].forEach(dx => { const ci = +(pc + dx).toFixed(2); if(Math.abs(ci - MYDESK[0]) < 0.01 && dj === MYDESK[1]) return; CLASS_SEATS.push({a:[ci, +(dj + 0.5).toFixed(2)], h:PI, H:H(10.5), k:"class"}); })));
export const SCHOOL = {
  name:"크레용초등학교",
  gate:[16, 23.3], spawnGate:[16, 22.5, PI],
  seats:[
    {a:[MYDESK[0], MYDESK[1] + 0.5], h:PI, H:H(10.5), k:"mydesk"},
    ...CLASS_SEATS,
    {a:[7.3, 3.8], h:0.95, H:H(3.4), k:"library"}, {a:[7.25, 5.3], h:2.05, H:H(3.4), k:"library"}, {a:[9.65, 4.0], h:-1.06, H:H(10), k:"library"}, {a:[9.55, 5.55], h:-2.28, H:H(10), k:"library"},
    {a:[1.2, 2.7], b:[4.8, 2.7], h:0, H:H(8.8), k:"lunch"}, {a:[1.2, 4.1], b:[4.8, 4.1], h:PI, H:H(8.8), k:"lunch"}, {a:[1.2, 4.8], b:[4.8, 4.8], h:0, H:H(8.8), k:"lunch"}, {a:[1.2, 6.2], b:[4.8, 6.2], h:PI, H:H(8.8), k:"lunch"},
    {a:[27.38, 13.8], b:[27.38, 15.0], h:-PI / 2, H:H(10.7), k:"bench"}, {a:[27.38, 17.8], b:[27.38, 19.0], h:-PI / 2, H:H(10.7), k:"bench"}, {a:[0.52, 19.2], b:[0.52, 20.4], h:PI / 2, H:H(10.7), k:"bench"}, {a:[29.0, 18.72], b:[30.2, 18.72], h:PI, H:H(10.7), k:"bench"},
    ...[3.3, 4.5, 5.7].flatMap(pj => [{a:[28.05, pj], b:[28.95, pj], h:PI, H:H(11.2), k:"chapel"}, {a:[30.55, pj], b:[31.45, pj], h:PI, H:H(11.2), k:"chapel"}])],
  sitLines:{
    mydesk:["여기가 내 자리! 짝꿍은 지유 😆", "1교시 국어 시작~ ✏️", "선생님 저 다 했어요! 🙋‍♀️", "필통 정리 완료 ✨"],
    class:["지유 자리에 몰래 앉아 봤다 😜", "여기서도 칠판 잘 보인다 👀", "쉬는 시간 언제 와~ 🔔"],
    library:["이 책 진짜 재밌다 📖", "말랑 방석 최고 💛", "쉿… 다 읽으면 또 빌려야지 🤫"],
    lunch:["오늘 치킨 마요다! 😋", "잘 먹겠습니다 🙏", "김치도 한 입 먹어 볼게… 🥬", "우유는 원샷! 🥛"],
    bench:["운동장 바람 시원하다 🍃", "느티나무 그늘 좋다 🌳", "다음 시간 체육이다! ⚽"],
    chapel:["하나님 오늘도 감사합니다 🙏", "우리 가족 건강하게 지켜 주세요 💕", "찬양 시간 제일 좋아 🎶", "친구들이랑 사이좋게 지낼게요 😊"]},
  use:[
    {at:[14.6, 0.95], k:"board", h:PI, r:1.0},
    {at:[19.65, 1.12], k:"piano", h:PI},
    {at:[21.6, 3.35], k:"xylophone", h:PI},
    {at:[22.4, 2.2], k:"drum", h:PI},
    {at:[25.0, 3.6], k:"science", h:PI},
    {at:[8.25, 0.95], k:"library", h:PI},
    {at:[2.9, 1.75], k:"lunch", h:PI},
    {at:[14.5, 20.55], k:"track", h:PI / 2, r:1.0},
    {at:[3.92, 12.4], k:"bar", h:0},
    {at:[2.8, 15.45], k:"monkey", h:PI / 2},
    {at:[20.55, 16.6], k:"ball", h:PI / 2, r:1.0},
    {at:[28.45, 12.2], k:"flag", h:PI},
    {at:[11.35, 3.2], k:"fishbowl", h:-PI / 2},
    {at:[29.75, 2.3], k:"chapel", h:PI}],
  npc:{teach:[16.4, 1.95, 0], chef:[2.9, 0.32, 0], coach:[13.8, 19.25, 0.5], classmate:[13.5, 6.62, PI], chaplain:[29.75, 0.62, 0]},
  /* 움직이는 것 (유나 모드가 부름) */
  track:{c:TRK.c, rx:TRK.rx, ry:TRK.ry, start:[14.5, 20.55, PI / 2], at:trackAt},   // at(u): u 0~1 한 바퀴 → [i, j, h] (출발선에서 +i, 반시계)
  board:{set(k = 0){ if(!W) return; W.boardK = k; W.boardT = K.clock ? K.clock() : performance.now(); W.dLast = -1; }},   // 0 숙제 · 1 유나 그림 · 2 받아쓰기 100점 (분필로 쓰듯 2.2초)
  fish:{feed(ms = 4000){ if(!W) return; W.feedT = (K.clock ? K.clock() : performance.now()) + ms; }},
  science:{bubble(ms = 5000){ if(!W) return; W.sciT = (K.clock ? K.clock() : performance.now()) + ms; }},
  flag:{set(u = 1){ if(W) W.flagU = Math.max(0, Math.min(1, u)); }},   // 0 = 내림 · 1 = 꼭대기
  ball:{home:BALL0, set(i, j, y = 0.11){ if(!W || !W.ball) return; W.ball.position.set(X(i), y, Z(j)); W.ball.rotation.x += 0.4; }, reset(){ this.set(BALL0[0], BALL0[1]); }, show(v = true){ if(W && W.ball) W.ball.visible = !!v; }},   // 엔진 공(playSet ball)을 쓰면 show(false)
};

/* ---------- 구역 정의 ---------- */
const ZONES = {
  sc_lunch:{name:"급식실", color:"#E8A04A", rect:[0, 0, 6, RJ], label:[3.0, 0, "top"]},
  sc_lib:{name:"도서관", color:"#4DAA97", rect:[6, 0, 10.5, RJ], label:[8.25, 0, "top"]},
  sc_class:{name:"3학년 1반", color:"#E8B5C8", rect:[10.5, 0, 18.5, RJ], label:[14.5, 0, "top"]},
  sc_music:{name:"음악실", color:"#C8B4D0", rect:[18.5, 0, 23, RJ], label:[20.75, 0, "top"]},
  sc_sci:{name:"과학실", color:"#72C4AE", rect:[23, 0, 27.5, RJ], label:[25.25, 0, "top"]},
  sc_chapel:{name:"채플실", color:"#D9B98F", rect:[27.5, 0, 32, RJ], label:[29.75, 0, "top"]},
  sc_field:{name:"운동장", color:"#72C4AE", rect:[-0.3, BJ, AW + 0.3, FJ], label:[16, FJ, "bottom"]}};
const def = {
  id:"school",
  zones:ZONES,
  outline:[[EXT[0], EXT[1]], [EXT[2], EXT[1]], [EXT[2], EXT[3]], [EXT[0], EXT[3]]],
  ext:EXT,
  top:3.7,
  allPts:V => [V(-0.4, 0, -0.4), V(32.4, 0, -0.4), V(32.4, 0, 24.6), V(-0.4, 0, 24.6), V(-0.25, 3.7, -0.25), V(32, 3.7, -0.25), V(-0.25, 3.7, 9.6), V(14.6, 6.0, -0.7)],
  lamps:[[3.0, 3.6, 2.6], [8.3, 3.4, 2.6], [14.6, 3.6, 2.8], [20.7, 3.4, 2.6], [25.2, 3.4, 2.6], [29.75, 3.2, 2.6], [16.0, 8.4, 2.4], [16.0, 15.5, 3.4]],
  glow:{color:0xFFD2A8, at:[29.75, 1.2, 1.6]},
  eggs:[],
  people:[],
  paintFloor(c, dark){ paint(c, dark); },
  build(KIT){
    K = KIT; LG.length = 0;
    W = {recolor:[], dyn:[], dgeo:[], dA:{x:2, y:2, row:0}, dLast:-1, glows:[], flags:[], flagU:1, feedT:0, sciT:0, boardK:0, boardT:-1e9, extraBoxes:[]};
    const egg = (id, at, emo, lines) => ({id, at, emo, lines});
    def.eggs = [
      egg("sc_skel", [27.0, 1.0, 54], ["💀", "😆"], ["뼈다귀 아저씨 안녕? 💀", "우리 몸에는 뼈가 206개래요 🦴"]),
      egg("sc_globe", [26.55, 0.28, 48], ["🌏", "✈️"], ["우리나라 여기 있다! 🇰🇷", "아빠랑 여기 여행 가고 싶어 ✈️"]),
      egg("sc_tower", [14.6, -0.3, 168], ["🔔", "⏰"], ["딩동댕~ 쉬는 시간이다! 🔔", "시계탑 꼭대기에 십자가 ✝️"]),
      egg("sc_bus", [3.2, 23.3, 50], ["🚌", "🐥"], ["노란 스쿨버스 출발~ 🚌", "기사님 안녕하세요! 👋"]),
      egg("sc_tree", [30.6, 16.4, 100], ["🌳", "🐦"], ["120살 느티나무 할아버지 🌳", "새 둥지가 있다! 🐦"]),
      egg("sc_bible", [8.65, 0.5, 40], ["📖", "✨"], ["성경책 칸이다 📖", "오늘 말씀: 서로 사랑하라 💕"]),
      egg("sc_menu", [2.7, 0.05, 80], ["🍚", "🍗"], ["오늘 급식 치킨 마요! 🍗", "급식실 이모 최고 👍"]),
      egg("sc_art", [11.5, 0.06, 50], ["🖍️", "🌈"], ["내 그림도 걸려 있다! 🖍️", "무지개 그림은 지유가 그린 거야 🌈"]),
      egg("sc_lost", [22.71, RJ + 0.35, 20], ["🧦", "🔍"], ["분실물 상자에 내 양말이?! 🧦"]),
      egg("sc_stained", [28.4, 0.1, 80], ["🌈", "✝️"], ["햇빛 들어오면 무지개 색이 돼 🌈"])];
    buildShell(); buildLunch(); buildLib(); buildClass(); buildMusic(); buildSci(); buildChapel(); buildHall(); buildField(); buildBus();
    buildDyn(); buildDynamic();
  },
  init(KIT){ LG.forEach(g => g.dispose()); LG.length = 0; },
  tick(KIT, now, t, dt){
    if(W.extraBoxes.length && KIT.R && KIT.R.boxes && !W.boxDone){ W.boxDone = true; KIT.R.boxes = Float32Array.from([...KIT.R.boxes, ...W.extraBoxes.flat()]); KIT.R.pg = null; }
    animate(KIT.clock ? KIT.clock() : now, dt); },
  theme(KIT, dark){ if(!W) return; W.recolor.forEach(m => { const u = m.geometry.userData, a = m.geometry.attributes.color; if(u && u.L && a){ a.array.set(dark ? u.D : u.L); a.needsUpdate = true; } }); W.dLast = -1; },
};
export default def;
