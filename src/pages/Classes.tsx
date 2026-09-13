import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Battery, Zap, Flame, CheckCircle2, PlayCircle, Target, BookOpen, Music, Code, ChevronLeft, GitMerge, Guitar } from 'lucide-react';

const curriculumData = [
  {
    id: 'foundation',
    title: 'Phase 1: Foundation',
    subtitle: 'Master the core mechanics.',
    icon: <Battery size={24} color="var(--gold)" />,
    color: 'var(--gold)',
    bg: 'rgba(212,175,55,0.05)',
    border: 'rgba(212,175,55,0.3)',
    modules: [
      { title: 'Technique & Posture', desc: 'Eliminate physical tension and master the biomechanics of holding the instrument.', icon: <Target size={18} color="var(--gold)" /> },
      { title: 'Essential Chords', desc: 'Master the open-position CAGED chords with crystal clear, buzz-free ringing.', icon: <CheckCircle2 size={18} color="var(--gold)" /> },
      { title: 'Rhythm Engine', desc: 'Develop an internal metronome using relentless alternate strumming patterns.', icon: <PlayCircle size={18} color="var(--gold)" /> }
    ]
  },
  {
    id: 'mastery',
    title: 'Phase 2: Mastery',
    subtitle: 'Map the entire neck visually.',
    icon: <Zap size={24} color="#00e5ff" />,
    color: '#00e5ff',
    bg: 'rgba(0,229,255,0.05)',
    border: 'rgba(0,229,255,0.3)',
    modules: [
      { title: 'Barre Chords', desc: 'Move the 5 open chord shapes across the entire neck using barre techniques.', icon: <CheckCircle2 size={18} color="#00e5ff" /> },
      { title: 'Scale Architecture', desc: 'Master all 5 positions of the Minor Pentatonic and Major scales seamlessly.', icon: <BookOpen size={18} color="#00e5ff" /> },
      { title: 'Interval Ear Training', desc: 'Recognize intervals instantly and learn songs by ear without tabs.', icon: <Music size={18} color="#00e5ff" /> },
      { title: 'Expressive Lead', desc: 'Bending, vibrato, hammer-ons, and slides to inject emotion into your playing.', icon: <PlayCircle size={18} color="#00e5ff" /> }
    ]
  },
  {
    id: 'autonomy',
    title: 'Phase 3: Autonomy',
    subtitle: 'Develop total harmonic control.',
    icon: <Flame size={24} color="#ff3366" />,
    color: '#ff3366',
    bg: 'rgba(255,51,102,0.05)',
    border: 'rgba(255,51,102,0.3)',
    modules: [
      { title: 'Modal Theory', desc: 'Deep dive into Dorian, Mixolydian, Lydian, and Phrygian modes.', icon: <Target size={18} color="#ff3366" /> },
      { title: '7th Chords & Extensions', desc: 'Construct lush Maj7, Min7, 9ths, and 13ths used in Jazz and Neo-Soul.', icon: <Code size={18} color="#ff3366" /> },
      { title: 'Reharmonization', desc: 'Tritone substitutions and borrowing chords from parallel minor keys.', icon: <Music size={18} color="#ff3366" /> },
      { title: 'Composition', desc: 'Analyze tension and release mechanisms to write your own emotionally driven music.', icon: <BookOpen size={18} color="#ff3366" /> }
    ]
  },
  {
    id: 'dotara',
    title: 'Dotara Ukulele',
    subtitle: 'Specialized 3-level pathway.',
    icon: <Music size={24} color="#a855f7" />,
    color: '#a855f7',
    bg: 'rgba(168,85,247,0.05)',
    border: 'rgba(168,85,247,0.3)',
    modules: [
      { title: 'Level 1: Single Tone', desc: 'Master fundamental single-string picking techniques and traditional rhythms.', icon: <Target size={18} color="#a855f7" /> },
      { title: 'Level 2: Build Up', desc: 'Develop speed, percussive dynamics, and complex rhythmic structures.', icon: <Zap size={18} color="#a855f7" /> },
      { title: 'Level 3: Advanced Dual Tone', desc: 'Simultaneous drone and melody playing to create the full, signature Dotara sound.', icon: <Flame size={18} color="#a855f7" /> }
    ]
  }
];

