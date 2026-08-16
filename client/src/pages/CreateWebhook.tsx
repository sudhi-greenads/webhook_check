import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2, KeyRound, Plus, ShieldCheck, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { CreateAuthKeyModal } from '../components/CreateAuthKeyModal';

type SimpleKey = {
    id: number;
    name: string;
    algorithm: string;
    key_fingerprint: string;
    expires_at: string | null;
};

export default function CreateWebhook() {
    const [name, setName] = useState('');
    const [key, setKey] = useState('');
    const [authKeyId, setAuthKeyId] = useState<string>('');
    const [activeKeys, setActiveKeys] = useState<SimpleKey[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreateKeyOpen, setIsCreateKeyOpen] = useState(false);
    
    const navigate = useNavigate();

    const fetchActiveKeys = async () => {
        try {
            const res = await apiFetch('/keys/active');
            const data = await res.json();
            if (data.data) {
                setActiveKeys(data.data);
            }
        } catch (e) {
            // Ignore error
        }
    };

    useEffect(() => {
        fetchActiveKeys();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await apiFetch(`/webhooks/register`, {
                method: "POST",
                body: JSON.stringify({ 
                    name, 
                    key,
                    auth_key_id: authKeyId ? parseInt(authKeyId) : null
                })
            });
            const data = await res.json();

            if (data.success) {
                toast.success('Endpoint created successfully');
                navigate(`/logs/${data.name}/${data.key}`);
            } else {
                toast.error(data.message || data.error || "Failed to create endpoint");
            }
        } catch (err) {
            toast.error('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="mx-auto w-full max-w-3xl pt-6">
            <div className="mb-6 flex items-center">
                <Link to="/webhooks" className="flex items-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                    Back to Endpoints
                </Link>
            </div>

            <div className="mb-6">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">Create Endpoint</h1>
                <p className="mt-1.5 text-sm text-muted-foreground">Configure a new webhook URL to receive incoming HTTP requests.</p>
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
                                <p className="text-xs text-muted-foreground leading-relaxed">Secures your endpoint via the second path segment. Auto-generated if omitted.</p>
                            </div>
                            <div>
                                <Input 
                                    id="key" 
                                    type="text" 
                                    value={key}
                                    onChange={(e) => setKey(e.target.value)}
                                    placeholder="Leave blank to auto-generate"
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
                            {isLoading ? 'Creating...' : (
                                <>
                                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Create Endpoint
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
