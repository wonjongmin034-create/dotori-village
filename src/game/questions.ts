export type Subject = '국어' | '수학' | '사회' | '과학' | '영어'

export type Question = {
  id: string
  subject: Subject
  q: string
  choices: string[]
  answer: number // 정답 인덱스
  explain: string
}

export const SUBJECTS: Subject[] = ['국어', '수학', '사회', '과학', '영어']

// ⚠️ 초등 5학년 교육과정 기준 예시 문제은행입니다.
//    선생님이 주실 단원 자료로 이 배열만 교체·보강하면 됩니다.
//    id 는 바꾸지 마세요 — 선생님 대시보드의 오답 기록이 id 로 연결됩니다.
export const QUESTIONS: Question[] = [
  // ─────────────── 국어 ───────────────
  {
    id: 'ko1',
    subject: '국어',
    q: '관용 표현 "손이 크다"의 뜻으로 알맞은 것은?',
    choices: ['씀씀이가 후하다', '일을 잘한다', '키가 크다', '욕심이 많다'],
    answer: 0,
    explain: '"손이 크다"는 물건이나 재물의 씀씀이가 넉넉하고 크다는 뜻입니다.',
  },
  {
    id: 'ko2',
    subject: '국어',
    q: '"나는 결코 그 일을 ( )." 괄호에 알맞은 말은?',
    choices: ['했다', '하겠다', '하지 않았다', '할 것이다'],
    answer: 2,
    explain: '"결코"는 뒤에 "-지 않다"처럼 부정하는 말과 호응합니다.',
  },
  {
    id: 'ko3',
    subject: '국어',
    q: '높임 표현이 바르게 쓰인 문장은?',
    choices: [
      '할머니가 밥을 먹는다.',
      '할머니께서 진지를 드신다.',
      '할머니가 진지를 먹으신다.',
      '할머니께서 밥을 먹는다.',
    ],
    answer: 1,
    explain: '"할머니께서", "진지", "드신다"로 모두 높여야 바른 높임 표현입니다.',
  },
  {
    id: 'ko4',
    subject: '국어',
    q: '앞뒤 내용이 반대일 때 이어 주는 말로 알맞은 것은?',
    choices: ['그래서', '하지만', '그리고', '왜냐하면'],
    answer: 1,
    explain: '반대되는 내용을 이을 때는 "하지만", "그러나"를 씁니다.',
  },
  {
    id: 'ko5',
    subject: '국어',
    q: '"풋사과"에서 "풋-"이 더해 주는 뜻은?',
    choices: ['덜 익은', '아주 큰', '맛이 단', '새로 나온'],
    answer: 0,
    explain: '"풋-"은 "덜 익은"의 뜻을 더하는 말입니다. (예: 풋고추, 풋열매)',
  },
  {
    id: 'ko6',
    subject: '국어',
    q: '주장하는 글에서 주장을 뒷받침하기 위해 드는 것은?',
    choices: ['근거', '제목', '인사말', '차례'],
    answer: 0,
    explain: '주장에는 그렇게 생각하는 까닭인 근거가 있어야 설득력이 생깁니다.',
  },
  {
    id: 'ko7',
    subject: '국어',
    q: '토론에서 상대편 주장이 잘못되었음을 밝히는 말하기는?',
    choices: ['반론', '소개', '요약', '낭독'],
    answer: 0,
    explain: '상대 주장의 문제점을 근거를 들어 반박하는 것을 반론이라고 합니다.',
  },
  {
    id: 'ko8',
    subject: '국어',
    q: '주장하는 글의 짜임으로 알맞은 것은?',
    choices: [
      '처음 - 가운데 - 끝',
      '서론 - 본론 - 결론',
      '원인 - 결과',
      '질문 - 대답',
    ],
    answer: 1,
    explain: '주장하는 글은 보통 서론(문제 제기) - 본론(주장과 근거) - 결론으로 씁니다.',
  },
  {
    id: 'ko9',
    subject: '국어',
    q: '"우물을 파도 한 우물을 파라"라는 속담의 뜻은?',
    choices: [
      '여러 일을 한꺼번에 하라',
      '한 가지 일을 끝까지 꾸준히 하라',
      '깊이 생각하지 말라',
      '남을 따라 하라',
    ],
    answer: 1,
    explain: '한 가지 일을 끝까지 하여야 성공할 수 있다는 뜻입니다.',
  },
  {
    id: 'ko10',
    subject: '국어',
    q: '낱말 "옹기종기"가 나타내는 모양은?',
    choices: [
      '크고 작은 것들이 정답게 모여 있는 모양',
      '한 줄로 곧게 선 모양',
      '빠르게 움직이는 모양',
      '텅 비어 있는 모양',
    ],
    answer: 0,
    explain: '"옹기종기"는 크기가 고르지 않은 것들이 정겹게 모여 있는 모양입니다.',
  },

  // ─────────────── 수학 ───────────────
  {
    id: 'ma1',
    subject: '수학',
    q: '15 − (3 + 4) × 2 를 계산하면?',
    choices: ['1', '16', '4', '20'],
    answer: 0,
    explain: '괄호 먼저(3+4=7), 곱셈(7×2=14), 마지막에 15−14=1.',
  },
  {
    id: 'ma2',
    subject: '수학',
    q: '24와 36의 최대공약수는?',
    choices: ['6', '12', '18', '4'],
    answer: 1,
    explain: '24=2³×3, 36=2²×3². 공통은 2²×3=12.',
  },
  {
    id: 'ma3',
    subject: '수학',
    q: '4와 6의 최소공배수는?',
    choices: ['24', '10', '12', '2'],
    answer: 2,
    explain: '4의 배수 4,8,12… 6의 배수 6,12… 가장 작은 공배수는 12.',
  },
  {
    id: 'ma4',
    subject: '수학',
    q: '2/3 와 3/4 를 통분하면?',
    choices: ['8/12 과 9/12', '2/12 과 3/12', '6/7 과 6/7', '4/6 과 6/8'],
    answer: 0,
    explain: '분모를 12로 맞추면 2/3=8/12, 3/4=9/12.',
  },
  {
    id: 'ma5',
    subject: '수학',
    q: '5/6 − 1/3 의 값은?',
    choices: ['1/2', '4/3', '1/6', '2/3'],
    answer: 0,
    explain: '1/3=2/6 이므로 5/6−2/6=3/6=1/2.',
  },
  {
    id: 'ma6',
    subject: '수학',
    q: '밑변 8cm, 높이 5cm인 평행사변형의 넓이는?',
    choices: ['13cm²', '20cm²', '40cm²', '26cm²'],
    answer: 2,
    explain: '평행사변형 넓이 = 밑변 × 높이 = 8 × 5 = 40cm².',
  },
  {
    id: 'ma7',
    subject: '수학',
    q: '밑변 6cm, 높이 4cm인 삼각형의 넓이는?',
    choices: ['24cm²', '12cm²', '10cm²', '20cm²'],
    answer: 1,
    explain: '삼각형 넓이 = 밑변 × 높이 ÷ 2 = 6 × 4 ÷ 2 = 12cm².',
  },
  {
    id: 'ma8',
    subject: '수학',
    q: '3/4 × 8 의 값은?',
    choices: ['6', '11', '24', '3/32'],
    answer: 0,
    explain: '3/4 × 8 = 24/4 = 6.',
  },
  {
    id: 'ma9',
    subject: '수학',
    q: '1.2 × 0.5 의 값은?',
    choices: ['6', '0.6', '0.06', '1.7'],
    answer: 1,
    explain: '12 × 5 = 60, 소수점 아래 자리 수의 합이 2 → 0.60 = 0.6.',
  },
  {
    id: 'ma10',
    subject: '수학',
    q: '직육면체의 면은 모두 몇 개인가요?',
    choices: ['4개', '6개', '8개', '12개'],
    answer: 1,
    explain: '직육면체는 면 6개, 모서리 12개, 꼭짓점 8개입니다.',
  },

  // ─────────────── 사회 ───────────────
  {
    id: 'so1',
    subject: '사회',
    q: '우리나라의 위치를 바르게 설명한 것은?',
    choices: [
      '아시아 대륙의 동쪽, 북반구에 있다',
      '아프리카 대륙의 서쪽에 있다',
      '남반구에 있다',
      '유럽 대륙 안에 있다',
    ],
    answer: 0,
    explain: '우리나라는 아시아 대륙 동쪽에 있으며 적도 위쪽인 북반구에 있습니다.',
  },
  {
    id: 'so2',
    subject: '사회',
    q: '우리나라 영토에서 가장 동쪽 끝에 있는 섬은?',
    choices: ['제주도', '독도', '울릉도', '마라도'],
    answer: 1,
    explain: '우리나라 영토의 동쪽 끝은 독도입니다.',
  },
  {
    id: 'so3',
    subject: '사회',
    q: '법을 만드는 일을 하는 국가 기관은?',
    choices: ['법원', '국회', '정부', '경찰서'],
    answer: 1,
    explain: '국회는 법을 만들고 고치며 나라 살림을 살펴봅니다.',
  },
  {
    id: 'so4',
    subject: '사회',
    q: '법에 따라 재판을 하여 다툼을 해결하는 기관은?',
    choices: ['국회', '정부', '법원', '방송국'],
    answer: 2,
    explain: '법원은 법에 따라 재판하여 옳고 그름을 가립니다.',
  },
  {
    id: 'so5',
    subject: '사회',
    q: '한 나라의 최고 법으로, 국민의 권리와 국가 조직을 정한 것은?',
    choices: ['헌법', '조례', '규칙', '약속'],
    answer: 0,
    explain: '헌법은 나라에서 가장 높은 법으로 다른 모든 법의 바탕이 됩니다.',
  },
  {
    id: 'so6',
    subject: '사회',
    q: '삼권분립에서 나누는 세 가지 권력이 아닌 것은?',
    choices: ['입법', '행정', '사법', '언론'],
    answer: 3,
    explain: '삼권분립은 입법(국회) · 행정(정부) · 사법(법원)으로 권력을 나눕니다.',
  },
  {
    id: 'so7',
    subject: '사회',
    q: '고조선을 세웠다고 전해지는 인물은?',
    choices: ['단군왕검', '주몽', '박혁거세', '왕건'],
    answer: 0,
    explain: '단군왕검이 우리 역사 최초의 국가인 고조선을 세웠다고 전해집니다.',
  },
  {
    id: 'so8',
    subject: '사회',
    q: '1392년에 조선을 세운 인물은?',
    choices: ['이성계', '세종대왕', '광개토대왕', '김유신'],
    answer: 0,
    explain: '이성계(태조)가 고려를 이어 조선을 세웠습니다.',
  },
  {
    id: 'so9',
    subject: '사회',
    q: '우리나라 지형의 특징으로 알맞은 것은?',
    choices: [
      '동쪽이 높고 서쪽이 낮다',
      '서쪽이 높고 동쪽이 낮다',
      '남북이 모두 평야이다',
      '전 국토가 사막이다',
    ],
    answer: 0,
    explain: '동쪽에 높은 산맥이 많아 동고서저 지형이며, 큰 강은 대부분 서쪽으로 흘러갑니다.',
  },
  {
    id: 'so10',
    subject: '사회',
    q: '"저출산·고령화"가 뜻하는 것은?',
    choices: [
      '태어나는 아이가 적고 노인 인구 비율이 높아지는 것',
      '도시로 사람이 몰리는 것',
      '외국인이 늘어나는 것',
      '농사짓는 사람이 많아지는 것',
    ],
    answer: 0,
    explain: '아이는 적게 태어나고(저출산) 전체에서 노인이 차지하는 비율이 높아지는(고령화) 현상입니다.',
  },

  // ─────────────── 과학 ───────────────
  {
    id: 'sc1',
    subject: '과학',
    q: '온도가 다른 두 물체가 맞닿아 있을 때 열의 이동 방향은?',
    choices: [
      '온도가 높은 쪽에서 낮은 쪽으로',
      '온도가 낮은 쪽에서 높은 쪽으로',
      '이동하지 않는다',
      '무게가 무거운 쪽으로',
    ],
    answer: 0,
    explain: '열은 항상 온도가 높은 물체에서 낮은 물체로 이동하며, 두 물체의 온도는 같아집니다.',
  },
  {
    id: 'sc2',
    subject: '과학',
    q: '태양계 행성 중 크기가 가장 큰 행성은?',
    choices: ['지구', '화성', '목성', '수성'],
    answer: 2,
    explain: '목성은 태양계에서 가장 큰 행성입니다.',
  },
  {
    id: 'sc3',
    subject: '과학',
    q: '밤하늘의 별자리가 계절에 따라 달라 보이는 까닭은?',
    choices: [
      '지구가 태양 주위를 돌기 때문',
      '별이 사라지기 때문',
      '달이 커지기 때문',
      '별자리가 새로 생기기 때문',
    ],
    answer: 0,
    explain: '지구가 태양 주위를 공전하여 계절마다 밤에 보이는 하늘의 방향이 달라집니다.',
  },
  {
    id: 'sc4',
    subject: '과학',
    q: '소금이 물에 녹아 소금물이 될 때, 녹는 물질인 소금을 무엇이라 하나요?',
    choices: ['용매', '용질', '용액', '앙금'],
    answer: 1,
    explain: '녹는 물질은 용질(소금), 녹이는 물질은 용매(물), 골고루 섞인 것은 용액입니다.',
  },
  {
    id: 'sc5',
    subject: '과학',
    q: '곰팡이와 버섯이 속하는 생물 무리는?',
    choices: ['균류', '곤충', '식물', '세균'],
    answer: 0,
    explain: '곰팡이·버섯은 균류로, 스스로 양분을 만들지 못하고 죽은 생물 등에서 양분을 얻습니다.',
  },
  {
    id: 'sc6',
    subject: '과학',
    q: '짚신벌레, 해캄과 같이 동물·식물·균류로 딱 나누기 어려운 아주 작은 생물은?',
    choices: ['원생생물', '포유류', '양서류', '이끼'],
    answer: 0,
    explain: '짚신벌레·해캄 등은 원생생물로, 주로 물이 고인 곳에서 삽니다.',
  },
  {
    id: 'sc7',
    subject: '과학',
    q: '같은 거리를 이동할 때 물체의 빠르기를 바르게 비교한 것은?',
    choices: [
      '걸린 시간이 짧을수록 빠르다',
      '걸린 시간이 길수록 빠르다',
      '무거울수록 빠르다',
      '색이 진할수록 빠르다',
    ],
    answer: 0,
    explain: '같은 거리라면 시간이 적게 걸린 물체가 더 빠릅니다.',
  },
  {
    id: 'sc8',
    subject: '과학',
    q: '푸른색 리트머스 종이를 붉게 변하게 하는 용액은?',
    choices: ['산성 용액', '염기성 용액', '중성 용액', '기름'],
    answer: 0,
    explain: '산성 용액은 푸른 리트머스 종이를 붉게 만듭니다. (예: 식초, 레몬즙)',
  },
  {
    id: 'sc9',
    subject: '과학',
    q: '다음 중 염기성 용액인 것은?',
    choices: ['식초', '레몬즙', '비눗물', '사이다'],
    answer: 2,
    explain: '비눗물·유리 세정제는 염기성입니다. 식초·레몬즙·사이다는 산성입니다.',
  },
  {
    id: 'sc10',
    subject: '과학',
    q: '공기 중 수증기가 차가운 물체에 닿아 물방울로 맺히는 현상은?',
    choices: ['증발', '응결', '연소', '용해'],
    answer: 1,
    explain: '수증기(기체)가 물(액체)로 바뀌는 것이 응결이며, 이슬·안개가 이렇게 생깁니다.',
  },

  // ─────────────── 영어 ───────────────
  {
    id: 'en1',
    subject: '영어',
    q: '"How old are you?" 에 알맞은 대답은?',
    choices: ["It's Monday.", "I'm eleven years old.", "It's sunny.", 'I like pizza.'],
    answer: 1,
    explain: '나이를 물었으므로 "나는 11살이야"라고 답합니다.',
  },
  {
    id: 'en2',
    subject: '영어',
    q: '"Can you swim?" 에 "응, 할 수 있어."라고 답하려면?',
    choices: ['Yes, I can.', 'No, I can.', 'Yes, I do.', "I'm swimming."],
    answer: 0,
    explain: 'Can 질문에는 can으로 답합니다. 긍정은 "Yes, I can."',
  },
  {
    id: 'en3',
    subject: '영어',
    q: '"What did you do yesterday?" 에 알맞은 대답은?',
    choices: ['I play soccer.', 'I played soccer.', 'I will play soccer.', 'I am soccer.'],
    answer: 1,
    explain: '"yesterday(어제)"는 과거이므로 played처럼 과거형으로 답합니다.',
  },
  {
    id: 'en4',
    subject: '영어',
    q: '"How much is this cap?" 는 무엇을 묻는 말인가요?',
    choices: ['날씨', '가격', '나이', '요일'],
    answer: 1,
    explain: 'How much ~? 는 값이 얼마인지(가격) 묻는 표현입니다.',
  },
  {
    id: 'en5',
    subject: '영어',
    q: '"Where is the library?" 에 알맞은 대답은?',
    choices: [
      "It's next to the bank.",
      "It's three o'clock.",
      "It's ten dollars.",
      'I am fine.',
    ],
    answer: 0,
    explain: '위치를 물었으므로 "은행 옆에 있어"처럼 장소로 답합니다.',
  },
  {
    id: 'en6',
    subject: '영어',
    q: '"I get up at seven." 의 뜻은?',
    choices: [
      '나는 7시에 일어난다',
      '나는 7시에 잔다',
      '나는 7살이다',
      '지금은 7시다',
    ],
    answer: 0,
    explain: 'get up = 일어나다, at seven = 7시에.',
  },
  {
    id: 'en7',
    subject: '영어',
    q: '"수요일"을 영어로 바르게 쓴 것은?',
    choices: ['Wednesday', 'Wensday', 'Wendsday', 'Wednsday'],
    answer: 0,
    explain: '수요일은 Wednesday 입니다. (d 다음에 nes)',
  },
  {
    id: 'en8',
    subject: '영어',
    q: '"Don\'t run here." 의 뜻은?',
    choices: [
      '여기서 뛰지 마세요',
      '여기서 뛰세요',
      '여기서 놀아요',
      '여기서 멈추세요',
    ],
    answer: 0,
    explain: "Don't + 동사 = ~하지 마세요. run = 뛰다.",
  },
  {
    id: 'en9',
    subject: '영어',
    q: '"She is taller than me." 의 뜻은?',
    choices: [
      '그녀는 나보다 키가 크다',
      '그녀는 나보다 키가 작다',
      '그녀는 나와 키가 같다',
      '그녀는 빠르다',
    ],
    answer: 0,
    explain: 'taller than ~ = ~보다 더 키가 큰.',
  },
  {
    id: 'en10',
    subject: '영어',
    q: '"May I use your pencil?" 는 무엇을 하는 표현인가요?',
    choices: ['허락 구하기', '길 묻기', '가격 묻기', '사과하기'],
    answer: 0,
    explain: 'May I ~? 는 "~해도 될까요?"라고 정중하게 허락을 구하는 표현입니다.',
  },
]

