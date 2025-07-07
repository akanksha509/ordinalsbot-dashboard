'use client'

import { useState } from 'react'
import { Header } from '@/components/Layout/Header'
import { NetworkBar } from '@/components/Layout/NetworkBar'
import { Footer } from '@/components/Layout/Footer'
import { Wizard } from '@/components/inscribe/Wizard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Upload, 
  FileText, 
  ArrowRight, 
  Info,
  CheckCircle,
  Clock,
  Shield,
  Coins
} from 'lucide-react'

const PROCESS_STEPS = [
  {
    title: 'Choose Type',
    description: 'Select inscription type and upload content',
    icon: Upload
  },
  {
    title: 'Add Details',
    description: 'Configure metadata and options',
    icon: FileText
  },
  {
    title: 'Review & Pay',
    description: 'Confirm order and make payment',
    icon: CheckCircle
  },
  {
    title: 'Track Progress',
    description: 'Monitor inscription status in real-time',
    icon: Clock
  }
]

export default function InscribePage() {
  const [showWizard, setShowWizard] = useState(false)

  if (showWizard) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <NetworkBar />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Wizard 
            onExit={() => setShowWizard(false)}
          />
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <NetworkBar />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Create Bitcoin Inscriptions</h1>
          <p className="text-xl text-muted-foreground mb-6 max-w-2xl mx-auto">
            Permanently inscribe images, text, files, and BRC-20 tokens directly onto the Bitcoin blockchain
          </p>
          <Button 
            size="lg" 
            onClick={() => setShowWizard(true)}
            className="text-lg px-8 py-3"
          >
            Start Creating
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center">
            <CardContent className="p-6">
              <Shield className="h-12 w-12 mx-auto mb-4 text-green-600" />
              <h3 className="font-semibold mb-2">Permanent Storage</h3>
              <p className="text-sm text-muted-foreground">
                Data stored forever on Bitcoin blockchain
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="p-6">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-blue-600" />
              <h3 className="font-semibold mb-2">Immutable</h3>
              <p className="text-sm text-muted-foreground">
                Cannot be changed or deleted once inscribed
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="p-6">
              <Coins className="h-12 w-12 mx-auto mb-4 text-orange-600" />
              <h3 className="font-semibold mb-2">True Ownership</h3>
              <p className="text-sm text-muted-foreground">
                Own your digital assets with Bitcoin's security
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Process Overview */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-center">How It Works</CardTitle>
            <CardDescription className="text-center">
              Simple 4-step process to create your inscription
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {PROCESS_STEPS.map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={index} className="text-center">
                    <div className="relative">
                      <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-3">
                        <Icon className="h-6 w-6" />
                      </div>
                      {index < PROCESS_STEPS.length - 1 && (
                        <div className="hidden md:block absolute top-6 left-[calc(50%+24px)] w-[calc(100vw/4-48px)] h-0.5 bg-muted-foreground/20" />
                      )}
                    </div>
                    <h4 className="font-medium mb-1">{step.title}</h4>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="h-5 w-5 mr-2" />
                Pricing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• <strong>Network Fee:</strong> Bitcoin transaction fee (varies by network congestion)</li>
                <li>• <strong>Service Fee:</strong> Platform fee for inscription processing</li>
                <li>• <strong>Final Cost:</strong> Calculated during checkout based on file size and fee rate</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• <strong>Payment:</strong> Instant wallet confirmation</li>
                <li>• <strong>Processing:</strong> 10-60 minutes depending on network</li>
                <li>• <strong>Confirmation:</strong> 1 Bitcoin block confirmation</li>
                <li>• <strong>Completion:</strong> Inscription appears in your wallet</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}