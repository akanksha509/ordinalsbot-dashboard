# OrdinalsBot Dashboard

A comprehensive Next.js dashboard for Bitcoin Ordinals and BRC-20 tokens with advanced PSBT integration, real-time blockchain data, and professional wallet management.

## Demo

> **[Live Demo](https://ordinalsbot-dashboard.vercel.app/)**

## Overview

OrdinalsBot Dashboard is a professional-grade frontend application for interacting with Bitcoin Ordinals and BRC-20 tokens. Built with Next.js 15 and TypeScript, it provides a seamless interface for creating inscriptions, managing BRC-20 tokens, and tracking orders with advanced PSBT payment capabilities.

### Key Highlights

- **Universal Wallet Support** - Compatible with Xverse, UniSat, Leather, OKX, and Phantom wallets
- **Enhanced Security** - Advanced PSBT integration for secure Bitcoin transactions
- **Real-time Data** - Live blockchain data, fee estimates, and price information
- **BRC-20 Management** - Complete BRC-20 token portfolio management
- **Professional UI** - Modern design with dark theme and responsive layout
- **High Performance** - Optimized React Query integration with smart caching

## Features

### Dashboard
- **Token Portfolio Display** - View all BRC-20 tokens with balances and metadata
- **Recent Orders Widget** - Track inscription orders with real-time status updates
- **Network Status Bar** - Live Bitcoin network information and fee estimates
- **Preview Mode** - Realistic token preview for non-connected users

### BRC-20 Token Management
- **Balance Tracking** - Real-time available and total balance display
- **Token Metadata** - Holder counts, supply information, and token statistics
- **Search & Filter** - Advanced filtering by status, type, and search queries
- **Export Functionality** - CSV export of token data and transaction history

### Inscription Creation
- **Multi-Step Wizard** - Guided inscription creation process
- **File Upload Support** - Images, documents, media files up to 50MB
- **Text Inscriptions** - Plain text, JSON, Markdown, and code content
- **BRC-20 Operations** - Deploy, mint, and transfer BRC-20 tokens
- **Real-time Preview** - Live preview of inscription content

### Advanced Wallet Integration
- **Multi-Wallet Support** - Xverse, UniSat, Leather, OKX, Phantom compatibility
- **PSBT Capabilities** - Enhanced security with Partially Signed Bitcoin Transactions
- **Auto-Reconnection** - Intelligent wallet reconnection and state management
- **Capability Detection** - Real-time wallet feature detection and optimization

### Enhanced Security Payments
- **Dual Payment Options** - PSBT-enhanced and manual payment methods
- **Smart Selection** - Automatic payment method recommendation based on wallet
- **Transaction Validation** - Pre-flight checks and balance verification
- **Error Recovery** - Comprehensive error handling with user guidance

### Order Management
- **Comprehensive Tracking** - Track all inscription orders with detailed timelines
- **Status Categories** - Organized by pending, confirmed, and failed statuses
- **Real-time Updates** - Auto-refreshing for active orders
- **Detailed Views** - Complete order information with transaction links

### Network Features
- **Dual Network Support** - Seamless mainnet and testnet switching
- **Live Blockchain Data** - Real-time block height, mempool, and fee information
- **Price Integration** - Current Bitcoin price with 24h change tracking
- **Network Indicators** - Clear visual network status throughout the app

## Architecture

### Technology Stack

- **Frontend**: Next.js 15 with App Router
- **Language**: TypeScript 5.0+
- **Styling**: Tailwind CSS with custom design system
- **State Management**: React Query (TanStack Query)
- **Wallet Integration**: LaserEyes React SDK
- **UI Components**: Radix UI primitives with custom styling
- **API Integration**: OrdinalsBot API with enhanced error handling


## Quick Start

### Prerequisites

- Node.js 18.0 or later
- npm or yarn package manager
- Git for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/akanksha509/ordinalsbot-dashboard.git
   cd ordinalsbot-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Setup**
   
   Copy the environment template:
   ```bash
   cp .env.example .env.local
   ```

   Configure your environment variables:
   ```env
   # Network Configuration (mainnet)
   NEXT_PUBLIC_USE_TESTNET=false
   NEXT_PUBLIC_API_BASE_URL=https://api.ordinalsbot.com 
   
   # OrdinalsBot API
   ORDINALSBOT_API_KEY=your-api-key-here
   
   # External APIs
   NEXT_PUBLIC_COINGECKO_URL=https://api.coingecko.com/api/v3
   MEMPOOL_API_BASE_URL_MAINNET=https://mempool.space/api
   MEMPOOL_API_BASE_URL_TESTNET=https://mempool.space/testnet/api

   # Development
   NEXT_PUBLIC_DEV_MODE=false

   # For Testnet (Development Purpose)
   NEXT_PUBLIC_USE_TESTNET=True
   NEXT_PUBLIC_API_BASE_URL=https://testnet-api.ordinalsbot.com

   
## Application Structure

```
ordinalsbot-dashboard/
├── app/                          # Next.js App Router
│   ├── globals.css               # Global styles and themes
│   ├── layout.tsx                # Root layout with providers
│   ├── page.tsx                  # Dashboard home page
│   ├── providers.tsx             # React Query and wallet providers
│   │
│   ├── inscribe/                 # Inscription creation
│   │   └── page.tsx              # Inscription wizard interface
│   │
│   ├── orders/                   # Order management
│   │   ├── page.tsx              # Orders list and filtering
│   │   └── [orderId]/            # Dynamic order details
│   │       └── page.tsx          # Individual order view
│   │
│   ├── test/                     # PSBT testing utilities
│   │   └── page.tsx              # Wallet capability testing
│   │
│   └── api/                      # Backend API routes
│       ├── blockchain/           # Bitcoin network data
│       ├── brc20/                # BRC-20 token information
│       ├── broadcast/            # Transaction broadcasting
│       ├── order/                # Order management
│       ├── price/                # Bitcoin price data
│       └── proxy/                # API proxy endpoints
│
├── components/                   # React components
│   ├── ui/                       # Base UI components (Radix + Tailwind)
│   ├── Layout/                   # Application layout components
│   ├── WalletConnect/            # Wallet integration components
│   ├── dashboard/                # Dashboard-specific components
│   ├── orders/                   # Order management components
│   ├── inscribe/                 # Inscription creation components
│   ├── PSBTTest.tsx              # PSBT testing component
│   └── ErrorBoundary.tsx        # Error handling component
│
├── hooks/                        # Custom React hooks
│   └── use-toast.ts              # Toast notification system
│
├── lib/                          # Business logic and utilities
│   ├── utils/                    # Utility functions
│   │   ├── bitcoin.ts            # Bitcoin-specific utilities
│   │   └── index.ts              # General utilities and formatting
│   │
│   ├── wallet/                   # Wallet configuration and utilities
│   │   ├── config.ts             # Wallet configuration and PSBT setup
│   │   └── utils.ts              # Wallet helper functions
│   │
│   ├── order-status.ts           # Order status management
│   └── order-manager.ts          # Order state management
│
├── types/                        # TypeScript type definitions
│   ├── brc20.d.ts                # BRC-20 specific types
│   └── index.ts                  # Main application types
│
└── public/                       # Static assets
    ├── ordinalsbot_logo.png      # Application logo
    └── favicon.ico               # Browser favicon
```

### Advanced Features

#### Auto-Reconnection System
- **Persistent Connections** - Automatic wallet reconnection on page reload
- **Address Change Detection** - Handles in-wallet address switching
- **Error Recovery** - Intelligent retry logic with exponential backoff
- **User Experience** - Seamless reconnection without user intervention

#### Network Synchronization
- **Automatic Detection** - Wallet network detection and synchronization
- **Mismatch Handling** - Clear warnings for network mismatches
- **Switching Guidance** - User guidance for network switching

## BRC-20 Support

### Token Management Features

#### Portfolio Display
- **Real-time Balances** - Available, total, and transferable amounts
- **Token Metadata** - Holder counts, supply information, and statistics
- **Visual Enhancement** - Dynamic token icons and progress indicators
- **Search & Filter** - Advanced filtering and sorting capabilities

#### Token Operations
- **Deploy Tokens** - Create new BRC-20 tokens with custom parameters
- **Mint Tokens** - Mint existing tokens with amount validation
- **Transfer Tokens** - Send tokens to other addresses with confirmation
- **Batch Operations** - Multiple token operations in single transactions

### Data Integration

#### OrdinalsBot OPI API
- **Comprehensive Data** - Token balances, metadata, and transaction history
- **Real-time Updates** - Live balance updates and transaction monitoring
- **Error Handling** - Graceful fallbacks for API limitations
- **Network Support** - Seamless testnet and mainnet integration

## PSBT Integration

### Enhanced Security Features

#### Hybrid PSBT Implementation
PSBT integration provides enhanced security by leveraging wallet-native PSBT capabilities:

- **Client-Side PSBT Creation** - Wallets handle PSBT creation and signing
- **Enhanced Security** - Multi-layer transaction validation
- **Universal Compatibility** - Graceful fallback to manual payments
- **Professional UX** - Smart payment method selection

#### Payment Flow Options

**For PSBT-Compatible Wallets:**
1. **Enhanced Security Payment** (Recommended)
   - Wallet creates and signs PSBT internally
   - Enhanced transaction validation
   - One-click payment experience
   - Real-time status updates

2. **Direct Payment** (Alternative)
   - Standard wallet send function
   - Immediate transaction broadcast
   - Manual amount confirmation
   - Traditional payment flow


## Testing

### PSBT Testing Interface

Access the comprehensive PSBT testing suite at `/test`:

**Features:**
- **Wallet Capability Detection** - Real-time capability analysis
- **PSBT Compatibility Testing** - Comprehensive compatibility checks
- **Network Configuration Display** - Current network settings and endpoints
- **Debug Information** - Detailed logging and diagnostic data

**Test Results Include:**
```json
{
  "walletConnected": true,
  "hasSignPsbt": true,
  "hasSendBTC": true,
  "hasPublicKey": true,
  "paymentCapabilities": true,
  "psbtCompatible": true,
  "recommendations": ["Full PSBT integration available"]
}
```

### Development Testing

#### Local Development
```bash
npm run dev        # Start development server
npm run build      # Test production build
npm run lint       # Run ESLint checks
npm run type-check # TypeScript validation
```

#### Environment Testing
- **Testnet Mode** - Safe testing with testnet Bitcoin
- **API Integration** - Comprehensive API endpoint testing
- **Wallet Integration** - Multi-wallet compatibility testing
- **Error Scenarios** - Error handling and recovery testing
