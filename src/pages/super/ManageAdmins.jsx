import React, { useState, useEffect } from 'react';
import { UserPlus, Trash2, Mail, User, Loader2, AlertCircle, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getAdmins, addAdmin, deleteAdmin } from '../../services/articleService';
import { motion } from 'framer-motion';

export default function ManageAdmins() {
    const { currentUser } = useAuth();
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [newAdmin, setNewAdmin] = useState({ name: '', email: '' });
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const fetchAdminsList = async () => {
        try {
            const data = await getAdmins();
            setAdmins(data);
        } catch (err) {
            console.error("Error fetching admins:", err);
            setError("Failed to load administrators.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdminsList();
    }, []);

    const handleAddAdmin = async (e) => {
        e.preventDefault();
        setAdding(true);
        setError(null);
        setSuccess(null);
        try {
            // Pre-approve the admin
            await addAdmin({
                ...newAdmin,
                uid: null, // Will be filled when they sign up
                invitedBy: currentUser.uid,
                invitedByName: currentUser.displayName || currentUser.name
            });
            setSuccess(`Admin invitation for ${newAdmin.name} created! They can now sign up with ${newAdmin.email}.`);
            setNewAdmin({ name: '', email: '' });
            fetchAdminsList();
        } catch (err) {
            console.error("Add admin failed:", err);
            setError("Failed to invite administrator. Please try again.");
        } finally {
            setAdding(false);
        }
    };

    const handleDelete = async (id, email) => {
        if (email === currentUser.email) {
            alert("You cannot remove your own administrator privileges.");
            return;
        }
        if (window.confirm(`Are you sure you want to remove ${email} as a Super Admin?`)) {
            try {
                await deleteAdmin(id);
                setAdmins(admins.filter(a => a.id !== id));
            } catch (err) {
                console.error("Delete failed:", err);
                alert("Failed to remove administrator.");
            }
        }
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Manage Administrators</h2>
                    <p className="text-slate-500 mt-1 font-medium text-lg">Grant and revoke Super Admin access to the platform.</p>
                </div>
                <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl flex items-center gap-3 shadow-xl">
                    <ShieldCheck className="text-blue-400" size={24} />
                    <span className="font-bold">{admins.length} Total Admins</span>
                </div>
            </div>

            <div className="grid lg:grid-cols-[1fr_400px] gap-10 items-start">
                {/* Admins List */}
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
                    {loading ? (
                        <div className="p-32 flex flex-col items-center justify-center gap-6">
                            <Loader2 className="animate-spin text-blue-600" size={48} />
                            <p className="font-bold text-slate-400 uppercase tracking-widest text-sm">Loading security records...</p>
                        </div>
                    ) : admins.length > 0 ? (
                        <div className="divide-y divide-slate-50">
                            {admins.map(admin => (
                                <div key={admin.id} className="p-8 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                                    <div className="flex items-center gap-6">
                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg border-4 border-white ${admin.uid ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 opacity-60'}`}>
                                            {admin.name?.charAt(0) || <User size={24} />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className="text-xl font-bold text-slate-900">{admin.name || 'Invited Administrator'}</span>
                                                {admin.email === currentUser.email && (
                                                    <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-widest rounded-full">You</span>
                                                )}
                                                {!admin.uid && (
                                                    <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest rounded-full animate-pulse">Pending Setup</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                                                <span className="flex items-center gap-1.5"><Mail size={14} className="text-slate-400" /> {admin.email}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                <span className="italic uppercase text-[10px] font-black tracking-tighter">Super Admin Role</span>
                                            </div>
                                        </div>
                                    </div>
                                    {admin.email !== currentUser.email && (
                                        <button
                                            onClick={() => handleDelete(admin.id, admin.email)}
                                            className="p-4 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all group-hover:shadow-md"
                                            title="Revoke Admin Access"
                                        >
                                            <Trash2 size={24} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-32 text-center">
                            <ShieldAlert size={64} className="text-slate-200 mx-auto mb-6" />
                            <p className="text-slate-400 font-bold">No other administrators found.</p>
                        </div>
                    )}
                </div>

                {/* Add Admin Form */}
                <div className="space-y-8">
                    <form onSubmit={handleAddAdmin} className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-2xl shadow-blue-900/5 sticky top-8">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
                                <UserPlus size={24} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900">Invite New Admin</h3>
                        </div>

                        {error && (
                            <div className="mb-8 p-4 bg-red-50 text-red-600 text-xs rounded-2xl flex items-center gap-3 border border-red-100 shadow-sm animate-shake">
                                <AlertCircle className="shrink-0" size={16} />
                                <span className="font-bold">{error}</span>
                            </div>
                        )}

                        {success && (
                            <div className="mb-8 p-4 bg-green-50 text-green-700 text-xs rounded-2xl flex items-center gap-3 border border-green-100 shadow-sm">
                                <ShieldCheck className="shrink-0" size={16} />
                                <span className="font-bold">{success}</span>
                            </div>
                        )}

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Full Display Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none transition font-bold placeholder:text-slate-300"
                                    placeholder="Enter administrator name"
                                    value={newAdmin.name}
                                    onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Secure Email Address</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none transition font-bold placeholder:text-slate-300"
                                    placeholder="admin@school.edu.sl"
                                    value={newAdmin.email}
                                    onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={adding}
                                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition shadow-2xl shadow-slate-900/30 disabled:opacity-50 flex items-center justify-center gap-3 group"
                            >
                                {adding ? <Loader2 className="animate-spin" size={24} /> : <ShieldCheck size={24} className="group-hover:scale-110 transition-transform" />}
                                Grant Permissions
                            </button>
                        </div>

                        <div className="mt-10 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[11px] text-slate-500 leading-relaxed text-center font-medium">
                                <strong className="block text-slate-800 mb-2 font-black uppercase tracking-widest text-[9px]">Administrative Protocol</strong>
                                When you add an admin, their email is pre-authorized. 
                                They should then visit the <strong className="text-blue-600">Sign Up</strong> page to set their password and activate their portal.
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
