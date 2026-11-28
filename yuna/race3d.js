/* 크레용 나이트 레이스 (2026-11-28 감독님 "이 안에서 레이싱게임도 만들면 좋을듯. 진짜 레이싱게임처럼" → "끝내주게 재밌게. 진짜처럼. 니드포스피드처럼")
   밤 도시 서킷 3바퀴. 상대 5대(아빠·엄마·지유·PD 둘) + 길 위 일반 차. 드리프트(끝나면 부스트) · 니트로 · 아슬아슬 지나가기
   조작: 폰은 왼쪽을 좌우로 밀어 핸들(가속은 자동), 오른쪽에 드리프트·니트로 / 컴퓨터는 방향키·WASD, 스페이스 드리프트, Shift 니트로
   파일: race3d_path(길 계산) · race3d_track(배경) · race3d_car(차·주행) · race3d_audio(소리). 유나 게임과 별개 화면으로 뜸 */
import * as THREE from "three";
import { buildPath, HALF_W, LANES, TRACKS, at, inZone } from "./race3d_path.js";
import { buildWorld, TIMES } from "./race3d_track.js";
import { makeCar, Player, Bot, collide, LIM } from "./race3d_car.js";
import { makeAudio } from "./race3d_audio.js";

const PI = Math.PI, clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, t) => a + (b - a) * t, ease = (r, dt) => 1 - Math.exp(-r * dt);
const wrapA = a => { while(a > PI) a -= 2 * PI; while(a < -PI) a += 2 * PI; return a; };
const LAPS = 3, KMH = 3.6 * 1.12;
const RIVALS = [{name:"아빠", color:0x15907c, glow:0x35f0cf, skill:1.0, lane:LANES[2], lineK:1}, {name:"엄마", color:0xa97fdc, glow:0xd9a8ff, skill:0.975, lane:LANES[1], lineK:0.8}, {name:"지유", color:0xf0a21a, glow:0xffc23a, skill:0.955, lane:LANES[3], lineK:0.6},
  {name:"편집 PD", color:0x2051e0, glow:0x4f8dff, skill:0.94, lane:LANES[0], lineK:0.9}, {name:"기획 PD", color:0xd22c1c, glow:0xff5a3a, skill:0.92, lane:LANES[2], lineK:0.45}];
const ME = {name:"유나", color:0xff3f9a, glow:0xff5fc0};
const fmt = t => { const m = t / 60 | 0, s = t - m * 60; return `${m}:${s < 10 ? "0" : ""}${s.toFixed(2)}`; };

