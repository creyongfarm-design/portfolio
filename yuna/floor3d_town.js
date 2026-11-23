/* 학교 앞 골목 3D (2026-11-24 감독님 "세계관 팍팍 늘려봐, 지역도 늘리고") — 유나 모드 동네 구역 (page key town → ./floor3d_town.js)
   로비 건너편 보도 동쪽 끝 안내판 "학교 앞 골목 · 문방구 · 떡볶이 · 붕어빵 →" 으로 걸어오면 여기. 아래 가운데 (14, 19.3)에 닿으면 로비로.
   배치 (칸 i 0~28 · j 0~20, 1칸 ≈ 1.28m · 유나 키 ≈ 1칸 · 높이 px = 1/31.1칸):
     뒤 줄 (j 0~5.4)   크레용초등학교 본관(i 0~8) | 크레용문구(i 8.2~14) | 크레용분식(i 14~21.4) | CREYONG 24 학교앞점(i 21.4~28)
     운동장 (j 2.6~10)  구령대 · 국기봉 · 축구 골대 · 철봉 · 학교 종 · 배움터 지킴이 초소, 정문(i 3~5.4)은 j 10 울타리에
     가게 앞 보행로 (j 5.4~10)  뽑기 기계 넷 · 오락기 · 분식 야외 탁자 · 아이스크림 냉동고(위에 고양이) · 파라솔 탁자 · 화단 · 가로등
     어린이 보호구역 길 (j 10~14)  빨간 포장 · "어린이 보호구역" · 30 · 지그재그 · 노란 횡단보도 둘 (정문 앞 · 입구 앞)
     앞 보도 (j 14~20)  붕어빵 포장마차 · 나무 둘레 벤치 · 우체통 · 사방치기 · 옐로카펫 · 버스정류장 · 은행나무, 아래 가운데가 로비 가는 길
   가게는 인형집처럼 (floor3d_home.js 방식): 뒷벽만 높고 칸막이는 낮게, 앞은 열어 두고 차양만 → 안이 다 보임
   깜빡임 방지: 같은 쪽을 보는 면이 같은 자리에 겹치지 않게 (0.01~0.03씩 어긋나게), 바닥에 붙는 것은 그림(paintFloor)으로
   움직이는 것: 뽑기 손잡이 · 캡슐 · 학교 종 · 학교 시계 바늘(지금 시각) · 오락기 화면 · 버스 도착 알림판 · 떡볶이·어묵·붕어빵·호빵 김 */
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const PI = Math.PI;
const TALL = 112, LOW = 34, T = 0.2, BT = 0.25;   // 뒷벽 높이 · 칸막이 높이 · 칸막이 두께 · 뒷벽 두께
const SJ = 5.4, AJ = 10.0, RJ = 14.0;              // 가게 앞 선 · 보행로 끝(길 시작) · 길 끝(앞 보도 시작)
const SCH = {i1:8.0, bj:2.6, g0:3.0, g1:5.4};      // 학교: 본관 i 0~8 · j 0~2.6, 정문 i 3.0~5.4 (울타리 j 10)
const MUN = [8.2, 14.0], BUN = [14.0, 21.4], CVS = [21.4, 28.0];
const CW = [[3.0, 5.4], [12.9, 15.1]];             // 노란 횡단보도 (정문 앞 · 입구 앞)
const EXT = [-0.6, -0.6, 28.8, 20.6];
const RB = ["#F4A7B9", "#F9C99B", "#F6E39A", "#A8DCC8", "#A9CBEA", "#C8B4D0"];
const rnd = k => { const v = Math.sin(k * 12.9898) * 43758.5453; return v - Math.floor(v); };
const JUA = "\"Jua\", \"IBM Plex Sans KR\", \"Apple SD Gothic Neo\", system-ui, sans-serif";

let K = null, W = null;
const X = i => K.X(i), Z = j => K.Z(j), hz = p => K.hz(p);
const D = (l, d) => [l, d];
const B = (i, j, w, d, h, col, z0 = 0, o = {}) => K.B(i, j, w, d, h, col, z0, o);
const PINK = D("#E8B5C8", "#7A5866"), PINK2 = D("#F4D3DF", "#6A4E5A"), LILAC = D("#C8B4D0", "#5E4E68"), LILAC2 = D("#E2D6EA", "#4E4458"),
  PAPER = D("#FAF7F2", "#3A3632"), WHITE = D("#FFFFFF", "#8A847C"), WOOD = D("#D9B98F", "#6B5440"), WOODD = D("#A98258", "#4E3C2C"),
  CAPC = D("#FFFFFF", "#6A625C"), GOLD = D("#E8C36A", "#B8964A"), INK = "#2A2A28",
  SPROUT = D("#4DAA97", "#2F7466"), LEAF = D("#72C4AE", "#3E7A6A"), AMBER = D("#E8A04A", "#9A6A2E"), CORAL = D("#E87A6A", "#8A4A40"),
  CREAM = D("#FFF3E0", "#4A4238"), STEEL = D("#C9CDD2", "#5A5E64"), GLASS = D("#DDE8F2", "#7A90B8"), IRON = D("#3A3A3E", "#26262A"),
  FENCE = D("#4DAA97", "#3A6E62"), POLE = D("#4A4A4E", "#8A857E");
const LG = [];
const myGeo = g => { LG.push(g); return g; };

/* ---------- 작은 도구 (floor3d_home.js 에서 그대로) ---------- */
function rod(a, b, r, col, cls = "s", seg = 8){
  const A = new THREE.Vector3(X(a[0]), hz(a[2]), Z(a[1])), C = new THREE.Vector3(X(b[0]), hz(b[2]), Z(b[1])), len = A.distanceTo(C); if(len < 1e-4) return;
  const o = K.sm(K.cyl(r, r, len, seg), col, (A.x + C.x) / 2, (A.y + C.y) / 2, (A.z + C.z) / 2, null, cls); o.lookAt(C); o.rotateX(PI / 2); return o;
}
const ball = (i, j, zp, r, col, cls = "m", seg = 12) => K.sm(K.sph(r, seg, Math.max(6, seg * 0.75 | 0)), col, X(i), hz(zp), Z(j), null, cls);
const disc = (i, j, r, zp, hp, col, cls = "m", seg = 24) => { const H = Math.max(0.006, hz(hp)); return K.sm(K.cyl(r, r, H, seg), col, X(i), hz(zp) + H / 2, Z(j), null, cls); };
const cylAt = (i, j, r0, r1, z0, hp, col, cls = "m", seg = 14) => K.sm(K.cyl(r0, r1, hz(hp), seg), col, X(i), hz(z0) + hz(hp) / 2, Z(j), null, cls);
/* 칸막이 (낮은 벽 + 흰 뚜껑): wallJ = i 고정, wallI = j 고정 */
function wallJ(j0, j1, i, col, h = LOW){ if(j1 - j0 < 0.02) return; B(i - T / 2, j0, T, j1 - j0, h - 1.6, col, 0, {r:0}); B(i - T / 2, j0, T, j1 - j0, 1.6, CAPC, h - 1.6, {r:0}); }
function flowerStem(i, j, col, h){ rod([i, j, 0], [i, j, h], 0.01, D("#5FA582", "#3E6E54"), "m", 5); ball(i, j, h, 0.075, col, "m", 8); ball(i, j, h + 1, 0.032, "#FFF4C2", "m", 6); }
function flowerPot(i, j, col, s = 1, pot = PINK, z0 = 0){
  B(i - 0.17 * s, j - 0.17 * s, 0.34 * s, 0.34 * s, 10 * s, pot, z0, {r:0.05});
  disc(i, j, 0.14 * s, z0 + 10 * s, 0.6, D("#7A5A3C", "#3A2A20"));
  [[0, 0, 22], [0.08, 0.05, 18], [-0.07, 0.06, 19], [0.04, -0.08, 17]].forEach(([di, dj, z], k) => { rod([i + di * s, j + dj * s, z0 + 10 * s], [i + di * 1.4 * s, j + dj * 1.4 * s, z0 + z * s], 0.008, D("#5FA582", "#3E6E54"), "m", 5);
    ball(i + di * 1.4 * s, j + dj * 1.4 * s, z0 + z * s, 0.055 * s, k % 2 ? "#FFFFFF" : col, "m", 8); ball(i + di * 1.4 * s, j + dj * 1.4 * s, z0 + z * s + 0.9, 0.025 * s, "#F6E39A", "m", 6); });
  [[0.1, 0.1], [-0.1, 0.08], [0, -0.11]].forEach(([di, dj]) => ball(i + di * s, j + dj * s, z0 + 12.5 * s, 0.06 * s, K.sh("plant", 0.1), "m", 8));
}
/* 은행나무 (11월이라 노랗게) · 학교 벚나무(초록 + 분홍 꽃) */
function ginkgo(i, j, s = 1){
  K.sm(K.cyl(0.07 * s, 0.1 * s, hz(42 * s), 8), D("#8A6A4C", "#4A3828"), X(i), hz(21 * s), Z(j), null, "m");
  const Y = [D("#F2C94C", "#7E6A2C"), D("#F6D96A", "#8E7A3C"), D("#E8B040", "#745A26")];
  [[0, 0, 56, 0.48], [-0.26, 0.1, 48, 0.36], [0.27, 0.08, 49, 0.37], [0.04, -0.25, 50, 0.36], [0.06, 0.27, 46, 0.33], [0, 0.02, 70, 0.33], [0.02, 0, 80, 0.2]].forEach(([di, dj, z, r], k) =>
    ball(i + di * s, j + dj * s, z * s, r * s, Y[k % 3], "m", 14));
}
function tree(i, j, s){
  K.sm(K.cyl(0.07 * s, 0.1 * s, hz(40 * s), 8), D("#8A6A4C", "#4A3828"), X(i), hz(20 * s), Z(j), null, "m");
  [[0, 0, 56, 0.55], [-0.3, 0.12, 48, 0.4], [0.3, 0.1, 49, 0.42], [0.05, -0.28, 50, 0.4], [0.08, 0.3, 46, 0.36], [0, 0.02, 68, 0.38]].forEach(([di, dj, z, r], k) =>
    ball(i + di * s, j + dj * s, z * s, r * s, k % 2 ? K.sh("plant", 0.14) : "plant", "m", 14));
  [[0.25, 0.2, 60], [-0.2, -0.15, 63], [0.1, 0.35, 52]].forEach(([di, dj, z]) => ball(i + di * s, j + dj * s, z * s, 0.05 * s, "#F4A7B9", "m", 8));
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
const night = v => (tm, dk) => dk ? v : 0;

/* ---------- 움직이는 그림판 (오락기 화면 · 버스 도착 알림판) ---------- */
const DW = 512, DH = 256;
function dAlloc(w, h){ const A = W.dA; w = Math.ceil(w); h = Math.ceil(h); if(A.x + w + 2 > DW){ A.x = 2; A.y += A.row + 3; A.row = 0; } const r = {x:A.x, y:A.y, w, h}; A.x += w + 3; A.row = Math.max(A.row, h); return r; }
function dplane(wpx, hpx, ww, wh, i, j, zc, draw, axis = "i", off = 0.012){   // axis "i" = +j를 봄 · "j" = +i를 봄
  const r = dAlloc(wpx, hpx); W.dyn.push({r, draw});
  const g = new THREE.PlaneGeometry(ww, wh), uv = g.attributes.uv;
  for(let k = 0; k < uv.count; k++){ const u = uv.getX(k), v = uv.getY(k); uv.setXY(k, (r.x + u * r.w) / DW, 1 - (r.y + (1 - v) * r.h) / DH); }
  if(axis === "j"){ g.rotateY(PI / 2); g.translate(X(i) + off, zc, Z(j)); } else g.translate(X(i), zc, Z(j) + off);
  W.dgeo.push(g);
}
function drawArcade(c, w, h, tm, dark){   // 귀여운 슈팅 게임: 분홍 우주선이 별을 모음
  const t = tm / 1000; c.fillStyle = "#1B1640"; c.fillRect(0, 0, w, h);
  for(let k = 0; k < 24; k++){ c.fillStyle = k % 3 ? "#FFFFFF" : "#F6E39A"; c.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * 2 + k)); c.fillRect(rnd(k) * w, (rnd(k + 9) * h + t * 18 * (1 + k % 3)) % h, 2, 2); } c.globalAlpha = 1;
  const col = ["#F4A7B9", "#A8DCC8", "#F6E39A", "#A9CBEA", "#C8B4D0"];
  for(let r = 0; r < 2; r++) for(let k = 0; k < 5; k++){ const x = w * (0.16 + k * 0.17) + Math.sin(t * 1.6) * w * 0.05, y = h * (0.18 + r * 0.17) + Math.abs(Math.sin(t * 4 + k)) * 2;
    c.fillStyle = col[(k + r) % 5]; c.beginPath(); c.arc(x, y, h * 0.055, PI, 0); c.lineTo(x + h * 0.055, y + h * 0.05); c.lineTo(x - h * 0.055, y + h * 0.05); c.fill();
    c.fillStyle = "#1B1640"; c.fillRect(x - h * 0.03, y - h * 0.01, 2, 2); c.fillRect(x + h * 0.02, y - h * 0.01, 2, 2); }
  const sx = w * 0.5 + Math.sin(t * 1.3) * w * 0.3, sy = h * 0.8;
  c.fillStyle = "#FF8FB8"; c.beginPath(); c.moveTo(sx, sy - h * 0.09); c.lineTo(sx + h * 0.07, sy + h * 0.05); c.lineTo(sx - h * 0.07, sy + h * 0.05); c.fill();
  c.fillStyle = "#FFFFFF"; const by = (sy - ((t * 160) % (h * 0.7))); c.fillRect(sx - 1, by, 2, 6);
  c.fillStyle = "#F6E39A"; c.font = `800 ${h * 0.09}px "Inter Tight", monospace`; c.textBaseline = "top"; c.fillText("SCORE " + String(420 + ((t * 10) | 0) % 9000).padStart(4, "0"), 4, 3);
  c.fillStyle = "#FF8FB8"; c.fillText("YUNA ♥", w - h * 0.62, 3);
  if(dark){ c.fillStyle = "rgba(255,255,255,.04)"; c.fillRect(0, 0, w, h); }
}
function drawBus(c, w, h, tm){   // 버스 도착 알림판 (주황 글씨가 흘러감)
  c.fillStyle = "#121214"; c.fillRect(0, 0, w, h);
  c.fillStyle = "#FFB547"; c.font = `800 ${h * 0.62}px "IBM Plex Sans KR", system-ui, sans-serif`; c.textBaseline = "middle";
  const m = Math.max(1, 3 - ((tm / 20000) | 0) % 4), msg = `🚌 7번 ${m}분 후 도착 · 12번 5분 · 마을03 곧 도착 · 크레용초등학교 앞 · `, tw = c.measureText(msg).width;
  const x0 = -((tm * 0.05) % tw); c.fillText(msg + msg, x0, h * 0.54);
  c.fillStyle = "rgba(0,0,0,.25)"; for(let y = 0; y < h; y += 3) c.fillRect(0, y, w, 1);
}

/* ---------- 바닥 그림 도구 ---------- */
function paintKit(c, dark){
  const v = (l, d) => dark ? d : l, FS = K.FS;
  const rect = (i0, j0, i1, j1, col) => { c.fillStyle = col; c.fillRect(i0, j0, i1 - i0, j1 - j0); };
  const rr = (i0, j0, i1, j1, r, col) => { c.fillStyle = col; c.beginPath(); c.roundRect(i0, j0, i1 - i0, j1 - j0, r); c.fill(); };
  const line = (i0, j0, i1, j1, col, w = 0.02) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(i0, j0); c.lineTo(i1, j1); c.stroke(); };
  const poly = (pts, col) => { c.fillStyle = col; c.beginPath(); pts.forEach(([i, j], k) => k ? c.lineTo(i, j) : c.moveTo(i, j)); c.closePath(); c.fill(); };
  const text = (t, i, j, size, col, w = 800, fam = K.FONT, rot = 0) => { c.save(); c.translate(i, j); c.rotate(rot); c.scale(1 / FS, 1 / FS); c.font = `${w} ${size / 31.3 * FS}px ${fam}`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = col; c.fillText(t, 0, 0); c.restore(); };
  const glow = (i, j, r, c0) => { const g = c.createRadialGradient(i, j, 0, i, j, r); g.addColorStop(0, c0); g.addColorStop(1, "rgba(255,240,210,0)"); c.fillStyle = g; c.beginPath(); c.arc(i, j, r, 0, 7); c.fill(); };
  const wood = (i0, j0, i1, j1, l = "#EAD8BF", d = "#47392D") => { rect(i0, j0, i1, j1, v(l, d)); const ln = v("rgba(120,80,40,.12)", "rgba(0,0,0,.22)");
    for(let j = j0 + 0.36; j < j1; j += 0.36) line(i0, j, i1, j, ln, 0.014);
    for(let k = 0, j = j0; j < j1; j += 0.36, k++) for(let i = i0 + (k % 3) * 0.7 + 0.3; i < i1; i += 2.1) line(i, j, i, Math.min(j1, j + 0.36), ln, 0.014); };
  const check = (i0, j0, i1, j1, s, a, b) => { rect(i0, j0, i1, j1, a); for(let i = i0; i < i1 - 1e-3; i += s) for(let j = j0; j < j1 - 1e-3; j += s) if((Math.round((i - i0) / s) + Math.round((j - j0) / s)) % 2) rect(i, j, Math.min(i1, i + s), Math.min(j1, j + s), b); };
  const bricks = (i0, j0, i1, j1, base, ln, tint, bw = 0.8, bh = 0.4, seed = 1) => { rect(i0, j0, i1, j1, base);
    for(let j = j0, r = 0; j < j1 - 0.01; j += bh, r++) for(let i = i0 - (r % 2) * bw / 2, n = 0; i < i1; i += bw, n++){ if(rnd(seed + r * 31 + n * 7) < 0.22){ c.fillStyle = tint; c.fillRect(Math.max(i0, i) + 0.02, j + 0.02, Math.min(i1, i + bw) - Math.max(i0, i) - 0.04, Math.min(j1, j + bh) - j - 0.04); } }
    for(let j = j0, r = 0; j < j1 - 0.01; j += bh, r++){ line(i0, j, i1, j, ln, 0.018); for(let i = i0 + (r % 2 ? bw / 2 : 0); i < i1; i += bw) line(i, j, i, Math.min(j1, j + bh), ln, 0.018); } };
  return {v, rect, rr, line, poly, text, glow, wood, check, bricks};
}

