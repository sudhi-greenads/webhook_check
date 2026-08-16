import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function EditWebhook() {
    const { id } = useParams<{ id: string }>();
    const [name, setName] = useState('');
    const [key, setKey] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    
    const navigate = useNavigate();

    useEffect(() => {
        if (!id) return;
        async function fetchWebhook() {
            try {
                setIsFetching(true);
                const res = await apiFetch(`/webhooks/${id}`);
                if (!res.ok) {
                    toast.error("Webhook endpoint not found");
                    navigate('/webhooks');
                    return;
                }
                const data = await res.json();
                if (data.webhook) {
                    setName(data.webhook.name);
                    setKey(data.webhook.key);
                }
            } catch (err) {
                toast.error("Failed to load webhook details");
                navigate('/webhooks');
            } finally {
                setIsFetching(false);
            }
        }
        fetchWebhook();
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
                body: JSON.stringify({ name: name.trim(), key: key.trim() })
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
                <p className="mt-1.5 text-sm text-muted-foreground">Update the identifier path segment and secret key for this webhook listener.</p>
            </div>

            <div className="border border-border bg-card shadow-sm rounded-lg overflow-hidden">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 md:p-8 space-y-8">
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
        </div>
    );
}
