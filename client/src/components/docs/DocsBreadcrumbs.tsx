import { Link } from "react-router-dom"
import { ChevronRight } from "lucide-react"

type DocsBreadcrumbsProps = {
  serviceName: string
  categoryName: string
  pageTitle: string
}

export function DocsBreadcrumbs({ serviceName, categoryName, pageTitle }: DocsBreadcrumbsProps) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground border-b border-border pb-3 overflow-x-auto">
      <Link to="/docs/overview" className="hover:text-foreground shrink-0">Docs</Link>
      <ChevronRight className="h-3 w-3 shrink-0" />
      <span className="text-muted-foreground shrink-0">{serviceName}</span>
      <ChevronRight className="h-3 w-3 shrink-0" />
      <span className="text-muted-foreground shrink-0">{categoryName}</span>
      <ChevronRight className="h-3 w-3 shrink-0" />
      <span className="font-semibold text-foreground truncate">{pageTitle}</span>
    </div>
  )
}