/* =================================================================== 바닥 */
function paintTown(c, dark){
  const p = paintKit(c, dark), v = p.v, [a0, b0, a1, b1] = EXT;
  p.rect(a0, b0, a1, b1, v("#DCD3C6", "#363230"));
  // 앞 보도 (회베이지 블록) · 가게 앞 보행로 (분홍 베이지 블록)
  p.bricks(a0, RJ, a1, b1, v("#D8CDBE", "#383430"), v("rgba(120,100,80,.26)", "rgba(0,0,0,.35)"), v("rgba(232,181,200,.28)", "rgba(255,255,255,.03)"), 0.8, 0.4, 3);
  p.bricks(SCH.i1, SJ, a1, AJ, v("#EED9CF", "#3E3532"), v("rgba(160,110,100,.2)", "rgba(0,0,0,.35)"), v("rgba(232,181,200,.3)", "rgba(232,181,200,.06)"), 0.6, 0.3, 11);
  // 입구 길 (가운데 밝은 판석) + 로비 가는 표시
  p.rect(13.0, RJ, 15.0, b1, v("#EAE1D4", "#403B36")); for(let j = RJ + 0.5; j < b1; j += 0.5) p.line(13.0, j, 15.0, j, v("rgba(0,0,0,.08)", "rgba(255,255,255,.05)"), 0.016);
  p.rr(13.15, 18.95, 14.85, 19.65, 0.35, v("rgba(232,181,200,.6)", "rgba(232,181,200,.2)")); p.text("▼ 크레용타워", 14.0, 19.3, 6.4, v("#9A4E6A", "#F4C7D4"), 800, JUA);
  // 운동장 모래 · 트랙 · 철봉 아래 · 정문 들어오는 길
  p.rect(0, SCH.bj, SCH.i1, AJ, v("#EBD7B0", "#4A4032"));
  c.globalAlpha = dark ? 0.08 : 0.16; for(let k = 0; k < 1500; k++){ c.fillStyle = k % 3 ? "#FFFFFF" : "#9A7A50"; c.fillRect(rnd(k) * SCH.i1, SCH.bj + rnd(k + 77) * (AJ - SCH.bj), 0.04, 0.04); } c.globalAlpha = 1;
  c.strokeStyle = v("rgba(255,255,255,.95)", "rgba(255,255,255,.22)"); c.lineWidth = 0.06;
  c.beginPath(); c.roundRect(1.1, 4.3, 5.8, 4.3, 2.1); c.stroke(); c.beginPath(); c.roundRect(1.55, 4.75, 4.9, 3.4, 1.65); c.stroke();
  c.beginPath(); c.arc(4.0, 6.45, 0.55, 0, 7); c.stroke(); p.line(4.0, 4.3, 4.0, 8.6, v("rgba(255,255,255,.9)", "rgba(255,255,255,.2)"), 0.05);
  p.rr(5.4, 4.05, 7.85, 5.0, 0.2, v("#E0C894", "#55482F")); p.rr(3.1, 8.6, 5.3, AJ, 0.1, v("#E3CDA0", "#4F4433"));
  p.text("START", 1.85, 8.2, 4.6, v("rgba(255,255,255,.95)", "rgba(255,255,255,.25)"), 900, K.SIGN);
  // 가게 바닥: 문방구 마루 · 분식집 체크 타일 · 편의점 흰 타일
  p.wood(MUN[0], 0, MUN[1], SJ, "#EAD8BF", "#47392D");
  p.check(BUN[0], 0, BUN[1], SJ, 0.45, v("#FBF1E6", "#3E3732"), v("#F6D6CC", "#4A3A36"));
  p.rect(CVS[0], 0, CVS[1], SJ, v("#F4F5F2", "#3A3C3B")); c.globalAlpha = dark ? 0.22 : 0.08;
  for(let i = CVS[0] + 0.6; i < CVS[1]; i += 0.6) p.line(i, 0, i, SJ, "#000000", 0.012); for(let j = 0.6; j < SJ; j += 0.6) p.line(CVS[0], j, CVS[1], j, "#000000", 0.012); c.globalAlpha = 1;
  // 가게 문턱 · 매트
  [[MUN, PINK], [BUN, CORAL], [CVS, SPROUT]].forEach(([[i0, i1], col]) => p.rect(i0 + 0.12, SJ - 0.06, i1 - 0.12, SJ + 0.04, v("rgba(0,0,0,.1)", "rgba(0,0,0,.3)")));
  p.rr(18.6, 4.55, 21.1, 5.3, 0.1, v("#E87A6A", "#6A3A34")); p.text("어서 오세요", 19.85, 4.93, 5.4, v("#FFF3E0", "#F6D6CC"), 800, JUA);
  p.rr(23.5, 4.5, 25.7, 5.25, 0.1, v("#4DAA97", "#2F5A50")); p.text("WELCOME", 24.6, 4.88, 5.2, v("#FFFFFF", "#CFE9E0"), 800, K.SIGN);
  // 어린이 보호구역 길: 빨간 포장 · 흰 가장자리선 · 지그재그 · 글씨 · 30
  p.rect(a0, AJ, a1, RJ, v("#DE8A7E", "#4E3230"));
  c.globalAlpha = dark ? 0.1 : 0.14; for(let k = 0; k < 1800; k++){ c.fillStyle = k % 3 ? "#FFFFFF" : "#6A2A22"; c.fillRect(a0 + rnd(k + 5) * (a1 - a0), AJ + rnd(k + 61) * (RJ - AJ), 0.035, 0.035); } c.globalAlpha = 1;
  const wl = v("rgba(255,255,255,.95)", "rgba(255,255,255,.38)");
  [AJ + 0.14, RJ - 0.14].forEach(j => p.line(a0, j, a1, j, wl, 0.06));
  const zig = (i0, i1, j, s) => { c.strokeStyle = wl; c.lineWidth = 0.05; c.beginPath(); for(let i = i0, k = 0; i <= i1 + 1e-3; i += 0.5, k++) k ? c.lineTo(i, j + (k % 2) * s) : c.moveTo(i, j); c.stroke(); };
  [[a0 + 0.2, 2.6], [5.8, 12.5], [15.5, a1 - 0.2]].forEach(([i0, i1]) => { zig(i0, i1, AJ + 0.42, 0.32); zig(i0, i1, RJ - 0.42, -0.32); });
  const sch = v("rgba(255,255,255,.96)", "rgba(255,255,255,.4)");
  p.text("어린이 보호구역", 9.15, 12.05, 30, sch, 900); p.text("어린이 보호구역", 23.0, 12.75, 26, sch, 900);
  p.text("천천히", 19.6, 12.05, 22, v("rgba(255,246,200,.96)", "rgba(255,240,190,.4)"), 900);
  [1.3, 16.9].forEach(i => { c.fillStyle = v("#FFFFFF", "rgba(255,255,255,.5)"); c.beginPath(); c.arc(i, 12.05, 0.72, 0, 7); c.fill(); c.strokeStyle = v("#D23A33", "#8A3A34"); c.lineWidth = 0.16; c.beginPath(); c.arc(i, 12.05, 0.64, 0, 7); c.stroke();
    p.text("30", i, 12.08, 22, v("#2A2A28", "#3A3A38"), 900, K.SIGN); });
  // 노란 횡단보도 (흰 줄 사이를 노랗게) + 점자 블록
  CW.forEach(([i0, i1]) => { p.rect(i0, AJ + 0.06, i1, RJ - 0.06, v("#F6D24A", "#7A6A2A"));
    for(let i = i0 + 0.12; i < i1 - 0.2; i += 0.44) p.rect(i, AJ + 0.2, i + 0.24, RJ - 0.2, v("#FFFFFF", "rgba(255,255,255,.55)"));
    [[RJ + 0.06, RJ + 0.44], ...(i0 > 6 ? [[AJ - 0.44, AJ - 0.06]] : [])].forEach(([j0, j1]) => { p.rect(i0 + 0.3, j0, i1 - 0.3, j1, v("#F2C230", "#7A6420"));
      for(let i = i0 + 0.42; i < i1 - 0.34; i += 0.16) for(let j = j0 + 0.08; j < j1 - 0.04; j += 0.12){ c.fillStyle = v("rgba(150,110,0,.45)", "rgba(0,0,0,.3)"); c.beginPath(); c.arc(i, j, 0.026, 0, 7); c.fill(); } }); });
  // 옐로카펫 (횡단보도 기다리는 자리 · 노란 부채꼴)
  c.fillStyle = v("rgba(246,210,74,.85)", "rgba(122,106,42,.7)"); c.beginPath(); c.moveTo(12.85, RJ + 0.05); c.arc(12.85, RJ + 0.05, 1.45, PI / 2, PI); c.closePath(); c.fill();
  p.text("옐로카펫", 12.2, RJ + 0.75, 4.2, v("#9A7A10", "#E9D28A"), 800, JUA);
  // 사방치기 (분필) · 분필 그림
  { const chalk = v("rgba(255,255,255,.95)", "rgba(255,255,255,.45)"), sq = (i, j, n) => { c.strokeStyle = chalk; c.lineWidth = 0.04; c.strokeRect(i, j, 0.62, 0.62); p.text(n, i + 0.31, j + 0.33, 7, v("#E87A6A", "#F4A7B9"), 800, JUA); };
    sq(9.0, 16.8, "1"); sq(9.62, 16.8, "2"); sq(10.24, 16.49, "3"); sq(10.24, 17.11, "4"); sq(10.86, 16.8, "5"); sq(11.48, 16.49, "6"); sq(11.48, 17.11, "7"); sq(12.1, 16.8, "8");
    c.strokeStyle = chalk; c.beginPath(); c.arc(12.9, 17.11, 0.36, -PI / 2, PI / 2); c.stroke(); p.text("하늘", 12.98, 17.11, 4.2, v("#4DAA97", "#A8DCC8"), 800, JUA);
    RB.forEach((col, k) => { c.strokeStyle = dark ? "rgba(255,255,255,.18)" : col; c.lineWidth = 0.07; c.beginPath(); c.arc(9.6, 19.0, 0.9 - k * 0.08, PI, 0); c.stroke(); });
    p.text("유나 ♥ 민지", 9.6, 19.25, 4.4, v("#B5607E", "#F4C7D4"), 800, JUA); }
  // 은행잎 (노란 낙엽)
  [[16.9, 18.3], [26.4, 17.6], [11.9, 18.9], [2.4, 17.6]].forEach(([ci, cj], q) => { for(let k = 0; k < 46; k++){ const a = rnd(k + q * 50) * 7, r = 0.3 + rnd(k * 3 + q) * 1.25, i = ci + Math.cos(a) * r, j = cj + Math.sin(a) * r * 0.8;
    c.fillStyle = v(k % 3 ? "#F2C94C" : "#E8A040", "rgba(180,150,60,.45)"); c.beginPath(); c.moveTo(i, j); c.arc(i, j, 0.07, a, a + 1.6); c.closePath(); c.fill(); } });
  // 화단 흙 (아래 울타리 · 나무)
  [[2.4, 17.6]].forEach(([i, j]) => { c.fillStyle = v("rgba(120,90,60,.16)", "rgba(0,0,0,.2)"); c.beginPath(); c.arc(i, j, 1.0, 0, 7); c.fill(); });
  // 그림자·빛
  p.glow(15.6, 5.4, 2.2, v("rgba(255,250,235,.25)", "rgba(255,170,120,.2)"));
  if(dark){ [[2.4, 14.4], [16.4, 14.4], [26.6, 14.4], [8.9, 9.67], [17.6, 9.67], [24.8, 9.67]].forEach(([i, j]) => p.glow(i, j, 2.1, "rgba(255,226,160,.24)"));
    [[11.1, 4.5], [17.7, 4.5], [24.7, 4.5]].forEach(([i, j]) => p.glow(i, j + 1.6, 2.4, "rgba(255,214,160,.16)")); p.glow(6.6, 15.9, 1.4, "rgba(255,200,130,.22)"); }
}

/* =================================================================== 가게 공통 */
/* 뒷벽 (j = 0): 바깥 껍데기 + 위 뚜껑 + 걸레받이 */
function backWall(i0, i1, col){
  B(i0, -BT, i1 - i0, BT, TALL, col, 0, {r:0}); B(i0, -BT, i1 - i0, BT, 3, CAPC, TALL, {r:0});
  K.faceJ(i0, i1, 0.0, 0, 3.5, D("#FFFFFF", "#6A625C"), "m", 0.012);
}
/* 가게 앞: 기둥 둘 · 머리 보 · 줄무늬 차양 (앞이 낮게) · 물결 끝단 */
function storefront(i0, i1, cA, cB){
  [i0, i1].forEach(i => B(i - 0.13, SJ - 0.27, 0.26, 0.27, 80, WHITE, 0, {r:0.03}));
  B(i0 + 0.13, SJ - 0.22, i1 - i0 - 0.26, 0.18, 6, WHITE, 74, {r:0.02});
  const n = Math.max(4, Math.round((i1 - i0 - 0.3) / 0.52)), w = (i1 - i0 - 0.3) / n;
  for(let k = 0; k < n; k++){ const a = i0 + 0.15 + k * w;
    const g = B(a, SJ - 0.24, w, 0.78, 1.2, k % 2 ? cB : cA, 71, {r:0}); g.rotation.x = 0.21;
    const s = ball(a + w / 2, SJ + 0.53, 68.4, w / 2, k % 2 ? cA : cB, "m", 12); s.scale.set(1, 0.55, 0.22); }
}
/* 뒷벽 간판: 판 + 글씨 (밤엔 빛남) */
function signBoard(i0, i1, z0, z1, col, txt, size, tcol, glow, sub, scol){
  B(i0, 0.0, i1 - i0, 0.08, z1 - z0, col, z0, {r:0.05});
  B(i0 - 0.04, 0.0, i1 - i0 + 0.08, 0.06, 1.6, CAPC, z1, {r:0.02});
  K.wtext(txt, (i0 + i1) / 2, 0.09, sub ? (z0 + z1) / 2 + 3 : (z0 + z1) / 2, "i", size, tcol, glow, 800, JUA, {k:5});
  if(sub) K.wtext(sub, (i0 + i1) / 2, 0.09, z0 + 3.8, "i", 3.0, scol || tcol, null, 700, K.FONT);
}
/* 돌출 간판 (기둥 앞, +i 에서 읽힘): 세로로 한 글자씩 */
function bladeSign(i, txt, col, tcol){
  B(i - 0.04, SJ + 0.02, 0.08, 0.5, 38, col, 34, {r:0.04}); rod([i, SJ - 0.02, 70], [i, SJ + 0.3, 72.5], 0.012, POLE);
  [...txt].forEach((ch, k, a) => K.wtext(ch, i + 0.045, SJ + 0.27, 34 + 38 * (a.length - k - 0.5) / a.length, "j", 6.2, tcol, null, 800, JUA, {k:5}));
}
/* 플라스틱 동그란 의자 · 작은 탁자 */
function stool(ci, cj, col){ cylAt(ci, cj, 0.14, 0.18, 0, 12, col, "m", 14); disc(ci, cj, 0.165, 12, 1.2, K.sh(col, 0.14), "m", 16); }
function sTable(ci, cj, w, d, top, h = 20){
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => B(ci + a * (w / 2 - 0.08) - 0.025, cj + b * (d / 2 - 0.08) - 0.025, 0.05, 0.05, h, STEEL, 0, {r:0, cls:"s"}));
  B(ci - w / 2, cj - d / 2, w, d, 2, top, h, {r:0.03});
}
function bowl(i, j, z, r, col, food){ disc(i, j, r, z, 1.4, col, "s", 18); if(food) disc(i, j, r * 0.75, z + 1.4, 0.5, food, "m", 16); }

