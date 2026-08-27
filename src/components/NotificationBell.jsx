import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, ExternalLink, FileText, UserPlus, School, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getNotifications, markAsRead, markAllAsRead } from '../services/notificationService';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

const ICON_MAP = {
    article_published: { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    new_article: { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    school_approved: { icon: School, color: 'text-green-600', bg: 'bg-green-50' },
    school_rejected: { icon: School, color: 'text-red-600', bg: 'bg-red-50' },
    school_registered: { icon: School, color: 'text-orange-600', bg: 'bg-orange-50' },
    reporter_invited: { icon: UserPlus, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    default: { icon: Sparkles, color: 'text-slate-600', bg: 'bg-slate-50' }
};

export default function NotificationBell() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const panelRef = useRef(null);

    // Close panel when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Real-time unread count listener via onSnapshot (no polling needed)
    useEffect(() => {
        if (!currentUser?.uid) return;

        const notifRef = collection(db, 'notifications');
        const q = query(
            notifRef,
            where('userId', '==', currentUser.uid),
            where('read', '==', false)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setUnreadCount(snapshot.size);
        }, (err) => {
            console.error("Error listening to unread count:", err);
        });

        return () => unsubscribe();
    }, [currentUser]);

    // Fetch full notifications when panel opens
    const handleOpen = async () => {
        setIsOpen(!isOpen);
        if (!isOpen && currentUser?.uid) {
            setLoading(true);
            try {
                const notifs = await getNotifications(currentUser.uid);
                setNotifications(notifs);
            } catch (err) {
                console.error("Error fetching notifications:", err);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleMarkAllRead = async () => {
        if (!currentUser?.uid) return;
        try {
            await markAllAsRead(currentUser.uid);
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (err) {
            console.error("Error marking all as read:", err);
        }
    };

    const handleNotificationClick = async (notif) => {
        if (!notif.read) {
            try {
                await markAsRead(notif.id);
                setUnreadCount(prev => Math.max(0, prev - 1));
                setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
            } catch (err) {
                console.error("Error marking as read:", err);
            }
        }
        setIsOpen(false);
        if (notif.link) {
            navigate(notif.link);
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const getIcon = (type) => {
        const config = ICON_MAP[type] || ICON_MAP.default;
        const IconComponent = config.icon;
        return (
            <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
                <IconComponent size={18} className={config.color} />
            </div>
        );
    };

    return (
        <div className="relative" ref={panelRef}>
            {/* Bell Button */}
            <button
                onClick={handleOpen}
                className="relative p-2.5 rounded-xl hover:bg-slate-100 transition group"
                title="Notifications"
            >
                <Bell size={22} className="text-slate-500 group-hover:text-slate-700 transition" />
                {unreadCount > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 flex items-center justify-center px-1.5 bg-red-500 text-white text-[10px] font-black rounded-full shadow-lg shadow-red-500/30"
                    >
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </motion.span>
                )}
            </button>

            {/* Dropdown Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-2xl shadow-slate-200/80 border border-slate-100 overflow-hidden z-50"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="font-black text-slate-900 text-sm">Notifications</h3>
                                {unreadCount > 0 && (
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{unreadCount} unread</p>
                                )}
                            </div>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllRead}
                                    className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition"
                                >
                                    <CheckCheck size={14} /> Mark all read
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    if (window.OneSignalDeferred) {
                                        window.OneSignalDeferred.push(async function(OneSignal) {
                                            await OneSignal.Slidedown.promptPush();
                                        });
                                    }
                                }}
                                className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition ml-2"
                                title="Enable Push Notifications"
                            >
                                <Bell size={14} /> Enable Push
                            </button>
                        </div>

                        {/* Notification List */}
                        <div className="max-h-[400px] overflow-y-auto">
                            {loading ? (
                                <div className="p-8 text-center text-slate-400 text-sm font-medium">Loading...</div>
                            ) : notifications.length === 0 ? (
                                <div className="p-10 text-center">
                                    <Bell size={32} className="text-slate-200 mx-auto mb-3" />
                                    <p className="text-slate-400 text-sm font-bold">No notifications yet</p>
                                    <p className="text-slate-300 text-xs mt-1">You'll see updates here when things happen.</p>
                                </div>
                            ) : (
                                notifications.map(notif => (
                                    <button
                                        key={notif.id}
                                        onClick={() => handleNotificationClick(notif)}
                                        className={`w-full text-left p-4 flex items-start gap-3 hover:bg-slate-50 transition border-b border-slate-50 last:border-b-0 ${
                                            !notif.read ? 'bg-blue-50/30' : ''
                                        }`}
                                    >
                                        {getIcon(notif.type)}
                                        <div className="flex-grow min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm font-bold ${!notif.read ? 'text-slate-900' : 'text-slate-600'} truncate`}>
                                                    {notif.title}
                                                </span>
                                                {!notif.read && (
                                                    <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">{notif.message}</p>
                                            <p className="text-[10px] text-slate-300 font-bold mt-1.5 uppercase tracking-widest">{formatTime(notif.createdAt)}</p>
                                        </div>
                                        {notif.link && (
                                            <ExternalLink size={14} className="text-slate-300 flex-shrink-0 mt-1" />
                                        )}
                                    </button>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
