import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, updateDoc, orderBy, writeBatch } from 'firebase/firestore';

/**
 * Create a notification for a specific user.
 */
export const createNotification = async (userId, { type, title, message, link = '' }) => {
    return await addDoc(collection(db, 'notifications'), {
        userId,
        type,
        title,
        message,
        link,
        read: false,
        createdAt: serverTimestamp()
    });
};

/**
 * Create the same notification for multiple users at once.
 */
export const createNotificationForMany = async (userIds, { type, title, message, link = '' }) => {
    const promises = userIds.map(userId =>
        addDoc(collection(db, 'notifications'), {
            userId,
            type,
            title,
            message,
            link,
            read: false,
            createdAt: serverTimestamp()
        })
    );
    return await Promise.all(promises);
};

/**
 * Get all notifications for a user, sorted by newest first.
 */
export const getNotifications = async (userId, limitCount = 20) => {
    const notifRef = collection(db, 'notifications');
    const q = query(
        notifRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).slice(0, limitCount);
};

/**
 * Get unread notification count for a user.
 */
export const getUnreadCount = async (userId) => {
    const notifRef = collection(db, 'notifications');
    const q = query(
        notifRef,
        where('userId', '==', userId),
        where('read', '==', false)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
};

/**
 * Mark a single notification as read.
 */
export const markAsRead = async (notificationId) => {
    const docRef = doc(db, 'notifications', notificationId);
    return await updateDoc(docRef, { read: true });
};

/**
 * Mark all notifications for a user as read.
 */
export const markAllAsRead = async (userId) => {
    const notifRef = collection(db, 'notifications');
    const q = query(
        notifRef,
        where('userId', '==', userId),
        where('read', '==', false)
    );
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);
    querySnapshot.docs.forEach(docSnap => {
        batch.update(docSnap.ref, { read: true });
    });
    return await batch.commit();
};

/**
 * Get all super admin user IDs (for broadcasting notifications).
 */
export const getSuperAdminIds = async () => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', 'super_admin'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.id);
};

/**
 * Get the school admin user ID for a given school.
 */
export const getSchoolAdminId = async (schoolId) => {
    const usersRef = collection(db, 'users');
    const q = query(
        usersRef,
        where('schoolId', '==', schoolId),
        where('role', '==', 'school_admin')
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        return querySnapshot.docs[0].id;
    }
    return null;
};
