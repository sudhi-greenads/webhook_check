import { Outlet, Link, useLocation } from "react-router-dom"
import { Activity, LogOut, Laptop, Radio } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { Button } from "@/components/ui/button"

export function MainLayout() {
  const { isAuthenticated, logout, user } = useAuth()
  const location = useLocation()

  const isWebhooksActive = location.pathname.startsWith('/webhooks') || location.pathname === '/' || location.pathname.startsWith('/logs')
  const isDevicesActive = location.pathname.startsWith('/devices')

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur px-6 supports-[backdrop-filter]:bg-background/60">
        <Link to="/webhooks" className="flex items-center gap-2.5 font-semibold tracking-tight hover:opacity-90 transition-opacity">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
            <Activity className="h-4 w-4" />
          </div>
          <span className="text-sm font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Webhook Dashboard
          </span>
        </Link>

        {isAuthenticated && (
          <nav className="flex gap-1 ml-6 items-center">
            <Link 
              to="/webhooks" 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                isWebhooksActive 
                  ? 'bg-muted text-foreground' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <Radio className="h-3.5 w-3.5" />
              Endpoints
            </Link>
            <Link 
              to="/devices" 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                isDevicesActive 
                  ? 'bg-muted text-foreground' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <Laptop className="h-3.5 w-3.5" />
              Devices
            </Link>
          </nav>
        )}

        <div className="flex gap-3 ml-auto items-center">
          {isAuthenticated && (
            <>
              <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-border">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-medium text-muted-foreground">
                  {user?.username}
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={logout} 
                className="gap-1.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 px-2.5"
                title="Log out of current session"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only">Logout</span>
              </Button>
            </>
          )}
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6 max-w-[1400px] w-full mx-auto">
        <Outlet />
      </main>
    </div>
  )
}
