import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * NotificationSetup handles OneSignal identity management.
 * 
 * It does NOT automatically request push permission — that is user-initiated
 * via the "Enable Notifications" button in NotificationBell.
 * 
 * This component associates the current Firebase user's UID with OneSignal
 * so targeted notifications can be sent in the future.
 */
const NotificationSetup = () => {
    const { currentUser } = useAuth();

    useEffect(() => {
        const manageOneSignalIdentity = async () => {
            // Wait for OneSignal to be available
            if (typeof window === 'undefined' || !window.OneSignalDeferred) return;

            window.OneSignalDeferred.push(async function(OneSignal) {
                try {
                    if (currentUser?.uid) {
                        // Associate this browser/device with the Firebase user's UID
                        await OneSignal.login(currentUser.uid);
                        console.log('OneSignal: Logged in with UID', currentUser.uid);
                    } else {
                        // No user is signed in — clear any previous OneSignal identity
                        await OneSignal.logout();
                        console.log('OneSignal: Logged out');
                    }
                } catch (err) {
                    // OneSignal identity calls can fail if the SDK hasn't finished
                    // initializing or if push is not supported — this is non-critical.
                    console.warn('OneSignal identity management:', err.message || err);
                }
            });
        };

        manageOneSignalIdentity();
    }, [currentUser]);

    return null;
};

export default NotificationSetup;