/* =================================================================== 크레용초등학교 */
function winSchool(i0, i1, z0, z1, k){   // 창: 하늘 그림 (아이들 그림 붙어 있음) + 흰 창틀
  const ww = i1 - i0, wh = hz(z1 - z0), j = SCH.bj;
  K.decal(Math.round(ww * 80), Math.round(wh * 80), (c, w, h, dark) => {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, dark ? "#1A2540" : "#BFE0F2"); g.addColorStop(1, dark ? "#2E3A58" : "#EEF4F8"); c.fillStyle = g; c.fillRect(0, 0, w, h);
    if(dark && k % 4 === 1){ c.fillStyle = "rgba(255,226,160,.55)"; c.fillRect(0, 0, w, h); }
    const s = c.createLinearGradient(w, 0, 0, h); s.addColorStop(0, "rgba(255,255,255,.35)"); s.addColorStop(0.4, "rgba(255,255,255,0)"); c.fillStyle = s; c.fillRect(0, 0, w, h);
    if(k % 3 === 0){ c.fillStyle = "#FFFFFF"; c.fillRect(w * 0.12, h * 0.2, w * 0.3, h * 0.42); c.fillStyle = "#F6C94C"; c.beginPath(); c.arc(w * 0.27, h * 0.36, w * 0.07, 0, 7); c.fill();
      c.fillStyle = "#72C4AE"; c.fillRect(w * 0.14, h * 0.5, w * 0.26, h * 0.1); }
    if(k % 3 === 1){ c.fillStyle = "#FFF6E8"; c.fillRect(w * 0.55, h * 0.18, w * 0.3, h * 0.45); c.fillStyle = "#F06BA8"; c.beginPath(); c.arc(w * 0.66, h * 0.34, w * 0.05, 0, 7); c.arc(w * 0.74, h * 0.34, w * 0.05, 0, 7); c.fill();
      c.beginPath(); c.moveTo(w * 0.62, h * 0.37); c.lineTo(w * 0.78, h * 0.37); c.lineTo(w * 0.7, h * 0.5); c.fill(); }
    if(k % 3 === 2){ RB.forEach((col, n) => { c.strokeStyle = col; c.lineWidth = h * 0.05; c.beginPath(); c.arc(w * 0.5, h * 0.75, h * (0.36 - n * 0.045), PI, 0); c.stroke(); }); }
  }, ww, wh, "i", (i0 + i1) / 2, j, hz((z0 + z1) / 2));
  B(i0 - 0.06, j, 0.06, 0.07, z1 - z0 + 3, WHITE, z0 - 1.5, {r:0, cls:"s"}); B(i1, j, 0.06, 0.07, z1 - z0 + 3, WHITE, z0 - 1.5, {r:0, cls:"s"});
  B(i0 - 0.06, j, ww + 0.12, 0.076, 1.5, WHITE, z1 + 0.01, {r:0, cls:"s"}); B(i0 - 0.1, j, ww + 0.2, 0.15, 1.8, WHITE, z0 - 1.8, {r:0, cls:"s"});
  B((i0 + i1) / 2 - 0.02, j, 0.04, 0.05, z1 - z0, WHITE, z0, {r:0, cls:"s"});
  [i0 + ww * 0.25, i0 + ww * 0.75].forEach(i => B(i - 0.02, j + 0.01, 0.04, 0.04, 1.2, D("#F4D3DF", "#6A4E5A"), z1 - 2.6, {r:0}));
}
function fence(a, b, fixed, axis, h = 30){
  const n = Math.max(1, Math.round((b - a) / 0.5)), P = (u, f) => axis === "i" ? [u, f] : [f, u];
  for(let k = 0; k <= n; k++){ const u = a + (b - a) * k / n, [i, j] = P(u, fixed); B(i - 0.028, j - 0.028, 0.056, 0.056, h, FENCE, 0, {r:0, cls:"s"}); ball(i, j, h + 1, 0.042, D("#F6E39A", "#8A7A3A"), "s", 8); }
  [6, h - 4].forEach(z => axis === "i" ? B(a, fixed - 0.016, b - a, 0.032, 2, FENCE, z, {r:0, cls:"s"}) : B(fixed - 0.016, a, 0.032, b - a, 2, FENCE, z, {r:0, cls:"s"}));
  for(let k = 0; k < n; k++) for(let q = 1; q < 4; q++){ const u = a + (b - a) * (k + q / 4) / n, [i, j] = P(u, fixed); B(i - 0.008, j - 0.008, 0.016, 0.016, h - 9, FENCE, 7, {r:0, cls:"s"}); }
}
function banner(i0, i1, t1, t2, edge){   // 울타리 현수막 (+j를 봄)
  const j = AJ + 0.045;
  K.decal(Math.round((i1 - i0) * 120), 64, (c, w, h, dark) => { c.fillStyle = dark ? "#3E3A44" : "#FFFDF8"; c.fillRect(0, 0, w, h);
    const e = cp2(edge, dark); c.fillStyle = e; c.fillRect(0, 0, w, 7); c.fillRect(0, h - 7, w, 7);
    c.fillStyle = dark ? "#F4D3DF" : "#2A2A28"; c.font = `800 ${h * 0.34}px 'Jua', sans-serif`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(t1, w / 2, h * 0.43);
    c.fillStyle = dark ? "#CFC6D8" : "#8B5A3C"; c.font = `700 ${h * 0.17}px 'Jua', sans-serif`; c.fillText(t2, w / 2, h * 0.74);
    c.fillStyle = "#9A949C"; [[5, 12], [w - 5, 12], [5, h - 12], [w - 5, h - 12]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 2.4, 0, 7); c.fill(); }); },
    i1 - i0, hz(17), "i", (i0 + i1) / 2, j, hz(15.5));
}
const cp2 = (c, dark) => Array.isArray(c) ? c[dark ? 1 : 0] : c;
function school(){
  const wall = D("#F7EDE2", "#4A423C"), wall2 = D("#F1E2D4", "#423A35"), I1 = SCH.i1, BJ = SCH.bj;
  // 본관 (2층) · 가운데 시계탑 · 지붕 테 · 무지개 띠
  B(0, -BT, I1, BJ + BT, 120, wall, 0, {r:0}); B(-0.04, -BT - 0.04, I1 + 0.08, BJ + BT + 0.08, 3, PINK, 120, {r:0});
  B(3.1, -BT, 1.8, BJ + BT + 0.12, 26, wall2, 120, {r:0}); B(3.05, -BT - 0.04, 1.9, BJ + BT + 0.2, 3, LILAC, 146, {r:0});
  { const g = myGeo(new THREE.CylinderGeometry(0.01, 1.02, hz(16), 4, 1)); g.rotateY(PI / 4); g.scale(1, 1, 0.6); K.sm(g, PINK, X(4.0), hz(149) + hz(8), Z(1.4), null, "m"); }
  K.faceJ(0, I1, BJ, 0, 10, PINK2, "m", 0.012);
  RB.forEach((col, k) => K.faceJ(0, I1, BJ, 108 + k * 1.6, 109.6 + k * 1.6, D(col, K.sh(col, -0.5)[1]), "m", 0.014));
  // 이름 (본관 위 띠) · 시계 (시계탑)
  B(0.5, BJ, 2.3, 0.05, 11, WHITE, 92, {r:0.03}); B(5.2, BJ, 2.3, 0.05, 11, WHITE, 92, {r:0.03});
  K.wtext("크레용", 1.65, BJ + 0.06, 97.5, "i", 8.4, SPROUT, null, 800, JUA, {k:5}); K.wtext("초등학교", 6.35, BJ + 0.06, 97.5, "i", 8.4, SPROUT, null, 800, JUA, {k:5});
  { const f = K.sm(K.cyl(0.5, 0.5, 0.06, 32), PINK, X(4.0), hz(132), Z(BJ + 0.15), null, "s"); f.rotation.x = PI / 2;
    const f2 = K.sm(K.cyl(0.42, 0.42, 0.03, 32), WHITE, X(4.0), hz(132), Z(BJ + 0.185), null, "s"); f2.rotation.x = PI / 2;
    for(let k = 0; k < 12; k++){ const a = k / 12 * PI * 2, r = 0.35; B(4.0 + Math.sin(a) * r - 0.018, BJ + 0.2, 0.036, 0.012, k % 3 ? 1.2 : 2.2, INK, 132 + Math.cos(a) * r * 31.1 - (k % 3 ? 0.6 : 1.1), {r:0}); }
    ball(4.0, BJ + 0.215, 132, 0.03, INK, "s", 8); }
  // 창: 1층 (가운데는 현관) · 2층
  [[0.45, 1.75], [2.0, 3.2], [4.8, 6.0], [6.25, 7.55]].forEach(([a, b], k) => winSchool(a, b, 16, 42, k));
  [[0.45, 1.75], [2.0, 3.2], [3.45, 4.55], [4.8, 6.0], [6.25, 7.55]].forEach(([a, b], k) => winSchool(a, b, 54, 80, k + 4));
  // 현관: 유리문 둘 · 문틀 · 차양 · 계단
  K.faceJ(3.4, 4.6, BJ, 0, 42, D("#D4E2EE", "#3A4A62"), "m", 0.02);
  K.faceJ(3.45, 3.98, BJ + 0.02, 1, 40, GLASS, "glass", 0.012); K.faceJ(4.02, 4.55, BJ + 0.02, 1, 40, GLASS, "glass", 0.012);
  [3.36, 4.56, 3.98].forEach(i => B(i, BJ, i === 3.98 ? 0.04 : 0.08, 0.06, 43, WHITE, 0, {r:0, cls:"s"})); B(3.36, BJ, 1.28, 0.06, 2, WHITE, 42, {r:0, cls:"s"});
  [3.9, 4.1].forEach(i => B(i - 0.012, BJ + 0.04, 0.024, 0.03, 8, GOLD, 18, {r:0, cls:"s"}));
  B(3.05, BJ, 1.9, 0.75, 2.5, WHITE, 47, {r:0.03}); B(3.0, BJ + 0.72, 2.0, 0.05, 4, PINK, 45, {r:0.01});
  B(3.2, BJ, 1.6, 0.4, 2.4, D("#E4DDD3", "#4A4540"), 0, {r:0.02});
  // 구령대 · 마이크 · 국기봉 (학교 깃발)
  B(0.55, BJ, 2.3, 0.95, 9, D("#E8DCCB", "#4E4740"), 0, {r:0.02}); B(0.53, BJ + 0.93, 2.34, 0.04, 9, PINK, 0, {r:0});
  B(1.25, BJ + 0.97, 0.9, 0.3, 4.5, D("#E8DCCB", "#4E4740"), 0, {r:0.02});
  rod([1.7, BJ + 0.35, 9], [1.7, BJ + 0.35, 38], 0.012, INK); ball(1.7, BJ + 0.35, 39.5, 0.035, "#55555A", "s", 10); disc(1.7, BJ + 0.35, 0.09, 9, 0.6, INK, "s", 12);
  B(1.35, BJ + 0.05, 0.7, 0.32, 20, WOOD, 9, {r:0.02}); K.faceJ(1.4, 2.0, BJ + 0.38, 12, 26, D("#FFFFFF", "#8A847C"), "m", 0.01); K.wtext("🏫", 1.7, BJ + 0.395, 19, "i", 4.5, INK, null, 700);
  rod([0.3, 3.0, 0], [0.3, 3.0, 128], 0.03, D("#E9E4DA", "#8A847C"), "s", 10); ball(0.3, 3.0, 129, 0.055, GOLD, "s", 10);
  B(0.32, 2.995, 0.62, 0.012, 13, SPROUT, 112, {r:0}); K.wtext("🖍️", 0.63, 3.01, 118.5, "i", 4.4, "#FFFFFF", null, 700);
  // 화단 (본관 앞) · 덤불
  [[5.0, 7.85]].forEach(([a, b]) => { B(a, BJ, b - a, 0.42, 6, D("#F3E9E4", "#4A403C"), 0, {r:0.03});
    for(let i = a + 0.15, k = 0; i < b - 0.1; i += 0.3, k++){ ball(i, BJ + 0.21, 8, 0.12, K.sh("plant", (k % 3) * 0.06), "m", 10); if(k % 2) ball(i, BJ + 0.26, 11, 0.05, RB[k % 6], "m", 8); } });
  ball(0.35, 9.4, 6, 0.3, K.sh("plant", 0.05), "m", 12); ball(0.7, 9.6, 5, 0.24, "plant", "m", 12);
  // 축구 골대 (왼쪽, +i를 봄) · 공
  { const i0 = 0.15, i1 = 0.75, j0 = 5.4, j1 = 7.6, h = 32, gc = D("#FFFFFF", "#9A949C");
    [j0, j1].forEach(j => { rod([i1, j, 0], [i1, j, h], 0.03, gc); rod([i0, j, 0], [i0, j, h * 0.8], 0.02, gc); rod([i1, j, h], [i0, j, h * 0.8], 0.02, gc); });
    rod([i1, j0, h], [i1, j1, h], 0.03, gc); rod([i0, j0, h * 0.8], [i0, j1, h * 0.8], 0.02, gc);
    K.decal(176, 64, (c, w, hh, dark) => { c.strokeStyle = dark ? "rgba(255,255,255,.35)" : "rgba(255,255,255,.85)"; c.lineWidth = 1.4; for(let x = 0; x <= w; x += 8){ c.beginPath(); c.moveTo(x, 0); c.lineTo(x, hh); c.stroke(); } for(let y = 0; y <= hh; y += 8){ c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); } },
      j1 - j0, hz(h * 0.8), "j", i0 - 0.024, (j0 + j1) / 2, hz(h * 0.4)); }
  { const b = ball(2.0, 6.6, 3.6, 0.11, "#FFFFFF", "m", 16); [[0, 0.11, 0], [0.09, 0.04, 0.05], [-0.08, 0.05, -0.04], [0.02, 0.02, 0.1], [-0.03, -0.02, -0.1]].forEach(([dx, dy, dz]) => K.sm(K.sph(0.035, 8, 6), INK, X(2.0) + dx, hz(3.6) + dy, Z(6.6) + dz, null, "m")); }
  // 철봉 (높이 셋) · 아래 모래
  { const js = 4.5, is = [5.6, 6.27, 6.93, 7.6], hs = [28, 34, 40];
    is.forEach((i, k) => cylAt(i, js, 0.035, 0.04, 0, k === 0 ? 30 : k === 3 ? 42 : hs[Math.min(k, 2)] + 2, D("#E87A6A", "#8A4A40"), "s", 10));
    hs.forEach((h, k) => rod([is[k], js, h], [is[k + 1], js, h], 0.018, STEEL, "s", 8)); }
  // 학교 종 (나무 틀 · 종은 움직임 → buildDyn)
  { const bi = 1.9, bj = 9.0; [bi - 0.32, bi + 0.32].forEach(i => B(i - 0.04, bj - 0.04, 0.08, 0.08, 50, WOODD, 0, {r:0.01}));
    B(bi - 0.42, bj - 0.06, 0.84, 0.12, 2.6, WOODD, 48, {r:0.01});
    [-1, 1].forEach(s => { const r = B(bi - 0.24 + s * 0.24 - 0.2, bj - 0.12, 0.48, 0.24, 1.4, CORAL, 51.5, {r:0.01}); r.rotation.z = -s * 0.42; });
    B(bi - 0.24, bj + 0.045, 0.48, 0.03, 7, CREAM, 40, {r:0.01}); K.wtext("학교종 땡땡땡", bi, bj + 0.08, 43.5, "i", 1.7, D("#8B5A3C", "#E9D2B0"), null, 800, JUA); }
  // 배움터 지킴이 초소
  { const i0 = 6.35, i1 = 7.55, j0 = 8.35, j1 = 9.55; B(i0, j0, i1 - i0, j1 - j0, 44, D("#FFFFFF", "#6E6862"), 0, {r:0.03});
    B(i0 - 0.08, j0 - 0.08, i1 - i0 + 0.16, j1 - j0 + 0.16, 3, SPROUT, 44, {r:0.03}); B(i0 + 0.1, j0 + 0.1, i1 - i0 - 0.2, j1 - j0 - 0.2, 4, SPROUT, 47, {r:0.03});
    K.faceJ(i0 + 0.15, i1 - 0.15, j1, 18, 36, GLASS, "glass", 0.012); K.faceI(i1, j0 + 0.15, j1 - 0.45, 18, 36, GLASS, "glass", 0.012);
    K.faceI(i1, j1 - 0.38, j1 - 0.08, 0, 34, D("#9FD0C0", "#3A5A50"), "m", 0.012);
    B(i0 + 0.2, j1, 0.8, 0.04, 6, SPROUT, 38.5, {r:0.01}); K.wtext("배움터 지킴이", (i0 + i1) / 2, j1 + 0.045, 41.5, "i", 2.1, "#FFFFFF", null, 800, JUA); }
  // 울타리: 앞(j 10, 정문 빼고) · 왼쪽 · 오른쪽(보행로 쪽)
  fence(0.05, SCH.g0 - 0.25, AJ, "i"); fence(SCH.g1 + 0.25, I1 + 0.1, AJ, "i"); fence(BJ + 0.1, AJ, 0.05, "j"); fence(SJ + 0.02, AJ, I1 + 0.1, "j");
  banner(6.72, 7.98, "가을 학예회 🎨", "11월 28일 금요일 · 강당", D("#F4A7B9", "#7A5866"));
  banner(0.35, 2.45, "차 조심! 손 들고 건너요 🙋", "크레용초 어린이 안전 지킴이", D("#F6D24A", "#8A7A30"));
  for(let i = 0.35, k = 0; i < SCH.g0 - 0.4; i += 0.38, k++) flowerStem(i, AJ - 0.22, RB[k % 6], 14 + (k % 3) * 3);
  // 정문: 벽돌 기둥 둘 · 무지개 아치 간판 · 접힌 미닫이 문
  { const brick = D("#D98A74", "#6A4036"); [SCH.g0 - 0.3, SCH.g1].forEach(i => { B(i, AJ - 0.22, 0.3, 0.44, 58, brick, 0, {r:0.02}); B(i - 0.03, AJ - 0.25, 0.36, 0.5, 3, CAPC, 58, {r:0.02});
      K.decal(32, 120, (c, w, h, dark) => { c.strokeStyle = dark ? "rgba(0,0,0,.35)" : "rgba(255,255,255,.4)"; c.lineWidth = 1.2; for(let y = 0; y < h; y += 8){ c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); const x = (y / 8) % 2 ? w / 2 : 0; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 8); c.stroke(); } },
        0.3, hz(56), "i", i + 0.15, AJ + 0.22, hz(29)); });
    const gc = (SCH.g0 + SCH.g1) / 2;
    B(SCH.g0 - 0.3, AJ - 0.09, SCH.g1 - SCH.g0 + 0.6, 0.18, 13, SPROUT, 60, {r:0.04});
    K.wtext("크레용초등학교", gc, AJ + 0.1, 66.6, "i", 5.4, "#FFFFFF", null, 800, JUA, {k:6});
    const arc = K.sm(myGeo(new THREE.TorusGeometry(1.15, 0.05, 8, 30, PI)), PINK, X(gc), hz(73), Z(AJ), null, "m");
    [0.25, 0.75, 1.3, 1.85, 2.4, 2.9].forEach((t, k) => ball(gc + Math.cos(t) * 1.15, AJ, 73 + Math.sin(t) * 1.15 * 31.1, 0.08, RB[k], "m", 10));
    ball(gc, AJ, 73 + 1.15 * 31.1 + 1.5, 0.12, D("#F6E39A", "#8A7A3A"), "m", 12); K.wtext("⭐", gc, AJ + 0.13, 110.3, "i", 3.6, "#FFFFFF", null, 700);
    for(let k = 0; k < 6; k++){ const i = SCH.g1 + 0.42 + k * 0.13; rod([i, AJ + 0.06, 1], [i, AJ + 0.06, 30], 0.012, STEEL); }
    B(SCH.g1 + 0.36, AJ + 0.03, 0.8, 0.06, 1.6, STEEL, 29, {r:0, cls:"s"}); B(SCH.g1 + 0.36, AJ + 0.03, 0.8, 0.06, 1.6, STEEL, 2, {r:0, cls:"s"}); }
}

