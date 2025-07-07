import { OrderStatus } from '@/types'

// Define all possible order statuses
export type OrderStatusType = 
  | 'pending'
  | 'payment-pending'
  | 'waiting-payment'
  | 'payment-received'
  | 'payment-confirmed'
  | 'confirming'
  | 'confirmed'
  | 'ready'
  | 'inscribing'
  | 'processing'
  | 'completed'
  | 'success'
  | 'failed'
  | 'cancelled'
  | 'error'

// Status categories for consistent UI grouping
export const ORDER_STATUS_CATEGORIES = {
  PENDING: ['pending', 'payment-pending', 'payment-received', 'confirming', 'confirmed', 'inscribing', 'failed', 'waiting-payment', 'payment-confirmed', 'ready', 'processing'] as OrderStatus[],
  CONFIRMED: ['completed', 'success'] as OrderStatus[],
  FAILED: ['cancelled', 'error'] as OrderStatus[]
} as const

// Status progression order for timeline components 
export const STATUS_PROGRESSION_ORDER: Record<OrderStatus, number> = {
  'pending': 0,
  'payment-pending': 0,
  'waiting-payment': 0,
  'payment-received': 1,
  'payment-confirmed': 1,
  'confirming': 1,
  'confirmed': 2,
  'ready': 2,
  'inscribing': 2,
  'processing': 2,
  'completed': 3,
  'success': 3,
  'failed': -1,
  'cancelled': -1,
  'error': -1
} as const

// Status configuration for badges, icons, and UI 
export const STATUS_CONFIG: Record<OrderStatus, {
  label: string
  shortLabel: string
  category: 'pending' | 'confirmed' | 'failed'
  color: string
  bgColor: string
  borderColor: string
  description: string
  isActive: boolean
  isTerminal: boolean
  icon: string
  badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
  progressWeight: number
}> = {
  'pending': {
    label: 'Pending',
    shortLabel: 'Pending',
    category: 'pending',
    color: 'text-slate-400',
    bgColor: 'bg-slate-800/50',
    borderColor: 'border-slate-600',
    description: 'Order created, waiting for payment',
    isActive: true,
    isTerminal: false,
    icon: 'Clock',
    badgeVariant: 'outline',
    progressWeight: 0
  },
  'payment-pending': {
    label: 'Payment Pending',
    shortLabel: 'Payment',
    category: 'pending',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-900/30',
    borderColor: 'border-cyan-500',
    description: 'Waiting for payment confirmation',
    isActive: true,
    isTerminal: false,
    icon: 'CreditCard',
    badgeVariant: 'outline',
    progressWeight: 0
  },
  'waiting-payment': {
    label: 'Waiting Payment',
    shortLabel: 'Waiting',
    category: 'pending',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-900/30',
    borderColor: 'border-yellow-500',
    description: 'Waiting for payment to be sent',
    isActive: true,
    isTerminal: false,
    icon: 'Clock',
    badgeVariant: 'outline',
    progressWeight: 0
  },
  'payment-received': {
    label: 'Payment Received',
    shortLabel: 'Paid',
    category: 'pending',
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/30',
    borderColor: 'border-blue-500',
    description: 'Payment confirmed, processing order',
    isActive: true,
    isTerminal: false,
    icon: 'CheckCircle',
    badgeVariant: 'default',
    progressWeight: 25
  },
  'payment-confirmed': {
    label: 'Payment Confirmed',
    shortLabel: 'Confirmed',
    category: 'pending',
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/30',
    borderColor: 'border-blue-500',
    description: 'Payment has been confirmed',
    isActive: true,
    isTerminal: false,
    icon: 'CheckCircle',
    badgeVariant: 'default',
    progressWeight: 40
  },
  'confirming': {
    label: 'Confirming',
    shortLabel: 'Confirming',
    category: 'pending',
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/30',
    borderColor: 'border-blue-500',
    description: 'Waiting for blockchain confirmations',
    isActive: true,
    isTerminal: false,
    icon: 'Loader2',
    badgeVariant: 'default',
    progressWeight: 50
  },
  'confirmed': {
    label: 'Confirmed',
    shortLabel: 'Confirmed',
    category: 'pending',
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/30',
    borderColor: 'border-blue-500',
    description: 'Payment confirmed, ready to inscribe',
    isActive: true,
    isTerminal: false,
    icon: 'CheckCircle',
    badgeVariant: 'default',
    progressWeight: 65
  },
  'ready': {
    label: 'Ready',
    shortLabel: 'Ready',
    category: 'pending',
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/30',
    borderColor: 'border-blue-500',
    description: 'Ready for processing',
    isActive: true,
    isTerminal: false,
    icon: 'CheckCircle',
    badgeVariant: 'default',
    progressWeight: 60
  },
  'inscribing': {
    label: 'Inscribing',
    shortLabel: 'Inscribing',
    category: 'pending',
    color: 'text-purple-400',
    bgColor: 'bg-purple-900/30',
    borderColor: 'border-purple-500',
    description: 'Creating inscription on Bitcoin',
    isActive: true,
    isTerminal: false,
    icon: 'Zap',
    badgeVariant: 'default',
    progressWeight: 85
  },
  'processing': {
    label: 'Processing',
    shortLabel: 'Processing',
    category: 'pending',
    color: 'text-purple-400',
    bgColor: 'bg-purple-900/30',
    borderColor: 'border-purple-500',
    description: 'Order is being processed',
    isActive: true,
    isTerminal: false,
    icon: 'Loader2',
    badgeVariant: 'default',
    progressWeight: 80
  },
  'completed': {
    label: 'Completed',
    shortLabel: 'Complete',
    category: 'confirmed',
    color: 'text-green-400',
    bgColor: 'bg-green-900/30',
    borderColor: 'border-green-500',
    description: 'Inscription completed successfully',
    isActive: false,
    isTerminal: true,
    icon: 'CheckCircle',
    badgeVariant: 'success',
    progressWeight: 100
  },
  'success': {
    label: 'Success',
    shortLabel: 'Success',
    category: 'confirmed',
    color: 'text-green-400',
    bgColor: 'bg-green-900/30',
    borderColor: 'border-green-500',
    description: 'Order completed successfully',
    isActive: false,
    isTerminal: true,
    icon: 'CheckCircle',
    badgeVariant: 'success',
    progressWeight: 100
  },
  'failed': {
    label: 'Payment Failed',
    shortLabel: 'Failed',
    category: 'pending',
    color: 'text-red-400',
    bgColor: 'bg-red-900/30',
    borderColor: 'border-red-500',
    description: 'Payment failed - can be retried',
    isActive: true,
    isTerminal: false,
    icon: 'XCircle',
    badgeVariant: 'destructive',
    progressWeight: 0
  },
  'cancelled': {
    label: 'Cancelled',
    shortLabel: 'Cancelled',
    category: 'failed',
    color: 'text-gray-400',
    bgColor: 'bg-gray-800/50',
    borderColor: 'border-gray-600',
    description: 'Order was cancelled',
    isActive: false,
    isTerminal: true,
    icon: 'XCircle',
    badgeVariant: 'outline',
    progressWeight: 0
  },
  'error': {
    label: 'Error',
    shortLabel: 'Error',
    category: 'failed',
    color: 'text-red-400',
    bgColor: 'bg-red-900/30',
    borderColor: 'border-red-500',
    description: 'Order encountered an error',
    isActive: false,
    isTerminal: true,
    icon: 'XCircle',
    badgeVariant: 'destructive',
    progressWeight: 0
  }
} as const

