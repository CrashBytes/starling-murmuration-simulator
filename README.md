# Starling Murmuration Simulator

An interactive boids simulation with **9 data-driven visualization modes** built with React, Canvas 2D, and [Craig Reynolds' flocking algorithm](https://www.red3d.com/cwr/boids/) (1986).

Simple local rules generate complex, emergent global patterns — from starling flocks to live flight tracking, satellite orbits, and earthquake ripples.

## Modes

| Mode | Data Source | Description |
|------|-----------|-------------|
| **Classic** | None | Traditional boids flocking with 4 presets |
| **Flights** | [ADS-B Exchange](https://www.adsbexchange.com/) | Live aircraft positions colored by altitude |
| **Satellites** | [Where the ISS At](https://wheretheiss.at/) | Earth + orbit rings + ISS tracking + simulated Starlink |
| **Crypto** | [CoinGecko](https://www.coingecko.com/) | Top 100 coins clustered by sector, sized by market cap |
| **GitHub** | [GitHub Events API](https://docs.github.com/en/rest/activity/events) | Live push/PR/issue events flowing toward repo attractors |
| **Earthquakes** | [USGS GeoJSON](https://earthquake.usgs.gov/) | Real-time seismic data on a world map with magnitude sizing |
| **Drone Swarm** | None (interactive) | Click to place waypoints, drones form patterns |
| **Network** | None (simulated) | Packet flow between server nodes on circuit-board traces |
| **Job Market** | None (BLS data) | Workforce agents migrating between industry sectors |

## Quick Start

```bash
git clone https://github.com/CrashBytes/starling-murmuration-simulator.git
cd starling-murmuration-simulator
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the full simulator with all 9 modes.

### Examples

Each mode has its own standalone example page:

- [/examples/classic](http://localhost:3000/examples/classic) — Classic Boids
- [/examples/flights](http://localhost:3000/examples/flights) — Live Flights
- [/examples/satellites](http://localhost:3000/examples/satellites) — Satellites
- [/examples/crypto](http://localhost:3000/examples/crypto) — Crypto Markets
- [/examples/github](http://localhost:3000/examples/github) — GitHub Activity
- [/examples/earthquakes](http://localhost:3000/examples/earthquakes) — Earthquakes
- [/examples/drone-swarm](http://localhost:3000/examples/drone-swarm) — Drone Swarm
- [/examples/network](http://localhost:3000/examples/network) — Network Traffic
- [/examples/job-market](http://localhost:3000/examples/job-market) — Job Market

## Architecture

```
lib/
  types.ts          — Boid, SimConfig, ModeDefinition interfaces
  core.ts           — Boids engine (spatial grid, flocking rules)
  useDataFetcher.ts — React hook for API polling with backoff
  modes/            — 9 mode definitions (init, update, render)
  renderers/        — 9 Canvas 2D renderers
  data/             — Airports, coastlines, borders (JSON/TS)

components/
  MurmurationSimulator.tsx   — Full simulator with mode selector
  SingleModeSimulator.tsx    — Single-mode variant for examples
  ModeSelector.tsx           — Mode button grid

app/
  page.tsx                   — Home (all modes)
  api/proxy/[source]/        — CORS proxy for external APIs
  examples/                  — 9 standalone example pages
```

### The Boids Algorithm

Each agent follows three simple rules:

1. **Separation** — steer away from neighbors that are too close
2. **Alignment** — match the average velocity of nearby neighbors
3. **Cohesion** — move toward the average position of nearby neighbors

The engine uses spatial grid partitioning for O(n) neighbor lookups, making it efficient for 3,000+ agents.

### Controls

- **Scroll** to zoom (centered on cursor)
- **Drag** to pan
- **Double-click** to reset view
- **Click** to scatter agents
- **Sliders** adjust separation, alignment, cohesion, speed, perception radius
- **Trails** toggle persistent trail rendering
- **Predator** mode makes mouse repel instead of attract

## Adding a Custom Mode

Create two files:

**1. Mode definition** (`lib/modes/myMode.ts`):

```typescript
import { ModeDefinition, Boid, SimConfig, MouseState } from '../types'
import { renderMyMode } from '../renderers/MyModeRenderer'

export const myMode: ModeDefinition = {
  id: 'my-mode',
  label: 'My Mode',
  description: 'A custom visualization',
  icon: '\u2728',
  requiresApi: false,
  defaultConfig: { flockSize: 500, maxSpeed: 3 },
  presets: [
    { label: 'Calm', description: 'Slow movement', config: { maxSpeed: 1 } },
  ],
  init: (width, height) => {
    // Return initial Boid[] array
  },
  update: (boids, config, width, height, mouse, scatter) => {
    // Update boid positions each frame
  },
  render: renderMyMode,
}
```

**2. Renderer** (`lib/renderers/MyModeRenderer.ts`):

```typescript
import { Boid, SimConfig, MouseState } from '../types'

export function renderMyMode(
  ctx: CanvasRenderingContext2D,
  boids: Boid[],
  config: SimConfig,
  width: number,
  height: number,
  mouse: MouseState,
  data?: any,
  zoom: number = 1
) {
  // Draw background
  ctx.fillStyle = '#0f172a'
  ctx.fillRect(0, 0, width, height)

  // Draw each boid
  for (const b of boids) {
    ctx.beginPath()
    ctx.arc(b.x, b.y, 3 / zoom, 0, Math.PI * 2)
    ctx.fillStyle = b.color || '#60a5fa'
    ctx.fill()
  }
}
```

Then import your mode in `components/MurmurationSimulator.tsx` and add it to the `ALL_MODES` array.

## API Proxy

External APIs (ADS-B, USGS, CoinGecko) don't support CORS. The included Next.js API route at `/api/proxy/[source]` acts as a whitelist proxy with caching:

| Source | Upstream | Cache TTL |
|--------|---------|-----------|
| `opensky` | api.adsb.lol | 15s |
| `earthquakes` | earthquake.usgs.gov | 300s |
| `coingecko` | api.coingecko.com | 60s |
| `iss` | api.wheretheiss.at | 5s |

GitHub Events are fetched directly (supports CORS).

## Tech Stack

- **Next.js 16** (App Router)
- **React 19** (hooks, refs, Canvas 2D)
- **Tailwind CSS v4**
- **TypeScript**
- Zero external animation/charting libraries

## License

MIT - see [LICENSE](LICENSE)

## Credits

- Boids algorithm by [Craig Reynolds](https://www.red3d.com/cwr/boids/) (1986)
- Flight data from [ADS-B Exchange / adsb.lol](https://www.adsb.lol/)
- Earthquake data from [USGS](https://earthquake.usgs.gov/)
- Crypto data from [CoinGecko](https://www.coingecko.com/)
- ISS position from [Where the ISS At](https://wheretheiss.at/)
- Coastline and border data from [Natural Earth](https://www.naturalearthdata.com/)

Built by [CrashBytes](https://crashbytes.com)
