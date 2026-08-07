import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Settings, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

export default function SuperLayout() {
    const { logout, currentUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const isActive = (path) => location.pathname === path;

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    return (
        <div className="flex h-screen bg-slate-50">
            <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Shield className="text-blue-500" size={24} />
                        <div>
                            <h1 className="text-xl font-bold">News Journal</h1>
                            <p className="text-xs text-slate-400">Super Admin</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-grow p-4 space-y-2">
                    <Link to="/super-admin" className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${isActive('/super-admin') ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                        <LayoutDashboard size={20} /> Overview
                    </Link>
                    <Link to="/super-admin/schools" className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${isActive('/super-admin/schools') ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                        <Users size={20} /> Manage Schools
                    </Link>
                    <Link to="/super-admin/articles" className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${isActive('/super-admin/articles') ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                        <FileText size={20} /> All Articles
                    </Link>
                    <Link to="/super-admin/admins" className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${isActive('/super-admin/admins') ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                        <Shield size={20} /> Manage Admins
                    </Link>
                    <Link to="/super-admin/settings" className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${isActive('/super-admin/settings') ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                        <Settings size={20} /> Settings
                    </Link>
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-red-400 hover:bg-slate-800 rounded-lg transition"
                    >
                        <LogOut size={20} /> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-grow flex flex-col h-screen overflow-hidden">
                <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 md:px-8 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <h2 className="font-bold text-slate-800">Admin Portal</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <NotificationBell />
                        <span className="text-sm font-medium text-slate-600 hidden md:block">{currentUser?.displayName || 'Super Administrator'}</span>
                        <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden border border-slate-700 shadow-inner">
                            {currentUser?.photoURL ? (
                                <img src={currentUser.photoURL} alt="Admin" className="w-full h-full object-cover" />
                            ) : (
                                <span>{currentUser?.displayName?.charAt(0) || 'SA'}</span>
                            )}
                        </div>
                        <button
                            onClick={handleLogout}
                            className="md:hidden p-2 text-slate-400 hover:text-red-600 transition"
                            title="Sign Out"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </header>
                <div className="flex-grow overflow-auto p-4 md:p-8 pb-24 md:pb-8">
                    <Outlet />
                </div>
            </main>

            {/* Mobile Bottom Navigation Bar */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 flex items-center justify-around h-16 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] pb-safe">
                <Link to="/super-admin" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/super-admin') ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
                    <LayoutDashboard size={22} className={isActive('/super-admin') ? 'stroke-[2.5]' : 'stroke-2'} />
                    <span className="text-[10px] font-bold tracking-wider">Overview</span>
                </Link>
                <Link to="/super-admin/schools" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/super-admin/schools') ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
                    <Users size={22} className={isActive('/super-admin/schools') ? 'stroke-[2.5]' : 'stroke-2'} />
                    <span className="text-[10px] font-bold tracking-wider">Schools</span>
                </Link>
                <Link to="/super-admin/articles" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/super-admin/articles') ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
                    <FileText size={22} className={isActive('/super-admin/articles') ? 'stroke-[2.5]' : 'stroke-2'} />
                    <span className="text-[10px] font-bold tracking-wider">Articles</span>
                </Link>
                <Link to="/super-admin/admins" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/super-admin/admins') ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
                    <Shield size={22} className={isActive('/super-admin/admins') ? 'stroke-[2.5]' : 'stroke-2'} />
                    <span className="text-[10px] font-bold tracking-wider">Admins</span>
                </Link>
                <Link to="/super-admin/settings" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/super-admin/settings') ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
                    <Settings size={22} className={isActive('/super-admin/settings') ? 'stroke-[2.5]' : 'stroke-2'} />
                    <span className="text-[10px] font-bold tracking-wider">Settings</span>
                </Link>
            </nav>
        </div>
    );
}