const BY_ID: Record<string, Question> = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]))
export function questionById(id: string): Question | undefined {
  return BY_ID[id]
}

export function randomQuestion(exclude?: Question): Question {
  const pool = exclude ? QUESTIONS.filter((x) => x !== exclude) : QUESTIONS
  return pool[Math.floor(Math.random() * pool.length)]
}

/* ---------- 오늘의 학습: 날짜로 정해지는 20문제 ---------- */
// 같은 반 학생은 같은 날 같은 문제를 푼다 (공정성 + 선생님이 반 전체 오답을 보기 쉬움).
// extra = 선생님이 그 반에 추가한 문제. 기본 문제와 같은 풀에서 뽑는다.

function hashStr(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

// 날짜+id 해시로 순서를 정한다 (문제를 더 넣어도 나머지 순서는 거의 안 바뀜).
function byDayHash(dayKey: string, pool: Question[]): Question[] {
  return pool
    .map((q) => ({ q, k: hashStr(`${dayKey}|${q.id}`) }))
    .sort((a, b) => a.k - b.k || (a.q.id < b.q.id ? -1 : 1))
    .map((x) => x.q)
}

// dayKey: "YYYY-MM-DD". 과목마다 perSubject개씩. 선생님 문제(extra)를 먼저 채우고
// 모자라는 만큼 기본 문제로 채운다 → 문제를 많이 넣을수록 우리 반 문제가 자주 나온다.
export function dailySet(dayKey: string, perSubject = 4, extra: Question[] = []): Question[] {
  const out: Question[] = []
  for (const sub of SUBJECTS) {
    const custom = byDayHash(
      dayKey,
      extra.filter((q) => q.subject === sub),
    )
    const bundled = byDayHash(
      dayKey,
      QUESTIONS.filter((q) => q.subject === sub),
    )
    const picked = [...custom, ...bundled].slice(0, perSubject)
    out.push(...picked)
  }
  return out
}

/* ---------- 선생님이 추가한 문제 다루기 ---------- */

const isSubject = (s: unknown): s is Subject => SUBJECTS.includes(s as Subject)

// DB(jsonb)나 붙여넣기에서 온 값을 안전한 Question[]로 거른다.
export function sanitizeQuestions(raw: unknown): Question[] {
  if (!Array.isArray(raw)) return []
  const out: Question[] = []
  for (const r of raw) {
    if (!r || typeof r !== 'object') continue
    const o = r as Record<string, unknown>
    const choices = Array.isArray(o.choices) ? o.choices.map((c) => String(c).trim()).filter(Boolean) : []
    const answer = typeof o.answer === 'number' ? o.answer : -1
    if (
      typeof o.id !== 'string' ||
      !isSubject(o.subject) ||
      typeof o.q !== 'string' ||
      !o.q.trim() ||
      choices.length < 2 ||
      answer < 0 ||
      answer >= choices.length
    )
      continue
    out.push({
      id: o.id,
      subject: o.subject,
      q: o.q.trim(),
      choices,
      answer,
      explain: typeof o.explain === 'string' ? o.explain.trim() : '',
    })
  }
  return out
}

export function newQuestionId(): string {
  return `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`
}

// 여러 문제를 한 번에 붙여넣기용 파서.
//   [수학] 3 + 4 = ?
//   - 5
//   * 7          ← * 가 정답
//   - 8
//   해설: 3 더하기 4는 7
//   (빈 줄로 문제 구분)
export function parseQuestions(text: string): { questions: Question[]; errors: number } {
  const blocks = text
    .replace(/\r/g, '')
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean)
  const questions: Question[] = []
  let errors = 0
  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean)
    const head = lines[0]?.match(/^\[(.+?)\]\s*(.*)$/)
    if (!head || !isSubject(head[1].trim())) {
      errors++
      continue
    }
    const subject = head[1].trim() as Subject
    let q = head[2].trim()
    const choices: string[] = []
    let answer = -1
    let explain = ''
    for (const line of lines.slice(1)) {
      const ex = line.match(/^(해설|설명)\s*[:：]\s*(.*)$/)
      if (ex) {
        explain = ex[2].trim()
        continue
      }
      const ch = line.match(/^([*\-•])\s*(.+)$/)
      if (ch) {
        if (ch[1] === '*') answer = choices.length
        choices.push(ch[2].trim())
        continue
      }
      // 보기 앞에 오는 추가 문제 줄
      if (choices.length === 0) q = `${q} ${line}`.trim()
    }
    if (!q || choices.length < 2 || answer < 0) {
      errors++
      continue
    }
    questions.push({ id: newQuestionId(), subject, q, choices, answer, explain })
  }
  return { questions, errors }
}
