/* 타워 자유 3D 시안 · 예운옥 구역 (2026-11-21 감독님: "비스듬히 고정말고 3d로 가면?" → "어 하나 해봐")
   - 2.5D 타워의 예운옥 구역(i 13.2~24, j 0~7)을 같은 배치 그대로 3D로. 칸 하나 = 1
   - 사람은 트리포 모델 없이 도형을 조립한 클레이 인형 (가볍고 크레딧 안 씀)
   - 한 손가락 돌리기 · 두 손가락 이동·확대, 바닥 밑으로는 못 감, '처음 시점' 버튼
   - 카메라가 벽 뒤로 가면 벽이 낮아짐 (심즈식 컷어웨이)
   - 이름표·말풍선은 HTML로 띄워서 돌려도 항상 정면 */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const coarse = matchMedia("(pointer: coarse)").matches;
const OX = 18.6, OZ = 3.5;                 // 타워 칸 (i, j) → 3D (x, z)
const X = i => i - OX, Z = j => j - OZ;
const WALL_H = 3.6;                        // 2.5D 벽 112px ≈ 3.6칸
const RAINBOW = ["#F4A7B9","#F9C99B","#F6E39A","#A8DCC8","#A9CBEA","#C8B4D0"];
const ST_COLOR = {working:"#E8A04A", review:"#E06A55", scheduled:"#6F82CF", done:"#4DAA97", idle:"#9C9384"};
const ST_KO = {working:"일하는 중", review:"확인 필요", scheduled:"예약", done:"완료", idle:"대기"};
const FONT = "\"IBM Plex Sans KR\", \"Apple SD Gothic Neo\", system-ui, sans-serif";

/* 예운옥 자리 (2.5D 타워 ROSTER·nora 좌표 그대로) */
const DESKS = {studio:[19.5,4.4,1.9,0.9], promo:[21.7,4.4,1.9,0.9]};
const NORA_SEAT = [22.8, 2.39];

let R = null;

/* ---------- 재료 · 도형 ---------- */
function makeKit(){
  const mats = new Map(), geos = new Map();
  const mat = (color, o = {}) => {
    const k = color + "|" + (o.r ?? "") + "|" + (o.e ?? "") + "|" + (o.ei ?? "") + "|" + (o.op ?? "");
    if(!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({color, roughness:o.r ?? 0.8, metalness:0,
      emissive:o.e ?? 0x000000, emissiveIntensity:o.ei ?? 1, transparent:o.op != null, opacity:o.op ?? 1, depthWrite:o.op == null}));
    return mats.get(k);
  };
  const geo = (key, make) => { if(!geos.has(key)) geos.set(key, make()); return geos.get(key); };
  const rbox = (w, h, d, r = 0.06) => geo(`rb${w},${h},${d},${r}`, () => new RoundedBoxGeometry(w, h, d, 3, Math.max(0.002, Math.min(r, w/2 - 0.002, h/2 - 0.002, d/2 - 0.002))));
  const sph = (r, ws = 20, hs = 14) => geo(`s${r},${ws}`, () => new THREE.SphereGeometry(r, ws, hs));
  const cap = (r, len) => geo(`c${r},${len}`, () => new THREE.CapsuleGeometry(r, len, 6, 12));
  const cyl = (rt, rb, h, seg = 20) => geo(`y${rt},${rb},${h},${seg}`, () => new THREE.CylinderGeometry(rt, rb, h, seg));
  const mesh = (g, m, x = 0, y = 0, z = 0, parent, shadow = true) => {
    const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = shadow; o.receiveShadow = true; if(parent) parent.add(o); return o; };
  return {mat, geo, rbox, sph, cap, cyl, mesh, mats};
}

