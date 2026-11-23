/* 크레용타워 4F 스튜디오층 3D (2026-11-22). 2.5D 4층(크레용사무실.html s4Floor·s4Walls·s4Furniture·s4Lamps) 칸 좌표·색 그대로.
   예운옥(전원주택 세트) · 백록당(화이트·그린 호리존) · 필름스쿨(다빈치 강의실) · 분장실 · 장비 대여실.
   촬영팀·학생·조교·탈잉·엘리베이터 문·이스터에그는 타워의 2D 시뮬레이션(F3_SIM.s4)을 그대로 따라감 */
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const PI = Math.PI, GJ = 20, GI = 29, WI = 36, CH = 14.5, HI = 148, WALL = 112;
const S4_Z = {
  s4_yewun: {name:"예운옥 OOOhouse", color:"#E8B5C8", rect:[0,0,11.8,GJ],    label:[5.9,0,"top"]},
  s4_baek:  {name:"백록당 호리존",   color:"#4DAA97", rect:[12.4,0,GI,9],    label:[20.7,0,"top"]},
  s4_school:{name:"크레용 필름스쿨", color:"#8B5A3C", rect:[16.4,10.4,GI,GJ], label:[22.7,GJ,"bottom"]},
  s4_makeup:{name:"분장실·대기실",   color:"#C8B4D0", rect:[GI,5.4,WI,CH],   label:[32.5,CH,"bottom"]},
  s4_gear:  {name:"장비 대여실",     color:"#E8A04A", rect:[GI,0,WI,5.4],    label:[WI,2.7,"side"]},
};
const RB = ["#F4A7B9","#F9C99B","#F6E39A","#A8DCC8","#A9CBEA","#C8B4D0"];
const PEND = [[3.9,4.0],[5.5,4.0],[5.0,7.7]], DOMES = [[20.0,13.5],[20.0,16.8],[26.9,13.0],[32.6,10.0],[32.4,2.5],[14.2,15.0]];
const GRID = [[14.2,1.0],[16.6,4.6],[19.0,1.0],[22.6,1.0],[24.8,4.6],[27.0,1.0],[16.6,8.2],[24.8,8.2]];
const DESKS = []; [12.4, 14.0, 15.6].forEach(js => [17.6, 18.85, 20.1, 21.35].forEach(ti => DESKS.push([ti, js])));
const PD_DESK = {class:[25.9,11.2,2.0,0.9], taling:[25.9,16.5,1.9,0.8], studio:[7.2,18.0,1.9,0.9], promo:[9.3,18.0,1.8,0.9]};   // 대관·홍보 PD는 2F에서 4F 예운옥 데스크로 (2026-11-22)
const BOOTH = [[33.62,34.78],[34.82,35.94]];   // 분장실 탈의실 두 칸 (j 10.3~11.6, 커튼 j 11.6 · 의상 행거 앞)
const VANITY = [[31.2,33.2],[33.4,35.4]];
const rnd = k => { const v = Math.sin(k * 12.9898) * 43758.5453; return v - Math.floor(v); };

let K = null, W = null;
const sim = () => { try { return K?.R?.opts?.sim?.() || null; } catch(e){ return null; } };

/* ---------- 작은 도구 ---------- */
const X = i => K.X(i), Z = j => K.Z(j), hz = p => K.hz(p);
const D = (l, d) => [l, d];
function B(i, j, w, d, h, col, z0 = 0, o = {}){ return K.B(i, j, w, d, h, col, z0, o); }
const LG = [];
const myGeo = g => { LG.push(g); return g; };
function rod(a, b, r, col, cls = "s", seg = 6){
  const A = new THREE.Vector3(X(a[0]), hz(a[2]), Z(a[1])), C = new THREE.Vector3(X(b[0]), hz(b[2]), Z(b[1])), len = A.distanceTo(C); if(len < 1e-4) return;
  const o = K.sm(K.cyl(r, r, len, seg), col, (A.x + C.x) / 2, (A.y + C.y) / 2, (A.z + C.z) / 2, null, cls); o.lookAt(C); o.rotateX(PI / 2);
}
const ball = (i, j, zp, r, col, cls = "m", seg = 10) => K.sm(K.sph(r, seg, Math.max(6, seg * 0.75 | 0)), col, X(i), hz(zp), Z(j), null, cls);
const disc = (i, j, r, zp, hp, col, cls = "m", seg = 20) => K.sm(K.cyl(r, r, Math.max(0.006, hz(hp)), seg), col, X(i), hz(zp) + Math.max(0.006, hz(hp)) / 2, Z(j), null, cls);
function tripod(i, j, h, sp = 0.3, col = "metal"){ [0, 2.1, 4.2].forEach(a => rod([i, j, h * 0.55], [i + Math.cos(a) * sp, j + Math.sin(a) * sp, 0], 0.012, col)); rod([i, j, h * 0.5], [i, j, h], 0.016, col); }
function tree(i, j, s){
  B(i - 0.2, j - 0.2, 0.4, 0.4, 12, "pot", 0, {r:0.05});
  B(i - 0.05, j - 0.05, 0.1, 0.1, 40 * s, D("#7A5A3C","#5A4230"), 0, {r:0.02});
  [[0,-4,16],[-11,4,12],[11,5,12],[-5,-14,11],[6,-12,11],[0,6,12]].forEach(([dx, dy, r], k) => { const u = dx * s / 31.3 * 0.707, dz = -dy * s;
    ball(i + u, j - u + (k % 3 - 1) * 0.08 * s, 54 * s + dz, r * s / 31.3 * 1.05, k % 2 ? K.sh("plant", 0.18) : "plant", "m", 12); });
}
/* 정점 색 한 덩어리 (움직이는 물건용, 낮·밤 두 벌) */
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
function dynMesh(g){ const m = new THREE.Mesh(g, K.cutaway(new THREE.MeshStandardMaterial({vertexColors:true, roughness:0.6}))); m.castShadow = true; m.receiveShadow = true; m.visible = false; K.R.scene.add(m); W.recolor.push(m); return m; }

/* ---------- 움직이는 그림판 한 장 (리졸브 화면 · 모니터 · 층 표시 …) ---------- */
const DW = 1024, DH = 512;
function dAlloc(w, h){ const A = W.dA; w = Math.ceil(w); h = Math.ceil(h); if(A.x + w + 2 > DW){ A.x = 2; A.y += A.row + 3; A.row = 0; } const r = {x:A.x, y:A.y, w, h}; A.x += w + 3; A.row = Math.max(A.row, h); if(A.y + h > DH) console.warn("s4 dyn full"); return r; }
function dplane(wpx, hpx, ww, wh, axis, i, j, zc, draw, off = 0.035){
  const r = dAlloc(wpx, hpx); W.dyn.push({r, draw});
  const g = new THREE.PlaneGeometry(ww, wh), uv = g.attributes.uv;
  for(let k = 0; k < uv.count; k++){ const u = uv.getX(k), v = uv.getY(k); uv.setXY(k, (r.x + u * r.w) / DW, 1 - (r.y + (1 - v) * r.h) / DH); }
  if(axis === "j") g.rotateY(PI / 2); else if(axis === "f") g.rotateX(-PI / 2);
  g.translate(...(axis === "i" ? [X(i), zc, Z(j) + off] : axis === "j" ? [X(i) + off, zc, Z(j)] : [X(i), zc, Z(j)]));
  W.dgeo.push(g);
}
/* 빛나는 판 (소프트박스 면 · 조명 그리드 · 쿡탑 화구): 인스턴스 하나에 색만 바꿈 */
function panel(x, y, z, sx, sy, sz, ry, fn){ W.pan.push({p:new THREE.Vector3(x, y, z), r:ry, s:new THREE.Vector3(sx, sy, sz), fn}); return W.pan.length - 1; }

/* ---------- 바닥 그림 (s4Floor 그대로, 1칸 = 1) ---------- */
function paintFloor(c, dark){
  const v = (l, d) => dark ? d : l, FS = K.FS;
  const rect = (i0, j0, i1, j1, col) => { c.fillStyle = col; c.fillRect(i0, j0, i1 - i0, j1 - j0); };
  const line = (i0, j0, i1, j1, col, w = 1) => { c.strokeStyle = col; c.lineWidth = w / 28; c.beginPath(); c.moveTo(i0, j0); c.lineTo(i1, j1); c.stroke(); };
  const glow = (i, j, r, c0) => { const g = c.createRadialGradient(i, j, 0, i, j, r); g.addColorStop(0, c0); g.addColorStop(1, "rgba(255,240,210,0)"); c.fillStyle = g; c.beginPath(); c.arc(i, j, r, 0, 7); c.fill(); };
  const text = (t, i, j, size, col, w = 800, fam = K.SIGN) => { c.save(); c.scale(1 / FS, 1 / FS); c.font = `${w} ${size / 31.3 * FS}px ${fam}`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = col; c.fillText(t, i * FS, j * FS); c.restore(); };
  const cor = v("#EEE8DE", "#36312B");
  rect(0, 0, WI, CH, cor); rect(0, CH, GI, GJ, cor);
  // 예운옥: 밝은 원목 마루 · 러그
  rect(0, 0, 11.8, GJ, v("#EAD9C3", "#46392F"));
  for(let j = 0.45; j < GJ; j += 0.45) line(0, j, 11.8, j, v("rgba(120,80,40,.10)", "rgba(0,0,0,.22)"), 0.7);
  for(let k = 0, j = 0; j < GJ; j += 0.45, k++) for(let i = (k % 3) * 0.9 + 0.4; i < 11.8; i += 2.7) line(i, j, i, j + 0.45, v("rgba(120,80,40,.10)", "rgba(0,0,0,.22)"), 0.7);
  rect(1.7, 12.1, 5.5, 17.9, v("#EFD3DE", "#5A4450")); rect(1.9, 12.3, 5.3, 17.7, v("#F7E3EA", "#644C59"));
  for(let k = 0; k < 4; k++) rect(2.3 + k * 0.75, 12.6, 2.6 + k * 0.75, 17.4, v("rgba(200,180,208,.35)", "rgba(200,180,208,.12)"));
  glow(5.0, 3.9, 1.6, v("rgba(255,252,240,.55)", "rgba(255,200,130,.18)")); glow(5.0, 7.7, 1.5, v("rgba(255,252,240,.55)", "rgba(255,200,130,.18)"));
  // 백록당: 콘크리트 + 호리존 바닥
  rect(12.4, 0, GI, 9, v("#D5D3CE", "#31312E"));
  for(let k = 0; k < 160; k++){ c.fillStyle = v("rgba(0,0,0,.05)", "rgba(255,255,255,.04)"); c.fillRect(12.5 + rnd(k + 3) * 16.4, 0.1 + rnd(k + 77) * 8.8, 0.06, 0.03); }
  const cyc = (i0, i1, col, edge) => { rect(i0, 0, i1, 6.3, col); const g = c.createLinearGradient(0, 6.3, 0, 4.6); g.addColorStop(0, edge); g.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = g; c.fillRect(i0, 4.6, i1 - i0, 1.7); };
  cyc(12.9, 20.3, v("#FBFBF8", "#D9D8D2"), v("rgba(0,0,0,.06)", "rgba(0,0,0,.25)"));
  cyc(21.0, 28.5, v("#2FB35A", "#1E7A3E"), v("rgba(0,40,10,.25)", "rgba(0,0,0,.35)"));
  [[16.6, 2.4], [24.8, 2.4]].forEach(([i, j]) => { line(i - 0.18, j - 0.18, i + 0.18, j + 0.18, "#E8A04A", 2.2); line(i - 0.18, j + 0.18, i + 0.18, j - 0.18, "#E8A04A", 2.2); });
  // 복도 · 엘리베이터 홀 (테라조)
  rect(11.8, 9, GI, 10.4, cor); rect(11.8, 10.4, 16.4, GJ, v("#EFEAE2", "#2F2C28"));
  [12.9, 14.0, 15.1].forEach(i => line(i, 10.4, i, GJ, v("rgba(0,0,0,.045)", "rgba(255,255,255,.04)")));
  for(let j = 11.5; j < GJ; j += 1.1) line(11.8, j, 16.4, j, v("rgba(0,0,0,.045)", "rgba(255,255,255,.04)"));
  c.fillStyle = v("#E2D6C4", "#3A352F"); c.beginPath(); c.arc(14.4, 14.4, 1.3, 0, 7); c.fill(); c.fillStyle = v("#F7F2EA", "#2F2C28"); c.beginPath(); c.arc(14.4, 14.4, 1.15, 0, 7); c.fill();
  text("4F", 14.4, 14.4, 22, v("rgba(139,90,60,.28)", "rgba(255,230,200,.16)"));
  text("STUDIO · SCHOOL", 20.0, 9.7, 10, v("rgba(42,42,40,.08)", "rgba(255,255,255,.06)"));
  // 필름스쿨 카펫
  const sc = v("#E3D0BD", "#43372D"); rect(16.4, 10.4, GI, GJ, sc);
  for(let i = 16.4; i < GI; i += 1) for(let j = 10.4; j < GJ; j += 1) if((Math.floor(i) + Math.floor(j)) % 2) rect(i, j, Math.min(GI, i + 1), Math.min(GJ, j + 1), K.shade(sc, -0.035));
  text("DaVinci Resolve ONE-DAY", 20.6, 18.6, 9, v("rgba(80,50,30,.18)", "rgba(255,255,255,.10)"));
  // 분장실 · 장비 대여실
  rect(GI, 5.4, WI, CH, v("#F2E9F3", "#3D3441"));
  for(let i = GI + 0.7; i < WI; i += 0.7) line(i, 5.4, i, CH, v("rgba(120,90,140,.08)", "rgba(255,255,255,.04)"), 0.7);
  for(let j = 6.1; j < CH; j += 0.7) line(GI, j, WI, j, v("rgba(120,90,140,.08)", "rgba(255,255,255,.04)"), 0.7);
  rect(GI, 0, WI, 5.4, v("#5A5D61", "#26282A"));
  for(let k = 0; k < 9; k++) rect(30.6 + k * 0.32, 3.0, 30.76 + k * 0.32, 3.12, "#E8C84A");
  text("GEAR RENTAL 24H", 32.6, 4.4, 8, v("rgba(255,255,255,.16)", "rgba(255,255,255,.09)"));
  // 조명 아래 빛
  DOMES.forEach(([i, j]) => glow(i, j, 1.2, v("rgba(255,252,240,.5)", "rgba(255,200,130,.18)")));
}

