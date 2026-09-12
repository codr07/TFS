import { useEffect } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import GuitarBackground from './GuitarBackground';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SplitType from 'split-type';
import { AnimatePresence, motion } from 'framer-motion';

gsap.registerPlugin(ScrollTrigger);

const Layout = () => {
  const location = useLocation();
  const outlet = useOutlet();

  useEffect(() => {
    const wrapper = document.querySelector('.mac-window-wrapper') as HTMLElement;
    const content = document.querySelector('.mac-window-content') as HTMLElement;
    
    if (!wrapper || !content) return;

    const lenis = new Lenis({
      wrapper,
      content,
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      gsap.ticker.remove(lenis.raf);
    };
  }, []);

  // Scroll to top and initialize global animations on route change
  useEffect(() => {
    const wrapper = document.querySelector('.mac-window-wrapper') as HTMLElement;
    if (wrapper) wrapper.scrollTo(0, 0);
    
    // Slight delay to ensure DOM is painted and the Framer Motion exit animation finishes
    const timeout = setTimeout(() => {
      ScrollTrigger.refresh();
      
      const fadeUps = gsap.utils.toArray('.gsap-fade-up') as HTMLElement[];
      fadeUps.forEach((elem) => {
        gsap.set(elem, { y: 50, opacity: 0, autoAlpha: 0 });
        ScrollTrigger.create({
          trigger: elem,
          scroller: '.mac-window-wrapper', // specify the scroller since it's not the body!
          start: 'top 85%',
          animation: gsap.to(elem, {
            y: 0,
            opacity: 1,
            autoAlpha: 1,
            duration: 1.2,
            ease: 'power3.out',
          }),
          once: true
        });
      });

      const splitTexts = gsap.utils.toArray('.gsap-split-text') as HTMLElement[];
      splitTexts.forEach((elem) => {
        const split = new SplitType(elem, { types: 'chars,words' });
        gsap.set(split.chars, { y: 50, opacity: 0, rotateX: -90 });
        
        ScrollTrigger.create({
          trigger: elem,
          scroller: '.mac-window-wrapper', // specify the scroller!
          start: 'top 85%',
          animation: gsap.to(split.chars, {
            y: 0,
            opacity: 1,
            rotateX: 0,
            stagger: 0.02,
            duration: 0.8,
            ease: 'back.out(1.5)',
          }),
          once: true
        });
      });
    }, 500);
    
    return () => clearTimeout(timeout);
  }, [location.pathname]);

  return (
    <div className="mac-desktop">
      {/* The main liquid glass app window */}
      <div className="mac-window-wrapper">
        <div className="mac-window-content" style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
          <GuitarBackground />
          <AnimatePresence mode="wait">
            <motion.main 
              key={location.pathname}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              style={{ flex: 1, paddingBottom: '10vh', transformOrigin: 'center bottom' }}
            >
              {outlet}
            </motion.main>

          </AnimatePresence>
          <Footer />
        </div>
      </div>
      
      {/* Global Components */}
      
      {/* The bottom App Drawer */}
      <Navbar />
    </div>
  );
};

export default Layout;
