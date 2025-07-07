'use client'

import { useState } from 'react'
import { MoreHorizontal, TrendingUp, Users, Copy, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { TokenCardProps } from '@/types'
import { FormattingUtils, getNetworkFromEnv } from '@/lib/utils/index'
import { copyToClipboard } from '@/lib/utils/index'

// Color scheme for different tokens 
const getTokenColor = (ticker?: string): string => {
  const colors = [
    'from-orange-400 to-yellow-500',    // ORDI style
    'from-blue-400 to-purple-500',     // SATS style
    'from-green-400 to-blue-500',      // PEPE style
    'from-purple-400 to-pink-500',     // DOGI style
    'from-red-400 to-orange-500',      // MEME style
    'from-indigo-400 to-purple-500',   // WOJK style
    'from-pink-400 to-red-500',        // Additional colors
    'from-teal-400 to-blue-500',
    'from-yellow-400 to-orange-500',
    'from-violet-400 to-purple-500'
  ]
  
  // Handle undefined ticker
  if (!ticker || typeof ticker !== 'string') {
    return colors[0] // Default color
  }
  
  // Generate consistent color based on ticker
  const hash = ticker.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0)
  
  return colors[Math.abs(hash) % colors.length]
}

export function TokenCard({ token, tickerInfo, onClick, loading = false }: TokenCardProps) {
  const [imageError, setImageError] = useState(false)

  // Format token data for display
  const displayData = FormattingUtils.formatTokenDisplay(token)
  
  // Calculate percentage of available vs total
  const availablePercentage = displayData.percentage

  // Get consistent color for this token
  const tokenColor = getTokenColor(token?.ticker)

  // Simplified copy handler using centralized utility
  const handleCopyTicker = () => {
    if (!token?.ticker) return
    copyToClipboard(token.ticker, 'Ticker')
  }

  const handleViewExplorer = () => {
    if (!token?.ticker) return
    
    const network = getNetworkFromEnv()
    const explorerUrl = network === 'testnet'
      ? `https://mempool.space/testnet/api/v1/brc20/ticker/${token.ticker}`
      : `https://mempool.space/api/v1/brc20/ticker/${token.ticker}`
    window.open(explorerUrl, '_blank')
  }

  // Safety check for token data
  if (!token || !token.ticker) {
    return (
      <Card className="cursor-pointer transition-all duration-200 hover:shadow-lg">
        <CardContent className="p-6 text-center text-muted-foreground">
          Invalid token data
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className="cursor-pointer transition-all duration-200 hover:shadow-lg animate-pulse">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="h-6 bg-muted rounded w-16"></div>
            <div className="h-4 bg-muted rounded w-12"></div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-24"></div>
            <div className="h-4 bg-muted rounded w-20"></div>
          </div>
          <div className="h-2 bg-muted rounded w-full"></div>
          <div className="flex justify-between">
            <div className="h-3 bg-muted rounded w-16"></div>
            <div className="h-3 bg-muted rounded w-12"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card 
      className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 group"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          {/* Token Info */}
          <div className="flex items-center space-x-3">
            {/* Token Icon with dynamic colors */}
            <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${tokenColor} flex items-center justify-center text-white font-bold text-sm`}>
              {token.ticker?.slice(0, 2).toUpperCase() || 'N/A'}
            </div>
            
            <div>
              <h3 className="font-semibold text-lg">{token.ticker}</h3>
              {tickerInfo && (
                <p className="text-xs text-muted-foreground">
                  {FormattingUtils.formatHolderCount(tickerInfo.holders)} holders
                </p>
              )}
            </div>
          </div>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{token.ticker} Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleCopyTicker}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Ticker
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleViewExplorer}>
                <ExternalLink className="mr-2 h-4 w-4" />
                View on Explorer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Balance Information */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Available</span>
            <span className="font-mono text-sm font-medium">
              {displayData.availableFormatted}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Balance</span>
            <span className="font-mono text-sm font-semibold">
              {displayData.totalFormatted}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress 
            value={availablePercentage} 
            className="h-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Available: {availablePercentage}%</span>
            <span>
              {token.decimals > 0 ? `${token.decimals} decimals` : 'No decimals'}
            </span>
          </div>
        </div>

        {/* Token Stats */}
        {tickerInfo && (
          <div className="flex justify-between items-center pt-2 border-t border-border">
            <div className="flex items-center space-x-1 text-xs text-muted-foreground overflow-hidden">
              <TrendingUp className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">
                {FormattingUtils.formatCompactNumber(tickerInfo.totalSupply)}
              </span>
              <span className="flex-shrink-0">supply</span>
            </div>
            
            <div className="flex items-center space-x-1 text-xs text-muted-foreground flex-shrink-0">
              <Users className="h-3 w-3" />
              <span>
                {FormattingUtils.formatCompactNumber(tickerInfo.holders)}
              </span>
            </div>
          </div>
        )}

        {/* Additional Badges */}
        <div className="flex flex-wrap gap-1">
          {parseFloat(token.available) > 0 && (
            <Badge variant="success" className="text-xs">
              Transferable
            </Badge>
          )}
          
          {token.decimals > 0 && (
            <Badge variant="outline" className="text-xs">
              Divisible
            </Badge>
          )}
          
          {tickerInfo?.mintedSupply === tickerInfo?.maxSupply && (
            <Badge variant="secondary" className="text-xs">
              Fully Minted
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}