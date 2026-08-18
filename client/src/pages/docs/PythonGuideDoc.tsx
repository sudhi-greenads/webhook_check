import { CodeShellViewer, type CodeTab } from "../../components/CodeShellViewer"

const pythonTab: CodeTab = {
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
}

export function PythonGuideDoc() {
  return (
    <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
      <p>
        Python applications (Django, Flask, FastAPI, Celery) should use <code>pyjwt</code> with <code>cryptography</code> to issue valid RS256 Bearer tokens.
      </p>

      <CodeShellViewer
        title="Python - PyJWT Implementation"
        tabs={[pythonTab]}
      />
    </div>
  )
}
