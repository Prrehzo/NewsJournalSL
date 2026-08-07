import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { sendEmailVerification } from 'firebase/auth';
import { Clock, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles, redirectPath = "/school-admin-login" }) {
    const { currentUser, userRole, loading } = useAuth();
    const [verificationSent, setVerificationSent] = React.useState(false);

    const handleResendVerification = async () => {
        if (currentUser && !currentUser.emailVerified) {
            try {
                await sendEmailVerification(currentUser);
                setVerificationSent(true);
            } catch (err) {
                console.error("Failed to resend verification", err);
            }
        }
    };

    if (loading || (currentUser && userRole === null)) {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mb-4"></div>
                <p className="text-slate-500 font-medium font-sans">Verifying access...</p>
            </div>
        );
    }

    if (!currentUser) {
        console.log("ProtectedRoute: No user found, redirecting to", redirectPath);
        return <Navigate to={redirectPath} replace />;
    }

    console.log("ProtectedRoute check:", { userRole, allowedRoles });

    if (allowedRoles && !allowedRoles.includes(userRole)) {
        console.log("ProtectedRoute: Role mismatch", { userRole, allowedRoles });
        // If they are pending school admin, show a friendly message
        if (userRole === 'pending_school_admin') {
            console.log("ProtectedRoute: Showing pending approval screen");
            return (
                <div className="flex flex-col justify-center items-center h-screen bg-slate-50 p-6 text-center">
                    <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-6 text-yellow-600">
                        <Clock size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Account Pending Approval</h2>
                    <p className="text-slate-600 max-w-md mb-8">
                        Thank you for registering! Your school administrator account is currently being reviewed by our Super Admin. 
                        You will be able to access this portal once your application is approved.
                    </p>
                    <button 
                        onClick={() => window.location.href = '/'}
                        className="px-6 py-2 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-800 transition"
                    >
                        Back to Homepage
                    </button>
                </div>
            );
        }

        // If they are logged in but don't have the right role, send them home 
        console.log("ProtectedRoute: Unauthorized role, redirecting home");
        return <Navigate to="/" replace />;
    }

    const [checkingStatus, setCheckingStatus] = React.useState(false);
    const [statusMsg, setStatusMsg] = React.useState('');

    const handleCheckVerification = async () => {
        if (!currentUser) return;
        setCheckingStatus(true);
        setStatusMsg('');
        try {
            await currentUser.reload();
            if (currentUser.emailVerified) {
                setStatusMsg('Email verified successfully! Refreshing...');
                setTimeout(() => window.location.reload(), 1000);
            } else {
                setStatusMsg('Not verified yet. Please click the link in your inbox.');
            }
        } catch (err) {
            console.error("Failed to reload user status", err);
            setStatusMsg('Could not check status. Please try again.');
        } finally {
            setCheckingStatus(false);
        }
    };

    return (
        <React.Fragment>
            {currentUser && !currentUser.emailVerified && (
                <div className="bg-amber-100 text-amber-900 px-4 py-3 text-center flex flex-col sm:flex-row items-center justify-center gap-3 w-full z-50 shadow-sm border-b border-amber-200">
                    <div className="flex items-center gap-2 font-medium text-sm">
                        <AlertTriangle size={18} className="text-amber-600 flex-shrink-0" />
                        <span>Please verify your email address (<strong>{currentUser.email}</strong>).</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-center">
                        {!verificationSent ? (
                            <button 
                                onClick={handleResendVerification}
                                className="text-xs bg-amber-200 hover:bg-amber-300 text-amber-900 px-3 py-1.5 rounded-md transition font-bold"
                            >
                                Resend Email
                            </button>
                        ) : (
                            <span className="text-xs font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-md">Verification email sent!</span>
                        )}
                        <button 
                            onClick={handleCheckVerification}
                            disabled={checkingStatus}
                            className="text-xs bg-amber-900 text-white hover:bg-amber-800 px-3 py-1.5 rounded-md transition font-bold disabled:opacity-50"
                        >
                            {checkingStatus ? 'Checking...' : 'Check Verification Status'}
                        </button>
                    </div>
                    {statusMsg && (
                        <div className={`text-xs font-bold w-full mt-1 ${currentUser.emailVerified ? 'text-green-700' : 'text-red-700'}`}>
                            {statusMsg}
                        </div>
                    )}
                </div>
            )}
            {children ? children : <Outlet />}
        </React.Fragment>
    );
}
