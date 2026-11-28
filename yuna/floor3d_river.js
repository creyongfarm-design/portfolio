/* 강변 공원 · 동네 교회 3D (2026-11-24 감독님 "세계관 팍팍 늘려봐, 지역도 늘리고" · 유나네는 교회 다니는 집)
   유나 모드 동네 하나 (./floor3d_river.js, 열쇠 river). 칸 i 0~34 · j 0~24, 1칸 ≈ 1.28 m (유나 키 1칸)
   - 뒤 (j 0~5.85): 넓은 강. 물은 셰이더 한 장 (잔물결 · 흐르는 결 · 밤엔 가로등이 물에 비침). 못 걸어감 → W.extraBoxes로 막음
     건너편 둑 · 갈대 · 먼 동네 그림 (낮 파스텔 / 밤 창불)
   - 강가: 돌 둑 · 장밋빛 자전거길 + 산책길 · 물굽이(오리 연못) 위 무지개 나무다리 · 오리배 선착장 · 낚시 데크 · 버드나무
   - 가운데: 피크닉 돗자리 (바구니 · 김밥 · 벗어 둔 신발) · 연날리기 잔디밭 (가오리연 둘 · 방패연 하나가 줄에 매달려 날림)
     라면 카트 · 자전거 대여소 · 벤치 · 벚나무 길 · 가로등 · 밤엔 반딧불이
   - 왼쪽: 동네 교회. 흰 벽 · 박공 지붕은 먼 쪽 반만 (인형집처럼 안이 보이게) · 앞 왼쪽 종탑 (종 · 종줄 · 십자가, 밤엔 은은히)
     안: 장의자 넷씩 두 줄 · 강단 · 설교대(성경) · 피아노 · 꽃 · 나무 십자가 · 스테인드글라스 둘 + 둥근 창 · 무릎 방석
     앞뜰: 꽃밭 · 벤치 · 안내판 "크레용 동네 교회 · 주일 예배 11시"
   - 나가는 곳: 아래 공원 입구 (17, 23.3) · 오른쪽 동네 길 (33.3, 12)
   - 유나 모드: RIVER (아래) = 앉는 자리 · 쓰는 곳 · 사람 자리 · 오리배 타기 (boat.path / boat.set) · 연 (kite.set) · 종 (bell.ring) 등
   크레용 파스텔: 핑크 #E8B5C8 · 라일락 #C8B4D0 · 새싹 #4DAA97 · 잎 #72C4AE · 앰버 #E8A04A · 페이퍼 #FAF7F2
   깜빡임 방지: 같은 쪽을 보는 면이 같은 자리에 겹치지 않게, 바닥에 붙는 것은 그림(paintFloor)으로 */
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const PI = Math.PI;
const rnd = k => { const v = Math.sin(k * 12.9898 + 7.13) * 43758.5453; return v - Math.floor(v); };
const EXT = [-0.6, -0.6, 34.6, 24.6];
const RJ = 5.85, WY = 1.2;                                   // 강가 선 (j) · 물 높이 (px)
const BP0 = 6.6, BP1 = 7.6, WK1 = 8.25;                      // 자전거길 j 6.6~7.6 · 산책길 7.6~8.25
const BR = {i0:15.2, i1:19.8, j0:6.45, j1:8.35};             // 무지개 나무다리 (물굽이 위)
const POND = {ci:17.5, cj:9.05, ri:1.95, rj:1.22};          // 오리 연못 (물굽이 끝)
const C = {i0:1.8, i1:8.8, j0:9.8, j1:17.2, ci:5.3};         // 교회 안쪽 (벽 안 면)
const CT = 0.22, EAVE = 84, RIDGE = 132, LW = 30;           // 교회 벽 두께 · 처마 · 용마루 · 낮은 벽 (px)
const TW = {i0:0.35, i1:1.58, j0:15.8, j1:17.2, ci:0.965, cj:16.5};   // 종탑
const PEWJ = [12.55, 13.65, 14.75, 15.85], PEWL = [2.0, 4.55], PEWR = [6.05, 8.6];
const DOCK = {i0:20.8, i1:28.0, j0:4.4}, BERTH = [26.2, 3.9, PI / 2];  // 오리배 선착장 · 탈 배 자리 (+i를 보고 묶여 있음)
const PIER = {i0:9.2, i1:11.4, j0:2.8, ti0:8.4, ti1:12.2, tj0:1.8};    // 낚시 데크 (T자)
const KITE_AT = [24.6, 17.55];
const LAMPS = [[1.6, 8.55], [7.4, 8.55], [12.9, 8.55], [21.15, 8.55], [28.9, 8.55], [33.4, 8.55], [15.55, 14.6], [18.45, 18.6], [15.55, 21.8], [26.0, 11.05], [31.8, 13.05], [9.3, 20.0]];
const RB = ["#F4A7B9", "#F9C99B", "#F6E39A", "#A8DCC8", "#A9CBEA", "#C8B4D0"];

let K = null, W = null;
const X = i => K.X(i), Z = j => K.Z(j), hz = p => K.hz(p);
const D = (l, d) => [l, d];
const B = (i, j, w, d, h, col, z0 = 0, o = {}) => K.B(i, j, w, d, h, col, z0, o);
const PINK = D("#E8B5C8", "#7A5866"), PINK2 = D("#F4D3DF", "#6A4E5A"), LILAC = D("#C8B4D0", "#5E4E68"), LILAC2 = D("#E2D6EA", "#4E4458"),
  PAPER = D("#FAF7F2", "#3A3632"), WHITE = D("#FFFFFF", "#8A847C"), WOOD = D("#D9B98F", "#6B5440"), WOODD = D("#A98258", "#4E3C2C"),
  SPROUT = D("#4DAA97", "#2F6E62"), LEAF = D("#72C4AE", "#3E7A6A"), AMBER = D("#E8A04A", "#9A6A2E"), GOLD = D("#E8C36A", "#B8964A"),
  CHW = D("#FBF8F3", "#57524C"), CREAM = D("#FFF8EE", "#4C4640"), ROOF = D("#BCA6CB", "#4A3F56"), ROOFD = D("#A28DB3", "#3C3248"),
  STONE = D("#E6DFD2", "#4A4640"), POST = D("#5B6662", "#8A8F8A"), INK = "#2A2A28";
const LG = [];
const myGeo = g => { LG.push(g); return g; };
function rod(a, b, r, col, cls = "s", seg = 8){
  const A = new THREE.Vector3(X(a[0]), hz(a[2]), Z(a[1])), C2 = new THREE.Vector3(X(b[0]), hz(b[2]), Z(b[1])), len = A.distanceTo(C2); if(len < 1e-4) return;
  const o = K.sm(K.cyl(r, r, len, seg), col, (A.x + C2.x) / 2, (A.y + C2.y) / 2, (A.z + C2.z) / 2, null, cls); o.lookAt(C2); o.rotateX(PI / 2); return o;
}
const ball = (i, j, zp, r, col, cls = "m", seg = 12) => K.sm(K.sph(r, seg, Math.max(6, seg * 0.75 | 0)), col, X(i), hz(zp), Z(j), null, cls);
const disc = (i, j, r, zp, hp, col, cls = "m", seg = 24) => { const Hh = Math.max(0.006, hz(hp)); return K.sm(K.cyl(r, r, Hh, seg), col, X(i), hz(zp) + Hh / 2, Z(j), null, cls); };
const egg = (id, at, emo, lines) => ({id, at, emo, lines});

/* 정점 색 한 덩어리 (움직이는 물건, 낮·밤 두 벌) — floor3d_home.js 그대로 */
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
function dynMesh(g){ const m = new THREE.Mesh(g, K.cutaway(new THREE.MeshStandardMaterial({vertexColors:true, roughness:0.55}))); m.castShadow = true; K.R.scene.add(m); W.recolor.push(m); if(K.R.dark){ g.attributes.color.array.set(g.userData.D); } return m; }
const gl = (i, j, zp, rpx, col, a) => { const o = {p:new THREE.Vector3(X(i), hz(zp), Z(j)), s:rpx / 31.3 * 2, c:new THREE.Color(col), a}; W.glows.push(o); return o; };
const sc = (g, x, y, z) => { g.scale(x, y, z); return g; };

/* ---------- 바닥 그림 도구 (floor3d_home.js paintKit 그대로 + 몇 개) ---------- */
function paintKit(c, dark){
  const v = (l, d) => dark ? d : l, FS = K.FS;
  const rect = (i0, j0, i1, j1, col) => { c.fillStyle = col; c.fillRect(i0, j0, i1 - i0, j1 - j0); };
  const rr = (i0, j0, i1, j1, r, col) => { c.fillStyle = col; c.beginPath(); c.roundRect(i0, j0, i1 - i0, j1 - j0, r); c.fill(); };
  const line = (i0, j0, i1, j1, col, w = 0.02) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(i0, j0); c.lineTo(i1, j1); c.stroke(); };
  const text = (t, i, j, size, col, w = 800, fam = K.FONT) => { c.save(); c.translate(i, j); c.scale(1 / FS, 1 / FS); c.font = `${w} ${size / 31.3 * FS}px ${fam}`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = col; c.fillText(t, 0, 0); c.restore(); };
  const glow = (i, j, r, c0) => { const g = c.createRadialGradient(i, j, 0, i, j, r); g.addColorStop(0, c0); g.addColorStop(1, "rgba(255,240,210,0)"); c.fillStyle = g; c.beginPath(); c.arc(i, j, r, 0, 7); c.fill(); };
  const ell = (i, j, ri, rj, col) => { c.fillStyle = col; c.beginPath(); c.ellipse(i, j, ri, rj, 0, 0, 7); c.fill(); };
  const check = (i0, j0, i1, j1, s, a, b) => { rect(i0, j0, i1, j1, a); for(let i = i0; i < i1 - 1e-6; i += s) for(let j = j0; j < j1 - 1e-6; j += s) if((Math.round((i - i0) / s) + Math.round((j - j0) / s)) % 2) rect(i, j, Math.min(i1, i + s), Math.min(j1, j + s), b); };
  return {v, rect, rr, line, text, glow, ell, check};
}

/* ---------- 바닥 (잔디 · 길 · 돗자리 · 교회 마루 · 밤 불빛 웅덩이) ---------- */
function paintRiver(c, dark){
  const p = paintKit(c, dark), v = p.v;
  // 잔디 · 결 · 점
  p.rect(EXT[0], EXT[1], EXT[2], EXT[3], v("#BFDDA2", "#2C4330"));
  for(let i = 19.6, k = 0; i < 32.4; i += 0.9, k++) if(k % 2) p.rect(i, 13.0, i + 0.9, 22.2, v("rgba(255,255,255,.12)", "rgba(255,255,255,.025)"));   // 깎은 잔디 줄무늬 (연날리기 밭)
  c.globalAlpha = dark ? 0.07 : 0.15; for(let k = 0; k < 5200; k++){ c.fillStyle = k % 3 ? "#FFFFFF" : "#4E7E46"; c.fillRect(EXT[0] + rnd(k) * 35.2, 6.2 + rnd(k + 91) * 18.4, 0.05, 0.05); } c.globalAlpha = 1;
  for(let k = 0; k < 260; k++){ const i = EXT[0] + rnd(k * 5 + 3) * 35.2, j = 8.4 + rnd(k * 7 + 1) * 14; if(i < 9.4 && j < 17.6 || Math.abs(i - 17) < 1.1) continue;   // 토끼풀 꽃 · 민들레
    c.fillStyle = v(["#FFFFFF", "#FFF2A8", "#F7D3E0"][k % 3], ["rgba(255,255,255,.25)", "rgba(255,240,160,.22)", "rgba(240,190,210,.2)"][k % 3]); c.beginPath(); c.arc(i, j, 0.045 + (k % 4) * 0.01, 0, 7); c.fill(); }
  // 물 밑 (혹시 비치면) · 강가 돌 둑
  p.rect(EXT[0], EXT[1], EXT[2], RJ + 0.02, v("#8CCBDD", "#17243A"));
  p.rect(EXT[0], RJ, EXT[2], 6.18, v("#E6DFD2", "#4A4640")); for(let i = EXT[0]; i < EXT[2]; i += 0.55) p.line(i, RJ, i, 6.18, v("rgba(90,80,60,.16)", "rgba(0,0,0,.3)"), 0.016);
  p.rr(11.9, 6.1, 14.6, 6.62, 0.22, v("#E9E1D2", "#47433D"));   // 물수제비 자갈밭
  for(let k = 0; k < 90; k++){ c.fillStyle = v(["#CFC6B6", "#BDB3A2", "#DCD5C8"][k % 3], ["#5A554E", "#4E4A44", "#625C54"][k % 3]); c.beginPath(); c.ellipse(12.0 + rnd(k + 300) * 2.5, 6.16 + rnd(k + 410) * 0.42, 0.06, 0.04, rnd(k) * 3, 0, 7); c.fill(); }
  // 자전거길 (장밋빛) · 산책길
  p.rect(EXT[0], BP0, EXT[2], BP1, v("#E9BDB6", "#5A3E40")); p.rect(EXT[0], BP0, EXT[2], BP0 + 0.05, v("#FFFFFF", "#8A7A78")); p.rect(EXT[0], BP1 - 0.05, EXT[2], BP1, v("#FFFFFF", "#8A7A78"));
  for(let i = EXT[0]; i < EXT[2]; i += 0.9) p.rect(i, (BP0 + BP1) / 2 - 0.025, i + 0.45, (BP0 + BP1) / 2 + 0.025, v("rgba(255,255,255,.9)", "rgba(230,220,210,.45)"));
  [3.6, 11.0, 24.0, 31.0].forEach(i => { const j = BP0 + 0.25, col = v("rgba(255,255,255,.85)", "rgba(230,220,210,.4)"); c.strokeStyle = col; c.lineWidth = 0.035;   // 자전거 그림
    [[-0.17, 0], [0.17, 0]].forEach(([di]) => { c.beginPath(); c.arc(i + di, j, 0.11, 0, 7); c.stroke(); }); c.beginPath(); c.moveTo(i - 0.17, j); c.lineTo(i - 0.02, j - 0.13); c.lineTo(i + 0.1, j - 0.13); c.lineTo(i + 0.17, j); c.moveTo(i - 0.02, j - 0.13); c.lineTo(i + 0.02, j); c.lineTo(i - 0.17, j); c.stroke(); });
  p.rect(EXT[0], BP1, EXT[2], WK1, v("#F2EADD", "#3E3A35")); for(let i = EXT[0]; i < EXT[2]; i += 0.5) p.line(i, BP1, i, WK1, v("rgba(120,100,70,.10)", "rgba(0,0,0,.25)"), 0.012);
  // 공원 길: 입구 → 광장 → 연못 양옆 → 자전거길 · 오른쪽 동네 길 · 교회 앞뜰 길
  const pc = v("#F0E6D5", "#3F3A34"), pl = v("rgba(120,100,70,.12)", "rgba(0,0,0,.25)");
  p.rect(16.25, 12.0, 17.75, EXT[3], pc); for(let j = 12.4; j < EXT[3]; j += 0.5) p.line(16.25, j, 17.75, j, pl, 0.012);
  p.rr(13.9, 10.25, 21.1, 12.75, 0.9, pc); p.rr(14.15, WK1 - 0.1, 15.35, 11.0, 0.35, pc); p.rr(19.65, WK1 - 0.1, 20.85, 11.0, 0.35, pc);
  p.ell(POND.ci, POND.cj + 0.08, POND.ri + 0.28, POND.rj + 0.26, v("#D8CDB8", "#433E36"));   // 연못 둘레 흙
  p.rect(20.8, 11.45, EXT[2], 12.55, pc); for(let i = 21.2; i < EXT[2]; i += 0.5) p.line(i, 11.45, i, 12.55, pl, 0.012);
  p.rr(32.15, 12.3, EXT[2], 18.35, 0.3, pc); for(let j = 12.8; j < 18.3; j += 0.5) p.line(32.15, j, EXT[2], j, pl, 0.012); p.text("🎾 →", 33.0, 15.2, 5.2, v("rgba(110,90,70,.45)", "rgba(220,210,190,.25)"));   // 테니스장 길
  p.rr(4.75, 20.55, 16.4, 21.4, 0.3, pc);
  [17.75, 18.35, 18.95, 19.55, 20.15].forEach((j, k) => p.rr(4.85 + (k % 2) * 0.12, j - 0.22, 5.65 + (k % 2) * 0.12, j + 0.22, 0.16, v("#E8E1D6", "#55504A")));   // 교회 문 앞 디딤돌
  // 아래 보도 (입구 바깥)
  p.rect(EXT[0], 22.95, EXT[2], EXT[3], v("#E3DDD2", "#3A3734")); p.rect(EXT[0], 22.9, EXT[2], 22.98, v("#BDB5A9", "#4A4642"));
  for(let i = EXT[0]; i < EXT[2]; i += 0.8) p.line(i, 22.98, i, EXT[3], v("rgba(0,0,0,.07)", "rgba(255,255,255,.05)"), 0.016);
  // 교회 마루 · 통로 카펫 · 종탑 바닥
  p.rect(C.i0, C.j0, C.i1, C.j1, v("#EAD6B8", "#4A3B2E")); for(let i = C.i0 + 0.35; i < C.i1; i += 0.35) p.line(i, C.j0, i, C.j1, v("rgba(120,80,40,.12)", "rgba(0,0,0,.22)"), 0.014);
  for(let k = 0, i = C.i0; i < C.i1; i += 0.35, k++) for(let j = C.j0 + (k % 3) * 0.7; j < C.j1; j += 2.1) p.line(i, j, i + 0.35, j, v("rgba(120,80,40,.10)", "rgba(0,0,0,.2)"), 0.012);
  p.rect(4.68, 11.3, 5.92, C.j1, v("#D99AA8", "#6A3E48")); p.rect(4.68, 11.3, 4.74, C.j1, v("#E8C36A", "#9A7E40")); p.rect(5.86, 11.3, 5.92, C.j1, v("#E8C36A", "#9A7E40"));
  p.rect(TW.i0, TW.j0, TW.i1, TW.j1 + 0.4, v("#E6DFD2", "#4A4640"));
  // 앞뜰 꽃밭 흙 · 산울타리 밑
  [[1.9, 17.6, 4.55, 18.55], [6.05, 17.6, 8.75, 18.55]].forEach(([a, b, cc, d]) => p.rr(a, b, cc, d, 0.25, v("#8A6A4C", "#3A2C22")));
  p.rr(EXT[0], 22.3, 15.85, 22.9, 0.2, v("#8A6A4C", "#3A2C22")); p.rr(18.15, 22.3, EXT[2], 22.9, 0.2, v("#8A6A4C", "#3A2C22"));
  // 돗자리 (가족: 분홍 체크 · 유나: 라일락 줄무늬)
  p.rr(9.95, 13.55, 12.45, 15.55, 0.05, v("#FFFFFF", "#6A5A60")); p.check(10.0, 13.6, 12.4, 15.5, 0.24, v("#FFFFFF", "#6A5A60"), v("#F4BFD0", "#7A5060"));
  p.rect(12.55, 15.2, 14.45, 16.85, v("#F3EEF6", "#4E4656")); for(let i = 12.55; i < 14.4; i += 0.32) p.rect(i, 15.2, i + 0.16, 16.85, v("#D9CBE4", "#5E5068"));
  p.rect(12.55, 15.2, 14.45, 15.26, v("#B9A3C8", "#6E5C7E")); p.rect(12.55, 16.79, 14.45, 16.85, v("#B9A3C8", "#6E5C7E"));
  p.rr(27.25, 19.25, 29.15, 20.85, 0.05, v("#FFFFFF", "#4E6660")); p.check(27.3, 19.3, 29.1, 20.8, 0.3, v("#FFFFFF", "#4E6660"), v("#BFE6D8", "#3E5E56"));   // 연날리기 밭 민트 돗자리
  p.ell(11.8, 19.6, 1.35, 0.62, v("#8A6A4C", "#3A2C22")); p.ell(11.8, 19.6, 1.2, 0.5, v("#9A7856", "#43342A"));   // 튤립 꽃밭
  // 벚꽃잎
  for(let k = 0; k < 220; k++){ const t = CHERRY[k % CHERRY.length], a = rnd(k * 3) * 7, r = Math.sqrt(rnd(k * 5 + 1)) * 1.3 * t[2];
    c.fillStyle = v(k % 3 ? "#F7C9D7" : "#FFFFFF", "rgba(230,170,195,.35)"); c.beginPath(); c.ellipse(t[0] + Math.cos(a) * r, t[1] + Math.sin(a) * r * 0.8, 0.045, 0.028, a, 0, 7); c.fill(); }
  // 글씨
  p.text("자전거 · 천천히 🚲", 8.6, BP0 + 0.75, 5.2, v("rgba(255,255,255,.75)", "rgba(230,220,210,.3)"));
  p.text("↑ 오리배 · 강변 산책", 17.0, 22.25, 5.2, v("rgba(110,90,70,.45)", "rgba(220,210,190,.25)"));
  // 밤: 가로등 불빛 웅덩이 · 교회 창빛 · 라면 카트
  if(dark){ LAMPS.forEach(([i, j]) => p.glow(i, j, 1.7, "rgba(255,206,150,.32)"));
    p.glow(C.ci, 12.0, 2.6, "rgba(255,214,170,.3)"); [[3.6, "rgba(244,167,185,.34)"], [7.0, "rgba(169,203,234,.34)"]].forEach(([i, col]) => p.glow(i, 10.6, 1.1, col));
    p.glow(5.3, C.j1 + 0.6, 1.3, "rgba(255,214,170,.3)"); p.glow(22.8, 9.6, 1.8, "rgba(255,190,120,.3)"); p.glow(30.2, 10.3, 1.4, "rgba(190,240,225,.22)"); p.glow(TW.ci, 17.7, 1.0, "rgba(255,226,180,.25)"); }
  else { p.glow(C.ci, 11.2, 2.2, "rgba(255,250,235,.25)"); [[3.6, "rgba(244,167,185,.22)"], [7.0, "rgba(169,203,234,.22)"]].forEach(([i, col]) => p.glow(i, 10.9, 1.0, col)); }
}

