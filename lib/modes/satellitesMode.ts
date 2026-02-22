import { ModeDefinition, Boid, SimConfig, MouseState } from '../types'
import { limitSpeed } from '../core'
import { renderSatellites } from '../renderers/SatellitesRenderer'

const SHELLS = [
  { name: 'LEO-1', altitude: 340, count: 120, color: '#4ade80' },
  { name: 'LEO-2', altitude: 540, count: 80, color: '#60a5fa' },
  { name: 'MEO', altitude: 1200, count: 40, color: '#a78bfa' },
]

function createOrbitalBoids(width: number, height: number, issData?: any): Boid[] {
  const cx = width / 2
  const cy = height / 2
  const baseRadius = Math.min(width, height) * 0.25
  const boids: Boid[] = []

  for (const shell of SHELLS) {
    const orbitRadius = baseRadius + (shell.altitude / 1200) * baseRadius * 1.8
    const speed = 2.5 - (shell.altitude / 1200) * 1.0
    for (let i = 0; i < shell.count; i++) {
      const angle = (i / shell.count) * Math.PI * 2 + Math.random() * 0.3
      const r = orbitRadius + (Math.random() - 0.5) * 10
      boids.push({
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
        vx: -Math.sin(angle) * speed,
        vy: Math.cos(angle) * speed,
        color: shell.color,
        size: 2,
        group: shell.name,
        meta: { orbitRadius: r, shell: shell.name },
      })
    }
  }

  // ISS — larger, highlighted
  if (issData) {
    const issOrbit = baseRadius * 1.5
    const issAngle = ((issData.longitude || 0) / 180) * Math.PI
    boids.push({
      x: cx + Math.cos(issAngle) * issOrbit,
      y: cy + Math.sin(issAngle) * issOrbit,
      vx: -Math.sin(issAngle) * 2.5,
      vy: Math.cos(issAngle) * 2.5,
      color: '#fbbf24',
      size: 5,
      group: 'ISS',
      meta: { orbitRadius: issOrbit, shell: 'ISS', label: 'ISS' },
    })
  } else {
    const issAngle = Math.random() * Math.PI * 2
    const issOrbit = baseRadius * 1.5
    boids.push({
      x: cx + Math.cos(issAngle) * issOrbit,
      y: cy + Math.sin(issAngle) * issOrbit,
      vx: -Math.sin(issAngle) * 2.5,
      vy: Math.cos(issAngle) * 2.5,
      color: '#fbbf24',
      size: 5,
      group: 'ISS',
      meta: { orbitRadius: issOrbit, shell: 'ISS', label: 'ISS' },
    })
  }

  return boids
}

export const satellitesMode: ModeDefinition = {
  id: 'satellites',
  label: 'Satellites',
  description: 'Orbital murmuration',
  icon: '\uD83D\uDEF0\uFE0F',
  requiresApi: true,
  apiSource: 'iss',
  pollIntervalMs: 5000,
  defaultConfig: {
    flockSize: 240,
    separation: 1.0,
    alignment: 0.0,
    cohesion: 0.0,
    maxSpeed: 3,
    perceptionRadius: 20,
    separationRadius: 12,
    trails: true,
  },
  presets: [
    { label: 'Orbital', description: 'Stable orbits', config: { separation: 1.0, alignment: 0.0, cohesion: 0.0, maxSpeed: 3, trails: true } },
    { label: 'Debris', description: 'Chaotic orbits', config: { separation: 2.0, alignment: 0.5, cohesion: 0.3, maxSpeed: 5, trails: true } },
    { label: 'Clean', description: 'No trails', config: { separation: 1.0, alignment: 0.0, cohesion: 0.0, maxSpeed: 3, trails: false } },
  ],
  init: (w, h, data) => createOrbitalBoids(w, h, data),
  update: (boids, config, w, h, mouse) => {
    const cx = w / 2
    const cy = h / 2
    const baseRadius = Math.min(w, h) * 0.25

    for (const b of boids) {
      const targetR = b.meta?.orbitRadius || baseRadius * 1.5
      const dx = b.x - cx
      const dy = b.y - cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      const angle = Math.atan2(dy, dx)

      // Tangential velocity (orbit)
      const orbitalSpeed = b.group === 'ISS' ? 2.5 : (2.5 - ((b.meta?.orbitRadius || baseRadius) - baseRadius) / (baseRadius * 2))
      b.vx = -Math.sin(angle) * orbitalSpeed
      b.vy = Math.cos(angle) * orbitalSpeed

      // Radial correction to maintain orbit
      if (dist > 0) {
        const radialForce = (targetR - dist) * 0.02
        b.vx += (dx / dist) * radialForce
        b.vy += (dy / dist) * radialForce
      }

      // Separation from neighbors
      for (const other of boids) {
        if (other === b || other.group !== b.group) continue
        const odx = other.x - b.x
        const ody = other.y - b.y
        const od = Math.sqrt(odx * odx + ody * ody)
        if (od < config.separationRadius && od > 0) {
          b.vx -= (odx / od) * config.separation * 0.3
          b.vy -= (ody / od) * config.separation * 0.3
        }
      }

      // Mouse gravity well
      if (mouse.active) {
        const mdx = mouse.x - b.x
        const mdy = mouse.y - b.y
        const md = Math.sqrt(mdx * mdx + mdy * mdy)
        if (md < config.mouseInfluence && md > 0) {
          const force = ((config.mouseInfluence - md) / config.mouseInfluence) * 0.1
          if (config.predatorMode) {
            b.vx -= (mdx / md) * force
            b.vy -= (mdy / md) * force
          } else {
            b.vx += (mdx / md) * force
            b.vy += (mdy / md) * force
          }
        }
      }

      ;[b.vx, b.vy] = limitSpeed(b.vx, b.vy, config.maxSpeed)
      b.x += b.vx
      b.y += b.vy
    }
  },
  render: renderSatellites,
}
