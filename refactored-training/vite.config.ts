import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'


// https://vite.dev/config/
export default defineConfig({
  base: '/refactored-training/', // <-- THIS IS IMPORTANT!
  plugins: [react(), mkcert()],
  server: {
    https: true,
  },
})