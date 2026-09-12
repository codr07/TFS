import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SplitType from 'split-type';

gsap.registerPlugin(ScrollTrigger);

const Home = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroTextRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!containerRef.current || !heroTextRef.current) return;

    // Split text for hero
    const splitText = new SplitType(heroTextRef.current, { types: 'chars,words' });

    const ctx = gsap.context(() => {

      // Hero text animation
      gsap.from(splitText.chars, {
        y: 100,
        opacity: 0,
        rotateX: -90,
        stagger: 0.02,
        duration: 1.2,
        ease: 'back.out(1.5)',
        delay: 0.2
      });

      const scrollerElement = document.querySelector('.mac-window-wrapper') || window;
      // SVG Scroll Path Animation using Clip-Path (Bulletproof for Safari/Chrome with non-scaling-stroke)
      // String 1 (Main): Normal pace, ends perfectly at logo
      gsap.fromTo('#rect-1',
        { attr: { height: 0 } },
        { attr: { height: 100 }, ease: 'none', scrollTrigger: { trigger: containerRef.current, scroller: scrollerElement, start: 'top top', end: 'bottom+=400 bottom', scrub: 1 } }
      );

      // String 2 (Fast): Draws ahead of the others, finishes earlier
      gsap.fromTo('#rect-2',
        { attr: { height: 0 } },
        { attr: { height: 100 }, ease: 'none', scrollTrigger: { trigger: containerRef.current, scroller: scrollerElement, start: 'top top', end: 'bottom+=100 bottom', scrub: 0.5 } }
      );

      // String 3 (Slow & Late): Starts late, but moves fluidly to catch up at the very end
      gsap.fromTo('#rect-3',
        { attr: { height: 0 } },
        { attr: { height: 100 }, ease: 'none', scrollTrigger: { trigger: containerRef.current, scroller: scrollerElement, start: 'top+=400 top', end: 'bottom+=400 bottom', scrub: 1.5 } }
      );

      // Cool Parallax & Rotation for Bento Boxes
      const coolPanels = gsap.utils.toArray('.cool-scroll') as HTMLElement[];
      coolPanels.forEach((panel) => {
        const speed = parseFloat(panel.getAttribute('data-speed') || '1');

        // Complex entry animation
        gsap.from(panel, {
          y: 80 * speed,
          opacity: 0,
          scale: 0.95,
          duration: 1.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: panel,
            scroller: scrollerElement,
            start: 'top 85%',
          }
        });

        // Parallax effect during scroll
        gsap.to(panel, {
          y: -50 * speed,
          ease: 'none',
          scrollTrigger: {
            trigger: panel,
            scroller: scrollerElement,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true
          }
        });
      });

    }, containerRef.current);

    return () => {
      splitText.revert();
      ctx.revert();
    };
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>

      {/* Background SVG String (Weaving Layer: z-index 50 to draw over Footer) */}
      <svg
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 'calc(100% + 400px)', zIndex: 50, pointerEvents: 'none' }}
        viewBox="0 0 100 100" preserveAspectRatio="none"
      >
        <defs>
          <clipPath id="clip-1"><rect id="rect-1" x="0" y="0" width="100" height="0" /></clipPath>
          <clipPath id="clip-2"><rect id="rect-2" x="0" y="0" width="100" height="0" /></clipPath>
          <clipPath id="clip-3"><rect id="rect-3" x="0" y="0" width="100" height="0" /></clipPath>
        </defs>

        {/* String 1 (Main path - Ends at TFS Logo at x=10) */}
        <path
          d="M 30 0 C 80 15, 90 30, 45 45 C 10 60, 5 70, 35 85 C 65 95, 30 96, 10 100"
          stroke="rgba(212, 175, 55, 0.9)"
          strokeWidth="2"
          fill="none"
          vectorEffect="non-scaling-stroke"
          clipPath="url(#clip-1)"
        />
        {/* String 2 (Ends at Left Corner x=0) */}
        <path
          d="M 70 0 C 20 20, 10 35, 80 50 C 95 65, 90 80, 40 90 C 10 95, 5 97, 0 100"
          stroke="rgba(212, 175, 55, 0.4)"
          strokeWidth="1.5"
          fill="none"
          vectorEffect="non-scaling-stroke"
          clipPath="url(#clip-2)"
        />
        {/* String 3 (Ends at Right Corner x=100) */}
        <path
          d="M 50 0 C 10 25, 20 45, 70 55 C 90 65, 85 85, 50 92 C 20 96, 80 98, 100 100"
          stroke="rgba(212, 175, 55, 0.3)"
          strokeWidth="1"
          fill="none"
          vectorEffect="non-scaling-stroke"
          clipPath="url(#clip-3)"
        />
      </svg>

      {/* Hero Section (Under SVG: z-index 5) */}
      <section className="section" style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', zIndex: 5 }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: 'url(/images/Hero.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: -2,
        }} />
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(180deg, rgba(212,175,55,0.15) 0%, var(--bg-desktop) 100%)',
          zIndex: -1,
        }} />

        <div className="container text-center hero-content" style={{ zIndex: 1, marginTop: 'clamp(-10vh, -20vw, -40vh)' }}>
          <div className="glass-panel" style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img
              src="/images/logo_t.png"
              alt="TFS Logo"
              className="gsap-fade-up"
              style={{ width: '120px', height: 'auto', marginBottom: '2rem' }}
            />
            <p style={{ letterSpacing: '0.2em', fontSize: '0.875rem', marginBottom: '2rem', color: 'var(--text-secondary)' }}>THE FRETBOARD SOCIETY</p>
            <h1 ref={heroTextRef} style={{ marginBottom: '2rem' }}>Feel the Strings.<br />Find Yourself.</h1>
            <p style={{ fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto 3rem', color: 'var(--text-secondary)' }}>
              From your first chord to confident playing — develop your technique, musical understanding and individual voice on the guitar.
            </p>
            <Link to="/about" className="btn btn-solid">
              Start Your Journey
            </Link>
          </div>
        </div>
      </section>

      {/* Philosophy Section (Over SVG: z-index 20) */}
      <section className="section" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', position: 'relative', zIndex: 20 }}>
        <div className="container">
          <div className="glass-panel fade-up" style={{ textAlign: 'center' }}>
            <h2 className="gsap-split-text" style={{ marginBottom: '3rem' }}>More Than Learning Guitar.</h2>
            <div style={{ fontSize: '1.5rem', lineHeight: 1.8, maxWidth: '800px', margin: '0 auto' }}>
              <p>At TFS, guitar is not treated simply as an instrument to be played.</p>
              <p style={{ color: 'var(--gold)', fontSize: 'clamp(2rem, 4vw, 4rem)', fontFamily: 'var(--font-heading)', margin: '4rem 0', fontStyle: 'italic', fontWeight: 400 }}>
                It is a language.
              </p>
              <p>You learn to understand the fretboard, hear what you play, understand why it works, and gradually develop the ability to create music of your own.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Box: What You Will Learn */}
      <section className="section" style={{ minHeight: '120vh', display: 'flex', alignItems: 'center' }}>
        <div className="container">
          <h2 className="text-center gsap-split-text" style={{ marginBottom: '5rem' }}>What You Will Learn</h2>

          <div className="bento-grid-3" style={{ maxWidth: '1000px', margin: '0 auto', position: 'relative' }}>

            {/* Rectangle 1 */}
            <div className="glass-panel cool-scroll md-col-span-2" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', zIndex: 5 }} data-speed="1.05">
              <h3 style={{ marginBottom: '0.75rem', color: 'var(--text-primary)', fontSize: '2rem' }}>Chords & Scales</h3>
              <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)' }}>Understand chord shapes, transitions and their musical relationships. Build your knowledge of the fretboard and develop melodic understanding.</p>
            </div>

            {/* Square 1 */}
            <div className="glass-panel cool-scroll" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center', aspectRatio: '1/1', zIndex: 5 }} data-speed="0.95">
              <h3 style={{ marginBottom: '0.75rem', color: 'var(--gold)', fontSize: '1.5rem' }}>Fingerstyle</h3>
              <p style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Develop precision and coordination with intricate picking patterns.</p>
            </div>

            {/* Square 2 */}
            <div className="glass-panel cool-scroll" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center', aspectRatio: '1/1', zIndex: 20 }} data-speed="1.1">
              <h3 style={{ marginBottom: '0.75rem', color: 'var(--gold)', fontSize: '1.5rem' }}>Music Theory</h3>
              <p style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Learn the concepts behind chords, harmony and musical structure.</p>
            </div>

            {/* Rectangle 2 */}
            <div className="glass-panel cool-scroll md-col-span-2" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', zIndex: 20 }} data-speed="1.0">
              <h3 style={{ marginBottom: '0.75rem', color: 'var(--text-primary)', fontSize: '2rem' }}>Songwriting & Composition</h3>
              <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)' }}>Turn musical ideas into structured songs and original compositions, understanding how to construct a piece from scratch.</p>
            </div>

          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="section" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
        <div className="container text-center">
          <div className="glass-panel fade-up" style={{ border: '1px solid var(--gold)' }}>
            <h2 className="gsap-split-text" style={{ marginBottom: '2rem' }}>Your Guitar Is Waiting.</h2>
            <p style={{ fontSize: '1.25rem', marginBottom: '3rem' }}>You don't need to know everything before you begin. You just need to begin.</p>
            <Link to="/contact" className="btn btn-solid" style={{ fontSize: '1.125rem', padding: '1.25rem 3rem' }}>Join The Society</Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
