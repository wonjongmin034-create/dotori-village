// 도토리 탑 상자 문제 — 국어(보통·어려움)와 영어(문장 빈칸·짧은 글 읽기).
// 보기 3개는 모두 오답이다. (GRADE_BANK 의 국어 문제에 더해서 쓴다)

export type KoQ = { lv: 2 | 3; q: string; a: string; w: [string, string, string] }

export const TOWER_KO: KoQ[] = [
  /* ───────── 보통 ───────── */
  { lv: 2, q: '"넉넉하다"의 반대말은?', a: '부족하다', w: ['여유롭다', '푸짐하다', '풍부하다'] },
  { lv: 2, q: '속담 "가는 말이 고와야 오는 말이 곱다"의 뜻과 가장 가까운 것은?', a: '내가 남에게 좋게 해야 남도 나에게 좋게 한다', w: ['말을 많이 하면 실수한다', '말은 빨리 전해진다', '말조심을 하면 손해를 본다'] },
  { lv: 2, q: '맞춤법이 바른 낱말은?', a: '금세', w: ['금새', '금셰', '근세'] },
  { lv: 2, q: '맞춤법이 바른 낱말은?', a: '설거지', w: ['설겆이', '설거찌', '설걷이'] },
  { lv: 2, q: '"할머니께서 밥을 (   )."에 알맞은 낱말은?', a: '잡수신다', w: ['먹는다', '먹었다요', '드린다'] },
  { lv: 2, q: '"발이 넓다"의 뜻은?', a: '아는 사람이 많다', w: ['발이 크다', '잘 걷는다', '달리기가 빠르다'] },
  { lv: 2, q: '"입이 무겁다"의 뜻은?', a: '말을 함부로 하지 않는다', w: ['음식을 적게 먹는다', '목소리가 크다', '말이 느리다'] },
  { lv: 2, q: '"예쁜 꽃이 피었다."에서 "꽃"을 꾸며 주는 말은?', a: '예쁜', w: ['꽃이', '피었다', '꽃'] },
  { lv: 2, q: '띄어쓰기가 바른 것은?', a: '할 수 있다', w: ['할수 있다', '할 수있다', '할수있다'] },
  { lv: 2, q: '"까닭"과 뜻이 비슷한 낱말은?', a: '이유', w: ['결과', '방법', '시간'] },
  { lv: 2, q: '"내일 (   )요."에 알맞은 낱말은?', a: '봬', w: ['뵈', '뵈어', '밴'] },
  { lv: 2, q: '"가람"은 무엇을 뜻하는 순우리말일까요?', a: '강', w: ['산', '바다', '구름'] },
  /* ───────── 어려움 ───────── */
  { lv: 3, q: '속담 "소 잃고 외양간 고친다"와 비슷한 뜻은?', a: '일이 잘못된 뒤에 후회해도 소용없다', w: ['일을 미리 준비한다', '작은 것도 아껴 쓴다', '남의 일에 끼어들지 않는다'] },
  { lv: 3, q: '"우물 안 개구리"의 뜻은?', a: '넓은 세상을 모르는 좁은 생각', w: ['아주 부지런한 사람', '조용히 살아가는 사람', '물을 좋아하는 사람'] },
  { lv: 3, q: '"일석이조"의 뜻은?', a: '한 가지 일로 두 가지 이익을 얻음', w: ['돌 하나로 집을 지음', '두 번 실패함', '둘이 힘을 합쳐도 어려움'] },
  { lv: 3, q: '"고진감래"의 뜻은?', a: '고생 끝에 즐거움이 옴', w: ['즐거움 끝에 슬픔이 옴', '가까운 길이 더 빠름', '쓴 약이 몸에 좋음'] },
  { lv: 3, q: '맞춤법이 틀린 낱말은?', a: '어의없다', w: ['어이없다', '희한하다', '오랜만'] },
  { lv: 3, q: '"귀담아듣다"의 뜻은?', a: '주의해서 잘 듣다', w: ['큰 소리로 듣다', '듣고 잊어버리다', '듣지 않고 넘기다'] },
  { lv: 3, q: '"내 마음은 호수요"처럼 "~은 ~이다"로 빗대어 표현하는 방법은?', a: '은유법', w: ['직유법', '의인법', '과장법'] },
  { lv: 3, q: '"별처럼 빛나는 눈"에 쓰인 표현 방법은?', a: '직유법', w: ['은유법', '의인법', '반복법'] },
  { lv: 3, q: '"바람이 나뭇가지와 속삭인다"에 쓰인 표현 방법은?', a: '의인법', w: ['직유법', '은유법', '과장법'] },
  { lv: 3, q: '"내가 할머니께 책을 (   )."에 알맞은 낱말은?', a: '드렸다', w: ['주셨다', '줬다', '받았다'] },
  { lv: 3, q: '"경청"의 뜻은?', a: '귀를 기울여 듣다', w: ['큰 소리로 말하다', '조용히 앉다', '글을 쓰다'] },
  { lv: 3, q: '"비가 와서 소풍이 취소되었다."에서 원인에 해당하는 부분은?', a: '비가 와서', w: ['소풍이', '취소되었다', '소풍이 취소되었다'] },
]

export type EnQ = { lv: 1 | 2 | 3; q: string; a: string; w: [string, string, string]; sub?: string }

