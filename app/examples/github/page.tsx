'use client'

import SingleModeSimulator from '@/components/SingleModeSimulator'
import { githubMode } from '@/lib/modes/githubMode'

export default function GitHubExample() {
  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-1">{githubMode.icon} GitHub Activity</h1>
        <p className="text-slate-400 text-sm mb-4">{githubMode.description}</p>
        <SingleModeSimulator mode={githubMode} />
      </div>
    </main>
  )
}