/* ---------- 나무 · 꽃 · 벤치 · 가로등 ---------- */
const CHERRY = [[15.15, 13.4, 1.0], [18.85, 15.6, 1.05], [15.15, 17.9, 0.95], [18.85, 20.2, 1.0], [8.7, 21.7, 0.85], [20.4, 22.0, 0.8], [0.8, 19.6, 0.85], [33.6, 15.0, 0.9], [33.6, 20.6, 0.85]];
function cherry(i, j, s = 1){
  const tr = D("#8A6A58", "#4A3A32");
  K.sm(K.cyl(0.06 * s, 0.1 * s, hz(36 * s), 8), tr, X(i), hz(18 * s), Z(j), null, "m");
  rod([i, j, 30 * s], [i - 0.36 * s, j + 0.1 * s, 47 * s], 0.035 * s, tr, "m", 6); rod([i, j, 30 * s], [i + 0.32 * s, j - 0.2 * s, 49 * s], 0.035 * s, tr, "m", 6); rod([i, j, 32 * s], [i + 0.05 * s, j + 0.32 * s, 50 * s], 0.03 * s, tr, "m", 6);
  const cols = [D("#F7CFDC", "#7A5866"), D("#F2B6C9", "#6E4E5C"), D("#FFE8EF", "#86707A"), D("#EBA9C0", "#6A4A58")];
  [[0, 0, 60, 0.52], [-0.4, 0.12, 51, 0.4], [0.38, -0.16, 53, 0.42], [0.06, 0.38, 51, 0.38], [-0.1, -0.36, 55, 0.38], [0.02, 0.02, 74, 0.36], [0.33, 0.27, 63, 0.3], [-0.31, -0.12, 67, 0.3]].forEach(([di, dj, z, r], k) =>
    ball(i + di * s, j + dj * s, z * s, r * s, cols[k % 4], "m", 14));
  for(let k = 0; k < 7; k++) ball(i + (rnd(k + i * 3) - 0.5) * 1.0 * s, j + (rnd(k * 3 + j) - 0.5) * 1.0 * s, (52 + rnd(k * 7 + i) * 26) * s, 0.06 * s, "#FFFFFF", "m", 6);
}
const WILLOW = [[3.2, 6.35, 1.05], [13.9, 9.4, 0.85], [22.6, 6.4, 1.0], [30.9, 6.35, 1.1], [9.0, 9.2, 0.8]];
function willow(i, j, s = 1){   // 버드나무: 강 쪽(−j)으로 기울고 가지가 늘어짐. 가지 끝은 무릎 위(막지 않게)
  const tr = D("#7E6650", "#463A30"), top = [i - 0.12 * s, j - 0.45 * s, 46 * s];
  rod([i, j, 0], top, 0.1 * s, tr, "m", 8); rod(top, [top[0] + 0.3 * s, top[1] - 0.1 * s, 58 * s], 0.06 * s, tr, "m", 6); rod(top, [top[0] - 0.35 * s, top[1] + 0.1 * s, 56 * s], 0.06 * s, tr, "m", 6);
  const g1 = D("#A9D48E", "#3E5A38"), g2 = D("#8CC478", "#34502E"), g3 = D("#C2E0A2", "#4A6642");
  [[0, 0, 62, 0.62], [-0.45, 0.1, 58, 0.45], [0.45, -0.05, 58, 0.45], [0, 0.38, 57, 0.42], [0.05, -0.4, 57, 0.42]].forEach(([di, dj, z, r], k) => ball(top[0] + di * s, top[1] + dj * s, z * s, r * s, [g1, g2, g3][k % 3], "m", 14).scale.y = 0.7);
  for(let k = 0; k < 30; k++){ const a = k / 30 * PI * 2 + rnd(k + i) * 0.3, r = (0.45 + rnd(k * 3 + j) * 0.35) * s, ci = top[0] + Math.cos(a) * r, cj = top[1] + Math.sin(a) * r * 0.9, z0 = (56 + rnd(k) * 6) * s, z1 = Math.max(22, (28 + rnd(k * 5) * 16) * s);
    rod([ci, cj, z0], [ci + 0.03, cj - 0.02, z1], 0.022 * s, [g1, g2, g3][k % 3], "m", 5); ball(ci + 0.03, cj - 0.02, z1, 0.035 * s, g2, "m", 6); }
}
function roundTree(i, j, s, col){ K.sm(K.cyl(0.05 * s, 0.07 * s, hz(24 * s), 6), D("#7A5A3C", "#4A3828"), X(i), hz(12 * s), Z(j), null, "m");
  [[0, 0, 36, 0.4], [-0.2, 0.1, 30, 0.3], [0.2, 0.05, 31, 0.3], [0, 0, 46, 0.26]].forEach(([di, dj, z, r], k) => ball(i + di * s, j + dj * s, z * s, r * s, k % 2 ? K.sh(col, 0.12) : col, "m", 12)); }
function flowerStem(i, j, col, h){ rod([i, j, 0], [i, j, h], 0.01, D("#5FA582", "#3E6E54"), "m", 5); ball(i, j, h, 0.075, col, "m", 8); ball(i, j, h + 1, 0.032, "#FFF4C2", "m", 6); ball(i + 0.06, j, h * 0.45, 0.05, K.sh("plant", 0.1), "m", 6); }
function bush(i, j, s = 1, col = "plant"){ [[0, 0, 0.32], [0.26, 0.05, 0.24], [-0.25, 0.04, 0.24]].forEach(([di, dj, r], k) => ball(i + di * s, j + dj * s, r * 31 * s * 0.55, r * s, k ? K.sh(col, 0.1) : col, "m", 10).scale.y = 0.8); }
/* 벤치: face = 앉은 사람이 보는 쪽. 등받이는 반대 */
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
  K.sm(K.cyl(0.032, 0.05, hz(64), 10), POST, X(i), hz(32), Z(j), null, "s"); disc(i, j, 0.1, 0, 2.2, POST, "s", 14);
  K.sm(K.cyl(0.11, 0.08, hz(13), 12), D("#FFF6DC", "#FFE3A8"), X(i), hz(70.5), Z(j), null, "glow");
  K.sm(K.cyl(0.025, 0.16, hz(5), 12), POST, X(i), hz(79.5), Z(j), null, "s"); ball(i, j, 83, 0.03, POST, "s", 8); disc(i, j, 0.085, 63.5, 1.4, POST, "s", 12);
  gl(i, j, 70, 34, "#FFD9A0", (tm, dk) => dk ? 0.75 : 0);
}
/* 서 있는 자전거 (대여소 · 구경용). h = 앞이 보는 쪽 (0 = +j) */
function bikeStatic(ci, cj, h, col){
  const g = new THREE.Group(); g.position.set(X(ci), 0, Z(cj)); g.rotation.y = h; K.root.add(g);
  const up = new THREE.Vector3(0, 1, 0);
  const lr = (a, b, r, c) => { const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b), d = vb.clone().sub(va), o = K.sm(K.cyl(r, r, d.length(), 6), c, ...va.clone().add(vb).multiplyScalar(0.5).toArray(), g, "s"); o.quaternion.setFromUnitVectors(up, d.normalize()); };
  [0.31, -0.31].forEach(z => { const o = K.sm(W.torus, INK, 0, 0.2, z, g, "s"); o.rotation.y = PI / 2; K.sm(K.cyl(0.03, 0.03, 0.06, 8), WHITE, 0, 0.2, z, g, "s").rotation.z = PI / 2; });
  const bb = [0, 0.24, -0.02], st = [0, 0.48, -0.12], hd = [0, 0.54, 0.2];
  [[[0, 0.2, -0.31], bb], [[0, 0.2, -0.31], st], [bb, st], [bb, hd], [st, [0, 0.51, 0.18]], [[0, 0.2, 0.31], hd], [hd, [0, 0.62, 0.18]]].forEach(([a, b]) => lr(a, b, 0.02, col));
  K.sm(K.rbox(0.12, 0.04, 0.19, 0.015), WHITE, 0, 0.56, -0.14, g, "s"); lr([-0.17, 0.63, 0.17], [0.17, 0.63, 0.17], 0.015, INK);
  K.sm(K.rbox(0.22, 0.13, 0.16, 0.02), WHITE, 0, 0.5, 0.35, g, "s");
}

/* ---------- 강 · 둑 · 건너편 ---------- */
function buildBanks(){
  // 강가 돌 둑 (물굽이 · 데크 자리는 비움)
  [[EXT[0], 9.2], [11.4, 15.6], [19.4, 20.8], [28.0, EXT[2]]].forEach(([a, b]) => B(a, RJ - 0.02, b - a, 0.33, 3.2, STONE, 0, {r:0.02}));
  [[9.2, 11.4], [20.8, 28.0]].forEach(([a, b]) => B(a, RJ + 0.06, b - a, 0.25, 3.2, STONE, 0, {r:0.02}));
  for(let k = 0; k < 46; k++){ const i = EXT[0] + 0.3 + k * 0.76 + rnd(k) * 0.3; if((i > 8.9 && i < 11.7) || (i > 15.3 && i < 19.7) || (i > 20.5 && i < 28.3)) continue;   // 물가 돌
    ball(i, RJ - 0.08 + rnd(k + 5) * 0.06, 1, 0.1 + rnd(k + 9) * 0.07, D(["#D6CDBE", "#C4BAA8", "#E2DACC"][k % 3], ["#4E4A44", "#46423C", "#57524A"][k % 3]), "m", 8).scale.y = 0.45; }
  // 물수제비 자갈밭 위 돌 몇 개
  [[12.4, 6.35], [13.1, 6.45], [13.8, 6.3], [14.3, 6.48]].forEach(([i, j], k) => ball(i, j, 0.6, 0.06, D("#C9C0B0", "#57524A"), "m", 8).scale.y = 0.5);
  // 건너편 둑 · 갈대 · 나무
  B(EXT[0], EXT[1], EXT[2] - EXT[0], 0.78, 5, D("#A5CF8C", "#2B402C"), 0, {r:0.02}); B(EXT[0], 0.1, EXT[2] - EXT[0], 0.1, 3, D("#D9D0BE", "#45413A"), 0, {r:0});
  for(let k = 0; k < 70; k++){ const i = EXT[0] + 0.2 + k * 0.5 + rnd(k + 70) * 0.3, j = -0.3 + rnd(k + 11) * 0.4, h = 14 + rnd(k * 3) * 10, col = D(k % 3 ? "#B9C98E" : "#D9CFA0", "#46502E");
    rod([i, j, 4], [i + 0.04, j, h], 0.012, col, "m", 4); if(k % 2) K.sm(sc(new THREE.SphereGeometry(1, 8, 6), 0.03, 0.09, 0.03), D("#C9B48A", "#5A4E38"), X(i + 0.04), hz(h + 2), Z(j), null, "m"); }
  [[2.0, -0.2, 0.9, "plant"], [6.6, -0.25, 1.1, D("#8CC478", "#34502E")], [12.4, -0.2, 0.8, "plant"], [19.6, -0.25, 1.0, D("#A9D48E", "#3E5A38")], [25.2, -0.2, 0.9, "plant"], [29.8, -0.25, 1.2, D("#8CC478", "#34502E")], [33.6, -0.2, 0.8, "plant"]].forEach(([i, j, s, col]) => roundTree(i, j, s, col));
  [[9.4, -0.25], [22.4, -0.3], [16.0, -0.3]].forEach(([i, j]) => cherry(i, j, 0.7));
  // 먼 동네 그림 (건너편 언덕 · 아파트 · 탑. 밤엔 창불)
  K.decal(1760, 120, (c, w, h, dark) => {
    const hill = (pts, col) => { c.fillStyle = col; c.beginPath(); c.moveTo(0, h); pts.forEach(([x, y]) => c.lineTo(x * w, y * h)); c.lineTo(w, h); c.fill(); };
    hill([[0, 0.55], [0.08, 0.32], [0.16, 0.42], [0.27, 0.18], [0.36, 0.36], [0.5, 0.28], [0.62, 0.08], [0.7, 0.3], [0.82, 0.22], [0.92, 0.38], [1, 0.3]], dark ? "rgba(52,46,78,.9)" : "rgba(200,180,214,.55)");
    c.fillStyle = dark ? "#2E2A44" : "rgba(222,208,226,.9)"; const tx = 0.62 * w; c.fillRect(tx - 2, 0.0 * h, 4, 0.3 * h); c.fillRect(tx - 7, 0.1 * h, 14, 0.05 * h); c.beginPath(); c.arc(tx, 0.04 * h, 3, 0, 7); c.fill();
    if(dark){ c.fillStyle = "#FF8A8A"; c.beginPath(); c.arc(tx, 0.0 * h + 2, 2, 0, 7); c.fill(); }
    for(let k = 0; k < 44; k++){ const x = (k / 44 + rnd(k) * 0.01) * w, bw = w * (0.012 + rnd(k + 3) * 0.012), bh = h * (0.28 + rnd(k + 8) * 0.4), y = h - bh;
      c.fillStyle = dark ? ["#3A3456", "#342E4C", "#40385C"][k % 3] : ["rgba(244,214,226,.95)", "rgba(226,214,236,.95)", "rgba(250,240,232,.95)"][k % 3]; c.fillRect(x, y, bw, bh);
      c.fillStyle = dark ? "rgba(255,214,150,.8)" : "rgba(170,150,190,.35)"; for(let yy = y + 4; yy < h - 3; yy += 5) for(let xx = x + 2; xx < x + bw - 2; xx += 4) if(!dark || rnd(xx * 3 + yy) > 0.55) c.fillRect(xx, yy, 1.6, 2); }
  }, EXT[2] - EXT[0], hz(46), "i", (EXT[0] + EXT[2]) / 2, EXT[1] + 0.08, hz(5 + 23));
}

