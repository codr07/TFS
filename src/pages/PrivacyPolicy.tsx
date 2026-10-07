const PrivacyPolicy = () => {
  return (
    <div className="animate-fade-in" style={{ paddingTop: '15vh', paddingBottom: '10vh' }}>
      <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div className="text-center gsap-fade-up">
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', marginBottom: '1rem' }}>Privacy Policy</h1>
          <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)' }}>Secure, Transparent, and Comprehensive Data Handling</p>
        </div>

        <div className="animated-border-box gsap-fade-up" style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
          <div className="glass-panel" style={{ padding: '4rem', lineHeight: 1.8 }}>
            
            <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem', fontSize: '1.1rem' }}>
              At <strong>The Fretboard Society</strong>, we consider your privacy and data security to be of paramount importance. This fully customized and elaborative Privacy Policy outlines exactly how we collect, process, secure, and utilize your personal information when you interact with our website, book sessions, or enroll in our musical curriculum.
            </p>

            <h2 style={{ color: '#00e5ff', marginBottom: '1.5rem', borderBottom: '1px solid rgba(0, 229, 255, 0.2)', paddingBottom: '0.5rem' }}>1. Comprehensive Data Collection</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              We collect information through multiple touchpoints to ensure we can deliver a seamless educational experience. The types of data we collect include:
            </p>
            <ul style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', paddingLeft: '1.5rem' }}>
              <li style={{ marginBottom: '0.75rem' }}><strong>Personally Identifiable Information (PII):</strong> Full name, primary email address, mobile/WhatsApp phone numbers, and physical addresses (specifically required for Home Visit, Home Tuition, and Venue Batch formats).</li>
              <li style={{ marginBottom: '0.75rem' }}><strong>Academic &amp; Musical Profiling:</strong> Selected instrument (Guitar, Ukulele General, Ukulele Dotara), skill level, preferred learning formats, and specific add-on interests (Songwriting, Music Composing).</li>
              <li style={{ marginBottom: '0.75rem' }}><strong>Technical &amp; Usage Data:</strong> When you browse our website, we may automatically log IP addresses, browser types, device information, and interaction metrics to optimize our user interface and ensure zero-lag performance.</li>
              <li style={{ marginBottom: '0.75rem' }}><strong>Transaction Records:</strong> History of enrolled classes, applied discounts (Referrals, Brand Collabs, Venue Batches), and billing cycles. (Note: We do not store raw credit card numbers or sensitive payment portal data directly on our servers).</li>
            </ul>

            <h2 style={{ color: '#00e5ff', marginBottom: '1.5rem', borderBottom: '1px solid rgba(0, 229, 255, 0.2)', paddingBottom: '0.5rem' }}>2. Elaborative Data Utilization</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Your data is never collected frivolously. Every piece of information serves a specific operational purpose:
            </p>
            <ul style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', paddingLeft: '1.5rem' }}>
              <li style={{ marginBottom: '0.75rem' }}><strong>Service Delivery &amp; Scheduling:</strong> To assign instructors, manage calendar slots via our Supabase backend, and coordinate logistics for physical venue visits.</li>
              <li style={{ marginBottom: '0.75rem' }}><strong>Customized Curriculum Mapping:</strong> By understanding your instrument choice and tier, we dynamically adapt our teaching notes and provided tabs.</li>
              <li style={{ marginBottom: '0.75rem' }}><strong>Communication &amp; Support:</strong> To send urgent scheduling updates, payment reminders, curriculum PDFs, and respond to your direct queries.</li>
              <li style={{ marginBottom: '0.75rem' }}><strong>Discount &amp; Promotion Tracking:</strong> To accurately calculate your eligibility for our Referral Models and Brand Collaboration deductions.</li>
            </ul>

            <h2 style={{ color: '#00e5ff', marginBottom: '1.5rem', borderBottom: '1px solid rgba(0, 229, 255, 0.2)', paddingBottom: '0.5rem' }}>3. Advanced Security &amp; Data Protection</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>
              The Fretboard Society employs state-of-the-art security measures to prevent unauthorized access, alteration, disclosure, or destruction of your personal information. Our booking systems and databases (powered by Supabase) utilize encrypted connections (TLS/SSL) for data in transit and robust encryption for data at rest. Access to student databases is strictly limited to authorized administrative personnel and instructors on a need-to-know basis.
            </p>

            <h2 style={{ color: '#00e5ff', marginBottom: '1.5rem', borderBottom: '1px solid rgba(0, 229, 255, 0.2)', paddingBottom: '0.5rem' }}>4. Third-Party Sharing &amp; Collaborations</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>
              We operate under a strict <strong>Zero-Sale Policy</strong>. We will never sell, rent, or trade your personal information to third-party marketers or data brokers. Data is only shared under the following exceptional circumstances:
              <br /><br />
              &bull; <strong>Service Providers:</strong> We utilize secure third-party infrastructure (like Supabase for database management and hosting providers) which act purely as data processors bound by strict confidentiality agreements.<br />
              &bull; <strong>Brand Collaborations &amp; Venues:</strong> If you enroll via a Music Studio collaboration or a Brand Collab discount, we may share basic attendance data with the partner venue solely for logistical and discount-verification purposes.<br />
              &bull; <strong>Legal Compliance:</strong> We reserve the right to disclose information if strictly required by local law enforcement or judicial mandate.
            </p>

            <h2 style={{ color: '#00e5ff', marginBottom: '1.5rem', borderBottom: '1px solid rgba(0, 229, 255, 0.2)', paddingBottom: '0.5rem' }}>5. User Rights &amp; Control</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>
              You maintain total sovereignty over your personal data. You have the right to request a complete copy of the data we hold on you, request corrections to inaccurate scheduling or contact details, or invoke your "Right to be Forgotten" by requesting complete deletion of your records upon cessation of your enrollment (subject to basic tax and legal retention requirements).
            </p>
            
            <h2 style={{ color: '#00e5ff', marginBottom: '1.5rem', borderBottom: '1px solid rgba(0, 229, 255, 0.2)', paddingBottom: '0.5rem' }}>6. Contact Information for Privacy Concerns</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              If you have any questions, concerns, or requests regarding this Privacy Policy or our data handling practices, please do not hesitate to contact our administrative team directly:
            </p>
            <div style={{ background: 'rgba(0, 229, 255, 0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(0, 229, 255, 0.1)', display: 'inline-block' }}>
              <p style={{ margin: 0, color: 'var(--text-primary)' }}><strong>Email:</strong> codr.sankha.contact@gmail.com</p>
              <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-primary)' }}><strong>Phone:</strong> +91 9330689143</p>
              <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-primary)' }}><strong>Location:</strong> Bengaluru, India</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