const CSS = `
.ngp{position:fixed;inset:0;z-index:9000;background:#05060c;overflow:hidden;touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;font-family:"Inter Tight",Pretendard,system-ui,sans-serif;color:#fff;--pk:#ff4fb0;--cy:#5ff5ff;--am:#ffc23a}
.ngp *{box-sizing:border-box}
.ngp canvas.gl,.ngp-fx{position:absolute;inset:0;width:100%;height:100%;display:block}
.ngp-fx{pointer-events:none;mix-blend-mode:screen}
.ngp-vig{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at 50% 58%,transparent 42%,rgba(0,0,6,.62) 100%)}
.ngp-nfl{position:absolute;inset:0;pointer-events:none;opacity:0;background:radial-gradient(ellipse at 50% 60%,transparent 30%,rgba(60,170,255,.34) 100%);transition:opacity .25s}
.ngp-hit{position:absolute;inset:0;pointer-events:none;opacity:0;background:radial-gradient(ellipse at 50% 50%,transparent 40%,rgba(255,60,60,.5) 100%)}
.ngp-hud{position:absolute;inset:0;pointer-events:none;padding:max(12px,env(safe-area-inset-top)) max(14px,env(safe-area-inset-right)) max(14px,env(safe-area-inset-bottom)) max(14px,env(safe-area-inset-left))}
.ngp-pos{position:absolute;left:max(16px,env(safe-area-inset-left));top:max(14px,env(safe-area-inset-top));font-style:italic;font-weight:900;line-height:.9;text-shadow:0 0 18px rgba(255,79,176,.75),0 2px 0 rgba(0,0,0,.4)}
.ngp-pos b{font-size:64px;letter-spacing:-.03em}.ngp-pos i{font-size:22px;opacity:.75;margin-left:2px}
.ngp-pos small{display:block;margin-top:8px;font:800 13px/1 "Inter Tight",Pretendard,sans-serif;letter-spacing:.14em;color:var(--cy);text-shadow:0 0 10px rgba(95,245,255,.6)}
.ngp-pos small b{font-size:20px;letter-spacing:0}
.ngp-time{position:absolute;left:50%;top:max(14px,env(safe-area-inset-top));transform:translateX(-50%);text-align:center;font-style:italic;font-weight:800;font-size:26px;font-variant-numeric:tabular-nums;text-shadow:0 2px 10px rgba(0,0,0,.7)}
.ngp-time small{display:block;font:700 11px/1.5 "Inter Tight",Pretendard,sans-serif;letter-spacing:.12em;opacity:.7}
.ngp-map{position:absolute;right:max(62px,calc(env(safe-area-inset-right) + 62px));top:max(10px,env(safe-area-inset-top));width:118px;height:86px;opacity:.95}
.ngp-x{pointer-events:auto;position:absolute;right:max(12px,env(safe-area-inset-right));top:max(12px,env(safe-area-inset-top));width:42px;height:42px;border-radius:50%;border:1px solid rgba(255,255,255,.28);background:rgba(10,12,22,.55);color:#fff;font-size:16px;font-weight:700;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
.ngp-snd{right:max(12px,env(safe-area-inset-right));top:calc(max(12px,env(safe-area-inset-top)) + 50px)}
.ngp-gauge{position:absolute;right:max(14px,env(safe-area-inset-right));bottom:max(14px,env(safe-area-inset-bottom));width:190px;height:160px}
.ngp-gauge canvas{position:absolute;inset:0;width:100%;height:100%}
.ngp-kmh{position:absolute;left:0;right:0;top:40px;text-align:center;font-style:italic;font-weight:900;font-size:54px;line-height:1;letter-spacing:-.03em;font-variant-numeric:tabular-nums;text-shadow:0 0 22px rgba(95,245,255,.55)}
.ngp-kmh small{display:block;font:700 11px/1.4 "Inter Tight",sans-serif;letter-spacing:.2em;opacity:.7;font-style:normal}
.ngp-gear{position:absolute;right:26px;top:30px;font:italic 900 18px/1 "Inter Tight",sans-serif;color:var(--am)}
.ngp-nbar{position:absolute;left:22px;right:22px;bottom:6px;height:9px;border-radius:6px;background:rgba(255,255,255,.14);overflow:hidden;transform:skewX(-18deg)}
.ngp-nbar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#2aa8ff,#7ff3ff);box-shadow:0 0 12px #49c8ff}
.ngp-nlb{position:absolute;left:0;right:0;text-align:center;bottom:20px;font:800 10px/1 "Inter Tight",sans-serif;letter-spacing:.18em;color:#8fe6ff}
.ngp-msg{position:absolute;left:0;right:0;top:24%;text-align:center;font-style:italic;font-weight:900;font-size:34px;letter-spacing:.01em;opacity:0;text-shadow:0 0 22px var(--pk),0 3px 0 rgba(0,0,0,.35)}
.ngp-msg.on{animation:ngpmsg 1.5s cubic-bezier(.2,.9,.2,1) both}
.ngp-msg small{display:block;font:800 14px/1.6 Pretendard,sans-serif;letter-spacing:.04em;color:var(--cy);text-shadow:0 0 12px rgba(95,245,255,.7);font-style:normal}
@keyframes ngpmsg{0%{opacity:0;transform:scale(1.5) skewX(-8deg)}12%{opacity:1;transform:scale(1) skewX(-8deg)}75%{opacity:1}100%{opacity:0;transform:translateY(-14px) skewX(-8deg)}}
.ngp.touch .ngp-dr{bottom:calc(max(14px,env(safe-area-inset-bottom)) + 214px)}
.ngp-dr{position:absolute;left:0;right:0;bottom:calc(max(14px,env(safe-area-inset-bottom)) + 30px);text-align:center;font-style:italic;font-weight:900;font-size:22px;color:var(--am);opacity:0;transition:opacity .15s;text-shadow:0 0 16px rgba(255,194,58,.8)}
.ngp-dr.on{opacity:1}
.ngp-count{position:absolute;inset:0;display:grid;place-items:center;font-style:italic;font-weight:900;font-size:150px;opacity:0;text-shadow:0 0 50px var(--pk),0 6px 0 rgba(0,0,0,.4)}
.ngp-count.on{animation:ngpcount .85s cubic-bezier(.2,.9,.2,1) both}
@keyframes ngpcount{0%{opacity:0;transform:scale(2.2)}18%{opacity:1;transform:scale(1)}70%{opacity:1}100%{opacity:0;transform:scale(.8)}}
.ngp-wrong{position:absolute;left:0;right:0;top:38%;text-align:center;font:900 26px/1.2 Pretendard,sans-serif;color:#ff5a5a;opacity:0;text-shadow:0 0 18px rgba(255,60,60,.9)}
.ngp-wrong.on{opacity:1;animation:ngpblink .5s steps(2) infinite}@keyframes ngpblink{50%{opacity:.25}}
.ngp-title{position:absolute;left:0;right:0;top:15%;text-align:center;opacity:0;transition:opacity .5s}
.ngp-title.on{opacity:1}
.ngp-title b{display:block;font-style:italic;font-weight:900;font-size:clamp(34px,7.5vw,74px);letter-spacing:-.02em;line-height:1;text-shadow:0 0 34px var(--pk),0 4px 0 rgba(0,0,0,.4)}
.ngp-title span{display:block;margin-top:12px;font:700 14px/1 Pretendard,sans-serif;letter-spacing:.34em;color:var(--cy)}
.ngp-touch{position:absolute;inset:0;pointer-events:none;display:none}
.ngp.touch .ngp-touch{display:block}.ngp.touch .ngp-gauge{bottom:calc(max(14px,env(safe-area-inset-bottom)) + 196px);transform:scale(.8);transform-origin:right bottom}
.ngp-wheel{position:absolute;width:128px;height:128px;margin:-64px 0 0 -64px;border-radius:50%;border:3px solid rgba(255,255,255,.34);background:rgba(10,12,22,.28);left:max(92px,calc(env(safe-area-inset-left) + 92px));bottom:max(36px,calc(env(safe-area-inset-bottom) + 36px));top:auto;margin:0 0 0 -64px}
.ngp-wheel i{position:absolute;left:50%;top:50%;width:56px;height:56px;margin:-28px 0 0 -28px;border-radius:50%;background:rgba(255,255,255,.82);box-shadow:0 0 22px rgba(255,79,176,.8)}
.ngp-wheel:before,.ngp-wheel:after{content:"";position:absolute;top:50%;margin-top:-8px;border:8px solid transparent;opacity:.6}
.ngp-wheel:before{left:10px;border-right-color:#fff;border-left-width:0}.ngp-wheel:after{right:10px;border-left-color:#fff;border-right-width:0}
.ngp-btn{pointer-events:auto;position:absolute;border-radius:50%;border:2px solid rgba(255,255,255,.4);background:rgba(10,12,22,.42);color:#fff;font:900 13px/1.15 Pretendard,sans-serif;letter-spacing:.02em;display:grid;place-items:center;text-align:center;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);touch-action:none}
.ngp-btn.on{transform:scale(.93);background:rgba(255,255,255,.26)}
.ngp-drift{width:104px;height:104px;right:max(22px,calc(env(safe-area-inset-right) + 22px));bottom:max(30px,calc(env(safe-area-inset-bottom) + 30px));border-color:rgba(255,194,58,.85);box-shadow:0 0 22px rgba(255,194,58,.3)}
.ngp-nitro{width:88px;height:88px;right:max(134px,calc(env(safe-area-inset-right) + 134px));bottom:max(96px,calc(env(safe-area-inset-bottom) + 96px));border-color:rgba(95,245,255,.9);box-shadow:0 0 22px rgba(95,245,255,.35)}
.ngp-nitro.off{opacity:.45}
.ngp-btn small{display:block;font-size:10px;font-weight:700;opacity:.75;margin-top:3px}
.ngp-end{position:absolute;inset:0;display:grid;place-items:center;background:rgba(4,5,12,.62);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);opacity:0;pointer-events:none;transition:opacity .5s;padding:20px}
.ngp-end.on{opacity:1;pointer-events:auto}
.ngp-x{z-index:6}
.ngp-sel{position:absolute;inset:0;z-index:5;display:grid;place-items:center;padding:16px;background:radial-gradient(ellipse at 50% 30%,#1a1240 0%,#05060c 75%);overflow:auto}
.ngp-sel[hidden]{display:none}
.ngp-selc{width:min(560px,100%);display:grid;gap:12px}
.ngp-selc h2{margin:0;font-style:italic;font-weight:900;font-size:clamp(26px,5vw,40px);line-height:1;text-align:center;text-shadow:0 0 30px var(--pk)}
.ngp-selc .cl{display:grid;gap:10px}
.ngp-selc h3{margin:4px 0 0;font:800 13px/1 Pretendard,sans-serif;letter-spacing:.04em;color:#c9ceea}
.ngp-trk{display:grid;grid-template-columns:1fr 1fr;gap:10px}.ngp-tod{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.ngp-sel button{font:inherit;color:#fff;border:1.5px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);border-radius:16px;padding:10px;text-align:center}
.ngp-sel button[aria-pressed="true"]{border-color:#ff4fb0;background:rgba(255,79,176,.18);box-shadow:0 0 0 1px rgba(255,79,176,.5),0 10px 26px -14px rgba(255,79,176,.9)}
.ngp-trk canvas{display:block;width:100%;height:84px}.ngp-trk b,.ngp-tod b{display:block;font:800 15px/1.2 Pretendard,sans-serif}.ngp-trk small{display:block;margin-top:3px;font:600 11.5px/1.3 Pretendard,sans-serif;opacity:.7}
.ngp-trk em{display:block;margin-top:5px;font:700 11.5px/1 Pretendard,sans-serif;font-style:normal;color:#ffd27a;min-height:12px}
.ngp-tod span{display:block;font-size:26px;line-height:1.1;margin-bottom:4px}
.ngp-sel .go{margin-top:4px;padding:16px;border:0;font:800 17px/1 Pretendard,sans-serif;background:linear-gradient(100deg,#ff4fb0,#ff8a5a);box-shadow:0 8px 26px -8px rgba(255,79,176,.8)}
.ngp.t-day .ngp-vig{opacity:.25}.ngp.t-sunset .ngp-vig{opacity:.7}
.ngp-card{width:min(430px,100%);max-height:100%;overflow:auto;text-align:center}
.ngp-card h2{margin:0;font-style:italic;font-weight:900;font-size:76px;line-height:1;text-shadow:0 0 40px var(--pk)}
.ngp-card h2 small{font-size:26px;margin-left:4px}
.ngp-card p{word-break:keep-all;margin:10px 0 18px;font:700 16px/1.5 Pretendard,sans-serif;color:#e9ecff}
.ngp-rows{display:grid;gap:6px;margin:0 0 20px;text-align:left}
.ngp-rows div{display:flex;align-items:center;gap:10px;padding:9px 14px;border-radius:12px;background:rgba(255,255,255,.07);font:700 15px/1 Pretendard,sans-serif;font-variant-numeric:tabular-nums}
.ngp-rows div.me{background:rgba(255,79,176,.26);box-shadow:inset 0 0 0 1px rgba(255,79,176,.7)}
.ngp-rows b{width:22px;font:italic 900 18px/1 "Inter Tight",sans-serif}.ngp-rows i{width:10px;height:10px;border-radius:3px}.ngp-rows span{flex:1}.ngp-rows em{font-style:normal;opacity:.8}
.ngp-rows span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ngp-go{display:flex;gap:10px}.ngp-go button{flex:1;min-width:0;white-space:nowrap;padding:16px 10px;border-radius:14px;border:0;font:800 16px/1 Pretendard,sans-serif;color:#fff;background:rgba(255,255,255,.14)}
.ngp-go button.p{background:linear-gradient(100deg,#ff4fb0,#ff8a5a);box-shadow:0 8px 26px -8px rgba(255,79,176,.8)}
.ngp-load{position:absolute;inset:0;display:grid;place-items:center;background:#05060c;font:italic 900 30px/1 "Inter Tight",Pretendard,sans-serif;letter-spacing:.02em;transition:opacity .5s;text-shadow:0 0 30px var(--pk)}
.ngp-load.out{opacity:0;pointer-events:none}
.ngp-load small{display:block;margin-top:14px;font:600 13px/1.6 Pretendard,sans-serif;letter-spacing:.02em;opacity:.7;text-shadow:none;font-style:normal;text-align:center}
.ngp-help{position:absolute;left:0;right:0;bottom:calc(max(14px,env(safe-area-inset-bottom)) + 8px);text-align:center;font:600 13px/1.5 Pretendard,sans-serif;opacity:0;transition:opacity .4s;text-shadow:0 1px 6px #000}
.ngp-help.on{opacity:.85}.ngp.touch .ngp-help{bottom:auto;top:calc(max(14px,env(safe-area-inset-top)) + 134px);padding:0 20px}
.ngp.end .ngp-hud,.ngp.end .ngp-touch,.ngp.end .ngp-snd{opacity:0;pointer-events:none;transition:opacity .4s}.ngp.end .ngp-touch *{pointer-events:none}
@media (max-width:560px){.ngp-pos b{font-size:48px}.ngp-time{font-size:20px;top:calc(max(14px,env(safe-area-inset-top)) + 96px)}.ngp-map{width:96px;height:70px}.ngp-msg{font-size:26px}.ngp-count{font-size:110px}.ngp-card h2{font-size:58px}}
@media (max-height:560px){.ngp-selc{width:min(760px,100%);grid-template-columns:1.25fr 1fr;column-gap:16px;align-items:start}.ngp-selc h2{grid-column:1/-1;font-size:24px}.ngp-selc .cl{display:grid;gap:8px}.ngp-trk canvas{height:66px}.ngp-tod span{font-size:22px}
  .ngp-card{width:min(760px,100%);display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.15fr);column-gap:24px;align-items:center}.ngp-card h2{grid-column:1;grid-row:1;font-size:54px}.ngp-card p{grid-column:1;grid-row:2;margin:8px 0 14px;font-size:14px}.ngp-rows{grid-column:2;grid-row:1/4;margin:0;gap:4px}.ngp-rows div{padding:7px 12px;font-size:14px}.ngp-go{grid-column:1;grid-row:3;gap:6px}.ngp-go button{padding:13px 2px;font-size:13.5px}}
`;

