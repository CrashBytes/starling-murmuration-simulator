import { ModeDefinition, Boid, SimConfig, MouseState } from '../types'
import { createBoid, limitSpeed, applyBoidsRules } from '../core'
import { renderDroneSwarm } from '../renderers/DroneSwarmRenderer'

export const droneSwarmMode: ModeDefinition = {
  id: 'drone-swarm',
  label: 'Drones',
  description: 'Formation flight',
  icon: '\uD83D\uDD79\uFE0F',
  requiresApi: false,
  defaultConfig: {
    flockSize: 50,
    separation: 2.0,
    alignment: 1.5,
    cohesion: 2.0,
    maxSpeed: 3,
    perceptionRadius: 80,
    separationRadius: 30,
    trails: true,
  },
  presets: [
    { label: 'V-Form', description: 'V formation', config: { flockSize: 20, separation: 2.5, alignment: 2.0, cohesion: 2.5, maxSpeed: 3, trails: true } },
    { label: 'Swarm', description: 'Dense swarm', config: { flockSize: 100, separation: 1.5, alignment: 1.0, cohesion: 3.0, maxSpeed: 4, trails: true } },
    { label: 'Patrol', description: 'Loose patrol', config: { flockSize: 30, separation: 3.0, alignment: 0.5, cohesion: 1.0, maxSpeed: 2, trails: false } },
  ],
  init: (w, h) => {
    const boids: Boid[] = []
    const cx = w / 2
    const cy = h / 2
    for (let i = 0; i < 50; i++) {
      boids.push({
        x: cx + (Math.random() - 0.5) * 200,
        y: cy + (Math.random() - 0.5) * 200,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        color: '#06b6d4',
        size: 4,
      })
    }
    return boids
  },
  update: (boids, config, w, h, mouse, scatter) => {
    // Attract toward mouse as waypoint
    if (mouse.active) {
      for (const b of boids) {
        const dx = mouse.x - b.x
        const dy = mouse.y - b.y
        const d = Math.sqrt(dx * dx + dy * dy)
        if (d > 5) {
          b.vx += (dx / d) * 0.15
          b.vy += (dy / d) * 0.15
        }
      }
    }
    applyBoidsRules(boids, config, mouse, scatter, w, h)
  },
  render: renderDroneSwarm,
}
