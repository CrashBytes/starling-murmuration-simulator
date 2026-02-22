import { Boid, SimConfig, MouseState } from '../types'
import { drawMouseCursor } from '../core'

export function renderGithub(
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
    ctx.fillStyle = 'rgba(13, 17, 23, 0.12)'
    ctx.fillRect(0, 0, width, height)
  } else {
    ctx.fillStyle = '#0d1117'
    ctx.fillRect(0, 0, width, height)

    // Grid pattern
    ctx.strokeStyle = 'rgba(48, 54, 61, 0.3)'
    ctx.lineWidth = 0.5
    const gridSize = 30
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }
  }

  // Find repo targets and draw them
  const repoTargets = new Map<string, { x: number; y: number; count: number }>()
  for (const b of boids) {
    const target = b.meta?.repoTarget
    if (target && !repoTargets.has(target.name)) {
      let count = 0
      for (const ob of boids) {
        if (ob.meta?.repo === target.name) count++
      }
      repoTargets.set(target.name, { x: target.x, y: target.y, count })
    }
  }

  // Draw repo attractor circles
  for (const [name, info] of repoTargets) {
    const pulse = Math.sin(Date.now() / 500) * 0.15 + 0.85
    const radius = 20 + info.count * 1.5
    ctx.beginPath()
    ctx.arc(info.x, info.y, radius * pulse, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(88, 166, 255, 0.08)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(88, 166, 255, 0.2)'
    ctx.lineWidth = 1
    ctx.stroke()

    // Repo name
    const shortName = name.split('/')[1] || name
    ctx.fillStyle = 'rgba(139, 148, 158, 0.6)'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(shortName, info.x, info.y + radius + 14)
  }

  // Draw event boids
  for (const b of boids) {
    ctx.beginPath()
    ctx.arc(b.x, b.y, (b.size || 2.5) / zoom, 0, Math.PI * 2)
    ctx.fillStyle = b.color || '#6b7280'
    ctx.fill()
  }

  // Legend
  const legend = [
    { color: '#22c55e', label: 'Push' },
    { color: '#3b82f6', label: 'PR' },
    { color: '#eab308', label: 'Issue' },
    { color: '#a855f7', label: 'Fork' },
    { color: '#06b6d4', label: 'Create' },
  ]
  ctx.font = '9px sans-serif'
  ctx.textAlign = 'left'
  for (let i = 0; i < legend.length; i++) {
    ctx.fillStyle = legend[i].color
    ctx.beginPath()
    ctx.arc(16, height - 70 + i * 13, 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(139, 148, 158, 0.6)'
    ctx.fillText(legend[i].label, 26, height - 67 + i * 13)
  }

  drawMouseCursor(ctx, mouse, config, zoom)

  if (boids.length === 0) {
    ctx.fillStyle = 'rgba(139, 148, 158, 0.5)'
    ctx.font = '14px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Loading GitHub events...', width / 2, height / 2)
  }
}
