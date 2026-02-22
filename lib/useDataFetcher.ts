import { useState, useEffect, useRef, useCallback } from 'react'

interface DataFetchState<T> {
  data: T | null
  loading: boolean
  error: string | null
  lastUpdated: number | null
}

const UPSTREAM_URLS: Record<string, string> = {
  opensky: 'https://api.adsb.lol/v2/lat/40/lon/-30/dist/5000',
  earthquakes: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_hour.geojson',
  coingecko: 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h',
  iss: 'https://api.wheretheiss.at/v1/satellites/25544',
  github: 'https://api.github.com/events?per_page=30',
}

function getUrl(source: string): string {
  // GitHub has CORS headers — fetch directly
  if (source === 'github') return UPSTREAM_URLS.github
  // All other sources go through our API route proxy
  return `/api/proxy/${source}`
}

export function useDataFetcher<T = any>(
  source: string | null,
  pollIntervalMs: number,
  params?: Record<string, string>
): DataFetchState<T> {
  const [state, setState] = useState<DataFetchState<T>>({
    data: null,
    loading: false,
    error: null,
    lastUpdated: null,
  })
  const lastGoodData = useRef<T | null>(null)
  const backoffUntil = useRef<number>(0)
  const consecutiveFails = useRef<number>(0)

  const fetchData = useCallback(async () => {
    if (!source) return

    // Skip fetch if in backoff period
    if (Date.now() < backoffUntil.current) return

    setState(prev => ({ ...prev, loading: !lastGoodData.current }))

    try {
      const url = getUrl(source)
      const res = await fetch(url)

      // On rate limit, back off exponentially
      if (res.status === 429) {
        consecutiveFails.current++
        const wait = Math.min(60000 * Math.pow(2, consecutiveFails.current - 1), 600000)
        backoffUntil.current = Date.now() + wait
        setState(prev => ({
          data: lastGoodData.current,
          loading: false,
          error: lastGoodData.current ? null : `Rate limited — retrying in ${Math.round(wait / 1000)}s`,
          lastUpdated: prev.lastUpdated,
        }))
        return
      }

      if (!res.ok) throw new Error(`API returned ${res.status}`)

      const data = await res.json() as T
      lastGoodData.current = data
      consecutiveFails.current = 0
      backoffUntil.current = 0
      setState({ data, loading: false, error: null, lastUpdated: Date.now() })
    } catch (err: any) {
      consecutiveFails.current++
      setState(prev => ({
        data: lastGoodData.current,
        loading: false,
        error: err.message || 'Fetch failed',
        lastUpdated: prev.lastUpdated,
      }))
    }
  }, [source, params]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!source) {
      setState({ data: null, loading: false, error: null, lastUpdated: null })
      lastGoodData.current = null
      consecutiveFails.current = 0
      backoffUntil.current = 0
      return
    }

    fetchData()
    const interval = setInterval(fetchData, pollIntervalMs)
    return () => clearInterval(interval)
  }, [source, pollIntervalMs, fetchData])

  return state
}
