import type { BRC20Token, BRC20TickerInfo } from './brc20.d'
export type OrderStatus = 
  | 'pending'
  | 'payment-pending'  
  | 'payment-received'
  | 'confirming'
  | 'confirmed'
  | 'inscribing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'waiting-payment'
  | 'payment-confirmed'
  | 'ready'
  | 'processing'
  | 'success'
  | 'error'

// Order Types
export type OrderType = 
  | 'inscription'
  | 'brc20-mint'
  | 'brc20-transfer'
  | 'brc20-deploy'
  | 'collection'
  | 'bulk'

// StatusCounts interface with proper typing
export interface StatusCounts {
  all: number
  pending: number
  'payment-pending': number
  'payment-received': number
  confirming: number
  confirmed: number
  inscribing: number
  completed: number
  failed: number
  cancelled: number
  'waiting-payment': number
  'payment-confirmed': number
  ready: number
  processing: number
  success: number
  error: number
  
  categorized: {
    pending: number
    confirmed: number
    failed: number
  }
}

// Main Order Interface
export interface Order {
  id: string
  type: OrderType
  status: OrderStatus
  createdAt: string | number  
  updatedAt: string | number  
  
  // Payment details
  paymentAddress: string
  paymentAmount: number
  paidAmount?: number
  feeRate: number
  totalFee: number
  
  // Order specifics
  inscriptions?: InscriptionItem[]
  brc20Details?: BRC20OrderDetails
  
  // Transaction details
  txid?: string
  inscriptionId?: string
  inscriptionNumber?: number
  blockHeight?: number
  confirmations?: number
  
  // Metadata
  receiveAddress: string
  files?: OrderFile[]
  metadata?: Record<string, any>
  network?: 'mainnet' | 'testnet'
  
  // Timeline
  timeline?: OrderTimeline[]
  
  // OrdinalsBot specific fields
  charge?: {
    address: string
    amount: number
    status: string
    auto_settle: boolean
    created_at: number
    currency: string
    description: string
    id: string
  }
  state?: string 
}

export interface InscriptionItem {
  id: string
  fileName?: string
  fileType?: string
  fileSize?: number
  content?: string
  inscriptionId?: string
  inscriptionNumber?: number
  txid?: string
}

export interface BRC20OrderDetails {
  ticker: string
  operation: 'deploy' | 'mint' | 'transfer'
  amount?: string
  maxSupply?: string
  mintLimit?: string
  decimals?: number
  to?: string
}

export interface OrderFile {
  name: string
  type: string
  size: number
  content: string | ArrayBuffer
  preview?: string
}

export interface OrderTimeline {
  status: OrderStatus
  timestamp: string | number  
  txid?: string
  blockHeight?: number
  message?: string
}

// API Response Types
export interface OrderResponse {
  success: boolean
  data: Order
  error?: string
}

export interface OrdersResponse {
  success: boolean
  data: Order[]
  pagination?: {
    page: number
    limit: number
    total: number
  }
  error?: string
}

//  Create Order Types 
export interface CreateOrderRequest {
  type: OrderType
  receiveAddress: string
  feeRate?: number
  fee?: number              
  textContent?: string      
  title?: string           
  description?: string     
  files?: OrderFile[]
  brc20Details?: BRC20OrderDetails
  metadata?: Record<string, any>
}

export interface CreateOrderResponse {
  success: boolean
  data: {
    orderId: string
    paymentAddress: string
    amount: number
    feeRate: number
    network?: 'mainnet' | 'testnet'
  }
  error?: string
}

// Order History Types
export interface OrderHistory {
  orderId: string
  type: OrderType
  status: OrderStatus
  createdAt: string | number 
  amount: number
  inscriptionId?: string
  ticker?: string
  description: string
}

// UI Component Props
export interface OrderRowProps {
  order: Order
  onClick?: () => void
  showDetails?: boolean
}

export interface StatusBadgeProps {
  status: OrderStatus
  size?: 'sm' | 'md' | 'lg'
}

export interface StatusTimelineProps {
  order: Order
  currentStatus: OrderStatus
}

export interface OrderViewerProps {
  orderId: string
  initialOrder?: Order
}

