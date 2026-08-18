export type DocVersionStatus = "current" | "preview" | "coming_soon" | "legacy"

export type DocVersionInfo = {
  version: string        // e.g. "v1.0", "v2.0"
  label: string          // e.g. "v1.0 (Current)", "v2.0 (Coming Soon)"
  status: DocVersionStatus
  releaseDate?: string
  disabled?: boolean
}

export type DocPage = {
  id: string
  title: string
  category: string
  description: string
  lastUpdated: string
  serviceId: string
  versionId: string
  badge?: string              // e.g. "NEW", "UPDATED", "v2.0 BREAKING"
  addedInVersion?: string     // e.g. "v1.0", "v2.0"
  deprecated?: boolean
  deprecatedInVersion?: string
  componentKey?: string       // Key used by component resolver
}

export type DocCategory = {
  name: string
  pages: DocPage[]
}

export type DocService = {
  id: string
  name: string
  description: string
  icon: string
  badge: string
  status: "active" | "coming_soon" | "deprecated"
  defaultVersion: string
  supportedVersions: DocVersionInfo[]
}

export type ServiceVersionDocData = {
  serviceId: string
  versionId: string
  serviceName: string
  versionLabel: string
  badge?: string
  categories: DocCategory[]
}

// Global list of supported Services & their Version metadata
export const DOC_SERVICES: DocService[] = [
  {
    id: "webhook-service",
    name: "Webhook Service",
    description: "Asymmetric RS256 webhook signature verification & payload delivery",
    icon: "Radio",
    badge: "Core Service",
    status: "active",
    defaultVersion: "v1.0",
    supportedVersions: [
      { version: "v1.0", label: "v1.0 (Current)", status: "current" },
      { version: "v2.0", label: "v2.0 (Coming Soon)", status: "coming_soon", disabled: true }
    ]
  },
  {
    id: "auth-api",
    name: "Auth & Key Management API",
    description: "Programmatic management of API keys, permissions, and webhook endpoints",
    icon: "KeyRound",
    badge: "Planned Service",
    status: "coming_soon",
    defaultVersion: "v1.0",
    supportedVersions: [
      { version: "v1.0", label: "v1.0 (Preview)", status: "coming_soon", disabled: true }
    ]
  }
]

