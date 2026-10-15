// 영어 단어 보스(2단계)용 단어 — 초등 5학년 수준.  [영어, 뜻]
// ✏️ 단어를 더 넣으려면 맨 아래 EXTRA 에 ['english', '뜻'] 을 한 줄씩 추가하면 된다. (영어·뜻이 이미 있는 것과 같으면 무시됨)
// 같은 뜻이 두 단어에 겹치면 헷갈리니, 뜻에 괄호로 구분해 적는다. 예) ['leg','다리(몸)'], ['bridge','다리(강 위)']

const CORE: [string, string][] = [
  // 동물
  ['dog', '개'], ['cat', '고양이'], ['rabbit', '토끼'], ['tiger', '호랑이'], ['lion', '사자'], ['elephant', '코끼리'],
  ['monkey', '원숭이'], ['bear', '곰'], ['fox', '여우'], ['wolf', '늑대'], ['deer', '사슴'], ['horse', '말(동물)'],
  ['cow', '소'], ['pig', '돼지'], ['sheep', '양'], ['goat', '염소'], ['chicken', '닭'], ['duck', '오리'],
  ['bird', '새'], ['fish', '물고기'], ['snake', '뱀'], ['frog', '개구리'], ['turtle', '거북이'], ['whale', '고래'],
  ['dolphin', '돌고래'], ['shark', '상어'], ['mouse', '쥐'], ['squirrel', '다람쥐'], ['butterfly', '나비'], ['bee', '벌(곤충)'],
  ['giraffe', '기린'], ['zebra', '얼룩말'], ['penguin', '펭귄'], ['kangaroo', '캥거루'], ['crocodile', '악어'], ['eagle', '독수리'],
  ['owl', '부엉이'], ['spider', '거미'], ['ant', '개미'], ['insect', '곤충'], ['pet', '반려동물'], ['animal', '동물'],
  // 음식
  ['apple', '사과'], ['banana', '바나나'], ['orange', '오렌지'], ['grape', '포도'], ['strawberry', '딸기'], ['watermelon', '수박'],
  ['peach', '복숭아'], ['pear', '배(과일)'], ['lemon', '레몬'], ['tomato', '토마토'], ['potato', '감자'], ['carrot', '당근'],
  ['onion', '양파'], ['cucumber', '오이'], ['corn', '옥수수'], ['rice', '쌀'], ['bread', '빵'], ['noodle', '국수'],
  ['soup', '수프'], ['egg', '달걀'], ['milk', '우유'], ['cheese', '치즈'], ['butter', '버터'], ['sugar', '설탕'],
  ['salt', '소금'], ['pizza', '피자'], ['hamburger', '햄버거'], ['sandwich', '샌드위치'], ['salad', '샐러드'], ['cookie', '쿠키'],
  ['cake', '케이크'], ['ice cream', '아이스크림'], ['chocolate', '초콜릿'], ['juice', '주스'], ['water', '물'], ['tea', '차(마시는)'],
  ['coffee', '커피'], ['meat', '고기'], ['beef', '소고기'], ['pork', '돼지고기'], ['vegetable', '채소'], ['fruit', '과일'],
  ['breakfast', '아침 식사'], ['lunch', '점심 식사'], ['dinner', '저녁 식사'], ['snack', '간식'], ['dessert', '후식'], ['menu', '메뉴'],
  // 학교
  ['school', '학교'], ['classroom', '교실'], ['teacher', '선생님'], ['student', '학생'], ['desk', '책상'], ['chair', '의자'],
  ['book', '책'], ['notebook', '공책'], ['pencil', '연필'], ['eraser', '지우개'], ['ruler', '자(길이)'], ['scissors', '가위'],
  ['glue', '풀(접착제)'], ['bag', '가방'], ['blackboard', '칠판'], ['library', '도서관'], ['playground', '운동장'], ['gym', '체육관'],
  ['homework', '숙제'], ['test', '시험'], ['lesson', '수업'], ['subject', '과목'], ['math', '수학'], ['science', '과학'],
  ['English', '영어'], ['music', '음악'], ['art', '미술'], ['history', '역사'], ['Korean', '국어'], ['schedule', '시간표'],
  ['grade', '학년'], ['friend', '친구'], ['classmate', '같은 반 친구'], ['question', '질문'], ['answer', '대답'], ['vacation', '방학'],
  // 장소
  ['home', '집'], ['kitchen', '부엌'], ['bathroom', '욕실'], ['bedroom', '침실'], ['living room', '거실'], ['garden', '정원'],
  ['park', '공원'], ['zoo', '동물원'], ['museum', '박물관'], ['hospital', '병원'], ['bank', '은행'], ['post office', '우체국'],
  ['police station', '경찰서'], ['fire station', '소방서'], ['market', '시장'], ['supermarket', '슈퍼마켓'], ['restaurant', '식당'], ['bakery', '빵집'],
  ['bookstore', '서점'], ['pharmacy', '약국'], ['station', '역'], ['airport', '공항'], ['bus stop', '버스 정류장'], ['street', '거리'],
  ['bridge', '다리(강 위)'], ['building', '건물'], ['mountain', '산'], ['river', '강'], ['sea', '바다'], ['beach', '해변'],
  ['forest', '숲'], ['island', '섬'], ['lake', '호수'], ['city', '도시'], ['village', '마을'], ['country', '나라'],
  ['farm', '농장'], ['castle', '성'], ['temple', '절'], ['church', '교회'], ['shop', '가게'], ['office', '사무실'],
  // 직업·사람
  ['doctor', '의사'], ['nurse', '간호사'], ['farmer', '농부'], ['fisherman', '어부'], ['cook', '요리사'], ['singer', '가수'],
  ['dancer', '무용수'], ['painter', '화가'], ['writer', '작가'], ['scientist', '과학자'], ['pilot', '조종사'], ['driver', '운전사'],
  ['firefighter', '소방관'], ['police officer', '경찰관'], ['dentist', '치과 의사'], ['baker', '제빵사'], ['actor', '배우'], ['soldier', '군인'],
  ['engineer', '기술자'], ['astronaut', '우주비행사'], ['programmer', '프로그래머'], ['musician', '음악가'], ['mother', '어머니'], ['father', '아버지'],
  ['sister', '자매(누나·언니·여동생)'], ['brother', '형제(형·오빠·남동생)'], ['grandmother', '할머니'], ['grandfather', '할아버지'], ['uncle', '삼촌'], ['aunt', '이모·고모'],
  ['cousin', '사촌'], ['baby', '아기'], ['family', '가족'], ['boy', '소년'], ['girl', '소녀'], ['man', '남자'],
  ['woman', '여자'], ['child', '어린이'], ['parents', '부모님'], ['neighbor', '이웃'], ['king', '왕'], ['queen', '여왕'],
  // 몸
  ['head', '머리(신체)'], ['face', '얼굴'], ['eye', '눈(신체)'], ['ear', '귀'], ['nose', '코'], ['mouth', '입'],
  ['tooth', '이(치아)'], ['hair', '머리카락'], ['neck', '목(신체)'], ['shoulder', '어깨'], ['arm', '팔'], ['hand', '손'],
  ['finger', '손가락'], ['leg', '다리(몸)'], ['knee', '무릎'], ['foot', '발'], ['toe', '발가락'], ['back', '등(신체)'],
  ['stomach', '배(몸)'], ['heart', '심장'], ['bone', '뼈'], ['skin', '피부'], ['brain', '뇌'], ['body', '몸'],
  // 자연·날씨
  ['sun', '태양'], ['moon', '달(하늘)'], ['star', '별'], ['sky', '하늘'], ['cloud', '구름'], ['rain', '비'],
  ['snow', '눈(내리는)'], ['wind', '바람'], ['storm', '폭풍'], ['rainbow', '무지개'], ['weather', '날씨'], ['sunny', '맑은'],
  ['cloudy', '흐린'], ['rainy', '비 오는'], ['snowy', '눈 오는'], ['windy', '바람 부는'], ['hot', '더운'], ['cold', '추운'],
  ['warm', '따뜻한'], ['cool', '시원한'], ['season', '계절'], ['spring', '봄'], ['summer', '여름'], ['fall', '가을'],
  ['winter', '겨울'], ['flower', '꽃'], ['tree', '나무'], ['grass', '풀(잔디)'], ['leaf', '잎'], ['rock', '바위'],
  ['sand', '모래'], ['wave', '파도'], ['earth', '지구'], ['fire', '불'], ['ice', '얼음'], ['air', '공기'],
  ['soil', '흙'], ['nature', '자연'], ['space', '우주'], ['planet', '행성'],
  // 색깔
  ['red', '빨간색'], ['blue', '파란색'], ['yellow', '노란색'], ['green', '초록색'], ['black', '검은색'], ['white', '흰색'],
  ['pink', '분홍색'], ['purple', '보라색'], ['brown', '갈색'], ['gray', '회색'], ['color', '색깔'], ['gold', '금'],
  // 시간·수
  ['today', '오늘'], ['tomorrow', '내일'], ['yesterday', '어제'], ['morning', '아침(시간)'], ['afternoon', '오후'], ['evening', '저녁(시간)'],
  ['night', '밤'], ['week', '주(7일)'], ['month', '달(1~12월)'], ['year', '해(연도)'], ['day', '하루'], ['hour', '시간(60분)'],
  ['minute', '분(시간)'], ['Monday', '월요일'], ['Tuesday', '화요일'], ['Wednesday', '수요일'], ['Thursday', '목요일'], ['Friday', '금요일'],
  ['Saturday', '토요일'], ['Sunday', '일요일'], ['weekend', '주말'], ['birthday', '생일'], ['holiday', '휴일'], ['always', '항상'],
  ['usually', '보통'], ['sometimes', '가끔'], ['never', '결코 ~않다'], ['often', '자주'], ['hundred', '백(100)'], ['thousand', '천(1000)'],
  ['first', '첫 번째'], ['second', '두 번째'], ['third', '세 번째'], ['twenty', '스물(20)'], ['thirty', '서른(30)'], ['fifty', '쉰(50)'],
  // 동사
  ['go', '가다'], ['come', '오다'], ['eat', '먹다'], ['drink', '마시다'], ['sleep', '자다'], ['wake up', '일어나다'],
  ['run', '달리다'], ['walk', '걷다'], ['jump', '뛰다'], ['swim', '수영하다'], ['fly', '날다'], ['sing', '노래하다'],
  ['dance', '춤추다'], ['read', '읽다'], ['write', '쓰다'], ['draw', '그리다'], ['listen', '듣다'], ['speak', '말하다'],
  ['look', '보다'], ['watch', '지켜보다'], ['open', '열다'], ['close', '닫다'], ['buy', '사다'], ['sell', '팔다'],
  ['give', '주다'], ['take', '가져가다'], ['make', '만들다'], ['wash', '씻다'], ['play', '놀다'], ['study', '공부하다'],
  ['learn', '배우다'], ['teach', '가르치다'], ['help', '돕다'], ['ask', '묻다'], ['think', '생각하다'], ['know', '알다'],
  ['want', '원하다'], ['like', '좋아하다'], ['love', '사랑하다'], ['need', '필요하다'], ['use', '사용하다'], ['find', '찾다'],
  ['call', '부르다'], ['wait', '기다리다'], ['meet', '만나다'], ['visit', '방문하다'], ['travel', '여행하다'], ['ride', '타다'],
  ['drive', '운전하다'], ['climb', '오르다'], ['catch', '잡다'], ['throw', '던지다'], ['kick', '차다'], ['push', '밀다'],
  ['pull', '당기다'], ['carry', '나르다'], ['bring', '가져오다'], ['wear', '입다'], ['forget', '잊다'], ['remember', '기억하다'],
  ['begin', '시작하다'], ['finish', '끝내다'], ['stop', '멈추다'], ['win', '이기다'], ['lose', '지다'], ['laugh', '웃다'],
  ['cry', '울다'], ['smile', '미소 짓다'], ['worry', '걱정하다'], ['choose', '고르다'], ['decide', '결정하다'], ['count', '세다'],
  ['build', '짓다'], ['grow', '자라다'], ['sit', '앉다'], ['stand', '서다'], ['turn', '돌다'], ['cut', '자르다'],
  ['break', '깨다'], ['fix', '고치다'], ['clean', '청소하다'], ['cook food', '요리하다'], ['paint', '칠하다'], ['save', '구하다'],
  // 형용사
  ['big', '큰'], ['small', '작은'], ['long', '긴'], ['short', '짧은'], ['tall', '키가 큰'], ['fast', '빠른'],
  ['slow', '느린'], ['new', '새로운'], ['old', '오래된'], ['young', '어린'], ['happy', '행복한'], ['sad', '슬픈'],
  ['angry', '화난'], ['tired', '피곤한'], ['hungry', '배고픈'], ['thirsty', '목마른'], ['sleepy', '졸린'], ['scared', '무서워하는'],
  ['excited', '신이 난'], ['bored', '지루한'], ['kind', '친절한'], ['funny', '재미있는'], ['smart', '똑똑한'], ['brave', '용감한'],
  ['shy', '수줍은'], ['quiet', '조용한'], ['loud', '시끄러운'], ['dirty', '더러운'], ['heavy', '무거운'], ['light', '가벼운'],
  ['strong', '강한'], ['weak', '약한'], ['rich', '부자인'], ['poor', '가난한'], ['busy', '바쁜'], ['free', '자유로운'],
  ['easy', '쉬운'], ['difficult', '어려운'], ['important', '중요한'], ['special', '특별한'], ['favorite', '가장 좋아하는'], ['delicious', '맛있는'],
  ['beautiful', '아름다운'], ['pretty', '예쁜'], ['ugly', '못생긴'], ['dangerous', '위험한'], ['safe', '안전한'], ['wet', '젖은'],
  ['dry', '마른'], ['full', '가득 찬'], ['empty', '텅 빈'], ['high', '높은'], ['low', '낮은'], ['deep', '깊은'],
  ['wide', '넓은'], ['narrow', '좁은'], ['round', '둥근'], ['sweet', '단'], ['sour', '신'], ['salty', '짠'],
  ['spicy', '매운'], ['bitter', '쓴'], ['correct', '맞는'], ['wrong', '틀린'], ['different', '다른'], ['same', '같은'],
  ['early', '이른'], ['late', '늦은'], ['real', '진짜의'], ['great', '굉장한'], ['wonderful', '멋진'], ['careful', '조심하는'],
  // 물건
  ['clock', '시계(벽·탁상)'], ['phone', '전화'], ['computer', '컴퓨터'], ['television', '텔레비전'], ['radio', '라디오'], ['camera', '카메라'],
  ['key', '열쇠'], ['door', '문'], ['window', '창문'], ['wall', '벽'], ['floor', '바닥'], ['roof', '지붕'],
  ['stairs', '계단'], ['bed', '침대'], ['table', '탁자'], ['sofa', '소파'], ['lamp', '전등'], ['mirror', '거울'],
  ['towel', '수건'], ['soap', '비누'], ['toothbrush', '칫솔'], ['umbrella', '우산'], ['glasses', '안경'], ['hat', '모자'],
  ['shirt', '셔츠'], ['pants', '바지'], ['skirt', '치마'], ['dress', '원피스'], ['shoes', '신발'], ['socks', '양말'],
  ['coat', '외투'], ['gloves', '장갑'], ['scarf', '목도리'], ['pocket', '주머니'], ['wallet', '지갑'], ['ring', '반지'],
  ['box', '상자'], ['bottle', '병'], ['cup', '컵'], ['plate', '접시'], ['bowl', '그릇'], ['spoon', '숟가락'],
  ['fork', '포크'], ['knife', '칼'], ['map', '지도'], ['ticket', '표'], ['money', '돈'], ['coin', '동전'],
  ['picture', '그림'], ['gift', '선물'], ['toy', '장난감'], ['ball', '공'], ['kite', '연'], ['balloon', '풍선'],
  ['doll', '인형'], ['bicycle', '자전거'], ['car', '자동차'], ['bus', '버스'], ['train', '기차'], ['subway', '지하철'],
  ['taxi', '택시'], ['airplane', '비행기'], ['ship', '배(선박)'], ['boat', '보트'], ['truck', '트럭'], ['road', '길'],
  ['traffic light', '신호등'], ['robot', '로봇'], ['letter', '편지'], ['newspaper', '신문'],
  // 운동·취미
  ['soccer', '축구'], ['baseball', '야구'], ['basketball', '농구'], ['volleyball', '배구'], ['tennis', '테니스'], ['badminton', '배드민턴'],
  ['skiing', '스키'], ['skating', '스케이트'], ['hiking', '등산'], ['camping', '캠핑'], ['fishing', '낚시'], ['game', '게임'],
  ['movie', '영화'], ['song', '노래(곡)'], ['dance party', '무도회'], ['hobby', '취미'], ['sport', '운동'], ['team', '팀'],
  ['race', '경주'], ['coach', '코치'], ['player', '선수'],
  // 그 밖
  ['idea', '생각(아이디어)'], ['problem', '문제(어려움)'], ['dream', '꿈'], ['wish', '소원'], ['story', '이야기'], ['secret', '비밀'],
  ['danger', '위험(명사)'], ['peace', '평화'], ['war', '전쟁'], ['health', '건강'], ['life', '삶'], ['world', '세계'],
  ['environment', '환경'], ['culture', '문화'], ['tradition', '전통'], ['festival', '축제'], ['language', '언어'], ['word', '단어'],
  ['sentence', '문장'], ['message', '메시지'], ['news', '소식'], ['price', '가격'], ['size', '크기'], ['shape', '모양'],
  ['number', '숫자'], ['left', '왼쪽'], ['right', '오른쪽'], ['up', '위로'], ['down', '아래로'], ['front', '앞'],
  ['behind', '~의 뒤에'], ['next to', '~의 옆에'], ['between', '~ 사이에'], ['near', '가까운'], ['far', '먼'], ['inside', '안에'],
  ['outside', '밖에'], ['under', '~ 아래에'], ['east', '동쪽'], ['west', '서쪽'], ['south', '남쪽'], ['north', '북쪽'],
  ['straight', '곧장'], ['corner', '모퉁이'], ['center', '중앙'], ['what', '무엇'], ['who', '누구'], ['when', '언제'],
  ['where', '어디'], ['why', '왜'], ['how', '어떻게'], ['which', '어느 것'],
]

