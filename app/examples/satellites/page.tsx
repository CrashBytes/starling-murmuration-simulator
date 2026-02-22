'use client'

import SingleModeSimulator from '@/components/SingleModeSimulator'
import { satellitesMode } from '@/lib/modes/satellitesMode'

export default function SatellitesExample() {
  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-1">{satellitesMode.icon} Satellites</h1>
        <p className="text-slate-400 text-sm mb-4">{satellitesMode.description}</p>
        <SingleModeSimulator mode={satellitesMode} />
      </div>
    </main>
  )
}
