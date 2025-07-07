'use client'

import { useState } from 'react'
import { Search, SortAsc, SortDesc, Filter, RefreshCw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TokenCard } from './TokenCard'
import { TokenGridProps } from '@/types'
import { FormattingUtils } from '@/lib/utils/index'

type SortOption = 'ticker' | 'balance' | 'available' | 'holders'
type SortDirection = 'asc' | 'desc'

export function TokenGrid({ 
  tokens, 
  tickerInfos, 
  loading = false, 
  error = null,
  onRefresh
}: TokenGridProps & { onRefresh?: () => void }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('balance')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [filterBy, setFilterBy] = useState<'all' | 'transferable' | 'divisible'>('all')

  // Filter tokens based on search and filter criteria
  const filteredTokens = tokens.filter(token => {
    // Search filter
    if (searchQuery && !token.ticker.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }

    // Category filter
    switch (filterBy) {
      case 'transferable':
        return parseFloat(token.available) > 0
      case 'divisible':
        return token.decimals > 0
      default:
        return true
    }
  })

  // Sort tokens
  const sortedTokens = [...filteredTokens].sort((a, b) => {
    let aValue: number | string
    let bValue: number | string

    switch (sortBy) {
      case 'ticker':
        aValue = a.ticker
        bValue = b.ticker
        break
      case 'balance':
        aValue = parseFloat(a.balance)
        bValue = parseFloat(b.balance)
        break
      case 'available':
        aValue = parseFloat(a.available)
        bValue = parseFloat(b.available)
        break
      case 'holders':
        aValue = tickerInfos[a.ticker]?.holders || 0
        bValue = tickerInfos[b.ticker]?.holders || 0
        break
      default:
        return 0
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }

    return sortDirection === 'asc' 
      ? (aValue as number) - (bValue as number)
      : (bValue as number) - (aValue as number)
  })

  const handleTokenClick = (ticker: string) => {
    // implement token detail view or transfer modal here
    console.log('Token clicked:', ticker)
  }

  const toggleSort = (newSortBy: SortOption) => {
    if (sortBy === newSortBy) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(newSortBy)
      setSortDirection('desc')
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="h-10 bg-muted rounded w-full sm:w-64 animate-pulse" />
          <div className="flex gap-2">
            <div className="h-10 bg-muted rounded w-32 animate-pulse" />
            <div className="h-10 bg-muted rounded w-24 animate-pulse" />
          </div>
        </div>

        {/* Grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <TokenCard key={i} token={{} as any} loading={true} />
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-muted-foreground">
            Failed to load tokens
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {error}
          </p>
        </div>
        {onRefresh && (
          <Button onClick={onRefresh} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        )}
      </div>
    )
  }

  // Empty state
  if (tokens.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-muted-foreground">
            No BRC-20 tokens found
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            This wallet doesn't have any BRC-20 token balances yet.
          </p>
        </div>
        <Button onClick={onRefresh} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tokens..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          {/* Sort */}
          <Select value={`${sortBy}-${sortDirection}`} onValueChange={(value) => {
            const [newSortBy, newDirection] = value.split('-') as [SortOption, SortDirection]
            setSortBy(newSortBy)
            setSortDirection(newDirection)
          }}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="balance-desc">Balance ↓</SelectItem>
              <SelectItem value="balance-asc">Balance ↑</SelectItem>
              <SelectItem value="available-desc">Available ↓</SelectItem>
              <SelectItem value="available-asc">Available ↑</SelectItem>
              <SelectItem value="ticker-asc">Ticker A-Z</SelectItem>
              <SelectItem value="ticker-desc">Ticker Z-A</SelectItem>
              <SelectItem value="holders-desc">Holders ↓</SelectItem>
              <SelectItem value="holders-asc">Holders ↑</SelectItem>
            </SelectContent>
          </Select>

          {/* Filter */}
          <Select value={filterBy} onValueChange={(value: typeof filterBy) => setFilterBy(value)}>
            <SelectTrigger className="w-32">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="transferable">Transferable</SelectItem>
              <SelectItem value="divisible">Divisible</SelectItem>
            </SelectContent>
          </Select>

          {/* Refresh */}
          {onRefresh && (
            <Button variant="outline" size="icon" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Results summary */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">
            {sortedTokens.length} of {tokens.length} tokens
          </Badge>
          
          {searchQuery && (
            <Badge variant="outline">
              Search: "{searchQuery}"
            </Badge>
          )}
          
          {filterBy !== 'all' && (
            <Badge variant="outline">
              Filter: {filterBy}
            </Badge>
          )}
        </div>

        {sortedTokens.length > 0 && (
          <div className="text-sm text-muted-foreground">
            Sorted by {sortBy} ({sortDirection === 'desc' ? 'highest first' : 'lowest first'})
          </div>
        )}
      </div>

      {/* Token Grid */}
      {sortedTokens.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedTokens.map((token) => (
            <TokenCard
              key={token.ticker}
              token={token}
              tickerInfo={tickerInfos[token.ticker]}
              onClick={() => handleTokenClick(token.ticker)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            No tokens match your current filters.
          </p>
          <Button 
            variant="link" 
            onClick={() => {
              setSearchQuery('')
              setFilterBy('all')
            }}
          >
            Clear filters
          </Button>
        </div>
      )}
    </div>
  )
}