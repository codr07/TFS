import { useState } from 'react';
import { Phone, Mail, MapPin, Send, User, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

const Contact = () => {
  const [formState, setFormState] = useState({ name: '', phone: '', email: '', message: '' });

  return (
    <div className="animate-fade-in" style={{ paddingTop: '15vh', paddingBottom: '10vh' }}>
      <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
        
        {/* Header */}
        <div className="text-center gsap-fade-up">
          <h1 className="gsap-split-text" style={{ fontSize: 'clamp(3rem, 6vw, 5rem)', marginBottom: '1.5rem' }}>
            Get in Touch.
          </h1>
          <p style={{ fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto', color: 'var(--text-secondary)' }}>
            Have a question about classes, availability, or the right level for you?
          </p>
        </div>
        
        {/* Finder Window UI */}
        <div className="animated-border-box gsap-fade-up" style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', padding: 0 }}>
            
            {/* Window Controls */}
            <div className="window-controls" style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '8px' }}>
              <div className="window-dot dot-red"></div>
              <div className="window-dot dot-yellow"></div>
              <div className="window-dot dot-green"></div>
            </div>
            
            {/* Main Window Content */}
            <div style={{ padding: 'var(--spacing-md)' }}>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                
                {/* Phone */}
                <div className="glass-panel hover-lift" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <div style={{ padding: '1rem', background: 'rgba(212,175,55,0.1)', borderRadius: '50%', marginBottom: '1.5rem' }}>
                    <Phone size={28} color="var(--gold)" />
                  </div>
                  <p className="hero-subtitle" style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>PHONE / WHATSAPP</p>
                  <h2 style={{ color: 'var(--text-primary)', margin: '0 0 2rem 0', fontSize: '1.75rem' }}>9330689143</h2>
                  
                  <motion.a 
                    href="https://wa.me/919330689143" 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="animated-border-box"
                    style={{ width: '100%', borderRadius: '8px', padding: '2px', display: 'block', textDecoration: 'none' }}
                  >
                    <div style={{ 
                      background: 'var(--bg-card)', 
                      padding: '1rem', 
                      borderRadius: '6px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      gap: '0.75rem',
                      fontWeight: 600,
                      color: 'var(--gold)',
                      letterSpacing: '0.1em'
                    }}>
                      <Phone size={18} />
                      WHATSAPP TFS
                    </div>
                  </motion.a>
                </div>
                
                {/* Email */}
                <div className="glass-panel hover-lift" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <div style={{ padding: '1rem', background: 'rgba(0,229,255,0.1)', borderRadius: '50%', marginBottom: '1.5rem' }}>
                    <Mail size={28} color="#00e5ff" />
                  </div>
                  <p className="hero-subtitle" style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>EMAIL</p>
                  <h2 style={{ color: 'var(--text-primary)', margin: '0 0 2rem 0', fontSize: '1.2rem', wordBreak: 'break-all' }}>codr.sankha.<br/>contact@gmail.com</h2>
                  
                  <motion.a 
                    href="mailto:codr.sankha.contact@gmail.com" 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{ 
                      width: '100%', 
                      borderRadius: '8px', 
                      padding: '1rem', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      gap: '0.75rem',
                      fontWeight: 600,
                      color: '#00e5ff',
                      letterSpacing: '0.1em',
                      textDecoration: 'none',
                      background: 'rgba(0,229,255,0.05)',
                      border: '1px solid rgba(0,229,255,0.3)',
                      boxShadow: '0 0 20px rgba(0,229,255,0.1) inset'
                    }}
                  >
                    <Send size={18} />
                    SEND AN EMAIL
                  </motion.a>
                </div>

                {/* Studio */}
                <div className="glass-panel hover-lift" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <div style={{ padding: '1rem', background: 'rgba(255,51,102,0.1)', borderRadius: '50%', marginBottom: '1.5rem' }}>
                    <MapPin size={28} color="#ff3366" />
                  </div>
                  <p className="hero-subtitle" style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>STUDIO</p>
                  <h2 style={{ color: 'var(--text-primary)', margin: '0 0 1.5rem 0', fontSize: '1.5rem' }}>Bengaluru</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
                    In-person lessons are exclusively available at our dedicated studio in Bengaluru.
                  </p>
                </div>

              </div>
              
              {/* Contact Form Section */}
              <div style={{ marginTop: '4rem', padding: '2rem', background: 'rgba(0,0,0,0.3)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <h3 style={{ color: 'var(--text-primary)', fontSize: '1.75rem', marginBottom: '0.5rem' }}>Send a Direct Message</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>We'll get back to you as soon as possible.</p>
                </div>
                
                <form action="https://formsubmit.co/contact.tfs.codr@gmail.com" method="POST" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '600px', margin: '0 auto' }}>
                  <input type="hidden" name="_subject" value="New TFS website enquiry" />
                  <input type="hidden" name="_replyto" value="email" />
                  <input type="hidden" name="_captcha" value="false" />
                  <input type="hidden" name="_template" value="table" />
                  <input type="hidden" name="_next" value="https://thefretboardsociety.netlify.app/contact" />
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                    <div style={{ position: 'relative' }}>
                      <User size={18} style={{ position: 'absolute', top: '1rem', left: '1rem', color: 'var(--text-secondary)' }} />
                      <input 
                        type="text" 
                        name="name"
                        placeholder="Your Name" 
                        required
                        value={formState.name}
                        onChange={(e) => setFormState({...formState, name: e.target.value})}
                        style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '1rem', outline: 'none' }} 
                      />
                    </div>
                    <div style={{ position: 'relative' }}>
                      <Phone size={18} style={{ position: 'absolute', top: '1rem', left: '1rem', color: 'var(--text-secondary)' }} />
                      <input 
                        type="tel" 
                        name="phone"
                        placeholder="Your Phone (Optional)" 
                        value={formState.phone}
                        onChange={(e) => setFormState({...formState, phone: e.target.value})}
                        style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '1rem', outline: 'none' }} 
                      />
                    </div>
                  </div>
                  
                  <div style={{ position: 'relative' }}>
                    <Mail size={18} style={{ position: 'absolute', top: '1rem', left: '1rem', color: 'var(--text-secondary)' }} />
                    <input 
                      type="email" 
                      name="email"
                      placeholder="Your Email Address" 
                      required
                      value={formState.email}
                      onChange={(e) => setFormState({...formState, email: e.target.value})}
                      style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '1rem', outline: 'none' }} 
                    />
                  </div>
                  
                  <div style={{ position: 'relative' }}>
                    <MessageSquare size={18} style={{ position: 'absolute', top: '1rem', left: '1rem', color: 'var(--text-secondary)' }} />
                    <textarea 
                      name="message"
                      placeholder="Your Message..." 
                      rows={5}
                      required
                      value={formState.message}
                      onChange={(e) => setFormState({...formState, message: e.target.value})}
                      style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '1rem', outline: 'none', resize: 'vertical' }} 
                    />
                  </div>
                  
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    style={{ 
                      padding: '1rem', 
                      background: 'var(--gold)', 
                      color: '#000', 
                      border: 'none',
                      borderRadius: '12px', 
                      fontSize: '1.1rem', 
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Send size={18} /> Send Message
                    </span>
                  </motion.button>

                </form>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Contact;
