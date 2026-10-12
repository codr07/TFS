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
import TfsControl from './pages/TfsControl';
import Terms from './pages/Terms';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import AdmissionForm from './pages/AdmissionForm';
import FeePayment from './pages/FeePayment';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import SeoManager from './components/SeoManager';

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
      <SeoManager />
      <AnimatePresence>
        {loading && <Preloader key="preloader" />}
      </AnimatePresence>
      
      <AuthProvider>
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
            <Route path="admissionform" element={<AdmissionForm />} />
            <Route path="feepayment" element={<FeePayment />} />
            <Route path="login" element={<Login />} />
            <Route path="tfs-students/login" element={<Login expectedRole="student" redirectPath="/tfs-students" />} />
            <Route path="tfscontrol/login" element={<Login expectedRole="admin" redirectPath="/tfscontrol" />} />
            
            {/* Admin Route */}
            <Route path="tfscontrol" element={<TfsControl />} />

            {/* Protected Student Route */}
            <Route path="tfs-students" element={
              <ProtectedRoute allowedRoles={['student']} loginPath="/tfs-students/login">
                <StudentDashboard />
              </ProtectedRoute>
            } />

            <Route path="terms" element={<Terms />} />
            <Route path="privacypolicy" element={<PrivacyPolicy />} />
          </Route>
        </Routes>
      </AuthProvider>
    </>
  );
}

export default App;
