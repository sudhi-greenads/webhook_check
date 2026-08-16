import { useEffect, useState, useCallback } from "react"
import { useParams, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { 
  Trash2, 
  RefreshCw, 
  Search, 
  ArrowLeft, 
  Activity, 
  Copy, 
  Check, 
  Globe, 
  MapPin, 
  Network, 
  Clock, 
  Server
} from "lucide-react"
import { toast } from "sonner"
import { apiFetch } from "../lib/api"
import { PaginationControls } from "../components/PaginationControls"
import { CodeViewer } from "../components/CodeViewer"

type LocationData = {
  ip?: string
  city?: string
  region?: string
  country?: string
  loc?: string
  org?: string
  postal?: string
  timezone?: string
  ispName?: string
  asn?: string
}

type WebhookLog = {
  id: number
  method: string
  url: string
  headers: Record<string, string>
  query: Record<string, string>
  body: any
  ip?: string | null
  flow_ips?: string | null
  location?: LocationData | null
  created_at: string
}

export default function Logs() {
  const { name, key } = useParams()
  const [logs, setLogs] = useState<WebhookLog[]>([])
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [copiedUrl, setCopiedUrl] = useState(false)

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
          setTotalPages(data.totalPages || 1)
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
      toast.success("Logs cleared successfully")
      fetchLogs()
    } catch (e) {
      toast.error("Failed to clear logs")
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs, page])

  if (!name || !key) {
    return <div className="p-6">Select a webhook from the home page.</div>
  }

  const backendUrl = import.meta.env.VITE_BACKEND_PUBLIC_URL || (window.location.origin + '/webhook')
  const endpointUrl = `${backendUrl.replace(/\/$/, '')}/${name}/${key}`

  const handleCopyEndpointUrl = async () => {
    try {
      await navigator.clipboard.writeText(endpointUrl)
      setCopiedUrl(true)
      toast.success("Webhook URL copied to clipboard")
      setTimeout(() => setCopiedUrl(false), 2000)
    } catch (err) {
      toast.error("Failed to copy URL")
    }
  }

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
              <Activity className="h-5 w-5 text-primary" />
              Logs: /{name}/{key}
            </h1>
            
            {/* Endpoint URL Badge with Copy button */}
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-2 font-mono bg-muted/80 border border-border px-2.5 py-1 rounded-md text-xs text-muted-foreground">
                <span className="text-foreground select-all">{endpointUrl}</span>
                <button 
                  onClick={handleCopyEndpointUrl}
                  className="flex items-center gap-1 text-[11px] font-sans font-medium text-primary hover:text-primary/80 transition-colors pl-2 border-l border-border"
                  title="Copy full webhook URL"
                >
                  {copiedUrl ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy URL</span>
                    </>
                  )}
                </button>
              </div>
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
                placeholder="Search payload, IP, headers..." 
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
              <SelectTrigger className="h-8 w-[120px] text-xs bg-background">
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
            <Button variant="outline" size="sm" onClick={clearLogs} disabled={loading || logs.length === 0} className="h-8 text-xs text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/20 bg-background">
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Clear
            </Button>
          </div>
        </div>
        
        {/* Logs List */}
        <div className="flex-1 overflow-auto bg-background/50">
          {errorMsg && (
            <div className="m-4 text-destructive text-xs font-medium bg-destructive/10 p-3 rounded-lg border border-destructive/20">
              {errorMsg}
            </div>
          )}
          
          {logs.length === 0 && !errorMsg ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Activity className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground font-medium">No requests found matching your filters.</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Send an HTTP request to your webhook URL to see it appear here instantly.</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border/50">
              {/* @ts-expect-error type single is valid for radix accordion */}
              <Accordion type="single" collapsible className="w-full">
                {logs.map((log) => {
                  const location = log.location
                  const locationText = location && (location.city || location.country) 
                    ? [location.city, location.country].filter(Boolean).join(", ") 
                    : null

                  return (
                    <AccordionItem value={`log-${log.id}`} key={log.id} className="border-b-0">
                      <AccordionTrigger className="hover:no-underline hover:bg-muted/30 px-4 py-3 flex group transition-colors data-[state=open]:bg-muted/50">
                        <div className="flex flex-wrap items-center gap-3 w-full text-left">
                          {/* Method Badge */}
                          <span className={`font-mono font-bold text-[11px] px-2.5 py-0.5 rounded ${
                            log.method === 'POST' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
                            log.method === 'GET' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' :
                            log.method === 'PUT' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' :
                            log.method === 'DELETE' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20' :
                            'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20'
                          }`}>
                            {log.method}
                          </span>

                          {/* Client IP Badge */}
                          {log.ip && (
                            <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-muted px-2 py-0.5 rounded border border-border text-foreground">
                              <Globe className="h-3 w-3 text-muted-foreground" />
                              {log.ip}
                            </span>
                          )}

                          {/* Location Badge */}
                          {locationText && (
                            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] bg-primary/5 text-primary px-2 py-0.5 rounded border border-primary/20">
                              <MapPin className="h-3 w-3" />
                              {locationText}
                            </span>
                          )}

                          {/* URL Path */}
                          <span className="text-xs font-mono text-muted-foreground truncate max-w-[260px] hidden md:inline">
                            {log.url}
                          </span>

                          {/* Timestamp */}
                          <span className="text-[11px] text-muted-foreground/70 ml-auto whitespace-nowrap flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(log.created_at).toLocaleString(undefined, { 
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' 
                            })}
                          </span>
                        </div>
                      </AccordionTrigger>
                      
                      <AccordionContent className="bg-muted/10 border-t border-border/50 p-4">
                        <div className="space-y-4">
                          {/* Client & GeoLocation Summary Card */}
                          <div className="rounded-lg border border-border bg-card p-4">
                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/50">
                              <Server className="h-4 w-4 text-primary" />
                              <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                                Request Origin & Network Metadata
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                              {/* Client IP */}
                              <div>
                                <span className="text-muted-foreground block text-[11px]">Client IP</span>
                                <span className="font-mono font-medium text-foreground">{log.ip || "Not recorded"}</span>
                              </div>

                              {/* Location */}
                              <div>
                                <span className="text-muted-foreground block text-[11px]">Geo Location</span>
                                <span className="font-medium text-foreground">
                                  {location && (location.city || location.country) 
                                    ? [location.city, location.region, location.country].filter(Boolean).join(", ") 
                                    : "Unavailable"}
                                </span>
                              </div>

                              {/* ISP / Organization */}
                              <div>
                                <span className="text-muted-foreground block text-[11px]">ISP / Organization</span>
                                <span className="font-medium text-foreground truncate block" title={location?.ispName || location?.org || ""}>
                                  {location?.ispName || location?.org || "Unavailable"}
                                </span>
                              </div>

                              {/* Timezone & Coordinates */}
                              <div>
                                <span className="text-muted-foreground block text-[11px]">Timezone / Loc</span>
                                <span className="font-medium text-foreground">
                                  {location?.timezone || "UTC"} {location?.loc ? `(${location.loc})` : ""}
                                </span>
                              </div>
                            </div>

                            {/* Flow IPs / Proxy Chain */}
                            {log.flow_ips && (
                              <div className="mt-3 pt-3 border-t border-border/40 text-xs">
                                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                                  <Network className="h-3.5 w-3.5" />
                                  <span className="font-semibold text-[11px]">Forwarded Proxy Chain (Flow IPs):</span>
                                </div>
                                <div className="font-mono text-[11px] bg-muted/60 px-2.5 py-1.5 rounded border border-border text-muted-foreground select-all break-all">
                                  {log.flow_ips}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* JSON Viewers Grid */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="space-y-4">
                              <CodeViewer title="Query Parameters" code={log.query} />
                              <CodeViewer title="Request Headers" code={log.headers} />
                            </div>
                            <div className="space-y-4">
                              <CodeViewer title="Request Body" code={log.body} />
                              {log.location && (
                                <CodeViewer title="GeoLocation Metadata" code={log.location} />
                              )}
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>
            </div>
          )}
        </div>
        
        {/* Pagination Footer */}
        {logs.length > 0 && (
          <div className="border-t border-border bg-muted/30 px-4 py-2">
            <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  )
}
