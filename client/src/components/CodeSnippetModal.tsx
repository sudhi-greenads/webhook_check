import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Code2, Copy, Check, X, Terminal, BookOpen } from "lucide-react"
import { toast } from "sonner"

type CodeSnippetModalProps = {
  isOpen: boolean
  onClose: () => void
  keyName?: string
  webhookUrl?: string
}

export function CodeSnippetModal({
  isOpen,
  onClose,
  keyName = "my-auth-key",
  webhookUrl = "https://your-domain.com/webhook/my-endpoint/api-123456789"
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

// Sign a JWT token using RS256 algorithm
const token = jwt.sign(
  {
    iss: 'my-app',
    aud: 'webhook-service',
    iat: Math.floor(Date.now() / 1000),
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

# Generate RS256 signed JWT token
now = int(time.time())
payload_claims = {
    "iss": "my-python-app",
    "aud": "webhook-service",
    "iat": now,
    "exp": now + 300  # 5 minutes expiry
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

      curl: `# 1. Generate a JWT using OpenSSL in Bash/cURL:
HEADER_BASE64=$(echo -n '{"alg":"RS256","typ":"JWT"}' | openssl base64 -e | tr -d '=' | tr '/+' '_-' | tr -d '\n')
PAYLOAD_BASE64=$(echo -n '{"iss":"cli","exp":'$(( $(date +%s) + 300 ))'}' | openssl base64 -e | tr -d '=' | tr '/+' '_-' | tr -d '\n')

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

$payload = [
    'iss' => 'my-php-app',
    'aud' => 'webhook-service',
    'iat' => time(),
    'exp' => time() + 300
];

$jwt = JWT::encode($payload, $privateKey, 'RS256');

// Send HTTP POST request
$ch = curl_init('${webhookUrl}');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $jwt
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['event' => 'invoice.paid']));

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpCode, Response: $response\\n";
?>`,

      go: `package main

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func main() {
	// Read private key
	keyBytes, _ := os.ReadFile("${keyName.toLowerCase().replace(/[^a-z0-9_-]/g, "_")}_private_key.pem")
	privateKey, _ := jwt.ParseRSAPrivateKeyFromPEM(keyBytes)

	// Create RS256 token
	token := jwt.NewWithClaims(jwt.SigningMethodRS256, jwt.MapClaims{
		"iss": "my-go-app",
		"aud": "webhook-service",
		"iat": time.Now().Unix(),
		"exp": time.Now().Add(5 * time.Minute).Unix(),
	})

	tokenString, _ := token.SignedString(privateKey)

	// Dispatch request
	reqBody := []byte(\`{"event":"build.finished","status":"success"}\`)
	req, _ := http.NewRequest("POST", "${webhookUrl}", bytes.NewBuffer(reqBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+tokenString)

	client := &http.Client{}
	resp, _ := client.Do(req)
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	fmt.Printf("Status: %d, Response: %s\\n", resp.StatusCode, string(body))
}`
    }
  }

  const snippets = getSnippets()
  const currentSnippet = snippets[activeTab]

  const handleCopy = () => {
    navigator.clipboard.writeText(currentSnippet)
    setCopied(true)
    toast.success("Code snippet copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-xl border border-border bg-card shadow-2xl text-card-foreground overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Code2 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Integration Code Generator
              </h2>
              <p className="text-xs text-muted-foreground">
                Ready-to-use client code for signing requests with your RSA Private Key.
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-muted/60 border border-border/80 text-xs overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab("nodejs")}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                activeTab === "nodejs" 
                  ? "bg-background text-foreground shadow-sm font-semibold" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Node.js
            </button>
            <button
              onClick={() => setActiveTab("python")}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                activeTab === "python" 
                  ? "bg-background text-foreground shadow-sm font-semibold" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Python
            </button>
            <button
              onClick={() => setActiveTab("curl")}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                activeTab === "curl" 
                  ? "bg-background text-foreground shadow-sm font-semibold" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              cURL / Bash
            </button>
            <button
              onClick={() => setActiveTab("php")}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                activeTab === "php" 
                  ? "bg-background text-foreground shadow-sm font-semibold" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              PHP
            </button>
            <button
              onClick={() => setActiveTab("go")}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                activeTab === "go" 
                  ? "bg-background text-foreground shadow-sm font-semibold" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Go
            </button>
          </div>

          {/* Snippet Code Container */}
          <div className="relative rounded-lg border border-border bg-black/95 p-4 font-mono text-[12px] text-zinc-200 leading-relaxed overflow-x-auto max-h-80">
            <div className="absolute top-3 right-3 flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="h-7 px-2.5 text-xs gap-1.5 bg-zinc-900 border-zinc-700 text-zinc-200 hover:bg-zinc-800"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy Code"}
              </Button>
            </div>
            <pre className="whitespace-pre pt-4">{currentSnippet}</pre>
          </div>

          {/* Info callout */}
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-muted-foreground">
            <Terminal className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span>
              The server validates the <code>Authorization: Bearer &lt;token&gt;</code> header using your registered Public Key with the <strong>RS256</strong> algorithm.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border bg-muted/30 px-6 py-3.5 flex items-center justify-between">
          <a 
            href="/docs" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
          >
            <BookOpen className="h-3.5 w-3.5" /> Open Full Developer Docs
          </a>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 text-xs">
            Close
          </Button>
        </div>

      </div>
    </div>
  )
}