function canvasTex(w, h, draw){
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

/* ---------- 클레이 인형 ---------- */
function makePerson(K, look, b = {}){
  const {mat, rbox, sph, cap, cyl, mesh} = K;
  const skin = mat(look.skin, {r:0.65}), hair = mat(look.hair, {r:0.55}), shirt = mat(look.shirt), pants = mat(look.pants), shoe = mat(b.shoe || "#2E2A28", {r:0.6});
  const W = b.w || 1;
  const root = new THREE.Group(); root.scale.setScalar(b.h || 1);
  const hips = new THREE.Group(); hips.position.y = 0.9; root.add(hips);
  mesh(rbox(0.34 * W, 0.2, 0.24, 0.09), pants, 0, 0, 0, hips);
  const legs = [-1, 1].map(s => {
    const hip = new THREE.Group(); hip.position.set(s * 0.095 * W, -0.02, 0); hips.add(hip);
    mesh(cap(0.078, 0.28), pants, 0, -0.2, 0, hip);
    const knee = new THREE.Group(); knee.position.y = -0.41; hip.add(knee);
    mesh(cap(0.068, 0.3), pants, 0, -0.2, 0, knee);
    mesh(rbox(0.14, 0.09, 0.24, 0.04), shoe, 0, -0.43, 0.045, knee);
    return {hip, knee};
  });
  const chest = new THREE.Group(); chest.position.y = 0.06; hips.add(chest);
  const torso = mesh(rbox(0.4 * W, 0.52, 0.27, 0.12), shirt, 0, 0.26, 0, chest);
  mesh(cyl(0.06, 0.065, 0.1, 12), skin, 0, 0.56, 0, chest);
  const head = new THREE.Group(); head.position.y = 0.6; chest.add(head);
  const skull = mesh(sph(0.21, 28, 20), skin, 0, 0.19, 0, head); skull.scale.set(1, 1.04, 0.97);
  const eyeM = mat("#2A211D", {r:0.3});
  [-1, 1].forEach(s => {
    mesh(sph(0.023, 10, 8), eyeM, s * 0.075, 0.205, 0.188, head, false).scale.set(1, 1.25, 0.6);
    mesh(sph(0.036, 12, 8), mat("#F39A9A", {op:0.5}), s * 0.125, 0.14, 0.16, head, false).scale.set(1, 0.6, 0.4);
  });
  mesh(sph(0.026, 10, 8), skin, 0, 0.165, 0.205, head, false);
  const smile = mesh(K.geo("smile", () => new THREE.TorusGeometry(0.034, 0.008, 6, 14, Math.PI)), mat("#7A3B34", {r:0.5}), 0, 0.115, 0.19, head, false);
  smile.rotation.z = Math.PI; smile.rotation.x = -0.25;
  // 머리카락
  const capG = K.geo("hairCap", () => new THREE.SphereGeometry(0.228, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.5));
  const hc = mesh(capG, hair, 0, 0.2, -0.008, head); hc.rotation.x = -0.42; hc.scale.set(1, 1.06, 1);
  const st = look.style;
  if(st === "long"){
    mesh(rbox(0.42, 0.5, 0.13, 0.06), hair, 0, 0.02, -0.13, head);
    [-1, 1].forEach(s => mesh(cap(0.055, 0.3), hair, s * 0.19, 0.03, -0.03, head));
  } else if(st === "bun"){
    mesh(sph(0.1, 16, 12), hair, 0, 0.36, -0.16, head);
    mesh(rbox(0.4, 0.2, 0.12, 0.06), hair, 0, 0.14, -0.13, head);
  } else if(st === "bob"){
    [-1, 1].forEach(s => mesh(rbox(0.08, 0.27, 0.34, 0.04), hair, s * 0.205, 0.1, -0.035, head));
    mesh(rbox(0.44, 0.27, 0.11, 0.05), hair, 0, 0.1, -0.16, head);
  } else if(st === "pig"){
    [-1, 1].forEach(s => mesh(sph(0.08, 14, 10), hair, s * 0.25, 0.12, -0.08, head));
  }
  if(look.hat === "bucket"){
    const hm = mat(look.hatC || "#CDBB9A", {r:0.9});
    mesh(cyl(0.205, 0.235, 0.17, 24), hm, 0, 0.36, -0.01, head);
    const brim = mesh(cyl(0.34, 0.36, 0.025, 28), hm, 0, 0.275, -0.01, head); brim.rotation.x = -0.08;
  }
  // 팔
  const arms = [-1, 1].map(s => {
    const sh = new THREE.Group(); sh.position.set(s * (0.2 * W + 0.055), 0.46, 0); chest.add(sh);
    mesh(cap(0.058, 0.17), shirt, 0, -0.12, 0, sh);
    const el = new THREE.Group(); el.position.y = -0.27; sh.add(el);
    mesh(cap(0.05, 0.16), skin, 0, -0.12, 0, el);
    mesh(sph(0.056, 12, 10), skin, 0, -0.26, 0.005, el);
    return {sh, el};
  });
  const pickers = []; root.traverse(o => { if(o.isMesh) pickers.push(o); });
  return {root, hips, chest, head, legs, arms, torso, pickers};
}

/* 자세: 서기·앉기·걷기 (값만 바꿈) */
function pose(p, kind, t, opt = {}){
  const {hips, chest, head, legs, arms} = p;
  hips.position.y = 0.9; hips.rotation.set(0, 0, 0); chest.rotation.set(0, 0, 0); head.rotation.set(0, 0, 0);
  legs.forEach(l => { l.hip.rotation.set(0, 0, 0); l.knee.rotation.set(0, 0, 0); });
  arms.forEach((a, k) => { a.sh.rotation.set(0, 0, (k ? -1 : 1) * 0.07); a.el.rotation.set(0, 0, 0); });
  const breathe = reduce ? 0 : Math.sin(t * 1.6 + (opt.ph || 0)) * 0.012;
  chest.scale.set(1, 1 + breathe, 1);
  if(kind === "sit" || kind === "type" || kind === "tablet" || kind === "stretch"){
    hips.position.y = 0.5;
    legs.forEach((l, k) => { l.hip.rotation.x = -Math.PI / 2 + 0.05; l.hip.rotation.y = (k ? 1 : -1) * 0.06; l.knee.rotation.x = Math.PI / 2 - 0.05; });
    chest.rotation.x = 0.04;
  }
  if(kind === "type"){
    chest.rotation.x = 0.1;
    arms.forEach((a, k) => { const tap = reduce ? 0 : Math.sin(t * 11 + k * 1.7) * 0.06 * (Math.sin(t * 0.9 + k) > -0.3 ? 1 : 0);
      a.sh.rotation.set(-0.95 + tap * 0.5, 0, (k ? -1 : 1) * 0.12); a.el.rotation.set(-0.75 + tap, 0, (k ? 1 : -1) * 0.2); });
    head.rotation.x = 0.08 + (reduce ? 0 : Math.sin(t * 0.5) * 0.03);
  }
  if(kind === "tablet"){
    arms.forEach((a, k) => { a.sh.rotation.set(-0.5, 0, (k ? -1 : 1) * 0.18); a.el.rotation.set(-1.25, 0, (k ? 1 : -1) * 0.45); });
    head.rotation.x = 0.28 + (reduce ? 0 : Math.sin(t * 0.4) * 0.04);
  }
  if(kind === "stretch"){
    const u = opt.u ?? 1;   // 0 → 1 → 0
    arms.forEach((a, k) => { a.sh.rotation.set(0, 0, (k ? -1 : 1) * (0.07 + u * 2.9)); a.el.rotation.set(0, 0, (k ? -1 : 1) * u * 0.25); });
    chest.rotation.x = -0.12 * u; head.rotation.x = -0.3 * u;
  }
  if(kind === "walk"){
    const s = Math.sin(opt.step || 0), c = Math.cos(opt.step || 0);
    legs.forEach((l, k) => { const q = k ? -s : s; l.hip.rotation.x = q * 0.5; l.knee.rotation.x = Math.max(0, -q) * 0.7 + 0.08; });
    arms.forEach((a, k) => { const q = k ? s : -s; a.sh.rotation.x = q * 0.45; a.el.rotation.x = -0.25; });
    hips.position.y = 0.9 + Math.abs(c) * 0.035;
  }
  if(opt.talk){ head.rotation.x += Math.sin(t * 7) * 0.05; arms[1].sh.rotation.x += -0.5 - Math.sin(t * 3) * 0.15; arms[1].el.rotation.x = -0.9; }
  if(opt.wave){ const w = Math.sin(t * 9); arms[0].sh.rotation.set(-0.2, 0, 2.5); arms[0].el.rotation.set(0, 0, 0.4 + w * 0.35); }
  if(opt.nod) head.rotation.x += Math.max(0, Math.sin(t * 5)) * 0.12;
  if(opt.turn) head.rotation.y = opt.turn;
}

/* ---------- 장면 ---------- */
function build(host, opts){
  const K = makeKit(), {mat, rbox, sph, cap, cyl, mesh} = K;
  const renderer = new THREE.WebGLRenderer({antialias:true, alpha:true, powerPreference:coarse ? "low-power" : "default"});
  renderer.setPixelRatio(Math.min(devicePixelRatio, coarse ? 1.75 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.className = "t3-cv";
  host.appendChild(renderer.domElement);
  const layer = document.createElement("div"); layer.className = "t3-layer"; host.appendChild(layer);

  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer);
  const envTex = pm.fromScene(new RoomEnvironment(renderer), 0.04).texture; pm.dispose();
  scene.environment = envTex;

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 200);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.rotateSpeed = 0.7; controls.panSpeed = 0.8; controls.screenSpacePanning = true;
  controls.minDistance = 3.2; controls.maxDistance = 30;
  controls.minPolarAngle = 0.12; controls.maxPolarAngle = 1.36;   // 바닥 밑으로 안 감

  /* 빛 */
  const hemi = new THREE.HemisphereLight(0xFFF6F0, 0xC9B7C4, 0.35); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xFFF1E2, 1.5);
  sun.position.set(5, 11, 7); sun.castShadow = true;
  sun.shadow.mapSize.set(coarse ? 1024 : 2048, coarse ? 1024 : 2048);
  Object.assign(sun.shadow.camera, {left:-9, right:9, top:9, bottom:-9, near:1, far:30});
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02; sun.shadow.radius = 3;
  scene.add(sun, sun.target);
  const glowL = new THREE.PointLight(0xFF9CC8, 0, 8, 1.6); glowL.position.set(X(17.4), 1.8, Z(0) + 1.2); scene.add(glowL);
  const boxL = new THREE.PointLight(0xFFF2DC, 0, 6, 1.6); scene.add(boxL);

  /* 그림자 받침 (떠 있는 디오라마) */
  const shTex = canvasTex(256, 256, (x, w) => { const g = x.createRadialGradient(128, 128, 20, 128, 128, 128); g.addColorStop(0, "rgba(60,30,50,.32)"); g.addColorStop(1, "rgba(60,30,50,0)"); x.fillStyle = g; x.fillRect(0, 0, w, w); });
  const drop = new THREE.Mesh(new THREE.PlaneGeometry(22, 16), new THREE.MeshBasicMaterial({map:shTex, transparent:true, depthWrite:false}));
  drop.rotation.x = -Math.PI / 2; drop.position.set(0.3, -0.75, 1.3); scene.add(drop);

  /* 바닥 */
  const floorG = new THREE.Group(); scene.add(floorG);
  const slab = mesh(rbox(13.2, 0.42, 9.0, 0.08), mat("#CBBFAE"), 0, -0.24, 1.0, floorG); slab.castShadow = false;
  mesh(rbox(13.2, 0.04, 9.0, 0.015), mat("#EEE8DE", {r:0.7}), 0, -0.02, 1.0, floorG).castShadow = false;
  const studioFloor = mesh(rbox(10.8, 0.03, 7.0, 0.01), mat("#F4D3E0", {r:0.45}), 0, 0.0, 0, floorG); studioFloor.castShadow = false;
  // 복도 큰 타일 줄눈
  const lineM = mat("#DDD5C7", {r:0.8});
  for(let i = 13.6; i < 25.2; i += 1.6) mesh(rbox(0.025, 0.01, 2.0, 0.004), lineM, X(i), 0.006, Z(8), floorG, false);
  // 바닥에 비친 빛줄기
  const streakM = new THREE.MeshBasicMaterial({color:0xffffff, transparent:true, opacity:0.32, depthWrite:false});
  for(let k = 0; k < 4; k++){ const s = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 5.6), streakM); s.rotation.set(-Math.PI / 2, 0, -0.5); s.position.set(X(14.6 + k * 2.4), 0.018, Z(3.4)); floorG.add(s); }

  /* 뒷벽 (컷어웨이: 카메라가 벽 뒤로 가면 낮아짐) */
  const wallG = new THREE.Group(); wallG.position.z = Z(0); scene.add(wallG);
  const wallStudio = mesh(rbox(10.8, WALL_H, 0.22, 0.04), mat("#F2C4D5", {r:0.9}), 0, WALL_H / 2, -0.11, wallG);
  [[-6.0, 1.2], [6.0, 1.2]].forEach(([x, w]) => mesh(rbox(w, WALL_H, 0.22, 0.04), mat("#EEE5D7", {r:0.9}), x, WALL_H / 2, -0.11, wallG));
  mesh(rbox(13.2, 0.08, 0.28, 0.03), mat("#CDBDA6"), 0, WALL_H + 0.04, -0.11, wallG);
  const decoG = new THREE.Group(); wallG.add(decoG);
  // 무지개 (2.5D와 같은 반지름·위치)
  const rbMats = RAINBOW.map(c => mat(c, {r:0.55, e:c, ei:0}));
  RAINBOW.forEach((c, k) => {
    const r = (98 - k * 7.2) / 31.3;
    const g = K.geo("rb" + k, () => new THREE.TorusGeometry(r, 0.118, 12, 72, Math.PI));
    const o = mesh(g, rbMats[k], X(17.4), 8 / 31.3, 0.08, decoG); o.scale.z = 0.5;
  });
  const puff = (i, y, s) => {
    const g = new THREE.Group(); g.position.set(X(i), y, 0.1); decoG.add(g);
    [[-1.1,0.25,0.75],[0,-0.25,1],[1.1,0.15,0.8],[0.5,0.45,0.7],[-0.5,0.5,0.7]].forEach(([dx, dy, r], k) =>
      mesh(sph(r * s * 0.42, 18, 12), mat(k < 3 ? "#FFFFFF" : "#F5EEF8", {r:0.95}), dx * s * 0.42, -dy * s * 0.42, 0, g).scale.z = 0.55);
  };
  puff(14.3, 0.45, 1.25); puff(20.5, 0.45, 1.25); puff(13.5, 2.94, 0.6); puff(23.4, 3.13, 0.5);
  // OOOhouse 네온
  const neonTex = canvasTex(1024, 256, (x, w, h) => { x.font = `800 150px ${FONT}`; x.textAlign = "center"; x.textBaseline = "middle";
    x.shadowColor = "#F06BA8"; x.shadowBlur = 36; x.fillStyle = "#FFFFFF"; for(let k = 0; k < 3; k++) x.fillText("OOOhouse", w / 2, h / 2 + 6); });
  const neon = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.8), new THREE.MeshBasicMaterial({map:neonTex, transparent:true, depthWrite:false, toneMapped:false}));
  neon.position.set(X(22.3), 2.3, 0.02); decoG.add(neon);
  let signMat = new THREE.MeshBasicMaterial({transparent:true, depthWrite:false});
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.3), signMat); sign.position.set(X(22.3), 1.75, 0.02); decoG.add(sign);
  const drawSign = dark => { signMat.map?.dispose(); signMat.map = canvasTex(1024, 90, (x, w, h) => { x.font = `600 46px ${FONT}`; x.textAlign = "center"; x.textBaseline = "middle"; x.fillStyle = dark ? "#E8C4D4" : "#9C5A78"; x.fillText("예운옥 · 200평 핑크 무지개구름 스튜디오", w / 2, h / 2); }); signMat.needsUpdate = true; };

  /* 하얀 단상 소파 + 핑크 쿠션 */
  const white = mat("#FFFFFF", {r:0.7}), lilacW = mat("#F3ECF7", {r:0.75});
  mesh(rbox(2.4, 0.34, 0.9, 0.08), white, X(16.2), 0.17, Z(1.35));
  mesh(rbox(2.4, 0.66, 0.24, 0.08), lilacW, X(16.2), 0.34 + 0.33, Z(1.02));
  [15.4, 16.2, 17.0].forEach((i, k) => { const c = mesh(rbox(0.52, 0.42, 0.16, 0.07), mat("#E8B5C8", {r:0.85}), X(i), 0.58, Z(1.22)); c.rotation.set(-0.25, (k - 1) * 0.12, 0); });

  /* 바닥 구름 */
  const floorCloud = (i, j, s) => {
    const g = new THREE.Group(); g.position.set(X(i), 0, Z(j)); scene.add(g);
    [[-16,4,13],[0,-6,17],[16,3,13],[-6,8,12],[8,8,12]].forEach(([dx, dy, r], k) => {
      const rr = r * s * 0.034; mesh(sph(rr, 20, 14), mat(k < 3 ? "#FFFFFF" : "#F1E6F6", {r:0.95}), dx * s * 0.034, rr * 0.78, dy * s * 0.03, g); });
  };
  floorCloud(13.7, 2.3, 1.0); floorCloud(20.3, 1.6, 1.25); floorCloud(19.0, 2.6, 0.7);

  /* 삼각대 · 소프트박스 · 카메라 */
  const metal = mat("#5E5C57", {r:0.45}), black = mat("#2A2A2C", {r:0.6});
  const tripod = (g, h) => {
    [0, 2.09, 4.19].forEach(a => { const l = mesh(cyl(0.018, 0.018, h * 1.04, 6), metal, Math.cos(a) * 0.17, h / 2, Math.sin(a) * 0.17, g); l.rotation.set(Math.sin(a) * 0.2, 0, -Math.cos(a) * 0.2); });
    mesh(cyl(0.025, 0.025, 0.35, 8), metal, 0, h + 0.12, 0, g);
  };
  const aim = (g, i, j) => { g.rotation.y = Math.atan2(X(i) - g.position.x, Z(j) - g.position.z); };
  const softboxes = [];
  const softbox = (i, j, lit) => {
    const g = new THREE.Group(); g.position.set(X(i), 0, Z(j)); scene.add(g); tripod(g, 1.55);
    const head = new THREE.Group(); head.position.y = 2.05; g.add(head);
    mesh(rbox(0.78, 0.98, 0.32, 0.05), black, 0, 0, 0, head);
    const face = mesh(new THREE.PlaneGeometry(0.68, 0.86), new THREE.MeshStandardMaterial({color:lit ? 0xFFFDF4 : 0xE8E6E2, emissive:lit ? 0xFFF4DE : 0, emissiveIntensity:lit ? 0.9 : 0, roughness:0.9}), 0, 0, 0.165, head, false);
    head.rotation.x = 0.18; aim(g, 16.2, 1.4); softboxes.push({g, face, lit}); return g;
  };
  softbox(14.3, 4.0, true); softbox(20.4, 3.4, false);
  { const g = new THREE.Group(); g.position.set(X(17.6), 0, Z(4.8)); scene.add(g); tripod(g, 1.22);
    const body = new THREE.Group(); body.position.y = 1.5; g.add(body);
    mesh(rbox(0.3, 0.26, 0.46, 0.05), mat("#1D1D1F", {r:0.5}), 0, 0, 0, body);
    const lens = mesh(cyl(0.085, 0.095, 0.24, 18), mat("#303033", {r:0.4}), 0, 0, 0.32, body); lens.rotation.x = Math.PI / 2;
    mesh(cyl(0.07, 0.07, 0.01, 18), mat("#3D6D88", {r:0.15}), 0, 0, 0.445, body, false).rotation.x = Math.PI / 2;
    mesh(sph(0.022, 8, 6), new THREE.MeshBasicMaterial({color:0xFF4B3E}), 0.1, 0.1, -0.16, body, false);
    mesh(rbox(0.22, 0.15, 0.04, 0.02), mat("#111"), 0, 0.03, -0.24, body, false);
    g.rotation.y = Math.atan2(X(16.2) - X(17.6), Z(1.4) - Z(4.8)); }

  /* 노라 이사님 라일락 암체어 + 사이드 테이블 */
  { const lil = mat("#C8B4D0", {r:0.9}), lilD = mat("#B7A0C1", {r:0.9});
    const g = new THREE.Group(); g.position.set(X(NORA_SEAT[0]), 0, Z(NORA_SEAT[1])); scene.add(g);
    mesh(rbox(0.96, 0.36, 0.86, 0.1), lil, 0, 0.2, 0, g);
    mesh(rbox(0.76, 0.1, 0.72, 0.05), mat("#D8C8DF", {r:0.95}), 0, 0.41, 0.04, g);
    mesh(rbox(0.96, 0.78, 0.22, 0.1), lilD, 0, 0.62, -0.36, g);
    [-1, 1].forEach(s => mesh(rbox(0.17, 0.58, 0.86, 0.08), lilD, s * 0.44, 0.33, 0, g)); }
  { const g = new THREE.Group(); g.position.set(X(23.65), 0, Z(3.0)); scene.add(g);
    mesh(cyl(0.3, 0.3, 0.05, 28), white, 0, 0.62, 0, g); mesh(cyl(0.03, 0.03, 0.6, 8), metal, 0, 0.31, 0, g); mesh(cyl(0.18, 0.2, 0.03, 20), metal, 0, 0.015, 0, g);
    mesh(cyl(0.06, 0.055, 0.12, 14), mat("#E8B5C8"), -0.1, 0.71, 0.05, g); mesh(rbox(0.2, 0.015, 0.27, 0.006), mat("#2A2A28"), 0.1, 0.655, -0.04, g); }

  /* 화분 */
  const plant = (i, j) => { const g = new THREE.Group(); g.position.set(X(i), 0, Z(j)); scene.add(g);
    mesh(cyl(0.2, 0.15, 0.4, 16), mat("#ECE6DC"), 0, 0.2, 0, g);
    [[0,0.75,0,0.26],[-0.15,0.6,0.08,0.2],[0.16,0.62,-0.05,0.2],[0.04,0.95,0.04,0.18]].forEach(([x, y, z, r], k) => mesh(sph(r, 16, 12), mat(k % 2 ? "#78B796" : "#5FA582", {r:0.85}), x, y, z, g)); };
  plant(23.7, 0.5); plant(13.65, 6.5);

  /* 책상 (모니터 빛 = PD 상태) */
  const desks = {};
  Object.entries(DESKS).forEach(([id, [di, dj, dw, dd]]) => {
    const g = new THREE.Group(); g.position.set(X(di + dw / 2), 0, Z(dj + dd / 2)); scene.add(g);
    mesh(rbox(dw, 0.05, dd, 0.02), mat("#F6F2EB", {r:0.6}), 0, 0.8, 0, g);
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a, b]) => mesh(cyl(0.025, 0.025, 0.78, 8), metal, a * (dw / 2 - 0.08), 0.39, b * (dd / 2 - 0.08), g));
    mesh(cyl(0.025, 0.025, 0.22, 8), metal, 0, 0.93, -dd / 2 + 0.24, g);
    mesh(rbox(0.3, 0.02, 0.18, 0.008), metal, 0, 0.83, -dd / 2 + 0.24, g);
    mesh(rbox(0.92, 0.56, 0.05, 0.02), mat("#5E5C57", {r:0.4}), 0, 1.3, -dd / 2 + 0.2, g);
    const screen = mesh(new THREE.PlaneGeometry(0.84, 0.48), new THREE.MeshStandardMaterial({color:0x3A3F47, emissive:0x000000, roughness:0.3}), 0, 1.3, -dd / 2 + 0.228, g, false);
    mesh(rbox(0.6, 0.025, 0.17, 0.01), mat("#E4E0D8", {r:0.7}), 0, 0.835, dd / 2 - 0.2, g);
    if(id === "studio") mesh(rbox(0.3, 0.3, 0.3, 0.05), mat("#D9A3B7"), -dw / 2 + 0.35, 0.97, -0.05, g);
    if(id === "promo"){ mesh(rbox(0.34, 0.012, 0.26, 0.004), white, dw / 2 - 0.33, 0.83, 0.02, g); mesh(rbox(0.3, 0.012, 0.22, 0.004), mat("#E8B5C8"), dw / 2 - 0.32, 0.842, 0.03, g); }
    // 의자 (사람은 책상 앞 +z 쪽에 앉아 모니터를 봄)
    const ch = new THREE.Group(); ch.position.set(0, 0, dd / 2 + 0.38); g.add(ch);
    const cm = mat("#AA94B6", {r:0.85});
    mesh(rbox(0.5, 0.08, 0.48, 0.04), cm, 0, 0.41, 0, ch); mesh(rbox(0.48, 0.55, 0.08, 0.04), cm, 0, 0.78, 0.25, ch);
    mesh(cyl(0.03, 0.03, 0.36, 8), metal, 0, 0.2, 0, ch); mesh(cyl(0.24, 0.24, 0.03, 5), metal, 0, 0.03, 0, ch);
    desks[id] = {g, screen, seat:new THREE.Vector3(X(di + dw / 2), 0, Z(dj + dd + 0.36))};
  });

  return {renderer, scene, camera, controls, layer, K, hemi, sun, glowL, boxL, wallG, decoG, wallStudio, rbMats, softboxes, desks, drawSign, envTex,
    people:{}, sel:null, t0:performance.now(), last:0, userMoved:false};
}

