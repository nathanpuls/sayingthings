import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export default function AuthButton() {
    const navigate = useNavigate();
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        }).catch(() => {
            setLoading(false);
        });

        // Forced timeout to prevent eternal spinner if Supabase hangs
        const timeout = setTimeout(() => {
            setLoading(false);
        }, 2000);

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => {
            clearTimeout(timeout);
            subscription.unsubscribe();
        };
    }, []);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    if (loading) {
        return <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />;
    }

    if (user) {
        return (
            <div className="flex items-center gap-4">
                {/* 
                   Ideally we would show the user's avatar from their profile here.
                   For now, we just use a generic user icon or letter.
                */}
                <Link
                    to={user.user_metadata?.username ? `/${user.user_metadata.username}` : '/settings'}
                    className="flex items-center gap-2 text-slate-700 hover:text-primary transition-colors"
                >
                    {user.user_metadata?.avatar_url ? (
                        <img
                            src={user.user_metadata.avatar_url}
                            alt={user.user_metadata.full_name || 'User'}
                            className="w-8 h-8 rounded-full border border-slate-200"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                            {user.email?.[0].toUpperCase()}
                        </div>
                    )}
                </Link>
                <button
                    onClick={handleSignOut}
                    className="text-sm font-medium text-slate-500 hover:text-red-600 transition-colors"
                >
                    Sign Out
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <Link
                to="/login"
                className="px-4 py-2 text-slate-600 hover:text-primary font-medium transition-colors"
            >
                Log In
            </Link>
            <Link
                to="/join"
                className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-500/20"
            >
                Sign Up
            </Link>
        </div>
    );
}

