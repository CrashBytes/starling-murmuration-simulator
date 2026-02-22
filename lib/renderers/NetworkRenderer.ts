import { Boid, SimConfig, MouseState } from '../types'

export function renderNetwork(
  ctx: CanvasRenderingContext2D,
  boids: Boid[],
  config: SimConfig,
  width: number,
  height: number,
  mouse: MouseState,
  _data?: any,
  zoom: number = 1
): void {
  const nodes = boids[0]?.meta?.nodes as { name: string; x: number; y: number; color: string }[] | undefined
  const ROUTES = [[0,1],[0,2],[1,3],[2,4],[3,5],[4,6],[3,6],[4,5],[5,7],[6,7]]

  if (config.trails) {
    ctx.fillStyle = 'rgba(8, 12, 20, 0.08)'
    ctx.fillRect(0, 0, width, height)
  } else {
    ctx.fillStyle = '#080c14'
    ctx.fillRect(0, 0, width, height)

    // Circuit trace pattern
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.15)'
    ctx.lineWidth = 1
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke()
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke()
    }
  }

  if (!nodes) return

  // Draw links
  ctx.strokeStyle = 'rgba(71, 85, 105, 0.2)'
  ctx.lineWidth = 1 / zoom
  for (const [a, b] of ROUTES) {
    ctx.beginPath()
    ctx.moveTo(nodes[a].x, nodes[a].y)
    ctx.lineTo(nodes[b].x, nodes[b].y)
    ctx.stroke()
  }

  // Draw nodes
  for (const node of nodes) {
    // Count packets heading here
    let load = 0
    for (const b of boids) {
      if (nodes[b.meta?.dstIdx || 0] === node) load++
    }
    const pulse = Math.sin(Date.now() / 400) * 0.1 + 0.9

    // Glow
    ctx.beginPath()
    ctx.arc(node.x, node.y, (18 + load * 0.5) / zoom, 0, Math.PI * 2)
    ctx.fillStyle = node.color.replace(')', ', 0.08)').replace('rgb', 'rgba')
    ctx.fill()

    // Node circle
    ctx.beginPath()
    ctx.arc(node.x, node.y, 12 * pulse / zoom, 0, Math.PI * 2)
    ctx.fillStyle = node.color
    ctx.globalAlpha = 0.6
    ctx.fill()
    ctx.globalAlpha = 1.0
    ctx.strokeStyle = node.color
    ctx.lineWidth = 1.5 / zoom
    ctx.stroke()

    // Label
    ctx.save()
    ctx.translate(node.x, node.y)
    ctx.scale(1 / zoom, 1 / zoom)
    ctx.fillStyle = 'rgba(203, 213, 225, 0.7)'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(node.name, 0, 24)
    ctx.restore()
  }

  // Draw packets
  for (const b of boids) {
    ctx.beginPath()
    ctx.arc(b.x, b.y, (b.size || 2) / zoom, 0, Math.PI * 2)
    ctx.fillStyle = b.color || '#60a5fa'
    ctx.fill()
  }
}
