/* 레이싱 배경: 밤 도시 서킷 (2026-11-28 감독님 "진짜 레이싱게임처럼. 니드포스피드처럼")
   도로·방호벽·터널·강 다리·빌딩·네온 간판·가로등을 재료별 한 덩어리로 합침 → 그리기 15번 안쪽 (폰에서도 가볍게)
   조명 계산 없이 밤 색을 그대로 칠하고, 빛은 더하기(Additive) 판으로 얹음 */
import * as THREE from "three";
import { HALF_W, at, inZone } from "./race3d_path.js";

/* 시간대 (2026-11-29 감독님 "밤만 있는 것도 싫어"): 배경은 조명 계산 없이 색을 그대로 칠하므로, 시간대마다 재료 색 배율 · 하늘 · 안개 · 빛 번짐 세기만 바꿈
   mul = 재료 색 배율 (밤 그림 기준), glow = 더하기 빛 세기, sky = [꼭대기, 중간, 지평선 위, 지평선], sun = [x, y, z, 크기, 색, 알맹이 반지름] */
export const TIMES = {
  day:{name:"낮", e:"☀️", title:"CREYONG GRAND PRIX", gp:"CREYONG GRAND PRIX", sky:["#2a78d2", "#62aeea", "#bfe0f6", "#eaf4fb"], fog:0xbcd8ee, fogD:0.0015, mul:{road:3.3, wall:2.3, tun:1.15, bld:1, dark:4.6, sign:1.25, ring:[9, 10, 12], ringA:0.45}, glow:0.14, pts:0.12, ground:0x7f9a6b, stars:0,
    sun:[-520, 1250, -900, 300, 0xfff8e6, 30], cloud:[0xffffff, 0.62], win:"day", water:["#3f84bd", ["255,255,255", "190,225,255", "120,190,240"]], sheen:[0.22, 0.25, 0.3], hemi:[0xd6e8ff, 0x8f9488, 2.5], dir:[0xfff3dc, 2.6], env:[0x9cc4ee, 0xffffff], exposure:1.02, beam:0.12, vig:0.25},
  sunset:{name:"노을", e:"🌇", title:"CREYONG SUNSET RUN", gp:"CREYONG SUNSET GP", sky:["#1d2256", "#7a4488", "#ff8f5e", "#ffd28a"], fog:0x8c5068, fogD:0.0024, mul:{road:1.9, wall:1.6, tun:1.05, bld:[2.3, 1.75, 1.65], dark:2.5, sign:1.1, ring:[2.6, 1.7, 2.2]}, glow:0.62, pts:0.7, ground:0x3a2f3c, stars:0.25,
    sun:[-900, 150, -1100, 430, 0xffb060, 44], cloud:[0xffb48a, 0.5], win:"night", water:["#3a2a52", ["255,170,90", "255,120,150", "255,210,150"]], sheen:[1.0, 0.5, 0.3], hemi:[0xffb69a, 0x3a2440, 1.7], dir:[0xff9a5a, 1.9], env:[0x70445e, 0xffb070], exposure:1.14, beam:0.6, vig:0.7},
  night:{name:"밤", e:"🌙", title:"CREYONG NIGHT RACE", gp:"CREYONG NIGHT GP", sky:["#04050d", "#15103a", "#6a2a5c", "#c2553f"], fog:0x120c26, fogD:0.0034, mul:{road:1, wall:1, tun:1, bld:1, dark:1, sign:1, ring:1}, glow:1, pts:1, ground:0x0b0c13, stars:0.8,
    sun:[-700, 760, -1100, 210, 0xfff1d0, 26], cloud:null, win:"night", water:["#070b1c", ["255,190,110", "120,200,255", "255,120,200", "200,210,255"]], sheen:[0.8, 0.34, 0.52], hemi:[0x8fa0ff, 0x2a1830, 1.25], dir:[0xffd6b0, 1.1], env:[0x0a0c1c, 0], exposure:1.22, beam:1, vig:1}};

const EDGE = HALF_W + 0.6;          // 방호벽 자리
const rnd = (() => { let s = 20261128; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; })();
const rr = (a, b) => a + (b - a) * rnd();

function MB(){
  const pos = [], uv = [], col = [], idx = [];
  return {
    quad(a, b, c, d, u0 = 0, v0 = 0, u1 = 1, v1 = 1, r = 1, g = 1, bl = 1){ const i = pos.length / 3; pos.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2], d[0], d[1], d[2]);
      uv.push(u0, v0, u1, v0, u1, v1, u0, v1); for(let q = 0; q < 4; q++) col.push(r, g, bl); idx.push(i, i + 1, i + 2, i, i + 2, i + 3); },
    geo(){ const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
      g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeBoundingSphere(); return g; },
    get n(){ return idx.length / 3; }
  };
}
function tex(w, h, draw, o = {}){
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; if(o.repeat){ t.wrapS = t.wrapT = THREE.RepeatWrapping; } t.anisotropy = o.aniso || 1; return t;
}
const hex = c => { const k = new THREE.Color(c); return [k.r, k.g, k.b]; };

