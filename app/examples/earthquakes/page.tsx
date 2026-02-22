'use client'

import SingleModeSimulator from '@/components/SingleModeSimulator'
import { earthquakesMode } from '@/lib/modes/earthquakesMode'

export default function EarthquakesExample() {
  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-1">{earthquakesMode.icon} Earthquakes</h1>
        <p className="text-slate-400 text-sm mb-4">{earthquakesMode.description}</p>
        <SingleModeSimulator mode={earthquakesMode} />
      </div>
    </main>
  )
}
