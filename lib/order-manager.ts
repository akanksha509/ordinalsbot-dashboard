import { Order, OrderStatus } from '@/types'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, useCallback, useMemo } from 'react'
import { useToast } from '@/hooks/use-toast'
import { useLaserEyes } from '@omnisat/lasereyes-react'
import { getNetworkFromEnv } from './utils/index'
import { 
  calculateStatusCounts, 
  isActiveStatus, 
  isTerminalStatus,
  categorizeOrderStatus
} from './order-status'

// BACKWARD COMPATIBILITY: Re-export for existing imports
export { getNetworkFromEnv as getCurrentNetwork }

// Global query client access for cache invalidation
export function useOrderCacheManager() {
  const queryClient = useQueryClient()
  const network = getNetworkFromEnv()
  
  const invalidateOrderCaches = useCallback(() => {
    console.log(' Invalidating order caches...')
    
    // Invalidate all order-related queries
    queryClient.invalidateQueries({ 
      queryKey: ['orders', network] 
    })
    queryClient.invalidateQueries({ 
      queryKey: ['tracked-orders'] 
    })
    queryClient.invalidateQueries({ 
      queryKey: ['recent-orders'] 
    })
    
    // Force refetch immediately
    queryClient.refetchQueries({ 
      queryKey: ['orders', network] 
    })
  }, [queryClient, network])
  
  const addOrderToCache = useCallback((newOrder: Order) => {
    console.log(' Adding order to cache:', newOrder.id)
    
    // Update existing order queries with new order
    queryClient.setQueryData(['orders', network], (oldData: Order[] | undefined) => {
      if (!oldData) return [newOrder]
      
      // Check if order already exists
      const exists = oldData.some(order => order.id === newOrder.id)
      if (exists) return oldData
      
      // Add new order to beginning of list
      return [newOrder, ...oldData]
    })
    
    // Invalidate to trigger fresh fetch
    invalidateOrderCaches()
  }, [queryClient, network, invalidateOrderCaches])
  
  return {
    invalidateOrderCaches,
    addOrderToCache
  }
}

// Order validation function
function validateOrderId(orderId: string): { isValid: boolean; error?: string } {
  if (!orderId || typeof orderId !== 'string') {
    return { isValid: false, error: 'Order ID is required' }
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(orderId)) {
    return { isValid: false, error: 'Please enter a valid UUID format order ID' }
  }
  
  return { isValid: true }
}

// All order IDs in one place with proper typing
export const DEFAULT_ORDER_IDS: Record<'mainnet' | 'testnet', readonly string[]> = {
  mainnet: [
    '39c9bdcf-6459-4509-b7a6-7138ac826378', // Assessment order 1
    '7d138fda-001c-4421-b1df-cbb5b8571d20', // Assessment order 2
    '8bb1d29e-171a-4a63-9b38-c5ee3e7fe2e1', // Assessment order 3
    '800fa3c4-7004-43e8-823e-928a2e5c30a0', // Assessment order 4
  ],
  testnet: [
    'b1a8e829-5411-4b3e-8b41-c1a2894ee023', // real testnet text inscription
    '961a4f59-d6e7-4d08-b351-f9872f98b9d5', // real testnet BRC-20 Deploy
    'd857c9cd-b628-4b8c-8d03-e765563a4e50', // real testnet image inscription
  ]
} as const

// Get default orders for current network
export function getDefaultOrderIds(): string[] {
  const network = getNetworkFromEnv()
  return [...DEFAULT_ORDER_IDS[network]] // Create mutable copy
}

// Storage management with event dispatching
export class OrderStorage {
  private static getStorageKey(): string {
    const network = getNetworkFromEnv()
    return `trackedOrders_${network}`
  }

  // Get tracked order IDs
  static getTrackedOrderIds(): string[] {
    if (typeof window === 'undefined') return getDefaultOrderIds()
    
    try {
      const stored = localStorage.getItem(this.getStorageKey())
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      }
    } catch (error) {
      console.error('Error reading tracked orders:', error)
    }
    
