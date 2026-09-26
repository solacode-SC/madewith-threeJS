import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import zlib from 'node:zlib'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST_DIR = path.resolve(__dirname, 'dist')
const PORT = Number(process.env.PORT || 3000)
const HOST = process.env.HOST || '0.0.0.0'

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

const COMPRESSIBLE_EXTS = new Set(['.html', '.js', '.mjs', '.css', '.json', '.svg'])

const server = http.createServer((req, res) => {
  try {
    const rawUrl = req.url || '/'
    const urlPath = decodeURIComponent(rawUrl.split('?')[0])

    // Health check endpoint for VPS load balancers / reverse proxies / Docker
    if (urlPath === '/healthz' || urlPath === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
      res.end(
        JSON.stringify({
          status: 'ok',
          service: 'madewith-threejs-platform',
          mode: 'production',
          uptime: Math.round(process.uptime()),
          timestamp: new Date().toISOString(),
        })
      )
      return
    }

    // Ensure trailing slash on /worlds/<slug> so relative ./assets/ resolve properly
    const worldMatch = urlPath.match(/^\/worlds\/([a-z0-9-]+)$/i)
    if (worldMatch) {
      res.writeHead(301, { Location: `/worlds/${worldMatch[1]}/` })
      res.end()
      return
    }

    let safeRelPath = urlPath.replace(/^\/+/, '')
    if (safeRelPath === '' || safeRelPath.endsWith('/')) {
      safeRelPath += 'index.html'
    }

    let filePath = path.resolve(DIST_DIR, safeRelPath)
    if (!filePath.startsWith(DIST_DIR)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('Forbidden')
      return
    }

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      // If inside a /worlds/<slug>/ route, fall back to that world's index.html
      const worldSubRoute = urlPath.match(/^\/worlds\/([a-z0-9-]+)\//i)
      if (worldSubRoute) {
        const candidate = path.resolve(DIST_DIR, 'worlds', worldSubRoute[1], 'index.html')
        if (fs.existsSync(candidate)) {
          filePath = candidate
        }
      } else {
        filePath = path.resolve(DIST_DIR, 'index.html')
      }
    }

    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('Not Found — Run "npm run build" before starting the production server.')
      return
    }

    const ext = path.extname(filePath).toLowerCase()
    const mimeType = MIME_TYPES[ext] || 'application/octet-stream'
    const isHashedAsset = urlPath.includes('/assets/')

    const headers = {
      'Content-Type': mimeType,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': isHashedAsset
        ? 'public, max-age=31536000, immutable'
        : 'public, max-age=0, must-revalidate',
    }

    const rawBuffer = fs.readFileSync(filePath)
    const acceptEncoding = req.headers['accept-encoding'] || ''

    if (COMPRESSIBLE_EXTS.has(ext) && rawBuffer.length > 1024) {
      if (acceptEncoding.includes('br')) {
        headers['Content-Encoding'] = 'br'
        res.writeHead(200, headers)
        res.end(zlib.brotliCompressSync(rawBuffer))
        return
      }
      if (acceptEncoding.includes('gzip')) {
        headers['Content-Encoding'] = 'gzip'
        res.writeHead(200, headers)
        res.end(zlib.gzipSync(rawBuffer))
        return
      }
    }

    res.writeHead(200, headers)
    res.end(rawBuffer)
  } catch (err) {
    console.error('Server error:', err)
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Internal Server Error')
  }
})

server.listen(PORT, HOST, () => {
  console.log(`\n╔══════════════════════════════════════════════════════════════════╗`)
  console.log(`║  ✦ MADEWITH-THREEJS — PRODUCTION VPS SERVER                      ║`)
  console.log(`╠══════════════════════════════════════════════════════════════════╣`)
  console.log(`║  • Local / VPS URL : http://${HOST}:${PORT}                         ║`)
  console.log(`║  • Health Check    : http://${HOST}:${PORT}/healthz                 ║`)
  console.log(`║  • Bundled Worlds  : 6 Interactive Three.js / R3F Experiences    ║`)
  console.log(`╚══════════════════════════════════════════════════════════════════╝\n`)
})
