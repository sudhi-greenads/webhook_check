import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { 
  Radio, 
  Plus, 
  KeyRound, 
  ShieldCheck, 
  Laptop, 
  BookOpen, 
  Terminal, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  X,
  Zap,
  Activity,
  Layers,
  FileCode
} from "lucide-react"
import { useAuth } from "../contexts/AuthContext"

type SidebarProps = {
  isMobileOpen: boolean
  onCloseMobile: () => void
  isCollapsed: boolean
  onToggleCollapse: () => void
}

type NavItem = {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

type NavSection = {
  title: string
  items: NavItem[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Core",
    items: [
      { title: "Endpoints", href: "/webhooks", icon: Radio },
      { title: "Create Endpoint", href: "/webhooks/create", icon: Plus }
    ]
  },
  {
    title: "Security & Keys",
    items: [
      { title: "Auth Keys", href: "/keys", icon: KeyRound },
      { title: "Create Key", href: "/keys/create", icon: Plus },
      { title: "Verify Token", href: "/keys/verify", icon: ShieldCheck, badge: "New" },
      { title: "Active Devices", href: "/devices", icon: Laptop }
    ]
  },
  {
    title: "Developer & API",
    items: [
      { title: "Documentation", href: "/docs", icon: BookOpen },
      { title: "API Reference", href: "/docs/http-reference", icon: Terminal }
    ]
  }
]

export function Sidebar({
  isMobileOpen,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse
}: SidebarProps) {
  const location = useLocation()
  const { user, logout } = useAuth()

  const isActive = (path: string) => {
    if (path === "/webhooks" && (location.pathname === "/webhooks" || location.pathname.startsWith("/logs/"))) return true
    if (path === "/docs" && location.pathname.startsWith("/docs") && location.pathname !== "/docs/http-reference") return true
    return location.pathname === path
  }

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between select-none">
      {/* Top Header & Branding */}
      <div>
        <div className="flex h-14 items-center justify-between px-3.5 border-b border-border/70">
          <Link 
            to="/webhooks" 
            onClick={onCloseMobile}
            className="flex items-center gap-2.5 overflow-hidden transition-opacity hover:opacity-90"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0 shadow-sm">
              <Zap className="h-4 w-4 fill-current" />
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="flex flex-col truncate">
                <span className="text-sm font-bold tracking-tight text-foreground">WebhookHub</span>
                <span className="text-[10px] text-muted-foreground font-mono">RS256 JWT Gateway</span>
              </div>
            )}
          </Link>

          {/* Close button on mobile */}
          {isMobileOpen && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Navigation Sections */}
        <div className="space-y-6 px-2.5 py-4 overflow-y-auto max-h-[calc(100vh-140px)]">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-1">
              {(!isCollapsed || isMobileOpen) && (
                <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 block">
                  {section.title}
                </span>
              )}
              <nav className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.href)
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={onCloseMobile}
                      title={isCollapsed && !isMobileOpen ? item.title : undefined}
                      className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-all ${
                        active
                          ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                      } ${isCollapsed && !isMobileOpen ? "justify-center px-2" : ""}`}
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${active ? "text-primary-foreground" : "text-muted-foreground"}`} />
                      {(!isCollapsed || isMobileOpen) && (
                        <div className="flex flex-1 items-center justify-between">
                          <span className="truncate">{item.title}</span>
                          {item.badge && (
                            <span className="rounded bg-primary/20 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider text-primary">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </Link>
                  )
                })}
              </nav>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom User & Collapse Action */}
      <div className="border-t border-border/70 p-2.5 space-y-2 bg-card/40">
        {/* User Card */}
        {(!isCollapsed || isMobileOpen) ? (
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/60">
            <div className="flex items-center gap-2 truncate">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs uppercase shrink-0">
                {user?.username ? user.username.charAt(0) : "U"}
              </div>
              <div className="truncate">
                <span className="text-xs font-semibold text-foreground block truncate">
                  {user?.username || "Account"}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono block">
                  Online
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              title="Log Out"
              className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={logout}
            title="Log Out"
            className="flex w-full items-center justify-center p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}

        {/* Collapse Toggle on Desktop */}
        <div className="hidden lg:flex items-center justify-end">
          <button
            onClick={onToggleCollapse}
            className="flex w-full items-center justify-center gap-1 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-md transition-colors"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 border-r border-border bg-card transition-all duration-200 z-30 sticky top-0 h-screen ${
          isCollapsed ? "w-16" : "w-60"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Slide-Over) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />

          {/* Drawer Body */}
          <div className="relative flex w-72 max-w-[80vw] flex-1 flex-col bg-card border-r border-border shadow-2xl z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  )
}
