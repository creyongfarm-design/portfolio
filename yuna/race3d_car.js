/* 레이싱 차: 모양 · 내 차 주행 · 상대 차와 일반 차 (2026-11-28)
   - 내 차는 진짜 속도·미끄러짐으로 굴러감 (핸들은 빠를수록 무겁고, 드리프트하면 뒤가 흐름, 끝나면 살짝 튕겨 나감)
   - 상대 차·일반 차는 코스 위를 따라 달림 (앞 차 피하기, 코너 앞 감속, 내 차와 너무 벌어지면 속도 맞추기) */
import * as THREE from "three";
import { mergeVertices, mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { HALF_W, LANES, at, locate } from "./race3d_path.js";

const PI = Math.PI, clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, t) => a + (b - a) * t;
const wrapA = a => { while(a > PI) a -= 2 * PI; while(a < -PI) a += 2 * PI; return a; };
export const CAR_LEN = 4.5, CAR_W = 1.9, LIM = HALF_W - 1.0;

/* ---------- 모양 ---------- */
const GEO = {};
function extr(pts, width, bevel = 0.07){
  const sh = new THREE.Shape(); pts.forEach((p, k) => k ? sh.lineTo(p[0], p[1]) : sh.moveTo(p[0], p[1])); sh.closePath();
  const g = new THREE.ExtrudeGeometry(sh, {depth:width - bevel * 2, bevelEnabled:true, bevelSize:bevel, bevelThickness:bevel, bevelSegments:2, curveSegments:4});
  g.translate(0, 0, -(width - bevel * 2) / 2); g.rotateY(-PI / 2); return g;
}
/* 스포츠카 몸통 (2026-11-28 감독님 "유나 차 너무 거칠게 생겼어" → 각진 단면 10개 대신 매끈한 곡면):
   앞에서 뒤로 56칸 · 둘레 36칸의 둥근 단면(모서리 둥근 네모)을 이어 붙이고, 바퀴 자리는 동그랗게 파냄. 유리 지붕은 따로 둥근 덮개 */
