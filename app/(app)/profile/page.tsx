'use client';

import { useEffect, useState } from 'react';
import { useSupabase, useUser } from '@/components/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/Card';
import Button from '@/components/Button';
import TextField from '@/components/TextField';
import { User, CreditCard, CheckCircle2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { AppUser } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
    const user = useUser();
    const supabase = useSupabase();
    const [appUser, setAppUser] = useState<AppUser | null>(null);
    const [displayName, setDisplayName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        async function loadProfile() {
            if (!user) return;

            const { data, error } = await supabase
                .from('app_users')
                .select('*')
                .eq('id', user.id)
                .single();

            if (data) {
                setAppUser(data as any);
                setDisplayName(data.display_name || '');
            }
        }

        loadProfile();
    }, [user, supabase]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsSaving(true);
        setMessage(null);

        try {
            // Also update user_metadata.display_name
            const { error: authError } = await supabase.auth.updateUser({
                data: {
                    display_name: displayName
                }
            });

            if (authError) throw authError;

            setMessage({ type: 'success', text: 'Profile updated successfully' });
        } catch (err: any) {
            console.error('Error updating profile:', err);
            setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
        } finally {
            setIsSaving(false);
        }
    };

    if (!user) return null;

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold tracking-tight">Profile</h1>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>Update your personal details.</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSave}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email</label>
                                <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground">
                                    {user.email}
                                </div>
                            </div>

                            <TextField
                                label="Display Name"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                disabled={isSaving}
                            />

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Account Status</label>
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center rounded-full bg-green-500/15 px-2.5 py-0.5 text-xs font-medium text-green-500">
                                        {appUser?.status || 'Active'}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Member Since</label>
                                <div className="text-sm text-muted-foreground">
                                    {appUser?.created_at ? format(new Date(appUser.created_at), 'MMMM d, yyyy') : '-'}
                                </div>
                            </div>

                            {message && (
                                <div className={cn(
                                    "flex items-center gap-2 rounded-md p-3 text-sm",
                                    message.type === 'success' ? "bg-green-500/15 text-green-500" : "bg-destructive/15 text-destructive"
                                )}>
                                    {message.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                                    <span>{message.text}</span>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" isLoading={isSaving}>Save Changes</Button>
                        </CardFooter>
                    </form>
                </Card>

                <div className="space-y-6">
                    <Card className="opacity-60">
                        <CardHeader>
                            <CardTitle>Avatar</CardTitle>
                            <CardDescription>Change your profile picture.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center py-6">
                            <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
                                <User className="h-12 w-12 text-muted-foreground" />
                            </div>
                            <Button variant="outline" disabled>Upload Image</Button>
                            <p className="mt-2 text-xs text-muted-foreground">Coming soon</p>
                        </CardContent>
                    </Card>

                    <Card className="opacity-60">
                        <CardHeader>
                            <CardTitle>Billing & Subscription</CardTitle>
                            <CardDescription>Manage your plan and payment methods.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4 rounded-md border p-4">
                                <CreditCard className="h-6 w-6 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">Free Plan</p>
                                    <p className="text-sm text-muted-foreground">You are currently on the free plan.</p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button variant="outline" className="w-full" disabled>Upgrade Plan</Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}
