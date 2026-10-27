import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // The dev server must bind to 0.0.0.0 inside Docker so the host browser
  // can reach it; locally it stays on localhost.
  const host = env.VITE_HOST || 'localhost'
  const port = Number(env.VITE_PORT || 5173)

  return {
    plugins: [react(), tailwindcss()],
    server: {
      host,
      port,
    },
    preview: {
      host,
      port,
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
  }
})
