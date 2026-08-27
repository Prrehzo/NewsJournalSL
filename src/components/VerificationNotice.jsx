import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '../firebase';
import { AlertCircle, RefreshCw, Mail, Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function VerificationNotice() {
    const { currentUser } = useAuth();
    const [sending, setSending] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const [isVerified, setIsVerified] = useState(true); // Default true so it doesn't flash
    const [checking, setChecking] = useState(false);
    const [feedback, setFeedback] = useState(null); // { type: 'success'|'error'|'info', message }

    useEffect(() => {
        if (currentUser) {
            setIsVerified(currentUser.emailVerified);
        }
    }, [currentUser]);

    useEffect(() => {
        let timer;
        if (cooldown > 0) {
            timer = setInterval(() => {
                setCooldown(c => c - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [cooldown]);

    // Auto-clear feedback after 5 seconds
    useEffect(() => {
        if (feedback) {
            const timer = setTimeout(() => setFeedback(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [feedback]);

    const handleResend = async () => {
        if (cooldown > 0 || sending || !auth.currentUser) return;
        
        setSending(true);
        setFeedback(null);
        try {
            const actionCodeSettings = {
                url: 'https://newsjournalsl.web.app',
                handleCodeInApp: true,
            };
            await sendEmailVerification(auth.currentUser, actionCodeSettings);
            setFeedback({ type: 'success', message: 'Verification email sent! Please check your inbox.' });
            setCooldown(60);
        } catch (error) {
            console.error("Error sending verification email:", error);
            if (error.code === 'auth/too-many-requests') {
                setFeedback({ type: 'error', message: 'Please wait before requesting another email.' });
            } else {
                setFeedback({ type: 'error', message: 'Failed to send verification email. Please try again later.' });
            }
        } finally {
            setSending(false);
        }
    };

    const handleRefresh = async () => {
        if (!auth.currentUser || checking) return;
        
        setChecking(true);
        setFeedback(null);
        try {
            await auth.currentUser.reload();
            if (auth.currentUser.emailVerified) {
                setIsVerified(true);
                setFeedback({ type: 'success', message: 'Email successfully verified!' });
            } else {
                setFeedback({ type: 'info', message: 'Email is not verified yet. Please check your inbox.' });
            }
        } catch (error) {
            console.error("Error reloading user:", error);
            setFeedback({ type: 'error', message: 'Could not refresh verification status.' });
        } finally {
            setChecking(false);
        }
    };

    // If no user, or user is already verified, do not render anything
    if (!currentUser || isVerified) {
        return null;
    }

    return (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-yellow-800">
                    <AlertCircle size={20} className="shrink-0 text-yellow-600" />
                    <p className="text-sm font-medium">
                        Please verify your email address to continue using all features. 
                    </p>
                </div>
                
                <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-end">
                    <button
                        onClick={handleResend}
                        disabled={sending || cooldown > 0}
                        className="flex items-center gap-2 px-4 py-1.5 text-sm font-semibold text-yellow-900 bg-yellow-100 hover:bg-yellow-200 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {sending ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <Mail size={16} />
                        )}
                        {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Verification Email'}
                    </button>
                    
                    <button
                        onClick={handleRefresh}
                        disabled={checking}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-white bg-yellow-600 hover:bg-yellow-700 rounded-lg transition disabled:opacity-70"
                        title="I have verified my email"
                    >
                        <RefreshCw size={16} className={checking ? "animate-spin" : ""} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Inline feedback message */}
            {feedback && (
                <div className={`max-w-7xl mx-auto mt-2 flex items-center gap-2 text-sm font-medium ${
                    feedback.type === 'success' ? 'text-green-700' :
                    feedback.type === 'error' ? 'text-red-700' :
                    'text-yellow-700'
                }`}>
                    {feedback.type === 'success' ? <CheckCircle size={16} /> : 
                     feedback.type === 'error' ? <XCircle size={16} /> :
                     <AlertCircle size={16} />}
                    {feedback.message}
                </div>
            )}
        </div>
    );
}
