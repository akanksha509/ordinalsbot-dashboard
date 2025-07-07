'use client'

import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { ArrowLeft, RefreshCw, ExternalLink, Copy, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusTimeline } from './StatusTimeline'
import { StatusBadge } from './StatusBadge'
import { OrderViewerProps, Order, OrderType } from '@/types'
import { FormattingUtils } from '@/lib/utils/index'
import { copyToClipboard, getNetworkFromEnv } from '@/lib/utils/index'

export function Viewer({ orderId, initialOrder }: OrderViewerProps) {
  // Fetch order data with polling for active orders
  const { data: order, isLoading, error, refetch } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const response = await fetch(`/api/order?id=${encodeURIComponent(orderId)}`)
      if (!response.ok) {
        throw new Error('Failed to fetch order details')
      }
      const result = await response.json()
      return result.data as Order
    },
    initialData: initialOrder,
    staleTime: 10000, // 10 seconds
    refetchInterval: (query) => {
      const data = query?.state?.data as Order | undefined
      if (!data) return false
      
      const terminalStates = ['completed', 'failed', 'cancelled']
      const isActive = !terminalStates.includes(data.status)
      
      // Only auto-refresh active orders
      return isActive ? 10000 : false 
    },

    refetchOnWindowFocus: true,
  })

  const handleCopy = (text: string, label: string) => {
    copyToClipboard(text, label)
  }

  const handleViewExplorer = (txid: string) => {
    const network = getNetworkFromEnv()
    const explorerUrl = network === 'testnet'
      ? `https://mempool.space/testnet/tx/${txid}`
      : `https://mempool.space/tx/${txid}`
    window.open(explorerUrl, '_blank')
  }

  const getOrderTypeDisplay = (type: OrderType): string => {
    switch (type) {
      case 'inscription': return 'Inscription Order'
      case 'brc20-mint': return 'BRC-20 Mint Order'
      case 'brc20-transfer': return 'BRC-20 Transfer Order'
      case 'collection': return 'Collection Order'
      case 'bulk': return 'Bulk Order'
      default: return 'Order'
    }
  }

  const isTerminalState = (status: string) => {
    return ['completed', 'failed', 'cancelled'].includes(status)
  }

  if (isLoading && !initialOrder) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-10 w-10" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-10 w-24" />
        </div>

        {/* Content Skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-64" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load order details. The order might not exist or there was a network error.
          </AlertDescription>
        </Alert>

        <Button onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div>
            <h1 className="text-2xl font-bold">{getOrderTypeDisplay(order.type)}</h1>
            <p className="text-muted-foreground">
              {FormattingUtils.formatOrderId(order.id)} • {FormattingUtils.timeAgo(order.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <StatusBadge status={order.status} size="lg" />
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Timeline and Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Order Progress</CardTitle>
              <CardDescription>
                Track your order through each step of the inscription process
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StatusTimeline order={order} currentStatus={order.status} />
            </CardContent>
          </Card>

          {/* Order Details */}
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Order ID</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                      {order.id}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(order.id, 'Order ID')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Type</label>
                  <div className="mt-1">
                    <Badge variant="outline">{getOrderTypeDisplay(order.type)}</Badge>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <p className="text-sm mt-1">{FormattingUtils.formatDateTime(order.createdAt)}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                  <p className="text-sm mt-1">{FormattingUtils.formatDateTime(order.updatedAt)}</p>
                </div>
              </div>

              {/* BRC-20 Details */}
              {order.brc20Details && (
                <div className="pt-4 border-t border-border">
                  <h4 className="font-medium mb-3">BRC-20 Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Ticker</label>
                      <p className="font-mono text-lg font-bold mt-1">{order.brc20Details.ticker}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Operation</label>
                      <Badge variant="secondary" className="mt-1">
                        {order.brc20Details.operation.toUpperCase()}
                      </Badge>
                    </div>
                    {order.brc20Details.amount && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Amount</label>
                        <p className="font-mono mt-1">{order.brc20Details.amount}</p>
                      </div>
                    )}
                    {order.brc20Details.to && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">To Address</label>
                        <code className="text-xs bg-muted px-2 py-1 rounded block mt-1">
                          {FormattingUtils.truncateAddress(order.brc20Details.to)}
                        </code>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Files */}
              {order.files && order.files.length > 0 && (
                <div className="pt-4 border-t border-border">
                  <h4 className="font-medium mb-3">Files ({order.files.length})</h4>
                  <div className="space-y-2">
                    {order.files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {file.type} • {FormattingUtils.formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Inscriptions */}
              {order.inscriptions && order.inscriptions.length > 0 && (
                <div className="pt-4 border-t border-border">
                  <h4 className="font-medium mb-3">Inscriptions ({order.inscriptions.length})</h4>
                  <div className="space-y-2">
                    {order.inscriptions.map((inscription, index) => (
                      <div key={inscription.id} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div>
                          <p className="text-sm font-medium">{inscription.fileName || `Inscription ${index + 1}`}</p>
                          {inscription.fileType && inscription.fileSize && (
                            <p className="text-xs text-muted-foreground">
                              {inscription.fileType} • {FormattingUtils.formatFileSize(inscription.fileSize)}
                            </p>
                          )}
                          {inscription.inscriptionNumber && (
                            <p className="text-xs font-mono text-primary">
                              #{inscription.inscriptionNumber.toLocaleString()}
                            </p>
                          )}
                        </div>
                        {inscription.inscriptionId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(inscription.inscriptionId!, 'Inscription ID')}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Payment and Transaction Info */}
        <div className="space-y-6">
          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Payment Address</label>
                <div className="flex items-center space-x-2 mt-1">
                  <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                    {order.paymentAddress}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(order.paymentAddress, 'Payment Address')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Amount Due</label>
                <p className="text-lg font-bold mt-1">
                  {FormattingUtils.formatSatoshis(order.paymentAmount)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {FormattingUtils.formatBTC(order.paymentAmount)}
                </p>
              </div>

              {order.paidAmount && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Amount Paid</label>
                  <p className="text-lg font-bold text-green-600 mt-1">
                    {FormattingUtils.formatSatoshis(order.paidAmount)}
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-muted-foreground">Fee Rate</label>
                <p className="mt-1">{FormattingUtils.formatFeeRate(order.feeRate)}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Total Fee</label>
                <p className="mt-1">{FormattingUtils.formatSatoshis(order.totalFee)}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Receive Address</label>
                <div className="flex items-center space-x-2 mt-1">
                  <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                    {order.receiveAddress}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(order.receiveAddress, 'Receive Address')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transaction Information */}
          {(order.txid || order.inscriptionId) && (
            <Card>
              <CardHeader>
                <CardTitle>Transaction Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.txid && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Transaction ID</label>
                    <div className="flex items-center space-x-2 mt-1">
                      <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                        {order.txid}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(order.txid!, 'Transaction ID')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewExplorer(order.txid!)}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}

                {order.inscriptionId && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Inscription ID</label>
                    <div className="flex items-center space-x-2 mt-1">
                      <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                        {order.inscriptionId}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(order.inscriptionId!, 'Inscription ID')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}

                {order.inscriptionNumber && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Inscription Number</label>
                    <p className="font-mono text-lg font-bold mt-1">
                      {FormattingUtils.formatInscriptionNumber(order.inscriptionNumber)}
                    </p>
                  </div>
                )}

                {order.blockHeight && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Block Height</label>
                    <p className="mt-1">{FormattingUtils.formatBlockHeight(order.blockHeight)}</p>
                  </div>
                )}

                {order.confirmations !== undefined && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Confirmations</label>
                    <p className="mt-1">{FormattingUtils.formatConfirmations(order.confirmations)}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Order Timeline */}
          {order.timeline && order.timeline.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Order Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {order.timeline.slice().reverse().map((event, index) => (
                    <div key={`timeline-${event.timestamp}-${index}`} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <StatusBadge status={event.status} size="sm" />
                          <span className="text-xs text-muted-foreground">
                            {FormattingUtils.formatDateTime(event.timestamp)}
                          </span>
                        </div>
                        {event.message && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {event.message}
                          </p>
                        )}
                        {event.txid && (
                          <div className="flex items-center space-x-2 mt-1">
                            <code className="text-xs bg-muted px-1 py-0.5 rounded">
                              {FormattingUtils.truncateAddress(event.txid)}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopy(event.txid!, 'Transaction ID')}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Auto-refresh indicator for active orders */}
      {!isTerminalState(order.status) && (
        <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
          <span>Auto-refreshing every 10 seconds</span>
        </div>
      )}
    </div>
  )
}