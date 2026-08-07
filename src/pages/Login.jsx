import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const { userRole, currentUser, fetchUserData, loading: authLoading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
    const [resetSent, setResetSent] = useState(false);
    const navigate = useNavigate();

    // Auto-redirect if already logged in
    useEffect(() => {
        if (currentUser && userRole && !authLoading) {
            if (userRole === 'super_admin') {
                navigate('/super-admin');
            } else if (['school_admin', 'reporter', 'pending_school_admin'].includes(userRole)) {
                navigate('/school-admin');
            } else {
                navigate('/');
            }
        }
    }, [currentUser, userRole, authLoading, navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log("Login successful, fetching role...");
            
            // Manually trigger a fetch to ensure the role is set immediately
            const userData = await fetchUserData(userCredential.user.uid);
            console.log("Role fetched:", userData?.role);
            
            if (userData) {
                if (userData.role === 'super_admin') {
                    console.log("Navigating to super-admin");
                    navigate('/super-admin');
                } else if (['school_admin', 'reporter', 'pending_school_admin'].includes(userData.role)) {
                    console.log("Navigating to school-admin");
                    navigate('/school-admin');
                } else {
                    console.log("Navigating home (public role)");
                    navigate('/');
                }
            } else {
                setError("Could not retrieve user profile. Please contact support.");
            }
        } catch (err) {
            console.error("Login detail error:", err);
            setError('Invalid email or password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!email) {
            return setError("Please enter your email address first.");
        }
        setLoading(true);
        setError('');
        try {
            await sendPasswordResetEmail(auth, email);
            setResetSent(true);
        } catch (err) {
            console.error("Reset error:", err);
            setError("Failed to send reset email. Make sure your email is correct.");
        } finally {
            setLoading(false);
        }
    };

    if (authLoading && !currentUser) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-gray-50 px-4">
            <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg border border-gray-100">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-slate-900">
                        {forgotPasswordMode ? 'Reset Password' : 'Welcome Back'}
                    </h1>
                    <p className="text-slate-500">
                        {forgotPasswordMode ? 'Enter your email to receive a reset link' : 'Sign in to your account'}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
                        {error}
                    </div>
                )}

                {forgotPasswordMode ? (
                    resetSent ? (
                        <div className="text-center space-y-4">
                            <div className="bg-green-50 text-green-700 p-4 rounded-lg text-sm border border-green-200">
                                Password reset email sent! Check your inbox.
                            </div>
                            <button
                                onClick={() => {
                                    setForgotPasswordMode(false);
                                    setResetSent(false);
                                }}
                                className="text-blue-900 font-bold hover:underline"
                            >
                                Back to Login
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleResetPassword} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@school.edu.sl"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 text-white bg-blue-900 rounded-lg hover:bg-blue-800 transition font-medium shadow-md disabled:opacity-70 flex justify-center"
                            >
                                {loading ? 'Sending...' : 'Send Reset Link'}
                            </button>
                            <div className="text-center mt-4">
                                <button
                                    type="button"
                                    onClick={() => setForgotPasswordMode(false)}
                                    className="text-sm text-slate-500 hover:text-slate-900 transition"
                                >
                                    Back to Login
                                </button>
                            </div>
                        </form>
                    )
                ) : (
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                            <input
                                type="email"
                                required
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@school.edu.sl"
                            />
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-sm font-medium text-slate-700">Password</label>
                                <button 
                                    type="button" 
                                    onClick={() => setForgotPasswordMode(true)}
                                    className="text-xs text-blue-700 hover:underline"
                                >
                                    Forgot Password?
                                </button>
                            </div>
                            <input
                                type="password"
                                required
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 text-white bg-blue-900 rounded-lg hover:bg-blue-800 transition font-medium shadow-md disabled:opacity-70 flex justify-center"
                        >
                            {loading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </form>
                )}

                <div className="mt-8 pt-6 border-t border-gray-100 text-center space-y-4">
                    <p className="text-slate-600 text-sm">
                        Don't have an account? <Link to="/signup" className="text-blue-900 font-bold hover:underline">Sign Up</Link>
                    </p>
                    <div className="pt-4 border-t border-gray-50">
                        <p className="text-xs text-slate-500 mb-3 uppercase tracking-widest font-black">Interested in partnering with us?</p>
                        <Link to="/register-school" className="inline-block px-6 py-2 border-2 border-blue-900 text-blue-900 font-bold rounded-lg hover:bg-blue-50 transition uppercase text-xs tracking-widest">
                            Register Your School
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
