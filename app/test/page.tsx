'use client'

import Link from 'next/link'
import { ArrowLeft, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PSBTTest } from '@/components/PSBTTest'

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white flex items-center">
              <Zap className="h-8 w-8 mr-3 text-purple-500" />
              PSBT Integration Test
            </h1>
            <p className="text-gray-400">
              Test PSBT endpoint connectivity and wallet compatibility
            </p>
          </div>
                   
          <Link href="/">
            <Button variant="outline" className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Test Component */}
        <PSBTTest />
      </div>
    </div>
  )
}