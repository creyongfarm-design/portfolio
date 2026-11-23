/* 옥상 멍 모드 3D (2026-11-20 감독님: "하나만 우선 해볼까" → 멍 모드만 진짜 3D, 나머지 타워는 2.5D 그대로)
   - 멍 모드 버튼을 누를 때만 three.js와 캐릭터(트리포로 만든 크레용, mung/director.json + director.jpg (아티팩트가 .glb를 못 올려서 glTF로 나눔))를 불러옴
   - 카메라는 천천히 돌고, 손가락·마우스로 돌려 볼 수 있음. 낮·노을·밤에 맞춰 하늘·조명이 바뀜
   - 실패하면(웹GL 없음 등) 예전 2D 멍 모드가 그대로 보임 */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";


const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const PH = {
  day:    {top:0x8FCBEA, mid:0xBFE2F1, bot:0xEAF5F8, fog:0xDCEBF1, hemi:[0xFFFFFF, 0x9C8F80, 1.25], sun:[0xFFF4E0, 1.6, [6, 10, 4]], fire:2.5, bulb:0.15, win:0.0, stars:0, exp:1.0},
  sunset: {top:0x5E5C9E, mid:0xEE8F78, bot:0xFFD49A, fog:0xE7A58C, hemi:[0xFFC4B0, 0x5A4A60, 0.75], sun:[0xFF9A5C, 1.4, [-8, 3, -6]], fire:5, bulb:0.8, win:0.45, stars:0.15, exp:1.05},
  night:  {top:0x070B22, mid:0x141B44, bot:0x2A3466, fog:0x1B2246, hemi:[0x7C8CC8, 0x2A2A34, 0.7], sun:[0x9FB4FF, 0.35, [-4, 8, -6]], fire:7, bulb:1.0, win:1.0, stars:1, exp:1.1},
};

let R = null;   // 한 번 만든 장면은 다시 열 때 그대로 씀

function canvasTex(w, h, draw){ const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const glowTex = (inner, outer) => canvasTex(128, 128, (x, w) => { const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, inner); g.addColorStop(1, outer); x.fillStyle = g; x.fillRect(0, 0, w, w); });

