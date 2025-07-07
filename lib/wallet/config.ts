// LaserEyes wallet types 
export type SupportedWallet = 'XVERSE' | 'UNISAT' | 'LEATHER' | 'OKX' | 'PHANTOM'

// Wallet capability flags
export interface WalletCapabilities {
  inscriptions: boolean
  brc20: boolean
  psbt: boolean
  ordinals: boolean
  payments: boolean
  signMessage: boolean
  taproot: boolean
}

// wallet configuration with PSBT details
export const WALLET_CONFIG = {
  XVERSE: {
    name: 'Xverse',
    icon: '/wallets/xverse.png',
    description: 'Feature-rich Bitcoin and Ordinals wallet with full PSBT support',
    downloadUrl: 'https://xverse.app',
    features: ['inscriptions', 'brc20', 'psbt', 'stx'] as const,
    capabilities: {
      inscriptions: true,
      brc20: true,
      psbt: true,
      ordinals: true,
      payments: true,
      signMessage: true,
      taproot: true
    } as WalletCapabilities,
    psbtMethods: ['signPsbt', 'signPsbtBulk'] as string[],
    recommendedForPsbt: true
  },
  UNISAT: {
    name: 'UniSat',
    icon: '/wallets/unisat.png',
    description: 'Popular Bitcoin wallet for Ordinals with PSBT support',
    downloadUrl: 'https://unisat.io',
    features: ['inscriptions', 'brc20', 'psbt'] as const,
    capabilities: {
      inscriptions: true,
      brc20: true,
      psbt: true,
      ordinals: true,
      payments: true,
      signMessage: true,
      taproot: false
    } as WalletCapabilities,
    psbtMethods: ['signPsbt'] as string[],
    recommendedForPsbt: true
  },
  LEATHER: {
    name: 'Leather',
    icon: '/wallets/leather.png',
    description: 'Open-source Bitcoin wallet with Stacks integration',
    downloadUrl: 'https://leather.io',
    features: ['inscriptions', 'psbt', 'stx'] as const,
    capabilities: {
      inscriptions: true,
      brc20: false,
      psbt: true,
      ordinals: true,
      payments: true,
      signMessage: true,
      taproot: false
    } as WalletCapabilities,
    psbtMethods: ['signPsbt'] as string[],
    recommendedForPsbt: true
  },
  OKX: {
    name: 'OKX Wallet',
    icon: '/wallets/okx.png',
    description: 'Multi-chain wallet with Bitcoin and Ordinals support',
    downloadUrl: 'https://okx.com/web3',
    features: ['inscriptions', 'brc20', 'psbt'] as const,
    capabilities: {
      inscriptions: true,
      brc20: true,
      psbt: true,
      ordinals: true,
      payments: true,
      signMessage: true,
      taproot: false
    } as WalletCapabilities,
    psbtMethods: ['signPsbt'] as string[],
    recommendedForPsbt: false
  },
  PHANTOM: {
    name: 'Phantom',
    icon: '/wallets/phantom.png',
    description: 'Multi-chain wallet with Bitcoin support',
    downloadUrl: 'https://phantom.app',
    features: ['payments', 'psbt'] as const,
    capabilities: {
      inscriptions: false,
      brc20: false,
      psbt: true,
      ordinals: false,
      payments: true,
      signMessage: true,
      taproot: false
    } as WalletCapabilities,
    psbtMethods: ['signPsbt'] as string[],
    recommendedForPsbt: false
  }
} as const

// Helper functions for wallet configuration
export function getWalletIcon(walletType: SupportedWallet): string {
  return WALLET_CONFIG[walletType]?.icon || '/wallets/default.png'
}

export function getWalletName(walletType: SupportedWallet): string {
  return WALLET_CONFIG[walletType]?.name || walletType
}

export function getWalletFeatures(walletType: SupportedWallet): readonly string[] {
  return WALLET_CONFIG[walletType]?.features || []
}

export function getWalletCapabilities(walletType: SupportedWallet): WalletCapabilities {
  return WALLET_CONFIG[walletType]?.capabilities || {
    inscriptions: false,
    brc20: false,
    psbt: false,
    ordinals: false,
    payments: false,
    signMessage: false,
    taproot: false
  }
}

export function isWalletSupported(walletType: string): walletType is SupportedWallet {
  return Object.keys(WALLET_CONFIG).includes(walletType)
}

// PSBT-specific helper functions
export function supportsPSBT(walletType: SupportedWallet): boolean {
  return WALLET_CONFIG[walletType]?.capabilities.psbt || false
}