/* =================================================================== 크레용문구 */
function gachaMachine(ci, j0, col, k){
  const w = 0.58, d = 0.5, jc = j0 + d / 2;
  B(ci - w / 2, j0, w, d, 13, col, 0, {r:0.06, seg:2});
  B(ci - w / 2 - 0.012, j0 - 0.012, w + 0.024, d + 0.024, 1.4, WHITE, 13, {r:0.02});
  ball(ci, jc, 22.2, 0.255, D("#EEF6FB", "#8AA0C0"), "glass", 20);
  for(let n = 0; n < 13; n++){ const a = rnd(n * 3 + k * 17) * PI * 2, r = 0.04 + rnd(n + k * 5) * 0.13, z = 15.6 + (n % 4) * 1.9 + rnd(n * 7 + k) * 1.2;
    ball(ci + Math.cos(a) * r, jc + Math.sin(a) * r, z, 0.058, RB[(n + k * 2) % 6], "s", 10); ball(ci + Math.cos(a) * r, jc + Math.sin(a) * r, z + 0.5, 0.05, "#FFFFFF", "s", 8).scale.y = 0.6; }
  disc(ci, jc, 0.17, 29.6, 3, col, "s", 20); ball(ci, jc, 33.4, 0.06, D("#F6E39A", "#8A7A3A"), "s", 10);
  K.faceJ(ci - 0.21, ci + 0.21, j0 + d, 9.2, 12.4, WHITE, "m", 0.01); K.wtext("200원", ci, j0 + d + 0.012, 10.8, "i", 1.8, INK, null, 800);
  B(ci - 0.1, j0 + d - 0.02, 0.2, 0.05, 3.2, INK, 0.8, {r:0.01}); B(ci - 0.08, j0 + d + 0.02, 0.16, 0.01, 2.4, D("#BFD3E2", "#4A5A72"), 1.2, {r:0, cls:"glass"});
  K.wtext(["🦄", "🌈", "⭐", "🐰"][k], ci + 0.17, j0 + d + 0.012, 4.2, "i", 2.6, INK, null, 700);
  if(k === 1) return;   // 유나가 돌리는 기계: 손잡이는 움직임 (buildDyn)
  const kn = K.sm(K.cyl(0.08, 0.08, 0.035, 18), STEEL, X(ci), hz(6.4), Z(j0 + d) + 0.018, null, "s"); kn.rotation.x = PI / 2;
  const bar = B(ci - 0.07, j0 + d + 0.03, 0.14, 0.03, 1.2, D("#FFFFFF", "#9A949C"), 5.8, {r:0, cls:"s"}); bar.rotation.z = 0.5 * k;
}
function arcade(i0, j0){
  const c = LILAC, c2 = D("#9C86B8", "#4A3E5A"), w = 0.72;
  B(i0, j0, w, 0.62, 22, c, 0, {r:0.04}); B(i0, j0, w, 0.32, 22, c, 22, {r:0.04});
  K.faceJ(i0 + 0.05, i0 + w - 0.05, j0 + 0.32, 25, 41, "#141218", "s", 0.01);
  const cp = B(i0 + 0.03, j0 + 0.32, w - 0.06, 0.28, 2, c2, 22.5, {r:0.02}); cp.rotation.x = 0.28;
  rod([i0 + 0.2, j0 + 0.46, 24], [i0 + 0.2, j0 + 0.46, 28], 0.012, INK); ball(i0 + 0.2, j0 + 0.46, 28.6, 0.04, D("#F06BA8", "#9A4E6A"), "s", 10);
  [["#F6C94C", 0.42], ["#72C4AE", 0.52], ["#A9CBEA", 0.62]].forEach(([col, a]) => disc(i0 + a, j0 + 0.47, 0.03, 23.6, 1.2, col, "glow", 10));
  B(i0, j0, w, 0.34, 6, PINK, 44, {r:0.03}); K.faceJ(i0 + 0.04, i0 + w - 0.04, j0 + 0.34, 45, 49, D("#FFF6E8", "#FFE7B0"), "glow", 0.008);
  K.wtext("GAME 🕹️", i0 + w / 2, j0 + 0.355, 47, "i", 2.6, D("#B5607E", "#9A4E6A"), null, 900);
  [0, 1, 2, 3, 4, 5].forEach(k => K.faceI(i0 + w, j0 + 0.08 + k * 0.08, j0 + 0.14 + k * 0.08, 4, 40, D(RB[k], K.sh(RB[k], -0.5)[1]), "m", 0.008));
  K.faceJ(i0 + 0.26, i0 + 0.46, j0 + 0.62, 10, 16, INK, "s", 0.008); K.wtext("100원", i0 + 0.36, j0 + 0.632, 7.5, "i", 1.6, D("#2A2A28", "#E9E4DA"), null, 800);
  dplane(150, 104, w - 0.14, hz(14), i0 + w / 2, j0 + 0.33, hz(33), (cc, ww, hh, tm) => drawArcade(cc, ww, hh, tm, K.R.dark), "i", 0.01);
  gl(i0 + w / 2, j0 + 0.45, 33, 34, "#C8B4FF", (tm, dk) => dk ? 0.5 : 0.1);
}
function munbanggu(){
  const [i0, i1] = MUN;
  backWall(i0, i1, D("#F7E6EE", "#4E3C46"));
  K.faceI(i0 + T / 2, 0, 2.6, 0, TALL, D("#F3DCE6", "#4A3A42"), "m", 0.012);
  wallJ(2.6, SJ, i0, D("#F7EEF0", "#4A4044"));
  K.decal(250, 200, (c, w, h, dark) => { c.fillStyle = dark ? "#3E3440" : "#F6EEF6"; c.fillRect(0, 0, w, h);
    c.fillStyle = dark ? "rgba(0,0,0,.25)" : "rgba(160,120,150,.16)"; for(let x = 8; x < w; x += 14) for(let y = 40; y < h; y += 14){ c.beginPath(); c.arc(x, y, 1.5, 0, 7); c.fill(); }
    c.fillStyle = "#C8B4D0"; c.beginPath(); c.roundRect(w * 0.16, 6, w * 0.68, 28, 14); c.fill();
    c.fillStyle = "#FFFFFF"; c.font = "800 19px 'Jua', sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("오늘의 준비물 ✏️", w / 2, 21);
    [[30, "#FFFFFF"], [52, "#F6E39A"]].forEach(([x, col]) => { c.fillStyle = col; c.beginPath(); c.roundRect(x - 6, 48, 12, 92, 6); c.fill(); c.fillStyle = "#8B5A3C"; for(let y = 62; y < 130; y += 12){ c.beginPath(); c.arc(x, y, 2.2, 0, 7); c.fill(); } });
    [["#F4A7B9", 88], ["#A9CBEA", 128], ["#A8DCC8", 168]].forEach(([col, x]) => { c.fillStyle = col; c.beginPath(); c.roundRect(x - 16, 60, 32, 40, 6); c.fill();
      c.strokeStyle = col; c.lineWidth = 3; c.beginPath(); c.moveTo(x - 10, 60); c.lineTo(x, 48); c.lineTo(x + 10, 60); c.stroke(); c.fillStyle = "#FFFFFF"; c.font = "700 10px 'Jua', sans-serif"; c.fillText("실내화", x, 82); });
    c.strokeStyle = "#F06BA8"; c.lineWidth = 3; c.beginPath(); c.arc(214, 70, 18, 0.2, PI - 0.2); c.stroke(); c.fillStyle = "#FFD43B"; c.fillRect(193, 52, 6, 18); c.fillRect(229, 52, 6, 18);
    const cr = ["#E8484A", "#F28C38", "#F6E39A", "#5FB36A", "#4A90C8", "#8E7BEF", "#FF8FB8", "#8B5A3C"]; c.fillStyle = "#FFFFFF"; c.fillRect(84, 120, 108, 46); cr.forEach((col, k) => { c.fillStyle = col; c.fillRect(90 + k * 12.5, 126, 9, 34); });
    c.fillStyle = "#4DAA97"; c.fillRect(84, 112, 108, 10); c.fillStyle = "#FFFFFF"; c.font = "700 9px 'Jua', sans-serif"; c.fillText("크레파스 24색", 138, 117);
    RB.forEach((col, k) => { c.fillStyle = col; c.fillRect(202 + k * 3, 112 + k * 9, 36, 32); });
    c.fillStyle = dark ? "#E9E4DA" : "#8B5A3C"; c.font = "700 12px 'Jua', sans-serif"; c.fillText("리코더 · 실내화 주머니 · 줄넘기 · 색종이", w / 2, h - 14); },
    2.3, hz(62), "j", i0 + T / 2, 1.3, hz(56));
  signBoard(8.6, 13.6, 84, 106, PINK, "크레용문구", 13, D("#A23F68", "#FFFFFF"), D("#FBE3EC", "#FF9AC4"), "준비물 · 장난감 · 문구 · 뽑기", D("#8E3A5C", "#FFD6E6"));
  // 뒷벽 선반 셋 (공책 · 크레파스 · 필통 · 장난감 상자)
  [20, 36, 52].forEach((z, r) => { B(8.5, 0.0, 3.75, 0.34, 1.6, WOOD, z, {r:0.01});
    for(let i = 8.56, n = 0; i < 12.2; i += r === 2 ? 0.34 : 0.13, n++){
      const col = RB[(n * 2 + r) % 6];
      if(r === 0) B(i, 0.05, 0.1, 0.26, 10 + (n % 3), D(col, K.sh(col, -0.5)[1]), z + 1.6, {r:0.01});
      else if(r === 1){ B(i, 0.06, 0.11, 0.22, 7, D(n % 2 ? "#FFE066" : "#F28C38", "#6A5A30"), z + 1.6, {r:0.01}); }
      else { B(i, 0.04, 0.3, 0.28, 8 + (n % 2) * 3, D(col, K.sh(col, -0.5)[1]), z + 1.6, {r:0.03}); K.faceJ(i + 0.06, i + 0.24, 0.321, z + 4, z + 7, WHITE, "m", 0.004); } } });
  [12.6, 13.7].forEach((i, q) => { B(i - 0.02, 0.0, 0.04, 0.3, 66, WOODD, 0, {r:0, cls:"s"}); });
  // 걸이판 (오른쪽 뒷벽): 줄넘기 · 요요 · 물총 · 딱지
  K.faceJ(12.35, 13.9, 0.0, 28, 72, D("#FFF4E6", "#4A4238"), "m", 0.02);
  K.decal(150, 140, (c, w, h, dark) => { c.fillStyle = dark ? "rgba(0,0,0,.25)" : "rgba(160,120,90,.18)"; for(let x = 6; x < w; x += 12) for(let y = 6; y < h; y += 12){ c.beginPath(); c.arc(x, y, 1.4, 0, 7); c.fill(); }
    c.strokeStyle = "#F06BA8"; c.lineWidth = 3; c.beginPath(); c.arc(30, 40, 18, 0, PI); c.stroke(); c.fillStyle = "#FFD43B"; c.fillRect(8, 30, 6, 16); c.fillRect(46, 30, 6, 16);
    c.fillStyle = "#5E9BEA"; c.beginPath(); c.arc(100, 34, 13, 0, 7); c.fill(); c.fillStyle = "#FFFFFF"; c.beginPath(); c.arc(100, 34, 4, 0, 7); c.fill();
    c.fillStyle = "#72C4AE"; c.fillRect(20, 84, 40, 14); c.fillRect(48, 76, 10, 30); c.fillStyle = "#F6E39A"; c.fillRect(14, 88, 8, 6);
    [["#E87A6A", 84], ["#A9CBEA", 104], ["#C8B4D0", 124]].forEach(([col, x]) => { c.fillStyle = col; c.fillRect(x - 8, 78, 16, 24); c.fillStyle = "#FFFFFF"; c.fillRect(x - 5, 84, 10, 3); });
    c.fillStyle = dark ? "#E9E4DA" : "#2A2A28"; c.font = "800 13px 'Jua', sans-serif"; c.textAlign = "center"; c.fillText("장난감 · 딱지", w / 2, h - 10); }, 1.5, hz(42), "i", 13.12, 0.02, hz(50));
  // 계산대 (유리 진열장) · 금전등록기
  B(12.3, 0.95, 1.6, 0.62, 12, PINK, 0, {r:0.03}); B(12.32, 0.97, 1.56, 0.58, 10, D("#EAF4FA", "#7A90B8"), 12, {r:0.01, cls:"glass"});
  [12.5, 12.8, 13.1, 13.4, 13.7].forEach((i, n) => B(i - 0.08, 1.12, 0.16, 0.26, 3, RB[n], 13.5, {r:0.02}));
  B(12.28, 0.93, 1.64, 0.66, 1.4, WHITE, 22, {r:0.02}); B(13.3, 1.05, 0.42, 0.32, 5, D("#5A5D63", "#2A2C2F"), 23.4, {r:0.03, cls:"s"});
  { const sc = B(13.34, 1.1, 0.34, 0.03, 3, "#5FD3E8", 28.4, {r:0, cls:"glow"}); sc.rotation.x = -0.3; }
  B(12.5, 1.1, 0.3, 0.3, 6, D("#FFFFFF", "#8A847C"), 23.4, {r:0.04}); [[12.58, "#F06BA8"], [12.72, "#5E9BEA"]].forEach(([i, col]) => rod([i, 1.25, 29], [i, 1.25, 35], 0.012, col, "m", 6));
  // 슬라임 · 스티커 진열대 (왼쪽, +i를 봄)
  { const a = 8.32, b = 8.82, j0 = 2.85, j1 = 5.05;
    B(a, j0, 0.06, j1 - j0, 46, WHITE, 0, {r:0}); [j0, j1 - 0.06].forEach(j => B(a, j, b - a, 0.06, 46, WHITE, 0, {r:0}));
    [0, 12, 24, 36].forEach(z => B(a + 0.02, j0 + 0.06, b - a - 0.02, j1 - j0 - 0.12, 1.4, WHITE, z, {r:0}));
    const SL = ["#F7B8D2", "#B9E6F2", "#D8F2B0", "#FFE08A", "#D7C4F2", "#FFC6A8", "#A8DCC8"];
    [1.4, 13.4, 25.4].forEach((z, r) => { for(let j = j0 + 0.2, n = 0; j < j1 - 0.12; j += 0.22, n++){ const col = SL[(n + r * 3) % SL.length];
      cylAt(a + 0.27, j, 0.08, 0.08, z, 6.4, D(col, K.sh(col, -0.5)[1]), "s", 14); disc(a + 0.27, j, 0.082, z + 6.4, 0.8, D("#FFFFFF", "#9A949C"), "s", 14);
      ball(a + 0.27, j, z + 5.2, 0.05, D(K.sh(col, 0.3)[0], K.sh(col, -0.4)[1]), "s", 10).scale.y = 0.4; } });
    K.faceI(a + 0.065, j0 + 0.08, j1 - 0.08, 38, 46, D("#FFF6FA", "#4A4048"), "m", 0.01);
    K.decal(210, 76, (c, w, h) => { const col = ["#F4A7B9", "#A9CBEA", "#F6E39A", "#A8DCC8", "#C8B4D0"]; for(let k = 0; k < 5; k++){ c.fillStyle = "#FFFFFF"; c.fillRect(6 + k * 41, 8, 36, h - 16);
      c.fillStyle = col[k]; [[0.3, 0.3], [0.7, 0.45], [0.4, 0.7], [0.75, 0.8]].forEach(([x, y]) => { c.beginPath(); c.arc(6 + k * 41 + 36 * x, 8 + (h - 16) * y, 5, 0, 7); c.fill(); });
      c.fillStyle = "#F6C94C"; c.font = "16px sans-serif"; c.fillText("★", 6 + k * 41 + 10, 8 + (h - 16) * 0.55); } }, j1 - j0 - 0.2, hz(8), "j", a + 0.065, (j0 + j1) / 2, hz(42));
    B(a + 0.05, j0 + 0.3, 0.04, j1 - j0 - 0.6, 7, LILAC, 47.5, {r:0.01}); K.wtext("말랑 슬라임 · 반짝 스티커", a + 0.095, (j0 + j1) / 2, 51, "j", 2.6, "#FFFFFF", null, 800, JUA); }
  // 불량식품 계단 진열대 · 바구니 · 100원 팻말
  { const a = 10.0, b = 12.0, j0 = 2.3, j1 = 3.3, wd = WOODD;
    B(a, j0, b - a, j1 - j0, 12, wd, 0, {r:0.03}); B(a + 0.05, j0, b - a - 0.1, 0.5, 7, wd, 12, {r:0.03});
    const CA = ["#F06BA8", "#FFD43B", "#72C4AE", "#F28C38", "#5E9BEA", "#C8B4D0"];
    [[j0 + 0.75, 12], [j0 + 0.25, 19]].forEach(([jc, z], r) => { for(let n = 0; n < 4; n++){ const ci = a + 0.27 + n * 0.49;
      B(ci - 0.2, jc - 0.19, 0.4, 0.38, 3, D("#F4E3C8", "#5A4E40"), z, {r:0.04});
      for(let q = 0; q < 6; q++){ const col = CA[(n + r * 2 + q) % 6];
        if((n + r) % 2) ball(ci - 0.11 + (q % 3) * 0.11, jc - 0.06 + (q / 3 | 0) * 0.12, z + 4, 0.045, col, "s", 8);
        else { const s = B(ci - 0.14 + (q % 3) * 0.1, jc - 0.12 + (q / 3 | 0) * 0.13, 0.07, 0.1, 1.6, col, z + 3, {r:0.01}); s.rotation.y = 0.3 * (q - 2); } } } });
    B(a + 0.75, j0 + 0.02, 0.5, 0.04, 9, D("#FFFFFF", "#8A847C"), 19, {r:0.01});
    K.wtext("불량식품", a + 1.0, j0 + 0.065, 25, "i", 2.3, CORAL, null, 800, JUA); K.wtext("100원~", a + 1.0, j0 + 0.065, 21.4, "i", 2.0, INK, null, 800); }
  // 위에 매단 장난감 (바람개비 · 풍선 망치 · 공)
  [[9.2, 4.9, "#F4A7B9"], [10.4, 4.95, "#A9CBEA"], [11.6, 4.9, "#F6E39A"], [12.8, 4.95, "#A8DCC8"]].forEach(([i, j, col], k) => { rod([i, j, 74], [i, j, 62], 0.005, D("#E6E1D8", "#6A6560"), "m", 4);
    if(k % 2){ ball(i, j, 58, 0.11, col, "m", 12); ball(i, j, 58, 0.112, "#FFFFFF", "m", 12).scale.set(0.25, 1, 1); }
    else { for(let q = 0; q < 4; q++){ const p = B(i - 0.1, j - 0.01, 0.2, 0.02, 3, q % 2 ? "#FFFFFF" : col, 59.5, {r:0}); p.rotation.z = q * PI / 4; } ball(i, j + 0.02, 61, 0.025, GOLD, "s", 6); } });
  storefront(i0, i1, PINK, D("#FFFFFF", "#8A847C"));
  bladeSign(i0 + 0.0, "문구", PINK, "#FFFFFF");
  // 가게 앞: 뽑기 기계 넷 · 오락기 · "뽑기" 팻말
  [[8.95, PINK], [9.65, D("#A9CBEA", "#4A5A72")], [10.35, D("#F6E39A", "#8A7A3A")], [11.05, LEAF]].forEach(([ci, col], k) => gachaMachine(ci, SJ + 0.08, col, k));
  B(9.2, SJ + 0.1, 1.6, 0.04, 6, WHITE, 36, {r:0.02}); K.wtext("두근두근 뽑기 🎁", 10.0, SJ + 0.145, 39, "i", 2.6, D("#B5607E", "#9A4E6A"), null, 800, JUA);
  [9.3, 10.7].forEach(i => { cylAt(i, SJ + 0.12, 0.018, 0.018, 0, 43, D("#FFFFFF", "#9A949C"), "s", 8); ball(i, SJ + 0.12, 43.6, 0.03, PINK, "s", 8); });   // 팻말 기둥 (기계 사이)
  arcade(12.25, SJ + 0.08);
  flowerPot(13.65, SJ + 0.35, "#F4A7B9", 0.8, LILAC2);
}