/* ---------- 사람 · 이름표 ---------- */
function addPerson(id, info){
  const p = makePerson(R.K, info.look, info.build || {});
  R.scene.add(p.root);
  p.pickers.forEach(m => m.userData.pid = id);
  const tag = document.createElement("button"); tag.type = "button"; tag.className = "t3-tag";
  tag.innerHTML = `<i></i><b></b>`; tag.querySelector("b").textContent = info.name;
  tag.addEventListener("click", e => { e.stopPropagation(); select(id); });
  tag.hidden = true;
  const bub = document.createElement("div"); bub.className = "t3-bub"; bub.hidden = true;
  const stem = document.createElement("div"); stem.className = "t3-stem"; stem.hidden = true;
  R.layer.append(stem, bub, tag);
  const P = R.people[id] = {id, info, p, tag, bub, stem, say:null, sayUntil:0, ph:Math.random() * 6, mode:"sit", heading:0};
  setStatus(id, info.status);
  return P;
}
function setStatus(id, st){
  const P = R.people[id]; if(!P) return; P.info.status = st;
  P.tag.querySelector("i").style.background = P.info.hex || ST_COLOR[st] || ST_COLOR.idle;
  const d = R.desks[id]; if(d){ const on = st && st !== "idle"; d.screen.material.color.set(on ? 0x1D2230 : 0x3A3F47); d.screen.material.emissive.set(on ? ST_COLOR[st] : 0x000000); d.screen.material.emissiveIntensity = on ? 0.55 : 0; }
}
function say(id, text, ms = 2900){ const P = R.people[id]; if(!P) return; P.say = text; P.sayUntil = clock() + ms; }
function select(id){
  R.sel = R.sel === id ? null : id;
  Object.values(R.people).forEach(P => P.tag.classList.toggle("on", P.id === R.sel));
  R.opts.onPick?.(R.sel ? R.people[R.sel].info : null);
}

