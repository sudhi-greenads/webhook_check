import { AlertTriangle } from "lucide-react"

export function TroubleshootingDoc() {
  return (
    <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
      <h2 className="text-base font-bold text-foreground">Common Issues & Solutions:</h2>

      <div className="space-y-4">
        <div className="p-4 rounded-xl border border-border bg-card space-y-2">
          <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            "Invalid token signature: invalid signature"
          </h3>
          <p className="text-xs">
            <strong>Fix:</strong> Ensure the private key used by your sender matches the public key uploaded to the dashboard, and that the algorithm specified in both is <code>RS256</code>.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card space-y-2">
          <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            "Missing Authorization header"
          </h3>
          <p className="text-xs">
            <strong>Fix:</strong> Ensure your HTTP client transmits <code>Authorization: Bearer &lt;your_jwt&gt;</code> (with the <code>Bearer </code> prefix).
          </p>
        </div>
      </div>
    </div>
  )
}