/* =================================================================== 크레용분식 */
function bunsik(){
  const [i0, i1] = BUN;
  backWall(i0, i1, D("#FFF1E4", "#4A3E36"));
  wallJ(0, SJ, i0, D("#F7EEF0", "#4A4044"));
  signBoard(14.5, 20.9, 84, 106, CORAL, "크레용분식", 13, "#FFFFFF", D("#B5503F", "#FFB08A"), "떡볶이 · 순대 · 튀김 · 어묵 · 김밥", D("#FFF3E0", "#FFE0C8"));
  // 부엌 뒷벽 타일 · 스테인리스 조리대 · 밥솥 · 김밥 · 그릇 · 냉장고
  K.decal(300, 110, (c, w, h, dark) => { c.fillStyle = dark ? "#3E3630" : "#FFFFFF"; c.fillRect(0, 0, w, h); c.strokeStyle = dark ? "rgba(0,0,0,.35)" : "rgba(200,170,150,.45)"; c.lineWidth = 1.2;
    for(let y = 0; y <= h; y += 11){ c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); } for(let r = 0; r < 10; r++) for(let x = (r % 2) * 11; x < w; x += 22){ c.beginPath(); c.moveTo(x, r * 11); c.lineTo(x, r * 11 + 11); c.stroke(); } },
    3.0, hz(30), "i", 15.75, 0.0, hz(42));
  B(14.25, 0.04, 3.0, 0.62, 26, STEEL, 0, {r:0.015, cls:"s"}); B(14.22, 0.02, 3.06, 0.66, 1.4, D("#E4E7EA", "#6A6E74"), 26, {r:0.01, cls:"s"});
  cylAt(14.6, 0.35, 0.18, 0.2, 27.4, 9, D("#FFFFFF", "#8A847C"), "s", 18); disc(14.6, 0.35, 0.16, 36.4, 1.4, PINK, "s", 18); ball(14.6, 0.35, 38.6, 0.03, INK, "s", 6);
  B(15.1, 0.12, 0.8, 0.42, 1.2, WOOD, 27.4, {r:0.02}); [15.25, 15.45, 15.65].forEach(i => { const r = K.sm(K.cyl(0.05, 0.05, 0.36, 12), "#1E2A22", X(i), hz(30.2), Z(0.33), null, "s"); r.rotation.x = PI / 2; });
  [[15.82, 0.24], [15.82, 0.42]].forEach(([i, j]) => { disc(i, j, 0.05, 28.6, 1.2, "#1E2A22", "s", 12); disc(i, j, 0.038, 29.8, 0.3, "#FFF8EE", "s", 12); ball(i + 0.01, j, 30.2, 0.012, "#F28C38", "s", 5); });
  [0, 1, 2, 3].forEach(k => disc(16.4, 0.33, 0.15, 27.4 + k * 1.3, 1.1, k % 2 ? D("#F4C7D4", "#7A5866") : WHITE, "s", 18));
  disc(16.85, 0.33, 0.12, 27.4, 6, D("#E9E4DA", "#7A756E"), "s", 16);
  B(17.35, 0.05, 0.82, 0.7, 56, STEEL, 0, {r:0.03, cls:"s"}); K.faceJ(17.4, 18.12, 0.76, 34, 34.6, K.sh(STEEL, -0.2), "s", 0.004);
  [[17.5, 40, 50], [17.5, 12, 30]].forEach(([i, a, b]) => rod([i, 0.79, a], [i, 0.79, b], 0.014, "#E9E4DA"));
  K.decal(70, 60, (c, w, h) => { c.fillStyle = "#FFF6E8"; c.fillRect(0, 0, w, h); c.fillStyle = "#E87A6A"; c.font = "700 12px 'Jua', sans-serif"; c.textAlign = "center"; c.fillText("오늘도", w / 2, 22); c.fillText("화이팅!", w / 2, 40); c.fillText("♥", w / 2, 55); }, 0.24, 0.2, "i", 17.95, 0.75, hz(46));
  // 앞 조리대 (길을 봄): 떡볶이 판 · 어묵 통 · 튀김 진열장
  { const a = 14.25, b = 18.2, j0 = 4.35, j1 = 5.15, top = 24;
    B(a, j0, b - a, j1 - j0, top, D("#FFFFFF", "#6E6862"), 0, {r:0.02}); B(a - 0.02, j0 - 0.02, b - a + 0.04, j1 - j0 + 0.04, 1.4, STEEL, top, {r:0.01, cls:"s"});
    K.decal(300, 64, (c, w, h, dark) => { c.fillStyle = dark ? "#6A3A34" : "#E87A6A"; c.fillRect(0, 0, w, h); c.fillStyle = dark ? "#4A2A26" : "#FFFFFF";
      for(let x = 0; x < w; x += 20) c.fillRect(x, 0, 10, h * 0.16); c.fillStyle = "#FFFFFF"; c.font = `800 ${h * 0.42}px 'Jua', sans-serif`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("즉석 떡볶이 · 수제 튀김 · 따끈 어묵", w / 2, h * 0.62); },
      b - a - 0.1, hz(14), "i", (a + b) / 2, j1, hz(12));
    // 떡볶이 판
    B(14.4, 4.43, 1.5, 0.64, 3, IRON, top + 1.4, {r:0.04, cls:"s"}); B(14.45, 4.48, 1.4, 0.54, 0.8, D("#E0503A", "#7A2C22"), top + 3.3, {r:0.03, cls:"s"});
    for(let n = 0; n < 34; n++){ const x = 14.55 + rnd(n * 5) * 1.2, y = 4.55 + rnd(n * 9 + 1) * 0.4;
      const r = K.sm(K.cyl(0.03, 0.03, 0.2, 8), D(n % 4 ? "#F0705A" : "#F49A82", "#8A3A2E"), X(x), hz(top + 4.6), Z(y), null, "s"); r.rotation.set(0, rnd(n) * PI, PI / 2); }
    for(let n = 0; n < 7; n++){ const f = B(14.6 + n * 0.18, 4.6 + (n % 2) * 0.2, 0.13, 0.1, 0.8, D("#F2B27A", "#8A5A3A"), top + 4.4, {r:0.01}); f.rotation.y = n * 0.7; }
    [[14.75, 4.85], [15.55, 4.62]].forEach(([i, j]) => { const e = ball(i, j, top + 4.6, 0.07, D("#F6E6CC", "#8A7A64"), "s", 12); e.scale.set(1, 0.75, 1.25); });
    for(let n = 0; n < 12; n++) B(14.55 + rnd(n * 13) * 1.25, 4.55 + rnd(n * 17) * 0.42, 0.04, 0.015, 0.4, D("#7FBF5A", "#3E6E34"), top + 5.4, {r:0});
    { const sp = B(15.85, 4.72, 0.4, 0.06, 0.8, D("#E9E4DA", "#7A756E"), top + 6, {r:0.01, cls:"s"}); sp.rotation.y = 0.5; }
    // 어묵 통 (국물 + 꼬치)
    B(16.05, 4.43, 1.22, 0.64, 5, STEEL, top + 1.4, {r:0.02, cls:"s"}); B(16.1, 4.48, 1.12, 0.54, 0.6, D("#E0B47A", "#6A5030"), top + 5.6, {r:0.01, cls:"s"});
    for(let n = 0; n < 9; n++){ const i = 16.2 + n * 0.115, j = 4.6 + (n % 3) * 0.14;
      rod([i, j, top + 5.6], [i + 0.06, j + 0.05, top + 20], 0.006, D("#E8D2A8", "#7A6A4E"), "m", 4);
      [0, 1, 2].forEach(q => { const f = ball(i + 0.012 + q * 0.016 + (q % 2 ? 0.02 : -0.01), j + 0.01 + q * 0.013, top + 8 + q * 3.2, 0.05, D("#E8B070", "#7A5A34"), "m", 10); f.scale.set(1, 0.55, 0.35); }); }
    rod([17.15, 4.55, top + 6], [17.4, 4.5, top + 16], 0.01, STEEL); disc(17.15, 4.55, 0.06, top + 5.4, 1.4, STEEL, "s", 12);
    [0, 1, 2, 3].forEach(k => cylAt(17.45, 4.95, 0.045, 0.035, top + 1.4 + k * 1.3, 2.4, "#FFFFFF", "s", 10));
    // 튀김 진열장
    B(17.52, 4.43, 0.62, 0.64, 1.2, STEEL, top + 1.4, {r:0.01, cls:"s"}); B(17.54, 4.45, 0.58, 0.6, 9, D("#EAF4FA", "#7A90B8"), top + 2.6, {r:0.02, cls:"glass"});
    [[17.65, 4.6, 0.7], [17.82, 4.62, -0.4], [18.0, 4.6, 0.2], [17.7, 4.82, -0.9], [17.9, 4.85, 0.5], [18.03, 4.83, 1.2]].forEach(([i, j, r], n) => { const f = B(i - 0.06, j - 0.03, 0.12, 0.06, 1.8, D(n % 2 ? "#E8A040" : "#D98A34", "#7A5426"), top + 2.6, {r:0.025}); f.rotation.y = r; }); }
  // 손님 자리: 탁자 둘 · 플라스틱 의자 넷 · 물병 · 그릇
  [[20.55, 1.3], [20.55, 3.1]].forEach(([ci, cj], q) => { sTable(ci, cj, 0.8, 0.74, D("#F6E9DA", "#5A5048"));
    bowl(ci - 0.12, cj, 22, 0.15, D("#FFFFFF", "#8A847C"), D("#E0503A", "#7A2C22")); bowl(ci + 0.2, cj + 0.15, 22, 0.08, WHITE, D("#F6D24A", "#7A6A2A"));
    cylAt(ci + 0.22, cj - 0.2, 0.04, 0.04, 22, 6, D("#BFE3F2", "#4A6A88"), "glass", 10); });
  stool(19.75, 1.3, D("#F28C7C", "#8A4A40")); stool(20.55, 0.5, D("#A9CBEA", "#4A5A72")); stool(19.75, 3.1, D("#F6E39A", "#8A7A3A")); stool(20.55, 3.9, D("#A8DCC8", "#4E7A6E"));
  K.faceJ(18.5, 21.2, 0.0, 44, 78, D("#33403A", "#1E2622"), "m", 0.02);
  K.decal(260, 100, (c, w, h, dark) => { c.strokeStyle = "#C9A77F"; c.lineWidth = 6; c.strokeRect(3, 3, w - 6, h - 6);
    const M = [["컵떡볶이", "2,000"], ["어묵 1개", "700"], ["튀김 1개", "700"], ["순대", "3,000"], ["김밥", "2,500"], ["쿨피스", "1,000"]];
    c.font = "800 13px 'Jua', sans-serif"; c.textBaseline = "middle"; M.forEach(([n, pr], k) => { const x = k < 3 ? 14 : w / 2 + 6, y = 22 + (k % 3) * 26;
      c.textAlign = "left"; c.fillStyle = "#FFFFFF"; c.fillText(n, x, y); c.textAlign = "right"; c.fillStyle = "#F6E39A"; c.fillText(pr, x + w / 2 - 22, y); }); }, 2.65, hz(33), "i", 19.85, 0.02, hz(61));
  K.wtext("MENU 🍢", 19.85, 0.03, 81.5, "i", 3.0, CORAL, null, 800, JUA);
  storefront(i0, i1, CORAL, CREAM);
  bladeSign(i0, "분식", CORAL, "#FFFFFF");
  // 가게 앞 야외 탁자 (빨간 플라스틱) + 의자 둘
  disc(19.9, 7.1, 0.42, 19.5, 1.6, D("#E8564A", "#7A3430"), "m", 24); cylAt(19.9, 7.1, 0.05, 0.05, 0, 19.5, D("#E8564A", "#7A3430"), "m", 8); disc(19.9, 7.1, 0.25, 0, 1, D("#C8463C", "#6A2C28"), "m", 16);
  bowl(19.8, 7.05, 21.1, 0.15, WHITE, D("#E0503A", "#7A2C22")); cylAt(20.05, 7.2, 0.04, 0.035, 21.1, 3.2, "#FFFFFF", "s", 10);
  stool(19.15, 7.1, D("#E8564A", "#7A3430")); stool(20.65, 7.1, D("#E8564A", "#7A3430"));
}

/* =================================================================== CREYONG 24 학교앞점 */
function cvs(){
  const [i0, i1] = CVS, PROD = ["#E8484A", "#F2C14E", "#4A90C8", "#FF8FB8", "#5FB36A", "#F28C38", "#8E7BEF", "#FFFFFF"];
  backWall(i0, i1, D("#EEF6F2", "#34383A"));
  wallJ(0, SJ, i0, D("#F7EEF0", "#4A4044")); wallJ(0, SJ, i1, D("#EEF2EE", "#3E4442"));
  signBoard(21.9, 27.5, 86, 106, SPROUT, "CREYONG 24", 11, "#FFFFFF", D("#2F7466", "#9EF3DD"), "학교앞점 · 24시간 · 1+1 행사 중", D("#F6E39A", "#FFE9A8"));
  // 음료 냉장고 넷 (뒷벽)
  const fw = 0.95;
  for(let k = 0; k < 4; k++){ const a = 21.7 + k * fw;
    B(a, 0.02, fw, 0.73, 56, D("#D9DDE0", "#3A3E42"), 0, {r:0.02}); K.faceJ(a + 0.07, a + fw - 0.07, 0.75, 4, 51, D("#E9F6FF", "#BFE6FF"), "glow", 0.008);
    [9, 22, 35].forEach((z, r) => { B(a + 0.07, 0.6, fw - 0.14, 0.17, 0.8, D("#B8BEC4", "#8AA0B0"), z - 1.2, {cls:"s", r:0});
      for(let bi = a + 0.13, n = 0; bi < a + fw - 0.16; bi += 0.15, n++) faceJ2(bi, bi + 0.1, 0.758, z, z + (r === 2 ? 8 : 10), PROD[(n * 3 + r * 2 + k) % PROD.length]); });
    K.faceJ(a, a + fw, 0.75, 51, 56, SPROUT, "m", 0.012); B(a + fw - 0.12, 0.76, 0.03, 0.03, 22, D("#5A5D63", "#8A8E94"), 18, {cls:"s", r:0}); }
  K.wtext("시원한 음료 🧃", 23.6, 0.785, 53.5, "i", 2.6, "#FFFFFF", null, 800, JUA);
  // 과자 선반 (뒷벽 오른쪽)
  { const a = 25.65, b = 27.85; B(a, 0.02, b - a, 0.5, 44, D("#FFFFFF", "#5A5E60"), 0, {r:0.01});
    [4, 16, 28].forEach((z, r) => { B(a + 0.04, 0.05, b - a - 0.08, 0.47, 0.8, D("#E9EDF0", "#4A4E52"), z - 0.8, {r:0});
      for(let bi = a + 0.08, n = 0; bi < b - 0.2; bi += 0.2, n++) B(bi, 0.08, 0.16, 0.38, 7 + (n % 2) * 2, PROD[(n + r * 3) % PROD.length], z, {cls:"s", r:0.02}); });
    K.faceJ(a, b, 0.52, 40, 44, D("#F28C38", "#8A5A30"), "m", 0.012); K.wtext("과자 · 젤리 · 초콜릿", (a + b) / 2, 0.535, 42, "i", 2.2, "#FFFFFF", null, 800, JUA); }
  // 가운데 진열대 (양쪽)
  { const a = 22.0, b = 25.1, j0 = 2.35, j1 = 2.95; B(a, j0, b - a, j1 - j0, 3, D("#5A5D63", "#2A2C2F"), 0, {r:0.02}); B(a + 0.05, j0 + 0.05, b - a - 0.1, j1 - j0 - 0.1, 25, D("#EEF0EC", "#4A4E52"), 3, {r:0.01});
    [6, 13, 20].forEach((z, r) => { for(let bi = a + 0.08, n = 0; bi < b - 0.18; bi += 0.2, n++){ B(bi, j0 - 0.02, 0.16, j1 - j0 + 0.04, 5.5, PROD[(n + r * 3) % PROD.length], z, {cls:"s", r:0.01}); }
      B(a + 0.05, j0 - 0.03, b - a - 0.1, j1 - j0 + 0.06, 0.6, SPROUT, z - 0.6, {cls:"s", r:0}); });
    B(a, j0, b - a, j1 - j0, 1.2, SPROUT, 28, {r:0.02}); K.faceI(b, j0 + 0.08, j1 - 0.08, 6, 24, D("#FF8FB8", "#8A4A60"), "m", 0.012); K.wtext("1+1", b + 0.015, (j0 + j1) / 2, 15, "j", 3.2, "#FFFFFF", null, 900); }
  // 계산대 (길이 방향) · 포스 · 호빵 찜기 · 사탕 통
  { const a = 26.35, b = 27.05, j0 = 1.35, j1 = 4.0; B(a, j0, b - a, j1 - j0, 23, SPROUT, 0, {r:0.03}); B(a - 0.03, j0 - 0.03, b - a + 0.06, j1 - j0 + 0.06, 1.5, D("#F4F4F0", "#BDB5A9"), 23, {cls:"s", r:0.02});
    K.faceI(a - 0.012, j0 + 0.15, j1 - 0.15, 6, 17, D("#E9F6F2", "#2F5A50"), "m", 0.012); K.wtext("CREYONG 24", a - 0.012, (j0 + j1) / 2 + 0.1, 11.5, "j", 2.6, SPROUT, null, 900);
    B(a + 0.15, 1.6, 0.38, 0.4, 5, "#2A2A2E", 24.5, {cls:"s", r:0.02}); { const o = B(a + 0.14, 1.64, 0.02, 0.32, 4.5, "#5FD3E8", 29.5, {cls:"glow", r:0}); o.rotation.z = 0.35; }
    B(a + 0.1, 2.35, 0.5, 0.5, 12, D("#E6F0FA", "#96B4D2"), 24.5, {cls:"glass", r:0.03}); B(a + 0.1, 2.35, 0.5, 0.5, 1, D("#CFC6B8", "#4A453F"), 24.5, {cls:"s", r:0.01});
    [[a + 0.22, 2.48], [a + 0.45, 2.5], [a + 0.25, 2.72], [a + 0.47, 2.74]].forEach(([i, j], n) => { const b2 = ball(i, j, 27.6, 0.085, D(n % 2 ? "#FFFFFF" : "#F6E6CC", "#9A948A"), "s", 12); b2.scale.y = 0.75; });
    B(a + 0.1, 2.35, 0.5, 0.02, 3, D("#F28C38", "#8A5A30"), 33, {r:0}); K.wtext("호빵", a + 0.35, 2.33, 34.5, "i", 1.8, D("#F28C38", "#E8A04A"), null, 800, JUA);
    [[a + 0.22, 3.4, "#F06BA8"], [a + 0.45, 3.45, "#FFD43B"], [a + 0.3, 3.68, "#72C4AE"]].forEach(([i, j, col]) => { cylAt(i, j, 0.08, 0.08, 24.5, 7, D("#EAF4FA", "#7A90B8"), "glass", 14); for(let q = 0; q < 4; q++) ball(i + (q % 2 - 0.5) * 0.06, j + ((q / 2 | 0) - 0.5) * 0.06, 26 + q, 0.03, col, "s", 6); }); }
  // 앞: 차양 · 돌출 간판 · 아이스크림 냉동고 (위에 고양이) · 파라솔 탁자 · 분리수거함
  storefront(i0, i1, SPROUT, D("#FFFFFF", "#8A847C"));
  bladeSign(i0, "24", SPROUT, "#FFFFFF");
  { const a = 22.0, b = 23.4, j0 = SJ + 0.15, j1 = SJ + 0.9;
    B(a, j0, b - a, j1 - j0, 20, D("#FFFFFF", "#7E848A"), 0, {r:0.05}); K.faceJ(a + 0.06, b - 0.06, j1, 5, 15, D("#4A90C8", "#2A4A6A"), "m", 0.01);
    K.wtext("아이스크림 🍦", (a + b) / 2, j1 + 0.012, 10.5, "i", 2.6, "#FFFFFF", null, 800, JUA);
    const IC = ["#F4A7B9", "#F6E39A", "#A8DCC8", "#A9CBEA", "#C8B4D0", "#F28C38"];
    for(let n = 0; n < 10; n++){ const i = a + 0.15 + (n % 5) * 0.26, j = j0 + 0.2 + (n / 5 | 0) * 0.32; B(i - 0.08, j - 0.1, 0.16, 0.2, 2.2, IC[n % 6], 18.2, {r:0.03}); }
    B(a + 0.05, j0 + 0.05, b - a - 0.1, j1 - j0 - 0.1, 0.5, D("#DCEFFA", "#96B4D2"), 20, {cls:"glass", r:0}); }
  // 편의점 고양이 '치즈' (냉동고 위에서 낮잠)
  { const ci = 22.95, cj = SJ + 0.5, cc = D("#F2B45A", "#8A6430"), z = 20.5;
    const bd = ball(ci, cj, z + 2.8, 0.15, cc, "m", 14); bd.scale.set(1.3, 0.62, 0.9);
    ball(ci + 0.17, cj + 0.04, z + 4.4, 0.085, cc, "m", 12);
    [-0.045, 0.045].forEach(d => { const e = K.sm(K.cyl(0.0, 0.03, 0.06, 6), cc, X(ci + 0.19), hz(z + 7.2), Z(cj + 0.04 + d), null, "m"); });
    rod([ci - 0.18, cj, z + 2.4], [ci - 0.05, cj + 0.17, z + 1.6], 0.02, cc, "m", 6);
    [[0.02, 0], [-0.08, 0.02], [0.1, -0.02]].forEach(([d, e]) => B(ci + d - 0.025, cj - 0.12 + e, 0.05, 0.03, 0.6, D("#E89A3A", "#6A4A20"), z + 4.2, {r:0})); }
  // 파라솔 탁자 · 의자 둘
  { const ti = 26.0, tj = 7.6; disc(ti, tj, 0.42, 20, 1.4, D("#FFFFFF", "#8A847C"), "s", 24); cylAt(ti, tj, 0.03, 0.03, 0, 20, STEEL, "s", 8); disc(ti, tj, 0.2, 0, 0.8, STEEL, "s", 14);
    cylAt(ti, tj, 0.02, 0.02, 21, 46, D("#E9E4DA", "#8A847C"), "s", 8);
    const cols = [SPROUT, D("#FFFFFF", "#8A847C")]; for(let k = 0; k < 8; k++) K.sm(myGeo(new THREE.CylinderGeometry(0, 1.0, hz(9), 1, 1, false, k / 8 * PI * 2, PI / 4)), cols[k % 2], X(ti), hz(62) + hz(4.5), Z(tj), null, "m");
    ball(ti, tj, 67.5, 0.04, STEEL, "s", 8);
    [[ti - 0.68, "+i"], [ti + 0.68, "-i"]].forEach(([ci, dir]) => { [[-0.15, -0.15], [0.12, -0.15], [-0.15, 0.12], [0.12, 0.12]].forEach(([a, b]) => B(ci + a, tj + b, 0.04, 0.04, 14, STEEL, 0, {r:0, cls:"s"}));
      B(ci - 0.2, tj - 0.19, 0.4, 0.38, 2.2, LEAF, 14, {r:0.04}); B(dir === "+i" ? ci - 0.22 : ci + 0.17, tj - 0.19, 0.05, 0.38, 16, LEAF, 16, {r:0.02}); });
    cylAt(ti - 0.1, tj, 0.05, 0.045, 21.4, 4, D("#FFF6DA", "#8A847C"), "s", 10); cylAt(ti + 0.12, tj + 0.08, 0.04, 0.04, 21.4, 5.5, D("#F6D86A", "#8A7A3A"), "s", 10); }
  [["#4A90C8", 27.0], ["#F2C14E", 27.32], ["#72C4AE", 27.64]].forEach(([col, i]) => { B(i - 0.14, SJ + 0.1, 0.28, 0.34, 17, D(col, K.sh(col, -0.5)[1]), 0, {r:0.04}); B(i - 0.15, SJ + 0.09, 0.3, 0.36, 1.2, WHITE, 17, {r:0.02}); });
  K.wtext("♻️", 27.32, SJ + 0.45, 11, "i", 3, "#FFFFFF", null, 700);
}
const faceJ2 = (i0, i1, j, z0, z1, col) => K.faceJ(i0, i1, j, z0, z1, col, "glow", 0.006);

