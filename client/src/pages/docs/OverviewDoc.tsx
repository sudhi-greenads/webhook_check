import { Link } from "react-router-dom"
import { Lock, ShieldCheck, Layers, Info } from "lucide-react"

export function OverviewDoc() {
  return (
    <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
      <p>
        Webhook authentication allows you to securely verify that incoming HTTP payloads originate from authorized clients. Using <strong>Asymmetric Public-Key Cryptography (RS256)</strong>, senders cryptographically sign their requests with an RSA Private Key, and our webhook listener validates the signature using the registered RSA Public Key.
      </p>

      {/* ASCII Flow Diagram */}
      <div className="rounded-xl border border-border bg-[#0d1117] p-4 text-[11.5px] font-mono text-zinc-300 overflow-x-auto select-all leading-relaxed my-4">
        <pre className="whitespace-pre">{`┌─────────────────────────┐                                 ┌────────────────────────┐
│      Webhook Sender     │                                 │     Webhook Server     │
│  (Holds RSA Private Key)│                                 │ (Holds RSA Public Key) │
└───────────┬─────────────┘                                 └───────────┬────────────┘
            │                                                           │
            │  1. Sign JWT with Private Key (RS256)                     │
            │     Header: { "alg": "RS256", "typ": "JWT" }              │
            │     Payload: {                                            │
            │       "iss": "webhook-sender-app",                        │
            │       "issuer_id": 12, // Same as webhook ID              │
            │       "aud": "webhook-service",                           │
            │       "exp": 1700000300,                                  │
            │       "iat": 1700000000                                   │
            │     }                                                     │
            │                                                           │
            │  2. HTTP POST /webhook/:name/:key                         │
            │     Header: Authorization: Bearer <jwt_token>             │
            │     Body: { ...event data... }                            │
            ├──────────────────────────────────────────────────────────>│
            │                                                           │
            │                                                           │ 3. Verify JWT with
            │                                                           │    stored Public Key
            │                                                           │
            │  4. HTTP 200 OK ('ok') or 401 Unauthorized                │
            │<──────────────────────────────────────────────────────────┤`}</pre>
      </div>

      <div className="grid md:grid-cols-3 gap-4 my-6">
        <div className="p-4 rounded-xl border border-border bg-card space-y-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Lock className="h-4 w-4" />
          </div>
          <h3 className="text-xs font-bold text-foreground">Zero Private Key Exposure</h3>
          <p className="text-xs text-muted-foreground">
            The database only stores your public key. Your private key is kept strictly on your servers.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card space-y-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <h3 className="text-xs font-bold text-foreground">RS256 JWT Verification</h3>
          <p className="text-xs text-muted-foreground">
            Every request must provide an <code>Authorization: Bearer &lt;jwt&gt;</code> header.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card space-y-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Layers className="h-4 w-4" />
          </div>
          <h3 className="text-xs font-bold text-foreground">1-to-Many Linking</h3>
          <p className="text-xs text-muted-foreground">
            One key can secure multiple endpoints, or endpoints can remain public with zero auth.
          </p>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground flex items-start gap-3">
        <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <div>
          <strong className="text-foreground">Next Step:</strong> Check out the <Link to="/docs/quickstart" className="text-primary font-semibold hover:underline">Quickstart Guide</Link> to generate your first key and trigger a verified webhook.
        </div>
      </div>
    </div>
  )
}
