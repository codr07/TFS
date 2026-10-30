import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { saveAdmissionLocally, submitAdmissionToSpreadsheet } from '../lib/tfsData';

type AdmissionData = {
  name: string;
  phone: string;
  email: string;
  address: string;
  profession: string;
  curriculum: string;
  classType: string;
  addons: string[];
  schedule: string;
  utr: string;
  payerName: string;
};

const initialData: AdmissionData = {
  name: '',
  phone: '',
  email: '',
  address: '',
  profession: '',
  curriculum: '',
  classType: '',
  addons: [],
  schedule: '',
  utr: '',
  payerName: '',
};

const schedules = [
  ['Friday — 8:00 PM – 11:00 PM', 'Core lessons and one-to-one sessions.'],
  ['Saturday — 10:00 AM – 1:00 PM', 'Group and personalized sessions.'],
  ['Saturday — 7:00 PM – 11:00 PM', 'Evening learning sessions.'],
  ['Sunday — 10:00 AM – 1:00 PM', 'Weekend practice and lessons.'],
  ['Sunday — 7:00 PM – 11:00 PM', 'Evening learning sessions.'],
];

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

const ADMISSION_FEE = 1000;
const HOME_TUITION_ADDRESS = 'ARD, Cafe, 540/286, Thirumenahalli Main Rd, Agrahara Layout, Bengaluru, Tirumalali Road, Karnataka 560064';
const HOME_TUITION_MAP_URL = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(HOME_TUITION_ADDRESS)}`;
const HOME_TUITION_EMBED_URL = `https://www.google.com/maps?q=${encodeURIComponent(HOME_TUITION_ADDRESS)}&output=embed`;
const CLASS_FEES = {
  'Home Visit': 1500,
  'Home Tuition': 1300,
  Online: 900,
} as const;