/* ---------- 건물 껍데기 · 벽 ---------- */
function winI(a, b, z0, z1){   // 예운옥 통창 (i = 0): 하늘 · 언덕 · 나무
  const k = 110, ww = b - a, wh = hz(z1 - z0);
  K.decal(ww * k, wh * k, (c, Wc, Hc, dark) => {
    const g = c.createLinearGradient(0, 0, 0, Hc); g.addColorStop(0, dark ? "#16243A" : "#B9DCEF"); g.addColorStop(1, dark ? "#2C3E5E" : "#EEF6F4"); c.fillStyle = g; c.fillRect(0, 0, Wc, Hc);
    if(dark && a < 2){ c.fillStyle = "#FFF4D6"; c.beginPath(); c.arc(Wc * 0.78, Hc * 0.16, Hc * 0.035, 0, 7); c.fill(); }
    const hill = (u, amp, f, ph, base) => Hc - (base + amp * Math.sin(u * f + ph)) * Hc / (z1 - z0) * 1;
    [[22, 0.7, 1.3, dark ? "#1E2B30" : "#9CC58A"], [10, 1.1, 0.2, dark ? "#17221F" : "#7FB26E"]].forEach(([base, f, ph, col]) => { c.fillStyle = col; c.beginPath(); c.moveTo(0, Hc);
      for(let x = 0; x <= Wc; x += 6){ const j = b - x / k; c.lineTo(x, hill(j, 7, f, ph, base)); } c.lineTo(Wc, Hc); c.fill(); });
    for(let j = a + 0.5; j < b - 0.3; j += 1.3){ const x = (b - j) * k, y = hill(j, 7, 1.1, 0.2, 10) - 10, s = (0.8 + rnd(j) * 0.5) * Hc / 128;
      c.fillStyle = dark ? "#1C2A26" : "#5E9A5A"; c.beginPath(); c.arc(x, y - 6 * s, 7 * s, 0, 7); c.fill(); c.fillStyle = dark ? "#203029" : "#6FAE64"; c.beginPath(); c.arc(x - 4 * s, y - 2 * s, 5 * s, 0, 7); c.fill(); }
    const s = c.createLinearGradient(Wc, 0, 0, Hc); s.addColorStop(0, "rgba(255,255,255,.22)"); s.addColorStop(0.35, "rgba(255,255,255,0)"); s.addColorStop(1, "rgba(255,255,255,.08)"); c.fillStyle = s; c.fillRect(0, 0, Wc, Hc);
  }, ww, wh, "j", 0.0, (a + b) / 2, hz((z0 + z1) / 2));
  const fr = D("#2A2A28", "#14141A");
  for(let q = 0; q <= 4; q++){ const j = a + (b - a) * q / 4; B(0.0, j - 0.03, 0.06, 0.06, z1 - z0, fr, z0, {r:0, cls:"s"}); }
  [z0, 48, z1].forEach(z => B(0.0, a, 0.06, b - a, z === 48 ? 1 : 2, fr, z - 1, {r:0, cls:"s"}));
}
function buildShell(){
  const t = 0.25, slab = 12, wy = D("#F6E6EC", "#4A3A41"), wb = D("#C9C7C2", "#3B3B39");
  B(0, GJ, GI, 0.02, slab, "slab", -slab, {r:0}); B(GI, CH, 0.02, GJ - CH, slab, K.sh("slab", -0.14), -slab, {r:0});
  B(GI, CH, WI - GI, 0.02, slab, "slab", -slab, {r:0}); B(WI, 0, 0.02, CH, slab, K.sh("slab", -0.14), -slab, {r:0});
  K.sm(K.rbox(WI + 0.25, hz(slab), CH + 0.25, 0), "slab", X(WI / 2 - 0.125), -hz(slab) / 2 - 0.002, Z(CH / 2 - 0.125));
  K.sm(K.rbox(GI + 0.25, hz(slab), GJ - CH, 0), "slab", X(GI / 2 - 0.125), -hz(slab) / 2 - 0.002, Z((CH + GJ) / 2));
  // 뒷벽: 예운옥(높음) · 백록당(높음) · 분장실·장비실(보통)
  B(0, -t, 11.8, t, HI, wy, 0, {r:0}); B(11.8, -t, GI - 11.8, t, HI, wb, 0, {r:0}); B(GI, -t, WI - GI, t, WALL, D("#3A3B3E", "#232426"), 0, {r:0});
  B(-t, 0, t, GJ, HI, D("#F2E8EC", "#3E3338"), 0, {r:0}); B(-t, -t, t, t, HI, wy, 0, {r:0});
  B(-t - 0.02, -t - 0.02, GI + t + 0.02, t + 0.04, 3, "wall-top", HI, {r:0}); B(-t - 0.02, -t, t + 0.04, GJ + t, 3, "wall-top", HI, {r:0}); B(GI, -t - 0.02, WI - GI, t + 0.04, 3, "wall-top", WALL, {r:0});
  B(GI - 0.02, -t, 0.02, t, HI, K.sh("wall-top", -0.2), 0, {r:0}); B(-t, GJ - 0.02, t, 0.02, HI, K.sh("wall-top", -0.1), 0, {r:0}); B(WI - 0.02, -t, 0.02, t, WALL, K.sh("wall-top", -0.2), 0, {r:0});
  K.faceJ(0, WI, 0.0, 0, 4, K.sh("wall-top", -0.1), "m", 0.03); K.faceI(0.0, 0, GJ, 0, 4, K.sh("wall-top", -0.1), "m", 0.03);
  // 예운옥 통창 (기둥 없이 끝까지)
  [[0.8, 6.0], [6.3, 11.5], [11.8, 17.0]].forEach(([a, b]) => winI(a, b, 8, 136));
  [[0.55, 0.85], [17.25, 17.55]].forEach(([a, b]) => K.faceI(0.0, a, b, 8, 136, D("#FFFFFF", "#5A5258"), "m", 0.04));
  // 왼벽 작은 무지개 액자
  K.faceI(0.0, 17.9, 19.6, 54, 104, D("#FFFFFF", "#2A2A28"), "m", 0.04);
  K.decal(150, 180, (c, w, h, dark) => { c.fillStyle = dark ? "#5A3A48" : "#F4C7D4"; c.fillRect(0, 0, w, h);
    RB.forEach((col, k) => { c.strokeStyle = col; c.lineWidth = w * 0.06; c.beginPath(); c.arc(w / 2, h * 0.72, w * (0.36 - k * 0.05), PI, 0); c.stroke(); }); }, 1.4, hz(42), "j", 0.02, 18.75, hz(79));
  // 예운옥 주방 뒷벽: 창 · 타일 · 상부장 · 선반
  winKitchen();
  K.faceJ(0.4, 6.8, 0.0, 31, 58, D("#FFFFFF", "#5A5258"), "m", 0.03);
  K.decal(640, 108, (c, w, h, dark) => { c.strokeStyle = dark ? "rgba(0,0,0,.28)" : "rgba(0,0,0,.08)"; c.lineWidth = 1.2;
    for(let y = h / 6; y < h; y += h / 6){ c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    for(let r = 0; r < 6; r++) for(let x = (r % 2) * 25; x < w; x += 50){ c.beginPath(); c.moveTo(x, r * h / 6); c.lineTo(x, (r + 1) * h / 6); c.stroke(); } }, 6.4, hz(27), "i", 3.6, 0.01, hz(44.5));
  B(3.4, 0.0, 3.4, 0.36, 36, D("#D8CCE0", "#5A4E62"), 72, {r:0.01}); [4.55, 5.7].forEach(i => K.faceJ(i - 0.01, i + 0.01, 0.37, 72, 108, D("#BCAFC6", "#463C4E"), "s", 0.005));
  [3.95, 5.1, 6.25].forEach(i => B(i, 0.36, 0.04, 0.03, 6, "#C9A64A", 86, {r:0, cls:"s"}));
  [66, 78].forEach(z => B(0.5, 0.0, 0.4, 0.35, 1.5, "wood", z, {r:0}));
  [[0.6, "#F2E3C6"], [0.75, "#72C4AE"]].forEach(([i, col]) => B(i, 0.08, 0.12, 0.14, 6, col, 79.5, {r:0.02}));
  // 무지개 구름 세트 (뒷벽)
  K.decal(560, 420, (c, w, h, dark) => {
    const cx = w * (9.9 - 7.6) / 4.6, by = h * 0.97, s = w / 4.6 / 31.3;
    RB.forEach((col, k) => { c.strokeStyle = col; c.lineWidth = 5.6 * s * 1.1; c.beginPath(); c.arc(cx, by, (60 - k * 6) * s, PI, 0); c.stroke(); });
    const puff = (x, y, r) => { c.fillStyle = dark ? "#EDE3F2" : "#FFFFFF"; [[-1, 0.2, 0.75], [0, -0.25, 1], [1, 0.15, 0.8], [0.5, 0.45, 0.7], [-0.5, 0.5, 0.7]].forEach(([dx, dy, rr]) => { c.beginPath(); c.arc(x + dx * r, y + dy * r * 0.8, rr * r, 0, 7); c.fill(); }); };
    puff(w * (8.75 - 7.6) / 4.6, by - 2 * s, 16 * s); puff(w * (11.3 - 7.6) / 4.6, by - 2 * s, 15 * s);
  }, 4.6, hz(72), "i", 9.8, 0.0, hz(46));
  K.wtext("OOOhouse", 10.05, 0.0, 112, "i", 13, "#FFFFFF", "#F06BA8", 800);
  K.wtext("예운옥 · 구름스튜디오", 10.05, 0.0, 100, "i", 4.2, D("#B5607E", "#F4C7D4"), null, 700, K.FONT);
  K.wtext("OOOhouse  KITCHEN", 3.6, 0.01, 124, "i", 5.2, D("rgba(181,96,126,.55)", "rgba(244,199,212,.4)"), null, 800);
  // 백록당 뒷벽: 세로 줄 · 호리존 두 면 (아래는 둥글게 바닥으로)
  for(let i = 12.6; i < GI; i += 1.4) K.faceJ(i - 0.01, i + 0.01, 0.0, 0, HI, D("#BDBBB6", "#353533"), "s", 0.004);
  cycWall(12.9, 20.3, D("#FCFCFA", "#DCDBD5"));
  cycWall(21.0, 28.5, D("#33B95E", "#21803F"));
  K.wtext("白鹿堂  BAEKROKDANG", 20.65, 0.0, 139, "i", 6.4, D("#2A2A28", "#E9E4DA"), null, 800);
  K.wtext("WHITE", 16.6, 0.05, 118, "i", 5, D("rgba(42,42,40,.25)", "rgba(0,0,0,.25)"), null, 800);
  K.wtext("GREEN", 24.75, 0.05, 118, "i", 5, "rgba(255,255,255,.4)", null, 800);
  // 장비 대여실 뒷벽: 타공판 · 주황 띠
  K.decal(700, 300, (c, w, h, dark) => { c.fillStyle = "rgba(0,0,0,.28)"; for(let x = 4; x < w; x += 9) for(let y = 4; y < h; y += 9) c.fillRect(x, y, 2, 2); }, WI - GI - 0.2, hz(WALL - 12), "i", (GI + WI) / 2, 0.0, hz((WALL - 12) / 2 + 6));
  K.faceJ(29.6, 35.6, 0.0, 98, 107, "#E8A04A", "m", 0.03);
  K.wtext("GEAR RENTAL 24H · 장비 대여", 32.6, 0.03, 102.5, "i", 4.3, "#2A2A28", null, 800, K.FONT);
  // 바닥 층 안내 (홀 왼쪽 기둥 대신 엘리베이터 위)
}
function winKitchen(){
  K.decal(220, 130, (c, w, h, dark) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, dark ? "#1C2740" : "#CFE6F2"); g.addColorStop(1, dark ? "#2C3E5E" : "#EAF4F7"); c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = dark ? "#1E2B30" : "#9CC58A"; c.beginPath(); c.moveTo(0, h); c.quadraticCurveTo(w * 0.4, h * 0.55, w, h * 0.75); c.lineTo(w, h); c.fill(); }, 2.0, hz(42), "i", 2.0, 0.0, hz(83));
  B(0.97, 0.0, 2.06, 0.06, 2, "#FFFFFF", 61, {r:0, cls:"s"}); B(0.97, 0.0, 2.06, 0.06, 2, "#FFFFFF", 103, {r:0, cls:"s"});
  [0.97, 1.97, 2.97].forEach(i => B(i, 0.0, 0.06, 0.06, 42, "#FFFFFF", 62, {r:0, cls:"s"}));
}
/* 호리존: 벽 + 아래 둥근 코브 (1/4 원통) */
function cycWall(i0, i1, col){
  const R0 = 0.75, len = i1 - i0, yR = R0;
  K.faceJ(i0, i1, 0.02, 24, 128, col, "m", 0.03);
  // 코브: 벽(높이 R0)에서 바닥(벽에서 R0)까지 안쪽으로 오목한 1/4 원 (법선은 방 안쪽)
  const n = 12, pos = [], nor = [];
  for(let s = 0; s < n; s++){ const pt = u => { const th = u / n * PI / 2; return [R0 - R0 * Math.sin(th), R0 - R0 * Math.cos(th), Math.sin(th), Math.cos(th)]; };
    const [y0, z0, ny0, nz0] = pt(s), [y1, z1, ny1, nz1] = pt(s + 1), a = -len / 2, b = len / 2;
    pos.push(a, y0, z0, a, y1, z1, b, y0, z0,  b, y0, z0, a, y1, z1, b, y1, z1);
    nor.push(0, ny0, nz0, 0, ny1, nz1, 0, ny0, nz0,  0, ny0, nz0, 0, ny1, nz1, 0, ny1, nz1); }
  const g = myGeo(new THREE.BufferGeometry()); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  K.sm(g, col, X((i0 + i1) / 2), 0, Z(0.05), null, "m");
  // 양 끝 둥근 모서리 느낌: 살짝 어두운 띠
  K.faceJ(i0, i0 + 0.12, 0.05, 0, 128, K.sh(col, -0.06), "m", 0.02); K.faceJ(i1 - 0.12, i1, 0.05, 0, 128, K.sh(col, -0.06), "m", 0.02);
}
/* 유리 칸막이 (2.5D s4Glass): axis "i" = i 고정 */
function glass(a, b, fixed, axis, h = 80, solid = 22){
  const base = D("#4A4C52", "#2A2C31"), gl = D("#C8D8EC", "#8EA0C8");
  if(axis === "i"){ B(fixed - 0.03, a, 0.06, b - a, solid, base, 0, {r:0}); K.faceI(fixed - 0.015, a, b, solid, h, gl, "glass", 0.03); B(fixed - 0.035, a, 0.07, b - a, 1.4, "metal", h, {r:0, cls:"s"});
    for(let u = a; u <= b + 1e-6; u += 0.7) B(fixed - 0.03, Math.min(u, b) - 0.02, 0.06, 0.04, h, "metal", 0, {r:0, cls:"s"}); }
  else { B(a, fixed - 0.03, b - a, 0.06, solid, base, 0, {r:0}); K.faceJ(a, b, fixed - 0.015, solid, h, gl, "glass", 0.03); B(a, fixed - 0.035, b - a, 0.07, 1.4, "metal", h, {r:0, cls:"s"});
    for(let u = a; u <= b + 1e-6; u += 0.7) B(Math.min(u, b) - 0.02, fixed - 0.03, 0.04, 0.06, h, "metal", 0, {r:0, cls:"s"}); }
}
/* 소프트박스 (aim 쪽을 봄): 몸통은 고정, 앞면 빛은 판 인스턴스 */
function softbox3(i, j, ai, aj, fn){
  tripod(i, j, 50, 0.32); B(i - 0.035, j - 0.035, 0.07, 0.07, 58, "metal", 4, {cls:"s"});
  const yaw = Math.atan2(X(ai) - X(i), Z(aj) - Z(j)), g = new THREE.Group(); g.position.set(X(i), hz(67), Z(j)); g.rotation.y = yaw; K.root.add(g);
  K.sm(K.rbox(0.76, hz(30), 0.3, 0.04), "#2A2A2C", 0, 0, 0, g, "s");
  return panel(X(i) + Math.sin(yaw) * 0.16, hz(67), Z(j) + Math.cos(yaw) * 0.16, 0.68, hz(26), 0.02, yaw, fn);
}

