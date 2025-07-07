'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLaserEyes } from '@omnisat/lasereyes-react' 
import Image from 'next/image'
import { RefreshCw, Plus, TrendingUp, Users, ExternalLink, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Header } from '@/components/Layout/Header'
import { NetworkBar } from '@/components/Layout/NetworkBar'
import { Footer } from '@/components/Layout/Footer'
import { TokenGrid } from '@/components/dashboard/TokenGrid'
import { Status } from '@/components/WalletConnect/Status'
import { RecentOrders } from '@/components/dashboard/RecentOrders'
import { BRC20BalanceResponse } from '@/types'
import { useToast } from '@/hooks/use-toast'
import { FormattingUtils } from '@/lib/utils/index'


// PREVIEW TOKEN DATA 
const PREVIEW_TOKENS = [
  { 
    ticker: 'ORDI', 
    balance: '47580000000000000000000', 
    available: '31240000000000000000000',   
    decimals: 18,
    color: 'from-orange-400 to-yellow-500',
    holders: 125000,
    totalSupply: '21000000000000000000000000', 
    maxSupply: '21000000000000000000000000',
    mintedSupply: '21000000000000000000000000'
  },
  { 
    ticker: 'SATS', 
    balance: '12847600000000', 
    available: '9635700000000', 
    decimals: 8,
    color: 'from-blue-400 to-purple-500',
    holders: 89000,
    totalSupply: '2100000000000000000', 
    maxSupply: '2100000000000000000',
    mintedSupply: '2100000000000000000'
  },
  { 
    ticker: 'PEPE', 
    balance: '50847293', 
    available: '42156847', 
    decimals: 0,
    color: 'from-green-400 to-blue-500',
    holders: 47000,
    totalSupply: '420690000000000', 
    maxSupply: '420690000000000',
    mintedSupply: '420690000000000'
  },
  { 
    ticker: 'DOGI', 
    balance: '892750000000', 
    available: '743280000000', 
    decimals: 8,
    color: 'from-purple-400 to-pink-500',
    holders: 32000,
    totalSupply: '100000000000000000', 
    maxSupply: '100000000000000000',
    mintedSupply: '100000000000000000'
  },
  { 
    ticker: 'MEME', 
    balance: '15749000000000000000000', 
    available: '8624500000000000000000', 
    decimals: 18,
    color: 'from-red-400 to-orange-500',
    holders: 28000,
    totalSupply: '69420000000000000000000000', 
    maxSupply: '69420000000000000000000000',
    mintedSupply: '67890000000000000000000000' 
  },
  { 
    ticker: 'WOJK', 
    balance: '3947200000000', 
    available: '3947200000000', 
    decimals: 8,
    color: 'from-indigo-400 to-purple-500',
    holders: 15000,
    totalSupply: '1000000000000000000', 
    maxSupply: '1000000000000000000',
    mintedSupply: '1000000000000000000'
  }
]