let R = null;
export const _dbg = () => R;
export function webglOK(){ try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch(_){ return false; } }

export function open(opts = {}){
  if(R) close();
  if(!document.getElementById("ngp-css")){ const st = document.createElement("style"); st.id = "ngp-css"; st.textContent = CSS; document.head.append(st); }
  const root = document.createElement("div"); root.className = "ngp";
  root.innerHTML = `<canvas class="gl"></canvas><canvas class="ngp-fx"></canvas><div class="ngp-vig"></div><div class="ngp-nfl"></div><div class="ngp-hit"></div>
    <div class="ngp-hud"><div class="ngp-pos"><b>6</b><i>/6</i><small>LAP <b>1</b>/${LAPS}</small></div><div class="ngp-time"><span>0:00.00</span><small></small></div><canvas class="ngp-map"></canvas>
      <div class="ngp-gauge"><canvas></canvas><div class="ngp-kmh"><span>0</span><small>KM/H</small></div><div class="ngp-gear">N</div><div class="ngp-nlb">NITRO</div><div class="ngp-nbar"><i></i></div></div>
      <div class="ngp-title"><b>CREYONG NIGHT RACE</b><span>크레용 레이스</span></div><div class="ngp-msg"></div><div class="ngp-dr"></div><div class="ngp-wrong">반대 방향이에요</div><div class="ngp-count"></div><div class="ngp-help"></div></div>
    <div class="ngp-touch"><div class="ngp-wheel"><i></i></div><button class="ngp-btn ngp-nitro" type="button">니트로<small>NITRO</small></button><button class="ngp-btn ngp-drift" type="button">드리프트<small>브레이크</small></button></div>
    <button class="ngp-x" type="button" aria-label="레이스 나가기">✕</button><button class="ngp-x ngp-snd" type="button" aria-label="소리 켜기·끄기">🔊</button>
    <div class="ngp-end"><div class="ngp-card"></div></div><div class="ngp-sel" hidden></div><div class="ngp-load"><div>CREYONG RACE<small>시동 거는 중…</small></div></div>`;
  document.body.append(root);
  const $ = s => root.querySelector(s);
  R = {root, opts, $, state:"load", t:0, live:true, raf:0, last:0, keys:{}, touch:{steer:0, id:null, x0:0, drift:false, nitro:false}, I:{steer:0, gas:0, brake:0, hand:false, nitro:false}, auto:!!opts.auto, sound:opts.sound !== false, frames:0, slow:0, fxS:[], msgT:0, tun:0, shake:0, lapT:0, laps:[], best:null, order:[], nearN:0, driftBest:0, usedKeys:false};
  R.au = makeAudio(R.sound); $(".ngp-snd").textContent = R.sound ? "🔊" : "🔇";
  const pf = opts.pref || {}; R.track = TRACKS[opts.track || pf.track] ? (opts.track || pf.track) : "city"; R.time = TIMES[opts.time || pf.time] ? (opts.time || pf.time) : "night";
  $(".ngp-x").onclick = exit;   // 고르는 화면 · 불러오는 중에도 나갈 수 있게 (달리기 시작하면 bind 가 다시 검)
  if(opts.auto || opts.track) setTimeout(() => { if(R && R.root === root) build(); }, 30); else select();
  return {close, get state(){ return R?.state; }};
}