function curve(keys){   // keys = [[t, a, b, …]] (t 오름차순) → t 를 주면 [a, b, …] 를 부드럽게 이어 줌
  return t => { let i = 0; while(i < keys.length - 2 && t > keys[i + 1][0]) i++; const A = keys[Math.max(0, i - 1)], B = keys[i], C = keys[i + 1], D = keys[Math.min(keys.length - 1, i + 2)], h = C[0] - B[0], u = clamp((t - B[0]) / h, 0, 1), u2 = u * u, u3 = u2 * u;
    return B.slice(1).map((_, k) => { const p0 = A[k + 1], p1 = B[k + 1], p2 = C[k + 1], p3 = D[k + 1], m1 = (p2 - p0) / ((C[0] - A[0]) || 1), m2 = (p3 - p1) / ((D[0] - B[0]) || 1);
      return (2 * u3 - 3 * u2 + 1) * p1 + (u3 - 2 * u2 + u) * h * m1 + (-2 * u3 + 3 * u2) * p2 + (u3 - u2) * h * m2; }); };
}
const se = (c, n) => Math.sign(c) * Math.pow(Math.abs(c), 2 / n);
const BODY = curve([[0, 0.60, 0.37, 0.53], [0.10, 0.76, 0.29, 0.58], [0.35, 0.91, 0.23, 0.70], [0.89, 0.975, 0.20, 0.87], [1.45, 0.965, 0.20, 0.875], [2.25, 0.96, 0.20, 0.875], [3.05, 0.98, 0.20, 0.91], [3.59, 1.00, 0.21, 0.94], [4.15, 0.97, 0.25, 0.92], [4.40, 0.90, 0.32, 0.87], [4.50, 0.80, 0.40, 0.81]]);
const CANOPY = curve([[0, 0.60, 0], [0.10, 0.67, 0.19], [0.28, 0.705, 0.385], [0.45, 0.71, 0.43], [0.62, 0.70, 0.385], [0.82, 0.66, 0.21], [1, 0.58, 0]]);
const WHEEL_Z = [1.36, -1.34], WHEEL_Y = 0.36, ARCH_R = 0.43, CAN_Z0 = 1.02, CAN_Z1 = -1.82;
function sportBody(NU = 56, NV = 36, NS = 30, NA = 22){   // 내 차는 촘촘하게, 상대 차는 성기게 (36 · 24 · 18 · 14)
  const P = [], out = {paint:[], glass:[], dark:[]}, tri = (k, a, b, c) => out[k].push(...a, ...b, ...c), quad = (k, a, b, c, d) => { tri(k, a, b, c); tri(k, a, c, d); };
  for(let i = 0; i <= NU; i++){ const t = 4.5 * i / NU, [w, y0, y1] = BODY(t), cy = (y0 + y1) / 2, hy = (y1 - y0) / 2, row = [];
    for(let j = 0; j < NV; j++){ const th = -PI / 2 + 2 * PI * j / NV, y = cy + hy * se(Math.sin(th), 4.2), up = Math.max(0, (y - cy) / hy); const p = [w * se(Math.cos(th), 7) * (1 - 0.1 * up * up * up), y, 2.25 - t]; p.flank = Math.abs(p[0]) > 0.8 * w || (y < cy && Math.abs(p[0]) > 0.5); row.push(p); }
    P.push(row); }
  /* 바퀴 자리: 원에 걸친 면의 안쪽 점을 원 위로 밀어내고, 원 안에 다 들어간 면은 뺌 → 가장자리가 매끈한 휠 아치 */
  const arch = p => { if(!p.flank) return null; for(const z of WHEEL_Z){ const d = Math.hypot(p[2] - z, p[1] - WHEEL_Y); if(d < ARCH_R + 0.03) return [z, d]; } return null; };
  for(const row of P) for(const p of row){ const a = arch(p); p.in = !!a && a[1] < ARCH_R; p.az = a ? a[0] : null; p.ad = a ? a[1] : 0; }
  const Q = []; for(let i = 0; i < NU; i++) for(let j = 0; j < NV; j++){ const v = [P[i][j], P[i + 1][j], P[i + 1][(j + 1) % NV], P[i][(j + 1) % NV]]; if(v.every(p => p.in)) continue; if(v.some(p => p.az != null)) v.forEach(p => { if(p.az != null) p.snap = true; }); Q.push([i, j, v]); }
  for(const row of P) for(const p of row) if(p.snap && p.ad > 1e-3){ const k = ARCH_R / p.ad; p[2] = p.az + (p[2] - p.az) * k; p[1] = WHEEL_Y + (p[1] - WHEEL_Y) * k; }
  /* 면마다 색 구역: 전조등(눈매) · 앞 숨구멍 · 뒤 아래 범퍼 · 옆 숨구멍 · 바닥 */
  out.head = [];
  for(const [i, j, v] of Q){ const t = 4.5 * (i + 0.5) / NU, ax = Math.abs(v[0][0] + v[1][0] + v[2][0] + v[3][0]) / 4, y = (v[0][1] + v[1][1] + v[2][1] + v[3][1]) / 4, th = -PI / 2 + 2 * PI * (j + 0.5) / NV, tm = th > PI / 2 ? PI - th : th;   // tm: 좌우 같은 각도 (0 = 옆구리, π/2 = 윗면 가운데)
    let k = "paint";
    if(y < 0.3 && ax < 0.9) k = "dark";
    else if(t > 0.16 && t < 0.49 && tm > 0.7 && tm < 1.05) k = "head";
    else if(t < 0.2 && ax < 0.5 && y < 0.5) k = "dark";
    else if(t > 4.26 && y < 0.56) k = "dark";
    quad(k, v[0], v[1], v[2], v[3]); }
  for(const [i, flip] of [[0, false], [NU, true]]){ const r = P[i], c = [0, r.reduce((q, p) => q + p[1], 0) / NV, r[0][2]]; for(let j = 0; j < NV; j++){ const a = r[j], b = r[(j + 1) % NV], k = flip && (a[1] + b[1]) / 2 < 0.6 ? "dark" : !flip && Math.abs(a[0] + b[0]) / 2 < 0.5 && (a[1] + b[1]) / 2 < 0.46 ? "dark" : "paint"; flip ? tri(k, c, b, a) : tri(k, c, a, b); } }
  /* 유리 지붕: 앞유리 → 지붕 → 뒷유리가 한 곡면. 가운데 윗면만 차 색 */
  const Cp = [];
  for(let i = 0; i <= NS; i++){ const s = i / NS, z = CAN_Z0 + (CAN_Z1 - CAN_Z0) * s, [wc, hc] = CANOPY(s), yb = BODY(2.25 - z)[2] - 0.075, row = [];
    for(let j = 0; j <= NA; j++){ const th = PI * j / NA; row.push([wc * se(Math.cos(th), 3.6), yb + Math.max(0, hc) * se(Math.sin(th), 2.5), z]); } Cp.push(row); }
  for(let i = 0; i < NS; i++) for(let j = 0; j < NA; j++){ const s = (i + 0.5) / NS, a = (j + 0.5) / NA, roof = s > 0.3 && s < 0.6 && a > 0.28 && a < 0.72; quad(roof ? "paint" : "glass", Cp[i][j + 1], Cp[i][j], Cp[i + 1][j], Cp[i + 1][j + 1]); }
  const res = {}; for(const k in out){ let g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(out[k], 3)); g = mergeVertices(g, 1e-4); g.computeVertexNormals(); res[k] = g; } return res;
}
function geos(){
  if(GEO.ok) return GEO; GEO.ok = true;
  GEO.sp = sportBody(); GEO.spLo = sportBody(36, 24, 18, 14);
  GEO.well = new THREE.CylinderGeometry(ARCH_R + 0.012, ARCH_R + 0.012, 0.5, 26, 1, true).rotateZ(PI / 2);   // 바퀴집 안쪽 (어두운 통)
  GEO.wellCap = new THREE.CircleGeometry(ARCH_R + 0.012, 26).rotateY(PI / 2);
  GEO.ball = new THREE.SphereGeometry(0.5, 18, 12);
  GEO.blade = new THREE.CylinderGeometry(0.5, 0.5, 1, 22).rotateZ(PI / 2);   // 납작하게 눌러 날개로 씀
  GEO.pipe = new THREE.CylinderGeometry(0.085, 0.085, 0.22, 10).rotateX(PI / 2);
  GEO.vplane = new THREE.PlaneGeometry(1, 1);
  GEO.sedan = extr([[2.2, 0.34], [2.18, 0.72], [1.3, 0.86], [-1.5, 0.9], [-2.2, 0.86], [-2.24, 0.4], [2.0, 0.3]], 1.84, 0.08);
  GEO.sedanCab = extr([[1.15, 0.86], [0.55, 1.4], [-0.95, 1.42], [-1.6, 0.9]], 1.6, 0.09);
  GEO.van = extr([[2.3, 0.36], [2.3, 1.05], [1.75, 1.95], [-2.4, 1.98], [-2.45, 0.4]], 2.0, 0.09);
  GEO.vanCab = extr([[2.26, 1.12], [1.78, 1.86], [0.7, 1.86], [0.7, 1.12]], 2.04, 0.02);
  GEO.bus = extr([[5.3, 0.42], [5.35, 1.6], [5.1, 3.05], [-5.3, 3.08], [-5.35, 0.42]], 2.5, 0.1);
  GEO.busCab = extr([[5.38, 1.55], [5.14, 2.7], [-5.2, 2.72], [-5.2, 1.55]], 2.54, 0.02);
  { const paintG = (g, r, gg, b) => { g = g.toNonIndexed(); g.deleteAttribute("uv"); const n = g.attributes.position.count, c = new Float32Array(n * 3); for(let k = 0; k < n; k++){ c[k * 3] = r; c[k * 3 + 1] = gg; c[k * 3 + 2] = b; } g.setAttribute("color", new THREE.BufferAttribute(c, 3)); return g; };
    GEO.wheel = mergeGeometries([paintG(new THREE.CylinderGeometry(0.36, 0.36, 0.3, 14).rotateZ(PI / 2), 0.012, 0.012, 0.016), paintG(new THREE.CylinderGeometry(0.22, 0.22, 0.32, 10).rotateZ(PI / 2), 0.62, 0.64, 0.7), paintG(new THREE.BoxGeometry(0.33, 0.07, 0.4), 0.05, 0.05, 0.06)]);
    GEO.wheels4 = (x, z1, z2, y) => mergeGeometries([[x, z1], [-x, z1], [x, z2], [-x, z2]].map(([a, b]) => GEO.wheel.clone().translate(a, y, b)));
    const tire = new THREE.LatheGeometry([[0.2, -0.15], [0.315, -0.15], [0.35, -0.125], [0.36, -0.07], [0.36, 0.07], [0.35, 0.125], [0.315, 0.15], [0.2, 0.15]].map(q => new THREE.Vector2(q[0], q[1])), 24).rotateZ(PI / 2);
    const spokes = []; for(let k = 0; k < 5; k++) spokes.push(paintG(new THREE.BoxGeometry(0.318, 0.2, 0.05).translate(0, 0.115, 0).rotateX(k * PI * 2 / 5), 0.78, 0.8, 0.86));
    GEO.wheelS = mergeGeometries([paintG(tire, 0.012, 0.012, 0.016), paintG(new THREE.CylinderGeometry(0.235, 0.235, 0.27, 26, 1, true).rotateZ(PI / 2), 0.5, 0.52, 0.58), paintG(new THREE.CylinderGeometry(0.22, 0.22, 0.2, 20).rotateZ(PI / 2), 0.04, 0.04, 0.05),
      paintG(new THREE.CylinderGeometry(0.06, 0.06, 0.325, 12).rotateZ(PI / 2), 0.86, 0.88, 0.92), ...spokes]); }
  GEO.box = new THREE.BoxGeometry(1, 1, 1);
  GEO.plane = new THREE.PlaneGeometry(1, 1).rotateX(-PI / 2);
  GEO.flame = new THREE.ConeGeometry(0.17, 1.5, 8).rotateX(-PI / 2).translate(0, 0, -0.75);
  return GEO;
}
const M = {};
function mats(env, glow){
  if(M.ok) return M; M.ok = true;
  M.wheel = new THREE.MeshStandardMaterial({vertexColors:true, metalness:0.55, roughness:0.4, envMap:env}); M.rim = new THREE.MeshStandardMaterial({color:0xc9ccd6, metalness:1, roughness:0.25, envMap:env});
  M.glass = new THREE.MeshStandardMaterial({color:0x05060a, metalness:0.55, roughness:0.12, envMap:env, envMapIntensity:0.55});
  M.dark = new THREE.MeshBasicMaterial({color:0x0b0c11}); M.dark2 = new THREE.MeshBasicMaterial({color:0x0b0c11, side:THREE.DoubleSide}); M.liner = new THREE.MeshBasicMaterial({color:0x08090d, side:THREE.BackSide});
  M.glass2 = new THREE.MeshPhysicalMaterial({color:0x04050a, metalness:0.5, roughness:0.1, clearcoat:1, envMap:env, envMapIntensity:0.7, side:THREE.DoubleSide}); M.head = new THREE.MeshBasicMaterial({color:0xfff6dc, fog:false});
  M.shadow = new THREE.MeshBasicMaterial({color:0x000000, map:glow, transparent:true, opacity:0.85, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-1, polygonOffsetUnits:-1});
  M.beam = new THREE.MeshBasicMaterial({color:0xfff0c8, map:glow, transparent:true, opacity:0.5, blending:THREE.AdditiveBlending, depthWrite:false, fog:false, polygonOffset:true, polygonOffsetFactor:-3, polygonOffsetUnits:-3});
  M.flame = new THREE.MeshBasicMaterial({color:0x58c8ff, transparent:true, opacity:0.9, blending:THREE.AdditiveBlending, depthWrite:false, fog:false});
  M.flame2 = new THREE.MeshBasicMaterial({color:0xffffff, transparent:true, opacity:0.9, blending:THREE.AdditiveBlending, depthWrite:false, fog:false});
  M.glow = glow; M.env = env; return M;
}
const part = (g, m, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); return o; };

