import { HelpCircle } from 'lucide-react';

const Faq = () => {
  const faqs = [
    {
      q: "Do I need previous guitar experience?",
      a: "No. TFS accepts complete beginners as well as intermediate and advanced players."
    },
    {
      q: "Do you teach children?",
      a: "Classes can be discussed based on the student's age, interest and learning readiness."
    },
    {
      q: "Do you teach acoustic guitar?",
      a: "Yes. The TFS curriculum is centred around acoustic guitar and includes chords, scales, theory, fingerstyle, finger-picking and songwriting."
    },
    {
      q: "Do you teach Ukulele?",
      a: "Yes. We offer training for both general standard ukulele and Dotara style ukulele."
    },
    {
      q: "Are online classes available?",
      a: "Yes. Online and in-person classes are available."
    },
    {
      q: "Are in-person classes available outside Bengaluru?",
      a: "Currently, in-person classes are intended for students based in Bengaluru."
    },
    {
      q: "Can I take one-on-one lessons?",
      a: "Yes. One-on-one sessions are available in home-visit, tuition and online formats."
    },
    {
      q: "Can complete beginners join?",
      a: "Absolutely. We specialize in building strong foundations."
    },
    {
      q: "Do I need to know music theory?",
      a: "No. Music theory is taught progressively as part of the curriculum."
    },
    {
      q: "Can I learn songs that I like?",
      a: "Yes. Song learning is incorporated into the process while using them to develop practical musical skills."
    },
    {
      q: "How do I enrol?",
      a: "Contact TFS through WhatsApp, phone or email to enquire about available sessions."
    }
  ];

  return (
    <div className="animate-fade-in" style={{ paddingTop: '15vh', paddingBottom: '10vh' }}>
      <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
        
        {/* Header */}
        <div className="text-center gsap-fade-up">
          <h1 className="gsap-split-text" style={{ fontSize: 'clamp(3rem, 6vw, 5rem)', marginBottom: '1.5rem' }}>
            Frequently Asked.
          </h1>
          <p style={{ fontSize: '1.25rem', maxWidth: '700px', margin: '0 auto', color: 'var(--text-secondary)' }}>
            Everything you need to know about learning at The Fret Space.
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
              
              {/* FAQ Bento Grid */}
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                {faqs.map((faq, index) => (
                  <div key={index} className="glass-panel hover-lift" style={{ padding: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                    <div style={{ padding: '0.75rem', background: 'rgba(212,175,55,0.1)', borderRadius: '12px', flexShrink: 0 }}>
                      <HelpCircle size={24} color="var(--gold)" />
                    </div>
                    <div>
                      <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.75rem', fontSize: '1.25rem', lineHeight: 1.4 }}>
                        {faq.q}
                      </h3>
                      <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                        {faq.a}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Faq;
