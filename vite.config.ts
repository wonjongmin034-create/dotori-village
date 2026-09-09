import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages 프로젝트 사이트 경로: https://<user>.github.io/dotori-village/
  base: '/dotori-village/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // 새 배포가 있으면 백그라운드로 받아서 자동 적용 (main.tsx에서 새로고침)
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,glb,gltf}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        // index.html은 항상 네트워크 먼저 (버전 밀림 방지)
        navigateFallback: null,
      },
      manifest: {
        name: '도토리 마을',
        short_name: '도토리 마을',
        description: '동물의 숲 스타일 학급운영 게임',
        start_url: '/dotori-village/',
        scope: '/dotori-village/',
        display: 'standalone',
        background_color: '#cfeef3',
        theme_color: '#3e9b4f',
        lang: 'ko',
        icons: [
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  server: {
    host: true, // 같은 와이파이의 태블릿·크롬북에서 접속 가능하게 (0.0.0.0 바인딩)
  },
})
