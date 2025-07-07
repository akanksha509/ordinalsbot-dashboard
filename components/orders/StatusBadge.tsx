'use client'

import { StatusBadgeProps } from '@/types'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/index'
import { getStatusConfig } from '@/lib/order-status'
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  XCircle, 
  Zap, 
  CreditCard 
} from 'lucide-react'

const ICON_COMPONENTS = {
  CheckCircle,
  Clock,
  AlertCircle,
  CreditCard,
  Zap,
  Loader2,
  XCircle
} as const

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = getStatusConfig(status)
  
  // Get icon component
  const IconComponent = ICON_COMPONENTS[config.icon as keyof typeof ICON_COMPONENTS] || Clock
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5', 
    lg: 'text-base px-3 py-1'
  }
  
  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  return (
    <Badge 
      variant={config.badgeVariant}
      className={cn(
        'inline-flex items-center space-x-1 font-medium',
        sizeClasses[size],
        config.color
      )}
      title={config.description}
    >
      <IconComponent 
        className={cn(
          iconSizes[size],
          status === 'confirming' && 'animate-spin',
          status === 'inscribing' && 'animate-pulse'
        )} 
      />
      <span>{config.label}</span>
    </Badge>
  )
}