import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Github, Loader2 } from 'lucide-react';

export default function Auth() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGithubLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'github',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                    queryParams: {
                        prompt: 'login',
                    },
                },
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen pt-20 pb-20 flex items-center justify-center bg-slate-50 px-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm border border-slate-100 text-center">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                    Welcome to built.at
                </h1>
                <p className="text-slate-500 mb-8">
                    Sign in to manage your portfolio
                </p>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm text-left">
                        {error}
                    </div>
                )}

                <button
                    onClick={handleGithubLogin}
                    disabled={loading}
                    className="w-full bg-[#24292F] text-white py-3 px-4 rounded-xl font-bold text-lg hover:bg-[#24292F]/90 transition-all transform hover:scale-[1.02] shadow-lg shadow-slate-900/10 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Github className="w-5 h-5" />
                    )}
                    Continue with GitHub
                </button>

                <p className="mt-6 text-xs text-slate-400">
                    By pulling your data from GitHub, we keep your profile sync'd with your developer identity.
                </p>
            </div>
        </div>
    );
}
