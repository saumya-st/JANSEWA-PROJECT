import { createContext, useEffect, useState } from "react";
import { auth, loginWithEmail, loginWithGoogle, signUpWithEmail } from "../firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, getFirestore } from "firebase/firestore";

export const AuthContext = createContext(null);

const db = getFirestore();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔥 AUTO LOGIN (Firebase session)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Set user with default role first to allow navigation
        setUser({
          uid: firebaseUser.uid,
          name: firebaseUser.displayName,
          email: firebaseUser.email,
          role: "citizen",
        });
        // Then fetch the actual role from Firestore
        const ref = doc(db, "users", firebaseUser.uid);
        const snap = await getDoc(ref);
        const actualRole = snap.data()?.role || "citizen";
        setUser(prev => ({ ...prev, role: actualRole }));
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      await loginWithGoogle();
      return { success: true, error: null };
    } catch (err) {
      console.error(err);
      return { success: false, error: err };
    }
  };

  const loginEmail = async ({ email, password }) => {
    try {
      await loginWithEmail({ email, password });
      return { success: true, error: null };
    } catch (err) {
      console.error(err);
      return { success: false, error: err };
    }
  };

  const signup = async ({ name, email, password }) => {
    try {
      await signUpWithEmail({ name, email, password });
      return { success: true, error: null };
    } catch (err) {
      console.error(err);
      return { success: false, error: err };
    }
  };

  const logout = async () => {
    await auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, loginEmail, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
