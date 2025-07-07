'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Header } from '@/components/Layout/Header'
import { NetworkBar } from '@/components/Layout/NetworkBar'
import { Footer } from '@/components/Layout/Footer'
import { Viewer } from '@/components/orders/Viewer'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import { Order } from '@/types'

export default function OrderDetailPage() {
  const params = useParams()
  const orderId = params.orderId as string
  const [mounted, setMounted] = useState(false)

  // Ensure client-side rendering for localStorage access
  useEffect(() => {
    setMounted(true)
  }, [])

  // Add this order to tracked orders if not already there
  useEffect(() => {
    if (!mounted || !orderId) return

    try {
      const stored = localStorage.getItem('ordinalsbot_tracked_orders')
      const trackedOrders = stored ? JSON.parse(stored) : []
      
      if (!trackedOrders.includes(orderId)) {
        const newTrackedOrders = [orderId, ...trackedOrders.slice(0, 19)] // Keep max 20
        localStorage.setItem('ordinalsbot_tracked_orders', JSON.stringify(newTrackedOrders))
      }
    } catch (error) {
      console.error('Error updating tracked orders:', error)
    }
  }, [orderId, mounted])

  // Validate order ID format
  const isValidOrderId = (id: string): boolean => {
    // UUID format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(id)
  }

  // Fetch order data from OrdinalsBot API
  const { data: order, isLoading, error, refetch } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      if (!orderId || !isValidOrderId(orderId)) {
        throw new Error('Invalid order ID format')
      }

      const response = await fetch(`/api/order?id=${encodeURIComponent(orderId)}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Order not found')
        }
        throw new Error(`Failed to fetch order: ${response.status}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch order details')
      }

      return result.data as Order
    },
    enabled: mounted && !!orderId,
    staleTime: 30000, // 30 seconds
    retry: (failureCount, error) => {
      // Don't retry for 404 errors
      if (error.message.includes('not found')) {
        return false
      }
      return failureCount < 3
    },
  })

  const handleBack = () => {
    // Try to go back, fallback to orders page
    if (window.history.length > 1) {
      window.history.back()
    } else {
      window.location.href = '/orders'
    }
  }

  // Show loading skeleton during SSR and initial load
  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <NetworkBar />
        
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-10 w-20" />
                <div className="space-y-2">
                  <Skeleton className="h-8 w-64" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
              <Skeleton className="h-10 w-32" />
            </div>

            {/* Content Skeletons */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Skeleton className="h-64" />
                <Skeleton className="h-96" />
              </div>
              <div className="space-y-6">
                <Skeleton className="h-48" />
                <Skeleton className="h-64" />
                <Skeleton className="h-32" />
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    )
  }

  // Validate order ID format
  if (!isValidOrderId(orderId)) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <NetworkBar />
        
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>

            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Invalid order ID format. Please check the URL and try again.
              </AlertDescription>
            </Alert>

            <div className="flex space-x-4">
              <Button onClick={handleBack}>
                Go Back
              </Button>
              <Button variant="outline" asChild>
                <a href="/orders">
                  View All Orders
                </a>
              </Button>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <NetworkBar />
        
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>

            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {error instanceof Error ? error.message : 'Failed to load order details from OrdinalsBot API.'}
              </AlertDescription>
            </Alert>

            <div className="flex space-x-4">
              <Button onClick={() => refetch()}>
                Try Again
              </Button>
              <Button variant="outline" onClick={handleBack}>
                Go Back
              </Button>
              <Button variant="outline" asChild>
                <a href="/orders">
                  View All Orders
                </a>
              </Button>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    )
  }

  // Success state - render order details
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <NetworkBar />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Viewer 
          orderId={orderId} 
          initialOrder={order} 
        />
      </main>

      <Footer />
    </div>
  )
}