/* 무지개 나무다리 (자전거길이 물굽이를 건넘). 바닥은 낮아서(0.3 아래) 걸어 올라감 · 난간은 막음 */
function buildBridge(){
  const n = 14, deck = D("#E6CBA6", "#5E4C3A"), side = D("#C9A77F", "#4E3E30");
  for(let k = 0; k < n; k++){ const a = BR.i0 + (BR.i1 - BR.i0) * k / n, b = BR.i0 + (BR.i1 - BR.i0) * (k + 1) / n, u = (k + 0.5) / n, z = 2.5 + Math.sin(u * PI) * 5.5;
    B(a, BR.j0 + 0.02, b - a + 0.004, BR.j1 - BR.j0 - 0.04, 2, deck, z - 2, {r:0});
    B(a, BR.j0 - 0.02, b - a + 0.004, 0.1, 3.5, side, z - 3.5, {r:0}); B(a, BR.j1 - 0.08, b - a + 0.004, 0.1, 3.5, side, z - 3.5, {r:0});
    [BR.j0 + 0.02, BR.j1 - 0.1].forEach(j => B(a, j, b - a + 0.004, 0.08, 6, RB[k % RB.length], z + 3, {r:0}));   // 무지개 띠 (막는 판)
  }
  for(let k = 0; k <= n; k += 2){ const i = BR.i0 + (BR.i1 - BR.i0) * k / n, u = k / n, z = 2.5 + Math.sin(u * PI) * 5.5;
    [BR.j0, BR.j1 - 0.12].forEach(j => { B(i - 0.05, j, 0.1, 0.12, z + 24, WHITE, 0, {r:0.02, cls:"s"}); ball(i, j + 0.06, z + 26, 0.06, PINK, "s", 10); }); }
  for(let k = 0; k < n; k++){ const u0 = k / n, u1 = (k + 1) / n, i0 = BR.i0 + (BR.i1 - BR.i0) * u0, i1 = BR.i0 + (BR.i1 - BR.i0) * u1, z0 = 2.5 + Math.sin(u0 * PI) * 5.5 + 23, z1 = 2.5 + Math.sin(u1 * PI) * 5.5 + 23;
    [BR.j0 + 0.06, BR.j1 - 0.06].forEach(j => rod([i0, j, z0], [i1, j, z1], 0.028, WHITE, "s", 8)); }
  // 다리 아래 기둥 (물속)
  [16.6, 18.4].forEach(i => [BR.j0 + 0.15, BR.j1 - 0.25].forEach(j => B(i - 0.06, j, 0.12, 0.12, 6, side, 0, {r:0})));
}
/* 오리 연못 둘레 돌 · 연잎 · 부들 */
function buildPond(){
  for(let k = 0; k < 26; k++){ const a = k / 26 * PI * 2; if(a > 0.25 && a < PI - 0.25 && Math.abs(a - PI / 2) < 0.32) continue;   // 오리 밥 주는 자리 비움
    const ii = POND.ci + Math.cos(a) * (POND.ri + 0.1), jj = POND.cj + Math.sin(a) * (POND.rj + 0.1); if(jj < BR.j1 + 0.05) continue;
    ball(ii, jj, 1, 0.13 + rnd(k) * 0.06, D(["#DCD3C2", "#C8BEAC", "#E6DED0"][k % 3], ["#54504A", "#4A4640", "#5E5850"][k % 3]), "m", 9).scale.y = 0.5; }
  [[16.4, 8.9, 0.22], [18.6, 9.4, 0.2], [17.0, 9.75, 0.17], [18.1, 8.75, 0.16], [16.0, 9.5, 0.15]].forEach(([i, j, r], k) => { disc(i, j, r, WY + 0.15, 0.3, D("#7CC08A", "#2E5038"), "m", 18);
    if(k % 2 === 0){ ball(i + 0.04, j - 0.03, WY + 2.2, 0.06, D("#F7C9D7", "#7A5866"), "m", 10).scale.y = 0.7; ball(i + 0.04, j - 0.03, WY + 3.2, 0.025, "#FFF4C2", "m", 6); } });
  [[15.75, 9.6], [15.85, 8.6], [19.25, 9.7], [19.3, 8.65]].forEach(([i, j], q) => { for(let k = 0; k < 6; k++){ const a = rnd(k + q * 9) * 0.3 - 0.15, di = (rnd(k * 3 + q) - 0.5) * 0.3, dj = (rnd(k * 7 + q) - 0.5) * 0.3, h = 16 + rnd(k + q) * 10;
    rod([i + di, j + dj, 0], [i + di + a * 0.2, j + dj, h], 0.012, D("#7FB070", "#3A5A34"), "m", 4); if(k % 2) K.sm(K.cyl(0.03, 0.03, hz(5), 6), D("#8A5E3C", "#4A3424"), X(i + di + a * 0.2), hz(h - 3), Z(j + dj), null, "m"); } });
}
/* 오리배 선착장 · 낚시 데크 */
function buildDocks(){
  const dk = D("#D8BC94", "#5A4836"), dl = D("rgba(110,70,30,.25)", "rgba(0,0,0,.3)");
  // 선착장 (강가에 붙은 나무 마루)
  B(DOCK.i0, DOCK.j0, DOCK.i1 - DOCK.i0, RJ + 0.06 - DOCK.j0, 4, dk, 0, {r:0.01});
  for(let i = DOCK.i0 + 0.3; i < DOCK.i1; i += 0.3) K.faceJ(i - 0.006, i + 0.006, DOCK.j0 - 0.012, 0.5, 4, K.sh(dk, -0.25), "m", 0.012);
  B(DOCK.i0, DOCK.j0 - 0.04, DOCK.i1 - DOCK.i0, 0.1, 2.5, D("#F4F1EA", "#6A665E"), 2, {r:0.01});   // 물가 쪽 흰 테
  [21.2, 23.6, 26.0, 27.8].forEach(i => { K.sm(K.cyl(0.07, 0.08, hz(18), 10), WOODD, X(i), hz(9), Z(DOCK.j0 + 0.08), null, "m"); disc(i, DOCK.j0 + 0.08, 0.075, 18, 1, K.sh(WOODD, 0.2), "m", 10); });   // 말뚝
  [[22.4, DOCK.j0 + 0.2], [25.0, DOCK.j0 + 0.2], [27.0, DOCK.j0 + 0.2]].forEach(([i, j]) => { K.sm(K.cyl(0.05, 0.06, hz(8), 10), D("#5A5E60", "#8A8E90"), X(i), hz(8), Z(j), null, "s"); ball(i, j, 12.5, 0.06, D("#5A5E60", "#8A8E90"), "s", 10); });   // 배 매는 기둥
  rod([22.4, DOCK.j0 + 0.2, 10], [23.0, 3.95, 6], 0.012, D("#E9DCC0", "#8A7E66"), "m", 4); rod([25.0, DOCK.j0 + 0.2, 10], [26.2, 3.95, 6], 0.012, D("#E9DCC0", "#8A7E66"), "m", 4); rod([22.4, DOCK.j0 + 0.2, 10], [21.7, 3.95, 6], 0.012, D("#E9DCC0", "#8A7E66"), "m", 4);
  // 구명 튜브 걸린 기둥 · 오리배 안내판
  B(28.0 - 0.14, 5.25, 0.1, 0.1, 40, WHITE, 4, {r:0.02, cls:"s"}); { const t = K.sm(myGeo(new THREE.TorusGeometry(0.2, 0.06, 10, 24)), D("#FF8A6A", "#9A4E3E"), X(27.92), hz(30), Z(5.42), null, "s"); }
  [0, 1, 2, 3].forEach(k => { const a = k * PI / 2 + PI / 4; B(27.92 + Math.cos(a) * 0.2 - 0.03, 5.39, 0.06, 0.05, 2.5, "#FFFFFF", 30 + Math.sin(a) * 6.4 - 1.2, {r:0}); });
  // 낚시 데크 (T자) · 난간 · 말뚝
  B(PIER.i0, PIER.j0, PIER.i1 - PIER.i0, RJ + 0.06 - PIER.j0, 5, dk, 0, {r:0.01}); B(PIER.ti0, PIER.tj0, PIER.ti1 - PIER.ti0, PIER.j0 - PIER.tj0 + 0.02, 5, dk, 0, {r:0.01});
  for(let j = PIER.j0 + 0.3; j < RJ; j += 0.3) K.faceI(PIER.i1, j - 0.006, j + 0.006, 0.5, 5, K.sh(dk, -0.25), "m", 0.012);
  for(let i = PIER.ti0 + 0.3; i < PIER.ti1; i += 0.3) K.faceJ(i - 0.006, i + 0.006, PIER.tj0 - 0.012, 0.5, 5, K.sh(dk, -0.25), "m", 0.012);
  const rp = (i, j) => { B(i - 0.05, j - 0.05, 0.1, 0.1, 30, WOODD, 0, {r:0.02}); };
  [PIER.ti0 + 0.05, 9.4, 10.3, 11.2, PIER.ti1 - 0.05].forEach(i => rp(i, PIER.tj0 + 0.05)); rp(PIER.ti0 + 0.05, PIER.j0 - 0.05); rp(PIER.ti1 - 0.05, PIER.j0 - 0.05);
  [[PIER.ti0 + 0.05, PIER.ti1 - 0.05]].forEach(([a, b]) => { B(a, PIER.tj0, b - a, 0.08, 2, WOODD, 28, {r:0.01}); B(a, PIER.tj0, b - a, 0.06, 1.6, WOODD, 16, {r:0.01}); });
  [PIER.ti0, PIER.ti1 - 0.08].forEach(i => { B(i, PIER.tj0, 0.08, PIER.j0 - PIER.tj0, 2, WOODD, 28, {r:0.01}); B(i, PIER.tj0, 0.08, PIER.j0 - PIER.tj0, 1.6, WOODD, 16, {r:0.01}); });
  [[PIER.i0 + 0.05, 4.4], [PIER.i1 - 0.05, 4.4]].forEach(([i, j]) => rp(i, j));
  [[PIER.i0, PIER.j0], [PIER.i1 - 0.08, PIER.j0]].forEach(([i, j]) => { B(i, j, 0.08, 1.6 - 0.05, 2, WOODD, 28, {r:0.01}); B(i, j, 0.08, 1.6 - 0.05, 1.6, WOODD, 16, {r:0.01}); });
  // 할아버지 낚시 도구: 접이의자 · 양동이 · 낚시 가방 · 낚싯대 (줄과 찌는 움직임)
  const ch = D("#4E7A6A", "#2E4A40"); B(8.58, 2.12, 0.36, 0.34, 1.4, ch, 13, {r:0.03}); B(8.58, 1.98, 0.36, 0.06, 13, ch, 15, {r:0.02});
  rod([8.6, 2.15, 5], [8.92, 2.42, 13], 0.012, "#C9CDD2"); rod([8.92, 2.15, 5], [8.6, 2.42, 13], 0.012, "#C9CDD2");
  K.sm(K.cyl(0.13, 0.11, hz(11), 14), D("#7FB6D9", "#3E5E7A"), X(9.75), hz(5 + 5.5), Z(2.45), null, "s"); disc(9.75, 2.45, 0.115, 15.8, 0.4, D("#A8DCEF", "#33506A"), "m", 14);
  B(10.15, 2.45, 0.42, 0.24, 9, D("#E8A04A", "#9A6A2E"), 5, {r:0.03}); B(10.2, 2.48, 0.32, 0.18, 1, INK, 14, {r:0.02});
  rod([9.45, 1.9, 27], [9.7, 0.55, 58], 0.012, D("#3A3A3A", "#9A9A9A"), "s", 6); B(9.4, 1.84, 0.12, 0.08, 6, "#6A6A6A", 23, {r:0, cls:"s"});
  W.rodTip = [9.7, 0.55, 58];
  // 강변 라면 카트 줄 앞 이정표 없음 (라면 카트는 buildCart)
}
/* 오리배 표 파는 곳 (자전거길 남쪽) */
function buildBoatBooth(){
  const bw = D("#F4F1EA", "#5A5650"), bl = D("#A9CBEA", "#3E5670");
  B(26.4, 8.65, 1.5, 0.85, 34, bw, 0, {r:0.04}); B(26.35, 8.6, 1.6, 0.95, 3, bl, 34, {r:0.02});
  for(let k = 0; k < 6; k++) B(26.3 + k * 0.28, 9.52, 0.14, 0.18, 6, k % 2 ? "#FFFFFF" : bl, 31, {r:0.01});
  K.faceJ(26.6, 27.7, 9.5, 14, 28, D("#2E3A48", "#1A222C"), "s", 0.012); B(26.55, 9.5, 1.2, 0.14, 1.6, WHITE, 13, {r:0.01});
  B(26.4, 9.48, 1.5, 0.05, 9, D("#FFFFFF", "#8A847C"), 37, {r:0.01}); K.wtext("오리배 타는 곳 🦢", 27.15, 9.53, 41.5, "i", 3.0, D("#3E6E9A", "#BFE0FF"), null, 800, K.FONT);
  K.wtext("한 바퀴 15분", 27.15, 9.512, 22, "i", 2.1, "#FFFFFF", null, 700, K.FONT);
  flowerPot(28.15, 9.2, "#A9CBEA");
}
function flowerPot(i, j, col, s = 1, pot = PINK){
  B(i - 0.17 * s, j - 0.17 * s, 0.34 * s, 0.34 * s, 10 * s, pot, 0, {r:0.05}); disc(i, j, 0.14 * s, 10 * s, 0.6, D("#7A5A3C", "#3A2A20"));
  [[0, 0, 22], [0.08, 0.05, 18], [-0.07, 0.06, 19], [0.04, -0.08, 17]].forEach(([di, dj, z], k) => { rod([i + di * s, j + dj * s, 10 * s], [i + di * 1.4 * s, j + dj * 1.4 * s, z * s], 0.008, D("#5FA582", "#3E6E54"), "m", 5);
    ball(i + di * 1.4 * s, j + dj * 1.4 * s, z * s, 0.055 * s, k % 2 ? "#FFFFFF" : col, "m", 8); });
}

