import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, onSnapshot, collection, query, where, getDocs, setDoc, updateDoc } from "firebase/firestore";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'super_admin', 'school_admin', 'public' (or null)
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeDoc = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      // Clean up previous doc listener if it exists
      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = null;
      }

      if (user) {
        setLoading(true);
        console.log("AuthContext: User authenticated", user.email, user.uid);
        // First, check if we already have the data in state (from fetchUserData)
        // If not, or to be sure, start a listener
        const userDocRef = doc(db, "users", user.uid);
        unsubscribeDoc = onSnapshot(userDocRef, async (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            console.log("AuthContext: User data found", { role: userData.role, schoolId: userData.schoolId });
            // Auto-heal missing schoolId for school admins
            if (!userData.schoolId && (userData.role === 'school_admin' || userData.role === 'School Admin')) {
              console.log("AuthContext: User missing schoolId, searching by email...");
              try {
                const schoolsRef = collection(db, "schools");
                const schoolQuery = query(schoolsRef, where("email", "==", user.email));
                const schoolSnap = await getDocs(schoolQuery);
                if (!schoolSnap.empty) {
                  const schoolId = schoolSnap.docs[0].id;
                  const schoolName = schoolSnap.docs[0].data().name;
                  await setDoc(doc(db, "users", user.uid), { schoolId, schoolName }, { merge: true });
                  userData.schoolId = schoolId;
                  userData.schoolName = schoolName;
                }
              } catch (e) {
                console.error("AuthContext auto-heal failed:", e);
              }
            }

            setUserRole(userData.role || 'public');
            setCurrentUser({ ...user, ...userData, role: userData.role || 'public' });
            setLoading(false);
            // Fix Race Condition: If user was just created, wait for the doc to be written by the registration flow.
            const isNewUser = new Date() - new Date(user.metadata.creationTime) < 60000;
            if (isNewUser) {
              console.log("AuthContext: User is new. Waiting for registration to create user doc...");
              // Don't fallback, just wait for the next snapshot.
              return;
            }
          } else {
            console.log("AuthContext: Document missing by UID, searching by email...", user.email);
            try {
              const usersRef = collection(db, "users");
              const q = query(usersRef, where("email", "==", user.email));
              const querySnap = await getDocs(q);

              if (!querySnap.empty) {
                const legacyDoc = querySnap.docs[0];
                const userData = legacyDoc.data();
                console.log("AuthContext: Found document by email, migrating to UID...", { oldId: legacyDoc.id, newId: user.uid });
                
                await setDoc(doc(db, "users", user.uid), {
                  ...userData,
                  uid: user.uid,
                  migratedAt: new Date()
                });
              } else {
                console.log("AuthContext: No user doc by email. Searching schools collection as deep fallback...", user.email);
                const schoolsRef = collection(db, "schools");
                const schoolQuery = query(schoolsRef, where("email", "==", user.email));
                const schoolSnap = await getDocs(schoolQuery);

                if (!schoolSnap.empty) {
                  const schoolData = schoolSnap.docs[0].data();
                  const schoolId = schoolSnap.docs[0].id;
                  console.log("AuthContext: Found approved school as fallback. Reconstruction user doc...", user.email);
                  
                  // Reconstruct the missing user profile
                  const newUserDoc = {
                    email: user.email,
                    uid: user.uid,
                    role: schoolData.status === 'approved' ? 'school_admin' : 'pending_school_admin',
                    schoolId: schoolId,
                    schoolName: schoolData.name,
                    createdAt: schoolData.createdAt || new Date(),
                    reconstructedAt: new Date()
                  };

                  await setDoc(doc(db, "users", user.uid), newUserDoc);
                  // The snapshot will now pick this up and set state.
                } else {
                  console.warn(`No user or school record found for: ${user.email}. Defaulting to 'public'.`);
                  setUserRole('public');
                  setCurrentUser(user);
                  setLoading(false);
                }
              }
            } catch (recoveryErr) {
              console.error("AuthContext: Recovery failed", recoveryErr);
              setUserRole('public');
              setCurrentUser(user);
              setLoading(false);
            }
          }
        }, (error) => {
          console.error("Error watching user role:", error);
          setUserRole('public');
          setCurrentUser(user);
          setLoading(false);
        });
      } else {
        setCurrentUser(null);
        setUserRole(null);
        setLoading(false);
      }
    });

    const timer = setTimeout(() => {
      // Only force end loading if we've been stuck too long
      setLoading(prev => {
        if (prev) console.warn("Auth loading timed out after 10s");
        return false;
      });
    }, 10000);

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
      clearTimeout(timer);
    };
  }, []);

  const fetchUserData = async (uid) => {
    setLoading(true);
    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const userData = docSnap.data();
        setUserRole(userData.role);
        setCurrentUser(prev => ({ ...prev, ...userData }));
        setLoading(false);
        return userData;
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
    setLoading(false);
    return null;
  };

  const logout = async () => {
    // Clear OneSignal identity before Firebase sign-out
    try {
      if (window.OneSignalDeferred) {
        window.OneSignalDeferred.push(async function(OneSignal) {
          await OneSignal.logout();
        });
      }
    } catch (err) {
      console.warn('OneSignal logout failed:', err);
    }
    return auth.signOut();
  };

  const value = {
    currentUser,
    userRole,
    logout,
    fetchUserData,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
