export interface BRC20Token {
  ticker: string
  balance: string      
  available: string     
  transferable: string  
  decimals: number
  overall?: string     
}

// BRC-20 Balance response from LaserEyes
export interface BRC20Balance {
  address: string
  tokens: BRC20Token[]
  totalValue?: number
  hasTokens?: boolean  
  message?: string      
  error?: string       
}

// Complete BRC-20 ticker information
export interface BRC20TickerInfo {
  ticker: string
  decimals: number
  maxSupply: string
  totalSupply: string
  mintedSupply: string
  remainingSupply?: string  
  burnedSupply?: string     
  holders: number
  transferCount: number
  mintCount: number
  inscriptionId: string
  inscriptionNumber: number
  timestamp: number
  blockHeight?: number      
  creator: string
  isActive?: boolean        
  isSelfMint?: boolean   
}

// BRC-20 operation types
export interface BRC20Transfer {
  ticker: string
  amount: string
  from: string
  to: string
  inscriptionId: string
  timestamp: number
  blockHeight: number
  txid: string
  status?: 'pending' | 'confirmed' | 'failed'  
}

export interface BRC20Mint {
  ticker: string
  amount: string
  to: string
  inscriptionId: string
  timestamp: number
  blockHeight: number
  txid: string
  status?: 'pending' | 'confirmed' | 'failed' 
}

export interface BRC20Deploy {
  ticker: string
  maxSupply: string
  mintLimit: string
  decimals: number
  inscriptionId: string
  timestamp: number
  blockHeight: number
  txid: string
  creator: string
  status?: 'pending' | 'confirmed' | 'failed'  
}

// API Response types for BRC-20
export interface BRC20BalanceResponse {
  success: boolean
  data: {
    address: string
    tokens: BRC20Token[]
    hasTokens?: boolean      
    message?: string         
    error?: string           
  }
  error?: string             
}

export interface BRC20TickerResponse {
  success: boolean
  data: BRC20TickerInfo
  error?: string             
}

export interface BRC20HistoryResponse {
  success: boolean
  data: {
    transfers: BRC20Transfer[]
    mints: BRC20Mint[]
    deploys: BRC20Deploy[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages?: number    
    }
  }
  error?: string             
}

export interface TokenCardProps {
  token: BRC20Token
  tickerInfo?: BRC20TickerInfo
  onClick?: () => void
  loading?: boolean
  className?: string         
}

// Formatting helpers for display
export interface TokenDisplayData {
  ticker: string
  available: string
  total: string
  availableFormatted: string
  totalFormatted: string
  percentage: number
  decimals: number
  maxSupply?: string
  holders?: number
  isTransferable?: boolean   
  isDivisible?: boolean      
}

// BRC-20 Order Details (for inscription orders)
export interface BRC20OrderDetails {
  ticker: string
  operation: 'deploy' | 'mint' | 'transfer'
  amount?: string
  maxSupply?: string
  mintLimit?: string
  decimals?: number
  to?: string
  priority?: 'low' | 'normal' | 'high'
  estimatedTime?: string
  networkFee?: number
}

// Essential type aliases
export type BRC20Operation = 'deploy' | 'mint' | 'transfer'
export type BRC20Status = 'pending' | 'confirmed' | 'failed'

// Type guards for BRC-20 operations
export function isBRC20Deploy(operation: any): operation is BRC20Deploy {
  return operation && operation.maxSupply && operation.mintLimit
}

export function isBRC20Mint(operation: any): operation is BRC20Mint {
  return operation && operation.amount && operation.to && !operation.maxSupply
}

export function isBRC20Transfer(operation: any): operation is BRC20Transfer {
  return operation && operation.amount && operation.from && operation.to
}