export const TOWER_EN: EnQ[] = [
  /* ───────── 문장 빈칸 · 쉬움 ───────── */
  { lv: 1, q: 'I (   ) a student.', a: 'am', w: ['is', 'are', 'be'] },
  { lv: 1, q: 'She (   ) to school every day.', a: 'goes', w: ['go', 'going', 'gone'] },
  { lv: 1, q: 'They (   ) playing soccer now.', a: 'are', w: ['is', 'am', 'be'] },
  { lv: 1, q: 'This is (   ) apple.', a: 'an', w: ['a', 'some', 'two'] },
  { lv: 1, q: 'I have two (   ).', a: 'cats', w: ['cat', 'a cat', 'cates'] },
  { lv: 1, q: '(   ) is your name?', a: 'What', w: ['Where', 'Who', 'When'] },
  { lv: 1, q: 'He (   ) breakfast at seven every morning.', a: 'eats', w: ['eat', 'eating', 'eaten'] },
  { lv: 1, q: 'It is (   ) today. Take an umbrella.', a: 'rainy', w: ['sunny', 'hot', 'dry'] },
  /* ───────── 문장 빈칸 · 보통 ───────── */
  { lv: 2, q: 'She is (   ) than her brother.', a: 'taller', w: ['tall', 'tallest', 'more tall'] },
  { lv: 2, q: 'I (   ) my homework yesterday.', a: 'finished', w: ['finish', 'finishes', 'finishing'] },
  { lv: 2, q: 'There (   ) three books on the desk.', a: 'are', w: ['is', 'am', 'be'] },
  { lv: 2, q: 'He can (   ) very fast.', a: 'run', w: ['runs', 'ran', 'running'] },
  { lv: 2, q: 'We (   ) to the zoo last Sunday.', a: 'went', w: ['go', 'goes', 'going'] },
  { lv: 2, q: '(   ) do you go to school? — By bus.', a: 'How', w: ['What', 'Who', 'Why'] },
  { lv: 2, q: "I'm good (   ) swimming.", a: 'at', w: ['in', 'on', 'to'] },
  { lv: 2, q: 'Please (   ) quiet in the library.', a: 'be', w: ['is', 'are', 'being'] },
  { lv: 2, q: 'My birthday is (   ) May.', a: 'in', w: ['on', 'at', 'to'] },
  { lv: 2, q: 'She (   ) a book now.', a: 'is reading', w: ['reads', 'read', 'are reading'] },
  { lv: 2, q: 'How (   ) apples do you have?', a: 'many', w: ['much', 'long', 'old'] },
  /* ───────── 문장 빈칸 · 어려움 ───────── */
  { lv: 3, q: 'If it (   ) tomorrow, we will stay home.', a: 'rains', w: ['rain', 'will rain', 'rained'] },
  { lv: 3, q: 'I have lived here (   ) 2020.', a: 'since', w: ['for', 'from', 'during'] },
  { lv: 3, q: 'The book (   ) by many students.', a: 'is read', w: ['reads', 'read', 'is reading'] },
  { lv: 3, q: 'She asked me (   ) I liked music.', a: 'if', w: ['that', 'what', 'who'] },
  { lv: 3, q: 'He is the (   ) boy in our class.', a: 'smartest', w: ['smarter', 'most smart', 'smart'] },
  { lv: 3, q: 'I enjoy (   ) books.', a: 'reading', w: ['read', 'to read', 'reads'] },
  { lv: 3, q: 'She was tired, (   ) she went to bed early.', a: 'so', w: ['but', 'because', 'or'] },
  { lv: 3, q: "I'd like (   ) a doctor in the future.", a: 'to be', w: ['being', 'be', 'am'] },
  { lv: 3, q: "He didn't (   ) the answer.", a: 'know', w: ['knew', 'knows', 'known'] },
  { lv: 3, q: 'Each student (   ) a book.', a: 'has', w: ['have', 'having', 'are having'] },
  { lv: 3, q: 'The movie was so (   ) that I fell asleep.', a: 'boring', w: ['bored', 'bore', 'interested'] },
  /* ───────── 짧은 글 읽기 (어려움) ───────── */
  { lv: 3, sub: 'Tom gets up at 6 every day. He runs in the park for 30 minutes. Then he has breakfast.', q: 'What does Tom do after running?', a: 'He has breakfast.', w: ['He goes to school.', 'He gets up.', 'He watches TV.'] },
  { lv: 3, sub: 'Mina has a cat named Nabi. Nabi likes fish and sleeps all day.', q: 'What does Nabi like?', a: 'Fish', w: ['Milk', 'Meat', 'Rice'] },
  { lv: 3, sub: 'It was cold, so Jina wore a coat and gloves. She went out to play in the snow.', q: 'Why did Jina wear a coat?', a: 'Because it was cold.', w: ['Because she was hungry.', 'Because it was hot.', 'Because she was sleepy.'] },
  { lv: 3, sub: 'Our school has a library on the second floor. It opens at 9 and closes at 5.', q: 'When does the library close?', a: 'At 5', w: ['At 9', 'At 2', 'At 6'] },
  { lv: 3, sub: 'Sam wants to be a chef. He cooks dinner for his family every Sunday.', q: 'What does Sam want to be?', a: 'A chef', w: ['A doctor', 'A teacher', 'A singer'] },
  { lv: 3, sub: 'Yuri bought three pencils and two erasers. Each pencil costs 500 won.', q: 'How much did Yuri pay for the pencils?', a: '1,500 won', w: ['1,000 won', '2,000 won', '500 won'] },
]