// Categorize any status into pending/confirmed/failed
export function categorizeOrderStatus(status: string): 'pending' | 'confirmed' | 'failed' {
  if (!status) return 'failed'
  
  const normalizedStatus = status.toLowerCase() as OrderStatus
  
  for (const [category, statuses] of Object.entries(ORDER_STATUS_CATEGORIES)) {
    if (statuses.includes(normalizedStatus)) {
      return category.toLowerCase() as 'pending' | 'confirmed' | 'failed'
    }
  }
  
  // Default fallback
  return 'failed'
}

// Get status configuration
export function getStatusConfig(status: OrderStatus) {
  return STATUS_CONFIG[status] || STATUS_CONFIG.pending
}

// Get status category counts 
export function calculateStatusCounts(orders: Array<{ status: OrderStatus }>) {
  const counts = {
    all: 0,
    pending: 0,
    'payment-pending': 0,
    'waiting-payment': 0,
    'payment-received': 0,
    'payment-confirmed': 0,
    confirming: 0,
    confirmed: 0,
    ready: 0,
    inscribing: 0,
    processing: 0,
    completed: 0,
    success: 0,
    failed: 0,
    cancelled: 0,
    error: 0,
    categorized: {
      pending: 0,    
      confirmed: 0,  
      failed: 0      
    }
  }

  orders.forEach(order => {
    if (!order?.status) return
    
    counts.all += 1
    
    // HANDLE ALL STATUS TYPES
    const status = order.status as keyof typeof counts
    if (status in counts && typeof counts[status] === 'number') {
      (counts[status] as number) += 1
    }
    
    // Category counts for UI tabs
    const category = categorizeOrderStatus(order.status)
    counts.categorized[category] += 1
  })

  return counts
}

// Check if status is terminal 
export function isTerminalStatus(status: OrderStatus): boolean {
  return STATUS_CONFIG[status]?.isTerminal || false
}

