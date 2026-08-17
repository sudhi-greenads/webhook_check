import { useState, useEffect } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { 
  KeyRound, 
  ArrowLeft, 
  ShieldCheck, 
  Copy, 
  Check, 
  Trash2, 
  Code2, 
  Radio, 
  ExternalLink, 
  Clock, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle,
  FileCode2,
  Activity
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { apiFetch } from "../lib/api"
import { toast } from "sonner"
import { useConfirm } from "../contexts/ConfirmContext"
import { CodeSnippetModal } from "../components/CodeSnippetModal"

type LinkedWebhook = {
  id: number
  name: string
  key: string
  created_at: string
}

type AuthKeyDetailData = {
  id: number
  name: string
  algorithm: string
  public_key: string
  key_fingerprint: string
  key_size: number
  expires_at: string | null
  last_used_at: string | null
  created_at: string
  webhooks?: LinkedWebhook[]
}

export default function AuthKeyDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { confirm } = useConfirm()

  const [keyData, setKeyData] = useState<AuthKeyDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copiedPem, setCopiedPem] = useState(false)
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false)

  const fetchKeyDetails = async () => {
    if (!id) return
    try {
      setLoading(true)
      const res = await apiFetch(`/keys/${id}`)
      if (!res.ok) {
        toast.error("Auth Key not found")
        navigate("/keys")
        return
      }
      const data = await res.json()
      if (data.key) {
        setKeyData(data.key)
      }
    } catch (e) {
      toast.error("Failed to load key details")
      navigate("/keys")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchKeyDetails()
  }, [id])

  const handleCopyPem = () => {
    if (!keyData?.public_key) return
    navigator.clipboard.writeText(keyData.public_key)
    setCopiedPem(true)
    toast.success("Public key (PEM) copied to clipboard")
    setTimeout(() => setCopiedPem(false), 2000)
  }

  const handleDelete = async () => {
    if (!keyData) return
    const confirmed = await confirm({
      title: "Delete Auth Key",
      description: `Are you sure you want to delete Auth Key "${keyData.name}"? Any webhooks currently protected by this key will become unprotected.`,
      confirmText: "Delete Key",
      variant: "destructive"
    })

    if (!confirmed) return

    try {
      const res = await apiFetch(`/keys/${keyData.id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Auth key deleted successfully")
        navigate("/keys")
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to delete auth key")
      }
    } catch (err) {
      toast.error("Network error while deleting auth key")
    }
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl pt-16 flex flex-col items-center justify-center">
        <RefreshCw className="h-8 w-8 text-muted-foreground animate-spin mb-3" />
        <p className="text-sm text-muted-foreground">Loading key details...</p>
      </div>
    )
  }

  if (!keyData) return null

  const isExpired = keyData.expires_at ? new Date() > new Date(keyData.expires_at) : false

  return (
    <div className="mx-auto w-full max-w-4xl pt-4 pb-20 space-y-6">
      
      {/* Back Button & Top Navigation */}
      <div className="flex items-center justify-between">
        <Link to="/keys" className="flex items-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back to Auth Keys
        </Link>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2">
          <Link to={`/keys/verify?keyId=${keyData.id}`}>
            <Button size="sm" variant="outline" className="h-8.5 text-xs gap-1.5 bg-card text-primary border-primary/20">
              <ShieldCheck className="h-3.5 w-3.5" /> Verify Token
            </Button>
          </Link>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setIsCodeModalOpen(true)}
            className="h-8.5 text-xs gap-1.5 bg-card"
          >
            <Code2 className="h-3.5 w-3.5" /> Integration Code
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={handleDelete}
            className="h-8.5 text-xs text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </Button>
        </div>
      </div>

      {/* Main Key Overview Card */}
      <div className="rounded-xl border border-border bg-card shadow-sm p-6 space-y-6">
        
        {/* Title & Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
              <KeyRound className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {keyData.name}
              </h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded border border-border">
                  {keyData.algorithm} • {keyData.key_size} bits
                </span>
                {isExpired ? (
                  <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    <AlertTriangle className="h-3 w-3" /> Expired
                  </span>
                ) : keyData.expires_at ? (
                  <span className="inline-flex items-center gap-1 font-mono text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Clock className="h-3 w-3" /> Expires {new Date(keyData.expires_at).toLocaleDateString()}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-mono text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="h-3 w-3" /> Lifelong (Never Expires)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-lg bg-muted/30 border border-border/60 space-y-1">
            <span className="text-muted-foreground block uppercase text-[10px] font-bold tracking-wider">Fingerprint</span>
            <span className="font-mono font-medium text-foreground block truncate" title={keyData.key_fingerprint}>
              {keyData.key_fingerprint}
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-muted/30 border border-border/60 space-y-1">
            <span className="text-muted-foreground block uppercase text-[10px] font-bold tracking-wider">Created At</span>
            <span className="font-medium text-foreground block">
              {new Date(keyData.created_at).toLocaleString()}
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-muted/30 border border-border/60 space-y-1">
            <span className="text-muted-foreground block uppercase text-[10px] font-bold tracking-wider">Last Activity</span>
            <span className="font-medium text-foreground block">
              {keyData.last_used_at ? new Date(keyData.last_used_at).toLocaleString() : "Never used yet"}
            </span>
          </div>
        </div>

        {/* Public Key PEM Code Viewer */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <FileCode2 className="h-3.5 w-3.5 text-primary" />
              Public Key (SPKI PEM)
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyPem}
              className="h-7 px-2.5 text-xs gap-1 bg-background"
            >
              {copiedPem ? (
                <>
                  <Check className="h-3 w-3 text-emerald-400" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" /> Copy PEM
                </>
              )}
            </Button>
          </div>

          <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-4 text-[11.5px] font-mono text-zinc-200 overflow-x-auto leading-relaxed select-all">
            <pre className="whitespace-pre">{keyData.public_key}</pre>
          </div>
        </div>

      </div>

      {/* Linked Webhooks Section */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="border-b border-border/80 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">
              Linked Webhook Listeners ({keyData.webhooks?.length || 0})
            </h2>
          </div>
          <Link to="/webhooks/create">
            <Button size="sm" variant="outline" className="h-7.5 text-xs gap-1 bg-background">
              Link to New Webhook
            </Button>
          </Link>
        </div>

        {(!keyData.webhooks || keyData.webhooks.length === 0) ? (
          <div className="p-8 text-center space-y-2">
            <Activity className="h-7 w-7 text-muted-foreground/40 mx-auto" />
            <p className="text-xs text-muted-foreground">
              No webhook listeners are currently using this key.
            </p>
            <Link to="/webhooks/create">
              <Button variant="outline" size="sm" className="text-xs mt-2">
                Create Webhook with this Key
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {keyData.webhooks.map((wh) => (
              <div key={wh.id} className="p-4 flex items-center justify-between gap-4 hover:bg-muted/20 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">
                      /{wh.name}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border">
                      {wh.key}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground block">
                    Created {new Date(wh.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Link to={`/logs/${wh.name}/${wh.key}`}>
                    <Button variant="secondary" size="sm" className="h-7.5 px-2.5 text-xs gap-1">
                      <ExternalLink className="h-3 w-3" /> View Logs
                    </Button>
                  </Link>
                  <Link to={`/webhooks/${wh.id}/edit`}>
                    <Button variant="ghost" size="sm" className="h-7.5 px-2 text-xs text-muted-foreground hover:text-foreground">
                      Edit
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Integration Code Modal */}
      <CodeSnippetModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        keyName={keyData.name}
      />
    </div>
  )
}
