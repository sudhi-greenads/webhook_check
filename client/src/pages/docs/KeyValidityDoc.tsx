export function KeyValidityDoc() {
  return (
    <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
      <p>
        Our system supports flexible key expiration configurations to align with your organization's security and key rotation policies.
      </p>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card space-y-2">
          <span className="font-mono text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            Lifelong (Never)
          </span>
          <p className="text-xs text-muted-foreground">
            The key remains valid indefinitely until manually deleted. Ideal for long-term internal services.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card space-y-2">
          <span className="font-mono text-xs font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            Preset (30/90/365d)
          </span>
          <p className="text-xs text-muted-foreground">
            Automatically expires after the specified period, prompting key rotation.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card space-y-2">
          <span className="font-mono text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
            Custom Date
          </span>
          <p className="text-xs text-muted-foreground">
            Choose an exact calendar expiration date to coincide with project deadlines or client contracts.
          </p>
        </div>
      </div>
    </div>
  )
}
