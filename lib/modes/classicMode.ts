import { ModeDefinition, Boid, SimConfig, MouseState, ScatterState } from '../types'
import { createBoid, applyBoidsRules } from '../core'
import { renderClassic } from '../renderers/ClassicRenderer'

export const classicMode: ModeDefinition = {
  id: 'classic',
  label: 'Classic',
  description: 'Pure boids flocking',
  icon: '\uD83D\uDC26',
  requiresApi: false,
  defaultConfig: {
    flockSize: 800,
    separation: 1.5,
    alignment: 1.0,
    cohesion: 1.0,
    maxSpeed: 4,
    perceptionRadius: 60,
  },
  presets: [
    { label: 'Natural', description: 'Realistic flocking', config: { flockSize: 800, separation: 1.5, alignment: 1.0, cohesion: 1.0, maxSpeed: 4, perceptionRadius: 60, trails: false } },
    { label: 'Swarm', description: 'Dense, fast clusters', config: { flockSize: 2000, separation: 2.5, alignment: 0.3, cohesion: 2.5, maxSpeed: 6, perceptionRadius: 40, trails: true } },
    { label: 'Flow', description: 'Smooth streams', config: { flockSize: 500, separation: 0.5, alignment: 3.0, cohesion: 0.3, maxSpeed: 3, perceptionRadius: 100, trails: true } },
    { label: 'Chaos', description: 'Maximum entropy', config: { flockSize: 1500, separation: 3.0, alignment: 0.2, cohesion: 0.2, maxSpeed: 8, perceptionRadius: 30, trails: false } },
  ],
  init: (w: number, h: number) => {
    const boids: Boid[] = []
    for (let i = 0; i < 800; i++) boids.push(createBoid(w, h))
    return boids
  },
  update: (boids, config, w, h, mouse, scatter) => {
    applyBoidsRules(boids, config, mouse, scatter, w, h)
  },
  render: renderClassic,
}
