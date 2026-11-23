/* 크레용랜드 놀이공원 3D (2026-11-24, 유나 모드 새 지역 "fun": 골목 버스 정류장에서 버스 타고 오는 작은 꿈같은 놀이공원)
   배치 (i 0~34, j 0~26, 앞 = +j. 들어오면 −j 쪽을 보고 걸음):
     앞 보도 (j 23.8~26.8): 버스 정류장 · 타는 곳 (17, 25.3, 닿으면 나감)
     입구: 성문 아치 "크레용랜드" (탑 두 개 · 무지개 · 매표소 둘)
     입구 광장 (j 18.4~23.6): 포토존 CREYONG LAND 글자 블록 + 네온 하트 · 솜사탕 수레 · 츄러스 가게 · 사방치기
     가운데: 회전목마 (17, 9.4) · 풍선 아저씨(광대) 자리 · 고리 던지기 · 길 안내 표지판
     뒤: 대관람차 (8.6, 3.3) · 바이킹 (26.2, 3.3) · 하늘 무지개 (울타리 뒤)
     왼쪽: 애벌레 롤러코스터 (둥근 네모 길 + 언덕 + 구름 터널, 역은 오른쪽 i 10~11.4)
     오른쪽: 범퍼카장 (울타리 안 6대)
   움직이는 것(목마·관람차·바이킹·코스터·범퍼카·풍선)은 정점 색 한 덩어리 dynMesh (낮·밤 두 벌). 놀이기구는 혼자서도 돌다가,
   유나 모드가 set(...)을 부르면 그 값으로 움직이고 set(null)이면 다시 혼자 돎. 유나 막기: 굳힌 정적 물건은 엔진이 자동,
   움직이는 것 자리는 W.extraBoxes (홈 boxCar 방식, 첫 tick에 엔진 목록에 더함)
   좌표: 칸 i·j ≈ 월드 1:1 (X = i − 18, Z = j − 10), 높이는 px (hz = px / 31.1). 유나 키 ≈ 1칸 (1.28m)
   브랜드 파스텔: 핑크 #E8B5C8 · 라일락 #C8B4D0 · 새싹 #4DAA97 · 잎 #72C4AE · 앰버 #E8A04A · 페이퍼 #FAF7F2 + 무지개
   깜빡임 방지: 같은 쪽을 보는 면이 같은 자리에 겹치지 않게 (0.01~0.02씩 어긋나게), 바닥에 붙는 것은 그림(paintFloor)으로 */
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const PI = Math.PI, TAU = PI * 2;
const H = px => px / 31.1;   // px → 칸 높이
const D = (l, d) => [l, d];
const RB = ["#F4A7B9", "#F9C99B", "#F6E39A", "#A8DCC8", "#A9CBEA", "#C8B4D0"];
const RBN = ["#7A5262", "#7A604C", "#7A7248", "#4C6E62", "#4C6278", "#5E5068"];   // 밤 (조명 받는 면)
const RBG = ["#E07A9C", "#E8A070", "#E0C860", "#68C0A0", "#70A0E0", "#A884D0"];   // 밤에 빛나는 무지개 (네온)
const RC = RB.map((c, k) => D(c, RBN[k]));
const rnd = k => { const v = Math.sin(k * 12.9898) * 43758.5453; return v - Math.floor(v); };
const ease = f => f <= 0 ? 0 : f >= 1 ? 1 : f - Math.sin(TAU * f) / TAU;   // 천천히 출발 · 천천히 멈춤

const EXT = [-1.4, -1.4, 35.4, 26.8], FJ = 23.8;   // 놀이공원 바깥 끝 · 앞 울타리 줄
const GATE = [17, 25.3], SPAWN = [17, 24.5, PI];
const CR = {ci:17, cj:9.4, pr:2.5, pt:0.26, hr:1.95, ir:1.15, can:2.62, seat:0.9, n:8};           // 회전목마
const FW = {ci:8.6, cj:3.3, hub:4.75, R:3.3, rim:0.56, n:8, drop:1.0};                              // 대관람차 (drop = 핀 → 앉는 면)
const VK = {ci:26.2, cj:3.3, py:4.2, arm:2.52, sj:3.3};                                             // 바이킹 (py = 축 높이, arm = 축 → 앉는 면)
const CO = {ci:5.7, cj:13.6, ri:4.0, rj:2.9, n:2.6, y0:0.32, seat:0.3, gap:0.84};                   // 애벌레 코스터 (y0 = 레일 윗면)
const BC = {rect:[23.4, 10.4, 32.6, 17.0], n:6, seat:0.3};                                           // 범퍼카장 (울타리 안쪽)
const LAMPS = [[14.6, 22.2], [19.4, 22.2], [14.9, 16.6], [19.1, 16.6], [12.3, 7.0], [21.7, 7.0], [28.2, 19.6]];

let K = null, W = null;
const X = i => K.X(i), Z = j => K.Z(j), hz = p => K.hz(p);
const B = (i, j, w, d, h, col, z0 = 0, o = {}) => K.B(i, j, w, d, h, col, z0, o);
const PINK = D("#E8B5C8", "#7A5866"), PINK2 = D("#F4D3DF", "#6A4E5A"), LILAC = D("#C8B4D0", "#5E4E68"), LILAC2 = D("#E2D6EA", "#4E4458"),
  PAPER = D("#FAF7F2", "#3A3632"), WHITE = D("#FFFFFF", "#8A847C"), WOOD = D("#D9B98F", "#6B5440"), WOODD = D("#A98258", "#4E3C2C"),
  GOLD = D("#E8C36A", "#B8964A"), AMBER = D("#E8A04A", "#8A5E2C"), SPROUT = D("#4DAA97", "#2E6A5E"), LEAF = D("#72C4AE", "#3E7A6C"),
  MINT = D("#A8DCC8", "#4C6E62"), SKY = D("#A9CBEA", "#4C6278"), PEACH = D("#F9C99B", "#7A604C"), LEMON = D("#F6E39A", "#7A7248"),
  RUBBER = D("#4A4650", "#24222A"), BULB = D("#FFF4DC", "#FFE29A"), INK = "#2A2A28";
const LG = [];
const myGeo = g => { LG.push(g); return g; };

/* ---------- 작은 도구 (홈과 같은 모양) ---------- */
function rod(a, b, r, col, cls = "s", seg = 8){
  const A = new THREE.Vector3(X(a[0]), hz(a[2]), Z(a[1])), C = new THREE.Vector3(X(b[0]), hz(b[2]), Z(b[1])), len = A.distanceTo(C); if(len < 1e-4) return;
  const o = K.sm(K.cyl(r, r, len, seg), col, (A.x + C.x) / 2, (A.y + C.y) / 2, (A.z + C.z) / 2, null, cls); o.lookAt(C); o.rotateX(PI / 2); return o;
}
const ball = (i, j, zp, r, col, cls = "m", seg = 12) => K.sm(K.sph(r, seg, Math.max(6, seg * 0.75 | 0)), col, X(i), hz(zp), Z(j), null, cls);
const disc = (i, j, r, zp, hp, col, cls = "m", seg = 24) => { const Hh = Math.max(0.006, hz(hp)); return K.sm(K.cyl(r, r, Hh, seg), col, X(i), hz(zp) + Hh / 2, Z(j), null, cls); };
const gl = (i, j, zp, rpx, col, a) => W.glows.push({p:new THREE.Vector3(X(i), hz(zp), Z(j)), s:rpx / 31.3 * 2, c:new THREE.Color(col), a});
const glW = (x, y, z, rpx, col, a) => { const g = {p:new THREE.Vector3(x, y, z), s:rpx / 31.3 * 2, c:new THREE.Color(col), a}; W.glows.push(g); return g; };
/* 방향 있는 상자: dir = 앞(보는 쪽) "+j" "-j" "+i" "-i". u = 옆(너비), v = 앞쪽. 가게·의자를 방향만 바꿔 같은 코드로 */
function frame(ci, cj, dir){
  const f = {"+j":[0, 1], "-j":[0, -1], "+i":[1, 0], "-i":[-1, 0]}[dir], w = [f[1], -f[0]];
  const at = (u, v) => [ci + w[0] * u + f[0] * v, cj + w[1] * u + f[1] * v];
  const box = (u0, u1, v0, v1, h, col, z0 = 0, o = {}) => { const a = at(u0, v0), b = at(u1, v1);
    return B(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]), h, col, z0, o); };
  const axis = {"+j":"i", "-j":"-i", "+i":"j", "-i":"-j"}[dir];
  const text = (t, u, v, zp, size, col, glow, wt = 800, fam) => { const p = at(u, v); K.wtext(t, p[0], p[1], zp, axis, size, col, glow, wt, fam || K.FONT); };
  const face = (u0, u1, v, z0, z1, col, cls = "m", t = 0.02) => { const a = at(u0, v), b = at(u1, v);
    if(f[0] === 0) K.faceJ(Math.min(a[0], b[0]), Math.max(a[0], b[0]), f[1] > 0 ? a[1] : a[1] - t, z0, z1, col, cls, t);
    else K.faceI(f[0] > 0 ? a[0] : a[0] - t, Math.min(a[1], b[1]), Math.max(a[1], b[1]), z0, z1, col, cls, t); };
  return {at, box, text, face, h:Math.atan2(f[0], f[1])};
}
/* 정점 색 한 덩어리 (움직이는 물건, 낮·밤 두 벌). add(g, 색, x, y, z, rx, ry, rz, 크기) */
function Merge(){
  const parts = [], m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sv = new THREE.Vector3();
  return {
    add(g, col, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1){ e.set(rx, ry, rz); q.setFromEuler(e); Array.isArray(s) ? sv.set(...s) : sv.set(s, s, s);
      m4.compose(new THREE.Vector3(x, y, z), q, sv); parts.push({g, c:K.cp(col), m:m4.clone()}); },
    get n(){ return parts.length; },
    geo(){
      const gs = parts.map(p => { const g = p.g.index ? p.g.toNonIndexed() : p.g.clone(); Object.keys(g.attributes).forEach(k => { if(k !== "position" && k !== "normal") g.deleteAttribute(k); });
        g.applyMatrix4(p.m); const n = g.attributes.position.count, a = new Float32Array(n * 3), b = new Float32Array(n * 3), cl = new THREE.Color(p.c[0]), cd = new THREE.Color(p.c[1]);
        for(let k = 0; k < n; k++){ a[k * 3] = cl.r; a[k * 3 + 1] = cl.g; a[k * 3 + 2] = cl.b; b[k * 3] = cd.r; b[k * 3 + 1] = cd.g; b[k * 3 + 2] = cd.b; }
        g.setAttribute("color", new THREE.BufferAttribute(a, 3)); g.userData.d = b; return g; });
      const out = mergeGeometries(gs, false), L = out.attributes.color.array.slice(), Dk = new Float32Array(L.length); let off = 0;
      gs.forEach(g => { Dk.set(g.userData.d, off); off += g.userData.d.length; g.dispose(); }); out.userData = {L, D:Dk}; return out;
    }};
}
function dynMesh(g, parent, basic){
  const mat = basic ? new THREE.MeshBasicMaterial({vertexColors:true, toneMapped:false}) : new THREE.MeshStandardMaterial({vertexColors:true, roughness:0.5, metalness:0.02});
  const m = new THREE.Mesh(g, K.cutaway(mat)); m.castShadow = !basic; m.receiveShadow = !basic; (parent || K.R.scene).add(m); W.recolor.push(m); return m;
}
/* 지역 좌표 도형 (Merge용, 캐시를 건드리지 않게 새로 만듦) */
function rodL(a, b, r, seg = 8){ const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b), d = vb.clone().sub(va), g = new THREE.CylinderGeometry(r, r, d.length(), seg);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())); g.translate(...va.clone().add(vb).multiplyScalar(0.5).toArray()); return g; }
const legG = (len, r) => K.rbox(r * 2, len, r * 2, r * 0.9, 2).clone().translate(0, -len / 2, 0);
const coneG = (r, h, s = 12) => new THREE.ConeGeometry(r, h, s);
let TRI = null;   // 깃발 세모 (양면 보이게 얇게 뽑음)
const triG = () => TRI || (TRI = myGeo((() => { const s = new THREE.Shape(); s.moveTo(-0.11, 0); s.lineTo(0.11, 0); s.lineTo(0, -0.24); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, {depth:0.008, bevelEnabled:false}); g.translate(0, 0, -0.004); return g; })()));

/* 바닥 그림 도구 (홈 paintKit 그대로 + 몇 개) */
function paintKit(c, dark){
  const v = (l, d) => dark ? d : l, FS = K.FS;
  const rect = (i0, j0, i1, j1, col) => { c.fillStyle = col; c.fillRect(i0, j0, i1 - i0, j1 - j0); };
  const rr = (i0, j0, i1, j1, r, col) => { c.fillStyle = col; c.beginPath(); c.roundRect(i0, j0, i1 - i0, j1 - j0, r); c.fill(); };
  const line = (i0, j0, i1, j1, col, w = 0.02) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(i0, j0); c.lineTo(i1, j1); c.stroke(); };
  const text = (t, i, j, size, col, w = 800, fam = K.FONT, rot = 0) => { c.save(); c.translate(i, j); c.rotate(rot); c.scale(1 / FS, 1 / FS); c.font = `${w} ${size / 31.3 * FS}px ${fam}`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = col; c.fillText(t, 0, 0); c.restore(); };
  const glow = (i, j, r, c0) => { const g = c.createRadialGradient(i, j, 0, i, j, r); g.addColorStop(0, c0); g.addColorStop(1, "rgba(255,240,210,0)"); c.fillStyle = g; c.beginPath(); c.arc(i, j, r, 0, 7); c.fill(); };
  const circ = (i, j, r, col) => { c.fillStyle = col; c.beginPath(); c.arc(i, j, r, 0, 7); c.fill(); };
  return {v, rect, rr, line, text, glow, circ};
}

