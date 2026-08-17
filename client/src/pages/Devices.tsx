import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { 
  Laptop, 
  Smartphone, 
  Tablet, 
  Globe, 
  MapPin, 
  ShieldAlert, 
  RefreshCw, 
  Trash2, 
  LogOut, 
  Network,
  Clock,
  Sparkles,
  Search
} from "lucide-react"
import { apiFetch } from "../lib/api"
import { useAuth } from "../contexts/AuthContext"
import { PaginationControls } from "../components/PaginationControls"

type DeviceSession = {
  id: number
  user_agent: string | null
  ip: string | null
  flow_ips: string | null
  location: {
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
  } | null
  created_at: string
  last_used_at: string
  is_current: boolean
}

function parseUserAgent(uaString: string | null) {
  if (!uaString) {
    return {
      browser: "Unknown Browser",
      os: "Unknown OS",
      deviceType: "desktop",
      full: "Unknown client"
    }
  }

  const ua = uaString.toLowerCase()
  let browser = "Web Browser"
  let os = "Unknown OS"
  let deviceType: "desktop" | "mobile" | "tablet" = "desktop"

  // Detect Device Type
  if (ua.includes("ipad") || ua.includes("tablet") || ua.includes("playbook") || ua.includes("silk")) {
    deviceType = "tablet"
  } else if (ua.includes("mobile") || ua.includes("iphone") || ua.includes("android") || ua.includes("blackberry") || ua.includes("windows phone")) {
    deviceType = "mobile"
  }

  // Detect OS
  if (ua.includes("windows nt 10.0") || ua.includes("windows nt 11.0")) os = "Windows"
  else if (ua.includes("windows nt 6.3")) os = "Windows 8.1"
  else if (ua.includes("windows nt 6.2")) os = "Windows 8"
  else if (ua.includes("windows nt 6.1")) os = "Windows 7"
  else if (ua.includes("mac os x")) os = "macOS"
  else if (ua.includes("iphone")) os = "iOS (iPhone)"
  else if (ua.includes("ipad")) os = "iPadOS"
  else if (ua.includes("android")) os = "Android"
  else if (ua.includes("linux")) os = "Linux"
  else if (ua.includes("cros")) os = "Chrome OS"

  // Detect Browser
  if (ua.includes("edg/")) browser = "Microsoft Edge"
  else if (ua.includes("chrome/") && !ua.includes("edg/") && !ua.includes("opr/")) browser = "Google Chrome"
  else if (ua.includes("safari/") && !ua.includes("chrome/")) browser = "Apple Safari"
  else if (ua.includes("firefox/")) browser = "Mozilla Firefox"
  else if (ua.includes("opr/") || ua.includes("opera/")) browser = "Opera"
  else if (ua.includes("postmanruntime")) browser = "Postman"
  else if (ua.includes("curl")) browser = "cURL"

  return {
    browser,
    os,
    deviceType,
    full: uaString
  }
}

