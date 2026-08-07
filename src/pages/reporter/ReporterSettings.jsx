import React, { useState, useEffect } from 'react';
import { User, Tag, Mail, Save, Loader2, Sparkles, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { verifyBeforeUpdateEmail } from 'firebase/auth';
import { motion } from 'framer-motion';
import LogoSelector from '../../components/LogoSelector';

export default function ReporterSettings() {
    const { currentUser, fetchUserData } = useAuth();
    const [formData, setFormData] = useState({
        displayName: '',
        positions: '',
        email: '',
        photoURL: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadProfile = async () => {
            if (!currentUser?.uid) return;
            try {
                const docSnap = await getDoc(doc(db, 'users', currentUser.uid));
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setFormData({
                        displayName: data.displayName || data.name || '',
                        positions: (data.positions || []).join(', '),
                        email: data.email || '',
                        photoURL: data.photoURL || ''
                    });
                }
            } catch (err) {
                console.error("Profile load failed:", err);
                setError("Failed to load your profile settings.");
            } finally {
                setLoading(false);
            }
        };
        loadProfile();
    }, [currentUser]);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            const positionsArray = formData.positions.split(',').map(p => p.trim()).filter(Boolean);
            const updateData = {
                displayName: formData.displayName,
                positions: positionsArray,
                photoURL: formData.photoURL
            };

            await updateDoc(doc(db, 'users', currentUser.uid), updateData);
            
            // Also update the school's members list for consistency
            if (currentUser.schoolId) {
                const schoolSnap = await getDoc(doc(db, 'schools', currentUser.schoolId));
                if (schoolSnap.exists()) {
                    const members = schoolSnap.data().members || [];
                    const updatedMembers = members.map(m => 
                        m.uid === currentUser.uid 
                        ? { ...m, name: formData.displayName, positions: positionsArray, photoURL: formData.photoURL } 
                        : m
                    );
                    await updateDoc(doc(db, 'schools', currentUser.schoolId), { members: updatedMembers });
                }
            }

            await fetchUserData(currentUser.uid);

            if (formData.email && formData.email !== currentUser.email) {
                try {
                    await verifyBeforeUpdateEmail(currentUser, formData.email);
                    alert("Profile updated! A verification link has been sent to your new email address. Please verify it to complete the login email change.");
                } catch (emailErr) {
                    console.error("Email update error:", emailErr);
                    alert("Profile updated, but we failed to send the email change verification. You might need to log out and log back in to try again.");
                }
            } else {
                alert("Profile updated successfully!");
            }
        } catch (err) {
            console.error("Save failed:", err);
            setError("Failed to save changes. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

    return (
        <div className="max-w-3xl mx-auto">
            <header className="mb-10 text-center">
                <div className="w-24 h-24 bg-blue-900 border-4 border-white shadow-xl rounded-full flex items-center justify-center mx-auto mb-6">
                    <User size={40} className="text-white" />
                </div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Profile Settings</h1>
                <p className="text-slate-500 font-medium">Manage how you appear on articles and throughout the platform.</p>
            </header>

            {error && (
                <div className="mb-8 p-4 bg-red-50 text-red-600 text-sm rounded-2xl flex items-center gap-3 border border-red-100 font-bold">
                    <Info size={18} /> {error}
                </div>
            )}

            <form onSubmit={handleSave} className="space-y-8">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 space-y-8"
                >
                    <div className="flex flex-col items-center pb-6 border-b border-gray-100">
                        <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-3">Profile Photo</label>
                        <LogoSelector 
                            selectedLogo={formData.photoURL}
                            onSelect={(url) => setFormData({ ...formData, photoURL: url })}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-3 ml-1">Account Email</label>
                        <div className="relative group">
                            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition" size={20} />
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full p-5 pl-14 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-600 outline-none transition font-bold text-slate-900 shadow-sm"
                                placeholder="your.email@example.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-3 ml-1">Display Name</label>
                        <div className="relative group">
                            <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition" size={20} />
                            <input
                                type="text"
                                required
                                value={formData.displayName}
                                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                className="w-full p-5 pl-14 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-600 outline-none transition font-bold text-slate-900 shadow-sm"
                                placeholder="Your public name"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-3 ml-1">Positions (comma-separated)</label>
                        <div className="relative group">
                            <Tag className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition" size={20} />
                            <input
                                type="text"
                                required
                                value={formData.positions}
                                onChange={(e) => setFormData({ ...formData, positions: e.target.value })}
                                className="w-full p-5 pl-14 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-600 outline-none transition font-bold text-slate-900 shadow-sm"
                                placeholder="e.g. Senior Reporter, Sports Captain"
                            />
                        </div>
                        <div className="flex items-start gap-2 mt-4 ml-1 p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                            <Sparkles size={14} className="text-blue-600 flex-shrink-0 mt-0.5" />
                            <p className="text-[11px] text-blue-900/70 font-medium leading-relaxed italic">
                                <strong>Show your impact:</strong> These positions appear next to your name on every article you publish. Use commas to list multiple roles.
                            </p>
                        </div>
                    </div>
                </motion.div>

                <div className="flex flex-col gap-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full bg-blue-900 text-white py-6 rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-blue-800 transition shadow-2xl shadow-blue-900/30 disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                        {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        Save Profile Updates
                    </button>
                    <p className="text-center text-[10px] text-slate-400 font-black uppercase tracking-widest">Changes take effect immediately across all your articles</p>
                </div>
            </form>
        </div>
    );
}
