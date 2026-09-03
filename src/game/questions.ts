export type Subject = '수학' | '영어' | '과학' | '사회'

export type Question = {
  subject: Subject
  q: string
  choices: string[]
  answer: number // 정답 인덱스
  explain: string
}

// ⚠️ 임시 문제은행 — 초등 5학년 수준 예시입니다.
//    선생님이 주실 단원 PDF 문제로 이 배열만 교체하면 됩니다.
export const QUESTIONS: Question[] = [
  // ── 수학 ──
  {
    subject: '수학',
    q: '3/8 + 2/8 은 얼마인가요?',
    choices: ['5/16', '5/8', '6/8', '1'],
    answer: 1,
    explain: '분모가 같으면 분자끼리 더합니다. 3 + 2 = 5 이므로 5/8.',
  },
  {
    subject: '수학',
    q: '12의 약수를 모두 고른 것은?',
    choices: ['1, 2, 3, 4, 6, 12', '2, 3, 6', '1, 12', '2, 4, 6, 8'],
    answer: 0,
    explain: '12를 나누어떨어지게 하는 수: 1, 2, 3, 4, 6, 12.',
  },
  {
    subject: '수학',
    q: '가로 6cm, 세로 4cm인 직사각형의 넓이는?',
    choices: ['10cm²', '20cm²', '24cm²', '48cm²'],
    answer: 2,
    explain: '직사각형 넓이 = 가로 × 세로 = 6 × 4 = 24cm².',
  },
  {
    subject: '수학',
    q: '0.6 × 3 의 값은?',
    choices: ['0.18', '1.8', '18', '0.9'],
    answer: 1,
    explain: '0.6을 3번 더하면 1.8입니다.',
  },
  {
    subject: '수학',
    q: '2, 4, 9, 5 의 평균은?',
    choices: ['4', '5', '6', '20'],
    answer: 1,
    explain: '(2 + 4 + 9 + 5) ÷ 4 = 20 ÷ 4 = 5.',
  },
  {
    subject: '수학',
    q: '삼각형의 세 각의 크기의 합은?',
    choices: ['90도', '180도', '270도', '360도'],
    answer: 1,
    explain: '어떤 삼각형이든 세 각의 합은 항상 180도입니다.',
  },

  // ── 영어 ──
  {
    subject: '영어',
    q: '"What time is it?" 에 알맞은 대답은?',
    choices: ["It's Monday.", "It's seven o'clock.", "It's sunny.", "I'm fine."],
    answer: 1,
    explain: '시간을 물었으므로 "7시야"라고 답합니다.',
  },
  {
    subject: '영어',
    q: '"나는 축구를 좋아해." 를 영어로?',
    choices: ['I like soccer.', 'I have soccer.', 'I am soccer.', 'You like soccer.'],
    answer: 0,
    explain: '좋아한다 = like. "I like soccer."',
  },
  {
    subject: '영어',
    q: '요일이 아닌 것은?',
    choices: ['Tuesday', 'Friday', 'August', 'Sunday'],
    answer: 2,
    explain: 'August(8월)는 달 이름입니다. 나머지는 요일.',
  },
  {
    subject: '영어',
    q: '"How much is it?" 는 무엇을 묻는 말인가요?',
    choices: ['날씨', '가격', '이름', '나이'],
    answer: 1,
    explain: 'How much is it? = 그거 얼마예요? (가격)',
  },
  {
    subject: '영어',
    q: '"turn left" 의 뜻은?',
    choices: ['왼쪽으로 도세요', '오른쪽으로 도세요', '멈추세요', '곧장 가세요'],
    answer: 0,
    explain: 'left = 왼쪽, turn = 돌다.',
  },

  // ── 과학 ──
  {
    subject: '과학',
    q: '태양계에서 태양과 가장 가까운 행성은?',
    choices: ['금성', '수성', '지구', '화성'],
    answer: 1,
    explain: '수성 → 금성 → 지구 → 화성 순서입니다.',
  },
  {
    subject: '과학',
    q: '물이 얼어서 얼음이 되는 것을 무엇이라 하나요?',
    choices: ['증발', '응결', '융해', '응고'],
    answer: 3,
    explain: '액체 → 고체로 변하는 것을 응고라고 합니다.',
  },
  {
    subject: '과학',
    q: '식물이 스스로 양분을 만드는 작용은?',
    choices: ['호흡', '광합성', '증산', '소화'],
    answer: 1,
    explain: '잎에서 햇빛을 받아 양분을 만드는 것이 광합성입니다.',
  },
  {
    subject: '과학',
    q: '소금이 물에 녹아 고르게 섞인 것을 무엇이라 하나요?',
    choices: ['용액', '혼합물 덩어리', '침전물', '결정'],
    answer: 0,
    explain: '녹는 물질(용질)이 녹이는 물질(용매)에 골고루 섞이면 용액입니다.',
  },
  {
    subject: '과학',
    q: '다음 중 도체(전기가 잘 통하는 물질)는?',
    choices: ['고무', '유리', '구리', '나무'],
    answer: 2,
    explain: '금속인 구리는 전기가 잘 통합니다.',
  },

  // ── 사회 ──
  {
    subject: '사회',
    q: '우리나라의 수도는 어디인가요?',
    choices: ['부산', '서울', '대전', '광주'],
    answer: 1,
    explain: '대한민국의 수도는 서울특별시입니다.',
  },
  {
    subject: '사회',
    q: '고조선을 세운 인물로 전해지는 사람은?',
    choices: ['단군왕검', '주몽', '박혁거세', '왕건'],
    answer: 0,
    explain: '단군왕검이 고조선을 세웠다고 전해집니다.',
  },
  {
    subject: '사회',
    q: '국가 권력을 입법·행정·사법으로 나누는 것을 무엇이라 하나요?',
    choices: ['삼권분립', '지방자치', '민주선거', '국민투표'],
    answer: 0,
    explain: '권력이 한 곳에 몰리지 않게 셋으로 나누는 것이 삼권분립입니다.',
  },
  {
    subject: '사회',
    q: '조선을 세운 왕은?',
    choices: ['이성계', '세종대왕', '광개토대왕', '김유신'],
    answer: 0,
    explain: '이성계(태조)가 1392년 조선을 세웠습니다.',
  },
  {
    subject: '사회',
    q: '삼면이 바다로 둘러싸인 우리나라 같은 땅의 모양을 무엇이라 하나요?',
    choices: ['섬', '반도', '대륙', '만'],
    answer: 1,
    explain: '삼면이 바다, 한 면이 육지에 이어진 땅을 반도라고 합니다.',
  },
]

export function randomQuestion(exclude?: Question): Question {
  const pool = exclude ? QUESTIONS.filter((x) => x !== exclude) : QUESTIONS
  return pool[Math.floor(Math.random() * pool.length)]
}
