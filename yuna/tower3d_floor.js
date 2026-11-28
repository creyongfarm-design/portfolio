/* 크레용타워 업무층(2F) 고정 시점 3D 시안 (2026-11-21 감독님: "3d인데 니말대로 한 시각에서만 보이게 지금처럼")
   - 2.5D 지도(크레용사무실.html)의 칸 좌표 그대로. x = i − 18, z = j − 10, 칸 1 = 1, 높이는 2.5D px ÷ 31.1 (벽 112px = 3.6)
   - 카메라는 2.5D와 같은 비스듬한 위 시점(방위 45°, 고도 30°)에 고정. 구역 버튼을 누르면 그 구역으로 부드럽게 확대·이동만
   - 가구는 색깔별로 한 덩어리로 합치고(낮·밤 색 두 벌), 사람 18명은 같은 도형끼리 인스턴싱 → 그리기 호출을 확 줄임
   - 글씨·포스터·창밖 풍경은 한 장짜리 그림판(아틀라스)에 모아서 한 번에 그림
   - 바닥 무늬·빛 웅덩이는 바닥 한 장 그림으로 (2.5D drawFloor를 위에서 내려다본 그림으로 옮김) */
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const coarse = matchMedia("(pointer: coarse)").matches;
const GJ = 20, GI = 29, WI = 36, CJ = 8.0;
const OX = 18, OZ = 10;
const X = i => i - OX, Z = j => j - OZ;
const PX = 1 / 31.1, hz = px => px * PX;             // 2.5D 높이(px) → 3D
const WALL_H = 3.6;
const AZ0 = Math.PI / 4, EL0 = Math.PI / 6;          // 처음 각도 = 2.5D 2:1 도면과 같음. 끌어서 돌릴 수 있음 (2026-11-22 감독님 "돌릴 수 있게 해봐")
const EL_MIN = 0.2, EL_MAX = 1.35;
const DIR = new THREE.Vector3();
function setDir(az, el){ DIR.set(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az)); }
setDir(AZ0, EL0);
/* 돌려서 뒷벽이 앞을 가리면 그 벽을 낮게 잘라 보임 (인형집처럼). 굳힌 재질 모두에 같은 조건 */
const CUT = {value:new THREE.Vector4(-1e3, -1e3, 99, 99)};
const PCUT_A = {value:new THREE.Vector4(0, 0, 0, 0)}, PCUT_B = {value:new THREE.Vector4(0, 0, 0, 0.95)};   // 유나 모드: 카메라~유나 사이 통로 자르기
const CUT_BAYER = "float cutBayer(vec2 p){ vec2 q = mod(floor(p), 4.0); int k = int(q.x) + int(q.y) * 4; const float B[16] = float[16](0.0, 8.0, 2.0, 10.0, 12.0, 4.0, 14.0, 6.0, 3.0, 11.0, 1.0, 9.0, 15.0, 7.0, 13.0, 5.0); return (B[k] + 0.5) / 16.0; }\n";   // 유나 모드 가림막: 4x4 바이어로 서서히 투명 (체크무늬·톱니 없앰, 2026-11-23)
function cutaway(mat){
  mat.onBeforeCompile = sh => { sh.uniforms.uCut = CUT; sh.uniforms.uPA = PCUT_A; sh.uniforms.uPB = PCUT_B;
    sh.vertexShader = "varying vec3 vCutW;\n" + sh.vertexShader.replace("#include <project_vertex>", "#include <project_vertex>\n  vCutW = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    sh.fragmentShader = "varying vec3 vCutW;\nuniform vec4 uCut;\nuniform vec4 uPA;\nuniform vec4 uPB;\n" + CUT_BAYER + sh.fragmentShader.replace("void main() {", "void main() {\n  if((vCutW.x < uCut.x && vCutW.y > uCut.z) || (vCutW.z < uCut.y && vCutW.y > uCut.w)) discard;\n  if(uPA.w > 0.5){ vec2 dd = uPB.xz - uPA.xz; vec2 ww = vCutW.xz - uPA.xz; float tt = clamp(dot(ww, dd) / max(dot(dd, dd), 1e-4), 0.0, 1.0); float edge = mix(0.3, uPB.w, tt) + 0.18 - length(ww - dd * tt); float yb = vCutW.y - (mix(uPA.y, uPB.y, tt) - 0.05); if(tt > 0.08 && edge > 0.0 && yb > 0.0){ float hh = vCutW.y - uPA.y; float cc = smoothstep(0.0, 0.36, edge) * smoothstep(0.08, 0.22, tt) * smoothstep(0.0, 0.12, yb) * mix(0.62, 1.0, smoothstep(1.05, 1.45, hh)); if(cc > cutBayer(gl_FragCoord.xy)) discard; } }"); };
  mat.customProgramCacheKey = () => "cut"; return mat;
}
function updateCut(){
  const k = v => Math.max(0, Math.min(1, (0.12 - v) / 0.32)), hi = WALL_H + 2, lo = 0.32;
  CUT.value.set(X(0) + 0.5, Z(0) + 0.5, hi - (hi - lo) * k(DIR.x), hi - (hi - lo) * k(DIR.z));
}
const PSCALE = 0.78;                                  // 2.5D 가구 비율에 맞춘 사람 크기
const FONT = "\"IBM Plex Sans KR\", \"Apple SD Gothic Neo\", system-ui, sans-serif";
const SIGN = "\"Inter Tight\", \"IBM Plex Sans KR\", system-ui, sans-serif";
const ST_COLOR = {working:"#E8A04A", review:"#E06A55", scheduled:"#6F82CF", done:"#4DAA97", idle:"#9C9384"};
const RAINBOW = ["#F4A7B9","#F9C99B","#F6E39A","#A8DCC8","#A9CBEA","#C8B4D0"];

/* 2.5D 도면 색 [낮, 밤] (크레용사무실.html :root 토큰 그대로) */
const T = {
  "c-farm":["#E8A04A","#F0AE5E"], "c-prod":["#3A8A78","#5DB3A0"], "c-studio":["#E8B5C8","#E8B5C8"], "c-school":["#8B5A3C","#C08A66"], "c-lilac":["#C8B4D0","#C8B4D0"],
  "fl-farm":["#EADBC3","#4A3F31"], "fl-prod":["#D5D6D1","#2F3331"], "fl-studio":["#F7DEE7","#4B3641"], "fl-school":["#E3D0BD","#43372D"], "fl-cor":["#EEE8DE","#36312B"], slab:["#CBBFAE","#211E1A"],
  "wall-l":["#E4D9C8","#2C2823"], "wall-r":["#EEE5D7","#332E28"], "wall-top":["#CDBDA6","#4A4238"], "wall-studio":["#F4CCDA","#5A3B4A"], "wall-prod":["#363B39","#1E2221"],
  wood:["#C9A77F","#7A6246"], desk:["#F6F2EB","#5B544B"], metal:["#5E5C57","#8A877F"], "screen-off":["#3A3F47","#1E2228"], frame:["#8E8679","#A39B8E"], felt:["#F0CF9F","#6E5434"], pot:["#ECE6DC","#857F75"], plant:["#5FA582","#4C8A6B"],
  amber:["#E8A04A","#E8A04A"], ok:["#4DAA97","#4DAA97"], warn:["#E06A55","#E06A55"], sched:["#6F82CF","#6F82CF"], "ink-2":["#6E675C","#B3AA9C"], "ink-3":["#9C9384","#857D71"],
};
const D2 = (l, d) => [l, d];
const cp = c => Array.isArray(c) ? c : T[c] || [c, c];
function shade(hex, amt){
  const m = String(hex).replace("#",""); if(m.length !== 6) return hex;
  const n = [0,2,4].map(i => parseInt(m.slice(i,i+2),16));
  const f = v => Math.max(0, Math.min(255, Math.round(amt >= 0 ? v + (255 - v) * amt : v * (1 + amt))));
  return "#" + n.map(v => f(v).toString(16).padStart(2,"0")).join("");
}
const sh = (c, a) => cp(c).map(h => shade(h, a));

/* ---------- 2.5D 배치 (크레용사무실.html 그대로) ---------- */
export const ZONES = {
  farm:   {name:"크레용팜",        color:"#E8A04A", rect:[0,0,12.0,7.0],   label:[8.8,0,"top"]},
  prod:   {name:"크레용프로덕션",  color:"#3A8A78", rect:[0,9.0,12.0,GJ],  label:[6.2,GJ,"bottom"]},
  ceo:    {name:"대표실",          color:"var(--ink)", rect:[GI,0,WI,9],      label:[WI,3.5,"side"]},
};
const LOUNGE = {pantry:{name:"탕비실", rect:[25.0,0,GI,7.0], label:[27.0,0,"top"], color:"#C9A27A"},
  nap:{name:"수면실", rect:[25.0,9.0,GI,14.6], label:[29.0,11.4,"side"], color:"#8E9BC0"},
  wc:{name:"화장실", rect:[25.0,14.6,GI,GJ], label:[29.0,17.6,"side"], color:"#7FB7C9"},
  grade:{name:"색보정실", rect:[18.6,12.0,24.0,GJ], label:[21.3,GJ,"bottom"], color:"#3A8A78"},
  review:{name:"크레용팜 리뷰 세트", rect:[13.2,0,24,7.0], label:[18.2,0,"top"], color:"#E8A04A"}};   // 옛 2F 예운옥 자리 (2026-11-22 감독님 "업무층에 예운옥 중복" → 예운옥은 4F만)   // 크레용프로덕션 소속 어두운 방 (필름스쿨은 4F, 2F 구역 버튼 없음)
/* 2F 넓히기 (2026-11-22 감독님 "사무실 넓히고"): 옛 필름스쿨 자리 = 색보정실 + 뒤쪽 머신룸. 프로덕션 옛 색보정 구석 = 레퍼런스 보드 + 콘티 테이블 (2.5D와 같은 숫자) */
const CS = [18.6, 12.0, 24.0, GJ], CS_DOOR = [23.1, 24.0];
const REF_STILLS = [[16.6,64,0.9,16,"#2B4A63","#C98A55"],[17.65,66,0.9,16,"#3B2A33","#E8B27A"],[18.7,64,0.9,16,"#1F3C52","#9CC9C0"],[16.6,40,0.9,16,"#4B3A5E","#E9C9A8"],[17.65,42,0.9,16,"#2E5D55","#D7A15B"],[18.7,40,0.9,16,"#5A5A58","#D8D4CC"]];
const ROSTER = [
  {id:"plan",   name:"기획",   role:"기획 PD · 작가",   zone:"farm",   desk:[4.0,2.6,2.3,1.0], island:true, seat:[5.1,2.15], dir:"+j", stand:[4.0,1.85],  look:{skin:"#F1D2B8", hair:"#2B211C", style:"bob",   shirt:"#4DAA97", pants:"#3B3F46"}},
  {id:"edit",   name:"편집",   role:"편집 · 업로드 PD",   zone:"farm",   desk:[1.7,3.6,2.3,1.0], island:true, seat:[2.9,5.05], dir:"-j", stand:[4.0,5.45],  look:{skin:"#E7C09F", hair:"#1F1F1F", style:"short", shirt:"#E8A04A", pants:"#2F3238"}, headphones:true},
  {id:"short",  name:"트렌드", role:"숏폼 PD · 레퍼런스 릴스 담당",        zone:"farm",   desk:[4.0,3.6,2.3,1.0], island:true, seat:[5.1,5.05], dir:"-j", stand:[6.75,5.3],  look:{skin:"#EFCBB0", hair:"#4E3426", style:"long",  shirt:"#72C4AE", pants:"#3B3A44"}},
  {id:"deal",   name:"협업",   role:"협업 매니저",    zone:"farm",   desk:[7.7,0.12,2.3,0.45], bar:true, seat:[8.4,1.0], dir:"-j", look:{skin:"#EDC6A6", hair:"#3B2B22", style:"bob",   shirt:"#D9B26F", pants:"#3A3936"}, stand:[10.2,2.3]},
  {id:"prod",   name:"제작",   role:"제작 PD",        zone:"prod",   desk:[2.9,13.25,1.8,0.75], cart:true, seat:[3.8,14.45], dir:"-j", look:{skin:"#E5BC98", hair:"#1E1A17", style:"short", shirt:"#3A8A78", pants:"#2B2D30"}, stand:[5.85,15.25]},
  {id:"color",  name:"컬러",   role:"컬러리스트",     zone:"prod",   desk:[19.6,14.0,2.8,0.8], noDesk:true, look:{skin:"#F2D2BA", hair:"#8A8A88", style:"short", shirt:"#4A5A6E", pants:"#26282B"}, stand:[23.2,15.3]},   // 색보정실 가죽 의자
  {id:"design", name:"디자인", role:"디자인 · 썸네일 · 모션",   zone:"prod",   desk:[7.0,16.9,2.6,1.25], draft:true, seat:[8.3,18.6], dir:"-j", look:{skin:"#F0CDB2", hair:"#7A4A30", style:"bob",   shirt:"#5C6B8A", pants:"#2E2F33"}, stand:[9.95,19.25]},
  {id:"sales",  name:"영업",   role:"영업 PD",        zone:"prod",   desk:[10.6,10.95,1.3,0.9], look:{skin:"#EAC7A8", hair:"#2A2420", style:"long",  shirt:"#2F6F61", pants:"#2B2D30"}, stand:[11.55,12.95]},
  {id:"admin",  name:"경영지원", role:"경영지원 PD · 타워 관리", zone:"hq", desk:[16.75,18.35,1.5,0.75], look:{skin:"#EBC6A8", hair:"#2A221E", style:"short", shirt:"#5C6B8A", pants:"#2E2E2C"}},
];
const SPARE = [
  {id:"graphic", zone:"farm", desk:[1.7,2.6,2.3,1.0], island:true, seat:[2.9,2.15], dir:"+j"}, {id:"thumb", zone:"farm", desk:[1.7,3.1,0.6,1.0], island:true, seat:[1.25,3.6], dir:"+i"},
  {id:"pplan", zone:"prod", desk:[0.5,9.35,1.9,0.8]}, {id:"writer", zone:"prod", desk:[2.9,9.35,1.9,0.8]}, {id:"pedit", zone:"prod", desk:[7.75,13.75,1.5,0.5], village:true, seat:[8.5,14.7], dir:"-j"}];   // 비디오 빌리지
const IDLE_LINES = {plan:"다음 기획안·대본 아이디어 정리 중", edit:"새 촬영본 기다리는 중 · 예약 목록 확인", short:"트렌드 스크롤 중", deal:"협업 제안 메일 확인 중", prod:"촬영 체크리스트 보는 중",
  color:"LUT 정리하는 중", sales:"올릴 곳 리스트 정리 중", promo:"대관 후기 모으는 중", design:"썸네일·모션 무드보드 정리 중", studio:"대관 문의 기다리는 중", admin:"타워 정리하는 중 🏢", taling:"탈잉 VOD 수강평·질문 살펴보는 중", class:"다음 원데이 일정 고민 중"};
const STAFF = [
  {id:"_dir",   name:"크레용", role:"대표 · 감독", hex:"var(--ink)", at:[33.0,2.35], pose:"sit", face:0, look:{skin:"#E8C3A2", hair:"#1E1B18", style:"bob", hat:"bucket", hatC:"#CDBB9A", shirt:"#2A2A28", pants:"#3A3D42"}, build:{h:1.06, w:1.18}, task:"대표실에서 일 보는 중"},
  // 노라 이사님은 4층 예운옥으로 옮김 (2026-11-22 감독님 "노라는 예운옥 중심으로") → 업무층 3D엔 없음
  {id:"_recep", name:"안내", role:"로비 안내 데스크", hex:"#2E3A5C", at:[16.4,12.3], pose:"stand", face:0, look:{skin:"#F1CDB0", hair:"#3B2A22", style:"bun", shirt:"#2E3A5C", pants:"#2E3A5C", skirt:"#2E3A5C", legs:"#E8C7AE", scarf:"#3A8A78", badge:true}, build:{h:0.96, w:0.9}, task:"로비 안내 데스크 · 손님 맞이 😊"},
  {id:"_yuna",  name:"유나", role:"크레용 · 노라 이사님 딸 · 10살", hex:"#FF6FA8", at:[23.95,4.1], pose:"stand", face:-2.3, kid:true, look:{skin:"#F6D7C2", hair:"#3A261C", style:"pig", ribbon:"#FF5FA8", shirt:"#FF8FB8", pants:"#6FA8DC"}, build:{h:0.74, w:0.9}, task:"리뷰 세트 구경하며 종알종알 💕"},
];
/* 행복한 회사 (2026-11-23 감독님 "행복한 크리스찬 회사가 되자~ 일하는 사람들이 행복한 곳", "mz 직원도 있고 애플 헤드폰끼고") — 빈 책상에 MZ 직원 둘 */
const MZ = [
  {id:"_mz1", name:"막내", role:"숏폼 편집 막내 · 자막·썸네일 보조", hex:"#B9A3E3", zone:"farm", spare:"graphic", desk:[1.7,2.6,2.3,1.0], island:true, seat:[2.9,2.15], dir:"+j", status:"working", headphones:"max", hpC:"#F4C7D3",
   look:{skin:"#F3D6C2", hair:"#2A211D", style:"bob", shirt:"#C9B8EC", pants:"#86A9CF"}, build:{h:0.97, w:0.95}, task:"릴스 자막 뽑는 중 🎧"},
  {id:"_mz2", name:"인턴", role:"제작 인턴 · 촬영 보조", hex:"#8FC7B0", zone:"prod", spare:"pedit", desk:[7.75,13.75,1.5,0.5], village:true, seat:[8.5,14.7], dir:"-j", status:"working", headphones:"max", hpC:"#D5D9DE",
   look:{skin:"#EAC5A6", hair:"#3A2A20", style:"short", shirt:"#A9CFA0", pants:"#3E4C60"}, build:{h:1.0, w:1.0}, task:"촬영 장비 리스트 정리 중 🎧"},
];
const REVIEW_SPOTS = [[32.15,4.45],[33.55,4.45]];
const NORA_TALKS = [
  [[0,"여보, 점심 뭐 먹을래? 🍜"],[1,"국밥 어때?"],[0,"콜 😋"]],
  [[0,"커피 타 왔어 ☕"],[1,"고마워 여보 😊"]],
  [[0,"예운옥 대관 일정 같이 보자 🌈"],[1,"좋아, 저녁에 정리하자"]],
  [[1,"블로그 사진 뭐가 제일 예뻐?"],[0,"노을 외관 컷 🌇"],[1,"역시 이사님 안목 👍"]],
  [[0,"너무 무리하지 마 💕"],[1,"응, 쉬엄쉬엄 할게"]],
];
const DIR_PATH = [[33.0,2.35],[30.4,2.35],[30.0,2.9],[30.0,8.0],[24.5,8.0],[24.5,3.5],[24.3,3.25]];
/* 감독님 크레용팜 리뷰 세트 촬영 · 출연 (2026-11-22): 테이블 뒤에 서서 정면 카메라(16.7, 5.2) 보고 말함 */
const DIR_REV_PATH = [[33.0,2.35],[30.4,2.35],[30.0,2.9],[30.0,8.0],[19.3,8.0],[19.3,1.5],[16.7,1.5]];
const DIR_REV_SAY = ["안녕하세요, 크레용팜입니다! 🎬","아 저는 웹드라마 감독 크레용인데요","오늘 협찬 제품 바로 열어 볼게요 📦","이거 진짜 편하거든요","근데 여기서 중요한 게 있어요","컷! 한 번만 다시 갈게요 🙏","탑뷰로 한 번 더 보여 드릴게요","댓글로 궁금한 거 남겨 주세요 💬"];
const LAMPS_DOME = [[8.9,4.5],[6.9,CJ],[18.6,CJ],[12.6,3.4],[14.5,13.2],[26.6,3.6],[14.5,17.4],[2.7,18.1],[33.0,3.35]];
const LAMPS_BAR = [[2.2,2.95,3.3,2.95],[4.7,2.95,5.8,2.95],[2.2,4.25,3.3,4.25],[4.7,4.25,5.8,4.25],[7.9,0.4,9.8,0.4]];   // 섬 테이블 자리 위 + 창가 바 (2026-11-23)
/* 크레용팜 둥근 섬 테이블 (2026-11-23 감독님 A안) · 앉는 방향 */
const ISLAND = {c:[4.0,3.6], hl:1.3, r:1.0};
function islandPts3(g = 0){ const [ci,cj] = ISLAND.c, {hl, r} = ISLAND, rr = r + g, out = [];
  for(let k = 0; k <= 14; k++){ const a = -Math.PI/2 + k * Math.PI / 14; out.push([ci + hl + rr*Math.cos(a), cj + rr*Math.sin(a)]); }
  for(let k = 0; k <= 14; k++){ const a = Math.PI/2 + k * Math.PI / 14; out.push([ci - hl + rr*Math.cos(a), cj + rr*Math.sin(a)]); }
  return out; }
const HEAD = {"-j":Math.PI, "+j":0, "+i":Math.PI / 2, "-i":-Math.PI / 2}, deskHead = r => HEAD[r.dir || "-j"];
const PLANTS = [[0.45,0.45,true],[11.75,6.7,true],[13.45,6.7,true],[11.75,9.3,true],[12.25,10.75,true],[18.2,15.4,false],[11.75,15.6,true],[5.6,16.9,true],[11.75,19.6,true],[13.45,19.6,true],[17.55,12.7,true],[18.2,9.5,true],[23.6,0.5,true],[28.6,6.6,false],[28.65,19.5,true],[31.15,0.45,false],[35.6,6.6,true]];

let R = null;
/* 다른 층 (2026-11-22 감독님 "다른 층도 다 해야지"): opts.floor = 층 정의(floor3d_*.js). 없으면 업무층 */
const ZS = () => R && R.F ? R.F.zones : ZONES;
const SUBS = () => R && R.F ? (R.F.subs || {}) : LOUNGE;
const EGGL = () => R && R.F ? (R.F.eggs || []) : EGGS;
/* 크레용팜만 보기 (2026-11-21 감독님: "일단 한군데만 해봐. 보고 다 하자") · 팜 + 앞 복도 */
const FARM_EXT = [12.6, 9.0];
const inFarm = (i, j) => i < FARM_EXT[0] && j < FARM_EXT[1];

/* ---------- 도형 창고 ---------- */
const GEO = new Map();
const geo = (k, make) => { if(!GEO.has(k)) GEO.set(k, make()); return GEO.get(k); };
const q3 = v => Math.round(v * 1000) / 1000;
const rbox = (w, h, d, r = 0.04, seg = 1) => { w = q3(w); h = q3(h); d = q3(d);
  const m = Math.min(w, h, d);
  if(m < 0.07 || r <= 0) return geo(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d));
  const rr = Math.max(0.004, Math.min(r, m / 2 - 0.004)); return geo(`rb${w},${h},${d},${rr},${seg}`, () => new RoundedBoxGeometry(w, h, d, seg, rr)); };
const sph = (r, ws = 16, hs = 12) => geo(`s${q3(r)},${ws},${hs}`, () => new THREE.SphereGeometry(q3(r), ws, hs));
const cap = (r, len) => geo(`c${r},${len}`, () => new THREE.CapsuleGeometry(r, len, 4, 10));
const cyl = (rt, rb, h, seg = 16) => geo(`y${q3(rt)},${q3(rb)},${q3(h)},${seg}`, () => new THREE.CylinderGeometry(q3(rt), q3(rb), q3(h), seg));

/* ---------- 정적 가구: 진짜 Mesh로 조립 → 마지막에 재료 종류별로 한 덩어리로 합침 ---------- */
const PH = new THREE.MeshBasicMaterial();
let SROOT = null;
function sm(g, col, x = 0, y = 0, z = 0, parent = SROOT, cls = "m"){
  const o = new THREE.Mesh(g, PH); o.userData.c = cp(col); o.userData.cls = cls; o.position.set(x, y, z); parent.add(o); return o; }
/* 2.5D box(i, j, w, d, h, 색, z0) 그대로: i·j는 칸, h·z0는 2.5D px */
function B(i, j, w, d, h, col, z0 = 0, o = {}){
  const H = Math.max(0.004, hz(h));
  return sm(rbox(w, H, d, o.r ?? 0.035, o.seg ?? 1), col, X(i + w / 2), hz(z0) + H / 2, Z(j + d / 2), o.parent || SROOT, o.cls || "m"); }
/* 벽에 붙는 얇은 면: faceJ는 j가 고정(정면 +z), faceI는 i가 고정(정면 +x) */
const faceJ = (i0, i1, j, z0, z1, col, cls = "m", t = 0.02) => sm(rbox(i1 - i0, hz(z1 - z0), t, 0), col, X((i0 + i1) / 2), hz((z0 + z1) / 2), Z(j) + t / 2, SROOT, cls);
const faceI = (i, j0, j1, z0, z1, col, cls = "m", t = 0.02) => sm(rbox(t, hz(z1 - z0), j1 - j0, 0), col, X(i) + t / 2, hz((z0 + z1) / 2), Z((j0 + j1) / 2), SROOT, cls);

function bake(root){
  root.updateMatrixWorld(true);
  const buckets = {};
  root.traverse(o => { if(!o.isMesh) return; (buckets[o.userData.cls] ||= []).push(o); });
  const out = {}, cL = new THREE.Color(), cD = new THREE.Color();
  Object.entries(buckets).forEach(([cls, list]) => {
    const parts = list.map(o => {
      let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
      g.userData = {};   // clone은 userData를 같이 써서 밤 색이 덮였음
      Object.keys(g.attributes).forEach(k => { if(k !== "position" && k !== "normal") g.deleteAttribute(k); });
      g.applyMatrix4(o.matrixWorld);
      const n = g.attributes.position.count, a = new Float32Array(n * 3), b = new Float32Array(n * 3);
      cL.set(o.userData.c[0]); cD.set(o.userData.c[1]);
      for(let k = 0; k < n; k++){ a[k*3] = cL.r; a[k*3+1] = cL.g; a[k*3+2] = cL.b; b[k*3] = cD.r; b[k*3+1] = cD.g; b[k*3+2] = cD.b; }
      g.setAttribute("color", new THREE.BufferAttribute(a, 3)); g.userData.dark = b; return g;
    });
    const merged = mergeGeometries(parts, false);
    const L = merged.attributes.color.array.slice(), Dk = new Float32Array(L.length); let off = 0;
    parts.forEach(g => { Dk.set(g.userData.dark, off); off += g.userData.dark.length; g.dispose(); });
    merged.userData = {L, D:Dk};
    out[cls] = merged;
  });
  return out;
}

/* ---------- 그림판 하나에 글씨·포스터·창밖을 모음 (그리기 1번) ---------- */
function makeAtlas(W = 2048, Hh = 2048){
  const cv = document.createElement("canvas"); cv.width = W; cv.height = Hh;
  const A = {cv, ctx:cv.getContext("2d"), W, H:Hh, x:2, y:2, row:0, items:[], tex:null}; window.__lastAtlas = A;   // 시험용
  A.alloc = (w, h) => { w = Math.ceil(w); h = Math.ceil(h);
    if(A.x + w + 2 > W){ A.x = 2; A.y += A.row + 3; A.row = 0; }
    const r = {x:A.x, y:A.y, w, h}; A.x += w + 3; A.row = Math.max(A.row, h);
    if(A.y + h > Hh) (window.__atlasOver ||= []).push(h); return r; };   // 넘치면 장면 만들 때 그림판을 늘림
  A.paint = dark => { const x = A.ctx; x.clearRect(0, 0, W, A.H);
    const fT = CanvasRenderingContext2D.prototype.fillText, sT = CanvasRenderingContext2D.prototype.strokeText;
    A.items.forEach(it => { x.save(); x.beginPath(); x.rect(it.r.x, it.r.y, it.r.w, it.r.h); x.clip(); x.translate(it.r.x, it.r.y);
      // 판보다 긴 글씨는 잘리지 않게 판 폭에 맞춰 줄임 (2026-11-26)
      const fit = f => function(t, px, py, mw){ const T = this.getTransform(); if(T.b || T.c || !(T.a > 0)) return f.call(this, t, px, py, mw);
        const lx = T.a * px + T.e - it.r.x, tw = this.measureText(t).width * T.a, al = this.textAlign, pad = 1.5, ww = it.r.w;
        const av = al === "center" ? 2 * Math.min(lx - pad, ww - pad - lx) : (al === "right" || al === "end") ? lx - pad : ww - pad - lx;
        if(tw > av + 0.5 && av > tw * 0.3){ (window.__clipT ||= []).push([String(t).slice(0, 40), +(av / tw).toFixed(2)]); mw = Math.min(mw ?? Infinity, av / T.a); }
        return mw == null || mw === Infinity ? f.call(this, t, px, py) : f.call(this, t, px, py, mw); };
      x.fillText = fit(fT); x.strokeText = fit(sT);
      it.draw(x, it.r.w, it.r.h, dark); delete x.fillText; delete x.strokeText; x.restore(); });
    if(A.tex) A.tex.needsUpdate = true; };
  return A;
}
/* 아틀라스 한 칸을 3D 판으로: axis "i" = j 고정 벽(정면 +z), "j" = i 고정 벽(정면 +x, -j쪽으로 읽힘), "f" = 바닥 */
function decal(A, wpx, hpx, draw, worldW, worldH, axis, i, j, zc){
  const r = A.alloc(wpx, hpx); A.items.push({r, draw});
  const g = new THREE.PlaneGeometry(worldW, worldH), uv = g.attributes.uv;
  for(let k = 0; k < uv.count; k++){ const u = uv.getX(k), v = uv.getY(k); uv.setXY(k, (r.x + u * r.w) / A.W, 1 - (r.y + (1 - v) * r.h) / A.H); }
  if(axis === "j") g.rotateY(Math.PI / 2); else if(axis === "-j") g.rotateY(-Math.PI / 2); else if(axis === "-i") g.rotateY(Math.PI); else if(axis === "f") g.rotateX(-Math.PI / 2);   // -j · -i = 반대쪽을 보는 글씨 (2026-11-24 동네 길 안내판)
  const p = axis === "i" ? [X(i), zc, Z(j) + 0.026] : axis === "j" ? [X(i) + 0.026, zc, Z(j)] : axis === "-j" ? [X(i) - 0.026, zc, Z(j)] : axis === "-i" ? [X(i), zc, Z(j) - 0.026] : [X(i), zc + 0.01, Z(j)];
  g.translate(...p); R.decals.push(g); return g;
}
/* 2.5D planeText 그대로 (size = 2.5D px) */
function wtext(txt, i, j, zpx, axis, size, color, glow, weight = 700, family = SIGN, o = {}){
  const k = o.k || 7, x = R.atlas.ctx; x.font = `${weight} ${size * k}px ${family}`;
  const tw = Math.ceil(x.measureText(txt).width) + (glow ? size * k * 0.8 : size * k * 0.2), th = Math.ceil(size * k * (glow ? 1.9 : 1.45));
  const col = cp(color), gl = glow ? cp(glow) : null;
  decal(R.atlas, tw, th, (c, w, h, dark) => { c.font = `${weight} ${size * k}px ${family}`; c.textAlign = o.align || "center"; c.textBaseline = "middle";
    if(gl){ c.shadowColor = gl[dark ? 1 : 0]; c.shadowBlur = size * k * 0.5; }
    c.fillStyle = col[dark ? 1 : 0]; const tx = o.align === "left" ? size * k * 0.1 : w / 2;
    c.fillText(txt, tx, h / 2 + size * k * 0.04); if(gl) c.fillText(txt, tx, h / 2 + size * k * 0.04); },
    tw / k * PX, th / k * PX, axis, o.align === "left" ? i + tw / k * PX / 2 : i, j, hz(zpx));
}

/* ---------- 바닥 한 장 (2.5D drawFloor를 위에서 본 그림으로) ---------- */
const FS = 56;
function paintFloor(cv, dark){
  const x = cv.getContext("2d"), S = FS, v = k => cp(k)[dark ? 1 : 0], dd = (l, d) => dark ? d : l;
  x.clearRect(0, 0, cv.width, cv.height);
  const rect = (i0, j0, i1, j1, c) => { x.fillStyle = c; x.fillRect(i0 * S, j0 * S, (i1 - i0) * S, (j1 - j0) * S); };
  const line = (i0, j0, i1, j1, c, w = 1) => { x.strokeStyle = c; x.lineWidth = w * S / 28; x.beginPath(); x.moveTo(i0 * S, j0 * S); x.lineTo(i1 * S, j1 * S); x.stroke(); };
  const poly = (pts, c) => { x.fillStyle = c; x.beginPath(); pts.forEach(([i,j],k) => k ? x.lineTo(i * S, j * S) : x.moveTo(i * S, j * S)); x.closePath(); x.fill(); };
  const text = (t, i, j, size, c, w = 800, fam = SIGN) => { x.font = `${w} ${size * S / 31.2}px ${fam}`; x.textAlign = "center"; x.textBaseline = "middle"; x.fillStyle = c; x.fillText(t, i * S, j * S); };
  const pool = (i, j, r, strong) => { const g = x.createRadialGradient(i * S, j * S, 0, i * S, j * S, r * S);
    g.addColorStop(0, dark ? `rgba(255,200,130,${strong ? .26 : .2})` : "rgba(255,252,240,.5)"); g.addColorStop(1, "rgba(255,240,210,0)"); x.fillStyle = g; x.beginPath(); x.arc(i * S, j * S, r * S, 0, 7); x.fill(); };
  rect(0, 0, WI, 9, v("fl-cor")); rect(0, 9, GI, GJ, v("fl-cor"));
  for(let i = 1.6; i < WI; i += 1.6) line(i, 7.0, i, 9.0, shade(v("fl-cor"), -0.05));
  for(let j = 1.6; j < GJ; j += 1.6) line(12.0, j, 13.2, j, shade(v("fl-cor"), -0.05));
  // 크레용팜 원목 마루
  rect(0, 0, 12, 7, v("fl-farm"));
  for(let j = 0.4; j < 7; j += 0.4) line(0, j, 12, j, shade(v("fl-farm"), -0.06), 0.8);
  for(let j = 0, k = 0; j < 7; j += 0.4, k++) for(let i = (k % 3) * 1.1 + 0.6; i < 11.9; i += 3.3) line(i, j, i, j + 0.4, shade(v("fl-farm"), -0.06), 0.8);
  // 크레용팜 리뷰 세트: 웜그레이 바닥 · 테이블 러그 · 바닥 테이프 (2.5D와 같은 자리)
  rect(13.2, 0, 24, 7, dd("#E4DCD0", "#3A352F"));
  for(let i = 14.8; i < 24; i += 1.6) line(i, 0, i, 7, dd("rgba(0,0,0,.05)", "rgba(255,255,255,.04)"));
  rect(14.6, 1.6, 18.8, 4.2, dd("#E9C79A", "#4A3A26"));
  [[16.0,5.2],[16.9,5.2]].forEach(([i,j]) => { line(i - 0.18, j, i + 0.18, j, "#E8A04A", 2.4); line(i, j - 0.18, i, j + 0.18, "#E8A04A", 2.4); });
  // 프로덕션 콘크리트
  rect(0, 9, 12, GJ, v("fl-prod"));
  for(let i = 2; i < 12; i += 2) line(i, 9, i, GJ, shade(v("fl-prod"), -0.07));
  for(let j = 11; j < GJ; j += 2) line(0, j, 12, j, shade(v("fl-prod"), -0.07));
  rect(1.3, 16.9, 4.1, 19.3, sh("c-prod", dark ? -0.62 : 0.7)[dark ? 1 : 0]);   // 콘티 테이블 러그
  // 로비 테라조
  rect(12, 9, 17, GJ, dd("#EFEAE2", "#2F2C28"));
  for(let i = 12.6; i < 17; i += 1.1) line(i, 9, i, GJ, dd("rgba(0,0,0,.045)", "rgba(255,255,255,.04)"));
  for(let j = 10.1; j < GJ; j += 1.1) line(12, j, 17, j, dd("rgba(0,0,0,.045)", "rgba(255,255,255,.04)"));
  for(let k = 0; k < 260; k++){ const i = 12 + ((k * 7.31) % 5), j = 9 + ((k * 3.97) % 11); x.fillStyle = dd(k % 2 ? "rgba(140,120,100,.18)" : "rgba(255,255,255,.7)", "rgba(255,255,255,.05)"); x.fillRect(i * S, j * S, 2, 2); }
  rect(13.9, 19.05, 16.1, 19.95, dd("#5A4A3E", "#3A342E"));
  text("WELCOME", 15.0, 19.5, 8, dd("rgba(255,245,230,.8)", "rgba(255,240,220,.35)"));
  // 옛 필름스쿨 자리: 로비 테라조가 이어짐 (머신룸 · 로비 옆), 색보정실은 아래에서 어두운 카펫
  rect(17, 9, 24, GJ, dd("#EFEAE2", "#2F2C28"));
  for(let i = 17.6; i < 24; i += 1.1) line(i, 9, i, 12, dd("rgba(0,0,0,.045)", "rgba(255,255,255,.04)"));
  for(let j = 10.1; j < GJ; j += 1.1) line(17, j, j < 12 ? 24 : 18.6, j, dd("rgba(0,0,0,.045)", "rgba(255,255,255,.04)"));
  for(let j = 1.6; j < GJ; j += 1.6) line(24.0, j, 25.0, j, shade(v("fl-cor"), -0.05));
  // 탕비실 체크 타일
  rect(25, 0, GI, 7, dd("#F4ECDF", "#3B342C"));
  for(let i = 25; i < GI; i += 0.5) for(let j = 0; j < 7; j += 0.5) if(Math.round((i - 25) * 2 + j * 2) % 2 === 1) rect(i, j, i + 0.5, j + 0.5, dd("#E9DDCA", "#352F28"));
  // 수면실
  rect(25, 9, GI, 14.6, dd("#D3D8E6", "#252836")); rect(25.1, 9.5, 28.95, 12.4, dd("#C3CADD", "#2E3244"));
  text("쉿… 낮잠 중", 27.2, 13.55, 10, dd("rgba(70,80,120,.22)", "rgba(200,210,255,.18)"), 700, FONT);
  // 화장실
  rect(25, 14.6, GI, GJ, dd("#EEF2F3", "#2A2F33"));
  for(let i = 25.5; i < GI; i += 0.5) line(i, 14.6, i, GJ, dd("rgba(60,90,100,.08)", "rgba(255,255,255,.04)"));
  for(let j = 15.1; j < GJ; j += 0.5) line(25, j, GI, j, dd("rgba(60,90,100,.08)", "rgba(255,255,255,.04)"));
  // 러그
  rect(25.85, 2.8, 27.4, 4.9, dd("#E2C9A6", "#4A3B2E"));
  rect(10.3, 0, 11.8, 1.4, sh("c-farm", dark ? -0.55 : 0.62)[dark ? 1 : 0]);
  rect(6.5, 9.9, 10.1, 12.3, sh("c-prod", dark ? -0.6 : 0.74)[dark ? 1 : 0]);
  rect(7.75, 3.05, 10.1, 6.0, sh("c-farm", dark ? -0.6 : 0.6)[dark ? 1 : 0]);
  poly(islandPts3(0.95), sh("c-farm", dark ? -0.62 : 0.66)[dark ? 1 : 0]);   // 섬 테이블 러그
  // 색보정실: 어두운 카펫 + 러그 + 모니터 빛 + 스탠드 조명
  { const [a,b,c,d] = CS; rect(a, b, c, d, dd("#2B2D33", "#141519")); for(let j = b + 0.5; j < d; j += 0.5) line(a, j, c, j, "rgba(255,255,255,.025)");
    rect(19.4, 13.5, 22.8, 16.6, dd("#363941", "#1F2127"));
    const g = x.createRadialGradient(21.0 * S, 13.4 * S, 0, 21.0 * S, 13.4 * S, 2.3 * S); g.addColorStop(0, "rgba(170,195,255,.16)"); g.addColorStop(1, "rgba(170,195,255,0)"); x.fillStyle = g; x.fillRect(a * S, b * S, (c - a) * S, (d - b) * S);
    pool(23.0, 18.3, 1.0); }
  // 창문 빛
  [[4.4,6.9],[7.6,10.1]].forEach(([a,b]) => poly([[a,0.05],[b,0.05],[b+0.9,2.4],[a+0.9,2.4]], dark ? "rgba(150,180,255,.05)" : "rgba(255,255,255,.34)"));
  // 대표실 월넛 마루 + 러그
  { const fl = dd("#8C6748", "#3A2A1F"), ln = shade(fl, -0.12);
    rect(GI, 0, WI, 7, fl); rect(GI, 7, WI, 9, v("fl-cor"));
    for(let j = 0.35; j < 7; j += 0.35) line(GI, j, WI, j, ln, 0.8);
    for(let j = 0, k = 0; j < 7; j += 0.35, k++) for(let i = GI + (k % 4) * 0.7 + 0.4; i < WI; i += 2.8) line(i, j, i, j + 0.35, ln, 0.8);
    rect(31.0, 1.6, 35.1, 4.6, sh("c-prod", dark ? -0.62 : 0.6)[dark ? 1 : 0]); rect(31.2, 1.8, 34.9, 4.4, sh("c-prod", dark ? -0.55 : 0.5)[dark ? 1 : 0]);
    rect(33.8, 4.3, 35.95, 6.7, dd("#EFE6D6", "#4A4338"));
    poly([[29.3,0.05],[30.9,0.05],[31.8,2.4],[30.2,2.4]], dark ? "rgba(150,180,255,.05)" : "rgba(255,248,235,.28)"); }
  for(let i = 1.6; i < WI; i += 1.6) if(i > GI) line(i, 7.0, i, 9.0, shade(v("fl-cor"), -0.05));
  // 바닥 글씨
  if(!(R && R.only)) text("CREYONG", 12.6, 8.0, 24, dd("rgba(42,42,40,.07)", "rgba(255,255,255,.06)"));
  // 조명 아래 빛 웅덩이
  LAMPS_BAR.forEach(([a,b,c,d]) => pool((a + c) / 2, (b + d) / 2, 1.7 + Math.hypot(c - a, d - b) * 0.35));
  LAMPS_DOME.forEach(([i,j]) => pool(i, j, 1.3));
  pool(28.75, 13.6, 0.95, true);
  return cv;
}

function paintAnyFloor(dark){
  if(!R.F){ paintFloor(R.flCv, dark); return; }
  const c = R.flCv.getContext("2d"), [a, b] = R.ext; c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, R.flCv.width, R.flCv.height);
  c.setTransform(FS, 0, 0, FS, -a * FS, -b * FS); R.F.paintFloor?.(c, dark, KIT); c.setTransform(1, 0, 0, 1, 0, 0);
}
/* 층 정의에 넘기는 도구 상자 */
const KIT = {
  THREE, X, Z, hz, PX, WALL_H, FS, V3:(i, y, j) => new THREE.Vector3(X(i), y, Z(j)),
  B, sm:(g, col, x, y, z, parent, cls) => sm(g, col, x, y, z, parent || SROOT, cls), rbox, cyl, sph, cap, faceI, faceJ, wtext,
  decal:(wpx, hpx, draw, ww, wh, axis, i, j, zc) => decal(R.atlas, wpx, hpx, draw, ww, wh, axis, i, j, zc),
  plant, floorCloud, softbox, camRig, shade, sh, cp, D2, T, RAINBOW, FONT, SIGN, ST_COLOR,
  pose, place, say, walk, turnTo, select, clock:() => clock(), reduce, coarse,
  get R(){ return R; }, get root(){ return SROOT; },
  screen(s){ R.screens.push(s); },
  // 3F (복지층): 사람에 소품 붙이기 (init에서, 인스턴싱 전에) · 벽 잘림 조건을 움직이는 물건에도
  part(o, g, c, vis){ PARTS.push({o, g, c, cls:"p", vis:vis || (() => true)}); return o; },
  cutaway:m => cutaway(m),
  catRig:meat => catRig(meat), catPose:(c, x, g, z, now, t, dt) => catPose(c, x, g, z, now, t, dt),   // 걷는 고양이 (3층 크레파스도 같이, 2026-11-26)
  yuNear:(i, j, r) => !!(PL.on && R && R.pl && Math.hypot(PL.i - i, PL.j - j) < r),   // 유나가 가까이 오면 자동문 열기 (2026-11-23)
  yuAt:() => (PL.on && R && R.pl) ? [PL.i, PL.j, (PL.act?.lift || 0) + (PL.gy || 0)] : null,   // 유나 자리 (빛 번짐이 유나를 덮지 않게, 2026-11-24)
};

/* ---------- 장면 ---------- */
function build(host, opts){
  const renderer = new THREE.WebGLRenderer({antialias:true, alpha:true, powerPreference:coarse ? "low-power" : "high-performance"});
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
  const camera = new THREE.PerspectiveCamera(22, 1, 1, 400);
  R = {renderer, scene, camera, layer, decals:[], screens:[], people:{}, host, opts, envTex};
  R.atlas = makeAtlas(); R.only = opts.only === "farm"; R.F = opts.floor || null;
  const EXT = R.F ? R.F.ext : [0, 0, WI, GJ]; R.ext = EXT;

  /* 빛 */
  const hemi = new THREE.HemisphereLight(0xFFF6F0, 0xC9B7C4, 0.4); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xFFF1E2, 1.3);
  sun.position.set(9, 24, 15); sun.castShadow = true;
  sun.shadow.mapSize.set(coarse ? 2048 : 4096, coarse ? 2048 : 4096);
  Object.assign(sun.shadow.camera, {left:-24, right:24, top:18, bottom:-18, near:2, far:70});
  sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.03; sun.shadow.radius = 2.5;
  sun.target.position.set(0, 0, 0); scene.add(sun, sun.target);
  const lampL = (R.F ? (R.F.lamps || []).map(([i, j, y]) => [X(i), y ?? 3.0, Z(j)]) : [[X(18.6), 3.0, Z(CJ)], [X(6.0), 3.0, Z(CJ)], [X(33), 2.9, Z(3.4)], [X(14.5), 3.0, Z(15.0)], [X(5.6), 3.0, Z(3.3)]]).map(p => { const l = new THREE.PointLight(0xFFD9A0, 0, 11, 1.4); l.position.set(...p); scene.add(l); return l; });
  const glowL = new THREE.PointLight(R.F?.glow?.color ?? 0xFF9CC8, 0, 9, 1.6); if(R.F) glowL.position.set(...(R.F.glow ? [X(R.F.glow.at[0]), R.F.glow.at[2] ?? 1.6, Z(R.F.glow.at[1])] : [0, -50, 0])); else glowL.position.set(X(17.4), 1.6, Z(0) + 1.2); scene.add(glowL);
  Object.assign(R, {hemi, sun, lampL, glowL});

  /* 받침 그림자 */
  const shc = document.createElement("canvas"); shc.width = shc.height = 256;
  { const x = shc.getContext("2d"), g = x.createRadialGradient(128, 128, 30, 128, 128, 128); g.addColorStop(0, "rgba(50,35,30,.36)"); g.addColorStop(1, "rgba(50,35,30,0)"); x.fillStyle = g; x.fillRect(0, 0, 256, 256); }
  const shT = new THREE.CanvasTexture(shc);
  const drop = new THREE.Mesh(new THREE.PlaneGeometry(52, 34), new THREE.MeshBasicMaterial({map:shT, transparent:true, depthWrite:false}));
  drop.rotation.x = -Math.PI / 2; drop.position.set(X(18) + 0.6, -0.9, Z(10) + 1.2); scene.add(drop);
  if(R.only){ drop.scale.set(0.36, 0.42, 1); drop.position.set(X(6.3) + 0.4, -0.9, Z(4.5) + 0.8); }
  if(R.F){ const [a,b,c,d] = EXT; drop.scale.set((c - a) / 36 * 1.05, (d - b) / 20 * 1.05, 1); drop.position.set(X((a + c) / 2) + 0.6, -0.9, Z((b + d) / 2) + 1.2); }

  /* 바닥 한 장 */
  const outline = R.F ? R.F.outline : R.only ? [[0,0],[FARM_EXT[0],0],FARM_EXT,[0,FARM_EXT[1]]] : [[0,0],[WI,0],[WI,9],[GI,9],[GI,GJ],[0,GJ]];
  const shape = new THREE.Shape(outline.map(([i,j]) => new THREE.Vector2(X(i), -Z(j))));
  const floorG = new THREE.ShapeGeometry(shape); floorG.rotateX(-Math.PI / 2);
  { const p = floorG.attributes.position, uv = floorG.attributes.uv; for(let k = 0; k < p.count; k++) uv.setXY(k, (p.getX(k) + OX - EXT[0]) / (EXT[2] - EXT[0]), 1 - (p.getZ(k) + OZ - EXT[1]) / (EXT[3] - EXT[1])); }
  const flCv = document.createElement("canvas"); flCv.width = Math.round((EXT[2] - EXT[0]) * FS); flCv.height = Math.round((EXT[3] - EXT[1]) * FS);
  const flTex = new THREE.CanvasTexture(flCv); flTex.colorSpace = THREE.SRGBColorSpace; flTex.anisotropy = 8;
  const floor = new THREE.Mesh(floorG, new THREE.MeshStandardMaterial({map:flTex, roughness:0.82})); floor.receiveShadow = true; scene.add(floor);
  Object.assign(R, {flCv, flTex, floor});

  SROOT = new THREE.Group();
  if(R.F) R.F.build(KIT);
  else {
  if(R.only){ buildShellFarm(); buildFarm(); [...ROSTER, ...SPARE].filter(r => r.zone === "farm").forEach(r => deskUnit(r)); }
  else { buildShell(); buildFarm(); buildProd(); buildStudio(); buildLobby(); buildColor(); buildLounge(); buildCeo(); [...ROSTER, ...SPARE].forEach(r => deskUnit(r)); }
  PLANTS.filter(([i,j]) => !R.only || inFarm(i, j)).forEach(([i,j,t]) => plant(i, j, t));
  buildLamps(R.only ? inFarm : () => true); }

  R.boxes = playBoxes(SROOT); R.outline = outline; R.walk = R.F?.walk || null;   // walk = 유나가 걸을 수 있는 테두리 (울타리 안쪽, 2026-11-26 감독님 "밖에있으면 어떡해")   // 유나 모드 벽·가구 막기
  /* 합치기 */
  const baked = bake(SROOT); SROOT = null;
  const MAT = {
    m: new THREE.MeshStandardMaterial({vertexColors:true, roughness:0.8}),
    s: new THREE.MeshStandardMaterial({vertexColors:true, roughness:0.38, metalness:0.05}),
    glass: new THREE.MeshStandardMaterial({vertexColors:true, roughness:0.08, transparent:true, opacity:0.26, depthWrite:false}),
    glow: new THREE.MeshBasicMaterial({vertexColors:true, toneMapped:false}),
  };
  Object.values(MAT).forEach(cutaway);
  R.baked = Object.entries(baked).map(([cls, g]) => { const m = new THREE.Mesh(g, MAT[cls]); m.castShadow = cls === "m" || cls === "s"; m.receiveShadow = cls !== "glow"; if(cls === "glass") m.renderOrder = 2; scene.add(m); return m; });
  R.MAT = MAT;

  /* 글씨·그림 한 장 */
  { const A = R.atlas, need = A.y + A.row + 4;   // 그림판이 모자라면 아래로 늘리고 글씨 자리(uv)를 다시 맞춤 (2층 간판 깨짐, 2026-11-26)
    if(need > A.H){ const H0 = A.H, H1 = Math.min(8192, Math.ceil(need / 256) * 256); A.cv.height = H1; A.H = H1;
      R.decals.forEach(g => { const uv = g.attributes.uv; for(let k = 0; k < uv.count; k++) uv.setY(k, 1 - (1 - uv.getY(k)) * H0 / H1); uv.needsUpdate = true; }); } }
  const atT = new THREE.CanvasTexture(R.atlas.cv); atT.colorSpace = THREE.SRGBColorSpace; atT.anisotropy = 8; R.atlas.tex = atT;
  const dg = mergeGeometries(R.decals, false); R.decals.forEach(g => g.dispose());
  const decMesh = new THREE.Mesh(dg, cutaway(new THREE.MeshBasicMaterial({map:atT, transparent:true, depthWrite:false, toneMapped:false, polygonOffset:true, polygonOffsetFactor:-2})));
  decMesh.renderOrder = 1; scene.add(decMesh); R.decMesh = decMesh;

  /* 쇼릴 화면 (5.2초마다 장면이 바뀜) */
  if(!R.only && !R.F){
  const reelCv = document.createElement("canvas"); reelCv.width = 256; reelCv.height = 128;
  const reelT = new THREE.CanvasTexture(reelCv); reelT.colorSpace = THREE.SRGBColorSpace;
  const reel = new THREE.Mesh(new THREE.PlaneGeometry(2.1, hz(40)), cutaway(new THREE.MeshBasicMaterial({map:reelT, toneMapped:false})));
  reel.rotation.y = Math.PI / 2; reel.position.set(X(0) + 0.035, hz(52), Z(10.55)); scene.add(reel);
  R.reel = {cv:reelCv, tex:reelT, last:-1}; }

  /* 모니터 화면 (인스턴싱 1번) */
  const scr = R.screens;
  const im = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({toneMapped:false}), Math.max(1, scr.length));
  if(!scr.length){ im.setMatrixAt(0, new THREE.Matrix4().makeScale(0, 0, 0)); im.setColorAt(0, new THREE.Color(0)); }
  const m4 = new THREE.Matrix4(), qn = new THREE.Quaternion(), e = new THREE.Euler();
  scr.forEach((s, k) => { e.set(s.rx || 0, s.ry || 0, 0); qn.setFromEuler(e); m4.compose(new THREE.Vector3(...s.p), qn, new THREE.Vector3(s.w, s.h, 1)); im.setMatrixAt(k, m4); im.setColorAt(k, new THREE.Color(0x3A3F47)); });
  im.frustumCulled = false; scene.add(im); R.scrIM = im;
  return R;
}

/* 건물 껍데기: 뒷벽 2면(높게) + 앞쪽은 낮은 턱 (2.5D처럼 안이 보이게) */
function buildShell(){
  const WH = 112, t = 0.25;
  // 바닥판 두께 (앞쪽 테두리)
  const slabH = 12;
  B(0, GJ, GI, 0.02, slabH, "slab", -slabH, {r:0}); B(GI, 9, 0.02, GJ - 9, slabH, sh("slab", -0.14), -slabH, {r:0});
  B(GI, 9, WI - GI, 0.02, slabH, "slab", -slabH, {r:0}); B(WI, 0, 0.02, 9, slabH, sh("slab", -0.14), -slabH, {r:0});
  sm(rbox(WI + 0.25, hz(slabH), 9.25, 0), "slab", X(WI / 2 - 0.125), -hz(slabH) / 2 - 0.002, Z(4.5 - 0.125));
  sm(rbox(GI + 0.25, hz(slabH), GJ - 9, 0), "slab", X(GI / 2 - 0.125), -hz(slabH) / 2 - 0.002, Z((9 + GJ) / 2));
  // 뒤쪽 오른 벽 (j=0)
  const back = [[0,13.2,"wall-r"],[13.2,24,D2("#3A342E","#25211D")],[24,GI,"wall-r"],[GI,WI,D2("#EDE6DB","#302C28")]];
  back.forEach(([a,b,c]) => B(a, -t, b - a, t, WH, c, 0, {r:0}));
  // 뒤쪽 왼 벽 (i=0)
  [[0,7,"wall-l"],[7,9,sh("wall-l",-0.03)],[9,GJ,"wall-prod"]].forEach(([a,b,c]) => B(-t, a, t, b - a, WH, c, 0, {r:0}));
  B(-t, -t, t, t, WH, "wall-r", 0, {r:0});
  // 벽 윗면 띠 · 걸레받이
  B(-t - 0.02, -t - 0.02, WI + t + 0.02, t + 0.04, 3, "wall-top", WH, {r:0});
  B(-t - 0.02, -t, t + 0.04, GJ + t, 3, "wall-top", WH, {r:0});
  faceJ(0, WI, 0.0, 0, 4, sh("wall-top", -0.1), "m", 0.03); faceI(0.0, 0, GJ, 0, 4, sh("wall-top", -0.1), "m", 0.03);
  // 앞쪽 낮은 턱
  const lip = 7, lc = sh("wall-top", 0.1);
  B(0, GJ - 0.12, GI, 0.12, lip, lc, 0, {r:0.02}); B(GI - 0.12, 9, 0.12, GJ - 9, lip, lc, 0, {r:0.02});
  B(GI, 9 - 0.12, WI - GI, 0.12, lip, lc, 0, {r:0.02}); B(WI - 0.12, 0, 0.12, 9, lip, lc, 0, {r:0.02});
  // 창문 (크레용팜 2개 · 대표실 1개): 창틀 + 창밖 그림
  const win = (a, b, z0, z1, kind) => {
    const w = (b - a) * 220, h = (z1 - z0) / 31.1 * 220;
    decal(R.atlas, w, h, (c, W, H, dark) => drawWindow(c, W, H, dark, kind), b - a, hz(z1 - z0), "i", (a + b) / 2, 0.0, hz((z0 + z1) / 2));
    B(a - 0.04, 0, b - a + 0.08, 0.06, 3, "frame", z1, {r:0}); B(a - 0.04, 0, b - a + 0.08, 0.06, 3, "frame", z0 - 3, {r:0});
    B(a - 0.04, 0, 0.06, 0.06, z1 - z0, "frame", z0, {r:0}); B(b - 0.02, 0, 0.06, 0.06, z1 - z0, "frame", z0, {r:0});
    B((a + b) / 2 - 0.025, 0, 0.05, 0.05, z1 - z0, "frame", z0, {r:0}); B(a, 0, b - a, 0.05, 2, "frame", z0 + (z1 - z0) * 0.68, {r:0});
    B(a - 0.08, 0, b - a + 0.16, 0.16, 3, sh("wall-top", -0.05), z0 - 3, {r:0});
  };
  win(4.4, 6.9, 26, 96, "city"); win(7.6, 10.1, 26, 96, "city"); win(29.3, 30.9, 24, 96, "sunset");
}
function buildShellFarm(){
  const WH = 112, t = 0.25, [I1, J1] = FARM_EXT, slabH = 12;
  B(0, J1, I1, 0.02, slabH, "slab", -slabH, {r:0}); B(I1, 0, 0.02, J1, slabH, sh("slab", -0.14), -slabH, {r:0});
  sm(rbox(I1 + 0.25, hz(slabH), J1 + 0.25, 0), "slab", X(I1 / 2 - 0.125), -hz(slabH) / 2 - 0.002, Z(J1 / 2 - 0.125));
  B(0, -t, I1, t, WH, "wall-r", 0, {r:0});
  [[0,7,"wall-l"],[7,J1,sh("wall-l",-0.03)]].forEach(([a,b,c]) => B(-t, a, t, b - a, WH, c, 0, {r:0}));
  B(-t, -t, t, t, WH, "wall-r", 0, {r:0});
  B(-t - 0.02, -t - 0.02, I1 + t + 0.02, t + 0.04, 3, "wall-top", WH, {r:0}); B(-t - 0.02, -t, t + 0.04, J1 + t, 3, "wall-top", WH, {r:0});
  // 잘린 벽 단면 (디오라마 끝)
  B(I1 - 0.02, -t, 0.02, t, WH, sh("wall-top", -0.08), 0, {r:0}); B(-t, J1 - 0.02, t, 0.02, WH, sh("wall-top", -0.08), 0, {r:0});
  faceJ(0, I1, 0.0, 0, 4, sh("wall-top", -0.1), "m", 0.03); faceI(0.0, 0, J1, 0, 4, sh("wall-top", -0.1), "m", 0.03);
  const lc = sh("wall-top", 0.1); B(0, J1 - 0.12, I1, 0.12, 7, lc, 0, {r:0.02}); B(I1 - 0.12, 0, 0.12, J1, 7, lc, 0, {r:0.02});
  const win = (a, b, z0, z1) => {
    decal(R.atlas, (b - a) * 220, (z1 - z0) / 31.1 * 220, (c, W, H, dark) => drawWindow(c, W, H, dark, "city"), b - a, hz(z1 - z0), "i", (a + b) / 2, 0.0, hz((z0 + z1) / 2));
    B(a - 0.04, 0, b - a + 0.08, 0.06, 3, "frame", z1, {r:0}); B(a - 0.04, 0, b - a + 0.08, 0.06, 3, "frame", z0 - 3, {r:0});
    B(a - 0.04, 0, 0.06, 0.06, z1 - z0, "frame", z0, {r:0}); B(b - 0.02, 0, 0.06, 0.06, z1 - z0, "frame", z0, {r:0});
    B((a + b) / 2 - 0.025, 0, 0.05, 0.05, z1 - z0, "frame", z0, {r:0}); B(a, 0, b - a, 0.05, 2, "frame", z0 + (z1 - z0) * 0.68, {r:0});
    B(a - 0.08, 0, b - a + 0.16, 0.16, 3, sh("wall-top", -0.05), z0 - 3, {r:0}); };
  win(4.4, 6.9, 26, 96); win(7.6, 10.1, 26, 96);
}
function drawWindow(c, W, H, dark, kind){
  const g = c.createLinearGradient(0, 0, 0, H);
  if(kind === "sunset"){ g.addColorStop(0, dark ? "#1B2438" : "#9FC3E3"); g.addColorStop(0.65, dark ? "#3A3550" : "#F5D2B5"); g.addColorStop(1, dark ? "#4A3A48" : "#F9E7D3"); }
  else { g.addColorStop(0, dark ? "#16243A" : "#BFDDEE"); g.addColorStop(1, dark ? "#2C4462" : "#EAF4F7"); }
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  if(dark){ c.fillStyle = "rgba(255,255,255,.7)"; for(let k = 0; k < 14; k++) c.fillRect((k * 37) % W, (k * 23) % (H * 0.4), 1.5, 1.5); }
  const bw = W / 7; c.fillStyle = dark ? "#22344C" : "#CFE2EA";
  [0.62,0.4,0.7,0.3,0.55,0.75,0.45].forEach((h, k) => { const bx = k * bw * 1.02, by = H * (1 - h * (kind === "sunset" ? 0.35 : 0.62));
    c.fillStyle = kind === "sunset" ? (dark ? "#1E2230" : "#B9A9B5") : (dark ? "#22344C" : "#CFE2EA"); c.fillRect(bx, by, bw * 0.86, H - by);
    if(dark) for(let y = by + 8; y < H - 6; y += 13) for(let xx = bx + 6; xx < bx + bw * 0.8; xx += 12) if((xx * 7 + y * 3) % 5 < 2){ c.fillStyle = "#F7D48A"; c.fillRect(xx, y, 4, 5); } });
  const sh2 = c.createLinearGradient(0, 0, W, H); sh2.addColorStop(0, "rgba(255,255,255,.22)"); sh2.addColorStop(0.4, "rgba(255,255,255,0)"); c.fillStyle = sh2; c.fillRect(0, 0, W, H);
}

/* 책상 한 벌 (2.5D deskUnit 그대로) */
function deskUnit(r){
  const [di,dj,dw,dd] = r.desk, seat = [di + dw / 2, dj + dd + 0.45];
  const top = r.zone === "prod" ? "#2E2C2A" : r.zone === "school" ? "wood" : "desk";
  const chair = {hq:"#3B3B3E", farm:"#3B3B3E", prod:"#1E1E1F", studio:sh("c-lilac",-0.15), school:sh("c-school",-0.1)}[r.zone];
  if(r.noDesk) return;   // 색보정실 컬러리스트는 buildColor에서 (가죽 의자)
  if(r.island || r.bar || r.cart || r.draft || r.village){ deskSpecial3(r); return; }
  if(r.zone === "farm") B(di - 0.05, dj - 0.1, dw + 0.1, 0.08, 30, "felt", 10, {r:0.02});
  [[di+0.05,dj+0.05],[di+dw-0.13,dj+0.05],[di+0.05,dj+dd-0.13],[di+dw-0.13,dj+dd-0.13]].forEach(([a,b]) => B(a, b, 0.06, 0.06, 15, "metal", 0, {cls:"s"}));
  B(di, dj, dw, dd, 3, top, 15, {r:0.03});
  const mons = ["edit","design","pedit","color","taling"].includes(r.id) ? [di + 0.2, di + 1.3] : [di + dw / 2 - 0.45];
  mons.forEach(mi => {
    B(mi + 0.4, dj + 0.12, 0.1, 0.1, 17, "metal", 18, {cls:"s"}); B(mi + 0.29, dj + 0.06, 0.32, 0.3, 1, "metal", 18, {cls:"s"});   // 거치대는 화면 뒤에 붙임
    B(mi, dj + 0.22, 0.9, 0.07, 21, "#2A2B2E", 27, {cls:"s", r:0.02});
    R.screens.push({id:r.id, p:[X(mi + 0.45), hz(37.5), Z(dj + 0.293)], w:0.82, h:hz(18.5)});
  });
  if(r.id === "edit" || r.id === "color"){ const pi = di + dw / 2 - 0.28; B(pi, dj + 0.6, 0.55, 0.24, 2, "#222", 18); [0.15,0.3,0.45].forEach((o, k) => sm(cyl(0.05, 0.05, 0.03, 12), r.id === "color" ? ["#C9504A","#5FAE6A","#4F7FC9"][k] : "#555", X(pi + o), hz(20.5), Z(dj + 0.72), SROOT, "s")); }
  else if(r.id === "writer"){ B(di + 0.2, dj + 0.45, 0.34, 0.4, 2.5, "#FFFFFF", 18); B(di + 0.6, dj + 0.6, 0.3, 0.04, 1, "#E06A55", 18); }
  else B(di + dw / 2 - 0.3, dj + dd - 0.32, 0.6, 0.16, 1, D2("#E4E0D8", "#777777"), 18, {r:0.01});
  if(r.id === "graphic" || r.id === "design") B(di + dw - 0.55, dj + 0.5, 0.38, 0.28, 1.5, "metal", 18, {cls:"s"});
  if(r.id === "plan" || r.id === "deal") B(di + dw - 0.5, dj + 0.48, 0.3, 0.24, 1.5, "#FFE58A", 18);
  if(r.id === "sales" || r.id === "promo"){ const fc = r.zone === "prod" ? "c-prod" : "c-studio"; B(di + dw - 0.5, dj + 0.42, 0.34, 0.26, 1, "#FFFFFF", 18); B(di + dw - 0.48, dj + 0.44, 0.3, 0.22, 1, fc, 19); }
  if(r.id === "studio") B(di + 0.2, dj + 0.45, 0.3, 0.3, 10, sh("c-studio", -0.1), 18, {r:0.05});
  if(r.id === "class") B(di + 0.25, dj + 0.4, 0.45, 0.32, 3, "c-school", 18);
  if(r.id === "admin"){ B(di + 0.15, dj + 0.45, 0.3, 0.22, 4, "#FFFFFF", 18); }
  // 의자 (사람은 책상 앞 +j에 앉아 모니터를 봄)
  const [si, sj] = seat;
  B(si - 0.04, sj - 0.04, 0.08, 0.08, 11, "metal", 0, {cls:"s"}); B(si - 0.25, sj - 0.25, 0.5, 0.5, 1.2, "metal", 0, {cls:"s", r:0});
  B(si - 0.28, sj - 0.22, 0.56, 0.46, 3, chair, 11, {r:0.06});
  B(si - 0.28, sj + 0.2, 0.56, 0.08, 22, sh(chair, 0.08), 12, {r:0.04});
}
/* 2026-11-23 감독님 "책상 배치 좀 더 크리에이티브하게" A+B안 (2.5D deskSpecial과 같은 자리·같은 숫자)
   A: 크레용팜 둥근 섬 테이블 + 가운데 나무 + 창가 바 / B: 제작 카트(슬레이트) · 드로잉 테이블 · 비디오 빌리지 */
function seatG(si, sj, h){ const g = new THREE.Group(); g.position.set(X(si), 0, Z(sj)); g.rotation.y = h; SROOT.add(g); return g; }
// 사람 기준 좌표: lx = 옆, lz = 앞 (사람은 +lz를 봄)
const LB = (g, lx, lz, w, d, hpx, col, z0 = 0, o = {}) => { const H = Math.max(0.004, hz(hpx)); return sm(rbox(w, H, d, o.r ?? 0.03), col, lx, hz(z0) + H / 2, lz, g, o.cls || "m"); };
const locIJ = (si, sj, h, lx, lz) => [si + lx * Math.cos(h) + lz * Math.sin(h), sj - lx * Math.sin(h) + lz * Math.cos(h)];
// 화면: 사람 쪽을 보게 (back이면 반대쪽 = 노트북 뚜껑 뒤 로고)
function scr3(id, si, sj, h, lx, lz, ypx, w, hpx, back){ const [i, j] = locIJ(si, sj, h, lx, lz); R.screens.push({id, p:[X(i), hz(ypx), Z(j)], w, h:hz(hpx), ry:h + (back ? 0 : Math.PI)}); }
function chair3(r, g){ const col = r.zone === "prod" ? "#1E1E1F" : "#3B3B3E";
  LB(g, 0, 0, 0.08, 0.08, 11, "metal", 0, {cls:"s", r:0}); LB(g, 0, 0, 0.5, 0.5, 1.2, "metal", 0, {cls:"s", r:0});
  LB(g, 0, 0, 0.56, 0.46, 3, col, 11, {r:0.06}); LB(g, 0, -0.24, 0.56, 0.08, 22, sh(col, 0.08), 12, {r:0.04}); }
function deskSpecial3(r){
  const [di, dj, dw, dd] = r.desk, [si, sj] = seatOf(r), h = deskHead(r), g = seatG(si, sj, h);
  if(r.island){
    chair3(r, g);
    if(r.dir === "-j"){   // 모니터 (화면이 보임)
      (r.id === "edit" ? [-0.38, 0.38] : [0]).forEach(lx => { LB(g, lx, 0.8, 0.08, 0.08, 9, "metal", 18, {cls:"s", r:0}); LB(g, lx, 0.87, 0.7, 0.06, 18, "#2A2B2E", 27, {cls:"s", r:0.02}); scr3(r.id, si, sj, h, lx, 0.835, 36, 0.64, 16); });
      LB(g, 0, 0.55, 0.6, 0.15, 1, D2("#E4E0D8", "#777777"), 18, {r:0.01});
      if(r.id === "short"){ LB(g, -0.5, 0.58, 0.14, 0.24, 1, "#1E1E1E", 18, {r:0.01}); scr3("short", si, sj, h, -0.5, 0.58, 19.2, 0.1, 0.6, false); }
      if(r.id === "edit") LB(g, 0.8, 0.52, 0.34, 0.2, 1.6, "#222", 18, {r:0.01});
    } else {   // 노트북: 뚜껑 뒤 로고가 상태 색
      const lid = D2("#C9C5BD", "#9A968F");
      LB(g, 0, 0.78, 0.52, 0.36, 0.8, sh(lid, -0.06), 18, {r:0.01});
      const L = LB(g, 0, 0.97, 0.52, 0.02, 10.4, lid, 18.6, {r:0}); L.rotation.x = 0.18;
      scr3(r.id, si, sj, h, 0, 1.012, 24.2, 0.09, 3, true);
      if(r.id === "plan"){ LB(g, -0.5, 0.8, 0.3, 0.38, 1.4, "#FFFFFF", 18, {r:0.01}); LB(g, 0.5, 0.75, 0.22, 0.2, 1, "#FFE58A", 18, {r:0}); }
      if(r.id === "graphic") LB(g, -0.52, 0.78, 0.34, 0.26, 1, "metal", 18, {cls:"s", r:0.01});
    }
    return; }
  if(r.bar){   // 창가 바: 원목 카운터 + 스툴 둘 + 노트북 + 화분
    const tw = D2("#C99A66", "#6B4A34");
    [di + 0.2, di + dw - 0.3].forEach(i => B(i, dj + 0.05, 0.1, 0.3, 15, "metal", 0, {cls:"s", r:0}));
    B(di, dj, dw, dd, 3, tw, 15, {r:0.03});
    B(si - 0.24, dj + 0.08, 0.48, 0.3, 0.8, D2("#C9C5BD", "#9A968F"), 18, {r:0.01});
    const L = B(si - 0.24, dj + 0.08, 0.48, 0.02, 8.4, D2("#C9C5BD", "#9A968F"), 18.8, {r:0}); L.rotation.x = -0.15;
    R.screens.push({id:r.id, p:[X(si), hz(23.2), Z(dj + 0.115)], w:0.42, h:hz(7)});
    B(si + 0.45, dj + 0.15, 0.12, 0.12, 4, "#FFFFFF", 18, {r:0.02});
    B(di + dw - 0.42, dj + 0.1, 0.24, 0.24, 6, "pot", 18, {r:0.03}); sm(sph(0.16, 10, 8), "plant", X(di + dw - 0.3), hz(24) + 0.1, Z(dj + 0.22));
    [[si, sj], [si + 1.05, sj]].forEach(([i, j]) => { sm(cyl(0.2, 0.2, 0.03, 16), "metal", X(i), 0.015, Z(j), SROOT, "s"); sm(cyl(0.025, 0.025, hz(13), 6), "metal", X(i), hz(6.5), Z(j), SROOT, "s"); sm(cyl(0.22, 0.22, hz(2.5), 18), tw, X(i), hz(14.2), Z(j)); });
    return; }
  if(r.cart){   // 제작 카트: 바퀴 · 2단 · 모니터 · 무전기 · 콜시트 · 옆에 슬레이트
    const fr = D2("#3A3936", "#55524C");
    [[di+0.05,dj+0.05],[di+dw-0.13,dj+0.05],[di+0.05,dj+dd-0.13],[di+dw-0.13,dj+dd-0.13]].forEach(([a,b]) => { sm(cyl(0.05, 0.05, 0.05, 10), "#141414", X(a + 0.04), 0.035, Z(b + 0.04), SROOT, "s").rotation.z = Math.PI / 2; B(a, b, 0.08, 0.08, 16, fr, 2, {cls:"s", r:0}); });
    B(di + 0.05, dj + 0.05, dw - 0.1, dd - 0.1, 1.4, sh(fr, -0.1), 6, {r:0}); B(di + 0.2, dj + 0.15, 0.5, 0.4, 5, "#C9A64A", 7.4, {r:0.02}); B(di + 0.85, dj + 0.18, 0.45, 0.36, 4, "#2B2B2D", 7.4, {r:0.02});
    B(di, dj, dw, dd, 2.2, "#2E2C2A", 17, {r:0.03});
    const mi = si - 0.42; B(mi + 0.38, dj + 0.12, 0.08, 0.08, 8, "metal", 19, {cls:"s", r:0}); B(mi, dj + 0.1, 0.84, 0.06, 18, "#2A2B2E", 26, {cls:"s", r:0.02});
    R.screens.push({id:r.id, p:[X(mi + 0.42), hz(35), Z(dj + 0.165)], w:0.78, h:hz(16)});
    B(si - 0.3, dj + dd - 0.3, 0.6, 0.15, 1, D2("#E4E0D8", "#777777"), 19.2, {r:0.01});
    B(di + 0.12, dj + 0.2, 0.1, 0.1, 6, "#1E1E1E", 19.2, {r:0.02}); sm(cyl(0.008, 0.008, hz(6), 4), "#1E1E1E", X(di + 0.17), hz(28), Z(dj + 0.25), SROOT, "s");
    B(di + dw - 0.5, dj + 0.3, 0.32, 0.4, 1, "#FFFFFF", 19.2, {r:0}); B(di + dw - 0.46, dj + 0.32, 0.24, 0.05, 0.6, "#C9A64A", 20.2, {r:0});
    { const i = di + dw + 0.01, j0 = dj + 0.12, j1 = dj + dd - 0.12, w = j1 - j0;   // 슬레이트
      faceI(i, j0, j1, 5, 14.5, "#1C1C1C", "m", 0.02);
      for(let k = 0; k < 10; k++) faceI(i + 0.003, j0 + w * k / 10, j0 + w * (k + 1) / 10, 14.5, 17, k % 2 ? "#1C1C1C" : "#FFFFFF", "m", 0.02);
      [8, 10.5, 13].forEach(z => faceI(i + 0.022, j0 + 0.04, j1 - 0.04, z, z + 0.3, "#9A9A9A", "m", 0.004)); }
    chair3(r, g); return; }
  if(r.draft){   // 디자인 드로잉 테이블: 기울어진 판 + 펜 디스플레이 + 스윙 램프 + 연필꽂이
    const wood = D2("#D9C3A0", "#7A6246"), z0 = hz(18), z1 = hz(27), tilt = Math.atan2(z1 - z0, dd);
    [[di+0.08,dj+0.08],[di+dw-0.16,dj+0.08],[di+0.08,dj+dd-0.16],[di+dw-0.16,dj+dd-0.16]].forEach(([a,b]) => B(a, b, 0.08, 0.08, 27 - (b - dj) / dd * 9 - 1.5, "metal", 0, {cls:"s", r:0}));
    B(di + 0.15, dj + 0.3, dw - 0.3, 0.06, 1.5, "metal", 6, {cls:"s", r:0});
    const top = new THREE.Group(); top.position.set(X(di + dw / 2), (z0 + z1) / 2, Z(dj + dd / 2)); top.rotation.x = tilt; SROOT.add(top);
    const len = Math.hypot(dd, z1 - z0);
    sm(rbox(dw, hz(2.2), len, 0.02), wood, 0, -hz(1.1), 0, top);
    const pap = (x0, z0_, w, d, c, y = 0.004) => sm(rbox(w, 0.004, d, 0), c, x0 + w / 2 - dw / 2, y, z0_ + d / 2 - len / 2, top);
    pap(0.2, 0.15, 0.7, 0.55, "#FFFFFF"); pap(0.3, 0.22, 0.7, 0.55, "#F4EFE6", 0.007); pap(dw - 0.85, 0.2, 0.62, 0.5, "#FFFFFF");
    ["#E8A04A", "#3A8A78", "#E8B5C8", "#8B5A3C"].forEach((c, k) => pap(dw - 0.8 + (0.3 + k * 0.12) * 0.8, 0.3, 0.09, 0.09, c, 0.008));
    const px = si - 0.5 - di, pz = 0.45; pap(px, pz, 1.0, 0.62, "#1E1F22", 0.008);
    { const v = new THREE.Vector3(px + 0.5 - dw / 2, 0.016, pz + 0.31 - len / 2).applyEuler(top.rotation).add(top.position);
      R.screens.push({id:r.id, p:[v.x, v.y, v.z], w:0.9, h:0.52, rx:tilt - Math.PI / 2}); }
    { const a = [di + 0.15, dj + 0.1], y0 = hz(27);   // 스윙 램프
      sm(cyl(0.012, 0.012, hz(26), 6), "metal", X(a[0] + 0.05), y0 + hz(13), Z(a[1] + 0.03), SROOT, "s");
      const arm = sm(cyl(0.012, 0.012, 0.55, 6), "metal", X(a[0] + 0.32), y0 + hz(23), Z(a[1] + 0.18), SROOT, "s"); arm.rotation.z = Math.PI / 2 + 0.2; arm.rotation.y = -0.5;
      sm(geo("lampShade", () => new THREE.ConeGeometry(0.1, 0.14, 14, 1, true)), D2("#2A2A28", "#C8B89A"), X(a[0] + 0.58), y0 + hz(19), Z(a[1] + 0.32), SROOT, "s");
      sm(sph(0.04, 8, 6), "#FFE7B8", X(a[0] + 0.58), y0 + hz(17), Z(a[1] + 0.32), SROOT, "glow"); }
    { const cz = dj + dd - 0.37, y = hz(27 - (cz - dj) / dd * 9); sm(cyl(0.07, 0.07, hz(7), 12), "#FFFFFF", X(di + dw - 0.27), y + hz(3.5), Z(cz));
      ["#E06A55", "#3A8A78", "#E8A04A"].forEach((c, k) => sm(cyl(0.008, 0.008, 0.16, 5), c, X(di + dw - 0.31 + k * 0.04), y + hz(7) + 0.05, Z(cz), SROOT, "s")); }
    chair3(r, g); return; }
  if(r.village){   // 비디오 빌리지: 모니터 카트 + 감독 의자 둘
    const fr = D2("#3A3936", "#55524C");
    [[di+0.05,dj+0.05],[di+dw-0.13,dj+0.05],[di+0.05,dj+dd-0.13],[di+dw-0.13,dj+dd-0.13]].forEach(([a,b]) => { sm(cyl(0.05, 0.05, 0.05, 10), "#141414", X(a + 0.04), 0.035, Z(b + 0.04), SROOT, "s").rotation.z = Math.PI / 2; B(a, b, 0.08, 0.08, 20, fr, 2, {cls:"s", r:0}); });
    B(di + 0.05, dj + 0.05, dw - 0.1, dd - 0.1, 1.4, sh(fr, -0.1), 7, {r:0}); B(di + 0.25, dj + 0.1, 0.55, 0.3, 4, "#1E1E1E", 8.4, {r:0.02});
    B(di, dj, dw, dd, 2, "#2E2C2A", 20, {r:0.03});
    [di + 0.08, di + 0.8].forEach(mi => { B(mi + 0.27, dj + 0.2, 0.08, 0.08, 5, "metal", 22, {cls:"s", r:0}); B(mi, dj + 0.17, 0.62, 0.07, 15, "#1A1A1C", 27, {cls:"s", r:0.02});
      R.screens.push({id:"_village", p:[X(mi + 0.31), hz(34.5), Z(dj + 0.245)], w:0.54, h:hz(12), off:D2("#2B4A63", "#2B4A63")});
      const hood = B(mi - 0.02, dj + 0.17, 0.66, 0.2, 0.6, "#1E1E1E", 41.5, {r:0}); hood.rotation.x = 0.12; });
    B(di + dw - 0.45, dj + 0.15, 0.3, 0.22, 2, "#1C1C1C", 22, {r:0});
    [[si, sj], [si + 0.9, sj]].forEach(([i, j], k) => { const dg = seatG(i, j, h), wd = D2("#6B4A30", "#8A6A4A"), cv = "c-prod";
      [-1, 1].forEach(s => { const leg = sm(rbox(0.04, hz(17), 0.04, 0), wd, s * 0.2, hz(8.5), 0, dg); leg.rotation.x = s * 0.5; const leg2 = sm(rbox(0.04, hz(17), 0.04, 0), wd, s * 0.2, hz(8.5), 0, dg); leg2.rotation.x = -s * 0.5; });
      LB(dg, 0, 0, 0.48, 0.42, 1.6, cv, 15, {r:0.01}); [-0.25, 0.25].forEach(lx => LB(dg, lx, 0, 0.05, 0.44, 1.2, wd, 24, {r:0.01}));
      [-0.23, 0.23].forEach(lx => LB(dg, lx, -0.2, 0.04, 0.04, 26, wd, 15, {r:0}));
      LB(dg, 0, -0.2, 0.46, 0.02, 9, cv, 30, {r:0}); });
    return; }
}
function buildIsland(){
  const [ci, cj] = ISLAND.c, {hl, r} = ISLAND;
  const g = geo("islandTop", () => { const s = new THREE.Shape(); islandPts3(0).forEach(([i, j], k) => { const u = i - ci, v = -(j - cj); k ? s.lineTo(u, v) : s.moveTo(u, v); }); s.closePath();
    const e = new THREE.ExtrudeGeometry(s, {depth:hz(3.5), bevelEnabled:false, curveSegments:4}); e.rotateX(-Math.PI / 2); return e; });
  sm(g, D2("#ECD9BC", "#8C7254"), X(ci), hz(14.5), Z(cj));
  [[ci - 1.25, cj], [ci + 1.25, cj]].forEach(([i, j]) => { sm(cyl(0.3, 0.32, 0.04, 20), "metal", X(i), 0.02, Z(j), SROOT, "s"); sm(cyl(0.07, 0.07, hz(14.5), 10), "metal", X(i), hz(7.25), Z(j), SROOT, "s"); });
  sm(cyl(0.36, 0.3, hz(13), 18), "pot", X(ci), hz(18) + hz(6.5), Z(cj)); sm(cyl(0.33, 0.33, 0.01, 18), D2("#6B5038", "#3A2E22"), X(ci), hz(31) + 0.005, Z(cj));
  sm(cyl(0.05, 0.075, hz(48), 8), D2("#8A6A4A", "#6B5038"), X(ci), hz(31) + hz(24), Z(cj));
  [[0.1, 0.25, -0.05, 0.08], [-0.12, 0.3, 0.1, 0.06]].forEach(([dx, dy, dz, rr]) => { const b = sm(cyl(0.025, 0.035, 0.45, 6), D2("#8A6A4A", "#6B5038"), X(ci) + dx, hz(66) + dy, Z(cj) + dz); b.rotation.z = dx * 5; b.rotation.x = dz * 5; });
  [[0, 0, 0, 0.5], [-0.42, -0.12, 0.15, 0.36], [0.42, -0.1, -0.12, 0.38], [0.1, 0.28, 0.35, 0.34], [-0.15, 0.3, -0.35, 0.34], [0.2, -0.2, 0.42, 0.3], [-0.3, 0.05, -0.15, 0.3]].forEach(([dx, dy, dz, rr], k) =>
    sm(sph(rr, 14, 10), k % 2 ? sh("plant", 0.14) : "plant", X(ci) + dx, hz(80) + dy, Z(cj) + dz));
}
const tripod = (i, j, hpx, r = 0.3) => { const h = hz(hpx), top = new THREE.Vector3(X(i), h, Z(j));
  [[-r, r * 0.4], [r * 0.5, -r], [r * 0.6, r * 0.8]].forEach(([a, b]) => { const f = new THREE.Vector3(X(i + a), 0, Z(j + b)), len = top.distanceTo(f);
    const o = sm(cyl(0.012, 0.012, len, 6), "metal", (top.x + f.x) / 2, h / 2, (top.z + f.z) / 2, SROOT, "s"); o.lookAt(f); o.rotateX(Math.PI / 2); }); };
function softbox(i, j, lit){
  tripod(i, j, 50, 0.32); B(i - 0.035, j - 0.035, 0.07, 0.07, 58, "metal", 4, {cls:"s"});
  const g = new THREE.Group(); g.position.set(X(i), hz(67), Z(j)); SROOT.add(g);
  g.rotation.y = Math.atan2(X(16.2) - X(i), Z(1.4) - Z(j));
  sm(rbox(0.76, hz(30), 0.3, 0.04), "#2A2A2C", 0, 0, 0, g);
  const f = sm(rbox(0.68, hz(26), 0.02, 0), lit ? "#FFFDF4" : D2("#E8E6E2", "#77736C"), 0, 0, 0.16, g, lit ? "glow" : "m");
  if(lit) R.softGlow = true;
}
function camRig(i, j, dir){
  tripod(i, j, 40); B(i - 0.04, j - 0.04, 0.08, 0.08, 40, "metal", 0, {cls:"s"});
  const g = new THREE.Group(); g.position.set(X(i), hz(46), Z(j)); SROOT.add(g); if(dir === "-i") g.rotation.y = -Math.PI / 2; else g.rotation.y = Math.PI;
  sm(rbox(0.26, hz(13), 0.5, 0.03), "#1D1D1F", 0, 0, 0, g, "s");
  const lens = sm(cyl(0.08, 0.09, 0.22, 14), "#303033", 0, 0, 0.34, g, "s"); lens.rotation.x = Math.PI / 2;
  sm(sph(0.02, 6, 4), "#FF4B3E", 0.08, hz(7), -0.2, g, "glow");
}
function plant(i, j, tall){
  const h = tall ? 16 : 11; B(i - 0.18, j - 0.18, 0.36, 0.36, h, "pot", 0, {r:0.05});
  const y0 = hz(h), s = tall ? 1.25 : 0.9;
  [[0,0.42,0,0.27],[-0.17,0.3,0.06,0.2],[0.17,0.32,-0.04,0.21],[0.03,0.62,0.03,0.19],[-0.06,0.5,-0.12,0.17]].forEach(([x, y, z, r], k) =>
    sm(sph(r * s * 0.85, 12, 9), k % 2 ? sh("plant", 0.16) : "plant", X(i) + x * s, y0 + y * s, Z(j) + z * s));
}
function floorCloud(i, j, s){
  [[-16,4,13],[0,-6,17],[16,3,13],[-6,8,12],[8,8,12]].forEach(([dx, dy, r], k) => { const rr = r * s * 0.034;
    sm(sph(rr, 16, 12), k < 3 ? "#FFFFFF" : D2("#F1E6F6", "#E2D3EC"), X(i) + dx * s * 0.034, rr * 0.78, Z(j) + dy * s * 0.03).scale.set(1, 0.85, 1); });
}

/* 크레용팜 */
function buildFarm(){
  wtext("CREYONG FARM", 2.45, 0, 90, "i", 14, D2("#E8A04A", "#FFD49A"), "c-farm", 800);
  wtext("크리에이터 스튜디오 · @creyongfarm", 2.45, 0, 76, "i", 6.5, "ink-2", null, 600, FONT);
  // 촬영 부스: 배경지 + 링라이트 + 작은 테이블
  faceJ(10.3, 11.8, 0.0, 0, 100, sh("c-farm", 0.62).map((c, k) => k ? shade(T["c-farm"][1], -0.55) : c));
  B(10.15, 0.02, 1.8, 0.14, 9, sh("frame", -0.1), 100, {r:0.03});
  B(10.65, 0.8, 0.8, 0.5, 13, "#FFFFFF"); B(10.9, 0.9, 0.28, 0.26, 10, "c-farm", 13);
  B(11.03, 1.97, 0.06, 0.06, 48, "metal", 0, {cls:"s"});
  { const ring = sm(geo("ring", () => new THREE.TorusGeometry(0.3, 0.035, 8, 32)), D2("#FFFFFF", "#FFE3B8"), X(11.06), hz(56), Z(2.0), SROOT, "glow"); ring.rotation.y = AZ0; }
  // 기획 화이트보드 (왼벽) + 포스트잇
  faceI(0.0, 0.8, 3.0, 30, 82, "#FBFAF7", "s", 0.04);
  [[0.8,0.04],[3.0,0.04]].forEach(([j]) => B(0.0, j - 0.03, 0.06, 0.06, 52, "frame", 30, {r:0}));
  B(0.0, 0.77, 0.06, 2.26, 1.5, "frame", 82, {r:0}); B(0.0, 0.77, 0.06, 2.26, 1.5, "frame", 28.5, {r:0});
  [["amber",70,1.0,2.2],["ok",60,1.0,1.8],["sched",50,1.0,2.5]].forEach(([c,z,a,b]) => faceI(0.045, a, b, z, z + 1.6, c));
  [[2.3,66,"#FFE58A"],[2.6,52,"#FFC9B8"],[2.35,40,"#BFE7DA"]].forEach(([j,z,c]) => faceI(0.045, j, j + 0.32, z, z + 9, c));
  // 흡음 패널
  ["felt", sh("c-prod", 0.55).map((c, k) => k ? shade(T["c-prod"][1], -0.4) : c), "felt"].forEach((c, k) => faceI(0.0, 3.6 + k * 1.0, 4.45 + k * 1.0, 36, 78, c, "m", 0.06));
  // 복도: 감독님 확인 보드 (코르크 + 메모 예시)
  faceI(0.0, 7.15, 8.85, 22, 84, "#B98B55", "m", 0.05); faceI(0.03, 7.3, 8.7, 26, 80, "#D8B27C", "m", 0.03);
  [[8.25,58,"#FFE58A"],[7.8,58,"#BFE7DA"],[7.35,58,"#FFC9B8"],[8.25,34,"#F1D9C2"]].forEach(([j,z,c]) => faceI(0.065, j, j + 0.36, z, z + 16, c, "m", 0.01));
  wtext("감독님 확인 보드", 0, 7.95, 92, "j", 8.5, "ink-2", null, 700, FONT);
  // 크레용팜 회의실
  const fc = sh("c-farm", -0.3).map((c, k) => k ? shade(T["c-farm"][1], -0.45) : c), tw = D2("#C89A62", "#5A4330");
  [8.2, 9.6].forEach(i => sm(cyl(0.006, 0.006, hz(28), 4), D2("#9A948C", "#777777"), X(i), hz(104), Z(4.5), SROOT, "s"));
  faceJ(8.0, 9.8, 4.49, 78, 90, "c-farm", "m", 0.03); wtext("FARM MEETING", 8.9, 4.5, 84.2, "i", 4.2, "#FFFFFF", null, 800);
  [8.4, 9.4].forEach(i => { B(i - 0.22, 3.26, 0.44, 0.36, 16, fc, 0, {r:0.06}); B(i - 0.22, 5.42, 0.44, 0.36, 16, fc, 0, {r:0.06}); });
  B(8.15, 4.35, 0.16, 0.3, 14, "metal", 0, {cls:"s"}); B(9.5, 4.35, 0.16, 0.3, 14, "metal", 0, {cls:"s"}); B(7.95, 3.9, 1.9, 1.2, 3, tw, 14, {r:0.04});
  B(8.25, 4.25, 0.45, 0.32, 1, "#FFFFFF", 17); B(9.05, 4.1, 0.13, 0.13, 3, "c-farm", 17); B(9.35, 4.65, 0.13, 0.13, 3, "#FAF7F2", 17); B(8.7, 4.65, 0.5, 0.3, 0.6, "#FFE7C2", 17);
  buildIsland();
}

/* 크레용프로덕션 */
function buildProd(){
  // 쇼릴 화면 틀 + 사인 (화면 자체는 따로 움직임)
  faceI(0.0, 9.2, 11.9, 26, 104, "#0D0E0F", "s", 0.03);
  wtext("CREYONG PRODUCTION", 0, 10.55, 95, "j", 7, D2("#7FD3BF", "#9EE3D3"), "c-prod", 800);
  wtext("기업 · 공공기관 웹드라마 & 홍보영상", 0, 10.55, 84, "j", 5, D2("#BFC6C3", "#B3AA9C"), null, 600, FONT);
  // 포스터 벽 (실제 작품 포스터는 그림이 오면 그림판에 칠함)
  wtext("FILMOGRAPHY", 0, 14.2, 90, "j", 4.6, D2("#8A8F8C", "#B3AA9C"), null, 800);
  const pz0 = 48, pw = 1.0, pz1 = 48 + pw * 31.3;
  R.posterSlots = [14.85, 13.7, 12.55].map(j => {
    faceI(0.0, j - 0.06, j + pw + 0.06, pz0 - 2, pz1 + 2, "#1E1E1C", "s", 0.03);
    B(0.0, j + 0.3, 0.14, 0.4, 1.4, "#2A2A28", pz1 + 4, {r:0});
    const slot = {img:null};
    decal(R.atlas, 256, 256, (c, W, H) => { if(slot.img){ c.drawImage(slot.img, 0, 0, W, H); const g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, "rgba(255,255,255,.16)"); g.addColorStop(0.45, "rgba(255,255,255,0)"); g.addColorStop(1, "rgba(0,0,0,.10)"); c.fillStyle = g; c.fillRect(0, 0, W, H); } else { c.fillStyle = "#3A3A38"; c.fillRect(0, 0, W, H); } },
      pw, hz(pz1 - pz0), "j", 0.01, j + pw / 2, hz((pz0 + pz1) / 2));
    return slot;
  });
  // 장식장 + 상패 + 트로피
  B(0.12, 11.95, 0.55, 3.95, 16, D2("#5B4636", "#3B3029"), 0, {r:0.03});
  R.plaqueSlots = [13.4, 12.62].map(j => { const w = 0.7, z0 = 17.4, z1 = 37;
    B(0.16, j - 0.04, 0.2, w + 0.08, 1.4, "#2A2A28", 16); B(0.24, j, 0.05, w, z1 - z0, "#141414", z0, {r:0});
    faceI(0.29, j + 0.03, j + w - 0.03, z0 + 0.8, z1 - 0.8, "#B48A34", "s", 0.004);
    const slot = {img:null};
    decal(R.atlas, 200, 220, (c, W, H) => { c.fillStyle = "#141414"; c.fillRect(0, 0, W, H); if(slot.img) c.drawImage(slot.img, W * 0.04, H * 0.1, W * 0.92, H * 0.8); },
      w - 0.12, hz(z1 - z0 - 3.2), "j", 0.275, j + w / 2, hz((z0 + z1) / 2));
    return slot; });
  // 별 트로피 (서울) · 컵 트로피 (캐나다)
  B(0.23, 14.18, 0.32, 0.32, 4, "#1E1E1C", 16); B(0.27, 14.22, 0.24, 0.24, 2, "#C9A64A", 20, {cls:"s"});
  B(0.35, 14.3, 0.08, 0.08, 9, "#D9B355", 22, {cls:"s"}); B(0.26, 14.21, 0.26, 0.26, 7, "#E8C463", 33, {cls:"s"});
  { const st = sm(geo("star", () => { const s = new THREE.Shape(); for(let k = 0; k < 10; k++){ const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? 0.045 : 0.1; k ? s.lineTo(Math.cos(a) * rr, -Math.sin(a) * rr) : s.moveTo(Math.cos(a) * rr, -Math.sin(a) * rr); } return new THREE.ExtrudeGeometry(s, {depth:0.03, bevelEnabled:false}); }), "#F6DE8D", X(0.39), hz(46), Z(14.34), SROOT, "s"); st.rotation.y = AZ0; }
  B(0.23, 14.62, 0.32, 0.32, 4, "#1E1E1C", 16); B(0.35, 14.74, 0.08, 0.08, 6, "#D9B355", 20, {cls:"s"});
  sm(cyl(0.12, 0.05, 0.2, 16), "#E8C463", X(0.39), hz(32), Z(14.78), SROOT, "s");
  sm(geo("cupRing", () => new THREE.TorusGeometry(0.12, 0.012, 6, 20)), "#F6DE8D", X(0.39), hz(32) + 0.1, Z(14.78), SROOT, "s").rotation.x = Math.PI / 2;
  sm(sph(0.035, 8, 6), "#D8352A", X(0.39) + 0.09, hz(32), Z(14.78) + 0.06);
  // 회의실: 유리벽 · 테이블 · 의자 · TV
  B(7.55, 10.85, 0.2, 0.4, 14, "metal", 0, {cls:"s"}); B(8.95, 10.85, 0.2, 0.4, 14, "metal", 0, {cls:"s"}); B(6.9, 10.45, 2.8, 1.2, 3, D2("#5B4636", "#3B3029"), 14, {r:0.04}); B(7.8, 10.8, 0.5, 0.35, 1, "#FFFFFF", 17);
  [7.3, 8.3, 9.3].forEach(i => { B(i - 0.22, 9.86, 0.44, 0.36, 16, "#2A2A2A", 0, {r:0.06}); B(i - 0.22, 11.85, 0.44, 0.36, 16, "#2A2A2A", 0, {r:0.06}); });
  B(6.48, 10.87, 0.36, 0.44, 16, "#2A2A2A", 0, {r:0.06});
  B(7.75, 9.14, 0.05, 0.05, 30, "metal", 0, {cls:"s"}); B(9.05, 9.14, 0.05, 0.05, 30, "metal", 0, {cls:"s"});
  B(7.5, 9.1, 1.8, 0.08, 30, "#1C1C1E", 30, {cls:"s"}); faceJ(7.58, 9.22, 9.18, 33, 57, "#24303A", "s");
  faceJ(7.7, 9.1, 9.2, 50, 53, "c-prod", "glow", 0.005); [[45,7.7,8.7],[41,7.7,8.4],[37,7.7,8.1]].forEach(([z,a,b], k) => faceJ(a, b, 9.2, z, z + 1.6, k === 2 ? "#E8A04A" : "#E8E4DC", "glow", 0.005)); faceJ(8.75, 9.1, 9.2, 36, 46, "#3A8A78", "glow", 0.005);
  const glassJ = (i0, i1, j) => { faceJ(i0, i1, j, 0, 24, D2("#4A4C52", "#2A2C31"), "m", 0.05); faceJ(i0, i1, j, 24, 80, D2("#BECDE6", "#96AAD2"), "glass", 0.03); B(i0, j - 0.01, i1 - i0, 0.06, 1.5, "frame", 79, {r:0}); };
  const glassI = (i, j0, j1) => { faceI(i, j0, j1, 0, 24, D2("#4A4C52", "#2A2C31"), "m", 0.05); faceI(i, j0, j1, 24, 80, D2("#BECDE6", "#96AAD2"), "glass", 0.03); B(i - 0.01, j0, 0.06, j1 - j0, 1.5, "frame", 79, {r:0}); };
  glassJ(6.4, 10.3, 12.6); glassI(10.3, 9.1, 12.6); glassI(6.4, 9.1, 11.2);
  [[6.4,9.1],[10.3,9.1],[10.3,12.6],[6.4,12.6]].forEach(([i,j]) => B(i - 0.02, j - 0.02, 0.07, 0.07, 80, "frame", 0, {r:0}));
  faceJ(6.5, 8.45, 12.62, 66, 76, "c-prod", "m", 0.01); wtext("MEETING ROOM", 7.475, 12.63, 71, "i", 4.4, "#FFFFFF", null, 800);
  // 장비 선반
  B(10.4, 9.5, 1.4, 0.5, 46, "#34312E", 0, {r:0.02}); [[10.45,6,18,"#C9A64A"],[11.1,6,18,"#2B2B2B"],[10.45,22,34,"#3A8A78"],[11.1,22,34,"#9E9E9E"],[10.5,38,44,"#555555"]].forEach(([a,z0,z1,c]) => B(a, 10.0, 0.6, 0.03, z1 - z0, c, z0, {r:0}));
  // 레퍼런스 보드 벽 (옛 색보정 구석) · 스틸 사진 6장 + 핀 + 빨간 실 + 메모
  faceI(0.0, 16.3, 19.7, 24, 88, D2("#B98B55", "#6E5338"), "m", 0.03); faceI(0.03, 16.4, 19.6, 27, 85, D2("#D8B27C", "#8A6A48"), "m", 0.01);
  decal(R.atlas, 320, 186, (c, W, H) => { const u = j => (19.6 - j) / 3.2 * W, w = z => (85 - z) / 58 * H;
    REF_STILLS.forEach(([j, z, ww, hh, c0, c1], k) => { const x0 = u(j + ww), y0 = w(z + hh), x1 = u(j), y1 = w(z);
      c.fillStyle = "rgba(0,0,0,.16)"; c.fillRect(x0 + 2, y0 + 2, x1 - x0, y1 - y0);
      const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, c0); g.addColorStop(1, c1); c.fillStyle = g; c.fillRect(x0, y0, x1 - x0, y1 - y0);
      c.fillStyle = "rgba(0,0,0,.55)"; c.fillRect(x0, y0, x1 - x0, 5); c.fillRect(x0, y1 - 5, x1 - x0, 5);
      c.fillStyle = ["#E06A55","#E8A04A","#3A8A78"][k % 3]; c.beginPath(); c.arc((x0 + x1) / 2, y0 - 1, 4, 0, 7); c.fill(); });
    [[19.15,29,"#FFE58A"],[16.55,29,"#BFE7DA"]].forEach(([j, z, col]) => { c.fillStyle = col; c.fillRect(u(j + 0.4), w(z + 9), 0.4 / 3.2 * W, 9 / 58 * H); });
    c.strokeStyle = "rgba(200,60,50,.8)"; c.lineWidth = 2; c.beginPath(); [[17.2,72],[17.95,60],[18.7,74],[19.25,61]].forEach(([j, z], k) => k ? c.lineTo(u(j), w(z)) : c.moveTo(u(j), w(z))); c.stroke(); },
    3.2, hz(58), "j", 0.035, 18.0, hz(56));
  wtext("REFERENCE", 0, 18.0, 94, "j", 6.4, D2("#3A8A78", "#9EE3D3"), null, 800);
  // 콘티 테이블 + 스툴 3개
  { const st = D2("#2E6B5D", "#2E3A36");
    [[2.7,17.25],[1.7,18.1],[3.7,18.1]].forEach(([i, j]) => { B(i - 0.04, j - 0.04, 0.08, 0.08, 11, "metal", 0, {cls:"s"}); B(i - 0.21, j - 0.21, 0.42, 0.42, 3, st, 11, {r:0.06}); });
    B(2.62, 18.02, 0.16, 0.16, 14, "metal", 0, {cls:"s"}); B(2.05, 17.6, 1.3, 1.0, 3, D2("#5B4636", "#3B3029"), 14, {r:0.04});
    B(2.2, 17.72, 0.42, 0.3, 0.8, "#FFFFFF", 17, {r:0}); B(2.68, 17.8, 0.42, 0.3, 0.8, "#F4EFE6", 17, {r:0}); B(2.3, 18.15, 0.42, 0.3, 0.8, "#FFFFFF", 17, {r:0});
    sm(cyl(0.07, 0.06, hz(4), 12), "#FFFFFF", X(3.12), hz(19), Z(18.32)); B(3.12, 18.05, 0.24, 0.05, 1, "#E06A55", 17, {r:0}); }
  // 장비 케이스
  B(10.2, 16.95, 1.3, 0.7, 16, "#2B2B2D", 0, {r:0.03}); B(10.3, 17.0, 1.1, 0.6, 12, "#38383B", 16); B(10.25, 17.62, 1.2, 0.04, 3, "#C9A64A", 6, {cls:"s"}); B(10.35, 17.0, 0.9, 0.5, 2, "#C9A64A", 28, {cls:"s"});
  B(10.9, 18.7, 0.7, 0.6, 22, "#2B2B2D", 0, {r:0.03}); B(10.95, 19.28, 0.6, 0.04, 3, "#C9A64A", 9, {cls:"s"});
}

/* 예운옥 */
function buildStudio(){
  // 크레용팜 리뷰 세트 (옛 예운옥 자리, 2.5D와 같은 숫자): 장비 타공판 · 제품 선반 · 네온 · 언박싱 테이블 · 탑뷰 붐 · 정면 카메라 · 조명 · 협찬 택배
  R.rbMats = [];
  const pg = D2("#4A443D", "#3A3530"); faceJ(13.7, 17.6, 0.02, 30, 96, pg, "m", 0.004);
  [[14.1,70,0.7,10,"#1D1D1F"],[14.2,52,0.5,12,"#2A2A2C"],[15.1,76,0.9,9,"#1D1D1F"],[15.25,58,0.25,16,"#C9CDD2"],[15.7,58,0.25,16,"#C9CDD2"],[16.3,70,0.8,12,"#2A2A2C"],[16.4,46,0.6,8,"c-farm"],[14.9,40,0.9,6,"#3A3A3E"],[16.6,84,0.6,6,"#E06A55"]]
    .forEach(([i, z, w, h, c]) => B(i, 0.03, w, 0.08, h, c, z, {r:0.01}));
  [44, 64].forEach(z => B(18.4, 0.02, 4.8, 0.42, 1.5, "#8B5A3C", z - 1.5, {r:0.01}));
  [[18.6,"#F2E3C6",7],[19.2,"#FFFFFF",9],[19.9,"c-farm",6],[20.5,"#2A2A28",8],[21.2,"#72C4AE",7],[21.9,"#E8B5C8",6],[22.5,"#F2E3C6",8]].forEach(([i, c, h], k) => {
    B(i, 0.08, 0.5, 0.3, h, c, 44, {r:0.01}); B(i + (k % 2 ? 0.1 : 0), 0.08, k % 2 ? 0.32 : 0.42, 0.3, h - 1, k % 2 ? "#3A3A3E" : "#C9A27A", 64, {r:0.01}); });
  wtext("REVIEW", 20.8, 0, 84, "i", 15, D2("#FFF1DA", "#FFE3B8"), "#E8A04A", 800);
  wtext("크레용팜 협찬 리뷰 세트", 20.8, 0, 74.5, "i", 5.2, D2("#F0C890", "#E9C9A0"), null, 600, FONT);
  const tw = D2("#C99A66", "#6B4A34");
  [[15.45,2.25],[17.85,2.25],[15.45,3.3],[17.85,3.3]].forEach(([a, b]) => B(a, b, 0.07, 0.07, 22, sh(tw, -0.35), 0, {cls:"s"}));
  B(15.4, 2.2, 2.6, 1.2, 3, tw, 22, {r:0.03});
  B(15.7, 2.45, 0.42, 0.32, 9, "#1D1D1F", 25, {r:0.03}); { const l = sm(cyl(0.08, 0.09, 0.2, 14), "#303033", X(15.91), hz(29.5), Z(2.87), SROOT, "s"); l.rotation.x = Math.PI / 2; }
  B(16.4, 2.4, 0.5, 0.4, 7, "#F2E3C6", 25, {r:0.02}); B(16.4, 2.4, 0.5, 0.06, 7.2, "#FFFFFF", 25, {r:0});
  B(17.1, 2.5, 0.16, 0.16, 11, "#2A2A2C", 25, {r:0.04}); B(17.4, 2.55, 0.34, 0.3, 1, "#E8A04A", 25, {r:0.01}); B(16.0, 3.0, 0.7, 0.2, 0.5, "#FFFFFF", 25, {r:0.01});
  tripod(18.7, 3.9, 60, 0.3); B(18.66, 3.86, 0.08, 0.08, 88, "metal", 0, {cls:"s"});
  { const a = new THREE.Vector3(X(18.7), hz(88), Z(3.9)), b = new THREE.Vector3(X(16.7), hz(86), Z(2.8)), o = sm(cyl(0.018, 0.018, a.distanceTo(b), 8), "metal", (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2, SROOT, "s"); o.lookAt(b); o.rotateX(Math.PI / 2); }
  B(16.55, 2.65, 0.3, 0.3, 8, "#1D1D1F", 74, {r:0.03}); sm(sph(0.02, 6, 4), "#FF4B3E", X(16.78), hz(80), Z(2.7), SROOT, "glow");
  softbox(14.3, 4.0, true); softbox(20.4, 3.4, true); camRig(16.7, 5.2, "-j");
  [[19.4,0.3,0.9,0.7,12,0],[19.5,0.35,0.7,0.6,9,12],[20.45,0.4,0.6,0.55,10,0]].forEach(([i, j, w, d, h, z0]) => { B(i, j, w, d, h, D2("#C9A27A", "#8A6A4A"), z0, {r:0.02}); B(i + w / 2 - 0.05, j - 0.005, 0.1, d + 0.01, 0.3, "#E8D9B8", z0 + h, {r:0}); });
  // 노라 이사님 라일락 암체어 + 사이드 테이블
  const ch = D2("#C8B4D0", "#8E7A99");
  B(22.4, 2.0, 0.8, 0.78, 10, ch, 0, {r:0.08, seg:2}); B(22.4, 1.86, 0.8, 0.18, 32, sh(ch, -0.05), 0, {r:0.07, seg:2}); B(22.46, 2.06, 0.68, 0.66, 2, sh(ch, 0.12), 10, {r:0.05});
  B(22.3, 1.95, 0.14, 0.85, 17, sh(ch, -0.12), 0, {r:0.06}); B(23.16, 1.95, 0.14, 0.85, 17, sh(ch, -0.12), 0, {r:0.06});
  B(23.6, 2.95, 0.1, 0.1, 14, "metal", 0, {cls:"s"}); sm(cyl(0.25, 0.25, hz(1.5), 20), D2("#FFFFFF", "#E6DCEB"), X(23.65), hz(14.75), Z(3.0), SROOT, "s");
  B(23.5, 2.85, 0.13, 0.13, 3.2, "#E8B5C8", 15.5); B(23.68, 2.95, 0.2, 0.26, 0.6, "#2A2A28", 15.5);
}

/* 필름스쿨 */
function buildSchool(){
  // 강의실 스크린 (j 9 뒷벽 쪽, 학생은 -j를 봄)
  B(18.4, 9.1, 0.05, 0.05, 22, "metal", 0, {cls:"s"}); B(21.15, 9.1, 0.05, 0.05, 22, "metal", 0, {cls:"s"}); B(18.2, 9.0, 0.5, 0.3, 1.5, "metal", 0, {cls:"s"}); B(20.9, 9.0, 0.5, 0.3, 1.5, "metal", 0, {cls:"s"});
  B(18.0, 9.05, 3.6, 0.1, 52, "#1C1C1E", 22, {cls:"s", r:0.02});
  decal(R.atlas, 520, 160, (c, W, H, dark) => { c.fillStyle = "#2B2D31"; c.fillRect(0, 0, W, H);
    c.fillStyle = "#3E4651"; c.fillRect(W * 0.03, H * 0.05, W * 0.94, H * 0.5); c.fillStyle = dark ? "#4E5A4C" : "#6A7B62"; c.fillRect(W * 0.03, H * 0.05, W * 0.33, H * 0.5);
    [[0.86,"#E8A04A",0.07,0.68],[0.75,"#3A8A78",0.19,0.85],[0.66,"#8B5A3C",0.05,0.5],[0.58,"#7FA7D9",0.3,0.78]].forEach(([y,cc,a,b]) => { c.fillStyle = cc; c.fillRect(W * a, H * y, W * (b - a), H * 0.05); }); },
    3.3, hz(44), "i", 19.8, 9.16, hz(48));
  wtext("DaVinci Resolve", 19.8, 9.18, 76, "i", 5.5, D2("#3A3A3A", "#E9E9E9"), null, 600);
  B(22.6, 9.7, 0.8, 0.75, 3, "wood", 15); B(22.65, 9.8, 0.65, 0.08, 15, sh("wood", -0.2)); B(22.75, 9.95, 0.4, 0.4, 1, "#C8C8C8", 18, {cls:"s"});
  // 학생 책상 8개
  [10.7, 12.3].forEach(js => [17.5, 18.75, 20.0, 21.25].forEach(ti => {
    [[0.05,0.05],[0.93,0.05],[0.05,0.63],[0.93,0.63]].forEach(([a,b]) => B(ti + a, js + b, 0.06, 0.06, 15, "metal", 0, {cls:"s"}));
    B(ti, js, 1.05, 0.75, 3, "wood", 15, {r:0.03});
    B(ti + 0.48, js + 0.02, 0.1, 0.08, 15, "metal", 18, {cls:"s"}); B(ti + 0.38, js + 0.0, 0.3, 0.24, 1, "metal", 18, {cls:"s"}); B(ti + 0.15, js + 0.1, 0.75, 0.07, 19, "#2A2A2A", 26, {cls:"s", r:0.02});
    R.screens.push({id:"_desk", p:[X(ti + 0.525), hz(35.5), Z(js + 0.173)], w:0.68, h:hz(16), off:D2("#33445A", "#2E3B4E")});
    const ci = ti + 0.52, cj = js + 1.15, col = sh("c-school", -0.1);
    B(ci - 0.04, cj - 0.04, 0.08, 0.08, 11, "metal", 0, {cls:"s"}); B(ci - 0.26, cj - 0.22, 0.52, 0.46, 3, col, 11, {r:0.06}); B(ci - 0.26, cj + 0.2, 0.52, 0.08, 22, sh(col, 0.08), 12, {r:0.04});
  }));
  // 라운지 소파 · 테이블 · 책장
  const sc = sh("c-school", -0.05), sd = sh("c-school", -0.15);
  B(18.0, 17.6, 2.6, 0.85, 9, sc, 0, {r:0.08, seg:2}); B(18.0, 17.6, 2.6, 0.22, 22, sd, 0, {r:0.07, seg:2}); B(18.05, 17.6, 0.2, 0.85, 15, sh("c-school", -0.12), 0, {r:0.06}); B(20.35, 17.6, 0.2, 0.85, 15, sh("c-school", -0.12), 0, {r:0.06});
  [18.4, 19.4].forEach(i => B(i, 17.85, 0.8, 0.5, 3, sh("c-school", 0.15), 9, {r:0.06, seg:2}));
  B(18.7, 18.95, 1.3, 0.55, 13, "wood", 0, {r:0.04}); B(18.95, 19.05, 0.3, 0.22, 3, "#FFFFFF", 13); B(19.45, 19.1, 0.18, 0.18, 4, "#E8A04A", 13);
  B(22.2, 16.7, 1.6, 0.55, 50, "wood", 0, {r:0.02});
  [[10,"#E8A04A","#3A8A78","#8B5A3C"],[24,"#7FA7D9","#E06A55","#72C4AE"],[38,"#C8B4D0","#FFE58A","#2A2A28"]].forEach(([z,...cs]) => cs.forEach((c,k) => B(22.3 + k * 0.45, 17.0, 0.32, 0.28, 10, c, z, {r:0.01})));
}

/* 색보정실 (2026-11-22 감독님 "사무실 넓히고") · 2.5D colorSuite 그대로: 어두운 벽 · 바이어스 조명 레퍼런스 모니터 · 트랙볼 패널 · 가죽 의자 · 손님 소파 · 뒤쪽 머신룸 */
function paintGraded(x, W, H){
  const sx = W / 192, sy = H / 108; x.save(); x.scale(sx, sy);
  const sky = x.createLinearGradient(0, 0, 0, 72); sky.addColorStop(0, "#173A4E"); sky.addColorStop(0.62, "#C9824E"); sky.addColorStop(1, "#F2B072"); x.fillStyle = sky; x.fillRect(0, 0, 192, 72);
  const sun = x.createRadialGradient(132, 64, 0, 132, 64, 34); sun.addColorStop(0, "rgba(255,236,196,1)"); sun.addColorStop(0.25, "rgba(255,214,150,.85)"); sun.addColorStop(1, "rgba(255,190,120,0)"); x.fillStyle = sun; x.fillRect(80, 20, 104, 60);
  const sea = x.createLinearGradient(0, 70, 0, 108); sea.addColorStop(0, "#2D4F55"); sea.addColorStop(1, "#0F2329"); x.fillStyle = sea; x.fillRect(0, 70, 192, 38);
  x.fillStyle = "rgba(255,210,150,.5)"; for(let k = 0; k < 6; k++) x.fillRect(118 + k * 3 - k * k * 0.4, 74 + k * 4, 26 - k * 3, 1.4);
  x.fillStyle = "#0A161A"; x.beginPath(); x.moveTo(0, 82); x.quadraticCurveTo(40, 70, 86, 84); x.lineTo(86, 108); x.lineTo(0, 108); x.fill();
  x.beginPath(); x.arc(50, 50, 4.2, 0, Math.PI * 2); x.fill(); x.fillRect(46.5, 54, 7, 20); x.fillRect(47, 73, 2.6, 8); x.fillRect(50.4, 73, 2.6, 8);
  x.fillStyle = "#000"; x.fillRect(0, 0, 192, 12); x.fillRect(0, 96, 192, 12); x.restore();
}
function buildColor(){
  const [a, b, c, d] = CS, wl = D2("#2A2C31", "#1C1D21"), wtop = D2("#4A4C53", "#34363C"), pan = D2("#33363C", "#24262B");
  // 머신룸 랙 4대 (벽 뒤)
  [19.0, 20.0, 21.0, 22.0].forEach((i, k) => { B(i, 9.55, 0.76, 0.8, 62, D2("#33353B", "#26272C"), 0, {r:0.02});
    for(let r = 0; r < 5; r++){ const z = 14 + r * 9.5; faceJ(i + 0.06, i + 0.7, 10.35, z, z + 6.5, D2("#17181C", "#121316"), "s", 0.01);
      if((k + r) % 3 !== 1) faceJ(i + 0.58, i + 0.64, 10.36, z + 2.6, z + 3.8, r % 2 ? "#4DE38A" : "#6FB7FF", "glow", 0.005); } });
  // 벽: 뒤(j 12, 높이 96) · 문 위 · 왼쪽(i 18.6, 높이 64) · 앞 턱 22
  B(a, b - 0.14, CS_DOOR[0] - a, 0.14, 96, wl, 0, {r:0}); B(a - 0.02, b - 0.16, CS_DOOR[0] - a + 0.02, 0.18, 3, wtop, 96, {r:0});
  B(CS_DOOR[0], b - 0.14, CS_DOOR[1] - CS_DOOR[0], 0.14, 22, wl, 74, {r:0}); B(CS_DOOR[1] - 0.06, b - 0.14, 0.06, 0.14, 74, "frame", 0, {r:0}); B(CS_DOOR[0], b - 0.14, 0.06, 0.14, 74, "frame", 0, {r:0});
  faceJ(CS_DOOR[0] + 0.12, CS_DOOR[1] - 0.12, b, 80, 88, "#3A0E0E", "s", 0.01); wtext("GRADING", (CS_DOOR[0] + CS_DOOR[1]) / 2, b + 0.012, 84, "i", 3.4, "#FF5A4E", "#FF3B30", 800);
  B(a - 0.14, b, 0.14, d - b, 64, wl, 0, {r:0}); B(a - 0.16, b - 0.16, 0.18, d - b + 0.16, 3, wtop, 64, {r:0});
  B(a, d - 0.13, c - a, 0.14, 22, wl, 0, {r:0.02}); B(c - 0.12, b, 0.12, d - b, 22, wl, 0, {r:0.02});   // 앞 턱은 건물 앞 턱(lip)과 같은 자리라 면이 겹쳐 깨지던 것: 살짝 두껍게 감쌈 (2026-11-23)
  // 흡음재 · 사인 · RGB 점
  [[18.75, 19.15], [19.2, 19.6]].forEach(([p, q]) => faceJ(p, q, b, 26, 82, pan, "m", 0.04));
  for(let j = b; j < d - 1.5; j += 1.0) faceI(a, j + 0.15, j + 0.85, 16, 54, pan, "m", 0.04);
  wtext("COLOR SUITE", 21.0, b + 0.01, 89, "i", 6.2, "#E9E4DA", "#9AB8FF", 800);
  [["#C9504A", 0], ["#5FAE6A", 1], ["#4F7FC9", 2]].forEach(([col, k]) => faceJ(20.7 + k * 0.22, 20.86 + k * 0.22, b, 82.5, 84, col, "glow", 0.006));
  // 바이어스 조명 (D65 흰빛) → 모니터 → 색보정된 화면
  decal(R.atlas, 300, 170, (x, W, H, dark) => { const g = x.createRadialGradient(W / 2, H / 2, W * 0.08, W / 2, H / 2, W / 2); g.addColorStop(0, dark ? "rgba(214,228,255,.62)" : "rgba(214,228,255,.5)"); g.addColorStop(0.55, "rgba(190,210,255,.18)"); g.addColorStop(1, "rgba(190,210,255,0)"); x.fillStyle = g; x.fillRect(0, 0, W, H); },
    3.9, hz(88), "i", 21.0, b, hz(55));
  B(19.75, b, 2.5, 0.1, 46, "#0B0B0D", 32, {cls:"s", r:0.015});
  decal(R.atlas, 384, 216, (x, W, H) => paintGraded(x, W, H), 2.3, hz(40), "i", 21.0, b + 0.1, hz(55));
  [19.2, 22.44].forEach(i => { B(i, b, 0.36, 0.28, 22, "#18181A", 46, {r:0.03}); sm(cyl(0.07, 0.07, 0.02, 14), "#2C2C30", X(i + 0.18), hz(59), Z(b + 0.29)).rotation.x = Math.PI / 2; });
  // 책상 · GUI 모니터 2대(상태 따라 켜짐) · 그레이딩 패널
  B(19.68, 14.06, 2.64, 0.68, 15, D2("#1C1C1E", "#151517"), 0, {r:0.02}); B(19.6, 14.0, 2.8, 0.8, 3, D2("#4A3A2E", "#2E2520"), 15, {r:0.03});
  [19.72, 21.38].forEach(mi => { B(mi + 0.4, 14.12, 0.1, 0.1, 8, "metal", 18, {cls:"s"}); B(mi, 14.06, 0.9, 0.07, 19, "#141416", 25, {cls:"s", r:0.02});
    R.screens.push({id:"color", p:[X(mi + 0.45), hz(34.5), Z(14.133)], w:0.82, h:hz(16)}); });
  B(20.3, 14.34, 1.4, 0.44, 2.4, "#121214", 18, {cls:"s", r:0.02});
  for(let k = 0; k < 6; k++) sm(cyl(0.022, 0.022, 0.03, 10), "#4A4C52", X(20.42 + k * 0.23), hz(20.4) + 0.015, Z(14.42), SROOT, "s");
  ["#E0574C", "#5FC46E", "#5C8FE6"].forEach((col, k) => { const x = X(20.55 + k * 0.45), y = hz(20.4), z = Z(14.62);
    sm(sph(0.07, 14, 10), "#26282D", x, y + 0.035, z, SROOT, "s");
    sm(geo("tbRing", () => new THREE.TorusGeometry(0.1, 0.011, 6, 22)), col, x, y + 0.01, z, SROOT, "glow").rotation.x = Math.PI / 2; });
  // 가죽 의자 (seat 21.0, 15.25)
  const si = 21.0, sj = 15.25, lth = D2("#6B4632", "#4A3428"), lthD = sh(lth, -0.25);
  B(si - 0.25, sj - 0.25, 0.5, 0.5, 1.2, "metal", 0, {cls:"s", r:0}); B(si - 0.04, sj - 0.04, 0.08, 0.08, 9, "metal", 0, {cls:"s"});
  B(si - 0.34, sj - 0.26, 0.68, 0.56, 5, lth, 9, {r:0.08, seg:2}); B(si - 0.38, sj - 0.2, 0.1, 0.5, 9, lthD, 12, {r:0.04}); B(si + 0.28, sj - 0.2, 0.1, 0.5, 9, lthD, 12, {r:0.04});
  B(si - 0.36, sj + 0.24, 0.72, 0.14, 30, lth, 12, {r:0.06, seg:2}); B(si - 0.28, sj + 0.25, 0.56, 0.12, 8, lthD, 42, {r:0.05});
  // 손님 소파 · 낮은 테이블 · 스탠드 조명
  const sf = D2("#34413F", "#26302E");
  B(20.4, 16.8, 1.2, 0.5, 10, D2("#4A3A2E", "#2E2520"), 0, {r:0.03}); sm(cyl(0.06, 0.05, hz(3.5), 12), "#FFFFFF", X(20.67), hz(11.75), Z(16.99)); B(21.05, 16.95, 0.34, 0.16, 1, "#1A1A1C", 10, {r:0});
  B(19.7, 17.7, 2.6, 0.9, 9, sf, 0, {r:0.08, seg:2}); [19.86, 21.02].forEach(i => B(i, 17.76, 1.12, 0.6, 3, sh(sf, 0.12), 9, {r:0.06, seg:2}));
  B(19.7, 18.4, 2.6, 0.2, 24, sh(sf, -0.08), 0, {r:0.07, seg:2}); B(19.6, 17.7, 0.12, 0.9, 16, sh(sf, -0.15), 0, {r:0.05}); B(22.28, 17.7, 0.12, 0.9, 16, sh(sf, -0.15), 0, {r:0.05});
  B(19.95, 18.12, 0.36, 0.12, 8, D2("#3A8A78", "#29614F"), 12, {r:0.04}); B(21.9, 18.12, 0.36, 0.12, 8, "#E8A04A", 12, {r:0.04});
  B(22.94, 18.24, 0.12, 0.12, 2, "metal", 0, {cls:"s"}); sm(cyl(0.012, 0.012, hz(44), 6), "#7A7A78", X(23.0), hz(24), Z(18.3), SROOT, "s");
  sm(cyl(0.11, 0.15, hz(10), 16), D2("#F1DDB0", "#E9C98E"), X(23.0), hz(51), Z(18.3), SROOT, "glow");
  // 로비 옆 · 머신룸 앞 화분은 PLANTS에
}

/* 입구 로비 */
function buildLobby(){
  const W0 = 12.5, W1 = 16.5, J = 10.2, Dd = 0.18, H = 62, jf = J + Dd;
  B(W0, J, W1 - W0, Dd, H, D2("#2A2A28", "#1E1E1D"), 0, {r:0.02});
  faceJ(W0, W1, jf, H - 3, H, "#3C3B38");
  wtext("CREYONG", (W0 + W1) / 2, jf, 41, "i", 20, "#FFF6E8", "#F2B35E", 800);
  wtext("Behind the frame, before the world.", (W0 + W1) / 2, jf, 28.5, "i", 5.4, "#CFC6B6", null, "italic 500", "Fraunces, Georgia, serif");
  [["c-prod","크레용프로덕션"],["c-farm","크레용팜"],["c-school","필름스쿨"],["c-studio","예운옥"]].forEach(([c,t],k) => {
    const ic = W0 + 0.55 + k * 0.97; faceJ(ic - 0.3, ic + 0.3, jf, 18, 19.8, c, "glow", 0.005);
    wtext(t, ic, jf, 13.5, "i", 3.3, "#9C968B", null, 600, FONT); });
  [W0 + 0.6, W1 - 0.6].forEach(i => { sm(cyl(0.01, 0.01, 0.2, 4), "#2A2A28", X(i), hz(H) + 0.08, Z(jf) + 0.1, SROOT, "s"); sm(sph(0.04, 8, 6), "#FFE9C4", X(i), hz(H) + 0.14, Z(jf) + 0.2, SROOT, "glow"); });
  // 안내 데스크
  B(13.4, 12.0, 2.6, 0.55, 22, "#F6F2EA", 0, {r:0.03}); B(13.35, 11.95, 2.7, 0.65, 2, D2("#B79572", "#5A4E44"), 22, {r:0.02}); faceJ(13.4, 16.0, 12.55, 8, 11, "c-prod", "m", 0.01);
  B(15.4, 12.1, 0.18, 0.18, 7, "#FFFFFF", 24); [[-0.06,"#F4A7B9"],[0.04,"#FFE58A"],[0,"#E8B5C8"]].forEach(([d,c],k) => sm(sph(0.06, 10, 8), c, X(15.49) + d, hz(36) + k * 0.02, Z(12.19) + (k - 1) * 0.05));
  B(13.8, 12.1, 0.4, 0.28, 1, "#2A2A28", 24); wtext("INFORMATION", 14.7, 12.56, 17, "i", 3.4, D2("#8B8478", "#B8AFA3"), null, 700);
  // 엘리베이터 2대
  const i0 = 12.0, i1 = 12.92, j0 = 16.35, j1 = 19.05, EH = 84, stone = D2("#D8D0C4", "#3A3631"), f = i1;
  B(i0, j0, i1 - i0, j1 - j0, EH, stone, 0, {r:0.02}); B(i0 - 0.05, j0 - 0.05, i1 - i0 + 0.1, j1 - j0 + 0.1, 3, sh(stone, -0.1), EH, {r:0});
  [[16.6,17.6],[17.8,18.8]].forEach(([a,b]) => { faceI(f, a - 0.08, b + 0.08, 0, 60, D2("#A9A196", "#57514A"), "m", 0.02);
    faceI(f + 0.02, a, (a + b) / 2 - 0.005, 0, 56, D2("#D3D7DB", "#7E8389"), "s", 0.02); faceI(f + 0.02, (a + b) / 2 + 0.005, b, 0, 56, D2("#D3D7DB", "#7E8389"), "s", 0.02);
    faceI(f + 0.02, (a + b) / 2 - 0.32, (a + b) / 2 + 0.32, 62, 68.5, "#141414", "s", 0.01); wtext(a < 17 ? "▲ 3F" : "▼ 1F", f + 0.03, (a + b) / 2, 65.2, "j", 3.4, "#FFB547", "#FF9A2E", 800, FONT);
    wtext(a < 17 ? "▲ 복지층" : "▼ 로비", f + 0.03, (a + b) / 2, 71.2, "j", 2.7, D2("#A9601A", "#E8A04A"), null, 700, FONT); });
  faceI(f + 0.02, 17.62, 17.78, 26, 37, D2("#BDB5A9", "#4A453F"), "m", 0.01);
  wtext("ELEVATOR", f + 0.01, 17.7, 77.5, "j", 4.2, "ink-2", null, 800);
  // 소파 · 테이블 · 입구 유리문
  const so = D2("#8B5A3C", "#5A4A3E"), sd = D2("#7A4E33", "#4E4036");
  B(12.15, 14.2, 0.75, 1.6, 8, so, 0, {r:0.07, seg:2}); B(12.15, 14.2, 0.2, 1.6, 18, sd, 0, {r:0.06, seg:2}); B(12.15, 14.2, 0.75, 0.18, 13, sd, 0, {r:0.06}); B(12.15, 15.62, 0.75, 0.18, 13, sd, 0, {r:0.06});
  B(13.1, 14.6, 0.6, 0.8, 10, "wood", 0, {r:0.04}); B(13.2, 14.75, 0.3, 0.22, 2, "#FFFFFF", 10);
  [[14.0,19.95],[15.0,19.95]].forEach(([i,j]) => { faceJ(i, i + 1.0, j - 0.03, 0, 74, D2("#C8DCF0", "#AABEDC"), "glass", 0.03);
    B(i, j - 0.04, 0.04, 0.05, 74, "metal", 0, {cls:"s", r:0}); B(i + 0.96, j - 0.04, 0.04, 0.05, 74, "metal", 0, {cls:"s", r:0}); B(i, j - 0.04, 1.0, 0.05, 2, "metal", 72, {cls:"s", r:0});
    B(i + (i < 14.5 ? 0.86 : 0.1), j + 0.02, 0.03, 0.04, 16, "metal", 28, {cls:"s", r:0}); });
}

/* 탕비실 · 수면실 · 화장실 */
function buildLounge(){
  // 상부장 · 메뉴판 · 사인
  faceJ(25.15, 27.9, 0.0, 62, 84, D2("#FFFFFF", "#4A4038"), "m", 0.28); [26.06, 26.98].forEach(i => faceJ(i - 0.006, i + 0.006, 0.29, 62, 84, sh("wall-top", -0.2), "m", 0.004));
  faceJ(25.25, 26.75, 0.0, 44, 60, D2("#2E3A33", "#1F2924"), "m", 0.03); B(25.23, 0.0, 1.54, 0.04, 1.2, "#8B5A3C", 59, {r:0});
  wtext("TODAY'S BEAN", 26.0, 0.03, 57, "i", 3.6, "#F4E9D6", null, 800);
  wtext("에티오피아 예가체프", 26.0, 0.03, 52.2, "i", 3.1, "#E8A04A", null, 700, FONT);
  wtext("라떼 · 아메리카노 · 콜드브루", 26.0, 0.03, 48, "i", 2.6, "rgba(244,233,214,.8)", null, 600, FONT);
  wtext("PANTRY", 26.5, 0, 98, "i", 12, D2("#A5784F", "#F2D3AE"), null, 800);
  wtext("커피 · 간식 · 안마의자 · 수다", 26.5, 0, 89, "i", 5.5, "ink-2", null, 600, FONT);
  // 카운터 + 커피머신 + 싱크
  B(25.15, 0.05, 2.75, 0.6, 21, D2("#6B5646", "#2F2A26"), 0, {r:0.02}); B(25.1, 0.02, 2.85, 0.66, 2, D2("#F2EDE5", "#BDB5A9"), 21, {cls:"s", r:0.01});
  B(25.28, 0.14, 0.26, 0.3, 10, "#2A2A2A", 23, {cls:"s"}); B(25.31, 0.17, 0.2, 0.24, 7, "#5A3A26", 33);
  B(25.7, 0.1, 0.95, 0.45, 17, "#C9CDD2", 23, {cls:"s", r:0.03}); faceJ(25.72, 26.63, 0.55, 35, 37.4, "#E8A04A", "glow", 0.005);
  [25.8, 26.0, 26.2].forEach(i => B(i, 0.2, 0.13, 0.13, 3.2, "#FFFFFF", 41.5, {cls:"s"}));
  [25.95, 26.38].forEach(i => B(i, 0.55, 0.13, 0.1, 3.5, "#2A2A2A", 31, {cls:"s"}));
  [26.8, 27.0].forEach(i => B(i, 0.25, 0.14, 0.14, 4, "#FFFFFF", 23, {cls:"s"})); B(26.9, 0.3, 0.14, 0.14, 4, "#E8A04A", 27, {cls:"s"});
  B(27.3, 0.15, 0.5, 0.3, 3, "#E8E4DC", 23, {cls:"s"}); B(27.35, 0.2, 0.4, 0.2, 1, "#7FB0C9", 25, {cls:"s"});
  // 양문형 냉장고 (닫힘 + 메모)
  const a = 28.05, b = 28.9, J = 0.78, FH = 63;
  B(a, 0.08, b - a, J - 0.08, FH, D2("#F2F3F5", "#5E636A"), 0, {cls:"s", r:0.03});
  faceJ(28.47, 28.48, J, 2.4, FH, D2("#8E949A", "#26282C"), "m", 0.006);
  [28.44, 28.51].forEach(i => B(i - 0.012, J, 0.024, 0.03, 26, D2("#B4BAC1", "#9AA1A8"), 22, {cls:"s", r:0}));
  faceJ(28.6, 28.8, J, 29, 43, D2("#3B4046", "#1E2125"), "s", 0.006); faceJ(28.585, 28.815, J, 46, 57.5, "#FFFFFF", "m", 0.006);
  faceJ(28.12, 28.27, J, 43, 50.5, "#FFE58A", "m", 0.006); wtext("우유!", 28.195, J + 0.005, 46.6, "i", 2.5, "#8A6A1E", null, 800, FONT);
  // 간식 벽장
  B(28.25, 2.75, 0.6, 1.6, 52, D2("#5C6B8A", "#3A3F4A"), 0, {r:0.02});
  [[2.85,8,"#E8A04A"],[2.85,18,"#E06A55"],[2.85,28,"#72C4AE"],[2.85,38,"#FFE58A"],[3.38,8,"#FFE58A"],[3.38,18,"#7FA7D9"],[3.38,28,"#F4A7B9"],[3.38,38,"#E8A04A"],[3.86,8,"#C8B4D0"],[3.86,18,"#E8A04A"],[3.86,28,"#E06A55"],[3.86,38,"#72C4AE"]]
    .forEach(([j,z,c]) => B(28.82, j, 0.1, 0.45, 7, c, z, {r:0.01}));
  wtext("FREE SNACK", 28.85, 3.55, 50, "j", 3.4, "#FFFFFF", null, 800);
  // 원형 테이블 + 의자 + 과일
  sm(cyl(0.05, 0.05, hz(15), 8), "metal", X(26.6), hz(7.5), Z(3.6), SROOT, "s"); sm(cyl(0.55, 0.55, hz(3), 28), D2("#C9A27A", "#5A4636"), X(26.6), hz(16.5), Z(3.6));
  [[26.37,3.42,"#FFFFFF"],[26.92,3.82,"#E8A04A"]].forEach(([i,j,c]) => B(i - 0.07, j - 0.07, 0.14, 0.14, 4, c, 18, {cls:"s"}));
  sm(cyl(0.16, 0.13, 0.07, 14), D2("#E8DCC8", "#7A6A55"), X(26.67), hz(18) + 0.035, Z(3.6));
  [[26.58,3.55,"#E06A55"],[26.72,3.52,"#FFC94A"],[26.65,3.66,"#8BC34A"],[26.78,3.65,"#E06A55"]].forEach(([i,j,c]) => sm(sph(0.055, 10, 8), c, X(i), hz(18) + 0.1, Z(j)));
  [[25.75,3.6],[27.45,3.6],[26.6,4.5]].forEach(([i,j]) => { B(i - 0.04, j - 0.04, 0.08, 0.08, 9, "metal", 0, {cls:"s"}); sm(cyl(0.22, 0.22, hz(3), 18), "#E8A04A", X(i), hz(10.5), Z(j)); });
  // 안마의자 · 빈백
  const body = D2("#3A3A3E", "#2C2C30");
  B(26.88, 5.55, 0.84, 1.05, 6, D2("#2A2A2E", "#1E1E22"), 0, {r:0.06}); B(26.95, 5.62, 0.7, 0.82, 4, body, 6, {r:0.06, seg:2});
  B(26.92, 5.42, 0.76, 0.24, 34, body, 6, {r:0.08, seg:2}); B(26.97, 5.655, 0.66, 0.035, 26, "#E8A04A", 12, {r:0.01});
  B(26.88, 5.62, 0.14, 0.86, 9, body, 10, {r:0.05}); B(27.58, 5.62, 0.14, 0.86, 9, body, 10, {r:0.05}); B(26.98, 6.42, 0.64, 0.32, 3, body, 2, {r:0.04});
  sm(sph(0.42, 18, 12), "#C98436", X(26.25), 0.17, Z(6.2)).scale.set(1, 0.48, 1); sm(sph(0.34, 16, 10), "#E8A04A", X(26.2), 0.3, Z(6.15)).scale.set(1, 0.45, 1);
  // 수면실 침대 3 + 무드등
  [[25.35,10.0],[26.6,10.0],[27.85,10.0]].forEach(([i,j]) => { const w = 0.95, d = 1.8;
    B(i, j, w, d, 6, D2("#B79572", "#4A4038"), 0, {r:0.04}); B(i + 0.04, j + 0.04, w - 0.08, d - 0.08, 5, D2("#FFFFFF", "#D8D4CC"), 6, {r:0.05, seg:2});
    B(i + 0.12, j + 0.08, w - 0.24, 0.38, 3, D2("#F4F1EC", "#E6E2DA"), 11, {r:0.06, seg:2}); B(i + 0.06, j + 0.75, w - 0.12, d - 0.85, 1.5, "#8E9BC0", 11, {r:0.03}); });
  B(28.5, 13.35, 0.5, 0.5, 13, D2("#B79572", "#4A4038"), 0, {r:0.03}); sm(cyl(0.08, 0.1, hz(8), 12), "#F3E3B0", X(28.75), hz(17), Z(13.6), SROOT, "glow");
  // 말씀 액자 (2026-11-23 감독님 "행복한 크리스찬 회사") — 골로새서 3:23 개역개정
  faceJ(11.95, 13.55, 0.0, 46, 96, D2("#8B5A3C", "#5A3E2C"), "m", 0.04);
  decal(R.atlas, 336, 316, (c, W, H, dark) => {
    c.fillStyle = dark ? "#E6DDCD" : "#FBF6EC"; c.fillRect(0, 0, W, H);
    c.strokeStyle = "#C9A27A"; c.lineWidth = 3; c.strokeRect(12, 12, W - 24, H - 24);
    c.fillStyle = "#E8A04A"; c.fillRect(W / 2 - 2.5, 30, 5, 30); c.fillRect(W / 2 - 11, 39, 22, 5);
    c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = "#3A2E25";
    const L = ["무슨 일을 하든지", "마음을 다하여 주께 하듯 하고", "사람에게 하듯 하지 말라"];
    L.forEach((s, k) => { let fs = 27; do { c.font = `700 ${fs}px ${FONT}`; fs--; } while(c.measureText(s).width > W - 56); c.fillText(s, W / 2, 104 + k * 50); });
    c.font = `600 19px ${FONT}`; c.fillStyle = "#8B5A3C"; c.fillText("골로새서 3:23", W / 2, H - 46); },
    1.46, hz(46), "i", 12.75, 0.04, hz(71));
  // 화장실 칸 3 + 세면대
  const panel = D2("#F4F2EE", "#3A4046"), door = D2("#8FC3B5", "#4E8F86"), SH = 46;
  [25.95, 26.97, 27.99].forEach((i0, k) => { const i1 = i0 + 1.01, ci = (i0 + i1) / 2, j0 = 14.75, j1 = 16.35;
    faceJ(i0, i1, j0, 0, SH, D2("#DCE6E8", "#2F353A"), "m", 0.02);
    B(ci - 0.2, j0 + 0.05, 0.4, 0.18, 16, "#FFFFFF", 0, {cls:"s", r:0.04}); B(ci - 0.17, j0 + 0.23, 0.34, 0.42, 7, "#FFFFFF", 0, {cls:"s", r:0.06});
    B(i0, j0, 0.05, j1 - j0, SH, panel, 0, {r:0}); if(k === 2) B(i1 - 0.05, j0, 0.05, j1 - j0, SH, panel, 0, {r:0});
    faceI(i0 + 0.07, j1, j1 + 0.62, 3, SH - 3, door, "m", 0.03);
    sm(sph(0.025, 6, 4), "#5FBF7A", X(i1 - 0.16), hz(30), Z(j1) + 0.01, SROOT, "glow"); });
  B(25.95, 14.6, 3.05, 0.15, SH, panel, 0, {r:0}); faceJ(25.95, 29.0, 16.36, SH + 1, SH + 9, "#2A2A28", "m", 0.02);
  wtext("RESTROOM · 화장실", 27.475, 16.38, SH + 5, "i", 4.2, "#FFFFFF", null, 700, FONT);
  B(26.2, 18.55, 2.4, 0.6, 20, D2("#5E7F86", "#3A3F44"), 0, {r:0.03}); B(26.15, 18.52, 2.5, 0.66, 2, D2("#F7F7F5", "#C9CFD2"), 20, {cls:"s", r:0.01});
  [26.75, 27.95].forEach(i => { sm(cyl(0.2, 0.16, 0.05, 18), D2("#D6E2E6", "#8FA3AB"), X(i), hz(22) + 0.01, Z(18.85), SROOT, "s"); sm(cyl(0.012, 0.012, hz(6), 6), "#B5B9BE", X(i), hz(25), Z(19.08), SROOT, "s"); });
  B(27.3, 18.95, 0.12, 0.12, 4, "#E8B5C8", 22, {cls:"s"}); B(28.3, 18.9, 0.2, 0.16, 3, "#FFFFFF", 22);
}

/* 대표실 겸 감독방 */
function buildCeo(){
  const dWood = D2("#5E4130", "#4A3526"), sofa = sh("c-prod", -0.15).map((c, k) => k ? shade(T["c-prod"][1], -0.35) : c);
  // 복도 쪽 낮은 유리 (문 자리 i 29~30.3 비움)
  faceJ(30.3, WI, 7.0, 0, 4, D2("#CFC6B8", "#3A3530"), "m", 0.05); faceJ(30.3, WI, 7.0, 4, 40, D2("#CDDEEE", "#96AAD2"), "glass", 0.03);
  B(30.3, 6.98, WI - 30.3, 0.06, 1.6, "frame", 39, {r:0}); for(let i = 30.3; i < WI + 0.01; i += 0.65) B(Math.min(i, WI - 0.04), 6.98, 0.04, 0.06, 40, "frame", 0, {r:0});
  faceJ(31.6, 34.2, 7.03, 30, 38, "#2A2A28", "m", 0.01); wtext("대표실 · 감독방", 32.9, 7.05, 34, "i", 4.4, "#F2D3A0", null, 700, FONT);
  wtext("DIRECTOR'S ROOM", 30.1, 0, 104, "i", 5.4, D2("#8B5A3C", "#F2D3A0"), null, 800);
  // 칠판: 오늘 할 일 (시안은 날짜만, 실제는 타워 할 일)
  faceJ(31.15, 34.8, 0.0, 24, 100, D2("#9A9A96", "#77736D"), "s", 0.04); faceJ(31.22, 34.73, 0.04, 26, 98, D2("#FBFAF7", "#E9E7E2"), "s", 0.01);
  B(31.4, 0.02, 3.2, 0.12, 1.6, "metal", 25, {cls:"s", r:0}); [["#E8A04A",31.6],["#3A8A78",31.9],["#2A2A28",32.2]].forEach(([c,i]) => B(i, 0.05, 0.22, 0.06, 1.2, c, 26.6, {r:0}));
  const today = new Date(), wd = "일월화수목금토"[today.getDay()];
  decal(R.atlas, 560, 520, (c, W, H) => { c.font = `800 54px ${FONT}`; c.fillStyle = "#2A2A28"; c.textBaseline = "top"; c.fillText(`${today.getMonth() + 1}/${today.getDate()} ${wd}`, 18, 18);
    c.fillStyle = "#E6E1D8"; c.fillRect(18, 98, W - 36, 9); c.fillStyle = "#E8A04A"; c.fillRect(18, 98, (W - 36) * 0.4, 9);
    [0,1,2,3].forEach(k => { const y = 140 + k * 82; c.strokeStyle = "#8A857C"; c.lineWidth = 3; c.strokeRect(18, y, 34, 34); c.fillStyle = "#D9D4CB"; c.fillRect(70, y + 10, [300,240,330,200][k], 14); }); },
    3.4, hz(70), "i", 32.97, 0.06, hz(61));
  // 보고함 (코르크)
  faceJ(34.98, 35.95, 0.0, 26, 92, "#B98B55", "m", 0.04); faceJ(35.05, 35.88, 0.04, 30, 88, "#D8B27C", "m", 0.01);
  wtext("보고함", 35.47, 0.05, 98, "i", 5.6, D2("#5A4636", "#B3AA9C"), null, 800, FONT);
  faceJ(35.25, 35.68, 0.05, 52, 68, "#D6EFD9", "m", 0.006); wtext("✓", 35.47, 0.06, 60, "i", 8, "#3F9A5B", null, 800, FONT);
  // 책장 (책 · 트로피 · 카메라)
  B(31.4, 0.05, 3.2, 0.45, 14, dWood, 0, {r:0.02});
  [[31.55,"#E8A04A",7],[31.67,"#3A8A78",8],[31.79,"#FAF7F2",6.5],[31.9,"#8B5A3C",7.5]].forEach(([i,c,h]) => B(i, 0.12, 0.1, 0.3, h, c, 14, {r:0}));
  B(32.5, 0.12, 0.24, 0.24, 3, "#2A2A28", 14); B(32.57, 0.19, 0.1, 0.1, 8, "#C9A64A", 17, {cls:"s"}); B(32.52, 0.14, 0.2, 0.2, 4, "#E8C463", 25, {cls:"s"});
  B(33.6, 0.1, 0.55, 0.3, 9, "#1E1E1E", 14, {cls:"s"}); [33.72, 34.02].forEach(i => { const l = sm(cyl(0.12, 0.12, 0.06, 18), "#2A2A2A", X(i + 0.06), hz(29), Z(0.36), SROOT, "s"); l.rotation.x = Math.PI / 2; });
  // 감독 의자 + 책상
  B(32.96, 2.12, 0.08, 0.08, 11, "metal", 0, {cls:"s"}); B(32.7, 2.05, 0.6, 0.55, 3, "#2A2522", 11, {r:0.06}); B(32.68, 1.88, 0.64, 0.16, 34, "#2A2522", 12, {r:0.06, seg:2}); B(32.78, 1.88, 0.44, 0.16, 8, "#3A322D", 46, {r:0.06});
  B(31.4, 2.9, 3.2, 0.95, 15, dWood, 0, {r:0.03}); B(31.35, 2.85, 3.3, 1.05, 3, sh(dWood, 0.12), 15, {r:0.02});
  faceJ(32.25, 33.75, 3.9, 5, 11, "#C9A64A", "s", 0.01); wtext("대표 · 감독 윤창용", 33.0, 3.915, 8, "i", 3.4, "#3A2A1A", null, 700, FONT);
  B(31.75, 3.02, 0.4, 0.3, 1, "metal", 18, {cls:"s"}); B(31.91, 3.04, 0.08, 0.08, 15, "metal", 19, {cls:"s"}); B(31.5, 2.97, 1.1, 0.07, 22, D2("#C9CDD2", "#9EA2A8"), 25, {cls:"s", r:0.02});
  R.screens.push({id:"_dir", p:[X(32.05), hz(36), Z(2.962)], w:1.0, h:hz(19), ry:Math.PI});
  B(32.7, 2.95, 0.6, 0.38, 0.8, "#F4EFE6", 18); B(33.75, 3.0, 0.55, 0.4, 1.4, "#1E1E1E", 18, {cls:"s"});
  B(33.0, 3.4, 0.7, 0.42, 2.2, D2("#7A5A40", "#5A4636"), 18); B(33.06, 3.46, 0.58, 0.3, 2.4, "#FFFFFF", 18.8);
  B(32.35, 3.5, 0.16, 0.16, 4, D2("#FAF7F2", "#D9D2C6"), 18, {cls:"s"});
  // 니콘 앰버서더 패
  B(31.42, 3.6, 0.62, 0.16, 1.2, "#1E1E1E", 15); faceJ(31.46, 32.0, 3.68, 16.2, 31, "#FFE100", "m", 0.02); faceJ(31.46, 32.0, 3.70, 16.2, 18.6, "#1E1E1E", "m", 0.004);
  wtext("NIKON", 31.73, 3.705, 26, "i", 4.3, "#1E1E1E", null, 900); wtext("AMBASSADOR", 31.73, 3.705, 21.4, "i", 2.35, "#1E1E1E", null, 800);
  // 촬영 코너 · 감독 의자 · 소파 · 테이블
  camRig(30.95, 4.3, "-i");
  { const wd = "#8B5A3C"; [[31.12,5.5],[31.68,5.5],[31.12,5.95],[31.68,5.95]].forEach(([i,j], k) => B(i - 0.02, j - 0.02, 0.04, 0.04, k < 2 ? 14 : 34, wd, 0, {r:0}));
    B(31.1, 5.47, 0.6, 0.46, 1.2, "#1E1E1E", 14, {r:0}); faceJ(31.12, 31.68, 5.93, 23, 33, "#1E1E1E", "m", 0.02); wtext("DIRECTOR", 31.4, 5.955, 28, "i", 3.6, "#FFFFFF", null, 800); }
  B(34.0, 4.5, 1.8, 0.8, 9, sofa, 0, {r:0.07, seg:2}); B(34.0, 4.5, 1.8, 0.22, 16, sh(sofa, -0.08), 9, {r:0.07, seg:2});
  [34.15, 34.95].forEach(i => B(i, 4.72, 0.7, 0.5, 4, sh(sofa, 0.1), 9, {r:0.06, seg:2})); B(34.0, 4.5, 0.16, 0.8, 16, sh(sofa, -0.12), 0, {r:0.06}); B(35.64, 4.5, 0.16, 0.8, 16, sh(sofa, -0.12), 0, {r:0.06});
  B(34.25, 4.66, 0.36, 0.1, 8, "#E8A04A", 13, {r:0.03});
  [[34.45,5.75],[35.3,5.75],[34.45,6.2],[35.3,6.2]].forEach(([a,b]) => B(a, b, 0.06, 0.06, 8, "metal", 0, {cls:"s"}));
  B(34.4, 5.7, 1.0, 0.56, 2, "wood", 8, {r:0.02}); B(34.55, 5.8, 0.36, 0.26, 1, "#FFFFFF", 10); B(35.05, 5.85, 0.13, 0.13, 3, "#FAF7F2", 10, {cls:"s"});
}

/* 조명: 책상 위 막대등 · 둥근 펜던트 */
function buildLamps(ok){
  const glowC = D2("#FFF3D6", "#FFD9A0"), cord = h => Math.min(hz(146), WALL_H + 0.1) - h;
  LAMPS_BAR.filter(([a,b]) => ok(a, b)).forEach(([a,b,c,d]) => { const y = hz(100), len = c - a;
    sm(rbox(len, 0.05, 0.08, 0.02), D2("#8A857C", "#3A3632"), X((a + c) / 2), y, Z(b), SROOT, "s");
    sm(rbox(len - 0.08, 0.02, 0.05, 0), glowC, X((a + c) / 2), y - 0.04, Z(b), SROOT, "glow");
    [a + 0.1, c - 0.1].forEach(i => sm(cyl(0.009, 0.009, cord(y), 4), D2("#B5AFA5", "#5A554E"), X(i), y + cord(y) / 2, Z(b), SROOT, "s")); });
  LAMPS_DOME.filter(([i,j]) => ok(i, j)).forEach(([i,j]) => { const y = hz(104);
    const s = sm(geo("dome", () => new THREE.SphereGeometry(0.26, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2)), D2("#EFE8DC", "#4A443C"), X(i), y, Z(j), SROOT, "s"); s.scale.y = 0.75;
    sm(cyl(0.22, 0.22, 0.012, 16), glowC, X(i), y - 0.005, Z(j), SROOT, "glow");
    sm(cyl(0.009, 0.009, cord(y), 4), D2("#B5AFA5", "#5A554E"), X(i), y + cord(y) / 2, Z(j), SROOT, "s"); });
}

/* ---------- 사람: 도형 조립 인형 (tower3d.js makePerson 그대로 + 치마·헤드폰·리본) → 같은 도형끼리 인스턴싱 ---------- */
const PARTS = [], HAIR_STYLES = ["pig", "long", "bob", "pony", "twin", "braid", "bun"];
function makePerson(look, b = {}, extra = {}){
  const mesh = (g, c, x = 0, y = 0, z = 0, parent, cls = "p") => { const o = new THREE.Object3D(); o.position.set(x, y, z); parent.add(o); PARTS.push({o, g, c, cls}); return o; };
  const W = b.w || 1;
  const root = new THREE.Group(); root.scale.setScalar((b.h || 1) * PSCALE);
  const hips = new THREE.Group(); hips.position.y = 0.9; root.add(hips);
  const legC = look.legs || look.pants;
  mesh(rbox(0.34 * W, 0.2, 0.24, 0.09, 2), look.skirt || look.pants, 0, 0, 0, hips);
  if(look.skirt){ const L = look.skirtL || 0.34; mesh(cyl(0.2 * W, (0.2 + 0.2 * L) * W, L, 14), look.skirt, 0, 0.03 - L / 2, 0, hips); }
  const legs = [-1, 1].map(s => {
    const hip = new THREE.Group(); hip.position.set(s * 0.095 * W, -0.02, 0); hips.add(hip);
    mesh(cap(0.078, 0.28), look.thigh || (look.skirt ? legC : look.pants), 0, -0.2, 0, hip);
    const knee = new THREE.Group(); knee.position.y = -0.41; hip.add(knee);
    mesh(cap(0.068, 0.3), legC, 0, -0.2, 0, knee);
    mesh(rbox(0.14, 0.09, 0.24, 0.04, 2), look.shoe || b.shoe || "#2E2A28", 0, -0.43, 0.045, knee);
    return {hip, knee};
  });
  const chest = new THREE.Group(); chest.position.y = 0.06; hips.add(chest);
  mesh(rbox(0.4 * W, 0.52, 0.27, 0.12, 2), look.shirt, 0, 0.26, 0, chest);
  mesh(cyl(0.06, 0.065, 0.1, 10), look.skin, 0, 0.56, 0, chest);
  if(look.scarf){ const sc = mesh(geo("scarf", () => new THREE.TorusGeometry(0.085, 0.035, 6, 14)), look.scarf, 0, 0.53, 0.01, chest); sc.rotation.x = Math.PI / 2; }
  if(look.badge) mesh(rbox(0.06, 0.04, 0.02, 0), "#F2D35A", 0.1 * W, 0.4, 0.14, chest);
  const head = new THREE.Group(); head.position.y = 0.6; chest.add(head);
  mesh(sph(0.21, 22, 16), look.skin, 0, 0.19, 0, head).scale.set(1, 1.04, 0.97);
  [-1, 1].forEach(s => { mesh(sph(0.023, 8, 6), "#2A211D", s * 0.075, 0.205, 0.188, head).scale.set(1, 1.25, 0.6);
    mesh(sph(0.036, 10, 6), "#F39A9A", s * 0.125, 0.14, 0.16, head, "ck").scale.set(1, 0.6, 0.4); });
  mesh(sph(0.026, 8, 6), look.skin, 0, 0.165, 0.205, head);
  const smile = mesh(geo("smile", () => new THREE.TorusGeometry(0.034, 0.008, 5, 12, Math.PI)), "#7A3B34", 0, 0.115, 0.19, head); smile.rotation.z = Math.PI; smile.rotation.x = -0.25;
  const hc = mesh(geo("hairCap", () => new THREE.SphereGeometry(0.228, 22, 12, 0, Math.PI * 2, 0, Math.PI * 0.5)), look.hair, 0, 0.2, -0.008, head); hc.rotation.x = -0.42; hc.scale.set(1, 1.06, 1);
  PARTS[PARTS.length - 1].hair = 1;
  /* 머리 모양 (2026-11-28 감독님 "꾸미기": 유나는 extra.hairAll 로 전부 만들어 두고 PL.hair 인 것만 보임) */
  const rib = look.ribbon || (extra.hairAll ? "#FF8FB8" : null);
  const hairStyle = st => { const k0 = PARTS.length;
    if(st === "long"){ mesh(rbox(0.42, 0.5, 0.13, 0.06, 2), look.hair, 0, 0.02, -0.13, head); [-1, 1].forEach(s => mesh(cap(0.055, 0.3), look.hair, s * 0.19, 0.03, -0.03, head)); }
    else if(st === "bun"){ mesh(sph(0.1, 12, 10), look.hair, 0, 0.36, -0.16, head); mesh(rbox(0.4, 0.2, 0.12, 0.06, 2), look.hair, 0, 0.14, -0.13, head); }
    else if(st === "bob"){   // 단발: 뒤통수를 둥글게 감싸는 한 덩어리 (네모 판이 상자처럼 보여서, 2026-11-26)
      mesh(geo("bobBack", () => new THREE.SphereGeometry(0.236, 22, 14, Math.PI * 0.82, Math.PI * 1.36, Math.PI * 0.22, Math.PI * 0.56)), look.hair, 0, 0.17, -0.025, head).scale.set(1.02, 1.0, 0.98); }
    else if(st === "pig"){ [-1, 1].forEach(s => { mesh(sph(0.08, 12, 8), look.hair, s * 0.25, 0.12, -0.08, head); if(rib){ mesh(sph(0.045, 8, 6), rib, s * 0.22, 0.2, -0.05, head); PARTS[PARTS.length - 1].rib = 1; } }); }
    else if(st === "pony"){   // 포니테일: 뒤통수 위에서 묶어 내려옴
      mesh(sph(0.075, 12, 10), look.hair, 0, 0.33, -0.2, head); const t = mesh(cap(0.058, 0.24), look.hair, 0, 0.13, -0.3, head); t.rotation.x = -0.32;
      mesh(sph(0.05, 10, 8), look.hair, 0, -0.03, -0.33, head); if(rib){ mesh(sph(0.042, 8, 6), rib, 0, 0.35, -0.255, head); PARTS[PARTS.length - 1].rib = 1; } }
    else if(st === "twin"){   // 만두머리 둘
      [-1, 1].forEach(s => { mesh(sph(0.088, 14, 10), look.hair, s * 0.15, 0.41, -0.05, head); if(rib){ const r = mesh(geo("bunTie", () => new THREE.TorusGeometry(0.058, 0.017, 6, 14)), rib, s * 0.135, 0.365, -0.045, head); r.rotation.x = Math.PI / 2; r.rotation.y = s * 0.3; PARTS[PARTS.length - 1].rib = 1; } }); }
    else if(st === "braid"){   // 양쪽으로 땋아 내린 머리
      [-1, 1].forEach(s => { for(let k = 0; k < 5; k++) mesh(sph(0.058 - k * 0.005, 10, 8), look.hair, s * (0.215 + k * 0.006), 0.07 - k * 0.078, 0.01 + k * 0.012, head).scale.set(1, 0.92, 1);
        if(rib){ mesh(sph(0.04, 8, 6), rib, s * 0.245, -0.3, 0.065, head); PARTS[PARTS.length - 1].rib = 1; } }); }
    for(let k = k0; k < PARTS.length; k++){ if(!PARTS[k].rib) PARTS[k].hair = 1; if(extra.hairAll) PARTS[k].hs = st; } };
  if(extra.hairAll) HAIR_STYLES.forEach(hairStyle); else hairStyle(look.style);
  if(look.hat === "bucket"){ mesh(cyl(0.205, 0.235, 0.17, 20), look.hatC || "#CDBB9A", 0, 0.36, -0.01, head); mesh(cyl(0.34, 0.36, 0.025, 22), look.hatC || "#CDBB9A", 0, 0.275, -0.01, head).rotation.x = -0.08; }
  if(look.hat === "crown"){ mesh(cyl(0.1, 0.09, 0.07, 12), "#F2C94C", 0, 0.425, -0.03, head);
    for(let k = 0; k < 5; k++){ const a = k / 5 * Math.PI * 2; mesh(sph(0.024, 8, 6), k % 2 ? "#FF8FB8" : "#FFFFFF", Math.sin(a) * 0.095, 0.475, -0.03 + Math.cos(a) * 0.095, head); } }
  if(extra.headphones === "max"){ const cup = extra.hpC || "#D5D9DE";
    mesh(geo("hpmax", () => new THREE.TorusGeometry(0.245, 0.034, 6, 20, Math.PI)), "#F1F2F4", 0, 0.2, 0, head);
    [-1, 1].forEach(s => { mesh(rbox(0.09, 0.17, 0.14, 0.04, 2), cup, s * 0.25, 0.16, 0, head); mesh(cyl(0.013, 0.013, 0.09, 6), "#C2C6CC", s * 0.25, 0.28, 0, head); }); }
  else if(extra.headphones){ const hb = mesh(geo("hp", () => new THREE.TorusGeometry(0.235, 0.022, 6, 18, Math.PI)), "#2A2A2C", 0, 0.2, 0, head); hb.rotation.y = 0;
    [-1, 1].forEach(s => mesh(cyl(0.065, 0.065, 0.05, 12), "#2A2A2C", s * 0.225, 0.19, 0, head).rotation.z = Math.PI / 2); }
  const arms = [-1, 1].map(s => {
    const sh0 = new THREE.Group(); sh0.position.set(s * (0.2 * W + 0.055), 0.46, 0); chest.add(sh0);
    mesh(cap(0.058, 0.17), look.sleeve || look.shirt, 0, -0.12, 0, sh0);
    const el = new THREE.Group(); el.position.y = -0.27; sh0.add(el);
    mesh(cap(0.05, 0.16), look.skin, 0, -0.12, 0, el);
    mesh(sph(0.056, 10, 8), look.skin, 0, -0.26, 0.005, el);
    return {sh:sh0, el};
  });
  return {root, hips, chest, head, legs, arms};
}
/* 자세 (tower3d.js pose 그대로, 앉은 엉덩이 높이만 2.5D 의자에 맞춤) */
function pose(p, kind, t, opt = {}){
  const {hips, chest, head, legs, arms} = p;
  hips.position.y = 0.9; hips.rotation.set(0, 0, 0); chest.rotation.set(0, 0, 0); head.rotation.set(0, 0, 0);
  legs.forEach(l => { l.hip.rotation.set(0, 0, 0); l.knee.rotation.set(0, 0, 0); });
  arms.forEach((a, k) => { a.sh.rotation.set(0, 0, (k ? -1 : 1) * 0.07); a.el.rotation.set(0, 0, 0); });
  chest.scale.set(1, 1 + (reduce ? 0 : Math.sin(t * 1.6 + (opt.ph || 0)) * 0.012), 1);
  if(kind === "sit" || kind === "type" || kind === "tablet" || kind === "stretch"){
    hips.position.y = opt.seatY ?? 0.6;
    legs.forEach((l, k) => { l.hip.rotation.x = -Math.PI / 2 + 0.05; l.hip.rotation.y = (k ? 1 : -1) * 0.06; l.knee.rotation.x = Math.PI / 2 - 0.25; });
    chest.rotation.x = 0.04;
  }
  if(kind === "type"){
    chest.rotation.x = 0.1;
    arms.forEach((a, k) => { const tap = reduce ? 0 : Math.sin(t * 11 + k * 1.7) * 0.06 * (Math.sin(t * 0.9 + k) > -0.3 ? 1 : 0);
      a.sh.rotation.set(-0.95 + tap * 0.5, 0, (k ? -1 : 1) * 0.12); a.el.rotation.set(-0.75 + tap, 0, (k ? 1 : -1) * 0.2); });
    head.rotation.x = 0.08 + (reduce ? 0 : Math.sin(t * 0.5 + (opt.ph || 0)) * 0.03);
  }
  if(kind === "tablet"){
    arms.forEach((a, k) => { a.sh.rotation.set(-0.5, 0, (k ? -1 : 1) * 0.18); a.el.rotation.set(-1.25, 0, (k ? 1 : -1) * 0.45); });
    head.rotation.x = 0.28 + (reduce ? 0 : Math.sin(t * 0.4) * 0.04);
  }
  if(kind === "stretch"){ const u = opt.u ?? 1;
    arms.forEach((a, k) => { a.sh.rotation.set(0, 0, (k ? -1 : 1) * (0.07 + u * 2.9)); a.el.rotation.set(0, 0, (k ? -1 : 1) * u * 0.25); });
    chest.rotation.x = -0.12 * u; head.rotation.x = -0.3 * u; }
  if(kind === "walk"){ const s = Math.sin(opt.step || 0), c = Math.cos(opt.step || 0);
    legs.forEach((l, k) => { const q = k ? -s : s; l.hip.rotation.x = q * 0.5; l.knee.rotation.x = Math.max(0, -q) * 0.7 + 0.08; });
    arms.forEach((a, k) => { const q = k ? s : -s; a.sh.rotation.x = q * 0.45; a.el.rotation.x = -0.25; });
    hips.position.y = 0.9 + Math.abs(c) * 0.035; }
  if(kind === "shuffle"){ const s = Math.sin(opt.step || 0), c = Math.cos(opt.step || 0), L = Math.min(1, Math.abs(opt.lat || 0) * 1.3), F = opt.fwd || 0;   // 테니스 옆걸음: 무릎 굽히고 다리를 옆으로 벌렸다 모음
    legs.forEach((l, k) => { const q = k ? -s : s; l.hip.rotation.z = (k ? -1 : 1) * (0.12 + Math.abs(q) * 0.38) * L; l.hip.rotation.x = -0.3 + q * 0.45 * (1 - L) * Math.sign(F || 1); l.knee.rotation.x = 0.5 + Math.max(0, -q) * 0.35; });
    chest.rotation.x = 0.16; chest.rotation.z = Math.sin(opt.step || 0) * 0.05 * L; hips.position.y = 0.82 + Math.abs(c) * 0.05; }
  if(kind === "stand" && opt.hold){ arms[1].sh.rotation.x = -0.35; arms[1].el.rotation.x = -1.1; }
  if(opt.talk){ head.rotation.x += Math.sin(t * 7) * 0.05; arms[1].sh.rotation.x += -0.5 - Math.sin(t * 3) * 0.15; arms[1].el.rotation.x = -0.9; }
  if(opt.wave){ const w = Math.sin(t * 9); arms[0].sh.rotation.set(-0.2, 0, 2.5); arms[0].el.rotation.set(0, 0, 0.4 + w * 0.35); }
  if(opt.nod) head.rotation.x += Math.max(0, Math.sin(t * 5)) * 0.12;
  if(opt.turn) head.rotation.y = opt.turn;
  // 자리 · 선 자리에서 하는 작은 동작 (u = 0→1→0 세기)
  const u = opt.u ?? 1;
  if(opt.sip){ arms[1].sh.rotation.set(-1.35 * u, 0, -0.07 - 0.3 * u); arms[1].el.rotation.set(-1.95 * u, 0, 0); head.rotation.x = -0.12 * u; }
  if(opt.think){ arms[1].sh.rotation.set(-0.95 * u, 0, -0.07 - 0.4 * u); arms[1].el.rotation.set(-2.15 * u, 0, 0); head.rotation.x = 0.06; head.rotation.z = 0.1 * u; head.rotation.y = 0.15 * u; }
  if(opt.lean){ chest.rotation.x = 0.04 - 0.22 * u; head.rotation.x = -0.15 * u;
    arms.forEach((a, k) => { const sg = k ? -1 : 1; a.sh.rotation.set(-0.35 * u, 0, sg * (0.07 + 2.55 * u)); a.el.rotation.set(0, 0, sg * 1.75 * u); }); }
  if(opt.groove) head.rotation.x += Math.sin(t * 6.4 + (opt.ph || 0)) * 0.09, chest.rotation.z = Math.sin(t * 3.2) * 0.03;
  if(opt.phone){ arms.forEach((a, k) => { a.sh.rotation.set(-0.5, 0, (k ? -1 : 1) * 0.18); a.el.rotation.set(-1.25, 0, (k ? 1 : -1) * 0.45); }); head.rotation.x = 0.32; }
  if(opt.reach){ arms.forEach((a, k) => { a.sh.rotation.set(0, 0, (k ? -1 : 1) * (0.07 + u * 2.9)); a.el.rotation.set(0, 0, (k ? -1 : 1) * u * 0.25); }); chest.rotation.x = -0.12 * u; head.rotation.x = -0.3 * u; }
}
function batchPeople(){
  const PM = {p:new THREE.MeshStandardMaterial({color:0xffffff, roughness:0.68}), ck:new THREE.MeshStandardMaterial({color:0xffffff, roughness:0.8, transparent:true, opacity:0.5, depthWrite:false})};
  const groups = new Map();
  PARTS.forEach(pt => { const k = pt.g.uuid + "|" + pt.cls; if(!groups.has(k)) groups.set(k, []); groups.get(k).push(pt); });
  const c = new THREE.Color();
  R.pim = [...groups.values()].map(list => {
    const im = new THREE.InstancedMesh(list[0].g, PM[list[0].cls], list.length);
    im.castShadow = list[0].cls === "p"; im.receiveShadow = true; im.frustumCulled = false;
    list.forEach((pt, k) => { pt.im = im; pt.k = k; im.setColorAt(k, c.set(pt.c)); });
    im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); R.scene.add(im); return {im, list};
  });
}
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
function syncPeople(){
  if(R.pl) playPost();
  Object.values(R.people).forEach(P => { if(P.p.root.visible) P.p.root.updateMatrixWorld(true); });
  R.pim.forEach(({im, list}) => { list.forEach(pt => im.setMatrixAt(pt.k, pt.vis() ? pt.o.matrixWorld : ZERO)); im.instanceMatrix.needsUpdate = true; });
}

/* ---------- 사람 배치 ---------- */
function addPerson(info){
  const start = PARTS.length;
  const p = makePerson(info.look, info.build || {}, info);
  PARTS.slice(start).forEach(pt => pt.vis = () => p.root.visible);
  const tag = document.createElement("button"); tag.type = "button"; tag.className = "t3-tag";
  tag.innerHTML = "<i></i><b></b>"; tag.querySelector("b").textContent = info.name;
  tag.addEventListener("click", e => { e.stopPropagation(); select(info.id); });
  const bub = document.createElement("div"); bub.className = "t3-bub"; bub.hidden = true;
  const stem = document.createElement("div"); stem.className = "t3-stem"; stem.hidden = true;
  R.layer.append(stem, bub, tag);
  const P = R.people[info.id] = {id:info.id, info, p, tag, bub, stem, say:null, sayUntil:0, ph:Math.random() * 6, heading:0};
  return P;
}
function place(P, i, j, face){ P.p.root.position.set(X(i), 0, Z(j)); P.heading = face; P.p.root.rotation.set(0, face, 0); P.p.root.visible = true; P.home = [i, j, face]; }
function seatOf(r){ if(r.seat) return r.seat; const [di,dj,dw,dd] = r.desk; return [di + dw / 2, dj + dd + 0.45]; }
function setupPd(P){
  const r = P.info, st = r.status;
  if(st === "review"){ const n = Object.values(R.people).filter(q => q.info.status === "review" && q !== P && q.spot != null).length;
    const s = REVIEW_SPOTS[n]; if(s){ P.spot = n; place(P, s[0], s[1], Math.PI); P.mode = "stand"; return; } }
  if(st === "done"){ const [di,dj,dw] = r.desk, s = r.stand || [di + dw + 0.4, seatOf(r)[1]]; place(P, s[0], s[1], 0); P.mode = "stand"; return; }
  const [si, sj] = seatOf(r); place(P, si, sj, deskHead(r)); P.mode = "desk";
}
function setStatus(id, st){
  const P = R.people[id]; if(!P) return; P.info.status = st;
  P.tag.querySelector("i").style.background = P.info.hex || ST_COLOR[st] || ST_COLOR.idle;
  if(P.info.desk){ P.spot = null; P.err = null; P.chat = null; P.act = null; setupPd(P); }
  paintScreens();
}
function paintScreens(){
  const c = new THREE.Color();
  R.screens.forEach((s, k) => {
    let col;
    if(s.id === "_desk") col = cp(s.off)[R.dark ? 1 : 0];
    else if(s.id === "_dir") col = R.dark ? "#3A4458" : "#AEB8C8";
    else if(s.id === "_village"){ const st = R.people.prod?.info.status; col = st === "working" || st === "review" ? (R.dark ? "#B9804F" : "#D99A63") : cp("screen-off")[R.dark ? 1 : 0]; }   // 제작 PD가 일하면 비디오 빌리지 화면이 켜짐
    else { const st = (R.people[s.id] || R.spareWho?.[s.id])?.info.status; col = st && st !== "idle" ? ST_COLOR[st] : cp("screen-off")[R.dark ? 1 : 0];
      if(st && st !== "idle") c.set(col).lerp(new THREE.Color(R.dark ? 0x000000 : 0xffffff), R.dark ? 0.12 : 0.18), col = "#" + c.getHexString(); }
    R.scrIM.setColorAt(k, c.set(col));
  });
  if(R.scrIM.instanceColor) R.scrIM.instanceColor.needsUpdate = true;
}
function say(id, text, ms = 2900){ const P = R.people[id]; if(!P) return; P.say = text; P.sayUntil = clock() + ms; P.pri = P.sayUntil; }   // pri: 층 시뮬 혼잣말이 덮어쓰지 않게 (유나가 불렀는데 무시하던 것)
function select(id){
  R.sel = R.sel === id ? null : id;
  Object.values(R.people).forEach(P => P.tag.classList.toggle("on", P.id === R.sel));
  R.opts.onPick?.(R.sel ? R.people[R.sel].info : null);
}

/* 크레용 → 크레용팜 리뷰 세트 촬영 (노라 이사님은 4층으로 가서 방문 대신) */
function planVisit(now){
  const D = R.people._dir; if(!D) return;
  const v = R.visit || (R.visit = {state:"seat", next:now + 12000 + Math.random() * 15000});
  if(v.state === "seat" && now > v.next && !R.sel){ v.state = "in"; v.rev = true; v.path = DIR_REV_PATH.map(([i,j]) => new THREE.Vector3(X(i), 0, Z(j))); v.k = 0; }
  if(v.state === "talk" && now > v.until){ v.state = "out"; v.path = DIR_REV_PATH.slice().reverse().map(([i,j]) => new THREE.Vector3(X(i), 0, Z(j))); v.k = 0; }
}
function walk(P, v, dt){
  const pos = P.p.root.position, tgt = v.path[v.k + 1]; if(!tgt) return true;
  const d = tgt.clone().sub(pos); d.y = 0; const len = d.length(), sp = 1.0 * dt;
  if(len <= sp){ pos.copy(tgt); v.k++; return !v.path[v.k + 1]; }
  pos.addScaledVector(d.normalize(), sp);
  const want = Math.atan2(d.x, d.z); let da = want - P.heading; da = Math.atan2(Math.sin(da), Math.cos(da)); P.heading += da * Math.min(1, dt * 10);
  P.step = (P.step || 0) + sp * 6.4; return false;
}

/* ---------- 일하는 사람 움직임 (2026-11-21 감독님 "일하는 사람들 움직임 조금 있어도 재밌겠네") ----------
   자리: 타자 · 커피 한 모금 · 턱 괴고 생각 · 옆 보기 · 의자 살짝 돌리기 · 뒤로 젖히기 · 헤드폰이면 리듬
   가끔: 옆자리로 가서 짧게 수다 / 잠깐 서서 기지개·폰 보기 (한 번에 두 명까지) */
const PAIRS = [["edit","short"]];   // 섬 테이블 같은 쪽 옆자리 (2026-11-23)
const VISIT_TALKS = {
  farm:[["이 컷 어때요?","오 좋은데요 이대로 가요"],["자막 폰트 세방고딕 맞죠?","네 그거요"],["이번 릴스 조회수 봤어요?","헐 벌써?"],["감독님 피드백 왔어요","오 봐요 봐요"]],
  prod:[["렌더 몇 분 남았어요?","12분이요…"],["썸네일 시안 두 개 봐 주세요","왼쪽이요 무조건"],["내일 콜타임 몇 시예요?","7시 반이요"],["컬러 한 번만 봐 주세요","네 바로 볼게요"]],
  studio:[["토요일 대관 문의 또 왔어요","오 몇 시요?"],["후기 사진 받았어요?","네 방금요 예뻐요"],["구름 조명 하나 나갔대요","내일 갈게요"]],
};
const ease = v => v < 0.5 ? 2 * v * v : 1 - Math.pow(-2 * v + 2, 2) / 2;
function turnTo(P, want, dt, k = 8){ let da = want - P.heading; da = Math.atan2(Math.sin(da), Math.cos(da)); P.heading += da * Math.min(1, dt * k); P.p.root.rotation.y = P.heading; }
function nextAct(P, now){
  const idle = P.info.status === "idle", r = Math.random();
  let kind = idle ? (r < .28 ? "sit" : r < .44 ? "lean" : r < .58 ? "sip" : r < .72 ? "look" : r < .86 ? "swivel" : r < .94 ? "phone" : "stretch")
                  : (r < .5 ? "type" : r < .6 ? "sip" : r < .72 ? "think" : r < .82 ? "look" : r < .9 ? "swivel" : r < .96 ? "lean" : "stretch");
  if(P.info.headphones && !idle && kind === "type" && Math.random() < .5) kind = "groove";
  const long = kind === "type" || kind === "groove" || kind === "sit" || kind === "phone";
  P.act = {kind, t0:now, until:now + (long ? 5000 + Math.random() * 8000 : 2600 + Math.random() * 2400), side:Math.random() < .5 ? 1 : -1};
}
function deskLife(P, now, t, dt){
  const p = P.p, root = p.root, face = P.home[2];
  if(P.chat && now < P.chat.until){       // 옆자리 사람이 찾아오면 의자를 그쪽으로 돌림
    const v = P.chat.who.p.root.position; let da = Math.atan2(v.x - root.position.x, v.z - root.position.z) - face; da = Math.atan2(Math.sin(da), Math.cos(da));
    const want = face + Math.max(-1, Math.min(1, da)) * 0.75; root.rotation.y += (want - root.rotation.y) * Math.min(1, dt * 5);
    pose(p, "sit", t, {ph:P.ph, turn:Math.max(-0.5, Math.min(0.5, da * 0.35)), talk:P.chat.talk}); return; }
  P.chat = null;
  if(!P.act || now > P.act.until) nextAct(P, now);
  const a = P.act, u = ease(Math.sin(Math.PI * Math.min(1, (now - a.t0) / (a.until - a.t0))));
  root.rotation.y += (face + (a.kind === "swivel" ? Math.sin((now - a.t0) / 700) * 0.28 * u : 0) - root.rotation.y) * Math.min(1, dt * 6);
  const base = P.info.status === "idle" ? "sit" : "type";
  switch(a.kind){
    case "type": case "groove": pose(p, "type", t, {ph:P.ph, groove:a.kind === "groove"}); break;
    case "sit": pose(p, "sit", t, {ph:P.ph}); break;
    case "sip": pose(p, base, t, {ph:P.ph, sip:true, u}); break;
    case "think": pose(p, "type", t, {ph:P.ph, think:true, u}); break;
    case "lean": pose(p, "sit", t, {ph:P.ph, lean:true, u}); break;
    case "look": pose(p, base, t, {ph:P.ph, turn:a.side * 0.85 * u}); break;
    case "swivel": pose(p, "sit", t, {ph:P.ph, turn:a.side * 0.3 * u}); break;
    case "phone": pose(p, "tablet", t, {ph:P.ph}); break;
    case "stretch": pose(p, "stretch", t, {ph:P.ph, u}); break;
  }
}
function startErrand(P, now){
  const [si, sj, face] = P.home, bi = si - Math.sin(face) * 0.6, aj = sj - Math.cos(face) * 0.6, V = (i, j) => new THREE.Vector3(X(i), 0, Z(j));   // 앉은 방향 반대로 물러남
  const pr = PAIRS.find(q => q.includes(P.id)), mate = pr && R.people[pr[0] === P.id ? pr[1] : pr[0]];
  if(mate && mate.mode === "desk" && !mate.err && !mate.chat && (Math.random() < 0.65 || !P.info.stand)){
    const mi = mate.home[0], ti = mi + (mi > si ? -0.72 : 0.72), set = VISIT_TALKS[P.info.zone] || VISIT_TALKS.farm;
    P.err = {kind:"visit", mate, seat:[si, sj, face], state:"out", path:[V(si, sj), V(bi, aj), V(ti, aj)], k:0, talk:set[Math.random() * set.length | 0]}; return true; }
  if(P.info.stand){ const [ti, tj] = P.info.stand;
    P.err = {kind:"break", seat:[si, sj, face], state:"out", path:[V(si, sj), V(bi, aj), V(ti, tj)], k:0, act:Math.random() < 0.5 ? "reach" : "phone"}; return true; }
  return false;
}
/* 쉬러 가기: 화장실(칸 → 세면대) · 수면실 낮잠 · 커피머신 (2026-11-23 감독님 "낮잠이랑 화장실도 뜸하네 … 좀 활동적으로 해도 될듯") — 길은 2D 복도 동선 그대로 */
const TRIP = {
  wc: [25.95, 26.97, 27.99].map(i0 => ({pos:[i0 + 0.505, 15.5], face:Math.PI, act:"hide", dur:[8000, 11000], line:"화장실 잠깐 🚻"})),
  wash: [26.75, 27.95].map(i => ({pos:[i, 18.1], face:0, act:"wash", dur:[3200, 4200]})),
  nap: [25.35, 26.6, 27.85].map(i => ({pos:[i + 0.475, 12.3], face:Math.PI, act:"lie", bed:[i + 0.475, 10.0], dur:[26000, 42000], line:"잠깐 눈 좀 붙일게요 😴"})),
  coffee: [{pos:[26.2, 0.98], face:Math.PI, act:"brew", dur:[5500, 7000], line:"커피 한 잔 하고 올게요 ☕"}],
};
const LIEZ = (() => { let q = null; return () => { if(q) return q; const a = 0.16, y = new THREE.Vector3(-Math.cos(a), Math.sin(a), 0), z = new THREE.Vector3(Math.sin(a), Math.cos(a), 0), x = new THREE.Vector3().crossVectors(y, z);
  q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2).multiply(new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z))); return q; }; })();
const tripV = pts => pts.map(([i, j]) => new THREE.Vector3(X(i), 0, Z(j)));
const tripWay = (a, b) => [a, ...(R.opts.route ? R.opts.route(a, b) : [b])];
function freeTrip(type){ const busy = Object.values(R.people).flatMap(q => q.err?.stops || []), L = TRIP[type].filter(s => !busy.includes(s)); return L.length ? L[Math.random() * L.length | 0] : null; }
function startTrip(P, now, force){
  const r = Math.random(), idle = P.info.status === "idle";
  const s = freeTrip(force || (idle ? (r < 0.4 ? "nap" : r < 0.72 ? "wc" : "coffee") : (r < 0.55 ? "wc" : r < 0.9 ? "coffee" : "nap"))); if(!s) return false;
  const [si, sj, face] = P.home, back = [si - Math.sin(face) * 0.6, sj - Math.cos(face) * 0.6], stops = [s];
  if(s.act === "hide"){ const w = freeTrip("wash"); if(w) stops.push(w); }
  P.err = {kind:"trip", seat:[si, sj, face], back, stops, n:0, state:"out", path:tripV([[si, sj], ...tripWay(back, s.pos)]), k:0};
  if(s.line) say(P.id, s.line, 2400); return true;
}
export function tripDebug(type){ const P = Object.values(R.people).find(q => q.info.desk && q.mode === "desk" && !q.err && !q.chat); return P && startTrip(P, clock(), type) ? P.id : null; }   // 확인용
function runTrip(P, now, t, dt){
  const e = P.err, p = P.p, root = p.root, s = e.stops[e.n];
  if(e.state !== "stay"){
    const done = walk(P, e, dt); root.rotation.y = P.heading; pose(p, "walk", t, {step:P.step});
    if(!done) return;
    if(e.state === "back"){ P.err = null; place(P, ...e.seat); P.act = null; pose(p, "sit", t, {ph:P.ph}); return; }
    e.state = "stay"; e.t0 = now; e.until = now + s.dur[0] + Math.random() * (s.dur[1] - s.dur[0]); e.zz = now + 2500;
    if(s.act === "hide") root.visible = false;
    return;
  }
  const u = ease(Math.sin(Math.PI * Math.min(1, (now - e.t0) / (e.until - e.t0))));
  if(s.act === "lie"){
    pose(p, "stand", t, {ph:P.ph}); p.arms.forEach((a, k) => a.sh.rotation.set(-0.25, 0, (k ? -1 : 1) * 0.12)); p.head.rotation.x = -0.15;
    root.quaternion.copy(LIEZ()); root.position.set(X(s.bed[0]), hz(11) + 0.05, Z(s.bed[1] + 1.62));
    if(now > e.zz){ e.zz = now + 7000 + Math.random() * 4000; say(P.id, "Zzz… 💤", 2200); }
  } else {
    turnTo(P, s.face, dt, 6);
    const k = (now - e.t0) / (e.until - e.t0);
    if(s.act === "brew") pose(p, "stand", t, k < 0.5 ? {ph:P.ph, phone:true} : {ph:P.ph, sip:true, u:Math.sin(Math.PI * (k - 0.5) * 2)});
    else if(s.act === "wash") pose(p, "stand", t, {ph:P.ph, phone:true});
    else pose(p, "stand", t, {ph:P.ph});
  }
  if(now < e.until) return;
  root.visible = true; if(s.act === "lie"){ root.rotation.set(0, s.face, 0); P.heading = s.face; root.position.set(X(s.pos[0]), 0, Z(s.pos[1])); }
  if(s.act === "brew") say(P.id, ["라떼 완성 ☕", "아 살 것 같다 😌", "오늘 원두 맛있네요"][Math.random() * 3 | 0], 2000);
  if(s.act === "lie") say(P.id, ["으~ 개운하다 🙆", "10분만 더…", "다시 힘내 보자 💪"][Math.random() * 3 | 0], 2200);
  const nx = e.stops[++e.n];
  if(nx){ e.state = "out"; e.path = tripV(tripWay(s.pos, nx.pos)); }
  else { e.state = "back"; e.path = tripV([...tripWay(s.pos, e.back), e.seat.slice(0, 2)]); e.n = e.stops.length - 1; }
  e.k = 0;
}
/* 삼삼오오 회의 · 서서 일 얘기 (2026-11-23 감독님 "삼삼오오 회의도 하고", "서서 일이야기도 하고", "의견도 좀 주고받고") */
const HUDDLES = [
  {zone:"farm", c:[8.9,4.5], talk:"meet", spots:[{at:[8.4,5.6], face:Math.PI, sit:true, seatY:0.55}, {at:[9.4,5.6], face:Math.PI, sit:true, seatY:0.55}, {at:[10.25,4.5]}]},   // 크레용팜 회의실
  {zone:"prod", c:[2.7,18.1], talk:"meet", spots:[{at:[1.7,18.1], face:Math.PI / 2, sit:true, seatY:0.5}, {at:[3.7,18.1], face:-Math.PI / 2, sit:true, seatY:0.5}, {at:[2.7,18.95]}]},   // 콘티 테이블
  {c:[0.2,8.0], talk:"stand", spots:[{at:[0.85,7.55]}, {at:[0.85,8.45]}, {at:[1.5,8.0]}]},   // 복도 감독님 확인 보드 앞
  {c:[13.6,8.0], talk:"stand", spots:[{at:[13.15,7.8]}, {at:[14.05,8.2]}, {at:[13.6,8.6]}]},   // 복도 가운데
];
const TALK_MEET = [
  [[0,"다음 릴스 훅 뭐로 갈까요?"],[1,"결과물부터 바로 보여 주면 어때요?"],[2,"좋아요 👍 첫 3초에 넣어 볼게요"],[0,"의견 고마워요 🙏 그걸로 가요"]],
  [[0,"썸네일 A안이랑 B안 중에 뭐가 나아요?"],[1,"저는 B안이요, 얼굴이 더 잘 보여서"],[2,"저도 B! 글자만 조금 줄이면 될 듯"],[0,"오케이 B로 갑니다 😊"]],
  [[0,"이번 협찬 영상 길이 어떻게 할까요?"],[2,"8분 안쪽이면 끝까지 볼 것 같아요"],[1,"사용 장면을 앞으로 당기면 좋겠어요"],[0,"좋다, 바로 반영할게요 🙏"]],
  [[0,"내일 촬영 동선 한 번 맞춰 봐요 📋"],[1,"1층 카페 먼저 찍고 올라가요"],[2,"조명은 제가 미리 세팅해 둘게요"],[0,"든든하다 🙌 다들 고마워요"]],
  [[0,"이 컷 톤이 좀 차갑지 않아요?"],[1,"레퍼런스 3번처럼 살짝 따뜻하게요"],[2,"피부 톤만 잡으면 딱일 듯해요"],[0,"좋아요, 그렇게 가 볼게요 💪"]],
  [[2,"자막 이렇게 해 봤는데 어때요?"],[0,"오 감각 있다 👍 색만 브랜드 컬러로 맞추자"],[2,"넵 바로 고칠게요!"],[1,"잘했어요, 고마워요 😊"]],
];
const TALK_STAND = [
  [[0,"렌더 걸어 놨어요?"],[1,"네, 20분 남았어요"],[0,"그동안 커피 한 잔 할래요? ☕"],[1,"좋죠 😆"]],
  [[0,"감독님 피드백 보드에 붙었어요"],[1,"오 벌써요? 같이 봐요"],[0,"두 번째 컷만 고치면 된대요"],[1,"다행이다 🙌 감사하네요"]],
  [[0,"오늘 업로드 몇 시에 걸까요?"],[1,"저녁 7시 반응이 제일 좋았어요"],[0,"그럼 7시로 예약할게요 👍"]],
  [[0,"어제 그 아이디어 생각해 봤는데요"],[1,"오 어떤 거요?"],[0,"리뷰 세트에서 한 번에 찍는 거요"],[1,"좋다! 해 봐요 😊"]],
  [[0,"점심 먹고 잠깐 기도 모임 있어요 🙏"],[1,"좋아요, 저도 갈게요"],[0,"기도 제목 있으면 나눠 줘요"],[1,"고마워요 😊"]],
];
const GRACE = ["오늘도 감사한 하루예요 🙏", "다들 수고 많아요 😊", "덕분에 일이 술술 풀려요, 고마워요!", "점심 때 같이 기도해요 🙏", "오늘 하늘 예쁘다 ☀️", "서로 힘내요 💪"];
const GRACE_MZ = ["이 노래 완전 좋다 🎧", "선배님들 커피 사 올까요? ☕", "오늘도 화이팅이에요 💪", "여기 회사 분위기 진짜 좋아요 😆"];
function startHuddle(c, now){
  const H0 = HUDDLES[Math.random() * HUDDLES.length | 0], zp = c.filter(q => !H0.zone || q.info.zone === H0.zone), pool = zp.length >= 2 ? zp : c;
  const n = Math.min(H0.spots.length, pool.length, Math.random() < 0.5 ? 2 : 3); if(n < 2) return false;
  const set = H0.talk === "stand" ? TALK_STAND : TALK_MEET, H = {c:H0.c, lines:set[Math.random() * set.length | 0], members:[], t0:0, start:now, line:-1, spk:null, ended:false};
  pool.slice(0, n).forEach((P, k) => { const s = H0.spots[k], [si, sj, face] = P.home, back = [si - Math.sin(face) * 0.6, sj - Math.cos(face) * 0.6];
    P.err = {kind:"huddle", H, s, seat:[si, sj, face], state:"out", path:tripV([[si, sj], ...tripWay(back, s.at)]), k:0}; H.members.push(P); });
  return true;
}
function runHuddle(P, now, t, dt){
  const e = P.err, H = e.H, p = P.p, root = p.root;
  if(e.state !== "stay"){
    const done = walk(P, e, dt); root.rotation.y = P.heading; pose(p, "walk", t, {step:P.step});
    if(done){ if(e.state === "out") e.state = "stay"; else { P.err = null; place(P, ...e.seat); P.act = null; pose(p, "sit", t, {ph:P.ph}); } }
    return;
  }
  const live = H.members.filter(q => q.err?.H === H);
  if(!H.t0 && (live.every(q => q.err.state === "stay") || now - H.start > 45000)) H.t0 = now + 700;
  turnTo(P, e.s.face ?? Math.atan2(X(H.c[0]) - root.position.x, Z(H.c[1]) - root.position.z), dt, 6);
  let speak = false;
  if(H.t0 && now > H.t0){
    const k = Math.floor((now - H.t0) / 2800);
    if(k >= H.lines.length){ if(!H.ended){ H.ended = true; live.forEach(q => { const f = q.err; f.state = "back"; f.path = f.path.slice().reverse(); f.k = 0; }); } return; }
    if(k !== H.line){ H.line = k; const [w, txt] = H.lines[k], who = live[w % live.length]; H.spk = who; if(who) say(who.id, txt, 2600); }
    speak = H.spk === P && now - H.t0 - k * 2800 < 2300;
  }
  const nod = !speak && !!H.t0 && Math.sin(now / 260 + P.ph * 3) > 0.55;
  if(e.s.sit) pose(p, "sit", t, {ph:P.ph, seatY:e.s.seatY, talk:speak}); else pose(p, "stand", t, {ph:P.ph, talk:speak, nod});
}
function runErrand(P, now, t, dt){
  if(P.err.kind === "trip") return runTrip(P, now, t, dt);
  if(P.err.kind === "huddle") return runHuddle(P, now, t, dt);
  const e = P.err, p = P.p, root = p.root;
  if(e.state === "out" || e.state === "back"){
    const done = walk(P, e, dt); root.rotation.y = P.heading; pose(p, "walk", t, {step:P.step});
    if(done){
      if(e.state === "out"){ e.state = "stay"; e.t0 = now; e.line = -1;
        e.until = now + (e.kind === "visit" ? e.talk.length * 2500 + 700 : 4200 + Math.random() * 2400);
        if(e.kind === "visit") e.mate.chat = {who:P, until:e.until, talk:false}; }
      else { P.err = null; place(P, ...e.seat); P.act = null; pose(p, "sit", t, {ph:P.ph}); }
    }
    return;
  }
  if(e.kind === "visit"){
    const m = e.mate.p.root.position; turnTo(P, Math.atan2(m.x - root.position.x, m.z - root.position.z), dt);
    const k = Math.min(e.talk.length - 1, Math.floor((now - e.t0) / 2500));
    if(k !== e.line && now < e.until - 500){ e.line = k; say(k % 2 ? e.mate.id : P.id, e.talk[k], 2400); }
    if(e.mate.chat) e.mate.chat.talk = k % 2 === 1;
    pose(p, "stand", t, {ph:P.ph, talk:k % 2 === 0, nod:k % 2 === 1});
  } else {
    turnTo(P, e.act === "reach" ? Math.PI * 0.25 : P.heading, dt, 3);
    const u = ease(Math.sin(Math.PI * Math.min(1, (now - e.t0) / (e.until - e.t0))));
    pose(p, "stand", t, {ph:P.ph, reach:e.act === "reach", phone:e.act === "phone", u});
  }
  if(now > e.until){ e.state = "back"; e.path = e.path.slice().reverse(); e.k = 0; }
}
function planErrands(now){
  if(reduce) return;
  if(!R.errNext){ R.errNext = now + 5000; R.hudNext = now + 9000; R.graceNext = now + 15000; return; }
  if(now > R.graceNext){ R.graceNext = now + 35000 + Math.random() * 30000;   // 감사 인사 · 혼잣말
    const g = Object.values(R.people).filter(q => q.info.desk && !q.err && q.id !== R.sel), q = g[Math.random() * g.length | 0];
    if(q) say(q.id, /^_mz/.test(q.id) && Math.random() < 0.6 ? GRACE_MZ[Math.random() * GRACE_MZ.length | 0] : GRACE[Math.random() * GRACE.length | 0], 2600); }
  if(now < R.errNext) return;
  R.errNext = now + 6000 + Math.random() * 7000;
  const all = Object.values(R.people), busy = all.filter(q => q.err).length; if(busy >= 4) return;
  const c = all.filter(q => q.info.desk && q.mode === "desk" && !q.err && !q.chat && q.id !== R.sel).sort(() => Math.random() - 0.5);
  if(busy <= 1 && now > R.hudNext && Math.random() < 0.45 && startHuddle(c, now)){ R.hudNext = now + 35000 + Math.random() * 30000; return; }
  if(busy >= 3) return;
  for(const P of c) if((Math.random() < 0.6 && startTrip(P, now)) || startErrand(P, now)) return;
}

/* ---------- 카메라: 고정 방향, 구역마다 중심·거리만 바뀜 ---------- */
const V3 = (i, y, j) => new THREE.Vector3(X(i), y, Z(j));
function viewPts(z){
  if(z === "farmOnly"){ const [I1, J1] = FARM_EXT; return [V3(-0.25,0,-0.25),V3(I1,0,-0.25),V3(I1,-0.4,J1),V3(-0.25,-0.4,J1),V3(-0.25,WALL_H + 0.2,-0.25),V3(I1,WALL_H + 0.2,-0.25),V3(-0.25,WALL_H + 0.2,J1)]; }
  if(z === "all" && R.F) return R.F.allPts ? R.F.allPts(V3) : R.F.outline.flatMap(([i, j]) => [V3(i, 0, j), V3(i, R.F.top ?? WALL_H + 0.4, j)]);
  if(z === "all") return [V3(-0.25,0,-0.25),V3(WI,0,-0.25),V3(WI,-0.4,9),V3(GI,-0.4,GJ),V3(-0.25,-0.4,GJ),V3(-0.25,WALL_H + 0.7,-0.25),V3(WI,WALL_H + 0.7,-0.25),V3(-0.25,WALL_H + 0.4,GJ)];
  const [i0,j0,i1,j1] = (ZS()[z] || SUBS()[z]).rect, bw = !R.F || R.F.backWalls !== false, pts = [V3(i0,0,j0),V3(i1,0,j0),V3(i1,0,j1),V3(i0,0,j1),V3(i0,2.4,j1),V3(i1,2.4,j0)];
  if(j0 === 0 && bw) pts.push(V3(i0, WALL_H + 0.25, 0), V3(i1, WALL_H + 0.25, 0)); else pts.push(V3(i0, 2.4, j0), V3(i1, 2.4, j0));
  if(i0 === 0 && bw) pts.push(V3(0, WALL_H + 0.25, j0), V3(0, WALL_H + 0.25, j1));
  return pts;
}
function fit(z){
  const cam = R.camera, pts = viewPts(z), v = new THREE.Vector3();
  const portrait = R.h > R.w * 1.05, MX = z === "all" || z === "farmOnly" ? 0.97 : portrait ? 0.98 : 0.9, MY = z === "all" ? (portrait ? 0.9 : 0.86) : z === "farmOnly" ? (portrait ? 0.9 : 0.95) : 0.8;
  const tg = pts.reduce((a, p) => a.add(p), new THREE.Vector3()).multiplyScalar(1 / pts.length);
  const put = d => { cam.position.copy(tg).addScaledVector(DIR, d); cam.lookAt(tg); cam.updateMatrixWorld(); };
  const ext = () => { let x0 = 9, x1 = -9, y0 = 9, y1 = -9; pts.forEach(p => { v.copy(p).project(cam); x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y); }); return {x0, x1, y0, y1}; };
  let d = 40;
  for(let it = 0; it < 3; it++){
    let lo = 3, hi = 400;
    for(let k = 0; k < 26; k++){ const m = (lo + hi) / 2; put(m); const e = ext(); (Math.max(-e.x0, e.x1) / MX > 1 || Math.max(-e.y0, e.y1) / MY > 1) ? lo = m : hi = m; }
    d = hi; put(d); const e = ext(), tz = v.copy(tg).project(cam).z;
    const c = new THREE.Vector3((e.x0 + e.x1) / 2, (e.y0 + e.y1) / 2 - (z === "all" ? 0.02 : z === "farmOnly" ? 0.01 : 0.05), tz).unproject(cam);
    tg.add(c.sub(tg));
  }
  return {tg, d};
}
function applyCam(tg, d){ R.camera.position.copy(tg).addScaledVector(DIR, d); R.camera.lookAt(tg); }
// 구역 버튼은 지금 각도 그대로 다가가고, 전체 보기(처음 시점)는 각도도 처음으로
export function setView(z, snap){
  if(!R || (PL.on && R.cur)) return;
  if(z !== HOME() && z !== "all" && !(ZS()[z] || SUBS()[z])) return;   // 이 층에 없는 구역(멍 모드 등)은 무시
  R.zone = z;
  const az = z === HOME() || R.az == null ? AZ0 : R.az, el = z === HOME() || R.el == null ? EL0 : R.el;
  setDir(az, el); R.home = homeFit(); const goal = fit(z); goal.az = az; goal.el = el;
  R.layer.classList.toggle("far", z === "all"); touchMode(z !== HOME());
  if(snap || reduce || !R.cur){ R.az = az; R.el = el; R.cur = {tg:goal.tg.clone(), d:goal.d}; R.anim = null; updateCut(); applyCam(R.cur.tg, R.cur.d); return; }
  setDir(R.az, R.el); applyCam(R.cur.tg, R.cur.d);
  R.anim = {t0:clock(), dur:950, from:{tg:R.cur.tg.clone(), d:R.cur.d, az:R.az, el:R.el}, to:goal};
  R.opts.onView?.(z);
}
const isHomeAngle = () => Math.abs(Math.atan2(Math.sin(R.az - AZ0), Math.cos(R.az - AZ0))) < 0.02 && Math.abs(R.el - EL0) < 0.02;
function rotateBy(dx, dy){
  R.anim = null; R.az -= dx * 0.0075; R.el = Math.max(EL_MIN, Math.min(EL_MAX, R.el + dy * 0.005));
  setDir(R.az, R.el); R.home = homeFit(); clampFree(R.cur); updateCut(); applyCam(R.cur.tg, R.cur.d); goFree();
}

/* ---------- 손으로 확대 · 끌기 (2.5D 지도와 같게: 핀치 · ⌘휠 · 두 번 누르기, 최대 7배) ---------- */
const ZMAX = 10.5, GPL = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.8);
const HOME = () => R.only ? "farmOnly" : "all";
const isFar = () => !R.only && (R.zone === "all" || (R.zone === "free" && R.cur && R.home && R.cur.d > R.home.d * (R.w < 600 ? 0.42 : 0.7)));
function homeFit(){
  const z = HOME(), g = fit(z), pts = viewPts(z), xs = pts.map(p => p.x), zs = pts.map(p => p.z);
  if(R.cur) applyCam(R.cur.tg, R.cur.d);
  return {tg:g.tg.clone(), d:g.d, ex:(Math.max(...xs) - Math.min(...xs)) / 2, ez:(Math.max(...zs) - Math.min(...zs)) / 2};
}
function touchMode(zoomed){ R.renderer.domElement.style.touchAction = zoomed ? "none" : "pan-y"; if(R.back) R.back.hidden = !zoomed; }
function groundAt(mx, my, out){ const ray = new THREE.Raycaster(); ray.setFromCamera(new THREE.Vector2(mx / R.w * 2 - 1, -my / R.h * 2 + 1), R.camera); return ray.ray.intersectPlane(GPL, out); }
function clampFree(c){
  const h = R.home; c.d = Math.min(h.d * 1.05, Math.max(h.d / ZMAX, c.d));
  const k = Math.max(0, 1 - c.d / h.d), cl = (v, m, r) => Math.min(m + r, Math.max(m - r, v));
  c.tg.x = cl(c.tg.x, h.tg.x, h.ex * k); c.tg.z = cl(c.tg.z, h.tg.z, h.ez * k);
}
function goFree(){
  R.anim = null;
  if(R.zone !== "free"){ R.zone = "free"; R.opts.onView?.("free"); }
  const zoomed = R.cur.d < R.home.d * 0.97 || !isHomeAngle(); touchMode(zoomed); R.layer.classList.toggle("far", isFar());
}
// mx,my 아래 바닥이 그대로 있게 거리만 바꿈. apply=false면 결과만 돌려줌
function zoomAt(mx, my, d, apply = true){
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = {tg:R.cur.tg.clone(), d:R.cur.d};
  applyCam(c.tg, c.d); R.camera.updateMatrixWorld(); const okA = groundAt(mx, my, a);
  c.d = d; clampFree(c); applyCam(c.tg, c.d); R.camera.updateMatrixWorld();
  if(okA && groundAt(mx, my, b)) c.tg.add(a.sub(b));
  clampFree(c);
  if(apply){ R.cur = c; goFree(); }
  applyCam(R.cur.tg, R.cur.d); R.camera.updateMatrixWorld(); return c;
}
function panBy(x0, y0, x1, y1){
  const a = new THREE.Vector3(), b = new THREE.Vector3(); R.camera.updateMatrixWorld();
  if(!groundAt(x0, y0, a) || !groundAt(x1, y1, b)) return;
  R.cur.tg.add(a.sub(b)); clampFree(R.cur); applyCam(R.cur.tg, R.cur.d); goFree();
}
function dblZoom(mx, my){
  if(R.cur.d <= R.home.d / ZMAX * 1.03){ setView(HOME()); return; }
  const to = zoomAt(mx, my, R.cur.d / 1.6, false);
  if(reduce){ R.cur = to; goFree(); return; }
  R.anim = null; goFree(); to.az = R.az; to.el = R.el; R.anim = {t0:clock(), dur:420, from:{tg:R.cur.tg.clone(), d:R.cur.d, az:R.az, el:R.el}, to}; touchMode(to.d < R.home.d * 0.97);
}

/* ---------- 물건 누르기 (2.5D 지도 이스터에그 그대로. at = [i, j, 높이px]) ---------- */
const EGGS = [
  {id:"_up", at:[12.95,17.1,40], emo:["🛗","⬆️"], lines:["▲"], elev:"up"},   // 엘리베이터 오른쪽 문 = 위층
  {id:"_dn", at:[12.95,18.3,40], emo:["🛗","⬇️"], lines:["▼"], elev:"down"},  // 왼쪽 문 = 아래층
  {id:"recep",   at:[16.4,12.3,42], emo:["👋","😊"], lines:["어서 오세요! 크레용입니다 😊","감독님, 오늘도 촬영 화이팅!","택배 왔어요 📦 협찬 제품인가 봐요","방문증은 여기서 받아 가세요"]},
  {id:"sign",    at:[14.5,10.4,42],   emo:["✨","⭐"], lines:["Behind the frame, before the world. ✨","프레임 뒤에서, 세상 앞으로.","현판 닦는 중… 반짝반짝","여기서 인증샷 한 장 📸"]},
  {id:"coffee",  at:[26.17,0.35,34],  emo:["☕","💨"], lines:["라떼 한 잔 추출 완료","샷 추가! 오늘 편집 길죠?","아메리카노 연하게 한 잔"]},
  {id:"chalk",   at:[26.0,0.03,52],   emo:["📝"],      lines:["오늘의 원두: 에티오피아 예가체프","콜드브루는 어제 다 마심…","라떼 아트 연습 중 (하트 실패)"]},
  {id:"cooler",  at:[28.47,0.79,30],  emo:["🧃","🥤"], lines:["시원한 거 하나 꺼냈어요 🧃","제로 콜라는 품절…","오늘은 식혜 각"]},
  {id:"snack",   at:[28.25,3.55,30],  emo:["🍪","🍫"], lines:["과자 하나 집어감 🍪","(오늘 세 번째…)","초코파이는 정이다"]},
  {id:"massage", at:[27.3,5.9,22],    emo:["💆","〰️"], lines:["위이이잉~ 안마 강도 MAX 💆","어깨 뭉친 거 싹 풀림","편집 10시간의 보상"]},
  {id:"bed",     at:[27.07,10.9,14],  emo:["💤"],      lines:["쿨… 5분만 더…","렌더 끝나면 깨워 주세요 💤","꿈에서도 컷 편집 중"]},
  {id:"lamp",    at:[28.75,13.6,20],  emo:["🌙"],      lines:[]},
  {id:"stall",   at:[27.48,16.35,26], emo:["🚪"],      lines:[]},
  {id:"tv",      at:[8.4,9.19,45],    emo:["💬"],      lines:["회의 결론: 일단 찍어보자 🎥","다음 안건: 점심 뭐 먹지","슬라이드 37장 중 1장"]},
  {id:"trophy",  at:[0.39,12.23,28],  emo:["🏆","✨"], lines:["여수국제웹드라마영화제 심사위원 특별상 🏆","〈춘자의 전성시대〉로 받은 상","매일 아침 닦는 중 ✨"]},
  {id:"trophy2", at:[0.29,13.75,27],  emo:["🏅","✨"], lines:["비엔나 국제영화상 Honorable Mention 🏅","Vienna International Film Awards 2025"]},
  {id:"melb",    at:[0.29,12.97,27],  emo:["🌏","✨"], lines:["Melbourne WebFest 2025 공식 초청 🌏","OFFICIAL SELECTION"]},
  {id:"seoul",   at:[0.39,14.34,34],  emo:["🎉","✨"], lines:["NEW! 2026 서울국제웹페스트 베스트브랜드상 🎉","〈춘자의 전성시대 2〉","브랜드를 담은 드라마로 받은 상"]},
  {id:"canada",  at:[0.39,14.78,30],  emo:["🍁","✨"], lines:["NEW! 캐나다 국제영화제 우수상 🍁","〈춘자의 전성시대 2〉","시즌2가 받은 두 번째 상 🏆"]},
  {id:"poster1", at:[0.02,15.35,64],  emo:["🌸"], lines:["〈춘자의 전성시대〉 웃음과 눈물의 세대공감 드라마 🌸"]},
  {id:"poster2", at:[0.02,14.2,64],   emo:["🌿"], lines:["〈춘자의 전성시대 2〉 시니어 인턴 춘자의 두 번째 여정 🌿"]},
  {id:"poster3", at:[0.02,13.05,64],  emo:["☕"], lines:["〈안녕하세요! 스타벅스입니다〉 ☕","전 세계 최초 스타벅스 파트너 웹드라마"]},
  {id:"unbox",   at:[16.65,2.6,32],   emo:["📦","✨"], lines:["오늘 도착한 협찬 택배 📦","언박싱은 무조건 첫 테이크로","써 보고 나서 리뷰해요 🎥"]},
  {id:"refmon",  at:[21.0,12.2,58],   emo:["🎨","🙅"], lines:["레퍼런스 모니터는 함부로 만지면 안 돼요 🎨","캘리브레이션 끝난 화면이라 손대면 컬러가 울어요","컬러바 잠깐 띄워 봤어요"]},
  {id:"panel",   at:[21.0,14.55,24],  emo:["🔴","🟢","🔵"], lines:["트랙볼 굴리는 손맛 🟢","살짝만 돌려도 톤이 확 바뀌어요","작업 중엔 노크 먼저 해 주세요 🚪"]},
  {id:"refboard", at:[0.02,18.0,60],  emo:["📌","🎬"], lines:["감독님이 붙인 레퍼런스 스틸 📌","이 톤으로 가 볼까요?","콘티 회의는 이 테이블에서 해요"]},
];
const EGG_DAY = new Date().toDateString();
function eggPos(g){ return new THREE.Vector3(X(g.at[0]), hz(g.at[2]), Z(g.at[1])); }
function eggVisible(g){
  if(R.only){ const [a,b,c,d] = ZONES.farm.rect; if(!(g.at[0] >= a - 0.5 && g.at[0] < c + 0.5 && g.at[1] >= b - 0.5 && g.at[1] < d + 0.5)) return false; }
  // 잘린 벽 위(가까운 쪽 벽)는 못 누르게
  const c = CUT.value;
  if(g.at[0] < 0.5 && hz(g.at[2]) > c.z) return false;
  if(g.at[1] < 0.5 && hz(g.at[2]) > c.w) return false;
  return true;
}
function hitEgg(mx, my){
  const far = isFar();   // 멀리서는 엘리베이터 문만 누를 수 있음
  let best = null, bd = R.w < 600 ? 26 : 30;
  EGGL().forEach(g => { if(far && !g.elev) return; if(!eggVisible(g)) return; const v = eggPos(g).project(R.camera); if(v.z >= 1) return;
    const d = Math.hypot((v.x * 0.5 + 0.5) * R.w - mx, (-v.y * 0.5 + 0.5) * R.h - my); if(d < bd){ bd = d; best = g; } });
  return best;
}
function popEgg(g){
  g.n = (g.n || 0) + 1;
  let line = g.lines[(g.n - 1) % Math.max(1, g.lines.length)];
  if(g.say) line = g.say(KIT, g, line);
  if(g.elev) line = R.opts.onElev?.(g.elev) || line;
  if(g.id === "taling") line = R.opts.kpi?.("taling") || "탈잉 VOD 대시보드 📊";
  if(g.id === "stall") line = Object.values(R.people).some(P => P.err?.kind === "trip" && P.err.state === "stay" && P.err.stops[P.err.n]?.act === "hide") ? "똑똑… 사람 있어요! 🙅" : "비어 있어요 🚽 손 씻기 잊지 마세요";
  if(g.id === "lamp"){ R.lampOff = !R.lampOff; line = R.lampOff ? "무드등 끔 🌙 다들 푹 자요" : "무드등 켬 💡"; }
  if(g.id === "coffee"){ let n = 0; try { const c = JSON.parse(localStorage.getItem("crayon-cups") || "{}"); if(c.d === EGG_DAY) n = c.n || 0; } catch(_){}
    n++; line += ` (오늘 ${n}잔째)`; try { localStorage.setItem("crayon-cups", JSON.stringify({d:EGG_DAY, n})); } catch(_){} }
  if(R.egg) R.egg.els.forEach(e => e.remove());
  const bub = document.createElement("div"); bub.className = "t3-bub t3-egg"; bub.textContent = line;
  const parts = Array.from({length:7}, (_, k) => { const e = document.createElement("span"); e.className = "t3-emo"; e.textContent = g.emo[k % g.emo.length]; return {e, dx:(Math.random() - 0.5) * 46, v:26 + Math.random() * 30, d:Math.random() * 0.25}; });
  R.layer.append(...parts.map(q => q.e), bub);
  R.egg = {g, t0:clock(), bub, parts, els:[bub, ...parts.map(q => q.e)]};
}
function layoutEgg(now){
  const E = R.egg; if(!E) return;
  const age = (now - E.t0) / 1000;
  if(age > 2.8){ E.els.forEach(e => e.remove()); R.egg = null; return; }
  const v = eggPos(E.g).project(R.camera), x = (v.x * 0.5 + 0.5) * R.w, y = (-v.y * 0.5 + 0.5) * R.h;
  E.parts.forEach(q => { const a = Math.max(0, age - q.d), k = Math.min(1, a / 1.6);
    q.e.style.opacity = a <= 0 || k >= 1 ? 0 : 1 - k; q.e.style.fontSize = (14 + k * 6) + "px";
    q.e.style.transform = `translate(${x + q.dx * k}px,${y - 10 - q.v * k * 1.6}px) translate(-50%,-50%)`; });
  if(!E.bw){ E.bw = E.bub.offsetWidth; E.bh = E.bub.offsetHeight; }
  const bx = Math.max(E.bw / 2 + 6, Math.min(R.w - E.bw / 2 - 6, x)), by = Math.max(E.bh / 2 + 6, y - 48 - Math.min(1, age * 5) * 6);
  E.bub.style.opacity = Math.max(0, Math.min(1, age * 6, (2.8 - age) * 3));
  E.bub.style.transform = `translate(${bx}px,${by}px) translate(-50%,-50%)`;
}

/* ---------- 매 프레임 ---------- */
const tmp = new THREE.Vector3();
const clock = () => (R && R.now) || performance.now();
function frame(now){ if(!R || !R.live) return; R.raf = requestAnimationFrame(frame); tick(now); }
function tick(now){
  now += R.off || 0;
  if(coarse && now - (R.last || 0) < 1000 / 40) return;
  R.now = now;
  const dt = Math.min(0.05, (now - (R.last || now)) / 1000); R.last = now;
  const t = (now - R.t0) / 1000;
  if(R.anim){ const a = R.anim, u = Math.min(1, (now - a.t0) / a.dur), e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
    // 멀리 갈 땐 살짝 빠졌다 들어감 (거리는 로그로 섞어서 확대가 고르게 느껴지게)
    R.cur.tg.lerpVectors(a.from.tg, a.to.tg, e); R.cur.d = Math.exp(Math.log(a.from.d) + (Math.log(a.to.d) - Math.log(a.from.d)) * e);
    if(a.from.az != null && a.to.az != null){ const da = Math.atan2(Math.sin(a.to.az - a.from.az), Math.cos(a.to.az - a.from.az)); R.az = a.from.az + da * e; R.el = a.from.el + (a.to.el - a.from.el) * e; }
    if(u >= 1){ R.anim = null; if(R.zone === "free") goFree(); } }
  if(PL.on && R.pl) playTick(now, t, dt);
  setDir(R.az, R.el); updateCut(); playCut();
  applyCam(R.cur.tg, R.cur.d);
  // 쇼릴
  const sc = ((Math.floor(t / 5.2) % 3) + 3) % 3, ph = ((t / 5.2) % 1 + 1) % 1, rk = Math.floor(t * 4);
  if(R.reel && rk !== R.reel.last){ R.reel.last = rk; const x = R.reel.cv.getContext("2d"), W = 256, H = 128, S = [["#2E5D55","#D7A15B"],["#4B3A5E","#E9C9A8"],["#1F3C52","#9CC9C0"]][sc];
    const g = x.createLinearGradient(0, H, W, 0); g.addColorStop(0, S[0]); g.addColorStop(1, S[1]); x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.fillStyle = "rgba(0,0,0,.5)"; x.fillRect(0, 0, W, 18); x.fillRect(0, H - 18, W, 18); x.fillStyle = "#3A8A78"; x.fillRect(0, H - 4, W * ph, 4); R.reel.tex.needsUpdate = true; }

  if(R.F){ R.F.tick?.(KIT, now, t, dt); syncPeople(); R.renderer.render(R.scene, R.camera); layoutTags(now); layoutEgg(now); return; }
  if(!R.only) planVisit(now);
  planErrands(now);
  Object.values(R.people).forEach(P => {
    const {p, info} = P, root = p.root;
    if(info.id === "_dir" && R.only){ const look = Math.sin(t * 0.35) * 0.6; pose(p, "stand", t, {ph:P.ph, turn:look, nod:Math.sin(t * 0.35) > 0.85}); return; }
    if(info.id === "_dir"){
      const v = R.visit || {state:"seat"};   // 노라 이사님이 4층으로 가서 방문 없음
      if(v.state === "in" || v.state === "out"){
        const done = walk(P, v, dt); root.rotation.y = P.heading; pose(p, "walk", t, {step:P.step});
        if(done){ if(v.state === "in"){ v.state = "talk"; v.line = -1; v.lineAt = now; v.until = now + 50000 + Math.random() * 40000; v.sayAt = now + 800; }
          else { v.state = "seat"; v.next = now + 45000 + Math.random() * 30000; place(P, ...P.home); } }
      } else if(v.state === "talk"){
        const want = Math.atan2(X(16.7) - root.position.x, Z(5.2) - root.position.z); let da = want - P.heading; da = Math.atan2(Math.sin(da), Math.cos(da)); P.heading += da * Math.min(1, dt * 6); root.rotation.y = P.heading;
        if(now > v.sayAt){ v.sayAt = now + 6500 + Math.random() * 4500; v.talkUntil = now + 2900; say("_dir", DIR_REV_SAY[Math.random() * DIR_REV_SAY.length | 0]); }
        pose(p, "stand", t, {talk:now < (v.talkUntil || 0), ph:P.ph});
      } else pose(p, "type", t, {ph:P.ph, seatY:0.62});
      return;
    }
    if(info.id === "_nora"){
      const v = R.visit, talking = v && v.state === "talk";
      pose(p, talking ? "sit" : "tablet", t, {ph:P.ph, wave:talking && v.line === 0 && now - v.lineAt < 1400, talk:talking && v.talk[v.line]?.[0] === 0, turn:talking ? 0.55 : 0});
      P.tablet.visible = !talking; return;
    }
    if(info.id === "_recep"){ pose(p, "stand", t, {ph:P.ph, wave:!reduce && Math.sin(t * 0.21) > 0.93}); return; }
    if(info.id === "_yuna"){ pose(p, "stand", t, {ph:P.ph, turn:Math.sin(t * 0.7) * 0.4, talk:Math.sin(t * 0.33) > 0.4}); root.position.y = reduce ? 0 : Math.max(0, Math.sin(t * 5.2)) * 0.05 * (Math.sin(t * 0.33) > 0.4 ? 1 : 0); return; }
    if(P.mode === "stand"){ pose(p, "stand", t, {ph:P.ph, talk:info.status === "review" && Math.sin(t * 0.8 + P.ph) > 0.5, hold:info.status === "review"}); return; }
    if(P.err) runErrand(P, now, t, dt);
    else if(reduce) pose(p, info.status === "idle" ? "sit" : "type", t, {ph:P.ph});
    else deskLife(P, now, t, dt);
  });
  syncPeople();
  R.renderer.render(R.scene, R.camera);
  layoutTags(now); layoutEgg(now);
}

/* 이름표·말풍선 (tower3d.js와 같은 겹침 피하기). 전체 층에서는 점 + 구역 이름만 */
function layoutTags(now){
  const w = R.w, h = R.h, items = [], placed = [], far = isFar() && !R.anim;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const free = (x, y, tw, th) => { for(let g = 0; g < 8; g++){ const hit = placed.find(r => Math.abs(r.x - x) < (r.w + tw) / 2 + 3 && Math.abs(r.y - y) < (r.h + th) / 2 + 2); if(!hit) break; y = hit.y - (hit.h + th) / 2 - 3; } return y; };
  R.zoneTags.forEach(zt => { tmp.copy(zt.at).project(R.camera); const show = isFar();
    zt.el.hidden = !show; if(!show) return;
    if(!zt.w){ zt.w = zt.el.offsetWidth; zt.h = zt.el.offsetHeight; }
    let x = (tmp.x * 0.5 + 0.5) * w, y = (-tmp.y * 0.5 + 0.5) * h; if(zt.side === "side") x += zt.w / 2 + 6; if(zt.side === "bottom") y += zt.h / 2 + 6; if(zt.side === "top") y -= zt.h / 2 + 2;
    x = clamp(x, zt.w / 2 + 4, w - zt.w / 2 - 4); y = clamp(y, zt.h / 2 + 4, h - zt.h / 2 - 4);
    for(let g = 0; g < 4; g++){ const hit = placed.find(r => Math.abs(r.x - x) < (r.w + zt.w) / 2 + 4 && Math.abs(r.y - y) < (r.h + zt.h) / 2 + 3); if(!hit) break; y = zt.side === "bottom" ? hit.y + (hit.h + zt.h) / 2 + 4 : hit.y - (hit.h + zt.h) / 2 - 4; }
    placed.push({x, y, w:zt.w, h:zt.h}); zt.el.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%)`; });
  Object.values(R.people).forEach(P => {
    P.stem.hidden = true;
    if(!P.p.root.visible || (PL.on && R.pl && P.p.root.position.distanceToSquared(R.pl.yu.root.position) > 64)){ P.tag.hidden = true; P.bub.hidden = true; return; }
    P.p.head.getWorldPosition(tmp); tmp.y += 0.52 * P.p.root.scale.y; tmp.project(R.camera);
    if(!(tmp.z < 1 && Math.abs(tmp.x) < 1.1 && Math.abs(tmp.y) < 1.1)){ P.tag.hidden = true; P.bub.hidden = true; return; }
    P.tag.hidden = false; const dot = far && P.id !== R.sel && !(P.say && now < P.sayUntil);
    if(P.tag.classList.contains("dot") !== dot){ P.tag.classList.toggle("dot", dot); P.tw = 0; }
    if(!P.tw){ P.tw = P.tag.offsetWidth; P.th = P.tag.offsetHeight; }
    items.push({P, x:(tmp.x * 0.5 + 0.5) * w, y:(-tmp.y * 0.5 + 0.5) * h, z:tmp.z});
  });
  items.sort((a, b) => a.z - b.z);
  items.forEach(it => { const P = it.P, x = clamp(it.x, P.tw / 2 + 4, w - P.tw / 2 - 4), dot = P.tag.classList.contains("dot"), y = dot ? it.y - P.th / 2 : free(x, it.y - P.th / 2, P.tw, P.th);
    if(!dot) placed.push({x, y, w:P.tw, h:P.th}); it.tx = x; it.ty = y; P.tag.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%)`; });
  items.forEach(it => { const P = it.P;
    const showSay = P.say && now < P.sayUntil, showSel = R.sel === P.id;
    const text = showSay ? P.say : showSel ? `${P.info.role}${P.info.task ? " · " + P.info.task : ""}` : "";
    if(!text){ P.bub.hidden = true; return; }
    if(P.bub.textContent !== text){ P.bub.textContent = text; P.bw = 0; }
    P.bub.hidden = false; P.bub.classList.toggle("info", !showSay);
    if(!P.bw){ P.bw = P.bub.offsetWidth; P.bh = P.bub.offsetHeight; }
    const bx = clamp(it.tx, P.bw / 2 + 4, w - P.bw / 2 - 4), by = free(bx, it.ty - P.th / 2 - 5 - P.bh / 2, P.bw, P.bh);
    placed.push({x:bx, y:by, w:P.bw, h:P.bh}); P.bub.style.transform = `translate(${bx}px,${by}px) translate(-50%,-50%)`; P.bRect = {x:bx, y:by, w:P.bw, h:P.bh, t:now};
    const top = by + P.bh / 2, gap = it.ty - P.th / 2 - top;
    if(gap > 7){ const sx = clamp(it.tx, bx - P.bw / 2 + 12, bx + P.bw / 2 - 12); P.stem.hidden = false; P.stem.classList.toggle("info", !showSay); P.stem.style.height = gap + "px"; P.stem.style.transform = `translate(${sx}px,${top}px)`; } });
  playTags(now);
}

function resize(){
  const r = R.host.getBoundingClientRect(); R.w = Math.max(1, r.width); R.h = Math.max(1, r.height);
  R.renderer.setSize(R.w, R.h, false); R.camera.aspect = R.w / R.h; R.camera.updateProjectionMatrix();
  if(PL.on) return;
  if(R.zone === "free"){ R.home = homeFit(); clampFree(R.cur); applyCam(R.cur.tg, R.cur.d); return; }
  if(R.zone){ if(R.anim){ const g = R.anim.to; setDir(g.az ?? R.az, g.el ?? R.el); const f = fit(R.zone); g.tg = f.tg; g.d = f.d; setDir(R.az, R.el); }
    else { const g = fit(R.zone); R.cur = {tg:g.tg, d:g.d}; applyCam(g.tg, g.d); } }
}

export function setTheme(dark){
  if(!R) return; R.dark = dark;
  R.renderer.toneMappingExposure = dark ? 0.95 : 0.82;
  R.sun.intensity = dark ? 0.35 : 1.35; R.sun.color.set(dark ? 0xAFB8FF : 0xFFF1E2);
  R.hemi.intensity = dark ? 0.55 : 0.42; R.hemi.color.set(dark ? 0x9C94D0 : 0xFFF6F0); R.hemi.groundColor.set(dark ? 0x3A3040 : 0xC9B7C4);
  Object.values(R.MAT).forEach(m => { if(m.isMeshStandardMaterial) m.envMapIntensity = dark ? 0.35 : 0.6; });
  R.floor.material.envMapIntensity = dark ? 0.35 : 0.6;
  R.lampL.forEach(l => l.intensity = dark ? 7 : 0); R.glowL.intensity = dark ? 9 : 0;
  R.baked.forEach(m => { const u = m.geometry.userData, a = m.geometry.attributes.color; a.array.set(dark ? u.D : u.L); a.needsUpdate = true; });
  R.MAT.glow.color.setScalar(dark ? 1.25 : 1);
  paintAnyFloor(dark); R.flTex.needsUpdate = true; R.F?.theme?.(KIT, dark);
  R.atlas.paint(dark);
  paintScreens();
}

/* ---------- 유나 모드 (2026-11-23 감독님 "유나 앞세워서 GTA처럼 돌아다니게. 이야기하고 다니면 재밌겠다") ----------
   - 유나 등 뒤 카메라 (끌어서 돌리기 · 핀치/휠로 멀고 가깝게). 조종은 yuna_game.js가 playInput으로 넣어 줌
   - 벽·가구는 못 지나감: 굳히기 전 가구 상자(밑면이 어깨 0.9 아래로 내려온 것, 식탁 상판 포함)로 바닥 0.1칸 지도를 만들어 막음. 낮은 단(0.3 아래)은 올라섬
   - 카메라와 유나 사이를 가리는 벽은 그 줄만 통로처럼 잘라서 보임 (PCUT)
   - 아빠·엄마 배우(숨바꼭질·수영 시합용), 공, 목표 별은 엔진이 그리고 위치는 게임이 정함 */
const PLAY_LOOKS = {
  yu:{look:{skin:"#F6D7C2", hair:"#3A261C", style:"pig", ribbon:"#FF5FA8", shirt:"#FF8FB8", pants:"#6FA8DC"}, b:{h:0.74, w:0.9}},
  dad:{look:{skin:"#E8C3A2", hair:"#1E1B18", style:"bob", hat:"bucket", hatC:"#CDBB9A", shirt:"#2A2A28", pants:"#3A3D42"}, b:{h:1.06, w:1.18}},
  mom:{look:{skin:"#F3D3BC", hair:"#4A2E24", style:"long", shirt:"#F7F1EC", pants:"#B9A3C4"}, b:{h:0.97, w:0.88}},
  fr:{look:{skin:"#EBC4A4", hair:"#2A1E18", style:"bob", shirt:"#FFD84D", pants:"#4DAA97"}, b:{h:0.77, w:0.9}},   // 놀러 온 친구 지유 (2026-11-23 감독님 "친구가 놀러오는 애피소드")
  /* 동네 사람들 (2026-11-24 감독님 "세계관 팍팍 늘려봐"): 공원 · 학교 앞 골목에 서 있음 */
  ice:{look:{skin:"#E2B994", hair:"#2A221E", style:"short", hat:"bucket", hatC:"#FFFFFF", shirt:"#FFFFFF", pants:"#6FA8DC"}, b:{h:1.04, w:1.12}},   // 아이스크림 트럭 아저씨
  kid:{look:{skin:"#EFC9A8", hair:"#1E1B18", style:"short", shirt:"#6FA8DC", pants:"#3A3D42"}, b:{h:0.76, w:0.92}},   // 놀이터 친구 연재
  aunt:{look:{skin:"#EDC6A6", hair:"#3A2A20", style:"bob", shirt:"#E8607F", pants:"#3A3D42"}, b:{h:0.95, w:1.02}},   // 분식집 이모
  gran:{look:{skin:"#EBC9AE", hair:"#C9C4BE", style:"bob", shirt:"#C8B4D0", pants:"#6A5E70"}, b:{h:0.88, w:0.98}},   // 문방구 할머니
  teach:{look:{skin:"#F2D2BA", hair:"#2A221E", style:"long", shirt:"#72C4AE", pants:"#F7F1EC"}, b:{h:0.98, w:0.9}},   // 담임 선생님
  /* 크레용초등학교 (기독교 사립초) · 크레용랜드 놀이공원 사람들 */
  chef:{look:{skin:"#EDC6A6", hair:"#3A2A20", style:"bob", hat:"bucket", hatC:"#FFFFFF", shirt:"#FFFFFF", pants:"#C8B4D0"}, b:{h:0.96, w:1.05}},   // 급식 조리사님
  coach:{look:{skin:"#E2B994", hair:"#1E1B18", style:"short", shirt:"#3A8A78", pants:"#2A2A28"}, b:{h:1.06, w:1.15}},   // 체육 선생님
  classmate:{look:{skin:"#F4D3BE", hair:"#4A2E24", style:"long", ribbon:"#FFD84D", shirt:"#F7F1EC", skirt:"#2F4A6E", skirtL:0.42, legs:"#FFFFFF", shoe:"#2A2A28"}, b:{h:0.75, w:0.88}},   // 같은 반 친구 서아 (교복)
  chaplain:{look:{skin:"#E8C3A2", hair:"#5A5550", style:"short", shirt:"#2A2A28", pants:"#2A2A28"}, b:{h:1.04, w:1.1}},   // 교목 목사님
  staff:{look:{skin:"#EBC4A4", hair:"#2A1E18", style:"short", hat:"bucket", hatC:"#E05A7A", shirt:"#E05A7A", pants:"#2A2A28"}, b:{h:1.0, w:1.05}},   // 놀이기구 직원
  cotton:{look:{skin:"#F2D2BA", hair:"#8A5A3C", style:"bob", shirt:"#F4A7B9", pants:"#FFFFFF"}, b:{h:0.97, w:0.95}},   // 솜사탕 언니
  clown:{look:{skin:"#FFF1E6", hair:"#E8604A", style:"pig", ribbon:"#4DAA97", shirt:"#F6E39A", pants:"#A9CBEA"}, b:{h:1.0, w:1.1}},   // 풍선 광대
  /* 강변 공원·동네 교회 */
  pastor:{look:{skin:"#EAC5A4", hair:"#2A221E", style:"short", shirt:"#F7F1EC", pants:"#4A4E58"}, b:{h:1.05, w:1.08}},   // 동네 교회 목사님
  fisher:{look:{skin:"#D9AE88", hair:"#D8D3CC", style:"short", hat:"bucket", hatC:"#7A8A5A", shirt:"#8FA06A", pants:"#5A5048"}, b:{h:0.98, w:1.12}},   // 낚시 할아버지
  boatman:{look:{skin:"#D6A884", hair:"#1E1B18", style:"short", hat:"bucket", hatC:"#2F4A6E", shirt:"#F2C14E", pants:"#2F4A6E"}, b:{h:1.07, w:1.2}},   // 오리배 아저씨
  picnic:{look:{skin:"#F4D6C2", hair:"#6A4030", style:"long", shirt:"#F6E39A", pants:"#72C4AE"}, b:{h:0.95, w:0.92}},   // 소풍 온 아주머니
  /* 크레용 전통시장 */
  halmi:{look:{skin:"#E4BC98", hair:"#E4E0DA", style:"bob", shirt:"#8C5A9A", pants:"#3A3D42"}, b:{h:0.86, w:1.02}},   // 채소 할머니
  tteok:{look:{skin:"#E6BE9C", hair:"#3A3330", style:"short", hat:"bucket", hatC:"#FFFFFF", shirt:"#FFFFFF", pants:"#8B5A3C"}, b:{h:1.02, w:1.14}},   // 떡집 사장님
  fishm:{look:{skin:"#CFA07C", hair:"#1E1B18", style:"short", shirt:"#2F6E8C", pants:"#2A2A28"}, b:{h:1.05, w:1.22}},   // 생선가게 아저씨
  hotteok:{look:{skin:"#F0CDB2", hair:"#8A4A2A", style:"long", shirt:"#E8A04A", pants:"#3A3D42"}, b:{h:0.95, w:0.98}},   // 호떡 이모
  /* 지나다니는 동네 주민 (2026-11-24 감독님 "전체적 동네 사람들… 텅텅 비었어") — 얼굴·머리·옷 다 다르게 */
  v1:{look:{skin:"#EBC9AE", hair:"#D8D3CC", style:"bob", shirt:"#C9D7A8", pants:"#6A6058"}, b:{h:0.86, w:0.98}},   // 산책 할머니
  v2:{look:{skin:"#E6C0A0", hair:"#1E1B18", style:"short", shirt:"#2F4A6E", pants:"#2A2A28", shoe:"#F1F2F4"}, b:{h:1.0, w:0.95}},   // 중학생 오빠
  v3:{look:{skin:"#F6D9C6", hair:"#5A3A2A", style:"long", shirt:"#F7F1EC", skirt:"#C8B4D0", skirtL:0.5, legs:"#F6D9C6", shoe:"#2A2A28"}, b:{h:0.97, w:0.88}},   // 회사원 언니
  v4:{look:{skin:"#D9AE88", hair:"#2A221E", style:"short", hat:"bucket", hatC:"#8B5A3C", shirt:"#8B5A3C", pants:"#5A5048"}, b:{h:1.06, w:1.18}},   // 택배 아저씨
  v5:{look:{skin:"#F2D2BA", hair:"#3A2A20", style:"bob", shirt:"#F4A7B9", pants:"#6FA8DC"}, b:{h:0.95, w:1.0}},   // 강아지 산책 아주머니
  v6:{look:{skin:"#EFC9A8", hair:"#8A5A3C", style:"pig", ribbon:"#72C4AE", shirt:"#FFE58A", skirt:"#E8607F", skirtL:0.38, legs:"#FFFFFF"}, b:{h:0.66, w:0.88}},   // 꼬마 동생
  v7:{look:{skin:"#E2B994", hair:"#C9C4BE", style:"short", hat:"bucket", hatC:"#4A4E58", shirt:"#A9CBEA", pants:"#3A3D42"}, b:{h:1.0, w:1.08}},   // 운동하는 할아버지
  v8:{look:{skin:"#F4D3BE", hair:"#2A1E18", style:"long", shirt:"#72C4AE", pants:"#F7F1EC"}, b:{h:0.98, w:0.9}},   // 대학생 언니
  v9:{look:{skin:"#DDB38E", hair:"#3A3330", style:"short", shirt:"#E8A04A", pants:"#2F4A6E"}, b:{h:1.08, w:1.12}},   // 아기 아빠
  v10:{look:{skin:"#F0CDB2", hair:"#1E1B18", style:"bob", ribbon:"#FF8FB8", shirt:"#B9A3C4", pants:"#4A4E58"}, b:{h:0.78, w:0.9}}};   // 초등학생 형아 친구
const ACT_KEYS = Object.keys(PLAY_LOOKS).filter(k => k !== "yu");
const ACT_NAME = {dad:"아빠", mom:"엄마", fr:"지유", ice:"아이스크림 아저씨", kid:"연재", aunt:"분식집 이모", gran:"문방구 할머니", teach:"선생님", chef:"조리사님", coach:"체육 선생님", classmate:"서아", chaplain:"목사님", staff:"직원 언니", cotton:"솜사탕 언니", clown:"풍선 광대", pastor:"목사님", fisher:"낚시 할아버지", boatman:"오리배 아저씨", picnic:"소풍 아주머니", halmi:"채소 할머니", tteok:"떡집 사장님", fishm:"생선가게 아저씨", hotteok:"호떡 이모", v1:"산책 할머니", v2:"중학생 오빠", v3:"회사원 언니", v4:"택배 아저씨", v5:"강아지 산책 아주머니", v6:"꼬마 동생", v7:"운동하는 할아버지", v8:"대학생 언니", v9:"아기 아빠", v10:"옆 반 친구"};
/* 유나 옷 (2026-11-23 감독님 "탈의실에서 옷 예쁘게 갈아입혀 지면 재밌겠네 수영장에도 탈의실에서 수영복") */
const YU_SKIN = "#F6D7C2", YU_B = {h:0.74, w:0.9}, yuL = o => ({look:{skin:YU_SKIN, hair:"#3A261C", style:"pig", ribbon:"#FF5FA8", ...o}, b:YU_B, extra:o.extra});
const YU_FITS = {
  base:PLAY_LOOKS.yu,
  dress:yuL({shirt:"#D9C6E6", skirt:"#F4B6CF", skirtL:0.5, legs:"#FFFFFF", shoe:"#FF8FB8", ribbon:"#FFFFFF", hat:"crown"}),
  hanbok:yuL({shirt:"#FFE08A", sleeve:"#F4A7B9", skirt:"#E05A7A", skirtL:0.62, legs:"#FFFFFF", shoe:"#E8607F", ribbon:"#E05A7A"}),
  director:yuL({shirt:"#2A2A28", pants:"#3A3D42", shoe:"#F1F2F4", hat:"bucket", hatC:"#CDBB9A", ribbon:null, extra:{headphones:"max", hpC:"#F4C7D3"}}),
  spring:yuL({shirt:"#FFD36B", skirt:"#FFD36B", skirtL:0.4, legs:YU_SKIN, shoe:"#FFFFFF", ribbon:"#FFFFFF"}),
  swim:yuL({shirt:"#FF6FAE", pants:"#FF6FAE", sleeve:YU_SKIN, thigh:YU_SKIN, legs:YU_SKIN, shoe:YU_SKIN, ribbon:"#FFFFFF"})};
const PL = {on:false, fit:"base", hair:"pig", hairC:"#3A261C", sit:null, cloak:false, stroke:"free", i:0, j:0, h:0, gy:0, in:[0, 0], yaw:0, el:0.62, d:5.2, dd:5.2, step:0, spd:0, moving:false, swim:null, freeze:false, dragAt:0, wave:0,
  mark:null, actors:{}, ball:null, water:[], hide:new Set(), cb:null, spawn:null, tg:null, jy:0, jv:0, boost:0, items:[], fx:[], swam:false, wet:0, drip:0, rip:0, dunk:0, bump:null, bumpAt:0, still:0, idleK:null, idleWait:8000, emoN:0, lastPost:0, hold:null, slosh:0, rk:null, sw:{}, camLock:null, tb:null};
const YU_R = 0.17, PV = new THREE.Vector3(), PV2 = new THREE.Vector3();
const wrapA = a => Math.atan2(Math.sin(a), Math.cos(a));
const inRect = (r, i, j) => i >= r[0] && i <= r[2] && j >= r[1] && j <= r[3];

/* 굳히기 전 가구 상자 → [x0,z0,x1,z1,y0,y1] */
function playBoxes(root){
  root.updateMatrixWorld(true); const out = [], b = new THREE.Box3();
  root.traverse(o => { if(!o.isMesh || o.userData.cls === "glow") return;
    if(!o.geometry.boundingBox) o.geometry.computeBoundingBox();
    b.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);
    if(b.min.y < 1.3 && b.max.y > 0.07) out.push(b.min.x, b.min.z, b.max.x, b.max.z, b.min.y, b.max.y); });
  return new Float32Array(out);
}
let BOX_Y = 0.9;   // 밑면이 유나 어깨(0.9)보다 낮은 건 다 막음: 식탁 상판(0.71)도 못 뚫게 (2026-11-27 감독님 "집 식탁쪽을 뚫어뿌네")
export function _boxY(v){ BOX_Y = v; if(R) R.pg = null; return BOX_Y; }   // 시험용
function inPoly(poly, x, y){ let c = false; for(let a = 0, b = poly.length - 1; a < poly.length; b = a++){ const [xa, ya] = poly[a], [xb, yb] = poly[b]; if((ya > y) !== (yb > y) && x < (xb - xa) * (y - ya) / (yb - ya) + xa) c = !c; } return c; }
function playGrid(){
  if(R.pg) return R.pg;
  const [e0, f0, e1, f1] = R.ext, C = 0.1, W = Math.ceil((e1 - e0) / C), H = Math.ceil((f1 - f0) / C), g = new Uint8Array(W * H), hm = new Float32Array(W * H), tp = new Float32Array(W * H), poly = R.walk || R.outline || [[e0, f0], [e1, f0], [e1, f1], [e0, f1]], m = 0.14;
  for(let y = 0; y < H; y++) for(let x = 0; x < W; x++){ const i = e0 + (x + 0.5) * C, j = f0 + (y + 0.5) * C;
    if(!inPoly(poly, i - m, j - m) || !inPoly(poly, i + m, j - m) || !inPoly(poly, i - m, j + m) || !inPoly(poly, i + m, j + m)) g[y * W + x] = 1; }
  const b = R.boxes || [];
  for(let k = 0; k < b.length; k += 6){ if(b[k + 4] >= BOX_Y) continue;
    const x0 = Math.max(0, Math.floor((b[k] + OX - e0) / C)), x1 = Math.min(W - 1, Math.floor((b[k + 2] + OX - e0) / C - 1e-6));
    const y0 = Math.max(0, Math.floor((b[k + 1] + OZ - f0) / C)), y1 = Math.min(H - 1, Math.floor((b[k + 3] + OZ - f0) / C - 1e-6));
    const top = b[k + 5], low = top < 0.3;
    for(let y = y0; y <= y1; y++) for(let x = x0; x <= x1; x++){ const n = y * W + x; if(low) hm[n] = Math.max(hm[n], top); else { g[n] = 1; tp[n] = Math.max(tp[n], top); } } }
  return R.pg = {g, hm, tp, W, H, C, e0, f0};
}
function cellIdx(i, j){ const G = playGrid(), x = Math.floor((i - G.e0) / G.C), y = Math.floor((j - G.f0) / G.C); return x < 0 || y < 0 || x >= G.W || y >= G.H ? -1 : y * G.W + x; }
function cellBlocked(i, j){ if(PL.water.some(w => inRect(w.walk || w.rect, i, j))) return false; const n = cellIdx(i, j); return n < 0 || R.pg.g[n] === 1; }
function groundH(i, j){ if(PL.water.some(w => inRect(w.walk || w.rect, i, j))) return 0; const n = cellIdx(i, j); return n < 0 ? 0 : R.pg.hm[n]; }
function freeAt(i, j, r = YU_R){ if(cellBlocked(i, j)) return false; for(let k = 0; k < 8; k++){ const a = k * Math.PI / 4; if(cellBlocked(i + Math.cos(a) * r, j + Math.sin(a) * r)) return false; } return true; }
function nearFree(i, j, r0 = YU_R){ if(freeAt(i, j, r0)) return [i, j]; for(let r = 0.15; r < 7; r += 0.15) for(let k = 0; k < 20; k++){ const a = k * Math.PI / 10, x = i + Math.cos(a) * r, y = j + Math.sin(a) * r; if(freeAt(x, y, r0)) return [x, y]; } return [i, j]; }

function reachMap(){
  const G = playGrid(); if(G.reach !== undefined) return G.reach;
  const M = new Uint8Array(G.W * G.H), q = [], [si, sj] = nearFree(13.9, 17.1), s0 = cellIdx(si, sj);
  if(s0 < 0) return G.reach = null;
  const ok = n => freeAt(G.e0 + (n % G.W + 0.5) * G.C, G.f0 + ((n / G.W | 0) + 0.5) * G.C);
  M[s0] = 1; q.push(s0);
  while(q.length){ const n = q.pop(), x = n % G.W, y = n / G.W | 0;
    for(const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]){ const x2 = x + a, y2 = y + b; if(x2 < 0 || y2 < 0 || x2 >= G.W || y2 >= G.H) continue; const m = y2 * G.W + x2; if(M[m]) continue; M[m] = 2; if(ok(m)){ M[m] = 1; q.push(m); } } }
  return G.reach = M;
}
/* 도착 자리 (2026-11-28 감독님 "시장에서 나오더니 여기 갇히노": 골목 가로수 화단 안에 떨어져 못 나옴)
   걸을 수 있는 칸을 이어진 덩어리로 나눠 가장 큰 덩어리(= 그 층 바닥)를 찾고, 도착 자리가 화단·울타리 안 같은 작은 덩어리면 가장 가까운 큰 덩어리 칸으로 옮김 */
function mainMap(){
  const G = playGrid(); if(G.main !== undefined) return G.main;
  const n = G.W * G.H, ok = new Uint8Array(n), lab = new Int32Array(n), st = new Int32Array(n); let best = 0, bs = 0, id = 0;
  for(let k = 0; k < n; k++) ok[k] = freeAt(G.e0 + (k % G.W + 0.5) * G.C, G.f0 + ((k / G.W | 0) + 0.5) * G.C) ? 1 : 0;
  for(let k = 0; k < n; k++){ if(!ok[k] || lab[k]) continue; id++; let top = 0, size = 0; st[top++] = k; lab[k] = id;
    while(top){ const c = st[--top], x = c % G.W, y = c / G.W | 0; size++;
      if(x > 0 && ok[c - 1] && !lab[c - 1]){ lab[c - 1] = id; st[top++] = c - 1; } if(x < G.W - 1 && ok[c + 1] && !lab[c + 1]){ lab[c + 1] = id; st[top++] = c + 1; }
      if(y > 0 && ok[c - G.W] && !lab[c - G.W]){ lab[c - G.W] = id; st[top++] = c - G.W; } if(y < G.H - 1 && ok[c + G.W] && !lab[c + G.W]){ lab[c + G.W] = id; st[top++] = c + G.W; } }
    if(size > bs){ bs = size; best = id; } }
  if(!best) return G.main = null; const M = new Uint8Array(n); for(let k = 0; k < n; k++) M[k] = lab[k] === best ? 1 : 0; return G.main = M;
}
function spawnSpot(i, j){
  const p = nearFree(i, j), G = playGrid(), M = mainMap(), n = cellIdx(p[0], p[1]); if(!M || (n >= 0 && M[n])) return p;
  const x0 = Math.floor((i - G.e0) / G.C), y0 = Math.floor((j - G.f0) / G.C); let best = -1, bd = 1e9;
  for(let q = 1; q <= 80 && best < 0; q++) for(let y = y0 - q; y <= y0 + q; y++) for(let x = x0 - q; x <= x0 + q; x++){ if(x < 0 || y < 0 || x >= G.W || y >= G.H || (Math.abs(x - x0) !== q && Math.abs(y - y0) !== q)) continue; const m = y * G.W + x; if(!M[m]) continue; const d = (x - x0) * (x - x0) + (y - y0) * (y - y0); if(d < bd){ bd = d; best = m; } }
  return best < 0 ? p : [G.e0 + (best % G.W + 0.5) * G.C, G.f0 + ((best / G.W | 0) + 0.5) * G.C];
}
export function playSpawnCheck(i, j){ if(!R) return null; playGrid(); const a = nearFree(i, j), b = spawnSpot(i, j), M = mainMap(), n = cellIdx(a[0], a[1]); return {ok:!!M && n >= 0 && !!M[n], moved:+Math.hypot(a[0] - i, a[1] - j).toFixed(2), fix:[+b[0].toFixed(2), +b[1].toFixed(2)]}; }
const reachable = (i, j) => { const M = reachMap(), n = cellIdx(i, j); return !M || (n >= 0 && M[n] === 1); };
export function playReach(i, j){ return R ? reachable(i, j) : false; }   // 시험용: 그 칸에 걸어서 갈 수 있나
export function playBlocked(i, j){ return R ? (playGrid(), cellBlocked(i, j)) : null; }   // 시험용: 그 점이 막혔나
export function playGround(i, j){ return R ? (playGrid(), groundH(i, j)) : 0; }   // 그 칸 바닥 높이 (주민이 계산대 위로 올라가지 않게, 2026-11-26)

/* 줍는 것들 (보물·번개 사탕·별똥별·고양이·❗): 이모지 스프라이트 (2026-11-23 감독님 "재미난 모험요소 많이") */
const EMO = {};
function emoTex(e, glow){
  const k = e + (glow ? "*" : ""); if(EMO[k]) return EMO[k];
  const c = document.createElement("canvas"); c.width = c.height = 128; const x = c.getContext("2d");
  if(glow){ const g = x.createRadialGradient(64, 64, 6, 64, 64, 63); g.addColorStop(0, "rgba(255,248,210,.95)"); g.addColorStop(0.42, "rgba(255,210,110,.5)"); g.addColorStop(1, "rgba(255,210,110,0)"); x.fillStyle = g; x.fillRect(0, 0, 128, 128); }
  x.font = `${glow ? 68 : 96}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(e, 64, 70);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return EMO[k] = t;
}
let SHG = null, SHM = null;
/* 따라다니는 고양이 (크레파스): 이모지 판 대신 걷는 3D 고양이. 다리·꼬리·머리가 움직이고, 서 있으면 앉아서 유나를 봄 (2026-11-26 감독님 "인형같이 가만히 있잖아") */
const CATM = {};
const catMat = c => CATM[c] || (CATM[c] = cutaway(new THREE.MeshStandardMaterial({color:c, roughness:0.78})));
function catRig(meat){
  const O = "#E8A04A", D = "#C98436", L = "#FFE9C7", K2 = "#2A2A28", m = (g, c, x, y, z, par) => { const o = new THREE.Mesh(g, catMat(c)); o.position.set(x, y, z); o.castShadow = true; par.add(o); return o; };
  const root = new THREE.Group(), body = new THREE.Group(); body.position.y = 0.2; root.add(body); root.scale.setScalar(0.85);
  m(sph(1, 16, 12), O, 0, 0, 0, body).scale.set(0.115, 0.105, 0.21);
  m(sph(1, 12, 8), L, 0, -0.035, 0.03, body).scale.set(0.085, 0.07, 0.15);   // 배
  [-0.11, -0.03, 0.05].forEach(z => { const k = Math.sqrt(1 - (z / 0.21) ** 2); m(sph(1, 16, 8), D, 0, 0.012, z, body).scale.set(0.117 * k + 0.002, 0.098 * k + 0.002, 0.022); });   // 등 줄무늬 (몸 곡면을 따라 감싼 띠)
  const head = new THREE.Group(); head.position.set(0, 0.1, 0.2); body.add(head);
  m(sph(1, 16, 12), O, 0, 0, 0, head).scale.set(0.118, 0.105, 0.105);
  m(sph(1, 12, 8), L, 0, -0.035, 0.07, head).scale.set(0.06, 0.042, 0.045);   // 주둥이
  [-1, 1].forEach(sd => { const e = m(geo("catEar", () => new THREE.ConeGeometry(0.042, 0.075, 4)), O, sd * 0.062, 0.088, -0.005, head); e.rotation.set(-0.15, Math.PI / 4, sd * -0.32);
    m(sph(1, 8, 6), K2, sd * 0.045, 0.02, 0.092, head).scale.set(0.016, 0.022, 0.01);
    m(sph(1, 6, 4), "#FFFFFF", sd * 0.04, 0.028, 0.1, head).scale.set(0.006, 0.006, 0.004); });
  m(sph(1, 8, 6), "#F29BA6", 0, -0.012, 0.112, head).scale.set(0.014, 0.01, 0.008);
  [-0.05, 0.05].forEach(x => m(rbox(0.05, 0.012, 0.03, 0.004), D, x, 0.075, 0.02, head).rotation.z = x > 0 ? -0.3 : 0.3);   // 이마 줄무늬
  if(meat){ const mt = m(cap(0.03, 0.07), "#B5503F", 0, -0.06, 0.1, head); mt.rotation.z = Math.PI / 2; m(sph(1, 8, 6), "#F4E3D0", 0.07, -0.06, 0.1, head).scale.set(0.022, 0.018, 0.018); }
  const legs = [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sz]) => { const g = new THREE.Group(); g.position.set(sx * 0.06, -0.03, sz * 0.13); body.add(g);
    m(cyl(0.03, 0.024, 0.15, 8), O, 0, -0.08, 0, g); m(sph(1, 8, 6), L, 0, -0.16, 0.01, g).scale.set(0.03, 0.02, 0.036); return g; });
  const tail = []; let par = body;
  for(let k = 0; k < 5; k++){ const g = new THREE.Group(); g.position.set(0, k ? 0.06 : 0.02, k ? 0 : -0.2); par.add(g); m(cyl(0.022 - k * 0.002, 0.024 - k * 0.002, 0.07, 8), k % 2 ? D : O, 0, 0.03, 0, g); tail.push(g); par = g; }
  return {root, body, head, legs, tail, ph:0, yaw:0, sit:0, still:0, last:null};
}
function catPose(c, x, g, z, now, t, dt){
  const P = c.last ? Math.hypot(x - c.last[0], z - c.last[1]) : 0, sp = dt > 0 ? P / dt : 0; c.last = [x, z];
  const mv = sp > 0.12 ? Math.min(1, sp / 1.6) : 0;
  if(P > 0.0015 && P < 2){ const ty = Math.atan2(x - (c.px ?? x), z - (c.pz ?? z)); if(isFinite(ty) && (c.px != null)) c.yaw += wrapA(ty - c.yaw) * Math.min(1, dt * 9); }
  c.px = x; c.pz = z; c.still = mv ? 0 : c.still + dt;
  c.sit += ((c.still > 1.1 ? 1 : 0) - c.sit) * Math.min(1, dt * 4);
  if(mv) c.ph += dt * (6 + sp * 6);
  const R0 = c.root, s = c.sit, sw = Math.sin(c.ph) * 0.65 * mv;
  R0.position.set(x, g, z); R0.rotation.y = c.yaw;
  c.body.position.y = 0.2 + Math.abs(Math.sin(c.ph)) * 0.018 * mv - s * 0.05; c.body.rotation.x = -s * 0.42; c.body.rotation.z = Math.sin(c.ph) * 0.04 * mv;
  c.body.scale.y = 1 + Math.sin(t * 2.4) * 0.015 * (1 - mv);   // 숨쉬기
  c.legs.forEach((l, k) => { const front = k < 2, ph = (k === 0 || k === 3) ? sw : -sw; l.rotation.x = front ? ph + s * 0.42 : ph - s * 1.25; l.position.y = -0.03 + (front ? 0 : s * 0.05); });
  const tl = mv ? 0.16 : 0.34, tb = mv ? -1.05 : -0.55 - s * 0.25;
  c.tail.forEach((g2, k) => { g2.rotation.x = k ? (mv ? 0.12 : 0.24) : tb; g2.rotation.z = Math.sin(t * (mv ? 5 : 2.2) - k * 0.7) * tl; });
  let look = 0; if(!mv && R.pl?.yu){ const p = R.pl.yu.root.position, a = Math.atan2(p.x - x, p.z - z); look = Math.max(-0.7, Math.min(0.7, wrapA(a - c.yaw))); }
  c.head.rotation.y += (look - c.head.rotation.y) * Math.min(1, dt * 4); c.head.rotation.x = s * 0.4 + Math.sin(c.ph * 2) * 0.05 * mv; c.head.rotation.z = (1 - mv) * Math.sin(t * 0.7) * 0.12;
}
function itemObj(it){
  if(it.model === "cat"){ const c = catRig(it.meat); R.scene.add(c.root);
    if(!SHG){ SHG = new THREE.CircleGeometry(0.15, 20); SHM = new THREE.MeshBasicMaterial({color:0x2A2030, transparent:true, opacity:0.22, depthWrite:false}); }
    const sh = new THREE.Mesh(SHG, SHM); sh.rotation.x = -Math.PI / 2; sh.scale.set(1.3, 1.9, 1); sh.renderOrder = 4; R.scene.add(sh); return {s:c.root, sh, cat:c}; }
  const s = new THREE.Sprite(new THREE.SpriteMaterial({map:emoTex(it.e, it.glow !== false), transparent:true, depthWrite:false, toneMapped:false}));
  s.renderOrder = 6; R.scene.add(s);
  if(!SHG){ SHG = new THREE.CircleGeometry(0.15, 20); SHM = new THREE.MeshBasicMaterial({color:0x2A2030, transparent:true, opacity:0.22, depthWrite:false}); }
  let sh = null; if(!it.on){ sh = new THREE.Mesh(SHG, SHM); sh.rotation.x = -Math.PI / 2; sh.renderOrder = 4; R.scene.add(sh); }
  return {s, sh};
}
function dropItem(it){ if(!it.o) return; it.o.s.removeFromParent(); it.o.s.material?.dispose(); it.o.sh?.removeFromParent(); it.o = null; }
function itemsPost(now, t){
  for(const it of PL.items){
    if(!it.o) it.o = itemObj(it);
    const o = it.o; let x, y, z;
    if(o.cat){ const g = groundH(it.i, it.j), dt = Math.min(0.1, (now - (o.cat.tl || now)) / 1000); o.cat.tl = now; catPose(o.cat, X(it.i), g, Z(it.j), now, t, dt);
      o.sh.position.set(X(it.i), g + 0.015, Z(it.j)); o.sh.rotation.z = o.cat.yaw; o.sh.visible = true; o.s.visible = !it.pop; continue; }
    if(it.on){ if(Array.isArray(it.on)){ x = X(it.on[0]); z = Z(it.on[1]); y = groundH(it.on[0], it.on[1]) + (it.on[2] ?? 1); o.s.visible = true; }
      else { const hp = headOf(it.on); o.s.visible = !!hp; if(!hp) continue;
        hp.head.getWorldPosition(tmp); x = tmp.x; z = tmp.z; y = tmp.y + 0.62 * hp.root.scale.y + (reduce || it.emo ? 0 : Math.sin(t * 4) * 0.05); }
      if(it.emo){ const k = Math.min(1, (now - it.emo) / it.life); PV2.setFromMatrixColumn(R.camera.matrixWorld, 0); x += PV2.x * 0.3; z += PV2.z * 0.3; y += 0.05 + k * 0.32;
        o.s.material.opacity = k < 0.12 ? k / 0.12 : k > 0.72 ? (1 - k) / 0.28 : 1; } }
    else { const g = groundH(it.i, it.j); x = X(it.i); z = Z(it.j); y = g + (it.y ?? 0.42) + (reduce || it.bob === false ? 0 : Math.sin(t * 2.6 + it.ph) * 0.06); o.sh.position.set(x, g + 0.015, z); o.sh.visible = true; }
    let sc = (it.s || 0.5) * (it.emo ? Math.min(1, 0.5 + (now - it.emo) / 240) : 1);
    if(it.pop){ const k = Math.min(1, (now - it.pop) / 320); sc *= 1 + k * 0.9; o.s.material.opacity = 1 - k; y += k * 0.4; if(o.sh) o.sh.visible = false; }
    o.s.scale.set(sc, sc, 1); o.s.position.set(x, y, z);
  }
  const gone = it => (it.pop && now - it.pop > 340) || (it.emo && now - it.emo > it.life);
  if(PL.items.some(gone)) PL.items = PL.items.filter(it => { if(gone(it)){ dropItem(it); return false; } return true; });
}
function playMakeAvatars(){
  const mk = (k, L0) => { const L = L0 || PLAY_LOOKS[k], yu = k === "yu", s = PARTS.length, p = makePerson(L.look, L.b, {...(L.extra || {}), ...(yu ? {hairAll:1} : {})});
    PARTS.slice(s).forEach(pt => { pt.vis = pt.hs ? () => p.root.visible && pt.hs === PL.hair : () => p.root.visible; if(yu && pt.hair) pt.yuHair = 1; });
    racketParts(p, yu ? "yu" : k); p.root.visible = false; return p; };
  const yus = {}; Object.keys(YU_FITS).forEach(k => yus[k] = mk("yu", YU_FITS[k]));
  const A = R.pl = {yus, yu:yus[PL.fit] || yus.base, bub:{}}; ACT_KEYS.forEach(k => A[k] = mk(k));
  // 테니스공 + 바닥 그림자 (playTBall)
  { const tc = document.createElement("canvas"); tc.width = 64; tc.height = 32; const x = tc.getContext("2d"); x.fillStyle = "#DDF24E"; x.fillRect(0, 0, 64, 32); x.strokeStyle = "#FFFFFF"; x.lineWidth = 2.4; x.beginPath();
    for(let u = 0; u <= 64; u++){ const y = 16 + Math.sin(u / 64 * Math.PI * 2) * 9; u ? x.lineTo(u, y) : x.moveTo(u, y); } x.stroke(); const tt = new THREE.CanvasTexture(tc); tt.colorSpace = THREE.SRGBColorSpace;
    A.tb = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), new THREE.MeshStandardMaterial({map:tt, roughness:0.7, emissive:0x2A3300})); A.tb.castShadow = true; A.tb.visible = false; R.scene.add(A.tb);
    A.tbs = new THREE.Mesh(new THREE.CircleGeometry(1, 20), new THREE.MeshBasicMaterial({color:0x1E2A20, transparent:true, opacity:0.32, depthWrite:false, toneMapped:false})); A.tbs.rotation.x = -Math.PI / 2; A.tbs.renderOrder = 3; A.tbs.visible = false; R.scene.add(A.tbs); }
  // 공 (흰 바탕 검은 점)
  const bc = document.createElement("canvas"); bc.width = 128; bc.height = 64; { const x = bc.getContext("2d"); x.fillStyle = "#F7F5F0"; x.fillRect(0, 0, 128, 64); x.fillStyle = "#2A2A28";
    [[16,14],[48,30],[80,12],[112,30],[32,50],[96,50],[64,52],[0,34],[128,34]].forEach(([a, c]) => { x.beginPath(); for(let k = 0; k < 5; k++){ const t = k / 5 * Math.PI * 2 - Math.PI / 2; x.lineTo(a + Math.cos(t) * 7, c + Math.sin(t) * 7); } x.fill(); }); }
  const bt = new THREE.CanvasTexture(bc); bt.colorSpace = THREE.SRGBColorSpace;
  A.ball = new THREE.Mesh(new THREE.SphereGeometry(0.13, 20, 14), new THREE.MeshStandardMaterial({map:bt, roughness:0.45})); A.ball.castShadow = true; A.ball.visible = false; R.scene.add(A.ball);
  // 목표 표시: 떠 있는 보석 + 바닥 고리
  A.mark = new THREE.Mesh(new THREE.OctahedronGeometry(0.17), new THREE.MeshBasicMaterial({color:0xFFC23D, toneMapped:false})); A.mark.scale.set(1, 1.35, 1); A.mark.visible = false; A.mark.renderOrder = 5; R.scene.add(A.mark);
  A.ring = new THREE.Mesh(new THREE.RingGeometry(0.34, 0.46, 40), new THREE.MeshBasicMaterial({color:0xFFC23D, transparent:true, opacity:0.75, depthWrite:false, side:THREE.DoubleSide, toneMapped:false}));
  A.ring.rotation.x = -Math.PI / 2; A.ring.visible = false; A.ring.renderOrder = 4; R.scene.add(A.ring);
  ["yu", ...ACT_KEYS].forEach(k => { const bub = document.createElement("div"); bub.className = "t3-bub" + (k === "yu" ? " yu" : ""); bub.hidden = true;
    const stem = document.createElement("div"); stem.className = "t3-stem" + (k === "yu" ? " yu" : ""); stem.hidden = true; R.layer.append(stem, bub); A.bub[k] = {bub, stem, say:"", until:0}; });
}
function enterPlay(){
  if(!R || !R.pl) return;
  R.zone = "play"; R.anim = null; R.layer.classList.remove("far"); R.layer.classList.add("play"); touchMode(true); if(R.back) R.back.hidden = true;
  R.camera.fov = 52; R.camera.near = 0.12; R.camera.updateProjectionMatrix();
  PL.mark = null; PL.act = null; PL.actors = {}; PL.ball = null; PL.water = []; PL.hide = new Set(); PL.freeze = false; PL.items.forEach(dropItem); PL.items = []; PL.jy = PL.jv = 0; fxClear(); propsClear(); PL.swam = false; PL.wet = 0; PL.idleK = null; PL.still = clock(); PL.sit = null; PL.rk = null; PL.sw = {}; PL.camLock = null; PL.camLead = null; PL.tb = null; PL.cloak = false; PL.auto = null; PL.face = null;
  const s = PL.spawn || [13.9, 17.1, Math.PI / 2]; PL.spawn = null;
  playGrid(); [PL.i, PL.j] = spawnSpot(s[0], s[1]); PL.h = s[2] ?? 0; PL.yaw = PL.h + Math.PI; PL.gy = groundH(PL.i, PL.j);
  PL.tg = new THREE.Vector3(X(PL.i), PL.gy + 0.62, Z(PL.j)); PL.dd = PL.d; R.cur = {tg:PL.tg.clone(), d:PL.d}; R.az = PL.yaw; R.el = PL.el;
  PL.cb?.onFloor?.(R.fid);
}
function playTick(now, t, dt){
  const [ix, iy] = PL.in; let mag = PL.freeze ? 0 : Math.min(1, Math.hypot(ix, iy));
  const AU = PL.auto; if(AU) mag = AU.v > 0.02 ? 1 : 0;   // 자동 헤엄 (50m 시합, 2026-11-28): 방향 AU.h · 속도 AU.v, 조이스틱 안 씀
  if(PL.sit){ if(mag > 0.35){ standUp(); PL.cb?.onStand?.(); } else mag = 0; }
  if(PL.act?.yawOff != null) PL.sitYaw = PL.h + PL.act.yawOff;   // 도는 놀이기구: 카메라가 기구 따라 돎 (2026-11-26)
  if((PL.sit || PL.act) && PL.sitYaw != null && !PL.dragAt && !PL.act?.path && !PL.act?.drive) PL.yaw += wrapA(PL.sitYaw - PL.yaw) * Math.min(1, dt * 2.6);
  if(PL.act?.el != null && !PL.dragAt){ if(PL.act.el0 == null) PL.act.el0 = PL.el; PL.el += (PL.act.el - PL.el) * Math.min(1, dt * 1.6); }   // 놀이기구별 카메라 높이 (관람차는 옆에서, 2026-11-26)
  PL.swim = PL.water.find(w => inRect(w.rect, PL.i, PL.j)) || null;
  { const cn = clock(), was = PL.swam; PL.swam = !!PL.swim;
    if(PL.swim && !was){ const sf = (PL.swim.surf ?? 0.06) + 0.012; fxRing(PL.i, PL.j, sf, true); fxDrops(PL.i, PL.j, sf + 0.05, 14, 1); PL.dunk = cn + 450; PL.cb?.onSplash?.("in"); }
    if(!PL.swim && was){ PL.wet = cn + 5200; PL.cb?.onSplash?.("out"); } }
  const DV = PL.act?.drive;   // 탈것 직접 조종 (오리배, 2026-11-26 감독님 "오리배는 직접 조정하게 해줘"): 걷기와 같은 조이스틱, 갈 수 있는 곳은 DV.ok(i, j)
  if(DV){ const m2 = Math.min(1, Math.hypot(ix, iy)); let v = PL.dv || 0;
    if(m2 > 0.06){ const fx = -Math.sin(PL.yaw), fz = -Math.cos(PL.yaw), rx = Math.cos(PL.yaw), rz = -Math.sin(PL.yaw), di = (fx * iy + rx * ix) / Math.hypot(ix, iy), dj = (fz * iy + rz * ix) / Math.hypot(ix, iy);
      PL.h += wrapA(Math.atan2(di, dj) - PL.h) * Math.min(1, dt * (DV.turn ?? 2.4)); v += ((DV.speed ?? 1.4) * m2 - v) * Math.min(1, dt * 1.8); }
    else v *= Math.exp(-dt * 1.6);
    const n = Math.max(1, Math.ceil(Math.abs(v) * dt / 0.05)); let hit = false;
    for(let k = 0; k < n; k++){ const si = Math.sin(PL.h) * v * dt / n, sj = Math.cos(PL.h) * v * dt / n;
      if(DV.ok(PL.i + si, PL.j + sj)){ PL.i += si; PL.j += sj; } else { hit = true; if(DV.ok(PL.i + si, PL.j)) PL.i += si * 0.6; else if(DV.ok(PL.i, PL.j + sj)) PL.j += sj * 0.6; } }
    if(hit){ v *= 0.55; if(clock() - (PL.bumpAt || 0) > 900){ PL.bumpAt = clock(); try { DV.bump?.(); } catch(e){} } }
    PL.dv = v; PL.act.lift = Math.max(0, (DV.seat ?? 0.4) - 0.4); try { DV.set?.(PL.i, PL.j, PL.h); } catch(e){}
    if(Math.abs(v) > 0.15 && now - PL.dragAt > 1400) PL.yaw += wrapA(PL.h + Math.PI - PL.yaw) * Math.min(1, dt * 0.9);
    mag = 0; }
  const hs = PL.hold && !PL.swim ? PL.hold.slow : 1;   // 손에 든 게 있으면 조심조심 (2026-11-23 감독님 "커피 심부름은 흐를까바 들고 약간 천천히")
  const sp = AU ? AU.v * mag : (PL.swim ? (PL.fit === "swim" ? 1.8 : 1.45) : 2.35 * (clock() < PL.boost && !PL.hold?.spill ? 1.6 : 1) * hs) * mag; let mi = 0, mj = 0;
  if(mag > 0.06){
    const fx = -Math.sin(PL.yaw), fz = -Math.cos(PL.yaw), rx = Math.cos(PL.yaw), rz = -Math.sin(PL.yaw);
    if(AU){ mi = Math.sin(AU.h); mj = Math.cos(AU.h); } else { mi = (fx * iy + rx * ix) / Math.hypot(ix, iy); mj = (fz * iy + rz * ix) / Math.hypot(ix, iy); }
    const st = sp * dt, ni = PL.i + mi * st, nj = PL.j + mj * st;
    const ob = playObs(), ok = (a, b) => freeAt(a, b) && pplOk(ob, a, b); PL.bump = null; let mv = true;   // 사람은 통과 못 함 (2026-11-23 감독님 "사람 통과하는거 고치면")
    if(ok(ni, nj)){ PL.i = ni; PL.j = nj; } else if(ok(ni, PL.j)) PL.i = ni; else if(ok(PL.i, nj)) PL.j = nj; else mv = false;
    if(!mv && PL.bump && clock() - PL.bumpAt > 2600){ PL.bumpAt = clock(); PL.cb?.onBump?.(PL.bump); }
    if(PL.face == null) PL.h += wrapA(Math.atan2(mi, mj) - PL.h) * Math.min(1, dt * 12);
    PL.lat = mi * Math.cos(PL.h) - mj * Math.sin(PL.h); PL.fwd = mi * Math.sin(PL.h) + mj * Math.cos(PL.h);   // 옆걸음 · 앞뒤 (테니스)
    PL.step += dt * sp * (PL.face == null ? 6.4 : 8.2);
    if(now - PL.dragAt > 1400 && iy > -0.35 && PL.camLock == null) PL.yaw += wrapA(PL.h + Math.PI - PL.yaw) * Math.min(1, dt * 1.15 * mag);   // 걸어가면 카메라가 천천히 등 뒤로
  }
  PL.moving = mag > 0.06; PL.spd = sp;
  if(PL.face != null && !PL.act && !PL.sit) PL.h += wrapA(PL.face - PL.h) * Math.min(1, dt * 10);   // 테니스: 늘 네트를 봄 (2026-11-28 감독님 "뛰는것도 사실 좀 달라야지")
  if(PL.camLock != null && now - PL.dragAt > 1400) PL.yaw += wrapA(PL.camLock - PL.yaw) * Math.min(1, dt * 3);   // 테니스: 카메라는 코트 뒤에 고정
  PL.gy += ((PL.swim || PL.act?.fn || PL.act?.drive ? 0 : PL.sit ? groundH(...PL.sit.from) : groundH(PL.i, PL.j)) - PL.gy) * Math.min(1, dt * 14);   // 놀이기구 탈 땐 땅 기준
  if(PL.jv || PL.jy > 0){ PL.jv -= 11 * dt; PL.jy = Math.max(0, PL.jy + PL.jv * dt); if(PL.jy === 0) PL.jv = 0; }
  { const cn = clock(); for(const it of PL.items){ if(it.pick === false || it.pop || it.on) continue;
      if(Math.hypot(it.i - PL.i, it.j - PL.j) < (it.r || 0.5) && (!it.high || PL.jy > 0.24)){ it.pop = cn; PL.cb?.onPick?.(it.id); } } }
  if(PL.ball) ballTick(dt, mi, mj, sp);
  if(PP.list.length) propTick(dt, mi, mj, sp);
  Object.values(PL.actors).forEach(a => { if(!a.to){ a.moving = false; return; }
    const dx = a.to[0] - a.i, dz = a.to[1] - a.j, d = Math.hypot(dx, dz);
    if(d < 0.04){ a.i = a.to[0]; a.j = a.to[1]; a.to = null; a.moving = false; return; }
    const st = Math.min(d, (a.spd || 1.2) * dt); a.i += dx / d * st; a.j += dz / d * st; a.h += wrapA(Math.atan2(dx, dz) - a.h) * Math.min(1, dt * 10); a.step = (a.step || 0) + dt * (a.spd || 1.2) * 6.4; a.moving = true; });
  const la = PL.camLead ?? (R.h < 560 && R.w > R.h * 1.25 ? 0.95 : 0);   // camLead: 테니스처럼 앞쪽(상대)을 더 보여 줄 때   // 가로 폰은 위가 잘려서 앞쪽을 더 보여 줌 (2026-11-23 감독님 "위가 좀 잘리네")
  PV.set(X(PL.i - Math.sin(PL.yaw) * la), PL.gy + (PL.swim ? 0.3 : 0.62) + PL.jy * 0.3 + (PL.act?.lift || 0), Z(PL.j - Math.cos(PL.yaw) * la)); PL.tg.lerp(PV, Math.min(1, dt * 9));
  // 카메라가 높은 벽·건물 뒤로 넘어가면 유나 쪽으로 당겨 옴 (GTA처럼)
  let lim = PL.act?.fn || PL.act?.drive ? PL.d * (PL.act.cam ?? 1.35) : PL.d; if(!PL.act?.fn && !PL.act?.drive){ const G = R.pg, ch = Math.cos(PL.el), sh = Math.sin(PL.el), si = Math.sin(PL.yaw) * ch, sj = Math.cos(PL.yaw) * ch, y0 = PL.tg.y;
    for(let s = PL.act ? 1.15 : 0.45; s < PL.d; s += 0.12){ const n = cellIdx(PL.i + si * s, PL.j + sj * s); if(n >= 0 && G.tp[n] > y0 + sh * s - 0.25){ lim = Math.max(0.9, s - 0.45); break; } } }
  PL.dd += (lim - PL.dd) * Math.min(1, dt * (lim < PL.dd ? 14 : 3));
  R.az = PL.yaw; R.el = PL.el; R.cur.tg.copy(PL.tg); R.cur.d = PL.dd;
  const fov = R.h > R.w * 1.1 ? 66 : R.h < 560 ? 58 : 52; if(R.camera.fov !== fov){ R.camera.fov = fov; R.camera.updateProjectionMatrix(); }   // 세로 폰은 옆이 좁아서 넓게
  PL.cb?.onTick?.(playState());
}
/* ---------- 장난치기: 툭 치면 쓰러지고 굴러가는 장난감 (2026-11-28 감독님 "장난치기") ----------
   게임이 playProps([{id, kind, at:[i, j], h}])로 놓음 → 유나가 걸어가 부딪히면 와르르. 조각은 도형 세 가지(상자·원통·공)를 인스턴싱.
   처음 쓰러질 때 cb.onKnock({id, kind, n, at}) · 다시 찰 때 {again:true}. playTidy() = 제자리로 */
const PP = {list:[], im:null, mat:null, tidy:0, pud:[], cap:110};
const PQ = new THREE.Quaternion(), PQ2 = new THREE.Quaternion(), PQI = new THREE.Quaternion(), PM4 = new THREE.Matrix4(), PSC = new THREE.Vector3(), PPOS = new THREE.Vector3(), PCOL = new THREE.Color(), PAX = new THREE.Vector3(), PUP = new THREE.Vector3(0, 1, 0);
const PRB = ["#F4A7B9", "#F9C99B", "#F6E39A", "#A8DCC8", "#A9CBEA", "#C8B4D0"];
const PROP_KIND = {
  blocks(a){ [[-0.19, 0], [0, 0], [0.19, 0], [-0.095, 1], [0.095, 1], [0, 2]].forEach(([d, r], k) => a("box", [0.18, 0.18, 0.18], ["#F25F5C", "#5E9BEA", "#FFE066", "#6FCF97", "#F4A7B9", "#C8B4D0"][k], d, 0.09 + r * 0.18, 0, {ry:(k % 3 - 1) * 0.12})); },
  books(a){ for(let k = 0; k < 5; k++) a("box", [0.32 - (k % 2) * 0.03, 0.055, 0.23], ["#E8607F", "#5E9BEA", "#F6E39A", "#72C4AE", "#C8B4D0"][k], (k % 2) * 0.015, 0.0275 + k * 0.055, 0, {ry:(k - 2) * 0.16, m:1.2}); },
  pins(a){ [[0, 0], [-0.1, 0.17], [0.1, 0.17], [-0.2, 0.34], [0, 0.34], [0.2, 0.34]].forEach(([d, f], k) => a("cyl", [0.12, 0.36, 0.12], k % 2 ? "#FFFFFF" : "#FFE3EC", d, 0.18, f, {b:0.3, m:0.8})); },
  ball(a){ a("sph", [0.32, 0.32, 0.32], "#FF6FA8", 0, 0.16, 0, {roll:1, b:0.62, f:0.55, m:0.7}); },
  cups(a){ [[-0.15, 0], [0, 0], [0.15, 0], [-0.075, 1], [0.075, 1], [0, 2]].forEach(([d, r], k) => a("cyl", [0.14, 0.16, 0.14], PRB[k], d, 0.08 + r * 0.16, 0, {m:0.5, b:0.35})); },
  pot(a){ a("cyl", [0.26, 0.22, 0.26], "#D98C6A", 0, 0.11, 0, {m:1.7, b:0.15}); a("sph", [0.36, 0.3, 0.36], "#6FAE64", 0, 0.34, 0, {m:1.1, b:0.2}); a("sph", [0.1, 0.1, 0.1], "#F4A7B9", 0.09, 0.5, 0.05, {m:0.4, roll:1}); a("sph", [0.09, 0.09, 0.09], "#FFE066", -0.08, 0.49, -0.04, {m:0.4, roll:1}); },
  bucket(a){ a("cyl", [0.3, 0.26, 0.3], "#6FB7E8", 0, 0.13, 0, {m:1.1, b:0.25}); a("box", [0.05, 0.5, 0.05], "#C9A27A", 0.1, 0.36, 0, {m:0.7, rz:-0.25}); },
  pillows(a){ for(let k = 0; k < 4; k++) a("cyl", [0.46, 0.15, 0.46], ["#F29CB7", "#B79AE0", "#F6D36A", "#8FC8F0"][k], 0, 0.07 + k * 0.14, 0, {ry:k * 0.5, b:0.04, f:4.5, m:0.9}); },
  tp(a){ for(let k = 0; k < 5; k++) a("cyl", [0.18, 0.13, 0.18], "#FFFFFF", (k % 2) * 0.012, 0.065 + k * 0.13, 0, {m:0.45, b:0.3, f:1.6}); },
  domino(a){ for(let k = 0; k < 11; k++) a("box", [0.14, 0.26, 0.04], PRB[k % 6], 0, 0.13, k * 0.15, {m:0.6, b:0.1, dom:k}); },
  duck(a){ [[0, 0], [0.2, 0.1], [-0.18, 0.14], [0.05, 0.3]].forEach(([d, f]) => a("sph", [0.17, 0.15, 0.2], "#FFD84D", d, 0.075, f, {roll:1, b:0.5, m:0.5, f:1.4})); },
};
function pudClear(){ PP.pud.forEach(d => { if(d.m){ d.m.removeFromParent(); d.m.geometry.dispose(); d.m.material.dispose(); } }); PP.pud = []; }
function pudAdd(i, j, r, now){ const m = new THREE.Mesh(new THREE.CircleGeometry(1, 30), cutaway(new THREE.MeshStandardMaterial({color:R.dark ? 0x6FA8C8 : 0xA9DCF5, roughness:0.12, metalness:0.1, transparent:true, opacity:0.62, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-2, polygonOffsetUnits:-2})));
  m.rotation.x = -Math.PI / 2; m.rotation.z = Math.random() * 6.28; m.position.set(X(i), groundH(i, j) + 0.008, Z(j)); m.scale.setScalar(0.01); m.renderOrder = 2; R.scene.add(m); PP.pud.push({m, t0:now, r, k:1}); }
function propsClear(){ PP.list = []; pudClear(); PP.tidy = 0; if(PP.im){ Object.values(PP.im).forEach(m => { m.removeFromParent(); m.geometry.dispose(); }); PP.mat?.dispose(); PP.im = null; PP.mat = null; } }
export function playProps(list){
  propsClear(); if(!R || !R.pl || !list || !list.length) return 0; playGrid();
  PP.mat = cutaway(new THREE.MeshStandardMaterial({roughness:0.62}));
  const G = {box:new THREE.BoxGeometry(1, 1, 1), cyl:new THREE.CylinderGeometry(0.5, 0.5, 1, 16), sph:new THREE.SphereGeometry(0.5, 16, 12)};
  PP.im = {}; Object.entries(G).forEach(([k, g]) => { const m = new THREE.InstancedMesh(g, PP.mat, PP.cap); m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; m.count = 0; R.scene.add(m); PP.im[k] = m; });
  list.forEach(pr => { const mk = PROP_KIND[pr.kind]; if(!mk) return; const h = pr.h || 0, ch = Math.cos(h), sh = Math.sin(h), g0 = groundH(pr.at[0], pr.at[1]);
    mk((shp, s, c, d, y, f, o = {}) => { const i = pr.at[0] + d * ch + f * sh, j = pr.at[1] - d * sh + f * ch, q = new THREE.Quaternion().setFromEuler(new THREE.Euler(o.rx || 0, (o.ry || 0) + h, o.rz || 0, "YXZ"));
      PP.list.push({pr:pr.id, kind:pr.kind, shp, s, c:new THREE.Color(c), i, y:g0 + y, j, vi:0, vy:0, vj:0, q, w:new THREE.Vector3(), r:Math.max(s[0], s[2]) * 0.5, half:[s[0] / 2, s[1] / 2, s[2] / 2], m:o.m || 1, b:o.b ?? 0.25, f:o.f ?? 2.6, roll:!!o.roll, dom:o.dom, dh:h,
        home:{i, y:g0 + y, j, q:q.clone()}, awake:false, hit:false, kick:0, pk:0, fallAt:0}); }); });
  propDraw(); return PP.list.length;
}
export function playTidy(){ if(!PP.list.some(p => p.hit)) return false; PP.tidy = clock(); PP.list.forEach(p => { p.from = {i:p.i, y:p.y, j:p.j, q:p.q.clone()}; p.awake = false; p.fallAt = 0; }); return true; }
export const playPropState = () => ({n:PP.list.length, hit:PP.list.filter(p => p.hit).length, awake:PP.list.filter(p => p.awake).length, tidy:!!PP.tidy, list:PP.list.map(p => [p.pr, +p.i.toFixed(2), +p.y.toFixed(2), +p.j.toFixed(2), p.hit ? 1 : 0])});
function propRest(p){ if(p.shp === "sph") return p.half[1]; let s = 0; for(let k = 0; k < 3; k++){ PAX.set(k === 0 ? 1 : 0, k === 1 ? 1 : 0, k === 2 ? 1 : 0).applyQuaternion(p.q); s += Math.abs(PAX.y) * p.half[k]; } return s; }
function propWake(p, vi, vy, vj, spin){ p.awake = true; p.vi = vi; p.vy = vy; p.vj = vj; p.w.set((Math.random() - 0.5) * spin, (Math.random() - 0.5) * spin * 0.6, (Math.random() - 0.5) * spin); }
function propKnock(p, di, dj, spd, now){   // 처음 맞은 조각: 같은 묶음도 같이 무너짐 (도미노는 차례로)
  const sib = PP.list.filter(q => q.pr === p.pr && q !== p && !q.hit); let n = 1; p.hit = true;
  if(p.kind === "domino"){ const dir = di * Math.sin(p.dh) + dj * Math.cos(p.dh) >= 0 ? 1 : -1; PP.list.filter(q => q.pr === p.pr).forEach(q => { const dk = (q.dom - p.dom) * dir; if(q !== p && dk > 0 && !q.hit){ q.fallAt = now + dk * 95; q.fdir = dir; } }); }
  else sib.forEach(q => { q.hit = true; n++; const up = Math.min(1, (q.home.y - p.home.y + 0.2) * 2.2); propWake(q, di * spd * (0.25 + Math.random() * 0.5) + (Math.random() - 0.5) * 0.9, 0.4 + Math.random() * 1.2 * up, dj * spd * (0.25 + Math.random() * 0.5) + (Math.random() - 0.5) * 0.9, 6); });
  if(p.kind === "bucket"){ pudAdd(p.i + di * 0.4, p.j + dj * 0.4, 0.62, now); fxDrops(p.i, p.j, p.y + 0.15, 18, 1, 0x9FD8F5); fxRing(p.i + di * 0.3, p.j + dj * 0.3, groundH(p.i, p.j) + 0.02, true); }
  if(p.kind === "pot") fxDrops(p.i, p.j, p.y + 0.2, 10, 0.8, 0x8A5A3C);
  try { PL.cb?.onKnock?.({id:p.pr, kind:p.kind, n, at:[p.i, p.j]}); } catch(e){ console.warn(e); }
}
function propTick(dt, mi, mj, sp){
  const now = clock(); dt = Math.min(dt, 0.045);
  if(PP.tidy){ const u = Math.min(1, (now - PP.tidy) / 900), e = u * u * (3 - 2 * u);
    PP.list.forEach(p => { if(!p.from) return; p.i = p.from.i + (p.home.i - p.from.i) * e; p.j = p.from.j + (p.home.j - p.from.j) * e; p.y = p.from.y + (p.home.y - p.from.y) * e + Math.sin(u * Math.PI) * 0.35 * (p.hit ? 1 : 0); p.q.copy(p.from.q).slerp(p.home.q, e); });
    PP.pud.forEach(d => d.k *= 1 - Math.min(1, dt * 5));
    if(u >= 1){ PP.tidy = 0; pudClear(); PP.list.forEach(p => { p.hit = false; p.from = null; p.vi = p.vy = p.vj = 0; p.w.set(0, 0, 0); p.q.copy(p.home.q); }); try { PL.cb?.onTidy?.(); } catch(e){} }
    propDraw(); return; }
  const canKick = PL.moving && !PL.sit && !PL.act && !PL.swim && !PL.cloak;
  for(const p of PP.list){
    if(p.fallAt && p.hit) p.fallAt = 0;
    if(p.fallAt && now >= p.fallAt){ p.fallAt = 0; const d = p.fdir || 1, si = Math.sin(p.dh) * d, sj = Math.cos(p.dh) * d; p.hit = true; p.awake = true; p.vi = si * 0.5; p.vj = sj * 0.5; p.vy = 0.2; p.w.set(sj * 7.5, 0, -si * 7.5); try { PL.cb?.onKnock?.({id:p.pr, kind:p.kind, n:1, at:[p.i, p.j], chain:true}); } catch(e){} }
    if(canKick && now - p.kick > 260){ const dx = p.i - PL.i, dz = p.j - PL.j, d = Math.hypot(dx, dz);
      if(d < p.r + 0.21 && p.y - p.half[1] - (PL.gy + PL.jy) < 0.75 && p.y + p.half[1] > PL.gy + PL.jy - 0.05){ p.kick = now;
        let ni = d > 1e-3 ? dx / d : mi, nj = d > 1e-3 ? dz / d : mj; ni = ni * 0.55 + mi * 0.85; nj = nj * 0.55 + mj * 0.85; const L = Math.hypot(ni, nj) || 1; ni /= L; nj /= L;
        const spd = (1.0 + sp * 0.8) / p.m * (0.75 + Math.random() * 0.5), first = !p.hit;
        if(p.kind === "domino" && first){ const d2 = ni * Math.sin(p.dh) + nj * Math.cos(p.dh) >= 0 ? 1 : -1, si = Math.sin(p.dh) * d2, sj = Math.cos(p.dh) * d2; p.awake = true; p.vi = si * 0.5; p.vj = sj * 0.5; p.vy = 0.2; p.w.set(sj * 7.5, 0, -si * 7.5); }
        else propWake(p, ni * spd, (0.9 + Math.random() * 1.5 + sp * 0.22) / Math.sqrt(p.m) * (p.b < 0.1 ? 0.6 : 1), nj * spd, p.roll ? 0 : 7.5);
        if(first) propKnock(p, ni, nj, spd, now); else try { PL.cb?.onKnock?.({id:p.pr, kind:p.kind, n:0, at:[p.i, p.j], again:true}); } catch(e){} } }
    if(!p.awake) continue;
    p.vy -= 9.8 * dt;
    const ni = p.i + p.vi * dt, nj = p.j + p.vj * dt;
    if(cellBlocked(ni, p.j)){ p.vi *= -0.42; if(Math.abs(p.vi) > 0.9) p.thud = now; } else p.i = ni;
    if(cellBlocked(p.i, nj)){ p.vj *= -0.42; if(Math.abs(p.vj) > 0.9) p.thud = now; } else p.j = nj;
    p.y += p.vy * dt;
    const wl = p.w.length(); if(wl > 1e-3){ PQ.setFromAxisAngle(PAX.copy(p.w).multiplyScalar(1 / wl), wl * dt); p.q.premultiply(PQ); }
    const g = groundH(p.i, p.j) + propRest(p);
    if(p.y <= g){ p.y = g; if(p.vy < -1.3) p.vy = -p.vy * p.b; else p.vy = 0;
      const fr = Math.exp(-dt * p.f); p.vi *= fr; p.vj *= fr; const hv = Math.hypot(p.vi, p.vj);
      if(p.roll){ const r = p.half[1]; p.w.set(p.vj / r, 0, -p.vi / r); if(hv < 0.04 && p.vy === 0){ p.awake = false; p.vi = p.vj = 0; p.w.set(0, 0, 0); } }
      else { p.w.multiplyScalar(Math.exp(-dt * 3.6)); let bk = 0, by = 0;
        if(p.w.length() < 2.4){ for(let k = 0; k < 3; k++){ PAX.set(k === 0 ? 1 : 0, k === 1 ? 1 : 0, k === 2 ? 1 : 0).applyQuaternion(p.q); if(Math.abs(PAX.y) > Math.abs(by)){ by = PAX.y; bk = k; } }
          PAX.set(bk === 0 ? 1 : 0, bk === 1 ? 1 : 0, bk === 2 ? 1 : 0).applyQuaternion(p.q); if(by < 0) PAX.multiplyScalar(-1);
          PQ.setFromUnitVectors(PAX, PUP); PQ2.identity().slerp(PQ, Math.min(1, dt * 9)); p.q.premultiply(PQ2).normalize();
          if(hv < 0.05 && p.vy === 0 && Math.abs(by) > 0.997 && p.w.length() < 0.4){ p.awake = false; p.vi = p.vj = 0; p.w.set(0, 0, 0); } } } }
    // 굴러가다 다른 조각을 침 (볼링 · 연쇄)
    const hv = Math.hypot(p.vi, p.vj);
    if(hv > 0.55) for(const q of PP.list){ if(q === p || now - q.pk < 220) continue; const dx = q.i - p.i, dz = q.j - p.j, dy = q.y - p.y; if(Math.abs(dy) > p.half[1] + q.half[1] + 0.05) continue; const d = Math.hypot(dx, dz);
      if(d < p.r + q.r && (dx * p.vi + dz * p.vj) > 0){ q.pk = now; const nx = d > 1e-3 ? dx / d : 0, nz = d > 1e-3 ? dz / d : 0, k = Math.min(1.2, p.m / q.m) * 0.75, first = !q.hit;
        if(q.kind === "domino" && first){ const d2 = nx * Math.sin(q.dh) + nz * Math.cos(q.dh) >= 0 ? 1 : -1, si = Math.sin(q.dh) * d2, sj = Math.cos(q.dh) * d2; q.awake = true; q.vi = si * 0.5; q.vj = sj * 0.5; q.vy = 0.2; q.w.set(sj * 7.5, 0, -si * 7.5); }
        else propWake(q, nx * hv * k + p.vi * 0.25, 0.5 + Math.random() * 1.1, nz * hv * k + p.vj * 0.25, q.roll ? 0 : 7);
        p.vi *= 0.62; p.vj *= 0.62; if(first) propKnock(q, nx, nz, hv * k, now); } }
  }
  propDraw();
}
function propDraw(){
  if(!PP.im) return; const n = {box:0, cyl:0, sph:0}, now = clock();
  for(const p of PP.list){ const im = PP.im[p.shp], k = n[p.shp]++; if(k >= PP.cap) continue; PM4.compose(PPOS.set(X(p.i), p.y, Z(p.j)), p.q, PSC.set(p.s[0], p.s[1], p.s[2])); im.setMatrixAt(k, PM4); im.setColorAt(k, p.c); }
  for(const d of PP.pud){ const u = Math.min(1, (now - d.t0) / 700), r = Math.max(0.01, d.r * (1 - (1 - u) * (1 - u)) * d.k); d.m.scale.set(r, r * 0.82, 1); }
  Object.entries(PP.im).forEach(([k, im]) => { im.count = Math.min(PP.cap, n[k]); im.instanceMatrix.needsUpdate = true; if(im.instanceColor) im.instanceColor.needsUpdate = true; });
}
/* 길 찾기: (i0, j0)에서 (i1, j1)로 가는 다음 발걸음 한 점 (엄마가 벽·가구를 돌아서 쫓아오게). 못 가면 null */
export function playPath(i0, j0, i1, j1, r = 0.2){
  if(!R) return null; const G = playGrid();
  if(!G.clr || G.clrR !== r){ G.clr = new Uint8Array(G.W * G.H); G.clrR = r; for(let n = 0; n < G.W * G.H; n++) G.clr[n] = freeAt(G.e0 + (n % G.W + 0.5) * G.C, G.f0 + ((n / G.W | 0) + 0.5) * G.C, r) ? 1 : 0; }
  const cen = n => [G.e0 + (n % G.W + 0.5) * G.C, G.f0 + ((n / G.W | 0) + 0.5) * G.C];
  const snap = (i, j) => { const n = cellIdx(i, j); if(n >= 0 && G.clr[n]) return n; const x0 = Math.floor((i - G.e0) / G.C), y0 = Math.floor((j - G.f0) / G.C); let best = -1, bd = 1e9;   // 벽에 붙어 서 있으면 가장 가까운 빈 칸에서 시작
    for(let q = 1; q <= 12 && best < 0; q++) for(let y = y0 - q; y <= y0 + q; y++) for(let x = x0 - q; x <= x0 + q; x++){ if(x < 0 || y < 0 || x >= G.W || y >= G.H || (Math.abs(x - x0) !== q && Math.abs(y - y0) !== q)) continue; const m = y * G.W + x; if(!G.clr[m]) continue; const d = (x - x0) * (x - x0) + (y - y0) * (y - y0); if(d < bd){ bd = d; best = m; } }
    return best; };
  const s = snap(i0, j0), g = snap(i1, j1); if(s < 0 || g < 0) return null; if(s === g) return [i1, j1];
  const par = new Int32Array(G.W * G.H).fill(-1), qu = new Int32Array(G.W * G.H); let qh = 0, qt = 0; par[g] = g; qu[qt++] = g; const W = G.W, H = G.H;
  while(qh < qt){ const n = qu[qh++]; if(n === s) break; const x = n % W, y = n / W | 0;
    for(let k = 0; k < 8; k++){ const a = [1, -1, 0, 0, 1, 1, -1, -1][k], b = [0, 0, 1, -1, 1, -1, 1, -1][k], x2 = x + a, y2 = y + b; if(x2 < 0 || y2 < 0 || x2 >= W || y2 >= H) continue; const m = y2 * W + x2;
      if(par[m] >= 0 || !G.clr[m]) continue; if(k > 3 && (!G.clr[y * W + x2] || !G.clr[y2 * W + x])) continue; par[m] = n; qu[qt++] = m; } }
  if(par[s] < 0) return null;
  const clear = (a, b) => { const [ai, aj] = a, [bi, bj] = b, n = Math.max(1, Math.ceil(Math.hypot(bi - ai, bj - aj) / 0.1)); for(let k = 1; k <= n; k++){ const c = cellIdx(ai + (bi - ai) * k / n, aj + (bj - aj) * k / n); if(c < 0 || !G.clr[c]) return false; } return true; };
  const from = cen(s); if(Math.hypot(from[0] - i0, from[1] - j0) > 0.16) return from; let n = par[s], best = cen(n), steps = 0;
  while(n !== g && steps++ < 400){ n = par[n]; const c = n === g ? [i1, j1] : cen(n); if(clear(from, c)) best = c; else if(steps > 60) break; }
  return best;
}
/* 유나 둘레 사람들: [i, j, id]. 가까워지는 쪽으로만 막고 멀어지는 건 됨 (겹쳐 있어도 빠져나갈 수 있게) */
function playObs(){
  const out = [];
  Object.values(R.people).forEach(P => { if(!P.p.root.visible || PL.hide.has(P.id) || /yuna$/.test(P.id)) return; const q = P.p.root.position, i = q.x + OX, j = q.z + OZ; if(Math.abs(i - PL.i) < 2 && Math.abs(j - PL.j) < 2) out.push([i, j, P.id]); });
  Object.entries(PL.actors).forEach(([k, a]) => { if(a.pose !== "crouch") out.push([a.i, a.j, "@" + k]); });
  return out;
}
function pplOk(ob, i, j){
  for(const o of ob){ const dn = Math.hypot(i - o[0], j - o[1]); if(dn < 0.42 && dn < Math.hypot(PL.i - o[0], PL.j - o[1]) - 1e-4){ PL.bump = o[2]; return false; } }
  return true;
}
/* 물결 · 물방울 */
let FXG = null;
function fxInit(){ if(!FXG) FXG = {ring:new THREE.RingGeometry(0.16, 0.21, 36), drop:new THREE.SphereGeometry(0.032, 8, 6)}; }
function fxRing(i, j, y, big){
  fxInit(); const m = new THREE.Mesh(FXG.ring, new THREE.MeshBasicMaterial({color:0xFFFFFF, transparent:true, opacity:0.75, depthWrite:false, side:THREE.DoubleSide, toneMapped:false}));
  m.rotation.x = -Math.PI / 2; m.position.set(X(i), y, Z(j)); m.renderOrder = 5; R.scene.add(m);
  PL.fx.push({m, t0:clock(), life:big ? 1400 : 1050, kind:"ring", s0:big ? 1.3 : 0.8, s1:big ? 6 : 3.4});
}
function fxDrops(i, j, y, n, up, col = 0xD8F2FF){
  fxInit();
  for(let k = 0; k < n; k++){ const a = Math.random() * Math.PI * 2, v = (0.5 + Math.random() * 1.1) * (up > 0.5 ? 1 : 0.25);
    const m = new THREE.Mesh(FXG.drop, new THREE.MeshBasicMaterial({color:col, transparent:true, opacity:0.95, depthWrite:false, toneMapped:false}));
    m.position.set(X(i) + Math.cos(a) * 0.1, y, Z(j) + Math.sin(a) * 0.1); m.renderOrder = 6; R.scene.add(m);
    PL.fx.push({m, t0:clock(), life:650 + Math.random() * 400, kind:"drop", v:[Math.cos(a) * v, up * (1.5 + Math.random() * 1.7), Math.sin(a) * v]}); }
}
function fxTick(dt){
  const now = clock();
  PL.fx = PL.fx.filter(f => { if(now < f.t0){ f.m.visible = false; return true; } f.m.visible = true;   // 물총 물줄기는 차례로 늦게 나감
    const u = (now - f.t0) / f.life; if(u >= 1){ f.m.removeFromParent(); f.m.material.dispose(); return false; }
    if(f.kind === "ring"){ const s = f.s0 + (f.s1 - f.s0) * (1 - (1 - u) * (1 - u)); f.m.scale.set(s, s, 1); f.m.material.opacity = 0.75 * (1 - u); }
    else { f.v[1] -= 9 * dt; f.m.position.x += f.v[0] * dt; f.m.position.y += f.v[1] * dt; f.m.position.z += f.v[2] * dt; f.m.material.opacity = 0.95 * (1 - u * u); }
    return true; });
}
function fxClear(){ PL.fx.forEach(f => { f.m.removeFromParent(); f.m.material.dispose(); }); PL.fx = []; }
function swimFx(now){
  if(PL.swim && now > PL.rip){ const sf = (PL.swim.surf ?? 0.06) + 0.012, b = PL.moving ? 0.22 : 0;
    PL.rip = now + (PL.moving ? 230 : 560); fxRing(PL.i - Math.sin(PL.h) * b, PL.j - Math.cos(PL.h) * b, sf, false);
    if(PL.moving && Math.random() < 0.55) fxDrops(PL.i + Math.sin(PL.h) * 0.16, PL.j + Math.cos(PL.h) * 0.16, sf + 0.06, 2, 0.75); }
  Object.values(PL.actors).forEach(mom => {   // 물에 있는 사람 모두 물결 (엄마만 → 물총 싸움 상대도)
  if(mom && mom.pose === "swim" && now > (mom.rip || 0)){ mom.rip = now + (mom.moving ? 250 : 600); fxRing(mom.i, mom.j, (PL.water[0]?.surf ?? 0.06) + 0.012, false);
    if(mom.moving && Math.random() < 0.5) fxDrops(mom.i, mom.j, (PL.water[0]?.surf ?? 0.06) + 0.06, 2, 0.75); } });
  if(!PL.swim && now < PL.wet && now > PL.drip){ PL.drip = now + 130; fxDrops(PL.i + (Math.random() - 0.5) * 0.22, PL.j + (Math.random() - 0.5) * 0.22, PL.gy + PL.jy + 0.45 + Math.random() * 0.3, 1, 0.05, 0xBFE6FF); }
}
/* 가까이 가면 사람들이 유나 쪽으로 고개를 돌림 */
function lookYuna(dt){
  Object.values(R.people).forEach(P => { if(!P.p.root.visible || /yuna$/.test(P.id)) return;
    const r = P.p.root, dx = X(PL.i) - r.position.x, dz = Z(PL.j) - r.position.z, d = Math.hypot(dx, dz); let want = 0;
    if(d < 2.4 && d > 0.05){ const da = wrapA(Math.atan2(dx, dz) - r.rotation.y); if(Math.abs(da) < 2.1) want = Math.max(-1.05, Math.min(1.05, da)) * Math.min(1, (2.4 - d) / 0.6); }
    P.lk = (P.lk || 0) + (want - (P.lk || 0)) * Math.min(1, dt * 4); if(Math.abs(P.lk) > 0.01) P.p.head.rotation.y += P.lk; });
}
/* 머리 위 이모지 (playEmote) */
function headOf(id){
  if(id === "yu") return PL.on && R.pl ? R.pl.yu : null;
  if(id[0] === "@"){ const k = id.slice(1); return PL.actors[k] && R.pl ? R.pl[k] : null; }
  const P = R.people[id]; return P && P.p.root.visible ? P.p : null;
}
function ballFree(i, j){ const r = 0.12; return !cellBlocked(i, j) && !cellBlocked(i + r, j) && !cellBlocked(i - r, j) && !cellBlocked(i, j + r) && !cellBlocked(i, j - r); }
function ballTick(dt, mi, mj, sp){
  const b = PL.ball, dx = b.i - PL.i, dz = b.j - PL.j, d = Math.hypot(dx, dz) || 1e-3, nx = dx / d, nz = dz / d;
  if(d < 0.36 && !(b.free > clock())){
    if(PL.moving && (mi * nx + mj * nz) > -0.2){ const k = Math.max(3.4, sp * 2.0); b.vi = (nx * 0.45 + mi * 0.55) * k; b.vj = (nz * 0.45 + mj * 0.55) * k; b.kick = clock(); }
    const ni = PL.i + nx * 0.37, nj = PL.j + nz * 0.37; if(ballFree(ni, nj)){ b.i = ni; b.j = nj; } }
  const n = 4, A = R.pl.ball;
  for(let s = 0; s < n; s++){ const si = b.vi * dt / n, sj = b.vj * dt / n;
    if(ballFree(b.i + si, b.j)) b.i += si; else b.vi *= -0.55;
    if(ballFree(b.i, b.j + sj)) b.j += sj; else b.vj *= -0.55;
    const ds = Math.hypot(si, sj); if(ds > 1e-5){ PV2.set(sj, 0, -si).normalize(); A.rotateOnWorldAxis(PV2, ds / 0.13); } }
  const f = Math.exp(-dt * 1.05); b.vi *= f; b.vj *= f;
}
function playCut(){
  if(!PL.on || !R.pl){ PCUT_A.value.w = 0; return; }
  PV2.copy(R.cur.tg).addScaledVector(DIR, R.cur.d);
  PCUT_A.value.set(X(PL.i), PL.gy + 0.4 + (PL.act?.lift || 0), Z(PL.j), 1);   // 놀이기구 탈 땐 앉은 높이 기준 (관람차 살·칸이 뚫려 보이던 것, 2026-11-26)
  PCUT_B.value.set(PV2.x, PV2.y, PV2.z, 0.9);   // 카메라 → 유나 발끝 줄 위로 가리는 건 잘라 냄
}
/* 영법 (2026-11-23 감독님 "수영안 평형과 자유형도 하고"): back = 배영(누워서), free = 자유형(엎드려 팔 번갈아 돌리기 + 발차기 + 옆으로 숨), breast = 평형(팔 벌려 당기고 개구리 발차기, 숨 쉴 때 머리 들림) */
const BR_U = (t, k) => (t * 0.8 + k * 0.3) % 1;   // 평형 한 번 = 1.25초
const BR_PULL = u => u < 0.38 ? Math.sin(u / 0.38 * Math.PI / 2) : u < 0.55 ? 1 : Math.max(0, 1 - (u - 0.55) / 0.2);
function swimPose(p, t, k, moving, st = "back"){
  pose(p, "stand", t, {ph:k});
  if(reduce) return;
  if(moving && st === "free"){
    const br = Math.pow(Math.max(0, Math.sin(t * 1.7 + k)), 6); p.head.rotation.set(-0.38 + br * 0.2, br * 1.05, 0);
    p.arms.forEach((a, n) => { const th = (t * 3.4 + n * Math.PI + k) % (Math.PI * 2); a.sh.rotation.set(th, 0, (n ? -1 : 1) * (0.16 + (th < Math.PI ? 0.22 : 0))); a.el.rotation.set(th < Math.PI ? -0.55 : -0.2, 0, 0); });
    p.legs.forEach((l, n) => { l.hip.rotation.x = Math.sin(t * 9 + n * Math.PI) * 0.3; l.knee.rotation.x = 0.12 + Math.max(0, Math.sin(t * 9 + n * Math.PI + 0.6)) * 0.3; }); return; }
  if(moving && st === "breast"){
    const u = BR_U(t, k), pull = BR_PULL(u), bend = u < 0.38 ? 0 : u < 0.6 ? (u - 0.38) / 0.22 : u < 0.75 ? 1 - (u - 0.6) / 0.15 : 0;
    p.head.rotation.set(-0.3 - pull * 0.4, 0, 0);
    p.arms.forEach((a, n) => { const sg = n ? -1 : 1; a.sh.rotation.set(-Math.PI + pull * 1.25, 0, sg * (Math.sin(Math.min(1, u / 0.38) * Math.PI) * 0.9 + 0.06)); a.el.rotation.set(-pull * 1.2, 0, 0); });
    p.legs.forEach((l, n) => { const sg = n ? -1 : 1; l.hip.rotation.set(-bend * 0.55, 0, sg * (u > 0.55 && u < 0.8 ? Math.sin((u - 0.55) / 0.25 * Math.PI) * 0.5 : 0.02)); l.knee.rotation.x = bend * 1.55; }); return; }
  if(moving){ p.head.rotation.x = 0.3; p.arms.forEach((a, n) => { a.sh.rotation.set(-((t * 3.8 + n * Math.PI + k) % (Math.PI * 2)), 0, (n ? -1 : 1) * 0.28); a.el.rotation.set(-0.25, 0, 0); });
    p.legs.forEach((l, n) => l.hip.rotation.x = Math.sin(t * 9 + n * Math.PI) * 0.35); }
  else p.arms.forEach((a, n) => { a.sh.rotation.set(-0.6 + Math.sin(t * 5.2 + n * Math.PI + k) * 0.75, 0, (n ? -1 : 1) * 0.5); a.el.rotation.set(-0.35, 0, 0); });
}
const BK_E = new THREE.Euler(0, 0, 0, "YXZ");
function placeBody(p, i, j, h, gy, swim, t, k, moving, st = "back"){
  const r = p.root;
  if(!swim){ p.bk = 0; r.position.set(X(i), gy, Z(j)); r.rotation.set(0, h, 0); return; }
  // 서 있으면 어깨까지 물에 잠긴 채 둥둥, 움직이면 등을 대고 누워 머리 쪽으로 나아감 (배영)
  const now = clock(), dt = Math.min(0.05, (now - (p.bkT || now)) / 1000); p.bkT = now;
  p.bk = (p.bk || 0) + ((moving && !reduce ? 1 : 0) - (p.bk || 0)) * Math.min(1, dt * 3.2);
  const b = p.bk * p.bk * (3 - 2 * p.bk), s = r.scale.y, sf = swim.surf ?? 0.06, bob = reduce ? 0 : Math.sin(t * 2.4 + k) * 0.015;
  const yUp = sf - 1.25 * s + bob, yLie = sf - 0.1 * s + bob * 0.6, back = (1.95 * s - 0.3) * b;   // 누우면 머리끝이 앞 0.3칸에 오게 발을 뒤로 (벽에 머리 안 박히게)
  if(st === "free" || st === "breast"){   // 엎드려서 (머리 쪽으로 나아감). 평형은 숨 쉴 때 상체가 살짝 들림
    const lift = st === "breast" && !reduce ? BR_PULL(BR_U(t, k)) * b : 0, roll = st === "free" && !reduce ? Math.sin(t * 1.7 + k) * 0.22 * b : 0;
    r.position.set(X(i) - Math.sin(h) * back, yUp + (yLie - yUp) * b + lift * 0.07, Z(j) - Math.cos(h) * back);
    r.rotation.copy(BK_E.set(Math.PI / 2 * b - lift * 0.32, h, roll)); return; }
  r.position.set(X(i) - Math.sin(h) * back, yUp + (yLie - yUp) * b, Z(j) - Math.cos(h) * back);
  r.rotation.copy(BK_E.set(-Math.PI / 2 * b, h + Math.PI * b, 0));
}
function playPost(){
  const A = R.pl, now = clock(), t = (now - R.t0) / 1000;
  A.yu.root.visible = PL.on && !PL.cloak;
  if(!PL.on){ ACT_KEYS.forEach(k => A[k].root.visible = false); A.ball.visible = A.mark.visible = A.ring.visible = false; return; }
  ["_yuna", "l_yuna", ...PL.hide].forEach(id => { const P = R.people[id]; if(P) P.p.root.visible = false; });
  const p = A.yu, talk = now < A.bub.yu.until, dt = Math.min(0.05, (now - (PL.lastPost || now)) / 1000); PL.lastPost = now;
  // 가만히 있으면 혼자 놂 (두리번 · 깡충 · 빙글 · 흥얼 춤)
  if(PL.moving || PL.swim || PL.jy > 0 || PL.freeze || PL.sit){ PL.still = now; if(PL.moving || PL.swim) PL.idleK = null; }
  else if(PL.idleK && now > PL.idleK.until){ PL.idleK = null; PL.still = now; }
  else if(!PL.idleK && !talk && !reduce && !PL.hold && now - PL.still > PL.idleWait){ const k = ["look", "hop", "spin", "dance"][Math.random() * 4 | 0];
    PL.idleK = {k, t0:now, until:now + {look:2600, hop:1500, spin:1300, dance:3200}[k]}; PL.idleWait = 9000 + Math.random() * 7000; PL.cb?.onIdle?.(k); }
  let spin = 0, hop = 0; const IK = PL.idleK, iu = IK ? Math.min(1, (now - IK.t0) / (IK.until - IK.t0)) : 0;
  p.legs.forEach(l => l.hip.rotation.order = "XYZ"); p.arms.forEach(a => a.sh.rotation.order = "XYZ");
  if(PL.act) hop = actPose(p, t, now);
  else if(PL.sit){ const s = PL.sit, pray = s.pray || s.k === "church" || s.k === "pew";   // 교회 장의자: 손 모으고 기도   // 앉기 (2026-11-23 감독님 "의자에~ 예배를 드릴수가업네")
    pose(p, "sit", t, {ph:0.3, talk, seatY:(s.H - PL.gy + 0.045) / p.root.scale.y});
    if(!reduce && !pray) p.legs.forEach((l, n) => l.knee.rotation.x += Math.sin(t * 3.1 + n * Math.PI) * 0.3);   // 발 동동
    if(pray){ p.arms.forEach((a, n) => { a.sh.rotation.set(-0.62, 0, (n ? -1 : 1) * 0.1); a.el.rotation.set(-1.6, 0, (n ? -1 : 1) * 0.75); }); p.head.rotation.x = 0.36; }
 }
  else if(PL.swim) swimPose(p, t, 0, PL.moving, PL.stroke);
  else if(IK && !PL.moving && PL.jy === 0){
    if(IK.k === "look") pose(p, "stand", t, {ph:0.3, talk, turn:Math.sin(iu * Math.PI * 2) * 0.95});
    else { pose(p, "stand", t, {ph:0.3});
      if(IK.k === "spin"){ spin = (iu < 0.5 ? 2 * iu * iu : 1 - Math.pow(-2 * iu + 2, 2) / 2) * Math.PI * 2; p.arms.forEach((a, n) => a.sh.rotation.set(0, 0, (n ? -1 : 1) * 1.25)); }
      if(IK.k === "hop"){ hop = Math.abs(Math.sin(iu * Math.PI * 3)) * 0.13; p.arms.forEach((a, n) => { a.sh.rotation.set(-2.5, 0, (n ? -1 : 1) * 0.3); a.el.rotation.set(-0.2, 0, 0); }); }
      if(IK.k === "dance"){ p.arms.forEach((a, n) => { a.sh.rotation.set(-2.3 + Math.sin(t * 7 + n * Math.PI) * 0.45, 0, (n ? -1 : 1) * 0.35); a.el.rotation.set(-0.4, 0, 0); }); p.chest.rotation.z = Math.sin(t * 7) * 0.13; p.head.rotation.z = Math.sin(t * 7 + 0.6) * 0.15; p.hips.rotation.y = Math.sin(t * 3.5) * 0.25; } } }
  else if(PL.jy > 0){ pose(p, "stand", t, {ph:0.3}); if(!reduce) p.arms.forEach((a, n) => { a.sh.rotation.set(-2.6, 0, (n ? -1 : 1) * 0.35); a.el.rotation.set(-0.2, 0, 0); }); }
  else if(PL.moving && PL.face != null) pose(p, "shuffle", t, {step:PL.step, lat:PL.lat || 0, fwd:PL.fwd || 0});
  else if(PL.moving) pose(p, "walk", t, {step:PL.step});
  else pose(p, "stand", t, {ph:0.3, talk, wave:now < PL.wave});
  if(PL.rk?.yu && !PL.swim && !PL.sit && !PL.act) racketPose(p, "yu", now, PL.moving);
  const H = PL.hold && !PL.swim && !PL.sit ? PL.hold : null;
  if(H){ const sl = now < PL.slosh ? (PL.slosh - now) / 700 : 0;
    p.arms.forEach((a, n) => { const sg = n ? -1 : 1; a.sh.rotation.set(-0.78 + (PL.moving ? Math.sin(PL.step * 2) * 0.03 : 0) - sl * 0.25, 0, sg * 0.1); a.el.rotation.set(-1.05, 0, sg * 0.62); });
    if(PL.moving){ p.chest.rotation.x = 0.06; p.head.rotation.x = 0.22; } }   // 컵 내려다보며 걷기
  placeBody(p, PL.i, PL.j, PL.h + spin, PL.gy + PL.jy + hop + (PL.moving && !PL.jy && !PL.swim && !reduce ? Math.abs(Math.sin(PL.step)) * (H ? 0.012 : 0.035) : 0), PL.swim, t, 0, PL.moving, PL.stroke);
  if(PL.sit && (PL.sit.swing || PL.sit.sway) && !reduce){   // 그네·해먹: 앉은 채로 앞뒤(swing) · 옆(sway)으로 흔들 (2026-11-23 감독님 "그네 같은 물건도 이용할수있게")
    const s = PL.sit, w = Math.sin((now - (s.t0 || (s.t0 = now))) / 1000 * (s.swing ? 2.4 : 1.3)), fw = (s.swing || 0) * w, sw = (s.sway || 0) * w, h = PL.h;
    p.root.position.x += Math.sin(h) * fw * 0.55 + Math.cos(h) * sw * 0.35; p.root.position.z += Math.cos(h) * fw * 0.55 - Math.sin(h) * sw * 0.35;
    p.root.position.y += (1 - Math.cos(fw)) * 0.5; }
  if(PL.swim && now < PL.dunk) p.root.position.y -= Math.sin((1 - (PL.dunk - now) / 450) * Math.PI) * 0.16;   // 첨벙 하고 살짝 잠김
  ACT_KEYS.forEach((k, n) => { const a = PL.actors[k], q = A[k]; q.root.visible = !!a; if(!a) return;
    const sw = a.pose === "swim" ? (PL.water[0] || {surf:0.06}) : null, at = now < A.bub[k].until;
    if(sw) swimPose(q, t, 1.3 + n, a.moving, a.stroke || "free"); else if(a.moving) pose(q, "walk", t, {step:a.step}); else if(a.pose === "crouch"){ pose(q, "sit", t, {ph:n, seatY:0.34}); q.chest.rotation.x = 0.35; q.head.rotation.x = 0.25; }
    else pose(q, "stand", t, {ph:n, talk:at, wave:a.wave && now < a.wave});
    q.arms.forEach(a2 => a2.sh.rotation.order = "XYZ"); if(PL.rk?.[k] && !sw) racketPose(q, k, now, a.moving);
    placeBody(q, a.i, a.j, a.h || 0, a.pose === "crouch" ? 0 : groundH(a.i, a.j), sw, t, 1 + n, a.moving, a.stroke || "free"); });
  lookYuna(dt); swimFx(now); fxTick(dt);
  itemsPost(now, t); holdPost(p, H, now, t);
  { const b = PL.tb; A.tb.visible = A.tbs.visible = !!b && PL.on;
    if(b){ const r = b.r || 0.075, g = groundH(b.i, b.j); A.tb.scale.setScalar(r); A.tb.position.set(X(b.i), g + r + b.y, Z(b.j)); A.tb.rotation.x += 0.35; A.tb.rotation.z += 0.21;
      const s = r * (1.25 + Math.min(1.2, b.y * 0.5)); A.tbs.scale.set(s, s, 1); A.tbs.material.opacity = 0.36 / (1 + b.y * 0.9); A.tbs.position.set(X(b.i), g + 0.012, Z(b.j)); } }
  A.ball.visible = !!PL.ball; if(PL.ball) A.ball.position.set(X(PL.ball.i), 0.13 + groundH(PL.ball.i, PL.ball.j), Z(PL.ball.j));
  const m = markPos(); A.mark.visible = A.ring.visible = !!m;
  [A.yu, ...ACT_KEYS.map(k => A[k])].forEach(q => { if(q.root.visible) q.root.updateMatrixWorld(true); });
  if(m){ A.mark.position.set(m.x, m.y + 1.45 + (reduce ? 0 : Math.sin(t * 3) * 0.08), m.z); A.mark.rotation.y = t * 2.2; A.ring.position.set(m.x, m.y + 0.02, m.z); const s = 1 + (reduce ? 0 : Math.sin(t * 4) * 0.08); A.ring.scale.set(s, s, 1); }
}
/* 손에 든 것: 가슴 앞 두 손 사이에 이모지. 걸으면 살짝 찰랑, 흘릴 뻔하면 크게 흔들림 */
function holdPost(p, H, now, t){
  const A = R.pl;
  if(!H){ if(A.hold) A.hold.visible = false; return; }
  if(!A.hold){ A.hold = new THREE.Sprite(new THREE.SpriteMaterial({transparent:true, depthWrite:false, toneMapped:false})); A.hold.renderOrder = 6; R.scene.add(A.hold); }
  const s = A.hold; if(s.userData.e !== H.e){ s.material.map = emoTex(H.e, false); s.material.needsUpdate = true; s.userData.e = H.e; }
  p.root.updateMatrixWorld(true); p.chest.getWorldPosition(tmp);
  const sc = p.root.scale.y, fw = 0.3 * sc, sl = now < PL.slosh ? (PL.slosh - now) / 700 : 0;
  const pop = Math.min(1, (now - H.t0) / 380), k = pop < 1 ? 1 + Math.sin(pop * Math.PI) * 0.45 : 1;
  const w = reduce ? 0 : (PL.moving ? Math.sin(PL.step * 1.0) * 0.12 : Math.sin(t * 1.6) * 0.03) + Math.sin(now / 45) * 0.35 * sl;
  s.position.set(tmp.x + Math.sin(PL.h) * fw, tmp.y - 0.05 * sc, tmp.z + Math.cos(PL.h) * fw);
  s.material.rotation = w; const z = 0.34 * k * Math.min(1, pop * 3); s.scale.set(z, z, 1); s.visible = PL.on && !PL.cloak;
}
export function playSlosh(){   // 음료 들고 점프·부딪힘 → 찰랑 + 몇 방울
  if(!PL.on || !PL.hold) return false; PL.slosh = clock() + 700;
  const sc = R.pl?.yu?.root.scale.y || 0.66; fxDrops(PL.i + Math.sin(PL.h) * 0.2, PL.j + Math.cos(PL.h) * 0.2, PL.gy + 0.62 * sc, 5, 0.4, PL.hold.col || 0x8A5A3A); return true;
}
function markPos(){
  const k = PL.mark; if(!k) return null;
  if(k.at) return PV2.set(X(k.at[0]), groundH(k.at[0], k.at[1]), Z(k.at[1])).clone();
  if(k.actor){ const a = PL.actors[k.actor]; return a ? new THREE.Vector3(X(a.i), 0, Z(a.j)) : null; }
  if(k.id){ const P = R.people[k.id]; return P && P.p.root.visible ? new THREE.Vector3(P.p.root.position.x, 0, P.p.root.position.z) : null; }
  return null;
}
/* 기구 쓰기 (2026-11-23 감독님 "요가도 하고 러닝머신도 하고 세세한거 다 해줘"): 러닝머신 · 요가 · 덤벨 · 철봉 · 짐볼 · 스쿼트 · 탁구 · 인형뽑기 · 물 · VOD
   돌려주는 값 = 몸을 띄우는 높이 */
function actPose(p, t, now){
  const A = PL.act, el = reduce ? 0 : (now - A.t0) / 1000, k = A.k; let up = A.y || 0;
  const arms2 = (sx, sz, ex) => p.arms.forEach((a, n) => { const sg = n ? -1 : 1; a.sh.rotation.set(sx, 0, sg * sz); a.el.rotation.set(ex, 0, 0); });
  if(A.path){ const P = A.path, u = Math.min(1, (now - A.t0) / P.ms), a = P.a0 + u * P.turns * Math.PI * 2;   // 정해진 길로 움직이기 (자전거)
    PL.i = P.c[0] + P.rx * Math.cos(a); PL.j = P.c[1] + P.ry * Math.sin(a); PL.h = Math.atan2(-P.rx * Math.sin(a), P.ry * Math.cos(a)); try { A.prop?.(PL.i, PL.j, PL.h); } catch(e){} }
  if(A.fn){ let r = null; try { r = A.fn(el); } catch(e){}   // 놀이기구 (2026-11-24): fn(초) → [i, j, 앉는 높이, 보는 쪽, 몸 기울기]
    if(r){ PL.i = r[0]; PL.j = r[1]; if(r[3] != null) PL.h = r[3]; A.lift = Math.max(0, (r[2] ?? 0.4) - 0.4); A.tilt = r[4] || 0; } }
  if(k === "run"){ const st = el * 11, s = Math.sin(st); pose(p, "walk", t, {step:st});
    p.legs.forEach((l, n) => { const q = n ? -s : s; l.hip.rotation.x = q * 0.85; l.knee.rotation.x = Math.max(0, -q) * 1.3 + 0.25; });
    p.arms.forEach((a, n) => { const q = n ? s : -s; a.sh.rotation.x = q * 0.8; a.el.rotation.x = -1.35; });
    p.chest.rotation.x = 0.12; up += Math.abs(Math.cos(st)) * 0.05; }
  else if(k === "yoga"){ const ph = Math.floor(el / 3.6) % 3, u = Math.min(1, (el % 3.6) / 0.7);
    if(ph === 0){ pose(p, "stand", t, {});   // 나무 자세
      const L = p.legs[0]; L.hip.rotation.order = "YXZ"; L.hip.rotation.set(-1.0 * u, -1.15 * u, 0); L.knee.rotation.set(2.3 * u, 0, 0);
      p.arms.forEach((a, n) => { const sg = n ? -1 : 1; a.sh.rotation.set(0, 0, sg * (0.07 + 2.85 * u)); a.el.rotation.set(0, 0, sg * 0.55 * u); });
      p.chest.rotation.z = reduce ? 0 : Math.sin(t * 2.2) * 0.03; }
    else if(ph === 1){ pose(p, "stand", t, {});   // 전사 자세
      p.hips.position.y = 0.9 - 0.14 * u; p.legs[0].hip.rotation.x = -0.8 * u; p.legs[0].knee.rotation.x = 0.95 * u; p.legs[1].hip.rotation.x = 0.55 * u; p.legs[1].knee.rotation.x = 0.05;
      arms2(0, 0.07 + 1.5 * u, 0); p.head.rotation.y = 0.55 * u; }
    else { pose(p, "sit", t, {});   // 명상
      p.hips.position.y = 0.17; p.legs.forEach((l, n) => { const sg = n ? 1 : -1; l.hip.rotation.order = "YXZ"; l.hip.rotation.set(-1.42, sg * 0.85, 0); l.knee.rotation.set(2.55, 0, 0); });
      p.arms.forEach((a, n) => { const sg = n ? -1 : 1; a.sh.rotation.set(-0.45, 0, sg * 0.42); a.el.rotation.set(-0.35, 0, 0); }); p.head.rotation.x = 0.12; p.chest.rotation.x = -0.04; } }
  else if(k === "lift"){ pose(p, "stand", t, {});   // 덤벨 컬 (양팔 번갈아)
    p.arms.forEach((a, n) => { const u = Math.max(0, Math.sin(el * 3.2 + n * Math.PI)); a.sh.rotation.set(-0.25, 0, (n ? -1 : 1) * 0.14); a.el.rotation.set(-0.2 - 2.05 * u, 0, 0); });
    p.head.rotation.x = 0.05; }
  else if(k === "pullup"){ const u = (1 - Math.cos(el * 2.6)) / 2; pose(p, "stand", t, {});   // 철봉
    arms2(-2.95 + 0.5 * u, 0.22, -1.7 * u); p.legs.forEach((l, n) => { l.hip.rotation.x = -0.25 - n * 0.1; l.knee.rotation.x = 0.8; });
    up += 0.12 + 0.24 * u; }
  else if(k === "bounce"){ pose(p, "sit", t, {seatY:0.62 / p.root.scale.y});   // 짐볼
    up += Math.abs(Math.sin(el * 5)) * 0.09; arms2(-2.4 + Math.sin(el * 5) * 0.3, 0.3, -0.2); }
  else if(k === "squat"){ const u = (1 - Math.cos(el * 2.4)) / 2; pose(p, "stand", t, {});   // 케틀벨 스쿼트
    p.hips.position.y = 0.9 - 0.3 * u; p.legs.forEach(l => { l.hip.rotation.x = -1.15 * u; l.knee.rotation.x = 1.9 * u; }); p.chest.rotation.x = 0.38 * u; p.head.rotation.x = -0.3 * u;
    arms2(-0.7 - 0.5 * u, 0.12, -1.6); }
  else if(k === "pong"){ const sw = A.swing ? Math.max(0, 1 - (now - A.t0) / 380) : 0; pose(p, "stand", t, {});   // 탁구 (치면 sw)
    p.hips.position.y = 0.84; p.legs.forEach(l => { l.hip.rotation.x = -0.25; l.knee.rotation.x = 0.45; }); p.chest.rotation.x = 0.15;
    p.arms[1].sh.rotation.set(-0.7 - sw * 0.6, 0, -0.5 + sw * 0.9); p.arms[1].el.rotation.set(-0.9 + sw * 0.5, 0, 0); p.arms[0].sh.rotation.set(-0.45, 0, 0.2); p.arms[0].el.rotation.set(-0.6, 0, 0);
    p.chest.rotation.y = -0.25 + sw * 0.5; up += reduce ? 0 : Math.abs(Math.sin(t * 5)) * 0.015; }
  else if(k === "claw"){ pose(p, "stand", t, {}); arms2(-1.05, 0.12, -0.45); p.arms[1].sh.rotation.z = -0.12 + (reduce ? 0 : Math.sin(t * 4) * 0.08); p.head.rotation.x = -0.18; }
  else if(k === "read"){ pose(p, "stand", t, {phone:true}); p.head.rotation.x = 0.3; if(!reduce && Math.sin(el * 1.4) > 0.92) p.arms[1].el.rotation.z += 0.4; }   // 책 넘기기
  else if(k === "drink"){ pose(p, "stand", t, {sip:true, u:Math.min(1, el * 2)}); }
  else if(k === "vod"){ pose(p, "stand", t, {talk:true, wave:Math.sin(el * 1.3) > 0.4}); }
  /* 유나네 집 놀이 (2026-11-24 감독님 "집에 자전거라든지 … 이용거리들 많이 재밌게") */
  else if(k === "bike" || k === "horse"){ const bk = k === "bike", pd = el * (bk ? 7 : 3.2); pose(p, "sit", t, {seatY:(A.seat || 0.5) / p.root.scale.y});
    p.legs.forEach((l, n) => { const q = Math.sin(pd + n * Math.PI); l.hip.rotation.x = -1.05 + q * (bk ? 0.38 : 0.08); l.knee.rotation.x = 1.2 - q * (bk ? 0.5 : 0.05); });
    arms2(-1.15, 0.16, -0.25); p.chest.rotation.x = bk ? 0.22 : 0.1 + Math.sin(pd) * 0.14; if(!bk) up += Math.sin(pd) * 0.05; }
  else if(k === "splash"){ pose(p, "stand", t, {}); p.arms.forEach((a, n) => { const q = Math.sin(el * 9 + n * Math.PI); a.sh.rotation.set(-0.9 + q * 0.6, 0, (n ? -1 : 1) * 0.45); a.el.rotation.set(-0.3, 0, 0); }); up += Math.abs(Math.sin(el * 4.5)) * 0.08; }
  else if(k === "water"){ pose(p, "stand", t, {}); p.arms[1].sh.rotation.set(-1.25, 0, -0.2); p.arms[1].el.rotation.set(-0.3, 0, 0); p.arms[0].sh.rotation.set(-0.3, 0, 0.2); p.head.rotation.x = 0.25; p.chest.rotation.x = 0.1 + Math.sin(el * 1.2) * 0.06; }
  else if(k === "cook" || k === "draw"){ pose(p, "stand", t, {}); const a1 = p.arms[1], q = el * (k === "cook" ? 6 : 3.4);
    a1.sh.rotation.set(-1.0 + Math.sin(q) * (k === "draw" ? 0.35 : 0.15), 0, -0.25 + Math.cos(q) * 0.2); a1.el.rotation.set(-0.7, 0, 0); p.arms[0].sh.rotation.set(-0.7, 0, 0.25); p.arms[0].el.rotation.set(-1.1, 0, 0); p.head.rotation.x = k === "cook" ? 0.3 : 0; }
  else if(k === "scope"){ pose(p, "stand", t, {}); arms2(-1.45, 0.35, -1.6); p.head.rotation.x = -0.15; p.head.rotation.y = Math.sin(el * 0.8) * 0.15; }
  else if(k === "jump"){ const q = Math.abs(Math.sin(el * 4.2)); pose(p, "stand", t, {}); arms2(-2.6 + q * 0.4, 0.4, 0); p.legs.forEach(l => { l.hip.rotation.x = -0.3 * (1 - q); l.knee.rotation.x = 0.6 * (1 - q); }); up += q * 0.38; }
  else if(k === "bath"){ pose(p, "sit", t, {seatY:0.1 / p.root.scale.y}); p.legs.forEach(l => { l.hip.rotation.x = -1.4; l.knee.rotation.x = 0.4; }); arms2(-0.5 + Math.sin(el * 2) * 0.3, 0.6, -0.4); p.head.rotation.x = -0.1; }
  else if(k === "play"){ pose(p, "sit", t, {}); p.hips.position.y = 0.17; p.legs.forEach((l, n) => { const sg = n ? 1 : -1; l.hip.rotation.order = "YXZ"; l.hip.rotation.set(-1.42, sg * 0.85, 0); l.knee.rotation.set(2.55, 0, 0); });
    p.arms.forEach((a, n) => { const q = Math.sin(el * 2.6 + n * 1.7); a.sh.rotation.set(-0.8 + q * 0.25, 0, (n ? -1 : 1) * 0.3); a.el.rotation.set(-0.6, 0, 0); }); p.head.rotation.x = 0.35; }
  else if(k === "harvest"){ const q = (1 - Math.cos(el * 2.2)) / 2; pose(p, "stand", t, {}); p.hips.position.y = 0.9 - 0.32 * q; p.legs.forEach(l => { l.hip.rotation.x = -1.2 * q; l.knee.rotation.x = 2.0 * q; }); p.chest.rotation.x = 0.5 * q; arms2(-0.9 - 0.4 * q, 0.15, -0.3); }
  else if(k === "laundry"){ const q = (1 - Math.cos(el * 2.4)) / 2; pose(p, "stand", t, {}); arms2(-1.3 - 1.4 * q, 0.25, -0.2); p.head.rotation.x = -0.3 * q; }
  else if(k === "pray"){ pose(p, "stand", t, {}); p.arms.forEach((a, n) => { a.sh.rotation.set(-0.62, 0, (n ? -1 : 1) * 0.1); a.el.rotation.set(-1.6, 0, (n ? -1 : 1) * 0.75); }); p.head.rotation.x = 0.36; }   // 손 모으고 기도
  else if(k === "ride"){ pose(p, "sit", t, {seatY:0.4 / p.root.scale.y}); up += A.lift || 0; p.chest.rotation.z = (A.tilt || 0) * 0.6;   // 놀이기구 타기: 손 번쩍
    if(A.cheer && !reduce){ const w = Math.sin(el * 5) * 0.25; p.arms.forEach((a, n) => { a.sh.rotation.set(-2.7 + w, 0, (n ? -1 : 1) * 0.35); a.el.rotation.set(-0.15, 0, 0); }); }
    else arms2(-0.7, 0.25, -0.9); }
  else pose(p, "stand", t, {});
  return up;
}
/* 테니스 (2026-11-28 감독님 "테니스장"): 라켓은 오른손(arms[0]) 아래팔에 붙은 부품, PL.rk[k]일 때만 보임.
   PL.sw[k] = {t0, kind:"fore"|"back"|"serve"} 휘두르기 0.42초. 공은 PL.tb = {i, j, y(땅 위 높이), r} */
const RK_COL = {yu:["#F28DB0", "#FFFFFF"], dad:["#3A8A78", "#2A2A28"], mom:["#B79AD6", "#FFFFFF"], fr:["#E8A04A", "#FFFFFF"], coach:["#5E9BEA", "#FFFFFF"]};
function racketParts(p, k){
  const c = RK_COL[k] || ["#8A9AA8", "#FFFFFF"], el = p.arms[0].el, vis = () => p.root.visible && !!PL.rk?.[k];
  const add = (g, col, x, y, z, rx = 0, sx = 1) => { const o = new THREE.Object3D(); o.position.set(x, y, z); o.rotation.x = rx; o.scale.x = sx; el.add(o); PARTS.push({o, g, c:col, cls:"p", vis}); return o; };
  add(cyl(0.021, 0.019, 0.17, 8), c[1], 0, -0.31, 0.01);                         // 손잡이
  add(cyl(0.013, 0.013, 0.1, 6), c[0], 0, -0.43, 0.01);                          // 목
  add(geo("rkring", () => new THREE.TorusGeometry(0.135, 0.017, 6, 22)), c[0], 0, -0.6, 0.01, 0, 0.8);   // 머리 테
  add(cyl(0.128, 0.128, 0.006, 20), "#F4F0E2", 0, -0.6, 0.01, Math.PI / 2, 0.8); // 줄 면
}
function racketPose(p, k, now, moving){
  const S = PL.sw[k], a = p.arms[0], b = p.arms[1], el = S ? (now - S.t0) / 420 : 9;
  if(el >= 1){   // 준비 자세: 라켓을 앞으로
    a.sh.rotation.set(-0.55 + (moving ? 0 : Math.sin(now / 300) * 0.04), 0, 0.12); a.el.rotation.set(-0.85, 0, 0);
    if(!moving){ p.hips.position.y -= 0.04; p.legs.forEach(l => { l.hip.rotation.x = -0.22; l.knee.rotation.x = 0.42; }); p.chest.rotation.x = 0.12; b.sh.rotation.set(-0.45, 0, -0.15); b.el.rotation.set(-0.7, 0, 0); }
    return; }
  const u = el < 0.25 ? el / 0.25 : el, e = u * u * (3 - 2 * u);
  if(S.kind === "serve"){   // 서브 · 스매시: 머리 위에서 앞으로 내려침
    const q = el < 0.25 ? -2.4 - 0.5 * e : -2.9 + 2.3 * ((el - 0.25) / 0.75);
    a.sh.rotation.set(q, 0, 0.15); a.el.rotation.set(el < 0.25 ? -1.4 * e : -1.4 * (1 - (el - 0.25) / 0.75), 0, 0); b.sh.rotation.set(-2.6 + (el > 0.3 ? 1.8 * (el - 0.3) : 0), 0, -0.2);
    p.chest.rotation.x = -0.15 + (el > 0.25 ? 0.4 * (el - 0.25) : 0); p.head.rotation.x = -0.35; return; }
  const fore = S.kind !== "back", sg = fore ? 1 : -1;
  // 뒤로 빼기(0~0.25) → 앞으로 휘두르기(0.25~1): 팔을 옆으로 벌린 채 몸통과 함께 수평으로 돎
  const ph = el < 0.25 ? sg * 1.5 * e : sg * (1.5 - 3.1 * Math.min(1, (el - 0.25) / 0.55));
  a.sh.rotation.order = "YZX"; a.sh.rotation.set(-0.15, ph, 1.15); a.el.rotation.set(-0.35, 0, 0);
  p.chest.rotation.y = ph * 0.45; p.hips.rotation.y = ph * 0.2; b.sh.rotation.set(-0.5, 0, -0.3);
  p.legs.forEach(l => { l.hip.rotation.x = -0.25; l.knee.rotation.x = 0.45; }); p.hips.position.y -= 0.05;
}
export function playRacket(m){ PL.rk = m || null; }
export function playRing(i, j, big){ if(!PL.on || !R) return; fxRing(i, j, groundH(i, j) + 0.02, !!big); }   // 테니스: 공 떨어질 자리 표시
export function playSwing(k, kind = "fore"){ PL.sw[k] = {t0:clock(), kind}; }
export function playTBall(b){ PL.tb = b ? {i:b[0], j:b[1], y:b[2] || 0, r:b[3] || 0.075} : null; }
function playNear(){
  let best = null, bd = 1.7;
  Object.values(R.people).forEach(P => { if(!P.p.root.visible || PL.hide.has(P.id) || /yuna$/.test(P.id)) return; const d = Math.hypot(P.p.root.position.x + OX - PL.i, P.p.root.position.z + OZ - PL.j);
    if(d < bd){ bd = d; best = {id:P.id, name:P.info.name, role:P.info.role || P.info.roleKo || "", task:P.info.task || P.info.desc || "", d}; } });
  Object.entries(PL.actors).forEach(([k, a]) => { const d = Math.hypot(a.i - PL.i, a.j - PL.j); if(d < 1.7 && d - 0.9 < bd){ bd = d - 0.9; /* 아빠·엄마·지유는 옆 사람보다 먼저 */ best = {id:"@" + k, name:ACT_NAME[k] || k, role:"", task:"", d}; } });
  return best;
}
function playState(){
  const m = markPos(); let mark = null;
  if(m){ PV2.set(m.x, m.y + 1.4, m.z).project(R.camera); mark = {x:(PV2.x * 0.5 + 0.5) * R.w, y:(-PV2.y * 0.5 + 0.5) * R.h, front:PV2.z < 1, d:Math.hypot(m.x + OX - PL.i, m.z + OZ - PL.j)}; }
  const act = {}; Object.entries(PL.actors).forEach(([k, a]) => act[k] = {i:a.i, j:a.j, moving:a.moving});
  return {floor:R.fid, i:PL.i, j:PL.j, h:PL.h, jy:PL.jy, boost:Math.max(0, PL.boost - clock()), swim:!!PL.swim, sit:PL.sit ? (PL.sit.id || "seat") : null, fit:PL.fit, moving:PL.moving, dv:PL.act?.drive ? Math.abs(PL.dv || 0) : 0, near:playNear(), ball:PL.ball && {i:PL.ball.i, j:PL.ball.j, v:Math.hypot(PL.ball.vi, PL.ball.vj)}, mark, actors:act, w:R.w, hgt:R.h};
}
function playTags(now){
  if(!R.pl) return;
  const A = R.pl, clampv = (v, a, b) => Math.min(b, Math.max(a, v));
  // 말풍선끼리·층 사람 말풍선과 겹치지 않게 위로 비켜 쌓음 (가까운 사람 먼저, 2026-11-26)
  const placed = Object.values(R.people).map(P => !P.bub.hidden && P.bRect && Math.abs(now - P.bRect.t) < 300 ? P.bRect : null).filter(Boolean), list = [];
  ["yu", ...ACT_KEYS].forEach(k => { const B = A.bub[k], p = A[k];
    if(!PL.on || !p.root.visible || now > B.until){ B.bub.hidden = B.stem.hidden = true; return; }
    if(B.bub.textContent !== B.say){ B.bub.textContent = B.say; B.w = 0; }
    B.bub.hidden = false; if(!B.w){ B.w = B.bub.offsetWidth; B.h = B.bub.offsetHeight; }
    p.head.getWorldPosition(tmp); tmp.y += 0.5 * p.root.scale.y; tmp.project(R.camera);
    if(tmp.z > 1){ B.bub.hidden = B.stem.hidden = true; return; }
    list.push({B, x:(tmp.x * 0.5 + 0.5) * R.w, y:(-tmp.y * 0.5 + 0.5) * R.h, z:tmp.z}); });
  list.sort((a, b) => a.z - b.z).forEach(({B, x, y}) => { const bx = clampv(x, B.w / 2 + 4, R.w - B.w / 2 - 4); let by = clampv(y - 22 - B.h / 2, B.h / 2 + 4, R.h - B.h / 2 - 4);
    for(let g = 0; g < 6; g++){ const hit = placed.find(r => Math.abs(r.x - bx) < (r.w + B.w) / 2 + 3 && Math.abs(r.y - by) < (r.h + B.h) / 2 + 2); if(!hit) break; by = Math.max(B.h / 2 + 4, hit.y - (hit.h + B.h) / 2 - 3); if(by <= B.h / 2 + 4) break; }
    placed.push({x:bx, y:by, w:B.w, h:B.h});
    B.bub.style.transform = `translate(${bx}px,${by}px) translate(-50%,-50%)`;
    const top = by + B.h / 2, gap = y - top; B.stem.hidden = gap < 6; if(gap >= 6){ B.stem.style.height = gap + "px"; B.stem.style.transform = `translate(${clampv(x, bx - B.w / 2 + 12, bx + B.w / 2 - 12)}px,${top}px)`; } });
}
function playTap(mx, my){
  let best = null, bd = 48;
  Object.values(R.people).forEach(P => { if(!P.p.root.visible || /yuna$/.test(P.id)) return; P.p.chest.getWorldPosition(tmp); tmp.project(R.camera);
    const d = Math.hypot((tmp.x * 0.5 + 0.5) * R.w - mx, (-tmp.y * 0.5 + 0.5) * R.h - my); if(d < bd){ bd = d; best = P.id; } });
  if(best) PL.cb?.onTap?.(best);
}
export function playStart(cb, spawn){ PL.on = true; PL.cb = cb; PL.spawn = spawn || null; PL.in = [0, 0]; if(R && R.pl) enterPlay(); }
export function playStop(){
  PL.on = false; PL.cb = null; PL.in = [0, 0]; PL.rk = null; PL.sw = {}; PL.camLock = null; PL.camLead = null; PL.auto = null; PL.face = null; PL.tb = null; PCUT_A.value.w = 0; propsClear(); PL.mark = null; PL.act = null; PL.actors = {}; PL.ball = null; PL.water = []; PL.hide = new Set(); PL.items.forEach(dropItem); PL.items = []; PL.jy = PL.jv = 0; PL.boost = 0; fxClear(); PL.idleK = null; PL.sit = null; PL.cloak = false;
  if(!R) return; R.layer.classList.remove("play"); R.camera.fov = 22; R.camera.near = 1; R.camera.updateProjectionMatrix(); R.zone = null; setView(HOME(), true);
}
export function playInput(x, y){ PL.in[0] = x; PL.in[1] = y; }
export function playSet(o){
  if("water" in o) PL.water = o.water || [];
  if("mark" in o) PL.mark = o.mark || null;
  if("hide" in o) PL.hide = new Set(o.hide || []);
  if("freeze" in o) PL.freeze = !!o.freeze;
  if("cloak" in o) PL.cloak = !!o.cloak;
  if("stroke" in o) PL.stroke = o.stroke || "free";
  if("hold" in o) PL.hold = o.hold ? {e:o.hold.e, slow:o.hold.slow ?? 0.8, spill:!!o.hold.spill, col:o.hold.col, t0:PL.hold?.e === o.hold.e ? PL.hold.t0 : clock()} : null;
  if("spawn" in o) PL.spawn = o.spawn;
  if("camLock" in o) PL.camLock = o.camLock ?? null;
  if("camLead" in o) PL.camLead = o.camLead ?? null;
  if("face" in o) PL.face = o.face ?? null;
  if("auto" in o) PL.auto = o.auto ? {h:o.auto.h ?? PL.h, v:o.auto.v ?? 0} : null;
  if("wave" in o) PL.wave = clock() + o.wave;
  if("boost" in o) PL.boost = o.boost ? clock() + o.boost : 0;
  if(o.cam){ const c = o.cam; if(c.yaw != null) PL.yaw = c.yaw; if(c.el != null) PL.el = c.el; if(c.d != null){ PL.d = c.d; PL.dd = c.d; } }   // 시험용 카메라 (2026-11-26)
  if("ball" in o) PL.ball = o.ball ? {i:o.ball[0], j:o.ball[1], vi:0, vj:0} : null;
  if("act" in o){ const a = o.act; if(PL.act?.el0 != null && !PL.dragAt) PL.el = PL.act.el0; PL.act = a ? (typeof a === "string" ? {k:a} : {...a}) : null; if(PL.act){ PL.act.t0 = clock(); PL.sitYaw = (o.at?.[2] ?? o.pos?.[2] ?? PL.h) + 0.6; PL.dv = 0; const st = PL.act.drive?.start; if(st){ PL.i = st[0]; PL.j = st[1]; if(st[2] != null){ PL.h = st[2]; PL.yaw = PL.h + Math.PI; } } } }
  if(o.at && R && R.pl){ PL.i = o.at[0]; PL.j = o.at[1]; if(o.at[2] != null){ PL.h = o.at[2]; PL.yaw = PL.h + Math.PI; } PL.tg?.set(X(PL.i), 0.62, Z(PL.j)); }   // 기구 위에 바로 (부딪힘 무시)
  if(o.pos && R && R.pl){ [PL.i, PL.j] = nearFree(o.pos[0], o.pos[1]); if(o.pos[2] != null){ PL.h = o.pos[2]; PL.yaw = PL.h + Math.PI; } PL.tg?.set(X(PL.i), 0.62, Z(PL.j)); }
}
export function playActor(k, a){
  if(!a){ delete PL.actors[k]; return; }
  const o = PL.actors[k] || (PL.actors[k] = {i:0, j:0, h:0, step:0, spd:1.2, pose:"stand"});
  if(a.at){ [o.i, o.j] = a.at; if(a.at[2] != null) o.h = a.at[2]; }
  ["to", "spd", "pose", "h"].forEach(p => { if(p in a) o[p] = a[p]; });
  if(a.wave) o.wave = clock() + a.wave;
}
export function playSay(k, text, ms = 2800){
  if(!R) return;
  if(R.pl && R.pl.bub[k]){ const B = R.pl.bub[k]; B.say = text; B.until = clock() + ms; return; }
  say(k, text, ms);
}
export function playWhere(id){ const P = R?.people[id]; if(!P || !P.p.root.visible) return null; const q = P.p.root.position; return [q.x + OX, q.z + OZ, P.p.root.rotation.y]; }
export function playFree(i, j, r){ return R ? (playGrid(), nearFree(i, j, r)) : [i, j]; }
/* 숨을 곳: 유나에게서 minD 넘게 떨어지고, 둘레가 많이 막힌(뒤에 숨기 좋은) 칸 */
export function playHideSpot(minD = 7){
  if(!R) return null; const G = playGrid(); let best = null, bs = -1;
  for(let n = 0; n < 700; n++){
    const i = G.e0 + Math.random() * G.W * G.C, j = G.f0 + Math.random() * G.H * G.C;
    if(Math.hypot(i - PL.i, j - PL.j) < minD || !freeAt(i, j, 0.24) || !reachable(i, j) || PL.water.some(w => inRect(w.walk || w.rect, i, j))) continue;
    let s = 0; for(let k = 0; k < 12; k++){ const a = k * Math.PI / 6; if(cellBlocked(i + Math.cos(a) * 0.5, j + Math.sin(a) * 0.5)) s++; }
    s += Math.random() * 1.5; if(s > bs){ bs = s; best = [i, j]; } }
  return best;
}
export const playOn = () => PL.on;
export const playPos = () => PL.on && R && R.pl ? [PL.i, PL.j] : null;   // 1층 차가 유나 앞에서 멈추게 (2026-11-23)
export const playDebug = () => ({i:PL.i, j:PL.j, jy:PL.jy, h:PL.h, yaw:PL.yaw, sy:PL.sitYaw, el:PL.el, drag:PL.dragAt, cam:R?.camera ? [R.camera.position.x + OX, R.camera.position.z + OZ] : null, actors:JSON.parse(JSON.stringify(PL.actors)), items:PL.items.map(it => [it.id, it.e, +it.i?.toFixed(2), +it.j?.toFixed(2)]), idle:PL.idleK?.k || null, still:Math.round(clock() - PL.still), fx:PL.fx.length});
export function playItems(list){ PL.items.forEach(dropItem); PL.items = (list || []).map(o => ({...o, ph:Math.random() * 6.28, o:null, pop:0})); }
export function playItem(id, patch){ const it = PL.items.find(x => x.id === id); if(!it) return; if(patch === null){ dropItem(it); PL.items = PL.items.filter(x => x !== it); return; } if(patch.at) [it.i, it.j] = patch.at; if(patch.y != null) it.y = patch.y; }
export function playEmote(on, e, ms = 1400){ if(!PL.on) return; PL.items.push({id:"emo" + (++PL.emoN), e, on, pick:false, emo:clock(), life:ms, s:0.44, glow:false, ph:0, o:null, pop:0}); }
/* 물총 (2026-11-28): from·to = "yu" | "@k" | [i, j, y]. 물방울이 줄줄이 날아가 맞은 자리에서 튐 */
export function playSquirt(from, to, miss){
  if(!PL.on || !R) return; fxInit(); const P = id => { if(Array.isArray(id)) return [id[0], id[1], groundH(id[0], id[1]) + (id[2] ?? 0.5)];
    if(id === "yu") return [PL.i, PL.j, groundH(PL.i, PL.j) + (PL.swim ? (PL.swim.surf ?? 0.06) + 0.25 : 0.7)];
    const a = PL.actors[id[0] === "@" ? id.slice(1) : id]; if(!a) return null; return [a.i, a.j, groundH(a.i, a.j) + (a.pose === "swim" ? 0.3 : 0.7)]; };
  const a = P(from), b = P(to); if(!a || !b) return; const T = 0.38 + Math.hypot(b[0] - a[0], b[1] - a[1]) * 0.02, now = clock(), dx = X(b[0]) - X(a[0]), dz = Z(b[1]) - Z(a[1]), dy = b[2] - a[2];
  for(let k = 0; k < 16; k++){ const m = new THREE.Mesh(FXG.drop, new THREE.MeshBasicMaterial({color:k % 3 ? 0xA8E2FF : 0xE8F8FF, transparent:true, opacity:0.95, depthWrite:false, toneMapped:false}));
    const sp = miss ? 0.5 : 0.08; m.position.set(X(a[0]), a[2], Z(a[1])); m.renderOrder = 6; m.visible = false; R.scene.add(m);
    PL.fx.push({m, t0:now + k * 16, life:T * 1000 + 60, kind:"drop", v:[dx / T + (Math.random() - 0.5) * sp, dy / T + 4.5 * T + (Math.random() - 0.5) * 0.25, dz / T + (Math.random() - 0.5) * sp]}); }
  setTimeout(() => { if(!PL.on) return; fxDrops(b[0], b[1], b[2], miss ? 5 : 10, 0.8, 0xE8F8FF); if(miss) fxRing(b[0], b[1], b[2] - 0.2, false); }, T * 1000 + 120);
}
export function playSplash(){ if(!PL.on || !PL.swim) return false; const sf = (PL.swim.surf ?? 0.06) + 0.012; fxRing(PL.i, PL.j, sf, true); fxDrops(PL.i, PL.j, sf + 0.05, 12, 1); PL.dunk = clock() + 450; return true; }
function standUp(){ if(!PL.sit) return; [PL.i, PL.j] = PL.sit.from; PL.h = PL.sit.h; PL.sit = null; }
export function playKick(vi, vj){ if(!PL.ball) return false; PL.ball.vi = vi; PL.ball.vj = vj; PL.ball.kick = clock(); PL.ball.free = clock() + 350; return true; }   // 슛·패스 (2026-11-23 감독님 "슛패스 버튼")
export function playBallAt(i, j){ if(!PL.ball) return false; PL.ball.i = i; PL.ball.j = j; PL.ball.vi = PL.ball.vj = 0; return true; }
export function playSit(s){
  if(!PL.on || !R || !R.pl) return false;
  if(!s){ standUp(); return true; }
  if(PL.swim || PL.jy > 0 || PL.sit) return false;
  PL.sit = {...s, from:[PL.i, PL.j]}; PL.i = s.i; PL.j = s.j; PL.h = s.h; PL.sitYaw = s.h + 0.6; PL.dragAt = 0; return true;   // 앉으면 카메라를 앞쪽 비스듬히 (2026-11-23 감독님 "앉으면 왜 뒷모습만 보이지?")
}
export function playOutfit(k){
  if(!YU_FITS[k]) return false; PL.fit = k;
  if(R && R.pl){ const A = R.pl, nw = A.yus[k]; if(nw && nw !== A.yu){ A.yu.root.visible = false; A.yu = nw; } }
  return true;
}
/* 머리 모양 · 머리색 (2026-11-28 꾸미기) */
function applyHair(){ if(!R || !R.pim) return; const c = new THREE.Color(PL.hairC || "#3A261C"), dirty = new Set();
  PARTS.forEach(pt => { if(pt.yuHair && pt.im){ pt.im.setColorAt(pt.k, c); dirty.add(pt.im); } }); dirty.forEach(im => { if(im.instanceColor) im.instanceColor.needsUpdate = true; }); }
export function playHair(style, color){ if(style && HAIR_STYLES.includes(style)) PL.hair = style; if(color) PL.hairC = color; applyHair(); return [PL.hair, PL.hairC]; }
export const playF = () => R?.F || null;   // 지금 층 모듈 (집 3층 방 꾸미기 등)
export function playJump(){ if(!PL.on || PL.jy > 0 || PL.swim || PL.freeze) return false; PL.jv = 3.6; PL.jy = 0.001; return true; }
export function playFreeAt(i, j, r = 0.2){ return !!R && (playGrid(), freeAt(i, j, r)); }
export function playClear(i0, j0, i1, j1, r = 0.2){ if(!R) return false; playGrid(); const n = Math.max(1, Math.ceil(Math.hypot(i1 - i0, j1 - j0) / 0.12)); for(let k = 1; k <= n; k++){ const u = k / n; if(!freeAt(i0 + (i1 - i0) * u, j0 + (j1 - j0) * u, r)) return false; } return true; }
export function playPeople(){ if(!R) return []; return Object.values(R.people).filter(P => P.p.root.visible && !PL.hide.has(P.id) && !/yuna$/.test(P.id)).map(P => ({id:P.id, name:P.info.name, i:P.p.root.position.x + OX, j:P.p.root.position.z + OZ})); }
/* 숨긴 보물 자리: seed가 같으면 늘 같은 곳. 걸어서 닿는 칸 중 가구 사이(둘레가 막힌 곳) 위주 */
export function playSpots(n, seed, avoid = [], gap = 2.4){
  if(!R) return []; const G = playGrid(); let s = (seed >>> 0) || 1;
  const rnd = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const cand = [];
  for(let k = 0; k < 1600; k++){ const i = G.e0 + rnd() * G.W * G.C, j = G.f0 + rnd() * G.H * G.C, r = rnd() * 3;
    if(!freeAt(i, j, 0.26) || !reachable(i, j) || PL.water.some(w => inRect(w.walk || w.rect, i, j)) || avoid.some(a => Math.hypot(a[0] - i, a[1] - j) < (a[2] || 1.6))) continue;
    let sc = 0; for(let q = 0; q < 12; q++){ const a = q * Math.PI / 6; if(cellBlocked(i + Math.cos(a) * 0.55, j + Math.sin(a) * 0.55)) sc++; }
    cand.push([i, j, sc + r]); }
  cand.sort((a, b) => b[2] - a[2]); const out = [];
  for(const c of cand){ if(out.length >= n) break; if(out.every(o => Math.hypot(o[0] - c[0], o[1] - c[1]) >= gap)) out.push([c[0], c[1]]); }
  return out;
}

export function webglOK(){ try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch(e){ return false; } }

/* host: 크기가 정해진 상자. opts.status: {pdId: "working"|...}, opts.onPick, opts.onView */
export function open(host, opts = {}){
  const fid = opts.floor ? opts.floor.id : opts.only || "main";
  if(R && R.fid === fid && R.host === host){ R.closed = false; if(!R.live){ R.live = true; R.last = 0; R.raf = requestAnimationFrame(frame); } if(PL.on && R.zone !== "play") enterPlay(); return R; }
  if(R) dispose();
  R = null; GEO.clear(); PARTS.length = 0;
  build(host, opts); R.fid = fid;
  R.t0 = performance.now(); R.live = true;
  // 사람
  if(R.F) (R.F.people || []).forEach(d => { const P = addPerson({...d}); P.tag.querySelector("i").style.background = d.hex || ST_COLOR.idle; place(P, d.at[0], d.at[1], d.face || 0); });
  else ROSTER.filter(r => !R.only || r.zone === "farm").forEach(r => { const P = addPerson({...r, status:(opts.status || {})[r.id] || "idle", task:(opts.tasks || {})[r.id] || IDLE_LINES[r.id]}); P.tag.querySelector("i").style.background = ST_COLOR[P.info.status]; setupPd(P); });
  R.spareWho = {};
  if(!R.F) MZ.filter(m => !R.only || m.zone === "farm").forEach(m => { const P = addPerson({...m}); P.tag.querySelector("i").style.background = m.hex; R.spareWho[m.spare] = P; setupPd(P); });
  if(!R.F) (R.only ? [{...STAFF[0], at:[5.6,3.45], face:Math.PI * 0.8, pose:"stand", task:"크레용팜 둘러보는 중"}] : STAFF).forEach(s => { const P = addPerson({...s}); P.tag.querySelector("i").style.background = s.hex; place(P, s.at[0], s.at[1], s.face); P.mode = s.pose; });
  if(R.people._nora){ const N = R.people._nora, tab = new THREE.Object3D(); tab.position.set(0, 0.3, 0.3); tab.rotation.x = -0.95; N.p.chest.add(tab);
    const k0 = PARTS.length; PARTS.push({o:tab, g:rbox(0.3, 0.02, 0.22, 0), c:"#2A2A28", cls:"p"});
    const scr = new THREE.Object3D(); scr.position.y = 0.012; tab.add(scr); PARTS.push({o:scr, g:rbox(0.26, 0.004, 0.18, 0), c:"#F7E6EE", cls:"p"});
    N.tablet = tab; PARTS.slice(k0).forEach(pt => pt.vis = () => N.p.root.visible && tab.visible); }
  R.F?.init?.(KIT);
  playMakeAvatars();
  batchPeople(); applyHair();
  // 구역 이름
  R.zoneTags = R.only ? [] : [...Object.entries(ZS()), ...Object.entries(SUBS())].map(([id, z]) => {
    const ZZ = ZS(), el = document.createElement(ZZ[id] ? "button" : "div"); el.className = "t3-zone" + (ZZ[id] ? "" : " sub");
    el.innerHTML = `<i style="background:${z.color}"></i>`; el.append(z.name);
    if(ZZ[id]){ el.type = "button"; el.addEventListener("click", e => { e.stopPropagation(); setView(id); }); }
    const [li, lj, side] = z.label; R.layer.append(el);
    return {id, el, side, at:V3(li, side === "top" ? WALL_H + 0.2 : side === "side" ? 1.6 : 0, lj)}; });
  resize(); setTheme(!!opts.dark); setView(R.only ? "farmOnly" : "all", true);
  if(!reduce && !PL.on){ const g = R.cur; R.anim = {t0:performance.now(), dur:1600, from:{tg:g.tg.clone().add(new THREE.Vector3(1.5, 0, -1.5)), d:g.d * 1.3, az:AZ0 + 0.55, el:EL0 + 0.08}, to:{tg:g.tg.clone(), d:g.d, az:AZ0, el:EL0}}; R.az = AZ0 + 0.55; R.el = EL0 + 0.08; R.cur = {tg:R.anim.from.tg.clone(), d:R.anim.from.d}; }
  R.ro = new ResizeObserver(() => resize()); R.ro.observe(host);
  // 그림 (포스터 · 상패) 은 나중에 받아서 칠함
  if(!R.only && !R.F) import("./map3d_art.js").then(({POSTERS, PLAQUES}) => {
    const load = src => new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });
    Promise.all([...POSTERS.map(([, s]) => load(s)), ...PLAQUES.map(([, s]) => load(s))]).then(ims => {
      POSTERS.forEach(([j], k) => { const slot = R.posterSlots[[14.85, 13.7, 12.55].indexOf(j)]; if(slot) slot.img = ims[k]; });
      PLAQUES.forEach(([j], k) => { const im = ims[POSTERS.length + k]; if(!im) return; const c = document.createElement("canvas"); c.width = im.naturalWidth; c.height = im.naturalHeight; const x = c.getContext("2d");
        x.drawImage(im, 0, 0); x.globalCompositeOperation = "source-in"; const g = x.createLinearGradient(0, 0, 0, c.height); g.addColorStop(0, "#F6DE8D"); g.addColorStop(0.55, "#D9B355"); g.addColorStop(1, "#B48A34"); x.fillStyle = g; x.fillRect(0, 0, c.width, c.height);
        const slot = R.plaqueSlots[[13.4, 12.62].indexOf(j)]; if(slot) slot.img = c; });
      R.atlas.paint(R.dark); });
  }).catch(() => {});
  // 누르기: 사람 머리 근처면 그 사람, 전체 층에서 바닥이면 그 구역으로
  const cv = R.renderer.domElement;
  R.back = document.createElement("button"); R.back.type = "button"; R.back.className = "t3-back"; R.back.textContent = "전체 보기"; R.back.hidden = true;
  R.back.addEventListener("click", e => { e.stopPropagation(); setView(HOME()); }); R.layer.append(R.back);
  const pts = new Map(), pos = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  let drag = null, pinch = null, moved = false, multi = false, lastTap = null, tapDbl = 0;
  cv.addEventListener("pointerdown", e => {
    const p = pos(e); pts.set(e.pointerId, p);
    if(pts.size === 1){ drag = {p, p0:p, pan:e.button === 1 || e.button === 2 || e.shiftKey}; moved = false; multi = false; }
    if(pts.size === 2){ const [a, b] = [...pts.values()]; pinch = {pd:PL.d, dist:Math.hypot(a[0] - b[0], a[1] - b[1]), d:R.cur.d, mid:[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]}; drag = null; multi = true; }
  });
  cv.addEventListener("pointermove", e => {
    if(!pts.has(e.pointerId)) return; const p = pos(e); pts.set(e.pointerId, p);
    if(pinch && pts.size === 2){ const [a, b] = [...pts.values()], dist = Math.hypot(a[0] - b[0], a[1] - b[1]);
      const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      if(PL.on){ PL.d = Math.max(2.6, Math.min(9, pinch.pd * pinch.dist / Math.max(1, dist))); moved = true; return; }
      zoomAt(mid[0], mid[1], pinch.d * pinch.dist / Math.max(1, dist)); panBy(pinch.mid[0], pinch.mid[1], mid[0], mid[1]); pinch.mid = mid; moved = true; return; }
    if(drag){
      if(!moved && Math.hypot(p[0] - drag.p0[0], p[1] - drag.p0[1]) < 6) return;
      if(!moved){ moved = true; try { cv.setPointerCapture(e.pointerId); } catch(_){} cv.classList.add("grab"); }
      // 한 손가락·왼쪽 끌기 = 돌리기, 오른쪽 끌기·Shift = 옮기기, 두 손가락 = 확대·옮기기
      if(PL.on){ PL.yaw -= (p[0] - drag.p[0]) * 0.008; PL.el = Math.max(0.22, Math.min(1.25, PL.el + (p[1] - drag.p[1]) * 0.005)); PL.dragAt = performance.now(); drag.p = p; return; }
      if(drag.pan) panBy(drag.p[0], drag.p[1], p[0], p[1]); else rotateBy(p[0] - drag.p[0], p[1] - drag.p[1]); drag.p = p;
    }
  });
  const endPtr = e => { pts.delete(e.pointerId); if(pts.size < 2) pinch = null; if(!pts.size){ drag = null; cv.classList.remove("grab"); } };
  cv.addEventListener("pointercancel", endPtr);
  cv.addEventListener("contextmenu", e => e.preventDefault());
  cv.addEventListener("pointerup", e => {
    const p = pos(e); endPtr(e);
    if(pts.size || moved || multi) return;
    if(PL.on){ playTap(p[0], p[1]); return; }
    // 폰 두 번 탭 = 더블클릭
    if(e.pointerType === "touch"){ const now = performance.now();
      if(lastTap && now - lastTap.t < 330 && Math.hypot(p[0] - lastTap.p[0], p[1] - lastTap.p[1]) < 32){ lastTap = null; tapDbl = now; dblZoom(...p); return; }
      lastTap = {t:now, p}; }
    tap(p[0], p[1]);
  });
  cv.addEventListener("dblclick", e => { if(PL.on || performance.now() - tapDbl < 700) return; const p = pos(e); dblZoom(...p); });
  cv.addEventListener("wheel", e => {
    if(PL.on){ e.preventDefault(); PL.d = Math.max(2.6, Math.min(9, PL.d * Math.exp(e.deltaY * 0.0022))); return; }
    if(!(e.ctrlKey || e.metaKey)) return;      // 트랙패드 핀치(⌃휠)·⌘휠만 확대, 그냥 스크롤은 페이지로
    e.preventDefault(); const p = pos(e); zoomAt(p[0], p[1], R.cur.d * Math.exp(e.deltaY * 0.01));
  }, {passive:false});
  // 누르기: 사람 머리 근처면 그 사람, 전체 층에서 바닥이면 그 구역으로
  function tap(mx, my){
    let best = null, bd = isFar() ? 18 : 42;
    Object.values(R.people).forEach(P => { if(!P.p.root.visible) return; P.p.chest.getWorldPosition(tmp); tmp.project(R.camera);
      const d = Math.hypot((tmp.x * 0.5 + 0.5) * R.w - mx, (-tmp.y * 0.5 + 0.5) * R.h - my); if(d < bd){ bd = d; best = P.id; } });
    if(best){ select(best); return; }
    if(R.sel){ select(R.sel); return; }
    const g = hitEgg(mx, my); if(g){ popEgg(g); return; }
    if(isFar()){ const hit = new THREE.Vector3(); if(groundAt(mx, my, hit)){
        const i = hit.x + OX, j = hit.z + OZ, ZZ = ZS(), inR = ([a,b,c,d]) => i >= a && i < c && j >= b && j < d, z = Object.keys(ZZ).find(k => inR(ZZ[k].rect)) || (!R.F && inR(CS) ? "grade" : null);   // 색보정실은 구역 버튼은 없어도 눌러서 들어감
        if(z) setView(z); } }
  }
  document.addEventListener("visibilitychange", () => { if(!R) return; if(document.hidden){ cancelAnimationFrame(R.raf); R.live = false; } else if(!R.live && !R.closed && !R.paused){ R.live = true; R.last = 0; R.raf = requestAnimationFrame(frame); } });
  if(PL.on) enterPlay();
  R.raf = requestAnimationFrame(frame);
  return R;
}
export function close(){ if(R){ R.live = false; R.closed = true; cancelAnimationFrame(R.raf); } }
export function pause(on){ if(!R) return; if(on){ R.live = false; R.paused = true; cancelAnimationFrame(R.raf); } else if(R.paused){ R.paused = false; if(!R.closed && !document.hidden){ R.live = true; R.last = 0; R.raf = requestAnimationFrame(frame); } } }   // 레이싱 화면이 덮는 동안 3D 타워는 쉼 (2026-11-28)
/* 층을 바꿀 때: 그래픽 메모리까지 비움 (한 번에 한 층만) */
export function dispose(){
  if(!R) return; close(); R.ro?.disconnect();
  R.scene.traverse(o => { if(o.isMesh){ o.geometry?.dispose(); [].concat(o.material).forEach(m => { m?.map?.dispose(); m?.dispose(); }); } });
  R.envTex?.dispose(); R.flTex?.dispose(); R.atlas?.tex?.dispose();
  R.renderer.dispose(); R.renderer.forceContextLoss?.(); R.renderer.domElement.remove(); R.layer.remove();
  GEO.forEach(g => g.dispose()); GEO.clear(); PARTS.length = 0; R = null;
}
export const floorId = () => R?.fid;
export function setPerson(id, patch){ if(!R || !R.people[id]) return; const prev = R.people[id].info.status; Object.assign(R.people[id].info, patch); if(patch.status && patch.status !== prev) setStatus(id, patch.status); }   // 3초마다 같은 상태가 와도 걷던 사람을 자리로 되돌리지 않음 (2026-11-23)
export function stats(){ const i = R.renderer.info; return {calls:i.render.calls, triangles:i.render.triangles, geometries:i.memory.geometries, textures:i.memory.textures, people:Object.keys(R.people).length}; }
export const _dbg = () => R;
/* 미리보기 시험용: 창이 숨어 있어도 시간을 넘겨 봄 */
export function _pump(sec, step = 33){ for(let k = 0; k < sec * 1000 / step; k++){ R.off = (R.off || 0) + step; tick(performance.now()); } }