/* ---------- 동네 교회 ---------- */
function lancet(ic, z0, z1, w, palette, seed){   // 뾰족 아치 스테인드글라스 (뒷벽 안쪽 면)
  const ww = w + 0.18, z1b = z1 + 3, wh = hz(z1b - z0 + 4), k = 150;
  K.decal(Math.round(ww * k), Math.round(wh * k), (c, Wc, Hc, dark) => {
    const fr = Wc * 0.09, x0 = fr, x1 = Wc - fr, wd = x1 - x0, yb = Hc - fr * 0.6, ys = Hc * 0.1 + wd * 0.866 + fr * 0.4;
    const arch = (g) => { c.beginPath(); c.moveTo(x0 - g, yb + g); c.lineTo(x0 - g, ys); c.arc(x1, ys, wd + g, PI, PI + PI / 3); c.arc(x0, ys, wd + g, -PI / 3, 0); c.lineTo(x1 + g, yb + g); c.closePath(); };
    arch(fr * 0.75); c.fillStyle = dark ? "#6A5A48" : "#EFE6D8"; c.fill(); arch(fr * 0.75); c.strokeStyle = dark ? "#3A3026" : "#C9B89E"; c.lineWidth = 2; c.stroke();
    c.save(); arch(0); c.clip();
    const cols = palette.map(h => h);
    for(let y = 0, r = 0; y < Hc; y += Hc / 9, r++) for(let x = 0, q = 0; x < Wc; x += Wc / 4, q++){ c.fillStyle = cols[(q + r * 3 + seed) % cols.length]; c.globalAlpha = dark ? 0.95 : 0.78; c.fillRect(x, y, Wc / 4 + 1, Hc / 9 + 1); }
    c.globalAlpha = 1;
    // 가운데 꽃 무늬 · 위 작은 십자가
    const cx = Wc / 2, cy = ys + (yb - ys) * 0.42, R0 = wd * 0.3;
    c.fillStyle = dark ? "#FFF2D6" : "#FFFFFF"; c.beginPath(); c.arc(cx, cy, R0 * 1.15, 0, 7); c.fill();
    for(let p = 0; p < 6; p++){ const a = p / 6 * PI * 2; c.fillStyle = cols[(p + seed) % cols.length]; c.beginPath(); c.ellipse(cx + Math.cos(a) * R0 * 0.55, cy + Math.sin(a) * R0 * 0.55, R0 * 0.42, R0 * 0.24, a, 0, 7); c.fill(); }
    c.fillStyle = dark ? "#FFD98A" : "#E8C36A"; c.beginPath(); c.arc(cx, cy, R0 * 0.25, 0, 7); c.fill();
    c.fillStyle = dark ? "#FFF6E0" : "#FFFFFF"; const ty = ys - wd * 0.42; c.fillRect(cx - wd * 0.035, ty - wd * 0.16, wd * 0.07, wd * 0.36); c.fillRect(cx - wd * 0.12, ty - wd * 0.06, wd * 0.24, wd * 0.07);
    c.strokeStyle = dark ? "rgba(40,30,30,.75)" : "rgba(80,60,50,.55)"; c.lineWidth = 1.2;
    for(let y = Hc / 9; y < Hc; y += Hc / 9){ c.beginPath(); c.moveTo(0, y); c.lineTo(Wc, y); c.stroke(); }
    for(let x = Wc / 4; x < Wc; x += Wc / 4){ c.beginPath(); c.moveTo(x, 0); c.lineTo(x, Hc); c.stroke(); }
    const sg = c.createLinearGradient(0, 0, Wc, Hc); sg.addColorStop(0, dark ? "rgba(255,230,180,.28)" : "rgba(255,255,255,.4)"); sg.addColorStop(0.5, "rgba(255,255,255,0)"); c.fillStyle = sg; c.fillRect(0, 0, Wc, Hc);
    c.restore(); arch(0); c.strokeStyle = dark ? "#2E241C" : "#8B6A4C"; c.lineWidth = 2.4; c.stroke();
  }, ww, wh, "i", ic, C.j0 + 0.012, hz((z0 + z1b) / 2));
}
function roseWindow(ic, zc, r){
  const s = 2 * r + 0.16, k = 160;
  K.decal(Math.round(s * k), Math.round(s * k), (c, Wc, Hc, dark) => {
    const cx = Wc / 2, cy = Hc / 2, R0 = Wc * 0.44;
    c.fillStyle = dark ? "#6A5A48" : "#EFE6D8"; c.beginPath(); c.arc(cx, cy, Wc * 0.5, 0, 7); c.fill();
    c.fillStyle = dark ? "#3A4A78" : "#BFDDF2"; c.beginPath(); c.arc(cx, cy, R0, 0, 7); c.fill();
    for(let p = 0; p < 8; p++){ const a = p / 8 * PI * 2; c.fillStyle = RB[p % 6]; c.globalAlpha = dark ? 1 : 0.85; c.beginPath(); c.ellipse(cx + Math.cos(a) * R0 * 0.55, cy + Math.sin(a) * R0 * 0.55, R0 * 0.38, R0 * 0.2, a, 0, 7); c.fill(); }
    c.globalAlpha = 1; c.fillStyle = dark ? "#FFD98A" : "#F6E39A"; c.beginPath(); c.arc(cx, cy, R0 * 0.22, 0, 7); c.fill();
    c.strokeStyle = dark ? "#2E241C" : "#8B6A4C"; c.lineWidth = 2.2; c.beginPath(); c.arc(cx, cy, R0, 0, 7); c.stroke();
    for(let p = 0; p < 8; p++){ const a = p / 8 * PI * 2 + PI / 8; c.beginPath(); c.moveTo(cx + Math.cos(a) * R0 * 0.24, cy + Math.sin(a) * R0 * 0.24); c.lineTo(cx + Math.cos(a) * R0, cy + Math.sin(a) * R0); c.stroke(); }
    if(dark){ const g = c.createRadialGradient(cx, cy, 0, cx, cy, R0); g.addColorStop(0, "rgba(255,230,170,.35)"); g.addColorStop(1, "rgba(255,230,170,0)"); c.fillStyle = g; c.fillRect(0, 0, Wc, Hc); }
  }, s, s, "i", ic, C.j0 + 0.012, hz(zc));
}
function pew(i0, i1, j){   // 앉는 사람은 −j (강단)를 봄 · 등받이는 +j
  const pc = D("#CF9F72", "#5E4630"), pd = K.sh(pc, -0.14);
  B(i0 + 0.06, j + 0.06, i1 - i0 - 0.12, 0.3, 9, pd, 0, {r:0.01});
  B(i0, j, i1 - i0, 0.44, 3, pc, 9, {r:0.025});
  B(i0, j + 0.4, i1 - i0, 0.08, 16, pc, 11, {r:0.02}); B(i0 - 0.01, j + 0.38, i1 - i0 + 0.02, 0.12, 1.6, K.sh(pc, 0.12), 27, {r:0.02});
  [i0 - 0.05, i1 - 0.03].forEach(i => { B(i, j - 0.03, 0.08, 0.55, 22, pd, 0, {r:0.03}); ball(i + 0.04, j + 0.47, 23.5, 0.05, pd, "m", 8); });
  B(i0 + 0.2, j + 0.49, i1 - i0 - 0.4, 0.06, 5, pd, 14, {r:0.01});   // 뒤쪽 찬송가 꽂이
  [[0.35, LILAC], [0.53, SPROUT], [i1 - i0 - 0.6, PINK]].forEach(([d, col]) => B(i0 + d, j + 0.5, 0.14, 0.04, 6.5, col, 15, {r:0.005}));
}
function buildChurch(){
  const ext = CHW, wain = D("#E7CFAF", "#5A4838");
  // 뒷 박공벽 (강 쪽): 네모 + 세모 · 안쪽 벽지 · 징두리 판
  const gi0 = C.i0 - CT, gi1 = C.i1 + CT, gw = gi1 - gi0;
  B(gi0, C.j0 - CT, gw, CT, EAVE, ext, 0, {r:0});
  { const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(gw, 0); sh.lineTo(gw / 2, hz(RIDGE - EAVE)); sh.closePath();
    const g = myGeo(new THREE.ExtrudeGeometry(sh, {depth:CT, bevelEnabled:false})); K.sm(g, ext, X(gi0), hz(EAVE), Z(C.j0 - CT), null, "m"); }
  K.faceJ(C.i0, C.i1, C.j0, 0, EAVE, CREAM, "m", 0.012); K.faceJ(C.i0, C.i1, C.j0 + 0.012, 0, 30, wain, "m", 0.012); B(C.i0, C.j0 + 0.012, C.i1 - C.i0, 0.05, 1.5, WOODD, 30, {r:0});
  // 왼벽 (높게) · 오른벽 · 앞벽 (낮게, 인형집)
  B(gi0, C.j0, CT, C.j1 + CT - C.j0, EAVE, ext, 0, {r:0});
  K.faceI(C.i0, C.j0, C.j1, 0, EAVE, CREAM, "m", 0.012); K.faceI(C.i0 + 0.012, C.j0, C.j1, 0, 30, wain, "m", 0.012); B(C.i0 + 0.012, C.j0, 0.05, C.j1 - C.j0, 1.5, WOODD, 30, {r:0});
  B(C.i1, C.j0, CT, C.j1 + CT - C.j0, LW - 1.6, ext, 0, {r:0}); B(C.i1 - 0.01, C.j0, CT + 0.02, C.j1 + CT - C.j0, 1.6, WHITE, LW - 1.6, {r:0});
  [[gi0, 4.6], [5.98, gi1]].forEach(([a, b]) => { B(a, C.j1, b - a, CT, LW - 1.6, ext, 0, {r:0}); B(a, C.j1 - 0.01, b - a, CT + 0.02, 1.6, WHITE, LW - 1.6, {r:0}); });
  // 문틀 (흰 기둥 · 작은 박공 · 금 십자가) · 열린 나무 문
  [4.52, 5.94].forEach(i => B(i, C.j1 - 0.02, 0.1, CT + 0.06, 70, WHITE, 0, {r:0.02, cls:"s"}));
  B(4.46, C.j1 - 0.04, 1.62, CT + 0.1, 4, WHITE, 70, {r:0.02, cls:"s"});
  { const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(1.7, 0); sh.lineTo(0.85, hz(12)); sh.closePath(); K.sm(myGeo(new THREE.ExtrudeGeometry(sh, {depth:0.14, bevelEnabled:false})), ROOF, X(4.42), hz(74), Z(C.j1 + 0.02), null, "m"); }
  B(5.25, C.j1 + 0.1, 0.06, 0.05, 13, GOLD, 86, {r:0, cls:"s"}); B(5.17, C.j1 + 0.1, 0.22, 0.05, 2.4, GOLD, 94, {r:0, cls:"s"});
  const dw = D("#B07A52", "#5A3E2A");
  [[4.62, 1], [5.94, -1]].forEach(([hi, sg]) => { const a = 1.75, len = 0.62, dx = Math.cos(a) * len * sg, dz = Math.sin(a) * len;
    const o = K.sm(K.rbox(len, hz(62), 0.05, 0.01), dw, X(hi) + dx / 2, hz(31), Z(C.j1 + CT) + dz / 2, null, "m"); o.rotation.y = sg > 0 ? -a : PI + a;
    const kn = K.sm(K.sph(0.025, 8, 6), GOLD, X(hi) + dx * 0.85, hz(32), Z(C.j1 + CT) + dz * 0.85 + 0.03, null, "s"); });
  // 지붕: 먼 쪽 반만 (기와 줄 · 용마루) + 가까운 쪽 박공 테
  { const ie = gi0 - 0.36, sl = (RIDGE - EAVE) / (C.ci - gi0), he = EAVE - 0.36 * sl, A = [X(ie), hz(he + 2.6)], Bp = [X(C.ci), hz(RIDGE + 2.6)];
    const dx = Bp[0] - A[0], dy = Bp[1] - A[1], L = Math.hypot(dx, dy), ang = Math.atan2(dy, dx), nx = -Math.sin(ang), ny = Math.cos(ang);
    const j0 = C.j0 - CT - 0.38, j1 = C.j1 + CT + 0.38, zc = (Z(j0) + Z(j1)) / 2, dep = j1 - j0;
    const slab = (t, off, col, w = L + 0.06, d = dep) => { const o = K.sm(K.rbox(w, t, d, Math.min(0.02, t / 2.2)), col, (A[0] + Bp[0]) / 2 + nx * off, (A[1] + Bp[1]) / 2 + ny * off, zc, null, "m"); o.rotation.z = ang; return o; };
    slab(0.1, 0, ROOF); slab(0.03, -0.07, D("#D9BC94", "#4E3E30"), L, dep - 0.1);
    for(let k = 0; k < 9; k++){ const f = (k + 0.5) / 9, x = A[0] + dx * f + nx * 0.058, y = A[1] + dy * f + ny * 0.058; const o = K.sm(K.rbox(0.07, 0.03, dep, 0), k % 2 ? ROOFD : K.sh(ROOF, 0.08), x, y, zc, null, "m"); o.rotation.z = ang; }
    { const o = K.sm(K.cyl(0.09, 0.09, dep + 0.04, 12), ROOFD, Bp[0], Bp[1] + 0.04, zc, null, "m"); o.rotation.x = PI / 2; }
    const fe = [X(gi1 + 0.36), hz(he + 2.6)], fdx = fe[0] - Bp[0], fdy = fe[1] - Bp[1], fl = Math.hypot(fdx, fdy);
    { const o = K.sm(K.rbox(fl + 0.08, 0.1, CT + 0.16, 0.02), ROOF, (Bp[0] + fe[0]) / 2, (Bp[1] + fe[1]) / 2, Z(C.j0 - CT / 2), null, "m"); o.rotation.z = Math.atan2(fdy, fdx); }
    { const o = K.sm(K.rbox(L + 0.08, 0.1, CT + 0.16, 0.02), ROOFD, (A[0] + Bp[0]) / 2, (A[1] + Bp[1]) / 2 + 0.01, Z(C.j1 + CT + 0.3), null, "m"); o.rotation.z = ang; } }
  // 창 · 둥근 창 · 나무 십자가 · 말씀
  lancet(3.6, 38, 88, 0.66, ["#F4A7B9", "#C8B4D0", "#A8DCC8", "#F6E39A", "#A9CBEA", "#F9C99B"], 0);
  lancet(7.0, 38, 88, 0.66, ["#A9CBEA", "#A8DCC8", "#C8B4D0", "#F4A7B9", "#F9C99B", "#F6E39A"], 2);
  roseWindow(C.ci, 108, 0.42);
  const cw = D("#B98558", "#6A4A30");
  B(C.ci - 0.08, C.j0 + 0.012, 0.16, 0.07, 58, cw, 46, {r:0.015}); B(C.ci - 0.34, C.j0 + 0.012, 0.68, 0.07, 7.5, cw, 84, {r:0.015});
  K.wtext("하나님은 사랑이시라", C.ci, C.j0 + 0.024, 37.5, "i", 2.8, D("#8B5A3C", "#E9D2B0"), null, 700, K.FONT);
  [2.4, 8.2].forEach(i => { B(i - 0.08, C.j0 + 0.012, 0.16, 0.08, 6, GOLD, 64, {r:0.02, cls:"s"}); K.sm(K.cyl(0.07, 0.04, hz(8), 12), D("#FFF6E0", "#FFE7B8"), X(i), hz(74), Z(C.j0 + 0.12), null, "glow"); });
  [11.5, 14.2].forEach(j => { B(C.i0 + 0.012, j - 0.08, 0.08, 0.16, 6, GOLD, 52, {r:0.02, cls:"s"}); K.sm(K.cyl(0.07, 0.04, hz(8), 12), D("#FFF6E0", "#FFE7B8"), X(C.i0 + 0.12), hz(62), Z(j), null, "glow"); });
  // 강단 (한 단) · 설교대 · 성경 · 꽃 · 무릎 방석
  const st = D("#E2C49C", "#5E4A38");
  B(C.i0, C.j0, C.i1 - C.i0, 1.5, 5, st, 0, {r:0.01}); B(C.i0, C.j0 + 1.46, C.i1 - C.i0, 0.05, 5.2, K.sh(st, -0.15), 0, {r:0});
  const pw = D("#9C6A44", "#4E3626");
  B(4.98, 10.32, 0.64, 0.4, 26, pw, 5, {r:0.03}); B(4.94, 10.28, 0.72, 0.48, 1.4, K.sh(pw, 0.15), 31, {r:0.02});
  { const o = B(4.98, 10.3, 0.64, 0.42, 1.4, K.sh(pw, 0.2), 33, {r:0.01}); o.rotation.x = 0.28; }
  { const bo = B(5.02, 10.38, 0.56, 0.28, 0.8, D("#FFFDF6", "#C9C2B6"), 35.2, {r:0.01}); bo.rotation.x = 0.28; const sp = B(5.29, 10.37, 0.02, 0.3, 1.0, D("#B84A5A", "#6A2E36"), 35.4, {r:0}); sp.rotation.x = 0.28; }
  B(5.26, 10.725, 0.08, 0.012, 13, GOLD, 13, {r:0, cls:"s"}); B(5.19, 10.725, 0.22, 0.012, 2.4, GOLD, 21, {r:0, cls:"s"});
  [[4.15, 10.75], [6.45, 10.75]].forEach(([i, j], q) => { K.sm(K.cyl(0.1, 0.13, hz(20), 14), WHITE, X(i), hz(5 + 10), Z(j), null, "s"); disc(i, j, 0.16, 25, 1.2, WHITE, "s", 16);
    K.sm(K.cyl(0.09, 0.06, hz(7), 12), D("#DDE8F2", "#5A6470"), X(i), hz(29.5), Z(j), null, "glass");
    [[0, 0, 37, 0.13, "#FFFFFF"], [-0.12, 0.05, 34, 0.09, "#F4A7B9"], [0.12, 0.04, 34, 0.09, "#F6E39A"], [0.03, -0.1, 35, 0.09, "#C8B4D0"], [-0.05, 0.12, 40, 0.08, "#F4A7B9"], [0.08, -0.03, 42, 0.07, "#FFFFFF"], [0, 0.03, 45, 0.06, "#F9C99B"]].forEach(([di, dj, z, r, col]) => ball(i + di, j + dj, z, r, col, "m", 10));
    [[-0.17, 0.02], [0.17, -0.02], [0, 0.17]].forEach(([di, dj]) => ball(i + di, j + dj, 32, 0.07, K.sh("plant", 0.1), "m", 8)); });
  disc(C.ci, 11.72, 0.24, 0, 1.6, D("#E8B5C8", "#6A4A58"), "m", 20); disc(C.ci, 11.72, 0.17, 1.6, 0.4, D("#F4D3DF", "#7A5866"), "m", 20);
  // 피아노 (강단 왼쪽, 갈색 업라이트) · 의자 · 악보
  const pn = D("#8A5E44", "#4A3428");
  B(2.0, 9.86, 1.3, 0.44, 36, pn, 5, {r:0.02}); B(1.98, 9.84, 1.34, 0.48, 1.6, K.sh(pn, 0.15), 41, {r:0.015});
  B(2.02, 10.28, 1.26, 0.24, 2.2, pn, 22, {r:0.01}); B(2.07, 10.3, 1.16, 0.17, 0.8, "#FFFFFF", 24.2, {r:0});
  for(let q = 0; q < 16; q++) if(q % 7 !== 2 && q % 7 !== 6) B(2.11 + q * 0.072, 10.3, 0.035, 0.1, 0.6, "#1E1E1E", 25, {r:0});
  B(2.42, 10.26, 0.44, 0.03, 9, D("#FFFDF6", "#C9C2B6"), 28, {r:0}); B(2.1, 10.3, 0.1, 0.18, 6, pn, 5, {r:0}); B(3.2, 10.3, 0.1, 0.18, 6, pn, 5, {r:0});
  B(2.3, 10.72, 0.7, 0.32, 9, pn, 5, {r:0.02}); B(2.32, 10.74, 0.66, 0.28, 1.4, PINK2, 14, {r:0.02});
  ball(3.15, 10.08, 42, 0.07, D("#F6E39A", "#8A7A3A"), "m", 10);
  // 장의자 네 줄 × 두 줄
  PEWJ.forEach(j => { pew(PEWL[0], PEWL[1], j); pew(PEWR[0], PEWR[1], j); });
  // 헌금함 · 꽂이 책장 · 안내 화분 (문 옆)
  B(7.7, 16.55, 0.42, 0.32, 20, pw, 0, {r:0.03}); B(7.82, 16.6, 0.18, 0.03, 0.5, INK, 20, {r:0}); K.wtext("감사", 7.91, 16.875, 13, "i", 2.0, D("#FFF3D6", "#E9D2B0"), null, 800, K.FONT);
  B(2.05, 16.65, 0.9, 0.32, 24, pw, 0, {r:0.02}); [[2.12, LILAC], [2.26, SPROUT], [2.4, PINK], [2.54, AMBER], [2.68, LILAC], [2.82, SPROUT]].forEach(([i, col]) => B(i, 16.7, 0.1, 0.2, 8, col, 24, {r:0.005}));
  flowerPot(3.5, 16.85, "#F4A7B9", 0.75, WHITE);
}
function buildTower(){
  const ext = CHW, oi = TW.i0, oj = TW.j0, wi = TW.i1 - TW.i0, wj = TW.j1 - TW.j0, H0 = 130;
  B(oi, oj, wi, 0.18, H0, ext, 0, {r:0}); B(oi, oj, 0.18, wj, H0, ext, 0, {r:0}); B(TW.i1 - 0.12, oj, 0.12, wj, H0, ext, 0, {r:0});
  B(oi, TW.j1 - 0.18, 0.22, 0.18, H0, ext, 0, {r:0}); B(TW.i1 - 0.26, TW.j1 - 0.18, 0.26, 0.18, H0, ext, 0, {r:0}); B(oi, TW.j1 - 0.18, wi, 0.18, H0 - 70, ext, 70, {r:0});
  K.faceJ(oi + 0.18, TW.i1 - 0.12, oj + 0.18, 0, H0, D("#EFE8DC", "#46413C"), "m", 0.01);
  { const o = K.sm(myGeo(new THREE.TorusGeometry((wi - 0.48) / 2, 0.035, 6, 18, PI)), WHITE, X(oi + 0.22 + (wi - 0.48) / 2), hz(70) - 0.02, Z(TW.j1) + 0.012, null, "s"); }
  [70, 128].forEach(z => B(oi - 0.03, oj - 0.03, wi + 0.06, wj + 0.06, 2.4, WHITE, z, {r:0.01}));
  K.faceJ(oi + 0.4, TW.i1 - 0.4, TW.j1 + 0.004, 92, 112, D("#E2D6EA", "#4E4458"), "m", 0.012);
  // 종 칸: 네 기둥 · 들보 · 종 (움직임은 buildBell) · 지붕 (라일락 뿔) · 십자가 (밤엔 은은히)
  [[oi, oj], [TW.i1 - 0.18, oj], [oi, TW.j1 - 0.18], [TW.i1 - 0.18, TW.j1 - 0.18]].forEach(([i, j]) => B(i, j, 0.18, 0.18, 36, ext, H0, {r:0.02}));
  B(oi + 0.1, TW.cj - 0.04, wi - 0.2, 0.08, 3, WOODD, 161, {r:0.01});
  B(oi - 0.07, oj - 0.07, wi + 0.14, wj + 0.14, 4, WHITE, H0 + 36, {r:0.02});
  { const o = K.sm(myGeo(new THREE.ConeGeometry(Math.hypot(wi, wj) / 2 + 0.12, hz(46), 4)), ROOF, X(TW.ci), hz(H0 + 40 + 23), Z(TW.cj), null, "m"); o.rotation.y = PI / 4; }
  ball(TW.ci, TW.cj, H0 + 87, 0.06, GOLD, "s", 10);
  const xc = D("#FFFFFF", "#FFEFCF");
  B(TW.ci - 0.04, TW.cj - 0.04, 0.08, 0.08, 34, xc, H0 + 88, {r:0.01, cls:"glow"}); B(TW.ci - 0.15, TW.cj - 0.04, 0.3, 0.08, 6, xc, H0 + 109, {r:0.01, cls:"glow"});
  gl(TW.ci, TW.cj + 0.1, H0 + 108, 64, "#FFE8C0", (tm, dk) => dk ? 0.5 + Math.sin(tm * 0.0012) * 0.06 : 0);
  gl(TW.ci, TW.cj + 0.1, H0 + 108, 22, "#FFFFFF", (tm, dk) => dk ? 0.55 : 0);
  // 종줄 (밑까지 · 끝에 술) — 움직임은 buildBell
  W.bellTop = H0 + 30;
}
function buildGarden(){
  // 꽃밭 두 칸 (문 양옆)
  [[2.1, 4.4], [6.2, 8.6]].forEach(([a, b], q) => { for(let i = a, k = 0; i < b; i += 0.3, k++) for(let r = 0; r < 2; r++) flowerStem(i + (r ? 0.15 : 0), 17.85 + r * 0.4 + (k % 2) * 0.05, ["#F4A7B9", "#FFFFFF", "#C8B4D0", "#F6E39A", "#E8B5C8"][(k + r * 2 + q) % 5], 12 + ((k + r) % 3) * 3); });
  // 벤치 (교회를 보며) · 안내판 · 울타리
  bench(2.55, 19.6, "+i", 1.4);
  const sb = D("#FFFDF6", "#5A554E"), sp = D("#8B5A3C", "#5A3A26");
  [6.95, 8.85].forEach(i => B(i - 0.05, 19.25, 0.1, 0.1, 44, sp, 0, {r:0.02}));
  B(6.85, 19.33, 2.1, 0.08, 30, sb, 14, {r:0.03}); B(6.8, 19.31, 2.2, 0.12, 2, sp, 44, {r:0.02}); B(6.8, 19.31, 2.2, 0.12, 1.6, sp, 12.4, {r:0.02});
  { const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(2.3, 0); sh.lineTo(1.15, hz(8)); sh.closePath(); K.sm(myGeo(new THREE.ExtrudeGeometry(sh, {depth:0.16, bevelEnabled:false})), ROOF, X(6.75), hz(46), Z(19.29), null, "m"); }
  K.wtext("✝ 크레용 동네 교회", 7.9, 19.41, 37.5, "i", 3.3, D("#8B5A3C", "#E9D2B0"), null, 800, K.FONT);
  K.wtext("주일 예배 11시", 7.9, 19.41, 27.5, "i", 2.8, D("#2A2A28", "#E2DCD2"), null, 700, K.FONT);
  K.wtext("누구나 환영해요 🌷", 7.9, 19.41, 19.5, "i", 2.2, D("#3A8A78", "#8FD0BE"), null, 800, K.FONT);
  const fc = WHITE;
  [[0.3, 4.6], [6.0, 9.6]].forEach(([a, b]) => { for(let i = a; i <= b + 1e-6; i += 0.3) B(i - 0.03, 20.32, 0.06, 0.05, 14, fc, 0, {r:0.01, cls:"s"}); [6, 11].forEach(z => B(a, 20.33, b - a, 0.03, 1.4, fc, z, {r:0, cls:"s"})); });
  for(let j = 17.6; j < 20.3; j += 0.3) B(9.55, j, 0.05, 0.06, 14, fc, 0, {r:0.01, cls:"s"}); [6, 11].forEach(z => B(9.56, 17.6, 0.03, 2.7, 1.4, fc, z, {r:0, cls:"s"}));
  bush(0.6, 18.2, 0.9); bush(9.1, 17.9, 0.8, D("#8CC478", "#34502E"));
  [[1.2, 21.4], [3.4, 21.6]].forEach(([i, j]) => bush(i, j, 0.75));
}
/* 돗자리 소풍 (가족) · 유나 자리 */
function buildPicnic(){
  const wk = D("#D9A66A", "#6A4E30"), wkd = K.sh(wk, -0.2);
  B(11.65, 13.82, 0.56, 0.4, 9, wk, 0.6, {r:0.04}); for(let k = 0; k < 4; k++) K.faceJ(11.67, 12.19, 14.225, 1.5 + k * 2, 2.1 + k * 2, wkd, "m", 0.006);
  B(11.63, 13.8, 0.6, 0.44, 1.2, K.sh(wk, 0.12), 9.6, {r:0.04}); { const o = K.sm(myGeo(new THREE.TorusGeometry(0.22, 0.02, 6, 16, PI)), wkd, X(11.93), hz(10.4), Z(14.02), null, "m"); }
  B(11.7, 13.9, 0.2, 0.2, 1.4, D("#F4BFD0", "#7A5060"), 10.8, {r:0.02});
  B(10.75, 14.05, 0.55, 0.38, 3.2, D("#2A2A2C", "#1E1E20"), 0.6, {r:0.03}); for(let r = 0; r < 2; r++) for(let q = 0; q < 4; q++){ const i = 10.84 + q * 0.12, j = 14.14 + r * 0.18;
    disc(i, j, 0.05, 3.8, 1.8, "#1E2A1E", "m", 10); disc(i, j, 0.035, 5.6, 0.3, ["#FFFFFF", "#F6E39A", "#E06A55", "#72C4AE"][(q + r) % 4], "m", 8); }
  disc(11.15, 14.85, 0.2, 0.6, 1, WHITE, "s", 18); [[-0.07, 0], [0.07, 0.04], [0, -0.08], [0.05, 0.08], [-0.06, 0.07]].forEach(([di, dj]) => ball(11.15 + di, 14.85 + dj, 2.6, 0.04, "#E8455A", "m", 8));
  [[10.45, 14.6, "#F9C99B"], [10.6, 14.75, "#A8DCC8"]].forEach(([i, j, col]) => { K.sm(K.cyl(0.05, 0.05, hz(11), 10), D(col, "#6A6050"), X(i), hz(6.1), Z(j), null, "glass"); disc(i, j, 0.03, 11.6, 1.4, WHITE, "s", 8); });
  K.sm(K.cyl(0.06, 0.06, hz(16), 12), D("#72C4AE", "#3E7A6A"), X(12.15), hz(8.6), Z(14.95), null, "s"); disc(12.15, 14.95, 0.05, 16.6, 2, WHITE, "s", 10);
  // 파라솔 (줄무늬)
  rod([10.3, 13.75, 0], [10.3, 13.75, 56], 0.02, WHITE, "s", 6);
  for(let k = 0; k < 8; k++){ const g = myGeo(new THREE.ConeGeometry(0.85, hz(12), 8, 1, true, k * PI / 4, PI / 4)); K.sm(g, k % 2 ? D("#FFFFFF", "#8A847C") : PINK, X(10.3), hz(56 - 6), Z(13.75), null, "m"); }
  ball(10.3, 13.75, 57, 0.04, PINK, "s", 8);
  // 벗어 둔 신발 (어른 둘 · 아이 하나)
  [[10.3, 15.72, D("#6A4A38", "#3A2A20")], [10.42, 15.72, D("#6A4A38", "#3A2A20")], [10.75, 15.74, D("#F4F1EA", "#6A665E")], [10.87, 15.74, D("#F4F1EA", "#6A665E")], [11.25, 15.73, PINK], [11.34, 15.73, PINK]].forEach(([i, j, col]) => B(i - 0.04, j - 0.1, 0.08, 0.2, 2.2, col, 0, {r:0.03}));
  // 유나 돗자리: 방석 · 그림책 · 크레용
  B(13.1, 15.75, 0.42, 0.42, 2.4, PINK2, 0.4, {r:0.08}); B(13.75, 16.2, 0.32, 0.24, 1, D("#A9CBEA", "#3E5670"), 0.4, {r:0.01}); B(13.77, 16.22, 0.28, 0.2, 0.4, "#FFFFFF", 1.4, {r:0});
  [0, 1, 2, 3].forEach(k => { const o = K.sm(K.cyl(0.012, 0.012, 0.12, 6), RB[k], X(14.15 + k * 0.03), hz(0.9), Z(15.6), null, "m"); o.rotation.z = PI / 2; });
}
/* 연날리기 밭 말뚝 · 얼레 */
const KITES = [{a:[21.7, 16.2], p:[20.6, 10.6, 3.5], t:"gaori", c:"#E8A04A", c2:"#FFF1D6", ph:0}, {a:[27.7, 15.2], p:[27.2, 9.4, 4.15], t:"bang", c:"#FFFFFF", c2:"#E8B5C8", ph:2.1}, {a:[30.6, 18.8], p:[31.0, 12.9, 3.7], t:"gaori", c:"#4DAA97", c2:"#E2F4EE", ph:4.2}];
function buildKiteField(){
  // 민트 돗자리 가족 (파라솔 · 아이스박스 · 신발) · 풀밭 위 프리스비
  rod([27.65, 19.6, 0], [27.65, 19.6, 54], 0.02, WHITE, "s", 6);
  for(let k = 0; k < 8; k++) K.sm(myGeo(new THREE.ConeGeometry(0.8, hz(11), 8, 1, true, k * PI / 4, PI / 4)), k % 2 ? D("#FFFFFF", "#8A847C") : LILAC, X(27.65), hz(54 - 5.5), Z(19.6), null, "m");
  ball(27.65, 19.6, 55, 0.04, LILAC, "s", 8);
  B(28.55, 19.45, 0.44, 0.3, 9, D("#72C4AE", "#2F5E52"), 0.6, {r:0.04}); B(28.53, 19.43, 0.48, 0.34, 2, WHITE, 9.6, {r:0.04});
  B(27.8, 20.2, 0.4, 0.3, 2.6, D("#F6E39A", "#8A7A3A"), 0.6, {r:0.03}); disc(28.35, 20.3, 0.12, 0.6, 0.8, WHITE, "s", 14); [[-0.04, 0], [0.04, 0.03], [0, -0.05]].forEach(([di, dj]) => ball(28.35 + di, 20.3 + dj, 2.2, 0.035, D("#FFB347", "#8A6A2E"), "m", 8));
  [[27.4, 20.98, PINK], [27.5, 20.98, PINK], [27.75, 21.0, D("#4E6A88", "#33465A")], [27.87, 21.0, D("#4E6A88", "#33465A")]].forEach(([i, j, col]) => B(i - 0.04, j - 0.1, 0.08, 0.2, 2.2, col, 0, {r:0.03}));
  disc(25.4, 20.25, 0.17, 0, 1.2, D("#F06BA8", "#9A4E6E"), "s", 18); disc(25.4, 20.25, 0.11, 1.2, 0.3, D("#FFD0E2", "#7A5866"), "s", 18);
  // 안내판 "연날리기 마당"
  [21.95, 23.25].forEach(i => B(i - 0.04, 21.55, 0.08, 0.08, 30, WOODD, 0, {r:0.02}));
  B(21.8, 21.6, 1.6, 0.07, 13, D("#FFFDF6", "#5A554E"), 15, {r:0.04}); B(21.78, 21.59, 1.64, 0.09, 1.6, AMBER, 28, {r:0.02});
  K.wtext("연날리기 마당 🪁", 22.6, 21.675, 23.6, "i", 2.6, D("#9A6A2E", "#FFD49A"), null, 800, K.FONT);
  K.wtext("줄은 나무에서 멀리!", 22.6, 21.675, 18.2, "i", 1.6, D("#6E675C", "#D2C8BA"), null, 700, K.FONT);
  // 튤립 꽃밭 (아래 왼쪽 잔디)
  for(let k = 0; k < 34; k++){ const a = k * 2.4, r = Math.sqrt((k + 0.5) / 34); flowerStem(11.8 + Math.cos(a) * r * 1.05, 19.6 + Math.sin(a) * r * 0.42, ["#F4A7B9", "#F6E39A", "#FFFFFF", "#E8B5C8", "#F9C99B", "#C8B4D0"][k % 6], 10 + (k % 3) * 2.5); }
  // 음수대
  K.sm(K.cyl(0.13, 0.16, hz(22), 14), D("#E6DFD2", "#4A4640"), X(14.35), hz(11), Z(19.5), null, "m"); disc(14.35, 19.5, 0.19, 22, 2.4, D("#D6CEC0", "#57524A"), "m", 18);
  disc(14.35, 19.5, 0.13, 23.4, 1.2, D("#A9D8EA", "#33506A"), "glass", 16); rod([14.35, 19.5, 24], [14.42, 19.5, 28], 0.015, "#C9CDD2"); ball(14.42, 19.5, 28.6, 0.022, "#C9CDD2", "s", 8);
  KITES.forEach(({a}) => { B(a[0] - 0.03, a[1] - 0.03, 0.06, 0.06, 10, WOODD, 0, {r:0}); const o = K.sm(K.cyl(0.07, 0.07, 0.1, 12), D("#E8C36A", "#8A7440"), X(a[0]), hz(7), Z(a[1] + 0.05), null, "m"); o.rotation.x = PI / 2; });
  B(KITE_AT[0] - 0.5, KITE_AT[1] + 0.6, 0.12, 0.12, 0.6, WHITE, 0, {r:0.03});
}
/* 라면 카트 (강변 라면 · 편의점) · 테이블 */
function buildCart(){
  const body = D("#FFF3DC", "#5A5246"), trim = AMBER;
  B(21.95, 8.6, 1.75, 0.82, 30, body, 6, {r:0.05}); B(21.92, 8.57, 1.81, 0.88, 2, trim, 36, {r:0.02}); B(21.95, 9.4, 1.75, 0.04, 8, trim, 14, {r:0.01});
  [[22.1, 8.55], [23.55, 8.55]].forEach(([i, j]) => { const o = K.sm(myGeo(new THREE.TorusGeometry(0.17, 0.05, 8, 18)), INK, X(i), 0.2, Z(j), null, "s"); K.sm(K.cyl(0.05, 0.05, 0.06, 8), WHITE, X(i), 0.2, Z(j), null, "s").rotation.x = PI / 2; });
  [22.0, 23.62].forEach(i => [8.62, 9.36].forEach(j => B(i, j, 0.05, 0.05, 36, WHITE, 38, {r:0, cls:"s"})));
  for(let k = 0; k < 9; k++){ const o = B(21.88 + k * 0.21, 8.5, 0.21, 1.06, 1.4, k % 2 ? WHITE : trim, 74 + (k % 2) * 0.2, {r:0}); }
  for(let k = 0; k < 9; k++) B(21.88 + k * 0.21, 9.52, 0.21, 0.05, 6, k % 2 ? WHITE : trim, 68, {r:0.01});   // 앞 주름
  B(22.1, 8.7, 0.5, 0.42, 16, D("#D6DADF", "#6A6E74"), 38, {r:0.03, cls:"s"}); B(22.18, 9.13, 0.2, 0.012, 3, "#E2403A", 48, {r:0, cls:"glow"}); B(22.25, 8.98, 0.22, 0.2, 0.6, INK, 38, {r:0, cls:"s"});
  [[22.9, 8.85, "#E2403A"], [23.05, 8.85, "#F6E39A"], [23.2, 8.85, "#E2403A"], [22.97, 8.85, "#F6E39A"], [23.12, 8.85, "#E2403A"]].forEach(([i, j, col], k) => K.sm(K.cyl(0.065, 0.055, hz(5), 12), col, X(i), hz(38 + 2.5 + (k > 2 ? 5 : 0)), Z(j), null, "m"));
  [[23.45, 9.1, "#FFE066"], [23.55, 8.9, "#72C4AE"]].forEach(([i, j, col]) => B(i - 0.05, j - 0.04, 0.1, 0.08, 6, col, 38, {r:0.01}));
  B(21.98, 9.42, 1.69, 0.03, 12, D("#FFFFFF", "#8A847C"), 18, {r:0}); K.wtext("강변 라면 🍜", 22.82, 9.455, 25, "i", 3.0, D("#C26A1E", "#FFD49A"), null, 900, K.FONT);
  K.wtext("라면 · 컵밥 · 음료", 22.82, 9.455, 19.4, "i", 1.7, D("#8A6A4A", "#E2D2BC"), null, 700, K.FONT);
  for(let k = 0; k < 8; k++){ const i = 21.95 + k * 0.25, z = 66 - Math.sin(k / 7 * PI) * 3; ball(i, 9.56, z, 0.03, D("#E6E1D8", "#FFE9B8"), "glow", 8); gl(i, 9.56, z, 9, "#FFD68C", (tm, dk) => dk ? 0.65 : 0); }
  // 둥근 테이블 · 의자 둘
  disc(24.6, 9.75, 0.36, 18, 1.4, WHITE, "s", 24); K.sm(K.cyl(0.03, 0.03, hz(18), 8), INK, X(24.6), hz(9), Z(9.75), null, "s"); disc(24.6, 9.75, 0.18, 0, 0.8, INK, "s");
  [[24.0, 9.75], [25.2, 9.75]].forEach(([i, j]) => { disc(i, j, 0.17, 11, 1.6, D("#F6E39A", "#8A7A3A"), "s", 16); K.sm(K.cyl(0.025, 0.025, hz(11), 8), INK, X(i), hz(5.5), Z(j), null, "s"); });
  disc(24.5, 9.7, 0.08, 19.4, 4, D("#E2403A", "#7A2A2A"), "m", 12);
}
/* 자전거 대여소 */
function buildRental(){
  const mint = D("#A8DCC8", "#3E6A5C"), mintd = D("#72C4AE", "#2F5E52");
  B(29.4, 8.7, 1.65, 1.0, 44, mint, 0, {r:0.04}); B(29.32, 8.62, 1.81, 1.16, 3, WHITE, 44, {r:0.03});
  K.faceJ(29.6, 30.85, 9.7, 18, 38, D("#2E3A48", "#1A222C"), "s", 0.012); B(29.55, 9.7, 1.35, 0.18, 1.6, WHITE, 17, {r:0.01});
  for(let k = 0; k < 7; k++) B(29.32 + k * 0.26, 9.78, 0.13, 0.16, 7, k % 2 ? WHITE : mintd, 41, {r:0.01});
  B(29.45, 9.72, 1.55, 0.05, 10, WHITE, 48, {r:0.01}); K.wtext("자전거 대여소 🚲", 30.22, 9.775, 53, "i", 2.9, D("#2F7466", "#BFEDE0"), null, 800, K.FONT);
  K.wtext("1시간 3천원 · 헬멧 꼭!", 30.22, 9.718, 12, "i", 1.7, "#FFFFFF", null, 700, K.FONT);
  B(30.95, 9.72, 0.05, 0.05, 1, WHITE, 0, {r:0});
  ball(30.6, 9.0, 47.5, 0.11, D("#F6E39A", "#8A7A3A"), "m", 10).scale.y = 0.6;
  // 자전거 거치대 · 자전거 넷
  B(31.3, 9.35, 2.6, 0.06, 1.2, POST, 12, {r:0, cls:"s"}); [31.45, 32.1, 32.75, 33.4].forEach((i, k) => { B(i - 0.025, 9.32, 0.05, 0.12, 12, POST, 0, {r:0, cls:"s"}); bikeStatic(i, 9.05, PI, [D("#F06BA8", "#B5607E"), D("#4DAA97", "#2F6E62"), D("#E8A04A", "#9A6A2E"), D("#A9CBEA", "#4E6A88")][k]); });
  // 헬멧 진열 · 화분
  [[29.55, 10.05, PINK], [29.85, 10.05, LEAF]].forEach(([i, j, col]) => { B(i - 0.12, j - 0.1, 0.24, 0.2, 14, WHITE, 0, {r:0.03}); K.sm(myGeo(new THREE.SphereGeometry(0.11, 12, 8, 0, PI * 2, 0, PI / 2)), col, X(i), hz(14), Z(j), null, "s"); });
  flowerPot(31.2, 10.2, "#F6E39A", 0.8);
}
/* 공원 입구 아치 · 오른쪽 동네 길 아치 · 산울타리 */
function buildGates(){
  const pc = D("#4DAA97", "#2F7466");
  [15.95, 18.05].forEach(i => { B(i - 0.12, 22.5, 0.24, 0.24, 64, pc, 0, {r:0.04}); B(i - 0.16, 22.46, 0.32, 0.32, 4, K.sh(pc, -0.2), 0, {r:0.04}); ball(i, 22.62, 68, 0.12, PINK, "s", 12); });
  B(15.85, 22.56, 2.3, 0.12, 14, WHITE, 50, {r:0.04}); [0.15, 0.55, 0.95, 1.35, 1.75, 2.15].forEach((d, k) => B(15.85 + d - 0.06, 22.55, 0.12, 0.14, 2.4, RB[k], 64.2, {r:0.04}));
  K.wtext("크레용 강변공원", 17.0, 22.68, 58.5, "i", 3.4, D("#2F7466", "#BFEDE0"), null, 800, K.FONT); K.wtext("교회 · 오리배 · 연날리기", 17.0, 22.68, 52.6, "i", 1.7, D("#8B5A3C", "#E9D2B0"), null, 700, K.FONT);
  // 오른쪽 (동네 길)
  [11.25, 12.75].forEach(j => { B(32.85, j - 0.08, 0.16, 0.16, 62, AMBER, 0, {r:0.03}); ball(32.93, j, 65, 0.1, PINK, "s", 10); });
  B(32.87, 11.17, 0.12, 1.66, 12, WHITE, 48, {r:0.03});
  K.wtext("동네 길", 32.84, 12.0, 55.5, "-j", 3.2, D("#9A6A2E", "#FFD49A"), null, 800, K.FONT); K.wtext("이쪽으로 가면 마을", 32.84, 12.0, 50.4, "-j", 1.6, D("#6E675C", "#D2C8BA"), null, 700, K.FONT);
  // 산울타리 (아래쪽 · 입구만 비움)
  [[EXT[0] + 0.05, 15.75], [18.25, EXT[2] - 0.05]].forEach(([a, b]) => { B(a, 22.38, b - a, 0.46, 15, D("#7FB86E", "#2E4A2E"), 0, {r:0.12, seg:2});
    for(let i = a + 0.25; i < b; i += 0.5) ball(i, 22.61, 15, 0.2, K.sh(D("#7FB86E", "#2E4A2E"), (rnd(i * 3) - 0.5) * 0.2), "m", 8).scale.y = 0.55; });
  for(let i = EXT[0] + 0.3, k = 0; i < EXT[2]; i += 0.5, k++){ if(i > 15.4 && i < 18.6) continue; if(k % 3 === 0) ball(i, 22.3, 13, 0.06, RB[k % 6], "m", 6); }
  // 오른쪽 끝 · 왼쪽 끝 낮은 울타리 (밖으로 안 나가게 보이도록, 2026-11-26 감독님 "밖에있으면 어떡해"). 오른쪽은 동네 길 자리만 비움
  const pk = (i, j0, j1) => { const n = Math.max(1, Math.round((j1 - j0) / 0.32));
    for(let k = 0; k <= n; k++){ const j = j0 + (j1 - j0) * k / n; B(i - 0.025, j - 0.03, 0.05, 0.06, 14, WHITE, 0, {r:0.01}); if(k % 3 === 0) ball(i, j, 15, 0.04, RB[(k / 3 | 0) % 6], "m", 8); }
    [4, 10].forEach(z => B(i - 0.02, j0, 0.04, j1 - j0, 1.6, WHITE, z, {r:0})); };
  pk(EXT[0] + 0.25, RJ + 0.42, 22.38); pk(EXT[2] - 0.25, RJ + 0.42, 11.05); pk(EXT[2] - 0.25, 12.95, 16.85); pk(EXT[2] - 0.25, 18.55, 22.38);
  // 오른쪽 아래: 테니스장 가는 길 (2026-11-28 감독님 "테니스장")
  [16.95, 18.45].forEach(j => { B(32.85, j - 0.08, 0.16, 0.16, 62, SPROUT, 0, {r:0.03}); ball(32.93, j, 65, 0.1, D("#DDF24E", "#8A9A30"), "s", 10); });
  B(32.87, 16.87, 0.12, 1.66, 12, WHITE, 48, {r:0.03});
  K.wtext("테니스장", 32.84, 17.7, 55.5, "-j", 3.2, D("#2F7466", "#BFEDE0"), null, 800, K.FONT); K.wtext("공 · 라켓 빌려 줘요 🎾", 32.84, 17.7, 50.4, "-j", 1.6, D("#6E675C", "#D2C8BA"), null, 700, K.FONT);
}

