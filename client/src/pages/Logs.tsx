import { useEffect, useState, useCallback } from "react"
import { useParams } from "react-router-dom"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Trash2, RefreshCw, Search, Filter } from "lucide-react"

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
  const [limit] = useState("100")

  const fetchLogs = useCallback(async () => {
    if (!name || !key) return
    try {
      setLoading(true)
      setErrorMsg("")
      const params = new URLSearchParams()
      if (search) params.append("search", search)
      if (method && method !== "ALL") params.append("method", method)
      if (limit) params.append("limit", limit)

      const res = await fetch(`/api/log/${name}/${key}?${params.toString()}`)
      
      if (res.status === 404) {
        setErrorMsg("Webhook not registered.")
        setLogs([])
      } else {
        const data = await res.json()
        if (Array.isArray(data)) {
          setLogs(data)
        } else {
          setLogs([])
        }
      }
    } catch (e) {
      setErrorMsg("Failed to fetch logs.")
    } finally {
      setLoading(false)
    }
  }, [name, key, search, method, limit])

  const clearLogs = async () => {
    try {
      await fetch(`/api/log/${name}/${key}`, { method: "DELETE" })
      fetchLogs()
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  if (!name || !key) {
    return <div className="p-6">Select a webhook from the home page.</div>
  }

  const baseUrl = import.meta.env.VITE_FRONTEND_PUBLIC_URL || window.location.origin
  const endpointUrl = `${baseUrl}/${name}/${key}`

  return (
    <div className="flex flex-col gap-6 pt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Logs: /{name}/{key}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Endpoint URL: <span className="font-mono bg-muted px-1 py-0.5 rounded text-xs select-all">{endpointUrl}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="destructive" size="sm" onClick={clearLogs} disabled={loading}>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear All
          </Button>
        </div>
      </div>
      
      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full space-y-1">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Search className="h-3 w-3" /> Search
            </label>
            <Input 
              placeholder="Search body, headers, url..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
            />
          </div>
          <div className="w-full md:w-48 space-y-1">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Filter className="h-3 w-3" /> Method
            </label>
            <Select value={method} onValueChange={(val: string) => setMethod(val)}>
              <SelectTrigger>
                <SelectValue placeholder="All Methods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Methods</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
                <SelectItem value="PATCH">PATCH</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={fetchLogs} className="w-full md:w-auto">Apply Filters</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Incoming Requests Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {errorMsg && <p className="text-red-500 text-sm mb-4">{errorMsg}</p>}
          
          {logs.length === 0 && !errorMsg ? (
            <p className="text-sm text-muted-foreground text-center py-8">No requests found matching your filters.</p>
          ) : (
            <>
              {/* @ts-expect-error type single is valid for radix accordion but shadcn types might be strict */}
              <Accordion type="single" collapsible className="w-full space-y-2">
              {logs.map((log) => (
                <AccordionItem value={`log-${log.id}`} key={log.id} className="border rounded-md px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-4 w-full">
                      <span className={`font-mono font-bold text-xs px-2 py-1 rounded ${
                        log.method === 'POST' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                        log.method === 'GET' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                      }`}>
                        {log.method}
                      </span>
                      <span className="text-sm truncate max-w-[200px] md:max-w-md text-left font-mono">{log.url}</span>
                      <span className="text-xs text-muted-foreground ml-auto hidden md:block">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-col gap-4 pt-4 border-t">
                      <div>
                        <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2">Query Parameters</h4>
                        <pre className="bg-muted p-2 rounded text-xs overflow-auto">
                          {JSON.stringify(log.query, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2">Headers</h4>
                        <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-40">
                          {JSON.stringify(log.headers, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2">Body</h4>
                        <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-60">
                          {JSON.stringify(log.body, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
              </Accordion>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