/* ---------- 정적 소품 ---------- */
/* 울타리 (흰 살 + 끝 무지개 방울 + 가로대 두 줄). 축 방향만 (fenceI: j 고정, fenceJ: i 고정) */
function fenceI(i0, i1, j, h = 22){ const n = Math.max(1, Math.round((i1 - i0) / 0.34));
  for(let k = 0; k <= n; k++){ const i = i0 + (i1 - i0) * k / n;
    if(k % 4 === 0 || k === n){ B(i - 0.05, j - 0.05, 0.1, 0.1, h + 4, LILAC, 0, {r:0.02}); ball(i, j, h + 5.6, 0.065, GOLD, "s", 10); }
    else { B(i - 0.045, j - 0.018, 0.09, 0.036, h, WHITE, 0, {r:0.012}); ball(i, j, h + 0.8, 0.05, RC[k % 6], "m", 8); } }
  [7, h - 6].forEach(z => B(i0, j - 0.04, i1 - i0, 0.022, 2.2, WHITE, z, {r:0}));
}
function fenceJ(j0, j1, i, h = 22){ const n = Math.max(1, Math.round((j1 - j0) / 0.34));
  for(let k = 0; k <= n; k++){ const j = j0 + (j1 - j0) * k / n;
    if(k % 4 === 0 || k === n){ B(i - 0.05, j - 0.05, 0.1, 0.1, h + 4, LILAC, 0, {r:0.02}); ball(i, j, h + 5.6, 0.065, GOLD, "s", 10); }
    else { B(i - 0.018, j - 0.045, 0.036, 0.09, h, WHITE, 0, {r:0.012}); ball(i, j, h + 0.8, 0.05, RC[k % 6], "m", 8); } }
  [7, h - 6].forEach(z => B(i - 0.04, j0, 0.022, j1 - j0, 2.2, WHITE, z, {r:0}));
}
/* 나무: 둥근 수관 (pink = 벚꽃처럼 분홍) · 막대 사탕 나무 */
function tree(i, j, s, pink){
  K.sm(K.cyl(0.07 * s, 0.11 * s, hz(42 * s), 8), D("#8A6A4C", "#4A3828"), X(i), hz(21 * s), Z(j), null, "m");
  const c1 = pink ? D("#F4BCCD", "#6E4A58") : "plant", c2 = pink ? D("#F9D3DE", "#7A5664") : K.sh("plant", 0.14);
  [[0, 0, 58, 0.58], [-0.32, 0.12, 50, 0.42], [0.32, 0.1, 51, 0.44], [0.05, -0.3, 52, 0.42], [0.08, 0.32, 48, 0.38], [0, 0.02, 72, 0.4]].forEach(([di, dj, z, r], k) =>
    ball(i + di * s, j + dj * s, z * s, r * s, k % 2 ? c2 : c1, "m", 14));
  if(!pink) [[0.27, 0.22, 62], [-0.22, -0.16, 66], [0.12, 0.36, 54], [-0.3, 0.2, 57]].forEach(([di, dj, z], k) => ball(i + di * s, j + dj * s, z * s, 0.055 * s, RB[k % 3 === 0 ? 0 : k], "m", 8));
}
function lolly(i, j, s, col){   // 막대 사탕 모양 둥근 나무 (두 단)
  B(i - 0.2 * s, j - 0.2 * s, 0.4 * s, 0.4 * s, 10 * s, PINK, 0, {r:0.06});
  rod([i, j, 10 * s], [i, j, 40 * s], 0.035 * s, WHITE, "s", 6);
  ball(i, j, 44 * s, 0.33 * s, col, "m", 16); ball(i, j, 62 * s, 0.22 * s, K.sh(col, 0.15), "m", 14); ball(i + 0.12 * s, j + 0.2 * s, 49 * s, 0.05 * s, "#FFFFFF", "m", 8);
}
function cloudPuff(i, j, zp, s, col = WHITE, col2 = D("#F7E6F0", "#5A4A58"), cls = "m"){
  [[-0.5, 0, 0, 0.42], [0, 0.05, 0.18, 0.56], [0.52, -0.02, 0.02, 0.44], [-0.18, -0.08, 0.36, 0.38], [0.24, 0.08, 0.34, 0.36]].forEach(([di, dj, dz, r], k) =>
    ball(i + di * s, j + dj * s, zp + dz * s * 31.1, r * s, k < 3 ? col : col2, cls, 16));
}
/* 벤치: dir = 앉은 사람이 보는 쪽, 길이 1.3. 앉는 면 12px */
function bench(ci, cj, dir, col = WOOD){
  const F = frame(ci, cj, dir), leg = D("#B9A3C4", "#4E4458");
  [[-0.56, -0.14], [0.5, -0.14], [-0.56, 0.12], [0.5, 0.12]].forEach(([u, v]) => F.box(u, u + 0.06, v, v + 0.06, 10, leg, 0, {r:0, cls:"s"}));
  [-0.16, -0.02, 0.12].forEach(v => F.box(-0.65, 0.65, v, v + 0.12, 2, col, 10, {r:0.02}));
  F.box(-0.6, -0.54, -0.2, -0.14, 26, leg, 0, {r:0, cls:"s"}); F.box(0.54, 0.6, -0.2, -0.14, 26, leg, 0, {r:0, cls:"s"});
  [16, 21.5].forEach(z => F.box(-0.65, 0.65, -0.21, -0.16, 4, col, z, {r:0.015}));
  [-0.66, 0.6].forEach(u => F.box(u, u + 0.06, -0.15, 0.2, 1.6, leg, 17, {r:0.01, cls:"s"}));
}
function lampPost(i, j){
  disc(i, j, 0.2, 0, 3, LILAC, "s", 16); K.sm(K.cyl(0.05, 0.07, hz(68), 10), LILAC, X(i), hz(34), Z(j), null, "s");
  [18, 50].forEach(z => disc(i, j, 0.085, z, 2, GOLD, "s", 12));
  disc(i, j, 0.12, 68, 2, GOLD, "s", 14); ball(i, j, 75, 0.18, BULB, "glow", 16); disc(i, j, 0.14, 80.5, 1.6, GOLD, "s", 14);
  K.sm(coneG(0.16, hz(9), 14), LILAC, X(i), hz(86.5), Z(j), null, "s"); ball(i, j, 91.5, 0.04, GOLD, "s", 8);
  gl(i, j, 75, 38, "#FFE2A8", (tm, dk) => dk ? 0.5 : 0.0);
}
/* 전구 줄 (a, b = [i, j, zpx], 처짐 sag px). 굳힌 빛 구슬 + 밤에 반짝이는 빛 번짐 */
function festoon(a, b, sag, n, cols = null){
  const pt = f => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f - Math.sin(f * PI) * sag];
  for(let k = 0; k < n; k++) rod(pt(k / n), pt((k + 1) / n), 0.008, D("#5A5450", "#2A2622"), "s", 4);
  for(let k = 1; k < n; k++){ const p = pt(k / n), c = cols ? cols[k % cols.length] : BULB; ball(p[0], p[1], p[2] - 1.6, 0.045, c, "glow", 8);
    const q = k; gl(p[0], p[1], p[2] - 1.6, 10, cols ? K.cp(c)[1] : "#FFD68C", (tm, dk) => dk ? 0.22 + 0.1 * Math.sin(tm * 0.003 + q * 1.7) : 0); }   // 가까이서 보면 번지지 않게 작고 옅게
}
/* 삼각 깃발 줄 */
function bunting(a, b, sag, n){
  const pt = f => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f - Math.sin(f * PI) * sag];
  for(let k = 0; k < n; k++) rod(pt(k / n), pt((k + 1) / n), 0.007, WHITE, "s", 4);
  const ry = Math.atan2(-(Z(b[1]) - Z(a[1])), X(b[0]) - X(a[0]));
  for(let k = 1; k < n; k++){ const p = pt(k / n), m = K.sm(triG(), RC[k % 6], X(p[0]), hz(p[2]) - 0.006, Z(p[1]), null, "m"); m.rotation.y = ry; }
}
/* 원을 띠 상자 여러 개로 (유나 막기) */
function circBoxes(ci, cj, r, top, n = 7){
  for(let k = 0; k < n; k++){ const a = -r + 2 * r * k / n, b = a + 2 * r / n, m = a < 0 && b > 0 ? 0 : Math.min(Math.abs(a), Math.abs(b)), w = Math.sqrt(Math.max(0, r * r - m * m));
    W.extraBoxes.push([X(ci - w), Z(cj + a), X(ci + w), Z(cj + b), 0.08, top]); }
}

/* ===================================================================== 바닥 그림 */
function paintFun(c, dark){
  const p = paintKit(c, dark), v = p.v;
  // 잔디 + 결
  p.rect(EXT[0], EXT[1], EXT[2], EXT[3], v("#BEDCA4", "#2D4330"));
  c.globalAlpha = dark ? 0.07 : 0.13; for(let k = 0; k < 4200; k++){ c.fillStyle = k % 3 ? "#FFFFFF" : "#4E7E46"; c.fillRect(EXT[0] + rnd(k) * 36.8, EXT[1] + rnd(k + 91) * 28.2, 0.05, 0.05); } c.globalAlpha = 1;
  // 잔디 꽃 점 (무지개)
  for(let k = 0; k < 520; k++){ const i = EXT[0] + rnd(k + 300) * 36.8, j = EXT[1] + rnd(k + 777) * 25.0; p.circ(i, j, 0.035, v(RB[k % 6], RBN[k % 6])); }
  // 앞 보도 (울타리 밖) · 연석 · 도로 끝
  p.rect(EXT[0], FJ - 0.1, EXT[2], 26.45, v("#ECE4D8", "#3A3632"));
  for(let i = EXT[0]; i < EXT[2]; i += 0.6) p.line(i, FJ, i, 26.45, v("rgba(0,0,0,.06)", "rgba(255,255,255,.05)"), 0.016);
  for(let j = FJ + 0.6; j < 26.45; j += 0.6) p.line(EXT[0], j, EXT[2], j, v("rgba(0,0,0,.05)", "rgba(255,255,255,.04)"), 0.014);
  p.rect(EXT[0], 26.45, EXT[2], 26.6, v("#C9BFB2", "#4A4642")); p.rect(EXT[0], 26.6, EXT[2], EXT[3], v("#7C7F86", "#24252A"));
  for(let i = EXT[0] + 0.3; i < EXT[2]; i += 2.2) p.rect(i, 26.74, i + 1.2, 26.8, "rgba(255,255,255,.7)");
  // 버스 타는 곳 (닿으면 나감)
  p.rr(15.7, 24.75, 18.3, 25.9, 0.3, v("rgba(232,181,200,.55)", "rgba(232,181,200,.22)"));
  c.setLineDash([0.12, 0.1]); c.strokeStyle = v("#C46A8A", "#F4C7D4"); c.lineWidth = 0.035; c.beginPath(); c.roundRect(15.75, 24.8, 2.5, 1.05, 0.28); c.stroke(); c.setLineDash([]);
  p.text("🚌 버스 타는 곳", 17, 25.33, 7.5, v("#9A4E6A", "#F4C7D4"));
  // 놀이공원 길: 파스텔 보도블록
  const pave = v("#F6EADF", "#3E3733"), paveE = v("#E6CFC0", "#4A403A");
  const shapes = [
    c => c.roundRect(15.45, 13.2, 3.1, 10.8, 0.3),       // 큰길 (입구 → 회전목마)
    c => c.roundRect(2.2, 18.3, 29.6, 5.4, 0.8),         // 입구 광장
    c => c.arc(CR.ci, CR.cj, 4.45, 0, 7),                // 회전목마 광장
    c => c.roundRect(2.6, 5.6, 28.8, 1.9, 0.6),          // 뒤 산책길
    c => c.roundRect(10.6, 7.0, 2.1, 11.6, 0.5),         // 왼쪽 샛길
    c => c.roundRect(10.0, 12.0, 5.8, 3.4, 0.5),         // 코스터 역 가는 길
    c => c.roundRect(21.6, 7.0, 1.6, 11.6, 0.5),         // 오른쪽 샛길
    c => c.roundRect(19.5, 12.6, 4.0, 2.2, 0.5),         // 범퍼카 가는 길
    c => c.roundRect(6.6, 4.2, 4.0, 2.4, 0.5),           // 관람차 타는 곳
    c => c.roundRect(24.4, 5.2, 3.6, 2.0, 0.5)];         // 바이킹 타는 곳
  c.save(); c.beginPath(); shapes.forEach(f => f(c)); c.fillStyle = paveE; c.fill();
  c.lineWidth = 0.14; c.strokeStyle = paveE; c.stroke(); c.restore();
  c.save(); c.beginPath(); shapes.forEach(f => f(c)); c.clip(); p.rect(EXT[0], EXT[1], EXT[2], EXT[3], pave);
  const ln = v("rgba(150,100,80,.13)", "rgba(0,0,0,.25)");
  for(let i = 0; i < 35; i += 0.5) p.line(i, -1, i, 27, ln, 0.012); for(let j = -1; j < 27; j += 0.5) p.line(-1, j, 36, j, ln, 0.012);
  c.globalAlpha = dark ? 0.12 : 0.3; for(let k = 0; k < 900; k++){ const i = rnd(k + 5000) * 34, j = rnd(k + 9000) * 25; p.rect(i, j, i + 0.07, j + 0.07, RB[k % 6]); } c.globalAlpha = 1;   // 색종이 조각
  c.restore();
  // 회전목마 광장: 무지개 고리 + 별 모자이크
  RB.forEach((col, k) => { c.strokeStyle = v(col, RBN[k]); c.lineWidth = 0.07; c.beginPath(); c.arc(CR.ci, CR.cj, 4.3 - k * 0.075, 0, 7); c.stroke(); });
  for(let k = 0; k < 16; k++){ const a = k * TAU / 16; p.text("★", CR.ci + Math.cos(a) * 3.55, CR.cj + Math.sin(a) * 3.55, 9, v(RB[k % 6], RBN[k % 6]), 900, "system-ui"); }
  p.circ(CR.ci, CR.cj, 2.75, v("rgba(200,180,208,.35)", "rgba(0,0,0,.25)"));
  // 범퍼카장 바닥: 반짝이 파랑 + 체크 + 글씨
  const [b0, b1, b2, b3] = BC.rect; p.rect(b0, b1, b2, b3, v("#C7D5EF", "#28324E"));
  for(let i = b0; i < b2; i += 0.9) for(let j = b1; j < b3; j += 0.9) if((Math.round((i - b0) / 0.9) + Math.round((j - b1) / 0.9)) % 2) p.rect(i, j, Math.min(b2, i + 0.9), Math.min(b3, j + 0.9), v("rgba(255,255,255,.28)", "rgba(255,255,255,.04)"));
  for(let k = 0; k < 40; k++) p.text("✦", b0 + 0.3 + rnd(k + 40) * (b2 - b0 - 0.6), b1 + 0.3 + rnd(k + 80) * (b3 - b1 - 0.6), 6, v("rgba(255,255,255,.8)", "rgba(200,220,255,.3)"), 700, "system-ui");
  p.text("BUMPER CARS", (b0 + b2) / 2, (b1 + b3) / 2, 26, v("rgba(255,255,255,.55)", "rgba(169,203,234,.12)"), 900, K.SIGN);
  // 바이킹 안쪽 고무 바닥 · 관람차 밑 마당
  p.rr(21.5, 1.1, 30.9, 5.6, 0.3, v("#F2CDD9", "#47323E")); for(let i = 21.8; i < 30.8; i += 0.45) for(let j = 1.35; j < 5.5; j += 0.45) p.circ(i, j, 0.05, v("rgba(255,255,255,.45)", "rgba(255,255,255,.06)"));
  p.rr(5.6, 1.6, 11.6, 5.0, 0.5, v("#EEE4F3", "#3D3546")); for(let k = 0; k < 8; k++){ const a = k * TAU / 8; p.line(FW.ci, FW.cj, FW.ci + Math.cos(a) * 2.6, FW.cj + Math.sin(a) * 1.5, v("rgba(200,180,208,.5)", "rgba(0,0,0,.2)"), 0.03); }
  // 코스터 안쪽 꽃밭
  c.save(); c.beginPath(); c.ellipse(CO.ci, CO.cj, CO.ri - 0.45, CO.rj - 0.45, 0, 0, 7); c.clip();
  p.rect(0, 9, 12, 18, v("#B2D79A", "#2B402D")); for(let k = 0; k < 260; k++){ const i = 1 + rnd(k + 60) * 9.5, j = 10 + rnd(k + 61) * 7.5; p.circ(i, j, 0.06, v(RB[k % 6], RBN[k % 6])); p.circ(i, j, 0.022, v("#FFF6C8", "#8A8460")); }
  c.restore();
  // 사방치기 (입구 광장 오른쪽)
  const hop = [[25.9, 22.6, 26.7, 23.2, "1"], [25.9, 22.0, 26.7, 22.6, "2"], [25.5, 21.4, 26.1, 22.0, "3"], [26.5, 21.4, 27.1, 22.0, "4"], [25.9, 20.8, 26.7, 21.4, "5"], [25.5, 20.2, 26.1, 20.8, "6"], [26.5, 20.2, 27.1, 20.8, "7"], [25.9, 19.6, 26.7, 20.2, "8"]];
  hop.forEach(([i0, j0, i1, j1, t], k) => { p.rr(i0 + 0.02, j0 + 0.02, i1 - 0.02, j1 - 0.02, 0.06, v(RB[k % 6], RBN[k % 6])); p.text(t, (i0 + i1) / 2, (j0 + j1) / 2, 9, v("#FFFFFF", "#E8E0D8"), 900, K.SIGN); });
  p.text("☁︎", 26.3, 19.2, 14, v("#FFFFFF", "#8A847C"), 900, "system-ui");
  // 입구 환영 글씨 · 길 안내 그림
  p.text("WELCOME TO CREYONG LAND ♡", 17, 22.9, 8, v("rgba(196,106,138,.55)", "rgba(244,199,212,.3)"), 800, K.SIGN);
  p.text("▲", 17, 20.4, 16, v("rgba(232,181,200,.6)", "rgba(232,181,200,.2)"), 900, "system-ui"); p.text("▲", 17, 17.2, 16, v("rgba(232,181,200,.6)", "rgba(232,181,200,.2)"), 900, "system-ui");
  // 그림자 (나무 · 관람차 · 탑)
  TREES.forEach(([i, j, s]) => p.circ(i + 0.15, j + 0.15, 0.55 * s, v("rgba(60,80,50,.13)", "rgba(0,0,0,.18)")));
  // 밤: 빛 웅덩이
  if(dark){ LAMPS.forEach(([i, j]) => p.glow(i, j, 2.4, "rgba(255,214,150,.26)")); p.glow(CR.ci, CR.cj, 5.0, "rgba(255,170,210,.22)"); p.glow(17, 24.0, 2.8, "rgba(255,200,230,.22)");
    p.glow(FW.ci, FW.cj + 1.5, 4, "rgba(190,170,255,.16)"); p.glow(7.0, 20.8, 2.2, "rgba(255,120,170,.25)"); p.glow(28, 13.7, 4.5, "rgba(150,190,255,.14)"); }
  else { p.glow(CR.ci, CR.cj, 5.0, "rgba(255,250,235,.18)"); }
}