/* 맵 · 시간 고르기 (2026-11-29 감독님 "맵도 좀 더 필요해 밤만있는것도 싫어") */
function select(){
  const el = R.$(".ngp-sel"), root = R.root; R.$(".ngp-load").classList.add("out"); R.state = "select";
  const bestOf = k => { let b = 0; Object.keys(TIMES).forEach(t => { const v = R.opts.bests?.[k + ":" + t]?.time; if(v > 0 && (!b || v < b)) b = v; }); return b; };
  el.innerHTML = `<div class="ngp-selc"><h2>CREYONG RACE</h2><div class="cl"><h3>어디서 달릴까</h3><div class="ngp-trk">${Object.entries(TRACKS).map(([k, t]) => `<button type="button" data-k="${k}"><canvas width="240" height="132"></canvas><b>${t.name}</b><small>${t.sub}</small><em>${bestOf(k) ? "내 기록 " + fmt(bestOf(k)) : ""}</em></button>`).join("")}</div></div>
    <div class="cl"><h3>언제 달릴까</h3><div class="ngp-tod">${Object.entries(TIMES).map(([k, t]) => `<button type="button" data-k="${k}"><span>${t.e}</span><b>${t.name}</b></button>`).join("")}</div><button type="button" class="go">출발!</button></div></div>`;
  const mark = () => { el.querySelectorAll(".ngp-trk button").forEach(b => b.setAttribute("aria-pressed", b.dataset.k === R.track)); el.querySelectorAll(".ngp-tod button").forEach(b => b.setAttribute("aria-pressed", b.dataset.k === R.time)); };
  el.querySelectorAll(".ngp-trk button").forEach(b => { const P = buildPath(8, b.dataset.k), c = b.querySelector("canvas"), g = c.getContext("2d"), w = c.width, h = c.height; let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    for(let k = 0; k < P.N; k++){ x0 = Math.min(x0, P.px[k]); x1 = Math.max(x1, P.px[k]); z0 = Math.min(z0, P.pz[k]); z1 = Math.max(z1, P.pz[k]); } const sc = Math.min((w - 28) / (x1 - x0), (h - 28) / (z1 - z0)), X = x => (x - x0) * sc + (w - (x1 - x0) * sc) / 2, Z = z => (z - z0) * sc + (h - (z1 - z0) * sc) / 2;
    const seg = (a, b2, col, lw) => { g.beginPath(); for(let k = a; k <= b2; k++){ const q = k % P.N; g[k === a ? "moveTo" : "lineTo"](X(P.px[q]), Z(P.pz[q])); } g.strokeStyle = col; g.lineWidth = lw; g.lineJoin = g.lineCap = "round"; g.stroke(); };
    seg(0, P.N, "rgba(255,255,255,.16)", 12); seg(0, P.N, "#ffffff", 5); seg(Math.floor(P.zone.tunnel[0] * P.N), Math.ceil(P.zone.tunnel[1] * P.N), "#ffb040", 5); seg(Math.floor(P.zone.bridge[0] * P.N), Math.ceil(P.zone.bridge[1] * P.N), "#57d7ff", 5);
    g.fillStyle = "#ff4fb0"; g.beginPath(); g.arc(X(P.px[0]), Z(P.pz[0]), 6, 0, 7); g.fill();
    b.onclick = () => { R.track = b.dataset.k; mark(); R.au.sfx?.("tick"); }; });
  el.querySelectorAll(".ngp-tod button").forEach(b => b.onclick = () => { R.time = b.dataset.k; mark(); R.au.sfx?.("tick"); });
  el.querySelector(".go").onclick = () => { if(!R || R.root !== root) return; R.opts.pref = {track:R.track, time:R.time}; R.opts.onPref?.(R.opts.pref); el.hidden = true; R.$(".ngp-load").classList.remove("out"); R.state = "load"; setTimeout(() => { if(R && R.root === root) build(); }, 60); };
  mark(); el.hidden = false;
}
function build(){
  const TH = TIMES[R.time] || TIMES.night; R.th = TH; R.root.classList.add("t-" + R.time); R.key = R.track + ":" + R.time; R.$(".ngp-title b").textContent = TH.title; R.$(".ngp-title span").textContent = `${TRACKS[R.track].name} · ${TH.name}`;
  const {root, $} = R, canvas = $("canvas.gl"), mobile = matchMedia("(pointer:coarse)").matches || innerWidth < 720;
  const renderer = new THREE.WebGLRenderer({canvas, antialias:!mobile, powerPreference:"high-performance"}); R.renderer = renderer; R.pr = Math.min(devicePixelRatio || 1, mobile ? 1.6 : 2); renderer.setPixelRatio(R.pr);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = TH.exposure;
  const scene = new THREE.Scene(), FOG = new THREE.Color(TH.fog); scene.background = FOG.clone(); scene.fog = new THREE.FogExp2(FOG.getHex(), TH.fogD); R.scene = scene; R.FOG = FOG;
  const camera = new THREE.PerspectiveCamera(64, 1, 0.3, 2600); R.camera = camera; camera.rotation.order = "YXZ";
  /* 차에 비칠 밤거리 (작은 가짜 풍경을 구워 반사로 씀) */
  { const es = new THREE.Scene(); es.background = new THREE.Color(0x05060f); const bx = (c, x, y, z, sx, sy, sz) => { const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), new THREE.MeshBasicMaterial({color:c})); m.position.set(x, y, z); es.add(m); };
    es.background = new THREE.Color(TH.env[0]); if(TH.env[1]) bx(TH.env[1], 0, 14, 0, 44, 0.5, 44); for(let q = -3; q <= 3; q++) bx(q % 2 ? 0xfff0d0 : 0xffc890, q * 3.2 % 5, 8, q * 7, 1.6, 0.3, 2.6);
    bx(0xff3fa8, -9, 2.5, 0, 0.5, 4, 30); bx(0x2aa8c8, 9, 2.2, 0, 0.5, 2.4, 22); bx(0xffb060, -9, 7, 6, 0.5, 2, 6); bx(0xb78bff, 9, 8, -8, 0.5, 2, 6); bx(0x8a3a6c, 0, 1.5, -18, 50, 7, 0.5); bx(0x3a4aa0, 0, 1.5, 18, 50, 6, 0.5); bx(0x1c1c26, 0, -3, 0, 50, 0.5, 50);
    const pm = new THREE.PMREMGenerator(renderer); R.env = pm.fromScene(es, 0.03).texture; pm.dispose(); es.traverse(m => { m.geometry?.dispose(); m.material?.dispose(); }); }
  R.hemi = new THREE.HemisphereLight(TH.hemi[0], TH.hemi[1], TH.hemi[2]); R.hemiC = R.hemi.color.clone(); scene.add(R.hemi); const dl = new THREE.DirectionalLight(TH.dir[0], TH.dir[1]); dl.position.set(-0.4, 1, -0.6); scene.add(dl);
  const P = buildPath(2, R.track); R.P = P; R.world = buildWorld(P, R.time); scene.add(R.world.group);
  /* 차 */
  const glow = R.world.glowTex, N = P.N;
  R.me = new Player(P, makeCar("sport", ME.color, R.env, glow, {glow:ME.glow})); scene.add(R.me.car.root);
  R.rivals = RIVALS.map((r, k) => { const b = new Bot(P, makeCar("sport", r.color, R.env, glow, {glow:r.glow, name:r.name, lo:true}), {...r, s:N - 9 - (k / 2 | 0) * 8, d:k % 2 ? 2.7 : -2.7, top:57}); scene.add(b.car.root); return b; });
  R.me.reset(N - 25, 2.7);
  const TK = [["sedan", 0xd9dce6], ["taxi", 0xf2b019], ["van", 0xeceff4], ["sedan", 0x25345c], ["bus", 0x2f9a6a], ["sedan", 0x8a8f9c], ["taxi", 0xf08a1c], ["van", 0x3d6fb0], ["sedan", 0x7a1f2a], ["bus", 0x2a62c4], ["sedan", 0xc9c2b0]];
  R.traffic = TK.map(([kind, color], k) => { const s = 70 + (N - 230) * (k + 0.5) / TK.length + (k * 37 % 19), taxi = kind === "taxi"; const b = new Bot(P, makeCar(taxi ? "sedan" : kind, color, R.env, glow, {taxi}), {traffic:true, s, d:LANES[(k * 3 + 1) % 4], lane:LANES[(k * 3 + 1) % 4], top:kind === "bus" ? 15 : 17 + (k * 7 % 8), v:16}); b.car.beam.scale.set(5.5, 1, 11); scene.add(b.car.root); return b; });
  R.bots = [...R.rivals, ...R.traffic]; R.all = [...R.bots, R.me];
  if(TH.beam !== 1) R.all.forEach(c => c.car.root.traverse(m => { const mt = m.material; if(mt && mt.blending === THREE.AdditiveBlending){ mt.userData.c0 = mt.userData.c0 || mt.color.clone(); mt.color.copy(mt.userData.c0).multiplyScalar(TH.beam); } }));   // 낮엔 전조등 · 바닥 불빛을 약하게
  else R.all.forEach(c => c.car.root.traverse(m => { const mt = m.material; if(mt && mt.userData.c0) mt.color.copy(mt.userData.c0); }));
  /* 연기·불꽃 */
  { const n = 260, g = new THREE.BufferGeometry(); R.pp = {n, i:0, pos:new Float32Array(n * 3), vel:new Float32Array(n * 3), col:new Float32Array(n * 4), size:new Float32Array(n), life:new Float32Array(n), max:new Float32Array(n), add:new Float32Array(n), grow:new Float32Array(n), a0:new Float32Array(n)};
    g.setAttribute("position", new THREE.BufferAttribute(R.pp.pos, 3)); g.setAttribute("pc", new THREE.BufferAttribute(R.pp.col, 4)); g.setAttribute("size", new THREE.BufferAttribute(R.pp.size, 1)); g.setAttribute("add", new THREE.BufferAttribute(R.pp.add, 1));
    const m = new THREE.ShaderMaterial({uniforms:{map:{value:glow}, sc:{value:1}}, transparent:true, depthWrite:false, blending:THREE.CustomBlending, blendSrc:THREE.OneFactor, blendDst:THREE.OneMinusSrcAlphaFactor,
      vertexShader:`attribute float size; attribute vec4 pc; attribute float add; varying vec4 vC; varying float vA; uniform float sc; void main(){ vC = pc; vA = add; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = size * sc / max(0.5, -mv.z); gl_Position = projectionMatrix * mv; }`,
      fragmentShader:`uniform sampler2D map; varying vec4 vC; varying float vA; void main(){ float a = texture2D(map, gl_PointCoord).a * vC.a; gl_FragColor = vec4(vC.rgb * a, a * (1.0 - vA)); }`});
    R.ppM = m; const o = new THREE.Points(g, m); o.frustumCulled = false; o.renderOrder = 5; scene.add(o); R.ppG = g; }
  /* 타이어 자국 */
  { const n = 300, g = new THREE.BufferGeometry(), pos = new Float32Array(n * 12), idx = []; for(let k = 0; k < n; k++){ const b = k * 4; idx.push(b, b + 1, b + 2, b, b + 2, b + 3); }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setIndex(idx); const o = new THREE.Mesh(g, new THREE.MeshBasicMaterial({color:0x020203, transparent:true, opacity:0.5, depthWrite:false, side:THREE.DoubleSide, polygonOffset:true, polygonOffsetFactor:-1.5, polygonOffsetUnits:-1.5})); o.frustumCulled = false; o.renderOrder = 1; scene.add(o); R.sk = {n, i:0, pos, g, prev:null}; }
  /* 미니맵 밑그림 */
  { const c = $(".ngp-map"), w = 236, h = 172; c.width = w; c.height = h; let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for(let k = 0; k < N; k++){ x0 = Math.min(x0, P.px[k]); x1 = Math.max(x1, P.px[k]); z0 = Math.min(z0, P.pz[k]); z1 = Math.max(z1, P.pz[k]); }
    const sc = Math.min((w - 20) / (x1 - x0), (h - 20) / (z1 - z0)), ox = (w - (x1 - x0) * sc) / 2 - x0 * sc, oz = (h - (z1 - z0) * sc) / 2 - z0 * sc; R.mm = {c, g:c.getContext("2d"), w, h, X:x => x * sc + ox, Z:z => z * sc + oz, base:document.createElement("canvas")};
    const b = R.mm.base; b.width = w; b.height = h; const g = b.getContext("2d"); g.lineJoin = "round"; g.beginPath(); for(let k = 0; k <= N; k += 3){ const q = k % N; g[k ? "lineTo" : "moveTo"](R.mm.X(P.px[q]), R.mm.Z(P.pz[q])); } g.closePath();
    g.strokeStyle = "rgba(6,8,18,.75)"; g.lineWidth = 11; g.stroke(); g.strokeStyle = "rgba(255,255,255,.9)"; g.lineWidth = 5; g.stroke(); g.fillStyle = "#ff4fb0"; g.fillRect(R.mm.X(P.px[0]) - 2, R.mm.Z(P.pz[0]) - 7, 4, 14); }
  R.gg = $(".ngp-gauge canvas"); R.gg.width = 380; R.gg.height = 320; R.ggc = R.gg.getContext("2d"); R.fx = $(".ngp-fx"); R.fxc = R.fx.getContext("2d");
  for(let k = 0; k < 46; k++) R.fxS.push({a:Math.random() * 6.283, r:0.25 + Math.random() * 0.9, l:0.05 + Math.random() * 0.2, w:0.6 + Math.random() * 1.8, v:0.7 + Math.random()});
  bind(); resize(); R.cam = {yaw:R.me.yaw, y:R.me.y + 2.4, fov:64};
  R.state = "intro"; R.t = 0; R.stT = 0; R.world.setLights(0, false); camStep(0.016); renderer.render(scene, camera);
  $(".ngp-load").classList.add("out"); $(".ngp-title").classList.add("on"); R.last = 0; R.raf = requestAnimationFrame(frame);
}

