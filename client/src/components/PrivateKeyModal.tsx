import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { ShieldAlert, Copy, Check, Download, KeyRound, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

type PrivateKeyModalProps = {
  isOpen: boolean
  onClose: () => void
  keyName: string
  privateKey: string
  publicKey: string
  expiresAt: string | null
  algorithm?: string
}

export function PrivateKeyModal({
  isOpen,
  onClose,
  keyName,
  privateKey,
  publicKey: _publicKey,
  expiresAt,
  algorithm = "RS256"
}: PrivateKeyModalProps) {
  const [copied, setCopied] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  if (!isOpen) return null

  const handleCopy = () => {
    navigator.clipboard.writeText(privateKey)
    setCopied(true)
    toast.success("Private key copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const filename = `${keyName.toLowerCase().replace(/[^a-z0-9_-]/g, "_")}_private_key.pem`
    const blob = new Blob([privateKey], { type: "application/x-pem-file" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success(`Downloaded ${filename}`)
  }

  const handleClose = () => {
    if (!confirmed) {
      toast.warning("Please confirm you have saved your private key before closing")
      return
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-xl border border-border bg-card shadow-2xl text-card-foreground overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header Banner */}
        <div className="border-b border-border bg-amber-500/10 px-6 py-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-amber-200">
              Save Your Private Key Now
            </h2>
            <p className="text-xs text-amber-300/80">
              This private key is <strong>never stored on the server</strong> and will <strong>never be shown again</strong>.
            </p>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 space-y-5">
          {/* Key Details Metadata Pill */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-lg bg-muted/40 border border-border/60 text-xs">
            <div>
              <span className="text-muted-foreground block">Key Name</span>
              <span className="font-semibold text-foreground truncate block">{keyName}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Algorithm</span>
              <span className="font-mono font-medium text-foreground">{algorithm} (RSA 2048)</span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-muted-foreground block">Validity</span>
              <span className="font-medium text-foreground">
                {expiresAt ? `Valid until ${new Date(expiresAt).toLocaleDateString()}` : "Lifelong (Never)"}
              </span>
            </div>
          </div>

          {/* Private Key Code View */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 text-primary" />
                RSA Private Key (PEM format)
              </label>
              <div className="flex items-center gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDownload} 
                  className="h-7 px-2.5 text-xs gap-1.5 bg-background hover:bg-muted"
                >
                  <Download className="h-3.5 w-3.5" /> Download .pem
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCopy} 
                  className="h-7 px-2.5 text-xs gap-1.5 bg-background hover:bg-muted"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>

            <div className="relative rounded-lg border border-border bg-black/90 p-3 font-mono text-[11px] text-emerald-400 leading-relaxed overflow-x-auto max-h-56 select-all">
              <pre className="whitespace-pre">{privateKey}</pre>
            </div>
          </div>

          {/* Safety Acknowledgment */}
          <label className="flex items-start gap-3 p-3 rounded-lg border border-border bg-background cursor-pointer hover:bg-muted/30 transition-colors">
            <input 
              type="checkbox" 
              checked={confirmed} 
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary accent-primary" 
            />
            <span className="text-xs text-muted-foreground select-none">
              I have copied or downloaded my private key to a secure location. I understand that without this key, I will not be able to sign JWT tokens for webhooks linked to this Auth Key.
            </span>
          </label>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-border bg-muted/30 px-6 py-4 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Public key is registered in your account.
          </span>
          <Button 
            type="button" 
            size="sm" 
            disabled={!confirmed} 
            onClick={handleClose} 
            className="h-9 px-4 text-xs font-semibold gap-1.5"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Done & Continue
          </Button>
        </div>

      </div>
    </div>
  )
}
