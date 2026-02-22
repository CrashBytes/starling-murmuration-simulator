'use client'

import SingleModeSimulator from '@/components/SingleModeSimulator'
import { flightsMode } from '@/lib/modes/flightsMode'

export default function FlightsExample() {
  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-1">{flightsMode.icon} Live Flights</h1>
        <p className="text-slate-400 text-sm mb-4">{flightsMode.description}</p>
        <SingleModeSimulator mode={flightsMode} />
      </div>
    </main>
  )
}
