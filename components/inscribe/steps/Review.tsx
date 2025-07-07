'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Edit, 
  CheckCircle, 
  AlertTriangle,
  Wallet,
  Bitcoin
} from 'lucide-react'
import { WizardData } from '../Wizard'

interface ReviewProps {
  data: WizardData
  onUpdate: (data: Partial<WizardData>) => void
  onNext: () => void
  onPrev: () => void
  onEdit: (stepIndex: number) => void
}

export function Review({ data, onUpdate, onNext, onPrev, onEdit }: ReviewProps) {
  const [receiveAddress, setReceiveAddress] = useState(data.receiveAddress || '')
  const [feeRate, setFeeRate] = useState(data.feeRate || 20)
  const [estimatedCost, setEstimatedCost] = useState(50000) 
  const [isValidAddress, setIsValidAddress] = useState(false)

  // Validate Bitcoin address
  useEffect(() => {
    if (!receiveAddress) {
      setIsValidAddress(false)
      return
    }

    const patterns = [
      /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/,
      /^bc1[a-z0-9]{39,59}$/,
      /^tb1[a-z0-9]{39,59}$/
    ]

    setIsValidAddress(patterns.some(pattern => pattern.test(receiveAddress)))
  }, [receiveAddress])

  // Calculate estimated cost
  useEffect(() => {
    if (!isValidAddress) return

    let sizeBytes = 250 // Base size

    if (data.files?.length) {
      sizeBytes += data.files.reduce((acc, file) => acc + file.size, 0)
    }

    if (data.textContent) {
      sizeBytes += data.textContent.length
    }

    const networkFee = Math.ceil(sizeBytes * feeRate)
    const serviceFee = Math.max(5000, networkFee * 0.05)
    
    setEstimatedCost(networkFee + serviceFee)
  }, [receiveAddress, isValidAddress, feeRate, data])

  const handleNext = () => {
    if (receiveAddress && isValidAddress) {
      onUpdate({ 
        receiveAddress, 
        feeRate,
        paymentAmount: estimatedCost
      })
      onNext()
    }
  }

  const formatSats = (sats: number) => `${sats.toLocaleString()} sats`
  const formatBTC = (sats: number) => `${(sats / 100000000).toFixed(8)} BTC`

  const getTypeDisplay = () => {
    switch (data.type) {
      case 'inscription': return 'Inscription'
      case 'brc20-mint': return 'BRC-20 Mint'
      case 'brc20-transfer': return 'BRC-20 Transfer'
      default: return data.type || 'Order'
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="h-8 w-8 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Review Your Order</h2>
        <p className="text-muted-foreground">
          Review your inscription details and confirm before payment
        </p>
      </div>

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Order Summary</span>
            <Badge variant="outline">{getTypeDisplay()}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Content Details */}
          {data.files && data.files.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Files ({data.files.length})</h4>
                <Button variant="ghost" size="sm" onClick={() => onEdit(1)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </div>
              <div className="space-y-2">
                {data.files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {file.type} • {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.textContent && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Text Content</h4>
                <Button variant="ghost" size="sm" onClick={() => onEdit(1)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </div>
              <div className="p-3 bg-muted rounded">
                <pre className="text-sm whitespace-pre-wrap max-h-20 overflow-y-auto">
                  {data.textContent.slice(0, 200)}
                  {data.textContent.length > 200 && '...'}
                </pre>
              </div>
            </div>
          )}

          {data.brc20Details && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">BRC-20 Details</h4>
                <Button variant="ghost" size="sm" onClick={() => onEdit(1)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </div>
              <div className="p-3 bg-muted rounded space-y-1 text-sm">
                <div>Ticker: <strong>{data.brc20Details.ticker}</strong></div>
                <div>Operation: <strong>{data.brc20Details.operation}</strong></div>
                {data.brc20Details.amount && (
                  <div>Amount: <strong>{data.brc20Details.amount}</strong></div>
                )}
                {data.brc20Details.to && (
                  <div>To: <strong>{data.brc20Details.to}</strong></div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Wallet className="h-5 w-5 mr-2" />
            Payment Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="receiveAddress">Receive Address *</Label>
            <Input
              id="receiveAddress"
              placeholder="Enter your Bitcoin address"
              value={receiveAddress}
              onChange={(e) => setReceiveAddress(e.target.value)}
              className={!receiveAddress ? '' : isValidAddress ? 'border-green-500' : 'border-red-500'}
            />
            {receiveAddress && !isValidAddress && (
              <p className="text-sm text-red-500">Invalid Bitcoin address</p>
            )}
            {isValidAddress && (
              <p className="text-sm text-green-600">✓ Valid address</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Fee Rate: {feeRate} sats/vB</Label>
            <div className="flex space-x-2">
              <Button
                variant={feeRate === 10 ? "default" : "outline"}
                size="sm"
                onClick={() => setFeeRate(10)}
              >
                Slow (10)
              </Button>
              <Button
                variant={feeRate === 20 ? "default" : "outline"}
                size="sm"
                onClick={() => setFeeRate(20)}
              >
                Normal (20)
              </Button>
              <Button
                variant={feeRate === 50 ? "default" : "outline"}
                size="sm"
                onClick={() => setFeeRate(50)}
              >
                Fast (50)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bitcoin className="h-5 w-5 mr-2" />
            Total Cost
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-2xl font-bold">{formatSats(estimatedCost)}</div>
            <div className="text-sm text-muted-foreground">{formatBTC(estimatedCost)}</div>
          </div>
        </CardContent>
      </Card>

      {/* Warning */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Inscriptions are permanent and cannot be modified. Please review carefully.
        </AlertDescription>
      </Alert>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrev}>
          Back
        </Button>
        <Button 
          onClick={handleNext}
          disabled={!receiveAddress || !isValidAddress}
        >
          Create Order
        </Button>
      </div>
    </div>
  )
}