import { useRef, useState } from 'react';
import { Lightbulb, Target, Play, PenTool, BookOpen, User, Compass, Star } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const About = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState('story');

  const renderContent = () => {
    switch (activeTab) {
      case 'story':
        return (
          <motion.div key="story" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <h2 style={{ color: 'var(--gold)', marginBottom: '1rem', fontSize: '2.5rem' }}>The Story</h2>
            <p style={{ fontSize: '1.125rem', lineHeight: 1.6, marginBottom: '1rem' }}>
              The Fretboard Society was born out of frustration with traditional guitar education.
              Too many students were learning how to play songs, but almost no one was learning how to play the <i style={{ color: 'var(--gold)' }}>guitar</i>.
            </p>
            <p style={{ fontSize: '1.125rem', lineHeight: 1.6 }}>
              We realized that if you teach a student a song, they can play for a day.
              But if you teach them how the fretboard actually works, they can play for a lifetime.
              TFS is built to bridge the gap between mechanical technique and deep musical theory.
            </p>
          </motion.div>
        );
      case 'method':
        return (
          <motion.div key="method" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <h2 style={{ color: 'var(--gold)', marginBottom: '1rem', fontSize: '2.5rem' }}>The Method</h2>
            <p style={{ fontSize: '1.125rem', lineHeight: 1.6, marginBottom: '1rem' }}>
              We do not use cookie-cutter syllabuses. Our curriculum is highly dynamic, heavily relying on the <b>CAGED system</b>, <b>interval mapping</b>, and <b>rhythmic subdivision</b>.
            </p>
            <p style={{ fontSize: '1.125rem', lineHeight: 1.6 }}>
              Every student learns to completely map the neck, freeing them from the constraints of tabs and chord charts. We emphasize ear training alongside physical muscle memory to create truly self-sufficient musicians.
            </p>
          </motion.div>
        );
      case 'instructor':
        return (
          <motion.div key="instructor" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'flex-start' }}>
              <div className="morphing-pfp" style={{ width: '130px', height: '130px', background: 'linear-gradient(135deg, var(--gold) 0%, #a67c00 100%)', flexShrink: 0, overflow: 'hidden' }}>
                <img src="/public/images/pfp.png" alt="Sankha Saha" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div>
                <h2 style={{ color: 'var(--gold)', marginBottom: '0.25rem', fontSize: '2.5rem' }}>Sankha Saha</h2>
                <h3 style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 400 }}>Founder & Lead Instructor</h3>
                <p style={{ fontSize: '1.125rem', lineHeight: 1.6 }}>
                  With over <strong>17+ years of playing, performing, and teaching experience</strong>, Sankha is dedicated to completely demystifying the guitar.
                  The goal has always been the same: to create self-sufficient, highly creative musicians rather than rote mimics.
                </p>
              </div>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', minHeight: '100vh', paddingTop: '15vh', paddingBottom: '10vh' }}>
      <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>

        {/* Main Intro Panel (Macbook Finder UI) */}
        <div className="animated-border-box gsap-fade-up">
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="window-controls" style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="window-dot dot-red"></div>
              <div className="window-dot dot-yellow"></div>
              <div className="window-dot dot-green"></div>
            </div>

            <div style={{ display: 'flex', flex: 1, minHeight: '450px' }}>
              {/* Sidebar */}
              <div className="mac-sidebar">
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.1em', marginBottom: '0.5rem', paddingLeft: '1rem', marginTop: '1rem' }}>
                  Favorites
                </div>
                <div className={`mac-sidebar-item ${activeTab === 'story' ? 'active' : ''}`} onClick={() => setActiveTab('story')}>
                  <BookOpen size={18} /> The Story
                </div>
                <div className={`mac-sidebar-item ${activeTab === 'method' ? 'active' : ''}`} onClick={() => setActiveTab('method')}>
                  <Compass size={18} /> The Method
                </div>
                <div className={`mac-sidebar-item ${activeTab === 'instructor' ? 'active' : ''}`} onClick={() => setActiveTab('instructor')}>
                  <User size={18} /> The Instructor
                </div>
              </div>

              {/* Content Area */}
              <div style={{ flex: 1, padding: '4rem', position: 'relative' }}>
                <AnimatePresence mode="wait">
                  {renderContent()}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Philosophy Bento Grid (4 Squares) */}
        <div className="gsap-fade-up">
          <h2 className="gsap-split-text" style={{ fontSize: '2.5rem', marginBottom: '2rem', paddingLeft: '1rem' }}>Our Philosophy</h2>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-sm)' }}>
            <div className="glass-panel hover-lift" style={{ padding: '2rem', aspectRatio: '1/1', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Lightbulb size={40} color="var(--gold)" />
              <div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>1. Understand</h3>
                <p style={{ margin: 0, fontSize: '0.95rem' }}>Learn the core concepts and theoretical foundations behind what you play.</p>
              </div>
            </div>
            <div className="glass-panel hover-lift" style={{ padding: '2rem', aspectRatio: '1/1', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Target size={40} color="var(--gold)" />
              <div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>2. Practise</h3>
                <p style={{ margin: 0, fontSize: '0.95rem' }}>Build flawless technique through consistent, structured, and purposeful practice.</p>
              </div>
            </div>
            <div className="glass-panel hover-lift" style={{ padding: '2rem', aspectRatio: '1/1', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Play size={40} color="var(--gold)" />
              <div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>3. Play</h3>
                <p style={{ margin: 0, fontSize: '0.95rem' }}>Apply what you learn dynamically through songs and musical exercises.</p>
              </div>
            </div>
            <div className="glass-panel hover-lift" style={{ padding: '2rem', aspectRatio: '1/1', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <PenTool size={40} color="var(--gold)" />
              <div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>4. Create</h3>
                <p style={{ margin: 0, fontSize: '0.95rem' }}>Use your acquired knowledge to write, arrange, improvise, and create original music.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Why TFS Bento Grid (2 Rectangles) */}
        <div className="gsap-fade-up" style={{ marginTop: '2rem' }}>
          <h2 className="gsap-split-text" style={{ fontSize: '2.5rem', marginBottom: '2rem', paddingLeft: '1rem' }}>Why TFS?</h2>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--spacing-sm)' }}>

            <div className="animated-border-box hover-lift">
              <div className="glass-panel" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', color: 'var(--gold)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Star size={20} /> Structured Learning
                  </h3>
                  <p style={{ margin: 0 }}>A progressive, curriculum-driven approach that develops skills step by step, ensuring no fundamental gaps in your playing.</p>
                </div>
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', width: '100%' }}></div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', color: 'var(--gold)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <User size={20} /> Individual Attention
                  </h3>
                  <p style={{ margin: 0 }}>Lessons are strictly adapted according to your current ability, physical mechanics, and personal musical goals.</p>
                </div>
              </div>
            </div>

            <div className="animated-border-box hover-lift">
              <div className="glass-panel" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', color: 'var(--gold)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Compass size={20} /> Practical + Theoretical
                  </h3>
                  <p style={{ margin: 0 }}>Learn to physically play the instrument while deeply understanding the harmony and musical structure behind it.</p>
                </div>
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', width: '100%' }}></div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', color: 'var(--gold)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <PenTool size={20} /> Creative Development
                  </h3>
                  <p style={{ margin: 0 }}>Move beyond rote reproduction and mimicry, towards fluid improvisation, arrangement, and original songwriting.</p>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default About;
