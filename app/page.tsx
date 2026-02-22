import MurmurationSimulator from '@/components/MurmurationSimulator'

export default function Home() {
  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">
          Starling Murmuration Simulator
        </h1>
        <p className="text-slate-400 mb-6">
          An interactive boids simulation with 9 data-driven visualization modes.
          Built with React, Canvas 2D, and Craig Reynolds&apos; flocking algorithm (1986).
        </p>
        <MurmurationSimulator />
      </div>
    </main>
  )
}
