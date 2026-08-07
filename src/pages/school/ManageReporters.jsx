import React, { useState, useEffect } from 'react';
import { UserPlus, Trash2, Mail, User, Loader2, AlertCircle, Sparkles, Shield, Tag, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getReporters } from '../../services/articleService';
import { motion } from 'framer-motion';
import { db } from '../../firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { createNotification } from '../../services/notificationService';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export default function ManageReporters() {
    const { currentUser } = useAuth();
    const [reporters, setReporters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [newReporter, setNewReporter] = useState({ name: '', email: '', password: '', position: '' });
    const [error, setError] = useState(null);
    const [reportersEnabled, setReportersEnabled] = useState(true);
    const [reporterLimit, setReporterLimit] = useState(5);

    const fetchReportersList = async () => {
        if (!currentUser?.schoolId) {
            console.warn("ManageReporters: No schoolId found");
            setLoading(false);
            return;
        }
        try {
            // First check if reporters are enabled for this school
            const schoolSnap = await getDoc(doc(db, 'schools', currentUser.schoolId));
            if (schoolSnap.exists()) {
                const schoolData = schoolSnap.data();
                setReportersEnabled(schoolData.reportersEnabled !== false);
                setReporterLimit(schoolData.reporterLimit || 5);
            }

            const data = await getReporters(currentUser.schoolId);
            setReporters(data);
        } catch (err) {
            console.error("Error fetching reporters:", err);
            setError("Failed to load reporters.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReportersList();
    }, [currentUser]);

    const handleAddReporter = async (e) => {
        e.preventDefault();
        if (!reportersEnabled) {
            alert("Reporter management is currently disabled for your school by the Super Admin.");
            return;
        }
        if (reporters.length >= reporterLimit) {
            alert(`Maximum limit of ${reporterLimit} reporters reached as set by the Super Admin.`);
            return;
        }

        setAdding(true);
        setError(null);
        
        let secondaryApp;
        try {
            // Initialize a secondary Firebase instance to avoid logging out the current admin
            const secondaryAppName = `SecondaryApp_${Date.now()}`;
            secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
            const secondaryAuth = getAuth(secondaryApp);

            // 1. Create the user in Auth
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newReporter.email, newReporter.password);
            const uid = userCredential.user.uid;

            // 2. Prepare reporter data
            const positionsArray = newReporter.position.split(',').map(p => p.trim()).filter(Boolean);
            const reporterData = {
                uid: uid,
                email: newReporter.email.toLowerCase(),
                name: newReporter.name,
                displayName: newReporter.name,
                role: 'reporter',
                status: 'active',
                schoolId: currentUser.schoolId,
                schoolName: currentUser.schoolName,
                positions: positionsArray,
                createdAt: new Date(),
                addedBy: currentUser.uid
            };

            // 3. Create user doc in Firestore (using main db instance)
            await setDoc(doc(db, 'users', uid), reporterData);

            // 4. Add to school's members list
            await updateDoc(doc(db, 'schools', currentUser.schoolId), {
                members: arrayUnion({
                    uid: uid,
                    email: reporterData.email,
                    role: 'reporter',
                    name: reporterData.name,
                    positions: positionsArray,
                    schoolId: currentUser.schoolId
                })
            });

            // 5. Cleanup secondary app
            await signOut(secondaryAuth);
            await deleteApp(secondaryApp);

            setNewReporter({ name: '', email: '', password: '', position: '' });
            fetchReportersList();

            // Notify the new reporter
            try {
                await createNotification(uid, {
                    type: 'reporter_invited',
                    title: 'Welcome to the News Team!',
                    message: `You have been added as a reporter at ${currentUser.schoolName}. Start writing articles now!`,
                    link: '/school-admin'
                });
            } catch (notifErr) {
                console.error('Failed to send notification:', notifErr);
            }

            alert(`Reporter ${reporterData.name} has been successfully registered.`);
        } catch (err) {
            console.error("Add reporter failed:", err);
            setError(err.message || "Failed to add reporter. Please try again.");
            if (secondaryApp) await deleteApp(secondaryApp);
        } finally {
            setAdding(false);
        }
    };

    const handleDelete = async (reporter) => {
        if (window.confirm(`Are you sure you want to remove ${reporter.name}? This will NOT delete their Auth account, but they will lose access to the portal.`)) {
            try {
                // 1. Remove from Firestore users
                await deleteDoc(doc(db, 'users', reporter.id));

                // 2. Remove from school members array
                const schoolSnap = await getDoc(doc(db, 'schools', currentUser.schoolId));
                if (schoolSnap.exists()) {
                    const members = schoolSnap.data().members || [];
                    const updatedMembers = members.filter(m => m.uid !== reporter.uid);
                    await updateDoc(doc(db, 'schools', currentUser.schoolId), { members: updatedMembers });
                }

                setReporters(reporters.filter(r => r.id !== reporter.id));
            } catch (err) {
                console.error("Delete failed:", err);
                alert("Failed to remove reporter: " + err.message);
            }
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Manage News Team</h2>
                    <p className="text-slate-500 text-sm">Register reporters who can contribute stories and managing their own profiles.</p>
                    {!reportersEnabled && (
                        <div className="mt-2 text-red-600 flex items-center gap-2 font-bold text-xs bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
                            <Shield size={14} /> Reporter features are currently disabled by the Super Admin.
                        </div>
                    )}
                </div>
                <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
                    <span className="text-blue-700 font-bold">{reporters.length} / {reporterLimit}</span>
                    <span className="text-blue-600 text-sm ml-2">Reporters Active</span>
                </div>
            </div>

            <div className="grid md:grid-cols-[1fr_350px] gap-8">
                <div className="space-y-4">
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        {loading ? (
                            <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
                        ) : reporters.length > 0 ? (
                            <div className="divide-y divide-gray-50">
                                {reporters.map(reporter => (
                                    <div key={reporter.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold border border-slate-200 shadow-inner">
                                                {reporter.name.charAt(0)}
                                            </div>
                                            <td className="p-6">
                                                <div className="font-bold text-slate-900 text-lg flex items-center gap-2">
                                                    {reporter.name}
                                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-widest rounded-full">Approved</span>
                                                </div>
                                                <div className="text-sm text-slate-500 flex items-center gap-1.5 mb-1"><Mail size={14} /> {reporter.email}</div>
                                                {reporter.positions && reporter.positions.length > 0 && (
                                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                                        {reporter.positions.map((pos, idx) => (
                                                            <span key={idx} className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-black uppercase tracking-wider rounded-md border border-slate-200">
                                                                <Tag size={10} /> {pos}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(reporter)}
                                            className="p-3 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                                            title="Remove Reporter"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="p-20 text-center"
                            >
                                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-slate-100">
                                    <User size={40} className="text-slate-300" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">No reporters yet</h3>
                                <p className="text-slate-500 max-w-xs mx-auto mb-8">Start building your school's news team by adding your first student reporter.</p>
                                <div className="inline-flex items-center gap-2 text-blue-600 font-bold text-sm bg-blue-50 px-4 py-2 rounded-full">
                                    <Sparkles size={16} /> Ready to grow your team?
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <form onSubmit={handleAddReporter} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xl shadow-gray-200/50 sticky top-24">
                        <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <UserPlus size={20} className="text-blue-600" />
                            Register New Reporter
                        </h3>

                        {error && (
                            <div className="mb-6 p-3 bg-red-50 text-red-600 text-xs rounded-lg flex items-center gap-2 border border-red-100">
                                <AlertCircle size={14} /> {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition font-medium"
                                    placeholder="Enter reporter's name"
                                    value={newReporter.name}
                                    onChange={(e) => setNewReporter({ ...newReporter, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition font-medium"
                                    placeholder="Enter reporter's email"
                                    value={newReporter.email}
                                    onChange={(e) => setNewReporter({ ...newReporter, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="password"
                                        required
                                        className="w-full p-3.5 pl-12 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition font-medium"
                                        placeholder="Set initial password"
                                        value={newReporter.password}
                                        onChange={(e) => setNewReporter({ ...newReporter, password: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Positions (comma-separated)</label>
                                <div className="relative">
                                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        required
                                        className="w-full p-3.5 pl-12 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition font-medium"
                                        placeholder="e.g. Senior Reporter, Sports Captain"
                                        value={newReporter.position}
                                        onChange={(e) => setNewReporter({ ...newReporter, position: e.target.value })}
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1.5 ml-1 italic">TIP: Reporters may hold multiple positions.</p>
                            </div>
                            <button
                                type="submit"
                                disabled={adding || !reportersEnabled || reporters.length >= reporterLimit}
                                className="w-full bg-blue-900 text-white py-4 rounded-xl font-bold hover:bg-blue-800 transition shadow-lg shadow-blue-900/20 disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
                            >
                                {adding ? <Loader2 className="animate-spin" size={20} /> : <UserPlus size={20} />}
                                Register Reporter
                            </button>
                            <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 mt-6">
                                <p className="text-[10px] text-orange-800 leading-relaxed">
                                    <strong className="block mb-1 underline">Security Note:</strong>
                                    You are creating a full user account. Share the <strong>Email</strong> and <strong>Password</strong> with the reporter so they can sign in directly.
                                </p>
                            </div>
                            {!reportersEnabled && (
                                <p className="text-[10px] text-center text-red-600 font-bold uppercase tracking-tighter mt-4">Feature disabled for this school</p>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
