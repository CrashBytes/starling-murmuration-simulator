import { ModeDefinition, Boid, SimConfig, MouseState } from '../types'
import { limitSpeed, applyBoidsRules } from '../core'
import { renderJobMarket } from '../renderers/JobMarketRenderer'

// BLS 2024-2034 projected growth rates
const SECTORS = [
  { name: 'Healthcare', growth: 15, color: '#ef4444', workers: 120 },
  { name: 'Tech', growth: 14, color: '#3b82f6', workers: 100 },
  { name: 'Renewables', growth: 11, color: '#22c55e', workers: 40 },
  { name: 'Construction', growth: 4, color: '#f97316', workers: 60 },
  { name: 'Finance', growth: 2, color: '#a78bfa', workers: 50 },
  { name: 'Manufacturing', growth: -2, color: '#6b7280', workers: 70 },
  { name: 'Retail', growth: -3, color: '#eab308', workers: 80 },
  { name: 'Media', growth: -5, color: '#ec4899', workers: 30 },
]

function createWorkerBoids(width: number, height: number): Boid[] {
  const boids: Boid[] = []
  const cols = 4
  const rows = 2
  const cellW = width / cols
  const cellH = height / rows

  for (let si = 0; si < SECTORS.length; si++) {
    const sector = SECTORS[si]
    const col = si % cols
    const row = Math.floor(si / cols)
    const cx = cellW * col + cellW / 2
    const cy = cellH * row + cellH / 2
    const count = Math.max(10, Math.round(sector.workers * 0.4))

    for (let i = 0; i < count; i++) {
      boids.push({
        x: cx + (Math.random() - 0.5) * cellW * 0.6,
        y: cy + (Math.random() - 0.5) * cellH * 0.5,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        color: sector.color,
        size: 2.5,
        group: sector.name,
        meta: { sectorIdx: si, homeCx: cx, homeCy: cy },
      })
    }
  }
  return boids
}

export const jobMarketMode: ModeDefinition = {
  id: 'job-market',
  label: 'Jobs',
  description: 'Workforce migration',
  icon: '\uD83D\uDCBC',
  requiresApi: false,
  defaultConfig: {
    flockSize: 400,
    separation: 1.0,
    alignment: 0.5,
    cohesion: 1.0,
    maxSpeed: 1.5,
    perceptionRadius: 40,
    separationRadius: 15,
    trails: false,
  },
  presets: [
    { label: 'Steady', description: 'Normal flows', config: { separation: 1.0, alignment: 0.5, cohesion: 1.0, maxSpeed: 1.5, trails: false } },
    { label: 'Boom', description: 'Fast migration', config: { separation: 0.5, alignment: 1.0, cohesion: 2.0, maxSpeed: 3, trails: true } },
    { label: 'Recession', description: 'Outward flow', config: { separation: 3.0, alignment: 0.2, cohesion: 0.3, maxSpeed: 2, trails: false } },
  ],
  init: (w, h) => createWorkerBoids(w, h),
  update: (boids, config, w, h, mouse, scatter) => {
    // Pull workers toward growing sectors
    for (const b of boids) {
      const si = b.meta?.sectorIdx ?? 0
      const sector = SECTORS[si]
      const cx = b.meta?.homeCx || w / 2
      const cy = b.meta?.homeCy || h / 2

      // Attract to home sector
      const dx = cx - b.x
      const dy = cy - b.y
      const d = Math.sqrt(dx * dx + dy * dy)
      if (d > 20) {
        const pull = sector.growth > 0 ? 0.01 : 0.003
        b.vx += (dx / d) * pull
        b.vy += (dy / d) * pull
      }

      // Workers in shrinking sectors drift toward growing ones
      if (sector.growth < 0 && Math.random() < 0.002) {
        const growing = SECTORS.filter(s => s.growth > 5)
        if (growing.length > 0) {
          const target = growing[Math.floor(Math.random() * growing.length)]
          const ti = SECTORS.indexOf(target)
          const cols = 4
          const cellW = w / cols
          const cellH = h / 2
          const tcol = ti % cols
          const trow = Math.floor(ti / cols)
          b.meta!.sectorIdx = ti
          b.meta!.homeCx = cellW * tcol + cellW / 2
          b.meta!.homeCy = cellH * trow + cellH / 2
          b.color = target.color
          b.group = target.name
        }
      }
    }
    applyBoidsRules(boids, config, mouse, scatter, w, h)
  },
  render: renderJobMarket,
}
