import { motion } from 'framer-motion';
import { BookOpen, Music, Guitar, PenTool, Hash, Move, Sparkles, Target } from 'lucide-react';

const Curriculum = () => {
  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100vh', paddingTop: '15vh', paddingBottom: '10vh', overflow: 'hidden' }}>
      
      <div className="container" style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '6rem', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header */}
        <div className="text-center gsap-fade-up">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="gsap-split-text" 
            style={{ fontSize: 'clamp(3rem, 6vw, 5rem)', marginBottom: '1.5rem', lineHeight: 1 }}
          >
            The TFS Curriculum.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{ fontSize: '1.25rem', maxWidth: '700px', margin: '0 auto', color: 'var(--text-secondary)' }}
          >
            Learning a guitar is not about memorising hundreds of shapes.
          </motion.p>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            style={{ fontSize: '1.5rem', color: 'var(--gold)', fontFamily: 'var(--font-heading)', marginTop: '1rem' }}
          >
            It's about understanding how those shapes become music.
          </motion.p>
        </div>

        {/* BENTO GRID */}
        <div className="gsap-fade-up bento-grid">
          
          {/* MUSIC THEORY (Hero Card - Spans 2 cols, 2 rows on desktop) */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="glass-panel col-span-full lg-col-span-2 lg-row-span-2"
            style={{ 
              padding: '3rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              background: 'linear-gradient(135deg, rgba(20,20,20,0.9) 0%, rgba(10,10,10,0.8) 100%)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '24px',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ position: 'absolute', top: '2rem', right: '2rem', opacity: 0.1 }}>
              <BookOpen size={120} />
            </div>
            <div style={{ background: 'rgba(212,175,55,0.1)', width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <BookOpen size={28} color="var(--gold)" />
            </div>
            <h3 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>MUSIC THEORY</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.6, maxWidth: '90%' }}>
              Build a practical understanding of rhythm, intervals, keys, harmony, chords, scales and progressions. The foundation of everything you will play.
            </p>
          </motion.div>

          {/* CHORDS (Spans 2 cols on desktop) */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="glass-panel col-span-full lg-col-span-2"
            style={{ 
              padding: '2.5rem',
              display: 'flex',
              flexDirection: 'column',
              background: 'linear-gradient(135deg, rgba(20,20,20,0.8) 0%, rgba(5,5,5,0.8) 100%)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '24px'
            }}
          >
             <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <Hash size={24} color="#00e5ff" />
                <h3 style={{ fontSize: '1.5rem', margin: 0 }}>CHORDS</h3>
             </div>
             <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
               Learn chord construction, shapes, transitions, voicings and how chords function within a song.
             </p>
          </motion.div>

          {/* SCALES (Spans 1 col) */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="glass-panel"
            style={{ 
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              background: 'rgba(15,15,15,0.6)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '24px'
            }}
          >
            <Move size={24} color="#ff3366" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>SCALES</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Understand scales beyond memorised patterns and connect them across the fretboard.
            </p>
          </motion.div>

          {/* FINGERSTYLE (Spans 1 col) */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="glass-panel"
            style={{ 
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              background: 'rgba(15,15,15,0.6)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '24px'
            }}
          >
            <Guitar size={24} color="#a855f7" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>FINGERSTYLE</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Develop thumb-and-finger independence, coordination, patterns and musical expression.
            </p>
          </motion.div>

          {/* SONGWRITING & NOTATION (Spans 4 cols on desktop) */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="glass-panel col-span-full lg-col-span-4"
            style={{ 
              padding: '3rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4rem',
              background: 'linear-gradient(90deg, rgba(15,15,15,0.8) 0%, rgba(5,5,5,0.9) 100%)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '24px',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ flex: 1, minWidth: '250px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <PenTool size={28} color="var(--gold)" />
                <h3 style={{ fontSize: '2rem', margin: 0 }}>SONGWRITING & NOTATION</h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.6 }}>
                Learn how musical ideas become complete songs — from initial ideas to chords, melodies, lyrics and structure. Develop the ability to write down musical ideas and organise compositions using appropriate notation.
              </p>
            </div>
            <div style={{ flexShrink: 0, opacity: 0.5 }}>
              <Music size={100} />
            </div>
          </motion.div>
        </div>

        {/* PRACTICE CYCLE SECTION */}
        <section className="gsap-fade-up" style={{ marginTop: '2rem' }}>
          <div className="glass-panel" style={{ 
            padding: '4rem 2rem', 
            borderRadius: '24px', 
            background: 'rgba(10,10,10,0.5)',
            border: '1px solid rgba(255,255,255,0.03)',
            textAlign: 'center'
          }}>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', marginBottom: '1.5rem' }}>Your Progress Starts With Practice.</h2>
            <div style={{ maxWidth: '800px', margin: '0 auto', fontSize: '1.125rem', color: 'var(--text-secondary)' }}>
              <p style={{ marginBottom: '1rem' }}>Learning an instrument doesn't happen in the lesson alone.</p>
              <p style={{ color: 'var(--gold)', fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', margin: '2rem 0' }}>The lesson gives you direction. Practice gives you progress.</p>
              
              {/* Neon Flowchart */}
              <div style={{ 
                margin: '3rem 0', 
                padding: 'var(--spacing-md)', 
                background: 'rgba(0,0,0,0.5)', 
                border: '1px solid rgba(212,175,55,0.2)', 
                borderRadius: '16px',
                boxShadow: 'inset 0 0 50px rgba(0,0,0,0.8)'
              }}>
                <p style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)', marginBottom: '1.5rem' }}>The Infinite Practice Cycle</p>
                <div className="practice-cycle-flow" style={{ display: 'flex', color: 'var(--gold)', fontWeight: 'bold', letterSpacing: '0.1em' }}>
                  <span>LEARN</span>
                  <span className="arrow-down-mobile" style={{ color: 'rgba(255,255,255,0.2)' }}>&rarr;</span>
                  <span>UNDERSTAND</span>
                  <span className="arrow-down-mobile" style={{ color: 'rgba(255,255,255,0.2)' }}>&rarr;</span>
                  <span>PRACTISE</span>
                  <span className="arrow-down-mobile" style={{ color: 'rgba(255,255,255,0.2)' }}>&rarr;</span>
                  <span>PLAY</span>
                  <span className="arrow-down-mobile" style={{ color: 'rgba(255,255,255,0.2)' }}>&rarr;</span>
                  <span>CREATE</span>
                </div>
              </div>
              
              <p style={{ fontStyle: 'italic', fontSize: '1.25rem', color: 'var(--text-primary)' }}>"Don't simply repeat an exercise. Understand why you're doing it. Then make it musical."</p>
            </div>
          </div>
        </section>
        
        {/* WHAT YOU NEED SECTION */}
        <section className="gsap-fade-up text-center" style={{ padding: '2rem 0 4rem 0' }}>
          <Sparkles size={32} color="var(--gold)" style={{ margin: '0 auto 1.5rem auto' }} />
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>What You Need</h2>
          <p style={{ maxWidth: '600px', margin: '0 auto 3rem auto', color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            You don't need expensive equipment or years of musical experience to begin. You need:
          </p>
          
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
            
            <div className="glass-panel hover-lift" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.2)' }}>
              <Guitar size={32} color="var(--gold)" style={{ marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>An Instrument</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>A playable acoustic guitar or ukulele (Standard/Dotara style).</p>
            </div>

            <div className="glass-panel hover-lift" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <BookOpen size={32} color="#00e5ff" style={{ marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Curiosity</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>An open mind ready to explore musical concepts deeply.</p>
            </div>

            <div className="glass-panel hover-lift" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <Move size={32} color="#ff3366" style={{ marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Consistency</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>A willingness to practise regularly over time.</p>
            </div>

            <div className="glass-panel hover-lift" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <Target size={32} color="#a855f7" style={{ marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Patience</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>Allowing your fingers and brain the time they need to adapt.</p>
            </div>

          </div>
          
          <p style={{ marginTop: '4rem', color: 'var(--gold)', fontStyle: 'italic', fontSize: '1.5rem' }}>Everything else can be learned.</p>
        </section>

      </div>
    </div>
  );
};

export default Curriculum;