    // Return defaults and save them
    const defaults = getDefaultOrderIds()
    this.saveTrackedOrderIds(defaults)
    return defaults
  }

  // Save tracked order IDs
  static saveTrackedOrderIds(orderIds: string[]): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem(this.getStorageKey(), JSON.stringify(orderIds))
      
      //  Dispatch storage event for cross-component sync
      const event = new StorageEvent('storage', {
        key: this.getStorageKey(),
        newValue: JSON.stringify(orderIds),
        storageArea: localStorage
      })
      window.dispatchEvent(event)
    } catch (error) {
      console.error('Error saving tracked orders:', error)
    }
  }

  // Add new order ID with validation
  static addOrderId(orderId: string): boolean {
    const validation = validateOrderId(orderId)
    if (!validation.isValid) {
      console.warn('Invalid order ID:', validation.error)
      return false
    }
    
    const current = this.getTrackedOrderIds()
    
    if (current.includes(orderId)) {
      return false 
    }
    
    const updated = [orderId, ...current] 
    this.saveTrackedOrderIds(updated)
    return true
  }

  // Remove order ID
  static removeOrderId(orderId: string): void {
    const current = this.getTrackedOrderIds()
    const updated = current.filter(id => id !== orderId)
    this.saveTrackedOrderIds(updated)
  }

  // Reset to defaults
  static resetToDefaults(): void {
    const defaults = getDefaultOrderIds()
    this.saveTrackedOrderIds(defaults)
  }

  // Add new inscription order with event dispatching
  static addNewInscriptionOrder(orderId: string): void {
    const added = this.addOrderId(orderId)
    
    if (added) {
      // Dispatch order creation event
      const event = new CustomEvent('orderCreated', {
        detail: { orderId, network: getNetworkFromEnv(), timestamp: Date.now() }
      })
      window.dispatchEvent(event)
      
      console.log(' New inscription order added:', orderId)
    }
  }
}

// Order status utilities
export class OrderUtils {
  // Status detection that returns valid OrderStatus values
  static getOrderStatus(order: Order): OrderStatus {
    // Cast to access 'state' property
    const orderData = order as any
    
    // If we have a 'state' field and status is generic, use state
    if (orderData.state && (orderData.status === 'ok' || !orderData.status)) {
      switch (orderData.state) {
        case 'waiting-payment': return 'payment-pending'
        case 'pending': return 'pending'
        case 'confirming': return 'confirming'
        case 'inscribing': return 'inscribing'
        case 'completed': return 'completed'
        case 'failed': return 'failed'
        case 'cancelled': return 'cancelled'
        default: return 'pending'
      }
    }
    
    // Use existing status but normalize it to valid OrderStatus values
    const status = order.status || 'pending'
    
    // Handle any other status mappings you might need
    switch (status) {
      case 'waiting-payment': return 'payment-pending'
      case 'payment-confirmed': return 'payment-received'
      case 'ready': return 'confirmed'
      case 'processing': return 'inscribing'
      case 'success': return 'completed'
      case 'error': return 'failed'
      case 'pending':
      case 'payment-pending':
      case 'payment-received':
      case 'confirming':
      case 'confirmed':
      case 'inscribing':
      case 'completed':
      case 'failed':
      case 'cancelled':
        return status as OrderStatus
      default: 
        // Always return a valid OrderStatus
        return 'pending'
    }
  }

  // Type-safe status checking
  static isActiveOrder(order: Order): boolean {
    const normalizedStatus = this.getOrderStatus(order)
    return isActiveStatus(normalizedStatus)
  }

  // Get orders that need auto-refresh with proper typing
  static getActiveOrders(orders: Order[]): Order[] {
    return orders.filter(this.isActiveOrder)
  }

