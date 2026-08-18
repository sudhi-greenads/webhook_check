import { CodeShellViewer, type CodeTab } from "../../components/CodeShellViewer"

const opensslTerminalTabs: CodeTab[] = [
  {
    id: "openssl",
    label: "OpenSSL Command",
    filename: "generate_keys.sh",
    language: "Bash",
    code: `# 1. Generate RSA 2048-bit Private Key
openssl genpkey -algorithm RSA -out private_key.pem -pkeyopt rsa_keygen_bits:2048

# 2. Extract RSA Public Key from Private Key
openssl rsa -pubout -in private_key.pem -out public_key.pem

# View generated Public Key (copy this into the dashboard)
cat public_key.pem`
  }
]

export function GeneratingKeysDoc() {
  return (
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
  )
}
