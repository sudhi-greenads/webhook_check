import { useState } from "react"
import { Menu, X, BookOpen, ChevronRight } from "lucide-react"
import { DocsSidebar } from "./DocsSidebar"
import { type DocService, type DocPage } from "../../lib/docsData"

type DocsMobileNavProps = {
  currentService: DocService
  onSelectService: (service: DocService) => void
  currentDoc: DocPage
  searchQuery: string
  onSearchChange: (query: string) => void
  docVersion: string
  onVersionChange: (version: string) => void
}

export function DocsMobileNav(props: DocsMobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="lg:hidden w-full mb-4">
      {/* Mobile Bar Trigger */}
      <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground min-w-0">
          <BookOpen className="h-4 w-4 text-primary shrink-0" />
          <span className="truncate">{props.currentDoc.title}</span>
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-semibold hover:bg-primary/20 transition-colors shrink-0"
        >
          <Menu className="h-3.5 w-3.5" />
          <span>Menu</span>
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex bg-background/80 backdrop-blur-sm">
          <div className="relative w-full max-w-xs bg-card border-r border-border h-full p-4 overflow-y-auto shadow-2xl flex flex-col">
            
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <BookOpen className="h-4 w-4 text-primary" />
                <span>Documentation Menu</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Sidebar Content */}
            <DocsSidebar
              {...props}
              onItemClick={() => setIsOpen(false)}
            />
          </div>

          {/* Click outside backdrop */}
          <div className="flex-1" onClick={() => setIsOpen(false)} />
        </div>
      )}
    </div>
  )
}
