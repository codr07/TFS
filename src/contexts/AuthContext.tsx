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
      let resolvedRole: UserRole = null;
      const email = (currentUser.email || '').toLowerCase().trim();

      // 1. Direct check for known system admin email
      if (email === 'codr.sankha.contact@gmail.com' || email === 'sankhasubhraghosh7@gmail.com') {
        resolvedRole = 'admin';
      }

      // 2. Try RPC current_user_role
      if (!resolvedRole) {
        try {
          const { data: databaseRole } = await supabase.rpc('current_user_role');
          if (databaseRole === 'admin' || databaseRole === 'student') {
            resolvedRole = databaseRole;
          }
        } catch {}
      }

      // 3. Direct lookup on profiles table
      if (!resolvedRole) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', currentUser.id)
            .maybeSingle();
          if (profile?.role === 'admin' || profile?.role === 'student') {
            resolvedRole = profile.role;
          }
        } catch {}
      }

      // 4. Fallback to app_metadata role
      if (!resolvedRole) {
        const metadataRole = currentUser.app_metadata?.role;
        if (metadataRole === 'admin' || metadataRole === 'student') {
          resolvedRole = metadataRole;
        }
      }

      // 5. Fallback to user_metadata role
      if (!resolvedRole) {
        const userMetaRole = currentUser.user_metadata?.role;
        if (userMetaRole === 'admin' || userMetaRole === 'student') {
          resolvedRole = userMetaRole;
        }
      }

      // If user is designated admin, self-heal profiles table
      if (resolvedRole === 'admin') {
        try {
          await supabase.from('profiles').upsert({
            id: currentUser.id,
            role: 'admin',
            email: currentUser.email,
            display_name: currentUser.user_metadata?.full_name || 'Admin',
            updated_at: new Date().toISOString(),
          });
        } catch {}
      }

      setRole(resolvedRole);
    } catch (error) {
      console.error('Error fetching role:', error);
      const email = (currentUser.email || '').toLowerCase().trim();
      if (email === 'codr.sankha.contact@gmail.com' || email === 'sankhasubhraghosh7@gmail.com') {
        setRole('admin');
      } else {
        const metadataRole = currentUser.app_metadata?.role || currentUser.user_metadata?.role;
        setRole(metadataRole === 'admin' || metadataRole === 'student' ? metadataRole : null);
      }
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (e) {
      console.warn('Sign out warning:', e);
    } finally {
      setSession(null);
      setUser(null);
      setRole(null);
      // Clean any potential cached portal auth tokens
      try {
        localStorage.removeItem('sb-anon-auth-token');
      } catch {}
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
