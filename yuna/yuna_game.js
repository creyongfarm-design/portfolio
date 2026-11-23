/* 유나 모드 (2026-11-23 감독님 "유나 앞세워서 GTA처럼 돌아다니게. 돌아다니면서 이야기하고 다니면 재밌겠다. 할 게 많으면 좋겠네")
   - 조종: 폰은 왼쪽 아래 조이스틱, 컴퓨터는 WASD·방향키. 화면을 끌면 카메라가 돌아감, 핀치·휠로 멀고 가깝게
   - 오른쪽 아래 버튼: 사람 옆이면 말 걸기, 엘리베이터 앞이면 층 이동
   - 심부름(별 스티커) + 미니게임: 옥상 골 넣기 · 아빠랑 숨바꼭질 · 엄마랑 수영 시합 · 아빠랑 술래잡기 · 옥상 별똥별 줍기
   - 모험 (2026-11-23 감독님 "재미난 모험요소 많이"): 층마다 숨은 보물 6개(높은 건 점프), ⚡ 번개 사탕(빨라짐), 길 잃은 고양이 찾기,
     사람들 머리 위 ❗ 부탁, 배지 16개
   - 엔진(tower3d_floor.js)의 play* 함수만 씀. 별 기록은 이 기기에만 (localStorage) */

const FL = {lobby:{n:1, name:"1층 로비·카페"}, main:{n:2, name:"2층 업무층"}, wf:{n:3, name:"3층 복지층"}, s4:{n:4, name:"4층 스튜디오"}, roof:{n:5, name:"5층 옥상"}};
const ELEV = [13.45, 17.1], EXIT = [14.5, 17.1, Math.PI / 2];
const POOL = {rect:[20.6, 17.7, 29, 20], walk:[20.3, 17.4, 29, 20], surf:0.39};
const GOAL = {i0:1.2, i1:12.8, gj:4.8, gw:0.9}, BALL0 = [7.0, 4.8];
const FARM_PDS = ["plan", "edit", "short", "deal"];

const QUESTS = [
  {id:"coffee", e:"☕", t:"아빠한테 커피 배달", steps:[
    {f:"main", go:[26.2, 1.7], r:1.15, lb:"커피 내리기", hint:"2층 탕비실 커피머신으로", yu:"아빠 커피 한 잔 내려야지~ ☕", got:"☕",
      make:{ms:3600, txt:"커피 내리는 중", fx:["💨", "☕", "♨️", "💧"], done:"다 됐다! 흘리지 않게 조심조심~ ☕"}},
    {f:"main", talk:"@dad", lb:"아빠한테 드리기", hint:"대표실 아빠한테 갖다드리기", yu:"아빠! 커피 배달 왔어요 ☕", re:"우와 우리 딸 최고! 고마워 💕"}]},
  {id:"mom", e:"🌈", t:"엄마 보러 4층 가기", steps:[
    {f:"s4", talk:"@mom", lb:"엄마 찾기", hint:"4층 예운옥에서 엄마 찾기", yu:"엄마~ 나 왔어! 🌈", re:"유나 왔어? 엄마 일하는 거 구경할래? 💕"}]},
  {id:"choco", e:"🍫", t:"1층 카페 아이스초코", steps:[
    {f:"lobby", talk:["l_bar"], lb:"아이스초코 주문", hint:"1층 카페 바리스타한테 주문", yu:"아이스초코 하나 주세요! 🍫", re:"여기 있어~ 시원한 아이스초코 🍫", got:"🍫",
      make:{ms:3800, wait:"유나 왔구나~ 금방 만들어 줄게 😊", txt:"바리스타가 만드는 중", fx:["🥛", "🍫", "🧊", "🥄"]}},
    {f:"lobby", talk:["l_rec", "l_rec2"], lb:"언니한테 자랑", hint:"안내 데스크 언니한테 자랑하기", yu:"언니 이거 봐요! 아이스초코 🍫", re:"우와 맛있겠다! 😊"}]},
  {id:"snack", e:"🍪", t:"식당 간식 나르기", steps:[
    {f:"wf", go:[5.6, 3.8], r:1.5, lb:"간식 받기", hint:"3층 구내식당에서 간식 받기", yu:"간식 주세요~ 🍪", got:"🍪",
      make:{ms:2400, txt:"간식 담는 중", fx:["🍪", "🍪", "🧺"], done:"간식 받았다! 삼촌들 갖다줘야지 🍪"}},
    {f:"main", talk:FARM_PDS, lb:"삼촌·이모한테", hint:"2층 크레용팜 삼촌·이모한테", yu:"간식 왔어요~ 🍪", re:"고마워 유나야! 힘 난다 😆"}]},
  {id:"ball", e:"⚽", t:"옥상에서 골 3개 넣기", steps:[
    {f:"roof", go:[8.6, 4.8], r:1.3, lb:"풋살장 가기", hint:"5층 옥상 풋살장으로", yu:"공 차러 왔다! ⚽"},
    {f:"roof", game:"ball", lb:"골 3개", hint:"공을 몰고 골대에 넣기"}]},
  {id:"hide", e:"🙈", t:"아빠랑 숨바꼭질", steps:[
    {f:"main", talk:"@dad", lb:"아빠한테", hint:"2층 대표실 아빠한테", yu:"아빠! 숨바꼭질 해요! 🙈", re:"좋아! 열 셀 동안 눈 감고 있어~"},
    {f:"main", game:"hide", lb:"아빠 찾기", hint:"숨은 아빠 찾기"}]},
  {id:"swim", e:"🏊‍♀️", t:"엄마랑 수영 시합", steps:[
    {f:"roof", go:[22.4, 16.95], r:1.2, lb:"수영장 가기", hint:"5층 옥상 수영장으로", yu:"수영장이다! 엄마 빨리 와~ 🏊‍♀️"},
    {f:"roof", game:"swim", lb:"수영 시합", hint:"끝까지 먼저 가기"}]},
  {id:"tag", e:"🏃", t:"아빠랑 술래잡기", steps:[
    {f:"main", talk:"@dad", lb:"아빠한테", hint:"2층 대표실 아빠한테", yu:"아빠! 술래잡기 해요! 내가 술래 🏃‍♀️", re:"좋아~ 아빠 잡아 봐라! 😜"},
    {f:"main", game:"tag", lb:"아빠 잡기", hint:"도망가는 아빠 잡기"}]},
  {id:"stars", e:"🌠", t:"옥상 별똥별 줍기", steps:[
    {f:"roof", game:"stars", lb:"별똥별 줍기", hint:"떨어진 별 다 줍기 · 높은 건 점프!"}]},
  {id:"cat", e:"🐈", t:"길 잃은 고양이 찾기", steps:[
    {f:"lobby", talk:["l_rec", "l_rec2"], lb:"안내 언니", hint:"1층 안내 데스크 언니한테", yu:"언니, 무슨 일 있어요? 😮", re:"고양이 크레파스가 없어졌어 😢 위층 어딘가 있을 텐데…"},
    {find:"cat", lb:"고양이 찾기", hint:"사람들한테 고양이 봤는지 물어보기"},
    {f:"lobby", talk:["l_rec", "l_rec2"], lb:"데려다주기", hint:"크레파스 데리고 1층 안내 데스크로", yu:"찾았어요! 크레파스 왔어요 🐈", re:"우와 유나 최고! 정말 고마워 💕"}]},
];
const CAT_FLOORS = ["wf", "s4", "roof"];

/* 층마다 숨은 보물 6개. 세 번째 값 1 = 높이 떠 있어서 점프해야 닿음 */
const TREASURE = {
  lobby:[["🧸","곰인형"],["🎈","풍선"],["🌷","튤립"],["🍩","도넛"],["🗝️","황금 열쇠",1],["🎀","리본",1]],
  main:[["🖍️","크레용"],["🎬","슬레이트"],["📷","카메라"],["🎧","헤드폰"],["💎","보석",1],["🦄","유니콘",1]],
  wf:[["🍭","막대사탕"],["🧃","주스"],["🪀","요요"],["🧩","퍼즐 조각"],["🌟","반짝 별",1],["🍰","케이크",1]],
  s4:[["🌈","무지개"],["☁️","구름"],["🦋","나비"],["🪞","손거울"],["👑","왕관",1],["🔮","수정 구슬",1]],
  roof:[["🐚","조개"],["🪁","연"],["🌻","해바라기"],["🛟","튜브"],["🚀","로켓",1],["🌙","달님",1]]};
const SEED = {lobby:11, main:23, wf:37, s4:41, roof:59}, TOTAL = 30;
const AVOID = [[ELEV[0], ELEV[1], 1.9], [EXIT[0] + 0.6, EXIT[1], 1.3]];

/* ❗ 부탁: 머리 위에 ❗ 뜬 사람한테 말 걸면 가져다 달라는 게 생김 */
const SRC = [
  {e:"☕", n:"커피", ask:"2층 탕비실에서 커피 한 잔만 갖다줄래?", step:{f:"main", go:[26.2, 1.7], r:1.15, lb:"커피 내리기", hint:"2층 탕비실 커피머신으로", yu:"커피 내려야지~ ☕", got:"☕",
    make:{ms:3600, txt:"커피 내리는 중", fx:["💨", "☕", "♨️", "💧"], done:"다 됐다! 조심조심 갖다드려야지 ☕"}}},
  {e:"🥤", n:"아이스티", ask:"1층 카페에서 아이스티 하나 받아다 줄래?", step:{f:"lobby", talk:["l_bar"], lb:"아이스티 주문", hint:"1층 카페 바리스타한테", yu:"아이스티 하나 주세요! 🥤", re:"여기 있어 🥤 흘리지 말고 천천히!", got:"🥤",
    make:{ms:3400, wait:"심부름 왔구나? 잠깐만~ 😊", txt:"바리스타가 만드는 중", fx:["🍋", "🧊", "🥤"]}}},
  {e:"🍙", n:"주먹밥", ask:"3층 식당에서 주먹밥 좀 챙겨다 줄래? 배고파 😭", step:{f:"wf", go:[5.6, 3.8], r:1.5, lb:"주먹밥 받기", hint:"3층 구내식당으로", yu:"주먹밥 하나 주세요~ 🍙", got:"🍙",
    make:{ms:2400, txt:"주먹밥 싸는 중", fx:["🍚", "🍙"], done:"주먹밥 챙겼다! 🍙"}}}];
/* 손에 든 것 (2026-11-23 감독님 "커피 심부름은 흐를까바 들고 약간 천천히 갈수밖에 없고"): slow = 걷는 속도 배율, spill = 점프·달리기·부딪히면 찰랑 */
const HOLD = {"☕":{slow:0.55, spill:1, col:0x6B4226}, "🍫":{slow:0.6, spill:1, col:0x7A4A2A}, "🥤":{slow:0.6, spill:1, col:0xE0A040}, "🍪":{slow:0.85}, "🍙":{slow:0.85}};
const SPILL_YU = ["앗 흘릴 뻔! 😱", "조심조심… 쏟아질라 ☕", "어어어! 휴~ 안 쏟았다 😮‍💨"];
const THANKS = ["고마워 유나야! 최고야 👍", "우와 진짜 갖다줬네? 고마워 💕", "유나 덕분에 힘 난다 😆", "심부름 대장 유나! 👏"];

const cnt = o => Object.keys(o || {}).length;
/* 앉기 · 옷 갈아입기 (2026-11-23 감독님 "앉을수있게도 해줘. 의자에~ 예배를 드릴수가업네" / "탈의실에서 옷 예쁘게 갈아입혀 지면 재밌겠네 수영장에도 탈의실에서 수영복")
   의자: a~b 선분(장의자·소파) 또는 a 한 점. h = 앉아서 보는 쪽, H = 앉는 면 높이(바닥에서), k = 종류(대사), f = 앞에서만 (줄지어 놓인 장의자·극장 좌석은 뒷줄 등받이 너머로 앉지 않게) */
const hz = px => px / 31.1, PI = Math.PI;
const SEATS = {
  wf:[...[4.2, 5.3, 6.4, 7.5, 8.6, 9.7].flatMap(i => [[9.7, 13.9], [15.1, 19.3]].map(([a, b]) => ({a:[i + 0.2, a + 0.3], b:[i + 0.2, b - 0.3], h:-PI / 2, H:hz(11), k:"church", f:1}))),
    ...[3.0, 4.3, 5.6].flatMap(sj => [12.2, 12.9, 13.6, 14.3, 16.5, 17.2, 17.9, 18.6].map(si => ({a:[si, sj - 0.04], h:PI, H:hz(6.5), k:"cinema", f:1}))),
    {a:[20.95, 3.58], b:[23.25, 3.58], h:PI, H:hz(13), k:"sofa"}],
  main:[{a:[8.4, 5.6], h:PI, H:0.37, k:"meet"}, {a:[9.4, 5.6], h:PI, H:0.37, k:"meet"}, {a:[1.7, 18.1], h:PI / 2, H:0.33, k:"meet"}, {a:[3.7, 18.1], h:-PI / 2, H:0.33, k:"meet"}],
  lobby:[[22.3, 4.4], [25.0, 5.1], [27.6, 3.6], ...[22.3, 25.0, 27.6].flatMap(ti => [[ti, 9.5], [ti, 12.8]]), [30.4, 10.8], [33.2, 10.8], [31.0, 17.2], [33.8, 17.2]]
    .flatMap(([ti, tj]) => [{a:[ti, tj - 0.55], h:0, H:hz(13.5), k:"cafe"}, {a:[ti, tj + 0.55], h:PI, H:hz(13.5), k:"cafe"}]),
  roof:[[21.5, 5.15, 0], [23.25, 6.85, -PI / 2], [21.5, 8.55, PI], [19.75, 6.85, PI / 2]].map(([i, j, h]) => ({a:[i, j], h, H:hz(7.6), k:"camp"}))};
