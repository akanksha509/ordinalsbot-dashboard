import { NextRequest, NextResponse } from 'next/server'
import { BlockchainInfo, FeeEstimate } from '@/types'
import { getNetworkFromEnv } from '@/lib/utils/index'

const MEMPOOL_BASE_URL_MAINNET = process.env.MEMPOOL_API_BASE_URL_MAINNET || 'https://mempool.space/api'
const MEMPOOL_BASE_URL_TESTNET = process.env.MEMPOOL_API_BASE_URL_TESTNET || 'https://mempool.space/testnet/api'

function getMempoolUrl(): string {
  const network = getNetworkFromEnv()
  const isTestnet = network === 'testnet'
  return isTestnet ? MEMPOOL_BASE_URL_TESTNET : MEMPOOL_BASE_URL_MAINNET
}

async function makeMempoolRequest(endpoint: string): Promise<any> {
  const baseUrl = getMempoolUrl()
  const url = `${baseUrl}${endpoint}`
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'Cache-Control': 'no-cache',
    },
    next: { revalidate: 30 }, // Cache for 30 seconds
  })

  if (!response.ok) {
    throw new Error(`Mempool API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'all'
    const address = searchParams.get('address') 

    const network = getNetworkFromEnv()
    const isTestnet = network === 'testnet'

    switch (type) {
      case 'height':
      case 'block': {
        const height = await makeMempoolRequest('/blocks/tip/height')
        
        const response = {
          success: true,
          data: {
            blockHeight: height,
            network: isTestnet ? 'testnet' : 'mainnet',
            timestamp: Date.now()
          }
        }
        
        return NextResponse.json(response, {
          headers: {
            'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
          },
        })
      }

      case 'fees': {
        const fees = await makeMempoolRequest('/v1/fees/recommended')
        
        const response = {
          success: true,
          data: {
            fastestFee: fees.fastestFee,
            halfHourFee: fees.halfHourFee,
            hourFee: fees.hourFee,
            economyFee: fees.economyFee,
            minimumFee: fees.minimumFee || 1,
            timestamp: Date.now()
          }
        }
        
        return NextResponse.json(response, {
          headers: {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
          },
        })
      }

      // Address balance and transaction check
      case 'address': {
        if (!address) {
          return NextResponse.json(
            { success: false, error: 'Address parameter is required' },
            { status: 400 }
          )
        }

        try {
          // Get address stats
          const addressData = await makeMempoolRequest(`/address/${address}`)
          
          // Calculate balances
          const confirmedBalance = addressData.chain_stats.funded_txo_sum - addressData.chain_stats.spent_txo_sum
          const unconfirmedBalance = addressData.mempool_stats.funded_txo_sum - addressData.mempool_stats.spent_txo_sum
          const totalBalance = confirmedBalance + unconfirmedBalance
          
          // Get transaction count
          const transactionCount = addressData.chain_stats.tx_count + addressData.mempool_stats.tx_count
          
          const response = {
            success: true,
            data: {
              address: address,
              balance: totalBalance,
              confirmedBalance: confirmedBalance,
              unconfirmedBalance: unconfirmedBalance,
              transactions: transactionCount,
              confirmedTransactions: addressData.chain_stats.tx_count,
              unconfirmedTransactions: addressData.mempool_stats.tx_count,
              hasBalance: totalBalance > 0,
              hasTransactions: transactionCount > 0,
              network: isTestnet ? 'testnet' : 'mainnet',
              timestamp: Date.now()
            }
          }
          
          console.log(` Address ${address} check:`, {
            balance: totalBalance,
            transactions: transactionCount,
            network: isTestnet ? 'testnet' : 'mainnet'
          })
          
          return NextResponse.json(response, {
            headers: {
              'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30', // Shorter cache for addresses
            },
          })
          
        } catch (addressError) {
          console.error(`Address check error for ${address}:`, addressError)
          
          // Return zero balance if address not found (new address)
          return NextResponse.json({
            success: true,
            data: {
              address: address,
              balance: 0,
              confirmedBalance: 0,
              unconfirmedBalance: 0,
              transactions: 0,
              confirmedTransactions: 0,
              unconfirmedTransactions: 0,
              hasBalance: false,
              hasTransactions: false,
              network: isTestnet ? 'testnet' : 'mainnet',
              timestamp: Date.now(),
              note: 'Address not found - new or unused address'
            }
          })
        }
      }

      case 'mempool': {
        const mempoolStats = await makeMempoolRequest('/mempool')
        
        const response = {
          success: true,
          data: {
            count: mempoolStats.count,
            vsize: mempoolStats.vsize,
            totalFee: mempoolStats.total_fee,
            feeHistogram: mempoolStats.fee_histogram || [],
            timestamp: Date.now()
          }
        }
        
        return NextResponse.json(response, {
          headers: {
            'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
          },
        })
      }

      case 'difficulty': {
        const difficultyInfo = await makeMempoolRequest('/v1/difficulty-adjustment')
        
        const response = {
          success: true,
          data: {
            ...difficultyInfo,
            timestamp: Date.now()
          }
        }
        
        return NextResponse.json(response, {
          headers: {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          },
        })
      }

      case 'blocks': {
        const count = searchParams.get('count') || '10'
        const blocks = await makeMempoolRequest(`/blocks/${count}`)
        
        const response = {
          success: true,
          data: blocks.map((block: any) => ({
            height: block.height,
            hash: block.id,
            timestamp: block.timestamp,
            txCount: block.tx_count,
            size: block.size
          }))
        }
        
        return NextResponse.json(response, {
          headers: {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
          },
        })
      }

      case 'all':
      default: {
        const [height, fees, mempoolStats] = await Promise.allSettled([
          makeMempoolRequest('/blocks/tip/height'),
          makeMempoolRequest('/v1/fees/recommended'),
          makeMempoolRequest('/mempool')
        ])

        const blockHeight = height.status === 'fulfilled' ? height.value : 0
        const feeData = fees.status === 'fulfilled' ? fees.value : {
          fastestFee: 15,
          halfHourFee: 10,
          hourFee: 8,
          economyFee: 5,
          minimumFee: 1
        }
        const mempool = mempoolStats.status === 'fulfilled' ? mempoolStats.value : {
          count: 0,
          vsize: 0,
          total_fee: 0
        }

        const response = {
          success: true,
          data: {
            blockHeight,
            fees: feeData,
            mempool: {
              count: mempool.count,
              vsize: mempool.vsize,
              totalFee: mempool.total_fee
            },
            network: isTestnet ? 'testnet' : 'mainnet',
            timestamp: Date.now()
          }
        }
        
        return NextResponse.json(response, {
          headers: {
            'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
          },
        })
      }
    }

  } catch (error) {
    console.error('Blockchain API route error:', error)
    
    const network = getNetworkFromEnv()
    const isTestnet = network === 'testnet'
    
    const fallbackData = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch blockchain data',
      data: {
        blockHeight: 0,
        fees: {
          fastestFee: 15,
          halfHourFee: 10,
          hourFee: 8,
          economyFee: 5,
          minimumFee: 1
        },
        mempool: {
          count: 0,
          vsize: 0,
          totalFee: 0
        },
        network: isTestnet ? 'testnet' : 'mainnet',
        timestamp: Date.now()
      }
    }
    
    return NextResponse.json(fallbackData, { status: 500 })
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}