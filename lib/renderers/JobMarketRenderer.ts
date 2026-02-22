import { Boid, SimConfig, MouseState } from '../types'
import { drawMouseCursor } from '../core'

const SECTORS = [
  { name: 'Healthcare', growth: 15, color: '#ef4444' },
  { name: 'Tech', growth: 14, color: '#3b82f6' },
  { name: 'Renewables', growth: 11, color: '#22c55e' },
  { name: 'Construction', growth: 4, color: '#f97316' },
  { name: 'Finance', growth: 2, color: '#a78bfa' },
  { name: 'Manufacturing', growth: -2, color: '#6b7280' },
  { name: 'Retail', growth: -3, color: '#eab308' },
  { name: 'Media', growth: -5, color: '#ec4899' },
]

export function renderJobMarket(
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
    ctx.fillStyle = 'rgba(10, 12, 20, 0.1)'
    ctx.fillRect(0, 0, width, height)
  } else {
    ctx.fillStyle = '#0a0c14'
    ctx.fillRect(0, 0, width, height)
  }

  const cols = 4
  const rows = 2
  const cellW = width / cols
  const cellH = height / rows

  // Draw sector zones
  if (!config.trails) {
    for (let si = 0; si < SECTORS.length; si++) {
      const sector = SECTORS[si]
      const col = si % cols
      const row = Math.floor(si / cols)
      const cx = cellW * col + cellW / 2
      const cy = cellH * row + cellH / 2

      // Zone background
      ctx.fillStyle = sector.color.replace(')', ', 0.04)').replace('#', 'rgba(')
        .replace('rgba(', '') // Fallback: just use low alpha
      ctx.globalAlpha = 0.06
      ctx.fillStyle = sector.color
      ctx.fillRect(cellW * col + 4, cellH * row + 4, cellW - 8, cellH - 8)
      ctx.globalAlpha = 1.0

      // Zone border
      ctx.strokeStyle = sector.color
      ctx.globalAlpha = 0.15
      ctx.lineWidth = 1
      ctx.strokeRect(cellW * col + 4, cellH * row + 4, cellW - 8, cellH - 8)
      ctx.globalAlpha = 1.0

      // Sector label
      ctx.fillStyle = sector.color
      ctx.globalAlpha = 0.6
      ctx.font = 'bold 12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(sector.name, cx, cellH * row + 22)

      // Growth indicator
      const growthStr = sector.growth >= 0 ? `+${sector.growth}%` : `${sector.growth}%`
      ctx.fillStyle = sector.growth >= 0 ? 'rgba(34, 197, 94, 0.6)' : 'rgba(239, 68, 68, 0.6)'
      ctx.font = '10px sans-serif'
      ctx.fillText(growthStr, cx, cellH * row + 36)
      ctx.globalAlpha = 1.0
    }
  }

  // Count workers per sector
  const sectorCounts: Record<string, number> = {}
  for (const b of boids) {
    sectorCounts[b.group || ''] = (sectorCounts[b.group || ''] || 0) + 1
  }

  // Draw worker boids
  for (const b of boids) {
    ctx.beginPath()
    ctx.arc(b.x, b.y, (b.size || 2.5) / zoom, 0, Math.PI * 2)
    ctx.fillStyle = b.color || '#6b7280'
    ctx.fill()
  }

  // Worker count labels
  if (!config.trails) {
    for (let si = 0; si < SECTORS.length; si++) {
      const sector = SECTORS[si]
      const col = si % cols
      const row = Math.floor(si / cols)
      const cx = cellW * col + cellW / 2
      const count = sectorCounts[sector.name] || 0
      ctx.fillStyle = 'rgba(148, 163, 184, 0.4)'
      ctx.font = '9px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`${count} workers`, cx, cellH * (row + 1) - 10)
    }
  }

  drawMouseCursor(ctx, mouse, config, zoom)
}
