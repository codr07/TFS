import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Calendar, Check, CircleDollarSign, CreditCard, FileText, Guitar, LayoutDashboard, LogOut, MessageSquare, Percent, Pencil, Plus, Puzzle, Reply, Search, Trash2, Users, X } from 'lucide-react';

type Section = 'overview' | 'admissions' | 'bookings' | 'messages' | 'discounts' | 'fees' | 'addons' | 'schedule' | 'curriculum' | 'students' | 'payments';
type RecordValue = Record<string, any>;
type AdmissionFeed = { headers: string[]; rows: string[][]; spreadsheetUrl?: string };
const navItems: { id: Section; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'admissions', label: 'Admissions', icon: FileText },
  { id: 'bookings', label: 'Bookings', icon: Calendar },
  { id: 'messages', label: 'Student messages', icon: MessageSquare },
  { id: 'discounts', label: 'Coupons', icon: Percent },
  { id: 'fees', label: 'Fee plans', icon: CircleDollarSign },
  { id: 'addons', label: 'Add-ons', icon: Puzzle },
  { id: 'schedule', label: 'Schedule', icon: Calendar },
  { id: 'curriculum', label: 'Curriculum', icon: BookOpen },
  { id: 'students', label: 'Students', icon: Users },
  { id: 'payments', label: 'Payments', icon: CreditCard },
];