const AdmissionForm = () => {
  const location = useLocation();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<AdmissionData>(initialData);

  // Pick up preselected curriculum and add-ons from advertisement popup
  useEffect(() => {
    const state = location.state as { preselectedCurriculum?: string; preselectedAddon?: string } | undefined;
    if (state?.preselectedCurriculum) {
      setData((prev) => {
        const nextAddons = state.preselectedAddon && !prev.addons.includes(state.preselectedAddon)
          ? [...prev.addons, state.preselectedAddon]
          : prev.addons;
        return {
          ...prev,
          curriculum: state.preselectedCurriculum || prev.curriculum,
          addons: nextAddons,
        };
      });
    }
  }, [location.state]);
  const [paymentStartedAt, setPaymentStartedAt] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [finalName, setFinalName] = useState('');
  const [applicationDate, setApplicationDate] = useState(new Date().toISOString().slice(0, 10));
  const [admissionId, setAdmissionId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(300);
  const [receiptError, setReceiptError] = useState('');

  const paymentReference = useMemo(
    () => `TFS${new Date().toISOString().replace(/\D/g, '').slice(0, 14)}`,
    [paymentStartedAt],
  );
  const selectedClassFee = data.classType.startsWith('Home Visit')
    ? CLASS_FEES['Home Visit']
    : data.classType.startsWith('Home Tuition')
      ? CLASS_FEES['Home Tuition']
      : data.classType.startsWith('Online')
        ? CLASS_FEES.Online
        : 0;
  const monthlyFee = data.curriculum === 'Ukulele (Dotara)' ? 1500 : selectedClassFee;
  const addonFee = data.addons.reduce((total, addon) => (
    total + (addon.startsWith('Song Writing') ? 500 : addon.startsWith('Music Composing') ? 1500 : 0)
  ), 0);
  const totalMonthlyFee = monthlyFee + addonFee;
  const paymentAmount = ADMISSION_FEE + totalMonthlyFee;
  const upiUri = `upi://pay?pa=codr%40slc&pn=TFS%20-%20The%20Fretboard%20Society&am=${paymentAmount.toFixed(2)}&cu=INR&tr=${paymentReference}&tn=${encodeURIComponent(`TFS Admission + ${data.curriculum || 'Plan'}`)}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=12&data=${encodeURIComponent(upiUri)}`;

  const downloadReceipt = async (receiptAdmissionId: string) => {
    setReceiptError('');
    try {
      const [logo, signature] = await Promise.all([
        loadImageData('/images/logo_t.png'),
        loadImageData('/images/sign.png'),
      ]);
      const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const gold: [number, number, number] = [212, 175, 55];
      const cream: [number, number, number] = [248, 245, 237];
      const muted: [number, number, number] = [175, 175, 175];
      const left = 20;
      const right = pageWidth - 20;
      const valueX = 78;
      const amountX = right - 2;
      const money = (amount: number) => `Rs. ${amount.toLocaleString('en-IN')}`;
      const cleanClassType = data.classType.replace(/\s*[—-]\s*Rs\.?\s*[\d,]+(?:\/month)?/i, '').replace(/\s*[—-]\s*₹\s*[\d,]+(?:\/month)?/i, '').trim();
      const drawWrapped = (text: string, x: number, startY: number, maxWidth: number, lineHeight = 5) => {
        const lines = pdf.splitTextToSize(text || '—', maxWidth) as string[];
        pdf.text(lines, x, startY);
        return startY + lines.length * lineHeight;
      };

      pdf.setFillColor(5, 5, 5);
      pdf.rect(0, 0, pageWidth, 297, 'F');
      pdf.setDrawColor(...gold);
      pdf.setLineWidth(.5);
      pdf.rect(10, 10, pageWidth - 20, 277);
      // Keep the brand mark in a fixed box so the header remains balanced
      // even when the source logo has transparent padding.
      pdf.addImage(logo, 'PNG', left, 17, 34, 26, undefined, 'FAST');
      pdf.setTextColor(...gold);
      pdf.setFont('courier', 'bold');
      pdf.setFontSize(17);
      pdf.text('THE FRETBOARD SOCIETY', 60, 26);
      pdf.setFontSize(10);
      pdf.setTextColor(...muted);
      pdf.text('STUDENT ADMISSION PAYMENT RECEIPT', 60, 33);
      pdf.setDrawColor(...gold);
      pdf.line(left, 48, right, 48);

      pdf.setTextColor(...cream);
      pdf.setFont('courier', 'normal');
      pdf.setFontSize(10);
      pdf.text(`Receipt date: ${new Date().toLocaleDateString('en-IN')}`, left, 59);
      pdf.text(`Admission ID: ${receiptAdmissionId}`, left, 67);
      drawWrapped(`Payment reference: ${paymentReference}`, left, 75, right - left);
      pdf.setTextColor(...gold);
      pdf.setFontSize(15);
      pdf.setFont('courier', 'bold');
      pdf.text('PAYMENT SUMMARY', left, 91);
      pdf.setDrawColor(80, 68, 35);
      pdf.line(left, 96, right, 96);

      const rows: Array<[string, string]> = [
        ['Student name', data.name],
        ['Phone / WhatsApp', data.phone],
        ['Email', data.email],
        ['Curriculum', data.curriculum],
        ['Class type', data.classType],
        ['Preferred schedule', data.schedule],
        ['UPI payer name', data.payerName],
        ['UPI transaction ID / UTR', data.utr],
      ];
      let y = 108;
      pdf.setFontSize(10);
      rows.forEach(([label, value]) => {
        pdf.setTextColor(...muted);
        pdf.text(label, 22, y);
        pdf.setTextColor(...cream);
        const nextY = drawWrapped(value, valueX, y, right - valueX - 2);
        y = Math.max(y + 8, nextY);
      });

      y += 5;
      pdf.setTextColor(...gold);
      pdf.setFontSize(15);
      pdf.setFont('courier', 'bold');
      pdf.text('FEE BREAKUP', left, y);
      y += 8;
      pdf.setDrawColor(80, 68, 35);
      pdf.line(left, y, right, y);
      y += 9;
      const feeRows: Array<[string, string]> = [
        ['One-time admission charge', money(ADMISSION_FEE)],
        [`Monthly tuition · ${data.curriculum}`, `${money(monthlyFee)}/month`],
        ...data.addons.map((addon) => [
          `Add-on · ${addon.replace(/\s*[—-]\s*(?:Rs\.?|₹)\s*[\d,]+(?:\/month)?/i, '').trim()}`,
          `${money(addon.startsWith('Song Writing') ? 500 : 1500)}/month`,
        ] as [string, string]),
      ];
      feeRows.forEach(([label, value]) => {
        pdf.setTextColor(...muted);
        const labelLines = pdf.splitTextToSize(label, 115) as string[];
        pdf.text(labelLines, 22, y);
        pdf.setTextColor(...cream);
        pdf.text(value, amountX, y, { align: 'right' });
        y += Math.max(8, labelLines.length * 5);
      });
      pdf.setTextColor(...muted);
      pdf.setFontSize(9);
      pdf.text(`Class type: ${data.curriculum} · ${cleanClassType}`, 22, y - 2);
      pdf.setDrawColor(...gold);
      pdf.line(left, y + 1, right, y + 1);
      y += 11;
      pdf.setTextColor(...gold);
      pdf.setFont('helvetica', 'bold');
      pdf.setFont('courier', 'bold');
      pdf.setFontSize(11);
      pdf.text('TOTAL PAID / PAYABLE NOW', 22, y);
      pdf.text(money(paymentAmount), amountX, y, { align: 'right' });
      y += 7;
      pdf.setFont('courier', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(...muted);
      y = drawWrapped(`Monthly tuition after admission: ${money(totalMonthlyFee)}/month`, 22, y, right - left);
      pdf.text('Payment status: PENDING VERIFICATION', 22, y + 2);
      pdf.addImage(signature, 'PNG', pageWidth - 68, 244, 40, 18, undefined, 'FAST');
      pdf.setDrawColor(...gold);
      pdf.line(pageWidth - 75, 264, pageWidth - 22, 264);
      pdf.setTextColor(...cream);
      pdf.text('Authorised signature', pageWidth - 75, 271);
      pdf.setTextColor(...muted);
      pdf.setFont('courier', 'normal');
      pdf.setFontSize(8);
      drawWrapped('Please retain this receipt. Admission is confirmed after payment verification by TFS.', left, 286, right - left, 4);
      pdf.save(`TFS-Admission-Receipt-${receiptAdmissionId}.pdf`);
    } catch (receiptGenerationError) {
      setReceiptError(receiptGenerationError instanceof Error ? receiptGenerationError.message : 'Receipt download failed.');
    }
  };

  useEffect(() => {
    if (!paymentStartedAt) return;
    const timer = window.setInterval(() => {
      setRemainingSeconds(Math.max(0, Math.floor((paymentStartedAt + 300000 - Date.now()) / 1000)));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [paymentStartedAt]);

  const update = (field: keyof AdmissionData, value: string | string[]) => {
    setData((current) => ({ ...current, [field]: value }));
    setError('');
  };

  const goToStep = (nextStep: number) => {
    setError('');
    setStep(nextStep);
  };

  const validateAndContinue = () => {
    if (step === 1) {
      if (!data.name || !data.phone || !data.email || !data.address || !data.profession) {
        setError('Please complete all required student details.');
        return;
      }
      if (!/^[6-9]\d{9}$/.test(data.phone)) {
        setError('Please enter a valid 10-digit Indian mobile number.');
        return;
      }
    }
    if (step === 2 && !data.curriculum) setError('Please select a curriculum.');
    else if (step === 3 && !data.classType) setError('Please select a class type.');
    else if (step === 5 && !data.schedule) setError('Please select a preferred schedule.');
    else goToStep(step + 1);
  };

  const startPayment = () => {
    if (!data.schedule) {
      setError('Please select a preferred schedule.');
      return;
    }
    setPaymentStartedAt(Date.now());
    setRemainingSeconds(300);
    goToStep(6);
  };

  const validatePayment = () => {
    if (remainingSeconds === 0) {
      setError('This payment QR has expired. Generate a new QR before continuing.');
      return;
    }
    if (data.utr.trim().length < 6 || !data.payerName.trim()) {
      setError('Enter the UPI transaction ID / UTR and the payer name.');
      return;
    }
    setFinalName(data.name);
    goToStep(7);
  };

  const submitForm = async (event: FormEvent) => {
    event.preventDefault();
    if (!declarationAccepted || !finalName.trim() || !applicationDate) {
      setError('Accept the declaration and confirm the name and application date.');
      return;
    }
    if (remainingSeconds === 0) {
      setError('Your payment session has expired. Please generate a new QR.');
      goToStep(6);
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      const generatedAdmissionId = `TFS-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${paymentReference.slice(-5)}`;
      setAdmissionId(generatedAdmissionId);

      const cleanPhone = data.phone.replace(/\D/g, '').slice(-10);

      const admissionRecord = {
        id: `adm-${Date.now()}`,
        timestamp: new Date().toISOString(),
        admission_id: generatedAdmissionId,
        payment_reference: paymentReference,
        payment_status: 'PENDING VERIFICATION' as const,
        utr: data.utr.trim(),
        payer_name: data.payerName.trim(),
        student_name: data.name.trim(),
        phone: cleanPhone,
        email: data.email.trim(),
        address: data.address.trim(),
        profession: data.profession.trim(),
        curriculum: data.curriculum,
        class_type: data.classType,
        addons: data.addons.join(', '),
        schedule: data.schedule,
        admission_fee: ADMISSION_FEE,
        base_tuition_fee: monthlyFee,
        addon_fee: addonFee,
        total_monthly_fee: `₹${totalMonthlyFee}/month`,
        payment_amount: paymentAmount,
      };

      // Always save locally so no submission is lost
      await saveAdmissionLocally(admissionRecord);

      // Send to Google Sheet
      await submitAdmissionToSpreadsheet({
        ...data,
        phone: cleanPhone,
        admissionId: generatedAdmissionId,
        addons: data.addons.join(', '),
        paymentReference,
        applicationDate,
        monthlyFee: `₹${totalMonthlyFee}/month`,
        paymentAmount,
      });

      goToStep(8);
      await downloadReceipt(generatedAdmissionId);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const radioChoices = (field: 'curriculum' | 'classType') => {
    const choices = field === 'curriculum'
      ? ['Guitar', 'Ukulele (Standard)', 'Ukulele (Dotara)']
      : data.curriculum === 'Ukulele (Dotara)'
        ? ['Home Visit — ₹1,500/month']
        : ['Home Visit — ₹1,500/month', 'Home Tuition — ₹1,300/month', 'Online — ₹900/month'];
    return choices.map((choice) => (
      <label className={`admission-choice ${data[field] === choice ? 'selected' : ''}`} key={choice}>
        <input type="radio" name={field} value={choice} checked={data[field] === choice} onChange={() => {
          if (field === 'curriculum') {
            setData((current) => ({ ...current, curriculum: choice, classType: '' }));
            setError('');
          } else {
            update(field, choice);
          }
        }} />
        <span>{choice}</span>
        {choice === 'Ukulele (Dotara)' && <small>Home Visit only: ₹1,500/month</small>}
      </label>
    ));
  };

  return (
    <div className="admission-page">
      <div className="admission-card">
        <div className="admission-brand">
          <img src="/images/logo_t.png" alt="TFS — The Fretboard Society" />
          <p className="admission-eyebrow">THE FRETBOARD SOCIETY</p>
          <h1>Student Admission</h1>
          <p>LEARN. PLAY. EXPRESS.</p>
        </div>
        <div className="admission-progress"><span style={{ width: `${(Math.min(step, 7) / 7) * 100}%` }} /></div>

        <form onSubmit={submitForm}>
          {step === 1 && <section className="admission-step"><h2>01 — Student Details</h2><div className="admission-fields">
            <label>Full Name *<input required value={data.name} onChange={(event) => update('name', event.target.value)} /></label>
            <label>Phone / WhatsApp *<input required inputMode="numeric" maxLength={10} value={data.phone} onChange={(event) => update('phone', event.target.value.replace(/\D/g, ''))} /></label>
            <label>Email *<input required type="email" value={data.email} onChange={(event) => update('email', event.target.value)} /></label>
            <label>Full Address *<textarea required value={data.address} onChange={(event) => update('address', event.target.value)} /></label>
            <label>Current Profession *<input required value={data.profession} onChange={(event) => update('profession', event.target.value)} /></label>
          </div><div className="admission-actions"><span /><button type="button" className="admission-primary" onClick={validateAndContinue}>Continue →</button></div></section>}

          {step === 2 && <section className="admission-step"><h2>02 — Curriculum</h2><div className="admission-choices">{radioChoices('curriculum')}</div><p className="admission-note">Guitar and Ukulele (Standard) share the same Home Visit, Home Tuition, and Online plans. Ukulele (Dotara) is available only as Home Visit at ₹1,500/month.</p><div className="admission-actions"><button type="button" className="admission-secondary" onClick={() => goToStep(1)}>← Back</button><button type="button" className="admission-primary" onClick={validateAndContinue}>Continue →</button></div></section>}

          {step === 3 && <section className="admission-step"><h2>03 — Class Type</h2><div className="admission-choices">{radioChoices('classType')}</div><div className="admission-fee-summary"><span>Monthly tuition for {data.curriculum || 'selected curriculum'}</span><strong>₹{monthlyFee.toLocaleString('en-IN')}/month</strong></div><div className="admission-location"><div className="admission-location-heading"><span className="admission-location-pin" aria-hidden="true">⌖</span><div><b>Home Tuition Location</b><small>Visit lessons are available at this address</small></div></div><div className="admission-map-frame"><iframe title="TFS home tuition location" src={HOME_TUITION_EMBED_URL} loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></div><p className="admission-location-address">{HOME_TUITION_ADDRESS}</p><a className="admission-map-link" href={HOME_TUITION_MAP_URL} target="_blank" rel="noreferrer">Open directions in Google Maps <span aria-hidden="true">↗</span></a></div><div className="admission-actions"><button type="button" className="admission-secondary" onClick={() => goToStep(2)}>← Back</button><button type="button" className="admission-primary" onClick={validateAndContinue}>Continue →</button></div></section>}

          {step === 4 && <section className="admission-step"><h2>04 — Optional Add-ons</h2><div className="admission-choices">
            {['Song Writing — ₹500/month', 'Music Composing — ₹1,500/month'].map((addon) => { const selected = data.addons.includes(addon); return <label className={`admission-choice ${selected ? 'selected' : ''}`} key={addon}><input type="checkbox" checked={selected} onChange={() => update('addons', selected ? data.addons.filter((item) => item !== addon) : [...data.addons, addon])} /><span>{addon}</span></label>; })}
          </div><p className="admission-note">Add-ons are optional and charged monthly in addition to the selected curriculum and class fee.</p><div className="admission-fee-summary"><span>Current monthly tuition</span><strong>₹{totalMonthlyFee.toLocaleString('en-IN')}/month</strong></div><div className="admission-actions"><button type="button" className="admission-secondary" onClick={() => goToStep(3)}>← Back</button><button type="button" className="admission-primary" onClick={validateAndContinue}>Continue →</button></div></section>}

          {step === 5 && <section className="admission-step"><h2>05 — Preferred Schedule</h2><div className="admission-choices">{schedules.map(([schedule, note]) => <label className={`admission-choice ${data.schedule === schedule ? 'selected' : ''}`} key={schedule}><input type="radio" name="schedule" checked={data.schedule === schedule} onChange={() => update('schedule', schedule)} /><span>{schedule}<small>{note}</small></span></label>)}</div><div className="admission-fee-summary"><span>Monthly tuition after your selections</span><strong>₹{totalMonthlyFee.toLocaleString('en-IN')}/month</strong></div><div className="admission-actions"><button type="button" className="admission-secondary" onClick={() => goToStep(4)}>← Back</button><button type="button" className="admission-primary" onClick={startPayment}>Continue to Payment →</button></div></section>}

          {step === 6 && <section className="admission-step"><h2>06 — Pay ₹{paymentAmount.toLocaleString('en-IN')} Total</h2><div className="admission-payment"><div><div className="admission-amount">₹{paymentAmount.toLocaleString('en-IN')}</div><b>UPI: codr@slc</b><p className="admission-note">This QR includes the one-time ₹{ADMISSION_FEE.toLocaleString('en-IN')} admission charge plus your selected monthly plan. Scan the QR with your preferred UPI app. The QR is valid for 5 minutes.</p><div className="admission-fee-summary"><span>Admission charge</span><strong>₹{ADMISSION_FEE.toLocaleString('en-IN')}</strong></div><div className="admission-fee-summary"><span>Selected monthly tuition</span><strong>₹{totalMonthlyFee.toLocaleString('en-IN')}</strong></div><div className="admission-status">Time remaining<strong className={remainingSeconds === 0 ? 'expired' : ''}>{String(Math.floor(remainingSeconds / 60)).padStart(2, '0')}:{String(remainingSeconds % 60).padStart(2, '0')}</strong></div><p className="admission-note">Payment reference:</p><code>{paymentReference}</code></div><div className="admission-qr">{remainingSeconds ? <img src={qrUrl} alt={`UPI payment QR code for ₹${paymentAmount}`} /> : <b>QR EXPIRED</b>}</div></div><label>UPI Transaction ID / UTR *<input required value={data.utr} onChange={(event) => update('utr', event.target.value)} placeholder="Enter the UTR / transaction reference" /></label><label>Name used for UPI payment *<input required value={data.payerName} onChange={(event) => update('payerName', event.target.value)} /></label><div className="admission-actions"><button type="button" className="admission-secondary" onClick={() => goToStep(5)}>← Back</button><button type="button" className="admission-primary" onClick={validatePayment}>Payment Completed →</button></div></section>}

          {step === 7 && <section className="admission-step"><h2>07 — Final Declaration &amp; Submit</h2><div className="admission-status admission-warning">Your application will be recorded as <b>PENDING VERIFICATION</b>.</div><label className="admission-declaration"><input type="checkbox" checked={declarationAccepted} onChange={(event) => setDeclarationAccepted(event.target.checked)} />I confirm that the information provided is correct, I have paid the ₹1,000 admission fee, and the UTR entered above is accurate.</label><label>Student Name — Final Confirmation *<input required value={finalName} onChange={(event) => setFinalName(event.target.value)} /></label><label>Date of Application *<input required type="date" value={applicationDate} onChange={(event) => setApplicationDate(event.target.value)} /></label><div className="admission-actions"><button type="button" className="admission-secondary" onClick={() => goToStep(6)}>← Back</button><button type="submit" className="admission-primary" disabled={isSubmitting}>{isSubmitting ? 'Submitting…' : 'Submit Admission'}</button></div></section>}

          {step === 8 && <section className="admission-success"><h2>Admission Application Received</h2><p>Your TFS admission application has been recorded for payment verification.</p><p><b>Admission ID:</b> {admissionId}</p><p><b>Payment Reference:</b> {paymentReference}</p><p><b>Total paid / payable now:</b> ₹{paymentAmount.toLocaleString('en-IN')}</p><p>Status: <b>PENDING PAYMENT VERIFICATION</b></p><div className="admission-success-actions"><button type="button" className="admission-primary" onClick={() => void downloadReceipt(admissionId)}>Download payment receipt</button><Link className="admission-secondary" to="/">Return to TFS</Link></div>{receiptError && <p className="admission-error" role="alert">{receiptError}</p>}</section>}
          {error && <p className="admission-error" role="alert">{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default AdmissionForm;
