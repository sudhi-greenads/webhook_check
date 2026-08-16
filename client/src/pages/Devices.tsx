import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
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
  Sparkles
} from "lucide-react"
import { apiFetch } from "../lib/api"
import { useAuth } from "../contexts/AuthContext"

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
  const { logout } = useAuth()

  const fetchDevices = useCallback(async () => {
    try {
      setLoading(true)
      const res = await apiFetch("/auth/devices")
      const data = await res.json()
      if (data.success && Array.isArray(data.devices)) {
        setDevices(data.devices)
      } else {
        setDevices([])
      }
    } catch (err) {
      toast.error("Failed to load active sessions")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDevices()
  }, [fetchDevices])

  const handleRevokeSingle = async (id: number, isCurrent: boolean) => {
    if (isCurrent) {
      if (confirm("Revoking your current session will log you out immediately. Continue?")) {
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

    if (!confirm("Are you sure you want to revoke this session? The device will be signed out.")) return

    try {
      setActionLoading(true)
      const res = await apiFetch(`/auth/devices/${id}`, { method: "DELETE" })
      const data = await res.json()
      if (data.success) {
        toast.success("Device session revoked successfully")
        fetchDevices()
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
    if (!confirm("Are you sure you want to sign out of all other devices?")) return

    try {
      setActionLoading(true)
      const res = await apiFetch("/auth/devices/revoke-others", { method: "POST" })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message || "All other sessions revoked")
        fetchDevices()
      } else {
        toast.error(data.error || "Failed to revoke other sessions")
      }
    } catch (err) {
      toast.error("An error occurred while revoking sessions")
    } finally {
      setActionLoading(false)
    }
  }

  const handleRevokeAll = async () => {
    if (!confirm("Are you sure you want to sign out everywhere? You will be logged out immediately.")) return

    try {
      setActionLoading(true)
      await apiFetch("/auth/devices/revoke-all", { method: "POST" })
      toast.success("All sessions revoked")
      logout()
    } catch (err) {
      toast.error("Failed to revoke all sessions")
      setActionLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 pt-6 max-w-[1200px] mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground flex items-center gap-2.5">
            <Laptop className="h-7 w-7 text-primary" />
            Active Devices & Sessions
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Manage authorized devices, view login locations and IP addresses, or revoke suspicious sessions.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchDevices} 
            disabled={loading || actionLoading}
            className="h-8 text-xs bg-background"
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRevokeOthers}
            disabled={loading || actionLoading || devices.length <= 1}
            className="h-8 text-xs border-destructive/30 text-destructive hover:bg-destructive/10 bg-background"
          >
            <ShieldAlert className="mr-1.5 h-3.5 w-3.5" />
            Revoke Other Devices
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleRevokeAll}
            disabled={loading || actionLoading}
            className="h-8 text-xs"
          >
            <LogOut className="mr-1.5 h-3.5 w-3.5" />
            Log Out Everywhere
          </Button>
        </div>
      </div>

      {/* Devices List */}
      {loading && devices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 border border-border rounded-lg bg-card">
          <RefreshCw className="h-8 w-8 text-muted-foreground/40 animate-spin mb-3" />
          <p className="text-sm text-muted-foreground font-medium">Loading active sessions...</p>
        </div>
      ) : devices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 border border-border rounded-lg bg-card text-center">
          <Laptop className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground font-medium">No active sessions found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {devices.map((device) => {
            const parsed = parseUserAgent(device.user_agent)
            const location = device.location

            return (
              <div 
                key={device.id} 
                className={`relative rounded-lg border transition-all p-5 bg-card flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  device.is_current ? 'border-primary/50 shadow-sm bg-primary/[0.02]' : 'border-border hover:border-border/80'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Device Icon */}
                  <div className={`p-3 rounded-lg flex items-center justify-center shrink-0 ${
                    device.is_current ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                  }`}>
                    {parsed.deviceType === "mobile" ? (
                      <Smartphone className="h-5 w-5" />
                    ) : parsed.deviceType === "tablet" ? (
                      <Tablet className="h-5 w-5" />
                    ) : (
                      <Laptop className="h-5 w-5" />
                    )}
                  </div>

                  {/* Device Information */}
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-sm text-foreground">
                        {parsed.browser} on {parsed.os}
                      </h3>
                      {device.is_current && (
                        <span className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          <Sparkles className="h-2.5 w-2.5" />
                          This Device (Current)
                        </span>
                      )}
                    </div>

                    {/* Network & IP Badges */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1 font-mono bg-muted/60 px-2 py-0.5 rounded text-[11px] border border-border">
                        <Globe className="h-3 w-3 text-muted-foreground" />
                        {device.ip || "Unknown IP"}
                      </span>

                      {/* Location Badge */}
                      {location && (location.city || location.country) ? (
                        <span className="inline-flex items-center gap-1 bg-muted/60 px-2 py-0.5 rounded text-[11px] border border-border text-foreground">
                          <MapPin className="h-3 w-3 text-primary" />
                          {[location.city, location.region, location.country].filter(Boolean).join(", ")}
                          {location.ispName || location.org ? ` (${location.ispName || location.org})` : ""}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/60">
                          <MapPin className="h-3 w-3" /> Location unavailable
                        </span>
                      )}
                    </div>

                    {/* Flow IPs / Proxy Chain if present */}
                    {device.flow_ips && device.flow_ips.includes(",") && (
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70 font-mono mt-0.5">
                        <Network className="h-3 w-3 text-muted-foreground/60 shrink-0" />
                        <span className="truncate max-w-[400px]" title={device.flow_ips}>
                          Chain: {device.flow_ips}
                        </span>
                      </div>
                    )}

                    {/* Timestamps */}
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground/70 pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Created: {new Date(device.created_at).toLocaleString(undefined, {
                          month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                      {device.last_used_at && (
                        <span>
                          • Last active: {new Date(device.last_used_at).toLocaleTimeString(undefined, {
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Revoke Action */}
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
        </div>
      )}
    </div>
  )
}