const TfsControl = () => {
  const { signOut } = useAuth();
  const [section, setSection] = useState<Section>('overview');
  const [bookings, setBookings] = useState<RecordValue[]>([]);
  const [students, setStudents] = useState<RecordValue[]>([]);
  const [discounts, setDiscounts] = useState<RecordValue[]>([]);
  const [fees, setFees] = useState<RecordValue[]>([]);
  const [scheduleItems, setScheduleItems] = useState<RecordValue[]>([]);
  const [curriculumItems, setCurriculumItems] = useState<RecordValue[]>([]);
  const [addons, setAddons] = useState<RecordValue[]>([]);
  const [requests, setRequests] = useState<RecordValue[]>([]);
  const [payments, setPayments] = useState<RecordValue[]>([]);
  const [admissionFeed, setAdmissionFeed] = useState<AdmissionFeed>({ headers: [], rows: [] });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [editingBooking, setEditingBooking] = useState<RecordValue | null>(null);
  const [editingStudent, setEditingStudent] = useState<RecordValue | null>(null);
  const [editingDiscount, setEditingDiscount] = useState<RecordValue | null>(null);
  const [editingFee, setEditingFee] = useState<RecordValue | null>(null);

  const notify = (message: string) => { setNotice(message); setError(''); window.setTimeout(() => setNotice(''), 3000); };
  const fail = (message: string) => { setError(message); setNotice(''); };

  const loadAdmissions = async () => {
    const apiUrl = import.meta.env.VITE_ADMISSION_API_URL as string | undefined;
    if (!apiUrl) return;
    const callbackName = `tfsAdmissionsCallback_${Date.now()}`;
    const result = await new Promise<AdmissionFeed & { success?: boolean; error?: string }>((resolve, reject) => {
      const script = document.createElement('script');
      const callbackWindow = globalThis as unknown as Record<string, (response: AdmissionFeed & { success?: boolean; error?: string }) => void>;
      const timeout = window.setTimeout(() => {
        cleanup();
        reject(new Error('Unable to load admission submissions. Check the Apps Script deployment.'));
      }, 15000);
      const cleanup = () => {
        window.clearTimeout(timeout);
        delete callbackWindow[callbackName];
        script.remove();
      };
      callbackWindow[callbackName] = (response: AdmissionFeed & { success?: boolean; error?: string }) => {
        cleanup();
        resolve(response);
      };
      script.onerror = () => {
        cleanup();
        reject(new Error('Unable to connect to the admission database.'));
      };
      script.src = `${apiUrl}?action=admissions&callback=${encodeURIComponent(callbackName)}&t=${Date.now()}`;
      document.head.appendChild(script);
    });
    if (!result.success) throw new Error(result.error || 'Admission database returned an error.');
    setAdmissionFeed({ headers: result.headers || [], rows: result.rows || [], spreadsheetUrl: result.spreadsheetUrl });
  };

  const loadData = async () => {
    setLoading(true);
    setError('');
    const db = supabase;

    // Run queries individually so one table error doesn't wipe everything else
    const [
      bookingResult,
      studentResult,
      roleStudentResult,
      discountResult,
      feeResult,
      scheduleResult,
      curriculumResult,
      addonResult,
      requestResult,
      paymentResult,
    ] = await Promise.all([
      db.from('bookings').select('*').order('created_at', { ascending: false }),
      db.from('student_profiles').select('*').order('created_at', { ascending: false }),
      db.from('profiles').select('*').eq('role', 'student').order('created_at', { ascending: false }),
      db.from('discounts').select('*').order('updated_at', { ascending: false }),
      db.from('fee_plans').select('*').order('updated_at', { ascending: false }),
      db.from('schedule_items').select('*').order('sort_order'),
      db.from('curriculum_items').select('*').order('sort_order'),
      db.from('add_ons').select('*').order('sort_order'),
      db.from('student_requests').select('*').order('created_at', { ascending: false }),
      db.from('payments').select('*').order('created_at', { ascending: false }),
    ]);

    // Log any query-level warnings individually — don't fail on a missing optional table
    const allResults = [bookingResult, studentResult, roleStudentResult, discountResult, feeResult, scheduleResult, curriculumResult, addonResult, requestResult, paymentResult];
    for (const result of allResults) {
      if (result.error) console.warn('Supabase query warning:', result.error.message);
    }

    const rawProfiles = studentResult.data || [];
    const roleStudents = roleStudentResult.data || [];
    const studentMap = new Map<string, RecordValue>();

    // 1. student_profiles
    for (const sp of rawProfiles) {
      studentMap.set(sp.id, {
        ...sp,
        first_name: sp.first_name || 'Student',
        last_name: sp.last_name || '',
        status: sp.status || 'active',
        curriculum: sp.curriculum || 'Guitar',
      });
    }

    // 2. profiles where role is student
    for (const p of roleStudents) {
      const existing = studentMap.get(p.id) || Array.from(studentMap.values()).find(s => s.email && p.email && s.email.toLowerCase() === p.email.toLowerCase());
      if (existing) {
        if (!existing.email && p.email) existing.email = p.email;
        if (!existing.first_name && (p.first_name || p.display_name || p.full_name)) {
          existing.first_name = p.first_name || p.full_name?.split(' ')[0] || p.display_name || 'Student';
        }
      } else {
        const nameParts = (p.full_name || p.display_name || 'Student').trim().split(' ');
        studentMap.set(p.id, {
          id: p.id,
          first_name: p.first_name || nameParts[0] || 'Student',
          last_name: p.last_name || nameParts.slice(1).join(' ') || '',
          email: p.email || '',
          curriculum: p.curriculum || 'Guitar',
          class_schedule: p.class_schedule || 'Active Student',
          status: p.status || 'active',
          created_at: p.created_at,
          role: 'student',
        });
      }
    }

    const mergedStudents = Array.from(studentMap.values());

    setBookings(bookingResult.data || []);
    setStudents(mergedStudents);
    setDiscounts(discountResult.data || []);
    setFees(feeResult.data || []);
    setScheduleItems(scheduleResult.data || []);
    setCurriculumItems(curriculumResult.data || []);
    setAddons(addonResult.data || []);
    setRequests(requestResult.data || []);
    setPayments(paymentResult.data || []);
    setLoading(false);

    try { await loadAdmissions(); } catch (admissionError) { fail(admissionError instanceof Error ? admissionError.message : 'Unable to load admissions.'); }
  };

  useEffect(() => { void loadData(); }, []);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query ? students.filter((student) => `${student.first_name || ''} ${student.last_name || ''} ${student.email || ''} ${student.id}`.toLowerCase().includes(query)) : students;
  }, [search, students]);

  const remove = async (table: string, id: string, refreshMessage: string) => {
    if (!window.confirm('Delete this record permanently?')) return;
    const { error: deleteError } = await supabase.from(table).delete().eq('id', id);
    if (deleteError) { fail(deleteError.message); return; }
    if (table === 'student_profiles') {
      try {
        await supabase.from('profiles').delete().eq('id', id);
      } catch {
        // ignore profile cleanup error
      }
    }
    notify(refreshMessage);
    void loadData();
  };

  const saveRecord = async (table: string, values: RecordValue, id?: string) => {
    const payload = { ...values };
    delete payload.id;
    delete payload.created_at;
    delete payload.updated_at;
    delete payload.role;
    delete payload._roleOnly;

    const result = id ? await supabase.from(table).update(payload).eq('id', id) : await supabase.from(table).insert(payload);
    if (result.error) { fail(result.error.message); return; }

    if (table === 'student_profiles') {
      const profileSync: RecordValue = {
        role: 'student',
        display_name: `${values.first_name || ''} ${values.last_name || ''}`.trim() || 'Student',
      };
      if (values.email) profileSync.email = values.email;
      if (id) {
        try {
          await supabase.from('profiles').update(profileSync).eq('id', id);
        } catch {
          // ignore profile sync error
        }
      }
    }

    notify('Saved successfully.');
    void loadData();
  };

  return <div className="admin-shell animate-fade-in"><aside className="admin-sidebar"><div className="admin-brand"><Guitar size={22} /><span>TFS <b>CONTROL</b></span></div><p className="admin-kicker">Administration</p><nav className="admin-nav">{navItems.map(({ id, label, icon: Icon }) => <button key={id} className={section === id ? 'admin-nav-item active' : 'admin-nav-item'} onClick={() => setSection(id)}><Icon size={18} />{label}</button>)}</nav><button className="admin-signout" onClick={signOut}><LogOut size={17} /> Sign out</button></aside><main className="admin-main"><header className="admin-header"><div><p className="admin-kicker">TFS / {section}</p><h1>{navItems.find((item) => item.id === section)?.label}</h1></div><div className="admin-status"><span /> Secure admin workspace</div></header>{notice && <div className="admin-notice"><Check size={16} />{notice}</div>}{error && <div className="admin-error"><X size={16} />{error}</div>}
    {section === 'overview' && <Overview bookings={bookings} students={students} fees={fees} onNavigate={setSection} loading={loading} />}
    {section === 'admissions' && <Admissions feed={admissionFeed} onRefresh={() => void loadAdmissions()} />}
    {section === 'bookings' && <Bookings bookings={bookings} loading={loading} editing={editingBooking} setEditing={setEditingBooking} save={saveRecord} remove={remove} />}
    {section === 'messages' && <MessageManager requests={requests} save={saveRecord} remove={remove} />}
    {section === 'students' && <Students students={filteredStudents} search={search} setSearch={setSearch} editing={editingStudent} setEditing={setEditingStudent} save={saveRecord} remove={remove} />}
    {section === 'discounts' && <DiscountManager discounts={discounts} editing={editingDiscount} setEditing={setEditingDiscount} save={saveRecord} remove={remove} />}
    {section === 'fees' && <FeeManager fees={fees} editing={editingFee} setEditing={setEditingFee} save={saveRecord} remove={remove} />}
    {section === 'addons' && <CatalogManager title="Add-ons" table="add_ons" items={addons} fields={['name', 'description', 'amount', 'billing_period', 'sort_order', 'active']} save={saveRecord} remove={remove} />}
    {section === 'schedule' && <CatalogManager title="Class schedule" table="schedule_items" items={scheduleItems} fields={['title', 'description', 'day_label', 'time_label', 'format', 'sort_order', 'active']} save={saveRecord} remove={remove} />}
    {section === 'curriculum' && <CatalogManager title="Curriculum modules" table="curriculum_items" items={curriculumItems} fields={['title', 'description', 'category', 'instrument', 'icon_name', 'sort_order', 'active']} save={saveRecord} remove={remove} />}
    {section === 'payments' && <Payments payments={payments} students={students} save={saveRecord} remove={remove} />}
  </main></div>;
};

