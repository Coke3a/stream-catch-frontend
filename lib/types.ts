export type AppUser = {
    id: string;
    display_name: string | null;
    status: 'active' | 'blocked' | 'inactive';
    created_at: string;
};

export type LiveAccount = {
    id: number;
    platform: string;
    account_id: string;
    canonical_url: string;
    status: 'active' | 'paused' | 'error';
    created_at: string;
    updated_at: string;
};

export type Follow = {
    user_id: string;
    live_account_id: number;
    status: 'active' | 'inactive' | 'temporary_inactive';
    created_at: string;
    updated_at: string;
    live_accounts?: LiveAccount;
};

export type Recording = {
    id: number;
    live_account_id: number;
    recording_key: string | null;
    started_at: string;
    ended_at: string | null;
    duration_sec: number | null;
    size_bytes: number | null;
    storage_prefix: string | null;
    status: 'live_recording' | 'live_end' | 'waiting_upload' | 'uploading' | 'ready' | 'failed';
    poster_storage_path: string | null;
    created_at: string;
    updated_at: string;
    live_accounts?: LiveAccount;
};
