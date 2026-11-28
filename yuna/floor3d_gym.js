/* 크레용 스포츠센터 · 수영장 3D (2026-11-28 감독님 "수영장 따로 만들라고 올림픽 규격으로. 체육관을 만들란 소리잖아") — tower3d_floor.js 층 정의, 유나 모드로만 감
   강변 오른쪽 "스포츠센터 →" 문으로 들어오면 여기 앞쪽 왼문 (0.35, 28.6). 오른쪽 문 (49.85, 28.6) 으로 실내 테니스장(floor3d_court.js)
   칸 i 0~50 · j 0~32, 1칸 ≈ 1.28 m (유나 키 1칸)
   수영장은 국제 경기 규격: 50 m × 25 m · 10레인 × 2.5 m → 39.06 × 19.53칸, 레인 폭 1.953칸
   - 레인은 i 방향으로 길게 (카메라가 옆에서 보는 TV 중계처럼). 출발대는 왼쪽 끝 (i 작은 쪽), 터치판은 양쪽 벽
   - 레인 줄: 1·8 초록, 2·3·6·7 파랑, 4·5 노랑, 양 끝 5 m는 빨강 · 배영 깃발 줄은 양 끝 5 m
   - 뒤: 3단 관중석 · 큰 기록판 (게임이 GYM.board()로 고침) · 높은 창
   - 앞: 안내 데스크 · 탈의실 · 벤치 · 감시탑
   유나 막기: 벽은 W.extraBoxes. 물은 게임이 water 로 넘김 (GYM.pool) */
import * as THREE from "three";

const PI = Math.PI;
const rnd = k => { const v = Math.sin(k * 12.9898 + 3.71) * 43758.5453; return v - Math.floor(v); };
const EXT = [-0.6, -0.6, 50.6, 32.6];
const LW = 2.5 / 1.28;                                                     // 레인 폭 (칸)
const P = {i0:5.6, i1:5.6 + 50 / 1.28, j0:5.2, j1:5.2 + 25 / 1.28};       // 물 (안쪽)
const CO = 0.26, ZC = 6.2;                                                 // 가장자리 돌 폭 · 높이(px) = 물 높이
const SURF = ZC / 31.1;
const laneJ = k => P.j0 + (k + 0.5) * LW;                                  // 레인 0~9 가운데
const STAND = {i0:6.0, i1:44.2, j0:0.25, j1:3.75, n:3};                   // 관중석
const DOOR_L = [27.6, 29.6], DOOR_R = [27.6, 29.6];
const GATE = [0.35, 28.6], SPAWN = [1.4, 28.6, PI / 2], GATE_R = [49.85, 28.6], SPAWN_R = [48.8, 28.6, -PI / 2];
const DESK = {i0:1.2, i1:5.6, j0:30.6, j1:31.7};
const BOOTH = {i0:8.4, i1:10.6, j0:30.0, j1:32.1};
const START = [3.0, laneJ(4)];                                             // 시합 시작 자리 (출발대 옆)
const RB = ["#F4A7B9", "#F9C99B", "#F6E39A", "#A8DCC8", "#A9CBEA", "#C8B4D0"];

let K = null, W = null;
const X = i => K.X(i), Z = j => K.Z(j), hz = p => K.hz(p);
const H = px => px / 31.1;
const D = (l, d) => [l, d];
const B = (i, j, w, d, h, col, z0 = 0, o = {}) => K.B(i, j, w, d, h, col, z0, o);
const WHITE = D("#FFFFFF", "#8A847C"), CREAM = D("#FFF8EE", "#4C4640"), TEAL = D("#3A8A78", "#2A5E54"), POST = D("#2E4F44", "#5A7068"),
  WALL = D("#EEF2F3", "#3A3F42"), WALL2 = D("#DCE4E7", "#30363A"), STONE = D("#F4F1EA", "#55524C"), WOOD = D("#D9B98F", "#6B5440"),
  PINK = D("#E8B5C8", "#7A5866"), AMBER = D("#E8A04A", "#9A6A2E"), NAVY = D("#24406A", "#1A2C48"), INK = "#2A2A28";
