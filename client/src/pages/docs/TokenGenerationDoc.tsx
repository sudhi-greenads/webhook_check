import { CodeShellViewer, type CodeTab } from "../../components/CodeShellViewer"

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
	keyBytes, err := os.ReadFile("private_key.pem")
	if err != nil {
		panic(err)
	}

	privateKey, err := jwt.ParseRSAPrivateKeyFromPEM(keyBytes)
	if err != nil {
		panic(err)
	}

	webhookId := 12 // Same as target webhook ID

	token := jwt.NewWithClaims(jwt.SigningMethodRS256, jwt.MapClaims{
		"iss":       "webhook-sender-app",
		"issuer_id": webhookId,
		"aud":       "webhook-service",
		"iat":       time.Now().Unix(),
		"exp":       time.Now().Add(5 * time.Minute).Unix(),
	})

	tokenString, err := token.SignedString(privateKey)
	if err != nil {
		panic(err)
	}

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

HEADER=$(echo -n '{"alg":"RS256","typ":"JWT"}' | openssl base64 -e | tr -d '=' | tr '/+' '_-' | tr -d '\\n')
PAYLOAD=$(echo -n '{"iss":"webhook-sender-app","issuer_id":'$WEBHOOK_ID',"aud":"webhook-service","exp":'$(( $(date +%s) + 300 ))'}' | openssl base64 -e | tr -d '=' | tr '/+' '_-' | tr -d '\\n')

SIGNATURE=$(echo -n "\${HEADER}.\${PAYLOAD}" | openssl dgst -sha256 -sign private_key.pem | openssl base64 -e | tr -d '=' | tr '/+' '_-' | tr -d '\\n')
JWT="\${HEADER}.\${PAYLOAD}.\${SIGNATURE}"

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
    code: `import java.io.IOException;
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
        int webhookId = 12;

        String token = Jwts.builder()
            .issuer("webhook-sender-app")
            .claim("issuer_id", webhookId)
            .audience().add("webhook-service").and()
            .issuedAt(new Date())
            .expiration(Date.from(Instant.now().plus(5, ChronoUnit.MINUTES)))
            .signWith(privateKey, Jwts.SIG.RS256)
            .compact();

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
    code: `using System;
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
        string pem = await File.ReadAllTextAsync("private_key.pem");
        using var rsa = RSA.Create();
        rsa.ImportFromPem(pem);

        var securityKey = new RsaSecurityKey(rsa);
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.RsaSha256);

        int webhookId = 12;

        var tokenHandler = new JwtSecurityTokenHandler();
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Issuer = "webhook-sender-app",
            Audience = "webhook-service",
            Claims = new Dictionary<string, object>
            {
                { "issuer_id", webhookId }
            },
            IssuedAt = DateTime.UtcNow,
            Expires = DateTime.UtcNow.AddMinutes(5),
            SigningCredentials = credentials
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        string jwtString = tokenHandler.WriteToken(token);

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
require_once 'vendor/autoload.php';
use Firebase\\JWT\\JWT;

$privateKey = file_get_contents('private_key.pem');
$webhookId = 12;

$payload = [
    'iss' => 'webhook-sender-app',
    'issuer_id' => $webhookId,
    'aud' => 'webhook-service',
    'iat' => time(),
    'exp' => time() + 300
];

$jwt = JWT::encode($payload, $privateKey, 'RS256');

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
    code: `use jsonwebtoken::{encode, Algorithm, EncodingKey, Header};
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

    let webhook_id = 12;
    let now = SystemTime::now().duration_since(UNIX_EPOCH)?.as_secs() as usize;
    let claims = Claims {
        iss: "webhook-sender-app".to_string(),
        issuer_id: webhook_id,
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
    code: `require 'jwt'
require 'net/http'
require 'uri'
require 'json'
require 'openssl'

private_key = OpenSSL::PKey::RSA.new(File.read('private_key.pem'))
webhook_id = 12

payload = {
  iss: 'webhook-sender-app',
  issuer_id: webhook_id,
  aud: 'webhook-service',
  iat: Time.now.to_i,
  exp: Time.now.to_i + 300
}

token = JWT.encode(payload, private_key, 'RS256')

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

export function TokenGenerationDoc() {
  return (
    <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
      <p>
        Select your backend programming language below to view production-ready RS256 JWT generation and HTTP webhook dispatch code:
      </p>

      <CodeShellViewer
        title="Token Generation & Dispatcher"
        tabs={allLanguagesTabs}
      />
    </div>
  )
}