/* ---------- 움직이는 것 ---------- */
function buildWater(){
  const pos = [], kd = [], y = hz(WY);
  const tri = (a, b, c, k) => [a, b, c].forEach(p => { pos.push(X(p[0]), y, Z(p[1])); kd.push(k); });
  const quad = (i0, j0, i1, j1, k) => { tri([i0, j0], [i0, j1], [i1, j1], k); tri([i0, j0], [i1, j1], [i1, j0], k); };
  quad(EXT[0], 0.15, EXT[2], RJ, 0); quad(15.6, RJ - 0.01, 19.4, 8.6, 1);
  const n = 36; for(let q = 0; q < n; q++){ const a0 = q / n * PI * 2, a1 = (q + 1) / n * PI * 2; tri([POND.ci, POND.cj], [POND.ci + Math.cos(a0) * POND.ri, POND.cj + Math.sin(a0) * POND.rj], [POND.ci + Math.cos(a1) * POND.ri, POND.cj + Math.sin(a1) * POND.rj], 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("kind", new THREE.Float32BufferAttribute(kd, 1)); g.computeBoundingSphere();
  const lx = new Float32Array(8); LAMPS.filter(([i, j]) => j < 9).slice(0, 6).forEach(([i], k) => lx[k] = X(i)); lx[6] = X(TW.ci); lx[7] = X(C.ci);
  const mat = new THREE.ShaderMaterial({uniforms:{uT:{value:0}, uDark:{value:K.R.dark ? 1 : 0}, uShore:{value:Z(RJ)}, uL:{value:lx}}, toneMapped:false,
    vertexShader:"attribute float kind; varying float vK; varying vec3 vW; void main(){ vK = kind; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }",
    fragmentShader:`uniform float uT, uDark, uShore; uniform float uL[8]; varying float vK; varying vec3 vW;
      float h21(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
      void main(){
        float d = clamp((uShore - vW.z) / 5.6, 0.0, 1.0); if(vK > 0.5) d = 0.18;
        vec3 dN = vec3(0.60, 0.86, 0.91), dF = vec3(0.40, 0.70, 0.86), nN = vec3(0.14, 0.21, 0.36), nF = vec3(0.09, 0.13, 0.27);
        vec3 c = mix(mix(dN, dF, d), mix(nN, nF, d), uDark);
        if(vK > 0.5) c = mix(c, mix(vec3(0.55, 0.82, 0.80), vec3(0.12, 0.22, 0.30), uDark), 0.45);
        float w = sin(vW.x * 2.3 + vW.z * 5.1 + uT * 1.1) + sin(-vW.x * 1.7 + vW.z * 7.3 - uT * 0.9) + 0.6 * sin(vW.x * 6.1 - vW.z * 3.3 + uT * 1.7);
        c += smoothstep(1.45, 2.3, w) * mix(0.2, 0.09, uDark);
        c -= smoothstep(-1.4, -2.2, w) * 0.035;
        float fl = smoothstep(0.86, 1.0, sin((vW.x - uT * 0.4) * 1.3 + sin(vW.z * 2.7) * 1.6)) * smoothstep(0.55, 1.0, sin(vW.z * 11.0 + sin(vW.x * 0.7)));
        c += fl * (1.0 - vK) * mix(0.16, 0.07, uDark);
        vec2 cell = floor(vW.xz * vec2(5.0, 9.0)); float hs = h21(cell), tw = 0.5 + 0.5 * sin(uT * (2.0 + hs * 3.0) + hs * 40.0);
        c += step(0.975, hs) * tw * mix(0.35, 0.22, uDark) * (1.0 - d * 0.5);
        float e = 1.0 - smoothstep(0.0, 0.16, uShore - vW.z); c = mix(c, vec3(1.0), e * (1.0 - vK) * mix(0.45, 0.18, uDark));
        if(uDark > 0.5 && vK < 0.5){ for(int k = 0; k < 8; k++){ float dx = vW.x - uL[k] + sin(vW.z * 9.0 + uT * 2.0) * 0.06; float near = smoothstep(4.2, 0.0, uShore - vW.z);
          c += vec3(1.0, 0.78, 0.48) * exp(-dx * dx / 0.018) * near * 0.42 * (0.7 + 0.3 * sin(vW.z * 14.0 - uT * 3.0)); } }
        gl_FragColor = vec4(c, 1.0);
      }`});
  const m = new THREE.Mesh(g, mat); m.renderOrder = 0; K.R.scene.add(m); W.water = m;
}
/* 오리배 (오리배 = 백조 · 노란 오리). 앞 = +z, 물높이가 0 */
function swanBoat(kind, body, wing, seat){
  const M = Merge(), duck = kind === "duck";
  M.add(K.rbox(0.86, 0.3, 1.46, 0.14, 3), body, 0, 0.1, 0);
  M.add(K.rbox(0.62, 0.03, 0.98, 0.012, 1), D("#5A6E7A", "#2A343C"), 0, 0.255, -0.06);
  M.add(K.rbox(0.6, 0.1, 0.3, 0.04, 2), seat, 0, 0.3, -0.26); M.add(K.rbox(0.6, 0.22, 0.07, 0.03, 2), seat, 0, 0.42, -0.42);
  M.add(K.rbox(0.36, 0.05, 0.12, 0.02, 1), INK, 0, 0.28, 0.2);   // 페달 칸
  [-1, 1].forEach(s => M.add(sc(new THREE.SphereGeometry(1, 14, 10), 0.11, 0.2, 0.5), wing, s * 0.43, 0.3, -0.12, -0.32, 0, s * 0.18));
  M.add(sc(new THREE.SphereGeometry(1, 12, 9), 0.22, 0.17, 0.24), wing, 0, 0.36, -0.66, 0.7, 0, 0);
  if(duck){ M.add(new THREE.SphereGeometry(0.21, 16, 12), body, 0, 0.62, 0.55); M.add(K.rbox(0.22, 0.06, 0.18, 0.025, 1), "#F28C28", 0, 0.58, 0.76);
    [-1, 1].forEach(s => { M.add(new THREE.SphereGeometry(0.03, 8, 6), INK, s * 0.1, 0.68, 0.72); M.add(new THREE.SphereGeometry(0.035, 8, 6), "#F4A7B9", s * 0.14, 0.6, 0.7); });
    M.add(new THREE.SphereGeometry(0.06, 8, 6), body, 0, 0.84, 0.52);
  } else {
    for(let k = 0; k < 10; k++){ const t = k / 9, y = 0.3 + 0.7 * t, z = 0.52 + 0.16 * Math.sin(t * PI * 1.05) - 0.05 * t; M.add(new THREE.SphereGeometry(0.078 - 0.012 * t, 10, 8), body, 0, y, z); }
    M.add(new THREE.SphereGeometry(0.13, 14, 10), body, 0, 1.04, 0.56);
    const bk = new THREE.ConeGeometry(0.05, 0.15, 10); bk.rotateX(PI / 2); M.add(bk, "#F28C28", 0, 1.01, 0.73);
    [-1, 1].forEach(s => { M.add(new THREE.SphereGeometry(0.022, 8, 6), INK, s * 0.085, 1.08, 0.65); M.add(new THREE.SphereGeometry(0.028, 8, 6), "#F4A7B9", s * 0.1, 1.0, 0.64); });
    M.add(K.rbox(0.1, 0.07, 0.04, 0.015, 1), PINK, -0.05, 1.15, 0.52, 0, 0, 0.5); M.add(K.rbox(0.1, 0.07, 0.04, 0.015, 1), PINK, 0.05, 1.15, 0.52, 0, 0, -0.5); M.add(new THREE.SphereGeometry(0.03, 8, 6), PINK, 0, 1.15, 0.52);
  }
  return dynMesh(M.geo());
}
const BOAT_PTS = [[26.2, 3.9], [28.6, 3.45], [30.8, 2.4], [30.1, 1.05], [27.0, 0.75], [23.6, 0.85], [20.8, 1.3], [19.4, 2.3], [20.9, 3.0], [22.9, 2.8], [24.6, 3.45]];
function buildBoats(){
  W.boatCurve = new THREE.CatmullRomCurve3(BOAT_PTS.map(([i, j]) => new THREE.Vector3(i, 0, j)), true, "centripetal", 0.5);
  W.boat = swanBoat("swan", WHITE, D("#FFFFFF", "#8A847C"), PINK);
  W.moored = [swanBoat("duck", D("#FFE27A", "#9A8A3A"), D("#FFD54A", "#8A7A30"), D("#A9CBEA", "#4E6A88")), swanBoat("swan", D("#F2ECF7", "#6E6676"), LILAC, LILAC2)];
  W.mooredAt = [[23.0, 3.9, PI / 2], [21.7, 3.9, -PI / 2]];
  W.boatSet = null;
}
/* 연못 오리 가족 (엄마 둘 · 아기 셋) */
function buildDucks(){
  W.ducks = [];
  const mk = (s, body, head) => { const M = Merge(); M.add(sc(new THREE.SphereGeometry(1, 12, 9), 0.16 * s, 0.11 * s, 0.22 * s), body, 0, 0.05 * s, 0);
    M.add(sc(new THREE.SphereGeometry(1, 10, 8), 0.08 * s, 0.07 * s, 0.1 * s), body, 0, 0.1 * s, -0.17 * s, 0.6, 0, 0);
    M.add(new THREE.SphereGeometry(0.1 * s, 12, 9), head, 0, 0.2 * s, 0.15 * s); M.add(K.rbox(0.08 * s, 0.03 * s, 0.09 * s, 0.01, 1), "#F28C28", 0, 0.18 * s, 0.26 * s);
    [-1, 1].forEach(q => M.add(new THREE.SphereGeometry(0.016 * s, 6, 5), INK, q * 0.06 * s, 0.23 * s, 0.22 * s)); return dynMesh(M.geo()); };
  [[1, D("#F4F1EA", "#8A847C"), D("#F4F1EA", "#8A847C")], [1, D("#B8916A", "#5A4636"), D("#3E7A5A", "#2A4A3A")], [0.55, D("#FFE27A", "#9A8A3A"), D("#FFE27A", "#9A8A3A")], [0.55, D("#FFE27A", "#9A8A3A"), D("#FFE27A", "#9A8A3A")], [0.55, D("#FFE27A", "#9A8A3A"), D("#FFE27A", "#9A8A3A")]].forEach(([s, b, h], k) =>
    W.ducks.push({m:mk(s, b, h), s, k, i:POND.ci, j:POND.cj, h:0}));
  W.feed = 0;
}
/* 연 (가오리연 · 방패연) · 꼬리 · 줄 */
function kiteMesh(t, c1, c2){
  const M = Merge();
  if(t === "bang"){ M.add(K.rbox(0.5, 0.66, 0.014, 0.01, 1), c1, 0, 0, 0); [[0, 0.33, 0.5, 0.03], [0, -0.33, 0.5, 0.03]].forEach(([x, y, w, h]) => M.add(K.rbox(w, h, 0.018, 0, 1), D("#C8B4D0", "#5E4E68"), x, y, 0.002));
    [-0.25, 0.25].forEach(x => M.add(K.rbox(0.03, 0.66, 0.018, 0, 1), D("#C8B4D0", "#5E4E68"), x, 0, 0.002));
    { const h = new THREE.CylinderGeometry(0.11, 0.11, 0.02, 20); h.rotateX(PI / 2); M.add(h, D("#BFE0F2", "#3A4A68"), 0, 0.02, 0.004); }
    { const h = new THREE.CylinderGeometry(0.11, 0.11, 0.02, 20, 1, false, 0, PI); h.rotateX(PI / 2); M.add(h, c2, 0, 0.22, 0.006, 0, 0, PI / 2); }
    M.add(K.rbox(0.01, 0.66, 0.02, 0, 1), "#8A6A4C", 0, 0, -0.01); M.add(K.rbox(0.5, 0.01, 0.02, 0, 1), "#8A6A4C", 0, 0.1, -0.01);
  } else { M.add(K.rbox(0.44, 0.44, 0.014, 0.01, 1), c1, 0, 0.06, 0, 0, 0, PI / 4); M.add(K.rbox(0.22, 0.22, 0.016, 0.01, 1), c2, 0, 0.06, 0.003, 0, 0, PI / 4);
    [-1, 1].forEach(s => M.add(K.rbox(0.05, 0.2, 0.01, 0, 1), c1, s * 0.28, -0.12, 0, 0, 0, s * 0.5));
    [-1, 1].forEach(s => M.add(new THREE.SphereGeometry(0.026, 8, 6), INK, s * 0.06, 0.1, 0.012)); M.add(new THREE.SphereGeometry(0.02, 8, 6), "#F4A7B9", 0, 0.02, 0.012); }
  const m = dynMesh(M.geo()); m.castShadow = false; m.scale.setScalar(1.75); return m;
}
function buildKites(){
  W.kites = KITES.map(k => ({...k, m:kiteMesh(k.t, D(k.c, K.shade ? k.c : k.c), D(k.c2, k.c2))}));
  W.yk = {m:kiteMesh("gaori", D("#F4A7B9", "#F4A7B9"), D("#FFFFFF", "#FFFFFF")), t:0, p:[24.2, 11.6, 3.15], a:[KITE_AT[0] + 0.12, KITE_AT[1] - 0.12]};
  W.yk.m.visible = false;
  const TN = 9 * 3; W.tailN = TN + 9;
  W.tails = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), K.cutaway(new THREE.MeshBasicMaterial({toneMapped:false})), W.tailN); W.tails.frustumCulled = false; K.R.scene.add(W.tails);
  for(let k = 0; k < W.tailN; k++) W.tails.setColorAt(k, new THREE.Color(RB[k % 6]));
  const nSeg = (KITES.length + 1) * 14 + 2;
  W.strPos = new Float32Array(nSeg * 2 * 3); const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(W.strPos, 3));
  W.str = new THREE.LineSegments(g, new THREE.LineBasicMaterial({color:0x6E675C, transparent:true, opacity:0.75})); W.str.frustumCulled = false; K.R.scene.add(W.str);
  // 낚시찌
  const M = Merge(); M.add(new THREE.SphereGeometry(0.05, 10, 8, 0, PI * 2, 0, PI / 2), "#E2403A", 0, 0, 0); M.add(new THREE.SphereGeometry(0.05, 10, 8, 0, PI * 2, PI / 2, PI / 2), "#FFFFFF", 0, 0, 0); M.add(K.cyl(0.008, 0.008, 0.1, 5), "#E2403A", 0, 0.08, 0);
  W.bob = dynMesh(M.geo()); W.bob.castShadow = false; W.bite = 0;
}
/* 종 (흔들림) · 종줄 */
function buildBell(){
  const M = Merge();
  M.add(K.cyl(0.11, 0.2, 0.3, 18), GOLD, 0, -0.22, 0); M.add(new THREE.SphereGeometry(0.11, 14, 8, 0, PI * 2, 0, PI / 2), GOLD, 0, -0.07, 0);
  M.add(new THREE.TorusGeometry(0.2, 0.025, 6, 20).rotateX(PI / 2), K.sh(GOLD, -0.15), 0, -0.37, 0); M.add(new THREE.SphereGeometry(0.045, 8, 6), "#6A5A3A", 0, -0.36, 0);
  M.add(K.cyl(0.02, 0.02, 0.06, 6), "#6A5A3A", 0, -0.02, 0);
  W.bell = dynMesh(M.geo()); W.bell.position.set(X(TW.ci), hz(W.bellTop), Z(TW.cj));
  const R2 = Merge(), len = hz(W.bellTop - 24); R2.add(K.cyl(0.016, 0.016, len, 6), D("#E9DCC0", "#8A7E66"), 0, -len / 2, 0); R2.add(K.cyl(0.04, 0.025, 0.12, 8), PINK, 0, -len - 0.04, 0);
  W.rope = dynMesh(R2.geo()); W.rope.position.set(X(TW.ci), hz(W.bellTop - 6), Z(TW.cj + 0.25)); W.ring = 0;
}
/* 먼 강 위 돛단배 (천천히 지나감) */
function buildSail(){
  const M = Merge(); M.add(K.rbox(0.7, 0.14, 0.26, 0.06, 2), D("#FFFFFF", "#8A847C"), 0, 0.04, 0);
  const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(0, 0.62); s.lineTo(0.34, 0.04); s.closePath(); M.add(new THREE.ShapeGeometry(s), D("#F4C7D4", "#7A5866"), 0.02, 0.14, 0.0);
  const s2 = new THREE.Shape(); s2.moveTo(0, 0); s2.lineTo(0, 0.5); s2.lineTo(-0.24, 0.04); s2.closePath(); M.add(new THREE.ShapeGeometry(s2), D("#FFFFFF", "#9A949C"), -0.02, 0.14, 0.0);
  M.add(K.cyl(0.012, 0.012, 0.66, 5), "#8A6A4C", 0, 0.45, 0);
  W.sail = dynMesh(M.geo()); W.sail.material.side = THREE.DoubleSide; W.sail.castShadow = false;
}
/* 빛 점 · 반딧불이 · 김 · 물결 */
function buildFx(){
  LAMPS.forEach(([i, j]) => lamp(i, j));
  [[2.4, C.j0 + 0.15, 74], [8.2, C.j0 + 0.15, 74], [C.i0 + 0.15, 11.5, 62], [C.i0 + 0.15, 14.2, 62]].forEach(([i, j, z]) => gl(i, j, z, 22, "#FFE2B0", (tm, dk) => dk ? 0.6 : 0.05));
  gl(C.ci, C.j0 + 0.1, 76, 70, "#FFE6C4", (tm, dk) => dk ? 0.34 : 0.07);
  gl(3.6, C.j0 + 0.08, 64, 34, "#FFB8CE", (tm, dk) => dk ? 0.32 : 0.06); gl(7.0, C.j0 + 0.08, 64, 34, "#B8D8FF", (tm, dk) => dk ? 0.32 : 0.06); gl(C.ci, C.j0 + 0.08, 108, 26, "#FFF0C0", (tm, dk) => dk ? 0.4 : 0.05);
  gl(30.2, 9.72, 30, 30, "#C8F4E6", (tm, dk) => dk ? 0.45 : 0.04); gl(22.25, 9.1, 46, 10, "#FF6A5A", (tm, dk) => dk ? 0.6 : 0.25);
  W.flies = []; const FA = [[POND.ci, POND.cj, 2.2], [3.2, 7.0, 1.4], [13.9, 9.2, 1.0], [30.9, 7.0, 1.4], [5.3, 19.3, 1.8], [22.6, 7.2, 1.2], [33.0, 17.5, 1.5], [9.0, 9.3, 1.0]];
  for(let k = 0; k < 26; k++){ const [ci, cj, r] = FA[k % FA.length], o = gl(ci, cj, 20, 7, k % 3 ? "#E8FF9A" : "#FFF6A0", (tm, dk) => dk ? 0.35 + 0.65 * Math.max(0, Math.sin(tm * 0.003 * (0.6 + rnd(k) * 0.8) + k * 2.1)) ** 2 : 0);
    W.flies.push({o, ci, cj, r, ph:rnd(k + 33) * 6.28, sp:0.25 + rnd(k + 7) * 0.35, z0:12 + rnd(k + 2) * 30}); }
  const R = K.R, scene = R.scene;
  const gc = document.createElement("canvas"); gc.width = gc.height = 64; { const x = gc.getContext("2d"), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.35, "rgba(255,255,255,.45)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(0, 0, 64, 64); }
  W.gtex = new THREE.CanvasTexture(gc);
  W.gm = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), K.cutaway(new THREE.MeshBasicMaterial({map:W.gtex, transparent:true, blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false})), Math.max(1, W.glows.length));
  W.gm.frustumCulled = false; W.gm.renderOrder = 3; scene.add(W.gm);
  W.fxN = 14; W.fm = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 9), K.cutaway(new THREE.MeshStandardMaterial({roughness:0.6, transparent:true, opacity:0.75, depthWrite:false})), W.fxN); W.fm.frustumCulled = false; scene.add(W.fm);
  W.rN = 14; W.rm = new THREE.InstancedMesh(new THREE.RingGeometry(0.86, 1, 30).rotateX(-PI / 2), new THREE.MeshBasicMaterial({transparent:true, blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false}), W.rN); W.rm.frustumCulled = false; W.rm.renderOrder = 2; scene.add(W.rm);
  W.rings = []; W.skip = null; W.nextJump = 0;
}

