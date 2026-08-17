import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  KeyRound, 
  Plus, 
  Trash2, 
  Copy, 
  Code2, 
  RefreshCw, 
  Search, 
  Radio, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Clock,
  ShieldCheck
} from "lucide-react"
import { toast } from "sonner"
import { apiFetch } from "../lib/api"
import { PaginationControls } from "../components/PaginationControls"
import { CreateAuthKeyModal } from "../components/CreateAuthKeyModal"
import { CodeSnippetModal } from "../components/CodeSnippetModal"
import { Link } from "react-router-dom"
import { useConfirm } from "../contexts/ConfirmContext"

type AuthKey = {
  id: number
  name: string
  algorithm: string
  public_key: string
  key_fingerprint: string
  key_size: number
  expires_at: string | null
  last_used_at: string | null
  created_at: string
  webhook_count: number
}

export default function AuthKeysList() {
  const { confirm } = useConfirm()
  const [keys, setKeys] = useState<AuthKey[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState("")
  const [search, setSearch] = useState("")

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedCodeKey, setSelectedCodeKey] = useState<AuthKey | null>(null)

  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const limit = 10

  const fetchKeys = useCallback(async (currentPage: number) => {
    setLoading(true)
    setErrorMsg("")
    try {
      const params = new URLSearchParams()
      params.append("page", currentPage.toString())
      params.append("limit", limit.toString())
      if (search) params.append("search", search)

      const res = await apiFetch(`/keys?${params.toString()}`)
      const data = await res.json()
      if (data.data) {
        setKeys(data.data)
        setTotalPages(data.totalPages || 1)
      }
    } catch (e) {
      setErrorMsg("Failed to load auth keys.")
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    fetchKeys(page)
  }, [page, fetchKeys])

  const handleDelete = async (id: number, name: string) => {
    const ok = await confirm({
      title: "Delete Auth Key",
      description: `Are you sure you want to delete Auth Key "${name}"? Any webhooks currently using this key will become unprotected.`,
      confirmText: "Delete Key",
      variant: "destructive"
    })

    if (!ok) return

    try {
      const res = await apiFetch(`/keys/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Auth key deleted successfully")
        fetchKeys(page)
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to delete auth key")
      }
    } catch (e) {
      toast.error("Failed to delete auth key")
    }
  }

  const handleCopyPublicKey = (key: AuthKey) => {
    navigator.clipboard.writeText(key.public_key)
    toast.success("Public key PEM copied to clipboard")
  }

  const getValidityBadge = (expiresAt: string | null) => {
    if (!expiresAt) {
      return (
        <span className="inline-flex items-center gap-1 font-mono text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="h-3 w-3" />
          Lifelong
        </span>
      )
    }

    const expiryDate = new Date(expiresAt)
    const now = new Date()
    const diffDays = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays <= 0) {
      return (
        <span className="inline-flex items-center gap-1 font-mono text-[11px] font-medium px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
          <XCircle className="h-3 w-3" />
          Expired
        </span>
      )
    }

    if (diffDays <= 7) {
      return (
        <span className="inline-flex items-center gap-1 font-mono text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <AlertTriangle className="h-3 w-3" />
          Expires in {diffDays}d
        </span>
      )
    }

    return (
      <span className="inline-flex items-center gap-1 font-mono text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-foreground border border-border">
        <Clock className="h-3 w-3 text-muted-foreground" />
        Valid until {expiryDate.toLocaleDateString()}
      </span>
    )
  }

  return (
    <div className="flex flex-col gap-6 pt-6 max-w-[1200px] mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground flex items-center gap-2.5">
            <KeyRound className="h-7 w-7 text-primary" />
            Auth Keys
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Manage your RSA-2048 public keys used to authenticate incoming webhooks via RS256 JWT tokens.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchKeys(page)} 
            disabled={loading}
            className="h-9 text-xs bg-background"
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Link to="/keys/verify">
            <Button variant="outline" size="sm" className="h-9 text-xs bg-background gap-1.5 text-primary border-primary/20">
              <ShieldCheck className="h-3.5 w-3.5" /> Verify Token
            </Button>
          </Link>
          <Link to="/keys/create">
            <Button size="sm" className="h-9 text-xs shadow-sm">
              <Plus className="mr-1.5 h-4 w-4" /> Create Auth Key
            </Button>
          </Link>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search keys by name or fingerprint..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-8 h-9 text-xs bg-card"
          />
        </div>
      </div>

      {errorMsg && (
        <div className="text-destructive text-xs font-medium bg-destructive/10 p-3 rounded-lg border border-destructive/20">
          {errorMsg}
        </div>
      )}

      {/* Table Card */}
      <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
        <div className="w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="border-b border-border bg-muted/30">
              <tr className="text-left font-medium text-muted-foreground">
                <th className="h-11 px-4 align-middle text-xs font-semibold uppercase tracking-wider">Key Label & Fingerprint</th>
                <th className="h-11 px-4 align-middle text-xs font-semibold uppercase tracking-wider">Algorithm</th>
                <th className="h-11 px-4 align-middle text-xs font-semibold uppercase tracking-wider">Validity</th>
                <th className="h-11 px-4 align-middle text-xs font-semibold uppercase tracking-wider text-center">Linked Webhooks</th>
                <th className="h-11 px-4 align-middle text-xs font-semibold uppercase tracking-wider hidden md:table-cell">Created / Last Used</th>
                <th className="h-11 px-4 align-middle text-xs font-semibold uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading && keys.length === 0 ? (
                <tr>
                  <td colSpan={6} className="h-36 text-center text-sm text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground/50" />
                      <span>Loading auth keys...</span>
                    </div>
                  </td>
                </tr>
              ) : keys.length === 0 ? (
                <tr>
                  <td colSpan={6} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <ShieldCheck className="h-8 w-8 text-muted-foreground/30 mb-3" />
                      <p className="text-sm text-muted-foreground font-medium">No auth keys found.</p>
                      <p className="text-xs text-muted-foreground/70 mt-1 mb-4">
                        Generate or import your first RSA key to start securing your webhooks with JWT authentication.
                      </p>
                      <Link to="/keys/create">
                        <Button variant="outline" size="sm" className="text-xs">
                          <Plus className="mr-1.5 h-3.5 w-3.5" /> Create Auth Key
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                keys.map((k) => (
                  <tr key={k.id} className="transition-colors hover:bg-muted/30 group">
                    
                    {/* Name & Fingerprint */}
                    <td className="p-4 align-middle">
                      <div className="flex items-start gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0 mt-0.5">
                          <KeyRound className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <Link 
                            to={`/keys/${k.id}`}
                            className="text-foreground font-semibold text-sm hover:underline block"
                          >
                            {k.name}
                          </Link>
                          <span className="font-mono text-[11px] text-muted-foreground block truncate max-w-[200px]" title={k.key_fingerprint}>
                            {k.key_fingerprint || "SHA256:..."}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Algorithm & Key Size */}
                    <td className="p-4 align-middle">
                      <span className="font-mono text-xs text-foreground bg-muted px-2 py-0.5 rounded border border-border">
                        {k.algorithm} • {k.key_size || 2048}b
                      </span>
                    </td>

                    {/* Validity Badge */}
                    <td className="p-4 align-middle">
                      {getValidityBadge(k.expires_at)}
                    </td>

                    {/* Linked Webhooks */}
                    <td className="p-4 align-middle text-center">
                      <span className={`inline-flex items-center gap-1 font-mono text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                        k.webhook_count > 0 
                          ? 'bg-primary/10 text-primary border-primary/20' 
                          : 'bg-muted text-muted-foreground border-border'
                      }`}>
                        <Radio className="h-3 w-3" />
                        {k.webhook_count} {k.webhook_count === 1 ? 'webhook' : 'webhooks'}
                      </span>
                    </td>

                    {/* Created & Last Used */}
                    <td className="p-4 align-middle text-muted-foreground text-xs hidden md:table-cell">
                      <div>
                        <span className="text-foreground text-[11px] block">
                          Created {new Date(k.created_at).toLocaleDateString()}
                        </span>
                        <span className="text-muted-foreground text-[10px] block">
                          {k.last_used_at ? `Used ${new Date(k.last_used_at).toLocaleDateString()}` : "Never used yet"}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="p-4 align-middle text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link to={`/keys/verify?keyId=${k.id}`}>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-8 px-2.5 text-xs gap-1 text-primary hover:text-primary"
                            title="Verify Token against this key"
                          >
                            <ShieldCheck className="h-3 w-3" />
                            Verify
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedCodeKey(k)}
                          className="h-8 px-2 text-xs gap-1"
                          title="Generate Integration Code"
                        >
                          <Code2 className="h-3 w-3" />
                          Code
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopyPublicKey(k)}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="Copy Public Key (PEM)"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(k.id, k.name)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title="Delete Auth Key"
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

        {keys.length > 0 && (
          <div className="border-t border-border bg-muted/20 px-4 py-2">
            <PaginationControls
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Create Auth Key Modal */}
      <CreateAuthKeyModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => fetchKeys(page)}
      />

      {/* Code Snippet Modal */}
      {selectedCodeKey && (
        <CodeSnippetModal
          isOpen={true}
          onClose={() => setSelectedCodeKey(null)}
          keyName={selectedCodeKey.name}
          webhookUrl="https://your-domain.com/webhook/endpoint-name/secret-key"
        />
      )}
    </div>
  )
}
