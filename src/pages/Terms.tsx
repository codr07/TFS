const Terms = () => {
  return (
    <div className="animate-fade-in" style={{ paddingTop: '15vh', paddingBottom: '10vh' }}>
      <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div className="text-center gsap-fade-up">
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', marginBottom: '1rem' }}>Terms &amp; Conditions</h1>
          <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)' }}>Comprehensive Guidelines &amp; Policies for The Fretboard Society</p>
        </div>

        <div className="animated-border-box gsap-fade-up" style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
          <div className="glass-panel" style={{ padding: '4rem', lineHeight: 1.8 }}>
            
            <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem', fontSize: '1.1rem' }}>
              Welcome to The Fretboard Society. By enrolling in our classes, interacting with our instructors, or utilizing any of our online and offline resources, you implicitly agree to comply with and be bound by the following comprehensive terms and conditions. Please read these carefully to ensure a harmonious and productive educational environment.
            </p>

            <h2 style={{ color: 'var(--gold)', marginBottom: '1.5rem', borderBottom: '1px solid rgba(212,175,55,0.2)', paddingBottom: '0.5rem' }}>1. Enrollment &amp; Registration</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>
              <strong>1.1 Acceptance:</strong> Enrollment is subject to availability and instructor assessment. The Fretboard Society reserves the right to deny enrollment to any individual at our discretion if we believe our curriculum is not a suitable fit. <br />
              <strong>1.2 Commitment:</strong> By registering, students commit to a structured learning path. While our modules (Beginner, Fingerstyle, Intermediate, Advanced) are highly adaptable, consistent attendance and practice are mandatory for progression. <br />
              <strong>1.3 Minors:</strong> Students under the age of 18 must have their enrollment forms signed and authorized by a legal guardian or parent, who will be responsible for all fee settlements.
            </p>

            <h2 style={{ color: 'var(--gold)', marginBottom: '1.5rem', borderBottom: '1px solid rgba(212,175,55,0.2)', paddingBottom: '0.5rem' }}>2. Financial Policies: Fees &amp; Payments</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>
              <strong>2.1 Advance Payment:</strong> All tuition fees, including Home Visit, Home Tuition, Online Tuition, and any chosen Add-Ons, must be paid in full in advance prior to the commencement of the monthly cycle. <br />
              <strong>2.2 Billing Cycle:</strong> A standard billing cycle constitutes four (4) consecutive weeks of instruction. In months containing five weeks, the fifth week may be utilized as an administrative break or billed separately as a pro-rated session, at the discretion of the instructor. <br />
              <strong>2.3 Non-Refundability:</strong> Fees are strictly non-refundable and non-transferable under any circumstances, including but not limited to student absence, change of mind, or relocation. <br />
              <strong>2.4 Late Fees:</strong> Payments delayed by more than 5 days past the due date will incur a 10% late fee penalty. Habitual late payments may result in the suspension of classes.
            </p>

            <h2 style={{ color: 'var(--gold)', marginBottom: '1.5rem', borderBottom: '1px solid rgba(212,175,55,0.2)', paddingBottom: '0.5rem' }}>3. Cancellations, Rescheduling &amp; Attendance</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>
              <strong>3.1 Student Cancellations:</strong> Students must provide a minimum of 24 hours written notice (via WhatsApp or Email) for any cancellation or request to reschedule. Cancellations made with less than 24 hours notice will be considered forfeit, and the session will be billed normally. <br />
              <strong>3.2 Instructor Cancellations:</strong> If an instructor cancels a session due to illness or emergency, a make-up class will be scheduled at a mutually convenient time, or a pro-rated credit will be applied to the following month. <br />
              <strong>3.3 Punctuality:</strong> Sessions begin exactly at the scheduled time. Tardiness by the student will not result in extended class time. If a student is more than 15 minutes late without prior notification, the session will be marked as a no-show.
            </p>

            <h2 style={{ color: 'var(--gold)', marginBottom: '1.5rem', borderBottom: '1px solid rgba(212,175,55,0.2)', paddingBottom: '0.5rem' }}>4. Equipment &amp; Venue Requirements</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>
              <strong>4.1 Instruments:</strong> Students are required to possess their own functioning instrument (Guitar, Standard Ukulele, or Dotara) for practice and sessions. The Fretboard Society does not provide rental instruments unless explicitly agreed upon in writing. <br />
              <strong>4.2 Online Requirements:</strong> For Online Tuition, students must ensure a stable, high-speed internet connection, a functional webcam, and clear audio output/input to facilitate effective learning. Technical difficulties on the student's end do not warrant a session refund or extension. <br />
              <strong>4.3 Home Visit Safety:</strong> For Home Visit and Group Batch venues, the environment must be safe, adequately lit, well-ventilated, and free from excessive noise or distractions. We reserve the right to refuse service in environments deemed unsafe or inappropriate.
            </p>

            <h2 style={{ color: 'var(--gold)', marginBottom: '1.5rem', borderBottom: '1px solid rgba(212,175,55,0.2)', paddingBottom: '0.5rem' }}>5. Intellectual Property &amp; Copyright</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>
              <strong>5.1 Proprietary Materials:</strong> All sheet music, tabs, curriculum PDFs, video tutorials, and study guides provided by The Fretboard Society remain the exclusive intellectual property of our institution. <br />
              <strong>5.2 Prohibition of Distribution:</strong> Students are strictly prohibited from copying, distributing, selling, or publicly sharing any provided educational materials without express written consent. Violation of this clause will result in immediate termination of enrollment and potential legal action.
            </p>

            <h2 style={{ color: 'var(--gold)', marginBottom: '1.5rem', borderBottom: '1px solid rgba(212,175,55,0.2)', paddingBottom: '0.5rem' }}>6. Code of Conduct</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>
              <strong>6.1 Professionalism:</strong> Mutual respect between the instructor and student is paramount. Any form of harassment, discrimination, or abusive language will result in immediate and permanent expulsion. <br />
              <strong>6.2 Substance Policy:</strong> Students must not attend sessions under the influence of alcohol or illicit substances. 
            </p>

            <h2 style={{ color: 'var(--gold)', marginBottom: '1.5rem', borderBottom: '1px solid rgba(212,175,55,0.2)', paddingBottom: '0.5rem' }}>7. Modifications &amp; Amendments</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>
              The Fretboard Society reserves the right to update, modify, or amend these Terms &amp; Conditions at any time. Changes will be communicated via email or posted directly to this page. Continued enrollment following any changes constitutes acceptance of the new terms.
            </p>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;
