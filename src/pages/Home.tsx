

import { motion } from 'framer-motion';
import { Search, ArrowRight, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
    return (
        <>
            {/* Hero Section */}
            <section className="pt-20 pb-20 px-4">
                <div className="max-w-7xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <span className="inline-block py-1 px-3 rounded-full bg-indigo-50 text-primary text-sm font-medium mb-6">
                            The Marketplace for Builders
                        </span>
                        <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight text-slate-900">
                            Where creators <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
                                showcase their craft
                            </span>
                        </h1>
                        <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                            Discover exceptional talent, browse unique portfolios, and connect with the builders shaping the future of digital experiences.
                        </p>

                        {/* Search Bar - Navigate to explore on click/focus for now or keep functional */}
                        <div className="max-w-2xl mx-auto relative mb-12 group">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-lg transition-all"
                                placeholder="Search for designers, developers, and creators..."
                            />
                        </div>

                        <div className="flex justify-center gap-8 text-sm text-slate-500 font-medium">
                            <span className="flex items-center gap-2">
                                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                Top-rated talent
                            </span>
                            <span className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center">
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                </div>
                                Verified profiles
                            </span>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Featured Grid */}
            <section className="py-20 bg-white/50">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex justify-between items-end mb-12">
                        <h2 className="text-3xl font-bold text-slate-900">Featured Builders</h2>
                        <Link to="/explore" className="text-primary font-medium hover:text-indigo-700 flex items-center gap-1">
                            View All <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[1, 2, 3].map((i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all cursor-pointer group"
                            >
                                <div className="h-48 bg-slate-100 rounded-xl mb-6 overflow-hidden relative">
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-violet-500/5 group-hover:scale-105 transition-transform duration-500" />
                                </div>
                                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">Portfolio Title {i}</h3>
                                <p className="text-slate-500 mb-4">A showcase of modern web development and design systems.</p>
                                <div className="flex items-center text-primary font-medium text-sm">
                                    View Profile <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
}
