'use client'

import SingleModeSimulator from '@/components/SingleModeSimulator'
import { jobMarketMode } from '@/lib/modes/jobMarketMode'

export default function JobMarketExample() {
  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-1">{jobMarketMode.icon} Job Market</h1>
        <p className="text-slate-400 text-sm mb-4">{jobMarketMode.description}</p>
        <SingleModeSimulator mode={jobMarketMode} />
      </div>
    </main>
  )
}
