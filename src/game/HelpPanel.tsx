import { useState } from 'react'
import { ANIMAL_MAP, CROP_MAP, HELP_PER_DAY, HELP_REWARD, QUIZ_REWARD } from './economy'
import { useVillage } from './store'
import { dateKey } from './lunch'
import { normAnimal, normCrop } from './farm'
import { sendFarmHelp } from './cloud'
import { starText } from './FarmPanel'

// 친구 마을에서 친구의 밭/우리를 눌렀을 때 — 문제를 맞히면 친구 농장을 도와준다 (시들지 않게)
export function HelpPanel() {
  const key = useVillage((s) => s.helpTarget)
  const visiting = useVillage((s) => s.visiting)
  const close = useVillage((s) => s.closeHelp)
  const [busy, setBusy] = useState(false)
  useVillage((s) => s.items.find((i) => i.type === 'house')?.help) // 도운 기록이 바뀌면 다시 그린다
  if (!key || !visiting) return null
  const item = visiting.items.find((i) => i.key === key)
  if (!item) return null
  const today = dateKey()
  const owner = visiting.name

  let title = ''
  let what = ''
  let stars = 0
  if (item.crop) {
    const c = normCrop(item.crop, today)
    const def = CROP_MAP[c.seed]
    title = `${def?.emoji ?? '🌱'} ${owner}의 ${def?.label ?? '작물'}`
    what = '물을 줘서'
    stars = c.stars
  } else if (item.animal) {
    const a = normAnimal(item.animal, today)
    const def = ANIMAL_MAP[a.species]
    title = `${def?.emoji ?? '🐣'} ${owner}의 ${def?.label ?? '동물'}`
    what = '먹이를 줘서'
    stars = a.stars
  } else {
    title = item.type === 'plot' ? `🟫 ${owner}의 빈 밭` : `🏠 ${owner}의 빈 우리`
  }
  const empty = !item.crop && !item.animal
  const block = empty ? null : useVillage.getState().helpBlock(owner)

  const help = () => {
    const st = useVillage.getState()
    const why = st.helpBlock(owner)
    if (why) {
      st.flash(why)
      return
    }
    st.askQuiz(
      () => {
        setBusy(true)
        void sendFarmHelp(owner, key).then((r) => {
          setBusy(false)
          const s2 = useVillage.getState()
          if (r === 'ok') {
            s2.noteHelp(owner)
            s2.flash(`${owner}의 농장을 도와줬어요! 🤝 (${owner}도 🌰${HELP_REWARD})`)
            s2.closeHelp()
          } else if (r === 'dup') {
            s2.noteHelp(owner)
            s2.flash('오늘은 이미 이 친구를 도와줬어요')
          } else if (r === 'missing') s2.flash('친구 돕기는 준비 중이에요 🛠️')
          else s2.flash('서버와 연결이 불안해요. 잠시 뒤에 다시 해 봐요')
        })
      },
      () => {
        const s2 = useVillage.getState()
        s2.noteHelp(owner) // 틀리면 오늘은 이 친구를 다시 도울 수 없다
        s2.flash('틀렸어요… 오늘은 이 친구를 돕지 못했어요')
      },
      `help:${owner}:${today}`,
    )
  }

  return (
    <div className="farm-overlay" onPointerDown={(e) => e.target === e.currentTarget && close()}>
      <div className="farm-card">
        <button type="button" className="farm-x" onClick={close} aria-label="닫기">
          ✕
        </button>
        <h3>
          {title} {!empty && <span className="farm-stars">{starText(stars)}</span>}
        </h3>
        {empty ? (
          <p className="farm-note">아직 아무것도 없어요.</p>
        ) : (
          <>
            <p className="farm-note">
              🤝 문제를 맞히면 친구 대신 {what} 오늘 시들지 않게 지켜 줘요.
              <br />
              나는 🌰{QUIZ_REWARD}, {owner}도 🌰{HELP_REWARD}를 받아요. (하루에 {HELP_PER_DAY}명까지, 친구마다 하루 한 번)
              <br />
              ❌ 틀리면 오늘은 이 친구를 도울 수 없어요.
            </p>
            {block && <div className="farm-wilt">{block}</div>}
            <div className="farm-actions">
              <button type="button" className="primary" disabled={!!block || busy} onClick={help}>
                🤝 도와주기 · 문제 풀기
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
