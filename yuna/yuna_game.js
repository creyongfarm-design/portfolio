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
const SEED = {lobby:11, main:23, wf:37, s4:41, roof:59}, TOTAL = 54;
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
  cinema:["영화 언제 시작해요? 🍿", "아빠 작품 틀어 주세요! 🎬", "팝콘 먹고 싶다 🍿"], sofa:["푹신푹신~ ☁️", "TV 보자! 📺"],
  cafe:["딸기 우유 주세요~ 🍓", "여기 케이크 맛있대요 🍰", "엄마랑 데이트하고 싶다 💕"], meet:["회의 시작할게요! 😎", "제 의견은요… 간식 시간! 🍪"], camp:["불멍 최고 🔥", "마시멜로 구워 먹고 싶다 🍡"],
  pocha:["치킨 냄새 최고 🍗", "사이다 주세요! 🥤", "바삭바삭~ 😋"], swing:["더 높이~! 🎶", "하늘까지 가자 ☁️"], hammock:["흔들흔들~ 🍃", "해먹 최고야 😌"],
  bag:["말랑말랑~ 💛", "빈백에 파묻혔다 😆"], massage:["위이잉~ 간지러워 😆", "으아아 시원하다 💆"],
  director:["레디~ 액션! 🎬", "컷! 오케이~ 👌", "한 번만 더 갈게요! 📣"]};
/* 앉아서 하는 놀이 (2026-11-23 감독님 "다양한 의자에 앉으면 앉아서 뭘 하면 좋겠고"): fx = 머리 위로 번갈아 뜨는 것, mid = [몇 ms 뒤, 유나 말, 알림], after = mid 뒤 fx, npc = 앉으면 말 거는 사람 */
const SIT_DO = {
  church:{fx:["🙏", "✨", "🕊️"], first:"🙏 예배드렸다"},
  cinema:{fx:["🍿", "😆", "😲", "🍿", "🥹"], first:"🍿 영화 봤다", mid:[4000, "아빠 작품 상영 시작! 😍", "🎬 상영 시작!"]},
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
  s4:[{at:[27.7, 16.35], k:"vod", h:0.88}]};
const USE_LB = {arcade:["🕹️", "오락하기"], slide:["🛝", "미끄럼틀"], piano:["🎹", "피아노"], futsal:["⚽", "풋살 한 판"], pong:["🏓", "아빠랑 탁구"], claw:["🧸", "인형뽑기"]};
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
  vod:{ms:7000, lb:["🎥", "VOD 찍기"], say:"안녕하세요~ 유나의 다빈치 교실입니다! 🎥", fx:["🎥", "✨", "💡"], mid:"오늘은 컷 편집을 배워 볼게요 ✂️", done:"🎥 탈잉 VOD 찍기", end:"구독 좋아요 눌러 주세요~ 😆"}};
Object.entries(ACTS).forEach(([k, a]) => USE_LB[k] = a.lb);
const GYM = ["run", "yoga", "lift", "pullup", "bounce", "squat"];
const FSC = {i0:1.4, i1:12.6, j0:1.2, j1:8.4};   // 풋살장 안
const TWINKLE = [72, 72, 79, 79, 81, 81, 79, 0, 77, 77, 76, 76, 74, 74, 72];   // 작은 별
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
  ["treAll", "🏴‍☠️", "보물 54개 전부", r => cnt(r.tre) >= TOTAL],
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
  ["claw", "🧸", "인형뽑기 성공", r => (r.dolls || []).length > 0]];

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
  if(!AU.ctx){ const c = AU.ctx = new C(); AU.m = c.createGain(); AU.m.gain.value = AU.on ? 0.9 : 0; AU.m.connect(c.destination);
    AU.sfx = c.createGain(); AU.sfx.gain.value = 0.55; AU.sfx.connect(AU.m); AU.bgm = c.createGain(); AU.bgm.gain.value = 0.28; AU.bgm.connect(AU.m);
    const len = c.sampleRate * 0.5 | 0, b = c.createBuffer(1, len, c.sampleRate), dd = b.getChannelData(0); for(let k = 0; k < len; k++) dd[k] = Math.random() * 2 - 1; AU.noise = b; }
  if(AU.ctx.state !== "running" && AU.ctx.state !== "closed" && !document.hidden) AU.ctx.resume?.();
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
Object.assign(SEATS, HOME.seats);
Object.entries(HOME.sitLines).forEach(([k, l]) => SIT_YU[k] = SIT_YU[k] ? [...SIT_YU[k], ...l] : l);   // 소파·그네는 원래 대사에 더함
BGM.home1 = {bpm:84, lead:"sine", lv:0.12, soft:true, bell:true, ch:[[41,57,60,64],[36,55,60,64],[38,57,62,65],[43,55,59,62]],
  mel:[72,-1,74,76, -1,-1,72,-1,  69,-1,72,-1, 67,-1,-1,-1,  72,-1,74,76, 79,-1,76,-1,  74,-1,-1,72, 74,-1,-1,-1]};
