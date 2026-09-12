import { Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import Layout from './components/Layout';
import Preloader from './components/Preloader';
import Home from './pages/Home';
import About from './pages/About';
import Classes from './pages/Classes';
import Curriculum from './pages/Curriculum';
import Schedule from './pages/Schedule';
import Fees from './pages/Fees';
import Faq from './pages/Faq';
import Contact from './pages/Contact';

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // The preloader animation takes ~2.5s. We wait 2.8s to start fading out.
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <AnimatePresence>
        {loading && <Preloader key="preloader" />}
      </AnimatePresence>
      
      {!loading && (
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="about" element={<About />} />
            <Route path="classes" element={<Classes />} />
            <Route path="curriculum" element={<Curriculum />} />
            <Route path="schedule" element={<Schedule />} />
            <Route path="fees" element={<Fees />} />
            <Route path="faq" element={<Faq />} />
            <Route path="contact" element={<Contact />} />
          </Route>
        </Routes>
      )}
    </>
  );
}

export default App;
