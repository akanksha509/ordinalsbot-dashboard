'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { UploadField } from '../UploadField'
import { useToast } from '@/hooks/use-toast'
import { 
  ImageIcon, 
  FileText, 
  Upload, 
  Coins,
  AlertCircle,
  Info,
  Lightbulb,
  Copy
} from 'lucide-react'
import { WizardData } from '../Wizard'

interface DetailsFormProps {
  data: WizardData
  onUpdate: (data: Partial<WizardData>) => void
  onNext: () => void
  onPrev: () => void
}

export function DetailsForm({ data, onUpdate, onNext, onPrev }: DetailsFormProps) {
  const { toast } = useToast()
  
  const [formData, setFormData] = useState({
    title: data.title || '',
    description: data.description || '',
    textContent: data.textContent || '',
    ticker: data.brc20Details?.ticker || '',
    amount: data.brc20Details?.amount || '',
    maxSupply: data.brc20Details?.maxSupply || '',
    mintLimit: data.brc20Details?.mintLimit || '',
    decimals: data.brc20Details?.decimals?.toString() || '18',
    toAddress: data.brc20Details?.to || ''
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})

  // HELPFUL EXAMPLES for BRC-20 Deploy
  const brc20Examples = {
    popular: [
      { 
        ticker: 'ORDI', 
        maxSupply: '21000000', 
        mintLimit: '1000', 
        decimals: 18, 
        description: 'Like the original ORDI token' 
      },
      { 
        ticker: 'SATS', 
        maxSupply: '2100000000000000', 
        mintLimit: '100000000', 
        decimals: 8, 
        description: 'Bitcoin-style supply (21M × 100M sats)' 
      },
      { 
        ticker: 'MEME', 
        maxSupply: '1000000000', 
        mintLimit: '10000', 
        decimals: 18, 
        description: 'Meme coin style - 1 billion supply' 
      },
      { 
        ticker: 'TEST', 
        maxSupply: '1000000', 
        mintLimit: '1000', 
        decimals: 18, 
        description: 'Perfect for testing - small supply' 
      }
    ]
  }

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Validate based on contentType
    if (data.contentType === 'files' && !data.files?.length) {
      newErrors.content = 'Please upload at least one file'
    }

    if (data.contentType === 'text' && !formData.textContent.trim()) {
      newErrors.content = 'Please enter text content'
    }

    // BRC-20 validation with better messages
    if (data.type?.startsWith('brc20')) {
      if (!formData.ticker.trim()) {
        newErrors.ticker = 'Ticker is required (1-4 characters)'
      } else if (formData.ticker.length > 4) {
        newErrors.ticker = 'Ticker must be 4 characters or less'
      }

      if (data.brc20Operation === 'deploy') {
        if (!formData.maxSupply.trim()) {
          newErrors.maxSupply = 'Max supply is required'
        } else if (isNaN(Number(formData.maxSupply)) || Number(formData.maxSupply) <= 0) {
          newErrors.maxSupply = 'Max supply must be a positive number'
        }

        if (!formData.mintLimit.trim()) {
          newErrors.mintLimit = 'Mint limit is required'
        } else if (Number(formData.mintLimit) > Number(formData.maxSupply)) {
          newErrors.mintLimit = 'Mint limit cannot exceed max supply'
        }
      }

      if ((data.brc20Operation === 'mint' || data.brc20Operation === 'transfer') && !formData.amount.trim()) {
        newErrors.amount = 'Amount is required'
      }

      if (data.brc20Operation === 'transfer' && !formData.toAddress.trim()) {
        newErrors.toAddress = 'Recipient address is required'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateForm()) {
      const updates: Partial<WizardData> = {
        title: formData.title || undefined,
        description: formData.description || undefined,
        textContent: formData.textContent || undefined
      }

      if (data.type?.startsWith('brc20')) {
        updates.brc20Details = {
          ticker: formData.ticker,
          operation: data.brc20Operation!,
          amount: formData.amount || undefined,
          maxSupply: formData.maxSupply || undefined,
          mintLimit: formData.mintLimit || undefined,
          decimals: formData.decimals ? Number(formData.decimals) : undefined,
          to: formData.toAddress || undefined
        }
      }

      onUpdate(updates)
      onNext()
    }
  }

  // Use example function
  const useExample = (example: typeof brc20Examples.popular[0]) => {
    setFormData(prev => ({
      ...prev,
      ticker: example.ticker,
      maxSupply: example.maxSupply,
      mintLimit: example.mintLimit,
      decimals: example.decimals.toString()
    }))
    setErrors({})
    toast({ 
      title: `✨ Used ${example.ticker} example!`, 
      description: example.description 
    })
  }

  const getTypeDisplay = () => {
    switch (data.type) {
      case 'inscription': 
        return data.contentType === 'files' ? 'File Upload' : 'Text Content'
      case 'brc20-deploy': return 'BRC-20 Deploy'
      case 'brc20-mint': return 'BRC-20 Mint'
      case 'brc20-transfer': return 'BRC-20 Transfer'
      default: return data.type
    }
  }

  // Dynamic icon based on content type
  const getTypeIcon = () => {
    if (data.type?.startsWith('brc20')) return Coins
    if (data.contentType === 'files') return data.files?.some(f => f.type.startsWith('image/')) ? ImageIcon : Upload
    if (data.contentType === 'text') return FileText
    return Upload
  }

  const TypeIcon = getTypeIcon()

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <TypeIcon className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-2 text-gray-100">Configure Your {getTypeDisplay()}</h2>
        <p className="text-gray-400">
          {data.type?.startsWith('brc20') 
            ? 'Enter the token details for your BRC-20 operation'
            : data.contentType === 'files' 
              ? 'Upload your files for inscription'
              : 'Enter your text content for inscription'
          }
        </p>
        <Badge variant="outline" className="mt-2">
          {getTypeDisplay()}
        </Badge>
      </div>

      {/* File Upload Section */}
      {data.contentType === 'files' && (
        <Card className="bg-gray-800/50 border-gray-600">
          <CardHeader>
            <CardTitle className="text-gray-100">File Upload</CardTitle>
            <CardDescription className="text-gray-400">
              Upload images, documents, or media files for your inscription
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UploadField
              files={data.files || []}
              onFilesChange={(files) => onUpdate({ files })}
              maxFiles={5}
              maxSize={50 * 1024 * 1024}
            />
            {errors.content && (
              <p className="text-sm text-red-500 mt-2">{errors.content}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Text Content Section */}
      {data.contentType === 'text' && (
        <Card className="bg-gray-800/50 border-gray-600">
          <CardHeader>
            <CardTitle className="text-gray-100">Text Content</CardTitle>
            <CardDescription className="text-gray-400">
              Enter plain text, JSON, code, or any text-based content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="textContent" className="text-gray-300">Content *</Label>
              <Textarea
                id="textContent"
                placeholder="Enter your text content here..."
                value={formData.textContent}
                onChange={(e) => updateFormData('textContent', e.target.value)}
                rows={12}
                className={`bg-gray-800 border-gray-600 text-gray-100 ${errors.content ? 'border-red-500' : ''}`}
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>Plain text, JSON, Markdown, or code</span>
                <span>{formData.textContent.length} characters</span>
              </div>
              {errors.content && (
                <p className="text-sm text-red-500">{errors.content}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* BRC-20 Configuration with Examples */}
      {data.type?.startsWith('brc20') && (
        <>
          {/* Quick Examples Section */}
          {data.brc20Operation === 'deploy' && (
            <Card className="bg-gray-800/50 border-gray-600">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-100">
                  <Lightbulb className="h-5 w-5 mr-2 text-yellow-400" />
                  Quick Start Examples
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Choose a popular template to get started
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {brc20Examples.popular.map((example, index) => (
                    <div 
                      key={index}
                      className="p-3 bg-gray-900/70 border border-gray-500 rounded-lg cursor-pointer hover:bg-gray-700/70 transition-colors"
                      onClick={() => useExample(example)}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-mono font-bold text-orange-400">{example.ticker}</span>
                        <Copy className="h-4 w-4 text-gray-300" />
                      </div>
                      <div className="text-xs text-gray-300 space-y-1">
                        <div>Max: {Number(example.maxSupply).toLocaleString()}</div>
                        <div>Limit: {Number(example.mintLimit).toLocaleString()}</div>
                        <div className="text-gray-400">{example.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main BRC-20 Form */}
          <Card className="bg-gray-800/50 border-gray-600">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-100">
                <Coins className="h-5 w-5 mr-2 text-orange-500" />
                BRC-20 Token Details
              </CardTitle>
              <CardDescription className="text-gray-400">
                Configure your {data.brc20Operation} operation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Ticker */}
              <div className="space-y-2">
                <Label htmlFor="ticker" className="text-gray-300">Token Ticker *</Label>
                <Input
                  id="ticker"
                  placeholder="e.g., ORDI"
                  value={formData.ticker}
                  onChange={(e) => updateFormData('ticker', e.target.value.toUpperCase())}
                  maxLength={4}
                  className={`bg-gray-800 border-gray-600 text-gray-100 ${errors.ticker ? 'border-red-500' : ''}`}
                />
                {errors.ticker && (
                  <p className="text-sm text-red-500">{errors.ticker}</p>
                )}
                <p className="text-xs text-gray-500">1-4 characters, letters and numbers only</p>
              </div>

              {/* Deploy-specific fields */}
              {data.brc20Operation === 'deploy' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="maxSupply" className="text-gray-300">Max Supply *</Label>
                    <Input
                      id="maxSupply"
                      type="number"
                      placeholder="e.g., 21000000"
                      value={formData.maxSupply}
                      onChange={(e) => updateFormData('maxSupply', e.target.value)}
                      className={`bg-gray-800 border-gray-600 text-gray-100 ${errors.maxSupply ? 'border-red-500' : ''}`}
                    />
                    {errors.maxSupply && (
                      <p className="text-sm text-red-500">{errors.maxSupply}</p>
                    )}
                    <p className="text-xs text-gray-500">Total tokens that can ever exist</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mintLimit" className="text-gray-300">Mint Limit *</Label>
                    <Input
                      id="mintLimit"
                      type="number"
                      placeholder="e.g., 1000"
                      value={formData.mintLimit}
                      onChange={(e) => updateFormData('mintLimit', e.target.value)}
                      className={`bg-gray-800 border-gray-600 text-gray-100 ${errors.mintLimit ? 'border-red-500' : ''}`}
                    />
                    {errors.mintLimit && (
                      <p className="text-sm text-red-500">{errors.mintLimit}</p>
                    )}
                    <p className="text-xs text-gray-500">Max tokens per mint transaction</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="decimals" className="text-gray-300">Decimals</Label>
                    <Input
                      id="decimals"
                      type="number"
                      placeholder="18"
                      value={formData.decimals}
                      onChange={(e) => updateFormData('decimals', e.target.value)}
                      min="0"
                      max="18"
                      className="bg-gray-800 border-gray-600 text-gray-100"
                    />
                    <p className="text-xs text-gray-500">Token precision (0-18, default: 18)</p>
                  </div>
                </>
              )}

              {/* Mint/Transfer amount */}
              {(data.brc20Operation === 'mint' || data.brc20Operation === 'transfer') && (
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-gray-300">Amount *</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="e.g., 1000"
                    value={formData.amount}
                    onChange={(e) => updateFormData('amount', e.target.value)}
                    className={`bg-gray-800 border-gray-600 text-gray-100 ${errors.amount ? 'border-red-500' : ''}`}
                  />
                  {errors.amount && (
                    <p className="text-sm text-red-500">{errors.amount}</p>
                  )}
                </div>
              )}

              {/* Transfer recipient */}
              {data.brc20Operation === 'transfer' && (
                <div className="space-y-2">
                  <Label htmlFor="toAddress" className="text-gray-300">Recipient Address *</Label>
                  <Input
                    id="toAddress"
                    placeholder="Bitcoin address"
                    value={formData.toAddress}
                    onChange={(e) => updateFormData('toAddress', e.target.value)}
                    className={`bg-gray-800 border-gray-600 text-gray-100 ${errors.toAddress ? 'border-red-500' : ''}`}
                  />
                  {errors.toAddress && (
                    <p className="text-sm text-red-500">{errors.toAddress}</p>
                  )}
                </div>
              )}

            </CardContent>
          </Card>

          {/* BRC-20 JSON Preview */}
          {data.brc20Operation === 'deploy' && formData.ticker && (
            <Card className="bg-gray-900/50 border-gray-500">
              <CardHeader>
                <CardTitle className="text-gray-100 flex items-center">
                  <Info className="h-5 w-5 mr-2 text-blue-400" />
                  BRC-20 JSON Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-black/50 p-4 rounded border border-gray-600 text-gray-200 text-sm overflow-x-auto">
{JSON.stringify({
  p: "brc-20",
  op: "deploy",
  tick: formData.ticker || "TICK",
  max: formData.maxSupply || "21000000",
  lim: formData.mintLimit || "1000",
  ...(formData.decimals !== '18' && formData.decimals && { dec: formData.decimals })
}, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Metadata Section (ONLY for inscriptions, not BRC-20) */}
      {data.type === 'inscription' && (
        <Card className="bg-gray-800/50 border-gray-600">
          <CardHeader>
            <CardTitle className="text-gray-100">Metadata (Optional)</CardTitle>
            <CardDescription className="text-gray-400">
              Add title and description to your inscription
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-gray-300">Title</Label>
              <Input
                id="title"
                placeholder="Give your inscription a title"
                value={formData.title}
                onChange={(e) => updateFormData('title', e.target.value)}
                className="bg-gray-800 border-gray-600 text-gray-100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-gray-300">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your inscription..."
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                rows={3}
                className="bg-gray-800 border-gray-600 text-gray-100"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {Object.keys(errors).length > 0 && (
        <Alert variant="destructive" className="bg-red-900/20 border-red-600/50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-gray-200">
            Please fix the errors above to continue.
          </AlertDescription>
        </Alert>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onPrev} className="bg-gray-800 border-gray-600 text-gray-100 hover:bg-gray-700">
          Back
        </Button>
        <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 text-white">
          Continue to Review
        </Button>
      </div>
    </div>
  )
}