const ball = (i, j, zp, r, col, cls = "m", seg = 12) => K.sm(K.sph(r, seg, Math.max(6, seg * 0.75 | 0)), col, X(i), hz(zp), Z(j), null, cls);
const disc = (i, j, r, zp, hp, col, cls = "m", seg = 24) => { const Hh = Math.max(0.006, hz(hp)); return K.sm(K.cyl(r, r, Hh, seg), col, X(i), hz(zp) + Hh / 2, Z(j), null, cls); };
const egg = (id, at, emo, lines) => ({id, at, emo, lines});
const gl = (i, j, zp, rpx, col, a) => { const o = {p:new THREE.Vector3(X(i), hz(zp), Z(j)), s:rpx / 31.3 * 2, c:new THREE.Color(col), a}; W.glows.push(o); return o; };
function rod(a, b, r, col, cls = "s", seg = 8){
  const A = new THREE.Vector3(X(a[0]), hz(a[2]), Z(a[1])), C2 = new THREE.Vector3(X(b[0]), hz(b[2]), Z(b[1])), len = A.distanceTo(C2); if(len < 1e-4) return;
  const o = K.sm(K.cyl(r, r, len, seg), col, (A.x + C2.x) / 2, (A.y + C2.y) / 2, (A.z + C2.z) / 2, null, cls); o.lookAt(C2); o.rotateX(PI / 2); return o;
}
const block = (i0, j0, i1, j1, zt) => W.extraBoxes.push([X(i0), Z(j0), X(i1), Z(j1), 0, hz(zt)]);

/* ---------- 바닥 그림 ---------- */
function paintGym(c, dark){
  const v = (l, d) => dark ? d : l, FS = K.FS;
  const rect = (i0, j0, i1, j1, col) => { c.fillStyle = col; c.fillRect(i0, j0, i1 - i0, j1 - j0); };
  const line = (i0, j0, i1, j1, col, w = 0.02) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(i0, j0); c.lineTo(i1, j1); c.stroke(); };
  const text = (t, i, j, size, col, w = 800, fam = K.FONT, rot = 0) => { c.save(); c.translate(i, j); c.rotate(rot); c.scale(1 / FS, 1 / FS); c.font = `${w} ${size / 31.3 * FS}px ${fam}`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = col; c.fillText(t, 0, 0); c.restore(); };
  // 바닥 타일 (미끄럼 방지 연회색)
  const tile = v("#E6ECEE", "#3E474B"), grout = v("rgba(120,140,150,.22)", "rgba(0,0,0,.35)");
  rect(EXT[0], EXT[1], EXT[2], EXT[3], tile);
  for(let i = Math.ceil(EXT[0] * 2) / 2; i < EXT[2]; i += 0.5) line(i, EXT[1], i, EXT[3], grout, 0.012);
  for(let j = Math.ceil(EXT[1] * 2) / 2; j < EXT[3]; j += 0.5) line(EXT[0], j, EXT[2], j, grout, 0.012);
  // 수영장 바닥 (물 아래로 비침): 파랑 + 레인 가운데 검은 줄(T)
  rect(P.i0, P.j0, P.i1, P.j1, v("#47A6D8", "#1D4A66"));
  c.globalAlpha = dark ? 0.12 : 0.18; for(let k = 0; k < 900; k++){ c.fillStyle = "#FFFFFF"; c.fillRect(P.i0 + rnd(k) * (P.i1 - P.i0), P.j0 + rnd(k + 33) * (P.j1 - P.j0), 0.03, 0.03); } c.globalAlpha = 1;
  const lc = v("#1E3A5F", "#0E1C30"), m2 = 2 / 1.28, t1 = 1 / 1.28;
  for(let k = 0; k < 10; k++){ const j = laneJ(k);
    rect(P.i0 + m2, j - 0.1, P.i1 - m2, j + 0.1, lc);
    [P.i0 + m2, P.i1 - m2].forEach(i => rect(i - 0.1, j - t1 / 2, i + 0.1, j + t1 / 2, lc));
    [P.i0, P.i1 - 0.12].forEach(i => rect(i, j - 0.1, i + 0.12, j + 0.1, lc)); }   // 벽 과녁
  rect(P.i0 + 25 / 1.28 - 0.05, P.j0, P.i0 + 25 / 1.28 + 0.05, P.j1, v("rgba(30,58,95,.45)", "rgba(10,20,40,.5)"));   // 25 m 표시
  // 가장자리 돌 (위에서 보이는 테)
  rect(P.i0 - CO, P.j0 - CO, P.i1 + CO, P.j0, v("#FAF8F2", "#5A5752")); rect(P.i0 - CO, P.j1, P.i1 + CO, P.j1 + CO, v("#FAF8F2", "#5A5752"));
  rect(P.i0 - CO, P.j0, P.i0, P.j1, v("#FAF8F2", "#5A5752")); rect(P.i1, P.j0, P.i1 + CO, P.j1, v("#FAF8F2", "#5A5752"));
  // 수심 · 거리 글씨
  [[P.i0 + 2.2, "수심 2.0m"], [P.i1 - 2.2, "수심 2.0m"]].forEach(([i, t]) => { text(t, i, P.j1 + 0.62, 3.2, v("#24406A", "#9FC3E8")); text(t, i, P.j0 - 0.6, 3.2, v("#24406A", "#9FC3E8")); });
  text("25 m", P.i0 + 25 / 1.28, P.j1 + 0.62, 3.2, v("#C0392B", "#F2A49A"));
  text("50 m 국제 규격 · 10레인", (P.i0 + P.i1) / 2, P.j1 + 1.35, 4.2, v("rgba(36,64,106,.55)", "rgba(160,195,232,.35)"));
  // 레인 번호 (출발대 앞 바닥)
  for(let k = 0; k < 10; k++) text(String(k), P.i0 - 0.95, laneJ(k), 4.2, v("#24406A", "#BFD8F2"));
  // 앞마당 (안내 데스크 · 입구)
  rect(EXT[0], 26.2, EXT[2], EXT[3], v("#EFE8DC", "#3A3631"));
  for(let i = EXT[0] + 0.4; i < EXT[2]; i += 0.8) line(i, 26.2, i, EXT[3], v("rgba(150,120,80,.15)", "rgba(0,0,0,.3)"), 0.014);
  rect(EXT[0], 26.15, EXT[2], 26.25, v("#C9D3D6", "#4A5052"));
  text("CREYONG SPORTS CENTER", 25.0, 29.4, 11, v("rgba(58,138,120,.42)", "rgba(114,196,174,.2)"));
  text("크레용 스포츠센터", 25.0, 30.85, 6.5, v("rgba(58,138,120,.42)", "rgba(114,196,174,.2)"));
  text("← 강변", 1.9, 27.35, 3.8, v("rgba(90,80,60,.5)", "rgba(220,210,190,.3)"));
  text("테니스장 →", 47.9, 27.35, 3.8, v("rgba(90,80,60,.5)", "rgba(220,210,190,.3)"));
  // 관중석 아래
  rect(STAND.i0 - 0.1, STAND.j0, STAND.i1 + 0.1, STAND.j1 + 0.05, v("#D7DDE0", "#3A4044"));
  if(dark){ for(let i = 8; i < 44; i += 8){ const g = c.createRadialGradient(i, 15, 0, i, 15, 7); g.addColorStop(0, "rgba(200,235,255,.16)"); g.addColorStop(1, "rgba(200,235,255,0)"); c.fillStyle = g; c.beginPath(); c.arc(i, 15, 7, 0, 7); c.fill(); } }
}

