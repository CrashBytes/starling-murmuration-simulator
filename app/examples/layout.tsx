import Link from 'next/link'

const examples = [
  { href: '/examples/classic', label: 'Classic', icon: '\uD83D\uDC26' },
  { href: '/examples/flights', label: 'Flights', icon: '\u2708\uFE0F' },
  { href: '/examples/satellites', label: 'Satellites', icon: '\uD83D\uDEF0\uFE0F' },
  { href: '/examples/crypto', label: 'Crypto', icon: '\uD83D\uDCC8' },
  { href: '/examples/github', label: 'GitHub', icon: '\uD83D\uDCBB' },
  { href: '/examples/earthquakes', label: 'Quakes', icon: '\uD83C\uDF0D' },
  { href: '/examples/drone-swarm', label: 'Drones', icon: '\uD83D\uDD79\uFE0F' },
  { href: '/examples/network', label: 'Network', icon: '\uD83C\uDF10' },
  { href: '/examples/job-market', label: 'Jobs', icon: '\uD83D\uDCBC' },
]

export default function ExamplesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <nav className="bg-gray-900 border-b border-gray-700 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-4 overflow-x-auto">
          <Link href="/" className="text-white font-bold whitespace-nowrap hover:text-blue-400 transition-colors">
            All Modes
          </Link>
          <span className="text-gray-600">|</span>
          {examples.map(ex => (
            <Link
              key={ex.href}
              href={ex.href}
              className="text-sm text-gray-400 hover:text-white whitespace-nowrap transition-colors"
            >
              {ex.icon} {ex.label}
            </Link>
          ))}
        </div>
      </nav>
      {children}
    </div>
  )
}
