import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { MessageSquare, Send, X, MessageCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    
    try {
      const { error } = await supabase
        .from('inquiries')
        .insert([{ 
          name: formData.name, 
          email: formData.email, 
          message: formData.message,
          created_at: new Date().toISOString()
        }]);
        
      if (error) throw error;
      setStatus('success');
      setFormData({ name: '', email: '', message: '' });
      setTimeout(() => {
        setIsOpen(false);
        setStatus('idle');
      }, 3000);
    } catch (err) {
      console.error('Error submitting inquiry:', err);
      setStatus('error');
    }
  };

  const inputStyle = {
    padding: '0.75rem 1rem',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-body)',
    fontSize: '0.9rem',
    outline: 'none',
    transition: 'all 0.3s ease',
    width: '100%'
  };

  return (
    <>
      {/* Floating Action Button */}
      <div 
        onClick={() => setIsOpen(true)}
        className="glass-panel hover-lift"
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          zIndex: 9998,
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          background: 'rgba(10,10,10,0.8)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          border: '1px solid rgba(212,175,55,0.3)',
        }}
      >
        <MessageCircle size={28} color="var(--gold)" />
      </div>

      {/* Chat Window Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              bottom: '5.5rem',
              right: '2rem',
              zIndex: 9999,
              width: '90vw',
              maxWidth: '380px',
            }}
          >
            <div className="animated-border-box" style={{ width: '100%' }}>
              <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'rgba(15,15,15,0.95)' }}>
                
                {/* Window Controls & Header */}
                <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div className="window-dot dot-red" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <X size={8} color="rgba(0,0,0,0.6)" style={{ opacity: 0, transition: 'opacity 0.2s' }} className="dot-icon" />
                    </div>
                    <div className="window-dot dot-yellow"></div>
                    <div className="window-dot dot-green"></div>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, letterSpacing: '0.05em' }}>
                    TFS SUPPORT
                  </div>
                </div>
                
                {/* Chat Content */}
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ padding: '0.5rem', background: 'rgba(212,175,55,0.1)', borderRadius: '50%' }}>
                      <MessageSquare size={18} color="var(--gold)" />
                    </div>
                    <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: 1.4 }}>
                      Hi there! Got a question? Send us a message and we'll reply to your email.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <input 
                        type="text" 
                        placeholder="Your Name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        style={inputStyle}
                        onFocus={(e) => e.target.style.borderColor = 'var(--gold)'}
                        onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                      />
                    </div>

                    <div>
                      <input 
                        type="email" 
                        placeholder="Email Address"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        style={inputStyle}
                        onFocus={(e) => e.target.style.borderColor = 'var(--gold)'}
                        onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                      />
                    </div>

                    <div>
                      <textarea 
                        placeholder="How can we help?"
                        required
                        value={formData.message}
                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                        style={{ ...inputStyle, resize: 'none', minHeight: '100px' }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--gold)'}
                        onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                      />
                    </div>

                    <button 
                      type="submit" 
                      className="btn btn-solid hover-lift" 
                      disabled={status === 'submitting'}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.85rem', marginTop: '0.5rem', fontSize: '0.9rem' }}
                    >
                      {status === 'submitting' ? 'SENDING...' : (
                        <>
                          SEND MESSAGE <Send size={14} />
                        </>
                      )}
                    </button>
                    
                    {status === 'success' && <p style={{ color: 'var(--gold)', textAlign: 'center', margin: 0, padding: '0.75rem', background: 'rgba(212,175,55,0.1)', borderRadius: '8px', fontSize: '0.85rem' }}>Message sent successfully!</p>}
                    {status === 'error' && <p style={{ color: '#ff3366', textAlign: 'center', margin: 0, padding: '0.75rem', background: 'rgba(255,51,102,0.1)', borderRadius: '8px', fontSize: '0.85rem' }}>Failed to send message.</p>}
                  </form>
                </div>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .dot-red:hover .dot-icon {
          opacity: 1 !important;
        }
      `}</style>
    </>
  );
};

export default ChatWidget;
