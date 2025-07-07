'use client'

import { useState, useCallback } from 'react'
import { ArrowLeft, ArrowRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import SelectType from './steps/SelectType'
import { DetailsForm } from './steps/DetailsForm'
import { Review } from './steps/Review'
import Pay from './steps/Pay'  
import { ProgressStep } from './steps/Progress'
import { OrderType } from '@/types'

export interface WizardData {
  // Type selection
  type: OrderType | null
  contentType?: 'files' | 'text'
  brc20Operation?: 'deploy' | 'mint' | 'transfer'
  
  // File data
  files?: Array<{
    name: string
    type: string
    size: number
    content: string // data URL or base64
    preview?: string
  }>
  
  // Text content
  textContent?: string
  
  // BRC-20 specific
  brc20Details?: {
    ticker: string
    operation: 'deploy' | 'mint' | 'transfer'
    amount?: string
    maxSupply?: string
    mintLimit?: string
    decimals?: number
    to?: string
  }
  
  // Metadata
  title?: string
  description?: string
  collection?: string
  attributes?: Record<string, any>
  
  // Payment
  receiveAddress?: string
  feeRate?: number
  
  // Order result
  orderId?: string
  paymentAddress?: string
  paymentAmount?: number
}

interface WizardProps {
  initialType?: OrderType | null
  onExit: () => void
}

const STEPS = [
  { id: 'type', title: 'Select Type', description: 'Choose inscription type' },
  { id: 'details', title: 'Add Details', description: 'Configure your inscription' },
  { id: 'review', title: 'Review', description: 'Confirm your order' },
  { id: 'pay', title: 'Payment', description: 'Complete payment' },
  { id: 'progress', title: 'Progress', description: 'Track your inscription' }
]

export function Wizard({ initialType, onExit }: WizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [wizardData, setWizardData] = useState<WizardData>({
    type: (initialType as OrderType) || null
  })
  const [isLoading, setIsLoading] = useState(false)

  // Skip to details if initial type is provided
  const effectiveStep = initialType && currentStep === 0 ? 1 : currentStep

  const updateWizardData = useCallback((data: Partial<WizardData>) => {
    setWizardData(prev => ({ ...prev, ...data }))
  }, [])

  const nextStep = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1)
    }
  }, [currentStep])

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }, [currentStep])

  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < STEPS.length) {
      setCurrentStep(stepIndex)
    }
  }, [])

  const resetWizard = useCallback(() => {
    setCurrentStep(0)
    setWizardData({ type: null })
    setIsLoading(false)
  }, [])

  const canGoNext = useCallback(() => {
    switch (effectiveStep) {
      case 0: // Type selection
        return !!wizardData.type
      case 1: // Details
        if (wizardData.type === 'brc20-mint' || wizardData.type === 'brc20-transfer') {
          return !!(wizardData.brc20Details?.ticker && wizardData.brc20Details?.amount)
        }
        if (wizardData.type === 'inscription') {
          return !!(wizardData.files?.length || wizardData.textContent)
        }
        return !!(wizardData.files?.length || wizardData.textContent || wizardData.brc20Details)
      case 2: // Review
        return !!wizardData.receiveAddress
      case 3: // Payment
        return !!wizardData.orderId
      default:
        return true
    }
  }, [effectiveStep, wizardData])

  const getCurrentStepComponent = () => {
    switch (effectiveStep) {
      case 0:
        return (
          <SelectType
            data={wizardData}
            onUpdate={updateWizardData}
            onNext={nextStep}
          />
        )
      case 1:
        return (
          <DetailsForm
            data={wizardData}
            onUpdate={updateWizardData}
            onNext={nextStep}
            onPrev={prevStep}
          />
        )
      case 2:
        return (
          <Review
            data={wizardData}
            onUpdate={updateWizardData}
            onNext={nextStep}
            onPrev={prevStep}
            onEdit={goToStep}
          />
        )
      case 3:
        return (
          <Pay
            data={wizardData}
            onUpdate={updateWizardData}
            onNext={nextStep}
            onPrev={prevStep}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        )
      case 4:
        return (
          <ProgressStep
            data={wizardData}
            onComplete={() => {
              // Redirect to order detail page
              if (wizardData.orderId) {
                window.location.href = `/orders/${wizardData.orderId}`
              } else {
                onExit()
              }
            }}
            onReset={resetWizard}
          />
        )
      default:
        return null
    }
  }

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < effectiveStep) return 'completed'
    if (stepIndex === effectiveStep) return 'current'
    return 'pending'
  }

  const getTypeDisplay = () => {
    switch (wizardData.type) {
      case 'inscription': return 'Inscription'
      case 'brc20-mint': return 'BRC-20 Mint'
      case 'brc20-transfer': return 'BRC-20 Transfer'
      default: return wizardData.type ? wizardData.type.charAt(0).toUpperCase() + wizardData.type.slice(1) : 'Unknown'
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onExit}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Create Inscription</h1>
            {wizardData.type && (
              <Badge variant="outline" className="mt-1">
                {getTypeDisplay()}
              </Badge>
            )}
          </div>
        </div>
        
        <Button variant="ghost" size="sm" onClick={onExit}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Progress Indicator */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium">
              Step {effectiveStep + 1} of {STEPS.length}
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round(((effectiveStep + 1) / STEPS.length) * 100)}% Complete
            </span>
          </div>
          
          <Progress value={((effectiveStep + 1) / STEPS.length) * 100} className="mb-4" />
          
          {/* Step indicators */}
          <div className="flex justify-between">
            {STEPS.map((step, index) => {
              const status = getStepStatus(index)
              return (
                <div 
                  key={step.id} 
                  className={`flex flex-col items-center text-center cursor-pointer transition-colors ${
                    status === 'current' ? 'text-primary' : 
                    status === 'completed' ? 'text-green-600' : 
                    'text-muted-foreground'
                  }`}
                  onClick={() => status === 'completed' && goToStep(index)}
                >
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium mb-2 ${
                    status === 'current' ? 'border-primary bg-primary text-primary-foreground' :
                    status === 'completed' ? 'border-green-600 bg-green-600 text-white' :
                    'border-muted-foreground/20 bg-background'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-xs font-medium">{step.title}</div>
                    <div className="text-xs text-muted-foreground">{step.description}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Current Step */}
      <div className="min-h-[400px]">
        {getCurrentStepComponent()}
      </div>
    </div>
  )
}