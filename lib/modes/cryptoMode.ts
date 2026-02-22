import { ModeDefinition, Boid, SimConfig, MouseState } from '../types'
import { limitSpeed, applyBoidsRules } from '../core'
import { renderCrypto } from '../renderers/CryptoRenderer'

const SECTOR_MAP: Record<string, string> = {
  bitcoin: 'L1', ethereum: 'L1', solana: 'L1-Alt', cardano: 'L1-Alt', avalanche: 'L1-Alt',
  polkadot: 'L1-Alt', chainlink: 'DeFi', uniswap: 'DeFi', aave: 'DeFi', maker: 'DeFi',
  tether: 'Stable', 'usd-coin': 'Stable', dai: 'Stable', dogecoin: 'Meme', shiba: 'Meme',
  ripple: 'Payment', stellar: 'Payment', litecoin: 'Payment',
}

function mapCryptoData(data: any[], width: number, height: number): Boid[] {
  if (!data?.length) return []
  const boids: Boid[] = []
  const sectorPositions: Record<string, { x: number; y: number }> = {
    'L1': { x: width * 0.3, y: height * 0.3 },
    'L1-Alt': { x: width * 0.7, y: height * 0.3 },
    'DeFi': { x: width * 0.3, y: height * 0.7 },
    'Stable': { x: width * 0.7, y: height * 0.7 },
    'Meme': { x: width * 0.5, y: height * 0.5 },
    'Payment': { x: width * 0.5, y: height * 0.2 },
    'Other': { x: width * 0.5, y: height * 0.8 },
  }

  for (const coin of data.slice(0, 100)) {
    const sector = SECTOR_MAP[coin.id] || 'Other'
    const base = sectorPositions[sector]
    const change = coin.price_change_percentage_24h || 0
    const mcap = coin.market_cap || 0
    const sz = Math.max(2, Math.min(10, Math.log10(mcap) - 7))

    boids.push({
      x: base.x + (Math.random() - 0.5) * 100,
      y: base.y + (Math.random() - 0.5) * 100,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      group: sector,
      size: sz,
      color: change >= 0 ? `rgba(34, 197, 94, ${0.5 + Math.min(Math.abs(change) / 20, 0.5)})` : `rgba(239, 68, 68, ${0.5 + Math.min(Math.abs(change) / 20, 0.5)})`,
      meta: { name: coin.name, symbol: (coin.symbol || '').toUpperCase(), price: coin.current_price, change, sector },
    })
  }
  return boids
}

export const cryptoMode: ModeDefinition = {
  id: 'crypto',
  label: 'Crypto',
  description: 'Token market flows',
  icon: '\uD83D\uDCC8',
  requiresApi: true,
  apiSource: 'coingecko',
  pollIntervalMs: 60000,
  defaultConfig: {
    flockSize: 100,
    separation: 1.5,
    alignment: 0.5,
    cohesion: 1.5,
    maxSpeed: 2,
    perceptionRadius: 50,
    separationRadius: 20,
    trails: false,
  },
  presets: [
    { label: 'Clusters', description: 'Sector grouping', config: { separation: 1.5, alignment: 0.5, cohesion: 1.5, maxSpeed: 2, trails: false } },
    { label: 'Scatter', description: 'High volatility', config: { separation: 3.0, alignment: 0.2, cohesion: 0.3, maxSpeed: 4, trails: false } },
    { label: 'Trails', description: 'Price paths', config: { separation: 1.0, alignment: 0.5, cohesion: 1.0, maxSpeed: 2, trails: true } },
  ],
  init: (w, h, data) => data ? mapCryptoData(data, w, h) : [],
  update: (boids, config, w, h, mouse, scatter) => {
    applyBoidsRules(boids, config, mouse, scatter, w, h)
  },
  render: renderCrypto,
}
