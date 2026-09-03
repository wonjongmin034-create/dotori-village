import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // 같은 와이파이의 태블릿·크롬북에서 접속 가능하게 (0.0.0.0 바인딩)
  },
})