/* ---------- 물 · 레인 줄 · 배영 깃발 ---------- */
function buildWater(){
  // 물 표면: 반투명 + 물결 무늬 (tick 에서 흐름)
  const cv = document.createElement("canvas"); cv.width = cv.height = 256; const c = cv.getContext("2d");
  c.fillStyle = "#7FD3F5"; c.fillRect(0, 0, 256, 256); c.strokeStyle = "rgba(255,255,255,.55)"; c.lineWidth = 2.2;
  for(let k = 0; k < 46; k++){ const x = rnd(k) * 256, y = rnd(k + 7) * 256, r = 10 + rnd(k + 3) * 26; c.beginPath(); c.ellipse(x, y, r, r * 0.42, rnd(k + 5) * PI, 0, PI * (0.6 + rnd(k + 9) * 0.8)); c.stroke(); }
  const tex = new THREE.CanvasTexture(cv); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set((P.i1 - P.i0) / 3.2, (P.j1 - P.j0) / 3.2); tex.colorSpace = THREE.SRGBColorSpace;
  const w = X(P.i1) - X(P.i0), d = Z(P.j1) - Z(P.j0);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({map:tex, transparent:true, opacity:0.62, roughness:0.08, metalness:0.05, emissive:0x1C6A90, emissiveIntensity:0.18, depthWrite:false}));
  m.rotation.x = -PI / 2; m.position.set((X(P.i0) + X(P.i1)) / 2, SURF - 0.01, (Z(P.j0) + Z(P.j1)) / 2); m.renderOrder = 2; K.R.scene.add(m); W.water = {m, tex};
  // 가장자리 돌 (물 높이까지 올라온 턱) · 안쪽 파란 벽
  [[P.i0 - CO, P.j0 - CO, P.i1 - P.i0 + CO * 2, CO], [P.i0 - CO, P.j1, P.i1 - P.i0 + CO * 2, CO], [P.i0 - CO, P.j0, CO, P.j1 - P.j0], [P.i1, P.j0, CO, P.j1 - P.j0]].forEach(([i, j, a, b]) => B(i, j, a, b, ZC + 0.6, STONE, 0, {r:0.01}));
  // 터치판 (양 끝, 레인마다 노랑 테)
  for(let k = 0; k < 10; k++){ const j = laneJ(k); [P.i0 + 0.01, P.i1 - 0.05].forEach(i => B(i, j - LW / 2 + 0.12, 0.04, LW - 0.24, 4.4, D("#F2C94C", "#8A7A3A"), 1.6, {r:0})); }
}
function ropeTex(col){
  const cv = document.createElement("canvas"); cv.width = 8; cv.height = 1024; const c = cv.getContext("2d"), n = 120, red = Math.round(n * 5 / 50);   // 원기둥 길이 방향 = 텍스처 세로
  for(let k = 0; k < n; k++){ c.fillStyle = k < red || k >= n - red ? (k % 2 ? "#FFFFFF" : "#E23B3B") : (k % 2 ? "#FFFFFF" : col); c.fillRect(0, k * 1024 / n, 8, 1024 / n + 0.5); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function buildRopes(){
  const len = X(P.i1) - X(P.i0), T = {g:ropeTex("#2FA35A"), b:ropeTex("#2E6FD1"), y:ropeTex("#F2C230")};
  for(let k = 1; k <= 9; k++){   // 레인 k-1 과 k 사이
    const t = k === 1 || k === 9 ? T.g : k === 2 || k === 3 || k === 7 || k === 8 ? T.b : T.y;
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, len, 10, 1, true), new THREE.MeshStandardMaterial({map:t, roughness:0.45}));
    m.rotation.z = PI / 2; m.position.set((X(P.i0) + X(P.i1)) / 2, SURF + 0.015, Z(P.j0 + k * LW)); m.castShadow = true; K.R.scene.add(m); }
  // 배영 깃발 줄 (양 끝 5 m)
  [P.i0 + 5 / 1.28, P.i1 - 5 / 1.28].forEach(i => {
    [P.j0 - CO - 0.15, P.j1 + CO + 0.15].forEach(j => { K.sm(K.cyl(0.03, 0.035, hz(62), 8), POST, X(i), hz(31), Z(j), null, "s"); });
    rod([i, P.j0 - CO - 0.15, 60], [i, P.j1 + CO + 0.15, 60], 0.008, D("#FFFFFF", "#CFCAC2"));
    const n = 30; for(let q = 0; q < n; q++){ const j = P.j0 + (q + 0.5) * (P.j1 - P.j0) / n, c = ["#E23B3B", "#FFFFFF", "#2E6FD1"][q % 3];
      const tri = new THREE.Mesh(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, -0.14), new THREE.Vector3(0, 0, 0.14), new THREE.Vector3(0, -0.24, 0)]), new THREE.MeshBasicMaterial({color:c, side:THREE.DoubleSide, toneMapped:false}));
      tri.position.set(X(i), hz(60), Z(j)); K.R.scene.add(tri); } });
}
/* ---------- 출발대 · 감시탑 · 관중석 · 기록판 ---------- */
function buildBlocks(){
  for(let k = 0; k < 10; k++){ const j = laneJ(k), i = P.i0 - CO - 0.52;
    B(i, j - 0.27, 0.5, 0.54, 20, D("#F4F4F2", "#6A6862"), 0, {r:0.04});
    B(i - 0.02, j - 0.29, 0.54, 0.58, 3, D(k === 4 ? "#E8A04A" : "#2E6FD1", k === 4 ? "#9A6A2E" : "#24406A"), 20, {r:0.03});   // 미끄럼 방지 판 (4번 레인 = 유나 자리는 주황)
    B(i + 0.5, j - 0.16, 0.02, 0.32, 9, WHITE, 9, {r:0});
    K.wtext(String(k), i + 0.53, j, 13.5, "-i", 2.4, D("#24406A", "#BFD8F2"), null, 800, K.FONT);
    rod([i + 0.42, j - 0.2, 20], [i + 0.42, j - 0.2, 28], 0.012, D("#8A8F8A", "#8A8F8A")); rod([i + 0.42, j + 0.2, 20], [i + 0.42, j + 0.2, 28], 0.012, D("#8A8F8A", "#8A8F8A"));   // 배영 손잡이
    rod([i + 0.42, j - 0.2, 28], [i + 0.42, j + 0.2, 28], 0.012, D("#8A8F8A", "#8A8F8A")); }
  // 오른쪽 끝도 출발대 (반대편 경기용)
  for(let k = 0; k < 10; k++){ const j = laneJ(k), i = P.i1 + CO + 0.02;
    B(i, j - 0.27, 0.5, 0.54, 20, D("#F4F4F2", "#6A6862"), 0, {r:0.04}); B(i - 0.02, j - 0.29, 0.54, 0.58, 3, D("#2E6FD1", "#24406A"), 20, {r:0.03}); }
}
function buildGuard(){   // 감시탑 (앞 가장자리 가운데, 물을 봄)
  const i = 25.0, j = P.j1 + 1.05, col = D("#E23B3B", "#8A2A2A");
  [[-0.32, -0.3], [0.32, -0.3], [-0.32, 0.3], [0.32, 0.3]].forEach(([di, dj]) => rod([i + di, j + dj * 0.9, 0], [i + di * 0.7, j + dj * 0.6, 58], 0.03, col, "s", 6));
  [16, 32, 48].forEach(z => B(i - 0.3, j + 0.28 - (z / 58) * 0.1, 0.6, 0.04, 1.4, col, z, {r:0, cls:"s"}));
  B(i - 0.34, j - 0.32, 0.68, 0.64, 2.5, WHITE, 58, {r:0.03}); B(i - 0.34, j + 0.26, 0.68, 0.08, 20, col, 60.5, {r:0.03});
  K.sm(K.cyl(0.02, 0.02, hz(40), 6), WOOD, X(i + 0.3), hz(80), Z(j + 0.3), null, "s"); K.sm(K.cyl(0.52, 0.06, hz(14), 14), D("#FFFFFF", "#CFCAC2"), X(i + 0.3), hz(104), Z(j + 0.3), null, "m");   // 파라솔
  K.wtext("LIFEGUARD", i, j + 0.36, 70, "i", 2.6, WHITE, null, 800, K.FONT);
  // 구명 튜브 (벽)
  [[13.5], [36.5]].forEach(([ii]) => { const o = K.sm(new THREE.TorusGeometry(0.22, 0.07, 8, 18), D("#E23B3B", "#8A2A2A"), X(ii), hz(30), Z(P.j1 + 1.0), null, "m"); o.rotation.y = 0; B(ii - 0.04, P.j1 + 1.02, 0.08, 0.06, 44, POST, 0, {r:0, cls:"s"}); });
}
function buildStands(){
  const {i0, i1, j0, j1, n} = STAND, d = (j1 - j0) / n;
  for(let k = 0; k < n; k++){ const j = j1 - (k + 1) * d, z = 11 + k * 11;
    B(i0, j, i1 - i0, d, z - 2, D("#CDD5D9", "#41484C"), 0, {r:0.02});
    const m = Math.round((i1 - i0) / 0.62);
    for(let q = 0; q < m; q++){ const i = i0 + q * (i1 - i0) / m, c = RB[(q + k * 2) % 6]; B(i + 0.07, j + 0.12, (i1 - i0) / m - 0.12, d - 0.3, 2, D(c, K.sh(c, -0.45)[0] || c), z - 2, {r:0.04}); B(i + 0.07, j + 0.06, (i1 - i0) / m - 0.12, 0.08, 8, D(c, K.sh(c, -0.45)[0] || c), z - 2, {r:0.03}); } }
  // 관중석 계단 (양 끝)
  [i0 - 0.6, i1 + 0.05].forEach(i => { for(let s = 0; s < 3; s++) B(i, j1 - (s + 1) * d, 0.55, d, 9 + s * 11, D("#B9C3C8", "#383F43"), 0, {r:0.02}); });
}
function buildBoard(){
  const i = 25.0, j = -0.32, w = 13, h = hz(150), z0 = hz(64);
  B(i - w / 2 - 0.2, j - 0.05, w + 0.4, 0.12, 156, D("#1C2630", "#12181E"), 60, {r:0.04, cls:"s"});
  const cv = document.createElement("canvas"); cv.width = 1300; cv.height = 460; const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({map:tex, toneMapped:false}));
  m.position.set(X(i), z0 + h / 2 + hz(4), Z(j) + 0.08); K.R.scene.add(m); W.board = {cv, tex, m, st:null}; drawBoard();
}
function drawBoard(){
  if(!W || !W.board) return; const {cv, tex} = W.board, c = cv.getContext("2d"), s = W.board.st, F = K.FONT;
  c.fillStyle = "#0E1620"; c.fillRect(0, 0, 1300, 460); c.strokeStyle = "#2E6FD1"; c.lineWidth = 8; c.strokeRect(4, 4, 1292, 452);
  c.textBaseline = "middle"; c.font = `800 40px ${F}`; c.fillStyle = "#7FD3F5"; c.textAlign = "left"; c.fillText(s?.title || "CREYONG AQUATICS · 50M", 30, 42);
  c.textAlign = "right"; c.fillStyle = "#FFD27A"; c.fillText(s?.clock || "", 1270, 42);
  const rows = s?.rows || [["", "자유 수영", ""], ["", "4번 레인 옆 출발대에서", ""], ["", "50m 수영 시합 🏊", ""]];
  rows.slice(0, 6).forEach((r, k) => { const y = 112 + k * 62; c.fillStyle = k % 2 ? "#141E2A" : "#18242F"; c.fillRect(20, y - 28, 1260, 56);
    c.font = `800 36px ${F}`; c.textAlign = "center"; c.fillStyle = r[3] === "yu" ? "#FFB6CF" : "#9FC3E8"; c.fillText(r[0], 80, y);
    c.textAlign = "left"; c.fillStyle = r[3] === "yu" ? "#FFE3EE" : "#FFFFFF"; c.fillText(r[1], 150, y);
    c.textAlign = "right"; c.fillStyle = "#FFD27A"; c.fillText(r[2], 1260, y); });
  tex.needsUpdate = true;
}
/* ---------- 벽 · 창 · 문 ---------- */
function buildWalls(){
  // 뒤 벽 (높게 · 큰 창)
  B(EXT[0], EXT[1], EXT[2] - EXT[0], 0.3, 220, WALL, 0, {r:0.02}); block(EXT[0], EXT[1], EXT[2], EXT[1] + 0.3, 220);
  for(let i = 1.0; i < 49.5; i += 3.1){ if(i > 17.6 && i < 32.4) continue; B(i, EXT[1] + 0.29, 2.5, 0.03, 70, D("#BFE3F2", "#1E3448"), 132, {r:0, cls:"glass"}); }
  B(EXT[0], EXT[1] + 0.3, EXT[2] - EXT[0], 0.04, 6, TEAL, 214, {r:0});
  K.wtext("CREYONG SPORTS CENTER", 6.6, EXT[1] + 0.33, 190, "i", 9, D("#3A8A78", "#72C4AE"), null, 800, K.FONT);
  K.wtext("크레용 스포츠센터 · 수영장", 43.4, EXT[1] + 0.33, 190, "i", 6.6, D("#3A8A78", "#72C4AE"), null, 800, K.FONT);
  // 옆 벽 (중간 높이 · 문)
  const side = i => { [[EXT[1], 25.8, 150], [25.8, DOOR_L[0], 60], [DOOR_L[1], EXT[3], 60]].forEach(([a, b, h]) => { B(i, a, 0.3, b - a, h, WALL2, 0, {r:0.02}); block(i, a, i + 0.3, b, h); });
    B(i, DOOR_L[0], 0.3, DOOR_L[1] - DOOR_L[0], 18, TEAL, 60, {r:0.02}); };
  side(EXT[0]); side(EXT[2] - 0.3);
  K.wtext("← 강변", EXT[0] + 0.32, (DOOR_L[0] + DOOR_L[1]) / 2, 69, "j", 2.6, WHITE, null, 800, K.FONT);
  K.wtext("실내 테니스장 →", EXT[2] - 0.32, (DOOR_R[0] + DOOR_R[1]) / 2, 69, "-j", 2.6, WHITE, null, 800, K.FONT);
  // 앞: 낮은 유리 난간
  B(EXT[0], EXT[3] - 0.12, EXT[2] - EXT[0], 0.12, 9, WALL2, 0, {r:0.02}); B(EXT[0], EXT[3] - 0.09, EXT[2] - EXT[0], 0.05, 26, D("#CFEAF5", "#2A4050"), 9, {r:0, cls:"glass"});
  block(EXT[0], EXT[3] - 0.15, EXT[2], EXT[3], 35);
  // 천장 조명 (긴 등 · 밤에 켜짐)
  for(let i = 9; i < 44; i += 7) for(const j of [8.5, 15.0, 21.5]){ B(i - 1.2, j - 0.12, 2.4, 0.24, 2, D("#FFFFFF", "#FFF4D8"), 200, {r:0.04, cls:"glow"}); gl(i, j, 198, 70, "#E6F4FF", (tm, dk) => dk ? 0.5 : 0); }
}
function buildFront(){
  // 안내 데스크
  const {i0, i1, j0, j1} = DESK;
  B(i0, j0, i1 - i0, j1 - j0, 32, D("#FFFFFF", "#5A5752"), 0, {r:0.05}); B(i0 - 0.05, j0 - 0.08, i1 - i0 + 0.1, j1 - j0 + 0.1, 2, TEAL, 32, {r:0.04});
  K.wtext("안내", (i0 + i1) / 2, j1 + 0.07, 20, "i", 3.2, D("#3A8A78", "#72C4AE"), null, 800, K.FONT);
  B(i0 + 0.5, j0 + 0.2, 0.5, 0.35, 12, D("#2A2A28", "#55504A"), 32, {r:0.02}); B(i0 + 0.52, j0 + 0.18, 0.46, 0.02, 9, D("#A8DCC8", "#3E5E56"), 34, {r:0, cls:"glow"});   // 모니터
  [[2.0, "#F4A7B9"], [2.6, "#A9CBEA"], [3.2, "#F6E39A"]].forEach(([i, c]) => { const o = K.sm(new THREE.TorusGeometry(0.11, 0.035, 8, 16), D(c, c), X(i), hz(36), Z(j0 + 0.5), null, "m"); o.rotation.x = PI / 2; });   // 수모·물안경 진열 대신 튜브
  // 탈의실
  const b = BOOTH; B(b.i0, b.j0, b.i1 - b.i0, b.j1 - b.j0, 78, PINK, 0, {r:0.04}); B(b.i0 - 0.05, b.j0 - 0.05, b.i1 - b.i0 + 0.1, b.j1 - b.j0 + 0.1, 3, D("#C8B4D0", "#5E4E68"), 78, {r:0.03});
  B(b.i0 + 0.55, b.j0 - 0.02, 1.1, 0.03, 56, D("#F7D9E4", "#5A4450"), 0, {r:0});
  K.wtext("탈의실", (b.i0 + b.i1) / 2, b.j1 + 0.07, 64, "i", 3.0, D("#8A4A66", "#FFD6E6"), null, 800, K.FONT);
  K.wtext("🩱 수영복", (b.i0 + b.i1) / 2, b.j1 + 0.07, 46, "i", 2.6, WHITE, null, 700, K.FONT);
  // 사물함
  for(let k = 0; k < 6; k++){ const i = 12.0 + k * 0.62; B(i, 31.55, 0.58, 0.55, 64, D(RB[k % 6], K.sh(RB[k % 6], -0.4)[0] || RB[k % 6]), 0, {r:0.02}); ball(i + 0.45, 31.53, 36, 0.03, D("#8A8F8A", "#8A8F8A"), "s", 6); }
  block(11.9, 31.5, 15.8, 32.2, 64);
  // 벤치 · 화분 · 정수기
  [[19.0], [31.0], [37.5]].forEach(([i]) => { B(i - 0.9, 27.0, 1.8, 0.4, 13, WOOD, 0, {r:0.05}); });
  [[6.8, 27.1], [17.2, 31.6], [43.5, 31.6], [47.8, 31.4]].forEach(([i, j], k) => { disc(i, j, 0.24, 0, 12, D("#F4F1EA", "#55524C"), "m", 16); ball(i, j, 24, 0.3, D("#7FB86E", "#2E4A2E"), "m", 10); ball(i + 0.12, j - 0.05, 32, 0.2, D("#8CC478", "#34502E"), "m", 10); });
  { const i = 45.6, j = 31.5; B(i - 0.25, j - 0.25, 0.5, 0.45, 40, D("#FFFFFF", "#6A6862"), 0, {r:0.04}); K.sm(K.cyl(0.14, 0.14, hz(14), 14), D("#9FD8F2", "#3A5E70"), X(i), hz(47), Z(j), null, "glass"); }
  // 시합 안내판 (출발대 옆)
  { const si = 1.0, sj = P.j0 + 0.9; B(si - 0.05, sj - 0.05, 0.1, 0.1, 40, POST, 0, {r:0, cls:"s"});   // 출발대 뒤 구석 (시합 카메라를 안 가리게)
    B(si - 0.03, sj - 0.6, 0.06, 1.2, 22, D("#2E6FD1", "#24406A"), 36, {r:0.02});
    K.wtext("50m 시합 🏊", si + 0.04, sj, 50, "j", 2.0, WHITE, null, 800, K.FONT); }
}

