import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer style={{ paddingTop: '4rem', paddingBottom: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.5) 100%)', position: 'relative', zIndex: 10 }}>
      <div className="container">
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          
          {/* Main Flex Row */}
          <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '2rem' }}>
            
            {/* Brand / Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <img src="/images/logo_t.png" alt="The Fretboard Society" style={{ height: '60px', filter: 'drop-shadow(0 0 10px rgba(212,175,55,0.3))' }} />
              <div>
                <h2 style={{ fontSize: '1.25rem', color: 'var(--gold)', letterSpacing: '0.1em', margin: 0 }}>THE FRETBOARD SOCIETY</h2>
                <p style={{ fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-secondary)', margin: 0, marginTop: '6px' }}>Guitar &middot; Music &middot; Vibes</p>
              </div>
            </div>

            {/* Information Links */}
            <div style={{ display: 'flex', flexDirection: 'row', gap: '2.5rem', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              <Link to="/schedule" className="hover-pill" style={{ color: 'var(--text-primary)' }}>Schedule</Link>
              <Link to="/fees" className="hover-pill" style={{ color: 'var(--text-primary)' }}>Fees</Link>
              <Link to="/faq" className="hover-pill" style={{ color: 'var(--text-primary)' }}>FAQ</Link>
              <Link to="/contact" className="hover-pill" style={{ color: 'var(--text-primary)' }}>Contact</Link>
              <Link to="/terms" className="hover-pill" style={{ color: 'var(--text-primary)' }}>T&C</Link>
              <Link to="/privacypolicy" className="hover-pill" style={{ color: 'var(--text-primary)' }}>Privacy Policy</Link>
            </div>

            {/* Contact Info */}
            <div style={{ display: 'flex', flexDirection: 'row', gap: '2rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={16} color="var(--gold)" />
                <span>Bengaluru</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Phone size={16} color="var(--gold)" />
                <a href="tel:9330689143" className="hover-underline" style={{ color: 'var(--text-secondary)' }}>+91 9330689143</a>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={16} color="var(--gold)" />
                <a href="mailto:codr.sankha.contact@gmail.com" className="hover-underline" style={{ color: 'var(--text-secondary)' }}>codr.sankha.contact@gmail.com</a>
              </div>
            </div>

          </div>

          {/* Bottom Bar */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>
            <p>&copy; {new Date().getFullYear()} The Fretboard Society. All rights reserved.</p>
            <p style={{ letterSpacing: '0.15em' }}>DEVELOPED BY CODR SANKHA</p>
          </div>
          
        </div>
      </div>
    </footer>
  );
};

export default Footer;
