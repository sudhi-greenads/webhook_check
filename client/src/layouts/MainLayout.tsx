import { Outlet, Link } from "react-router-dom"
import { Activity, LogOut } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { Button } from "@/components/ui/button"

export function MainLayout() {
  const { isAuthenticated, logout, user } = useAuth()

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <Activity className="h-6 w-6 text-primary" />
          <span>Webhook Dashboard</span>
        </Link>
        <nav className="flex gap-4 ml-auto items-center">
          <Link to="/" className="text-sm font-medium hover:underline">
            Home
          </Link>
          {isAuthenticated && (
            <>
              <span className="text-sm text-muted-foreground ml-4 border-l pl-4 border-border hidden sm:block">
                {user?.username}
              </span>
              <Button variant="ghost" size="sm" onClick={logout} className="ml-2 gap-2 text-muted-foreground hover:text-foreground">
                <LogOut className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only">Logout</span>
              </Button>
            </>
          )}
        </nav>
      </header>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  )
}
