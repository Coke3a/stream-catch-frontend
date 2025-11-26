'use client';

import Link from 'next/link';
import { useUser, useSupabase } from './AuthProvider';
import { useRouter } from 'next/navigation';
import { LogOut, User as UserIcon } from 'lucide-react';
import Button from './Button';

export default function Navbar() {
    const user = useUser();
    const supabase = useSupabase();
    const router = useRouter();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.refresh();
    };

    const displayName = user?.user_metadata?.display_name || user?.email || 'User';
    const initial = displayName[0]?.toUpperCase() || 'U';

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                <span className="text-xl font-bold tracking-tight text-primary">StreamCatch</span>
            </Link>
            <div className="ml-auto flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                        {initial}
                    </div>
                    <span className="hidden md:inline-block font-medium">{displayName}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout} title="Sign out">
                    <LogOut className="h-4 w-4" />
                </Button>
            </div>
        </header>
    );
}