/* ===================================================================== 입구: 성문 · 매표소 · 버스 정류장 · 울타리 */
function buildGate(){
  const towerC = D("#F8EAF0", "#5A4A52");
  [15.0, 19.0].forEach((ti, side) => {
    K.sm(K.cyl(0.62, 0.68, hz(100), 24), towerC, X(ti), hz(50), Z(FJ), null, "m");
    [14, 40, 66].forEach((z, k) => K.sm(K.cyl(0.695, 0.695, hz(3), 24), [PINK, LILAC, LEAF][k], X(ti), hz(z), Z(FJ), null, "m"));
    K.sm(K.cyl(0.74, 0.74, hz(6), 24), towerC, X(ti), hz(103), Z(FJ), null, "m");
    for(let k = 0; k < 10; k++){ const a = k * TAU / 10; K.sm(K.rbox(0.2, hz(7), 0.2, 0.03), towerC, X(ti) + Math.cos(a) * 0.66, hz(109.5), Z(FJ) + Math.sin(a) * 0.66, null, "m"); }
    K.sm(coneG(0.82, hz(50), 24), side ? LILAC : PINK, X(ti), hz(106 + 25), Z(FJ), null, "m");
    rod([ti, FJ, 156], [ti, FJ, 176], 0.018, GOLD, "s", 6); ball(ti, FJ, 177, 0.05, GOLD, "s", 8);
    const fl = K.sm(triG(), side ? PINK : LEMON, X(ti) + 0.12, hz(174), Z(FJ), null, "m"); fl.rotation.z = PI / 2; fl.scale.set(1.3, 1.3, 1);
    // 탑 창 (아치) · 하트
    B(ti - 0.18, FJ + 0.6, 0.36, 0.07, 18, D("#7A6A88", "#2A2238"), 46, {r:0.08}); B(ti - 0.22, FJ + 0.585, 0.44, 0.06, 2, GOLD, 44.5, {r:0.01});
    K.wtext("♥", ti, FJ + 0.69, 82, "i", 9, D("#E86A9A", "#FF8CB8"), null, 800, "system-ui");
  });
  // 아치 들보 + 간판: 탑 꼭대기 사이에 높이 검 (유나 모드에서 문 안쪽으로 걸어 들어갈 때 등 뒤 카메라 줄이 간판 밑으로 지나가게, 바닥 112px = 3.6칸)
  B(15.4, FJ - 0.27, 3.2, 0.54, 16, PINK, 118, {r:0.08}); B(15.35, FJ - 0.3, 3.3, 0.6, 2.5, GOLD, 134, {r:0.03});
  B(15.25, FJ + 0.28, 3.5, 0.1, 27, D("#FFFFFF", "#4A4248"), 114, {r:0.06}); B(15.2, FJ + 0.265, 3.6, 0.08, 31, GOLD, 112, {r:0.05});
  K.wtext("크레용랜드", 17, FJ + 0.39, 130, "i", 15, D("#E0609A", "#FF9CC8"), D("rgba(255,255,255,0)", "#FF6FA8"), 900);
  K.wtext("CREYONG LAND · 꿈나라 놀이공원", 17, FJ + 0.39, 119.5, "i", 4.6, D("#8A6A9A", "#E2D6EA"), null, 800);
  // 들보 위 무지개 + 구름
  RB.forEach((col, k) => { const m = K.sm(myGeo(new THREE.TorusGeometry(1.15 - k * 0.12, 0.062, 8, 40, PI)), D(col, RBG[k]), X(17), hz(137), Z(FJ), null, "glow"); });
  cloudPuff(15.9, FJ + 0.05, 136, 0.55); cloudPuff(18.1, FJ + 0.05, 136, 0.55);
  // 들보 밑 전구
  for(let k = 0; k <= 10; k++){ const i = 15.6 + k * 0.28; ball(i, FJ + 0.29, 115, 0.04, BULB, "glow", 8); if(k % 2) gl(i, FJ + 0.3, 115, 12, "#FFD68C", (tm, dk) => dk ? 0.45 : 0); }
  gl(17, FJ + 0.4, 128, 60, "#FF9CC8", (tm, dk) => dk ? 0.16 : 0);
  // 매표소 (왼쪽) · 안내소 (오른쪽): 밖(+j)을 보는 작은 집
  [[13.55, "매표소", "🎟️ 자유이용권", PINK], [20.45, "안내소", "🎈 미아 · 분실물", LILAC]].forEach(([ci, name, sub, col]) => {
    const F = frame(ci, FJ, "+j");
    F.box(-0.8, 0.8, -0.5, 0.55, 58, D("#FFF8FA", "#4E4448"), 0, {r:0.04});
    F.box(-0.86, 0.86, -0.56, 0.61, 4, col, 58, {r:0.05});
    F.box(-0.62, 0.62, 0.55, 0.6, 22, D("#BFDDF0", "#33405E"), 26, {r:0.02, cls:"glass"}); F.box(-0.7, 0.7, 0.55, 0.72, 2.5, WOOD, 24, {r:0.02});
    F.box(-0.66, 0.66, 0.54, 0.62, 2, WHITE, 48, {r:0});
    for(let k = 0; k < 6; k++){ F.box(-0.88 + k * 0.293, -0.88 + (k + 1) * 0.293, 0.55, 0.9, 1.4, k % 2 ? WHITE : col, 50 - 0.01 * k, {r:0.01}); }   // 줄무늬 차양
    F.text(name, 0, 0.62, 66, 6.6, D("#9A4E6A", "#F4C7D4"));
    F.text(sub, 0, 0.73, 14, 3.6, D("#7A6A88", "#D9C6E6"), null, 700);
    F.box(-0.86, 0.86, -0.56, 0.61, 6, D("#FFFFFF", "#6A625C"), 62, {r:0.05});
    ball(ci, FJ, 72, 0.12, col, "m", 12);
  });
  // 앞 울타리 · 옆 · 뒤
  fenceI(-0.5, 12.7, FJ); fenceI(21.3, 34.5, FJ); fenceI(-0.5, 34.5, -0.5); fenceJ(-0.5, FJ, -0.5); fenceJ(-0.5, FJ, 34.5);
  // 버스 정류장 (밖 보도): 지붕 · 유리 벽 · 벤치 · 둥근 표지판
  const S = frame(21.4, 25.55, "+j");
  [[-1.3, -0.62], [1.24, -0.62], [-1.3, 0.5], [1.24, 0.5]].forEach(([u, v]) => S.box(u, u + 0.06, v, v + 0.06, 70, WHITE, 0, {r:0, cls:"s"}));
  S.box(-1.45, 1.45, -0.75, 0.72, 4, LILAC, 70, {r:0.08}); S.box(-1.4, 1.4, -0.72, 0.69, 1.5, WHITE, 74, {r:0.06});
  S.face(-1.25, 1.25, -0.6, 8, 64, D("#DDE8F2", "#7A90B8"), "glass", 0.03);
  S.box(-1.1, 1.1, -0.4, -0.02, 2.5, WOOD, 11, {r:0.03}); S.box(-1.0, -0.94, -0.36, -0.1, 11, LILAC, 0, {r:0, cls:"s"}); S.box(0.94, 1.0, -0.36, -0.1, 11, LILAC, 0, {r:0, cls:"s"});
  S.text("크레용랜드 앞", 0, 0.73, 72.5, 4.6, D("#FFFFFF", "#F2EAF2"));
  K.decal(220, 150, (c, w, h, dark) => { c.fillStyle = dark ? "#3A3248" : "#FFF6FA"; c.fillRect(0, 0, w, h);
    c.fillStyle = dark ? "#C8B4D0" : "#9A4E6A"; c.font = "800 18px system-ui"; c.textAlign = "center"; c.fillText("크레용랜드 지도", w / 2, 24);
    RB.forEach((col, k) => { c.strokeStyle = col; c.lineWidth = 5; c.beginPath(); c.arc(w / 2, h * 0.98, 70 - k * 6, PI, 0); c.stroke(); });
    [["🎡", 0.25, 0.42], ["🏴‍☠️", 0.75, 0.42], ["🎠", 0.5, 0.58], ["🐛", 0.18, 0.72], ["🚗", 0.82, 0.72], ["🍭", 0.5, 0.86]].forEach(([e, x, y]) => { c.font = "22px system-ui"; c.fillText(e, w * x, h * y); }); },
    1.3, 0.9, "i", 21.4, 25.0, hz(38));
  const BS = [14.2, 25.7];
  rod([BS[0], BS[1], 0], [BS[0], BS[1], 72], 0.03, WHITE, "s", 8);
  { const m = K.sm(K.cyl(0.3, 0.3, 0.05, 28), PINK, X(BS[0]), hz(80), Z(BS[1]), null, "s"); m.rotation.x = PI / 2; }
  K.wtext("🚌", BS[0], BS[1] + 0.035, 82.5, "i", 8, "#FFFFFF", null, 700, "system-ui"); K.wtext("크레용랜드", BS[0], BS[1] + 0.035, 75.5, "i", 3.4, D("#FFFFFF", "#FFE6EE"), null, 800);
  B(BS[0] - 0.2, BS[1] - 0.03, 0.4, 0.05, 12, D("#FFFFFF", "#6A625C"), 44, {r:0.02}); K.wtext("골목 ↔ 놀이공원", BS[0], BS[1] + 0.025, 50, "i", 2.4, "#6A5A70", null, 700);
}

/* ===================================================================== 회전목마 (정적: 받침 · 기둥 · 지붕 · 난간 / 움직임: 판 · 말) */
function buildCarouselStatic(){
  const {ci, cj} = CR;
  disc(ci, cj, 2.6, 0, 3.6, LILAC2, "m", 48);   // 받침 (판보다 조금 큼)
  for(let k = 0; k < 24; k++){ const a = k * TAU / 24; ball(ci + Math.cos(a) * 2.6, cj + Math.sin(a) * 2.6, 2, 0.045, GOLD, "s", 8); }
  // 가운데 기둥 (거울 판 8장 + 금테)
  K.sm(K.cyl(0.4, 0.44, CR.can, 16), PINK, X(ci), CR.can / 2, Z(cj), null, "m");
  for(let k = 0; k < 8; k++){ const a = k * TAU / 8 + PI / 8, m = K.sm(K.rbox(0.2, 1.1, 0.03, 0.02), D("#E6F0F6", "#6A7894"), X(ci) + Math.cos(a) * 0.43, 1.25, Z(cj) + Math.sin(a) * 0.43, null, "s"); m.rotation.y = PI / 2 - a;
    const f = K.sm(K.rbox(0.25, 1.16, 0.02, 0.02), GOLD, X(ci) + Math.cos(a) * 0.422, 1.25, Z(cj) + Math.sin(a) * 0.422, null, "s"); f.rotation.y = PI / 2 - a; }
  [0.62, 1.9].forEach(y => K.sm(K.cyl(0.47, 0.47, 0.06, 20), GOLD, X(ci), y, Z(cj), null, "s"));
  // 지붕: 밑판 · 둘레 띠 · 물결 장식 · 줄무늬 원뿔 · 꼭대기 깃발
  K.sm(K.cyl(2.8, 2.8, 0.06, 48), PINK2, X(ci), CR.can + 0.03, Z(cj), null, "m");
  K.sm(K.cyl(2.86, 2.86, 0.3, 48), PINK, X(ci), CR.can + 0.15, Z(cj), null, "m");
  K.sm(K.cyl(2.9, 2.9, 0.05, 48), GOLD, X(ci), CR.can + 0.3, Z(cj), null, "s");
  for(let k = 0; k < 28; k++){ const a = (k + 0.5) * TAU / 28, m = K.sm(K.sph(0.17, 12, 8), k % 2 ? LILAC : PAPER, X(ci) + Math.cos(a) * 2.88, CR.can - 0.02, Z(cj) + Math.sin(a) * 2.88, null, "m");
    m.scale.set(1, 0.75, 0.35); m.rotation.y = PI / 2 - a; }
  for(let k = 0; k < 14; k++){ const a0 = k * TAU / 14, g = myGeo(new THREE.CylinderGeometry(0.2, 3.0, 1.05, 3, 1, false, a0, TAU / 14));
    K.sm(g, k % 2 ? PAPER : PINK, X(ci), CR.can + 0.33 + 0.525, Z(cj), null, "m"); }
  K.sm(K.cyl(0.26, 0.3, 0.22, 16), LILAC, X(ci), CR.can + 1.45, Z(cj), null, "m"); ball(ci, cj, (CR.can + 1.6) * 31.1, 0.16, GOLD, "s", 14);
  rod([ci, cj, (CR.can + 1.7) * 31.1], [ci, cj, (CR.can + 2.35) * 31.1], 0.018, GOLD, "s", 6);
  { const fl = K.sm(triG(), PINK, X(ci) + 0.14, CR.can + 2.28, Z(cj), null, "m"); fl.rotation.z = PI / 2; fl.scale.set(1.4, 1.4, 1); }
  // 전구: 둘레 띠 · 원뿔 갈비 · 지붕 밑 고리
  for(let k = 0; k < 42; k++){ const a = k * TAU / 42, x = ci + Math.cos(a) * 2.875, y = cj + Math.sin(a) * 2.875; ball(x, y, (CR.can + 0.15) * 31.1, 0.045, BULB, "glow", 8);
    if(k % 2 === 0) gl(x, y, (CR.can + 0.15) * 31.1, 14, "#FFD68C", (tm, dk) => dk ? 0.38 + 0.18 * Math.sin(tm * 0.004 + k) : 0); }
  for(let k = 0; k < 14; k++){ const a = k * TAU / 14; for(let s = 1; s <= 4; s++){ const f = s / 5, r = 3.0 - (3.0 - 0.2) * f; ball(ci + Math.cos(a) * (r + 0.02), cj + Math.sin(a) * (r + 0.02), (CR.can + 0.33 + 1.05 * f) * 31.1, 0.04, RC[(k + s) % 6].map((c, d) => d ? RBG[(k + s) % 6] : "#FFF6E6"), "glow", 8); } }
  for(let k = 0; k < 24; k++){ const a = k * TAU / 24; ball(ci + Math.cos(a) * 2.2, cj + Math.sin(a) * 2.2, CR.can * 31.1 - 2, 0.04, BULB, "glow", 8); }
  // 난간 (앞 +j 쪽은 타는 문)
  const post = a => [ci + Math.cos(a) * 3.05, cj + Math.sin(a) * 3.05];
  const as = []; for(let k = 0; k < 20; k++){ const a = PI / 2 + PI / 10 + k * TAU / 20; if(Math.abs(Math.atan2(Math.sin(a - PI / 2), Math.cos(a - PI / 2))) > 0.2) as.push(a); }
  as.forEach((a, k) => { const [i, j] = post(a); B(i - 0.05, j - 0.05, 0.1, 0.1, 24, GOLD, 0, {r:0.02, cls:"s"}); ball(i, j, 25.5, 0.065, k % 2 ? PINK : LILAC, "m", 10);
    if(k < as.length - 1){ const b = post(as[k + 1]); [11, 20].forEach(z => rod([i, j, z], [b[0], b[1], z], 0.022, z > 15 ? PINK : WHITE, "s", 6)); } });
  // 타는 문 아치
  const g0 = post(PI / 2 - PI / 10), g1 = post(PI / 2 + PI / 10);
  [g0, g1].forEach(([i, j]) => { B(i - 0.07, j - 0.07, 0.14, 0.14, 62, PINK, 0, {r:0.03}); ball(i, j, 64, 0.1, GOLD, "s", 12); });
  B(g1[0] - 0.05, g0[1] - 0.06, g0[0] - g1[0] + 0.1, 0.12, 10, PAPER, 62, {r:0.04});
  K.wtext("🎠 회전목마", ci, g0[1] + 0.07, 67, "i", 5.2, D("#B5607E", "#F4C7D4"), null, 800);
  circBoxes(ci, cj, 2.62, 3.7);   // 판 · 말 자리 막기 (움직이는 메시라 엔진이 모름). 높이는 지붕까지: 유나 모드 카메라가 지붕 속으로 안 들어가고 당겨지게
}
function horseGeo(col, mane, saddle){
  const M = Merge();
  M.add(K.cap(0.15, 0.4), col, 0, -0.14, 0.0, PI / 2);                                // 몸통 (앞 = +z)
  M.add(K.cap(0.085, 0.2), col, 0, 0.03, 0.27, 0.55);                                 // 목
  M.add(K.rbox(0.14, 0.15, 0.27, 0.06, 2), col, 0, 0.17, 0.41, 0.4);                  // 머리
  M.add(K.rbox(0.12, 0.1, 0.1, 0.045, 2), K.sh(col, 0.12), 0, 0.105, 0.53, 0.4);      // 코
  [-1, 1].forEach(s => { M.add(coneG(0.03, 0.08, 8), col, s * 0.045, 0.285, 0.34, -0.2, 0, s * 0.2); M.add(K.sph(0.02, 8, 6), INK, s * 0.068, 0.205, 0.46); M.add(K.sph(0.008, 6, 4), "#FFFFFF", s * 0.075, 0.212, 0.475); });
  M.add(K.sph(0.022, 8, 6), GOLD, 0, 0.265, 0.45);                                    // 이마 별
  for(let k = 0; k < 6; k++) M.add(K.sph(0.05 - k * 0.003, 8, 6), mane, 0, 0.27 - k * 0.055, 0.32 - k * 0.055);   // 갈기
  M.add(K.rbox(0.26, 0.05, 0.3, 0.02, 2), saddle, 0, 0.0, -0.02);                     // 안장
  M.add(K.rbox(0.33, 0.016, 0.36, 0.006, 1), GOLD, 0, -0.03, -0.02);                  // 안장 밑 천
  [-1, 1].forEach(s => M.add(K.sph(0.022, 8, 6), GOLD, s * 0.15, -0.08, -0.02));      // 등자
  [[0.08, 0.15, -1.0], [-0.08, 0.15, -0.7], [0.08, -0.2, 0.55], [-0.08, -0.2, 0.35]].forEach(([x, z, r]) => { M.add(legG(0.28, 0.03), col, x, -0.22, z, r);
    M.add(K.sph(0.035, 8, 6), GOLD, x, -0.22 - Math.cos(r) * 0.28, z - Math.sin(r) * 0.28); });
  M.add(K.cap(0.04, 0.2), mane, 0, -0.14, -0.33, -0.7); M.add(K.sph(0.055, 8, 6), mane, 0, -0.24, -0.4);   // 꼬리
  return M.geo();
}
function buildCarouselDyn(){
  const g = new THREE.Group(); g.position.set(X(CR.ci), 0, Z(CR.cj)); K.R.scene.add(g);
  const M = Merge(), SP = TAU / CR.n;
  M.add(K.cyl(CR.pr, CR.pr, 0.14, 48), LILAC, 0, 0.17, 0);
  for(let k = 0; k < 16; k++) M.add(new THREE.CylinderGeometry(CR.pr - 0.04, CR.pr - 0.04, 0.03, 4, 1, false, k * TAU / 16, TAU / 16), k % 2 ? PINK2 : PAPER, 0, CR.pt - 0.012, 0);
  M.add(new THREE.TorusGeometry(CR.pr, 0.035, 6, 64).rotateX(PI / 2), GOLD, 0, CR.pt - 0.05, 0);
  for(let k = 0; k < CR.n; k++){ const a = PI / 2 + k * SP, x = Math.cos(a) * CR.hr, z = Math.sin(a) * CR.hr;   // 말 기둥 (판과 함께 돎)
    M.add(K.cyl(0.032, 0.032, CR.can - CR.pt, 8), GOLD, x, (CR.can + CR.pt) / 2, z); for(let s = 0; s < 6; s++) M.add(new THREE.TorusGeometry(0.036, 0.012, 5, 12).rotateX(PI / 2), PINK, x, CR.pt + 0.3 + s * 0.36, z); }
  for(let k = 0; k < 4; k++){ const a = PI / 2 + PI / 8 + k * TAU / 4, x = Math.cos(a) * CR.ir, z = Math.sin(a) * CR.ir, ry = -a;   // 안쪽: 구름 마차
    const c = [PINK2, LILAC2, D("#E2F2EA", "#3E5A50"), D("#E4EEF8", "#3E4E62")][k];
    M.add(K.rbox(0.62, 0.2, 0.5, 0.08, 2), c, x, CR.pt + 0.22, z, 0, ry);
    [[-0.22, 0.12], [0, 0.18], [0.22, 0.12], [-0.12, 0.3], [0.12, 0.3]].forEach(([u, h]) => M.add(K.sph(0.15, 12, 8), WHITE, x + Math.cos(-ry) * u - Math.sin(-ry) * -0.2, CR.pt + 0.3 + h, z + Math.sin(-ry) * u + Math.cos(-ry) * -0.2));
    M.add(K.rbox(0.5, 0.06, 0.32, 0.02, 1), PINK, x, CR.pt + 0.34, z, 0, ry); }
  const plat = dynMesh(M.geo(), g);
  // 바깥 말 8마리 (각자 오르내림)
  const cols = [WHITE, PINK2, LILAC2, D("#FCE9C8", "#6A5A44"), D("#E0F2EA", "#3E5A50"), D("#E2ECF8", "#3E4E62"), D("#FFFFFF", "#8A847C"), D("#F8DCE6", "#6A4E5A")];
  const horses = [];
  for(let k = 0; k < CR.n; k++){ const a = PI / 2 + k * SP, m = dynMesh(horseGeo(cols[k], RC[(k + 2) % 6], [PINK, LILAC, AMBER, SPROUT][k % 4]), g);
    m.position.set(Math.cos(a) * CR.hr, CR.seat, Math.sin(a) * CR.hr); m.rotation.y = -a; horses.push(m); }
  W.car = {g, plat, horses, rot:0, man:false, phase:"rest", ts:0, r0:0, d:0, mbase:0, mang:0, mt:null, rider:-1, spd:0};
}

