import { Link } from 'react-router-dom';
import { Home, Users, Video } from 'lucide-react';

const Fees = () => {
  const cardStyle = { padding: '2.5rem', display: 'flex', flexDirection: 'column' as const, height: '100%' };

  return (
    <div className="animate-fade-in" style={{ paddingTop: '15vh', paddingBottom: '10vh' }}>
      <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>

        {/* Header */}
        <div className="text-center gsap-fade-up">
          <h1 className="gsap-split-text" style={{ fontSize: 'clamp(3rem, 6vw, 5rem)', marginBottom: '1.5rem' }}>
            Tuition Fees.
          </h1>
          <p style={{ fontSize: '1.25rem', maxWidth: '700px', margin: '0 auto', color: 'var(--text-secondary)' }}>
            Straightforward pricing for premium, personalized musical instruction.
          </p>
        </div>

        {/* Finder Window UI */}
        <div className="animated-border-box gsap-fade-up">
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>

            {/* Window Controls */}
            <div className="window-controls" style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '8px' }}>
              <div className="window-dot dot-red"></div>
              <div className="window-dot dot-yellow"></div>
              <div className="window-dot dot-green"></div>
            </div>

            {/* Main Window Content */}
            <div style={{ padding: '3rem', display: 'flex', flexDirection: 'column', gap: '4rem' }}>

              {/* Pricing Grid */}
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', alignItems: 'center' }}>

                {/* Home Visit */}
                <div className="glass-panel hover-lift" style={cardStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <Home size={24} color="#ff3366" />
                    <p className="hero-subtitle" style={{ margin: 0, fontSize: '0.9rem', color: '#ff3366' }}>ONE-TO-ONE</p>
                  </div>
                  <h3 style={{ fontSize: '2rem', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Home Visit</h3>
                  <div style={{ padding: '1.5rem 0', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '1.5rem' }}>
                    <span style={{ fontSize: '3rem', fontWeight: 600, color: 'var(--text-primary)' }}>₹1,500</span>
                    <span style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>/ SESSION</span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', flex: 1, lineHeight: 1.6 }}>
                    Personalized guitar instruction at your location. The ultimate convenience for busy professionals.
                  </p>
                </div>

                {/* Tuition (Highlighted) */}
                <div className="tuition-highlight-wrapper" style={{ zIndex: 10 }}>
                  <div className="animated-border-box hover-lift">
                    <div className="glass-panel" style={{ ...cardStyle, background: 'rgba(212,175,55,0.03)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <Users size={24} color="var(--gold)" />
                        <p className="hero-subtitle" style={{ margin: 0, fontSize: '0.9rem', color: 'var(--gold)' }}>ONE-TO-ONE</p>
                      </div>
                      <h3 style={{ fontSize: '2rem', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Tuition</h3>
                      <div style={{ padding: '1.5rem 0', borderTop: '1px solid rgba(212,175,55,0.2)', borderBottom: '1px solid rgba(212,175,55,0.2)', marginBottom: '1.5rem' }}>
                        <span style={{ fontSize: '3.5rem', fontWeight: 700, color: 'var(--gold)', textShadow: '0 0 20px rgba(212,175,55,0.3)' }}>₹1,300</span>
                        <span style={{ color: 'rgba(212,175,55,0.7)', marginLeft: '0.5rem' }}>/ SESSION</span>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', flex: 1, lineHeight: 1.6 }}>
                        Focused, one-on-one instruction at the designated learning location. Our most popular format for rapid progression.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Online */}
                <div className="glass-panel hover-lift" style={cardStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <Video size={24} color="#00e5ff" />
                    <p className="hero-subtitle" style={{ margin: 0, fontSize: '0.9rem', color: '#00e5ff' }}>ONE-TO-ONE</p>
                  </div>
                  <h3 style={{ fontSize: '2rem', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Online</h3>
                  <div style={{ padding: '1.5rem 0', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '1.5rem' }}>
                    <span style={{ fontSize: '3rem', fontWeight: 600, color: 'var(--text-primary)' }}>₹850</span>
                    <span style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>/ SESSION</span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', flex: 1, lineHeight: 1.6 }}>
                    Structured individual guitar lessons online. Learn from anywhere without compromising on quality.
                  </p>
                </div>
              </div>

              {/* Ukulele Pricing Banner */}
              <div className="animated-border-box">
                <div className="glass-panel" style={{ padding: '2rem 3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', background: 'rgba(212,175,55,0.02)' }}>
                  <h3 style={{ fontSize: '1.75rem', marginBottom: '1rem', color: 'var(--gold)' }}>Ukulele Instruction</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '2rem', width: '100%', maxWidth: '800px' }}>
                    
                    <div style={{ flex: '1 1 300px', padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <h4 style={{ color: 'var(--text-primary)', fontSize: '1.25rem', marginBottom: '0.5rem' }}>General Standard Ukulele</h4>
                      <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '1rem' }}>Priced identically to Guitar sessions across all formats (Home Visit, Tuition, Online).</p>
                    </div>

                    <div style={{ flex: '1 1 300px', padding: '1.5rem', background: 'rgba(212,175,55,0.05)', borderRadius: '16px', border: '1px solid rgba(212,175,55,0.2)' }}>
                      <h4 style={{ color: 'var(--text-primary)', fontSize: '1.25rem', marginBottom: '0.5rem' }}>Dotara Style Ukulele</h4>
                      <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--gold)', marginBottom: '0.5rem' }}>₹1,500 <span style={{ fontSize: '1rem', color: 'rgba(212,175,55,0.7)', fontWeight: 'normal' }}>/ SESSION</span></div>
                      <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem' }}>Flat rate for specialized Dotara instruction (All formats).</p>
                    </div>

                  </div>
                </div>
              </div>

              {/* Group Classes Banner */}
              <div className="animated-border-box">
                <div className="glass-panel" style={{ padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Group Classes</h2>
                  <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', maxWidth: '600px', marginBottom: '2rem' }}>
                    Group-class fees and batch availability vary depending on the selected format and current enrollment size.
                  </p>
                  <Link to="/contact" className="btn btn-solid" style={{ padding: '1rem 3rem', fontSize: '1.1rem' }}>
                    ENQUIRE NOW
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Fees;
