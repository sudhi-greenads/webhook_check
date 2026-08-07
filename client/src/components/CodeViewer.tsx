import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { toast } from "sonner"

interface CodeViewerProps {
  code: string
  language?: string
  title?: string
}

export function CodeViewer({ code, title }: CodeViewerProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      toast.success("Copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error("Failed to copy code")
    }
  }

  return (
    <div className="relative group rounded-md border border-border bg-[#18181b] overflow-hidden">
      {title && (
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/40 bg-[#18181b]">
          <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">{title}</span>
        </div>
      )}
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded-md bg-white/5 text-white/40 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10 hover:text-white z-10"
        title="Copy to clipboard"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
      <pre className="p-3 text-[11px] leading-relaxed font-mono text-[#e4e4e7] overflow-x-auto max-h-[300px] custom-scrollbar">
        <code>{code}</code>
      </pre>
    </div>
  )
}
