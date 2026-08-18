import { useState, type ReactNode } from "react"
import { BookOpen } from "lucide-react"
import { DocsBreadcrumbs } from "./DocsBreadcrumbs"
import { DocsPagination } from "./DocsPagination"
import { DocsSidebar } from "./DocsSidebar"
import { DocsMobileNav } from "./DocsMobileNav"
import { 
  DEFAULT_SERVICE, 
  getAllPagesForVersion,
  type DocService, 
  type DocPage 
} from "../../lib/docsData"

type DocsLayoutProps = {
  currentDoc: DocPage
  children: ReactNode
}

export function DocsLayout({ currentDoc, children }: DocsLayoutProps) {
  const [currentService, setCurrentService] = useState<DocService>(DEFAULT_SERVICE)
  const [searchQuery, setSearchQuery] = useState("")
  const [docVersion, setDocVersion] = useState("v1.0")

  // Dynamic version-aware page array for prev/next pagination
  const activePages = getAllPagesForVersion(currentService.id, docVersion)
  const currentIndex = activePages.findIndex((p) => p.id === currentDoc.id)
  const prevDoc = currentIndex > 0 ? activePages[currentIndex - 1] : null
  const nextDoc = currentIndex >= 0 && currentIndex < activePages.length - 1 ? activePages[currentIndex + 1] : null

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-[1400px] mx-auto w-full pt-4 pb-20">
      
      {/* Mobile Drawer Trigger (small screens) */}
      <DocsMobileNav
        currentService={currentService}
        onSelectService={setCurrentService}
        currentDoc={currentDoc}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        docVersion={docVersion}
        onVersionChange={setDocVersion}
      />

      {/* Desktop Left Sidebar (hidden on mobile, visible on lg) */}
      <div className="hidden lg:block">
        <DocsSidebar
          currentService={currentService}
          onSelectService={setCurrentService}
          currentDoc={currentDoc}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          docVersion={docVersion}
          onVersionChange={setDocVersion}
        />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 space-y-8">
        
        {/* Breadcrumb Header */}
        <DocsBreadcrumbs
          serviceName={currentService.name}
          categoryName={currentDoc.category}
          pageTitle={currentDoc.title}
        />

        {/* Article Title & Metadata */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[11px] font-semibold">
              <BookOpen className="h-3 w-3" />
              {currentDoc.category}
            </div>
            
            {currentDoc.badge && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-semibold">
                {currentDoc.badge}
              </div>
            )}

            <div className="inline-flex items-center px-2 py-0.5 rounded border border-border text-[10px] font-mono text-muted-foreground">
              {docVersion}
            </div>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {currentDoc.title}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {currentDoc.description}
          </p>
        </div>

        {/* Article Body Content */}
        <div className="min-h-[300px]">
          {children}
        </div>

        {/* Footer Navigation (Previous / Next Article) */}
        <DocsPagination
          prevDoc={prevDoc}
          nextDoc={nextDoc}
        />
      </main>
    </div>
  )
}
