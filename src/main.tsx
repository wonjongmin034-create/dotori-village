import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'

// 새 버전이 배포되면 백그라운드로 받아 적용하고, 다음 기회에 새로고침.
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    updateSW(true).then(() => location.reload())
  },
  onRegisteredSW(_url, reg) {
    // 60초마다 새 버전 확인
    if (reg) setInterval(() => reg.update().catch(() => {}), 60_000)
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
