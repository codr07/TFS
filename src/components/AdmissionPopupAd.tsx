import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { loadCurriculumItems, loadAddOns, type CurriculumItem, type AddOn } from '../lib/tfsData';

export type AdItem = {
  id: string;
  type: 'curriculum' | 'addon';
  title: string;
  tagline: string;
  badge: string;
  instrument?: string;
  highlights: string[];
  pricingHint: string;
  curriculumParam?: string;
  addonParam?: string;
};

// Fallback curated advertisements in case offline/database loading
const DEFAULT_ADS: AdItem[] = [
  {
    id: 'ad-guitar-chords',
    type: 'curriculum',
    title: 'Guitar — Beginner Chords & Foundations',
    tagline: 'Master fretboard posture, seamless open chord transitions, and rhythm strumming.',
    badge: 'Popular Course',
    instrument: 'Guitar',
    highlights: ['One-to-one mentorship', 'Open & barre chords', 'Stage-ready rhythm timing'],
    pricingHint: 'Starts at ₹900/month (Online) or ₹1,300/month (Home Tuition)',
    curriculumParam: 'Guitar',
  },
  {
    id: 'ad-guitar-fingerstyle',
    type: 'curriculum',
    title: 'Guitar — Advanced Fingerstyle & Acoustic Picking',
    tagline: 'Play polyphonic melodies, Travis picking, percussion taps, and expressive solos.',
    badge: 'Signature Masterclass',
    instrument: 'Guitar',
    highlights: ['Thumb independence', 'Arpeggio fluidity', 'Dynamic musical expression'],
    pricingHint: 'From ₹900/month • Personalised Repertoire',
    curriculumParam: 'Guitar',
  },
  {
    id: 'ad-ukulele-standard',
    type: 'curriculum',
    title: 'Ukulele (Standard) — Melodic & Acoustic',
    tagline: 'Charming 4-string fingerpicking, vibrant chords, and vocal accompaniment.',
    badge: 'Fast-Track Track',
    instrument: 'Ukulele (Standard)',
    highlights: ['Quick-start chord mastery', 'Island & contemporary strums', 'Solo fingerstyle tabs'],
    pricingHint: 'Starts at ₹900/month • All ages welcome',
    curriculumParam: 'Ukulele (Standard)',
  },
  {
    id: 'ad-ukulele-dotara',
    type: 'curriculum',
    title: 'Ukulele (Dotara) — Folk & Folk-Fusion',
    tagline: 'Authentic Indian folk strums, open drone resonance, and rhythmic dotara finger-plucking.',
    badge: 'Exclusive Academy Specialty',
    instrument: 'Ukulele (Dotara)',
    highlights: ['Traditional folk strums', 'Expressive micro-tonal bends', 'Home Visit 1-on-1 session'],
    pricingHint: 'Special Home Visit plan: ₹1,500/month',
    curriculumParam: 'Ukulele (Dotara)',
  },
  {
    id: 'ad-addon-songwriting',
    type: 'addon',
    title: 'Add-on: Songwriting & Music Theory',
    tagline: 'Turn your melodies into full compositions with chord progression logic and lyric cadence.',
    badge: 'High-Impact Add-on',
    highlights: ['Circle of Fifths applied', 'Emotional chord substitutions', 'Song structuring walkthrough'],
    pricingHint: '+₹500/month added to your tuition',
    curriculumParam: 'Guitar',
    addonParam: 'Song Writing — ₹500/month',
  },
  {
    id: 'ad-addon-composing',
    type: 'addon',
    title: 'Add-on: Music Composing & Harmony',
    tagline: 'Arrangement, voice leading, and melodic composition for stage and solo performance.',
    badge: 'Composer Workshop',
    highlights: ['Modal harmonies & chord extensions', 'Voice leading secrets', 'Portfolio composition critique'],
    pricingHint: '+₹1,500/month premium mentorship',
    curriculumParam: 'Guitar',
    addonParam: 'Music Composing — ₹1,500/month',
  },
];