/* =================================================================== 보행로 · 길 · 앞 보도 */
function planter(i0, i1, j0, d){
  B(i0, j0, i1 - i0, d, 10, D("#F3E9E4", "#4A403C"), 0, {r:0.04}); B(i0 + 0.05, j0 + 0.05, i1 - i0 - 0.1, d - 0.1, 0.6, D("#7A5A3C", "#3A2C22"), 10, {r:0.02});
  for(let i = i0 + 0.16, k = 0; i < i1 - 0.1; i += 0.27, k++){ ball(i, j0 + d / 2 + (k % 2 ? 0.06 : -0.05), 12.4, 0.12, K.sh("plant", (k % 3) * 0.06), "m", 10);
    if(k % 2 === 0) ball(i + 0.04, j0 + d / 2, 15.6, 0.055, RB[(k / 2 | 0) % 6], "m", 8); }
}
function lamp(i, j){
  cylAt(i, j, 0.035, 0.05, 0, 62, POLE, "s", 10); disc(i, j, 0.1, 0, 2, POLE, "s", 12); disc(i, j, 0.05, 62, 1.5, POLE, "s", 10);
  ball(i, j, 67, 0.15, D("#FFF6E8", "#FFE7B0"), "glow", 16); disc(i, j, 0.11, 71.5, 1.6, POLE, "s", 12); ball(i, j, 74, 0.035, POLE, "s", 8);
  [0, 1, 2, 3].forEach(k => { const a = k * PI / 2; rod([i + Math.cos(a) * 0.16, j + Math.sin(a) * 0.16, 64], [i + Math.cos(a) * 0.1, j + Math.sin(a) * 0.1, 71.6], 0.006, POLE, "s", 4); });
  gl(i, j, 67, 46, "#FFE2A8", night(0.75));
}
function bungeoCart(){
  const i0 = 6.2, i1 = 7.1, j0 = 15.0, j1 = 16.9, top = 24, body = D("#FFF3E0", "#4A4238");
  B(i0, j0, i1 - i0, j1 - j0, 19, body, 5, {r:0.05});
  K.decal(260, 96, (c, w, h, dark) => { c.fillStyle = dark ? "#6A3A34" : "#E87A6A"; c.fillRect(0, 0, w, h); c.fillStyle = dark ? "#5A302C" : "#F4A196"; for(let x = 0; x < w; x += 26) c.fillRect(x, 0, 13, h * 0.14);
    c.fillStyle = "#FFFFFF"; c.font = `800 ${h * 0.4}px 'Jua', sans-serif`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("붕어빵 🐟", w * 0.5, h * 0.45);
    c.font = `700 ${h * 0.18}px 'Jua', sans-serif`; c.fillStyle = "#FFF3B8"; c.fillText("팥 · 슈크림  3개 2,000원", w * 0.5, h * 0.8); }, j1 - j0 - 0.14, hz(15), "j", i1, (j0 + j1) / 2, hz(14));
  B(i0 - 0.03, j0 - 0.03, i1 - i0 + 0.06, j1 - j0 + 0.06, 1.6, WOODD, top, {r:0.02});
  [j0 + 0.32, j1 - 0.32].forEach(j => [i0 + 0.01, i1 - 0.01].forEach(i => { const w = K.sm(K.cyl(0.14, 0.14, 0.05, 18), INK, X(i), 0.14, Z(j), null, "s"); w.rotation.z = PI / 2;
    const hb = K.sm(K.cyl(0.06, 0.06, 0.06, 12), STEEL, X(i), 0.14, Z(j), null, "s"); hb.rotation.z = PI / 2; }));
  // 붕어빵 틀 (무쇠) + 틀 그림 · 손잡이
  B(i0 + 0.06, j0 + 0.1, 0.78, 1.15, 3.5, IRON, top + 1.6, {r:0.02, cls:"s"});
  K.decal(150, 220, (c, w, h, dark) => { c.fillStyle = "#26262A"; c.fillRect(0, 0, w, h); for(let r = 0; r < 4; r++) for(let q = 0; q < 2; q++){ const x = w * (0.28 + q * 0.44), y = h * (0.14 + r * 0.24), done = (r + q) % 3 !== 0;
      c.fillStyle = "#151517"; c.beginPath(); c.ellipse(x, y, w * 0.18, h * 0.08, 0, 0, 7); c.fill();
      if(done){ c.fillStyle = dark ? "#B87A30" : "#E8A040"; c.beginPath(); c.ellipse(x - w * 0.02, y, w * 0.14, h * 0.06, 0, 0, 7); c.fill(); c.beginPath(); c.moveTo(x + w * 0.1, y); c.lineTo(x + w * 0.18, y - h * 0.05); c.lineTo(x + w * 0.18, y + h * 0.05); c.fill();
        c.fillStyle = "rgba(120,60,10,.6)"; c.beginPath(); c.arc(x - w * 0.1, y - h * 0.012, 2, 0, 7); c.fill(); for(let s = 0; s < 3; s++){ c.fillRect(x - w * 0.04 + s * 6, y - h * 0.035, 1.5, h * 0.07); } } } },
    0.74, 1.1, "f", i0 + 0.45, j0 + 0.675, hz(top + 5.1));
  [j0 + 0.25, j0 + 0.55, j0 + 0.85, j0 + 1.12].forEach(j => { rod([i0 + 0.06, j, top + 3.5], [i0 - 0.16, j, top + 4], 0.012, INK); ball(i0 - 0.17, j, top + 4, 0.025, WOODD, "s", 6); });
  // 다 구운 붕어빵 진열 (유리 상자)
  B(i0 + 0.08, 16.32, 0.74, 0.5, 1.2, D("#F4E3C8", "#5A4E40"), top + 1.6, {r:0.02}); B(i0 + 0.08, 16.32, 0.74, 0.5, 9, D("#EAF4FA", "#7A90B8"), top + 1.6, {r:0.02, cls:"glass"});
  [[6.38, 16.45, 0.2], [6.6, 16.43, -0.2], [6.82, 16.46, 0.1], [6.45, 16.66, -0.1], [6.7, 16.68, 0.25], [6.55, 16.56, 0, 1.6]].forEach(([i, j, r, dz = 0]) => {
    const f = ball(i, j, top + 4 + dz, 0.075, D("#E8A040", "#8A5A26"), "m", 12); f.scale.set(1.35, 0.42, 0.75); f.rotation.y = r;
    const t2 = K.sm(K.cyl(0.0, 0.05, 0.07, 3), D("#D98A34", "#7A4E22"), X(i - 0.12), hz(top + 4 + dz), Z(j), null, "m"); t2.rotation.set(0, r, -PI / 2); });
  [0, 1, 2].forEach(k => B(i0 + 0.1 + k * 0.02, j1 - 0.07, 0.2, 0.05, 5 - k, D("#F6E6CC", "#7A6A54"), top + 1.6 + k * 0.3, {r:0.01}));
  // 차양 (줄무늬, +i 쪽이 낮게) · 기둥 · 앞 간판 · 전구 · 가스통
  [j0 + 0.05, j1 - 0.05].forEach(j => B(i0 - 0.02, j - 0.025, 0.05, 0.05, 42, STEEL, top, {r:0, cls:"s"}));
  for(let k = 0; k < 8; k++){ const s = B(5.55, j0 - 0.2 + k * (j1 - j0 + 0.4) / 8, 1.9, (j1 - j0 + 0.4) / 8, 1.2, k % 2 ? D("#FFFFFF", "#8A847C") : CORAL, 66, {r:0}); s.rotation.z = -0.2; }
  B(7.33, j0 + 0.1, 0.05, j1 - j0 - 0.2, 8, CORAL, 55.6, {r:0.01}); K.wtext("따끈따끈 붕어빵", 7.385, (j0 + j1) / 2, 59.6, "j", 3.2, "#FFFFFF", null, 800, JUA);
  rod([6.55, 15.95, 66], [6.55, 15.95, 57], 0.006, INK, "s", 4); ball(6.55, 15.95, 55.4, 0.06, D("#FFF6DA", "#FFE7A0"), "glow", 10); gl(6.55, 15.95, 55.4, 30, "#FFD68C", night(0.8));
  cylAt(5.9, 16.75, 0.1, 0.1, 0, 12, D("#5E9BEA", "#2E4A70"), "s", 14); ball(5.9, 16.75, 12.5, 0.08, D("#5E9BEA", "#2E4A70"), "s", 10); rod([5.9, 16.75, 15], [6.2, 16.6, 20], 0.01, INK, "s", 4);
}
function busStop(){
  const i0 = 18.7, i1 = 23.5, j0 = 14.7, j1 = 15.95;
  [[i0, j0], [i1, j0], [i0, j1], [i1, j1]].forEach(([i, j]) => B(i - 0.04, j - 0.04, 0.08, 0.08, 70, POLE, 0, {r:0, cls:"s"}));
  B(i0 - 0.2, j0 - 0.3, i1 - i0 + 0.4, j1 - j0 + 0.5, 3, SPROUT, 70, {r:0.04}); B(i0 - 0.22, j0 - 0.32, i1 - i0 + 0.44, j1 - j0 + 0.54, 1, WHITE, 73, {r:0.02});
  K.faceJ(i0 + 0.04, i1 - 0.04, j1 - 0.012, 4, 66, GLASS, "glass", 0.02); K.faceI(i1 - 0.012, j0 + 0.35, j1 - 0.04, 4, 66, GLASS, "glass", 0.02);
  B(i0 + 0.04, j1 - 0.04, i1 - i0 - 0.08, 0.06, 2, POLE, 66, {r:0, cls:"s"});
  // 광고 (뒷 유리 바깥 = +j 쪽, 보도에서 보임)
  K.decal(220, 230, (c, w, h, dark) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#FFF3E0"); g.addColorStop(1, "#F7DCE6"); c.fillStyle = g; c.fillRect(0, 0, w, h);
    RB.forEach((col, k) => { c.strokeStyle = col; c.lineWidth = 9; c.beginPath(); c.arc(w / 2, h * 0.62, w * (0.36 - k * 0.042), PI, 0); c.stroke(); });
    c.fillStyle = "#FFFFFF"; [[0.25, 0.62], [0.75, 0.62]].forEach(([x, y]) => { c.beginPath(); c.arc(w * x, h * y, 16, 0, 7); c.arc(w * x + 14, h * y + 4, 12, 0, 7); c.arc(w * x - 14, h * y + 4, 12, 0, 7); c.fill(); });
    c.fillStyle = "#B5607E"; c.font = "800 26px 'Jua', sans-serif"; c.textAlign = "center"; c.fillText("동네 그림 대회", w / 2, h * 0.2);
    c.fillStyle = "#4DAA97"; c.font = "700 16px 'Jua', sans-serif"; c.fillText("크레용초등학교 강당 🖍️", w / 2, h * 0.32); c.fillStyle = "#8B5A3C"; c.fillText("12월 6일 토요일", w / 2, h * 0.84); }, 1.2, hz(40), "i", 22.6, j1 + 0.045, hz(36));
  B(21.98, j1 + 0.02, 1.24, 0.03, 43, D("#FFFFFF", "#8A847C"), 14.5, {r:0, cls:"s"});
  // 벤치 (길 쪽을 봄)
  B(19.2, j1 - 0.62, 3.0, 0.45, 2, WOOD, 12, {r:0.02}); B(19.2, j1 - 0.17, 3.0, 0.07, 12, WOOD, 15, {r:0.02});
  [19.35, 20.7, 22.05].forEach(i => B(i - 0.03, j1 - 0.55, 0.06, 0.32, 12, POLE, 0, {r:0, cls:"s"}));
  // 지붕 위 이름판 · 버스 도착 알림판 (오른쪽 기둥, +i를 봄)
  B(19.6, j1 - 0.02, 3.0, 0.08, 10, SPROUT, 73.4, {r:0.03}); K.wtext("크레용초등학교 앞 🚌", 21.1, j1 + 0.065, 78.4, "i", 3.6, "#FFFFFF", null, 800, JUA);
  B(i1 - 0.04, j0 + 0.05, 0.06, 1.0, 9, INK, 56, {r:0.01, cls:"s"});
  dplane(240, 26, 0.92, hz(7), i1 + 0.02, j0 + 0.55, hz(60.5), (c, w, h, tm) => drawBus(c, w, h, tm), "j", 0.006);
  gl(i1 + 0.1, j0 + 0.55, 60.5, 24, "#FFB547", (tm, dk) => dk ? 0.35 : 0.06);
  // 정류장 표지판 기둥
  { const pi = 24.15, pj = 14.45; cylAt(pi, pj, 0.035, 0.04, 0, 84, POLE, "s", 10);
    B(pi - 0.32, pj + 0.04, 0.64, 0.05, 22, D("#3A6FD6", "#2A4C96"), 60, {r:0.04}); B(pi - 0.34, pj + 0.03, 0.68, 0.06, 1.2, WHITE, 82, {r:0.02});
    K.wtext("🚌 버스", pi, pj + 0.095, 77.5, "i", 2.8, "#FFFFFF", null, 800, JUA); K.wtext("크레용초교 앞", pi, pj + 0.095, 71.5, "i", 2.2, "#FFFFFF", null, 800, JUA);
    [["7", "#4DAA97"], ["12", "#E8A04A"], ["마을03", "#F06BA8"]].forEach(([n, col], k) => { B(pi - 0.28 + k * 0.2 - 0.06, pj + 0.09, k === 2 ? 0.2 : 0.14, 0.012, 3.4, col, 63.5, {r:0}); K.wtext(n, pi - 0.28 + k * 0.2 + (k === 2 ? 0.04 : 0.01), pj + 0.105, 65.2, "i", 1.6, "#FFFFFF", null, 800); }); }
}
function mailbox(i, j){
  const red = D("#E2403A", "#7A2C28");
  B(i - 0.18, j - 0.16, 0.36, 0.32, 30, red, 0, {r:0.06}); const cap = K.sm(myGeo(new THREE.CylinderGeometry(0.18, 0.18, 0.32, 18, 1, false, 0, PI)), red, X(i), hz(30), Z(j), null, "m"); cap.rotation.set(PI / 2, 0, PI / 2);
  B(i - 0.12, j + 0.16, 0.24, 0.01, 1.6, INK, 22, {r:0}); K.faceJ(i - 0.12, i + 0.12, j + 0.16, 8, 17, D("#FFFFFF", "#9A949C"), "m", 0.008);
  K.wtext("우편", i, j + 0.175, 12.8, "i", 2.4, red, null, 800, JUA);
}
function treeBench(i, j){
  cylAt(i, j, 0.8, 0.8, 0, 10, WOODD, "m", 28); disc(i, j, 0.84, 10, 2, WOOD, "m", 32); disc(i, j, 0.38, 12, 0.6, D("#7A5A3C", "#3A2A20"), "m", 18);
  for(let k = 0; k < 12; k++){ const a = k / 12 * PI * 2; B(i + Math.cos(a) * 0.79 - 0.03, j + Math.sin(a) * 0.79 - 0.03, 0.06, 0.06, 10, K.sh(WOODD, -0.1), 0, {r:0}); }
}
function hedge(i0, i1, j0, d){
  B(i0, j0, i1 - i0, d, 12, K.sh("plant", -0.08), 0, {r:0.12, seg:2});
  for(let i = i0 + 0.25, k = 0; i < i1 - 0.15; i += 0.45, k++){ ball(i, j0 + d / 2, 13, 0.2, K.sh("plant", (k % 3) * 0.05), "m", 10); if(k % 3 === 1) ball(i, j0 + d / 2 + 0.12, 16, 0.05, RB[k % 6], "m", 8); }
}
/* 노란 학원 차 (보호구역 안에 잠깐 선 통학 차량, 앞은 −i) */
function academyVan(i0, i1, j0, j1){
  const Y = D("#F6C93C", "#8A7228"), jm = (j0 + j1) / 2, L = i1 - i0, Wd = j1 - j0;
  B(i0, j0, L, Wd, 34, Y, 8, {r:0.14, seg:3}); B(i0 + 0.55, j0 + 0.02, L - 0.6, Wd - 0.04, 14, Y, 40, {r:0.16, seg:3});
  B(i0 + 0.5, j0 + 0.05, L - 0.5, Wd - 0.1, 2.2, D("#FFFFFF", "#8A847C"), 53.6, {r:0.1});
  { const ws = B(i0 + 0.1, j0 + 0.08, 0.6, Wd - 0.16, 15, D("#BFD8EC", "#3A4E6A"), 34, {r:0.08, cls:"glass"}); ws.rotation.z = 0.5; }
  K.faceJ(i0 + 0.75, i1 - 0.15, j1, 30, 52, D("#2A3442", "#1A2028"), "m", 0.012);
  for(let k = 0; k < 4; k++){ const a = i0 + 0.85 + k * 0.56; K.faceJ(a, a + 0.48, j1 + 0.002, 32, 50, D("#BFD8EC", "#5A7090"), "glass", 0.012); }
  K.decal(300, 56, (c, w, h, dark) => { c.fillStyle = dark ? "#8A7228" : "#F6C93C"; c.fillRect(0, 0, w, h); c.fillStyle = dark ? "#FFF3D0" : "#2A2A28";
    c.font = `800 ${h * 0.46}px 'Jua', sans-serif`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("크레용 미술학원 🖍️", w * 0.5, h * 0.4);
    c.font = `700 ${h * 0.22}px 'Jua', sans-serif`; c.fillStyle = dark ? "#FFE7A0" : "#8B5A3C"; c.fillText("어린이 통학차량 · 안전하게 모셔요", w * 0.5, h * 0.8); }, L - 1.0, hz(13), "i", i0 + 0.5 + (L - 1.0) / 2, j1, hz(20.5));
  K.faceJ(i0 + 0.04, i0 + 0.5, j1, 12, 26, D("#2A3442", "#1A2028"), "m", 0.012);
  K.faceI(i1, j0 + 0.15, j1 - 0.15, 32, 50, D("#BFD8EC", "#5A7090"), "glass", 0.012);
  K.decal(110, 40, (c, w, h) => { c.fillStyle = "#FFFFFF"; c.fillRect(0, 0, w, h); c.strokeStyle = "#E2403A"; c.lineWidth = 4; c.strokeRect(2, 2, w - 4, h - 4);
    c.fillStyle = "#E2403A"; c.font = "800 16px 'Jua', sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("어린이 보호차량", w / 2, h / 2 + 1); }, 0.62, hz(7), "j", i1, jm, hz(24));
  [[j0 + 0.12, "#FF7A5A"], [j1 - 0.12, "#FF7A5A"]].forEach(([j, c]) => { K.faceI(i1, j - 0.08, j + 0.08, 14, 22, c, "glow", 0.014); K.faceI(i0, j - 0.09, j + 0.09, 16, 22, "#FFF6DA", "glow", 0.014); });
  B(i0 - 0.04, j0 + 0.05, 0.06, Wd - 0.1, 5, D("#5A5D63", "#2A2C2F"), 8, {r:0.02, cls:"s"}); B(i1 - 0.02, j0 + 0.05, 0.06, Wd - 0.1, 5, D("#5A5D63", "#2A2C2F"), 8, {r:0.02, cls:"s"});
  [i0 + 0.6, i1 - 0.65].forEach(i => [j0 + 0.02, j1 - 0.02].forEach(j => { const w = K.sm(K.cyl(0.2, 0.2, 0.14, 20), INK, X(i), 0.2, Z(j), null, "s"); w.rotation.x = PI / 2;
    const h = K.sm(K.cyl(0.09, 0.09, 0.15, 14), STEEL, X(i), 0.2, Z(j), null, "s"); h.rotation.x = PI / 2; }));
  [i0 + 0.95, i1 - 0.4].forEach(i => { B(i - 0.08, jm - 0.08, 0.16, 0.16, 2.4, D("#E2403A", "#8A2C28"), 56.2, {r:0.04}); });
  B(i0 + 0.82, j1, 0.16, 0.03, 2, D("#8A8E94", "#4A4E52"), 30, {r:0.01, cls:"s"});   // 문 손잡이
}
/* 아이 자전거 거치대 (앞 보도 산울타리 앞) */
function bikeRack(i0, i1, j){
  for(let i = i0 + 0.2; i < i1; i += 0.55){ rod([i, j, 0], [i, j, 16], 0.016, STEEL); rod([i + 0.3, j, 0], [i + 0.3, j, 16], 0.016, STEEL); rod([i, j, 16], [i + 0.3, j, 16], 0.016, STEEL); }
  B(i0, j - 0.05, i1 - i0, 0.1, 0.6, D("#C9C0B4", "#4A4642"), 0, {r:0.02});
  [[i0 + 0.52, PINK, true], [i0 + 1.62, LEAF, false]].forEach(([i, col, basket]) => {
    const jr = j - 0.42, jf = j + 0.38, r = 0.17, hub = r * 31.1;
    [jr, jf].forEach(jj => { const w = K.sm(myGeo(new THREE.TorusGeometry(r, 0.025, 8, 22)), INK, X(i), r, Z(jj), null, "s"); w.rotation.y = PI / 2; disc(i, jj, 0.035, hub - 0.6, 1.2, STEEL, "s", 8).rotation.z = PI / 2; });
    rod([i, jr, hub], [i, j - 0.05, 15], 0.022, col, "m"); rod([i, j - 0.05, 15], [i, jf - 0.08, 17], 0.022, col, "m"); rod([i, jf, hub], [i, jf - 0.08, 22], 0.02, col, "m");
    rod([i, jr, hub], [i, j - 0.02, hub - 0.5], 0.018, col, "m"); rod([i, j - 0.02, hub - 0.5], [i, j - 0.05, 15], 0.018, col, "m");
    rod([i, j - 0.1, 15], [i, j - 0.14, 19], 0.014, STEEL); B(i - 0.06, j - 0.24, 0.12, 0.2, 1.6, INK, 19, {r:0.04});
    rod([i - 0.18, jf - 0.08, 22], [i + 0.18, jf - 0.08, 22], 0.014, STEEL); [-0.18, 0.18].forEach(d => ball(i + d, jf - 0.08, 22, 0.025, col, "m", 6));
    if(basket){ B(i - 0.12, jf - 0.06, 0.24, 0.18, 5, D("#FFFFFF", "#9A949C"), 18, {r:0.03}); ball(i, jf + 0.03, 23.5, 0.06, "#F6E39A", "m", 8); }
  });
}
function streets(){
  // 보행로 화단 (길과 나눔, 횡단보도·사이 길은 비움) · 연석
  planter(8.6, 12.4, AJ - 0.55, 0.45); planter(15.6, 20.6, AJ - 0.55, 0.45); planter(22.0, 27.7, AJ - 0.55, 0.45);
  const curb = D("#D8D0C4", "#4A4642");
  B(SCH.i1 + 0.15, AJ - 0.08, 28.8 - SCH.i1 - 0.15, 0.1, 3, curb, 0, {r:0.01});
  [[-0.6, CW[0][0]], [CW[0][1], CW[1][0]], [CW[1][1], 28.8]].forEach(([a, b]) => B(a, RJ - 0.04, b - a, 0.12, 3, curb, 0, {r:0.01}));
  // 가로등 (앞 보도 셋 · 보행로 화단 셋)
  [[2.4, 14.4], [16.4, 14.4], [26.6, 14.4], [8.9, AJ - 0.33], [17.6, AJ - 0.33], [24.8, AJ - 0.33]].forEach(([i, j]) => lamp(i, j));
  // 어린이 보호구역 표지판 (노란 세모 + 30)
  { const pi = 12.55, pj = RJ + 0.3; cylAt(pi, pj, 0.03, 0.035, 0, 70, POLE, "s", 10);
    const tri = new THREE.Shape(); tri.moveTo(-0.26, 0); tri.lineTo(0.26, 0); tri.lineTo(0, 0.44); tri.closePath();
    const tg = myGeo(new THREE.ExtrudeGeometry(tri, {depth:0.03, bevelEnabled:false})); K.sm(tg, D("#F6D24A", "#8A7A30"), X(pi), hz(52), Z(pj) + 0.03, null, "m");
    K.wtext("🚸", pi, pj + 0.06, 56.4, "i", 3.6, INK, null, 700);
    B(pi - 0.26, pj + 0.03, 0.52, 0.03, 9, D("#FFFFFF", "#9A949C"), 41, {r:0.01}); K.wtext("어린이 보호구역", pi, pj + 0.075, 45.4, "i", 1.7, D("#D23A33", "#E87A6A"), null, 900, JUA);
    disc(pi, pj + 0.02, 0.2, 0, 0.6, INK, "s", 12);
    const c30 = K.sm(K.cyl(0.18, 0.18, 0.025, 24), D("#D23A33", "#8A3A34"), X(pi), hz(33), Z(pj) + 0.04, null, "m"); c30.rotation.x = PI / 2;
    const c31 = K.sm(K.cyl(0.14, 0.14, 0.03, 24), WHITE, X(pi), hz(33), Z(pj) + 0.045, null, "m"); c31.rotation.x = PI / 2;
    K.wtext("30", pi, pj + 0.06, 33, "i", 3.2, INK, null, 900, K.SIGN); }
  // 앞 보도: 붕어빵 마차 · 나무 벤치 · 우체통 · 버스정류장 · 은행나무 · 아래 산울타리
  bungeoCart();
  ginkgo(2.4, 17.6, 1.05); treeBench(2.4, 17.6);
  mailbox(8.6, 14.62);
  busStop();
  academyVan(24.8, 28.0, 10.3, 11.6);
  bikeRack(4.2, 6.1, 19.05);
  ginkgo(11.9, 18.95, 0.95); ginkgo(16.9, 18.3, 1.0); ginkgo(26.4, 17.6, 1.1);
  { const ci = 26.4, cj = 17.6; B(ci - 1.1, cj - 0.7, 2.2, 1.4, 5, D("#F3E9E4", "#4A403C"), 0, {r:0.2, seg:2}); B(ci - 1.02, cj - 0.62, 2.04, 1.24, 0.6, D("#7A5A3C", "#3A2C22"), 5, {r:0.18});
    for(let k = 0; k < 14; k++){ const a = k / 14 * PI * 2, r = 0.68 + (k % 2) * 0.18; if(Math.abs(Math.sin(a)) < 0.15 && Math.cos(a) < 0) continue; flowerStem(ci + Math.cos(a) * r * 1.25, cj + Math.sin(a) * r * 0.72, RB[k % 6], 9 + (k % 3) * 2.5); } }
  hedge(-0.5, 12.85, 19.78, 0.42); hedge(15.15, 28.7, 19.78, 0.42); hedge(-0.5, -0.08, RJ + 0.4, 19.78 - RJ - 0.4);
  hedge(28.32, 28.72, RJ + 0.4, 19.78 - RJ - 0.4); hedge(28.32, 28.72, SJ + 0.4, AJ - SJ - 1.0);
  [[12.6, 19.62], [15.4, 19.62]].forEach(([i, j]) => flowerPot(i, j, "#F4A7B9", 0.8, WHITE));
  // 분필 몇 개 (사방치기 옆)
  [["#F4A7B9", 8.85, 18.0], ["#A9CBEA", 9.0, 18.08], ["#F6E39A", 9.12, 17.98]].forEach(([col, i, j], k) => { const c = K.sm(K.cyl(0.02, 0.02, 0.12, 8), col, X(i), 0.02, Z(j), null, "m"); c.rotation.set(0, k * 0.8, PI / 2); });
  // 디오라마 받침 (앞 · 오른쪽 단면)
  const [a0, b0, a1, b1] = EXT, base = 16;
  K.sm(K.rbox(a1 - a0 - 0.02, hz(base), b1 - b0 - 0.02, 0), D("#8E8676", "#1C1A17"), X((a0 + a1) / 2), -hz(base) / 2 - 0.003, Z((b0 + b1) / 2));
  B(a0, b1, a1 - a0, 0.012, base, D("#C9C0B4", "#2A2724"), -base, {r:0}); B(a1, b0, 0.012, b1 - b0, base, D("#B9B0A4", "#24211E"), -base, {r:0});
  B(a0, b1, a1 - a0, 0.016, 4, D("#E4DDD3", "#383430"), -4, {r:0}); B(a1, AJ, 0.016, RJ - AJ, 4, D("#DE8A7E", "#4E3230"), -4, {r:0});
}

/* =================================================================== 움직이는 것 */
function buildDyn(){
  const R = K.R, scene = R.scene;
  // 뽑기 손잡이 (두 번째 기계)
  { const M = Merge(); const g = new THREE.CylinderGeometry(0.085, 0.085, 0.035, 18); g.rotateX(PI / 2); M.add(g, STEEL);
    M.add(new THREE.BoxGeometry(0.15, 0.032, 0.03), D("#FFFFFF", "#9A949C"), 0, 0, 0.03); M.add(new THREE.SphereGeometry(0.028, 8, 6), PINK, 0.075, 0, 0.045);
    W.crank = dynMesh(M.geo()); W.crank.position.set(X(GACHA.ci), hz(6.4), Z(GACHA.j) + 0.018); }
  // 학교 종 (위 가로대에 매달림, 흔들림)
  { const M = Merge(), br = D("#E8C36A", "#B8964A");
    M.add(new THREE.CylinderGeometry(0.008, 0.008, hz(4), 6), INK, 0, -hz(2), 0);
    M.add(new THREE.SphereGeometry(0.07, 14, 8, 0, PI * 2, 0, PI / 2), br, 0, -hz(4) - 0.05, 0);
    M.add(new THREE.CylinderGeometry(0.07, 0.12, 0.16, 16, 1, true), br, 0, -hz(4) - 0.13, 0);
    M.add(new THREE.TorusGeometry(0.12, 0.012, 6, 18), br, 0, -hz(4) - 0.21, 0, PI / 2);
    M.add(new THREE.SphereGeometry(0.03, 8, 6), INK, 0, -hz(4) - 0.22, 0);
    M.add(new THREE.CylinderGeometry(0.007, 0.007, hz(16), 5), D("#C9A27A", "#6B4E38"), 0, -hz(4) - 0.22 - hz(8), 0);
    M.add(new THREE.SphereGeometry(0.025, 8, 6), CORAL, 0, -hz(4) - 0.22 - hz(16), 0);
    W.bell = dynMesh(M.geo()); W.bell.position.set(X(1.9), hz(48), Z(9.0)); }
  // 학교 시계 바늘 (지금 시각)
  { const mk = (len, wd, col, dz) => { const M = Merge(); M.add(new THREE.BoxGeometry(wd, len, 0.012), col, 0, len / 2 - 0.04, 0); const m = dynMesh(M.geo()); m.position.set(X(4.0), hz(132), Z(SCH.bj) + 0.215 + dz); m.castShadow = false; return m; };
    W.hh = mk(0.22, 0.04, INK, 0); W.mh = mk(0.32, 0.026, D("#2A2A28", "#2A2A28"), 0.008); W.sh = mk(0.34, 0.01, D("#E2403A", "#E2403A"), 0.016); }
  // 빛 (밤)
  [[11.1, 0.12, 95, "#FFD6E6"], [17.7, 0.12, 95, "#FFC8B0"], [24.7, 0.12, 96, "#C8FFEF"]].forEach(([i, j, z, c]) => gl(i, j, z, 120, c, (tm, dk) => dk ? 0.32 : 0));
  gl(23.6, 0.8, 30, 90, "#D8F2FF", (tm, dk) => dk ? 0.3 : 0.06);
  gl(15.2, 4.75, 30, 50, "#FF9A6A", (tm, dk) => dk ? 0.35 : 0.08);
  [[3.0, 2.7, 30], [5.4, 2.7, 70]].forEach(([i, j, z]) => gl(i, j, z, 40, "#FFE2A8", (tm, dk) => dk ? 0.25 : 0));
  // 그림판 · 빛 · 김·캡슐 (인스턴스)
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
  W.fxN = 28; W.fm = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 9), K.cutaway(new THREE.MeshStandardMaterial({roughness:0.6, transparent:true, opacity:0.62, depthWrite:false})), W.fxN); W.fm.frustumCulled = false; W.fm.renderOrder = 2; scene.add(W.fm);
  W.cap = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 9), K.cutaway(new THREE.MeshStandardMaterial({roughness:0.35, color:0xF4A7B9}))); W.cap.visible = false; W.cap.castShadow = true; scene.add(W.cap);
}
const GACHA = {ci:9.65, j:SJ + 0.08 + 0.5};

