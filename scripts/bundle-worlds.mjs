import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const outWorldsDir = path.resolve(rootDir, 'dist', 'worlds')

const WORLD_SLUGS = [
  'blue-medina-road',
  'coastal-house',
  'island-world',
  'palm-village-maze',
  'santorini-sea-maze',
  'sunlit-adobe-maze',
]

const forceRebuild = process.argv.includes('--rebuild')

function copyDirRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

console.log('\n✦ [MadeWith-ThreeJS] Bundling 6 interactive 3D worlds for production...\n')

for (const slug of WORLD_SLUGS) {
  const projectDir = path.resolve(rootDir, slug)
  const projectDistDir = path.resolve(projectDir, 'dist')

  if (forceRebuild || !fs.existsSync(path.join(projectDistDir, 'index.html'))) {
    console.log(`  ↻ Building sub-project "${slug}"...`)
    execSync('npm run build', { cwd: projectDir, stdio: 'inherit' })
  }

  if (!fs.existsSync(projectDistDir)) {
    console.error(`  ✖ Missing dist folder for ${slug}`)
    process.exit(1)
  }

  // Only copy into root dist/worlds/<slug> if root dist exists (or create it)
  const targetDir = path.resolve(outWorldsDir, slug)
  copyDirRecursive(projectDistDir, targetDir)

  // Rewrite root-relative asset paths in dist/worlds/<slug>/index.html so it works at /worlds/<slug>/
  const indexHtmlPath = path.join(targetDir, 'index.html')
  if (fs.existsSync(indexHtmlPath)) {
    let html = fs.readFileSync(indexHtmlPath, 'utf-8')
    html = html
      .replace(/(src|href)="\/assets\//g, '$1="./assets/')
      .replace(/(src|href)="\/favicon\./g, '$1="./favicon.')
      .replace(/(src|href)="\/icons\./g, '$1="./icons.')
    fs.writeFileSync(indexHtmlPath, html, 'utf-8')
  }

  console.log(`  ✔ Bundled /worlds/${slug}/`)
}

console.log('\n✦ All 6 Three.js worlds successfully bundled into dist/worlds/!\n')