export const AdmissionPopupAd: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [adList, setAdList] = useState<AdItem[]>(DEFAULT_ADS);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Load live catalog of curriculums and add-ons from database
  useEffect(() => {
    let mounted = true;
    async function loadCatalog() {
      try {
        const [currs, addons] = await Promise.all([
          loadCurriculumItems(),
          loadAddOns(),
        ]);

        if (!mounted) return;

        const dynamicAds: AdItem[] = [];

        // Build advertisements for curriculums
        if (currs && currs.length > 0) {
          currs
            .filter((c: CurriculumItem) => c.active !== false)
            .forEach((c: CurriculumItem) => {
              const instLabel =
                c.instrument === 'ukulele_dotara'
                  ? 'Ukulele (Dotara)'
                  : c.instrument === 'ukulele_standard'
                  ? 'Ukulele (Standard)'
                  : 'Guitar';

              const highlightItems = [
                'Structured 1-on-1 pacing',
                'Hands-on practice routines',
                'Technique & repertoire mastery',
              ];

              dynamicAds.push({
                id: `ad-curr-${c.id}`,
                type: 'curriculum',
                title: `${instLabel} — ${c.title}`,
                tagline: c.description || 'Comprehensive 1-on-1 music coaching tailored to your learning goals.',
                badge: c.category ? `${c.category.toUpperCase()} TRACK` : 'ADMISSION OPEN',
                instrument: instLabel,
                highlights: highlightItems,
                pricingHint:
                  instLabel === 'Ukulele (Dotara)'
                    ? 'Home Visit: ₹1,500/month'
                    : 'Plans start at ₹900/month (Online) & ₹1,300/month (Home Tuition)',
                curriculumParam: instLabel,
              });
            });
        }

        // Build advertisements for add-ons
        if (addons && addons.length > 0) {
          addons
            .filter((a: AddOn) => a.active !== false)
            .forEach((a: AddOn) => {
              dynamicAds.push({
                id: `ad-addon-${a.id}`,
                type: 'addon',
                title: `Special Add-on: ${a.name}`,
                tagline: a.description || 'Level up your musical toolkit with structured elective modules.',
                badge: 'OPTIONAL ADD-ON',
                highlights: ['Seamlessly added to monthly tuition', '1-on-1 focused coaching', 'Original musical output'],
                pricingHint: `+₹${Number(a.amount).toLocaleString('en-IN')}/${a.billing_period || 'month'}`,
                curriculumParam: 'Guitar',
                addonParam: `${a.name} — ₹${Number(a.amount).toLocaleString('en-IN')}/month`,
              });
            });
        }

        if (dynamicAds.length > 0) {
          setAdList(dynamicAds);
        }
      } catch (err) {
        console.warn('Ad popup catalog load notice:', err);
      }
    }

    loadCatalog();
    return () => {
      mounted = false;
    };
  }, []);

  // Interval timer: trigger advertisement popup every 60 seconds (1 minute)
  useEffect(() => {
    // Check if on admission form or payment page; don't disrupt if user is already filling admission
    const path = location.pathname.toLowerCase();
    if (path.includes('/admissionform') || path.includes('/feepayment')) {
      setIsOpen(false);
      return;
    }

    // Set recurring 1 minute interval (60,000 ms)
    const interval = setInterval(() => {
      // Rotate to next advertisement (new advertisement every time)
      setCurrentIndex((prev) => (prev + 1) % (adList.length || 1));
      setIsOpen(true);
    }, 60000);

    return () => clearInterval(interval);
  }, [location.pathname, adList.length]);

  // Current active advertisement
  const currentAd = useMemo(() => {
    if (!adList || adList.length === 0) return DEFAULT_ADS[0];
    return adList[currentIndex % adList.length];
  }, [adList, currentIndex]);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleApplyNow = () => {
    setIsOpen(false);
    navigate('/admissionform', {
      state: {
        preselectedCurriculum: currentAd.curriculumParam || 'Guitar',
        preselectedAddon: currentAd.addonParam || '',
      },
    });
  };

  // Don't show if on admission form or payment page
  const currentPath = location.pathname.toLowerCase();
  if (currentPath.includes('/admissionform') || currentPath.includes('/feepayment')) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="tfs-modal-overlay"
          style={{
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            background: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(8px)',
          }}
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '520px',
              maxHeight: 'min(90vh, 90dvh, 720px)',
              display: 'flex',
              flexDirection: 'column',
              background: 'linear-gradient(145deg, #12161f 0%, #0a0d14 100%)',
              border: '1px solid rgba(212, 175, 55, 0.45)',
              borderRadius: '20px',
              boxShadow: '0 25px 80px rgba(0,0,0,0.85), 0 0 35px rgba(212, 175, 55, 0.2)',
              overflow: 'hidden',
              padding: '0',
            }}
          >
            {/* Top Glowing Accent Line */}
            <div
              style={{
                height: '4px',
                background: 'linear-gradient(90deg, #d4af37, #f7d070, #5dd37a, #d4af37)',
                width: '100%',
                flexShrink: 0,
              }}
            />

            {/* Exit Cross Button in Top-Right */}
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close Advertisement"
              style={{
                position: 'absolute',
                top: '14px',
                right: '14px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                zIndex: 10,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 107, 107, 0.25)';
                e.currentTarget.style.color = '#ff6b6b';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.color = '#fff';
              }}
            >
              <X size={18} />
            </button>

            {/* Scrollable Modal Content */}
            <div
              style={{
                flex: '1 1 auto',
                overflowY: 'auto',
                overflowX: 'hidden',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {/* Header Content */}
              <div style={{ padding: 'clamp(1.2rem, 3vw, 1.75rem) clamp(1.2rem, 3vw, 1.75rem) 1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', paddingRight: '2rem' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.25rem 0.65rem',
                      borderRadius: '20px',
                      background: currentAd.type === 'addon' ? 'rgba(93, 211, 122, 0.15)' : 'rgba(212, 175, 55, 0.15)',
                      border: currentAd.type === 'addon' ? '1px solid rgba(93, 211, 122, 0.4)' : '1px solid rgba(212, 175, 55, 0.4)',
                      color: currentAd.type === 'addon' ? '#5dd37a' : 'var(--gold)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    <Sparkles size={12} /> {currentAd.badge}
                  </span>

                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    Admission Cycle 2026
                  </span>
                </div>

                <h3
                  style={{
                    margin: '0 0 0.65rem',
                    color: '#fff',
                    fontSize: 'clamp(1.15rem, 3vw, 1.45rem)',
                    fontWeight: 800,
                    lineHeight: '1.25',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {currentAd.title}
                </h3>

                <p
                  style={{
                    margin: 0,
                    color: 'var(--text-secondary)',
                    fontSize: '0.86rem',
                    lineHeight: '1.45',
                  }}
                >
                  {currentAd.tagline}
                </p>
              </div>

              {/* Highlights Grid */}
              <div
                style={{
                  padding: '1rem clamp(1.2rem, 3vw, 1.75rem)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {currentAd.highlights.map((h, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CheckCircle2 size={15} style={{ color: '#5dd37a', flexShrink: 0 }} />
                      <span style={{ color: '#e0e6ed', fontSize: '0.84rem' }}>{h}</span>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    marginTop: '0.85rem',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    background: 'rgba(212, 175, 55, 0.08)',
                    border: '1px solid rgba(212, 175, 55, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Tuition Breakdown:
                  </span>
                  <b style={{ fontSize: '0.82rem', color: 'var(--gold)', fontWeight: 700 }}>
                    {currentAd.pricingHint}
                  </b>
                </div>
              </div>
            </div>

            {/* Footer with Dedicated Button to /admissionform */}
            <div
              style={{
                flexShrink: 0,
                padding: '1rem clamp(1.2rem, 3vw, 1.75rem) 1.25rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
                flexWrap: 'wrap',
                background: 'inherit',
              }}
            >
              <button
                type="button"
                onClick={handleClose}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  padding: '0.5rem 0',
                }}
              >
                Dismiss Ad
              </button>

              <button
                type="button"
                onClick={handleApplyNow}
                style={{
                  flex: '1 1 auto',
                  minWidth: '200px',
                  padding: '0.85rem 1.4rem',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #d4af37 0%, #b89320 100%)',
                  color: '#000',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  letterSpacing: '0.01em',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 8px 24px rgba(212, 175, 55, 0.35)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 10px 28px rgba(212, 175, 55, 0.45)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(212, 175, 55, 0.35)';
                }}
              >
                Apply for Admission <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AdmissionPopupAd;