/* ===================================================================== 대관람차 */
function buildWheelStatic(){
  const {ci, cj, hub} = FW, hp = hub * 31.1, leg = D("#FFFFFF", "#8A847C");
  [-1, 1].forEach(s => { const j = cj + s * 0.82;
    [-1, 1].forEach(t => { rod([ci + t * 2.35, cj + s * 1.1, 0], [ci, j, hp], 0.075, leg, "s", 10); B(ci + t * 2.35 - 0.2, cj + s * 1.1 - 0.2, 0.4, 0.4, 5, LILAC, 0, {r:0.05}); });
    rod([ci - 1.2, cj + s * 0.96, hp * 0.5], [ci + 1.2, cj + s * 0.96, hp * 0.5], 0.04, leg, "s", 8);   // 다리 가로대
    rod([ci - 0.62, j, hp * 0.75], [ci + 0.62, j, hp * 0.75], 0.035, leg, "s", 8); });
  { const m = K.sm(K.cyl(0.11, 0.11, 1.9, 12), GOLD, X(ci), hub, Z(cj), null, "s"); m.rotation.x = PI / 2; }   // 축
  // 타는 곳 (낮은 데크 · 계단 · 지붕 · 간판)
  B(7.3, 4.62, 2.6, 1.32, 7.5, D("#E9D6F0", "#4A3E52"), 0, {r:0.04}); B(7.26, 4.58, 2.68, 1.4, 1, WHITE, 7.5, {r:0.03});
  [7.35, 9.8].forEach(i => { B(i, 5.7, 0.08, 0.08, 64, WHITE, 0, {r:0, cls:"s"}); });
  B(7.2, 5.45, 2.8, 0.5, 3, PINK, 64, {r:0.05}); for(let k = 0; k < 9; k++) ball(7.3 + k * 0.325, 5.95, 63, 0.075, k % 2 ? LILAC : PAPER, "m", 10);
  B(7.6, 5.9, 2.0, 0.06, 12, PAPER, 66.5, {r:0.04}); K.wtext("🎡 대관람차", 8.6, 5.97, 72.5, "i", 5.2, D("#7A5A9A", "#E2D6EA"), null, 800);
  B(7.45, 4.66, 0.07, 1.2, 18, GOLD, 7.5, {r:0, cls:"s"}); B(9.68, 4.66, 0.07, 1.2, 18, GOLD, 7.5, {r:0, cls:"s"});
  W.extraBoxes.push([X(ci - 2.45), Z(cj - 0.85), X(ci + 2.45), Z(cj + 0.85), 0.08, 4.0]);   // 아래 칸 · 바퀴 밑 막기 (높이는 카메라 당김용)
}
function gondolaGeo(col){
  const M = Merge(), c2 = K.sh(col, 0.25);
  M.add(rodL([0, 0.02, 0], [0, -0.16, 0], 0.025), GOLD);
  M.add(new THREE.SphereGeometry(0.47, 18, 8, 0, TAU, 0, PI / 2), col, 0, -0.36, 0, 0, 0, 0, [1, 0.42, 1]);   // 둥근 지붕
  M.add(K.cyl(0.49, 0.49, 0.05, 20), GOLD, 0, -0.37, 0); M.add(K.sph(0.05, 8, 6), GOLD, 0, -0.16, 0);
  for(let k = 0; k < 6; k++){ const a = k * TAU / 6 + PI / 6; M.add(K.cyl(0.018, 0.018, 0.5, 6), WHITE, Math.cos(a) * 0.43, -0.63, Math.sin(a) * 0.43); }
  M.add(K.cyl(0.45, 0.4, 0.44, 20), col, 0, -1.08, 0);                                  // 통
  M.add(new THREE.TorusGeometry(0.45, 0.03, 6, 24).rotateX(PI / 2), c2, 0, -0.86, 0);
  M.add(new THREE.TorusGeometry(0.43, 0.02, 6, 24).rotateX(PI / 2), WHITE, 0, -1.0, 0);
  M.add(K.cyl(0.36, 0.36, 0.02, 18), D("#F4E8EE", "#5A4A52"), 0, -0.87, 0);
  [-1, 1].forEach(s => M.add(K.sph(0.06, 8, 6), c2, s * 0.3, -1.12, 0.33));             // 통 옆 장식 방울
  return M.geo();
}
function buildWheelDyn(){
  const {ci, cj, hub, R, rim, n} = FW, g = new THREE.Group(); g.position.set(X(ci), hub, Z(cj)); K.R.scene.add(g);
  const M = Merge(), L = Merge(), STEP = TAU / n;
  [-rim, rim].forEach(z => {
    for(let k = 0; k < n; k++) M.add(new THREE.TorusGeometry(R, 0.06, 6, 10, STEP), RC[k % 6], 0, 0, z, 0, 0, k * STEP - PI / 2);   // 무지개 바깥 테
    M.add(new THREE.TorusGeometry(R * 0.66, 0.035, 6, 48), LILAC, 0, 0, z); M.add(new THREE.TorusGeometry(1.05, 0.04, 6, 32), WHITE, 0, 0, z);
    for(let k = 0; k < 16; k++){ const a = k * TAU / 16; M.add(new THREE.BoxGeometry(0.035, R - 0.25, 0.035).translate(0, (R - 0.25) / 2 + 0.25, 0), WHITE, 0, 0, z, 0, 0, a); }
    for(let k = 0; k < 40; k++){ const a = k * TAU / 40; L.add(K.sph(0.05, 8, 6), D("#FFF6E2", "#FFE7A0"), Math.sin(a) * (R + 0.02), -Math.cos(a) * (R + 0.02), z + Math.sign(z) * 0.07); }
    for(let k = 0; k < 16; k++){ const a = (k + 0.5) * TAU / 16; L.add(K.sph(0.04, 8, 6), RC[k % 6].map((c, d) => d ? RBG[k % 6] : "#FFFFFF"), Math.sin(a) * R * 0.66, -Math.cos(a) * R * 0.66, z + Math.sign(z) * 0.05); }
  });
  for(let k = 0; k < n; k++){ const a = k * STEP; M.add(K.cyl(0.04, 0.04, rim * 2 + 0.1, 8), GOLD, Math.sin(a) * R, -Math.cos(a) * R, 0, PI / 2); }   // 곤돌라 거는 봉
  M.add(K.cyl(0.42, 0.42, rim * 2 - 0.1, 24), PINK, 0, 0, 0, PI / 2);                     // 가운데 통
  [-1, 1].forEach(s => { const z = s * (rim - 0.02);
    M.add(K.cyl(0.36, 0.36, 0.06, 24), LEMON, 0, 0, z, PI / 2);
    for(let k = 0; k < 6; k++){ const a = k * TAU / 6; M.add(K.sph(0.15, 10, 8), [PINK, PEACH, LEMON, MINT, SKY, LILAC][k], Math.cos(a) * 0.4, Math.sin(a) * 0.4, z + s * 0.03, 0, 0, 0, [1, 1, 0.45]); }
    M.add(K.sph(0.15, 12, 8), AMBER, 0, 0, z + s * 0.06, 0, 0, 0, [1, 1, 0.6]); });
  const wheel = dynMesh(M.geo(), g), bulbs = dynMesh(L.geo(), wheel, true);
  const cols = [PINK, PEACH, LEMON, MINT, SKY, LILAC, D("#72C4AE", "#3E7A6C"), D("#F4A7B9", "#7A5262")];
  const gond = cols.map(c => dynMesh(gondolaGeo(c)));
  const halos = []; for(let k = 0; k < 20; k++) halos.push(glW(0, -50, 0, 13, "#FFE2A0", (tm, dk) => dk ? 0.45 : 0));
  halos.push(glW(X(ci), hub, Z(cj) + rim + 0.1, 36, "#FFC0E0", (tm, dk) => dk ? 0.4 : 0));
  W.fw = {g, wheel, gond, halos, rot:0, man:false, phase:"rest", ts:0, r0:0, d:0, mbase:0, mang:0, rider:0};
}