BGM.home2 = BGM.home3 = BGM.home1;
BGM.home4 = {...BGM.home1, bpm:76};
const isHome = f => /^home\d$/.test(f || "");
/* 집 오가는 길: 로비 횡단보도 건너편 ↔ 집 대문, 집 계단. 들어올 때만 (스폰 자리가 바로 옆이라) */
const WALKS = [{f:"lobby", at:[17.6, 28.6], r:0.7, to:"home1", spawn:HOME.spawnGate},
  {f:"home1", at:HOME.gate, r:0.45, to:"lobby", spawn:[17.6, 28.2, Math.PI]},
  ...HOME.stairs.map(t => ({...t, r:0.45}))];
/* 다른 층 할 일이면 어디로 가야 하는지 (집에선 엘리베이터 대신 계단·대문) */
function wayOut(f, to){
  if(isHome(f)){ const a = +f[4], b = isHome(to) ? +to[4] : 0;
    const w = WALKS.find(t => t.f === f && (b > a ? t.to === "home" + (a + 1) : a === 1 ? t.to === "lobby" : t.to === "home" + (a - 1)));
    return w ? w.at : null; }
  if(isHome(to)) return f === "lobby" ? WALKS[0].at : ELEV;
  return ELEV;
}
function bgmFloor(f){ const k = BGM[f] ? f : "main"; if(AU.trk !== k){ AU.trk = k; AU.step = 0; } }
function bgmPump(){
  const c = AU.ctx; if(!c) return; if(c.state !== "running"){ AU.next = c.currentTime + 0.1; return; }
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
  sndB.onclick = ev => { ev.stopPropagation(); auSet(!AU.on); auInit(); sndB.textContent = AU.on ? "🔊" : "🔇"; };
  const nightEl = $(".yg-night"), grillEl = $(".yg-grill"), credEl = $(".yg-cred"), lbEl = $(".yg-lb"), chapEl = $(".yg-chap");
  const card = $(".yg-card"), hud = $(".yg-hud"), arrow = $(".yg-arrow"), joy = $(".yg-joy"), knob = joy.querySelector("i"), act = $(".yg-act"), jumpB = $(".yg-jump"), elevP = $(".yg-elev:not(.yg-fit)"), fitP = $(".yg-fit"), toastEl = $(".yg-toast"), panel = $(".yg-panel"), fade = $(".yg-fade"), help = $(".yg-help"), bagEl = $(".yg-bag"), stepsEl = $(".yg-steps"), makeEl = $(".yg-make");

  /* 별 기록 (이 기기에만) */
  let rec = {stars:0, done:{}, tre:{}, met:{}, vis:{}, badge:{}, round:0, req:0, jumps:0, boosts:0};
  try { rec = Object.assign(rec, JSON.parse(localStorage.getItem("crayon-yuna-play") || "{}")); } catch(_){}
  const JUMP_SVG = jumpB.querySelector("span").innerHTML;
  const save = () => { try { localStorage.setItem("crayon-yuna-play", JSON.stringify(rec)); } catch(_){} };

  const S = {floor:null, st:null, spots:[], bolt:null, near:null, tab:"q", reqNext:0, greet:{}, wetUntil:0};
  let REQ = null;   // 💬 유나를 부른 사람 {id, name, floor, until, kind}   // st = 엔진이 매 프레임 주는 상태
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
    if(!Q){ b.textContent = "할 일 고르기"; const h = S.floor ? `${FL[S.floor].name.split(" ")[0]} 보물 ${floorFound(S.floor)}/6 · 눌러서 할 일·놀이` : "눌러서 할 일·놀이 고르기"; if(s.textContent !== h) s.textContent = h; return; }
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
      r.querySelector(".e").textContent = q.e; r.querySelector("b").textContent = q.t; r.querySelector("small").textContent = q.id === "party" && rec.partyCh ? `이어 하기 · ${q.steps[rec.partyCh]?.ch?.join(" ") || ""}` : q.steps.map(s => s.f ? FL[s.f].name.split(" ")[0] : "❓").filter(x => x).filter((x, k, a) => a.indexOf(x) === k).join(" → ");
      r.onclick = () => { panel.hidden = true; begin(q); }; panel.append(r); });
    const free = document.createElement("button"); free.type = "button"; free.className = "yg-free"; free.textContent = Q ? "이 할 일 그만하고 그냥 돌아다니기" : "그냥 돌아다니기";
    free.onclick = () => { panel.hidden = true; if(Q){ endGame(); E()?.playActor("fr", null); Q = null; setCarry(""); setup(); renderCard(); } }; panel.append(free);
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
    const need = k => (G?.type === "hide" || G?.type === "tag" || G?.type === "freeze") && k === "dad" || G?.type === "futsal" && (k === "dad" || k === G.mate) || G?.type === "swim" && k === G.rival || G?.type === "pong" && k === "dad" || G?.type === "ending" || (st && st.f === f && st.talk === "@" + k);
    if(st && st.goAuto && st.f === f && !st.go){   // 엄마한테서 먼 자리에 소품
      const w = e.playWhere("_nora") || e.playWhere("l_nora"), sp = e.playSpots(5, 77 + rec.round, AVOID, 2.2);
      st.go = sp.sort((a, b) => (w ? Math.hypot(b[0] - w[0], b[1] - w[1]) - Math.hypot(a[0] - w[0], a[1] - w[1]) : 0))[0] || e.playFree(EXIT[0] + 4, EXIT[1] - 3, 0.2); }
    if(Q?.id === "friend" && S.frF !== f){ S.frF = f; S.trail = []; S.frSwim = false;
      const at = f === "lobby" && step === 0 ? e.playFree(16.4, 18.4, 0.22) : e.playFree(EXIT[0] + 0.9, EXIT[1] + 0.8, 0.22); e.playActor("fr", {at:[at[0], at[1], Math.PI], pose:"stand", to:null}); }
    // 아빠(2층)·엄마(4층) 배우: 원래 자리 근처에 세우고 원래 사람은 숨김
    [["dad", "main", "_dir", [32.2, 4.4]], ["mom", "s4", "_nora", [6.7, 17.9]]].forEach(([k, fl, id, def]) => {
      if(need(k) && (f === fl || G)){ if(!(S.st?.actors || {})[k] && !G){ const w0 = e.playWhere(id), w = w0 && Math.hypot(w0[0] - ELEV[0], w0[1] - ELEV[1]) > 2.4 ? w0 : null, at = e.playFree(...(w ? [w[0], w[1]] : def), 0.22); e.playActor(k, {at:[at[0], at[1], w ? w[2] : 0], pose:"stand"}); }
        hide.push(id, "l_" + id.slice(1)); }
      else e.playActor(k, null); });
    let mark = null;
    if(st && !G){ const fn = needFloor(st); if(st.find){ if(fn && fn !== f) mark = {at:wayOut(f, fn)}; }
      else if(st.f !== f) mark = {at:wayOut(f, st.f)};
      else if(st.go) mark = {at:st.go};
      else if(st.talk && st.talk[0] === "@") mark = {actor:st.talk.slice(1)};
      else if(Array.isArray(st.talk)){ const id = st.talk.find(x => e.playWhere(x)); mark = id ? {id} : null; } }
    if(G?.type === "swim") mark = {at:[28.35, 18.45]};
    e.playSet({water:f === "roof" ? [POOL] : [], hide, mark});
    if(Q?.id === "cat" && curStep()?.find && f === Q.catF && Q.catAtF !== f){ Q.catAt = e.playHideSpot(4) || e.playFree(EXIT[0] + 3, EXIT[1], 0.2); Q.catAtF = f; }
    refreshItems();
  }
  function spotsFor(f){ const e = E(); if(!e) return; S.spots = e.playSpots(6, SEED[f] + rec.round * 101, isHome(f) ? WALKS.filter(t => t.f === f).map(t => [t.at[0], t.at[1], 1.1]) : AVOID, isHome(f) ? 2.2 : 2.6); }
  function boltFor(){ const e = E(); if(!e) return; S.bolt = e.playSpots(1, Math.random() * 1e9 | 0, [...AVOID, ...S.spots.map(p => [p[0], p[1], 1.6])], 1)[0] || null; }
  function refreshItems(){
    const e = E(); if(!e || !S.floor) return; const f = S.floor, L = [];
    if(G?.type === "stars") G.items.forEach(it => { if(!it.got) L.push(it); });
    else { S.spots.forEach((p, k) => { const tr = TREASURE[f][k]; if(tr && !rec.tre[`${f}:${k}`]) L.push({id:"t" + k, e:tr[0], i:p[0], j:p[1], y:tr[2] ? 1.12 : 0.42, high:!!tr[2], s:0.62}); });
      if(S.bolt) L.push({id:"bolt", e:"⚡", i:S.bolt[0], j:S.bolt[1], y:0.42, s:0.6}); }
    if(Q?.id === "cat"){ const pos = Q.cat === "follow" ? S.catPos : curStep()?.find && f === Q.catF ? Q.catAt : null; if(pos) L.push({id:"cat", e:"🐈", i:pos[0], j:pos[1], y:0.27, s:0.62, pick:false, glow:false, bob:false}); }
    if(Q?.id === "party" && f === "roof"){ const it = (id, e, i, j, y, s, bob = false) => L.push({id, e, i, j, y, s, pick:false, glow:false, bob});
      if(step > 1) it("p_cake", "🎂", 24.4, 3.5, 0.92, 0.5); if(step > 4){ it("p_b1", "🎈", 22.85, 3.4, 1.55, 0.55, true); it("p_b2", "🎈", 25.95, 3.4, 1.65, 0.55, true); it("p_fl", "💐", 23.4, 3.5, 0.9, 0.42); } }
    if(G?.type === "pong" && G.b) L.push({id:"pball", e:"⚪", i:G.b.f[0], j:G.b.f[1], y:0.95, s:0.24, pick:false, glow:false, bob:false});
    if(G?.type === "catmeat" && G.cat) L.push({id:"pcat", e:"🐈", i:G.cat[0], j:G.cat[1], y:0.27, s:0.62, pick:false, glow:false, bob:false});
    if(REQ && REQ.floor === f) L.push({id:"req", e:"💬", on:REQ.id, pick:false, glow:false, s:0.4});
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
  function endGame(){ if(!G) return; const was = G.type; clearInterval(G.iv); G.tm?.forEach(clearTimeout); const e = E(); if(e){ e.playSet({ball:null, freeze:false, act:null}); } G = null; hud.hidden = true; grillEl.hidden = true; grillEl.classList.remove("claw"); grillEl.querySelector(".bar em").style.left = ""; pickEl.hidden = true;
    if(was === "ending"){ nightEl.classList.remove("on"); lbOn(false); credEl.hidden = true; fade.classList.remove("on"); }
    if(was === "stars" || was === "catmeat") refreshItems(); }
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
    if(G.type === "arcade") h = G.phase === "go" ? `🕹️ ${G.n * 100}점 ${tm}` : "🕹️ 준비…";
    if(G.type === "futsal") h = `⚽ ${G.goals} 골 ${tm}`;
    if(G.type === "freeze") h = G.phase === "look" ? `🧊 얼음! 움직이지 마 ${tm}` : "😱 아빠다!";
    if(G.type === "pong") h = `🏓 랠리 ${G.rally} · 놓침 ${G.miss}/3 ${tm}`;
    if(G.type === "catmeat") h = G.phase === "run" ? `🐈 크레파스 잡기! ${tm}` : "😱 고기 도둑!";
    if(["grill", "edit", "ending", "claw"].includes(G.type)){ hud.hidden = true; return; }
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
    if(G?.type === "stars" && G.phase !== "end" && t > G.until){ G.phase = "end"; yuSay("아깝다~ 조금만 더 빨리! 😢"); toast(`시간 끝! 🌟 ${G.n}/${G.total}`, "🔁 버튼으로 다시 해 봐요", 2400); later(1200, () => { endGame(); setup(); renderCard(); }); }
    gameHud();
  }
  /* 모험: 보물 레이더 · 고양이 · 💬 부름 */
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
  function flash(){ flashEl.classList.remove("on"); void flashEl.offsetWidth; flashEl.classList.add("on"); }
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
  function firstUse(k, t){ rec.uses = rec.uses || {}; if(rec.uses[k]) return; rec.uses[k] = 1; rec.stars++; save(); renderCard(); later0(1500, () => { sfx("star"); toast(t, "처음 해 봤어요 · ⭐ +1", 2200, true); checkBadges(); }); }
  function useIt(u){
    const e = E(); if(!e || S.busy) return;
    if(u.k === "arcade"){ e.playSet({pos:[u.at[0], u.at[1], PI]}); startGame("arcade"); G.arc = u; return; }
    if(u.k === "piano"){ S.busy = true; e.playSet({freeze:true, pos:[u.at[0], u.at[1], -PI / 2]}); yuSay("작은 별 칠게요~ 🎹", 1600); const c = auInit();
      TWINKLE.forEach((m, k) => later0(700 + k * 330, () => { if(!m) return; if(c && AU.on) tone(mtof(m), c.currentTime + 0.01, 0.5, {type:"triangle", vol:0.2}); if(k % 2 === 0) e.playEmote?.([0.6, 9.8 + (k % 5) * 0.18, 1.3], k % 4 ? "♪" : "♫", 900); }));
      later0(700 + TWINKLE.length * 330 + 300, () => { S.busy = false; e.playSet({freeze:false, wave:1400}); npcSay("piano", pick(["우와 유나 피아노 잘 친다! 👏", "다음엔 같이 반주하자 🎹"]), 2600); firstUse("piano", "🎹 피아노 연주"); }); return; }
    if(u.k === "slide"){ S.busy = true; e.playSet({freeze:true, cloak:true}); sfx("jump"); yuSay("올라간다~ 🧗‍♀️", 1200);
      [[30.6, 9.9, 0.5], [30.2, 9.9, 1.0]].forEach((p, k) => later0(150 + k * 300, () => e.playEmote?.(p, "🧗‍♀️", 500)));
      for(let k = 0; k <= 6; k++) later0(800 + k * 110, () => { e.playEmote?.([29.9, 10.5 + k * 0.42, 1.15 - k * 0.16], k < 6 ? "😆" : "💨", 380); if(k === 0) sfx("boost"); });
      later0(1650, () => { e.playSet({cloak:false, pos:[29.9, 13.4, 0]}); e.playSet({freeze:false}); S.busy = false; yuSay(pick(["슝~~ 한 번 더! 🛝", "우와 빠르다!! 😆"]), 1600); rec.slides = (rec.slides || 0) + 1; save(); firstUse("slide", "🛝 미끄럼틀 슝"); });
      return; }
    if(u.k === "futsal") startGame("futsal");
    if(u.k === "pong" || u.k === "claw") startGame(u.k);
    if(ACTS[u.k]) doAct(u);
  }
  function doAct(u){
    const e = E(), A = ACTS[u.k], back = S.st ? [S.st.i, S.st.j] : null; S.busy = true;
    e.playSet({freeze:true, mark:null, act:{k:u.k, y:A.y || 0}, ...(A.raw ? {at:[u.at[0], u.at[1], u.h ?? 0]} : {pos:[u.at[0], u.at[1], u.h ?? 0]})});
    sfx("go"); yuSay(A.say, 1800); let n = 0; const NUM = ["하나", "둘", "셋", "넷", "다섯", "여섯", "일곱", "여덟"];
    const iv = setInterval(() => { if(!live){ clearInterval(iv); return; } n++;
      if(A.count){ if(n >= 2 && n <= 9) yuSay(`${NUM[n - 2]}! ${A.fx[0]}`, 600); }
      else e.playEmote?.("yu", A.fx[n % A.fx.length], 1100); }, A.count ? 650 : 1500);
    if(A.mid) later0(A.ms * 0.5, () => yuSay(A.mid, 2200));
    later0(A.ms, () => { clearInterval(iv); e.playSet({act:null, freeze:false, wave:1200, ...(A.raw && back ? {pos:[back[0], back[1]]} : {})}); S.busy = false; sfx("pick");
      yuSay(A.end, 1800); e.playEmote?.("yu", A.fx[0], 1200); firstUse(u.k, A.done); later0(2400, checkBadges); });
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
    endGame(); pendingFloor = f; hot = null; fade.textContent = `${isHome(f) ? "🏡" : "🏢"} ${FL[f].name}`; fade.classList.add("on");
    E()?.playSet({spawn:t.spawn, freeze:true});
    if(t.f === "lobby") yuSay(pick(["집에 가자~ 🏡", "우리 집 가야지! 🏡"]), 1400); else if(f === "lobby") yuSay(pick(["아빠 회사 가자! 🏢", "타워 가야지~ 🏢"]), 1400);
    setTimeout(() => { if(live) api.goFloor(f); }, 380);
    setTimeout(() => { if(live && pendingFloor === f){ pendingFloor = null; fade.classList.remove("on"); E()?.playSet({freeze:false}); } }, 9000);
  }

  /* ---------- 엔진 콜백 ---------- */
  const cb = {
    onFloor(fid){
      S.floor = fid; S.st = null; REQ = null; S.frF = null; S.near = null; S.reqNext = now() + 30000; bgmFloor(fid);
      if(!rec.vis[fid]){ rec.vis[fid] = 1; save(); later0(1500, checkBadges); }
      E()?.playSet({water:fid === "roof" ? [POOL] : []}); setCarry(carry); spotsFor(fid); boltFor();
      if(Q?.cat === "follow") S.catPos = [EXIT[0] + 0.4, EXIT[1] + 0.5];
      if(pendingFloor && fid === pendingFloor){ pendingFloor = null; setTimeout(() => { if(live){ fade.classList.remove("on"); } }, 250); }
      else if(!pendingFloor) fade.classList.remove("on");
      setup(); renderCard();
      const st = curStep(); if(st?.game && st.f === fid && !G) startGame(st.game);
    },
    onTick(st){
      S.st = st; charge(st); momCatch(st); if(st.floor !== S.floor) return; walks(st);
      const sp = curStep();
      // 도착하기 단계
      if(sp && sp.go && sp.f === st.floor && !G && !S.busy && Math.hypot(st.i - sp.go[0], st.j - sp.go[1]) < sp.r){ if(sp.yu) yuSay(sp.yu);
        if(sp.make){ const q = Q; makeIt(sp, null, () => { if(Q !== q) return; if(sp.got) receive(sp.got); else setCarry(""); if(sp.make.done) yuSay(sp.make.done, 2400); advance(); }); }
        else { if(sp.got) receive(sp.got); else setCarry(""); advance(); } }
      // 오른쪽 버튼
      const nearElev = !!FL[st.floor]?.n && Math.hypot(st.i - ELEV[0], st.j - ELEV[1]) < 1.45 && !G; S.atElev = nearElev;
      const n = !G || G.type === "ball" ? st.near : null;
      const retry = sp && sp.game && sp.f === st.floor && !G;
      const booth = !G && nearBooth(st);
      const use = !G && !S.busy ? (nearUse(st) || (inCourt(st) && !(sp?.game === "ball") ? {k:"futsal"} : null)) : null;
      const qn = n && sp && sp.f === st.floor && (sp.talk === n.id || Array.isArray(sp.talk) && sp.talk.includes(n.id));   // 할 일 상대가 엘베 앞에 있어도 말 걸기 먼저
      let mode = G?.type === "grill" ? "flip" : G?.type === "arcade" ? "mash" : G?.type === "futsal" ? "shoot" : G?.type === "pong" ? "hit" : G?.type === "claw" ? "grab" : retry ? "retry" : qn ? "talk" : nearElev ? "elev" : booth ? "dress" : use ? "use:" + use.k : n ? "talk" : "";
      if(mode !== act.dataset.m || (mode === "talk" && act.dataset.id !== n.id)){
        act.dataset.m = mode; act.dataset.id = n?.id || ""; act.hidden = !mode;
        if(mode === "elev"){ act.querySelector("span").textContent = "🛗"; act.querySelector("b").textContent = matchMedia("(hover:hover) and (pointer:fine)").matches ? "숫자 키로 층" : "엘리베이터"; }
        if(mode === "talk"){ act.querySelector("span").textContent = "💬"; act.querySelector("b").textContent = n.name; }
        if(mode === "retry"){ act.querySelector("span").textContent = "🔁"; act.querySelector("b").textContent = "다시 하기"; }
        if(mode === "dress"){ act.querySelector("span").textContent = "👗"; act.querySelector("b").textContent = "옷 갈아입기"; }
        if(mode === "flip"){ act.querySelector("span").textContent = "🍳"; act.querySelector("b").textContent = "뒤집기"; }
        if(mode === "mash"){ act.querySelector("span").textContent = "👊"; act.querySelector("b").textContent = "연타!"; }
        if(mode === "shoot"){ act.querySelector("span").textContent = "⚽"; act.querySelector("b").textContent = "슛"; }
        if(mode === "hit"){ act.querySelector("span").textContent = "🏓"; act.querySelector("b").textContent = "치기!"; }
        if(mode === "grab"){ act.querySelector("span").textContent = "🪝"; act.querySelector("b").textContent = "뽑기!"; }
        if(use && mode.startsWith("use:")){ const L = USE_LB[use.k]; act.querySelector("span").textContent = L[0]; act.querySelector("b").textContent = L[1]; }
        if(mode !== "elev") closeElev(); if(mode !== "dress") fitP.hidden = true; }
      act.onclick = () => { if(mode === "flip") flipMeat(); else if(mode === "mash") mash(); else if(mode === "hit") hit(); else if(mode === "grab") grab(); else if(mode === "shoot") shoot(); else if(mode.startsWith("use:")) useIt(use); else if(mode === "retry") startGame(sp.game); else if(mode === "elev") elevP.hidden ? openElev() : closeElev(); else if(mode === "dress") fitP.hidden ? openFit() : (fitP.hidden = true); else if(mode === "talk") talk(n); };
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
      { const jm = G?.type === "futsal" ? "pass" : st.swim ? "stroke:" + S.stroke : st.sit ? "stand" : !G && nearSeat(st) ? "sit" : "jump", sk = STROKES.find(x => x[0] === S.stroke) || STROKES[0];
        if(jm !== jumpB.dataset.m){ jumpB.dataset.m = jm; jumpB.querySelector("span").innerHTML = jm === "pass" ? "🤝" : jm === "jump" ? JUMP_SVG : jm === "sit" ? "🪑" : st.swim ? sk[1] : "🧍‍♀️";
          jumpB.querySelector("b").textContent = jm === "pass" ? "패스" : jm === "jump" ? "점프" : jm === "sit" ? "앉기" : st.swim ? sk[2] : "일어나기"; jumpB.setAttribute("aria-label", st.swim ? "영법 바꾸기" : jumpB.querySelector("b").textContent); } }
      if(st.moving && !helpT){ helpT = setTimeout(() => { help.style.opacity = 0; }, 5000); }
    },
    onPick,
    onBump(id){ if(G && G.type !== "ball") return; if(HOLD[carry]?.spill){ spill(); later0(800, () => npcSay(id, pick(["어이쿠 조심! 안 쏟았지? 😅", "천천히~ 뜨거워! ☕", "괜찮아? 흘릴 뻔했네 😮"]), 2200)); return; } sfx("bump"); const isDad = id === "@dad" || id === "_dir", isMom = id === "@mom" || /nora$/.test(id);
      yuSay(pick(BUMP_YU), 1500); E()?.playEmote?.(id, "💫", 1200); later0(700, () => npcSay(id, pick(isDad ? BUMP_DAD : isMom ? BUMP_MOM : BUMP_RE), 2200)); },
    onSplash(kind){ sfx("splash"); if(kind === "in" && !S.strokeTip){ S.strokeTip = true; later0(1800, () => toast(`${(STROKES.find(x => x[0] === S.stroke) || STROKES[0])[1]} 오른쪽 버튼으로 영법 바꾸기`, "자유형 · 평형 · 배영 (키보드 F)", 2400, true)); } if(kind === "in" && S.st && S.st.fit !== "swim" && !S.clothSwim){ S.clothSwim = true; yuSay("앗 옷 입고 들어왔다 😆 탈의실에서 수영복 입을걸!", 2600); }
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
    if(e.code === "KeyF" && S.st?.swim){ nextStroke(); e.preventDefault(); return; }
    const dn = /^(?:Digit|Numpad)([1-9])$/.exec(e.code);   // 엘리베이터 앞이면 숫자 키로 층 고르기 (2026-11-23 감독님 "키보드로 엘베 층을 고를수없네")
    if(dn && !pickEl.hidden){ const b = pickEl.querySelectorAll("button")[+dn[1] - 1]; if(b){ b.click(); e.preventDefault(); e.stopPropagation(); return; } }
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
  $(".yg-x:not(.yg-snd)").onclick = () => stop();   // (소리 버튼도 yg-x라 첫 번째로 잡히던 것 고침)
  function doJump(){ const e = E(); if(!e) return;
    if(G?.type === "grill"){ flipMeat(); return; }
    if(G?.type === "arcade"){ mash(); return; }
    if(G?.type === "futsal"){ pass(); return; }
    if(G?.type === "pong"){ hit(); return; }
    if(G?.type === "claw"){ grab(); return; }
    if(S.st?.sit){ e.playSit?.(null); sfx("blip"); return; }
    { const s = !G && nearSeat(S.st);
      if(s && s.k !== "church" && (e.playPeople?.() || []).some(q => Math.hypot(q.i - s.i, q.j - s.j) < 0.35)){ yuSay("앗 누가 앉아 있네 😅", 1400); return; }
      if(s && e.playSit?.(s)){ sfx("blip"); const L = SIT_YU[s.k]; sitPlay(s);
        if(s.k === "church"){ rec.pray = (rec.pray || 0) + 1; save(); checkBadges(); later0(700, () => { yuSay(pick(L), 3200); e.playEmote?.("yu", "🙏", 1800); }); }
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
    runB.style.setProperty("--p", Math.min(1, st.boost > 0 ? st.boost / 4500 : S.charge).toFixed(3)); runB.classList.toggle("go", st.boost > 0);
  }
  /* 달리다 엄마한테 걸리면 20초 달리기 금지 (2026-11-23 감독님 "달리다가 엄마한테 걸리면 못 뛰는것도 있으면 좋겟고") */
  function momCatch(st){
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
    const e = E(); if(!e || S.st?.boost > 0) return;
    if(S.runBan > now()){ yuSay(pick(["엄마가 뛰지 말랬어… 😢", "지금은 걸어야 해 🥲"]), 1400); toast("🚫 달리기 금지 중", `${Math.ceil((S.runBan - now()) / 1000)}초 남았어요`, 1300); return; }
    if(S.st?.swim){ yuSay("물속에선 못 달려~ 🏊‍♀️", 1300); return; }
    if(HOLD[carry]?.spill){ yuSay(pick([`뛰면 ${carry} 쏟아져요~ 천천히!`, "달리면 흘려요 😅 조심조심"]), 1600); return; }
    if(S.charge < 1){ toast(`기 모으는 중… ${Math.round(S.charge * 100)}% 🏃‍♀️`, "걸어 다니면 더 빨리 차요", 1200); return; }
    S.charge = 0; runB.classList.remove("full"); e.playSet({boost:4500}); sfx("boost"); yuSay(pick(["달려라~! 🏃‍♀️💨", "부스트 온! ⚡", "슝~ 💨"]), 1400);
  }
  runB.addEventListener("pointerdown", ev => { ev.preventDefault(); ev.stopPropagation(); doRun(); });
  /* 아이폰은 손가락을 뗄 때(touchend·click)만 소리를 열어 줌 → 그때 무음 한 번 틀어 깨움 (2026-11-23 감독님 "음악이랑 효과음 안들리는데") */
  const auKick = () => { const c = auInit(); if(c && !AU.woke){ try { const b = c.createBufferSource(); b.buffer = c.createBuffer(1, 1, 22050); b.connect(c.destination); b.start(0); AU.woke = c.state === "running"; } catch(_){} } },
    auVis = () => { if(AU.ctx) document.hidden ? AU.ctx.suspend() : AU.ctx.resume(); }, AU_EV = ["pointerdown", "touchend", "click", "keydown"];
  AU_EV.forEach(k => addEventListener(k, auKick, true)); document.addEventListener("visibilitychange", auVis); auInit();
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
    e.playStart(cb, spawn); e.playOutfit?.(rec.fit || "base"); e.playSet({stroke:S.stroke});
    setTimeout(() => { if(live && !Q && panel.hidden && !rec.stars) openList("q"); }, 700);
    setTimeout(() => { if(live) checkBadges(); }, 2500);
  }
  boot();
  function stop(){
    if(!live) return; live = false; clearTimeout(waitT); clearInterval(S.sitIv); if(S.film) window.yunaFilm?.(false); endGame(); save();
    removeEventListener("keydown", kd, true); removeEventListener("keyup", ku, true); removeEventListener("blur", blur);
    AU_EV.forEach(k => removeEventListener(k, auKick, true)); document.removeEventListener("visibilitychange", auVis); auStop(); AU.woke = false;
    ["gesturestart", "gesturechange", "dblclick"].forEach(k => document.removeEventListener(k, noZoom)); api.host.style.touchAction = oldTA;
    try { E()?.playInput(0, 0); E()?.playStop(); } catch(e){ console.warn(e); }
    root.remove(); api.exit?.();
  }
  return {stop};
}
