import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true
  },
  build: {
    rollupOptions: {
      external: ['https'], // 从客户端打包中排除 https 模块
      
    },
    outDir: 'dist',
    assetsDir: 'assets',
  }
});