'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSupabase, useUser } from '@/components/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import Button from '@/components/Button';
import TextField from '@/components/TextField';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/Table';
import { Video, PlayCircle, Search, Filter } from 'lucide-react';
import { Recording } from '@/lib/types';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';

export default function RecordingsPage() {
    const user = useUser();
    const supabase = useSupabase();
    const [recordings, setRecordings] = useState<Recording[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<'all' | 'ready' | 'processing' | 'failed'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        async function loadRecordings() {
            if (!user) return;
            setIsLoading(true);

            try {
                // First get followed live accounts
                const { data: follows } = await supabase
                    .from('follows')
                    .select('live_account_id')
                    .eq('user_id', user.id);

                const liveAccountIds = follows?.map(f => f.live_account_id) || [];

                if (liveAccountIds.length === 0) {
                    setRecordings([]);
                    setIsLoading(false);
                    return;
                }

                let query = supabase
                    .from('recordings')
                    .select(`
            *,
            live_accounts (
              platform,
              account_id,
              canonical_url
            )
          `)
                    .in('live_account_id', liveAccountIds)
                    .order('started_at', { ascending: false });

                if (statusFilter !== 'all') {
                    query = query.eq('status', statusFilter);
                }

                const { data, error } = await query;

                if (error) throw error;

                // Client-side search filtering (simple MVP approach)
                let result = (data as any) || [];
                if (searchQuery) {
                    const lowerQuery = searchQuery.toLowerCase();
                    result = result.filter((rec: any) =>
                        rec.live_accounts?.account_id.toLowerCase().includes(lowerQuery) ||
                        rec.live_accounts?.platform.toLowerCase().includes(lowerQuery)
                    );
                }

                setRecordings(result);
            } catch (error) {
                console.error('Error loading recordings:', error);
            } finally {
                setIsLoading(false);
            }
        }

        loadRecordings();
    }, [user, supabase, statusFilter, searchQuery]);

    const formatDuration = (seconds: number | null) => {
        if (!seconds) return '-';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? `${h}h ` : ''}${m}m ${s}s`;
    };

    const formatSize = (bytes: number | null) => {
        if (!bytes) return '-';
        const mb = bytes / (1024 * 1024);
        if (mb > 1024) {
            return `${(mb / 1024).toFixed(2)} GB`;
        }
        return `${mb.toFixed(0)} MB`;
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Recordings</h1>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-2">
                            <Button
                                variant={statusFilter === 'all' ? 'primary' : 'outline'}
                                size="sm"
                                onClick={() => setStatusFilter('all')}
                            >
                                All
                            </Button>
                            <Button
                                variant={statusFilter === 'ready' ? 'primary' : 'outline'}
                                size="sm"
                                onClick={() => setStatusFilter('ready')}
                            >
                                Ready
                            </Button>
                            <Button
                                variant={statusFilter === 'processing' ? 'primary' : 'outline'}
                                size="sm"
                                onClick={() => setStatusFilter('processing')}
                            >
                                Processing
                            </Button>
                        </div>
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <TextField
                                placeholder="Search channel..."
                                className="pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8">Loading recordings...</div>
                    ) : recordings.length === 0 ? (
                        <div className="text-center py-12">
                            <Video className="mx-auto h-12 w-12 text-muted-foreground/50" />
                            <h3 className="mt-4 text-lg font-semibold">No recordings found</h3>
                            <p className="text-muted-foreground">
                                {statusFilter !== 'all' || searchQuery
                                    ? 'Try adjusting your filters.'
                                    : 'Recordings will appear here once your followed channels go live.'}
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Channel</TableHead>
                                    <TableHead>Started</TableHead>
                                    <TableHead>Duration</TableHead>
                                    <TableHead>Size</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recordings.map((rec) => (
                                    <TableRow key={rec.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{rec.live_accounts?.account_id}</span>
                                                <span className="text-xs text-muted-foreground capitalize">{rec.live_accounts?.platform}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span>{format(new Date(rec.started_at), 'MMM d, yyyy HH:mm')}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {formatDistanceToNow(new Date(rec.started_at), { addSuffix: true })}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{formatDuration(rec.duration_sec)}</TableCell>
                                        <TableCell>{formatSize(rec.size_bytes)}</TableCell>
                                        <TableCell>
                                            <span className={cn(
                                                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                                                rec.status === 'ready' ? "bg-green-500/15 text-green-500" :
                                                    rec.status === 'processing' ? "bg-yellow-500/15 text-yellow-500" :
                                                        "bg-red-500/15 text-red-500"
                                            )}>
                                                {rec.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {rec.status === 'ready' ? (
                                                <Link href={`/recordings/${rec.id}`}>
                                                    <Button size="sm">
                                                        <PlayCircle className="mr-2 h-4 w-4" />
                                                        Watch
                                                    </Button>
                                                </Link>
                                            ) : (
                                                <Button size="sm" variant="ghost" disabled>
                                                    Processing
                                                </Button>
                                            )}
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
