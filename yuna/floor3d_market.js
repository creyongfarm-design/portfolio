/* 크레용 전통시장 3D (2026-11-24 감독님 "큰 마을이면 좋겠네": 유나 모드 동네 한 곳)
   유나네 동네 전통시장 한 블록 (i 0~30, j 0~22). 칸 1 ≈ 1.28 m, 유나 키 ≈ 1칸, 높이는 2.5D px (÷31.1)
   - 가운데: 지붕 덮인 아케이드 (i 13.45~16.55, 반투명 둥근 지붕 띠 + 아치 + 초롱 줄) 양옆에 가게 다섯 칸씩
       왼줄 (앞이 +i): 과일가게 · 떡집 · 반찬가게 | 생선가게 · 호떡·어묵 노점
       오른줄 (앞이 −i): 잡곡·건어물 · 순대·만두 · 만물 잡화 | 전집 · 꽈배기·도넛  (뒷벽 바깥은 광장 쪽 벽화)
   - 정문 (아래 j 19.85): "크레용 전통시장" 기와 지붕 문. 나가는 곳 (15, 21.3)
   - 왼쪽 방앗간 골목 (j 10~12.4) → 옆 출구 (0.7, 11): 북쪽 2층 상가(옥상 장독대·물탱크) 1층에 방앗간 · 채소 할머니 좌판 · 꽃집, 남쪽에 장난감 좌판
   - 오른쪽 광장: 뻥튀기 기계(뻥!) · 군고구마 드럼통 · 플라스틱 탁자 먹자리 · 전구 줄
   - 왼쪽 아래 쉼터: 배추 실은 1톤 트럭 · 벤치 · 시장 고양이
   사람: 할머니·떡집·생선·호떡 이모는 유나 모드(yuna_game.js)가 npc 자리에 세움. 나머지 사장님은 움직이지 않는 인형.
   깜빡임 방지: 같은 쪽을 보는 면이 같은 자리에 겹치지 않게, 바닥에 붙는 것은 그림(paintFloor)으로
   핑크 #E8B5C8 · 라일락 #C8B4D0 · 새싹 #4DAA97 · 잎 #72C4AE · 앰버 #E8A04A · 페이퍼 #FAF7F2 */
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const PI = Math.PI;
const LF = 13.5, RF = 16.5, LB0 = 10.0, RB1 = 20.0;   // 왼줄 가게 앞선 i 13.5 (뒤 10.0) · 오른줄 앞선 16.5 (뒤 20.0)
const WK0 = 13.45, WK1 = 16.55, WC = 15;               // 아케이드 기둥 줄 · 가운데
const ROWJ = [[1.0, 4.0], [4.2, 7.2], [7.4, 10.0], [12.4, 15.4], [15.6, 18.8]];
const XJ0 = 10.0, XJ1 = 12.4;                          // 가로 골목 (옆 출구 ~ 광장)
const GJ = 19.85;                                      // 정문 j
const NWI = 9.8, NWJ = 6.9, NWH = 132;                 // 북서 2층 상가 (i 0~9.8, j 0~6.9)
const SJ = 8.5;                                        // 골목 북쪽 가게 앞선
const FJ = 0.9, FH = 100;                              // 뒤쪽 상가 앞면 j · 높이
const ARC = 86, ARR = 1.55;                            // 아치 시작 높이(px) · 반지름
const POP_AT = 3.0;                                    // 뻥튀기: set(t) 시작 후 몇 초에 뻥!
const RB = ["#F4A7B9", "#F9C99B", "#F6E39A", "#A8DCC8", "#A9CBEA", "#C8B4D0"];
const rnd = k => { const v = Math.sin(k * 12.9898) * 43758.5453; return v - Math.floor(v); };
const JUA = `"Jua", "IBM Plex Sans KR", system-ui, sans-serif`, EMOF = `"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;

let K = null, W = null;
const X = i => K.X(i), Z = j => K.Z(j), hz = p => K.hz(p);
const D = (l, d) => [l, d];
const B = (i, j, w, d, h, col, z0 = 0, o = {}) => K.B(i, j, w, d, h, col, z0, o);
const PINK = D("#E8B5C8", "#7A5866"), PINK2 = D("#F4D3DF", "#6A4E5A"), LILAC = D("#C8B4D0", "#5E4E68"), LILAC2 = D("#E2D6EA", "#4E4458"),
  SPROUT = D("#4DAA97", "#2F6E62"), LEAF = D("#72C4AE", "#3E7A6C"), MINT2 = D("#CDEBE2", "#3E5A54"), AMBER = D("#E8A04A", "#9A6A30"), AMBER2 = D("#F6D29A", "#7A6040"),
  PAPER = D("#FAF7F2", "#3A3632"), WHITE = D("#FFFFFF", "#8A847C"), CREAM = D("#FFF3DC", "#6A5E4A"), WOOD = D("#D9B98F", "#6B5440"), WOODD = D("#A98258", "#4E3C2C"),
  METAL = D("#C9CDD2", "#6A6E74"), STEEL = D("#9AA0A8", "#4E5258"), SKY = D("#A9CBEA", "#4A6280"), GOLD = D("#E8C36A", "#B8964A"), INK = "#2A2A28",
  CAPC = D("#FFFFFF", "#6A625C"), RED = D("#E06A55", "#8A4438"), BOARD = D("#F3E9DC", "#4A423A");
const LG = [];
const myGeo = g => { LG.push(g); return g; };
function rod(a, b, r, col, cls = "s", seg = 8){
  const A = new THREE.Vector3(X(a[0]), hz(a[2]), Z(a[1])), C = new THREE.Vector3(X(b[0]), hz(b[2]), Z(b[1])), len = A.distanceTo(C); if(len < 1e-4) return;
  const o = K.sm(K.cyl(r, r, len, seg), col, (A.x + C.x) / 2, (A.y + C.y) / 2, (A.z + C.z) / 2, null, cls); o.lookAt(C); o.rotateX(PI / 2); return o;
}
const ball = (i, j, zp, r, col, cls = "m", seg = 8) => K.sm(K.sph(r, seg, Math.max(5, seg * 0.75 | 0)), col, X(i), hz(zp), Z(j), null, cls);
const disc = (i, j, r, zp, hp, col, cls = "m", seg = 20) => { const H = Math.max(0.006, hz(hp)); return K.sm(K.cyl(r, r, H, seg), col, X(i), hz(zp) + H / 2, Z(j), null, cls); };
const tub = (i, j, r0, r1, zp, hp, col, cls = "m", seg = 16) => { const H = Math.max(0.006, hz(hp)); return K.sm(K.cyl(r1, r0, H, seg), col, X(i), hz(zp) + H / 2, Z(j), null, cls); };   // 아래 r0 → 위 r1
function wheel(i, j, r, w, axis, col = INK){ const o = K.sm(K.cyl(r, r, w, 16), col, X(i), r, Z(j), null, "s"); if(axis === "i") o.rotation.z = PI / 2; else o.rotation.x = PI / 2; return o; }   // axis = 바퀴 축 방향
function tree(i, j, s){
  K.sm(K.cyl(0.07 * s, 0.1 * s, hz(40 * s), 8), D("#8A6A4C", "#4A3828"), X(i), hz(20 * s), Z(j), null, "m");
  [[0, 0, 56, 0.55], [-0.3, 0.12, 48, 0.4], [0.3, 0.1, 49, 0.42], [0.05, -0.28, 50, 0.4], [0.08, 0.3, 46, 0.36], [0, 0.02, 68, 0.38]].forEach(([di, dj, z, r], k) =>
    ball(i + di * s, j + dj * s, z * s, r * s, k % 2 ? K.sh("plant", 0.14) : "plant", "m", 12));
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
const NIGHT = a => (tm, dk) => dk ? a : 0;

/* 바닥 그림 도구 */
function paintKit(c, dark){
  const v = (l, d) => dark ? d : l, FS = K.FS;
  const rect = (i0, j0, i1, j1, col) => { c.fillStyle = col; c.fillRect(i0, j0, i1 - i0, j1 - j0); };
  const rr = (i0, j0, i1, j1, r, col) => { c.fillStyle = col; c.beginPath(); c.roundRect(i0, j0, i1 - i0, j1 - j0, r); c.fill(); };
  const line = (i0, j0, i1, j1, col, w = 0.02) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(i0, j0); c.lineTo(i1, j1); c.stroke(); };
  const text = (t, i, j, size, col, w = 800, fam = K.FONT) => { c.save(); c.translate(i, j); c.scale(1 / FS, 1 / FS); c.font = `${w} ${size / 31.3 * FS}px ${fam}`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = col; c.fillText(t, 0, 0); c.restore(); };
  const glow = (i, j, r, c0) => { const g = c.createRadialGradient(i, j, 0, i, j, r); g.addColorStop(0, c0); g.addColorStop(1, "rgba(255,240,210,0)"); c.fillStyle = g; c.beginPath(); c.arc(i, j, r, 0, 7); c.fill(); };
  const ell = (i, j, a, b, col) => { c.fillStyle = col; c.beginPath(); c.ellipse(i, j, a, b, 0, 0, 7); c.fill(); };
  return {v, rect, rr, line, text, glow, ell};
}

/* ---------- 가게 한 칸의 좌표틀: u = 앞선을 따라 (0~Wd), v = 앞에서 안쪽으로 (0~Dp) ---------- */
function FR(face, i0, j0, i1, j1){
  const alI = face[1] === "i", Wd = alI ? j1 - j0 : i1 - i0, Dp = alI ? i1 - i0 : j1 - j0;
  const P = (u, v) => face === "+i" ? [i1 - v, j0 + u] : face === "-i" ? [i0 + v, j1 - u] : face === "+j" ? [i0 + u, j1 - v] : [i1 - u, j0 + v];
  const LB = (u, v, w, d, h, col, z0 = 0, o = {}) => face === "+i" ? B(i1 - v - d, j0 + u, d, w, h, col, z0, o) : face === "-i" ? B(i0 + v, j1 - u - w, d, w, h, col, z0, o)
    : face === "+j" ? B(i0 + u, j1 - v - d, w, d, h, col, z0, o) : B(i1 - u - w, j0 + v, w, d, h, col, z0, o);
  const tilt = (o, a) => { if(face === "+i") o.rotation.z = -a; else if(face === "-i") o.rotation.z = a; else if(face === "+j") o.rotation.x = a; else o.rotation.x = -a; return o; };   // a > 0 = 앞이 낮게
  const alongU = o => { if(alI) o.rotation.x = PI / 2; else o.rotation.z = PI / 2; return o; };   // 눕힌 원기둥을 u 방향으로
  const AX = {"+i":"j", "-i":"-j", "+j":"i", "-j":"-i"}[face], BX = {"+i":"-j", "-i":"j", "+j":"-i", "-j":"i"}[face];
  const yaw = {"+i":PI / 2, "-i":-PI / 2, "+j":0, "-j":PI}[face];   // 앞(손님 쪽)을 보는 방향
  const ball2 = (u, v, zp, r, col, cls, seg) => { const [i, j] = P(u, v); return ball(i, j, zp, r, col, cls, seg); };
  const disc2 = (u, v, r, zp, hp, col, cls, seg) => { const [i, j] = P(u, v); return disc(i, j, r, zp, hp, col, cls, seg); };
  const tub2 = (u, v, r0, r1, zp, hp, col, cls, seg) => { const [i, j] = P(u, v); return tub(i, j, r0, r1, zp, hp, col, cls, seg); };
  return {face, Wd, Dp, P, LB, tilt, alongU, AX, BX, yaw, ball:ball2, disc:disc2, tub:tub2};
}
/* 줄무늬 차양 + 반달 장식. v0 = 통로 쪽으로 나온 끝, v1 = 안쪽 끝 */
const SCG = {};
function scallopGeo(face, r){ const k = face + r; if(SCG[k]) return SCG[k]; const g = new THREE.CircleGeometry(r, 10, PI, PI);
  if(face === "+i") g.rotateY(PI / 2); else if(face === "-i") g.rotateY(-PI / 2); else if(face === "-j") g.rotateY(PI); return SCG[k] = myGeo(g); }
const OPP = {"+i":"-i", "-i":"+i", "+j":"-j", "-j":"+j"};
function awning(F, c1, c2, o = {}){
  const v0 = o.v0 ?? -0.55, v1 = o.v1 ?? 1.75, zf = o.zf ?? 68, zb = o.zb ?? 82, n = Math.max(4, Math.round(F.Wd / 0.34)), sw = F.Wd / n;
  const L = v1 - v0, dz = hz(zb - zf), a = Math.atan2(dz, L), len = Math.hypot(L, dz), vm = (v0 + v1) / 2;
  for(let k = 0; k < n; k++) F.tilt(F.LB(k * sw, vm - len / 2, sw, len, 1.4, k % 2 ? c2 : c1, (zf + zb) / 2 - 0.7, {r:0}), a);
  const ns = Math.max(4, Math.round(F.Wd / 0.3)), sr = F.Wd / ns / 2;
  for(let k = 0; k < ns; k++){ const [i, j] = F.P(sr + k * sr * 2, v0 + 0.004), col = k % 2 ? c1 : c2;
    K.sm(scallopGeo(F.face, Math.round(sr * 100) / 100), col, X(i), hz(zf - 0.7), Z(j), null, "m"); K.sm(scallopGeo(OPP[F.face], Math.round(sr * 100) / 100), col, X(i), hz(zf - 0.7), Z(j), null, "m"); }
}
/* 손글씨 간판 그림 (주아체) */
function fitFont(c, t, maxW, size, fam, wt = ""){ c.font = `${wt} ${size}px ${fam}`; const w = c.measureText(t).width; if(w > maxW){ size *= maxW / w; c.font = `${wt} ${size}px ${fam}`; } return size; }
function signDraw(txt, sub, bg, fg, emo){
  return (c, w, h, dark) => {
    const b0 = K.cp(bg)[dark ? 1 : 0], f0 = K.cp(fg)[dark ? 1 : 0];
    c.fillStyle = b0; c.beginPath(); c.roundRect(1, 1, w - 2, h - 2, h * 0.2); c.fill();
    c.strokeStyle = dark ? "rgba(255,255,255,.45)" : "rgba(255,255,255,.9)"; c.lineWidth = Math.max(2, h * 0.035); c.setLineDash([h * 0.09, h * 0.06]);
    c.beginPath(); c.roundRect(h * 0.08, h * 0.08, w - h * 0.16, h - h * 0.16, h * 0.13); c.stroke(); c.setLineDash([]);
    const ew = emo ? h * 0.72 : 0, cx = (w + ew) / 2 + (emo ? -h * 0.06 : 0);
    c.textAlign = "center"; c.textBaseline = "middle";
    if(emo){ c.font = `${h * 0.46}px ${EMOF}`; c.fillText(emo, h * 0.48, h * 0.52); }
    const s = fitFont(c, txt, w - ew - h * 0.42, h * (sub ? 0.46 : 0.58), JUA);
    c.lineJoin = "round"; c.strokeStyle = dark ? "rgba(255,255,255,.55)" : "#FFFFFF"; c.lineWidth = s * 0.16; const ty = sub ? h * 0.41 : h * 0.53;
    c.strokeText(txt, cx, ty); c.fillStyle = f0; c.fillText(txt, cx, ty);
    if(sub){ fitFont(c, sub, w - ew - h * 0.5, h * 0.17, K.FONT, 700); c.globalAlpha = 0.85; c.fillText(sub, cx, h * 0.77); c.globalAlpha = 1; }
  };
}
/* 간판판: 차양 뒤 끝 위에 섬. back = 뒤쪽에도 같은 그림 */
function signBoard(F, txt, sub, bg, fg, emo, o = {}){
  const v = o.v ?? 1.72, z0 = o.z0 ?? 80, h = o.h ?? 24, u0 = o.u0 ?? 0.15, w = o.w ?? F.Wd - 0.3;
  F.LB(u0, v, w, 0.06, h, o.frame || WOODD, z0, {r:0});
  const dw = w - 0.08, dh = hz(h - 3), res = 150, draw = signDraw(txt, sub, bg, fg, emo);
  { const [i, j] = F.P(u0 + w / 2, v); K.decal(Math.round(dw * res), Math.round(dh * res), draw, dw, dh, F.AX, i, j, hz(z0 + h / 2)); }
  if(o.back !== false){ const [i, j] = F.P(u0 + w / 2, v + 0.06); K.decal(Math.round(dw * res), Math.round(dh * res), draw, dw, dh, F.BX, i, j, hz(z0 + h / 2)); }
}
/* 가격표 (계산대 앞면에 붙인 하얀 종이) */
function price(F, u, v, zp, txt, col = "#D9503F"){
  const [i, j] = F.P(u, v), w = 0.3, h = 0.16;
  K.decal(48, 26, (c, W2, H2, dark) => { c.fillStyle = dark ? "#D8D2C6" : "#FFFFFF"; c.fillRect(0, 0, W2, H2); c.strokeStyle = "rgba(0,0,0,.12)"; c.strokeRect(0.5, 0.5, W2 - 1, H2 - 1);
    c.fillStyle = col; c.font = `${fitFont(c, txt, W2 - 6, 17, JUA)}px ${JUA}`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(txt, W2 / 2, H2 / 2 + 1); }, w, h, F.AX, i, j, hz(zp));
}
/* 과일 쌓기: n × m 바닥에서 한 층씩 작게 */
function pile(F, u0, v0, n, m, r, col, z0, seg = 8){
  const rp = r * 31.1;
  for(let L = 0; n - L > 0 && m - L > 0; L++) for(let a = 0; a < n - L; a++) for(let b = 0; b < m - L; b++)
    F.ball(u0 + r + 2 * r * a + r * L, v0 + r + 2 * r * b + r * L, z0 + rp * 0.92 + L * rp * 1.42, r, Array.isArray(col) && typeof col[0] !== "string" ? col[(a + b + L) % col.length] : col, "m", seg);
}

/* ---------- 가게 뼈대: 계산대 · 칸막이 · 뒷벽 선반 · 기둥 · 차양 · 간판 · 전구 ---------- */
function stall(F, o){
  const Wd = F.Wd, Dp = F.Dp, ct = o.ctr ?? 22;
  F.LB(0.06, 0, Wd - 0.12, 0.64, ct - 1.6, o.ctrC || WOOD, 0, {r:0});             // 계산대 몸통
  F.LB(0.04, -0.02, Wd - 0.08, 0.68, 1.6, o.topC || CREAM, ct - 1.6, {r:0});      // 계산대 판
  F.LB(0.06, -0.012, Wd - 0.12, 0.01, 4, o.stripC || o.c1, 4, {r:0});              // 계산대 앞 색 띠
  if(!o.noSide) [0, Wd - 0.06].forEach(u => { F.LB(u, 0.7, 0.06, Dp - 0.76, 46, o.wall || PAPER, 0, {r:0}); F.LB(u - 0.005, 0.7, 0.07, Dp - 0.76, 1.6, CAPC, 46, {r:0}); });   // 칸막이
  if(!o.noBack){ F.LB(0.06, Dp - 0.06, Wd - 0.12, 0.06, 84, o.wall || PAPER, 0, {r:0});
    [30, 50, 68].forEach(z => F.LB(0.1, Dp - 0.44, Wd - 0.2, 0.38, 1.4, WOODD, z, {r:0})); }                     // 선반 셋
  [0.03, Wd - 0.1].forEach(u => F.LB(u, -0.04, 0.07, 0.07, 72, WOODD, 0, {r:0}));                                // 앞 기둥
  awning(F, o.c1, o.c2 || WHITE, o.aw || {});
  if(o.sign) signBoard(F, o.sign, o.sub, o.bg || PAPER, o.fg || INK, o.emo, o.signO || {});
  [Wd * 0.3, Wd * 0.72].forEach(u => { const [i, j] = F.P(u, 0.3); rod([i, j, 73], [i, j, 62], 0.006, INK, "s", 4); ball(i, j, 60, 0.045, D("#FFF1C8", "#FFE4A0"), "glow", 8); gl(i, j, 60, 26, "#FFD68C", (tm, dk) => dk ? 0.55 : 0.04); });
}
/* 플라스틱 상자 (과일·채소 받침) */
function crate(i, j, w, d, h, col, z0 = 0){ B(i, j, w, d, h, col, z0, {r:0.01}); B(i + 0.03, j + 0.03, w - 0.06, d - 0.06, 0.6, K.sh(col, -0.25), z0 + h - 0.5, {r:0}); }

/* ---------- 움직이지 않는 사장님 인형 (사람 모양은 엔진 makePerson 비율을 따라감). h = 보는 쪽 (0 = +j, PI/2 = +i) ---------- */
function vendor(i, j, h, L){
  const g = new THREE.Group(), put = (geo, c, x, y, z, cls = "m") => K.sm(geo, c, x, y, z, g, cls);
  const skin = L.skin || D("#F2D3BC", "#9A7A66"), hair = L.hair || D("#3A2A22", "#2A201A");
  [-1, 1].forEach(k => { put(K.cap(0.085, 0.6), L.pants || D("#5A5A66", "#34343C"), k * 0.1, 0.42, 0); put(K.rbox(0.15, 0.08, 0.25, 0.03, 1), "#2E2A28", k * 0.1, 0.04, 0.04); });
  put(K.rbox(0.44, 0.62, 0.3, 0.12, 2), L.shirt, 0, 1.06, 0);
  if(L.apron){ put(K.rbox(0.38, 0.6, 0.04, 0.02, 1), L.apron, 0, 0.96, 0.15); put(K.rbox(0.2, 0.012, 0.012, 0), L.apron, 0, 1.3, 0.165); }
  [-1, 1].forEach(k => { const a = put(K.cap(0.062, 0.36), L.sleeve || L.shirt, k * 0.27, 1.06, 0.08); a.rotation.x = -0.5; a.rotation.z = k * 0.1; put(K.sph(0.062, 8, 6), skin, k * 0.28, 0.86, 0.22); });
  put(K.cyl(0.065, 0.07, 0.1, 8), skin, 0, 1.4, 0);
  put(K.sph(0.22, 16, 12), skin, 0, 1.62, 0).scale.set(1, 1.04, 0.97);
  [-1, 1].forEach(k => { put(K.sph(0.024, 6, 5), "#2A211D", k * 0.08, 1.64, 0.2).scale.set(1, 1.3, 0.6); put(K.sph(0.038, 8, 5), "#F39A9A", k * 0.13, 1.57, 0.165, "m").scale.set(1, 0.6, 0.4); });
  const hc = put(myGeo(new THREE.SphereGeometry(0.235, 16, 8, 0, PI * 2, 0, PI * 0.5)), L.style === "scarf" ? L.scarf : hair, 0, 1.64, -0.01); hc.rotation.x = -0.4;
  if(L.style === "perm") for(let k = 0; k < 9; k++){ const a = k / 9 * PI * 2; put(K.sph(0.085, 8, 6), hair, Math.sin(a) * 0.19, 1.8 + (k % 2) * 0.03, Math.cos(a) * 0.17 - 0.04); }
  if(L.style === "bun"){ put(K.sph(0.1, 10, 8), hair, 0, 1.9, -0.14); }
  if(L.style === "scarf"){ put(K.sph(0.06, 8, 6), L.scarf, 0.02, 1.62, -0.24); }
  if(L.style === "cap"){ put(K.cyl(0.235, 0.24, 0.09, 16), L.capC, 0, 1.8, -0.01); put(K.rbox(0.3, 0.02, 0.2, 0), L.capC, 0, 1.77, 0.22); }
  if(L.style === "gray") for(let k = 0; k < 7; k++){ const a = k / 7 * PI * 2; put(K.sph(0.08, 8, 6), hair, Math.sin(a) * 0.17, 1.78, Math.cos(a) * 0.15 - 0.05); }
  g.scale.setScalar(L.s || 0.74); g.rotation.y = h; g.position.set(X(i), 0, Z(j)); K.root.add(g);
}
const LOOK = {
  fruit:{shirt:D("#F4A7B9", "#7A5866"), apron:D("#72C4AE", "#3E6E60"), style:"perm"},
  banchan:{shirt:D("#FFFFFF", "#8A847C"), apron:D("#E8B5C8", "#7A5866"), style:"bun"},
  grain:{shirt:D("#C8B4D0", "#5E4E68"), apron:D("#A98258", "#4E3C2C"), style:"gray", hair:D("#B8B2AA", "#6E6A64")},
  mandu:{shirt:D("#FFFFFF", "#8A847C"), apron:D("#4DAA97", "#2F6E62"), style:"cap", capC:D("#FFFFFF", "#8A847C")},
  shop:{shirt:D("#A9CBEA", "#4A6280"), apron:D("#E8A04A", "#9A6A30"), style:"short"},
  jeon:{shirt:D("#F6E39A", "#8A7A3A"), apron:D("#E06A55", "#8A4438"), style:"perm", hair:D("#5A3A2A", "#3A2A20")},
  donut:{shirt:D("#FFFFFF", "#8A847C"), apron:D("#F4A7B9", "#7A5866"), style:"bun", hair:D("#6A4430", "#3A2A20")},
  sesame:{shirt:D("#E8A04A", "#9A6A30"), apron:D("#6E5A48", "#3A3028"), style:"cap", capC:D("#4DAA97", "#2F6E62")},
  flower:{shirt:D("#F7DCE6", "#6A4E5A"), apron:D("#72C4AE", "#3E6E60"), style:"bun", hair:D("#4A3226", "#2A201A")},
  toys:{shirt:D("#F6E39A", "#8A7A3A"), apron:null, style:"cap", capC:D("#E06A55", "#8A4438"), pants:D("#4A6A9A", "#2A3A5A")},
  ppeong:{shirt:D("#8A9A7A", "#4A5444"), apron:null, style:"gray", hair:D("#D8D2CA", "#8A847C"), pants:D("#5A4A3A", "#3A3028"), s:0.7},
  goguma:{shirt:D("#5E6A80", "#353B48"), apron:D("#A98258", "#4E3C2C"), style:"cap", capC:D("#C8303A", "#7A2A30")}};

/* =================================================================== 바닥 그림 */
function paint(c, dark){
  const p = paintKit(c, dark), v = p.v;
  // 바깥 길 (아스팔트 비슷한 따뜻한 회색) + 얼룩
  p.rect(-1, -1, 32, 24, v("#D8D1C5", "#2E2B28"));
  c.globalAlpha = dark ? 0.08 : 0.12; for(let k = 0; k < 2200; k++){ c.fillStyle = k % 3 ? "#FFFFFF" : "#6A6258"; c.fillRect(-0.5 + rnd(k) * 31, -0.5 + rnd(k + 77) * 23, 0.05, 0.05); } c.globalAlpha = 1;
  // 정문 앞 보도 (블록) + 횡단보도 줄
  p.rect(-0.5, GJ + 0.3, 30.5, 22.5, v("#E6DED2", "#36322E"));
  for(let i = -0.5; i < 30.5; i += 0.5) p.line(i, GJ + 0.3, i, 22.5, v("rgba(0,0,0,.07)", "rgba(255,255,255,.05)"), 0.016);
  for(let j = GJ + 0.8; j < 22.5; j += 0.5) p.line(-0.5, j, 30.5, j, v("rgba(0,0,0,.07)", "rgba(255,255,255,.05)"), 0.016);
  // 아케이드 통로: 크림 보도블록 + 가운데 분홍·라일락 마름모 줄
  p.rect(WK0, FJ, WK1, GJ + 0.3, v("#F1E8DA", "#3C3731"));
  for(let j = FJ; j < GJ + 0.3; j += 0.35) p.line(WK0, j, WK1, j, v("rgba(120,90,60,.10)", "rgba(0,0,0,.25)"), 0.014);
  for(let k = 0, j = FJ; j < GJ; j += 0.35, k++) for(let i = WK0 + (k % 2) * 0.35; i < WK1; i += 0.7) p.line(i, j, i, j + 0.35, v("rgba(120,90,60,.10)", "rgba(0,0,0,.25)"), 0.014);
  for(let j = 1.4, k = 0; j < GJ - 0.3; j += 0.9, k++){ c.fillStyle = v(["#F4C7D4", "#E2D6EA", "#CDEBE2"][k % 3], ["#6A4E5A", "#4E4458", "#3E5A54"][k % 3]); c.beginPath(); c.moveTo(WC, j - 0.3); c.lineTo(WC + 0.3, j); c.lineTo(WC, j + 0.3); c.lineTo(WC - 0.3, j); c.fill(); }
  // 가게 바닥 (콘크리트)
  ROWJ.forEach(([a, b]) => { p.rect(LB0, a, LF, b, v("#D6CFC4", "#34312D")); p.rect(RF, a, RB1, b, v("#D6CFC4", "#34312D")); });
  // 가로 골목 · 광장 길: 벽돌
  p.rect(0, 9.35, WK0, 12.65, v("#EDD6C2", "#3A3530")); p.rect(WK1, XJ0, 30.5, XJ1, v("#EDD6C2", "#3A3530"));
  for(let j = 9.35; j < 12.65; j += 0.3) p.line(0, j, WK0, j, v("rgba(130,90,60,.11)", "rgba(0,0,0,.28)"), 0.013);
  for(let k = 0, j = 9.35; j < 12.6; j += 0.3, k++) for(let i = (k % 2) * 0.3; i < WK0; i += 0.6) p.line(i, j, i, j + 0.3, v("rgba(130,90,60,.11)", "rgba(0,0,0,.28)"), 0.013);
  // 광장: 큰 네모 타일 + 사방치기
  p.rect(RB1 + 0.1, FJ, 30.5, GJ + 0.3, v("#EFE4D2", "#38342F"));
  for(let i = RB1 + 0.1, a = 0; i < 30.5; i += 0.8, a++) for(let j = FJ, b = 0; j < GJ + 0.3; j += 0.8, b++) if((a + b) % 2) p.rect(i, j, Math.min(30.5, i + 0.8), Math.min(GJ + 0.3, j + 0.8), v("#F4DDBE", "#3E3731"));   // 살구색 바둑판
  for(let i = RB1 + 0.1; i < 30.5; i += 0.8) p.line(i, FJ, i, GJ + 0.3, v("rgba(0,0,0,.05)", "rgba(255,255,255,.04)"), 0.016);
  for(let j = FJ; j < GJ + 0.3; j += 0.8) p.line(RB1 + 0.1, j, 30.5, j, v("rgba(0,0,0,.05)", "rgba(255,255,255,.04)"), 0.016);
  { const hop = [[0, 0], [1, 0], [2, -0.32], [2, 0.32], [3, 0], [4, -0.32], [4, 0.32], [5, 0]]; hop.forEach(([a, b], k) => { const i = 23.6 + a * 0.62, j = 11.2 + b;
      c.strokeStyle = v("rgba(255,255,255,.95)", "rgba(255,255,255,.3)"); c.lineWidth = 0.04; c.strokeRect(i - 0.29, j - 0.3, 0.58, 0.6); p.rect(i - 0.27, j - 0.28, i + 0.27, j + 0.28, v(RB[k % 6] + "88", "rgba(255,255,255,.05)")); p.text(String(k + 1), i, j, 8, v("#9A7A8A", "rgba(255,255,255,.35)"), 900); }); }
  // 왼쪽 아래 쉼터 · 짐차 자리 (아스팔트 + 주차선)
  p.rect(0, 12.65, LB0, GJ + 0.3, v("#CFC8BD", "#2C2926"));
  [6.6, 8.9].forEach(i => p.rect(i, 15.2, i + 0.06, 19.6, v("#FFFFFF", "#7A766E"))); p.text("짐차", 7.75, 19.2, 9, v("rgba(255,255,255,.9)", "rgba(255,255,255,.3)"), 900);
  p.ell(8.1, 18.4, 0.5, 0.25, v("rgba(60,50,40,.12)", "rgba(0,0,0,.25)"));
  p.rr(0.6, 14.4, 4.6, 19.6, 0.3, v("#E8DCC8", "#3A342E"));   // 쉼터 나무 바닥 느낌
  for(let i = 0.8; i < 4.6; i += 0.3) p.line(i, 14.45, i, 19.55, v("rgba(120,80,40,.12)", "rgba(0,0,0,.3)"), 0.02);
  // 생선가게 앞 물기 · 채소 좌판 돗자리 · 꽃집 앞 흙
  [[13.85, 13.2, 0.35, 0.5], [14.2, 14.6, 0.25, 0.35], [13.75, 15.1, 0.2, 0.25]].forEach(([i, j, a, b]) => p.ell(i, j, a, b, v("rgba(140,190,230,.35)", "rgba(120,160,220,.16)")));
  p.rr(3.95, 8.45, 6.5, 9.4, 0.06, v("#5FA2D6", "#2E4A66")); for(let i = 4.05; i < 6.45; i += 0.22) p.line(i, 8.45, i, 9.4, v("rgba(255,255,255,.45)", "rgba(255,255,255,.12)"), 0.05);   // 파란 돗자리
  // 글씨 · 화살표
  p.rr(0.35, 10.75, 2.55, 11.25, 0.25, v("rgba(232,181,200,.6)", "rgba(232,181,200,.18)")); p.text("← 옆 동네 골목", 1.45, 11.0, 5.4, v("#9A4E6A", "#F4C7D4"));
  p.rr(14.15, 20.95, 15.85, 21.45, 0.25, v("rgba(114,196,174,.55)", "rgba(114,196,174,.18)")); p.text("▼ 나가는 길", 15.0, 21.2, 5.4, v("#2F6E62", "#BFEDE0"));
  p.text("크레용 전통시장", WC, 18.2, 9, v("rgba(154,78,106,.22)", "rgba(244,199,212,.12)"), 900, JUA);
  // 밤 불빛 웅덩이
  for(let j = 2; j < 19.5; j += 2.5) p.glow(WC, j, 1.4, v("rgba(255,250,235,.22)", "rgba(255,190,120,.2)"));
  [[5, 10.8], [24, 5.6], [25, 16.6], [2.6, 16.8]].forEach(([i, j]) => p.glow(i, j, 1.8, v("rgba(255,250,235,.15)", "rgba(255,200,130,.18)")));
}

/* =================================================================== 짓기 */
function buildArcade(){
  // 아치 기둥 (가게 칸막이 자리) · 아치 · 지붕 띠 · 들보 · 초롱 줄
  const PJ = [0.95, 4.1, 7.3, 10.0, 12.4, 15.5, 18.9];
  PJ.forEach(j => [WK0, WK1].forEach(i => { B(i - 0.06, j - 0.06, 0.12, 0.12, ARC, LILAC, 0, {r:0.02}); B(i - 0.08, j - 0.08, 0.16, 0.16, 3, CAPC, ARC, {r:0}); }));
  [WK0, WK1].forEach(i => B(i - 0.05, PJ[0], 0.1, PJ[PJ.length - 1] - PJ[0], 4, WHITE, ARC + 0.5, {r:0}));                  // 처마 들보
  const rib = myGeo(new THREE.TorusGeometry(ARR, 0.045, 6, 26, PI));
  for(let j = PJ[0]; j <= PJ[PJ.length - 1] + 0.01; j += (PJ[PJ.length - 1] - PJ[0]) / 8) K.sm(rib, WHITE, X(WC), hz(ARC + 2), Z(j), null, "s");
  const tint = [D("#F7D3E0", "#B08AA0"), D("#E6DAF2", "#9A8AB0"), D("#FFF0D0", "#B0A080"), D("#D6F0E8", "#80A8A0")];
  const seg0 = PJ[0], seg1 = PJ[PJ.length - 1], N = 8, sl = (seg1 - seg0) / N;
  // 지붕 유리는 따로 한 덩어리: 유나 모드에서 카메라가 지붕 밑에 들어오면 거의 투명하게 (겹친 유리가 하얗게 뜨는 것 막음)
  const RM = Merge();
  for(let k = 0; k < N; k++){ const len = sl - 0.32, g = new THREE.CylinderGeometry(ARR + 0.02, ARR + 0.02, len, 18, 1, true, -PI / 2, PI); g.rotateX(-PI / 2);
    RM.add(g, tint[k % 4], X(WC), hz(ARC + 2), Z(seg0 + sl * k + sl / 2)); }
  const rg = RM.geo(), rm = new THREE.Mesh(rg, K.cutaway(new THREE.MeshStandardMaterial({vertexColors:true, roughness:0.1, transparent:true, opacity:0.24, depthWrite:false, side:THREE.DoubleSide})));
  rm.renderOrder = 2; K.R.scene.add(rm); W.recolor.push(rm); W.roof = rm; W.roofBox = [X(WK0) - 1.2, Z(seg0) - 1.2, X(WK1) + 1.2, Z(seg1) + 1.6];
  B(WC - 0.05, seg0, 0.1, seg1 - seg0, 2.5, WHITE, ARC + 2 + ARR * 31.1 - 1, {r:0});                                      // 용마루
  // 초롱 줄 (밤에 반짝)
  const LC = [D("#F4B6C8", "#FFC2D6"), D("#F6C98A", "#FFD08A"), D("#A8DCC8", "#B8FFE6"), D("#D2C2E2", "#E8D2FF"), D("#FFF0C8", "#FFF2C8")];
  // 초롱은 아치 양쪽에 번갈아 매닮 (가운데 길은 유나 카메라가 지나는 자리라 비워 둠)
  for(let j = 1.5, k = 0; j < 18.6; j += 1.22, k++){ const li = WC + (k % 2 ? 0.85 : -0.85); rod([li, j, 127], [li, j, 106], 0.005, INK, "s", 4);
    ball(li, j, 101, 0.13, LC[k % 5], "glow", 12).scale.y = 0.9; disc(li, j, 0.07, 104.5, 1.2, "#3A2A22", "s", 10); disc(li, j, 0.07, 96, 1.2, "#3A2A22", "s", 10);
    gl(li, j, 101, 28, ["#FFB0C8", "#FFC070", "#8FFFD8", "#D8B8FF", "#FFE6A8"][k % 5], (tm, dk) => dk ? 0.45 : 0.04); }
}
function buildGate(){
  const col = D("#C8B4D0", "#5E4E68"), cap = D("#FFFFFF", "#7A7270"), roof = D("#5A6670", "#2E343A");
  [[11.5, 12.1], [17.9, 18.5]].forEach(([a, b]) => { B(a, GJ - 0.25, b - a, 0.5, 118, col, 0, {r:0.03}); B(a - 0.04, GJ - 0.29, b - a + 0.08, 0.58, 4, cap, 0, {r:0.02}); B(a - 0.04, GJ - 0.29, b - a + 0.08, 0.58, 3, cap, 118, {r:0}); });
  B(11.3, GJ - 0.2, 7.4, 0.4, 12, PINK, 118, {r:0.03});                                     // 보
  B(12.5, GJ - 0.09, 5.0, 0.18, 36, WHITE, 130, {r:0.04});                                   // 간판판
  K.decal(900, 196, (c, w, h, dark) => {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, dark ? "#7A5866" : "#F7D3E0"); g.addColorStop(1, dark ? "#6A4E5A" : "#E8B5C8"); c.fillStyle = g; c.beginPath(); c.roundRect(0, 0, w, h, 26); c.fill();
    c.strokeStyle = dark ? "rgba(255,255,255,.4)" : "#FFFFFF"; c.lineWidth = 6; c.setLineDash([18, 12]); c.beginPath(); c.roundRect(12, 12, w - 24, h - 24, 18); c.stroke(); c.setLineDash([]);
    RB.forEach((cc, k) => { c.strokeStyle = cc; c.lineWidth = 9; c.beginPath(); c.arc(82, h * 0.62, 52 - k * 9, PI, 0); c.stroke(); });
    c.font = `${h * 0.34}px ${EMOF}`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("🧺", w - 78, h * 0.5);
    c.font = `${fitFont(c, "크레용 전통시장", w - 330, h * 0.5, JUA)}px ${JUA}`; c.lineJoin = "round"; c.lineWidth = 16; c.strokeStyle = dark ? "#4A3440" : "#FFFFFF"; c.strokeText("크레용 전통시장", w / 2 + 6, h * 0.45);
    c.fillStyle = dark ? "#FFE3EC" : "#9A4E6A"; c.fillText("크레용 전통시장", w / 2 + 6, h * 0.45);
    c.font = `700 ${h * 0.12}px ${K.FONT}`; c.fillStyle = dark ? "#F4C7D4" : "#B5607E"; c.fillText("CREYONG MARKET · 어서 오세요!", w / 2 + 6, h * 0.82);
  }, 4.9, hz(34), "i", WC, GJ + 0.09, hz(147));
  K.decal(640, 140, (c, w, h, dark) => { c.fillStyle = dark ? "#6A4E5A" : "#E8B5C8"; c.beginPath(); c.roundRect(0, 0, w, h, 20); c.fill();
    c.font = `${h * 0.42}px ${JUA}`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = dark ? "#FFE3EC" : "#FFFFFF"; c.fillText("또 오세요! 👋 조심히 가세요", w / 2, h * 0.52); }, 4.9, hz(34) * 0.66, "-i", WC, GJ - 0.09, hz(147));
  // 기와 지붕 (전통 느낌)
  const RZ = 166;
  B(11.0, GJ - 0.55, 8.0, 1.1, 5, roof, RZ, {r:0.04}); B(11.4, GJ - 0.32, 7.2, 0.64, 7, roof, RZ + 5, {r:0.06}); B(11.6, GJ - 0.08, 6.8, 0.16, 3, D("#7A8890", "#3A444A"), RZ + 12, {r:0.03});
  for(let i = 11.15; i < 18.95; i += 0.26) { K.sm(K.cyl(0.05, 0.05, 1.12, 8), D("#6A7680", "#353D44"), X(i), hz(RZ + 5.5), Z(GJ), null, "s").rotation.x = PI / 2; }
  [[11.0, -1], [19.0, 1]].forEach(([i, s]) => { const o = B(i - (s > 0 ? 0.3 : 0), GJ - 0.55, 0.3, 1.1, 3, roof, RZ + 4, {r:0.02}); o.rotation.z = s * 0.35; });
  [11.6, 17.4].forEach(i => B(i, GJ - 0.12, 1.0, 0.24, 36, col, 130, {r:0.02}));            // 간판 옆 받침
  B(11.3, GJ - 0.24, 7.4, 0.48, 4, D("#E8A04A", "#9A6A30"), 162, {r:0.02});                // 단청 띠
  for(let k = 0; k < 14; k++) B(11.45 + k * 0.52, GJ + 0.235, 0.3, 0.012, 3, RB[k % 6], 162.5, {r:0, cls:"m"});
  // 기둥에 늘어뜨린 세로 현수막
  [[11.8, "어서 오세요", "#72C4AE"], [18.2, "온누리상품권 환영", "#E8A04A"]].forEach(([i, t, cc]) => {
    K.decal(60, 300, (c, w, h, dark) => { c.fillStyle = dark ? "#3A3632" : cc; c.fillRect(0, 0, w, h); c.fillStyle = dark ? cc : "#FFFFFF"; c.font = `${w * 0.62}px ${JUA}`; c.textAlign = "center"; c.textBaseline = "middle";
      [...t.replace(/ /g, "")].forEach((ch, k, a) => c.fillText(ch, w / 2, h * (k + 0.6) / (a.length + 0.2))); }, 0.42, hz(62), "i", i, GJ + 0.25, hz(80)); });
  // 정문 밖: 화분 · 말뚝 · 시장 안내도
  [[12.7, 20.9], [17.3, 20.9], [10.6, 20.9], [19.4, 20.9]].forEach(([i, j], k) => { B(i - 0.3, j - 0.3, 0.6, 0.6, 12, k % 2 ? LILAC2 : PINK2, 0, {r:0.06});
    for(let n = 0; n < 6; n++) ball(i + Math.cos(n) * 0.17, j + Math.sin(n) * 0.17, 15 + (n % 2) * 3, 0.1, n % 2 ? RB[(k + n) % 6] : K.sh("plant", 0.08), "m", 8); });
  [13.6, 16.4].forEach(i => { K.sm(K.cyl(0.07, 0.08, hz(16), 10), WHITE, X(i), hz(8), Z(21.0), null, "s"); ball(i, 21.0, 16.5, 0.075, PINK, "s", 10); });
  B(20.6, 20.55, 0.06, 0.06, 40, WOODD, 0, {r:0}); B(22.0, 20.55, 0.06, 0.06, 40, WOODD, 0, {r:0}); B(20.5, 20.5, 1.65, 0.1, 30, WHITE, 26, {r:0.02});
  K.decal(330, 180, (c, w, h, dark) => { c.fillStyle = dark ? "#3A3632" : "#FFFDF8"; c.fillRect(0, 0, w, h); c.fillStyle = dark ? "#C8B4D0" : "#8A6A9A"; c.font = `${h * 0.14}px ${JUA}`; c.textAlign = "center"; c.fillText("시장 안내도 🗺️", w / 2, h * 0.14);
    const blk = (x, y, ww, hh, t, cc) => { c.fillStyle = cc; c.fillRect(x * w, y * h, ww * w, hh * h); c.fillStyle = "#2A2A28"; c.font = `${h * 0.075}px ${JUA}`; c.fillText(t, (x + ww / 2) * w, (y + hh / 2) * h + 4); };
    blk(0.05, 0.24, 0.28, 0.24, "방앗간 골목", "#E2D6EA"); blk(0.36, 0.24, 0.1, 0.66, "", "#F4C7D4"); blk(0.54, 0.24, 0.1, 0.66, "", "#F4C7D4"); blk(0.67, 0.24, 0.28, 0.4, "뻥튀기 광장", "#F6D29A"); blk(0.05, 0.56, 0.28, 0.34, "쉼터", "#CDEBE2"); blk(0.67, 0.68, 0.28, 0.22, "먹자리", "#FCE9B8");
    c.fillStyle = "#E06A55"; c.beginPath(); c.arc(w * 0.5, h * 0.92, 7, 0, 7); c.fill(); }, 1.55, hz(26), "i", 21.33, 20.6, hz(39.5));
}
/* 뒤쪽 상가 (j 0 ~ 0.9, 앞면 +j) */
function facade(i0, i1, col, sign, sub, sbg, kind){
  B(i0, 0, i1 - i0, FJ, FH, col, 0, {r:0}); B(i0 - 0.02, -0.02, i1 - i0 + 0.04, FJ + 0.06, 3, CAPC, FH, {r:0});
  const w = i1 - i0, cx = (i0 + i1) / 2;
  K.faceJ(i0 + 0.12, i1 - 0.12, FJ, 60, 80, sbg, "m", 0.03);
  K.decal(Math.round((w - 0.34) * 140), 80, signDraw(sign, sub, sbg, INK, null), w - 0.34, hz(18), "i", cx, FJ + 0.03, hz(70));
  // 윗층 창
  const nw = Math.max(1, Math.round(w / 1.6));
  for(let k = 0; k < nw; k++){ const a = i0 + (k + 0.5) * w / nw - 0.45;
    K.decal(90, 50, (c, W2, H2, dark) => { const g = c.createLinearGradient(0, 0, 0, H2); g.addColorStop(0, dark ? "#FFE2A8" : "#BFDDF0"); g.addColorStop(1, dark ? "#F0B878" : "#EAF2F6"); c.fillStyle = g; c.fillRect(0, 0, W2, H2);
      c.fillStyle = dark ? "rgba(120,80,40,.35)" : "rgba(255,255,255,.6)"; c.fillRect(W2 * 0.48, 0, W2 * 0.04, H2); c.fillStyle = PALE(k); c.fillRect(0, 0, W2, H2 * 0.18); }, 0.9, hz(12), "i", a + 0.45, FJ, hz(90));
    B(a - 0.04, FJ, 0.98, 0.08, 1.4, CAPC, 83.2, {r:0, cls:"s"}); }
  // 1층: 셔터 반쯤 올린 가게 · 문
  if(kind === "door"){ [0.28, 0.62].forEach((t, k) => { const a = i0 + w * t - 0.4; K.faceJ(a, a + 0.8, FJ, 0, 52, k ? D("#C7E3F2", "#3A4A5A") : D("#F4D3DF", "#5A4450"), "s", 0.02); K.faceJ(a + 0.39, a + 0.41, FJ + 0.02, 0, 52, WHITE, "s", 0.01); }); }
  else { K.faceJ(i0 + 0.2, i1 - 0.2, FJ, 36, 56, D("#B8BCC2", "#4A4E54"), "s", 0.025); for(let z = 38; z < 56; z += 3) K.faceJ(i0 + 0.2, i1 - 0.2, FJ + 0.026, z, z + 0.5, D("#9EA2A8", "#3A3E44"), "s", 0.004);
    K.faceJ(i0 + 0.2, i1 - 0.2, FJ, 0, 36, D("#FFF6E4", "#5A4A38"), "glow", 0.01); }
}
const PALE = k => ["#F4C7D4", "#CDEBE2", "#FCE9B8", "#E2D6EA"][k % 4];
function buildBack(){
  facade(LB0, WK0, D("#F3E9E4", "#4A403C"), "고객센터 · 화장실", "🚻 상인회 사무실 2층", D("#CDEBE2", "#3E5A54"), "door");
  facade(WK0, WK1, D("#F7EEF0", "#4A4044"), "크레용 전통시장 ♥", "오늘도 맛있는 하루", D("#F4D3DF", "#6A4E5A"), "door");
  facade(WK1, RB1, D("#F3E9E4", "#4A403C"), "배송 센터 🛵", "장 본 것 집까지 배달해 드려요", D("#FCE9B8", "#6A5E4A"), "door");
  facade(RB1 + 0.1, 25.1, D("#F6E6E6", "#4A3C3C"), "크레용 정육점", "한우 · 돼지 · 닭", D("#F4C7D4", "#6A4E5A"), "shop");
  facade(25.1, 30.0, D("#EEF2EC", "#3C443E"), "행복 약국 ✚", "어린이 비타민 있어요", D("#CDEBE2", "#3E5A54"), "shop");
  // 아케이드 끝벽 시계
  disc(WC, FJ, 0.32, 84, 0.1, WHITE, "s", 24).rotation.x = PI / 2;
  K.decal(80, 80, (c, w, h) => { c.fillStyle = "#FFFFFF"; c.beginPath(); c.arc(w / 2, h / 2, w / 2 - 2, 0, 7); c.fill(); c.strokeStyle = "#E8B5C8"; c.lineWidth = 6; c.stroke();
    c.strokeStyle = "#2A2A28"; c.lineWidth = 4; c.lineCap = "round"; c.beginPath(); c.moveTo(w / 2, h / 2); c.lineTo(w / 2, h * 0.2); c.moveTo(w / 2, h / 2); c.lineTo(w * 0.72, h * 0.58); c.stroke(); }, 0.58, 0.58, "i", WC, FJ + 0.06, hz(94));
  // 광장 쪽 상가 앞: 정육점 빨간 등 · 약국 자판기
  B(26.9, FJ + 0.05, 0.7, 0.55, 54, D("#E06A55", "#8A4438"), 0, {r:0.04}); K.faceJ(26.98, 27.52, FJ + 0.61, 22, 48, D("#DDEEF6", "#4A6078"), "glass", 0.01);
  [[27.08, 40, "#F6E39A"], [27.25, 40, "#A9CBEA"], [27.42, 40, "#F4A7B9"], [27.08, 30, "#A8DCC8"], [27.25, 30, "#F9C99B"], [27.42, 30, "#C8B4D0"]].forEach(([i, z, cc]) => B(i - 0.05, FJ + 0.3, 0.1, 0.2, 6, cc, z, {r:0.01}));
  K.wtext("음료", 27.25, FJ + 0.61, 51, "i", 2.6, "#FFFFFF", null, 800, K.FONT);
}
/* 북서 2층 상가 (옥상: 장독대 · 물탱크 · 빨랫줄) */
function buildNW(){
  const wcol = D("#F4E8DC", "#463E36");
  B(0, 0, NWI, NWJ, NWH, wcol, 0, {r:0}); B(-0.02, -0.02, NWI + 0.04, NWJ + 0.04, 2, CAPC, NWH, {r:0});
  // 옥상 난간 (낮은 턱)
  [[0, 0, NWI, 0.12], [0, NWJ - 0.12, NWI, 0.12], [0, 0, 0.12, NWJ], [NWI - 0.12, 0, 0.12, NWJ]].forEach(([i, j, w, d]) => B(i, j, w, d, 8, wcol, NWH + 2, {r:0}));
  // 2층 창 · 간판
  [[0.4, 2.6], [3.6, 5.6], [7.0, 9.4]].forEach(([a, b], k) => { K.decal(Math.round((b - a) * 90), 50, (c, w, h, dark) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, dark ? "#FFE2A8" : "#BFDDF0"); g.addColorStop(1, dark ? "#F0B878" : "#F2EAF2"); c.fillStyle = g; c.fillRect(0, 0, w, h);
      c.fillStyle = dark ? "rgba(120,80,40,.4)" : "rgba(255,255,255,.7)"; for(let x = w / 3; x < w; x += w / 3) c.fillRect(x - 1.5, 0, 3, h); if(k === 1){ c.fillStyle = "#E8B5C8"; c.font = `${h * 0.36}px ${JUA}`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("크레용 미술학원 🖍️", w / 2, h / 2); } },
    b - a, hz(16), "i", (a + b) / 2, NWJ, hz(118));
    B(a - 0.05, NWJ, b - a + 0.1, 0.1, 1.5, CAPC, 109, {r:0, cls:"s"}); });
  // 옥상: 노란 물탱크 · 장독대 · 화분 · 빨랫줄 · 안테나
  const R0 = NWH + 2;
  K.sm(K.cyl(0.5, 0.5, hz(30), 20), D("#F2C94C", "#8A7430"), X(1.4), hz(R0 + 9) + hz(15), Z(1.4), null, "s"); disc(1.4, 1.4, 0.52, R0 + 39, 2, D("#F6D86A", "#9A8440"), "s", 20);
  [[0.95, 0.95], [1.85, 0.95], [0.95, 1.85], [1.85, 1.85]].forEach(([i, j]) => B(i - 0.04, j - 0.04, 0.08, 0.08, 9, STEEL, R0, {r:0}));
  K.wtext("물", 1.4, 1.91, R0 + 26, "i", 6, D("#FFFFFF", "#E9D2B0"), null, 800, K.FONT);
  B(3.2, 0.6, 3.2, 1.6, 4, D("#C9B8A2", "#4A4036"), R0, {r:0.03});                              // 장독대 받침
  [[3.55, 1.0, 0.26, 20], [4.2, 1.0, 0.3, 24], [4.9, 1.0, 0.24, 18], [5.6, 1.0, 0.28, 22], [6.15, 1.05, 0.18, 14], [3.7, 1.75, 0.2, 15], [4.5, 1.8, 0.24, 18], [5.3, 1.8, 0.2, 14], [6.0, 1.8, 0.16, 12]].forEach(([i, j, r, h]) => {
    const o = ball(i, j, R0 + 4 + h * 0.5, r, D("#7A4A2E", "#3E2A1E"), "s", 12); o.scale.y = h / 31.1 / r * 0.62; disc(i, j, r * 0.55, R0 + 4 + h * 0.96, 2.5, D("#6A3E26", "#33231A"), "s", 12); });
  for(let i = 1.0, k = 0; i < 9.0; i += 0.9, k++){ B(i - 0.16, 5.9, 0.32, 0.32, 9, k % 2 ? PINK2 : D("#E8C9A8", "#5A4A3A"), R0, {r:0.04}); for(let n = 0; n < 4; n++) ball(i + Math.cos(n * 1.6) * 0.08, 6.06 + Math.sin(n * 1.6) * 0.08, R0 + 12 + (n % 2) * 2, 0.09, n === 3 ? RB[k % 6] : K.sh("plant", n * 0.06), "m", 7); }
  rod([7.0, 2.2, R0], [7.0, 2.2, R0 + 40], 0.02, METAL); rod([9.4, 2.2, R0], [9.4, 2.2, R0 + 40], 0.02, METAL); rod([7.0, 2.2, R0 + 38], [9.4, 2.2, R0 + 38], 0.008, "#E6E1D8", "s", 4);
  [[7.3, "#F4A7B9", 12], [7.75, "#A9CBEA", 16], [8.2, "#FFFFFF", 14], [8.65, "#F6E39A", 10], [9.05, "#C8B4D0", 13]].forEach(([i, cc, h]) => B(i - 0.15, 2.19, 0.3, 0.02, h, cc, R0 + 37 - h, {r:0}));
  K.sm(myGeo(new THREE.SphereGeometry(0.3, 14, 8, 0, PI * 2, 0, PI * 0.42)), WHITE, X(8.6), hz(R0 + 18), Z(4.4), null, "s").rotation.x = -0.9;
  rod([8.6, 4.4, R0], [8.6, 4.4, R0 + 16], 0.02, METAL);
  // 서쪽 끝 벽 (출구 위쪽)
  B(0, NWJ, 0.3, 9.45 - NWJ, 60, wcol, 0, {r:0}); B(-0.02, NWJ, 0.34, 9.45 - NWJ, 2, CAPC, 60, {r:0});
  [[9.45, 9.95], [12.15, 12.7]].forEach(([a, b], k) => { B(0.0, a, 0.5, b - a, 12, k ? PINK2 : LILAC2, 0, {r:0.04}); for(let n = 0; n < 4; n++) ball(0.25 + (n % 2 ? 0.1 : -0.1), (a + b) / 2 + (n < 2 ? -0.1 : 0.1), 15 + (n % 2) * 3, 0.1, n % 2 ? RB[(n + k * 2) % 6] : K.sh("plant", 0.06), "m", 8); });
  rod([0.95, 12.6, 0], [0.95, 12.6, 62], 0.02, WOODD); B(0.3, 12.56, 1.3, 0.06, 16, WOODD, 46, {r:0.01});
  K.decal(200, 58, (c, w, h, dark) => { c.fillStyle = dark ? "#4E4458" : "#E2D6EA"; c.beginPath(); c.roundRect(0, 0, w, h, 10); c.fill(); c.fillStyle = dark ? "#E2D6EA" : "#6A4E7A"; c.font = `${h * 0.5}px ${JUA}`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("← 옆 동네 골목길", w / 2, h * 0.54); }, 1.24, hz(14), "i", 0.95, 12.62, hz(54));
}
/* 출구 · 쉼터 울타리 */
function fence(a, b, fixed, axis, h = 20){
  const n = Math.max(1, Math.round((b - a) / 0.42));
  for(let k = 0; k <= n; k++){ const u = a + (b - a) * k / n; axis === "i" ? B(u - 0.03, fixed - 0.03, 0.06, 0.06, h, WHITE, 0, {r:0}) : B(fixed - 0.03, u - 0.03, 0.06, 0.06, h, WHITE, 0, {r:0}); }
  [6, h - 5].forEach(z => axis === "i" ? B(a, fixed - 0.015, b - a, 0.03, 1.6, WHITE, z, {r:0}) : B(fixed - 0.015, a, 0.03, b - a, 1.6, WHITE, z, {r:0}));
}

/* ---------- 왼줄 가게 (앞 +i) ---------- */
function buildLeft(){
  const F = ROWJ.map(([a, b]) => FR("+i", LB0, a, LF, b));
  // 뒷벽 이어서 (광장 반대쪽)
  [[FJ, XJ0], [XJ1, 19.0]].forEach(([a, b]) => B(LB0 - 0.06, a, 0.12, b - a, 84, D("#EFE4DA", "#433A33"), 0, {r:0}));
  [XJ0, XJ1].forEach(j => B(LB0 - 0.02, j - 0.06, LF - LB0 + 0.02, 0.12, 46, D("#EFE4DA", "#433A33"), 0, {r:0}));   // 가로 골목 쪽 막음
  B(LB0, 18.8, LF - LB0, 0.2, 46, D("#EFE4DA", "#433A33"), 0, {r:0});
  // ① 과일가게
  { const f = F[0]; stall(f, {c1:D("#E06A55", "#8A4438"), c2:WHITE, sign:"싱싱 과일", sub:"꿀사과 · 귤 · 단감", bg:D("#FCE9B8", "#6A5E4A"), fg:D("#C0503F", "#FFD0C0"), emo:"🍎", signO:{back:false}, wall:D("#FFF3EE", "#4A3E3A")});
    f.LB(0.1, 0.33, f.Wd - 0.2, 0.31, 8, WOODD, 22, {r:0});
    pile(f, 0.18, 0.02, 5, 2, 0.068, D("#E04A44", "#8A2E2E"), 22); pile(f, 0.95, 0.02, 4, 2, 0.058, D("#F28C28", "#9A5A20"), 22); pile(f, 1.5, 0.02, 4, 2, 0.072, D("#E8D28A", "#8A7A4A"), 22);
    pile(f, 0.2, 0.36, 4, 2, 0.06, D("#F0802A", "#9A5020"), 30); pile(f, 0.85, 0.36, 4, 2, 0.065, D("#D9433E", "#8A2A2A"), 30);
    for(let k = 0; k < 3; k++){ const [i, j] = f.P(1.6 + k * 0.28, 0.48); for(let n = 0; n < 9; n++) ball(i + (rnd(n + k * 9) - 0.5) * 0.1, j + (rnd(n * 3 + k) - 0.5) * 0.1, 31 + (n % 4) * 2.2 - (n / 3 | 0) * 0.8, 0.033, D("#7A4A9A", "#4A2E5E"), "m", 6); }   // 포도
    { const [i, j] = f.P(2.62, 0.48); B(i - 0.13, j - 0.14, 0.26, 0.28, 6, WHITE, 30, {r:0.02}); disc(i - 0.135, j, 0.08, 31, 0.2, D("#E06A55", "#8A4438"), "s", 14).rotation.z = PI / 2; disc(i, j, 0.15, 36, 0.8, METAL, "s", 18); pile(f, 2.52, 0.38, 2, 2, 0.05, D("#E04A44", "#8A2E2E"), 37, 6); }   // 저울
    [[0.5, "3,000"], [1.25, "5천원"], [1.85, "1,000"], [2.5, "한 근"]].forEach(([u, t]) => price(f, u, 0, 14, t));
    [[0.15, D("#C9A27A", "#5A4632")], [0.75, D("#7FB0E0", "#3A5A7A")]].forEach(([u, cc]) => { const [i, j] = f.P(u, -0.42); crate(i - 0.4, j, 0.4, 0.52, 11, cc); pile(FR("+i", i - 0.4, j, i, j + 0.52), 0.04, 0.02, 3, 3, 0.07, u < 0.5 ? D("#F28C28", "#9A5A20") : D("#E04A44", "#8A2E2E"), 11); });
    [[1.9, 2.05], [1.9, 2.6], [2.5, 2.05]].forEach(([v, u], k) => { const [i, j] = f.P(u, v); crate(i - 0.48, j - 0.24, 0.48, 0.48, 12 + k * 0, k % 2 ? D("#72C4AE", "#3E6E60") : D("#F4A7B9", "#7A5866"), 0); }); }
  // ② 떡집: 무지개떡 · 꿀떡 · 인절미 · 가래떡 + 떡 시루
  { const f = F[1]; stall(f, {c1:PINK, c2:WHITE, sign:"크레용 떡집", sub:"무지개떡 · 꿀떡 · 인절미", bg:D("#F4D3DF", "#6A4E5A"), fg:D("#9A4E6A", "#FFE3EC"), emo:"🍡", signO:{back:false}, wall:D("#FFF0F4", "#4A3C42")});
    for(let n = 0; n < 4; n++){ const u = 0.22 + n * 0.42; RB.forEach((cc, k) => f.LB(u, 0.08, 0.34, 0.3, 1.5, cc, 22 + k * 1.5, {r:0})); f.LB(u, 0.08, 0.34, 0.3, 0.8, WHITE, 31, {r:0}); }   // 무지개떡 덩이
    { const [i, j] = f.P(2.25, 0.22); B(i - 0.22, j - 0.32, 0.44, 0.64, 1.2, D("#E6D2B0", "#5A4A38"), 22, {r:0.02}); for(let n = 0; n < 15; n++) ball(i - 0.15 + (n % 3) * 0.15, j - 0.25 + (n / 3 | 0) * 0.125, 25, 0.045, ["#F4A7B9", "#FFFFFF", "#A8DCC8", "#F6E39A"][n % 4], "m", 8); }   // 꿀떡
    for(let n = 0; n < 6; n++) f.LB(0.2 + n * 0.25, 0.42, 0.2, 0.18, 4, D("#E9C98A", "#7A6440"), 22, {r:0.015});                        // 인절미
    for(let n = 0; n < 4; n++) { const [i, j] = f.P(2.22, 0.49 + n * 0.042); f.alongU(K.sm(K.cyl(0.02, 0.02, 0.6, 8), WHITE, X(i), hz(23), Z(j), null, "m")); }   // 가래떡
    f.LB(0.1, 0.02, 2.82, 0.62, 13, D("#DDEEF6", "#7A90B8"), 23.4, {r:0, cls:"glass"});                                            // 진열 유리
    f.LB(0.08, 0.0, 2.86, 0.66, 1, WHITE, 36.6, {r:0, cls:"s"});
    [[0.3, PINK2], [0.75, MINT2], [1.2, D("#FCE9B8", "#6A5E4A")], [1.65, LILAC2]].forEach(([u, cc]) => f.LB(u, 0.12, 0.38, 0.38, 3, cc, 37.6, {r:0.02}));   // 떡 팩
    { const [i, j] = f.P(2.3, 2.3); B(i - 0.35, j - 0.35, 0.7, 0.7, 14, INK, 0, {r:0.04}); tub(i, j, 0.3, 0.34, 14, 14, D("#C9A27A", "#5A4632"), "m", 18); tub(i, j, 0.34, 0.3, 28, 10, D("#C9A27A", "#5A4632"), "m", 18); disc(i, j, 0.33, 38, 1.5, WHITE, "m", 18); W.steam.push([i, j, 40, 6, 0.08, 0.00045, 0.09]); }   // 떡 시루
    [[0.15, "2,000"], [1.05, "3,000"], [2.25, "한 팩"]].forEach(([u, t]) => price(f, u + 0.3, 0, 14, t, "#B5607E")); }
  // ③ 반찬가게: 네모 반찬 통 · 김치 냉장고
  { const f = F[2]; stall(f, {c1:SPROUT, c2:WHITE, sign:"엄마손 반찬", sub:"오늘 만든 반찬", bg:D("#CDEBE2", "#3E5A54"), fg:D("#2F6E62", "#CDEBE2"), emo:"🥢", signO:{back:false}, wall:D("#F0FAF6", "#3A4642")});
    const BC = ["#D9503F", "#E07A5F", "#5E9B4E", "#F2E6B8", "#9A7650", "#F4C542", "#7A4A30", "#C9A884", "#8DBF6A", "#4F7A3A", "#3A2A20", "#E8B060"];
    for(let r = 0; r < 2; r++) for(let n = 0; n < 6; n++){ const u = 0.12 + n * 0.395, v = 0.04 + r * 0.31; f.LB(u, v, 0.37, 0.28, 3, WHITE, 22, {r:0.02}); f.LB(u + 0.03, v + 0.03, 0.31, 0.22, 1.4, BC[(r * 6 + n) % BC.length], 24.2, {r:0.03});
      const [i, j] = f.P(u + 0.185, v + 0.14); ball(i, j, 25.4, 0.09, BC[(r * 6 + n) % BC.length], "m", 8).scale.y = 0.35; }
    { const [i, j] = f.P(1.3, 2.75); B(i - 0.25, j - 0.6, 0.6, 1.2, 50, WHITE, 0, {r:0.03}); K.faceI(i + 0.35, j - 0.55, j + 0.55, 8, 46, D("#DDEEF6", "#7A90B8"), "glass", 0.012);
      [[16, "#D9503F"], [28, "#5E9B4E"], [40, "#F4C542"]].forEach(([z, cc], n) => { for(let k = 0; k < 4; k++) B(i + 0.05, j - 0.5 + k * 0.26, 0.26, 0.2, 7, D(cc, K.shade(cc, -0.5)), z + 1, {r:0.02}); }); }
    [[0.4, "5천원"], [1.2, "3팩 만원"], [2.0, "4,000"]].forEach(([u, t]) => price(f, u, 0, 14, t, "#2F6E62")); }
  // ④ 생선가게: 얼음판 · 생선 줄 · 고무 대야 (문어)
  { const f = F[3]; stall(f, {c1:SKY, c2:WHITE, sign:"싱싱 생선", sub:"고등어 · 갈치 · 조기", bg:D("#D6E8F6", "#3A4A5E"), fg:D("#3A6A9A", "#D6E8F6"), emo:"🐟", signO:{back:false}, ctrC:D("#E6EEF4", "#4A5460"), topC:D("#FFFFFF", "#7A8A9A"), wall:D("#F0F6FA", "#3A424A")});
    f.LB(0.1, 0.0, f.Wd - 0.2, 0.64, 2, D("#EAF4FA", "#8AA0B4"), 22, {r:0});
    for(let n = 0; n < 40; n++) f.ball(0.15 + rnd(n) * (f.Wd - 0.3), 0.04 + rnd(n + 50) * 0.56, 24, 0.035, D("#FFFFFF", "#B8C8D8"), "m", 5);
    const FISH = [[D("#5E7FA0", "#34485C"), 0.36, 0.07], [D("#D0D8E0", "#7A8490"), 0.55, 0.045], [D("#D9B45A", "#7A6430"), 0.3, 0.065], [D("#E89A9A", "#8A5454"), 0.34, 0.08]];
    for(let n = 0; n < 10; n++){ const [c0, L, r] = FISH[n % 4], u = 0.2 + n * 0.27, [i, j] = f.P(u, 0.32);
      const b = ball(i, j, 25.5, r, c0, "s", 10); b.scale.set(L / r / 2 * (f.face[1] === "i" ? 1 : 0.4), 0.55, f.face[1] === "i" ? 0.9 : L / r / 2);   // 앞쪽(통로)을 보게 눕힘
      const t = K.sm(myGeo(new THREE.ConeGeometry(r * 0.9, r * 1.6, 3)), c0, X(i - L / 2 - r * 0.3), hz(25.5), Z(j), null, "s"); t.rotation.z = -PI / 2; t.scale.z = 0.35;
      ball(i + L / 2 - r * 0.6, j + r * 0.45, 26.5, 0.012, INK, "s", 5); }
    { const [i, j] = f.P(2.6, -0.4); tub(i, j, 0.28, 0.34, 0, 10.5, D("#E04A44", "#8A3434"), "m", 18); disc(i, j, 0.31, 9.6, 0.6, D("#9FCDEB", "#3A5A7A"), "glass", 18);
      ball(i, j, 11.5, 0.1, D("#B57AB8", "#6A4470"), "m", 10); for(let k = 0; k < 6; k++) { const a = k / 6 * PI * 2; ball(i + Math.cos(a) * 0.14, j + Math.sin(a) * 0.14, 10, 0.035, D("#B57AB8", "#6A4470"), "m", 6); }
      ball(i - 0.03, j + 0.08, 13, 0.016, INK, "s", 5); ball(i + 0.04, j + 0.08, 13, 0.016, INK, "s", 5); }
    { const [i, j] = f.P(0.5, -0.38); crate(i - 0.42, j - 0.25, 0.42, 0.5, 10.5, D("#7FB0E0", "#3A5A7A")); for(let n = 0; n < 9; n++) ball(i - 0.35 + (n % 3) * 0.13, j - 0.17 + (n / 3 | 0) * 0.15, 11.3, 0.05, D("#C9B8A2", "#5A5046"), "m", 6).scale.y = 0.6; }   // 조개
    [[0.6, "2마리 5천"], [1.5, "1만원"], [2.4, "국산"]].forEach(([u, t]) => price(f, u, 0, 14, t, "#3A6A9A")); }
  // ⑤ 호떡 · 어묵 노점: 철판(호떡은 움직임) · 어묵 통 · 떡볶이 판
  { const f = F[4]; stall(f, {c1:AMBER, c2:CREAM, sign:"호떡 · 어묵", sub:"꿀호떡 1,000원 · 떡볶이", bg:D("#FCE0B4", "#6A5236"), fg:D("#B5602A", "#FFE0C0"), emo:"🥞", signO:{back:false}, ctrC:METAL, topC:D("#E6E9EC", "#5A5E64"), wall:D("#FFF6EA", "#4A4036")});
    f.LB(0.18, 0.06, 1.15, 0.52, 2, D("#3A3A3C", "#222224"), 22, {r:0});                                                            // 호떡 철판
    { const [i0, j0] = f.P(0.18, 0.06); W.hotteok = []; for(let n = 0; n < 6; n++){ const [i, j] = f.P(0.34 + (n % 3) * 0.38, 0.2 + (n / 3 | 0) * 0.24); W.hotteok.push([i, j]); } }
    f.LB(1.42, 0.06, 0.95, 0.52, 7, STEEL, 22, {r:0}); f.LB(1.46, 0.1, 0.87, 0.44, 0.6, D("#E0B070", "#7A5A30"), 28.6, {r:0});         // 어묵 통 + 국물
    for(let n = 0; n < 9; n++){ const [i, j] = f.P(1.55 + (n % 5) * 0.17, 0.18 + (n / 5 | 0) * 0.22); rod([i, j, 26], [i + 0.02, j + 0.04, 44], 0.006, D("#E9D2B0", "#6A5A48"), "s", 4);
      const e = B(i - 0.06, j - 0.015, 0.12, 0.03, 9, D("#E8C890", "#8A6A40"), 29, {r:0.01}); e.rotation.y = n * 0.4; }
    W.steam.push([...f.P(1.9, 0.3), 30, 5, 0.12, 0.0005, 0.08]);
    { const [i, j] = f.P(2.78, 0.32); disc(i, j, 0.3, 22, 2.5, INK, "s", 22); disc(i, j, 0.27, 24.5, 0.6, D("#D9433E", "#7A2A26"), "m", 22);
      for(let n = 0; n < 10; n++) { const a = n * 2.4, r = 0.06 + (n % 3) * 0.06; f.alongU(K.sm(K.cyl(0.018, 0.018, 0.1, 6), WHITE, X(i + Math.cos(a) * r), hz(25.6), Z(j + Math.sin(a) * r), null, "m")).rotation.y = a; } W.steam.push([i, j, 27, 3, 0.1, 0.0004, 0.06]); }
    { const [i, j] = f.P(2.95, 0.85); for(let k = 0; k < 6; k++) tub(i, j, 0.05, 0.065, 22 + k * 0.9, 3.4, WHITE, "m", 10); }   // 종이컵
    [[0.6, "1,000"], [1.8, "1개 500"], [2.75, "3,000"]].forEach(([u, t]) => price(f, u, 0, 14, t, "#B5602A"));
    [[2.55, PINK], [2.98, LILAC]].forEach(([u, cc]) => { const [i, j] = f.P(u, -0.36); stool(i, j, cc); });   // 앞 플라스틱 의자 (어묵 먹는 손님용)
  }
  // 사장님 인형 (npc 자리 tteok · fishm · hotteok 은 비워 둠)
  vendor(12.45, 2.5, PI / 2, LOOK.fruit); vendor(12.45, 8.7, PI / 2, LOOK.banchan);
}
/* ---------- 오른줄 가게 (앞 −i). 뒷벽 바깥(광장 쪽)은 벽화 ---------- */
function mural(j0, j1, kind){
  const w = j1 - j0, H = 82;
  K.decal(Math.round(w * 120), Math.round(hz(H) * 120), (c, W2, H2, dark) => {
    const g = c.createLinearGradient(0, 0, 0, H2); g.addColorStop(0, dark ? "#2E3450" : "#D8ECF8"); g.addColorStop(1, dark ? "#463A52" : "#FBEAF0"); c.fillStyle = g; c.fillRect(0, 0, W2, H2);
    if(kind === 0){ RB.forEach((cc, k) => { c.strokeStyle = cc; c.lineWidth = H2 * 0.06; c.beginPath(); c.arc(W2 * 0.55, H2 * 1.15, H2 * (0.95 - k * 0.06), PI, 0); c.stroke(); });
      [[0.18, 0.3, 0.1], [0.82, 0.25, 0.09], [0.4, 0.72, 0.08], [0.72, 0.68, 0.1]].forEach(([x, y, r]) => { c.fillStyle = dark ? "#D8D0E8" : "#FFFFFF"; [[-1, 0.1, 0.7], [0, -0.25, 1], [1, 0.05, 0.75]].forEach(([dx, dy, rr]) => { c.beginPath(); c.arc(W2 * x + dx * H2 * r, H2 * y + dy * H2 * r, rr * H2 * r, 0, 7); c.fill(); }); });
      c.font = `${H2 * 0.13}px ${JUA}`; c.textAlign = "center"; c.fillStyle = dark ? "#F4C7D4" : "#B5607E"; c.fillText("무지개 구름 시장 🌈 다 같이 웃는 날", W2 * 0.55, H2 * 0.92); }
    else { const fr = [["🍎", 0.1], ["🥬", 0.24], ["🐟", 0.38], ["🍡", 0.52], ["🥕", 0.66], ["🍠", 0.8], ["🌷", 0.92]];
      c.fillStyle = dark ? "#3E5A54" : "#CDEBE2"; c.beginPath(); c.moveTo(0, H2); c.quadraticCurveTo(W2 * 0.3, H2 * 0.55, W2 * 0.6, H2 * 0.75); c.quadraticCurveTo(W2 * 0.85, H2 * 0.9, W2, H2 * 0.62); c.lineTo(W2, H2); c.fill();
      fr.forEach(([e, x], k) => { c.font = `${H2 * 0.24}px ${EMOF}`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(e, W2 * x, H2 * (0.42 + (k % 2) * 0.16)); });
      c.font = `${H2 * 0.12}px ${JUA}`; c.fillStyle = dark ? "#FCE9B8" : "#9A6A30"; c.fillText("크레용 시장 친구들 ♥", W2 * 0.5, H2 * 0.13); }
  }, w, hz(H), "j", RB1 + 0.06, (j0 + j1) / 2, hz(H / 2 + 1));
}
function buildRight(){
  const F = ROWJ.map(([a, b]) => FR("-i", RF, a, RB1, b));
  [[FJ, XJ0], [XJ1, 19.0]].forEach(([a, b]) => B(RB1 - 0.06, a, 0.12, b - a, 84, D("#EFE4DA", "#433A33"), 0, {r:0}));
  [XJ0, XJ1].forEach(j => B(RF, j - 0.06, RB1 - RF + 0.02, 0.12, 46, D("#EFE4DA", "#433A33"), 0, {r:0}));
  B(RF, 18.8, RB1 - RF, 0.2, 46, D("#EFE4DA", "#433A33"), 0, {r:0});
  mural(FJ + 0.05, XJ0 - 0.05, 0); mural(XJ1 + 0.1, 18.95, 1);
  // ① 잡곡 · 건어물: 곡식 자루 · 멸치 상자 · 김
  { const f = F[0]; stall(f, {c1:D("#C9A27A", "#5A4632"), c2:CREAM, sign:"잡곡 · 건어물", sub:"햅쌀 · 콩 · 멸치 · 김", bg:D("#F3E6D0", "#4E4436"), fg:D("#7A5A3A", "#F3E6D0"), emo:"🌾"});
    const GR = ["#F4F0E6", "#D9C49A", "#C9A15A", "#2E2A2A", "#8A3A3A", "#F2C94C", "#C8B07A", "#7FA65A"];
    for(let r = 0; r < 2; r++) for(let n = 0; n < 8; n++){ const [i, j] = f.P(0.2 + n * 0.37, 0.17 + r * 0.31); tub(i, j, 0.15, 0.16, 22, 7, D("#E6D8BE", "#5A5040"), "m", 12); disc(i, j, 0.14, 28.6, 1, GR[(n + r * 3) % 8], "m", 12); }
    [[0.3, "#C9D3DC"], [0.85, "#B8C2CC"]].forEach(([u, cc]) => { const [i, j] = f.P(u, -0.35); crate(i - 0.25, j - 0.25, 0.42, 0.5, 10.5, D("#E6D8BE", "#5A5040")); for(let n = 0; n < 14; n++) ball(i - 0.18 + rnd(n) * 0.3, j - 0.18 + rnd(n + 9) * 0.36, 11.3, 0.025, cc, "m", 5).scale.set(2, 0.5, 0.6); });
    for(let n = 0; n < 6; n++) f.LB(0.25 + n * 0.45, 3.06, 0.38, 0.3, 4, D("#2E3A2A", "#1E241C"), 50.6 + (n % 2) * 4, {r:0.01});   // 김 묶음 (선반)
    [[0.4, "1kg 5천"], [1.4, "국산 콩"], [2.4, "햅쌀"]].forEach(([u, t]) => price(f, u, 0, 14, t, "#7A5A3A")); }
  // ② 순대 · 만두: 찜기 탑 (김) · 순대 도마 · 만두 판
  { const f = F[1]; stall(f, {c1:LILAC, c2:WHITE, sign:"순대 · 만두", sub:"손만두 · 찰순대 · 김이 모락모락", bg:D("#E2D6EA", "#4E4458"), fg:D("#6A4E7A", "#E2D6EA"), emo:"🥟", ctrC:METAL, topC:D("#E6E9EC", "#5A5E64")});
    [[0.45, 0.32], [1.1, 0.32]].forEach(([u, v]) => { const [i, j] = f.P(u, v); for(let k = 0; k < 3; k++){ tub(i, j, 0.27, 0.27, 22 + k * 7, 6.4, D("#D9B98F", "#6B5440"), "m", 18); disc(i, j, 0.275, 28 + k * 7, 0.6, D("#B89870", "#4E3C2C"), "m", 18); }
      K.sm(myGeo(new THREE.SphereGeometry(0.27, 18, 6, 0, PI * 2, 0, PI * 0.35)), D("#D9B98F", "#6B5440"), X(i), hz(43), Z(j), null, "m"); ball(i, j, 50, 0.04, WOODD, "s", 6);
      W.steam.push([i, j, 50, 6, 0.1, 0.0006, 0.1]); });
    { const [i, j] = f.P(1.95, 0.32); B(i - 0.22, j - 0.3, 0.44, 0.6, 3, WOOD, 22, {r:0.02}); const t = K.sm(myGeo(new THREE.TorusGeometry(0.14, 0.04, 8, 20)), D("#4A2A30", "#2A181C"), X(i), hz(26.4), Z(j - 0.05), null, "m"); t.rotation.x = PI / 2;
      for(let n = 0; n < 5; n++) disc(i + 0.12, j + 0.16 - n * 0.075, 0.035, 25, 1.4, D("#4A2A30", "#2A181C"), "m", 10); }
    { const [i, j] = f.P(2.6, 0.32); disc(i, j, 0.28, 22, 2.5, D("#D9B98F", "#6B5440"), "m", 18); for(let n = 0; n < 12; n++) { const a = n * 0.52, r = n < 6 ? 0.19 : 0.09; ball(i + Math.cos(a) * r, j + Math.sin(a) * r, 26, 0.05, D("#FFFBF2", "#B8B0A2"), "m", 8).scale.y = 0.7; } }
    [[0.8, "1판 5천"], [1.9, "순대 4천"], [2.6, "왕만두"]].forEach(([u, t]) => price(f, u, 0, 14, t, "#6A4E7A")); }
  // ③ 만물 잡화: 바구니 탑 · 고무장갑 · 빗자루 · 냄비
  { const f = F[2]; stall(f, {c1:LEAF, c2:WHITE, sign:"만물 잡화", sub:"바구니 · 고무장갑 · 냄비", bg:D("#E6F4EC", "#3A4A42"), fg:D("#2F6E62", "#CDEBE2"), emo:"🧺"});
    const BK = [PINK, MINT2, D("#FCE9B8", "#6A5E4A"), LILAC, SKY];
    [[0.35, 0.3], [0.95, 0.3], [1.55, 0.3]].forEach(([u, v], n) => { const [i, j] = f.P(u, v); for(let k = 0; k < 4; k++) tub(i, j, 0.2, 0.25, 22 + k * 3.2, 5, BK[(n + k) % 5], "m", 14); });
    { const [i, j] = f.P(2.15, 0.32); for(let k = 0; k < 3; k++) tub(i, j, 0.17 - k * 0.02, 0.17 - k * 0.02, 22 + k * 6, 6, METAL, "s", 16); disc(i, j, 0.1, 40, 1, METAL, "s", 12); }
    rod([...f.P(0.2, 0.05), 64], [...f.P(f.Wd - 0.2, 0.05), 64], 0.012, WOODD, "s", 6);
    for(let n = 0; n < 6; n++){ const [i, j] = f.P(0.4 + n * 0.36, 0.05); B(i - 0.05, j - 0.08, 0.1, 0.16, 12, n % 2 ? D("#F4A7B9", "#7A5866") : D("#F6E39A", "#8A7A3A"), 50, {r:0.03}); }   // 고무장갑
    [[2.5, -0.3], [2.65, -0.3]].forEach(([u, v], k) => { const [i, j] = f.P(u, v); rod([i, j, 6], [i + 0.05, j, 52], 0.014, WOODD); B(i - 0.07, j - 0.1, 0.14, 0.2, 10, D("#E8C870", "#7A6A3A"), 0, {r:0.02}); });   // 빗자루
    [[0.5, "2,000"], [1.5, "3개 5천"], [2.2, "냄비"]].forEach(([u, t]) => price(f, u, 0, 14, t, "#2F6E62")); }
  // ④ 전집: 큰 번철 · 전 · 모듬전 쟁반
  { const f = F[3]; stall(f, {c1:AMBER, c2:WHITE, sign:"고소한 전집", sub:"파전 · 동그랑땡 · 모듬전", bg:D("#FCE9B8", "#6A5E4A"), fg:D("#9A6A30", "#FCE9B8"), emo:"🍳"});
    { const [i, j] = f.P(0.75, 0.33); disc(i, j, 0.45, 22, 2.5, INK, "s", 24); [[0, 0, 0.16, "#9DBF6A"], [-0.2, 0.15, 0.1, "#F2C45A"], [0.2, -0.12, 0.1, "#F2C45A"], [0.18, 0.2, 0.09, "#E8A060"], [-0.18, -0.2, 0.09, "#F2C45A"]].forEach(([di, dj, r, cc]) => disc(i + di, j + dj, r, 24.5, 1.2, cc, "m", 14)); W.steam.push([i, j, 27, 3, 0.15, 0.00035, 0.06]); }
    [[1.6, 0.3], [2.3, 0.3]].forEach(([u, v], n) => { const [i, j] = f.P(u, v); disc(i, j, 0.3, 22, 1.4, WHITE, "s", 20); for(let k = 0; k < 9; k++) disc(i + Math.cos(k * 0.7) * (k < 5 ? 0.18 : 0.08), j + Math.sin(k * 0.7) * (k < 5 ? 0.18 : 0.08), 0.065, 23.6 + (k % 2) * 0.8, 1.2, ["#F2C45A", "#E8A060", "#9DBF6A", "#D98A50"][(k + n) % 4], "m", 10); });
    { const [i, j] = f.P(2.85, 0.15); tub(i, j, 0.06, 0.07, 22, 3, WHITE, "m", 10); disc(i, j, 0.055, 24.8, 0.4, D("#5A3020", "#2A1810"), "m", 10); }
    [[0.7, "파전 5천"], [1.6, "1만원"], [2.4, "한 접시"]].forEach(([u, t]) => price(f, u, 0, 14, t, "#9A6A30")); }
  // ⑤ 꽈배기 · 도넛: 유리 진열장 · 튀김 솥
  { const f = F[4]; stall(f, {c1:PINK, c2:CREAM, sign:"꽈배기 · 도넛", sub:"찹쌀도넛 · 팥도넛", bg:D("#F7DCE6", "#6A4E5A"), fg:D("#B5607E", "#FFE3EC"), emo:"🍩"});
    for(let n = 0; n < 9; n++){ const [i, j] = f.P(0.25 + (n % 5) * 0.3, 0.15 + (n / 5 | 0) * 0.26); const t = K.sm(myGeo(new THREE.TorusGeometry(0.07, 0.03, 6, 14)), D("#E8B870", "#7A5A30"), X(i), hz(24), Z(j), null, "m"); t.rotation.x = PI / 2; t.scale.set(1.5, 0.6, 1); t.rotation.z = 0.5; }
    for(let n = 0; n < 8; n++) f.ball(1.75 + (n % 4) * 0.18, 0.16 + (n / 4 | 0) * 0.22, 24.4, 0.07, n % 3 ? D("#E2A456", "#7A5428") : D("#F4E6D0", "#8A8070"), "m", 10);
    f.LB(0.1, 0.02, 2.3, 0.62, 12, D("#DDEEF6", "#7A90B8"), 23.4, {r:0, cls:"glass"}); f.LB(0.08, 0, 2.34, 0.66, 1, WHITE, 35.4, {r:0, cls:"s"});
    { const [i, j] = f.P(2.75, 0.33); tub(i, j, 0.26, 0.28, 22, 9, STEEL, "s", 20); disc(i, j, 0.25, 31, 0.6, D("#E8B040", "#7A5A20"), "m", 20); W.steam.push([i, j, 33, 3, 0.1, 0.0003, 0.05]); }
    [[0.5, "3개 2천"], [1.6, "1,000"], [2.6, "갓 튀김"]].forEach(([u, t]) => price(f, u, 0, 14, t, "#B5607E")); }
  vendor(17.55, 2.5, -PI / 2, LOOK.grain); vendor(17.55, 5.7, -PI / 2, LOOK.mandu); vendor(17.55, 8.7, -PI / 2, LOOK.shop); vendor(17.55, 13.9, -PI / 2, LOOK.jeon); vendor(17.55, 17.2, -PI / 2, LOOK.donut);
}
/* ---------- 방앗간 골목 (북쪽 가게 앞 +j, 건물 1층) ---------- */
function shopFront(F, o){
  F.LB(0.04, 0, F.Wd - 0.08, 0.62, 20.4, o.ctrC || WOOD, 0, {r:0}); F.LB(0.02, -0.02, F.Wd - 0.04, 0.66, 1.6, CREAM, 20.4, {r:0});
  F.LB(0.04, -0.012, F.Wd - 0.08, 0.01, 4, o.c1, 4, {r:0});
  [0.03, F.Wd - 0.1].forEach(u => F.LB(u, -0.04, 0.07, 0.07, 70, WOODD, 0, {r:0}));
  awning(F, o.c1, o.c2 || WHITE, {v0:-0.6, v1:F.Dp - 0.02, zf:66, zb:84});
  // 가게 안쪽 벽 (건물 앞면) + 간판 (차양 위 건물 벽에)
  const [i, j] = F.P(F.Wd / 2, F.Dp);
  K.faceJ(F.P(0, 0)[0] + 0.02, F.P(F.Wd, 0)[0] - 0.02, NWJ, 0, 62, o.wall || PAPER, "m", 0.012);
  K.decal(Math.round((F.Wd - 0.3) * 150), Math.round(hz(20) * 150), signDraw(o.sign, o.sub, o.bg, o.fg, o.emo), F.Wd - 0.3, hz(20), "i", i, NWJ, hz(96));
  K.faceJ(F.P(0, 0)[0] + 0.08, F.P(F.Wd, 0)[0] - 0.08, NWJ, 85, 107, o.wall || PAPER, "m", 0.008);
  [F.Wd * 0.3, F.Wd * 0.72].forEach(u => { const [a, b] = F.P(u, 0.3); rod([a, b, 76], [a, b, 63], 0.006, INK, "s", 4); ball(a, b, 61, 0.045, D("#FFF1C8", "#FFE4A0"), "glow", 8); gl(a, b, 61, 26, "#FFD68C", (tm, dk) => dk ? 0.55 : 0.04); });
}
function buildAlley(){
  // ① 방앗간 · 참기름
  { const f = FR("+j", 0.3, NWJ, 3.6, SJ); shopFront(f, {c1:AMBER, c2:CREAM, sign:"크레용 방앗간", sub:"참기름 · 들기름 · 고춧가루", bg:D("#FCE0B4", "#6A5236"), fg:D("#9A5A20", "#FFE0C0"), emo:"🫙", wall:D("#FFF1DC", "#4A4034")});
    for(let n = 0; n < 12; n++){ const u = 0.25 + (n % 6) * 0.45, v = 0.15 + (n / 6 | 0) * 0.26, [i, j] = f.P(u, v); K.sm(K.cyl(0.05, 0.055, hz(10), 10), n % 3 === 2 ? D("#7A5A1A", "#3A2A10") : D("#D9902A", "#7A5018"), X(i), hz(22 + 5), Z(j), null, "glass");
      K.sm(K.cyl(0.02, 0.03, hz(3.4), 8), n % 3 === 2 ? D("#7A5A1A", "#3A2A10") : D("#D9902A", "#7A5018"), X(i), hz(33.7), Z(j), null, "glass"); disc(i, j, 0.022, 35.4, 1.4, RED, "s", 8); }
    { const [i, j] = f.P(2.9, 1.15); B(i - 0.32, j - 0.3, 0.64, 0.5, 34, METAL, 0, {r:0.04}); K.sm(K.cyl(0.16, 0.16, 0.5, 16), STEEL, X(i), hz(42), Z(j - 0.05), null, "s").rotation.z = PI / 2;
      disc(i + 0.2, j + 0.21, 0.12, 20, 0.6, D("#F6E39A", "#8A7A3A"), "glow", 12).rotation.x = PI / 2; W.steam.push([i, j - 0.05, 48, 5, 0.1, 0.00045, 0.09]); }   // 볶는 기계
    [[0.4, -0.4, "#E8D8B0"], [0.95, -0.4, "#D9433E"], [1.5, -0.42, "#2E2A2A"]].forEach(([u, v, cc]) => { const [i, j] = f.P(u, v); tub(i, j, 0.2, 0.21, 0, 13, D("#E6D8BE", "#5A5040"), "m", 14); disc(i, j, 0.19, 12.5, 1.2, cc, "m", 14); });
    [[0.6, "참기름"], [1.6, "1병 1만"], [2.5, "고춧가루"]].forEach(([u, t]) => price(f, u, 0, 13, t, "#9A5A20"));
    vendor(2.0, 7.65, 0, LOOK.sesame); }
  // ② 채소 할머니: 내린 셔터 앞 파란 돗자리 · 다라이 · 큰 파라솔 (할머니는 npc halmi)
  { const i0 = 3.8, i1 = 6.6;
    K.faceJ(i0 + 0.05, i1 - 0.05, NWJ, 0, 70, D("#B8BCC2", "#4A4E54"), "s", 0.02); for(let z = 3; z < 70; z += 3.5) K.faceJ(i0 + 0.05, i1 - 0.05, NWJ + 0.021, z, z + 0.6, D("#A0A4AA", "#3A3E44"), "s", 0.004);
    K.decal(Math.round(2.5 * 150), Math.round(hz(20) * 150), signDraw("할머니 채소", "직접 키운 거여~", D("#E6F4D8", "#3A4A32"), D("#4E7A3A", "#D6F0C0"), "🥬"), 2.5, hz(20), "i", (i0 + i1) / 2, NWJ, hz(96));
    K.faceJ(i0 + 0.08, i1 - 0.08, NWJ, 85, 107, D("#F6FBEE", "#3A4434"), "m", 0.008);
    const BA = [[4.2, 8.85, "#D9433E"], [4.75, 8.75, "#5A8AD0"], [5.65, 8.8, "#D9433E"], [6.2, 8.85, "#F4A7B9"], [4.45, 9.2, "#5A8AD0"], [5.95, 9.2, "#D9433E"]];
    BA.forEach(([i, j, cc], k) => { tub(i, j, 0.17, 0.21, 0, 4.5, D(cc, K.shade(cc, -0.5)), "m", 14);
      const it = k % 6; if(it === 0) for(let n = 0; n < 10; n++){ const b = ball(i + (rnd(n) - 0.5) * 0.24, j + (rnd(n + 4) - 0.5) * 0.24, 6, 0.03, D("#D9302A", "#7A2020"), "m", 6); b.scale.set(2.2, 0.8, 0.8); b.rotation.y = n; }   // 고추
      else if(it === 1) for(let n = 0; n < 7; n++) ball(i + (rnd(n + 2) - 0.5) * 0.22, j + (rnd(n + 7) - 0.5) * 0.22, 6.6, 0.045, D("#F8F4EA", "#A8A49A"), "m", 7);   // 마늘
      else if(it === 2) for(let n = 0; n < 6; n++) ball(i + (rnd(n + 3) - 0.5) * 0.2, j + (rnd(n + 8) - 0.5) * 0.2, 6.8, 0.055, D("#B88A5A", "#5A4430"), "m", 7);   // 감자
      else if(it === 3) for(let n = 0; n < 4; n++){ const b = ball(i + (rnd(n + 5) - 0.5) * 0.16, j + (rnd(n + 1) - 0.5) * 0.2, 7, 0.05, D("#9A3A5A", "#4A1E2E"), "m", 7); b.scale.set(1.8, 0.9, 0.9); b.rotation.y = n * 0.7; }   // 고구마
      else if(it === 4) for(let n = 0; n < 5; n++){ const b = ball(i + (rnd(n + 6) - 0.5) * 0.2, j + (rnd(n + 2) - 0.5) * 0.14, 7, 0.05, D("#8DBF5A", "#3E5A2A"), "m", 7); b.scale.set(2.4, 0.9, 0.9); }   // 애호박
      else for(let n = 0; n < 6; n++) ball(i + (rnd(n + 9) - 0.5) * 0.22, j + (rnd(n + 3) - 0.5) * 0.22, 6.6, 0.05, D("#D9A85A", "#6A5030"), "m", 7); });   // 양파
    [[5.2, 9.05]].forEach(([i, j]) => { for(let n = 0; n < 3; n++){ const b = ball(i - 0.18 + n * 0.18, j, 5, 0.13, D("#B8D88A", "#4E6A3A"), "m", 10); b.scale.set(0.9, 0.85, 1.5); ball(i - 0.18 + n * 0.18, j - 0.06, 6.5, 0.1, D("#EEF2C8", "#7A7E5A"), "m", 8).scale.set(0.8, 0.8, 1.2); } });   // 배추
    for(let n = 0; n < 4; n++){ const i = 6.25, j = 9.0 + n * 0.0; const a = rod([4.0 + n * 0.08, 8.55, 1], [4.0 + n * 0.08, 9.35, 1.5], 0.025, D("#6FAE54", "#3A5A2A"), "m", 6); rod([4.0 + n * 0.08, 9.0, 1.2], [4.0 + n * 0.08, 9.35, 1.5], 0.027, D("#F4F4E8", "#9A9A8A"), "m", 6); }   // 대파
    [[4.75, "한 바구니"], [5.65, "2천원"]].forEach(([i, t]) => K.decal(48, 26, (c, w, h, dark) => { c.fillStyle = dark ? "#8A7A60" : "#D8B888"; c.fillRect(0, 0, w, h); c.fillStyle = "#3A2A1A"; c.font = `${fitFont(c, t, w - 6, 16, JUA)}px ${JUA}`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(t, w / 2, h / 2 + 1); }, 0.32, 0.17, "i", i, 9.36, hz(9)));
    W.extraBoxes.push([X(3.95), Z(8.45), X(6.5), Z(9.4), 0, 0.4]);   // 돗자리 채소는 낮아서 디딤돌이 되므로 막기 상자
    // 파라솔
    const pi = 6.35, pj = 8.2; rod([pi, pj, 0], [pi, pj, 74], 0.02, WHITE); disc(pi, pj, 0.16, 0, 2, INK, "s", 12);
    K.sm(myGeo(new THREE.ConeGeometry(1.35, hz(14), 12, 1, true)), D("#72C4AE", "#3E6E60"), X(pi), hz(78), Z(pj), null, "m");
    { const cone2 = myGeo(new THREE.ConeGeometry(1.36, hz(14), 12, 1, true, 0, PI / 6)); [0, 2, 4, 6, 8, 10].forEach(k => { const o = K.sm(cone2, WHITE, X(pi), hz(78) + 0.004, Z(pj), null, "m"); o.rotation.y = k * PI / 6; }); }
    ball(pi, pj, 86, 0.05, WHITE, "s", 8); }
  // ③ 꽃집: 계단 진열대 꽃 양동이 · 화분 · 꽃다발
  { const f = FR("+j", 6.8, NWJ, NWI - 0.05, SJ); shopFront(f, {c1:PINK, c2:WHITE, sign:"크레용 꽃집", sub:"오늘의 꽃 · 화분 · 꽃다발", bg:D("#F7DCE6", "#6A4E5A"), fg:D("#B5607E", "#FFE3EC"), emo:"🌷", wall:D("#FFF4F8", "#4A3E44")});
    const FC = ["#F4A7B9", "#FFFFFF", "#F6E39A", "#E04A5A", "#C8B4D0", "#F9C99B", "#F06BA8", "#A9CBEA"];
    for(let n = 0; n < 7; n++){ const [i, j] = f.P(0.25 + n * 0.37, 0.3); tub(i, j, 0.12, 0.14, 22, 7, D("#C9CDD2", "#5A5E64"), "s", 12);
      for(let k = 0; k < 6; k++){ const a = k * 1.05 + n, r = 0.06 + (k % 2) * 0.04, h = 38 + (k % 3) * 4; rod([i, j, 28], [i + Math.cos(a) * r, j + Math.sin(a) * r, h], 0.006, D("#5FA582", "#3E6E54"), "m", 4); ball(i + Math.cos(a) * r, j + Math.sin(a) * r, h, 0.05, FC[(n + k * 3) % 8], "m", 7); } }
    for(let n = 0; n < 5; n++){ const [i, j] = f.P(0.35 + n * 0.55, -0.35); tub(i, j, 0.13, 0.16, 0, 8, n % 2 ? D("#E8C9A8", "#5A4A3A") : PINK2, "m", 12);
      for(let k = 0; k < 5; k++) ball(i + Math.cos(k * 1.3) * 0.08, j + Math.sin(k * 1.3) * 0.08, 13 + (k % 2) * 3, 0.07, k % 2 ? K.sh("plant", 0.1) : "plant", "m", 7);
      if(n % 2 === 0) ball(i, j, 18, 0.05, FC[n + 1], "m", 7); }
    { const [i, j] = f.P(2.3, 0.95); K.sm(myGeo(new THREE.ConeGeometry(0.15, 0.5, 10, 1, true)), D("#FFF4F8", "#7A6E72"), X(i), hz(30), Z(j), null, "m").rotation.x = PI; for(let k = 0; k < 6; k++) ball(i + Math.cos(k) * 0.07, j + Math.sin(k) * 0.07, 40 + (k % 2) * 2, 0.05, FC[k + 1], "m", 7); }
    vendor(8.35, 7.65, 0, LOOK.flower); }
  // ④ 장난감 좌판 (골목 남쪽, 앞 −j): 무지개 파라솔 · 바람개비 · 풍선 · 팽이 · 뽑기 기계
  { const ti0 = 4.6, ti1 = 7.4, tj0 = 12.75, tj1 = 13.65;
    B(ti0, tj0, ti1 - ti0, tj1 - tj0, 20.4, LILAC, 0, {r:0.02}); B(ti0 - 0.03, tj0 - 0.03, ti1 - ti0 + 0.06, tj1 - tj0 + 0.06, 1.6, PINK2, 20.4, {r:0.02});
    K.decal(396, 66, (c, w, h, dark) => { for(let x = 0; x < w; x += 22){ c.fillStyle = RB[(x / 22) % 6]; c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 22, 0); c.lineTo(x + 11, h * 0.55); c.fill(); } c.fillStyle = dark ? "#E2D6EA" : "#6A4E7A"; c.font = `${h * 0.36}px ${JUA}`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("장난감 천국 🪀 하나에 천 원!", w / 2, h * 0.78); }, 2.7, hz(14), "-i", (ti0 + ti1) / 2, tj0, hz(12));
    for(let n = 0; n < 5; n++){ const i = 4.85 + n * 0.28, j = 13.0; K.sm(myGeo(new THREE.ConeGeometry(0.06, 0.12, 10)), RB[n], X(i), hz(24), Z(j), null, "m").rotation.x = PI; disc(i, j, 0.06, 25.6, 1.5, RB[(n + 2) % 6], "m", 10); }   // 팽이
    [[6.15, 13.0, "#5E9BEA"], [6.5, 13.05, "#F06BA8"], [6.85, 12.98, "#FFD43B"]].forEach(([i, j, cc]) => { B(i - 0.12, j - 0.07, 0.24, 0.14, 4, cc, 22, {r:0.03}); B(i - 0.07, j - 0.06, 0.13, 0.12, 3, D("#DDEEF6", "#4A6078"), 26, {r:0.02}); [-0.08, 0.08].forEach(d => [-0.07, 0.07].forEach(e => disc(i + d, j + e, 0.03, 22, 1, INK, "s", 8))); });   // 장난감 차
    for(let n = 0; n < 6; n++) B(5.0 + (n % 3) * 0.22, 13.3 + (n / 3 | 0) * 0.15, 0.18, 0.12, 0.8 + n * 0.4, RB[n], 22, {r:0});    // 딱지
    [[5.9, 13.35, "#F4A7B9"], [6.3, 13.38, "#A8DCC8"], [6.68, 13.32, "#F6E39A"]].forEach(([i, j, cc]) => ball(i, j, 26, 0.12, cc, "m", 12));   // 탱탱볼
    { const i = 7.15, j = 13.35; B(i - 0.16, j - 0.15, 0.32, 0.3, 18, D("#E06A55", "#8A4438"), 22, {r:0.04}); K.sm(myGeo(new THREE.SphereGeometry(0.15, 14, 8, 0, PI * 2, 0, PI / 2)), D("#DDEEF6", "#7A90B8"), X(i), hz(40), Z(j), null, "glass");
      for(let n = 0; n < 6; n++) ball(i + Math.cos(n) * 0.07, j + Math.sin(n) * 0.07, 42 + (n % 2) * 2, 0.04, RB[n], "m", 6); disc(i, j - 0.155, 0.04, 30, 0.5, GOLD, "s", 8).rotation.x = PI / 2; }   // 뽑기 기계
    // 풍선
    rod([4.7, 13.55, 0], [4.7, 13.55, 50], 0.015, WHITE);
    [[4.45, 13.4, 92, "#F4A7B9"], [4.75, 13.3, 98, "#A9CBEA"], [5.0, 13.5, 90, "#F6E39A"], [4.6, 13.75, 100, "#A8DCC8"], [4.95, 13.8, 95, "#C8B4D0"]].forEach(([i, j, z, cc]) => { rod([4.7, 13.55, 50], [i, j, z - 6], 0.003, "#FFFFFF", "s", 3); const b = ball(i, j, z, 0.15, cc, "s", 12); b.scale.y = 1.2; });
    // 무지개 파라솔
    const pi = 6.0, pj = 13.6; rod([pi, pj, 20], [pi, pj, 76], 0.02, WHITE);
    RB.forEach((cc, k) => { const g = myGeo(new THREE.ConeGeometry(0.85, hz(11), 12, 1, true, k * PI / 3, PI / 3)); K.sm(g, cc, X(pi), hz(80), Z(pj), null, "m"); });
    ball(pi, pj, 88, 0.05, WHITE, "s", 8);
    vendor(6.0, 14.25, PI, LOOK.toys);
    W.pinwheels = [[5.25, 12.72, 32], [5.55, 12.72, 35], [5.85, 12.72, 31]]; }
}
/* ---------- 광장: 뻥튀기 · 군고구마 · 먹자리 · 전구 줄 ---------- */
function ptable(ti, tj, col, items){
  B(ti - 0.42, tj - 0.42, 0.84, 0.84, 1.6, col, 21, {r:0.04}); [[-0.36, -0.36], [0.3, -0.36], [-0.36, 0.3], [0.3, 0.3]].forEach(([a, b]) => B(ti + a, tj + b, 0.06, 0.06, 21, col, 0, {r:0}));
  if(items){ disc(ti - 0.1, tj, 0.18, 22.6, 1.2, WHITE, "s", 18); disc(ti - 0.1, tj, 0.15, 23.8, 0.6, D("#D9433E", "#7A2A26"), "m", 18); for(let n = 0; n < 6; n++) ball(ti - 0.1 + Math.cos(n) * 0.08, tj + Math.sin(n) * 0.08, 24.6, 0.022, WHITE, "m", 5).scale.set(1, 0.7, 2.2);
    tub(ti + 0.2, tj - 0.15, 0.04, 0.05, 22.6, 4, WHITE, "m", 10); tub(ti + 0.22, tj + 0.15, 0.04, 0.05, 22.6, 4, WHITE, "m", 10); }
}
function stool(si, sj, col){ tub(si, sj, 0.19, 0.15, 0, 10, col, "s", 14); disc(si, sj, 0.165, 10, 1.4, col, "s", 14); }
function parasol(pi, pj, c1, c2, h = 74){
  rod([pi, pj, 23], [pi, pj, h], 0.02, WHITE);
  K.sm(myGeo(new THREE.ConeGeometry(1.15, hz(14), 12, 1, true)), c1, X(pi), hz(h + 4), Z(pj), null, "m");
  const cone2 = myGeo(new THREE.ConeGeometry(1.16, hz(14), 12, 1, true, 0, PI / 6)); [0, 2, 4, 6, 8, 10].forEach(k => { const o = K.sm(cone2, c2, X(pi), hz(h + 4) + 0.004, Z(pj), null, "m"); o.rotation.y = k * PI / 6; });
  ball(pi, pj, h + 12, 0.05, WHITE, "s", 8);
}
const TABLES = [[22.6, 15.6, PINK], [25.4, 17.4, LEAF], [28.1, 15.4, LILAC]];
function buildPlaza(){
  // 뻥튀기 수레 (기계 통·뚜껑은 움직이는 메시, buildDyn에서)
  B(22.3, 2.55, 1.55, 1.2, 14, WOOD, 0, {r:0.03}); B(22.27, 2.52, 1.61, 1.26, 1.4, WOODD, 14, {r:0});
  [[22.5, 2.5], [23.6, 2.5], [22.5, 3.8], [23.6, 3.8]].forEach(([i, j]) => wheel(i, j, 0.13, 0.06, "j"));
  B(22.95, 2.95, 0.7, 0.4, 7, INK, 15.4, {r:0.02}); ball(23.3, 3.15, 19, 0.08, D("#FF8A3A", "#FF9A4A"), "glow", 8).scale.y = 0.6;                        // 가스 불
  [[22.92, 3.0], [22.92, 3.3], [23.73, 3.0], [23.73, 3.3]].forEach(([i, j]) => B(i - 0.02, j - 0.02, 0.04, 0.04, 14, STEEL, 15.4, {r:0}));             // 통 받침
  B(23.95, 2.7, 1.6, 0.9, 14, METAL, 0, {r:0.02});                                                                                                      // 망 받침
  for(let n = 0; n < 4; n++){ const i = 24.0 + n * 0.5; rod([i, 2.72, 15], [i, 2.72, 44], 0.008, METAL, "s", 4); rod([i, 3.58, 15], [i, 3.58, 44], 0.008, METAL, "s", 4); }
  rod([24.0, 2.72, 44], [25.5, 2.72, 44], 0.008, METAL, "s", 4); rod([24.0, 3.58, 44], [25.5, 3.58, 44], 0.008, METAL, "s", 4);
  K.faceJ(24.0, 25.5, 3.57, 15, 44, D("#E8EEF2", "#8A98A8"), "glass", 0.01); K.faceJ(24.0, 25.5, 2.71, 15, 44, D("#E8EEF2", "#8A98A8"), "glass", 0.01); K.faceI(25.49, 2.72, 3.58, 15, 44, D("#E8EEF2", "#8A98A8"), "glass", 0.01);
  for(let n = 0; n < 26; n++) ball(24.15 + rnd(n) * 1.2, 2.85 + rnd(n + 30) * 0.6, 16 + rnd(n + 60) * 4, 0.06, D("#F6EBD2", "#A89E86"), "m", 6);         // 망 안 튀밥
  // 뻥튀기 봉지 걸이 · 쌓인 뻥튀기
  rod([22.35, 3.72, 15], [22.35, 3.72, 64], 0.016, WOODD); rod([22.35, 3.72, 62], [23.5, 3.72, 62], 0.012, WOODD);
  [[22.62, 47], [22.98, 45], [23.34, 48]].forEach(([i, z]) => { rod([i, 3.72, 62], [i, 3.72, z + 13], 0.004, INK, "s", 3); B(i - 0.15, 3.6, 0.3, 0.24, 13, D("#EEF4F8", "#8A98A8"), z, {r:0.03, cls:"glass"}); for(let n = 0; n < 3; n++) disc(i, 3.72, 0.1, z + 2 + n * 4, 1.6, D("#F2E2BE", "#9A8E70"), "m", 14); });
  for(let n = 0; n < 6; n++) disc(22.6, 3.5, 0.15, 15.4 + n * 1.3, 1.2, D("#F2E2BE", "#9A8E70"), "m", 16);
  { const f = FR("+j", 22.3, 2.55, 25.5, 3.75); signBoard(f, "뻥이요~!", "강냉이 · 쌀튀밥 · 뻥튀기 3,000원", D("#FCE9B8", "#6A5E4A"), D("#C0503F", "#FFD0C0"), "💥", {v:1.15, z0:64, h:24, u0:0.1, w:1.9}); }
  rod([22.45, 2.57, 14], [22.45, 2.57, 88], 0.016, WOODD, "s", 6); rod([24.25, 2.57, 0], [24.25, 2.57, 88], 0.016, WOODD, "s", 6);
  vendor(22.05, 3.1, PI / 2, LOOK.ppeong);
  // 군고구마 드럼통 + 굴뚝 연기
  { const i = 28.1, j = 3.2; K.sm(K.cyl(0.32, 0.32, 0.75, 18), D("#3A3A3C", "#222224"), X(i), hz(26), Z(j), null, "s").rotation.x = PI / 2;
    [[-0.25], [0.25]].forEach(([d]) => { rod([i + d, j - 0.25, 0], [i + d, j - 0.25, 16], 0.02, INK, "s", 6); rod([i + d, j + 0.25, 0], [i + d, j + 0.25, 16], 0.02, INK, "s", 6); });
    B(i - 0.22, j + 0.36, 0.44, 0.04, 10, D("#4A4A4C", "#2A2A2C"), 22, {r:0.01}); ball(i, j + 0.39, 25, 0.06, D("#FF7A3A", "#FF8A4A"), "glow", 8);
    rod([i, j - 0.2, 36], [i, j - 0.2, 70], 0.05, D("#5A5A5E", "#2E2E30"), "s", 10); W.steam.push([i, j - 0.2, 72, 6, 0.08, 0.0004, 0.11, "#E6E2DC"]);
    for(let n = 0; n < 5; n++){ const b = ball(i - 0.2 + n * 0.1, j + 0.05, 34.5, 0.05, D("#8A3A4A", "#4A1E26"), "m", 7); b.scale.set(1.8, 0.8, 0.8); }
    B(i - 0.7, j + 0.6, 0.06, 0.06, 40, WOODD, 0, {r:0}); { const f = FR("+j", i - 1.1, j + 0.5, i - 0.1, j + 0.66); signBoard(f, "군고구마", "3개 3천원", D("#F3E6D0", "#4E4436"), D("#8A3A4A", "#F3D0D8"), "🍠", {v:0.0, z0:40, h:18, u0:0, w:1.0}); }
    vendor(28.95, 3.25, -PI / 2, LOOK.goguma); }
  // 먹자리: 플라스틱 탁자 셋 · 의자 · 파라솔 둘
  TABLES.forEach(([ti, tj, cc], k) => { ptable(ti, tj, WHITE, true); [[-0.62, 0], [0.62, 0], [0, 0.62]].forEach(([a, b], n) => stool(ti + a, tj + b, [PINK, LEAF, LILAC, D("#F6E39A", "#8A7A3A")][(k + n) % 4])); });
  parasol(22.6, 15.6, D("#F4A7B9", "#7A5866"), WHITE); parasol(28.1, 15.4, D("#C8B4D0", "#5E4E68"), WHITE);
  // 전구 줄 기둥 · 나무 화분 · 상자 · 오토바이 · 울타리
  [[20.4, 12.95], [29.65, 12.95], [20.4, 19.4], [29.65, 19.4]].forEach(([i, j]) => { B(i - 0.05, j - 0.05, 0.1, 0.1, 100, D("#6A5A4A", "#3A3028"), 0, {r:0}); B(i - 0.14, j - 0.14, 0.28, 0.28, 6, D("#9A8A7A", "#4A4038"), 0, {r:0.02}); });
  [[29.0, 8.2], [21.3, 7.6]].forEach(([i, j]) => { B(i - 0.42, j - 0.42, 0.84, 0.84, 14, D("#C9A27A", "#5A4632"), 0, {r:0.05}); disc(i, j, 0.36, 14, 0.8, D("#7A5A3C", "#3A2A20"), "m", 16); tree(i, j, 0.85); });
  [[29.3, 1.4, 0], [29.3, 1.4, 1], [28.75, 1.4, 0], [29.3, 1.95, 0]].forEach(([i, j, l], k) => crate(i - 0.27, j - 0.27, 0.54, 0.54, 11, [D("#72C4AE", "#3E6E60"), D("#F4A7B9", "#7A5866"), D("#F6E39A", "#8A7A3A"), D("#A9CBEA", "#4A6280")][k], l * 11));
  { const i = 26.6, j = 9.4; [[0, -0.42], [0, 0.42]].forEach(([d, e]) => wheel(i + d, j + e, 0.16, 0.08, "i"));
    B(i - 0.12, j - 0.4, 0.24, 0.8, 8, D("#E8A04A", "#9A6A30"), 6, {r:0.06}); B(i - 0.1, j - 0.15, 0.2, 0.4, 4, INK, 14, {r:0.04}); rod([i, j - 0.42, 10], [i, j - 0.5, 28], 0.015, METAL); rod([i - 0.18, j - 0.5, 28], [i + 0.18, j - 0.5, 28], 0.014, INK);
    B(i - 0.2, j + 0.25, 0.4, 0.36, 12, D("#FFFFFF", "#8A847C"), 14, {r:0.03}); K.wtext("배달", i, j + 0.62, 20, "i", 2.4, D("#E8A04A", "#FFD08A"), null, 800, K.FONT); }   // 배달 오토바이
  fence(1.0, 21.85, 29.85, "j");
  for(let j = 1.2; j < 9.2; j += 1.1) ball(29.7, j, 10, 0.18, K.sh("plant", (j * 7 % 3) * 0.06), "m", 10);
}
/* ---------- 쉼터 · 짐차 (왼쪽 아래) ---------- */
function buildLot(){
  // 1톤 트럭 (앞 = −j), 짐칸에 배추 · 무
  { const i0 = 7.05, j0 = 15.55, w = 1.32, blue = D("#5E8FD6", "#34507A");
    [[0.62], [2.95]].forEach(([dj]) => [i0 + 0.05, i0 + w - 0.05].forEach(i => { wheel(i, j0 + dj, 0.21, 0.14, "i"); wheel(i + (i > i0 + 0.5 ? 0.075 : -0.075), j0 + dj, 0.1, 0.02, "i", METAL); }));
    B(i0, j0, w, 1.05, 36, blue, 7, {r:0.08}); B(i0 + 0.08, j0 - 0.012, w - 0.16, 0.1, 14, D("#BFD6EA", "#2C3A4E"), 26, {r:0.03});
    [i0 - 0.012, i0 + w - 0.088].forEach(i => B(i, j0 + 0.15, 0.1, 0.7, 12, D("#BFD6EA", "#2C3A4E"), 27, {r:0.02}));
    [i0 + 0.15, i0 + w - 0.4].forEach(i => B(i, j0 - 0.02, 0.25, 0.04, 3, D("#FFF6DA", "#FFF1C2"), 15, {r:0.01, cls:"glow"}));
    B(i0, j0 + 1.1, w, 2.55, 4, METAL, 14, {r:0.02}); [[i0, j0 + 1.1, 0.06, 2.55], [i0 + w - 0.06, j0 + 1.1, 0.06, 2.55], [i0, j0 + 3.59, w, 0.06], [i0, j0 + 1.1, w, 0.06]].forEach(([i, j, a, b]) => B(i, j, a, b, 10, blue, 18, {r:0}));
    for(let n = 0; n < 14; n++){ const i = i0 + 0.28 + (n % 3) * 0.38, j = j0 + 1.4 + (n / 3 | 0) * 0.42; const b = ball(i, j, 24 + (n % 2) * 2, 0.17, D("#B8D88A", "#4E6A3A"), "m", 10); b.scale.set(0.95, 0.8, 1.35); ball(i, j - 0.08, 26 + (n % 2) * 2, 0.12, D("#EEF2C8", "#7A7E5A"), "m", 8).scale.set(0.85, 0.8, 1.1); }
    for(let n = 0; n < 4; n++){ const b = ball(i0 + 0.3 + n * 0.25, j0 + 3.35, 25, 0.07, D("#F8F6EE", "#A8A69A"), "m", 8); b.scale.set(1, 1, 2.6); ball(i0 + 0.3 + n * 0.25, j0 + 3.12, 27, 0.06, D("#6FAE54", "#3A5A2A"), "m", 6); }
    K.wtext("크레용 청과 🥬", i0 + w / 2, j0 + 3.66, 22, "i", 2.6, D("#FFFFFF", "#E2E8F0"), null, 800, K.FONT); }
  // 배추 상자 · 고양이 앉은 상자
  [[5.6, 18.6], [5.6, 19.15], [6.15, 18.6]].forEach(([i, j], k) => { crate(i - 0.26, j - 0.26, 0.52, 0.52, 12, D("#C9A27A", "#5A4632"), 0); for(let n = 0; n < 2; n++) ball(i - 0.1 + n * 0.2, j, 15, 0.13, D("#B8D88A", "#4E6A3A"), "m", 8).scale.set(0.9, 0.75, 1.3); });
  { const i = 9.35, j = 13.3; crate(i - 0.3, j - 0.3, 0.6, 0.6, 12, D("#72C4AE", "#3E6E60"), 0); crate(i - 0.28, j - 0.28, 0.56, 0.56, 12, D("#F4A7B9", "#7A5866"), 12);
    const cat = D("#F2C08A", "#8A6A4A"); ball(i, j, 27, 0.14, cat, "m", 12).scale.set(1.3, 0.7, 1); ball(i + 0.15, j + 0.05, 30, 0.09, cat, "m", 12);
    [[0.11, 0.0], [0.11, 0.1]].forEach(([d, e]) => K.sm(myGeo(new THREE.ConeGeometry(0.03, 0.06, 4)), cat, X(i + 0.17 + (e ? -0.02 : 0.02)), hz(33), Z(j + e), null, "m"));
    rod([i - 0.15, j, 26], [i - 0.25, j + 0.12, 25], 0.018, cat, "m", 6); ball(i + 0.21, j + 0.08, 30.4, 0.01, INK, "s", 4); }
  // 쉼터: 벤치 · 낮은 상 · 의자 · 화분
  B(1.0, 14.75, 2.6, 0.42, 13, WOOD, 0, {r:0.03}); B(1.0, 14.62, 2.6, 0.1, 26, WOODD, 0, {r:0.02}); [1.05, 3.5].forEach(i => B(i, 14.62, 0.06, 0.55, 18, WOODD, 0, {r:0}));
  ptable(2.6, 17.6, D("#F6E39A", "#8A7A3A"), true); [[2.0, 17.6], [3.2, 17.6], [2.6, 18.22]].forEach(([i, j], k) => stool(i, j, [PINK, LEAF, LILAC][k]));
  parasol(2.6, 17.6, D("#F9C99B", "#8A6A4A"), WHITE, 72);
  [[0.55, 13.0], [0.55, 21.4], [4.4, 21.4], [9.6, 21.4]].forEach(([i, j], k) => { B(i - 0.28, j - 0.28, 0.56, 0.56, 11, k % 2 ? LILAC2 : PINK2, 0, {r:0.05}); for(let n = 0; n < 5; n++) ball(i + Math.cos(n * 1.3) * 0.15, j + Math.sin(n * 1.3) * 0.15, 15 + (n % 2) * 3, 0.1, n % 2 ? RB[(k + n) % 6] : K.sh("plant", 0.08), "m", 8); });
  fence(12.7, 21.85, 0.12, "j"); fence(0.12, 13.9, 21.88, "i"); fence(16.1, 29.85, 21.88, "i");
  // 뒷문 쪽 (왼줄 가게 뒤) 가스통 · 상자
  [[9.75, 15.6], [9.75, 16.0]].forEach(([i, j]) => { K.sm(K.cyl(0.13, 0.13, hz(26), 12), D("#8AA0B8", "#3A4A5E"), X(i), hz(13), Z(j), null, "s"); disc(i, j, 0.05, 26, 3, METAL, "s", 8); });
  crate(9.45, 17.2, 0.5, 0.5, 11, D("#A9CBEA", "#4A6280")); crate(9.47, 17.22, 0.46, 0.46, 11, D("#F6E39A", "#8A7A3A"), 11);
}

/* ---------- 움직이는 것 ---------- */
function buildDynamic(){
  const scene = K.R.scene;
  const gc = document.createElement("canvas"); gc.width = gc.height = 64; { const x = gc.getContext("2d"), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.35, "rgba(255,255,255,.45)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(0, 0, 64, 64); }
  W.gtex = new THREE.CanvasTexture(gc);
  const gm = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), K.cutaway(new THREE.MeshBasicMaterial({map:W.gtex, transparent:true, blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false})), Math.max(1, W.glows.length));
  gm.frustumCulled = false; gm.renderOrder = 3; scene.add(gm); W.gm = gm;
  W.fxN = 96; W.fm = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), K.cutaway(new THREE.MeshStandardMaterial({roughness:0.7})), W.fxN); W.fm.frustumCulled = false; scene.add(W.fm);
  W.cyN = 8; W.cm = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1, 1, 16), K.cutaway(new THREE.MeshStandardMaterial({roughness:0.6})), W.cyN); W.cm.frustumCulled = false; W.cm.castShadow = true; scene.add(W.cm);
}
function buildBulbs(){   // 광장 전구 줄 (밤에만 반짝)
  const L = [], line = (a, b, n, z0, sag) => { for(let k = 1; k < n; k++){ const t = k / n; L.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, z0 - Math.sin(t * PI) * sag]); } };
  line([20.4, 12.95], [29.65, 12.95], 16, 98, 10); line([20.4, 19.4], [29.65, 19.4], 16, 98, 10); line([20.4, 12.95], [29.65, 19.4], 18, 98, 14); line([29.65, 12.95], [20.4, 19.4], 18, 98, 14);
  [[[20.4, 12.95], [29.65, 12.95]], [[20.4, 19.4], [29.65, 19.4]], [[20.4, 12.95], [29.65, 19.4]], [[29.65, 12.95], [20.4, 19.4]]].forEach(([a, b]) => { const n = 8; for(let k = 0; k < n; k++){ const t0 = k / n, t1 = (k + 1) / n;
    rod([a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0, 98 - Math.sin(t0 * PI) * 12], [a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1, 98 - Math.sin(t1 * PI) * 12], 0.005, INK, "s", 3); } });
  W.bulbs = L; L.forEach(([i, j, z]) => gl(i, j, z, 9, "#FFD68C", (tm, dk) => dk ? 0.65 : 0));
  W.bm = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), K.cutaway(new THREE.MeshBasicMaterial({toneMapped:false})), L.length); W.bm.frustumCulled = false; K.R.scene.add(W.bm);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(0.04, 0.04, 0.04);
  L.forEach(([i, j, z], k) => { W.bm.setMatrixAt(k, m.compose(new THREE.Vector3(X(i), hz(z) - 0.03, Z(j)), q, s)); W.bm.setColorAt(k, new THREE.Color(RB[k % 6])); });
}
function buildPpeong(){
  // 기계 통 (가로로 누운 쇠통, i 쪽 축): 돌고 · 흔들리고 · 뚜껑이 열림
  const M = Merge(), dk = D("#2E2E30", "#1E1E20");
  { const c = new THREE.CylinderGeometry(0.21, 0.21, 0.78, 18); c.rotateZ(PI / 2); M.add(c, dk); }
  [-0.39, 0.39, 0].forEach(x => { const t = new THREE.TorusGeometry(0.212, 0.022, 6, 20); t.rotateY(PI / 2); t.translate(x, 0, 0); M.add(t, D("#5A5A5E", "#3A3A3C")); });
  { const s = new THREE.CylinderGeometry(0.025, 0.025, 0.28, 8); s.rotateZ(PI / 2); s.translate(-0.52, 0, 0); M.add(s, STEEL); const h = new THREE.BoxGeometry(0.03, 0.2, 0.03); h.translate(-0.64, -0.1, 0); M.add(h, STEEL); const k = new THREE.CylinderGeometry(0.025, 0.025, 0.1, 8); k.rotateX(PI / 2); k.translate(-0.64, -0.2, 0.05); M.add(k, WOOD); }
  W.drum = dynMesh(M.geo()); W.drum.position.set(X(23.33), hz(30), Z(3.15)); W.drum.userData.y0 = hz(30);
  const L2 = Merge(); { const c = new THREE.CylinderGeometry(0.23, 0.23, 0.05, 18); c.rotateZ(PI / 2); c.translate(0, -0.23, 0); L2.add(c, D("#3A3A3C", "#262628")); const nb = new THREE.SphereGeometry(0.035, 8, 6); nb.translate(0.03, -0.23, 0); L2.add(nb, GOLD); }
  W.lid = dynMesh(L2.geo()); W.lid.position.set(X(23.75), hz(30) + 0.23, Z(3.15));
  // 압력계 (흔들리는 바늘은 생략, 통 위 고정)
  // "뻥!" 말풍선 (늘 카메라를 봄)
  const cv = document.createElement("canvas"); cv.width = 256; cv.height = 160; const x = cv.getContext("2d");
  const star = (cx, cy, r0, r1, n) => { x.beginPath(); for(let k = 0; k < n * 2; k++){ const a = k / (n * 2) * PI * 2 - PI / 2, r = k % 2 ? r0 : r1; x.lineTo(cx + Math.cos(a) * r * 1.5, cy + Math.sin(a) * r); } x.closePath(); };
  star(128, 80, 46, 74, 12); x.fillStyle = "#FFE066"; x.fill(); x.lineWidth = 7; x.strokeStyle = "#E8A04A"; x.stroke();
  x.font = `78px ${JUA}`; x.textAlign = "center"; x.textBaseline = "middle"; x.lineJoin = "round"; x.lineWidth = 12; x.strokeStyle = "#FFFFFF"; x.strokeText("뻥!!", 128, 84); x.fillStyle = "#E0503A"; x.fillText("뻥!!", 128, 84);
  W.popCv = cv; W.popTex = new THREE.CanvasTexture(cv); W.popTex.colorSpace = THREE.SRGBColorSpace;
  W.popSp = new THREE.Sprite(new THREE.SpriteMaterial({map:W.popTex, transparent:true, depthWrite:false, toneMapped:false})); W.popSp.scale.set(0, 0, 1); W.popSp.position.set(X(24.4), hz(78), Z(3.2)); W.popSp.renderOrder = 4; K.R.scene.add(W.popSp);
  gl(23.3, 3.15, 19, 18, "#FF9A4A", (tm, dk) => dk ? 0.55 : 0.18);
}
function buildPinwheels(){
  W.pw = (W.pinwheels || []).map(([i, j, z], n) => {
    rod([i, j, 22], [i, j, z], 0.008, WOODD, "s", 4);
    const M = Merge(); for(let k = 0; k < 4; k++){ const b = new THREE.BoxGeometry(0.035, 0.12, 0.008); b.translate(0.018, 0.06, 0); b.rotateZ(k * PI / 2); M.add(b, RB[(n * 2 + k) % 6]); }
    M.add(new THREE.SphereGeometry(0.015, 6, 4), WHITE); const m = dynMesh(M.geo()); m.position.set(X(i), hz(z), Z(j) - 0.012); return m; });
}
function buildGlows(){
  gl(13.0, 16.35, 26, 60, "#FF9A5A", (tm, dk) => dk ? 0.35 : 0.06);          // 호떡 철판 열기
  gl(28.1, 3.59, 25, 26, "#FF8A3A", (tm, dk) => dk ? 0.6 : 0.15);            // 군고구마 불
  gl(2.9, 8.15, 20, 22, "#FFD68C", (tm, dk) => dk ? 0.5 : 0.05);             // 방앗간 기계 불
  [[11.8, GJ + 0.3], [18.2, GJ + 0.3]].forEach(([i, j]) => gl(i, j, 112, 40, "#FFE6B8", (tm, dk) => dk ? 0.5 : 0));   // 정문 등
  [[11.8, GJ + 0.27], [18.2, GJ + 0.27]].forEach(([i, j]) => ball(i, j, 112, 0.09, D("#FFF4D6", "#FFE4A8"), "glow", 10));
  // 상가 1층 불빛 (밤)
  [[22.6, 1.0], [27.6, 1.0]].forEach(([i, j]) => gl(i, j + 0.2, 20, 70, "#FFE2A8", (tm, dk) => dk ? 0.35 : 0));
}

/* ---------- 매 프레임 ---------- */
const m4 = new THREE.Matrix4(), qn = new THREE.Quaternion(), v3 = new THREE.Vector3(), sc3 = new THREE.Vector3(), col = new THREE.Color(), e3 = new THREE.Euler(), ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
function fxSet(k, x, y, z, s, c){ if(k >= W.fxN) return; if(s <= 0){ W.fm.setMatrixAt(k, ZERO); return; } m4.compose(v3.set(x, y, z), qn.identity(), sc3.set(s, s * 0.9, s)); W.fm.setMatrixAt(k, m4); W.fm.setColorAt(k, col.set(c)); }
function cySet(k, x, y, z, r, h, c, rx = 0, rz = 0){ if(k >= W.cyN) return; if(r <= 0){ W.cm.setMatrixAt(k, ZERO); return; } e3.set(rx, 0, rz); qn.setFromEuler(e3); m4.compose(v3.set(x, y, z), qn, sc3.set(r, h, r)); W.cm.setMatrixAt(k, m4); W.cm.setColorAt(k, col.set(c)); }
const ease = t => t < 0 ? 0 : t > 1 ? 1 : 1 - (1 - t) * (1 - t);
function animate(tm, dt){
  const dk = !!K.R.dark, red = !!K.reduce, P = W.pp;
  let f = 0, cy = 0;
  // 김 · 연기
  const stc = dk ? "#C9C6D2" : "#FFFFFF";
  W.steam.forEach(([i, j, z, n, sp, rate, sz, c0]) => { for(let k = 0; k < n; k++){ const ph = (tm * rate + k / n) % 1, r = sz * (0.45 + 0.9 * ph) * (1 - ph * ph);
    fxSet(f++, X(i + (red ? 0 : Math.sin(ph * 5 + k * 2.3) * sp)), hz(z + 30 * ph), Z(j + (red ? 0 : Math.cos(ph * 4 + k) * sp * 0.6)), red ? 0 : r, c0 ? (dk ? "#8E8A86" : c0) : stc); } });
  // 호떡 뒤집기 (하나씩 차례로 퐁)
  (W.hotteok || []).forEach(([i, j], k) => { const ph = ((tm * 0.00022) + k / 6) % 1, flip = !red && ph < 0.08 ? ph / 0.08 : 0;
    cySet(cy++, X(i), hz(23.4) + Math.sin(flip * PI) * 0.16, Z(j), 0.11, 0.025, flip > 0.5 ? "#C98A3E" : "#E2A85A", flip * PI, 0); });
  while(cy < W.cyN) cySet(cy++, 0, 0, 0, 0);
  // 뻥튀기: 통 돌리기 · 자동 뻥 · 유나가 누르면 set(t)
  if(!P.act && tm > P.next){ P.pop = tm; P.next = tm + 32000 + rnd(tm) * 14000; }
  const age = (tm - P.pop) / 1000, pre = P.act && !P.popped ? Math.min(1, P.t / POP_AT) : 0;
  if(W.drum){ const spd = age < 0.6 ? 0 : P.act && !P.popped ? 3 + pre * 9 : 1.4; if(!red) W.drum.rotation.x += dt * spd;
    W.drum.position.y = W.drum.userData.y0 + (!red && pre > 0.6 ? Math.sin(tm * 0.09) * 0.008 * pre : 0); }
  if(W.lid) W.lid.rotation.z = age < 1.4 ? ease(age / 0.12) * 1.9 * (age < 0.9 ? 1 : 1 - (age - 0.9) / 0.5) : 0;
  if(age >= 0 && age < 2.2 && !red){
    for(let k = 0; k < 12; k++){ const t = Math.max(0, age - k * 0.025), d = ease(t / 0.9), a = k / 12 * PI * 2;
      fxSet(f++, X(23.95 + d * (0.6 + (k % 3) * 0.25)), hz(30 + d * (14 + (k % 4) * 8)) + Math.sin(a) * 0.12 * d, Z(3.15 + Math.cos(a) * 0.35 * d), t > 0 ? (0.12 + 0.36 * d) * (age < 1.4 ? 1 : 1 - (age - 1.4) / 0.8) : 0, dk ? "#B8B4C0" : "#FFFFFF"); }
    for(let k = 0; k < 16; k++){ const t = Math.min(1, age / 0.55), u = rnd(k + 3), sx = 23.85 + t * (0.4 + u * 1.2), sy = 30 + Math.sin(t * PI) * (20 + rnd(k) * 26) - t * 12 * u, sz = 3.15 + (rnd(k + 9) - 0.5) * 0.6 * t;
      fxSet(f++, X(sx), hz(sy), Z(sz), age < 1.6 ? 0.045 : 0, "#F6EBD2"); }
  }
  if(W.popSp){ const s = age < 0 || age > 1.3 ? 0 : (age < 0.14 ? ease(age / 0.14) * 1.25 : 1.25 - (age - 0.14) * 0.15); W.popSp.scale.set(s * 1.6, s, 1); W.popSp.material.opacity = age > 0.9 ? Math.max(0, 1 - (age - 0.9) / 0.4) : 1; }
  // 바람개비
  if(!red) (W.pw || []).forEach((m, k) => m.rotation.z -= dt * (3 + k * 0.8 + Math.sin(tm * 0.0007 + k) * 1.5));
  while(f < W.fxN) fxSet(f++, 0, 0, 0, 0);
  W.fm.instanceMatrix.needsUpdate = true; if(W.fm.instanceColor) W.fm.instanceColor.needsUpdate = true;
  W.cm.instanceMatrix.needsUpdate = true; if(W.cm.instanceColor) W.cm.instanceColor.needsUpdate = true;
  // 전구 색 (낮엔 하얀 유리알, 밤엔 무지개빛)
  if(W.bm && W.bmDark !== dk){ W.bmDark = dk; W.bulbs.forEach((b, k) => W.bm.setColorAt(k, col.set(dk ? ["#FFE9B8", "#FFD0E0", "#D8FFE8"][k % 3] : "#E6E1D8"))); if(W.bm.instanceColor) W.bm.instanceColor.needsUpdate = true; }
  const cam = K.R.camera;
  // 지붕 유리: 유나 모드에서 카메라가 아케이드 위·안에 있으면 흐리게
  if(W.roof){ const q = cam.position, rb = W.roofBox, inside = !!K.R.pl && q.x > rb[0] && q.x < rb[2] && q.z > rb[1] && q.z < rb[3];
    const to = inside ? 0.0 : (K.R.pl ? 0.14 : 0.24), mt = W.roof.material; mt.opacity += (to - mt.opacity) * Math.min(1, dt * 5); W.roof.visible = mt.opacity > 0.01; }
  W.glows.forEach((g, k) => { let a = g.a(tm, dk); const dc = cam.position.distanceTo(g.p); a *= Math.min(1, Math.max(0, (dc - 1.0) / 2.2));   // 카메라 코앞 불빛은 지움 (화면이 하얗게 뜨는 것 막음)
    if(!(a > 0.004)){ W.gm.setMatrixAt(k, ZERO); return; }
    col.copy(g.c); m4.compose(g.p, cam.quaternion, sc3.set(g.s, g.s, 1)); W.gm.setMatrixAt(k, m4); W.gm.setColorAt(k, col.multiplyScalar(Math.min(1, a))); });
  W.gm.instanceMatrix.needsUpdate = true; if(W.gm.instanceColor) W.gm.instanceColor.needsUpdate = true;
}

/* ---------- 유나 모드에 넘길 것 (yuna_game.js 형식: h = 보는 쪽 (0 = +j, PI/2 = +i, PI = −j, −PI/2 = −i), H = 앉는 면 높이, k = 대사 종류) ---------- */
const H = px => px / 31.1;
export const MARKET = {
  name:"크레용 전통시장",
  gate:[15, 21.3], spawnGate:[15, 20.5, PI],               // 정문 (아래). 닿으면 나감
  side:[0.7, 11], spawnSide:[1.5, 11, PI / 2],             // 옆 출구 (왼쪽 방앗간 골목 끝)
  seats:[
    ...TABLES.flatMap(([ti, tj]) => [{a:[ti - 0.62, tj], h:PI / 2, H:H(11.4), k:"mk_stool"}, {a:[ti + 0.62, tj], h:-PI / 2, H:H(11.4), k:"mk_stool"}, {a:[ti, tj + 0.62], h:PI, H:H(11.4), k:"mk_stool"}]),
    {a:[1.4, 14.98], b:[3.2, 14.98], h:0, H:H(13), k:"mk_bench"},
    {a:[2.0, 17.6], h:PI / 2, H:H(11.4), k:"mk_rest"}, {a:[3.2, 17.6], h:-PI / 2, H:H(11.4), k:"mk_rest"}, {a:[2.6, 18.22], h:PI, H:H(11.4), k:"mk_rest"},
    {a:[13.86, 18.15], h:-PI / 2, H:H(11.4), k:"mk_eomuk"}, {a:[13.86, 18.58], h:-PI / 2, H:H(11.4), k:"mk_eomuk"}],
  sitLines:{
    mk_stool:["떡볶이 맛집 여기네 😋", "시장 떡볶이는 왜 더 맛있지? 🌶️", "아빠도 데려올걸~"],
    mk_bench:["다리 아파… 잠깐 쉬자 😮‍💨", "배추 트럭 크다! 🥬", "고양이 떡이 자고 있어 😺"],
    mk_rest:["장 보고 쉬는 중 🧺", "엄마 심부름 다 했다! ✌️"],
    mk_eomuk:["어묵 국물 호호~ ♨️", "이모 어묵 하나 더요! 🍢"]},
  use:[
    {at:[14.3, 2.6], k:"fruit", h:-PI / 2, r:0.65},        // 과일가게 계산대 앞 (통로 서쪽)
    {at:[14.3, 5.7], k:"tteokjip", h:-PI / 2, r:0.65},     // 떡집
    {at:[14.3, 8.7], k:"banchan", h:-PI / 2, r:0.65},      // 반찬가게 (선택)
    {at:[14.3, 13.9], k:"fish", h:-PI / 2, r:0.65},        // 생선가게
    {at:[14.3, 16.35], k:"hotteok", h:-PI / 2, r:0.65},     // 호떡·어묵 노점
    {at:[15.7, 2.1], k:"grain", h:PI / 2, r:0.65},         // 잡곡·건어물 (선택)
    {at:[15.7, 5.7], k:"mandu", h:PI / 2, r:0.65},         // 순대·만두 (선택)
    {at:[15.7, 13.9], k:"jeon", h:PI / 2, r:0.65},         // 전집 (선택)
    {at:[15.7, 17.2], k:"donut", h:PI / 2, r:0.65},        // 꽈배기·도넛 (선택)
    {at:[2.0, 9.85], k:"sesame", h:PI},                    // 방앗간 (선택)
    {at:[5.2, 9.9], k:"veggie", h:PI},                     // 채소 할머니 좌판
    {at:[8.3, 9.85], k:"flower", h:PI},                    // 꽃집
    {at:[6.0, 12.15], k:"toys", h:0},                      // 장난감 좌판
    {at:[23.6, 4.9], k:"ppeong", h:PI},                    // 뻥튀기 기계 (뻥!)
    {at:[28.1, 4.6], k:"goguma", h:PI}],                   // 군고구마 (선택)
  npc:{halmi:[5.2, 8.05, 0], tteok:[12.45, 5.7, PI / 2], fishm:[12.45, 13.9, PI / 2], hotteok:[12.45, 16.35, PI / 2]},
  ppeong:{
    set(t){ if(!W || !W.pp) return; const P = W.pp; if(t > 0){ if(!P.act){ P.act = true; P.popped = false; } P.t = t; if(t >= POP_AT && !P.popped){ P.popped = true; P.pop = K.clock(); } } else { P.act = false; P.popped = false; P.t = 0; P.next = K.clock() + 25000; } },
    pop(){ if(W && W.pp) W.pp.pop = K.clock(); },
    at:POP_AT},
};

/* ---------- 구역 정의 ---------- */
const EXT = [-0.4, -0.4, 30.4, 22.3];
const def = {
  id:"market",
  zones:{
    m_arcade:{name:"시장 아케이드", color:"#E8B5C8", rect:[LB0, FJ, RB1, GJ], label:[WC, FJ, "top"]},
    m_alley:{name:"방앗간 골목", color:"#C8B4D0", rect:[0, NWJ, LB0, 14.6], label:[4.9, 0, "top"]},
    m_plaza:{name:"뻥튀기 광장", color:"#E8A04A", rect:[RB1, FJ, 30, GJ], label:[30, 8, "side"]},
    m_rest:{name:"쉼터 · 짐차", color:"#72C4AE", rect:[0, 14.6, LB0, 22], label:[5, 22, "bottom"]}},
  outline:[[EXT[0], EXT[1]], [EXT[2], EXT[1]], [EXT[2], EXT[3]], [EXT[0], EXT[3]]],
  ext:EXT,
  top:4.8,
  allPts:V => [V(-0.4, 0, -0.4), V(30.4, 0, -0.4), V(30.4, 0, 22.3), V(-0.4, 0, 22.3), V(0, 4.6, 0), V(30, 3.4, 0), V(0, 4.4, NWJ), V(WC, 5.7, GJ)],
  lamps:[[WC, 4.5, 2.9], [WC, 14.5, 2.9], [5.0, 10.8, 2.5], [24.0, 6.0, 2.6], [25.0, 16.5, 2.5]],
  glow:{color:0xFFB070, at:[13.0, 16.35, 1.3]},
  eggs:[],
  people:[],
  paintFloor(c, dark){ paint(c, dark); },
  build(KIT){
    K = KIT; LG.length = 0;
    W = {recolor:[], glows:[], steam:[], bulbs:[], extraBoxes:[], pp:{act:false, popped:false, t:0, pop:-1e9, next:(KIT.clock ? KIT.clock() : 0) + 12000}};
    const egg = (id, at, emo, lines, say) => ({id, at, emo, lines, say});
    def.eggs = [
      egg("m_gate", [WC, GJ + 0.2, 150], ["🧺", "🏮"], ["크레용 전통시장 어서 오세요~ 🧺", "기와 지붕 문이 멋지다 🏯"]),
      egg("m_cat", [9.35, 13.3, 34], ["😺", "💤"], ["시장 고양이 떡이 낮잠 중 💤", "냐옹~ 생선가게 쪽만 봐 😼"]),
      egg("m_scale", [13.02, 3.62, 40], ["⚖️", "🍎"], ["사과 한 근 주세요~ ⚖️", "덤으로 하나 더! 🍎"]),
      egg("m_tank", [1.4, 1.4, 176], ["💛", "💧"], ["옥상 노란 물탱크 💛", "장독대에 된장이 익어 가요 🫙"]),
      egg("m_truck", [7.7, 16.0, 46], ["🥬", "🚚"], ["배추 왔어요~ 김장철이다 🥬", "트럭 가득 배추 산 🚚"]),
      egg("m_mural", [RB1 + 0.1, 5.4, 50], ["🌈", "☁️"], ["무지개 구름 벽화 🌈", "예운옥 구름이랑 닮았다 ☁️"]),
      egg("m_balloon", [4.75, 13.3, 100], ["🎈", "✨"], ["풍선 하나만 사 주세요~ 🎈"]),
      egg("m_octopus", [13.9, 15.0, 16], ["🐙", "💦"], ["대야 속 문어가 손 흔든다 🐙", "으악 물 튀었어! 💦"]),
      egg("m_lantern", [WC + 0.85, 10.04, 104], ["🏮", "🌙"], ["밤이 되면 초롱이 반짝 🏮"]),
      egg("m_pharm", [27.25, 1.5, 60], ["💊", "🥤"], ["약국 자판기 음료 하나 🥤", "어린이 비타민 주세요 💊"])];
    buildArcade(); buildGate(); buildBack(); buildNW(); buildLeft(); buildRight(); buildAlley(); buildPlaza(); buildLot();
    buildPpeong(); buildPinwheels(); buildBulbs(); buildGlows(); buildDynamic();
    // 주아체가 늦게 오면 간판을 다시 그림
    const RR = KIT.R; if(document.fonts && !document.fonts.check(`40px ${JUA}`)) document.fonts.load(`40px ${JUA}`).then(() => { if(RR && RR.atlas) RR.atlas.paint(!!RR.dark); }).catch(() => {});
  },
  init(KIT){ LG.forEach(g => g.dispose()); LG.length = 0; },
  tick(KIT, now, t, dt){
    if(W.extraBoxes.length && KIT.R && KIT.R.boxes && !W.boxDone){ W.boxDone = true; KIT.R.boxes = Float32Array.from([...KIT.R.boxes, ...W.extraBoxes.flat()]); KIT.R.pg = null; }
    animate(KIT.clock ? KIT.clock() : now, Math.min(0.05, dt || 0.016)); },
  theme(KIT, dark){ if(!W) return; W.recolor.forEach(m => { const u = m.geometry.userData, a = m.geometry.attributes.color; if(u && u.L && a){ a.array.set(dark ? u.D : u.L); a.needsUpdate = true; } }); },
};
export default def;
