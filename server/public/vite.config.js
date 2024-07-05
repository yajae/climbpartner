import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true
  },
  publicDir: 'public', 
  build: {
  
    rollupOptions: {
      external: ['https'], 
      
    }
  }
});