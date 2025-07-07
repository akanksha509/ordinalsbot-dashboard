'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Zap, Clock, Turtle, Settings } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FormattingUtils } from '@/lib/utils/index'

interface FeeEstimate {
  fastestFee: number
  halfHourFee: number
  hourFee: number
  economyFee: number
  minimumFee: number
}

interface TxFeeSelectProps {
  value: number
  onChange: (feeRate: number) => void
  disabled?: boolean
  showCustom?: boolean
  urgency?: 'low' | 'normal' | 'high'
  className?: string
}

const FEE_PRESETS = {
  economy: {
    icon: Turtle,
    label: 'Economy',
    description: '1-2 hours',
    color: 'text-green-600',
    urgency: 'low' as const
  },
  normal: {
    icon: Clock,
    label: 'Normal', 
    description: '~30 min',
    color: 'text-blue-600',
    urgency: 'normal' as const
  },
  fast: {
    icon: Zap,
    label: 'Fast',
    description: '~10 min',
    color: 'text-orange-600',
    urgency: 'high' as const
  },
  custom: {
    icon: Settings,
    label: 'Custom',
    description: 'Set your own',
    color: 'text-purple-600',
    urgency: 'normal' as const
  }
}

export function TxFeeSelect({ 
  value, 
  onChange, 
  disabled = false, 
  showCustom = true,
  urgency = 'normal',
  className 
}: TxFeeSelectProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>('normal')
  const [customFee, setCustomFee] = useState<string>('')
  const [isCustom, setIsCustom] = useState(false)

  // Fetch current fee estimates from mempool
  const { data: feeEstimates, isLoading, error } = useQuery<FeeEstimate>({
    queryKey: ['fee-estimates'],
    queryFn: async () => {
      const response = await fetch('/api/blockchain?type=fees')
      if (!response.ok) throw new Error('Failed to fetch fee estimates')
      const result = await response.json()
      return result.data
    },
    staleTime: 60000, // 1 minute
    refetchInterval: 120000, // 2 minutes
  })

  // Update selected preset when value changes externally
  useEffect(() => {
    if (!feeEstimates) return

    const { economyFee, halfHourFee, fastestFee } = feeEstimates
    
    if (Math.abs(value - economyFee) <= 1) {
      setSelectedPreset('economy')
      setIsCustom(false)
    } else if (Math.abs(value - halfHourFee) <= 1) {
      setSelectedPreset('normal')
      setIsCustom(false)
    } else if (Math.abs(value - fastestFee) <= 1) {
      setSelectedPreset('fast')
      setIsCustom(false)
    } else {
      setSelectedPreset('custom')
      setIsCustom(true)
      setCustomFee(value.toString())
    }
  }, [value, feeEstimates])

  const handlePresetChange = (preset: string) => {
    if (!feeEstimates) return

    setSelectedPreset(preset)
    
    if (preset === 'custom') {
      setIsCustom(true)
      setCustomFee(value.toString())
    } else {
      setIsCustom(false)
      const feeMap = {
        economy: feeEstimates.economyFee,
        normal: feeEstimates.halfHourFee,
        fast: feeEstimates.fastestFee,
      }
      const newFee = feeMap[preset as keyof typeof feeMap] || feeEstimates.halfHourFee
      onChange(newFee)
    }
  }

  const handleCustomFeeChange = (customValue: string) => {
    setCustomFee(customValue)
    const numValue = parseFloat(customValue)
    if (!isNaN(numValue) && numValue > 0) {
      onChange(Math.max(numValue, feeEstimates?.minimumFee || 1))
    }
  }

  const getRecommendedPreset = () => {
    switch (urgency) {
      case 'low': return 'economy'
      case 'high': return 'fast'
      default: return 'normal'
    }
  }

  const estimateCost = (feeRate: number, inputCount: number = 2, outputCount: number = 2) => {
    // Rough estimate: P2WPKH input ~68 bytes, output ~31 bytes, base ~10 bytes
    const estimatedSize = inputCount * 68 + outputCount * 31 + 10
    return Math.ceil(estimatedSize * feeRate)
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Transaction Fee</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-10 bg-muted rounded" />
            <div className="h-8 bg-muted rounded" />
            <div className="h-6 bg-muted rounded w-3/4" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !feeEstimates) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Transaction Fee</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load fee estimates. Using default values.
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Label htmlFor="fallback-fee">Fee Rate (sat/vB)</Label>
            <Input
              id="fallback-fee"
              type="number"
              value={value}
              onChange={(e) => onChange(parseFloat(e.target.value) || 15)}
              min="1"
              max="1000"
              disabled={disabled}
            />
          </div>
        </CardContent>
      </Card>
    )
  }

  const recommendedPreset = getRecommendedPreset()
  const currentCost = estimateCost(value)

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Transaction Fee</CardTitle>
          <Badge variant="outline" className="text-xs">
            {FormattingUtils.formatFeeRate(value)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Fee Presets */}
        <RadioGroup
          value={selectedPreset}
          onValueChange={handlePresetChange}
          disabled={disabled}
          className="space-y-2"
        >
          {Object.entries(FEE_PRESETS).map(([key, preset]) => {
            if (key === 'custom' && !showCustom) return null
            
            const Icon = preset.icon
            const isRecommended = key === recommendedPreset
            let feeValue = value
            
            if (key !== 'custom') {
              const feeMap = {
                economy: feeEstimates.economyFee,
                normal: feeEstimates.halfHourFee,
                fast: feeEstimates.fastestFee,
              }
              feeValue = feeMap[key as keyof typeof feeMap] || value
            }

            return (
              <div key={key} className="flex items-center space-x-2">
                <RadioGroupItem value={key} id={key} />
                <Label
                  htmlFor={key}
                  className="flex-1 flex items-center justify-between cursor-pointer p-2 rounded hover:bg-accent"
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`h-4 w-4 ${preset.color}`} />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{preset.label}</span>
                        {isRecommended && (
                          <Badge variant="secondary" className="text-xs">
                            Recommended
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {preset.description}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {key === 'custom' ? `${value}` : `${feeValue}`} sat/vB
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ~{estimateCost(feeValue)} sats
                    </div>
                  </div>
                </Label>
              </div>
            )
          })}
        </RadioGroup>

        {/* Custom Fee Input */}
        {isCustom && showCustom && (
          <div className="space-y-2">
            <Label htmlFor="custom-fee">Custom Fee Rate (sat/vB)</Label>
            <Input
              id="custom-fee"
              type="number"
              placeholder="Enter fee rate..."
              value={customFee}
              onChange={(e) => handleCustomFeeChange(e.target.value)}
              min={feeEstimates.minimumFee}
              max="1000"
              disabled={disabled}
            />
            <p className="text-xs text-muted-foreground">
              Minimum: {feeEstimates.minimumFee} sat/vB
            </p>
          </div>
        )}

        {/* Fee Summary */}
        <div className="pt-3 border-t border-border space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Estimated Cost:</span>
            <span className="font-medium">
              {FormattingUtils.formatSatoshis(currentCost)}
            </span>
          </div>
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Network congestion:</span>
            <span className={FormattingUtils.getStatusColor(
              FormattingUtils.formatCongestionLevel(feeEstimates.halfHourFee).level
            )}>
              {FormattingUtils.formatCongestionLevel(feeEstimates.halfHourFee).label}
            </span>
          </div>
        </div>

        {/* Urgency Warning */}
        {urgency === 'high' && selectedPreset === 'economy' && (
          <Alert variant="warning">
            <AlertDescription className="text-xs">
              You've selected a slow fee for a high-priority transaction. 
              Consider using Normal or Fast for better confirmation times.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}