/* ---------- 예운옥 ---------- */
function buildYewun(){
  const cab = D("#D9CCE0", "#5A4E62");
  B(0.3, 0.05, 6.6, 0.62, 30, cab, 0, {r:0.02}); for(let i = 0.3 + 0.9; i < 6.9; i += 0.9) K.faceJ(i - 0.006, i + 0.006, 0.68, 2, 28, K.sh(cab, -0.12), "s", 0.004);
  B(0.25, 0.02, 6.7, 0.72, 2.5, D("#FAF8F4", "#BDB5A9"), 30, {r:0.01}); B(1.6, 0.15, 0.8, 0.4, 0.6, "#9EA4AB", 32, {r:0.01, cls:"s"});
  rod([2.0, 0.12, 33], [2.0, 0.12, 44], 0.015, "#C9CDD2"); rod([2.0, 0.12, 44], [2.0, 0.3, 42], 0.012, "#C9CDD2");
  B(3.4, 0.2, 0.5, 0.35, 0.8, "wood", 32.5, {r:0.01}); [[4.3, "#F2E3C6"], [4.6, "#E8A04A"], [4.9, "#72C4AE"]].forEach(([i, c]) => B(i, 0.15, 0.2, 0.2, 7, c, 32.5, {r:0.03}));
  B(5.5, 0.12, 0.45, 0.4, 9, D("#E9E4DA", "#8A847A"), 32.5, {r:0.02});
  // 냉장고
  B(7.0, 0.05, 1.1, 0.72, 88, D("#F2C9D6", "#7A5866"), 0, {r:0.04}); rod([7.2, 0.79, 50], [7.2, 0.79, 70], 0.014, "#C9CDD2"); rod([7.2, 0.79, 20], [7.2, 0.79, 44], 0.014, "#C9CDD2");
  K.faceJ(7.03, 8.07, 0.775, 46.5, 47.5, K.sh("#F2C9D6", -0.15), "s", 0.004); K.wtext("OOO", 7.55, 0.78, 78, "i", 3.2, D("#B5607E", "#F4C7D4"), null, 800);
  // 아일랜드 + 쿡탑
  B(3.0, 3.5, 3.4, 0.9, 30, D("#FFFFFF", "#7A746C"), 0, {r:0.02}); B(2.95, 3.45, 3.5, 1.0, 3, D("#F4F0EA", "#B9B1A6"), 30, {r:0.01});
  B(4.15, 3.6, 1.1, 0.7, 0.5, "#1A1A1C", 33, {r:0, cls:"s"});
  [[4.4, 3.78], [4.95, 3.78], [4.4, 4.12], [4.95, 4.12]].forEach(([i, j], k) => panel(X(i), hz(33.9), Z(j), 0.2, 0.01, 0.2, PI / 4, S => (k < 2 && W.cook) || S?.eggOn("s4_stove") ? "#FF6A3A" : "#3A3A3E"));
  B(3.2, 3.6, 0.5, 0.35, 1, "wood", 33, {r:0.01}); [3.3, 3.45, 3.6].forEach((i, k) => ball(i, 3.78, 35, 0.045, ["#E06A55", "#FFE066", "#72C4AE"][k], "m", 8));
  [3.4, 4.6, 5.8].forEach(i => { const ci = i + 0.25; disc(ci, 4.93, 0.18, 26, 2, D("#E8B5C8", "#7A5866")); B(ci - 0.03, 4.9, 0.06, 0.06, 26, "metal", 0, {r:0, cls:"s"}); disc(ci, 4.93, 0.14, 0, 1, "metal", "s"); });
  // 식탁 · 의자 6 · 꽃
  const chair = (ci, cj, back) => { B(ci - 0.24, cj - 0.22, 0.48, 0.44, 3, "wood", 15, {r:0.02}); [[-0.2, -0.18], [0.16, -0.18], [-0.2, 0.14], [0.16, 0.14]].forEach(([a, b]) => B(ci + a, cj + b, 0.05, 0.05, 15, K.sh("wood", -0.3), 0, {r:0, cls:"s"}));
    B(ci - 0.24, back ? cj - 0.24 : cj + 0.18, 0.48, 0.06, 22, K.sh("wood", -0.08), 17, {r:0.01}); };
  [3.8, 5.0, 6.2].forEach(i => { chair(i, 6.55, true); chair(i, 8.85, false); });
  B(3.3, 7.0, 3.4, 1.4, 3, D("#B98B55", "#6B4A34"), 22, {r:0.03}); [[3.45, 7.1], [6.5, 7.1], [3.45, 8.25], [6.5, 8.25]].forEach(([a, b]) => B(a, b, 0.08, 0.08, 22, K.sh("wood", -0.3), 0, {r:0, cls:"s"}));
  B(4.85, 7.55, 0.3, 0.3, 7, "#FFFFFF", 25, {r:0.05}); [[-0.12, -0.05, "#F4A7B9"], [0.1, -0.08, "#FFE58A"], [0, 0.08, "#E8B5C8"], [-0.03, -0.15, "#C8B4D0"]].forEach(([di, dj, c]) => ball(5.0 + di, 7.7 + dj, 37, 0.07, c, "m", 8));
  [[3.9, 7.4], [5.9, 7.9]].forEach(([i, j]) => disc(i + 0.2, j + 0.15, 0.17, 25, 0.6, "#FFFFFF"));
  // 거실: 소파(+i를 봄) · 커피 테이블 · 암체어 · 스탠드
  const so = D("#F4E9F0", "#6A5A64"), sd = D("#EADCE6", "#5E4E58");
  B(0.55, 12.5, 0.95, 5.0, 10, so, 0, {r:0.07, seg:2}); B(0.55, 12.5, 0.28, 5.0, 26, sd, 0, {r:0.06, seg:2}); B(0.55, 12.35, 0.95, 0.2, 18, sd, 0, {r:0.06}); B(0.55, 17.45, 0.95, 0.2, 18, sd, 0, {r:0.06});
  [13.3, 14.6, 15.9].forEach(j => B(0.85, j, 0.6, 1.1, 2, D("#FBF3F7", "#74626E"), 10, {r:0.05})); [[12.8, "#C8B4D0"], [16.7, "#E8B5C8"]].forEach(([j, c]) => B(0.62, j, 0.25, 0.5, 9, c, 12, {r:0.06}));
  B(2.6, 14.0, 1.0, 2.0, 2, D("#B98B55", "#6B4A34"), 12, {r:0.03}); [[2.65, 14.05], [3.5, 14.05], [2.65, 15.9], [3.5, 15.9]].forEach(([a, b]) => B(a, b, 0.06, 0.06, 12, K.sh("wood", -0.3), 0, {r:0, cls:"s"}));
  B(2.8, 14.4, 0.45, 0.35, 2.5, "#2A2A28", 14, {r:0.01}); B(3.0, 15.3, 0.3, 0.3, 6, "#FFFFFF", 14, {r:0.05});
  B(4.7, 12.8, 0.9, 0.9, 10, D("#E9D2B0", "#6A5A48"), 0, {r:0.07}); B(5.35, 12.8, 0.25, 0.9, 24, D("#DCC39E", "#5E4E3E"), 0, {r:0.06});
  B(0.85, 11.55, 0.1, 0.1, 62, "#2A2A28", 0, {r:0, cls:"s"}); K.sm(myGeo(new THREE.CylinderGeometry(0.17, 0.27, hz(12), 16, 1, true)), D("#F7F1E6", "#D9CDB8"), X(0.9), hz(66), Z(11.6), null, "glow");
  [[1.2, 10.4], [11.3, 13.3], [1.1, 19.3]].forEach(([i, j]) => tree(i, j, 0.95));
  { const lc = D("#D9C6E0", "#6E5A78"), lb = D("#C8B4D0", "#5E4C68");   // 노라 이사님 자리 (2026-11-22 2F → 4F 예운옥)
    B(5.65, 18.4, 0.8, 0.75, 10, lc, 0, {r:0.07}); B(5.65, 18.4, 0.22, 0.75, 26, lb, 0, {r:0.06}); B(5.65, 18.3, 0.8, 0.12, 17, lb, 0, {r:0.05}); B(5.65, 19.12, 0.8, 0.12, 17, lb, 0, {r:0.05});
    B(5.75, 19.35, 0.42, 0.4, 14, "wood", 0, {r:0.03}); B(5.82, 19.42, 0.22, 0.16, 1, "#2A2A28", 14, {r:0.01}); disc(6.09, 19.5, 0.06, 14, 5, "#E8B5C8"); } K.plant(10.9, 9.2, true);
  // 무지개 구름 세트 (바닥 구름 · 구름 의자)
  K.floorCloud(9.2, 1.4, 1.05); K.floorCloud(10.9, 1.0, 0.85); K.floorCloud(10.1, 2.1, 0.7);
  B(11.1, 2.4, 0.35, 0.35, 10, "#FFFFFF", 0, {r:0.08}); RB.forEach((c, k) => ball(11.15 + k * 0.05, 2.57 - k * 0.05, 18 + Math.sin(k) * 2, 0.05, c, "m", 8));
  // 칸막이: 홀 쪽 유리 · 백록당 쪽 낮은 벽 + 유리
  glass(9.0, 11.0, 11.8, "i"); glass(12.4, GJ, 11.8, "i");
  B(11.8, 0, 0.55, 9.0, 30, D("#F2E3EA", "#4A3A41"), 0, {r:0}); K.faceI(12.33, 0, 9, 30, 92, D("#C8D8EC", "#8EA0C8"), "glass", 0.03); B(12.3, 0, 0.08, 9, 1.4, "metal", 92, {r:0, cls:"s"});
  // 펜던트
  PEND.forEach(([i, j], k) => { const zb = k < 2 ? 84 : 70;
    K.sm(myGeo(new THREE.SphereGeometry(0.2, 14, 7, 0, PI * 2, 0, PI / 2)), D("#E8B5C8", "#B98799"), X(i), hz(zb), Z(j), null, "s").scale.y = 0.7;
    K.sm(K.cyl(0.17, 0.17, 0.01, 14), D("#FFF3D6", "#FFD9A0"), X(i), hz(zb) - 0.004, Z(j), null, "glow"); rod([i, j, zb], [i, j, HI], 0.006, "metal"); });
}
/* ---------- 백록당 ---------- */
function buildBaek(){
  const wl = S => { const c = S?.crews.baek; return !!c && S.live("baek") && c.cyc === "w"; }, gl = S => { const c = S?.crews.baek; return !!c && S.live("baek") && c.cyc === "g"; };
  const lit = (on, fl) => S => on(S) || (fl && S?.flash("baek") && on(S)) ? "#FFFDF4" : null;
  softbox3(13.7, 2.9, 16.6, 1.4, lit(wl)); softbox3(19.5, 3.3, 16.6, 1.4, lit(wl, true));
  softbox3(22.3, 3.3, 24.8, 1.4, lit(gl)); softbox3(27.4, 3.0, 24.8, 1.4, lit(gl, true));
  // 대형 옥타 (−j를 봄)
  tripod(14.3, 5.0, 58, 0.34); B(14.265, 4.965, 0.07, 0.07, 64, "metal", 4, {cls:"s"});
  { const g = myGeo(new THREE.CylinderGeometry(0.62, 0.62, 0.22, 8)); g.rotateX(PI / 2); g.rotateZ(PI / 8); K.sm(g, "#1E1E20", X(14.3), hz(78), Z(5.05), null, "s");
    const f = new THREE.CylinderGeometry(0.56, 0.56, 0.02, 8); f.rotateX(PI / 2); f.rotateZ(PI / 8);
    W.octa = new THREE.Mesh(f, K.cutaway(new THREE.MeshBasicMaterial({color:0xF2F0EA, toneMapped:false}))); W.octa.position.set(X(14.3), hz(78), Z(4.93)); K.R.scene.add(W.octa); }
  // C스탠드 · 카메라 2 · 테더 카트 · 감독 의자
  tripod(19.7, 5.4, 20, 0.36); rod([19.7, 5.4, 20], [19.7, 5.4, 84], 0.016, "metal"); rod([19.7, 5.4, 80], [20.4, 5.0, 82], 0.012, "metal");
  K.faceJ(20.25, 20.95, 4.98, 66, 92, "#1E1E20", "s", 0.01);
  K.camRig(16.6, 6.25); K.camRig(24.8, 6.25);
  B(18.9, 6.85, 0.8, 0.5, 2, "#2A2A2C", 26, {r:0.01}); [[18.95, 6.9], [19.6, 6.9], [18.95, 7.28], [19.6, 7.28]].forEach(([a, b]) => B(a, b, 0.05, 0.05, 26, "metal", 0, {r:0, cls:"s"}));
  B(19.0, 6.95, 0.6, 0.4, 1, "#C8C8C8", 28, {r:0.01}); B(19.0, 6.95, 0.6, 0.03, 9, "#B5B5B5", 29, {r:0, cls:"s"});
  [[19.05, 7.95], [27.3, 8.05]].forEach(([i, j]) => { B(i, j, 0.5, 0.45, 3, "#2A2A2C", 13, {r:0.02}); B(i + 0.22, j + 0.17, 0.06, 0.06, 13, "metal", 0, {r:0, cls:"s"}); disc(i + 0.25, j + 0.22, 0.2, 0, 1, "metal", "s"); });
  // DIT 카트
  B(26.95, 6.6, 1.1, 0.6, 3, "#2A2A2C", 30, {r:0.01}); [[27.0, 6.65], [27.95, 6.65], [27.0, 7.12], [27.95, 7.12]].forEach(([a, b]) => { B(a, b, 0.05, 0.05, 30, "metal", 0, {r:0, cls:"s"}); ball(a + 0.02, b + 0.02, 2, 0.05, "#1A1A1A", "s", 8); });
  B(27.0, 6.65, 1.0, 0.5, 2, "#38383B", 12, {r:0}); B(27.1, 6.72, 0.85, 0.06, 20, "#1E1E20", 33, {r:0.01, cls:"s"}); B(27.25, 6.75, 0.3, 0.2, 5, "#2A2A2C", 33, {r:0.01});
  K.wtext("DIT", 27.5, 7.205, 26, "i", 3, "#E8A04A", null, 800);
  // 배경지 거치대
  B(20.35, 0.15, 0.06, 0.06, 104, "metal", 0, {r:0, cls:"s"}); B(20.95, 0.15, 0.06, 0.06, 104, "metal", 0, {r:0, cls:"s"}); B(20.35, 0.15, 0.66, 0.06, 2, "metal", 102, {r:0, cls:"s"});
  [["#FFFFFF", 92], ["#9EA4AB", 84], ["#2A2A28", 76], ["#F4A7B9", 68], ["#A8DCC8", 60], ["#FFE066", 52], ["#7FA7D9", 44]].forEach(([c, z]) => { const g = K.cyl(0.085, 0.085, 0.56, 12); g.rotateZ(PI / 2);
    K.sm(g, c, X(20.68), hz(z + 2.5), Z(0.33), null, "m"); });
  // 조명 그리드 (z 138) · 등기구
  const gz = 138, gc = D("#5A5D63", "#2A2C30");
  [1.0, 4.6, 8.2].forEach(j => rod([12.8, j, gz], [GI - 0.4, j, gz], 0.018, gc)); [13.2, 17.0, 20.65, 24.8, 28.4].forEach(i => rod([i, 1.0, gz], [i, 8.2, gz], 0.016, gc));
  GRID.forEach(([i, j]) => { B(i - 0.12, j - 0.12, 0.24, 0.24, 10, "#1E1E20", gz - 12, {r:0.02, cls:"s"});
    panel(X(i), hz(gz - 12) - 0.004, Z(j), 0.2, 0.006, 0.2, 0, S => (i < 20.65 ? S?.crews.baek.cyc === "w" : S?.crews.baek.cyc === "g") && S?.live("baek") ? "#FFF6DC" : "#3A3A3E"); });
  // 복도 쪽 유리 (문 두 곳)
  glass(12.4, 16.0, 9.0, "j"); glass(17.2, 24.2, 9.0, "j"); glass(25.4, GI, 9.0, "j");
}
/* ---------- 홀 · 엘리베이터 ---------- */
function buildHall(){
  const stone = D("#D8D0C4", "#3A3631");
  B(12.0, 16.35, 0.92, 2.7, 84, stone, 0, {r:0.02}); B(11.95, 16.3, 1.02, 2.8, 3, K.sh(stone, -0.1), 84, {r:0.02});
  [[16.6, 17.6], [17.8, 18.8]].forEach(([a, b]) => { K.faceI(12.92, a - 0.08, b + 0.08, 0, 60, D("#A9A196", "#57514A"), "s", 0.02); K.faceI(12.935, a, b, 0, 56, D("#E8D2A8", "#B89A6A"), "glow", 0.004); });
  K.faceI(12.92, 17.62, 17.78, 26, 37, D("#BDB5A9", "#4A453F"), "s", 0.015);
  K.wtext("ELEVATOR", 12.93, 17.7, 77.5, "j", 4.2, "ink-2", null, 800);
  K.wtext("▲ 옥상", 12.93, 17.1, 71.2, "j", 2.7, D("#A9601A", "#E8A04A"), null, 700, K.FONT); K.wtext("▼ 복지층", 12.93, 18.3, 71.2, "j", 2.7, D("#A9601A", "#E8A04A"), null, 700, K.FONT);
  [[14.25, 11.0], [15.35, 11.0], [14.25, 11.3], [15.35, 11.3]].forEach(([a, b]) => B(a, b, 0.07, 0.07, 9, "metal", 0, {cls:"s"}));
  B(14.2, 10.95, 1.3, 0.45, 2.4, "wood", 9, {r:0.03});
  K.plant(15.9, 19.5, true); K.plant(12.3, 11.0, false);
  glass(10.4, 17.7, 16.4, "i"); glass(18.9, GJ, 16.4, "i");
}
/* ---------- 필름스쿨 ---------- */
function buildSchool(){
  // 앞 벽 · 큰 화면 (리졸브 컬러 페이지는 움직이는 그림판)
  B(16.4, 10.4, GI - 16.4, 0.12, 30, D("#E9DDCF", "#4A3E34"), 0, {r:0});
  B(17.6, 10.42, 5.2, 0.08, 52, "#141416", 24, {r:0.01, cls:"s"});
  K.wtext("CREYONG FILM SCHOOL", 25.6, 10.53, 23, "i", 4.6, D("#8B5A3C", "#E9C9A8"), null, 800);
  K.wtext("다빈치 리졸브 원데이 클래스", 25.6, 10.53, 16, "i", 3.4, D("#8B5A3C", "#C9A88A"), null, 700, K.FONT);
  // 강사 자리
  B(16.95, 11.05, 0.6, 0.45, 30, "wood", 0, {r:0.02}); B(16.9, 11.0, 0.7, 0.55, 2, K.sh("wood", -0.15), 30, {r:0.01}); B(17.05, 11.1, 0.4, 0.3, 1, "#C8C8C8", 32, {r:0.01});
  B(17.05, 11.1, 0.4, 0.03, 7, "#B5B5B5", 33, {r:0, cls:"s"});
  // 학생 책상 12 · 의자
  const col = K.sh("c-school", -0.1);
  DESKS.forEach(([ti, js]) => {
    [[0.05, 0.05], [0.93, 0.05], [0.05, 0.63], [0.93, 0.63]].forEach(([a, b]) => B(ti + a, js + b, 0.06, 0.06, 15, "metal", 0, {cls:"s"}));
    B(ti, js, 1.05, 0.75, 3, "wood", 15, {r:0.03});
    B(ti + 0.48, js + 0.18, 0.1, 0.08, 9, "metal", 18, {cls:"s"}); B(ti + 0.15, js + 0.1, 0.75, 0.07, 19, "#2A2A2A", 26, {cls:"s", r:0.02});
    B(ti + 0.25, js + 0.45, 0.5, 0.18, 0.6, "#3A3A3E", 18, {r:0.01});
    const ci = ti + 0.52, cj = js + 1.15;
    B(ci - 0.04, cj - 0.04, 0.08, 0.08, 11, "metal", 0, {cls:"s"}); B(ci - 0.26, cj - 0.22, 0.52, 0.46, 3, col, 11, {r:0.06}); B(ci - 0.26, cj + 0.2, 0.52, 0.08, 22, K.sh(col, 0.08), 12, {r:0.04});
  });
  // 조교 · 탈잉 자리
  Object.entries(PD_DESK).forEach(([id, [di, dj, dw, dd]]) => {
    B(di, dj, dw, dd, 3, "wood", 22, {r:0.03}); [[0.05, 0.05], [dw - 0.12, 0.05], [0.05, dd - 0.12], [dw - 0.12, dd - 0.12]].forEach(([a, b]) => B(di + a, dj + b, 0.07, 0.07, 22, "metal", 0, {cls:"s"}));
    B(di + 0.3, dj + 0.1, dw - 0.6, 0.07, 22, "#2A2A2A", 30, {cls:"s", r:0.01}); B(di + dw / 2 - 0.06, dj + 0.17, 0.12, 0.08, 8, "metal", 25, {cls:"s"});
    if(id === "class"){ B(di + 0.25, dj + 0.45, 0.45, 0.32, 3, "c-school", 25, {r:0.02}); B(di + 1.4, dj + 0.5, 0.18, 0.18, 5, "#FFFFFF", 25, {r:0.04}); }
    else if(id === "studio"){ B(di + 0.2, dj + 0.45, 0.5, 0.36, 2, D("#C8B4D0", "#8E7A99"), 25, {r:0.02}); disc(di + 1.5, dj + 0.55, 0.13, 25, 9, "#E8B5C8"); }   // 대관 일정표 · 핑크 머그
    else if(id === "promo"){ B(di + 0.25, dj + 0.45, 0.34, 0.26, 1, "#FFFFFF", 25, {r:0}); B(di + 0.27, dj + 0.47, 0.3, 0.22, 1, "c-studio", 26, {r:0}); B(di + 1.4, dj + 0.45, 0.12, 0.2, 7, "#2A2A28", 25, {r:0.02}); }   // 홍보 전단 · 폰
    else { B(di + 1.35, dj + 0.3, 0.06, 0.06, 18, "#2A2A28", 25, {r:0, cls:"s"}); ball(di + 1.38, dj + 0.33, 44, 0.06, "#2A2A28", "s", 8); }
    const si = di + dw / 2, sj = dj + dd + 0.45, cc = id === "studio" || id === "promo" ? K.sh("c-lilac", -0.15) : col;
    B(si - 0.04, sj - 0.04, 0.08, 0.08, 11, "metal", 0, {cls:"s"}); B(si - 0.27, sj - 0.22, 0.54, 0.46, 3, cc, 11, {r:0.06}); B(si - 0.27, sj + 0.2, 0.54, 0.08, 24, K.sh(cc, 0.08), 12, {r:0.04});
  });
  // 탈잉 VOD 녹화 코너: 흡음 벽 · 사인 · 링라이트
  B(25.9, 15.62, 2.9, 0.14, 74, "#2B2B2F", 0, {r:0.01});
  K.decal(300, 230, (c, w, h) => { for(let x = 0; x < w; x += 22) for(let y = 0; y < h; y += 22){ c.fillStyle = (x / 22 + y / 22) % 2 ? "#3A3A40" : "#323238"; c.beginPath(); c.moveTo(x, y + 22); c.lineTo(x + 11, y); c.lineTo(x + 22, y + 22); c.fill(); } }, 2.8, hz(52), "i", 27.35, 15.76, hz(30));
  K.faceJ(26.4, 28.3, 15.77, 58, 66, "#141416", "s", 0.01); K.wtext("TALING VOD", 27.35, 15.79, 62, "i", 4.4, "#FFD9B0", "#E8A04A", 800);
  tripod(28.45, 17.0, 48, 0.25);
  { const g = new THREE.TorusGeometry(0.3, 0.035, 8, 28); W.ring = new THREE.Mesh(g, K.cutaway(new THREE.MeshBasicMaterial({color:0xC9C5BC, toneMapped:false}))); W.ring.position.set(X(28.45), hz(58), Z(17.0)); W.ring.rotation.y = -PI / 4; K.R.scene.add(W.ring); }
  B(28.0, 19.1, 0.6, 0.6, 30, "wood", 0, {r:0.02}); [[6, "#E8A04A"], [16, "#8B5A3C"]].forEach(([z, c]) => B(28.05, 19.65, 0.5, 0.06, 6, c, z, {r:0.01}));
}
/* ---------- 분장실 · 장비 대여실 ---------- */
function buildMakeup(){
  B(GI, 5.32, WI - GI, 0.1, 62, D("#EEDDF0", "#4E4254"), 0, {r:0}); B(GI, 5.3, WI - GI, 0.14, 1.5, "wall-top", 62, {r:0});
  K.faceJ(29.65, 30.85, 5.43, 0, 56, D("#2A2A28", "#141416"), "m", 0.01);
  VANITY.forEach(([a, b]) => K.faceJ(a, b, 5.43, 30, 58, D("#DCE6EE", "#5A6470"), "glass", 0.01));
  B(31.0, 5.45, 4.6, 0.5, 26, D("#FFFFFF", "#6A646C"), 0, {r:0.02}); B(30.95, 5.42, 4.7, 0.56, 1.6, D("#F4C7D4", "#7A5866"), 26, {r:0.01});
  [[31.6, "#F4A7B9"], [32.5, "#FFFFFF"], [33.9, "#C8B4D0"], [34.7, "#2A2A28"]].forEach(([i, c]) => B(i, 5.6, 0.12, 0.12, 5, c, 27.6, {r:0.03})); B(32.9, 5.55, 0.35, 0.25, 1.5, "#E8C77A", 27.6, {r:0.01});
  [32.2, 34.4].forEach(ci => { B(ci - 0.04, 6.56, 0.08, 0.08, 13, "metal", 0, {cls:"s"}); disc(ci, 6.6, 0.26, 13, 2, D("#E8B5C8", "#7A5866")); disc(ci, 6.6, 0.2, 0, 1, "metal", "s"); });
  const sf = D("#C8B4D0", "#5A4E62"), sb = D("#B9A3C4", "#4E4258");
  B(29.05, 10.6, 0.85, 3.2, 11, sf, 0, {r:0.07, seg:2}); B(29.05, 10.6, 0.25, 3.2, 26, sb, 0, {r:0.06, seg:2}); B(29.05, 10.45, 0.85, 0.18, 18, sb, 0, {r:0.06}); B(29.05, 13.72, 0.85, 0.18, 18, sb, 0, {r:0.06});
  [11.0, 12.15].forEach(j => B(29.3, j, 0.55, 1.05, 2, D("#D6C6DE", "#665A70"), 11, {r:0.05})); B(29.35, 13.1, 0.2, 0.45, 8, "#E8B5C8", 13, {r:0.05});
  B(30.3, 11.8, 0.6, 0.6, 10, D("#FFFFFF", "#6A646C"), 0, {r:0.05}); B(30.4, 11.9, 0.22, 0.22, 4, "#E06A55", 10, {r:0.04}); disc(30.68, 12.08, 0.08, 10, 6, "#FFFFFF");
  // 의상 행거 (옷은 움직이는 상자)
  B(30.9, 13.85, 0.05, 0.05, 72, "metal", 0, {r:0, cls:"s"}); B(33.3, 13.85, 0.05, 0.05, 72, "metal", 0, {r:0, cls:"s"}); B(30.9, 13.85, 2.45, 0.05, 1.5, "metal", 70, {r:0, cls:"s"});   // 탈의실 앞을 비우려고 소파 옆 벽쪽으로
  [[30.9, 13.7], [33.3, 13.7]].forEach(([i, j]) => B(i - 0.2, j, 0.45, 0.35, 2, "metal", 0, {r:0, cls:"s"}));
  K.plant(35.45, 13.95, true);
  // 탈의실 두 칸 (2026-11-22 감독님 "분장실에 옷 갈아입는 곳"): 뒷벽 · 칸막이 · 지붕 · 안쪽 전신 거울 · 커튼은 animate에서
  const fr = D("#FFFFFF", "#6A646C");
  B(33.6, 10.26, 2.4, 0.06, 70, D("#F4ECF2", "#4E4254"), 0, {r:0});
  BOOTH.forEach(([a, b]) => K.faceJ(a + 0.13, b - 0.13, 10.33, 18, 64, D("#DCE6EE", "#5A6470"), "glass", 0.004));
  [33.6, 34.8, 35.96].forEach(i => B(i - 0.02, 10.3, 0.06, 1.3, 70, fr, 0, {r:0}));
  B(33.58, 10.28, 2.44, 1.34, 4, fr, 70, {r:0.01});
  K.wtext("FITTING ROOM", 34.8, 11.63, 72, "i", 3.2, D("#8E7A99", "#E6DCEB"), null, 800);
  glass(5.4, 9.2, GI, "i", 70, 30); glass(10.2, CH, GI, "i", 40, 40);
}
function buildGear(){
  const sh = D("#4A4C50", "#2E3033");
  [29.4, 31.5, 33.6].forEach((a, u) => { [0, 28, 56, 84].forEach(z => B(a, 0.05, 2.0, 0.6, 2, sh, z, {r:0})); [a, a + 1.94].forEach(i => B(i, 0.05, 0.06, 0.6, 92, sh, 0, {r:0, cls:"s"}));
    if(u === 0) [29.7, 30.4, 31.1].forEach((i, k) => { B(i, 0.15, 0.42, 0.4, 16, "#2A2A2C", 58, {r:0.02}); B(i + 0.06, 0.2, 0.3, 0.3, 2, "#FFF6E0", 74, {r:0}); B(i, 0.15, 0.42, 0.4, 14, k === 1 ? "#E8A04A" : "#3A3A3E", 30, {r:0.02}); });
    if(u === 1){ [31.7, 32.35, 33.0].forEach((i, k) => { B(i, 0.2, 0.42, 0.32, 10, "#1D1D1F", 58, {r:0.02}); const g = K.cyl(0.07, 0.08, 0.2, 12); g.rotateX(PI / 2); K.sm(g, "#303033", X(i + 0.21), hz(63), Z(0.62), null, "s"); B(i, 0.2, 0.42, 0.3, 12, ["#E8A04A", "#FFFFFF", "#3A8A78"][k], 30, {r:0.02}); });
      [31.65, 31.95, 32.25, 32.55, 32.85, 33.15].forEach((i, k) => { const h = 7 + (k % 3) * 2; K.sm(K.cyl(0.08, 0.08, hz(h), 12), "#2A2A2C", X(i + 0.1), hz(86 + h / 2), Z(0.35), null, "s"); }); }
    if(u === 2){ [33.8, 34.5, 35.15].forEach((i, k) => { B(i, 0.15, 0.55, 0.45, 18, ["#F2E3C6", "#E8A04A", "#FFFFFF"][k], 30, {r:0.02}); K.faceJ(i + 0.1, i + 0.45, 0.6, 38, 42, "#2A2A28", "s", 0.004); });
      [33.8, 34.4, 35.0].forEach((i, k) => B(i, 0.15, 0.5, 0.4, 14, ["#E06A55", "#3A3A3E", "#C8B4D0"][k], 58, {r:0.02})); }
  });
  K.wtext("REVIEWED", 30.4, 0.66, 48, "i", 2.6, "#E8A04A", null, 800); K.wtext("크레용팜 협찬 리뷰", 32.35, 0.66, 48, "i", 2.4, D("#E9E4DA", "#C9C3B8"), null, 700, K.FONT);
  // 대여 카운터
  B(30.8, 2.2, 2.6, 0.6, 30, D("#2A2A2C", "#1E1E20"), 0, {r:0.02}); K.faceJ(30.8, 33.4, 2.81, 4, 8, "#E8A04A", "m", 0.006); B(30.75, 2.15, 2.7, 0.7, 2, D("#3A3A3E", "#2A2A2E"), 30, {r:0.01});
  B(31.2, 2.35, 0.4, 0.3, 1, "#C8C8C8", 32, {r:0.01}); B(31.2, 2.35, 0.4, 0.03, 6, "#B5B5B5", 33, {r:0, cls:"s"}); B(32.3, 2.35, 0.6, 0.4, 0.8, "#FFFFFF", 32, {r:0});
  K.wtext("24시간 대여 · 반납", 32.1, 2.81, 15, "i", 3, "#2A2A28", null, 800, K.FONT);
  [[34.7, 2.0], [35.1, 2.2], [35.4, 2.6], [34.9, 3.2], [35.35, 3.6]].forEach(([i, j]) => { rod([i, j, 0], [i, j, 96], 0.014, "metal"); rod([i, j, 1], [i - 0.15, j + 0.2, 0], 0.01, "metal"); });
  glass(0, 5.4, WI, "i", 26, 26);
}
function buildLamps(){
  const glowC = D("#FFF3D6", "#FFD9A0");
  const dome = myGeo(new THREE.SphereGeometry(0.2, 14, 7, 0, PI * 2, 0, PI / 2));
  DOMES.forEach(([i, j]) => { const y = hz(102), top = i > GI ? hz(WALL) : hz(HI);
    K.sm(dome, "#2A2A28", X(i), y, Z(j), null, "s").scale.y = 0.75; K.sm(K.cyl(0.17, 0.17, 0.012, 14), glowC, X(i), y - 0.005, Z(j), null, "glow");
    K.sm(K.cyl(0.008, 0.008, top - y, 4), "metal", X(i), (y + top) / 2, Z(j), null, "s"); });
}

