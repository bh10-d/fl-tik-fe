import React, { useState, useEffect, useRef } from 'react'
import { Search, TrendingUp, X, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useDebounce } from '@/hooks/useDebounce'
import { intelligenceService } from '@/services/intelligence.service'

interface SearchWithSuggestionsProps {
  value: string
  onChange: (value: string) => void
  onSearch?: (value: string) => void
  placeholder?: string
  className?: string
}

export function SearchWithSuggestions({
  value,
  onChange,
  onSearch,
  placeholder = 'Search...',
  className = '',
}: SearchWithSuggestionsProps) {
  const [internalValue, setInternalValue] = useState(value)
  const [isOpen, setIsOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Keep internalValue in sync if parent resets value
  useEffect(() => {
    setInternalValue(value)
  }, [value])

  // Debounce notification to parent so parent doesn't re-render on every keystroke
  const debouncedInput = useDebounce(internalValue, 300)
  useEffect(() => {
    if (debouncedInput !== value) {
      onChange(debouncedInput)
    }
  }, [debouncedInput])

  const debouncedQuery = useDebounce(internalValue, 250)

  // Fetch suggestions when debounced query changes
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.trim().length < 2) {
      setSuggestions([])
      setIsLoading(false)
      return
    }

    let isMounted = true
    setIsLoading(true)

    intelligenceService
      .getSearchSuggestions(debouncedQuery.trim())
      .then((res) => {
        if (isMounted) {
          setSuggestions(res.suggestions || [])
        }
      })
      .catch((err) => {
        console.error('Failed to fetch search suggestions:', err)
        if (isMounted) setSuggestions([])
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [debouncedQuery])

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectSuggestion = (suggestion: string) => {
    setInternalValue(suggestion)
    onChange(suggestion)
    if (onSearch) onSearch(suggestion)
    setIsOpen(false)
  }

  const handleClear = () => {
    setInternalValue('')
    onChange('')
    if (onSearch) onSearch('')
    setSuggestions([])
    setIsOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onChange(internalValue)
      if (onSearch) onSearch(internalValue)
      setIsOpen(false)
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={internalValue}
          onChange={(e) => {
            setInternalValue(e.target.value)
            setIsOpen(true)
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true)
          }}
          placeholder={placeholder}
          className="h-8 pl-8 pr-7 text-xs"
        />
        {isLoading ? (
          <Loader2 className="absolute right-2.5 top-2.5 h-3.5 w-3.5 animate-spin text-muted-foreground" />
        ) : internalValue ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      {/* Floating Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-popover border border-border rounded-md shadow-md py-1 max-h-60 overflow-y-auto">
          <div className="px-2.5 py-1 text-[10px] uppercase font-semibold tracking-wider text-muted-foreground flex items-center gap-1 border-b mb-1">
            <TrendingUp className="h-3 w-3 text-primary" /> TikTok Search Suggestions
          </div>
          {suggestions.map((item, idx) => (
            <button
              key={`${item}-${idx}`}
              type="button"
              onClick={() => handleSelectSuggestion(item)}
              className="w-full text-left px-2.5 py-1.5 text-xs hover:bg-muted/80 flex items-center justify-between transition-colors text-foreground"
            >
              <span className="truncate">{item}</span>
              <span className="text-[10px] text-muted-foreground font-mono shrink-0 pl-2">US Trend</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default SearchWithSuggestions