const SIT_YU = {church:["하나님 감사합니다 🙏", "우리 가족 건강하게 지켜 주세요 🙏", "아빠 작품 대박 나게 해 주세요 🙏", "행복한 회사 되게 해 주세요 🙏"],
  cinema:["영화 언제 시작해요? 🍿", "아빠 작품 틀어 주세요! 🎬", "팝콘 먹고 싶다 🍿"], sofa:["푹신푹신~ ☁️", "TV 보자! 📺"],
  cafe:["딸기 우유 주세요~ 🍓", "여기 케이크 맛있대요 🍰", "엄마랑 데이트하고 싶다 💕"], meet:["회의 시작할게요! 😎", "제 의견은요… 간식 시간! 🍪"], camp:["불멍 최고 🔥", "마시멜로 구워 먹고 싶다 🍡"]};
function nearSeat(st){
  if(!st || st.swim || st.sit) return null; let best = null, bd = 0.95;
  (SEATS[st.floor] || []).forEach(s => { let p = s.a;
    if(s.b){ const dx = s.b[0] - s.a[0], dy = s.b[1] - s.a[1], u = Math.max(0, Math.min(1, ((st.i - s.a[0]) * dx + (st.j - s.a[1]) * dy) / (dx * dx + dy * dy))); p = [s.a[0] + dx * u, s.a[1] + dy * u]; }
    const vi = st.i - p[0], vj = st.j - p[1], dd = Math.hypot(vi, vj);
    if(dd < bd && (!s.f || vi * Math.sin(s.h) + vj * Math.cos(s.h) > -0.12)){ bd = dd; best = {i:p[0], j:p[1], h:s.h, H:s.H, k:s.k}; } });
  return best;
}
const BOOTHS = {s4:[[34.2, 12.0], [35.38, 12.0]], roof:[[27.45, 16.95]]};
const nearBooth = st => !!st && !st.swim && !st.sit && (BOOTHS[st.floor] || []).some(([i, j]) => Math.hypot(st.i - i, st.j - j) < 0.85);
const FITS = [["base", "👕", "평소 옷", "역시 편한 게 최고 👕"], ["dress", "👑", "공주 드레스", "짜잔~ 공주님 등장 👑"], ["hanbok", "🌸", "한복", "한복 예쁘죠? 🌸"],
  ["director", "🎬", "꼬마 감독", "레디~ 액션! 🎬 아빠처럼"], ["spring", "🌼", "봄 원피스", "봄바람 살랑살랑 🌼"], ["swim", "🩱", "수영복", "수영하러 가자! 🩱💦"]];
const BADGES = [
  ["first", "🌱", "첫 별 받기", r => r.stars >= 1],
  ["star10", "🌟", "별 10개 모으기", r => r.stars >= 10],
  ["friend10", "👋", "10명한테 말 걸기", r => cnt(r.met) >= 10],
  ["friend25", "🤝", "25명한테 말 걸기", r => cnt(r.met) >= 25],
  ["tre10", "🔍", "보물 10개 찾기", r => cnt(r.tre) >= 10],
  ["treAll", "🏴‍☠️", "보물 30개 전부", r => cnt(r.tre) >= TOTAL],
  ["floors", "🛗", "모든 층 가 보기", r => cnt(r.vis) >= 5],
  ["ball", "⚽", "골잡이", r => r.done.ball],
  ["hide", "🙈", "숨바꼭질 달인", r => r.done.hide],
  ["swim", "🏊‍♀️", "수영 챔피언", r => r.done.swim],
  ["tag", "🏃", "술래잡기 승리", r => r.done.tag],
  ["stars", "🌠", "별똥별 수집가", r => r.done.stars],
  ["cat", "🐈", "고양이 구조대", r => r.done.cat],
  ["req5", "📦", "부탁 5번 들어주기", r => (r.req || 0) >= 5],
  ["pray", "🙏", "교회에서 기도하기", r => (r.pray || 0) >= 1],
  ["fashion", "👗", "옷 6벌 다 입어 보기", r => cnt(r.fits) >= 6],
  ["jump", "🦘", "점프 50번", r => (r.jumps || 0) >= 50],
  ["boost", "⚡", "번개 사탕 3개", r => (r.boosts || 0) >= 3]];

const YU_HI = ["안녕하세요! 뭐 해요? 👀", "저 왔어요~ 😆", "우와 이거 뭐예요?", "같이 놀래요? 🥺", "오늘 바빠요?", "저 심심해요~ 😗", "저 보물 찾는 중이에요! ✨", "제 점프 볼래요? 🦘"];
const RE_ANY = ["유나 왔어? 😊", "오늘도 신났네~ 😆", "이따 같이 놀자!", "엄마는 4층에 계셔 🌈", "옥상 수영장 가 봤어? 🏊‍♀️", "간식 먹었어? 🍪", "뛰지 말고 천천히~ 😅",
  "아까 저쪽에서 뭐가 반짝이던데? ✨", "높은 데 떠 있는 건 점프하면 닿아 🦘", "번개 사탕 먹으면 엄청 빨라진대 ⚡", "옥상에 별똥별 떨어졌다던데 🌠", "1층 안내 데스크 언니가 뭘 찾던데? 🤔"];
const DAD = {yu:["아빠~ 뭐 해? 👀", "아빠 나 왔어! 😆"], re:["아빠 일하는 중! 이따 놀자 💕", "우리 딸 왔어? 😆", "숙제는 했어? 😏", "아빠 촬영 끝나면 옥상 가자 ⚽"]};
const MOM = {yu:["엄마~ 💕", "엄마 뭐 해?"], re:["유나 왔어? 💕", "엄마 일 조금만 더 하고 놀자!", "물 마셨어? 🥤", "수영 시합 할까? 😉"]};
/* 반응 더 풍성하게 (2026-11-23 감독님 "대화나 반응이나 수영하는 모습이라든지 더 풍성했으면") */
const GREET = {
  lobby:["유나 왔구나~ 👋", "어서 와 유나야 😊", "오늘 카페 가 봤어? ☕", "유나 안녕~ 엘리베이터 조심히 타 🛗"],
  main:["어 유나다! 👋", "유나 안녕~ 삼촌 일하는 중 💻", "유나 왔어? 반가워 😆", "쉿, 아빠 회의 중일 수도 있어 🤫"],
  wf:["유나 밥 먹었어? 🍚", "유나다~ 같이 놀까? 🎮", "안녕 유나야 😊", "간식 먹으러 왔어? 🍪"],
  s4:["쉿~ 지금 촬영 중이야 🤫", "유나 왔구나! 엄마 저기 계셔 🌈", "우와 유나 오늘 예쁘다 🎀", "카메라 앞에 서 볼래? 🎥"],
  roof:["유나야 햇볕 뜨겁다 🧢", "옥상 바람 시원하지? 🍃", "유나 수영할 거야? 🏊‍♀️", "공 차러 왔어? ⚽"]};
const CARRY_RE = e => [`오 ${e} 들고 어디 가?`, `${e} 배달 중이구나! 화이팅 💪`, `우와 ${e} 맛있겠다~`];
const CAT_RE = ["어머 고양이다! 🐈 귀여워", "고양이가 유나 졸졸 따라가네? 😆", "크레파스 찾았구나! 👏"];
const WET_RE = ["유나 머리 다 젖었네? 🧺", "수영하고 왔구나! 감기 조심 🤧", "물 뚝뚝 떨어진다 😆 수건 줄까?"];
const BOOST_RE = ["우와 엄청 빠르다! ⚡", "번개 사탕 먹었구나? 😲", "천천히~ 넘어져! 😅"];
const BUMP_YU = ["앗 죄송해요! 🙏", "아이쿠 😳", "앗 부딪혔다~ 미안해요!", "어이쿠 😵"];
const BUMP_RE = ["어이쿠! 유나구나 😆", "조심조심~ 🙂", "깜짝이야! 😲", "괜찮아? 안 다쳤어?", "뛰면 넘어진다~ 😅"];
const BUMP_DAD = ["어이쿠 우리 딸 😆 아빠한테 돌진!", "아빠 넘어질 뻔했네 😜", "우리 딸 힘 세다! 💪"];
const BUMP_MOM = ["어머 유나야 조심~ 💕", "엄마 꼭 안아 줄까? 🤗"];
const CHATS = {
  lobby:[["카페에서 제일 맛있는 게 뭐예요?", "아이스초코지! 🍫", "역시~ 😋"], ["엘리베이터 타면 어디까지 가요?", "옥상까지 가! ☀️", "옥상 가 봐야지~"], ["오늘 손님 많아요?", "오늘 엄청 많았어 😅", "바쁘셨겠다!"]],
  main:[["삼촌 뭐 만들어요?", "유튜브 영상 만드는 중이야 🎬", "나도 나오게 해 주세요! 😆"], ["이거 무슨 화면이에요?", "다빈치라는 편집 프로그램이야 🎞️", "우와 어려워 보여요 😲"],
    ["오늘 아빠 바빠요?", "촬영 준비하느라 바쁘셔 📋", "그럼 내가 커피 갖다드려야지 ☕"], ["저도 컴퓨터 해도 돼요?", "이따 같이 그림 그리자 🎨", "약속! 🤙"]],
  wf:[["오늘 점심 뭐예요?", "돈가스래! 🍛", "앗싸 😋"], ["게임룸에 뭐 있어요?", "오락기랑 보드게임 🎮", "나 가 볼래요!"], ["책 읽어도 돼요?", "도서실에 동화책 많아 📚", "신난다~"]],
  s4:[["여기서 뭐 찍어요?", "드라마 찍는 중이야 🎥", "나도 배우 할래요! 🌟"], ["저 핑크 구름 진짜예요?", "만든 거야~ 예쁘지? ☁️", "완전 예뻐요 💕"], ["엄마 어디 계세요?", "예운옥 쪽에 계셔 🌈", "가 봐야지!"]],
  roof:[["바람 시원하다~", "그치? 옥상 최고야 ☀️", "수영하고 싶다 🏊‍♀️"], ["저녁에 여기서 고기 구워요?", "회식 날엔 바베큐해 🍖", "나도 끼워 주세요!"], ["공 차실래요?", "좋지! 골대로 가자 ⚽", "내가 이길 거예요 😎"]]};
const IDLE_YU = {look:["어디 가 볼까? 👀", "뭐 재밌는 거 없나~"], hop:["깡충깡충~ 🐰", "점프 점프! 🦘"], spin:["빙글빙글~ 💫", "어지러워 😵‍💫"], dance:["흥얼흥얼~ 🎵", "랄랄라~ 💃"]};
const SPLASH_IN = ["첨벙! 💦", "물 시원하다~ 🏊‍♀️", "수영 시작! 🐬"], SPLASH_OUT = ["으~ 추워! 🥶", "물 뚝뚝 💧", "수건 어디 있지? 🧺"];
/* 유나는 아빠 작품 1호 팬 (2026-11-23 감독님 "유나가 내 작품들 팬임. 항상 홍보하고 사람들한테") */
const FAN = [["우리 아빠가 만든 웹드라마 〈춘자〉 봤어요? 진짜 재밌어요! 📺", "오 진짜? 오늘 찾아볼게!"],
  ["스타벅스 까눌레 광고 봤어요? 아빠가 찍었어요 ☕", "까눌레 둥둥 뜨는 그거? 예뻤어!"],
  ["〈혼자라고 생각 말기〉도 아빠 작품이에요 💕", "제목 좋다~ 볼게!"],
  ["아빠 작품은 제가 다 봤어요. 제가 1호 팬이에요 😎", "유나가 최고 팬이네 😆"],
  ["크레용팜 유튜브도 구독해 주세요! 🙏", "벌써 했지~ 👍"]];
const FAN_DAD = ["아빠 다음 작품은 언제 나와요? 기다리고 있어요! 🎬", "우리 1호 팬 😆 금방 보여 줄게"];
const pick = a => a[Math.random() * a.length | 0];
const ro = w => { const c = w.charCodeAt(w.length - 1) - 0xAC00, b = c >= 0 && c < 11172 ? c % 28 : 0; return w + (b === 0 || b === 8 ? "로" : "으로"); };   // 카페로 · 업무층으로

