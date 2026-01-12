import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import AuthButton from './AuthButton';

export default function Navbar() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = () => {
        if (searchQuery.trim()) {
            navigate(`/${searchQuery.trim()}`);
            setSearchQuery(''); // Clear after search
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <nav className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-100 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">

                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 group">
                    <img src="/logo.jpg" alt="built.at" className="w-8 h-8 rounded-lg shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform" />
                    <span className="text-xl font-bold text-slate-900 tracking-tight">Built.at</span>
                </Link>

                {/* Search Bar (Centered) */}
                <div className="hidden md:flex items-center bg-slate-100 rounded-xl px-4 py-2 w-full max-w-md mx-4 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                    <Search className="w-4 h-4 text-slate-400 mr-2" />
                    <input
                        type="text"
                        placeholder="Search for developers..."
                        className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder:text-slate-400"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4">
                    {/* Mobile Search Button (Visible only on small screens) */}
                    <button onClick={handleSearch} className="md:hidden p-2 text-slate-400 hover:text-primary transition-colors">
                        <Search className="w-5 h-5" />
                    </button>

                    <Link to="/explore" className="hidden md:block text-sm font-medium text-slate-600 hover:text-primary transition-colors">Explore</Link>
                    <AuthButton />
                </div>
            </div>
        </nav>
    );
}
