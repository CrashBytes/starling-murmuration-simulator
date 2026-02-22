import { Boid, SimConfig, MouseState } from '../types'
import { drawMouseCursor } from '../core'
import coastlinePolygons from '../data/coastlines.json'
import usStatesPolygons from '../data/us-states.json'
import countryBorderLines from '../data/country-borders.json'
import { AIRPORTS } from '../data/airports'

function toScreen(lon: number, lat: number, w: number, h: number): [number, number] {
  return [((lon + 180) / 360) * w, ((90 - lat) / 180) * h]
}

function drawEarth(ctx: CanvasRenderingContext2D, width: number, height: number, z: number) {
  // Ocean gradient
  const grad = ctx.createLinearGradient(0, 0, 0, height)
  grad.addColorStop(0, '#0a1628')
  grad.addColorStop(0.5, '#0d1f3c')
  grad.addColorStop(1, '#0a1628')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, width, height)

  // Filled land masses from Natural Earth 110m
  for (const poly of coastlinePolygons) {
    ctx.beginPath()
    for (let i = 0; i < poly.length; i++) {
      const [x, y] = toScreen(poly[i][0], poly[i][1], width, height)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.fillStyle = 'rgba(25, 45, 65, 0.5)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(74, 120, 160, 0.3)'
    ctx.lineWidth = 0.5 / z
    ctx.stroke()
  }

  // US state boundaries
  ctx.strokeStyle = 'rgba(74, 120, 160, 0.2)'
  ctx.lineWidth = 0.4 / z
  for (const poly of usStatesPolygons) {
    ctx.beginPath()
    for (let i = 0; i < poly.length; i++) {
      const [x, y] = toScreen(poly[i][0], poly[i][1], width, height)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.stroke()
  }

  // Country border lines
  ctx.strokeStyle = 'rgba(100, 140, 180, 0.25)'
  ctx.lineWidth = 0.6 / z
  for (const line of countryBorderLines) {
    ctx.beginPath()
    for (let i = 0; i < line.length; i++) {
      const [x, y] = toScreen(line[i][0], line[i][1], width, height)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  }

  // Grid lines
  ctx.strokeStyle = 'rgba(50, 70, 100, 0.1)'
  ctx.lineWidth = 0.5 / z
  for (let lat = -60; lat <= 60; lat += 30) {
    const y = ((90 - lat) / 180) * height
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }
  for (let lon = -150; lon <= 150; lon += 30) {
    const x = ((lon + 180) / 360) * width
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }

  // Airports — show based on zoom level and tier
  for (const apt of AIRPORTS) {
    // tier 1: always, tier 2: zoom >= 2, tier 3: zoom >= 5
    if (apt.tier === 2 && z < 2) continue
    if (apt.tier === 3 && z < 5) continue

    const [ax, ay] = toScreen(apt.lon, apt.lat, width, height)
    const dotSize = apt.tier === 1 ? 3 : apt.tier === 2 ? 2 : 1.5

    // Dot
    ctx.beginPath()
    ctx.arc(ax, ay, dotSize / z, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255, 200, 100, 0.6)'
    ctx.fill()

    // IATA code label
    ctx.save()
    ctx.translate(ax, ay)
    ctx.scale(1 / z, 1 / z)
    ctx.fillStyle = apt.tier === 1 ? 'rgba(255, 220, 150, 0.7)' : 'rgba(200, 200, 220, 0.5)'
    ctx.font = apt.tier === 1 ? 'bold 9px sans-serif' : '8px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(apt.code, 0, -dotSize - 4)
    ctx.restore()
  }
}

export function renderFlights(
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
    ctx.fillStyle = 'rgba(10, 22, 40, 0.1)'
    ctx.fillRect(0, 0, width, height)
  } else {
    drawEarth(ctx, width, height, zoom)
  }

  for (const b of boids) {
    const heading = b.meta?.heading || 0
    const angle = (heading * Math.PI) / 180 - Math.PI / 2
    const alt = b.meta?.altitude || 0
    const t = Math.min(alt / 12000, 1)
    const r = Math.round(80 + t * 175)
    const g = Math.round(140 + t * 115)
    const bCol = Math.round(180 + t * 75)
    const sz = (b.size || 3) / zoom

    ctx.save()
    ctx.translate(b.x, b.y)
    ctx.rotate(angle)
    ctx.beginPath()
    ctx.moveTo(sz * 2, 0)
    ctx.lineTo(-sz, -sz * 0.8)
    ctx.lineTo(-sz * 0.4, 0)
    ctx.lineTo(-sz, sz * 0.8)
    ctx.closePath()
    ctx.fillStyle = `rgba(${r}, ${g}, ${bCol}, 0.85)`
    ctx.fill()
    ctx.restore()
  }

  drawMouseCursor(ctx, mouse, config, zoom)

  // Flight count — draw in screen space so text doesn't scale
  if (!config.trails && boids.length > 0) {
    ctx.save()
    ctx.scale(1 / zoom, 1 / zoom)
    ctx.fillStyle = 'rgba(148, 163, 184, 0.4)'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`${boids.length} aircraft tracked`, 12 * zoom, (height - 12) * zoom)
    ctx.restore()
  }

  if (boids.length === 0) {
    ctx.save()
    ctx.scale(1 / zoom, 1 / zoom)
    ctx.fillStyle = 'rgba(148, 163, 184, 0.5)'
    ctx.font = '14px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Loading flight data...', (width / 2) * zoom, (height / 2) * zoom)
    ctx.restore()
  }
}
