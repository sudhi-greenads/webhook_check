import { Link } from "react-router-dom"
import { 
  Search, 
  ChevronRight, 
  ShieldCheck, 
  KeyRound, 
  Radio, 
  Sparkles
} from "lucide-react"
import { 
  DOC_SERVICES, 
  getServiceVersionData,
  type DocService, 
  type DocPage 
} from "../../lib/docsData"

type DocsSidebarProps = {
  currentService: DocService
  onSelectService: (service: DocService) => void
  currentDoc: DocPage
  searchQuery: string
  onSearchChange: (query: string) => void
  docVersion: string
  onVersionChange: (version: string) => void
  onItemClick?: () => void
}

export function DocsSidebar({
  currentService,
  onSelectService,
  currentDoc,
  searchQuery,
  onSearchChange,
  docVersion,
  onVersionChange,
  onItemClick
}: DocsSidebarProps) {

  // Fetch version-aware documentation structure
  const serviceVersionData = getServiceVersionData(currentService.id, docVersion)

  // Filtered categories for current service & version
  const filteredCategories = serviceVersionData.categories.map((cat) => {
    if (!searchQuery.trim()) return cat
    const q = searchQuery.toLowerCase()
    return {
      ...cat,
      pages: cat.pages.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      )
    }
  }).filter((cat) => cat.pages.length > 0)

  return (
    <aside className="w-full lg:w-72 shrink-0 space-y-6">
      
      {/* Service Selector & Version Header */}
      <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-3">
        
        {/* Service Picker */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span>Documentation Service</span>
            <span className="text-[9px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20">
              {currentService.badge}
            </span>
          </label>
          
          <select
            value={currentService.id}
            onChange={(e) => {
              const svc = DOC_SERVICES.find((s) => s.id === e.target.value)
              if (svc) {
                onSelectService(svc)
                onVersionChange(svc.defaultVersion)
              }
            }}
            className="w-full text-xs font-semibold rounded-lg border border-border bg-background px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            {DOC_SERVICES.map((svc) => (
              <option key={svc.id} value={svc.id} disabled={svc.status === "coming_soon"}>
                {svc.name} {svc.status === "coming_soon" ? "(Coming Soon)" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Version Picker */}
        <div className="flex items-center justify-between pt-1 border-t border-border/50">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Docs Version</span>
          <select
            value={docVersion}
            onChange={(e) => onVersionChange(e.target.value)}
            className="text-xs font-mono font-semibold rounded border border-border bg-background px-2 py-0.5 text-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            {currentService.supportedVersions.map((ver) => (
              <option key={ver.version} value={ver.version} disabled={ver.disabled}>
                {ver.label}
              </option>
            ))}
          </select>
        </div>

        {/* Search Box */}
        <div className="relative pt-1">
          <Search className="absolute left-2.5 top-3.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search documentation..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-md border border-border bg-background pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Sidebar Categories Tree */}
      <nav className="space-y-5">
        {filteredCategories.length > 0 ? (
          filteredCategories.map((category) => (
            <div key={category.name} className="space-y-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-3">
                {category.name}
              </h3>
              <div className="space-y-0.5">
                {category.pages.map((page) => {
                  const isActive = page.id === currentDoc.id
                  return (
                    <Link
                      key={page.id}
                      to={`/docs/${page.id}`}
                      onClick={onItemClick}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? "bg-primary/10 text-primary font-semibold border border-primary/20"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="truncate">{page.title}</span>
                        {page.badge && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold shrink-0">
                            {page.badge}
                          </span>
                        )}
                      </div>
                      {isActive && <ChevronRight className="h-3.5 w-3.5 text-primary shrink-0 ml-1" />}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="px-3 py-4 text-xs text-muted-foreground text-center">
            No doc articles found for "{searchQuery}"
          </div>
        )}
      </nav>

      {/* Quick Actions */}
      <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-2 text-xs">
        <span className="font-semibold text-foreground block flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" /> Quick Actions
        </span>
        <Link to="/keys/verify" className="flex items-center gap-1.5 text-primary hover:underline font-medium">
          <ShieldCheck className="h-3.5 w-3.5" /> Token Verification Tool
        </Link>
        <Link to="/keys" className="flex items-center gap-1.5 text-primary hover:underline font-medium">
          <KeyRound className="h-3.5 w-3.5" /> Open Auth Keys Manager
        </Link>
        <Link to="/webhooks" className="flex items-center gap-1.5 text-primary hover:underline font-medium">
          <Radio className="h-3.5 w-3.5" /> View Endpoints
        </Link>
      </div>
    </aside>
  )
}
