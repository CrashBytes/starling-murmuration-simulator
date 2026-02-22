'use client'

import SingleModeSimulator from '@/components/SingleModeSimulator'
import { cryptoMode } from '@/lib/modes/cryptoMode'

export default function CryptoExample() {
  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-1">{cryptoMode.icon} Crypto Markets</h1>
        <p className="text-slate-400 text-sm mb-4">{cryptoMode.description}</p>
        <SingleModeSimulator mode={cryptoMode} />
      </div>
    </main>
  )
}
