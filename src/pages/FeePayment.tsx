import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { AlertCircle, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type FeeData = {
  name: string;
  phone: string;
  email: string;
  curriculum: string;
  classType: string;
  addons: string[];
  utr: string;
  payerName: string;
};

const CLASS_FEES = { 'Home Visit': 1500, 'Home Tuition': 1300, Online: 900 } as const;
const ADDONS = ['Song Writing — ₹500/month', 'Music Composing — ₹1,500/month'];
const initialData: FeeData = { name: '', phone: '', email: '', curriculum: '', classType: '', addons: [], utr: '', payerName: '' };

const loadImageData = async (src: string) => {
  const response = await fetch(src);
  if (!response.ok) throw new Error(`Unable to load receipt asset: ${src}`);
  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error(`Unable to prepare receipt asset: ${src}`));
    reader.readAsDataURL(blob);
  });
};

const FeePayment = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const [data, setData] = useState<FeeData>(initialData);
  const [step, setStep] = useState(1);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(300);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [receiptError, setReceiptError] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [studentProfile, setStudentProfile] = useState<{ curriculum: string; class_schedule: string | null } | null>(null);

  // Login modal states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const paymentReference = useMemo(() => `TFSFEE${new Date().toISOString().replace(/\D/g, '').slice(0, 14)}`, [startedAt]);
  const classFee = data.curriculum === 'Ukulele (Dotara)' ? 1500 :
    data.classType.startsWith('Home Visit') ? CLASS_FEES['Home Visit'] :
      data.classType.startsWith('Home Tuition') ? CLASS_FEES['Home Tuition'] :
        data.classType.startsWith('Online') ? CLASS_FEES.Online : 0;
  const addonFee = data.addons.reduce((sum, addon) => sum + (addon.startsWith('Song Writing') ? 500 : 1500), 0);
  const amount = classFee + addonFee;
  const upiUri = `upi://pay?pa=codr%40slc&pn=TFS%20-%20The%20Fretboard%20Society&am=${amount.toFixed(2)}&cu=INR&tr=${paymentReference}&tn=${encodeURIComponent(`TFS Monthly Fee - ${data.name || 'Student'}`)}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=12&data=${encodeURIComponent(upiUri)}`;

  useEffect(() => {
    if (authLoading) return;
    if (!user?.email) {
      setProfileLoading(false);
      setStudentProfile(null);
      return;
    }

    let active = true;
    const loadProfile = async () => {
      setProfileLoading(true);
      setProfileError('');
      const { data: profile, error: profileQueryError } = await supabase
        .from('student_profiles')
        .select('first_name,last_name,email,phone_number,curriculum,class_schedule,status')
        .eq('email', user.email)
        .eq('status', 'active')
        .maybeSingle();

      if (!active) return;
      if (profileQueryError) {
        setProfileError(profileQueryError.message);
      } else if (!profile) {
        setProfileError('Your account is not linked to an active student record. Please contact TFS administration.');
      } else {
        setStudentProfile(profile);
        setData((current) => ({
          ...current,
          name: `${profile.first_name} ${profile.last_name}`.trim(),
          email: profile.email,
          phone: profile.phone_number || '',
          curriculum: profile.curriculum || 'Guitar',
          classType: profile.class_schedule?.includes('Home Visit')
            ? 'Home Visit — ₹1,500/month'
            : profile.class_schedule?.includes('Home Tuition')
              ? 'Home Tuition — ₹1,300/month'
              : profile.class_schedule?.includes('Online')
                ? 'Online — ₹900/month'
                : '',
        }));
      }
      setProfileLoading(false);
    };

    void loadProfile();
    return () => { active = false; };
  }, [authLoading, user]);

  useEffect(() => {
    if (!startedAt) return;
    const timer = window.setInterval(() => setRemaining(Math.max(0, Math.floor((startedAt + 300000 - Date.now()) / 1000))), 1000);
    return () => window.clearInterval(timer);
  }, [startedAt]);

  const update = <K extends keyof FeeData>(field: K, value: FeeData[K]) => {
    setData((current) => ({ ...current, [field]: value }));
    setError('');
  };

  const choices = data.curriculum === 'Ukulele (Dotara)'
    ? ['Home Visit — ₹1,500/month']
    : ['Home Visit — ₹1,500/month', 'Home Tuition — ₹1,300/month', 'Online — ₹900/month'];

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    try {
      const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: loginPassword,
      });

      if (authErr) throw authErr;
      if (!authData.user) {
        throw new Error('Authentication failed. Please check your credentials.');
      }

      setLoginPassword('');
    } catch (err: any) {
      setLoginError(err.message || 'Failed to authenticate');
    } finally {
      setLoginLoading(false);
    }
  };

  const downloadReceipt = async () => {
    setReceiptError('');
    try {
      const [logo, signature] = await Promise.all([loadImageData('/images/logo_t.png'), loadImageData('/images/sign.png')]);
      const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
      const width = pdf.internal.pageSize.getWidth();
      const gold: [number, number, number] = [212, 175, 55];
      const cream: [number, number, number] = [248, 245, 237];
      const muted: [number, number, number] = [175, 175, 175];
      const money = (value: number) => `Rs. ${value.toLocaleString('en-IN')}`;
      pdf.setFillColor(5, 5, 5); pdf.rect(0, 0, width, 297, 'F');
      pdf.setDrawColor(...gold); pdf.rect(10, 10, width - 20, 277);
      pdf.addImage(logo, 'PNG', 20, 17, 34, 26, undefined, 'FAST');
      pdf.setTextColor(...gold); pdf.setFont('courier', 'bold'); pdf.setFontSize(17); pdf.text('THE FRETBOARD SOCIETY', 60, 26);
      pdf.setTextColor(...muted); pdf.setFontSize(10); pdf.text('MONTHLY FEE PAYMENT RECEIPT', 60, 33);
      pdf.line(20, 48, width - 20, 48);
      pdf.setTextColor(...cream); pdf.setFont('courier', 'normal'); pdf.text(`Receipt date: ${new Date().toLocaleDateString('en-IN')}`, 20, 59);
      pdf.text(`Payment reference: ${paymentReference}`, 20, 67);
      pdf.setTextColor(...gold); pdf.setFont('courier', 'bold'); pdf.setFontSize(15); pdf.text('PAYMENT SUMMARY', 20, 85);
      pdf.setDrawColor(80, 68, 35); pdf.line(20, 90, width - 20, 90);
      const details: Array<[string, string]> = [['Student name', data.name], ['Phone / WhatsApp', data.phone], ['Email', data.email], ['Curriculum', data.curriculum], ['Class type', data.classType], ['UPI payer name', data.payerName], ['UPI transaction ID / UTR', data.utr]];
      let y = 102;
      details.forEach(([label, value]) => { pdf.setTextColor(...muted); pdf.text(label, 22, y); pdf.setTextColor(...cream); pdf.text(value || '—', 78, y); y += 8; });
      y += 5; pdf.setTextColor(...gold); pdf.setFontSize(15); pdf.text('FEE BREAKUP', 20, y); y += 10; pdf.setDrawColor(80, 68, 35); pdf.line(20, y, width - 20, y); y += 9;
      const rows: Array<[string, string]> = [[`Monthly tuition · ${data.curriculum}`, `${money(classFee)}/month`], ...data.addons.map((addon) => [`Add-on · ${addon.split(' — ')[0]}`, `${money(addon.startsWith('Song Writing') ? 500 : 1500)}/month`] as [string, string])];
      rows.forEach(([label, value]) => { pdf.setTextColor(...muted); pdf.text(label, 22, y); pdf.setTextColor(...cream); pdf.text(value, width - 22, y, { align: 'right' }); y += 8; });
      pdf.setDrawColor(...gold); pdf.line(20, y + 1, width - 20, y + 1); y += 11; pdf.setTextColor(...gold); pdf.setFontSize(11); pdf.text('TOTAL PAID / PAYABLE NOW', 22, y); pdf.text(money(amount), width - 22, y, { align: 'right' });
      pdf.setTextColor(...muted); pdf.setFontSize(9); pdf.setFont('courier', 'normal'); pdf.text('Payment status: PENDING VERIFICATION', 22, y + 9);
      pdf.addImage(signature, 'PNG', width - 68, 244, 40, 18, undefined, 'FAST'); pdf.line(width - 75, 264, width - 22, 264); pdf.setTextColor(...cream); pdf.text('Authorised signature', width - 75, 271);
      pdf.save(`TFS-Fee-Receipt-${paymentReference}.pdf`);
    } catch (receiptGenerationError) {
      setReceiptError(receiptGenerationError instanceof Error ? receiptGenerationError.message : 'Receipt download failed.');
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (remaining === 0) { setError('The payment session expired. Generate a new QR.'); setStep(2); return; }
    setSubmitting(true); setError('');
    try {
      const apiUrl = import.meta.env.VITE_ADMISSION_API_URL as string | undefined;
      if (apiUrl) {
        const formData = new URLSearchParams();
        Object.entries({ name: data.name, phone: data.phone, email: data.email, address: 'Monthly fee payment', profession: 'Existing student', curriculum: data.curriculum, classType: data.classType, addons: data.addons.join(', '), schedule: 'Monthly fee payment', utr: data.utr, payerName: data.payerName, paymentReference, paymentType: 'feePayment', paymentAmount: amount }).forEach(([key, value]) => formData.append(key, String(value)));
        await fetch(apiUrl, { method: 'POST', mode: 'no-cors', body: formData });
      }
      setCompleted(true);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Payment submission failed.');
    } finally { setSubmitting(false); }
  };

  // Auth Loading Screen
  if (authLoading) {
    return (
      <div className="admission-page">
        <div className="admission-card admission-loading">
          <div className="admission-brand">
            <img src="/images/logo_t.png" alt="TFS — The Fretboard Society" />
            <h1>Loading session</h1>
            <p>Checking student authentication…</p>
          </div>
        </div>
      </div>
    );
  }

  // Not Logged In: Show Login Modal First (Without Route Redirection)
  if (!user) {
    return (
      <div className="admission-page">
        <div className="fee-login-modal-overlay">
          <div className="fee-login-modal-card">
            <div className="fee-login-modal-header">
              <img src="/images/logo_t.png" alt="TFS — The Fretboard Society" className="fee-login-logo" />
              <span className="fee-login-badge">STUDENT PORTAL</span>
              <p className="fee-login-eyebrow">THE FRETBOARD SOCIETY</p>
              <h2>Student Login</h2>
              <p className="fee-login-sub">Please sign in with your student credentials to open your fee payment form.</p>
            </div>

            {loginError && (
              <div className="fee-login-error" role="alert">
                <AlertCircle size={18} />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="fee-login-form">
              <div className="fee-login-field">
                <label>Student Email Address</label>
                <div className="fee-login-input-wrap">
                  <Mail size={18} className="fee-login-icon" />
                  <input
                    type="email"
                    required
                    placeholder="student@example.com"
                    value={loginEmail}
                    onChange={(e) => {
                      setLoginEmail(e.target.value);
                      setLoginError('');
                    }}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="fee-login-field">
                <label>Password</label>
                <div className="fee-login-input-wrap">
                  <Lock size={18} className="fee-login-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value);
                      setLoginError('');
                    }}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="fee-login-pwd-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="admission-primary fee-login-submit"
                disabled={loginLoading}
              >
                {loginLoading ? 'Verifying Student Account…' : 'Sign In & Open Fee Payment →'}
              </button>
            </form>

            <div className="fee-login-footer">
              <Link to="/" className="fee-login-back-link">
                ← Return to TFS Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Profile Loading Screen
  if (profileLoading) {
    return (
      <div className="admission-page">
        <div className="admission-card admission-loading">
          <div className="admission-brand">
            <img src="/images/logo_t.png" alt="TFS — The Fretboard Society" />
            <h1>Loading student account</h1>
            <p>Fetching your TFS student profile…</p>
          </div>
        </div>
      </div>
    );
  }

  // Profile Error / Inactive Account Screen
  if (profileError || !studentProfile) {
    return (
      <div className="admission-page">
        <div className="admission-card">
          <div className="admission-brand">
            <img src="/images/logo_t.png" alt="TFS — The Fretboard Society" />
            <h1>Payment access unavailable</h1>
            <p>{profileError || 'No active student profile was found.'}</p>
            <div style={{ marginTop: '1.75rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button type="button" className="admission-primary" onClick={() => void signOut()}>
                Sign in with another account
              </button>
              <Link to="/" className="admission-secondary">
                Return to TFS Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active Student: Fee Payment Form
  return (
    <div className="admission-page">
      <div className="admission-card">
        <div className="admission-brand">
          <img src="/images/logo_t.png" alt="TFS — The Fretboard Society" />
          <p className="admission-eyebrow">THE FRETBOARD SOCIETY</p>
          <h1>Monthly Fee Payment</h1>
          <p>SECURE UPI PAYMENT</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginTop: '0.6rem' }}>
            <small className="admission-account-badge" style={{ marginTop: 0 }}>Signed in as {data.email}</small>
            <button
              type="button"
              onClick={() => void signOut()}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--gold)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: 0
              }}
            >
              Sign out
            </button>
          </div>
        </div>

        <div className="admission-progress">
          <span style={{ width: `${(step / 2) * 100}%` }} />
        </div>

        {!completed ? (
          <form onSubmit={submit}>
            {step === 1 && (
              <section className="admission-step">
                <h2>01 — Choose Payment</h2>
                <div className="admission-account-panel">
                  <span>Verified student account</span>
                  <strong>{data.name}</strong>
                  <small>{data.email}</small>
                </div>

                <div className="admission-fields">
                  <label>
                    Student Name
                    <input readOnly value={data.name} />
                  </label>
                  <label>
                    Phone / WhatsApp
                    <input readOnly value={data.phone} />
                  </label>
                  <label>
                    Email
                    <input readOnly type="email" value={data.email} />
                  </label>
                </div>

                <div className="admission-plan-heading">
                  <h3>{data.curriculum}</h3>
                  <small>Plan from your student profile</small>
                </div>

                {data.curriculum && (
                  <div className="admission-choices">
                    {choices.map((choice) => (
                      <label className={`admission-choice ${data.classType === choice ? 'selected' : ''}`} key={choice}>
                        <input
                          type="radio"
                          required
                          name="classType"
                          checked={data.classType === choice}
                          onChange={() => update('classType', choice)}
                        />
                        <span>{choice}</span>
                      </label>
                    ))}
                  </div>
                )}

                <div className="admission-choices">
                  {ADDONS.map((addon) => {
                    const selected = data.addons.includes(addon);
                    return (
                      <label className={`admission-choice ${selected ? 'selected' : ''}`} key={addon}>
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => update('addons', selected ? data.addons.filter((item) => item !== addon) : [...data.addons, addon])}
                        />
                        <span>{addon}</span>
                      </label>
                    );
                  })}
                </div>

                <div className="admission-fee-summary">
                  <span>Monthly fee with selected add-ons</span>
                  <strong>₹{amount.toLocaleString('en-IN')}</strong>
                </div>

                <div className="admission-actions">
                  <span />
                  <button
                    type="button"
                    className="admission-primary"
                    disabled={!data.classType}
                    onClick={() => {
                      setStartedAt(Date.now());
                      setRemaining(300);
                      setStep(2);
                    }}
                  >
                    Continue to Payment →
                  </button>
                </div>
              </section>
            )}

            {step === 2 && (
              <section className="admission-step">
                <h2>02 — Pay {amount.toLocaleString('en-IN')} Total</h2>
                <div className="admission-payment">
                  <div>
                    <div className="admission-amount">₹{amount.toLocaleString('en-IN')}</div>
                    <b>UPI: codr@slc</b>
                    <p className="admission-note">This QR is for your selected monthly fee and add-ons. It is valid for 5 minutes.</p>
                    <div className="admission-status">
                      Time remaining <strong className={remaining === 0 ? 'expired' : ''}>
                        {String(Math.floor(remaining / 60)).padStart(2, '0')}:{String(remaining % 60).padStart(2, '0')}
                      </strong>
                    </div>
                    <code>{paymentReference}</code>
                  </div>
                  <div className="admission-qr">
                    {remaining ? <img src={qrUrl} alt={`UPI payment QR code for Rs. ${amount}`} /> : <b>QR EXPIRED</b>}
                  </div>
                </div>

                <label>
                  UPI Transaction ID / UTR *
                  <input required minLength={6} value={data.utr} onChange={(event) => update('utr', event.target.value)} />
                </label>
                <label>
                  Name used for UPI payment *
                  <input required value={data.payerName} onChange={(event) => update('payerName', event.target.value)} />
                </label>

                <div className="admission-actions">
                  <button type="button" className="admission-secondary" onClick={() => setStep(1)}>
                    ← Back
                  </button>
                  <button type="submit" className="admission-primary" disabled={submitting}>
                    {submitting ? 'Submitting…' : 'Submit Payment'}
                  </button>
                </div>
              </section>
            )}

            {error && <p className="admission-error" role="alert">{error}</p>}
          </form>
        ) : (
          <section className="admission-success">
            <h2>Payment Submitted</h2>
            <p>Your monthly fee payment has been submitted for verification.</p>
            <p><b>Payment reference:</b> {paymentReference}</p>
            <p><b>Amount:</b> Rs. {amount.toLocaleString('en-IN')}</p>
            <div className="admission-success-actions">
              <button type="button" className="admission-primary" onClick={() => void downloadReceipt()}>
                Download payment receipt
              </button>
              <Link className="admission-secondary" to="/">
                Return to TFS
              </Link>
            </div>
            {receiptError && <p className="admission-error">{receiptError}</p>}
          </section>
        )}
      </div>
    </div>
  );
};

export default FeePayment;
