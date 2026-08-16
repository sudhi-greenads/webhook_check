import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, RefreshCw, Plus, ShieldCheck, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { CreateAuthKeyModal } from '../components/CreateAuthKeyModal';

type SimpleKey = {
    id: number;
    name: string;
    algorithm: string;
    key_fingerprint: string;
    expires_at: string | null;
};

export default function EditWebhook() {
    const { id } = useParams<{ id: string }>();
    const [name, setName] = useState('');
    const [key, setKey] = useState('');
    const [authKeyId, setAuthKeyId] = useState<string>('');
    const [activeKeys, setActiveKeys] = useState<SimpleKey[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [isCreateKeyOpen, setIsCreateKeyOpen] = useState(false);
    
    const navigate = useNavigate();

    const fetchActiveKeys = async () => {
        try {
            const res = await apiFetch('/keys/active?limit=100');
            const data = await res.json();
            if (data.data) {
                setActiveKeys(data.data);
            }
        } catch (e) {
            // Ignore error
        }
    };

    // Load webhook details and active keys in parallel on mount
    useEffect(() => {
        if (!id) return;
        let isMounted = true;

        async function loadInitialData() {
            try {
                setIsFetching(true);
                const [webhookRes, keysRes] = await Promise.all([
                    apiFetch(`/webhooks/${id}`),
                    apiFetch('/keys/active?limit=100')
                ]);

                if (!webhookRes.ok) {
                    toast.error("Webhook endpoint not found");
                    navigate('/webhooks');
                    return;
                }

                const webhookData = await webhookRes.json();
                const keysData = await keysRes.json();

                if (isMounted) {
                    if (webhookData.webhook) {
                        setName(webhookData.webhook.name);
                        setKey(webhookData.webhook.key);
                        setAuthKeyId(webhookData.webhook.auth_key_id ? String(webhookData.webhook.auth_key_id) : '');
                    }
                    if (keysData.data) {
                        setActiveKeys(keysData.data);
                    }
                }
            } catch (err) {
                if (isMounted) {
                    toast.error("Failed to load endpoint configuration");
                    navigate('/webhooks');
                }
            } finally {
                if (isMounted) {
                    setIsFetching(false);
                }
            }
        }

        loadInitialData();

        return () => {
            isMounted = false;
        };
    }, [id, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !key.trim()) {
            toast.error("Name and key are required");
            return;
        }

        setIsLoading(true);

        try {
            const res = await apiFetch(`/webhooks/${id}`, {
                method: "PUT",
                body: JSON.stringify({ 
                    name: name.trim(), 
                    key: key.trim(),
                    auth_key_id: authKeyId ? parseInt(authKeyId) : null
                })
            });
            const data = await res.json();

            if (data.success) {
                toast.success('Endpoint updated successfully');
                navigate('/webhooks');
            } else {
                toast.error(data.error || "Failed to update endpoint");
            }
        } catch (err) {
            toast.error('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching) {
        return (
            <div className="mx-auto w-full max-w-3xl pt-16 flex flex-col items-center justify-center">
                <RefreshCw className="h-8 w-8 text-muted-foreground animate-spin mb-3" />
                <p className="text-sm text-muted-foreground">Loading endpoint configuration...</p>
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-3xl pt-6">
            <div className="mb-6 flex items-center">
                <Link to="/webhooks" className="flex items-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                    Back to Endpoints
                </Link>
            </div>

            <div className="mb-6">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">Edit Endpoint</h1>
                <p className="mt-1.5 text-sm text-muted-foreground">Update the identifier path segment, secret key, or authentication settings for this webhook listener.</p>
            </div>

            <div className="border border-border bg-card shadow-sm rounded-lg overflow-hidden">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 md:p-8 space-y-8">
                        {/* Identifier */}
                        <div className="grid md:grid-cols-[1fr_2fr] gap-4 md:gap-8 items-start">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-foreground">Identifier</label>
                                <p className="text-xs text-muted-foreground leading-relaxed">The primary path segment for this endpoint.</p>
                            </div>
                            <div>
                                <Input 
                                    id="name" 
                                    type="text" 
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. stripe-events"
                                    className="font-mono text-sm max-w-md bg-background h-9"
                                />
                            </div>
                        </div>

                        <div className="h-px bg-border w-full" />

                        {/* Secret Key */}
                        <div className="grid md:grid-cols-[1fr_2fr] gap-4 md:gap-8 items-start">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-foreground">Secret Key</label>
                                <p className="text-xs text-muted-foreground leading-relaxed">Secures your endpoint via the second path segment.</p>
                            </div>
                            <div>
                                <Input 
                                    id="key" 
                                    type="text" 
                                    required
                                    value={key}
                                    onChange={(e) => setKey(e.target.value)}
                                    placeholder="e.g. api-123456789"
                                    className="font-mono text-sm max-w-md bg-background h-9"
                                />
                            </div>
                        </div>

                        <div className="h-px bg-border w-full" />

                        {/* Auth Key Security Option */}
                        <div className="grid md:grid-cols-[1fr_2fr] gap-4 md:gap-8 items-start">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                                    <Lock className="h-3.5 w-3.5 text-primary" />
                                    Authentication & Security
                                </label>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Enforce asymmetric RS256 JWT signature verification on all incoming webhook deliveries.
                                </p>
                            </div>
                            <div className="space-y-3 max-w-md">
                                <div className="flex gap-2">
                                    <select
                                        value={authKeyId}
                                        onChange={(e) => setAuthKeyId(e.target.value)}
                                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary h-9"
                                    >
                                        <option value="">No Authentication (Public Webhook)</option>
                                        {activeKeys.map((k) => (
                                            <option key={k.id} value={k.id}>
                                                🔒 {k.name} ({k.algorithm})
                                            </option>
                                        ))}
                                    </select>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsCreateKeyOpen(true)}
                                        className="h-9 px-2.5 text-xs shrink-0 gap-1"
                                        title="Create a new Auth Key"
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                        New Key
                                    </Button>
                                </div>

                                {authKeyId ? (
                                    <div className="flex items-start gap-2 p-2.5 rounded-md bg-primary/5 border border-primary/20 text-[11px] text-muted-foreground">
                                        <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                        <span>
                                            Incoming requests must include an <code>Authorization: Bearer &lt;jwt&gt;</code> header signed with this key's private counterpart.
                                        </span>
                                    </div>
                                ) : (
                                    <p className="text-[11px] text-muted-foreground">
                                        Anyone with the endpoint URL can deliver payloads without providing a JWT header.
                                    </p>
                                )}
                            </div>
                        </div>

                    </div>

                    <div className="flex items-center justify-end gap-3 border-t border-border bg-muted/30 px-6 py-4">
                        <Button type="button" variant="ghost" size="sm" onClick={() => navigate('/webhooks')} className="text-muted-foreground h-8 text-xs">
                            Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={isLoading} className="min-w-[100px] h-8 text-xs">
                            {isLoading ? 'Saving...' : (
                                <>
                                    <Save className="mr-1.5 h-3.5 w-3.5" /> Save Changes
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>

            {/* Quick Key Creation Modal */}
            <CreateAuthKeyModal
                isOpen={isCreateKeyOpen}
                onClose={() => setIsCreateKeyOpen(false)}
                onSuccess={() => fetchActiveKeys()}
            />
        </div>
    );
}
