'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from 'next-themes';
import {
    Activity,
    LayoutDashboard,
    HardDrive,
    Factory,
    FileDown,
    LogOut,
    Moon,
    Sun,
    Menu,
    X,
    User,
} from 'lucide-react';
import { useState } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isLoading, isAuthenticated, logout } = useAuth();
    const { theme, setTheme } = useTheme();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <Activity className="w-12 h-12 mx-auto text-primary-500 animate-pulse" />
                    <p className="mt-2 text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    async function handleLogout() {
        await logout();
        router.push('/login');
    }

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Devices', href: '/dashboard/devices', icon: HardDrive },
        { name: 'Factories', href: '/dashboard/factories', icon: Factory },
        { name: 'Exports', href: '/dashboard/exports', icon: FileDown },
    ];

    // Check if current path matches navigation item
    function isActive(href: string): boolean {
        if (href === '/dashboard') {
            return pathname === '/dashboard';
        }
        return pathname.startsWith(href);
    }

    // Get current page name for mobile header
    function getCurrentPageName(): string {
        const current = navigation.find(item => isActive(item.href));
        return current?.name || 'Dashboard';
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 z-50 h-full w-64 bg-card border-r transform transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center justify-between px-4 h-16 border-b">
                        <Link href="/dashboard" className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                                <Activity className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-semibold text-foreground">Analytics</span>
                        </Link>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden p-1 rounded-lg hover:bg-muted"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-1">
                        {navigation.map((item) => {
                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${active
                                            ? 'bg-primary-500/10 text-primary-500 font-medium'
                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                        }`}
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <item.icon className={`w-5 h-5 ${active ? 'text-primary-500' : ''}`} />
                                    <span>{item.name}</span>
                                    {active && (
                                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500" />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User section */}
                    <div className="p-4 border-t">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center">
                                <User className="w-5 h-5 text-primary-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
                                <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                className="flex-1 btn-secondary py-2"
                            >
                                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                            </button>
                            <button onClick={handleLogout} className="flex-1 btn-secondary py-2 text-red-500">
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <div className="lg:pl-64">
                {/* Top bar */}
                <header className="sticky top-0 z-30 h-16 border-b bg-background/95 backdrop-blur">
                    <div className="flex items-center justify-between h-full px-4">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden p-2 rounded-lg hover:bg-muted"
                            >
                                <Menu className="w-5 h-5" />
                            </button>
                            <h1 className="text-lg font-semibold text-foreground">{getCurrentPageName()}</h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground hidden sm:block">
                                {user?.email}
                            </span>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="p-4 lg:p-6">{children}</main>
            </div>
        </div>
    );
}
