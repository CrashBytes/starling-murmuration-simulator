import { Boid, SimConfig, MouseState } from '../types'
import { drawMouseCursor } from '../core'

let stars: { x: number; y: number; s: number }[] = []
let starsW = 0
let starsH = 0

function ensureStars(width: number, height: number) {
  if (starsW === width && starsH === height && stars.length > 0) return
  starsW = width
  starsH = height
  stars = []
  for (let i = 0; i < 300; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      s: Math.random() * 1.5 + 0.5,
    })
  }
}

export function renderSatellites(
  ctx: CanvasRenderingContext2D,
  boids: Boid[],
  config: SimConfig,
  width: number,
  height: number,
  mouse: MouseState,
  _data?: any,
  zoom: number = 1
): void {
  const cx = width / 2
  const cy = height / 2
  const earthRadius = Math.min(width, height) * 0.25

  if (config.trails) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)'
    ctx.fillRect(0, 0, width, height)
  } else {
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, width, height)

    // Stars
    ensureStars(width, height)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    for (const star of stars) {
      ctx.beginPath()
      ctx.arc(star.x, star.y, star.s, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // Orbit rings
  const baseR = earthRadius
  const shells = [
    { r: baseR + (340 / 1200) * baseR * 1.8, color: 'rgba(74, 222, 128, 0.1)' },
    { r: baseR + (540 / 1200) * baseR * 1.8, color: 'rgba(96, 165, 250, 0.1)' },
    { r: baseR + (1200 / 1200) * baseR * 1.8, color: 'rgba(167, 139, 250, 0.1)' },
  ]
  for (const shell of shells) {
    ctx.beginPath()
    ctx.arc(cx, cy, shell.r, 0, Math.PI * 2)
    ctx.strokeStyle = shell.color
    ctx.setLineDash([4 / zoom, 8 / zoom])
    ctx.lineWidth = 1 / zoom
    ctx.stroke()
    ctx.setLineDash([])
  }

  // Earth circle
  const earthGrad = ctx.createRadialGradient(cx - earthRadius * 0.3, cy - earthRadius * 0.3, earthRadius * 0.1, cx, cy, earthRadius)
  earthGrad.addColorStop(0, '#3b82f6')
  earthGrad.addColorStop(0.4, '#2563eb')
  earthGrad.addColorStop(0.7, '#1d4ed8')
  earthGrad.addColorStop(1, '#1e3a5f')
  ctx.beginPath()
  ctx.arc(cx, cy, earthRadius, 0, Math.PI * 2)
  ctx.fillStyle = earthGrad
  ctx.fill()

  // Atmosphere glow
  const glowGrad = ctx.createRadialGradient(cx, cy, earthRadius * 0.95, cx, cy, earthRadius * 1.15)
  glowGrad.addColorStop(0, 'rgba(59, 130, 246, 0.3)')
  glowGrad.addColorStop(1, 'rgba(59, 130, 246, 0)')
  ctx.beginPath()
  ctx.arc(cx, cy, earthRadius * 1.15, 0, Math.PI * 2)
  ctx.fillStyle = glowGrad
  ctx.fill()

  // Simple continent hints (green patches)
  ctx.globalAlpha = 0.25
  ctx.fillStyle = '#22c55e'
  // North America-ish
  ctx.beginPath()
  ctx.ellipse(cx - earthRadius * 0.35, cy - earthRadius * 0.25, earthRadius * 0.25, earthRadius * 0.18, -0.3, 0, Math.PI * 2)
  ctx.fill()
  // Europe/Africa-ish
  ctx.beginPath()
  ctx.ellipse(cx + earthRadius * 0.15, cy - earthRadius * 0.1, earthRadius * 0.12, earthRadius * 0.35, 0.1, 0, Math.PI * 2)
  ctx.fill()
  // Asia-ish
  ctx.beginPath()
  ctx.ellipse(cx + earthRadius * 0.45, cy - earthRadius * 0.2, earthRadius * 0.2, earthRadius * 0.15, 0.2, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1.0

  // Draw satellites
  for (const b of boids) {
    if (b.group === 'ISS') {
      // ISS — larger, labeled
      ctx.beginPath()
      ctx.arc(b.x, b.y, 4 / zoom, 0, Math.PI * 2)
      ctx.fillStyle = '#fbbf24'
      ctx.fill()
      ctx.beginPath()
      ctx.arc(b.x, b.y, 7 / zoom, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)'
      ctx.lineWidth = 1.5 / zoom
      ctx.stroke()
      ctx.fillStyle = 'rgba(251, 191, 36, 0.8)'
      ctx.save()
      ctx.translate(b.x, b.y)
      ctx.scale(1 / zoom, 1 / zoom)
      ctx.font = '10px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('ISS', 0, -12)
      ctx.restore()
    } else {
      ctx.beginPath()
      ctx.arc(b.x, b.y, (b.size || 1.5) / zoom, 0, Math.PI * 2)
      ctx.fillStyle = b.color || '#60a5fa'
      ctx.fill()
    }
  }

  // Legend
  ctx.font = '10px sans-serif'
  ctx.textAlign = 'left'
  const legendY = height - 60
  const legendItems = [
    { color: '#4ade80', label: 'LEO-1 (340km)' },
    { color: '#60a5fa', label: 'LEO-2 (540km)' },
    { color: '#a78bfa', label: 'MEO (1200km)' },
    { color: '#fbbf24', label: 'ISS' },
  ]
  for (let i = 0; i < legendItems.length; i++) {
    ctx.fillStyle = legendItems[i].color
    ctx.beginPath()
    ctx.arc(16, legendY + i * 14, 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(148, 163, 184, 0.7)'
    ctx.fillText(legendItems[i].label, 26, legendY + i * 14 + 3)
  }

  drawMouseCursor(ctx, mouse, config, zoom)
}