const Admissions = ({ feed, onRefresh }: { feed: AdmissionFeed; onRefresh: () => void }) => {
  const exportAdmissions = () => {
    const csv = [feed.headers, ...feed.rows].map((row) => row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `tfs-admissions-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };
  return <section className="admin-panel">
    <PanelHeading eyebrow="Google Sheets admission database" title="Admission submissions" />
    <div className="admin-admission-toolbar">
      <span>{feed.rows.length} submission{feed.rows.length === 1 ? '' : 's'}</span>
      <button className="admin-save" onClick={onRefresh}>Refresh</button>
      <button className="admin-save" onClick={exportAdmissions} disabled={!feed.rows.length}>Export spreadsheet CSV</button>
      {feed.spreadsheetUrl && <a className="admin-save" href={feed.spreadsheetUrl} target="_blank" rel="noreferrer">Open Google Sheet</a>}
    </div>
    {!feed.rows.length ? <p className="admin-empty">No admission submissions found. Deploy the latest Apps Script and submit the form once.</p> : <div className="admin-admission-table"><table><thead><tr>{feed.headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{feed.rows.map((row, rowIndex) => <tr key={`${row[1] || 'admission'}-${rowIndex}`}>{feed.headers.map((header, columnIndex) => <td key={`${header}-${columnIndex}`}>{row[columnIndex] || '—'}</td>)}</tr>)}</tbody></table></div>}
  </section>;
};

const Overview = ({ bookings, students, fees, onNavigate, loading }: { bookings: RecordValue[]; students: RecordValue[]; fees: RecordValue[]; onNavigate: (section: Section) => void; loading: boolean }) => <><section className="admin-stat-grid"><Stat label="New bookings" value={bookings.filter((booking) => booking.status === 'new').length} icon={Calendar} /><Stat label="Active students" value={students.length} icon={Users} /><Stat label="Fee plans" value={fees.length} icon={CircleDollarSign} /></section><div className="admin-grid-two"><section className="admin-panel"><PanelHeading eyebrow="Latest enquiries" title="Booking inbox" action="Manage bookings" onClick={() => onNavigate('bookings')} />{loading ? <p className="admin-empty">Loading records...</p> : bookings.length === 0 ? <p className="admin-empty">No bookings yet.</p> : bookings.slice(0, 5).map((booking) => <div className="booking-row" key={booking.id}><div className="booking-avatar">{(booking.name || 'S').charAt(0).toUpperCase()}</div><div className="booking-person"><b>{booking.name}</b><small>{booking.email} · {booking.instrument || 'Instrument pending'}</small></div><span className="booking-badge">{booking.status || 'new'}</span></div>)}</section><section className="admin-panel"><PanelHeading eyebrow="Workspace shortcuts" title="Manage TFS" /><button className="admin-action" onClick={() => onNavigate('discounts')}><Percent size={18} /> Create discount coupon</button><button className="admin-action" onClick={() => onNavigate('students')}><Users size={18} /> Review student profiles</button><button className="admin-action" onClick={() => onNavigate('fees')}><CircleDollarSign size={18} /> Manage fee plans</button></section></div></>;

const Stat = ({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Calendar }) => <div className="admin-stat"><Icon size={20} color="var(--gold)" /><span>{label}</span><strong>{value}</strong></div>;
const PanelHeading = ({ eyebrow, title, action, onClick }: { eyebrow: string; title: string; action?: string; onClick?: () => void }) => <div className="admin-panel-heading"><div><p className="admin-kicker">{eyebrow}</p><h2>{title}</h2></div>{action && <button className="admin-link" onClick={onClick}>{action}</button>}</div>;

const Bookings = ({ bookings, loading, editing, setEditing, save, remove }: { bookings: RecordValue[]; loading: boolean; editing: RecordValue | null; setEditing: (value: RecordValue | null) => void; save: (table: string, values: RecordValue, id?: string) => Promise<void>; remove: (table: string, id: string, message: string) => Promise<void> }) => <section className="admin-panel"><PanelHeading eyebrow="Enquiries from your website" title="Booking management" />{editing && <RecordForm title="Update booking" values={editing} fields={['name', 'email', 'phone', 'instrument', 'format', 'slot', 'status', 'admin_reply']} onCancel={() => setEditing(null)} onSave={async (values) => { await save('bookings', values, editing.id); setEditing(null); }} />}{loading ? <p className="admin-empty">Loading bookings...</p> : bookings.length === 0 ? <p className="admin-empty">No bookings found.</p> : <div className="admin-table"><div className="admin-table-row admin-table-head"><span>Customer</span><span>Session</span><span>Status</span><span>Actions</span></div>{bookings.map((booking) => <div className="admin-table-row" key={booking.id}><span><b>{booking.name}</b><small>{booking.email}</small></span><span>{booking.instrument || '—'} · {booking.format || '—'}<small>{booking.slot || 'No slot selected'}</small></span><span className="booking-badge">{booking.status || 'new'}</span><span className="admin-row-actions"><button title="Edit booking" onClick={() => setEditing(booking)}><Pencil size={15} /></button><button title="Delete booking" onClick={() => void remove('bookings', booking.id, 'Booking deleted.')}><Trash2 size={15} /></button><a title="Reply by email" href={`mailto:${booking.email}?subject=TFS booking enquiry&body=${encodeURIComponent(booking.admin_reply || 'Thank you for contacting The Fretboard Society.')}`}><Reply size={15} /></a></span></div>)}</div>}</section>;

const Students = ({ students, search, setSearch, editing, setEditing, save, remove }: { students: RecordValue[]; search: string; setSearch: (value: string) => void; editing: RecordValue | null; setEditing: (value: RecordValue | null) => void; save: (table: string, values: RecordValue, id?: string) => Promise<void>; remove: (table: string, id: string, message: string) => Promise<void> }) => <section className="admin-panel"><div className="admin-panel-heading"><div><p className="admin-kicker">Portal accounts</p><h2>Student profiles</h2></div><label className="admin-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name or email" /></label></div>{editing && <RecordForm title={editing.id ? 'Edit student profile' : 'Add student profile'} values={editing} fields={['first_name', 'last_name', 'email', 'phone_number', 'curriculum', 'class_schedule', 'status']} onCancel={() => setEditing(null)} onSave={async (values) => { await save('student_profiles', { ...values, status: values.status || 'active' }, editing.id); setEditing(null); }} />}{!editing && <button className="admin-save" onClick={() => setEditing({ first_name: '', last_name: '', email: '', phone_number: '', curriculum: 'Guitar', class_schedule: '', status: 'active' })}><Plus size={17} /> Add student profile</button>}<div className="admin-table"><div className="admin-table-row admin-table-head"><span>Student</span><span>Curriculum</span><span>Joined</span><span>Actions</span></div>{students.map((student) => <div className="admin-table-row" key={student.id}><span><b>{`${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Student'}</b><small>{student.email || 'No email'}</small></span><span>{student.curriculum || 'Guitar'}<small>{student.class_schedule || 'Active Student'}</small></span><span>{student.created_at ? new Date(student.created_at).toLocaleDateString() : '—'}</span><span className="admin-row-actions"><button title="Edit student" onClick={() => setEditing(student)}><Pencil size={15} /></button><button title="Remove student profile" onClick={() => void remove('student_profiles', student.id, 'Student profile removed.')}><Trash2 size={15} /></button></span></div>)}</div></section>;

const DiscountManager = ({ discounts, editing, setEditing, save, remove }: { discounts: RecordValue[]; editing: RecordValue | null; setEditing: (value: RecordValue | null) => void; save: (table: string, values: RecordValue, id?: string) => Promise<void>; remove: (table: string, id: string, message: string) => Promise<void> }) => <section className="admin-panel"><PanelHeading eyebrow="Applied at student checkout" title="Discount coupons" />{editing ? <RecordForm title={editing.id ? 'Edit coupon' : 'New coupon'} values={editing} fields={['name', 'coupon_code', 'discount_type', 'discount_value', 'maximum_discount_amount', 'minimum_purchase', 'valid_from', 'valid_until', 'coupon_count', 'active']} onCancel={() => setEditing(null)} onSave={async (values) => { await save('discounts', {
      ...values,
      discount_type: values.discount_type || 'percentage',
      discount_value: Number(values.discount_value ?? 0),
      maximum_discount_amount: values.maximum_discount_amount ? Number(values.maximum_discount_amount) : null,
      minimum_purchase: Number(values.minimum_purchase ?? 0),
      coupon_count: Number(values.coupon_count ?? 1),
      valid_from: values.valid_from || new Date().toISOString(),
      valid_until: values.valid_until || null,
      active: values.active !== false,
    }, editing.id); setEditing(null); }} /> : <button className="admin-save" onClick={() => setEditing({ name: '', coupon_code: '', discount_type: 'percentage', discount_value: 10, maximum_discount_amount: 500, minimum_purchase: 0, valid_from: new Date().toISOString().slice(0, 10), valid_until: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10), coupon_count: 10, active: true })}><Plus size={17} /> Create coupon</button>}<div className="admin-table">{discounts.map((discount) => <div className="admin-table-row" key={discount.id}><span><b>{discount.name}</b><small>{discount.coupon_code}</small><small>{discount.discount_type === 'amount' ? `₹${Number(discount.discount_value || 0).toLocaleString('en-IN')} off` : `${Number(discount.discount_value || 0)}% off`}</small></span><span>{discount.valid_until ? `Valid till ${new Date(discount.valid_until).toLocaleDateString('en-IN')}` : 'Open date'}<small>{discount.minimum_purchase ? `Min ₹${Number(discount.minimum_purchase).toLocaleString('en-IN')}` : 'No minimum'}</small></span><span>{discount.active ? 'Active' : 'Paused'}<small>{discount.coupon_count ? `${discount.coupon_count} coupon(s)` : 'Unlimited'}</small></span><span className="admin-row-actions"><button onClick={() => setEditing(discount)}><Pencil size={15} /></button><button onClick={() => void remove('discounts', discount.id, 'Coupon deleted.')}><Trash2 size={15} /></button></span></div>)}</div></section>;

const FeeManager = ({ fees, editing, setEditing, save, remove }: { fees: RecordValue[]; editing: RecordValue | null; setEditing: (value: RecordValue | null) => void; save: (table: string, values: RecordValue, id?: string) => Promise<void>; remove: (table: string, id: string, message: string) => Promise<void> }) => <section className="admin-panel"><PanelHeading eyebrow="Student checkout plans" title="Fee plans" />{editing ? <RecordForm title={editing.id ? 'Edit fee plan' : 'New fee plan'} values={editing} fields={['name', 'amount', 'description', 'category', 'instrument', 'billing_period', 'sort_order', 'active']} onCancel={() => setEditing(null)} onSave={async (values) => { await save('fee_plans', { ...values, amount: Number(values.amount), sort_order: Number(values.sort_order || 0), active: values.active !== false }, editing.id); setEditing(null); }} /> : <button className="admin-save" onClick={() => setEditing({ name: '', amount: 900, description: '', category: 'guitar', instrument: 'guitar', billing_period: 'monthly', sort_order: fees.length, active: true })}><Plus size={17} /> Add fee plan</button>}<div className="admin-table">{fees.map((fee) => <div className="admin-table-row" key={fee.id}><span><b>{fee.name}</b><small>{fee.billing_period} · {fee.instrument || fee.category || 'guitar'}</small></span><span>₹{fee.amount}</span><span>{fee.active ? 'Active' : 'Paused'}</span><span className="admin-row-actions"><button onClick={() => setEditing(fee)}><Pencil size={15} /></button><button onClick={() => void remove('fee_plans', fee.id, 'Fee plan deleted.')}><Trash2 size={15} /></button></span></div>)}</div></section>;

const CatalogManager = ({ title, table, items, fields, save, remove }: { title: string; table: string; items: RecordValue[]; fields: string[]; save: (table: string, values: RecordValue, id?: string) => Promise<void>; remove: (table: string, id: string, message: string) => Promise<void> }) => { const [editing, setEditing] = useState<RecordValue | null>(null); return <section className="admin-panel"><PanelHeading eyebrow="Public website data" title={title} />{editing ? <RecordForm title={editing.id ? `Edit ${title.toLowerCase()}` : `New ${title.toLowerCase()}`} values={editing} fields={fields} onCancel={() => setEditing(null)} onSave={async (values) => { const numericFields = ['amount', 'sort_order']; const cleaned: RecordValue = { ...values }; for (const field of numericFields) { if (cleaned[field] !== undefined && cleaned[field] !== '') cleaned[field] = Number(cleaned[field]); } if ('active' in cleaned) cleaned.active = cleaned.active !== false; await save(table, cleaned, editing.id); setEditing(null); }} /> : <button className="admin-save" onClick={() => setEditing({ active: true, sort_order: items.length })}><Plus size={17} /> Add entry</button>}<div className="admin-table">{items.map((item) => { const itemTitle = item.title || item.name || 'Untitled'; const secondary = item.description || item.day_label || item.category || ''; const meta = item.time_label || item.format || (item.amount !== undefined ? `₹${Number(item.amount).toLocaleString('en-IN')}` : item.category) || ''; return <div className="admin-table-row" key={item.id}><span><b>{itemTitle}</b><small>{secondary}</small></span><span>{meta}</span><span>{item.active ? 'Active' : 'Paused'}</span><span className="admin-row-actions"><button onClick={() => setEditing(item)}><Pencil size={15} /></button><button onClick={() => void remove(table, item.id, 'Entry deleted.')}><Trash2 size={15} /></button></span></div>; })}</div></section>; };

const MessageManager = ({ requests, save, remove }: { requests: RecordValue[]; save: (table: string, values: RecordValue, id?: string) => Promise<void>; remove: (table: string, id: string, message: string) => Promise<void> }) => { const [editing, setEditing] = useState<RecordValue | null>(null); return <section className="admin-panel"><PanelHeading eyebrow="Student portal requests" title="Student messages" />{editing && <RecordForm title={`Review student message${editing.student_name ? ` · ${editing.student_name}` : ''}`} values={editing} fields={['student_name', 'student_email', 'request_type', 'message', 'status', 'admin_note']} lockedFields={['student_name', 'student_email', 'request_type', 'message']} onCancel={() => setEditing(null)} onSave={async (values) => { await save('student_requests', values, editing.id); setEditing(null); }} />}{requests.length === 0 ? <p className="admin-empty">No student messages yet.</p> : <div className="admin-table">{requests.map((request) => <div className="admin-table-row" key={request.id}><span><b>{request.student_name || 'Student'}</b><small>{request.request_type} · {request.message}</small></span><span>{request.status || 'pending'}</span><span>{request.created_at ? new Date(request.created_at).toLocaleDateString() : '—'}</span><span className="admin-row-actions"><button title="Reply/update" onClick={() => setEditing(request)}><Reply size={15} /></button><button title="Delete message" onClick={() => void remove('student_requests', request.id, 'Message deleted.')}><Trash2 size={15} /></button></span></div>)}</div>}</section>; };

const RecordForm = ({ title, values, fields, lockedFields = [], dropdowns = {}, onCancel, onSave }: { title: string; values: RecordValue; fields: string[]; lockedFields?: string[]; dropdowns?: Record<string, string[]>; onCancel: () => void; onSave: (values: RecordValue) => Promise<void> }) => { const [form, setForm] = useState(values); const submit = async (event: FormEvent) => { event.preventDefault(); await onSave(form); }; const isNumberField = (field: string) => ['amount', 'discount_value', 'maximum_discount_amount', 'minimum_purchase', 'coupon_count', 'percentage', 'sort_order'].includes(field); const isDateField = (field: string) => field === 'valid_from' || field === 'valid_until'; const inputValue = (field: string, value: unknown): string | number => { if (typeof value === 'number') return value; if (typeof value === 'string') { if (isDateField(field) && value.includes('T')) return value.slice(0, 10); return value; } return ''; }; return <form className="admin-record-form" onSubmit={submit}><div className="admin-form-heading"><h3>{title}</h3><button type="button" onClick={onCancel}><X size={16} /></button></div>{fields.map((field) => <label key={field}>{field.replaceAll('_', ' ')}{dropdowns[field] ? <select disabled={lockedFields.includes(field)} value={form[field] || ''} onChange={(event) => setForm({ ...form, [field]: event.target.value })}>{dropdowns[field].map((opt) => <option key={opt} value={opt}>{opt}</option>)}</select> : field === 'body' || field === 'admin_reply' || field === 'message' ? <textarea rows={4} disabled={lockedFields.includes(field)} value={form[field] || ''} onChange={(event) => setForm({ ...form, [field]: event.target.value })} /> : field === 'active' ? <select disabled={lockedFields.includes(field)} value={String(form[field] !== false)} onChange={(event) => setForm({ ...form, [field]: event.target.value === 'true' })}><option value="true">Active</option><option value="false">Paused</option></select> : field === 'discount_type' ? <select disabled={lockedFields.includes(field)} value={form[field] || 'percentage'} onChange={(event) => setForm({ ...form, [field]: event.target.value })}><option value="percentage">Percentage</option><option value="amount">Fixed amount</option></select> : <input required={field !== 'phone' && field !== 'admin_reply' && field !== 'phone_number'} disabled={lockedFields.includes(field)} type={isDateField(field) ? 'date' : isNumberField(field) ? 'number' : 'text'} step={isNumberField(field) ? '0.01' : undefined} value={inputValue(field, form[field])} onChange={(event) => setForm({ ...form, [field]: event.target.value })} />}</label>)}<button className="admin-save" type="submit"><Check size={17} /> Save record</button></form>; };

const Payments = ({ payments, students, save, remove }: { payments: RecordValue[]; students: RecordValue[]; save: (table: string, values: RecordValue, id?: string) => Promise<void>; remove: (table: string, id: string, message: string) => Promise<void> }) => { const [editing, setEditing] = useState<RecordValue | null>(null); const studentName = (studentId: string) => { const s = students.find((x) => x.id === studentId); return s ? `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.email || studentId : studentId; }; return <section className="admin-panel"><PanelHeading eyebrow="Student fee payment records" title="Payments" />{editing ? <RecordForm title={editing.id ? 'Update payment' : 'Record payment'} values={editing} fields={['student_id', 'amount', 'coupon_code', 'billing_period', 'status', 'paid_at']} lockedFields={editing.id ? [] : []} dropdowns={{ status: ['pending', 'paid', 'failed', 'refunded'], billing_period: ['monthly', 'quarterly', 'yearly', 'one-time'] }} onCancel={() => setEditing(null)} onSave={async (values) => { await save('payments', { ...values, amount: Number(values.amount), paid_at: values.status === 'paid' ? (values.paid_at || new Date().toISOString()) : null }, editing.id); setEditing(null); }} /> : <button className="admin-save" onClick={() => setEditing({ student_id: students[0]?.id || '', amount: 900, coupon_code: '', billing_period: 'monthly', status: 'pending', paid_at: null })}><Plus size={17} /> Record payment</button>}{payments.length === 0 ? <p className="admin-empty">No payments recorded yet.</p> : <div className="admin-table"><div className="admin-table-row admin-table-head"><span>Student</span><span>Amount</span><span>Period</span><span>Status</span><span>Date</span><span>Actions</span></div>{payments.map((payment) => <div className="admin-table-row" key={payment.id}><span><b>{studentName(payment.student_id)}</b><small>{payment.coupon_code ? `Coupon: ${payment.coupon_code}` : 'No coupon'}</small></span><span>₹{Number(payment.amount || 0).toLocaleString('en-IN')}</span><span>{payment.billing_period || 'monthly'}</span><span className="booking-badge">{payment.status || 'pending'}</span><span>{payment.paid_at ? new Date(payment.paid_at).toLocaleDateString('en-IN') : payment.created_at ? new Date(payment.created_at).toLocaleDateString('en-IN') : '—'}</span><span className="admin-row-actions"><button title="Edit payment" onClick={() => setEditing(payment)}><Pencil size={15} /></button><button title="Delete payment" onClick={() => void remove('payments', payment.id, 'Payment deleted.')}><Trash2 size={15} /></button></span></div>)}</div>}</section>; };

export default TfsControl;