/* ---------- 매 프레임 ---------- */
const m4 = new THREE.Matrix4(), qn = new THREE.Quaternion(), v3 = new THREE.Vector3(), sc3 = new THREE.Vector3(), col = new THREE.Color(), ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
function fxSet(k, x, y, z, s, c){ if(k >= W.fxN) return; if(s <= 0){ W.fm.setMatrixAt(k, ZERO); return; } m4.compose(v3.set(x, y, z), qn.identity(), sc3.set(s, s * 0.9, s)); W.fm.setMatrixAt(k, m4); W.fm.setColorAt(k, col.set(c)); }
const STEAM = [[15.15, 4.75, 29, 3, 0.07], [16.65, 4.75, 30, 4, 0.08], [6.65, 15.7, 30, 3, 0.06], [26.7, 2.6, 37, 2, 0.05]];
function animate(tm, dt){
  const dk = !!K.R.dark, red = !!K.reduce;
  let f = 0;
  STEAM.forEach(([i, j, z, n, s], q) => { for(let k = 0; k < n; k++){ const ph = (tm * 0.00045 + k / n + q * 0.13) % 1, r = (s * 0.6 + s * 1.3 * ph) * (1 - ph * ph);
    fxSet(f++, X(i + (red ? 0 : Math.sin(ph * 6 + k + q) * 0.09)), hz(z + 26 * ph), Z(j + (k % 2 ? 0.08 : -0.06)), red ? 0 : r, dk ? "#C8C4D8" : "#FFFFFF"); } });
  while(f < W.fxN) fxSet(f++, 0, 0, 0, 0);
  W.fm.instanceMatrix.needsUpdate = true; if(W.fm.instanceColor) W.fm.instanceColor.needsUpdate = true;
  // 뽑기 손잡이 · 캡슐 (pop 하면 1.6초 동안 굴러 나와 멈춤)
  if(W.crank){ if(W.spinT){ const u = (tm - W.spinT) / 1400; if(u < 1) W.crank.rotation.z = -(W.spin0 + Math.sin(u * PI / 2) * PI * 2); else { W.crank.rotation.z = -(W.spin0 + PI * 2); W.spinT = 0; } } }
  if(W.popT){ const u = (tm - W.popT) / 1000; if(u > 3.2){ W.cap.visible = false; W.popT = 0; }
    else { W.cap.visible = true; const r = Math.min(1, u / 0.6), x = X(GACHA.ci + 0.12), z0 = Z(GACHA.j) + 0.02;
      W.cap.position.set(x, 0.06 + Math.max(0, 0.06 * (1 - r)) + (r < 1 ? Math.abs(Math.sin(r * PI * 2)) * 0.05 : 0), z0 + 0.32 * r); W.cap.rotation.x = r * 6; } }
  // 학교 종 흔들기
  if(W.bell){ const u = W.bellT ? (tm - W.bellT) / 1000 : 9; W.bell.rotation.x = u < 2.4 && !red ? Math.sin(u * 13) * 0.55 * (1 - u / 2.4) : 0; if(u >= 2.4) W.bellT = 0; }
  // 시계 바늘 (지금 시각)
  if(W.mh){ const d = new Date(), s = d.getSeconds() + d.getMilliseconds() / 1000, m = d.getMinutes() + s / 60, h = d.getHours() % 12 + m / 60;
    W.sh.rotation.z = -s / 60 * PI * 2; W.mh.rotation.z = -m / 60 * PI * 2; W.hh.rotation.z = -h / 12 * PI * 2; }
  // 빛
  const cam = K.R.camera;
  W.glows.forEach((g, k) => { const a = g.a(tm, dk); if(!(a > 0)){ W.gm.setMatrixAt(k, ZERO); return; }
    col.copy(g.c); m4.compose(g.p, cam.quaternion, sc3.set(g.s, g.s, 1)); W.gm.setMatrixAt(k, m4); W.gm.setColorAt(k, col.multiplyScalar(Math.min(1, a))); });
  W.gm.instanceMatrix.needsUpdate = true; if(W.gm.instanceColor) W.gm.instanceColor.needsUpdate = true;
  if(W.dcv && (tm - W.dLast > 66 || W.dLast < 0)){ W.dLast = tm; const c = W.dctx; c.clearRect(0, 0, DW, DH);
    W.dyn.forEach(d => { c.save(); c.beginPath(); c.rect(d.r.x, d.r.y, d.r.w, d.r.h); c.clip(); c.translate(d.r.x, d.r.y); d.draw(c, d.r.w, d.r.h, tm); c.restore(); });
    W.dtex.needsUpdate = true; }
}

