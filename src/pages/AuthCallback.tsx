import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';
import { useProfileSync } from '../hooks/useProfileSync';

export default function AuthCallback() {
    const navigate = useNavigate();

    useEffect(() => {
        const handleAuth = async () => {
            console.log('AuthCallback: Starting auth check...');
            try {
                // Wait a moment for the session to be established from the URL hash
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error('AuthCallback Error:', error);
                    navigate('/login');
                    return;
                }

                if (session?.user) {
                    console.log('AuthCallback: Session found ->', session.user.email);
                    await syncProfile(session.user);
                } else {
                    console.log('AuthCallback: No session found initially. Waiting for auth state change...');
                }
            } catch (err: any) {
                if (err.name === 'AbortError') {
                    console.warn('AuthCallback: Request aborted (likely StrictMode or lock contention). Ignoring.');
                    return;
                }
                console.error('AuthCallback: Unexpected error during session check:', err);
                navigate('/login');
            }
        };

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('AuthCallback: AuthStateChange ->', event);
            if (event === 'SIGNED_IN' && session?.user) {
                await syncProfile(session.user);
            }
        });

        handleAuth();

        return () => subscription.unsubscribe();
    }, [navigate]);

    const syncProfile = async (user: any) => {
        try {
            if (!user.user_metadata) return;

            const {
                user_name: username,
                avatar_url,
                full_name,
                email
            } = user.user_metadata;

            if (!username) {
                console.error('No username found in metadata');
                return;
            }

            console.log('Syncing profile for:', username);

            // Fetch fresh data from GitHub API directly
            // user_metadata is often stale or incomplete (lacks bio/location)
            let bio = null;
            let location = null;
            let website = null;

            try {
                const ghRes = await fetch(`https://api.github.com/users/${username}`);
                if (ghRes.ok) {
                    const ghData = await ghRes.json();
                    console.log('Fetched fresh GitHub data:', ghData);
                    bio = ghData.bio;
                    location = ghData.location;
                    website = ghData.blog; // GitHub returns website in 'blog' field
                }
            } catch (e) {
                console.warn('Failed to fetch fresh GitHub data, falling back to metadata', e);
                bio = user.user_metadata.bio;
                location = user.user_metadata.location;
                website = user.user_metadata.website;
            }

            // Check if profile exists
            const { data: existingProfile } = await supabase
                .from('profiles')
                .select('id, username, avatar_url, full_name, bio, location, website')
                .eq('id', user.id)
                .maybeSingle();

            if (!existingProfile) {
                console.log('Creating new profile...');
                await supabase.from('profiles').insert({
                    id: user.id,
                    username: username,
                    full_name: full_name || email?.split('@')[0],
                    avatar_url: avatar_url,
                    bio: bio || null,
                    location: location || null,
                    website: website || null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                });
            } else {
                console.log('Updating existing profile (Strict GitHub Sync)...');
                await supabase.from('profiles').update({
                    username,
                    avatar_url,
                    full_name: full_name || existingProfile.full_name,
                    bio: bio || null,
                    location: location || null,
                    website: website || null,
                    updated_at: new Date().toISOString()
                }).eq('id', user.id);
            }

            // SUCCESS! Redirect to profile
            console.log('Redirecting to profile page...');
            navigate(`/${username}`);

        } catch (err) {
            console.error('Profile sync failed:', err);
            // Fallback redirect
            navigate('/');
        }
    };

    return (
        <div className="min-h-screen pt-20 flex items-center justify-center bg-slate-50">
            <div className="text-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-slate-800">Finalizing login...</h2>
                <p className="text-slate-500">Just a moment while we set up your profile.</p>
            </div>
        </div>
    );
}