  // Sort orders with proper typing
  static sortOrders(orders: Order[], sortBy: string, direction: 'asc' | 'desc' = 'desc'): Order[] {
    return [...orders].sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      switch (sortBy) {
        case 'newest':
        case 'createdAt':
          aValue = new Date(a.createdAt || 0).getTime()
          bValue = new Date(b.createdAt || 0).getTime()
          break
        case 'status':
          aValue = this.getOrderStatus(a)
          bValue = this.getOrderStatus(b)
          break
        case 'amount':
          aValue = a.paymentAmount || 0
          bValue = b.paymentAmount || 0
          break
        case 'type':
          aValue = a.type
          bValue = b.type
          break
        default:
          return 0
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }

      return direction === 'asc' 
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number)
    })
  }

  // Filter orders by search query
  static filterOrdersBySearch(orders: Order[], searchQuery: string): Order[] {
    if (!searchQuery.trim()) return orders

    const query = searchQuery.toLowerCase()
    
    return orders.filter(order => {
      const matchesId = order.id.toLowerCase().includes(query)
      const matchesType = order.type.toLowerCase().includes(query)
      const matchesTicker = order.brc20Details?.ticker?.toLowerCase().includes(query)
      
      return matchesId || matchesType || matchesTicker
    })
  }

  // Filter orders by status using normalized status
  static filterOrdersByStatus(orders: Order[], statusFilter: string): Order[] {
    if (statusFilter === 'all') return orders
    
    return orders.filter(order => {
      const normalizedStatus = this.getOrderStatus(order)
      return normalizedStatus === statusFilter
    })
  }

  // Filter orders by category using normalized status
  static filterOrdersByCategory(orders: Order[], category: 'all' | 'pending' | 'confirmed' | 'failed'): Order[] {
    if (category === 'all') return orders
    
    return orders.filter(order => {
      const normalizedStatus = this.getOrderStatus(order)
      return categorizeOrderStatus(normalizedStatus) === category
    })
  }

  // Get order description for display
  static getOrderDescription(order: Order): string {
    // BRC-20 details
    if (order.brc20Details?.ticker) {
      const { ticker, operation, amount } = order.brc20Details
      const operationText = operation?.toUpperCase() || 'UNKNOWN'
      const amountText = amount ? ` ${amount}` : ''
      return `${operationText}${amountText} ${ticker}`.trim()
    }
    
    // Inscriptions details
    if (order.inscriptions && order.inscriptions.length > 0) {
      const fileCount = order.inscriptions.length
      const firstFile = order.inscriptions[0]
      
      if (fileCount === 1) {
        return firstFile.fileName || firstFile.fileType || 'Single inscription'
      } else {
        return `${fileCount} inscriptions`
      }
    }

    // Files details
    if (order.files && order.files.length > 0) {
      const fileCount = order.files.length
      if (fileCount === 1) {
        return order.files[0].name || order.files[0].type || 'Single file'
      } else {
        return `${fileCount} files`
      }
    }

    // Fallback to type
    return this.getOrderTypeDisplay(order.type)
  }

  // Get order type display name
  static getOrderTypeDisplay(type: string): string {
    switch (type) {
      case 'inscription': return 'Inscription'
      case 'brc20-mint': return 'BRC-20 Mint'
      case 'brc20-transfer': return 'BRC-20 Transfer'
      case 'brc20-deploy': return 'BRC-20 Deploy'
      case 'collection': return 'Collection'
      case 'bulk': return 'Bulk Order'
      default: return type || 'Order'
    }
  }
}

// Order fetching logic
export class OrderFetcher {
  // Fetch single order
  static async fetchOrder(orderId: string): Promise<Order | null> {
    try {
      const response = await fetch(`/api/order?id=${encodeURIComponent(orderId)}`)
      
      if (!response.ok) {
        console.warn(`Failed to fetch order ${orderId}: ${response.status}`)
        return null
      }

      const result = await response.json()
      
      if (!result.success || !result.data) {
        console.warn(`Invalid order data for ${orderId}:`, result)
        return null
      }

      // Add network context with proper typing
      const orderWithNetwork: Order = {
        ...result.data,
        network: getNetworkFromEnv(),
        // Normalize status immediately when fetching
        status: OrderUtils.getOrderStatus(result.data)
      }

      return orderWithNetwork
    } catch (error) {
      console.error(`Error fetching order ${orderId}:`, error)
      return null
    }
  }