/* 크레용 방문: 복도에서 걸어와 노라 이사님과 이야기하고 돌아감 (2.5D 타워의 노라 방문과 같은 대사) */
const VISIT_PATH = [[25.9, 8.0], [24.5, 8.0], [24.5, 4.1], [22.9, 3.75]];
const VISIT_TALK = [["_dir", "예운옥 대관 일정 같이 보자 🌈"], ["_nora", "좋아, 저녁에 정리하자"], ["_dir", "이번 주말 촬영 손님 확인했어 📸"], ["_nora", "응, 세팅은 내가 챙길게 ☁️"]];
function planVisit(now){
  const D = R.people._dir; if(!D) return;
  const v = R.visit || (R.visit = {state:"away", next:now + 6000});
  if(v.state === "away" && now > v.next){ v.state = "in"; v.path = VISIT_PATH.map(([i, j]) => new THREE.Vector3(X(i), 0, Z(j))); v.k = 0; D.p.root.position.copy(v.path[0]); D.p.root.visible = true; D.tag.hidden = false; }
  if(v.state === "talk" && now > v.until){ v.state = "out"; v.path = VISIT_PATH.slice().reverse().map(([i, j]) => new THREE.Vector3(X(i), 0, Z(j))); v.k = 0; }
}
function walk(P, path, dt){
  const v = R.visit, pos = P.p.root.position, tgt = path[v.k + 1]; if(!tgt) return true;
  const d = tgt.clone().sub(pos); d.y = 0; const len = d.length(), sp = 1.15 * dt;
  if(len <= sp){ pos.copy(tgt); v.k++; return !path[v.k + 1]; }
  pos.addScaledVector(d.normalize(), sp);
  const want = Math.atan2(d.x, d.z); let da = want - P.heading; da = Math.atan2(Math.sin(da), Math.cos(da)); P.heading += da * Math.min(1, dt * 10);
  P.step = (P.step || 0) + sp * 5.2; return false;
}