// PREVIEW TOKEN CARD 
function PreviewTokenCard({ token, index }: { token: typeof PREVIEW_TOKENS[0], index: number }) {
  const displayData = {
    availableFormatted: FormattingUtils.formatTokenAmount(token.available, token.decimals),
    totalFormatted: FormattingUtils.formatTokenAmount(token.balance, token.decimals),
    percentage: Math.round((parseFloat(token.available) / parseFloat(token.balance)) * 100)
  }

  return (
    <Card className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 group opacity-75">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          {/* Token Info  */}
          <div className="flex items-center space-x-3">
            {/*  Token Icon */}
            <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${token.color} flex items-center justify-center text-white font-bold text-sm`}>
              {token.ticker.slice(0, 2).toUpperCase()}
            </div>
            
            <div>
              <h3 className="font-semibold text-lg">{token.ticker}</h3>
              <p className="text-xs text-muted-foreground">
                {FormattingUtils.formatHolderCount(token.holders)}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/*  Balance Information */}
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

        {/*  Progress Bar */}
        <div className="space-y-2">
          <Progress 
            value={displayData.percentage} 
            className="h-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Available: {displayData.percentage}%</span>
            <span>
              {token.decimals > 0 ? `${token.decimals} decimals` : 'No decimals'}
            </span>
          </div>
        </div>

        {/*  Token Stats */}
        <div className="flex justify-between items-center pt-2 border-t border-border">
          <div className="flex items-center space-x-1 text-xs text-muted-foreground overflow-hidden">
            <TrendingUp className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">
              {/*Use FormattingUtils.formatCompactNumber directly */}
              {FormattingUtils.formatCompactNumber(token.totalSupply)}
            </span>
            <span className="flex-shrink-0">supply</span>
          </div>
          
          <div className="flex items-center space-x-1 text-xs text-muted-foreground flex-shrink-0">
            <Users className="h-3 w-3" />
            <span>
              {FormattingUtils.formatCompactNumber(token.holders)}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {parseFloat(token.available) > 0 && (
            <Badge variant="success" className="text-xs opacity-75">
              Transferable
            </Badge>
          )}
          
          {token.decimals > 0 && (
            <Badge variant="outline" className="text-xs opacity-75">
              Divisible
            </Badge>
          )}
          
          {token.mintedSupply === token.maxSupply && (
            <Badge variant="secondary" className="text-xs opacity-75">
              Fully Minted
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Recent Orders Component
function RecentOrdersWidget() {
  return <RecentOrders maxOrders={4} showAddInput={false} />
}

// Welcome Component
function WelcomeSection({ address }: { address?: string }) {
  return (
    <div className="text-center py-8">
      <div className="flex justify-center mb-4">
        <Image
          src="/ordinalsbot_logo.png"
          alt="OrdinalsBot Logo"
          width={64}
          height={64}
          className="rounded-lg"
        />
      </div>
      <h1 className="text-3xl font-bold mb-2">
        Welcome to OrdinalsBot Dashboard
      </h1>
      <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
        Your comprehensive gateway to Bitcoin Ordinals and BRC-20 tokens. 
        {address ? ` Connected as ${address.slice(0, 6)}...${address.slice(-6)}` : ' Connect your wallet to get started.'}
      </p>
    </div>
  )
}

export default function DashboardPage() {
  const { toast } = useToast()

  // Use LaserEyes hook to manage wallet connection
  const laserEyes = useLaserEyes()
  const address = laserEyes.address
  const isConnected = laserEyes.connected
  const network = laserEyes.network

  //  Debug logging
  useEffect(() => {
    console.log('[Dashboard] LaserEyes state:', {
      connected: isConnected,
      address: address,
      network: network
    })
  }, [isConnected, address, network])

  // Fetch BRC-20 tokens for connected wallet
  const { 
    data: tokensData, 
    isLoading: tokensLoading, 
    error: tokensError, 
    refetch: refetchTokens 
  } = useQuery<BRC20BalanceResponse>({
    queryKey: ['brc20-balance', address],
    queryFn: async () => {
      if (!address) throw new Error('No wallet address')
      
      console.log(`[Dashboard] Fetching BRC-20 tokens for address: ${address}`)
      
      const response = await fetch(`/api/brc20?address=${encodeURIComponent(address)}`)
      if (!response.ok) throw new Error('Failed to fetch BRC-20 tokens')
      
      const result = await response.json()
      console.log('[Dashboard] BRC-20 API response:', result)
      
      return result
    },
    enabled: !!isConnected && !!address,
    staleTime: 60000,
    refetchInterval: 120000,
  })

  // Fetch ticker information for all tokens
  const tickers = tokensData?.data?.tokens?.map(token => token.ticker) || []
  const { data: tickerInfos = {} } = useQuery({
    queryKey: ['ticker-infos', tickers],
    queryFn: async () => {
      if (tickers.length === 0) return {}
      
      const response = await fetch(`/api/brc20?action=tickers&tickers=${tickers.join(',')}`)
      if (!response.ok) throw new Error('Failed to fetch ticker info')
      
      const result = await response.json()
      return result.data || {}
    },
    enabled: tickers.length > 0,
    staleTime: 300000, // 5 minutes
  })

  const handleRefresh = async () => {
    try {
      await refetchTokens()
      toast({
        title: "Refreshed",
        description: "Token balances have been updated",
      })
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Failed to refresh token data",
        variant: "destructive",
      })
    }
  }

  const tokens = tokensData?.data?.tokens || []
  const hasTokens = tokens.length > 0

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <NetworkBar />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Section */}
        <WelcomeSection address={address} />

        {/* Wallet Status */}
        <div className="max-w-2xl mx-auto">
          <Status showDetails={isConnected || false} />
        </div>

        {/* Main Content */}
        {isConnected ? (
          <div className="space-y-8">
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-4 justify-center">
              <Button className="flex items-center space-x-2" size="lg" asChild>
                <a href="/inscribe">
                  <Plus className="h-5 w-5" />
                  <span>Create Inscription</span>
                </a>
              </Button>
              
              <Button variant="outline" className="flex items-center space-x-2" size="lg" asChild>
                <a href="/inscribe">
                  <TrendingUp className="h-5 w-5" />
                  <span>BRC-20 Transfer</span>
                </a>
              </Button>
              
              <Button 
                variant="outline" 
                className="flex items-center space-x-2" 
                size="lg"
                onClick={handleRefresh}
              >
                <RefreshCw className="h-5 w-5" />
                <span>Refresh Data</span>
              </Button>
            </div>

            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Token Portfolio */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Token Portfolio</h2>
                  {hasTokens && (
                    <Button variant="outline" size="sm" onClick={handleRefresh}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  )}
                </div>

                <TokenGrid
                  tokens={tokens}
                  tickerInfos={tickerInfos}
                  loading={tokensLoading}
                  error={tokensError?.message || null}
                  onRefresh={handleRefresh}
                />
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Recent Orders */}
                <RecentOrdersWidget />

                {/* Network Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle>Network Stats</CardTitle>
                    <CardDescription>
                      Real-time Bitcoin network information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Network</span>
                      <span className="text-sm font-medium">
                        {network === 'mainnet' ? 'Bitcoin Mainnet' : 'Bitcoin Testnet'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <div className="flex items-center space-x-1">
                        <div className="h-2 w-2 bg-green-500 rounded-full" />
                        <span className="text-sm font-medium">Connected</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <p className="text-xs text-muted-foreground">
                        Live data from mempool.space and CoinGecko APIs
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        ) : (
          // Not connected state
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Preview Content */}
            <div className="lg:col-span-2 space-y-6">
              <Alert>
                <AlertDescription>
                  Connect your Bitcoin wallet to view your BRC-20 tokens, create inscriptions, and manage orders.
                </AlertDescription>
              </Alert>

              {/* Feature Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">BRC-20 Tokens</CardTitle>
                    <CardDescription>
                      View and manage your BRC-20 token portfolio
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Real-time balance tracking</li>
                      <li>• Transfer management</li>
                      <li>• Token metadata</li>
                      <li>• Holder statistics</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Inscriptions</CardTitle>
                    <CardDescription>
                      Create and track Bitcoin Ordinal inscriptions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• File inscriptions</li>
                      <li>• BRC-20 operations</li>
                      <li>• Order tracking</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Token Portfolio Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Token Portfolio Preview</CardTitle>
                  <CardDescription>
                    Here's what your dashboard will look like with a connected wallet
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {PREVIEW_TOKENS.map((token, index) => (
                      <PreviewTokenCard key={token.ticker} token={token} index={index} />
                    ))}
                  </div>
                  <div className="mt-4 text-center">
                    <Badge variant="outline" className="text-xs">
                      Realistic BRC-20 token data
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - RecentOrders only */}
            <div className="space-y-6">
              
              <RecentOrdersWidget />
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}