# MADE WITH THREE.JS — Interactive Concept Sheet & 3D World Discovery Platform

An editorial Japanese game-concept-sheet showcase (`// 作品コンセプト図鑑`) and interactive launcher for all **6 Three.js / React Three Fiber worlds** in this repository:

1. **`01 • AZURE MEDINA!`** ([`blue-medina-road`](./blue-medina-road)) — *Lumina & the Azure Steps*
2. **`02 • SUMOMALO COAST!`** ([`coastal-house`](./coastal-house)) — *Sumomalo Coffee & Wandering Ronin*
3. **`03 • ISOLATED ATOLL!`** ([`island-world`](./island-world)) — *ISOLATED: A Quiet Place Between Sea & Sky*
4. **`04 • PALM LABYRINTH!`** ([`palm-village-maze`](./palm-village-maze)) — *Hana & the Palm Village Maze*
5. **`05 • SANTORINI SEA!`** ([`santorini-sea-maze`](./santorini-sea-maze)) — *Midori & the Santorini Sea Maze*
6. **`06 • SUNLIT ADOBE!`** ([`sunlit-adobe-maze`](./sunlit-adobe-maze)) — *Mina & the Sunlit Mashrabiya Labyrinth*

---

## Development Mode (`dev`)

Install root dependencies and start the unified development server (automatically serves the showcase platform + all 6 Three.js worlds at `/worlds/<slug>/`):

```bash
npm install
npm run dev
```

- Opens on `http://localhost:5173` (bound to `0.0.0.0` for LAN/WSL preview).

---

## Production Mode & VPS Deployment (`prod`)

### 1. Build the Complete Production Bundle
```bash
npm run build
```
This compiles the showcase platform into `./dist` and bundles all 6 interactive Three.js worlds into `./dist/worlds/<slug>/` with normalized relative asset paths.
*(If you modify source code inside any of the 6 sub-projects and want to recompile them all from scratch, run `npm run build:all`.)*

### 2. Run the Production Server on Your VPS
```bash
# Default port 3000 on 0.0.0.0
npm run prod

# Custom port
PORT=8080 npm run prod
```
- Includes built-in **Brotli & Gzip compression**, immutable asset caching headers, SPA fallback, and a `/healthz` endpoint (`http://localhost:3000/healthz`).

### 3. PM2 / Docker / Nginx Options
- **PM2**: `pm2 start ecosystem.config.cjs`
- **Docker Compose**: `docker compose up -d --build`
- **Nginx**: See [`nginx.conf.example`](./nginx.conf.example)
