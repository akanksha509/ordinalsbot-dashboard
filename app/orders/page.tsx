'use client'

import { useState } from 'react'
import { Search, Plus, RefreshCw, Filter, Download, Network } from 'lucide-react'
import { Header } from '@/components/Layout/Header'
import { NetworkBar } from '@/components/Layout/NetworkBar'
import { Footer } from '@/components/Layout/Footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { OrderRow } from '@/components/orders/OrderRow'
import { useOrdersPage, getCurrentNetwork } from '@/lib/order-manager'
import { categorizeOrderStatus } from '@/lib/order-status'

export default function OrdersPage() {
  const currentNetwork = getCurrentNetwork()
  
  const {
    orders,
    isLoading,
    error,
    statusCounts,
    filteredOrders,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
    refetch
  } = useOrdersPage()

  const handleOrderClick = (orderId: string) => {
    window.location.href = `/orders/${orderId}`
  }

  const exportOrders = () => {
    if (!filteredOrders || filteredOrders.length === 0) return

    const csvContent = [
      ['Order ID', 'Type', 'Status', 'Category', 'Created', 'Amount (sats)', 'Ticker', 'Inscription ID', 'Network'].join(','),
      ...filteredOrders.map((order) => [
        order.id,
        order.type,
        order.status,
        categorizeOrderStatus(order.status), 
        new Date(order.createdAt || 0).toISOString(),
        order.paymentAmount || 0,
        order.brc20Details?.ticker || '',
        order.inscriptionId || '',
        currentNetwork
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ordinalsbot-orders-${currentNetwork}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleSortChange = (newSort: string) => {
    if (sortBy === newSort) {
      setSortDirection?.(sortDirection === 'desc' ? 'asc' : 'desc')
    } else {
      setSortBy?.(newSort)
      setSortDirection?.('desc')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <NetworkBar />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center space-x-3">
              <span>Your Orders</span>
              <Badge 
                variant={currentNetwork === 'testnet' ? "default" : "outline"} 
                className={currentNetwork === 'testnet' ? "bg-blue-500 text-white" : "border-green-500 text-green-600"}
              >
                <Network className="h-3 w-3 mr-1" />
                {currentNetwork.toUpperCase()}
              </Badge>
            </h1>
            <p className="text-muted-foreground">
              {currentNetwork === 'testnet' 
                ? "Track and manage your testnet inscription orders" 
                : "Track and manage your OrdinalsBot assessment orders"
              }
            </p>
          </div>

          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            <Button asChild>
              <a href="/inscribe">
                Create Inscription
              </a>
            </Button>
          </div>
        </div>

        {/* Stats Cards with Categorized Counts */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{statusCounts.all || 0}</div>
              <p className="text-sm text-muted-foreground">Total Orders</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">{statusCounts.categorized?.pending || 0}</div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-xs text-muted-foreground/70">Payment not completed</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{statusCounts.categorized?.confirmed || 0}</div>
              <p className="text-sm text-muted-foreground">Confirmed</p>
              <p className="text-xs text-muted-foreground/70">Inscription successful</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{statusCounts.categorized?.failed || 0}</div>
              <p className="text-sm text-muted-foreground">Failed</p>
              <p className="text-xs text-muted-foreground/70">Payment or inscription failed</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filter & Search</CardTitle>
            <CardDescription>
              Find specific orders or filter by status category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by order ID, type, or ticker..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery?.(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Status Filter with Categories */}
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter?.(value)}>
                <SelectTrigger className="w-56">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Orders ({statusCounts.all || 0})</SelectItem>
                  
                  <SelectItem value="pending">
                    🟡 Pending ({statusCounts.categorized?.pending || 0})
                  </SelectItem>
                  <SelectItem value="confirmed">
                    🟢 Confirmed ({statusCounts.categorized?.confirmed || 0})
                  </SelectItem>
                  <SelectItem value="failed">
                    🔴 Failed ({statusCounts.categorized?.failed || 0})
                  </SelectItem>
                  
                  {statusCounts.completed > 0 && (
                    <SelectItem value="completed"> Completed ({statusCounts.completed})</SelectItem>
                  )}
                  {statusCounts.inscribing > 0 && (
                    <SelectItem value="inscribing"> Inscribing ({statusCounts.inscribing})</SelectItem>
                  )}
                  {statusCounts.confirming > 0 && (
                    <SelectItem value="confirming"> Confirming ({statusCounts.confirming})</SelectItem>
                  )}
                  {statusCounts['payment-pending'] > 0 && (
                    <SelectItem value="payment-pending"> Payment Pending ({statusCounts['payment-pending']})</SelectItem>
                  )}
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select 
                value={`${sortBy}-${sortDirection}`} 
                onValueChange={(value) => {
                  const [newSort, newDirection] = value.split('-')
                  setSortBy?.(newSort)
                  setSortDirection?.(newDirection as 'asc' | 'desc')
                }}
              >
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest-desc">Newest First</SelectItem>
                  <SelectItem value="newest-asc">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Active Filters */}
            {(searchQuery || statusFilter !== 'all') && (
              <div className="flex items-center space-x-2 mt-4">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {searchQuery && (
                  <Badge variant="secondary">
                    Search: "{searchQuery}"
                  </Badge>
                )}
                {statusFilter !== 'all' && (
                  <Badge variant="secondary">
                    Status: {statusFilter}
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery?.('')
                    setStatusFilter?.('all')
                  }}
                >
                  Clear
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Orders List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Orders ({filteredOrders?.length || 0})</CardTitle>
                <CardDescription>
                  {filteredOrders?.length === 0 ? 'No orders found' : 
                   `Showing ${filteredOrders?.length || 0} of ${orders.length} tracked ${currentNetwork} orders`}
                </CardDescription>
              </div>

              {(filteredOrders?.length || 0) > 0 && (
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={exportOrders}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Loading State */}
            {isLoading && (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={`loading-skeleton-${i}`} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            )}

            {/* Error State */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>
                  Failed to load {currentNetwork} orders from OrdinalsBot API. Please check your connection and try refreshing.
                </AlertDescription>
              </Alert>
            )}

            {/* Orders List */}
            {!isLoading && !error && (
              <div className="space-y-3">
                {(filteredOrders && filteredOrders.length > 0) ? (
                  filteredOrders.map((order, index) => (
                    <OrderRow
                      key={`order-${order.id}-${index}`}
                      order={order}
                      onClick={() => handleOrderClick(order.id)}
                      showDetails={false}
                    />
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="mb-4">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">
                        {orders.length === 0 ? `No ${currentNetwork} orders tracked yet` : 'No matching orders'}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {orders.length === 0 
                          ? `Start by creating an inscription or tracking an existing ${currentNetwork} OrdinalsBot order`
                          : 'Try adjusting your search or filter criteria'
                        }
                      </p>
                    </div>
                    
                    <div className="flex justify-center space-x-2">
                      <Button variant="outline" asChild>
                        <a href="/inscribe">
                          Create Inscription
                        </a>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Order Category Legend */}
            {!isLoading && !error && orders.length > 0 && (
              <div className="mt-6 pt-6 border-t border-border">
                <h4 className="text-sm font-medium mb-3 text-muted-foreground">Order Status Categories:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <div>
                      <div className="font-medium">Pending</div>
                      <div className="text-muted-foreground">Order created but payment not completed</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <div className="font-medium">Confirmed</div>
                      <div className="text-muted-foreground">Payment completed and inscription successful</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div>
                      <div className="font-medium">Failed</div>
                      <div className="text-muted-foreground">Payment failed OR inscription failed</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  )
}