/* ---------- 움직이는 물건 ---------- */
function drawResolve(c, w, h, S, tm){ const cv = window.s4Resolve?.(tm); if(cv) c.drawImage(cv, 0, 0, w, h); else { c.fillStyle = "#1E1F22"; c.fillRect(0, 0, w, h); } }
function drawStuMon(c, w, h, S, tm, k){
  if(!S?.cls){ c.fillStyle = K.R.dark ? "#2E3B4E" : "#33445A"; c.fillRect(0, 0, w, h); return; }
  const cv = window.s4Resolve?.(tm); if(cv) c.drawImage(cv, 0, 0, w, h);
  c.fillStyle = "rgba(255,255,255,.08)"; c.fillRect(0, 0, w, h * 0.1);
}
function drawPdMon(c, w, h, S, id){ const st = S?.status(id) || "idle"; c.fillStyle = st === "idle" ? (K.R.dark ? "#2F3540" : "#3E4651") : K.ST_COLOR[st] || "#3E4651"; c.fillRect(0, 0, w, h);
  if(st !== "idle"){ c.fillStyle = "rgba(255,255,255,.35)"; [0.2, 0.42, 0.64].forEach((y, k) => c.fillRect(w * 0.1, h * y, w * (0.7 - k * 0.15), h * 0.08)); } }