function build(host, opts){
  const renderer = new THREE.WebGLRenderer({antialias: devicePixelRatio < 2, powerPreference: "low-power"});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 400);
  camera.position.set(0.9, 2.4, -3.9);   // 가족 셋이 다 보이는 앞쪽   // 모닥불 너머로 크레용 얼굴이 보이게
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(-0.2, 0.7, 1.1); controls.enableDamping = true; controls.enablePan = false;
  controls.minDistance = 3.2; controls.maxDistance = 6.6; controls.minPolarAngle = 0.55; controls.maxPolarAngle = 1.42;
  controls.addEventListener("start", () => { if(R) R.userMoved = true; });
  controls.autoRotate = !reduce; controls.autoRotateSpeed = 0.3;
  /* 가족 등 뒤로는 안 돌아감: 앞쪽 부채꼴 안에서만 천천히 왔다 갔다 (손으로도 그 안에서만) */
  const AZ0 = 2.95; let AZW = 1.05;
  controls.minAzimuthAngle = AZ0 - AZW; controls.maxAzimuthAngle = AZ0 + AZW - Math.PI * 2;

  /* 하늘 */
  const skyU = {top:{value:new THREE.Color()}, mid:{value:new THREE.Color()}, bot:{value:new THREE.Color()}};
  const sky = new THREE.Mesh(new THREE.SphereGeometry(200, 24, 16), new THREE.ShaderMaterial({side:THREE.BackSide, depthWrite:false, uniforms:skyU,
    vertexShader:"varying vec3 vp; void main(){ vp = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }",
    fragmentShader:"uniform vec3 top; uniform vec3 mid; uniform vec3 bot; varying vec3 vp; void main(){ float h = clamp(vp.y * 1.6 + .08, 0., 1.); vec3 c = h < .35 ? mix(bot, mid, h / .35) : mix(mid, top, (h - .35) / .65); gl_FragColor = vec4(c, 1.); }"}));
  scene.add(sky);
  scene.fog = new THREE.Fog(0x000000, 28, 110);
  const starG = new THREE.BufferGeometry(), sp = [];
  for(let k = 0; k < 420; k++){ const th = Math.random() * Math.PI * 2, ph = Math.random() * 1.2 + 0.18; sp.push(Math.cos(th) * Math.cos(ph) * 150, Math.sin(ph) * 150, Math.sin(th) * Math.cos(ph) * 150); }
  starG.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3));
  const stars = new THREE.Points(starG, new THREE.PointsMaterial({color:0xffffff, size:0.9, sizeAttenuation:true, transparent:true, opacity:1, fog:false, depthWrite:false}));
  scene.add(stars);

  /* 빛 */
  const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 1); scene.add(sun);
  const fireL = new THREE.PointLight(0xFF8A3D, 6, 9, 1.4); fireL.position.set(0, 1.0, 0); scene.add(fireL);

  /* 동네 건물 (멀리, 밤엔 창에 불) */
  const winTex = canvasTex(64, 128, (x, w, h) => { x.fillStyle = "#000"; x.fillRect(0, 0, w, h); for(let r = 0; r < 12; r++) for(let c = 0; c < 4; c++){ if(Math.random() < 0.45){ x.fillStyle = Math.random() < 0.5 ? "#FFD79A" : "#FFE9C4"; x.fillRect(6 + c * 15, 6 + r * 10, 8, 5); } } });
  const cityMat = new THREE.MeshLambertMaterial({color:0x8A8798, emissive:0xffffff, emissiveMap:winTex, emissiveIntensity:0});
  const city = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), cityMat, 46), m4 = new THREE.Matrix4();
  for(let k = 0; k < 46; k++){ const a = k / 46 * Math.PI * 2 + Math.random() * 0.08, r = 36 + Math.random() * 24, w = 4 + Math.random() * 5, h = 4 + Math.random() * 15;
    m4.compose(new THREE.Vector3(Math.cos(a) * r, h / 2 - 6, Math.sin(a) * r), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -a, 0)), new THREE.Vector3(w, h, w * 0.8)); city.setMatrixAt(k, m4);
    city.setColorAt(k, new THREE.Color().setHSL(0.68 + Math.random() * 0.08, 0.1, 0.55 + Math.random() * 0.2)); }
  scene.add(city);

  /* 옥상 바닥 · 데크 · 난간 */
  const slab = new THREE.Mesh(new THREE.CylinderGeometry(10, 10, 0.4, 48), new THREE.MeshLambertMaterial({color:0xBDB3A4})); slab.position.y = -0.2; scene.add(slab);
  const deckTex = canvasTex(256, 256, (x, w) => { x.fillStyle = "#9A6E4A"; x.fillRect(0, 0, w, w); for(let k = 0; k < 8; k++){ x.fillStyle = k % 2 ? "#8E6442" : "#A3774F"; x.fillRect(0, k * 32, w, 30); x.fillStyle = "rgba(0,0,0,.18)"; x.fillRect(0, k * 32 + 30, w, 2); } });
  deckTex.wrapS = deckTex.wrapT = THREE.RepeatWrapping; deckTex.repeat.set(3, 3);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.08, 8.6), new THREE.MeshLambertMaterial({map:deckTex})); deck.position.y = 0.04; scene.add(deck);
  const rail = new THREE.Mesh(new THREE.CylinderGeometry(10, 10, 0.7, 48, 1, true), new THREE.MeshLambertMaterial({color:0xD8D0C4, side:THREE.DoubleSide})); rail.position.y = 0.35; scene.add(rail);
  [[-6.2, -5.5], [6.5, -4.8], [-6.8, 4.6]].forEach(([x, z], k) => {   // 화분
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.35, 0.6, 12), new THREE.MeshLambertMaterial({color:0xE9E1D4})); pot.position.set(x, 0.3, z); scene.add(pot);
    const bush = new THREE.Mesh(new THREE.IcosahedronGeometry(0.7 + k * 0.1, 0), new THREE.MeshLambertMaterial({color:0x5FA582, flatShading:true})); bush.position.set(x, 1.05, z); scene.add(bush); });

  /* 모닥불: 돌 · 장작 · 불꽃 · 불씨 */
  const stoneM = new THREE.MeshLambertMaterial({color:0x8C8780, flatShading:true});
  for(let k = 0; k < 11; k++){ const a = k / 11 * Math.PI * 2, s = new THREE.Mesh(new THREE.DodecahedronGeometry(0.17 + Math.random() * 0.05, 0), stoneM); s.position.set(Math.cos(a) * 0.62, 0.15, Math.sin(a) * 0.62); s.rotation.set(Math.random(), Math.random(), 0); s.scale.y = 0.75; scene.add(s); }
  const logM = new THREE.MeshLambertMaterial({color:0x5A3B26});
  for(let k = 0; k < 4; k++){ const l = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.8, 7), logM), a = k / 4 * Math.PI * 2 + 0.4; l.position.set(Math.cos(a) * 0.18, 0.3, Math.sin(a) * 0.18); l.lookAt(0, 0.7, 0); l.rotateX(Math.PI / 2); scene.add(l); }
  const ember = new THREE.Mesh(new THREE.CircleGeometry(0.42, 18), new THREE.MeshBasicMaterial({color:0xFF6A1F})); ember.rotation.x = -Math.PI / 2; ember.position.y = 0.1; scene.add(ember);
  const flames = [[0xFF5A1A, 0.34, 0.95, 0], [0xFF9A2E, 0.26, 0.78, 1.7], [0xFFD45C, 0.16, 0.55, 3.1]].map(([c, r, h, o]) => {
    const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 10, 1, true), new THREE.MeshBasicMaterial({color:c, transparent:true, opacity:0.88, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide}));
    m.position.y = 0.16 + h / 2; m.userData = {h, o}; scene.add(m); return m; });
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex("rgba(255,150,60,1)", "rgba(255,120,40,0)"), blending:THREE.AdditiveBlending, depthWrite:false, transparent:true}));
  glow.scale.set(3.2, 3.2, 1); glow.position.y = 0.6; scene.add(glow);
  const EN = 36, eg = new THREE.BufferGeometry(), ep = new Float32Array(EN * 3), ev = [];
  for(let k = 0; k < EN; k++){ ev.push({x:(Math.random() - .5) * .4, y:Math.random() * 2, z:(Math.random() - .5) * .4, v:.4 + Math.random() * .6}); }
  eg.setAttribute("position", new THREE.BufferAttribute(ep, 3));
  const embers = new THREE.Points(eg, new THREE.PointsMaterial({color:0xFFB15A, size:0.05, transparent:true, opacity:0.9, blending:THREE.AdditiveBlending, depthWrite:false}));
  scene.add(embers);

  /* 맞은편 통나무 의자 · 머그컵 */
  const bench = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 1.5, 10), new THREE.MeshLambertMaterial({color:0x7A5236})); bench.rotation.z = Math.PI / 2; bench.rotation.y = 0.35; bench.position.set(-0.4, 0.22, -1.75); scene.add(bench);
  [[0.15, -1.62, 0xE8A04A], [-0.85, -1.85, 0x3A8A78]].forEach(([x, z, c]) => { const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.055, 0.12, 12), new THREE.MeshLambertMaterial({color:c})); mug.position.set(x, 0.48, z); scene.add(mug); });

  /* 전구줄 (기둥 4개 사이로 늘어짐) */
  const posts = [[-4.9, -4.9], [4.9, -4.9], [4.9, 4.9], [-4.9, 4.9]], postM = new THREE.MeshLambertMaterial({color:0x3B342E});
  posts.forEach(([x, z]) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 2.9, 6), postM); p.position.set(x, 1.45, z); scene.add(p); });
  const bulbPos = [], NB = 12;
  posts.forEach(([x0, z0], k) => { const [x1, z1] = posts[(k + 1) % 4]; for(let s = 0; s < NB; s++){ const u = (s + 0.5) / NB; bulbPos.push([x0 + (x1 - x0) * u, 2.8 - Math.sin(u * Math.PI) * 0.6, z0 + (z1 - z0) * u]); } });
  const bulbM = new THREE.MeshBasicMaterial({color:0xFFD38A});
  const bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.045, 8, 6), bulbM, bulbPos.length);
  bulbPos.forEach((p, k) => { m4.makeTranslation(...p); bulbs.setMatrixAt(k, m4); }); scene.add(bulbs);
  const wireG = new THREE.BufferGeometry().setFromPoints(posts.flatMap(([x0, z0], k) => { const [x1, z1] = posts[(k + 1) % 4], pts = []; for(let s = 0; s <= 16; s++){ const u = s / 16; pts.push(new THREE.Vector3(x0 + (x1 - x0) * u, 2.82 - Math.sin(u * Math.PI) * 0.6, z0 + (z1 - z0) * u)); if(s && s < 16) pts.push(pts[pts.length - 1].clone()); } return pts; }));
  scene.add(new THREE.LineSegments(wireG, new THREE.LineBasicMaterial({color:0x2A2522})));
  const bulbGlow = new THREE.Points(new THREE.BufferGeometry().setFromPoints(bulbPos.map(p => new THREE.Vector3(...p))), new THREE.PointsMaterial({map:glowTex("rgba(255,214,140,1)", "rgba(255,214,140,0)"), size:0.3, transparent:true, blending:THREE.AdditiveBlending, depthWrite:false}));
  scene.add(bulbGlow);

  /* 캐릭터 (트리포). 모닥불(원점) 둘레 각도 a에 앉힘: a=0이 +z, 얼굴은 불 쪽
     2026-11-20 감독님 "불멍에서 나 외롭네. 유나딸이랑 노라도 같이 넣자" → 크레용 · 유나(바로 옆) · 노라 이사님
     GLTFLoader는 data: 주소 버퍼를 fetch로 읽는데 배포된 아티팩트에선 막힐 수 있음(v86 "나 없는데?")
     → JSON은 직접 받아 base64를 풀고, 텍스처는 같은 폴더 jpg로 읽어 메쉬를 직접 만든다. 경로는 이 모듈 기준 */
  const shadowMat = new THREE.MeshBasicMaterial({map:glowTex("rgba(0,0,0,.45)", "rgba(0,0,0,0)"), transparent:true, depthWrite:false});
  const TA = {5126:Float32Array, 5123:Uint16Array, 5125:Uint32Array, 5121:Uint8Array}, N = {SCALAR:1, VEC2:2, VEC3:3, VEC4:4};
  async function loadChar(c){
    const url = new URL(c.url, import.meta.url).href, base = new URL("./", url).href;
    const r = await fetch(url, {cache:"no-cache"}); if(!r.ok) throw new Error(c.url + " " + r.status);
    const j = await r.json();
    const bin = Uint8Array.from(atob(j.buffers[0].uri.split(",")[1]), ch => ch.charCodeAt(0)).buffer;
    const acc = i => { const a = j.accessors[i], v = j.bufferViews[a.bufferView]; return new TA[a.componentType](bin, (v.byteOffset || 0) + (a.byteOffset || 0), a.count * N[a.type]); };
    const prim = j.meshes[0].primitives[0], pos = acc(prim.attributes.POSITION), idx = acc(prim.indices);
    const attrs = {position:new THREE.BufferAttribute(pos, 3)};
    if(prim.attributes.NORMAL != null) attrs.normal = new THREE.BufferAttribute(acc(prim.attributes.NORMAL), 3);
    if(prim.attributes.TEXCOORD_0 != null) attrs.uv = new THREE.BufferAttribute(acc(prim.attributes.TEXCOORD_0), 2);
    const tex = await new THREE.TextureLoader().loadAsync(new URL(j.images[0].uri, base).href);
    tex.flipY = false; tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshStandardMaterial({map:tex, roughness:0.9, metalness:0});
    let y0 = Infinity, y1 = -Infinity, x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    for(let k = 0; k < pos.length; k += 3){ x0 = Math.min(x0, pos[k]); x1 = Math.max(x1, pos[k]); y0 = Math.min(y0, pos[k+1]); y1 = Math.max(y1, pos[k+1]); z0 = Math.min(z0, pos[k+2]); z1 = Math.max(z1, pos[k+2]); }
    /* 머리 움직임: 메쉬를 자르면 입 근처에 틈이 보여서(v88 시험), 목 높이 띠 안에서 부드럽게 휘게 함 (셰이더) */
    const neckY = c.neck ? y0 + (y1 - y0) * c.neck : null, band = (y1 - y0) * (c.band || 0.06);
    let hx = 0, hz = 0, hn = 0;
    if(neckY != null) for(let k = 0; k < pos.length; k += 3) if(pos[k+1] > neckY){ hx += pos[k]; hz += pos[k+2]; hn++; }
    const head = neckY != null ? {rot:new THREE.Matrix3(), e:new THREE.Euler(), m4:new THREE.Matrix4(), rotation:{x:0, y:0, z:0}} : null;
    if(head){
      /* 얼굴형·체구 다르게 (2026-11-20 감독님 "우리가족이 다 비슷하게 생겼다고"): 트리포 셋이 같은 꼬마 비율이라
         어른 둘은 머리를 줄이고 몸을 늘려 어른 비율로, 머리 모양은 headS(가로·세로·깊이)로 넓적·갸름·동글하게 */
      const hs = c.headS || [1, 1, 1], bs = c.bodyS || [1, 1, 1];
      const U = {uNeck:{value:new THREE.Vector3(hx / hn, neckY, hz / hn)}, uBand:{value:new THREE.Vector2(neckY - band, neckY + band)}, uRot:{value:head.rot},
        uHeadS:{value:new THREE.Vector3(...hs)}, uBodyS:{value:new THREE.Vector3(...bs)}, uBase:{value:new THREE.Vector3((x0 + x1) / 2, y0, (z0 + z1) / 2)}};
      mat.onBeforeCompile = sh => {
        Object.assign(sh.uniforms, U);
        sh.vertexShader = "uniform vec3 uNeck; uniform vec2 uBand; uniform mat3 uRot; uniform vec3 uHeadS; uniform vec3 uBodyS; uniform vec3 uBase;\n" + sh.vertexShader
          .replace("#include <beginnormal_vertex>", "#include <beginnormal_vertex>\n float hw = smoothstep(uBand.x, uBand.y, position.y); objectNormal = normalize(mix(objectNormal, uRot * objectNormal, hw));")
          .replace("#include <begin_vertex>", "#include <begin_vertex>\n vec3 pb = uBase + uBodyS * (transformed - uBase); vec3 nk = uBase + uBodyS * (uNeck - uBase); vec3 ph = nk + uRot * (uHeadS * (transformed - uNeck)); transformed = mix(pb, ph, hw);");
      };
      mat.customProgramCacheKey = () => "headbend2";
    }
    const g = new THREE.BufferGeometry(); for(const n in attrs) g.setAttribute(n, attrs[n]); g.setIndex(new THREE.BufferAttribute(idx, 1)); if(!attrs.normal) g.computeVertexNormals();
    const hf = neckY != null ? ((neckY - y0) * (c.bodyS || [1, 1, 1])[1] + (y1 - neckY) * (c.headS || [1, 1, 1])[1]) / (y1 - y0) : 1;
    const s = c.h / ((y1 - y0) * hf), holder = new THREE.Group(); holder.scale.setScalar(s);
    holder.position.set(-(x0 + x1) / 2 * s, -y0 * s + 0.08, -(z0 + z1) / 2 * s);
    holder.add(new THREE.Mesh(g, mat));
    const lean = new THREE.Group(); lean.add(holder); lean.rotation.x = c.lean || 0;
    const pivot = new THREE.Group(), rr = c.r || 1.85; pivot.add(lean);
    pivot.position.set(Math.sin(c.a) * rr, 0, Math.cos(c.a) * rr);
    pivot.rotation.y = c.a + Math.PI / 2 + (c.turn || 0);   // 트리포 모델은 +x를 보고 나옴 → 불 쪽으로 (+turn은 옆 사람 쪽으로 살짝)
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(1.4 * c.h / 1.45, 1.0 * c.h / 1.45), shadowMat);
    sh.rotation.x = -Math.PI / 2; sh.position.set(pivot.position.x, 0.085, pivot.position.z); scene.add(sh);
    pivot.userData = {id:c.id, ph:Math.random() * 6, head, lean, base:c.lean || 0, h:c.h, laugh:-9, yaw:c.yaw || 0, nod:c.nodAmp || 0.06};
    if(c.id === "director") addStick(pivot);
    scene.add(pivot); R && R.chars.push(pivot); return pivot;
  }

  /* 마시멜로 굽기: 크레용 무릎에서 불 쪽으로 꼬챙이. 노릇해지면 유나가 하트 */
  const mallowM = new THREE.MeshLambertMaterial({color:0xFFFFFF, emissive:0x000000});
  let stick = null;
  function addStick(pv){
    stick = new THREE.Group();
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.01, 1.4, 5), new THREE.MeshLambertMaterial({color:0x8A6A48}));
    st.rotation.z = -Math.PI / 2 - 0.16; st.position.set(0.69, -0.055, 0); stick.add(st);
    const ml = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.08, 12), mallowM); ml.rotation.z = Math.PI / 2; ml.position.set(1.36, -0.16, 0); stick.add(ml);
    stick.position.set(0.12, 0.62, 0.06); pv.add(stick);
  }

  /* 웃음·하트 말풍선 (위로 떠오르며 사라짐) */
  const POP = ["하하", "ㅋㅋ", "♪", "ㅎㅎ", "❤"].reduce((o, w) => { o[w] = canvasTex(128, 128, (x, w2) => { x.font = w.length > 1 ? "bold 52px sans-serif" : "bold 76px sans-serif"; x.textAlign = "center"; x.textBaseline = "middle";
    x.lineWidth = 10; x.strokeStyle = "rgba(40,24,16,.55)"; x.strokeText(w, 64, 68); x.fillStyle = w === "❤" ? "#FF6F91" : w === "♪" ? "#FFE08A" : "#FFF4E2"; x.fillText(w, 64, 68); }); return o; }, {});
  const pops = Array.from({length:8}, () => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({transparent:true, depthWrite:false, depthTest:false})); sp.visible = false; sp.userData = {t0:-9}; scene.add(sp); return sp; });
  function pop(pv, word, t){
    const sp = pops.find(q => !q.visible); if(!pv || !sp) return;
    sp.material.map = POP[word]; sp.material.needsUpdate = true; sp.visible = true;
    sp.userData = {t0:t, x:pv.position.x + (Math.random() - .5) * 0.25, z:pv.position.z + (Math.random() - .5) * 0.25, y:pv.userData.h + 0.25};
    sp.position.set(sp.userData.x, sp.userData.y, sp.userData.z);
  }

  const ready = Promise.all((opts.models || [{url:opts.model, a:0, h:1.45}]).map(c => loadChar(c).then(() => true, e => { console.warn("멍 모드 캐릭터를 못 불러왔어요", c.url, e); return false; })))
    .then(list => list.some(Boolean));

  const clock = new THREE.Clock();
  function applyPhase(ph){
    const P = PH[ph] || PH.night;
    skyU.top.value.set(P.top); skyU.mid.value.set(P.mid); skyU.bot.value.set(P.bot); scene.fog.color.set(P.fog);
    hemi.color.set(P.hemi[0]); hemi.groundColor.set(P.hemi[1]); hemi.intensity = P.hemi[2];
    sun.color.set(P.sun[0]); sun.intensity = P.sun[1]; sun.position.set(...P.sun[2]);
    R.fireBase = P.fire; bulbM.color.setScalar(0.35 + 0.65 * P.bulb).multiply(new THREE.Color(0xFFD38A)); bulbGlow.material.opacity = P.bulb;
    cityMat.emissiveIntensity = P.win; stars.material.opacity = P.stars; stars.visible = P.stars > 0; renderer.toneMappingExposure = P.exp;
    glow.material.opacity = ph === "day" ? 0.35 : 0.85;
  }
  /* 가족 움직임 (2026-11-20 감독님 "즐거워 보이면 좋겠는데 화목하게"): 숨쉬기 + 끄덕끄덕 + 가끔 다 같이 웃음 + 마시멜로 */
  let nextLaugh = 5, mallowT0 = 0;
  const who = id => R.chars.find(c => c.userData.id === id);
  function family(t){
    if(t > nextLaugh && R.chars.length){
      nextLaugh = t + 7 + Math.random() * 5;
      const words = ["하하", "ㅋㅋ", "ㅎㅎ"];
      R.chars.forEach((c, k) => { c.userData.laugh = t + k * 0.18; setTimeout(() => R.on && pop(c, c.userData.id === "yuna" && Math.random() < .4 ? "♪" : words[(Math.random() * 3) | 0], clock.elapsedTime), k * 180); });
    }
    R.chars.forEach(c => {
      const u = c.userData, L = t - u.laugh, lg = L > 0 && L < 1.3 ? Math.sin(L / 1.3 * Math.PI) : 0;   // 웃는 동안 0→1→0
      c.position.y = Math.sin(t * 1.3 + u.ph) * 0.006 + Math.abs(Math.sin(L * 16)) * 0.025 * lg;
      u.lean.rotation.x = u.base + Math.sin(t * 0.7 + u.ph) * 0.03;
      u.lean.rotation.z = -0.06 * lg + Math.sin(t * 0.5 + u.ph) * 0.012;   // 웃을 때 살짝 뒤로 젖힘
      if(u.head){
        const talk = Math.max(0, Math.sin(t * 0.45 + u.ph));   // 이야기하는 동안 끄덕끄덕
        u.head.rotation.z = -(Math.sin(t * 3.2 + u.ph) * 0.5 + 0.5) * u.nod * talk - 0.1 * lg;
        u.head.rotation.y = u.yaw * (0.6 + 0.4 * Math.sin(t * 0.3 + u.ph));
        u.head.rotation.x = Math.sin(t * 0.8 + u.ph) * 0.05;
        u.head.e.set(u.head.rotation.x, u.head.rotation.y, u.head.rotation.z); u.head.rot.setFromMatrix4(u.head.m4.makeRotationFromEuler(u.head.e));
      }
    });
    if(stick){
      const u = ((t - mallowT0) % 14) / 14, col = new THREE.Color(0xFFFDF6).lerp(new THREE.Color(0xE9A75A), Math.min(1, u * 1.3)).lerp(new THREE.Color(0x8A4E22), Math.max(0, u - 0.8) * 3);
      mallowM.color.copy(col); stick.rotation.x = Math.sin(t * 2.2) * 0.05; stick.rotation.z = Math.sin(t * 1.1) * 0.02;
      if(u > 0.985 && !stick.userData.done){ stick.userData.done = true; const y = who("yuna"); pop(y, "❤", t); y && (y.userData.laugh = t); setTimeout(() => R.on && pop(y, "❤", clock.elapsedTime), 350); }
      if(u < 0.5) stick.userData.done = false;
    }
    pops.forEach(sp => { if(!sp.visible) return; const a = (t - sp.userData.t0) / 1.8; if(a > 1 || a < 0){ sp.visible = false; return; }
      sp.position.y = sp.userData.y + a * 0.5; sp.material.opacity = a < 0.15 ? a / 0.15 : 1 - Math.max(0, a - 0.55) / 0.45; const sc = 0.44 * (0.8 + 0.2 * Math.min(1, a * 5)); sp.scale.set(sc, sc, 1); });
  }
  function frame(){
    if(!R.on) return;
    R.raf = requestAnimationFrame(frame);
    if(document.hidden) return;
    const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
    if(R.phaseAt < t){ R.phaseAt = t + 20; const ph = opts.phase(); if(ph !== R.ph){ R.ph = ph; applyPhase(ph); opts.onPhase && opts.onPhase(ph); } }
    const f = reduce ? 1 : 0.82 + 0.18 * Math.sin(t * 13) * Math.sin(t * 7.1 + 1) + 0.06 * Math.sin(t * 23);
    fireL.intensity = R.fireBase * f;
    flames.forEach((m, k) => { const w = reduce ? 1 : 1 + 0.12 * Math.sin(t * (9 + k * 3) + m.userData.o); m.scale.set(w, (reduce ? 1 : 0.85 + 0.25 * Math.abs(Math.sin(t * (6 + k) + m.userData.o))), w); m.position.y = 0.16 + m.userData.h * m.scale.y / 2; m.rotation.y = t * (0.6 + k * 0.3); });
    glow.material.rotation = t * 0.2; glow.scale.setScalar(3.0 + 0.25 * f);
    if(!reduce) ev.forEach((e, k) => { e.y += e.v * dt; e.x += Math.sin(t * 2 + k) * dt * 0.08; if(e.y > 2.2){ e.y = 0.3; e.x = (Math.random() - .5) * .35; e.z = (Math.random() - .5) * .35; } ep[k*3] = e.x; ep[k*3+1] = e.y; ep[k*3+2] = e.z; });
    eg.attributes.position.needsUpdate = true; embers.material.opacity = 0.9 * (R.ph === "day" ? 0.5 : 1);
    if(!reduce) family(t);
    if(controls.autoRotate){ const az = controls.getAzimuthalAngle(), d = Math.atan2(Math.sin(az - AZ0), Math.cos(az - AZ0));
      if(d > AZW - 0.08 && controls.autoRotateSpeed < 0 || d < -AZW + 0.08 && controls.autoRotateSpeed > 0) controls.autoRotateSpeed *= -1; }
    controls.update(); renderer.render(scene, camera);
  }
  function size(){ const w = host.clientWidth, h = host.clientHeight; if(!w || !h) return; renderer.setSize(w, h); camera.aspect = w / h; camera.fov = w < h ? 55 : 42; camera.updateProjectionMatrix();
    /* 세로 화면(폰)에선 셋이 다 들어오게 조금 뒤로, 도는 폭은 좁게 */
    const tall = w < h; AZW = tall ? 0.7 : 1.05; controls.maxDistance = tall ? 7.6 : 6.6;
    controls.minAzimuthAngle = AZ0 - AZW; controls.maxAzimuthAngle = AZ0 + AZW - Math.PI * 2;
    const off = camera.position.clone().sub(controls.target), want = tall ? 7.0 : 5.4; if(Math.abs(off.length() - want) > 0.3 && !R?.userMoved) camera.position.copy(controls.target).add(off.setLength(want)); }
  addEventListener("resize", () => R && R.on && size());
  return {renderer, scene, camera, controls, applyPhase, frame, size, ready, on:false, raf:0, ph:null, phaseAt:-1, fireBase:8, chars:[]};
}

export async function open(host, opts){
  if(!R){ R = build(host, opts); }
  R.on = true; R.phaseAt = -1; R.ph = null; R.size(); cancelAnimationFrame(R.raf); R.frame();
  return R.ready;
}
export function close(){ if(R){ R.on = false; cancelAnimationFrame(R.raf); } }
export function setPhaseNow(){ if(R) R.phaseAt = -1; }
export function webglOK(){ try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; } }
export const _dbg = () => R;