export function makeCar(kind, color, env, glow, o = {}){
  const G = geos(), m = mats(env, glow), root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const paint = kind === "sport" ? new THREE.MeshPhysicalMaterial({color, metalness:0.45, roughness:0.3, clearcoat:1, clearcoatRoughness:0.05, envMap:env, envMapIntensity:1.5})
    : new THREE.MeshStandardMaterial({color, metalness:0.35, roughness:0.5, envMap:env, envMapIntensity:1.5});
  const tailM = new THREE.MeshBasicMaterial({color:0xb01018, fog:false});
  const car = {root, body, paint, tailM, kind, wheels:[], front:[], len:kind === "bus" ? 10.7 : kind === "van" ? 4.8 : CAR_LEN, wid:kind === "bus" ? 2.5 : kind === "van" ? 2.0 : CAR_W};
  const wheel = (x, z, steer) => { const g = new THREE.Group(); g.position.set(x, 0.36, z); const w = part(G.wheel, m.wheel); g.add(w); root.add(g); car.wheels.push(w); if(steer) car.front.push(g); };
  const fixedWheels = (x, z1, z2, y, sc = 1) => { const w = new THREE.Mesh(G.wheels4(x / sc, z1 / sc, z2 / sc, y / sc), m.wheel); w.scale.setScalar(sc); root.add(w); };
  if(kind === "sport"){
    const B = o.lo ? G.spLo : G.sp; body.add(part(B.paint, paint), part(B.paint, m.liner), part(B.glass, m.glass2), part(B.dark, m.dark2), part(B.head, m.head));   // liner = 몸통 안쪽 면 (바퀴집으로 속이 비쳐 보이지 않게)
    for(const sx of [-1, 1]){
      for(const z of WHEEL_Z) body.add(part(G.well, m.dark2, 0.66 * sx, WHEEL_Y, z, 0.8, 1, 1), part(G.wellCap, m.dark2, 0.46 * sx, WHEEL_Y, z));
      body.add(part(G.box, m.dark, 0.95 * sx, 0.235, 0.01, 0.07, 0.08, 1.74),   // 옆 치마
        part(G.ball, paint, 0.955 * sx, 0.93, 0.6, 0.2, 0.1, 0.15), part(G.box, m.dark, 0.9 * sx, 0.9, 0.62, 0.12, 0.03, 0.05),   // 거울
        part(G.box, m.dark, 0.56 * sx, 1.02, -1.92, 0.035, 0.24, 0.16), part(G.pipe, m.rim, 0.36 * sx, 0.36, -2.22)); }
    body.add(part(G.box, m.dark, 0, 0.245, 2.02, 1.42, 0.05, 0.3),   // 앞 립
      part(G.blade, paint, 0, 1.15, -1.95, 1.84, 0.05, 0.36), part(G.blade, m.dark, 0, 1.135, -1.95, 1.86, 0.02, 0.4),   // 뒷날개 (둥근 날)
      part(G.box, tailM, 0, 0.7, -2.246, 1.38, 0.07, 0.03), part(G.box, m.dark, 0, 0.36, -2.2, 1.3, 0.14, 0.14));
    for(const x of [-0.18, 0, 0.18]) body.add(part(G.box, m.dark, x, 0.3, -2.25, 0.025, 0.12, 0.16));
    car.tailGlow = part(G.vplane, new THREE.MeshBasicMaterial({color:0xff2030, map:glow, transparent:true, opacity:0.5, blending:THREE.AdditiveBlending, depthWrite:false, fog:false, side:THREE.DoubleSide}), 0, 0.68, -2.3, 3.2, 0.85, 1); car.tailGlow.renderOrder = 3; body.add(car.tailGlow);
    const wheelS = (x, z, steer) => { const g = new THREE.Group(); g.position.set(x, 0.36, z); const w = part(o.lo ? G.wheel : G.wheelS, m.wheel); g.add(w); root.add(g); car.wheels.push(w); if(steer) car.front.push(g); };
    wheelS(0.83, 1.36, true); wheelS(-0.83, 1.36, true); wheelS(0.84, -1.34); wheelS(-0.84, -1.34);
    car.f1 = part(G.flame, m.flame, 0.36, 0.36, -2.25); car.f2 = part(G.flame, m.flame, -0.36, 0.36, -2.25); car.f3 = part(G.flame, m.flame2, 0.36, 0.36, -2.25, 0.5, 0.5, 0.6); car.f4 = part(G.flame, m.flame2, -0.36, 0.36, -2.25, 0.5, 0.5, 0.6);
    [car.f1, car.f2, car.f3, car.f4].forEach(f => { f.visible = false; body.add(f); });
    const ug = new THREE.MeshBasicMaterial({color:o.glow ?? color, map:glow, transparent:true, opacity:0.75, blending:THREE.AdditiveBlending, depthWrite:false, fog:false, polygonOffset:true, polygonOffsetFactor:-2, polygonOffsetUnits:-2});
    car.under = part(G.plane, ug, 0, 0.04, 0, 4.4, 1, 7.4); car.under.renderOrder = 2; root.add(car.under);
  } else if(kind === "bus"){
    body.add(part(G.bus, paint), part(G.busCab, m.glass), part(G.box, m.head, 0.85, 0.8, 5.36, 0.4, 0.16, 0.06), part(G.box, m.head, -0.85, 0.8, 5.36, 0.4, 0.16, 0.06), part(G.box, tailM, 0, 0.9, -5.36, 2.2, 0.14, 0.06));
    fixedWheels(1.12, 3.4, -3.2, 0.48, 1.33);
  } else {
    const v = kind === "van";
    body.add(part(v ? G.van : G.sedan, paint), part(v ? G.vanCab : G.sedanCab, m.glass), part(G.box, m.head, 0.6, 0.66, v ? 2.3 : 2.2, 0.4, 0.12, 0.06), part(G.box, m.head, -0.6, 0.66, v ? 2.3 : 2.2, 0.4, 0.12, 0.06), part(G.box, tailM, 0, 0.74, v ? -2.45 : -2.24, 1.6, 0.1, 0.06));
    if(o.taxi) body.add(part(G.box, new THREE.MeshBasicMaterial({color:0xfff2a0, fog:false}), 0, 1.5, -0.1, 0.5, 0.16, 0.24));
    fixedWheels(0.84, 1.36, -1.34, 0.36);
  }
  { const by = new Map(), keep = new Set([car.f1, car.f2, car.f3, car.f4, car.tailGlow]); body.updateMatrixWorld(true);
    for(const o of [...body.children]){ if(keep.has(o) || !o.isMesh) continue; o.updateMatrix(); let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); for(const a of Object.keys(g.attributes)) if(a !== "position" && a !== "normal") g.deleteAttribute(a); g.applyMatrix4(o.matrix);
      if(!by.has(o.material)) by.set(o.material, []); by.get(o.material).push(g); body.remove(o); }
    for(const [mat, gs] of by) body.add(new THREE.Mesh(gs.length > 1 ? mergeGeometries(gs) : gs[0], mat)); }
  car.shadow = part(G.plane, m.shadow, 0, 0.03, 0, car.wid * 1.9, 1, car.len * 1.45); car.shadow.renderOrder = 1; root.add(car.shadow);
  car.beam = part(G.plane, m.beam, 0, 0.05, car.len / 2 + 7.5, 7.5, 1, 17); car.beam.renderOrder = 2; root.add(car.beam);
  if(o.name){ const c = document.createElement("canvas"); c.width = 256; c.height = 64; const g = c.getContext("2d"); g.font = `800 34px Pretendard, "Apple SD Gothic Neo", sans-serif`; g.textAlign = "center"; g.textBaseline = "middle";
    const w = Math.min(240, g.measureText(o.name).width + 44); g.fillStyle = "rgba(8,9,16,.72)"; g.beginPath(); g.roundRect(128 - w / 2, 8, w, 48, 24); g.fill(); g.fillStyle = "#" + new THREE.Color(o.glow ?? color).getHexString(); g.fillRect(128 - w / 2 + 14, 27, 10, 10); g.fillStyle = "#ffffff"; g.fillText(o.name, 128 + 10, 33);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const s = new THREE.Sprite(new THREE.SpriteMaterial({map:t, transparent:true, depthWrite:false, fog:false, sizeAttenuation:false})); s.scale.set(0.2, 0.05, 1); s.position.y = 2.0; s.renderOrder = 6; root.add(s); car.tag = s; }
  return car;
}
const _o = {}, _l = {};
function pose(car, x, y, z, yaw, pitch, roll, spin, steer){
  car.root.position.set(x, y, z); car.root.rotation.set(0, 0, 0); car.root.rotation.order = "YXZ"; car.root.rotation.y = yaw; car.root.rotation.x = pitch;
  car.body.rotation.z = roll; for(const w of car.wheels) w.rotation.x = spin; for(const g of car.front) g.rotation.y = steer;
}