  // Fetch multiple orders
  static async fetchMultipleOrders(orderIds: string[]): Promise<Order[]> {
    if (orderIds.length === 0) return []

    const orderPromises = orderIds.map(orderId => this.fetchOrder(orderId))
    const results = await Promise.all(orderPromises)
    
    // Filter out null results
    return results.filter((order): order is Order => order !== null)
  }

  // Fetch tracked orders
  static async fetchTrackedOrders(): Promise<Order[]> {
    const trackedIds = OrderStorage.getTrackedOrderIds()
    return this.fetchMultipleOrders(trackedIds)
  }
}

export const ORDER_QUERY_CONFIG = {
  staleTime: 10000, 
  
  // Refetch interval based on active orders
  getRefetchInterval: (orders: Order[] | undefined): number | false => {
    if (!orders) return false
    
    const hasActiveOrders = orders.some(order => OrderUtils.isActiveOrder(order))
    return hasActiveOrders ? 30000 : false 
  },

  // Query key factory
  getQueryKey: (
    type: 'single' | 'multiple' | 'tracked', 
    identifier?: string | string[]
  ): (string | string[] | undefined)[] => {
    const network = getNetworkFromEnv()
    
    switch (type) {
      case 'single':
        return ['order', identifier, network]
      case 'multiple':
        return ['orders', identifier, network]
      case 'tracked':
        return ['tracked-orders', OrderStorage.getTrackedOrderIds(), network]
      default:
        return ['orders', network]
    }
  }
}

// Custom status counts function that uses normalized status
function calculateNormalizedStatusCounts(orders: Order[]) {
  // First normalize all statuses, then calculate counts
  const normalizedOrders = orders.map(order => ({
    ...order,
    status: OrderUtils.getOrderStatus(order)
  }))
  
  return calculateStatusCounts(normalizedOrders)
}

