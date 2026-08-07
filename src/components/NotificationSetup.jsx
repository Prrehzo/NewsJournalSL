import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const NotificationSetup = () => {
    const { currentUser } = useAuth();

    useEffect(() => {
        const setupNotifications = async () => {
            if (!currentUser) return;
            
            try {
                // Request native browser permission for our free notification system
                if (Notification.permission === 'default') {
                    await Notification.requestPermission();
                }
            } catch (err) {
                console.error('Notification setup failed:', err);
            }
        };

        setupNotifications();
    }, [currentUser]);

    return null;
};

export default NotificationSetup;
