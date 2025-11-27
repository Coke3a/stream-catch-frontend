'use client';

import { useEffect, useState } from 'react';
import { useSupabase, useUser, useSession } from '@/components/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/Card';
import Button from '@/components/Button';
import TextField from '@/components/TextField';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/Table';
import { Plus, Trash2, ExternalLink, AlertCircle, CheckCircle2 } from 'lucide-react';
import { APP_CONFIG } from '@/lib/config';
import { Follow, LiveAccount } from '@/lib/types';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

type FollowWithAccount = Follow & {
    live_accounts: LiveAccount;
};

export default function FollowsPage() {
    const user = useUser();
    const supabase = useSupabase();
    const [follows, setFollows] = useState<FollowWithAccount[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [url, setUrl] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [addError, setAddError] = useState<string | null>(null);
    const [addSuccess, setAddSuccess] = useState<string | null>(null);

    const loadFollows = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('follows')
                .select(`
          *,
          live_accounts (
            *
          )
        `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setFollows((data as any) || []);
        } catch (error) {
            console.error('Error loading follows:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadFollows();
    }, [user, supabase]);

    const session = useSession();

    const handleAddChannel = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url || !session) return;

        setIsAdding(true);
        setAddError(null);
        setAddSuccess(null);

        try {
            // Encode URL to base64url
            const encodedUrl = btoa(url).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

            // Construct API URL
            // Ensure backendBaseUrl doesn't have trailing slash if we add one, or vice versa.
            // Assuming backendBaseUrl is http://localhost:8080/api/v1/ based on user feedback
            const baseUrl = APP_CONFIG.backendBaseUrl.endsWith('/')
                ? APP_CONFIG.backendBaseUrl
                : `${APP_CONFIG.backendBaseUrl}/`;

            const apiUrl = `${baseUrl}live-following/${encodedUrl}`;

            const res = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                },
            });

            if (res.ok) {
                setAddSuccess('Channel added successfully');
                setUrl('');
                loadFollows();
            } else if (res.status === 409) {
                throw new Error('You are already following this channel');
            } else if (res.status === 400) {
                const text = await res.text();
                throw new Error(text || 'Invalid URL or unsupported platform');
            } else {
                const text = await res.text();
                throw new Error(text || 'Failed to add channel');
            }

        } catch (err: any) {
            setAddError(err.message || 'An error occurred');
        } finally {
            setIsAdding(false);
        }
    };

    const handleUnfollow = async (liveAccountId: number) => {
        if (!confirm('Are you sure you want to unfollow this channel?')) return;

        try {
            const { error } = await supabase
                .from('follows')
                .delete()
                .eq('user_id', user!.id)
                .eq('live_account_id', liveAccountId);

            if (error) throw error;

            // Optimistic update
            setFollows(follows.filter(f => f.live_account_id !== liveAccountId));
        } catch (error) {
            console.error('Error unfollowing:', error);
            alert('Failed to unfollow channel');
        }
    };

    const handleToggleStatus = async (liveAccountId: number, currentStatus: string) => {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        try {
            const { error } = await supabase
                .from('follows')
                .update({ status: newStatus })
                .eq('user_id', user!.id)
                .eq('live_account_id', liveAccountId);

            if (error) throw error;

            // Optimistic update
            setFollows(follows.map(f =>
                f.live_account_id === liveAccountId
                    ? { ...f, status: newStatus as any }
                    : f
            ));
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Followed Channels</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Add New Channel</CardTitle>
                    <CardDescription>
                        Enter the URL of a live stream channel (e.g. TikTok, Bigo) to start tracking it.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAddChannel} className="flex gap-4">
                        <div className="flex-1">
                            <TextField
                                placeholder="https://www.tiktok.com/@username"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                disabled={isAdding}
                            />
                        </div>
                        <Button type="submit" disabled={isAdding || !url}>
                            {isAdding ? 'Adding...' : 'Add Channel'}
                        </Button>
                    </form>
                    {addError && (
                        <div className="mt-4 flex items-center gap-2 text-sm text-destructive">
                            <AlertCircle className="h-4 w-4" />
                            <span>{addError}</span>
                        </div>
                    )}
                    {addSuccess && (
                        <div className="mt-4 flex items-center gap-2 text-sm text-green-500">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>{addSuccess}</span>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Your Channels</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8">Loading channels...</div>
                    ) : follows.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            You are not following any channels yet.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Platform</TableHead>
                                    <TableHead>Account ID</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Added</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {follows.map((follow) => (
                                    <TableRow key={follow.live_account_id}>
                                        <TableCell className="capitalize font-medium">
                                            {follow.live_accounts.platform}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span>{follow.live_accounts.account_id}</span>
                                                <a
                                                    href={follow.live_accounts.canonical_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-muted-foreground hover:text-primary"
                                                >
                                                    <ExternalLink className="h-3 w-3" />
                                                </a>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className={cn(
                                                    "inline-flex h-2 w-2 rounded-full",
                                                    follow.live_accounts.status === 'active' ? "bg-green-500" :
                                                        follow.live_accounts.status === 'paused' ? "bg-yellow-500" :
                                                            "bg-red-500"
                                                )} />
                                                <span className="text-sm text-muted-foreground capitalize">
                                                    {follow.live_accounts.status}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {formatDistanceToNow(new Date(follow.created_at), { addSuffix: true })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleToggleStatus(follow.live_account_id, follow.status)}
                                                >
                                                    {follow.status === 'active' ? 'Pause' : 'Resume'}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => handleUnfollow(follow.live_account_id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
