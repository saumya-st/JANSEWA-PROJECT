import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { app } from "./config";

const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

const DEFAULT_ROLE = "citizen";

const ensureUserDocument = async (firebaseUser) => {
  const ref = doc(db, "users", firebaseUser.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      name: firebaseUser.displayName || "",
      email: firebaseUser.email || "",
      role: DEFAULT_ROLE,
      createdAt: serverTimestamp(),
    });

    return DEFAULT_ROLE;
  }

  return snap.data()?.role || DEFAULT_ROLE;
};

export const loginWithGoogle = async () => {
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  const role = await ensureUserDocument(user);

  return { user, role };
};

export { auth };

export const signUpWithEmail = async ({ name, email, password }) => {
  const result = await createUserWithEmailAndPassword(auth, email, password);

  if (name) {
    await updateProfile(result.user, { displayName: name });
  }

  const role = await ensureUserDocument(result.user);
  return { user: result.user, role };
};

export const loginWithEmail = async ({ email, password }) => {
  const result = await signInWithEmailAndPassword(auth, email, password);
  const role = await ensureUserDocument(result.user);
  return { user: result.user, role };
};