// Main order management hook with cache management
export function useOrderManager(options: {
  maxOrders?: number
  showFilters?: boolean
  autoRefresh?: boolean
  requireWallet?: boolean
} = {}) {
  const { maxOrders, showFilters = false, autoRefresh = true, requireWallet = false } = options
  const { toast } = useToast()
  const laserEyes = useLaserEyes()
  const { invalidateOrderCaches } = useOrderCacheManager() 
     
  const isWalletConnected = laserEyes.connected || false
  const walletAddress = laserEyes.address
  const currentNetwork = getNetworkFromEnv()
     
  // State management
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('newest')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const shouldFetchOrders = !requireWallet || isWalletConnected

  // Main query with cache management
  const {
    data: orders = [],
    isLoading,
    error: queryError,
    refetch
  } = useQuery({
    queryKey: ORDER_QUERY_CONFIG.getQueryKey('tracked'),
    queryFn: async (): Promise<Order[]> => {
      console.log('🔍 Fetching orders...')
      
      if (requireWallet && !isWalletConnected) {
        return []
      }
      
      if (!requireWallet && !isWalletConnected) {
        return OrderFetcher.fetchMultipleOrders([...getDefaultOrderIds()])
      }
      
      return OrderFetcher.fetchTrackedOrders()
    },
    enabled: shouldFetchOrders,
    staleTime: ORDER_QUERY_CONFIG.staleTime, 
    gcTime: 30000, 
    refetchInterval: autoRefresh ? (query) => {
      const orders = query?.state?.data as Order[] | undefined
      const hasActiveOrders = orders?.some((order: Order) => OrderUtils.isActiveOrder(order))
      return hasActiveOrders ? 30000 : false 
    } : false,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always', 
  })

  const error = queryError instanceof Error ? queryError.message : null

  // Use normalized status counts function
  const statusCounts = useMemo(() => calculateNormalizedStatusCounts(orders), [orders])
  
  const activeOrderCount = useMemo(() => 
    orders.filter(order => OrderUtils.isActiveOrder(order)).length, 
    [orders]
  )

  const filteredOrders = useMemo(() => {
    if (!showFilters) {
      return maxOrders ? orders.slice(0, maxOrders) : orders
    }

    let filtered = OrderUtils.filterOrdersBySearch(orders, searchQuery)
    filtered = OrderUtils.filterOrdersByStatus(filtered, statusFilter)
    filtered = OrderUtils.sortOrders(filtered, sortBy, sortDirection)
    
    return maxOrders ? filtered.slice(0, maxOrders) : filtered
  }, [orders, showFilters, searchQuery, statusFilter, sortBy, sortDirection, maxOrders])

  // Actions with cache invalidation
  const addOrderId = useCallback((orderId: string): boolean => {
    const added = OrderStorage.addOrderId(orderId)
         
    if (added) {
      toast({
        title: "Order added",
        description: `Order added to ${currentNetwork} tracking list`,
      })
      
      // Invalidate cache immediately
      invalidateOrderCaches()
      refetch()
    } else {
      toast({
        title: "Order already tracked",
        description: "This order is already in your tracking list",
        variant: "destructive",
      })
    }
         
    return added
  }, [toast, refetch, currentNetwork, invalidateOrderCaches])

  const removeOrderId = useCallback((orderId: string) => {
    OrderStorage.removeOrderId(orderId)
    toast({
      title: "Order removed",
      description: `Order removed from ${currentNetwork} tracking list`,
    })
    
    // Invalidate cache immediately
    invalidateOrderCaches()
    refetch()
  }, [toast, refetch, currentNetwork, invalidateOrderCaches])

  const resetToDefaults = useCallback(() => {
    OrderStorage.resetToDefaults()
    toast({
      title: "Reset to default orders",
      description: `Now showing default ${currentNetwork} orders`,
    })
    
    // Invalidate cache immediately
    invalidateOrderCaches()
    refetch()
  }, [toast, refetch, currentNetwork, invalidateOrderCaches])

  // Category filtering function
  const filterByCategory = useCallback((category: 'all' | 'pending' | 'confirmed' | 'failed') => {
    return OrderUtils.filterOrdersByCategory(orders, category)
  }, [orders])

  // Force refresh function
  const forceRefresh = useCallback(() => {
    console.log(' Force refreshing orders...')
    invalidateOrderCaches()
    return refetch()
  }, [invalidateOrderCaches, refetch])

  // Return all properties
  return {
    // Data
    orders: filteredOrders,
    filteredOrders,
    allOrders: orders,
    isLoading: !shouldFetchOrders ? false : isLoading,
    error,
         
    // Stats
    statusCounts,
    activeOrderCount,
         
    // Actions
    refetch,
    forceRefresh,
    addOrderId,
    removeOrderId,
    resetToDefaults,
    filterByCategory,
         
    // Filtering
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
    showFilters,
         
    // Wallet state
    isWalletConnected,
    walletAddress,
         
    // Network info
    network: currentNetwork
  }
}

// Specialized hooks with cache management
export function useRecentOrders(maxOrders: number = 5) {
  return useOrderManager({ 
    maxOrders,
    showFilters: false,
    autoRefresh: true,
    requireWallet: false
  })
}

export function useOrdersPage() {
  return useOrderManager({
    showFilters: true,
    autoRefresh: true,
    requireWallet: false
  })
}

// useOrder hook with better caching
export function useOrder(orderId: string) {
  return useQuery({
    queryKey: ORDER_QUERY_CONFIG.getQueryKey('single', orderId),
    queryFn: async (): Promise<Order | null> => {
      return OrderFetcher.fetchOrder(orderId)
    },
    enabled: !!orderId,
    staleTime: ORDER_QUERY_CONFIG.staleTime,
    gcTime: 30000,
    refetchInterval: (query) => {
      const order = query?.state?.data as Order | null
      return order && OrderUtils.isActiveOrder(order) 
        ? 10000 
        : false
    },
    refetchOnWindowFocus: true,
    refetchOnMount: 'always', 
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes('not found')) {
        return false
      }
      return failureCount < 3
    },
  })
}