function drawDit(c, w, h, S){ const on = !!S && S.live("baek") && S.crews.baek.cyc === "g" || S?.eggOn("s4_dit"); c.fillStyle = on ? "#3E8E5E" : "#2A2A2E"; c.fillRect(0, 0, w, h);
  if(on){ c.fillStyle = "#F0CDB2"; c.beginPath(); c.arc(w / 2, h * 0.42, h * 0.14, 0, 7); c.fill(); c.fillRect(w / 2 - h * 0.1, h * 0.55, h * 0.2, h * 0.3); } }
function drawInd(c, w, h, which, S){
  c.fillStyle = "#141414"; c.fillRect(0, 0, w, h); const o = which === "a" ? W.doorA : W.doorB;
  c.textAlign = "center"; c.textBaseline = "middle"; c.font = `800 ${h * 0.6}px ${K.FONT}`; c.shadowColor = "#FF9A2E"; c.shadowBlur = h * 0.3; c.fillStyle = "#FFB547";
  c.fillText(o > 0.5 ? "도착" : which === "a" ? "▲ 5F" : "▼ 3F", w / 2, h * 0.54); c.shadowBlur = 0;
}
function drawCall(c, w, h){ [[0.25, W.doorB > 0.3], [0.62, W.doorA > 0.3]].forEach(([fy, lit]) => { c.fillStyle = lit ? "#FFB547" : "#E6E1D8"; c.beginPath(); c.arc(w / 2, fy * h, w * 0.32, 0, 7); c.fill(); }); }
function drawOnAir(c, w, h, S){ const on = S?.status("taling") === "working" || S?.eggOn("s4_vod"); c.fillStyle = on ? "#E5463B" : "#4A2A2A"; c.fillRect(0, 0, w, h);
  c.fillStyle = "#FFFFFF"; c.font = `800 ${h * 0.62}px ${K.SIGN}`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("ON AIR", w / 2, h * 0.55); }

