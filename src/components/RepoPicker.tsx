
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, GitFork, Star, Github, Plus, Check } from 'lucide-react';

interface Repo {
    id: number;
    name: string;
    description: string;
    html_url: string;
    homepage: string | null;
    stargazers_count: number;
    language: string;
    full_name: string;
}

interface RepoPickerProps {
    onClose: () => void;
    onImport: () => void;
}

export default function RepoPicker({ onClose, onImport }: RepoPickerProps) {
    const [repos, setRepos] = useState<Repo[]>([]);
    const [loading, setLoading] = useState(true);
    const [importing, setImporting] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedRepos, setSelectedRepos] = useState<Set<number>>(new Set());

    useEffect(() => {
        fetchRepos();
    }, []);

    const fetchRepos = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user?.user_metadata?.user_name) throw new Error("No GitHub username found");

            const username = user.user_metadata.user_name;
            // Fetch public repos
            const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=100`);

            if (!response.ok) throw new Error('Failed to fetch repositories');

            const data = await response.json();
            setRepos(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async (repo: Repo) => {
        setImporting(repo.id);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            // Prioritize homepage (live site) over html_url (github repo) for the main link
            const mainLink = repo.homepage || repo.html_url;

            // Insert into projects table
            const { error } = await supabase.from('projects').insert({
                user_id: user.id,
                title: repo.name,
                description: repo.description || 'No description provided',
                link_url: mainLink,
                github_repo_id: repo.id,
                stargazers_count: repo.stargazers_count,
                language: repo.language,
                category: 'Code',
                created_at: new Date().toISOString()
            });

            if (error) {
                // If unique violation (already imported), just notify? 
                // Currently database might throw 409 if unique constraint exists on github_repo_id?
                // Or if RLS fails :)
                if (error.code === '23505') {
                    // Unique violation, ignore or alert
                } else {
                    throw error;
                }
            }

            setSelectedRepos(prev => new Set(prev).add(repo.id));
            onImport(); // Refresh parent or show success

        } catch (err: any) {
            console.error(err);
            alert('Failed to import project: ' + err.message);
        } finally {
            setImporting(null);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white z-10">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Github className="w-6 h-6" />
                            Import from GitHub
                        </h2>
                        <p className="text-slate-500 text-sm mt-1">Select repositories to showcase on your profile</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors">
                        ✕
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                        </div>
                    ) : error ? (
                        <div className="text-center py-12 text-red-500">
                            {error}
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {repos.map(repo => {
                                const isImported = selectedRepos.has(repo.id);
                                return (
                                    <div key={repo.id} className="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors flex justify-between items-start gap-4 shadow-sm group">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="font-semibold text-slate-900 truncate" title={repo.name}>{repo.name}</h3>
                                                {repo.language && (
                                                    <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                                                        {repo.language}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-500 line-clamp-2 mb-3 h-10">
                                                {repo.description || <span className="italic opacity-50">No description</span>}
                                            </p>
                                            <div className="flex items-center gap-4 text-xs text-slate-400">
                                                <span className="flex items-center gap-1">
                                                    <Star className="w-3 h-3" />
                                                    {repo.stargazers_count}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <GitFork className="w-3 h-3" />
                                                    0
                                                </span>
                                                {repo.homepage && (
                                                    <span className="text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                        Live Site
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleImport(repo)}
                                            disabled={importing === repo.id || isImported}
                                            className={`
                                                flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all
                                                ${isImported
                                                    ? 'bg-green-50 text-green-600 border border-green-200'
                                                    : 'bg-white border border-slate-200 text-slate-700 hover:border-indigo-500 hover:text-indigo-600 shadow-sm'
                                                }
                                            `}
                                        >
                                            {importing === repo.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : isImported ? (
                                                <>
                                                    <Check className="w-4 h-4" />
                                                    Imported
                                                </>
                                            ) : (
                                                <>
                                                    <Plus className="w-4 h-4" />
                                                    Import
                                                </>
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-slate-100 bg-white flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
