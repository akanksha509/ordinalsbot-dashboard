'use client'

import { useState, useEffect } from 'react'
import { Wallet, ChevronDown, Copy, LogOut, User, CheckCircle, AlertTriangle } from 'lucide-react'
import { useLaserEyes } from '@omnisat/lasereyes-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Modal } from './Modal'
import { useToast } from '@/hooks/use-toast'
import { FormattingUtils, getWalletErrorMessage, logError } from '@/lib/utils/index'
import { copyToClipboard } from '@/lib/utils/index'
import { 
  checkPSBTCompatibility, 
  detectWalletCapabilities
} from '@/lib/wallet/config'

export function ConnectButton() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [forceRender, setForceRender] = useState(0)
  const { toast } = useToast()
  
  // Use LaserEyes hook directly - it handles SSR internally
  const laserEyes = useLaserEyes()

  // Force re-render when LaserEyes state changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setForceRender(prev => prev + 1)
    }, 100)
    
    return () => clearTimeout(timer)
  }, [laserEyes.connected, laserEyes.address, laserEyes.network])

  // Check PSBT compatibility
  const psbtCompatibility = checkPSBTCompatibility(laserEyes)
  const walletCapabilities = detectWalletCapabilities(laserEyes)

  const handleCopyAddress = () => {
    if (!laserEyes.address) return
    copyToClipboard(laserEyes.address, 'Wallet address')
  }

  const handleDisconnect = async () => {
    try {
      await laserEyes.disconnect()
      // Force re-render after disconnect
      setTimeout(() => setForceRender(prev => prev + 1), 100)
      toast({
        title: "Wallet disconnected",
        description: "Your wallet has been disconnected",
      })
    } catch (error) {
      logError(error, 'WalletDisconnect')
      toast({
        title: "Disconnect failed",
        description: getWalletErrorMessage(error),
        variant: "destructive",
      })
    }
  }

  const handleConnectClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    // Force re-render after modal closes to catch any connection changes
    setTimeout(() => setForceRender(prev => prev + 1), 200)
  }

  // Show loading state while connecting
  if (laserEyes.isConnecting) {
    return (
      <Button disabled className="min-w-[120px]">
        <div className="flex items-center space-x-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span>Connecting...</span>
        </div>
      </Button>
    )
  }

  // Show connected state with dropdown
  if (laserEyes.connected && laserEyes.address) {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">
                {FormattingUtils.truncateAddress(laserEyes.address)}
              </span>
              
              {/* PSBT compatibility indicator */}
              {psbtCompatibility.compatible ? (
                <CheckCircle className="h-3 w-3 text-green-500" />
              ) : (
                <AlertTriangle className="h-3 w-3 text-yellow-500" />
              )}
              
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel className="flex flex-col space-y-2">
              <span>Wallet Connected</span>
              
              {/* Basic wallet info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant="success" className="text-xs">
                    {laserEyes.network}
                  </Badge>
                  {laserEyes.balance !== undefined && (
                    <span className="text-xs text-muted-foreground">
                      {FormattingUtils.formatSatoshis(laserEyes.balance, true)}
                    </span>
                  )}
                </div>
              </div>

              {/* PSBT Compatibility Status */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">PSBT Support:</span>
                  {psbtCompatibility.compatible ? (
                    <Badge variant="success" className="text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Compatible
                    </Badge>
                  ) : (
                    <Badge variant="warning" className="text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Limited
                    </Badge>
                  )}
                </div>
                
                {/* Show wallet capabilities */}
                <div className="flex flex-wrap gap-1">
                  {walletCapabilities.psbt && (
                    <Badge variant="outline" className="text-xs">PSBT</Badge>
                  )}
                  {walletCapabilities.payments && (
                    <Badge variant="outline" className="text-xs">Payments</Badge>
                  )}
                  {walletCapabilities.inscriptions && (
                    <Badge variant="outline" className="text-xs">Inscriptions</Badge>
                  )}
                  {walletCapabilities.brc20 && (
                    <Badge variant="outline" className="text-xs">BRC-20</Badge>
                  )}
                </div>
              </div>
            </DropdownMenuLabel>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={handleCopyAddress} className="cursor-pointer">
              <Copy className="mr-2 h-4 w-4" />
              Copy Address
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={handleDisconnect} className="cursor-pointer text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Disconnect
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Modal for wallet selection */}
        <Modal
          isOpen={isModalOpen}
          onClose={handleModalClose}
        />
      </>
    )
  }

  // Show connect button
  return (
    <>
      <Button
        onClick={handleConnectClick}
        className="flex items-center space-x-2"
        variant="default"
      >
        <Wallet className="h-4 w-4" />
        <span>Connect Wallet</span>
      </Button>

      <Modal
        isOpen={isModalOpen}
        onClose={handleModalClose}
      />
    </>
  )
}