const CSS = `
.yg{position:absolute;inset:0;z-index:30;pointer-events:none;font-family:var(--f-body);color:var(--ink);-webkit-user-select:none;user-select:none}
.yg button{font:inherit;color:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}
.yg-top{position:absolute;top:max(10px,env(safe-area-inset-top));left:max(12px,env(safe-area-inset-left));right:max(12px,env(safe-area-inset-right));display:flex;gap:8px;align-items:flex-start}
.yg-card{pointer-events:auto;display:flex;align-items:center;gap:10px;max-width:min(430px,calc(100% - 64px));min-height:46px;text-align:left;border:1px solid var(--line);background:color-mix(in srgb,var(--card) 90%,transparent);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);border-radius:16px;padding:7px 12px 7px 8px;box-shadow:0 6px 20px -10px rgba(40,20,30,.4)}
.yg-star{flex:none;display:grid;place-items:center;min-width:38px;height:32px;border-radius:11px;background:#FFE7F1;color:#C2407A;font-weight:800;font-size:13px;font-variant-numeric:tabular-nums}
.yg-ct{display:grid;gap:1px;min-width:0}
.yg-ct b{font-size:14px;font-weight:700;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.yg-ct span{font-size:12px;color:var(--ink-2);line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.yg-x{pointer-events:auto;margin-left:auto;flex:none;width:44px;height:44px;border-radius:50%;border:1px solid var(--line);background:color-mix(in srgb,var(--card) 90%,transparent);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);font-size:17px;font-weight:700;box-shadow:0 6px 20px -10px rgba(40,20,30,.4)}
.yg-bag{flex:none;display:grid;place-items:center;width:38px;height:38px;border-radius:12px;background:#FFF4DC;border:1.5px solid #FFC23D;font-size:22px;line-height:1}
.yg-bag.pop{animation:ygPop .5s cubic-bezier(.3,1.6,.5,1)}
@keyframes ygPop{0%{transform:scale(.2)}60%{transform:scale(1.25)}100%{transform:scale(1)}}
.yg-steps{display:flex;gap:4px;align-items:center;margin-top:3px;font-size:11.5px;font-weight:700;white-space:nowrap;overflow:hidden}
.yg-steps i{font-style:normal;border-radius:999px;padding:1px 7px;background:color-mix(in srgb,var(--ink) 7%,transparent);color:var(--ink-3)}
.yg-steps i.ok{background:color-mix(in srgb,#3A8A78 16%,transparent);color:#2F7565}
.yg-steps i.now{background:#FF6FA8;color:#FFF}
.yg-steps u{text-decoration:none;color:var(--ink-3);font-weight:500}
.yg-make{position:absolute;left:50%;bottom:calc(max(18px,env(safe-area-inset-bottom)) + 150px);transform:translateX(-50%);display:grid;gap:7px;justify-items:center;min-width:190px;background:rgba(42,42,40,.88);color:#FFF;border-radius:18px;padding:11px 18px 13px;box-shadow:0 14px 34px -14px rgba(0,0,0,.6);font-weight:800;font-size:15px}
.yg-make .e{font-size:30px;line-height:1;animation:ygBob .7s ease-in-out infinite alternate}
@keyframes ygBob{to{transform:translateY(-4px) rotate(-6deg)}}
.yg-make .bar{width:100%;height:8px;border-radius:99px;background:rgba(255,255,255,.18);overflow:hidden}
.yg-make .bar i{display:block;height:100%;width:0;border-radius:99px;background:linear-gradient(90deg,#FFC23D,#FF6FA8)}
@media (prefers-reduced-motion:reduce){.yg-make .e,.yg-bag.pop{animation:none}}
.yg-hud{position:absolute;left:50%;top:calc(max(10px,env(safe-area-inset-top)) + 76px);transform:translateX(-50%);display:flex;gap:8px;align-items:center;white-space:nowrap;font-weight:700;font-size:14px;background:#2A2A28;color:#FFF;border-radius:999px;padding:7px 14px;box-shadow:0 8px 22px -10px rgba(0,0,0,.5);font-variant-numeric:tabular-nums}
.yg-hud[hidden],.yg [hidden]{display:none!important}
.yg-hud i{font-style:normal;opacity:.7;font-weight:500}
.yg-joy{pointer-events:auto;position:absolute;left:max(18px,env(safe-area-inset-left));bottom:max(18px,env(safe-area-inset-bottom));width:124px;height:124px;border-radius:50%;background:color-mix(in srgb,var(--card) 55%,transparent);border:1.5px solid color-mix(in srgb,var(--ink) 14%,transparent);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);touch-action:none}
.yg-joy i{position:absolute;left:50%;top:50%;width:54px;height:54px;margin:-27px 0 0 -27px;border-radius:50%;background:linear-gradient(160deg,#FF8FB8,#FF5FA8);box-shadow:0 6px 16px -6px rgba(200,40,110,.7),inset 0 2px 0 rgba(255,255,255,.35);transition:transform .08s}
.yg-joy.on i{transition:none}
.yg-act{pointer-events:auto;position:absolute;right:max(18px,env(safe-area-inset-right));bottom:max(22px,env(safe-area-inset-bottom));display:grid;justify-items:center;gap:5px;border:0;background:none;padding:0}
.yg-act span{display:grid;place-items:center;width:76px;height:76px;border-radius:50%;font-size:30px;background:linear-gradient(160deg,#FF8FB8,#FF5FA8);box-shadow:0 10px 24px -8px rgba(200,40,110,.75),inset 0 2px 0 rgba(255,255,255,.35)}
.yg-act b{font-size:12px;font-weight:700;background:color-mix(in srgb,var(--card) 92%,transparent);border:1px solid var(--line);border-radius:999px;padding:2px 9px;max-width:140px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.yg-act:active span{transform:scale(.94)}
.yg-arrow{position:absolute;left:0;top:0;width:40px;height:40px;margin:-20px 0 0 -20px;display:grid;place-items:center;border-radius:50%;background:#FFC23D;color:#2A2A28;box-shadow:0 6px 16px -6px rgba(0,0,0,.45)}
.yg-arrow svg{display:block}
.yg-toast{position:absolute;left:50%;bottom:calc(max(18px,env(safe-area-inset-bottom)) + 6px);transform:translate(-50%,0) scale(.9);opacity:0;transition:opacity .25s,transform .25s;font-size:clamp(18px,3.6vw,24px);font-weight:800;letter-spacing:-.01em;color:#FFF;background:rgba(42,42,40,.84);border-radius:18px;padding:10px 20px;max-width:calc(100% - 300px);text-align:center;white-space:nowrap}
.yg-toast.on{opacity:1;transform:translate(-50%,0) scale(1)}
.yg-toast small{display:block;font-size:13px;font-weight:600;opacity:.8;margin-top:3px}
.yg-panel{pointer-events:auto;position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(380px,calc(100% - 32px));max-height:calc(100% - 32px);overflow:auto;background:var(--card);border:1px solid var(--line);border-radius:22px;padding:16px;box-shadow:0 24px 60px -20px rgba(40,20,30,.55)}
.yg-panel h3{margin:2px 4px 10px;font-size:17px;font-weight:800;display:flex;align-items:center;gap:8px}
.yg-panel h3 em{margin-left:auto;font-style:normal;font-size:13px;color:#C2407A;background:#FFE7F1;border-radius:999px;padding:2px 10px}
.yg-row{display:flex;align-items:center;gap:12px;width:100%;text-align:left;border:1px solid var(--line);background:var(--paper);border-radius:14px;padding:10px 12px;margin-top:8px;min-height:52px}
.yg-row .e{font-size:22px;width:28px;text-align:center}
.yg-row b{font-size:14.5px;font-weight:700}
.yg-row small{display:block;font-size:12px;color:var(--ink-3);margin-top:1px}
.yg-row .ok{margin-left:auto;font-size:12px;font-weight:700;color:#3A8A78;background:color-mix(in srgb,#3A8A78 14%,transparent);border-radius:999px;padding:2px 8px;white-space:nowrap}
.yg-row.cur{border-color:#FF6FA8;box-shadow:0 0 0 2px color-mix(in srgb,#FF6FA8 30%,transparent)}
.yg-free{width:100%;margin-top:12px;border:0;background:none;color:var(--ink-2);font-size:13px;font-weight:600;padding:8px}
.yg-elev{pointer-events:auto;position:absolute;right:calc(max(18px,env(safe-area-inset-right)) + 92px);bottom:max(18px,env(safe-area-inset-bottom));display:grid;gap:6px;background:#2A2A28;border-radius:18px;padding:8px;box-shadow:0 16px 40px -14px rgba(0,0,0,.6)}
.yg-elev button{display:flex;align-items:center;gap:10px;min-width:150px;min-height:40px;border:0;border-radius:12px;background:rgba(255,255,255,.08);color:#FFF;padding:6px 12px;font-size:14px;font-weight:600;text-align:left}
.yg-elev button b{font-family:var(--f-mono);font-size:13px;width:24px;color:#FFC23D}
.yg-elev button[aria-current="true"]{background:#FF6FA8}
.yg-elev button[aria-current="true"] b{color:#FFF}
.yg-fade{position:absolute;inset:0;display:grid;place-items:center;background:color-mix(in srgb,var(--paper) 94%,transparent);opacity:0;pointer-events:none;transition:opacity .3s;font-size:22px;font-weight:800}
.yg-fade.on{opacity:1;pointer-events:auto}
.yg-help{position:absolute;left:50%;bottom:max(22px,env(safe-area-inset-bottom));transform:translateX(-50%);max-width:calc(100% - 330px);font-size:12.5px;font-weight:600;color:var(--ink-2);background:color-mix(in srgb,var(--card) 88%,transparent);border:1px solid var(--line);border-radius:999px;padding:6px 12px;text-align:center;transition:opacity .6s}
@media (max-width:520px){.yg-help{display:none}.yg-hud{top:calc(max(10px,env(safe-area-inset-top)) + 80px)}}
.t3-bub.yu{border-color:#FF6FA8}.t3-stem.yu{background:#FF6FA8}
.yg-jump{pointer-events:auto;position:absolute;right:calc(max(18px,env(safe-area-inset-right)) + 9px);bottom:calc(max(22px,env(safe-area-inset-bottom)) + 108px);display:grid;justify-items:center;gap:4px;border:0;background:none;padding:0}
.yg-jump span{display:grid;place-items:center;width:58px;height:58px;border-radius:50%;background:color-mix(in srgb,var(--card) 88%,transparent);border:1.5px solid #FF8FB8;color:#E2507F;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);box-shadow:0 8px 20px -10px rgba(200,40,110,.6)}
.yg-jump span{font-size:26px;line-height:1}
.yg-jump b{font-size:11px;font-weight:700;color:var(--ink-2)}
.yg-run{pointer-events:auto;position:absolute;right:calc(max(18px,env(safe-area-inset-right)) + 82px);bottom:calc(max(22px,env(safe-area-inset-bottom)) + 108px);display:grid;justify-items:center;gap:4px;border:0;background:none;padding:0;--p:0}
.yg-run span{display:grid;place-items:center;width:58px;height:58px;border-radius:50%;font-size:24px;background:radial-gradient(closest-side,color-mix(in srgb,var(--card) 92%,transparent) 80%,transparent 82%),conic-gradient(#FFC23D calc(var(--p) * 360deg),color-mix(in srgb,var(--ink) 16%,transparent) 0);box-shadow:0 8px 20px -10px rgba(0,0,0,.45);filter:grayscale(.7);opacity:.8;transition:filter .2s,opacity .2s,transform .1s}
.yg-run.full span{filter:none;opacity:1;animation:yg-glow 1.1s ease-in-out infinite}
.yg-run.go span{filter:none;opacity:1;background:radial-gradient(closest-side,#FFF3D1 80%,transparent 82%),conic-gradient(#FF6FA8 calc(var(--p) * 360deg),transparent 0)}
.yg-run b{font-size:11px;font-weight:700;color:var(--ink-2)}
.yg-run:active span{transform:scale(.92)}
@keyframes yg-glow{50%{box-shadow:0 0 0 7px rgba(255,194,61,.35),0 8px 20px -10px rgba(0,0,0,.45)}}
.yg-snd + .yg-x{margin-left:8px}
@media (orientation:landscape) and (pointer:coarse){.yg-joy{bottom:calc(max(18px,env(safe-area-inset-bottom)) + 72px);left:calc(max(18px,env(safe-area-inset-left)) + 12px)}}
.yg-jump:active span{transform:scale(.92)}
.yg-tabs{display:flex;gap:6px;margin:0 2px 4px}
.yg-tabs button{flex:1;min-height:36px;border-radius:999px;border:1px solid var(--line);background:var(--paper);font-size:13px;font-weight:700;color:var(--ink-2);padding:4px 6px;white-space:nowrap}
.yg-tabs button[aria-selected="true"]{background:#FF6FA8;border-color:#FF6FA8;color:#FFF}
.yg-trow{display:grid;grid-template-columns:54px 1fr auto;align-items:center;gap:8px;border:1px solid var(--line);background:var(--paper);border-radius:14px;padding:9px 12px;margin-top:8px}
.yg-trow b{font-size:13px;font-weight:700}
.yg-trow small{font-size:12px;font-weight:700;color:var(--ink-3);font-variant-numeric:tabular-nums}
.yg-trow small.all{color:#3A8A78}
.yg-tset{display:flex;gap:3px;font-size:19px;line-height:1}
.yg-tset .no{filter:grayscale(1);opacity:.32}
.yg-bgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:8px}
.yg-bg{display:grid;justify-items:center;align-content:start;gap:4px;border:1px solid var(--line);background:var(--paper);border-radius:14px;padding:10px 4px 8px;text-align:center}
.yg-bg .e{font-size:24px;line-height:1}
.yg-bg small{font-size:10.5px;font-weight:600;line-height:1.25;color:var(--ink-2);word-break:keep-all}
.yg-bg.no .e{filter:grayscale(1);opacity:.3}
.yg-bg.no small{color:var(--ink-3)}
.yg-bg.ok{border-color:color-mix(in srgb,#FF6FA8 55%,var(--line));background:color-mix(in srgb,#FF6FA8 14%,var(--paper))}
.yg-bg.ok small{color:var(--ink)}
.yg-note{margin:12px 4px 0;font-size:12px;color:var(--ink-3);line-height:1.45}
`;

