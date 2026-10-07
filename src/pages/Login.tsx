import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useLocation, useNavigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LoginProps {
  expectedRole?: 'admin' | 'student';
  redirectPath?: string;
}

const Login = ({ expectedRole, redirectPath }: LoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role: currentRole, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user && expectedRole && currentRole === expectedRole) {
      navigate(redirectPath || (expectedRole === 'admin' ? '/tfscontrol' : '/tfs-students'), { replace: true });
    }
  }, [authLoading, currentRole, expectedRole, navigate, redirectPath, user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (data.user) {
        const metadataRole = data.user.app_metadata?.role;
        const { data: databaseRole, error: profileError } = await supabase.rpc('current_user_role');

        if (profileError) console.warn('Profile role lookup unavailable; checking app metadata instead.', profileError);
        const role = databaseRole || metadataRole;

        if (role !== 'admin' && role !== 'student') {
          await supabase.auth.signOut();
          throw new Error('Your account has no admin or student role. Ask an administrator to assign portal access.');
        }

        if (expectedRole && role !== expectedRole) {
          await supabase.auth.signOut();
          throw new Error(`This login is for ${expectedRole === 'admin' ? 'administrators' : 'students'} only.`);
        }

        const returnPath = (location.state as { from?: string } | null)?.from;
        navigate(redirectPath || returnPath || (role === 'admin' ? '/tfscontrol' : '/tfs-students'), { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingTop: '15vh', paddingBottom: '10vh', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'center' }}>
        
        <div className="animated-border-box gsap-fade-up" style={{ width: '100%', maxWidth: '450px' }}>
          <div className="glass-panel" style={{ padding: '3rem 2.5rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <h2 style={{ fontSize: '2rem', color: 'var(--gold)', marginBottom: '0.5rem' }}>{expectedRole === 'admin' ? 'Admin Login' : expectedRole === 'student' ? 'Student Login' : 'Portal Login'}</h2>
              <p style={{ color: 'var(--text-secondary)' }}>{expectedRole === 'admin' ? 'Access TFS Control' : expectedRole === 'student' ? 'Access Student Corner' : 'Access your dashboard'}</p>
            </div>

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', top: '1rem', left: '1rem', color: 'var(--text-secondary)' }} />
                <input 
                  type="email" 
                  placeholder="Email Address" 
                  required 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '1rem', outline: 'none' }} 
                />
              </div>

              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', top: '1rem', left: '1rem', color: 'var(--text-secondary)' }} />
                <input 
                  type="password" 
                  placeholder="Password" 
                  required 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '1rem', outline: 'none' }} 
                />
              </div>

              {error && (
                <div style={{ color: '#ff5f56', fontSize: '0.9rem', textAlign: 'center', padding: '0.5rem', background: 'rgba(255,95,86,0.1)', borderRadius: '8px' }}>
                  {error}
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading} 
                style={{ marginTop: '0.5rem', padding: '1rem', background: 'var(--gold)', color: '#000', border: 'none', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'all 0.3s ease' }}
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
