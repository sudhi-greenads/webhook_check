export function HttpReferenceDoc() {
  return (
    <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
      <p>
        All webhook listeners return standardized HTTP status codes and JSON/text payloads:
      </p>

      <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/40 border-b border-border font-semibold text-muted-foreground">
              <tr>
                <th className="p-3 text-left w-28">Status</th>
                <th className="p-3 text-left w-52">Response Body</th>
                <th className="p-3 text-left">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              <tr>
                <td className="p-3 font-mono font-bold text-emerald-400">200 OK</td>
                <td className="p-3 font-mono text-muted-foreground">"ok"</td>
                <td className="p-3 text-muted-foreground">Request verified & logged successfully.</td>
              </tr>
              <tr>
                <td className="p-3 font-mono font-bold text-rose-400">401 Unauthorized</td>
                <td className="p-3 font-mono text-muted-foreground">{"{\"error\":\"Missing Authorization header\"}"}</td>
                <td className="p-3 text-muted-foreground">Bearer token header was not provided.</td>
              </tr>
              <tr>
                <td className="p-3 font-mono font-bold text-rose-400">401 Unauthorized</td>
                <td className="p-3 font-mono text-muted-foreground">{"{\"error\":\"Invalid token signature\"}"}</td>
                <td className="p-3 text-muted-foreground">Signature failed verification with stored public key.</td>
              </tr>
              <tr>
                <td className="p-3 font-mono font-bold text-rose-400">401 Unauthorized</td>
                <td className="p-3 font-mono text-muted-foreground">{"{\"error\":\"Auth key has expired\"}"}</td>
                <td className="p-3 text-muted-foreground">The assigned Auth Key has passed its expiration date.</td>
              </tr>
              <tr>
                <td className="p-3 font-mono font-bold text-rose-400">401 Unauthorized</td>
                <td className="p-3 font-mono text-muted-foreground">{"{\"error\":\"Token issuer_id does not match...\"}"}</td>
                <td className="p-3 text-muted-foreground">Token was generated for a different webhook ID.</td>
              </tr>
              <tr>
                <td className="p-3 font-mono font-bold text-zinc-400">404 Not Found</td>
                <td className="p-3 font-mono text-muted-foreground">{"{\"error\":\"Webhook not registered\"}"}</td>
                <td className="p-3 text-muted-foreground">Invalid identifier or secret key path segments.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
