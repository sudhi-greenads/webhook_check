import { useState, useMemo } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { 
  BookOpen, 
  KeyRound, 
  Terminal, 
  ShieldCheck, 
  Radio, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  Layers, 
  ArrowRight, 
  ArrowLeft, 
  ChevronRight, 
  Code2, 
  ExternalLink,
  Info,
  Server,
  FileCode2,
  Cpu
} from "lucide-react"
import { DOCS_CATEGORIES, ALL_DOC_PAGES } from "../lib/docsData"
import { CodeShellViewer, CodeTab } from "../components/CodeShellViewer"

export default function Docs() {
  const { docId } = useParams<{ docId?: string }>()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState("")
  const [docVersion, setDocVersion] = useState("v1.2")

  const currentDocId = docId || "overview"
  const currentDoc = ALL_DOC_PAGES.find((p) => p.id === currentDocId) || ALL_DOC_PAGES[0]

  // Filtered categories based on search
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return DOCS_CATEGORIES
    const query = searchQuery.toLowerCase()
    return DOCS_CATEGORIES.map((cat) => ({
      ...cat,
      pages: cat.pages.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query)
      )
    })).filter((cat) => cat.pages.length > 0)
  }, [searchQuery])

  // Navigation: Next & Previous Page
  const currentIndex = ALL_DOC_PAGES.findIndex((p) => p.id === currentDoc.id)
  const prevDoc = currentIndex > 0 ? ALL_DOC_PAGES[currentIndex - 1] : null
  const nextDoc = currentIndex < ALL_DOC_PAGES.length - 1 ? ALL_DOC_PAGES[currentIndex + 1] : null

  // Language Code Tabs for "token-generation"
  const allLanguagesTabs: CodeTab[] = [
    {
      id: "nodejs",
      label: "Node.js",
      filename: "webhook_sender.js",
      language: "JavaScript",
      code: `// Install dependencies:
// npm install jsonwebtoken

const fs = require('fs');
const jwt = require('jsonwebtoken');

// 1. Read your RSA Private Key (PEM format)
const privateKey = fs.readFileSync('private_key.pem', 'utf8');
const webhookId = 12; // Same as your target webhook ID

// 2. Generate RS256 Signed JWT Token
const token = jwt.sign(
  {
    iss: 'webhook-sender-app',               // Webhook sender application identifier
    issuer_id: webhookId,                    // Same as target webhook ID (e.g. 12)
    aud: 'webhook-service',                  // Target audience service
    iat: Math.floor(Date.now() / 1000),      // Issued timestamp
    exp: Math.floor(Date.now() / 1000) + 300 // 5 minutes validity
  },
  privateKey,
  { algorithm: 'RS256' }
);

// 3. Dispatch the authenticated webhook payload
async function sendWebhook() {
  const webhookUrl = 'https://your-webhook-domain.com/webhook/my-endpoint/api-123456789';
  
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${token}\`
    },
    body: JSON.stringify({
      event: 'payment.completed',
      order_id: 'ord_87654321',
      amount: 49.99,
      currency: 'USD',
      customer: {
        id: 'cus_9872',
        email: 'customer@example.com'
      }
    })
  });

  const responseText = await response.text();
  console.log(\`HTTP Status: \${response.status}\`);
  console.log(\`Server Response Body: \${responseText}\`);
}

sendWebhook().catch(console.error);`
    },
    {
      id: "python",
      label: "Python",
      filename: "webhook_sender.py",
      language: "Python",
      code: `# Install dependencies:
# pip install pyjwt cryptography requests

import time
import requests
import jwt

# 1. Load RSA Private Key
with open("private_key.pem", "r") as key_file:
    private_key = key_file.read()

webhook_id = 12  # Same as target webhook ID

# 2. Build claims & sign JWT token with RS256
now = int(time.time())
claims = {
    "iss": "webhook-sender-app",  # Webhook sender app identifier
    "issuer_id": webhook_id,      # Same as webhook ID (e.g. 12)
    "aud": "webhook-service",
    "iat": now,
    "exp": now + 300              # 5 minutes expiration
}

token = jwt.encode(claims, private_key, algorithm="RS256")

# 3. Post authenticated webhook request
webhook_url = "https://your-webhook-domain.com/webhook/my-endpoint/api-123456789"
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {token}"
}
payload = {
    "event": "user.signup",
    "user_id": 10482,
    "email": "sarah@example.com"
}

response = requests.post(webhook_url, json=payload, headers=headers)
print(f"Status Code: {response.status_code}")
print(f"Response Body: {response.text}")`
    },
    {
      id: "go",
      label: "Go",
      filename: "main.go",
      language: "Go",
      code: `// Install dependencies:
// go get github.com/golang-jwt/jwt/v5

package main

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
	// 1. Read RSA Private Key
	keyBytes, err := os.ReadFile("private_key.pem")
	if err != nil {
		panic(err)
	}

	privateKey, err := jwt.ParseRSAPrivateKeyFromPEM(keyBytes)
	if err != nil {
		panic(err)
	}

	webhookId := 12 // Same as target webhook ID

	// 2. Generate RS256 token
	token := jwt.NewWithClaims(jwt.SigningMethodRS256, jwt.MapClaims{
		"iss":       "webhook-sender-app", // Webhook sender app identifier
		"issuer_id": webhookId,            // Same as target webhook ID (e.g. 12)
		"aud":       "webhook-service",
		"iat":       time.Now().Unix(),
		"exp":       time.Now().Add(5 * time.Minute).Unix(),
	})

	tokenString, err := token.SignedString(privateKey)
	if err != nil {
		panic(err)
	}

	// 3. Send Webhook Request
	webhookUrl := "https://your-webhook-domain.com/webhook/my-endpoint/api-123456789"
	reqBody := []byte(\`{"event":"build.passed","build_id":"b-9842"}\`)

	req, err := http.NewRequest("POST", webhookUrl, bytes.NewBuffer(reqBody))
	if err != nil {
		panic(err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+tokenString)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	fmt.Printf("HTTP Status: %d\\nResponse: %s\\n", resp.StatusCode, string(respBody))
}`
    },
    {
      id: "curl",
      label: "cURL / Bash",
      filename: "send_webhook.sh",
      language: "Bash",
      code: `#!/usr/bin/env bash

WEBHOOK_ID=12 # Same as your target webhook ID

# 1. Base64 URL-safe encode header & payload
HEADER=$(echo -n '{"alg":"RS256","typ":"JWT"}' | openssl base64 -e | tr -d '=' | tr '/+' '_-' | tr -d '\n')
PAYLOAD=$(echo -n '{"iss":"webhook-sender-app","issuer_id":'$WEBHOOK_ID',"aud":"webhook-service","exp":'$(( $(date +%s) + 300 ))'}' | openssl base64 -e | tr -d '=' | tr '/+' '_-' | tr -d '\n')

# 2. Sign header + payload using OpenSSL with your RSA Private Key
SIGNATURE=$(echo -n "\${HEADER}.\${PAYLOAD}" | openssl dgst -sha256 -sign private_key.pem | openssl base64 -e | tr -d '=' | tr '/+' '_-' | tr -d '\n')
JWT="\${HEADER}.\${PAYLOAD}.\${SIGNATURE}"

# 3. Deliver Webhook with Bearer Authorization header
WEBHOOK_URL="https://your-webhook-domain.com/webhook/my-endpoint/api-123456789"

curl -X POST "\${WEBHOOK_URL}" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer \${JWT}" \\
  -d '{"event":"deployment.triggered","environment":"production","version":"v2.4.0"}'`
    },
    {
      id: "java",
      label: "Java",
      filename: "WebhookSender.java",
      language: "Java",
      code: `// Maven dependency:
// <dependency>
//     <groupId>io.jsonwebtoken</groupId>
//     <artifactId>jjwt-api</artifactId>
//     <version>0.12.5</version>
// </dependency>

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.Date;
import io.jsonwebtoken.Jwts;

public class WebhookSender {
    public static PrivateKey loadPrivateKey(String filename) throws Exception {
        String key = new String(Files.readAllBytes(Paths.get(filename)))
            .replace("-----BEGIN PRIVATE KEY-----", "")
            .replace("-----END PRIVATE KEY-----", "")
            .replaceAll("\\s+", "");
        byte[] decoded = Base64.getDecoder().decode(key);
        PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(decoded);
        return KeyFactory.getInstance("RSA").generatePrivate(spec);
    }

    public static void main(String[] args) throws Exception {
        PrivateKey privateKey = loadPrivateKey("private_key.pem");
        int webhookId = 12; // Same as target webhook ID

        // Generate RS256 JWT
        String token = Jwts.builder()
            .issuer("webhook-sender-app") // Webhook sender app identifier
            .claim("issuer_id", webhookId) // Same as target webhook ID (e.g. 12)
            .audience().add("webhook-service").and()
            .issuedAt(new Date())
            .expiration(Date.from(Instant.now().plus(5, ChronoUnit.MINUTES)))
            .signWith(privateKey, Jwts.SIG.RS256)
            .compact();

        // Send HTTP Request
        String webhookUrl = "https://your-webhook-domain.com/webhook/my-endpoint/api-123456789";
        String payload = "{\"event\":\"invoice.generated\",\"invoice_id\":\"INV-1092\"}";

        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(webhookUrl))
            .header("Content-Type", "application/json")
            .header("Authorization", "Bearer " + token)
            .POST(HttpRequest.BodyPublishers.ofString(payload))
            .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        System.out.println("Status: " + response.statusCode() + " | Body: " + response.body());
    }
}`
    },
    {
      id: "csharp",
      label: "C# / .NET",
      filename: "WebhookService.cs",
      language: "C#",
      code: `// NuGet Packages:
// Install-Package System.IdentityModel.Tokens.Jwt
// Install-Package Microsoft.IdentityModel.Tokens

using System;
using System.Collections.Generic;
using System.IO;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;

public class WebhookService
{
    public static async Task SendWebhookAsync()
    {
        // 1. Load RSA Private Key
        string pem = await File.ReadAllTextAsync("private_key.pem");
        using var rsa = RSA.Create();
        rsa.ImportFromPem(pem);

        var securityKey = new RsaSecurityKey(rsa);
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.RsaSha256);

        int webhookId = 12; // Same as target webhook ID

        // 2. Generate RS256 JWT
        var tokenHandler = new JwtSecurityTokenHandler();
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Issuer = "webhook-sender-app", // Webhook sender app identifier
            Audience = "webhook-service",
            Claims = new Dictionary<string, object>
            {
                { "issuer_id", webhookId } // Same as target webhook ID (e.g. 12)
            },
            IssuedAt = DateTime.UtcNow,
            Expires = DateTime.UtcNow.AddMinutes(5),
            SigningCredentials = credentials
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        string jwtString = tokenHandler.WriteToken(token);

        // 3. Dispatch POST request
        using var client = new HttpClient();
        var request = new HttpRequestMessage(HttpMethod.Post, "https://your-webhook-domain.com/webhook/my-endpoint/api-123456789");
        request.Headers.Add("Authorization", $"Bearer {jwtString}");
        request.Content = new StringContent("{\"event\":\"task.completed\",\"task_id\":4920}", Encoding.UTF8, "application/json");

        var response = await client.SendAsync(request);
        string body = await response.Content.ReadAsStringAsync();
        Console.WriteLine($"Status: {response.StatusCode}, Body: {body}");
    }
}`
    },
    {
      id: "php",
      label: "PHP",
      filename: "send_webhook.php",
      language: "PHP",
      code: `<?php
// Install dependency:
// composer require firebase/php-jwt

require_once 'vendor/autoload.php';
use Firebase\\JWT\\JWT;

// 1. Read RSA Private Key
$privateKey = file_get_contents('private_key.pem');
$webhookId = 12; // Same as target webhook ID

// 2. Generate RS256 JWT
$payload = [
    'iss' => 'webhook-sender-app', // Webhook sender app identifier
    'issuer_id' => $webhookId,     // Same as target webhook ID (e.g. 12)
    'aud' => 'webhook-service',
    'iat' => time(),
    'exp' => time() + 300          // 5 minutes validity
];

$jwt = JWT::encode($payload, $privateKey, 'RS256');

// 3. Dispatch Webhook via cURL
$webhookUrl = 'https://your-webhook-domain.com/webhook/my-endpoint/api-123456789';
$payloadData = json_encode([
    'event' => 'subscription.renewed',
    'plan' => 'enterprise',
    'subscription_id' => 'sub_83921'
]);

$ch = curl_init($webhookUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $jwt
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payloadData);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpCode | Body: $response\\n";
?>`
    },
    {
      id: "rust",
      label: "Rust",
      filename: "main.rs",
      language: "Rust",
      code: `// In Cargo.toml:
// [dependencies]
// jsonwebtoken = "9"
// serde = { version = "1", features = ["derive"] }
// serde_json = "1"
// reqwest = { version = "0.12", features = ["json"] }
// tokio = { version = "1", features = ["full"] }

use jsonwebtoken::{encode, Algorithm, EncodingKey, Header};
use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Serialize, Deserialize)]
struct Claims {
    iss: String,
    issuer_id: usize,
    aud: String,
    iat: usize,
    exp: usize,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let private_key_pem = std::fs::read_to_string("private_key.pem")?;
    let key = EncodingKey::from_rsa_pem(private_key_pem.as_bytes())?;

    let webhook_id = 12; // Same as target webhook ID
    let now = SystemTime::now().duration_since(UNIX_EPOCH)?.as_secs() as usize;
    let claims = Claims {
        iss: "webhook-sender-app".to_string(), // Webhook sender app identifier
        issuer_id: webhook_id,                 // Same as target webhook ID (e.g. 12)
        aud: "webhook-service".to_string(),
        iat: now,
        exp: now + 300,
    };

    let header = Header::new(Algorithm::RS256);
    let token = encode(&header, &claims, &key)?;

    let client = reqwest::Client::new();
    let res = client
        .post("https://your-webhook-domain.com/webhook/my-endpoint/api-123456789")
        .header("Authorization", format!("Bearer {}", token))
        .json(&serde_json::json!({
            "event": "device.telemetry",
            "battery": 98.4,
            "status": "online"
        }))
        .send()
        .await?;

    println!("Status: {} | Body: {}", res.status(), res.text().await?);
    Ok(())
}`
    },
    {
      id: "ruby",
      label: "Ruby",
      filename: "webhook_sender.rb",
      language: "Ruby",
      code: `# gem install jwt net-http

require 'jwt'
require 'net/http'
require 'uri'
require 'json'
require 'openssl'

# 1. Read RSA Private Key
private_key = OpenSSL::PKey::RSA.new(File.read('private_key.pem'))
webhook_id = 12 # Same as target webhook ID

# 2. Generate RS256 JWT
payload = {
  iss: 'webhook-sender-app', # Webhook sender app identifier
  issuer_id: webhook_id,     # Same as target webhook ID (e.g. 12)
  aud: 'webhook-service',
  iat: Time.now.to_i,
  exp: Time.now.to_i + 300
}

token = JWT.encode(payload, private_key, 'RS256')

# 3. Post Webhook Request
uri = URI.parse('https://your-webhook-domain.com/webhook/my-endpoint/api-123456789')
http = Net::HTTP.new(uri.host, uri.port)
http.use_ssl = (uri.scheme == 'https')

request = Net::HTTP::Post.new(uri.request_uri, {
  'Content-Type' => 'application/json',
  'Authorization' => "Bearer #{token}"
})
request.body = { event: 'account.upgraded', account_id: 'acc_5510' }.to_json

response = http.request(request)
puts "Status: #{response.code} | Body: #{response.body}"`
    }
  ]

  const opensslTerminalTabs: CodeTab[] = [
    {
      id: "generate",
      label: "Generate RSA-2048 Pair",
      filename: "generate_keys.sh",
      language: "Bash",
      code: `# 1. Generate RSA 2048-bit Private Key (keep this private!)
openssl genpkey -algorithm RSA -out private_key.pem -pkeyopt rsa_keygen_bits:2048

# 2. Extract Public Key in standard SPKI PEM format (upload this to dashboard)
openssl rsa -pubout -in private_key.pem -out public_key.pem

# 3. Check public key fingerprint:
openssl rsa -pubin -in public_key.pem -outform DER | openssl dgst -sha256`
    }
  ]

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-[1400px] mx-auto w-full pt-4 pb-20">
      
      {/* Left Sidebar Navigation */}
      <aside className="w-full lg:w-72 shrink-0 space-y-6">
        
        {/* Version Selector & Header */}
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Docs Version</span>
            <select
              value={docVersion}
              onChange={(e) => setDocVersion(e.target.value)}
              className="text-xs font-mono font-semibold rounded border border-border bg-background px-2 py-0.5 text-primary"
            >
              <option value="v1.2">v1.2 (Current)</option>
              <option value="v1.1">v1.1</option>
              <option value="v1.0">v1.0</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-border bg-background pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Sidebar Categories Tree */}
        <nav className="space-y-5">
          {filteredCategories.map((category) => (
            <div key={category.name} className="space-y-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-3">
                {category.name}
              </h3>
              <div className="space-y-0.5">
                {category.pages.map((page) => {
                  const isActive = page.id === currentDoc.id
                  return (
                    <Link
                      key={page.id}
                      to={`/docs/${page.id}`}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? "bg-primary/10 text-primary font-semibold border border-primary/20"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                    >
                      <span className="truncate">{page.title}</span>
                      {isActive && <ChevronRight className="h-3.5 w-3.5 text-primary shrink-0" />}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Quick Links */}
        <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-2 text-xs">
          <span className="font-semibold text-foreground block">Quick Actions</span>
          <Link to="/keys/verify" className="flex items-center gap-1.5 text-primary hover:underline font-medium">
            <ShieldCheck className="h-3.5 w-3.5" /> Token Verification Tool
          </Link>
          <Link to="/keys" className="flex items-center gap-1.5 text-primary hover:underline font-medium">
            <KeyRound className="h-3.5 w-3.5" /> Open Auth Keys Manager
          </Link>
          <Link to="/webhooks" className="flex items-center gap-1.5 text-primary hover:underline font-medium">
            <Radio className="h-3.5 w-3.5" /> View Endpoints
          </Link>
        </div>
      </aside>

      {/* Main Documentation Content Area */}
      <main className="flex-1 min-w-0 space-y-8">
        
        {/* Breadcrumb Header */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground border-b border-border pb-3">
          <Link to="/docs/overview" className="hover:text-foreground">Docs</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-muted-foreground">{currentDoc.category}</span>
          <ChevronRight className="h-3 w-3" />
          <span className="font-semibold text-foreground">{currentDoc.title}</span>
        </div>

        {/* Article Title Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[11px] font-semibold">
            <BookOpen className="h-3 w-3" />
            {currentDoc.category}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {currentDoc.title}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {currentDoc.description}
          </p>
        </div>

        {/* Dynamic Page Content Routing */}
        {currentDoc.id === "overview" && (
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
        )}

        {currentDoc.id === "quickstart" && (
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
                  tabs={[allLanguagesTabs.find((t) => t.id === "curl") || allLanguagesTabs[0]]}
                />
              </div>
            </div>
          </div>
        )}

        {currentDoc.id === "generating-keys" && (
          <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
            <p>
              You can generate RSA-2048 key pairs in two ways: automatically via our dashboard or manually using OpenSSL CLI.
            </p>

            <h2 className="text-lg font-bold text-foreground mt-4">Option A: OpenSSL CLI Generation</h2>
            <p className="text-xs">Run these commands in your shell:</p>

            <CodeShellViewer
              title="Terminal - OpenSSL CLI"
              tabs={opensslTerminalTabs}
            />

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1">
              <strong className="block font-semibold text-amber-200">Security Rule:</strong>
              Never share or commit <code>private_key.pem</code> to public Git repositories. Only upload <code>public_key.pem</code> to our dashboard.
            </div>
          </div>
        )}

        {currentDoc.id === "key-validity" && (
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
        )}

        {currentDoc.id === "token-generation" && (
          <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
            <p>
              Below is production-ready code for generating an RS256 signed JWT token and sending the authenticated webhook payload in <strong>9 popular programming languages</strong>:
            </p>

            <CodeShellViewer
              title="Terminal - Multi-Language Webhook Sender"
              tabs={allLanguagesTabs}
            />

            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground">
              <strong className="text-foreground">Standard JWT Claims:</strong>
              <ul className="list-disc list-inside mt-1.5 space-y-1 text-muted-foreground">
                <li><code>iss</code>: <code>"webhook-sender-app"</code> (Sending application identifier).</li>
                <li><code>issuer_id</code>: <code>webhookId</code> (Same as your target webhook ID, e.g. <code>12</code>).</li>
                <li><code>aud</code>: <code>"webhook-service"</code> (Target audience).</li>
                <li><code>iat</code>: Unix timestamp of token issuance (e.g. <code>Math.floor(Date.now() / 1000)</code>).</li>
                <li><code>exp</code>: Unix timestamp when token expires (typically <code>iat + 300</code> for 5 minutes).</li>
              </ul>
            </div>
          </div>
        )}

        {currentDoc.id === "nodejs-guide" && (
          <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
            <p>
              Node.js backend applications should use the official <code>jsonwebtoken</code> package.
            </p>

            <CodeShellViewer
              title="Node.js - jsonwebtoken Implementation"
              tabs={[allLanguagesTabs.find((t) => t.id === "nodejs") || allLanguagesTabs[0]]}
            />
          </div>
        )}

        {currentDoc.id === "python-guide" && (
          <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
            <p>
              Python applications (Django, Flask, FastAPI, Celery) should use <code>pyjwt</code> with <code>cryptography</code>.
            </p>

            <CodeShellViewer
              title="Python - PyJWT Implementation"
              tabs={[allLanguagesTabs.find((t) => t.id === "python") || allLanguagesTabs[0]]}
            />
          </div>
        )}

        {currentDoc.id === "http-reference" && (
          <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
            <p>
              All webhook listeners return standardized HTTP status codes and payloads:
            </p>

            <div className="rounded-xl border border-border overflow-hidden bg-card">
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
        )}

        {currentDoc.id === "troubleshooting" && (
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
        )}

        {/* Footer Navigation (Previous / Next Article) */}
        <div className="border-t border-border pt-6 flex items-center justify-between">
          {prevDoc ? (
            <Link
              to={`/docs/${prevDoc.id}`}
              className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-muted/40 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <div>
                <span className="text-[10px] text-muted-foreground/70 block uppercase">Previous</span>
                <span>{prevDoc.title}</span>
              </div>
            </Link>
          ) : <div />}

          {nextDoc ? (
            <Link
              to={`/docs/${nextDoc.id}`}
              className="flex items-center gap-2 text-xs font-semibold text-primary hover:text-primary/80 p-2 rounded-lg hover:bg-primary/10 transition-colors text-right"
            >
              <div>
                <span className="text-[10px] text-primary/70 block uppercase">Next</span>
                <span>{nextDoc.title}</span>
              </div>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : <div />}
        </div>

      </main>
    </div>
  )
}
