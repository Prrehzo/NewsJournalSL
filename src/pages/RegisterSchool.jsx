import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, setDoc, doc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signOut, sendEmailVerification } from 'firebase/auth';
import { School, Mail, Phone, MapPin, Info, ArrowLeft, CheckCircle2, Loader2, Lock } from 'lucide-react';
import LogoSelector from '../components/LogoSelector';
import { createNotificationForMany, getSuperAdminIds } from '../services/notificationService';

export default function RegisterSchool() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        location: '',
        description: '',
        logoUrl: ''
    });
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // 1. Create User in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;
            await sendEmailVerification(user);

            // 2. Create School Entry
            const schoolRef = await addDoc(collection(db, 'schools'), {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                location: formData.location,
                description: formData.description,
                logoUrl: formData.logoUrl,
                status: 'pending',
                approved: false,
                createdAt: serverTimestamp()
            });

            // 3. Create User Entry in Firestore
            await setDoc(doc(db, 'users', user.uid), {
                email: formData.email,
                role: 'pending_school_admin',
                schoolId: schoolRef.id,
                schoolName: formData.name,
                photoURL: formData.logoUrl,
                createdAt: serverTimestamp()
            });

            // 4. Notify super admins about the new registration
            try {
                const superAdminIds = await getSuperAdminIds();
                if (superAdminIds.length > 0) {
                    await createNotificationForMany(superAdminIds, {
                        type: 'school_registered',
                        title: 'New School Registration',
                        message: `${formData.name} has submitted a registration application and is pending approval.`,
                        link: '/super-admin/schools'
                    });
                }
            } catch (notifErr) {
                console.error('Failed to send notification:', notifErr);
            }

            // 5. Sign out AT THE VERY END (ensure profile is created first)
            await signOut(auth);

            setSubmitted(true);
        } catch (err) {
            console.error("Error submitting school registration:", err);
            if (err.code === 'auth/email-already-in-use') {
                setError("This email is already registered.");
            } else {
                setError("Something went wrong. Please try again later.");
            }
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                        <CheckCircle2 size={40} />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-4">Application Sent!</h2>
                    <p className="text-slate-600 mb-8">
                        Thank you for registering <strong>{formData.name}</strong>. Our Super Admin will review your application and contact you via <strong>{formData.email}</strong> once approved.
                    </p>
                    <Link to="/" className="inline-flex items-center gap-2 font-bold text-blue-900 hover:text-blue-800 transition">
                        <ArrowLeft size={20} /> Back to Homepage
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <Link to="/login" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-8 transition">
                    <ArrowLeft size={20} /> Back to Login
                </Link>

                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="bg-blue-900 px-8 py-10 text-white text-center">
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                            <School size={32} />
                        </div>
                        <h1 className="text-3xl font-bold mb-2">School Registration</h1>
                        <p className="text-blue-100 italic">Join the News Journal SL network and showcase your school's voice.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        {error && (
                            <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-100 flex items-center gap-3">
                                <Info size={20} /> {error}
                            </div>
                        )}

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 ml-1">
                                    <School size={16} /> School Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Full name of school"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 ml-1">
                                    <Mail size={16} /> Admin Email
                                </label>
                                <input
                                    type="email"
                                    required
                                    placeholder="admin@school.edu.sl"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition"
                                />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 ml-1">
                                    <Lock size={16} /> Password
                                </label>
                                <input
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 ml-1">
                                    <Lock size={16} /> Confirm Password
                                </label>
                                <input
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition"
                                />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 ml-1">
                                    <Phone size={16} /> Phone Number
                                </label>
                                <input
                                    type="tel"
                                    required
                                    placeholder="+232 7..."
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 ml-1">
                                    <MapPin size={16} /> Location
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="City, District"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 ml-1">
                                <Info size={16} /> Brief Description
                            </label>
                            <textarea
                                required
                                placeholder="Tell us about your school..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full p-3 h-32 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none resize-none transition"
                            ></textarea>
                            <p className="text-xs text-slate-400">This will be shown on your school profile page.</p>
                        </div>

                        <div className="space-y-4">
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 ml-1">
                                <School size={16} /> School Logo (Optional)
                            </label>
                            <div className="flex justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl">
                                <LogoSelector 
                                    selectedLogo={formData.logoUrl}
                                    onSelect={(url) => setFormData({ ...formData, logoUrl: url })}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-blue-900 text-white rounded-xl font-bold text-lg hover:bg-blue-800 disabled:opacity-50 transition shadow-lg flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : "Submit Application"}
                        </button>

                        <p className="text-center text-slate-500 text-sm">
                            Already have an account? <Link to="/login" className="text-blue-700 font-bold hover:underline">Login here</Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}