/* ===================================================================== 바이킹 */
function buildVikingStatic(){
  const {ci, cj, py} = VK, pp = py * 31.1, leg = D("#FFFFFF", "#8A847C");
  [-1, 1].forEach(s => { const j = cj + s * 1.0;
    [-1, 1].forEach(t => { rod([ci + t * 2.3, cj + s * 1.35, 0], [ci, j, pp], 0.085, leg, "s", 10); B(ci + t * 2.3 - 0.22, cj + s * 1.35 - 0.22, 0.44, 0.44, 5, PINK, 0, {r:0.05}); });
    rod([ci - 1.15, cj + s * 1.17, pp * 0.5], [ci + 1.15, cj + s * 1.17, pp * 0.5], 0.045, leg, "s", 8);
    ball(ci, j, pp, 0.17, GOLD, "s", 14); });
  { const m = K.sm(K.cyl(0.1, 0.1, 2.1, 12), GOLD, X(ci), py, Z(cj), null, "s"); m.rotation.x = PI / 2; }
  // 울타리 (앞 가운데는 닫힌 문)
  fenceI(21.4, 25.5, 5.7, 20); fenceI(26.9, 31.0, 5.7, 20); fenceI(21.4, 31.0, 1.0, 20); fenceJ(1.0, 5.7, 21.4, 20); fenceJ(1.0, 5.7, 31.0, 20);
  B(25.5, 5.64, 1.4, 0.12, 18, GOLD, 0, {r:0.03}); [25.5, 26.9].forEach(i => { B(i - 0.07, 5.63, 0.14, 0.14, 40, PINK, 0, {r:0.03}); ball(i, 5.7, 42, 0.09, GOLD, "s", 10); });
  B(25.45, 5.62, 1.5, 0.1, 9, PAPER, 40, {r:0.04}); K.wtext("🏴‍☠️ 바이킹", 26.2, 5.73, 44.5, "i", 4.6, D("#8A5E2C", "#F9C99B"), null, 800);
  // 키 재는 판 (귀엽게)
  B(24.6, 5.62, 0.36, 0.06, 40, LEMON, 0, {r:0.03}); K.wtext("🦒", 24.78, 5.69, 33, "i", 5, "#FFFFFF", null, 700, "system-ui"); K.wtext("이만큼 크면 OK!", 24.78, 5.69, 22, "i", 1.7, "#6A5A40", null, 800);
}
function shipGeo(){
  const M = Merge(), hull = AMBER, rim = PAPER;
  const prof = (top, bot, tip) => { const s = new THREE.Shape(); s.moveTo(-tip[0], tip[1]); s.quadraticCurveTo(-2.15, bot - 0.05, 0, bot); s.quadraticCurveTo(2.15, bot - 0.05, tip[0], tip[1]);
    s.lineTo(tip[0] - 0.22, tip[1] - 0.06); s.quadraticCurveTo(1.85, top, 0, top); s.quadraticCurveTo(-1.85, top, -tip[0] + 0.22, tip[1] - 0.06); s.closePath(); return s; };
  const ex = (shape, depth, z, col, bev = 0.05) => { const g = new THREE.ExtrudeGeometry(shape, {depth, bevelEnabled:bev > 0, bevelThickness:bev, bevelSize:bev, bevelSegments:2, curveSegments:18}); g.translate(0, 0, z - depth / 2); M.add(g, col); };
  ex(prof(-2.78, -3.6, [2.7, -2.05]), 1.3, 0, hull, 0.06);                                     // 배 몸통
  [-1, 1].forEach(s => { ex(prof(-2.42, -2.95, [2.62, -1.95]), 0.07, s * 0.66, D("#F4C7D4", "#6A4E5A"), 0.02);   // 뱃전 벽 (분홍)
    ex(prof(-3.12, -3.32, [2.45, -2.6]), 0.02, s * 0.71, rim, 0);                               // 흰 줄
    for(let k = 0; k < 7; k++){ const x = -1.65 + k * 0.55, y = -2.68 - Math.cos(x / 2.2) * 0.02; M.add(K.cyl(0.19, 0.19, 0.05, 18), RC[k % 6], x, y, s * 0.735, PI / 2);   // 방패
      M.add(K.sph(0.05, 8, 6), GOLD, x, y, s * 0.765); } });
  for(let k = 0; k < 5; k++) M.add(K.rbox(0.28, 0.16, 1.2, 0.04, 1), k === 2 ? PINK : LILAC2, -1.3 + k * 0.65, -2.6, 0);   // 의자 (가로, 앉는 면 −2.52)
  for(let k = 0; k < 5; k++) M.add(K.rbox(0.06, 0.26, 1.2, 0.02, 1), WOOD, -1.47 + k * 0.65, -2.45, 0);                        // 등받이
  M.add(K.rbox(4.0, 0.03, 1.2, 0, 1), WOODD, 0, -2.7, 0);                                                                     // 바닥 판
  // 팔: 축 → 뱃전
  [-1, 1].forEach(s => [-1, 1].forEach(t => M.add(rodL([0, 0, s * 0.82], [t * 1.15, -2.5, s * 0.6], 0.055), WHITE)));
  [-1, 1].forEach(s => M.add(rodL([-1.15, -2.5, s * 0.6], [1.15, -2.5, s * 0.6], 0.04), GOLD));
  // 뱃머리 분홍 용 · 꼬리 소용돌이
  const dr = D("#F4A7B9", "#7A5262");
  [[2.62, -2.0, 0.13], [2.75, -1.82, 0.12], [2.84, -1.62, 0.12]].forEach(([x, y, r]) => M.add(K.sph(r, 12, 8), dr, x, y, 0));
  M.add(K.sph(0.24, 14, 10), dr, 2.98, -1.4, 0, 0, 0, 0, [1.2, 0.95, 0.95]); M.add(K.rbox(0.26, 0.18, 0.24, 0.08, 2), K.sh(dr, 0.15), 3.2, -1.45, 0);
  [-1, 1].forEach(s => { M.add(K.sph(0.06, 8, 6), "#FFFFFF", 3.06, -1.3, s * 0.15); M.add(K.sph(0.035, 8, 6), INK, 3.1, -1.29, s * 0.18); M.add(coneG(0.04, 0.16, 8), GOLD, 2.92, -1.14, s * 0.1, 0, 0, -0.35);
    M.add(K.sph(0.035, 6, 4), D("#F28AA8", "#9A4E6A"), 3.12, -1.42, s * 0.14); });
  for(let k = 0; k < 6; k++){ const a = k * 0.9, r = 0.24 - k * 0.025; M.add(K.sph(0.09 - k * 0.008, 10, 8), D("#A9CBEA", "#4C6278"), -2.65 - Math.sin(a) * r, -1.95 + k * 0.08 + Math.cos(a) * r * 0.5, 0); }
  M.add(K.sph(0.05, 8, 6), GOLD, -2.62, -1.4, 0);
  return M.geo();
}
function buildVikingDyn(){
  const g = new THREE.Group(); g.position.set(X(VK.ci), VK.py, Z(VK.cj)); K.R.scene.add(g);
  const ship = dynMesh(shipGeo(), g);
  W.vk = {g, ship, ang:0, man:false, mang:0, ts:0};
  W.extraBoxes.push([X(VK.ci - 3.4), Z(VK.cj - 0.9), X(VK.ci + 3.4), Z(VK.cj + 0.9), 0.08, 3.6]);   // 배 흔들리는 자리 (울타리 안이라 걷기엔 상관없고, 카메라가 배 속으로 안 들어가게)
}

/* ===================================================================== 애벌레 롤러코스터 (길은 모듈을 불러올 때 계산: path는 build 전에도 씀) */
const sp = (v, n) => Math.sign(v) * Math.pow(Math.abs(v), 2 / n);
const bump = (u, c, w) => { let d = Math.abs(u - c); d = Math.min(d, 1 - d); return d < w ? 0.5 + 0.5 * Math.cos(PI * d / w) : 0; };
function coRaw(s){ const a = -TAU * s; return [CO.ci + CO.ri * sp(Math.cos(a), CO.n), CO.cj + CO.rj * sp(Math.sin(a), CO.n), CO.y0 + 1.6 * bump(s, 0.3, 0.13) + 0.7 * bump(s, 0.66, 0.07) + 0.38 * bump(s, 0.85, 0.05)]; }
const CP = (() => { const N = 1200, P = [], S = [0]; for(let k = 0; k < N; k++) P.push(coRaw(k / N));
  for(let k = 1; k <= N; k++){ const a = P[k - 1], b = P[k % N]; S.push(S[k - 1] + Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])); } return {P, S, N, L:S[N]}; })();
function coAt(u){ u = ((u % 1) + 1) % 1; const {P, S, N, L} = CP, d = u * L; let lo = 0, hi = N; while(hi - lo > 1){ const m = (lo + hi) >> 1; if(S[m] <= d) lo = m; else hi = m; }
  const f = (d - S[lo]) / ((S[lo + 1] - S[lo]) || 1), a = P[lo], b = P[(lo + 1) % N]; return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]; }
function coPath(u){ const p = coAt(u), a = coAt(u - 0.002), b = coAt(u + 0.002); return [p[0], p[1], p[2] + CO.seat, Math.atan2(b[0] - a[0], b[1] - a[1])]; }
function coPitch(u){ const a = coAt(u - 0.003), b = coAt(u + 0.003); return Math.atan2(b[2] - a[2], Math.hypot(b[0] - a[0], b[1] - a[1])); }
function buildCoasterStatic(){
  const N = 520, ctr = [], railA = [], railB = [], spine = [];
  for(let k = 0; k < N; k++){ const u = k / N, p = coAt(u), q = coAt(u + 0.001), di = q[0] - p[0], dj = q[1] - p[1], l = Math.hypot(di, dj) || 1, ni = dj / l, nj = -di / l;
    ctr.push(p); railA.push(new THREE.Vector3(X(p[0] + ni * 0.22), p[2], Z(p[1] + nj * 0.22))); railB.push(new THREE.Vector3(X(p[0] - ni * 0.22), p[2], Z(p[1] - nj * 0.22)));
    spine.push(new THREE.Vector3(X(p[0]), p[2] - 0.13, Z(p[1]))); }
  const tube = (pts, r, col) => K.sm(myGeo(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true, "centripetal"), 520, r, 6, true)), col, 0, 0, 0, null, "s");
  tube(railA, 0.034, D("#FFFFFF", "#9A949C")); tube(railB, 0.034, D("#FFFFFF", "#9A949C")); tube(spine, 0.075, PINK);
  // 침목 · 기둥
  let acc = 0, accP = 0;
  for(let k = 0; k < N; k++){ const u = k / N, p = ctr[k], q = ctr[(k + 1) % N], ds = Math.hypot(q[0] - p[0], q[1] - p[1]); acc += ds; accP += ds;
    if(acc > 0.34){ acc = 0; const h = Math.atan2(q[0] - p[0], q[1] - p[1]), m = K.sm(K.rbox(0.5, 0.035, 0.07, 0), LILAC, X(p[0]), p[2] - 0.05, Z(p[1]), null, "s"); m.rotation.order = "YXZ"; m.rotation.y = h; m.rotation.x = -coPitch(u); }
    if(accP > 0.95){ accP = 0; const top = p[2] - 0.16;
      if(top > 0.08){ K.sm(K.cyl(0.05, 0.06, top, 8), LILAC, X(p[0]), top / 2, Z(p[1]), null, "s"); K.sm(K.cyl(0.1, 0.1, 0.05, 12), WHITE, X(p[0]), 0.025, Z(p[1]), null, "s"); } } }
  // 언덕 꼭대기 깃발 · 별
  { const p = coAt(0.3); rod([p[0], p[1], (p[2] + 0.05) * 31.1], [p[0], p[1], (p[2] + 0.75) * 31.1], 0.016, GOLD, "s", 6); const fl = K.sm(triG(), LEMON, X(p[0]) + 0.13, p[2] + 0.72, Z(p[1]), null, "m"); fl.rotation.z = PI / 2; fl.scale.set(1.3, 1.3, 1); }
  // 구름 터널 (왼쪽 곧은 길, u ≈ 0.5)
  { const p = coAt(0.5), q = coAt(0.505), h = Math.atan2(q[0] - p[0], q[1] - p[1]);
    const sh = K.sm(myGeo(new THREE.CylinderGeometry(0.66, 0.66, 1.7, 20, 1, true, PI / 2, PI)), D("#FFF0F6", "#5A4A58"), X(p[0]), p[2] - 0.2, Z(p[1]), null, "m"); sh.rotation.order = "YXZ"; sh.rotation.y = h; sh.rotation.x = PI / 2;
    [-0.86, 0.86].forEach((o, s) => RB.forEach((col, k) => { const m = K.sm(myGeo(new THREE.TorusGeometry(0.7 + k * 0.045, 0.024, 6, 20, PI)), D(col, RBG[k]), X(p[0] + Math.sin(h) * o), p[2] - 0.2, Z(p[1] + Math.cos(h) * o), null, "glow"); m.rotation.y = h; }));
    [[-0.5, 0.75, 0.32], [0, 0.85, 0.4], [0.5, 0.75, 0.32], [-0.3, 0.55, 0.36], [0.3, 0.55, 0.36], [0, 0.62, 0.3]].forEach(([o, y, r], k) => {
      [-1, 1].forEach(sd => ball(p[0] + Math.sin(h) * o + Math.cos(h) * sd * 0.25 * (k > 2 ? 1 : 0), p[1] + Math.cos(h) * o - Math.sin(h) * sd * 0.25 * (k > 2 ? 1 : 0), (p[2] - 0.2 + y) * 31.1, r, k % 2 ? WHITE : PINK2, "m", 14)); });
    K.wtext("☁︎ 구름 터널", p[0] + 0.72, p[1], (p[2] + 0.5) * 31.1, "j", 3.4, D("#B5607E", "#F4C7D4"), null, 800); }
  // 역: 데크 · 지붕 · 간판 · 줄 서는 난간
  B(10.02, 12.25, 1.38, 3.7, 7.5, D("#EAD6C2", "#4E4238"), 0, {r:0.03}); B(9.98, 12.21, 1.46, 3.78, 1, WHITE, 7.5, {r:0.02});
  [[9.12, 12.3], [9.12, 15.8], [11.3, 12.3], [11.3, 15.8]].forEach(([i, j]) => B(i, j, 0.08, 0.08, 66, WHITE, 0, {r:0, cls:"s"}));
  B(9.0, 12.15, 2.5, 3.85, 3, LEAF, 66, {r:0.06}); B(9.05, 12.2, 2.4, 3.75, 2, WHITE, 69, {r:0.06});
  for(let k = 0; k < 12; k++) ball(11.52, 12.25 + k * 0.33, 65, 0.075, k % 2 ? LEMON : PAPER, "m", 10);
  B(11.42, 12.9, 0.1, 2.4, 16, D("#FFFFFF", "#4A4248"), 71, {r:0.05});
  K.wtext("🐛 애벌레 코스터", 11.53, 14.1, 79, "j", 5.6, D("#3E8A72", "#A8DCC8"), null, 800);
  [12.3, 15.9].forEach(j => B(11.36, j - 0.04, 0.06, 0.08, 20, GOLD, 7.5, {r:0, cls:"s"}));
  rod([11.39, 12.3, 26], [11.39, 13.15, 26], 0.02, PINK); rod([11.39, 14.05, 26], [11.39, 15.9, 26], 0.02, PINK);   // 가운데 열린 곳으로 탐
}
function coCarGeo(col, kind){
  const M = Merge(), dk = RUBBER;
  M.add(K.rbox(0.5, 0.1, 0.62, 0.03, 1), dk, 0, 0.07, 0);                                  // 바퀴 틀
  [-1, 1].forEach(s => [-0.2, 0.2].forEach(z => M.add(K.cyl(0.06, 0.06, 0.05, 10), GOLD, s * 0.27, 0.06, z, 0, 0, PI / 2)));
  M.add(K.rbox(0.64, 0.34, 0.74, 0.15, 3), col, 0, 0.29, 0);                               // 몸통
  M.add(K.rbox(0.48, 0.03, 0.46, 0.02, 1), D("#5A4A52", "#2A2228"), 0, 0.455, -0.02);       // 앉는 구멍
  M.add(K.rbox(0.5, 0.26, 0.1, 0.05, 2), K.sh(col, -0.08), 0, 0.56, -0.3);                 // 등받이
  M.add(rodL([-0.24, 0.5, 0.26], [0.24, 0.5, 0.26], 0.022), GOLD);                         // 손잡이
  [-1, 1].forEach(s => [-0.2, 0.0, 0.2].forEach(z => M.add(K.sph(0.05, 8, 6), K.sh(col, -0.2), s * 0.31, 0.14, z)));   // 애벌레 발
  [-1, 1].forEach(s => M.add(K.sph(0.07, 10, 8), LEMON, s * 0.33, 0.3, 0.0, 0, 0, 0, [0.4, 1, 1]));   // 옆 점
  if(kind === "head"){
    M.add(K.sph(0.3, 18, 14), col, 0, 0.48, 0.46);
    [-1, 1].forEach(s => { M.add(K.sph(0.085, 12, 8), "#FFFFFF", s * 0.12, 0.56, 0.7); M.add(K.sph(0.048, 10, 8), INK, s * 0.12, 0.56, 0.77); M.add(K.sph(0.016, 6, 4), "#FFFFFF", s * 0.105, 0.58, 0.81);
      M.add(K.sph(0.05, 8, 6), D("#F49AB8", "#9A5A6E"), s * 0.2, 0.44, 0.7, 0, 0, 0, [1, 0.6, 0.5]);
      M.add(rodL([s * 0.1, 0.74, 0.46], [s * 0.2, 1.02, 0.38], 0.014), INK); M.add(K.sph(0.055, 10, 8), PINK, s * 0.2, 1.04, 0.38); });
    M.add(new THREE.TorusGeometry(0.07, 0.014, 6, 12, PI), INK, 0, 0.45, 0.75, 0, 0, PI);   // 웃는 입
  }
  if(kind === "tail"){ M.add(K.sph(0.13, 10, 8), col, 0, 0.3, -0.42); M.add(coneG(0.08, 0.18, 10), K.sh(col, 0.15), 0, 0.33, -0.56, -PI / 2); }
  return M.geo();
}
function buildCoasterDyn(){
  const cars = [coCarGeo(LEAF, "head"), coCarGeo(AMBER, "mid"), coCarGeo(PINK, "tail")].map(g => { const m = dynMesh(g); m.rotation.order = "YXZ"; return m; });
  W.co = {cars, u:0, man:false, mu:0, phase:"rest", ts:0};
}

