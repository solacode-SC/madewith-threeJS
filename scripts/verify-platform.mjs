import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const PORT = 4099
const BASE = `http://127.0.0.1:${PORT}`

const WORLD_SLUGS = [
  'blue-medina-road',
  'coastal-house',
  'island-world',
  'palm-village-maze',
  'santorini-sea-maze',
  'sunlit-adobe-maze',
  'maple-valley-city',
  'sky-biplane-village',
]

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function runVerification() {
  const srv = spawn('node', ['server.mjs'], {
    cwd: rootDir,
    env: { ...process.env, PORT: String(PORT), HOST: '127.0.0.1' },
    stdio: 'pipe',
  })

  try {
    await sleep(1500)

    // 1. Check /healthz
    const healthRes = await fetch(`${BASE}/healthz`)
    if (healthRes.status !== 200) throw new Error(`/healthz returned ${healthRes.status}`)
    const healthJson = await healthRes.json()
    console.log('✔ /healthz:', JSON.stringify(healthJson))

    // 2. Check root index.html
    const rootRes = await fetch(`${BASE}/`)
    if (rootRes.status !== 200) throw new Error(`/ returned ${rootRes.status}`)
    const rootHtml = await rootRes.text()
    if (!rootHtml.includes('MADE WITH THREE.JS')) {
      throw new Error('Root HTML missing expected title')
    }
    console.log('✔ / (Root Showcase Platform): HTTP 200 OK')

    // 3. Check each of the 7 bundled worlds, their JS/CSS assets, and their real 3D screenshots
    for (const slug of WORLD_SLUGS) {
      const shotRes = await fetch(`${BASE}/screenshots/${slug}.png`)
      if (shotRes.status !== 200) {
        throw new Error(`/screenshots/${slug}.png returned ${shotRes.status}`)
      }
      const shotBytes = (await shotRes.arrayBuffer()).byteLength
      if (shotBytes < 50000) {
        throw new Error(`/screenshots/${slug}.png seems too small (${shotBytes} bytes)`)
      }

      const worldRes = await fetch(`${BASE}/worlds/${slug}/`)
      if (worldRes.status !== 200) {
        throw new Error(`/worlds/${slug}/ returned ${worldRes.status}`)
      }
      const html = await worldRes.text()
      const jsMatch = html.match(/src="\.\/assets\/([^"]+\.js)"/)
      const cssMatch = html.match(/href="\.\/assets\/([^"]+\.css)"/)

      if (!jsMatch) {
        throw new Error(`/worlds/${slug}/ missing relative ./assets/*.js script`)
      }

      const jsRes = await fetch(`${BASE}/worlds/${slug}/assets/${jsMatch[1]}`)
      if (jsRes.status !== 200) {
        throw new Error(`/worlds/${slug}/assets/${jsMatch[1]} returned ${jsRes.status}`)
      }

      if (cssMatch) {
        const cssRes = await fetch(`${BASE}/worlds/${slug}/assets/${cssMatch[1]}`)
        if (cssRes.status !== 200) {
          throw new Error(`/worlds/${slug}/assets/${cssMatch[1]} returned ${cssRes.status}`)
        }
      }

      console.log(
        `✔ /worlds/${slug}/ + /screenshots/${slug}.png (${Math.round(shotBytes / 1024)} KB): HTTP 200 OK`
      )
    }

    console.log('\n✦ All platform, real 3D screenshots & 7 Three.js world endpoints verified!')
  } finally {
    srv.kill()
  }
}

runVerification().catch((err) => {
  console.error('Verification failed:', err)
  process.exit(1)
})