/* ---------- 매 프레임 ---------- */
const m4 = new THREE.Matrix4(), qn = new THREE.Quaternion(), v3 = new THREE.Vector3(), v4 = new THREE.Vector3(), sc3 = new THREE.Vector3(), col = new THREE.Color(), e3 = new THREE.Euler(), ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
function fxSet(k, x, y, z, s, c){ if(k >= W.fxN) return; if(s <= 0){ W.fm.setMatrixAt(k, ZERO); return; } m4.compose(v3.set(x, y, z), qn.identity(), sc3.set(s, s * 0.9, s)); W.fm.setMatrixAt(k, m4); W.fm.setColorAt(k, col.set(c)); }
const ripple = (i, j, tm, big = 1) => { W.rings.push({i, j, t0:tm, big}); if(W.rings.length > W.rN) W.rings.shift(); };
function placeBoat(m, i, j, h, tm, ph){
  const red = !!K.reduce, b = red ? 0 : Math.sin(tm * 0.0016 + ph) * 0.018;
  m.position.set(X(i), hz(WY) - 0.04 + b, Z(j)); m.rotation.set(red ? 0 : Math.sin(tm * 0.0012 + ph) * 0.025, h, red ? 0 : Math.sin(tm * 0.0014 + ph * 2) * 0.03, "YXZ");
}
function kitePos(k, tm, out){ const s = K.reduce ? 0 : 1, t = tm * 0.001, p = k.p;
  out.set(X(p[0] + s * (Math.sin(t * 0.55 + k.ph) * 0.45 + Math.sin(t * 1.3 + k.ph) * 0.12)), p[2] + s * Math.sin(t * 0.9 + k.ph * 1.7) * 0.2, Z(p[1] + s * Math.cos(t * 0.4 + k.ph) * 0.25)); return out; }
