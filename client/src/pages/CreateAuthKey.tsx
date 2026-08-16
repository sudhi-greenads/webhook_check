import React, { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  KeyRound, 
  Upload, 
  Sparkles, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  FileText,
  Clock,
  ShieldCheck,
  Lock,
  RefreshCw
} from "lucide-react"
import { toast } from "sonner"
import { apiFetch } from "../lib/api"
import { PrivateKeyModal } from "../components/PrivateKeyModal"

export default function CreateAuthKey() {
  const navigate = useNavigate()
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

  // Generated key modal state
  const [generatedKeyData, setGeneratedKeyData] = useState<{
    name: string
    publicKey: string
    privateKey: string
    expiresAt: string | null
    algorithm: string
  } | null>(null)

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
        error: "PEM must begin with -----BEGIN PUBLIC KEY----- or -----BEGIN RSA PUBLIC KEY-----"
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
    } catch (err) {
      setValidationState({
        tested: true,
        valid: false,
        error: "Failed to validate key with server"
      })
    } finally {
      setIsValidating(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith(".pem") && !file.name.endsWith(".pub") && !file.name.endsWith(".key") && !file.name.endsWith(".txt")) {
      toast.error("Please upload a .pem, .pub, or .txt public key file")
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      if (content) {
        if (!name) {
          setName(file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "))
        }
        handleValidatePem(content)
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

    let payloadValidityDays: string | null = null
    let payloadCustomExpiresAt: string | null = null

    if (validityMode === "preset") {
      payloadValidityDays = validityDays
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
          setGeneratedKeyData({
            name: data.key.name,
            publicKey: data.key.public_key,
            privateKey: data.key.private_key,
            expiresAt: data.key.expires_at,
            algorithm: data.key.algorithm
          })
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
          navigate("/keys")
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
    <div className="mx-auto w-full max-w-3xl pt-4 pb-20">
      {/* Back Button */}
      <div className="mb-6 flex items-center">
        <Link to="/keys" className="flex items-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back to Auth Keys
        </Link>
      </div>

      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2.5">
          <KeyRound className="h-6 w-6 text-primary" />
          Create Auth Key
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Configure an asymmetric RSA key pair to authenticate incoming webhooks via RS256 JWT tokens.
        </p>
      </div>

      {/* Main Form Container */}
      <div className="border border-border bg-card shadow-sm rounded-xl overflow-hidden">
        
        {/* Dual Mode Switch Tabs */}
        <div className="p-6 pb-0">
          <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-muted/60 border border-border/80 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("generate")}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-md font-medium transition-all ${
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
              className={`flex items-center justify-center gap-2 py-2.5 rounded-md font-medium transition-all ${
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
          <div className="p-6 md:p-8 space-y-6">
            
            {/* Key Name / Label */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Key Label / Identifier <span className="text-primary">*</span>
              </label>
              <Input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Stripe Webhook Signer, Production Billing"
                className="bg-background text-xs h-9 font-medium"
              />
              <p className="text-[11px] text-muted-foreground">
                A descriptive name to easily identify this key across your webhook listeners.
              </p>
            </div>

            {/* Tab 1: Generate Pair Options */}
            {activeTab === "generate" && (
              <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Key Generation Security Guarantee
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  The server generates a standard <strong>RSA 2048-bit</strong> key pair. The <strong>Public Key</strong> is stored in the database. The <strong>Private Key</strong> is returned to you <strong>once</strong> in the next step and is never stored on the server.
                </p>
              </div>
            )}

            {/* Tab 2: Import Public Key Option */}
            {activeTab === "import" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-primary" />
                    RSA Public Key (PEM format) <span className="text-primary">*</span>
                  </label>
                  <label className="flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer font-medium">
                    <Upload className="h-3.5 w-3.5" />
                    <span>Upload File</span>
                    <input
                      type="file"
                      accept=".pem,.pub,.key,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <textarea
                  rows={5}
                  value={publicKeyPem}
                  onChange={(e) => handleValidatePem(e.target.value)}
                  placeholder="-----BEGIN PUBLIC KEY-----&#10;MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...&#10;-----END PUBLIC KEY-----"
                  className="w-full rounded-md border border-border bg-background p-3 font-mono text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary resize-y leading-relaxed"
                />

                {/* Live PEM Validation Feedback */}
                {validationState.tested && (
                  <div className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                    validationState.valid
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                      : "bg-rose-500/10 border-rose-500/20 text-rose-300"
                  }`}>
                    {validationState.valid ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <span className="font-semibold block">
                        {validationState.valid ? "Valid RSA Public Key" : "Validation Error"}
                      </span>
                      {validationState.valid ? (
                        <div className="text-[11px] space-y-0.5 text-emerald-400/90 font-mono">
                          <div>Key Size: {validationState.keySize} bits (RS256 ready)</div>
                          <div>Fingerprint: {validationState.fingerprint}</div>
                        </div>
                      ) : (
                        <p className="text-[11px] text-rose-400/90 leading-relaxed">
                          {validationState.error}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="h-px bg-border w-full" />

            {/* Validity & Expiration Mode */}
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-primary" />
                Validity & Expiration Period
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setValidityMode("lifelong")}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    validityMode === "lifelong"
                      ? "bg-primary/10 border-primary text-foreground font-semibold"
                      : "border-border bg-background hover:bg-muted/50 text-muted-foreground"
                  }`}
                >
                  <span className="text-xs font-bold block text-foreground">Lifelong (Never)</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5 block">
                    No expiration date. Remains active until deleted.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setValidityMode("preset")}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    validityMode === "preset"
                      ? "bg-primary/10 border-primary text-foreground font-semibold"
                      : "border-border bg-background hover:bg-muted/50 text-muted-foreground"
                  }`}
                >
                  <span className="text-xs font-bold block text-foreground">Fixed Duration</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5 block">
                    Expires automatically after a set period.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setValidityMode("custom")}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    validityMode === "custom"
                      ? "bg-primary/10 border-primary text-foreground font-semibold"
                      : "border-border bg-background hover:bg-muted/50 text-muted-foreground"
                  }`}
                >
                  <span className="text-xs font-bold block text-foreground">Custom Date</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5 block">
                    Select an exact calendar expiration date.
                  </span>
                </button>
              </div>

              {/* Preset Selector */}
              {validityMode === "preset" && (
                <div className="pt-2">
                  <select
                    value={validityDays}
                    onChange={(e) => setValidityDays(e.target.value)}
                    className="w-full sm:w-60 rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary h-9"
                  >
                    <option value="30">30 Days (1 Month)</option>
                    <option value="90">90 Days (3 Months)</option>
                    <option value="180">180 Days (6 Months)</option>
                    <option value="365">365 Days (1 Year)</option>
                  </select>
                </div>
              )}

              {/* Custom Date Picker */}
              {validityMode === "custom" && (
                <div className="pt-2">
                  <Input
                    type="date"
                    value={customExpiresAt}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setCustomExpiresAt(e.target.value)}
                    className="w-full sm:w-60 bg-background text-xs h-9"
                  />
                </div>
              )}
            </div>

          </div>

          {/* Form Actions Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-border bg-muted/30 px-6 py-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => navigate("/keys")}
              className="text-muted-foreground h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isLoading || (activeTab === "import" && (!publicKeyPem.trim() || !validationState.valid))}
              className="min-w-[120px] h-8 text-xs font-semibold shadow-sm gap-1.5"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Saving...
                </>
              ) : activeTab === "generate" ? (
                <>
                  <Sparkles className="h-3.5 w-3.5" /> Generate Key Pair
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5" /> Import Key
                </>
              )}
            </Button>
          </div>
        </form>

      </div>

      {/* Generated Private Key Modal Handover */}
      {generatedKeyData && (
        <PrivateKeyModal
          isOpen={true}
          onClose={() => {
            setGeneratedKeyData(null)
            navigate("/keys")
          }}
          keyName={generatedKeyData.name}
          publicKey={generatedKeyData.publicKey}
          privateKey={generatedKeyData.privateKey}
          expiresAt={generatedKeyData.expiresAt}
          algorithm={generatedKeyData.algorithm}
        />
      )}
    </div>
  )
}