/* ---------- 내 차 ---------- */
export class Player {
  constructor(P, car){ this.P = P; this.car = car; this.reset(P.N - 16, LANES[1]); }
  get v(){ return this.vf; }   // 상대 차가 내 차를 피할 때 봄
  reset(s, d){ const P = this.P; at(P, s, d, _o); this.x = _o.x; this.z = _o.z; this.y = _o.y; this.yaw = Math.atan2(_o.tx, _o.tz); this.vx = this.vz = 0; this.vf = 0; this.vl = 0; this.s = s; this.d = d; this.k = ((Math.round(s) % P.N) + P.N) % P.N;
    this.prog = (s - P.N) * P.step; this.spin = 0; this.steerV = 0; this.roll = 0; this.pitch = 0; this.drift = 0; this.driftT = 0; this.slipK = 0; this.boost = 0; this.nitro = 0.35; this.nitroOn = false; this.slip = 0; this.hit = 0; this.wrong = 0; this.scrape = 0; this.air = 0; this.sy = 0; this.gear = 1; this.rpm = 0.2; this.brakeOn = false; this.ev = []; this.sync(0); }
  sync(steer){ pose(this.car, this.x, this.y, this.z, this.yaw, this.pitch, this.roll, this.spin, -steer * 0.42); }   // 바퀴는 오른쪽으로 꺾으면 -y 회전
  update(dt, I){
    const P = this.P; let {steer, gas, brake, hand, nitro} = I;
    this.steerV = lerp(this.steerV, steer, 1 - Math.exp(-dt * (Math.abs(steer) > Math.abs(this.steerV) ? 9 : 14)));
    const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw), rx = -fz, rz = fx;
    let vf = this.vx * fx + this.vz * fz, vl = this.vx * rx + this.vz * rz; const sp = Math.abs(vf);
    /* 드리프트: 꺾으면서 드리프트 버튼. 꺾지 않고 누르면 브레이크 */
    if(hand && !this.drift && sp > 13 && Math.abs(this.steerV) > 0.18){ this.drift = Math.sign(this.steerV); this.driftT = 0; this.ev.push("drift"); }
    if(this.drift && (!hand || sp < 9)){ if(this.driftT > 0.55){ this.boost = Math.min(1.5, 0.35 + this.driftT * 0.45); this.ev.push("boost"); } this.drift = 0; }
    if(hand && !this.drift) brake = Math.max(brake, 1);
    if(this.drift){ this.driftT += dt; this.nitro = Math.min(1, this.nitro + dt * 0.16); }
    this.nitroOn = nitro && this.nitro > 0.02 && vf > 6; if(this.nitroOn) this.nitro = Math.max(0, this.nitro - dt * 0.3); else this.nitro = Math.min(1, this.nitro + dt * 0.022);
    if(this.boost > 0) this.boost -= dt;
    /* 가속 · 감속 (가는 방향 기준) */
    const vmax = this.nitroOn ? 84 : this.boost > 0 ? 71 : 65, power = this.nitroOn ? 23 : this.boost > 0 ? 19 : 12.5;
    let acc = gas * power * Math.max(0, 1 - Math.pow(Math.max(vf, 0) / vmax, 2.2)) - (0.6 + 0.0009 * vf * vf) * Math.sign(vf || 1);
    if(vf > vmax) acc -= (vf - vmax) * 1.2;
    if(this.drift) acc -= 2.6;
    if(brake > 0){ if(vf > 0.8) acc -= 27 * brake; else acc = -7 * brake * (vf > -9 ? 1 : 0); }
    if(this.scrape > 0){ acc -= 6; this.scrape -= dt; }
    if(this.drift || Math.abs(this.slipK) > 0.015){
      /* 드리프트: 가는 방향은 핸들로 돌리고, 차 머리는 그보다 안쪽을 봄 (뒤가 흐르는 모양). 빙글 돌지 않음. 손을 떼면 머리가 천천히 돌아옴 */
      const dir = this.drift || Math.sign(this.slipK); let va = Math.atan2(this.vx, this.vz), v = Math.hypot(this.vx, this.vz), wv, tgt, rt;
      if(this.drift){ const inn = clamp(this.steerV * dir, -0.7, 1); wv = dir * (27 / Math.max(v, 12)) * (0.6 + 0.58 * inn); tgt = dir * (0.3 + 0.26 * Math.max(0, inn)); rt = 4.5; }
      else { wv = this.steerV * Math.min(v / 6.2, 18.5 / Math.max(v, 4)); tgt = 0; rt = 6; }
      va -= wv * dt; this.slipK = lerp(this.slipK, tgt, 1 - Math.exp(-rt * dt)); if(!this.drift && Math.abs(this.slipK) <= 0.015) this.slipK = 0; this.yaw = va - this.slipK;
      v = Math.max(0, v + acc * dt); this.vx = Math.sin(va) * v; this.vz = Math.cos(va) * v; vf = v * Math.cos(this.slipK); vl = v * Math.sin(this.slipK);
      this.slip = clamp(Math.abs(this.slipK) / 0.3, 0, 1); this.slipA = this.slipK;
    } else {
      /* 평소: 느릴 땐 회전 반경, 빠를 땐 타이어가 버티는 만큼만 돌아감 */
      const rate = Math.min(sp / 6.2, 18.5 / Math.max(sp, 4));
      this.yaw -= this.steerV * rate * dt * (vf >= -0.5 ? 1 : -1);
      vf += acc * dt; if(!gas && !brake && Math.abs(vf) < 0.4) vf = 0;
      vl *= Math.exp(-9.5 * dt);
      this.slip = clamp(Math.abs(vl) / 9, 0, 1) * (sp > 8 ? 1 : 0); this.slipA = Math.atan2(vl, Math.max(sp, 6));
      const f2x = Math.sin(this.yaw), f2z = Math.cos(this.yaw); this.vx = f2x * vf + (-f2z) * vl; this.vz = f2z * vf + f2x * vl;
    }
    const f2x = Math.sin(this.yaw), f2z = Math.cos(this.yaw);
    this.x += this.vx * dt; this.z += this.vz * dt;
    /* 코스 위 위치 · 벽 */
    locate(P, this.x, this.z, this.k, _l); let sNew = _l.k + _l.u, d = _l.d, k = _l.k; const tx = P.tx[k], tz = P.tz[k];
    if(Math.abs(d) > LIM){ const sd = Math.sign(d), nx = -tz * sd, nz = tx * sd, over = Math.abs(d) - LIM; this.x -= nx * over; this.z -= nz * over; d = LIM * sd;
      const vn = this.vx * nx + this.vz * nz; if(vn > 0){ this.vx -= nx * vn * 1.3; this.vz -= nz * vn * 1.3; const loss = clamp(vn * 0.016, 0.01, 0.3); this.vx *= 1 - loss; this.vz *= 1 - loss; if(vn > 2.2){ this.hit = Math.max(this.hit, clamp(vn / 14, 0.2, 1)); this.ev.push("wall"); } this.scrape = 0.12;
        const ty = Math.atan2(tx, tz), dy = wrapA(ty - this.yaw); if(Math.abs(dy) < 1.4) this.yaw += dy * clamp(dt * 5, 0, 0.5); this.wallSide = sd; this.sparkT = 0.12; } }
    let ds = sNew - this.s; if(ds > P.N / 2) ds -= P.N; if(ds < -P.N / 2) ds += P.N; this.prog += ds * P.step; this.s = sNew; this.k = k; this.d = d;
    const fwd = this.vx * tx + this.vz * tz; if(fwd < -3 || (Math.abs(wrapA(Math.atan2(tx, tz) - this.yaw)) > 2.0 && sp < 12)) this.wrong += dt; else this.wrong = Math.max(0, this.wrong - dt * 3);
    at(P, sNew, 0, _o); this.y = _o.y; this.pitch = lerp(this.pitch, -Math.atan(_o.sl) * (fwd >= 0 ? 1 : -1) + clamp(-acc * 0.0022, -0.05, 0.05), 1 - Math.exp(-dt * 8));
    this.vf = this.vx * f2x + this.vz * f2z; this.vl = vl; this.acc = acc; this.brakeOn = brake > 0.1 && vf > 1;
    this.roll = lerp(this.roll, clamp(-this.steerV * sp * 0.0035, -0.13, 0.13), 1 - Math.exp(-dt * 7));   // 도는 반대쪽으로 기울어짐
    this.spin += this.vf * dt / 0.36; this.hit = Math.max(0, this.hit - dt * 2.2);
    /* 기어 · 엔진 회전수 (소리·계기판) */
    const G = [0, 14, 26, 38, 50, 62, 90], v = Math.max(0, this.vf); let g = 1; while(g < 6 && v > G[g]) g++; if(g !== this.gear){ this.gear = g; this.ev.push("shift"); }
    this.rpm = lerp(this.rpm, clamp(0.28 + 0.72 * (v - G[g - 1] * 0.72) / (G[g] - G[g - 1] * 0.72), 0.15, 1), 1 - Math.exp(-dt * 10));
    const c = this.car; c.tailM.color.setHex(this.brakeOn ? 0xff4a50 : 0xd01420); c.tailGlow.material.opacity = this.brakeOn ? 1 : 0.45; c.under.material.opacity = 0.62 + 0.2 * Math.sin(performance.now() * 0.004);
    const fl = this.nitroOn || this.boost > 0; [c.f1, c.f2, c.f3, c.f4].forEach((f, q) => { f.visible = fl; if(fl){ const s = (this.nitroOn ? 0.8 : 0.45) * (0.8 + Math.random() * 0.5) * (q > 1 ? 0.6 : 1); f.scale.set(q > 1 ? 0.42 : 0.8, q > 1 ? 0.42 : 0.8, s); } });
    this.sync(this.steerV - clamp(this.slipA * 1.6, -0.75, 0.75));   // 드리프트 땐 앞바퀴가 반대로 꺾임
  }
}