/* ---------- 유나 모드 ---------- */
const SEATS = [0, 1, 2].map(k => ({a:[STAND.i0 + 1, STAND.j1 - (k + 0.55) * (STAND.j1 - STAND.j0) / 3], b:[STAND.i1 - 1, STAND.j1 - (k + 0.55) * (STAND.j1 - STAND.j0) / 3], h:PI, H:H(9 + k * 11), k:"stand"}))
  .concat([[19.0], [31.0], [37.5]].map(([i]) => ({a:[i - 0.6, 27.2], b:[i + 0.6, 27.2], h:PI, H:H(13), k:"bench"})));
export const GYM = {
  name:"크레용 스포츠센터",
  gate:GATE, spawnGate:SPAWN, gateR:GATE_R, spawnR:SPAWN_R,
  seats:SEATS,
  sitLines:{stand:["유나 화이팅~ 📣", "와 물보라 봐! 🌊", "누가 1등 할까? 🏅", "다들 진짜 빠르다 😮"]},
  use:[{at:START, k:"race", h:PI / 2, r:1.3}],
  booth:[(BOOTH.i0 + BOOTH.i1) / 2, BOOTH.j0 - 0.35],
  /* 게임이 읽는 수영장 (칸): water 로 넘길 것 · 레인 가운데 · 출발/도착 i */
  pool:{rect:[P.i0, P.j0, P.i1, P.j1], walk:[P.i0 - CO - 0.05, P.j0 - CO - 0.05, P.i1 + CO + 0.05, P.j1 + CO + 0.05], surf:SURF},
  lanes:Array.from({length:10}, (_, k) => laneJ(k)), startI:P.i0 + 0.45, endI:P.i1 - 0.45, blockI:P.i0 - CO - 0.27,
  /* 기록판: {title, clock, rows:[[레인, 이름, 기록, "yu"?]]} · null이면 기본 */
  board(st){ if(!W || !W.board) return; W.board.st = st || null; drawBoard(); },
};

