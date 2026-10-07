import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { BookOpen, CalendarDays, Check, ChevronRight, CircleDollarSign, Clock3, FileText, LogOut, MessageSquare, UserRound } from 'lucide-react';

type StudentTab = 'home' | 'payments' | 'updates' | 'requests';
const StudentDashboard = () => {
  const { user, signOut } = useAuth();
  const [tab, setTab] = useState<StudentTab>('home');
  const [requestType, setRequestType] = useState('Plan change');
  const [request, setRequest] = useState('');
  const [notice, setNotice] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student';
  const submitRequest = async (event: FormEvent) => {
    event.preventDefault();
    if (!request.trim() || !user) return;
    setRequestLoading(true);
    const { error } = await supabase.from('student_requests').insert({
      student_id: user.id,
      student_name: displayName,
      student_email: user.email,
      request_type: requestType,
      message: request.trim(),
    });
    if (error) {
      setNotice('Unable to send request. Please try again.');
      setRequestLoading(false);
      return;
    }
    setRequest('');
    setRequestLoading(false);
    setNotice('Request sent to the TFS team.');
    window.setTimeout(() => setNotice(''), 3000);
  };
  const tabs: { id: StudentTab; label: string; icon: typeof BookOpen }[] = [
    { id: 'home', label: 'Overview', icon: BookOpen }, { id: 'payments', label: 'Payments', icon: CircleDollarSign }, { id: 'updates', label: 'Class updates', icon: CalendarDays }, { id: 'requests', label: 'Requests', icon: MessageSquare },
  ];
  return <div className="student-shell animate-fade-in"><aside className="student-sidebar"><div className="student-brand">TFS <span>STUDENT CORNER</span></div><p className="student-kicker">Your learning space</p><nav className="student-nav">{tabs.map(({ id, label, icon: Icon }) => <button key={id} className={tab === id ? 'student-nav-item active' : 'student-nav-item'} onClick={() => setTab(id)}><Icon size={18} />{label}</button>)}</nav><button className="student-signout" onClick={signOut}><LogOut size={17} /> Sign out</button></aside><main className="student-main"><header className="student-header"><div><p className="student-kicker">Welcome back</p><h1>{displayName}</h1><p className="student-muted">Keep your practice moving forward.</p></div><div className="student-profile"><UserRound size={17} /> {user?.email}</div></header>{notice && <div className="student-notice"><Check size={16} />{notice}</div>}{tab === 'home' && <Overview onNavigate={setTab} />}{tab === 'payments' && <Payments />}{tab === 'updates' && <Updates />}{tab === 'requests' && <RequestPanel requestType={requestType} setRequestType={setRequestType} request={request} setRequest={setRequest} submitRequest={submitRequest} requestLoading={requestLoading} />}</main></div>;
};

const Overview = ({ onNavigate }: { onNavigate: (tab: StudentTab) => void }) => <><section className="student-hero"><div><p className="student-kicker">Current learning plan</p><h2>Online Guitar Tuition</h2><p>Build fluency, confidence, and your own musical voice.</p></div><span className="student-plan-status">Active plan</span></section><section className="student-stat-grid"><div className="student-stat"><Clock3 size={20} /><span>Next class</span><strong>Saturday, 10:00 AM</strong><small>Confirmed · Online</small></div><div className="student-stat"><CircleDollarSign size={20} /><span>Next payment</span><strong>₹900</strong><small>Due 05 October 2026</small></div><div className="student-stat"><FileText size={20} /><span>Current module</span><strong>Neck mapping</strong><small>Week 4 of 8</small></div></section><div className="student-grid-two"><section className="student-panel"><div className="student-panel-heading"><div><p className="student-kicker">Coming up</p><h3>Your schedule</h3></div><button className="student-text-button" onClick={() => onNavigate('updates')}>See updates <ChevronRight size={15} /></button></div><div className="class-row"><div className="class-date"><b>12</b><span>OCT</span></div><div><b>Technique lab</b><small>Saturday · 10:00 AM · Google Meet</small></div><span className="class-dot" /></div><div className="class-row"><div className="class-date"><b>19</b><span>OCT</span></div><div><b>Song study</b><small>Saturday · 10:00 AM · Google Meet</small></div><span className="class-dot muted" /></div></section><section className="student-panel student-notes"><p className="student-kicker">Latest from TFS</p><h3>Practice with intention.</h3><p>This week, spend ten minutes mapping the notes on your low E and A strings. Your next class will build on that shape.</p><button className="student-action" onClick={() => onNavigate('requests')}>Message your teacher <MessageSquare size={16} /></button></section></div></>;

