import { useEffect, useState } from 'react';
import { BookOpen, Guitar, Music, PenTool, Sparkles, Target } from 'lucide-react';
import { loadCurriculumItems } from '../lib/tfsData';

type Instrument = 'guitar' | 'ukulele_standard' | 'ukulele_dotara';
type CurriculumItem = { id?: string; title: string; description: string; category?: string; instrument?: Instrument; icon_name?: string; active?: boolean };
const instrumentLabels: Record<Instrument, string> = { guitar: 'Guitar', ukulele_standard: 'Ukulele (Standard)', ukulele_dotara: 'Ukulele (Dotara)' };
const fallbackItemsByInstrument: Record<Instrument, CurriculumItem[]> = {
  guitar: [
    { title: 'Beginner (Chords)', description: 'Build foundational chords, clean transitions, rhythm control and confident song accompaniment.', category: 'beginner', instrument: 'guitar', icon_name: 'target' },
    { title: 'Fingerstyle', description: 'Develop thumb-and-finger independence, picking patterns, coordination and musical expression.', category: 'fingerstyle', instrument: 'guitar', icon_name: 'guitar' },
    { title: 'Intermediate (1. + 2.)', description: 'Combine the beginner chord pathway and fingerstyle pathway into fluent musical playing.', category: 'intermediate', instrument: 'guitar', icon_name: 'music' },
    { title: 'Advanced (Advance Chords)', description: 'Master advanced chord shapes, extensions, reharmonization and harmonic control.', category: 'advanced', instrument: 'guitar', icon_name: 'book' },
  ],
  ukulele_standard: [
    { title: 'Beginner (Chords)', description: 'Build foundational chords, clean transitions, rhythm control and confident song accompaniment.', category: 'beginner', instrument: 'ukulele_standard', icon_name: 'target' },
    { title: 'Fingerstyle', description: 'Develop thumb-and-finger independence, picking patterns, coordination and expressive accompaniment.', category: 'fingerstyle', instrument: 'ukulele_standard', icon_name: 'guitar' },
    { title: 'Intermediate (1. + 2.)', description: 'Combine the beginner chord pathway and fingerstyle pathway into fluent Standard Ukulele playing.', category: 'intermediate', instrument: 'ukulele_standard', icon_name: 'music' },
    { title: 'Advanced (Advance Chords)', description: 'Master advanced chord shapes, extensions and harmonic control on Standard Ukulele.', category: 'advanced', instrument: 'ukulele_standard', icon_name: 'book' },
  ],
  ukulele_dotara: [
    { title: 'Beginner (Strumming)', description: 'Master traditional Dotara-style strumming, rhythm patterns and song accompaniment.', category: 'beginner', instrument: 'ukulele_dotara', icon_name: 'music' },
    { title: 'Advanced (Tabs)', description: 'Develop advanced Dotara fingerpicking, tab reading and traditional technique.', category: 'advanced', instrument: 'ukulele_dotara', icon_name: 'target' },
  ],
};
const fallbackItems: CurriculumItem[] = [
  ...fallbackItemsByInstrument.guitar,
  ...fallbackItemsByInstrument.ukulele_standard,
  ...fallbackItemsByInstrument.ukulele_dotara,
];
const iconMap: Record<string, typeof BookOpen> = { book: BookOpen, music: Music, target: Target, guitar: Guitar, pen: PenTool };
const Curriculum = () => {
  const [items, setItems] = useState<CurriculumItem[]>(fallbackItems);
  const [instrument, setInstrument] = useState<Instrument>('guitar');
  useEffect(() => { void loadCurriculumItems().then((data) => { if (data?.length) setItems(data); }); }, []);
  const visibleItems = (items.length ? items : fallbackItems).filter((item) => (item.instrument || 'guitar') === instrument);
  return <div className="mobile-page-shell animate-fade-in" style={{ width: '100%', minHeight: '100vh', paddingTop: '15vh', paddingBottom: '10vh' }}><div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '3rem', maxWidth: '1200px' }}><div className="text-center"><h1>The TFS Curriculum.</h1><p style={{ fontSize: '1.25rem' }}>Three focused learning tracks: Guitar, Ukulele (Standard), and Ukulele (Dotara).</p></div><div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>{(Object.keys(instrumentLabels) as Instrument[]).map((key) => <button key={key} onClick={() => setInstrument(key)} className="admin-action" style={{ margin: 0, justifyContent: 'center', color: instrument === key ? 'var(--gold)' : 'var(--text-primary)', borderColor: instrument === key ? 'var(--gold)' : undefined }}>{instrumentLabels[key]}</button>)}</div><section className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>{visibleItems.map((item) => { const Icon = iconMap[item.icon_name || 'book'] || BookOpen; return <article className="glass-panel hover-lift" key={item.id || item.title} style={{ padding: '2rem' }}><Icon size={28} color="var(--gold)" /><p className="admin-kicker" style={{ marginTop: '1rem' }}>{(item.category || 'core').toUpperCase()}</p><h2 style={{ fontSize: '1.5rem' }}>{item.title}</h2><p>{item.description}</p></article>; })}</section><section className="glass-panel text-center" style={{ padding: '3rem' }}><Sparkles size={30} color="var(--gold)" /><h2 style={{ fontSize: '2rem' }}>The practice cycle</h2><p style={{ maxWidth: '650px', margin: '0 auto' }}>The lesson gives you direction. Practice gives you progress. Learn, understand, practise, play and create.</p></section></div></div>;
};
export default Curriculum;
