# Webhook Authentication with Asymmetric RS256 JWT

This guide explains how to secure your webhook endpoints using asymmetric cryptography (RSA Public/Private key pairs with RS256 JWT tokens).

---

## 1. How It Works

```
┌─────────────────────────┐                                 ┌────────────────────────┐
│      Webhook Sender     │                                 │     Webhook Server     │
│  (Holds RSA Private Key)│                                 │ (Holds RSA Public Key) │
└───────────┬─────────────┘                                 └───────────┬────────────┘
            │                                                           │
            │  1. Sign JWT with Private Key (RS256)                     │
            │     Header: { "alg": "RS256", "typ": "JWT" }              │
            │     Payload: { "iss": "app", "exp": 1700000300 }          │
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
            │<──────────────────────────────────────────────────────────┤
```

### Core Principles:
- **Private Key Security**: When generating a key pair, the **Private Key is never stored in the database** and is shown/downloaded only once. Senders use this private key to sign JWTs.
- **Public Key Verification**: The server stores only the **Public Key** in PostgreSQL and verifies the signature on incoming requests using `RS256`.
- **1-to-Many Linking**: A single Auth Key can protect multiple webhook listeners, or endpoints can remain public (`No Auth`).

---

## 2. Generating Key Pairs Locally with OpenSSL

If you prefer to generate your own key pair on your machine instead of auto-generating in the dashboard:

```bash
# 1. Generate RSA 2048-bit Private Key
openssl genpkey -algorithm RSA -out private_key.pem -pkeyopt rsa_keygen_bits:2048

# 2. Extract Public Key in standard SPKI PEM format
openssl rsa -pubout -in private_key.pem -out public_key.pem
```

Then, go to **Auth Keys** $\rightarrow$ **Create Auth Key** $\rightarrow$ **Import Public Key** and paste the content of `public_key.pem`.

---

## 3. Client Integration Code Examples

### A. Node.js / JavaScript

Install dependency:
```bash
npm install jsonwebtoken
```

Code:
```javascript
const fs = require('fs');
const jwt = require('jsonwebtoken');

// Load private key
const privateKey = fs.readFileSync('private_key.pem', 'utf8');

// Generate RS256 token (5 minutes validity)
const token = jwt.sign(
  {
    iss: 'my-sender-service',
    aud: 'webhook-service',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 300
  },
  privateKey,
  { algorithm: 'RS256' }
);

// Dispatch webhook
async function sendWebhook() {
  const webhookUrl = 'https://your-webhook-domain.com/webhook/my-endpoint/api-123456789';
  
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      event: 'order.placed',
      order_id: 'ord_123456',
      total: 99.99
    })
  });

  const responseBody = await response.text();
  console.log(`Status: ${response.status}, Body: ${responseBody}`);
}

sendWebhook();
```

---

### B. Python

Install dependencies:
```bash
pip install pyjwt cryptography requests
```

Code:
```python
import time
import requests
import jwt

# Load private key
with open("private_key.pem", "r") as f:
    private_key = f.read()

# Build claims
now = int(time.time())
claims = {
    "iss": "my-python-app",
    "aud": "webhook-service",
    "iat": now,
    "exp": now + 300 # 5 minutes expiration
}

# Sign JWT with RS256
token = jwt.encode(claims, private_key, algorithm="RS256")

# Dispatch webhook
webhook_url = "https://your-webhook-domain.com/webhook/my-endpoint/api-123456789"
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {token}"
}
payload = {
    "event": "user.registered",
    "user_id": 4820,
    "email": "user@example.com"
}

response = requests.post(webhook_url, json=payload, headers=headers)
print(f"Status: {response.status_code}, Response: {response.text}")
```

---

### C. cURL / Bash

```bash
# 1. Base64 URL-safe encode header & payload
HEADER=$(echo -n '{"alg":"RS256","typ":"JWT"}' | openssl base64 -e | tr -d '=' | tr '/+' '_-' | tr -d '\n')
PAYLOAD=$(echo -n '{"iss":"cli","exp":'$(( $(date +%s) + 300 ))'}' | openssl base64 -e | tr -d '=' | tr '/+' '_-' | tr -d '\n')

# 2. Sign with OpenSSL
SIGNATURE=$(echo -n "${HEADER}.${PAYLOAD}" | openssl dgst -sha256 -sign private_key.pem | openssl base64 -e | tr -d '=' | tr '/+' '_-' | tr -d '\n')
JWT="${HEADER}.${PAYLOAD}.${SIGNATURE}"

# 3. Deliver Webhook
curl -X POST "https://your-webhook-domain.com/webhook/my-endpoint/api-123456789" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${JWT}" \
  -d '{"event":"ping","timestamp":1700000000}'
```

---

### D. PHP

Install dependency:
```bash
composer require firebase/php-jwt
```

Code:
```php
<?php
require_once 'vendor/autoload.php';
use Firebase\JWT\JWT;

$privateKey = file_get_contents('private_key.pem');

$payload = [
    'iss' => 'my-php-service',
    'aud' => 'webhook-service',
    'iat' => time(),
    'exp' => time() + 300
];

$jwt = JWT::encode($payload, $privateKey, 'RS256');

$ch = curl_init('https://your-webhook-domain.com/webhook/my-endpoint/api-123456789');
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

echo "HTTP Code: $httpCode | Body: $response\n";
?>
```

---

### E. Go

Install dependency:
```bash
go get github.com/golang-jwt/jwt/v5
```

Code:
```go
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
	keyBytes, _ := os.ReadFile("private_key.pem")
	privateKey, _ := jwt.ParseRSAPrivateKeyFromPEM(keyBytes)

	token := jwt.NewWithClaims(jwt.SigningMethodRS256, jwt.MapClaims{
		"iss": "my-go-sender",
		"aud": "webhook-service",
		"iat": time.Now().Unix(),
		"exp": time.Now().Add(5 * time.Minute).Unix(),
	})

	tokenString, _ := token.SignedString(privateKey)

	reqBody := []byte(`{"event":"deployment.succeeded"}`)
	req, _ := http.NewRequest("POST", "https://your-webhook-domain.com/webhook/my-endpoint/api-123456789", bytes.NewBuffer(reqBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+tokenString)

	client := &http.Client{}
	resp, _ := client.Do(req)
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	fmt.Printf("Status: %d, Body: %s\n", resp.StatusCode, string(body))
}
```

---

## 4. HTTP Response Codes Reference

| HTTP Status | Response Body | Reason / Meaning |
| :--- | :--- | :--- |
| `200 OK` | `"ok"` | Webhook verified and recorded successfully. |
| `401 Unauthorized` | `{"error": "Missing Authorization header", "code": "AUTH_REQUIRED"}` | Endpoint requires auth, but no `Authorization: Bearer <jwt>` was provided. |
| `401 Unauthorized` | `{"error": "Invalid token signature: ...", "code": "INVALID_SIGNATURE"}` | The JWT was signed with the wrong private key or signature was modified. |
| `401 Unauthorized` | `{"error": "Auth key has expired", "code": "KEY_EXPIRED"}` | The Auth Key has passed its expiration date. |
| `404 Not Found` | `{"error": "Webhook not registered"}` | The endpoint identifier or secret key path does not match any registered webhook. |
