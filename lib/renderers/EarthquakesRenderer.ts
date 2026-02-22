import { Boid, SimConfig, MouseState } from '../types'
import { drawMouseCursor } from '../core'
import coastlinePolygons from '../data/coastlines.json'

function drawCoastline(ctx: CanvasRenderingContext2D, width: number, height: number) {
  for (const poly of coastlinePolygons) {
    ctx.beginPath()
    for (let i = 0; i < poly.length; i++) {
      const x = ((poly[i][0] + 180) / 360) * width
      const y = ((90 - poly[i][1]) / 180) * height
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.fillStyle = 'rgba(25, 40, 55, 0.4)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(74, 85, 104, 0.3)'
    ctx.lineWidth = 0.5
    ctx.stroke()
  }
}

export function renderEarthquakes(
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
    ctx.fillStyle = 'rgba(15, 20, 30, 0.1)'
    ctx.fillRect(0, 0, width, height)
  } else {
    ctx.fillStyle = '#0f141e'
    ctx.fillRect(0, 0, width, height)
    drawCoastline(ctx, width, height)
  }

  const now = Date.now()
  for (const b of boids) {
    const sz = b.size || 3
    const age = b.meta?.time ? (now - b.meta.time) / 1000 : 9999
    const pulse = age < 3600 ? 1 + Math.sin(now * 0.005) * 0.3 : 1

    // Outer glow
    ctx.beginPath()
    ctx.arc(b.x, b.y, sz * pulse * 2 / zoom, 0, Math.PI * 2)
    ctx.fillStyle = (b.color || 'rgba(239,68,68,0.8)').replace('0.8', '0.15')
    ctx.fill()

    // Inner circle
    ctx.beginPath()
    ctx.arc(b.x, b.y, sz * pulse / zoom, 0, Math.PI * 2)
    ctx.fillStyle = b.color || 'rgba(239, 68, 68, 0.8)'
    ctx.fill()
  }

  // Magnitude legend
  ctx.font = '9px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillStyle = 'rgba(148, 163, 184, 0.5)'
  ctx.fillText('Depth:', 12, height - 55)
  const depthLegend = [
    { color: 'rgba(239, 68, 68, 0.8)', label: 'Shallow' },
    { color: 'rgba(245, 158, 11, 0.8)', label: 'Medium' },
    { color: 'rgba(96, 165, 250, 0.8)', label: 'Deep' },
  ]
  for (let i = 0; i < depthLegend.length; i++) {
    ctx.fillStyle = depthLegend[i].color
    ctx.beginPath()
    ctx.arc(16, height - 40 + i * 13, 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(148, 163, 184, 0.5)'
    ctx.fillText(depthLegend[i].label, 26, height - 37 + i * 13)
  }

  drawMouseCursor(ctx, mouse, config, zoom)

  if (boids.length === 0) {
    ctx.fillStyle = 'rgba(148, 163, 184, 0.5)'
    ctx.font = '14px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Loading seismic data...', width / 2, height / 2)
  }
}
