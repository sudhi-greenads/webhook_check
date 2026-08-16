import { useState } from "react"
import { Outlet, Link, useLocation } from "react-router-dom"
import { 
  Menu, 
  ChevronRight, 
  Radio, 
  KeyRound, 
  ShieldCheck, 
  Laptop, 
  BookOpen, 
  Terminal,
  ExternalLink,
  Plus
} from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { Sidebar } from "../components/Sidebar"
import { Button } from "@/components/ui/button"

export function MainLayout() {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { user } = useAuth()
  const location = useLocation()

  // Generate breadcrumb titles based on current path
  const getBreadcrumbs = () => {
    const path = location.pathname
    if (path.startsWith("/webhooks/create")) {
      return [{ label: "Endpoints", href: "/webhooks" }, { label: "Create Endpoint" }]
    }
    if (path.includes("/edit")) {
      return [{ label: "Endpoints", href: "/webhooks" }, { label: "Edit Endpoint" }]
    }
    if (path.startsWith("/logs/")) {
      return [{ label: "Endpoints", href: "/webhooks" }, { label: "Live Logs" }]
    }
    if (path.startsWith("/keys/create")) {
      return [{ label: "Auth Keys", href: "/keys" }, { label: "Create Auth Key" }]
    }
    if (path.startsWith("/keys/verify") || path === "/verify-token") {
      return [{ label: "Auth Keys", href: "/keys" }, { label: "Verify Token" }]
    }
    if (path.match(/^\/keys\/\d+$/)) {
      return [{ label: "Auth Keys", href: "/keys" }, { label: "Key Details" }]
    }
    if (path.startsWith("/keys")) {
      return [{ label: "Auth & Security" }, { label: "Auth Keys" }]
    }
    if (path.startsWith("/devices")) {
      return [{ label: "Security" }, { label: "Active Sessions" }]
    }
    if (path.startsWith("/docs")) {
      return [{ label: "Documentation", href: "/docs" }, { label: "Guide" }]
    }
    return [{ label: "Dashboard", href: "/webhooks" }]
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Responsive Collapsible Sidebar */}
      <Sidebar
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />

      {/* Main Content Viewport */}
      <div className="flex flex-1 flex-col min-w-0">
        
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b border-border/80 bg-background/95 backdrop-blur px-4 sm:px-6 supports-[backdrop-filter]:bg-background/60">
          
          {/* Left: Mobile hamburger & Breadcrumbs */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none"
              title="Open Navigation Menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Breadcrumb path */}
            <nav className="flex items-center gap-1.5 text-xs text-muted-foreground select-none">
              {breadcrumbs.map((crumb, idx) => {
                const isLast = idx === breadcrumbs.length - 1
                return (
                  <div key={idx} className="flex items-center gap-1.5">
                    {idx > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />}
                    {crumb.href && !isLast ? (
                      <Link to={crumb.href} className="hover:text-foreground transition-colors font-medium">
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className={isLast ? "font-semibold text-foreground" : "font-medium"}>
                        {crumb.label}
                      </span>
                    )}
                  </div>
                )
              })}
            </nav>
          </div>

          {/* Right: Quick Action Shortcuts */}
          <div className="flex items-center gap-2">
            <Link to="/webhooks/create" className="hidden sm:inline-flex">
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 bg-card">
                <Plus className="h-3.5 w-3.5" />
                New Endpoint
              </Button>
            </Link>
            <Link to="/keys/verify" className="hidden md:inline-flex">
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 bg-card">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                Verify Token
              </Button>
            </Link>

            {/* User pill */}
            <div className="flex items-center gap-2 pl-2 border-l border-border/80 text-xs">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[10px] uppercase">
                {user?.username ? user.username.charAt(0) : "U"}
              </div>
              <span className="hidden sm:inline font-medium text-muted-foreground truncate max-w-[120px]">
                {user?.username}
              </span>
            </div>
          </div>
        </header>

        {/* Page Body Container */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
