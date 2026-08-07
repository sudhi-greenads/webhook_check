import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Link, useNavigate } from "react-router-dom"
import { Plus, Activity } from "lucide-react"

type Webhook = {
  name: string
  key: string
  created_at: string
}

export default function Home() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [name, setName] = useState("")
  const [key, setKey] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    fetch("/api/webhooks")
      .then(res => res.json())
      .then(data => setWebhooks(data))
      .catch(console.error)
  }, [])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return

    try {
      const baseUrl = import.meta.env.VITE_FRONTEND_PUBLIC_URL || window.location.origin
      const res = await fetch(`${baseUrl}/api/webhooks/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, key })
      })
      const data = await res.json()
      if (data.success) {
        navigate(`/logs/${data.name}/${data.key}`)
      } else {
        alert(data.message || data.error || "Failed to register")
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 pt-6">
      <Card>
        <CardHeader>
          <CardTitle>Register Webhook</CardTitle>
          <CardDescription>
            Create a new isolated webhook listener.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Name / Organization</label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="e.g. tenlify" 
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Key (Optional)</label>
              <input 
                type="text" 
                value={key} 
                onChange={e => setKey(e.target.value)} 
                placeholder="Leave blank to auto-generate" 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <Button type="submit" className="w-full mt-2">
              <Plus className="mr-2 h-4 w-4" /> Register Endpoint
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Webhooks</CardTitle>
          <CardDescription>
            Select a webhook to view its specific logs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
            {webhooks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No webhooks registered yet.</p>
            ) : (
              webhooks.map((wh) => (
                <Link key={`${wh.name}-${wh.key}`} to={`/logs/${wh.name}/${wh.key}`}>
                  <div className="flex items-center justify-between p-3 border rounded-md hover:bg-muted transition-colors">
                    <div className="flex items-center gap-3">
                      <Activity className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">/{wh.name}/{wh.key}</span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
