import { Boid, SimConfig, MouseState } from '../types'
import { drawMouseCursor } from '../core'

export function renderDroneSwarm(
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
    ctx.fillStyle = 'rgba(10, 15, 25, 0.08)'
    ctx.fillRect(0, 0, width, height)
  } else {
    ctx.fillStyle = '#0a0f19'
    ctx.fillRect(0, 0, width, height)

    // Grid
    ctx.strokeStyle = 'rgba(30, 58, 95, 0.2)'
    ctx.lineWidth = 0.5
    const gs = 50
    for (let x = 0; x < width; x += gs) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke()
    }
    for (let y = 0; y < height; y += gs) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke()
    }
  }

  // Mouse waypoint indicator
  if (mouse.active) {
    ctx.beginPath()
    ctx.arc(mouse.x, mouse.y, 12, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)'
    ctx.lineWidth = 2
    ctx.stroke()
    // Crosshair
    ctx.beginPath()
    ctx.moveTo(mouse.x - 8, mouse.y); ctx.lineTo(mouse.x + 8, mouse.y)
    ctx.moveTo(mouse.x, mouse.y - 8); ctx.lineTo(mouse.x, mouse.y + 8)
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)'
    ctx.lineWidth = 1
    ctx.stroke()
  }

  // Draw drones as X-shapes
  for (const b of boids) {
    const angle = Math.atan2(b.vy, b.vx)
    const sz = (b.size || 4) / zoom

    ctx.save()
    ctx.translate(b.x, b.y)
    ctx.rotate(angle + Math.PI / 4)

    // Drone arms
    ctx.strokeStyle = b.color || '#06b6d4'
    ctx.lineWidth = 1.5 / zoom
    ctx.beginPath()
    ctx.moveTo(-sz, 0); ctx.lineTo(sz, 0)
    ctx.moveTo(0, -sz); ctx.lineTo(0, sz)
    ctx.stroke()

    // Rotors
    ctx.beginPath()
    ctx.arc(-sz, 0, 2 / zoom, 0, Math.PI * 2)
    ctx.arc(sz, 0, 2 / zoom, 0, Math.PI * 2)
    ctx.arc(0, -sz, 2 / zoom, 0, Math.PI * 2)
    ctx.arc(0, sz, 2 / zoom, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(6, 182, 212, 0.4)'
    ctx.fill()

    // Center body
    ctx.beginPath()
    ctx.arc(0, 0, 2 / zoom, 0, Math.PI * 2)
    ctx.fillStyle = b.color || '#06b6d4'
    ctx.fill()

    ctx.restore()
  }

  // Instructions
  if (!config.trails) {
    ctx.fillStyle = 'rgba(148, 163, 184, 0.3)'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Move mouse to set waypoint — drones follow', width / 2, height - 16)
  }
}
