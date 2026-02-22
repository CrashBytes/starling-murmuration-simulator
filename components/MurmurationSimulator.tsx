'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  SimMode,
  SimConfig,
  Boid,
  MouseState,
  ScatterState,
  ModeDefinition,
  DEFAULT_CONFIG,
} from '@/lib/types'
import { useDataFetcher } from '@/lib/useDataFetcher'
import ModeSelector from './ModeSelector'

import { createBoid } from '@/lib/core'
import { classicMode } from '@/lib/modes/classicMode'
import { flightsMode } from '@/lib/modes/flightsMode'
import { satellitesMode } from '@/lib/modes/satellitesMode'
import { cryptoMode } from '@/lib/modes/cryptoMode'
import { githubMode } from '@/lib/modes/githubMode'
import { earthquakesMode } from '@/lib/modes/earthquakesMode'
import { droneSwarmMode } from '@/lib/modes/droneSwarmMode'
import { networkMode } from '@/lib/modes/networkMode'
import { jobMarketMode } from '@/lib/modes/jobMarketMode'

const ALL_MODES: ModeDefinition[] = [
  classicMode,
  flightsMode,
  satellitesMode,
  cryptoMode,
  githubMode,
  earthquakesMode,
  droneSwarmMode,
  networkMode,
  jobMarketMode,
]

const MODE_MAP = Object.fromEntries(ALL_MODES.map(m => [m.id, m])) as Record<SimMode, ModeDefinition>

interface ViewState {
  zoom: number
  offsetX: number
  offsetY: number
}

