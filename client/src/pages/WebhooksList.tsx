import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Link } from "react-router-dom"
import { Activity, Plus, Trash2, Edit2, Check, X, Copy } from "lucide-react"
import { toast } from "sonner"
import { apiFetch } from "../lib/api"
import { PaginationControls } from "../components/PaginationControls"

type Webhook = {
  id: number
  name: string
  key: string
  created_at: string
}

export default function WebhooksList() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState("")

  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const limit = 10

  // Editing state
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState("")
  const [editKey, setEditKey] = useState("")

  const fetchWebhooks = useCallback(async (currentPage: number) => {
    setLoading(true)
    setErrorMsg("")
    try {
      const res = await apiFetch(`/webhooks?page=${currentPage}&limit=${limit}`)
      const data = await res.json()
      if (data.data) {
        setWebhooks(data.data)
        setTotalPages(data.totalPages)
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

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this webhook? All associated logs will be permanently removed.")) return
    
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

  const startEditing = (wh: Webhook) => {
    setEditingId(wh.id)
    setEditName(wh.name)
    setEditKey(wh.key)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditName("")
    setEditKey("")
  }

  const saveEdit = async (id: number) => {
    try {
      const res = await apiFetch(`/webhooks/${id}`, {
        method: "PUT",
        body: JSON.stringify({ name: editName, key: editKey })
      })
      const data = await res.json()
      if (data.success) {
        setEditingId(null)
        toast.success("Webhook updated successfully")
        fetchWebhooks(page)
      } else {
        toast.error(data.error || "Failed to update webhook")
      }
    } catch (e) {
      toast.error("An error occurred while saving")
    }
  }

  const handleCopyEndpoint = (wh: Webhook) => {
    const backendUrl = import.meta.env.VITE_BACKEND_PUBLIC_URL || (window.location.origin + '/webhook')
    const url = `${backendUrl}/${wh.name}/${wh.key}`
    navigator.clipboard.writeText(url)
    toast.success("Endpoint URL copied to clipboard")
  }

  return (
    <div className="flex flex-col gap-6 pt-6 max-w-[1200px] mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Endpoints</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Manage your webhook listeners and routing endpoints.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/webhooks/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Create Endpoint
            </Button>
          </Link>
        </div>
      </div>
      
      {errorMsg && <div className="text-red-500 text-sm">{errorMsg}</div>}

      <div className="rounded-lg border border-border bg-card shadow-sm">
        <div className="w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="border-b border-border bg-muted/20">
              <tr className="text-left font-medium text-muted-foreground">
                <th className="h-12 px-4 align-middle">Name</th>
                <th className="h-12 px-4 align-middle">Key</th>
                <th className="h-12 px-4 align-middle hidden md:table-cell">Created At</th>
                <th className="h-12 px-4 align-middle text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="h-32 text-center text-sm text-muted-foreground">Loading endpoints...</td></tr>
              ) : webhooks.length === 0 ? (
                <tr>
                  <td colSpan={4} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Activity className="h-8 w-8 text-muted-foreground/30 mb-3" />
                      <p className="text-sm text-muted-foreground font-medium">No endpoints found.</p>
                      <p className="text-xs text-muted-foreground/70 mt-1 mb-4">Create an endpoint to start capturing webhooks.</p>
                      <Link to="/webhooks/create">
                        <Button variant="outline" size="sm">Create Endpoint</Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                webhooks.map((wh) => (
                  <tr key={wh.id} className="border-b border-border/50 transition-colors hover:bg-muted/30 data-[state=selected]:bg-muted">
                    <td className="p-4 align-middle font-medium">
                      {editingId === wh.id ? (
                        <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8 max-w-[200px] bg-background" />
                      ) : (
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-primary" />
                          <Link to={`/logs/${wh.name}/${wh.key}`} className="hover:underline">
                            {wh.name}
                          </Link>
                        </div>
                      )}
                    </td>
                    <td className="p-3 align-middle font-mono text-xs max-w-[200px]">
                      {editingId === wh.id ? (
                        <Input value={editKey} onChange={(e) => setEditKey(e.target.value)} className="h-8 bg-background" />
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="truncate">{wh.key}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto shrink-0 opacity-50 hover:opacity-100" onClick={() => handleCopyEndpoint(wh)} title="Copy URL">
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </td>
                    <td className="p-4 align-middle text-muted-foreground hidden md:table-cell">
                      {new Date(wh.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 align-middle text-right">
                      {editingId === wh.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => saveEdit(wh.id)} className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100">
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={cancelEditing} className="h-8 w-8 text-muted-foreground">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity [&:hover]:opacity-100" style={{opacity: 1}}>
                          <Link to={`/logs/${wh.name}/${wh.key}`}>
                            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                              View Logs
                            </Button>
                          </Link>
                          <Button variant="ghost" size="icon" onClick={() => startEditing(wh)} className="h-8 w-8">
                            <Edit2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(wh.id)} className="h-8 w-8 hover:text-destructive">
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <PaginationControls 
          page={page} 
          totalPages={totalPages} 
          onPageChange={setPage} 
        />
      </div>
    </div>
  )
}
