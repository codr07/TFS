import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Info, Guitar, BookOpen, Calendar, DollarSign, HelpCircle, Mail, Grip } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  const normalizedPath = location.pathname.toLowerCase().replace(/\/+$/, '') || '/';
  const isStandalone = 
    normalizedPath === '/admissionform' || 
    normalizedPath === '/feepayment' ||
    normalizedPath.startsWith('/admissionform/') ||
    normalizedPath.startsWith('/feepayment/') ||
    normalizedPath.startsWith('/tfscontrol') ||
    normalizedPath.startsWith('/tfs-students');

  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  
  useEffect(() => {
    if (isStandalone) return;
    // Only use iOS dock for actual mobile phones (<= 600px)
    const handleResize = () => setIsMobile(window.innerWidth <= 600);
    handleResize(); // Init
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isStandalone]);

  if (isStandalone) {
    return null;
  }

  const navLinks = [
    { name: 'Home', path: '/', icon: <Home size={24} /> },
    { name: 'About', path: '/about', icon: <Info size={24} /> },
    { name: 'Classes', path: '/classes', icon: <Guitar size={24} /> },
    { name: 'Curriculum', path: '/curriculum', icon: <BookOpen size={24} /> },
    { name: 'Schedule', path: '/schedule', icon: <Calendar size={24} /> },
    { name: 'Fees', path: '/fees', icon: <DollarSign size={24} /> },
    { name: 'FAQ', path: '/faq', icon: <HelpCircle size={24} /> },
    { name: 'Contact', path: '/contact', icon: <Mail size={24} /> },
  ];

  // Mobile split: First 4 go to iOS dock, rest go to AssistiveTouch menu
  const dockLinks = isMobile ? navLinks.slice(0, 4) : navLinks;
  const menuLinks = isMobile ? navLinks.slice(4) : [];

  return (
    <>
      {/* The Dock */}
      <div className={isMobile ? "ios-dock-wrapper" : "mac-dock-wrapper"}>
        <nav className={isMobile ? "ios-dock" : "mac-dock"}>
          {dockLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link 
                key={link.path} 
                to={link.path}
                className={isMobile ? `ios-dock-icon ${isActive ? 'active' : ''}` : `mac-dock-icon ${isActive ? 'active' : ''}`}
              >
                {!isMobile && <span className="dock-tooltip">{link.name}</span>}
                {link.icon}
                {isMobile && <span className="ios-dock-label">{link.name}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* iPhone AssistiveTouch / Quick Access Floating Button */}
      {isMobile && (
        <div style={{ position: 'fixed', bottom: '100px', left: '20px', zIndex: 1000 }}>
          
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                transition={{ type: "spring", bounce: 0.4, duration: 0.4 }}
                style={{
                  position: 'absolute',
                  bottom: '70px',
                  left: '0',
                  background: 'rgba(30, 30, 35, 0.8)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  borderRadius: '24px',
                  padding: '1rem',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '1rem',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  width: '200px'
                }}
              >
                {menuLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMenuOpen(false)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: location.pathname === link.path ? 'var(--gold)' : 'var(--text-secondary)',
                      textDecoration: 'none',
                    }}
                  >
                    <div style={{
                      background: 'rgba(255,255,255,0.05)',
                      padding: '0.75rem',
                      borderRadius: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%'
                    }}>
                      {link.icon}
                    </div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 500 }}>{link.name}</span>
                  </Link>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(20,20,20,0.8)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '2px solid rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
              color: 'var(--text-primary)'
            }}
          >
            {/* Assistive Touch internal circles pattern */}
            <div style={{ position: 'relative', width: '24px', height: '24px' }}>
              <motion.div animate={{ rotate: menuOpen ? 45 : 0 }} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Grip size={28} color={menuOpen ? "var(--gold)" : "white"} />
              </motion.div>
            </div>
          </motion.button>
        </div>
      )}
    </>
  );
};

export default Navbar;
