import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

type UserRole = 'admin' | 'student' | null;

export type { UserRole };

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: UserRole;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  role: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (!mounted) return;
      if (error) {
        console.error('Unable to restore auth session:', error);
        setLoading(false);
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchRole(session.user);
      } else {
        setLoading(false);
      }
    };

    void loadInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setLoading(true);
        // Supabase warns against making another Supabase request inside this callback.
        window.setTimeout(() => void fetchRole(session.user), 0);
      } else {
        setRole(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchRole = async (currentUser: User) => {
    try {
      const { data: databaseRole, error } = await supabase.rpc('current_user_role');
      if (error) throw error;
      const metadataRole = currentUser.app_metadata?.role;
      setRole(databaseRole === 'admin' || databaseRole === 'student'
        ? databaseRole
        : metadataRole === 'admin' || metadataRole === 'student'
          ? metadataRole
          : null);
    } catch (error) {
      console.error('Error fetching role:', error);
      const metadataRole = currentUser.app_metadata?.role;
      setRole(metadataRole === 'admin' || metadataRole === 'student' ? metadataRole : null);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