export function isRecommendedForPSBT(walletType: SupportedWallet): boolean {
  return WALLET_CONFIG[walletType]?.recommendedForPsbt || false
}

export function getPSBTMethods(walletType: SupportedWallet): string[] {
  return WALLET_CONFIG[walletType]?.psbtMethods || []
}

export function getRecommendedWalletsForPSBT(): SupportedWallet[] {
  return Object.entries(WALLET_CONFIG)
    .filter(([_, config]) => config.recommendedForPsbt)
    .map(([wallet, _]) => wallet as SupportedWallet)
}

// Runtime wallet capability detection
export function detectWalletCapabilities(laserEyes: any): WalletCapabilities {
  const detected: WalletCapabilities = {
    inscriptions: false,
    brc20: false,
    psbt: false,
    ordinals: false,
    payments: false,
    signMessage: false,
    taproot: false
  }

  if (!laserEyes) return detected

  // Check for PSBT support
  detected.psbt = typeof laserEyes.signPsbt === 'function'
  
  // Check for payment support
  detected.payments = typeof laserEyes.sendBTC === 'function' || 
                     typeof laserEyes.send === 'function'
  
  // Check for message signing
  detected.signMessage = typeof laserEyes.signMessage === 'function'
  
  // Check for ordinals support 
  detected.ordinals = !!laserEyes.ordinalsAddress || !!laserEyes.address
  
  // Check for inscriptions 
  detected.inscriptions = detected.ordinals
  
  // BRC-20 is typically same as inscriptions
  detected.brc20 = detected.inscriptions
  
  // Taproot detection 
  detected.taproot = !!laserEyes.address?.startsWith('bc1p') || 
                     !!laserEyes.address?.startsWith('tb1p')

  return detected
}

// Wallet compatibility checker for PSBT payments
export function checkPSBTCompatibility(laserEyes: any): {
  compatible: boolean
  issues: string[]
  recommendations: string[]
} {
  const issues: string[] = []
  const recommendations: string[] = []

  if (!laserEyes) {
    issues.push('No wallet connected')
    recommendations.push('Connect a Bitcoin wallet first')
    return { compatible: false, issues, recommendations }
  }

  // Check for PSBT signing
  if (typeof laserEyes.signPsbt !== 'function') {
    issues.push('Wallet does not support PSBT signing')
    recommendations.push('Use manual payment instead')
  }

  // Check for required addresses
  if (!laserEyes.address) {
    issues.push('No wallet address available')
    recommendations.push('Ensure wallet is properly connected')
  }

  if (!laserEyes.paymentAddress && !laserEyes.address) {
    issues.push('No payment address available')
    recommendations.push('Wallet may not support payments')
  }

  // Check for public key 
  if (!laserEyes.publicKey) {
    issues.push('No public key available')
    recommendations.push('Wallet may not expose public key for PSBT')
  }

  // Success case
  if (issues.length === 0) {
    recommendations.push('PSBT payment is fully supported')
  }

  return {
    compatible: issues.length === 0,
    issues,
    recommendations
  }
}

// Enhanced error handling specifically for PSBT operations
export function getPSBTErrorMessage(error: any): string {
  if (typeof error === 'string') return error

  const message = error?.message || 'Unknown PSBT error'

  // PSBT-specific error patterns
  if (message.includes('User rejected') || message.includes('user denied')) {
    return 'PSBT signing was cancelled by user'
  } else if (message.includes('PSBT') && message.includes('invalid')) {
    return 'Invalid PSBT format - please try manual payment'
  } else if (message.includes('not supported') || message.includes('not available')) {
    return 'Wallet does not support PSBT - use manual payment instead'
  } else if (message.includes('Insufficient funds')) {
    return 'Insufficient funds for PSBT transaction'
  } else if (message.includes('Fee too low')) {
    return 'Transaction fee too low - try increasing fee rate'
  } else if (message.includes('broadcast') || message.includes('network')) {
    return 'Failed to broadcast transaction - network issue'
  }

  return message
}

// PSBT validation helpers
export function validatePSBT(psbt: string): { valid: boolean; error?: string } {
  if (!psbt || typeof psbt !== 'string') {
    return { valid: false, error: 'PSBT must be a string' }
  }

  if (psbt.length < 50) {
    return { valid: false, error: 'PSBT appears too short' }
  }

  // Basic PSBT format check (starts with base64 or hex)
  const isBase64 = /^[A-Za-z0-9+/]*={0,2}$/.test(psbt)
  const isHex = /^[0-9a-fA-F]+$/.test(psbt)
  
  if (!isBase64 && !isHex) {
    return { valid: false, error: 'PSBT must be valid base64 or hex' }
  }

  return { valid: true }
}

