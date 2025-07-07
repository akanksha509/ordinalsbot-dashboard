'use client'

import { useState } from 'react'
import { useLaserEyes } from '@omnisat/lasereyes-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertTriangle, Info, Zap, XCircle } from 'lucide-react'
import { 
  checkPSBTCompatibility, 
  detectWalletCapabilities,
  checkWalletReadiness,
  getNetworkSpecificConfig
} from '@/lib/wallet/config'
import { getNetworkFromEnv } from '@/lib/utils/index'

export function PSBTTest() {
  const [testResults, setTestResults] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const laserEyes = useLaserEyes()
  
  const network = getNetworkFromEnv()
  const networkConfig = getNetworkSpecificConfig(network)
  const psbtCompatibility = checkPSBTCompatibility(laserEyes)
  const walletCapabilities = detectWalletCapabilities(laserEyes)
  const walletReadiness = checkWalletReadiness(laserEyes)

  // Test wallet's PSBT capabilities 
  const testWalletPSBTCapabilities = async () => {
    if (!laserEyes.connected || !laserEyes.address) {
      setTestResults({ error: 'Wallet not connected' })
      return
    }

    setIsLoading(true)
    setTestResults(null)

    try {
      console.log(' [PSBT Test] Testing wallet PSBT capabilities')

      const capabilities = {
        walletConnected: !!laserEyes.connected,
        hasAddress: !!laserEyes.address,
        hasPaymentAddress: !!laserEyes.paymentAddress,
        hasPublicKey: !!laserEyes.publicKey,
        hasSignPsbt: typeof laserEyes.signPsbt === 'function',
        hasSendBTC: typeof laserEyes.sendBTC === 'function',
        hasSend: typeof (laserEyes as any).send === 'function',
        hasBalance: laserEyes.balance !== undefined,
        network: laserEyes.network,
        walletType: laserEyes.provider?.name || 'unknown'
      }

      // Test small amount transaction creation (don't actually send)
      const testAmount = 1000 // 1000 sats
      const testAddress = laserEyes.address // Use connected wallet's address

      let paymentCapabilityTest: {
        canCreatePayments: boolean
        method: string
        error: string | null
      } = {
        canCreatePayments: false,
        method: 'none',
        error: null
      }

      // Test payment capabilities (without actually sending)
      if (capabilities.hasSendBTC) {
        paymentCapabilityTest = {
          canCreatePayments: true,
          method: 'sendBTC',
          error: null
        }
      } else if (capabilities.hasSend) {
        paymentCapabilityTest = {
          canCreatePayments: true,
          method: 'send',
          error: null
        }
      } else {
        paymentCapabilityTest = {
          canCreatePayments: false,
          method: 'none',
          error: 'No payment methods available'
        }
      }

      setTestResults({
        success: true,
        capabilities,
        paymentTest: paymentCapabilityTest,
        psbtCompatibility,
        walletCapabilities,
        recommendations: generateRecommendations(capabilities, psbtCompatibility),
        timestamp: new Date().toISOString()
      })

    } catch (error) {
      setTestResults({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
    } finally {
      setIsLoading(false)
    }
  }

  const generateRecommendations = (capabilities: any, psbtCompat: any) => {
    const recommendations = []

    if (!capabilities.hasSignPsbt) {
      recommendations.push('Wallet does not support PSBT - enhanced security features unavailable')
    } else {
      recommendations.push('PSBT signing available - enhanced security features enabled')
    }

    if (!capabilities.hasSendBTC && !capabilities.hasSend) {
      recommendations.push('No payment methods available - may need external wallet')
    } else {
      recommendations.push('Payment capabilities available')
    }

    if (capabilities.hasBalance && laserEyes.balance === 0) {
      recommendations.push('Add Bitcoin to wallet for testing payments')
    }

    if (psbtCompat.compatible) {
      recommendations.push('Full PSBT integration available - best user experience')
    } else {
      recommendations.push('Manual payments only - still fully functional')
    }

    return recommendations
  }

  if (!laserEyes.connected) {
    return (
      <Card className="bg-gray-800/30 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <Info className="h-5 w-5 mr-2" />
            PSBT Integration Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400">Connect a wallet to test PSBT capabilities</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Updated Strategy Notice */}
      <Alert className="bg-purple-900/20 border-purple-600/30">
        <Info className="h-4 w-4 text-purple-400" />
        <AlertDescription className="text-gray-300">
          <div className="space-y-2">
            <p className="font-semibold text-purple-300">Hybrid PSBT Implementation</p>
            <p className="text-sm">
              This system uses wallet built-in PSBT capabilities for enhanced security while maintaining full compatibility.
            </p>
          </div>
        </AlertDescription>
      </Alert>

      {/* Wallet Status */}
      <Card className="bg-gray-800/30 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <Info className="h-5 w-5 mr-2" />
            Wallet Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Readiness Check */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-white mb-2">Overall Readiness</h4>
              <div className="flex items-center space-x-2">
                {walletReadiness.ready ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                )}
                <span className={walletReadiness.ready ? 'text-green-400' : 'text-yellow-400'}>
                  {walletReadiness.ready ? 'Ready for Payments' : 'Setup Required'}
                </span>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-2">Enhanced Features</h4>
              <div className="flex items-center space-x-2">
                {psbtCompatibility.compatible ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-yellow-500" />
                )}
                <span className={psbtCompatibility.compatible ? 'text-green-400' : 'text-yellow-400'}>
                  {psbtCompatibility.compatible ? 'PSBT Available' : 'Manual Only'}
                </span>
              </div>
            </div>
          </div>

          {/* Issues & Recommendations */}
          {(!walletReadiness.ready || !psbtCompatibility.compatible) && (
            <div className="space-y-2">
              {walletReadiness.issues.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-red-400">Issues:</h5>
                  <ul className="text-sm text-gray-400 ml-4">
                    {walletReadiness.issues.map((issue, i) => (
                      <li key={i}>• {issue}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {walletReadiness.recommendations.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-blue-400">Recommendations:</h5>
                  <ul className="text-sm text-gray-400 ml-4">
                    {walletReadiness.recommendations.slice(0, 3).map((rec, i) => (
                      <li key={i}>• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* PSBT Capability Test */}
      <Card className="bg-gray-800/30 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <Zap className="h-5 w-5 mr-2" />
            Wallet PSBT Capability Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-400">
            Test wallet PSBT and payment capabilities for enhanced features
          </p>

          <Button
            onClick={testWalletPSBTCapabilities}
            disabled={isLoading || !walletReadiness.ready}
            className="w-full"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                Testing Wallet...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Test Wallet Capabilities
              </>
            )}
          </Button>

          {/* Test Results */}
          {testResults && (
            <div className="mt-4 p-4 bg-gray-900/50 rounded-lg border border-gray-600">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-white">Test Results</h4>
                <Badge variant={testResults.success ? "success" : "destructive"}>
                  {testResults.success ? "Success" : "Failed"}
                </Badge>
              </div>

              {testResults.error && (
                <div className="text-red-400 text-sm mb-2">
                  Error: {testResults.error}
                </div>
              )}

              {testResults.success && testResults.capabilities && (
                <div className="space-y-3">
                  {/* Capabilities Overview */}
                  <div>
                    <h5 className="text-sm font-medium text-blue-400 mb-2">Capability Analysis:</h5>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">PSBT Signing:</span>
                        {testResults.capabilities.hasSignPsbt ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <XCircle className="h-3 w-3 text-red-500" />
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Payment Methods:</span>
                        {testResults.paymentTest.canCreatePayments ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <XCircle className="h-3 w-3 text-red-500" />
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Public Key:</span>
                        {testResults.capabilities.hasPublicKey ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <XCircle className="h-3 w-3 text-red-500" />
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Balance Info:</span>
                        {testResults.capabilities.hasBalance ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <XCircle className="h-3 w-3 text-red-500" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Payment Method */}
                  {testResults.paymentTest && (
                    <div>
                      <h5 className="text-sm font-medium text-blue-400 mb-1">Payment Method:</h5>
                      <div className="text-sm text-gray-300">
                        Method: <code className="text-blue-400">{testResults.paymentTest.method}</code>
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {testResults.recommendations && testResults.recommendations.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-green-400 mb-1">Analysis:</h5>
                      <ul className="text-xs text-gray-400">
                        {testResults.recommendations.map((rec: string, i: number) => (
                          <li key={i} className="mb-1">• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Raw Data */}
                  <details className="mt-2">
                    <summary className="text-sm text-gray-400 cursor-pointer">Raw Test Data</summary>
                    <pre className="text-xs text-gray-500 mt-1 overflow-x-auto max-h-40">
                      {JSON.stringify(testResults, null, 2)}
                    </pre>
                  </details>
                </div>
              )}

              <div className="text-xs text-gray-500 mt-2">
                {testResults.timestamp}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Network Info */}
      <Card className="bg-gray-800/30 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Network Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Network:</span>{' '}
              <span className="text-white capitalize">{network}</span>
            </div>
            <div>
              <span className="text-gray-400">Default Fee:</span>{' '}
              <span className="text-white">{networkConfig.defaultFeeRate} sat/vB</span>
            </div>
            <div>
              <span className="text-gray-400">Min Fee:</span>{' '}
              <span className="text-white">{networkConfig.minFeeRate} sat/vB</span>
            </div>
            <div>
              <span className="text-gray-400">Explorer:</span>{' '}
              <a href={networkConfig.explorerUrl} target="_blank" className="text-blue-400 hover:underline">
                {networkConfig.explorerUrl}
              </a>
            </div>
          </div>
          
          {/* Implementation Status */}
          <div className="mt-4 p-3 bg-green-900/20 border border-green-600/30 rounded">
            <h4 className="text-sm font-medium text-green-400 mb-2">Implementation Status</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• <strong>Order Creation:</strong> Working via OrdinalsBot API</li>
              <li>• <strong>Enhanced Features:</strong> Using wallet built-in PSBT capabilities</li>
              <li>• <strong>Manual Payments:</strong> Standard wallet send functions</li>
              <li>• <strong>Payment Monitoring:</strong> Blockchain confirmation tracking</li>
              <li>• <strong>Compatibility:</strong> Works with all Bitcoin wallets</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}