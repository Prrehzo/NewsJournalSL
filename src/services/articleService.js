import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc, updateDoc, deleteDoc, limit, orderBy, writeBatch, increment, collectionGroup } from 'firebase/firestore';

const sanitizeArticleImages = (article) => {
    if (article.coverImage && (article.coverImage.includes('unsplash.com') || article.coverImage.includes('picsum.photos'))) {
        article.coverImage = null;
    }
    if (article.imageUrl && (article.imageUrl.includes('unsplash.com') || article.imageUrl.includes('picsum.photos'))) {
        article.imageUrl = null;
    }
    return article;
};

/**
 * Checks if an article with the same title already exists for a school.
 * Uses title + schoolId instead of full body text to avoid Firestore's
 * "value for body is too large" query error (body exceeds index size limits).
 */
export const checkDuplicateArticle = async (title, schoolId) => {
    const articlesRef = collection(db, 'articles');
    const q = query(
        articlesRef,
        where('title', '==', title),
        where('schoolId', '==', schoolId)
    );

    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
};

export const createArticle = async (articleData) => {
    const isDuplicate = await checkDuplicateArticle(articleData.title, articleData.schoolId);

    if (isDuplicate) {
        throw new Error("An article with this exact title and content already exists.");
    }

    return await addDoc(collection(db, 'articles'), {
        ...articleData,
        createdAt: serverTimestamp(),
        status: 'published' // or 'draft'
    });
};

export const getArticles = async (limitCount = 10, schoolId = null, authorId = null, category = null) => {
    try {
        const articlesRef = collection(db, 'articles');

        const conditions = [];
        if (schoolId) conditions.push(where('schoolId', '==', schoolId));
        if (authorId) conditions.push(where('authorId', '==', authorId));
        if (category && category !== 'all') {
            const cat = category.toLowerCase();
            const capitalized = cat.charAt(0).toUpperCase() + cat.slice(1);
            conditions.push(where('category', 'in', [cat, capitalized]));
        }

        conditions.push(where('status', '==', 'published'));
        conditions.push(limit(limitCount));

        const q = query(articlesRef, ...conditions);
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => sanitizeArticleImages({ id: doc.id, ...doc.data() }));
    } catch (err) {
        console.error("Error in getArticles:", err);
        // Fallback simple query if composite index fails
        const articlesRef = collection(db, 'articles');
        const querySnapshot = await getDocs(query(articlesRef, limit(limitCount)));
        return querySnapshot.docs.map(doc => sanitizeArticleImages({ id: doc.id, ...doc.data() }));
    }
};

/**
 * Fetch all articles for Super Admin without restricting status
 */
export const getAllArticlesForAdmin = async (limitCount = 100) => {
    try {
        const articlesRef = collection(db, 'articles');
        const q = query(articlesRef, limit(limitCount));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => sanitizeArticleImages({ id: doc.id, ...doc.data() }));
    } catch (err) {
        console.error("Error fetching all articles for admin:", err);
        return [];
    }
};

// ... (previous functions: getArticleById, updateArticle, getSchools, searchArticles, getRelatedArticles)

export const deleteArticle = async (id) => {
    return await deleteDoc(doc(db, 'articles', id));
};