// Get wallet-specific PSBT signing options
export function getPSBTSigningOptions(walletType: SupportedWallet): any {
  // Return wallet-specific signing options
  switch (walletType) {
    case 'XVERSE':
      return {
        autoFinalized: true,
        signInputs: true,
        allowedSighashTypes: [1] // SIGHASH_ALL
      }
    
    case 'UNISAT':
      return {
        autoFinalized: true,
        toSignInputs: true
      }
    
    case 'LEATHER':
      return {
        autoFinalized: true,
        broadcast: false
      }
    
    case 'OKX':
      return {
        autoFinalized: true
      }
    
    case 'PHANTOM':
      return {
        autoFinalized: true
      }
    
    default:
      return {
        autoFinalized: true
      }
  }
}

// Wallet feature detection at runtime
export function detectWalletFeatures(laserEyes: any): {
  hasSignPsbt: boolean
  hasSignMessage: boolean
  hasPaymentAddress: boolean
  hasOrdinalAddress: boolean
  hasPublicKey: boolean
  walletType?: string
} {
  if (!laserEyes) {
    return {
      hasSignPsbt: false,
      hasSignMessage: false,
      hasPaymentAddress: false,
      hasOrdinalAddress: false,
      hasPublicKey: false
    }
  }

  return {
    hasSignPsbt: typeof laserEyes.signPsbt === 'function',
    hasSignMessage: typeof laserEyes.signMessage === 'function',
    hasPaymentAddress: !!laserEyes.paymentAddress || !!laserEyes.address,
    hasOrdinalAddress: !!laserEyes.ordinalsAddress || !!laserEyes.address,
    hasPublicKey: !!laserEyes.publicKey,
    walletType: laserEyes.walletType || laserEyes.provider?.name
  }
}

// Network-specific configuration
export function getNetworkSpecificConfig(network: 'mainnet' | 'testnet') {
  return {
    mainnet: {
      minFeeRate: 15, 
      defaultFeeRate: 25,
      fastFeeRate: 50,
      explorerUrl: 'https://mempool.space',
      psbtRecommendations: [
        'Use higher fee rates for faster confirmation',
        'PSBT payments are more reliable on mainnet'
      ]
    },
    testnet: {
      minFeeRate: 3, // sats/vB
      defaultFeeRate: 5,
      fastFeeRate: 10,
      explorerUrl: 'https://mempool.space/testnet',
      psbtRecommendations: [
        'Testnet confirmations may be slower',
        'Use lower fee rates to save testnet coins'
      ]
    }
  }[network]
}

// wallet readiness check
export function checkWalletReadiness(laserEyes: any): {
  ready: boolean
  issues: string[]
  capabilities: string[]
  recommendations: string[]
} {
  const issues: string[] = []
  const capabilities: string[] = []
  const recommendations: string[] = []

  if (!laserEyes) {
    issues.push('No wallet connected')
    recommendations.push('Connect a Bitcoin wallet to continue')
    return { ready: false, issues, capabilities, recommendations }
  }

  // Check connection status
  if (!laserEyes.connected) {
    issues.push('Wallet not connected')
    recommendations.push('Complete wallet connection process')
  }

  // Check addresses
  if (!laserEyes.address) {
    issues.push('No wallet address available')
    recommendations.push('Ensure wallet permissions are granted')
  } else {
    capabilities.push('Wallet address available')
  }

  if (laserEyes.paymentAddress) {
    capabilities.push('Payment address available')
  }

  if (laserEyes.ordinalsAddress) {
    capabilities.push('Ordinals address available')
  }

  // Check PSBT capabilities
  if (typeof laserEyes.signPsbt === 'function') {
    capabilities.push('PSBT signing supported')
    recommendations.push('PSBT payments available for better UX')
  } else {
    issues.push('No PSBT support')
    recommendations.push('Manual payments only')
  }

  // Check payment capabilities
  if (typeof laserEyes.sendBTC === 'function' || typeof laserEyes.send === 'function') {
    capabilities.push('Direct payments supported')
  } else {
    issues.push('No direct payment support')
    recommendations.push('Use external wallet for payments')
  }

  // Check balance
  if (laserEyes.balance !== undefined) {
    capabilities.push(`Balance: ${laserEyes.balance} sats`)
    if (laserEyes.balance === 0) {
      issues.push('No balance available')
      recommendations.push('Add Bitcoin to wallet before making payments')
    }
  }

  // Check network
  if (laserEyes.network) {
    capabilities.push(`Network: ${laserEyes.network}`)
  }

  return {
    ready: issues.length === 0,
    issues,
    capabilities,
    recommendations
  }
}