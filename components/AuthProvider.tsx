'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

type SupabaseContextType = {
    supabase: ReturnType<typeof createSupabaseBrowserClient>;
    session: Session | null;
    user: User | null;
    isLoading: boolean;
};

const Context = createContext<SupabaseContextType | undefined>(undefined);

export default function AuthProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [supabase] = useState(() => createSupabaseBrowserClient());
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setIsLoading(false);
            if (event === 'SIGNED_OUT') {
                router.refresh();
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [supabase, router]);

    return (
        <Context.Provider value={{ supabase, session, user, isLoading }}>
            {children}
        </Context.Provider>
    );
}

export const useSupabase = () => {
    const context = useContext(Context);
    if (context === undefined) {
        throw new Error('useSupabase must be used within an AuthProvider');
    }
    return context.supabase;
};

export const useSession = () => {
    const context = useContext(Context);
    if (context === undefined) {
        throw new Error('useSession must be used within an AuthProvider');
    }
    return context.session;
};

export const useUser = () => {
    const context = useContext(Context);
    if (context === undefined) {
        throw new Error('useUser must be used within an AuthProvider');
    }
    return context.user;
};

export const useAuthLoading = () => {
    const context = useContext(Context);
    if (context === undefined) {
        throw new Error('useAuthLoading must be used within an AuthProvider');
    }
    return context.isLoading;
};
