// CoinGecko API Proxy

import { NextRequest, NextResponse } from 'next/server'
import { getNetworkFromEnv } from '@/lib/utils/index'

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3'

// Get network configuration
const network = getNetworkFromEnv()
const isTestnet = getNetworkFromEnv() === 'testnet'

async function fetchFromCoinGecko(endpoint: string): Promise<any> {
  const url = `${COINGECKO_API_BASE}${endpoint}`
  
  console.log(`[CoinGecko] Fetching: ${url} (Network: ${network})`)
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'OrdinalsBot-Dashboard/1.0',
    },
    // Add caching
    next: { revalidate: 60 }, // Cache for 1 minute
  })

  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

// GET - Bitcoin price and market data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'price'

    let endpoint: string
    let data: any

    switch (type) {
      case 'price':
        endpoint = '/simple/price?ids=bitcoin&vs_currencies=usd&include_last_updated_at=true&include_24hr_change=true'
        data = await fetchFromCoinGecko(endpoint)
        break

      case 'market':
        endpoint = '/coins/bitcoin?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false'
        data = await fetchFromCoinGecko(endpoint)
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid type parameter' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      data,
      network,
      timestamp: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    })

  } catch (error) {
    console.error('[CoinGecko API] Error:', error)
    
    // Return fallback data on error
    const fallbackData = {
      bitcoin: {
        usd: isTestnet ? 30000 : 45000, // Different fallback for testnet
        usd_24h_change: 2.5,
        last_updated_at: Math.floor(Date.now() / 1000)
      }
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch price data',
      data: fallbackData, // Provide fallback
      network,
      fallback: true,
    }, { 
      status: 200 // Return 200 with fallback data
    })
  }
}

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}