/* ---------- 유나 모드에 넘길 것 (yuna_game.js 형식: h = 보는 쪽 (0 = +j, PI/2 = +i, PI = −j, −PI/2 = −i), H = 앉는 면 높이, k = 대사 종류) ---------- */
const H = px => px / 31.1;
const clk = () => K && K.clock ? K.clock() : performance.now();
export const TOWN = {
  name:"학교 앞 골목",
  gate:[14, 19.3], spawnGate:[14, 18.5, PI],   // 아래 가운데 길 → 로비 (로비에서 오면 spawnGate)
  seats:[
    {a:[19.75, 1.3], h:PI / 2, H:H(13.2), k:"bunsik"}, {a:[20.55, 0.5], h:0, H:H(13.2), k:"bunsik"},
    {a:[19.75, 3.1], h:PI / 2, H:H(13.2), k:"bunsik"}, {a:[20.55, 3.9], h:PI, H:H(13.2), k:"bunsik"},
    {a:[19.15, 7.1], h:PI / 2, H:H(13.2), k:"bunsik"}, {a:[20.65, 7.1], h:-PI / 2, H:H(13.2), k:"bunsik"},
    {a:[25.32, 7.6], h:PI / 2, H:H(16.2), k:"cvsTable"}, {a:[26.68, 7.6], h:-PI / 2, H:H(16.2), k:"cvsTable"},
    {a:[19.6, 15.55], b:[22.0, 15.55], h:PI, H:H(14), k:"bus"},
    {a:[2.4, 18.45], h:0, H:H(12), k:"treebench"}, {a:[3.25, 17.6], h:PI / 2, H:H(12), k:"treebench"}, {a:[1.55, 17.6], h:-PI / 2, H:H(12), k:"treebench"}],
  sitLines:{
    bunsik:["떡볶이 국물에 튀김 찍어 먹자 😋", "이모, 단무지 더 주세요!", "매운데 자꾸 들어가 🔥", "어묵 국물 한 컵 더~ 🍢"],
    cvsTable:["컵라면엔 삼각김밥이지 🍙", "바나나우유 원샷! 🍌", "파라솔 밑 시원하다~"],
    bus:["7번 버스 언제 와요? 🚌", "곧 도착이래! ⏱️", "학원 가기 싫다~ 😮‍💨"],
    treebench:["은행잎이 노랗게 물들었어 🍂", "나무 밑 벤치 최고 💛", "친구 기다리는 중~"]},
  /* 할 일 자리: at = 유나가 서는 곳, h = 보는 쪽, r = 닿는 반경 */
  use:[
    {at:[9.65, 6.68], k:"gacha", h:PI, r:0.5},        // 뽑기 기계 (두 번째, 파란 기계) — 손잡이 TOWN.gacha.set/pop
    {at:[9.3, 3.95], k:"slime", h:-PI / 2, r:0.5},    // 슬라임 · 스티커 진열대 (왼벽)
    {at:[11.0, 3.95], k:"candy", h:PI, r:0.5},        // 불량식품 계단 진열대
    {at:[12.61, 6.68], k:"arcade", h:PI, r:0.45},     // 문방구 앞 오락기
    {at:[15.15, 5.85], k:"tteok", h:PI, r:0.5},       // 분식집 앞 조리대: 떡볶이 판
    {at:[16.65, 5.85], k:"fishcake", h:PI, r:0.5},    // 어묵 통
    {at:[7.75, 15.95], k:"bungeo", h:-PI / 2, r:0.5}, // 붕어빵 포장마차 (+i 쪽에서 −i를 봄, 할머니와 마주 봄)
    {at:[25.8, 2.65], k:"store", h:PI / 2, r:0.5},    // 편의점 계산대 (알바와 마주 봄)
    {at:[23.6, 1.45], k:"fridge", h:PI, r:0.5},       // 편의점 음료 냉장고
    {at:[22.7, 6.85], k:"icecream", h:PI, r:0.5},     // 아이스크림 냉동고 (위에 고양이 치즈)
    {at:[1.9, 8.35], k:"bell", h:0, r:0.5},           // 학교 종 (정문 안 왼쪽) — TOWN.bell.ring()
    {at:[6.6, 4.75], k:"pullup", h:0, r:0.45},         // 철봉 (가운데 봉 바로 앞, 매달릴 땐 playSet({at:[6.6,4.5,0]}))
    {at:[2.45, 6.5], k:"goal", h:-PI / 2, r:0.5},     // 축구 골대에 슛
    {at:[1.7, 3.4], k:"podium", h:0, r:0.5},          // 구령대 위 (마이크 앞)
    {at:[8.55, 17.11], k:"hopscotch", h:PI / 2, r:0.5}],   // 사방치기 (1 → 하늘)
  /* 움직이는 소품 */
  gacha:{ set(t){ if(W && W.crank){ W.spinT = 0; W.crank.rotation.z = -t * PI * 2; } },   // t = 0~1 한 바퀴
    spin(){ if(W && W.crank){ W.spin0 = -W.crank.rotation.z; W.spinT = clk(); } },        // 저절로 한 바퀴 (1.4초)
    pop(color){ if(!W || !W.cap) return; W.cap.material.color.set(color || RB[(Math.random() * 6) | 0]); W.popT = clk(); } },   // 캡슐이 나와 굴러 멈춤 (3.2초 뒤 사라짐)
  bell:{ ring(){ if(W) W.bellT = clk(); } },   // 2.4초 흔들림
  /* 유나 게임이 세우는 동네 사람 자리 [i, j, 보는 쪽] */
  npc:{
    aunt:[18.6, 4.75, -0.35],    // 분식집 이모: 조리대 오른쪽 끝 (가게 안, 길 쪽을 봄)
    gran:[13.1, 0.6, 0],         // 문방구 할머니: 유리 계산대 뒤
    teach:[3.05, 8.1, -0.9]},    // 선생님: 학교 종 옆 운동장
};

/* ---------- 구역 정의 ---------- */
const def = {
  id:"town",
  zones:{
    t_school:{name:"크레용초등학교", color:"#72C4AE", rect:[0, 0, SCH.i1, AJ], label:[4.0, 0, "top"]},
    t_mun:{name:"크레용문구", color:"#E8B5C8", rect:[MUN[0], 0, MUN[1], SJ + 1.2], label:[11.1, 0, "top"]},
    t_bun:{name:"크레용분식", color:"#E87A6A", rect:[BUN[0], 0, BUN[1], SJ + 1.2], label:[17.7, 0, "top"]},
    t_cvs:{name:"CREYONG 24", color:"#4DAA97", rect:[CVS[0], 0, CVS[1], SJ + 1.2], label:[24.7, 0, "top"]},
    t_street:{name:"등굣길 · 정류장", color:"#E8A04A", rect:[0, AJ, 28, 20], label:[14, 20, "bottom"]}},
  outline:[[EXT[0], EXT[1]], [EXT[2], EXT[1]], [EXT[2], EXT[3]], [EXT[0], EXT[3]]],
  ext:EXT,
  top:3.9,
  allPts:V => [V(-0.6, 0, -0.6), V(28.8, 0, -0.6), V(28.8, 0, 20.6), V(-0.6, 0, 20.6), V(-0.25, 3.9, -0.25), V(28, 3.6, -0.25), V(0, 3.9, 2.6), V(4.0, 4.9, 1.4)],
  lamps:[[11.1, 2.6, 2.6], [17.7, 2.6, 2.6], [24.7, 2.6, 2.6], [6.6, 15.9, 2.0], [21.0, 15.2, 2.2]],
  glow:{color:0xFFB08A, at:[15.6, 4.8, 1.2]},
  eggs:[],
  people:[],
  paintFloor(c, dark){ paintTown(c, dark); },
  build(KIT){
    K = KIT; LG.length = 0;
    W = {recolor:[], dyn:[], dgeo:[], dA:{x:2, y:2, row:0}, dLast:-1, glows:[], extraBoxes:[], spinT:0, spin0:0, popT:0, bellT:0};
    const egg = (id, at, emo, lines, say) => ({id, at, emo, lines, say});
    def.eggs = [
      egg("t_clock", [4.0, SCH.bj + 0.2, 132], ["🕒", "🏫"], ["학교 시계"], () => { const d = new Date(), h = d.getHours(), m = d.getMinutes();
        return `지금 ${h % 12 || 12}시 ${m}분! ` + (h >= 13 && h < 18 ? "학원 갈 시간 🏃" : h < 9 ? "지각하면 안 돼 ⏰" : h >= 18 ? "집에 갈 시간 🌙" : "수업 시간이야 쉿 🤫"); }),
      egg("t_podium", [1.7, SCH.bj + 0.35, 42], ["🎤", "📢"], ["교장 선생님 말씀이 있겠습니다~ 🎤", "아아, 마이크 테스트 📢"]),
      egg("t_arcade", [12.61, SJ + 0.4, 46], ["🕹️", "👾"], ["100원 넣고 한 판 더! 🕹️", "최고 점수는 유나 ⭐"]),
      egg("t_mail", [8.6, 14.62, 36], ["💌", "📮"], ["할머니께 편지 보내야지 💌", "우체통은 빨간색 📮"]),
      egg("t_cat", [22.95, SJ + 0.5, 30], ["🐱", "💤"], ["편의점 고양이 치즈 😺", "냐옹~ 쓰다듬어 줄래?", "쉿, 치즈 낮잠 중 💤"]),
      egg("t_bus", [24.15, 14.5, 84], ["🚌", "⏱️"], ["7번 버스 곧 도착 🚌", "마을버스 타고 할머니 댁 가자"]),
      egg("t_ginkgo", [16.9, 18.3, 66], ["🍂", "💛"], ["은행잎이 노래졌어 💛", "은행 냄새는 쉿! 🤭"]),
      egg("t_hop", [10.9, 17.1, 8], ["🖍️", "🦘"], ["사방치기 하자! 1, 2, 3 🦘", "하늘까지 깽깽이 성공 ✨"]),
      egg("t_menu", [19.85, 0.1, 64], ["📋", "🍢"], ["컵떡볶이 2,000원! 🍢", "오늘은 튀김 세트 😋"]),
      egg("t_ball", [2.0, 6.6, 8], ["⚽", "🥅"], ["슛~ 골인! ⚽", "운동장 한 바퀴 달리기 🏃"]),
      egg("t_guard", [6.95, 9.55, 50], ["👴", "🏫"], ["배움터 지킴이 할아버지 안녕하세요! 👋", "길 건널 땐 손 들고 🙋"])];
    /* 이 구역 사람 (말 걸기만). 분식집 이모 · 문방구 할머니 · 선생님은 유나 게임이 TOWN.npc 자리에 직접 세움 (aunt · gran · teach) */
    def.people = [
      {id:"tw_clerk", name:"편의점 알바", role:"CREYONG 24 학교앞점", task:"어서 오세요~ CREYONG 24입니다 🏪", hex:"#4DAA97", look:{skin:"#EFCBB0", hair:"#2A1E18", style:"short", shirt:"#72C4AE", pants:"#2B2D30"}, at:[27.4, 2.65], face:-PI / 2},
      {id:"tw_bung", name:"붕어빵 아저씨", role:"붕어빵 포장마차", task:"따끈한 붕어빵 사 가~ 🐟", hex:"#E8A04A", look:{skin:"#E5BC98", hair:"#3A3330", style:"short", shirt:"#E8A04A", pants:"#5A4E46", hat:"bucket", hatC:"#C8B4D0", scarf:"#E87A6A"}, at:[5.7, 15.95], face:PI / 2},
      {id:"tw_guard", name:"지킴이 할아버지", role:"배움터 지킴이", task:"차 조심하고 손 들고 건너라~ 🚸", hex:"#4DAA97", look:{skin:"#E5BC98", hair:"#D6D0C8", style:"short", shirt:"#F6D24A", pants:"#3E4C60", badge:true, hat:"bucket", hatC:"#4DAA97"}, at:[5.95, 9.35], face:0}];
    W.extraBoxes.push(...[[5.7, 15.95], [5.95, 9.35], [27.4, 2.65]].map(([i, j]) => [X(i - 0.2), Z(j - 0.2), X(i + 0.2), Z(j + 0.2), 0.08, 1.0]));   // 사람 자리는 막기
    school(); munbanggu(); bunsik(); cvs(); streets();
    buildDyn();
  },
  init(KIT){
    LG.forEach(g => g.dispose()); LG.length = 0;
    // 간판 글씨(Jua)가 늦게 받아지면 다시 칠함
    try { document.fonts?.load("40px Jua").then(() => { const R = KIT.R; if(!R || R.F !== def) return; R.atlas.paint(R.dark);
      const c = R.flCv.getContext("2d"), [a, b] = R.ext, FS = KIT.FS; c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, R.flCv.width, R.flCv.height);
      c.setTransform(FS, 0, 0, FS, -a * FS, -b * FS); paintTown(c, !!R.dark); c.setTransform(1, 0, 0, 1, 0, 0); R.flTex.needsUpdate = true; }).catch(() => {}); } catch(e){}
  },
  tick(KIT, now, t, dt){
    if(W.extraBoxes.length && KIT.R && KIT.R.boxes && !W.boxDone){ W.boxDone = true;   // 밖에 선 사람 막기 상자를 엔진 목록에 더함
      KIT.R.boxes = Float32Array.from([...KIT.R.boxes, ...W.extraBoxes.flat()]); KIT.R.pg = null; }
    animate(KIT.clock ? KIT.clock() : now, dt); },
  theme(KIT, dark){ if(!W) return; W.recolor.forEach(m => { const u = m.geometry.userData, a = m.geometry.attributes.color; if(u && u.L && a){ a.array.set(dark ? u.D : u.L); a.needsUpdate = true; } }); },
};
export default def;
