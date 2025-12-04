export const APP_CONFIG = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    backendBaseUrl: process.env.NEXT_PUBLIC_BACKEND_BASE_URL!,
    bucketName: process.env.NEXT_PUBLIC_BUCKET_NAME || 'recordings',
};
