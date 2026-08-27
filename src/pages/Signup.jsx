import React, { useState } from 'react';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, updateDoc, deleteDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Loader2, ArrowLeft } from 'lucide-react';

export default function Signup() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            return setError("Passwords do not match");
        }

        setLoading(true);
        setError('');

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;
            
            const actionCodeSettings = {
                url: 'https://newsjournalsl.web.app',
                handleCodeInApp: true,
            };
            await sendEmailVerification(user, actionCodeSettings);

            // Check if this user is an authorized school admin or reporter
            let userRole = 'public';
            let schoolData = {};

            // 1. Check if email matches an active school
            const schoolsRef = collection(db, 'schools');
            const schoolQuery = query(schoolsRef, where('email', '==', formData.email), where('status', '==', 'active'));
            const schoolSnap = await getDocs(schoolQuery);

            if (!schoolSnap.empty) {
                userRole = 'school_admin';
                schoolData = {
                    schoolId: schoolSnap.docs[0].id,
                    schoolName: schoolSnap.docs[0].data().name
                };
            } else {
                // 2. Check if email matches a pending reporter stub
                const usersRef = collection(db, 'users');
                const reporterQuery = query(
                    usersRef, 
                    where('email', '==', formData.email), 
                    where('role', '==', 'reporter'),
                    where('status', '==', 'invited')
                );
                const reporterSnap = await getDocs(reporterQuery);

                if (!reporterSnap.empty) {
                    const reporterDoc = reporterSnap.docs[0];
                    const reporterData = reporterDoc.data();

                    // IMPORTANT: We create a NEW document in the users collection 
                    // where the Document ID is the Firebase Auth UID.
                    await setDoc(doc(db, "users", user.uid), {
                        uid: user.uid,
                        name: formData.name,
                        email: formData.email,
                        role: 'reporter',
                        schoolId: reporterData.schoolId,
                        schoolName: reporterData.schoolName,
                        status: 'active',
                        createdAt: serverTimestamp()
                    });

                    // Mark the original invitation stub as activated for record-keeping
                    await updateDoc(doc(db, "users", reporterDoc.id), {
                        status: 'activated',
                        activatedAt: serverTimestamp(),
                        activatedUid: user.uid
                    });

                    navigate('/school-admin');
                    return;
                } else {
                    // 3. Check if email matches a pending super admin stub
                    const adminQuery = query(usersRef, where('email', '==', formData.email), where('role', '==', 'super_admin'), where('uid', '==', null));
                    const adminSnap = await getDocs(adminQuery);

                    if (!adminSnap.empty) {
                        const adminDoc = adminSnap.docs[0];
                        
                        // Fix for Super Admins as well: Use UID as document ID
                        await setDoc(doc(db, "users", user.uid), {
                            uid: user.uid,
                            name: formData.name,
                            email: formData.email,
                            role: 'super_admin',
                            status: 'active',
                            createdAt: serverTimestamp()
                        });

                        await updateDoc(doc(db, "users", adminDoc.id), {
                            uid: user.uid,
                            status: 'activated',
                            activatedAt: serverTimestamp()
                        });

                        navigate('/super-admin');
                        return;
                    }
                }
            }

            // Create user document in Firestore
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                name: formData.name,
                email: formData.email,
                role: userRole,
                ...schoolData,
                createdAt: serverTimestamp()
            });

            if (userRole === 'school_admin' || userRole === 'reporter') {
                navigate('/school-admin');
            } else {
                navigate('/');
            }
        } catch (err) {
            console.error("Signup error:", err);
            setError(err.message || "Failed to create account");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-gray-50 px-4 py-12">
            <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
                <Link to="/login" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 transition text-sm">
                    <ArrowLeft size={16} /> Back to Login
                </Link>

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">Create Account</h1>
                    <p className="text-slate-500 mt-2">Join News Journal SL today</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm border border-red-100 flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSignup} className="space-y-5">
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700 ml-1">
                            <User size={16} /> Full Name
                        </label>
                        <input
                            type="text"
                            required
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="John Doe"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700 ml-1">
                            <Mail size={16} /> Email Address
                        </label>
                        <input
                            type="email"
                            required
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="you@example.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700 ml-1">
                            <Lock size={16} /> Password
                        </label>
                        <input
                            type="password"
                            required
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700 ml-1">
                            <Lock size={16} /> Confirm Password
                        </label>
                        <input
                            type="password"
                            required
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 text-white bg-blue-900 rounded-xl hover:bg-blue-800 transition font-bold shadow-lg disabled:opacity-70 flex justify-center items-center gap-2 mt-4"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : 'Create Account'}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-gray-100 text-center space-y-4">
                    <p className="text-slate-600 text-sm">
                        Already have an account? <Link to="/login" className="text-blue-900 font-bold hover:underline">Sign In</Link>
                    </p>
                    <div className="pt-4 border-t border-gray-50">
                        <p className="text-xs text-slate-500 mb-3 uppercase tracking-widest font-black">Want to partner with us?</p>
                        <Link to="/register-school" className="inline-block w-full py-3 border-2 border-blue-900 text-blue-900 font-bold rounded-xl hover:bg-blue-50 transition text-sm">
                            Register Your School
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
