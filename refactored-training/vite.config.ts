import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import path from 'path'
import fs from 'fs'

const arcgisAssetsDir = path.resolve(import.meta.dirname, 'node_modules/@arcgis/core/assets')

const mimeMap: Record<string, string> = {
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.pbf': 'application/x-protobuf',
}

// https://vite.dev/config/
export default defineConfig({
  base: '/refactored-training/', // <-- THIS IS IMPORTANT!
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/@arcgis/core/assets',
          dest: '',
        },
      ],
    }),
    {
      name: 'arcgis-assets-dev',
      configureServer(server) {
        server.middlewares.use('/refactored-training/assets', (req, res, next) => {
          const filePath = path.join(arcgisAssetsDir, decodeURIComponent(req.url ?? '/'))
          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            const ext = path.extname(filePath)
            res.setHeader('Content-Type', mimeMap[ext] ?? 'application/octet-stream')
            fs.createReadStream(filePath).pipe(res)
          } else {
            next()
          }
        })
      },
    },
  ],
})