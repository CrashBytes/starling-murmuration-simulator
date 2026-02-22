import { ModeDefinition, Boid, SimConfig, MouseState } from '../types'
import { limitSpeed } from '../core'
import { renderNetwork } from '../renderers/NetworkRenderer'

interface Node {
  name: string
  x: number
  y: number
  color: string
}

function createNodes(width: number, height: number): Node[] {
  return [
    { name: 'Client', x: width * 0.1, y: height * 0.5, color: '#60a5fa' },
    { name: 'CDN', x: width * 0.3, y: height * 0.25, color: '#34d399' },
    { name: 'LB', x: width * 0.3, y: height * 0.75, color: '#a78bfa' },
    { name: 'API-1', x: width * 0.5, y: height * 0.3, color: '#f97316' },
    { name: 'API-2', x: width * 0.5, y: height * 0.7, color: '#f97316' },
    { name: 'Cache', x: width * 0.7, y: height * 0.25, color: '#fbbf24' },
    { name: 'DB', x: width * 0.7, y: height * 0.75, color: '#ef4444' },
    { name: 'Queue', x: width * 0.9, y: height * 0.5, color: '#06b6d4' },
  ]
}

const ROUTES = [
  [0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [4, 6], [3, 6], [4, 5], [5, 7], [6, 7],
]

function createPacketBoids(width: number, height: number): Boid[] {
  const nodes = createNodes(width, height)
  const boids: Boid[] = []
  for (let i = 0; i < 80; i++) {
    const route = ROUTES[Math.floor(Math.random() * ROUTES.length)]
    const src = nodes[route[0]]
    const dst = nodes[route[1]]
    const t = Math.random()
    boids.push({
      x: src.x + (dst.x - src.x) * t + (Math.random() - 0.5) * 10,
      y: src.y + (dst.y - src.y) * t + (Math.random() - 0.5) * 10,
      vx: 0, vy: 0,
      color: src.color,
      size: 2,
      group: `${route[0]}-${route[1]}`,
      meta: { srcIdx: route[0], dstIdx: route[1], nodes },
    })
  }
  return boids
}

export const networkMode: ModeDefinition = {
  id: 'network',
  label: 'Network',
  description: 'Packet flow simulation',
  icon: '\uD83C\uDF10',
  requiresApi: false,
  defaultConfig: {
    flockSize: 80,
    separation: 1.0,
    alignment: 0.3,
    cohesion: 0.2,
    maxSpeed: 4,
    perceptionRadius: 25,
    separationRadius: 10,
    trails: true,
  },
  presets: [
    { label: 'Normal', description: 'Steady traffic', config: { flockSize: 80, separation: 1.0, maxSpeed: 3, trails: true } },
    { label: 'Burst', description: 'High traffic', config: { flockSize: 200, separation: 0.5, maxSpeed: 6, trails: true } },
    { label: 'Clean', description: 'No trails', config: { flockSize: 80, separation: 1.0, maxSpeed: 3, trails: false } },
  ],
  init: (w, h) => createPacketBoids(w, h),
  update: (boids, config, w, h, mouse) => {
    const nodes = boids[0]?.meta?.nodes as Node[] | undefined
    if (!nodes) return

    for (const b of boids) {
      const dst = nodes[b.meta?.dstIdx || 0]
      const dx = dst.x - b.x
      const dy = dst.y - b.y
      const d = Math.sqrt(dx * dx + dy * dy)

      if (d < 15) {
        // Arrived — pick new route
        const srcIdx = b.meta!.dstIdx
        const possibleRoutes = ROUTES.filter(r => r[0] === srcIdx)
        if (possibleRoutes.length > 0) {
          const route = possibleRoutes[Math.floor(Math.random() * possibleRoutes.length)]
          b.meta!.srcIdx = route[0]
          b.meta!.dstIdx = route[1]
          b.color = nodes[route[0]].color
        }
      } else {
        b.vx += (dx / d) * 0.3
        b.vy += (dy / d) * 0.3
      }

      // Slight separation
      for (const other of boids) {
        if (other === b) continue
        const odx = other.x - b.x
        const ody = other.y - b.y
        const od = Math.sqrt(odx * odx + ody * ody)
        if (od < config.separationRadius && od > 0) {
          b.vx -= (odx / od) * config.separation * 0.2
          b.vy -= (ody / od) * config.separation * 0.2
        }
      }

      ;[b.vx, b.vy] = limitSpeed(b.vx, b.vy, config.maxSpeed)
      b.x += b.vx
      b.y += b.vy
    }
  },
  render: renderNetwork,
}
