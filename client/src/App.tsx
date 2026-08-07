import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom"
import { useAuth } from "./contexts/AuthContext"
import { MainLayout } from "./layouts/MainLayout"
import WebhooksList from "./pages/WebhooksList"
import CreateWebhook from "./pages/CreateWebhook"
import Logs from "./pages/Logs"
import Login from "./pages/Login"
import Register from "./pages/Register"
import { Toaster } from "sonner"

function ProtectedRoutes() {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route element={<ProtectedRoutes />}>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Navigate to="/webhooks" replace />} />
            <Route path="webhooks" element={<WebhooksList />} />
            <Route path="webhooks/create" element={<CreateWebhook />} />
            <Route path="logs/:name/:key" element={<Logs />} />
          </Route>
        </Route>
      </Routes>
      <Toaster theme="dark" position="bottom-right" richColors />
    </BrowserRouter>
  )
}

export default App
