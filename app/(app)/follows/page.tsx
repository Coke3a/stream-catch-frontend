'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSupabase, useUser, useSession } from '@/components/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/Card';
import RecordingCover from '@/components/RecordingCover';
import Button from '@/components/Button';
import TextField from '@/components/TextField';
import { Plus, Trash2, ExternalLink, AlertCircle, CheckCircle2, Search, Filter, ChevronDown, ChevronUp, Video, Clock, Calendar } from 'lucide-react';
import { APP_CONFIG } from '@/lib/config';
import { Follow, LiveAccount, Recording } from '@/lib/types';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';

type FollowWithData = Follow & {
    live_accounts: LiveAccount & {
        recordings: Recording[];
    };
};

export default function FollowsPage() {
    const user = useUser();
    const supabase = useSupabase();
    const session = useSession();

    const [follows, setFollows] = useState<FollowWithData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Add Channel State
    const [url, setUrl] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [addError, setAddError] = useState<string | null>(null);
    const [addSuccess, setAddSuccess] = useState<string | null>(null);

    // Filter & Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'recording' | 'offline'>('all');
    const [filterPlatform, setFilterPlatform] = useState<string>('all');

    // Accordion State
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

    const loadFollows = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('follows')
                .select(`
          *,
          live_accounts (
            *,
            recordings (
              *
            )
          )
        `)
                .eq('user_id', user.id)
                .in('status', ['active', 'temporary_inactive'])
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Sort recordings for each follow by started_at desc
            const processedData = (data as any[]).map(f => ({
                ...f,
                live_accounts: {
                    ...f.live_accounts,
                    recordings: (f.live_accounts.recordings || []).sort((a: Recording, b: Recording) =>
                        new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
                    )
                }
            }));

            setFollows(processedData);
        } catch (error) {
            console.error('Error loading follows:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadFollows();
    }, [user, supabase]);

    const handleAddChannel = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url || !session) return;

        setIsAdding(true);
        setAddError(null);
        setAddSuccess(null);

        try {
            const encodedUrl = btoa(url).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
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

    const handleRemove = async (liveAccountId: number, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent accordion toggle
        if (!confirm('Are you sure you want to remove this channel? You can add it again later.')) return;

        try {
            const { error } = await supabase
                .from('follows')
                .update({ status: 'inactive' })
                .eq('user_id', user!.id)
                .eq('live_account_id', liveAccountId);

            if (error) throw error;

            // Optimistic update
            setFollows(follows.filter(f => f.live_account_id !== liveAccountId));
        } catch (error) {
            console.error('Error removing channel:', error);
            alert('Failed to remove channel');
        }
    };

    const toggleExpand = (id: number) => {
        const newExpanded = new Set(expandedIds);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedIds(newExpanded);
    };

    const isLiveRecording = (recordings: Recording[]) => {
        return recordings.some(r => r.status === 'live_recording');
    };

    const filteredFollows = follows.filter(follow => {
        const matchesSearch =
            follow.live_accounts.account_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            follow.live_accounts.platform.toLowerCase().includes(searchQuery.toLowerCase());

        const isRecording = isLiveRecording(follow.live_accounts.recordings);
        const matchesStatus =
            filterStatus === 'all' ? true :
                filterStatus === 'recording' ? isRecording :
                    !isRecording; // offline

        const matchesPlatform =
            filterPlatform === 'all' ? true :
                follow.live_accounts.platform.toLowerCase() === filterPlatform.toLowerCase();

        return matchesSearch && matchesStatus && matchesPlatform;
    });

    const uniquePlatforms = Array.from(new Set(follows.map(f => f.live_accounts.platform)));

    const formatDuration = (seconds: number | null) => {
        if (!seconds) return '-';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? `${h}h ` : ''}${m}m ${s}s`;
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Followed Channels</h1>
            </div>

            {/* Add Channel Card */}
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

            {/* Search & Filter Bar */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <TextField
                        placeholder="Search by name or platform..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                    >
                        <option value="all">All Status</option>
                        <option value="recording">Recording</option>
                        <option value="offline">Offline</option>
                    </select>
                    <select
                        className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 capitalize"
                        value={filterPlatform}
                        onChange={(e) => setFilterPlatform(e.target.value)}
                    >
                        <option value="all">All Platforms</option>
                        {uniquePlatforms.map(p => (
                            <option key={p} value={p}>{p}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Follows List (Accordion) */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="text-center py-8">Loading channels...</div>
                ) : filteredFollows.length === 0 ? (
                    <div className="text-center py-12 border rounded-lg bg-card text-card-foreground shadow-sm">
                        <div className="flex flex-col items-center gap-2">
                            <Search className="h-8 w-8 text-muted-foreground/50" />
                            <h3 className="text-lg font-semibold">No channels found</h3>
                            <p className="text-muted-foreground">
                                {follows.length === 0
                                    ? "You haven't followed any channels yet."
                                    : "No channels match your current filters."}
                            </p>
                        </div>
                    </div>
                ) : (
                    filteredFollows.map((follow) => {
                        const isExpanded = expandedIds.has(follow.live_account_id);
                        const isRecording = isLiveRecording(follow.live_accounts.recordings);
                        const recordingCount = follow.live_accounts.recordings.length;

                        return (
                            <div key={follow.live_account_id} className="border rounded-lg bg-card text-card-foreground shadow-sm overflow-hidden transition-all">
                                {/* Accordion Header */}
                                <div
                                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                                    onClick={() => toggleExpand(follow.live_account_id)}
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Platform Icon / Placeholder */}
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold capitalize">
                                            {follow.live_accounts.platform[0]}
                                        </div>

                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-lg">{follow.live_accounts.account_id}</span>
                                                <a
                                                    href={follow.live_accounts.canonical_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-muted-foreground hover:text-primary"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <ExternalLink className="h-3 w-3" />
                                                </a>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <span className="capitalize">{follow.live_accounts.platform}</span>
                                                <span>•</span>
                                                <span>{recordingCount} recordings</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        {isRecording && (
                                            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/15 text-red-500 text-xs font-medium animate-pulse">
                                                <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                                                LIVE RECORDING
                                            </div>
                                        )}

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-muted-foreground hover:text-destructive"
                                            onClick={(e) => handleRemove(follow.live_account_id, e)}
                                        >
                                            Remove
                                        </Button>

                                        {isExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                                    </div>
                                </div>

                                {/* Accordion Body */}
                                {isExpanded && (
                                    <div className="border-t bg-muted/30 p-4">
                                        {follow.live_accounts.recordings.length === 0 ? (
                                            <div className="text-center py-8 text-muted-foreground text-sm">
                                                No recordings available for this channel yet.
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {follow.live_accounts.recordings.map((rec) => (
                                                    <Link key={rec.id} href={`/recordings/${rec.id}`}>
                                                        <div className="group relative flex gap-3 p-3 rounded-lg border bg-background hover:border-primary/50 transition-colors cursor-pointer">
                                                            {/* Cover Image Placeholder */}
                                                            {/* Cover Image */}
                                                            <RecordingCover
                                                                recording={rec}
                                                                className="h-20 w-32 rounded-md flex-shrink-0"
                                                            />

                                                            <div className="flex flex-col justify-between py-1 min-w-0">
                                                                <div>
                                                                    <h4 className="font-medium text-sm truncate pr-2" title={rec.live_accounts?.account_id}>
                                                                        {format(new Date(rec.started_at), 'MMM d, yyyy HH:mm')}
                                                                    </h4>
                                                                    <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                                                                        <Clock className="h-3 w-3" />
                                                                        <span>{formatDuration(rec.duration_sec)}</span>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-2">
                                                                    <span className={cn(
                                                                        "text-[10px] px-1.5 py-0.5 rounded-full font-medium uppercase tracking-wider",
                                                                        rec.status === 'ready' ? "bg-green-500/10 text-green-500" :
                                                                            rec.status === 'failed' ? "bg-red-500/10 text-red-500" :
                                                                                "bg-yellow-500/10 text-yellow-500"
                                                                    )}>
                                                                        {rec.status.replace('_', ' ')}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
