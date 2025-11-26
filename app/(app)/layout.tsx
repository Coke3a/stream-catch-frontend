'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthLoading, useSession } from '@/components/AuthProvider';
import Navbar from '@/components/Navbar';
import SidebarNav from '@/components/SidebarNav';
import { Loader2 } from 'lucide-react';

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = useSession();
    const isLoading = useAuthLoading();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !session) {
            router.push('/login');
        }
    }, [isLoading, session, router]);

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!session) {
        return null; // Will redirect
    }

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <Navbar />
            <div className="flex flex-1">
                <aside className="hidden w-64 border-r bg-muted/10 p-6 md:block">
                    <SidebarNav />
                </aside>
                <main className="flex-1 p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
