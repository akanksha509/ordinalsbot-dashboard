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
  const [forceUpdate, setForceUpdate] = useState(0)
  const { toast } = useToast()
  
  const laserEyes = useLaserEyes()

  useEffect(() => {
    const handleWalletChange = () => {
      console.log(' Wallet state changed, forcing re-render')
      setForceUpdate(prev => prev + 1)
    }

    // Listen for any wallet connection state changes
    if (laserEyes.connected !== undefined) {
      handleWalletChange()
    }
  }, [laserEyes.connected, laserEyes.address, laserEyes.balance, laserEyes.network])

  // Clear component state on disconnect with better logging
  useEffect(() => {
    if (!laserEyes.connected) {
      console.log('🔌 Wallet disconnected, clearing component state')
      setIsModalOpen(false)
      setForceUpdate(prev => prev + 1)
      
      // Dispatch global wallet disconnection event
      const event = new CustomEvent('walletDisconnected', {
        detail: { timestamp: Date.now() }
      })
      window.dispatchEvent(event)
    }
  }, [laserEyes.connected])

  //  Listen for successful wallet connections
  useEffect(() => {
    if (laserEyes.connected && laserEyes.address) {
      console.log(' Wallet connected successfully:', laserEyes.address)
      setForceUpdate(prev => prev + 1)
      
      // Dispatch global wallet connection event
      const event = new CustomEvent('walletConnected', {
        detail: { 
          address: laserEyes.address, 
          network: laserEyes.network,
          timestamp: Date.now() 
        }
      })
      window.dispatchEvent(event)
    }
  }, [laserEyes.connected, laserEyes.address, laserEyes.network])

  const psbtCompatibility = checkPSBTCompatibility(laserEyes)
  const walletCapabilities = detectWalletCapabilities(laserEyes)

  const handleCopyAddress = () => {
    if (!laserEyes.address) return
    copyToClipboard(laserEyes.address, 'Wallet address')
  }

  const handleDisconnect = async () => {
    try {
      console.log('🔌 Initiating wallet disconnect...')
      await laserEyes.disconnect()
      
      // Multiple state updates for reliability
      setForceUpdate(prev => prev + 1)
      setIsModalOpen(false)
      
      toast({
        title: "Wallet disconnected",
        description: "Your wallet has been disconnected",
      })
      
      // Additional state cleanup with longer delay
      setTimeout(() => {
        setForceUpdate(prev => prev + 1)
        console.log('🔄 Post-disconnect state cleanup completed')
      }, 200)
      
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
    console.log('🔗 Opening wallet connection modal')
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    console.log('🔒 Closing wallet connection modal')
    setIsModalOpen(false)
    
    // Force update with longer delay to catch connection changes
    setTimeout(() => {
      setForceUpdate(prev => prev + 1)
      console.log('🔄 Post-modal state update completed')
    }, 150)
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

  // More robust connection check with additional validation
  const isActuallyConnected = laserEyes.connected && 
                              laserEyes.address && 
                              !laserEyes.isConnecting &&
                              laserEyes.address.length > 10 

  // Show connected state with dropdown
  if (isActuallyConnected) {
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
                    {laserEyes.network || 'mainnet'}
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

        {/* Modal for wallet selection (only show when explicitly opened) */}
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