function bind(){
  const {root, $} = R, T = R.touch, wheel = $(".ngp-wheel"), knob = wheel.querySelector("i");
  const kd = e => { if(!R) return; const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; R.keys[k] = true; R.usedKeys = true; R.au.resume(); if(k === "Escape") exit(); if(k === "r" && R.state === "race") rescue(); if(k === "Enter" && R.state === "done") restart(); if([" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(k)) e.preventDefault(); };
  const ku = e => { if(!R) return; const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; R.keys[k] = false; };
  addEventListener("keydown", kd, true); addEventListener("keyup", ku, true); addEventListener("resize", resize);
  const vis = () => { if(!R) return; if(document.hidden){ R.live = false; cancelAnimationFrame(R.raf); R.au.update({rpm:0, gas:0, speed:0, slip:0, nitro:false, live:false}); R.au.music(false); } else if(!R.live){ R.live = true; R.last = 0; R.raf = requestAnimationFrame(frame); if(R.state === "race") R.au.music(true); } };
  document.addEventListener("visibilitychange", vis);
  R.unbind = () => { removeEventListener("keydown", kd, true); removeEventListener("keyup", ku, true); removeEventListener("resize", resize); document.removeEventListener("visibilitychange", vis); };
  const setKnob = () => { knob.style.transform = `translateX(${T.steer * 34}px)`; };
  root.addEventListener("pointerdown", e => { R.au.resume(); if(e.pointerType === "mouse" || e.target.closest("button")) return; root.classList.add("touch"); R.isTouch = true;
    if(T.id === null && e.clientX < innerWidth * 0.6){ T.id = e.pointerId; T.x0 = e.clientX - T.steer * 56; e.preventDefault(); } });
  root.addEventListener("pointermove", e => { if(e.pointerId !== T.id) return; T.steer = clamp((e.clientX - T.x0) / 56, -1, 1); if(Math.abs(e.clientX - T.x0) > 56) T.x0 = e.clientX - Math.sign(e.clientX - T.x0) * 56; setKnob(); });
  const up = e => { if(e.pointerId !== T.id) return; T.id = null; T.steer = 0; setKnob(); }; root.addEventListener("pointerup", up); root.addEventListener("pointercancel", up);
  const hold = (el, key) => { const on = e => { e.preventDefault(); e.stopPropagation(); R.au.resume(); root.classList.add("touch"); R.isTouch = true; T[key] = true; el.classList.add("on"); try { el.setPointerCapture(e.pointerId); } catch(_){} }, off = e => { T[key] = false; el.classList.remove("on"); };
    el.addEventListener("pointerdown", on); el.addEventListener("pointerup", off); el.addEventListener("pointercancel", off); el.addEventListener("lostpointercapture", off); el.addEventListener("contextmenu", e => e.preventDefault()); };
  hold($(".ngp-drift"), "drift"); hold($(".ngp-nitro"), "nitro");
  $(".ngp-x:not(.ngp-snd)").onclick = e => { e.stopPropagation(); exit(); };
  $(".ngp-snd").onclick = e => { e.stopPropagation(); R.sound = !R.sound; R.au.set(R.sound); R.au.resume(); e.currentTarget.textContent = R.sound ? "🔊" : "🔇"; R.opts.onSound?.(R.sound); };
  root.addEventListener("contextmenu", e => e.preventDefault());
}
function resize(){ if(!R || !R.renderer) return; const w = innerWidth, h = innerHeight; R.renderer.setSize(w, h, false); R.camera.aspect = w / h; R.portrait = w < h; R.camera.updateProjectionMatrix(); R.fx.width = Math.round(w / 3); R.fx.height = Math.round(h / 3); R.ppM.uniforms.sc.value = h * R.pr * 0.9; }

/* ---------- 흐름 ---------- */
function msg(t, sub){ const el = R.$(".ngp-msg"); el.innerHTML = t + (sub ? `<small>${sub}</small>` : ""); el.classList.remove("on"); void el.offsetWidth; el.classList.add("on"); }
function count(t){ const el = R.$(".ngp-count"); el.textContent = t; el.classList.remove("on"); void el.offsetWidth; el.classList.add("on"); }
function help(t, ms = 4200){ const el = R.$(".ngp-help"); el.textContent = t; el.classList.add("on"); clearTimeout(R.helpT); R.helpT = setTimeout(() => el.classList.remove("on"), ms); }
function rescue(){ const me = R.me, k = me.k; at(R.P, k, clamp(me.d, -4, 4), _o); me.x = _o.x; me.z = _o.z; me.yaw = Math.atan2(_o.tx, _o.tz); me.vx = _o.tx * 14; me.vz = _o.tz * 14; me.wrong = 0; me.drift = 0; me.slipK = 0; }
function restart(){
  const N = R.P.N; R.$(".ngp-end").classList.remove("on"); R.root.classList.remove("end"); R.hP = 0; R.result = null; R.rivals.forEach((b, k) => { Object.assign(b, {s:N - 9 - (k / 2 | 0) * 8, d:k % 2 ? 2.7 : -2.7, v:0, dv:0, fin:0, finT:0, bump:0}); b.prog = (b.s - N) * R.P.step; b.dT = b.d; b.place(); });
  R.traffic.forEach((b, k) => { b.s = 70 + (N - 230) * (k + 0.5) / R.traffic.length + (k * 37 % 19); b.pds = undefined; b.place(); });
  R.me.reset(N - 25, 2.7); R.sk.prev = null; R.sk.pos.fill(0); R.sk.g.attributes.position.needsUpdate = true; R.state = "intro"; R.stT = 0; R.t = 0; R.laps = []; R.lapT = 0; R.nearN = 0; R.driftBest = 0; R.finT = 0; R.cam.yaw = R.me.yaw; R.world.setLights(0, false); R.$(".ngp-title").classList.add("on"); R.au.music(false);
}
function exit(){ const o = R?.opts; close(); o?.onExit?.(); }
export function close(){ if(!R) return; R.live = false; cancelAnimationFrame(R.raf); clearTimeout(R.helpT); R.unbind?.(); R.au.close(); try { R.world?.dispose(); R.env?.dispose(); R.scene?.traverse(m => { m.geometry?.dispose?.(); if(m.material){ m.material.map && m.material.map !== R.world.glowTex && m.material.map.dispose?.(); m.material.dispose?.(); } }); R.renderer?.dispose(); } catch(_){} R.root.remove(); R = null; }

function finish(){
  const me = R.me, total = R.t - R.goT; R.state = "finish"; R.stT = 0; R.finT = total; R.au.music(false);
  const rank = 1 + R.rivals.filter(b => b.fin).length; R.rank = rank; R.au.sfx(rank <= 3 ? "win" : "lose"); msg(rank === 1 ? "1등!! 🏆" : rank + "등으로 골인!", fmt(total));
}
function showEnd(){
  R.state = "done"; const total = R.finT, rank = R.rank, bestLap = Math.min(...R.laps), old = (R.opts.bests || {})[R.key] || {}, newBest = !(old.time > 0) || total < old.time;
  const rows = [{me:true, name:ME.name, color:ME.glow, prog:1e12 - rank, t:total}, ...R.rivals.map(b => ({name:b.name, color:b.glow, prog:b.fin ? 1e12 - b.fin : b.prog, t:b.finT || 0}))].sort((a, b) => b.prog - a.prog);
  R.$(".ngp-card").innerHTML = `<h2>${rank}<small>등</small></h2><p>${rank === 1 ? "우승이에요! 🏆" : rank <= 3 ? "시상대에 올랐어요 🎉" : "다음엔 더 빨리 달려 봐요 💪"}<br>기록 ${fmt(total)} · 가장 빠른 바퀴 ${fmt(bestLap)}${newBest ? " · 새 기록!" : ""}</p>
    <div class="ngp-rows">${rows.map((r, k) => `<div class="${r.me ? "me" : ""}"><b>${k + 1}</b><i style="background:#${r.color.toString(16).padStart(6, "0")}"></i><span>${r.name}</span><em>${r.t ? fmt(r.t) : "달리는 중"}</em></div>`).join("")}</div>
    <div class="ngp-go"><button type="button" class="again p">다시 달리기</button><button type="button" class="chg">맵 바꾸기</button><button type="button" class="out">나가기</button></div>`;
  R.$(".ngp-end").classList.add("on"); R.root.classList.add("end"); R.$(".again").onclick = restart; R.$(".out").onclick = exit; R.$(".chg").onclick = () => { const o = R.opts; o.track = null; o.time = null; o.sound = R.sound; close(); open(o); };
  R.result = {rank, time:total, bestLap, near:R.nearN, drift:R.driftBest, key:R.key, track:R.track, tod:R.time}; R.opts.onEnd?.(R.result); if(newBest){ R.opts.bests = R.opts.bests || {}; R.opts.bests[R.key] = {time:total, lap:bestLap}; }
}

/* ---------- 한 프레임 ---------- */
const _o = {}, _v = new THREE.Vector3();
function input(){
  const K = R.keys, T = R.touch, I = R.I, me = R.me;
  if(R.auto || R.state === "finish"){ autopilot(I); return I; }
  const ks = (K.ArrowRight || K.d ? 1 : 0) - (K.ArrowLeft || K.a ? 1 : 0);
  I.steer = ks || T.steer; I.brake = K.ArrowDown || K.s ? 1 : 0; I.hand = !!(K[" "] || T.drift); I.nitro = !!(K.Shift || K.n || K.x || T.nitro);
  I.gas = I.brake ? 0 : R.isTouch && !R.usedKeys ? 1 : K.ArrowUp || K.w ? 1 : R.isTouch ? 1 : 0;
  return I;
}
function autopilot(I){   // 시험·골인 뒤: 코스를 따라 알아서 달림
  const me = R.me, P = R.P, N = P.N, v = Math.max(me.vf, 0), look = (9 + v * 0.42) / P.step; let kA = 0; for(let q = 6; q < 40; q += 2) kA += P.kv[(me.k + q) % N];
  const fin = R.state === "finish"; at(P, me.s + look, clamp(kA * 7, -1, 1) * (fin ? 2 : HALF_W - 3), _o); const err = wrapA(Math.atan2(_o.x - me.x, _o.z - me.z) - me.yaw);
  let vt = fin ? 30 : 60; const br = 20, n = Math.ceil((v * v / (2 * br) + 30) / P.step); for(let q = 0; q <= n; q += 2){ const ak = Math.abs(P.kv[(me.k + q) % N]); if(ak > 2e-4){ const vc = Math.sqrt(17 / ak), va = Math.sqrt(vc * vc + 2 * br * q * P.step); if(va < vt) vt = va; } }
  for(const b of R.bots){ let ds = b.s - me.s; if(ds > N / 2) ds -= N; ds *= P.step; if(ds < 3.5) continue; if(ds < 8 + v * 0.5 && Math.abs(b.d - me.d) < 2.2){ vt = Math.min(vt, b.v + ds * 0.4); } }
  I.steer = clamp(-err * 2.6, -1, 1); I.gas = v < vt ? 1 : 0; I.brake = v > vt + 2.5 ? 1 : 0; I.hand = false; I.nitro = !fin && R.autoNitro && Math.abs(kA) < 0.02 && me.nitro > 0.3;
}

function spawn(x, y, z, vx, vy, vz, life, size, r, g, b, a, add, grow){ const p = R.pp, i = p.i; p.i = (i + 1) % p.n; p.pos[i * 3] = x; p.pos[i * 3 + 1] = y; p.pos[i * 3 + 2] = z; p.vel[i * 3] = vx; p.vel[i * 3 + 1] = vy; p.vel[i * 3 + 2] = vz; p.life[i] = p.max[i] = life; p.size[i] = size; p.col[i * 4] = r; p.col[i * 4 + 1] = g; p.col[i * 4 + 2] = b; p.col[i * 4 + 3] = a; p.a0[i] = a; p.add[i] = add; p.grow[i] = grow; }
function particles(dt){
  const p = R.pp; for(let i = 0; i < p.n; i++){ if(p.life[i] <= 0) continue; p.life[i] -= dt; const f = Math.max(0, p.life[i] / p.max[i]);
    p.pos[i * 3] += p.vel[i * 3] * dt; p.pos[i * 3 + 1] += p.vel[i * 3 + 1] * dt; p.pos[i * 3 + 2] += p.vel[i * 3 + 2] * dt; if(p.add[i]){ p.vel[i * 3 + 1] -= 16 * dt; if(p.pos[i * 3 + 1] < 0.05){ p.pos[i * 3 + 1] = 0.05; p.vel[i * 3 + 1] *= -0.4; } } else { p.vel[i * 3] *= 1 - dt * 1.5; p.vel[i * 3 + 2] *= 1 - dt * 1.5; }
    p.size[i] += p.grow[i] * dt; p.col[i * 4 + 3] = p.life[i] <= 0 ? 0 : p.a0[i] * f; }
  const g = R.ppG.attributes; g.position.needsUpdate = true; g.pc.needsUpdate = true; g.size.needsUpdate = true; g.add.needsUpdate = true;
}
function effects(dt){
  const me = R.me, fx = Math.sin(me.yaw), fz = Math.cos(me.yaw), rx = -fz, rz = fx, sp = Math.abs(me.vf);
  /* 타이어 연기 + 자국 */
  const sliding = (me.drift || me.slip > 0.42 || (me.brakeOn && sp > 22)) && sp > 7;
  const wl = [me.x + rx * -0.86 - fx * 1.34, me.z + rz * -0.86 - fz * 1.34], wr = [me.x + rx * 0.86 - fx * 1.34, me.z + rz * 0.86 - fz * 1.34];
  if(sliding){ R.smkT = (R.smkT || 0) + dt; while(R.smkT > 0.022){ R.smkT -= 0.022; const w = Math.random() < 0.5 ? wl : wr, a = me.drift ? 0.34 : 0.22; spawn(w[0], me.y + 0.25, w[1], me.vx * 0.25 + (Math.random() - 0.5) * 2, 0.7 + Math.random() * 0.8, me.vz * 0.25 + (Math.random() - 0.5) * 2, 0.7 + Math.random() * 0.5, 1.6, 0.82, 0.84, 0.92, a, 0, 5.5); }
    const s = R.sk; if(s.prev){ for(const [a, b] of [[s.prev[0], wl], [s.prev[1], wr]]){ const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1, nx = -dz / l * 0.14, nz = dx / l * 0.14, o = s.i * 12, y = me.y + 0.035; s.i = (s.i + 1) % s.n;
        s.pos.set([a[0] - nx, y, a[1] - nz, a[0] + nx, y, a[1] + nz, b[0] + nx, y, b[1] + nz, b[0] - nx, y, b[1] - nz], o); } s.g.attributes.position.needsUpdate = true; } s.prev = [wl, wr]; }
  else R.sk.prev = null;
  /* 벽·차에 긁힐 때 불꽃 */
  if(me.sparkT > 0){ me.sparkT -= dt; const sd = me.wallSide || 1; for(let q = 0; q < 3; q++) spawn(me.x + rx * sd * 0.95 + fx * (Math.random() * 3 - 1.2), me.y + 0.3 + Math.random() * 0.4, me.z + rz * sd * 0.95 + fz * (Math.random() * 3 - 1.2), me.vx * 0.55 - rx * sd * (2 + Math.random() * 5), 2 + Math.random() * 4, me.vz * 0.55 - rz * sd * (2 + Math.random() * 5), 0.3 + Math.random() * 0.35, 0.5, 1, 0.72 + Math.random() * 0.2, 0.25, 1, 1, -0.4); }
  /* 니트로 불꽃 꼬리 */
  if(me.nitroOn){ for(const sx of [-0.42, 0.42]) spawn(me.x + rx * sx - fx * 2.5, me.y + 0.36, me.z + rz * sx - fz * 2.5, me.vx * 0.82, 0.2, me.vz * 0.82, 0.14, 1.0, 0.35, 0.75, 1, 0.8, 1, 1.5); }
  particles(dt);
}

function camStep(dt){
  const me = R.me, cam = R.camera, C = R.cam, sp = Math.abs(me.vf), sf = clamp(sp / 78, 0, 1), nk = R.nk = lerp(R.nk || 0, me.nitroOn ? 1 : me.boost > 0 ? 0.5 : 0, ease(5, dt));
  const pt = R.portrait;
  if(R.state === "intro" || R.state === "done" || R.state === "finish"){   // 차 둘레를 도는 카메라
    const u = R.state === "intro" ? clamp(R.stT / 3.4, 0, 1) : 0, e = u * u * (3 - 2 * u), a = R.state === "intro" ? me.yaw + PI * (0.82 - 0.82 * e) + (1 - e) * 0.5 : me.yaw + PI * 0.75 + R.stT * 0.35, rad = R.state === "intro" ? lerp(8.5, pt ? 9.6 : 6.8, e) : pt ? 9.5 : 7.5, h = R.state === "intro" ? lerp(1.0, pt ? 3.5 : 2.4, e) : 1.7;
    cam.position.set(me.x - Math.sin(a) * rad, me.y + h, me.z - Math.cos(a) * rad); cam.lookAt(me.x, me.y + (pt ? 1.6 : 0.9), me.z); C.yaw = me.yaw; C.fov = lerp(C.fov, pt ? 84 : 58, ease(3, dt)); cam.fov = C.fov; cam.updateProjectionMatrix(); return; }
  const vyaw = sp > 6 ? Math.atan2(me.vx, me.vz) : me.yaw, want = me.yaw + wrapA(vyaw - me.yaw) * 0.55; C.yaw += wrapA(want - C.yaw) * ease(me.drift ? 4.2 : 6.5, dt);
  const dist = (pt ? 9.2 : 6.5) + sf * 1.5 + nk * 1.5, h = (pt ? 3.5 : 2.3) + sf * 0.3, cx = Math.sin(C.yaw), cz = Math.cos(C.yaw);
  /* 흔들림은 부딪힌 순간에만 잠깐 (2026-11-28 감독님 "왜케 흔들리냐": 달리는 내내 떨리던 것 · 부딪힌 뒤 안 멎던 것 없앰) */
  R.shake = Math.max(R.shake * Math.exp(-dt * 10), me.hit * 0.09); const sh = R.shake, st = R.t * 38;
  C.y = lerp(C.y, me.y + h, ease(9, dt));
  cam.position.set(me.x - cx * dist + cz * Math.sin(st) * sh, C.y + Math.sin(st * 1.31 + 1) * sh * 0.6, me.z - cz * dist - cx * Math.sin(st) * sh);
  _v.set(me.x + cx * (pt ? 10 : 7), me.y + (pt ? 3.2 : 1.15), me.z + cz * (pt ? 10 : 7)); cam.lookAt(_v); cam.rotation.z += -me.steerV * 0.026 * sf - (me.slipA || 0) * 0.07;
  C.fov = lerp(C.fov, (pt ? 88 : 62) + sf * 16 + nk * 11, ease(4, dt)); cam.fov = C.fov; cam.updateProjectionMatrix();
}

function hud(dt){
  const me = R.me, $ = R.$, sp = Math.abs(me.vf), kmh = Math.round(sp * KMH);
  if(kmh !== R.hK){ R.hK = kmh; $(".ngp-kmh span").textContent = kmh; }
  const gear = R.state === "race" || R.state === "finish" ? (me.vf < -0.5 ? "R" : me.gear) : "N"; if(gear !== R.hG){ R.hG = gear; $(".ngp-gear").textContent = gear; }
  const nb = Math.round(me.nitro * 100); if(nb !== R.hN){ R.hN = nb; $(".ngp-nbar i").style.width = nb + "%"; $(".ngp-nitro").classList.toggle("off", nb < 3); }
  /* 순위 */
  let pos = 1; for(const b of R.rivals) if(b.fin || b.prog > me.prog) pos++; if(R.state === "finish" || R.state === "done") pos = R.rank;
  if(pos !== R.hP){ if(R.hP && R.state === "race" && pos < R.hP) msg(pos === 1 ? "1등!" : pos + "등", "추월!"); R.hP = pos; $(".ngp-pos > b").textContent = pos; }
  const lap = clamp(Math.floor(Math.max(me.prog, 0) / R.P.total) + 1, 1, LAPS); if(lap !== R.hL){ R.hL = lap; $(".ngp-pos small b").textContent = lap; }
  const tt = R.state === "race" ? R.t - R.goT : R.state === "finish" || R.state === "done" ? R.finT : 0, ts = fmt(tt); if(ts !== R.hT){ R.hT = ts; $(".ngp-time span").textContent = ts; }
  $(".ngp-nfl").style.opacity = R.nk > 0.05 ? R.nk * 0.9 : 0; $(".ngp-hit").style.opacity = clamp(me.hit * 0.7, 0, 0.55);
  $(".ngp-wrong").classList.toggle("on", R.state === "race" && me.wrong > 0.7);
  const dr = $(".ngp-dr"); if(me.drift && R.state === "race"){ dr.textContent = `DRIFT ${me.driftT.toFixed(1)}s`; dr.classList.add("on"); } else dr.classList.remove("on");
  for(const b of R.bots){ const d = Math.hypot(b.x - R.camera.position.x, b.z - R.camera.position.z); b.car.root.visible = d < (b.traffic ? 330 : 520); if(b.car.tag) b.car.tag.visible = d > 11 && d < 240; }
  /* 계기판 */
  const g = R.ggc, W = 380, H = 320, cx = 190, cy = 180, rad = 150, a0 = PI * 0.86, a1 = PI * 2.14, rp = R.state === "race" || R.state === "finish" ? me.rpm : 0.18 + (R.I.gas ? 0.3 : 0) + Math.sin(R.t * 30) * 0.01;
  g.clearRect(0, 0, W, H); g.lineCap = "butt"; g.lineWidth = 16; g.strokeStyle = "rgba(255,255,255,.13)"; g.beginPath(); g.arc(cx, cy, rad, a0, a1); g.stroke();
  g.strokeStyle = "rgba(255,70,70,.5)"; g.beginPath(); g.arc(cx, cy, rad, lerp(a0, a1, 0.88), a1); g.stroke();
  const gr = g.createLinearGradient(40, 0, 340, 0); gr.addColorStop(0, "#5ff5ff"); gr.addColorStop(0.7, "#ff4fb0"); gr.addColorStop(1, "#ff3a3a"); g.strokeStyle = gr; g.shadowColor = "#ff4fb0"; g.shadowBlur = 18; g.beginPath(); g.arc(cx, cy, rad, a0, lerp(a0, a1, clamp(rp, 0.02, 1))); g.stroke(); g.shadowBlur = 0;
  g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 2; for(let q = 0; q <= 8; q++){ const a = lerp(a0, a1, q / 8); g.beginPath(); g.moveTo(cx + Math.cos(a) * (rad - 14), cy + Math.sin(a) * (rad - 14)); g.lineTo(cx + Math.cos(a) * (rad - 24), cy + Math.sin(a) * (rad - 24)); g.stroke(); }
  /* 미니맵 */
  if((R.frames & 1) === 0){ const m = R.mm, c = m.g; c.clearRect(0, 0, m.w, m.h); c.drawImage(m.base, 0, 0); for(const b of R.traffic){ c.fillStyle = "rgba(255,255,255,.5)"; c.fillRect(m.X(b.x) - 2, m.Z(b.z) - 2, 4, 4); }
    for(const b of R.rivals){ c.fillStyle = "#" + b.glow.toString(16).padStart(6, "0"); c.beginPath(); c.arc(m.X(b.x), m.Z(b.z), 6, 0, 6.3); c.fill(); }
    c.fillStyle = "#fff"; c.beginPath(); c.arc(m.X(me.x), m.Z(me.z), 9.5, 0, 6.3); c.fill(); c.fillStyle = "#ff4fb0"; c.beginPath(); c.arc(m.X(me.x), m.Z(me.z), 6.5, 0, 6.3); c.fill(); }
  /* 속도선 */
  const k = clamp((sp - 40) / 40, 0, 1) * 0.5 + (R.nk || 0) * 0.8, f = R.fxc, fw = R.fx.width, fh = R.fx.height; f.clearRect(0, 0, fw, fh);
  if(k > 0.03 && R.state === "race"){ const rr = Math.hypot(fw, fh) / 2, ox = fw / 2, oy = fh * 0.56; f.lineCap = "round"; for(const s of R.fxS){ s.r += dt * (0.9 + k * 2.2) * s.v; if(s.r > 1.25){ s.r = 0.3 + Math.random() * 0.25; s.a = Math.random() * 6.283; }
      const r0 = s.r * rr, r1 = (s.r + s.l * (0.5 + k)) * rr, cs = Math.cos(s.a), sn = Math.sin(s.a); f.strokeStyle = `rgba(${R.nk > 0.3 ? "150,225,255" : "255,255,255"},${clamp(k * (s.r - 0.25) * 0.75, 0, 0.6)})`; f.lineWidth = s.w * (0.6 + k); f.beginPath(); f.moveTo(ox + cs * r0, oy + sn * r0); f.lineTo(ox + cs * r1, oy + sn * r1); f.stroke(); } }
}

function step(dt){
  const me = R.me, P = R.P, ev = me.ev; ev.length = 0; R.t += dt; R.stT += dt; R.frames++;
  const I = input();
  if(R.state === "intro"){ me.sync(0); if(R.stT > 3.5){ R.state = "count"; R.stT = 0; R.cnt = 0; R.$(".ngp-title").classList.remove("on"); } }
  else if(R.state === "count"){ me.sync(I.steer); me.rpm = lerp(me.rpm, 0.2 + (I.gas || R.isTouch ? 0.35 + Math.sin(R.t * 9) * 0.12 : 0), ease(8, dt));
    const n = Math.floor(R.stT / 0.95); if(n >= R.cnt && n < 3){ R.cnt = n + 1; count(3 - n); R.au.sfx("beep"); R.world.setLights(Math.round((n + 1) * 5 / 3), false); }
    if(R.stT >= 2.85){ R.state = "race"; R.stT = 0; R.goT = R.t; R.lapT = R.t; count("GO!"); R.au.sfx("go"); R.world.setLights(5, true); R.au.music(true); help(R.isTouch ? "왼쪽을 좌우로 밀어 핸들 · 꺾으면서 드리프트 · 파란 버튼은 니트로" : "방향키로 운전 · 스페이스 드리프트 · Shift 니트로 · R 제자리로", 6000); } }
  if(R.state === "race" || R.state === "finish"){
    const wasN = me.nitroOn, lapBefore = Math.floor(me.prog / P.total);
    me.update(dt, I);
    for(const b of R.bots) b.update(dt, R.all, me, true);
    collide(me, R.bots, dt, ev);
    for(const b of R.rivals) if(!b.fin && b.prog >= LAPS * P.total){ b.fin = 1 + R.rivals.filter(q => q.fin).length + (R.state !== "race" ? 1 : 0); b.finT = R.t - R.goT; }
    if(R.state === "race"){
      for(const e of ev){ if(e === "wall") R.au.sfx("crash", me.hit); else if(e === "crash") R.au.sfx("crash", me.hit); else if(e === "rub") R.au.sfx("rub"); else if(e === "shift") R.au.sfx("shift");
        else if(e === "boost"){ R.au.sfx("boost"); R.driftBest = Math.max(R.driftBest, me.driftT); msg("드리프트 부스트!", `${me.driftT.toFixed(1)}초`); }
        else if(e === "near"){ R.nearN++; me.nitro = Math.min(1, me.nitro + 0.2); R.au.sfx("near"); msg("아슬아슬!", "니트로 +20"); } }
      if(me.nitroOn && !wasN) R.au.sfx("nitro");
      if(me.wrong > 3.2) rescue();
      const lapNow = Math.floor(me.prog / P.total);
      if(lapNow > lapBefore && lapNow >= 1){ R.laps.push(R.t - R.lapT); R.lapT = R.t; if(lapNow >= LAPS) finish(); else { R.au.sfx("lap"); msg(lapNow === LAPS - 1 ? "마지막 바퀴!" : `${lapNow + 1}바퀴째`, `지난 바퀴 ${fmt(R.laps[R.laps.length - 1])}`); } }
      if(R.t - R.goT > 420){ R.laps.length || R.laps.push(R.t - R.lapT); finish(); }
      if(!R.isTouch && !R.usedKeys && R.t - R.goT > 2.5 && !R.tipped){ R.tipped = true; help("↑ 키를 누르면 출발해요", 5000); }
    } else if(R.stT > 2.6) showEnd();
  }
  /* 가로등 아래를 지날 때 차에 빛이 스침 · 터널 안은 주황빛 */
  const ph = (me.s % 17) / 17, pulse = Math.pow(Math.max(0, Math.cos((ph - 0.5) * 2 * PI) * -1), 2); const inTun = inZone(P, me.k, P.zone.tunnel); R.tun = lerp(R.tun, inTun ? 1 : 0, ease(3, dt));
  me.car.paint.envMapIntensity = 1.2 + pulse * 1.3 + R.tun * 1.4; R.scene.fog.color.setRGB(lerp(R.FOG.r, 0.16, R.tun), lerp(R.FOG.g, 0.085, R.tun), lerp(R.FOG.b, 0.03, R.tun)); R.scene.background.copy(R.scene.fog.color); R.hemi.color.setRGB(lerp(R.hemiC.r, 1, R.tun), lerp(R.hemiC.g, 0.62, R.tun), lerp(R.hemiC.b, 0.3, R.tun)); { const sh = R.th.sheen; R.world.sheen.setRGB(lerp(sh[0], 1.0, R.tun), lerp(sh[1], 0.6, R.tun), lerp(sh[2], 0.22, R.tun)); }
  effects(dt); camStep(dt); R.world.update(R.t, R.camera.position); hud(dt);
  R.au.update({rpm:me.rpm, gas:R.state === "race" ? I.gas : 0.2, speed:Math.abs(me.vf), slip:me.drift ? Math.max(0.6, me.slip) : me.slip > 0.4 ? me.slip : 0, nitro:me.nitroOn, live:R.state !== "done"});
}
function frame(now){
  if(!R || !R.live) return; R.raf = requestAnimationFrame(frame);
  let dt = R.last ? (now - R.last) / 1000 : 0.016; R.last = now; if(dt > 0.1) dt = 0.1;
  /* 느린 기기는 해상도를 낮춤 */
  if(R.state === "race" && R.frames > 60){ R.slow = lerp(R.slow || dt, dt, 0.03); if(R.slow > 0.027 && R.pr > 1 && !(R.frames % 90)){ R.pr = Math.max(1, R.pr - 0.3); R.renderer.setPixelRatio(R.pr); resize(); } }
  const n = dt > 0.034 ? 2 : 1; for(let q = 0; q < n; q++) step(dt / n);
  R.renderer.render(R.scene, R.camera);
}
export const _restart = () => restart();
export function _pump(sec, h = 1 / 60){ if(!R || !R.scene) return 0; let n = 0; for(let t = 0; t < sec; t += h){ step(h); n++; } R.renderer.render(R.scene, R.camera); return n; }
