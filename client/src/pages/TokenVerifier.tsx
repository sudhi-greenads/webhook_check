import { useState, useEffect, useMemo, useCallback } from "react"
import { useSearchParams, Link } from "react-router-dom"
import { 
  ShieldCheck, 
  ShieldAlert, 
  ShieldX, 
  KeyRound, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Code2, 
  Copy, 
  ExternalLink,
  Lock,
  ArrowRight,
  Terminal,
  Check,
  Zap
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { apiFetch } from "../lib/api"
import { toast } from "sonner"

type SimpleKey = {
  id: number
  name: string
  algorithm: string
  key_fingerprint: string
  expires_at: string | null
}

type VerificationResult = {
  valid: boolean
  code: string
  error: string | null
  header?: Record<string, any>
  payload?: Record<string, any>
  key?: {
    id: number
    name: string
    algorithm: string
    fingerprint: string
    key_size: number
    expires_at: string | null
    is_expired: boolean
  }
  diagnostics?: {
    algorithm_match: boolean
    token_algorithm: string
    expected_algorithm: string
    is_key_expired: boolean
    is_token_expired: boolean
    time_until_expiration: string
    issued_at_readable: string
    expires_at_readable: string
    issuer: string
    audience: string
  }
}

// Client-side quick JWT decoder
function decodeClientJwt(rawToken: string) {
  try {
    let token = rawToken.trim()
    if (token.startsWith("Bearer ")) token = token.substring(7).trim()
    
    const parts = token.split(".")
    if (parts.length !== 3) return null

    const header = JSON.parse(atob(parts[0].replace(/-/g, "+").replace(/_/g, "/")))
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")))

    return { header, payload, cleanedToken: token }
  } catch (e) {
    return null
  }
}

export default function TokenVerifier() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialKeyId = searchParams.get("keyId") || ""
  const initialToken = searchParams.get("token") || ""

  const [keys, setKeys] = useState<SimpleKey[]>([])
  const [loadingKeys, setLoadingKeys] = useState(true)
  const [keySearch, setKeySearch] = useState("")
  const [selectedKeyId, setSelectedKeyId] = useState<string>(initialKeyId)
  
  const [rawToken, setRawToken] = useState<string>(initialToken)
  const [verifying, setVerifying] = useState(false)
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [copiedSection, setCopiedSection] = useState<string | null>(null)

  // Fetch active keys
  const fetchKeys = useCallback(async () => {
    try {
      setLoadingKeys(true)
      const res = await apiFetch("/keys/active?limit=100")
      const data = await res.json()
      if (data.data) {
        setKeys(data.data)
        // If initialKeyId wasn't set, default to first key
        if (!initialKeyId && data.data.length > 0) {
          setSelectedKeyId(String(data.data[0].id))
        }
      }
    } catch (e) {
      toast.error("Failed to load auth keys for selector")
    } finally {
      setLoadingKeys(false)
    }
  }, [initialKeyId])

  useEffect(() => {
    fetchKeys()
  }, [fetchKeys])

  // Synchronize URL query params on change
  useEffect(() => {
    const params = new URLSearchParams()
    if (selectedKeyId) params.set("keyId", selectedKeyId)
    if (rawToken && rawToken.length < 500) params.set("token", rawToken)
    setSearchParams(params, { replace: true })
  }, [selectedKeyId, rawToken, setSearchParams])

  // Filtered keys for search
  const filteredKeys = useMemo(() => {
    if (!keySearch.trim()) return keys
    const q = keySearch.toLowerCase()
    return keys.filter(
      (k) =>
        k.name.toLowerCase().includes(q) ||
        k.key_fingerprint.toLowerCase().includes(q)
    )
  }, [keys, keySearch])

  const selectedKey = useMemo(() => {
    return keys.find((k) => String(k.id) === selectedKeyId) || null
  }, [keys, selectedKeyId])

  // Client-side real-time preview
  const clientDecoded = useMemo(() => {
    return decodeClientJwt(rawToken)
  }, [rawToken])

  const handleVerify = async () => {
    if (!selectedKeyId) {
      toast.error("Please select an Auth Key to verify against")
      return
    }
    if (!rawToken.trim()) {
      toast.error("Please enter a JWT token string")
      return
    }

    try {
      setVerifying(true)
      setResult(null)

      const res = await apiFetch("/keys/verify-token", {
        method: "POST",
        body: JSON.stringify({
          keyId: parseInt(selectedKeyId),
          token: rawToken
        })
      })

      const data = await res.json()
      if (data.success && data.verification) {
        setResult(data.verification)
        if (data.verification.valid) {
          toast.success("Token verified successfully! Signature is valid.")
        } else {
          toast.error(data.verification.error || "Token verification failed.")
        }
      } else {
        toast.error(data.error || "Failed to verify token")
      }
    } catch (err) {
      toast.error("Network error while communicating with verification server")
    } finally {
      setVerifying(false)
    }
  }

  const handleCopy = (text: string, sectionName: string) => {
    navigator.clipboard.writeText(text)
    setCopiedSection(sectionName)
    toast.success(`Copied ${sectionName}`)
    setTimeout(() => setCopiedSection(null), 2000)
  }

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setRawToken(text)
      toast.success("Pasted token from clipboard")
    } catch (e) {
      toast.error("Could not read clipboard")
    }
  }

  return (
    <div className="flex flex-col gap-6 pt-4 pb-20 max-w-[1200px] mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground flex items-center gap-2.5">
            <ShieldCheck className="h-7 w-7 text-primary" />
            Token Verification & Diagnostic Tool
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
            Test, inspect, and validate incoming RS256 JWT tokens against registered public keys in real time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/docs/troubleshooting">
            <Button variant="outline" size="sm" className="h-9 text-xs gap-1.5">
              <ExternalLink className="h-3.5 w-3.5" /> Verification Docs
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Input Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Key Selector & Token Input (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Key Selection Card */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <KeyRound className="h-4 w-4 text-primary" />
                Step 1: Select Public Key
              </label>
              {selectedKey && (
                <span className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border">
                  ID: #{selectedKey.id}
                </span>
              )}
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filter keys by name or fingerprint..."
                  value={keySearch}
                  onChange={(e) => setKeySearch(e.target.value)}
                  className="pl-8 h-9 text-xs bg-background"
                />
              </div>

              <select
                value={selectedKeyId}
                onChange={(e) => {
                  setSelectedKeyId(e.target.value)
                  setResult(null)
                }}
                disabled={loadingKeys || keys.length === 0}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary h-10"
              >
                {keys.length === 0 && <option value="">No active keys found</option>}
                {filteredKeys.map((k) => (
                  <option key={k.id} value={k.id}>
                    🔒 {k.name} ({k.algorithm}) • {k.key_fingerprint.slice(0, 16)}...
                  </option>
                ))}
              </select>
            </div>

            {selectedKey && (
              <div className="p-3 rounded-lg bg-muted/40 border border-border/70 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Fingerprint:</span>
                  <span className="font-mono text-foreground font-medium text-[11px] truncate max-w-[280px]">
                    {selectedKey.key_fingerprint}
                  </span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Validity:</span>
                  <span className="font-semibold text-emerald-400">
                    {selectedKey.expires_at ? `Expires ${new Date(selectedKey.expires_at).toLocaleDateString()}` : "Lifelong (No Expiration)"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Token Input Card */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-primary" />
                Step 2: Enter JWT Token / Header
              </label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handlePaste}
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Copy className="mr-1 h-3 w-3" /> Paste
                </Button>
                {rawToken && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setRawToken("")
                      setResult(null)
                    }}
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>

            <textarea
              rows={6}
              value={rawToken}
              onChange={(e) => {
                setRawToken(e.target.value)
                setResult(null)
              }}
              placeholder="Paste Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9... or raw token string"
              className="w-full rounded-lg border border-border bg-background p-3 font-mono text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary resize-y"
            />

            <div className="flex items-center justify-between gap-3 pt-2">
              <span className="text-[11px] text-muted-foreground">
                Accepts raw JWT or <code>Authorization: Bearer &lt;token&gt;</code>
              </span>
              <Button
                onClick={handleVerify}
                disabled={verifying || !rawToken.trim() || !selectedKeyId}
                size="sm"
                className="h-9 px-4 text-xs font-semibold shadow-sm gap-1.5 shrink-0"
              >
                {verifying ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Verifying...
                  </>
                ) : (
                  <>
                    <Zap className="h-3.5 w-3.5" /> Verify Signature
                  </>
                )}
              </Button>
            </div>
          </div>

        </div>

        {/* Right Column: Live Inspector & Server Results (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Server Verification Outcome Card */}
          {result ? (
            <div className={`rounded-xl border p-5 shadow-sm space-y-4 ${
              result.valid 
                ? "bg-emerald-500/5 border-emerald-500/30 text-emerald-400" 
                : "bg-rose-500/5 border-rose-500/30 text-rose-400"
            }`}>
              <div className="flex items-start gap-3">
                {result.valid ? (
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400 shrink-0">
                    <XCircle className="h-5 w-5" />
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    {result.valid ? "Signature Verified & Valid" : "Verification Failed"}
                  </h3>
                  <p className="text-xs mt-0.5 text-muted-foreground leading-relaxed">
                    {result.valid 
                      ? "The token was cryptographically signed with the corresponding RSA Private Key and is active."
                      : result.error || "Token signature or structure is invalid."}
                  </p>
                </div>
              </div>

              {/* Diagnostic Checklist */}
              {result.diagnostics && (
                <div className="space-y-2 pt-2 border-t border-border/50 text-xs">
                  <div className="flex items-center justify-between text-foreground">
                    <span className="text-muted-foreground">Key Status:</span>
                    <span className={`font-semibold ${result.diagnostics.is_key_expired ? "text-rose-400" : "text-emerald-400"}`}>
                      {result.diagnostics.is_key_expired ? "Expired Key" : "Active Key"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-foreground">
                    <span className="text-muted-foreground">Algorithm Match:</span>
                    <span className={`font-semibold ${result.diagnostics.algorithm_match ? "text-emerald-400" : "text-rose-400"}`}>
                      {result.diagnostics.token_algorithm} {result.diagnostics.algorithm_match ? "✓" : "(Expected RS256)"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-foreground">
                    <span className="text-muted-foreground">Token Expiration:</span>
                    <span className={`font-semibold ${result.diagnostics.is_token_expired ? "text-rose-400" : "text-emerald-400"}`}>
                      {result.diagnostics.time_until_expiration}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Issued At:</span>
                    <span className="text-foreground">{result.diagnostics.issued_at_readable}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-card/50 p-6 text-center space-y-2">
              <ShieldCheck className="h-8 w-8 text-muted-foreground/40 mx-auto" />
              <h4 className="text-xs font-semibold text-foreground">Awaiting Signature Verification</h4>
              <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
                Select an Auth Key, input your JWT token, and click <strong>Verify Signature</strong> to run cryptographic RS256 validation.
              </p>
            </div>
          )}

          {/* Client Decoded Header & Payload Preview */}
          {clientDecoded && (
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Code2 className="h-4 w-4 text-primary" />
                  Decoded Claims Preview
                </span>
                <button
                  onClick={() => handleCopy(JSON.stringify(clientDecoded.payload, null, 2), "Payload JSON")}
                  className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  {copiedSection === "Payload JSON" ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" /> Copy Claims
                    </>
                  )}
                </button>
              </div>

              {/* Claims JSON Shell */}
              <div className="rounded-lg bg-[#0d1117] border border-[#30363d] p-3 text-[11.5px] font-mono text-zinc-200 overflow-x-auto max-h-60 leading-relaxed">
                <pre className="whitespace-pre">
                  {JSON.stringify(clientDecoded.payload, null, 2)}
                </pre>
              </div>

              {/* Header JSON Shell */}
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground">Header:</span>
                <div className="rounded-lg bg-[#0d1117] border border-[#30363d] p-2.5 text-[11px] font-mono text-zinc-300 overflow-x-auto">
                  <pre className="whitespace-pre">
                    {JSON.stringify(clientDecoded.header, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  )
}
