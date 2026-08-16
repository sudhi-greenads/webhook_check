import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom"
import { useAuth } from "./contexts/AuthContext"
import { ConfirmProvider } from "./contexts/ConfirmContext"
import { MainLayout } from "./layouts/MainLayout"
import WebhooksList from "./pages/WebhooksList"
import CreateWebhook from "./pages/CreateWebhook"
import EditWebhook from "./pages/EditWebhook"
import AuthKeysList from "./pages/AuthKeysList"
import CreateAuthKey from "./pages/CreateAuthKey"
import AuthKeyDetail from "./pages/AuthKeyDetail"
import TokenVerifier from "./pages/TokenVerifier"
import Docs from "./pages/Docs"
import Logs from "./pages/Logs"
import Devices from "./pages/Devices"
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
      <ConfirmProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route element={<ProtectedRoutes />}>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Navigate to="/webhooks" replace />} />
              <Route path="webhooks" element={<WebhooksList />} />
              <Route path="webhooks/create" element={<CreateWebhook />} />
              <Route path="webhooks/:id/edit" element={<EditWebhook />} />
              <Route path="keys" element={<AuthKeysList />} />
              <Route path="keys/create" element={<CreateAuthKey />} />
              <Route path="keys/:id" element={<AuthKeyDetail />} />
              <Route path="keys/verify" element={<TokenVerifier />} />
              <Route path="verify-token" element={<TokenVerifier />} />
              <Route path="devices" element={<Devices />} />
              <Route path="docs" element={<Docs />} />
              <Route path="docs/:docId" element={<Docs />} />
              <Route path="logs/:name/:key" element={<Logs />} />
            </Route>
          </Route>
        </Routes>
        <Toaster theme="dark" position="bottom-right" richColors />
      </ConfirmProvider>
    </BrowserRouter>
  )
}

export default App
