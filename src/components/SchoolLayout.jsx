import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, PenTool, FileText, Settings, LogOut, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

export default function SchoolLayout() {
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
        <div className="flex h-screen bg-gray-50">
            <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-blue-900">School Admin</h1>
                        <p className="text-xs text-slate-400">Manage your school</p>
                    </div>
                </div>

                <nav className="flex-grow p-4 space-y-2">
                    <Link to="/school-admin" className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${isActive('/school-admin') ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-gray-50'}`}>
                        <LayoutDashboard size={20} /> Dashboard
                    </Link>
                    <Link to="/school-admin/create" className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${isActive('/school-admin/create') ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-gray-50'}`}>
                        <PenTool size={20} /> Create Article
                    </Link>
                    <Link to="/school-admin/articles" className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${isActive('/school-admin/articles') ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-gray-50'}`}>
                        <FileText size={20} /> Manage Articles
                    </Link>
                    {currentUser?.role === 'school_admin' && (
                        <>
                            <Link to="/school-admin/reporters" className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${isActive('/school-admin/reporters') ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-gray-50'}`}>
                                <Users size={20} /> Manage Reporters
                            </Link>
                            <Link to="/school-admin/settings" className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${isActive('/school-admin/settings') ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-gray-50'}`}>
                                <Settings size={20} /> School Settings
                            </Link>
                        </>
                    )}
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                        <LogOut size={20} /> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-grow flex flex-col h-screen overflow-hidden">
                <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 md:px-8 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <h2 className="font-bold text-slate-800">Overview</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <NotificationBell />
                        <span className="text-sm font-medium text-slate-600 hidden md:block">{currentUser?.schoolName || 'School Panel'}</span>
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm border-2 border-white shadow-sm overflow-hidden">
                            {currentUser?.photoURL ? (
                                <img src={currentUser.photoURL} alt="Logo" className="w-full h-full object-contain bg-white" />
                            ) : (
                                (currentUser?.schoolName || 'S').charAt(0)
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
                <Link to="/school-admin" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/school-admin') ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
                    <LayoutDashboard size={22} className={isActive('/school-admin') ? 'stroke-[2.5]' : 'stroke-2'} />
                    <span className="text-[10px] font-bold tracking-wider">Home</span>
                </Link>
                <Link to="/school-admin/create" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/school-admin/create') ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
                    <PenTool size={22} className={isActive('/school-admin/create') ? 'stroke-[2.5]' : 'stroke-2'} />
                    <span className="text-[10px] font-bold tracking-wider">Create</span>
                </Link>
                <Link to="/school-admin/articles" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/school-admin/articles') ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
                    <FileText size={22} className={isActive('/school-admin/articles') ? 'stroke-[2.5]' : 'stroke-2'} />
                    <span className="text-[10px] font-bold tracking-wider">Articles</span>
                </Link>
                {currentUser?.role === 'school_admin' && (
                    <Link to="/school-admin/reporters" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/school-admin/reporters') ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
                        <Users size={22} className={isActive('/school-admin/reporters') ? 'stroke-[2.5]' : 'stroke-2'} />
                        <span className="text-[10px] font-bold tracking-wider">Reporters</span>
                    </Link>
                )}
                <Link to="/school-admin/settings" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/school-admin/settings') ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
                    <Settings size={22} className={isActive('/school-admin/settings') ? 'stroke-[2.5]' : 'stroke-2'} />
                    <span className="text-[10px] font-bold tracking-wider">Settings</span>
                </Link>
            </nav>
        </div>
    );
}