/* ---------- 상대 차 · 일반 차 ---------- */
export class Bot {
  constructor(P, car, o){ this.P = P; this.car = car; Object.assign(this, {s:0, d:0, v:0, skill:1, top:57, traffic:false, lane:0, name:"", dT:0, dv:0, spin:0, prog:0, fin:0, bump:0, nit:0, roll:0, lineK:1}, o); this.dT = this.d; this.prog = (this.s - P.N) * P.step; this.place(); }
  place(){ at(this.P, this.s, this.d, _o); const yaw = Math.atan2(_o.tx, _o.tz) - Math.atan2(this.dv, Math.max(this.v, 6)); this.x = _o.x; this.z = _o.z; this.y = _o.y; this.yaw = yaw;
    pose(this.car, _o.x, _o.y, _o.z, yaw, -Math.atan(_o.sl), this.roll, this.spin, clamp(-this.dv * 0.12 - _o.kv * 14, -0.5, 0.5)); }
  update(dt, others, me, go){
    const P = this.P, N = P.N, k = ((Math.floor(this.s) % N) + N) % N; let vt;
    if(this.traffic){ vt = this.top; this.dT = this.lane; }
    else {
      /* 내 차와 너무 벌어지면 맞춤 (앞서면 살짝 늦추고, 뒤처지면 살짝 당김) */
      const gap = this.prog - me.prog, rub = clamp(1 - gap / 900, 0.86, 1.13); let top = this.top * this.skill * rub; this.nit = gap < -90 && Math.abs(P.kv[k]) < 0.004 ? 1 : 0; if(this.nit) top *= 1.07;
      vt = go ? top : 0; const aLat = 19.5 * this.skill, br = 21, look = Math.ceil((this.v * this.v / (2 * br) + 34) / P.step); let kA = 0;
      for(let q = 0; q <= look; q += 2){ const kk = P.kv[(k + q) % N], ak = Math.abs(kk); if(ak > 2e-4){ const vc = Math.sqrt(aLat / ak), va = Math.sqrt(vc * vc + 2 * br * q * P.step); if(va < vt) vt = va; } if(q > 6 && q < 46) kA += kk; }
      /* 코너는 안쪽으로, 직선은 자기 차로 */
      const line = clamp(kA * 9, -1, 1); this.dT = Math.abs(line) > 0.2 ? clamp(line * (HALF_W - 2.4) * this.lineK + this.lane * 0.35, -LIM, LIM) : this.lane;
      if(this.fin) vt = Math.min(vt, 24);
    }
    /* 앞 차 피하기 */
    let block = null, bd = 1e9, side = 0; const reach = 9 + this.v * 0.75;
    for(const o of others){ if(o === this) continue; let ds = o.s - this.s; if(ds > N / 2) ds -= N; if(ds < -N / 2) ds += N; ds *= P.step; const hl = (this.car.len + o.car.len) / 2;
      const hw = (this.car.wid + o.car.wid) / 2;
      if(Math.abs(ds) < hl + 0.6 && Math.abs(o.d - this.d) < hw + 0.5) side += (this.d >= o.d ? 1 : -1);   // 나란히 겹치면 옆으로 벌림
      if(ds > hl * 0.7 && ds < reach + hl && Math.abs(o.d - this.d) < hw + 0.5 && o.v < this.v + 4 && ds < bd){ bd = ds; block = o; } }
    if(block){ const hw = (this.car.wid + block.car.wid) / 2 + 0.9, L = block.d - hw, R = block.d + hw, okL = L > -LIM + 0.2, okR = R < LIM - 0.2;
      const pick = okL && okR ? (Math.abs(L - this.dT) < Math.abs(R - this.dT) ? L : R) : okL ? L : okR ? R : this.d; this.dT = pick;
      const hl = (this.car.len + block.car.len) / 2; if(bd - hl < 2 + this.v * 0.25 && Math.abs(block.d - this.d) < hw - 0.5) vt = Math.min(vt, Math.max(0, block.v - 1 + (bd - hl) * 0.6)); }
    if(side) this.dT = clamp(this.d + Math.sign(side) * 1.6, -LIM, LIM);
    if(this.bump > 0){ this.bump -= dt; vt = Math.min(vt, this.v); }
    const acc = this.traffic ? 4 : 10.5 * Math.max(0.12, 1 - Math.pow(this.v / (this.top * 1.15), 2));
    this.v += clamp(vt - this.v, -23 * dt, acc * dt); if(this.v < 0) this.v = 0;
    const lr = this.traffic ? 1.2 : 2.2 + this.v * 0.07, dv = clamp((this.dT - this.d) * 2.2, -lr, lr); this.dv = lerp(this.dv, dv, 1 - Math.exp(-dt * 5)); this.d = clamp(this.d + this.dv * dt, -LIM, LIM);
    const adv = this.v * dt / P.step; this.s += adv; this.prog += adv * P.step; if(this.s >= N) this.s -= N;
    this.spin += this.v * dt / 0.36; this.roll = lerp(this.roll, clamp(-this.dv * 0.02 - P.kv[k] * this.v * this.v * 0.012, -0.1, 0.1), 1 - Math.exp(-dt * 6));
    this.place(); const c = this.car;
    if(c.f1){ const fl = this.nit > 0 && this.v > 30; [c.f1, c.f2, c.f3, c.f4].forEach((f, q) => { f.visible = fl; if(fl) f.scale.set(q > 1 ? 0.5 : 1, q > 1 ? 0.5 : 1, (0.7 + Math.random() * 0.5) * (q > 1 ? 0.6 : 1)); }); }
    const br = vt < this.v - 2; c.tailM.color.setHex(br ? 0xff4a50 : 0xd01420); if(c.tailGlow) c.tailGlow.material.opacity = br ? 1 : 0.45;
  }
}

