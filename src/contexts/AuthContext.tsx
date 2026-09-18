import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile as updateAuthProfile,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  query,
  collection,
  where,
  getDocs,
} from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase/config';
import { Couple, UserProfile } from '../types';

const ALLOWED_EMAILS = [
  import.meta.env.VITE_PARTNER_1_EMAIL?.toLowerCase(),
  import.meta.env.VITE_PARTNER_2_EMAIL?.toLowerCase(),
].filter(Boolean);

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  couple: Couple | null;
  partnerId: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// This app is built for exactly two people. Real enforcement of who may
// read/write couple data lives in Firestore/Storage security rules
// (see firestore.rules) — this client-side check just improves UX by
// rejecting unrecognized sign-ins early with a clear message.
function isAllowed(email: string | null | undefined) {
  if (!ALLOWED_EMAILS.length) return true; // not configured yet, don't block dev
  return !!email && ALLOWED_EMAILS.includes(email.toLowerCase());
}

async function ensureCouple(uid: string, allUserDocs: UserProfile[]): Promise<Couple | null> {
  const couplesRef = collection(db, 'couples');
  const existing = await getDocs(
    query(couplesRef, where('partner1Id', '==', uid))
  );
  const existing2 = await getDocs(
    query(couplesRef, where('partner2Id', '==', uid))
  );
  const found = existing.docs[0] || existing2.docs[0];
  if (found) return { coupleId: found.id, ...(found.data() as any) };

  // If both partners now have accounts and no couple exists yet, create one.
  if (allUserDocs.length === 2) {
    const [p1, p2] = allUserDocs;
    const coupleId = [p1.userId, p2.userId].sort().join('_');
    const coupleRef = doc(db, 'couples', coupleId);
    const existingCouple = await getDoc(coupleRef);
    if (!existingCouple.exists()) {
      const newCouple: Omit<Couple, 'coupleId'> = {
        partner1Id: p1.userId,
        partner2Id: p2.userId,
        relationshipStartDate: new Date().toISOString().slice(0, 10),
        createdAt: Date.now(),
      };
      await setDoc(coupleRef, newCouple);
    }
    await setDoc(doc(db, 'users', p1.userId), { coupleId }, { merge: true });
    await setDoc(doc(db, 'users', p2.userId), { coupleId }, { merge: true });
    return { coupleId, ...(await getDoc(coupleRef)).data() } as Couple;
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [couple, setCouple] = useState<Couple | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadProfileAndCouple(firebaseUser: User) {
    const userRef = doc(db, 'users', firebaseUser.uid);
    let snap = await getDoc(userRef);
    if (!snap.exists()) {
      const newProfile: UserProfile = {
        userId: firebaseUser.uid,
        name: firebaseUser.displayName || firebaseUser.email!.split('@')[0],
        email: firebaseUser.email!,
        profilePhoto: firebaseUser.photoURL || undefined,
        createdAt: Date.now(),
      };
      await setDoc(userRef, newProfile);
      snap = await getDoc(userRef);
    }
    const userProfile = snap.data() as UserProfile;
    setProfile(userProfile);

    // Look up both allowed users so we can auto-create the couple doc.
    const allUsersSnap = await getDocs(collection(db, 'users'));
    const allUsers = allUsersSnap.docs
      .map((d) => d.data() as UserProfile)
      .filter((u) => ALLOWED_EMAILS.length ? ALLOWED_EMAILS.includes(u.email.toLowerCase()) : true);

    const coupleResult = await ensureCouple(firebaseUser.uid, allUsers);
    setCouple(coupleResult);
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setError(null);
      if (firebaseUser) {
        if (!isAllowed(firebaseUser.email)) {
          setError('This private space belongs to ESTER & KYPHER only.');
          await firebaseSignOut(auth);
          setUser(null);
          setProfile(null);
          setCouple(null);
          setLoading(false);
          return;
        }
        setUser(firebaseUser);
        await loadProfileAndCouple(firebaseUser);
      } else {
        setUser(null);
        setProfile(null);
        setCouple(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  async function login(email: string, password: string) {
    setError(null);
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function signup(email: string, password: string, name: string) {
    setError(null);
    if (!isAllowed(email)) {
      throw new Error('This private space belongs to ESTER & KYPHER only.');
    }
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateAuthProfile(cred.user, { displayName: name });
    await setDoc(doc(db, 'users', cred.user.uid), {
      userId: cred.user.uid,
      name,
      email,
      createdAt: Date.now(),
    });
  }

  async function loginWithGoogle() {
    setError(null);
    await signInWithPopup(auth, googleProvider);
  }

  async function resetPassword(email: string) {
    await sendPasswordResetEmail(auth, email);
  }

  async function logout() {
    await firebaseSignOut(auth);
  }

  async function refreshProfile() {
    if (user) await loadProfileAndCouple(user);
  }

  const partnerId =
    couple && user
      ? couple.partner1Id === user.uid
        ? couple.partner2Id
        : couple.partner1Id
      : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        couple,
        partnerId,
        loading,
        error,
        login,
        signup,
        loginWithGoogle,
        resetPassword,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
