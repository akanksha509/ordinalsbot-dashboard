'use client'

import { CheckCircle, Clock, CreditCard, Loader2, Zap, AlertCircle } from 'lucide-react'
import { StatusTimelineProps, OrderStatus } from '@/types'
import { cn } from '@/lib/utils/index'

interface TimelineStep {
  status: OrderStatus
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}

const TIMELINE_STEPS: TimelineStep[] = [
  {
    status: 'payment-pending',
    label: 'Payment',
    description: 'Waiting for payment',
    icon: CreditCard
  },
  {
    status: 'confirming',
    label: 'Confirmation',
    description: 'Confirming transaction',
    icon: Clock
  },
  {
    status: 'inscribing',
    label: 'Inscribing', 
    description: 'Creating inscription',
    icon: Zap
  },
  {
    status: 'completed',
    label: 'Complete',
    description: 'Inscription ready',
    icon: CheckCircle
  }
]

const STATUS_ORDER: Record<OrderStatus, number> = {
  'pending': 0,
  'payment-pending': 0,
  'payment-received': 1,
  'confirming': 1,
  'confirmed': 2,
  'inscribing': 2,
  'completed': 3,
  'failed': -1,
  'cancelled': -1,
  'waiting-payment': 0,
  'payment-confirmed': 1,
  'ready': 2,
  'processing': 2,
  'success': 3,
  'error': -1
} as const

export function StatusTimeline({ order, currentStatus }: StatusTimelineProps) {
  const currentStepIndex = STATUS_ORDER[currentStatus] ?? 0
  const isFailed = currentStatus === 'failed'
  const isCancelled = currentStatus === 'cancelled'

  const getStepStatus = (stepIndex: number) => {
    if (isFailed || isCancelled) {
      return stepIndex < currentStepIndex ? 'completed' : 'failed'
    }
    
    if (stepIndex < currentStepIndex) return 'completed'
    if (stepIndex === currentStepIndex) return 'current'
    return 'pending'
  }

  const getStepIcon = (step: TimelineStep, stepIndex: number, status: string) => {
    const Icon = step.icon
    
    if (status === 'failed') {
      return <AlertCircle className="h-5 w-5 text-destructive" />
    }
    
    if (status === 'completed') {
      return <CheckCircle className="h-5 w-5 text-green-500" />
    }
    
    if (status === 'current') {
      if (currentStatus === 'confirming' || currentStatus === 'inscribing') {
        return <Loader2 className="h-5 w-5 text-primary animate-spin" />
      }
      return <Icon className="h-5 w-5 text-primary animate-pulse" />
    }
    
    return <Icon className="h-5 w-5 text-muted-foreground" />
  }

  const getAdditionalInfo = (step: TimelineStep, stepIndex: number) => {
    if (stepIndex === 1 && order.confirmations !== undefined) {
      const required = 1 // Most inscriptions need 1 confirmation
      return `${order.confirmations}/${required} confirmations`
    }
    
    if (stepIndex === 2 && currentStatus === 'inscribing') {
      return 'Processing on Bitcoin network'
    }
    
    if (stepIndex === 3 && currentStatus === 'completed' && order.inscriptionNumber) {
      return `Inscription #${order.inscriptionNumber.toLocaleString()}`
    }
    
    return null
  }

  return (
    <div className="w-full">
      {/* Mobile Layout - Vertical */}
      <div className="md:hidden space-y-4">
        {TIMELINE_STEPS.map((step, index) => {
          const stepStatus = getStepStatus(index)
          const additionalInfo = getAdditionalInfo(step, index)
          
          return (
            <div key={step.status} className="flex items-start space-x-3">
              {/* Icon */}
              <div className={cn(
                "flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center",
                stepStatus === 'completed' && "bg-green-50 border-green-200",
                stepStatus === 'current' && "bg-primary/10 border-primary",
                stepStatus === 'pending' && "bg-muted border-muted-foreground/20",
                stepStatus === 'failed' && "bg-destructive/10 border-destructive"
              )}>
                {getStepIcon(step, index, stepStatus)}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h4 className={cn(
                    "font-medium",
                    stepStatus === 'completed' && "text-green-700",
                    stepStatus === 'current' && "text-primary",
                    stepStatus === 'pending' && "text-muted-foreground",
                    stepStatus === 'failed' && "text-destructive"
                  )}>
                    {step.label}
                  </h4>
                  
                  {stepStatus === 'current' && (
                    <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
                  )}
                </div>
                
                <p className="text-sm text-muted-foreground mt-1">
                  {additionalInfo || step.description}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between relative">
          {/* Progress Line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-muted-foreground/20 -translate-y-1/2" />
          <div 
            className="absolute top-1/2 left-0 h-0.5 bg-primary transition-all duration-500 -translate-y-1/2"
            style={{ 
              width: `${(currentStepIndex / (TIMELINE_STEPS.length - 1)) * 100}%` 
            }}
          />
          
          {/* Steps */}
          {TIMELINE_STEPS.map((step, index) => {
            const stepStatus = getStepStatus(index)
            const additionalInfo = getAdditionalInfo(step, index)
            
            return (
              <div key={step.status} className="flex flex-col items-center relative z-10">
                {/* Icon */}
                <div className={cn(
                  "w-12 h-12 rounded-full border-2 flex items-center justify-center bg-background",
                  stepStatus === 'completed' && "border-green-500 bg-green-50",
                  stepStatus === 'current' && "border-primary bg-primary/10",
                  stepStatus === 'pending' && "border-muted-foreground/20 bg-muted",
                  stepStatus === 'failed' && "border-destructive bg-destructive/10"
                )}>
                  {getStepIcon(step, index, stepStatus)}
                </div>
                
                {/* Label */}
                <div className="mt-3 text-center min-w-0 max-w-[120px]">
                  <h4 className={cn(
                    "font-medium text-sm",
                    stepStatus === 'completed' && "text-green-700",
                    stepStatus === 'current' && "text-primary",
                    stepStatus === 'pending' && "text-muted-foreground",
                    stepStatus === 'failed' && "text-destructive"
                  )}>
                    {step.label}
                  </h4>
                  
                  <p className="text-xs text-muted-foreground mt-1">
                    {additionalInfo || step.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Failed/Cancelled State */}
      {(isFailed || isCancelled) && (
        <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm font-medium text-destructive">
              {isFailed ? 'Order Failed' : 'Order Cancelled'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {isFailed 
              ? 'This order encountered an error and could not be completed.'
              : 'This order was cancelled and will not be processed.'
            }
          </p>
        </div>
      )}
    </div>
  )
}