/* 내 차와 다른 차 부딪힘 · 아슬아슬 지나가기. 돌려주는 것: 이번 프레임에 생긴 일 목록 */
export function collide(me, bots, dt, ev){
  const P = me.P, N = P.N, tx = P.tx[me.k], tz = P.tz[me.k], nx = -tz, nz = tx;
  for(const o of bots){
    let ds = o.s - me.s; if(ds > N / 2) ds -= N; if(ds < -N / 2) ds += N; ds *= P.step; const dd = o.d - me.d, HL = (CAR_LEN + o.car.len) / 2, HW = (CAR_W + o.car.wid) / 2 - 0.12;
    const vMe = me.vx * tx + me.vz * tz;
    if(Math.abs(ds) < HL && Math.abs(dd) < HW){
      const ox = HL - Math.abs(ds), oy = HW - Math.abs(dd); o.hitAt = performance.now();
      if(oy < ox * 0.55){ const sd = Math.sign(dd) || 1, push = oy * (o.traffic && o.car.kind === "bus" ? 1 : 0.6); me.x -= nx * sd * push; me.z -= nz * sd * push; me.vx -= nx * sd * 2.2; me.vz -= nz * sd * 2.2;
        if(!(o.traffic && o.car.kind === "bus")) o.d = clamp(o.d + sd * oy * 0.4, -LIM, LIM); me.vx *= 0.985; me.vz *= 0.985; if(!o.rubT || performance.now() - o.rubT > 350){ o.rubT = performance.now(); me.hit = Math.max(me.hit, 0.3); ev.push("rub"); } me.sparkT = 0.1; me.wallSide = sd; }
      else if(ds > 0){ const rel = vMe - o.v; if(rel > 0){ const keep = o.v * 0.94 + 1; const cut = vMe - keep; me.vx -= tx * cut; me.vz -= tz * cut; o.v += Math.min(7, rel * (o.traffic ? 0.35 : 0.5)); o.bump = 0.3; me.hit = Math.max(me.hit, clamp(rel / 22, 0.25, 1)); ev.push(rel > 9 ? "crash" : "rub"); }
        me.x -= tx * ox * 0.5; me.z -= tz * ox * 0.5; }
      else { if(o.v > vMe){ o.v = Math.max(0, vMe * 0.96); o.bump = 0.4; me.vx += tx * 1.5; me.vz += tz * 1.5; me.hit = Math.max(me.hit, 0.25); ev.push("rub"); } }
    }
    /* 아슬아슬: 일반 차 옆을 빠르게 스쳐 지나감 */
    if(o.traffic){ const was = o.pds ?? ds; if(was > 0 && ds <= 0 && Math.abs(dd) < HW + 1.5 && vMe - o.v > 11 && performance.now() - (o.hitAt || 0) > 1200) ev.push("near"); o.pds = ds; }
    else if(ds > 4 && ds < 26 && Math.abs(dd) < 1.4 && vMe > 30) me.nitro = Math.min(1, me.nitro + dt * 0.05);   // 뒤에 바짝 붙으면 니트로가 조금씩 참
  }
}
