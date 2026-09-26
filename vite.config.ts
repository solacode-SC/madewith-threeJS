import fs from 'node:fs'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

const WORLD_SLUGS = [
  'blue-medina-road',
  'coastal-house',
  'island-world',
  'palm-village-maze',
  'santorini-sea-maze',
  'sunlit-adobe-maze',
]

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

function serveThreeJsWorldsPlugin(): Plugin {
  const createMiddleware = (rootDir: string) => {
    return (req: { url?: string }, res: {
      statusCode: number
      setHeader: (name: string, value: string) => void
      end: (data?: string | Buffer) => void
    }, next: () => void) => {
      if (!req.url) return next()
      const cleanUrl = req.url.split('?')[0]
      if (!cleanUrl.startsWith('/worlds/')) return next()

      const segments = cleanUrl.slice('/worlds/'.length).split('/').filter(Boolean)
      const slug = segments[0]
      if (!slug || !WORLD_SLUGS.includes(slug)) return next()

      // Redirect /worlds/<slug> to /worlds/<slug>/ so relative paths resolve cleanly
      if (cleanUrl === `/worlds/${slug}`) {
        res.statusCode = 302
        res.setHeader('Location', `/worlds/${slug}/`)
        res.end()
        return
      }

      const relPath = segments.slice(1).join('/') || 'index.html'
      const distDir = path.resolve(rootDir, slug, 'dist')
      const targetFile = path.resolve(distDir, relPath)

      // Guard against directory traversal
      if (!targetFile.startsWith(distDir)) {
        res.statusCode = 403
        res.end('Forbidden')
        return
      }

      let fileToServe = targetFile
      if (!fs.existsSync(fileToServe) || fs.statSync(fileToServe).isDirectory()) {
        fileToServe = path.resolve(distDir, 'index.html')
      }

      if (!fs.existsSync(fileToServe)) {
        res.statusCode = 404
        res.end(`World build not found for ${slug}. Run "npm run build:worlds".`)
        return
      }

      const ext = path.extname(fileToServe).toLowerCase()
      const mime = MIME_TYPES[ext] || 'application/octet-stream'
      res.setHeader('Content-Type', mime)

      if (ext === '.html') {
        let html = fs.readFileSync(fileToServe, 'utf-8')
        // Rewrite root-relative asset references (/assets/...) to relative ./assets/...
        html = html
          .replace(/(src|href)="\/assets\//g, `$1="/worlds/${slug}/assets/`)
          .replace(/(src|href)="\/favicon\./g, `$1="/worlds/${slug}/favicon.`)
          .replace(/(src|href)="\/icons\./g, `$1="/worlds/${slug}/icons.`)
        res.statusCode = 200
        res.end(html)
        return
      }

      res.statusCode = 200
      res.end(fs.readFileSync(fileToServe))
    }
  }

  return {
    name: 'serve-threejs-worlds',
    configureServer(server) {
      server.middlewares.use(createMiddleware(process.cwd()))
    },
    configurePreviewServer(server) {
      server.middlewares.use(createMiddleware(process.cwd()))
    },
  }
}

export default defineConfig({
  plugins: [react(), serveThreeJsWorldsPlugin()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
  },
})