function stringTo(n, ax, ay, az, bx, by, bz, sag){ const N = 14; for(let q = 0; q < N; q++){ const u0 = q / N, u1 = (q + 1) / N, o = (n * N + q) * 6;
  W.strPos[o] = ax + (bx - ax) * u0; W.strPos[o + 1] = ay + (by - ay) * u0 - sag * Math.sin(PI * u0); W.strPos[o + 2] = az + (bz - az) * u0;
  W.strPos[o + 3] = ax + (bx - ax) * u1; W.strPos[o + 4] = ay + (by - ay) * u1 - sag * Math.sin(PI * u1); W.strPos[o + 5] = az + (bz - az) * u1; } }
function animate(tm, dt){
  const dk = !!K.R.dark, red = !!K.reduce, t = tm * 0.001;
  if(W.water) W.water.material.uniforms.uT.value = red ? 0 : t;
  // 오리배
  const bs = W.boatSet; if(bs) placeBoat(W.boat, bs[0], bs[1], bs[2], tm, 0); else placeBoat(W.boat, BERTH[0], BERTH[1], BERTH[2], tm, 0);
  W.moored.forEach((m, k) => placeBoat(m, W.mooredAt[k][0], W.mooredAt[k][1], W.mooredAt[k][2], tm, 1.3 + k * 2.1));
  if(bs && !red && tm > (W.wake || 0)){ W.wake = tm + 420; ripple(bs[0] - Math.sin(bs[2]) * 0.6, bs[1] - Math.cos(bs[2]) * 0.6, tm, 0.7); }
  // 오리 가족: 연못을 돌다가 밥 주면 모여듦
  const feeding = tm < W.feed;
  W.ducks.forEach((d, k) => { const lead = k < 2, ph = t * (0.12 + k * 0.01) + (k < 2 ? k * PI : (k - 2) * -0.35 - 0.5);
    let ti = POND.ci + Math.cos(ph) * (POND.ri - 0.55), tj = POND.cj + Math.sin(ph) * (POND.rj - 0.45);
    if(feeding){ ti = POND.ci + (k - 2) * 0.22; tj = POND.cj + POND.rj - 0.42 - (k % 2) * 0.18; }
    if(red){ ti = POND.ci - 0.6 + k * 0.3; tj = POND.cj; }
    const di = ti - d.i, dj = tj - d.j, dd = Math.hypot(di, dj), sp = feeding ? 0.5 : 0.35;
    if(dd > 0.01){ const st = Math.min(dd, sp * dt); d.i += di / dd * st; d.j += dj / dd * st; const hh = Math.atan2(di, dj); d.h += Math.atan2(Math.sin(hh - d.h), Math.cos(hh - d.h)) * Math.min(1, dt * 4); }
    d.m.position.set(X(d.i), hz(WY) - 0.01 + (red ? 0 : Math.sin(tm * 0.004 + k) * 0.006), Z(d.j)); d.m.rotation.y = d.h; });
  // 연 · 꼬리 · 줄
  let tb = 0, sn = 0;
  const putKite = (k, a, ay) => { kitePos(k, tm, v3); const m = k.m; m.position.copy(v3); m.rotation.set(-0.55 + (red ? 0 : Math.sin(t * 1.1 + k.ph) * 0.12), 0.25, red ? 0 : Math.sin(t * 0.9 + k.ph) * 0.3);
    m.updateMatrix(); v4.set(0, k.t === "bang" ? -0.33 : -0.16, 0).applyMatrix4(m.matrix);
    stringTo(sn++, X(a[0]), ay, Z(a[1]), v4.x, v4.y, v4.z, 0.32);
    if(k.t !== "bang") for(let q = 0; q < 9; q++){ const f = q + 1, wv = red ? 0 : Math.sin(t * 4.2 - q * 0.8 + k.ph) * 0.05 * Math.sqrt(f);
      e3.set(0, 0, wv * 4); qn.setFromEuler(e3); m4.compose(sc3.set(v4.x + wv, v4.y - 0.12 * f, v4.z - 0.04 * f), qn, v3.set(0.15, 0.06, 0.016)); W.tails.setMatrixAt(tb++, m4); } };
  W.kites.forEach(k => putKite(k, k.a, hz(10)));
  { const y = W.yk; if(y.t > 0){ y.m.visible = true; const u = Math.min(1, y.t), e = 1 - (1 - u) ** 3, hx = X(y.a[0]), hy = 0.62, hz0 = Z(y.a[1]);
      const k = {p:[y.a[0] + (y.p[0] - y.a[0]) * e, y.a[1] + (y.p[1] - y.a[1]) * e, hy + 0.25 + (y.p[2] - hy - 0.25) * e], ph:0.7, t:"gaori", m:y.m}; putKite(k, y.a, hy); }
    else { y.m.visible = false; stringTo(sn++, 0, -9, 0, 0, -9, 0, 0); } }
  while(tb < W.tailN) W.tails.setMatrixAt(tb++, ZERO); W.tails.instanceMatrix.needsUpdate = true; if(W.tails.instanceColor) W.tails.instanceColor.needsUpdate = true;
  // 낚시찌 · 낚싯줄
  { const bi = 9.78, bj = 0.5, dip = tm < W.bite ? Math.max(0, Math.sin((W.bite - tm) * 0.012)) * 0.06 : 0, by = hz(WY) + 0.02 + (red ? 0 : Math.sin(tm * 0.0021) * 0.008) - dip;
    W.bob.position.set(X(bi), by, Z(bj)); const r = W.rodTip; stringTo(sn++, X(r[0]), hz(r[2]), Z(r[1]), X(bi), by + 0.12, Z(bj), 0.05);
    if(!red && tm > (W.nextBob || 0)){ W.nextBob = tm + (dip > 0 ? 500 : 3800); ripple(bi, bj, tm, 0.35); } }
  W.str.geometry.attributes.position.needsUpdate = true;
  // 종 · 종줄
  { const rg = W.ring > tm ? (W.ring - tm) / 3200 : 0, sw = red ? 0 : Math.sin(tm * 0.0075) * 0.55 * rg; W.bell.rotation.x = sw; W.rope.position.y = hz(W.bellTop - 6) - (red ? 0 : Math.abs(Math.sin(tm * 0.0075)) * 0.12 * rg); }
  // 돛단배
  { const u = ((t * 0.018) % 1), i = EXT[0] - 1 + u * (EXT[2] - EXT[0] + 2); W.sail.position.set(X(i), hz(WY) + (red ? 0 : Math.sin(t * 1.3) * 0.01), Z(0.95)); W.sail.rotation.set(0, 0, red ? 0 : Math.sin(t * 0.9) * 0.04); W.sail.visible = !red || u < 2; }
  // 물수제비 · 물고기 퐁
  let f = 0;
  if(W.skip){ const s = W.skip, el = (tm - s.t0) / 1000, hops = [0, 0.42, 0.78, 1.08, 1.32, 1.52], P = [[13.2, 5.75], [13.35, 4.6], [13.5, 3.7], [13.62, 3.0], [13.72, 2.45], [13.8, 2.05]];
    if(el > 1.9){ W.skip = null; } else { let q = hops.findIndex(h => h > el) - 1; if(q < 0) q = hops.length - 1; const q1 = Math.min(P.length - 1, q + 1), u = q1 === q ? 1 : (el - hops[q]) / (hops[q1] - hops[q]);
      if(!s.done[q] && q > 0){ s.done[q] = 1; ripple(P[q][0], P[q][1], tm, 0.55); }
      const i = P[q][0] + (P[q1][0] - P[q][0]) * u, j = P[q][1] + (P[q1][1] - P[q][1]) * u, hgt = Math.sin(u * PI) * (0.35 - q * 0.05);
      fxSet(f++, X(i), hz(WY) + 0.04 + hgt, Z(j), el < 1.55 ? 0.045 : 0, "#9A9488"); } }
  if(!red && tm > W.nextJump){ W.nextJump = tm + 4000 + rnd(tm) * 5000; ripple(2 + rnd(tm * 3) * 30, 1.2 + rnd(tm * 7) * 3.6, tm, 0.6); }
  // 라면 김
  for(let k = 0; k < 6; k++){ const ph = (tm * 0.00045 + k / 6) % 1, r = (0.035 + 0.07 * ph) * (1 - ph * ph); fxSet(f++, X(22.35 + (red ? 0 : Math.sin(ph * 6 + k) * 0.05)), hz(54 + 26 * ph), Z(8.9), red ? 0 : r, "#FFFFFF"); }
  while(f < W.fxN) fxSet(f++, 0, 0, 0, 0);
  W.fm.instanceMatrix.needsUpdate = true; if(W.fm.instanceColor) W.fm.instanceColor.needsUpdate = true;
  // 물결 고리
  for(let k = 0; k < W.rN; k++){ const r = W.rings[k]; if(!r){ W.rm.setMatrixAt(k, ZERO); continue; } const v = (tm - r.t0) / 1400; if(v >= 1 || v < 0){ W.rm.setMatrixAt(k, ZERO); continue; }
    const s = (0.08 + v * 0.55) * r.big; m4.compose(v3.set(X(r.i), hz(WY) + 0.012, Z(r.j)), qn.identity(), sc3.set(s, 1, s)); W.rm.setMatrixAt(k, m4); W.rm.setColorAt(k, col.setScalar((1 - v) * (dk ? 0.45 : 0.75))); }
  W.rm.instanceMatrix.needsUpdate = true; if(W.rm.instanceColor) W.rm.instanceColor.needsUpdate = true;
  // 반딧불이
  W.flies.forEach((fl, k) => { const a = t * fl.sp + fl.ph; fl.o.p.set(X(fl.ci + Math.cos(a) * fl.r + Math.sin(a * 2.3) * 0.3), hz(fl.z0 + Math.sin(a * 1.7) * 8), Z(fl.cj + Math.sin(a * 0.8) * fl.r * 0.7)); });
  const cam = K.R.camera;
  W.glows.forEach((g, k) => { const a = g.a(tm, dk); if(!(a > 0)){ W.gm.setMatrixAt(k, ZERO); return; }
    col.copy(g.c); m4.compose(g.p, cam.quaternion, sc3.set(g.s, g.s, 1)); W.gm.setMatrixAt(k, m4); W.gm.setColorAt(k, col.multiplyScalar(Math.min(1, a))); });
  W.gm.instanceMatrix.needsUpdate = true; if(W.gm.instanceColor) W.gm.instanceColor.needsUpdate = true;
}

