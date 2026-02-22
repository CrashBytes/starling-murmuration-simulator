import { Boid, SimConfig, MouseState } from '../types'
import { drawMouseCursor } from '../core'

export function renderClassic(
  ctx: CanvasRenderingContext2D,
  boids: Boid[],
  config: SimConfig,
  width: number,
  height: number,
  mouse: MouseState,
  _data?: any,
  zoom: number = 1
): void {
  if (config.trails) {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.15)'
    ctx.fillRect(0, 0, width, height)
  } else {
    const grad = ctx.createLinearGradient(0, 0, 0, height)
    grad.addColorStop(0, '#1e1b4b')
    grad.addColorStop(0.4, '#1e293b')
    grad.addColorStop(1, '#0f172a')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, width, height)
  }

  for (let i = 0; i < boids.length; i++) {
    const b = boids[i]
    const angle = Math.atan2(b.vy, b.vx)
    const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy)
    const t = Math.min(speed / config.maxSpeed, 1)
    const r = Math.round(180 + t * 75)
    const g = Math.round(180 + t * 50)
    const bCol = Math.round(200 + t * 55)
    const alpha = 0.6 + t * 0.4

    ctx.save()
    ctx.translate(b.x, b.y)
    ctx.rotate(angle)
    const size = (2.5 + t * 1.5) / zoom
    ctx.beginPath()
    ctx.moveTo(size * 2, 0)
    ctx.lineTo(-size, -size * 0.7)
    ctx.lineTo(-size * 0.3, 0)
    ctx.lineTo(-size, size * 0.7)
    ctx.closePath()
    ctx.fillStyle = `rgba(${r}, ${g}, ${bCol}, ${alpha})`
    ctx.fill()
    ctx.restore()
  }

  drawMouseCursor(ctx, mouse, config, zoom)
}