//  Check if status is active (should poll for updates)
export function isActiveStatus(status: OrderStatus): boolean {
  return STATUS_CONFIG[status]?.isActive || false
}

// Get progress percentage for timeline/progress bars
export function getStatusProgress(status: OrderStatus): number {
  return STATUS_CONFIG[status]?.progressWeight || 0
}

// Get next expected status (for progress indication)
export function getNextStatus(currentStatus: OrderStatus): OrderStatus | null {
  const currentOrder = STATUS_PROGRESSION_ORDER[currentStatus]
  if (currentOrder === -1 || currentOrder >= 3) return null 
  
  // Find next status with higher order
  for (const [status, order] of Object.entries(STATUS_PROGRESSION_ORDER)) {
    if (order === currentOrder + 1) {
      return status as OrderStatus
    }
  }
  
  return null
}

// Format status for display
export function formatStatusDisplay(status: OrderStatus, options: {
  short?: boolean
  withIcon?: boolean
  withColor?: boolean
} = {}) {
  const config = getStatusConfig(status)
  
  let display = options.short ? config.shortLabel : config.label
  
  if (options.withIcon) {
    display = `${config.icon} ${display}`
  }
  
  if (options.withColor) {
    return {
      text: display,
      className: config.color,
      bgClassName: config.bgColor,
      borderClassName: config.borderColor
    }
  }
  
  return display
}

// Filter orders by status category 
export function filterOrdersByCategory(
  orders: Array<{ status: OrderStatus }>,
  category: 'all' | 'pending' | 'confirmed' | 'failed'
) {
  if (category === 'all') return orders
  
  return orders.filter(order => {
    if (!order?.status) return false
    return categorizeOrderStatus(order.status) === category
  })
}

// Sort orders by status priority
export function sortOrdersByStatus(
  orders: Array<{ status: OrderStatus; createdAt?: string | number }>,
  direction: 'asc' | 'desc' = 'desc'
) {
  return orders.sort((a, b) => {
    const aOrder = STATUS_PROGRESSION_ORDER[a.status] || 0
    const bOrder = STATUS_PROGRESSION_ORDER[b.status] || 0
    
    // First sort by status order
    if (aOrder !== bOrder) {
      return direction === 'desc' ? bOrder - aOrder : aOrder - bOrder
    }
    
    // Then by creation date for same status
    const aTime = typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : (a.createdAt || 0)
    const bTime = typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : (b.createdAt || 0)
    
    return direction === 'desc' ? bTime - aTime : aTime - bTime
  })
}

// Get status badge props for UI components
export function getStatusBadgeProps(status: OrderStatus) {
  const config = getStatusConfig(status)
  return {
    variant: config.badgeVariant,
    className: `${config.color} ${config.bgColor} ${config.borderColor}`,
    children: config.label
  }
}

// Get timeline step info
export function getTimelineSteps() {
  return [
    {
      status: 'payment-pending' as OrderStatus,
      label: 'Payment',
      description: 'Waiting for payment',
      order: 0
    },
    {
      status: 'confirming' as OrderStatus,
      label: 'Confirmation',
      description: 'Confirming transaction',
      order: 1
    },
    {
      status: 'inscribing' as OrderStatus,
      label: 'Inscribing',
      description: 'Creating inscription',
      order: 2
    },
    {
      status: 'completed' as OrderStatus,
      label: 'Complete',
      description: 'Inscription ready',
      order: 3
    }
  ]
}

// Check if order needs attention (failed, needs payment, etc)
export function orderNeedsAttention(status: OrderStatus): boolean {
  return ['pending', 'payment-pending', 'waiting-payment', 'failed', 'error'].includes(status)
}

// Get human-readable time estimate for status
export function getStatusTimeEstimate(status: OrderStatus): string {
  switch (status) {
    case 'payment-pending':
    case 'waiting-payment':
      return 'Immediate'
    case 'confirming':
    case 'payment-confirmed':
      return '10-30 minutes'
    case 'inscribing':
    case 'processing':
      return '1-4 hours'
    case 'completed':
    case 'success':
      return 'Complete'
    case 'failed':
    case 'cancelled':
    case 'error':
      return 'N/A'
    default:
      return 'Unknown'
  }
}

// All functions for easy importing
export default {
  categorizeOrderStatus,
  getStatusConfig,
  calculateStatusCounts,
  isTerminalStatus,
  isActiveStatus,
  getStatusProgress,
  getNextStatus,
  formatStatusDisplay,
  filterOrdersByCategory,
  sortOrdersByStatus,
  getStatusBadgeProps,
  getTimelineSteps,
  orderNeedsAttention,
  getStatusTimeEstimate,
  ORDER_STATUS_CATEGORIES,
  STATUS_PROGRESSION_ORDER,
  STATUS_CONFIG
}