/* ===================================================================== 범퍼카장 */
function buildBumperStatic(){
  const [i0, j0, i1, j1] = BC.rect, t = 0.24, wall = (i, j, w, d) => { B(i, j, w, d, 12, D("#FFFFFF", "#7A747C"), 0, {r:0.03}); B(i - 0.01, j - 0.01, w + 0.02, d + 0.02, 3.4, RUBBER, 3.5, {r:0.03}); B(i, j, w, d, 2, PINK, 12, {r:0.03}); };
  wall(i0 - t, j0 - t, i1 - i0 + 2 * t, t); wall(i0 - t, j1, i1 - i0 + 2 * t, t); wall(i1, j0, t, j1 - j0);
  wall(i0 - t, j0, t, 13.2 - j0); wall(i0 - t, 14.2, t, j1 - 14.2);
  B(i0 - 0.2, 13.2, 0.16, 1.0, 11, LEMON, 0, {r:0.03}); K.wtext("IN ▶", i0 - 0.2, 13.7, 6, "-j", 2.6, D("#8A6A2C", "#F6E39A"), null, 800);   // 닫힌 문
  [13.2, 14.2].forEach(j => { B(i0 - 0.27, j - 0.07, 0.14, 0.14, 30, GOLD, 0, {r:0.03}); ball(i0 - 0.2, j, 31.5, 0.08, PINK, "m", 10); });
  // 네 귀 기둥 + 가로지르는 전구 줄
  const P = [[i0 - 0.12, j0 - 0.12], [i1 + 0.12, j0 - 0.12], [i1 + 0.12, j1 + 0.12], [i0 - 0.12, j1 + 0.12]];
  P.forEach(([i, j], k) => { disc(i, j, 0.16, 12, 2, GOLD, "s", 14); K.sm(K.cyl(0.05, 0.05, hz(78), 10), [LILAC, PINK, LILAC, PINK][k], X(i), hz(14 + 39), Z(j), null, "s"); ball(i, j, 93, 0.12, RC[k * 2 % 6], "m", 12); });
  festoon([P[0][0], P[0][1], 90], [P[2][0], P[2][1], 90], 14, 22, RC.map((c, k) => [RB[k], RBG[k]]));
  festoon([P[1][0], P[1][1], 90], [P[3][0], P[3][1], 90], 14, 22, RC.map((c, k) => [RB[(k + 3) % 6], RBG[(k + 3) % 6]]));
  [[P[0], P[1]], [P[1], P[2]], [P[3], P[0]]].forEach(([a, b]) => bunting([a[0], a[1], 86], [b[0], b[1], 86], 7, 18));
  // 뒤 간판
  [25.6, 30.4].forEach(i => B(i - 0.06, j0 - 0.5, 0.12, 0.12, 100, WHITE, 0, {r:0, cls:"s"}));
  B(25.2, j0 - 0.52, 5.6, 0.12, 30, D("#3E4E78", "#1E2440"), 72, {r:0.08}); B(25.15, j0 - 0.54, 5.7, 0.1, 34, LEMON, 70, {r:0.08});
  K.wtext("범퍼카 BUMPER CARS", 28, j0 - 0.39, 87, "i", 9, D("#FFFFFF", "#FFF4C2"), D("rgba(255,255,255,0)", "rgba(255,170,80,.7)"), 900);
  for(let k = 0; k < 14; k++){ ball(25.4 + k * 0.4, j0 - 0.39, 74, 0.045, BULB, "glow", 8); ball(25.4 + k * 0.4, j0 - 0.39, 100, 0.045, BULB, "glow", 8); }
  gl(28, j0 - 0.1, 87, 80, "#FFB86A", (tm, dk) => dk ? 0.12 : 0);
}
function bumperGeo(col){
  const M = Merge(), c2 = K.sh(col, 0.2);
  M.add(new THREE.TorusGeometry(0.5, 0.085, 8, 32).rotateX(PI / 2), RUBBER, 0, 0.13, 0, 0, 0, 0, [0.88, 1, 1.18]);   // 고무 범퍼
  M.add(K.rbox(0.78, 0.24, 1.08, 0.2, 3), col, 0, 0.27, 0.02);                              // 몸통
  M.add(K.rbox(0.56, 0.03, 0.5, 0.02, 1), D("#4A3E48", "#221C22"), 0, 0.395, -0.05);        // 앉는 곳
  M.add(K.rbox(0.62, 0.3, 0.14, 0.06, 2), c2, 0, 0.5, -0.36);                               // 등받이
  M.add(rodL([0, 0.38, 0.22], [0, 0.56, 0.12], 0.018), INK); M.add(new THREE.TorusGeometry(0.1, 0.018, 6, 16), INK, 0, 0.57, 0.11, -1.0);   // 핸들
  [-1, 1].forEach(s => { M.add(K.sph(0.085, 12, 8), "#FFFFFF", s * 0.2, 0.36, 0.52); M.add(K.sph(0.045, 8, 6), INK, s * 0.2, 0.37, 0.59); M.add(K.sph(0.05, 8, 6), D("#F49AB8", "#9A5A6E"), s * 0.3, 0.27, 0.54, 0, 0, 0, [1, 0.6, 0.5]); });
  M.add(new THREE.TorusGeometry(0.07, 0.013, 6, 12, PI), INK, 0, 0.26, 0.57, 0, 0, PI);
  M.add(rodL([0.26, 0.4, -0.42], [0.3, 1.25, -0.5], 0.012), WHITE); M.add(triG().clone().scale(1.4, 1.4, 1).rotateY(PI / 2), LEMON, 0.3, 1.25, -0.6);   // 깃발 채찍
  return M.geo();
}
function buildBumperDyn(){
  const cols = [PINK, SKY, LEMON, MINT, LILAC, PEACH], [i0, j0, i1, j1] = BC.rect;
  const cars = cols.map((c, k) => { const m = dynMesh(bumperGeo(c)); const i = i0 + 1.3 + (k % 3) * 3.2, j = j0 + 1.6 + Math.floor(k / 3) * 3.4, h = rnd(k + 7) * TAU;
    return {m, i, j, h, v:1.05 + rnd(k + 3) * 0.35, man:false, bump:0}; });
  W.bc = cars;
}

/* ===================================================================== 가게 · 놀이 · 포토존 · 꾸미기 */
function buildBooths(){
  // 솜사탕 수레 (12.9, 19.5): 사는 사람은 +j 쪽에서 (−j를 봄), 장수는 −j 쪽
  { const F = frame(12.9, 19.5, "+j"), C = PINK;
    F.box(-0.62, 0.62, -0.28, 0.28, 24, D("#FFFFFF", "#7A747C"), 6, {r:0.06});
    for(let k = 0; k < 5; k++) F.face(-0.56 + k * 0.25, -0.44 + k * 0.25, 0.28, 8, 28, k % 2 ? LILAC2 : PINK2, "m", 0.012);
    F.box(-0.66, 0.66, -0.32, 0.32, 2.5, C, 30, {r:0.04});
    [-0.5, 0.5].forEach(u => { const p = F.at(u, 0.0); const w = K.sm(K.cyl(0.16, 0.16, 0.06, 16), RUBBER, X(p[0]), 0.16, Z(p[1]), null, "s"); w.rotation.x = PI / 2; });
    F.box(-0.5, -0.44, -0.2, -0.14, 6, LILAC, 0, {r:0, cls:"s"}); F.box(0.44, 0.5, -0.2, -0.14, 6, LILAC, 0, {r:0, cls:"s"});
    [[-0.58, -0.26], [0.52, -0.26], [-0.58, 0.2], [0.52, 0.2]].forEach(([u, v]) => F.box(u, u + 0.05, v, v + 0.05, 42, WHITE, 32, {r:0, cls:"s"}));
    for(let k = 0; k < 6; k++) F.box(-0.76 + k * 0.255, -0.76 + (k + 1) * 0.255, -0.42, 0.42, 3, k % 2 ? WHITE : C, 74 + (k % 2) * 0.3, {r:0.02});   // 줄무늬 지붕
    for(let k = 0; k < 6; k++){ const p = F.at(-0.64 + k * 0.255, 0.44); ball(p[0], p[1], 73, 0.07, k % 2 ? C : WHITE, "m", 10); }
    F.text("솜사탕", 0, 0.47, 66, 5.2, D("#C4507E", "#F4C7D4")); F.text("☁️ 구름 맛", 0, 0.47, 60.5, 2.6, D("#8A6A9A", "#E2D6EA"), null, 700, "system-ui");
    { const p = F.at(0.1, -0.02); disc(p[0], p[1], 0.24, 32.5, 6, D("#E6EEF4", "#6A7894"), "s", 20); }
    { const p = F.at(0.1, -0.02), t = K.sm(myGeo(new THREE.TorusGeometry(0.25, 0.022, 6, 24)), WHITE, X(p[0]), hz(38.6), Z(p[1]), null, "s"); t.rotation.x = PI / 2;
      [[0, 0, 0.13, PINK2], [0.07, 0.05, 0.08, LILAC2], [-0.06, 0.04, 0.08, D("#DCEBFA", "#4C6278")]].forEach(([a, b, r, c]) => ball(p[0] + a, p[1] + b, 41 + r * 31, r, c, "m", 12)); }   // 기계 속 솜사탕
    [[-0.42, -0.1, PINK2], [-0.28, -0.12, D("#DCEBFA", "#4C6278")], [-0.42, 0.06, LILAC2]].forEach(([u, v, c]) => { const p = F.at(u, v); rod([p[0], p[1], 32], [p[0], p[1], 46], 0.01, WHITE, "s", 4); ball(p[0], p[1], 50, 0.13, c, "m", 12); ball(p[0] + 0.05, p[1] + 0.03, 53, 0.08, K.sh(c, 0.1), "m", 10); });
  }
  // 츄러스 가게 (21.2, 19.4)
  { const F = frame(21.2, 19.4, "+j"), C = AMBER;
    F.box(-0.75, 0.75, -0.42, 0.4, 28, D("#FFF4E6", "#4E4438"), 0, {r:0.04}); F.box(-0.8, 0.8, -0.46, 0.46, 2.5, WOOD, 28, {r:0.03});
    for(let k = 0; k < 6; k++) F.face(-0.72 + k * 0.25, -0.6 + k * 0.25, 0.4, 3, 26, k % 2 ? WHITE : D("#F9D9B0", "#6A5440"), "m", 0.012);
    [[-0.72, -0.38], [0.66, -0.38]].forEach(([u, v]) => F.box(u, u + 0.06, v, v + 0.06, 44, WOODD, 30, {r:0, cls:"s"}));
    F.box(-0.78, 0.78, -0.44, -0.36, 44, D("#FFF8EE", "#4A4038"), 30, {r:0.02});
    for(let k = 0; k < 6; k++) F.box(-0.86 + k * 0.287, -0.86 + (k + 1) * 0.287, -0.46, 0.62, 2.6, k % 2 ? WHITE : C, 72 + (k % 2) * 0.3, {r:0.02});
    for(let k = 0; k < 6; k++){ const p = F.at(-0.72 + k * 0.287, 0.64); ball(p[0], p[1], 71, 0.08, k % 2 ? C : WHITE, "m", 10); }
    F.text("츄러스", 0, 0.66, 63, 5, D("#8A5E2C", "#F9C99B")); F.text("설탕 솔솔 ✨", 0, 0.42, 21, 2.6, D("#8A5E2C", "#F9C99B"), null, 700);
    // 지붕 위 큰 츄러스 간판 (별 모양 단면을 비틀어 세움)
    { const s = new THREE.Shape(); for(let k = 0; k < 12; k++){ const a = k * TAU / 12, r = k % 2 ? 0.08 : 0.12; k ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); } s.closePath();
      const g = myGeo(new THREE.ExtrudeGeometry(s, {depth:1.3, steps:12, bevelEnabled:false})); const pos = g.attributes.position;
      for(let k = 0; k < pos.count; k++){ const z = pos.getZ(k), a = z * 2.6, x = pos.getX(k), y = pos.getY(k); pos.setXY(k, x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)); } g.computeVertexNormals(); g.translate(0, 0, -0.65);
      const p = F.at(0, 0.1), m = K.sm(g, D("#C98A4A", "#6A4A2A"), X(p[0]), hz(92), Z(p[1]), null, "m"); m.rotation.order = "YXZ"; m.rotation.set(-0.5, F.h + PI / 2, 0);
      for(let k = 0; k < 10; k++) ball(p[0] + (rnd(k) - 0.5) * 0.9, p[1] + (rnd(k + 9) - 0.5) * 0.2, 90 + rnd(k + 4) * 12, 0.02, "#FFFFFF", "m", 6); }
    [[-0.3, 0.2], [-0.1, 0.24], [0.1, 0.2]].forEach(([u, v], k) => { const p = F.at(u, v); rod([p[0], p[1], 30.5], [p[0] + 0.05, p[1], 44], 0.025, D("#C98A4A", "#6A4A2A"), "m", 8); });
  }
  // 풍선 파는 곳 (13.75, 15.0): 받침 수레 + 풍선 다발(흔들림은 dynMesh)
  { B(13.45, 14.75, 0.6, 0.5, 20, LILAC, 0, {r:0.06}); B(13.4, 14.7, 0.7, 0.6, 2, PINK, 20, {r:0.05}); K.wtext("🎈 풍선", 13.75, 15.21, 12, "i", 3.6, "#FFFFFF", null, 800, "system-ui");
    [[13.55, 14.85], [13.95, 15.15]].forEach(([i, j]) => { const w = K.sm(K.cyl(0.09, 0.09, 0.04, 12), RUBBER, X(i), 0.09, Z(j) + 0.0, null, "s"); w.rotation.x = PI / 2; });
    rod([13.75, 15.0, 22], [13.75, 15.0, 34], 0.03, GOLD, "s", 8); }
  // 고리 던지기 (i 19.6~21.6, j 14.2~16.4): 앞(−i)이 길 쪽
  { const F = frame(20.6, 15.3, "-i"), C = SKY;
    F.box(-1.1, 1.1, -1.0, 1.0, 1.2, D("#EFE4D6", "#3E3832"), 0, {r:0.02});
    F.box(-1.1, 1.1, 0.78, 1.0, 22, D("#FFFFFF", "#7A747C"), 0, {r:0.03}); for(let k = 0; k < 8; k++) F.face(-1.05 + k * 0.265, -0.92 + k * 0.265, 1.0, 3, 20, k % 2 ? C : WHITE, "m", 0.012);
    F.box(-1.14, 1.14, 0.76, 1.04, 2.4, PINK, 22, {r:0.03});
    F.box(-1.1, 1.1, -1.0, -0.86, 76, D("#FFF8FA", "#4E4448"), 0, {r:0.02});
    F.box(-1.1, -0.96, -1.0, 1.0, 76, D("#FFF8FA", "#4E4448"), 0, {r:0.02}); F.box(0.96, 1.1, -1.0, 1.0, 76, D("#FFF8FA", "#4E4448"), 0, {r:0.02});
    for(let k = 0; k < 8; k++) F.box(-1.2 + k * 0.3, -1.2 + (k + 1) * 0.3, -1.05, 1.25, 3, k % 2 ? WHITE : C, 76 + (k % 2) * 0.3, {r:0.02});
    for(let k = 0; k < 8; k++){ const p = F.at(-1.05 + k * 0.3, 1.27); ball(p[0], p[1], 75, 0.085, k % 2 ? C : WHITE, "m", 10); }
    F.box(-0.9, 0.9, 1.22, 1.3, 14, D("#FFFFFF", "#4A4248"), 80, {r:0.05}); F.text("고리 던지기 ⭕", 0, 1.31, 87, 5, D("#3E6A9A", "#A9CBEA"), null, 800, "system-ui");
    F.box(-0.9, 0.9, -0.2, 0.55, 14, LILAC2, 0, {r:0.03});   // 병 받침대
    for(let a = 0; a < 4; a++) for(let b = 0; b < 3; b++){ const p = F.at(-0.66 + a * 0.44, -0.05 + b * 0.24); disc(p[0], p[1], 0.06, 14, 9, RC[(a + b * 2) % 6], "s", 12); disc(p[0], p[1], 0.025, 23, 4, RC[(a + b * 2) % 6], "s", 8); }
    [[-0.5, 0.86], [-0.2, 0.9], [0.25, 0.86], [0.55, 0.9]].forEach(([u, v], k) => { const p = F.at(u, v), t = K.sm(myGeo(new THREE.TorusGeometry(0.1, 0.02, 6, 16)), RC[k + 1], X(p[0]), hz(22.8), Z(p[1]), null, "m"); t.rotation.x = PI / 2; });
    // 상품: 큰 곰 인형 · 작은 인형들 (뒤 선반)
    F.box(-0.92, 0.92, -0.86, -0.62, 3, WOOD, 40, {r:0.02});
    { const p = F.at(0.55, -0.73), bear = D("#E8C49A", "#6A5440");
      ball(p[0], p[1], 52, 0.24, bear, "m", 14); ball(p[0], p[1], 70, 0.17, bear, "m", 14); [-1, 1].forEach(s => { const q = F.at(0.55 + s * 0.13, -0.73); ball(q[0], q[1], 76, 0.06, bear, "m", 8); ball(q[0], q[1], 46, 0.08, bear, "m", 8); });
      const f = F.at(0.55, -0.58); ball(f[0], f[1], 68, 0.06, D("#F6E6D2", "#7A6A58"), "m", 8); ball(f[0], f[1], 64, 0.035, PINK, "m", 6); }
    [[-0.6, PINK], [-0.25, MINT], [0.1, LEMON]].forEach(([u, c]) => { const p = F.at(u, -0.73); ball(p[0], p[1], 48, 0.12, c, "m", 12); ball(p[0], p[1], 58, 0.09, c, "m", 10); });
    for(let k = 0; k < 9; k++){ const p = F.at(-0.9 + k * 0.225, -0.9); ball(p[0], p[1], 70 - (k % 2) * 3, 0.04, BULB, "glow", 8); }
  }
  // 포토존: CREYONG LAND 글자 블록 (+j를 봄) + 네온 하트
  { const word = "CREYONG LAND", w = 0.6, g = 0.06, sp0 = 0.3; let tot = 0; [...word].forEach(ch => tot += ch === " " ? sp0 : w + g); tot -= g;
    let i = 7.0 - tot / 2; const j0 = 19.45;
    B(i - 0.2, j0 - 0.05, tot + 0.4, 0.5, 5, D("#FFFFFF", "#6A625C"), 0, {r:0.06});
    [...word].forEach((ch, k) => { if(ch === " "){ i += sp0; return; }
      const col = RC[k % 6], z0 = 5 + (k % 2) * 3;
      B(i, j0, w, 0.34, 38, col, z0, {r:0.07}); B(i + 0.04, j0 + 0.34, w - 0.08, 0.02, 30, K.sh(col, 0.35), z0 + 4, {r:0.01});
      K.wtext(ch, i + w / 2, j0 + 0.36, z0 + 19, "i", 22, D("#FFFFFF", "#FFF6EA"), null, 900, K.SIGN);
      ball(i + w / 2, j0 + 0.17, z0 + 38 + 3, 0.06, GOLD, "s", 8); i += w + g; });
    // 네온 하트 (밤에 빛남, 땅에 끝이 닿게 세움 · 유나가 그 안에 서서 찍음)
    const hp = []; for(let k = 0; k < 96; k++){ const t = k / 96 * TAU, x = 16 * Math.pow(Math.sin(t), 3), y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      hp.push(new THREE.Vector3(X(7.0) + x * 0.068, 1.18 + y * 0.068, Z(20.2))); }
    K.sm(myGeo(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(hp, true), 160, 0.055, 8, true)), D("#F48AB0", "#FF6FA8"), 0, 0, 0, null, "glow");
    for(let k = 0; k < 24; k++){ const p = hp[k * 4]; K.sm(K.sph(0.035, 8, 6), BULB, p.x, p.y, p.z + 0.06, null, "glow"); if(k % 2) glW(p.x, p.y, p.z + 0.06, 11, "#FFC8E0", (tm, dk) => dk ? 0.45 : 0); }
    glW(X(7.0), 1.1, Z(20.3), 70, "#FF7FB8", (tm, dk) => dk ? 0.2 : 0);
    [6.1, 7.9].forEach(i2 => { disc(i2, 20.2, 0.12, 0, 2.5, GOLD, "s", 12); });
    B(6.2, 21.05, 1.6, 0.06, 3, PINK2, 0, {r:0.02});   // 발 자리 표시 받침
    K.wtext("📸 PHOTO ZONE", 7.0, 19.97, 4, "i", 3.0, D("#B5607E", "#F4C7D4"), null, 800, "system-ui");
  }
  // 길 안내 표지판 (15.0, 17.6)
  { rod([15.0, 17.6, 0], [15.0, 17.6, 82], 0.04, WOOD, "s", 8); ball(15.0, 17.6, 84, 0.07, PINK, "m", 10);
    [[76, "🎡 대관람차 · 바이킹 ↑", LILAC, -0.12], [66, "← 🐛 코스터", LEAF, -0.28], [56, "범퍼카 🚗 →", SKY, 0.28], [46, "🎠 회전목마 ↑", PINK, 0.0]].forEach(([z, t, c, du]) => {
      B(15.0 - 0.6 + du, 17.66, 1.2, 0.05, 8, c, z - 4, {r:0.03}); K.wtext(t, 15.0 + du, 17.715, z, "i", 2.6, D("#FFFFFF", "#F2EAF2"), null, 800, "system-ui"); }); }
  // 쓰레기통 (귀여운 곰돌이 통)
  [[14.6, 18.0], [19.4, 18.0], [11.6, 6.4], [22.4, 6.4]].forEach(([i, j]) => { disc(i, j, 0.17, 0, 16, MINT, "m", 16); disc(i, j, 0.19, 16, 2, WHITE, "s", 16); [-1, 1].forEach(s => ball(i + s * 0.11, j, 19, 0.05, MINT, "m", 8)); });
}
function buildBalloonsDyn(){
  const g = new THREE.Group(); g.position.set(X(13.75), hz(34), Z(15.0)); K.R.scene.add(g); const M = Merge();
  for(let k = 0; k < 15; k++){ const a = k * 2.4, r = 0.12 + (k % 5) * 0.07, x = Math.cos(a) * r, z = Math.sin(a) * r * 0.8, y = 0.95 + (k % 4) * 0.2 + rnd(k) * 0.15;
    M.add(K.sph(0.14, 14, 10), [PINK, PEACH, LEMON, MINT, SKY, LILAC, D("#F06BA8", "#9A3E6A"), D("#FFFFFF", "#8A847C")][k % 8], x, y, z, 0, 0, 0, [1, 1.18, 1]);
    M.add(K.sph(0.025, 6, 4), K.sh(RC[k % 6], -0.2), x, y - 0.17, z); M.add(rodL([0, 0, 0], [x, y - 0.17, z], 0.004, 4), WHITE);
    M.add(K.sph(0.03, 6, 4), "#FFFFFF", x - 0.05, y + 0.06, z + 0.07); }
  M.add(K.sph(0.16, 14, 10), D("#F06BA8", "#9A3E6A"), 0.05, 1.95, 0.0, 0, 0, 0, [1, 0.95, 1]); [-1, 1].forEach(s => M.add(K.sph(0.08, 10, 8), D("#F06BA8", "#9A3E6A"), 0.05 + s * 0.12, 2.08, 0));   // 꼭대기: 곰돌이 모양 풍선
  M.add(rodL([0, 0, 0], [0.05, 1.79, 0], 0.004, 4), WHITE);
  W.bal = {g, m:dynMesh(M.geo(), g)};
}
/* 꾸미기: 나무 · 막대 사탕 나무 · 꽃 화단 · 벤치 · 가로등 · 전구 줄 · 깃발 줄 · 하늘 무지개 · 구름 */
const TREES = [[0.9, 1.0, 1.05, 0], [3.4, 0.7, 0.85, 1], [13.6, 1.0, 0.95, 0], [19.8, 0.8, 0.9, 1], [33.4, 1.1, 1.0, 0], [33.5, 7.6, 0.95, 1], [0.6, 7.4, 0.95, 1],
  [0.7, 19.0, 0.9, 0], [33.6, 20.4, 0.95, 0], [1.7, 22.6, 0.85, 1], [32.4, 22.7, 0.85, 1], [12.9, 10.2, 0.75, 1], [21.4, 10.2, 0.75, 1], [33.6, 13.6, 0.9, 0], [14.2, 4.1, 0.7, 0], [19.9, 4.1, 0.7, 0]];
