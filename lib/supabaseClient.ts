import { createBrowserClient } from '@supabase/ssr';
import { APP_CONFIG } from './config';

export const createSupabaseBrowserClient = () =>
    createBrowserClient(
        APP_CONFIG.supabaseUrl,
        APP_CONFIG.supabaseAnonKey
    );
