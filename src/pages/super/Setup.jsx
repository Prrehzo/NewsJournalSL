import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase';
import { collection, query, where, getDocs, setDoc, doc, serverTimestamp, addDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { Shield, Lock, Mail, User, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SuperAdminSetup() {
    const [adminExists, setAdminExists] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        reason: ''
    });

    useEffect(() => {
        const checkAdmin = async () => {
            try {
                const q = query(collection(db, 'users'), where('role', '==', 'super_admin'));
                const snap = await getDocs(q);
                setAdminExists(!snap.empty);
            } catch (err) {
                console.error("Error checking admin existence:", err);
            } finally {
                setLoading(false);
            }
        };
        checkAdmin();
    }, []);

    const handleCreateAdmin = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            return setStatus({ type: 'error', message: 'Passwords do not match' });
        }
        setActionLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            await setDoc(doc(db, 'users', user.uid), {
                email: formData.email,
                name: formData.name || 'Initial Admin',
                role: 'super_admin',
                createdAt: serverTimestamp()
            });

            await signOut(auth);
            setStatus({ type: 'success', message: 'First Super Admin created successfully! You can now log in at /admin-login.' });
            setAdminExists(true);
        } catch (err) {
            console.error("Setup Error:", err);
            if (err.code === 'auth/email-already-in-use') {
                setStatus({
                    type: 'error',
                    message: 'This email is already in use by another account (likely a pending school registration). Please use a unique, dedicated email for the Super Admin account.'
                });
            } else {
                setStatus({ type: 'error', message: err.message });
            }
        } finally {
            setActionLoading(false);
        }
    };

    const handleRequestAccess = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            await addDoc(collection(db, 'admin_requests'), {
                name: formData.name,
                email: formData.email,
                reason: formData.reason,
                status: 'pending',
                createdAt: serverTimestamp()
            });
            setStatus({ type: 'success', message: 'Request sent! An existing administrator will review your application.' });
        } catch (err) {
            setStatus({ type: 'error', message: err.message });
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-900" size={48} /></div>;

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
                <div className="bg-slate-900 p-8 text-center">
                    <div className="inline-flex p-4 bg-white/10 rounded-2xl mb-4 backdrop-blur-sm">
                        <Shield className="text-white" size={32} />
                    </div>
                    <h1 className="text-2xl font-black text-white uppercase tracking-tighter">Super Admin Control</h1>
                    <p className="text-slate-400 text-sm mt-2">{adminExists ? "Request access to the platform" : "Initialize the first administrator"}</p>
                </div>

                <div className="p-8">
                    {status.message && (
                        <div className={`p-4 rounded-xl mb-6 flex gap-3 items-start ${status.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                            {status.type === 'error' ? <AlertCircle className="shrink-0" size={18} /> : <CheckCircle2 className="shrink-0" size={18} />}
                            <p className="text-sm font-medium">{status.message}</p>
                        </div>
                    )}

                    {!adminExists ? (
                        <form onSubmit={handleCreateAdmin} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-black uppercase text-slate-500 ml-1">Admin Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition" placeholder="admin@newsjournal.sl" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-black uppercase text-slate-500 ml-1">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input type="password" required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition" placeholder="••••••••" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-black uppercase text-slate-500 ml-1">Confirm Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input type="password" required value={formData.confirmPassword} onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition" placeholder="••••••••" />
                                </div>
                            </div>
                            <button disabled={actionLoading} type="submit" className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest hover:bg-slate-800 transition shadow-xl mt-4 flex justify-center">
                                {actionLoading ? <Loader2 className="animate-spin" /> : "Install Super Admin"}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleRequestAccess} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-black uppercase text-slate-500 ml-1">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition" placeholder="John Doe" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-black uppercase text-slate-500 ml-1">Work Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition" placeholder="john@example.com" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-black uppercase text-slate-500 ml-1">Reason for access</label>
                                <textarea required value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl h-32 focus:ring-2 focus:ring-slate-900 outline-none transition resize-none" placeholder="Explain why you need super admin privileges..." />
                            </div>
                            <button disabled={actionLoading} type="submit" className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest hover:bg-slate-800 transition shadow-xl mt-4 flex justify-center items-center gap-2">
                                {actionLoading ? <Loader2 className="animate-spin" /> : <><Send size={18} /> Send Request</>}
                            </button>
                        </form>
                    )}

                    <div className="mt-8 pt-6 border-t border-slate-50 text-center">
                        <Link to="/" className="text-xs font-bold text-slate-400 hover:text-slate-900 transition underline underline-offset-4">Back to Homepage</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
