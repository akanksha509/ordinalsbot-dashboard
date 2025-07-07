'use client'

import { useQuery } from '@tanstack/react-query'
import { Activity, Bitcoin, DollarSign, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { FormattingUtils, getApiErrorMessage } from '@/lib/utils/index'

interface BlockchainData {
  blockHeight: number
  fees: {
    fastestFee: number
    halfHourFee: number
    hourFee: number
    economyFee: number
  }
  mempool: {
    count: number
    vsize: number
    totalFee: number
  }
  network: string
}

interface BTCPriceData {
  bitcoin: {
    usd: number
    usd_24h_change: number
    last_updated_at: number
  }
}

// Custom skeleton component for network bar
function NetworkSkeleton() {
  return (
    <div className="flex items-center space-x-4">
      <Skeleton className="h-6 w-24" />
      <Skeleton className="h-6 w-20" />
      <Skeleton className="h-6 w-28" />
    </div>
  )
}

export function NetworkBar() {
  // Fetch blockchain data
  const { data: blockchainData, isLoading: blockchainLoading } = useQuery<BlockchainData>({
    queryKey: ['blockchain'],
    queryFn: async () => {
      const response = await fetch('/api/blockchain?type=all')
      if (!response.ok) {
        throw new Error(`Blockchain API error: ${response.status} ${response.statusText}`)
      }
      const result = await response.json()
      return result.data
    },
    
    refetchInterval: (query) => {
      // Only refetch if page is visible
      if (typeof document !== 'undefined' && document.hidden) {
        return false // Stop polling when page is hidden
      }
      return 30000 // Refetch every 30 seconds when visible
    },
    staleTime: 20000, // Consider stale after 20 seconds
    // Refetch on window focus
    refetchOnWindowFocus: true,
    // Improved error handling for blockchain API
    retry: (failureCount, error) => {
      // Don't retry for certain error types
      const errorMessage = getApiErrorMessage(error, 'Blockchain API')
      if (errorMessage.includes('authentication') || errorMessage.includes('forbidden')) {
        return false // Don't retry auth errors
      }
      return failureCount < 3
    }
  })

  // Fetch BTC price through our API route
  const { data: btcPriceResponse, isLoading: priceLoading } = useQuery({
    queryKey: ['btc-price'],
    queryFn: async () => {
      const response = await fetch('/api/price?type=price')
      if (!response.ok) {
        throw new Error(`Price API error: ${response.status} ${response.statusText}`)
      }
      const result = await response.json()
      return result
    },
    
    refetchInterval: (query) => {
      // Only refetch if page is visible
      if (typeof document !== 'undefined' && document.hidden) {
        return false // Stop polling when page is hidden
      }
      return 60000 // Refetch every minute when visible
    },
    staleTime: 30000, // Consider stale after 30 seconds
    // Refetch on window focus
    refetchOnWindowFocus: true,
    // Retry on error with fallback and improved error handling
    retry: (failureCount, error) => {
      // Don't retry for certain error types
      const errorMessage = getApiErrorMessage(error, 'Price API')
      if (errorMessage.includes('authentication') || errorMessage.includes('forbidden')) {
        return false // Don't retry auth errors
      }
      return failureCount < 3
    }
  })

  // Extract BTC price with fallback handling
  const getBTCPrice = () => {
    if (!btcPriceResponse) return null
    
    // Handle both successful and fallback responses
    const priceData = btcPriceResponse.data as BTCPriceData
    if (priceData?.bitcoin?.usd) {
      return {
        usd: priceData.bitcoin.usd,
        change24h: priceData.bitcoin.usd_24h_change || 0,
        isFallback: btcPriceResponse.fallback || false
      }
    }
    
    return null
  }

  const btcPrice = getBTCPrice()

  // Format congestion level
  const getCongestionInfo = (feeRate: number) => {
    return FormattingUtils.formatCongestionLevel(feeRate)
  }

  if (blockchainLoading || priceLoading) {
    return (
      <div className="network-bar">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-10 items-center justify-between">
            <NetworkSkeleton />
            <NetworkSkeleton />
          </div>
        </div>
      </div>
    )
  }

  const congestionInfo = blockchainData ? getCongestionInfo(blockchainData.fees.halfHourFee) : null
  const isTestnet = blockchainData?.network === 'testnet'

  return (
    <div className="network-bar">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-10 items-center justify-between text-sm">
          {/* Left side - Network info */}
          <div className="flex items-center space-x-4">
            {/* Network indicator */}
            <div className="flex items-center space-x-1">
              <Activity className="h-4 w-4 text-green-500" />
              <span className="font-medium">
                {isTestnet ? 'Testnet' : 'Mainnet'}
              </span>
            </div>

            {/* Block height */}
            {blockchainData && (
              <div className="flex items-center space-x-1">
                <Bitcoin className="h-4 w-4 text-bitcoin-500" />
                <span>Block {blockchainData.blockHeight.toLocaleString()}</span>
              </div>
            )}

            {/* Fee rate */}
            {blockchainData && congestionInfo && (
              <div className="flex items-center space-x-2">
                <span>Fees:</span>
                <Badge 
                  variant="outline" 
                  className={`text-${congestionInfo.color}-500 border-${congestionInfo.color}-500/30`}
                >
                  ~{blockchainData.fees.halfHourFee} sat/vB
                </Badge>
                <span className="text-muted-foreground">({congestionInfo.label})</span>
              </div>
            )}
          </div>

          {/* Right side - Price and market info */}
          <div className="flex items-center space-x-4">
            {/* BTC Price */}
            {btcPrice && (
              <div className="flex items-center space-x-1">
                <DollarSign className="h-4 w-4 text-green-500" />
                <span className="font-medium">
                  ${btcPrice.usd.toLocaleString()}
                </span>
                {/* Show fallback indicator */}
                {btcPrice.isFallback && (
                  <span className="text-xs text-orange-500" title="Using fallback price data">
                    *
                  </span>
                )}
                {/* Show 24h change */}
                {btcPrice.change24h !== 0 && (
                  <span 
                    className={`text-xs ${btcPrice.change24h > 0 ? 'text-green-500' : 'text-red-500'}`}
                    title={`24h change: ${btcPrice.change24h > 0 ? '+' : ''}${btcPrice.change24h.toFixed(2)}%`}
                  >
                    {btcPrice.change24h > 0 ? '↗' : '↘'}
                  </span>
                )}
              </div>
            )}

            {/* Mempool count */}
            {blockchainData && (
              <div className="flex items-center space-x-1">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <span className="text-muted-foreground">
                  {blockchainData.mempool.count.toLocaleString()} tx
                </span>
              </div>
            )}

            {/* Last updated indicator */}
            <div className="hidden sm:block text-xs text-muted-foreground">
              Live
              <span className="ml-1 inline-block h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}