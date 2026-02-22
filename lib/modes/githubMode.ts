import { ModeDefinition, Boid, SimConfig, MouseState } from '../types'
import { applyBoidsRules } from '../core'
import { renderGithub } from '../renderers/GitHubRenderer'

const EVENT_COLORS: Record<string, string> = {
  PushEvent: '#22c55e',
  PullRequestEvent: '#3b82f6',
  IssuesEvent: '#eab308',
  ForkEvent: '#a855f7',
  WatchEvent: '#6b7280',
  CreateEvent: '#06b6d4',
  DeleteEvent: '#ef4444',
  ReleaseEvent: '#f97316',
}

function mapGithubData(data: any[], width: number, height: number): Boid[] {
  if (!data?.length) return []
  const boids: Boid[] = []

  // Find top repos as attractors
  const repoCounts: Record<string, number> = {}
  for (const e of data) {
    const repo = e.repo?.name || 'unknown'
    repoCounts[repo] = (repoCounts[repo] || 0) + 1
  }
  const topRepos = Object.entries(repoCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name], i) => ({
      name,
      x: width * 0.15 + (i % 4) * (width * 0.22),
      y: height * 0.3 + Math.floor(i / 4) * (height * 0.35),
    }))

  for (const event of data) {
    const repo = event.repo?.name || 'unknown'
    const type = event.type || 'PushEvent'
    const target = topRepos.find(r => r.name === repo) || topRepos[0]
    if (!target) continue

    boids.push({
      x: target.x + (Math.random() - 0.5) * 120,
      y: target.y + (Math.random() - 0.5) * 120,
      vx: (Math.random() - 0.5) * 3,
      vy: (Math.random() - 0.5) * 3,
      color: EVENT_COLORS[type] || '#6b7280',
      size: 2.5,
      group: repo,
      meta: { type, repo, actor: event.actor?.login, repoTarget: target },
    })
  }
  return boids
}

export const githubMode: ModeDefinition = {
  id: 'github',
  label: 'GitHub',
  description: 'Live event streams',
  icon: '\uD83D\uDCBB',
  requiresApi: true,
  apiSource: 'github',
  pollIntervalMs: 30000,
  defaultConfig: {
    flockSize: 200,
    separation: 1.2,
    alignment: 0.8,
    cohesion: 1.5,
    maxSpeed: 3,
    perceptionRadius: 40,
    trails: false,
  },
  presets: [
    { label: 'Active', description: 'Strong clustering', config: { separation: 1.2, alignment: 0.8, cohesion: 1.5, maxSpeed: 3, trails: false } },
    { label: 'Flow', description: 'Trail paths', config: { separation: 0.8, alignment: 1.2, cohesion: 1.0, maxSpeed: 2, trails: true } },
    { label: 'Scatter', description: 'Loose events', config: { separation: 2.5, alignment: 0.2, cohesion: 0.3, maxSpeed: 5, trails: false } },
  ],
  init: (w, h, data) => data ? mapGithubData(data, w, h) : [],
  update: (boids, config, w, h, mouse, scatter) => {
    // Attract boids toward their repo target
    for (const b of boids) {
      const target = b.meta?.repoTarget
      if (target) {
        const dx = target.x - b.x
        const dy = target.y - b.y
        b.vx += dx * 0.002
        b.vy += dy * 0.002
      }
    }
    applyBoidsRules(boids, config, mouse, scatter, w, h)
  },
  render: renderGithub,
}
