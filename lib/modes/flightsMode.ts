import { ModeDefinition, Boid, SimConfig, MouseState } from '../types'
import { renderFlights } from '../renderers/FlightsRenderer'

const POLL_MS = 30000

// Module-level state for data tracking
let lastDataRef: any = null
let lerpStartTime = 0
let boidsByCallsign: Map<string, Boid> = new Map()

function projectToScreen(lon: number, lat: number, w: number, h: number) {
  return { x: ((lon + 180) / 360) * w, y: ((90 - lat) / 180) * h }
}

function getAircraft(data: any): any[] {
  // adsb.lol format: { ac: [...] }
  if (data?.ac) return data.ac
  // OpenSky fallback: { states: [...] }
  if (data?.states) return data.states.map((s: any) => ({
    flight: s[1], lat: s[6], lon: s[5], alt_baro: s[7], track: s[10],
  }))
  return []
}

function mapFlightData(data: any, width: number, height: number): Boid[] {
  const aircraft = getAircraft(data)
  if (!aircraft.length) return []
  const boids: Boid[] = []
  boidsByCallsign = new Map()

  for (const ac of aircraft) {
    const lon = ac.lon
    const lat = ac.lat
    const alt = ac.alt_baro === 'ground' ? 0 : (ac.alt_baro || 0)
    const heading = ac.track || 0
    const callsign = (ac.flight || ac.hex || '').trim()
    if (lon == null || lat == null) continue

    const pos = projectToScreen(lon, lat, width, height)
    const boid: Boid = {
      x: pos.x,
      y: pos.y,
      vx: 0,
      vy: 0,
      meta: {
        callsign,
        altitude: alt,
        heading,
        prevX: pos.x,
        prevY: pos.y,
        targetX: pos.x,
        targetY: pos.y,
      },
      size: 3 + Math.min(alt / 5000, 3),
    }
    boids.push(boid)
    if (callsign) boidsByCallsign.set(callsign, boid)
  }

  lerpStartTime = performance.now()
  lastDataRef = data
  return boids
}

function mergeNewData(boids: Boid[], data: any, w: number, h: number) {
  const aircraft = getAircraft(data)
  if (!aircraft.length) return

  const newPositions = new Map<string, { x: number; y: number; alt: number; heading: number }>()
  for (const ac of aircraft) {
    const lon = ac.lon
    const lat = ac.lat
    const callsign = (ac.flight || ac.hex || '').trim()
    if (lon == null || lat == null || !callsign) continue
    const pos = projectToScreen(lon, lat, w, h)
    const alt = ac.alt_baro === 'ground' ? 0 : (ac.alt_baro || 0)
    newPositions.set(callsign, { x: pos.x, y: pos.y, alt, heading: ac.track || 0 })
  }

  for (const b of boids) {
    const cs = b.meta?.callsign
    if (!cs) continue
    const np = newPositions.get(cs)
    if (np) {
      b.meta!.prevX = b.x
      b.meta!.prevY = b.y
      b.meta!.targetX = np.x
      b.meta!.targetY = np.y
      b.meta!.heading = np.heading
      b.meta!.altitude = np.alt
      b.size = 3 + Math.min(np.alt / 5000, 3)
    }
  }

  lerpStartTime = performance.now()
  lastDataRef = data
}

export const flightsMode: ModeDefinition = {
  id: 'flights',
  label: 'Flights',
  description: 'Real-time aircraft',
  icon: '\u2708\uFE0F',
  requiresApi: true,
  apiSource: 'opensky',
  pollIntervalMs: POLL_MS,
  defaultConfig: {
    flockSize: 500,
    separation: 0.3,
    alignment: 0.1,
    cohesion: 0.1,
    maxSpeed: 2,
    perceptionRadius: 30,
    trails: false,
  },
  presets: [
    { label: 'Realistic', description: 'True positions', config: { separation: 0.3, alignment: 0.1, cohesion: 0.1, maxSpeed: 2, trails: false } },
    { label: 'Trails', description: 'Flight paths', config: { separation: 0.2, alignment: 0.1, cohesion: 0.05, maxSpeed: 2, trails: true } },
    { label: 'Turbulence', description: 'Chaotic skies', config: { separation: 1.5, alignment: 0.5, cohesion: 0.5, maxSpeed: 5, trails: false } },
  ],
  init: (w, h, data) => {
    return data ? mapFlightData(data, w, h) : []
  },
  update: (boids, config, w, h, mouse, scatter, data) => {
    // Detect fresh API data and merge
    if (data && data !== lastDataRef) {
      mergeNewData(boids, data, w, h)
    }

    // Smooth lerp from previous to target position
    const now = performance.now()
    const elapsed = now - lerpStartTime
    const t = Math.min(elapsed / POLL_MS, 1)
    // Ease-out for smooth deceleration
    const ease = 1 - (1 - t) * (1 - t)

    for (const b of boids) {
      const prevX = b.meta?.prevX ?? b.x
      const prevY = b.meta?.prevY ?? b.y
      const targetX = b.meta?.targetX ?? b.x
      const targetY = b.meta?.targetY ?? b.y

      // Interpolate position
      b.x = prevX + (targetX - prevX) * ease
      b.y = prevY + (targetY - prevY) * ease

      // Mouse interaction — slight push/pull
      if (mouse.active) {
        const dx = mouse.x - b.x
        const dy = mouse.y - b.y
        const d = Math.sqrt(dx * dx + dy * dy)
        if (d < config.mouseInfluence && d > 0) {
          const force = ((config.mouseInfluence - d) / config.mouseInfluence) * 0.3
          if (config.predatorMode) {
            b.x -= (dx / d) * force
            b.y -= (dy / d) * force
          } else {
            b.x += (dx / d) * force
            b.y += (dy / d) * force
          }
        }
      }
    }
  },
  render: renderFlights,
}
