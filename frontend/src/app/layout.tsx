import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
    title: 'Device Analytics Platform',
    description: 'Enterprise Device Session Analytics Platform',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className="min-h-screen bg-background font-sans antialiased">
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
