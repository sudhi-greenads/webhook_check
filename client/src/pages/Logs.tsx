import { useEffect, useState, useCallback } from "react"
import { useParams, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Trash2, RefreshCw, Search, ArrowLeft, Activity } from "lucide-react"
import { apiFetch } from "../lib/api"
import { PaginationControls } from "../components/PaginationControls"
import { CodeViewer } from "../components/CodeViewer"

type WebhookLog = {
  id: number
  method: string
  url: string
  headers: Record<string, string>
  query: Record<string, string>
  body: any
  created_at: string
}

export default function Logs() {
  const { name, key } = useParams()
  const [logs, setLogs] = useState<WebhookLog[]>([])
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  // Filters
  const [search, setSearch] = useState("")
  const [method, setMethod] = useState("ALL")
  const [limit] = useState("20")
  
  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchLogs = useCallback(async () => {
    if (!name || !key) return
    try {
      setLoading(true)
      setErrorMsg("")
      const params = new URLSearchParams()
      if (search) params.append("search", search)
      if (method && method !== "ALL") params.append("method", method)
      params.append("limit", limit)
      params.append("page", page.toString())

      const res = await apiFetch(`/log/${name}/${key}?${params.toString()}`)
      
      if (res.status === 404) {
        setErrorMsg("Webhook not registered.")
        setLogs([])
      } else {
        const data = await res.json()
        if (data.data) {
          setLogs(data.data)
          setTotalPages(data.totalPages)
        } else {
          setLogs([])
        }
      }
    } catch (e) {
      setErrorMsg("Failed to fetch logs.")
    } finally {
      setLoading(false)
    }
  }, [name, key, search, method, limit, page])

  const clearLogs = async () => {
    if (!confirm("Are you sure you want to clear all logs for this webhook?")) return
    try {
      await apiFetch(`/log/${name}/${key}`, { method: "DELETE" })
      fetchLogs()
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs, page])

  if (!name || !key) {
    return <div className="p-6">Select a webhook from the home page.</div>
  }

  const backendUrl = import.meta.env.VITE_BACKEND_PUBLIC_URL || (window.location.origin + '/webhook')
  const endpointUrl = `${backendUrl}/${name}/${key}`

  return (
    <div className="flex flex-col h-full max-w-[1400px] mx-auto w-full">
      {/* Header Area */}
      <div className="flex flex-col gap-4 mb-6">
        <Link to="/webhooks" className="inline-flex items-center text-xs font-medium text-muted-foreground hover:text-foreground w-fit transition-colors">
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back to Endpoints
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
              <Activity className="h-5 w-5 text-muted-foreground" />
              Logs: /{name}/{key}
            </h1>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="font-mono bg-muted border border-border px-1.5 py-0.5 rounded text-[11px] text-muted-foreground select-all">{endpointUrl}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Unified Toolbar & Data Area */}
      <div className="flex flex-col border border-border rounded-lg bg-card shadow-sm overflow-hidden flex-1">
        
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3 bg-muted/30 border-b border-border">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <Input 
                placeholder="Search payload..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setPage(1)
                    fetchLogs()
                  }
                }}
                className="h-8 pl-8 text-xs bg-background"
              />
            </div>
            <Select value={method} onValueChange={(val: string) => { setMethod(val); setPage(1); }}>
              <SelectTrigger className="h-8 w-[110px] text-xs bg-background">
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">All Methods</SelectItem>
                <SelectItem value="POST" className="text-xs">POST</SelectItem>
                <SelectItem value="GET" className="text-xs">GET</SelectItem>
                <SelectItem value="PUT" className="text-xs">PUT</SelectItem>
                <SelectItem value="DELETE" className="text-xs">DELETE</SelectItem>
                <SelectItem value="PATCH" className="text-xs">PATCH</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => { setPage(1); fetchLogs() }} variant="secondary" size="sm" className="h-8 text-xs">
              Apply
            </Button>
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading} className="h-8 text-xs bg-background">
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={clearLogs} disabled={loading} className="h-8 text-xs text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/20 bg-background">
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Clear
            </Button>
          </div>
        </div>
        
        {/* Logs List */}
        <div className="flex-1 overflow-auto bg-background/50">
          {errorMsg && (
            <div className="m-4 text-destructive text-xs font-medium bg-destructive/10 p-3 rounded border border-destructive/20">
              {errorMsg}
            </div>
          )}
          
          {logs.length === 0 && !errorMsg ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Activity className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground font-medium">No requests found matching your filters.</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Send a webhook to see it appear here instantly.</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border/50">
              {/* @ts-expect-error type single is valid for radix accordion */}
              <Accordion type="single" collapsible className="w-full">
                {logs.map((log) => (
                  <AccordionItem value={`log-${log.id}`} key={log.id} className="border-b-0">
                    <AccordionTrigger className="hover:no-underline hover:bg-muted/30 px-4 py-2.5 flex group transition-colors data-[state=open]:bg-muted/50">
                      <div className="flex items-center gap-3 w-full">
                        <span className={`font-mono font-bold text-[10px] w-14 text-center py-0.5 rounded ${
                          log.method === 'POST' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                          log.method === 'GET' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                          'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400'
                        }`}>
                          {log.method}
                        </span>
                        <span className="text-xs font-mono text-muted-foreground truncate max-w-[300px] text-left">
                          {log.url}
                        </span>
                        <span className="text-[11px] text-muted-foreground/70 ml-auto whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString(undefined, { 
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' 
                          })}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="bg-muted/10 border-t border-border/50">
                      <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="space-y-4">
                          <CodeViewer title="Query Parameters" code={JSON.stringify(log.query, null, 2)} />
                          <CodeViewer title="Headers" code={JSON.stringify(log.headers, null, 2)} />
                        </div>
                        <div>
                          <CodeViewer title="Request Body" code={JSON.stringify(log.body, null, 2)} />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}
        </div>
        
        {/* Pagination Footer */}
        {logs.length > 0 && (
          <div className="border-t border-border bg-muted/30 px-4 py-1.5">
            <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  )
}