/* ---------- 매 프레임 ---------- */
const tmp = new THREE.Vector3();
const clock = () => (R && R.now) || performance.now();
function frame(now){
  if(!R || !R.live) return;
  R.raf = requestAnimationFrame(frame);
  tick(now);
}
function tick(now){
  now += R.off || 0;
  const minGap = coarse ? 1000 / 40 : 0;
  if(now - R.last < minGap) return;
  R.now = now;
  const dt = Math.min(0.05, (now - (R.last || now)) / 1000); R.last = now;
  const t = (now - R.t0) / 1000;

  // 처음 들어올 때 살짝 다가오기
  if(R.intro && !R.userMoved){ const u = Math.min(1, (now - R.intro.t0) / 1800), e = 1 - Math.pow(1 - u, 3); setSph(R.intro.from + (R.home.az - R.intro.from) * e, R.home.pol, R.intro.d0 + (R.home.d - R.intro.d0) * e); if(u >= 1) R.intro = null; }
  if(R.back){ const u = Math.min(1, (now - R.back.t0) / 750), e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
    R.camera.position.lerpVectors(R.back.p0, R.back.p1, e); R.controls.target.lerpVectors(R.back.q0, R.back.q1, e); if(u >= 1) R.back = null; }
  const tg = R.controls.target; tg.x = THREE.MathUtils.clamp(tg.x, -6, 6); tg.y = THREE.MathUtils.clamp(tg.y, 0.2, 2.6); tg.z = THREE.MathUtils.clamp(tg.z, -3.2, 5.2);
  R.controls.update();

  // 벽 뒤로 돌면 벽을 낮춤
  const behind = R.camera.position.z < Z(0) + 0.4;
  const wy = R.wallG.scale.y, want = behind ? 0.1 : 1;
  if(Math.abs(wy - want) > 0.001){ R.wallG.scale.y = wy + (want - wy) * Math.min(1, dt * 7); R.decoG.visible = R.wallG.scale.y > 0.35; }

  planVisit(now);
  Object.values(R.people).forEach(P => {
    const {p, info} = P, root = p.root;
    if(info.role === "visitor"){
      const v = R.visit;
      if(!v || v.state === "away"){ root.visible = false; P.tag.hidden = true; P.bub.hidden = true; return; }
      if(v.state === "in" || v.state === "out"){
        const done = walk(P, v.path, dt); root.rotation.y = P.heading; pose(p, "walk", t, {step:P.step});
        if(done){ if(v.state === "in"){ v.state = "talk"; v.line = 0; v.lineAt = now; v.until = now + VISIT_TALK.length * 2900 + 600; say(VISIT_TALK[0][0], VISIT_TALK[0][1]); }
          else { v.state = "away"; v.next = now + 45000 + Math.random() * 30000; } }
      } else if(v.state === "talk"){
        const want = Math.atan2(X(NORA_SEAT[0]) - root.position.x, Z(NORA_SEAT[1]) - root.position.z); P.heading += (want - P.heading) * Math.min(1, dt * 6); root.rotation.y = P.heading;
        const k = Math.min(VISIT_TALK.length - 1, Math.floor((now - v.lineAt) / 2900));
        if(k !== v.line){ v.line = k; say(VISIT_TALK[k][0], VISIT_TALK[k][1]); }
        pose(p, "stand", t, {talk:VISIT_TALK[v.line][0] === "_dir", ph:P.ph});
      }
    } else if(info.role === "nora"){
      const v = R.visit, talking = v && v.state === "talk";
      const greet = talking && now - v.lineAt < 1400 && v.line === 0;
      pose(p, talking ? "sit" : "tablet", t, {ph:P.ph, wave:greet, talk:talking && VISIT_TALK[v.line][0] === "_nora", turn:talking ? 0.35 : 0});
      p.tablet.visible = !talking;
    } else {
      const st = info.status;
      const s = P.stretch;
      if(s && now < s.end){ const u = Math.sin(Math.PI * (now - s.t0) / (s.end - s.t0)); pose(p, "stretch", t, {u, ph:P.ph}); }
      else { P.stretch = null; pose(p, st === "idle" ? "sit" : "type", t, {ph:P.ph, nod:!!P.say && now < P.sayUntil});
        if(!reduce && st === "idle" && Math.random() < dt / 40) P.stretch = {t0:now, end:now + 2600}; }
    }
  });

  R.renderer.render(R.scene, R.camera);

  // 이름표 · 말풍선 (화면 정면). 가까운 사람 이름표가 먼저 자리를 잡고, 겹치면 뒤쪽 이름표가 위로 비켜 섬
  const w = R.w, h = R.h, items = [], placed = [];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const free = (x, y, tw, th) => { for(let g = 0; g < 8; g++){ const hit = placed.find(r => Math.abs(r.x - x) < (r.w + tw) / 2 + 3 && Math.abs(r.y - y) < (r.h + th) / 2 + 2); if(!hit) break; y = hit.y - (hit.h + th) / 2 - 3; } return y; };
  Object.values(R.people).forEach(P => {
    P.stem.hidden = true;
    if(!P.p.root.visible){ P.tag.hidden = true; P.bub.hidden = true; return; }
    P.p.head.getWorldPosition(tmp); tmp.y += 0.6 * P.p.root.scale.y; tmp.project(R.camera);
    if(!(tmp.z < 1 && Math.abs(tmp.x) < 1.15 && Math.abs(tmp.y) < 1.15)){ P.tag.hidden = true; P.bub.hidden = true; return; }
    P.tag.hidden = false; if(!P.tw){ P.tw = P.tag.offsetWidth; P.th = P.tag.offsetHeight; }
    items.push({P, x:(tmp.x * 0.5 + 0.5) * w, y:(-tmp.y * 0.5 + 0.5) * h, z:tmp.z});
  });
  items.sort((a, b) => a.z - b.z);
  items.forEach(it => { const P = it.P, x = clamp(it.x, P.tw / 2 + 4, w - P.tw / 2 - 4), y = free(x, it.y - P.th / 2, P.tw, P.th);
    placed.push({x, y, w:P.tw, h:P.th}); it.tx = x; it.ty = y; P.tag.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%)`; });
  items.forEach(it => { const P = it.P;
    const showSay = P.say && now < P.sayUntil, showSel = R.sel === P.id;
    const text = showSay ? P.say : showSel ? `${P.info.roleKo}${P.info.task ? " · " + P.info.task : ""}` : "";
    if(!text){ P.bub.hidden = true; return; }
    if(P.bub.textContent !== text){ P.bub.textContent = text; P.bw = 0; }
    P.bub.hidden = false; P.bub.classList.toggle("info", !showSay);
    if(!P.bw){ P.bw = P.bub.offsetWidth; P.bh = P.bub.offsetHeight; }
    const bx = clamp(it.tx, P.bw / 2 + 4, w - P.bw / 2 - 4), by = free(bx, it.ty - P.th / 2 - 5 - P.bh / 2, P.bw, P.bh);
    placed.push({x:bx, y:by, w:P.bw, h:P.bh}); P.bub.style.transform = `translate(${bx}px,${by}px) translate(-50%,-50%)`;
    const top = by + P.bh / 2, gap = it.ty - P.th / 2 - top;   // 비켜 선 말풍선은 가는 선으로 이름표와 이음
    if(gap > 7){ const sx = clamp(it.tx, bx - P.bw / 2 + 12, bx + P.bw / 2 - 12); P.stem.hidden = false; P.stem.classList.toggle("info", !showSay); P.stem.style.height = gap + "px"; P.stem.style.transform = `translate(${sx}px,${top}px)`; } });
}

function setSph(az, pol, d){
  const tg = R.controls.target;
  R.camera.position.set(tg.x + d * Math.sin(pol) * Math.sin(az), tg.y + d * Math.cos(pol), tg.z + d * Math.sin(pol) * Math.cos(az));
  R.camera.lookAt(tg);
}
/* 처음 시점: 정한 각도에서 구역 전체(벽 꼭대기~앞 복도)가 화면에 꼭 맞는 거리·중심을 계산 */
const V3 = a => new THREE.Vector3(...a);
const FIT = [[-6.6,0,-3.6],[6.6,0,-3.6],[-6.6,0,4.7],[6.6,0,4.7],[-6.6,3.7,-3.6],[6.6,3.7,-3.6],[-6.6,1.9,4.2],[6.6,1.9,4.2]].map(V3);
const FIT_CORE = [[-5.4,0,-3.6],[5.4,0,-3.6],[-5.4,0,3.4],[5.4,0,3.4],[-5.4,3.7,-3.6],[5.4,3.7,-3.6],[-5.4,1.9,3.0],[5.4,1.9,3.0]].map(V3);   // 세로 화면은 핑크 스튜디오만 꽉 차게
function homeView(){
  const portrait = R.h > R.w * 1.05, az = portrait ? 0.86 : 0.62, pol = portrait ? 0.96 : 0.98;
  const cam = R.camera, p0 = cam.position.clone(), q0 = cam.quaternion.clone();
  const dir = new THREE.Vector3(Math.sin(pol) * Math.sin(az), Math.cos(pol), Math.sin(pol) * Math.cos(az));
  const tg = new THREE.Vector3(0, 1.0, 0.6), v = new THREE.Vector3(), MX = portrait ? 0.97 : 0.92, MY = 0.84, BOX = portrait ? FIT_CORE : FIT;
  const place = d => { cam.position.copy(tg).addScaledVector(dir, d); cam.lookAt(tg); cam.updateMatrixWorld(); };
  const ext = () => { let x0 = 9, x1 = -9, y0 = 9, y1 = -9; BOX.forEach(c => { v.copy(c).project(cam); x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y); }); return {x0, x1, y0, y1}; };
  let d = 20;
  for(let it = 0; it < 3; it++){
    let lo = 3, hi = 90;
    for(let k = 0; k < 24; k++){ const m = (lo + hi) / 2; place(m); const e = ext(); (Math.max(-e.x0, e.x1) / MX > 1 || Math.max(-e.y0, e.y1) / MY > 1) ? lo = m : hi = m; }
    d = hi; place(d); const e = ext(), tz = v.copy(tg).project(cam).z;
    const c = new THREE.Vector3((e.x0 + e.x1) / 2, (e.y0 + e.y1) / 2 - 0.04, tz).unproject(cam);   // 아래쪽에 살짝 여유 (이름표가 위에 뜨니까)
    tg.add(c.sub(tg));
  }
  cam.position.copy(p0); cam.quaternion.copy(q0);
  return {az, pol, d, target:tg};
}
function resize(){
  const r = R.host.getBoundingClientRect(); R.w = Math.max(1, r.width); R.h = Math.max(1, r.height);
  R.renderer.setSize(R.w, R.h, false); R.camera.aspect = R.w / R.h; R.camera.updateProjectionMatrix();
  R.home = homeView(); R.controls.maxDistance = Math.max(30, R.home.d * 1.5);
  if(!R.userMoved && !R.intro && !R.back && R.started){ R.controls.target.copy(R.home.target); setSph(R.home.az, R.home.pol, R.home.d); }   // 화면을 돌리면 다시 맞춤
}

export function setTheme(dark){
  if(!R) return; R.dark = dark;
  R.renderer.toneMappingExposure = dark ? 0.55 : 0.78;
  R.sun.intensity = dark ? 0.22 : 1.25; R.sun.color.set(dark ? 0xA9B4FF : 0xFFF1E2);
  R.hemi.intensity = dark ? 0.12 : 0.35; R.hemi.color.set(dark ? 0x8F86C8 : 0xFFF6F0);
  R.K.mats.forEach(m => { m.envMapIntensity = dark ? 0.16 : 0.55; });
  R.rbMats.forEach(m => { m.emissiveIntensity = dark ? 0.85 : 0; });
  R.glowL.intensity = dark ? 9 : 0;
  R.softboxes.forEach(s => { if(s.lit){ s.face.material.emissiveIntensity = dark ? 2.2 : 0.9; s.face.getWorldPosition(tmp); R.boxL.position.copy(tmp).add(new THREE.Vector3(0.4, -0.3, -0.6)); } });
  R.boxL.intensity = dark ? 4 : 0;
  R.drawSign(dark);
}

export function reset(){
  if(!R) return; R.intro = null;
  const h = R.home, tg = h.target, p1 = new THREE.Vector3(tg.x + h.d * Math.sin(h.pol) * Math.sin(h.az), tg.y + h.d * Math.cos(h.pol), tg.z + h.d * Math.sin(h.pol) * Math.cos(h.az));
  R.back = {t0:clock(), p0:R.camera.position.clone(), p1, q0:R.controls.target.clone(), q1:tg.clone()};
}

export function webglOK(){ try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch(e){ return false; } }

/* host: 크기가 정해진 상자. opts.people: [{id, name, roleKo, role:"pd"|"nora"|"visitor", look, build, status, task, hex}] */
export function open(host, opts = {}){
  if(R){ R.closed = false; if(!R.live){ R.live = true; R.last = 0; R.raf = requestAnimationFrame(frame); } return R; }
  R = build(host, opts); R.host = host; R.opts = opts; R.live = true;
  (opts.people || []).forEach(info => {
    const P = addPerson(info.id, info), root = P.p.root;
    if(info.role === "pd"){ const d = R.desks[info.id]; root.position.copy(d.seat); root.rotation.y = Math.PI; P.heading = Math.PI; }
    if(info.role === "nora"){ root.position.set(X(NORA_SEAT[0]), 0, Z(NORA_SEAT[1]) + 0.08); root.rotation.y = 0;
      const tab = R.K.mesh(R.K.rbox(0.3, 0.02, 0.22, 0.01), R.K.mat("#2A2A28"), 0, 0.3, 0.3, P.p.chest); tab.rotation.x = -0.95;
      R.K.mesh(new THREE.PlaneGeometry(0.26, 0.18), new THREE.MeshBasicMaterial({color:0xF7E6EE}), 0, 0.0115, 0, tab, false).rotation.x = -Math.PI / 2;
      P.p.tablet = tab; }
    if(info.role === "visitor"){ root.visible = false; }
  });
  resize(); setTheme(!!opts.dark);
  const h = R.home; R.controls.target.copy(h.target);
  if(reduce) setSph(h.az, h.pol, h.d); else { R.intro = {t0:clock(), from:h.az + 0.55, d0:h.d * 1.35}; setSph(R.intro.from, h.pol, R.intro.d0); }
  R.started = true;
  R.controls.addEventListener("start", () => { R.userMoved = true; R.intro = null; R.back = null; });
  new ResizeObserver(() => resize()).observe(host);

  // 누르기 (끌지 않고 톡 누른 것만)
  const ray = new THREE.Raycaster(), v2 = new THREE.Vector2(); let down = null;
  const cv = R.renderer.domElement;
  cv.addEventListener("pointerdown", e => { down = [e.clientX, e.clientY]; });
  cv.addEventListener("pointerup", e => {
    if(!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6){ down = null; return; } down = null;
    const r = cv.getBoundingClientRect(); v2.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
    ray.setFromCamera(v2, R.camera);
    const hit = ray.intersectObjects(Object.values(R.people).filter(P => P.p.root.visible).flatMap(P => P.p.pickers), false)[0];
    if(hit) select(hit.object.userData.pid); else if(R.sel) select(R.sel);
  });
  document.addEventListener("visibilitychange", () => { if(!R) return; if(document.hidden){ cancelAnimationFrame(R.raf); R.live = false; } else if(!R.live && !R.closed){ R.live = true; R.last = 0; R.raf = requestAnimationFrame(frame); } });
  R.raf = requestAnimationFrame(frame);
  return R;
}
export function close(){ if(R){ R.live = false; R.closed = true; cancelAnimationFrame(R.raf); } }
export function setPerson(id, patch){ if(!R || !R.people[id]) return; Object.assign(R.people[id].info, patch); if(patch.status) setStatus(id, patch.status); }
export const _dbg = () => R;
/* 미리보기 시험용: 창이 숨어 있어도 시간을 넘겨 봄 */
export function _pump(sec, step = 33){ for(let k = 0; k < sec * 1000 / step; k++){ R.off = (R.off || 0) + step; tick(performance.now()); } }
