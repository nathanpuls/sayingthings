import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function useProfileSync() {
    const navigate = useNavigate();

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                console.log('Manual Session Check:', session.user);
                syncProfile(session.user);
            }
        };

        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth State Change:', event);
            if (event === 'SIGNED_IN' && session?.user) {
                syncProfile(session.user);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [navigate]);

    const syncProfile = async (user: any) => {
        console.log('Syncing Profile for user:', user.email);
        // Only sync if we have metadata (which GitHub auth provides)
        if (!user.user_metadata) return;

        const {
            user_name: username,
            avatar_url,
            full_name,
            email,
            bio,
            location,
            website: metaWebsite, // sometimes it's under 'website'
            blog // sometimes it's under 'blog' in GitHub
        } = user.user_metadata;

        const website = metaWebsite || blog;

        if (!username) return;

        // Check if profile exists
        const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id, username, avatar_url, full_name, bio, location, website')
            .eq('id', user.id)
            .maybeSingle();

        if (!existingProfile) {
            console.log('Creating new profile for', username);
            // Profile doesn't exist, create it
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
            console.log('Updating existing profile for', username);
            // Profile exists, sync GitHub data if different
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const updates: any = {};
            let hasUpdates = false;

            if (existingProfile.username !== username) {
                updates.username = username;
                hasUpdates = true;
            }
            if (existingProfile.avatar_url !== avatar_url) {
                updates.avatar_url = avatar_url;
                hasUpdates = true;
            }

            // Only update these fields if they are present in GitHub and different in DB
            if (bio && existingProfile.bio !== bio) {
                updates.bio = bio;
                hasUpdates = true;
            }
            if (location && existingProfile.location !== location) {
                updates.location = location;
                hasUpdates = true;
            }
            if (website && existingProfile.website !== website) {
                updates.website = website;
                hasUpdates = true;
            }

            if (hasUpdates) {
                updates.updated_at = new Date().toISOString();
                await supabase.from('profiles').update(updates).eq('id', user.id);
            }
        }

        // Redirect to profile page only if on login/auth pages or root
        const currentPath = window.location.pathname;
        if (currentPath === '/' || currentPath === '/login' || currentPath === '/auth') {
            console.log('Redirecting to profile:', username);
            navigate(`/${username}`);
        }
    };
}
