'use client'

import { useLaserEyes } from '@omnisat/lasereyes-react'
import { AlertCircle, CheckCircle, Wifi, WifiOff, Copy } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FormattingUtils, copyToClipboard } from '@/lib/utils/index'

interface StatusProps {
  showDetails?: boolean
  className?: string
}

export function Status({ showDetails = false, className }: StatusProps) {
  const laserEyes = useLaserEyes()

  const handleCopyAddress = () => {
    if (!laserEyes.address) return
    copyToClipboard(laserEyes.address, 'Wallet address')
  }

  const handleCopyPublicKey = () => {
    if (!laserEyes.publicKey) return
    copyToClipboard(laserEyes.publicKey, 'Public key')
  }

  if (laserEyes.isConnecting) {
    return (
      <Alert className={className}>
        <Wifi className="h-4 w-4 animate-pulse" />
        <AlertDescription>
          Connecting to wallet...
        </AlertDescription>
      </Alert>
    )
  }

  if (!laserEyes.connected) {
    return (
      <Alert variant="destructive" className={className}>
        <WifiOff className="h-4 w-4" />
        <AlertDescription>
          Wallet not connected. Please connect your wallet to continue.
        </AlertDescription>
      </Alert>
    )
  }

  if (!showDetails) {
    return (
      <Alert className={className}>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          Wallet connected successfully
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Connection Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Connection Status</span>
            <Badge className="flex items-center space-x-1">
              <CheckCircle className="h-3 w-3" />
              <span>Connected</span>
            </Badge>
          </div>

          {/* Network */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Network</span>
            <Badge variant={laserEyes.network === 'mainnet' ? 'default' : 'secondary'}>
              {laserEyes.network === 'mainnet' ? 'Bitcoin Mainnet' : 'Bitcoin Testnet'}
            </Badge>
          </div>

          {/* Address with Copy Button */}
          {laserEyes.address && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Address</span>
              <div className="flex items-center space-x-2">
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {FormattingUtils.truncateAddress(laserEyes.address, 8, 8)}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={handleCopyAddress}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {/* Balance */}
          {laserEyes.balance !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Balance</span>
              <div className="text-right">
                <div className="text-sm font-medium">
                  {FormattingUtils.formatBTC(laserEyes.balance)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {FormattingUtils.formatSatoshis(laserEyes.balance)}
                </div>
              </div>
            </div>
          )}

          {/* Public Key with Copy Button */}
          {laserEyes.publicKey && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Public Key</span>
              <div className="flex items-center space-x-2">
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {FormattingUtils.truncateAddress(laserEyes.publicKey, 8, 8)}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={handleCopyPublicKey}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {/* Capabilities */}
          <div className="pt-2 border-t border-border">
            <span className="text-sm font-medium mb-2 block">Wallet Capabilities</span>
            <div className="flex flex-wrap gap-1">
              <Badge variant="secondary" className="text-xs">Inscriptions</Badge>
              <Badge variant="secondary" className="text-xs">BRC-20</Badge>
              <Badge variant="secondary" className="text-xs">Message Signing</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}