function buildDecor(){
  TREES.forEach(([i, j, s, pk]) => tree(i, j, s, !!pk));
  [[11.2, 17.0, LEAF], [22.8, 17.6, PINK], [2.3, 5.0, MINT], [31.8, 6.6, LILAC], [12.0, 3.2, PEACH], [20.9, 2.4, SKY], [9.2, 21.6, LEMON]].forEach(([i, j, c]) => lolly(i, j, 0.9, c));
  // 꽃 화단 (큰길 양옆, 낮은 틀 + 꽃)
  [[14.2, 20.6, 14.95, 21.8], [19.05, 20.6, 19.8, 21.8], [14.2, 13.6, 14.95, 14.6], [19.05, 17.2, 19.8, 18.3]].forEach(([i0, j0, i1, j1], q) => {
    B(i0, j0, i1 - i0, j1 - j0, 10, D("#FFFFFF", "#6A625C"), 0, {r:0.05}); B(i0 + 0.05, j0 + 0.05, i1 - i0 - 0.1, j1 - j0 - 0.1, 0.8, D("#8A6A4C", "#3A2C22"), 10, {r:0.04});
    for(let k = 0; k < 10; k++){ const i = i0 + 0.15 + rnd(k + q * 20) * (i1 - i0 - 0.3), j = j0 + 0.15 + rnd(k + q * 20 + 7) * (j1 - j0 - 0.3), h = 13 + rnd(k + q) * 6;
      rod([i, j, 10], [i, j, h], 0.009, D("#5FA582", "#3E6E54"), "m", 4); ball(i, j, h, 0.06, RC[(k + q) % 6], "m", 8); ball(i, j, h + 0.9, 0.024, "#FFF4C2", "m", 6); } });
  // 구름 덤불 (예운옥 구름)
  [[3.0, 17.6, 0.55], [30.8, 18.0, 0.6], [1.2, 11.0, 0.5], [32.9, 4.0, 0.55]].forEach(([i, j, s]) => cloudPuff(i, j, 6, s, WHITE, PINK2));
  // 벤치
  [[10.9, 23.05, "-j"], [23.1, 23.05, "-j"], [12.15, 9.4, "+i"], [21.85, 9.4, "-i"], [4.4, 7.95, "-j"], [29.8, 7.95, "-j"], [32.2, 14.2, "-i"]].forEach(([i, j, d]) => bench(i, j, d, [WOOD, D("#F4D3DF", "#6A4E5A"), D("#E2D6EA", "#4E4458")][Math.round(i) % 3]));
  // 가로등 · 깃발 줄 · 전구 줄
  LAMPS.forEach(([i, j]) => lampPost(i, j));
  bunting([14.6, 22.2, 70], [19.4, 22.2, 70], 9, 16); bunting([14.9, 16.6, 70], [19.1, 16.6, 70], 9, 14);
  bunting([12.3, 7.0, 70], [21.7, 7.0, 70], 14, 30);
  festoon([15.05, FJ - 0.55, 100], [14.9, 16.75, 72], 16, 22); festoon([18.95, FJ - 0.55, 100], [19.1, 16.75, 72], 16, 22);
  festoon([14.6, 22.2, 72], [19.1, 16.6, 72], 20, 20); festoon([19.4, 22.2, 72], [14.9, 16.6, 72], 20, 20);
  festoon([14.9, 16.6, 72], [12.3, 7.0, 72], 18, 20); festoon([19.1, 16.6, 72], [21.7, 7.0, 72], 18, 20);
  // 하늘 무지개 (울타리 뒤) + 끝 구름 + 떠 있는 구름
  RB.forEach((col, k) => K.sm(myGeo(new THREE.TorusGeometry(10.2 - k * 0.34, 0.17, 8, 80, PI)), D(col, RBG[k]), X(17), -2.0, Z(-1.3), null, "glow"));
  cloudPuff(7.0, -1.3, 10, 1.6); cloudPuff(27.0, -1.3, 10, 1.6);
  cloudPuff(3.0, -0.9, 200, 1.0, WHITE, PINK2); cloudPuff(31.5, -1.0, 175, 1.1, WHITE, LILAC2); cloudPuff(17.0, -1.6, 262, 0.9, WHITE, PINK2);
}

/* ===================================================================== 매 프레임 */
const m4 = new THREE.Matrix4(), sc3 = new THREE.Vector3(), col3 = new THREE.Color(), ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
const _yv = new THREE.Vector3(), _yd = new THREE.Vector3(), _gd = new THREE.Vector3();
const CSP = TAU / CR.n, FSTEP = TAU / FW.n;
function idleSpin(S, t, step, turn, dur, rest){   // 혼자 돌기: 쉬었다가 (다음 맞는 칸까지) 돌고 또 쉼
  if(S.phase === "rest"){ S.rot = S.r0; if(t - S.ts > rest){ S.phase = "spin"; S.ts = t; S.d = Math.ceil((S.r0 + turn) / step - 1e-6) * step - S.r0; } return 0; }
  const f = (t - S.ts) / dur; S.rot = S.r0 + S.d * ease(f); if(f >= 1){ S.phase = "rest"; S.ts = t; S.r0 = S.rot; } return Math.sin(PI * Math.min(1, f));
}
function animate(tm, dt){
  const dk = !!K.R.dark, red = !!K.reduce, t = tm / 1000;
  // 회전목마
  { const C = W.car; let spd = 0, bt = t;
    if(C.man){ C.rot = C.mbase + C.mang; spd = 1; if(C.mt != null) bt = C.mt; }
    else if(!red) spd = idleSpin(C, t, CSP, TAU * 2, 15, 7);
    C.g.rotation.y = -C.rot;
    C.horses.forEach((h, k) => { const amp = k === C.rider && C.man ? 0 : 0.09 * spd; h.position.y = CR.seat + amp * Math.sin(bt * 2.6 + (k % 2) * PI + k * 0.3); }); }
  // 대관람차
  { const F = W.fw; if(F.man) F.rot = F.mbase + F.mang; else if(!red) idleSpin(F, t, FSTEP, FSTEP * 0.5, 5.5, 2.5);
    F.wheel.rotation.z = F.rot;
    F.gond.forEach((g, k) => { const th = F.rot + k * FSTEP; g.position.set(X(FW.ci) + Math.sin(th) * FW.R, FW.hub - Math.cos(th) * FW.R, Z(FW.cj)); g.rotation.z = Math.sin(t * 0.9 + k) * 0.03; });
    F.halos.forEach((h, k) => { if(k >= 20) return; const a = F.rot + k * TAU / 20; h.p.set(X(FW.ci) + Math.sin(a) * (FW.R + 0.02), FW.hub - Math.cos(a) * (FW.R + 0.02), Z(FW.cj) + FW.rim + 0.07); }); }
  // 바이킹: 쉼 4초 → 커짐 8초 → 크게 10초 → 작아짐 6초
  { const V = W.vk; if(V.man) V.ang = V.mang;
    else if(!red){ const c = (t - V.ts) % 28, A = c < 4 ? 0 : c < 12 ? (c - 4) / 8 : c < 22 ? 1 : 1 - (c - 22) / 6; V.ang = 0.95 * A * Math.sin(TAU * (c - 4) / 4.4); }
    V.g.rotation.z = V.ang; }
  // 코스터: 역에서 4초 쉬고 12초 한 바퀴
  { const Co = W.co; if(Co.man) Co.u = Co.mu; else if(!red){ const c = (t - Co.ts) % 16; Co.u = c < 4 ? 0 : ease((c - 4) / 12); }
    Co.cars.forEach((m, k) => { const u = Co.u - k * CO.gap / CP.L, p = coAt(u), q = coPath(u); m.position.set(X(p[0]), p[2], Z(p[1])); m.rotation.y = q[3]; m.rotation.x = -coPitch(u); }); }
  // 범퍼카: 혼자 다님 (벽 · 서로 부딪히면 튕김)
  { const [i0, j0, i1, j1] = BC.rect, cars = W.bc, m = 0.72, ddt = red ? 0 : Math.min(dt, 0.05);
    cars.forEach((c, k) => { if(c.man) return;
      c.h += Math.sin(t * 0.8 + k * 2.1) * 1.1 * ddt; c.i += Math.sin(c.h) * c.v * ddt; c.j += Math.cos(c.h) * c.v * ddt;
      if(c.i < i0 + m){ c.i = i0 + m; c.h = -c.h; c.bump = t; } if(c.i > i1 - m){ c.i = i1 - m; c.h = -c.h; c.bump = t; }
      if(c.j < j0 + m){ c.j = j0 + m; c.h = PI - c.h; c.bump = t; } if(c.j > j1 - m){ c.j = j1 - m; c.h = PI - c.h; c.bump = t; } });
    for(let a = 0; a < cars.length; a++) for(let b = a + 1; b < cars.length; b++){ const A = cars[a], Bc = cars[b], di = Bc.i - A.i, dj = Bc.j - A.j, d = Math.hypot(di, dj);
      if(d < 1.12 && d > 1e-4){ const push = (1.12 - d) / 2, ni = di / d, nj = dj / d;
        if(!A.man){ A.i -= ni * push * (Bc.man ? 2 : 1); A.j -= nj * push * (Bc.man ? 2 : 1); A.h = Math.atan2(-ni, -nj) + (rnd(a + t) - 0.5); A.bump = t; }
        if(!Bc.man){ Bc.i += ni * push * (A.man ? 2 : 1); Bc.j += nj * push * (A.man ? 2 : 1); Bc.h = Math.atan2(ni, nj) + (rnd(b + t) - 0.5); Bc.bump = t; } } }
    cars.forEach(c => { const w = Math.max(0, 1 - (t - c.bump) * 4) * 0.12; c.m.position.set(X(c.i), 0, Z(c.j)); c.m.rotation.set(0, c.h + Math.sin(t * 40) * w, Math.sin(t * 33) * w * 0.5); }); }
  // 풍선 흔들림
  if(W.bal && !red){ W.bal.g.rotation.z = Math.sin(t * 0.9) * 0.06; W.bal.g.rotation.x = Math.sin(t * 0.7 + 1) * 0.05; }
  // 빛 번짐
  const cam = K.R.camera;
  const ya = K.yuAt ? K.yuAt() : null, yv = ya ? _yv.set(X(ya[0]), ya[2] + 0.55, Z(ya[1])) : null, yd = yv ? cam.position.distanceTo(yv) : 0;
  if(yv) _yd.copy(yv).sub(cam.position).normalize();
  W.glows.forEach((g, k) => { let a = g.a(tm, dk) * Math.min(1, Math.max(0, (cam.position.distanceTo(g.p) - 1.0) / 2.2)); if(!(a > 0)){ W.gm.setMatrixAt(k, ZERO); return; }   // 카메라 코앞
    if(yv){ _gd.copy(g.p).sub(cam.position); const gd = _gd.length(); if(gd < yd + 0.3){ const off = _gd.cross(_yd).length() / gd; a *= Math.min(1, Math.max(0.15, (off - 0.05) / 0.12)); } }   // 유나 앞을 가리는 전구는 흐리게 불빛은 지움 (유나가 하얗게 뜨는 것 막음)
    col3.copy(g.c); m4.compose(g.p, cam.quaternion, sc3.set(g.s, g.s, 1)); W.gm.setMatrixAt(k, m4); W.gm.setColorAt(k, col3.multiplyScalar(Math.min(1, a))); });
  W.gm.instanceMatrix.needsUpdate = true; if(W.gm.instanceColor) W.gm.instanceColor.needsUpdate = true;
}
function buildGlowMesh(){
  const gc = document.createElement("canvas"); gc.width = gc.height = 64; { const x = gc.getContext("2d"), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.35, "rgba(255,255,255,.45)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(0, 0, 64, 64); }
  W.gtex = new THREE.CanvasTexture(gc);
  const gm = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), K.cutaway(new THREE.MeshBasicMaterial({map:W.gtex, transparent:true, blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false})), Math.max(1, W.glows.length));
  gm.frustumCulled = false; gm.renderOrder = 3; K.R.scene.add(gm); W.gm = gm;
  W.glows.forEach((g, k) => { gm.setMatrixAt(k, ZERO); gm.setColorAt(k, col3.set(0, 0, 0)); });
}

