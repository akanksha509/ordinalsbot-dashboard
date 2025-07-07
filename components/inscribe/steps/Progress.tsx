'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CheckCircle,
  Clock,
  AlertTriangle,
  ExternalLink,
  Copy,
  Loader2,
  RefreshCw,
  CreditCard,
  Zap
} from 'lucide-react'
import { WizardData } from '../Wizard'
import { Order } from '@/types'
import { useOrder } from '@/lib/order-manager'
// ✅ FIXED: Import centralized clipboard utility instead of manual implementation
import { copyToClipboard } from '@/lib/utils/index'
// ✅ ADD IMPORT: FormattingUtils for consistent string formatting
import { FormattingUtils } from '@/lib/utils/index'
// ✅ INTEGRATE: Use lib/order-status for ALL status logic
import { 
  getStatusConfig, 
  getStatusProgress, 
  categorizeOrderStatus,
  isTerminalStatus,
  isActiveStatus,
  getStatusTimeEstimate
} from '@/lib/order-status'

interface ProgressStepProps {
  data: WizardData
  onComplete: () => void
  onReset: () => void
}

// ✅ ICON MAPPING: For lib/order-status icon strings
const ICON_COMPONENTS = {
  CheckCircle,
  Clock,
  AlertTriangle,
  CreditCard,
  Zap,
  Loader2
} as const