// ✏️ 여기에 단어를 더 넣으세요: ['english', '뜻']
const EXTRA: [string, string][] = [
  // 선생님이 준 단어 (1) 가족·사람
  ['relative', '친척'], ['teenager', '청소년'], ['adult', '어른'], ['elderly', '노인'], ['neighbor', '이웃'],
  ['guest', '손님'], ['host', '주최자'], ['leader', '리더'], ['member', '회원'], ['opponent', '상대'],
  // (2) 동물
  ['dolphin', '돌고래'], ['kangaroo', '캥거루'], ['chameleon', '카멜레온'], ['flamingo', '플라밍고'], ['gorilla', '고릴라'],
  ['leopard', '표범'], ['rhinoceros', '코뿔소'], ['cobra', '코브라'], ['starfish', '불가사리'], ['scorpion', '전갈'],
  // (3) 음식
  ['grape', '포도'], ['pineapple', '파인애플'], ['watermelon', '수박'], ['shrimp', '새우'], ['lobster', '바닷가재'],
  ['sushi', '초밥'], ['spaghetti', '스파게티'], ['dumpling', '만두'], ['vinegar', '식초'], ['mustard', '머스터드'],
  // (4) 자연·환경
  ['continent', '대륙'], ['climate', '기후'], ['pollution', '오염'], ['atmosphere', '대기'], ['earthquake', '지진'],
  ['tsunami', '쓰나미'], ['hurricane', '허리케인'], ['landslide', '산사태'], ['glacier', '빙하'], ['wildfire', '산불'],
  // (5) 숫자·시간
  ['twenty-first', '21번째'], ['thirtieth', '30번째'], ['century', '세기'], ['decade', '10년'], ['schedule', '일정'],
  ['deadline', '마감일'], ['appointment', '약속'], ['moment', '순간'], ['forever', '영원히'], ['temporary', '일시적인'],
  // (6) 학교·학습
  ['education', '교육'], ['subject', '과목'], ['literature', '문학'], ['grammar', '문법'], ['vocabulary', '어휘'],
  ['mathematics', '수학(교과 이름)'], ['biology', '생물학'], ['chemistry', '화학'], ['physics', '물리학'], ['geography', '지리'],
  // (7) 동작·상태
  ['whisper', '속삭이다'], ['shout', '외치다'], ['argue', '논쟁하다'], ['negotiate', '협상하다'], ['persuade', '설득하다'],
  ['apologize', '사과하다'], ['hesitate', '주저하다'], ['concentrate', '집중하다'], ['observe', '관찰하다'], ['investigate', '조사하다'],
  // (8) 감정·성격
  ['confident', '자신감 있는'], ['patient', '참을성 있는'], ['ambitious', '야망 있는'], ['creative', '창의적인'], ['generous', '관대한'],
  ['stubborn', '고집 센'], ['selfish', '이기적인'], ['sensitive', '민감한'], ['reliable', '믿을 수 있는'], ['mysterious', '신비로운'],
  // (9) 직업·사회
  ['engineer', '엔지니어'], ['scientist', '과학자'], ['director', '감독'], ['musician', '음악가'], ['journalist', '기자'],
  ['politician', '정치인'], ['entrepreneur', '사업가'], ['designer', '디자이너'], ['psychologist', '심리학자'], ['translator', '번역가'],
  // (10) 교통수단·장소
  ['subway', '지하철'], ['highway', '고속도로'], ['ferry', '여객선'], ['spaceship', '우주선'], ['terminal', '터미널'],
  ['embassy', '대사관'], ['skyscraper', '고층 빌딩'], ['warehouse', '창고'], ['stadium', '경기장'], ['amusement park', '놀이공원'],
]

export type Word = { en: string; ko: string }

// 영어·뜻이 겹치는 것은 빼고 합친다
export const WORDS: Word[] = (() => {
  const seenEn = new Set<string>()
  const seenKo = new Set<string>()
  const out: Word[] = []
  for (const [en, ko] of [...CORE, ...EXTRA]) {
    const e = en.trim().toLowerCase()
    const k = ko.trim()
    if (!e || !k || seenEn.has(e) || seenKo.has(k)) continue
    seenEn.add(e)
    seenKo.add(k)
    out.push({ en: en.trim(), ko: k })
  }
  return out
})()
