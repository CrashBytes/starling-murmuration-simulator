export type SimMode =
  | 'classic'
  | 'flights'
  | 'satellites'
  | 'crypto'
  | 'github'
  | 'earthquakes'
  | 'drone-swarm'
  | 'network'
  | 'job-market'

export interface Boid {
  x: number
  y: number
  vx: number
  vy: number
  meta?: Record<string, any>
  color?: string
  size?: number
  group?: string
}

export interface SimConfig {
  flockSize: number
  separation: number
  alignment: number
  cohesion: number
  maxSpeed: number
  perceptionRadius: number
  separationRadius: number
  mouseInfluence: number
  trails: boolean
  predatorMode: boolean
}

export interface MouseState {
  x: number
  y: number
  active: boolean
}

export interface ScatterState {
  x: number
  y: number
  time: number
}

export interface ModePreset {
  label: string
  description: string
  config: Partial<SimConfig>
}

export interface ModeDefinition {
  id: SimMode
  label: string
  description: string
  icon: string
  defaultConfig: Partial<SimConfig>
  requiresApi: boolean
  apiSource?: string
  pollIntervalMs?: number
  presets: ModePreset[]
  init: (width: number, height: number, data?: any) => Boid[]
  update: (
    boids: Boid[],
    config: SimConfig,
    width: number,
    height: number,
    mouse: MouseState,
    scatter: ScatterState | null,
    data?: any
  ) => void
  render: (
    ctx: CanvasRenderingContext2D,
    boids: Boid[],
    config: SimConfig,
    width: number,
    height: number,
    mouse: MouseState,
    data?: any,
    zoom?: number
  ) => void
}

export const DEFAULT_CONFIG: SimConfig = {
  flockSize: 800,
  separation: 1.5,
  alignment: 1.0,
  cohesion: 1.0,
  maxSpeed: 4,
  perceptionRadius: 60,
  separationRadius: 25,
  mouseInfluence: 200,
  trails: false,
  predatorMode: false,
}
