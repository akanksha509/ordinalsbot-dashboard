'use client'

import { useState, useEffect } from 'react'
import { X, Wallet, Download, CheckCircle, AlertTriangle } from 'lucide-react'
import { useLaserEyes, WalletIcon } from '@omnisat/lasereyes-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { getWalletErrorMessage } from '@/lib/utils/index'
import { 
  WALLET_CONFIG, 
  SupportedWallet, 
  supportsPSBT 
} from '@/lib/wallet/config'

// Add custom scrollbar styles
const customScrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(156, 163, 175, 0.5);
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(156, 163, 175, 0.8);
  }
  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
  }
`

// Wallet icon mapping 
const walletIconMap = {
  XVERSE: 'xverse' as const,
  UNISAT: 'unisat' as const,
  LEATHER: 'leather' as const,
  OKX: 'okx' as const,
  PHANTOM: 'phantom' as const
}

interface ModalProps {
  isOpen: boolean
  onClose: () => void
}

interface WalletStatus {
  installed: boolean
  available: boolean
  version?: string
}

interface WalletOptionProps {
  walletType: SupportedWallet
  onConnect: (wallet: SupportedWallet) => void
  onInstall: (wallet: SupportedWallet) => void
  isConnecting: boolean
  status: WalletStatus
}

// Wallet detection functions
const detectWalletStatus = (walletType: SupportedWallet): WalletStatus => {
  if (typeof window === 'undefined') {
    return { installed: false, available: false }
  }

  switch (walletType) {
    case 'XVERSE':
      return {
        installed: !!(window as any).XverseProviders || !!(window as any).xverse,
        available: !!(window as any).XverseProviders?.BitcoinProvider || !!(window as any).xverse,
        version: (window as any).xverse?.version
      }
    
    case 'UNISAT':
      return {
        installed: !!(window as any).unisat,
        available: !!(window as any).unisat,
        version: (window as any).unisat?.version
      }
    
    case 'LEATHER':
      return {
        installed: !!(window as any).LeatherProvider || !!(window as any).HiroWalletProvider,
        available: !!(window as any).LeatherProvider || !!(window as any).HiroWalletProvider
      }
    
    case 'OKX':
      return {
        installed: !!(window as any).okxwallet,
        available: !!(window as any).okxwallet?.bitcoin
      }
    
    case 'PHANTOM':
      return {
        installed: !!(window as any).phantom,
        available: !!(window as any).phantom?.bitcoin
      }
    
    default:
      return { installed: false, available: false }
  }
}

// Installation URLs
const getInstallUrl = (walletType: SupportedWallet): string => {
  const urls = {
    XVERSE: 'https://chrome.google.com/webstore/detail/xverse-wallet/idnnbdplmphpflfnlkomgpfbpcgelopg',
    UNISAT: 'https://chrome.google.com/webstore/detail/unisat-wallet/ppbibelpcjmhbdihakflkdcoccbgbkpo',
    LEATHER: 'https://chrome.google.com/webstore/detail/leather/ldinpeekobnhjjdofggfgjlcehhmanlj',
    OKX: 'https://chrome.google.com/webstore/detail/okx-wallet/mcohilncbfahbmgdjkbpemcciiolgcge',
    PHANTOM: 'https://chrome.google.com/webstore/detail/phantom/bfnaelmomeimhlpmgjnjophhpkkoljpa'
  }
  return urls[walletType] || '#'
}

function WalletOption({ walletType, onConnect, onInstall, isConnecting, status }: WalletOptionProps) {
  const config = WALLET_CONFIG[walletType]
  const walletIconName = walletIconMap[walletType]
  
  return (
    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {/* Wallet icon */}
          <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 p-1">
            {walletIconName ? (
              <WalletIcon 
                walletName={walletIconName} 
                size={24} 
                className="transition-transform hover:scale-110"
              />
            ) : (
              <Wallet className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            )}
          </div>

          {/* Wallet info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 dark:text-white text-sm truncate">
              {config.name}
            </h3>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex-shrink-0">
          {status.installed && status.available ? (
            <Button
              size="sm"
              onClick={() => onConnect(walletType)}
              disabled={isConnecting}
              className="text-xs px-3"
            >
              {isConnecting ? (
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                'Connect'
              )}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onInstall(walletType)}
              className="text-xs px-3"
            >
              <Download className="h-3 w-3 mr-1" />
              Install
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export function Modal({ isOpen, onClose }: ModalProps) {
  const [connectingWallet, setConnectingWallet] = useState<SupportedWallet | null>(null)
  const [walletStatuses, setWalletStatuses] = useState<Record<SupportedWallet, WalletStatus>>({} as any)
  const { toast } = useToast()
  const laserEyes = useLaserEyes()

  const allWallets = Object.keys(WALLET_CONFIG) as SupportedWallet[]

  // Detect wallet statuses on mount and periodically
  useEffect(() => {
    const detectStatuses = () => {
      const statuses = {} as Record<SupportedWallet, WalletStatus>
      allWallets.forEach(wallet => {
        statuses[wallet] = detectWalletStatus(wallet)
      })
      setWalletStatuses(statuses)
    }

    detectStatuses()
    
    // Check again after a delay
    const timeout = setTimeout(detectStatuses, 2000)
    
    return () => clearTimeout(timeout)
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  const handleConnect = async (walletType: SupportedWallet) => {
    setConnectingWallet(walletType)
    
    try {
      // Convert wallet type to LaserEyes format
      const laserEyesWalletType = walletType.toLowerCase()
      
      await laserEyes.connect(laserEyesWalletType as any)
      
      toast({
        title: `${WALLET_CONFIG[walletType].name} Connected`,
        description: `Successfully connected to ${WALLET_CONFIG[walletType].name}`,
      })
      
      onClose()
    } catch (error) {
      console.error('Wallet connection failed:', error)
      toast({
        title: "Connection Failed",
        description: getWalletErrorMessage(error),
        variant: "destructive",
      })
    } finally {
      setConnectingWallet(null)
    }
  }

  const handleInstall = (walletType: SupportedWallet) => {
    const installUrl = getInstallUrl(walletType)
    window.open(installUrl, '_blank')
    
    toast({
      title: `Installing ${WALLET_CONFIG[walletType].name}`,
      description: "After installation, refresh this page and try connecting again",
    })
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Inject custom scrollbar styles */}
      <style dangerouslySetInnerHTML={{ __html: customScrollbarStyles }} />
      
      <div 
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={handleBackdropClick}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          minHeight: '100vh',
          minWidth: '100vw'
        }}
      >
        {/* Modal container */}
        <div 
          className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transform transition-all duration-200 ease-out"
          style={{
            maxHeight: '75vh',
            minHeight: '300px',
            maxWidth: '400px',
            width: '380px',
            margin: 'auto',
            transform: 'translateZ(0)', 
            position: 'relative',
            zIndex: 10000
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Scrollable content container */}
          <div className="flex flex-col h-full max-h-full">
            {/* Header - Fixed */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Connect Wallet
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ maxHeight: '400px' }}>
              <div className="p-4">
                <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                  Choose your Bitcoin wallet to continue
                </p>

                <div className="space-y-3">
                  {allWallets.map((wallet) => (
                    <WalletOption
                      key={wallet}
                      walletType={wallet}
                      onConnect={handleConnect}
                      onInstall={handleInstall}
                      isConnecting={connectingWallet === wallet}
                      status={walletStatuses[wallet] || { installed: false, available: false }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}