/* ---------- 그림 ---------- */
function roadTex(){
  return tex(512, 256, (g, w, h) => {
    g.fillStyle = "#1a1b22"; g.fillRect(0, 0, w, h);
    for(let k = 0; k < 2600; k++){ const v = 20 + Math.random() * 26 | 0; g.fillStyle = `rgba(${v + 6},${v + 6},${v + 14},${0.35 + Math.random() * 0.4})`; g.fillRect(Math.random() * w, Math.random() * h, 1.6, 1.6); }
    for(let k = 0; k < 7; k++){ const x = Math.random() * w, gr = g.createLinearGradient(x - 26, 0, x + 26, 0); gr.addColorStop(0, "rgba(90,110,170,0)"); gr.addColorStop(0.5, "rgba(90,110,170,.10)"); gr.addColorStop(1, "rgba(90,110,170,0)"); g.fillStyle = gr; g.fillRect(x - 26, 0, 52, h); }
    for(const d of [-1.9, 1.9, -5.6, 5.6]){ const x = (EDGE + d) / (EDGE * 2) * w; g.fillStyle = "rgba(6,6,10,.28)"; g.fillRect(x - 22, 0, 9, h); g.fillRect(x + 13, 0, 9, h); }   // 바퀴 자국
    const X = d => (EDGE + d) / (EDGE * 2) * w;
    g.fillStyle = "#d9dbe6"; g.fillRect(X(-HALF_W + 0.25) - 2.5, 0, 5, h); g.fillRect(X(HALF_W - 0.25) - 2.5, 0, 5, h);
    g.fillStyle = "#cfd2de"; for(const d of [-3.75, 3.75]) g.fillRect(X(d) - 2, h * 0.08, 4, h * 0.42);
    g.fillStyle = "#e8c45a"; g.fillRect(X(0) - 2.2, h * 0.08, 4.4, h * 0.42);
    g.fillStyle = "#2a2c36"; g.fillRect(0, 0, X(-HALF_W) - 8, h); g.fillRect(X(HALF_W) + 8, 0, w, h);
  }, {repeat:true, aniso:8});
}
function wallTex(){   // 위 절반: 콘크리트 방호벽 / 아래 절반: 빨강·하양 코너 벽
  return tex(256, 128, (g, w, h) => {
    g.fillStyle = "#3a3d49"; g.fillRect(0, 0, w, h / 2); g.fillStyle = "#4b4f5d"; g.fillRect(0, 0, w, 10); g.fillStyle = "#262831"; g.fillRect(0, h / 2 - 12, w, 12);
    for(let k = 0; k < 4; k++){ g.fillStyle = k % 2 ? "#f2b23a" : "#20222a"; g.fillRect(k * 64, 16, 64, 7); } g.fillStyle = "rgba(0,0,0,.25)"; g.fillRect(126, 0, 3, h / 2);
    for(let k = 0; k < 4; k++){ g.fillStyle = k % 2 ? "#e9e9ee" : "#e03b3b"; g.fillRect(k * 64, h / 2, 64, h / 2); } g.fillStyle = "rgba(0,0,0,.35)"; g.fillRect(0, h - 10, w, 10);
  }, {repeat:true, aniso:4});
}
function tunnelTex(){   // 위 절반: 벽 타일 + 조명 띠 / 아래 절반: 천장 (등 패널)
  return tex(256, 256, (g, w, h) => {
    g.fillStyle = "#3b3226"; g.fillRect(0, 0, w, h / 2);
    for(let y = 0; y < 4; y++) for(let x = 0; x < 4; x++){ const v = 58 + Math.random() * 16 | 0; g.fillStyle = `rgb(${v + 30},${v + 8},${v - 22})`; g.fillRect(x * 64 + 2, y * 32 + 2, 60, 28); }
    g.fillStyle = "#ffd9a0"; g.fillRect(0, 8, w, 9); g.fillStyle = "#ff8a2a"; g.fillRect(0, 17, w, 3); g.fillStyle = "#1c1712"; g.fillRect(0, h / 2 - 20, w, 20); g.fillStyle = "#f3c13a"; for(let x = 0; x < 8; x++) g.fillRect(x * 32, h / 2 - 16, 16, 6);
    g.fillStyle = "#17130f"; g.fillRect(0, h / 2, w, h / 2); g.fillStyle = "#2a2219"; for(let x = 0; x < 4; x++) g.fillRect(x * 64 + 3, h / 2 + 4, 58, 120);
    for(const x of [70, 164]){ const gr = g.createLinearGradient(0, h * 0.66, 0, h * 0.84); gr.addColorStop(0, "#ff9a3a"); gr.addColorStop(0.5, "#fff0cf"); gr.addColorStop(1, "#ff9a3a"); g.fillStyle = gr; g.fillRect(x, h * 0.66, 22, h * 0.18); }
  }, {repeat:true, aniso:4});
}
function windowTex(){   // 24×48칸 창문. 층마다 띠, 불 켜진 창은 띄엄띄엄 (켜진 층은 한 줄로)
  return tex(768, 1536, (g, w, h) => {
    g.fillStyle = "#0a0c14"; g.fillRect(0, 0, w, h); const cw = w / 24, ch = h / 48;
    for(let y = 0; y < 48; y++){ const rowLit = Math.random() < 0.07, rowOff = Math.random() < 0.3; g.fillStyle = "#11141f"; g.fillRect(0, y * ch, w, 5);
      for(let x = 0; x < 24; x++){ const r = Math.random(); let c = "#10141e";
        if(rowLit || (!rowOff && r < 0.2)) c = ["#ffd98a", "#ffe9b8", "#fff4dc", "#ffc86a", "#ffd98a"][Math.random() * 5 | 0]; else if(rowOff){ if(r < 0.03) c = "#ffd98a"; else if(r < 0.4) c = "#182033"; } else if(r < 0.25) c = "#bfe4ff"; else if(r < 0.262) c = "#ff9ad0"; else if(r < 0.275) c = "#7df2e0"; else if(r < 0.5) c = "#182033";
        g.fillStyle = c; g.fillRect(x * cw + 6, y * ch + 9, cw - 12, ch - 13);
        if(c[1] === "f"){ if(Math.random() < 0.45){ g.fillStyle = "rgba(0,0,0,.3)"; g.fillRect(x * cw + 6, y * ch + 9, (cw - 12) * (0.2 + Math.random() * 0.5), ch - 13); } g.fillStyle = "rgba(255,255,255,.18)"; g.fillRect(x * cw + 6, y * ch + 9, cw - 12, 3); } } }
  }, {repeat:true, aniso:4});
}
function windowTexDay(){   // 낮: 밝은 벽 + 하늘 비친 유리창
  return tex(768, 1536, (g, w, h) => {
    const cw = w / 24, ch = h / 48; g.fillStyle = "#c3c9d2"; g.fillRect(0, 0, w, h);
    for(let y = 0; y < 48; y++){ g.fillStyle = "rgba(255,255,255,.35)"; g.fillRect(0, y * ch, w, 4); g.fillStyle = "rgba(60,70,90,.18)"; g.fillRect(0, y * ch + 4, w, 2);
      for(let x = 0; x < 24; x++){ const r = Math.random(), c = r < 0.5 ? "#6f9cc4" : r < 0.8 ? "#5b88b2" : r < 0.93 ? "#8fbbe0" : "#3f5f82";
        g.fillStyle = c; g.fillRect(x * cw + 6, y * ch + 9, cw - 12, ch - 13); g.fillStyle = "rgba(255,255,255,.28)"; g.fillRect(x * cw + 6, y * ch + 9, cw - 12, 5);
        if(r > 0.6){ g.fillStyle = "rgba(255,255,255,.16)"; g.beginPath(); g.moveTo(x * cw + 6, y * ch + ch - 4); g.lineTo(x * cw + cw * 0.55, y * ch + 9); g.lineTo(x * cw + cw * 0.8, y * ch + 9); g.lineTo(x * cw + 6 + cw * 0.3, y * ch + ch - 4); g.fill(); } } }
  }, {repeat:true, aniso:4});
}
const SIGNS = [["CREYONG", "#5fe8cf"], ["NIGHT RACE", "#ff4fb0"], ["크레용팜", "#ffb648"], ["OOOhouse", "#ff9ad6"], ["FILM SCHOOL", "#ffd27a"], ["NITRO ⚡", "#57d7ff"], ["24H 카페", "#fff0a8"], ["YUNA ♥", "#ff7fc4"],
  ["DRIFT", "#b78bff"], ["떡볶이", "#ff6a4a"], ["노래방 ♪", "#ff58c8"], ["PC방", "#6fa8ff"], [">>>", "#ffd21f"], ["CREYONG NIGHT GP", "#ffffff"], ["TUNNEL", "#ffb040"], ["HOTEL", "#ff5a6e"]];
