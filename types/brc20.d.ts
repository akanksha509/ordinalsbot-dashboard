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

export interface TokenGridProps {
  tokens: BRC20Token[]
  tickerInfos: Record<string, BRC20TickerInfo>
  loading?: boolean
  error?: string | null
  onRefresh?: () => void     
  onTokenClick?: (ticker: string) => void  
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

// BRC-20 Transaction data
export interface BRC20Transaction {
  id: string
  type: 'deploy' | 'mint' | 'transfer'
  ticker: string
  amount?: string
  from?: string
  to?: string
  txid: string
  inscriptionId: string
  blockHeight: number
  timestamp: number
  confirmations: number
  status: 'pending' | 'confirmed' | 'failed'
  networkFee: number
}

// BRC-20 Wallet integration types
export interface BRC20WalletBalance {
  address: string
  network: 'mainnet' | 'testnet'
  tokens: BRC20Token[]
  totalTokens: number
  totalValue?: number
  lastUpdated: number
}

// BRC-20 Send transaction params 
export interface BRC20SendParams {
  ticker: string
  amount: string
  toAddress: string
  feeRate?: number
  priority?: 'low' | 'normal' | 'high'
}

// BRC-20 Send result
export interface BRC20SendResult {
  success: boolean
  txid?: string
  inscriptionId?: string
  error?: string
  estimatedConfirmTime?: number
}

// BRC-20 Market data
export interface BRC20MarketData {
  ticker: string
  price?: number
  volume24h?: number
  marketCap?: number
  holders: number
  totalSupply: string
  circulatingSupply: string
  lastUpdated: number
}

// BRC-20 Search/Filter types
export interface BRC20SearchParams {
  query?: string
  sortBy?: 'ticker' | 'balance' | 'holders' | 'marketCap'
  sortDirection?: 'asc' | 'desc'
  filterBy?: 'all' | 'transferable' | 'divisible' | 'active'
  limit?: number
  offset?: number
}

export interface BRC20SearchResult {
  tokens: BRC20Token[]
  tickerInfos: Record<string, BRC20TickerInfo>
  totalCount: number
  hasMore: boolean
}

// BRC-20 Error types
export interface BRC20Error {
  code: string
  message: string
  ticker?: string
  operation?: string
  details?: any
}

// BRC-20 Validation result
export interface BRC20ValidationResult {
  isValid: boolean
  errors: BRC20Error[]
  warnings?: string[]
}

// All types for easy importing
export type BRC20Operation = 'deploy' | 'mint' | 'transfer'
export type BRC20Status = 'pending' | 'confirmed' | 'failed'
export type BRC20Priority = 'low' | 'normal' | 'high'
export type BRC20SortField = 'ticker' | 'balance' | 'holders' | 'marketCap'
export type BRC20FilterType = 'all' | 'transferable' | 'divisible' | 'active'

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

// Helper functions for BRC-20 data
export function formatBRC20Amount(amount: string, decimals: number = 18): string {
  const num = Number(amount)
  if (decimals === 0) return num.toLocaleString()
  return (num / Math.pow(10, decimals)).toLocaleString()
}

export function parseBRC20Amount(amount: string, decimals: number = 18): string {
  const num = parseFloat(amount)
  if (decimals === 0) return num.toString()
  return (num * Math.pow(10, decimals)).toString()
}

export function validateBRC20Ticker(ticker: string): boolean {
  return typeof ticker === 'string' && ticker.length >= 1 && ticker.length <= 4
}

export function validateBRC20Amount(amount: string): boolean {
  const num = Number(amount)
  return !isNaN(num) && num > 0
}