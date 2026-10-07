import { useEffect, useMemo, useState } from 'react';
import { BookOpen, ChevronLeft, Guitar, Music, PenTool, Target } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Instrument = 'guitar' | 'ukulele_standard' | 'ukulele_dotara';
type ClassItem = { id?: string; title: string; description: string; category?: string; instrument?: Instrument; icon_name?: string; active?: boolean };
const fallbackClasses: ClassItem[] = [
  { title: 'Beginner', description: 'Master foundational chords, transitions and basic rhythm playing.', category: 'foundation', instrument: 'guitar', icon_name: 'target' },
  { title: 'Fingerstyle', description: 'Develop right-hand independence and complex picking patterns.', category: 'technique', instrument: 'guitar', icon_name: 'guitar' },
  { title: 'Intermediate', description: 'Blend chord strumming with fingerstyle melody lines seamlessly.', category: 'core', instrument: 'guitar', icon_name: 'music' },
  { title: 'Advanced', description: 'Master extensions, reharmonization and total harmonic control.', category: 'advanced', instrument: 'guitar', icon_name: 'book' },
  { title: 'Dotara Ukulele', description: 'Build traditional strumming, fingerpicking and tab-reading skills.', category: 'foundation', instrument: 'ukulele_dotara', icon_name: 'music' },
];
const icons: Record<string, typeof BookOpen> = { book: BookOpen, music: Music, guitar: Guitar, target: Target, pen: PenTool };
const Classes = () => {
  const [classes, setClasses] = useState<ClassItem[]>(fallbackClasses);
  const [instrument, setInstrument] = useState<Instrument>('guitar');
  const [selected, setSelected] = useState<ClassItem | null>(null);
  useEffect(() => { void supabase.from('curriculum_items').select('*').eq('active', true).order('sort_order').then(({ data }) => { if (data?.length) setClasses(data); }); }, []);
  const grouped = useMemo(() => Array.from(new Set(classes.filter((item) => (item.instrument || 'guitar') === instrument).map((item) => item.category || 'core'))), [classes, instrument]);
  const instrumentLabels: Record<Instrument, string> = { guitar: 'Guitar', ukulele_standard: 'Ukulele (Standard)', ukulele_dotara: 'Ukulele (Dotara)' };
  return <div className="mobile-page-shell animate-fade-in" style={{ width: '100%', minHeight: '100vh', paddingTop: '15vh', paddingBottom: '10vh' }}><div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '3rem', maxWidth: '1100px' }}><div className="text-center"><h1>{selected ? selected.title : 'Select Your Class.'}</h1><p>{selected ? 'A focused module from the current TFS learning map.' : 'Choose one of the three TFS instrument pathways.'}</p></div>{selected ? <section className="glass-panel" style={{ maxWidth: '720px', width: '100%', margin: '0 auto', padding: '3rem', textAlign: 'center' }}><button className="student-text-button" onClick={() => setSelected(null)}><ChevronLeft size={18} /> Back to classes</button><div style={{ margin: '2rem auto 1rem', display: 'grid', placeItems: 'center', width: 64, height: 64, borderRadius: 16, background: 'rgba(212,175,55,.1)' }}>{(() => { const Icon = icons[selected.icon_name || 'book'] || BookOpen; return <Icon size={32} color="var(--gold)" />; })()}</div><p className="admin-kicker">{instrumentLabels[selected.instrument || instrument]}</p><h2 style={{ fontSize: '2.5rem' }}>{selected.title}</h2><p style={{ fontSize: '1.15rem', lineHeight: 1.7 }}>{selected.description}</p></section> : <><div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>{(Object.keys(instrumentLabels) as Instrument[]).map((key) => <button key={key} onClick={() => setInstrument(key)} className="admin-action" style={{ margin: 0, justifyContent: 'center', color: instrument === key ? 'var(--gold)' : 'var(--text-primary)', borderColor: instrument === key ? 'var(--gold)' : undefined }}>{instrumentLabels[key]}</button>)}</div>{grouped.map((category) => <section key={category}><p className="admin-kicker">{category}</p><div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>{classes.filter((item) => (item.instrument || 'guitar') === instrument && (item.category || 'core') === category).map((item) => { const Icon = icons[item.icon_name || 'book'] || BookOpen; return <button className="glass-panel hover-lift" key={item.id || item.title} onClick={() => setSelected(item)} style={{ padding: '2rem', textAlign: 'left', cursor: 'pointer', color: 'var(--text-primary)' }}><Icon size={26} color="var(--gold)" /><h2 style={{ fontSize: '1.45rem', marginTop: '1rem' }}>{item.title}</h2><p>{item.description}</p></button>; })}</div></section>)}</>}</div></div>;
};
export default Classes;
