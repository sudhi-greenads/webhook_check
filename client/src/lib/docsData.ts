export type DocPage = {
  id: string
  title: string
  category: string
  description: string
  lastUpdated: string
}

export type DocCategory = {
  name: string
  pages: DocPage[]
}

export const DOCS_CATEGORIES: DocCategory[] = [
  {
    name: "Getting Started",
    pages: [
      {
        id: "overview",
        title: "Overview & Architecture",
        category: "Getting Started",
        description: "Understanding asymmetric RS256 webhook cryptography and security guarantees.",
        lastUpdated: "2026-08-16"
      },
      {
        id: "quickstart",
        title: "Quickstart Guide (3 Steps)",
        category: "Getting Started",
        description: "Step-by-step guide to generating keys, attaching them to webhooks, and sending requests.",
        lastUpdated: "2026-08-16"
      }
    ]
  },
  {
    name: "Key Management",
    pages: [
      {
        id: "generating-keys",
        title: "Generating & Importing Keys",
        category: "Key Management",
        description: "Auto-generating RSA-2048 key pairs in-app and OpenSSL CLI generation.",
        lastUpdated: "2026-08-16"
      },
      {
        id: "key-validity",
        title: "Key Validity & Expiration",
        category: "Key Management",
        description: "Lifelong vs expiring keys, key rotation best practices, and status indicators.",
        lastUpdated: "2026-08-16"
      }
    ]
  },
  {
    name: "Code & Token Generation",
    pages: [
      {
        id: "token-generation",
        title: "Token Generation in All Languages",
        category: "Code & Token Generation",
        description: "Complete JWT RS256 token generation and webhook sending code in Node.js, Python, Go, Java, C#, PHP, Ruby, Rust, and cURL.",
        lastUpdated: "2026-08-16"
      },
      {
        id: "nodejs-guide",
        title: "Node.js (jsonwebtoken) Deep Dive",
        category: "Code & Token Generation",
        description: "In-depth guide for Node.js backends using jsonwebtoken and retry mechanics.",
        lastUpdated: "2026-08-16"
      },
      {
        id: "python-guide",
        title: "Python (PyJWT) Deep Dive",
        category: "Code & Token Generation",
        description: "In-depth guide for Python / Django / FastAPI applications using PyJWT.",
        lastUpdated: "2026-08-16"
      }
    ]
  },
  {
    name: "API & Reference",
    pages: [
      {
        id: "http-reference",
        title: "HTTP Codes & Response Payloads",
        category: "API & Reference",
        description: "Detailed breakdown of 200 OK, 401 Unauthorized, error codes, and response logging.",
        lastUpdated: "2026-08-16"
      },
      {
        id: "troubleshooting",
        title: "Troubleshooting & Verification",
        category: "API & Reference",
        description: "How to debug signature mismatches, expired tokens, and inspect delivery logs.",
        lastUpdated: "2026-08-16"
      }
    ]
  }
]

export const ALL_DOC_PAGES: DocPage[] = DOCS_CATEGORIES.flatMap((cat) => cat.pages)
