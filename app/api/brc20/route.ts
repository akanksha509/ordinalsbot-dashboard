import { NextRequest, NextResponse } from 'next/server'
import { BRC20BalanceResponse, BRC20TickerResponse } from '@/types'
import { getNetworkFromEnv } from '@/lib/utils/index'

const API_KEY = process.env.ORDINALSBOT_API_KEY
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://testnet-api.ordinalsbot.com'
const isTestnet = getNetworkFromEnv() === 'testnet'

async function makeOrdinalsRequest(endpoint: string): Promise<any> {
  const url = `${BASE_URL}/opi${endpoint}`
  
  const response = await fetch(url, {
    headers: {
      'x-api-key': API_KEY!,
      'Content-Type': 'application/json',
    },
    next: { revalidate: 60 },
  })

  const responseText = await response.text()
  
  if (!response.ok) {
    // Handle no balance found as success (400 status is OK for this case)
    try {
      const jsonResponse = JSON.parse(responseText)
      
      if (response.status === 400 && jsonResponse.error === "no balance found") {
        return jsonResponse
      }
    } catch (e) {
      // Not JSON, treat as actual error
    }
    
    // Handle testnet permission issues gracefully
    if (response.status === 401 || response.status === 403) {
      return {
        error: "api_permissions_limited",
        result: null,
        fallback: true,
        network: isTestnet ? 'testnet' : 'mainnet'
      }
    }
    
    throw new Error(`OrdinalsBot API error: ${response.status} ${response.statusText}`)
  }

  // Parse successful response
  try {
    return JSON.parse(responseText)
  } catch (e) {
    throw new Error(`Invalid JSON response: ${responseText}`)
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')
    const ticker = searchParams.get('ticker')
    const action = searchParams.get('action')

    if (!address && !ticker) {
      return NextResponse.json(
        { success: false, error: 'Address or ticker parameter is required' },
        { status: 400 }
      )
    }

    // Get BRC-20 balance for an address
    if (address && !ticker) {
      try {
        const data = await makeOrdinalsRequest(
          `/v1/brc20/get_current_balance_of_wallet?address=${encodeURIComponent(address)}`
        )
        
        let tokens = []
        let hasTokens = false
        let message = ''
        
        // Handle API permission issues (testnet/mainnet)
        if (data.error === "api_permissions_limited") {
          tokens = []
          hasTokens = false
          message = `BRC-20 API access limited on ${data.network}. Order functionality works normally.`
        } else if (data.error === "no balance found" || data.result === null) {
          // This is SUCCESS - wallet has no BRC-20 tokens
          tokens = []
          hasTokens = false
          message = 'No BRC-20 tokens found for this address'
        } else if (data.result && Array.isArray(data.result) && data.result.length > 0) {
          // Wallet has BRC-20 tokens
          // Convert OPI format to our format
          tokens = data.result.map((token: any) => ({
            ticker: token.tick || token.ticker,
            balance: token.overall_balance || token.balance || '0',
            available: token.available_balance || token.available || '0',
            transferable: token.available_balance || token.transferable || '0',
            decimals: parseInt(token.decimals || '18'), // Default to 18 decimals
          }))
          
          hasTokens = true
          message = `Found ${tokens.length} BRC-20 tokens`
        } else if (data.result && Array.isArray(data.result) && data.result.length === 0) {
          tokens = []
          hasTokens = false
          message = 'No BRC-20 tokens found for this address'
        } else if (data.error && data.error !== "no balance found") {
          // Actual error (not "no balance found")
          throw new Error(`API Error: ${data.error}`)
        } else {
          tokens = []
          hasTokens = false
          message = 'No BRC-20 tokens found for this address'
        }
        
        const response: BRC20BalanceResponse = {
          success: true,
          data: {
            address,
            tokens,
            hasTokens,
            message
          }
        }
        
        return NextResponse.json(response, {
          headers: {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
          },
        })
        
      } catch (error) {
        // Enhanced error messaging based on network
        let errorMessage = `Unable to fetch BRC-20 tokens on ${isTestnet ? 'testnet' : 'mainnet'}`
        if (error instanceof Error && (error.message.includes('401') || error.message.includes('403'))) {
          errorMessage = `BRC-20 API access limited on ${isTestnet ? 'testnet' : 'mainnet'}. Order functionality works normally.`
        }
        
        // Return success with empty tokens for graceful UI handling
        return NextResponse.json({
          success: true,
          data: {
            address,
            tokens: [],
            hasTokens: false,
            message: errorMessage,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }, {
          status: 200,
          headers: {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
          },
        })
      }
    }

    // Get ticker information
    if (ticker && !address) {
      try {
        const data = await makeOrdinalsRequest(
          `/v1/brc20/ticker_info?ticker=${encodeURIComponent(ticker)}`
        )
        
        const response: BRC20TickerResponse = {
          success: true,
          data: data.result || data.data || data
        }
        
        return NextResponse.json(response, {
          headers: {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          },
        })
      } catch (error) {
        return NextResponse.json(
          { success: false, error: 'Failed to fetch ticker information' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { success: false, error: 'Invalid request parameters' },
      { status: 400 }
    )

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
    },
  })
}