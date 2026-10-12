import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface PageMeta {
  title: string;
  description: string;
  keywords?: string;
  shareImage?: string;
}

const SITE_NAME = 'The Fretboard Society';
const BASE_URL = 'https://thefretboardsociety.netlify.app';
const DEFAULT_SHARE_IMAGE = `${BASE_URL}/images/share-image.png`;

const routeMetaMap: Record<string, PageMeta> = {
  '/': {
    title: 'The Fretboard Society | Acoustic Guitar & Ukulele Mastery',
    description: 'Learn acoustic guitar, fingerstyle, standard ukulele, and Dotara ukulele with structured, theory-driven, zero-lag lessons at The Fretboard Society.',
    keywords: 'guitar classes, acoustic guitar, fingerstyle guitar, ukulele classes, dotara ukulele, music lessons',
    shareImage: DEFAULT_SHARE_IMAGE,
  },
  '/about': {
    title: 'About TFS | The Fretboard Society',
    description: 'Discover the story, philosophy, and pedagogy of The Fretboard Society. Bridging mechanical technique and deep musical theory.',
    keywords: 'about fretboard society, guitar instructor, guitar theory, music philosophy',
    shareImage: `${BASE_URL}/images/logo.png`,
  },
  '/classes': {
    title: 'Our Classes | Acoustic Guitar & Ukulele Modules | TFS',
    description: 'Explore tailored class pathways: Beginner Chords, Fingerstyle, Intermediate, Advanced extensions, and Dotara Ukulele modules.',
    keywords: 'guitar modules, fingerstyle classes, beginner chords, advanced guitar lessons, dotara ukulele',
    shareImage: DEFAULT_SHARE_IMAGE,
  },
  '/curriculum': {
    title: 'Comprehensive Curriculum | The Fretboard Society',
    description: 'Review the modular learning map for Acoustic Guitar, Standard Ukulele, and Dotara Ukulele from foundational chords to masterclass fingerstyle.',
    keywords: 'guitar curriculum, ukulele learning path, fretboard theory, chord shapes, tabs',
    shareImage: DEFAULT_SHARE_IMAGE,
  },
  '/schedule': {
    title: 'Class Schedule & Slot Booking | The Fretboard Society',
    description: 'View active class windows and book your personalized session for Home Visit, Home Tuition, or Online Tuition across Friday, Saturday, and Sunday.',
    keywords: 'guitar class timings, book guitar slot, weekend music classes, home tuition guitar',
    shareImage: DEFAULT_SHARE_IMAGE,
  },
  '/fees': {
    title: 'Fee Structure & Plans | The Fretboard Society',
    description: 'Transparent pricing for Home Visit, Home Tuition, and Online guitar and ukulele training. Includes Songwriting and Composing add-ons.',
    keywords: 'guitar class fees, tuition fees, ukulele rates, music production add-ons',
    shareImage: DEFAULT_SHARE_IMAGE,
  },
  '/faq': {
    title: 'Frequently Asked Questions | The Fretboard Society',
    description: 'Find clear answers regarding instruments, age eligibility, practice commitments, online options, and acoustic guitar training at TFS.',
    keywords: 'guitar faq, beginner questions, ukulele questions, online music learning faq',
    shareImage: `${BASE_URL}/images/logo_t.png`,
  },
  '/contact': {
    title: 'Contact Us | The Fretboard Society',
    description: 'Get in touch with The Fretboard Society. Connect via phone, WhatsApp, email, or visit our central Kolkata location for inquiries.',
    keywords: 'contact guitar teacher, fretboard society phone, music academy kolkata',
    shareImage: `${BASE_URL}/images/logo_t.png`,
  },
  '/admissionform': {
    title: 'Student Admission Form | The Fretboard Society',
    description: 'Official digital admission form for new students enrolling into acoustic guitar or ukulele programs at The Fretboard Society.',
    keywords: 'guitar admission, enroll music class, TFS student registration',
    shareImage: `${BASE_URL}/images/admission-share.png`,
  },
  '/feepayment': {
    title: 'Monthly Fee Payment | The Fretboard Society',
    description: 'Secure student portal for monthly tuition fee payments with instant UPI verification and digital receipt generation.',
    keywords: 'pay guitar fee, TFS fee payment, student portal upi',
    shareImage: `${BASE_URL}/images/fee-share.png`,
  },
  '/login': {
    title: 'Portal Login | The Fretboard Society',
    description: 'Sign in to access your student corner or TFS Control administration center.',
    keywords: 'TFS login, student login, administration portal',
    shareImage: DEFAULT_SHARE_IMAGE,
  },
  '/tfs-students/login': {
    title: 'Student Login | The Fretboard Society',
    description: 'Student corner login for enrolled learners at The Fretboard Society.',
    keywords: 'student portal login, fretboard society student corner',
    shareImage: `${BASE_URL}/images/fee-share.png`,
  },
  '/tfscontrol/login': {
    title: 'Admin Login | TFS Control',
    description: 'Administrative access for The Fretboard Society management portal.',
    keywords: 'admin login, TFS control',
    shareImage: DEFAULT_SHARE_IMAGE,
  },
  '/tfs-students': {
    title: 'Student Corner Dashboard | The Fretboard Society',
    description: 'Access your lesson schedules, payment history, notifications, and direct student requests.',
    keywords: 'student dashboard, lesson schedule, payment status',
    shareImage: `${BASE_URL}/images/fee-share.png`,
  },
  '/tfscontrol': {
    title: 'TFS Control Center | Management Console',
    description: 'Comprehensive administrative dashboard for admissions, bookings, fees, and curriculum management.',
    keywords: 'management portal, admin console, TFS control',
    shareImage: DEFAULT_SHARE_IMAGE,
  },
  '/terms': {
    title: 'Terms & Conditions | The Fretboard Society',
    description: 'Comprehensive policies, enrollment rules, attendance guidelines, and code of conduct for The Fretboard Society.',
    keywords: 'terms of service, enrollment terms, refund policy',
    shareImage: DEFAULT_SHARE_IMAGE,
  },
  '/privacypolicy': {
    title: 'Privacy Policy | The Fretboard Society',
    description: 'Our commitment to data protection, transparency, and secure handling of student information.',
    keywords: 'privacy policy, student data security, GDPR compliance',
    shareImage: DEFAULT_SHARE_IMAGE,
  },
};

