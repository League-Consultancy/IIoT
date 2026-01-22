'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Activity } from 'lucide-react';

export default function HomePage() {
    const router = useRouter();
    const { isAuthenticated, isLoading } = useAuth();

    useEffect(() => {
        if (!isLoading) {
            if (isAuthenticated) {
                router.push('/dashboard');
            } else {
                router.push('/login');
            }
        }
    }, [isAuthenticated, isLoading, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
            <div className="text-center">
                <Activity className="w-16 h-16 mx-auto text-primary-400 animate-pulse" />
                <h1 className="mt-4 text-2xl font-bold text-white">Device Analytics Platform</h1>
                <p className="mt-2 text-slate-400">Loading...</p>
            </div>
        </div>
    );
}
