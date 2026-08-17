import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Code2, Copy, Check, X, Terminal, BookOpen } from "lucide-react"
import { toast } from "sonner"

type CodeSnippetModalProps = {
  isOpen: boolean
  onClose: () => void
  keyName?: string
  webhookUrl?: string
  webhookId?: number | string
}

export function CodeSnippetModal({
  isOpen,
  onClose,
  keyName = "my-auth-key",
  webhookUrl = "https://your-domain.com/webhook/my-endpoint/api-123456789",
  webhookId = 12
}: CodeSnippetModalProps) {
  const [activeTab, setActiveTab] = useState<"nodejs" | "python" | "curl" | "php" | "go">("nodejs")
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const getSnippets = () => {
    return {
      nodejs: `// 1. Install dependencies: npm install jsonwebtoken
const fs = require('fs');
const jwt = require('jsonwebtoken');

// Load your private key (downloaded when generating the key)
const privateKey = fs.readFileSync('./${keyName.toLowerCase().replace(/[^a-z0-9_-]/g, "_")}_private_key.pem', 'utf8');
const webhookId = ${webhookId}; // Same as your target webhook ID

// Sign a JWT token using RS256 algorithm
const token = jwt.sign(
  {
    iss: 'webhook-sender-app',               // Webhook sender app identifier
    issuer_id: webhookId,                    // Same as target webhook ID (e.g. ${webhookId})
    aud: 'webhook-service',                  // Target audience service
    iat: Math.floor(Date.now() / 1000),      // Issued at
    exp: Math.floor(Date.now() / 1000) + 300 // 5 minutes validity
  },
  privateKey,
  { algorithm: 'RS256' }
);

// Send webhook request with Authorization header
async function sendWebhook() {
  const payload = { event: 'payment.succeeded', amount: 4999, currency: 'usd' };
  
  const response = await fetch('${webhookUrl}', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${token}\`
    },
    body: JSON.stringify(payload)
  });

  const responseText = await response.text();
  console.log('Webhook Response:', response.status, responseText);
}

sendWebhook();`,

      python: `# 1. Install dependencies: pip install pyjwt cryptography requests
import time
import requests
import jwt

# Load your private key
with open("${keyName.toLowerCase().replace(/[^a-z0-9_-]/g, "_")}_private_key.pem", "r") as f:
    private_key = f.read()

webhook_id = ${webhookId}  # Same as target webhook ID

# Generate RS256 signed JWT token
now = int(time.time())
payload_claims = {
    "iss": "webhook-sender-app",  # Webhook sender app identifier
    "issuer_id": webhook_id,      # Same as target webhook ID (e.g. ${webhookId})
    "aud": "webhook-service",
    "iat": now,
    "exp": now + 300              # 5 minutes expiry
}

token = jwt.encode(payload_claims, private_key, algorithm="RS256")

# Deliver webhook payload
webhook_url = "${webhookUrl}"
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {token}"
}
data = {
    "event": "user.signup",
    "user_id": 1042,
    "email": "alex@example.com"
}

response = requests.post(webhook_url, json=data, headers=headers)
print(f"Status: {response.status_code}, Body: {response.text}")`,

      curl: `#!/usr/bin/env bash
WEBHOOK_ID=${webhookId} # Same as your target webhook ID

# 1. Generate a JWT using OpenSSL in Bash/cURL:
HEADER_BASE64=$(echo -n '{"alg":"RS256","typ":"JWT"}' | openssl base64 -e | tr -d '=' | tr '/+' '_-' | tr -d '\n')
PAYLOAD_BASE64=$(echo -n '{"iss":"webhook-sender-app","issuer_id":'$WEBHOOK_ID',"aud":"webhook-service","exp":'$(( $(date +%s) + 300 ))'}' | openssl base64 -e | tr -d '=' | tr '/+' '_-' | tr -d '\n')

SIGNATURE=$(echo -n "\${HEADER_BASE64}.\${PAYLOAD_BASE64}" | openssl dgst -sha256 -sign "${keyName.toLowerCase().replace(/[^a-z0-9_-]/g, "_")}_private_key.pem" | openssl base64 -e | tr -d '=' | tr '/+' '_-' | tr -d '\n')
JWT="\${HEADER_BASE64}.\${PAYLOAD_BASE64}.\${SIGNATURE}"

# 2. Trigger the authenticated webhook:
curl -X POST "${webhookUrl}" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer \${JWT}" \\
  -d '{"event":"order.created","order_id":"ORD-9842"}'`,

      php: `<?php
// 1. Install dependencies: composer require firebase/php-jwt
require_once 'vendor/autoload.php';
use Firebase\\JWT\\JWT;

$privateKey = file_get_contents('./${keyName.toLowerCase().replace(/[^a-z0-9_-]/g, "_")}_private_key.pem');
$webhookId = ${webhookId}; // Same as target webhook ID

$payload = [
    'iss' => 'webhook-sender-app', // Webhook sender app identifier
    'issuer_id' => $webhookId,     // Same as target webhook ID (e.g. ${webhookId})
    'aud' => 'webhook-service',
    'iat' => time(),
    'exp' => time() + 300          // 5 minutes validity
];

$jwt = JWT::encode($payload, $privateKey, 'RS256');

// 2. Dispatch Webhook
$ch = curl_init('${webhookUrl}');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $jwt
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'event' => 'invoice.paid',
    'invoice_id' => 'INV-2041'
]));

$response = curl_exec($ch);
curl_close($ch);
echo $response;
?>`,

      go: `// 1. Install dependencies: go get github.com/golang-jwt/jwt/v5
package main

import (
	"bytes"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func main() {
	keyBytes, _ := os.ReadFile("./${keyName.toLowerCase().replace(/[^a-z0-9_-]/g, "_")}_private_key.pem")
	privateKey, _ := jwt.ParseRSAPrivateKeyFromPEM(keyBytes)
	webhookId := ${webhookId} // Same as target webhook ID

	token := jwt.NewWithClaims(jwt.SigningMethodRS256, jwt.MapClaims{
		"iss":       "webhook-sender-app", // Webhook sender app identifier
		"issuer_id": webhookId,            // Same as target webhook ID (e.g. ${webhookId})
		"aud":       "webhook-service",
		"iat":       time.Now().Unix(),
		"exp":       time.Now().Add(5 * time.Minute).Unix(),
	})

	tokenString, _ := token.SignedString(privateKey)

	req, _ := http.NewRequest("POST", "${webhookUrl}", bytes.NewBuffer([]byte(\`{"event":"telemetry.ping"}\`)))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+tokenString)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, _ := client.Do(req)
	defer resp.Body.Close()
	fmt.Println("Status:", resp.StatusCode)
}`
    }
  }

  const snippets = getSnippets()
  const currentSnippet = snippets[activeTab]

  const handleCopy = () => {
    navigator.clipboard.writeText(currentSnippet)
    setCopied(true)
    toast.success("Integration code copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-xl border border-border bg-card shadow-2xl text-card-foreground overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Code2 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Integration Code Snippets
              </h2>
              <p className="text-xs text-muted-foreground">
                Key: <strong className="text-foreground">{keyName}</strong> • RS256 JWT Authentication
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-b border-border bg-muted/40 px-6 pt-2 overflow-x-auto">
          {(["nodejs", "python", "curl", "php", "go"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 text-xs font-semibold rounded-t-md transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? "bg-card text-primary border-t-2 border-primary border-x border-border shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "nodejs" && "Node.js"}
              {tab === "python" && "Python"}
              {tab === "curl" && "cURL / Bash"}
              {tab === "php" && "PHP"}
              {tab === "go" && "Go"}
            </button>
          ))}
        </div>

        {/* Code Content */}
        <div className="p-6 space-y-4">
          <div className="relative rounded-lg border border-[#30363d] bg-[#0d1117] p-4 text-xs font-mono text-zinc-200 overflow-x-auto max-h-[380px]">
            <pre className="whitespace-pre">{currentSnippet}</pre>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-border bg-muted/20 px-6 py-3.5">
          <span className="text-xs text-muted-foreground">
            Algorithm: <strong className="text-foreground">RS256</strong> • Target Webhook ID: <strong className="text-foreground">{webhookId}</strong>
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="h-8 text-xs gap-1.5 bg-background"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> Copy Code
                </>
              )}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={onClose}
              className="h-8 text-xs"
            >
              Done
            </Button>
          </div>
        </div>

      </div>
    </div>
  )
}
