'use client'

import { useState } from 'react'
import { Plus, RefreshCw, Network, Wallet, WalletIcon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { OrderRow } from '@/components/orders/OrderRow'
import { useRecentOrders } from '@/lib/order-manager'
import { useLaserEyes } from '@omnisat/lasereyes-react'
import { FormattingUtils } from '@/lib/utils/index'

interface RecentOrdersProps {
  maxOrders?: number
  showAddInput?: boolean
}

export function RecentOrders({ maxOrders = 5, showAddInput = true }: RecentOrdersProps) {
  const [newOrderId, setNewOrderId] = useState('')
  const laserEyes = useLaserEyes()
  
  const {
    orders,
    isLoading,
    error,
    network,
    refetch,
    addOrderId,
    isWalletConnected,
    walletAddress
  } = useRecentOrders(maxOrders)


  const getDisplayOrders = () => {
    if (!isWalletConnected) {
      // Show sample orders when wallet is not connected
      return orders
    }
    return orders
  }

  const displayOrders = getDisplayOrders()

  const handleAddOrder = () => {
    if (!isWalletConnected) {
      return
    }
    
    if (newOrderId.trim()) {
      const added = addOrderId(newOrderId.trim())
      if (added) {
        setNewOrderId('')
      }
    }
  }

  const handleOrderClick = (orderId: string) => {
    window.open(`/orders/${orderId}`, '_blank')
  }

  return (
    <Card className="bg-gradient-to-br from-card to-card/50 border-border/50 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-3 text-lg">
              <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <div className="h-4 w-4 rounded bg-orange-500" />
              </div>
              <span>Recent Orders</span>
              {displayOrders.length > 0 && (
                <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 border-orange-200">
                  {displayOrders.length}
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-muted-foreground/80">
              {isWalletConnected 
                ? `Your tracked ${network} orders (${FormattingUtils.truncateAddress(walletAddress, 8, 4)})`
                : `Sample ${network} assessment orders (connect wallet to track your orders)`
              }
            </CardDescription>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            className="h-8 w-8 p-0 hover:bg-orange-500/10 hover:border-orange-300"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Network Status Banner */}
        <div className={`p-3 rounded-lg border ${
          network === 'testnet' 
            ? "border-blue-500/20 bg-blue-500/10" 
            : "border-green-500/20 bg-green-500/10"
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Network className="h-4 w-4" />
              <span className={`font-medium text-sm ${
                network === 'testnet' 
                  ? "text-blue-400" 
                  : "text-green-400"
              }`}>
                {network.toUpperCase()} Assessment Mode
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <WalletIcon className="h-4 w-4" />
              <span className={`text-sm ${
                isWalletConnected ? "text-green-400" : "text-gray-400"
              }`}>
                {isWalletConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>

        {/* Add Order Input (only when wallet connected) */}
        {showAddInput && isWalletConnected && (
          <div className="flex space-x-2 p-3 bg-muted/30 rounded-lg border border-border/50">
            <Input
              placeholder={`Enter ${network} order ID to track...`}
              value={newOrderId}
              onChange={(e) => setNewOrderId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddOrder()}
              className="flex-1 bg-background/50 border-border/50 focus:border-orange-400 focus:ring-orange-400/20"
            />
            <Button 
              onClick={handleAddOrder} 
              size="sm"
              className="bg-orange-500 hover:bg-orange-600 text-white px-3"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={`loading-${i}`} className="animate-pulse">
                <div className="flex items-center justify-between p-4 border border-border/50 rounded-lg bg-gradient-to-r from-muted/30 to-muted/10">
                  <div className="flex items-center space-x-3">
                    <div className="h-3 w-3 bg-orange-300 rounded-full animate-pulse" />
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-32" />
                      <div className="h-3 bg-muted/60 rounded w-20" />
                    </div>
                  </div>
                  <div className="h-6 bg-muted rounded-full w-16" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <Alert variant="destructive" className="border-red-200 bg-red-50/50">
            <AlertDescription className="text-red-700">
              Failed to load {network} orders: {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Orders List */}
        {!isLoading && !error && (
          <div className="space-y-3">
            {displayOrders.length > 0 ? (
              displayOrders.map((order, index) => (
                <div 
                  key={`order-${order.id}-${index}`} 
                  className="group relative bg-gradient-to-r from-background to-background/50 border border-border/50 rounded-lg hover:border-orange-300/50 hover:shadow-md transition-all duration-200"
                >
                  <OrderRow
                    order={order}
                    onClick={() => handleOrderClick(order.id)}
                    showDetails={false}
                  />
                </div>
              ))
            ) : (
              <div className="text-center py-8 bg-gradient-to-br from-muted/20 to-muted/10 rounded-lg border border-dashed border-border">
                <div className="mb-4">
                  <div className="h-12 w-12 mx-auto bg-orange-500/10 rounded-full flex items-center justify-center mb-3">
                    {isWalletConnected ? (
                      <Plus className="h-6 w-6 text-orange-600" />
                    ) : (
                      <Wallet className="h-6 w-6 text-orange-600" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {isWalletConnected 
                      ? `No ${network} orders tracked yet`
                      : `Showing ${network} assessment orders`
                    }
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    {isWalletConnected 
                      ? 'Add an order ID above to start tracking'
                      : `These are sample ${network} orders for the OrdinalsBot assessment`
                    }
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <div className="pt-4 border-t border-border/50">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full hover:bg-orange-500/10 hover:border-orange-300 hover:text-orange-700" 
            asChild
          >
            <a href="/orders">
              View All Orders
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}