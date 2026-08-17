import { useState } from "react"
import { Copy, Check, Terminal } from "lucide-react"
import { toast } from "sonner"

export type CodeTab = {
  id: string
  label: string
  filename: string
  language: string
  code: string
}

type CodeShellViewerProps = {
  title?: string
  tabs: CodeTab[]
  defaultTabId?: string
}

export function CodeShellViewer({
  title = "Terminal - Webhook Sender",
  tabs,
  defaultTabId
}: CodeShellViewerProps) {
  const [activeTabId, setActiveTabId] = useState<string>(
    defaultTabId || (tabs.length > 0 ? tabs[0].id : "")
  )
  const [copied, setCopied] = useState(false)

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0]

  const handleCopy = () => {
    if (!activeTab) return
    navigator.clipboard.writeText(activeTab.code)
    setCopied(true)
    toast.success(`Copied ${activeTab.filename} to clipboard`)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!activeTab) return null

  const lines = activeTab.code.split("\n")

  return (
    <div className="rounded-xl border border-border bg-[#0d1117] shadow-2xl overflow-hidden text-zinc-200 font-mono my-4">
      {/* Shell Title Bar with macOS dots */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#161b22] border-b border-[#30363d] select-none">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 mr-2">
            <div className="h-3 w-3 rounded-full bg-[#ff5f56] border border-[#e0443e]/50" />
            <div className="h-3 w-3 rounded-full bg-[#ffbd2e] border border-[#dea123]/50" />
            <div className="h-3 w-3 rounded-full bg-[#27c93f] border border-[#1aab29]/50" />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-sans font-medium">
            <Terminal className="h-3.5 w-3.5 text-primary" />
            <span>{title}</span>
          </div>
        </div>

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-sans font-medium bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-zinc-300 transition-colors"
          title="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 text-zinc-400" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Language / File Tabs */}
      {tabs.length > 1 && (
        <div className="flex items-center gap-1 px-3 pt-2 bg-[#161b22] border-b border-[#30363d] overflow-x-auto text-xs">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-md font-sans text-xs transition-all border-t border-x ${
                  isActive
                    ? "bg-[#0d1117] text-foreground font-semibold border-[#30363d] border-b-transparent -mb-[1px]"
                    : "text-zinc-400 hover:text-zinc-200 border-transparent hover:bg-[#21262d]/50"
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-[10px] text-zinc-500 font-mono">({tab.filename})</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Code Editor Body with Line Numbers */}
      <div className="p-4 overflow-x-auto max-h-[520px] text-[12.5px] leading-relaxed select-text">
        <div className="flex">
          {/* Line Numbers Column */}
          <div className="select-none text-zinc-600 text-right pr-4 border-r border-[#30363d]/60 mr-4 font-mono text-xs">
            {lines.map((_, idx) => (
              <div key={idx} className="leading-relaxed">
                {idx + 1}
              </div>
            ))}
          </div>

          {/* Actual Code Column */}
          <div className="flex-1 font-mono text-zinc-200 whitespace-pre">
            {activeTab.code}
          </div>
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#161b22] border-t border-[#30363d] text-[11px] text-zinc-400 font-sans select-none">
        <div className="flex items-center gap-3">
          <span>Language: <strong>{activeTab.language}</strong></span>
          <span>File: <code>{activeTab.filename}</code></span>
        </div>
        <div>
          <span>UTF-8 • RS256 JWT Ready</span>
        </div>
      </div>
    </div>
  )
}