/* 소리 (2026-11-23 감독님 "효과음과 비지엠 넣어줘"): 파일 없이 웹오디오로 만든 짧은 효과음 + 직접 쓴 밝은 8마디 배경음 */
const AU = {ctx:null, on:true, m:null, sfx:null, bgm:null, noise:null, iv:0, next:0, step:0, blipAt:0};
try { AU.on = localStorage.getItem("crayon-yuna-sound") !== "0"; } catch(_){}
const mtof = n => 440 * Math.pow(2, (n - 69) / 12);
function auInit(){
  const C = window.AudioContext || window.webkitAudioContext; if(!C) return null;
  if(!AU.ctx){ const c = AU.ctx = new C(); AU.m = c.createGain(); AU.m.gain.value = AU.on ? 0.9 : 0; AU.m.connect(c.destination);
    AU.sfx = c.createGain(); AU.sfx.gain.value = 0.55; AU.sfx.connect(AU.m); AU.bgm = c.createGain(); AU.bgm.gain.value = 0.28; AU.bgm.connect(AU.m);
    const len = c.sampleRate * 0.5 | 0, b = c.createBuffer(1, len, c.sampleRate), dd = b.getChannelData(0); for(let k = 0; k < len; k++) dd[k] = Math.random() * 2 - 1; AU.noise = b; }
  if(AU.ctx.state === "suspended" && !document.hidden) AU.ctx.resume?.();
  if(!AU.iv){ AU.next = AU.ctx.currentTime + 0.15; AU.step = 0; AU.iv = setInterval(bgmPump, 90); }
  return AU.ctx;
}
function auStop(){ clearInterval(AU.iv); AU.iv = 0; try { AU.ctx?.close(); } catch(_){} AU.ctx = null; }
function auSet(on){ AU.on = on; try { localStorage.setItem("crayon-yuna-sound", on ? "1" : "0"); } catch(_){} if(AU.m) AU.m.gain.setTargetAtTime(on ? 0.9 : 0, AU.ctx.currentTime, 0.05); }
function tone(f, t0, dur, {type = "sine", vol = 0.2, slide = 0, out} = {}){
  const c = AU.ctx; if(!c) return; const o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t0); if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, f * slide), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(out || AU.sfx); o.start(t0); o.stop(t0 + dur + 0.03);
}
function hiss(t0, dur, {vol = 0.2, f = 1200, q = 0.8, to = 0, out} = {}){
  const c = AU.ctx; if(!c || !AU.noise) return; const s = c.createBufferSource(), bp = c.createBiquadFilter(), g = c.createGain();
  s.buffer = AU.noise; bp.type = "bandpass"; bp.frequency.setValueAtTime(f, t0); if(to) bp.frequency.exponentialRampToValueAtTime(to, t0 + dur); bp.Q.value = q;
  g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  s.connect(bp); bp.connect(g); g.connect(out || AU.sfx); s.start(t0); s.stop(t0 + dur + 0.02);
}
const SFX = {
  jump(t){ tone(330, t, 0.22, {type:"triangle", vol:0.22, slide:2.2}); },
  pick(t){ [84, 88, 91, 96].forEach((n, k) => tone(mtof(n), t + k * 0.07, 0.22, {type:"triangle", vol:0.16})); },
  blip(t, hi){ const b = hi ? 76 : 64; tone(mtof(b + [0, 2, 4, 7][Math.random() * 4 | 0]), t, 0.06, {type:"square", vol:0.035}); tone(mtof(b + 5 + [0, 2, 4][Math.random() * 3 | 0]), t + 0.07, 0.06, {type:"square", vol:0.03}); },
  splash(t){ hiss(t, 0.5, {vol:0.35, f:1800, to:500, q:0.6}); tone(180, t, 0.25, {vol:0.12, slide:0.5}); },
  bump(t){ tone(150, t, 0.16, {vol:0.3, slide:0.5}); hiss(t, 0.08, {vol:0.12, f:600}); },
  ding(t){ tone(mtof(88), t, 0.9, {vol:0.18}); tone(mtof(84), t + 0.28, 1.1, {vol:0.18}); },
  star(t){ [72, 76, 79, 84].forEach((n, k) => tone(mtof(n), t + k * 0.11, k === 3 ? 0.6 : 0.18, {type:"triangle", vol:0.18})); tone(mtof(88), t + 0.44, 0.6, {vol:0.1}); },
  go(t){ tone(mtof(79), t, 0.15, {type:"square", vol:0.06}); tone(mtof(91), t + 0.17, 0.3, {type:"square", vol:0.06}); },
  goal(t){ SFX.star(t); hiss(t, 0.9, {vol:0.12, f:2500, q:0.4}); },
  boost(t){ tone(220, t, 0.45, {type:"sawtooth", vol:0.06, slide:3.2}); hiss(t, 0.45, {vol:0.12, f:800, to:4000, q:0.7}); },
  ready(t){ tone(mtof(84), t, 0.12, {type:"triangle", vol:0.12}); tone(mtof(91), t + 0.1, 0.2, {type:"triangle", vol:0.12}); },
  brew(t, s = 3){ hiss(t, Math.min(1.2, s * 0.35), {vol:0.16, f:500, to:1400, q:0.6}); for(let k = 0; k < Math.max(3, s * 2.2 | 0); k++) tone(mtof(86 + (k % 3) * 2), t + 0.5 + k * 0.42, 0.07, {vol:0.06}); tone(mtof(91), t + s - 0.15, 0.25, {type:"triangle", vol:0.12}); },
};
function sfx(k, a){ const c = auInit(); if(!c || !AU.on) return; SFX[k]?.(c.currentTime + 0.01, a); }
const BGM_CH = [[48, 60, 64, 67], [45, 57, 60, 64], [41, 57, 60, 65], [43, 55, 59, 62]];   // C · Am · F · G
const BGM_MEL = [76,-1,79,76, 74,-1,72,-1,  72,74,76,-1, 81,-1,79,-1,  84,-1,81,79, 77,-1,76,-1,  74,76,79,-1, 74,-1,-1,-1,
                 76,-1,79,76, 74,-1,72,-1,  72,74,76,-1, 81,-1,84,-1,  81,-1,79,77, 76,-1,74,-1,  76,74,72,-1, 72,-1,-1,-1];
function bgmPump(){
  const c = AU.ctx; if(!c) return; if(c.state !== "running"){ AU.next = c.currentTime + 0.1; return; }
  const e8 = 60 / 104 / 2;
  while(AU.next < c.currentTime + 0.35){
    const t = AU.next, s = AU.step % 64, ch = BGM_CH[(s >> 3) % 4], b8 = s % 8;
    if(AU.on){
      if(b8 === 0 || b8 === 4) tone(mtof(ch[0]), t, e8 * 1.8, {type:"triangle", vol:0.22, out:AU.bgm});
      if(b8 % 2 === 1){ ch.slice(1).forEach(n => tone(mtof(n), t, e8 * 0.9, {vol:0.045, out:AU.bgm})); hiss(t, 0.04, {vol:0.05, f:7000, q:0.7, out:AU.bgm}); }
      const m = BGM_MEL[s]; if(m > 0) tone(mtof(m), t, e8 * 1.6, {type:"triangle", vol:0.12, out:AU.bgm});
    }
    AU.next += e8; AU.step++;
  }
}