export default function MurmurationSimulator() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const boidsRef = useRef<Boid[]>([])
  const mouseRef = useRef<MouseState>({ x: 0, y: 0, active: false })
  const scatterRef = useRef<ScatterState | null>(null)
  const animFrameRef = useRef<number>(0)
  const configRef = useRef<SimConfig>({ ...DEFAULT_CONFIG })
  const activeModeRef = useRef<SimMode>('classic')
  const dimsRef = useRef<{ w: number; h: number }>({ w: 800, h: 600 })

  // Zoom/pan state
  const viewRef = useRef<ViewState>({ zoom: 1, offsetX: 0, offsetY: 0 })
  const dragRef = useRef<{ active: boolean; startX: number; startY: number; startOX: number; startOY: number }>({
    active: false, startX: 0, startY: 0, startOX: 0, startOY: 0,
  })
  const [zoomLevel, setZoomLevel] = useState(1)

  const [activeMode, setActiveMode] = useState<SimMode>('classic')
  const [config, setConfig] = useState<SimConfig>({ ...DEFAULT_CONFIG })
  const [fps, setFps] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const isPausedRef = useRef(false)

  const mode = MODE_MAP[activeMode]

  // Data fetching for API-driven modes
  const { data: apiData, loading: apiLoading, error: apiError } = useDataFetcher(
    mode.requiresApi ? (mode.apiSource || null) : null,
    mode.pollIntervalMs || 30000
  )

  // Keep refs in sync
  useEffect(() => { configRef.current = config }, [config])
  useEffect(() => { isPausedRef.current = isPaused }, [isPaused])
  useEffect(() => { activeModeRef.current = activeMode }, [activeMode])

  // Initialize boids for active mode
  const initBoids = useCallback((w: number, h: number, modeDef: ModeDefinition, data?: any) => {
    boidsRef.current = modeDef.init(w, h, data)
  }, [])

  // Mode switching — clear stale data and reset zoom
  useEffect(() => {
    const modeDef = MODE_MAP[activeMode]
    const merged = { ...DEFAULT_CONFIG, ...modeDef.defaultConfig }
    setConfig(merged)
    configRef.current = merged
    prevDataRef.current = null
    apiDataRef.current = null
    viewRef.current = { zoom: 1, offsetX: 0, offsetY: 0 }
    setZoomLevel(1)
    const { w, h } = dimsRef.current
    initBoids(w, h, modeDef, undefined)
  }, [activeMode, initBoids]) // eslint-disable-line react-hooks/exhaustive-deps

  // Re-init when API data arrives (for API modes)
  const prevDataRef = useRef<any>(null)
  const apiDataRef = useRef<any>(null)
  useEffect(() => {
    apiDataRef.current = apiData
    if (apiData && apiData !== prevDataRef.current && mode.requiresApi) {
      prevDataRef.current = apiData
      const { w, h } = dimsRef.current
      if (boidsRef.current.length === 0) {
        initBoids(w, h, mode, apiData)
      }
    }
  }, [apiData, mode, initBoids])

  // Resize handler
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const container = canvas.parentElement
    if (!container) return
    const rect = container.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`
    const ctx = canvas.getContext('2d')
    if (ctx) ctx.scale(dpr, dpr)
    dimsRef.current = { w: rect.width, h: rect.height }
  }, [])

  // Convert screen coords to world coords
  const screenToWorld = useCallback((sx: number, sy: number): { x: number; y: number } => {
    const v = viewRef.current
    return { x: (sx - v.offsetX) / v.zoom, y: (sy - v.offsetY) / v.zoom }
  }, [])

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    handleResize()
    window.addEventListener('resize', handleResize)

    const { w, h } = dimsRef.current
    initBoids(w, h, MODE_MAP[activeModeRef.current], apiDataRef.current)

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let lastTime = performance.now()
    let frameCount = 0
    let fpsTimer = 0

    const animate = (now: number) => {
      const dt = now - lastTime
      lastTime = now
      frameCount++
      fpsTimer += dt

      if (fpsTimer >= 1000) {
        setFps(frameCount)
        frameCount = 0
        fpsTimer = 0
      }

      const currentMode = MODE_MAP[activeModeRef.current]
      const { w, h } = dimsRef.current
      const latestData = apiDataRef.current
      const v = viewRef.current

      if (!isPausedRef.current) {
        currentMode.update(
          boidsRef.current,
          configRef.current,
          w, h,
          mouseRef.current,
          scatterRef.current,
          latestData
        )
      }

      // Clear entire canvas before transform (prevents ghosting at edges)
      ctx.clearRect(0, 0, w, h)

      // Apply zoom/pan transform
      ctx.save()
      ctx.translate(v.offsetX, v.offsetY)
      ctx.scale(v.zoom, v.zoom)

      currentMode.render(ctx, boidsRef.current, configRef.current, w, h, mouseRef.current, latestData, v.zoom)

      ctx.restore()

      // Draw zoom indicator (outside transform)
      if (v.zoom > 1.01) {
        ctx.fillStyle = 'rgba(148, 163, 184, 0.4)'
        ctx.font = '10px sans-serif'
        ctx.textAlign = 'right'
        ctx.fillText(`${v.zoom.toFixed(1)}x zoom — scroll to zoom, drag to pan, dbl-click to reset`, w - 12, h - 12)
      }

      animFrameRef.current = requestAnimationFrame(animate)
    }

    animFrameRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animFrameRef.current)
    }
  }, [handleResize, initBoids]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync flock size changes
  useEffect(() => {
    const boids = boidsRef.current
    const target = config.flockSize
    const { w, h } = dimsRef.current
    const modeDef = MODE_MAP[activeMode]

    if (modeDef.id === 'classic') {
      if (boids.length < target) {
        for (let i = boids.length; i < target; i++) boids.push(createBoid(w, h))
      } else if (boids.length > target) {
        boids.length = target
      }
    }
  }, [config.flockSize, activeMode])

  // Native wheel handler (must be non-passive to preventDefault on trackpads)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = canvas.getBoundingClientRect()
      const cx = e.clientX - rect.left
      const cy = e.clientY - rect.top

      const v = viewRef.current
      const raw = Math.abs(e.deltaY)
      const step = Math.min(raw, 50) / 50
      const factor = e.deltaY < 0 ? 1 + step * 0.1 : 1 / (1 + step * 0.1)
      const newZoom = Math.max(0.5, Math.min(v.zoom * factor, 50))

      const worldX = (cx - v.offsetX) / v.zoom
      const worldY = (cy - v.offsetY) / v.zoom
      viewRef.current = {
        zoom: newZoom,
        offsetX: cx - worldX * newZoom,
        offsetY: cy - worldY * newZoom,
      }
      setZoomLevel(newZoom)
    }

    canvas.addEventListener('wheel', handleWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', handleWheel)
  }, [])

  // Mouse handlers with drag-to-pan
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const v = viewRef.current
    dragRef.current = {
      active: true,
      startX: e.clientX - rect.left,
      startY: e.clientY - rect.top,
      startOX: v.offsetX,
      startOY: v.offsetY,
    }
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const sx = e.clientX - rect.left
    const sy = e.clientY - rect.top

    if (dragRef.current.active) {
      const dx = sx - dragRef.current.startX
      const dy = sy - dragRef.current.startY
      viewRef.current.offsetX = dragRef.current.startOX + dx
      viewRef.current.offsetY = dragRef.current.startOY + dy
      mouseRef.current.active = false
    } else {
      const world = screenToWorld(sx, sy)
      mouseRef.current = { x: world.x, y: world.y, active: true }
    }
  }, [screenToWorld])

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const d = dragRef.current
    if (d.active) {
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const sx = e.clientX - rect.left
      const sy = e.clientY - rect.top
      const moved = Math.abs(sx - d.startX) + Math.abs(sy - d.startY)

      if (moved < 5) {
        const world = screenToWorld(sx, sy)
        scatterRef.current = { x: world.x, y: world.y, time: performance.now() }
      }
    }
    dragRef.current.active = false
  }, [screenToWorld])

  const handleMouseLeave = useCallback(() => {
    mouseRef.current.active = false
    dragRef.current.active = false
  }, [])

  const handleDoubleClick = useCallback(() => {
    viewRef.current = { zoom: 1, offsetX: 0, offsetY: 0 }
    setZoomLevel(1)
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const touch = e.touches[0]
    const sx = touch.clientX - rect.left
    const sy = touch.clientY - rect.top
    const world = screenToWorld(sx, sy)
    mouseRef.current = { x: world.x, y: world.y, active: true }
  }, [screenToWorld])

  const handleTouchEnd = useCallback(() => { mouseRef.current.active = false }, [])

  const updateConfig = useCallback((key: keyof SimConfig, value: number | boolean) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }, [])

  const resetConfig = useCallback(() => {
    const modeDef = MODE_MAP[activeModeRef.current]
    const merged = { ...DEFAULT_CONFIG, ...modeDef.defaultConfig }
    setConfig(merged)
    viewRef.current = { zoom: 1, offsetX: 0, offsetY: 0 }
    setZoomLevel(1)
    const { w, h } = dimsRef.current
    initBoids(w, h, modeDef, apiDataRef.current)
  }, [initBoids])

  const switchMode = useCallback((newMode: SimMode) => {
    setActiveMode(newMode)
    setIsPaused(false)
  }, [])

  const hintText = zoomLevel > 1.01
    ? 'Scroll to zoom | Drag to pan | Double-click to reset'
    : mode.id === 'drone-swarm'
      ? 'Move mouse to set waypoint | Click to scatter'
      : config.predatorMode
        ? 'Predator mode | Click to scatter'
        : 'Scroll to zoom | Move mouse to attract | Click to scatter'

  return (
    <div className="space-y-4">
      {/* Mode Selector */}
      <div className="bg-gray-900 rounded-lg border border-gray-700 p-3">
        <ModeSelector modes={ALL_MODES} activeMode={activeMode} onSelect={switchMode} />
      </div>

      {/* Canvas */}
      <div className="relative rounded-lg overflow-hidden border border-gray-700 bg-slate-900">
        <div className="relative" style={{ height: '60vh', minHeight: '400px' }}>
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full cursor-crosshair"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onDoubleClick={handleDoubleClick}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />
          <div className="absolute top-3 left-3 text-xs text-slate-400 font-mono pointer-events-none select-none">
            {fps} FPS | {boidsRef.current.length} agents{zoomLevel > 1.01 ? ` | ${zoomLevel.toFixed(1)}x` : ''}
          </div>
          <div className="absolute top-3 right-3 flex items-center gap-2 pointer-events-none select-none">
            {mode.requiresApi && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                apiLoading ? 'bg-yellow-500/20 text-yellow-400' :
                apiError ? 'bg-red-500/20 text-red-400' :
                'bg-green-500/20 text-green-400'
              }`}>
                {apiLoading ? 'Loading...' : apiError ? 'Data error' : 'Live'}
              </span>
            )}
            <span className="text-xs text-slate-500">{hintText}</span>
          </div>
          {isPaused && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-white/30 text-2xl font-bold tracking-widest">PAUSED</span>
            </div>
          )}
        </div>
      </div>

      {/* Presets */}
      {mode.presets.length > 0 && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Presets</h3>
          <div className="flex flex-wrap gap-2">
            {mode.presets.map(preset => (
              <button
                key={preset.label}
                onClick={() => {
                  const merged = { ...DEFAULT_CONFIG, ...mode.defaultConfig, ...preset.config }
                  setConfig(merged)
                  if (preset.config.flockSize) {
                    const { w, h } = dimsRef.current
                    initBoids(w, h, mode, apiDataRef.current)
                  }
                }}
                className="px-3 py-2 text-sm rounded-lg border border-gray-600 text-gray-300 hover:border-blue-400 hover:text-blue-400 transition-colors text-center"
              >
                <div className="font-medium">{preset.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{preset.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-white">Controls</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setIsPaused(p => !p)}
              className="px-3 py-1.5 text-sm rounded-md border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors"
            >
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            <button
              onClick={resetConfig}
              className="px-3 py-1.5 text-sm rounded-md border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Slider label="Separation" value={config.separation} min={0} max={5} step={0.1}
            description="Avoid crowding neighbors"
            onChange={v => updateConfig('separation', v)} format={v => v.toFixed(1)} />
          <Slider label="Alignment" value={config.alignment} min={0} max={5} step={0.1}
            description="Match neighbor heading"
            onChange={v => updateConfig('alignment', v)} format={v => v.toFixed(1)} />
          <Slider label="Cohesion" value={config.cohesion} min={0} max={5} step={0.1}
            description="Move toward group center"
            onChange={v => updateConfig('cohesion', v)} format={v => v.toFixed(1)} />
          <Slider label="Max Speed" value={config.maxSpeed} min={1} max={10} step={0.5}
            onChange={v => updateConfig('maxSpeed', v)} format={v => v.toFixed(1)} />
          <Slider label="Perception" value={config.perceptionRadius} min={20} max={150} step={5}
            description="How far each agent can see"
            onChange={v => updateConfig('perceptionRadius', v)} format={v => `${v}px`} />
          {mode.id === 'classic' && (
            <Slider label="Flock Size" value={config.flockSize} min={100} max={3000} step={50}
              onChange={v => updateConfig('flockSize', v)} format={v => `${v}`} />
          )}
        </div>

        <div className="flex flex-wrap gap-3 mt-6 pt-5 border-t border-gray-700">
          <button
            onClick={() => updateConfig('trails', !config.trails)}
            className={`px-4 py-2 text-sm rounded-md border transition-colors ${
              config.trails
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'border-gray-600 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Trails {config.trails ? 'On' : 'Off'}
          </button>
          <button
            onClick={() => updateConfig('predatorMode', !config.predatorMode)}
            className={`px-4 py-2 text-sm rounded-md border transition-colors ${
              config.predatorMode
                ? 'bg-red-600 border-red-600 text-white'
                : 'border-gray-600 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Predator {config.predatorMode ? 'On' : 'Off'}
          </button>
        </div>
      </div>

      {/* About */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-3">
          About the Algorithm
        </h3>
        <div className="text-sm text-gray-400 space-y-3">
          <p>
            This simulation implements{' '}
            <strong className="text-gray-300">Craig Reynolds&apos; boids algorithm</strong>{' '}
            (1986), which models flocking behavior using three simple rules applied to each
            individual agent:
          </p>
          <ul className="space-y-1 list-disc list-inside">
            <li><strong className="text-gray-300">Separation</strong> &mdash; steer away from neighbors that are too close</li>
            <li><strong className="text-gray-300">Alignment</strong> &mdash; match the average velocity of nearby neighbors</li>
            <li><strong className="text-gray-300">Cohesion</strong> &mdash; move toward the average position of nearby neighbors</li>
          </ul>
          <p>
            Each mode applies these rules to different data domains &mdash; from starling flocks
            to satellite orbits, earthquake waves, and workforce migration. Simple local rules
            generate complex, emergent global patterns.
          </p>
        </div>
      </div>
    </div>
  )
}

function Slider({ label, value, min, max, step, description, onChange, format }: {
  label: string
  value: number
  min: number
  max: number
  step: number
  description?: string
  onChange: (v: number) => void
  format: (v: number) => string
}) {
  return (
    <div>
      <label className="flex items-center justify-between text-sm font-medium text-gray-300 mb-2">
        <span>{label}</span>
        <span className="font-mono text-gray-400">{format(value)}</span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full accent-blue-600"
      />
      {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
    </div>
  )
}
