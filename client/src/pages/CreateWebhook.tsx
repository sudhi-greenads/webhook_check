import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CreateWebhook() {
    const [name, setName] = useState('');
    const [key, setKey] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await apiFetch(`/webhooks/register`, {
                method: "POST",
                body: JSON.stringify({ name, key })
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
                    </div>

                    <div className="flex items-center justify-end gap-3 border-t border-border bg-muted/30 px-6 py-4">
                        <Button type="button" variant="ghost" size="sm" onClick={() => navigate('/webhooks')} className="text-muted-foreground h-8 text-xs">
                            Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={isLoading} className="min-w-[100px] h-8 text-xs">
                            {isLoading ? 'Creating...' : (
                                <>
                                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Create
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
