import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Search, User, LogOut, Home, School, Layers } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../assets/logo.png';

export default function Layout() {
    const { currentUser, userRole, logout } = useAuth();
    const location = useLocation();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const handleLogout = async () => {
        try {
            await logout();
            window.location.href = '/';
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    const getDashboardLink = () => {
        if (!currentUser) return '/school-admin-login';
        if (userRole === 'super_admin') return '/super-admin';
        if (['school_admin', 'reporter', 'pending_school_admin'].includes(userRole)) return '/school-admin';
        return '/school-admin';
    };

    const isHomePage = location.pathname === '/';

    const navLinks = [
        { to: '/', label: 'Home' },
        { to: '/schools', label: 'Schools' },
        { to: '/categories', label: 'Categories' },
        { to: '/about', label: 'About' },
    ];

    return (
        <div className="min-h-screen flex flex-col font-sans bg-gray-50 overflow-x-hidden pb-16 md:pb-0">
            {/* Header */}
            <header
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
                    scrolled || !isHomePage
                        ? 'bg-white/95 backdrop-blur-xl shadow-[0_1px_40px_-10px_rgba(0,0,0,0.12)] border-b border-slate-100/80'
                        : 'bg-transparent'
                }`}
            >
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3 group flex-shrink-0">
                        <motion.div whileHover={{ scale: 1.05 }} className="w-12 h-12 flex items-center justify-center">
                            <img src={logo} alt="News Journal SL" className="w-full h-full object-contain drop-shadow-sm" />
                        </motion.div>
                        <span className={`text-xl font-black tracking-tighter transition-colors duration-300 ${
                            scrolled || !isHomePage ? 'text-slate-900' : 'text-white'
                        }`}>
                            News Journal <span className={scrolled || !isHomePage ? 'text-blue-600' : 'text-blue-300'}>SL</span>
                        </span>
                    </Link>

                    {/* Desktop Navigation Links */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navLinks.map(({ to, label }) => {
                            const active = location.pathname === to;
                            return (
                                <Link
                                    key={to}
                                    to={to}
                                    className={`relative px-4 py-2 text-sm font-bold tracking-wide rounded-lg transition-all duration-200 group ${
                                        active
                                            ? (scrolled || !isHomePage ? 'text-blue-600' : 'text-white')
                                            : (scrolled || !isHomePage
                                                ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                                : 'text-white/70 hover:text-white hover:bg-white/10')
                                    }`}
                                >
                                    {label}
                                    <span className={`absolute bottom-1 left-4 right-4 h-0.5 rounded-full bg-blue-500 transition-transform duration-300 origin-left ${
                                        active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                                    }`} />
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Desktop & Mobile Actions */}
                    <div className="flex items-center gap-3">
                        <Link
                            to="/search"
                            className={`p-2.5 rounded-xl transition-all duration-200 ${
                                scrolled || !isHomePage
                                    ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                                    : 'text-white/60 hover:text-white hover:bg-white/10'
                            }`}
                        >
                            <Search size={20} />
                        </Link>

                        {currentUser ? (
                            <>
                                <Link
                                    to={getDashboardLink()}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition-all duration-200 shadow-md shadow-blue-600/30"
                                >
                                    <User size={14} /> Dashboard
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className={`p-2 rounded-xl transition-all duration-200 ${
                                        scrolled || !isHomePage
                                            ? 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                                            : 'text-white/70 hover:text-white hover:bg-white/10'
                                    }`}
                                    title="Sign Out"
                                >
                                    <LogOut size={18} />
                                </button>
                            </>
                        ) : (
                            <Link
                                to="/school-admin-login"
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${
                                    scrolled || !isHomePage
                                        ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-md'
                                        : 'bg-white text-slate-900 hover:bg-blue-50 shadow-md'
                                }`}
                            >
                                <User size={15} /> Sign In
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            {/* Mobile Bottom Navigation Bar */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 flex items-center justify-around h-16 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
                {[
                    { to: '/', label: 'Home', Icon: Home },
                    { to: '/schools', label: 'Schools', Icon: School },
                    { to: '/categories', label: 'Sections', Icon: Layers },
                    { to: currentUser ? getDashboardLink() : '/school-admin-login', label: currentUser ? 'Account' : 'Login', Icon: User },
                ].map(({ to, label, Icon }) => {
                    const active = location.pathname === to;
                    return (
                        <Link key={to} to={to} className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${active ? 'text-blue-600' : 'text-slate-400'}`}>
                            <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                            <span className="text-[10px] font-bold tracking-wider">{label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Main content */}
            <main className="flex-grow">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                    >
                        <Outlet />
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Footer */}
            <footer className="bg-slate-950 text-slate-400 py-20 border-t border-slate-900">
                <div className="container mx-auto px-6">
                    <div className="grid md:grid-cols-4 gap-16 mb-16">
                        <div className="col-span-2">
                            <h3 className="text-white font-black text-2xl mb-4 tracking-tighter">News Journal SL</h3>
                            <p className="text-slate-500 max-w-sm leading-relaxed font-medium">Sierra Leone's premier destination for school news, empowering students to lead the conversation.</p>
                        </div>
                        <div>
                            <h4 className="text-white font-black text-xs uppercase tracking-[0.2em] mb-6">Navigation</h4>
                            <ul className="space-y-3 text-sm font-medium">
                                {navLinks.map(({ to, label }) => (
                                    <li key={to}><Link to={to} className="hover:text-blue-400 transition-colors">{label}</Link></li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-black text-xs uppercase tracking-[0.2em] mb-6">Portals</h4>
                            <ul className="space-y-3 text-sm font-medium">
                                <li><Link to="/admin-login" className="hover:text-blue-400 transition-colors">Super Admin</Link></li>
                                <li><Link to="/school-admin-login" className="hover:text-blue-400 transition-colors">School Admin</Link></li>
                                <li><Link to="/register-school" className="hover:text-blue-400 transition-colors">Register School</Link></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-slate-900 pt-10 flex flex-col md:flex-row justify-between items-center gap-6 text-xs font-bold uppercase tracking-widest text-slate-600">
                        <span>© {new Date().getFullYear()} News Journal SL. All rights reserved.</span>
                        <div className="flex gap-8">
                            <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
                            <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
