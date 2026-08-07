import { Outlet, Link } from "react-router-dom"
import { Activity } from "lucide-react"

export function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <Activity className="h-6 w-6" />
          <span>Webhook Dashboard</span>
        </Link>
        <nav className="flex gap-4 ml-auto">
          <Link to="/" className="text-sm font-medium hover:underline">
            Home
          </Link>
        </nav>
      </header>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  )
}