// Payment types 
export interface PaymentInfo {
  address: string
  amount: number
  qrCode?: string
  network: 'mainnet' | 'testnet'
  confirmations?: number
  requiredConfirmations: number
}

// Fee estimation
export interface FeeEstimation {
  slow: number
  normal: number
  fast: number
  custom?: number
  recommended: number
}

// OrdinalsBot API specific types
export interface OrdinalsFileFormat {
  name: string
  dataURL: string
  size: number
}

export interface OrdinalsOrderPayload {
  receiveAddress: string
  fee: number
  files?: OrdinalsFileFormat[]
  title?: string
  description?: string
  postage?: number
}

// WizardData Interface 
export interface WizardData {
  currentStep?: number
  totalSteps?: number
  
  // Order details
  type?: OrderType
  contentType?: 'files' | 'text'
  receiveAddress?: string
  feeRate?: number
  
  // Files and content
  files?: OrderFile[]
  textContent?: string
  title?: string
  description?: string
  
  // BRC20 specific
  brc20Operation?: 'deploy' | 'mint' | 'transfer'
  brc20Details?: BRC20OrderDetails
  
  // Payment and transaction
  paymentAddress?: string
  paymentAmount?: number
  fee?: number
  txid?: string
  
  // Order tracking
  orderId?: string
  inscriptionId?: string
  inscriptionNumber?: number
  
  // Status
  status?: OrderStatus
  paymentStatus?: 'pending' | 'sent' | 'confirmed' | 'failed'
  
  // Metadata
  metadata?: Record<string, any>
  network?: 'mainnet' | 'testnet'
  
  // UI state
  isLoading?: boolean
  error?: string
  isValid?: boolean
  validationErrors?: Record<string, string>
}

// Common types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Network types
export interface BlockchainInfo {
  blockHeight: number
  difficulty: number
  timestamp: number
}

export interface FeeEstimate {
  fastestFee: number
  halfHourFee: number
  hourFee: number
  economyFee: number
  minimumFee: number
}

export interface BTCPrice {
  usd: number
  lastUpdated: number
}

//  Address balance type
export interface AddressBalance {
  address: string
  balance: number
  confirmedBalance: number
  unconfirmedBalance: number
  transactions: number
  confirmedTransactions: number
  unconfirmedTransactions: number
  hasBalance: boolean
  hasTransactions: boolean
  network: 'mainnet' | 'testnet'
}

// Wallet types 
export interface WalletInfo {
  address: string
  publicKey: string
  balance?: number
  network: 'mainnet' | 'testnet'
}

// UTXO types 
export interface UTXO {
  txid: string
  vout: number
  value: number
  scriptPubKey: string
  confirmations: number
  inscriptions?: string[]
}

// Transaction types
export interface Transaction {
  txid: string
  confirmations: number
  blockHeight?: number
  timestamp: number
  fee: number
  inputs: Array<{
    txid: string
    vout: number
    value: number
  }>
  outputs: Array<{
    value: number
    address: string
  }>
}

// Error types
export interface ApiError {
  code: string
  message: string
  details?: any
}

export interface WalletError extends Error {
  code?: string
  cause?: any
}

// UI types
export interface LoadingState {
  isLoading: boolean
  message?: string
}

export interface ErrorState {
  hasError: boolean
  error?: Error | string
  retry?: () => void
}

// Form types
export interface FormField {
  name: string
  value: any
  error?: string
  required?: boolean
}

// Navigation types
export interface NavItem {
  label: string
  href: string
  icon?: string
  active?: boolean
}

// Token Grid Props
// ✅ REPLACE WITH THIS:
export interface TokenGridProps {
  tokens: BRC20Token[]
  tickerInfos: Record<string, BRC20TickerInfo>
  loading?: boolean
  error?: string | null
  onRefresh?: () => void
  onTokenClick?: (ticker: string) => void
}

export interface TokenCardProps {
  token: BRC20Token
  tickerInfo?: BRC20TickerInfo
  onClick?: () => void
  loading?: boolean
  className?: string
}

// Export BRC20 types
export * from './brc20.d'