/* ---------- 층 정의 ---------- */
const def = {
  id:"gym",
  zones:{
    gy_pool:{name:"50m 수영장", color:"#47A6D8", rect:[P.i0 - 1.6, 3.8, P.i1 + 1.6, P.j1 + 0.4], label:[25, P.j1 + 0.4, "bottom"]},
    gy_stand:{name:"관중석", color:"#E8A04A", rect:[STAND.i0, 0, STAND.i1, STAND.j1], label:[25, 0, "top"]},
    gy_lobby:{name:"안내 · 탈의실", color:"#3A8A78", rect:[EXT[0], 26.2, EXT[2], EXT[3]], label:[25, EXT[3], "bottom"]}},
  outline:[[EXT[0], EXT[1]], [EXT[2], EXT[1]], [EXT[2], EXT[3]], [EXT[0], EXT[3]]],
  walk:[[EXT[0], EXT[1]], [EXT[2], EXT[1]], [EXT[2], EXT[3]], [EXT[0], EXT[3]]],
  ext:EXT,
  top:7.2,
  allPts:V => [V(EXT[0], 0, EXT[1]), V(EXT[2], 0, EXT[1]), V(EXT[2], 0, EXT[3]), V(EXT[0], 0, EXT[3]), V(EXT[0], 4.8, EXT[1]), V(EXT[2], 4.8, EXT[1])],
  lamps:[[12, 10, 5.2], [25, 10, 5.2], [38, 10, 5.2], [12, 20, 5.2], [25, 20, 5.2], [38, 20, 5.2], [4, 29, 2.6], [25, 29, 2.6], [46, 29, 2.6]],
  glow:{color:0xBFE6FF, at:[25, 15, 3.0]},
  eggs:[],
  people:[],
  paintFloor(c, dark, KIT){ if(!K && KIT) K = KIT; paintGym(c, dark); },
  build(KIT){
    K = KIT; W = {recolor:[], glows:[], extraBoxes:[]};
    def.eggs = [
      egg("gy_board", [25, -0.3, 150], ["🏊", "⏱️"], ["기록판이다! 50m 세계 기록은 20초대래 😲", "1등은 금메달 🥇"]),
      egg("gy_rope", [25, laneJ(4) + LW / 2, 8], ["🟡", "🔵"], ["레인 줄은 물결을 잡아 줘서 옆 사람 물살에 안 밀려", "양 끝 빨간 줄은 '벽이 가까워요' 신호야 🚩"]),
      egg("gy_flag", [P.i0 + 5 / 1.28, 15, 60], ["🚩", "🔺"], ["배영 깃발! 뒤로 헤엄칠 때 벽까지 몇 번 남았나 세는 거야", "벽에서 딱 5m"]),
      egg("gy_block", [P.i0 - CO - 0.27, laneJ(4), 24], ["🏁", "🐬"], ["출발대! 4번 레인은 제일 빠른 사람 자리래 😎", "삐— 소리 나면 뛰어들기!"]),
      egg("gy_guard", [25, P.j1 + 1.05, 70], ["🛟", "🧑‍🚒"], ["안전요원 자리! 뛰지 마세요~ 🙅", "수영장에선 걷기!"]),
      egg("gy_tube", [13.5, P.j1 + 1.0, 30], ["🛟", "💦"], ["구명 튜브는 위급할 때만! 🛟"])];
    buildWater(); buildRopes(); buildBlocks(); buildGuard(); buildStands(); buildBoard(); buildWalls(); buildFront();
  },
  init(KIT){},
  tick(KIT, now, t, dt){
    if(W.extraBoxes.length && KIT.R && KIT.R.boxes && !W.boxDone){ W.boxDone = true; KIT.R.boxes = Float32Array.from([...KIT.R.boxes, ...W.extraBoxes.flat()]); KIT.R.pg = null; }
    if(W.water && !KIT.reduce){ W.water.tex.offset.x = (t * 0.012) % 1; W.water.tex.offset.y = (Math.sin(t * 0.3) * 0.02 + 1) % 1; } },
  theme(KIT, dark){ if(!W) return; W.recolor.forEach(m => { const u = m.geometry.userData, a = m.geometry.attributes.color; if(u && u.L && a){ a.array.set(dark ? u.D : u.L); a.needsUpdate = true; } }); },
};
export default def;
