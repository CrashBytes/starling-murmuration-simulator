'use client'

import SingleModeSimulator from '@/components/SingleModeSimulator'
import { classicMode } from '@/lib/modes/classicMode'

export default function ClassicExample() {
  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-1">{classicMode.icon} Classic Boids</h1>
        <p className="text-slate-400 text-sm mb-4">{classicMode.description}</p>
        <SingleModeSimulator mode={classicMode} />
      </div>
    </main>
  )
}