function buildDynamic(){
  const R = K.R, scene = R.scene;
  W.dcv = document.createElement("canvas"); W.dcv.width = DW; W.dcv.height = DH; W.dctx = W.dcv.getContext("2d");
  W.dtex = new THREE.CanvasTexture(W.dcv); W.dtex.colorSpace = THREE.SRGBColorSpace; W.dtex.anisotropy = 4;
  dplane(480, 264, 5.0, hz(47.5), "i", 20.2, 10.5, hz(50.25), drawResolve, 0.025);
  DESKS.forEach(([ti, js], k) => dplane(64, 36, 0.66, hz(16), "i", ti + 0.525, js + 0.175, hz(35.5), (c, w, h, S, tm) => drawStuMon(c, w, h, S, tm, k), 0.012));
  Object.entries(PD_DESK).forEach(([id, [di, dj, dw]]) => dplane(96, 40, dw - 0.7, hz(18), "i", di + dw / 2, dj + 0.17, hz(41), (c, w, h, S) => drawPdMon(c, w, h, S, id), 0.012));
  dplane(80, 36, 0.78, hz(17), "i", 27.525, 6.78, hz(43), drawDit, 0.012);
  dplane(60, 24, 0.35, hz(4), "i", 28.52, 15.77, hz(68), drawOnAir, 0.03);
  [[16.6, 17.6, "a"], [17.8, 18.8, "b"]].forEach(([a, b, w]) => dplane(96, 30, 0.64, hz(6.5), "j", 12.92, (a + b) / 2, hz(65.25), (c, ww, hh, S) => drawInd(c, ww, hh, w, S), 0.03));
  dplane(18, 40, 0.16, hz(11), "j", 12.935, 17.7, hz(31.5), drawCall, 0.02);
  const dg = mergeGeometries(W.dgeo, false); W.dgeo.forEach(g => g.dispose());
  const dm = new THREE.Mesh(dg, K.cutaway(new THREE.MeshBasicMaterial({map:W.dtex, transparent:true, toneMapped:false, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-3})));
  dm.renderOrder = 2; scene.add(dm);
  // 예운옥 촬영팀 장비 (팀이 있을 때만): 카메라 · 소프트박스 · 모니터 한 덩어리씩
  { const M = Merge(), leg = (a) => { const g = K.cyl(0.012, 0.012, hz(42), 5); M.add(g, "metal", Math.cos(a) * 0.16, hz(21), Math.sin(a) * 0.16, Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35); };
    [0, 2.1, 4.2].forEach(leg); M.add(K.rbox(0.08, hz(40), 0.08, 0), "metal", 0, hz(20), 0);
    M.add(K.rbox(0.26, hz(13), 0.5, 0.03), "#1D1D1F", 0, hz(46), 0); const lens = K.cyl(0.08, 0.09, 0.22, 12); lens.rotateX(PI / 2); M.add(lens, "#303033", 0, hz(46), -0.34);
    W.yCam = dynMesh(M.geo()); }
  { const M = Merge(); [0, 2.1, 4.2].forEach(a => M.add(K.cyl(0.012, 0.012, hz(56), 5), "metal", Math.cos(a) * 0.2, hz(28), Math.sin(a) * 0.2, Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35));
    M.add(K.rbox(0.07, hz(60), 0.07, 0), "metal", 0, hz(32), 0); M.add(K.rbox(0.76, hz(30), 0.3, 0.04), "#2A2A2C", 0, hz(67), 0); W.yBox = dynMesh(M.geo());
    W.yBoxPan = panel(0, -50, 0, 0.68, hz(26), 0.02, 0, () => W.yBoxOn ? "#FFFDF4" : null); }
  { const M = Merge(); [0, 2.1, 4.2].forEach(a => M.add(K.cyl(0.01, 0.01, hz(34), 5), "metal", Math.cos(a) * 0.14, hz(17), Math.sin(a) * 0.14, Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35));
    M.add(K.rbox(0.06, hz(42), 0.06, 0), "metal", 0, hz(21), 0); M.add(K.rbox(0.64, hz(22), 0.08, 0.01), "#1E1E20", 0, hz(51), 0); W.yMon = dynMesh(M.geo());
    W.yMonPan = panel(0, -50, 0, 0.56, hz(17), 0.01, 0, () => W.yMonOn ? "#C98A55" : null); }
  // 빛나는 판 (인스턴스 한 덩어리)
  const pm = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), K.cutaway(new THREE.MeshBasicMaterial({toneMapped:false})), W.pan.length);
  pm.frustumCulled = false; scene.add(pm); W.pm = pm;
  // 빛 번짐 (가산 혼합 판)
  const gc = document.createElement("canvas"); gc.width = gc.height = 64; { const x = gc.getContext("2d"), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.35, "rgba(255,255,255,.45)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(0, 0, 64, 64); }
  W.gtex = new THREE.CanvasTexture(gc);
  const G = W.glows = [], gl = (i, j, zp, rpx, col, a) => G.push({p:new THREE.Vector3(X(i), hz(zp), Z(j)), s:rpx / 31.3 * 2, c:new THREE.Color(col), a});
  gl(10.05, 0.3, 112, 70, "#F06BA8", (S, tm, dk) => S?.eggOn("s4_cloud") ? 0.7 : dk || S?.night ? 0.45 : 0.18);
  gl(16.6, 1.2, 60, 150, "#FFFFFF", S => S?.flash("baek") && S.crews.baek.cyc === "w" ? 0.65 : 0);
  gl(24.8, 1.2, 60, 140, "#E8FFE8", S => S?.flash("baek") && S.crews.baek.cyc === "g" ? 0.45 : 0);
  gl(10.05, 1.6, 50, 160, "#FFFFFF", S => S?.flash("yewun") ? 0.6 : 0);
  gl(14.3, 4.6, 78, 60, "#FFF6DC", S => W.octaOn ? 0.5 : 0);
  gl(28.45, 17.0, 58, 34, "#FFF6E0", S => S?.status("taling") === "working" ? 0.55 : 0);
  gl(30.6, 0.7, 66, 60, "#FFF0C8", S => S?.eggOn("s4_light") ? 0.7 : 0);
  gl(20.2, 10.7, 50, 90, "#E8A04A", S => S?.eggOn("s4_screen") ? 0.35 : 0);
  PEND.forEach(([i, j], k) => gl(i, j, (k < 2 ? 84 : 70) - 2, 26, "#FFD68C", (S, tm, dk) => dk ? 0.42 : 0.12));
  DOMES.forEach(([i, j]) => gl(i, j, 100, 22, "#FFE2A8", (S, tm, dk) => dk ? 0.32 : 0.1));
  GRID.forEach(([i, j]) => gl(i, j, 124, 24, "#FFF6DC", S => (i < 20.65 ? S?.crews.baek.cyc === "w" : S?.crews.baek.cyc === "g") && S?.live("baek") ? 0.45 : 0));
  W.bulbs = [];   // 분장실 거울 전구
  VANITY.forEach(([a, b], q) => { for(let k = 0; k <= 6; k++) W.bulbs.push({p:new THREE.Vector3(X(a + (b - a) * k / 6), hz(59.5), Z(5.47)), q}); [34, 44, 54].forEach(z => [a, b].forEach(i => W.bulbs.push({p:new THREE.Vector3(X(i), hz(z), Z(5.47)), q}))); });
  W.bulbs.forEach(b => { gl(0, 0, 0, 9, "#FFD68C", null); const g = G[G.length - 1]; g.p = b.p; g.bulb = true; });
  const gm = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), K.cutaway(new THREE.MeshBasicMaterial({map:W.gtex, transparent:true, blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false})), G.length);
  gm.frustumCulled = false; gm.renderOrder = 3; scene.add(gm); W.gm = gm;
  const bm = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), K.cutaway(new THREE.MeshBasicMaterial({toneMapped:false})), W.bulbs.length);
  bm.frustumCulled = false; scene.add(bm); W.bm = bm;
  // 김 · 화구 불빛 (구), 냄비 · 의상 (상자)
  const FXN = 12; W.fm = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 9), K.cutaway(new THREE.MeshStandardMaterial({roughness:0.6})), FXN); W.fm.frustumCulled = false; scene.add(W.fm); W.fxN = FXN;
  W.xN = 40; W.xm = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), K.cutaway(new THREE.MeshStandardMaterial({roughness:0.5, metalness:0.1})), W.xN); W.xm.frustumCulled = false; W.xm.castShadow = true; scene.add(W.xm);
  // 스튜디오 조명 (촬영 중일 때만 켜짐)
  W.sl = [[5.5, 5.0], [20.6, 4.0]].map(([i, j]) => { const l = new THREE.PointLight(0xFFF1DC, 0, 12, 1.6); l.position.set(X(i), 3.6, Z(j)); scene.add(l); return l; });
}

