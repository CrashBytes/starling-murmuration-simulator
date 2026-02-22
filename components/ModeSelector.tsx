'use client'

import { SimMode, ModeDefinition } from '@/lib/types'

interface ModeSelectorProps {
  modes: ModeDefinition[]
  activeMode: SimMode
  onSelect: (mode: SimMode) => void
}

export default function ModeSelector({ modes, activeMode, onSelect }: ModeSelectorProps) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
      {modes.map(mode => {
        const isActive = mode.id === activeMode
        return (
          <button
            key={mode.id}
            onClick={() => onSelect(mode.id)}
            className={`flex flex-col items-center gap-1 px-2 py-3 rounded-lg border text-center transition-all ${
              isActive
                ? 'border-blue-500 bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/30'
                : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-500 hover:text-gray-300'
            }`}
          >
            <span className="text-xl leading-none">{mode.icon}</span>
            <span className="text-xs font-medium truncate w-full">{mode.label}</span>
          </button>
        )
      })}
    </div>
  )
}
