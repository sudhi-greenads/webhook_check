import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_BASE_URL } from '../lib/api';

interface User {
    id: number;
    username: string;
}

interface AuthContextType {
    user: User | null;
    accessToken: string | null;
    login: (user: User, accessToken: string, refreshToken: string) => void;
    logout: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Load session from local storage on mount
        const storedUser = localStorage.getItem('user');
        const storedAccessToken = localStorage.getItem('accessToken');
        
        if (storedUser && storedAccessToken) {
            try {
                setUser(JSON.parse(storedUser));
                setAccessToken(storedAccessToken);
            } catch (e) {
                console.error("Failed to parse user from local storage");
            }
        }
        setIsLoading(false);

        // Listen for token expiration from api.ts
        const handleExpired = () => {
            logout();
        };

        window.addEventListener('auth:expired', handleExpired);
        return () => window.removeEventListener('auth:expired', handleExpired);
    }, []);

    const login = (newUser: User, newAccessToken: string, newRefreshToken: string) => {
        setUser(newUser);
        setAccessToken(newAccessToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        localStorage.setItem('accessToken', newAccessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
    };

    const logout = () => {
        setUser(null);
        setAccessToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{ user, accessToken, login, logout, isAuthenticated: !!user, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