const Payments = () => {
  const [fee, setFee] = useState(900);
  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');
  useEffect(() => { void supabase.from('fee_plans').select('amount').eq('active', true).order('amount').limit(1).maybeSingle().then(({ data }) => { if (data?.amount) setFee(Number(data.amount)); }); }, []);
  const applyCoupon = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedCode = couponCode.trim().toUpperCase();
    const { data: discount, error } = await supabase.from('discounts').select('*').eq('coupon_code', trimmedCode).eq('active', true).maybeSingle();
    if (error) { setDiscountAmount(0); setCouponMessage('Unable to validate this coupon right now.'); return; }
    if (!discount) { setDiscountAmount(0); setCouponMessage('Coupon not found or inactive.'); return; }

    const now = new Date();
    const validFrom = discount.valid_from ? new Date(discount.valid_from) : null;
    const validUntil = discount.valid_until ? new Date(discount.valid_until) : null;
    if (validFrom && validFrom > now) { setDiscountAmount(0); setCouponMessage('This coupon is not active yet.'); return; }
    if (validUntil && validUntil < now) { setDiscountAmount(0); setCouponMessage('This coupon has expired.'); return; }
    if (Number(discount.minimum_purchase ?? 0) > fee) { setDiscountAmount(0); setCouponMessage(`Minimum purchase of ₹${Number(discount.minimum_purchase).toLocaleString('en-IN')} is required.`); return; }

    const { count, error: usageError } = await supabase.from('payments').select('id', { count: 'exact', head: true }).eq('coupon_code', trimmedCode).in('status', ['paid', 'pending']);
    if (usageError) { setDiscountAmount(0); setCouponMessage('Unable to verify coupon usage.'); return; }
    if (Number(discount.coupon_count ?? 0) > 0 && Number(count ?? 0) >= Number(discount.coupon_count ?? 0)) { setDiscountAmount(0); setCouponMessage('This coupon has reached its usage limit.'); return; }

    const discountValue = Number(discount.discount_value ?? 0);
    const maximumDiscount = discount.maximum_discount_amount ? Number(discount.maximum_discount_amount) : null;
    let computedDiscount = 0;
    if (discount.discount_type === 'percentage') {
      computedDiscount = (fee * discountValue) / 100;
    } else {
      computedDiscount = discountValue;
    }
    if (maximumDiscount !== null && computedDiscount > maximumDiscount) computedDiscount = maximumDiscount;

    setDiscountAmount(computedDiscount);
    setCouponMessage(`${discount.discount_type === 'percentage' ? `${discountValue}%` : `₹${discountValue.toLocaleString('en-IN')}`} discount applied.`);
  };
  const payable = Math.max(0, fee - discountAmount);
  return <section className="student-panel"><p className="student-kicker">Account ledger</p><h2>Fees & payments</h2><div className="payment-summary"><div><span>Current balance</span><strong>₹{payable.toFixed(0)}</strong><small>{discountAmount ? `₹${fee} less ₹${discountAmount.toFixed(0)} coupon` : 'October tuition'}</small></div><button className="student-action">Pay securely <CircleDollarSign size={16} /></button></div><form onSubmit={applyCoupon} style={{ display: 'flex', gap: '.6rem', marginTop: '1.25rem', flexWrap: 'wrap' }}><input required value={couponCode} onChange={(event) => setCouponCode(event.target.value)} placeholder="Discount coupon" style={{ flex: '1 1 220px', minWidth: 0, padding: '.8rem 1rem', border: '1px solid rgba(255,255,255,.12)', borderRadius: '8px', background: 'rgba(255,255,255,.04)', color: 'var(--text-primary)', font: 'inherit' }} /><button className="student-action" type="submit" style={{ margin: 0 }}>Apply coupon</button></form>{couponMessage && <p className="student-muted" style={{ marginTop: '.6rem' }}>{couponMessage}</p>}<h3 className="student-section-title">Payment history</h3><div className="payment-row"><span><b>September 2026</b><small>Online Guitar Tuition</small></span><strong>₹{fee}</strong><em>Paid</em></div><div className="payment-row"><span><b>August 2026</b><small>Online Guitar Tuition</small></span><strong>₹{fee}</strong><em>Paid</em></div></section>;
};

const Updates = () => <section className="student-panel"><p className="student-kicker">Your learning timeline</p><h2>Class & schedule updates</h2><div className="update-item"><span className="update-icon"><CalendarDays size={18} /></span><div><b>Next class confirmed</b><p>Saturday, 10:00 AM. Your recurring online slot is reserved.</p><small>Updated today</small></div></div><div className="update-item"><span className="update-icon"><BookOpen size={18} /></span><div><b>New module unlocked</b><p>Neck mapping exercises are ready for your next practice session.</p><small>Updated 2 days ago</small></div></div><div className="update-item"><span className="update-icon"><FileText size={18} /></span><div><b>Plan review coming up</b><p>Your current 8-week plan is ready for a progress review after week 6.</p><small>Updated 1 week ago</small></div></div></section>;

const RequestPanel = ({ requestType, setRequestType, request, setRequest, submitRequest, requestLoading }: { requestType: string; setRequestType: (value: string) => void; request: string; setRequest: (value: string) => void; submitRequest: (event: FormEvent) => void; requestLoading: boolean }) => <section className="student-panel request-panel"><p className="student-kicker">Talk to the TFS team</p><h2>Request a change</h2><p className="student-muted">Ask about your plan, class timing, format, or anything that would help you learn better. We will review it and get back to you.</p><form onSubmit={submitRequest}><label>What would you like to change?<select value={requestType} onChange={(event) => setRequestType(event.target.value)}><option>Plan change</option><option>Schedule change</option><option>Class format change</option><option>Something else</option></select></label><label>Tell us more<textarea required rows={5} value={request} onChange={(event) => setRequest(event.target.value)} placeholder="Write your request here..." /></label><button className="student-action" type="submit" disabled={requestLoading}>{requestLoading ? 'Sending...' : 'Send request'} <ChevronRight size={16} /></button></form></section>;

export default StudentDashboard;
