import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  // 大学サーバーのデプロイ先パスに合わせて設定します
  // 例: https://gms.gdi.jp/~knt416/MULoop/ → base: '/~knt416/MULoop/'
  base: './',
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
})