const Classes = () => {
  const [activeInstrument, setActiveInstrument] = useState<'guitar' | 'ukulele' | null>(null);
  const [activeSubcategory, setActiveSubcategory] = useState<'general' | 'dotara' | null>(null);
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const activePhase = activeNode ? curriculumData.find(p => p.id === activeNode) : null;

  // Determine what nodes to show based on current state
  let visibleNodes: typeof curriculumData = [];
  if (activeInstrument === 'guitar' || activeSubcategory === 'general') {
    visibleNodes = curriculumData.filter(p => ['foundation', 'mastery', 'autonomy'].includes(p.id));
  } else if (activeSubcategory === 'dotara') {
    visibleNodes = curriculumData.filter(p => p.id === 'dotara');
  }

  const handleBack = () => {
    if (activeNode) {
      setActiveNode(null);
    } else if (activeSubcategory) {
      setActiveSubcategory(null);
    } else if (activeInstrument) {
      setActiveInstrument(null);
    }
  };

  const getHeaderText = () => {
    if (activeNode) return '';
    if (!activeInstrument) return 'Select Your Instrument.';
    if (activeInstrument === 'ukulele' && !activeSubcategory) return 'Select Ukulele Style.';
    return 'Curriculum Map.';
  };

  const getHeaderSubtext = () => {
    if (activeNode) return '';
    if (!activeInstrument) return 'Choose the path you want to explore.';
    if (activeInstrument === 'ukulele' && !activeSubcategory) return 'We offer both Standard and traditional Dotara styles.';
    return 'Select a primary node to explore its detailed sub-modules.';
  };

  return (
    <div className="mobile-page-shell" style={{ position: 'relative', width: '100%', minHeight: '100vh', paddingTop: '15vh', paddingBottom: '10vh', overflow: 'hidden' }}>
      
      {/* Background Graphic */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.03, pointerEvents: 'none', zIndex: 0 }}>
        <GitMerge size={600} />
      </div>

      <div className="container" style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', minHeight: '70vh' }}>
        
        {/* Header */}
        <AnimatePresence mode="wait">
          {!activeNode && (
            <motion.div 
              key={getHeaderText()}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
              style={{ marginBottom: '4rem' }}
            >
              <h1 className="gsap-split-text" style={{ fontSize: 'clamp(3rem, 6vw, 5rem)', marginBottom: '1.5rem' }}>
                {getHeaderText()}
              </h1>
              <p style={{ fontSize: '1.25rem', maxWidth: '700px', margin: '0 auto', color: 'var(--text-secondary)' }}>
                {getHeaderSubtext()}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Area */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexDirection: 'column' }}>
          
          {/* Global Back Button */}
          <AnimatePresence>
            {(activeInstrument || activeNode) && (
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onClick={handleBack}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  alignSelf: 'flex-start',
                  marginBottom: '2rem',
                  fontSize: '1rem',
                  padding: 0,
                  width: '100%',
                  maxWidth: activeNode ? '1200px' : '500px',
                  margin: '0 auto 2rem auto'
                }}
                whileHover={{ color: 'var(--text-primary)', x: -5 }}
              >
                <ChevronLeft size={20} /> Back
              </motion.button>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            
            {/* STATE 1: INSTRUMENT SELECTION */}
            {!activeInstrument && (
              <motion.div 
                key="instrument-state"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', width: '100%', maxWidth: '800px', margin: '0 auto' }}
              >
                {/* Guitar Card */}
                <motion.div
                  whileHover={{ scale: 1.02, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveInstrument('guitar')}
                  className="glass-panel"
                  style={{
                    background: 'rgba(212,175,55,0.05)',
                    border: '1px solid rgba(212,175,55,0.3)',
                    padding: '3rem 2rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    gap: '1.5rem',
                    boxShadow: '0 0 30px rgba(212,175,55,0.05)',
                  }}
                >
                  <Guitar size={48} color="var(--gold)" />
                  <h3 style={{ color: 'var(--gold)', fontSize: '2rem', margin: 0 }}>Acoustic Guitar</h3>
                  <p style={{ color: 'var(--text-secondary)', margin: 0 }}>The flagship 3-phase curriculum.</p>
                </motion.div>

                {/* Ukulele Card */}
                <motion.div
                  whileHover={{ scale: 1.02, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveInstrument('ukulele')}
                  className="glass-panel"
                  style={{
                    background: 'rgba(0,229,255,0.05)',
                    border: '1px solid rgba(0,229,255,0.3)',
                    padding: '3rem 2rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    gap: '1.5rem',
                    boxShadow: '0 0 30px rgba(0,229,255,0.05)',
                  }}
                >
                  <Music size={48} color="#00e5ff" />
                  <h3 style={{ color: '#00e5ff', fontSize: '2rem', margin: 0 }}>Ukulele</h3>
                  <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Standard and Dotara styles.</p>
                </motion.div>
              </motion.div>
            )}

            {/* STATE 2: UKULELE SUBCATEGORY SELECTION */}
            {activeInstrument === 'ukulele' && !activeSubcategory && (
              <motion.div 
                key="ukulele-sub-state"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', width: '100%', maxWidth: '800px', margin: '0 auto' }}
              >
                <motion.div
                  whileHover={{ scale: 1.02, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveSubcategory('general')}
                  className="glass-panel"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    padding: '2rem',
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  <h3 style={{ color: 'var(--text-primary)', fontSize: '1.5rem', marginBottom: '1rem' }}>General Standard</h3>
                  <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Shares the comprehensive 3-phase curriculum with acoustic guitar.</p>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveSubcategory('dotara')}
                  className="glass-panel"
                  style={{
                    background: 'rgba(168,85,247,0.05)',
                    border: '1px solid rgba(168,85,247,0.3)',
                    padding: '2rem',
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  <h3 style={{ color: '#a855f7', fontSize: '1.5rem', marginBottom: '1rem' }}>Dotara Style</h3>
                  <p style={{ color: 'var(--text-secondary)', margin: 0 }}>A specialized 3-level pathway focusing on traditional techniques.</p>
                </motion.div>
              </motion.div>
            )}

            {/* STATE 3: NODE SELECTION (Mind Map Roots) */}
            {((activeInstrument === 'guitar' && !activeNode) || (activeSubcategory && !activeNode)) && (
              <motion.div 
                key="nodes-state"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', maxWidth: '500px', margin: '0 auto' }}
              >
                {visibleNodes.map((phase) => (
                  <motion.div
                    key={phase.id}
                    layoutId={`node-container-${phase.id}`}
                    whileHover={{ scale: 1.02, x: 10 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveNode(phase.id)}
                    style={{
                      background: phase.bg,
                      border: `1px solid ${phase.border}`,
                      borderRadius: '20px',
                      padding: '2rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1.5rem',
                      boxShadow: `0 0 30px ${phase.bg}`,
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <motion.div layoutId={`node-icon-${phase.id}`} style={{ background: 'rgba(0,0,0,0.5)', padding: '1rem', borderRadius: '50%', display: 'flex' }}>
                      {phase.icon}
                    </motion.div>
                    <div>
                      <motion.h3 layoutId={`node-title-${phase.id}`} style={{ color: phase.color, fontSize: '1.5rem', margin: '0 0 0.25rem 0' }}>
                        {phase.title}
                      </motion.h3>
                      <motion.p layoutId={`node-subtitle-${phase.id}`} style={{ color: 'var(--text-secondary)', margin: 0 }}>
                        {phase.subtitle}
                      </motion.p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* STATE 4: EXPANDED BRANCH STATE */}
            {activeNode && activePhase && (
              <motion.div 
                key="expanded-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'flex-start', width: '100%', maxWidth: '1200px', margin: '0 auto', gap: isMobile ? '2rem' : '4rem' }}
              >
                
                {/* Left Side: Active Parent Node */}
                <div style={{ flex: isMobile ? 'none' : '0 0 400px', width: isMobile ? '100%' : 'auto', position: 'relative' }}>
                  <motion.div
                    layoutId={`node-container-${activePhase.id}`}
                    style={{
                      background: activePhase.bg,
                      border: `1px solid ${activePhase.border}`,
                      borderRadius: '24px',
                      padding: '3rem 2rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1.5rem',
                      boxShadow: `0 0 50px ${activePhase.bg}`,
                      backdropFilter: 'blur(20px)',
                      position: 'relative',
                      zIndex: 2
                    }}
                  >
                    <motion.div layoutId={`node-icon-${activePhase.id}`} style={{ background: 'rgba(0,0,0,0.5)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {activePhase.icon}
                    </motion.div>
                    <div>
                      <motion.h3 layoutId={`node-title-${activePhase.id}`} style={{ color: activePhase.color, fontSize: '2.5rem', margin: '0 0 1rem 0', lineHeight: 1.1 }}>
                        {activePhase.title}
                      </motion.h3>
                      <motion.p layoutId={`node-subtitle-${activePhase.id}`} style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '1.1rem', lineHeight: 1.6 }}>
                        {activePhase.subtitle}
                      </motion.p>
                    </div>
                  </motion.div>
                </div>

                {/* Right Side: Child Branches (The Mind Map lines) */}
                <div style={{ flex: 1, width: '100%', position: 'relative', paddingLeft: isMobile ? '1rem' : '4rem', marginLeft: isMobile ? '1rem' : '0', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  
                  {/* The vertical trunk line */}
                  <motion.div 
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: isMobile ? '-2rem' : '50px',
                      bottom: '50px',
                      width: '2px',
                      background: `linear-gradient(to bottom, ${activePhase.color}, transparent)`,
                      transformOrigin: 'top'
                    }}
                  />
                  
                  {/* The child nodes */}
                  {activePhase.modules.map((mod, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.3 + (idx * 0.1) }}
                      style={{ position: 'relative' }}
                    >
                      {/* Horizontal branch line */}
                      <motion.div 
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.4, delay: 0.2 + (idx * 0.1) }}
                        style={{
                          position: 'absolute',
                          left: isMobile ? '-1rem' : '-4rem',
                          top: '2.5rem',
                          width: isMobile ? '1rem' : '4rem',
                          height: '2px',
                          background: `linear-gradient(to right, ${activePhase.color}, transparent)`,
                          transformOrigin: 'left',
                          opacity: 0.5
                        }}
                      />
                      
                      {/* Node Card */}
                      <div className="glass-panel hover-lift" style={{ 
                        padding: '2rem', 
                        borderRadius: '16px', 
                        display: 'flex', 
                        gap: '1.5rem',
                        border: '1px solid rgba(255,255,255,0.03)',
                        background: 'linear-gradient(90deg, rgba(20,20,20,0.8) 0%, rgba(10,10,10,0.8) 100%)'
                      }}>
                        <div style={{ 
                          background: activePhase.bg, 
                          border: `1px solid ${activePhase.border}`,
                          width: '48px', 
                          height: '48px', 
                          borderRadius: '12px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {mod.icon}
                        </div>
                        <div>
                          <h4 style={{ color: 'var(--text-primary)', fontSize: '1.25rem', marginBottom: '0.5rem' }}>{mod.title}</h4>
                          <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5, fontSize: '0.95rem' }}>{mod.desc}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                </div>

              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
};

export default Classes;
