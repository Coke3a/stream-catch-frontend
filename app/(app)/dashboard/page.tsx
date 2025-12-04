'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSupabase, useUser } from '@/components/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import RecordingCover from '@/components/RecordingCover';
import Button from '@/components/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/Table';
import { Users, Video, PlayCircle, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Recording } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
    const user = useUser();
    const supabase = useSupabase();
    const [stats, setStats] = useState({
        following: 0,
        recordings: 0,
        ready: 0,
    });
    const [recentRecordings, setRecentRecordings] = useState<Recording[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadDashboardData() {
            if (!user) return;

            try {
                // Fetch stats
                const { count: followingCount } = await supabase
                    .from('follows')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id);

                // For recordings, we need to join with follows to ensure ownership/access
                // But for MVP1, let's assume we can query recordings directly if we had a user_id on them?
                // Wait, the schema says recordings -> live_accounts. follows -> live_accounts + user_id.
                // So we need to find recordings for live_accounts that the user follows.
                // This is a bit complex for a simple count query without a view or function.
                // Let's fetch the user's followed live_account_ids first.

                const { data: follows } = await supabase
                    .from('follows')
                    .select('live_account_id')
                    .eq('user_id', user.id);

                const liveAccountIds = follows?.map(f => f.live_account_id) || [];

                let recordingsCount = 0;
                let readyCount = 0;
                let recent: Recording[] = [];

                if (liveAccountIds.length > 0) {
                    const { count: totalRecs } = await supabase
                        .from('recordings')
                        .select('*', { count: 'exact', head: true })
                        .in('live_account_id', liveAccountIds);

                    const { count: readyRecs } = await supabase
                        .from('recordings')
                        .select('*', { count: 'exact', head: true })
                        .in('live_account_id', liveAccountIds)
                        .eq('status', 'ready');

                    recordingsCount = totalRecs || 0;
                    readyCount = readyRecs || 0;

                    // Fetch recent recordings
                    const { data: recentRecs } = await supabase
                        .from('recordings')
                        .select(`
              *,
              live_accounts (
                platform,
                account_id
              )
            `)
                        .in('live_account_id', liveAccountIds)
                        .order('started_at', { ascending: false })
                        .limit(5);

                    recent = (recentRecs as any) || [];
                }

                setStats({
                    following: followingCount || 0,
                    recordings: recordingsCount,
                    ready: readyCount,
                });
                setRecentRecordings(recent);
            } catch (error) {
                console.error('Error loading dashboard data:', error);
            } finally {
                setIsLoading(false);
            }
        }

        loadDashboardData();
    }, [user, supabase]);

    const displayName = user?.user_metadata?.display_name || 'User';

    if (isLoading) {
        return <div className="p-8 text-center">Loading dashboard...</div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Account Status: Active</span>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Following</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.following}</div>
                        <p className="text-xs text-muted-foreground">Live channels tracked</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Recordings</CardTitle>
                        <Video className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.recordings}</div>
                        <p className="text-xs text-muted-foreground">Captured streams</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ready to Watch</CardTitle>
                        <PlayCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.ready}</div>
                        <p className="text-xs text-muted-foreground">Processed and available</p>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold tracking-tight">Recent Recordings</h2>
                    <Link href="/recordings">
                        <Button variant="ghost" size="sm">View All</Button>
                    </Link>
                </div>

                {recentRecordings.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                            <Video className="mb-4 h-12 w-12 text-muted-foreground/50" />
                            <h3 className="text-lg font-semibold">No recordings yet</h3>
                            <p className="mb-6 max-w-sm text-sm text-muted-foreground">
                                Follow some live channels to start automatically recording streams.
                            </p>
                            <Link href="/follows">
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Channel
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Channel</TableHead>
                                    <TableHead>Platform</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentRecordings.map((rec) => (
                                    <TableRow key={rec.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-3">
                                                <RecordingCover
                                                    recording={rec}
                                                    className="h-10 w-16 rounded-sm flex-shrink-0"
                                                />
                                                {rec.live_accounts?.account_id}
                                            </div>
                                        </TableCell>
                                        <TableCell className="capitalize">
                                            {rec.live_accounts?.platform}
                                        </TableCell>
                                        <TableCell>
                                            {formatDistanceToNow(new Date(rec.started_at), { addSuffix: true })}
                                        </TableCell>
                                        <TableCell>
                                            <span className={cn(
                                                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                                                rec.status === 'ready' ? "bg-green-500/15 text-green-500" :
                                                    rec.status === 'live_recording' ? "bg-yellow-500/15 text-yellow-500" :
                                                        "bg-red-500/15 text-red-500"
                                            )}>
                                                {rec.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {rec.status === 'ready' && (
                                                <Link href={`/recordings/${rec.id}`}>
                                                    <Button size="sm" variant="ghost">Watch</Button>
                                                </Link>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                )}
            </div>
        </div>
    );
}
