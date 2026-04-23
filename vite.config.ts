import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'
import path from 'path'
import fs from 'fs'

// Serve the root-level img/ directory at /img/ during dev
// (In production, img/ sits alongside index.html on GitHub Pages)
function serveRootImg() {
  return {
    name: 'serve-root-img',
    configureServer(server: import('vite').ViteDevServer) {
      server.middlewares.use('/img', (req, res, next) => {
        const filePath = path.join(
          process.cwd(),
          'img',
          decodeURIComponent((req.url ?? '').replace(/^\//, '').split('?')[0]),
        )
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          const ext = path.extname(filePath).toLowerCase()
          const mime: Record<string, string> = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.webp': 'image/webp',
            '.avif': 'image/avif',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
          }
          res.setHeader('Content-Type', mime[ext] ?? 'application/octet-stream')
          fs.createReadStream(filePath).pipe(res)
        } else {
          next()
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), viteSingleFile(), serveRootImg()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
})
