import { ModeDefinition, Boid, SimConfig, MouseState } from '../types'
import { limitSpeed } from '../core'
import { renderEarthquakes } from '../renderers/EarthquakesRenderer'

function mapEarthquakeData(data: any, width: number, height: number): Boid[] {
  if (!data?.features) return []
  const boids: Boid[] = []
  for (const f of data.features) {
    const [lon, lat, depth] = f.geometry?.coordinates || []
    const mag = f.properties?.mag || 1
    if (lon == null || lat == null) continue
    const x = ((lon + 180) / 360) * width
    const y = ((90 - lat) / 180) * height
    const depthNorm = Math.min((depth || 0) / 300, 1)
    const r = depthNorm < 0.3 ? 239 : depthNorm < 0.6 ? 245 : 96
    const g = depthNorm < 0.3 ? 68 : depthNorm < 0.6 ? 158 : 165
    const b = depthNorm < 0.3 ? 68 : depthNorm < 0.6 ? 11 : 250
    boids.push({
      x, y,
      vx: 0,
      vy: 0,
      size: Math.max(2, mag * 2.5),
      color: `rgba(${r}, ${g}, ${b}, 0.8)`,
      meta: { mag, depth, place: f.properties?.place, time: f.properties?.time, originX: x, originY: y },
    })
  }
  return boids
}

export const earthquakesMode: ModeDefinition = {
  id: 'earthquakes',
  label: 'Quakes',
  description: 'Real-time seismic data',
  icon: '\uD83C\uDF0D',
  requiresApi: true,
  apiSource: 'earthquakes',
  pollIntervalMs: 300000,
  defaultConfig: {
    flockSize: 200,
    separation: 0.5,
    alignment: 0.1,
    cohesion: 0.1,
    maxSpeed: 0.5,
    perceptionRadius: 30,
    separationRadius: 15,
    mouseInfluence: 150,
    trails: false,
  },
  presets: [
    { label: 'Static', description: 'Minimal drift', config: { separation: 0.3, alignment: 0.05, cohesion: 0.05, maxSpeed: 0.3, trails: false } },
    { label: 'Ripple', description: 'Wave effect', config: { separation: 1.0, alignment: 0.3, cohesion: 0.3, maxSpeed: 1.0, trails: true } },
    { label: 'Active', description: 'More movement', config: { separation: 1.5, alignment: 0.5, cohesion: 0.5, maxSpeed: 2, trails: false } },
  ],
  init: (w, h, data) => data ? mapEarthquakeData(data, w, h) : [],
  update: (boids, config, w, h, mouse) => {
    const now = Date.now()
    for (const b of boids) {
      const ox = b.meta?.originX ?? b.x
      const oy = b.meta?.originY ?? b.y

      // Small jitter near origin (seismic tremor effect)
      const jitterX = (Math.random() - 0.5) * 0.3
      const jitterY = (Math.random() - 0.5) * 0.3

      // Strong pull back to real position
      const pullX = (ox - b.x) * 0.2
      const pullY = (oy - b.y) * 0.2

      b.vx = (b.vx + jitterX + pullX) * 0.8
      b.vy = (b.vy + jitterY + pullY) * 0.8

      // Mouse wave interaction
      if (mouse.active) {
        const dx = mouse.x - b.x
        const dy = mouse.y - b.y
        const d = Math.sqrt(dx * dx + dy * dy)
        if (d < config.mouseInfluence && d > 0) {
          const wave = Math.sin(d * 0.05 - now * 0.005) * 0.5
          b.vx += (dx / d) * wave
          b.vy += (dy / d) * wave
        }
      }

      b.x += b.vx
      b.y += b.vy
    }
  },
  render: renderEarthquakes,
}
