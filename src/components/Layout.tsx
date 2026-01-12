

import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
export default function Layout() {
    // Simplified: No auto-sync on every page load. Auth is handled in AuthCallback.

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
            <Navbar />
            <main className="flex-grow pt-16">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}
