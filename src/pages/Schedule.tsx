import { Link } from 'react-router-dom';
import { Calendar, Monitor, Users, MapPin, Clock } from 'lucide-react';

const Schedule = () => {
  const cardStyle = { padding: '2rem', display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-start' };
  
  const IconBox = ({ color, bg, icon: Icon }: { color: string, bg: string, icon: any }) => (
    <div style={{ padding: '0.75rem', background: bg, borderRadius: '12px', marginBottom: '1.25rem', display: 'inline-flex' }}>
      <Icon size={24} color={color} />
    </div>
  );

  return (
    <div className="animate-fade-in" style={{ paddingTop: '15vh', paddingBottom: '10vh' }}>
      <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
        
        {/* Header */}
        <div className="text-center gsap-fade-up">
          <h1 className="gsap-split-text" style={{ fontSize: 'clamp(3rem, 6vw, 5rem)', marginBottom: '1.5rem' }}>
            Class Schedule.
          </h1>
          <p style={{ fontSize: '1.25rem', maxWidth: '700px', margin: '0 auto', color: 'var(--text-secondary)' }}>
            We operate on a flexible hybrid model with dedicated days for deep work.
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
            <div style={{ padding: '3rem' }}>
              
              {/* Primary Schedule Glass Panel */}
              <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', position: 'relative', overflow: 'hidden', marginBottom: '4rem' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, transparent, var(--gold), transparent)' }}></div>
                <IconBox icon={Calendar} color="var(--gold)" bg="rgba(212,175,55,0.1)" />
                <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Official Class Days</h2>
                <div style={{ fontSize: '2.5rem', fontWeight: 600, color: 'var(--gold)', letterSpacing: '0.05em', marginBottom: '1.5rem' }}>
                  FRIDAY &amp; SUNDAY
                </div>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto', fontSize: '1.1rem', lineHeight: 1.6 }}>
                  Our core curriculum is delivered on weekends to ensure maximum focus without disrupting your weekday schedule. Classes run through a combination of group and personalized sessions.
                </p>
              </div>

              {/* Available Formats Bento Grid */}
              <div>
                <h2 style={{ fontSize: '2rem', marginBottom: '2rem', color: 'var(--text-primary)', textAlign: 'center' }}>Available Formats</h2>
                <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                  
                  <div className="glass-panel hover-lift" style={cardStyle}>
                    <IconBox icon={Users} color="#00e5ff" bg="rgba(0,229,255,0.1)" />
                    <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.75rem', fontSize: '1.25rem' }}>Group Sessions</h3>
                    <p style={{ color: 'var(--text-secondary)', flex: 1, margin: 0, lineHeight: 1.6 }}>
                      Collaborative learning. Develop rhythm awareness, musical confidence, and the vital skill of playing perfectly in sync with others.
                    </p>
                  </div>

                  <div className="glass-panel hover-lift" style={cardStyle}>
                    <IconBox icon={Clock} color="var(--gold)" bg="rgba(212,175,55,0.1)" />
                    <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.75rem', fontSize: '1.25rem' }}>One-on-One</h3>
                    <p style={{ color: 'var(--text-secondary)', flex: 1, margin: 0, lineHeight: 1.6 }}>
                      A focused environment built entirely around you. Receive personalized instruction, hyper-focused technical feedback, and flexible progression.
                    </p>
                  </div>

                  <div className="glass-panel hover-lift" style={cardStyle}>
                    <IconBox icon={Monitor} color="#ff3366" bg="rgba(255,51,102,0.1)" />
                    <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.75rem', fontSize: '1.25rem' }}>Online Classes</h3>
                    <p style={{ color: 'var(--text-secondary)', flex: 1, margin: 0, lineHeight: 1.6 }}>
                      Learn from anywhere in the world. High-quality remote sessions tailored to ensure you never miss a beat regardless of your location.
                    </p>
                  </div>

                  <div className="glass-panel hover-lift" style={cardStyle}>
                    <IconBox icon={MapPin} color="#9d4edd" bg="rgba(157,78,221,0.1)" />
                    <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.75rem', fontSize: '1.25rem' }}>In-Person (Bengaluru)</h3>
                    <p style={{ color: 'var(--text-secondary)', flex: 1, margin: 0, lineHeight: 1.6 }}>
                      Step into the studio. Tactile, hands-on instruction available exclusively for students residing in Bengaluru.
                    </p>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center gsap-fade-up" style={{ marginTop: '2rem' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '1.1rem' }}>Ready to reserve your slot or check current batch timings?</p>
          <Link to="/contact" className="btn btn-solid" style={{ padding: '1rem 3rem', fontSize: '1.1rem' }}>
            CHECK AVAILABILITY
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Schedule;
