'use client'

import { useEffect, useRef } from 'react'
import { useLaserEyes } from '@omnisat/lasereyes-react'

interface AutoReconnectOptions {
  enabled?: boolean
  maxRetries?: number
  retryDelay?: number
}

export function useAutoReconnect(options: AutoReconnectOptions = {}) {
  const {
    enabled = true,
    maxRetries = 3,
    retryDelay = 2000,
  } = options

  const retryCount = useRef(0)
  const reconnectTimer = useRef<NodeJS.Timeout>()
  const laserEyes = useLaserEyes()

  const attemptReconnect = async () => {
    if (!enabled || retryCount.current >= maxRetries) return

    try {
      retryCount.current++
      console.log(`Attempting wallet reconnection (${retryCount.current}/${maxRetries})`)

      // Try to reconnect with the last used wallet type
      const lastWalletType = localStorage.getItem('lastConnectedWallet')
      if (
        lastWalletType &&
        ['xverse', 'unisat'].includes(lastWalletType.toLowerCase())
      ) {
        await laserEyes.connect(
          lastWalletType.toLowerCase() as 'xverse' | 'unisat'
        )
        retryCount.current = 0
        console.log('Wallet reconnected successfully')
      }
    } catch (error) {
      console.error('Auto-reconnect failed:', error)
      if (retryCount.current < maxRetries) {
        reconnectTimer.current = setTimeout(
          attemptReconnect,
          retryDelay * retryCount.current
        )
      } else {
        console.log('Max reconnection attempts reached')
        localStorage.removeItem('lastConnectedWallet')
      }
    }
  }

  // Handles disconnects AND listens for in-wallet address changes
  useEffect(() => {
    if (typeof window === 'undefined') return

    //  Existing disconnect-handling logic 
    if (laserEyes.connected && laserEyes.address) {
      retryCount.current = 0
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current)
        reconnectTimer.current = undefined
      }
    }
    if (!laserEyes.connected && !laserEyes.isConnecting && enabled) {
      const hasLast = localStorage.getItem('lastConnectedWallet')
      if (hasLast && retryCount.current === 0) {
        reconnectTimer.current = setTimeout(attemptReconnect, 1000)
      }
    }

    // Listen for in-wallet address changes 
    const client = (laserEyes as any).client
    let unsubscribeAddressChange: (() => void) | undefined
    if (client?.on) {
      unsubscribeAddressChange = client.on('addressChange', async () => {
        console.log(' Detected wallet address change; reconnecting…')
        try {
          await laserEyes.connect(client.provider)
          retryCount.current = 0
          console.log(
            ' Reconnected to new address:',
            (laserEyes as any).address
          )
        } catch (err) {
          console.error(' Failed to reconnect on addressChange', err)
        }
      })
    }

    // Cleanup for both timer and listener
    return () => {
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current)
        reconnectTimer.current = undefined
      }
      if (unsubscribeAddressChange) {
        unsubscribeAddressChange()
      }
    }
  }, [
    laserEyes.connected,
    laserEyes.isConnecting,
    enabled,
    
  ])

  // Visibility-change effect 
  useEffect(() => {
    if (typeof window === 'undefined') return
    const handleVisibility = () => {
      if (!document.hidden && !laserEyes.connected && enabled) {
        const hasLast = localStorage.getItem('lastConnectedWallet')
        if (hasLast) {
          retryCount.current = 0
          attemptReconnect()
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [laserEyes.connected, enabled])

  // Accounts-changed effect
  useEffect(() => {
    if (typeof window === 'undefined') return
    const handler = () => {
      retryCount.current = 0
    }
    window.unisat?.on?.('accountsChanged', handler)
    return () => {
      window.unisat?.off?.('accountsChanged', handler)
    }
  }, [])

  // Final cleanup on unmount 
  useEffect(() => {
    return () => {
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current)
        reconnectTimer.current = undefined
      }
      retryCount.current = 0
    }
  }, [])

  return {
    isReconnecting: retryCount.current > 0 && retryCount.current <= maxRetries,
    retryCount: retryCount.current,
    maxRetries,
    manualReconnect: attemptReconnect,
  }
}

// Extend global window for typings
declare global {
  interface Window {
    unisat?: {
      on?: (event: string, handler: Function) => void
      off?: (event: string, handler: Function) => void
    }
    xverse?: any
  }
}
