'use client'

import { useState, useEffect, useRef } from 'react'
import { useLaserEyes } from '@omnisat/lasereyes-react'
import {
  ArrowLeft,
  Wallet,
  AlertTriangle,
  Loader2,
  CheckCircle,
  Copy,
  ExternalLink,
  Bitcoin,
  RefreshCw,
  Eye,
  EyeOff,
  Zap,
  Shield,
  Info
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { OrderStorage } from '@/lib/order-manager'
import { 
  copyToClipboard, 
  FormattingUtils, 
  getNetworkFromEnv,
  getErrorMessage,
  getWalletErrorMessage
} from '@/lib/utils/index'
import {
  checkPSBTCompatibility,
  detectWalletCapabilities,
  getPSBTErrorMessage,
  getNetworkSpecificConfig
} from '@/lib/wallet/config'

import type { WizardData } from '../Wizard'

interface SerializableWizardData {
  orderId?: string
  paymentAddress?: string
  paymentAmount?: number
  paymentStatus?: 'pending' | 'sent' | 'confirmed' | 'failed'
  txid?: string
  psbt?: string
}

interface ExtendedWizardData extends WizardData {
  txid?: string
  paymentStatus?: 'pending' | 'sent' | 'confirmed' | 'failed'
  psbt?: string
}

interface PayProps {
  data: ExtendedWizardData
  onUpdate: (data: SerializableWizardData) => void
  onNext: () => void
  onPrev: () => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

// Payment steps including enhanced PSBT flow
type PaymentStep = 'creating' | 'awaiting_payment' | 'creating_psbt' | 'signing_psbt' | 'broadcasting' | 'payment_sent' | 'complete'

export function Pay({
  data,
  onUpdate,
  onNext,
  onPrev,
  isLoading,
  setIsLoading
}: PayProps) {
  const [paymentStep, setPaymentStep] = useState<PaymentStep>('creating')
  const [error, setError] = useState('')
  const [paymentCheckInterval, setPaymentCheckInterval] = useState<NodeJS.Timeout | null>(null)
  const [walletBalance, setWalletBalance] = useState<number>(0)
  const [showFullAddress, setShowFullAddress] = useState(false)
  const hasTriggeredOrderCreation = useRef(false)

  const { toast } = useToast()
  const laserEyes = useLaserEyes()
  const isWalletConnected = laserEyes.connected || false
  const walletAddress = laserEyes.address
  const network = getNetworkFromEnv()
  const isTestnet = network === 'testnet'
  const networkConfig = getNetworkSpecificConfig(network)

  // Check PSBT compatibility
  const psbtCompatibility = checkPSBTCompatibility(laserEyes)
  const walletCapabilities = detectWalletCapabilities(laserEyes)

  // Redirect to connect UI if wallet isn't ready
  if (!isWalletConnected || !walletAddress) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-4 bg-orange-500/10 rounded-full">
                <AlertTriangle className="h-16 w-16 text-orange-500" />
              </div>
            </div>
            
            <div className="space-y-3">
              <h2 className="text-3xl font-bold text-white">Wallet Connection Required</h2>
              <p className="text-gray-400 text-lg">
                Please connect your Bitcoin wallet to proceed with payment
              </p>
            </div>

            <Alert className="bg-red-900/20 border-red-600/30 text-left">
              <Wallet className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-300">
                You need a Bitcoin wallet to create and pay for inscription orders.
              </AlertDescription>
            </Alert>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button 
                variant="outline" 
                onClick={onPrev} 
                disabled={isLoading}
                className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Review
              </Button>
              <Button 
                onClick={() => window.location.reload()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Check Connection
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Fetch wallet balance
  const loadWalletBalance = async (): Promise<number> => {
    try {
      if (laserEyes.paymentAddress) {
        const resp = await fetch(
          `/api/blockchain?type=address&address=${laserEyes.paymentAddress}`
        )
        const json = await resp.json()
        if (json.success && json.data) {
          setWalletBalance(json.data.balance)
          return json.data.balance
        }
      }
    } catch (error) {
      // Error handled silently
    }
    setWalletBalance(0)
    return 0
  }

  // Get dynamic fees with network-specific defaults
  const getDynamicFees = async (): Promise<number> => {
    try {
      const resp = await fetch('/api/blockchain?type=fees')
      const json = await resp.json()
      if (json.success) {
        if (isTestnet) {
          return Math.max(json.data.economyFee || networkConfig.defaultFeeRate, networkConfig.minFeeRate)
        } else {
          return Math.max(json.data.halfHourFee || networkConfig.defaultFeeRate, networkConfig.minFeeRate)
        }
      }
    } catch (error) {
      // Error handled silently
    }
    return networkConfig.defaultFeeRate
  }

  // Calculate total fee based on content size
  const calculateTotalFee = (feeRate: number, contentSize: number = 0): number => {
    const baseSize = 250
    const estimatedSize = baseSize + (contentSize * 0.5)
    const networkFee = Math.ceil(estimatedSize * feeRate)
    const minimumFee = isTestnet ? 3000 : 15000
    const sizeFee = Math.max(networkFee, minimumFee)
    const serviceFee = Math.max(2000, sizeFee * 0.1)
    const totalFee = sizeFee + serviceFee
    
    return totalFee
  }

  // Create order with proper fee calculation
  const createOrderAndGetPayment = async (): Promise<void> => {
    setIsLoading(true)
    setError('')
    setPaymentStep('creating')

    try {
      const currentBalance = await loadWalletBalance()
      const dynamicFeeRate = await getDynamicFees()

      // Calculate content size for fee estimation
      let contentSize = 0
      if (data.files?.length) {
        contentSize = data.files.reduce((acc, file) => acc + file.size, 0)
      } else if (data.textContent) {
        contentSize = data.textContent.length
      }

      const totalFee = calculateTotalFee(dynamicFeeRate, contentSize)

      const orderPayload: any = {
        type: data.type || 'inscription',
        receiveAddress: data.receiveAddress || walletAddress,
        feeRate: dynamicFeeRate,
        fee: totalFee
      }

      // BRC-20 handling
      if (data.type?.startsWith('brc20') && data.brc20Details) {
        const { operation, ticker, amount, maxSupply, mintLimit, decimals, to } = data.brc20Details
        const brc20Json: any = { p: 'brc-20', op: operation, tick: ticker }
        if (operation === 'deploy') {
          brc20Json.max = maxSupply
          brc20Json.lim = mintLimit
          if (decimals && decimals !== 18) brc20Json.dec = decimals.toString()
        } else {
          brc20Json.amt = amount
          if (operation === 'transfer' && to) brc20Json.to = to
        }
        const text = JSON.stringify(brc20Json)
        orderPayload.files = [
          {
            name: `${ticker}-${operation}.json`,
            type: 'application/json',
            size: text.length,
            content: `data:application/json;base64,${btoa(text)}`
          }
        ]
        orderPayload.brc20Details = { ...data.brc20Details }
      }
      // File uploads
      else if (data.files && data.files.length) {
        orderPayload.files = data.files.map((file: any) => ({
          name: file.name,
          type: file.type,
          size: file.size,
          content: file.content.startsWith('data:')
            ? file.content
            : `data:${file.type};base64,${file.content}`
        }))
      }
      // Text content
      else if (data.textContent && data.textContent.trim()) {
        const txt = data.textContent
        orderPayload.files = [
          {
            name: data.title || 'text.txt',
            type: 'text/plain',
            size: txt.length,
            content: `data:text/plain;base64,${btoa(txt)}`
          }
        ]
      } else {
        throw new Error('No content provided')
      }

      if (data.title) orderPayload.title = data.title
      if (data.description) orderPayload.description = data.description

      const response = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      })

      const text = await response.text()

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${text}`)
      }
      
      const result = JSON.parse(text)
      if (!result.success) {
        throw new Error(result.error || 'Order creation failed')
      }

      const orderId = result.data.orderId
      let paymentAddress = result.data.paymentAddress
      let paymentAmount = result.data.amount

      // If payment details are missing, try to fetch them
      if (!paymentAddress || !paymentAmount) {
        const orderResponse = await fetch(`/api/order?id=${orderId}`)
        const orderResult = await orderResponse.json()
        
        if (orderResult.success && orderResult.data) {
          paymentAddress = orderResult.data.paymentAddress || paymentAddress
          paymentAmount = orderResult.data.paymentAmount || paymentAmount
        }
      }

      if (!paymentAddress || !paymentAmount) {
        throw new Error('No payment details returned from order creation')
      }

      // Add to order tracking
      OrderStorage.addNewInscriptionOrder(orderId)
      
      // Update wizard state
      onUpdate({
        orderId,
        paymentAddress,
        paymentAmount,
        paymentStatus: 'pending'
      })
      
      setPaymentStep('awaiting_payment')
      
      toast({
        title: 'Order created!',
        description: `Order ${orderId.slice(0, 8)}... ready for payment`
      })

    } catch (err: any) {
      setError(`Failed to create order: ${getErrorMessage(err)}`)
      onUpdate({ paymentStatus: 'failed' })
      setPaymentStep('awaiting_payment')
    } finally {
      setIsLoading(false)
    }
  }

  // Enhanced PSBT payment using wallet's built-in PSBT capabilities
  const payWithPSBT = async (): Promise<void> => {
    if (!data.paymentAddress || !data.paymentAmount) {
      setError('Payment details missing')
      return
    }

    // Check PSBT compatibility first
    if (!psbtCompatibility.compatible) {
      setError(`PSBT not supported: ${psbtCompatibility.issues.join(', ')}`)
      return
    }

    setIsLoading(true)
    setError('')
    setPaymentStep('creating_psbt')

    try {
      const current = await loadWalletBalance()
      if (current < data.paymentAmount) {
        const balanceError = `Insufficient balance: ${current.toLocaleString()} sats available, ${data.paymentAmount.toLocaleString()} sats required`
        throw new Error(balanceError)
      }

      setPaymentStep('signing_psbt')

      // Use wallet's PSBT payment method if available
      let txid: string

      if (typeof laserEyes.sendBTC === 'function') {
        // Method 1: Use sendBTC which internally uses PSBT for compatible wallets
        txid = await laserEyes.sendBTC(data.paymentAddress, data.paymentAmount)
      } else if (typeof (laserEyes as any).send === 'function') {
        // Method 2: Use generic send function
        txid = await (laserEyes as any).send(data.paymentAddress, data.paymentAmount)
      } else {
        throw new Error('Wallet does not support payment functions')
      }
      
      if (!txid || typeof txid !== 'string' || txid.length < 10) {
        throw new Error(`Invalid transaction ID received: ${txid}`)
      }

      onUpdate({ txid, paymentStatus: 'sent' })
      setPaymentStep('payment_sent')
      
      toast({ 
        title: 'PSBT Payment Sent!', 
        description: `Transaction: ${txid.slice(0, 12)}...` 
      })
      
      startPaymentMonitoring()

    } catch (err: any) {
      setError(getPSBTErrorMessage(err))
      onUpdate({ paymentStatus: 'failed' })
      setPaymentStep('awaiting_payment')
      toast({ 
        title: 'PSBT Payment Failed', 
        description: getPSBTErrorMessage(err), 
        variant: 'destructive' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Manual payment with better validation
  const payWithWallet = async (): Promise<void> => {
    if (!data.paymentAddress || !data.paymentAmount) {
      setError('Payment details missing')
      return
    }
    
    setIsLoading(true)
    setError('')
    
    try {
      const current = await loadWalletBalance()
      if (current < data.paymentAmount) {
        const balanceError = `Insufficient balance: ${current.toLocaleString()} sats available, ${data.paymentAmount.toLocaleString()} sats required`
        throw new Error(balanceError)
      }

      const sendFn = laserEyes.sendBTC || (laserEyes as any).send
      if (typeof sendFn !== 'function') {
        throw new Error('Wallet does not support sending BTC')
      }

      const txid = await sendFn(data.paymentAddress, data.paymentAmount)
      
      if (!txid || typeof txid !== 'string' || txid.length < 10) {
        throw new Error(`Invalid transaction ID received: ${txid}`)
      }

      onUpdate({ txid, paymentStatus: 'sent' })
      setPaymentStep('payment_sent')
      
      toast({ 
        title: 'Payment Sent!', 
        description: `Transaction: ${txid.slice(0, 12)}...`
      })
      
      startPaymentMonitoring()
      
    } catch (err: any) {
      setError(getWalletErrorMessage(err))
      onUpdate({ paymentStatus: 'failed' })
      setPaymentStep('awaiting_payment')
      toast({ 
        title: 'Payment Failed', 
        description: getWalletErrorMessage(err), 
        variant: 'destructive' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Poll for payment confirmation
  const checkPaymentStatus = async (): Promise<boolean> => {
    if (!data.paymentAddress) return false
    try {
      const resp = await fetch(
        `/api/blockchain?type=address&address=${data.paymentAddress}`
      )
      const json = await resp.json()
      return json.success && json.data && (json.data.balance > 0 || json.data.transactions > 0)
    } catch (error) {
      return false
    }
  }

  const startPaymentMonitoring = () => {
    const interval = setInterval(async () => {
      if (await checkPaymentStatus()) {
        clearInterval(interval)
        onUpdate({ paymentStatus: 'confirmed' })
        setPaymentStep('complete')
        toast({ title: 'Payment Confirmed!', description: 'Processing inscription.' })
        setTimeout(onNext, 2000)
      }
    }, 15000)
    setPaymentCheckInterval(interval)
  }

  const handleCopyAddress = () => {
    if (!data.paymentAddress) return
    copyToClipboard(data.paymentAddress, 'Payment address')
  }

  const handleCopyTxid = () => {
    if (!data.txid) return
    copyToClipboard(data.txid, 'Transaction ID')
  }

  // Load wallet balance on mount
  useEffect(() => {
    if (isWalletConnected && laserEyes.paymentAddress) {
      loadWalletBalance()
    }
  }, [isWalletConnected, laserEyes.paymentAddress])

  // Cleanup interval on unmount
  useEffect(
    () => () => {
      if (paymentCheckInterval) clearInterval(paymentCheckInterval)
    },
    [paymentCheckInterval]
  )

  // Trigger order creation automatically
  useEffect(() => {
    if (
      !hasTriggeredOrderCreation.current &&
      isWalletConnected &&
      walletAddress &&
      !data.orderId
    ) {
      hasTriggeredOrderCreation.current = true
      createOrderAndGetPayment()
    }
  }, [isWalletConnected, walletAddress, data.orderId])

  const formatSats = (sats: number) => `${sats.toLocaleString()} sats`

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-white">Complete Payment</h2>
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-gray-300">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-mono text-sm">
                  {FormattingUtils.truncateAddress(walletAddress!, 8, 6)}
                </span>
              </div>
              <div className="hidden sm:block text-gray-600">•</div>
              <span className="text-sm">
                {isTestnet ? 'Testnet' : 'Mainnet'}
              </span>
              <div className="hidden sm:block text-gray-600">•</div>
              <span className="text-sm font-medium text-orange-400">
                {formatSats(walletBalance)}
              </span>
              
              {/* PSBT compatibility indicator */}
              <div className="hidden sm:block text-gray-600">•</div>
              <div className="flex items-center gap-1">
                {psbtCompatibility.compatible ? (
                  <Badge variant="success" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    PSBT Ready
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Manual Only
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="bg-red-900/20 border-red-600/30">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-300">{error}</AlertDescription>
          </Alert>
        )}

        {/* Creating Order */}
        {paymentStep === 'creating' && (
          <Card className="bg-gray-800/30 border-gray-700 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="p-4 bg-blue-500/10 rounded-full">
                    <Loader2 className="h-12 w-12 text-blue-400 animate-spin" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white">Creating Order</h3>
                  <p className="text-gray-400">Setting up your inscription order...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Creating PSBT */}
        {paymentStep === 'creating_psbt' && (
          <Card className="bg-gray-800/30 border-gray-700 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="p-4 bg-purple-500/10 rounded-full">
                    <Loader2 className="h-12 w-12 text-purple-400 animate-spin" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white">Preparing Secure Payment</h3>
                  <p className="text-gray-400">Using wallet's PSBT capabilities...</p>
                  <div className="flex items-center justify-center space-x-2 text-sm text-purple-400">
                    <Shield className="h-4 w-4" />
                    <span>Enhanced wallet security</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Signing PSBT */}
        {paymentStep === 'signing_psbt' && (
          <Card className="bg-gray-800/30 border-gray-700 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="p-4 bg-green-500/10 rounded-full">
                    <Loader2 className="h-12 w-12 text-green-400 animate-spin" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white">Processing PSBT Payment</h3>
                  <p className="text-gray-400">Please confirm in your wallet...</p>
                  <div className="flex items-center justify-center space-x-2 text-sm text-green-400">
                    <Shield className="h-4 w-4" />
                    <span>Wallet is processing secure transaction</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Sent */}
        {paymentStep === 'payment_sent' && (
          <Card className="bg-gray-800/30 border-gray-700 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <div className="p-4 bg-blue-500/10 rounded-full">
                    <CheckCircle className="h-12 w-12 text-blue-400" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white">Payment Sent!</h3>
                  <p className="text-gray-400">Monitoring blockchain for confirmation...</p>
                </div>

                {data.txid && (
                  <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4 space-y-3">
                    <p className="text-sm font-medium text-gray-300">Transaction ID:</p>
                    <code className="font-mono text-sm text-gray-100 break-all block">
                      {data.txid}
                    </code>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyTxid}
                        className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy TXID
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          window.open(
                            isTestnet
                              ? `https://mempool.space/testnet/tx/${data.txid}`
                              : `https://mempool.space/tx/${data.txid}`,
                            '_blank'
                          )
                        }
                        className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View on Explorer
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-center space-x-2 text-blue-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Checking every 15 seconds...</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Complete */}
        {paymentStep === 'complete' && (
          <Card className="bg-gray-800/30 border-gray-700 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <div className="p-4 bg-green-500/10 rounded-full">
                    <CheckCircle className="h-12 w-12 text-green-400" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white">Payment Confirmed!</h3>
                  <p className="text-gray-400">Your inscription is now processing.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ENHANCED PSBT and Manual Options */}
        {paymentStep === 'awaiting_payment' && data.paymentAddress && data.paymentAmount && (
          <Card className="bg-gray-800/30 border-gray-700 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-white text-xl">
                <div className="p-2 bg-orange-500/10 rounded-lg mr-3">
                  <Bitcoin className="h-6 w-6 text-orange-500" />
                </div>
                Payment Required
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Order Info */}
              <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-600/30 rounded-xl p-6">
                <h3 className="font-semibold text-blue-300 mb-4 text-lg">
                  Order Details
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Order ID:</span>
                    <code className="text-sm font-mono text-gray-100">
                      {FormattingUtils.formatOrderId(data.orderId!)}
                    </code>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-300">Amount:</span>
                    <span className="font-semibold text-white">
                      {formatSats(data.paymentAmount)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-300">Network:</span>
                    <span className="font-semibold text-white">
                      {isTestnet ? 'Bitcoin Testnet' : 'Bitcoin Mainnet'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-300">Fee Rate:</span>
                    <span className="font-semibold text-white">
                      {networkConfig.defaultFeeRate} sat/vB
                    </span>
                  </div>
                </div>
              </div>

              {/* Smart Payment Options */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-3">Choose Payment Method</h3>
                
                {/* Security Payment */}
                {psbtCompatibility.compatible && (
                  <Button
                    className="w-full h-14 text-lg font-semibold bg-gray-700 hover:bg-gray-600 border border-gray-600 text-white"
                    size="lg"
                    onClick={payWithPSBT}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Processing Secure Payment...
                      </>
                    ) : (
                      <>
                        <Zap className="h-5 w-5 mr-2" />
                        Pay with Enhanced Security (Recommended)
                      </>
                    )}
                  </Button>
                )}

                {/* Manual Payment */}
                <Button
                  variant="outline"
                  className="w-full h-12 text-lg font-semibold border-gray-600 text-gray-300 hover:bg-gray-700"
                  size="lg"
                  onClick={payWithWallet}
                  disabled={isLoading || walletBalance < data.paymentAmount}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Sending Payment...
                    </>
                  ) : walletBalance < data.paymentAmount ? (
                    <>
                      <AlertTriangle className="h-5 w-5 mr-2 text-red-400" />
                      Insufficient Balance ({formatSats(walletBalance)})
                    </>
                  ) : (
                    <>
                      <Wallet className="h-5 w-5 mr-2" />
                      {psbtCompatibility.compatible ? 'Pay Directly (Alternative)' : 'Pay with Wallet'}
                    </>
                  )}
                </Button>

                {/* Manual Address Display with Instructions */}
                <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4 space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-300">Manual Payment Instructions:</p>
                    <div className="text-sm text-gray-400 space-y-1">
                      <p>1. Copy the payment address below</p>
                      <p>2. Open your Bitcoin wallet (Xverse, UniSat, etc.)</p>
                      <p>3. Send exactly <span className="text-white font-medium">{formatSats(data.paymentAmount)}</span> to this address</p>
                      <p>4. Wait for confirmation (10-60 minutes)</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-400">Payment Address:</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowFullAddress(!showFullAddress)}
                        className="flex-1 text-left p-2 bg-gray-700 rounded border border-gray-600 hover:bg-gray-600 transition-colors"
                      >
                        <code className="font-mono text-sm text-gray-100 break-all block">
                          {showFullAddress 
                            ? data.paymentAddress 
                            : FormattingUtils.truncateAddress(data.paymentAddress, 12, 8)
                          }
                        </code>
                      </button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFullAddress(!showFullAddress)}
                        className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                      >
                        {showFullAddress ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyAddress}
                        className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 space-y-1">
                    <p> Send exactly the amount shown above</p>
                    <p> Sending wrong amount may result in loss of funds</p>
                    <p> Payment will be detected automatically after confirmation</p>
                  </div>
                </div>
              </div>

              {/* Payment Method Explanation */}
              <Alert className="bg-blue-900/20 border-blue-600/30">
                <Info className="h-4 w-4 text-blue-400" />
                <AlertDescription className="text-gray-300">
                  <div className="space-y-3">
                    <p className="font-semibold text-blue-300">Payment Method Details:</p>
                    
                    {psbtCompatibility.compatible && (
                      <div className="space-y-2">
                        <div className="flex items-start space-x-2">
                          <div className="flex items-center mt-0.5">
                            <Zap className="h-4 w-4 text-green-400 mr-2" />
                            <span className="text-sm font-medium text-green-400">Enhanced Security:</span>
                          </div>
                          <div className="text-sm text-gray-300">
                            Uses your wallet's advanced security features for safer transactions
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-start space-x-2">
                      <div className="flex items-center mt-0.5">
                        <Wallet className="h-4 w-4 text-blue-400 mr-2" />
                        <span className="text-sm font-medium text-blue-400">Direct Payment:</span>
                      </div>
                      <div className="text-sm text-gray-300">
                        Standard wallet send or external wallet payment to address above
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t border-blue-600/20">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-400">Required Amount:</span>{' '}
                          <span className="font-medium text-white">
                            {formatSats(data.paymentAmount)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Your Balance:</span>{' '}
                          <span className={`font-medium ${walletBalance >= data.paymentAmount ? 'text-green-400' : 'text-red-400'}`}>
                            {formatSats(walletBalance)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-2 text-sm">
                        <span className="text-gray-400">Confirmation Time:</span>{' '}
                        <span className="text-blue-300">
                          {isTestnet 
                            ? "10-30 minutes (testnet)" 
                            : "10-60 minutes (mainnet)"
                          }
                        </span>
                      </div>
                      
                      {walletBalance < data.paymentAmount && (
                        <p className="text-sm text-red-400 mt-2">
                           Add {formatSats(data.paymentAmount - walletBalance)} more to: {FormattingUtils.truncateAddress(laserEyes.paymentAddress || '', 8, 6)}
                        </p>
                      )}

                      {!psbtCompatibility.compatible && psbtCompatibility.issues.length > 0 && (
                        <div className="mt-2 p-2 bg-yellow-900/20 border border-yellow-600/30 rounded">
                          <p className="text-sm text-yellow-400">
                             Enhanced security not available: {psbtCompatibility.issues[0]}
                          </p>
                          {psbtCompatibility.recommendations[0] && (
                            <p className="text-sm text-yellow-300">
                              {psbtCompatibility.recommendations[0]}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        {paymentStep === 'awaiting_payment' && (
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <Button 
              variant="outline" 
              onClick={onPrev} 
              disabled={isLoading}
              className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Review
            </Button>
            <Button 
              variant="outline" 
              onClick={createOrderAndGetPayment} 
              disabled={isLoading}
              className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Order Creation
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Pay