/* ---------- 못 가는 곳 (물) : [i0, j0, i1, j1] → 엔진 상자 [x0, z0, x1, z1, y0, y1] ---------- */
const WATER_BLOCK = [[EXT[0], EXT[1], EXT[2], PIER.tj0], [EXT[0], PIER.tj0, PIER.ti0, PIER.j0], [PIER.ti1, PIER.tj0, EXT[2], PIER.j0],
  [EXT[0], PIER.j0, PIER.i0, DOCK.j0], [PIER.i1, PIER.j0, EXT[2], DOCK.j0], [EXT[0], DOCK.j0, PIER.i0, RJ], [PIER.i1, DOCK.j0, DOCK.i0, RJ], [DOCK.i1, DOCK.j0, EXT[2], RJ],
  [15.6, RJ - 0.01, 19.4, BR.j0], [15.5, BR.j1, 19.5, 9.65], [15.75, 9.65, 19.25, 10.02], [16.3, 10.02, 18.7, 10.28]];

/* ---------- 유나 모드에 넘길 것 (yuna_game.js 형식: h = 보는 쪽 (0 = +j, PI/2 = +i, PI = −j), H = 앉는 면 높이) ---------- */
const H = px => px / 31.1;
const SEATS = [
  ...PEWJ.flatMap(j => [{a:[PEWL[0] + 0.3, j + 0.22], b:[PEWL[1] - 0.3, j + 0.22], h:PI, H:H(12), k:"pew"}, {a:[PEWR[0] + 0.3, j + 0.22], b:[PEWR[1] - 0.3, j + 0.22], h:PI, H:H(12), k:"pew"}]),
  {a:[2.55, 19.15], b:[2.55, 20.05], h:PI / 2, H:H(13.8), k:"bench"},
  {a:[11.0, 9.0], b:[12.2, 9.0], h:PI, H:H(13.8), k:"bench"}, {a:[24.4, 9.05], b:[25.3, 9.05], h:PI, H:H(13.8), k:"bench"}, {a:[31.6, 7.95], h:PI, H:H(13.8), k:"bench"},
  {a:[13.45, 10.7], b:[14.0, 10.7], h:PI, H:H(13.8), k:"bench"}, {a:[20.95, 13.3], b:[20.95, 14.2], h:PI / 2, H:H(13.8), k:"bench"},
  {a:[13.35, 15.95], h:PI / 2, H:H(2.8), k:"picnic"}, {a:[10.45, 15.2], h:PI / 2, H:H(1), k:"picnic"},
  {a:[24.0, 9.75], h:PI / 2, H:H(12.6), k:"ramen"}, {a:[25.2, 9.75], h:-PI / 2, H:H(12.6), k:"ramen"},
  {a:[2.65, 10.88], h:PI, H:H(15.4), k:"piano"}];
export const RIVER = {
  name:"강변 공원·동네 교회",
  gate:[17, 23.3], spawnGate:[17, 22.5, PI],
  side:[33.3, 12], spawnSide:[32.5, 12, -PI / 2],
  seats:SEATS,
  sitLines:{
    pew:["하나님 감사합니다 🙏", "오늘도 우리 가족 지켜 주세요 🙏", "찬양 시간이 제일 좋아 🎵", "기도할 땐 눈 꼭 감기 🙏", "목사님 말씀 잘 들어야지 📖", "주일학교 친구들 보고 싶다 😊", "아빠 촬영 잘 되게 해 주세요 🎬"],
    bench:["강바람 시원하다 🍃", "물결이 반짝반짝 ✨", "오리배 타고 싶다 🦢", "여기서 노을 보면 예쁘겠다 🌅"],
    picnic:["김밥 하나만 더! 🍙", "돗자리 소풍 최고 🧺", "연 날리는 거 구경해야지 🪁", "딸기 진짜 달다 🍓"],
    ramen:["강변에서 먹는 라면은 꿀맛 🍜", "후~ 후~ 뜨거워 🥵"], piano:["도레미파솔~ 🎹", "주일에 반주해 보고 싶다 🎵"]},
  use:[
    {at:[C.ci, 12.0], k:"pray", h:PI, r:0.8},              // 강단 앞 무릎 방석
    {at:[TW.ci, 17.65], k:"bell", h:PI, r:0.85},           // 종탑 아래 종줄
    {at:[BERTH[0], 4.85], k:"boat", h:PI, r:1.0},          // 선착장 (탈 오리배 앞)
    {at:[11.4, 2.3], k:"fish", h:PI, r:0.9},               // 낚시 데크 끝 (할아버지 옆)
    {at:KITE_AT, k:"kite", h:PI, r:1.2},                   // 연날리기 밭
    {at:[12.75, 14.15], k:"picnic", h:-PI / 2, r:0.9},     // 돗자리 바구니
    {at:[30.2, 10.45], k:"rent", h:PI, r:0.9},             // 자전거 대여소 창구
    {at:[22.8, 9.95], k:"ramen", h:PI, r:0.9},             // 라면 카트
    {at:[17.5, 10.72], k:"duck", h:PI, r:0.9},             // 오리 연못 밥 주기
    {at:[13.2, 6.32], k:"stones", h:PI, r:0.9},            // 물수제비 자갈밭
    {at:[2.65, 10.95], k:"piano", h:PI, r:0.7}],           // 교회 피아노 (덤)
  npc:{pastor:[6.2, 18.8, -0.35], fisher:[9.25, 2.35, PI], boatman:[27.3, 4.95, -PI / 2], picnic:[10.7, 14.55, 0.9]},
  /* 오리배: dock = 타는 자리(유나가 선 곳), path(u) u 0~1 한 바퀴 (0·1 = 선착장, 고르게 감), set(i,j,h) = 탈 오리배 옮김, set(null) = 제자리 */
  boat:{dock:[BERTH[0], 4.85, PI], berth:BERTH, seatH:0.41,
    path(u){ if(!W || !W.boatCurve){ return [BERTH[0], BERTH[1], BERTH[2]]; } const uu = ((u % 1) + 1) % 1, p = W.boatCurve.getPointAt(uu), tg = W.boatCurve.getTangentAt(uu); return [p.x, p.z, Math.atan2(tg.x, tg.z)]; },
    set(i, j, h){ if(!W) return; W.boatSet = i == null ? null : [i, j, h]; },
    /* 직접 저을 때 갈 수 있는 물 (배 가운데 기준, 2026-11-26): 건너편 둑 · 강가 돌 둑 · 낚시 데크 · 선착장 · 묶인 배는 못 감 */
    water(i, j){ if(i < 0.4 || i > EXT[2] - 0.7 || j < 1.05 || j > RJ - 0.55) return false;
      if(i > DOCK.i0 - 0.55 && i < DOCK.i1 + 0.55 && j > DOCK.j0 - 0.45) return false;
      if(i > PIER.i0 - 0.55 && i < PIER.i1 + 0.55 && j > PIER.j0 - 0.5) return false;
      if(i > PIER.ti0 - 0.55 && i < PIER.ti1 + 0.55 && j > PIER.tj0 - 0.5) return false;
      for(const m of (W && W.mooredAt) || []) if(Math.hypot(i - m[0], j - m[1]) < 1.0) return false;
      return true; }},
  /* 연: set(t) t 0 = 안 보임, 0~1 = 유나 손에서 하늘로 올라감, 1 넘으면 계속 날림 */
  kite:{at:KITE_AT, set(t){ if(W && W.yk) W.yk.t = +t || 0; }},
  bell:{ring(ms = 3200){ if(W && K) W.ring = K.clock() + ms; }},   // 종 흔들기 (소리는 게임 쪽)
  duck:{feed(ms = 9000){ if(W && K) W.feed = K.clock() + ms; }},   // 오리들이 밥 주는 쪽으로 모여듦
  stones:{skip(){ if(W && K) W.skip = {t0:K.clock(), done:{}}; }}, // 물수제비 (돌이 물 위를 다섯 번 통통)
  fish:{bite(ms = 2200){ if(W && K) W.bite = K.clock() + ms; }},   // 할아버지 찌가 쏙쏙
};

/* ---------- 층 정의 ---------- */
const def = {
  id:"river",
  zones:{
    rv_river:{name:"강", color:"#A9CBEA", rect:[EXT[0], 0, EXT[2], RJ], label:[17.0, 0, "top"]},
    rv_church:{name:"동네 교회", color:"#C8B4D0", rect:[0.3, 9.6, 9.6, 20.4], label:[4.9, 20.4, "bottom"]},
    rv_path:{name:"자전거길", color:"#E8B5C8", rect:[EXT[0], 6.2, EXT[2], WK1], label:[EXT[2], 7.4, "side"]},
    rv_park:{name:"강변 공원", color:"#72C4AE", rect:[9.6, WK1, EXT[2], 22.4], label:[22.0, 22.4, "bottom"]}},
  outline:[[EXT[0], EXT[1]], [EXT[2], EXT[1]], [EXT[2], EXT[3]], [EXT[0], EXT[3]]],
  walk:[[EXT[0], EXT[1]], [EXT[2], EXT[1]], [EXT[2], 22.38], [18.25, 22.38], [18.25, EXT[3]], [15.75, EXT[3]], [15.75, 22.38], [EXT[0], 22.38]],   // 산울타리 안 + 입구 (2026-11-26)
  ext:EXT,
  top:3.8,
  allPts:V => [V(EXT[0], 0, EXT[1]), V(EXT[2], 0, EXT[1]), V(EXT[2], 0, EXT[3]), V(EXT[0], 0, EXT[3]), V(EXT[0], 2.2, EXT[1]), V(EXT[2], 2.2, EXT[1]), V(TW.ci, 4.2, TW.cj), V(27, 3.6, 9.4)],
  lamps:[[C.ci, 13.6, 2.3], [12.9, 8.8, 1.9], [22.9, 9.6, 1.9], [17.0, 18.4, 1.9], [30.4, 10.6, 1.9]],
  glow:{color:0xFFC8A0, at:[C.ci, 11.0, 1.7]},
  eggs:[],
  people:[],
  paintFloor(c, dark, KIT){ if(!K && KIT) K = KIT; paintRiver(c, dark); },
  build(KIT){
    K = KIT; LG.length = 0;
    W = {recolor:[], glows:[], extraBoxes:[], torus:myGeo(new THREE.TorusGeometry(0.19, 0.028, 8, 22))};
    def.eggs = [
      egg("rv_cross", [TW.ci, TW.cj, 236], ["✝️", "✨"], ["종탑 십자가가 반짝반짝 ✨", "밤에도 은은하게 불이 켜져 있어 🌙"]),
      egg("rv_glass", [7.0, C.j0, 70], ["🌈", "⛪"], ["스테인드글라스 알록달록 🌈", "해가 들어오면 바닥이 무지개색이 돼"]),
      egg("rv_bible", [C.ci, 10.5, 42], ["📖", "🙏"], ["목사님 성경책이 펼쳐져 있어 📖", "오늘 말씀은 '서로 사랑하라' 💛"]),
      egg("rv_flower", [6.45, 10.75, 44], ["💐", "🌷"], ["강단 꽃꽂이는 권사님 솜씨 💐"]),
      egg("rv_swan", [23.0, 3.9, 30], ["🦆", "💛"], ["노란 오리배도 있다! 🦆", "오리배는 발로 페달을 굴려요"]),
      egg("rv_pond", [POND.ci, POND.cj, 10], ["🦆", "🐥"], ["엄마 오리 따라 아기 오리 쫑쫑 🐥", "연잎 위에 분홍 연꽃 🪷"]),
      egg("rv_kite", [27.2, 9.4, 135], ["🪁", "🌬️"], ["방패연이 제일 높이 날아 🪁", "가운데 구멍이 있어야 바람이 빠진대"]),
      egg("rv_bucket", [9.75, 2.45, 18], ["🐟", "🎣"], ["할아버지 양동이에 붕어 두 마리 🐟", "다 놓아주신대 😊"]),
      egg("rv_sail", [17.0, 0.9, 20], ["⛵", "🌊"], ["강 위에 돛단배가 지나가요 ⛵"]),
      egg("rv_city", [26.0, EXT[1] + 0.1, 40], ["🏙️", "🌇"], ["강 건너 동네도 예쁘다 🌇", "밤엔 창문 불빛이 별 같아 ✨"]),
      egg("rv_cherry", [18.85, 15.6, 64], ["🌸", "🍃"], ["벚꽃잎이 눈처럼 내려 🌸"]),
      egg("rv_bike", [32.75, 9.05, 24], ["🚲", "🔔"], ["따릉따릉~ 핑크 자전거 내 거 할래 🚲"]),
      egg("rv_shoes", [10.8, 15.74, 6], ["👟", "🧺"], ["돗자리엔 신발 벗고 올라가요 👟"])];
    buildBanks(); buildBridge(); buildPond(); buildDocks(); buildBoatBooth();
    buildChurch(); buildTower(); buildGarden(); buildPicnic(); buildKiteField(); buildCart(); buildRental(); buildGates();
    CHERRY.forEach(([i, j, s]) => cherry(i, j, s)); WILLOW.forEach(([i, j, s]) => willow(i, j, s));
    [[11.6, 9.0, "-j"], [24.85, 9.05, "-j"], [31.6, 7.95, "-j"]].forEach(([i, j, f]) => { if(i !== 24.85) bench(i, j, f, i === 31.6 ? 1.0 : 1.5); });
    bench(13.72, 10.7, "-j", 0.95); bench(20.95, 13.75, "+i", 1.3);
    [[10.0, 12.2], [14.6, 19.4], [19.6, 19.0], [25.4, 21.5], [31.8, 21.3], [33.9, 10.6], [26.0, 13.0], [8.2, 8.95]].forEach(([i, j], k) => flowerPot(i, j, RB[k % 6], 0.85, [PINK, LILAC, WHITE][k % 3]));
    for(let k = 0; k < 18; k++){ const i = 9.9 + k * 0.6; if(i > 15.9 && i < 18.2) continue; bush(i, 21.95 + (k % 2) * 0.1, 0.55, k % 2 ? "plant" : D("#8CC478", "#34502E")); }
    WATER_BLOCK.forEach(([i0, j0, i1, j1]) => W.extraBoxes.push([X(i0), Z(j0), X(i1), Z(j1), 0.0, 0.7]));
    buildWater(); buildBoats(); buildDucks(); buildKites(); buildBell(); buildSail(); buildFx();
  },
  init(KIT){ LG.forEach(g => g.dispose()); LG.length = 0; },
  tick(KIT, now, t, dt){
    if(W.extraBoxes.length && KIT.R && KIT.R.boxes && !W.boxDone){ W.boxDone = true;   // 물 막기 상자를 엔진 목록에 더함
      KIT.R.boxes = Float32Array.from([...KIT.R.boxes, ...W.extraBoxes.flat()]); KIT.R.pg = null; }
    animate(KIT.clock ? KIT.clock() : now, dt); },
  theme(KIT, dark){ if(!W) return;
    W.recolor.forEach(m => { const u = m.geometry.userData, a = m.geometry.attributes.color; if(u && u.L && a){ a.array.set(dark ? u.D : u.L); a.needsUpdate = true; } });
    if(W.water) W.water.material.uniforms.uDark.value = dark ? 1 : 0;
    if(W.str) W.str.material.color.set(dark ? 0xCFC6B8 : 0x6E675C); },
};
export default def;
