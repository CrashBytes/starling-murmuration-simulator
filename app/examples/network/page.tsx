'use client'

import SingleModeSimulator from '@/components/SingleModeSimulator'
import { networkMode } from '@/lib/modes/networkMode'

export default function NetworkExample() {
  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-1">{networkMode.icon} Network Traffic</h1>
        <p className="text-slate-400 text-sm mb-4">{networkMode.description}</p>
        <SingleModeSimulator mode={networkMode} />
      </div>
    </main>
  )
}
