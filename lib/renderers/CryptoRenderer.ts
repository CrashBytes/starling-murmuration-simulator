import { Boid, SimConfig, MouseState } from '../types'
import { drawMouseCursor } from '../core'

export function renderCrypto(
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
    ctx.fillStyle = 'rgba(5, 5, 15, 0.1)'
    ctx.fillRect(0, 0, width, height)
  } else {
    const grad = ctx.createLinearGradient(0, 0, width, height)
    grad.addColorStop(0, '#050510')
    grad.addColorStop(0.5, '#0a0a1a')
    grad.addColorStop(1, '#050510')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, width, height)
  }

  // Sector labels
  if (!config.trails) {
    const sectors: Record<string, { x: number; y: number }> = {
      'L1': { x: width * 0.3, y: height * 0.3 },
      'L1-Alt': { x: width * 0.7, y: height * 0.3 },
      'DeFi': { x: width * 0.3, y: height * 0.7 },
      'Stable': { x: width * 0.7, y: height * 0.7 },
      'Meme': { x: width * 0.5, y: height * 0.5 },
      'Payment': { x: width * 0.5, y: height * 0.2 },
    }
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillStyle = 'rgba(148, 163, 184, 0.2)'
    for (const [name, pos] of Object.entries(sectors)) {
      ctx.fillText(name, pos.x, pos.y - 40)
    }
  }

  // Draw boids as circles
  for (const b of boids) {
    const sz = (b.size || 3) / zoom
    ctx.beginPath()
    ctx.arc(b.x, b.y, sz, 0, Math.PI * 2)
    ctx.fillStyle = b.color || 'rgba(148, 163, 184, 0.6)'
    ctx.fill()

    // Symbol label for larger tokens
    if ((b.size || 3) > 5 && b.meta?.symbol) {
      ctx.save()
      ctx.translate(b.x, b.y)
      ctx.scale(1 / zoom, 1 / zoom)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
      ctx.font = '8px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(b.meta.symbol, 0, -((b.size || 3)) - 3)
      ctx.restore()
    }
  }

  drawMouseCursor(ctx, mouse, config, zoom)

  if (boids.length === 0) {
    ctx.fillStyle = 'rgba(148, 163, 184, 0.5)'
    ctx.font = '14px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Loading market data...', width / 2, height / 2)
  }
}