/* ===================================================================== 유나 모드에 넘길 것 */
const alive = () => !!(W && W.car);
export const FUN = {
  name:"크레용랜드 놀이공원",
  gate:GATE, spawnGate:SPAWN,
  /* 회전목마: center 둘레 r 길을 seat 높이로 돎. set(angle, t): angle = 탄 뒤 돈 각 (rideMerry처럼 atan2(j−cj, i−ci) − a0, 늘면 반시계),
     t = 말 오르내림 시각(초, 생략하면 시계). 처음 부를 때 가까운 말 칸에 맞춰 붙고(멈춰 있으면 안 튐), 탄 말은 오르내리지 않음. set(null) = 다시 혼자 돎 */
  carousel:{center:[CR.ci, CR.cj], r:CR.hr, seat:CR.seat, horses:CR.n,
    set(angle, t){ if(!alive()) return; const C = W.car; if(angle == null){ if(C.man){ C.man = false; C.phase = "rest"; C.ts = K.clock() / 1000; C.r0 = C.rot; } return; }
      if(!C.man){ C.man = true; const m = Math.round(C.rot / CSP); C.mbase = m * CSP; C.rider = ((-m % CR.n) + CR.n) % CR.n; } C.mang = angle; C.mt = t == null ? null : t; },
    angle(){ return alive() ? W.car.rot : 0; },
    horse(angle = 0){ const a = PI / 2 + angle; return [CR.ci + Math.cos(a) * CR.hr, CR.cj + Math.sin(a) * CR.hr, CR.seat, Math.atan2(-Math.sin(a), Math.cos(a))]; }},
  /* 대관람차: 혼자 천천히 (한 칸 돌고 쉼). set(angle): 처음 부를 때 맨 아래 곤돌라가 유나 칸 (가까운 칸에 붙음), 그 뒤 angle 만큼 더 돎 (TAU = 한 바퀴).
     seat(angle) = 유나 칸 앉는 곳 [i, j, y, h]. set(null) = 다시 혼자 */
  wheel:{board:[FW.ci, 5.2, H(7.5)], hub:[FW.ci, FW.cj, FW.hub], R:FW.R, drop:FW.drop, cabins:FW.n,
    set(angle){ if(!alive()) return; const F = W.fw; if(angle == null){ if(F.man){ F.man = false; F.phase = "rest"; F.ts = K.clock() / 1000; F.r0 = F.rot; } return; }
      if(!F.man){ F.man = true; const m = Math.round(F.rot / FSTEP); F.mbase = m * FSTEP; F.rider = ((-m % FW.n) + FW.n) % FW.n; } F.mang = angle; },
    angle(){ return alive() ? W.fw.rot : 0; },
    seat(angle = 0){ const th = angle; return [FW.ci + Math.sin(th) * FW.R, FW.cj, FW.hub - Math.cos(th) * FW.R - FW.drop, PI]; }},
  /* 애벌레 코스터: path(u) = 맨 앞 칸 앉는 곳 [i, j, y, heading], u 0~1 한 바퀴 (길이 비례, u=0 = 역). set(u) = 기차 앞 칸을 u에. set(null) = 다시 혼자 */
  coaster:{path:coPath, pitch:coPitch, length:CP.L, board:[10.75, 13.6, H(7.5)], seat:CO.seat,
    set(u){ if(!alive()) return; const Co = W.co; if(u == null){ if(Co.man){ Co.man = false; Co.ts = K.clock() / 1000; } return; } Co.man = true; Co.mu = u; }},
  /* 범퍼카: rect 안 6대. set(k, i, j, h) = k번 차를 직접 (h = 보는 쪽), set(k, null) = 다시 혼자. cars() = [[i, j, h] ...] 지금 자리 */
  bumper:{rect:BC.rect, board:[BC.rect[0] - 0.75, 13.7, 0], seat:BC.seat, n:BC.n,
    set(k, i, j, h){ if(!alive() || !W.bc[k]) return; const c = W.bc[k]; if(i == null){ c.man = false; return; } c.man = true; c.i = i; c.j = j; if(h != null) c.h = h; },
    cars(){ return alive() ? W.bc.map(c => [c.i, c.j, c.h]) : []; }},
  /* 바이킹: set(angle) = 흔들림 각 (라디안, + = 배 밑이 +i 쪽), 권장 ±0.95 · 4.4초 주기. set(null) = 다시 혼자. seat(angle) = [i, j, y, h, 기울기] */
  viking:{board:[VK.ci, 6.3, 0], pivot:[VK.ci, VK.cj, VK.py], arm:VK.arm, amp:0.95, period:4.4,
    set(angle){ if(!alive()) return; const V = W.vk; if(angle == null){ if(V.man){ V.man = false; V.ts = K.clock() / 1000; } return; } V.man = true; V.mang = angle; },
    seat(angle = 0){ return [VK.ci + Math.sin(angle) * VK.arm, VK.sj, VK.py - Math.cos(angle) * VK.arm, PI / 2, angle]; }},
  /* 앉는 자리 (yuna_game SEATS 형식: a~b 선분 또는 a 한 점, h = 보는 쪽 (0 = +j, PI/2 = +i, PI = −j), H = 앉는 면 높이, k = 대사 종류) */
  seats:[{a:[10.45, 23.1], b:[11.35, 23.1], h:PI, H:H(12), k:"fbench"}, {a:[22.65, 23.1], b:[23.55, 23.1], h:PI, H:H(12), k:"fbench"},
    {a:[12.06, 8.95], b:[12.06, 9.85], h:PI / 2, H:H(12), k:"fbench"}, {a:[21.94, 8.95], b:[21.94, 9.85], h:-PI / 2, H:H(12), k:"fbench"},
    {a:[3.95, 8.04], b:[4.85, 8.04], h:PI, H:H(12), k:"fbench"}, {a:[29.35, 8.04], b:[30.25, 8.04], h:PI, H:H(12), k:"fbench"}, {a:[32.29, 13.75], b:[32.29, 14.65], h:-PI / 2, H:H(12), k:"fbench"},
    {a:[20.6, 25.35], b:[22.2, 25.35], h:0, H:H(13.5), k:"fbus"}],
  sitLines:{fbench:["다리 아파~ 잠깐 쉬자 🍦", "다음엔 뭐 타지? 🎢", "솜사탕 먹고 싶다 ☁️", "회전목마 음악 좋다 🎶"],
    fbus:["버스 언제 와요? 🚌", "오늘 진짜 재밌었다! 🎡", "또 오고 싶어 💖"]},
  /* 놀이·가게 쓰는 자리 (at = 서는 곳, h = 보는 쪽, r = 닿는 거리). 키는 게임에서 fn_ 이 붙음 */
  use:[{at:[CR.ci, 12.75], k:"carousel", h:PI, r:0.7}, {at:[FW.ci, 5.2], k:"wheel", h:PI, r:0.7}, {at:[10.75, 13.6], k:"coaster", h:-PI / 2, r:0.7},
    {at:[BC.rect[0] - 0.75, 13.7], k:"bumper", h:PI / 2, r:0.7}, {at:[VK.ci, 6.3], k:"viking", h:PI, r:0.7},
    {at:[12.9, 20.45], k:"cotton", h:PI, r:0.65}, {at:[21.2, 20.45], k:"churros", h:PI, r:0.65}, {at:[14.75, 15.4], k:"balloon", h:-PI / 2, r:0.6},
    {at:[19.05, 15.3], k:"ringtoss", h:PI / 2, r:0.65}, {at:[7.0, 20.35], k:"photo", h:0, r:0.6}],
  npc:{staff:[15.55, 12.6, PI * 0.75], cotton:[12.9, 18.85, 0], clown:[13.9, 16.0, PI / 2]},
};

/* ===================================================================== 지역 정의 */
const ZONES = {
  f_gate:{name:"입구 광장", color:"#E8B5C8", rect:[2.2, 18.3, 31.8, 26.8], label:[17, 26.8, "bottom"]},
  f_carousel:{name:"회전목마", color:"#C8B4D0", rect:[12.6, 5.0, 21.4, 13.8], label:[17, 5.0, "top"]},
  f_wheel:{name:"대관람차", color:"#A9CBEA", rect:[3.6, -0.6, 13.6, 6.0], label:[8.6, -0.6, "top"]},
  f_viking:{name:"바이킹", color:"#E8A04A", rect:[21.0, -0.6, 31.4, 6.6], label:[26.2, -0.6, "top"]},
  f_coaster:{name:"애벌레 코스터", color:"#72C4AE", rect:[0.6, 9.8, 11.6, 17.4], label:[6.0, 17.4, "bottom"]},
  f_bumper:{name:"범퍼카", color:"#A9CBEA", rect:[22.8, 9.6, 33.2, 17.6], label:[28.0, 17.6, "bottom"]}};
const def = {
  id:"fun",
  zones:ZONES,
  subs:{},
  outline:[[EXT[0], EXT[1]], [EXT[2], EXT[1]], [EXT[2], EXT[3]], [EXT[0], EXT[3]]],
  ext:EXT,
  top:8.5,
  backWalls:false,
  allPts:V => [V(EXT[0], 0, EXT[1]), V(EXT[2], 0, EXT[1]), V(EXT[2], 0, EXT[3]), V(EXT[0], 0, EXT[3]), V(FW.ci, FW.hub + FW.R + 0.4, FW.cj), V(17, 7.6, -1.3), V(VK.ci, 6.2, VK.cj)],
  lamps:LAMPS.map(([i, j]) => [i, j, 2.3]),
  glow:{color:0xFFB8E0, at:[CR.ci, CR.cj + 3.2, 1.6]},
  eggs:[],
  people:[],
  paintFloor(c, dark, KIT){ if(!K) K = KIT; paintFun(c, dark); },
  build(KIT){
    K = KIT; LG.length = 0; TRI = null;
    W = {recolor:[], glows:[], extraBoxes:[], boxDone:false};
    const egg = (id, at, emo, lines) => ({id, at, emo, lines});
    def.eggs = [
      egg("f_bus", [14.2, 25.7, 84], ["🚌", "🎫"], ["크레용랜드 앞 정류장 🚌", "버스 타면 학교 앞 골목으로 가요"]),
      egg("f_ticket", [13.55, FJ + 0.6, 40], ["🎟️", "😊"], ["자유이용권 한 장 주세요! 🎟️", "어린이는 반값이래요 😆"]),
      egg("f_castle", [17, FJ, 185], ["🏰", "🌈"], ["크레용랜드에 온 걸 환영해요 🌈", "성 꼭대기에 깃발이 펄럭 🚩"]),
      egg("f_wheeltop", [FW.ci, FW.cj, (FW.hub + FW.R) * 31.1 + 10], ["🎡", "☁️"], ["관람차 꼭대기에선 우리 동네가 다 보여 ☁️", "구름에 손이 닿을 것 같아!"]),
      egg("f_bear", [21.4, 15.85, 72], ["🧸", "⭕"], ["저 큰 곰 인형 갖고 싶다 🧸", "고리 세 개 다 넣으면 준대!"]),
      egg("f_hop", [26.3, 21.4, 4], ["🦶", "🔢"], ["사방치기 한 판! 1, 2, 3… 🦶"]),
      egg("f_dragon", [VK.ci + 3.0, VK.cj, (VK.py - 1.4) * 31.1], ["🐉", "🏴‍☠️"], ["바이킹 뱃머리에 분홍 용이 있어 🐉", "으아~ 엉덩이가 붕 뜬다!"]),
      egg("f_cloud", [1.7, 13.6, 50], ["☁️", "🐛"], ["구름 터널 통과~ 슝 ☁️", "예운옥 구름이랑 닮았다!"]),
      egg("f_rainbow", [17, -1.3, 240], ["🌈", "✨"], ["하늘에 커다란 무지개 🌈", "무지개 끝엔 보물이 있대 ✨"])];
    buildGate(); buildCarouselStatic(); buildWheelStatic(); buildVikingStatic(); buildCoasterStatic(); buildBumperStatic(); buildBooths(); buildDecor();
    buildCarouselDyn(); buildWheelDyn(); buildVikingDyn(); buildCoasterDyn(); buildBumperDyn(); buildBalloonsDyn();
    buildGlowMesh();
  },
  init(KIT){ LG.forEach(g => g.dispose()); LG.length = 0; },
  tick(KIT, now, t, dt){
    if(!W) return;
    if(W.extraBoxes.length && KIT.R && KIT.R.boxes && !W.boxDone){ W.boxDone = true;   // 움직이는 놀이기구 자리 막기 상자를 엔진 목록에 더함
      KIT.R.boxes = Float32Array.from([...KIT.R.boxes, ...W.extraBoxes.flat()]); KIT.R.pg = null; }
    animate(KIT.clock ? KIT.clock() : now, dt); },
  theme(KIT, dark){ if(!W) return; W.recolor.forEach(m => { const u = m.geometry.userData, a = m.geometry.attributes.color; if(u && u.L && a){ a.array.set(dark ? u.D : u.L); a.needsUpdate = true; } }); },
};
export default def;
