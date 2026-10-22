import React from 'react'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface DataTablePaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  pageSizeOptions?: number[]
  selectedCount?: number
  itemLabel?: string
  isLoading?: boolean
}

function getPageNumbers(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, 'ellipsis', totalPages]
  }

  if (currentPage >= totalPages - 2) {
    return [1, 'ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
  }

  return [1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages]
}

export function DataTablePagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  selectedCount = 0,
  itemLabel = 'creators',
  isLoading = false,
}: DataTablePaginationProps) {
  const safeTotalPages = Math.max(totalPages, 1)
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  const pages = getPageNumbers(currentPage, safeTotalPages)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t bg-card text-xs">
      {/* Left: Item range & selection status */}
      <div className="flex items-center gap-2 text-muted-foreground order-2 sm:order-1">
        {selectedCount > 0 && (
          <span className="font-medium text-foreground">
            {selectedCount} selected &bull;
          </span>
        )}
        <span>
          Showing <span className="font-medium text-foreground">{startItem}</span> to{' '}
          <span className="font-medium text-foreground">{endItem}</span> of{' '}
          <span className="font-medium text-foreground">{totalItems}</span> {itemLabel}
        </span>
      </div>

      {/* Right: Rows per page selector + Numbered pagination */}
      <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 sm:gap-4 order-1 sm:order-2 w-full sm:w-auto">
        {/* Page size dropdown */}
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground whitespace-nowrap text-[11px] sm:text-xs">
              Rows per page
            </span>
            <Select
              value={String(pageSize)}
              onValueChange={(val) => onPageSizeChange(Number(val))}
              disabled={isLoading}
            >
              <SelectTrigger className="h-8 w-18 text-xs bg-background">
                <SelectValue placeholder={String(pageSize)} />
              </SelectTrigger>
              <SelectContent side="top">
                {pageSizeOptions.map((opt) => (
                  <SelectItem key={opt} value={String(opt)} className="text-xs">
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Page navigation controls */}
        <div className="flex items-center gap-1">
          {/* Jump to first page */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 hidden sm:inline-flex"
            onClick={() => onPageChange(1)}
            disabled={currentPage <= 1 || isLoading}
            title="First page"
          >
            <ChevronsLeft className="h-3.5 w-3.5" />
            <span className="sr-only">First page</span>
          </Button>

          {/* Previous page */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
            disabled={currentPage <= 1 || isLoading}
            title="Previous page"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span className="sr-only">Previous page</span>
          </Button>

          {/* Numbered page buttons */}
          <div className="flex items-center gap-1">
            {pages.map((p, idx) => {
              if (p === 'ellipsis') {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="flex h-8 w-6 items-center justify-center text-muted-foreground select-none"
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </span>
                )
              }

              const isCurrent = p === currentPage

              return (
                <Button
                  key={p}
                  type="button"
                  variant={isCurrent ? 'default' : 'outline'}
                  size="sm"
                  className={`h-8 min-w-8 px-2 font-mono text-xs transition-colors ${
                    isCurrent
                      ? 'shadow-sm font-semibold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                  onClick={() => onPageChange(p)}
                  disabled={isLoading}
                >
                  {p}
                </Button>
              )
            })}
          </div>

          {/* Next page */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(Math.min(currentPage + 1, safeTotalPages))}
            disabled={currentPage >= safeTotalPages || isLoading}
            title="Next page"
          >
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="sr-only">Next page</span>
          </Button>

          {/* Jump to last page */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 hidden sm:inline-flex"
            onClick={() => onPageChange(safeTotalPages)}
            disabled={currentPage >= safeTotalPages || isLoading}
            title="Last page"
          >
            <ChevronsRight className="h-3.5 w-3.5" />
            <span className="sr-only">Last page</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

