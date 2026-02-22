import { NextRequest, NextResponse } from 'next/server'

const WHITELIST: Record<string, { url: string; cacheTtl: number }> = {
  opensky: {
    url: 'https://api.adsb.lol/v2/lat/40/lon/-30/dist/5000',
    cacheTtl: 15,
  },
  earthquakes: {
    url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_hour.geojson',
    cacheTtl: 300,
  },
  coingecko: {
    url: 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h',
    cacheTtl: 60,
  },
  iss: {
    url: 'https://api.wheretheiss.at/v1/satellites/25544',
    cacheTtl: 5,
  },
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ source: string }> }
) {
  const { source } = await params
  const entry = WHITELIST[source]

  if (!entry) {
    return NextResponse.json(
      { error: `Invalid source. Allowed: ${Object.keys(WHITELIST).join(', ')}` },
      { status: 400 }
    )
  }

  try {
    const upstream = await fetch(entry.url, {
      headers: { 'User-Agent': 'MurmurationSimulator/1.0' },
      next: { revalidate: entry.cacheTtl },
    })

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${upstream.status}` },
        { status: 502 }
      )
    }

    const data = await upstream.text()

    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${entry.cacheTtl}`,
      },
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Proxy fetch failed: ' + (err.message || 'unknown') },
      { status: 502 }
    )
  }
}