const updateMetaTag = (selector: string, attribute: 'content' | 'href', value: string) => {
  let element = document.querySelector(selector);
  if (!element) {
    if (selector.startsWith('meta[')) {
      const matchName = selector.match(/name="([^"]+)"/);
      const matchProperty = selector.match(/property="([^"]+)"/);
      element = document.createElement('meta');
      if (matchName) (element as HTMLMetaElement).setAttribute('name', matchName[1]);
      if (matchProperty) (element as HTMLMetaElement).setAttribute('property', matchProperty[1]);
      document.head.appendChild(element);
    } else if (selector.startsWith('link[')) {
      element = document.createElement('link');
      element.setAttribute('rel', 'canonical');
      document.head.appendChild(element);
    }
  }
  if (element) {
    element.setAttribute(attribute, value);
  }
};

export const SeoManager = () => {
  const location = useLocation();

  useEffect(() => {
    const rawPath = location.pathname.toLowerCase().replace(/\/+$/, '') || '/';
    const meta = routeMetaMap[rawPath] || {
      title: `${SITE_NAME} | Acoustic Guitar & Ukulele Academy`,
      description: 'The Fretboard Society - Structured acoustic guitar and ukulele lessons for all skill levels.',
      keywords: 'guitar classes, ukulele classes, music lessons',
      shareImage: DEFAULT_SHARE_IMAGE,
    };

    const fullUrl = `${BASE_URL}${location.pathname}`;
    const shareImage = meta.shareImage || DEFAULT_SHARE_IMAGE;

    // Document title
    document.title = meta.title;

    // Standard meta tags
    updateMetaTag('meta[name="description"]', 'content', meta.description);
    if (meta.keywords) {
      updateMetaTag('meta[name="keywords"]', 'content', meta.keywords);
    }

    // Canonical link
    updateMetaTag('link[rel="canonical"]', 'href', fullUrl);

    // Open Graph / Facebook / WhatsApp
    updateMetaTag('meta[property="og:title"]', 'content', meta.title);
    updateMetaTag('meta[property="og:description"]', 'content', meta.description);
    updateMetaTag('meta[property="og:url"]', 'content', fullUrl);
    updateMetaTag('meta[property="og:image"]', 'content', shareImage);
    updateMetaTag('meta[property="og:image:secure_url"]', 'content', shareImage);
    updateMetaTag('meta[property="og:image:type"]', 'content', 'image/png');
    updateMetaTag('meta[property="og:image:width"]', 'content', '1200');
    updateMetaTag('meta[property="og:image:height"]', 'content', '630');
    updateMetaTag('meta[property="og:image:alt"]', 'content', `${meta.title} - ${SITE_NAME}`);
    updateMetaTag('meta[property="og:site_name"]', 'content', SITE_NAME);

    // Twitter Card
    updateMetaTag('meta[name="twitter:card"]', 'content', 'summary_large_image');
    updateMetaTag('meta[property="twitter:card"]', 'content', 'summary_large_image');
    updateMetaTag('meta[name="twitter:title"]', 'content', meta.title);
    updateMetaTag('meta[property="twitter:title"]', 'content', meta.title);
    updateMetaTag('meta[name="twitter:description"]', 'content', meta.description);
    updateMetaTag('meta[property="twitter:description"]', 'content', meta.description);
    updateMetaTag('meta[name="twitter:image"]', 'content', shareImage);
    updateMetaTag('meta[property="twitter:image"]', 'content', shareImage);
    updateMetaTag('meta[name="twitter:url"]', 'content', fullUrl);
    updateMetaTag('meta[property="twitter:url"]', 'content', fullUrl);
  }, [location.pathname]);

  return null;
};

export default SeoManager;
