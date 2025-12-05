'use client';

import { useState, useEffect } from 'react';
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
    const [src, setSrc] = useState('');

    // Load the signed URL for private bucket access
    useEffect(() => {
        const loadImage = async () => {

            if (!recording.poster_storage_path) {
                return;
            }

            // If it's already a full URL, use it directly
            if (recording.poster_storage_path.startsWith('http')) {
                setSrc(recording.poster_storage_path);
                return;
            }
            // Generate a signed URL for private bucket access
            // The URL will be valid for 1 hour (3600 seconds)
            // Ensure the path includes the 'recordings/' folder
            let filePath = recording.poster_storage_path;

            const { data, error: signedUrlError } = await supabase.storage
                .from(APP_CONFIG.bucketName)
                .createSignedUrl(filePath, 3600);

            if (signedUrlError || !data?.signedUrl) {
                console.error('Failed to create signed URL:', signedUrlError);
                setError(true);
                return;
            }

            setSrc(data.signedUrl);
        };

        loadImage();
    }, [recording.poster_storage_path, supabase]);

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
