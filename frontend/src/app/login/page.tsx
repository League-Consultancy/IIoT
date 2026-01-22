'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Activity, LogIn, AlertCircle } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const { login, isAuthenticated, isLoading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Redirect if already authenticated
    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            router.push('/dashboard');
        }
    }, [isAuthenticated, isLoading, router]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            await login(email, password);
            router.push('/dashboard');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
        } finally {
            setIsSubmitting(false);
        }
    }

    // Show loading while checking auth
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
                <Activity className="w-12 h-12 text-primary-400 animate-pulse" />
            </div>
        );
    }

    // Don't render form if authenticated (will redirect)
    if (isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
                <Activity className="w-12 h-12 text-primary-400 animate-pulse" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
            <div className="w-full max-w-md">
                {/* Logo and Title */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 mb-4">
                        <Activity className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Device Analytics Platform</h1>
                    <p className="text-slate-400 mt-2">Sign in to your account</p>
                </div>

                {/* Login Form */}
                <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 shadow-xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input w-full bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                                placeholder="admin@demo.com"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input w-full bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full btn-primary py-3 text-base font-semibold"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Signing in...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <LogIn className="w-5 h-5" />
                                    Sign In
                                </span>
                            )}
                        </button>
                    </form>

                    {/* Demo Credentials */}
                    <div className="mt-6 pt-6 border-t border-slate-700/50">
                        <p className="text-xs text-slate-500 text-center mb-3">Demo Credentials</p>
                        <div className="grid grid-cols-1 gap-2 text-xs">
                            <div className="flex justify-between p-2 rounded bg-slate-700/30">
                                <span className="text-slate-400">Admin:</span>
                                <span className="text-slate-300 font-mono">admin@demo.com / password123</span>
                            </div>
                            <div className="flex justify-between p-2 rounded bg-slate-700/30">
                                <span className="text-slate-400">User:</span>
                                <span className="text-slate-300 font-mono">user@demo.com / password123</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
