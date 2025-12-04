'use client';

import { useState } from 'react';
import { Video } from 'lucide-react';
import { APP_CONFIG } from '@/lib/config';
import { Recording } from '@/lib/types';
import { useSupabase } from '@/components/AuthProvider';
import { cn } from '@/lib/utils';

interface RecordingCoverProps {
    recording: Recording;
    className?: string;
}

export default function RecordingCover({ recording, className }: RecordingCoverProps) {
    const supabase = useSupabase();
    const [error, setError] = useState(false);

    // Construct the public URL
    // Priority:
    // 1. recording.poster_storage_path (if it's a full URL or path we can use)
    // 2. Derive from recording details if path is just a filename

    let src = '';

    if (recording.poster_storage_path) {
        if (recording.poster_storage_path.startsWith('http')) {
            src = recording.poster_storage_path;
        } else {
            // Assume it's a path within the bucket
            const { data } = supabase.storage
                .from(APP_CONFIG.bucketName)
                .getPublicUrl(recording.poster_storage_path);
            src = data.publicUrl;
        }
    }

    if (!src || error) {
        return (
            <div className={cn("bg-muted flex items-center justify-center text-muted-foreground", className)}>
                <Video className="h-8 w-8 opacity-50" />
            </div>
        );
    }

    return (
        <div className={cn("relative overflow-hidden bg-muted", className)}>
            <img
                src={src}
                alt={`Cover for recording ${recording.id}`}
                className="h-full w-full object-cover transition-opacity duration-300"
                onError={() => setError(true)}
            />
        </div>
    );
}
