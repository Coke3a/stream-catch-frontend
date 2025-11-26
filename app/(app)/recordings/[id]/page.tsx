'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useSupabase, useSession } from '@/components/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import Button from '@/components/Button';
import { ArrowLeft, Calendar, Clock, HardDrive, ExternalLink, AlertTriangle } from 'lucide-react';
import { APP_CONFIG } from '@/lib/config';
import { Recording } from '@/lib/types';
import { format } from 'date-fns';

export default function WatchPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const session = useSession();
    const supabase = useSupabase();
    const [recording, setRecording] = useState<Recording | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadRecording() {
            if (!session) return;
            setIsLoading(true);
            setError(null);

            try {
                // 1. Fetch recording metadata
                const { data: rec, error: dbError } = await supabase
                    .from('recordings')
                    .select(`
            *,
            live_accounts (
              platform,
              account_id,
              canonical_url
            )
          `)
                    .eq('id', id)
                    .single();

                if (dbError) throw dbError;
                setRecording(rec as any);

                // 2. Get signed URL from backend
                // We need to pass the access token
                const token = session.access_token;
                const res = await fetch(`${APP_CONFIG.backendBaseUrl}/api/watch-url?recording_id=${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!res.ok) {
                    if (res.status === 403 || res.status === 401) {
                        throw new Error('You do not have permission to watch this recording.');
                    }
                    throw new Error('Failed to load video stream.');
                }

                const { url } = await res.json();
                setVideoUrl(url);

            } catch (err: any) {
                console.error('Error loading watch page:', err);
                setError(err.message || 'An unexpected error occurred.');
            } finally {
                setIsLoading(false);
            }
        }

        loadRecording();
    }, [id, session, supabase]);

    if (isLoading) {
        return <div className="p-8 text-center">Loading player...</div>;
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
                <h2 className="text-xl font-bold mb-2">Unable to play video</h2>
                <p className="text-muted-foreground mb-6">{error}</p>
                <Link href="/recordings">
                    <Button variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Recordings
                    </Button>
                </Link>
            </div>
        );
    }

    if (!recording) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/recordings">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold truncate">
                    {recording.live_accounts?.account_id} - {format(new Date(recording.started_at), 'MMM d, yyyy')}
                </h1>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-4">
                    <div className="aspect-video w-full overflow-hidden rounded-lg bg-black shadow-lg">
                        {videoUrl ? (
                            <video
                                controls
                                autoPlay
                                className="h-full w-full"
                                poster={recording.poster_storage_path || undefined}
                            >
                                <source src={videoUrl} type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                        ) : (
                            <div className="flex h-full items-center justify-center text-muted-foreground">
                                Video URL not available
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recording Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between border-b pb-2">
                                <span className="text-sm text-muted-foreground">Platform</span>
                                <span className="font-medium capitalize">{recording.live_accounts?.platform}</span>
                            </div>
                            <div className="flex items-center justify-between border-b pb-2">
                                <span className="text-sm text-muted-foreground">Channel</span>
                                <a
                                    href={recording.live_accounts?.canonical_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 font-medium text-primary hover:underline"
                                >
                                    {recording.live_accounts?.account_id}
                                    <ExternalLink className="h-3 w-3" />
                                </a>
                            </div>
                            <div className="flex items-center justify-between border-b pb-2">
                                <span className="text-sm text-muted-foreground flex items-center gap-2">
                                    <Calendar className="h-4 w-4" /> Date
                                </span>
                                <span className="font-medium">
                                    {format(new Date(recording.started_at), 'MMM d, yyyy')}
                                </span>
                            </div>
                            <div className="flex items-center justify-between border-b pb-2">
                                <span className="text-sm text-muted-foreground flex items-center gap-2">
                                    <Clock className="h-4 w-4" /> Time
                                </span>
                                <span className="font-medium">
                                    {format(new Date(recording.started_at), 'HH:mm')}
                                </span>
                            </div>
                            {recording.duration_sec && (
                                <div className="flex items-center justify-between border-b pb-2">
                                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Clock className="h-4 w-4" /> Duration
                                    </span>
                                    <span className="font-medium">
                                        {Math.floor(recording.duration_sec / 60)}m {recording.duration_sec % 60}s
                                    </span>
                                </div>
                            )}
                            {recording.size_bytes && (
                                <div className="flex items-center justify-between border-b pb-2">
                                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                                        <HardDrive className="h-4 w-4" /> Size
                                    </span>
                                    <span className="font-medium">
                                        {(recording.size_bytes / (1024 * 1024)).toFixed(1)} MB
                                    </span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
