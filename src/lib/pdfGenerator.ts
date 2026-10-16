import { jsPDF } from 'jspdf';
import type { StudentProfile, FeePaymentRecord } from './tfsData';

// Helper to load image URL as base64 DataURL for jsPDF embedding
async function loadImgDataUrl(src: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export async function generateStudentIdCardPdf(
  student: StudentProfile | null,
  displayName: string,
  studentIdBadge: string,
  feeSummary?: { basePlanName: string; totalAmount: number }
): Promise<void> {
  // Pre-load assets
  const [logoData, signData, avatarData] = await Promise.all([
    loadImgDataUrl('/images/logo_t.png'),
    loadImgDataUrl('/images/sign.png'),
    student?.avatar_url ? loadImgDataUrl(student.avatar_url) : Promise.resolve(null),
  ]);

  // A4 Landscape format
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 297mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 210mm

  // Background deep dark luxury tone
  doc.setFillColor(15, 17, 22);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Outer gold luxury frame
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(2.5);
  doc.roundedRect(12, 12, pageWidth - 24, pageHeight - 24, 6, 6, 'S');

  // Inner subtle border
  doc.setDrawColor(80, 68, 35);
  doc.setLineWidth(0.8);
  doc.roundedRect(16, 16, pageWidth - 32, pageHeight - 32, 4, 4, 'S');

  // Header Banner
  doc.setFillColor(25, 28, 36);
  doc.rect(17, 17, pageWidth - 34, 38, 'F');

  // Embed Official TFS Logo
  if (logoData) {
    try {
      doc.addImage(logoData, 'PNG', 24, 21, 24, 24);
    } catch {}
  }

  const headerTextX = logoData ? 53 : 26;

  // Top header text
  doc.setTextColor(212, 175, 55);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(23);
  doc.text('THE FRETBOARD SOCIETY', headerTextX, 32);

  doc.setTextColor(175, 175, 175);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('ACOUSTIC GUITAR & UKULELE MASTERY ACADEMY • OFFICIAL SCHOLAR PASS', headerTextX, 42);

  // Status Badge on Header Right
  doc.setFillColor(40, 167, 69);
  doc.roundedRect(pageWidth - 78, 22, 52, 9, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('VERIFIED SCHOLAR', pageWidth - 52, 28, { align: 'center' });

  doc.setTextColor(212, 175, 55);
  doc.setFont('courier', 'bold');
  doc.setFontSize(12);
  doc.text(studentIdBadge || 'TFS-STUDENT', pageWidth - 52, 40, { align: 'center' });

  // Divider Line
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(1);
  doc.line(17, 55, pageWidth - 17, 55);

  // Left Column: Photo & Scholar Emblem
  doc.setFillColor(20, 23, 30);
  doc.roundedRect(26, 65, 65, 80, 4, 4, 'F');
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(1.2);
  doc.roundedRect(26, 65, 65, 80, 4, 4, 'S');

  if (avatarData) {
    try {
      doc.addImage(avatarData, 'JPEG', 28, 67, 61, 76);
    } catch {
      drawFallbackAvatar();
    }
  } else {
    drawFallbackAvatar();
  }

  function drawFallbackAvatar() {
    doc.setFillColor(30, 35, 45);
    doc.circle(58.5, 97, 22, 'F');
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(0.8);
    doc.circle(58.5, 97, 22, 'S');

    doc.setTextColor(212, 175, 55);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.text('TFS', 58.5, 100, { align: 'center' });

    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text('ACCREDITED SCHOLAR', 58.5, 131, { align: 'center' });

    doc.setFontSize(8);
    doc.setTextColor(175, 175, 175);
    doc.text('SESSION 2026 – 2027', 58.5, 138, { align: 'center' });
  }

  // Right Column: Student Details
  const startX = 104;
  let curY = 71;

  const addField = (label: string, value: string, isGold = false) => {
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(label.toUpperCase(), startX, curY);

    if (isGold) {
      doc.setTextColor(212, 175, 55);
    } else {
      doc.setTextColor(250, 250, 250);
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(value || '—', startX, curY + 5.5);

    // subtle underline
    doc.setDrawColor(40, 45, 55);
    doc.setLineWidth(0.3);
    doc.line(startX, curY + 8.5, pageWidth - 26, curY + 8.5);

    curY += 15.5;
  };

  addField('Full Student Name', displayName);
  addField('Curriculum / Track', student?.curriculum || 'Guitar', true);
  addField(
    'Enrolled Tuition Plan',
    feeSummary
      ? `${feeSummary.basePlanName} — Rs. ${feeSummary.totalAmount}/mo`
      : student?.class_schedule || 'Active Tuition Plan'
  );
  addField('Assigned Batch Schedule', student?.preferred_schedule || 'Weekend / Scheduled Window');
  addField('Scholar Contact / Email', `${student?.email || 'Scholar'}  ${student?.phone_number ? '• ' + student.phone_number : ''}`);

  // Bottom Footer Bar
  doc.setFillColor(20, 22, 28);
  doc.rect(17, pageHeight - 44, pageWidth - 34, 27, 'F');
  doc.setDrawColor(80, 68, 35);
  doc.setLineWidth(0.5);
  doc.line(17, pageHeight - 44, pageWidth - 17, pageHeight - 44);

  doc.setTextColor(160, 160, 160);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const issueDate = student?.created_at
    ? new Date(student.created_at).toLocaleDateString('en-IN')
    : new Date().toLocaleDateString('en-IN');
  doc.text(
    `Date of Enrollment: ${issueDate}   •   Valid for Academic Year 2026-2027   •   Status: ${student?.status?.toUpperCase() || 'ACTIVE'}`,
    24,
    pageHeight - 31
  );
  doc.text(
    'Issued by The Fretboard Society Academy • Kolkata, India • Inquiries: codr.sankha.contact@gmail.com',
    24,
    pageHeight - 25
  );

  // Dedicated Director Signature & Verified Authentication Stamp
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.8);
  doc.roundedRect(pageWidth - 88, pageHeight - 42, 69, 23, 2, 2, 'S');

  if (signData) {
    try {
      doc.addImage(signData, 'PNG', pageWidth - 76, pageHeight - 41, 44, 11);
    } catch {}
  }

  // Signature Subtext
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.3);
  doc.line(pageWidth - 84, pageHeight - 29, pageWidth - 23, pageHeight - 29);

  doc.setTextColor(212, 175, 55);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('Sankha Subhra Ghosh', pageWidth - 53.5, pageHeight - 26, { align: 'center' });

  doc.setFontSize(6.5);
  doc.setTextColor(175, 175, 175);
  doc.text('Founder & Lead Instructor • TFS', pageWidth - 53.5, pageHeight - 23, { align: 'center' });

  doc.setFontSize(5.5);
  doc.setTextColor(93, 211, 122);
  doc.text('OFFICIALLY VERIFIED SIGNATURE', pageWidth - 53.5, pageHeight - 20.2, { align: 'center' });

  // Save the PDF
  const cleanName = displayName.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_') || 'Student';
  doc.save(`TFS-ID-Card-${cleanName}.pdf`);
}

export async function generateFeeReceiptPdf(payment: FeePaymentRecord): Promise<void> {
  const doc = new jsPDF({
    unit: 'mm',
    format: 'a4',
  });

  const width = doc.internal.pageSize.getWidth(); // 210mm
  const height = doc.internal.pageSize.getHeight(); // 297mm

  const gold: [number, number, number] = [212, 175, 55];
  const cream: [number, number, number] = [248, 245, 237];
  const muted: [number, number, number] = [160, 160, 160];

  // Background
  doc.setFillColor(10, 12, 16);
  doc.rect(0, 0, width, height, 'F');

  // Gold borders
  doc.setDrawColor(...gold);
  doc.setLineWidth(1.5);
  doc.rect(10, 10, width - 20, height - 20);

  doc.setDrawColor(80, 68, 35);
  doc.setLineWidth(0.5);
  doc.rect(14, 14, width - 28, height - 28);

  // Header Title
  doc.setTextColor(...gold);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('THE FRETBOARD SOCIETY', 20, 30);

  doc.setTextColor(...muted);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('TUITION & MASTERCLASS FEE RECEIPT', 20, 37);

  doc.setDrawColor(...gold);
  doc.setLineWidth(0.8);
  doc.line(20, 44, width - 20, 44);

  // Metadata
  doc.setTextColor(...cream);
  doc.setFont('courier', 'normal');
  doc.setFontSize(10);
  const formattedDate = payment.timestamp
    ? new Date(payment.timestamp).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN');
  doc.text(`Receipt Date: ${formattedDate}`, 20, 55);
  doc.text(`Payment Reference: ${payment.payment_reference || payment.id}`, 20, 62);
  doc.text(`Transaction / UTR: ${payment.utr || 'Direct Portal Recording'}`, 20, 69);

  // Status Badge
  const isVerified = payment.payment_status === 'VERIFIED';
  doc.setFillColor(isVerified ? 40 : 212, isVerified ? 167 : 175, isVerified ? 69 : 55);
  doc.roundedRect(width - 70, 52, 50, 10, 2, 2, 'F');
  doc.setTextColor(isVerified ? 255 : 0, isVerified ? 255 : 0, isVerified ? 255 : 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(payment.payment_status || 'PENDING VERIFICATION', width - 45, 58.5, { align: 'center' });

  // Section Header: Student Details
  doc.setTextColor(...gold);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('STUDENT & ENROLLMENT PARTICULARS', 20, 85);
  doc.setDrawColor(80, 68, 35);
  doc.line(20, 89, width - 20, 89);

  const particulars: [string, string][] = [
    ['Student Name', payment.student_name || 'Enrolled Student'],
    ['Student Email', payment.student_email || '—'],
    ['Contact Phone', payment.phone || '—'],
    ['Curriculum Track', payment.curriculum || 'Guitar'],
    ['Tuition Plan / Class Format', payment.class_type || 'Monthly Tuition Plan'],
    ['Add-On Electives', payment.addons || 'None'],
    ['Payer / Depositor Name', payment.payer_name || payment.student_name || 'Student'],
    ['Administrator / Faculty Note', payment.notes || 'Official tuition payment recording'],
  ];

  let curY = 98;
  doc.setFont('helvetica', 'normal');
  particulars.forEach(([label, value]) => {
    doc.setTextColor(...muted);
    doc.setFontSize(9.5);
    doc.text(label, 22, curY);

    doc.setTextColor(...cream);
    doc.setFontSize(10);
    doc.text(value, 85, curY);
    curY += 8.5;
  });

  // Section Header: Payment Breakup
  curY += 8;
  doc.setTextColor(...gold);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('TUITION & FEE STATEMENT', 20, curY);
  doc.setDrawColor(80, 68, 35);
  doc.line(20, curY + 4, width - 20, curY + 4);

  curY += 14;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...muted);
  doc.text('Item Description', 22, curY);
  doc.text('Amount (INR)', width - 22, curY, { align: 'right' });

  curY += 6;
  doc.setDrawColor(50, 50, 50);
  doc.line(20, curY, width - 20, curY);

  curY += 9;
  doc.setTextColor(...cream);
  doc.setFontSize(10.5);
  doc.text(`Tuition Fee — ${payment.curriculum} (${payment.class_type})`, 22, curY);
  doc.text(`Rs. ${payment.amount.toLocaleString('en-IN')}`, width - 22, curY, { align: 'right' });

  curY += 12;
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.8);
  doc.line(20, curY, width - 20, curY);

  curY += 10;
  doc.setTextColor(...gold);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.text('TOTAL AMOUNT PAID', 22, curY);
  doc.text(`Rs. ${payment.amount.toLocaleString('en-IN')}`, width - 22, curY, { align: 'right' });

  // Footer notes & signature
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...muted);
  doc.text(
    'This is a computer-generated digital payment receipt issued by The Fretboard Society Academy.',
    20,
    height - 35
  );
  doc.text(
    'Payments are subject to reconciliation against official bank and UPI statements.',
    20,
    height - 30
  );

  doc.setDrawColor(...gold);
  doc.line(width - 70, height - 32, width - 20, height - 32);
  doc.setTextColor(...cream);
  doc.setFontSize(9);
  doc.text('Authorised Signatory', width - 45, height - 26, { align: 'center' });

  const cleanRef = (payment.payment_reference || payment.id).replace(/[^\w-]/g, '');
  doc.save(`TFS-Receipt-${cleanRef}.pdf`);
}
