import { getNetworkFromEnv } from '../utils/index'

// Network configuration
export function getNetworkConfig() {
  const network = getNetworkFromEnv()
  return {
    mainnet: {
      name: 'Bitcoin Mainnet',
      explorer: 'https://mempool.space',
      apiUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.ordinalsbot.com'
    },
    testnet: {
      name: 'Bitcoin Testnet',
      explorer: 'https://mempool.space/testnet',
      apiUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://testnet-api.ordinalsbot.com'
    }
  }[network]
}

// Address validation - Network-aware
export function validateAddress(address: string): boolean {
  if (!address) return false
  
  const currentNetwork = getNetworkFromEnv()
  
  const mainnetPatterns = [
    /^1[a-km-zA-HJ-NP-Z1-9]{25,34}$/, // P2PKH
    /^3[a-km-zA-HJ-NP-Z1-9]{25,34}$/, // P2SH
    /^bc1[a-z0-9]{39,59}$/,           // Bech32
    /^bc1p[a-z0-9]{58}$/              // Taproot
  ]
  
  const testnetPatterns = [
    /^[mn][a-km-zA-HJ-NP-Z1-9]{25,34}$/, // Testnet P2PKH
    /^2[a-km-zA-HJ-NP-Z1-9]{25,34}$/,    // Testnet P2SH
    /^tb1[a-z0-9]{39,59}$/,              // Testnet Bech32
    /^tb1p[a-z0-9]{58}$/                 // Testnet Taproot
  ]
  
  const patterns = currentNetwork === 'mainnet' ? mainnetPatterns : testnetPatterns
  return patterns.some(pattern => pattern.test(address))
}

// Error handling for wallet operations
export function getWalletErrorMessage(error: any): string {
  if (typeof error === 'string') return error
  
  const message = error?.message || 'Unknown wallet error'
  
  // Common error patterns
  if (message.includes('User rejected')) {
    return 'Transaction was rejected by user'
  } else if (message.includes('Insufficient funds')) {
    return 'Insufficient funds for transaction'
  } else if (message.includes('Network')) {
    return 'Network error - please try again'
  }
  
  return message
}

// Storage helpers for wallet state
export function saveLastConnectedWallet(walletType: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('lastConnectedWallet', walletType.toLowerCase())
  }
}

export function getLastConnectedWallet(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('lastConnectedWallet')
  }
  return null
}

export function clearLastConnectedWallet(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('lastConnectedWallet')
  }
}