export function start(api){
  if(!document.getElementById("yg-css")){ const st = document.createElement("style"); st.id = "yg-css"; st.textContent = CSS; document.head.append(st); }
  const root = document.createElement("div"); root.className = "yg";
  root.innerHTML = `
    <div class="yg-top"><button class="yg-card" type="button" aria-label="할 일 고르기"><span class="yg-star">⭐ 0</span><span class="yg-bag" hidden title="들고 있는 것"></span><span class="yg-ct"><b>할 일 고르기</b><span>눌러서 심부름·놀이 고르기</span><span class="yg-steps" hidden></span></span></button>
      <button class="yg-x yg-snd" type="button" aria-label="소리 켜기·끄기">🔊</button><button class="yg-x" type="button" aria-label="유나 모드 끝내기">✕</button></div>
    <div class="yg-hud" hidden></div>
    <div class="yg-make" hidden><span class="e"></span><b></b><span class="bar"><i></i></span></div>
    <div class="yg-arrow" hidden><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></div>
    <div class="yg-help">왼쪽 동그라미로 걷기 · 화면 끌면 둘러보기 · 높은 보물은 점프</div>
    <div class="yg-joy" aria-label="걷기"><i></i></div>
    <button class="yg-jump" type="button" aria-label="점프"><span><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V6M6 11l6-6 6 6"/></svg></span><b>점프</b></button>
    <button class="yg-run" type="button" aria-label="달리기"><span>🏃‍♀️</span><b>달리기</b></button>
    <button class="yg-act" type="button" hidden><span>💬</span><b>말 걸기</b></button>
    <div class="yg-elev" hidden></div>
    <div class="yg-elev yg-fit" hidden></div>
    <div class="yg-toast"></div>
    <div class="yg-panel" hidden></div>
    <div class="yg-fade on">유나 모드 준비 중… 🎀</div>`;
  api.host.append(root);
  const $ = s => root.querySelector(s);
  const runB = $(".yg-run"), sndB = $(".yg-snd"); sndB.textContent = AU.on ? "🔊" : "🔇";
  sndB.onclick = ev => { ev.stopPropagation(); auSet(!AU.on); auInit(); sndB.textContent = AU.on ? "🔊" : "🔇"; };
  const card = $(".yg-card"), hud = $(".yg-hud"), arrow = $(".yg-arrow"), joy = $(".yg-joy"), knob = joy.querySelector("i"), act = $(".yg-act"), jumpB = $(".yg-jump"), elevP = $(".yg-elev:not(.yg-fit)"), fitP = $(".yg-fit"), toastEl = $(".yg-toast"), panel = $(".yg-panel"), fade = $(".yg-fade"), help = $(".yg-help"), bagEl = $(".yg-bag"), stepsEl = $(".yg-steps"), makeEl = $(".yg-make");

  /* 별 기록 (이 기기에만) */
  let rec = {stars:0, done:{}, tre:{}, met:{}, vis:{}, badge:{}, round:0, req:0, jumps:0, boosts:0};
  try { rec = Object.assign(rec, JSON.parse(localStorage.getItem("crayon-yuna-play") || "{}")); } catch(_){}
  const JUMP_SVG = jumpB.querySelector("span").innerHTML;
  const save = () => { try { localStorage.setItem("crayon-yuna-play", JSON.stringify(rec)); } catch(_){} };

  const S = {floor:null, st:null, spots:[], bolt:null, near:null, tab:"q", reqNext:0, greet:{}, wetUntil:0};
  let REQ = null;   // ❗ 부탁하려는 사람 {id, name, floor, until}   // st = 엔진이 매 프레임 주는 상태
  let Q = null, step = 0, G = null, carry = "", pendingFloor = null, talkAt = 0, live = true, toastT = 0, helpT = 0;
  const E = () => api.eng();
  const now = () => performance.now();
  const curStep = () => Q ? Q.steps[step] : null;
  const needFloor = st => st.find ? (Q.known ? Q.catF : null) : st.f;

  const tq = []; let tUntil = 0;
  function toast(txt, sub = "", ms = 1900, queue = false){
    if(queue && now() < tUntil){ tq.push([txt, sub, ms]); return; }
    toastEl.innerHTML = ""; toastEl.append(txt); if(sub){ const s = document.createElement("small"); s.textContent = sub; toastEl.append(s); } toastEl.classList.add("on"); help.style.opacity = 0;
    clearTimeout(toastT); tUntil = now() + ms;
    toastT = setTimeout(() => { toastEl.classList.remove("on"); tUntil = 0; const n = tq.shift(); if(n) setTimeout(() => { if(live) toast(...n); }, 280); }, ms); }
  function checkBadges(){ BADGES.forEach(([id, e, t, c]) => { if(!rec.badge[id] && c(rec)){ rec.badge[id] = 1; save(); toast(`🏅 새 배지! ${e}`, t, 2400, true); } }); }
  const floorFound = f => TREASURE[f].filter((_, k) => rec.tre[`${f}:${k}`]).length;
  const blip = hi => { const n = performance.now(); if(n - AU.blipAt < 220) return; AU.blipAt = n; sfx("blip", hi); };
  const yuSay = (t, ms) => { blip(true); return E()?.playSay("yu", t, ms); };
  const npcSay = (id, t, ms) => { blip(false); return E()?.playSay(id.startsWith("@") ? id.slice(1) : id, t, ms); };

  /* ---------- 들고 있는 것 · 받기 · 만드는 장면 (2026-11-23 감독님 "미션같은 거 하면 시각화가 필요하지 않음?", "바리스타도 만들어서 주는 느낌", "받았는지도 몰랐네") ---------- */
  function setCarry(c){
    const was = carry; carry = c || ""; const h = HOLD[carry]; E()?.playSet({hold:h ? {e:carry, ...h} : null});
    bagEl.hidden = !carry; if(carry){ bagEl.textContent = carry; if(carry !== was){ bagEl.classList.remove("pop"); void bagEl.offsetWidth; bagEl.classList.add("pop"); } } }
  function receive(c){
    setCarry(c); sfx("pick"); E()?.playEmote?.("yu", "✨", 1500);
    const nx = Q?.steps[step + 1]; toast(`${c} 받았다!`, HOLD[c]?.spill ? `흘리지 않게 천천히 · ${nx?.lb || ""}` : nx?.hint || "", 2200); }
  let mkTimer = 0;
  function makeIt(st, by, done){
    const e = E(); if(!e) return; const m = st.make, t0 = now(); S.busy = true;
    e.playSet({freeze:true, mark:null}); sfx("brew", m.ms / 1000);
    makeEl.querySelector(".e").textContent = st.got || m.fx[0]; makeEl.querySelector("b").textContent = m.txt + "…"; const bar = makeEl.querySelector(".bar i"); bar.style.width = "0%"; makeEl.hidden = false;
    clearInterval(mkTimer); mkTimer = setInterval(() => { const k = Math.min(1, (now() - t0) / m.ms); bar.style.width = (k * 100).toFixed(1) + "%"; if(k >= 1) clearInterval(mkTimer); }, 60);
    const at = by || [st.go[0], st.go[1], 1.0];
    m.fx.forEach((x, k) => later0(150 + k * (m.ms - 500) / m.fx.length, () => e.playEmote?.(at, x, 1300)));
    later0(m.ms, () => { clearInterval(mkTimer); makeEl.hidden = true; S.busy = false; E()?.playSet({freeze:false}); if(live) done(); }); }
  function spill(){ const e = E(); if(!e?.playSlosh?.()) return; sfx("bump"); yuSay(pick(SPILL_YU), 1500); }

  /* ---------- 할 일 카드 · 목록 ---------- */
  function renderCard(dist){
    card.querySelector(".yg-star").textContent = `⭐ ${rec.stars}`;
    const b = card.querySelector("b"), s = card.querySelector(".yg-ct span"), st = curStep();
    const sk = Q ? Q.steps.map((x, k) => (k < step ? "1" : k === step ? "2" : "0") + (x.lb || x.hint || "")).join("|") : "";
    if(stepsEl.dataset.k !== sk){ stepsEl.dataset.k = sk; stepsEl.innerHTML = ""; stepsEl.hidden = !Q || Q.steps.length < 2;
      if(Q) Q.steps.forEach((x, k) => { if(k){ const u = document.createElement("u"); u.textContent = "›"; stepsEl.append(u); }
        const i = document.createElement("i"); i.className = k < step ? "ok" : k === step ? "now" : ""; i.textContent = (k < step ? "✓ " : "") + (x.lb || x.hint || ""); stepsEl.append(i); }); }
    if(!Q){ b.textContent = "할 일 고르기"; const h = S.floor ? `${FL[S.floor].name.split(" ")[0]} 보물 ${floorFound(S.floor)}/6 · 눌러서 심부름·놀이` : "눌러서 심부름·놀이 고르기"; if(s.textContent !== h) s.textContent = h; return; }
    b.textContent = `${Q.e} ${Q.t}`;
    const fNeed = needFloor(st);
    let h = (carry ? carry + (carry === "🐈" ? " 데리고 · " : " 들고 · ") : "") + (fNeed && fNeed !== S.floor ? `🛗 엘리베이터 타고 ${ro(FL[fNeed].name)}` : st.find && S.floor === Q.catF ? "🐈 이 층 어딘가에서 야옹 소리가…" : st.hint || "");
    if(dist != null && dist > 1.5 && !G) h += ` · ${Math.round(dist)}m`;
    if(s.textContent !== h) s.textContent = h;
  }
  function openList(tab = S.tab){
    closeElev(); S.tab = tab;
    panel.innerHTML = `<h3>유나의 모험 <em>⭐ ${rec.stars}</em></h3><div class="yg-tabs" role="tablist"></div>`;
    const tabs = panel.querySelector(".yg-tabs");
    [["q", "할 일"], ["t", `보물 ${cnt(rec.tre)}/${TOTAL}`], ["b", `배지 ${cnt(rec.badge)}/${BADGES.length}`]].forEach(([k, l]) => { const b = document.createElement("button"); b.type = "button"; b.setAttribute("role", "tab"); b.setAttribute("aria-selected", k === tab); b.textContent = l; b.onclick = () => openList(k); tabs.append(b); });
    if(tab === "t"){
      Object.keys(FL).forEach(f => { const r = document.createElement("div"); r.className = "yg-trow"; const n = floorFound(f);
        r.innerHTML = `<b></b><span class="yg-tset"></span><small class="${n >= 6 ? "all" : ""}">${n >= 6 ? "다 찾음" : n + "/6"}</small>`;
        r.querySelector("b").textContent = FL[f].name.split(" ")[0];
        TREASURE[f].forEach(([e, nm], k) => { const sp = document.createElement("span"); sp.textContent = e; sp.title = nm; if(!rec.tre[`${f}:${k}`]) sp.className = "no"; r.querySelector(".yg-tset").append(sp); });
        panel.append(r); });
      const note = document.createElement("p"); note.className = "yg-note"; note.textContent = "반짝이는 걸 찾아 걸어가면 주워요. 높이 떠 있는 건 점프! 근처에 가면 위쪽에 ✨ 알림이 떠요."; panel.append(note);
      if(cnt(rec.tre) >= TOTAL){ const again = document.createElement("button"); again.type = "button"; again.className = "yg-free"; again.textContent = "🔁 보물 다시 숨기기 (새 자리)";
        again.onclick = () => { rec.round++; rec.tre = {}; save(); S.floor && spotsFor(S.floor); refreshItems(); openList("t"); toast("🏴‍☠️ 보물을 새로 숨겼어요!"); }; panel.append(again); }
      panel.hidden = false; return; }
    if(tab === "b"){
      const g = document.createElement("div"); g.className = "yg-bgrid";
      BADGES.forEach(([id, e, t]) => { const d = document.createElement("div"); d.className = "yg-bg " + (rec.badge[id] ? "ok" : "no"); d.innerHTML = `<span class="e"></span><small></small>`; d.querySelector(".e").textContent = e; d.querySelector("small").textContent = t; g.append(d); });
      panel.append(g); panel.hidden = false; return; }
    QUESTS.forEach(q => { const r = document.createElement("button"); r.type = "button"; r.className = "yg-row" + (Q === q ? " cur" : "");
      r.innerHTML = `<span class="e"></span><span><b></b><small></small></span>${rec.done[q.id] ? `<span class="ok">⭐ ${rec.done[q.id]}번</span>` : ""}`;
      r.querySelector(".e").textContent = q.e; r.querySelector("b").textContent = q.t; r.querySelector("small").textContent = q.steps.map(s => s.f ? FL[s.f].name.split(" ")[0] : "❓").filter(x => x).filter((x, k, a) => a.indexOf(x) === k).join(" → ");
      r.onclick = () => { panel.hidden = true; begin(q); }; panel.append(r); });
    const free = document.createElement("button"); free.type = "button"; free.className = "yg-free"; free.textContent = Q ? "이 할 일 그만하고 그냥 돌아다니기" : "그냥 돌아다니기";
    free.onclick = () => { panel.hidden = true; if(Q){ endGame(); Q = null; setCarry(""); setup(); renderCard(); } }; panel.append(free);
    panel.hidden = false;
  }
  card.onclick = () => panel.hidden ? openList() : (panel.hidden = true);

  function begin(q){
    endGame(); Q = q; step = 0; setCarry(""); REQ = null;
    if(q.id === "cat"){ q.catF = pick(CAT_FLOORS); q.known = false; q.catAt = null; q.catAtF = null; q.cat = "lost"; S.catPos = null; }
    setup(); renderCard(); const st = curStep();
    toast(`${q.e} ${q.t}`, st.f && st.f !== S.floor ? `${ro(FL[st.f].name)} 가요` : st.hint);
    if(st.game && st.f === S.floor) later0(900, () => { if(Q === q && curStep() === st && !G) startGame(st.game); }); }
  function advance(){
    step++;
    if(step >= Q.steps.length){ const q = Q; Q = null; setCarry(""); rec.stars++; rec.done[q.id] = (rec.done[q.id] || 0) + 1; if(q.id === "req") rec.req++; save(); endGame(); renderCard(); E()?.playSet({mark:null}); later0(3800, () => { if(!Q) setup(); }); later0(2800, checkBadges);
      E()?.playSet({wave:2200}); sfx("star"); toast(`⭐ +1  ${q.e} 완료!`, `별 ${rec.stars}개 모았어요`, 2600); if(q.id !== "req") setTimeout(() => { if(live && !Q && panel.hidden) openList("q"); }, 2900); return; }
    setup(); renderCard();
    const st = curStep(); if(st.game) startGame(st.game);
  }

  /* ---------- 이 층에서 보일 것 (수영장 · 아빠/엄마 · 표시 별) ---------- */
  function setup(){
    const e = E(); if(!e || !S.floor) return;
    const f = S.floor, st = curStep(), hide = [];
    const need = k => (G?.type === "hide" || G?.type === "tag") && k === "dad" || G?.type === "swim" && k === "mom" || (st && st.f === f && st.talk === "@" + k);
    // 아빠(2층)·엄마(4층) 배우: 원래 자리 근처에 세우고 원래 사람은 숨김
    [["dad", "main", "_dir", [32.2, 4.4]], ["mom", "s4", "_nora", [6.7, 17.9]]].forEach(([k, fl, id, def]) => {
      if(need(k) && (f === fl || G)){ if(!(S.st?.actors || {})[k] && !G){ const w = e.playWhere(id), at = e.playFree(...(w ? [w[0], w[1]] : def), 0.22); e.playActor(k, {at:[at[0], at[1], w ? w[2] : 0], pose:"stand"}); }
        hide.push(id, "l_" + id.slice(1)); }
      else e.playActor(k, null); });
    let mark = null;
    if(st && !G){ const fn = needFloor(st); if(st.find){ if(fn && fn !== f) mark = {at:ELEV}; }
      else if(st.f !== f) mark = {at:ELEV};
      else if(st.go) mark = {at:st.go};
      else if(st.talk && st.talk[0] === "@") mark = {actor:st.talk.slice(1)};
      else if(Array.isArray(st.talk)){ const id = st.talk.find(x => e.playWhere(x)); mark = id ? {id} : null; } }
    if(G?.type === "swim") mark = {at:[28.35, 18.45]};
    e.playSet({water:f === "roof" ? [POOL] : [], hide, mark});
    if(Q?.id === "cat" && curStep()?.find && f === Q.catF && Q.catAtF !== f){ Q.catAt = e.playHideSpot(4) || e.playFree(EXIT[0] + 3, EXIT[1], 0.2); Q.catAtF = f; }
    refreshItems();
  }
  function spotsFor(f){ const e = E(); if(!e) return; S.spots = e.playSpots(6, SEED[f] + rec.round * 101, AVOID, 2.6); }
  function boltFor(){ const e = E(); if(!e) return; S.bolt = e.playSpots(1, Math.random() * 1e9 | 0, [...AVOID, ...S.spots.map(p => [p[0], p[1], 1.6])], 1)[0] || null; }
  function refreshItems(){
    const e = E(); if(!e || !S.floor) return; const f = S.floor, L = [];
    if(G?.type === "stars") G.items.forEach(it => { if(!it.got) L.push(it); });
    else { S.spots.forEach((p, k) => { const tr = TREASURE[f][k]; if(tr && !rec.tre[`${f}:${k}`]) L.push({id:"t" + k, e:tr[0], i:p[0], j:p[1], y:tr[2] ? 1.12 : 0.42, high:!!tr[2], s:0.62}); });
      if(S.bolt) L.push({id:"bolt", e:"⚡", i:S.bolt[0], j:S.bolt[1], y:0.42, s:0.6}); }
    if(Q?.id === "cat"){ const pos = Q.cat === "follow" ? S.catPos : curStep()?.find && f === Q.catF ? Q.catAt : null; if(pos) L.push({id:"cat", e:"🐈", i:pos[0], j:pos[1], y:0.27, s:0.62, pick:false, glow:false, bob:false}); }
    if(REQ && REQ.floor === f) L.push({id:"req", e:"❗", on:REQ.id, pick:false, glow:false, s:0.4});
    e.playItems(L);
  }
  /* 주웠을 때 */
  function onPick(id){
    const e = E(), f = S.floor;
    if(id[0] === "t" && TREASURE[f]){ const k = +id.slice(1), tr = TREASURE[f][k]; if(!tr) return; rec.tre[`${f}:${k}`] = 1; save(); sfx("pick");
      const n = floorFound(f); e?.playEmote?.("yu", tr[0], 1600); yuSay(pick(["보물이다!! ✨", "우와 이거 내 거! 😆", "반짝반짝 ✨", "찾았다~! 🎉"]), 1800);
      toast(`${tr[0]} ${tr[1]} 찾았다!`, `${FL[f].name.split(" ")[0]} 보물 ${n}/6`);
      if(n >= 6){ rec.stars++; save(); sfx("star"); toast("🏴‍☠️ 이 층 보물 다 찾았다!", "⭐ +1", 2600, true); }
      checkBadges(); renderCard(); return; }
    if(id === "bolt"){ e?.playSet({boost:10000}); sfx("boost"); rec.boosts++; save(); S.bolt = null; yuSay("우와 빨라졌다!! ⚡", 1800); toast("⚡ 번개 사탕!", "10초 동안 쌩쌩 달려요"); checkBadges();
      const fl = f; later0(40000, () => { if(S.floor === fl && !S.bolt && !(G?.type === "stars")){ boltFor(); refreshItems(); } }); return; }
    if(id[0] === "s" && G?.type === "stars"){ const it = G.items.find(x => x.id === id); if(it) it.got = true; G.n++;
      if(G.n >= G.total){ G.phase = "end"; yuSay("별똥별 다 모았다!! 🌠"); toast("🌠 별똥별 다 모았다!", "", 1800); later(1500, () => { endGame(); advance(); }); }
      else if(G.n % 4 === 0) yuSay(pick(["반짝반짝! 🌟", "하나 더~!", "얼마 안 남았다! 😆"]), 1400); }
  }

  /* ---------- 미니게임 ---------- */
  function endGame(){ if(!G) return; const was = G.type; clearInterval(G.iv); G.tm?.forEach(clearTimeout); const e = E(); if(e){ e.playSet({ball:null, freeze:false}); } G = null; hud.hidden = true; if(was === "stars") refreshItems(); }
  const later = (ms, fn) => { const t = setTimeout(() => { if(live) fn(); }, ms); G?.tm?.push(t); return t; };
  function startGame(type){
    const e = E(); if(!e) return; endGame(); sfx("go");
    G = {type, t0:now(), tm:[], n:0};
    if(type === "ball"){
      G.until = now() + 75000; e.playSet({ball:BALL0, pos:[9.4, 4.8, -Math.PI / 2], mark:null});
      toast("⚽ 골 3개 넣기!", "공을 몰고 골대로 · 75초"); yuSay("간다~! ⚽");
    }
    if(type === "hide"){
      G.phase = "count"; e.playSet({freeze:true, mark:null}); e.playActor("dad", null);
      toast("🙈 하나, 둘, 셋…", "아빠가 숨는 중", 2400); yuSay("하나~ 둘~ 셋~ 🙈", 2400);
      later(2600, () => { const sp = e.playHideSpot(7) || [3, 15]; e.playActor("dad", {at:[sp[0], sp[1], Math.random() * 6.28], pose:"crouch"}); e.playSet({freeze:false, hide:["_dir"]});
        G.phase = "seek"; G.until = now() + 90000; toast("찾아라! 🔎", "가까워지면 뜨거워져요"); yuSay("다 숨었지? 찾는다~!"); });
    }
    if(type === "swim"){
      G.phase = "ready"; e.playSet({pos:[21.25, 18.45, Math.PI / 2], freeze:true, water:[POOL], mark:{at:[28.35, 18.45]}});
      e.playActor("mom", {at:[21.25, 19.35, Math.PI / 2], pose:"swim", to:null});
      setup();
      npcSay("@mom", "준비됐어? 엄마 안 봐준다~ 😆");
      ["3", "2", "1"].forEach((n, k) => later(1200 + k * 900, () => toast(n, "", 700)));
      later(1200 + 3 * 900, () => { toast("출발! 🏁", "", 900); e.playSet({freeze:false}); e.playActor("mom", {to:[28.35, 19.35], spd:1.18}); G.phase = "race"; G.until = now() + 40000; });
    }
    if(type === "tag"){
      const w = e.playWhere("_dir"), a = S.st?.actors?.dad, at = a ? [a.i, a.j] : e.playFree(...(w ? [w[0], w[1]] : [32.2, 4.4]), 0.22);
      e.playActor("dad", {at:[at[0], at[1], 0], pose:"stand", to:null}); setup();
      G.phase = "ready"; G.next = 0; toast("🏃 아빠를 잡아라!", "50초 · 번개 사탕 먹으면 빨라져요", 2200); npcSay("@dad", "잡아 봐라~ 😜", 2200);
      later(1200, () => { G.phase = "run"; G.t1 = now(); G.until = now() + 50000; });
    }
    if(type === "stars"){
      const sp = e.playSpots(10, Math.random() * 1e9 | 0, AVOID, 1.9);
      G.items = sp.map((p, k) => ({id:"s" + k, e:"🌟", i:p[0], j:p[1], y:k % 3 === 2 ? 1.12 : 0.4, high:k % 3 === 2, s:0.6}));
      // 제한 시간: 가까운 별부터 도는 길이 ÷ 걷는 속도 × 1.7 + 여유 (별이 멀리 흩어져도 공평하게)
      let ci = S.st?.i ?? EXIT[0], cj = S.st?.j ?? EXIT[1], len = 0; const left = sp.slice();
      while(left.length){ let bk = 0, bd = 1e9; left.forEach((p, k) => { const d = Math.hypot(p[0] - ci, p[1] - cj); if(d < bd){ bd = d; bk = k; } }); len += bd; [ci, cj] = left.splice(bk, 1)[0]; }
      const sec = Math.max(35, Math.ceil((len / 2.35 * 1.7 + 12) / 5) * 5);
      G.total = G.items.length; G.until = now() + sec * 1000; refreshItems();
      toast("🌠 별똥별 줍기!", `${G.total}개 · 높은 건 점프 · ${sec}초`, 2200); yuSay("별이 떨어졌다! 다 주워야지 🌟");
    }
    hud.hidden = false; gameHud();
  }
  function gameHud(){
    if(!G){ freeHud(); return; }
    if(G.phase === "found" || G.phase === "end"){ hud.hidden = true; return; }
    hud.hidden = false;
    const left = G.until ? Math.max(0, Math.ceil((G.until - now()) / 1000)) : null, tm = left == null ? "" : `<i>${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}</i>`;
    let h = "";
    if(G.type === "ball") h = `⚽ ${G.n} / 3 ${tm}`;
    if(G.type === "hide") h = G.phase === "seek" ? `${G.hint || "🔎 찾는 중"} ${tm}` : "🙈 아빠 숨는 중";
    if(G.type === "swim") h = G.phase === "race" ? `🏊‍♀️ 끝까지 먼저! ${tm}` : "🏊‍♀️ 준비…";
    if(G.type === "tag") h = G.phase === "run" ? `🏃 아빠 잡기! ${tm}` : "🏃 준비…";
    if(G.type === "stars") h = `🌟 ${G.n} / ${G.total} ${tm}`;
    if(S.st?.boost > 0) h += ` <i>⚡${Math.ceil(S.st.boost / 1000)}</i>`;
    if(hud.innerHTML !== h) hud.innerHTML = h;
  }
  function freeHud(){
    let h = "";
    if(Q?.id === "cat" && curStep()?.find && S.floor === Q.catF) h = S.catHint || "";
    else if(S.st?.boost > 0) h = `⚡ 쌩쌩! <i>${Math.ceil(S.st.boost / 1000)}초</i>`;
    else if(S.near != null && S.near < 3.2) h = S.nearHigh && S.near < 1.2 ? "✨ 바로 위에 있어요! 점프 🦘" : "✨ 근처에 뭔가 반짝여요";
    hud.hidden = !h; if(h && hud.innerHTML !== h) hud.innerHTML = h;
  }
  function gameTick(st){
    advTick(st);
    if(!G){ gameHud(); return; } const e = E(), t = now();
    if(G.type === "ball" && st.ball && !G.cool){
      const b = st.ball, inL = b.i < GOAL.i0 + 0.32 && Math.abs(b.j - GOAL.gj) < GOAL.gw + 0.05, inR = b.i > GOAL.i1 - 0.32 && Math.abs(b.j - GOAL.gj) < GOAL.gw + 0.05;
      if(inL || inR){ G.n++; G.cool = true; yuSay(pick(["골~~~!! ⚽", "들어갔다!! 😆", "나 축구 천재인가? 😎"]));
        if(G.n >= 3){ toast("⚽ 3골 성공!", "", 1600); later(1400, () => { endGame(); advance(); }); }
        else { sfx("goal"); toast(`골! ⚽ ${G.n} / 3`); later(1300, () => { e.playSet({ball:BALL0}); G.cool = false; }); } }
      if(t > G.until){ G.until = 0; toast("시간 끝! 😢", "🔁 버튼으로 다시 해 봐요", 2400); yuSay("아깝다~ 다시 할래!"); endGame(); setup(); renderCard(); }
    }
    if(G?.type === "hide" && G.phase === "seek" && st.actors?.dad){
      const d = Math.hypot(st.actors.dad.i - st.i, st.actors.dad.j - st.j);
      G.hint = d < 2.6 ? "🔥🔥 뜨거워!" : d < 5 ? "🔥 따뜻해" : d < 9 ? "🙂 미지근해" : "🧊 차가워";
      if(d < 1.2){ G.phase = "found"; e.playActor("dad", {pose:"stand", h:Math.atan2(st.i - st.actors.dad.i, st.j - st.actors.dad.j), wave:1800}); yuSay("찾았다!! 🙈"); later(700, () => npcSay("@dad", "들켰다! 😆 우리 유나 눈 진짜 좋다"));
        toast("🙈 아빠 찾았다!"); later(2600, () => { endGame(); advance(); }); }
      else if(t > G.until){ G.phase = "found"; e.playActor("dad", {pose:"stand", wave:1800}); npcSay("@dad", "아빠 여기 있었지롱~ 😜"); toast("시간 끝!", "아빠 위치를 보여 줄게요", 2400);
        e.playSet({mark:{actor:"dad"}}); later(4000, () => { endGame(); setup(); renderCard(); toast("🔁 버튼으로 다시 해 봐요"); }); }
    }
    if(G?.type === "swim" && G.phase === "race"){
      const mom = st.actors?.mom;
      if(st.i > 28.05){ G.phase = "end"; e.playActor("mom", {to:null}); yuSay("내가 이겼다!! 🏆"); later(600, () => npcSay("@mom", "와~ 유나 진짜 빠르다! 👏")); toast("🏆 유나 승!");
        later(2600, () => { endGame(); advance(); }); }
      else if(mom && !mom.moving && mom.i > 28.2){ G.phase = "end"; npcSay("@mom", "엄마가 이겼다~ 한 판 더? 😆"); yuSay("다시 해! 다시! 😤"); toast("엄마 승! 😆", "🔁 버튼으로 다시 도전", 2400);
        later(2800, () => { endGame(); setup(); renderCard(); }); }
    }
    if(G?.type === "tag" && (G.phase === "run" || G.phase === "ready")){
      const a = st.actors?.dad;
      if(a){ const d = Math.hypot(a.i - st.i, a.j - st.j);
        if(G.phase === "run" && t > G.t1 + 700 && d < 0.62){ G.phase = "end"; e.playActor("dad", {to:null, h:Math.atan2(st.i - a.i, st.j - a.j), wave:1800}); yuSay("잡았다!! 🏃‍♀️"); later(600, () => npcSay("@dad", "헉헉… 우리 딸 진짜 빠르다 😵")); toast("🏃 아빠 잡았다!"); later(2600, () => { endGame(); advance(); }); }
        else if(G.phase === "run" && t > G.until){ G.phase = "end"; e.playActor("dad", {to:null, wave:1800}); npcSay("@dad", "아빠 승리~ 한 판 더? 😜"); yuSay("다시 해! 다시! 😤"); toast("시간 끝!", "🔁 버튼으로 다시 도전", 2400); later(2800, () => { endGame(); setup(); renderCard(); }); }
        else if(t > G.next || !a.moving){
          G.next = t + 380;
          const spd = 2.15 - 0.6 * Math.min(1, (t - (G.t1 || t)) / 50000);   // 아빠는 점점 지침
          if(d < 5.5){ let best = null, bs = -1e9;
            for(let k = 0; k < 16; k++){ const an = k * Math.PI / 8; for(const L of [1.3, 2.2]){ const ti = a.i + Math.sin(an) * L, tj = a.j + Math.cos(an) * L; if(!e.playClear(a.i, a.j, ti, tj, 0.22)) continue;
              const nd = Math.hypot(ti - st.i, tj - st.j), sc = nd + Math.random() * 0.7 - (nd < d ? 2.2 : 0); if(sc > bs){ bs = sc; best = [ti, tj]; } } }
            if(best) e.playActor("dad", {to:best, spd}); }
          else if(!a.moving && Math.random() < 0.08) npcSay("@dad", pick(["아빠 여기 있지롱~ 😜", "못 잡겠지? 😆", "유나야 이쪽이야~ 👋"]), 1800); } }
    }
    if(G?.type === "stars" && G.phase !== "end" && t > G.until){ G.phase = "end"; yuSay("아깝다~ 조금만 더 빨리! 😢"); toast(`시간 끝! 🌟 ${G.n}/${G.total}`, "🔁 버튼으로 다시 해 봐요", 2400); later(1200, () => { endGame(); setup(); renderCard(); }); }
    gameHud();
  }
  /* 모험: 보물 레이더 · 고양이 · ❗ 부탁 */
  function advTick(st){
    const e = E(); if(!e) return; const t = now();
    if((S.n || 0) % 6 === 0){ let bd = null, bh = false; if(!G || G.type !== "stars") S.spots.forEach((p, k) => { if(rec.tre[`${S.floor}:${k}`]) return; const d = Math.hypot(p[0] - st.i, p[1] - st.j); if(bd == null || d < bd){ bd = d; bh = !!TREASURE[S.floor][k]?.[2]; } }); S.near = bd; S.nearHigh = bh; }
    if(Q?.id === "cat"){ const sp = curStep();
      if(sp?.find && S.floor === Q.catF && Q.catAt){ const d = Math.hypot(Q.catAt[0] - st.i, Q.catAt[1] - st.j);
        S.catHint = d < 2.2 ? "🔥🔥 야옹! 바로 옆이에요" : d < 4.5 ? "🔥 야옹~ 소리가 커져요" : d < 8 ? "🙂 어디선가 야옹…" : "🧊 조용해요…";
        if(d < 0.85){ Q.cat = "follow"; Q.known = true; S.catPos = Q.catAt.slice(); setCarry("🐈"); yuSay("크레파스 찾았다!! 🐈"); toast("🐈 크레파스 찾았다!", "같이 1층 안내 데스크로 가요", 2200); advance(); } }
      if(Q?.cat === "follow" && S.catPos){ const bi = st.i - Math.sin(st.h) * 0.6, bj = st.j - Math.cos(st.h) * 0.6, dd = Math.hypot(bi - S.catPos[0], bj - S.catPos[1]);
        if(dd > 5){ S.catPos = [bi, bj]; } else if(dd > 0.08){ S.catPos[0] += (bi - S.catPos[0]) * 0.1; S.catPos[1] += (bj - S.catPos[1]) * 0.1; }
        e.playItem("cat", {at:S.catPos}); } }
    // 가까이 지나가면 먼저 인사 (들고 있는 것·고양이·젖은 머리·번개에 맞춰서)
    const nb = st.near;
    if((S.n || 0) % 20 === 0 && !G && nb && nb.d < 1.5 && t > talkAt + 1500 && !(REQ && nb.id === REQ.id) && !(S.greet[nb.id] > t) && Math.random() < 0.55){
      S.greet[nb.id] = t + 75000; const isDad = nb.id === "_dir" || nb.id === "@dad", isMom = /nora$/.test(nb.id) || nb.id === "@mom";
      const line = Q?.cat === "follow" ? pick(CAT_RE) : carry ? pick(CARRY_RE(carry)) : t < S.wetUntil ? pick(WET_RE) : st.boost > 0 ? pick(BOOST_RE)
        : isDad ? pick(["우리 딸~ 👋", "유나 왔어? 😆"]) : isMom ? pick(["유나야~ 💕", "우리 유나 왔네 🤗"]) : pick(GREET[S.floor] || GREET.main);
      npcSay(nb.id, line, 2600); e.playEmote?.(nb.id, isDad || isMom ? "💕" : "👋", 1500);
      if(Math.random() < 0.5) later0(1300, () => yuSay(pick(["안녕하세요! 😆", "헤헤 👋", "네~!"]), 1500)); }
    // ❗ 부탁: 그냥 돌아다닐 때 가끔 누가 부름
    if(REQ && t > REQ.until){ REQ = null; refreshItems(); }
    if(!Q && !G && !REQ && S.reqNext && t > S.reqNext){
      const ps = e.playPeople().filter(p => { const d = Math.hypot(p.i - st.i, p.j - st.j); return d > 2.5 && d < 13; });
      if(ps.length){ const p = pick(ps); REQ = {id:p.id, name:p.name, floor:S.floor, until:t + 90000}; refreshItems(); toast(`❗ ${p.name}님이 부탁이 있대요`, "머리 위 ❗ 보고 가서 말 걸기", 2400, true); S.reqNext = t + 80000 + Math.random() * 40000; }
      else S.reqNext = t + 15000; }
  }

  /* ---------- 말 걸기 ---------- */
  function talk(n){
    if(now() < talkAt) return; talkAt = now() + 1500;
    const st = curStep(), e = E();
    if(!rec.met[n.id]){ rec.met[n.id] = 1; save(); later0(2600, checkBadges); }
    if(REQ && !Q && !G && n.id === REQ.id){ const r = REQ, src = pick(SRC); REQ = null; yuSay("저 부르셨어요? 😊"); talkAt = now() + 3200;
      later0(1100, () => { npcSay(n.id, `유나야, ${src.ask}`, 3600);
        later0(1600, () => begin({id:"req", e:src.e, t:`${r.name}님 부탁: ${src.n}`, steps:[src.step, {f:r.floor, talk:[r.id], any:true, hint:`${r.name}님한테 갖다드리기`, yu:`부탁하신 ${src.n} 왔어요! ${src.e}`, re:pick(THANKS)}]})); }); return; }
    if(Q?.id === "cat" && st?.find && !Q.known && !G){ Q.known = true; yuSay("혹시 고양이 봤어요? 🐈"); talkAt = now() + 3000;
      later0(1100, () => { npcSay(n.id, `고양이? 아까 ${FL[Q.catF].name}에서 본 것 같아! 🐈`, 3400); toast("🐈 단서 찾았다!", `${ro(FL[Q.catF].name)} 가 봐요`, 2200); setup(); renderCard(); }); return; }
    const hit = st && st.talk && st.f === S.floor && !G && (st.talk === n.id || (Array.isArray(st.talk) && (st.talk.includes(n.id) || (st.any && !st.talk.some(x => e.playWhere(x))))));
    if(hit && st.make){ yuSay(st.yu); talkAt = now() + st.make.ms + 5200; S.busy = true; const q = Q;
      later0(1100, () => { if(Q !== q){ S.busy = false; return; } npcSay(n.id, st.make.wait, 2400); later0(800, () => makeIt(st, n.id, () => { if(Q !== q) return; npcSay(n.id, st.re, 3000); E()?.playEmote?.(n.id, st.got, 1100);
        later0(650, () => { if(Q !== q) return; receive(st.got); later0(1500, () => { if(Q === q && curStep() === st) advance(); }); }); })); }); return; }
    if(hit){ yuSay(st.yu); talkAt = now() + 3200; const gv = !st.got && carry && carry !== "🐈" ? carry : "";
      later0(1100, () => { npcSay(n.id, st.re, 3200); if(gv){ setCarry(""); sfx("pick"); e?.playEmote?.(n.id, gv, 1700); later0(700, () => e?.playEmote?.(n.id, "💕", 1500)); } else setCarry(st.got || ""); later0(1500, advance); }); return; }
    const isDad = n.id === "_dir" || n.id === "@dad", isMom = /nora$/.test(n.id) || n.id === "@mom";
    if(!isMom && Math.random() < 0.28){ const c = isDad ? FAN_DAD : pick(FAN); yuSay(c[0], 3000); talkAt = now() + 4400;
      later0(1300, () => { npcSay(n.id, c[1], 2800); e?.playEmote?.(isDad ? "yu" : n.id, isDad ? "💕" : pick(["😆", "👍", "✨"]), 1400); }); return; }
    if(!isDad && !isMom && Math.random() < 0.5){ const c = pick(CHATS[S.floor] || CHATS.main); yuSay(c[0]); talkAt = now() + 4300;
      later0(1100, () => { npcSay(n.id, c[1], 2800); e?.playEmote?.(n.id, pick(["😊", "✨", "😆"]), 1400); later0(1800, () => yuSay(c[2], 2200)); }); return; }
    const yl = isDad ? pick(DAD.yu) : isMom ? pick(MOM.yu) : pick(YU_HI);
    let rl = isDad ? pick(DAD.re) : isMom ? pick(MOM.re) : null;
    if(!rl){ const task = String(n.task || "").replace(/\s+/g, " ").trim(); rl = task && Math.random() < 0.6 ? (/중$/.test(task) ? task + "이야 😊" : task) : pick(RE_ANY); }
    yuSay(yl); later0(1100, () => { npcSay(n.id, rl, 3200); if(isDad || isMom) e?.playEmote?.("yu", "💕", 1500); else if(Math.random() < 0.35) e?.playEmote?.(n.id, pick(["😊", "🎵", "✨"]), 1400); });
  }
  const later0 = (ms, fn) => setTimeout(() => { if(live) fn(); }, ms);

  /* ---------- 엘리베이터 ---------- */
  function openElev(){
    panel.hidden = true;
    elevP.innerHTML = ""; Object.entries(FL).sort((a, b) => b[1].n - a[1].n).forEach(([f, v]) => { const b = document.createElement("button"); b.type = "button"; b.setAttribute("aria-current", f === S.floor);
      b.innerHTML = `<b>${v.n}F</b>`; b.append(v.name.replace(/^\d층 /, "")); b.onclick = () => { closeElev(); if(f !== S.floor) ride(f); }; elevP.append(b); });
    elevP.hidden = false;
  }
  function closeElev(){ elevP.hidden = true; }
  function openFit(){
    panel.hidden = true; fitP.innerHTML = ""; const cur = S.st?.fit || rec.fit || "base";
    FITS.forEach(([k, em, name], q) => { const b = document.createElement("button"); b.type = "button"; b.setAttribute("aria-current", k === cur);
      b.innerHTML = `<b></b>`; b.querySelector("b").textContent = em; b.append(name); b.title = `${q + 1}`; b.onclick = () => changeFit(k); fitP.append(b); });
    fitP.hidden = false;
  }
  function changeFit(k){
    const e = E(); fitP.hidden = true; if(!e) return;
    if(k === (S.st?.fit || "base")){ yuSay("이미 입고 있어요 😆", 1400); return; }
    e.playSet({cloak:true, freeze:true}); sfx("blip"); toast("👗 갈아입는 중…", "", 1000);
    later0(1100, () => { const f = FITS.find(x => x[0] === k); e.playOutfit?.(k); e.playSet({cloak:false, freeze:false, wave:1500}); sfx("star"); e.playEmote?.("yu", "✨", 1400); yuSay(f[3], 2200);
      rec.fit = k; rec.fits = rec.fits || {}; rec.fits[k] = 1; save(); checkBadges(); });
  }
  function ride(f){ sfx("ding");
    endGame(); pendingFloor = f; fade.textContent = `🛗 ${FL[f].name}`; fade.classList.add("on");
    E()?.playSet({spawn:EXIT, freeze:true}); yuSay("올라간다~ 🛗");
    setTimeout(() => { if(live) api.goFloor(f); }, 380);
    setTimeout(() => { if(live && pendingFloor === f){ pendingFloor = null; fade.classList.remove("on"); E()?.playSet({freeze:false}); } }, 9000);
  }

  /* ---------- 엔진 콜백 ---------- */
  const cb = {
    onFloor(fid){
      S.floor = fid; S.st = null; REQ = null; S.near = null; S.reqNext = now() + 30000;
      if(!rec.vis[fid]){ rec.vis[fid] = 1; save(); later0(1500, checkBadges); }
      E()?.playSet({water:fid === "roof" ? [POOL] : []}); setCarry(carry); spotsFor(fid); boltFor();
      if(Q?.cat === "follow") S.catPos = [EXIT[0] + 0.4, EXIT[1] + 0.5];
      if(pendingFloor && fid === pendingFloor){ pendingFloor = null; setTimeout(() => { if(live){ fade.classList.remove("on"); } }, 250); }
      else if(!pendingFloor) fade.classList.remove("on");
      setup(); renderCard();
      const st = curStep(); if(st?.game && st.f === fid && !G) startGame(st.game);
    },
    onTick(st){
      S.st = st; charge(st); if(st.floor !== S.floor) return;
      const sp = curStep();
      // 도착하기 단계
      if(sp && sp.go && sp.f === st.floor && !G && !S.busy && Math.hypot(st.i - sp.go[0], st.j - sp.go[1]) < sp.r){ if(sp.yu) yuSay(sp.yu);
        if(sp.make){ const q = Q; makeIt(sp, null, () => { if(Q !== q) return; receive(sp.got); if(sp.make.done) yuSay(sp.make.done, 2400); advance(); }); }
        else { if(sp.got) receive(sp.got); else setCarry(""); advance(); } }
      // 오른쪽 버튼
      const nearElev = Math.hypot(st.i - ELEV[0], st.j - ELEV[1]) < 1.45 && !G; S.atElev = nearElev;
      const n = !G || G.type === "ball" ? st.near : null;
      const retry = sp && sp.game && sp.f === st.floor && !G;
      const booth = !G && nearBooth(st);
      let mode = retry ? "retry" : nearElev ? "elev" : booth ? "dress" : n ? "talk" : "";
      if(mode !== act.dataset.m || (mode === "talk" && act.dataset.id !== n.id)){
        act.dataset.m = mode; act.dataset.id = n?.id || ""; act.hidden = !mode;
        if(mode === "elev"){ act.querySelector("span").textContent = "🛗"; act.querySelector("b").textContent = matchMedia("(hover:hover) and (pointer:fine)").matches ? "숫자 키로 층" : "엘리베이터"; }
        if(mode === "talk"){ act.querySelector("span").textContent = "💬"; act.querySelector("b").textContent = n.name; }
        if(mode === "retry"){ act.querySelector("span").textContent = "🔁"; act.querySelector("b").textContent = "다시 하기"; }
        if(mode === "dress"){ act.querySelector("span").textContent = "👗"; act.querySelector("b").textContent = "옷 갈아입기"; }
        if(mode !== "elev") closeElev(); if(mode !== "dress") fitP.hidden = true; }
      act.onclick = () => { if(mode === "retry") startGame(sp.game); else if(mode === "elev") elevP.hidden ? openElev() : closeElev(); else if(mode === "dress") fitP.hidden ? openFit() : (fitP.hidden = true); else if(mode === "talk") talk(n); };
      // 목표 화살표 (화면 밖일 때만)
      const m = st.mark, W = st.w, H = st.hgt, pad = 34;
      if(m && (!m.front || m.x < 6 || m.x > W - 6 || m.y < 6 || m.y > H - 6)){
        const y0 = 112, y1 = H - 44, cy = (y0 + y1) / 2, hy = Math.max(20, (y1 - y0) / 2);
        let dx = m.x - W / 2, dy = m.y - cy; if(!m.front){ dx = -dx; dy = -dy; if(Math.abs(dy) < 1 && Math.abs(dx) < 1) dy = 1; }
        const k = Math.min((W / 2 - pad) / Math.max(1e-3, Math.abs(dx)), hy / Math.max(1e-3, Math.abs(dy)));
        arrow.hidden = false; arrow.style.transform = `translate(${W / 2 + dx * k}px,${cy + dy * k}px) rotate(${Math.atan2(dy, dx)}rad)`;
      } else arrow.hidden = true;
      S.n = (S.n || 0) + 1; if(S.n % 6 === 0) renderCard(m?.d);
      gameTick(st);
      jumpB.hidden = !!st.swim;
      { const jm = st.sit ? "stand" : !G && nearSeat(st) ? "sit" : "jump";
        if(jm !== jumpB.dataset.m){ jumpB.dataset.m = jm; jumpB.querySelector("span").innerHTML = jm === "jump" ? JUMP_SVG : jm === "sit" ? "🪑" : "🧍‍♀️";
          jumpB.querySelector("b").textContent = jm === "jump" ? "점프" : jm === "sit" ? "앉기" : "일어나기"; jumpB.setAttribute("aria-label", jumpB.querySelector("b").textContent); } }
      if(st.moving && !helpT){ helpT = setTimeout(() => { help.style.opacity = 0; }, 5000); }
    },
    onPick,
    onBump(id){ if(G && G.type !== "ball") return; if(HOLD[carry]?.spill){ spill(); later0(800, () => npcSay(id, pick(["어이쿠 조심! 안 쏟았지? 😅", "천천히~ 뜨거워! ☕", "괜찮아? 흘릴 뻔했네 😮"]), 2200)); return; } sfx("bump"); const isDad = id === "@dad" || id === "_dir", isMom = id === "@mom" || /nora$/.test(id);
      yuSay(pick(BUMP_YU), 1500); E()?.playEmote?.(id, "💫", 1200); later0(700, () => npcSay(id, pick(isDad ? BUMP_DAD : isMom ? BUMP_MOM : BUMP_RE), 2200)); },
    onSplash(kind){ sfx("splash"); if(kind === "in" && S.st && S.st.fit !== "swim" && !S.clothSwim){ S.clothSwim = true; yuSay("앗 옷 입고 들어왔다 😆 탈의실에서 수영복 입을걸!", 2600); }
      else if(kind === "in") yuSay(pick(SPLASH_IN), 1500); else { S.wetUntil = now() + 45000; later0(350, () => yuSay(pick(SPLASH_OUT), 1600)); } },
    onIdle(k){ if(G || now() < talkAt || Math.random() > 0.55) return; yuSay(pick(IDLE_YU[k]), 1700); if(k === "dance") E()?.playEmote?.("yu", "🎵", 1600); },
    onTap(id){ const st = S.st; if(!st) return; const n = st.near; if(n && n.id === id) talk(n); else yuSay(pick(["저기 가 볼까? 👀", "가까이 가서 말 걸어야지!"]), 1600); },
  };

  /* ---------- 조종 ---------- */
  const keys = new Set(); let jx = 0, jy = 0, jOn = false;
  const push = () => { let x = jx, y = jy; if(!jOn){ x = (keys.has("r") ? 1 : 0) - (keys.has("l") ? 1 : 0); y = (keys.has("u") ? 1 : 0) - (keys.has("d") ? 1 : 0); const m = Math.hypot(x, y); if(m > 1){ x /= m; y /= m; } } E()?.playInput(x, y); };
  const KM = {KeyW:"u", ArrowUp:"u", KeyS:"d", ArrowDown:"d", KeyA:"l", ArrowLeft:"l", KeyD:"r", ArrowRight:"r"};
  const kd = e => {
    if(e.target.closest && e.target.closest("input,textarea")) return;
    auInit();
    if(e.key === "Shift"){ if(!e.repeat) doRun(); return; }
    if(KM[e.code]){ keys.add(KM[e.code]); push(); e.preventDefault(); e.stopPropagation(); return; }
    if(e.code === "Space"){ doJump(); e.preventDefault(); return; }
    const dn = /^(?:Digit|Numpad)([1-9])$/.exec(e.code);   // 엘리베이터 앞이면 숫자 키로 층 고르기 (2026-11-23 감독님 "키보드로 엘베 층을 고를수없네")
    if(dn && !fitP.hidden && +dn[1] <= FITS.length){ changeFit(FITS[+dn[1] - 1][0]); e.preventDefault(); e.stopPropagation(); return; }
    if(dn && (S.atElev || !elevP.hidden)){ const f = Object.keys(FL).find(k => FL[k].n === +dn[1]); if(f){ closeElev(); if(f !== S.floor) ride(f); else yuSay("여기가 " + FL[f].n + "층이야! 😆", 1400); e.preventDefault(); e.stopPropagation(); return; } }
    if(e.code === "KeyE" || e.code === "Enter"){ if(!act.hidden){ act.click(); e.preventDefault(); } }
    if(e.key === "Escape"){ if(!panel.hidden) panel.hidden = true; else if(!elevP.hidden) closeElev(); else stop(); }
  };
  const ku = e => { if(KM[e.code]){ keys.delete(KM[e.code]); push(); } };
  addEventListener("keydown", kd, true); addEventListener("keyup", ku, true);
  const blur = () => { keys.clear(); jOn = false; jx = jy = 0; knob.style.transform = ""; push(); }; addEventListener("blur", blur);
  let jid = null;
  joy.addEventListener("pointerdown", e => { jid = e.pointerId; jOn = true; joy.classList.add("on"); try { joy.setPointerCapture(e.pointerId); } catch(_){} jmove(e); e.preventDefault(); e.stopPropagation(); });
  const jmove = e => { if(e.pointerId !== jid) return; const r = joy.getBoundingClientRect(), R0 = r.width / 2 - 14; let dx = e.clientX - r.left - r.width / 2, dy = e.clientY - r.top - r.height / 2; const d = Math.hypot(dx, dy); if(d > R0){ dx *= R0 / d; dy *= R0 / d; }
    knob.style.transform = `translate(${dx}px,${dy}px)`; jx = dx / R0; jy = -dy / R0; if(Math.hypot(jx, jy) < 0.12){ jx = jy = 0; } push(); };
  joy.addEventListener("pointermove", jmove);
  const jend = e => { if(e.pointerId !== jid) return; jid = null; jOn = false; jx = jy = 0; joy.classList.remove("on"); knob.style.transform = ""; push(); };
  joy.addEventListener("pointerup", jend); joy.addEventListener("pointercancel", jend);
  $(".yg-x").onclick = () => stop();
  function doJump(){ const e = E(); if(!e) return;
    if(S.st?.sit){ e.playSit?.(null); sfx("blip"); return; }
    { const s = !G && nearSeat(S.st);
      if(s && s.k !== "church" && (e.playPeople?.() || []).some(q => Math.hypot(q.i - s.i, q.j - s.j) < 0.35)){ yuSay("앗 누가 앉아 있네 😅", 1400); return; }
      if(s && e.playSit?.(s)){ sfx("blip"); const L = SIT_YU[s.k];
        if(s.k === "church"){ rec.pray = (rec.pray || 0) + 1; save(); checkBadges(); later0(700, () => { yuSay(pick(L), 3200); e.playEmote?.("yu", "🙏", 1800); }); }
        else if(L && Math.random() < 0.7) later0(600, () => yuSay(pick(L), 2200));
        return; } }
    if(HOLD[carry]?.spill && !S.st?.swim){ spill(); return; }   // 음료 들고는 점프 대신 찰랑
    if(S.st?.swim){ e.playSplash?.(); sfx("splash"); yuSay(pick(["첨벙! 💦", "물보라 공격! 🌊", "푸하~ 🐬"]), 1200); return; }
    if(e.playJump()){ sfx("jump"); rec.jumps++; if(rec.jumps % 10 === 0){ save(); checkBadges(); } } }
  jumpB.addEventListener("pointerdown", ev => { ev.preventDefault(); ev.stopPropagation(); doJump(); });
  /* 달리기 부스트 (2026-11-23 감독님 "부스트 모드 필요. 달리는거. 어느정도 기모아서"): 걸으면 9초, 서 있으면 22초에 기가 다 참 → 누르면 4.5초 쌩쌩 */
  S.charge = 0.35;
  function charge(st){
    const tn = now(), dt = Math.min(0.1, (tn - (S.lastT || tn)) / 1000); S.lastT = tn;
    if(!(st.boost > 0) && !st.swim){ const was = S.charge; S.charge = Math.min(1, S.charge + dt / (st.moving ? 9 : 22)); if(was < 1 && S.charge >= 1){ sfx("ready"); runB.classList.add("full"); } }
    runB.style.setProperty("--p", Math.min(1, st.boost > 0 ? st.boost / 4500 : S.charge).toFixed(3)); runB.classList.toggle("go", st.boost > 0);
  }
  function doRun(){
    const e = E(); if(!e || S.st?.boost > 0) return;
    if(S.st?.swim){ yuSay("물속에선 못 달려~ 🏊‍♀️", 1300); return; }
    if(HOLD[carry]?.spill){ yuSay(pick([`뛰면 ${carry} 쏟아져요~ 천천히!`, "달리면 흘려요 😅 조심조심"]), 1600); return; }
    if(S.charge < 1){ toast(`기 모으는 중… ${Math.round(S.charge * 100)}% 🏃‍♀️`, "걸어 다니면 더 빨리 차요", 1200); return; }
    S.charge = 0; runB.classList.remove("full"); e.playSet({boost:4500}); sfx("boost"); yuSay(pick(["달려라~! 🏃‍♀️💨", "부스트 온! ⚡", "슝~ 💨"]), 1400);
  }
  runB.addEventListener("pointerdown", ev => { ev.preventDefault(); ev.stopPropagation(); doRun(); });
  const auKick = () => auInit(), auVis = () => { if(AU.ctx) document.hidden ? AU.ctx.suspend() : AU.ctx.resume(); };
  addEventListener("pointerdown", auKick, true); document.addEventListener("visibilitychange", auVis); auInit();

  /* ---------- 시작 · 끝 ---------- */
  let waitT = 0;
  function boot(){
    const e = E();
    if(!live) return;
    if(!e || e.floorId?.() !== api.floor()){ waitT = setTimeout(boot, 150); return; }
    const y = api.yuna?.(), f = api.floor();
    const spawn = f === "main" ? [23.95, 4.6, 0] : y && y.floor === f && !y.hidden ? [y.i, y.j, 0] : EXIT;
    e.playStart(cb, spawn); e.playOutfit?.(rec.fit || "base");
    setTimeout(() => { if(live && !Q && panel.hidden && !rec.stars) openList("q"); }, 700);
    setTimeout(() => { if(live) checkBadges(); }, 2500);
  }
  boot();
  function stop(){
    if(!live) return; live = false; clearTimeout(waitT); endGame(); save();
    removeEventListener("keydown", kd, true); removeEventListener("keyup", ku, true); removeEventListener("blur", blur);
    removeEventListener("pointerdown", auKick, true); document.removeEventListener("visibilitychange", auVis); auStop();
    try { E()?.playInput(0, 0); E()?.playStop(); } catch(e){ console.warn(e); }
    root.remove(); api.exit?.();
  }
  return {stop};
}
