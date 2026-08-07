import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import { FileText, School, UserPlus, Sparkles, X } from 'lucide-react';
import { markAsRead } from '../services/notificationService';
import { useNavigate } from 'react-router-dom';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

const ICON_MAP = {
    article_published: { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    new_article: { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    school_approved: { icon: School, color: 'text-green-600', bg: 'bg-green-50' },
    school_rejected: { icon: School, color: 'text-red-600', bg: 'bg-red-50' },
    school_registered: { icon: School, color: 'text-orange-600', bg: 'bg-orange-50' },
    reporter_invited: { icon: UserPlus, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    default: { icon: Sparkles, color: 'text-slate-600', bg: 'bg-slate-50' }
};

export const ToastProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [toasts, setToasts] = useState([]);
    const navigate = useNavigate();
    const isFirstSnapshot = useRef(true);

    const showToast = useCallback((id, notification) => {
        setToasts((prev) => [...prev, { id, ...notification }]);

        // Auto remove toast after 5 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 5000);
    }, []);

    const removeToast = (id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    const handleToastClick = async (toast) => {
        removeToast(toast.id);
        if (!toast.read) {
            try {
                await markAsRead(toast.id);
            } catch (err) {
                console.error("Error marking toast as read:", err);
            }
        }
        if (toast.link) {
            navigate(toast.link);
        }
    };

    useEffect(() => {
        if (!currentUser?.uid) return;

        // Reset the first snapshot ref when user changes
        isFirstSnapshot.current = true;

        const notifRef = collection(db, 'notifications');
        // We only care about unread notifications for real-time alerts
        const q = query(
            notifRef,
            where('userId', '==', currentUser.uid),
            where('read', '==', false),
            orderBy('createdAt', 'desc'),
            limit(10) // Limit just to be safe, we only care about new ones anyway
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (isFirstSnapshot.current) {
                // Ignore the first snapshot because it contains existing unread notifications from the past
                isFirstSnapshot.current = false;
                return;
            }

            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const data = change.doc.data();
                    const notifId = change.doc.id;
                    
                    // 1. Show In-App Toast
                    showToast(notifId, data);

                    // 2. Trigger Native Browser Notification (if permission granted)
                    if (Notification.permission === 'granted') {
                        // Check if document is actually visible to avoid duplicate native alerts if they are looking at the page
                        // Optional: if (document.visibilityState !== 'visible') { ... } 
                        // But let's show it anyway for now based on the requirement
                        const nativeNotif = new Notification(data.title, {
                            body: data.message,
                            icon: '/vite.svg', // Default icon, can be customized
                        });

                        nativeNotif.onclick = () => {
                            window.focus();
                            if (data.link) {
                                navigate(data.link);
                            }
                            nativeNotif.close();
                        };
                    }
                }
            });
        }, (error) => {
            console.error("Error listening to notifications:", error);
        });

        return () => unsubscribe();
    }, [currentUser, showToast, navigate]);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {/* The Toast Container using the CSS from index.css */}
            <div className="notification-wrapper">
                {toasts.map((toast) => {
                    const config = ICON_MAP[toast.type] || ICON_MAP.default;
                    const IconComponent = config.icon;

                    return (
                        <div
                            key={toast.id}
                            className="notification bg-white rounded-xl shadow-lg border border-slate-100 p-4 flex items-start gap-3 cursor-pointer hover:bg-slate-50 transition transform"
                            onClick={() => handleToastClick(toast)}
                        >
                            <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
                                <IconComponent size={18} className={config.color} />
                            </div>
                            <div className="flex-grow min-w-0 pr-2">
                                <h4 className="text-sm font-bold text-slate-900 truncate">{toast.title}</h4>
                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{toast.message}</p>
                            </div>
                            <button 
                                onClick={(e) => { e.stopPropagation(); removeToast(toast.id); }}
                                className="text-slate-400 hover:text-slate-600 transition p-1"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
};
