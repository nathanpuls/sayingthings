import { useEffect, useState } from 'react';
import { Search, SlidersHorizontal, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];

export default function Explore() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [activeTab, setActiveTab] = useState('All');
    const [builders, setBuilders] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);

    const categories = ['All', 'AI Tools', 'SaaS Templates', 'Plugins', 'Scripts', 'Design Assets'];

    useEffect(() => {
        async function fetchBuilders() {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (!error && data) {
                setBuilders(data);
            }
            setLoading(false);
        }

        fetchBuilders();
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 pt-8 pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-3xl font-bold text-slate-900 mb-4">Explore Talent</h1>
                    <p className="text-slate-600 max-w-2xl">Connect with thousands of top-tier creatives and developers ready to bring your vision to life.</p>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col md:flex-row gap-4 mb-10 items-center justify-between">

                    {/* Categories */}
                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto scrollbar-hide">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveTab(cat)}
                                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeTab === cat
                                    ? 'bg-primary text-white shadow-md shadow-indigo-500/20'
                                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Search/Filter Actions */}
                    <div className="flex gap-3 w-full md:w-auto">
                        <div className="relative flex-grow md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search skills, names, roles..."
                                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>
                        <button className="p-2 border border-slate-200 rounded-xl bg-white text-slate-600 hover:bg-slate-50">
                            <SlidersHorizontal className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {builders.map((builder) => (
                            <Link to={`/${builder.username}`} key={builder.id} className="group block">
                                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex gap-4">
                                            <div className="w-14 h-14 rounded-full bg-slate-100 overflow-hidden">
                                                {builder.avatar_url ? (
                                                    <img src={builder.avatar_url} alt={builder.full_name || ""} className="w-full h-full object-cover" />
                                                ) : (
                                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${builder.username}`} alt={builder.full_name || ""} className="w-full h-full" />
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 group-hover:text-primary transition-colors">{builder.full_name || builder.username}</h3>
                                                <p className="text-sm text-slate-500">{builder.role || "Builder"}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {builder.skills && builder.skills.slice(0, 3).map(skill => (
                                            <span key={skill} className="px-2 py-1 bg-slate-50 text-slate-600 text-xs font-medium rounded-lg">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-sm">
                                        <span className="text-slate-400">@{builder.username}</span>
                                        <span className="text-indigo-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                            View Profile
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