const CELL = k => { const c = k % 4, r = k / 4 | 0; return [c / 4, 1 - (r + 1) / 4, (c + 1) / 4, 1 - r / 4]; };   // u0 v0 u1 v1
function signTex(gp){
  return tex(1024, 512, (g, w, h) => {
    g.fillStyle = "#05060a"; g.fillRect(0, 0, w, h); const cw = w / 4, ch = h / 4;
    SIGNS.forEach(([t0, c], k) => { const t = k === 13 && gp ? gp : t0, x = (k % 4) * cw, y = (k / 4 | 0) * ch; g.save(); g.beginPath(); g.rect(x, y, cw, ch); g.clip();
      if(k === 12){ g.fillStyle = "#0b0b0d"; g.fillRect(x, y, cw, ch); g.fillStyle = c; for(let q = 0; q < 3; q++){ const ox = x + 26 + q * 78; g.beginPath(); g.moveTo(ox, y + 14); g.lineTo(ox + 34, y + 14); g.lineTo(ox + 74, y + ch / 2); g.lineTo(ox + 34, y + ch - 14); g.lineTo(ox, y + ch - 14); g.lineTo(ox + 40, y + ch / 2); g.closePath(); g.fill(); } g.restore(); return; }
      if(k === 13){ const s = 16; for(let a = 0; a < cw / s; a++) for(let b = 0; b < 2; b++){ g.fillStyle = (a + b) % 2 ? "#f4f4f6" : "#101014"; g.fillRect(x + a * s, y + b * s, s, s); g.fillRect(x + a * s, y + ch - (b + 1) * s, s, s); }
        g.fillStyle = "#0b0c12"; g.fillRect(x, y + 32, cw, ch - 64); g.font = `italic 900 30px "Inter Tight", Pretendard, sans-serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#ffffff"; g.shadowColor = "#ff4fb0"; g.shadowBlur = 12; g.fillText(t, x + cw / 2, y + ch / 2 + 1, cw - 16); g.restore(); return; }
      g.fillStyle = "#07080d"; g.fillRect(x, y, cw, ch); g.strokeStyle = c; g.lineWidth = 5; g.shadowColor = c; g.shadowBlur = 18; g.strokeRect(x + 10, y + 10, cw - 20, ch - 20);
      g.font = `${/[가-힣]/.test(t) ? "" : "italic "}900 ${t.length > 9 ? 40 : 58}px "Inter Tight", Pretendard, "Apple SD Gothic Neo", sans-serif`; g.textAlign = "center"; g.textBaseline = "middle";
      g.fillStyle = c; g.shadowBlur = 22; g.fillText(t, x + cw / 2, y + ch / 2 + 3, cw - 40); g.shadowBlur = 6; g.fillStyle = "#ffffff"; g.globalAlpha = 0.75; g.fillText(t, x + cw / 2, y + ch / 2 + 3, cw - 40); g.restore(); });
  }, {aniso:4});
}
function glowTex(){
  return tex(128, 128, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.18, "rgba(255,255,255,.62)"); gr.addColorStop(0.5, "rgba(255,255,255,.16)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
}
function skylineTex(){
  return tex(1024, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h); let x = 0;
    while(x < w){ const bw = 18 + Math.random() * 46, bh = 40 + Math.pow(Math.random(), 2.2) * 190; g.fillStyle = `rgb(${10 + Math.random() * 8 | 0},${10 + Math.random() * 8 | 0},${22 + Math.random() * 14 | 0})`; g.fillRect(x, h - bh, bw, bh);
      for(let yy = h - bh + 5; yy < h - 4; yy += 6) for(let xx = x + 3; xx < x + bw - 3; xx += 5) if(Math.random() < 0.22){ g.fillStyle = Math.random() < 0.8 ? "rgba(255,214,140,.85)" : "rgba(150,220,255,.85)"; g.fillRect(xx, yy, 2, 3); }
      if(bh > 150){ g.fillStyle = "#ff4a4a"; g.fillRect(x + bw / 2 - 1, h - bh - 4, 2, 4); } x += bw + Math.random() * 6; }
  }, {repeat:true});
}
function waterTex(base, cols){
  return tex(256, 256, (g, w, h) => { g.fillStyle = base; g.fillRect(0, 0, w, h);
    for(let k = 0; k < 150; k++){ const c = cols[Math.random() * cols.length | 0]; g.fillStyle = `rgba(${c},${0.05 + Math.random() * 0.22})`; g.fillRect(Math.random() * w, Math.random() * h, 8 + Math.random() * 40, 1.5); } }, {repeat:true});
}

/* ---------- 세우기 ---------- */
export function buildWorld(P, time = "night"){
  const N = P.N, group = new THREE.Group(), o = {}, o2 = {}, TH = TIMES[time] || TIMES.night, ZONE = P.zone, MUL = TH.mul;
  const T = {road:roadTex(), wall:wallTex(), tunnel:tunnelTex(), win:TH.win === "day" ? windowTexDay() : windowTex(), sign:signTex(TH.gp), glow:glowTex(), sky:skylineTex(), water:waterTex(TH.water[0], TH.water[1])};
  const road = MB(), wall = MB(), tun = MB(), bld = MB(), sign = MB(), glow = MB(), dark = MB();
  const pt = (k, d, y = 0) => { at(P, k, d, o); return [o.x, o.y + y, o.z]; };
  const inT = k => inZone(P, k, ZONE.tunnel), inB = k => inZone(P, k, ZONE.bridge);
  const sharp = k => Math.abs(P.kv[((k % N) + N) % N]) > 1 / 95;

  /* 도로 · 보도 · 방호벽 */
  for(let k = 0; k < N; k++){
    const a = k, b = k + 1, v0 = k * P.step / 12, v1 = (k + 1) * P.step / 12, T_ = inT(k), B_ = inB(k);
    const sh = T_ ? 0.62 : 1;
    road.quad(pt(a, -EDGE), pt(a, EDGE), pt(b, EDGE), pt(b, -EDGE), 0, v0, 1, v1, sh, sh * (T_ ? 0.86 : 1), sh * (T_ ? 0.7 : 1));
    for(const sd of [-1, 1]){
      const e = EDGE * sd, u0 = k * P.step / 6, u1 = (k + 1) * P.step / 6;
      if(T_){ tun.quad(pt(a, e), pt(b, e), pt(b, e, 5.6), pt(a, e, 5.6), u0 / 2, 0.5, u1 / 2, 1); continue; }
      const outer = sd === (P.kv[k] > 0 ? -1 : 1) && sharp(k), hgt = B_ ? 1.15 : 0.95;
      wall.quad(pt(a, e), pt(b, e), pt(b, e, hgt), pt(a, e, hgt), u0, outer ? 0.02 : 0.52, u1, outer ? 0.48 : 0.98);
      wall.quad(pt(a, e, hgt), pt(b, e, hgt), pt(b, e + 0.45 * sd, hgt), pt(a, e + 0.45 * sd, hgt), u0, 0.9, u1, 0.98, 0.8, 0.8, 0.86);
      if(B_){ dark.quad(pt(a, e + 0.45 * sd, -P.py[k] - 0.4), pt(b, e + 0.45 * sd, -P.py[(k + 1) % N] - 0.4), pt(b, e + 0.45 * sd, hgt), pt(a, e + 0.45 * sd, hgt), 0, 0, 1, 1, 0.07, 0.075, 0.1); }
      else { dark.quad(pt(a, e + 0.45 * sd), pt(b, e + 0.45 * sd), pt(b, e + 5.5 * sd), pt(a, e + 5.5 * sd), 0, 0, 1, 1, 0.105, 0.108, 0.135);   // 보도
        if(P.py[k] > 0.25) dark.quad(pt(a, e + 5.5 * sd, -P.py[k] - 0.3), pt(b, e + 5.5 * sd, -P.py[(k + 1) % N] - 0.3), pt(b, e + 5.5 * sd), pt(a, e + 5.5 * sd), 0, 0, 1, 1, 0.06, 0.062, 0.08); }
    }
    if(T_){ tun.quad(pt(a, -EDGE, 5.6), pt(a, EDGE, 5.6), pt(b, EDGE, 5.6), pt(b, -EDGE, 5.6), 0, 0.5 - (k % 4 + 1) / 4 * 0.5, 1, 0.5 - (k % 4) / 4 * 0.5);
      for(const sd of [-1, 1]){ const e = (EDGE + 4) * sd; dark.quad(pt(a, e), pt(b, e), pt(b, e, 8), pt(a, e, 8), 0, 0, 1, 1, 0.085, 0.088, 0.11); }
      dark.quad(pt(a, -EDGE - 4, 8), pt(a, EDGE + 4, 8), pt(b, EDGE + 4, 8), pt(b, -EDGE - 4, 8), 0, 0, 1, 1, 0.07, 0.072, 0.09);
      if(k % 4 === 0){ const c = pt(k + 0.5, 0, 0.04); glow.quad(pt(k - 1.5, -6.5, 0.04), pt(k - 1.5, 6.5, 0.04), pt(k + 2.5, 6.5, 0.04), pt(k + 2.5, -6.5, 0.04), 0, 0, 1, 1, 0.55, 0.3, 0.08); } }
  }
  /* 터널 입구·출구 */
  for(const k of [Math.ceil(ZONE.tunnel[0] * N), Math.floor(ZONE.tunnel[1] * N) + 1]){
    for(const sd of [-1, 1]) dark.quad(pt(k, EDGE * sd), pt(k, (EDGE + 4) * sd), pt(k, (EDGE + 4) * sd, 8), pt(k, EDGE * sd, 8), 0, 0, 1, 1, 0.16, 0.165, 0.2);
    dark.quad(pt(k, -EDGE, 5.6), pt(k, EDGE, 5.6), pt(k, EDGE, 8), pt(k, -EDGE, 8), 0, 0, 1, 1, 0.16, 0.165, 0.2);
    const c = CELL(14), e = k === Math.ceil(ZONE.tunnel[0] * N) ? -0.08 : 0.08; sign.quad(pt(k + e, 4.2, 6), pt(k + e, -4.2, 6), pt(k + e, -4.2, 7.7), pt(k + e, 4.2, 7.7), ...(e < 0 ? [c[2], c[1], c[0], c[3]] : [c[0], c[1], c[2], c[3]]));   // 다가오는 쪽에서 글자가 바로 보이게
    for(const sd of [-1, 1]) glow.quad(pt(k + e, (EDGE - 0.1) * sd), pt(k + e, (EDGE + 0.5) * sd), pt(k + e, (EDGE + 0.5) * sd, 5.6), pt(k + e, (EDGE - 0.1) * sd, 5.6), 0.5, 0.5, 0.5, 0.5, 1, 0.55, 0.12);
  }

  /* 출발선 */
  { const k = 2, c = CELL(13);
    for(const sd of [-1, 1]){ const e = (EDGE + 0.7) * sd; dark.quad(pt(k - 0.2, e - 0.35), pt(k - 0.2, e + 0.35), pt(k - 0.2, e + 0.35, 8.4), pt(k - 0.2, e - 0.35, 8.4), 0, 0, 1, 1, 0.2, 0.21, 0.26);
      dark.quad(pt(k + 0.2, e - 0.35), pt(k + 0.2, e + 0.35), pt(k + 0.2, e + 0.35, 8.4), pt(k + 0.2, e - 0.35, 8.4), 0, 0, 1, 1, 0.2, 0.21, 0.26);
      glow.quad(pt(k - 0.25, e - 0.5), pt(k - 0.25, e + 0.5), pt(k - 0.25, e + 0.5, 8.4), pt(k - 0.25, e - 0.5, 8.4), 0.5, 0.5, 0.5, 0.5, 0.9, 0.15, 0.55); }
    sign.quad(pt(k - 0.25, EDGE + 0.7, 6.1), pt(k - 0.25, -EDGE - 0.7, 6.1), pt(k - 0.25, -EDGE - 0.7, 8.4), pt(k - 0.25, EDGE + 0.7, 8.4), c[2], c[1], c[0], c[3]);
    sign.quad(pt(k + 0.25, -EDGE - 0.7, 6.1), pt(k + 0.25, EDGE + 0.7, 6.1), pt(k + 0.25, EDGE + 0.7, 8.4), pt(k + 0.25, -EDGE - 0.7, 8.4), c[2], c[1], c[0], c[3]);
    for(let q = 0; q < 17; q++) for(let r = 0; r < 2; r++){ const d0 = -HALF_W + q, w = (q + r) % 2 ? 0.92 : 0.06; dark.quad(pt(k + r * 0.5, d0, 0.03), pt(k + r * 0.5, d0 + 1, 0.03), pt(k + (r + 1) * 0.5, d0 + 1, 0.03), pt(k + (r + 1) * 0.5, d0, 0.03), 0, 0, 1, 1, w, w, w); }
  }

  /* 코너 화살표 판 · 가로등 · 다리 */
  const lampA = [], lampB = [];   // 큰 빛 / 작은 빛 점들: [x,y,z,r,g,b]
  const WARM = [1, 0.74, 0.42], COOL = [0.72, 0.86, 1], PINK = [1, 0.36, 0.72], CYAN = [0.3, 0.9, 1];
  for(let k = 0; k < N; k++){
    if(inT(k)) continue;
    const kv = P.kv[k];
    if(sharp(k) && k % 5 === 0){ const sd = kv > 0 ? -1 : 1, e = (EDGE + 0.5) * sd, c = CELL(12);   // 바깥쪽 벽 위, 도는 쪽을 가리킴
      const u = kv > 0 ? [c[0], c[2]] : [c[2], c[0]], A = sd < 0 ? [k + 3.2, k] : [k, k + 3.2];
      sign.quad(pt(A[0], e, 1.05), pt(A[1], e, 1.05), pt(A[1], e, 2.6), pt(A[0], e, 2.6), sd < 0 ? u[1] : u[0], c[1], sd < 0 ? u[0] : u[1], c[3]); }
    if(inB(k)){
      if(k % 4 === 0) for(const sd of [-1, 1]){ const p = pt(k, (EDGE + 0.2) * sd, 1.5); lampB.push(p[0], p[1], p[2], ...(k % 8 ? CYAN : PINK));
        dark.quad(pt(k - 0.08, (EDGE + 0.2) * sd, 1.1), pt(k + 0.08, (EDGE + 0.2) * sd, 1.1), pt(k + 0.08, (EDGE + 0.2) * sd, 1.5), pt(k - 0.08, (EDGE + 0.2) * sd, 1.5), 0, 0, 1, 1, 0.2, 0.2, 0.25); }
      continue; }
    if(k % 17 === 0){ const sd = (k / 17 | 0) % 2 ? 1 : -1, e = (EDGE + 1.2) * sd, col = P.py[k] > 0.2 || k / N > 0.7 ? COOL : WARM;
      dark.quad(pt(k - 0.1, e), pt(k + 0.1, e), pt(k + 0.1, e, 8.2), pt(k - 0.1, e, 8.2), 0, 0, 1, 1, 0.16, 0.165, 0.2);
      dark.quad(pt(k - 0.07, e, 8.1), pt(k + 0.07, e, 8.1), pt(k + 0.07, e - 3.4 * sd, 8.35), pt(k - 0.07, e - 3.4 * sd, 8.35), 0, 0, 1, 1, 0.16, 0.165, 0.2);
      const p = pt(k, e - 3.4 * sd, 8.2); lampA.push(p[0], p[1], p[2], col[0], col[1], col[2]);
      const m = 0.42; glow.quad(pt(k - 5, e - 10 * sd, 0.05), pt(k - 5, e + 1.5 * sd, 0.05), pt(k + 5, e + 1.5 * sd, 0.05), pt(k + 5, e - 10 * sd, 0.05), 0, 0, 1, 1, col[0] * m, col[1] * m, col[2] * m);
      const m2 = 0.2; glow.quad(pt(k - 11, e - 5.2 * sd, 0.055), pt(k - 11, e - 1.6 * sd, 0.055), pt(k + 11, e - 1.6 * sd, 0.055), pt(k + 11, e - 5.2 * sd, 0.055), 0, 0, 1, 1, col[0] * m2, col[1] * m2, col[2] * m2); }   // 젖은 길에 번진 빛
  }
  /* 다리 주탑 2개 + 케이블 */
  { const k0 = Math.ceil(ZONE.bridge[0] * N), k1 = Math.floor(ZONE.bridge[1] * N), span = k1 - k0;
    for(const f of [0.3, 0.7]){ const kt = Math.round(k0 + span * f);
      for(const sd of [-1, 1]){ const e = (EDGE + 1.6) * sd, base = -P.py[kt] - 0.4, top = 34;
        for(const dk of [-0.6, 0.6]) dark.quad(pt(kt + dk, e - 0.9), pt(kt + dk, e + 0.9), pt(kt + dk, e + 0.5, top), pt(kt + dk, e - 0.5, top), 0, 0, 1, 1, 0.13, 0.135, 0.17);
        for(const de of [-0.9, 0.9]) dark.quad(pt(kt - 0.6, e + de), pt(kt + 0.6, e + de), pt(kt + 0.6, e + de * 0.55, top), pt(kt - 0.6, e + de * 0.55, top), 0, 0, 1, 1, 0.1, 0.105, 0.14);
        glow.quad(pt(kt - 0.7, e - 0.25), pt(kt - 0.7, e + 0.25), pt(kt - 0.7, e + 0.2, top), pt(kt - 0.7, e - 0.2, top), 0.5, 0.5, 0.5, 0.5, 0.2, 0.75, 1);
        glow.quad(pt(kt + 0.7, e - 0.25), pt(kt + 0.7, e + 0.25), pt(kt + 0.7, e + 0.2, top), pt(kt + 0.7, e - 0.2, top), 0.5, 0.5, 0.5, 0.5, 0.2, 0.75, 1);
        const tp = pt(kt, e, top + 0.6); lampA.push(tp[0], tp[1], tp[2], 1, 0.25, 0.3);
        for(let q = 1; q <= 9; q++) for(const dir of [-1, 1]){ const kd = kt + dir * q * 5; if(kd < k0 || kd > k1) continue; const a = pt(kt, e, top - q * 1.6), b = pt(kd, e - 0.5 * sd, 1.1);
          glow.quad([a[0], a[1], a[2]], [a[0], a[1] + 0.16, a[2]], [b[0], b[1] + 0.16, b[2]], b, 0.5, 0.5, 0.5, 0.5, 0.75, 0.3, 0.6); } }
      dark.quad(pt(kt, -EDGE - 2.1, 26), pt(kt, EDGE + 2.1, 26), pt(kt, EDGE + 2.1, 28.5), pt(kt, -EDGE - 2.1, 28.5), 0, 0, 1, 1, 0.12, 0.125, 0.16); }
  }

  /* 빌딩 · 간판 */
  const placed = [], wk0 = Math.ceil(ZONE.bridge[0] * N) + 12, wk1 = Math.floor(ZONE.bridge[1] * N) - 12;
  const clear = (x, z, r) => { for(let k = 0; k < N; k += 2){ const dx = x - P.px[k], dz = z - P.pz[k]; if(dx * dx + dz * dz < (r + EDGE + 6) * (r + EDGE + 6)) return false; } for(const q of placed){ const dx = x - q[0], dz = z - q[1], m = (r + q[2]) * 0.72; if(dx * dx + dz * dz < m * m) return false; } return true; };
  const NEON = [[1, 0.2, 0.62], [0.2, 0.85, 1], [1, 0.62, 0.18], [0.62, 0.42, 1], [0.3, 1, 0.75]];
  function building(k, sd, off, row){
    at(P, k, 0, o); const u = k / N, down = u < 0.2 || u > 0.92, w = rr(16, 30), dp = rr(14, 26), r = Math.hypot(w, dp) / 2;
    const hgt = (down ? rr(34, 96) : rr(14, 52)) * (row ? 1.5 : 1), cx = o.x - o.tz * off * sd, cz = o.z + o.tx * off * sd;
    if(k > wk0 - 30 && k < wk1 + 30 || inT(k) && off < EDGE + 22) return; if(!clear(cx, cz, r)) return; placed.push([cx, cz, r]);
    const ax = o.tx, az = o.tz, bx = -o.tz, bz = o.tx, hw = w / 2, hd = dp / 2, tint = rr(0.55, 1), tc = [tint * rr(0.85, 1), tint * rr(0.85, 1), tint];
    const p = (sa, sb, y) => [cx + ax * hw * sa + bx * hd * sb, y, cz + az * hw * sa + bz * hd * sb];
    const u0 = (rnd() * 24 | 0) / 24, v0 = (rnd() * 48 | 0) / 48, uw = Math.round(w / 2.3) / 24, ud = Math.round(dp / 2.3) / 24, vh = Math.round(hgt / 3.3) / 48;
    for(const [a, b, uu] of [[[-1, 1], [1, 1], uw], [[1, -1], [-1, -1], uw], [[1, 1], [1, -1], ud], [[-1, -1], [-1, 1], ud]])
      bld.quad(p(a[0], a[1], 0), p(b[0], b[1], 0), p(b[0], b[1], hgt), p(a[0], a[1], hgt), u0, v0, u0 + uu, v0 + vh, tc[0], tc[1], tc[2]);
    dark.quad(p(-1, -1, hgt), p(1, -1, hgt), p(1, 1, hgt), p(-1, 1, hgt), 0, 0, 1, 1, 0.045, 0.047, 0.065);
    const face = -sd, nc = NEON[rnd() * NEON.length | 0], F = (sa, y, out = 0.12) => [cx + ax * hw * sa + bx * (hd + out) * face, y, cz + az * hw * sa + bz * (hd + out) * face];
    if(!row){
      if(rnd() < 0.75){ const y = rr(3.6, 4.6); glow.quad(F(-1, y), F(1, y), F(1, y + 0.32), F(-1, y + 0.32), 0.5, 0.5, 0.5, 0.5, nc[0], nc[1], nc[2]);
        glow.quad(F(-1, 0.05, 4), F(1, 0.05, 4), F(1, 0.05, 0.3), F(-1, 0.05, 0.3), 0, 0, 1, 1, nc[0] * 0.3, nc[1] * 0.3, nc[2] * 0.3); }
      if(rnd() < 0.5) for(const sa of [-1, 1]) glow.quad(F(sa, 0), F(sa * 0.97, 0), F(sa * 0.97, hgt), F(sa, hgt), 0.5, 0.5, 0.5, 0.5, nc[0] * 0.8, nc[1] * 0.8, nc[2] * 0.8);
      if(rnd() < 0.62){ const sk = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 15][rnd() * 13 | 0], c = CELL(sk), sw = Math.min(w * 0.42, rr(4.5, 7)) , sh = sw * 0.5 * 2 / 2, y = Math.min(hgt - sh - 1, rr(6, 15)), sx = rr(-0.3, 0.3), s0 = sx - sw / hw, s1 = sx + sw / hw;
        const flip = sd > 0; sign.quad(F(flip ? s1 : s0, y, 0.25), F(flip ? s0 : s1, y, 0.25), F(flip ? s0 : s1, y + sh * 2, 0.25), F(flip ? s1 : s0, y + sh * 2, 0.25), c[0], c[1], c[2], c[3]);
        const hc = hex(SIGNS[sk][1]); glow.quad(F(s0 * 1.5 - 0.1, y - sh * 1.4, 0.3), F(s1 * 1.5 + 0.1, y - sh * 1.4, 0.3), F(s1 * 1.5 + 0.1, y + sh * 3.4, 0.3), F(s0 * 1.5 - 0.1, y + sh * 3.4, 0.3), 0, 0, 1, 1, hc[0] * 0.3, hc[1] * 0.3, hc[2] * 0.3); }
    }
    if(!row && off < EDGE + 20) for(const sx of [-0.5, 0.5]){ if(rnd() < 0.2) continue; const sk = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 15][rnd() * 13 | 0], c = CELL(sk), sw = Math.min(hw * 0.42, 3.4), s0 = sx - sw / hw, s1 = sx + sw / hw, y = 2.5, flip = sd > 0;
      sign.quad(F(flip ? s1 : s0, y, 0.2), F(flip ? s0 : s1, y, 0.2), F(flip ? s0 : s1, y + sw, 0.2), F(flip ? s1 : s0, y + sw, 0.2), c[0], c[1], c[2], c[3]);
      const hc = hex(SIGNS[sk][1]), kk = k + Math.round(sx * hw / P.step) * 1, m = 0.26;   // 젖은 길에 비친 간판 빛
      glow.quad(pt(kk - 3, (EDGE - 7.5) * sd, 0.06), pt(kk - 3, (EDGE - 0.2) * sd, 0.06), pt(kk + 3, (EDGE - 0.2) * sd, 0.06), pt(kk + 3, (EDGE - 7.5) * sd, 0.06), 0, 0, 1, 1, hc[0] * m, hc[1] * m, hc[2] * m); }
    if(hgt > 60){ const tp = p(0, 0, hgt + 1.2); lampB.push(tp[0], tp[1], tp[2], 1, 0.2, 0.2); }
  }
  for(let k = 0; k < N; k += 9) for(const sd of [-1, 1]){ building(k, sd, EDGE + 7 + rr(8, 18), 0); }
  for(let k = 4; k < N; k += 13) for(const sd of [-1, 1]){ building(k, sd, EDGE + 46 + rr(6, 26), 1); }
  for(let k = 8; k < N; k += 16) for(const sd of [-1, 1]){ building(k, sd, EDGE + 92 + rr(0, 40), 1); }

  /* 재료 · 메쉬 */
  const mulC = m => Array.isArray(m) ? new THREE.Color(m[0], m[1], m[2]) : new THREE.Color(m, m, m);
  const basic = (map, x = {}, m = 1) => { const mt = new THREE.MeshBasicMaterial({map, vertexColors:true, side:THREE.DoubleSide, ...x}); mt.color.copy(mulC(m)); return mt; };
  const add = (geo, mat, order = 0) => { const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.renderOrder = order; m.matrixAutoUpdate = false; group.add(m); return m; };
  const roadMat = basic(T.road, {}, MUL.road), sheen = {value:new THREE.Color(TH.sheen[0], TH.sheen[1], TH.sheen[2])};
  roadMat.onBeforeCompile = sh => { sh.uniforms.uSheen = sheen;
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vWP;").replace("#include <begin_vertex>", "#include <begin_vertex>\nvWP = (modelMatrix * vec4(position, 1.0)).xyz;");
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nvarying vec3 vWP; uniform vec3 uSheen;").replace("#include <map_fragment>", "#include <map_fragment>\n{ vec3 Vd = normalize(cameraPosition - vWP); float fr = pow(1.0 - clamp(Vd.y, 0.0, 1.0), 7.0); diffuseColor.rgb += uSheen * fr * (0.35 + diffuseColor.g * 2.2) * 0.6; }"); };
  add(road.geo(), roadMat); add(wall.geo(), basic(T.wall, {}, MUL.wall)); add(tun.geo(), basic(T.tunnel, {}, MUL.tun)); add(bld.geo(), basic(T.win, {}, MUL.bld));
  { const dm = new THREE.MeshBasicMaterial({vertexColors:true, side:THREE.DoubleSide}); dm.color.copy(mulC(MUL.dark)); add(dark.geo(), dm); } add(sign.geo(), basic(T.sign, {}, MUL.sign));
  const glowMat = basic(T.glow, {transparent:true, blending:THREE.AdditiveBlending, depthWrite:false, fog:false, polygonOffset:true, polygonOffsetFactor:-2, polygonOffsetUnits:-2}, TH.glow);
  add(glow.geo(), glowMat, 3);
  const pts = (arr, size) => { const n = arr.length / 6, pos = new Float32Array(n * 3), col = new Float32Array(n * 3); for(let k = 0; k < n; k++){ pos.set(arr.slice(k * 6, k * 6 + 3), k * 3); col.set(arr.slice(k * 6 + 3, k * 6 + 6), k * 3); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const m = new THREE.Points(g, new THREE.PointsMaterial({map:T.glow, size, sizeAttenuation:true, vertexColors:true, transparent:true, blending:THREE.AdditiveBlending, depthWrite:false, fog:false})); m.material.color.setScalar(TH.pts); m.frustumCulled = false; m.renderOrder = 4; group.add(m); return m; };
  pts(lampA, 11); pts(lampB, 4.5);

  /* 땅 · 강 · 하늘 */
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), new THREE.MeshBasicMaterial({color:TH.ground})); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.06; group.add(ground);
  { const km = Math.round((wk0 + wk1) / 2); at(P, km, 0, o); const len = (wk1 - wk0) * P.step; T.water.repeat.set(len / 40, 9);
    const w = new THREE.Mesh(new THREE.PlaneGeometry(len, 360), new THREE.MeshBasicMaterial({map:T.water})); w.rotation.x = -Math.PI / 2; w.rotation.z = -Math.atan2(o.tz, o.tx); w.position.set(o.x, -0.02, o.z); group.add(w); }
  const sky = new THREE.Mesh(new THREE.SphereGeometry(1700, 24, 14), new THREE.MeshBasicMaterial({vertexColors:true, side:THREE.BackSide, fog:false, depthWrite:false}));
  { const g = sky.geometry, p = g.attributes.position, c = new Float32Array(p.count * 3), top = hex(TH.sky[0]), mid = hex(TH.sky[1]), hor = hex(TH.sky[2]), low = hex(TH.sky[3]);
    for(let k = 0; k < p.count; k++){ const h = Math.max(-0.05, p.getY(k) / 1700); let a, b, t; if(h > 0.35){ a = mid; b = top; t = Math.min(1, (h - 0.35) / 0.5); } else if(h > 0.07){ a = hor; b = mid; t = (h - 0.07) / 0.28; } else { a = low; b = hor; t = Math.max(0, (h + 0.05) / 0.12); }
      c[k * 3] = a[0] + (b[0] - a[0]) * t; c[k * 3 + 1] = a[1] + (b[1] - a[1]) * t; c[k * 3 + 2] = a[2] + (b[2] - a[2]) * t; }
    g.setAttribute("color", new THREE.BufferAttribute(c, 3)); }
  sky.renderOrder = -3; group.add(sky);
  T.sky.repeat.set(7, 1);
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(1250, 1250, 300, 48, 1, true), new THREE.MeshBasicMaterial({map:T.sky, transparent:true, side:THREE.BackSide, fog:false, depthWrite:false})); ring.material.color.copy(mulC(MUL.ring)); ring.material.opacity = MUL.ringA ?? 1; ring.position.y = 138; ring.renderOrder = -2; group.add(ring);
  { const n = 420, pos = new Float32Array(n * 3); for(let k = 0; k < n; k++){ const a = rnd() * 6.283, h = 0.16 + rnd() * 0.8, r = 1600 * Math.sqrt(1 - h * h); pos[k * 3] = Math.cos(a) * r; pos[k * 3 + 1] = 1600 * h; pos[k * 3 + 2] = Math.sin(a) * r; }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); const st = new THREE.Points(g, new THREE.PointsMaterial({color:0xdfe6ff, size:2.2, sizeAttenuation:false, fog:false, transparent:true, opacity:TH.stars, depthWrite:false})); st.visible = TH.stars > 0; st.renderOrder = -2; st.frustumCulled = false; group.add(st); o2.stars = st; }
  const moon = new THREE.Sprite(new THREE.SpriteMaterial({map:T.glow, color:TH.sun[4], fog:false, depthWrite:false, blending:THREE.AdditiveBlending})); moon.scale.set(TH.sun[3], TH.sun[3], 1); moon.position.set(TH.sun[0], TH.sun[1], TH.sun[2]); moon.renderOrder = -1; group.add(moon);
  const moon2 = new THREE.Mesh(new THREE.CircleGeometry(TH.sun[5], 24), new THREE.MeshBasicMaterial({color:time === "sunset" ? 0xffd9a0 : 0xfff6e0, fog:false, depthWrite:false})); moon2.position.copy(moon.position); moon2.renderOrder = -1; group.add(moon2);

  /* 구름 (낮 · 노을): 큰 흐린 빛 덩어리 몇 개 */
  const clouds = []; if(TH.cloud) for(let k = 0; k < 16; k++){ const a = rnd() * 6.283, r = 1150 + rnd() * 250, w = 420 + rnd() * 520;
    const c = new THREE.Sprite(new THREE.SpriteMaterial({map:T.glow, color:TH.cloud[0], fog:false, depthWrite:false, transparent:true, opacity:TH.cloud[1] * (0.6 + rnd() * 0.4)})); c.scale.set(w, w * (0.2 + rnd() * 0.12), 1); c.position.set(Math.cos(a) * r, 240 + rnd() * 520, Math.sin(a) * r); c.userData.o = [c.position.x, c.position.z]; c.renderOrder = -1; group.add(c); clouds.push(c); }
  /* 출발 신호등 5개 */
  const lights = []; { const k = 2; for(let q = 0; q < 5; q++){ const p = pt(k - 0.6, (q - 2) * 1.5, 5.5), m = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 8), new THREE.MeshBasicMaterial({color:0x2a0808, fog:false})); m.position.set(p[0], p[1], p[2]); group.add(m); lights.push(m); }
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({color:0x0c0d12})); at(P, k - 0.45, 0, o); bar.position.set(o.x, o.y + 5.5, o.z); bar.scale.set(0.5, 1.3, 8.2); bar.rotation.y = Math.atan2(o.tx, o.tz); group.add(bar); }

  return {group, time:TIMES[time] ? time : "night", th:TH, sky:[sky, ring, o2.stars, moon, moon2], water:T.water, glowTex:T.glow, sheen:sheen.value,
    setLights(n, go){ lights.forEach((m, q) => m.material.color.setHex(go ? 0x35ff7a : q < n ? 0xff2b2b : 0x2a0808)); },
    update(t, cam){ T.water.offset.x = t * 0.012; for(const m of this.sky) if(m !== moon && m !== moon2){ m.position.x = cam.x; m.position.z = cam.z; } for(const c of clouds){ c.position.x = cam.x + c.userData.o[0]; c.position.z = cam.z + c.userData.o[1]; } },
    dispose(){ Object.values(T).forEach(x => x.dispose()); group.traverse(m => { m.geometry?.dispose(); m.material?.dispose?.(); }); }};
}
