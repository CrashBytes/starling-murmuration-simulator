'use client'

import SingleModeSimulator from '@/components/SingleModeSimulator'
import { droneSwarmMode } from '@/lib/modes/droneSwarmMode'

export default function DroneSwarmExample() {
  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-1">{droneSwarmMode.icon} Drone Swarm</h1>
        <p className="text-slate-400 text-sm mb-4">{droneSwarmMode.description}</p>
        <SingleModeSimulator mode={droneSwarmMode} />
      </div>
    </main>
  )
}
