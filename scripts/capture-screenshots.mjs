import { execFile, execSync } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

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
  'maple-valley-city',
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

// 1x1 transparent PNG buffer
const TRANSPARENT_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
)

const INJECT_CLEAN_SCREENSHOT_HTML = `
<style>
  /* Hide the initial loading screen overlay so screenshot captures the live rendered 3D project */
  main > div[style*="z-index: 50"],
  main > div[style*="z-index:50"],
  main > div[style*="z-index: 9999"],
  main > div[style*="z-index:9999"] {
    display: none !important;
    opacity: 0 !important;
    visibility: hidden !important;
  }
</style>
<img src="/__wait_webgl_render.png" alt="" style="position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;z-index:-1;" />
`

function getWslIp() {
  try {
    const ip = execSync('hostname -I', { encoding: 'utf-8' }).trim().split(/\s+/)[0]
    return ip || '127.0.0.1'
  } catch {
    return '127.0.0.1'
  }
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true })
  const hostIp = getWslIp()

  const server = http.createServer((req, res) => {
    const rawUrl = req.url || '/'
    const urlPath = decodeURIComponent(rawUrl.split('?')[0])

    // Hold the load event for 2200ms of real wall-clock time while Three.js WebGL renders frames
    if (urlPath === '/__wait_webgl_render.png') {
      setTimeout(() => {
        res.writeHead(200, {
          'Content-Type': 'image/png',
          'Cache-Control': 'no-store',
        })
        res.end(TRANSPARENT_PNG)
      }, 2200)
      return
    }

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
    res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-store' })

    if (ext === '.html') {
      let html = fs.readFileSync(filePath, 'utf-8')
      html = html.replace(/<link[^>]*fonts\.(googleapis|gstatic)\.com[^>]*>/gi, '')
      html = html.replace('</body>', `${INJECT_CLEAN_SCREENSHOT_HTML}</body>`)
      res.end(html)
      return
    }

    res.end(fs.readFileSync(filePath))
  })

  await new Promise((resolve) => server.listen(PORT, '0.0.0.0', resolve))
  console.log(`Capture server listening on http://${hostIp}:${PORT}`)

  try {
    if (process.argv.includes('--landing')) {
      const url = `http://${hostIp}:${PORT}/?t=${Date.now()}`
      const winShotPath = `${WIN_TEMP_DIR}\\landing-preview.png`
      console.log('Capturing landing page preview screenshot ...')
      await execFileAsync(CHROME_PATH, [
        '--headless=new',
        '--disable-gpu-sandbox',
        '--enable-webgl',
        '--ignore-gpu-blocklist',
        '--force-device-scale-factor=1.25',
        '--hide-scrollbars',
        '--window-size=1560,2350',
        `--screenshot=${winShotPath}`,
        url,
      ])
      console.log('  ✔ Saved landing-preview.png')
      return
    }

    const onlyArg = process.argv.find((a) => a.startsWith('--only='))
    const slugsToCapture = onlyArg
      ? WORLD_SLUGS.filter((s) => s === onlyArg.slice('--only='.length))
      : WORLD_SLUGS

    for (const slug of slugsToCapture) {
      const url = `http://${hostIp}:${PORT}/worlds/${slug}/?t=${Date.now()}`
      const winShotPath = `${WIN_TEMP_DIR}\\shot-${slug}.png`
      const wslShotPath = `${WSL_TEMP_DIR}/shot-${slug}.png`
      const destPath = path.join(outDir, `${slug}.png`)

      console.log(`Capturing real 3D screenshot for ${slug} ...`)
      await execFileAsync(CHROME_PATH, [
        '--headless=new',
        '--disable-gpu-sandbox',
        '--enable-webgl',
        '--ignore-gpu-blocklist',
        '--force-device-scale-factor=1.5',
        '--hide-scrollbars',
        '--window-size=1600,1000',
        `--screenshot=${winShotPath}`,
        url,
      ])

      fs.copyFileSync(wslShotPath, destPath)
      const distShotDir = path.join(distDir, 'screenshots')
      if (fs.existsSync(distDir)) {
        fs.mkdirSync(distShotDir, { recursive: true })
        fs.copyFileSync(wslShotPath, path.join(distShotDir, `${slug}.png`))
      }
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