/* ---------- 사람 ---------- */
let UB, UC, US;
const ub = (w, h, d) => ({g:UB, s:[w, h, d]}), uc = (r, h) => ({g:UC, s:[r, h, r]}), us = r => ({g:US, s:[r, r, r]});
function attach(P, parent, g, col, x, y, z, vis, rx = 0, ry = 0, rz = 0){
  const o = new THREE.Object3D(); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); parent.add(o);
  o.scale.set(...g.s); K.part(o, g.g, col, () => P.p.root.visible && (!vis || vis())); return o;
}
function dressUp(it){
  const {P, src} = it, p = P.p, hand = p.arms[1].el, handL = p.arms[0].el, walk = () => src.pose === "walk";
  if(it.kind === "crew"){
    if(src.k === 0) attach(P, hand, uc(0.01, 0.3), "#9EA4AB", 0, -0.38, 0.03, () => src.act === "cook" && !walk());   // 국자
    if(src.k === 0) attach(P, hand, uc(0.04, 0.09), "#FFFFFF", 0, -0.31, 0.04, () => src.act === "cup" && !walk());
    if(src.k === 1) attach(P, p.head, ub(0.24, 0.06, 0.1), "#2A2A28", 0, 0.32, 0, null);   // 촬영감독 모자 챙 대신 헤드밴드
    if(src.k === 1){ attach(P, p.chest, ub(0.2, 0.15, 0.28), "#1D1D1F", 0, 0.05, 0.42, () => src.act === "gimbal" && !walk()); attach(P, p.chest, ub(0.36, 0.03, 0.03), "#3A3A3E", 0, -0.08, 0.36, () => src.act === "gimbal" && !walk()); }   // K팝 댄스 필름 짐벌
    if(src.k === 2) attach(P, p.chest, ub(0.2, 0.02, 0.27), "#8B5A3C", 0, 0.3, 0.3, null, -0.95);   // 콘티 클립보드
    if(src.k === 3){ attach(P, hand, ub(0.34, 0.24, 0.16), "#2A2A2C", 0, -0.36, 0.12, () => !!src.held && walk()); attach(P, hand, ub(0.3, 0.2, 0.02), "#FFFDF4", 0, -0.36, 0.21, () => !!src.held && walk()); }
    if(src.k === 4){ attach(P, hand, uc(0.015, 0.16), "#2A2A28", 0, -0.33, 0.04, null); attach(P, p.hips, ub(0.18, 0.12, 0.08), "#E8B5C8", 0.2, 0.05, 0.12, null); }   // 메이크업 브러시 · 파우치
  }
  if(it.kind === "pd" && src.id === "taling") attach(P, p.head, ub(0.36, 0.05, 0.08), "#2A2A28", 0, 0.32, 0, null);
}
const smooth = (cur, want, dt, k = 8) => cur + (want - cur) * Math.min(1, dt * k);
function seatPx(src){
  if(src.s4) return 13;   // 4층 PD 의자
  if(src.id === "_nora") return 11;   // 노라 암체어
  if(src.kind === "stu" || (src.j > 10.4 && src.i > 16.4)) return 13;
  if(Math.abs(src.j - 6.6) < 0.3 && src.i > GI) return 15;   // 분장 의자
  if(src.i < 2.2 && src.j > 12) return 12;                    // 소파
  if(src.j > 7.5 && src.j < 8.6 && src.i > 12) return 16;     // 감독 의자
  return 16;
}
function headingOf(it, S){
  const s = it.src;
  if(it.kind === "nora"){ const w = s.tour?.who; if(w && !w.hidden && !w.hide && s.pose !== "walk") return Math.atan2(X(w.i) - X(s.i), Z(w.j) - Z(s.j));
    return s.pose === "sit" ? Math.atan2(X(8.6) - X(s.i), Z(18.6) - Z(s.j)) : null; }
  if(it.kind === "stu") return PI;
  if(it.kind === "pd"){ if(Math.hypot(s.i - 17.25, s.j - 10.95) < 1.2 && s.pose !== "sit") return 0; return s.pose === "sit" ? PI : null; }
  if(Math.abs(s.j - 6.6) < 0.35 && s.i > GI && s.pose === "sit") return PI;                 // 분장 거울 앞
  if(Math.abs(s.i - 30.25) < 0.4 && s.j < 2) return PI;                                    // 장비 선반
  const c = S.crews[s.zn === "s4_yewun" ? "yewun" : "baek"]; if(!c || c.st !== "shoot") return null;
  const T = c.mem[0], Cm = c.mem[1];
  if(s.k === 4 && Math.hypot(s.i - 32.95, s.j - 6.75) < 0.5) return Math.atan2(X(32.2) - X(s.i), Z(6.6) - Z(s.j));
  const tgt = s.k === 0 || s.k >= 5 ? Cm : T; if(!tgt || tgt.hidden) return null;   // 센터 · 댄서는 카메라를 봄
  return Math.atan2(X(tgt.i) - X(s.i), Z(tgt.j) - Z(s.j));
}
function poseOne(it, S, t, tm, dt){
  const {P, src} = it, p = P.p, a = src.act, ph = src.dph ?? src.phase ?? 0, red = S.reduce, o = {ph:P.ph};
  if(src.pose === "walk"){ o.step = P.step; K.pose(p, "walk", t, o); if(src.held && src.k === 3) { p.arms[1].sh.rotation.x = -0.5; p.arms[1].el.rotation.x = -0.4; } return; }
  if(src.pose === "sit"){
    if(a === "cup"){ const v = (tm * 0.0007 + ph) % 1; o.sip = v < 0.22 && !red; o.u = o.sip ? Math.sin(PI * v / 0.22) : 0; }
    if(it.kind === "stu" || it.kind === "pd") o.type = true;
    K.pose(p, "sit", t, o); p.hips.position.y = Math.max(0.35, (hz(seatPx(src)) - p.root.position.y) / p.root.scale.y + 0.08);
    if(a === "hand" && !red && Math.sin(tm * 0.0013 + ph) > 0.4){ p.arms[1].sh.rotation.set(0, 0, -2.9); p.arms[1].el.rotation.set(0, 0, -0.1); }
    return; }
  if(a === "dance" && !red) o.wave = Math.sin(tm * 0.008 + ph) > 0;
  if(a === "pose" && !red) o.wave = Math.sin(tm * 0.002 + ph) > 0.6;
  if(src.k === 2 && it.kind === "crew") o.phone = true;
  K.pose(p, "stand", t, o);
  if(a === "dance" && !red){ const k = Math.sin(tm * 0.008 + ph); p.arms.forEach((q, n) => { const s = n ? -1 : 1; q.sh.rotation.set(-0.3, 0, s * (0.6 + 1.6 * Math.max(0, n ? k : -k))); }); p.chest.rotation.z = k * 0.08; }
  if(a === "gimbal"){ p.arms.forEach((q, n) => { q.sh.rotation.set(-1.15, 0, n ? -0.32 : 0.32); q.el.rotation.set(-0.35, 0, 0); }); }
  if(a === "cook"){ const k = red ? 0 : Math.sin(tm * 0.004 + ph); p.arms[1].sh.rotation.set(-0.6 + k * 0.18, 0, -0.15); p.arms[1].el.rotation.set(-0.75, 0, 0); }
  if(it.kind === "crew" && src.k === 4 && Math.hypot(src.i - 32.95, src.j - 6.75) < 0.5 && !red){ const k = Math.sin(tm * 0.006 + ph); p.arms[1].sh.rotation.set(-1.1 + k * 0.1, 0, -0.2); p.arms[1].el.rotation.set(-0.5, 0, 0); }
  if(it.kind === "crew" && src.k === 1 && !red){ p.head.rotation.x = 0.1; }
}
function syncPeople(S, t, tm, dt){
  W.plist.forEach(it => {
    const {P, src} = it, root = P.p.root;
    const vis = !src.hidden && !src.hide && !(it.kind === "stu" && !S.cls) && !(it.kind === "nora" && !S.nOn);   // 스튜디오는 24시간 (2026-11-22)
    if(root.visible !== vis){ root.visible = vis; it.last = null; }
    if(!vis) return;
    const x = K.X(src.i), z = K.Z(src.j);
    const lx = it.last ? it.last[0] : x, lz = it.last ? it.last[1] : z, dx = x - lx, dz = z - lz, moved = Math.hypot(dx, dz);
    root.position.set(x, hz(src.z || 0), z); it.last = [x, z];
    if(moved > 1e-4 && moved < 1 && !src.strafe){ P.step = (P.step || 0) + moved * 6.4 / root.scale.y * 0.78; K.turnTo(P, Math.atan2(dx, dz), dt, 10); }
    else { const want = headingOf(it, S); if(want != null) K.turnTo(P, want, dt, 6); }
    poseOne(it, S, t, tm, dt);
    const sayTx = S.say(src); if(sayTx && !(P.pri > K.clock())){ P.say = sayTx; P.sayUntil = K.clock() + 400; }
    const d = it.kind === "pd" ? S.task(src.id) : typeof src.desc === "function" ? src.desc() : src.desc || "";
    if(P.info.task !== d) P.info.task = d;
  });
}

