'use client'

import { useState } from 'react'
import { ExternalLink, Copy, MoreHorizontal, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { StatusBadge } from './StatusBadge'
import { OrderRowProps } from '@/types'
import { FormattingUtils, copyToClipboard, getNetworkFromEnv } from '@/lib/utils/index'
import { cn } from '@/lib/utils/index'

export function OrderRow({ order, onClick, showDetails = false }: OrderRowProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Handle undefined order gracefully
  if (!order || !order.id) {
    return (
      <div className="border rounded-lg p-4 bg-muted/50">
        <p className="text-muted-foreground text-sm">Invalid order data</p>
      </div>
    )
  }

  const handleCopyOrderId = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent row click
    copyToClipboard(order.id, 'Order ID')
  }

  const handleCopyTxid = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent row click
    if (!order.txid) return
    copyToClipboard(order.txid, 'Transaction ID')
  }

  const handleViewExplorer = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent row click
    if (!order.txid) return
    const network = getNetworkFromEnv()
    const explorerUrl = network === 'testnet' 
      ? `https://mempool.space/testnet/tx/${order.txid}`
      : `https://mempool.space/tx/${order.txid}`
    window.open(explorerUrl, '_blank')
  }

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent row click
    if (onClick) {
      onClick()
    }
  }

  const handleRowClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on interactive elements
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('[role="button"]')) {
      return
    }
    
    if (onClick) {
      onClick()
    }
  }

  // Order type detection with fallbacks
  const getOrderTypeDisplay = () => {
    if (!order.type) return 'Order'
    
    switch (order.type) {
      case 'inscription': return 'Inscription'
      case 'brc20-mint': return 'BRC-20 Mint'
      case 'brc20-transfer': return 'BRC-20 Transfer'
      case 'collection': return 'Collection'
      case 'bulk': return 'Bulk Order'
      default: return order.type || 'Order'
    }
  }

  // Better description with more fallbacks
  const getOrderDescription = () => {
    // Try BRC-20 details first
    if (order.brc20Details?.ticker) {
      const { ticker, operation, amount } = order.brc20Details
      const operationText = operation?.toUpperCase() || 'UNKNOWN'
      const amountText = amount ? ` ${amount}` : ''
      return `${operationText}${amountText} ${ticker}`.trim()
    }
    
    // Try inscriptions details
    if (order.inscriptions && order.inscriptions.length > 0) {
      const fileCount = order.inscriptions.length
      const firstFile = order.inscriptions[0]
      
      if (fileCount === 1) {
        return firstFile.fileName || firstFile.fileType || 'Single inscription'
      } else {
        return `${fileCount} inscriptions`
      }
    }

    // Try files details
    if (order.files && order.files.length > 0) {
      const fileCount = order.files.length
      if (fileCount === 1) {
        return order.files[0].name || order.files[0].type || 'Single file'
      } else {
        return `${fileCount} files`
      }
    }

    // Fall back to type display
    return getOrderTypeDisplay()
  }

  return (
    <div 
      className={cn(
        "border rounded-lg transition-all duration-200 hover:shadow-md hover:bg-accent/50",
        onClick && "cursor-pointer",
        isExpanded && "shadow-md"
      )}
      onClick={handleRowClick}
    >
      {/* Main Row */}
      <div className="flex items-center justify-between p-4">
        {/* Left side - Order info */}
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          {/* Status indicator */}
          <div className="flex-shrink-0">
            <StatusBadge status={order.status || 'pending'} size="sm" />
          </div>

          {/* Order details */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center space-x-2">
              <p className="font-mono text-sm font-medium truncate">
                {FormattingUtils.formatOrderId(order.id)}
              </p>
            </div>
            
            <p className="text-sm text-muted-foreground truncate">
              {getOrderDescription()}
            </p>
            
            <div className="flex items-center space-x-3 text-xs text-muted-foreground">
              <span>{FormattingUtils.timeAgo(order.createdAt)}</span>
              
              {/* Safe payment amount rendering */}
              {order.paymentAmount && order.paymentAmount > 0 && (
                <>
                  <span>•</span>
                  <span>{FormattingUtils.formatSatoshis(order.paymentAmount)}</span>
                </>
              )}
              
              {/* Safe confirmations rendering */}
              {typeof order.confirmations === 'number' && order.confirmations >= 0 && (
                <>
                  <span>•</span>
                  <span>{order.confirmations} confirmations</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          {/* Quick actions */}
          {showDetails && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                setIsExpanded(!isExpanded)
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}

          {/* More actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Order Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={handleCopyOrderId}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Order ID
              </DropdownMenuItem>
              
              {order.txid && (
                <>
                  <DropdownMenuItem onClick={handleCopyTxid}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Transaction ID
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={handleViewExplorer}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View on Explorer
                  </DropdownMenuItem>
                </>
              )}
              
              {onClick && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleViewDetails}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && showDetails && (
        <div className="border-t border-border p-4 bg-muted/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {/* Payment Details */}
            <div className="space-y-2">
              <h4 className="font-medium">Payment Details</h4>
              <div className="space-y-1 text-muted-foreground">
                <div className="flex justify-between">
                  <span>Payment Address:</span>
                  <code className="text-xs">
                    {FormattingUtils.truncateAddress(order.paymentAddress)}
                  </code>
                </div>
                {order.paymentAmount && order.paymentAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span>{FormattingUtils.formatSatoshis(order.paymentAmount)}</span>
                  </div>
                )}
                {order.feeRate && order.feeRate > 0 && (
                  <div className="flex justify-between">
                    <span>Fee Rate:</span>
                    <span>{FormattingUtils.formatFeeRate(order.feeRate)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Transaction Details */}
            {(order.txid || order.inscriptionId) && (
              <div className="space-y-2">
                <h4 className="font-medium">Transaction Details</h4>
                <div className="space-y-1 text-muted-foreground">
                  {order.txid && (
                    <div className="flex justify-between">
                      <span>Transaction ID:</span>
                      <code className="text-xs">
                        {FormattingUtils.truncateTxid(order.txid)}
                      </code>
                    </div>
                  )}
                  {order.inscriptionId && (
                    <div className="flex justify-between">
                      <span>Inscription ID:</span>
                      <code className="text-xs">
                        {FormattingUtils.truncateTxid(order.inscriptionId)}
                      </code>
                    </div>
                  )}
                  {order.inscriptionNumber && (
                    <div className="flex justify-between">
                      <span>Inscription #:</span>
                      <span>{FormattingUtils.formatInscriptionNumber(order.inscriptionNumber)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* BRC-20 Details */}
          {order.brc20Details && (
            <div className="mt-4 pt-4 border-t border-border">
              <h4 className="font-medium mb-2">BRC-20 Details</h4>
              <div className="flex flex-wrap gap-2">
                {order.brc20Details.ticker && (
                  <Badge variant="secondary">
                    {order.brc20Details.ticker}
                  </Badge>
                )}
                {order.brc20Details.operation && (
                  <Badge variant="outline">
                    {order.brc20Details.operation.toUpperCase()}
                  </Badge>
                )}
                {order.brc20Details.amount && (
                  <Badge variant="outline">
                    {order.brc20Details.amount}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}