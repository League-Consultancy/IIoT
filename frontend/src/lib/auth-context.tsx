'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';

interface User {
    id: string;
    email: string;
    name: string;
    role: 'user' | 'programmer' | 'admin';
    tenantId: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string, tenantSlug?: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check if user is already authenticated
        checkAuth();
    }, []);

    async function checkAuth() {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                setIsLoading(false);
                return;
            }

            const response = await api.getMe();
            if (response.success) {
                setUser({
                    id: response.data.id,
                    email: response.data.email,
                    name: response.data.name,
                    role: response.data.role,
                    tenantId: response.data.tenant_id,
                });
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            api.clearTokens();
        } finally {
            setIsLoading(false);
        }
    }

    async function login(email: string, password: string, tenantSlug?: string) {
        const response = await api.login(email, password, tenantSlug);
        if (response.success) {
            setUser({
                id: response.data.user.id,
                email: response.data.user.email,
                name: response.data.user.name,
                role: response.data.user.role,
                tenantId: response.data.user.tenantId,
            });
        } else {
            throw new Error(response.error || 'Login failed');
        }
    }

    async function logout() {
        try {
            await api.logout();
        } finally {
            setUser(null);
        }
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
