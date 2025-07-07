'use client'

import { useCallback, useState, useRef } from 'react'
import { Upload, X, Image, File, AlertCircle, CheckCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { cn, FormattingUtils, getErrorMessage } from '@/lib/utils/index'

interface FileData {
  name: string
  type: string
  size: number
  content: string 
  preview?: string
}

interface UploadFieldProps {
  files: FileData[]
  onFilesChange: (files: FileData[]) => void
  acceptedTypes?: string[]
  maxSize?: number // in bytes
  maxFiles?: number
  showPreview?: boolean
  className?: string
}

const DEFAULT_ACCEPTED_TYPES = [
  'image/png',
  'image/jpeg', 
  'image/jpg',
  'image/gif',
  'image/svg+xml',
  'image/webp',
  'text/plain',
  'application/json',
  'application/pdf',
  'audio/*',
  'video/*'
]

const DEFAULT_MAX_SIZE = 50 * 1024 * 1024 // 50MB

export function UploadField({
  files,
  onFilesChange,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  maxSize = DEFAULT_MAX_SIZE,
  maxFiles = 1,
  showPreview = true,
  className
}: UploadFieldProps) {
  const [isDragActive, setIsDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSize) {
      return `File size (${formatFileSize(file.size)}) exceeds limit of ${formatFileSize(maxSize)}`
    }

    // Check file type
    const isAccepted = acceptedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.slice(0, -1))
      }
      return file.type === type
    })

    if (!isAccepted) {
      return `File type "${file.type}" is not supported. Accepted types: ${acceptedTypes.join(', ')}`
    }

    return null
  }

  const generatePreview = (file: File, dataUrl: string): string | undefined => {
    if (file.type.startsWith('image/')) {
      return dataUrl
    }
    
    if (file.type === 'text/plain') {
      // For text files, return first 200 characters using utility function
      try {
        const content = atob(dataUrl.split(',')[1])
        return FormattingUtils.truncateText(content, 200)
      } catch {
        return undefined
      }
    }

    return undefined
  }

  const processFile = async (file: File): Promise<FileData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = () => {
        const result = reader.result as string
        const preview = generatePreview(file, result)
        
        resolve({
          name: file.name,
          type: file.type,
          size: file.size,
          content: result,
          preview
        })
      }
      
      reader.onerror = () => {
        reject(new Error(`Failed to read file: ${file.name}`))
      }
      
      reader.readAsDataURL(file)
    })
  }

  const handleFiles = useCallback(async (fileList: FileList) => {
    setError(null)
    setIsProcessing(true)

    try {
      const fileArray = Array.from(fileList)
      
      // Check max files limit
      if (files.length + fileArray.length > maxFiles) {
        throw new Error(`Cannot upload more than ${maxFiles} file(s)`)
      }

      // Validate all files first
      for (const file of fileArray) {
        const validationError = validateFile(file)
        if (validationError) {
          throw new Error(validationError)
        }
      }

      // Process all files
      const processedFiles: FileData[] = []
      for (const file of fileArray) {
        const fileData = await processFile(file)
        processedFiles.push(fileData)
      }

      // Update files
      onFilesChange([...files, ...processedFiles])
    } catch (err) {
      setError(getErrorMessage(err) || 'Failed to process files')
    } finally {
      setIsProcessing(false)
    }
  }, [files, onFilesChange, maxFiles, maxSize, acceptedTypes])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }, [handleFiles])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(false)
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
    // Reset input value to allow selecting the same file again
    e.target.value = ''
  }, [handleFiles])

  const removeFile = useCallback((index: number) => {
    const newFiles = files.filter((_, i) => i !== index)
    onFilesChange(newFiles)
  }, [files, onFilesChange])

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image
    return File
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <Card
        className={cn(
          "border-2 border-dashed transition-colors cursor-pointer",
          isDragActive 
            ? "border-primary bg-primary/5" 
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
          isProcessing && "opacity-50 cursor-not-allowed"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={!isProcessing ? openFileDialog : undefined}
      >
        <CardContent className="p-8 text-center">
          <Upload className={cn(
            "mx-auto h-12 w-12 mb-4",
            isDragActive ? "text-primary" : "text-muted-foreground"
          )} />
          
          <div className="mb-4">
            <p className="text-lg font-medium mb-2">
              {isDragActive ? "Drop files here" : "Upload Files"}
            </p>
            <p className="text-sm text-muted-foreground">
              Drag and drop files here, or click to browse
            </p>
          </div>

          <div className="space-y-2 text-xs text-muted-foreground">
            <p>Max file size: {formatFileSize(maxSize)}</p>
            <p>Max files: {maxFiles}</p>
            <p>Accepted: Images, Text, PDF, Audio, Video</p>
          </div>

          {isProcessing && (
            <div className="mt-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Processing files...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={maxFiles > 1}
        accept={acceptedTypes.join(',')}
        onChange={handleFileInput}
        className="hidden"
      />

      {/* Error display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium">Uploaded Files ({files.length})</h4>
          
          {files.map((file, index) => {
            const FileIcon = getFileIcon(file.type)
            
            return (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    {/* File icon or image preview */}
                    <div className="flex-shrink-0">
                      {showPreview && file.preview && file.type.startsWith('image/') ? (
                        <img
                          src={file.preview}
                          alt={file.name}
                          className="w-12 h-12 object-cover rounded border"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                          <FileIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* File details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{file.name}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {file.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 ml-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Text preview */}
                      {showPreview && file.preview && !file.type.startsWith('image/') && (
                        <div className="mt-2 p-2 bg-muted rounded text-xs font-mono">
                          {file.preview}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add more files button */}
      {files.length > 0 && files.length < maxFiles && (
        <Button 
          variant="outline" 
          onClick={openFileDialog}
          disabled={isProcessing}
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          Add More Files ({files.length}/{maxFiles})
        </Button>
      )}
    </div>
  )
}