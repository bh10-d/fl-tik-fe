import React, { useState, useMemo, useRef, useEffect } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Check, ChevronsUpDown, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SearchableOption {
  value: string
  label: string
  subLabel?: string
  avatarUrl?: string | null
  icon?: React.ReactNode
}

interface SearchableSelectProps {
  value: string
  onValueChange: (value: string) => void
  options: SearchableOption[]
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  allOptionLabel?: string
  className?: string
  disabled?: boolean
}

export function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder = 'Select option...',
  searchPlaceholder = 'Type to search...',
  emptyText = 'No options found.',
  allOptionLabel = 'All',
  className,
  disabled = false,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto focus input when popover opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
    } else {
      setSearchQuery('')
    }
  }, [open])

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return options

    return options.filter((opt) => {
      const matchLabel = opt.label.toLowerCase().includes(q)
      const matchSub = opt.subLabel ? opt.subLabel.toLowerCase().includes(q) : false
      return matchLabel || matchSub
    })
  }, [options, searchQuery])

  // Find currently selected option
  const selectedOption = useMemo(() => {
    if (!value || value === 'all') return null
    return options.find((opt) => opt.value === value)
  }, [options, value])

  const displayLabel = useMemo(() => {
    if (!value || value === 'all') return allOptionLabel
    if (selectedOption) return selectedOption.label
    return placeholder
  }, [value, selectedOption, allOptionLabel, placeholder])

  const handleSelect = (val: string) => {
    onValueChange(val)
    setOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onValueChange('all')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'h-8 justify-between text-xs font-normal bg-background px-3 hover:bg-accent hover:text-accent-foreground',
            !value || value === 'all' ? 'text-muted-foreground' : 'text-foreground',
            className
          )}
        >
          <div className="flex items-center gap-2 truncate text-left min-w-0 flex-1">
            {selectedOption?.avatarUrl && (
              <Avatar className="h-4 w-4 shrink-0">
                <AvatarImage src={selectedOption.avatarUrl} />
                <AvatarFallback className="text-[8px]">
                  {selectedOption.label.slice(0, 1)}
                </AvatarFallback>
              </Avatar>
            )}
            {selectedOption?.icon && (
              <span className="shrink-0">{selectedOption.icon}</span>
            )}
            <span className="truncate">{displayLabel}</span>
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-1.5 text-muted-foreground">
            {value && value !== 'all' && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                className="hover:text-foreground p-0.5 rounded transition-colors"
                title="Clear selection"
              >
                <X className="h-3 w-3" />
              </span>
            )}
            <ChevronsUpDown className="h-3 w-3 opacity-60" />
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[280px] p-0 shadow-md border bg-popover text-popover-foreground z-50"
      >
        {/* Search Input Box */}
        <div className="flex items-center border-b px-2.5 py-2">
          <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0 mr-2" />
          <Input
            ref={inputRef}
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-muted-foreground hover:text-foreground text-xs p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Options List */}
        <div className="max-h-60 overflow-y-auto p-1 text-xs">
          {/* 'All' default option */}
          {allOptionLabel && (
            <div
              role="button"
              tabIndex={0}
              onClick={() => handleSelect('all')}
              className={cn(
                'flex items-center justify-between px-2 py-1.5 rounded-sm cursor-pointer hover:bg-accent hover:text-accent-foreground select-none',
                value === 'all' || !value ? 'bg-accent/60 font-semibold text-foreground' : ''
              )}
            >
              <span className="truncate">{allOptionLabel}</span>
              {(value === 'all' || !value) && (
                <Check className="h-3.5 w-3.5 text-primary shrink-0 ml-2" />
              )}
            </div>
          )}

          {filteredOptions.length === 0 ? (
            <div className="py-4 text-center text-xs text-muted-foreground">
              {emptyText}
            </div>
          ) : (
            filteredOptions.map((opt) => {
              const isSelected = value === opt.value
              return (
                <div
                  key={opt.value}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelect(opt.value)}
                  className={cn(
                    'flex items-center justify-between px-2 py-1.5 rounded-sm cursor-pointer hover:bg-accent hover:text-accent-foreground select-none gap-2',
                    isSelected ? 'bg-accent/60 font-semibold text-foreground' : ''
                  )}
                >
                  <div className="flex items-center gap-2 truncate min-w-0 flex-1">
                    {opt.avatarUrl !== undefined && (
                      <Avatar className="h-5 w-5 shrink-0 border">
                        <AvatarImage src={opt.avatarUrl || undefined} />
                        <AvatarFallback className="text-[9px]">
                          {opt.label.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                    <div className="truncate min-w-0">
                      <span className="block truncate">{opt.label}</span>
                      {opt.subLabel && (
                        <span className="block text-[10px] text-muted-foreground truncate font-normal">
                          {opt.subLabel}
                        </span>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="h-3.5 w-3.5 text-primary shrink-0 ml-1.5" />
                  )}
                </div>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

