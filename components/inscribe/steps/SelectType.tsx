'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { 
  FileText, 
  Upload, 
  Coins,
  Info,
  ArrowRight
} from 'lucide-react'
import { WizardData } from '../Wizard'
import { OrderType } from '@/types'

interface SelectTypeProps {
  data: WizardData
  onUpdate: (data: Partial<WizardData>) => void
  onNext: () => void
}

const INSCRIPTION_TYPES = [
  {
    id: 'files' as string, // Internal ID for selection
    orderType: 'inscription' as OrderType, // API type
    title: 'Files & Images',
    description: 'Upload images, documents, or any file type',
    icon: Upload,
    details: [
      'Images: PNG, JPG, SVG, GIF, WebP',
      'Documents: PDF, TXT, JSON, HTML',
      'Media: Audio, Video files',
      'Any file format supported'
    ],
    examples: 'Profile pictures, documents, media files',
    maxSize: '50 MB',
    color: 'bg-blue-950/50 border-blue-800/50'
  },
  {
    id: 'text' as string, // Internal ID for selection
    orderType: 'inscription' as OrderType, // API type
    title: 'Text Content',
    description: 'Inscribe plain text, JSON, or formatted content',
    icon: FileText,
    details: [
      'Plain text messages',
      'JSON data structures',
      'Markdown & HTML content',
      'Code snippets'
    ],
    examples: 'Messages, poems, source code, metadata',
    maxSize: '100 KB',
    color: 'bg-green-950/50 border-green-800/50'
  },
  {
    id: 'brc20' as string, // Internal ID for selection
    orderType: 'brc20-mint' as OrderType, // API type (will be updated based on operation)
    title: 'BRC-20 Token',
    description: 'Create, mint, or transfer Bitcoin-based tokens',
    icon: Coins,
    details: [
      'Deploy new token standards',
      'Mint existing tokens',
      'Transfer tokens between addresses',
      'Fully compatible with Bitcoin wallets'
    ],
    examples: 'Create tokens, mint supplies, token transfers',
    maxSize: '1 KB',
    color: 'bg-orange-950/50 border-orange-800/50'
  }
]

const BRC20_OPERATIONS = [
  {
    id: 'deploy',
    title: 'Deploy Token',
    description: 'Create a new BRC-20 token with custom parameters',
    fields: ['Ticker', 'Max Supply', 'Mint Limit', 'Decimals']
  },
  {
    id: 'mint',
    title: 'Mint Tokens',
    description: 'Mint existing BRC-20 tokens to your address',
    fields: ['Ticker', 'Amount']
  },
  {
    id: 'transfer',
    title: 'Transfer Tokens',
    description: 'Transfer BRC-20 tokens to another address',
    fields: ['Ticker', 'Amount', 'Recipient Address']
  }
]

export default function SelectType({ data, onUpdate, onNext }: SelectTypeProps) {
  //  Use internal IDs for selection
  const [selectedType, setSelectedType] = useState<string>(() => {
    // Determine initial selection based on wizard data
    if (data.type?.startsWith('brc20')) return 'brc20'
    if (data.textContent) return 'text'
    if (data.files?.length) return 'files'
    return ''
  })
  
  const [selectedOperation, setSelectedOperation] = useState<string>(
    data.brc20Operation || ''
  )
  const [showBRC20Details, setShowBRC20Details] = useState(selectedType === 'brc20')

  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId)
    
    if (typeId === 'brc20') {
      setShowBRC20Details(true)
      onUpdate({ 
        type: 'brc20-mint' as OrderType,
        files: undefined,
        textContent: undefined
      })
    } else {
      setShowBRC20Details(false)
      setSelectedOperation('')
      
      onUpdate({ 
        type: 'inscription' as OrderType,
        brc20Operation: undefined,
        brc20Details: undefined,
        contentType: typeId as 'files' | 'text'
      })
    }
  }

  const handleOperationSelect = (operation: string) => {
    setSelectedOperation(operation)
    const orderType = `brc20-${operation}` as OrderType
    onUpdate({ 
      type: orderType,
      brc20Operation: operation as 'deploy' | 'mint' | 'transfer'
    })
  }

  const handleNext = () => {
    if (selectedType && (!showBRC20Details || selectedOperation)) {
      onNext()
    }
  }

  const canProceed = selectedType && (!showBRC20Details || selectedOperation)

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2 text-foreground">Choose Inscription Type</h2>
        <p className="text-muted-foreground">
          Select what type of content you want to inscribe on Bitcoin
        </p>
      </div>

      {/* Type Selection - 3 OPTIONS ONLY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {INSCRIPTION_TYPES.map((type) => {
          const Icon = type.icon
          const isSelected = selectedType === type.id
          
          return (
            <Card 
              key={type.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-md border-border bg-card ${
                isSelected 
                  ? `ring-2 ring-primary ${type.color}` 
                  : 'hover:border-primary/50'
              }`}
              onClick={() => handleTypeSelect(type.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-foreground">{type.title}</CardTitle>
                      <Badge variant="outline" className="text-xs mt-1 border-border">
                        Max {type.maxSize}
                      </Badge>
                    </div>
                  </div>
                  
                  {isSelected && (
                    <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-primary-foreground rounded-full" />
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <CardDescription className="mb-3">
                  {type.description}
                </CardDescription>

                <div className="space-y-2 text-sm">
                  <p className="font-medium text-foreground">Features:</p>
                  <ul className="text-muted-foreground space-y-1">
                    {type.details.map((detail, index) => (
                      <li key={index} className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 mr-2 flex-shrink-0" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                  
                  <div className="pt-2 border-t border-border/50">
                    <p className="text-xs text-muted-foreground">
                      <strong>Examples:</strong> {type.examples}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* BRC-20 Operation Selection */}
      {showBRC20Details && (
        <Card className="mt-6 bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center text-foreground">
              <Coins className="h-5 w-5 mr-2" />
              Select BRC-20 Operation
            </CardTitle>
            <CardDescription>
              Choose what you want to do with BRC-20 tokens
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup 
              value={selectedOperation} 
              onValueChange={handleOperationSelect}
              className="space-y-4"
            >
              {BRC20_OPERATIONS.map((operation) => (
                <div key={operation.id} className="flex items-start space-x-3">
                  <RadioGroupItem 
                    value={operation.id} 
                    id={operation.id}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label 
                      htmlFor={operation.id}
                      className="font-medium cursor-pointer text-foreground"
                    >
                      {operation.title}
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {operation.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {operation.fields.map((field) => (
                        <Badge key={field} variant="secondary" className="text-xs">
                          {field}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>
      )}

      {/* Information Card - Dark Mode */}
      <Card className="bg-blue-950/30 border-blue-800/50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-blue-300 mb-1">
                About Bitcoin Inscriptions
              </p>
              <p className="text-blue-200">
                Inscriptions are permanent data stored directly on the Bitcoin blockchain. 
                Once inscribed, your content becomes immutable and decentralized, 
                owned by your Bitcoin address forever.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Button */}
      <div className="flex justify-center pt-6">
        <Button 
          size="lg"
          onClick={handleNext}
          disabled={!canProceed}
          className="px-8"
        >
          Continue
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}