import { Link } from "react-router-dom"
import { CodeShellViewer, type CodeTab } from "../../components/CodeShellViewer"

const curlTab: CodeTab = {
  id: "curl",
  label: "cURL / Bash",
  filename: "send_webhook.sh",
  language: "Bash",
  code: `#!/usr/bin/env bash

WEBHOOK_ID=12 # Same as your target webhook ID

# 1. Base64 URL-safe encode header & payload
HEADER=$(echo -n '{"alg":"RS256","typ":"JWT"}' | openssl base64 -e | tr -d '=' | tr '/+' '_-' | tr -d '\\n')
PAYLOAD=$(echo -n '{"iss":"webhook-sender-app","issuer_id":'$WEBHOOK_ID',"aud":"webhook-service","exp":'$(( $(date +%s) + 300 ))'}' | openssl base64 -e | tr -d '=' | tr '/+' '_-' | tr -d '\\n')

# 2. Sign header + payload using OpenSSL with your RSA Private Key
SIGNATURE=$(echo -n "\${HEADER}.\${PAYLOAD}" | openssl dgst -sha256 -sign private_key.pem | openssl base64 -e | tr -d '=' | tr '/+' '_-' | tr -d '\\n')
JWT="\${HEADER}.\${PAYLOAD}.\${SIGNATURE}"

# 3. Deliver Webhook with Bearer Authorization header
curl -X POST https://your-domain.com/webhook/my-endpoint/api-123456789 \\
  -H "Authorization: Bearer \${JWT}" \\
  -H "Content-Type: application/json" \\
  -d '{"event":"user.signup","user_id":1024}'`
}

export function QuickstartDoc() {
  return (
    <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
      <p>Follow these 3 simple steps to secure your first webhook endpoint:</p>

      <div className="space-y-4">
        <div className="p-5 rounded-xl border border-border bg-card space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">1</div>
            <h3 className="text-sm font-bold text-foreground">Create an Auth Key</h3>
          </div>
          <p className="text-xs">
            Go to <Link to="/keys/create" className="text-primary hover:underline font-semibold">Create Auth Key</Link>. Choose <em>Auto-Generate Pair</em>. Download and safely store your <code>.pem</code> private key file.
          </p>
        </div>

        <div className="p-5 rounded-xl border border-border bg-card space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">2</div>
            <h3 className="text-sm font-bold text-foreground">Attach the Auth Key to your Webhook Endpoint</h3>
          </div>
          <p className="text-xs">
            In <Link to="/webhooks/create" className="text-primary hover:underline font-semibold">Create Endpoint</Link> or edit an existing endpoint, choose your newly created Auth Key under the <em>Authentication & Security</em> dropdown. Note the Webhook ID for your token payload.
          </p>
        </div>

        <div className="p-5 rounded-xl border border-border bg-card space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">3</div>
            <h3 className="text-sm font-bold text-foreground">Send Requests with Authorization Header</h3>
          </div>
          <p className="text-xs">
            Sign your payload with RS256 (including <code>iss: 'webhook-sender-app'</code> and <code>issuer_id: webhookId</code>) and include the header <code>Authorization: Bearer &lt;token&gt;</code>.
          </p>
          <CodeShellViewer
            title="Quick Test - Bash cURL"
            tabs={[curlTab]}
          />
        </div>
      </div>
    </div>
  )
}
