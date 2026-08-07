import { Button } from "./ui/button"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function PaginationControls({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  // Generate page numbers to show (max 5 visible at a time)
  const getPageNumbers = () => {
    const pages = []
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (page <= 3) {
        pages.push(1, 2, 3, 4, -1, totalPages)
      } else if (page >= totalPages - 2) {
        pages.push(1, -1, totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
      } else {
        pages.push(1, -1, page - 1, page, page + 1, -1, totalPages)
      }
    }
    return pages
  }

  return (
    <div className="flex items-center justify-between sm:justify-end gap-1.5 py-2">
      <Button
        variant="outline"
        size="sm"
        className="h-7 px-2 text-xs"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
      >
        <ChevronLeft className="h-3 w-3 mr-1" />
        Prev
      </Button>
      
      <div className="hidden sm:flex items-center gap-1">
        {getPageNumbers().map((pageNum, idx) => 
          pageNum === -1 ? (
            <div key={`ellipsis-${idx}`} className="flex h-7 w-7 items-center justify-center">
              <MoreHorizontal className="h-3 w-3 text-muted-foreground" />
            </div>
          ) : (
            <Button
              key={pageNum}
              variant={page === pageNum ? "default" : "outline"}
              size="sm"
              className={`h-7 w-7 p-0 text-xs ${page === pageNum ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
              onClick={() => onPageChange(pageNum)}
            >
              {pageNum}
            </Button>
          )
        )}
      </div>

      <Button
        variant="outline"
        size="sm"
        className="h-7 px-2 text-xs"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
      >
        Next
        <ChevronRight className="h-3 w-3 ml-1" />
      </Button>
    </div>
  )
}
