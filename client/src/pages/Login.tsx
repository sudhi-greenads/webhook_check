import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../lib/api';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const res = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();

            if (data.success) {
                login(data.user, data.accessToken, data.refreshToken);
                navigate('/');
            } else {
                setError(data.error || 'Login failed');
            }
        } catch (err) {
            setError('Network error. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4">
                        <svg className="w-6 h-6 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><path d="M72 136 L112 176 L184 96" stroke="currentColor" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" fill="none"/><circle cx="72" cy="136" r="12" fill="currentColor"/><circle cx="112" cy="176" r="12" fill="currentColor"/><circle cx="184" cy="96" r="12" fill="currentColor"/><path d="M32 96 L72 136" stroke="currentColor" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/><path d="M184 96 L224 56" stroke="currentColor" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">Welcome back</h1>
                    <p className="text-sm text-muted-foreground mt-1">Sign in to your account</p>
                </div>

                <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        {error && (
                            <div className="rounded-md bg-destructive/10 px-3 py-2.5 text-xs text-destructive border border-destructive/20 font-medium">
                                {error}
                            </div>
                        )}
                        
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-foreground">Username</label>
                            <Input 
                                id="username" 
                                type="text" 
                                required
                                className="bg-background h-9 text-sm" 
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                        
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-foreground">Password</label>
                            <Input 
                                id="password" 
                                type="password" 
                                required 
                                className="bg-background h-9 text-sm" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <Button className="w-full h-9 text-sm mt-2" type="submit" disabled={isLoading}>
                            {isLoading ? 'Signing in...' : 'Sign in'}
                        </Button>
                    </form>
                    <div className="border-t border-border bg-muted/30 px-6 py-4 text-center">
                        <span className="text-xs text-muted-foreground">
                            Don't have an account? <Link to="/register" className="text-foreground hover:underline font-medium">Sign up</Link>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
