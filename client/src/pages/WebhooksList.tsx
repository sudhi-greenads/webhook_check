import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Link, useNavigate } from "react-router-dom"
import { Activity, Plus, Trash2, Edit2, Copy, Radio, ExternalLink, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { apiFetch } from "../lib/api"
import { PaginationControls } from "../components/PaginationControls"

type Webhook = {
  id: number
  name: string
  key: string
  created_at: string
  log_count?: number
}

export default function WebhooksList() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState("")

  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const limit = 10

  const navigate = useNavigate()

  const fetchWebhooks = useCallback(async (currentPage: number) => {
    setLoading(true)
    setErrorMsg("")
    try {
      const res = await apiFetch(`/webhooks?page=${currentPage}&limit=${limit}`)
      const data = await res.json()
      if (data.data) {
        setWebhooks(data.data)
        setTotalPages(data.totalPages || 1)
      }
    } catch (e) {
      setErrorMsg("Failed to load webhooks.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWebhooks(page)
  }, [page, fetchWebhooks])

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete endpoint "${name}"? All associated logs will be permanently removed.`)) return
    
    try {
      const res = await apiFetch(`/webhooks/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Webhook deleted successfully")
        fetchWebhooks(page)
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to delete webhook")
      }
    } catch (e) {
      toast.error("Failed to delete webhook")
    }
  }

  const handleCopyEndpoint = (wh: Webhook) => {
    const backendUrl = import.meta.env.VITE_BACKEND_PUBLIC_URL || (window.location.origin + '/webhook')
    const url = `${backendUrl.replace(/\/$/, '')}/${wh.name}/${wh.key}`
    navigator.clipboard.writeText(url)
    toast.success("Endpoint URL copied to clipboard")
  }

  return (
    <div className="flex flex-col gap-6 pt-6 max-w-[1200px] mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground flex items-center gap-2.5">
            <Radio className="h-7 w-7 text-primary" />
            Endpoints
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Manage your webhook listeners, capture real-time HTTP payloads, and inspect incoming requests.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchWebhooks(page)} 
            disabled={loading}
            className="h-9 text-xs bg-background"
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Link to="/webhooks/create">
            <Button size="sm" className="h-9 text-xs shadow-sm">
              <Plus className="mr-1.5 h-4 w-4" /> Create Endpoint
            </Button>
          </Link>
        </div>
      </div>
      
      {errorMsg && (
        <div className="text-destructive text-xs font-medium bg-destructive/10 p-3 rounded-lg border border-destructive/20">
          {errorMsg}
        </div>
      )}

      {/* Endpoints Table Card */}
      <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
        <div className="w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="border-b border-border bg-muted/30">
              <tr className="text-left font-medium text-muted-foreground">
                <th className="h-11 px-4 align-middle text-xs font-semibold uppercase tracking-wider">Endpoint Name</th>
                <th className="h-11 px-4 align-middle text-xs font-semibold uppercase tracking-wider">Secret Key</th>
                <th className="h-11 px-4 align-middle text-xs font-semibold uppercase tracking-wider text-center">Total Requests</th>
                <th className="h-11 px-4 align-middle text-xs font-semibold uppercase tracking-wider hidden md:table-cell">Created At</th>
                <th className="h-11 px-4 align-middle text-xs font-semibold uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading && webhooks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="h-36 text-center text-sm text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground/50" />
                      <span>Loading endpoints...</span>
                    </div>
                  </td>
                </tr>
              ) : webhooks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Activity className="h-8 w-8 text-muted-foreground/30 mb-3" />
                      <p className="text-sm text-muted-foreground font-medium">No endpoints found.</p>
                      <p className="text-xs text-muted-foreground/70 mt-1 mb-4">Create your first endpoint to start capturing webhooks.</p>
                      <Link to="/webhooks/create">
                        <Button variant="outline" size="sm" className="text-xs">
                          <Plus className="mr-1.5 h-3.5 w-3.5" /> Create Endpoint
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                webhooks.map((wh) => (
                  <tr key={wh.id} className="transition-colors hover:bg-muted/30 group">
                    {/* Name */}
                    <td className="p-4 align-middle font-medium">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
                          <Activity className="h-3.5 w-3.5" />
                        </div>
                        <Link 
                          to={`/logs/${wh.name}/${wh.key}`} 
                          className="hover:underline text-foreground font-semibold text-sm flex items-center gap-1.5"
                          title="View endpoint logs"
                        >
                          /{wh.name}
                        </Link>
                      </div>
                    </td>

                    {/* Key with Copy button */}
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-2 max-w-[220px]">
                        <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border truncate">
                          {wh.key}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted" 
                          onClick={() => handleCopyEndpoint(wh)} 
                          title="Copy Full Webhook URL"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>

                    {/* Total Requests / Log Count Badge */}
                    <td className="p-4 align-middle text-center">
                      <span className={`inline-flex items-center gap-1 font-mono text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                        (wh.log_count ?? 0) > 0 
                          ? 'bg-primary/10 text-primary border-primary/20' 
                          : 'bg-muted text-muted-foreground border-border'
                      }`}>
                        {wh.log_count ?? 0} {wh.log_count === 1 ? 'log' : 'logs'}
                      </span>
                    </td>

                    {/* Created At */}
                    <td className="p-4 align-middle text-muted-foreground text-xs hidden md:table-cell">
                      {new Date(wh.created_at).toLocaleDateString(undefined, {
                        month: 'short', day: 'numeric', year: 'numeric'
                      })}
                    </td>

                    {/* Actions */}
                    <td className="p-4 align-middle text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link to={`/logs/${wh.name}/${wh.key}`}>
                          <Button variant="secondary" size="sm" className="h-8 px-2.5 text-xs gap-1">
                            <ExternalLink className="h-3 w-3" />
                            View Logs
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => navigate(`/webhooks/${wh.id}/edit`)} 
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="Edit Endpoint"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(wh.id, wh.name)} 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title="Delete Endpoint"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {webhooks.length > 0 && (
          <div className="border-t border-border bg-muted/20 px-4 py-2">
            <PaginationControls 
              page={page} 
              totalPages={totalPages} 
              onPageChange={setPage} 
            />
          </div>
        )}
      </div>
    </div>
  )
}