// Reporter Management
export const getReporters = async (schoolId) => {
    const usersRef = collection(db, 'users');
    // Important: Only fetch reporters that are either pending invitation or fully active.
    // This avoids double-counting after a reporter has moved from the invitation stub to their real UID-based doc.
    const q = query(
        usersRef, 
        where('schoolId', '==', schoolId), 
        where('role', '==', 'reporter'),
        where('status', 'in', ['invited', 'active'])
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const addReporter = async (schoolId, reporterData) => {
    return await addDoc(collection(db, 'users'), {
        ...reporterData,
        schoolId,
        role: 'reporter',
        status: 'invited', // Placeholder status until registration
        createdAt: serverTimestamp()
    });
};

export const deleteReporter = async (id) => {
    return await deleteDoc(doc(db, 'users', id));
};

// Newsletter Subscription
export const subscribeToNewsletter = async (email) => {
    return await addDoc(collection(db, 'subscriptions'), {
        email,
        active: true,
        subscribedAt: serverTimestamp()
    });
};

export const getArticleById = async (id) => {
    const docRef = doc(db, 'articles', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return sanitizeArticleImages({ id: docSnap.id, ...docSnap.data() });
    }
    return null;
};

export const updateArticle = async (id, articleData) => {
    const docRef = doc(db, 'articles', id);
    return await updateDoc(docRef, {
        ...articleData,
        updatedAt: serverTimestamp()
    });
};

export const getSchools = async () => {
    const querySnapshot = await getDocs(collection(db, 'schools'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const searchArticles = async (searchTerm) => {
    if (!searchTerm) return [];

    // Firestore doesn't support full-text search directly without 3rd party like Algolia.
    // For now, we'll fetch all published articles and filter client-side.
    // In a larger app, we'd use a different approach.
    const articlesRef = collection(db, 'articles');
    const q = query(articlesRef, where('status', '==', 'published'));
    const querySnapshot = await getDocs(q);

    const allArticles = querySnapshot.docs.map(doc => sanitizeArticleImages({ id: doc.id, ...doc.data() }));
    const term = searchTerm.toLowerCase();

    return allArticles.filter(article =>
        article.title.toLowerCase().includes(term) ||
        (article.body && article.body.toLowerCase().includes(term)) ||
        (article.category && article.category.toLowerCase().includes(term))
    );
};

export const getRelatedArticles = async (category, excludeId, limitCount = 3) => {
    if (!category) return [];
    const articlesRef = collection(db, 'articles');
    const q = query(
        articlesRef,
        where('category', 'in', [category.toLowerCase(), category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()]),
        where('status', '==', 'published')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs
        .map(doc => sanitizeArticleImages({ id: doc.id, ...doc.data() }))
        .filter(article => article.id !== excludeId)
        .slice(0, limitCount);
};
// Admin Management
export const getAdmins = async () => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', 'super_admin'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const addAdmin = async (adminData) => {
    return await addDoc(collection(db, 'users'), {
        ...adminData,
        role: 'super_admin',
        createdAt: serverTimestamp()
    });
};

export const deleteAdmin = async (id) => {
    return await deleteDoc(doc(db, 'users', id));
};

// --- Reactions ---
export const toggleReaction = async (articleId, userId, newType, currentType) => {
    const batch = writeBatch(db);
    const articleRef = doc(db, 'articles', articleId);
    const reactionRef = doc(db, 'articles', articleId, 'reactions', userId);

    let likeDiff = 0;
    let dislikeDiff = 0;

    if (currentType === newType) {
        // Remove reaction
        batch.delete(reactionRef);
        if (currentType === 'like') likeDiff = -1;
        if (currentType === 'dislike') dislikeDiff = -1;
    } else {
        // Set new reaction
        batch.set(reactionRef, {
            userId,
            articleId,
            type: newType,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        if (newType === 'like') {
            likeDiff = 1;
            if (currentType === 'dislike') dislikeDiff = -1;
        } else if (newType === 'dislike') {
            dislikeDiff = 1;
            if (currentType === 'like') likeDiff = -1;
        }
    }

    const updates = {};
    if (likeDiff !== 0) updates.likeCount = increment(likeDiff);
    if (dislikeDiff !== 0) updates.dislikeCount = increment(dislikeDiff);
    
    if (Object.keys(updates).length > 0) {
        batch.update(articleRef, updates);
    }

    await batch.commit();
};

export const getUserReaction = async (articleId, userId) => {
    const docRef = doc(db, 'articles', articleId, 'reactions', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data().type;
    }
    return null;
};

export const getUserReactions = async (userId) => {
    const q = query(
        collectionGroup(db, 'reactions'),
        where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// --- Comments ---
export const addComment = async (articleId, userId, displayName, text) => {
    return await addDoc(collection(db, 'articles', articleId, 'comments'), {
        userId,
        articleId,
        displayName,
        text: text.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
};

export const getComments = async (articleId) => {
    const commentsRef = collection(db, 'articles', articleId, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const deleteComment = async (articleId, commentId) => {
    return await deleteDoc(doc(db, 'articles', articleId, 'comments', commentId));
};

// --- Schools ---
export const getSchoolById = async (schoolId) => {
    if (!schoolId) return null;
    const docRef = doc(db, 'schools', schoolId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
};
