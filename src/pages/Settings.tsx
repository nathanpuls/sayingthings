
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, Save, User, MapPin, Link as LinkIcon, Briefcase, Trash2, Github, Lock } from 'lucide-react';
import RepoPicker from '../components/RepoPicker';
import { EditLinkModal, ConfirmDeleteModal } from '../components/ProjectModals';
import type { Database } from '../types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Project = Database['public']['Tables']['projects']['Row'];

export default function Settings() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Form State (Only for non-GitHub fields)
    const [role, setRole] = useState('');
    const [skills, setSkills] = useState('');

    // Read-Only Display State
    const [displayProfile, setDisplayProfile] = useState<Profile | null>(null);

    // Project State
    const [projects, setProjects] = useState<Project[]>([]);
    const [showRepoPicker, setShowRepoPicker] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [deletingProject, setDeletingProject] = useState<Project | null>(null);

    useEffect(() => {
        async function fetchProfile() {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                navigate('/login');
                return;
            }
            setUser(user);

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .maybeSingle();

            if (error) {
                console.error('Error fetching profile:', error);
            } else if (data) {
                const profileData = data as Profile;
                setDisplayProfile(profileData);
                setRole(profileData.role || '');
                setSkills(profileData.skills ? profileData.skills.join(', ') : '');

                // Fetch Projects
                const { data: projectsData } = await supabase
                    .from('projects')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (projectsData) {
                    setProjects(projectsData);
                }
            }
            setLoading(false);
        }

        fetchProfile();
    }, [navigate]);

    const handleDeleteProject = async (projectId: string) => {
        if (!confirm('Are you sure you want to remove this project?')) return;

        try {
            const { error } = await supabase
                .from('projects')
                .delete()
                .eq('id', projectId);

            if (error) throw error;

            setProjects(projects.filter(p => p.id !== projectId));
            setMessage({ type: 'success', text: 'Project removed successfully' });
        } catch (err: any) {
            setMessage({ type: 'error', text: 'Failed to remove project' });
        }
    };

    const handleProjectImported = () => {
        // Refresh projects
        if (user) {
            supabase
                .from('projects')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .then(({ data }) => {
                    if (data) setProjects(data);
                });
        }
        setMessage({ type: 'success', text: 'Projects imported successfully!' });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            if (!user) throw new Error("No user logged in");

            // Only update Role and Skills, everything else is managed by GitHub auth sync
            const updates = {
                id: user.id,
                role: role,
                skills: skills.split(',').map(s => s.trim()).filter(s => s.length > 0),
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user.id);

            if (error) throw error;

            setMessage({ type: 'success', text: 'Profile updated successfully!' });

            // Redirect to public profile view
            if (displayProfile?.username) {
                setTimeout(() => {
                    navigate(`/${displayProfile.username}`);
                }, 500);
            }

        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
                        <h1 className="text-2xl font-bold text-slate-900">Your Profile</h1>
                        <p className="text-slate-500 mt-1">Manage your portfolio settings</p>
                    </div>

                    <form onSubmit={handleSave} className="p-8 space-y-8">
                        {message && (
                            <div className={`p-4 rounded-xl text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                {message.text}
                            </div>
                        )}

                        {/* Synced Info Section */}
                        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200/60">
                            <div className="flex items-center gap-2 mb-6 text-sm text-slate-500 font-medium">
                                <Github className="w-4 h-4" />
                                Synced from GitHub
                                <div className="ml-auto flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            if (!displayProfile?.username) return;
                                            setLoading(true);
                                            try {
                                                const ghRes = await fetch(`https://api.github.com/users/${displayProfile.username}`);
                                                if (!ghRes.ok) throw new Error('Failed to fetch from GitHub');
                                                const ghData = await ghRes.json();

                                                const updates = {
                                                    bio: ghData.bio,
                                                    location: ghData.location,
                                                    website: ghData.blog,
                                                    full_name: ghData.name,
                                                    avatar_url: ghData.avatar_url,
                                                    updated_at: new Date().toISOString()
                                                };

                                                const { error } = await supabase
                                                    .from('profiles')
                                                    .update(updates)
                                                    .eq('id', user.id);

                                                if (error) throw error;

                                                // Refresh local state
                                                setDisplayProfile(prev => prev ? ({ ...prev, ...updates }) : null);
                                                setMessage({ type: 'success', text: 'Profile synced from GitHub!' });
                                            } catch (e) {
                                                console.error(e);
                                                setMessage({ type: 'error', text: 'Failed to sync. GitHub Rate limit?' });
                                            } finally {
                                                setLoading(false);
                                            }
                                        }}
                                        className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full hover:bg-indigo-100 transition-colors flex items-center gap-1"
                                    >
                                        <Loader2 className={`w-3 h-3 ${loading ? 'animate-spin' : 'hidden'}`} />
                                        Sync Now
                                    </button>
                                    <span className="flex items-center gap-1 text-xs bg-slate-200 px-2 py-0.5 rounded-full text-slate-600">
                                        <Lock className="w-3 h-3" /> Read Only
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-start gap-6">
                                <img
                                    src={displayProfile?.avatar_url || ''}
                                    alt="Profile"
                                    className="w-20 h-20 rounded-full border-4 border-white shadow-sm"
                                />
                                <div className="space-y-4 flex-1">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Full Name</label>
                                            <p className="font-medium text-slate-900">{displayProfile?.full_name}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Username</label>
                                            <p className="font-medium text-slate-900">@{displayProfile?.username}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Bio</label>
                                        <p className="text-slate-600 text-sm leading-relaxed">{displayProfile?.bio || 'No bio set on GitHub'}</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <MapPin className="w-4 h-4 text-slate-400" />
                                            {displayProfile?.location || 'No location'}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <LinkIcon className="w-4 h-4 text-slate-400" />
                                            {displayProfile?.website ? (
                                                <a href={displayProfile.website} target="_blank" rel="noreferrer" className="hover:underline hover:text-primary truncate">
                                                    {displayProfile.website}
                                                </a>
                                            ) : 'No website'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs text-center text-slate-400 mt-6">
                                To update this information, change your <a href="https://github.com/settings/profile" target="_blank" rel="noreferrer" className="underline hover:text-slate-600">GitHub Profile</a> and re-login.
                            </p>
                        </div>

                        {/* Editable Section */}
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                    <Briefcase className="w-4 h-4" /> Role
                                </label>
                                <input
                                    type="text"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    placeholder="e.g. AI Engineer, Prompt Architect"
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Skills</label>
                                <input
                                    type="text"
                                    value={skills}
                                    onChange={(e) => setSkills(e.target.value)}
                                    placeholder="LangChain, Python, OpenAI, Pinecone"
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                />
                                <p className="text-xs text-slate-500">Separate skills with commas</p>
                            </div>
                        </div>

                        {/* Projects Section */}
                        <div className="pt-8 border-t border-slate-100">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">App Showcase</h2>
                                    <p className="text-slate-500 text-sm">Manage the projects displayed on your profile</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowRepoPicker(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-[#24292F] text-white rounded-lg font-medium text-sm hover:bg-[#24292F]/90 transition-colors shadow-lg shadow-slate-900/10"
                                >
                                    <Github className="w-4 h-4" />
                                    Import from GitHub
                                </button>
                            </div>

                            {projects.length === 0 ? (
                                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    <Briefcase className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-500 font-medium">No projects added yet</p>
                                    <p className="text-slate-400 text-sm mt-1">Import your best work from GitHub</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {projects.map(project => (
                                        <div key={project.id} className="p-4 bg-white rounded-xl border border-slate-200 group hover:border-indigo-200 transition-colors">
                                            {/* Edit Mode Logic would go here, simplistic version for now: */}
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-semibold text-slate-900 truncate">{project.title}</h3>
                                                        {project.link_url && (
                                                            <a href={project.link_url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                                                                <LinkIcon className="w-3 h-3" />
                                                                {new URL(project.link_url).hostname}
                                                            </a>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-slate-500 line-clamp-1">{project.description}</p>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {/* Edit Link Button */}
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditingProject(project)}
                                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                        title="Edit Demo Link"
                                                    >
                                                        <LinkIcon className="w-4 h-4" />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => setDeletingProject(project)}
                                                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Remove project"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex justify-end">
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-6 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-500/20 flex items-center gap-2 disabled:opacity-70"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {showRepoPicker && (
                <RepoPicker
                    onClose={() => setShowRepoPicker(false)}
                    onImport={handleProjectImported}
                />
            )}

            {editingProject && (
                <EditLinkModal
                    currentUrl={editingProject.link_url || ''}
                    onClose={() => setEditingProject(null)}
                    onSave={async (newUrl) => {
                        // Optimistic update
                        const updatedProjects = projects.map(p => p.id === editingProject.id ? { ...p, link_url: newUrl } : p);
                        setProjects(updatedProjects);
                        setEditingProject(null); // Close immediately

                        const { error } = await supabase.from('projects').update({ link_url: newUrl }).eq('id', editingProject.id);
                        if (error) {
                            setMessage({ type: 'error', text: 'Failed to update URL' });
                            // Revert? For now just show error
                        }
                    }}
                />
            )}

            {deletingProject && (
                <ConfirmDeleteModal
                    title={deletingProject.title}
                    onClose={() => setDeletingProject(null)}
                    onConfirm={async () => {
                        const projectId = deletingProject.id;
                        // Don't close immediately, wait for delete? Or optimistic?
                        // Optimistic is snappier layout-wise but risky for errors.
                        // Let's do standard await.

                        try {
                            const { error } = await supabase
                                .from('projects')
                                .delete()
                                .eq('id', projectId);

                            if (error) throw error;

                            setProjects(projects.filter(p => p.id !== projectId));
                            setMessage({ type: 'success', text: 'Project removed successfully' });
                            setDeletingProject(null);
                        } catch (err: any) {
                            console.error(err);
                            setMessage({ type: 'error', text: 'Failed to delete project. (Did you run the SQL fix?)' });
                            setDeletingProject(null);
                        }
                    }}
                />
            )}
        </div>
    );
}
