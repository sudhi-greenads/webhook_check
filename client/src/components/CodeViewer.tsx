import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { toast } from "sonner"

interface CodeViewerProps {
  code: string | object | null | undefined
  language?: string
  title?: string
}

export function CodeViewer({ code, title }: CodeViewerProps) {
  const [copied, setCopied] = useState(false)

  const formattedCode = typeof code === 'string' 
    ? code 
    : code === null || code === undefined 
      ? 'null' 
      : JSON.stringify(code, null, 2)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedCode)
      setCopied(true)
      toast.success(`${title || 'Payload'} copied to clipboard`)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error("Failed to copy to clipboard")
    }
  }

  return (
    <div className="relative group rounded-lg border border-border bg-[#141416] overflow-hidden shadow-xs">
      {title && (
        <div className="flex items-center justify-between px-3.5 py-2 border-b border-border/50 bg-[#1a1a1e]">
          <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase font-mono">
            {title}
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 transition-colors"
            title="Copy content"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      )}
      <pre className="p-3.5 text-[11px] leading-relaxed font-mono text-[#e4e4e7] overflow-x-auto max-h-[320px] custom-scrollbar selection:bg-primary/30">
        <code>{formattedCode}</code>
      </pre>
    </div>
  )
}
