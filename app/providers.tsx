'use client'

import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import dynamic from 'next/dynamic'
import { BaseNetwork } from '@omnisat/lasereyes-react'
import { useAutoReconnect } from '@/components/WalletConnect/useAutoReconnect'
import { getNetworkFromEnv } from '@/lib/utils/index'

// LaserEyes provider with proper network configuration
const LaserEyesProvider = dynamic(
  () =>
    import('@omnisat/lasereyes-react')
      .then((mod) => ({ default: mod.LaserEyesProvider }))
      .catch((err) => {
        console.warn('LaserEyes not available:', err)
        return {
          default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
        }
      }),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
      </div>
    ),
  }
)

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: parseInt(process.env.REACT_QUERY_STALE_TIME || '60000'),
        refetchInterval: parseInt(process.env.REACT_QUERY_REFETCH_INTERVAL || '60000'),
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (error instanceof Error && error.message.includes('4')) {
            return false
          }
          return failureCount < 3
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
      mutations: {
        retry: 1,
        retryDelay: 1000,
      },
    },
  })

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => createQueryClient())
  const [mounted, setMounted] = useState(false)

  // Auto-reconnect logic for wallet connections
  useAutoReconnect()

  useEffect(() => {
    setMounted(true)
    const isTestnet = getNetworkFromEnv() === 'testnet'
    console.log(
      `[Providers] Environment network: ${isTestnet ? 'testnet' : 'mainnet'}`
    )
    console.log('[Providers] Network-aware wallet configuration')
  }, [])

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
      </div>
    )
  }

  //  Get the correct network based on environment
  const isTestnet = getNetworkFromEnv() === 'testnet'
  const network = isTestnet ? BaseNetwork.TESTNET : BaseNetwork.MAINNET

  console.log(`[Providers] LaserEyes network set to: ${isTestnet ? 'TESTNET' : 'MAINNET'}`)

  return (
    <QueryClientProvider client={queryClient}>
      <LaserEyesProvider config={{ network }}>
        {children}
      </LaserEyesProvider>
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}