/* ---------- 매 프레임 ---------- */
const m4 = new THREE.Matrix4(), qn = new THREE.Quaternion(), v3 = new THREE.Vector3(), sc3 = new THREE.Vector3(), col = new THREE.Color(), e3 = new THREE.Euler(), ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
function fxSet(k, x, y, z, s, c){ if(k >= W.fxN) return; if(s <= 0){ W.fm.setMatrixAt(k, ZERO); return; } m4.compose(v3.set(x, y, z), qn.identity(), sc3.set(s, s * 0.9, s)); W.fm.setMatrixAt(k, m4); W.fm.setColorAt(k, col.set(c)); }
function boxSet(k, x, y, z, sx, sy, sz, c, ry = 0, rz = 0){ if(k >= W.xN) return; if(sx <= 0){ W.xm.setMatrixAt(k, ZERO); return; } e3.set(0, ry, rz); qn.setFromEuler(e3); m4.compose(v3.set(x, y, z), qn, sc3.set(sx, sy, sz)); W.xm.setMatrixAt(k, m4); W.xm.setColorAt(k, col.set(c)); }
function animate(S, t, tm, dt){
  const dk = !!K.R.dark, red = !S || S.reduce, on = id => !!S?.eggOn(id), cy = S?.crews.yewun;
  W.cook = !!cy && cy.st === "shoot" && !!cy.type?.cook;
  // 예운옥 장비
  { const T = cy && (cy.st === "shoot" || cy.st === "arrive") ? cy.type : null, sh = cy?.st === "shoot";
    const setM = (m, at, ry) => { m.visible = !!at; if(at){ m.position.set(X(at[0]), 0, Z(at[1])); m.rotation.y = ry; } };
    const camAt = T?.Cm.rig && sh ? T.Cm.rig : null; setM(W.yCam, camAt, T?.Cm.dir === "-i" ? PI / 2 : 0);
    const boxAt = T?.L.box && cy.mem[3].held && cy.mem[3].pose !== "walk" ? T.L.box : null, tg = T ? T.T.at : [0, 0];
    const by = boxAt ? Math.atan2(X(tg[0]) - X(boxAt[0]), Z(tg[1]) - Z(boxAt[1])) : 0; setM(W.yBox, boxAt, by); W.yBoxOn = !!boxAt && sh;
    const pb = W.pan[W.yBoxPan]; if(boxAt){ pb.p.set(X(boxAt[0]) + Math.sin(by) * 0.16, hz(67), Z(boxAt[1]) + Math.cos(by) * 0.16); pb.r = by; } else pb.p.set(0, -50, 0);
    const monAt = T?.D.mon && sh ? T.D.mon : null; setM(W.yMon, monAt, 0); W.yMonOn = !!monAt;
    const pm = W.pan[W.yMonPan]; if(monAt) pm.p.set(X(monAt[0]), hz(51), Z(monAt[1]) + 0.045); else pm.p.set(0, -50, 0); }
  // 엘리베이터 문
  const kk = red ? 1 : Math.min(1, dt * 5); W.doorA += (Math.max(S?.doors.a || 0, K.yuNear?.(13.45, 17.1, 1.5) ? 1 : 0) - W.doorA) * kk; W.doorB += ((S?.doors.b || 0) - W.doorB) * kk;
  const leaf = dk ? "#8A8E94" : "#C9CDD2"; let bx = 0;
  [[16.6, 17.6, W.doorA], [17.8, 18.8, W.doorB]].forEach(([a, b, o]) => { const m = (a + b) / 2, gap = (b - a) / 2 * Math.min(1, o) * 0.94;
    [[a, m - gap], [m + gap, b]].forEach(([p0, p1]) => boxSet(bx++, K.X(12.95), hz(28), K.Z((p0 + p1) / 2), 0.03, hz(56), Math.max(0.001, p1 - p0), leaf)); });
  // 냄비 (요리 촬영 · 화구 누르면)
  const hot = W.cook || on("s4_stove");
  boxSet(bx++, X(4.42), hz(37), Z(3.8), hot ? 0.34 : 0, hz(6), 0.3, "#C9CDD2"); boxSet(bx++, X(4.95), hz(35), Z(3.82), hot ? 0.24 : 0, hz(2), 0.24, "#2A2A2C");
  // 의상 8벌 (s4_rack 누르면 흔들)
  ["#F4A7B9", "#2A2A28", "#FFFFFF", "#7FA7D9", "#E8A04A", "#C8B4D0", "#72C4AE", "#E06A55"].forEach((c, k) => { const sw = on("s4_rack") && !red ? Math.sin(tm * 0.01 + k) * 0.12 : 0;
    boxSet(bx++, X(31.15 + k * 0.28), hz(54), Z(13.88), 0.2, hz(30), 0.05, c, 0, sw); });
  // 탈의실 커튼 (사람 있으면 닫힘 + 발) · K팝 댄스 필름 스피커 · 바닥 자리 표시
  const cu = dk ? "#7A6A88" : "#C8B4D0", inB = q => !!S && ["yewun", "baek"].some(k => S.crews[k].mem.some(m => m.on && m.booth === q)) || (q === 0 && on("s4_fit"));
  BOOTH.forEach(([a, b], q) => { const shut = inB(q);
    boxSet(bx++, X(shut ? (a + b) / 2 : a + 0.13), hz(38.5), Z(11.6), shut ? b - a : 0.26, hz(61), 0.04, cu);
    [0.42, 0.7].forEach(o => boxSet(bx++, X(a + o), hz(1), Z(11.48), shut ? 0.12 : 0, hz(2), 0.2, "#2A2A28")); });
  const cb = S?.crews.baek, kp = !!cb && S.live("baek") && !!cb.type?.kpop;
  [[13.275, 0.71], [19.775, 0.76]].forEach(([i, j]) => { boxSet(bx++, X(i), hz(17), Z(j), kp ? 0.45 : 0, hz(34), 0.42, "#1D1D1F"); boxSet(bx++, X(i), hz(20), Z(j + 0.215), kp ? 0.3 : 0, hz(18), 0.01, "#3A3A3E"); });
  [[14.8, 1.8, "#F4A7B9"], [17.0, 1.8, "#7FA7D9"], [15.9, 1.2, "#FFE066"], [15.9, 2.5, "#E8A04A"]].forEach(([i, j, c]) => {
    boxSet(bx++, X(i), 0.004, Z(j), kp ? 0.32 : 0, 0.006, 0.05, c); boxSet(bx++, X(i), 0.004, Z(j), kp ? 0.05 : 0, 0.006, 0.32, c); });
  while(bx < W.xN) boxSet(bx++, 0, 0, 0, 0);
  W.xm.instanceMatrix.needsUpdate = true; if(W.xm.instanceColor) W.xm.instanceColor.needsUpdate = true;
  // 김
  let f = 0;
  for(let k = 0; k < 5; k++){ const ph = (tm * 0.0006 + k / 5) % 1, r = (2.4 + 3.4 * ph) / 31.3 * 0.55 * (1 - ph * ph * ph);
    fxSet(f++, X(4.42 + (red ? 0 : Math.sin(ph * 6 + k) * 0.06)), hz(44 + 46 * ph), Z(3.8), hot && !red ? r : 0, "#FFFFFF"); }
  while(f < W.fxN) fxSet(f++, 0, 0, 0, 0);
  W.fm.instanceMatrix.needsUpdate = true; if(W.fm.instanceColor) W.fm.instanceColor.needsUpdate = true;
  // 빛나는 판
  W.octaOn = !!S && ((S.live("baek") && S.crews.baek.cyc === "w" && !S.crews.baek.type?.flash) || (S.flash("baek") && S.crews.baek.cyc === "w") || on("s4_octa"));
  W.octa.material.color.set(W.octaOn ? "#FFFDF4" : dk ? "#A9A7A0" : "#F2F0EA");
  const vodOn = S?.status("taling") === "working"; W.ring.material.color.set(vodOn ? "#FFF6E0" : "#C9C5BC");
  W.pan.forEach((q, k) => { const c = q.fn(S, dk); e3.set(0, q.r, 0); qn.setFromEuler(e3); m4.compose(q.p, qn, q.s); W.pm.setMatrixAt(k, m4); W.pm.setColorAt(k, col.set(c || (dk ? "#77736C" : "#E8E6E2"))); });
  W.pm.instanceMatrix.needsUpdate = true; if(W.pm.instanceColor) W.pm.instanceColor.needsUpdate = true;
  // 거울 전구
  const mirrorOn = !!S && (S.live("yewun") || S.live("baek") || on("s4_mirror"));
  W.bulbs.forEach((b, k) => { m4.compose(b.p, qn.identity(), sc3.setScalar(0.04)); W.bm.setMatrixAt(k, m4); W.bm.setColorAt(k, col.set(mirrorOn ? "#FFE9B8" : "#E6E1D8")); });
  W.bm.instanceMatrix.needsUpdate = true; if(W.bm.instanceColor) W.bm.instanceColor.needsUpdate = true;
  // 빛 번짐
  const cam = K.R.camera;
  W.glows.forEach((g, k) => { const a = g.bulb ? (mirrorOn ? (dk ? 0.55 : 0.3) : 0) : g.a(S, tm, dk);
    if(!(a > 0)){ W.gm.setMatrixAt(k, ZERO); return; }
    col.copy(g.c); m4.compose(g.p, cam.quaternion, sc3.set(g.s, g.s, 1)); W.gm.setMatrixAt(k, m4); W.gm.setColorAt(k, col.multiplyScalar(Math.min(1, a))); });
  W.gm.instanceMatrix.needsUpdate = true; if(W.gm.instanceColor) W.gm.instanceColor.needsUpdate = true;
  // 스튜디오 조명
  W.sl[0].intensity = S?.live("yewun") ? (S.flash("yewun") ? 5 : 1.6) : 0;
  W.sl[1].intensity = S?.live("baek") ? (S.flash("baek") ? 6 : 1.8) : 0;
  // 그림판 (초당 10번)
  if(tm - W.dLast > 100 || W.dLast < 0){ W.dLast = tm; const c = W.dctx; c.clearRect(0, 0, DW, DH);
    W.dyn.forEach(d => { c.save(); c.beginPath(); c.rect(d.r.x, d.r.y, d.r.w, d.r.h); c.clip(); c.translate(d.r.x, d.r.y); d.draw(c, d.r.w, d.r.h, S, tm); c.restore(); });
    W.dtex.needsUpdate = true; }
}

/* ---------- 층 정의 ---------- */
const def = {
  id:"s4",
  zones:S4_Z,
  outline:[[0,0],[WI,0],[WI,CH],[GI,CH],[GI,GJ],[0,GJ]],
  ext:[0, 0, WI, GJ],
  top:5.0,
  allPts:V => [V(-0.25,0,-0.25),V(WI,0,-0.25),V(WI,-0.4,CH),V(GI,-0.4,GJ),V(-0.25,-0.4,GJ),V(-0.25,5.0,-0.25),V(GI,5.0,-0.25),V(-0.25,4.9,GJ),V(WI,3.7,0)],
  lamps:[[5.0,4.5,4.0],[3.5,15.0,4.0],[20.6,4.5,4.4],[22.7,15.0,3.2],[32.5,9.8,3.0],[32.5,2.6,3.0]],
  glow:{color:0xFF9CC8, at:[10.0,1.5,2.4]},
  eggs:[],
  people:[],
  paintFloor(c, dark){ paintFloor(c, dark); },
  build(KIT){
    K = KIT; LG.length = 0;
    W = {plist:[], recolor:[], dyn:[], dgeo:[], dA:{x:2, y:2, row:0}, dLast:-1, doorA:0, doorB:0, pan:[]};
    const S = sim();
    const L = l => ({...l, style:l.style === "cap" ? "short" : l.style});
    def.people = !S ? [] : [
      ...["yewun", "baek"].flatMap(k => S.crews[k].mem.map(m => ({id:m.id, name:m.name, role:k === "yewun" ? "예운옥 촬영팀" : "백록당 촬영팀", task:m.desc || "", hex:S.zones[m.zn].hex, look:L(m.look), at:[m.i, m.j], face:0}))),
      ...S.stu.map(s => ({id:s.id, name:s.name || "수강생", role:"다빈치 원데이 수강생", task:s.desc || "", hex:"#8B5A3C", look:L(s.look), at:[s.i, s.j], face:PI})),
      ...S.pds.map(r => ({id:r.id, name:r.name, role:r.role, task:S.task(r.id), status:S.status(r.id), look:r.look, headphones:!!r.headphones, at:[r.i, r.j], face:PI})),
      ...(S.nora ? [{id:S.nora.id, name:S.nora.name, role:S.nora.role, task:S.nora.desc, hex:S.nora.hex, look:L(S.nora.look), build:{h:0.97, w:0.88}, at:[S.nora.i, S.nora.j], face:0}] : [])];
    def.eggs = !S ? [] : [...S.eggs.map(src => ({id:src.id, emo:src.emo, lines:src.lines.length ? src.lines : ["🎙️"], get at(){ return src.at; }, say:(k, g, line) => sim()?.egg(src.id) || line})),
      {id:"_up", at:[12.95, 17.1, 40], emo:["🛗","⬆️"], lines:["▲"], elev:"up"},     // 오른쪽 문 = 위층 (2026-11-22 감독님)
      {id:"_dn", at:[12.95, 18.3, 40], emo:["🛗","⬇️"], lines:["▼"], elev:"down"}];  // 왼쪽 문 = 아래층
    buildShell(); buildYewun(); buildBaek(); buildHall(); buildSchool(); buildMakeup(); buildGear(); buildLamps();
    buildDynamic();
  },
  init(KIT){
    const R = KIT.R, S = sim(); if(!S) return;
    if(!document.getElementById("f3s4-css")){ const st = document.createElement("style"); st.id = "f3s4-css";
      st.textContent = ".f3w .t3-tag.sq:not(.on){opacity:0;pointer-events:none}"; document.head.append(st); }
    UB = KIT.rbox(1, 1, 1, 0); UC = KIT.cyl(1, 1, 1, 10); US = KIT.sph(1, 10, 8);
    const add = (src, kind) => { const P = R.people[src.id]; if(!P) return; const it = {P, src, kind}; W.plist.push(it); dressUp(it);
      if(kind === "nora") P.tag.querySelector("i").style.background = src.hex;
      else if(kind !== "pd") P.tag.classList.add("sq"); else P.tag.querySelector("i").style.background = KIT.ST_COLOR[S.status(src.id)] || KIT.ST_COLOR.idle; };
    ["yewun", "baek"].forEach(k => S.crews[k].mem.forEach(m => add(m, "crew")));
    S.stu.forEach(s => add(s, "stu")); S.pds.forEach(p => add(p, "pd")); if(S.nora) add(S.nora, "nora");
    LG.forEach(g => g.dispose()); LG.length = 0;
  },
  tick(KIT, now, t, dt){
    const S = sim(), tm = S ? S.now : now;
    if(S) syncPeople(S, t, tm, dt);
    animate(S, t, tm, dt);
  },
  theme(KIT, dark){
    if(!W) return;
    W.recolor.forEach(m => { const u = m.geometry.userData, a = m.geometry.attributes.color; if(u && u.L && a){ a.array.set(dark ? u.D : u.L); a.needsUpdate = true; } });
  },
};
export default def;