export default function Devices() {
  const [devices, setDevices] = useState<DeviceSession[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const limit = 20

  const { logout } = useAuth()
  const { confirm } = useConfirm()

  const fetchDevices = useCallback(async (currentPage: number) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append("page", currentPage.toString())
      params.append("limit", limit.toString())
      if (search) params.append("search", search)

      const res = await apiFetch(`/auth/devices?${params.toString()}`)
      const data = await res.json()
      if (data.success && Array.isArray(data.devices)) {
        setDevices(data.devices)
        setTotalPages(data.totalPages || 1)
      } else {
        setDevices([])
      }
    } catch (err) {
      toast.error("Failed to load active sessions")
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    fetchDevices(page)
  }, [page, fetchDevices])

  const handleRevokeSingle = async (id: number, isCurrent: boolean) => {
    if (isCurrent) {
      const confirmed = await confirm({
        title: "Log Out Current Session",
        description: "Revoking your current device session will log you out immediately.",
        confirmText: "Log Out",
        variant: "destructive"
      })
      if (confirmed) {
        try {
          await apiFetch(`/auth/devices/${id}`, { method: "DELETE" })
          toast.success("Session revoked")
          logout()
        } catch (e) {
          toast.error("Failed to revoke session")
        }
      }
      return
    }

    const confirmed = await confirm({
      title: "Revoke Device Session",
      description: "Are you sure you want to revoke this session? The device will be signed out immediately.",
      confirmText: "Revoke Session",
      variant: "destructive"
    })
    if (!confirmed) return

    try {
      setActionLoading(true)
      const res = await apiFetch(`/auth/devices/${id}`, { method: "DELETE" })
      const data = await res.json()
      if (data.success) {
        toast.success("Device session revoked successfully")
        fetchDevices(page)
      } else {
        toast.error(data.error || "Failed to revoke device")
      }
    } catch (err) {
      toast.error("An error occurred while revoking session")
    } finally {
      setActionLoading(false)
    }
  }

  const handleRevokeOthers = async () => {
    const confirmed = await confirm({
      title: "Revoke All Other Sessions",
      description: "Are you sure you want to revoke all other active sessions across your other devices?",
      confirmText: "Revoke All Others",
      variant: "warning"
    })
    if (!confirmed) return

    try {
      setActionLoading(true)
      const res = await apiFetch(`/auth/devices/revoke-others`, { method: "POST" })
      const data = await res.json()
      if (data.success) {
        toast.success(`Revoked ${data.count} other session(s)`)
        fetchDevices(page)
      } else {
        toast.error(data.error || "Failed to revoke other sessions")
      }
    } catch (err) {
      toast.error("An error occurred")
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 pt-6 max-w-[1200px] mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground flex items-center gap-2.5">
            <Laptop className="h-7 w-7 text-primary" />
            Active Devices & Sessions
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Manage and inspect the browsers, servers, and devices authenticated with your account.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchDevices(page)} 
            disabled={loading}
            className="h-9 text-xs bg-background"
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button 
            variant="outline"
            size="sm"
            onClick={handleRevokeOthers}
            disabled={actionLoading || devices.length <= 1}
            className="h-9 text-xs text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/20 bg-background"
          >
            <LogOut className="mr-1.5 h-3.5 w-3.5" />
            Revoke Other Sessions
          </Button>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search sessions by IP, browser, or location..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-8 h-9 text-xs bg-card"
          />
        </div>
      </div>

      {/* Devices List Card */}
      {loading && devices.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border border-border rounded-lg bg-card">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground mb-2" />
          <span className="text-xs text-muted-foreground">Loading active sessions...</span>
        </div>
      ) : devices.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border border-border rounded-lg bg-card text-center">
          <ShieldAlert className="h-8 w-8 text-muted-foreground mb-2" />
          <span className="text-sm font-semibold text-foreground">No active sessions found</span>
          <span className="text-xs text-muted-foreground mt-1">Try changing your search query or refreshing.</span>
        </div>
      ) : (
        <div className="space-y-3">
          {devices.map((device) => {
            const uaInfo = parseUserAgent(device.user_agent)
            const loc = device.location
            const locationString = loc && (loc.city || loc.country)
              ? [loc.city, loc.region, loc.country].filter(Boolean).join(", ")
              : null

            return (
              <div 
                key={device.id} 
                className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card ${
                  device.is_current ? 'border-primary/40 bg-primary/5' : 'border-border hover:border-border/80'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg border shrink-0 ${
                    device.is_current ? 'bg-primary/20 text-primary border-primary/30' : 'bg-muted text-muted-foreground border-border'
                  }`}>
                    {uaInfo.deviceType === "mobile" ? (
                      <Smartphone className="h-5 w-5" />
                    ) : uaInfo.deviceType === "tablet" ? (
                      <Tablet className="h-5 w-5" />
                    ) : (
                      <Laptop className="h-5 w-5" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground">
                        {uaInfo.browser} on {uaInfo.os}
                      </span>
                      {device.is_current && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <Sparkles className="h-2.5 w-2.5" /> This Device (Current)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      {device.ip && (
                        <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-muted px-1.5 py-0.5 rounded">
                          <Globe className="h-3 w-3" /> {device.ip}
                        </span>
                      )}
                      {locationString && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-primary" /> {locationString}
                        </span>
                      )}
                      {loc?.ispName && (
                        <span className="text-muted-foreground/70 hidden sm:inline">
                          • {loc.ispName}
                        </span>
                      )}
                    </div>

                    {device.flow_ips && (
                      <div className="text-[10px] font-mono text-muted-foreground/80 flex items-center gap-1 pt-0.5">
                        <Network className="h-3 w-3 shrink-0" />
                        <span className="truncate max-w-[400px]">Proxies: {device.flow_ips}</span>
                      </div>
                    )}

                    <div className="text-[11px] text-muted-foreground/70 pt-1 flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Last active: {new Date(device.last_used_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 justify-end shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border/50">
                  <Button 
                    variant={device.is_current ? "outline" : "ghost"}
                    size="sm"
                    onClick={() => handleRevokeSingle(device.id, device.is_current)}
                    disabled={actionLoading}
                    className={`h-8 text-xs ${
                      device.is_current 
                        ? 'text-muted-foreground hover:text-destructive hover:bg-destructive/10' 
                        : 'text-destructive hover:bg-destructive hover:text-destructive-foreground'
                    }`}
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    {device.is_current ? "Log Out" : "Revoke"}
                  </Button>
                </div>
              </div>
            )
          })}

          {devices.length > 0 && (
            <div className="border border-border rounded-lg bg-card px-4 py-2 mt-4">
              <PaginationControls
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
