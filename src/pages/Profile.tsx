

import { useEffect, useState } from 'react';
import { useParams, Link as LinkIconWrapper } from 'react-router-dom';
import { MapPin, Link as LinkIcon, Calendar, Loader2, User, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Project = Database['public']['Tables']['projects']['Row'];

export default function Profile() {
    const { username } = useParams();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null); // Ideally use Supabase User type
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Check current user
        supabase.auth.getUser().then(({ data: { user } }) => {
            setCurrentUser(user);
        });

        async function fetchData() {
            if (!username) return;
            setLoading(true);
            setError(null);

            try {
                // 1. Try fetching from Supabase
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('username', username)
                    .maybeSingle();

                if (profileError) throw profileError;

                if (profileData) {
                    setProfile(profileData);
                    // Fetch Projects for registered user
                    const { data: projectsData } = await supabase
                        .from('projects')
                        .select('*')
                        .eq('user_id', profileData.id)
                        .order('created_at', { ascending: false });
                    setProjects(projectsData || []);
                } else {
                    // 2. Fallback: Try fetching from GitHub API directly
                    console.log(`User ${username} not found in DB, checking GitHub...`);
                    const ghResponse = await fetch(`https://api.github.com/users/${username}`);

                    if (ghResponse.ok) {
                        const ghUser = await ghResponse.json();

                        // Construct a "Preview" profile
                        const previewProfile: Profile = {
                            id: 'preview', // distinct ID
                            username: ghUser.login,
                            full_name: ghUser.name,
                            avatar_url: ghUser.avatar_url,
                            bio: ghUser.bio,
                            location: ghUser.location,
                            website: ghUser.blog,
                            role: ghUser.company,
                            skills: [],
                            created_at: ghUser.created_at,
                            updated_at: new Date().toISOString()
                        };
                        setProfile(previewProfile);

                        // Fetch pinned or public repos for this GitHub user
                        const reposResponse = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=6`);
                        if (reposResponse.ok) {
                            const repos = await reposResponse.json();
                            // Transform GitHub repos into Project format
                            const previewProjects = repos.map((repo: any) => ({
                                id: repo.id.toString(),
                                user_id: 'preview',
                                title: repo.name,
                                description: repo.description,
                                category: 'Code',
                                link_url: repo.html_url,
                                image_url: null, // No images for raw GitHub repos
                                language: repo.language,
                                stargazers_count: repo.stargazers_count,
                                created_at: repo.created_at
                            }));
                            setProjects(previewProjects);
                        }

                    } else {
                        // Not found on GitHub either
                        setProfile(null);
                    }
                }

            } catch (err: any) {
                if (err.message?.includes('AbortError') || err.name === 'AbortError') return;
                console.error(err);
                setError('Error loading profile.');
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [username]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    // Handle case where profile doesn't exist
    if (!profile) {
        // Check if the requested username matches the logged-in user's metadata username
        // or if the user is just logged in and we want to be helpful.
        const isOwner = currentUser?.user_metadata?.username === username || currentUser?.email?.split('@')[0] === username; // Simple fallback check

        if (isOwner) {
            return (
                <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-slate-100">
                        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <User className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Set up your profile</h2>
                        <p className="text-slate-500 mb-8">
                            Your profile page is ready to be claimed. Add your details to start showcasing your work.
                        </p>
                        <LinkIconWrapper to="/settings" className="inline-flex items-center justify-center w-full px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-500/20">
                            Create Profile
                        </LinkIconWrapper>
                    </div>
                </div>
            );
        }

        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">
                {error || 'User not found'}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">

            {/* Cover Image - Reduced height */}
            <div className={`w-full relative bg-gradient-to-r from-indigo-600 to-violet-600 ${profile.id === 'preview' ? 'h-40' : 'h-48 mt-16'}`}>
                <div className="absolute inset-0 bg-black/10"></div>

                {/* Preview Banner - Integrated */}
                {profile.id === 'preview' && (
                    <div className="absolute top-4 right-4 z-10 md:top-auto md:bottom-4">
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-3 py-1.5 flex items-center gap-3 shadow-sm hover:bg-white/20 transition-all">
                            <div className="flex items-center gap-2 text-white/90">
                                <User className="w-3.5 h-3.5" />
                                <span className="text-xs font-medium">Unclaimed Profile</span>
                            </div>
                            <LinkIconWrapper to="/login" className="px-2.5 py-0.5 bg-white text-indigo-600 text-xs font-bold rounded shadow-sm hover:bg-indigo-50 transition-colors">
                                Claim
                            </LinkIconWrapper>
                        </div>
                    </div>
                )}
            </div>

            {/* Profile Content - Adjusted overlap */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative px-4">
                <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 md:p-8">
                    <div className="flex flex-col md:flex-row gap-6 md:items-start">
                        {/* Avatar */}
                        <div className="w-32 h-32 rounded-2xl bg-white p-1 shadow-lg -mt-16 md:-mt-24">
                            <div className="w-full h-full rounded-xl bg-slate-200 flex items-center justify-center text-4xl text-slate-400 font-bold overflow-hidden">
                                {profile.avatar_url ? (
                                    <img src={profile.avatar_url} alt={profile.full_name || 'Avatar'} className="w-full h-full object-cover" />
                                ) : (
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`} alt="Avatar" className="w-full h-full" />
                                )}
                            </div>
                        </div>

                        {/* Profile Info */}
                        <div className="flex-grow">
                            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                                <div>
                                    <h1 className="text-3xl font-bold text-slate-900">{profile.full_name || username}</h1>
                                    <p className="text-lg text-slate-500 font-medium">@{profile.username}</p>
                                </div>
                                <div className="flex gap-3">
                                    {currentUser && currentUser.id === profile.id && (
                                        <LinkIconWrapper to="/settings" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors shadow-sm">
                                            Edit Profile
                                        </LinkIconWrapper>
                                    )}
                                </div>
                            </div>

                            <div className="mt-4">
                                <p className="text-slate-600 leading-relaxed max-w-2xl">{profile.bio || "No bio yet."}</p>
                            </div>

                            <div className="flex flex-wrap gap-4 mt-6 text-sm text-slate-500">
                                {profile.location && (
                                    <div className="flex items-center gap-1.5">
                                        <MapPin className="w-4 h-4" />
                                        {profile.location}
                                    </div>
                                )}
                                {profile.website && (
                                    <div className="flex items-center gap-1.5">
                                        <LinkIcon className="w-4 h-4" />
                                        <a href={profile.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">{profile.website}</a>
                                    </div>
                                )}
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4" />
                                    Joined {new Date(profile.created_at).toLocaleDateString()}
                                </div>
                            </div>

                            {profile.skills && (
                                <div className="flex flex-wrap gap-2 mt-6">
                                    {profile.skills.map((skill) => (
                                        <span key={skill} className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Portfolio Section */}
                <div className="mt-12">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6">Tools & Software</h2>
                    {projects.length === 0 ? (
                        <p className="text-slate-500">No projects found.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {projects.map((project) => (
                                <a href={project.link_url || '#'} target="_blank" rel="noopener noreferrer" key={project.id} className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer block">
                                    <div className="h-32 bg-slate-100 relative overflow-hidden">
                                        {project.image_url ? (
                                            <img src={project.image_url} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className="absolute inset-0 bg-slate-50 group-hover:scale-105 transition-transform duration-500 flex items-center justify-center">
                                                {/* Fallback for code repos if no image */}
                                                <div className="text-slate-300">
                                                    <div className="w-12 h-12 rounded-lg bg-white shadow-sm flex items-center justify-center text-xl font-bold font-mono text-slate-400">
                                                        {project.title.substring(0, 2).toUpperCase()}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <div className="absolute top-3 right-3 flex gap-2">
                                            {project['language'] && (
                                                <span className="px-1.5 py-0.5 bg-black/70 backdrop-blur-md rounded-md text-[10px] font-bold text-white shadow-sm border border-white/10">
                                                    {project['language']}
                                                </span>
                                            )}
                                        </div>
                                        {project.category && (
                                            <div className="absolute bottom-3 left-3">
                                                <span className="px-2 py-0.5 bg-white/90 backdrop-blur-sm rounded-md text-[10px] font-bold text-slate-900 shadow-sm">
                                                    {project.category}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors truncate pr-2">{project.title}</h3>
                                            {project['stargazers_count'] !== undefined && project['stargazers_count'] !== null && (
                                                <div className="flex items-center gap-1 text-slate-500 text-xs font-medium bg-slate-50 px-1.5 py-0.5 rounded">
                                                    <Star className="w-3 h-3 fill-current text-amber-400" />
                                                    {project['stargazers_count']}
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed h-8">{project.description}</p>
                                    </div>
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
