/* 유나 모드 (2026-11-23 감독님 "유나 앞세워서 GTA처럼 돌아다니게. 돌아다니면서 이야기하고 다니면 재밌겠다. 할 게 많으면 좋겠네")
   - 조종: 폰은 왼쪽 아래 조이스틱, 컴퓨터는 WASD·방향키. 화면을 끌면 카메라가 돌아감, 핀치·휠로 멀고 가깝게
   - 오른쪽 아래 버튼: 사람 옆이면 말 걸기, 엘리베이터 앞이면 층 이동
   - 할 일(별 스티커) + 미니게임: 옥상 골 넣기 · 아빠랑 숨바꼭질 · 엄마랑 수영 시합 · 아빠랑 술래잡기 · 옥상 별똥별 줍기
   - 모험 (2026-11-23 감독님 "재미난 모험요소 많이"): 층마다 숨은 보물 6개(높은 건 점프), ⚡ 번개 사탕(빨라짐), 길 잃은 고양이 찾기,
     사람들 머리 위 💬 부름(선물·골라 줘·사진·하이파이브), 의자마다 앉아서 하는 놀이, 배지
   - 엔진(tower3d_floor.js)의 play* 함수만 씀. 별 기록은 이 기기에만 (localStorage) */

import { HOME } from "./floor3d_home.js";   // 옆 건물 유나네 집 4층 (2026-11-23 감독님 "옆건물에 집도 하나 만들어서 왔다갔다")
const FL = {lobby:{n:1, name:"1층 로비·카페"}, main:{n:2, name:"2층 업무층"}, wf:{n:3, name:"3층 복지층"}, s4:{n:4, name:"4층 스튜디오"}, roof:{n:5, name:"5층 옥상"}};
const ELEV = [13.45, 17.1], EXIT = [14.5, 17.1, Math.PI / 2];
const POOL = {rect:[20.6, 17.7, 29, 20], walk:[20.3, 17.4, 29, 20], surf:0.39};
const GOAL = {i0:1.2, i1:12.8, gj:4.8, gw:0.9}, BALL0 = [7.0, 4.8];
const FARM_PDS = ["plan", "edit", "short", "deal"];
const COL = new Set(["stars", "bubble"]);   // 줍는 게임 (별똥별 · 비눗방울)

/* 이야기 모드 (2026-11-23 감독님 "미션 다 달성했을때 뭐가 나타나고 다음으로 이어지고 스토리가 있어야", "고기도 같이 먹을수있고~ 다양한 액티비티 예상치 못한것들~")
   엄마 아빠 몰래 깜짝 파티: 장마다 제목 카드. ch = 장 시작(여기서부터 이어 하기), sneak = 엄마 근처 가면 들킴(🤫 비밀 하트 -1) */
const PARTY = {id:"party", e:"🎉", t:"엄마 아빠 몰래 깜짝 파티", story:true, steps:[
  {f:"lobby", talk:["l_bar"], ch:["1장", "케이크 몰래 사 오기"], lb:"케이크 주문", hint:"1층 카페에서 케이크 주문 🤫", yu:"언니… 비밀인데요, 케이크 하나만요 🤫🎂", re:"짜잔~ 엄마 아빠 깜짝 놀라겠다 😉", got:"🎂",
    make:{ms:4200, wait:"쉿~ 엄마 아빠한텐 비밀! 😉", txt:"케이크 꾸미는 중", fx:["🍓", "🎂", "🕯️", "✨"]}},
  {f:"roof", go:[24.4, 4.75], r:1.3, lb:"옥상에 숨기기", hint:"옥상 회식 테이블에 케이크 숨기기", yu:"여기 숨겨 두면 아무도 모르겠지? 🤫"},
  {f:"roof", game:"freeze", lb:"얼음!", hint:"아빠가 올라왔다! 움직이면 들켜요"},
  {f:"s4", goAuto:1, r:1.2, ch:["2장", "풍선이랑 꽃 구하기"], sneak:true, lb:"풍선 챙기기", hint:"4층 소품 풍선 몰래 챙기기 · 엄마 근처 조심!", yu:"풍선이랑 꽃 찾았다! 🎈💐", got:"🎈",
    make:{ms:2600, txt:"풍선 부는 중", fx:["💨", "🎈", "💐"], done:"엄마한테 안 들키게 살금살금… 🤫"}},
  {f:"roof", go:[23.0, 4.75], r:1.3, sneak:true, lb:"파티 장식", hint:"옥상 회식 테이블 꾸미기", yu:"풍선 달고~ 꽃 놓고~ 🎈💐",
    make:{ms:3200, txt:"파티 장식 중", fx:["🎈", "💐", "🎀", "✨"], done:"우와 예쁘다!! 🥰"}},
  {f:"wf", go:[5.6, 3.8], r:1.5, ch:["3장", "고기 구해 오기"], lb:"고기 받기", hint:"3층 식당에서 고기 받기", yu:"이모! 오늘 비밀 파티해요 🤫 고기 주세요!", got:"🥩",
    make:{ms:2600, txt:"고기 포장 중", fx:["🥩", "🧊", "🛍️"], done:"고기 받았다! 이제 옥상으로…"}},
  {f:"wf", game:"catmeat", lb:"고양이 잡기", hint:"고기 물고 도망간 크레파스 잡기!"},
  {f:"main", go:[21.3, 16.0], r:1.4, ch:["4장", "축하 영상 만들기"], lb:"색보정실", hint:"2층 색보정실에서 몰래 편집", yu:"아빠 편집실 몰래 빌려야지 🤫🎞️"},
  {f:"main", game:"edit", lb:"영상 편집", hint:"장면·음악·자막 고르기"},
  {f:"roof", go:[20.9, 14.15], r:1.3, ch:["5장", "옥상 파티"], lb:"그릴 앞으로", hint:"옥상 그릴에서 고기 굽기", yu:"이제 고기 굽자! 🔥"},
  {f:"roof", game:"grill", lb:"고기 굽기", hint:"딱 좋을 때 뒤집기!"},
  {f:"roof", game:"ending", lb:"서프라이즈!", hint:"엄마 아빠 부르기"}]};
/* 친구 놀러 온 날 (2026-11-23 감독님 "친구가 놀러오는 애피소드도 좋을듯"): 지유가 유나 뒤를 졸졸 따라다님 */
const FRIEND = {id:"friend", e:"👭", t:"친구 지유 놀러 온 날", steps:[
  {f:"lobby", talk:"@fr", lb:"지유 마중", hint:"1층 로비 입구에 지유가 왔어요", yu:"지유야~! 왔어? 😆", re:"유나야! 너네 타워 구경시켜 줘 👀"},
  {f:"wf", go:[5.6, 3.8], r:1.5, lb:"간식 같이", hint:"지유랑 3층 식당에서 간식", yu:"여기 간식 진짜 맛있어! 🍪",
    make:{ms:3000, txt:"지유랑 간식 나눠 먹는 중", fx:["🍪", "🧃", "😋", "🍪"], done:"배부르다~ 이제 엄마한테 가자! 🌈"}},
  {f:"s4", talk:"@mom", lb:"엄마한테 소개", hint:"4층 엄마한테 지유 소개하기", yu:"엄마! 내 친구 지유야 😆", re:"지유 안녕~ 구름 앞에서 둘이 사진 찍어 줄게 📸", photo:true},
  {f:"roof", go:[22.4, 16.95], r:1.2, lb:"수영장", hint:"5층 옥상 수영장으로", yu:"지유야 수영 시합 하자! 🏊‍♀️"},
  {f:"roof", game:"swim", lb:"지유랑 시합", hint:"끝까지 먼저 가기"},
  {f:"lobby", talk:"@fr", lb:"배웅", hint:"1층에서 지유 배웅하기", yu:"오늘 재밌었지? 또 놀러 와! 👋", re:"응! 다음엔 우리 집에 놀러 와 💕"}]};
const FR_TALK = {lobby:["카페 냄새 좋다 ☕", "여기가 너네 아빠 회사야? 😲"], main:["우와 컴퓨터 엄청 많다 💻", "너네 아빠 진짜 감독님이야? 멋지다 🎬"], wf:["여기 게임도 있어? 대박 🎮", "간식 또 먹고 싶다 🍪"],
  s4:["핑크 구름이다!! ☁️", "여기서 드라마 찍는 거야? 😍"], roof:["옥상에 수영장이 있어?! 😲", "바람 시원하다~ 🍃"]};
const EDIT_Q = [["첫 장면은 뭐로 할까?", [["💒", "결혼식 사진"], ["👶", "내 아기 때 영상"]]], ["음악은?", [["🎹", "잔잔한 피아노"], ["🎺", "신나는 빵빠레"]]], ["마지막 자막은?", [["💕", "엄마 아빠 사랑해요"], ["😎", "감독 유나 올림"]]]];
const QUESTS = [PARTY, FRIEND,
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
const SEED = {lobby:11, main:23, wf:37, s4:41, roof:59}, TOTAL = 90;
const AVOID = [[ELEV[0], ELEV[1], 1.9], [EXIT[0] + 0.6, EXIT[1], 1.3]];

/* 💬 부름 (2026-11-23 감독님 "누가 건물주 딸한테 심부름을 시키냐"): 머리 위 💬 뜬 사람한테 가면 선물을 주거나, 골라 달라거나, 같이 사진·하이파이브 */
const GIFTS = [["🍬", "젤리"], ["🧸", "곰돌이 키링"], ["🎀", "리본 핀"], ["⭐", "반짝 스티커"], ["🖍️", "크레파스"], ["🍭", "막대사탕"], ["🌸", "꽃 머리띠"], ["🍪", "쿠키"]];
const JUDGE = [
  {q:"썸네일 뭐가 나아? 감독님 딸 눈이 정확하잖아 😎", o:[["🔴", "빨간 거"], ["🔵", "파란 거"]]},
  {q:"영상 제목 골라 줘! 웃긴 거 vs 감동", o:[["😂", "웃긴 제목"], ["🥹", "감동 제목"]]},
  {q:"마지막 장면 어떤 게 좋아?", o:[["🌅", "노을 장면"], ["🌃", "밤 장면"]]},
  {q:"오늘 점심 뭐 먹을까? 유나가 정해 줘", o:[["🍜", "짜장면"], ["🍕", "피자"]]},
  {q:"배경 음악 골라 줄래?", o:[["🎹", "잔잔한 피아노"], ["🥁", "신나는 드럼"]]},
  {q:"포스터 색 뭐로 할까?", o:[["💗", "분홍"], ["💛", "노랑"]]}];
const JUDGE_RE = ["역시! 그걸로 간다 👍", "헐 감독님이랑 똑같은 거 골랐어 😲", "유나 감각 최고다 ✨", "결정 완료! 고마워 유나 💕"];
const CALL_HI = {gift:"유나야~ 이리 와 봐! 줄 게 있어 🎁", judge:"유나야! 이거 하나만 골라 줘 🤔", photo:"유나야 우리 같이 사진 찍자! 📸", five:"유나다~ 하이파이브! 🙌"};
/* 손에 든 것 (2026-11-23 감독님 "커피 심부름은 흐를까바 들고 약간 천천히 갈수밖에 없고"): slow = 걷는 속도 배율, spill = 점프·달리기·부딪히면 찰랑 */
const HOLD = {"🎂":{slow:0.6}, "🎈":{slow:0.92}, "📼":{slow:0.95}, "🥩":{slow:0.85}, "☕":{slow:0.55, spill:1, col:0x6B4226}, "🍫":{slow:0.6, spill:1, col:0x7A4A2A}, "🥤":{slow:0.6, spill:1, col:0xE0A040}, "🍪":{slow:0.85}, "🍙":{slow:0.85}, "🥛":{slow:0.8}, "🍬":{slow:0.95}, "🍦":{slow:0.75}, "🧸":{slow:0.9}, "🐰":{slow:0.9}, "🦄":{slow:0.9}, "🐻":{slow:0.9}, "🐥":{slow:0.9}};
const SPILL_YU = ["앗 흘릴 뻔! 😱", "조심조심… 쏟아질라 ☕", "어어어! 휴~ 안 쏟았다 😮‍💨"];

const cnt = o => Object.keys(o || {}).length;
/* 앉기 · 옷 갈아입기 (2026-11-23 감독님 "앉을수있게도 해줘. 의자에~ 예배를 드릴수가업네" / "탈의실에서 옷 예쁘게 갈아입혀 지면 재밌겠네 수영장에도 탈의실에서 수영복")
   의자: a~b 선분(장의자·소파) 또는 a 한 점. h = 앉아서 보는 쪽, H = 앉는 면 높이(바닥에서), k = 종류(대사), f = 앞에서만 (줄지어 놓인 장의자·극장 좌석은 뒷줄 등받이 너머로 앉지 않게) */
const hz = px => px / 31.1, PI = Math.PI;
const SEATS = {
  wf:[...[4.2, 5.3, 6.4, 7.5, 8.6, 9.7].flatMap(i => [[9.7, 13.9], [15.1, 19.3]].map(([a, b]) => ({a:[i + 0.2, a + 0.3], b:[i + 0.2, b - 0.3], h:-PI / 2, H:hz(11), k:"church", f:1}))),
    ...[3.0, 4.3, 5.6].flatMap(sj => [12.2, 12.9, 13.6, 14.3, 16.5, 17.2, 17.9, 18.6].map(si => ({a:[si, sj - 0.04], h:PI, H:hz(6.5), k:"cinema", f:1}))),
    {a:[20.95, 3.58], b:[23.25, 3.58], h:PI, H:hz(13), k:"sofa"}, {a:[22.9, 6.0], h:PI / 2, H:0.3, k:"bag"}],
  s4:[{a:[19.3, 8.17], h:PI, H:hz(16), k:"director"}, {a:[27.55, 8.27], h:PI, H:hz(16), k:"director"}],
  main:[{a:[8.4, 5.6], h:PI, H:0.37, k:"meet"}, {a:[9.4, 5.6], h:PI, H:0.37, k:"meet"}, {a:[1.7, 18.1], h:PI / 2, H:0.33, k:"meet"}, {a:[3.7, 18.1], h:-PI / 2, H:0.33, k:"meet"},
    {a:[27.3, 6.0], h:0, H:hz(10.5), k:"massage", sway:0.05}, {a:[26.25, 6.2], h:0, H:0.26, k:"bag"}],
  lobby:[[22.3, 4.4], [25.0, 5.1], [27.6, 3.6], ...[22.3, 25.0, 27.6].flatMap(ti => [[ti, 9.5], [ti, 12.8]]), [30.4, 10.8], [33.2, 10.8], [31.0, 17.2], [33.8, 17.2]]
    .flatMap(([ti, tj]) => [{a:[ti, tj - 0.55], h:0, H:hz(13.5), k:"cafe"}, {a:[ti, tj + 0.55], h:PI, H:hz(13.5), k:"cafe"}]),
  roof:[...[[21.5, 5.15, 0], [23.25, 6.85, -PI / 2], [21.5, 8.55, PI], [19.75, 6.85, PI / 2]].map(([i, j, h]) => ({a:[i, j], h, H:hz(7.6), k:"camp"})),
    {a:[25.35, 15.45], h:PI, H:hz(14), k:"pocha"}, {a:[26.45, 15.45], h:PI, H:hz(14), k:"pocha"},
    {a:[31.4, 9.0], b:[32.4, 9.0], h:0, H:hz(9.6), k:"swing", swing:0.3}, {a:[30.9, 2.3], b:[32.1, 2.3], h:0, H:hz(16), k:"hammock", sway:0.45}, {a:[33.5, 12.85], h:PI * 0.75, H:0.3, k:"bag"}]};
const SIT_YU = {church:["하나님 감사합니다 🙏", "우리 가족 건강하게 지켜 주세요 🙏", "아빠 작품 대박 나게 해 주세요 🙏", "행복한 회사 되게 해 주세요 🙏"],
  cinema:["상영 언제 시작해요? 🍿", "아빠 작품 틀어 주세요! 🎬", "팝콘 먹고 싶다 🍿"], sofa:["푹신푹신~ ☁️", "TV 보자! 📺"],
  cafe:["딸기 우유 주세요~ 🍓", "여기 케이크 맛있대요 🍰", "엄마랑 데이트하고 싶다 💕"], meet:["회의 시작할게요! 😎", "제 의견은요… 간식 시간! 🍪"], camp:["불멍 최고 🔥", "마시멜로 구워 먹고 싶다 🍡"],
  pocha:["치킨 냄새 최고 🍗", "사이다 주세요! 🥤", "바삭바삭~ 😋"], swing:["더 높이~! 🎶", "하늘까지 가자 ☁️"], hammock:["흔들흔들~ 🍃", "해먹 최고야 😌"],
  bag:["말랑말랑~ 💛", "빈백에 파묻혔다 😆"], massage:["위이잉~ 간지러워 😆", "으아아 시원하다 💆"],
  director:["레디~ 액션! 🎬", "컷! 오케이~ 👌", "한 번만 더 갈게요! 📣"]};
/* 앉아서 하는 놀이 (2026-11-23 감독님 "다양한 의자에 앉으면 앉아서 뭘 하면 좋겠고"): fx = 머리 위로 번갈아 뜨는 것, mid = [몇 ms 뒤, 유나 말, 알림], after = mid 뒤 fx, npc = 앉으면 말 거는 사람 */
const SIT_DO = {
  church:{fx:["🙏", "✨", "🕊️"], first:"🙏 예배드렸다"},
  cinema:{fx:["🍿", "😆", "😲", "🍿", "🥹"], first:"🍿 아빠 작품 봤다", mid:[4000, "아빠 작품 상영 시작! 😍", "🎬 상영 시작!"]},
  sofa:{fx:["📺", "😆", "📺"], first:"📺 TV 봤다", mid:[9000, "졸려… 😴", "💤 소파에서 낮잠 쿨쿨"], after:["💤", "💤", "😴"]},
  cafe:{fx:["🥤", "😋", "🍰", "🥤"], first:"🥤 카페에서 한잔"},
  meet:{fx:["📝", "🤔", "💡", "📝"], first:"💡 회의 참석", mid:[6000, "아이디어 떠올랐다!! 제목은 '유나의 하루' 💡", "💡 기획 회의 중"]},
  camp:{fx:["🔥", "🍡", "😋", "🔥"], first:"🍡 마시멜로 구웠다", mid:[6000, "마시멜로 노릇노릇~ 앗 뜨거! 🍡", "🍡 마시멜로 굽는 중"]},
  swing:{fx:["🎶", "☁️", "😆"], first:"🎶 그네 탔다"}, bag:{fx:["💛", "😆"], first:"💛 빈백에 풍덩"},
  hammock:{fx:["🍃", "😌"], first:"🍃 해먹에서 쉬기", mid:[8000, "스르르… 😴", "💤 해먹에서 낮잠"], after:["💤", "💤", "😴"]},
  massage:{fx:["💆", "〰️", "😆"], first:"💆 안마의자 체험", mid:[5000, "으아아 강도 MAX 😵", "💆 안마 강도 MAX"]},
  pocha:{fx:["🍗", "😋", "🥤", "🍗"], first:"🍗 포차에서 치킨", npc:["r_ck", "치킨 나왔습니다~ 🍗 맥주는 어른만! 유나는 사이다 🥤"]},
  director:{fx:["🎬", "📣", "👌"], first:"🎬 감독 의자에 앉기", mid:[4000, "레디~ 액션!! 🎬", "🎬 유나 감독 촬영 중"]}};
function nearSeat(st){
  if(!st || st.swim || st.sit) return null; let best = null, bd = 0.95;
  (SEATS[st.floor] || []).forEach(s => { let p = s.a;
    if(s.b){ const dx = s.b[0] - s.a[0], dy = s.b[1] - s.a[1], u = Math.max(0, Math.min(1, ((st.i - s.a[0]) * dx + (st.j - s.a[1]) * dy) / (dx * dx + dy * dy))); p = [s.a[0] + dx * u, s.a[1] + dy * u]; }
    const vi = st.i - p[0], vj = st.j - p[1], dd = Math.hypot(vi, vj);
    if(dd < bd && (!s.f || vi * Math.sin(s.h) + vj * Math.cos(s.h) > -0.12)){ bd = dd; best = {i:p[0], j:p[1], h:s.h, H:s.H, k:s.k, swing:s.swing, sway:s.sway}; } });
  return best;
}
/* 쓸 수 있는 물건 (2026-11-23 감독님 "그네 같은 물건도 이용할수있게. 뭔가 이용을 다 할수있으면 재밌겟어"): 가까이 가면 오른쪽 버튼이 바뀜 */
const USE = {wf:[{at:[25.4, 1.35], k:"arcade", n:"PIXEL"}, {at:[26.4, 1.35], k:"arcade", n:"BLAST"}, {at:[27.4, 1.35], k:"arcade", n:"RACER"}, {at:[30.95, 9.9], k:"slide"}, {at:[1.1, 10.75], k:"piano"},
    // 헬스장 · 게임방 · 식당 (2026-11-23 감독님 "요가도 하고 러닝머신도 하고 세세한거 다 해줘")
    {at:[18.3, 10.75], k:"run", h:0, r:1.4}, {at:[19.8, 15.9], k:"yoga", h:0}, {at:[21.3, 10.5], k:"lift", h:0}, {at:[22.54, 13.3], k:"pullup", h:-PI / 2, r:1.0},
    {at:[22.3, 11.0], k:"bounce", h:-PI / 2, r:1.0}, {at:[22.55, 17.2], k:"squat", h:0}, {at:[26.3, 3.1], k:"pong", r:1.0}, {at:[28.45, 2.6], k:"claw"}, {at:[8.3, 1.05], k:"drink", h:PI}, {at:[27.2, 10.1], k:"read", h:0}],
  s4:[{at:[27.7, 16.35], k:"vod", h:0.88}],
  // 유나네 집 (2026-11-24 감독님 "집에 자전거라든지 마당도 갈수있게하고 이용거리들 많이 재밌게")
  roof:[{at:[26.0, 16.75], k:"squirt", h:0, r:1.0}],   // 물총 싸움 (2026-11-28)
  home1:[{at:[10.8, 16.4], k:"bike", r:1.1}, {at:[18.4, 6.9], k:"splash", h:0, r:1.25}, {at:[20.0, 3.6], k:"bbq", h:PI / 2}, {at:[16.95, 8.95], k:"easel", h:0}, {at:[2.0, 16.55], k:"flower", h:0}],
  home2:[{at:[5.9, 2.45], k:"cook2", h:PI / 2}, {at:[0.85, 1.35], k:"fridge", h:PI}, {at:[7.5, 3.4], k:"blocks", h:PI}],
  home3:[{at:[0.77, 1.25], k:"bedjump", h:PI / 2, r:1.2}, {at:[4.45, 9.6], k:"bath", h:PI, r:1.25}, {at:[4.7, 2.97], k:"dolls", h:PI / 2}],
  home4:[{at:[14.6, 1.6], k:"scope", h:2.36, r:1.15}, {at:[9.9, 1.6], k:"harvest", h:PI}, {at:[9.6, 7.9], k:"laundry", h:0}, {at:[6.8, 9.8], k:"horse", h:PI / 2, r:1.0}]};
const USE_LB = {arcade:["🕹️", "오락하기"], slide:["🛝", "미끄럼틀"], piano:["🎹", "피아노"], futsal:["⚽", "풋살 한 판"], pong:["🏓", "아빠랑 탁구"], claw:["🧸", "인형뽑기"], bike:["🚲", "자전거 타기"]};
/* 기구 쓰기: ms 동안 그 동작 (몸 모양은 tower3d_floor actPose). raw = 기구 위에 바로 올라감, count = 하나! 둘! 세기 */
const ACTS = {
  run:{ms:8000, lb:["🏃‍♀️", "러닝머신"], raw:true, y:0.06, say:"달린다~ 🏃‍♀️", fx:["💦", "🔥", "💨"], mid:"헉헉… 5km 가자! 💦", done:"🏃‍♀️ 러닝머신 달리기", end:"땀 쫙 났다~ 💦"},
  yoga:{ms:10800, lb:["🧘‍♀️", "요가"], say:"요가 시작~ 🧘‍♀️", fx:["🌸", "😌", "✨"], mid:"나무 자세… 흔들흔들 😆", done:"🧘‍♀️ 요가 따라 하기", end:"몸이 개운해 😌"},
  lift:{ms:6000, lb:["💪", "덤벨"], say:"덤벨 들기! 💪", fx:["💪"], count:true, done:"💪 덤벨 들기", end:"근육 생겼나? 💪😆"},
  pullup:{ms:6000, lb:["🤸‍♀️", "철봉"], raw:true, say:"매달리기! 🤸‍♀️", fx:["💪"], count:true, done:"🤸‍♀️ 철봉 매달리기", end:"팔이 후들후들 😵"},
  bounce:{ms:6000, lb:["🟢", "짐볼"], raw:true, say:"통통~ 🟢", fx:["😆", "🎶", "🟢"], done:"🟢 짐볼 통통", end:"재밌다 한 번 더! 😆"},
  squat:{ms:6000, lb:["🦵", "스쿼트"], say:"스쿼트 시작! 🦵", fx:["🦵"], count:true, done:"🦵 케틀벨 스쿼트", end:"다리가 후들후들~ 😵"},
  read:{ms:7000, lb:["📖", "책 읽기"], say:"이 책 재밌겠다 📖", fx:["📖", "🤓", "📚"], mid:"콘티 책이다! 아빠 책상에 있는 거랑 똑같아 📚", done:"📖 도서실에서 책 읽기", end:"쉿… 다 읽었다 🤫"},
  drink:{ms:2600, lb:["💧", "물 마시기"], say:"꿀꺽꿀꺽 💧", fx:["💧"], done:"💧 정수기 물 한 잔", end:"시원하다~ 😋"},
  vod:{ms:7000, lb:["🎥", "VOD 찍기"], say:"안녕하세요~ 유나의 다빈치 교실입니다! 🎥", fx:["🎥", "✨", "💡"], mid:"오늘은 컷 편집을 배워 볼게요 ✂️", done:"🎥 탈잉 VOD 찍기", end:"구독 좋아요 눌러 주세요~ 😆"},
  // 유나네 집 놀이 (pose = 엔진 actPose 이름)
  splash:{ms:6000, lb:["💦", "물놀이"], raw:true, y:0.05, say:"첨벙첨벙~ 💦", fx:["💦", "🐤", "😆"], mid:"오리야 같이 놀자 🐤", done:"💦 마당 수영장 물놀이", end:"옷 다 젖었다 😆"},
  bbq:{ms:7000, pose:"cook", lb:["🍖", "바비큐"], say:"아빠 대신 내가 구울게! 🍖", fx:["🔥", "🍖", "😋"], mid:"지글지글~ 소시지 다 익었다 🌭", done:"🍖 마당 바비큐", end:"냠냠 맛있다 😋"},
  easel:{ms:7000, pose:"draw", lb:["🎨", "그림 그리기"], say:"분필로 그림 그려야지 🖍️", fx:["🖍️", "🌈", "🎨"], mid:"우리 가족 다 그렸다! 👨‍👩‍👧", done:"🎨 마당 칠판 그림", end:"아빠한테 보여 줘야지 😆"},
  flower:{ms:6000, pose:"water", lb:["🚿", "꽃 물 주기"], say:"꽃들아 물 마셔~ 🌷", fx:["💧", "🌷", "🌼"], mid:"쑥쑥 자라라~ 🌱", done:"🌷 꽃에 물 주기", end:"꽃이 웃는 것 같아 🌸"},
  cook2:{ms:7000, pose:"cook", lb:["🍳", "요리하기"], say:"엄마 도와 요리할래요! 🍳", fx:["🍳", "🥬", "✨"], mid:"계란말이 뒤집기 성공! 🍳", done:"🍳 부엌에서 요리", end:"엄마한테 칭찬받겠다 😋"},
  fridge:{ms:3200, pose:"drink", lb:["🧊", "냉장고 열기"], say:"냉장고에 뭐 있나~ 🧊", fx:["🍰", "🍓"], done:"🍰 냉장고 간식 찾기", end:"딸기 케이크 한 입만… 🍰", snack:true},
  blocks:{ms:7000, pose:"play", lb:["🧱", "블록 놀이"], say:"높이높이 쌓아야지 🧱", fx:["🧱", "🏰", "😆"], mid:"와르르~ 무너졌다 😵", done:"🧱 블록 성 쌓기", end:"다시 쌓으면 돼! 💪"},
  bedjump:{ms:5500, pose:"jump", lb:["🛏️", "침대 점프"], raw:true, y:0.48, say:"침대에서 퐁퐁~ 🛏️", fx:["😆", "⭐", "🎶"], mid:"엄마 오기 전에 그만해야지 🤫", done:"🛏️ 침대 트램펄린", end:"헉헉 재밌다 😆"},
  bath:{ms:7000, lb:["🛁", "거품 목욕"], raw:true, y:0.08, say:"거품 목욕~ 🫧", fx:["🫧", "🐤", "🛁"], mid:"삑삑! 오리도 목욕해 🐤", done:"🛁 거품 목욕", end:"뽀송뽀송 😊"},
  dolls:{ms:7000, pose:"play", lb:["🏠", "인형 놀이"], say:"인형집에 손님 왔어요~ 🏠", fx:["👧", "🦄", "🏠"], mid:"유니콘도 같이 놀자 🦄", done:"🏠 인형집 놀이", end:"인형들 이제 잘 시간 💤"},
  scope:{ms:6000, lb:["🔭", "망원경"], say:"망원경으로 보자 🔭", fx:["⭐", "🌙", "🪐"], mid:"토성 고리 보인다!! 🪐", done:"🔭 옥상 망원경", end:"별 진짜 많다 ✨"},
  harvest:{ms:6000, lb:["🍅", "텃밭"], say:"방울토마토 따야지 🍅", fx:["🍅", "🥬", "🌱"], mid:"빨갛게 잘 익었다! 🍅", done:"🍅 옥상 텃밭 수확", end:"저녁에 고기랑 먹자 😋"},
  laundry:{ms:6000, lb:["👗", "빨래 널기"], say:"엄마 빨래 도와줄게요 👗", fx:["🧦", "👗", "☀️"], mid:"양말 짝 맞추기 🧦", done:"👗 빨래 널기", end:"햇볕에 뽀송뽀송 ☀️"},
  horse:{ms:6000, lb:["🐴", "흔들목마"], raw:true, seat:0.4, say:"이랴~ 출발! 🐴", fx:["🐴", "🎠", "😆"], mid:"달려라 달려~ 🏇", done:"🐴 흔들목마 타기", end:"말이 지쳤대 😆"}};
Object.entries(ACTS).forEach(([k, a]) => USE_LB[k] = a.lb);
const GYM = ["run", "yoga", "lift", "pullup", "bounce", "squat"];
const HOMEPLAY = ["bike", "splash", "bbq", "easel", "flower", "cook2", "fridge", "blocks", "bedjump", "bath", "dolls", "scope", "harvest", "laundry", "horse"];
const FSC = {i0:1.4, i1:12.6, j0:1.2, j1:8.4};   // 풋살장 안
const TWINKLE = [72, 72, 79, 79, 81, 81, 79, 0, 77, 77, 76, 76, 74, 74, 72];   // 작은 별
const BOOTHS = {s4:[[34.2, 12.0], [35.38, 12.0]], roof:[[27.45, 16.95]], gym:[[9.5, 29.65]]};
const inRoom = st => !!st && st.floor === "home3" && !st.swim && !st.sit && st.i > YU_ROOM[0] && st.i < YU_ROOM[2] && st.j > YU_ROOM[1] && st.j < YU_ROOM[3];
const nearBooth = st => !!st && !st.swim && !st.sit && (BOOTHS[st.floor] || []).some(([i, j]) => Math.hypot(st.i - i, st.j - j) < 0.85);
const FITS = [["base", "👕", "평소 옷", "역시 편한 게 최고 👕"], ["dress", "👑", "공주 드레스", "짜잔~ 공주님 등장 👑"], ["hanbok", "🌸", "한복", "한복 예쁘죠? 🌸"],
  ["director", "🎬", "꼬마 감독", "레디~ 액션! 🎬 아빠처럼"], ["spring", "🌼", "봄 원피스", "봄바람 살랑살랑 🌼"], ["swim", "🩱", "수영복", "수영하러 가자! 🩱💦"]];
/* 장난치기 (2026-11-28 감독님 "여전히 재미없는데…" → 장난치기·꾸미기 "좋네~", "다 해"): 집 안 장난감을 툭 치면 와르르. 많이 어지르면 엄마가 올라와 쫓아옴 → 도망치거나 엄마가 안 볼 때 숨기.
   k = 엔진 PROP_KIND, at = 놓는 자리(막혀 있으면 가까운 빈 곳), h = 놓인 방향 */
const PRANK = {
  home2:[{k:"pillows", at:[12.5, 4.6]}, {k:"domino", at:[9.7, 2.6]}, {k:"blocks", at:[14.3, 8.7]}, {k:"ball", at:[10.9, 4.9]}, {k:"cups", at:[9.6, 8.3]}, {k:"pot", at:[15.3, 1.3]}, {k:"pot", at:[9.0, 10.3]}, {k:"bucket", at:[4.3, 3.3]}, {k:"books", at:[14.7, 6.0]}, {k:"tp", at:[5.5, 8.7]}],
  home3:[{k:"pins", at:[2.35, 1.5]}, {k:"ball", at:[3.9, 3.95]}, {k:"books", at:[5.6, 1.4]}, {k:"blocks", at:[4.6, 3.95]}, {k:"domino", at:[7.4, 5.2], h:PI / 2}, {k:"pillows", at:[8.0, 2.7]}, {k:"tp", at:[5.7, 7.3]}, {k:"duck", at:[5.0, 8.3]}, {k:"cups", at:[13.2, 3.6]}, {k:"pot", at:[15.3, 4.0]}],
  home4:[{k:"pins", at:[4.6, 5.0]}, {k:"ball", at:[5.6, 6.6]}, {k:"pillows", at:[3.4, 7.9]}, {k:"books", at:[6.6, 3.5]}, {k:"pot", at:[10.6, 7.6]}, {k:"bucket", at:[13.2, 2.8]}, {k:"domino", at:[9.2, 4.3], h:PI / 2}, {k:"cups", at:[12.3, 8.3]}]};
const HIDES = {home2:[{at:[12.5, 7.5], lb:"소파 뒤"}, {at:[15.3, 3.3], lb:"빈백 뒤"}, {at:[3.65, 8.7], lb:"화장실"}, {at:[1.5, 1.7], lb:"냉장고 옆"}],
  home3:[{at:[1.8, 1.6], lb:"이불 속"}, {at:[5.2, 9.3], lb:"욕조 옆"}, {at:[4.75, 3.0], lb:"인형집 뒤"}, {at:[11.7, 2.7], lb:"엄마 침대 옆"}, {at:[10.9, 8.2], lb:"아빠 소파 뒤"}],
  home4:[{at:[6.39, 2.62], lb:"텐트 옆"}, {at:[4.6, 8.0], lb:"방석 사이"}, {at:[14.84, 9.58], lb:"화분 뒤"}, {at:[14.8, 2.4], lb:"망원경 뒤"}]};
const MOM_IN = {home2:[3.2, 4.65, PI / 2], home3:[3.2, 9.0, PI], home4:[2.1, 4.65, PI / 2]}, MESS_MAX = 14;
const CAT_HOME = {at:[13.9, 5.5], flee:[[9.3, 9.9], [15.3, 9.9], [9.3, 1.3], [15.3, 2.4]]};
const KNOCK_YU = {_:["와르르~ 😆", "앗… 엄마한텐 비밀 🤫", "우당탕! 😝", "히히 재밌다 😆"], pins:["스트라이크!! 🎳", "볼링이다~ 🎳"], domino:["도미노 간다~ 😆", "우와 다 넘어간다! 🤩"], bucket:["앗 물 쏟았다! 💦", "첨벙! 큰일 났다 😱"], pot:["앗 화분… 😱", "흙 다 쏟았다 🙈"],
  pillows:["베개 싸움이다! 😆", "푹신푹신 와르르~"], tp:["휴지 탑 무너진다~ 🧻", "데굴데굴 🧻"], ball:["슛~! ⚽", "공아 굴러가라~"], cups:["컵 탑 와르르! 🥤"], duck:["삑삑! 오리 굴러간다 🐤"], books:["책 탑이 와르르 📚"], blocks:["블록 성 무너졌다! 🧱"]};
const KNOCK_E = {pins:"🎳", domino:"💥", bucket:"💦", pot:"🌱", pillows:"☁️", tp:"🧻", ball:"⚽", cups:"🥤", duck:"🐤", books:"📚", blocks:"🧱"};
/* 꾸미기: 머리 모양 · 머리색 (옷은 FITS). 방 꾸미기 목록은 floor3d_home.js HOME.room */
const HAIRS = [["pig", "🎀", "양갈래"], ["long", "💁‍♀️", "긴 머리"], ["bob", "🍄", "단발"], ["pony", "🐴", "포니테일"], ["twin", "🐼", "만두머리"], ["braid", "🌾", "땋은 머리"], ["bun", "🍡", "올림머리"]];
const HAIR_COLS = [["#3A261C", "밤색"], ["#1E1B18", "까만색"], ["#8A5A3C", "밝은 갈색"], ["#E2B95C", "금발"], ["#F28DB2", "딸기 분홍"], ["#86BCEB", "하늘색"], ["#A98AD8", "보라"], ["#F2884B", "주황"]];
const YU_ROOM = [0.25, 0.25, 6.15, 4.4];   // 집 3층 유나 방 (여기 들어오면 '방 꾸미기' 버튼)
const BADGES = [
  ["first", "🌱", "첫 별 받기", r => r.stars >= 1],
  ["prank", "🙈", "장난꾸러기 (50개 와르르)", r => (r.prank?.n || 0) >= 50],
  ["ninja", "🫣", "숨기 대장 (엄마 3번 따돌리기)", r => (r.prank?.esc || 0) >= 3],
  ["style", "💇", "멋쟁이 (머리 모양 4가지)", r => cnt(r.hairs) >= 4],
  ["deco", "🎀", "방 꾸미기 대장 (장식 5개)", r => (r.room?.deco?.length || 0) >= 5],
  ["home", "🏡", "우리 집 놀이 전부", r => HOMEPLAY.every(k => r.uses?.[k])],
  ["star10", "🌟", "별 10개 모으기", r => r.stars >= 10],
  ["friend10", "👋", "10명한테 말 걸기", r => cnt(r.met) >= 10],
  ["friend25", "🤝", "25명한테 말 걸기", r => cnt(r.met) >= 25],
  ["tre10", "🔍", "보물 10개 찾기", r => cnt(r.tre) >= 10],
  ["treAll", "🏴‍☠️", "보물 90개 전부", r => cnt(r.tre) >= TOTAL],
  ["floors", "🛗", "모든 층 가 보기", r => cnt(r.vis) >= 5],
  ["ball", "⚽", "골잡이", r => r.done.ball],
  ["hide", "🙈", "숨바꼭질 달인", r => r.done.hide],
  ["swim", "🏊‍♀️", "수영 챔피언", r => r.done.swim],
  ["tag", "🏃", "술래잡기 승리", r => r.done.tag],
  ["stars", "🌠", "별똥별 수집가", r => r.done.stars],
  ["cat", "🐈", "고양이 구조대", r => r.done.cat],
  ["req5", "💌", "사람들 부름 5번", r => (r.req || 0) >= 5],
  ["sit7", "🪑", "의자 7곳 다 앉아 보기", r => cnt(r.sits) >= 7],
  ["pray", "🙏", "교회에서 기도하기", r => (r.pray || 0) >= 1],
  ["fashion", "👗", "옷 6벌 다 입어 보기", r => cnt(r.fits) >= 6],
  ["jump", "🦘", "점프 50번", r => (r.jumps || 0) >= 50],
  ["boost", "⚡", "번개 사탕 3개", r => (r.boosts || 0) >= 3],
  ["strokes", "🐸", "자유형·평형·배영 다 해 보기", r => cnt(r.strokes) >= 3],
  ["party", "🎉", "깜짝 파티 성공", r => r.done.party],
  ["friend", "👭", "친구랑 하루 놀기", r => r.done.friend],
  ["gym", "🏋️", "헬스장 기구 4개 써 보기", r => GYM.filter(k => r.uses?.[k]).length >= 4],
  ["claw", "🧸", "인형뽑기 성공", r => (r.dolls || []).length > 0],
  ["tncup", "🏆", "동네 테니스 대회 우승", r => (r.cup?.tennis || 0) >= 1], ["swcup", "🥇", "동네 수영 대회 우승", r => (r.cup?.swim || 0) >= 1]];

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
/* 영법 (2026-11-23 감독님 "수영안 평형과 자유형도 하고"): 물에 들어가면 점프 버튼이 영법 버튼으로 바뀜 */
const STROKES = [["free", "🏊‍♀️", "자유형", "자유형! 팔 휙휙 💪"], ["breast", "🐸", "평형", "평형! 개구리처럼 쭉~ 🐸"], ["back", "🙃", "배영", "배영! 하늘 보면서 둥실 ☁️"]];
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
.yg-fit{width:min(318px,calc(100vw - 128px));grid-template-columns:1fr 1fr;max-height:min(430px,calc(100dvh - 36px));overflow-y:auto;overscroll-behavior:contain}
.yg-fit .yg-ftabs{grid-column:1/-1;display:flex;gap:4px;overflow-x:auto;scrollbar-width:none;padding-bottom:2px}
.yg-fit .yg-ftabs button{flex:1 0 auto;min-width:38px;min-height:38px;justify-content:center;padding:4px 8px;font-size:18px;background:rgba(255,255,255,.06);gap:5px}
.yg-fit .yg-ftabs button small{font-size:11.5px;font-weight:700;display:none}
.yg-fit .yg-ftabs button[aria-selected="true"]{background:#FFF;color:#2A2A28}
.yg-fit .yg-ftabs button[aria-selected="true"] small{display:inline}
.yg-fit > button{min-width:0;gap:7px;padding:6px 9px;font-size:13px;line-height:1.2}
.yg-fit > button b{width:auto;font-size:17px;font-family:inherit;color:inherit}
.yg-fit > button i{flex:none;width:20px;height:20px;border-radius:50%;border:2px solid rgba(255,255,255,.7)}
.yg-fit > button.wide{grid-column:1/-1;justify-content:center;background:rgba(255,255,255,.14)}
.yg-fit > p{grid-column:1/-1;margin:2px 4px 0;font-size:12px;line-height:1.4;color:rgba(255,255,255,.72)}
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
.yg-run.ban span{filter:grayscale(1);opacity:.45;animation:none}
.yg-run.ban b::after{content:" 🚫"}
.yg-run.go span{filter:none;opacity:1;background:radial-gradient(closest-side,#FFF3D1 80%,transparent 82%),conic-gradient(#FF6FA8 calc(var(--p) * 360deg),transparent 0)}
.yg-run b{font-size:11px;font-weight:700;color:var(--ink-2)}
.yg-run:active span{transform:scale(.92)}
.yg-tn{position:absolute;inset:0;pointer-events:none}.yg-tn[hidden]{display:none}
.yg-tn button{pointer-events:auto;position:absolute;display:grid;justify-items:center;gap:4px;border:0;background:none;padding:0;touch-action:none;-webkit-user-select:none;user-select:none}
.yg-tn button span{position:relative;display:grid;place-items:center;width:60px;height:60px;border-radius:50%;font-size:25px;box-shadow:0 8px 20px -8px rgba(40,30,60,.6),inset 0 2px 0 rgba(255,255,255,.35);transition:transform .08s}
.yg-tn button b{font-size:11px;font-weight:800;color:var(--ink-2);background:color-mix(in srgb,var(--card) 90%,transparent);border-radius:999px;padding:1px 8px;white-space:nowrap}
.yg-tn .d{right:max(18px,env(safe-area-inset-right));bottom:max(22px,env(safe-area-inset-bottom))}.yg-tn .d span{width:76px;height:76px;font-size:30px;background:linear-gradient(160deg,#FF8FB8,#FF5F7E)}
.yg-tn .l{right:calc(max(18px,env(safe-area-inset-right)) + 9px);bottom:calc(max(22px,env(safe-area-inset-bottom)) + 110px)}.yg-tn .l span{background:linear-gradient(160deg,#C8B4F0,#8E86E0)}
.yg-tn .p{right:calc(max(18px,env(safe-area-inset-right)) + 96px);bottom:calc(max(22px,env(safe-area-inset-bottom)) + 12px)}.yg-tn .p span{background:linear-gradient(160deg,#A8E6C8,#4DAA97)}
.yg-tn button.on span{transform:scale(.9)}
.yg-tn button[data-aim] span::after{position:absolute;top:50%;transform:translateY(-50%);font-size:20px;font-weight:900;color:#FF4F86;text-shadow:0 1px 0 #fff,0 0 6px #fff}
.yg-tn button[data-aim="-1"] span::after{content:"◀";left:-24px}.yg-tn button[data-aim="1"] span::after{content:"▶";right:-24px}
.yg-tn.go button span,.yg-act.beat span{box-shadow:0 0 0 5px rgba(255,255,255,.92),0 0 24px 8px rgba(255,205,80,.95)}
.yg-tm{position:absolute;left:50%;top:31%;transform:translateX(-50%);pointer-events:none;text-align:center;font-weight:900;font-size:30px;letter-spacing:.02em;white-space:nowrap;opacity:0;color:#3A8A78;text-shadow:0 2px 0 rgba(255,255,255,.95),0 6px 18px rgba(40,20,60,.35)}
.yg-tm small{display:block;font-size:13px;font-weight:800;margin-top:3px;color:#5A5048;letter-spacing:0}
.yg-tm[data-g="perfect"]{color:#F0A020;font-size:34px}.yg-tm[data-g="early"],.yg-tm[data-g="late"]{color:#8E86B0;font-size:24px}
.yg-tm.go{animation:ygTm .8s ease-out}
@keyframes ygTm{0%{opacity:0;transform:translate(-50%,10px) scale(.6)}18%{opacity:1;transform:translate(-50%,0) scale(1.14)}34%{transform:translate(-50%,0) scale(1)}72%{opacity:1}100%{opacity:0;transform:translate(-50%,-16px)}}
.yg-roam{background:color-mix(in srgb,#FF8FB8 20%,var(--paper));border-color:color-mix(in srgb,#FF8FB8 50%,var(--line))}
.yg-toast.up{bottom:auto;top:calc(max(14px,env(safe-area-inset-top)) + 92px)}
.yg.tn .yg-hud{left:max(12px,env(safe-area-inset-left));transform:none;top:calc(max(10px,env(safe-area-inset-top)) + 58px);font-size:12px;padding:4px 10px;gap:5px;box-shadow:none;background:rgba(42,42,40,.78)}   /* 테니스: 점수는 왼쪽 위 작게 (상대 안 가리게) */
@keyframes yg-glow{50%{box-shadow:0 0 0 7px rgba(255,194,61,.35),0 8px 20px -10px rgba(0,0,0,.45)}}
.yg-snd + .yg-x{margin-left:8px}
.yg-mapb{margin-right:0}
.yg-mapb + .yg-snd{margin-left:8px}
.yg-map{pointer-events:auto;position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(560px,calc(100% - 24px));background:var(--card);border:1px solid var(--line);border-radius:24px;padding:14px 14px 12px;box-shadow:0 24px 60px -20px rgba(40,20,30,.55)}
.yg-map h3{margin:2px 4px 10px;font-size:16px;font-weight:800;display:flex;align-items:center;gap:6px}
.yg-map h3 small{font-weight:600;font-size:12px;color:var(--muted,#8A847C);margin-left:auto}
.yg-map .m{position:relative;aspect-ratio:16/10;border-radius:18px;overflow:hidden;background:radial-gradient(120% 90% at 30% 20%,#EAF6EE 0%,#DCEFE3 55%,#CFE7D9 100%)}
.yg-map .m svg{position:absolute;inset:0;width:100%;height:100%}
.yg-map .t{position:absolute;transform:translate(-50%,-50%);display:grid;justify-items:center;gap:2px;border:0;background:none;padding:0;cursor:pointer;font:inherit;color:#2A2A28}
.yg-map .t i{font-style:normal;display:grid;place-items:center;width:46px;height:46px;border-radius:50%;background:#FFF;font-size:24px;box-shadow:0 6px 14px -6px rgba(40,30,20,.45);border:2px solid #FFF;transition:transform .15s}
.yg-map .t:hover i{transform:scale(1.08)}
.yg-map .t span{font-size:11px;font-weight:700;background:rgba(255,255,255,.85);border-radius:8px;padding:1px 6px;white-space:nowrap}
.yg-map .t.on i{border-color:#FF6FA8;box-shadow:0 0 0 4px rgba(255,111,168,.25),0 6px 14px -6px rgba(40,30,20,.45)}
.yg-map .t.on::before{content:"📍";position:absolute;top:-20px;font-size:18px;animation:ygpin 1s ease-in-out infinite alternate}
.yg-map .t.off{opacity:.45;pointer-events:none}
@keyframes ygpin{to{transform:translateY(-4px)}}
.yg-map .x{margin:10px auto 0;display:block;border:0;border-radius:12px;background:#2A2A28;color:#FFF;font:inherit;font-weight:700;padding:8px 18px;cursor:pointer}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .yg-map .m{background:radial-gradient(120% 90% at 30% 20%,#2E3B36 0%,#26322E 60%,#1F2926 100%)}}
:root[data-theme="dark"] .yg-map .m{background:radial-gradient(120% 90% at 30% 20%,#2E3B36 0%,#26322E 60%,#1F2926 100%)}
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
.yg-pick{pointer-events:auto;position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(400px,calc(100% - 40px));background:var(--card);border:1px solid var(--line);border-radius:22px;padding:16px 16px 14px;box-shadow:0 24px 60px -20px rgba(40,20,30,.55);text-align:center}
.yg-pick p{margin:2px 6px 12px;font-size:15px;font-weight:700;line-height:1.4;word-break:keep-all}
.yg-pick p small{display:block;font-size:12px;font-weight:600;color:var(--ink-3);margin-bottom:3px}
.yg-pick div{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.yg-pick button{display:grid;justify-items:center;gap:6px;border:1.5px solid var(--line);background:var(--paper);border-radius:16px;padding:14px 8px 12px;min-height:96px}
.yg-pick button span{font-size:34px;line-height:1}
.yg-pick button b{font-size:14px;font-weight:700}
.yg-pick button:active{transform:scale(.96);border-color:#FF6FA8}
.yg-lb::before,.yg-lb::after{content:"";position:absolute;left:0;right:0;height:0;background:#111;transition:height .5s ease;z-index:3}
.yg-lb::before{top:0}.yg-lb::after{bottom:0}
.yg-lb.on::before,.yg-lb.on::after{height:11vh}
.yg-chap{position:absolute;left:50%;top:42%;transform:translate(-50%,-50%);text-align:center;color:#FFF;opacity:0;transition:opacity .5s;pointer-events:none;z-index:4;text-shadow:0 2px 18px rgba(0,0,0,.55)}
.yg-chap.on{opacity:1}
.yg-chap small{display:block;font:600 12px/1 "Inter Tight",var(--f-body);letter-spacing:.3em;opacity:.85;margin-bottom:10px}
.yg-chap b{display:block;font:400 clamp(26px,5vw,40px)/1.2 var(--f-display);letter-spacing:-.01em}
.yg-chap::before{content:"";position:absolute;inset:-40px -80px;background:radial-gradient(closest-side,rgba(20,14,24,.55),transparent);z-index:-1}
.yg-night{position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity 1.6s;background:radial-gradient(120% 90% at 50% 40%,rgba(30,30,80,.18),rgba(12,12,40,.62));mix-blend-mode:multiply}
.yg-night.on{opacity:1}
.yg-grill{position:absolute;left:50%;bottom:calc(max(18px,env(safe-area-inset-bottom)) + 150px);transform:translateX(-50%);display:grid;gap:8px;justify-items:center;width:min(300px,70vw);background:rgba(42,42,40,.9);color:#FFF;border-radius:18px;padding:12px 16px 14px;font-weight:800;font-size:14px;box-shadow:0 14px 34px -14px rgba(0,0,0,.6)}
.yg-grill .bar{position:relative;width:100%;height:14px;border-radius:99px;background:linear-gradient(90deg,#F4B6A8 0%,#E58A6A 50%,#7A3A22 100%);overflow:hidden}
.yg-grill .bar em{position:absolute;top:0;bottom:0;left:58%;width:24%;border:2px solid #FFF;border-radius:99px;box-shadow:0 0 0 2px rgba(255,255,255,.25)}
.yg-grill .bar i{position:absolute;top:-3px;bottom:-3px;left:0;width:4px;margin-left:-2px;border-radius:2px;background:#FFE066;box-shadow:0 0 8px #FFE066}
.yg-grill.claw .bar{background:linear-gradient(90deg,#CFE3F5,#E2D6EA 50%,#FBD3DC)}
.yg-grill.claw .bar em{width:17%;border-color:#FF6FA8;box-shadow:0 0 0 2px rgba(255,111,168,.3)}
.yg-grill .m{font-size:26px;line-height:1}
.yg-cred{pointer-events:auto;position:absolute;inset:0;display:grid;place-items:center;background:rgba(14,12,20,.82);color:#FFF;text-align:center;z-index:5}
.yg-cred .in{display:grid;gap:6px;justify-items:center;max-width:min(420px,90vw);animation:ygUp .9s ease both}
.yg-cred small{font:600 11px/1 "Inter Tight",var(--f-body);letter-spacing:.3em;opacity:.7;margin-top:12px}
.yg-cred h2{margin:0 0 6px;font:400 clamp(26px,5vw,38px)/1.2 var(--f-display)}
.yg-cred p{margin:0;font-size:15px;font-weight:600;opacity:.92}
.yg-cred button{margin-top:22px;border:0;border-radius:999px;background:#FF6FA8;color:#FFF;font-weight:800;font-size:15px;padding:12px 26px}
@keyframes ygUp{from{opacity:0;transform:translateY(18px)}}
.yg-flash{position:absolute;inset:0;background:#FFF;opacity:0;pointer-events:none}
.yg-flash.on{animation:ygFlash .6s ease-out}
@keyframes ygFlash{0%{opacity:.95}100%{opacity:0}}
@media (prefers-reduced-motion:reduce){.yg-flash.on{animation:none}}
`;

/* 소리 (2026-11-23 감독님 "효과음과 비지엠 넣어줘"): 파일 없이 웹오디오로 만든 짧은 효과음 + 직접 쓴 밝은 8마디 배경음 */
const AU = {ctx:null, on:true, m:null, sfx:null, bgm:null, noise:null, iv:0, next:0, step:0, blipAt:0};
try { AU.on = localStorage.getItem("crayon-yuna-sound") !== "0"; } catch(_){}
const mtof = n => 440 * Math.pow(2, (n - 69) / 12);
function auInit(){
  const C = window.AudioContext || window.webkitAudioContext; if(!C) return null;
  try { if(navigator.audioSession && navigator.audioSession.type !== "playback") navigator.audioSession.type = "playback"; } catch(_){}   // 아이폰 무음 스위치여도 들리게
  if(!AU.ctx){ const c = AU.ctx = new C(); AU.m = c.createGain(); AU.m.gain.value = AU.on && !AU.duck ? 0.9 : 0; AU.ct = -1; AU.ctAt = performance.now(); AU.tryAt = 0; AU.m.connect(c.destination);
    AU.sfx = c.createGain(); AU.sfx.gain.value = 0.55; AU.sfx.connect(AU.m); AU.bgm = c.createGain(); AU.bgm.gain.value = 0.28; AU.bgm.connect(AU.m);
    const len = c.sampleRate * 0.5 | 0, b = c.createBuffer(1, len, c.sampleRate), dd = b.getChannelData(0); for(let k = 0; k < len; k++) dd[k] = Math.random() * 2 - 1; AU.noise = b; }
  if(AU.ctx.state !== "running" && AU.ctx.state !== "closed" && !document.hidden) AU.ctx.resume?.()?.catch?.(() => {});
  if(!AU.iv){ AU.next = AU.ctx.currentTime + 0.15; AU.step = 0; AU.iv = setInterval(bgmPump, 90); }
  return AU.ctx;
}
function auStop(){ clearInterval(AU.iv); AU.iv = 0; try { AU.ctx?.close()?.catch?.(() => {}); } catch(_){} AU.ctx = null; }
/* 소리가 한 번 끊기면 안 돌아오던 것 (2026-11-28 감독님 "한번씩 소리도 안나고"): 아이폰은 전화·시리·다른 앱 소리·잠금 뒤에 오디오가
   "interrupted"로 멈추거나, "running"인데 시계가 멈춘 채 조용해짐 → 손가락을 댈 때 확인해서 살리고, 그래도 안 되면 소리 엔진을 새로 만듦 */
function auRebuild(){ AU.rebuilt = (AU.rebuilt || 0) + 1; auStop(); AU.stuck = false; AU.woke = false; return auInit(); }
function auSet(on){ AU.on = on; try { localStorage.setItem("crayon-yuna-sound", on ? "1" : "0"); } catch(_){} if(AU.m) AU.m.gain.setTargetAtTime(on && !AU.duck ? 0.9 : 0, AU.ctx.currentTime, 0.05); }
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
/* 층마다 배경음 (2026-11-23 감독님 "층마다 배경음 바꿀까"): 1층 카페 라운지 · 2층 지금 곡 · 3층 통통 · 4층 꿈꾸는 종소리 · 5층 여름 */
const BGM = {
  main:{bpm:104, ch:BGM_CH, mel:BGM_MEL, lead:"triangle", lv:0.12},
  lobby:{bpm:90, lead:"sine", lv:0.13, soft:true, ch:[[41,57,60,64],[40,55,59,62],[38,53,57,60],[43,55,59,65]],
    mel:[72,-1,69,-1, 67,69,-1,-1,  71,-1,67,-1, 64,-1,-1,-1,  69,-1,65,-1, 62,65,69,-1,  67,-1,-1,71, 74,-1,-1,-1,
         72,-1,76,-1, 74,72,-1,69,  71,-1,67,-1, 64,67,-1,-1,  69,-1,72,-1, 74,-1,71,-1,  72,-1,-1,-1, -1,-1,-1,-1]},
  wf:{bpm:116, lead:"square", lv:0.05, ch:[[43,59,62,67],[38,57,62,66],[40,59,64,67],[36,60,64,67]],
    mel:[74,-1,71,74, 79,-1,78,-1,  76,-1,74,-1, 69,-1,-1,-1,  71,-1,74,71, 76,-1,74,-1,  72,-1,71,-1, 69,-1,67,-1,
         74,-1,71,74, 79,-1,81,-1,  83,-1,81,-1, 78,-1,-1,-1,  79,-1,76,-1, 74,76,71,-1,  72,74,71,-1, 67,-1,-1,-1]},
  s4:{bpm:88, lead:"sine", lv:0.11, bell:true, soft:true, ch:[[38,62,66,69],[35,62,66,71],[43,62,67,71],[45,61,64,69]],
    mel:[81,-1,-1,78, 81,-1,85,-1,  83,-1,-1,-1, 78,-1,-1,-1,  79,-1,83,-1, 86,-1,83,-1,  81,-1,-1,-1, 76,-1,-1,-1,
         81,-1,-1,78, 81,-1,86,-1,  85,-1,83,-1, 78,-1,-1,-1,  79,-1,81,83, 86,-1,85,-1,  86,-1,-1,-1, -1,-1,-1,-1]},
  roof:{bpm:126, lead:"square", lv:0.055, ch:[[41,57,60,65],[36,60,64,67],[38,57,62,65],[46,58,62,65]],
    mel:[77,-1,77,79, -1,81,-1,77,  76,-1,72,-1, 74,-1,76,-1,  77,-1,77,79, -1,81,-1,84,  82,-1,81,-1, 79,-1,77,-1,
         81,-1,81,-1, 84,-1,81,-1,  79,-1,76,-1, 72,-1,74,76,  77,-1,74,-1, 77,-1,79,-1,  77,-1,-1,-1, -1,-1,-1,-1]}};
/* 유나네 집 (floor3d_home.js 안내대로). FL에 n이 없어서 엘리베이터에는 안 나옴 */
Object.entries(HOME.names).forEach(([k, name]) => FL[k] = {name});
TREASURE.home1 = [["🔑","현관 열쇠"],["⚽","공"],["🦆","수영장 오리"],["🌷","튤립"],["🔌","충전 케이블",1],["✉️","편지",1]];
TREASURE.home2 = [["🥩","고기"],["🥬","상추"],["📺","리모컨"],["🧦","양말"],["🍯","꿀단지",1],["🖼️","가족사진",1]];
TREASURE.home3 = [["🧸","곰돌이"],["🎀","머리핀"],["🛁","고무 오리"],["📚","동화책"],["💍","엄마 반지",1],["🏆","아빠 트로피",1]];
TREASURE.home4 = [["🔭","별 지도"],["🍅","방울토마토"],["🧺","빨래집게"],["🎞️","필름",1],["🪁","연"],["🌠","별똥별",1]];
Object.assign(SEED, {home1:67, home2:71, home3:73, home4:79});
/* 동네 (2026-11-24 감독님 "세계관 팍팍 늘려봐, 지역도 늘리고"): 로비 앞 건너편 보도 서쪽 끝 → 동네 공원, 동쪽 끝 → 학교 앞 골목 */
const AREA = {park:{name:"동네 공원·놀이터", e:"🌳", gate:[15, 21.3], spawn:[15, 20.5, Math.PI], lobbyAt:[-4.6, 28.6], back:[-3.5, 28.3, Math.PI / 2]},
  town:{name:"학교 앞 골목", e:"🍢", gate:[14, 19.3], spawn:[14, 18.5, Math.PI], lobbyAt:[42.6, 28.6], back:[41.5, 28.3, -Math.PI / 2]},
  fun:{name:"크레용랜드 놀이공원", e:"🎡", gate:[17, 25.3], spawn:[17, 24.5, Math.PI], via:"town"},
  school:{name:"크레용초등학교", e:"🏫", gate:[16, 23.3], spawn:[16, 22.5, Math.PI], via:"town"},
  market:{name:"크레용 전통시장", e:"🧺", gate:[15, 21.3], spawn:[15, 20.5, Math.PI], lobbyAt:null, via:"town", side:[0.7, 11], spawnSide:[1.5, 11, Math.PI / 2]},
  river:{name:"강변 공원·동네 교회", e:"⛪", gate:[17, 23.3], spawn:[17, 22.5, Math.PI], via:"park", side:[33.3, 12], spawnSide:[32.5, 12, -Math.PI / 2]},
  gym:{name:"크레용 스포츠센터", e:"🏊", gate:[0.35, 28.6], spawn:[1.4, 28.6, Math.PI / 2], via:"river"},   // 2026-11-28 감독님 "올림픽 규격으로. 체육관을 만들란 소리잖아": 강변 오른쪽 문 → 50m 수영장
  court:{name:"스포츠센터 테니스장", e:"🎾", gate:[0.35, 13], spawn:[1.3, 13, Math.PI / 2], via:"gym"}};   // 실내 테니스장: 스포츠센터 오른쪽 문
/* 동네끼리 걸어서 (2026-11-24): 서 → 동 강변 — 공원 — 타워 로비 — 골목 — 시장 · 골목 학교 현관 → 학교 · 골목 버스 정류장 → 놀이공원 */
const LINKS = [
  {f:"park", at:[0.45, 16.5], r:0.6, to:"river", spawn:[32.5, 12, -Math.PI / 2]}, {f:"river", at:[33.3, 12], r:0.75, to:"park", spawn:[1.3, 16.5, Math.PI / 2]},
  {f:"river", at:[17, 23.3], r:0.55, to:"park", spawn:[1.3, 16.5, Math.PI / 2]},
  {f:"river", at:[33.3, 17.7], r:0.7, to:"gym", spawn:[1.4, 28.6, Math.PI / 2]}, {f:"gym", at:[0.35, 28.6], r:0.7, to:"river", spawn:[32.4, 17.7, -Math.PI / 2]},
  {f:"gym", at:[49.85, 28.6], r:0.7, to:"court", spawn:[1.3, 13, Math.PI / 2]}, {f:"court", at:[0.35, 13], r:0.7, to:"gym", spawn:[48.8, 28.6, -Math.PI / 2]},
  {f:"town", at:[28.0, 17.3], r:0.6, to:"market", spawn:[1.5, 11, Math.PI / 2]}, {f:"market", at:[0.7, 11], r:0.8, to:"town", spawn:[27.3, 16.4, -Math.PI / 2]},
  {f:"market", at:[15, 21.3], r:0.55, to:"town", spawn:[27.3, 16.4, -Math.PI / 2]},
  {f:"town", at:[4.2, 3.1], r:0.5, to:"school", spawn:[16, 22.5, Math.PI]}, {f:"school", at:[16, 23.3], r:0.55, to:"town", spawn:[4.2, 3.9, 0]},
  {f:"fun", at:[17, 25.3], r:0.55, to:"town", spawn:[21.0, 14.4, 0]}];
const BUS = {f:"town", at:[21.0, 14.4], to:"fun"};   // 골목 버스 정류장에서 버튼으로 타고 감   // 2026-11-24 감독님 "학교도 만들든가 사립초" · 골목 학교 정문으로 들어감   // 놀이공원은 골목 버스 정류장에서 버스로 (나갈 때도 버스로 골목)
const AREA_S = {park:"공원", town:"골목", fun:"놀이공원", school:"학교", market:"시장", river:"강변", gym:"스포츠센터", court:"테니스장"};
Object.entries(AREA).forEach(([k, a]) => FL[k] = {name:a.name, s:AREA_S[k]});
const flS = f => FL[f].s || FL[f].name.split(" ")[0];
TREASURE.park = [["🦆","꽥꽥 오리"],["🍂","단풍잎"],["🫧","비눗방울"],["🐿️","다람쥐",1],["🪺","새 둥지",1],["🌰","도토리"]];
TREASURE.town = [["✏️","연필"],["🍢","어묵"],["🎫","뽑기 쿠폰"],["🚌","버스 카드"],["⭐","반짝 스티커",1],["🔔","학교 종",1]];
Object.assign(SEED, {park:83, town:89, fun:97, school:101, market:103, river:107, court:109, gym:113});
TREASURE.fun = [["🎈","풍선"],["🎟️","자유이용권"],["🍿","팝콘"],["🧸","인형 경품"],["🎠","목마 열쇠고리",1],["🎆","불꽃 티켓",1]];
TREASURE.school = [["✏️","몽당연필"],["📒","받아쓰기 공책"],["🍎","선생님 사과"],["🎵","리코더"],["📖","어린이 성경",1],["🏅","칭찬 메달",1]];
TREASURE.market = [["🍎","사과"],["🐟","고등어"],["🥞","호떡"],["🌼","국화"],["🪙","엽전",1],["🧧","복주머니",1]];
TREASURE.gym = [["🥽","물안경"],["🩱","수영모"],["🦆","고무 오리"],["⏱️","초시계"],["🥇","금메달",1],["🐬","돌고래 인형",1]];
TREASURE.court = [["🎾","테니스공"],["🧢","선캡"],["🥤","이온음료"],["🏸","셔틀콕",1],["🏆","작은 트로피",1],["🧦","손목 밴드"]];
TREASURE.river = [["🦆","오리"],["🪨","납작 돌"],["🌸","벚꽃잎"],["🐟","물고기"],["🔔","작은 종",1],["🪁","연 꼬리",1]];
const isArea = f => f in AREA;
/* 공원 · 골목 모듈은 따로 불러옴 (없거나 늦어도 게임은 돌아감). 물건 쓰기 키는 앞에 pk_ / tw_ */
const AREA_MOD = {}, PFX = {park:"pk_", town:"tw_", fun:"fn_", school:"sc_", market:"mk_", river:"rv_", court:"ct_", gym:"gy_"};
Promise.all([import("./floor3d_market.js").then(m => AREA_MOD.market = m.MARKET).catch(() => {}), import("./floor3d_river.js").then(m => AREA_MOD.river = m.RIVER).catch(() => {}), import("./floor3d_school.js").then(m => AREA_MOD.school = m.SCHOOL).catch(() => {}), import("./floor3d_fun.js").then(m => AREA_MOD.fun = m.FUN).catch(() => {}), import("./floor3d_park.js").then(m => AREA_MOD.park = m.PARK).catch(() => {}), import("./floor3d_town.js").then(m => AREA_MOD.town = m.TOWN).catch(() => {}), import("./floor3d_gym.js").then(m => AREA_MOD.gym = m.GYM).catch(() => {}), import("./floor3d_court.js").then(m => AREA_MOD.court = m.COURT).catch(() => {})]).then(() => {
  Object.entries(AREA_MOD).forEach(([f, M]) => { if(!M) return;
    try {
      SEATS[f] = (M.seats || []).map(x => x.k === "swing" ? {...x, swing:0.42} : x);
      Object.entries(M.sitLines || {}).forEach(([k, l]) => SIT_YU[k] = SIT_YU[k] ? [...SIT_YU[k], ...l] : l);
      USE[f] = (M.use || []).filter(u => ACTS[PFX[f] + u.k] || AREA_SPECIAL.has(PFX[f] + u.k)).map(u => ({...u, k:PFX[f] + u.k}));
      if(f === "town") USE[f].push({at:BUS.at, k:"tw_bus", h:PI, r:0.6});
    } catch(e){ console.warn("동네 연결", f, e); } });
});
/* 동네 놀이 (ACTS 형식. give = 끝나면 손에 듦, anim = 도는 동안 소품 움직임) */
const AREA_SPECIAL = new Set(["gy_race", "ct_tennis", "ct_wall", "pk_slide", "pk_merry", "tw_gacha", "tw_bell", "tw_bus", "rv_boat", "fn_carousel", "fn_wheel", "fn_coaster", "fn_bumper", "fn_viking"]);
const AREA_PLAY = ["pk_slide", "pk_merry", "pk_seesaw", "pk_sand", "pk_fountain", "pk_duck", "pk_icecream", "tw_gacha", "tw_slime", "tw_tteok", "tw_fishcake", "tw_bungeo", "tw_store", "tw_bell"];
const GACHA = [["🦖", "공룡 피규어"], ["🦄", "유니콘 키링"], ["🐰", "토끼 지우개"], ["💍", "반짝 반지"], ["🚀", "로켓 팽이"], ["🧸", "곰돌이 자석"], ["🌈", "무지개 스티커"], ["👑", "황금 왕관 캡슐", 1]];
const QUIZ = [["사과는 영어로?", ["🍎 애플", "🍌 바나나", "🍇 그레이프"], 0], ["3 + 4 = ?", ["6", "7", "8"], 1], ["무지개는 몇 가지 색?", ["5가지", "6가지", "7가지"], 2],
  ["거미 다리는 몇 개?", ["6개", "8개", "10개"], 1], ["우리나라 수도는?", ["부산", "서울", "제주"], 1], ["펭귄이 사는 곳은?", ["🧊 남극", "🏜️ 사막", "🌴 정글"], 0],
  ["5 × 2 = ?", ["7", "10", "12"], 1], ["올챙이가 크면?", ["🐸 개구리", "🐟 물고기", "🐢 거북이"], 0], ["일주일은 며칠?", ["5일", "7일", "10일"], 1],
  ["해는 어느 쪽에서 떠요?", ["동쪽", "서쪽", "북쪽"], 0], ["한글을 만든 분은?", ["세종대왕", "이순신", "단군"], 0], ["10 - 3 = ?", ["6", "7", "8"], 1],
  ["얼음이 녹으면?", ["💧 물", "🔥 불", "🌪️ 바람"], 0], ["사계절이 아닌 것은?", ["봄", "장마", "겨울"], 1], ["촬영할 때 감독님이 외치는 말은?", ["🎬 액션!", "🍜 라면!", "😴 잘자!"], 0]];
Object.assign(ACTS, {
  pk_seesaw:{ms:6500, lb:["⚖️", "시소"], raw:true, seat:0.42, pose:"horse", say:"연재야 시소 타자! ⚖️", fx:["⬆️", "⬇️", "😆"], mid:"쿵! 엉덩이 아파 😆", done:"⚖️ 놀이터 시소", end:"내가 더 무거운가? 😳",
    anim:t => AREA_MOD.park?.seesaw?.set?.(Math.sin(t * 2.6) * 0.22), npc:["@kid", "올라간다~ 꺅! 😆"]},
  pk_sand:{ms:7500, pose:"play", lb:["🏰", "모래놀이"], say:"모래성 만들어야지 🏰", fx:["🏖️", "🏰", "🐚"], mid:"성 완성! 깃발 꽂자 🚩", done:"🏰 모래성 쌓기", end:"손에 모래 잔뜩 😆"},
  pk_fountain:{ms:5200, go:() => AREA_MOD.park?.fountain?.boost?.(5000), pose:"water", lb:["🪙", "소원 빌기"], say:"동전 던지고 소원 빌어야지 🪙", fx:["🪙", "✨", "💦"], mid:"아빠 드라마 대박 나게 해 주세요 🙏", done:"⛲ 분수에 소원 빌기", end:"소원 꼭 이루어져라~ ✨"},
  pk_duck:{ms:6000, go:() => AREA_MOD.park?.duck?.feed?.(8000), pose:"water", lb:["🦆", "오리 밥 주기"], say:"오리야 이리 와~ 🦆", fx:["🦆", "🍞", "💦"], mid:"꽥꽥! 아기 오리도 왔다 🐥", done:"🦆 연못 오리 밥 주기", end:"오리들 배부르겠다 😊"},
  pk_icecream:{ms:3600, go:() => AREA_MOD.park?.truck?.jingle?.(3600), pose:"drink", lb:["🍦", "아이스크림"], say:"아저씨 딸기맛 주세요! 🍓", fx:["🍦", "🍓", "🍫"], done:"🍦 트럭 아이스크림", end:"차가워서 머리 띵~ 🥶", give:["🍦"], npc:["@ice", "자 여기 제일 큰 걸로! 🍦"]},
  pk_jungle:{ms:4800, pose:"pullup", lb:["🧗", "정글짐"], say:"영차영차 🧗‍♀️", fx:["🧗‍♀️", "💪", "🚩"], mid:"꼭대기 도착! 🚩", done:"🧗 정글짐 꼭대기", end:"내려가는 게 더 무섭다 😳"},
  pk_hop:{ms:5000, pose:"jump", lb:["🦘", "사방치기"], say:"하나, 둘, 셋~ 🦘", fx:["1️⃣", "2️⃣", "3️⃣", "🦘"], mid:"하늘 칸 도착! ☁️", done:"🦘 사방치기", end:"한 발로 서기 힘들다 😆"},
  pk_spring:{ms:5000, raw:true, seat:0.59, pose:"horse", lb:["🐥", "스프링 오리"], say:"이랴이랴~ 🐥", fx:["🐥", "🎶", "😆"], mid:"꽥꽥 오리 타기! 🦆", done:"🐥 스프링 오리 타기", end:"오리야 고마워~ 😊"},
  pk_bubble:{ms:4200, go:u => { AREA_MOD.park?.bubble?.blow?.(u.at[0], u.at[1], u.h ?? PI); }, pose:"play", lb:["🫧", "비눗방울"], say:"후~~ 🫧", fx:["🫧", "✨", "🫧"], mid:"제일 큰 방울! 😆", done:"🫧 비눗방울 불기", end:"하늘까지 날아가라~ 🫧"},
  pk_dog:{ms:3000, pose:"play", lb:["🐶", "멍멍이 동상"], say:"착하다 멍멍아 🐶", fx:["🐶", "💕"], done:"🐶 멍멍이 동상 쓰다듬기", end:"코가 반질반질해 😆"},
  pk_flower:{ms:3200, pose:"stand", lb:["🌷", "꽃 냄새"], say:"음~ 꽃향기 🌷", fx:["🌷", "🌻", "🦋"], mid:"나비다! 🦋", done:"🌷 공원 꽃밭 구경", end:"엄마 주고 싶다 💐"},
  pk_bridge:{ms:3400, pose:"scope", lb:["🌉", "다리 위"], say:"물고기 보인다 🐟", fx:["🐟", "💧", "🐸"], done:"🌉 구름다리 연못 구경", end:"다리 위는 시원해 🍃"},
  pk_picnic:{ms:3800, pose:"drink", lb:["🍙", "도시락"], say:"엄마가 싸 준 도시락~ 🍙", fx:["🍙", "🥪", "🍓"], done:"🧺 돗자리 도시락", end:"배부르다~ 😋", give:["🍙", "🍓"]},
  tw_candy:{ms:3000, pose:"play", lb:["🍬", "불량식품"], say:"쫀드기 하나랑 아폴로! 🍬", fx:["🍬", "🍭"], done:"🍬 문방구 불량식품", end:"엄마한텐 비밀 🤫", give:["🍬", "🍭"]},
  tw_arcade:{ms:4500, pose:"claw", lb:["🕹️", "오락기"], say:"100원 넣고 한 판! 🕹️", fx:["🕹️", "👾", "💥"], mid:"보스 나왔다!! 😱", done:"🕹️ 문방구 앞 오락기", end:"아깝다 한 판만 더… 😭"},
  tw_fridge:{ms:2500, pose:"drink", lb:["🍌", "바나나우유"], say:"바나나우유 하나! 🍌", fx:["🍌", "🥛"], done:"🍌 편의점 바나나우유", end:"쪽쪽 다 마셨다 😋", give:["🥛"]},
  tw_icecream:{ms:3000, pose:"drink", lb:["🍦", "아이스크림"], say:"치즈야 비켜 줘~ 🐱🍦", fx:["🐱", "🍦"], done:"🍦 편의점 아이스크림", end:"치즈도 한 입 줄까? 😆", give:["🍦"]},
  tw_pullup:{ms:4500, pose:"pullup", lb:["💪", "철봉"], say:"매달리기 시작! 💪", fx:["💪", "😤"], count:true, done:"💪 운동장 철봉 매달리기", end:"팔 떨린다~ 😵"},
  tw_goal:{ms:2600, pose:"run", lb:["⚽", "슛!"], say:"슛~ ⚽", fx:["⚽", "🥅", "🎉"], mid:"골인!! 🎉", done:"⚽ 운동장 골대 슛", end:"손흥민 같았지? 😎"},
  tw_podium:{ms:3200, pose:"stand", lb:["🎤", "구령대"], say:"교장 선생님 말씀이 있겠습니다~ 🎤", fx:["🎤", "📢"], mid:"모두 줄 똑바로~ 😆", done:"🎤 구령대 연설", end:"이상입니다! 짝짝짝 👏"},
  tw_hopscotch:{ms:3600, pose:"jump", lb:["🦘", "사방치기"], say:"깽깽이 간다~ 🦘", fx:["1️⃣", "2️⃣", "3️⃣"], mid:"깽깽이 성공! ✨", done:"🦘 골목 사방치기", end:"한 판 더! 😆"},
  rv_pray:{ms:3600, pose:"pray", lb:["🙏", "기도하기"], say:"하나님 감사합니다 🙏", fx:["🙏", "✨", "💛"], mid:"우리 가족 건강하게 지켜 주세요 🙏", done:"🙏 동네 교회 기도", end:"아멘! 😊", go:(u, r) => { r.pray = (r.pray || 0) + 1; }},
  rv_bell:{ms:3200, pose:"pullup", lb:["🔔", "교회 종"], say:"땡그랑~ 🔔", fx:["🔔", "🎶"], mid:"예배 시간이에요! ⛪", done:"🔔 교회 종 치기", end:"소리 멀리까지 간다~ 🎶", go:() => setTimeout(() => AREA_MOD.river?.bell?.ring?.(3200), 1300)},
  rv_fish:{ms:5200, pose:"water", lb:["🎣", "낚시 구경"], say:"할아버지 뭐 잡혀요? 🎣", fx:["🎣", "💧", "🐟"], mid:"할아버지 찌가 움직여요! 😲", done:"🎣 강변 낚시 구경", end:"와 붕어다 🐟", go:() => setTimeout(() => AREA_MOD.river?.fish?.bite?.(2500), 2400), npc:["@fisher", "쉿~ 물고기 도망간다 😄"]},
  rv_kite:{ms:7000, pose:"water", lb:["🪁", "연날리기"], say:"바람아 불어라~ 🪁", fx:["🪁", "🌬️", "☁️"], mid:"제일 높이 날아라! 🪁", done:"🪁 강변 연날리기", end:"연이 구름까지 갔어 😆", anim:t => AREA_MOD.river?.kite?.set?.(Math.min(1, t / 2.5))},
  rv_picnic:{ms:3400, pose:"drink", lb:["🍙", "김밥"], say:"김밥 냠냠 🍙", fx:["🍙", "🍓"], done:"🧺 강변 소풍 김밥", end:"딸기도 먹어야지 🍓", give:["🍙", "🍓"], npc:["@picnic", "많이 먹어~ 😊"]},
  rv_rent:{ms:2600, pose:"stand", lb:["🚲", "자전거 대여"], say:"핑크 자전거 빌려 주세요 🚲", fx:["🚲", "⛑️"], done:"🚲 강변 자전거 대여소", end:"헬멧 꼭 쓰기! ⛑️"},
  rv_ramen:{ms:3800, pose:"drink", lb:["🍜", "강변 라면"], say:"라면 하나요! 🍜", fx:["🍜", "♨️"], mid:"후~ 후~ 🥵", done:"🍜 강변 라면", end:"강변 라면 최고 😋"},
  rv_duck:{ms:5000, pose:"water", lb:["🦆", "오리 밥 주기"], say:"꽥꽥 이리 와~ 🦆", fx:["🦆", "🍞"], done:"🦆 강변 오리 연못", end:"오리 가족이다 🐥", go:() => AREA_MOD.river?.duck?.feed?.(9000)},
  rv_stones:{ms:3000, pose:"water", lb:["🪨", "물수제비"], say:"납작한 돌 찾았다! 🪨", fx:["🪨", "💦"], mid:"통통통! 다섯 번 😆", done:"🪨 강물 물수제비", end:"아빠보다 잘했지? 😎", go:() => setTimeout(() => AREA_MOD.river?.stones?.skip?.(), 900)},
  rv_piano:{ms:4000, pose:"play", lb:["🎹", "교회 피아노"], say:"도레미파솔~ 🎹", fx:["🎵", "🎶"], done:"🎹 교회 피아노", end:"찬양 반주 연습! 🎶"},
  fn_cotton:{ms:3600, pose:"drink", lb:["☁️", "솜사탕"], say:"솜사탕 분홍색 주세요! ☁️", fx:["☁️", "🍭", "💗"], done:"☁️ 놀이공원 솜사탕", end:"입에서 사르르 녹아 😋", give:["🍭"], npc:["@cotton", "자 구름 하나~ ☁️"]},
  fn_churros:{ms:3400, pose:"drink", lb:["🥖", "츄러스"], say:"츄러스 설탕 많이요! ✨", fx:["🥖", "✨"], done:"🥖 놀이공원 츄러스", end:"바삭바삭 달달해 😋", give:["🥖"]},
  fn_balloon:{ms:3500, pose:"stand", lb:["🎈", "풍선"], say:"분홍 풍선 주세요 🎈", fx:["🎈", "💗"], done:"🎈 광대 아저씨 풍선", end:"하늘까지 갈 것 같아 🎈", give:["🎈"], npc:["@clown", "날아가지 않게 꼭 잡아~ 🤡"]},
  fn_ringtoss:{ms:5000, pose:"water", lb:["⭕", "고리 던지기"], say:"고리 세 개 다 넣을 거야 ⭕", fx:["⭕", "🎯"], mid:"들어갔다!! 🎉", done:"⭕ 고리 던지기", end:"곰돌이 받았다 🧸", give:["🧸"]},
  fn_photo:{ms:3200, pose:"stand", lb:["📸", "사진 찍기"], say:"여기서 사진 찍자 📸", fx:["✌️", "💖"], mid:"하나 둘 셋, 김치~ ✌️", done:"📸 크레용랜드 사진", end:"예쁘게 나왔다 💖", go:() => setTimeout(() => window.__ygFlash?.(), 1500)},
  mk_tteokjip:{ms:3400, pose:"drink", lb:["🍡", "떡집"], say:"무지개떡 하나 주세요! 🌈", fx:["🍡", "🌈"], done:"🍡 시장 떡집", end:"쫀득쫀득 😋", give:["🍡"], npc:["@tteok", "말랑할 때 먹어~ 😊"]},
  mk_fruit:{ms:3000, pose:"harvest", lb:["🍎", "과일 가게"], say:"사과 빨갛다 🍎", fx:["🍎", "🍊", "🍓"], done:"🍎 시장 과일 가게", end:"아줌마가 덤으로 귤 주셨어 🍊", give:["🍎", "🍊"]},
  mk_fish:{ms:3200, pose:"stand", lb:["🐟", "생선 구경"], say:"생선 눈이 나 봐 🐟", fx:["🐟", "🦑", "🐙"], done:"🐟 시장 생선 가게", end:"문어가 손 흔들었어! 🐙", npc:["@fishm", "오늘 고등어 싱싱해~ 🐟"]},
  mk_hotteok:{ms:3600, pose:"drink", lb:["🥞", "호떡"], say:"호떡 하나요! 🥞", fx:["🥞", "♨️", "🍯"], done:"🥞 시장 호떡", end:"꿀이 주르륵 🍯", give:["🥞"], npc:["@hotteok", "뜨거우니까 호호 불어~ 😊"]},
  mk_veggie:{ms:3500, pose:"squat", lb:["🥬", "채소 할머니"], say:"할머니 이거 뭐예요? 🥬", fx:["🥬", "🥕", "🥔"], done:"🥬 채소 할머니 돗자리", end:"할머니 감사합니다! 🙇‍♀️", give:["🥕"], npc:["@halmi", "애호박이여, 하나 가져가~ 😊"]},
  mk_flower:{ms:3200, pose:"stand", lb:["🌷", "꽃집"], say:"엄마 드릴 꽃 살래 🌷", fx:["🌷", "🌸", "💐"], done:"🌷 시장 꽃집", end:"향기 좋다~ 🌸", give:["🌷"]},
  mk_ppeong:{ms:5200, pose:"stand", lb:["🍘", "뻥튀기"], say:"뻥튀기 아저씨 언제 터져요? 👂", fx:["👂", "😬", "🍘"], mid:"뻥!!! 😱", done:"🍘 뻥튀기 기계", end:"고소하다~ 🍘", give:["🍘"], anim:t => AREA_MOD.market?.ppeong?.set?.(t)},
  mk_toys:{ms:3200, pose:"play", lb:["🌀", "장난감 좌판"], say:"바람개비 돈다~ 🌀", fx:["🌀", "🪀", "🎈"], done:"🌀 시장 장난감 좌판", end:"풍선도 갖고 싶다… 🎈", give:["🌀", "🪀"]},
  mk_mandu:{ms:3000, pose:"drink", lb:["🥟", "찐만두"], say:"만두 김 모락모락 🥟", fx:["🥟", "♨️"], done:"🥟 시장 찐만두", end:"호호 뜨거워 😋", give:["🥟"]},
  mk_jeon:{ms:3000, pose:"drink", lb:["🍳", "전집"], say:"전 부치는 소리 지글지글 🍳", fx:["🍳", "♨️"], done:"🍳 시장 전집", end:"바삭바삭 😋"},
  mk_donut:{ms:2800, pose:"drink", lb:["🍩", "꽈배기"], say:"꽈배기 설탕 듬뿍! 🍩", fx:["🍩", "✨"], done:"🍩 시장 꽈배기", end:"입에 설탕 묻었다 😆", give:["🍩"]},
  mk_sesame:{ms:2800, pose:"stand", lb:["🫙", "방앗간"], say:"참기름 냄새 고소해~ 🫙", fx:["🫙", "♨️"], done:"🫙 시장 방앗간", end:"엄마 참기름 사 가야지 😊"},
  mk_goguma:{ms:3200, pose:"drink", lb:["🍠", "군고구마"], say:"군고구마 하나요! 🍠", fx:["🍠", "🔥"], done:"🍠 시장 군고구마", end:"호호 뜨거워 😋", give:["🍠"]},
  mk_banchan:{ms:2600, pose:"stand", lb:["🥢", "반찬 가게"], say:"반찬 냄새 좋다~ 🥢", fx:["🥢", "🥒"], done:"🥢 시장 반찬 가게", end:"멸치볶음 맛있겠다 😋"},
  mk_grain:{ms:2600, pose:"stand", lb:["🫘", "곡물 가게"], say:"콩이 알록달록해 🫘", fx:["🫘", "🌾"], done:"🫘 시장 곡물 가게", end:"손 넣어 보고 싶다 😆"},
  sc_board:{ms:4500, pose:"draw", lb:["🖍️", "칠판"], say:"칠판에 그림 그려야지 🖍️", fx:["🖍️", "🌈", "⭐"], mid:"무지개 완성! 🌈", done:"🖍️ 교실 칠판 그림", end:"선생님한테 칭찬받았다 ⭐", go:(u, r) => AREA_MOD.school?.board?.set?.(r.uses?.sc_board ? 2 : 1), npc:["@teach", "우와 유나 그림 잘 그린다! 👏"]},
  sc_piano:{ms:5000, pose:"play", lb:["🎹", "음악실 피아노"], say:"도레미파솔~ 🎹", fx:["🎵", "🎶", "⭐"], mid:"작은 별 쳐야지 ⭐", done:"🎹 음악실 피아노", end:"손가락 아파 😆"},
  sc_xylophone:{ms:4000, pose:"play", lb:["🎶", "실로폰"], say:"딩동댕동~ 🎶", fx:["🎵", "🎶"], done:"🎶 무지개 실로폰", end:"실로폰 소리 예쁘다 😊"},
  sc_drum:{ms:3500, pose:"play", lb:["🥁", "드럼"], say:"쿵짝쿵짝! 🥁", fx:["🥁", "💥", "🎶"], done:"🥁 음악실 드럼", end:"나 밴드 할까? 😎"},
  sc_science:{ms:5000, pose:"cook", lb:["🧪", "과학 실험"], say:"실험 시작! 🧪", fx:["🧪", "🫧", "🔬"], mid:"보글보글 거품 났다! 🫧", done:"🧪 과학실 실험", end:"나 과학자 같지? 🔬", go:() => AREA_MOD.school?.science?.bubble?.(5000)},
  sc_library:{ms:4500, pose:"read", lb:["📚", "도서관"], say:"무슨 책 읽을까~ 📚", fx:["📚", "📖", "✨"], mid:"이거 재밌겠다! 😆", done:"📚 학교 도서관", end:"다 읽고 또 빌려야지 📖"},
  sc_lunch:{ms:3500, pose:"drink", lb:["🍱", "급식"], say:"이모 치킨 마요 많이 주세요! 🍗", fx:["🍱", "🍗", "🥛"], done:"🍱 맛있는 급식", end:"잘 먹겠습니다 🙏", give:["🍱"], npc:["@chef", "유나야 많이 먹어~ 🍗"]},
  sc_track:{ms:8500, pose:"run", lb:["🏃‍♀️", "트랙 달리기"], say:"준비~ 땅! 🏁", fx:["💨", "🏃‍♀️"], mid:"바람 가르는 중! 💨", done:"🏃‍♀️ 운동장 한 바퀴", end:"1등! 🥇", npc:["@coach", "유나 빠르다! 계주 선수다 🏁"], fn:sec => { const p = AREA_MOD.school?.track?.at?.(Math.min(1, sec / 8.3)); return p && [p[0], p[1], 0.4, p[2]]; }},
  sc_bar:{ms:4000, pose:"pullup", lb:["💪", "철봉"], say:"매달리기 10초 도전! 💪", fx:["💪", "😤"], count:true, done:"💪 운동장 철봉", end:"팔이 덜덜 😆"},
  sc_monkey:{ms:4500, pose:"pullup", lb:["🌈", "구름사다리"], say:"구름사다리 건너기! 🌈", fx:["🌈", "💪"], done:"🌈 구름사다리", end:"끝까지 갔다! 😆"},
  sc_ball:{ms:3000, pose:"run", lb:["⚽", "골대 슛"], say:"슛~! ⚽", fx:["⚽", "🥅", "🎉"], mid:"골인!! 🥅", done:"⚽ 운동장 골인", end:"나 축구 선수 할까? 😎",
    anim:t => { const B = AREA_MOD.school?.ball; if(!B) return; if(t === 0){ B.reset?.(); return; } const f = Math.min(1, Math.max(0, (t - 0.7) / 0.6)); B.set?.(21.0 + 1.6 * f, 16.6 - 0.2 * f, 0.12 + Math.sin(f * PI) * 0.35); }},
  sc_flag:{ms:4500, pose:"stand", lb:["🇰🇷", "국기 게양"], say:"국기에 대하여 경례! 🫡", fx:["🇰🇷", "🫡"], done:"🇰🇷 국기 게양", end:"태극기 펄럭펄럭 🇰🇷", anim:t => AREA_MOD.school?.flag?.set?.(t === 0 ? 1 : Math.min(1, t / 4))},
  sc_fishbowl:{ms:3500, pose:"play", lb:["🐟", "금붕어 밥"], say:"금붕어야 밥 먹자 🐟", fx:["🐟", "🫧"], done:"🐟 교실 금붕어 밥 주기", end:"뻐끔뻐끔 귀여워 😆", go:() => AREA_MOD.school?.fish?.feed?.(4000)},
  sc_chapel:{ms:5000, pose:"pray", lb:["🙏", "채플 기도"], say:"하나님 오늘도 감사합니다 🙏", fx:["🙏", "✨", "💛"], mid:"우리 가족 건강하게 지켜 주세요 💕", done:"🙏 학교 채플 기도", end:"아멘! 😊", go:(u, r) => { r.pray = (r.pray || 0) + 1; }, npc:["@chaplain", "유나 기도 예쁘다~ 😊"]},
  tw_slime:{ms:6500, pose:"play", lb:["🫧", "슬라임"], say:"말랑말랑 슬라임 🫧", fx:["🟢", "🫧", "💜"], mid:"쭈욱~ 늘어난다! 😆", done:"🫧 문방구 슬라임", end:"손이 끈적끈적 😝"},
  tw_tteok:{ms:4200, pose:"drink", lb:["🍢", "떡볶이"], say:"이모 떡볶이 1인분이요! 🍢", fx:["🌶️", "🍢", "🔥"], mid:"후~ 맵다 맵다 🥵", done:"🍢 분식집 떡볶이", end:"물! 물 주세요 😵", npc:["@aunt", "덜 맵게 줄게~ 😊"]},
  tw_fishcake:{ms:3600, pose:"drink", lb:["🍥", "어묵 국물"], say:"어묵 하나 먹어야지 🍥", fx:["♨️", "🍥"], done:"🍥 어묵 국물 후루룩", end:"국물이 진국이다~ 😋"},
  tw_bungeo:{ms:3400, pose:"drink", lb:["🐟", "붕어빵"], say:"붕어빵 3개요! 팥으로요 🐟", fx:["🐟", "♨️"], done:"🐟 붕어빵 사 먹기", end:"따끈따끈 🐟", give:["🐟"]},
  tw_store:{ms:3000, pose:"drink", lb:["🏪", "편의점"], say:"뭐 먹지~ 🤔", fx:["🍙", "🥛", "🍫"], done:"🏪 골목 편의점 간식", end:"아빠한텐 비밀 😋", give:["🍙", "🥛", "🍫", "🍬"]}});
Object.assign(USE_LB, {gy_race:["🏊", "50m 수영 시합"], ct_tennis:["🎾", "테니스 치기"], ct_wall:["🧱", "벽치기 연습"], squirt:["💦", "물총 싸움"]});
Object.assign(USE_LB, {pk_slide:["🛝", "미끄럼틀"], pk_merry:["🎠", "뺑뺑이"], tw_gacha:["🎰", "캡슐 뽑기"], tw_bell:["🔔", "학교 종"], rv_boat:["🦢", "오리배"], tw_bus:["🚌", "놀이공원 버스"], fn_carousel:["🎠", "회전목마"], fn_wheel:["🎡", "대관람차"], fn_coaster:["🐛", "애벌레 기차"], fn_bumper:["🚗", "범퍼카"], fn_viking:["🏴‍☠️", "바이킹"]});
const AREA_NPC_TALK = {
  ice:[["아저씨 무슨 맛 있어요?", "딸기, 초코, 바닐라~ 오늘은 메론맛도 있어 🍈", "메론맛 궁금하다!"], ["아저씨 트럭 어디로 가요?", "해 지면 강가 공원으로 가지 🚚", "나도 데려가 주세요 😆"]],
  kid:[["연재야 뭐 해?", "개미 구경! 이거 봐 🐜", "우와 줄 서서 간다!"], ["같이 그네 탈래?", "좋아! 누가 더 높이 가나 시합 😎", "내가 이길걸?"], ["너 숙제 했어?", "아… 아직 😱", "나도 😅"]],
  aunt:[["이모 오늘 뭐 맛있어요?", "오늘은 치즈 떡볶이! 🧀", "우와 그거 주세요!"], ["이모 학생들 언제 와요?", "3시 되면 우르르 몰려와 😆", "그때 엄청 바쁘겠다!"]],
  gran:[["할머니 새로 들어온 거 있어요?", "반짝이 스티커 새로 왔단다 ✨", "우와 보여 주세요!"], ["할머니 이거 얼마예요?", "500원~ 유나는 단골이니까 덤 하나 😊", "할머니 최고!"]],
  teach:[["선생님 방학 언제예요?", "유나는 방학만 기다리는구나? 😆", "헤헤 😅"], ["선생님 저 그림 잘 그렸어요!", "다음 미술 시간에 꼭 보여 줘 🎨", "네!"]],
  staff:[["언니 회전목마 몇 번 타도 돼요?", "줄만 다시 서면 계속~ 😆", "열 번 탈래요!"], ["제일 무서운 거 뭐예요?", "바이킹 맨 끝자리! 🏴‍☠️", "으… 도전해 볼까 😳"]],
  cotton:[["솜사탕은 어떻게 만들어요?", "설탕이 구름이 되는 마법이지 ☁️", "우와 신기해!"], ["무지개 솜사탕도 있어요?", "비밀 메뉴야~ 쉿 🌈", "헤헤 비밀!"]],
  clown:[["아저씨 코 진짜예요?", "빨간 코는 웃음 버튼이야~ 빵! 🤡", "꺄하하 😆"], ["풍선으로 강아지 만들어 줘요!", "뽀득뽀득~ 짜잔 멍멍이 🐩", "우와 귀여워!"]],
  pastor:[["목사님 안녕하세요!", "유나 왔구나~ 오늘도 하나님이 유나를 사랑하신단다 😊", "저도 하나님 사랑해요!"], ["주일에 성가대 해도 돼요?", "그럼~ 유나 목소리 예뻐서 대환영이야 🎶", "와 신난다!"]],
  fisher:[["할아버지 오늘 몇 마리 잡았어요?", "아직 한 마리… 쉿, 물고기 듣는다 🎣", "쉿~ 🤫"], ["낚시 재밌어요?", "기다리는 게 재미지 허허 😊", "저는 기다리는 거 어려운데 😅"]],
  boatman:[["오리배는 몇 명 타요?", "엄마 아빠랑 셋이 딱이야 🦢", "다음엔 같이 와야지!"], ["강에 물고기 많아요?", "잉어가 이만~ 하게 커 🐟", "우와 상어만 해요?"]],
  picnic:[["뭐 드세요?", "엄마표 김밥이야~ 하나 먹어 볼래? 🍙", "감사합니다!"], ["여기 자주 오세요?", "날 좋으면 매주 와~ 바람이 좋거든 🍃", "저도 좋아요!"]],
  chef:[["오늘 점심 뭐예요?", "유나가 좋아하는 카레야 🍛", "야호!"], ["반찬 남기면 안 돼요?", "한 입만 먹어 보자~ 😊", "네… 노력할게요 😅"]],
  coach:[["선생님 저 달리기 빨라요?", "운동회 계주 선수 해야겠다! 🏃‍♀️", "진짜요? 😆"], ["피구 언제 해요?", "금요일 체육 시간에! ⚽", "기대된다!"]],
  classmate:[["서아야 뭐 해?", "공기놀이! 같이 할래? 😊", "좋아!"], ["숙제 다 했어?", "응! 너는? 😏", "어… 이따 할 거야 😅"]],
  chaplain:[["목사님 기도는 어떻게 해요?", "하나님께 편지 쓰듯 말하면 돼 🙏", "아 그렇구나!"], ["예배 때 무슨 노래 불러요?", "'예수 사랑하심은'~ 같이 부를래? 🎶", "네!"]],
  halmi:[["할머니 이거 뭐예요?", "햇감자란다~ 쪄 먹으면 꿀맛이야 🥔", "맛있겠다!"], ["할머니 이거 직접 키웠어요?", "그럼~ 할미 밭에서 왔지 😊", "우와!"]],
  tteok:[["사장님 무슨 떡이 제일 맛있어요?", "꿀떡! 톡 터진단다 🍡", "꿀떡 주세요!"], ["떡은 몇 시에 만들어요?", "새벽 네 시부터~ 😴", "엄청 일찍이다!"]],
  fishm:[["아저씨 이 물고기 이름 뭐예요?", "고등어! 등이 파랗지? 🐟", "반짝반짝해요!"], ["오징어는 다리가 몇 개예요?", "열 개! 세어 볼래? 🦑", "하나 둘 셋…"]],
  v1:[["할머니 안녕하세요!", "아이고 예쁜 아가씨네~ 몇 학년이니? 😊", "3학년이에요!"]], v2:[["오빠 어디 가요?", "학원! 수학 학원 😩", "화이팅!"]],
  v3:[["언니 회사 가요?", "응~ 유나 아빠 회사 옆이야 ☕", "우와 이웃이다!"]], v4:[["아저씨 우리 집 택배도 있어요?", "음… 유나네는 내일 와~ 📦", "기다릴게요!"]],
  v5:[["강아지 이름 뭐예요?", "뭉치! 만져 봐도 돼 🐕", "털이 보들보들해!"]], v6:[["안녕? 몇 살이야?", "네 살! 언니는? 😆", "나는 언니지~"]],
  v7:[["할아버지 운동하세요?", "그럼~ 매일 만 보! 💪", "저도 따라 할래요!"]], v8:[["언니 대학생이에요?", "응~ 영상 공부해 🎬", "우리 아빠 웹드라마 감독인데!"]],
  v9:[["아기 이름 뭐예요?", "콩이야~ 쉿 자고 있어 👶", "쉿~ 🤫"]], v10:[["안녕! 너 옆 반이지?", "응! 쉬는 시간에 같이 놀자 😆", "좋아!"]],
  hotteok:[["이모 호떡 하나 주세요!", "뜨거우니까 호호 불어 먹어 🥞", "네!"], ["호떡 안에 뭐 들었어요?", "흑설탕이랑 땅콩~ 꿀처럼 흘러 🍯", "침 나온다 🤤"]]};
const AREA_GREET = {gym:["유나 수영하러 왔구나~ 🏊", "수영장에선 뛰지 말고 걸어요~", "4번 레인 옆에서 시합할 수 있어 🏁"], court:["유나 왔구나~ 라켓 하나 빌려 줄까? 🎾", "공 바구니에서 공 꺼내 쓰면 돼~", "실내라서 비 와도 칠 수 있어 ☔"], fun:["크레용랜드에 온 걸 환영해요~ 🎡", "자유이용권 손목에 잘 찼니? 🎟️", "풍선 하나 줄까? 🎈"], river:["유나 왔구나~ 강바람 시원하지? 🌊", "오리배 타러 왔니? 🦢", "교회 종소리 들었니? 🔔"],
  school:["유나야 안녕~ 오늘도 즐거운 학교! 🏫", "복도에서 뛰지 않기~ 🚶‍♀️", "샬롬~ 반가워 😊"], market:["어서 와~ 뭐 줄까? 🧺", "유나 왔네~ 덤 줄게! 😊", "시장 구경 왔구나~ 🍎"], park:["유나 안녕~ 산책 왔니? 🌳", "놀이터 사람 많다~ 🛝", "강아지 조심해~ 🐕"], town:["유나 왔구나~ 떡볶이 먹으러 왔니? 🍢", "어서 와~ 문방구 새 스티커 들어왔어 ✨", "학교 앞이라 차 조심해 🚸"]};
Object.assign(GREET, AREA_GREET);
Object.assign(FR_TALK, {gym:["50m 수영장이다! 엄청 길다 😲", "나랑 시합할래? 🏊"], court:["나 테니스 학원 다닌다~ 한 판 할래? 😎", "공 바구니 저기 있다! 🎾"], fun:["놀이공원이다!!! 🎡", "회전목마 같이 타자 🎠"], river:["오리배 타고 싶다 🦢", "연 날리자! 🪁"], school:["우리 교실 가 볼래? 🏫", "급식 냄새 난다 😋"], market:["호떡 냄새 좋다~ 🥞", "떡 사 먹자! 🍡"], park:["놀이터다!! 미끄럼틀 타자 🛝", "아이스크림 트럭 있어! 🍦"], town:["문방구 뽑기 하고 싶다 🎰", "떡볶이 냄새 좋다~ 🍢"]});
CHATS.fun = [["관람차 꼭대기 무서워요?", "하나도 안 무서워~ 동네가 다 보여 🎡", "타 봐야지!"], ["퍼레이드 몇 시예요?", "저녁 7시에 불꽃놀이도 해 🎆", "우와 보고 갈래요!"]];
CHATS.gym = [["50m는 얼마나 길어요?", "버스 네 대 줄 세운 만큼 🚌", "우와 길다!"], ["레인 줄은 왜 있어요?", "옆 사람 물결에 안 밀리게 잡아 줘 🌊", "그렇구나~"]];
CHATS.court = [["테니스 어려워요?", "공만 잘 보면 금방 늘어 🎾", "저 공 잘 봐요!"], ["0점을 왜 러브라고 해요?", "옛날 말로 '빵점'이 달걀 모양이라 그렇대 🥚", "신기하다~"]];
CHATS.river = [["강물은 어디로 가요?", "바다까지 간단다 🌊", "멀리 가네~"], ["교회는 언제 가요?", "주일 아침 11시~ 🔔", "저도 갈래요!"]];
CHATS.school = [["몇 학년이에요?", "6학년! 유나는? 😊", "저는 아직 꼬마예요 😆"], ["오늘 예배 시간에 뭐 했어요?", "다윗과 골리앗 이야기 들었어 🙏", "우와 용감하다!"]];
CHATS.market = [["시장 몇 시까지 해요?", "해 질 때까지~ 🌅", "알겠어요!"], ["뭐가 제일 싸요?", "오늘은 딸기! 한 바구니 덤 🍓", "엄마한테 말해야지!"]];
CHATS.park = [["여기 오리 이름 있어요?", "꽥꽥이랑 뒤뚱이야 🦆", "귀엽다~"], ["분수 언제 나와요?", "매시 정각에 춤추듯 나와 ⛲", "우와 보고 싶다!"]];
CHATS.town = [["학교 끝나면 뭐 해요?", "떡볶이 먹고 문방구 가야지 🍢", "나도요! 😆"], ["버스 언제 와요?", "곧 와~ 줄 서자 🚌", "넵!"]];
BGM.park = {bpm:100, lead:"triangle", lv:0.1, soft:true, ch:[[43,59,62,67],[40,55,60,64],[36,55,60,64],[38,57,62,66]],
  mel:[79,-1,76,-1, 74,76,79,-1,  81,-1,79,-1, 76,-1,-1,-1,  72,-1,74,76, 79,-1,81,-1,  79,-1,76,74, 76,-1,-1,-1,
       79,-1,83,-1, 81,79,76,-1,  74,-1,76,-1, 79,-1,-1,-1,  81,-1,79,76, 74,-1,72,-1,  74,-1,76,-1, 72,-1,-1,-1]};
BGM.town = {bpm:112, lead:"square", lv:0.05, ch:[[41,57,60,65],[43,59,62,67],[40,55,60,64],[45,57,60,64]],
  mel:[72,74,76,-1, 77,-1,76,-1,  74,-1,72,-1, 69,-1,-1,-1,  72,74,76,-1, 79,-1,77,-1,  76,-1,74,-1, 72,-1,-1,-1,
       77,-1,77,79, 81,-1,79,-1,  77,-1,76,-1, 74,-1,-1,-1,  76,-1,77,-1, 79,-1,76,-1,  74,-1,72,74, 72,-1,-1,-1]};
BGM.fun = {bpm:132, lead:"square", lv:0.05, ch:[[48,60,64,67],[45,60,64,69],[41,60,65,69],[43,59,62,67]],
  mel:[72,76,79,-1, 84,-1,79,-1,  81,-1,77,-1, 79,-1,-1,-1,  76,77,79,-1, 72,-1,76,-1,  74,-1,71,-1, 72,-1,-1,-1,
       79,-1,81,79, 77,-1,76,-1,  77,-1,79,77, 76,-1,74,-1,  72,76,79,84, 83,-1,81,-1,  79,-1,74,76, 72,-1,-1,-1]};
BGM.river = {bpm:80, lead:"sine", lv:0.12, soft:true, bell:true, ch:[[43,59,62,67],[40,55,59,64],[36,55,60,64],[38,57,62,66]],
  mel:[74,-1,-1,71, 74,-1,79,-1,  76,-1,-1,-1, 74,-1,-1,-1,  72,-1,71,-1, 69,-1,67,-1,  69,-1,-1,-1, -1,-1,-1,-1,
       74,-1,-1,71, 74,-1,79,-1,  81,-1,79,-1, 76,-1,-1,-1,  74,-1,72,-1, 71,-1,69,-1,  67,-1,-1,-1, -1,-1,-1,-1]};
BGM.school = {bpm:108, lead:"triangle", lv:0.1, ch:[[48,60,64,67],[41,57,60,65],[43,55,59,62],[48,55,60,64]],
  mel:[67,-1,67,69, 67,-1,64,-1,  67,-1,67,69, 67,-1,64,-1,  67,-1,64,-1, 62,-1,64,-1,  60,-1,-1,-1, -1,-1,-1,-1,
       67,-1,67,69, 67,-1,64,-1,  67,-1,64,-1, 62,-1,64,-1,  60,-1,62,-1, 64,-1,62,-1,  60,-1,-1,-1, -1,-1,-1,-1]};
BGM.market = {bpm:100, lead:"triangle", lv:0.1, ch:[[45,57,60,64],[43,55,59,62],[41,57,60,65],[40,55,59,64]],
  mel:[69,-1,72,-1, 74,-1,76,-1,  74,72,69,-1, 67,-1,69,-1,  72,-1,74,-1, 76,-1,79,76,  74,-1,-1,-1, -1,-1,-1,-1,
       76,-1,79,-1, 81,-1,79,76,  74,-1,72,74, 76,-1,-1,-1,  72,-1,69,-1, 67,-1,64,-1,  69,-1,-1,-1, -1,-1,-1,-1]};
QUESTS.push(
  {id:"funday", e:"🎡", t:"놀이공원 하루", steps:[
    {f:"fun", use:"fn_carousel", lb:"회전목마", hint:"크레용랜드 회전목마 타기"},
    {f:"fun", use:"fn_cotton", lb:"솜사탕", hint:"솜사탕 수레에서 하나 받기"},
    {f:"fun", use:"fn_wheel", lb:"대관람차", hint:"대관람차 꼭대기에서 동네 보기"}]},
  {id:"schoolday", e:"🏫", t:"학교 가는 날", steps:[
    {f:"school", talk:"@teach", lb:"선생님께 인사", hint:"크레용초등학교 3학년 1반 선생님께", yu:"선생님 안녕하세요! 🙇‍♀️", re:"유나 왔구나~ 오늘은 칠판에 그림 그려 볼까? 🖍️"},
    {f:"school", use:"sc_board", lb:"칠판 그림", hint:"교실 칠판에 그림 그리기"},
    {f:"school", use:"sc_lunch", lb:"급식 먹기", hint:"급식실에서 점심 받기"},
    {f:"school", use:"sc_chapel", lb:"채플 기도", hint:"채플실 강대상 앞에서 기도"}]},
  {id:"errand", e:"🧺", t:"엄마 시장 심부름", steps:[
    {f:"s4", talk:"@mom", lb:"엄마한테", hint:"4층 엄마한테 가기", yu:"엄마 저 심부름 갈래요! 🧺", re:"그럼 시장 가서 떡이랑 사과 좀 사 올래? 🍎"},
    {f:"market", use:"mk_tteokjip", lb:"떡 사기", hint:"시장 떡집에서 떡 사기"},
    {f:"market", use:"mk_fruit", lb:"사과 사기", hint:"과일 가게에서 사과 사기"},
    {f:"s4", talk:"@mom", lb:"엄마한테 드리기", hint:"엄마한테 갖다드리기", yu:"엄마 다녀왔어요! 🍎🍡", re:"우와 우리 유나 다 컸네~ 같이 먹자 😊"}]},
  {id:"sunday", e:"⛪", t:"주일 아침", steps:[
    {f:"river", talk:"@pastor", lb:"목사님께 인사", hint:"강변 동네 교회 목사님께", yu:"목사님 안녕하세요! 🙏", re:"유나 왔구나~ 오늘 예배 같이 드리자 😊"},
    {f:"river", use:"rv_bell", lb:"종 치기", hint:"교회 종탑 줄 당기기"},
    {f:"river", use:"rv_pray", lb:"기도하기", hint:"강대상 앞에서 기도"}]},
  {id:"icecream", e:"🍦", t:"아이스크림 트럭", steps:[
    {f:"park", talk:"@ice", lb:"아이스크림 사기", hint:"동네 공원 아이스크림 트럭으로", yu:"아저씨 딸기맛 두 개 주세요! 🍓", re:"자 여기~ 녹기 전에 먹어 🍦", got:"🍦",
      make:{ms:3200, wait:"잠깐만~ 제일 큰 걸로 줄게 😊", txt:"아이스크림 담는 중", fx:["🍦", "🍓", "🍫", "✨"]}},
    {f:"park", talk:"@kid", lb:"연재랑 나눠 먹기", hint:"놀이터 연재한테 하나 주기", yu:"연재야 하나 먹어! 🍦", re:"우와 고마워! 대신 내가 그네 밀어 줄게 😆"}]},
  {id:"tteok", e:"🍢", t:"아빠 간식 떡볶이 포장", steps:[
    {f:"town", talk:"@aunt", lb:"떡볶이 포장", hint:"학교 앞 골목 분식집 이모한테", yu:"이모 떡볶이 포장이요! 아빠 거예요 🍢", re:"순대도 서비스로 넣었어 😉", got:"🍢",
      make:{ms:3600, wait:"아빠 회사 간다고? 따끈하게 싸 줄게~", txt:"떡볶이 포장 중", fx:["🍢", "🌶️", "♨️", "🥡"]}},
    {f:"main", talk:"@dad", lb:"아빠한테 배달", hint:"2층 대표실 아빠한테 갖다드리기", yu:"아빠! 떡볶이 배달 왔어요 🍢", re:"우와 학교 앞 그 집 떡볶이? 우리 딸 센스 최고 😆"}]},
  {id:"supply", e:"📄", t:"선생님 심부름", steps:[
    {f:"town", talk:"@teach", lb:"선생님한테", hint:"학교 앞 골목 선생님한테", yu:"선생님 안녕하세요! 🙇‍♀️", re:"유나야 마침 잘 왔다~ 문방구에서 색종이 좀 사다 줄래? 📄"},
    {f:"town", talk:"@gran", lb:"색종이 사기", hint:"문방구 할머니한테 색종이", yu:"할머니 색종이 주세요! 선생님 심부름이에요 📄", re:"착하기도 하지~ 사탕 하나는 덤 🍬", got:"📄",
      make:{ms:2800, wait:"어디 보자~ 무지개 색종이가…", txt:"색종이 찾는 중", fx:["📄", "🌈", "✂️"]}},
    {f:"town", talk:"@teach", lb:"갖다드리기", hint:"선생님한테 색종이 드리기", yu:"선생님 색종이 사 왔어요! 📄", re:"고마워 유나야! 칭찬 스티커 하나 ⭐"}]},
  {id:"bubble", e:"🫧", t:"공원 비눗방울 터뜨리기", steps:[
    {f:"park", game:"bubble", lb:"비눗방울", hint:"떠다니는 비눗방울 다 터뜨리기 · 높은 건 점프!"}]},
  {id:"quiz", e:"📝", t:"선생님 깜짝 퀴즈", steps:[
    {f:"town", talk:"@teach", lb:"선생님한테", hint:"학교 앞 골목 선생님한테", yu:"선생님! 퀴즈 내 주세요 📝", re:"좋아~ 5문제! 다 맞히면 선생님이 칭찬해 줄게 😊"},
    {f:"town", game:"quiz", lb:"퀴즈 풀기", hint:"5문제 맞히기"}]},
  {id:"bday", e:"🎂", t:"연재 생일 몰래 축하", steps:[
    {f:"park", talk:"@kid", lb:"연재한테", hint:"동네 공원 놀이터 연재한테", yu:"연재야 왜 시무룩해? 😮", re:"오늘 내 생일인데… 다들 까먹었나 봐 😢"},
    {f:"town", talk:"@gran", lb:"생일 카드", hint:"학교 앞 골목 문방구에서 카드 사기", yu:"할머니 생일 카드 주세요! 제일 반짝이는 걸로요 💌", re:"친구 생일이구나? 리본도 달아 줄게 🎀", got:"💌",
      make:{ms:3000, wait:"반짝이 카드가 어디 있더라~", txt:"카드 고르는 중", fx:["💌", "🎀", "✨"]}},
    {f:"town", talk:"@aunt", lb:"생일 떡볶이", hint:"분식집 이모한테 떡볶이 케이크", yu:"이모! 떡볶이로 케이크 만들어 주실 수 있어요? 🎂", re:"떡볶이 케이크 완성! 초는 서비스 🕯️", got:"🎂",
      make:{ms:3800, wait:"그런 건 처음인데… 이모가 해 볼게! 😆", txt:"떡볶이 케이크 만드는 중", fx:["🍢", "🎂", "🕯️", "✨"]}},
    {f:"park", talk:"@kid", lb:"생일 축하!", hint:"공원으로 가서 연재 깜짝 축하", yu:"연재야~ 생일 축하해!! 🎂🎉", re:"우와… 떡볶이 케이크?! 최고의 생일이야 유나야 🥹"}]});
BADGES.push(["town", "🏘️", "동네 놀이 전부", r => AREA_PLAY.every(k => r.uses?.[k])], ["gacha", "🎰", "뽑기 도감 완성", r => cnt(r.gacha || {}) >= GACHA.length],
  ["quiz", "📝", "퀴즈 다 맞히기", r => (r.quizBest || 0) >= 5], ["bday", "🎂", "연재 생일 축하", r => r.done.bday],
  ["rides", "🎢", "놀이기구 다 타기", r => ["fn_carousel", "fn_wheel", "fn_coaster", "fn_bumper", "fn_viking"].every(k => r.uses?.[k])],
  ["market", "🧺", "시장 먹거리 다섯 가지", r => ["mk_tteokjip", "mk_hotteok", "mk_mandu", "mk_donut", "mk_goguma", "mk_fruit", "mk_ppeong"].filter(k => r.uses?.[k]).length >= 5],
  ["school", "🏫", "학교 구석구석", r => Object.keys(r.uses || {}).filter(k => k.startsWith("sc_")).length >= 8],
  ["village", "🗺️", "마을 여섯 곳 다 가 보기", r => ["park", "town", "fun", "school", "market", "river"].every(k => r.vis?.[k])],
  ["boat", "🦢", "강변 오리배", r => r.uses?.rv_boat]);
Object.assign(SEATS, HOME.seats);
Object.entries(HOME.sitLines).forEach(([k, l]) => SIT_YU[k] = SIT_YU[k] ? [...SIT_YU[k], ...l] : l);   // 소파·그네는 원래 대사에 더함
BGM.home1 = {bpm:84, lead:"sine", lv:0.12, soft:true, bell:true, ch:[[41,57,60,64],[36,55,60,64],[38,57,62,65],[43,55,59,62]],
  mel:[72,-1,74,76, -1,-1,72,-1,  69,-1,72,-1, 67,-1,-1,-1,  72,-1,74,76, 79,-1,76,-1,  74,-1,-1,72, 74,-1,-1,-1]};
BGM.home2 = BGM.home3 = BGM.home1;
BGM.home4 = {...BGM.home1, bpm:76};
const isHome = f => /^home\d$/.test(f || "");
/* 집 오가는 길: 로비 횡단보도 건너편 ↔ 집 대문, 집 계단. 들어올 때만 (스폰 자리가 바로 옆이라) */
const AREA_GO = {park:["놀이터 가자~ 🛝", "공원 산책 가야지 🌳"], town:["문방구 구경 가자~ ✏️", "떡볶이 먹으러 가자! 🍢"], fun:["놀이공원이다!!! 🎡", "회전목마 타러 가자~ 🎠"],
  school:["학교 가자~ 🏫", "우리 교실 보여 줄게! ✏️"], market:["시장 구경 가자~ 🧺", "호떡 먹으러 가자! 🥞"], river:["강가 산책 가자~ 🌊", "연 날리러 가자! 🪁"], gym:["수영하러 가자~ 🏊", "50m 시합 하자! 🏁"], court:["테니스 치러 가자~ 🎾", "아빠랑 한 게임! 🎾"]};
const WALKS = [{f:"lobby", at:[17.6, 28.6], r:0.7, to:"home1", spawn:HOME.spawnGate},
  {f:"home1", at:HOME.gate, r:0.45, to:"lobby", spawn:[17.6, 28.2, Math.PI]},
  ...HOME.stairs.map(t => ({...t, r:0.45})),
  ...Object.entries(AREA).flatMap(([k, a]) => a.lobbyAt ? [{f:"lobby", at:a.lobbyAt, r:0.7, to:k, spawn:a.spawn}, {f:k, at:a.gate, r:0.55, to:"lobby", spawn:a.back}] : []), ...LINKS];
/* 다른 층 할 일이면 어디로 가야 하는지 (집에선 엘리베이터 대신 계단·대문) */
function wayOut(f, to){
  if(isHome(f)){ const a = +f[4], b = isHome(to) ? +to[4] : 0;
    const w = WALKS.find(t => t.f === f && (b > a ? t.to === "home" + (a + 1) : a === 1 ? t.to === "lobby" : t.to === "home" + (a - 1)));
    return w ? w.at : null; }
  if(isArea(f) || isArea(to) || (isHome(to) && f === "lobby")){   // 걸어서 이어진 길을 따라 첫 걸음 (없으면 엘리베이터)
    const tower = x => !isHome(x) && !isArea(x), node = x => tower(x) && x !== "lobby" ? "tower" : x, goal = node(isHome(to) ? "home1" : to);
    const seen = new Set([node(f)]), q = [[node(f), null]];
    while(q.length){ const [n, first] = q.shift(); if(n === goal) return first || ELEV;
      const out = WALKS.filter(w => node(w.f) === n && !isHome(w.f) || (isHome(n) && w.f === "home1" && n === "home1")).map(w => [node(w.to), w.at]);
      if(n === "tower") out.push(["lobby", ELEV]); if(n === "lobby") out.push(["tower", ELEV]);
      for(const [m, at] of out) if(!seen.has(m)){ seen.add(m); q.push([m, first || at]); } }
    return isArea(f) ? AREA[f].gate : ELEV; }
  if(isHome(to)) return ELEV;
  return ELEV;
}
function bgmFloor(f){ const k = BGM[f] ? f : "main"; if(AU.trk !== k){ AU.trk = k; AU.step = 0; } }
function bgmPump(){
  const c = AU.ctx; if(!c) return; const pn = performance.now();
  if(c.state === "running" && !document.hidden){ if(c.currentTime !== AU.ct){ AU.ct = c.currentTime; AU.ctAt = pn; } else if(pn - AU.ctAt > 1500) AU.stuck = true; } else AU.ctAt = pn;   // 켜져 있다는데 시계가 1.5초 넘게 멈춤 = 조용히 죽은 것
  if(c.state !== "running"){ AU.next = c.currentTime + 0.1; return; }
  const T = BGM[AU.trk] || BGM.main, e8 = 60 / T.bpm / 2;
  while(AU.next < c.currentTime + 0.35){
    const t = AU.next, s = AU.step % 64, ch = T.ch[(s >> 3) % T.ch.length], b8 = s % 8;
    if(AU.on){
      if(b8 === 0 || b8 === (T.soft ? 5 : 4)) tone(mtof(ch[0]), t, e8 * 1.8, {type:"triangle", vol:0.22, out:AU.bgm});
      if(b8 % 2 === 1){ ch.slice(1).forEach(n => tone(mtof(n), t, e8 * (T.soft ? 1.6 : 0.9), {vol:T.soft ? 0.035 : 0.045, out:AU.bgm})); if(!T.soft) hiss(t, 0.04, {vol:0.05, f:7000, q:0.7, out:AU.bgm}); }
      const m = T.mel[s]; if(m > 0){ tone(mtof(m), t, e8 * (T.bell ? 2.6 : 1.6), {type:T.lead, vol:T.lv, out:AU.bgm}); if(T.bell) tone(mtof(m + 12), t, e8 * 1.2, {vol:T.lv * 0.25, out:AU.bgm}); }
    }
    AU.next += e8; AU.step++;
  }
}

export function start(api){
  if(!document.getElementById("yg-css")){ const st = document.createElement("style"); st.id = "yg-css"; st.textContent = CSS; document.head.append(st); }
  const root = document.createElement("div"); root.className = "yg";
  root.innerHTML = `
    <div class="yg-top"><button class="yg-card" type="button" aria-label="할 일 고르기"><span class="yg-star">⭐ 0</span><span class="yg-bag" hidden title="들고 있는 것"></span><span class="yg-ct"><b>할 일 고르기</b><span>눌러서 할 일·놀이 고르기</span><span class="yg-steps" hidden></span></span></button>
      <button class="yg-x yg-mapb" type="button" aria-label="마을 지도">🗺️</button><button class="yg-x yg-snd" type="button" aria-label="소리 켜기·끄기">🔊</button><button class="yg-x" type="button" aria-label="유나 모드 끝내기">✕</button></div>
    <div class="yg-map" hidden></div>
    <div class="yg-hud" hidden></div>
    <div class="yg-make" hidden><span class="e"></span><b></b><span class="bar"><i></i></span></div>
    <div class="yg-arrow" hidden><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></div>
    <div class="yg-help">왼쪽 동그라미로 걷기 · 화면 끌면 둘러보기 · 높은 보물은 점프</div>
    <div class="yg-joy" aria-label="걷기"><i></i></div>
    <button class="yg-jump" type="button" aria-label="점프"><span><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V6M6 11l6-6 6 6"/></svg></span><b>점프</b></button>
    <button class="yg-run" type="button" aria-label="달리기"><span>🏃‍♀️</span><b>달리기</b></button>
    <button class="yg-act" type="button" hidden><span>💬</span><b>말 걸기</b></button>
    <div class="yg-tn" hidden><button class="d" type="button" data-s="drive" aria-label="강타"><span>🔥</span><b>강타</b></button><button class="l" type="button" data-s="lob" aria-label="로브"><span>🌙</span><b>로브</b></button><button class="p" type="button" data-s="drop" aria-label="드롭"><span>🪶</span><b>드롭</b></button></div>
    <div class="yg-tm" aria-hidden="true"></div>
    <div class="yg-elev" hidden></div>
    <div class="yg-elev yg-fit" hidden></div>
    <div class="yg-toast"></div>
    <div class="yg-panel" hidden></div>
    <div class="yg-night"></div>
    <div class="yg-grill" hidden><span class="m">🥩</span><b></b><span class="bar"><em></em><i></i></span></div>
    <div class="yg-lb"></div><div class="yg-chap"><small></small><b></b></div>
    <div class="yg-cred" hidden></div>
    <div class="yg-pick" hidden></div>
    <div class="yg-flash"></div>
    <div class="yg-fade on">유나 모드 준비 중… 🎀</div>`;
  api.host.append(root);
  const $ = s => root.querySelector(s);
  const runB = $(".yg-run"), sndB = $(".yg-snd"); sndB.textContent = AU.on ? "🔊" : "🔇";
  /* 테니스 샷 버튼 (2026-11-28 감독님 "기술같은게 없네… 치는방향도 못 정하고"): 누르고 옆으로 끌면 그쪽으로, 떼면 침 */
  const tnPad = $(".yg-tn"); let tnPtr = null;
  tnPad.querySelectorAll("button").forEach(bt => {
    bt.addEventListener("pointerdown", ev => { ev.preventDefault(); ev.stopPropagation(); try { bt.setPointerCapture(ev.pointerId); } catch(e){} tnPtr = {id:ev.pointerId, x:ev.clientX, aim:0}; bt.classList.add("on"); });
    bt.addEventListener("pointermove", ev => { if(!tnPtr || tnPtr.id !== ev.pointerId) return; const dx = ev.clientX - tnPtr.x, a = dx < -16 ? -1 : dx > 16 ? 1 : 0; if(a !== tnPtr.aim){ tnPtr.aim = a; if(a) bt.dataset.aim = a; else delete bt.dataset.aim; } });
    const up = ev => { if(!tnPtr || tnPtr.id !== ev.pointerId) return; const a = tnPtr.aim; tnPtr = null; bt.classList.remove("on"); delete bt.dataset.aim; if(ev.type === "pointerup") tnPress(bt.dataset.s, a || null); };
    bt.addEventListener("pointerup", up); bt.addEventListener("pointercancel", up); });
  /* 타이밍 판정 글씨 (2026-11-28 감독님 "타이밍도 섬세하게 해야 재밌지"): PERFECT · GOOD · 빨라요 · 늦어요 */
  const tmEl = $(".yg-tm");
  function tmShow(g, txt, sub){ tmEl.dataset.g = g; tmEl.textContent = txt; if(sub){ const s = document.createElement("small"); s.textContent = sub; tmEl.append(s); } tmEl.classList.remove("go"); void tmEl.offsetWidth; tmEl.classList.add("go"); }
  sndB.onclick = ev => { ev.stopPropagation(); auSet(!AU.on); auInit(); sndB.textContent = AU.on ? "🔊" : "🔇"; };
  /* 마을 지도 (2026-11-24 감독님 "큰 마을이면 좋겠네"): 어디 있는지 보이고, 누르면 그쪽으로 걸어감 */
  const mapEl = $(".yg-map"), mapB = $(".yg-mapb");
  const TOWER_F = ["lobby", "main", "wf", "s4", "roof"];
  const MAP_T = [["gym", 10, 80], ["court", 30, 82], ["river", 10, 50], ["park", 29, 50], ["tower", 50, 46], ["town", 70, 50], ["market", 90, 50], ["school", 66, 16], ["fun", 90, 16], ["home", 50, 84]];
  const MAP_R = [["river", "gym"], ["gym", "court"], ["river", "park"], ["park", "tower"], ["tower", "town"], ["town", "market"], ["town", "school"], ["tower", "home"]];
  const mapKey = f => TOWER_F.includes(f) ? "tower" : isHome(f) ? "home" : f;
  const mapName = k => k === "tower" ? ["🏢", "크레용 타워"] : k === "home" ? ["🏡", "유나네 집"] : [AREA[k].e, AREA[k].name.replace("·동네 교회", "·교회").replace("·놀이터", "")];
  function openMap(){
    panel.hidden = true; const here = mapKey(S.floor), P = Object.fromEntries(MAP_T.map(([k, x, y]) => [k, [x, y]]));
    const ln = ([a, b], dash) => `<line x1="${P[a][0]}" y1="${P[a][1] * 0.625}" x2="${P[b][0]}" y2="${P[b][1] * 0.625}" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" ${dash ? 'stroke-dasharray="0.1 3" opacity=".95"' : ""}/><line x1="${P[a][0]}" y1="${P[a][1] * 0.625}" x2="${P[b][0]}" y2="${P[b][1] * 0.625}" stroke="#E8DCC8" stroke-width="1.1" stroke-linecap="round" ${dash ? 'stroke-dasharray="0.1 3"' : ""}/>`;
    mapEl.innerHTML = `<h3>🗺️ 크레용 마을<small>누르면 걸어가요</small></h3><div class="m"><svg viewBox="0 0 100 62.5" preserveAspectRatio="none">
      <path d="M0 22 C6 26 4 40 10 46 S6 58 2 62.5 L0 62.5Z" fill="#A9CBEA" opacity=".85"/><path d="M0 24 C5 28 3 40 8 46 S4 58 1 62.5" fill="none" stroke="#FFFFFF" stroke-width=".5" opacity=".7"/>
      <circle cx="29" cy="24" r="9" fill="#BFE3C9" opacity=".8"/><circle cx="90" cy="9" r="8" fill="#F6E1EA" opacity=".9"/><circle cx="70" cy="8" r="7" fill="#F4ECD8" opacity=".9"/>
      ${MAP_R.map(r => ln(r)).join("")}${ln(["town", "fun"], true)}<text x="83.5" y="22" font-size="2.6" fill="#8A847C" text-anchor="middle">🚌 버스</text></svg>
      ${MAP_T.map(([k, x, y]) => { const [e, n] = mapName(k), ok = k === "tower" || k === "home" || AREA_MOD[k]; return `<button type="button" class="t${k === here ? " on" : ""}${ok ? "" : " off"}" data-k="${k}" style="left:${x}%;top:${y}%"><i>${e}</i><span>${n}</span></button>`; }).join("")}</div><button type="button" class="x">닫기</button>`;
    mapEl.querySelectorAll(".t").forEach(b => b.onclick = ev => { ev.stopPropagation(); const k = b.dataset.k; mapEl.hidden = true; if(k === here) return;
      if(k === "tower") walkTo({f:S.floor, to:"lobby", spawn:AREA[S.floor]?.back || [17.6, 28.2, PI]});
      else if(k === "home") walkTo({f:S.floor, to:"home1", spawn:HOME.spawnGate});
      else walkTo({f:S.floor, to:k, spawn:AREA[k].spawn}); });
    mapEl.querySelector(".x").onclick = ev => { ev.stopPropagation(); mapEl.hidden = true; };
    mapEl.hidden = false; sfx("blip");
  }
  mapB.onclick = ev => { ev.stopPropagation(); if(mapEl.hidden) openMap(); else mapEl.hidden = true; };
  const nightEl = $(".yg-night"), grillEl = $(".yg-grill"), credEl = $(".yg-cred"), lbEl = $(".yg-lb"), chapEl = $(".yg-chap");
  const card = $(".yg-card"), hud = $(".yg-hud"), arrow = $(".yg-arrow"), joy = $(".yg-joy"), knob = joy.querySelector("i"), act = $(".yg-act"), jumpB = $(".yg-jump"), elevP = $(".yg-elev:not(.yg-fit)"), fitP = $(".yg-fit"), toastEl = $(".yg-toast"), panel = $(".yg-panel"), fade = $(".yg-fade"), help = $(".yg-help"), bagEl = $(".yg-bag"), stepsEl = $(".yg-steps"), makeEl = $(".yg-make");

  /* 별 기록 (이 기기에만) */
  let rec = {stars:0, done:{}, tre:{}, met:{}, vis:{}, badge:{}, round:0, req:0, jumps:0, boosts:0};
  try { rec = Object.assign(rec, JSON.parse(localStorage.getItem("crayon-yuna-play") || "{}")); } catch(_){}
  const JUMP_SVG = jumpB.querySelector("span").innerHTML;
  const save = () => { try { localStorage.setItem("crayon-yuna-play", JSON.stringify(rec)); } catch(_){} };

  const S = {floor:null, st:null, spots:[], bolt:null, near:null, tab:"q", reqNext:0, greet:{}, wetUntil:0};
  let REQ = null;   // 💬 유나를 부른 사람 {id, name, floor, until, kind}   // st = 엔진이 매 프레임 주는 상태
  const PR = {f:null, mess:0, down:0, chase:null, cool:0, cat:null, place:null};   // 장난치기 · 장식 놓기 상태
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
    if(!Q){ b.textContent = "할 일 고르기"; const h = S.floor ? `${flS(S.floor)} 보물 ${floorFound(S.floor)}/6 · 눌러서 할 일·놀이` : "눌러서 할 일·놀이 고르기"; if(s.textContent !== h) s.textContent = h; return; }
    b.textContent = `${Q.e} ${Q.t}`;
    const fNeed = needFloor(st);
    let h = (Q.story ? `🤫${"❤️".repeat(S.secret ?? 3)}${"🤍".repeat(3 - (S.secret ?? 3))} · ` : "") + (carry ? carry + (carry === "🐈" ? " 데리고 · " : " 들고 · ") : "") + (fNeed && fNeed !== S.floor ? `🛗 엘리베이터 타고 ${ro(FL[fNeed].name)}` : st.find && S.floor === Q.catF ? "🐈 이 층 어딘가에서 야옹 소리가…" : st.hint || "");
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
        r.querySelector("b").textContent = flS(f);
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
    { const r = document.createElement("button"); r.type = "button"; r.className = "yg-row yg-roam";   // 2026-11-28 감독님 "그냥 돌아다니기를 맨 위로"
      r.innerHTML = `<span class="e">🚶‍♀️</span><span><b></b><small></small></span>`; r.querySelector("b").textContent = Q ? "이 할 일 그만하고 그냥 돌아다니기" : "그냥 돌아다니기"; r.querySelector("small").textContent = "마음대로 구경하고 놀기 · 보물 찾기";
      r.onclick = () => { panel.hidden = true; if(Q){ endGame(); E()?.playActor("fr", null); Q = null; setCarry(""); setup(); renderCard(); } }; panel.append(r); }
    { const r = document.createElement("button"); r.type = "button"; r.className = "yg-row"; const o = rec.race;
      r.innerHTML = `<span class="e">🏎️</span><span><b>나이트 레이스</b><small></small></span>${o?.wins ? `<span class="ok">🏆 ${o.wins}번</span>` : ""}`;
      r.querySelector("small").textContent = o?.time > 0 ? `밤 도시 3바퀴 · 내 기록 ${Math.floor(o.time / 60)}:${(o.time % 60).toFixed(2).padStart(5, "0")}` : "밤 도시 3바퀴 · 드리프트와 니트로로 1등 하기";
      r.onclick = () => { panel.hidden = true; openRace(); }; panel.append(r); }
    QUESTS.forEach(q => { const r = document.createElement("button"); r.type = "button"; r.className = "yg-row" + (Q === q ? " cur" : "");
      r.innerHTML = `<span class="e"></span><span><b></b><small></small></span>${rec.done[q.id] ? `<span class="ok">⭐ ${rec.done[q.id]}번</span>` : ""}`;
      r.querySelector(".e").textContent = q.e; r.querySelector("b").textContent = q.t; r.querySelector("small").textContent = q.id === "party" && rec.partyCh ? `이어 하기 · ${q.steps[rec.partyCh]?.ch?.join(" ") || ""}` : q.steps.map(s => s.f ? FL[s.f].name.split(" ")[0] : "❓").filter(x => x).filter((x, k, a) => a.indexOf(x) === k).join(" → ");
      r.onclick = () => { panel.hidden = true; begin(q); }; panel.append(r); });
    panel.hidden = false;
  }
  card.onclick = () => panel.hidden ? openList() : (panel.hidden = true);

  function begin(q){
    endGame(); Q = q; step = 0; setCarry(""); REQ = null; E()?.playActor("fr", null); S.frF = null; S.trail = [];
    if(q.id === "party"){ step = rec.partyCh || 0; S.secret = rec.partySecret ?? 3; q.steps.forEach(x => { if(x.goAuto) x.go = null; }); }
    if(q.id === "cat"){ q.catF = pick(CAT_FLOORS); q.known = false; q.catAt = null; q.catAtF = null; q.cat = "lost"; S.catPos = null; }
    setup(); renderCard(); const st = curStep();
    if(st.ch){ rec.partyCh = step; save(); chapter(st.ch, st.f && st.f !== S.floor ? `${ro(FL[st.f].name)} 가요` : st.hint); }
    else toast(`${q.e} ${q.t}`, st.f && st.f !== S.floor ? `${ro(FL[st.f].name)} 가요` : st.hint);
    if(st.game && st.f === S.floor) later0(900, () => { if(Q === q && curStep() === st && !G) startGame(st.game); }); }
  function advance(){
    step++;
    if(step >= Q.steps.length){ const q = Q; Q = null; setCarry(""); rec.stars++; rec.done[q.id] = (rec.done[q.id] || 0) + 1; if(q.id === "req") rec.req++; if(q.id === "party"){ rec.partyCh = 0; delete rec.partySecret; } if(q.id === "friend") frBye(); save(); endGame(); renderCard(); E()?.playSet({mark:null}); later0(3800, () => { if(!Q) setup(); }); later0(2800, checkBadges);
      E()?.playSet({wave:2200}); sfx("star"); toast(`⭐ +1  ${q.e} 완료!`, `별 ${rec.stars}개 모았어요`, 2600); if(q.id !== "req" && q.id !== "party") setTimeout(() => { if(live && !Q && panel.hidden) openList("q"); }, 2900); return; }
    setup(); renderCard();
    const st = curStep(); if(st.ch){ rec.partyCh = step; rec.partySecret = S.secret; save(); chapter(st.ch, st.f && st.f !== S.floor ? `${ro(FL[st.f].name)} 가요` : st.hint); }
    if(st.game && (!st.f || st.f === S.floor)) startGame(st.game);
  }

  /* ---------- 이 층에서 보일 것 (수영장 · 아빠/엄마 · 표시 별) ---------- */
  function setup(){
    const e = E(); if(!e || !S.floor) return;
    const f = S.floor, st = curStep(), hide = [];
    const need = k => (G?.type === "hide" || G?.type === "tag" || G?.type === "freeze") && k === "dad" || G?.type === "futsal" && (k === "dad" || k === G.mate) || G?.type === "swim" && k === G.rival || G?.type === "pong" && k === "dad" || G?.type === "tennis" && k === G.rv || G?.type === "squirt" && k === G.rv || G?.type === "race" && G.riv?.includes(k) || G?.type === "ending" || (st && st.f === f && st.talk === "@" + k);
    if(st && st.goAuto && st.f === f && !st.go){   // 엄마한테서 먼 자리에 소품
      const w = e.playWhere("_nora") || e.playWhere("l_nora"), sp = e.playSpots(5, 77 + rec.round, AVOID, 2.2);
      st.go = sp.sort((a, b) => (w ? Math.hypot(b[0] - w[0], b[1] - w[1]) - Math.hypot(a[0] - w[0], a[1] - w[1]) : 0))[0] || e.playFree(EXIT[0] + 4, EXIT[1] - 3, 0.2); }
    if(Q?.id === "friend" && S.frF !== f){ S.frF = f; S.trail = []; S.frSwim = false;
      const at = f === "lobby" && step === 0 ? e.playFree(16.4, 18.4, 0.22) : e.playFree(EXIT[0] + 0.9, EXIT[1] + 0.8, 0.22); e.playActor("fr", {at:[at[0], at[1], Math.PI], pose:"stand", to:null}); }
    areaNpcs(f); villagers(f);
    // 아빠(2층)·엄마(4층) 배우: 원래 자리 근처에 세우고 원래 사람은 숨김
    [["dad", "main", "_dir", [32.2, 4.4]], ["mom", "s4", "_nora", [6.7, 17.9]]].forEach(([k, fl, id, def]) => {
      if(k === "mom" && PR.chase && PR.chase.phase !== "warn" && PR.chase.f === f) return;   // 장난치다 쫓아온 엄마는 그대로
      if(need(k) && (f === fl || G)){ if(!(S.st?.actors || {})[k] && !G){ const w0 = e.playWhere(id), w = w0 && Math.hypot(w0[0] - ELEV[0], w0[1] - ELEV[1]) > 2.4 ? w0 : null, at = e.playFree(...(w ? [w[0], w[1]] : def), 0.22); e.playActor(k, {at:[at[0], at[1], w ? w[2] : 0], pose:"stand"}); }
        hide.push(id, "l_" + id.slice(1)); }
      else e.playActor(k, null); });
    let mark = null;
    if(st && !G){ const fn = needFloor(st); if(st.find){ if(fn && fn !== f) mark = {at:wayOut(f, fn)}; }
      else if(st.f !== f) mark = {at:wayOut(f, st.f)};
      else if(st.go) mark = {at:st.go};
      else if(st.use){ const u = (USE[f] || []).find(x => x.k === st.use); mark = u ? {at:u.at} : null; }
      else if(st.talk && st.talk[0] === "@") mark = {actor:st.talk.slice(1)};
      else if(Array.isArray(st.talk)){ const id = st.talk.find(x => e.playWhere(x)); mark = id ? {id} : null; } }
    if(G?.type === "swim") mark = {at:[28.35, 18.45]};
    e.playSet({water:f === "roof" ? [POOL] : f === "gym" && AREA_MOD.gym?.pool ? [AREA_MOD.gym.pool] : [], hide, mark});
    if(Q?.id === "cat" && curStep()?.find && f === Q.catF && Q.catAtF !== f){ Q.catAt = e.playHideSpot(4) || e.playFree(EXIT[0] + 3, EXIT[1], 0.2); Q.catAtF = f; }
    refreshItems();
  }
  function spotsFor(f){ const e = E(); if(!e) return; S.spots = e.playSpots(6, SEED[f] + rec.round * 101, isHome(f) || isArea(f) ? WALKS.filter(t => t.f === f).map(t => [t.at[0], t.at[1], 1.1]) : AVOID, isHome(f) ? 2.2 : 2.6); }
  function boltFor(){ const e = E(); if(!e) return; S.bolt = e.playSpots(1, Math.random() * 1e9 | 0, [...AVOID, ...S.spots.map(p => [p[0], p[1], 1.6])], 1)[0] || null; }
  function refreshItems(){
    const e = E(); if(!e || !S.floor) return; const f = S.floor, L = [];
    if(COL.has(G?.type)) G.items.forEach(it => { if(!it.got) L.push(it); });
    else { S.spots.forEach((p, k) => { const tr = TREASURE[f][k]; if(tr && !rec.tre[`${f}:${k}`]) L.push({id:"t" + k, e:tr[0], i:p[0], j:p[1], y:tr[2] ? 1.12 : 0.42, high:!!tr[2], s:0.62}); });
      if(S.bolt) L.push({id:"bolt", e:"⚡", i:S.bolt[0], j:S.bolt[1], y:0.42, s:0.6}); }
    if(Q?.id === "cat"){ const pos = Q.cat === "follow" ? S.catPos : curStep()?.find && f === Q.catF ? Q.catAt : null; if(pos) L.push({id:"cat", e:"🐈", model:"cat", i:pos[0], j:pos[1], y:0.27, s:0.62, pick:false, glow:false, bob:false}); }
    if(Q?.id === "party" && f === "roof"){ const it = (id, e, i, j, y, s, bob = false) => L.push({id, e, i, j, y, s, pick:false, glow:false, bob});
      if(step > 1) it("p_cake", "🎂", 24.4, 3.5, 0.92, 0.5); if(step > 4){ it("p_b1", "🎈", 22.85, 3.4, 1.55, 0.55, true); it("p_b2", "🎈", 25.95, 3.4, 1.65, 0.55, true); it("p_fl", "💐", 23.4, 3.5, 0.9, 0.42); } }
    if(G?.type === "pong" && G.b) L.push({id:"pball", e:"⚪", i:G.b.f[0], j:G.b.f[1], y:0.95, s:0.24, pick:false, glow:false, bob:false});
    if(PR.cat && PR.f === f) L.push({id:"hcat", e:"🐈", model:"cat", i:PR.cat.at[0], j:PR.cat.at[1], y:0.27, s:0.62, pick:false, glow:false, bob:false});
    if(G?.type === "catmeat" && G.cat) L.push({id:"pcat", e:"🐈", model:"cat", meat:true, i:G.cat[0], j:G.cat[1], y:0.27, s:0.62, pick:false, glow:false, bob:false});
    if(REQ && REQ.floor === f) L.push({id:"req", e:"💬", on:REQ.id, pick:false, glow:false, s:0.4});
    e.playItems(L);
  }
  /* 주웠을 때 */
  function onPick(id){
    const e = E(), f = S.floor;
    if(id[0] === "t" && TREASURE[f]){ const k = +id.slice(1), tr = TREASURE[f][k]; if(!tr) return; rec.tre[`${f}:${k}`] = 1; save(); sfx("pick");
      const n = floorFound(f); e?.playEmote?.("yu", tr[0], 1600); yuSay(pick(["보물이다!! ✨", "우와 이거 내 거! 😆", "반짝반짝 ✨", "찾았다~! 🎉"]), 1800);
      toast(`${tr[0]} ${tr[1]} 찾았다!`, `${flS(f)} 보물 ${n}/6`);
      if(n >= 6){ rec.stars++; save(); sfx("star"); toast("🏴‍☠️ 이 층 보물 다 찾았다!", "⭐ +1", 2600, true); }
      checkBadges(); renderCard(); return; }
    if(id === "bolt"){ e?.playSet({boost:10000}); sfx("boost"); rec.boosts++; save(); S.bolt = null; yuSay("우와 빨라졌다!! ⚡", 1800); toast("⚡ 번개 사탕!", "10초 동안 쌩쌩 달려요"); checkBadges();
      const fl = f; later0(40000, () => { if(S.floor === fl && !S.bolt && !COL.has(G?.type)){ boltFor(); refreshItems(); } }); return; }
    if(id[0] === "s" && COL.has(G?.type)){ const it = G.items.find(x => x.id === id); if(it) it.got = true; G.n++; if(G.type === "bubble"){ sfx("blip"); E()?.playEmote?.([it.i, it.j, it.y + 0.2], "💥", 500); }
      if(G.n >= G.total){ G.phase = "end"; yuSay(G.type === "bubble" ? "비눗방울 다 터뜨렸다!! 🫧" : "별똥별 다 모았다!! 🌠"); toast(G.type === "bubble" ? "🫧 비눗방울 다 터뜨렸다!" : "🌠 별똥별 다 모았다!", "", 1800); later(1500, () => { endGame(); advance(); }); }
      else if(G.n % 4 === 0) yuSay(pick(["반짝반짝! 🌟", "하나 더~!", "얼마 안 남았다! 😆"]), 1400); }
  }

  /* ---------- 미니게임 ---------- */
  function endGame(){ if(!G) return; const was = G.type, wasRv = G.rv; clearInterval(G.iv); G.tm?.forEach(clearTimeout); const e = E(); if(e){ e.playSet({ball:null, freeze:false, act:null}); } G = null; tnPad.classList.remove("go"); act.classList.remove("beat"); hud.hidden = true; grillEl.hidden = true; grillEl.classList.remove("claw"); grillEl.querySelector(".bar em").style.left = ""; pickEl.hidden = true;
    if(was === "ending"){ nightEl.classList.remove("on"); lbOn(false); credEl.hidden = true; fade.classList.remove("on"); }
    if(COL.has(was) || was === "catmeat") refreshItems();
    if(was === "tennis") tnClean(wasRv);
    if(was === "squirt") e?.playSet({camLock:null, camLead:null, cam:{el:0.62, d:5.2}});
    if(was === "race") e?.playSet({auto:null, camLock:null, camLead:null, cam:{el:0.62, d:5.2}}); }
  /* 이야기 연출: 위아래 검은 띠 + 장 제목 */
  const lbOn = on => lbEl.classList.toggle("on", !!on);
  function chapter([no, title], sub){ lbOn(true); chapEl.querySelector("small").textContent = no.replace(/(\d)장/, "CHAPTER $1"); chapEl.querySelector("b").textContent = title; chapEl.classList.add("on"); sfx("ding");
    later0(2700, () => { chapEl.classList.remove("on"); if(G?.type !== "ending") lbOn(false); if(sub) toast(`${no} · ${title}`, sub, 2200); }); }
  function flipMeat(auto){
    if(G?.type !== "grill" || G.phase !== "cook") return; const p = (now() - G.t0) / 2600; if(p <= 0.05 && !auto) return;
    const ok = !auto && p >= 0.58 && p <= 0.82, burn = auto || p > 0.82; G.n++; if(ok) G.perfect++;
    E()?.playEmote?.([20.9, 15.0, 1.1], ok ? "✨" : burn ? "💨" : "🥩", 1200); sfx(ok ? "pick" : "bump");
    yuSay(ok ? pick(["완벽! 👌", "지글지글 딱 좋다 😋", "고기 장인 유나 🔥"]) : burn ? pick(["앗 탔다 😱", "까맣게 됐어… 🥲"]) : pick(["앗 너무 빨랐다 🥩", "아직 덜 익었네 😅"]), 1300);
    if(G.n >= G.total){ G.phase = "end"; grillEl.hidden = true; rec.partyGrill = G.perfect; save();
      toast(`🍖 고기 다 구웠다! 완벽 ${G.perfect}/${G.total}`, G.perfect >= 3 ? "고기 장인 인정 👏" : "그래도 맛있을 거야 😋", 2400); later(2600, () => { endGame(); advance(); }); return; }
    G.t0 = now() + 700; }
  function mash(){ if(G?.type !== "arcade" || G.phase !== "go") return; G.n++; if(G.n % 3 === 0) sfx("blip", true); if(G.n % 6 === 0) E()?.playEmote?.([G.arc.at[0], 0.6, 1.35], pick(["👾", "💥", "⭐"]), 600); }
  /* 탁구 (2026-11-23 감독님 "세세한거 다"): 아빠가 보낸 공이 유나 앞에 오면 치기. 3번 놓치면 끝 */
  const PONG = {i:26.3, jy:3.45, jd:5.25};
  function serve(){ if(G?.type !== "pong" || G.phase !== "play") return; const r = () => (Math.random() - 0.5) * 0.9;
    G.b = {f:[PONG.i + r(), PONG.jd], to:[PONG.i + r() * 0.8, PONG.jy], t0:now(), dur:Math.max(520, 1050 - G.rally * 35), dir:"in"}; refreshItems(); E()?.playActor("dad", {wave:300}); sfx("blip"); }
  function hit(){ const e = E(); if(G?.type !== "pong" || G.phase !== "play" || !G.b || G.b.dir !== "in" || !e) return; const b = G.b, u = (now() - b.t0) / b.dur;
    e.playSet({act:{k:"pong", swing:true}});
    if(u < 0.62){ yuSay("너무 빨리 휘둘렀다 😅", 700); return; }
    if(u > 1.16) return;
    G.rally++; sfx("pick"); const at = [b.f[0] + (b.to[0] - b.f[0]) * Math.min(1, u), b.f[1] + (b.to[1] - b.f[1]) * Math.min(1, u)];
    G.b = {f:at, to:[PONG.i + (Math.random() - 0.5) * 0.9, PONG.jd], t0:now(), dur:b.dur * 0.92, dir:"out"};
    if(G.rally % 5 === 0){ yuSay(`랠리 ${G.rally}번! 🔥`, 1000); e.playEmote?.("yu", "🔥", 900); } }
  function pongEnd(){ const e = E(); G.phase = "end"; G.best = Math.max(G.best, G.rally); G.b = null; refreshItems(); const old = rec.pong || 0; rec.pong = Math.max(old, G.best); save();
    toast(`🏓 최고 랠리 ${G.best}번!`, G.best > old ? "🎉 신기록!" : `최고 기록 ${old}번`, 2400); npcSay("@dad", G.best >= 10 ? "우리 딸 탁구 선수 해도 되겠다! 🏓" : "아빠가 좀 봐줬다~ 또 하자 😆", 2600);
    firstUse("pong", "🏓 아빠랑 탁구"); later(2600, () => { endGame(); e?.playActor("dad", null); setup(); }); }
  /* 테니스 (2026-11-28 감독님 "테니스장" · "심부름 귀찮아. 모으기도 재미없고"): 강변 테니스장 실제 규격 코트. 3판 2선승 (듀스면 다음 점수가 게임, 노애드)
     유나는 마음대로 뛰어다님(네트를 보고 옆걸음, 🏃 대시). 샷 버튼 셋 (2026-11-28 감독님 "기술같은게 없네… 치는방향도 못 정하고"):
       🔥 강타 = 빠르고 깊게(가끔 아웃) · 🌙 로브 = 높이 넘김(네트 앞 상대에 강함, 뒤에 있으면 스매시 당함) · 🪶 드롭 = 네트 앞에 톡(뒤에 있는 상대에 강함, 가끔 네트)
       버튼을 누른 채 옆으로 끌면 그쪽으로 침. 공 오기 조금 전(0.2초 안)에 떼면 ✨ 나이스 타이밍(더 정확). 버튼 안 누르면 저절로 막기만 함(약하게 가운데로 → 상대가 공격)
     상대: 지유 → 엄마 → 아빠 → 체육 선생님 (점점 셈). 벽치기 연습(rv "wall")은 같은 공으로 벽이 받아 줌: 연속 몇 번 치나 */
  const TN_RIV = {fr:{n:"지유", e:"👧", T:1.5, Tmin:1.14, err:0.13, spd:2.2, aim:0.45, hi:["나 테니스 학원 다닌다~ 😎", "봐주기 없기다~ 😆"]},
    mom:{n:"엄마", e:"👩", T:1.42, Tmin:1.06, err:0.11, spd:2.3, aim:0.55, hi:["엄마 왕년에 테니스 좀 쳤다~ 😉", "살살 해 줄게~"]},
    dad:{n:"아빠", e:"👨", T:1.3, Tmin:0.97, err:0.085, spd:2.55, aim:0.68, hi:["아빠 대학 때 테니스 동아리였다 😎", "봐주는 거 없다~"]},
    coach:{n:"선생님", e:"🧑‍🏫", T:1.16, Tmin:0.88, err:0.06, spd:2.85, aim:0.8, hi:["자세 좋다! 한번 붙어 볼까? 💪", "선생님 공은 좀 빠르다~"]}};
  const TN_CALL = ["러브", "피프틴", "써티", "포티"], TN_PT = ["0", "15", "30", "40"], TG = 7.0;   // 공 중력 (칸/초²): 실제(7.7)보다 살짝 둥실
  const tnC = () => AREA_MOD.court?.court || {ci:19, cj:13.4, hl:9.285, dw:4.285, sw:3.215, sl:5, bl0:4.115, bl1:22.685, netZ:0.714, postZ:0.836, fence:{i0:11.4, i1:26.6, j0:1.2, j1:25.6}, wall:{i0:5.6, i1:10.4, j:0.85, line:0.714}};
  const tnNetZ = i => { const C = tnC(), u = Math.min(1, Math.abs(i - C.ci) / 5); return C.netZ + (C.postZ - C.netZ) * u * u; };
  const clampN = (v, a, b) => Math.max(a, Math.min(b, v));
  /* 날아갈 속도: p0 → 땅 L까지 T초. 네트에 걸리면 T를 늘려 높게 */
  function tnLaunch(p0, L, T, wall){ const C = tnC(); let t = T;
    for(let k = 0; k < 10; k++){ const vi = (L[0] - p0[0]) / t, vj = (L[1] - p0[1]) / t, vy = (-p0[2] + 0.5 * TG * t * t) / t, pj = wall ? C.wall.j : C.cj, lim = wall ? C.wall.line + 0.25 : null;
      const tn = vj ? (pj - p0[1]) / vj : -1; if(tn <= 0 || tn >= t) return [vi, vj, vy];
      const yn = p0[2] + vy * tn - 0.5 * TG * tn * tn; if(yn > (lim ?? tnNetZ(p0[0] + vi * tn) + 0.2)) return [vi, vj, vy]; t += 0.1; }
    return [(L[0] - p0[0]) / t, (L[1] - p0[1]) / t, (-p0[2] + 0.5 * TG * t * t) / t]; }
  /* 공 한 걸음: 네트 · 땅 · 철망 · (벽치기) 벽 */
  function tnPhys(b, dt){ const C = tnC(), F = C.fence, pj = b.p[1]; let ev = null;
    b.v[2] -= TG * dt; b.p[0] += b.v[0] * dt; b.p[1] += b.v[1] * dt; b.p[2] += b.v[2] * dt;
    if(b.wall){ const w = C.wall; if(b.v[1] < 0 && b.p[1] <= w.j && b.p[0] > w.i0 - 0.6 && b.p[0] < w.i1 + 0.6){ b.p[1] = w.j + 0.01; b.v[1] = -b.v[1] * 0.82; b.v[0] *= 0.9; ev = b.p[2] < w.line ? "low" : "wall"; } }
    else if(!b.netHit && (pj - C.cj) * (b.p[1] - C.cj) <= 0 && Math.abs(b.p[0] - C.ci) < 5.05 && b.p[2] < tnNetZ(b.p[0])){
      b.netHit = true; b.p[1] = C.cj + (pj > C.cj ? 0.09 : -0.09); b.v[1] *= -0.12; b.v[0] *= 0.3; b.v[2] = Math.min(b.v[2], 0); ev = "net"; }
    if(b.p[2] <= 0 && b.v[2] < 0){ b.p[2] = 0; if(b.v[2] < -0.7){ b.v[2] = -b.v[2] * 0.64; b.v[0] *= 0.84; b.v[1] *= 0.84; ev = ev || "bounce"; } else { b.v[2] = 0; b.v[0] *= Math.exp(-dt * 2.4); b.v[1] *= Math.exp(-dt * 2.4); } }
    if(!b.wall){ if(b.p[0] < F.i0 + 0.12 && b.v[0] < 0 || b.p[0] > F.i1 - 0.12 && b.v[0] > 0){ b.v[0] *= -0.3; b.v[1] *= 0.5; }
      if(b.p[1] < F.j0 + 0.12 && b.v[1] < 0 || b.p[1] > F.j1 - 0.12 && b.v[1] > 0){ b.v[1] *= -0.3; b.v[0] *= 0.5; } }
    return ev; }
  function tnPredict(b){ const c = {p:[...b.p], v:[...b.v], netHit:b.netHit, wall:b.wall}, o = {land:null, tl:0, hit:null, th:0, net:false}; let t = 0, nb = 0;
    for(let k = 0; k < 330; k++){ const dt = 1 / 60; t += dt; const ev = tnPhys(c, dt); if(ev === "net") o.net = true;
      if(ev === "bounce"){ nb++; if(nb === 1){ o.land = [c.p[0], c.p[1]]; o.tl = t; } }
      if(nb === 1 && t > o.tl + 0.16 && c.v[2] < 0.5 && c.p[2] < 0.95){ o.hit = [c.p[0], c.p[1], c.p[2]]; o.th = t; break; }
      if(nb >= 2) break; }
    return o; }
  const tnIn = (C, i, j, half) => Math.abs(i - C.ci) <= C.sw + 0.04 && (half < 0 ? j >= C.bl0 - 0.04 && j < C.cj : j <= C.bl1 + 0.04 && j > C.cj);
  const tnName = () => G.rv === "wall" ? "벽" : TN_RIV[G.rv].n;
  function tnBoard(msg){ const B0 = AREA_MOD.court; if(!B0?.board || !G || G.rv === "wall") return; const [a, r] = G.pts;
    const pa = a >= 3 && r >= 3 ? (a === r ? "40" : a > r ? "AD" : "40") : TN_PT[Math.min(3, a)], pb = a >= 3 && r >= 3 ? (a === r ? "40" : r > a ? "AD" : "40") : TN_PT[Math.min(3, r)];
    B0.board({a:"YUNA 유나", b:tnName().toUpperCase ? tnName() : tnName(), pa, pb, ga:G.games[0], gb:G.games[1], sv:G.srv === "yu" ? "a" : "b", msg:msg || (G.rally >= 3 ? `RALLY ${G.rally}` : "CREYONG TENNIS")}); }
  function tnStart(rv, cup = null){
    const e = E(), C = tnC(); if(!e) return; startGame("tennis"); Object.assign(G, {rv, cup, need:cup ? cup.need : 2, pts:[0, 0], games:[0, 0], srv:"yu", rally:0, best:0, phase:"ready", lt:now(), b:null, press:0, deuce:false, n:0, miss:0, perf:0, pc:0});
    e.playRacket({yu:1, ...(rv !== "wall" ? {[rv]:1} : {})}); const tall = innerHeight > innerWidth * 1.1; e.playSet({camLock:0, camLead:rv === "wall" ? (tall ? 1.5 : 0.6) : (tall ? 4.6 : 1.6), cam:rv === "wall" ? {el:tall ? 0.72 : 0.66, d:tall ? 7.5 : 5.8} : {el:tall ? 0.5 : 0.6, d:tall ? 12 : 7.6}, mark:null});   // 세로 화면(폰)은 더 높이 · 멀리: 상대까지 보이게
    Object.entries(S.vil || {}).forEach(([k]) => { const a = S.st?.actors?.[k]; if(!a) return; if(a.i > C.fence.i0 - 0.3 && a.i < C.fence.i1 + 0.3 && a.j > C.fence.j0 - 0.3 && a.j < C.fence.j1 + 0.3) e.playActor(k, {at:[27.0, 8 + Math.random() * 10, -PI / 2], to:null});   // 코트 안 동네 사람은 응원석 앞으로
      else if(rv === "wall" && a.i > C.wall.i0 - 1.5 && a.i < C.wall.i1 + 1.5 && a.j < 8) e.playActor(k, {at:[6.2 + Math.random() * 3, 12.2 + Math.random() * 1.6, PI], to:null}); });   // 벽치기 자리 비우기
    e.playSet({face:PI});
    if(rv === "wall"){ G.until = now() + 60000; G.streak = 0; e.playSet({pos:[8.0, 5.6, PI], face:PI});
      toast("🧱 벽치기 연습!", "벽에 맞고 오는 공을 계속 받아치기 · 흰 줄 위로 · 3번 놓치면 끝", 2800); yuSay("벽아 덤벼라~ 💪", 1600); later(1600, () => tnFeed()); return; }
    const L = TN_RIV[rv]; e.playActor(rv, {at:[C.ci, C.bl0 - 0.4, 0], pose:"stand", to:null}); npcSay("@" + rv, pick(L.hi), 2600);
    toast(cup ? `🏆 동네 대회 ${cup.nm} · ${L.n}랑 (${G.need === 1 ? "1게임" : "3판 2선승"})` : `🎾 ${L.n}랑 테니스! (3판 2선승)`, "반짝일 때 누르면 ✨PERFECT · 끌면 그쪽으로", 4200); tnBoard(cup ? cup.b : "READY"); later(2400, () => tnServe()); }
  /* 서브 자리: 이 게임에서 친 점수 합이 짝수면 오른쪽(듀스 코트), 홀수면 왼쪽(애드 코트) */
  function tnServe(){ const e = E(), C = tnC(); if(!e || G?.type !== "tennis") return; const n = G.pts[0] + G.pts[1], dc = n % 2 === 0 ? 1 : -1; G.b = null; G.rally = 0; G.press = 0; G.dc = dc;
    if(G.srv === "yu"){ e.playSet({pos:[C.ci + dc * 0.9, C.bl1 + 0.4, PI], face:PI, freeze:true}); e.playActor(G.rv, {at:[C.ci - dc * 2.0, C.bl0 - 0.3, 0], to:null});
      G.phase = "yuserve"; e.playTBall([C.ci + dc * 0.9 + 0.22, C.bl1 + 0.25, 0.62, 0.075]); tnBoard(); if(!rec.tnTip){ rec.tnTip = 1; save(); toast("🎾 유나 서브!", "🔥강서브는 빠르지만 가끔 네트 · 버튼 끌면 바깥/가운데로", 2800, true); } }
    else { e.playSet({pos:[C.ci + dc * 2.0, C.bl1 + 0.35, PI], face:PI, freeze:false}); e.playActor(G.rv, {at:[C.ci - dc * 0.9, C.bl0 - 0.35, 0], to:null});
      G.phase = "rvserve"; tnBoard(); const L = TN_RIV[G.rv];
      later(900, () => { if(G?.phase !== "rvserve") return; const a = S.st?.actors?.[G.rv], p0 = [a ? a.i - 0.2 : C.ci, (a ? a.j : C.bl0) + 0.15, 1.75]; E()?.playSwing(G.rv, "serve");
        later(260, () => { if(G?.phase !== "rvserve") return; sfx("blip"); const ti = C.ci + dc * (0.7 + Math.random() * (C.sw - 1.5)), tj = C.cj + 2.4 + Math.random() * 2.2;
          G.b = {p:p0, v:tnLaunch(p0, [ti, tj], Math.max(0.95, L.T * 0.92)), by:"rv", nb:0, serve:true}; G.phase = "rally"; }); }); } }
  /* 서브 (2026-11-28 감독님 "타이밍도 섬세하게"): 한 번 누르면 토스, 공이 맨 위(0.42초)에 왔을 때 한 번 더 누르면 PERFECT. 안 누르면 0.78초에 약하게 저절로 */
  const tossZ = ms => 0.62 + Math.max(0, 1.05 * (1 - ((ms - 420) / 420) ** 2));
  function tnYuServe(kind = "drive", aim = null){ const e = E(); if(G?.phase !== "yuserve" || !e) return; G.phase = "toss"; const st = S.st, i0 = st.i + 0.22, j0 = st.j - 0.15, t0 = now();
    G.toss = {t0, kind, aim, i0, j0}; sfx("jump"); e.playEmote?.("yu", kind === "drive" ? "🔥" : "🎾", 500);
    const up = setInterval(() => { if(G?.phase !== "toss"){ clearInterval(up); return; } e.playTBall([i0, j0, tossZ(now() - t0), 0.075]); }, 16); G.tm.push(up);
    if(!rec.tnToss){ rec.tnToss = 1; save(); toast("🎾 공이 맨 위에 왔을 때 한 번 더!", "딱 맞추면 ✨PERFECT 서브 (빠르고 정확)", 2400, true); }
    later(780, () => { if(G?.phase === "toss") tnServeHit(null, true); }); }
  function tnServeHit(aim2, auto){ const e = E(), C = tnC(), T0 = G?.toss; if(G?.phase !== "toss" || !e || !T0) return; const dt = now() - T0.t0;
    if(!auto && dt < 140) return;   // 토스하자마자 또 눌린 건 무시
    G.phase = "serving"; e.playSwing("yu", "serve"); const d = Math.abs(dt - 420), gr = auto ? "late" : d <= 70 ? "perfect" : d <= 170 ? "good" : dt < 420 ? "early" : "late", poor = gr === "early" || gr === "late";
    const dc = G.dc, fast = T0.kind === "drive", a = aim2 ?? T0.aim ?? (Math.abs(S.jx || 0) > 0.3 ? Math.sign(S.jx) : 0);
    const x = a && !poor ? (a === -dc ? C.sw - 0.45 : 0.45) : 0.6 + Math.random() * (C.sw - 1.4), ti = C.ci - dc * x, tj = C.cj - (fast ? 3.4 + Math.random() * 1.6 : 2.3 + Math.random() * 2.3), p0 = [T0.i0, T0.j0, 1.5 + tossZ(dt) * 0.15];   // 끌면 바깥(와이드) · 가운데(T)
    const T = fast ? (gr === "perfect" ? 0.72 : poor ? 0.9 : 0.8) : (gr === "perfect" ? 0.9 : 0.98), netP = fast ? (gr === "perfect" ? 0.03 : poor ? 0.22 : 0.1) : (poor ? 0.08 : 0);
    const v = tnLaunch(p0, [ti, tj], T); if(Math.random() < netP) v[2] *= 0.55;   // 강서브는 가끔 네트
    G.b = {p:p0, v, by:"yu", nb:0, serve:true, kind:fast ? "drive" : "safe", pw:fast, pf:gr === "perfect", poor}; G.phase = "rally"; e.playSet({freeze:false}); sfx(fast ? "boost" : "pick");
    tmShow(gr, TN_TM[gr], auto ? "공이 맨 위일 때 한 번 더 누르기" : ""); if(gr === "perfect") G.perf = (G.perf || 0) + 1; tnRvPlan(); }
  /* 벽치기: 유나가 스스로 공을 떨어뜨려 침 */
  function tnFeed(){ const e = E(); if(G?.type !== "tennis" || G.rv !== "wall" || !e) return; const st = S.st; G.phase = "feed"; G.b = null; G.rally = 0;
    e.playTBall([st.i + 0.25, st.j - 0.25, 0.9, 0.075]); later(700, () => { if(G?.phase !== "feed") return; const s2 = S.st, p0 = [s2.i + 0.25, s2.j - 0.3, 0.75]; tnShot(p0, true); }); }
  /* 유나가 침: 버튼으로 고른 샷(강타·로브·드롭) 또는 저절로 막기 */
  /* 타이밍 판정: off = 공이 닿는 범위에 들어오기 몇 ms 전에 눌렀나 (음수 = 들어온 뒤 늦게). 버튼이 반짝일 때 누르면 PERFECT */
  const TN_TM = {perfect:"PERFECT ✨", good:"GOOD 👍", early:"빨라요 ⏩", late:"늦어요 ⏪"};
  const tnGrade = off => off >= 0 ? (off >= 50 && off <= 150 ? "perfect" : off <= 280 ? "good" : "early") : off >= -40 ? "perfect" : off >= -130 ? "good" : "late";
  const TN_SHOT = {drive:["🔥", ["받아라~!! 💥", "강스매시! 🔥", "얍!!"]], lob:["🌙", ["넘어가라~ 🌙", "높이 높이~!"]], drop:["🪶", ["톡! 🪶", "살짝~ 😏"]]};
  function tnShot(p0, feed, off){ const e = E(), C = tnC(), st = S.st; if(!e || !st) return; const t = now(), R = Math.random;
    const pressed = !feed && off != null && t - (G.press || 0) < 700, kind = pressed ? (G.pk || "drive") : feed ? "feed" : "block", gr = pressed ? tnGrade(off) : null, pf = gr === "perfect", poor = gr === "early" || gr === "late";
    const aim = pressed && G.paim ? G.paim : Math.abs(S.jx || 0) > 0.3 ? Math.sign(S.jx) : 0;
    const ball = G.b, sk = ball ? ((ball.p[0] - st.i) * -Math.cos(st.h) + (ball.p[1] - st.j) * Math.sin(st.h) >= 0 ? "fore" : "back") : "fore"; e.playSwing("yu", sk);
    if(G.rv === "wall"){ const w = C.wall, power = kind === "drive", ti = clampN(st.i + aim * 1.6 + (R() - 0.5) * (0.8 + Math.min(2.4, G.rally * 0.09)) * (pf ? 0.5 : poor ? 1.5 : 1), w.i0 + 0.3, w.i1 - 0.3);   // 오래 칠수록 공이 좌우로 더 튐
      G.b = {p:p0, v:tnLaunch(p0, [ti, w.j - 1.6], power ? 0.62 : kind === "lob" ? 1.1 : Math.max(0.62, 0.88 - G.rally * 0.012), true), by:"yu", nb:0, wall:true, pw:power}; G.phase = "rally"; }
    else { const rv = st.actors?.[G.rv], ri = rv ? rv.i : C.ci, side = aim || (ri > C.ci ? -1 : 1) * (R() < 0.8 ? 1 : -1), W = C.sw - 0.35;
      let ti, tj, T, err = 0;
      if(kind === "drive"){ ti = C.ci + side * (pf ? 0.72 + R() * 0.2 : 0.55 + R() * 0.35) * W; tj = Math.max(C.bl0 + 0.5, C.cj - (5.4 + R() * 2.8)); T = pf ? 0.72 : 0.8; err = pf ? 0.02 : 0.09; }
      else if(kind === "lob"){ ti = C.ci + side * (0.3 + R() * 0.45) * W; tj = Math.max(C.bl0 + 0.45, C.cj - (7.0 + R() * 1.6)); T = 1.95; err = pf ? 0.02 : 0.07; }
      else if(kind === "drop"){ ti = C.ci + side * (0.2 + R() * 0.55) * W; tj = C.cj - (1.4 + R() * 1.1); T = 0.95; err = pf ? 0.05 : 0.15; }
      else { ti = C.ci + side * R() * 0.3 * W; tj = C.cj - (3.2 + R() * 2.2); T = 1.3; }
      if(kind === "drive" || kind === "block" || kind === "feed") T *= clampN(Math.hypot(ti - p0[0], tj - p0[1]) / 11.5, 0.85, 1.25);
      if(pf && kind !== "drive") T *= 0.92;
      else if(gr === "early"){ err += 0.08; T *= 1.08; ti = C.ci + (ti - C.ci) * 0.35 + (R() - 0.5) * 1.2; }   // 빨리 휘두르면 가운데로 몰림
      else if(gr === "late"){ err += 0.1; T *= 1.12; tj = Math.min(C.cj - 1.6, tj + 2.2); ti = C.ci + (ti - C.ci) * 0.5; }   // 늦으면 짧고 약하게 → 상대가 공격
      const miss = R() < err; let v;
      if(miss && kind === "drop"){ v = tnLaunch(p0, [ti, tj], T); v[2] *= 0.55; }   // 드롭 실수 = 네트
      else { if(miss){ if(kind === "drive" && R() < 0.5) ti = C.ci + side * (C.sw + 0.55); else tj = C.bl0 - 0.8; } v = tnLaunch(p0, [ti, tj], T); }
      G.b = {p:p0, v, by:"yu", nb:0, pw:kind === "drive", kind, pf, poor}; G.phase = "rally";
      if(pressed && !miss) e.playRing?.(ti, tj, false); }   // 보낸 자리 표시
    G.rally++; G.press = 0; G.pk = null; G.paim = null; G.pf = false; sfx(kind === "drive" ? "boost" : "pick");
    if(gr){ G.pc = pf ? (G.pc || 0) + 1 : 0; if(pf) G.perf = (G.perf || 0) + 1; tmShow(gr, TN_TM[gr], G.pc >= 2 ? `연속 ${G.pc}번` : ""); }
    if(pf) e.playEmote?.("yu", "✨", 700);
    else if(TN_SHOT[kind]){ e.playEmote?.("yu", TN_SHOT[kind][0], 700); if(R() < 0.4) yuSay(pick(TN_SHOT[kind][1]), 900); }
    else if(kind === "block" && !G.blockTip && G.rv !== "wall"){ G.blockTip = 1; later(600, () => toast("🛡️ 저절로 막기만 했어요", "공 오기 직전에 🔥🌙🪶 버튼을 누르면 내가 고른 샷!", 2200)); }
    if(G.rally > 0 && G.rally % 5 === 0) yuSay(G.rv === "wall" ? `${G.rally}번! 🔥` : pick([`랠리 ${G.rally}번! 🔥`, "안 놓친다~ 😤"]), 1000);
    if(G.rv !== "wall") tnRvPlan(); tnBoard(); }
  /* 상대가 공을 따라 뜀: 닿을 수 있으면 받아치고, 늦거나 실수면 놓침 */
  function tnRvPlan(){ const C = tnC(), b = G.b, L = TN_RIV[G.rv], a = S.st?.actors?.[G.rv]; if(!b || !L) return; const pr = tnPredict(b);
    G.plan = null; if(pr.net || !pr.land || !tnIn(C, pr.land[0], pr.land[1], -1) || !pr.hit){ G.plan = {let:true}; return; }   // 아웃·네트면 안 쫓아감
    const at = [pr.hit[0] + 0.3, Math.min(C.cj - 1.0, pr.hit[1] - 0.2)], d = a ? Math.hypot(at[0] - a.i, at[1] - a.j) : 0, late = d / L.spd > pr.th + 0.12;
    const near = a && a.j > C.cj - 5.2, deep = a && a.j < C.cj - 6.2;   // 상대가 네트 가까이 · 뒤쪽
    const ex = b.kind === "drive" ? (b.pf ? 0.2 : 0.12) : b.kind === "lob" ? (near ? 0.5 : 0.04) : b.kind === "drop" ? (deep ? 0.22 : 0.06) : 0;
    const err = Math.random() < L.err + ex + Math.min(0.12, G.rally * 0.008);
    G.plan = {late, err, at, smash:b.kind === "lob" && !near && Math.random() < L.aim * 0.45, weak:b.kind === "drop", attack:b.kind === "block" || !!b.poor}; E()?.playActor(G.rv, {to:at, spd:late ? L.spd : Math.max(1.2, Math.min(L.spd, d / Math.max(0.3, pr.th - 0.1)))}); }
  function tnRvHit(st){ const e = E(), C = tnC(), b = G.b, L = TN_RIV[G.rv], a = st.actors?.[G.rv]; if(!e || !a) return; const pl = G.plan || {}, err = pl.err;
    e.playSwing(G.rv, pl.smash ? "serve" : b.p[0] - a.i < 0 ? "fore" : "back"); e.playActor(G.rv, {h:0}); sfx(pl.smash ? "boost" : "blip");
    const aim = Math.min(1, L.aim * (0.35 + G.rally * 0.14) + (pl.attack ? 0.35 : 0) + (pl.smash ? 0.5 : 0)), away = st.i > C.ci ? -1 : 1;
    let ti = Math.random() < aim ? C.ci + away * (1.0 + Math.random() * (C.sw - 1.5)) : st.i + (Math.random() - 0.5) * 1.8, tj = pl.weak ? C.cj + 2.0 + Math.random() * 2.0 : C.cj + 3.3 + Math.random() * (C.hl - 4.3);
    ti = clampN(pl.weak ? C.ci + (Math.random() - 0.5) * 2.4 : ti, C.ci - C.sw + 0.35, C.ci + C.sw - 0.35);
    const p0 = [b.p[0], b.p[1], Math.max(0.35, b.p[2])], T = pl.weak ? 1.35 : Math.max(L.Tmin, L.T - G.rally * 0.02) * clampN(Math.hypot(ti - p0[0], tj - p0[1]) / 11.5, 0.85, 1.2) * (pl.smash ? 0.62 : pl.attack ? 0.88 : 1);
    if(pl.smash){ e.playEmote?.("@" + G.rv, "💥", 700); if(Math.random() < 0.6) npcSay("@" + G.rv, pick(["스매시~! 💥", "높은 공은 내 거~ 😎"]), 1300); }
    else if(pl.weak && Math.random() < 0.5) npcSay("@" + G.rv, pick(["헉헉 겨우 받았다 😵", "드롭이라니! 😮"]), 1300);
    let v;
    if(err && Math.random() < 0.45){ v = tnLaunch(p0, [ti, C.cj + 2.5], T * 0.8); v[2] *= 0.55; }   // 네트에 걸림
    else { if(err){ if(Math.random() < 0.5) ti = C.ci + (Math.random() < 0.5 ? -1 : 1) * (C.sw + 0.6); else tj = C.bl1 + 0.9; } v = tnLaunch(p0, [ti, tj], T); }
    G.b = {p:p0, v, by:"rv", nb:0}; G.plan = null; G.rally++; tnBoard();
    later(450, () => { if(G?.type === "tennis" && G.b?.by === "rv") E()?.playActor(G.rv, {to:[C.ci + (p0[0] - C.ci) * 0.35, C.bl0 - 0.4], spd:L.spd * 0.7}); }); }
  function tnPress(kind = "drive", aim = null){ const e = E(); if(G?.type !== "tennis" || !e) return;
    if(G.phase === "yuserve"){ tnYuServe(kind, aim); return; }
    if(G.phase === "toss"){ tnServeHit(aim); return; }
    if(G.phase === "feed" || G.phase === "toss" || G.phase === "point" || G.phase === "end") return;
    G.press = now(); G.pk = kind; G.paim = aim; G.pf = false; const b = G.b, st = S.st;
    if(b && st && b.by !== "yu" && tnReach(b, st, true)){ tnShot([b.p[0], b.p[1], Math.max(0.35, b.p[2])], false, G.rinB === b ? -(now() - G.rin) : 0); return; }
    if(b && b.by !== "yu" && !b.done) e.playEmote?.("yu", TN_SHOT[kind]?.[0] || "🎾", 450);   // 공 오는 중: 샷 준비 (0.7초 안에 닿으면 그 샷으로)
    else e.playSwing("yu", "fore"); }
  /* 공이 닿는 범위에 들어옴: 먼저 눌러 뒀으면 그 샷, 아니면 0.3초 기다렸다(늦게 눌러도 됨) 저절로 막기. 범위를 벗어나려 하면 바로 막기 */
  function tnHitCheck(b, st){ const t = now(), P = [b.p[0], b.p[1], Math.max(0.35, b.p[2])];
    if(tnReach(b, st, true)){ if(G.rinB !== b){ G.rinB = b; G.rin = t; }
      if(t - (G.press || 0) < 700 && G.press < G.rin){ tnShot(P, false, G.rin - G.press); return true; }
      if(t - G.rin > 300 || b.nb >= 1 && b.v[2] < 0 && b.p[2] + b.v[2] * 0.06 < 0.04){ tnShot(P); return true; } return false; }   // 두 번 튀기 직전이면 바로 막기
    if(G.rinB === b){ tnShot(P); return true; } return false; }
  function tnSoon(b, st){ const t = now(); if(G.rinB === b) return t - G.rin < 40 && !(G.press > G.rin - 700);   // 반짝임 = 지금 누르면 PERFECT
    const q = [b.p[0] + b.v[0] * 0.1, b.p[1] + b.v[1] * 0.1, b.p[2] + b.v[2] * 0.1 - TG * 0.005]; let nb = b.nb; if(q[2] < 0){ q[2] = -q[2] * 0.6; nb++; }
    return tnReach({p:q, nb, serve:b.serve, wall:b.wall, wallHit:b.wallHit}, st, true) && !(t - (G.press || 0) < 700); }
  function tnReach(b, st, btn){ const C = tnC(), d = Math.hypot(b.p[0] - st.i, b.p[1] - st.j);
    if(b.wall) return b.wallHit && b.nb <= 1 && b.p[2] < 1.5 && d < (btn ? 1.3 : 1.12);
    if(b.p[1] < C.cj + 0.25) return false;
    const vol = b.nb === 0 && st.j < C.cj + 4.6 && !b.serve;
    return (b.nb === 1 || vol) && b.p[2] < 1.5 && d < (btn ? 1.3 : 1.12); }
  /* 점수 */
  function tnPoint(w, why){ const e = E(); if(!G || G.phase === "point" || G.phase === "end") return; G.phase = "point"; if(G.b) G.b.done = true; G.best = Math.max(G.best, G.rally);
    if(G.rv === "wall"){ G.miss++; sfx("bump"); yuSay(why || pick(["앗 놓쳤다 😣", "다시 다시! 😤"]), 1100); G.best = Math.max(G.best, G.rally);
      if(G.miss >= 3 || now() > G.until) later(1300, () => tnEnd("wall")); else later(1300, () => { E()?.playTBall(null); tnFeed(); }); return; }
    const k = w === "yu" ? 0 : 1; G.pts[k]++; const [a, r] = G.pts, L = TN_RIV[G.rv];
    const game = a >= 4 || r >= 4 ? (a >= 3 && r >= 3 ? true : Math.abs(a - r) >= 2 || a >= 4 && r < 3 || r >= 4 && a < 3) : false;
    sfx(w === "yu" ? "pick" : "bump");
    if(w === "yu"){ e?.playEmote?.("yu", pick(["✨", "😆", "💪"]), 900); if(why) toast(why, "", 900); later(350, () => npcSay("@" + G.rv, pick(G.rally >= 6 ? ["와 랠리 길었다! 😮", "끈질기다 우리 유나~"] : ["나이스 샷! 👏", "오~ 제법인데? 😮", "어이쿠 놓쳤다 😅"]), 1700)); }
    else { if(why) toast(why, "", 900); later(300, () => yuSay(pick(["앗 아깝다 😣", "다음엔 받는다! 😤", "으~ 빠르다 😵"]), 1300)); }
    if(game){ G.games[k]++; G.pts = [0, 0]; G.srv = G.srv === "yu" ? "rv" : "yu";
      if(G.games[k] >= G.need){ tnBoard(w === "yu" ? "YUNA WINS!" : `${L.n} 승`); later(1500, () => tnEnd(w)); return; }
      later(1100, () => { toast(w === "yu" ? "🎉 게임 유나!" : `게임 ${L.n}`, `게임 ${G.games[0]} : ${G.games[1]} · 서브 ${G.srv === "yu" ? "유나" : L.n}`, 2200); sfx(w === "yu" ? "ding" : "blip"); });
      tnBoard(`GAME ${G.games[0]}-${G.games[1]}`); later(3400, () => tnServe()); return; }
    const call = a >= 3 && r >= 3 ? (a === r ? "듀스! 🔥" : "") : a === r ? `${TN_CALL[a]} 올` : G.srv === "yu" ? `${TN_CALL[a]} ${TN_CALL[r]}` : `${TN_CALL[r]} ${TN_CALL[a]}`;
    later(900, () => toast(`🎾 ${call || "점수"}`, a >= 3 && r >= 3 ? "다음 점수 따는 사람이 이 게임 가져가요" : `유나 ${TN_PT[Math.min(3, a)]} : ${TN_PT[Math.min(3, r)]} ${L.n}`, 1500));
    tnBoard(a >= 3 && r >= 3 ? "DEUCE" : null); later(2300, () => tnServe()); }
  function tnEnd(w){ const e = E(); if(!G || G.type !== "tennis") return; G.phase = "end"; const rv = G.rv; e?.playTBall(null);
    const T = rec.tennis = rec.tennis || {play:0, win:0, best:0, wall:0, beat:{}}; T.best = Math.max(T.best, G.best);
    if(rv === "wall"){ const old = T.wall || 0; T.wall = Math.max(old, G.best); save(); toast(`🧱 최고 연속 ${G.best}번!`, (G.best > old ? "🎉 신기록!" : `최고 기록 ${old}번`) + ` · ✨PERFECT ${G.perf || 0}번`, 2600); yuSay(G.best >= 10 ? "벽보다 내가 더 세다 😎" : "다음엔 더 많이! 💪", 2000); firstUse("ct_wall", "🧱 벽치기 연습"); }
    else { const L = TN_RIV[rv]; T.play++; if(w === "yu"){ T.win++; T.beat[rv] = (T.beat[rv] || 0) + 1; rec.stars++; sfx("star"); } save();
      toast(w === "yu" ? `🏆 유나 승리! ${G.games[0]} : ${G.games[1]}` : `${L.e} ${L.n} 승리 ${G.games[1]} : ${G.games[0]}`, (w === "yu" ? "⭐ +1 · " : "") + `최고 랠리 ${G.best}번 · ✨PERFECT ${G.perf || 0}번`, 3000, true);
      npcSay("@" + rv, w === "yu" ? pick(["우리 유나 테니스 선수 해도 되겠다! 🏆", "졌다 졌어~ 진짜 잘한다 👏"]) : pick(["재밌었다~ 또 하자! 😆", "다음엔 유나가 이길걸? 😉"]), 2800);
      e?.playEmote?.("yu", w === "yu" ? "🏆" : "😤", 1600); firstUse("ct_tennis", "🎾 테니스 한 판"); renderCard(); }
    later0(1200, checkBadges); later(3000, () => endGame()); if(G.cup && rv !== "wall") later0(3700, () => cupNext("tennis", w === "yu")); }
  function tnClean(rv){ const e = E(); if(!e) return; e.playRacket(null); e.playTBall(null); e.playSet({camLock:null, camLead:null, cam:{el:0.62, d:5.2}, freeze:false, face:null});
    if(rv === "coach"){ const fix = AREA_MOD.court?.npc?.coach; if(fix && S.floor === "court") e.playActor("coach", {at:fix, to:null}); }
    else if(rv && rv !== "wall" && !(rv === "fr" && Q?.id === "friend")) e.playActor(rv, null);
    AREA_MOD.court?.board?.(null); setup(); }
  function tnTick(st, t){ const e = E(), C = tnC(); if(!e) return; const dt = Math.min(0.05, Math.max(0, (t - G.lt) / 1000)); G.lt = t; const b = G.b;
    if(G.rv === "wall" && now() > G.until && G.phase !== "end" && G.phase !== "point"){ tnEnd("wall"); return; }
    if(!b){ const go = G.phase === "toss" && !!G.toss && Math.abs(now() - G.toss.t0 - 420) <= 70; if(tnPad.classList.contains("go") !== go) tnPad.classList.toggle("go", go); return; }
    const ev = tnPhys(b, dt); { const go = b.by !== "yu" && !b.done && tnSoon(b, st); if(tnPad.classList.contains("go") !== go) tnPad.classList.toggle("go", go); } e.playTBall([b.p[0], b.p[1], b.p[2], 0.075]);
    if(b.done){ if(!b.gone){ b.gone = t; } else if(t - b.gone > 1100){ G.b = null; e.playTBall(null); } return; }
    if(b.wall){   // 벽치기
      if(ev === "low"){ tnPoint("x", "앗 너무 낮다! 흰 줄 위로 😅"); return; }
      if(ev === "wall"){ b.wallHit = true; b.nb = 0; sfx("blip"); return; }
      if(ev === "bounce"){ if(!b.wallHit){ tnPoint("x", "벽까지 못 갔다 😅"); return; } b.nb++; if(b.nb >= 2){ tnPoint("x"); return; } }
      if(b.wallHit && tnHitCheck(b, st)) return;
      if(b.wallHit && (b.p[1] > st.j + 2.5 || b.p[1] > 9.5)) tnPoint("x");
      return; }
    if(ev === "net"){ sfx("bump"); }
    if(ev === "bounce"){ const recv = b.by === "yu" ? -1 : 1;
      if(b.nb === 0){ const ok = tnIn(C, b.p[0], b.p[1], recv) && !b.netHit;
        if(!ok){ const own = (b.p[1] - C.cj) * recv < 0; tnPoint(b.by === "yu" ? "rv" : "yu", b.netHit || own ? "🥅 네트!" : "🙅 아웃!"); return; }
        }
      else { tnPoint(b.by, b.by === "yu" ? pick(["✨ 유나 득점!", "🎯 못 받았다!"]) : ""); return; }
      b.nb++; }
    if(b.by !== "yu" && tnHitCheck(b, st)) return;
    if(b.by === "yu" && G.plan && !G.plan.let && !G.plan.late){ const a = st.actors?.[G.rv]; if(a && b.nb === 1 && b.p[2] < 1.4 && Math.hypot(b.p[0] - a.i, b.p[1] - a.j) < 1.0) tnRvHit(st); }
    if(b.by === "yu" && G.plan?.late && b.nb === 1 && Math.random() < 0.02) e.playEmote?.([...(G.plan.at), 1.2], "💦", 500); }
  window.__ygTN = {start:rv => tnStart(rv), press:(k, a) => tnPress(k, a), g:() => G};   // 시험용
  /* 물총 싸움 (2026-11-28, 옥상 수영장): 물속에서 7번 먼저 맞히면 승. 💦 버튼 = 쏘기(상대 쪽을 보고 있어야 맞음), 물은 6발 · 안 쏘면 다시 참
     상대가 💦 들면 곧 쏨 → 헤엄쳐서 피하기. 상대도 유나가 쏘면 가끔 옆으로 피함 */
  const SQ_RIV = {fr:{n:"지유", iv:3000, dodge:0.22, lead:0.15, hit:["으앗 차가워! 😆", "나도 간다~ 💦"], hurt:["으~ 맞았다 🥶", "치사해~ 😆"]},
    mom:{n:"엄마", iv:2600, dodge:0.3, lead:0.3, hit:["엄마 백발백중~ 😉", "유나 머리 다 젖었다~ 💦"], hurt:["어머 차가워! 🥶", "유나 조준 좋다~ 👏"]},
    dad:{n:"아빠", iv:2200, dodge:0.38, lead:0.45, hit:["아빠 반격이다~ 💦", "아빠 물총 실력 봤지? 😎"], hurt:["으악 코에 들어갔어 😵", "항복 항복~ 🥶", "우와 정확하다! 😮"]}};
  const SQ_W = [20.9, 18.0, 28.7, 19.75];   // 물 안에서 다닐 칸
  function sqStart(rv){ const e = E(); if(!e) return; startGame("squirt"); const L = SQ_RIV[rv];
    Object.assign(G, {rv, sc:[0, 0], ammo:6, lastShot:0, phase:"ready", until:0, nextRv:0, prev:null, vel:[0, 0], aimAt:0});
    e.playSet({pos:[27.0, 18.85, -PI / 2], freeze:true, water:[POOL], mark:null, camLock:0, cam:innerHeight > innerWidth * 1.1 ? {el:0.85, d:9.5} : {el:0.78, d:7.6}});
    e.playActor(rv, {at:[23.0, 18.85, PI / 2], pose:"swim", to:null}); setup();
    npcSay("@" + rv, pick(rv === "dad" ? ["물총 싸움? 아빠 해병대 출신이야~ 😎", "봐주기 없다~ 💦"] : rv === "mom" ? ["엄마 물총 잘 쏜다~ 😉", "준비됐어? 💦"] : ["나 물총 대장이다~ 😆", "각오해라~ 💦"]), 2400);
    toast(`💦 ${L.n}랑 물총 싸움!`, "💦 버튼으로 쏘기 · 상대가 💦 들면 헤엄쳐서 피하기 · 7번 먼저", 3200);
    ["3", "2", "1"].forEach((n, k) => later(1500 + k * 800, () => { toast(n, "", 600); sfx("blip"); }));
    later(1500 + 3 * 800, () => { toast("발사! 💦", "", 800); sfx("go"); e.playSet({freeze:false}); G.phase = "fight"; G.until = now() + 70000; G.nextRv = now() + 1400; }); }
  function sqHud(){ if(!G.sc) return "💦"; return `💦 유나 <b>${G.sc[0]}</b> : <b>${G.sc[1]}</b> ${SQ_RIV[G.rv].n} · 물 ${"●".repeat(G.ammo)}${"○".repeat(6 - G.ammo)}`; }
  function sqFire(){ const e = E(), st = S.st; if(G?.type !== "squirt" || G.phase !== "fight" || !e || !st) return; const t = now();
    if(t - G.lastShot < 300) return;
    if(G.ammo <= 0){ if(t - (G.dryAt || 0) > 1200){ G.dryAt = t; yuSay(pick(["물 다 떨어졌다! 😵", "충전 중~ 잠깐만! 💧"]), 900); sfx("bump"); } return; }
    G.ammo--; G.lastShot = t; sfx("splash"); const a = st.actors?.[G.rv]; if(!a) return;
    const dx = a.i - st.i, dj = a.j - st.j, d = Math.hypot(dx, dj), fc = (Math.sin(st.h) * dx + Math.cos(st.h) * dj) / (d || 1);
    if(fc < 0.2 || d > 7.5){ const f = [st.i + Math.sin(st.h) * 2.6, st.j + Math.cos(st.h) * 2.6, 0.3]; e.playSquirt("yu", f, true); return; }   // 딴 데 보고 쏨
    const tg = [a.i, a.j], T = 380 + d * 20;
    if(Math.random() < SQ_RIV[G.rv].dodge){ const side = a.i < 24.8 ? 1 : a.i > 26.8 ? -1 : Math.random() < 0.5 ? -1 : 1;   // 상대가 피함
      later(90, () => E()?.playActor(G.rv, {to:[clampN(a.i + side * 1.6, SQ_W[0], SQ_W[2]), clampN(a.j + (Math.random() - 0.5) * 1.2, SQ_W[1], SQ_W[3])], spd:2.6})); }
    e.playSquirt("yu", [tg[0], tg[1], 0.3]);
    later(T, () => { if(G?.type !== "squirt" || G.phase !== "fight") return; const b = S.st?.actors?.[G.rv]; if(!b) return;
      if(Math.hypot(b.i - tg[0], b.j - tg[1]) < 0.62){ G.sc[0]++; sfx("pick"); E()?.playEmote?.("@" + G.rv, pick(["💦", "🥶", "😵"]), 800); if(Math.random() < 0.55) npcSay("@" + G.rv, pick(SQ_RIV[G.rv].hurt), 1300); sqCheck(); }
      else if(Math.random() < 0.4) npcSay("@" + G.rv, pick(["안 맞았지롱~ 😜", "메롱~ 😝", "빗나갔다~ 😆"]), 1100); }); }
  function sqRvFire(st){ const e = E(), a = st.actors?.[G.rv], L = SQ_RIV[G.rv]; if(!e || !a) return;
    e.playEmote?.("@" + G.rv, "💦", 520); G.phase = "aim";
    later(520, () => { if(G?.type !== "squirt" || G.phase !== "aim") return; G.phase = "fight"; const s2 = S.st; if(!s2) return;
      const ld = Math.random() < L.lead ? 0.42 : 0, tg = [clampN(s2.i + G.vel[0] * ld, SQ_W[0], SQ_W[2]), clampN(s2.j + G.vel[1] * ld, SQ_W[1], SQ_W[3])], b = s2.actors?.[G.rv];
      E()?.playActor(G.rv, {h:Math.atan2(tg[0] - (b?.i ?? 0), tg[1] - (b?.j ?? 0))}); E()?.playSquirt("@" + G.rv, [tg[0], tg[1], 0.3]); sfx("splash");
      const d = b ? Math.hypot(tg[0] - b.i, tg[1] - b.j) : 3;
      later(380 + d * 20, () => { if(G?.type !== "squirt" || G.phase === "end") return; const s3 = S.st; if(!s3) return;
        if(Math.hypot(s3.i - tg[0], s3.j - tg[1]) < 0.55){ G.sc[1]++; sfx("bump"); E()?.playSplash?.(); yuSay(pick(["으악 차가워! 🥶", "푸하~ 💦", "앗 맞았다 😆"]), 900); if(Math.random() < 0.5) later(400, () => npcSay("@" + G.rv, pick(L.hit), 1300)); sqCheck(); }
        else if(Math.random() < 0.45) yuSay(pick(["안 맞았지롱~ 😜", "피했다! 🐬", "메롱~ 😝"]), 900); }); }); }
  function sqCheck(){ if(G.sc[0] >= 7) sqEnd("yu"); else if(G.sc[1] >= 7) sqEnd("rv"); }
  function sqEnd(w){ const e = E(); if(!G || G.type !== "squirt" || G.phase === "end") return; G.phase = "end"; const L = SQ_RIV[G.rv], rv = G.rv;
    const T = rec.squirt = rec.squirt || {play:0, win:0}; T.play++; if(w === "yu"){ T.win++; rec.stars++; sfx("star"); } save();
    toast(w === "yu" ? `🏆 유나 승! ${G.sc[0]} : ${G.sc[1]}` : w === "rv" ? `💦 ${L.n} 승! ${G.sc[1]} : ${G.sc[0]}` : `🤝 무승부 ${G.sc[0]} : ${G.sc[1]}`, w === "yu" ? "⭐ +1 · 물총 대장!" : "다시 도전! 💦", 3000, true);
    npcSay("@" + rv, w === "yu" ? pick(["졌다 졌어~ 우리 딸 물총 대장! 🏆", "항복~ 다 젖었다 😆"]) : pick(["재밌었다~ 한 판 더? 😆", "다음엔 유나가 이길걸? 😉"]), 2600);
    e?.playEmote?.("yu", w === "yu" ? "🏆" : "😤", 1500); firstUse("rf_squirt", "💦 물총 싸움"); renderCard(); later0(1200, checkBadges);
    later(3000, () => { endGame(); E()?.playActor(rv, {pose:"swim", to:[Math.max(21, (S.st?.i ?? 24) - 1.8), 18.4]}); later0(4500, () => { if(!G) setup(); }); }); }
  function sqTick(st, t){ const e = E(); if(!e || !G.sc) return;
    if(G.prev){ const dt = Math.max(0.016, (t - G.prev[2]) / 1000); G.vel = [G.vel[0] * 0.6 + (st.i - G.prev[0]) / dt * 0.4, G.vel[1] * 0.6 + (st.j - G.prev[1]) / dt * 0.4]; } G.prev = [st.i, st.j, t];
    if(G.phase !== "fight" && G.phase !== "aim") return;
    if(!st.swim){ e.playSet({pos:[clampN(st.i, 21, 28.6), 18.85]}); }   // 물 밖으로 나가면 다시 물속으로
    if(t - G.lastShot > 800 && G.ammo < 6 && t - (G.fill || 0) > 450){ G.fill = t; G.ammo++; if(G.ammo === 6) sfx("ready"); }
    if(t > G.until){ sqEnd(G.sc[0] > G.sc[1] ? "yu" : G.sc[1] > G.sc[0] ? "rv" : "draw"); return; }
    const a = st.actors?.[G.rv]; if(!a) return;
    if(G.phase === "fight" && t > G.nextRv){ const L = SQ_RIV[G.rv]; G.nextRv = t + L.iv * (0.8 + Math.random() * 0.5) - Math.min(500, (G.sc[0] - G.sc[1]) * 120); sqRvFire(st); return; }
    if(!a.moving && Math.random() < 0.02){ const d0 = st.i < 24.8 ? 1 : -1;   // 유나와 2.5~5칸 떨어져 이리저리
      const ti = clampN(st.i + d0 * (2.6 + Math.random() * 2.4), SQ_W[0], SQ_W[2]), tj = SQ_W[1] + Math.random() * (SQ_W[3] - SQ_W[1]);
      e.playActor(G.rv, {to:[ti, tj], spd:1.1 + Math.random() * 0.5}); }
    if(!a.moving) e.playActor(G.rv, {h:Math.atan2(st.i - a.i, st.j - a.j)}); }
  window.__ygSQ = {start:rv => sqStart(rv), fire:() => sqFire(), g:() => G};   // 시험용

  /* 50m 수영 시합 (2026-11-28 감독님 "수영장 따로 만들라고 올림픽 규격으로. 체육관을 만들란 소리잖아"): 크레용 스포츠센터 50m 풀, 유나는 4번 레인
     "자리에~" 뒤 삐! 소리 → 💨 버튼(스페이스)을 누르면 뛰어듦(반응 속도) → 계속 빠르게 누를수록 빨리 헤엄. 안 눌러도 천천히는 감
     상대: 가족(지유·엄마·아빠) / 다 같이(+체육 선생님, 제일 빠름) / 혼자 기록. 기록판에 레인·이름·기록, 1·2·3등 메달 */
  const RC_RIV = {dad:{n:"아빠", lane:2, v:1.66, kick:0.06, fade:0, hi:["아빠 왕년에 접영 선수였다~ 😎", "봐주기 없다~ 🏊‍♂️"], win:"아빠가 1등~ 😎 한 판 더?", lose:"헉헉… 우리 딸 물개네 🦭"},
    fr:{n:"지유", lane:3, v:1.5, kick:0, fade:0.06, hi:["나 수영 학원 다닌다~ 😆", "유나 옆 레인이다! 화이팅~"], win:"내가 이겼다~ 😜", lose:"와 너 진짜 빠르다! 👏"},
    mom:{n:"엄마", lane:5, v:1.56, kick:0.03, fade:0, hi:["엄마도 열심히 할게~ 😉", "유나야 천천히 해도 돼~ 💕"], win:"엄마가 이겼네~ 😆", lose:"우리 유나 최고! 👏"},
    coach:{n:"선생님", lane:6, v:1.86, kick:0.08, fade:0, hi:["선생님은 국가대표 출신이다~ 💪", "전력으로 간다! 🏊"], win:"아직 선생님이 한 수 위~ 💪", lose:"이야… 선생님이 졌다! 국가대표감! 🥇"}};
  const RC_BEAT = 330;   // 물장구 박자 (2026-11-28 감독님 "타이밍도 섬세하게"): 버튼이 반짝일 때 맞춰 누르면 PERFECT. 막 누르기보다 박자가 빠름
  const RC_SUIT = 1.07;   // 수영복 입으면 7% 빠름 (2026-11-28 감독님 "수영복 입으면 더 빨라진다던가")
  const RC_T = 1.75;   // 화면 기록 = 실제 초 × 1.75 (50m가 30~50초쯤으로 보이게)
  const rcFmt = ms => (ms / 1000 * RC_T).toFixed(2);
  const RC_MODE = {fam:["dad", "fr", "mom"], all:["dad", "fr", "mom", "coach"], solo:[]};
  function rcStart(mode, cup = null){
    const e = E(), M = AREA_MOD.gym; if(!e || !M) return; startGame("race");
    const L4 = M.lanes[4], tall = innerHeight > innerWidth * 1.1;
    Object.assign(G, {mode, cup, perf:0, combo:0, beatN:null, riv:RC_MODE[mode], phase:"ready", pow:0, v:0, last:0, dove:0, fin:{}, t1:0, early:0, prev:0, bd:0, spd:{}, ph:{}});
    e.playSet({pos:[M.blockI - 0.55, L4, PI / 2], freeze:true, auto:null, mark:null, camLock:-PI / 2 + 0.3, camLead:0.4, cam:tall ? {el:0.82, d:9.5} : {el:0.62, d:7.6}});   // 출발 전: 높이서 출발대 다 보이게
    G.riv.forEach((k, n) => { const L = RC_RIV[k]; G.ph[k] = Math.random() * 6; e.playActor(k, {at:[M.blockI - 0.55, M.lanes[L.lane], PI / 2], pose:"stand", to:null}); });
    Object.keys(S.vil || {}).forEach(k => { const a = S.st?.actors?.[k]; if(a && a.j < M.pool.walk[3] + 0.4 && a.i < M.blockI + 0.3) e.playActor(k, {at:[1.6 + Math.random() * 1.6, 27.2 + Math.random() * 1.4, PI], to:null}); });   // 출발대 뒤 사람은 비켜 줌
    setup(); rcBoard();
    if(G.riv.length){ const k = G.riv[G.riv.length - 1]; npcSay("@" + k, pick(RC_RIV[k].hi), 2400); }
    toast(G.cup ? `🏆 동네 수영 대회 · ${G.cup === "heat" ? "예선 (2등 안에 들면 결승)" : "결승"}` : mode === "solo" ? "⏱️ 50m 기록 재기!" : "🏊 50m 수영 시합!", "삐 소리에 💨 출발 · 그다음엔 버튼이 반짝일 때 박자 맞춰 누르기 (스페이스)", 3400);
    later(1300, () => { if(G?.type === "race") yuSay(S.st?.fit === "swim" ? "수영복 입었으니까 더 빠를 거야 🩱" : "앗 수영복 입을걸… 탈의실 🩱 (조금 느려요)", 1800); });
    later(2600, () => { if(G?.type !== "race") return; toast("자리에~", "", 900); sfx("blip"); E()?.playEmote?.("yu", "🏁", 900);
      later(1000 + Math.random() * 900, () => { if(G?.type !== "race") return; G.phase = "race"; G.t1 = now(); sfx("go"); toast("삐—! 출발 🏊", "", 900);
        G.riv.forEach((k, n) => later(160 + Math.random() * 220 + (k === "coach" ? -60 : 0), () => { if(G?.type !== "race") return; const L = RC_RIV[k];
          G.spd[k] = L.v * 1.3; E()?.playActor(k, {at:[M.startI, M.lanes[L.lane], PI / 2], pose:"swim", to:[M.endI, M.lanes[L.lane]], spd:G.spd[k]}); }));
        later(1400, () => { if(G?.type === "race" && !G.dove) rcDive(true); }); }); }); }
  function rcDive(late){ const e = E(), M = AREA_MOD.gym; if(!e || G?.type !== "race" || G.dove) return; G.dove = now(); G.react = G.dove - G.t1;
    const tall = innerHeight > innerWidth * 1.1; e.playSet({pos:[M.startI, M.lanes[4], PI / 2], camLead:tall ? 3.0 : 2.0, cam:tall ? {el:0.62, d:9.0} : {el:0.5, d:7.2}}); G.v = 1.2; G.pow = late ? 0.2 : G.react < 450 ? 1.0 : 0.6;
    if(!late && G.react < 450){ yuSay("출발 완벽! ⚡", 1200); e.playEmote?.("yu", "⚡", 900); } else if(late) yuSay("앗 늦었다! 💦", 1200); }
  function rcTap(){ if(G?.type !== "race") return; const t = now();
    if(G.phase === "ready"){ if(t - G.last > 600){ G.early++; yuSay(G.early > 1 ? "아직이야 아직! 😳" : "앗 아직 삐 안 했어! 😳", 1100); } G.last = t; return; }
    if(G.phase !== "race" || G.fin.yu) return;
    if(!G.dove){ rcDive(false); G.last = t; return; }
    if(t - G.last < 85) return; G.last = t;
    const n = Math.round((t - G.dove) / RC_BEAT), d = Math.abs(t - G.dove - n * RC_BEAT); let add = 0.03;   // 한 박자에 두 번째부터는 거의 안 늚
    if(n !== G.beatN){ G.beatN = n; const gr = d <= 70 ? "perfect" : d <= 130 ? "good" : "off"; add = gr === "perfect" ? 0.75 : gr === "good" ? 0.55 : 0.15;
      G.combo = gr === "perfect" ? (G.combo || 0) + 1 : 0; if(gr === "perfect"){ G.perf = (G.perf || 0) + 1; G.bestCombo = Math.max(G.bestCombo || 0, G.combo); }
      tmShow(gr === "off" ? "late" : gr, gr === "perfect" ? "PERFECT" : gr === "good" ? "GOOD" : "엇박 💦", G.combo >= 3 ? `${G.combo} 콤보 🔥` : ""); }
    G.pow = Math.min(2.2, G.pow + add); if(G.pow > 1.45 && Math.random() < 0.12) E()?.playEmote?.("yu", "💨", 600); }
  function rcPlace(st){ const M = AREA_MOD.gym, x = k => G.fin[k] ? 1e9 - G.fin[k] : k === "yu" ? (st?.i ?? 0) : (st?.actors?.[k]?.i ?? 0);
    return ["yu", ...G.riv].sort((a, b) => x(b) - x(a)); }
  function rcHud(){ if(!G.riv) return "🏊"; if(G.phase === "ready") return "🏁 삐 소리 나면 💨!"; const M = AREA_MOD.gym, st = S.st; if(!st || !M) return "🏊";
    const m = Math.max(0, Math.min(50, (st.i - M.startI) / (M.endI - M.startI) * 50)), pl = rcPlace(st).indexOf("yu") + 1, t = G.fin.yu || (G.t1 ? now() - G.t1 : 0);
    const bar = Math.round(Math.min(1, G.pow / 1.6) * 5);
    return `🏊 <b>${Math.round(m)}m</b>${G.riv.length ? ` · ${pl}등` : ""} · ${rcFmt(t)}초 <i>${"▮".repeat(bar)}${"▯".repeat(5 - bar)}</i>`; }
  function rcBoard(done){ const M = AREA_MOD.gym; if(!M?.board) return; const st = S.st, t = G?.t1 ? now() - G.t1 : 0;
    const who = ["yu", ...G.riv], nm = k => k === "yu" ? "유나" : RC_RIV[k].n, ln = k => k === "yu" ? 4 : RC_RIV[k].lane;
    const ord = done ? done : who.slice().sort((a, b) => ln(a) - ln(b)), md = ["🥇", "🥈", "🥉"];
    M.board({title:G.cup ? `동네 수영 대회 · ${G.cup === "heat" ? "예선" : "결승"}` : G.mode === "solo" ? "50M 자유형 · 기록 재기" : "50M 자유형 · 결승", clock:G.phase === "ready" ? "READY" : rcFmt(G.fin.yu && done ? G.fin.yu : t),
      rows:ord.map((k, n) => [String(ln(k)), (done && n < 3 && G.riv.length ? md[n] + " " : "") + nm(k), G.fin[k] ? rcFmt(G.fin[k]) : G.phase === "ready" ? "" : "…", k === "yu" ? "yu" : ""])}); }
  function rcEnd(){ const e = E(), M = AREA_MOD.gym; if(!G || G.type !== "race" || G.phase === "end") return; G.phase = "end"; e?.playSet({auto:null});
    const st = S.st, t = now() - G.t1; G.riv.forEach(k => { if(!G.fin[k]){ const a = st?.actors?.[k]; G.fin[k] = t + Math.max(0, (M.endI - (a?.i ?? M.startI)) / (G.spd[k] || 1.3) * 1000); } });   // 아직 못 닿은 사람은 남은 거리로 기록 추정
    const ord = ["yu", ...G.riv].sort((a, b) => G.fin[a] - G.fin[b]), pl = ord.indexOf("yu") + 1, ms = G.fin.yu, sec = +rcFmt(ms);
    const R0 = rec.race = rec.race || {play:0, best:0, gold:{}}; const pb = !R0.best || sec < R0.best; R0.play++; if(pb) R0.best = sec;
    let star = false; if(pl === 1 && G.riv.length && !R0.gold[G.mode]){ R0.gold[G.mode] = 1; rec.stars++; star = true; } save();
    G.phase = "end"; rcBoard(ord); sfx(pl === 1 ? "star" : "ding");
    const md = ["🥇", "🥈", "🥉", "🏅", "🏅"][pl - 1];
    toast(G.riv.length ? `${md} ${pl}등! 기록 ${sec.toFixed(2)}초` : `⏱️ 기록 ${sec.toFixed(2)}초`, (pb ? "🎉 내 최고 기록! " : `최고 기록 ${R0.best.toFixed(2)}초 `) + (star ? "· ⭐ +1" : ""), 3200, true);
    e?.playEmote?.("yu", pl === 1 ? "🥇" : pl === 2 ? "🥈" : pl === 3 ? "🥉" : "💦", 1800);
    yuSay(pl === 1 ? pick(["내가 1등이다!! 🥇", "금메달~! 😆"]) : !G.riv.length ? (pb ? "신기록이다! 😆" : "한 번 더 해 볼래 💪") : pick(["다음엔 꼭 이길 거야 😤", "아 아깝다~! 💦"]), 2000);
    G.riv.forEach((k, n) => later0(900 + n * 700, () => npcSay("@" + k, ord.indexOf(k) < pl ? RC_RIV[k].win : RC_RIV[k].lose, 2200)));
    firstUse("gy_race", "🏊 50m 수영 시합"); renderCard(); later0(3600, checkBadges);
    const riv = G.riv, cup = G.cup; { const pf = G.perf || 0, bc = G.bestCombo || 0; if(pf) later0(1700, () => toast(`✨ PERFECT ${pf}번`, bc >= 3 ? `최고 ${bc} 콤보` : "", 1300)); }
    later(3400, () => { endGame(); later0(2600, () => { if(G || S.floor !== "gym") return; rcClean(riv); setup(); }); }); if(cup) later0(4300, () => cupNext("swim", cup === "heat" ? pl <= 2 : pl === 1, pl)); }
  function rcClean(riv){ const e = E(); if(!e) return; (riv || []).forEach(k => { if(k === "coach"){ S.npcF.coach = null; } else if(!(k === "fr" && Q?.id === "friend")) e.playActor(k, null); }); if(S.floor) areaNpcs(S.floor); }
  function rcTick(st, t){ const e = E(), M = AREA_MOD.gym; if(!e || !M) return; const dt = G.prev ? Math.min(0.1, (t - G.prev) / 1000) : 0.016; G.prev = t;
    if(t - G.bd > 300){ G.bd = t; if(G.phase !== "end") rcBoard(); }
    if(G.phase !== "race") return;
    const len = M.endI - M.startI;
    if(G.dove && !G.fin.yu){ G.pow *= Math.exp(-dt * 1.6); const glide = Math.max(0, 1 - (t - G.dove) / 1000) * 0.6, suit = st.fit === "swim" ? RC_SUIT : 1, v = Math.min(2.15 * suit, (0.55 + G.pow + glide) * suit);
      { const ph = (t - G.dove) % RC_BEAT, on = ph < 70 || ph > RC_BEAT - 70; if(act.classList.contains("beat") !== on) act.classList.toggle("beat", on); }
      if(Math.abs(v - G.v) > 0.03 || !G.vSent){ G.v = v; G.vSent = 1; e.playSet({auto:{h:PI / 2, v}}); }
      if(st.i >= M.endI - 0.02){ G.fin.yu = t - G.t1; e.playSet({auto:null}); sfx("pick"); act.classList.remove("beat"); } }
    if(t - (G.rs || 0) > 380){ G.rs = t; const yp = (st.i - M.startI) / len;   // 상대 속도: 물결처럼 오르내림 + 막판 스퍼트/지침, 유나가 많이 뒤지면 살짝 늦춰 줌
      G.riv.forEach(k => { const a = st.actors?.[k], L = RC_RIV[k]; if(!a || G.fin[k] || t - G.t1 < 1400) return; const p = (a.i - M.startI) / len;
        let v = L.v * (1 + 0.05 * Math.sin(t / 850 + G.ph[k])) * (1 + (p > 0.7 ? L.kick : 0) - (p > 0.5 ? L.fade : 0));
        if(G.dove && p - yp > 0.18) v *= 0.95; if(G.dove && yp - p > 0.15 && k === "coach") v *= 1.04;
        G.spd[k] = v; e.playActor(k, {spd:v}); }); }
    G.riv.forEach(k => { const a = st.actors?.[k]; if(a && !G.fin[k] && a.i >= M.endI - 0.08){ G.fin[k] = t - G.t1; e.playEmote?.("@" + k, "🏁", 700); } });
    const allIn = G.riv.every(k => G.fin[k]);
    if(G.fin.yu && (allIn || t - G.t1 - G.fin.yu > 6000)) rcEnd();
    else if(t - G.t1 > 95000) { if(!G.fin.yu) G.fin.yu = t - G.t1 + Math.max(0, (M.endI - st.i) / 0.55 * 1000); rcEnd(); } }
  /* 동네 대회 (2026-11-28 감독님 "토너먼트로 동네 대회를 한다던가")
     테니스: 8강 지유(1게임) → 4강 아빠(1게임) → 결승 체육 선생님 또는 엄마(다른 4강 승자, 3판 2선승). 수영: 예선(가족 셋, 2등 안) → 결승(선생님까지 넷, 1등 = 우승) */
  const CUP_TN = [{nm:"8강", rv:"fr", need:1, b:"QUARTER FINAL"}, {nm:"4강", rv:"dad", need:1, b:"SEMI FINAL"}, {nm:"결승", rv:null, need:2, b:"FINAL"}];
  function cupOpen(sport){ S.cup = {sport, r:0, fin:Math.random() < 0.75 ? "coach" : "mom"};
    if(sport === "tennis") choose("🏆 동네 테니스 대회 · 8명 토너먼트", "유나·지유 / 아빠·떡집 할머니 / 엄마·빵집 삼촌 / 선생님·시장 아저씨 · 지면 탈락!", [["▶️", "8강 시작 (상대: 지유)", "go"], ["🚪", "다음에 할래", "stop"]]).then(o => { if(o[2] === "go" && !G && S.floor === "court") cupRound(); else S.cup = null; });
    else cupRound(); }
  function cupRound(){ const c = S.cup; if(!c) return;
    if(c.sport === "tennis"){ const R0 = CUP_TN[c.r]; tnStart(R0.rv || c.fin, {nm:R0.nm, need:R0.need, b:R0.b}); }
    else rcStart(c.r === 0 ? "fam" : "all", c.r === 0 ? "heat" : "final"); }
  function cupNext(sport, ok, pl){ const c = S.cup; if(!c || c.sport !== sport) return; const floor = sport === "tennis" ? "court" : "gym", e = E();
    const stage = sport === "tennis" ? CUP_TN[c.r].nm : c.r === 0 ? "예선" : "결승", last = sport === "tennis" ? c.r === CUP_TN.length - 1 : c.r === 1;
    if(!ok){ S.cup = null; toast(last && sport === "swim" && pl <= 3 ? `${["", "🥇", "🥈", "🥉"][pl]} 동네 대회 ${pl}등!` : last ? "🥈 준우승!" : `😭 ${stage} 탈락`, last ? "아깝다~ 다음 대회엔 우승! 💪" : "다음 대회에서 다시 도전!", 2800, true); return; }
    if(last){ rec.cup = rec.cup || {}; rec.cup[sport] = (rec.cup[sport] || 0) + 1; rec.stars += 2; save(); S.cup = null; sfx("star");
      toast(`🏆 동네 ${sport === "tennis" ? "테니스" : "수영"} 대회 우승!!`, `⭐ +2 · 트로피 ${rec.cup[sport]}개`, 3600, true); e?.playEmote?.("yu", "🏆", 2600); yuSay(pick(["내가 우승이다!!! 🏆", "엄마 아빠 나 우승했어!! 😆"]), 2400);
      ["mom", "dad", "fr"].forEach((k, n) => later0(800 + n * 600, () => { if(S.st?.actors?.[k]) npcSay("@" + k, pick(["우리 유나 최고!! 👏", "챔피언이다~ 🏆", "축하해 유나야! 🎉"]), 2000); }));
      later0(1500, checkBadges); return; }
    c.r++; let who, msg;
    if(sport === "tennis"){ const R0 = CUP_TN[c.r], rv = R0.rv || c.fin; who = TN_RIV[rv].n;
      msg = c.r === 1 ? "다른 8강: 아빠·엄마·선생님 다 이겼대" : c.fin === "coach" ? "다른 4강: 선생님이 엄마를 이겼대" : "다른 4강: 엄마가 선생님을 이겼대! 😮"; }
    else { who = "선생님까지 넷이서"; msg = `예선 ${pl}등으로 통과!`; }
    sfx("ding"); choose(`🏆 ${stage} 통과! 🎉`, `${msg} · 다음 ${sport === "tennis" ? CUP_TN[c.r].nm : "결승"}: ${who}`, [["▶️", `${sport === "tennis" ? CUP_TN[c.r].nm : "결승"} 시작`, "go"], ["🚪", "오늘은 그만할래", "stop"]])
      .then(o => { if(o[2] === "go" && !G && S.floor === floor) cupRound(); else S.cup = null; }); }
  window.__ygCup = {open:k => cupOpen(k), round:() => cupRound(), next:(k, ok, pl) => cupNext(k, ok, pl), s:() => S.cup};   // 시험용
  window.__ygRC = {start:m => rcStart(m), tap:() => rcTap(), g:() => G};   // 시험용
  /* 인형뽑기: 집게가 인형 칸 위에 올 때 뽑기. 3번 */
  const DOLLS = ["🧸", "🐰", "🦄", "🐻", "🐥"];
  function grab(){ const e = E(); if(G?.type !== "claw" || G.phase !== "aim" || !e) return; const p = G.pos ?? 0, ok = p >= G.zone - 0.01 && p <= G.zone + 0.17;
    G.phase = "drop"; sfx("jump"); e.playSet({act:{k:"claw"}}); e.playEmote?.([28.45, 1.75, 1.15], "🪝", 1100); yuSay("내려가라~ 🪝", 900);
    later(1300, () => { if(G?.type !== "claw") return;
      if(ok){ const d = pick(DOLLS); G.got.push(d); sfx("star"); yuSay(`${d} 뽑았다!! 꺄~ 😆`, 1800); e.playEmote?.([28.45, 2.3, 1.2], d, 1600); }
      else { sfx("bump"); yuSay(pick(["아깝다~ 미끄러졌어 😭", "집게 힘이 너무 약해!! 😤", "거의 다 왔는데… 🥲"]), 1600); }
      G.tries--; if(G.tries <= 0){ clawEnd(); return; }
      G.zone = 0.08 + Math.random() * 0.74; grillEl.querySelector(".bar em").style.left = (G.zone * 100).toFixed(1) + "%"; G.t0 = now() + 900; G.spd *= 0.85; G.phase = "aim"; }); }
  function clawEnd(){ G.phase = "end"; grillEl.hidden = true; rec.dolls = (rec.dolls || []).concat(G.got).slice(-30); save();
    toast(G.got.length ? `🧸 ${G.got.join(" ")} 뽑았다!` : "😭 하나도 못 뽑았다", G.got.length ? "인형 안고 다니기" : "다음엔 꼭!", 2400);
    if(G.got.length && !carry) setCarry(G.got[0]); firstUse("claw", "🧸 인형뽑기"); later(1600, () => { endGame(); checkBadges(); }); }
  function shoot(){ const e = E(), st = S.st; if(G?.type !== "futsal" || !st?.ball || !e) return; const b = st.ball;
    if(Math.hypot(b.i - st.i, b.j - st.j) > 0.75){ yuSay("공이 멀어요~ 🏃‍♀️", 1000); return; }
    const gj = GOAL.gj + (Math.random() - 0.5) * 1.3, gi = GOAL.i1 + 0.3, dx = gi - b.i, dy = gj - b.j, L = Math.hypot(dx, dy) || 1; e.playKick(dx / L * 8.2, dy / L * 8.2); sfx("jump"); yuSay(pick(["슛~!! ⚽", "받아라~! 💥"]), 1000); }
  function pass(){ const e = E(), st = S.st; if(G?.type !== "futsal" || !st?.ball || !e) return; const b = st.ball, m = st.actors?.[G.mate]; if(!m) return;
    if(Math.hypot(b.i - st.i, b.j - st.j) > 0.75){ yuSay("공이 멀어요~ 🏃‍♀️", 1000); return; }
    const dx = m.i - b.i, dy = m.j - b.j, L = Math.hypot(dx, dy) || 1, v = Math.min(7.5, 2.4 + L * 1.15); e.playKick(dx / L * v, dy / L * v); G.held = null; sfx("blip"); yuSay(pick(["패스~! 🤝", "받아! 👋"]), 900); }
  function frBye(){ const e = E(); if(!e) return; e.playActor("fr", {to:e.playFree(16.4, 19.0, 0.2), spd:1.3, pose:"stand"}); later0(900, () => npcSay("@fr", "안녕~ 내일 학교에서 봐! 👋", 2400));
    later0(5200, () => { if(Q?.id !== "friend") E()?.playActor("fr", null); }); }
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
      const rv = G.rival = Q?.id === "friend" ? "fr" : "mom"; S.frSwim = true;
      G.phase = "ready"; e.playSet({pos:[21.25, 18.45, Math.PI / 2], freeze:true, water:[POOL], mark:{at:[28.35, 18.45]}});
      e.playActor(rv, {at:[21.25, 19.35, Math.PI / 2], pose:"swim", to:null});
      setup();
      npcSay("@" + rv, rv === "fr" ? "나 수영 학원 다닌다~ 각오해! 😆" : "준비됐어? 엄마 안 봐준다~ 😆");
      ["3", "2", "1"].forEach((n, k) => later(1200 + k * 900, () => toast(n, "", 700)));
      later(1200 + 3 * 900, () => { toast("출발! 🏁", "", 900); e.playSet({freeze:false}); e.playActor(rv, {to:[28.35, 19.35], spd:1.18}); G.phase = "race"; G.until = now() + 40000; });
    }
    if(type === "tag"){
      const w = e.playWhere("_dir"), a = S.st?.actors?.dad, at = a ? [a.i, a.j] : e.playFree(...(w ? [w[0], w[1]] : [32.2, 4.4]), 0.22);
      e.playActor("dad", {at:[at[0], at[1], 0], pose:"stand", to:null}); setup();
      G.phase = "ready"; G.next = 0; toast("🏃 아빠를 잡아라!", "50초 · 번개 사탕 먹으면 빨라져요", 2200); npcSay("@dad", "잡아 봐라~ 😜", 2200);
      later(1200, () => { G.phase = "run"; G.t1 = now(); G.until = now() + 50000; });
    }
    if(type === "arcade"){   // 오락기: 6초 동안 버튼 연타
      e.playSet({freeze:true, mark:null}); G.phase = "ready"; toast("🕹️ 버튼 연타!", "준비… (버튼·스페이스)", 1400); yuSay("최고 점수 깰 거야! 🕹️", 1400);
      later(1400, () => { G.phase = "go"; G.until = now() + 6000; sfx("go"); toast("시작!! 👾", "", 700); });
    }
    if(type === "futsal"){   // 풋살 한 판: 엄마랑 한 팀, 아빠가 골키퍼. 슛 · 패스 버튼
      const tm = Q?.id === "friend" ? "fr" : "mom"; G.mate = tm; G.goals = 0; G.phase = "play"; G.until = now() + 90000; G.next = 0;
      e.playSet({ball:[6.6, 4.8], pos:[5.6, 4.8, PI / 2], mark:null}); e.playActor("dad", {at:[12.2, 4.8, -PI / 2], pose:"stand", to:null}); e.playActor(tm, {at:[6.2, 2.9, PI / 2], pose:"stand", to:null}); setup();
      toast("⚽ 풋살 한 판! 90초", "오른쪽 골대에 슛 · 패스로 같이 하기", 2600); npcSay("@dad", "골키퍼는 아빠다~ 못 넣을걸? 😎", 2400); later(1500, () => npcSay("@" + tm, tm === "fr" ? "유나야 패스해! 👋" : "엄마한테 패스~! 💕", 2000));
    }
    if(type === "freeze"){   // 아빠가 갑자기 옥상에! 얼음
      const at = e.playFree(EXIT[0] + 1.2, EXIT[1] - 0.6, 0.22); e.playActor("dad", {at:[at[0], at[1], 0], pose:"stand", to:null}); setup();
      G.phase = "warn"; sfx("bump"); toast("😱 아빠가 올라왔다!", "얼음! 움직이면 들켜요", 2200); yuSay("헉 아빠다!! 얼음 🧊", 1800);
      later(1600, () => { G.phase = "look"; G.until = now() + 5200; G.next = 0; npcSay("@dad", "음? 방금 누가 있었나… 👀", 2600); });
    }
    if(type === "catmeat"){   // 고기를 물고 도망가는 고양이
      setCarry(""); const s0 = S.st, p0 = s0 ? [s0.i + Math.sin(s0.h) * 1.3, s0.j + Math.cos(s0.h) * 1.3] : [EXIT[0] + 2, EXIT[1]]; G.cat = e.playFree(p0[0], p0[1], 0.2).slice(); G.to = null; G.phase = "ready";
      refreshItems(); sfx("bump"); toast("😱 고양이가 고기를 물고 도망갔다!", "크레파스 잡기 · 50초", 2400); yuSay("앗 크레파스!! 그거 파티 고기야!! 😱", 2400);
      later(1100, () => { G.phase = "run"; G.t1 = now(); G.until = now() + 50000; G.lt = now(); });
    }
    if(type === "quiz"){   // 학교 앞 선생님 깜짝 퀴즈 5문제 (2026-11-24)
      e.playSet({freeze:true, mark:null}); G.phase = "pick"; G.ok = 0; const qs = QUIZ.slice().sort(() => Math.random() - 0.5).slice(0, 5);
      const ask = k => { if(G?.type !== "quiz") return;
        if(k >= qs.length){ const w = G.ok; G.phase = "end"; rec.quizBest = Math.max(rec.quizBest || 0, w); if(w >= 3){ rec.stars++; } save(); renderCard();
          sfx(w >= 3 ? "star" : "ding"); toast(`📝 ${w} / 5 맞혔다!`, w >= 5 ? "만점! ⭐ +1" : w >= 3 ? "⭐ +1" : "다음엔 더 잘할 수 있어 💪", 2600, w >= 3);
          npcSay("@teach", w >= 5 ? "만점이네! 유나 천재 아니야? 💯" : w >= 3 ? "잘했어 유나야~ 👏" : "괜찮아, 틀리면서 배우는 거야 😊", 3000); checkBadges();
          later(2600, () => { endGame(); advance(); }); return; }
        const [q, o, a] = qs[k]; choose(`📝 퀴즈 ${k + 1}/5`, q, o.map((x, n) => { const t = x.split(" "), em = t.length > 1 && /\p{Extended_Pictographic}/u.test(t[0]); return [em ? t[0] : ["①", "②", "③"][n], em ? t.slice(1).join(" ") : x, n]; })).then(c => { if(G?.type !== "quiz") return;
          const good = c[2] === a; if(good){ G.ok++; sfx("pick"); yuSay(pick(["정답!! 😆", "맞았다~ ✌️", "역시 나야 😎"]), 1300); E()?.playEmote?.("yu", "⭕", 1100); }
          else { sfx("ding"); yuSay("땡… 😢", 1200); npcSay("@teach", `정답은 ${o[a]}!`, 1800); E()?.playEmote?.("yu", "❌", 1100); }
          later(1700, () => ask(k + 1)); }); };
      toast("📝 선생님 깜짝 퀴즈", "5문제 · 3개 넘게 맞히면 ⭐", 1800); later(1400, () => ask(0));
    }
    if(type === "edit"){   // 색보정실에서 몰래 축하 영상 편집
      e.playSet({freeze:true, mark:null}); G.phase = "pick"; G.picks = [];
      const ask = k => { if(G?.type !== "edit") return;
        if(k >= EDIT_Q.length){ G.phase = "render"; rec.partyEdit = G.picks.map(x => x[0] + " " + x[1]); save();
          makeIt({make:{ms:3600, txt:"영상 렌더링 중", fx:["🎞️", "✂️", "🎵", "💕"]}, got:"📼"}, "yu", () => { setCarry("📼"); sfx("pick"); yuSay("완성!! 엄마 아빠 울겠다 🥹", 2200); toast("📼 축하 영상 완성!", "이제 옥상 그릴로", 2400); later(1800, () => { endGame(); advance(); }); });
          return; }
        const [q, o] = EDIT_Q[k]; choose(`🎞️ 편집 ${k + 1}/${EDIT_Q.length}`, q, o).then(c => { if(G?.type !== "edit") return; G.picks.push(c); yuSay(`${c[0]} ${c[1]}!`, 1500); later(900, () => ask(k + 1)); }); };
      toast("🎞️ 몰래 편집 시작", "장면 · 음악 · 자막 고르기", 1800); yuSay("아빠처럼 편집해 보자! 🎬", 1800); later(1300, () => ask(0));
    }
    if(type === "grill"){   // 고기 굽기: 막대가 하얀 칸 안에 올 때 뒤집기
      setCarry(""); e.playSet({freeze:true, mark:null, pos:[20.9, 14.15, 0]}); G.perfect = 0; G.total = 4; G.phase = "cook"; G.t0 = now() + 1500;
      grillEl.querySelector(".m").textContent = "🥩"; grillEl.hidden = false; toast("🔥 고기 굽기!", "막대가 하얀 칸에 오면 뒤집기 (버튼·스페이스)", 2600); yuSay("지글지글~ 🔥", 1600); e.playEmote?.([20.9, 15.0, 1.0], "🔥", 1600);
    }
    if(type === "pong"){   // 아빠랑 탁구
      e.playSet({freeze:true, mark:null, pos:[PONG.i, 3.05, 0], act:"pong"}); e.playActor("dad", {at:[PONG.i, 5.6, PI], pose:"stand", to:null}); setup();
      G.rally = 0; G.best = 0; G.miss = 0; G.phase = "ready"; G.until = now() + 60000;
      toast("🏓 아빠랑 탁구!", "공이 앞에 오면 치기 (버튼·스페이스) · 3번 놓치면 끝", 2600); npcSay("@dad", "아빠 탁구 동호회 출신이다~ 😎", 2200);
      later(2000, () => { G.phase = "play"; serve(); });
    }
    if(type === "claw"){   // 인형뽑기
      e.playSet({freeze:true, mark:null, pos:[28.45, 2.6, PI], act:"claw"}); G.tries = 3; G.got = []; G.phase = "aim"; G.t0 = now() + 1200; G.spd = 1; G.zone = 0.1 + Math.random() * 0.7;
      grillEl.classList.add("claw"); grillEl.querySelector(".m").textContent = "🧸"; grillEl.querySelector(".bar em").style.left = (G.zone * 100).toFixed(1) + "%"; grillEl.hidden = false;
      toast("🧸 인형뽑기! 3번", "집게가 분홍 칸에 오면 뽑기 (버튼·스페이스)", 2400); yuSay("저 토끼 꼭 뽑을 거야! 🐰", 1600);
    }
    if(type === "ending"){   // 서프라이즈!
      e.playSet({freeze:true, mark:null}); G.phase = "show"; lbOn(true); setCarry("");
      fade.textContent = "🙈 엄마 아빠 눈 가리고 옥상으로…"; fade.classList.add("on"); yuSay("엄마 아빠~ 눈 감고 올라와요! 🙈", 2200);
      later(1700, () => { e.playSet({pos:[24.4, 4.75, Math.PI]}); e.playActor("dad", {at:[23.05, 5.1, Math.PI - 0.35], pose:"stand", to:null}); e.playActor("mom", {at:[25.75, 5.1, Math.PI + 0.35], pose:"stand", to:null}); setup(); nightEl.classList.add("on"); });
      later(2700, () => fade.classList.remove("on"));
      later(3100, () => { yuSay("서프라이즈~!! 🎉", 2400); flash(); sfx("goal"); e.playSet({wave:2400});
        for(let k = 0; k < 18; k++) later(k * 420, () => e.playEmote?.([21.5 + Math.random() * 6, 0.5 + Math.random() * 4, 3 + Math.random() * 1.6], pick(["🎆", "🎇", "✨", "🎆", "🎉"]), 1500)); });
      later(4800, () => { npcSay("@mom", "어머… 유나가 이걸 다 준비한 거야? 🥹", 3000); e.playEmote?.("@mom", "🥹", 1600); });
      later(7300, () => { const sc = S.secret ?? 3; npcSay("@dad", sc >= 3 ? "진짜 하나도 몰랐어! 우리 딸 최고 감독이네 😭" : sc >= 1 ? "어쩐지 아까 수상하더라~ 😆 고마워 유나야" : "사실 다 알고 있었지롱~ 그래도 감동이다 😭", 3200); e.playEmote?.("@dad", "😭", 1600); });
      later(10200, () => { toast("🍖 다 같이 고기 먹는 중", "", 2200); ["yu", "@dad", "@mom"].forEach(k => e.playEmote?.(k, "🍖", 1600));
        later(1500, () => npcSay("@dad", (rec.partyGrill || 0) >= 3 ? "고기 진짜 잘 구웠다! 👍" : "조금 탔어도 우리 딸이 구운 게 제일 맛있어 😋", 2800)); });
      later(13600, () => { yuSay("짠~! 🥤", 1600); e.playEmote?.("yu", "🥤", 1500); e.playEmote?.("@dad", "🍺", 1500); e.playEmote?.("@mom", "🥂", 1500); sfx("pick"); });
      later(15600, () => { const ed = rec.partyEdit || []; toast("📼 유나 감독의 축하 영상 상영 중…", ed.join(" → "), 3200); e.playEmote?.([24.4, 2.4, 2.2], "📼", 2600);
        later(1800, () => npcSay("@mom", /사랑해요/.test(ed[2] || "") ? "엄마 아빠도 사랑해 유나야 💕" : "‘감독 유나 올림’ 너무 귀엽다 😆", 3000)); });
      later(20200, () => { credEl.innerHTML = `<div class="in"><small>THE END</small><h2>엄마 아빠 몰래 깜짝 파티</h2><small>CREDITS</small><p>감독 · 각본 · 편집 · 고기 굽기 — 유나</p><p>주연 — 엄마 · 아빠</p><p>케이크 — 1층 카페 언니</p><p>특별출연 — 크레파스 🐈</p><button type="button">⭐ +3 받기</button></div>`;
        credEl.hidden = false; sfx("star"); credEl.querySelector("button").onclick = ev => { ev.stopPropagation(); credEl.hidden = true; rec.stars += 2; save(); endGame(); advance(); }; });
    }
    if(COL.has(type)){
      const bb = type === "bubble", sp = e.playSpots(bb ? 12 : 10, Math.random() * 1e9 | 0, bb ? [[AREA.park.gate[0], AREA.park.gate[1], 1.6]] : AVOID, bb ? 1.7 : 1.9);
      G.items = sp.map((p, k) => ({id:"s" + k, e:bb ? "🫧" : "🌟", i:p[0], j:p[1], y:k % 3 === 2 ? 1.12 : 0.4, high:k % 3 === 2, s:0.6}));
      // 제한 시간: 가까운 별부터 도는 길이 ÷ 걷는 속도 × 1.7 + 여유 (별이 멀리 흩어져도 공평하게)
      let ci = S.st?.i ?? EXIT[0], cj = S.st?.j ?? EXIT[1], len = 0; const left = sp.slice();
      while(left.length){ let bk = 0, bd = 1e9; left.forEach((p, k) => { const d = Math.hypot(p[0] - ci, p[1] - cj); if(d < bd){ bd = d; bk = k; } }); len += bd; [ci, cj] = left.splice(bk, 1)[0]; }
      const sec = Math.max(35, Math.ceil((len / 2.35 * 1.7 + 12) / 5) * 5);
      G.total = G.items.length; G.until = now() + sec * 1000; refreshItems();
      if(bb){ toast("🫧 비눗방울 터뜨리기!", `${G.total}개 · 높은 건 점프 · ${sec}초`, 2200); yuSay("비눗방울이다~ 다 터뜨려야지 🫧"); }
      else { toast("🌠 별똥별 줍기!", `${G.total}개 · 높은 건 점프 · ${sec}초`, 2200); yuSay("별이 떨어졌다! 다 주워야지 🌟"); }
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
    if(COL.has(G.type)) h = `${G.type === "bubble" ? "🫧" : "🌟"} ${G.n} / ${G.total} ${tm}`;
    if(G.type === "arcade") h = G.phase === "go" ? `🕹️ ${G.n * 100}점 ${tm}` : "🕹️ 준비…";
    if(G.type === "futsal") h = `⚽ ${G.goals} 골 ${tm}`;
    if(G.type === "freeze") h = G.phase === "look" ? `🧊 얼음! 움직이지 마 ${tm}` : "😱 아빠다!";
    if(G.type === "pong") h = `🏓 랠리 ${G.rally} · 놓침 ${G.miss}/3 ${tm}`;
    if(G.type === "squirt") h = sqHud();
    if(G.type === "race") h = rcHud();
    if(G.type === "tennis") h = G.rv === "wall" ? `🧱 연속 ${G.rally} · 최고 ${Math.max(G.best, G.rally)} · 놓침 ${G.miss}/3 ${tm}` : G.pts ? `🎾 유나 <b>${G.pts[0] >= 3 && G.pts[1] >= 3 ? (G.pts[0] > G.pts[1] ? "AD" : "40") : TN_PT[Math.min(3, G.pts[0])]}</b> : <b>${G.pts[0] >= 3 && G.pts[1] >= 3 ? (G.pts[1] > G.pts[0] ? "AD" : "40") : TN_PT[Math.min(3, G.pts[1])]}</b> ${TN_RIV[G.rv].n} · 게임 ${G.games[0]}:${G.games[1]}${G.rally >= 3 ? ` <i>랠리 ${G.rally}</i>` : ""}` : "🎾";
    if(G.type === "catmeat") h = G.phase === "run" ? `🐈 크레파스 잡기! ${tm}` : "😱 고기 도둑!";
    if(["grill", "edit", "ending", "claw"].includes(G.type)){ hud.hidden = true; return; }
    if(S.st?.boost > 0) h += ` <i>⚡${Math.ceil(S.st.boost / 1000)}</i>`;
    if(hud.innerHTML !== h) hud.innerHTML = h;
  }
  function freeHud(){
    let h = "";
    if(PR.chase && PR.chase.phase !== "warn"){ const C = PR.chase, left = Math.max(0, Math.ceil(((C.phase === "seek" ? C.seekUntil : C.until) - now()) / 1000));
      h = C.phase === "seek" ? `🫣 쉿… 숨는 중 <i>${left}</i>` : C.phase === "caught" ? "🙈 딱 걸렸다" : `🏃‍♀️ 엄마한테서 도망쳐요 <i>${left}</i>`; }
    else if(PR.place) h = `🎀 ${PR.place[2]} 놓을 자리로 가요`;
    else if(Q?.id === "cat" && curStep()?.find && S.floor === Q.catF) h = S.catHint || "";
    else if(S.st?.boost > 0) h = `⚡ 쌩쌩! <i>${Math.ceil(S.st.boost / 1000)}초</i>`;
    else if(S.near != null && S.near < 3.2) h = S.nearHigh && S.near < 1.2 ? "✨ 바로 위에 있어요! 점프 🦘" : "✨ 근처에 뭔가 반짝여요";
    hud.hidden = !h; if(h && hud.innerHTML !== h) hud.innerHTML = h;
  }
  function gameTick(st){
    advTick(st);
    if(!G){ gameHud(); return; } const e = E(), t = now();
    if(G.type === "tennis"){ tnTick(st, t); gameHud(); return; }
    if(G.type === "squirt"){ sqTick(st, t); gameHud(); return; }
    if(G.type === "race"){ rcTick(st, t); gameHud(); return; }
    // 공이 경기장 밖으로 나가면 잠깐 뒤 가운데로 (2026-11-24 감독님 "축구할때 공나가면 자동으로 들어와야지 다시")
    if((G.type === "ball" || G.type === "futsal") && st.ball){ const b = st.ball, m = 0.15, out = b.i < FSC.i0 - m || b.i > FSC.i1 + m || b.j < FSC.j0 - m || b.j > FSC.j1 + m;
      if(!out || G.cool || G.phase === "goal") G.outT = 0; else if(!G.outT) G.outT = t + 900;
      else if(t > G.outT){ G.outT = 0; const c = G.type === "futsal" ? [6.6, 4.8] : BALL0; if(e.playBallAt) e.playBallAt(c[0], c[1]); else e.playSet({ball:c}); if(G.type === "futsal") G.held = null;
        sfx("blip"); toast("⚽ 아웃!", "공이 가운데로 돌아왔어요", 1200); yuSay(pick(["공 어디 가~ 😅", "아웃! 다시 간다 ⚽"]), 1300); } }
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
      const rv = G.rival || "mom", mom = st.actors?.[rv];
      if(st.i > 28.05){ G.phase = "end"; e.playActor(rv, {to:null}); yuSay("내가 이겼다!! 🏆"); later(600, () => npcSay("@" + rv, rv === "fr" ? "와 너 진짜 빠르다! 👏" : "와~ 유나 진짜 빠르다! 👏")); toast("🏆 유나 승!");
        later(2600, () => { endGame(); advance(); }); }
      else if(mom && !mom.moving && mom.i > 28.2){ G.phase = "end"; npcSay("@" + rv, rv === "fr" ? "내가 이겼다~ 한 판 더? 😜" : "엄마가 이겼다~ 한 판 더? 😆"); yuSay("다시 해! 다시! 😤"); toast(`${rv === "fr" ? "지유" : "엄마"} 승! 😆`, "🔁 버튼으로 다시 도전", 2400);
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
    if(G?.type === "arcade" && G.phase === "go" && t > G.until){ G.phase = "end"; const sc = G.n * 100, best = rec.arcade || 0; if(sc > best){ rec.arcade = sc; save(); }
      sfx(sc > best ? "star" : "ding"); toast(`🕹️ ${sc}점!`, sc > best ? "🎉 신기록!" : `최고 기록 ${best}점`, 2400); yuSay(sc > best ? "신기록이다!! 😆" : pick(["한 판 더! 🕹️", "손가락 아파 😵"]), 1800);
      firstUse("arcade", "🕹️ 오락기 한 판"); later(1200, () => endGame()); }
    if(G?.type === "futsal" && G.phase === "play" && st.ball){ const b = st.ball, kp = st.actors?.dad, m = st.actors?.[G.mate];
      if(b.i > GOAL.i1 - 0.32 && Math.abs(b.j - GOAL.gj) < GOAL.gw + 0.05){ G.goals++; sfx("goal"); G.phase = "goal"; yuSay(pick(["골~~~!! ⚽", "들어갔다!! 😆"]), 1500); toast(`⚽ 골! ${G.goals}골`, "", 1400);
        npcSay("@dad", pick(["아빠가 졌다 😵", "우와 못 막겠다! 👏"]), 2000); if(m) e.playEmote?.("@" + G.mate, "🙌", 1400);
        later(1600, () => { if(G?.type !== "futsal") return; e.playBallAt(6.6, 4.8); G.phase = "play"; G.held = null; }); }
      else if(b.i < GOAL.i0 + 0.32 && Math.abs(b.j - GOAL.gj) < GOAL.gw + 0.05){ e.playBallAt(6.6, 4.8); toast("앗 자책골 😅", "다시!", 1200); }
      if(t > (G.next || 0)){ G.next = t + 300;
        if(kp) e.playActor("dad", {to:[12.2, Math.max(4.1, Math.min(5.5, b.j))], spd:1.5});   // 골키퍼: 공 따라 옆으로
        if(m && !G.held){ const ti = Math.min(11, Math.max(2, st.i + 2.2)), tj = st.j < 4.8 ? Math.min(7.8, st.j + 2.2) : Math.max(1.8, st.j - 2.2); e.playActor(G.mate, {to:[ti, tj], spd:1.9}); } }
      if(kp && b.i > 11.3 && Math.hypot(b.i - kp.i, b.j - kp.j) < 0.5 && !(G.saveT > t)){ G.saveT = t + 1200; e.playKick(-4.5, (Math.random() - 0.5) * 3); e.playEmote?.("@dad", "🧤", 1000); npcSay("@dad", pick(["막았다~! 🧤", "어림없지 😎"]), 1600); sfx("bump"); }
      if(m && !G.held && Math.hypot(b.i - m.i, b.j - m.j) < 0.5){ G.held = t; e.playKick(0, 0); e.playActor(G.mate, {to:null}); npcSay("@" + G.mate, pick(["받았어! 👍", "나이스 패스~"]), 1200);
        later(900, () => { if(G?.type !== "futsal" || !S.st?.ball) return; const s2 = S.st, fi = s2.i + Math.sin(s2.h) * 1.1, fj = s2.j + Math.cos(s2.h) * 1.1, bb = s2.ball, dx = fi - bb.i, dy = fj - bb.j, L = Math.hypot(dx, dy) || 1, v = Math.min(7, 2.4 + L * 1.1);
          E()?.playKick(dx / L * v, dy / L * v); npcSay("@" + G.mate, "유나 슛해!! ⚽", 1400); later(600, () => { if(G) G.held = null; }); }); }
      if(t > G.until){ G.phase = "end"; const w = G.goals; if(w > 0){ rec.stars++; save(); renderCard(); } sfx(w ? "star" : "ding"); toast(`⚽ 경기 끝! ${w}골`, w ? "⭐ +1 · 한 판 더 하려면 오른쪽 버튼" : "다음엔 꼭 넣자! 💪", 2600);
        npcSay("@dad", w >= 3 ? "해트트릭! 우리 딸 국가대표다 😲" : w ? "잘했어~ 다음엔 아빠가 막는다 😆" : "아빠 골키퍼 최고지? 😎", 2600); firstUse("futsal", "⚽ 풋살 한 판"); later(2600, () => { endGame(); setup(); renderCard(); }); }
    }
    if(G?.type === "freeze" && G.phase === "look"){
      if(st.moving){ G.phase = "end"; S.secret = Math.max(0, (S.secret ?? 3) - 1); rec.partySecret = S.secret; save(); sfx("bump");
        e.playActor("dad", {h:Math.atan2(st.i - (st.actors?.dad?.i ?? st.i), st.j - (st.actors?.dad?.j ?? st.j))}); npcSay("@dad", "유나야? 거기서 뭐 해? 🤨", 2400);
        toast("🤫 들킬 뻔했다!", `비밀 하트 ${"❤️".repeat(S.secret)}${"🤍".repeat(3 - S.secret)}`, 2400);
        later(1300, () => yuSay("아, 아무것도 아냐! 바람 쐬러 왔어 😅", 2200)); later(3000, () => npcSay("@dad", "그래? 이따 아빠랑 놀자~ 😆", 2200)); later(4800, () => { endGame(); advance(); }); }
      else if(t > G.until){ G.phase = "end"; npcSay("@dad", "바람 소리였나… 🤔 다시 일하러 가야지", 2600); toast("🤫 휴~ 안 들켰다!", "", 1800); later(2600, () => { endGame(); advance(); }); }
      else if(t > G.next){ G.next = t + 900; e.playActor("dad", {h:Math.random() * Math.PI * 2}); }
    }
    if(G?.type === "catmeat" && G.phase === "run" && G.cat){
      const dtc = Math.min(0.1, (t - (G.lt || t)) / 1000); G.lt = t; const d = Math.hypot(G.cat[0] - st.i, G.cat[1] - st.j);
      if(d < 0.75 || t > G.until){ const got = d < 0.75; G.phase = "end"; G.cat = null; refreshItems(); sfx(got ? "star" : "pick");
        yuSay(got ? "잡았다!! 크레파스 고기 내놔~ 😤" : "어? 고기 두고 갔네 😹", 2200); toast(got ? "🐈 크레파스 잡았다!" : "😹 크레파스가 고기를 두고 갔어요", "고기는 옥상 아이스박스에 넣어 둘게요 🥩", 2600);
        later(2600, () => { endGame(); advance(); }); }
      else { if(t > (G.next || 0)){ G.next = t + 420; G.spd = 2.05 - 0.75 * Math.min(1, (t - G.t1) / 50000);
          if(d < 5){ let best = null, bs = -1e9; for(let k = 0; k < 16; k++){ const an = k * Math.PI / 8; for(const L of [1.2, 2.0]){ const ti = G.cat[0] + Math.sin(an) * L, tj = G.cat[1] + Math.cos(an) * L; if(!e.playClear(G.cat[0], G.cat[1], ti, tj, 0.2)) continue;
            const nd = Math.hypot(ti - st.i, tj - st.j), sc = nd + Math.random() * 0.7 - (nd < d ? 2.2 : 0); if(sc > bs){ bs = sc; best = [ti, tj]; } } } G.to = best; }
          else G.to = null; }
        if(G.to){ const vx = G.to[0] - G.cat[0], vy = G.to[1] - G.cat[1], L = Math.hypot(vx, vy); if(L > 0.02){ const m = Math.min(L, G.spd * dtc); G.cat[0] += vx / L * m; G.cat[1] += vy / L * m; } }
        e.playItem("pcat", {at:G.cat}); if(Math.random() < 0.012) e.playEmote?.([G.cat[0], G.cat[1], 0.55], pick(["🥩", "😼"]), 900); }
    }
    if(G?.type === "pong" && G.phase === "play" && G.b){ const b = G.b, u = (t - b.t0) / b.dur, uu = Math.min(1.25, Math.max(0, u));
      const i = b.f[0] + (b.to[0] - b.f[0]) * uu, j = b.f[1] + (b.to[1] - b.f[1]) * uu, y = 0.9 + Math.abs(Math.sin(Math.PI * Math.min(1, uu) * 2)) * 0.26;
      e.playItem("pball", {at:[i, j], y});
      if(b.dir === "in" && u > 1.2){ G.miss++; sfx("bump"); yuSay(pick(["앗 놓쳤다 😣", "으앗 너무 빨라! 😵", "다시 다시! 😤"]), 1000); G.best = Math.max(G.best, G.rally); G.rally = 0; G.b = null; refreshItems();
        if(G.miss >= 3 || t > G.until) pongEnd(); else later(1000, serve); }
      else if(b.dir === "out" && u >= 1){ if(t > G.until) pongEnd(); else serve(); } }
    if(G?.type === "claw" && G.phase === "aim"){ const v = Math.max(0, t - G.t0) / (1150 * G.spd); G.pos = (1 - Math.cos(v * Math.PI)) / 2; grillEl.querySelector(".bar i").style.left = (G.pos * 100).toFixed(1) + "%";
      const lb = `남은 기회 ${G.tries} · 뽑은 인형 ${G.got.join("") || "없음"}`; if(grillEl.querySelector("b").textContent !== lb) grillEl.querySelector("b").textContent = lb; }
    if(G?.type === "grill" && G.phase === "cook"){ const p = Math.max(0, (t - G.t0) / 2600); grillEl.querySelector(".bar i").style.left = (Math.min(1, p) * 100).toFixed(1) + "%";
      const lb = `${G.n + 1}번째 고기 · 완벽 ${G.perfect}`; if(grillEl.querySelector("b").textContent !== lb) grillEl.querySelector("b").textContent = lb; if(p >= 1) flipMeat(true); }
    if(COL.has(G?.type) && G.phase !== "end" && t > G.until){ G.phase = "end"; yuSay("아깝다~ 조금만 더 빨리! 😢"); toast(`시간 끝! ${G.type === "bubble" ? "🫧" : "🌟"} ${G.n}/${G.total}`, "🔁 버튼으로 다시 해 봐요", 2400); later(1200, () => { endGame(); setup(); renderCard(); }); }
    gameHud();
  }
  /* 모험: 보물 레이더 · 고양이 · 💬 부름 */
  function advTick(st){
    const e = E(); if(!e) return; const t = now();
    if((S.n || 0) % 6 === 0){ let bd = null, bh = false; if(!G || !COL.has(G.type)) S.spots.forEach((p, k) => { if(rec.tre[`${S.floor}:${k}`]) return; const d = Math.hypot(p[0] - st.i, p[1] - st.j); if(bd == null || d < bd){ bd = d; bh = !!TREASURE[S.floor][k]?.[2]; } }); S.near = bd; S.nearHigh = bh; }
    if(Q?.id === "cat"){ const sp = curStep();
      if(sp?.find && S.floor === Q.catF && Q.catAt){ const d = Math.hypot(Q.catAt[0] - st.i, Q.catAt[1] - st.j);
        S.catHint = d < 2.2 ? "🔥🔥 야옹! 바로 옆이에요" : d < 4.5 ? "🔥 야옹~ 소리가 커져요" : d < 8 ? "🙂 어디선가 야옹…" : "🧊 조용해요…";
        if(d < 0.85){ Q.cat = "follow"; Q.known = true; S.catPos = Q.catAt.slice(); setCarry("🐈"); yuSay("크레파스 찾았다!! 🐈"); toast("🐈 크레파스 찾았다!", "같이 1층 안내 데스크로 가요", 2200); advance(); } }
      if(Q?.cat === "follow" && S.catPos){ const bi = st.i - Math.sin(st.h) * 0.6, bj = st.j - Math.cos(st.h) * 0.6, dd = Math.hypot(bi - S.catPos[0], bj - S.catPos[1]);
        if(dd > 5){ S.catPos = [bi, bj]; } else if(dd > 0.08){ S.catPos[0] += (bi - S.catPos[0]) * 0.1; S.catPos[1] += (bj - S.catPos[1]) * 0.1; }
        e.playItem("cat", {at:S.catPos}); } }
    // 가까이 지나가면 먼저 인사 (들고 있는 것·고양이·젖은 머리·번개에 맞춰서)
    const nb = st.near;
    if((S.n || 0) % 20 === 0 && !G && !PR.chase && nb && nb.d < 1.5 && t > talkAt + 1500 && !(REQ && nb.id === REQ.id) && !(S.greet[nb.id] > t) && Math.random() < 0.55){
      S.greet[nb.id] = t + 75000; const isDad = nb.id === "_dir" || nb.id === "@dad", isMom = /nora$/.test(nb.id) || nb.id === "@mom";
      const line = Q?.cat === "follow" ? pick(CAT_RE) : carry ? pick(CARRY_RE(carry)) : t < S.wetUntil ? pick(WET_RE) : st.boost > 0 ? pick(BOOST_RE)
        : isDad ? pick(["우리 딸~ 👋", "유나 왔어? 😆"]) : isMom ? pick(["유나야~ 💕", "우리 유나 왔네 🤗"]) : pick(GREET[S.floor] || GREET.main);
      npcSay(nb.id, line, 2600); e.playEmote?.(nb.id, isDad || isMom ? "💕" : "👋", 1500);
      if(Math.random() < 0.5) later0(1300, () => yuSay(pick(["안녕하세요! 😆", "헤헤 👋", "네~!"]), 1500)); }
    // 이야기: 엄마 근처 가면 들킬 뻔 (풍선 같은 걸 들고 있을 때)
    const csp = curStep();
    if(Q?.id === "party" && csp?.sneak && !G && carry && t > (S.sneakT || 0)){
      const mid = ["_nora", "l_nora"].find(id => e.playWhere(id)), w = mid && e.playWhere(mid), am = st.actors?.mom, m = am || (w && {i:w[0], j:w[1]});
      if(m && Math.hypot(m.i - st.i, m.j - st.j) < 2.0){ S.sneakT = t + 9000; S.secret = Math.max(0, (S.secret ?? 3) - 1); rec.partySecret = S.secret; save(); sfx("bump");
        npcSay(am ? "@mom" : mid, pick(["어? 유나야 그 풍선 뭐야? 🤨", "유나 뭐 숨기는 거 있지? 😏"]), 2600);
        later0(1200, () => yuSay(pick(["아, 아무것도 아니야! 😅", "그, 그냥~ 친구 줄 거야! 😳"]), 2000)); toast("🤫 엄마한테 들킬 뻔!", `비밀 하트 ${"❤️".repeat(S.secret)}${"🤍".repeat(3 - S.secret)}`, 2200, true); } }
    // 친구 지유: 유나가 지나간 길을 따라옴
    if(Q?.id === "friend" && G?.type !== "swim"){ const a = st.actors?.fr, tr = S.trail || (S.trail = []), lt = tr[tr.length - 1];
      if(!lt || Math.hypot(st.i - lt[0], st.j - lt[1]) > 0.4){ tr.push([st.i, st.j]); if(tr.length > 50) tr.shift(); }
      if(a){ const d = Math.hypot(a.i - st.i, a.j - st.j);
        if(d > 9){ const p = e.playFree(st.i - Math.sin(st.h) * 0.9, st.j - Math.cos(st.h) * 0.9, 0.2); e.playActor("fr", {at:p, to:null}); }
        else if(d > 1.3 && t > (S.frT || 0)){ S.frT = t + 260; let g = null; for(let k = tr.length - 1; k >= 0; k--){ if(Math.hypot(tr[k][0] - st.i, tr[k][1] - st.j) >= 1.05){ g = tr[k]; break; } }
          if(g) e.playActor("fr", {to:g, spd:Math.min(3.6, 1.1 + d * 0.6)}); }
        const inP = S.floor === "roof" && a.i > POOL.rect[0] && a.i < POOL.rect[2] && a.j > POOL.rect[1] && a.j < POOL.rect[3];
        if(inP !== !!S.frSwim){ S.frSwim = inP; e.playActor("fr", {pose:inP ? "swim" : "stand"}); }
        if(!G && t > (S.frSay || 0)){ if(S.frSay) npcSay("@fr", pick(FR_TALK[S.floor] || FR_TALK.main), 2600); S.frSay = t + 15000 + Math.random() * 10000; } } }
    // 💬 부름: 그냥 돌아다닐 때 가끔 누가 유나를 부름
    if(REQ && t > REQ.until){ REQ = null; refreshItems(); }
    if(!Q && !G && !REQ && S.reqNext && t > S.reqNext){
      const ps = e.playPeople().filter(p => { const d = Math.hypot(p.i - st.i, p.j - st.j); return d > 2.5 && d < 13; });
      if(ps.length){ const p = pick(ps); REQ = {id:p.id, name:p.name, floor:S.floor, until:t + 90000, kind:pick(["gift", "judge", "photo", "five"])}; refreshItems(); toast(`💬 ${p.name}님이 유나를 불러요`, "머리 위 💬 보고 가 보기", 2400, true); S.reqNext = t + 80000 + Math.random() * 40000; }
      else S.reqNext = t + 15000; }
  }

  /* ---------- 말 걸기 ---------- */
  function talk(n){
    if(now() < talkAt) return; talkAt = now() + 1500;
    const st = curStep(), e = E();
    if(!rec.met[n.id]){ rec.met[n.id] = 1; save(); later0(2600, checkBadges); }
    if(REQ && !Q && !G && n.id === REQ.id){ const r = REQ; REQ = null; refreshItems(); yuSay("저 부르셨어요? 😊"); talkAt = now() + 5200; later0(1100, () => callRun(n, r)); return; }
    { const k = n.id[0] === "@" ? n.id.slice(1) : "";   // 동네 사람 (2026-11-24): 퀘스트가 아니면 이야기 · 가끔 선물
      const hit0 = st && st.talk === n.id && st.f === S.floor;
      if(AREA_NPC_TALK[k] && !hit0 && !G){ talkAt = now() + 4300;
        const GIFT = {ice:["🍦", "아이스크림 하나 맛보기~ 쉿 비밀 😉"], aunt:["🍢", "떡 하나 먹어 봐~ 서비스 😊"], gran:["⭐", "스티커 하나 줄게~ 공부 열심히 해 😊"]};
        if(GIFT[k] && !carry && !Q && Math.random() < 0.45){ yuSay(pick(["안녕하세요! 😊", "저 왔어요~ 👋"]), 1500);
          later0(1200, () => { npcSay(n.id, GIFT[k][1], 2600); setCarry(GIFT[k][0]); sfx("pick"); E()?.playEmote?.(n.id, "😊", 1200); later0(14000, () => { if(carry === GIFT[k][0] && !Q){ setCarry(""); } }); }); return; }
        const c = pick(AREA_NPC_TALK[k]); yuSay(c[0]); later0(1100, () => { npcSay(n.id, c[1], 2800); E()?.playEmote?.(n.id, pick(["😊", "✨", "😆"]), 1300); later0(1900, () => yuSay(c[2], 2000)); }); return; } }
    if(n.id === "l_cvs" && !G && !carry){   // 편의점 간식 (2026-11-23 감독님 "세세한거 다")
      yuSay(pick(["삼각김밥 하나 주세요! 🍙", "초코우유 있어요? 🥛", "젤리 주세요~ 🍬", "아이스크림 주세요! 🍦"]), 1800); talkAt = now() + 3800;
      later0(1300, () => { const it = pick(["🍙", "🥛", "🍬", "🍦"]); npcSay(n.id, `여기요~ ${it} 오늘 1+1이라 하나 더 드릴게요 😊`, 2600); setCarry(it); sfx("pick"); firstUse("cvs", "🏪 편의점 간식");
        later0(14000, () => { if(carry === it && !Q){ setCarry(""); yuSay("냠냠 다 먹었다 😋", 1500); } }); }); return; }
    if(Q?.id === "cat" && st?.find && !Q.known && !G){ Q.known = true; yuSay("혹시 고양이 봤어요? 🐈"); talkAt = now() + 3000;
      later0(1100, () => { npcSay(n.id, `고양이? 아까 ${FL[Q.catF].name}에서 본 것 같아! 🐈`, 3400); toast("🐈 단서 찾았다!", `${ro(FL[Q.catF].name)} 가 봐요`, 2200); setup(); renderCard(); }); return; }
    const hit = st && st.talk && st.f === S.floor && !G && (st.talk === n.id || (Array.isArray(st.talk) && (st.talk.includes(n.id) || (st.any && !st.talk.some(x => e.playWhere(x))))));
    if(hit && st.make){ yuSay(st.yu); talkAt = now() + st.make.ms + 5200; S.busy = true; const q = Q;
      later0(1100, () => { if(Q !== q){ S.busy = false; return; } npcSay(n.id, st.make.wait, 2400); later0(800, () => makeIt(st, n.id, () => { if(Q !== q) return; npcSay(n.id, st.re, 3000); E()?.playEmote?.(n.id, st.got, 1100);
        later0(650, () => { if(Q !== q) return; receive(st.got); later0(1500, () => { if(Q === q && curStep() === st) advance(); }); }); })); }); return; }
    if(hit){ yuSay(st.yu); talkAt = now() + 3200; const gv = !st.got && carry && carry !== "🐈" ? carry : "";
      later0(1100, () => { npcSay(n.id, st.re, 3200); if(gv){ setCarry(""); sfx("pick"); e?.playEmote?.(n.id, gv, 1700); later0(700, () => e?.playEmote?.(n.id, "💕", 1500)); } else setCarry(st.got || "");
        if(st.photo) later0(1700, () => { flash(); sfx("ding"); E()?.playEmote?.("yu", "✌️", 1600); E()?.playEmote?.("@fr", "✌️", 1600); toast("📸 찰칵!", "지유랑 구름 앞에서 한 장", 1800); });
        later0(st.photo ? 3400 : 1500, advance); }); return; }
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
  /* 💬 부름 */
  const pickEl = $(".yg-pick"), flashEl = $(".yg-flash");
  function choose(who, title, opts){ return new Promise(ok => { pickEl.innerHTML = "<p><small></small><span></span></p><div></div>"; pickEl.querySelector("small").textContent = who; pickEl.querySelector("p span").textContent = title;
    opts.forEach(o => { const b = document.createElement("button"); b.type = "button"; b.innerHTML = "<span></span><b></b>"; b.querySelector("span").textContent = o[0]; b.querySelector("b").textContent = o[1];
      b.onclick = ev => { ev.stopPropagation(); pickEl.hidden = true; sfx("blip"); ok(o); }; pickEl.querySelector("div").append(b); });
    panel.hidden = true; pickEl.hidden = false; }); }
  function flash(){ flashEl.classList.remove("on"); void flashEl.offsetWidth; flashEl.classList.add("on"); } window.__ygFlash = () => { if(live){ flash(); sfx("ding"); } };
  function callDone(t, sub){ rec.req = (rec.req || 0) + 1; rec.stars++; save(); renderCard(); sfx("star"); toast(t, sub || `⭐ +1 · 별 ${rec.stars}개`, 2400, true); later0(2600, checkBadges); }
  function callRun(n, r){
    const k = r.kind; npcSay(n.id, CALL_HI[k], 2600);
    if(k === "gift"){ const g = pick(GIFTS);
      later0(1500, () => { E()?.playEmote?.(n.id, g[0], 1300);
        later0(700, () => { E()?.playEmote?.("yu", g[0], 1800); sfx("pick"); yuSay(pick([`우와 ${g[1]}! 고맙습니다 💕`, `${g[1]} 너무 예뻐요! 😆`, "진짜요? 감사합니다! 🙇‍♀️"]), 2400);
          rec.gifts = rec.gifts || {}; rec.gifts[g[0]] = 1; callDone(`🎁 ${g[1]} 선물 받았다!`); }); }); }
    if(k === "judge"){ const j = pick(JUDGE);
      later0(1400, () => { npcSay(n.id, j.q, 3400); E()?.playSet({freeze:true});
        choose(`${r.name}님이 물어봐요`, j.q, j.o).then(c => { E()?.playSet({freeze:false}); if(!live) return; yuSay(`${c[0]} ${c[1]}요!`, 1800);
          later0(1200, () => { npcSay(n.id, pick(JUDGE_RE), 2600); E()?.playEmote?.(n.id, "👍", 1400); callDone("🤔 골라 줬다!", "유나 의견대로 간대요 · ⭐ +1"); }); }); }); }
    if(k === "photo"){
      later0(1400, () => { E()?.playSet({freeze:true}); ["3", "2", "1"].forEach((x, q) => later0(q * 700, () => toast(`📸 ${x}`, "", 600)));
        later0(2100, () => { flash(); sfx("ding"); E()?.playEmote?.("yu", "✌️", 1700); E()?.playEmote?.(n.id, "😆", 1600); yuSay("브이~ ✌️", 1500); E()?.playSet({freeze:false, wave:1500});
          later0(1000, () => { npcSay(n.id, pick(["잘 나왔다! 책상에 붙여 둘게 🖼️", "유나 사진 완전 귀엽다 😍"]), 2400); callDone("📸 같이 사진 찍었다!"); }); }); }); }
    if(k === "five"){
      later0(1200, () => { E()?.playSet({wave:1200}); E()?.playEmote?.("yu", "🙌", 1400); E()?.playEmote?.(n.id, "🙌", 1400); sfx("pick"); yuSay("하이파이브~ 🙌", 1400);
        later0(900, () => { npcSay(n.id, pick(["오 손 힘 세다! 💪", "유나 덕분에 기운 난다 😆", "오늘도 화이팅! ✨"]), 2400); callDone("🙌 하이파이브!"); }); }); }
  }
  /* 물건 쓰기 */
  const nearUse = st => !st || st.swim || st.sit ? null : (USE[st.floor] || []).find(u => Math.hypot(st.i - u.at[0], st.j - u.at[1]) < (u.r || 0.9)) || null;
  const inCourt = st => st && st.floor === "roof" && !st.swim && st.i > FSC.i0 && st.i < FSC.i1 && st.j > FSC.j0 && st.j < FSC.j1;
  function firstUse(k, t){ { const sp = curStep(); if(Q && sp?.use === k && sp.f === S.floor){ const q = Q; later0(1400, () => { if(Q === q && curStep() === sp) advance(); }); } }
    rec.uses = rec.uses || {}; if(rec.uses[k]) return; rec.uses[k] = 1; rec.stars++; save(); renderCard(); later0(1500, () => { sfx("star"); toast(t, "처음 해 봤어요 · ⭐ +1", 2200, true); checkBadges(); }); }
  /* 나이트 레이스 (2026-11-28 감독님 "이 안에서 레이싱게임도. 진짜 레이싱게임처럼. 니드포스피드처럼"): 오락실 RACER 기계나 할 일 목록에서 들어감. 화면은 race3d.js가 따로 띄우고, 그동안 타워는 쉼 */
  async function openRace(){
    if(S.race) return; const e = E(); S.race = true; keys.clear(); push(); panel.hidden = true; endGame(); e?.playSet({freeze:true});
    const back = () => { S.race = false; AU.duck = false; const e2 = E(); e2?.pause?.(false); e2?.playSet({freeze:false}); if(AU.m && AU.ctx) AU.m.gain.setTargetAtTime(AU.on ? 0.9 : 0, AU.ctx.currentTime, 0.2); };
    try { const m = await import("./race3d.js"); if(!m.webglOK()) throw new Error("webgl");
      AU.duck = true; if(AU.m && AU.ctx) AU.m.gain.setTargetAtTime(0, AU.ctx.currentTime, 0.1); e?.pause?.(true);
      m.open({sound:AU.on, best:rec.race,
        onSound(on){ AU.on = on; try { localStorage.setItem("crayon-yuna-sound", on ? "1" : "0"); } catch(_){} sndB.textContent = on ? "🔊" : "🔇"; },
        onEnd(r){ const o = rec.race = rec.race || {}; o.runs = (o.runs || 0) + 1; if(!(o.time > 0) || r.time < o.time){ o.time = r.time; o.lap = r.bestLap; } if(!(o.rank > 0) || r.rank < o.rank) o.rank = r.rank; if(r.rank === 1) o.wins = (o.wins || 0) + 1; S.raceEnd = r; save(); },
        onExit(){ back(); const r = S.raceEnd; S.raceEnd = null; if(!r) return; firstUse("race", "🏎️ 나이트 레이스 완주");
          if(r.rank === 1 && rec.race.wins === 1){ rec.stars += 2; save(); renderCard(); later0(2600, () => { sfx("star"); toast("🏆 레이스 첫 우승!", "⭐ +2", 2600, true); }); }
          else later0(400, () => toast(`🏁 ${r.rank}등으로 골인`, r.rank === 1 ? "또 우승이에요 🏆" : "다음엔 1등 해 봐요", 2400, true)); }}); }
    catch(err){ console.warn("레이스를 못 열었어요", err); back(); toast("레이스를 못 열었어요", "잠깐 뒤에 다시 해 봐요", 2200, true); }
  }
  /* ---------- 장난치기 (2026-11-28) ---------- */
  function prankSetup(f){
    const e = E(); if(PR.chase) chaseEnd(true); PR.f = f; PR.mess = 0; PR.down = 0; PR.warned = 0; PR.cat = null; PR.place = null;
    if(!e?.playProps) return;
    const L = (PRANK[f] || []).map((p, k) => { const at = e.playFreeAt(p.at[0], p.at[1], 0.34) ? p.at : e.playFree(p.at[0], p.at[1], 0.34); return {id:"pr" + k, kind:p.k, at:[at[0], at[1]], h:p.h || 0}; });
    e.playProps(L);
    if(f === "home2"){ const at = e.playFree(CAT_HOME.at[0], CAT_HOME.at[1], 0.3); PR.cat = {at:[at[0], at[1]], home:[at[0], at[1]], to:null, back:0}; }
  }
  function onKnock(o){
    const e = E(), t = now(); if(!e) return;
    if(o.again){ if(t - (PR.sAt || 0) > 200){ PR.sAt = t; sfx(o.kind === "ball" || o.kind === "duck" ? "jump" : "blip", true); } return; }
    PR.mess += o.n; PR.down += o.n; const P = rec.prank = rec.prank || {n:0, esc:0, caught:0, tidy:0}; P.n += o.n;
    if(t - (PR.sAt || 0) > 90){ PR.sAt = t; sfx(o.chain ? "blip" : o.kind === "bucket" ? "splash" : "bump", true); if(!o.chain && o.n > 2) later0(110, () => sfx("blip")); }
    if(!o.chain || Math.random() < 0.3) e.playEmote?.([o.at[0], o.at[1], 0.7], o.chain ? "💥" : KNOCK_E[o.kind] || "💥", 800);
    if(!o.chain && t - (PR.sayAt || 0) > 2400 && !PR.chase){ PR.sayAt = t; yuSay(pick(KNOCK_YU[o.kind] || KNOCK_YU._), 1500); }
    if(PR.cat && !PR.cat.to && Math.hypot(PR.cat.at[0] - o.at[0], PR.cat.at[1] - o.at[1]) < 4.2){   // 고양이 깜짝
      const st = S.st, far = CAT_HOME.flee.map(p => e.playFree(p[0], p[1], 0.25)).sort((a, b) => Math.hypot(b[0] - (st?.i || 0), b[1] - (st?.j || 0)) - Math.hypot(a[0] - (st?.i || 0), a[1] - (st?.j || 0)))[0];
      PR.cat.to = far; PR.cat.back = t + 14000; e.playEmote?.([PR.cat.at[0], PR.cat.at[1], 0.75], "🙀", 1100); later0(250, () => toast("🙀 야옹!!", "고양이가 깜짝 놀라 도망갔어요", 1500)); }
    if(!P.first){ P.first = 1; rec.stars++; renderCard(); later0(1200, () => { sfx("star"); toast("🙈 첫 장난!", "툭 치면 와르르 · ⭐ +1", 2200, true); }); }
    clearTimeout(PR.saveT); PR.saveT = setTimeout(() => { save(); checkBadges(); }, 1500);
    const calm = !PR.chase && !G && !S.busy && !(Q && Q.story) && MOM_IN[S.floor] && t > (PR.cool || 0);
    if(calm && PR.mess >= MESS_MAX) momComing();
    else if(calm && PR.mess >= MESS_MAX - 6 && !PR.warned){ PR.warned = 1; later0(700, () => !PR.chase && toast("👂 쿵쾅쿵쾅…", "더 어지르면 엄마가 올라와요", 1900)); }
  }
  function momComing(){
    const e = E(), f = S.floor, sp = MOM_IN[f]; if(!e || !sp) return;
    PR.chase = {phase:"warn", f, t0:now()}; sfx("ready"); toast("😱 엄마 발소리가 들려요!", "도망치거나, 엄마가 안 볼 때 숨어요", 2600); later0(500, () => yuSay(pick(["헉… 엄마 온다!! 😱", "큰일 났다, 숨자! 🫣", "어떡해 어떡해 😱"]), 1800));
    later0(2400, () => { const C = PR.chase; if(!C || C.phase !== "warn" || S.floor !== f) return;
      const st = S.st, far = st && Math.hypot(st.i - sp[0], st.j - sp[1]) < 3 ? (HIDES[f] || []).map(h => h.at).sort((a, b) => Math.hypot(b[0] - st.i, b[1] - st.j) - Math.hypot(a[0] - st.i, a[1] - st.j))[0] : null, at = e.playFree(...(far || sp), 0.24);
      e.playActor("mom", {at:[at[0], at[1], sp[2]], pose:"stand", to:null, spd:1.95}); C.phase = "run"; C.until = now() + 32000; C.pathAt = 0; C.sayAt = now() + 4200; sfx("bump");
      later0(250, () => { npcSay("@mom", pick(["유나야~!! 이게 다 뭐야!! 😠", "어머머 집이 난장판이네!! 😤", "요 녀석 거기 서~!! 😠"]), 2400); e.playEmote?.("@mom", "💢", 1400); }); });
  }
  function chaseEnd(quiet){
    const e = E(), C = PR.chase; PR.chase = null; if(!C) return; C.tm?.forEach(clearTimeout);
    if(C.hide){ e?.playSet({cloak:false, freeze:false}); }
    if(quiet) e?.playActor("mom", null);
  }
  function momLeave(f){ const e = E(), sp = MOM_IN[f]; if(!e || !sp) return; const m = S.st?.actors?.mom; if(!m){ e.playActor("mom", null); return; }
    let n = 0; const iv = setInterval(() => { const m2 = S.st?.actors?.mom; if(!live || PR.chase || S.floor !== f || !m2 || ++n > 30 || Math.hypot(m2.i - sp[0], m2.j - sp[1]) < 0.6){ clearInterval(iv); if(!PR.chase && live) E()?.playActor("mom", null); return; }
      const wp = E()?.playPath?.(m2.i, m2.j, sp[0], sp[1]); if(wp) E().playActor("mom", {to:wp, spd:1.5}); }, 300); }
  function escaped(how){
    const e = E(), C = PR.chase; if(!C || !e) return; const f = C.f, hid = !!C.hide; chaseEnd(false); PR.mess = 0; PR.warned = 0; PR.cool = now() + 20000;
    e.playSet({cloak:false, freeze:false, wave:1500}); const P = rec.prank = rec.prank || {n:0, esc:0, caught:0, tidy:0}; P.esc++; sfx("star");
    npcSay("@mom", how === "hid" ? pick(["에휴… 어디 숨었담. 이따 꼭 치워야 해~ 😮‍💨", "못 찾겠다 꾀꼬리~ 😮‍💨 나오면 같이 치우자"]) : pick(["헥헥… 엄마가 졌다 😮‍💨 이따 꼭 치워~", "아이고 숨차… 못 잡겠네 😵"]), 2800);
    later0(1500, () => yuSay(hid ? pick(["휴… 안 들켰다 😆", "히히 숨기 성공 🤫"]) : pick(["내가 더 빠르지롱~ 😝", "휴… 살았다 😆"]), 2000));
    if(!P.escStar){ P.escStar = 1; rec.stars++; renderCard(); toast(hid ? "🫣 안 들켰다!" : "🏃‍♀️ 끝까지 도망쳤다!", "엄마 따돌리기 성공 · ⭐ +1", 2600, true); } else toast(hid ? "🫣 안 들켰다!" : "🏃‍♀️ 끝까지 도망쳤다!", `엄마 따돌리기 ${P.esc}번째`, 2400, true);
    save(); later0(2600, checkBadges); later0(2200, () => momLeave(f));
  }
  function caught(){
    const e = E(), C = PR.chase; if(!C || !e) return; const f = C.f; C.phase = "caught"; e.playSet({freeze:true}); e.playActor("mom", {to:null}); sfx("bump");
    npcSay("@mom", pick(["잡았다 요 녀석! 😤 같이 치우자~", "딱 걸렸어! 😤 엄마랑 정리하자"]), 2400); e.playEmote?.("yu", "💦", 1200);
    toast("🙈 딱 걸렸다!", "엄마랑 같이 치우기", 2200); later0(900, () => yuSay(pick(["히잉… 죄송해요 🥲", "앗 들켰다… 치울게요 😅"]), 1900));
    later0(1500, () => { E()?.playTidy?.(); sfx("pick"); });
    later0(3100, () => { if(PR.chase !== C) return; PR.chase = null; PR.mess = 0; PR.down = 0; PR.warned = 0; PR.cool = now() + 12000; const P = rec.prank = rec.prank || {n:0, esc:0, caught:0, tidy:0}; P.caught++; save();
      E()?.playSet({freeze:false, wave:1200}); npcSay("@mom", pick(["다음엔 살살 놀자~ 사랑해 💕", "말끔해졌네! 우리 유나 최고 👍"]), 2600); later0(2200, () => momLeave(f)); });
  }
  function hideNow(h){
    const e = E(), C = PR.chase, st = S.st; if(!e || !C || C.phase !== "run" || !st) return; const m = st.actors?.mom;
    if(m && Math.hypot(m.i - st.i, m.j - st.j) < 4.2 && e.playClear(m.i, m.j, st.i, st.j, 0.06)){ sfx("bump"); yuSay("앗, 엄마가 보고 있어! 😱", 1400); toast("👀 엄마가 보고 있어요", "안 보이는 데서 숨어요", 1600); return; }
    C.phase = "seek"; C.hide = h; C.seekUntil = now() + 8500; C.pathAt = 0; e.playSet({cloak:true, freeze:true}); sfx("ready"); e.playEmote?.([h.at[0], h.at[1], 0.75], "🫣", 8400);
    toast(`🫣 ${h.lb}에 숨었다!`, "쉿… 엄마가 갈 때까지", 2400);
    const last = [st.i, st.j], rnd = () => e.playFree(last[0] + (Math.random() - 0.5) * 5, last[1] + (Math.random() - 0.5) * 4, 0.24);
    C.goals = [e.playFree(last[0] + (m ? Math.sign(m.i - last[0]) : 1) * 1.3, last[1] + (m ? Math.sign(m.j - last[1]) : 1) * 1.1, 0.24), rnd(), rnd()].filter(g => Math.hypot(g[0] - h.at[0], g[1] - h.at[1]) > 1.1);
    C.tm = [later0(1700, () => npcSay("@mom", pick(["어? 어디 갔지…? 🤔", "분명 이쪽으로 왔는데… 🤔"]), 2200)), later0(4900, () => npcSay("@mom", pick(["유나야~ 나와라~ 안 혼낼게 🙂", "어디 숨었니~ 🙂"]), 2200))];
  }
  function tidyUp(){
    const e = E(); if(!e?.playTidy?.()) return; S.busy = true; PR.mess = 0; PR.down = 0; PR.warned = 0; sfx("pick"); yuSay(pick(["내가 치울게요~ 🧹", "정리 시작! 🧹"]), 1500);
    const P = rec.prank = rec.prank || {n:0, esc:0, caught:0, tidy:0}; P.tidy = (P.tidy || 0) + 1; save();
    later0(1100, () => { S.busy = false; sfx("star"); e.playSet({wave:1200}); e.playEmote?.("yu", "✨", 1200); if(P.tidy === 1){ rec.stars++; save(); renderCard(); toast("✨ 말끔!", "스스로 정리했어요 · ⭐ +1", 2200, true); } else toast("✨ 말끔!", "다시 쌓아 놨어요", 1500); });
  }
  function prankTick(st){
    const e = E(), t = now(); if(!e) return;
    if(PR.cat){ const c = PR.cat, dt = Math.min(0.1, (t - (c.lt || t)) / 1000); c.lt = t;
      if(c.to){ const dx = c.to[0] - c.at[0], dy = c.to[1] - c.at[1], d = Math.hypot(dx, dy); if(d < 0.06) c.to = null; else { const m = Math.min(d, 4.6 * dt); c.at[0] += dx / d * m; c.at[1] += dy / d * m; e.playItem("hcat", {at:c.at}); } }
      else if(c.back && t > c.back && !PR.chase){ c.back = 0; c.to = c.home.slice(); c.slow = true; } }
    const C = PR.chase; if(!C || C.phase === "warn" || C.phase === "caught") return;
    if(st.floor !== C.f){ chaseEnd(true); return; }
    const m = st.actors?.mom; if(!m) return; const d = Math.hypot(m.i - st.i, m.j - st.j);
    if(C.phase === "run"){
      if(d < 0.74){ caught(); return; }
      if(t > C.until){ escaped("ran"); return; }
      if(t - C.pathAt > 280){ C.pathAt = t; const wp = e.playPath?.(m.i, m.j, st.i, st.j); if(wp) e.playActor("mom", {to:wp, spd:st.boost > 0 ? 2.35 : 1.95}); }
      if(t > C.sayAt){ C.sayAt = t + 4200 + Math.random() * 2500; npcSay("@mom", pick(["거기 서~!! 😤", "유나야 뛰지 마~ 다쳐! 😠", "이리 안 와? 😤", "잡히기만 해 봐~ 😏"]), 1700); } }
    else if(C.phase === "seek"){
      if(t > C.seekUntil){ escaped("hid"); return; }
      if(t - C.pathAt > 300){ C.pathAt = t; const g = C.goals && C.goals[0]; if(g){ if(Math.hypot(m.i - g[0], m.j - g[1]) < 0.45){ C.goals.shift(); C.pathAt = t + 900; e.playActor("mom", {to:null}); } else { const wp = e.playPath?.(m.i, m.j, g[0], g[1]); if(wp) e.playActor("mom", {to:wp, spd:1.35}); else C.goals.shift(); } } } }
  }
  const nearHide = st => PR.chase?.phase === "run" && st.floor === PR.chase.f ? (HIDES[st.floor] || []).find(h => Math.hypot(st.i - h.at[0], st.j - h.at[1]) < 1.0) || null : null;
  /* ---------- 꾸미기: 옷 · 머리 · 머리색 (+ 유나 방에서는 벽지 · 이불 · 러그 · 장식) ---------- */
  const roomSt = () => (rec.room = rec.room || {wall:"base", bed:"base", rug:"base", deco:[]});
  const roomPush = () => { try { E()?.playF?.()?.room?.(roomSt()); } catch(err){ console.warn("방 꾸미기", err); } };
  function hairSet(style, color){
    const e = E(); if(!e?.playHair) return; const cur = rec.hair || ["pig", HAIR_COLS[0][0]], nw = [style || cur[0], color || cur[1]]; if(nw[0] === cur[0] && nw[1] === cur[1]) return;
    rec.hair = nw; rec.hairs = rec.hairs || {}; rec.hairs[nw[0]] = 1; e.playHair(nw[0], nw[1]); e.playSet({wave:1300}); sfx("star"); e.playEmote?.("yu", style ? "💇" : "🎨", 1200);
    yuSay(style ? pick([`${HAIRS.find(x => x[0] === nw[0])[2]} 어때요? 💕`, "머리 바꿨다~ 예쁘죠? ✨"]) : pick(["머리색 바꿨다! 🎨", "이 색 마음에 들어 💕"]), 1900); save(); firstUse("hair", "💇 머리 바꾸기"); later0(2400, checkBadges);
  }
  function roomSet(key, val){
    const r = roomSt(); if(r[key] === val) return; r[key] = val; roomPush(); save(); sfx("star"); E()?.playEmote?.("yu", "✨", 1100); yuSay(pick(["우와 방이 달라졌다! ✨", "예쁘다~ 마음에 들어 💕", "내 방 최고 🎀"]), 1800); firstUse("room", "🎀 방 꾸미기");
  }
  function decoPlace(){
    const e = E(), st = S.st, D = PR.place; if(!e || !st || !D) return; const r = roomSt(), R0 = HOME.room.rect, i = st.i + Math.sin(st.h) * 0.62, j = st.j + Math.cos(st.h) * 0.62;
    if(r.deco.length >= HOME.room.max){ toast("장식은 10개까지예요", "하나 치우고 놓아요", 1800); return; }
    if(i < R0[0] || i > R0[2] || j < R0[1] || j > R0[3] || !e.playFreeAt(i, j, 0.26) || r.deco.some(d => Math.hypot(d.i - i, d.j - j) < 0.45)){ sfx("bump"); toast("여긴 자리가 없어요", "조금 옮겨서 놓아 봐요", 1500); return; }
    r.deco.push({k:D[0], i:+i.toFixed(2), j:+j.toFixed(2), h:+(st.h + PI).toFixed(2)}); roomPush(); save(); sfx("pick"); e.playEmote?.([i, j, 0.9], "✨", 1000); yuSay(pick([`${D[2]} 여기 딱이야! ${D[1]}`, "짠~ 놓았다 ✨"]), 1700); firstUse("room", "🎀 방 꾸미기"); later0(2400, checkBadges);
  }
  function decoRemove(){
    const st = S.st, r = roomSt(); if(!r.deco.length){ toast("치울 장식이 없어요", "", 1200); return; } let k = r.deco.length - 1, bd = 1e9;
    if(st) r.deco.forEach((d, q) => { const dd = Math.hypot(d.i - st.i, d.j - st.j); if(dd < bd){ bd = dd; k = q; } });
    const d = r.deco.splice(k, 1)[0], nm = HOME.room.deco.find(x => x[0] === d.k); roomPush(); save(); sfx("blip"); toast(`${nm ? nm[1] + " " + nm[2] : "장식"} 치웠어요`, `남은 장식 ${r.deco.length}개`, 1400);
  }
  function useIt(u){
    const e = E(); if(!e || S.busy) return;
    if(u.k === "ct_tennis"){ const T = rec.tennis || {}, opts = [["👧", "지유랑", "fr"], ["👩", "엄마랑", "mom"], ["👨", "아빠랑", "dad"], ["🧑‍🏫", "체육 선생님이랑", "coach"]].map(o => [o[0], o[1] + ((T.beat || {})[o[2]] ? " 🏆" : ""), o[2]]);
      opts.push(["🏆", "동네 대회 (토너먼트)" + (rec.cup?.tennis ? ` 🏆${rec.cup.tennis}` : ""), "cup"]);
      npcSay("@coach", "라켓 여기 있다~ 누구랑 칠래? 🎾", 2000); choose("🎾 스포츠센터 테니스장", "누구랑 칠까?", opts).then(o => { if(G || S.floor !== "court") return; if(o[2] === "cup") cupOpen("tennis"); else tnStart(o[2]); }); return; }
    if(u.k === "ct_wall"){ tnStart("wall"); return; }
    if(u.k === "gy_race"){ const R0 = rec.race || {}, g = R0.gold || {};
      npcSay("@coach", "50m 시합? 출발대로~ 🏁", 2000); choose("🏊 50m 수영 시합", R0.best ? `내 최고 기록 ${R0.best.toFixed(2)}초 · 누구랑 할까?` : "누구랑 할까?", [["👨‍👩‍👧", "가족이랑" + (g.fam ? " 🥇" : ""), "fam"], ["🧑‍🏫", "다 같이 (선생님도)" + (g.all ? " 🥇" : ""), "all"], ["🏆", "동네 수영 대회 (예선→결승)" + (rec.cup?.swim ? ` 🏆${rec.cup.swim}` : ""), "cup"], ["⏱️", "혼자 기록 재기", "solo"]])
        .then(o => { if(G || S.floor !== "gym") return; if(o[2] === "cup") cupOpen("swim"); else rcStart(o[2]); }); return; }
    if(u.k === "squirt"){ const W0 = rec.squirt || {}; choose("💦 물총 싸움", "누구랑 할까?", [["👧", "지유랑", "fr"], ["👩", "엄마랑", "mom"], ["👨", "아빠랑", "dad"]]).then(o => { if(!G && S.floor === "roof") sqStart(o[2]); }); return; }
    if(u.k === "arcade" && u.n === "RACER"){ e.playSet({pos:[u.at[0], u.at[1], PI]}); openRace(); return; }
    if(u.k === "arcade"){ e.playSet({pos:[u.at[0], u.at[1], PI]}); startGame("arcade"); G.arc = u; return; }
    if(u.k === "piano"){ S.busy = true; e.playSet({freeze:true, pos:[u.at[0], u.at[1], -PI / 2]}); yuSay("작은 별 칠게요~ 🎹", 1600); const c = auInit();
      TWINKLE.forEach((m, k) => later0(700 + k * 330, () => { if(!m) return; if(c && AU.on) tone(mtof(m), c.currentTime + 0.01, 0.5, {type:"triangle", vol:0.2}); if(k % 2 === 0) e.playEmote?.([0.6, 9.8 + (k % 5) * 0.18, 1.3], k % 4 ? "♪" : "♫", 900); }));
      later0(700 + TWINKLE.length * 330 + 300, () => { S.busy = false; e.playSet({freeze:false, wave:1400}); npcSay("piano", pick(["우와 유나 피아노 잘 친다! 👏", "다음엔 같이 반주하자 🎹"]), 2600); firstUse("piano", "🎹 피아노 연주"); }); return; }
    if(u.k === "slide"){ S.busy = true; e.playSet({freeze:true, cloak:true}); sfx("jump"); yuSay("올라간다~ 🧗‍♀️", 1200);
      [[30.6, 9.9, 0.5], [30.2, 9.9, 1.0]].forEach((p, k) => later0(150 + k * 300, () => e.playEmote?.(p, "🧗‍♀️", 500)));
      for(let k = 0; k <= 6; k++) later0(800 + k * 110, () => { e.playEmote?.([29.9, 10.5 + k * 0.42, 1.15 - k * 0.16], k < 6 ? "😆" : "💨", 380); if(k === 0) sfx("boost"); });
      later0(1650, () => { e.playSet({cloak:false, pos:[29.9, 13.4, 0]}); e.playSet({freeze:false}); S.busy = false; yuSay(pick(["슝~~ 한 번 더! 🛝", "우와 빠르다!! 😆"]), 1600); rec.slides = (rec.slides || 0) + 1; save(); firstUse("slide", "🛝 미끄럼틀 슝"); });
      return; }
    if(u.k === "bike"){ rideBike(); return; }
    if(u.k === "pk_slide"){ areaSlide(u); return; }
    if(u.k === "pk_merry"){ rideMerry(u); return; }
    if(u.k === "tw_gacha"){ gacha(u); return; }
    if(u.k === "tw_bell"){ ringBell(u); return; }
    if(u.k === "rv_boat"){ rideBoat(u); return; }
    if(u.k === "tw_bus"){ yuSay("크레용랜드행 버스 탄다~ 🚌", 1400); sfx("ding"); walkTo({f:"town", to:"fun", spawn:AREA.fun.spawn}); fade.textContent = "🚌 크레용랜드행 버스"; firstUse("tw_bus", "🚌 버스 타고 놀이공원"); return; }
    if(FUN_RIDE[u.k]){ funRide(u); return; }
    if(u.k === "futsal") startGame("futsal");
    if(u.k === "pong" || u.k === "claw") startGame(u.k);
    if(ACTS[u.k]) doAct(u);
  }
  /* ---------- 동네 (공원 · 골목) 사람과 놀이 (2026-11-24) ---------- */
  const NPC_AT = {park:{ice:"pk_icecream", kid:"pk_sand"}, town:{aunt:"tw_tteok", gran:"tw_gacha", teach:"tw_bell"},
    fun:{staff:"fn_carousel", cotton:"fn_cotton", clown:"fn_balloon"}, river:{pastor:"rv_pray", fisher:"rv_fish", boatman:"rv_boat", picnic:"rv_picnic"},
    school:{teach:"sc_board", chef:"sc_lunch", coach:"sc_track", classmate:"sc_board", chaplain:"sc_chapel"}, market:{halmi:"mk_veggie", tteok:"mk_tteokjip", fishm:"mk_fish", hotteok:"mk_hotteok"}, court:{coach:"ct_tennis"}, gym:{coach:"gy_race"}};
  function areaNpcs(f){ const e = E(); if(!e) return; S.npcF = S.npcF || {};
    Object.entries(NPC_AT).forEach(([af, m]) => Object.entries(m).forEach(([k, uk]) => {
      if(af !== f){ if(S.npcF[k] === af){ e.playActor(k, null); S.npcF[k] = null; } return; }
      if(S.npcF[k] === f) return;
      const M = AREA_MOD[af], fix = M?.npc?.[k]; let at = null;
      if(fix) at = fix;
      else { const u = (USE[af] || []).find(x => x.k === uk); if(!u) return; const h = u.h ?? 0, sd = k === "kid" ? -1 : 1;
        const p = e.playFree(u.at[0] + Math.sin(h) * 0.5 + Math.cos(h) * 0.95 * sd, u.at[1] + Math.cos(h) * 0.5 - Math.sin(h) * 0.95 * sd, 0.22); at = [p[0], p[1], Math.atan2(u.at[0] - p[0], u.at[1] - p[1])]; }
      e.playActor(k, {at, pose:"stand", to:null}); S.npcF[k] = f; S.kidHome = k === "kid" ? at : S.kidHome; }));
  }
  /* 지나다니는 동네 주민 (2026-11-24 감독님 "전체적 동네 사람들… 텅텅 비었어"): 동네마다 몇 명이 놀이 자리 사이를 걸어 다님 */
  const VIL = ["v1", "v2", "v3", "v4", "v5", "v6", "v7", "v8", "v9", "v10"], VIL_N = {park:9, town:9, fun:10, school:6, market:10, river:9, court:5, gym:6};
  const VIL_SAY = {v1:["아이고 날씨 좋다~ 🌤️", "운동 삼아 한 바퀴 🚶‍♀️"], v2:["학원 늦겠다! 🏃", "편의점 들렀다 가야지 🍙"], v3:["오늘 회의 몇 시더라 📱", "커피 한 잔 해야지 ☕"],
    v4:["택배 왔어요~ 📦", "다음 집은 어디더라 🤔"], v5:["뭉치야 천천히 가~ 🐕", "산책 좋다 그치? 🐾"], v6:["엄마 저거 사 줘~ 🍭", "나 잡아 봐라~ 😆"],
    v7:["하나 둘! 하나 둘! 💪", "오늘 만 보 걸었다 👟"], v8:["과제 언제 하지… 📚", "여기 사진 예쁘다 📸"], v9:["우리 아기 잘 잔다 👶", "장 보러 가야지 🛒"], v10:["유나야 안녕~ 👋", "숙제 했어? 😆"]};
  const VIL_ANCH = f => [...(USE[f] || []).map(u => u.at), ...(SEATS[f] || []).map(x => x.a)].filter(Boolean);
  const wetAt = (i, j) => (S.floor === "roof" ? [POOL] : S.floor === "gym" ? [AREA_MOD.gym?.pool] : []).some(w => w && i > w.walk[0] - 0.2 && i < w.walk[2] + 0.2 && j > w.walk[1] - 0.2 && j < w.walk[3] + 0.2);   // 물 (2026-11-28 감독님 "수영장에서 사람들 걸어댕기네")
  const flat = (e, i, j) => e.playReach(i, j) && !((e.playGround?.(i, j) || 0) > 0.06) && !wetAt(i, j);   // 걸을 수 있고 바닥 그대로 (계산대·단 위 X, 물 위 X)
  const clearLine = (i0, j0, i1, j1) => { const e = E(), n = Math.max(1, Math.ceil(Math.hypot(i1 - i0, j1 - j0) / 0.25)); for(let q = 1; q <= n; q++) if(!flat(e, i0 + (i1 - i0) * q / n, j0 + (j1 - j0) * q / n)) return false; return true; };
  function villagers(f){ const e = E(); if(!e) return; S.vil = S.vil || {};
    Object.keys(S.vil).forEach(k => { if(S.vil[k].f !== f){ e.playActor(k, null); delete S.vil[k]; } });
    if(!isArea(f) || Object.keys(S.vil).length) return;
    const an = VIL_ANCH(f); if(!an.length) return;
    [...VIL].sort(() => Math.random() - 0.5).slice(0, VIL_N[f] || 4).forEach(k => { const a = pick(an);
      for(let t = 0; t < 8; t++){ const p = e.playFree(a[0] + (Math.random() - 0.5) * 3, a[1] + (Math.random() - 0.5) * 3, 0.25); if(!flat(e, p[0], p[1])) continue;
        e.playActor(k, {at:[p[0], p[1], Math.random() * PI * 2], pose:"stand", to:null}); S.vil[k] = {f, home:p, next:now() + 800 + Math.random() * 5000}; break; } });
  }
  function vilTick(st){ if(!S.vil || G) return; const e = E(), t = now();
    for(const [k, v] of Object.entries(S.vil)){ if(v.f !== st.floor || t < v.next) continue; v.next = t + 2200 + Math.random() * 4800;
      const a = st.actors?.[k]; if(!a || a.moving || Math.hypot(st.i - a.i, st.j - a.j) < 1.8 || Math.random() < 0.18) continue;   // 유나 옆이면 멈춰서 기다림
      const far = Math.hypot(a.i - v.home[0], a.j - v.home[1]) > 6, an = VIL_ANCH(st.floor);
      for(let q = 0; q < 8; q++){ let ti, tj;
        if(q < 3 && an.length && Math.random() < 0.6){ const p = pick(an); ti = p[0] + (Math.random() - 0.5) * 1.6; tj = p[1] + (Math.random() - 0.5) * 1.6; if(Math.hypot(ti - a.i, tj - a.j) > 7) continue; }
        else { const ang = far ? Math.atan2(v.home[0] - a.i, v.home[1] - a.j) + (Math.random() - 0.5) : Math.random() * PI * 2, d = 1.2 + Math.random() * 3.5; ti = a.i + Math.sin(ang) * d; tj = a.j + Math.cos(ang) * d; }
        if(clearLine(a.i, a.j, ti, tj)){ e.playActor(k, {to:[ti, tj], spd:0.7 + Math.random() * 0.45}); break; } }
      if(Math.random() < 0.12 && Math.hypot(st.i - a.i, st.j - a.j) < 9) later0(700, () => npcSay("@" + k, pick(VIL_SAY[k]), 2300)); }
  }
  function kidWander(st){   // 연재는 놀이터를 왔다 갔다
    if(st.floor !== "park" || !S.kidHome || G || (Q && curStep()?.talk === "@kid") || now() < (S.kidNext || 0)) return; S.kidNext = now() + 7000 + Math.random() * 6000;
    const e = E(), a = st.actors?.kid; if(!e || !a || Math.hypot(st.i - a.i, st.j - a.j) < 1.6) return;
    const pts = (USE.park || []).filter(u => /slide|sand|seesaw|swing|merry/.test(u.k)).map(u => u.at); if(!pts.length) return;
    const t = pick(pts), p = e.playFree(t[0] + (Math.random() - 0.5) * 1.6, t[1] + (Math.random() - 0.5) * 1.6, 0.22);
    if(Math.hypot(p[0] - S.kidHome[0], p[1] - S.kidHome[1]) < 6) e.playActor("kid", {to:p, spd:1.1});
    if(Math.random() < 0.35) later0(900, () => npcSay("@kid", pick(["유나야 같이 놀자~ 😆", "나 미끄럼틀 열 번 탔다! 🛝", "개미다! 🐜", "그네 누가 더 높이 가나 내기! 😎"]), 2400));
  }
  function swingSync(st){   // 공원 그네: 앉으면 그네 의자도 같이 흔들
    const P = AREA_MOD.park; if(st.floor !== "park" || !P?.swing?.set) return;
    if(st.sit && S.seatK === "swing"){ if(!S.swT0) S.swT0 = now(); P.swing.set(0.42 * Math.sin((now() - S.swT0) / 1000 * 2.4)); }
    else if(S.swT0){ S.swT0 = 0; P.swing.set(0); }
  }
  // 길 따라 움직이기: pts = [[i, j, 높이, 걸리는 ms], ...] → fn(초) (보는 쪽은 가는 방향)
  const tracer = pts => { const T = []; let acc = 0; pts.forEach(p => { acc += p[3] || 0; T.push(acc); });
    return sec => { const ms = sec * 1000; let k = T.findIndex(x => x >= ms); if(k < 0) k = pts.length - 1; if(k === 0) return [pts[0][0], pts[0][1], pts[0][2], pts[1] ? Math.atan2(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]) : 0];
      const A = pts[k - 1], B = pts[k], f = Math.min(1, (ms - T[k - 1]) / Math.max(1, T[k] - T[k - 1])), h = Math.hypot(B[0] - A[0], B[1] - A[1]) > 0.02 ? Math.atan2(B[0] - A[0], B[1] - A[1]) : (A[4] ?? 0);
      return [A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f, A[2] + (B[2] - A[2]) * f, B[4] ?? h]; }; };
  function areaSlide(u){   // 공원 미끄럼틀: 사다리 올라가서 슝 (모듈 slide 경로 그대로)
    const e = E(), sl = AREA_MOD.park?.slide; if(!e || !sl) return; S.busy = true;
    const pts = [[sl.bottom[0], sl.bottom[1], 0.4, 0, PI], ...sl.climb.map(c => [c[0], c[1], c[2] + 0.38, 260, PI]), [sl.top[0], sl.top[1], sl.top[2] + 0.36, 320, sl.face], [sl.top[0], sl.top[1], sl.top[2] + 0.36, 250, sl.face],
      ...sl.path.map(c => [c[0], c[1], c[2] + 0.06, 130, sl.face]), [sl.end[0], sl.end[1], 0.4, 160, sl.end[2]]];
    const ms = pts.reduce((a, p) => a + (p[3] || 0), 0), go = tracer(pts);
    e.playSet({freeze:true, mark:null, act:{k:"ride", fn:go}}); sfx("jump"); yuSay("올라간다~ 🧗‍♀️", 1200);
    later0(ms - sl.path.length * 130 - 160, () => { sfx("boost"); e.playSet({act:{k:"ride", cheer:true, fn:sec => go(sec + (ms - sl.path.length * 130 - 160) / 1000)}}); yuSay("슝~~~ 😆", 1000); });
    later0(ms + 60, () => { e.playSet({act:null, freeze:false, pos:[sl.end[0], sl.end[1], sl.end[2]]}); S.busy = false;
      yuSay(pick(["한 번 더! 🛝", "우와 빠르다!! 😆"]), 1600); firstUse("pk_slide", "🛝 놀이터 미끄럼틀"); later0(2400, checkBadges); });
  }
  function rideMerry(u){   // 뺑뺑이: 방석에 앉아 두 바퀴 반 (모듈 spin.set·rideAt 각도 그대로)
    const e = E(), P = AREA_MOD.park?.spin, ms = 9000; if(!e || !P) return; S.busy = true;
    const a0 = Math.atan2(u.at[1] - P.center[1], u.at[0] - P.center[0]);
    e.playSet({freeze:true, mark:null, act:{k:"ride", fn:sec => { const f = Math.min(1, sec * 1000 / ms), a = a0 + PI * 5 * (f - Math.sin(2 * PI * f) / (2 * PI)); P.set(a); const r = P.rideAt(a); return [r[0], r[1], r[2] + 0.36, r[3]]; }}});
    sfx("go"); yuSay("빙글빙글~ 돌려라! 🎠", 1600); npcSay("@kid", "내가 밀어 줄게~ 영차! 💪", 2200);
    const iv = setInterval(() => { if(!live){ clearInterval(iv); return; } e.playEmote?.("yu", pick(["😵‍💫", "🎶", "😆", "💫"]), 900); }, 1400);
    later0(ms + 60, () => { clearInterval(iv); const p = e.playFree(u.at[0], u.at[1], 0.2); e.playSet({act:null, freeze:false, wave:1200, pos:[p[0], p[1], u.h ?? 0]}); S.busy = false; sfx("pick");
      yuSay("어지러워~ 세상이 빙글빙글 😵‍💫", 1800); firstUse("pk_merry", "🎠 뺑뺑이 빙글빙글"); later0(2400, checkBadges); });
  }
  function gacha(u){   // 문방구 캡슐 뽑기: 8가지 도감 (황금 왕관은 드묾)
    const e = E(), T = AREA_MOD.town; if(!e) return; S.busy = true; e.playSet({freeze:true, mark:null, pos:[u.at[0], u.at[1], u.h ?? 0]});
    sfx("go"); yuSay(pick(["동전 넣고~ 드르륵 🎰", "제발 왕관 나와라 🙏"]), 1600); let n = 0;
    try { T?.gacha?.spin?.(); } catch(_){} later0(1400, () => { try { T?.gacha?.pop?.(); } catch(_){} });
    const iv = setInterval(() => { if(!live){ clearInterval(iv); return; } n++; if(n % 4 === 0) sfx("blip"); }, 90);
    later0(1900, () => { clearInterval(iv); const pool = GACHA.flatMap((g, k) => Array(g[2] ? 1 : 3).fill(k)), k = pick(pool), g = GACHA[k];
      rec.gacha = rec.gacha || {}; const fresh = !rec.gacha[k]; rec.gacha[k] = 1; save();
      e.playEmote?.("yu", g[0], 1800); sfx(fresh ? "star" : "pick"); setCarry(g[0]); later0(12000, () => { if(carry === g[0] && !Q) setCarry(""); });
      toast(`${g[0]} ${g[1]}!`, `뽑기 도감 ${cnt(rec.gacha)}/${GACHA.length}${fresh ? " · 새 거!" : ""}`, 2200, g[2]);
      yuSay(g[2] ? "황금 왕관이다!!! 😱👑" : fresh ? pick(["우와 새 거다! 😆", "이거 갖고 싶었어 💕"]) : pick(["또 이거네… 😅", "이거 두 개다 😆"]), 1800);
      e.playSet({freeze:false}); S.busy = false; firstUse("tw_gacha", "🎰 문방구 캡슐 뽑기");
      if(fresh && cnt(rec.gacha) >= GACHA.length){ rec.stars += 2; save(); later0(2400, () => { sfx("star"); toast("🎰 뽑기 도감 완성!", "⭐ +2", 2600, true); }); }
      renderCard(); later0(2600, checkBadges); });
  }
  /* 놀이공원 탈것: 모듈 훅이 주는 자리를 따라 유나도 같이 (엔진 act.fn) */
  const FUN_RIDE = {
    fn_carousel:{ms:9000, cam:0.42, yawOff:-PI / 2 - 0.35, say:"말 타러 가자~ 🎠", mid:"꺄~ 빙글빙글! 😆", end:"어지러워 😵‍💫", done:"🎠 크레용랜드 회전목마", fx:["🎠", "🎶", "✨"], npc:["@staff", "출발합니다~ 손잡이 꼭 잡아요! 😊"],
      fn:(H, u) => { const a = PI * 5 * (u - Math.sin(2 * PI * u) / (2 * PI)); H.set?.(a); return H.horse?.(a); }, off:H => H.set?.(null)},
    fn_wheel:{ms:24000, el:0.3, cam:0.95, say:"관람차 타자 🎡", mid:"꼭대기다! 우리 동네 다 보여 ☁️", end:"또 타고 싶다~ 🎡", done:"🎡 대관람차 꼭대기", fx:["🎡", "☁️", "🌈"],
      fn:(H, u) => { const a = PI * 2 * u; H.set?.(a); return H.seat?.(a); }, off:H => H.set?.(null)},
    fn_coaster:{ms:24000, cheer:true, yawOff:PI + 0.55, say:"애벌레 기차 출발~ 🐛", mid:"으아아 언덕이다!! 😱", end:"한 번 더! 😆", done:"🐛 애벌레 롤러코스터", fx:["😱", "🐛", "💨", "🎉"],
      fn:(H, u) => { const v = (u * 2) % 1; H.set?.(v); const p = H.path?.(v); return p && [p[0], p[1], p[2], p[3], 0]; }, off:H => H.set?.(null)},
    fn_bumper:{ms:20000, yawOff:PI + 0.45, say:"범퍼카 운전할래! 🚗", mid:"쿵! 미안해요~ 😆", end:"내가 일등 운전사 😎", done:"🚗 범퍼카 운전", fx:["🚗", "💥", "😆"],
      fn:(H, u) => { const r = H.rect || [23.4, 10.4, 32.6, 17], cx = (r[0] + r[2]) / 2, cy = (r[1] + r[3]) / 2, rx = (r[2] - r[0]) / 2 - 1, ry = (r[3] - r[1]) / 2 - 1, a = u * PI * 4, s2 = Math.sin(a * 2);
        const i = cx + rx * Math.sin(a), j = cy + ry * s2 * 0.9, h = Math.atan2(rx * Math.cos(a), ry * 0.9 * 2 * Math.cos(a * 2)); H.set?.(0, i, j, h); return [i, j, H.seat ?? 0.3, h]; }, off:H => H.set?.(0, null)},
    fn_viking:{ms:15000, cheer:true, say:"바이킹 무서운데… 탈래! 🏴‍☠️", mid:"엉덩이 붕 뜬다!! 😱", end:"다리 후들후들 🫠", done:"🏴‍☠️ 바이킹", fx:["😱", "🏴‍☠️", "🌊"],
      fn:(H, u) => { const t = u * 15, env = Math.min(1, t / 3, (15 - t) / 3), a = (H.amp ?? 0.95) * Math.sin(2 * PI * t / (H.period ?? 4.4)) * env; H.set?.(a); return H.seat?.(a); }, off:H => H.set?.(null)}};
  function funRide(u){
    const e = E(), H = AREA_MOD.fun?.[u.k.slice(3)], R = FUN_RIDE[u.k]; if(!e || !H) return; S.busy = true; const back = [u.at[0], u.at[1], u.h ?? 0];
    e.playSet({freeze:true, mark:null, act:{k:"ride", cheer:R.cheer, cam:R.cam, el:R.el, yawOff:R.yawOff, fn:sec => R.fn(H, Math.min(1, sec * 1000 / R.ms))}}); sfx("go"); yuSay(R.say, 1800);
    if(R.npc) later0(900, () => npcSay(R.npc[0], R.npc[1], 2400));
    const fx = setInterval(() => { if(!live){ clearInterval(fx); return; } e.playEmote?.("yu", pick(R.fx), 1100); }, 2200);
    later0(R.ms * 0.5, () => yuSay(R.mid, 2400));
    later0(R.ms + 80, () => { clearInterval(fx); try { R.off(H); } catch(_){} e.playSet({act:null, freeze:false, wave:1200, pos:back}); S.busy = false; sfx("pick");
      yuSay(R.end, 1800); firstUse(u.k, R.done); rec.rides = rec.rides || {}; rec.rides[u.k] = 1; save(); later0(2400, checkBadges); });
  }
  function rideBoat(u){   // 강변 오리배: 조이스틱으로 직접 저음 (2026-11-26 감독님 "오리배는 직접 조정하게 해줘"). 물 밖 · 데크 · 선착장 · 묶인 배로는 못 감, 선착장에 오면 내리기
    const e = E(), B = AREA_MOD.river?.boat; if(!e || !B) return; S.busy = true; const bt = B.berth || [26.2, 3.9, PI / 2];
    const fx = setInterval(() => { if(!live || !S.boat){ clearInterval(fx); return; } if((S.st?.dv ?? 1) > 0.2) e.playEmote?.("yu", pick(["🦢", "🌊", "🎶", "😆", "🐟"]), 1100); }, 2600);
    S.boat = {t0:now(), bt, fx, far:false, say:0};
    e.playSet({freeze:false, mark:null, act:{k:"ride", cam:1.2, drive:{start:[bt[0], bt[1], bt[2]], seat:B.seatH ?? 0.41, speed:1.6, turn:2.0,
      ok:(i, j) => B.water ? B.water(i, j) : true, set:(i, j, h) => { try { B.set(i, j, h); } catch(_){} },
      bump:() => { sfx("bump"); e.playEmote?.("yu", "💦", 900); if(now() - S.boat.say > 5000){ S.boat.say = now(); yuSay(pick(["앗 부딪혔다 😅", "여긴 못 가요~ 🦢", "후진 후진! 😆"]), 1400); } }}}});
    sfx("go"); yuSay("오리배 출발! 내가 저어 볼게 🦢", 1800); npcSay("@boatman", "구명조끼 꼭 입고~ 선착장으로 돌아오면 내려요 😊", 2600);
    toast("🦢 오리배", "조이스틱으로 저어요 · 선착장에 오면 내리기");
  }
  function landBoat(){
    const e = E(), B = AREA_MOD.river?.boat, b = S.boat; if(!b) return; S.boat = null; clearInterval(b.fx); try { B?.set(null); } catch(_){}
    const d = B?.dock || [26.2, 4.85, PI]; e?.playSet({act:null, freeze:false, wave:1200, pos:[d[0], d[1], d[2] ?? PI]}); S.busy = false; sfx("pick");
    yuSay("재밌었다! 또 타고 싶어 🦢", 1800); firstUse("rv_boat", "🦢 강변 오리배"); later0(2400, checkBadges);
  }
  function ringBell(u){   // 학교 종: 땡땡땡
    const e = E(), c = auInit(); if(!e) return; S.busy = true; e.playSet({freeze:true, pos:[u.at[0], u.at[1], u.h ?? 0], act:{k:"water"}}); yuSay("땡땡땡~ 학교 종이 땡땡땡 🔔", 2000); try { AREA_MOD.town?.bell?.ring?.(); later0(1300, () => AREA_MOD.town?.bell?.ring?.()); } catch(_){}
    [0, 1, 2, 4, 5, 6].forEach((k, n) => later0(400 + k * 380, () => { if(c && AU.on) tone(mtof([79, 79, 81, 79, 79, 76][n]), c.currentTime + 0.01, 0.7, {type:"sine", vol:0.18}); e.playEmote?.("yu", n % 2 ? "🔔" : "🎶", 700); }));
    later0(3200, () => { e.playSet({act:null, freeze:false}); S.busy = false; npcSay("@teach", pick(["유나야~ 지금 쉬는 시간 아니야 😆", "종 치니까 진짜 수업 시작하는 줄 알았네 😂"]), 2800); firstUse("tw_bell", "🔔 학교 종 치기"); later0(2400, checkBadges); });
  }
  /* 자전거: 앞마당을 두 바퀴 (엔진이 길 따라 움직이고, 자전거 메시도 같이) */
  function rideBike(){
    const e = E(), B = HOME.bike; if(!e) return; S.busy = true; const ms = 14000;
    e.playSet({freeze:true, mark:null, at:[...B.park], act:{k:"bike", seat:0.47, path:{c:[10.8, 14.6], rx:3.6, ry:1.8, a0:PI / 2, turns:2, ms}, prop:(i, j, h) => B.set(i, j, h)}});
    sfx("go"); yuSay(pick(["자전거 출발~ 🚲", "따르릉 따르릉 비켜나세요~ 🚲"]), 1800);
    const iv = setInterval(() => { if(!live){ clearInterval(iv); return; } e.playEmote?.("yu", pick(["💨", "🎶", "😆", "🌸"]), 1000); }, 1600);
    later0(ms * 0.5, () => yuSay(pick(["두발자전거 이제 완전 잘 타지? 😎", "바람 시원하다~ 🍃"]), 2000));
    later0(ms + 60, () => { clearInterval(iv); B.set(...B.park); e.playSet({act:null, freeze:false, wave:1200, pos:[B.park[0], B.park[1] - 0.8, PI]}); S.busy = false; sfx("pick");
      yuSay("한 바퀴 더 탈까? 🚲", 1800); firstUse("bike", "🚲 마당에서 자전거 타기"); later0(2400, checkBadges); });
  }
  function doAct(u){
    const e = E(), A = ACTS[u.k], back = S.st ? [S.st.i, S.st.j] : null; S.busy = true;
    e.playSet({freeze:true, mark:null, act:{k:A.pose || u.k, y:A.y || 0, seat:A.seat, fn:A.fn}, ...(A.raw ? {at:[u.at[0], u.at[1], u.h ?? 0]} : {pos:[u.at[0], u.at[1], u.h ?? 0]})});
    if(A.go) try { A.go(u, rec); save(); } catch(e){ console.warn("놀이", u.k, e); }
    sfx("go"); yuSay(A.say, 1800); let n = 0; const NUM = ["하나", "둘", "셋", "넷", "다섯", "여섯", "일곱", "여덟"];
    const iv = setInterval(() => { if(!live){ clearInterval(iv); return; } n++;
      if(A.count){ if(n >= 2 && n <= 9) yuSay(`${NUM[n - 2]}! ${A.fx[0]}`, 600); }
      else e.playEmote?.("yu", A.fx[n % A.fx.length], 1100); }, A.count ? 650 : 1500);
    if(A.mid) later0(A.ms * 0.5, () => yuSay(A.mid, 2200));
    if(A.npc) later0(1300, () => npcSay(A.npc[0], A.npc[1], 2400));
    const t0 = now(), av = A.anim ? setInterval(() => { if(!live){ clearInterval(av); return; } try { A.anim((now() - t0) / 1000); } catch(_){} }, 40) : 0;
    later0(A.ms, () => { clearInterval(iv); if(av){ clearInterval(av); try { A.anim(0); } catch(_){} }
      if(A.give) later0(500, () => { const it = pick(A.give); setCarry(it); sfx("pick"); later0(16000, () => { if(carry === it && !Q){ setCarry(""); yuSay("냠냠 다 먹었다 😋", 1500); } }); }); e.playSet({act:null, freeze:false, wave:1200, ...(A.raw && back ? {pos:[back[0], back[1]]} : {})}); S.busy = false; sfx("pick");
      yuSay(A.end, 1800); e.playEmote?.("yu", A.fx[0], 1200); firstUse(u.k, A.done); later0(2400, checkBadges);
      if(A.snack && !carry) later0(600, () => { const it = pick(["🍦", "🥛", "🍬"]); setCarry(it); sfx("pick"); }); });
  }
  /* 앉아서 하는 놀이 */
  function sitPlay(s){
    const D = SIT_DO[s.k]; clearInterval(S.sitIv); if(!D) return; const t0 = now(); let n = 0, mid = false;
    rec.sits = rec.sits || {}; if(!rec.sits[s.k]){ rec.sits[s.k] = 1; rec.stars++; save(); renderCard(); later0(1800, () => { sfx("star"); toast(`${D.first}!`, "처음 해 봤어요 · ⭐ +1", 2200, true); checkBadges(); }); }
    if(D.npc) later0(1400, () => npcSay(D.npc[0], D.npc[1], 3400));
    if(s.k === "cinema"){ const tt = window.yunaFilm?.(true); S.film = true; if(tt) later0(1600, () => toast("🎬 지금 상영작", tt, 2400)); }
    S.sitIv = setInterval(() => { if(!live || !S.st?.sit){ clearInterval(S.sitIv); if(S.film){ S.film = false; window.yunaFilm?.(false); } return; } const e = E();
      if(D.mid && !mid && now() - t0 > D.mid[0]){ mid = true; yuSay(D.mid[1], 2600); toast(D.mid[2], "", 1600); }
      const L = mid && D.after ? D.after : D.fx; e?.playEmote?.("yu", L[n++ % L.length], 1500);
      if(Math.random() < 0.15){ const y = SIT_YU[s.k]; if(y) yuSay(pick(y), 2000); } }, 2600); }

  /* ---------- 엘리베이터 ---------- */
  function openElev(){
    panel.hidden = true;
    elevP.innerHTML = ""; Object.entries(FL).filter(([, v]) => v.n).sort((a, b) => b[1].n - a[1].n).forEach(([f, v]) => { const b = document.createElement("button"); b.type = "button"; b.setAttribute("aria-current", f === S.floor);
      b.innerHTML = `<b>${v.n}F</b>`; b.append(v.name.replace(/^\d층 /, "")); b.onclick = () => { closeElev(); if(f !== S.floor) ride(f); }; elevP.append(b); });
    { const b = document.createElement("button"); b.type = "button"; b.className = "home"; b.innerHTML = "<b>🏡</b>"; b.append("유나네 집");   // 걸어서도 감 (로비 횡단보도 건너편)
      b.onclick = () => { closeElev(); walkTo({f:S.floor, to:"home1", spawn:HOME.spawnGate}); }; elevP.append(b); }
    Object.entries(AREA).forEach(([k, a]) => { const b = document.createElement("button"); b.type = "button"; b.className = "home"; b.setAttribute("aria-current", k === S.floor); b.innerHTML = `<b>${a.e}</b>`; b.append(a.name);
      b.onclick = () => { closeElev(); if(k !== S.floor) walkTo({f:S.floor, to:k, spawn:a.spawn}); }; elevP.append(b); });
    elevP.hidden = false;
  }
  function closeElev(){ elevP.hidden = true; }
  function openFit(tab){
    panel.hidden = true; fitP.innerHTML = ""; const room = inRoom(S.st), T = [["fit", "👗", "옷"], ["hair", "💇", "머리"], ["col", "🎨", "머리색"], ...(room ? [["wall", "🖼️", "벽지"], ["bed", "🛏️", "이불"], ["rug", "🧶", "러그"], ["deco", "🧸", "장식"]] : [])];
    tab = T.some(x => x[0] === tab) ? tab : T.some(x => x[0] === S.fitTab) ? S.fitTab : room ? "wall" : "fit"; S.fitTab = tab;
    const tabs = document.createElement("div"); tabs.className = "yg-ftabs"; tabs.setAttribute("role", "tablist");
    T.forEach(([k, em, name]) => { const b = document.createElement("button"); b.type = "button"; b.setAttribute("role", "tab"); b.setAttribute("aria-selected", k === tab); b.setAttribute("aria-label", name); b.textContent = em; const sm = document.createElement("small"); sm.textContent = name; b.append(sm); b.onclick = () => openFit(k); tabs.append(b); });
    fitP.append(tabs);
    const opt = (em, name, on, fn, dot) => { const b = document.createElement("button"); b.type = "button"; b.setAttribute("aria-current", !!on); if(dot){ const i = document.createElement("i"); i.style.background = dot; b.append(i); } else { const e2 = document.createElement("b"); e2.textContent = em; b.append(e2); } b.append(name); b.onclick = fn; fitP.append(b); return b; };
    const note = t => { const p = document.createElement("p"); p.textContent = t; fitP.append(p); };
    if(tab === "fit"){ const cur = S.st?.fit || rec.fit || "base"; FITS.forEach(([k, em, name]) => opt(em, name, k === cur, () => changeFit(k))); }
    if(tab === "hair"){ const cur = (rec.hair || ["pig"])[0]; HAIRS.forEach(([k, em, name]) => opt(em, name, k === cur, () => { hairSet(k, null); openFit("hair"); })); }
    if(tab === "col"){ const cur = (rec.hair || [0, HAIR_COLS[0][0]])[1]; HAIR_COLS.forEach(([c, name]) => opt("", name, c === cur, () => { hairSet(null, c); openFit("col"); }, c)); }
    if(tab === "wall" || tab === "bed" || tab === "rug"){ const cur = roomSt()[tab]; HOME.room[tab].forEach(([k, em, name]) => opt(em, name, k === cur, () => { roomSet(tab, k); openFit(tab); })); }
    if(tab === "deco"){ const n = roomSt().deco.length; HOME.room.deco.forEach(D => opt(D[1], D[2], PR.place && PR.place[0] === D[0], () => { PR.place = D; act.dataset.m = ""; fitP.hidden = true; sfx("blip"); toast(`${D[1]} ${D[2]} 골랐어요`, "놓고 싶은 자리로 가서 [여기 놓기]", 2400); }));
      opt("🧹", `가까운 장식 치우기 (${n}/${HOME.room.max})`, false, () => { decoRemove(); openFit("deco"); }).className = "wide"; note("고른 장식은 유나 바로 앞에 놓여요. 방 안 어디든 10개까지."); }
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

  /* 무단횡단하면 근처 어른이 말림 (2026-11-24 감독님 "유나가 무단횡단하면 주변에서 말려줘 어른이잖아")
     도로 j 22.5~27.2. 횡단보도 밖이거나, 보행 신호가 빨간불인데 들어서면 → 가까운 어른이 부르고 유나를 원래 보도로 */
  const ROAD = [22.5, 27.2], JW_ADULT = ["위험해! 차 와! 횡단보도로 건너야지 🚸", "어허! 꼬마야 멈춰! 무단횡단은 안 돼 ✋", "유나야! 큰일 나! 손 잡고 건너자 🚸"],
    JW_RED = ["빨간불이야! 초록불 될 때까지 기다리자 🚦", "잠깐! 아직 빨간불이야 🚦 같이 기다리자"], JW_YU = ["앗 죄송해요! 🙇‍♀️", "네… 횡단보도로 갈게요 😳", "깜짝이야… 조심할게요! 🙇‍♀️"];
  function jaywalk(st){
    if(st.floor !== "lobby" || G || S.busy || pendingFloor) return;
    const on = st.j > ROAD[0] && st.j < ROAD[1];
    if(!on){ S.jwSide = st.j <= ROAD[0] ? 22.1 : 27.65; S.jwIn = null; return; }
    const sig = window.lobbySig?.(), xw = sig?.xw || {i0:16.0, i1:19.2}, inXW = st.i > xw.i0 - 0.2 && st.i < xw.i1 + 0.2;
    if(S.jwIn == null) S.jwIn = {red:sig ? sig.ped === "r" : false};   // 들어선 순간의 신호
    const bad = !inXW ? "jay" : S.jwIn.red ? "red" : null;
    if(!bad || now() < (S.jwAt || 0)) return;
    S.jwAt = now() + 4000; S.busy = true; const e = E();
    const near = (e.playPeople?.() || []).filter(p => !/^(fr|@)/.test(p.id)).map(p => ({...p, d:Math.hypot(p.i - st.i, p.j - st.j)})).sort((a, b) => a.d - b.d)[0];
    e.playSet({freeze:true}); sfx("bump");
    const line = pick(bad === "red" ? JW_RED : JW_ADULT);
    if(near && near.d < 14){ npcSay(near.id, line, 2800); e.playEmote?.(near.id, "❗", 1400); } else toast("🚸 지나가던 어른", line, 2400);
    later0(1100, () => yuSay(pick(JW_YU), 1800));
    later0(1500, () => { const back = S.jwSide ?? 22.1; e.playSet({pos:[Math.min(Math.max(st.i, xw.i0 + 0.3), xw.i1 - 0.3), back, back < 24 ? PI : 0], freeze:false}); S.busy = false; S.jwIn = null;
      rec.jay = (rec.jay || 0) + 1; save(); });
  }
  let hot = null, hotF = null;
  function walks(st){
    if(pendingFloor || G) return;
    const here = WALKS.filter(t => t.f === st.floor), now1 = new Set();
    for(const t of here){ const key = t.f + t.at, inR = Math.hypot(st.i - t.at[0], st.j - t.at[1]) < t.r;
      if(inR && hot && hotF === st.floor && !hot.has(key)){ walkTo(t); return; }
      if(inR) now1.add(key); }
    hot = now1; hotF = st.floor;
  }
  function walkTo(t){ const f = t.to; sfx("blip");
    endGame(); pendingFloor = f; hot = null; fade.textContent = `${isHome(f) ? "🏡" : isArea(f) ? AREA[f].e : "🏢"} ${FL[f].name}`; fade.classList.add("on");
    E()?.playSet({spawn:t.spawn, freeze:true});
    if(isArea(f)) yuSay(pick(AREA_GO[f] || ["가 보자~ 😆"]), 1400);
    else if(t.f === "lobby") yuSay(pick(["집에 가자~ 🏡", "우리 집 가야지! 🏡"]), 1400); else if(f === "lobby") yuSay(pick(["아빠 회사 가자! 🏢", "타워 가야지~ 🏢"]), 1400);
    setTimeout(() => { if(live) api.goFloor(f); }, 380);
    setTimeout(() => { if(live && pendingFloor === f){ pendingFloor = null; fade.classList.remove("on"); E()?.playSet({freeze:false}); } }, 9000);
  }

  /* ---------- 엔진 콜백 ---------- */
  const cb = {
    onFloor(fid){
      if(G && (G.type === "futsal" || G.type === "ball") && fid !== "roof") endGame();
      if(G?.type === "tennis" && fid !== "court") endGame();
      if(G?.type === "squirt" && fid !== "roof") endGame();   // 옥상 떠나면 공놀이 끝
      if(G?.type === "race" && fid !== "gym") endGame();
      S.floor = fid; S.st = null; REQ = null; S.npcF = S.npcF || {}; S.frF = null; S.near = null; S.reqNext = now() + 30000; bgmFloor(fid);
      if(!rec.vis[fid]){ rec.vis[fid] = 1; save(); later0(1500, checkBadges); }
      E()?.playSet({water:fid === "roof" ? [POOL] : fid === "gym" && AREA_MOD.gym?.pool ? [AREA_MOD.gym.pool] : []}); setCarry(carry); spotsFor(fid); boltFor();
      if(Q?.cat === "follow") S.catPos = [EXIT[0] + 0.4, EXIT[1] + 0.5];
      if(pendingFloor && fid === pendingFloor){ pendingFloor = null; setTimeout(() => { if(live){ fade.classList.remove("on"); } }, 250); }
      else if(!pendingFloor) fade.classList.remove("on");
      prankSetup(fid); if(fid === "home3") roomPush();
      setup(); renderCard();
      const st = curStep(); if(st?.game && st.f === fid && !G) startGame(st.game);
    },
    onTick(st){
      S.st = st; charge(st); momCatch(st); if(st.floor !== S.floor) return; prankTick(st); walks(st); jaywalk(st); kidWander(st); swingSync(st); vilTick(st);
      const sp = curStep();
      // 도착하기 단계
      if(sp && sp.go && sp.f === st.floor && !G && !S.busy && Math.hypot(st.i - sp.go[0], st.j - sp.go[1]) < sp.r){ if(sp.yu) yuSay(sp.yu);
        if(sp.make){ const q = Q; makeIt(sp, null, () => { if(Q !== q) return; if(sp.got) receive(sp.got); else setCarry(""); if(sp.make.done) yuSay(sp.make.done, 2400); advance(); }); }
        else { if(sp.got) receive(sp.got); else setCarry(""); advance(); } }
      // 오른쪽 버튼
      const nearElev = !!FL[st.floor]?.n && Math.hypot(st.i - ELEV[0], st.j - ELEV[1]) < 1.45 && !G; S.atElev = nearElev;
      const n = !G || G.type === "ball" ? st.near : null;
      const retry = sp && sp.game && sp.f === st.floor && !G;
      const booth = !G && nearBooth(st), hideAt = !G && nearHide(st), myRoom = !G && !S.busy && !PR.chase && inRoom(st);
      if(PR.place && !myRoom) PR.place = null;
      const use = !G && !S.busy ? (nearUse(st) || (inCourt(st) && !(sp?.game === "ball") ? {k:"futsal"} : null)) : null;
      const qn = n && sp && sp.f === st.floor && (sp.talk === n.id || Array.isArray(sp.talk) && sp.talk.includes(n.id));   // 할 일 상대가 엘베 앞에 있어도 말 걸기 먼저
      const land = S.boat && st.floor === "river" && now() - S.boat.t0 > 2500 && Math.hypot(st.i - S.boat.bt[0], st.j - S.boat.bt[1]) < 1.7;   // 오리배: 선착장 앞이면 내리기
      if(S.boat && Math.hypot(st.i - S.boat.bt[0], st.j - S.boat.bt[1]) > 2.5) S.boat.far = true;
      let mode = S.boat ? (land ? "land" : "") : G?.type === "grill" ? "flip" : G?.type === "arcade" ? "mash" : G?.type === "futsal" ? "shoot" : G?.type === "pong" ? "hit" : G?.type === "tennis" ? "" : G?.type === "squirt" ? "squirt" : G?.type === "race" ? "kick" : G?.type === "claw" ? "grab" : retry ? "retry" : hideAt ? "hide" : PR.chase ? "" : qn ? "talk" : nearElev ? "elev" : booth ? "dress" : myRoom && PR.place ? "place" : use ? "use:" + use.k : n ? "talk" : myRoom ? "room" : !G && !S.busy && PR.down >= 4 && !st.moving && PRANK[st.floor] ? "tidy" : "";
      { const tp = G?.type === "tennis" && G.phase !== "end"; if(tnPad.hidden === tp){ tnPad.hidden = !tp; toastEl.classList.toggle("up", tp); root.classList.toggle("tn", tp); jumpB.style.visibility = tp ? "hidden" : ""; runB.querySelector("b").textContent = tp ? "대시" : "달리기"; }
        const sv = tp && G.phase === "yuserve" ? "1" : tp && G.phase === "toss" ? "2" : ""; if(tp && tnPad.dataset.sv !== sv){ tnPad.dataset.sv = sv; tnPad.querySelector(".d b").textContent = sv === "2" ? "지금!" : sv ? "강서브" : "강타"; tnPad.querySelector(".l b").textContent = sv === "2" ? "지금!" : sv ? "서브" : "로브"; tnPad.querySelector(".p b").textContent = sv === "2" ? "지금!" : sv ? "서브" : "드롭"; } }
      if(mode !== act.dataset.m || (mode === "talk" && act.dataset.id !== n.id)){
        act.dataset.m = mode; act.dataset.id = n?.id || ""; act.hidden = !mode;
        if(mode === "elev"){ act.querySelector("span").textContent = "🛗"; act.querySelector("b").textContent = matchMedia("(hover:hover) and (pointer:fine)").matches ? "숫자 키로 층" : "엘리베이터"; }
        if(mode === "talk"){ act.querySelector("span").textContent = "💬"; act.querySelector("b").textContent = n.name; }
        if(mode === "retry"){ act.querySelector("span").textContent = "🔁"; act.querySelector("b").textContent = "다시 하기"; }
        if(mode === "dress"){ act.querySelector("span").textContent = "👗"; act.querySelector("b").textContent = "꾸미기"; }
        if(mode === "room"){ act.querySelector("span").textContent = "🎀"; act.querySelector("b").textContent = "방 꾸미기"; }
        if(mode === "place"){ act.querySelector("span").textContent = PR.place[1]; act.querySelector("b").textContent = "여기 놓기"; }
        if(mode === "hide"){ act.querySelector("span").textContent = "🫣"; act.querySelector("b").textContent = "숨기"; }
        if(mode === "tidy"){ act.querySelector("span").textContent = "🧹"; act.querySelector("b").textContent = "치우기"; }
        if(mode === "flip"){ act.querySelector("span").textContent = "🍳"; act.querySelector("b").textContent = "뒤집기"; }
        if(mode === "mash"){ act.querySelector("span").textContent = "👊"; act.querySelector("b").textContent = "연타!"; }
        if(mode === "shoot"){ act.querySelector("span").textContent = "⚽"; act.querySelector("b").textContent = "슛"; }
        if(mode === "hit"){ act.querySelector("span").textContent = "🏓"; act.querySelector("b").textContent = "치기!"; }
        if(mode === "squirt"){ act.querySelector("span").textContent = "💦"; act.querySelector("b").textContent = "물총!"; }
        if(mode === "kick"){ act.querySelector("span").textContent = "💨"; act.querySelector("b").textContent = "물장구!"; }
        if(mode === "swing"){ act.querySelector("span").textContent = "🎾"; act.querySelector("b").textContent = "강타!"; }
        if(mode === "serve"){ act.querySelector("span").textContent = "🎾"; act.querySelector("b").textContent = "서브!"; }
        if(mode === "grab"){ act.querySelector("span").textContent = "🪝"; act.querySelector("b").textContent = "뽑기!"; }
        if(mode === "land"){ act.querySelector("span").textContent = "⚓"; act.querySelector("b").textContent = "내리기"; }
        if(use && mode.startsWith("use:")){ const L = use.n === "RACER" ? ["🏎️", "레이싱 게임"] : USE_LB[use.k] || ACTS[use.k]?.lb || ["✨", "놀기"]; act.querySelector("span").textContent = L[0]; act.querySelector("b").textContent = L[1]; }
        if(mode !== "elev") closeElev(); if(mode !== "dress" && mode !== "room") fitP.hidden = true; }
      act.onclick = () => { if(mode === "land") landBoat(); else if(mode === "flip") flipMeat(); else if(mode === "mash") mash(); else if(mode === "hit") hit(); else if(mode === "swing" || mode === "serve") tnPress(); else if(mode === "squirt") sqFire(); else if(mode === "kick") rcTap(); else if(mode === "grab") grab(); else if(mode === "shoot") shoot(); else if(mode.startsWith("use:")) useIt(use); else if(mode === "retry") startGame(sp.game); else if(mode === "elev") elevP.hidden ? openElev() : closeElev(); else if(mode === "dress" || mode === "room") fitP.hidden ? openFit() : (fitP.hidden = true); else if(mode === "place") decoPlace(); else if(mode === "hide") hideNow(hideAt); else if(mode === "tidy") tidyUp(); else if(mode === "talk") talk(n); };
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
      if(st.swim && st.moving){ rec.strokes = rec.strokes || {}; if(!rec.strokes[S.stroke]){ rec.strokes[S.stroke] = 1; save(); later0(1500, checkBadges); } }
      { const jm = G?.type === "futsal" ? "pass" : st.swim ? "stroke:" + S.stroke : st.sit ? "stand" : !G && nearSeat(st) ? "sit" : "jump", sk = STROKES[(STROKES.findIndex(x => x[0] === S.stroke) + 1) % STROKES.length];   // 버튼엔 바꿀 영법 (2026-11-28 감독님 "바꾸고 싶은게 나와야지")
        if(jm !== jumpB.dataset.m){ jumpB.dataset.m = jm; jumpB.querySelector("span").innerHTML = jm === "pass" ? "🤝" : jm === "jump" ? JUMP_SVG : jm === "sit" ? "🪑" : st.swim ? sk[1] : "🧍‍♀️";
          jumpB.querySelector("b").textContent = jm === "pass" ? "패스" : jm === "jump" ? "점프" : jm === "sit" ? "앉기" : st.swim ? sk[2] + "으로" : "일어나기"; jumpB.setAttribute("aria-label", st.swim ? sk[2] + "으로 바꾸기" : jumpB.querySelector("b").textContent); } }
      if(st.moving && !helpT){ helpT = setTimeout(() => { help.style.opacity = 0; }, 5000); }
    },
    onPick, onKnock,
    onBump(id){ if(PR.chase) return; if(G && G.type !== "ball") return; if(HOLD[carry]?.spill){ spill(); later0(800, () => npcSay(id, pick(["어이쿠 조심! 안 쏟았지? 😅", "천천히~ 뜨거워! ☕", "괜찮아? 흘릴 뻔했네 😮"]), 2200)); return; } sfx("bump"); const isDad = id === "@dad" || id === "_dir", isMom = id === "@mom" || /nora$/.test(id);
      yuSay(pick(BUMP_YU), 1500); E()?.playEmote?.(id, "💫", 1200); later0(700, () => npcSay(id, pick(isDad ? BUMP_DAD : isMom ? BUMP_MOM : BUMP_RE), 2200)); },
    onSplash(kind){ sfx("splash"); if(kind === "in" && !S.strokeTip){ S.strokeTip = true; later0(1800, () => toast(`${(STROKES.find(x => x[0] === S.stroke) || STROKES[0])[1]} 오른쪽 버튼으로 영법 바꾸기`, "자유형 · 평형 · 배영 (키보드 F)", 2400, true)); } if(kind === "in" && S.st && S.st.fit !== "swim" && !S.clothSwim){ S.clothSwim = true; yuSay("앗 옷 입고 들어왔다 😆 탈의실에서 수영복 입을걸!", 2600); }
      else if(kind === "in") yuSay(pick(SPLASH_IN), 1500); else { S.wetUntil = now() + 45000; later0(350, () => yuSay(pick(SPLASH_OUT), 1600)); } },
    onIdle(k){ if(G || now() < talkAt || Math.random() > 0.55) return; yuSay(pick(IDLE_YU[k]), 1700); if(k === "dance") E()?.playEmote?.("yu", "🎵", 1600); },
    onTap(id){ const st = S.st; if(!st) return; const n = st.near; if(n && n.id === id) talk(n); else yuSay(pick(["저기 가 볼까? 👀", "가까이 가서 말 걸어야지!"]), 1600); },
  };

  /* ---------- 조종 ---------- */
  const keys = new Set(); let jx = 0, jy = 0, jOn = false;
  const push = () => { let x = jx, y = jy; if(!jOn){ x = (keys.has("r") ? 1 : 0) - (keys.has("l") ? 1 : 0); y = (keys.has("u") ? 1 : 0) - (keys.has("d") ? 1 : 0); const m = Math.hypot(x, y); if(m > 1){ x /= m; y /= m; } } S.jx = x; E()?.playInput(x, y); };
  const KM = {KeyW:"u", ArrowUp:"u", KeyS:"d", ArrowDown:"d", KeyA:"l", ArrowLeft:"l", KeyD:"r", ArrowRight:"r"};
  const kd = e => {
    if(S.race) return;   // 레이싱 중엔 키를 레이싱 화면이 씀
    if(e.target.closest && e.target.closest("input,textarea")) return;
    auInit();
    if(e.key === "Shift"){ if(!e.repeat) doRun(); return; }
    if(KM[e.code]){ keys.add(KM[e.code]); push(); e.preventDefault(); e.stopPropagation(); return; }
    if(G?.type === "tennis" && /^Key[JKL]$/.test(e.code)){ if(!e.repeat) tnPress(e.code === "KeyJ" ? "drive" : e.code === "KeyK" ? "lob" : "drop"); e.preventDefault(); return; }   // 테니스: J 강타 · K 로브 · L 드롭 (방향은 화살표)
    if(e.code === "Space"){ doJump(); e.preventDefault(); return; }
    if(e.code === "KeyF" && S.st?.swim){ nextStroke(); e.preventDefault(); return; }
    const dn = /^(?:Digit|Numpad)([1-9])$/.exec(e.code);   // 엘리베이터 앞이면 숫자 키로 층 고르기 (2026-11-23 감독님 "키보드로 엘베 층을 고를수없네")
    if(dn && !pickEl.hidden){ const b = pickEl.querySelectorAll("button")[+dn[1] - 1]; if(b){ b.click(); e.preventDefault(); e.stopPropagation(); return; } }
    if(dn && !fitP.hidden){ const b = fitP.querySelectorAll(":scope > button")[+dn[1] - 1]; if(b){ b.click(); e.preventDefault(); e.stopPropagation(); return; } }
    if(dn && (S.atElev || !elevP.hidden)){ const f = Object.keys(FL).find(k => FL[k].n === +dn[1]); if(f){ closeElev(); if(f !== S.floor) ride(f); else yuSay("여기가 " + FL[f].n + "층이야! 😆", 1400); e.preventDefault(); e.stopPropagation(); return; } }
    if(e.code === "KeyE" || e.code === "Enter"){ if(!act.hidden){ act.click(); e.preventDefault(); } }
    if(e.key === "Escape"){ if(!panel.hidden) panel.hidden = true; else if(!elevP.hidden) closeElev(); else stop(); }
  };
  const ku = e => { if(S.race) return; if(KM[e.code]){ keys.delete(KM[e.code]); push(); } };
  addEventListener("keydown", kd, true); addEventListener("keyup", ku, true);
  const blur = () => { keys.clear(); jOn = false; jx = jy = 0; knob.style.transform = ""; push(); }; addEventListener("blur", blur);
  let jid = null;
  joy.addEventListener("pointerdown", e => { jid = e.pointerId; jOn = true; joy.classList.add("on"); try { joy.setPointerCapture(e.pointerId); } catch(_){} jmove(e); e.preventDefault(); e.stopPropagation(); });
  const jmove = e => { if(e.pointerId !== jid) return; const r = joy.getBoundingClientRect(), R0 = r.width / 2 - 14; let dx = e.clientX - r.left - r.width / 2, dy = e.clientY - r.top - r.height / 2; const d = Math.hypot(dx, dy); if(d > R0){ dx *= R0 / d; dy *= R0 / d; }
    knob.style.transform = `translate(${dx}px,${dy}px)`; jx = dx / R0; jy = -dy / R0; if(Math.hypot(jx, jy) < 0.12){ jx = jy = 0; } push(); };
  joy.addEventListener("pointermove", jmove);
  const jend = e => { if(e.pointerId !== jid) return; jid = null; jOn = false; jx = jy = 0; joy.classList.remove("on"); knob.style.transform = ""; push(); };
  joy.addEventListener("pointerup", jend); joy.addEventListener("pointercancel", jend);
  $(".yg-x:not(.yg-snd):not(.yg-mapb)").onclick = () => stop();   // (소리 버튼도 yg-x라 첫 번째로 잡히던 것 고침)
  function doJump(){ const e = E(); if(!e) return;
    if(G?.type === "grill"){ flipMeat(); return; }
    if(G?.type === "arcade"){ mash(); return; }
    if(G?.type === "futsal"){ pass(); return; }
    if(G?.type === "pong"){ hit(); return; }
    if(G?.type === "tennis"){ tnPress("drive"); return; }
    if(G?.type === "squirt"){ sqFire(); return; }
    if(G?.type === "race"){ rcTap(); return; }
    if(G?.type === "claw"){ grab(); return; }
    if(S.st?.sit){ e.playSit?.(null); sfx("blip"); return; }
    { const s = !G && nearSeat(S.st);
      if(s && s.k !== "church" && s.k !== "pew" && (e.playPeople?.() || []).some(q => Math.hypot(q.i - s.i, q.j - s.j) < 0.35)){ yuSay("앗 누가 앉아 있네 😅", 1400); return; }
      if(s && e.playSit?.(s)){ sfx("blip"); S.seatK = s.k; const L = SIT_YU[s.k]; sitPlay(s);
        if(s.k === "church" || s.k === "pew"){ rec.pray = (rec.pray || 0) + 1; save(); checkBadges(); later0(700, () => { yuSay(pick(L), 3200); e.playEmote?.("yu", "🙏", 1800); }); }
        else if(L && Math.random() < 0.7) later0(600, () => yuSay(pick(L), 2200));
        return; } }
    if(HOLD[carry]?.spill && !S.st?.swim){ spill(); return; }   // 음료 들고는 점프 대신 찰랑
    if(S.st?.swim){ e.playSplash?.(); sfx("splash"); yuSay(pick(["첨벙! 💦", "물보라 공격! 🌊", "푸하~ 🐬"]), 1200); return; }
    if(e.playJump()){ sfx("jump"); rec.jumps++; if(rec.jumps % 10 === 0){ save(); checkBadges(); } } }
  jumpB.addEventListener("pointerdown", ev => { ev.preventDefault(); ev.stopPropagation(); S.st?.swim ? nextStroke() : doJump(); });
  S.stroke = rec.stroke || "free";
  function nextStroke(){ const e = E(); if(!e) return; const k = (STROKES.findIndex(x => x[0] === S.stroke) + 1) % STROKES.length, sk = STROKES[k];
    S.stroke = sk[0]; rec.stroke = sk[0]; save(); e.playSet({stroke:sk[0]}); sfx("blip"); yuSay(sk[3], 1600); toast(`${sk[1]} ${sk[2]}`, "버튼 누를 때마다 자유형 → 평형 → 배영", 1400); }
  /* 달리기 부스트 (2026-11-23 감독님 "부스트 모드 필요. 달리는거. 어느정도 기모아서"): 걸으면 9초, 서 있으면 22초에 기가 다 참 → 누르면 4.5초 쌩쌩 */
  S.charge = 0.35;
  function charge(st){
    const tn = now(), dt = Math.min(0.1, (tn - (S.lastT || tn)) / 1000); S.lastT = tn;
    if(!(st.boost > 0) && !st.swim){ const was = S.charge; S.charge = Math.min(1, S.charge + dt / (st.moving ? 9 : 22)); if(was < 1 && S.charge >= 1){ sfx("ready"); runB.classList.add("full"); } }
    if(G?.type === "tennis"){ const q = 1 - Math.max(0, (S.dashCd || 0) - tn) / 1400; runB.style.setProperty("--p", q.toFixed(3)); runB.classList.toggle("full", q >= 1); runB.classList.toggle("go", st.boost > 0); return; }
    runB.style.setProperty("--p", Math.min(1, st.boost > 0 ? st.boost / 4500 : S.charge).toFixed(3)); runB.classList.toggle("go", st.boost > 0);
  }
  /* 달리다 엄마한테 걸리면 20초 달리기 금지 (2026-11-23 감독님 "달리다가 엄마한테 걸리면 못 뛰는것도 있으면 좋겟고") */
  function momCatch(st){
    if(PR.chase) return;
    if(!(st.boost > 0) || G || S.runBan > now()) return;
    const e = E(); if(!e) return;
    const ids = ["_nora", "l_nora"], wid = ids.find(id => e.playWhere(id)), w = wid && e.playWhere(wid), am = st.actors?.mom;
    const m = am || (w && {i:w[0], j:w[1]}), id = am ? "@mom" : wid;
    if(!m || Math.hypot(m.i - st.i, m.j - st.j) > 2.6) return;
    e.playSet({boost:0}); S.charge = 0; S.runBan = now() + 20000; rec.caught = (rec.caught || 0) + 1; save();
    runB.classList.remove("full", "go"); runB.classList.add("ban"); sfx("bump");
    npcSay(id, pick(["유나야! 안에서 뛰면 안 돼~ 😠", "어허! 다칠라, 걸어 다녀요 🙅‍♀️", "우리 유나 또 뛰었지? 😤"]), 2600); e.playEmote?.(id, "😠", 1600);
    later0(1300, () => yuSay(pick(["히잉… 걸어 다닐게요 😢", "앗 들켰다 😅", "네에… 🥲"]), 1800));
    toast("🚫 엄마한테 걸렸다!", "20초 동안 달리기 금지", 2400);
    later0(20000, () => { runB.classList.remove("ban"); toast("🏃‍♀️ 다시 달릴 수 있어요", "엄마 앞에선 살살~", 1700); });
  }
  function doRun(){
    const e = E(); if(!e) return;
    if(G?.type === "tennis"){ if(now() < (S.dashCd || 0) || G.phase === "end") return; S.dashCd = now() + 1400; e.playSet({boost:520}); sfx("boost"); e.playEmote?.("yu", "💨", 500); return; }   // 테니스 대시: 0.5초 확 (1.4초마다)
    if(S.st?.boost > 0) return;
    if(S.runBan > now()){ yuSay(pick(["엄마가 뛰지 말랬어… 😢", "지금은 걸어야 해 🥲"]), 1400); toast("🚫 달리기 금지 중", `${Math.ceil((S.runBan - now()) / 1000)}초 남았어요`, 1300); return; }
    if(S.st?.swim){ yuSay("물속에선 못 달려~ 🏊‍♀️", 1300); return; }
    if(HOLD[carry]?.spill){ yuSay(pick([`뛰면 ${carry} 쏟아져요~ 천천히!`, "달리면 흘려요 😅 조심조심"]), 1600); return; }
    if(S.charge < 1){ toast(`기 모으는 중… ${Math.round(S.charge * 100)}% 🏃‍♀️`, "걸어 다니면 더 빨리 차요", 1200); return; }
    S.charge = 0; runB.classList.remove("full"); e.playSet({boost:4500}); sfx("boost"); yuSay(pick(["달려라~! 🏃‍♀️💨", "부스트 온! ⚡", "슝~ 💨"]), 1400);
  }
  runB.addEventListener("pointerdown", ev => { ev.preventDefault(); ev.stopPropagation(); doRun(); });
  /* 아이폰은 손가락을 뗄 때(touchend·click)만 소리를 열어 줌 → 그때 무음 한 번 틀어 깨움 (2026-11-23 감독님 "음악이랑 효과음 안들리는데") */
  const auKick = () => { const pn = performance.now(), o = AU.ctx;
      if(o && (AU.stuck || (o.state !== "running" && AU.tryAt && pn - AU.tryAt > 700)) && !(pn - (AU.rbAt || -1e9) < 4000)){ AU.rbAt = pn; auRebuild(); }   // 지난번 깨우기가 0.7초 넘게 안 먹힘 → 새로
      const c = auInit(); if(!c) return;
      if(c.state !== "running"){ if(!AU.tryAt) AU.tryAt = pn; } else AU.tryAt = 0;
      if(!AU.woke){ try { const b = c.createBufferSource(); b.buffer = c.createBuffer(1, 1, 22050); b.connect(c.destination); b.start(0); AU.woke = c.state === "running"; } catch(_){} } },
    auVis = () => { if(!AU.ctx) return; if(document.hidden){ AU.ctx.suspend().catch(() => {}); return; }
      AU.woke = false; AU.tryAt = 0; AU.ctAt = performance.now(); AU.ctx.resume().catch(() => {}); },   // 돌아오면 다음 터치 때 다시 깨움
    auShow = ev => { if(ev.persisted) auVis(); }, AU_EV = ["pointerdown", "touchend", "click", "keydown"];
  AU_EV.forEach(k => addEventListener(k, auKick, true)); document.addEventListener("visibilitychange", auVis); addEventListener("pageshow", auShow); auInit();
  window.__ygAU = AU;   // 시험용
  /* 버튼 두 개를 같이 누르거나 두 번 톡 치면 화면이 확대되던 것: 게임 중엔 확대 막기 (2026-11-23 감독님 "갑자기 확대되서 방향키 숨음") */
  const noZoom = ev => ev.preventDefault(), oldTA = api.host.style.touchAction;
  api.host.style.touchAction = "none"; ["gesturestart", "gesturechange", "dblclick"].forEach(k => document.addEventListener(k, noZoom, {passive:false}));

  /* ---------- 시작 · 끝 ---------- */
  let waitT = 0;
  function boot(){
    const e = E();
    if(!live) return;
    if(!e || e.floorId?.() !== api.floor()){ waitT = setTimeout(boot, 150); return; }
    const y = api.yuna?.(), f = api.floor();
    const spawn = f === "main" ? [23.95, 4.6, 0] : y && y.floor === f && !y.hidden ? [y.i, y.j, 0] : EXIT;
    e.playStart(cb, spawn); e.playOutfit?.(rec.fit || "base"); if(rec.hair) e.playHair?.(rec.hair[0], rec.hair[1]); e.playSet({stroke:S.stroke});
    setTimeout(() => { if(live && !Q && panel.hidden && !rec.stars) openList("q"); }, 700);
    setTimeout(() => { if(live) checkBadges(); }, 2500);
  }
  boot();
  function stop(){
    if(!live) return; live = false; clearTimeout(waitT); clearInterval(S.sitIv); if(S.film) window.yunaFilm?.(false); endGame(); save();
    removeEventListener("keydown", kd, true); removeEventListener("keyup", ku, true); removeEventListener("blur", blur);
    AU_EV.forEach(k => removeEventListener(k, auKick, true)); document.removeEventListener("visibilitychange", auVis); removeEventListener("pageshow", auShow); auStop(); AU.woke = false; AU.duck = false;
    ["gesturestart", "gesturechange", "dblclick"].forEach(k => document.removeEventListener(k, noZoom)); api.host.style.touchAction = oldTA;
    try { E()?.playInput(0, 0); E()?.playStop(); } catch(e){ console.warn(e); }
    root.remove(); api.exit?.();
  }
  return {stop};
}
window.__ygUSE = USE;   // 시험용 (층마다 놀이 자리 둘러보기)
