import { CodeShellViewer, type CodeTab } from "../../components/CodeShellViewer"

const nodejsTab: CodeTab = {
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
}

export function NodeJsGuideDoc() {
  return (
    <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
      <p>
        Node.js backend applications should use the official <code>jsonwebtoken</code> package to sign RS256 tokens before sending webhooks.
      </p>

      <CodeShellViewer
        title="Node.js - jsonwebtoken Implementation"
        tabs={[nodejsTab]}
      />
    </div>
  )
}