// Modular Registry mapping [serviceId][versionId] -> ServiceVersionDocData
export const DOC_REGISTRY: Record<string, Record<string, ServiceVersionDocData>> = {
  "webhook-service": {
    "v1.0": {
      serviceId: "webhook-service",
      versionId: "v1.0",
      serviceName: "Webhook Service",
      versionLabel: "v1.0 (Current)",
      badge: "Production V1",
      categories: [
        {
          name: "Getting Started",
          pages: [
            {
              id: "overview",
              serviceId: "webhook-service",
              versionId: "v1.0",
              title: "Overview & Architecture",
              category: "Getting Started",
              description: "Understanding asymmetric RS256 webhook cryptography and security guarantees.",
              lastUpdated: "2026-08-16",
              addedInVersion: "v1.0",
              componentKey: "overview"
            },
            {
              id: "quickstart",
              serviceId: "webhook-service",
              versionId: "v1.0",
              title: "Quickstart Guide (3 Steps)",
              category: "Getting Started",
              description: "Step-by-step guide to generating keys, attaching them to webhooks, and sending requests.",
              lastUpdated: "2026-08-16",
              addedInVersion: "v1.0",
              componentKey: "quickstart"
            }
          ]
        },
        {
          name: "Key Management",
          pages: [
            {
              id: "generating-keys",
              serviceId: "webhook-service",
              versionId: "v1.0",
              title: "Generating & Importing Keys",
              category: "Key Management",
              description: "Auto-generating RSA-2048 key pairs in-app and OpenSSL CLI generation.",
              lastUpdated: "2026-08-16",
              addedInVersion: "v1.0",
              componentKey: "generating-keys"
            },
            {
              id: "key-validity",
              serviceId: "webhook-service",
              versionId: "v1.0",
              title: "Key Validity & Expiration",
              category: "Key Management",
              description: "Lifelong vs expiring keys, key rotation best practices, and status indicators.",
              lastUpdated: "2026-08-16",
              addedInVersion: "v1.0",
              componentKey: "key-validity"
            }
          ]
        },
        {
          name: "Code & Token Generation",
          pages: [
            {
              id: "token-generation",
              serviceId: "webhook-service",
              versionId: "v1.0",
              title: "Token Generation in All Languages",
              category: "Code & Token Generation",
              description: "Complete JWT RS256 token generation and webhook sending code in Node.js, Python, Go, Java, C#, PHP, Ruby, Rust, and cURL.",
              lastUpdated: "2026-08-16",
              addedInVersion: "v1.0",
              componentKey: "token-generation"
            },
            {
              id: "nodejs-guide",
              serviceId: "webhook-service",
              versionId: "v1.0",
              title: "Node.js (jsonwebtoken) Deep Dive",
              category: "Code & Token Generation",
              description: "In-depth guide for Node.js backends using jsonwebtoken and retry mechanics.",
              lastUpdated: "2026-08-16",
              addedInVersion: "v1.0",
              componentKey: "nodejs-guide"
            },
            {
              id: "python-guide",
              serviceId: "webhook-service",
              versionId: "v1.0",
              title: "Python (PyJWT) Deep Dive",
              category: "Code & Token Generation",
              description: "In-depth guide for Python / Django / FastAPI applications using PyJWT.",
              lastUpdated: "2026-08-16",
              addedInVersion: "v1.0",
              componentKey: "python-guide"
            }
          ]
        },
        {
          name: "API & Reference",
          pages: [
            {
              id: "http-reference",
              serviceId: "webhook-service",
              versionId: "v1.0",
              title: "HTTP Codes & Response Payloads",
              category: "API & Reference",
              description: "Detailed breakdown of 200 OK, 401 Unauthorized, error codes, and response logging.",
              lastUpdated: "2026-08-16",
              addedInVersion: "v1.0",
              componentKey: "http-reference"
            },
            {
              id: "troubleshooting",
              serviceId: "webhook-service",
              versionId: "v1.0",
              title: "Troubleshooting & Verification",
              category: "API & Reference",
              description: "How to debug signature mismatches, expired tokens, and inspect delivery logs.",
              lastUpdated: "2026-08-16",
              addedInVersion: "v1.0",
              componentKey: "troubleshooting"
            }
          ]
        }
      ]
    },
    "v2.0": {
      serviceId: "webhook-service",
      versionId: "v2.0",
      serviceName: "Webhook Service",
      versionLabel: "v2.0 (Coming Soon)",
      badge: "v2.0 Next-Gen",
      categories: [
        {
          name: "v2.0 Preview",
          pages: [
            {
              id: "v2-overview",
              serviceId: "webhook-service",
              versionId: "v2.0",
              title: "v2.0 Architecture Preview",
              category: "v2.0 Preview",
              description: "Next-gen zero-trust webhooks, batch dispatching, and streaming verification.",
              lastUpdated: "2026-08-18",
              badge: "v2.0 NEW",
              addedInVersion: "v2.0",
              componentKey: "overview"
            }
          ]
        }
      ]
    }
  }
}

// Registry Getter Helper Functions
export function getService(serviceId: string): DocService {
  return DOC_SERVICES.find((s) => s.id === serviceId) || DOC_SERVICES[0]
}

export function getServiceVersionData(serviceId: string, versionId: string): ServiceVersionDocData {
  const serviceMap = DOC_REGISTRY[serviceId] || DOC_REGISTRY["webhook-service"]
  return serviceMap[versionId] || serviceMap["v1.0"] || Object.values(serviceMap)[0]
}

export function getDocPage(serviceId: string, versionId: string, docId: string): DocPage | undefined {
  const data = getServiceVersionData(serviceId, versionId)
  for (const cat of data.categories) {
    const page = cat.pages.find((p) => p.id === docId)
    if (page) return page
  }
  // Fallback lookup in default version
  const defaultData = getServiceVersionData(serviceId, "v1.0")
  for (const cat of defaultData.categories) {
    const page = cat.pages.find((p) => p.id === docId)
    if (page) return page
  }
  return undefined
}

export function getAllPagesForVersion(serviceId: string, versionId: string): DocPage[] {
  const data = getServiceVersionData(serviceId, versionId)
  return data.categories.flatMap((cat) => cat.pages)
}

// Backward Compatibility Exports
export const DEFAULT_SERVICE = DOC_SERVICES[0]
export const DOCS_CATEGORIES: DocCategory[] = getServiceVersionData("webhook-service", "v1.0").categories
export const ALL_DOC_PAGES: DocPage[] = getAllPagesForVersion("webhook-service", "v1.0")
