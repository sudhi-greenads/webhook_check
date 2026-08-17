import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  KeyRound, 
  Upload, 
  Sparkles, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  FileText,
  Clock
} from "lucide-react"
import { toast } from "sonner"
import { apiFetch } from "../lib/api"
import { PrivateKeyModal } from "./PrivateKeyModal"

type CreateAuthKeyModalProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreateAuthKeyModal({ isOpen, onClose, onSuccess }: CreateAuthKeyModalProps) {
  const [activeTab, setActiveTab] = useState<"generate" | "import">("generate")
  const [name, setName] = useState("")
  const [validityMode, setValidityMode] = useState<"lifelong" | "preset" | "custom">("lifelong")
  const [validityDays, setValidityDays] = useState("90")
  const [customExpiresAt, setCustomExpiresAt] = useState("")
  const [publicKeyPem, setPublicKeyPem] = useState("")
  const [validationState, setValidationState] = useState<{
    tested: boolean
    valid: boolean
    keySize?: number
    fingerprint?: string
    error?: string
  }>({ tested: false, valid: false })

  const [isLoading, setIsLoading] = useState(false)
  const [isValidating, setIsValidating] = useState(false)

  // Newly generated key modal state
  const [generatedKeyData, setGeneratedKeyData] = useState<{
    name: string
    publicKey: string
    privateKey: string
    expiresAt: string | null
    algorithm: string
  } | null>(null)

  if (!isOpen && !generatedKeyData) return null

  const handleValidatePem = async (pemText: string) => {
    setPublicKeyPem(pemText)
    if (!pemText.trim()) {
      setValidationState({ tested: false, valid: false })
      return
    }

    if (!pemText.includes("-----BEGIN PUBLIC KEY-----") && !pemText.includes("-----BEGIN RSA PUBLIC KEY-----")) {
      setValidationState({
        tested: true,
        valid: false,
        error: "Key must include -----BEGIN PUBLIC KEY----- or -----BEGIN RSA PUBLIC KEY----- header"
      })
      return
    }

    try {
      setIsValidating(true)
      const res = await apiFetch("/keys/validate", {
        method: "POST",
        body: JSON.stringify({ publicKeyPem: pemText.trim() })
      })
      const data = await res.json()
      if (res.ok && data.valid) {
        setValidationState({
          tested: true,
          valid: true,
          keySize: data.keySize,
          fingerprint: data.fingerprint
        })
      } else {
        setValidationState({
          tested: true,
          valid: false,
          error: data.error || "Invalid RSA public key"
        })
      }
    } catch (e) {
      setValidationState({
        tested: true,
        valid: false,
        error: "Failed to validate key structure"
      })
    } finally {
      setIsValidating(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      if (text) {
        handleValidatePem(text)
        toast.info(`Loaded ${file.name}`)
      }
    }
    reader.readAsText(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Key name/label is required")
      return
    }

    let payloadValidityDays: number | null = null
    let payloadCustomExpiresAt: string | null = null

    if (validityMode === "preset") {
      payloadValidityDays = parseInt(validityDays)
    } else if (validityMode === "custom") {
      if (!customExpiresAt) {
        toast.error("Please select an expiration date")
        return
      }
      payloadCustomExpiresAt = new Date(customExpiresAt).toISOString()
    }

    setIsLoading(true)

    try {
      if (activeTab === "generate") {
        const res = await apiFetch("/keys/generate", {
          method: "POST",
          body: JSON.stringify({
            name: name.trim(),
            validityDays: payloadValidityDays,
            customExpiresAt: payloadCustomExpiresAt
          })
        })
        const data = await res.json()

        if (res.ok && data.success && data.key) {
          toast.success("Key pair generated successfully")
          // Set generated key data to open PrivateKeyModal
          setGeneratedKeyData({
            name: data.key.name,
            publicKey: data.key.public_key,
            privateKey: data.key.private_key,
            expiresAt: data.key.expires_at,
            algorithm: data.key.algorithm
          })
          onSuccess()
        } else {
          toast.error(data.error || "Failed to generate key pair")
        }
      } else {
        // Import Tab
        if (!publicKeyPem.trim()) {
          toast.error("Public key is required")
          setIsLoading(false)
          return
        }

        const res = await apiFetch("/keys/import", {
          method: "POST",
          body: JSON.stringify({
            name: name.trim(),
            publicKeyPem: publicKeyPem.trim(),
            validityDays: payloadValidityDays,
            customExpiresAt: payloadCustomExpiresAt
          })
        })
        const data = await res.json()

        if (res.ok && data.success) {
          toast.success("Public key imported successfully")
          onSuccess()
          onClose()
        } else {
          toast.error(data.error || "Failed to import public key")
        }
      }
    } catch (err) {
      toast.error("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {isOpen && !generatedKeyData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-xl border border-border bg-card shadow-2xl text-card-foreground overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="border-b border-border px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                  <KeyRound className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    Create Auth Key
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Asymmetric RS256 key pair for authenticating incoming webhooks.
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Mode Switch Tabs */}
            <div className="p-6 pb-0">
              <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-muted/60 border border-border/80 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab("generate")}
                  className={`flex items-center justify-center gap-2 py-2 rounded-md font-medium transition-all ${
                    activeTab === "generate"
                      ? "bg-background text-foreground shadow-sm font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Auto-Generate Pair
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("import")}
                  className={`flex items-center justify-center gap-2 py-2 rounded-md font-medium transition-all ${
                    activeTab === "import"
                      ? "bg-background text-foreground shadow-sm font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Upload className="h-3.5 w-3.5" />
                  Import Public Key
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                
                {/* Key Name Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Key Name / Identifier</label>
                  <Input 
                    type="text" 
                    required 
                    placeholder="e.g. Production Stripe Signer or GitHub Actions Key" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    className="h-9 text-xs bg-background" 
                  />
                  <p className="text-[11px] text-muted-foreground">A memorable name to identify this key in endpoint settings.</p>
                </div>

                {/* Import Mode: Public Key PEM Input with Live Validation */}
                {activeTab === "import" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-foreground">RSA Public Key (PEM)</label>
                      <label className="cursor-pointer text-[11px] text-primary hover:underline flex items-center gap-1 font-medium">
                        <FileText className="h-3 w-3" /> Upload .pem / .pub
                        <input type="file" accept=".pem,.pub,.key,.txt" onChange={handleFileUpload} className="hidden" />
                      </label>
                    </div>

                    <textarea
                      required
                      rows={5}
                      value={publicKeyPem}
                      onChange={(e) => handleValidatePem(e.target.value)}
                      placeholder="-----BEGIN PUBLIC KEY-----&#10;MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...&#10;-----END PUBLIC KEY-----"
                      className="w-full rounded-md border border-border bg-background p-2.5 font-mono text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />

                    {/* Validation Feedback Badge */}
                    {isValidating ? (
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 animate-spin text-primary" /> Validating key format...
                      </div>
                    ) : validationState.tested && (
                      validationState.valid ? (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
                          <CheckCircle2 className="h-4 w-4 shrink-0" />
                          <span>Valid RSA ({validationState.keySize}-bit) Public Key • {validationState.fingerprint?.slice(0, 20)}...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-destructive font-medium bg-destructive/10 p-2 rounded border border-destructive/20">
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          <span>{validationState.error}</span>
                        </div>
                      )
                    )}
                  </div>
                )}

                {/* Validity Selection */}
                <div className="space-y-2 pt-1 border-t border-border">
                  <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    Key Validity / Expiration
                  </label>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setValidityMode("lifelong")}
                      className={`p-2.5 rounded-lg border text-xs text-left transition-all ${
                        validityMode === "lifelong"
                          ? "border-primary bg-primary/10 text-foreground font-semibold"
                          : "border-border bg-background text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span className="block font-medium">Lifelong</span>
                      <span className="text-[10px] text-muted-foreground">Never expires</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setValidityMode("preset")}
                      className={`p-2.5 rounded-lg border text-xs text-left transition-all ${
                        validityMode === "preset"
                          ? "border-primary bg-primary/10 text-foreground font-semibold"
                          : "border-border bg-background text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span className="block font-medium">Preset Days</span>
                      <span className="text-[10px] text-muted-foreground">30, 90, 365 days</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setValidityMode("custom")}
                      className={`p-2.5 rounded-lg border text-xs text-left transition-all ${
                        validityMode === "custom"
                          ? "border-primary bg-primary/10 text-foreground font-semibold"
                          : "border-border bg-background text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span className="block font-medium">Custom Date</span>
                      <span className="text-[10px] text-muted-foreground">Pick exact expiry</span>
                    </button>
                  </div>

                  {validityMode === "preset" && (
                    <div className="flex gap-2 pt-1">
                      {["30", "90", "180", "365"].map((days) => (
                        <button
                          key={days}
                          type="button"
                          onClick={() => setValidityDays(days)}
                          className={`flex-1 py-1 px-2 rounded border text-xs ${
                            validityDays === days
                              ? "border-primary bg-primary text-primary-foreground font-semibold"
                              : "border-border bg-background text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {days} Days
                        </button>
                      ))}
                    </div>
                  )}

                  {validityMode === "custom" && (
                    <div className="pt-1">
                      <Input
                        type="date"
                        min={new Date().toISOString().split("T")[0]}
                        value={customExpiresAt}
                        onChange={(e) => setCustomExpiresAt(e.target.value)}
                        className="h-9 text-xs bg-background"
                      />
                    </div>
                  )}
                </div>

                {activeTab === "generate" && (
                  <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground border border-border/60">
                    <p>
                      <strong>Security Note:</strong> The server will generate an RSA 2048-bit key pair. The Public Key will be saved to your dashboard, and the <strong>Private Key will be given to you immediately</strong> to sign your JWT requests.
                    </p>
                  </div>
                )}

              </div>

              {/* Footer */}
              <div className="border-t border-border bg-muted/30 px-6 py-4 flex items-center justify-end gap-2.5">
                <Button type="button" variant="ghost" size="sm" onClick={onClose} className="h-8 text-xs text-muted-foreground">
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  size="sm" 
                  disabled={isLoading || (activeTab === "import" && (!validationState.tested || !validationState.valid))} 
                  className="h-8 text-xs font-semibold"
                >
                  {isLoading ? "Creating Key..." : activeTab === "generate" ? "Generate Key Pair" : "Import Public Key"}
                </Button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Private Key Modal shown after generation */}
      {generatedKeyData && (
        <PrivateKeyModal
          isOpen={true}
          onClose={() => {
            setGeneratedKeyData(null)
            onClose()
          }}
          keyName={generatedKeyData.name}
          publicKey={generatedKeyData.publicKey}
          privateKey={generatedKeyData.privateKey}
          expiresAt={generatedKeyData.expiresAt}
          algorithm={generatedKeyData.algorithm}
        />
      )}
    </>
  )
}