export function ProgressStep({ data, onComplete, onReset }: ProgressStepProps) {
  // ✅ REMOVED: Manual useToast since copyToClipboard handles it
  
  // ✅ ONLY FETCH - Never add orders (that's done in Pay.tsx)
  const { 
    data: order, 
    isLoading, 
    error, 
    refetch 
  } = useOrder(data.orderId || '')

  // ✅ REMOVED: Manual copyText function - replaced with centralized utility

  // ✅ FIXED: Use lib/order-status for status info with proper fallbacks
  const getStatusInfo = () => {
    if (!order) {
      return { 
        title: 'Loading...', 
        color: 'text-blue-600', 
        progress: 0,
        icon: Clock,
        isTerminal: false,
        timeEstimate: 'Unknown',
        category: 'pending' as const,  // ✅ FIXED: Always defined
        description: 'Loading order information...'
      }
    }
    
    // ✅ USE LIBRARY FUNCTIONS
    const config = getStatusConfig(order.status)
    const progress = getStatusProgress(order.status)
    const category = categorizeOrderStatus(order.status) || 'pending'  // ✅ FIXED: Add fallback
    const isTerminal = isTerminalStatus(order.status)
    const timeEstimate = getStatusTimeEstimate(order.status)
    
    // Get icon component
    const IconComponent = ICON_COMPONENTS[config.icon as keyof typeof ICON_COMPONENTS] || Clock
    
    return {
      title: config.label,
      color: config.color,
      progress: progress,
      icon: IconComponent,
      category: category,  // ✅ NOW ALWAYS DEFINED
      isTerminal: isTerminal,
      timeEstimate: timeEstimate,
      description: config.description
    }
  }

  const statusInfo = getStatusInfo()

  if (error && !order) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-gray-100">Error Loading Order</h2>
        </div>
        <Alert variant="destructive" className="bg-red-900/20 border-red-600/50">
          <AlertDescription className="text-gray-200">{error.message}</AlertDescription>
        </Alert>
        <div className="flex justify-center space-x-4">
          <Button onClick={() => refetch()} className="bg-blue-600 hover:bg-blue-700 text-white">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
          <Button variant="outline" onClick={onReset} className="bg-gray-800 border-gray-600 text-gray-100 hover:bg-gray-700">
            Start Over
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="p-3 bg-primary/10 rounded-full w-fit mx-auto mb-4">
          <statusInfo.icon className={`h-8 w-8 ${statusInfo.color}`} />
        </div>
        <h2 className={`text-2xl font-bold mb-2 ${statusInfo.color}`}>
          {statusInfo.title}
        </h2>
        <p className="text-gray-400 mb-2">
          {statusInfo.description}
        </p>
        {/* ✅ ENHANCED: Show time estimate */}
        {!statusInfo.isTerminal && (
          <p className="text-sm text-gray-500">
            Estimated time: {statusInfo.timeEstimate}
          </p>
        )}
      </div>

      {/* ✅ FIXED: Order tracking confirmation with safe category checks */}
      {data.orderId && (
        <Alert className={`border-2 ${
          statusInfo.category === 'confirmed' ? 'bg-green-900/20 border-green-600/30' :
          statusInfo.category === 'failed' ? 'bg-red-900/20 border-red-600/30' :
          'bg-blue-900/20 border-blue-600/30'
        }`}>
          <AlertDescription className={
            statusInfo.category === 'confirmed' ? 'text-green-300' :
            statusInfo.category === 'failed' ? 'text-red-300' :
            'text-blue-300'
          }>
            ✅ Order {FormattingUtils.formatOrderId(data.orderId)} is being tracked in your orders list
          </AlertDescription>
        </Alert>
      )}

      {/* ✅ ENHANCED: Progress Bar using lib/order-status */}
      <Card className="bg-gray-800/50 border-gray-600">
        <CardContent className="p-6">
          <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${
                statusInfo.category === 'confirmed' ? 'bg-green-600' :
                statusInfo.category === 'failed' ? 'bg-red-600' :
                'bg-blue-600'
              }`}
              style={{ width: `${statusInfo.progress}%` }}
            />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-300">Progress</span>
            <span className="text-gray-300">{statusInfo.progress}%</span>
          </div>
          {/* ✅ ENHANCED: Category indicator */}
          <div className="mt-2 text-center">
            <Badge 
              variant={
                statusInfo.category === 'confirmed' ? 'default' :
                statusInfo.category === 'failed' ? 'destructive' :
                'secondary'
              }
              className={`${
                statusInfo.category === 'confirmed' ? 'bg-green-600 text-white' :
                statusInfo.category === 'failed' ? 'bg-red-600 text-white' :
                'bg-blue-600 text-white'
              }`}
            >
              {statusInfo.category.toUpperCase()}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* ✅ ENHANCED: Order Details with better styling */}
      {order && (
        <Card className="bg-gray-800/50 border-gray-600">
          <CardHeader>
            <CardTitle className="text-gray-100 flex items-center justify-between">
              Order Details
              <Badge variant="outline" className="border-gray-500 text-gray-300">
                {order.network?.toUpperCase() || 'Unknown'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm">Order ID:</span>
                  <div className="flex items-center space-x-2">
                    <code className="text-sm text-gray-100 bg-gray-700 px-2 py-1 rounded">
                      {FormattingUtils.formatOrderId(order.id)}
                    </code>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(order.id, 'Order ID')}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm">Status:</span>
                  <Badge 
                    variant="outline" 
                    className={`border-gray-500 ${statusInfo.color}`}
                  >
                    {statusInfo.title}
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm">Type:</span>
                  <Badge variant="secondary" className="bg-gray-700 text-gray-200">
                    {order.type}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                {order.paymentAmount && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">Amount:</span>
                    <span className="text-gray-100 font-mono text-sm">
                      {order.paymentAmount.toLocaleString()} sats
                    </span>
                  </div>
                )}

                {order.confirmations !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">Confirmations:</span>
                    <span className="text-gray-100 font-mono text-sm">
                      {order.confirmations}
                    </span>
                  </div>
                )}

                {order.feeRate && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">Fee Rate:</span>
                    <span className="text-gray-100 font-mono text-sm">
                      {order.feeRate} sat/vB
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Transaction Details */}
            {(order.txid || order.inscriptionId) && (
              <div className="pt-4 border-t border-gray-600">
                <h4 className="text-gray-200 font-medium mb-3">Transaction Details</h4>
                <div className="space-y-3">
                  {order.txid && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 text-sm">Transaction:</span>
                      <div className="flex items-center space-x-2">
                        <code className="text-xs text-gray-100 bg-gray-700 px-2 py-1 rounded">
                          {FormattingUtils.truncateTxid(order.txid)}
                        </code>
                        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(order.txid!, 'Transaction ID')}>
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`https://mempool.space/tx/${order.txid}`, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {order.inscriptionId && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 text-sm">Inscription:</span>
                      <div className="flex items-center space-x-2">
                        <code className="text-xs text-gray-100 bg-gray-700 px-2 py-1 rounded">
                          {FormattingUtils.truncateTxid(order.inscriptionId)}
                        </code>
                        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(order.inscriptionId!, 'Inscription ID')}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* BRC-20 Details */}
            {order.brc20Details && (
              <div className="pt-4 border-t border-gray-600">
                <h4 className="text-gray-200 font-medium mb-3">BRC-20 Details</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-orange-600 text-white">
                    {order.brc20Details.ticker}
                  </Badge>
                  <Badge variant="outline" className="border-orange-500 text-orange-400">
                    {order.brc20Details.operation.toUpperCase()}
                  </Badge>
                  {order.brc20Details.amount && (
                    <Badge variant="outline" className="border-gray-500 text-gray-300">
                      {order.brc20Details.amount}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ✅ ENHANCED: Success Actions using lib/order-status */}
      {order && statusInfo.category === 'confirmed' && (
        <Card className="bg-green-900/20 border-green-600/30">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-4 text-green-300">Inscription Complete!</h3>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={onComplete} className="bg-green-600 hover:bg-green-700 text-white">
                View Details
              </Button>
              <Button variant="outline" onClick={onReset} className="bg-gray-800 border-gray-600 text-gray-100 hover:bg-gray-700">
                Create Another
              </Button>
              <Button variant="outline" asChild className="bg-gray-800 border-gray-600 text-gray-100 hover:bg-gray-700">
                <a href="/orders">View All Orders</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ✅ ENHANCED: Failed State using lib/order-status */}
      {order && statusInfo.category === 'failed' && (
        <Card className="bg-red-900/20 border-red-600/30">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-4 text-red-300">
              {order.status === 'failed' ? 'Inscription Failed' : 'Order Cancelled'}
            </h3>
            <p className="text-red-200 text-sm mb-4">
              {statusInfo.description}
            </p>
            <div className="flex justify-center space-x-4">
              <Button onClick={onReset} className="bg-blue-600 hover:bg-blue-700 text-white">
                Try Again
              </Button>
              <Button variant="outline" onClick={onComplete} className="bg-gray-800 border-gray-600 text-gray-100 hover:bg-gray-700">
                View Details
              </Button>
              <Button variant="outline" asChild className="bg-gray-800 border-gray-600 text-gray-100 hover:bg-gray-700">
                <a href="/orders">View All Orders</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ✅ ENHANCED: Auto-refresh indicator using lib/order-status */}
      {order && isActiveStatus(order.status) && (
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Auto-refreshing every 10 seconds</span>
          <span className="text-xs">({statusInfo.timeEstimate} remaining)</span>
        </div>
      )}

      {/* Link to orders page */}
      <div className="text-center">
        <Button variant="link" asChild className="text-blue-400 hover:text-blue-300">
          <a href="/orders">
            View this order in your orders page →
          </a>
        </Button>
      </div>
    </div>
  )
}