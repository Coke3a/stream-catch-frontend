'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, Video, User, CreditCard, FileText } from 'lucide-react';

const items = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
    },
    {
        title: 'Followed Channels',
        href: '/follows',
        icon: Users,
    },
    {
        title: 'Recordings',
        href: '/recordings',
        icon: Video,
    },
    {
        title: 'Profile',
        href: '/profile',
        icon: User,
    },
];

const disabledItems = [
    {
        title: 'Plans',
        href: '/plans',
        icon: FileText,
    },
    {
        title: 'Billing',
        href: '/billing',
        icon: CreditCard,
    },
];

export default function SidebarNav() {
    const pathname = usePathname();

    return (
        <nav className="grid items-start gap-2">
            {items.map((item) => {
                const Icon = item.icon;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            'group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground',
                            pathname === item.href ? 'bg-accent text-accent-foreground' : 'transparent'
                        )}
                    >
                        <Icon className="mr-2 h-4 w-4" />
                        <span>{item.title}</span>
                    </Link>
                );
            })}
            <div className="my-2 border-t border-border" />
            {disabledItems.map((item) => {
                const Icon = item.icon;
                return (
                    <div
                        key={item.href}
                        className="group flex cursor-not-allowed items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground opacity-50"
                    >
                        <Icon className="mr-2 h-4 w-4" />
                        <span>{item.title}</span>
                        <span className="ml-auto text-xs">Soon</span>
                    </div>
                );
            })}
        </nav>
    );
}
