import { Boid, SimConfig, MouseState, ScatterState } from './types'

export function createBoid(width: number, height: number): Boid {
  const angle = Math.random() * Math.PI * 2
  const speed = 1 + Math.random() * 2
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
  }
}

export function limitSpeed(vx: number, vy: number, max: number): [number, number] {
  const speed = Math.sqrt(vx * vx + vy * vy)
  if (speed > max) {
    return [(vx / speed) * max, (vy / speed) * max]
  }
  if (speed < 0.5) {
    return speed === 0 ? [max * 0.5, 0] : [(vx / speed) * 0.5, (vy / speed) * 0.5]
  }
  return [vx, vy]
}

export function applyBoidsRules(
  boids: Boid[],
  config: SimConfig,
  mouse: MouseState,
  scatter: ScatterState | null,
  width: number,
  height: number
): void {
  const len = boids.length
  const cellSize = config.perceptionRadius
  const cols = Math.ceil(width / cellSize) + 1
  const grid: Map<number, number[]> = new Map()

  for (let i = 0; i < len; i++) {
    const col = Math.floor(boids[i].x / cellSize)
    const row = Math.floor(boids[i].y / cellSize)
    const key = row * cols + col
    const cell = grid.get(key)
    if (cell) cell.push(i)
    else grid.set(key, [i])
  }

  const pr2 = config.perceptionRadius * config.perceptionRadius
  const sr2 = config.separationRadius * config.separationRadius
  const now = performance.now()

  for (let i = 0; i < len; i++) {
    const b = boids[i]
    let sepX = 0, sepY = 0, aliX = 0, aliY = 0, cohX = 0, cohY = 0
    let sepCount = 0, neighborCount = 0

    const col = Math.floor(b.x / cellSize)
    const row = Math.floor(b.y / cellSize)

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const key = (row + dr) * cols + (col + dc)
        const cell = grid.get(key)
        if (!cell) continue
        for (let j = 0; j < cell.length; j++) {
          const idx = cell[j]
          if (idx === i) continue
          const other = boids[idx]
          const dx = other.x - b.x
          const dy = other.y - b.y
          const d2 = dx * dx + dy * dy
          if (d2 < pr2 && d2 > 0) {
            neighborCount++
            aliX += other.vx
            aliY += other.vy
            cohX += other.x
            cohY += other.y
            if (d2 < sr2) {
              const d = Math.sqrt(d2)
              sepX -= dx / d
              sepY -= dy / d
              sepCount++
            }
          }
        }
      }
    }

    let steerX = 0, steerY = 0

    if (neighborCount > 0) {
      if (sepCount > 0) {
        steerX += (sepX / sepCount) * config.separation
        steerY += (sepY / sepCount) * config.separation
      }
      aliX /= neighborCount
      aliY /= neighborCount
      steerX += (aliX - b.vx) * config.alignment * 0.05
      steerY += (aliY - b.vy) * config.alignment * 0.05
      cohX /= neighborCount
      cohY /= neighborCount
      steerX += (cohX - b.x) * config.cohesion * 0.001
      steerY += (cohY - b.y) * config.cohesion * 0.001
    }

    if (mouse.active) {
      const dx = mouse.x - b.x
      const dy = mouse.y - b.y
      const d = Math.sqrt(dx * dx + dy * dy)
      if (d < config.mouseInfluence && d > 0) {
        const force = ((config.mouseInfluence - d) / config.mouseInfluence) * 0.15
        if (config.predatorMode) {
          steerX -= (dx / d) * force
          steerY -= (dy / d) * force
        } else {
          steerX += (dx / d) * force
          steerY += (dy / d) * force
        }
      }
    }

    if (scatter && now - scatter.time < 500) {
      const dx = b.x - scatter.x
      const dy = b.y - scatter.y
      const d = Math.sqrt(dx * dx + dy * dy)
      if (d < 250 && d > 0) {
        const force = ((250 - d) / 250) * 2.0
        steerX += (dx / d) * force
        steerY += (dy / d) * force
      }
    }

    const margin = 80
    if (b.x < margin) steerX += (margin - b.x) * 0.005
    if (b.x > width - margin) steerX -= (b.x - (width - margin)) * 0.005
    if (b.y < margin) steerY += (margin - b.y) * 0.005
    if (b.y > height - margin) steerY -= (b.y - (height - margin)) * 0.005

    b.vx += steerX
    b.vy += steerY
    ;[b.vx, b.vy] = limitSpeed(b.vx, b.vy, config.maxSpeed)

    b.x += b.vx
    b.y += b.vy

    if (b.x < -20) b.x = width + 20
    if (b.x > width + 20) b.x = -20
    if (b.y < -20) b.y = height + 20
    if (b.y > height + 20) b.y = -20
  }
}

export function drawMouseCursor(
  ctx: CanvasRenderingContext2D,
  mouse: MouseState,
  config: SimConfig,
  zoom: number = 1
): void {
  if (!mouse.active) return
  ctx.beginPath()
  ctx.arc(mouse.x, mouse.y, config.mouseInfluence / zoom, 0, Math.PI * 2)
  ctx.strokeStyle = config.predatorMode
    ? 'rgba(239, 68, 68, 0.15)'
    : 'rgba(147, 197, 253, 0.15)'
  ctx.lineWidth = 1 / zoom
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(mouse.x, mouse.y, 3 / zoom, 0, Math.PI * 2)
  ctx.fillStyle = config.predatorMode
    ? 'rgba(239, 68, 68, 0.5)'
    : 'rgba(147, 197, 253, 0.5)'
  ctx.fill()
}
