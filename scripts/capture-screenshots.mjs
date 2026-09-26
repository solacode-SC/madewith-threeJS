import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const distDir = path.resolve(rootDir, 'dist')
const outDir = path.resolve(rootDir, 'public', 'screenshots')

const WORLD_SLUGS = [
  'blue-medina-road',
  'coastal-house',
  'island-world',
  'palm-village-maze',
  'santorini-sea-maze',
  'sunlit-adobe-maze',
]

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
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

const PORT = 4198
const CHROME_PATH = '/mnt/c/Program Files/Google/Chrome/Application/chrome.exe'
const WIN_TEMP_DIR = 'C:\\Users\\soel-code\\AppData\\Local\\Temp'
const WSL_TEMP_DIR = '/mnt/c/Users/soel-code/AppData/Local/Temp'

const INJECT_CLEAN_SCREENSHOT_STYLE = `
<style>
  /* Hide the initial loading screen overlay so screenshot captures the live rendered 3D project */
  main > div[style*="z-index: 50"],
  main > div[style*="z-index:50"] {
    display: none !important;
    opacity: 0 !important;
  }
</style>
`

async function main() {
  fs.mkdirSync(outDir, { recursive: true })

  const server = http.createServer((req, res) => {
    const rawUrl = req.url || '/'
    const urlPath = decodeURIComponent(rawUrl.split('?')[0])
    let safeRelPath = urlPath.replace(/^\/+/, '')
    if (safeRelPath === '' || safeRelPath.endsWith('/')) {
      safeRelPath += 'index.html'
    }

    let filePath = path.resolve(distDir, safeRelPath)
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      const worldSubRoute = urlPath.match(/^\/worlds\/([a-z0-9-]+)\//i)
      if (worldSubRoute) {
        filePath = path.resolve(distDir, 'worlds', worldSubRoute[1], 'index.html')
      } else {
        filePath = path.resolve(distDir, 'index.html')
      }
    }

    if (!fs.existsSync(filePath)) {
      res.writeHead(404)
      res.end('Not Found')
      return
    }

    const ext = path.extname(filePath).toLowerCase()
    const mime = MIME_TYPES[ext] || 'application/octet-stream'
    res.writeHead(200, { 'Content-Type': mime })

    if (ext === '.html') {
      let html = fs.readFileSync(filePath, 'utf-8')
      html = html.replace('</head>', `${INJECT_CLEAN_SCREENSHOT_STYLE}</head>`)
      res.end(html)
      return
    }

    res.end(fs.readFileSync(filePath))
  })

  await new Promise((resolve) => server.listen(PORT, '0.0.0.0', resolve))
  console.log(`Capture server listening on http://localhost:${PORT}`)

  try {
    for (const slug of WORLD_SLUGS) {
      const url = `http://localhost:${PORT}/worlds/${slug}/`
      const winShotPath = `${WIN_TEMP_DIR}\\shot-${slug}.png`
      const wslShotPath = `${WSL_TEMP_DIR}/shot-${slug}.png`
      const destPath = path.join(outDir, `${slug}.png`)

      console.log(`Capturing real 3D screenshot for ${slug} ...`)
      execFileSync(
        CHROME_PATH,
        [
          '--headless=new',
          '--disable-gpu-sandbox',
          '--enable-webgl',
          '--ignore-gpu-blocklist',
          '--force-device-scale-factor=1',
          '--hide-scrollbars',
          '--window-size=1600,1000',
          '--virtual-time-budget=6500',
          `--screenshot=${winShotPath}`,
          url,
        ],
        { stdio: 'ignore' }
      )

      fs.copyFileSync(wslShotPath, destPath)
      const stat = fs.statSync(destPath)
      console.log(`  ✔ Saved public/screenshots/${slug}.png (${Math.round(stat.size / 1024)} KB)`)
    }
  } finally {
    server.close()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
