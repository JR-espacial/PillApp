import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  User, onAuthStateChanged, signInAnonymously,
  GoogleAuthProvider, linkWithPopup, signInWithPopup,
} from 'firebase/auth';
import { auth } from '../firebase/config';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setLoading(false);
      } else {
        signInAnonymously(auth).catch(() => setLoading(false));
      }
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      // Link anonymous account → Google so Firestore data is preserved
      if (auth.currentUser?.isAnonymous) {
        const result = await linkWithPopup(auth.currentUser, provider);
        setUser(result.user);
      } else {
        const result = await signInWithPopup(auth, provider);
        setUser(result.user);
      }
    } catch (err: unknown) {
      // If the Google account is already registered, sign in directly
      if (
        err instanceof Error &&
        'code' in err &&
        (err as { code: string }).code === 'auth/credential-already-in-use'
      ) {
        const result = await signInWithPopup(auth, provider);
        setUser(result.user);
      } else {
        throw err;
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
}
